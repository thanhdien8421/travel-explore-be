import { Router } from "express";
import type { Response } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import type { AuthRequest } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * Middleware to check if user is CONTRIBUTOR or ADMIN
 */
const requireContributor = (
  req: AuthRequest,
  res: Response,
  next: () => void
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized: User not found" });
  }

  if (req.user.role !== "CONTRIBUTOR" && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden: Contributor access required" });
  }

  next();
};

/**
 * @swagger
 * /contributor/stats:
 *   get:
 *     summary: Get contributor dashboard statistics
 *     tags: [Contributor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contributor statistics
 */
router.get(
  "/contributor/stats",
  authenticateToken,
  requireContributor,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      // Count places created by this contributor
      const [totalPlaces, approvedPlaces, pendingPlaces, rejectedPlaces, totalReviews] = await Promise.all([
        prisma.place.count({
          where: { createdById: userId },
        }),
        prisma.place.count({
          where: { createdById: userId, status: "APPROVED" },
        }),
        prisma.place.count({
          where: { createdById: userId, status: "PENDING" },
        }),
        prisma.place.count({
          where: { createdById: userId, status: "REJECTED" },
        }),
        prisma.review.count({
          where: { userId },
        }),
      ]);

      res.status(200).json({
        totalPlaces,
        approvedPlaces,
        pendingPlaces,
        rejectedPlaces,
        totalReviews,
      });
    } catch (error) {
      console.error("Failed to fetch contributor stats:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @swagger
 * /contributor/places:
 *   get:
 *     summary: Get places created by the contributor
 *     tags: [Contributor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of contributor's places
 */
router.get(
  "/contributor/places",
  authenticateToken,
  requireContributor,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { search, status, page = "1", limit = "10" } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where: any = {
        createdById: userId,
      };

      if (search) {
        where.name = { contains: search as string, mode: "insensitive" };
      }

      if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status as string)) {
        where.status = status;
      }

      // Get places with counts
      const [places, total] = await Promise.all([
        prisma.place.findMany({
          where,
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            ward: true,
            district: true,
            coverImageUrl: true,
            status: true,
            isActive: true,
            isFeatured: true,
            averageRating: true,
            createdAt: true,
            categories: {
              select: {
                category: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
            images: {
              select: {
                id: true,
                imageUrl: true,
                isCover: true,
              },
            },
            _count: {
              select: {
                reviews: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limitNum,
        }),
        prisma.place.count({ where }),
      ]);

      // Transform data
      const transformedPlaces = places.map((place) => ({
        id: place.id,
        name: place.name,
        slug: place.slug,
        description: place.description,
        ward: place.ward,
        district: place.district,
        coverImageUrl: place.coverImageUrl,
        status: place.status,
        isActive: place.isActive,
        isFeatured: place.isFeatured,
        averageRating: place.averageRating?.toString() || "0",
        createdAt: place.createdAt.toISOString(),
        categories: place.categories.map((c: { category: { id: string; name: string; slug: string } }) => c.category),
        images: place.images.map((img: { id: string; imageUrl: string; isCover: boolean }) => ({
          id: img.id,
          image_url: img.imageUrl,
          is_cover: img.isCover,
        })),
        reviewsCount: place._count.reviews,
      }));

      res.status(200).json({
        data: transformedPlaces,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error("Failed to fetch contributor places:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @swagger
 * /contributor/places:
 *   post:
 *     summary: Create a new place (contributor submission)
 *     tags: [Contributor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - ward
 *               - categoryIds
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               streetAddress:
 *                 type: string
 *               ward:
 *                 type: string
 *               district:
 *                 type: string
 *               provinceCity:
 *                 type: string
 *               coverImageUrl:
 *                 type: string
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Place created successfully (pending approval)
 */
router.post(
  "/contributor/places",
  authenticateToken,
  requireContributor,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const {
        name,
        description,
        streetAddress,
        ward,
        district,
        provinceCity,
        locationDescription,
        coverImageUrl,
        latitude,
        longitude,
        categoryIds,
        openingHours,
        priceInfo,
        contactInfo,
        tipsNotes,
      } = req.body;

      // Validate required fields
      if (!name || !ward) {
        return res.status(400).json({
          message: "Name and ward are required",
        });
      }

      // Generate slug from name
      const baseSlug = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();

      // Check for slug uniqueness
      let slug = baseSlug;
      let counter = 1;
      while (await prisma.place.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Build create data
      const createData: any = {
        name,
        slug,
        description: description || null,
        streetAddress: streetAddress || null,
        ward,
        district: district || null,
        provinceCity: provinceCity || "Đà Nẵng",
        locationDescription: locationDescription || null,
        coverImageUrl: coverImageUrl || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        openingHours: openingHours || null,
        priceInfo: priceInfo || null,
        contactInfo: contactInfo || null,
        tipsNotes: tipsNotes || null,
        isFeatured: false,
        isActive: false, // Not active until approved
        status: "PENDING",
        createdById: userId,
      };

      // Add categories if provided
      if (categoryIds?.length) {
        createData.categories = {
          create: categoryIds.map((categoryId: string) => ({
            category: { connect: { id: categoryId } },
          })),
        };
      }

      // Create place with PENDING status
      const place = await prisma.place.create({
        data: createData,
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      });

      res.status(201).json({
        message: "Place submitted successfully. It will be reviewed by admin.",
        place: {
          id: place.id,
          name: place.name,
          slug: place.slug,
          status: place.status,
        },
      });
    } catch (error) {
      console.error("Failed to create place:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @swagger
 * /contributor/places/{id}:
 *   put:
 *     summary: Update contributor's own place (only if pending or rejected)
 *     tags: [Contributor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Place updated successfully
 */
router.put(
  "/contributor/places/:id",
  authenticateToken,
  requireContributor,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const placeId = req.params.id as string;

      // Check if place exists and belongs to contributor
      const existingPlace = await prisma.place.findUnique({
        where: { id: placeId },
      });

      if (!existingPlace) {
        return res.status(404).json({ message: "Place not found" });
      }

      if (existingPlace.createdById !== userId) {
        return res.status(403).json({ message: "Not authorized to update this place" });
      }

      // Only allow editing if PENDING or REJECTED
      if (existingPlace.status === "APPROVED") {
        return res.status(400).json({
          message: "Cannot edit approved places. Please contact admin for changes.",
        });
      }

      const {
        name,
        description,
        streetAddress,
        ward,
        district,
        provinceCity,
        locationDescription,
        coverImageUrl,
        latitude,
        longitude,
        categoryIds,
        openingHours,
        priceInfo,
        contactInfo,
        tipsNotes,
      } = req.body;

      // Build update data
      const updateData: any = {
        name: name || existingPlace.name,
        description: description !== undefined ? description : existingPlace.description,
        streetAddress: streetAddress !== undefined ? streetAddress : existingPlace.streetAddress,
        ward: ward || existingPlace.ward,
        district: district !== undefined ? district : existingPlace.district,
        provinceCity: provinceCity || existingPlace.provinceCity,
        locationDescription: locationDescription !== undefined ? locationDescription : existingPlace.locationDescription,
        coverImageUrl: coverImageUrl !== undefined ? coverImageUrl : existingPlace.coverImageUrl,
        latitude: latitude !== undefined ? (latitude ? parseFloat(latitude) : null) : existingPlace.latitude,
        longitude: longitude !== undefined ? (longitude ? parseFloat(longitude) : null) : existingPlace.longitude,
        openingHours: openingHours !== undefined ? openingHours : existingPlace.openingHours,
        priceInfo: priceInfo !== undefined ? priceInfo : existingPlace.priceInfo,
        contactInfo: contactInfo !== undefined ? contactInfo : existingPlace.contactInfo,
        tipsNotes: tipsNotes !== undefined ? tipsNotes : existingPlace.tipsNotes,
        // Reset to PENDING if was REJECTED and edited
        status: existingPlace.status === "REJECTED" ? "PENDING" : existingPlace.status,
      };

      // Add categories if provided
      if (categoryIds?.length) {
        updateData.categories = {
          deleteMany: {},
          create: categoryIds.map((categoryId: string) => ({
            category: { connect: { id: categoryId } },
          })),
        };
      }

      // Update place
      const updatedPlace = await prisma.place.update({
        where: { id: placeId },
        data: updateData,
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      });

      res.status(200).json({
        message: "Place updated successfully",
        place: updatedPlace,
      });
    } catch (error) {
      console.error("Failed to update place:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @swagger
 * /contributor/places/{id}:
 *   delete:
 *     summary: Delete contributor's own place (only if pending or rejected)
 *     tags: [Contributor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Place deleted successfully
 */
router.delete(
  "/contributor/places/:id",
  authenticateToken,
  requireContributor,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const placeId = req.params.id as string;

      // Check if place exists and belongs to contributor
      const existingPlace = await prisma.place.findUnique({
        where: { id: placeId },
      });

      if (!existingPlace) {
        return res.status(404).json({ message: "Place not found" });
      }

      if (existingPlace.createdById !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this place" });
      }

      // Only allow deleting if PENDING or REJECTED
      if (existingPlace.status === "APPROVED") {
        return res.status(400).json({
          message: "Cannot delete approved places. Please contact admin.",
        });
      }

      // Delete place and related records
      await prisma.$transaction([
        prisma.placeCategory.deleteMany({ where: { placeId } }),
        prisma.placeImage.deleteMany({ where: { placeId } }),
        prisma.place.delete({ where: { id: placeId } }),
      ]);

      res.status(200).json({ message: "Place deleted successfully" });
    } catch (error) {
      console.error("Failed to delete place:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
