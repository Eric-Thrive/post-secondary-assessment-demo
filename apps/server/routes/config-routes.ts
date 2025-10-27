import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { ModuleType } from "@shared/schema";
import { requireAuth } from "../auth";
import { ModuleGate } from "../permissions/gates/module-gate";

export function registerConfigRoutes(app: Express): void {
  // Prompt Sections - Direct database query with proper transformation
  app.get(
    "/api/prompt-sections",
    requireAuth,
    (req, res, next) => {
      // Add module access validation
      const moduleType =
        (req.query.moduleType as ModuleType) || ModuleType.POST_SECONDARY;
      if (Object.values(ModuleType).includes(moduleType)) {
        return ModuleGate.requireModuleAccess(moduleType)(req, res, next);
      }
      return res.status(400).json({ error: "Invalid module type" });
    },
    async (req, res) => {
      try {
        const moduleType = (req.query.moduleType as string) || "post_secondary";
        const promptType = req.query.promptType as string | undefined;
        console.log(
          `DEBUG: Fetching prompt sections from database for: ${moduleType}, type: ${
            promptType || "all"
          }`
        );

        const sections = await storage.getPromptSections(
          moduleType,
          promptType
        );
        console.log(
          `DEBUG: Found ${sections.length} prompt sections in database`
        );

        if (sections.length === 0) {
          console.log(`DEBUG: No sections found, returning empty array`);
          res.json([]);
          return;
        }

        // Transform database results to match frontend expectations
        const transformedSections = sections.map(
          (section: any, index: number) => ({
            id: String(index + 1),
            section_key: section.section_key,
            section_name:
              section.section_name ||
              `${section.section_key
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l: string) => l.toUpperCase())}`,
            content: section.content,
            version: section.version || "1.0",
            module_type: section.module_type,
            prompt_type: section.prompt_type,
            created_at: section.created_at,
            last_updated: section.last_updated,
          })
        );

        console.log(
          `DEBUG: Returning ${transformedSections.length} prompt sections for ${moduleType}`
        );
        console.log(
          `DEBUG: Section keys: ${transformedSections
            .map((s) => s.section_key)
            .join(", ")}`
        );
        res.json(transformedSections);
      } catch (error: any) {
        console.error(
          `ERROR: Failed to fetch prompt sections for ${req.query.moduleType}:`,
          error
        );
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Prompt Sections - Path parameter format for backward compatibility
  app.get("/api/prompt-sections/:moduleType", async (req, res) => {
    try {
      const { moduleType } = req.params;
      console.log(
        `DEBUG: Fetching prompt sections from database for: ${moduleType}`
      );

      const sections = await storage.getPromptSections(moduleType);
      console.log(
        `DEBUG: Found ${sections.length} prompt sections in database`
      );

      if (sections.length === 0) {
        console.log(`DEBUG: No sections found, returning empty array`);
        res.json([]);
        return;
      }

      // Transform database results to match frontend expectations
      const transformedSections = sections.map(
        (section: any, index: number) => ({
          id: String(index + 1),
          section_key: section.section_key,
          section_name:
            section.section_name ||
            `${section.section_key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l: string) => l.toUpperCase())}`,
          content: section.content,
          version: section.version || "1.0",
          module_type: section.module_type,
          created_at: section.created_at,
          last_updated: section.last_updated,
        })
      );

      console.log(
        `DEBUG: Returning ${transformedSections.length} prompt sections for ${moduleType}`
      );
      console.log(
        `DEBUG: Section keys: ${transformedSections
          .map((s) => s.section_key)
          .join(", ")}`
      );

      // Add cache-busting headers to ensure frontend gets fresh data
      res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        ETag: `"${Date.now()}"`, // Force fresh response
      });

      res.json(transformedSections);
    } catch (error: any) {
      console.error(
        `ERROR: Failed to fetch prompt sections for ${req.params.moduleType}:`,
        error
      );
      res.status(500).json({ error: error.message });
    }
  });

  // Update prompt section
  app.patch("/api/prompt-sections/:sectionKey", async (req, res) => {
    try {
      const { sectionKey } = req.params;
      const { content, promptType } = req.body;
      console.log(
        `Updating prompt section: ${sectionKey}, type: ${
          promptType || "not specified"
        }`
      );
      const section = await storage.updatePromptSection(
        sectionKey,
        content,
        promptType
      );
      res.json(section);
    } catch (error: any) {
      console.error("Error updating prompt section:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Save prompt section (PUT for create/update)
  app.put("/api/prompt-sections/:sectionKey", async (req, res) => {
    try {
      const { sectionKey } = req.params;
      const { content, module_type, execution_order, is_system_prompt } =
        req.body;
      console.log(
        `Saving prompt section: ${sectionKey}, module: ${
          module_type || "post_secondary"
        }`
      );

      // Use updatePromptSection for now - it handles both create and update
      const section = await storage.updatePromptSection(sectionKey, content);
      res.json(section);
    } catch (error: any) {
      console.error("Error saving prompt section:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Add missing API endpoints
  app.get("/api/lookup-tables/:moduleType", async (req, res) => {
    try {
      const { moduleType } = req.params;
      const tables = await storage.getLookupTables(moduleType);
      res.json(tables);
    } catch (error: any) {
      console.error("Error fetching lookup tables:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/ai-config", async (req, res) => {
    try {
      const config = await storage.getAiConfig();
      res.json(config);
    } catch (error: any) {
      console.error("Error fetching AI config:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/barrier-glossary/:moduleType", async (req, res) => {
    try {
      const { moduleType } = req.params;
      const glossary = await storage.getBarrierGlossary(moduleType);
      res.json(glossary);
    } catch (error: any) {
      console.error("Error fetching barrier glossary:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/inference-triggers/:moduleType", async (req, res) => {
    try {
      const { moduleType } = req.params;
      const triggers = await storage.getInferenceTriggers(moduleType);
      res.json(triggers);
    } catch (error: any) {
      console.error("Error fetching inference triggers:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/plain-language-mappings/:moduleType", async (req, res) => {
    try {
      const { moduleType } = req.params;
      const mappings = await storage.getPlainLanguageMappings(moduleType);
      res.json(mappings);
    } catch (error: any) {
      console.error("Error fetching plain language mappings:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/mapping-configurations/:moduleType", async (req, res) => {
    try {
      const { moduleType } = req.params;
      const configurations = await storage.getMappingConfigurations(moduleType);
      res.json(configurations);
    } catch (error: any) {
      console.error("Error fetching mapping configurations:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Simplified configuration endpoint for RBAC system
  app.get("/api/config/environment", (req: Request, res: Response) => {
    console.log(`🌍 Environment config requested (RBAC system)`);
    const nodeEnv = process.env.NODE_ENV || "production";

    // In the RBAC system, there's no environment switching or module locking
    // All access control is handled by user roles
    res.json({
      environment: "production", // Simplified to single environment
      rawEnvironment: nodeEnv,
      isLocked: false, // No environment locking in RBAC system
      isDemoMode: false, // Demo mode handled by user roles
      module: null, // No module locking in RBAC system
    });
  });
}
