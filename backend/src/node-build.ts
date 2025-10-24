import path from "path";
import { createServer } from "./index";
import * as express from "express";

// Use an async IIFE to handle the async createServer function
(async () => {
  const app = await createServer();
  const port = process.env.PORT || 3000;

  // In production, serve the built SPA files
  const __dirname = import.meta.dirname;
  // Fix the path to point to the correct build directory
  const distPath = path.join(__dirname, "../spa"); // This should be relative to the server build directory

  // Check if the directory exists
  console.log('Looking for SPA files in:', distPath);

  // Serve static files
  app.use(express.static(distPath));

  // Handle React Router - serve index.html for all non-API routes
  app.get(/^(?!\/api\/)(?!\/health).*/, (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }

    const indexPath = path.join(distPath, "index.html");
    console.log('Serving index.html from:', indexPath);
    res.sendFile(indexPath);
  });

  app.listen(port, () => {
    console.log(`🚀 Fusion Starter server running on port ${port}`);
    console.log(`📱 Frontend: http://localhost:${port}`);
    console.log(`🔧 API: http://localhost:${port}/api`);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("🛑 Received SIGTERM, shutting down gracefully");
    process.exit(0);
  });

  process.on("SIGINT", () => {
    console.log("🛑 Received SIGINT, shutting down gracefully");
    process.exit(0);
  });
})();