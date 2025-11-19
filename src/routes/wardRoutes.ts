import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/wards:
 *   get:
 *     summary: Get all unique wards
 *     description: Retrieve a list of all unique wards/sub-districts from places for filtering
 *     tags: [Wards]
 *     responses:
 *       200:
 *         description: List of wards
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Server error
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const wards = await prisma.place.findMany({
      where: {
        isActive: true, // Only get wards from active places
      },
      select: {
        ward: true,
      },
      distinct: ['ward'],
      orderBy: {
        ward: 'asc',
      },
    });

    const wardList = wards
      .map((p) => p.ward)
      .filter((ward) => ward !== null && ward !== '');

    res.status(200).json({
      data: wardList,
    });
  } catch (error: unknown) {
    console.error('Failed to fetch wards:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
