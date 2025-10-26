import { getEnvironmentConfig } from "../../config/environment";

describe("Configuration Tests", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe("Environment Configuration", () => {
    test("should return valid environment configuration", () => {
      const config = getEnvironmentConfig();
      expect(config).toHaveProperty("isDevelopment");
      expect(config).toHaveProperty("isProduction");
      expect(config).toHaveProperty("aiPipelineMode");
      expect(config).toHaveProperty("database");
      expect(config).toHaveProperty("openai");
    });

    test("should detect development environment correctly", () => {
      process.env.NODE_ENV = "development";
      const config = getEnvironmentConfig();
      expect(config.isDevelopment).toBe(true);
      expect(config.isProduction).toBe(false);
    });

    test("should detect production environment correctly", () => {
      process.env.NODE_ENV = "production";
      const config = getEnvironmentConfig();
      expect(config.isDevelopment).toBe(false);
      expect(config.isProduction).toBe(true);
    });
  });

  describe("Database Configuration", () => {
    test("should return valid database configuration", () => {
      const config = getDatabaseConfig();
      expect(config).toHaveProperty("url");
      expect(config).toHaveProperty("name");
      expect(config).toHaveProperty("description");
      expect(typeof config.url).toBe("string");
      expect(typeof config.name).toBe("string");
    });

    test("should handle demo environment detection", () => {
      // Test that the functions exist and can be called
      expect(typeof isReadOnlyEnvironment).toBe("function");
      expect(typeof isDemoEnvironment).toBe("function");

      // These functions depend on environment variables that may not be set in tests
      expect(() => isReadOnlyEnvironment()).not.toThrow();
      expect(() => isDemoEnvironment()).not.toThrow();
    });
  });
});
