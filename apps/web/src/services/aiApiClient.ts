import { AIAnalysisRequest } from "@/types/aiAnalysis";

export class AIApiClient {
  private static readonly SERVER_API_URL = "/api";

  // Test connection to the server API
  static async testConnection(): Promise<boolean> {
    try {
      console.log("=== SERVER API CONNECTIVITY TEST ===");
      console.log("Testing server API endpoint...");

      const response = await fetch(`${this.SERVER_API_URL}/test-connection`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        console.error(
          "❌ Server API test failed:",
          response.status,
          response.statusText
        );
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(
          `Server API not ready: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("✅ Server API test result:", data);

      return data.success || data.connected;
    } catch (error: any) {
      console.error("❌ Server API connectivity test failed:", error);
      return false;
    }
  }

  // Call the analysis API through the server
  static async callAnalysisAPI(request: AIAnalysisRequest): Promise<any> {
    console.log("=== CALLING SERVER API FOR ANALYSIS ===");
    console.log("Request structure:", {
      documentCount: request.documentContents?.length || 0,
      hasStudentGrade: !!request.studentGrade,
      moduleType: request.moduleType,
    });

    try {
      let response: Response;

      // Get current environment from localStorage
      const currentEnvironment =
        localStorage.getItem("app-environment") || "replit-prod";
      console.log("🌍 Sending environment to server:", currentEnvironment);

      console.log(
        "Making POST request to server API:",
        `${this.SERVER_API_URL}/analyze-assessment`
      );

      response = await fetch(`${this.SERVER_API_URL}/analyze-assessment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...request,
          environment: currentEnvironment, // Also pass in body
        }),
        signal: AbortSignal.timeout(300000), // 5 minute timeout for AI analysis
      });

      console.log("Analysis response status:", response.status);
      console.log("Analysis response ok:", response.ok);

      if (!response.ok) {
        let errorText = "Unknown error";
        try {
          errorText = await response.text();
        } catch (textError) {
          console.warn("Failed to read error response text:", textError);
          errorText = `HTTP ${response.status} - Unable to read error details`;
        }
        console.error("Analysis API error response:", errorText);
        throw new Error(`Analysis failed: ${response.status} - ${errorText}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse analysis response as JSON:", jsonError);
        const text = await response
          .text()
          .catch(() => "Unable to read response");
        console.error("Raw response text:", text.slice(0, 500));
        throw new Error(
          `Analysis API returned invalid JSON: ${
            jsonError instanceof Error
              ? jsonError.message
              : "JSON parsing failed"
          }`
        );
      }

      console.log("✅ Analysis completed successfully");
      console.log("Response structure:", {
        hasResults: !!result,
        hasAnalysisResult: !!result?.analysis_result,
        hasMarkdown: !!result?.markdown_report,
      });

      // Validate essential response structure
      if (!result || typeof result !== "object") {
        console.warn(
          "⚠️ Unexpected analysis response structure, using fallback"
        );
        return {
          status: "completed",
          analysis_date: new Date().toISOString(),
          markdown_report:
            "# Analysis Completed\n\nAnalysis completed but response structure was unexpected.",
          analysis_result: result || {},
        };
      }

      return result;
    } catch (error: any) {
      console.error("❌ Analysis API call failed:", error);
      throw error;
    }
  }
}
