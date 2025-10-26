import { performanceMonitor } from "./performanceMonitor";
import OpenAI from "openai";

export interface AICallMetrics {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  duration: number;
  cost: number;
  moduleType?: string;
  pathwayType?: string;
  userId?: number;
  customerId?: string;
  endpoint?: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Token pricing for OpenAI models (per 1K tokens)
 * Updated as of October 2024
 */
const TOKEN_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4": { input: 0.03, output: 0.06 },
  "gpt-4-turbo": { input: 0.01, output: 0.03 },
  "gpt-4-turbo-preview": { input: 0.01, output: 0.03 },
  "gpt-4-1106-preview": { input: 0.01, output: 0.03 },
  "gpt-4-0125-preview": { input: 0.01, output: 0.03 },
  "gpt-4o": { input: 0.005, output: 0.015 },
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "gpt-3.5-turbo": { input: 0.0015, output: 0.002 },
  "gpt-3.5-turbo-1106": { input: 0.001, output: 0.002 },
  "gpt-3.5-turbo-0125": { input: 0.0005, output: 0.0015 },
};

/**
 * Calculate cost for OpenAI API call
 */
function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = TOKEN_PRICING[model] || TOKEN_PRICING["gpt-4"]; // Default to GPT-4 pricing

  const inputCost = (promptTokens / 1000) * pricing.input;
  const outputCost = (completionTokens / 1000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Normalize model name for pricing lookup
 */
function normalizeModelName(model: string): string {
  // Handle common model name variations
  if (model.includes("gpt-4o-mini")) return "gpt-4o-mini";
  if (model.includes("gpt-4o")) return "gpt-4o";
  if (model.includes("gpt-4-turbo")) return "gpt-4-turbo";
  if (model.includes("gpt-4-1106")) return "gpt-4-1106-preview";
  if (model.includes("gpt-4-0125")) return "gpt-4-0125-preview";
  if (model.includes("gpt-4")) return "gpt-4";
  if (model.includes("gpt-3.5-turbo-1106")) return "gpt-3.5-turbo-1106";
  if (model.includes("gpt-3.5-turbo-0125")) return "gpt-3.5-turbo-0125";
  if (model.includes("gpt-3.5-turbo")) return "gpt-3.5-turbo";

  return model;
}

/**
 * Monitored OpenAI client wrapper
 */
export class MonitoredOpenAI {
  private client: OpenAI;
  private defaultContext: Partial<AICallMetrics>;

  constructor(client: OpenAI, context: Partial<AICallMetrics> = {}) {
    this.client = client;
    this.defaultContext = context;
  }

  /**
   * Monitored chat completions create method
   */
  async createChatCompletion(
    params: OpenAI.Chat.Completions.ChatCompletionCreateParams,
    context: Partial<AICallMetrics> = {}
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const startTime = Date.now();
    const mergedContext = { ...this.defaultContext, ...context };

    try {
      const completion = await this.client.chat.completions.create(params);
      const duration = Date.now() - startTime;

      // Extract token usage
      const usage = completion.usage;
      const promptTokens = usage?.prompt_tokens || 0;
      const completionTokens = usage?.completion_tokens || 0;
      const totalTokens =
        usage?.total_tokens || promptTokens + completionTokens;

      // Calculate cost
      const normalizedModel = normalizeModelName(params.model);
      const cost = calculateCost(
        normalizedModel,
        promptTokens,
        completionTokens
      );

      // Record metrics
      await this.recordAIMetrics({
        model: params.model,
        promptTokens,
        completionTokens,
        totalTokens,
        duration,
        cost,
        success: true,
        ...mergedContext,
      });

      return completion;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Record failed metrics
      await this.recordAIMetrics({
        model: params.model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        duration,
        cost: 0,
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        ...mergedContext,
      });

      throw error;
    }
  }

  /**
   * Record AI processing metrics
   */
  private async recordAIMetrics(metrics: AICallMetrics): Promise<void> {
    try {
      await performanceMonitor.recordMetric({
        metricType: "ai_processing",
        endpoint: metrics.endpoint || "openai-chat-completion",
        duration: metrics.duration,
        tokenUsage: metrics.totalTokens,
        cost: metrics.cost.toFixed(6), // Store cost with 6 decimal precision
        moduleType: metrics.moduleType,
        pathwayType: metrics.pathwayType,
        userId: metrics.userId,
        customerId: metrics.customerId,
        errorMessage: metrics.errorMessage,
        metadata: {
          model: metrics.model,
          promptTokens: metrics.promptTokens,
          completionTokens: metrics.completionTokens,
          totalTokens: metrics.totalTokens,
          success: metrics.success,
          costBreakdown: {
            inputCost: (
              (metrics.promptTokens / 1000) *
              (TOKEN_PRICING[normalizeModelName(metrics.model)]?.input || 0)
            ).toFixed(6),
            outputCost: (
              (metrics.completionTokens / 1000) *
              (TOKEN_PRICING[normalizeModelName(metrics.model)]?.output || 0)
            ).toFixed(6),
            totalCost: metrics.cost.toFixed(6),
          },
        },
      });
    } catch (error) {
      console.error("Failed to record AI metrics:", error);
    }
  }

  /**
   * Get the underlying OpenAI client for direct access if needed
   */
  get rawClient(): OpenAI {
    return this.client;
  }
}

/**
 * Create a monitored OpenAI client
 */
export function createMonitoredOpenAI(
  client: OpenAI,
  context: Partial<AICallMetrics> = {}
): MonitoredOpenAI {
  return new MonitoredOpenAI(client, context);
}

/**
 * AI cost tracking utilities
 */
export class AICostTracker {
  /**
   * Get AI processing costs by module and pathway
   */
  static async getCostsByModule(hours: number = 24): Promise<
    Array<{
      moduleType: string;
      pathwayType: string;
      totalCost: number;
      totalTokens: number;
      callCount: number;
      avgCostPerCall: number;
    }>
  > {
    // This would query the performance metrics table
    // Implementation would be similar to the performance monitor queries
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Get cost trends over time
   */
  static async getCostTrends(days: number = 7): Promise<
    Array<{
      date: string;
      totalCost: number;
      totalTokens: number;
      callCount: number;
    }>
  > {
    // Implementation would query performance metrics grouped by date
    return [];
  }

  /**
   * Check if cost thresholds are exceeded
   */
  static async checkCostThresholds(): Promise<{
    dailyThresholdExceeded: boolean;
    monthlyThresholdExceeded: boolean;
    currentDailyCost: number;
    currentMonthlyCost: number;
  }> {
    // Implementation would check against configured thresholds
    return {
      dailyThresholdExceeded: false,
      monthlyThresholdExceeded: false,
      currentDailyCost: 0,
      currentMonthlyCost: 0,
    };
  }
}

/**
 * Alert thresholds for AI processing costs
 */
export const AI_COST_THRESHOLDS = {
  DAILY_COST_LIMIT: 100, // $100 per day
  MONTHLY_COST_LIMIT: 2000, // $2000 per month
  HIGH_COST_PER_CALL: 5, // $5 per call
  SLOW_RESPONSE_TIME: 30000, // 30 seconds
};

/**
 * Check if AI processing metrics exceed alert thresholds
 */
export function checkAIAlerts(metrics: AICallMetrics): {
  alerts: string[];
  severity: "low" | "medium" | "high";
} {
  const alerts: string[] = [];
  let severity: "low" | "medium" | "high" = "low";

  // Check cost per call
  if (metrics.cost > AI_COST_THRESHOLDS.HIGH_COST_PER_CALL) {
    alerts.push(`High cost per call: $${metrics.cost.toFixed(2)}`);
    severity = "high";
  }

  // Check response time
  if (metrics.duration > AI_COST_THRESHOLDS.SLOW_RESPONSE_TIME) {
    alerts.push(`Slow response time: ${metrics.duration}ms`);
    if (severity === "low") severity = "medium";
  }

  // Check for errors
  if (!metrics.success) {
    alerts.push(`AI processing failed: ${metrics.errorMessage}`);
    severity = "high";
  }

  return { alerts, severity };
}
