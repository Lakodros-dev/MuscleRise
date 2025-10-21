import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { authRouter } from "./routes/auth";
import { adminRouter } from "./routes/admin";
import { initDatabase } from "./services/database";

export async function createServer() {
  // Initialize database connection
  await initDatabase();

  const app = express();

  // Middleware - CORS with security
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:8080"];
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Add logging for debugging
  app.use((req, res, next) => {
    console.log(`Received ${req.method} request for ${req.url}`);
    next();
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Test route to verify API is working
  app.get("/api/test", (_req, res) => {
    res.json({ message: "API is working correctly" });
  });

  app.get("/api/demo", handleDemo);
  // auth routes (simple JSON file-backed)
  app.use("/api", authRouter);
  // admin routes
  app.use("/api", adminRouter);

  // 404 handler for API routes
  app.use("/api", (req, res, next) => {
    // Only handle if no other route matched
    if (!res.headersSent) {
      console.log(`404 - Route not found: ${req.method} ${req.url}`);
      res.status(404).json({ error: "Route not found" });
    } else {
      next();
    }
  });

  return app;
}