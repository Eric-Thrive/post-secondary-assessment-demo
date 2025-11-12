import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import {
  requestTimeout,
  setupGracefulShutdown,
  healthCheck,
} from "./reliability-improvements";
import { demoWriteGuard } from "./middleware/demoWriteGuard";
import { performanceMiddleware } from "./middleware/performance-monitoring";
import { OptimizedPromptService } from "./services/optimized-prompt-service";

const app = express();
// Increase payload limits to 50mb for K-12 and tutoring reports
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// Add performance monitoring middleware
app.use(performanceMiddleware);

// Add request timeout for non-AI routes (30 second timeout)
app.use(requestTimeout(30000));

// Add health check endpoint
app.get("/health", healthCheck);

// Add demo write guard middleware
// This implements selective read-only mode for demo environments
// Allows user registration/login while blocking assessment creation
app.use(demoWriteGuard);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use Railway's PORT environment variable or default to 5001 for local dev
  // Railway assigns a dynamic port via the PORT env var
  // Default to 5001 to avoid macOS ControlCenter conflict on port 5000
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;

  // For local macOS development, use localhost instead of 0.0.0.0
  // Railway will override this with PORT env var
  const isLocal = process.env.APP_ENVIRONMENT === "local";
  const host = isLocal ? "127.0.0.1" : "0.0.0.0";

  // Configure server timeouts for reliability
  server.timeout = 180000; // 3 minutes for AI operations
  server.keepAliveTimeout = 65000; // Slightly longer than ALB timeout
  server.headersTimeout = 66000; // Slightly longer than keepAliveTimeout

  server.listen(port, host, async () => {
    log(`serving on port ${port}`);

    // Warm up prompt cache for better performance
    try {
      await OptimizedPromptService.warmUpCache();
      log("Prompt cache warmed up successfully");
    } catch (error) {
      log(
        `Failed to warm up prompt cache: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  });

  // Setup graceful shutdown handlers
  setupGracefulShutdown(server);
})();
