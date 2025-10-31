import {
  getSystemAdmins,
  invalidateAdminCache,
  sendRegistrationNotification,
  sendSupportRequestNotification,
  sendSalesInquiryNotification,
} from "../../services/admin-notifications";
import { db } from "../../db";
import * as sendgridService from "../../services/sendgrid";
import type {
  RegistrationData,
  SupportRequest,
  SalesInquiry,
} from "../../services/sendgrid";

// Mock the database
jest.mock("../../db", () => ({
  db: {
    select: jest.fn(),
  },
}));

// Mock the sendgrid service
jest.mock("../../services/sendgrid", () => ({
  sendAdminRegistrationNotification: jest.fn(),
  sendAdminSupportNotification: jest.fn(),
  sendAdminSalesNotification: jest.fn(),
}));

describe("Admin Notification Service", () => {
  // Mock console methods to avoid cluttering test output
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    invalidateAdminCache(); // Clear cache before each test
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("getSystemAdmins", () => {
    test("should retrieve system admins from database", async () => {
      const mockAdmins = [
        { id: 1, email: "admin1@example.com", username: "admin1" },
        { id: 2, email: "admin2@example.com", username: "admin2" },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockAdmins),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const admins = await getSystemAdmins();

      expect(admins).toEqual(mockAdmins);
      expect(admins.length).toBe(2);
      expect(db.select).toHaveBeenCalled();
    });

    test("should cache admin list for subsequent calls", async () => {
      const mockAdmins = [
        { id: 1, email: "admin1@example.com", username: "admin1" },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockAdmins),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      // First call - should hit database
      const admins1 = await getSystemAdmins();
      expect(admins1).toEqual(mockAdmins);
      expect(db.select).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const admins2 = await getSystemAdmins();
      expect(admins2).toEqual(mockAdmins);
      expect(db.select).toHaveBeenCalledTimes(1); // Still only 1 call

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Using cached system admin list"
      );
    });

    test("should handle case where no admins exist", async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const admins = await getSystemAdmins();

      expect(admins).toEqual([]);
      expect(admins.length).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("No system administrators found")
      );
    });

    test("should handle database errors gracefully", async () => {
      const mockError = new Error("Database connection failed");
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockRejectedValue(mockError),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const admins = await getSystemAdmins();

      expect(admins).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching system administrators:",
        mockError
      );
    });

    test("should invalidate cache after TTL expires", async () => {
      const mockAdmins = [
        { id: 1, email: "admin1@example.com", username: "admin1" },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockAdmins),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      // First call
      await getSystemAdmins();
      expect(db.select).toHaveBeenCalledTimes(1);

      // Manually invalidate cache to simulate TTL expiry
      invalidateAdminCache();

      // Second call after cache invalidation
      await getSystemAdmins();
      expect(db.select).toHaveBeenCalledTimes(2);
    });
  });

  describe("sendRegistrationNotification", () => {
    test("should send notification to all system admins", async () => {
      const mockAdmins = [
        { id: 1, email: "admin1@example.com", username: "admin1" },
        { id: 2, email: "admin2@example.com", username: "admin2" },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockAdmins),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const mockSendNotification = jest.fn().mockResolvedValue(true);
      (
        sendgridService.sendAdminRegistrationNotification as jest.Mock
      ).mockImplementation(mockSendNotification);

      const userData: RegistrationData = {
        username: "newuser",
        email: "newuser@example.com",
        organizationName: "Test Org",
        registeredAt: new Date(),
      };

      // Call the function
      await sendRegistrationNotification(userData);

      // Wait for setImmediate to execute
      await new Promise((resolve) => setImmediate(resolve));

      // Verify notifications were sent to all admins
      expect(mockSendNotification).toHaveBeenCalledTimes(2);
      expect(mockSendNotification).toHaveBeenCalledWith(
        "admin1@example.com",
        userData
      );
      expect(mockSendNotification).toHaveBeenCalledWith(
        "admin2@example.com",
        userData
      );
    });

    test("should handle case with no system admins", async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const userData: RegistrationData = {
        username: "newuser",
        email: "newuser@example.com",
        registeredAt: new Date(),
      };

      await sendRegistrationNotification(userData);

      // Wait for setImmediate to execute
      await new Promise((resolve) => setImmediate(resolve));

      expect(
        sendgridService.sendAdminRegistrationNotification
      ).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "No system admins to notify for registration:",
        "newuser@example.com"
      );
    });

    test("should handle email sending failures gracefully", async () => {
      const mockAdmins = [
        { id: 1, email: "admin1@example.com", username: "admin1" },
        { id: 2, email: "admin2@example.com", username: "admin2" },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockAdmins),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      // First admin succeeds, second fails
      (sendgridService.sendAdminRegistrationNotification as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const userData: RegistrationData = {
        username: "newuser",
        email: "newuser@example.com",
        registeredAt: new Date(),
      };

      await sendRegistrationNotification(userData);

      // Wait for setImmediate to execute
      await new Promise((resolve) => setImmediate(resolve));

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Registration notifications: 1/2 sent successfully"
        )
      );
    });

    test("should not block on notification sending", async () => {
      const mockAdmins = [
        { id: 1, email: "admin1@example.com", username: "admin1" },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockAdmins),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const userData: RegistrationData = {
        username: "newuser",
        email: "newuser@example.com",
        registeredAt: new Date(),
      };

      // Function should return immediately without waiting
      const startTime = Date.now();
      await sendRegistrationNotification(userData);
      const endTime = Date.now();

      // Should complete almost instantly (not waiting for email sending)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe("sendSupportRequestNotification", () => {
    test("should send notification to all system admins", async () => {
      const mockAdmins = [
        { id: 1, email: "admin1@example.com", username: "admin1" },
        { id: 2, email: "admin2@example.com", username: "admin2" },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockAdmins),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const mockSendNotification = jest.fn().mockResolvedValue(true);
      (
        sendgridService.sendAdminSupportNotification as jest.Mock
      ).mockImplementation(mockSendNotification);

      const supportRequest: SupportRequest = {
        name: "John Doe",
        email: "john@example.com",
        subject: "Need help",
        description: "I need assistance with my account",
        urgency: "high",
        category: "technical",
        createdAt: new Date(),
      };

      await sendSupportRequestNotification(supportRequest);

      // Wait for setImmediate to execute
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockSendNotification).toHaveBeenCalledTimes(2);
      expect(mockSendNotification).toHaveBeenCalledWith(
        "admin1@example.com",
        supportRequest
      );
      expect(mockSendNotification).toHaveBeenCalledWith(
        "admin2@example.com",
        supportRequest
      );
    });

    test("should handle case with no system admins", async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const supportRequest: SupportRequest = {
        name: "John Doe",
        email: "john@example.com",
        subject: "Need help",
        description: "I need assistance",
        urgency: "medium",
        category: "account",
        createdAt: new Date(),
      };

      await sendSupportRequestNotification(supportRequest);

      // Wait for setImmediate to execute
      await new Promise((resolve) => setImmediate(resolve));

      expect(
        sendgridService.sendAdminSupportNotification
      ).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "No system admins to notify for support request:",
        "john@example.com"
      );
    });
  });

  describe("sendSalesInquiryNotification", () => {
    test("should send notification to all system admins", async () => {
      const mockAdmins = [
        { id: 1, email: "admin1@example.com", username: "admin1" },
        { id: 2, email: "admin2@example.com", username: "admin2" },
        { id: 3, email: "admin3@example.com", username: "admin3" },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockAdmins),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const mockSendNotification = jest.fn().mockResolvedValue(true);
      (
        sendgridService.sendAdminSalesNotification as jest.Mock
      ).mockImplementation(mockSendNotification);

      const salesInquiry: SalesInquiry = {
        name: "Jane Smith",
        email: "jane@company.com",
        organization: "ABC Corp",
        organizationSize: "50-100",
        interestedModules: ["K12", "PostSecondary"],
        message: "Interested in pricing for enterprise",
        inquiryType: "pricing",
        createdAt: new Date(),
      };

      await sendSalesInquiryNotification(salesInquiry);

      // Wait for setImmediate to execute
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockSendNotification).toHaveBeenCalledTimes(3);
      expect(mockSendNotification).toHaveBeenCalledWith(
        "admin1@example.com",
        salesInquiry
      );
      expect(mockSendNotification).toHaveBeenCalledWith(
        "admin2@example.com",
        salesInquiry
      );
      expect(mockSendNotification).toHaveBeenCalledWith(
        "admin3@example.com",
        salesInquiry
      );
    });

    test("should handle case with no system admins", async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const salesInquiry: SalesInquiry = {
        name: "Jane Smith",
        email: "jane@company.com",
        organization: "ABC Corp",
        interestedModules: ["K12"],
        message: "Interested in demo",
        inquiryType: "demo",
        createdAt: new Date(),
      };

      await sendSalesInquiryNotification(salesInquiry);

      // Wait for setImmediate to execute
      await new Promise((resolve) => setImmediate(resolve));

      expect(sendgridService.sendAdminSalesNotification).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "No system admins to notify for sales inquiry:",
        "jane@company.com"
      );
    });

    test("should handle partial email sending failures", async () => {
      const mockAdmins = [
        { id: 1, email: "admin1@example.com", username: "admin1" },
        { id: 2, email: "admin2@example.com", username: "admin2" },
        { id: 3, email: "admin3@example.com", username: "admin3" },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockAdmins),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      // First succeeds, second fails, third succeeds
      (sendgridService.sendAdminSalesNotification as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const salesInquiry: SalesInquiry = {
        name: "Jane Smith",
        email: "jane@company.com",
        organization: "ABC Corp",
        interestedModules: ["K12"],
        message: "Interested in features",
        inquiryType: "features",
        createdAt: new Date(),
      };

      await sendSalesInquiryNotification(salesInquiry);

      // Wait for setImmediate to execute
      await new Promise((resolve) => setImmediate(resolve));

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Sales inquiry notifications: 2/3 sent successfully"
        )
      );
    });
  });

  describe("invalidateAdminCache", () => {
    test("should clear the admin cache", async () => {
      const mockAdmins = [
        { id: 1, email: "admin1@example.com", username: "admin1" },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockAdmins),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      // First call - populates cache
      await getSystemAdmins();
      expect(db.select).toHaveBeenCalledTimes(1);

      // Second call - uses cache
      await getSystemAdmins();
      expect(db.select).toHaveBeenCalledTimes(1);

      // Invalidate cache
      invalidateAdminCache();

      // Third call - should hit database again
      await getSystemAdmins();
      expect(db.select).toHaveBeenCalledTimes(2);
    });
  });
});
