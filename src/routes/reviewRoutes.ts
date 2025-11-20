import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import { createReview } from "../services/reviewService.js";

const router = express.Router();

/**
 * @swagger
 * /api/places/{placeId}/reviews:
 *   post:
 *     summary: Create a review for a place
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Place ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 nullable: true
 *                 description: Review comment
 *                 example: "Tuyệt vời! Nơi này quá đáng để ghé thăm"
 *             required:
 *               - rating
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post(
  "/:placeId/reviews",
  authenticateToken,
  async (req: AuthRequest, res) => {
    const { placeId } = req.params;
    const { rating, comment } = req.body;

    if (!rating)
      return res.status(400).json({ error: "Rating is required" });

    try {
        if (!placeId) {
            return res.status(400).json({ error: "placeId is required" });
        }

        const review = await createReview(placeId, req.user!.id, rating, comment);

        res.status(201).json(review);
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create review";
      res.status(500).json({ error: errorMessage });
    }
  }
);

export default router;
