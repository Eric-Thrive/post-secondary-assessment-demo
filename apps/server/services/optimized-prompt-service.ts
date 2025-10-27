import { ModuleType } from "../../../packages/db/schema";
import { OptimizedQueries } from "./optimized-queries";
import { promptCache } from "./prompt-cache";
import {
  trackCacheHit,
  trackCacheMiss,
} from "../middleware/performance-monitoring";

/**
 * Optimized prompt service with caching for improved performance
 * Reduces database queries for frequently accessed prompts
 */
export class OptimizedPromptService {
  /**
   * Get prompt sections with caching
   */
  public static async getPromptSections(
    moduleType: ModuleType,
    promptType?: string,
    pathwayType?: string,
    requestId?: string
  ) {
    // Try to get from cache first
    const cachedData = promptCache.get(moduleType, promptType, pathwayType);

    if (cachedData) {
      trackCacheHit(requestId);
      return cachedData;
    }

    // Cache miss - fetch from database
    trackCacheMiss(requestId);

    const data = await OptimizedQueries.getPromptSections(
      moduleType,
      promptType,
      pathwayType
    );

    // Cache the results
    promptCache.set(moduleType, data, promptType, pathwayType);

    return data;
  }

  /**
   * Get system prompt for a specific module and pathway
   */
  public static async getSystemPrompt(
    moduleType: ModuleType,
    pathwayType: "simple" | "complex" = "simple",
    requestId?: string
  ) {
    const prompts = await this.getPromptSections(
      moduleType,
      "system",
      pathwayType,
      requestId
    );

    return prompts.find(
      (p) => p.promptType === "system" && p.pathwayType === pathwayType
    );
  }

  /**
   * Get report format prompt for a specific module and pathway
   */
  public static async getReportFormatPrompt(
    moduleType: ModuleType,
    pathwayType: "simple" | "complex" = "simple",
    requestId?: string
  ) {
    const prompts = await this.getPromptSections(
      moduleType,
      "report_format",
      pathwayType,
      requestId
    );

    return prompts.find(
      (p) => p.promptType === "report_format" && p.pathwayType === pathwayType
    );
  }

  /**
   * Get all prompts for a module (used for admin interfaces)
   */
  public static async getAllPromptsForModule(
    moduleType: ModuleType,
    requestId?: string
  ) {
    return await this.getPromptSections(
      moduleType,
      undefined,
      undefined,
      requestId
    );
  }

  /**
   * Invalidate cache for a specific module (call after prompt updates)
   */
  public static invalidateModuleCache(moduleType: ModuleType) {
    promptCache.invalidateModule(moduleType);
  }

  /**
   * Warm up cache with commonly used prompts
   */
  public static async warmUpCache() {
    const modules = [
      ModuleType.K12,
      ModuleType.POST_SECONDARY,
      ModuleType.TUTORING,
    ];
    const promptTypes = ["system", "report_format"];
    const pathwayTypes = ["simple", "complex"];

    console.log("Warming up prompt cache...");

    for (const moduleType of modules) {
      for (const promptType of promptTypes) {
        for (const pathwayType of pathwayTypes) {
          try {
            await this.getPromptSections(moduleType, promptType, pathwayType);
          } catch (error) {
            console.warn(
              `Failed to warm up cache for ${moduleType}/${promptType}/${pathwayType}:`,
              error
            );
          }
        }
      }
    }

    console.log("Prompt cache warm-up completed");
  }

  /**
   * Get cache statistics for monitoring
   */
  public static getCacheStats() {
    return promptCache.getStats();
  }

  /**
   * Clear all cached prompts (use with caution)
   */
  public static clearCache() {
    promptCache.clear();
  }
}
