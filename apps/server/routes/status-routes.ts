import type { Express } from "express";
import { storage } from "../storage";

export function registerStatusRoutes(app: Express): void {
  app.get("/api/test-connection", async (_req, res) => {
    try {
      const config = await storage.getAiConfig();
      res.json({
        success: true,
        connected: true,
        hasConfig: !!config,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Connection test failed:", error);
      res.status(500).json({
        success: false,
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  app.get("/api/health", (_req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Health Check</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-green-50 to-emerald-100 min-h-screen p-8">
    <div class="max-w-3xl mx-auto">
        <div class="bg-white rounded-lg shadow-2xl p-8">
            <h1 class="text-4xl font-bold text-green-600 mb-4">
                ✅ Server is Running!
            </h1>
            <p class="text-gray-700 text-lg mb-6">
                Educational Accessibility Platform - Preview Test
            </p>
            <div class="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                <p class="text-green-800 font-semibold">Status: Online</p>
                <p class="text-green-700">Time: ${new Date().toLocaleString()}</p>
                <p class="text-green-700">Port: ${process.env.PORT || 5000}</p>
            </div>
            <div class="space-y-4">
                <p class="text-gray-600">To access the full application:</p>
                <ol class="list-decimal list-inside text-gray-700 space-y-2">
                    <li>Navigate to <a href="/" class="text-blue-600 hover:underline">the home page</a></li>
                    <li>Login with your credentials</li>
                    <li>Start creating accessibility reports!</li>
                </ol>
            </div>
        </div>
    </div>
</body>
</html>
    `);
  });
}
