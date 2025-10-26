import { Express } from "express";
import { storage } from "../storage.js";

export function registerDebugRoutes(app: Express): void {
  // Debug endpoint to get the latest case markdown
  app.get("/api/debug/latest-markdown", async (req, res) => {
    try {
      const cases = await storage.getAssessmentCases("post_secondary");

      if (!cases || cases.length === 0) {
        return res.status(404).json({ error: "No cases found" });
      }

      // Get the most recent case
      const latestCase = cases[0];

      res.setHeader("Content-Type", "text/plain");
      res.send(
        latestCase.report_data || latestCase.reportData || "No markdown found"
      );
    } catch (error: any) {
      console.error("Debug markdown error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Debug endpoint to check prompts
  app.get("/api/debug/prompts/:moduleType", async (req, res) => {
    try {
      const { moduleType } = req.params;

      const prompts = await storage.getPromptSections(moduleType);

      const promptInfo = prompts.map((p) => ({
        section_key: p.section_key,
        section_name: p.section_name,
        module_type: p.module_type,
        content_length: p.content ? p.content.length : 0,
        prompt_type: p.prompt_type || "not set",
      }));

      res.json({
        module_type: moduleType,
        count: promptInfo.length,
        prompts: promptInfo,
      });
    } catch (error: any) {
      console.error("Debug prompts error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
