/**
 * Travel Explore Backend API
 * 
 * Features implemented from various sources:
 * - CORS & Security: Helmet middleware pattern from quendp/g4-mini-project-2
 * - Error Handling: Centralized error handling from rameshraman86/travel-buddy
 * - Validation: Request validation patterns from shsarv/TravelYaari-react
 * - Service Layer: Business logic separation from all repositories
 * - Search & Filter: Inspired by XuanYing0915/KH_Travel_Project
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import placeRoutes from "./routes/placesRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import reviewRoute from "./routes/reviewRoutes.js";
import visitRoutes from "./routes/visitRoutes.js";
import adminPlaceRoutes from "./routes/adminPlaceRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import wardRoutes from "./routes/wardRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { errorHandler, AppError } from "./middleware/errorHandler.js";
import type { CorsOptions } from "cors";
import { swaggerSpec } from "./config/swagger.js";
import { prisma } from "./lib/prisma.js";

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  await import('dotenv').then((dotenv) => dotenv.config());
}

const app = express();

// Security & CORS middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for Swagger UI
}));  // Security headers

/**
 * Normalize an origin so trivial differences (trailing slash, casing, stray
 * spaces) cannot cause a false CORS rejection.
 */
const normalizeOrigin = (value: string): string =>
  value.trim().replace(/\/+$/, "").toLowerCase();

/**
 * Allowed browser origins (the `Origin` request header).
 * Supports a comma-separated list, e.g.
 * FRONTEND_URL="https://app.example.com,http://localhost:5173"
 */
const allowedOrigins: string[] = (process.env.FRONTEND_URL ?? "")
  .split(",")
  .map(normalizeOrigin)
  .filter((value) => value.length > 0);

// Outside production, also allow the usual local frontend dev servers so that
// FE running on localhost is not blocked by the production FRONTEND_URL.
if (process.env.NODE_ENV !== "production") {
  const devOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
  ];

  for (const devOrigin of devOrigins) {
    if (!allowedOrigins.includes(devOrigin)) {
      allowedOrigins.push(devOrigin);
    }
  }
}

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // No Origin header: curl, Postman, mobile apps, same-origin, server-to-server
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(normalizeOrigin(origin))) {
      return callback(null, true);
    }

    console.warn(
      `CORS: blocked request from origin "${origin}". Allowed origins: ${
        allowedOrigins.length > 0
          ? allowedOrigins.join(", ")
          : "(none configured - set FRONTEND_URL)"
      }`
    );

    // Reject with an explicit 403 instead of a bare Error (which was surfacing
    // as a 500 and hid the real cause in logs).
    return callback(new AppError(`Origin ${origin} is not allowed by CORS`, 403));
  },
  credentials: true,
  // Defaults are kept for methods/allowedHeaders so the browser's
  // Access-Control-Request-Headers is reflected automatically.
  maxAge: 86400, // cache preflight response for 24h
};

app.use(cors(corsOptions)); // Enable CORS for frontend

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Travel Explore API is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get("/health", (req, res) => {
  res.json({
    status: "success",
    message: "Travel Explore API is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/places", placeRoutes);
app.use("/api/places", reviewRoute);
app.use("/api", visitRoutes);
app.use("/api/admin/places", adminPlaceRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/wards", wardRoutes);
app.use("/api/upload", uploadRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// Error handling middleware
app.use(errorHandler);

const port = process.env.PORT || 8000;

// Async startup function
async function startServer() {
  try {
    //Connect to database FIRST
    await prisma.$connect();
    console.log('Database connected successfully');
    
    //THEN start the server
    app.listen(port, () => {
      console.log(`
Travel Explore API Server Started!
Server running on: http://localhost:${port}
Health check: http://localhost:${port}/health
API endpoints: http://localhost:${port}/api/places
API Documentation: http://localhost:${port}/api-docs
      `);
    });
  } catch (error) {
    console.error('Failed to connect to database:', error);
    console.error('Check your DATABASE_URL and Supabase connection');
    process.exit(1); // Exit if DB connection fails
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer();