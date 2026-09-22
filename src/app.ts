import express from "express";
import cors from "cors";
import type { CorsOptions } from "cors";
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
import { errorHandler } from "./middleware/errorHandler.js";
import { swaggerSpec } from "./config/swagger.js";

// Load environment variables from .env outside production.
// On Vercel (NODE_ENV=production) configuration is injected by Project Settings,
// so dotenv is intentionally skipped there.
if (process.env.NODE_ENV !== "production") {
  await import("dotenv").then((dotenv) => dotenv.config());
}

const app = express();

// Behind the Vercel / container proxy the real client IP arrives via X-Forwarded-*.
app.set("trust proxy", 1);

/* -------------------------------------------------------------------------- */
/*                                    CORS                                    */
/* -------------------------------------------------------------------------- */

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

// FRONTEND_URL may contain a comma separated list and `*` wildcards, e.g.
//   FRONTEND_URL="https://travel-explore-fe.vercel.app,https://*.example.com"
const configuredOrigins = (process.env.FRONTEND_URL ?? "")
  .split(",")
  .map(normalizeOrigin)
  .filter((value) => value.length > 0);

const allowAllOrigins = configuredOrigins.includes("*");
const allowedOriginPatterns = configuredOrigins.filter((value) => value !== "*");

// Outside production also trust the usual local frontend dev servers so a FE on
// localhost is not blocked by a production FRONTEND_URL.
if (process.env.NODE_ENV !== "production") {
  for (const devOrigin of [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
  ]) {
    if (!allowedOriginPatterns.includes(devOrigin)) {
      allowedOriginPatterns.push(devOrigin);
    }
  }
}

const originMatchers = allowedOriginPatterns.map((pattern) => {
  if (!pattern.includes("*")) {
    return (origin: string) => origin === pattern;
  }
  const patternRegex = new RegExp(
    `^${pattern.split("*").map(escapeRegExp).join(".*")}$`
  );
  return (origin: string) => patternRegex.test(origin);
});

const isOriginAllowed = (origin: string): boolean => {
  // No allow-list configured -> reflect the request origin. A missing
  // FRONTEND_URL on the host must never silently take the API down, which was
  // the root cause of the "works in dev, blocked on Vercel" report.
  if (allowAllOrigins || allowedOriginPatterns.length === 0) {
    return true;
  }
  const normalizedOrigin = normalizeOrigin(origin);
  return originMatchers.some((matches) => matches(normalizedOrigin));
};

// Startup snapshot of what the running process actually resolved. Check this
// line in the deploy logs first when CORS misbehaves.
console.log(
  "[CORS] " +
    `NODE_ENV=${process.env.NODE_ENV ?? "(unset)"} ` +
    `FRONTEND_URL=${JSON.stringify(process.env.FRONTEND_URL ?? null)} ` +
    `allowList=[${allowedOriginPatterns.join(", ")}]` +
    (allowAllOrigins || allowedOriginPatterns.length === 0
      ? " (reflecting any origin)"
      : "")
);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // No Origin header (curl, Postman, mobile apps, same-origin) -> allow.
    if (!origin) {
      return callback(null, true);
    }
    const allowed = isOriginAllowed(origin);
    if (!allowed) {
      console.warn(
        `[CORS] blocked origin "${origin}". ` +
          `allowList=[${allowedOriginPatterns.join(", ")}]. ` +
          "Add the exact FE origin (no trailing slash) to FRONTEND_URL and redeploy."
      );
    }
    // Resolve with `false` instead of an Error: a rejected origin must not turn
    // the preflight into a 500 that is missing CORS headers entirely.
    return callback(null, allowed);
  },
  credentials: true,
  // `allowedHeaders` is intentionally left undefined so the browser's
  // Access-Control-Request-Headers value is reflected automatically.
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  optionsSuccessStatus: 204,
  maxAge: 86400, // cache preflight responses for 24h
};

// IMPORTANT: CORS is registered before every other middleware so preflight
// (OPTIONS) requests are answered before routing, auth, the 404 handler or the
// error handler ever run.
app.use(cors(corsOptions));

app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for Swagger UI
  })
);

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

export default app;
