import express from "express";
import type { Request, Response } from "express";
import { authenticateToken, type AuthRequest } from "../middleware/authMiddleware.js";
import { createClient } from "@supabase/supabase-js";

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
    console.log("Request headers:", req.headers);
    
    const supabaseClient = getSupabaseAdmin();
    const { fileName } = req.body;

    console.log("fileName:", fileName, "type:", typeof fileName);

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
    return res.json({
      signedUrl: data.signedUrl,
      fileName: fileName,
    });
  } catch (error) {
    console.error("❌ Error in signed-url endpoint:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
