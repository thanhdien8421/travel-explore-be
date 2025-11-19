import express from "express";
import type { Request, Response } from "express";
import { getAdminPlaces, createPlace, updatePlace, deletePlace } from "../services/adminPlaceService.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/admin/places:
 *   get:
 *     summary: Get all places (Admin)
 *     description: Get all places with basic information for admin management
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all places
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/", authenticateToken, async (_req: Request, res: Response) => {
    try {
        const places = await getAdminPlaces();
        res.status(200).json(places);
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
 *         description: Unauthorized
 *       409:
 *         description: Place already exists
 *       500:
 *         description: Server error
 */
router.post("/", authenticateToken, async (req: Request, res: Response) => {
    const { name, ward } = req.body;

    if (!name || !ward) {
        return res.status(400).json({ message: "Name and ward are required." });
    }

    try {
        const newPlace = await createPlace(req.body);
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
 *         description: Unauthorized
 *       404:
 *         description: Place not found
 *       500:
 *         description: Server error
 */
router.put("/:id", authenticateToken, async (req: Request, res: Response) => {
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
 *     summary: Delete a place (Soft delete - Admin)
 *     description: Soft delete a place (marks as inactive, doesn't remove from database)
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
 *       204:
 *         description: Place deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Place not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", authenticateToken, async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "Place ID is required." });
    }

    try {
        await deletePlace(id);
        res.status(204).send();
    } catch (error: unknown) {
        console.error("Failed to delete place:", error);
        if (error instanceof Error && (error as any).code === 'P2025') {
            return res.status(404).json({ message: 'Place not found.' });
        }
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
