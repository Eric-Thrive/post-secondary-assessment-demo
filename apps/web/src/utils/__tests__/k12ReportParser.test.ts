import { describe, it, expect } from "vitest";
import { parseK12Report } from "@/utils/k12ReportParser";

describe("K12 Report Parser", () => {
  it("should parse basic report data", () => {
    const markdown = `
# Student Support Report
Student Name: Sarah Johnson
Grade: 5th Grade
## Student Overview
Sarah is a bright student.
    `;

    const result = parseK12Report(markdown);
    expect(result.caseInfo.studentName).toBe("Sarah Johnson");
    expect(result.caseInfo.grade).toBe("5th Grade");
  });

  it("should handle empty input", () => {
    const result = parseK12Report("");
    expect(result.caseInfo.studentName).toBe("Student");
  });
});
