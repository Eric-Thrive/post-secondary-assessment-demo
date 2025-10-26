import request from "supertest";
import express from "express";
import { registerStatusRoutes } from "../../routes/status-routes";

describe("API Routes Integration Tests", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    registerStatusRoutes(app);
  });

  describe("Status Routes", () => {
    test("GET /api/health should return health status", async () => {
      const response = await request(app).get("/api/health").expect(200);

      expect(response.text).toContain("Server is Running");
      expect(response.headers["content-type"]).toContain("text/html");
    });

    test("GET /api/test-connection should return connection status", async () => {
      const response = await request(app)
        .get("/api/test-connection")
        .expect(200);

      expect(response.body).toHaveProperty("success");
      expect(response.body).toHaveProperty("timestamp");
      expect(typeof response.body.success).toBe("boolean");
    });
  });

  describe("Error Handling", () => {
    test("should handle 404 for unknown routes", async () => {
      await request(app).get("/api/unknown").expect(404);
    });
  });
});
