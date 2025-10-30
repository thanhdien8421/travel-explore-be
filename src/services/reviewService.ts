import { prisma } from "../lib/prisma.js";

export const createReview = async (
  placeId: string,
  userId: string,
  rating: number,
  comment: string
) => {
  // Tạo review
  const review = await prisma.review.create({
    data: {
      placeId,
      userId,
      rating,
      comment,
    },
  });

  // Cập nhật average_rating của place
  const reviews = await prisma.review.findMany({
    where: { placeId },
    select: { rating: true },
  });

  const average =
    reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length;

  await prisma.place.update({
    where: { id: placeId },
    data: { averageRating: Number(average.toFixed(1)) },
  });

  return review;
};
