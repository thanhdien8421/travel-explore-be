// src/services/travelPlanService.ts
import { prisma } from '../lib/prisma.js';

/**
 * Lấy tất cả plan của 1 user + kèm số lượng items
 */
export async function getUserPlans(userId: string) {
  const plans = await prisma.travelPlan.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { items: true },
      },
    },
  });

  return plans;
}

/**
 * Tạo plan mới cho user
 */
export async function createPlan(userId: string, name: string) {
  const plan = await prisma.travelPlan.create({
    data: {
      userId,
      name,
    },
  });

  return plan;
}

/**
 * Lấy chi tiết 1 plan (chỉ nếu thuộc về user đó)
 * Kèm danh sách items + thông tin place để vẽ map
 * Chỉ hiển thị places đã được duyệt (APPROVED)
 */
export async function getPlanDetail(userId: string, planId: string) {
  const plan = await prisma.travelPlan.findFirst({
    where: { id: planId, userId },
    include: {
      items: {
        orderBy: { order: 'asc' },
        where: {
          place: {
            isActive: true,
            status: 'APPROVED'
          }
        },
        include: {
          place: {
            select: {
              id: true,
              name: true,
              slug: true,
              ward: true,
              district: true,
              latitude: true,
              longitude: true,
              coverImageUrl: true,
              averageRating: true,
              images: {
                select: {
                  id: true,
                  imageUrl: true,
                  caption: true,
                  isCover: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return plan;
}

/**
 * Xóa toàn bộ plan (chỉ nếu thuộc về user đó)
 * Trả về true nếu xóa được, false nếu không tìm thấy / không thuộc user
 */
export async function deletePlan(userId: string, planId: string) {
  const result = await prisma.travelPlan.deleteMany({
    where: {
      id: planId,
      userId,
    },
  });

  return result.count > 0;
}

/**
 * Thêm place vào plan
 * - Kiểm tra ownership plan
 * - Kiểm tra place tồn tại
 * - Nếu đã tồn tại trong plan -> trả về bản ghi cũ, không tạo mới
 * - Nếu chưa tồn tại -> chèn với order = max(order) + 1
 */
export async function addPlaceToPlan(
  userId: string,
  planId: string,
  placeId: string,
) {
  // 1. Plan có thuộc user không?
  const plan = await prisma.travelPlan.findFirst({
    where: { id: planId, userId },
    select: { id: true },
  });

  if (!plan) {
    return { error: 'PLAN_NOT_FOUND' as const };
  }

  // 2. Place có tồn tại và đã được duyệt không?
  const place = await prisma.place.findFirst({
    where: { 
      id: placeId,
      isActive: true,
      status: 'APPROVED'
    },
    select: { id: true },
  });

  if (!place) {
    return { error: 'PLACE_NOT_FOUND' as const };
  }

  // 3. Đã có sẵn trong plan chưa?
  const existing = await prisma.travelPlanItem.findUnique({
    where: {
      planId_placeId: {
        planId,
        placeId,
      },
    },
    include: { place: true },
  });

  if (existing) {
    return { item: existing, created: false as const };
  }

  // 4. Tính order tiếp theo
  const agg = await prisma.travelPlanItem.aggregate({
    where: { planId },
    _max: { order: true },
  });

  const nextOrder = (agg._max.order ?? 0) + 1;

  const item = await prisma.travelPlanItem.create({
    data: {
      planId,
      placeId,
      order: nextOrder,
    },
    include: { place: true },
  });

  return { item, created: true as const };
}

/**
 * Xóa 1 place ra khỏi plan (nếu plan thuộc user đó)
 */
export async function removePlaceFromPlan(
  userId: string,
  planId: string,
  placeId: string,
) {
  // kiểm tra xem plan thuộc user không
  const plan = await prisma.travelPlan.findFirst({
    where: { id: planId, userId },
    select: { id: true },
  });

  if (!plan) {
    return { ok: false, reason: 'PLAN_NOT_FOUND' as const };
  }

  const result = await prisma.travelPlanItem.deleteMany({
    where: {
      planId,
      placeId,
    },
  });

  if (result.count === 0) {
    return { ok: false, reason: 'ITEM_NOT_FOUND' as const };
  }

  return { ok: true as const };
}
