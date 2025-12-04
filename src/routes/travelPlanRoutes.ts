// src/routes/travelPlanRoutes.ts
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

import {
  getUserPlans,
  createPlan,
  getPlanDetail,
  deletePlan,
  addPlaceToPlan,
  removePlaceFromPlan,
} from "../services/travelPlanService.js";

// Helper: lấy userId từ req (do authMiddleware gắn vào)
function getUserId(req: Request): string | undefined {
  const user = (req as any).user;
  return user?.id ?? undefined;
}

/**
 * GET /api/plans
 * -> Lấy danh sách plan của user hiện tại
 * Response: [{ id, name, item_count }]
 */
router.get(
  '/',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const plans = await getUserPlans(userId);

      const response = plans.map((p) => ({
        id: p.id,
        name: p.name,
        item_count: p._count.items,
        created_at: p.createdAt,
      }));

      res.json(response);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/plans
 * Body: { "name": "Chuyến đi Vũng Tàu" }
 */
router.post(
  '/',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const { name } = req.body as { name?: string };

      if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Name is required' });
      }

      const plan = await createPlan(userId, name.trim());

      res.status(201).json({
        id: plan.id,
        name: plan.name,
        created_at: plan.createdAt,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/plans/:id
 * -> Lấy chi tiết plan + items để FE vẽ map
 */
router.get(
  '/:id',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const id = req.params.id as string;

      const plan = await getPlanDetail(userId, id);

      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      const response = {
        id: plan.id,
        name: plan.name,
        items: plan.items.map((item) => {
          // Find cover image from images array
          const coverImage = item.place.images?.find((img: any) => img.isCover);
          const firstImage = item.place.images?.[0];
          const coverImageUrl = coverImage?.imageUrl || firstImage?.imageUrl || item.place.coverImageUrl;
          
          return {
            added_at: item.addedAt,
            order: item.order,
            place: {
              id: item.place.id,
              name: item.place.name,
              slug: item.place.slug,
              ward: item.place.ward,
              district: item.place.district,
              latitude: item.place.latitude,
              longitude: item.place.longitude,
              cover_image_url: coverImageUrl,
              average_rating: item.place.averageRating,
              images: item.place.images?.map((img: any) => ({
                id: img.id,
                image_url: img.imageUrl,
                caption: img.caption,
                is_cover: img.isCover,
              })),
            },
          };
        }),
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * DELETE /api/plans/:id
 * -> Xóa toàn bộ plan
 */
router.delete(
  '/:id',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const id = req.params.id as string;

      const ok = await deletePlan(userId, id);

      if (!ok) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/plans/:id/items
 * Body: { "placeId": "uuid-place-1" }
 * -> Thêm place vào plan
 */
router.post(
  '/:id/items',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const planId = req.params.id as string;
      const { placeId } = req.body as { placeId?: string };

      if (!placeId) {
        return res.status(400).json({ message: 'placeId is required' });
      }

      const result = await addPlaceToPlan(userId, planId, placeId);

      if ('error' in result) {
        if (result.error === 'PLAN_NOT_FOUND') {
          return res.status(404).json({ message: 'Plan not found' });
        }
        if (result.error === 'PLACE_NOT_FOUND') {
          return res.status(404).json({ message: 'Place not found' });
        }
      }

      const { item, created } = result;

      res.status(created ? 201 : 200).json({
        created,
        item: {
          plan_id: item.planId,
          place_id: item.placeId,
          order: item.order,
          added_at: item.addedAt,
          place: item.place ? {
            id: item.place.id,
            name: item.place.name,
            slug: item.place.slug,
            ward: item.place.ward,
            latitude: item.place.latitude,
            longitude: item.place.longitude,
            cover_image_url: item.place.coverImageUrl,
          } : undefined,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * DELETE /api/plans/:id/items/:placeId
 * -> Xóa 1 địa điểm khỏi plan
 */
router.delete(
  '/:id/items/:placeId',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const planId = req.params.id as string;
      const placeId = req.params.placeId as string;

      const result = await removePlaceFromPlan(userId, planId, placeId);

      if (!result.ok) {
        if (result.reason === 'PLAN_NOT_FOUND') {
          return res.status(404).json({ message: 'Plan not found' });
        }
        if (result.reason === 'ITEM_NOT_FOUND') {
          return res.status(404).json({ message: 'Item not found in plan' });
        }
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

export default router;
