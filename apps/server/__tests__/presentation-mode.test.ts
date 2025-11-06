import { describe, it, expect, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import { presentationModeAuth } from "../auth";

describe("Presentation Mode Tests", () => {
  it("should grant access with valid token", async () => {
    const mockReq = {
      query: { p: "test-token" },
      session: {} as any,
      ip: "127.0.0.1",
      get: vi.fn().mockReturnValue("test-agent"),
      originalUrl: "/test",
      method: "GET",
      sessionID: "test-session",
    } as Partial<Request>;

    const mockRes = {} as Response;
    const mockNext = vi.fn();

    process.env.PRESENTATION_MODE_TOKEN = "test-token";

    await presentationModeAuth(mockReq as Request, mockRes, mockNext);

    expect(mockReq.session?.userId).toBe(-1);
    expect(mockReq.session?.presentationMode).toBe(true);
    expect(mockNext).toHaveBeenCalled();
  });
});
