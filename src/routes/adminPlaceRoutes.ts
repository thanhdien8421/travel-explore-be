import express from "express";
import type { Request, Response } from "express";
import { Prisma, PlaceStatus } from "@prisma/client";
import { getAdminPlaces, createPlace, updatePlace, deletePlace, restorePlace, approvePlace, rejectPlace, getPendingPlacesCount } from "../services/adminPlaceService.js";
import { authenticateToken, requireAdmin, type AuthRequest } from "../middleware/authMiddleware.js";
import { prisma } from "../lib/prisma.js";

const router = express.Router();

/**
 * @swagger
 * /api/admin/places/stats:
 *   get:
 *     summary: Get places statistics (Admin only)
 *     description: Get statistics for dashboard (total, average rating, featured count)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or description (optional)
 *     responses:
 *       200:
 *         description: Statistics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalLocations:
 *                   type: number
 *                 averageRating:
 *                   type: number
 *                 highQualityLocations:
 *                   type: number
 *                 ratedCount:
 *                   type: number
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin
 *       500:
 *         description: Server error
 */
router.get("/stats", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const search = (req.query.search as string) || "";

        console.time('getAdminStats-total');

        // Build where clause
        const where: Prisma.PlaceWhereInput = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }

        // Get all matching places for stats
        console.time('getAdminStats-findMany');
        const places = await prisma.place.findMany({
            where,
            select: {
                isFeatured: true,
                averageRating: true,
            },
        });
        console.timeEnd('getAdminStats-findMany');

        const totalLocations = places.length;
        const placesWithRatings = places.filter(p => Number(p.averageRating) > 0);
        const averageRating = placesWithRatings.length > 0
            ? (placesWithRatings.reduce((sum, p) => sum + Number(p.averageRating), 0) / placesWithRatings.length)
            : 0;
        const highQualityLocations = places.filter(p => p.isFeatured).length;

        console.timeEnd('getAdminStats-total');

        // Get pending places count
        const pendingCount = await getPendingPlacesCount();

        res.status(200).json({
            totalLocations,
            averageRating: Math.min(5, averageRating),
            highQualityLocations,
            ratedCount: placesWithRatings.length,
            pendingCount,
        });
    } catch (error: unknown) {
        console.error("Failed to get stats:", error);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * @swagger
 * /api/admin/places:
 *   get:
 *     summary: Get all places (Admin only)
 *     description: Get all places with filtering, searching, sorting, and pagination. Requires ADMIN role.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or description
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: ward
 *         schema:
 *           type: string
 *         description: Filter by ward
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, featured]
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of places with pagination metadata
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin
 *       500:
 *         description: Server error
 */
router.get("/", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const {
            search,
            category,
            ward,
            status,
            sortBy,
            sortOrder,
            limit,
            page,
        } = req.query;

        // Parse and validate query parameters
        const filters: {
            search?: string;
            category?: string;
            ward?: string;
            status?: PlaceStatus;
            sortBy?: "name" | "createdAt" | "featured";
            sortOrder?: "asc" | "desc";
            limit?: number;
            page?: number;
        } = {};

        if (search) filters.search = String(search);
        if (category) filters.category = String(category);
        if (ward) filters.ward = String(ward);
        if (status) {
            const statusStr = String(status).toUpperCase();
            if (Object.values(PlaceStatus).includes(statusStr as PlaceStatus)) {
                filters.status = statusStr as PlaceStatus;
            }
        }
        if (sortBy && ["name", "createdAt", "featured"].includes(String(sortBy))) {
            filters.sortBy = String(sortBy) as "name" | "createdAt" | "featured";
        }
        if (sortOrder && ["asc", "desc"].includes(String(sortOrder))) {
            filters.sortOrder = String(sortOrder) as "asc" | "desc";
        }
        if (limit) filters.limit = Math.max(1, Math.min(100, parseInt(String(limit), 10)));
        if (page) filters.page = Math.max(1, parseInt(String(page), 10));

        const result = await getAdminPlaces(filters);
        res.status(200).json(result);
    } catch (error) {
        console.error("Failed to get admin places:", error);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * @swagger
 * /api/admin/places:
 *   post:
 *     summary: Create a new place (Admin)
 *     description: Create a new place with structured address and categories
 *     tags: [Admin]
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
 *                 default: "TP. Hồ Chí Minh"
 *               locationDescription:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               coverImageUrl:
 *                 type: string
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               isFeatured:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Place created successfully
 *       400:
 *         description: Bad request - missing required fields
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin
 *       409:
 *         description: Place already exists
 *       500:
 *         description: Server error
 */
router.post("/", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    const { name, ward } = req.body;

    if (!name || !ward) {
        return res.status(400).json({ message: "Name and ward are required." });
    }

    try {
        // Admin creates place -> APPROVED status
        const newPlace = await createPlace({
            ...req.body,
            createdById: req.user?.id,
            isAdmin: true,
        });
        res.status(201).json(newPlace);
    } catch (error: unknown) {
        console.error("Failed to create place:", error);
        if (error instanceof Error && (error as any).code === 'P2002') {
            return res.status(409).json({ message: 'A place with this name already exists.' });
        }
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * @swagger
 * /api/admin/places/{id}:
 *   get:
 *     summary: Get a place by ID (Admin)
 *     description: Get detailed information about a specific place by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Place ID (UUID)
 *     responses:
 *       200:
 *         description: Place details
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: Place not found
 *       500:
 *         description: Server error
 */
router.get("/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "Place ID is required." });
    }

    try {
        const place = await prisma.place.findUniqueOrThrow({
            where: { id },
            include: {
                categories: {
                    include: {
                        category: true,
                    },
                },
                images: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        // Transform to match API response format
        const transformedPlace = {
            ...place,
            categories: place.categories.map(pc => ({
                id: pc.category.id,
                name: pc.category.name,
                slug: pc.category.slug,
            })),
            images: place.images.map(img => ({
                id: img.id,
                image_url: img.imageUrl,
                caption: img.caption,
                is_cover: img.isCover,
                created_at: img.createdAt,
            })),
        };

        res.status(200).json(transformedPlace);
    } catch (error: unknown) {
        console.error("Failed to get place:", error);
        if (error instanceof Error && (error as any).code === 'P2025') {
            return res.status(404).json({ message: 'Place not found.' });
        }
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * @swagger
 * /api/admin/places/{id}:
 *   put:
 *     summary: Update a place (Admin)
 *     description: Update place information with structured address
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Place ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *               locationDescription:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               coverImageUrl:
 *                 type: string
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               isFeatured:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Place updated successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: Place not found
 *       500:
 *         description: Server error
 */
router.put("/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "Place ID is required." });
    }

    try {
        const updatedPlace = await updatePlace(id, req.body);
        res.status(200).json(updatedPlace);
    } catch (error: unknown) {
        console.error("Failed to update place:", error);
        if (error instanceof Error && (error as any).code === 'P2025') {
            return res.status(404).json({ message: 'Place not found.' });
        }
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * @swagger
 * /api/admin/places/{id}:
 *   delete:
 *     summary: Delete a place (Admin)
 *     description: Soft delete (default) or hard delete a place
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Place ID (UUID)
 *       - in: query
 *         name: permanent
 *         schema:
 *           type: boolean
 *           default: false
 *         description: If true, permanently delete place (hard delete)
 *     responses:
 *       204:
 *         description: Place deleted successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: Place not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const permanent = req.query.permanent === "true";

    if (!id) {
        return res.status(400).json({ message: "Place ID is required." });
    }

    try {
        await deletePlace(id, permanent);
        res.status(204).send();
    } catch (error: unknown) {
        console.error("Failed to delete place:", error);
        if (error instanceof Error && (error as any).code === 'P2025') {
            return res.status(404).json({ message: 'Place not found.' });
        }
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * @swagger
 * /api/admin/places/{id}/restore:
 *   patch:
 *     summary: Restore a soft-deleted place (Admin)
 *     description: Reactivate a place that was soft-deleted
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Place ID (UUID)
 *     responses:
 *       200:
 *         description: Place restored successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: Place not found
 *       500:
 *         description: Server error
 */
router.patch("/:id/restore", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "Place ID is required." });
    }

    try {
        const place = await restorePlace(id);
        res.status(200).json({
            message: "Place restored successfully",
            place,
        });
    } catch (error: unknown) {
        console.error("Failed to restore place:", error);
        if (error instanceof Error && (error as any).code === 'P2025') {
            return res.status(404).json({ message: 'Place not found.' });
        }
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * @swagger
 * /api/admin/places/{id}/approve:
 *   patch:
 *     summary: Approve a pending place (Admin)
 *     description: Approve a place that is pending review
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Place ID (UUID)
 *     responses:
 *       200:
 *         description: Place approved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Place not found
 *       500:
 *         description: Server error
 */
router.patch("/:id/approve", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "Place ID is required." });
    }

    try {
        const approvedPlace = await approvePlace(id);
        res.status(200).json({ message: "Place approved successfully", place: approvedPlace });
    } catch (error: unknown) {
        console.error("Failed to approve place:", error);
        if (error instanceof Error && (error as any).code === 'P2025') {
            return res.status(404).json({ message: 'Place not found.' });
        }
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * @swagger
 * /api/admin/places/{id}/reject:
 *   patch:
 *     summary: Reject a pending place (Admin)
 *     description: Reject a place that is pending review
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Place ID (UUID)
 *     responses:
 *       200:
 *         description: Place rejected successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Place not found
 *       500:
 *         description: Server error
 */
router.patch("/:id/reject", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "Place ID is required." });
    }

    try {
        const rejectedPlace = await rejectPlace(id);
        res.status(200).json({ message: "Place rejected", place: rejectedPlace });
    } catch (error: unknown) {
        console.error("Failed to reject place:", error);
        if (error instanceof Error && (error as any).code === 'P2025') {
            return res.status(404).json({ message: 'Place not found.' });
        }
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * @swagger
 * /api/admin/places/{id}/summary:
 *   post:
 *     summary: Generate AI summary for a place (Admin)
 *     description: Generate a summary of user reviews using AI and save it to the place
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Place ID (UUID)
 *     responses:
 *       200:
 *         description: Summary generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 summary:
 *                   type: string
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: Place not found
 *       500:
 *         description: Server error
 */
router.post("/:id/summary", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "Place ID is required." });
    }

    try {
        // Import here to avoid circular dependency if any, though not strictly needed if structure is clean
        const { generateAndSaveSummary } = await import("../services/adminPlaceService.js");
        const updatedPlace = await generateAndSaveSummary(id);
        res.status(200).json({
            id: updatedPlace.id,
            summary: updatedPlace.summary
        });
    } catch (error: unknown) {
        console.error("Failed to generate summary:", error);
        if (error instanceof Error && error.message === "Place not found") {
            return res.status(404).json({ message: "Place not found" });
        }
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
