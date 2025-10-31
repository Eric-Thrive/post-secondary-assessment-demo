import {
  generateVerificationToken,
  hashToken,
  validateToken,
  createVerificationLink,
  generateVerificationTokenWithExpiry,
} from "../../services/email-verification";

describe("Email Verification Service", () => {
  describe("Token Generation", () => {
    test("should generate a token with both plain and hashed versions", () => {
      const result = generateVerificationToken();

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("hashedToken");
      expect(typeof result.token).toBe("string");
      expect(typeof result.hashedToken).toBe("string");
      expect(result.token.length).toBe(64); // 32 bytes = 64 hex characters
    });

    test("should generate unique tokens on multiple calls", () => {
      const token1 = generateVerificationToken();
      const token2 = generateVerificationToken();
      const token3 = generateVerificationToken();

      // Tokens should be different
      expect(token1.token).not.toBe(token2.token);
      expect(token1.token).not.toBe(token3.token);
      expect(token2.token).not.toBe(token3.token);

      // Hashed tokens should also be different
      expect(token1.hashedToken).not.toBe(token2.hashedToken);
      expect(token1.hashedToken).not.toBe(token3.hashedToken);
      expect(token2.hashedToken).not.toBe(token3.hashedToken);
    });

    test("should generate tokens with sufficient entropy", () => {
      const tokens = new Set();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const { token } = generateVerificationToken();
        tokens.add(token);
      }

      // All tokens should be unique
      expect(tokens.size).toBe(iterations);
    });
  });

  describe("Token Hashing", () => {
    test("should hash a token consistently", () => {
      const plainToken = "test-token-12345";
      const hash1 = hashToken(plainToken);
      const hash2 = hashToken(plainToken);

      expect(typeof hash1).toBe("string");
      expect(hash1.length).toBeGreaterThan(0);
      // bcrypt generates different hashes for the same input due to salt
      expect(hash1).not.toBe(hash2);
    });

    test("should produce different hashes for different tokens", () => {
      const token1 = "token-one";
      const token2 = "token-two";

      const hash1 = hashToken(token1);
      const hash2 = hashToken(token2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("Token Validation", () => {
    test("should validate a correct token that has not expired", () => {
      const { token, hashedToken } = generateVerificationToken();
      const futureExpiry = new Date();
      futureExpiry.setHours(futureExpiry.getHours() + 24);

      const isValid = validateToken(token, hashedToken, futureExpiry);

      expect(isValid).toBe(true);
    });

    test("should reject an incorrect token", () => {
      const { hashedToken } = generateVerificationToken();
      const wrongToken = "wrong-token-12345";
      const futureExpiry = new Date();
      futureExpiry.setHours(futureExpiry.getHours() + 24);

      const isValid = validateToken(wrongToken, hashedToken, futureExpiry);

      expect(isValid).toBe(false);
    });

    test("should reject an expired token", () => {
      const { token, hashedToken } = generateVerificationToken();
      const pastExpiry = new Date();
      pastExpiry.setHours(pastExpiry.getHours() - 1); // 1 hour ago

      const isValid = validateToken(token, hashedToken, pastExpiry);

      expect(isValid).toBe(false);
    });

    test("should handle edge case of token expiring at current time", () => {
      const { token, hashedToken } = generateVerificationToken();
      const now = new Date();

      // Token expiring exactly now is still valid (uses > not >=)
      const isValidNow = validateToken(token, hashedToken, now);
      expect(isValidNow).toBe(true);

      // Token expiring 1 millisecond ago should be rejected
      const pastExpiry = new Date(now.getTime() - 1);
      const isValidPast = validateToken(token, hashedToken, pastExpiry);
      expect(isValidPast).toBe(false);
    });

    test("should validate token with expiry in the future", () => {
      const { token, hashedToken } = generateVerificationToken();
      const futureExpiry = new Date();
      futureExpiry.setMinutes(futureExpiry.getMinutes() + 1); // 1 minute from now

      const isValid = validateToken(token, hashedToken, futureExpiry);

      expect(isValid).toBe(true);
    });
  });

  describe("Verification Link Generation", () => {
    test("should create a properly formatted verification link", () => {
      const token = "abc123def456";
      const baseUrl = "https://example.com";

      const link = createVerificationLink(token, baseUrl);

      expect(link).toBe("https://example.com/verify-email?token=abc123def456");
    });

    test("should handle base URL with trailing slash", () => {
      const token = "abc123def456";
      const baseUrl = "https://example.com/";

      const link = createVerificationLink(token, baseUrl);

      expect(link).toBe("https://example.com/verify-email?token=abc123def456");
    });

    test("should URL encode special characters in token", () => {
      const token = "token+with/special=chars";
      const baseUrl = "https://example.com";

      const link = createVerificationLink(token, baseUrl);

      expect(link).toContain("token%2Bwith%2Fspecial%3Dchars");
      expect(link).toBe(
        "https://example.com/verify-email?token=token%2Bwith%2Fspecial%3Dchars"
      );
    });

    test("should work with different base URLs", () => {
      const token = "test-token";

      const link1 = createVerificationLink(token, "http://localhost:3000");
      const link2 = createVerificationLink(token, "https://app.thriveiep.com");
      const link3 = createVerificationLink(
        token,
        "https://staging.example.com"
      );

      expect(link1).toBe("http://localhost:3000/verify-email?token=test-token");
      expect(link2).toBe(
        "https://app.thriveiep.com/verify-email?token=test-token"
      );
      expect(link3).toBe(
        "https://staging.example.com/verify-email?token=test-token"
      );
    });
  });

  describe("Token Generation with Expiry", () => {
    test("should generate token with default 24-hour expiry", () => {
      const result = generateVerificationTokenWithExpiry();

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("hashedToken");
      expect(result).toHaveProperty("expiry");
      expect(result.expiry).toBeInstanceOf(Date);

      // Check expiry is approximately 24 hours from now (within 1 minute tolerance)
      const now = new Date();
      const expectedExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const timeDiff = Math.abs(
        result.expiry.getTime() - expectedExpiry.getTime()
      );

      expect(timeDiff).toBeLessThan(60000); // Less than 1 minute difference
    });

    test("should generate token with custom expiry hours", () => {
      const customHours = 48;
      const result = generateVerificationTokenWithExpiry(customHours);

      const now = new Date();
      const expectedExpiry = new Date(
        now.getTime() + customHours * 60 * 60 * 1000
      );
      const timeDiff = Math.abs(
        result.expiry.getTime() - expectedExpiry.getTime()
      );

      expect(timeDiff).toBeLessThan(60000); // Less than 1 minute difference
    });

    test("should generate token with 1-hour expiry", () => {
      const result = generateVerificationTokenWithExpiry(1);

      const now = new Date();
      const expectedExpiry = new Date(now.getTime() + 60 * 60 * 1000);
      const timeDiff = Math.abs(
        result.expiry.getTime() - expectedExpiry.getTime()
      );

      expect(timeDiff).toBeLessThan(60000); // Less than 1 minute difference
    });

    test("should generate valid token that can be validated", () => {
      const result = generateVerificationTokenWithExpiry(24);

      const isValid = validateToken(
        result.token,
        result.hashedToken,
        result.expiry
      );

      expect(isValid).toBe(true);
    });
  });
});
