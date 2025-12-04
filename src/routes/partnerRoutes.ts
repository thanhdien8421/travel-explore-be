import express from "express";
import type { Request, Response } from "express";
import {
  createPartnerLead,
  getAllPartnerLeads,
  getPartnerLeadById,
  deletePartnerLead,
} from "../services/partnerService.js";
import { authenticateToken, requireAdmin, type AuthRequest } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/partners/register:
 *   post:
 *     summary: Register as a partner (Public)
 *     description: Business owners can register interest in partnering with Travel Explore
 *     tags: [Partners]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessName
 *               - contactName
 *               - phone
 *               - email
 *             properties:
 *               businessName:
 *                 type: string
 *                 description: Name of the business/location
 *               contactName:
 *                 type: string
 *                 description: Contact person name
 *               phone:
 *                 type: string
 *                 description: Contact phone number
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact email address
 *     responses:
 *       201:
 *         description: Partner registration successful
 *       400:
 *         description: Missing required fields or invalid format
 *       500:
 *         description: Server error
 */
router.post("/partners/register", async (req: Request, res: Response) => {
  try {
    const { businessName, contactName, phone, email } = req.body;

    // Validate required fields
    if (!businessName || !contactName || !phone || !email) {
      return res.status(400).json({
        message: "businessName, contactName, phone, and email are required",
      });
    }

    // Validate field lengths
    if (businessName.length > 255 || contactName.length > 100) {
      return res.status(400).json({
        message: "Business name max 255 chars, contact name max 100 chars",
      });
    }

    const lead = await createPartnerLead({
      businessName,
      contactName,
      phone,
      email,
    });

    res.status(201).json({
      message: "Cảm ơn bạn! Chúng tôi sẽ liên hệ với bạn trong 24 giờ.",
      lead,
    });
  } catch (error: unknown) {
    console.error("Failed to create partner lead:", error);
    if (error instanceof Error) {
      if (error.message === "Invalid email format") {
        return res.status(400).json({ message: "Invalid email format" });
      }
      if (error.message === "Invalid phone format") {
        return res.status(400).json({ message: "Invalid phone format" });
      }
    }
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Admin routes
 */

/**
 * @swagger
 * /api/admin/partners:
 *   get:
 *     summary: Get all partner leads (Admin only)
 *     description: Get all registered partner leads with pagination
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [businessName, createdAt]
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
 *         description: List of partner leads
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get(
  "/admin/partners",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { sortBy, sortOrder, limit, page } = req.query;

      const filters: any = {};

      if (sortBy && ["businessName", "createdAt"].includes(String(sortBy))) {
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

      const result = await getAllPartnerLeads(filters);
      res.status(200).json(result);
    } catch (error) {
      console.error("Failed to get partner leads:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @swagger
 * /api/admin/partners/{id}:
 *   get:
 *     summary: Get a partner lead by ID (Admin)
 *     description: Get details of a specific partner lead
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner lead ID
 *     responses:
 *       200:
 *         description: Partner lead details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Partner lead not found
 *       500:
 *         description: Server error
 */
router.get(
  "/admin/partners/:id",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Partner lead ID is required" });
      }

      const lead = await getPartnerLeadById(id);
      res.status(200).json(lead);
    } catch (error: unknown) {
      console.error("Failed to get partner lead:", error);
      if (error instanceof Error && error.message === "Partner lead not found") {
        return res.status(404).json({ message: "Partner lead not found" });
      }
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @swagger
 * /api/admin/partners/{id}:
 *   delete:
 *     summary: Delete a partner lead (Admin)
 *     description: Remove a partner lead from the system
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner lead ID
 *     responses:
 *       204:
 *         description: Partner lead deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Partner lead not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/admin/partners/:id",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Partner lead ID is required" });
      }

      await deletePartnerLead(id);
      res.status(204).send();
    } catch (error: unknown) {
      console.error("Failed to delete partner lead:", error);
      if (error instanceof Error && (error as any).code === "P2025") {
        return res.status(404).json({ message: "Partner lead not found" });
      }
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
