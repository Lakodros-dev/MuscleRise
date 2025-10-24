import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { handleDemo } from "./routes/demo";
import { authRouter } from "./routes/auth";
import { adminRouter } from "./routes/admin";
import { workoutRouter } from "./routes/workouts";
import { initDatabase } from "./services/database";

export async function createServer() {
  // Initialize database connection
  await initDatabase();

  const app = express();

  // Middleware - CORS with security
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:8080",
    "https://localhost:3000"
  ];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.) in development
      if (!origin && process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      // In development, allow all localhost origins
      if (process.env.NODE_ENV !== 'production' && origin && origin.startsWith('http://localhost:')) {
        console.log(`CORS allowing localhost origin: ${origin}`);
        return callback(null, true);
      }

      if (origin && allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

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

  // Test authenticated route
  app.get("/api/test-auth", async (req, res, next) => {
    const { authenticateToken } = await import("./services/auth");
    authenticateToken(req as any, res, next);
  }, (req: any, res) => {
    res.json({
      message: "Authentication working",
      user: req.user ? { id: req.user.id, username: req.user.username } : null
    });
  });

  app.get("/api/demo", handleDemo);
  // auth routes (MongoDB-backed with JWT)
  app.use("/api", authRouter);
  // workout routes
  app.use("/api", workoutRouter);
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