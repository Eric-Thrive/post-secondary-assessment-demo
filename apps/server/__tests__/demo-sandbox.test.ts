import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { DemoSandboxService } from "../services/demo-sandbox";
import { DemoCleanupService } from "../services/demo-cleanup";
import { UserRole } from "@shared/schema";

// Mock the database
jest.mock("../db", () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
  },
}));

describe("DemoSandboxService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkDemoReportLimit", () => {
    it("should allow non-demo users unlimited reports", async () => {
      const mockDb = require("../db").db;
      mockDb.where.mockResolvedValue([
        {
          role: UserRole.CUSTOMER,
          reportCount: 10,
          maxReports: -1,
        },
      ]);

      const result = await DemoSandboxService.checkDemoReportLimit(1);

      expect(result).toEqual({
        canCreate: true,
        currentCount: 10,
        maxReports: -1,
        isNearLimit: false,
        shouldShowUpgradePrompt: false,
      });
    });

    it("should enforce 5-report limit for demo users", async () => {
      const mockDb = require("../db").db;
      mockDb.where.mockResolvedValue([
        {
          role: UserRole.DEMO,
          reportCount: 3,
          maxReports: 10, // This should be ignored for demo users
        },
      ]);

      const result = await DemoSandboxService.checkDemoReportLimit(1);

      expect(result).toEqual({
        canCreate: true,
        currentCount: 3,
        maxReports: 5,
        isNearLimit: false,
        shouldShowUpgradePrompt: false,
      });
    });

    it("should show upgrade prompt when demo user reaches 4th report", async () => {
      const mockDb = require("../db").db;
      mockDb.where.mockResolvedValue([
        {
          role: UserRole.DEMO,
          reportCount: 4,
          maxReports: 10,
        },
      ]);

      const result = await DemoSandboxService.checkDemoReportLimit(1);

      expect(result).toEqual({
        canCreate: true,
        currentCount: 4,
        maxReports: 5,
        isNearLimit: true,
        shouldShowUpgradePrompt: true,
      });
    });

    it("should prevent demo user from creating 6th report", async () => {
      const mockDb = require("../db").db;
      mockDb.where.mockResolvedValue([
        {
          role: UserRole.DEMO,
          reportCount: 5,
          maxReports: 10,
        },
      ]);

      const result = await DemoSandboxService.checkDemoReportLimit(1);

      expect(result).toEqual({
        canCreate: false,
        currentCount: 5,
        maxReports: 5,
        isNearLimit: true,
        shouldShowUpgradePrompt: false,
      });
    });
  });

  describe("getDemoUpgradePrompt", () => {
    it("should not show prompt for users below threshold", async () => {
      const mockDb = require("../db").db;
      mockDb.where.mockResolvedValue([
        {
          role: UserRole.DEMO,
          reportCount: 2,
          maxReports: 10,
        },
      ]);

      const result = await DemoSandboxService.getDemoUpgradePrompt(1);

      expect(result.show).toBe(false);
    });

    it("should show appropriate prompt for 4th report", async () => {
      const mockDb = require("../db").db;
      mockDb.where.mockResolvedValue([
        {
          role: UserRole.DEMO,
          reportCount: 4,
          maxReports: 10,
        },
      ]);

      const result = await DemoSandboxService.getDemoUpgradePrompt(1);

      expect(result.show).toBe(true);
      expect(result.title).toBe("Last Demo Report");
      expect(result.message).toContain("final demo report");
      expect(result.currentCount).toBe(4);
      expect(result.maxReports).toBe(5);
    });

    it("should show appropriate prompt for 3rd report", async () => {
      const mockDb = require("../db").db;
      mockDb.where.mockResolvedValue([
        {
          role: UserRole.DEMO,
          reportCount: 3,
          maxReports: 10,
        },
      ]);

      const result = await DemoSandboxService.getDemoUpgradePrompt(1);

      expect(result.show).toBe(false); // 3rd report is below threshold of 4
    });
  });

  describe("incrementDemoReportCount", () => {
    it("should throw error when demo user exceeds limit", async () => {
      const mockDb = require("../db").db;
      mockDb.where.mockResolvedValue([
        {
          role: UserRole.DEMO,
          reportCount: 5,
          maxReports: 10,
        },
      ]);

      await expect(
        DemoSandboxService.incrementDemoReportCount(1)
      ).rejects.toThrow("Demo report limit exceeded");
    });

    it("should increment count when within limit", async () => {
      const mockDb = require("../db").db;
      mockDb.where.mockResolvedValue([
        {
          role: UserRole.DEMO,
          reportCount: 3,
          maxReports: 10,
        },
      ]);

      await expect(
        DemoSandboxService.incrementDemoReportCount(1)
      ).resolves.not.toThrow();

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalled();
    });
  });
});

describe("DemoCleanupService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isDemoUserExpired", () => {
    it("should return false for non-demo users", async () => {
      const mockDb = require("../db").db;
      mockDb.where.mockResolvedValue([
        {
          role: UserRole.CUSTOMER,
          createdAt: new Date("2024-01-01"),
        },
      ]);

      const result = await DemoCleanupService.isDemoUserExpired(1);
      expect(result).toBe(false);
    });

    it("should return true for expired demo users", async () => {
      const mockDb = require("../db").db;
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35); // 35 days ago

      mockDb.where.mockResolvedValue([
        {
          role: UserRole.DEMO,
          createdAt: oldDate,
        },
      ]);

      const result = await DemoCleanupService.isDemoUserExpired(1);
      expect(result).toBe(true);
    });

    it("should return false for non-expired demo users", async () => {
      const mockDb = require("../db").db;
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 15); // 15 days ago

      mockDb.where.mockResolvedValue([
        {
          role: UserRole.DEMO,
          createdAt: recentDate,
        },
      ]);

      const result = await DemoCleanupService.isDemoUserExpired(1);
      expect(result).toBe(false);
    });
  });

  describe("getCleanupStats", () => {
    it("should return correct statistics", async () => {
      const mockDb = require("../db").db;

      // Mock the complex query for demo users
      mockDb.where.mockResolvedValueOnce([
        {
          id: 1,
          username: "demo1",
          email: "demo1@test.com",
          reportCount: 3,
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 2,
          username: "demo2",
          email: "demo2@test.com",
          reportCount: 5,
          isActive: true,
          createdAt: new Date(),
        },
      ]);

      // Mock the report count query
      mockDb.where.mockResolvedValueOnce([{ count: 8 }]);

      const result = await DemoCleanupService.getCleanupStats();

      expect(result).toHaveProperty("totalDemoUsers");
      expect(result).toHaveProperty("activeDemoUsers");
      expect(result).toHaveProperty("usersNeedingWarning");
      expect(result).toHaveProperty("expiredUsers");
      expect(result).toHaveProperty("totalDemoReports");
    });
  });
});
