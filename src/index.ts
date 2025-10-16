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
//import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import placeRoutes from "./routes/places.js";
import adminPlaceRoutes from "./routes/adminPlaceRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { swaggerSpec } from "./config/swagger.js";

// Load environment variables
dotenv.config();

const app = express();

// Security & CORS middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for Swagger UI
})); // Security headers
// app.use(cors({
//   origin: true
  
//   (origin, callback) => {
//     // Allowed origins
//     const allowedOrigins = [
//       /^http:\/\/localhost:3\d{3}$/,  // Any localhost:3xxx
//       "https://travel-explore.azurewebsites.net"
//     ];
    
//     // Check if origin is in environment variable
//     const envOrigin = process.env.FRONTEND_URL;
    
//     if (!origin) {
//       // Allow requests with no origin (like mobile apps, Postman)
//       callback(null, true);
//     } else if (envOrigin && origin === envOrigin) {
//       // Allow environment-specified origin
//       callback(null, true);
//     } else if (allowedOrigins.some(allowed => 
//       typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
//     )) {
//       // Allow predefined origins
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   }
//   ,
//   credentials: true,
// })); // Enable CORS for frontend

// Body parsing middleware
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
app.use("/api/places", placeRoutes);
app.use("/api/admin/places", adminPlaceRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`
🚀 Travel Explore API Server Started!
📍 Server running on: http://localhost:${port}
🏥 Health check: http://localhost:${port}/health
📚 API endpoints: http://localhost:${port}/api/places
📖 API Documentation: http://localhost:${port}/api-docs
  `);
});