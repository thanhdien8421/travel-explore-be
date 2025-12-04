import express from "express";
import type { Request, Response } from "express";
import {
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
  deleteBooking,
} from "../services/bookingService.js";
import { authenticateToken, requireAdmin, type AuthRequest } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     description: User creates a booking for a place
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - placeId
 *               - bookingDate
 *               - guestCount
 *             properties:
 *               placeId:
 *                 type: string
 *                 description: ID of the place to book
 *               bookingDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date of the booking
 *               guestCount:
 *                 type: integer
 *                 minimum: 1
 *                 description: Number of guests
 *               note:
 *                 type: string
 *                 description: Optional notes for the booking
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Place not found
 *       500:
 *         description: Server error
 */
router.post("/bookings", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { placeId, bookingDate, guestCount, note } = req.body;

    // Validate required fields
    if (!placeId || !bookingDate || !guestCount) {
      return res.status(400).json({
        message: "placeId, bookingDate, and guestCount are required",
      });
    }

    if (guestCount < 1) {
      return res.status(400).json({
        message: "guestCount must be at least 1",
      });
    }

    const booking = await createBooking({
      placeId,
      userId: req.user!.id,
      bookingDate,
      guestCount,
      note,
    });

    res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error: unknown) {
    console.error("Failed to create booking:", error);
    if (error instanceof Error && error.message === "Place not found") {
      return res.status(404).json({ message: "Place not found" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get user's bookings
 *     description: Get all bookings for the authenticated user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED]
 *         description: Filter by booking status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [date, createdAt]
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: List of user's bookings
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/bookings", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { status, sortBy, sortOrder, limit, page } = req.query;

    const filters: any = {
      userId: req.user!.id,
    };

    if (status && ["PENDING", "CONFIRMED", "CANCELLED"].includes(String(status))) {
      filters.status = String(status) as any;
    }

    if (sortBy && ["date", "createdAt"].includes(String(sortBy))) {
      filters.sortBy = String(sortBy) as any;
    }

    if (sortOrder && ["asc", "desc"].includes(String(sortOrder))) {
      filters.sortOrder = String(sortOrder) as any;
    }

    if (limit) {
      filters.limit = Math.min(parseInt(String(limit)), 50);
    }

    if (page) {
      filters.page = Math.max(1, parseInt(String(page)));
    }

    const result = await getUserBookings(req.user!.id, filters);
    res.status(200).json(result);
  } catch (error) {
    console.error("Failed to get bookings:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/bookings/{id}:
 *   delete:
 *     summary: Cancel a booking
 *     description: User can cancel their own booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       204:
 *         description: Booking cancelled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Cannot cancel other user's booking
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.delete("/bookings/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Booking ID is required" });
    }

    // Verify booking ownership
    const { prisma } = await import("../lib/prisma.js");
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.userId !== req.user!.id) {
      return res.status(403).json({
        message: "You can only cancel your own bookings",
      });
    }

    await deleteBooking(id);
    res.status(204).send();
  } catch (error) {
    console.error("Failed to cancel booking:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Admin routes
 */

/**
 * @swagger
 * /api/admin/bookings:
 *   get:
 *     summary: Get all bookings (Admin only)
 *     description: Get all bookings in the system with filtering and pagination
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED]
 *         description: Filter by booking status
 *       - in: query
 *         name: placeId
 *         schema:
 *           type: string
 *         description: Filter by place ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [date, createdAt]
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: List of all bookings
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get(
  "/admin/bookings",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { status, placeId, sortBy, sortOrder, limit, page } = req.query;

      const filters: any = {};

      if (status && ["PENDING", "CONFIRMED", "CANCELLED"].includes(String(status))) {
        filters.status = String(status) as any;
      }

      if (placeId) {
        filters.placeId = String(placeId);
      }

      if (sortBy && ["date", "createdAt"].includes(String(sortBy))) {
        filters.sortBy = String(sortBy) as any;
      }

      if (sortOrder && ["asc", "desc"].includes(String(sortOrder))) {
        filters.sortOrder = String(sortOrder) as any;
      }

      if (limit) {
        filters.limit = Math.min(parseInt(String(limit)), 100);
      }

      if (page) {
        filters.page = Math.max(1, parseInt(String(page)));
      }

      const result = await getAllBookings(filters);
      res.status(200).json(result);
    } catch (error) {
      console.error("Failed to get bookings:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @swagger
 * /api/admin/bookings/{id}/confirm:
 *   patch:
 *     summary: Confirm a booking (Admin)
 *     description: Admin can confirm a pending booking
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking confirmed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/admin/bookings/:id/confirm",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Booking ID is required" });
      }

      const booking = await updateBookingStatus(id, "CONFIRMED");
      res.status(200).json({
        message: "Booking confirmed successfully",
        booking,
      });
    } catch (error: unknown) {
      console.error("Failed to confirm booking:", error);
      if (error instanceof Error && (error as any).code === "P2025") {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @swagger
 * /api/admin/bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel a booking (Admin)
 *     description: Admin can cancel a booking
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/admin/bookings/:id/cancel",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Booking ID is required" });
      }

      const booking = await updateBookingStatus(id, "CANCELLED");
      res.status(200).json({
        message: "Booking cancelled successfully",
        booking,
      });
    } catch (error: unknown) {
      console.error("Failed to cancel booking:", error);
      if (error instanceof Error && (error as any).code === "P2025") {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
