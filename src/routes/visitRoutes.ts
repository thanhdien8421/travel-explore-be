import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import { addUserVisit, getUserVisits } from "../services/visitService.js";

const router = express.Router();

/**
 * @swagger
 * /api/me/visits:
 *   post:
 *     summary: Mark a place as visited
 *     tags: [Visits]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               placeId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the place to mark as visited
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *             required:
 *               - placeId
 *     responses:
 *       201:
 *         description: Place marked as visited successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "success"
 *       400:
 *         description: Validation error (placeId required)
 *       500:
 *         description: Server error
 */
router.post("/me/visits", 
  authenticateToken, 
  async (req: AuthRequest, res) => {
  const { placeId } = req.body;

  if (!placeId)
    return res.status(400).json({ error: "placeId is required" });

  try {
    await addUserVisit(req.user!.id, placeId);
    res.status(201).json({ message: "success" });
  } catch (error: unknown) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "Failed to record visit";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * @swagger
 * /api/me/visits:
 *   get:
 *     summary: Get user's visit history
 *     tags: [Visits]
 *     responses:
 *       200:
 *         description: List of visited places
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   place:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       coverImageUrl:
 *                         type: string
 *                         nullable: true
 *                   visitedAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Server error
 */
router.get("/me/visits", 
  authenticateToken, 
  async (req: AuthRequest, res) => {
  try {
    const visits = await getUserVisits(req.user!.id);
    res.status(200).json(visits);
  } catch (error: unknown) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get visits";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * @swagger
 * /api/me/visits/{placeId}:
 *   delete:
 *     summary: Remove a place from visit history
 *     tags: [Visits]
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Visit removed successfully
 *       404:
 *         description: Visit not found
 *       500:
 *         description: Server error
 */
router.delete("/me/visits/:placeId", 
  authenticateToken, 
  async (req: AuthRequest, res) => {
  const { placeId } = req.params;

  if (!placeId) {
    return res.status(400).json({ message: "placeId is required" });
  }

  try {
    const { prisma } = await import("../lib/prisma.js");
    
    const visit = await prisma.userVisit.findFirst({
      where: {
        userId: req.user!.id,
        placeId,
      },
    });

    if (!visit) {
      return res.status(404).json({ message: "Không tìm thấy lịch sử" });
    }

    await prisma.userVisit.delete({
      where: { id: visit.id },
    });

    res.json({ message: "Đã xóa khỏi lịch sử" });
  } catch (error: unknown) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "Failed to remove visit";
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
