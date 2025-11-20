import express from "express";
import type { Request, Response } from "express";
import { getFeaturedPlaces, getPlaceBySlug, getAllPlaces, searchPlaces } from "../services/placeService.js";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

/**
 * @swagger
 * /api/places:
 *   get:
 *     summary: Get list of places with search and filter
 *     description: Get places with support for search, filtering by category/ward, and pagination
 *     tags: [Places]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search keyword (searches in name, description, and full address)
 *         example: chùa
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category (comma-separated slugs)
 *         example: "di-tich-lich-su,bao-tang-trien-lam"
 *       - in: query
 *         name: ward
 *         schema:
 *           type: string
 *         description: Filter by ward (phường/xã)
 *         example: "Phường Bến Thành"
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *         description: Filter by district (backward compatibility)
 *         example: "Quận 1"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name_asc, name_desc, rating_asc, rating_desc]
 *         description: Sort results
 *         example: rating_desc
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of places to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: List of places with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || "";
    const category = (req.query.category as string) || "";
    const ward = (req.query.ward as string) || "";
    const district = (req.query.district as string) || "";
    const sortBy = (req.query.sortBy as string) || "name_asc";
    const limit = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;
    const featured = req.query.featured === "true";

    // If featured flag is set, get featured places (backward compatibility)
    if (featured) {
      const places = await getFeaturedPlaces(limit);
      return res.status(200).json({
        data: places,
        pagination: {
          totalItems: places.length,
          totalPages: 1,
          currentPage: 1,
        },
      });
    }

    // Otherwise, use search with filters
    const result = await searchPlaces({
      q,
      category,
      ward,
      district,
      sortBy,
      limit,
      page,
    });

    res.status(200).json(result);
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
 *       404:
 *         description: Place not found
 *       500:
 *         description: Server error
 */
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ error: "Slug is required" });
    }
    
    // Extract userId from auth header if present
    const authHeader = req.headers.authorization;
    let userId: string | undefined;
    
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
        userId = decoded.id;
      } catch {
        // If token verification fails, continue without userId
      }
    }
    
    const place = await getPlaceBySlug(slug, userId);

    if (!place) return res.status(404).json({ message: "Place not found" });

    res.status(200).json(place);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
