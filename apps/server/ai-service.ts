// @ts-nocheck
// Alternative Approach 1: Direct Node.js OpenAI Integration
// Bypass Database Edge Functions entirely and implement GPT-4.1 locally

import OpenAI from "openai";
import { storage } from "./storage";
import {
  getEffectivePathway,
  validateReportCategories,
  postSecondaryPathwayConfig,
} from "./config/postSecondaryPathways";
import { isDemoEnvironment } from "./utils/environmentDetection";

export interface AIAnalysisRequest {
  caseId: string;
  moduleType: "k12" | "post_secondary";
  pathway?: "simple" | "complex"; // New: pathway selection
  documents: Array<{
    filename: string;
    content: string;
  }>;
  uniqueId?: string;
  programMajor?: string;
  reportAuthor?: string;
  studentGrade?: string;
}

interface AIAnalysisResult {
  status: "completed" | "failed";
  analysis_date: string;
  markdown_report: string;
  module_type: string;
  item_master_data?: any[];
  error_message?: string;
}

export class LocalAIService {
  private openai: OpenAI;

  constructor() {
    // Use OPENAI_API_KEY environment variable
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }

    console.log(
      "✅ Using OPENAI_API_KEY environment variable: [KEY_CONFIGURED]"
    );

    // Primary model: GPT-4.1, Fallback: GPT-4.1 (as per user requirements)
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async processAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    console.log("🤖 Starting local GPT-4 analysis with AI handler logic...");
    console.log("Module type:", request.moduleType);
    console.log("Document count:", request.documents.length);

    try {
      // Step 1: Load AI configuration from database
      const aiConfigData = await this.loadAIConfiguration(request.moduleType);
      const aiConfig = aiConfigData || {
        model_name: "gpt-4.1", // Default to GPT-4.1 if no config found
        max_tokens: 4000,
        temperature: 0.3,
      };

      console.log("Using AI Config:", aiConfig);

      // Step 2: Build comprehensive prompt with AI handler logic
      const systemPrompt = await this.buildSystemPrompt(
        request.moduleType,
        request.pathway || "complex"
      );
      const userPrompt = this.buildUserPrompt(
        request.documents,
        request.uniqueId
      );

      // Step 3: Call GPT-4 with function calling capabilities (AI Handler Implementation)
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

      let completion;

      // Determine pathway - dev users can still use complex, others default to simple
      let effectivePathway: string;
      if (request.moduleType === "post_secondary") {
        // Use isolated post-secondary configuration with improved demo detection
        const isDemoEnv = isDemoEnvironment();
        effectivePathway = getEffectivePathway(request.pathway, isDemoEnv);
        console.log(
          `🎯 Post-Secondary: Using ${effectivePathway} pathway (demo: ${isDemoEnv}, requested: ${request.pathway}, env: ${process.env.NODE_ENV})`
        );
      } else if (request.moduleType === "tutoring") {
        // Tutoring always uses simple
        effectivePathway = "simple";
        console.log(`🎯 Tutoring: Using simple pathway`);
      } else {
        // Other modules (K-12, etc.) use request pathway or default to simple (was complex)
        effectivePathway = request.pathway || "simple";
        console.log(
          `🎯 ${request.moduleType}: Using ${effectivePathway} pathway`
        );
      }

      try {
        // Try primary model (GPT-4.1)
        console.log(
          `Attempting AI analysis with primary model: ${aiConfig.model_name}`
        );

        if (effectivePathway === "simple") {
          console.log(
            "🎯 Simple pathway: Generating complete report without function calls"
          );
          completion = await this.openai.chat.completions.create({
            model: aiConfig.model_name,
            messages: messages,
            max_tokens: aiConfig.max_tokens,
            temperature: aiConfig.temperature,
            // No tools - generate complete report directly
          });
        } else {
          console.log(
            "🎯 Complex pathway: Using function calls for multi-step analysis"
          );
          completion = await this.openai.chat.completions.create({
            model: aiConfig.model_name,
            messages: messages,
            max_tokens: aiConfig.max_tokens,
            temperature: aiConfig.temperature,
            tools: this.getFunctionDefinitions(request.moduleType),
            tool_choice: "auto",
          });
        }
      } catch (primaryError: any) {
        console.error(
          `Primary model ${aiConfig.model_name} failed:`,
          primaryError.message
        );

        // Fallback to GPT-4.1
        const fallbackModel = "gpt-4.1";
        console.log(`Attempting fallback with model: ${fallbackModel}`);

        try {
          if (effectivePathway === "simple") {
            console.log(
              "🎯 Simple pathway fallback: Generating complete report without function calls"
            );
            completion = await this.openai.chat.completions.create({
              model: fallbackModel,
              messages: messages,
              max_tokens: aiConfig.max_tokens,
              temperature: aiConfig.temperature,
              // No tools - generate complete report directly
            });
          } else {
            console.log(
              "🎯 Complex pathway fallback: Using function calls for multi-step analysis"
            );
            completion = await this.openai.chat.completions.create({
              model: fallbackModel,
              messages: messages,
              max_tokens: aiConfig.max_tokens,
              temperature: aiConfig.temperature,
              tools: this.getFunctionDefinitions(request.moduleType),
              tool_choice: "auto",
            });
          }
          console.log(`Successfully used fallback model: ${fallbackModel}`);
        } catch (fallbackError) {
          console.error(
            `Fallback model ${fallbackModel} also failed:`,
            fallbackError
          );
          throw fallbackError;
        }
      }

      let analysisResult = completion.choices[0].message.content;
      let itemMasterData = [];
      let assessmentFindings = [];

      // Step 4: Process function calls in a conversation loop for K-12
      if (request.moduleType === "k12") {
        // Process first function call (identifyStrengthsAndWeaknesses)
        if (completion.choices[0].message.tool_calls) {
          console.log("Processing AI function calls...");
          const firstCallResult = await this.processAIFunctionCalls(
            completion.choices[0].message.tool_calls,
            request.caseId,
            request.moduleType
          );

          // For K-12, we need to continue the conversation to get the second function call
          if (
            completion.choices[0].message.tool_calls[0].function.name ===
            "identifyStrengthsAndWeaknesses"
          ) {
            // Add the assistant's response with tool calls to the conversation
            messages.push(completion.choices[0].message);

            // Add tool response messages for all tool calls
            for (const toolCall of completion.choices[0].message.tool_calls) {
              messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify({
                  success: true,
                  message:
                    "Findings identified and saved. Now please call populateK12ItemMaster with the selected findings and their proposed canonical keys.",
                }),
              });
            }

            // Continue the conversation to get the second function call
            console.log("Prompting for K-12 item master population...");
            try {
              completion = await this.openai.chat.completions.create({
                model: aiConfig.model_name,
                messages: messages,
                max_tokens: aiConfig.max_tokens,
                temperature: aiConfig.temperature,
                tools: this.getFunctionDefinitions(request.moduleType),
                tool_choice: {
                  type: "function",
                  function: { name: "populateK12ItemMaster" },
                },
              });
            } catch (continuationError: any) {
              console.error(
                `Continuation with ${aiConfig.model_name} failed:`,
                continuationError.message
              );

              // Try fallback model for continuation
              const fallbackModel = "gpt-4.1";
              console.log(
                `Attempting continuation with fallback model: ${fallbackModel}`
              );

              completion = await this.openai.chat.completions.create({
                model: fallbackModel,
                messages: messages,
                max_tokens: aiConfig.max_tokens,
                temperature: aiConfig.temperature,
                tools: this.getFunctionDefinitions(request.moduleType),
                tool_choice: {
                  type: "function",
                  function: { name: "populateK12ItemMaster" },
                },
              });
              console.log(
                `Successfully used fallback model for continuation: ${fallbackModel}`
              );
            }

            // Process the second function call
            if (completion.choices[0].message.tool_calls) {
              itemMasterData = await this.processAIFunctionCalls(
                completion.choices[0].message.tool_calls,
                request.caseId,
                request.moduleType
              );

              // Add the second response to continue for final report
              messages.push(completion.choices[0].message);
              for (const toolCall of completion.choices[0].message.tool_calls) {
                messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: JSON.stringify({
                    success: true,
                    itemMasterData: itemMasterData,
                  }),
                });
              }

              // Get the final analysis with markdown report
              console.log("Generating final K-12 markdown report...");
              const finalCompletion = await this.openai.chat.completions.create(
                {
                  model: aiConfig.model_name,
                  messages: messages,
                  max_tokens: aiConfig.max_tokens,
                  temperature: aiConfig.temperature,
                }
              );

              analysisResult = finalCompletion.choices[0].message.content;
            }
          }
        }
      } else {
        // Non-K-12 modules use the original single-call approach
        if (completion.choices[0].message.tool_calls) {
          console.log("Processing AI function calls...");
          try {
            itemMasterData = await this.processAIFunctionCalls(
              completion.choices[0].message.tool_calls,
              request.caseId,
              request.moduleType
            );

            // For simple pathway, preserve the original analysis instead of adding enhancement content
            if (effectivePathway === "simple") {
              console.log(
                "🎯 Simple pathway: Preserving original AI analysis without enhancement"
              );
              // Keep analysisResult as-is - it should be a complete report
            } else {
              // Complex pathway: Update analysis with function call results
              analysisResult = await this.enhanceAnalysisWithFunctionResults(
                analysisResult,
                itemMasterData,
                request.moduleType
              );
            }
          } catch (error) {
            console.log(
              "🎯 Function calls failed, preserving original AI analysis:",
              error.message
            );
            // Keep analysisResult as-is when function calls fail
          }
        }
      }

      // Step 5: Store results in database
      const result: AIAnalysisResult = {
        status: "completed",
        analysis_date: new Date().toISOString(),
        markdown_report: analysisResult || "Analysis completed successfully",
        module_type: request.moduleType,
        item_master_data: itemMasterData,
      };

      // Skip database update here - let the calling function handle it
      // The assessment case doesn't exist yet, so we can't update it
      console.log(
        "✅ AI analysis completed, item master data ready for database save"
      );

      console.log(
        "✅ Local AI analysis with handler logic completed successfully"
      );
      return result;
    } catch (error) {
      console.error("❌ Local AI analysis failed:", error);

      const errorResult: AIAnalysisResult = {
        status: "failed",
        analysis_date: new Date().toISOString(),
        markdown_report: "",
        module_type: request.moduleType,
        error_message: error.message,
      };

      // Don't try to update assessment case on error - it might not exist yet
      console.log(
        "Analysis failed, returning error result without database update"
      );

      return errorResult;
    }
  }

  private async loadAIConfiguration(moduleType: string) {
    // Load module-specific AI configuration from database
    console.log(`Loading AI configuration for module: ${moduleType}`);

    try {
      // Get the correct config key for the module type
      const configKey =
        moduleType === "k12" ? "k12_config" : "post_secondary_config";
      console.log(`Looking for AI config with key: ${configKey}`);

      // Query the database directly for the specific config
      const { pool } = await import("./db");
      const result = await pool.query(
        "SELECT * FROM ai_config WHERE config_key = $1",
        [configKey]
      );

      if (result.rows.length === 0) {
        console.log(`No config found for ${configKey}, using default`);
        // Fallback to default config
        const fallbackResult = await pool.query(
          "SELECT * FROM ai_config WHERE config_key = $1",
          ["default_config"]
        );

        if (fallbackResult.rows.length === 0) {
          throw new Error("No AI configuration found in database");
        }

        const config = fallbackResult.rows[0];
        return {
          model_name: config.model_name,
          temperature: parseFloat(config.temperature), // Ensure it's a number
          max_tokens: parseInt(config.max_tokens),
        };
      }

      const config = result.rows[0];
      console.log(`Successfully loaded ${configKey} config:`, {
        model_name: config.model_name,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
      });

      return {
        model_name: config.model_name,
        temperature: parseFloat(config.temperature), // Ensure it's a number
        max_tokens: parseInt(config.max_tokens),
      };
    } catch (error) {
      console.error("Failed to load AI configuration:", error);
      // Return safe defaults
      return {
        model_name: "gpt-4.1",
        temperature: 0.2,
        max_tokens: 16000,
      };
    }
  }

  private async buildSystemPrompt(
    moduleType: string,
    pathway: string = "simple"
  ): Promise<string> {
    // Load system prompt and markdown template from database
    try {
      const systemPrompts = await storage.getPromptSections(
        moduleType,
        "system"
      );
      const reportFormatPrompts = await storage.getPromptSections(
        moduleType,
        "report_format"
      );

      let systemPrompt;
      let markdownTemplate;
      let expectedSystemKey: string;
      let expectedTemplateKey: string;

      // K-12 simple pathway: Force use of demo prompts
      if (moduleType === "k12" && pathway === "simple") {
        expectedSystemKey = `system_instructions_k12_demo`;
        expectedTemplateKey = `markdown_report_template_k12_demo`;
        console.log(
          `🎯 K-12 Simple Pathway: Using demo prompts (v3.0 system, v12.0 template)`
        );
      } else {
        // All other pathways use module-specific pathway prompts
        expectedSystemKey = `system_instructions_${moduleType}_${pathway}`;
        expectedTemplateKey = `markdown_report_template_${moduleType}_${pathway}`;
      }

      systemPrompt = systemPrompts.find(
        (p) => p.section_key === expectedSystemKey
      );

      markdownTemplate = reportFormatPrompts.find(
        (p) => p.section_key === expectedTemplateKey
      );

      // Fallback to non-pathway-specific template if pathway-specific not found (NOT for K-12 simple)
      if (
        !markdownTemplate &&
        !(moduleType === "k12" && pathway === "simple")
      ) {
        expectedTemplateKey = `markdown_report_template_${moduleType}`;
        markdownTemplate = reportFormatPrompts.find(
          (p) => p.section_key === expectedTemplateKey
        );
      }

      if (!systemPrompt || !systemPrompt.content) {
        throw new Error(
          `System prompt not found for module: ${moduleType}, pathway: ${pathway}. Required prompt: ${expectedSystemKey}`
        );
      }

      if (!markdownTemplate || !markdownTemplate.content) {
        throw new Error(
          `Markdown template not found for module: ${moduleType}, pathway: ${pathway}. Tried: ${expectedTemplateKey}`
        );
      }

      console.log(
        `✅ Using system prompt ${systemPrompt.section_key} for ${moduleType} ${pathway} pathway (${systemPrompt.content.length} chars)`
      );
      console.log(
        `✅ Using markdown template ${markdownTemplate.section_key} (${markdownTemplate.content.length} chars)`
      );

      // Combine system instructions with markdown template
      const combinedPrompt = `${systemPrompt.content}

---

## MARKDOWN REPORT FORMAT

Use the following markdown template format for your report:

${markdownTemplate.content}`;

      return combinedPrompt;
    } catch (error) {
      console.error(
        `❌ Failed to load prompts from database: ${error.message}`
      );
      throw new Error(
        `Database prompts required for ${moduleType} module with pathway ${pathway}. ${error.message}`
      );
    }
  }

  private buildUserPrompt(
    documents: Array<{ filename: string; content: string }>,
    studentName?: string
  ): string {
    const nameInstruction = studentName
      ? `Student Name: ${studentName}\n\nIMPORTANT: Use "${studentName}" as the student name throughout the report. Do not use any other names.\n\n`
      : "";

    return `${nameInstruction}Please analyze these assessment documents for educational accommodations:

${documents
  .map(
    (doc, index) => `
Document ${index + 1}: ${doc.filename}
Content: ${doc.content}
`
  )
  .join("\n")}

Generate a comprehensive accommodation report focusing on functional barriers and evidence-based recommendations.${
      studentName
        ? ` Ensure the student is consistently referred to as "${studentName}" throughout the analysis and report.`
        : ""
    }`;
  }

  private getFunctionDefinitions(moduleType: string) {
    // Define function calling capabilities for GPT-4 with AI Handler Logic
    if (moduleType === "k12") {
      return [
        {
          type: "function" as const,
          function: {
            name: "identifyStrengthsAndWeaknesses",
            description:
              "Identify all strengths and weaknesses from assessment, rank by classroom relevance, select top 4 strengths and 3 weaknesses",
            parameters: {
              type: "object",
              properties: {
                allFindings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      findingType: {
                        type: "string",
                        enum: ["strength", "weakness"],
                        description: "Type of finding",
                      },
                      description: {
                        type: "string",
                        description: "Raw finding description from assessment",
                      },
                      relevanceScore: {
                        type: "integer",
                        minimum: 1,
                        maximum: 10,
                        description:
                          "Relevance to classroom instruction (1-10)",
                      },
                      classroomImpact: {
                        type: "string",
                        description: "How this impacts classroom performance",
                      },
                      evidenceBasis: {
                        type: "string",
                        description:
                          "Assessment evidence supporting this finding",
                      },
                    },
                  },
                },
                topStrengths: {
                  type: "array",
                  description: "Top 4 strengths by relevance score",
                  maxItems: 4,
                  items: {
                    type: "integer",
                    description: "Index reference to allFindings array",
                  },
                },
                topWeaknesses: {
                  type: "array",
                  description: "Top 3 weaknesses by relevance score",
                  maxItems: 3,
                  items: {
                    type: "integer",
                    description: "Index reference to allFindings array",
                  },
                },
              },
            },
          },
        },
        {
          type: "function" as const,
          function: {
            name: "populateK12ItemMaster",
            description:
              "Populate K-12 item master with canonical matching and cascade inference for all fields",
            parameters: {
              type: "object",
              properties: {
                selectedFindings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      findingType: {
                        type: "string",
                        enum: ["strength", "weakness"],
                      },
                      description: {
                        type: "string",
                        description: "Finding description",
                      },
                      relevanceScore: { type: "integer" },
                      classroomImpact: { type: "string" },
                      evidenceBasis: { type: "string" },
                      canonicalKey: {
                        type: "string",
                        description: "Proposed canonical key match",
                      },
                      surfaceTerm: {
                        type: "string",
                        description: "Original assessment terminology",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ];
    }

    // Post-secondary function definitions
    return [
      {
        type: "function" as const,
        function: {
          name: "populateItemMaster",
          description:
            "Populate item master data with identified barriers and accommodations using three-step AI handler workflow",
          parameters: {
            type: "object",
            properties: {
              barriers: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    canonical_key: {
                      type: "string",
                      description:
                        "Technical canonical key (e.g., slowed_processing_speed, sustained_attention_limit)",
                    },
                    description: {
                      type: "string",
                      description: "Plain language description of the barrier",
                    },
                    evidence: {
                      type: "string",
                      description:
                        "Assessment evidence supporting this barrier",
                    },
                    surface_term: {
                      type: "string",
                      description:
                        "Original term from assessment for semantic matching",
                    },
                  },
                },
              },
              accommodations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    accommodation_type: {
                      type: "string",
                      description:
                        "Type of accommodation (e.g., time_extension, assistive_technology)",
                    },
                    description: {
                      type: "string",
                      description: "Detailed accommodation description",
                    },
                    justification: {
                      type: "string",
                      description:
                        "Evidence-based justification for accommodation",
                    },
                    canonical_key: {
                      type: "string",
                      description: "Related barrier canonical key",
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        type: "function" as const,
        function: {
          name: "lookupBarrierAccommodations",
          description:
            "AI Handler: Lookup accommodations for identified barriers from database",
          parameters: {
            type: "object",
            properties: {
              canonical_keys: {
                type: "array",
                items: { type: "string" },
                description:
                  "Array of canonical keys to lookup accommodations for",
              },
            },
          },
        },
      },
    ];
  }

  // AI Handler Implementation - Process function calls from GPT-4
  private async processAIFunctionCalls(
    toolCalls: any[],
    caseId: string,
    moduleType: string
  ): Promise<any[]> {
    const itemMasterData = [];
    let assessmentFindings = [];

    for (const toolCall of toolCalls) {
      console.log(`Processing AI function call: ${toolCall.function.name}`);

      if (toolCall.function.name === "identifyStrengthsAndWeaknesses") {
        // K-12 Step 1: Store all findings and select top 4/3
        const args = JSON.parse(toolCall.function.arguments);
        const { allFindings, topStrengths, topWeaknesses } = args;

        // Save all findings to assessment_findings table
        for (let i = 0; i < allFindings.length; i++) {
          const finding = allFindings[i];
          const isSelected =
            (topStrengths && topStrengths.includes(i)) ||
            (topWeaknesses && topWeaknesses.includes(i));
          const rankOrder =
            topStrengths && topStrengths.includes(i)
              ? topStrengths.indexOf(i) + 1
              : topWeaknesses && topWeaknesses.includes(i)
              ? topWeaknesses.indexOf(i) + 1
              : null;

          const savedFinding = await storage.createAssessmentFinding?.({
            assessment_case_id: caseId,
            finding_type: finding.findingType,
            description: finding.description,
            relevance_score: finding.relevanceScore,
            classroom_impact: finding.classroomImpact,
            rank_order: rankOrder,
            module_type: moduleType,
          });

          if (isSelected && savedFinding) {
            assessmentFindings.push(savedFinding);
          }
        }

        console.log(
          `✅ Saved ${assessmentFindings.length} top findings to database`
        );
      } else if (toolCall.function.name === "populateK12ItemMaster") {
        // K-12 Step 2: Process selected findings with canonical matching
        const args = JSON.parse(toolCall.function.arguments);
        const { selectedFindings } = args;

        for (const finding of selectedFindings) {
          // Resolve canonical key
          const resolvedKey = await this.resolveCanonicalKeys(
            [
              {
                canonical_key: finding.canonicalKey,
                surface_term: finding.surfaceTerm || finding.description,
                description: finding.description,
                evidence: finding.evidenceBasis,
              },
            ],
            moduleType
          );

          // Populate item master with cascade inference
          const itemData = await this.populateK12ItemMasterWithCascade(
            resolvedKey[0],
            finding,
            caseId,
            "Elementary" // Default grade band - should be passed from frontend
          );

          itemMasterData.push(itemData);

          // Update assessment finding with canonical match
          const matchingFinding = assessmentFindings.find(
            (f) => f.description === finding.description
          );
          if (matchingFinding) {
            await storage.updateAssessmentFinding?.(matchingFinding.id, {
              canonical_key: resolvedKey[0].canonical_key,
              matching_method: resolvedKey[0].resolution_method,
              item_master_id: itemData.id,
            });
          }
        }
      } else if (toolCall.function.name === "populateItemMaster") {
        // Post-secondary workflow
        const args = JSON.parse(toolCall.function.arguments);

        // AI Handler Step 1: Technical Weakness Identification (already done by GPT-4)
        // AI Handler Step 2: Canonical Key Resolution
        const resolvedBarriers = await this.resolveCanonicalKeys(
          args.barriers,
          moduleType
        );

        // AI Handler Step 3: Item Master Population
        const populatedItems = await this.populateItemMasterData(
          resolvedBarriers,
          args.accommodations || [],
          caseId,
          moduleType
        );

        itemMasterData.push(...populatedItems);
      } else if (toolCall.function.name === "lookupBarrierAccommodations") {
        const args = JSON.parse(toolCall.function.arguments);
        const accommodations = await this.lookupAccommodationsFromDatabase(
          args.canonical_keys,
          moduleType
        );
        itemMasterData.push(...accommodations);
      }
    }

    return itemMasterData;
  }

  // AI Handler: Three-step canonical key resolution
  private async resolveCanonicalKeys(
    barriers: any[],
    moduleType: string
  ): Promise<any[]> {
    const resolvedBarriers = [];

    for (const barrier of barriers) {
      console.log(
        `Resolving canonical key for: ${
          barrier.surface_term || barrier.canonical_key
        }`
      );

      // Step 1: Exact match
      let resolvedKey = barrier.canonical_key;

      // Step 2: 90% semantic similarity (simplified implementation)
      if (!resolvedKey || resolvedKey === "unknown") {
        resolvedKey = await this.semanticKeyMatching(
          barrier.surface_term || barrier.description,
          moduleType
        );
      }

      // Step 3: Expert inference (if still no match)
      if (!resolvedKey || resolvedKey === "unknown") {
        resolvedKey = await this.expertInference(
          barrier.surface_term || barrier.description,
          moduleType
        );
      }

      resolvedBarriers.push({
        ...barrier,
        canonical_key: resolvedKey,
        resolution_method:
          resolvedKey === barrier.canonical_key ? "exact_match" : "ai_resolved",
      });
    }

    return resolvedBarriers;
  }

  // AI Handler: Semantic matching implementation
  private async semanticKeyMatching(
    term: string,
    moduleType: string
  ): Promise<string> {
    // Simplified semantic matching based on common patterns
    const patterns = {
      processing_speed: [
        "processing speed",
        "slow processing",
        "processing deficit",
      ],
      sustained_attention: [
        "attention",
        "concentration",
        "focus",
        "sustained attention",
      ],
      executive_function: [
        "executive function",
        "cognitive flexibility",
        "set-shifting",
      ],
      working_memory: ["working memory", "memory", "recall"],
      test_anxiety: ["anxiety", "test anxiety", "performance anxiety"],
    };

    for (const [key, keywords] of Object.entries(patterns)) {
      if (keywords.some((keyword) => term.toLowerCase().includes(keyword))) {
        return `${key}_deficit`;
      }
    }

    return "unknown_barrier";
  }

  // AI Handler: Expert inference for unmatched terms
  private async expertInference(
    term: string,
    moduleType: string
  ): Promise<string> {
    console.log(`Using expert inference for: ${term}`);

    // Load AI configuration to use proper model (GPT-4.1 primary, GPT-4o fallback)
    const aiConfigData = await this.loadAIConfiguration(moduleType);
    const primaryModel = aiConfigData?.model_name || "gpt-4.1";
    const fallbackModel = "gpt-4.1";

    // Use GPT-4.1 for expert inference of canonical keys
    const inferencePrompt = `As an expert in psychoeducational assessment, what canonical key best represents this assessment finding: "${term}"

Available canonical keys:
- slowed_processing_speed
- sustained_attention_limit  
- executive_function_deficit
- working_memory_deficit
- test_anxiety

Respond with only the canonical key that best matches, or "unknown_barrier" if no match.`;

    try {
      console.log(`Expert inference using primary model: ${primaryModel}`);
      const response = await this.openai.chat.completions.create({
        model: primaryModel,
        messages: [{ role: "user", content: inferencePrompt }],
        max_tokens: 50,
        temperature: 0.1,
      });

      const inferredKey =
        response.choices[0].message.content?.trim() || "unknown_barrier";
      console.log(`Expert inference result: ${inferredKey}`);
      return inferredKey;
    } catch (primaryError: any) {
      console.error(
        `Expert inference failed with ${primaryModel}:`,
        primaryError.message
      );

      // Try fallback model if primary fails
      try {
        console.log(`Attempting fallback with model: ${fallbackModel}`);
        const response = await this.openai.chat.completions.create({
          model: fallbackModel,
          messages: [{ role: "user", content: inferencePrompt }],
          max_tokens: 50,
          temperature: 0.1,
        });

        const inferredKey =
          response.choices[0].message.content?.trim() || "unknown_barrier";
        console.log(`Expert inference result (fallback): ${inferredKey}`);
        return inferredKey;
      } catch (fallbackError) {
        console.error(
          `Expert inference failed with fallback ${fallbackModel}:`,
          fallbackError
        );
        return "unknown_barrier";
      }
    }
  }

  // AI Handler: Populate item master data
  private async populateItemMasterData(
    barriers: any[],
    accommodations: any[],
    caseId: string,
    moduleType: string
  ): Promise<any[]> {
    const itemMasterData = [];

    // Ensure accommodations is always an array
    const safeAccommodations = Array.isArray(accommodations)
      ? accommodations
      : [];

    for (const barrier of barriers) {
      // Create item master entry for each barrier
      const itemData = {
        assessment_case_id: caseId,
        canonical_key: barrier.canonical_key,
        item_label: barrier.canonical_key
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        plain_language_label: barrier.description,
        evidence_basis: barrier.evidence,
        accommodations: safeAccommodations
          .filter((acc) => acc && acc.canonical_key === barrier.canonical_key)
          .map((acc) => acc.description || "No description")
          .join("; "),
        module_type: moduleType,
        source: "ai_analysis",
      };

      itemMasterData.push(itemData);
    }

    return itemMasterData;
  }

  // AI Handler: Enhanced analysis with function results
  private async enhanceAnalysisWithFunctionResults(
    originalAnalysis: string,
    itemMasterData: any[],
    moduleType: string
  ): Promise<string> {
    if (itemMasterData.length === 0) return originalAnalysis;

    const enhancedSection = `

## AI Handler Results

### Item Master Data Generated:
${itemMasterData
  .map(
    (item) => `
- **${item.item_label}** (${item.canonical_key})
  - Evidence: ${item.evidence_basis}
  - Accommodations: ${item.accommodations}
`
  )
  .join("")}

### Three-Step Resolution Process:
1. **Technical Weakness Identification**: Completed by GPT-4 analysis
2. **Canonical Key Resolution**: Applied semantic matching and expert inference
3. **Item Master Population**: Generated ${
      itemMasterData.length
    } structured accommodation entries

---

${originalAnalysis}`;

    return enhancedSection;
  }

  // AI Handler: Lookup accommodations from database
  private async lookupAccommodationsFromDatabase(
    canonicalKeys: string[],
    moduleType: string
  ): Promise<any[]> {
    const accommodations = [];

    try {
      // Query database for accommodations based on canonical keys
      if (moduleType === "post_secondary") {
        const dbAccommodations = await storage.getPostSecondaryItemMaster();
        for (const key of canonicalKeys) {
          const matches = dbAccommodations.filter(
            (acc) => acc.canonical_key === key
          );
          accommodations.push(...matches);
        }
      }
    } catch (error) {
      console.error("Database lookup failed:", error);
    }

    return accommodations;
  }

  // K-12 Cascade Inference System - Generate ALL fields when lookup fails
  private async populateK12ItemMasterWithCascade(
    resolvedBarrier: any,
    finding: any,
    caseId: string,
    gradeBand: string
  ): Promise<any> {
    console.log(
      `🔄 Starting cascade inference for: ${resolvedBarrier.canonical_key}`
    );

    // Step 1: Try database lookup for all K-12 fields
    const lookupData = await this.lookupK12DatabaseFields(
      resolvedBarrier.canonical_key,
      gradeBand
    );

    // Step 2: Check completeness and determine inference level
    const missingFields = this.checkK12FieldCompleteness(lookupData);

    // Step 3: If ANY fields missing, trigger cascade inference
    let inferredData = {};
    let validationStatus = "validated";
    let inferenceLevel = "none";

    if (missingFields.length > 0) {
      console.log(`⚠️ Missing fields detected: ${missingFields.join(", ")}`);
      console.log("🧠 Triggering cascade inference for missing fields...");

      inferredData = await this.generateK12RichContent(
        resolvedBarrier,
        finding,
        gradeBand,
        missingFields,
        lookupData
      );

      // Set QC flags based on inference level
      if (missingFields.length === 7) {
        validationStatus = "full_inference";
        inferenceLevel = "complete";
      } else {
        validationStatus = "partial_inference";
        inferenceLevel = "partial";
      }
    }

    // Step 4: Merge lookup data with inferred data
    const completeData = {
      assessment_case_id: caseId,
      canonical_key: resolvedBarrier.canonical_key,
      grade_band: gradeBand,
      item_label: lookupData.item_label || inferredData.item_label,
      parent_friendly_label:
        lookupData.parent_friendly_label || inferredData.parent_friendly_label,
      classroom_observation:
        lookupData.classroom_observation || inferredData.classroom_observation,
      support_1: lookupData.support_1 || inferredData.support_1,
      support_2: lookupData.support_2 || inferredData.support_2,
      caution_note: lookupData.caution_note || inferredData.caution_note,
      evidence_basis: finding.evidenceBasis,
      validation_status: validationStatus,
      inference_level: inferenceLevel,
      module_type: "k12",
      source: inferenceLevel === "none" ? "database" : "cascade_inference",
    };

    console.log(
      `✅ K-12 item master populated with ${inferenceLevel} inference`
    );
    return completeData;
  }

  // Lookup K-12 fields from multiple tables
  private async lookupK12DatabaseFields(
    canonicalKey: string,
    gradeBand: string
  ): Promise<any> {
    const result = {
      item_label: null,
      parent_friendly_label: null,
      classroom_observation: null,
      support_1: null,
      support_2: null,
      caution_note: null,
    };

    try {
      // Check barrier glossary for parent-friendly label
      const glossary = await storage.getBarrierGlossaryK12?.();
      const glossaryMatch = glossary?.find(
        (g) => g.canonicalKey === canonicalKey
      );
      if (glossaryMatch) {
        result.parent_friendly_label = glossaryMatch.parentFriendlyLabel;
        result.item_label = glossaryMatch.barrierCategory;
      }

      // Check support lookup
      const supports = await storage.getSupportLookup?.(
        canonicalKey,
        gradeBand
      );
      if (supports && supports.length > 0) {
        result.support_1 = supports[0].description;
        if (supports.length > 1) {
          result.support_2 = supports[1].description;
        }
      }

      // Check caution lookup
      const cautions = await storage.getCautionLookup?.(
        canonicalKey,
        gradeBand
      );
      if (cautions && cautions.length > 0) {
        result.caution_note = cautions[0].description;
      }

      // Check observation template
      const observations = await storage.getObservationTemplate?.(
        canonicalKey,
        gradeBand
      );
      if (observations && observations.length > 0) {
        result.classroom_observation = observations[0].templateContent;
      }
    } catch (error) {
      console.error("K-12 database lookup error:", error);
    }

    return result;
  }

  // Check which K-12 fields are missing
  private checkK12FieldCompleteness(data: any): string[] {
    const requiredFields = [
      "item_label",
      "parent_friendly_label",
      "classroom_observation",
      "support_1",
      "support_2",
      "caution_note",
    ];

    return requiredFields.filter((field) => !data[field] || data[field] === "");
  }

  // Generate rich content for missing K-12 fields using GPT-4
  private async generateK12RichContent(
    barrier: any,
    finding: any,
    gradeBand: string,
    missingFields: string[],
    existingData: any
  ): Promise<any> {
    const prompt = `As an expert K-12 educational specialist, generate rich content for the following barrier:

Canonical Key: ${barrier.canonical_key}
Description: ${finding.description}
Grade Band: ${gradeBand}
Classroom Impact: ${finding.classroomImpact}
Evidence: ${finding.evidenceBasis}

Generate ONLY the following missing fields:
${missingFields.map((field) => `- ${field}`).join("\n")}

Context from existing data:
${Object.entries(existingData)
  .filter(([_, value]) => value)
  .map(([key, value]) => `${key}: ${value}`)
  .join("\n")}

Field Requirements:
- item_label: Clear, teacher-friendly label (e.g., "Processing Speed Challenges")
- parent_friendly_label: Explanation parents can understand (e.g., "Your child needs extra time to process information")
- classroom_observation: Observable behaviors (e.g., "May take longer to complete assignments, appears to work slowly")
- support_1: Primary support strategy (e.g., "Provide extended time for assignments and tests")
- support_2: Secondary support strategy (e.g., "Break complex tasks into smaller, manageable steps")
- caution_note: Implementation warning (e.g., "Don't assume slow work means lack of understanding")

Respond in JSON format with only the requested fields.`;

    // Load AI configuration for K-12 module
    const aiConfigData = await this.loadAIConfiguration("k12");
    const primaryModel = aiConfigData?.model_name || "gpt-4.1";
    const fallbackModel = "gpt-4.1";

    try {
      console.log(
        `Generating K-12 rich content with primary model: ${primaryModel}`
      );
      const response = await this.openai.chat.completions.create({
        model: primaryModel,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const generatedContent = JSON.parse(
        response.choices[0].message.content || "{}"
      );
      console.log(
        `✅ Generated rich content for ${missingFields.length} missing fields`
      );
      return generatedContent;
    } catch (primaryError: any) {
      console.error(
        `Rich content generation failed with ${primaryModel}:`,
        primaryError.message
      );

      // Try fallback model
      try {
        console.log(
          `Attempting rich content generation with fallback model: ${fallbackModel}`
        );
        const response = await this.openai.chat.completions.create({
          model: fallbackModel,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 800,
          temperature: 0.3,
          response_format: { type: "json_object" },
        });

        const generatedContent = JSON.parse(
          response.choices[0].message.content || "{}"
        );
        console.log(
          `✅ Generated rich content for ${missingFields.length} missing fields (using fallback)`
        );
        return generatedContent;
      } catch (fallbackError) {
        console.error(
          `Rich content generation failed with fallback ${fallbackModel}:`,
          fallbackError
        );

        // Final fallback to basic inference
        return {
          item_label: `${barrier.canonical_key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())}`,
          parent_friendly_label: `Your child shows ${finding.description.toLowerCase()}`,
          classroom_observation: `Student demonstrates ${finding.classroomImpact}`,
          support_1: `Provide accommodations for ${finding.description}`,
          support_2: `Monitor progress and adjust support as needed`,
          caution_note: `Individual needs may vary - adjust strategies accordingly`,
        };
      }
    }
  }
}
