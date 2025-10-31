// Unmock the sendgrid service for this test file
jest.unmock("../../services/sendgrid");

import {
  generateVerificationEmail,
  generateAdminRegistrationNotification,
  generateAdminSupportNotification,
  generateAdminSalesNotification,
  RegistrationData,
  SupportRequest,
  SalesInquiry,
} from "../../services/sendgrid";

describe("Email Template Rendering", () => {
  const mockFromEmail = "test@thriveiep.com";

  beforeAll(() => {
    process.env.SENDGRID_FROM_EMAIL = mockFromEmail;
  });

  describe("Verification Email Template", () => {
    const testEmail = "user@example.com";
    const testUsername = "testuser";
    const testVerificationLink =
      "https://example.com/verify-email?token=abc123";

    test("should replace all placeholders correctly", () => {
      const email = generateVerificationEmail(
        testEmail,
        testUsername,
        testVerificationLink
      );

      // Check email metadata
      expect(email.to).toBe(testEmail);
      expect(email.from).toBe(mockFromEmail);
      expect(email.subject).toBe(
        "Verify your email - THRIVE Assessment Platform"
      );

      // Check text version has all placeholders replaced
      expect(email.text).toContain(testUsername);
      expect(email.text).toContain(testVerificationLink);
      expect(email.text).not.toContain("${");
      expect(email.text).not.toContain("[USERNAME]");
      expect(email.text).not.toContain("[VERIFICATION_LINK]");

      // Check HTML version has all placeholders replaced
      expect(email.html).toContain(testUsername);
      expect(email.html).toContain(testVerificationLink);
      expect(email.html).not.toContain("${");
      expect(email.html).not.toContain("[USERNAME]");
      expect(email.html).not.toContain("[VERIFICATION_LINK]");
    });

    test("should render valid HTML structure", () => {
      const email = generateVerificationEmail(
        testEmail,
        testUsername,
        testVerificationLink
      );

      // Check for essential HTML elements
      expect(email.html).toContain("<div");
      expect(email.html).toContain("</div>");
      expect(email.html).toContain("<h2");
      expect(email.html).toContain("</h2>");
      expect(email.html).toContain("<p");
      expect(email.html).toContain("</p>");
      expect(email.html).toContain("<a");
      expect(email.html).toContain("</a>");

      // Check for proper link structure
      expect(email.html).toContain(`href="${testVerificationLink}"`);
    });

    test("should include responsive design styles", () => {
      const email = generateVerificationEmail(
        testEmail,
        testUsername,
        testVerificationLink
      );

      // Check for responsive design elements
      expect(email.html).toContain("max-width: 600px");
      expect(email.html).toContain("margin: 0 auto");
      expect(email.html).toContain("padding:");
      expect(email.html).toContain("font-family:");

      // Check for button styling
      expect(email.html).toContain("display: inline-block");
      expect(email.html).toContain("background-color:");
      expect(email.html).toContain("border-radius:");
    });

    test("should include THRIVE branding colors", () => {
      const email = generateVerificationEmail(
        testEmail,
        testUsername,
        testVerificationLink
      );

      // Check for THRIVE brand colors
      expect(email.html).toContain("#1297D2"); // Navy blue
      expect(email.html).toContain("#F89E54"); // Orange accent
    });

    test("should handle special characters in username", () => {
      const specialUsername = "Test User <script>alert('xss')</script>";
      const email = generateVerificationEmail(
        testEmail,
        specialUsername,
        testVerificationLink
      );

      // Username should be included as-is (HTML escaping is handled by email client)
      expect(email.html).toContain(specialUsername);
      expect(email.text).toContain(specialUsername);
    });

    test("should include expiry information", () => {
      const email = generateVerificationEmail(
        testEmail,
        testUsername,
        testVerificationLink
      );

      expect(email.html).toContain("24 hours");
      expect(email.text).toContain("24 hours");
    });
  });

  describe("Admin Registration Notification Template", () => {
    const adminEmail = "admin@thriveiep.com";
    const testUserData: RegistrationData = {
      username: "newuser",
      email: "newuser@example.com",
      organizationName: "Test Organization",
      registeredAt: new Date("2025-01-15T10:30:00Z"),
    };

    test("should replace all placeholders correctly", () => {
      const email = generateAdminRegistrationNotification(
        adminEmail,
        testUserData
      );

      // Check email metadata
      expect(email.to).toBe(adminEmail);
      expect(email.from).toBe(mockFromEmail);
      expect(email.subject).toContain(testUserData.username);

      // Check all user data is present
      expect(email.html).toContain(testUserData.username);
      expect(email.html).toContain(testUserData.email);
      expect(email.html).toContain(testUserData.organizationName!);

      // Check no placeholders remain
      expect(email.html).not.toContain("[USERNAME]");
      expect(email.html).not.toContain("[EMAIL]");
      expect(email.html).not.toContain("[ORGANIZATION]");
      expect(email.html).not.toContain("[TIMESTAMP]");
    });

    test("should render valid HTML table structure", () => {
      const email = generateAdminRegistrationNotification(
        adminEmail,
        testUserData
      );

      // Check for table elements
      expect(email.html).toContain("<table");
      expect(email.html).toContain("</table>");
      expect(email.html).toContain("<tr");
      expect(email.html).toContain("</tr>");
      expect(email.html).toContain("<td");
      expect(email.html).toContain("</td>");
    });

    test("should handle missing organization name", () => {
      const userDataWithoutOrg: RegistrationData = {
        ...testUserData,
        organizationName: undefined,
      };

      const email = generateAdminRegistrationNotification(
        adminEmail,
        userDataWithoutOrg
      );

      expect(email.html).toContain("Not provided");
      expect(email.text).toContain("Not provided");
    });

    test("should format timestamp correctly", () => {
      const email = generateAdminRegistrationNotification(
        adminEmail,
        testUserData
      );

      // Should contain a formatted date string
      expect(email.html).toMatch(/\d{4}/); // Year
      expect(email.text).toMatch(/\d{4}/); // Year
    });

    test("should include responsive design styles", () => {
      const email = generateAdminRegistrationNotification(
        adminEmail,
        testUserData
      );

      expect(email.html).toContain("max-width: 600px");
      expect(email.html).toContain("background-color: #f3f4f6");
      expect(email.html).toContain("border-radius:");
    });
  });

  describe("Admin Support Request Notification Template", () => {
    const adminEmail = "admin@thriveiep.com";
    const testRequest: SupportRequest = {
      name: "John Doe",
      email: "john@example.com",
      subject: "Login Issue",
      description: "I cannot log in to my account. Please help.",
      urgency: "high",
      category: "technical",
      createdAt: new Date("2025-01-15T14:45:00Z"),
    };

    test("should replace all placeholders correctly", () => {
      const email = generateAdminSupportNotification(adminEmail, testRequest);

      // Check email metadata
      expect(email.to).toBe(adminEmail);
      expect(email.from).toBe(mockFromEmail);
      expect(email.subject).toContain(testRequest.subject);

      // Check all request data is present
      expect(email.html).toContain(testRequest.name);
      expect(email.html).toContain(testRequest.email);
      expect(email.html).toContain(testRequest.subject);
      expect(email.html).toContain(testRequest.description);
      expect(email.html).toContain(testRequest.category);

      // Check no placeholders remain
      expect(email.html).not.toContain("[NAME]");
      expect(email.html).not.toContain("[EMAIL]");
      expect(email.html).not.toContain("[SUBJECT]");
      expect(email.html).not.toContain("[DESCRIPTION]");
    });

    test("should display urgency level prominently", () => {
      const email = generateAdminSupportNotification(adminEmail, testRequest);

      expect(email.html).toContain("HIGH");
      expect(email.html).toContain("Urgency:");
      expect(email.text).toContain("HIGH");
    });

    test("should use different colors for different urgency levels", () => {
      const lowUrgencyRequest: SupportRequest = {
        ...testRequest,
        urgency: "low",
      };
      const mediumUrgencyRequest: SupportRequest = {
        ...testRequest,
        urgency: "medium",
      };
      const highUrgencyRequest: SupportRequest = {
        ...testRequest,
        urgency: "high",
      };

      const lowEmail = generateAdminSupportNotification(
        adminEmail,
        lowUrgencyRequest
      );
      const mediumEmail = generateAdminSupportNotification(
        adminEmail,
        mediumUrgencyRequest
      );
      const highEmail = generateAdminSupportNotification(
        adminEmail,
        highUrgencyRequest
      );

      // Check for different urgency colors
      expect(lowEmail.html).toContain("#10B981"); // Green
      expect(mediumEmail.html).toContain("#F59E0B"); // Yellow/Orange
      expect(highEmail.html).toContain("#EF4444"); // Red
    });

    test("should preserve description formatting", () => {
      const multilineDescription = "Line 1\nLine 2\nLine 3";
      const requestWithMultiline: SupportRequest = {
        ...testRequest,
        description: multilineDescription,
      };

      const email = generateAdminSupportNotification(
        adminEmail,
        requestWithMultiline
      );

      expect(email.html).toContain("white-space: pre-wrap");
      expect(email.html).toContain(multilineDescription);
    });

    test("should include responsive design styles", () => {
      const email = generateAdminSupportNotification(adminEmail, testRequest);

      expect(email.html).toContain("max-width: 600px");
      expect(email.html).toContain("border-radius:");
      expect(email.html).toContain("padding:");
    });
  });

  describe("Admin Sales Inquiry Notification Template", () => {
    const adminEmail = "admin@thriveiep.com";
    const testInquiry: SalesInquiry = {
      name: "Jane Smith",
      email: "jane@company.com",
      organization: "ABC Corporation",
      organizationSize: "50-100 employees",
      interestedModules: ["K-12 Assessment", "Post-Secondary"],
      message:
        "We are interested in purchasing licenses for our school district.",
      inquiryType: "pricing",
      createdAt: new Date("2025-01-15T16:20:00Z"),
    };

    test("should replace all placeholders correctly", () => {
      const email = generateAdminSalesNotification(adminEmail, testInquiry);

      // Check email metadata
      expect(email.to).toBe(adminEmail);
      expect(email.from).toBe(mockFromEmail);
      expect(email.subject).toContain(testInquiry.organization);

      // Check all inquiry data is present
      expect(email.html).toContain(testInquiry.name);
      expect(email.html).toContain(testInquiry.email);
      expect(email.html).toContain(testInquiry.organization);
      expect(email.html).toContain(testInquiry.organizationSize!);
      expect(email.html).toContain(testInquiry.message);

      // Check no placeholders remain
      expect(email.html).not.toContain("[NAME]");
      expect(email.html).not.toContain("[EMAIL]");
      expect(email.html).not.toContain("[ORGANIZATION]");
      expect(email.html).not.toContain("[MESSAGE]");
    });

    test("should display inquiry type prominently", () => {
      const email = generateAdminSalesNotification(adminEmail, testInquiry);

      expect(email.html).toContain("PRICING");
      expect(email.html).toContain("Inquiry Type:");
      expect(email.text).toContain("PRICING");
    });

    test("should format interested modules as comma-separated list", () => {
      const email = generateAdminSalesNotification(adminEmail, testInquiry);

      expect(email.html).toContain("K-12 Assessment, Post-Secondary");
      expect(email.text).toContain("K-12 Assessment, Post-Secondary");
    });

    test("should handle empty interested modules array", () => {
      const inquiryWithoutModules: SalesInquiry = {
        ...testInquiry,
        interestedModules: [],
      };

      const email = generateAdminSalesNotification(
        adminEmail,
        inquiryWithoutModules
      );

      expect(email.html).toContain("Not specified");
      expect(email.text).toContain("Not specified");
    });

    test("should handle missing organization size", () => {
      const inquiryWithoutSize: SalesInquiry = {
        ...testInquiry,
        organizationSize: undefined,
      };

      const email = generateAdminSalesNotification(
        adminEmail,
        inquiryWithoutSize
      );

      expect(email.html).toContain("Not provided");
      expect(email.text).toContain("Not provided");
    });

    test("should use green accent color for sales inquiries", () => {
      const email = generateAdminSalesNotification(adminEmail, testInquiry);

      expect(email.html).toContain("#10B981"); // Green
      expect(email.html).toContain("#DCFCE7"); // Light green background
    });

    test("should preserve message formatting", () => {
      const multilineMessage = "Line 1\nLine 2\nLine 3";
      const inquiryWithMultiline: SalesInquiry = {
        ...testInquiry,
        message: multilineMessage,
      };

      const email = generateAdminSalesNotification(
        adminEmail,
        inquiryWithMultiline
      );

      expect(email.html).toContain("white-space: pre-wrap");
      expect(email.html).toContain(multilineMessage);
    });

    test("should include responsive design styles", () => {
      const email = generateAdminSalesNotification(adminEmail, testInquiry);

      expect(email.html).toContain("max-width: 600px");
      expect(email.html).toContain("border-radius:");
      expect(email.html).toContain("padding:");
    });
  });

  describe("Common Email Template Features", () => {
    test("all templates should include THRIVE branding", () => {
      const verificationEmail = generateVerificationEmail(
        "user@example.com",
        "testuser",
        "https://example.com/verify"
      );

      const registrationEmail = generateAdminRegistrationNotification(
        "admin@example.com",
        {
          username: "newuser",
          email: "newuser@example.com",
          registeredAt: new Date(),
        }
      );

      const supportEmail = generateAdminSupportNotification(
        "admin@example.com",
        {
          name: "User",
          email: "user@example.com",
          subject: "Help",
          description: "Need help",
          urgency: "low",
          category: "technical",
          createdAt: new Date(),
        }
      );

      const salesEmail = generateAdminSalesNotification("admin@example.com", {
        name: "User",
        email: "user@example.com",
        organization: "Company",
        interestedModules: [],
        message: "Interested",
        inquiryType: "pricing",
        createdAt: new Date(),
      });

      // All should mention THRIVE
      expect(verificationEmail.html).toContain("THRIVE");
      expect(registrationEmail.html).toContain("THRIVE");
      expect(supportEmail.html).toContain("THRIVE");
      expect(salesEmail.html).toContain("THRIVE");
    });

    test("all templates should have both text and HTML versions", () => {
      const verificationEmail = generateVerificationEmail(
        "user@example.com",
        "testuser",
        "https://example.com/verify"
      );

      const registrationEmail = generateAdminRegistrationNotification(
        "admin@example.com",
        {
          username: "newuser",
          email: "newuser@example.com",
          registeredAt: new Date(),
        }
      );

      expect(verificationEmail.text).toBeTruthy();
      expect(verificationEmail.html).toBeTruthy();
      expect(registrationEmail.text).toBeTruthy();
      expect(registrationEmail.html).toBeTruthy();
    });

    test("all templates should use consistent styling", () => {
      const emails = [
        generateVerificationEmail(
          "user@example.com",
          "testuser",
          "https://example.com/verify"
        ),
        generateAdminRegistrationNotification("admin@example.com", {
          username: "newuser",
          email: "newuser@example.com",
          registeredAt: new Date(),
        }),
        generateAdminSupportNotification("admin@example.com", {
          name: "User",
          email: "user@example.com",
          subject: "Help",
          description: "Need help",
          urgency: "low",
          category: "technical",
          createdAt: new Date(),
        }),
        generateAdminSalesNotification("admin@example.com", {
          name: "User",
          email: "user@example.com",
          organization: "Company",
          interestedModules: [],
          message: "Interested",
          inquiryType: "pricing",
          createdAt: new Date(),
        }),
      ];

      emails.forEach((email) => {
        // All should use consistent container width
        expect(email.html).toContain("max-width: 600px");
        // All should use Arial font
        expect(email.html).toContain("font-family: Arial");
        // All should have horizontal rules
        expect(email.html).toContain("<hr");
      });
    });
  });
});
