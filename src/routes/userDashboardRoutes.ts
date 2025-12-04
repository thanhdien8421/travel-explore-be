import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import bcrypt from "bcrypt";

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route PUT /api/users/profile
 * @desc Update user profile
 */
router.put("/profile", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { fullName } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { fullName },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({ message: "Cập nhật thông tin thành công", user: updatedUser });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/users/change-password
 * @desc Change user password
 */
router.put("/change-password", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/users/stats
 * @desc Get user statistics
 */
router.get("/stats", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [totalVisits, totalReviews, totalPlans, totalBookings] = await Promise.all([
      prisma.userVisit.count({ where: { userId } }),
      prisma.review.count({ where: { userId } }),
      prisma.travelPlan.count({ where: { userId } }),
      prisma.booking.count({ where: { userId } }),
    ]);

    res.json({
      totalVisits,
      totalReviews,
      totalPlans,
      totalBookings,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/users/reviews
 * @desc Get user's reviews
 */
router.get("/reviews", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const reviews = await prisma.review.findMany({
      where: { 
        userId,
        place: { isActive: true } // Only return reviews of active places
      },
      orderBy: { createdAt: "desc" },
      include: {
        place: {
          select: {
            id: true,
            name: true,
            slug: true,
            coverImageUrl: true,
          },
        },
      },
    });

    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

export default router;
