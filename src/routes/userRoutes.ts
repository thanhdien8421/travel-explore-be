import express from "express";
import type { Response } from "express";
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  createUserByAdmin,
  createPartnerFromLead,
  deleteUser,
  restoreUser,
  getUserStats,
} from "../services/userService.js";
import { authenticateToken, requireAdmin, type AuthRequest } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     description: Get all users with filtering and pagination
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, USER, PARTNER, CONTRIBUTOR]
 *         description: Filter by role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status (true/false)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [fullName, email, createdAt, role]
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
 *         description: List of users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get(
  "/admin/users",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { search, role, isActive, sortBy, sortOrder, limit, page } = req.query;

      const filters: any = {};

      if (search) {
        filters.search = String(search);
      }

      if (role && ["ADMIN", "USER", "PARTNER", "CONTRIBUTOR"].includes(String(role))) {
        filters.role = String(role) as any;
      }

      if (isActive !== undefined) {
        filters.isActive = String(isActive) === "true";
      }

      if (sortBy && ["fullName", "email", "createdAt", "role"].includes(String(sortBy))) {
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

      const result = await getAllUsers(filters);
      res.status(200).json(result);
    } catch (error) {
      console.error("Failed to get users:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @swagger
 * /api/admin/users/stats:
 *   get:
 *     summary: Get user statistics (Admin only)
 *     description: Get count of users by role
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get(
  "/admin/users/stats",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const stats = await getUserStats();
      res.status(200).json(stats);
    } catch (error) {
      console.error("Failed to get user stats:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     description: Get a specific user's details
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get(
  "/admin/users/:id",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const user = await getUserById(id);
      res.status(200).json(user);
    } catch (error: unknown) {
      console.error("Failed to get user:", error);
      if (error instanceof Error && error.message === "User not found") {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Create a new user (Admin only)
 *     description: Admin can create users with any role
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               fullName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, USER, PARTNER, CONTRIBUTOR]
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Missing required fields or user already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post(
  "/admin/users",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { email, password, fullName, role } = req.body;

      // Validate required fields
      if (!email || !password || !fullName || !role) {
        return res.status(400).json({
          message: "email, password, fullName, and role are required",
        });
      }

      // Validate role
      if (!["ADMIN", "USER", "PARTNER", "CONTRIBUTOR"].includes(role)) {
        return res.status(400).json({
          message: "Invalid role. Must be ADMIN, USER, PARTNER, or CONTRIBUTOR",
        });
      }

      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters",
        });
      }

      const user = await createUserByAdmin({ email, password, fullName, role });

      res.status(201).json({
        message: "User created successfully",
        user,
      });
    } catch (error: unknown) {
      console.error("Failed to create user:", error);
      if (error instanceof Error && error.message === "User with this email already exists") {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   patch:
 *     summary: Update user role (Admin only)
 *     description: Change a user's role
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, USER, PARTNER, CONTRIBUTOR]
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       400:
 *         description: Invalid role
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/admin/users/:id/role",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!id) {
        return res.status(400).json({ message: "User ID is required" });
      }

      if (!role || !["ADMIN", "USER", "PARTNER", "CONTRIBUTOR"].includes(role)) {
        return res.status(400).json({
          message: "Invalid role. Must be ADMIN, USER, PARTNER, or CONTRIBUTOR",
        });
      }

      // Prevent admin from demoting themselves
      if (id === req.user!.id && role !== "ADMIN") {
        return res.status(400).json({
          message: "You cannot change your own admin role",
        });
      }

      const user = await updateUserRole(id, role);

      res.status(200).json({
        message: "Role updated successfully",
        user,
      });
    } catch (error: unknown) {
      console.error("Failed to update user role:", error);
      if (error instanceof Error && (error as any).code === "P2025") {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @swagger
 * /api/admin/partners/{leadId}/create-account:
 *   post:
 *     summary: Create partner account from lead (Admin only)
 *     description: Convert a partner lead into a full partner account
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner Lead ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Password for the new account
 *     responses:
 *       201:
 *         description: Partner account created successfully
 *       400:
 *         description: Missing password or user already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Partner lead not found
 *       500:
 *         description: Server error
 */
router.post(
  "/admin/partners/:leadId/create-account",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { leadId } = req.params;
      const { password } = req.body;

      if (!leadId) {
        return res.status(400).json({ message: "Partner lead ID is required" });
      }

      if (!password || password.length < 6) {
        return res.status(400).json({
          message: "Password is required and must be at least 6 characters",
        });
      }

      const user = await createPartnerFromLead(leadId, password);

      res.status(201).json({
        message: "Partner account created successfully",
        user,
      });
    } catch (error: unknown) {
      console.error("Failed to create partner account:", error);
      if (error instanceof Error) {
        if (error.message === "Partner lead not found") {
          return res.status(404).json({ message: error.message });
        }
        if (error.message === "User with this email already exists") {
          return res.status(400).json({ message: error.message });
        }
      }
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     description: Soft delete (default) or hard delete a user account
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: permanent
 *         schema:
 *           type: boolean
 *           default: false
 *         description: If true, permanently delete user (hard delete)
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       400:
 *         description: Cannot delete yourself
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/admin/users/:id",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const permanent = req.query.permanent === "true";

      if (!id) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Prevent admin from deleting themselves
      if (id === req.user!.id) {
        return res.status(400).json({
          message: "You cannot delete your own account",
        });
      }

      await deleteUser(id, permanent);
      res.status(204).send();
    } catch (error: unknown) {
      console.error("Failed to delete user:", error);
      if (error instanceof Error && (error as any).code === "P2025") {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @swagger
 * /api/admin/users/{id}/restore:
 *   patch:
 *     summary: Restore a soft-deleted user (Admin only)
 *     description: Reactivate a user that was soft-deleted
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User restored successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/admin/users/:id/restore",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const user = await restoreUser(id);
      res.status(200).json({
        message: "User restored successfully",
        user,
      });
    } catch (error: unknown) {
      console.error("Failed to restore user:", error);
      if (error instanceof Error && (error as any).code === "P2025") {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
