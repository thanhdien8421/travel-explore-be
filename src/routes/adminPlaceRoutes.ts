import express from "express";
import type { Request, Response } from "express";
import { getAdminPlaces, createPlace } from "../services/adminPlaceService.js";

const router = express.Router();

/**
 * @swagger
 * /api/admin/places:
 *   get:
 *     summary: Get all places (Admin)
 *     description: Get all places with basic information for admin management
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of all places
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   name:
 *                     type: string
 *                   district:
 *                     type: string
 *                     nullable: true
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", async (_req: Request, res: Response) => {
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
 *     description: Create a new place with auto-generated slug and geocoding
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - addressText
 *             properties:
 *               name:
 *                 type: string
 *                 description: Place name
 *                 example: "Chợ Bến Thành"
 *               description:
 *                 type: string
 *                 description: Place description
 *               addressText:
 *                 type: string
 *                 description: Full address
 *                 example: "Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh"
 *               district:
 *                 type: string
 *                 description: District (auto-detected if not provided)
 *               city:
 *                 type: string
 *                 description: City name
 *               coverImageUrl:
 *                 type: string
 *                 format: uri
 *                 description: Cover image URL
 *               openingHours:
 *                 type: string
 *                 description: Opening hours
 *               priceInfo:
 *                 type: string
 *                 description: Price information
 *               contactInfo:
 *                 type: string
 *                 description: Contact information
 *               tipsNotes:
 *                 type: string
 *                 description: Tips and notes
 *               isFeatured:
 *                 type: boolean
 *                 description: Featured flag
 *                 default: false
 *     responses:
 *       201:
 *         description: Place created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlaceDetail'
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Conflict - place already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "A place with this name already exists."
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", async (req: Request, res: Response) => {
    const { name, addressText } = req.body;

    if (!name || !addressText) {
        return res.status(400).json({ message: "Name and addressText are required." });
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

export default router;
