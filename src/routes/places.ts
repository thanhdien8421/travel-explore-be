import express from "express";
import type { Request, Response } from "express";
import { getFeaturedPlaces, getPlaceBySlug, getAllPlaces } from "../services/placeService.js";

const router = express.Router();

/**
 * @swagger
 * /api/places:
 *   get:
 *     summary: Get list of places
 *     description: Get all places or featured places based on query parameters
 *     tags: [Places]
 *     parameters:
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter for featured places only
 *         example: true
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of places to return
 *         example: 8
 *     responses:
 *       200:
 *         description: List of places
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PlaceSummary'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const featured = req.query.featured === "true";
    const limit = parseInt(req.query.limit as string) || 10;

    if (featured) {
      const places = await getFeaturedPlaces(limit);
      return res.status(200).json(places);
    } else {
      const places = await getAllPlaces(limit);
      return res.status(200).json(places);
    }
    // return res.status(400).json({ message: "Invalid query or unsupported endpoint." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/places/{slug}:
 *   get:
 *     summary: Get place details by slug
 *     description: Retrieve detailed information about a specific place
 *     tags: [Places]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Place slug (URL-friendly identifier)
 *         example: cho-ben-thanh
 *     responses:
 *       200:
 *         description: Place details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlaceDetail'
 *       400:
 *         description: Bad request - slug is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Place not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ error: "Slug is required" });
    }
    const place = await getPlaceBySlug(slug);

    if (!place) return res.status(404).json({ message: "Place not found" });

    res.status(200).json(place);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
