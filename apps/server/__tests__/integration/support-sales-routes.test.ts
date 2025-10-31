import request from "supertest";
import express from "express";
import {
  registerSupportSalesRoutes,
  clearRateLimitStore,
} from "../../routes/support-sales-routes";
import { db } from "../../db";
import { supportRequests, salesInquiries } from "@shared/schema";
import { eq } from "drizzle-orm";

// Mock the admin notifications service
jest.mock("../../services/admin-notifications", () => ({
  sendSupportRequestNotification: jest.fn().mockResolvedValue(undefined),
  sendSalesInquiryNotification: jest.fn().mockResolvedValue(undefined),
}));

describe("Support and Sales Routes Integration Tests", () => {
  let app: express.Express;

  beforeEach(() => {
    // Clear rate limit store before each test
    clearRateLimitStore();

    app = express();
    app.use(express.json());

    // Mock session middleware
    app.use((req, _res, next) => {
      req.session = {} as any;
      next();
    });

    registerSupportSalesRoutes(app);
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await db.delete(supportRequests);
      await db.delete(salesInquiries);
    } catch (error) {
      console.error("Error cleaning up test data:", error);
    }
  });

  describe("POST /api/support/request", () => {
    const validSupportRequest = {
      name: "Test User",
      email: "test@example.com",
      subject: "Test Support Request",
      description: "This is a test support request with sufficient detail.",
      urgency: "medium",
      category: "technical",
    };

    test("should create a support request successfully", async () => {
      const response = await request(app)
        .post("/api/support/request")
        .send(validSupportRequest)
        .expect(201);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("requestId");

      // Verify the request was saved to the database
      const savedRequests = await db
        .select()
        .from(supportRequests)
        .where(eq(supportRequests.email, validSupportRequest.email));

      expect(savedRequests).toHaveLength(1);
      expect(savedRequests[0].name).toBe(validSupportRequest.name);
      expect(savedRequests[0].subject).toBe(validSupportRequest.subject);
      expect(savedRequests[0].status).toBe("open");
    });

    test("should reject request with missing required fields", async () => {
      const invalidRequest = {
        name: "Test User",
        email: "test@example.com",
        // Missing subject, description, urgency, category
      };

      const response = await request(app)
        .post("/api/support/request")
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Validation failed");
      expect(response.body).toHaveProperty("details");
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    test("should reject request with invalid email", async () => {
      const invalidRequest = {
        ...validSupportRequest,
        email: "not-an-email",
      };

      const response = await request(app)
        .post("/api/support/request")
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Validation failed");
    });

    test("should reject request with invalid urgency", async () => {
      const invalidRequest = {
        ...validSupportRequest,
        urgency: "critical", // Not a valid urgency level
      };

      const response = await request(app)
        .post("/api/support/request")
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Validation failed");
    });

    test("should reject request with short description", async () => {
      const invalidRequest = {
        ...validSupportRequest,
        description: "Too short", // Less than 10 characters
      };

      const response = await request(app)
        .post("/api/support/request")
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Validation failed");
    });

    test("should enforce rate limiting", async () => {
      // Make 10 requests (the limit)
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post("/api/support/request")
          .send({
            ...validSupportRequest,
            email: `test${i}@example.com`,
          })
          .expect(201);
      }

      // The 11th request should be rate limited
      const response = await request(app)
        .post("/api/support/request")
        .send({
          ...validSupportRequest,
          email: "test11@example.com",
        })
        .expect(429);

      expect(response.body).toHaveProperty("error", "Too many requests");
      expect(response.body).toHaveProperty("retryAfter");
      expect(response.headers).toHaveProperty("x-ratelimit-limit");
      expect(response.headers).toHaveProperty("x-ratelimit-remaining");
      expect(response.headers).toHaveProperty("x-ratelimit-reset");
    });
  });

  describe("POST /api/sales/inquiry", () => {
    const validSalesInquiry = {
      name: "Test Customer",
      email: "customer@example.com",
      organization: "Test Organization",
      organizationSize: "50-100",
      interestedModules: ["k12", "post_secondary"],
      message: "We are interested in learning more about your platform.",
      inquiryType: "pricing",
    };

    test("should create a sales inquiry successfully", async () => {
      const response = await request(app)
        .post("/api/sales/inquiry")
        .send(validSalesInquiry)
        .expect(201);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("inquiryId");

      // Verify the inquiry was saved to the database
      const savedInquiries = await db
        .select()
        .from(salesInquiries)
        .where(eq(salesInquiries.email, validSalesInquiry.email));

      expect(savedInquiries).toHaveLength(1);
      expect(savedInquiries[0].name).toBe(validSalesInquiry.name);
      expect(savedInquiries[0].organization).toBe(
        validSalesInquiry.organization
      );
      expect(savedInquiries[0].status).toBe("new");
    });

    test("should reject inquiry with missing required fields", async () => {
      const invalidInquiry = {
        name: "Test Customer",
        email: "customer@example.com",
        // Missing organization, interestedModules, message, inquiryType
      };

      const response = await request(app)
        .post("/api/sales/inquiry")
        .send(invalidInquiry)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Validation failed");
      expect(response.body).toHaveProperty("details");
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    test("should reject inquiry with invalid email", async () => {
      const invalidInquiry = {
        ...validSalesInquiry,
        email: "not-an-email",
      };

      const response = await request(app)
        .post("/api/sales/inquiry")
        .send(invalidInquiry)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Validation failed");
    });

    test("should reject inquiry with empty modules array", async () => {
      const invalidInquiry = {
        ...validSalesInquiry,
        interestedModules: [],
      };

      const response = await request(app)
        .post("/api/sales/inquiry")
        .send(invalidInquiry)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Validation failed");
    });

    test("should reject inquiry with short message", async () => {
      const invalidInquiry = {
        ...validSalesInquiry,
        message: "Too short", // Less than 10 characters
      };

      const response = await request(app)
        .post("/api/sales/inquiry")
        .send(invalidInquiry)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Validation failed");
    });

    test("should accept inquiry without optional organizationSize", async () => {
      const inquiryWithoutSize = {
        ...validSalesInquiry,
        organizationSize: undefined,
      };

      const response = await request(app)
        .post("/api/sales/inquiry")
        .send(inquiryWithoutSize)
        .expect(201);

      expect(response.body).toHaveProperty("success", true);
    });

    test("should enforce rate limiting", async () => {
      // Make 10 requests (the limit)
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post("/api/sales/inquiry")
          .send({
            ...validSalesInquiry,
            email: `customer${i}@example.com`,
          })
          .expect(201);
      }

      // The 11th request should be rate limited
      const response = await request(app)
        .post("/api/sales/inquiry")
        .send({
          ...validSalesInquiry,
          email: "customer11@example.com",
        })
        .expect(429);

      expect(response.body).toHaveProperty("error", "Too many requests");
      expect(response.body).toHaveProperty("retryAfter");
      expect(response.headers).toHaveProperty("x-ratelimit-limit");
      expect(response.headers).toHaveProperty("x-ratelimit-remaining");
      expect(response.headers).toHaveProperty("x-ratelimit-reset");
    });
  });
});
