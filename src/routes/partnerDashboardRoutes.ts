import express from "express";
import type { Response } from "express";
import { authenticateToken, type AuthRequest } from "../middleware/authMiddleware.js";
import { prisma } from "../lib/prisma.js";

const router = express.Router();

/**
 * Middleware to check if user is a Partner
 */
const requirePartner = (req: AuthRequest, res: Response, next: express.NextFunction) => {
  if (!req.user || (req.user.role !== "PARTNER" && req.user.role !== "ADMIN")) {
    return res.status(403).json({ message: "Partner access required" });
  }
  next();
};

/**
 * @swagger
 * /api/partner/stats:
 *   get:
 *     summary: Get partner dashboard statistics
 *     description: Get statistics for partner's places and bookings
 *     tags: [Partner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Partner statistics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Partner access required
 */
router.get(
  "/partner/stats",
  authenticateToken,
  requirePartner,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      // Get partner's places
      const places = await prisma.place.findMany({
        where: { createdById: userId },
        select: { id: true, status: true, isActive: true },
      });

      const placeIds = places.map((p) => p.id);

      // Get bookings for partner's places
      const bookings = await prisma.booking.findMany({
        where: { placeId: { in: placeIds } },
        select: { status: true },
      });

      // Calculate stats
      const stats = {
        totalPlaces: places.length,
        approvedPlaces: places.filter((p) => p.status === "APPROVED" && p.isActive).length,
        pendingPlaces: places.filter((p) => p.status === "PENDING").length,
        rejectedPlaces: places.filter((p) => p.status === "REJECTED").length,
        totalBookings: bookings.length,
        pendingBookings: bookings.filter((b) => b.status === "PENDING").length,
        confirmedBookings: bookings.filter((b) => b.status === "CONFIRMED").length,
        cancelledBookings: bookings.filter((b) => b.status === "CANCELLED").length,
      };

      res.status(200).json(stats);
    } catch (error) {
      console.error("Failed to get partner stats:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @swagger
 * /api/partner/places:
 *   get:
 *     summary: Get partner's places
 *     description: Get all places created by the partner
 *     tags: [Partner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Filter by place status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt]
 *         default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         default: desc
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 10
 *     responses:
 *       200:
 *         description: List of partner's places
 */
router.get(
  "/partner/places",
  authenticateToken,
  requirePartner,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const {
        status,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
        page = "1",
        limit = "10",
      } = req.query;

      const pageNum = Math.max(1, parseInt(String(page)));
      const limitNum = Math.min(50, Math.max(1, parseInt(String(limit))));
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where: any = {
        createdById: userId,
      };

      if (status && ["PENDING", "APPROVED", "REJECTED"].includes(String(status))) {
        where.status = String(status);
      }

      if (search) {
        where.name = { contains: String(search), mode: "insensitive" };
      }

      // Get total count
      const total = await prisma.place.count({ where });

      // Get places
      const places = await prisma.place.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          ward: true,
          district: true,
          coverImageUrl: true,
          status: true,
          isActive: true,
          isFeatured: true,
          averageRating: true,
          createdAt: true,
          categories: {
            select: {
              category: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          images: {
            select: {
              id: true,
              imageUrl: true,
              isCover: true,
            },
          },
          _count: {
            select: { bookings: true, reviews: true },
          },
        },
        orderBy: {
          [String(sortBy) === "name" ? "name" : "createdAt"]:
            String(sortOrder) === "asc" ? "asc" : "desc",
        },
        skip,
        take: limitNum,
      });

      // Transform data
      const transformedPlaces = places.map((place) => ({
        ...place,
        categories: place.categories.map((pc) => pc.category),
        images: place.images.map((img) => ({
          id: img.id,
          image_url: img.imageUrl,
          is_cover: img.isCover,
        })),
        bookingsCount: place._count.bookings,
        reviewsCount: place._count.reviews,
        _count: undefined,
      }));

      res.status(200).json({
        data: transformedPlaces,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error("Failed to get partner places:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @swagger
 * /api/partner/bookings:
 *   get:
 *     summary: Get bookings for partner's places
 *     description: Get all bookings for places owned by the partner
 *     tags: [Partner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED]
 *       - in: query
 *         name: placeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [bookingDate, createdAt]
 *         default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         default: desc
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 10
 *     responses:
 *       200:
 *         description: List of bookings
 */
router.get(
  "/partner/bookings",
  authenticateToken,
  requirePartner,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const {
        status,
        placeId,
        sortBy = "createdAt",
        sortOrder = "desc",
        page = "1",
        limit = "10",
      } = req.query;

      const pageNum = Math.max(1, parseInt(String(page)));
      const limitNum = Math.min(50, Math.max(1, parseInt(String(limit))));
      const skip = (pageNum - 1) * limitNum;

      // Get partner's place IDs
      const partnerPlaces = await prisma.place.findMany({
        where: { createdById: userId },
        select: { id: true },
      });
      const partnerPlaceIds = partnerPlaces.map((p) => p.id);

      if (partnerPlaceIds.length === 0) {
        return res.status(200).json({
          data: [],
          pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 },
        });
      }

      // Build where clause
      const where: any = {
        placeId: { in: partnerPlaceIds },
      };

      if (status && ["PENDING", "CONFIRMED", "CANCELLED"].includes(String(status))) {
        where.status = String(status);
      }

      if (placeId && partnerPlaceIds.includes(String(placeId))) {
        where.placeId = String(placeId);
      }

      // Get total count
      const total = await prisma.booking.count({ where });

      // Get bookings
      const bookings = await prisma.booking.findMany({
        where,
        select: {
          id: true,
          bookingDate: true,
          guestCount: true,
          note: true,
          status: true,
          createdAt: true,
          place: {
            select: { id: true, name: true, slug: true, coverImageUrl: true },
          },
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: {
          [String(sortBy) === "bookingDate" ? "bookingDate" : "createdAt"]:
            String(sortOrder) === "asc" ? "asc" : "desc",
        },
        skip,
        take: limitNum,
      });

      res.status(200).json({
        data: bookings,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error("Failed to get partner bookings:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @swagger
 * /api/partner/bookings/{id}/status:
 *   patch:
 *     summary: Update booking status
 *     description: Partner can confirm or cancel bookings for their places
 *     tags: [Partner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [CONFIRMED, CANCELLED]
 *     responses:
 *       200:
 *         description: Booking status updated
 *       403:
 *         description: Not authorized to update this booking
 *       404:
 *         description: Booking not found
 */
router.patch(
  "/partner/bookings/:id/status",
  authenticateToken,
  requirePartner,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const bookingId = req.params.id as string;
      const { status } = req.body;

      if (!bookingId) {
        return res.status(400).json({ message: "Booking ID is required" });
      }

      if (!status || !["CONFIRMED", "CANCELLED"].includes(status)) {
        return res.status(400).json({
          message: "Status must be CONFIRMED or CANCELLED",
        });
      }

      // Verify booking belongs to partner's place
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          place: { select: { createdById: true } },
        },
      });

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.place.createdById !== userId && req.user!.role !== "ADMIN") {
        return res.status(403).json({
          message: "Not authorized to update this booking",
        });
      }

      // Update booking status
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status },
        include: {
          place: { select: { id: true, name: true } },
          user: { select: { id: true, fullName: true, email: true } },
        },
      });

      res.status(200).json({
        message: `Booking ${status.toLowerCase()} successfully`,
        booking: updatedBooking,
      });
    } catch (error) {
      console.error("Failed to update booking status:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
