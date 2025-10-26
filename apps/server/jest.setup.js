// Jest setup file for server tests
const { config } = require("dotenv");
const path = require("path");

// Load environment variables from the root .env file
config({ path: path.resolve(__dirname, "../../.env") });

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.APP_ENVIRONMENT = "test";

// Mock external services for testing
jest.mock("./services/sendgrid", () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock OpenAI service
jest.mock("openai", () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: "Mock AI response" } }],
          }),
        },
      },
    })),
  };
});

// Mock Redis for testing
jest.mock("ioredis", () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    disconnect: jest.fn(),
  };
  return jest.fn(() => mockRedis);
});

// Global test timeout
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
