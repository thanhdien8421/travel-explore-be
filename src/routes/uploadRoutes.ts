import express from "express";
import type { Request, Response } from "express";
import { authenticateToken, type AuthRequest } from "../middleware/authMiddleware.js";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "../lib/prisma.js";

const router = express.Router();

// Initialize Supabase Admin Client (uses service role key - bypasses RLS)
// Lazy initialization - only when needed
let supabase: any = null;

const getSupabaseAdmin = () => {
  if (supabase) return supabase;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabase;
};

const storageBucket = "images";

/**
 * @swagger
 * /api/upload/signed-url:
 *   post:
 *     summary: Get signed upload URL for image
 *     description: Generate a signed URL for uploading an image to Supabase Storage
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileName:
 *                 type: string
 *                 description: File name for the image (e.g., "slug-name.jpg")
 *             required:
 *               - fileName
 *           example:
 *             fileName: "dinh-doc-lap.jpg"
 *     responses:
 *       200:
 *         description: Signed URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 signedUrl:
 *                   type: string
 *                   description: Signed URL for uploading
 *                 fileName:
 *                   type: string
 *                   description: The file name
 *       400:
 *         description: Missing fileName
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/signed-url", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    console.log("📝 Signed URL request received");
    console.log("Request body:", req.body);
    
    const supabaseClient = getSupabaseAdmin();
    const { fileName, placeId, isCover, caption } = req.body;

    console.log("fileName:", fileName, "placeId:", placeId);

    if (!fileName || typeof fileName !== "string") {
      console.error("❌ Validation failed: fileName missing or not string");
      return res.status(400).json({ error: "fileName is required and must be a string" });
    }

    // Validate file name (prevent directory traversal)
    if (fileName.includes("/") || fileName.includes("\\")) {
      console.error("❌ Validation failed: invalid file name (contains / or \\)");
      return res.status(400).json({ error: "Invalid file name" });
    }

    console.log("✅ Validation passed, generating signed URL for:", fileName);

    // Generate signed URL valid for 1 hour (3600 seconds)
    const expiresIn = 3600; // 1 hour
    const { data, error } = await supabaseClient.storage
      .from(storageBucket)
      .createSignedUploadUrl(fileName);

    if (error) {
      console.error("❌ Error creating signed URL:", error);
      return res.status(500).json({ error: "Failed to generate signed URL" });
    }

    console.log("✅ Signed URL created successfully");

    // If placeId provided, save image record to database
    if (placeId && typeof placeId === 'string') {
      try {
        console.log("💾 Saving image record to database...");
        const placeImage = await prisma.placeImage.create({
          data: {
            placeId: placeId,
            imageUrl: fileName,
            isCover: isCover === true,
            caption: caption || undefined,
          },
        });
        console.log("✅ Image record saved:", placeImage.id);
      } catch (dbError) {
        console.error("⚠️  Warning: Failed to save image record, but upload proceeding:", dbError);
        // Don't fail the whole request if DB save fails - upload can still proceed
      }
    }

    return res.json({
      signedUrl: data.signedUrl,
      fileName: fileName,
    });
  } catch (error) {
    console.error("❌ Error in signed-url endpoint:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/upload/image/:imageId - Delete image from storage and database
router.delete("/image/:imageId", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { imageId } = req.params;

    if (!imageId) {
      return res.status(400).json({ error: "imageId is required" });
    }

    console.log("🗑️  Deleting image:", imageId);

    // Get image record from database
    const imageRecord = await prisma.placeImage.findUnique({
      where: { id: imageId },
    });

    if (!imageRecord) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Delete from Supabase Storage
    const supabaseClient = getSupabaseAdmin();
    const { error: storageError } = await supabaseClient.storage
      .from(storageBucket)
      .remove([imageRecord.imageUrl]);

    if (storageError) {
      console.warn("⚠️  Warning: Failed to delete from storage:", storageError);
      // Continue with DB deletion even if storage deletion fails
    } else {
      console.log("✅ Deleted from Supabase Storage:", imageRecord.imageUrl);
    }

    // Delete from database
    await prisma.placeImage.delete({
      where: { id: imageId },
    });

    console.log("✅ Deleted from database:", imageId);

    return res.json({ 
      message: "Image deleted successfully",
      imageId,
    });
  } catch (error) {
    console.error("❌ Error deleting image:", error);
    return res.status(500).json({ error: "Failed to delete image" });
  }
});

// PATCH /api/upload/image/:imageId - Update image metadata (cover flag, caption)
router.patch("/image/:imageId", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { imageId } = req.params;
    let { isCover, caption } = req.body;

    if (!imageId) {
      return res.status(400).json({ error: "imageId is required" });
    }

    console.log("✏️  Updating image:", imageId);
    console.log("Request body:", req.body);

    // Convert isCover to boolean if it's a string
    if (typeof isCover === 'string') {
      isCover = isCover === 'true';
    }

    // Verify image exists
    const existingImage = await prisma.placeImage.findUnique({
      where: { id: imageId },
    });

    if (!existingImage) {
      console.error("❌ Image not found:", imageId);
      return res.status(404).json({ error: "Image not found" });
    }

    // If setting this image as cover, we need to unset other covers for the same place
    if (isCover === true) {
      console.log("🔄 Setting as cover image, unsetting other covers for place:", existingImage.placeId);
      
      // Use a transaction to handle this atomically
      await prisma.$transaction(async (tx) => {
        // First, unset all covers for this place
        await tx.placeImage.updateMany({
          where: {
            placeId: existingImage.placeId,
            isCover: true,
          },
          data: {
            isCover: false,
          },
        });

        // Then set this image as cover
        await tx.placeImage.update({
          where: { id: imageId },
          data: {
            isCover: true,
            ...(caption !== undefined && { caption }),
          },
        });
      });

      console.log("✅ Image set as cover successfully:", imageId);

      return res.json({ 
        message: "Image updated successfully",
        image: {
          id: existingImage.id,
          image_url: existingImage.imageUrl,
          caption: caption !== undefined ? caption : existingImage.caption,
          is_cover: true,
        },
      });
    } else {
      // Just update the metadata without changing cover status
      const updateData: any = {};
      if (isCover !== undefined) {
        updateData.isCover = Boolean(isCover);
      }
      if (caption !== undefined) {
        updateData.caption = caption;
      }

      if (Object.keys(updateData).length === 0) {
        console.log("⚠️  No fields to update");
        return res.json({ 
          message: "No updates made",
          image: {
            id: existingImage.id,
            image_url: existingImage.imageUrl,
            caption: existingImage.caption,
            is_cover: existingImage.isCover,
          },
        });
      }

      const updatedImage = await prisma.placeImage.update({
        where: { id: imageId },
        data: updateData,
      });

      console.log("✅ Image updated successfully:", imageId);

      return res.json({ 
        message: "Image updated successfully",
        image: {
          id: updatedImage.id,
          image_url: updatedImage.imageUrl,
          caption: updatedImage.caption,
          is_cover: updatedImage.isCover,
        },
      });
    }
  } catch (error) {
    console.error("❌ Error updating image:", error);
    console.error("Full error object:", {
      message: (error as any).message,
      code: (error as any).code,
    });
    return res.status(500).json({ 
      error: "Failed to update image",
      details: (error as any).message,
    });
  }
});

export default router;

