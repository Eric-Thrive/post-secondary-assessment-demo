import {
  normalizeEnvironment,
  isDemoEnvironment,
  getModuleFromEnvironment,
  isEnvironment,
  getEnvironmentStatus,
} from "../../utils/environmentDetection";

describe("Utility Functions", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe("Environment Normalization", () => {
    test("should normalize environment strings", () => {
      expect(normalizeEnvironment("POST_SECONDARY_DEMO")).toBe(
        "post-secondary-demo"
      );
      expect(normalizeEnvironment("post_secondary_demo")).toBe(
        "post-secondary-demo"
      );
      expect(normalizeEnvironment("PRODUCTION")).toBe("production");
      expect(normalizeEnvironment(undefined)).toBe("production");
    });

    test("should handle empty and undefined values", () => {
      expect(normalizeEnvironment("")).toBe("production");
      expect(normalizeEnvironment(undefined)).toBe("production");
    });
  });

  describe("Demo Environment Detection", () => {
    test("should detect demo environment from NODE_ENV", () => {
      process.env.NODE_ENV = "post-secondary-demo";
      expect(isDemoEnvironment()).toBe(true);
    });

    test("should detect demo environment from POST_SECONDARY_DEMO flag", () => {
      process.env.POST_SECONDARY_DEMO = "true";
      expect(isDemoEnvironment()).toBe(true);

      process.env.POST_SECONDARY_DEMO = "1";
      expect(isDemoEnvironment()).toBe(true);
    });

    test("should return false for production environment", () => {
      process.env.NODE_ENV = "production";
      delete process.env.POST_SECONDARY_DEMO;
      expect(isDemoEnvironment()).toBe(false);
    });
  });

  describe("Module Detection", () => {
    test("should detect post-secondary module", () => {
      process.env.NODE_ENV = "post-secondary-demo";
      expect(getModuleFromEnvironment()).toBe("post_secondary");
    });

    test("should detect k12 module", () => {
      process.env.NODE_ENV = "k12-demo";
      expect(getModuleFromEnvironment()).toBe("k12");
    });

    test("should detect tutoring module", () => {
      process.env.NODE_ENV = "tutoring-demo";
      expect(getModuleFromEnvironment()).toBe("tutoring");
    });

    test("should default to general for unknown environments", () => {
      process.env.NODE_ENV = "production";
      expect(getModuleFromEnvironment()).toBe("general");
    });
  });

  describe("Environment Status", () => {
    test("should return complete environment status", () => {
      process.env.NODE_ENV = "post-secondary-demo";
      const status = getEnvironmentStatus();

      expect(status.raw).toBe("post-secondary-demo");
      expect(status.normalized).toBe("post-secondary-demo");
      expect(status.isDemo).toBe(true);
      expect(status.module).toBe("post_secondary");
    });
  });
});
