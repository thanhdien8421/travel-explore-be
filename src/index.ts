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
 * Normalize an origin before comparing it with the configured allow-list.
 * Handles the differences that silently break CORS in real deployments:
 * - surrounding quotes: Azure App Service / Docker env vars do NOT strip them
 *   (unlike dotenv), so FRONTEND_URL="https://x.com" arrives with literal
 *   quotes and can never match the browser's Origin header
 * - trailing slashes, stray spaces, casing
 * - an explicitly written default port (https://x.com:443 == https://x.com)
 */
const normalizeOrigin = (value: string): string =>
  value
    .trim()
    .replace(/^["']+/, "")
    .replace(/["']+$/, "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/^(https:\/\/[^/]*?):443$/, "$1")
    .replace(/^(http:\/\/[^/]*?):80$/, "$1")
    .toLowerCase();

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * FRONTEND_URL accepts a comma-separated list of:
 * - an exact origin:  https://travel-explore-fe.vercel.app
 * - a "*" glob:       https://travel-explore-fe-*.vercel.app  (Vercel previews)
 * - "*" on its own:   allow every origin (escape hatch for debugging a deploy)
 */
const configuredOrigins: string[] = (process.env.FRONTEND_URL ?? "")
  .split(",")
  .map(normalizeOrigin)
  .filter((value) => value.length > 0);

const allowAllOrigins = configuredOrigins.includes("*");

const allowedOriginPatterns: string[] = configuredOrigins.filter(
  (value) => value !== "*"
);

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
    if (!allowedOriginPatterns.includes(devOrigin)) {
      allowedOriginPatterns.push(devOrigin);
    }
  }
}

const originMatchers: ((origin: string) => boolean)[] =
  allowedOriginPatterns.map((pattern) => {
    if (!pattern.includes("*")) {
      return (origin: string) => origin === pattern;
    }

    const patternRegex = new RegExp(
      `^${pattern.split("*").map(escapeRegExp).join(".*")}$`
    );

    return (origin: string) => patternRegex.test(origin);
  });

/**
 * Single source of truth for "is this browser origin allowed?".
 * Pass the raw `Origin` header value.
 */
const isOriginAllowed = (origin: string): boolean => {
  if (allowAllOrigins) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);
  return originMatchers.some((matches) => matches(normalizedOrigin));
};

// Startup snapshot of what the running process actually resolved. Check these
// lines in the deploy logs first when CORS misbehaves.
console.log(
  `[CORS] NODE_ENV=${process.env.NODE_ENV ?? "(unset)"} ` +
    `FRONTEND_URL=${JSON.stringify(process.env.FRONTEND_URL ?? null)} ` +
    `PORT=${process.env.PORT ?? "(unset)"} ` +
    `allowList=[${allowedOriginPatterns.join(", ")}]` +
    (allowAllOrigins ? " WILDCARD=* (all origins allowed)" : "")
);

if (allowAllOrigins) {
  console.warn(
    "[CORS] FRONTEND_URL contains '*' - every origin is accepted. Do not ship this to production with credentials enabled."
  );
} else if (allowedOriginPatterns.length === 0) {
  console.warn(
    "[CORS] No allowed origins configured. Every browser request will be rejected. " +
      "Set FRONTEND_URL to the exact FE origin, e.g. https://travel-explore-fe.vercel.app"
  );
}

// Logs the Origin the server really receives (including preflights), before the
// CORS middleware runs, so rejected requests are visible in the deploy logs.
app.use((req, _res, next) => {
  if (req.headers.origin) {
    console.log(
      `[CORS] ${req.method} ${req.originalUrl} origin=${req.headers.origin}`
    );
  }
  next();
});

/**
 * CORS diagnostics. Probe it with curl (a browser fetch is subject to CORS
 * itself, curl is not):
 *   curl -i "https://<be-host>/api/diagnostics/cors" -H "Origin: https://<fe-origin>"
 *
 * It is registered BEFORE the CORS middleware on purpose, so it always answers.
 * Reading the result tells you which layer is broken:
 *   - endpoint unreachable / 502 -> the app or the platform is down
 *   - originAllowed: false       -> Origin does not match FRONTEND_URL
 *   - originAllowed: true but the Access-Control-Allow-Origin header is missing
 *     in the response -> a proxy/platform layer is stripping CORS headers
 *     (on Azure App Service: the portal "CORS" blade does exactly this)
 */
app.get("/api/diagnostics/cors", (req, res) => {
  const rawOrigin = req.headers.origin;
  const normalizedRequestOrigin = rawOrigin ? normalizeOrigin(rawOrigin) : null;
  const originAllowed = !rawOrigin || isOriginAllowed(rawOrigin);

  if (rawOrigin && originAllowed) {
    // Reflect manually for this diagnostic route only, so you can confirm the
    // header the app set actually survives every hop to the client.
    res.setHeader("Access-Control-Allow-Origin", rawOrigin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }

  res.json({
    status: "success",
    data: {
      nodeEnv: process.env.NODE_ENV ?? null,
      port: process.env.PORT ?? null,
      frontendUrlRaw: process.env.FRONTEND_URL ?? null,
      allowedOriginPatterns,
      allowAllOrigins,
      requestOrigin: rawOrigin ?? null,
      requestOriginNormalized: normalizedRequestOrigin,
      originAllowed,
      responseAccessControlAllowOrigin:
        res.getHeader("Access-Control-Allow-Origin") ?? null,
      proxyHeaders: {
        host: req.headers.host ?? null,
        forwardedHost: req.headers["x-forwarded-host"] ?? null,
        forwardedProto: req.headers["x-forwarded-proto"] ?? null,
        forwardedFor: req.headers["x-forwarded-for"] ?? null,
      },
      timestamp: new Date().toISOString(),
    },
  });
});

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // No Origin header: curl, Postman, mobile apps, same-origin, server-to-server
    if (!origin) {
      return callback(null, true);
    }

    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }

    console.warn(
      `[CORS] blocked origin "${origin}". allowList=[${allowedOriginPatterns.join(
        ", "
      )}]${allowAllOrigins ? " (plus wildcard *)" : ""}. ` +
        "If this is your FE, add its exact origin (no trailing slash, no quotes) to FRONTEND_URL and redeploy."
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