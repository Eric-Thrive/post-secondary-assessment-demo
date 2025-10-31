import type { Express, Request, Response } from "express";
import { db } from "../db";
import { supportRequests, salesInquiries } from "@shared/schema";
import {
  sendSupportRequestNotification,
  sendSalesInquiryNotification,
} from "../services/admin-notifications";
import { z } from "zod";
import { rateLimiters, clearRateLimitStore } from "../middleware/rate-limit";

/**
 * Clear rate limit store (for testing purposes)
 * Re-exported for backward compatibility with existing tests
 */
export { clearRateLimitStore };

// Validation schemas
const supportRequestSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(255),
  description: z.string().min(10, "Description must be at least 10 characters"),
  urgency: z.enum(["low", "medium", "high"], {
    errorMap: () => ({ message: "Urgency must be low, medium, or high" }),
  }),
  category: z.enum(["technical", "account", "billing", "other"], {
    errorMap: () => ({
      message: "Category must be technical, account, billing, or other",
    }),
  }),
});

const salesInquirySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email address"),
  organization: z.string().min(1, "Organization is required").max(255),
  organizationSize: z.string().optional(),
  interestedModules: z
    .array(z.string())
    .min(1, "At least one module must be selected"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  inquiryType: z.enum(["pricing", "demo", "features", "other"], {
    errorMap: () => ({
      message: "Inquiry type must be pricing, demo, features, or other",
    }),
  }),
});

/**
 * Register support and sales routes
 */
export function registerSupportSalesRoutes(app: Express): void {
  /**
   * POST /api/support/request
   * Submit a support request
   */
  app.post(
    "/api/support/request",
    rateLimiters.support,
    async (req: Request, res: Response) => {
      try {
        // Validate request data
        const validationResult = supportRequestSchema.safeParse(req.body);

        if (!validationResult.success) {
          return res.status(400).json({
            error: "Validation failed",
            details: validationResult.error.errors.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          });
        }

        const requestData = validationResult.data;

        // Get user ID if logged in
        const userId = req.session?.userId || null;

        // Save support request to database
        const [savedRequest] = await db
          .insert(supportRequests)
          .values({
            name: requestData.name,
            email: requestData.email,
            subject: requestData.subject,
            description: requestData.description,
            urgency: requestData.urgency,
            category: requestData.category,
            userId: userId,
            status: "open",
          })
          .returning();

        console.log(
          `✅ Support request created: ${savedRequest.id} from ${requestData.email}`
        );

        // Send admin notification asynchronously
        await sendSupportRequestNotification({
          name: requestData.name,
          email: requestData.email,
          subject: requestData.subject,
          description: requestData.description,
          urgency: requestData.urgency,
          category: requestData.category,
          createdAt: savedRequest.createdAt || new Date(),
        });

        // Return success response
        res.status(201).json({
          success: true,
          message:
            "Your support request has been submitted successfully. Our team will respond to you shortly.",
          requestId: savedRequest.id,
        });
      } catch (error) {
        console.error("Error creating support request:", error);
        res.status(500).json({
          error: "Failed to submit support request",
          message:
            "An error occurred while processing your request. Please try again later.",
        });
      }
    }
  );

  /**
   * POST /api/sales/inquiry
   * Submit a sales inquiry
   */
  app.post(
    "/api/sales/inquiry",
    rateLimiters.sales,
    async (req: Request, res: Response) => {
      try {
        // Validate request data
        const validationResult = salesInquirySchema.safeParse(req.body);

        if (!validationResult.success) {
          return res.status(400).json({
            error: "Validation failed",
            details: validationResult.error.errors.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          });
        }

        const inquiryData = validationResult.data;

        // Get user ID if logged in
        const userId = req.session?.userId || null;

        // Save sales inquiry to database
        const [savedInquiry] = await db
          .insert(salesInquiries)
          .values({
            name: inquiryData.name,
            email: inquiryData.email,
            organization: inquiryData.organization,
            organizationSize: inquiryData.organizationSize || null,
            interestedModules: inquiryData.interestedModules,
            message: inquiryData.message,
            inquiryType: inquiryData.inquiryType,
            userId: userId,
            status: "new",
          })
          .returning();

        console.log(
          `✅ Sales inquiry created: ${savedInquiry.id} from ${inquiryData.email}`
        );

        // Send admin notification asynchronously
        await sendSalesInquiryNotification({
          name: inquiryData.name,
          email: inquiryData.email,
          organization: inquiryData.organization,
          organizationSize: inquiryData.organizationSize,
          interestedModules: inquiryData.interestedModules,
          message: inquiryData.message,
          inquiryType: inquiryData.inquiryType,
          createdAt: savedInquiry.createdAt || new Date(),
        });

        // Return success response
        res.status(201).json({
          success: true,
          message:
            "Thank you for your inquiry! Our sales team will contact you within 1-2 business days.",
          inquiryId: savedInquiry.id,
        });
      } catch (error) {
        console.error("Error creating sales inquiry:", error);
        res.status(500).json({
          error: "Failed to submit sales inquiry",
          message:
            "An error occurred while processing your inquiry. Please try again later.",
        });
      }
    }
  );
}
