import app from "./app.js";
import { prisma } from "./lib/prisma.js";

const port = process.env.PORT || 8000;

// Async startup function
async function startServer() {
  try {
    // Connect to database FIRST
    await prisma.$connect();
    console.log("Database connected successfully");

    // THEN start the server
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
    console.error("Failed to connect to database:", error);
    console.error("Check your DATABASE_URL and Supabase connection");
    process.exit(1); // Exit if DB connection fails
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer();
