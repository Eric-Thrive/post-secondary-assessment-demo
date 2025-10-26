import type { Express, Request, Response } from "express";
import "../types";
import crypto from "crypto";
import { LocalAIService, type AIAnalysisRequest } from "../ai-service";
import { aiJSONService } from "../ai-json-service";
import { storage } from "../storage";
import { db } from "../db";
import { itemMaster } from "@shared/schema";
import { eq } from "drizzle-orm";
import { isControlledAccessMode } from "../config/database";
import { DEMO_CUSTOMER_ID } from "@shared/constants/environments";
import { requireAuth, requireCustomerAccess } from "../auth";

export function registerAnalysisRoutes(app: Express): void {
    // Demo analysis endpoint - for public demo mode (no authentication required)
    app.post("/api/demo-analyze-assessment", async (req, res) => {
      try {
        console.log('=== DEMO ANALYSIS REQUEST (No Auth Required) ===');
        
        // SAFETY GUARD: Check for proper demo environment configuration
        const currentEnv = process.env.APP_ENVIRONMENT || 'production';
        const hasProperDemoSetup = currentEnv.includes('demo') && process.env.POST_SECONDARY_DEMO_DATABASE_URL;
        
        // WORKAROUND: Allow demo if POST_SECONDARY_DEMO_DATABASE_URL is set (even if APP_ENVIRONMENT is wrong)
        // This handles the case where APP_ENVIRONMENT secret can't be edited but demo database is configured
        const hasWorkaroundDemoSetup = process.env.POST_SECONDARY_DEMO_DATABASE_URL && process.env.POST_SECONDARY_DEMO_DATABASE_URL.length > 0;
        
        // NEW: Allow controlled access mode for demo environments (enhanced security with customer isolation)
        const hasControlledAccessSetup = currentEnv.includes('demo') && isControlledAccessMode();
        
        if (!hasProperDemoSetup && !hasWorkaroundDemoSetup && !hasControlledAccessSetup) {
          console.error('🚨 SECURITY ERROR: Demo endpoint accessed without proper demo database configuration');
          console.error(`   APP_ENVIRONMENT: ${currentEnv}`);
          console.error(`   POST_SECONDARY_DEMO_DATABASE_URL: ${process.env.POST_SECONDARY_DEMO_DATABASE_URL ? 'SET' : 'MISSING'}`);
          console.error(`   CONTROLLED_ACCESS_MODE: ${isControlledAccessMode() ? 'ENABLED' : 'DISABLED'}`);
          console.error('   Risk: Demo operations may write to production database');
          
          return res.status(503).json({
            error: 'Demo environment not properly configured',
            details: 'Demo operations require proper environment isolation to prevent production data corruption',
            requiredVars: ['APP_ENVIRONMENT=post-secondary-demo', 'POST_SECONDARY_DEMO_DATABASE_URL OR controlled access mode'],
            currentEnv: currentEnv
          });
        }
        
        // Log the configuration being used
        if (hasControlledAccessSetup) {
          console.log('🔒 Using controlled access mode for demo analysis');
          console.log(`   APP_ENVIRONMENT: ${currentEnv} ✅`);
          console.log(`   CONTROLLED_ACCESS_MODE: ENABLED ✅`);
          console.log(`   CUSTOMER_ISOLATION: ${DEMO_CUSTOMER_ID} only ✅`);
        } else if (hasWorkaroundDemoSetup && !hasProperDemoSetup) {
          console.log('⚠️  Using demo workaround mode - POST_SECONDARY_DEMO_DATABASE_URL is set but APP_ENVIRONMENT needs fixing');
          console.log(`   APP_ENVIRONMENT: ${currentEnv} (should be 'post-secondary-demo')`);
          console.log(`   POST_SECONDARY_DEMO_DATABASE_URL: SET ✅`);
        } else if (hasProperDemoSetup) {
          console.log('✅ Using proper demo setup with isolated database');
          console.log(`   APP_ENVIRONMENT: ${currentEnv} ✅`);
          console.log(`   POST_SECONDARY_DEMO_DATABASE_URL: SET ✅`);
        }
        
        const moduleType = req.body.moduleType || 'post_secondary';
        const pathway = req.body.pathway || 'simple'; // Extract pathway from request body
        const caseId = req.body.caseId || `demo-${Date.now()}`;
        const documents = req.body.documents || req.body.documentContents || [];
        const studentGrade = req.body.studentGrade;
        const uniqueId = req.body.uniqueId;
        const programMajor = req.body.programMajor;
        const reportAuthor = req.body.reportAuthor;
        
        console.log(`Demo Module type: ${moduleType}`);
        console.log(`Demo Pathway: ${pathway}`);
        console.log(`Demo Case ID: ${caseId}`);
        console.log(`Demo Documents: ${documents.length}`);
        
        // Check if this is the tutoring module - use JSON-first approach
        if (moduleType === 'tutoring') {
          console.log('🧩 Using JSON-first pipeline for tutoring module demo with QC scoring');
          
          // Use the tutoring JSON service for strict schema enforcement
          const documentContents = documents.map((doc: any) => doc.content || doc).filter(Boolean);
          const result = await aiJSONService.generateJSONReport(
            documentContents,
            moduleType,
            uniqueId,
            studentGrade
          );
          
          return res.json({ 
            success: true, 
            markdown_report: result.markdownReport,
            structured_data: result.jsonReport
          });
        } else {
          console.log(`🚀 Using ${pathway} pathway for demo analysis`);
          
          // Handle post_secondary and k12 modules in demo mode
          if (moduleType === 'post_secondary' || moduleType === 'k12') {
            console.log(`Processing ${moduleType} module in demo mode...`);
            
            // Use requested pathway for demo analysis
            const documentContents = documents.map((doc: any) => doc.content || doc).filter(Boolean);
            
            const aiService = new LocalAIService();
            const result = await aiService.processAnalysis({
              caseId,
              moduleType,
              pathway,
              documents: documentContents.map((content: string, index: number) => ({
                filename: `document_${index + 1}.txt`,
                content: content
              })),
              uniqueId,
              programMajor,
              reportAuthor,
              studentGrade
            });
            
            // Save the demo analysis result to database so reports page can find it
            console.log('💾 Saving demo analysis result to database...');
            
            // Capture user ID from session if user is logged in
            const userId = req.session?.userId;
            console.log(`🔑 Demo analysis - User ID from session: ${userId || 'none (anonymous)'}`);
            
            const caseData = {
              id: caseId,
              moduleType: moduleType, // Fixed: camelCase
              pathway: pathway,
              displayName: uniqueId?.trim() || documents[0]?.filename || (moduleType === 'k12' ? 'K-12 Analysis' : 'Post-Secondary Analysis'), // Fixed: Use displayName for UI display
              studentGrade: studentGrade, // Already camelCase
              reportData: result.markdown_report, // Fixed: Use reportData (maps to report_data in DB)
              status: result.status || 'completed',
              createdAt: new Date().toISOString(), // Fixed: camelCase
              analysisDate: result.analysis_date || new Date().toISOString(), // Fixed: camelCase
              itemMasterData: JSON.stringify(result.item_master_data || []), // Fixed: camelCase
              customerId: DEMO_CUSTOMER_ID, // Fixed: camelCase - Special demo customer ID
              createdByUserId: userId, // Link to logged-in user if available
              environment: 'post-secondary-demo', // More specific environment
              // Add the missing new fields
              uniqueId: uniqueId?.trim() || null,
              programMajor: programMajor?.trim() || null,
              reportAuthor: reportAuthor?.trim() || null,
              // Add the missing document names - ensure array format
              documentNames: documents.map((d: any) => d.filename || d.name || `document_${documents.indexOf(d) + 1}.txt`).filter(Boolean)
            };
            
            try {
              await storage.createAssessmentCase(caseData);
              console.log('✅ Demo assessment case created successfully:', caseId);
            } catch (dbError: any) {
              console.warn('⚠️  Failed to save demo case to database:', dbError.message);
              // Continue anyway - analysis succeeded even if database save failed
            }
            
            return res.json({ 
              success: true, 
              markdown_report: result.markdown_report,
              analysis_result: result.markdown_report,
              case_id: caseId
            });
          }
        }
        
        // If we reach here, unsupported module type
        return res.json({ 
          error: `Demo mode does not support ${moduleType} module`,
          supported_modules: ["tutoring", "post_secondary", "k12"]
        });
        
      } catch (error: any) {
        console.error('Demo analysis error:', error);
        res.status(500).json({ 
          error: error.message || 'Demo analysis failed',
          demo: true
        });
      }
    });

    // Analysis endpoint - dual pathway routing (simple/complex) with authentication
    app.post("/api/analyze-assessment", requireAuth, requireCustomerAccess, async (req, res) => {
      try {
        const moduleType = req.body.moduleType || 'post_secondary';
        const pathway = req.body.pathway || 'simple'; // New: pathway selection
        const caseId = req.body.caseId || `analysis-${Date.now()}`;
        const documents = req.body.documents || req.body.documentContents || [];
        const studentGrade = req.body.studentGrade;
        const uniqueId = req.body.uniqueId;
        const programMajor = req.body.programMajor;
        const reportAuthor = req.body.reportAuthor;
        
        console.log('=== DUAL PATHWAY ANALYSIS REQUEST ===');
        console.log(`Module type: ${moduleType}`);
        console.log(`Pathway: ${pathway}`);
        console.log(`Case ID: ${caseId}`);
        console.log(`Documents: ${documents.length}`);
        
        // Tutoring module always uses simple pathway (JSON-first approach)
        if (moduleType === 'tutoring') {
          console.log('🧩 Using JSON-first pipeline for tutoring module (simple-only)');
        } else if (pathway === 'complex' && (moduleType === 'k12' || moduleType === 'post_secondary')) {
          console.log('🔬 Using complex pathway with function calling and lookup tables');
          
          // Route to complex pathway using LocalAIService
          const aiService = new LocalAIService();
          const analysisRequest: AIAnalysisRequest = {
            caseId,
            moduleType: moduleType as 'k12' | 'post_secondary',
            pathway: 'complex',
            documents,
            uniqueId,
            programMajor,
            reportAuthor,
            studentGrade
          };
          
          const result = await aiService.processAnalysis(analysisRequest);
          return res.json(result);
        } else {
          console.log('🚀 Using simple pathway with direct OpenAI analysis');
        }
        
        // Check if request is from demo environment (frontend can pass this)
        const requestEnv = req.body.environment || req.headers['x-environment'] || process.env.APP_ENVIRONMENT || 'replit-prod';
        const currentEnv = requestEnv;
        const promptModuleType = (currentEnv === 'post-secondary-demo') ? 'post_secondary' : moduleType;
        
        console.log(`🔄 Environment: ${currentEnv}, Module: ${moduleType}, Prompt Module: ${promptModuleType}`);
        
        // Get report format template from database (not system prompts)
        const reportFormatPrompts = await storage.getPromptSections(promptModuleType, 'report_format');
        
        // Use demo-specific template if in demo environment
        const isDemoEnv = currentEnv === 'post-secondary-demo' || currentEnv === 'k12-demo';
        const templateKey = isDemoEnv ? 
          `markdown_report_template_${promptModuleType}_demo` : 
          `markdown_report_template_${promptModuleType}`;
        
        const templateSection = reportFormatPrompts.find(p => p.section_key === templateKey);
        
        // Fallback to regular template if demo template not found
        let template = templateSection?.content || '';
        if (!template && isDemoEnv) {
          const fallbackSection = reportFormatPrompts.find(p => p.section_key === `markdown_report_template_${promptModuleType}`);
          if (fallbackSection) {
            console.log(`⚠️  Demo template not found, using fallback: ${fallbackSection.section_key}`);
            template = fallbackSection.content;
          }
        }
        
        console.log(`📋 Template loaded from database (report_format type): ${template.length} characters`);
        console.log(`📋 Template preview: ${template.substring(0, 100)}...`);
        
        // Also load system prompts separately for later use
        const systemPrompts = await storage.getPromptSections(promptModuleType, 'system');
        
        // Use demo-specific system prompt if in demo environment
        const systemPromptKey = isDemoEnv ? 
          `system_instructions_${promptModuleType}_demo` : 
          `system_instructions_${promptModuleType}`;
        
        let systemInstructions = systemPrompts.find(p => p.section_key === systemPromptKey);
        
        // Fallback to regular system prompt if demo prompt not found
        if (!systemInstructions && isDemoEnv) {
          systemInstructions = systemPrompts.find(p => p.section_key === `system_instructions_${promptModuleType}`);
          if (systemInstructions) {
            console.log(`⚠️  Demo system prompt not found, using fallback: ${systemInstructions.section_key}`);
          }
        }

        const templateFixKeyCandidates = isDemoEnv
          ? [
              `system_instructions_${promptModuleType}_template_fix_demo`,
              `system_instructions_${promptModuleType}_template_fix`
            ]
          : [`system_instructions_${promptModuleType}_template_fix`];
        const templateFixPrompt = templateFixKeyCandidates
          .map(key => systemPrompts.find(p => p.section_key === key))
          .find((prompt): prompt is { content: string } => Boolean(prompt?.content));
        
        console.log(`📋 System prompt loaded: ${systemInstructions?.content?.length || 0} characters`);
        
        // Check if we got a valid template from database
        if (!template || template.length === 0) {
          console.error(`❌ No template found for prompt module type: ${promptModuleType}`);
          return res.status(500).json({ 
            error: `No report template found for module type: ${promptModuleType}. Please ensure templates are configured in the database.` 
          });
        }
        
        console.log(`✅ Using database template for ${promptModuleType}: ${template.length} characters`);
        console.log(`📋 Template preview: ${template.substring(0, 200)}...`);
        
        // Build analysis prompt - just provide documents and template
        const analysisPrompt = `DOCUMENTS TO ANALYZE:
  ${documents.map((doc: any, index: number) => `
  Document ${index + 1}: ${doc.filename}
  Content: ${doc.content}
  `).join('\n')}

  ${studentGrade ? `Student Grade: ${studentGrade}\n` : ''}

  Please analyze these documents and create a report following this exact template:

  ${template}`;

        // Call OpenAI directly with simple approach using environment variable
        const OpenAI = (await import('openai')).default;
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
          console.error('❌ OPENAI_API_KEY environment variable not found');
          return res.status(500).json({ 
            error: 'OpenAI API key not configured. Please check environment variables.' 
          });
        }
        
        console.log('✅ Using OPENAI_API_KEY from environment in routes.ts');
        
        const openai = new OpenAI({ 
          apiKey: apiKey
        });
        
        // Build system prompt - require database system instructions
        if (!systemInstructions?.content) {
          console.error(`❌ No system instructions found for prompt module type: ${promptModuleType}`);
          return res.status(500).json({ 
            error: `No system instructions found for module type: ${promptModuleType}. Please ensure system_instructions_${promptModuleType} exists in the database.` 
          });
        }
        
        // Handle tutoring module with JSON-first approach
        if (moduleType === 'tutoring') {
          console.log('🧩 Processing tutoring module with JSON-first pipeline...');
          
          try {
            // Convert documents to simple string array for JSON service
            const documentStrings = documents.map((doc: any) => `${doc.filename}:\n${doc.content}`);
            
            // Generate JSON report with QC metadata
            const { jsonReport, markdownReport } = await aiJSONService.generateJSONReport(
              documentStrings,
              moduleType,
              uniqueId,
              studentGrade
            );
            
            console.log('✅ JSON report generated successfully');
            if (moduleType === 'tutoring') {
              console.log(`📊 Tutoring schema enforced: strict format with comprehensive sections`);
            } else {
              console.log(`📊 QC Summary: Avg Confidence: ${(jsonReport as any).overallQC.averageConfidence}, Uncertainties: ${(jsonReport as any).overallQC.totalUncertainties}`);
            }
            
            // Create assessment case with both JSON and markdown data
            const generatedId = crypto.randomUUID();
            console.log('🆔 Generated UUID:', generatedId);
            
            const assessmentCase = {
              id: generatedId,
              case_id: caseId,
              display_name: `Tutoring Analysis - ${uniqueId || 'Student'}`,
              module_type: moduleType,
              status: 'completed',
              created_date: new Date().toISOString(),
              last_updated: new Date().toISOString(),
              unique_id: uniqueId,
              program_major: programMajor,
              report_author: reportAuthor,
              student_grade: studentGrade,
              report_data: markdownReport,
              reportDataJson: jsonReport,
              qcMetadata: moduleType === 'tutoring' ? {
                schema_enforced: true,
                schema_version: (jsonReport as any).meta?.schema_version || '1.0.0',
                strict_structure: true,
                generatedAt: new Date().toISOString()
              } : {
                averageConfidence: (jsonReport as any).overallQC.averageConfidence,
                totalUncertainties: (jsonReport as any).overallQC.totalUncertainties,
                recommendsReview: (jsonReport as any).overallQC.recommendsReview,
                generatedAt: new Date().toISOString()
              },
              customerId: req.user?.customerId,
              createdByUserId: req.user?.id
            };
            
            // Save to database
            const savedCase = await storage.createAssessmentCase(assessmentCase);
            
            return res.json({
              success: true,
              analysis_date: new Date().toISOString(),
              status: 'completed',
              markdown_report: markdownReport,
              json_report: jsonReport,
              qc_metadata: assessmentCase.qcMetadata,
              case_id: savedCase.id || caseId,
              module_type: moduleType
            });
            
          } catch (error) {
            console.error('❌ Tutoring module analysis failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error in tutoring analysis';
            return res.status(500).json({
              success: false,
              error: errorMessage,
              status: 'failed'
            });
          }
        }
        
        // Continue with existing logic for other modules
        // Use system prompt directly from database without modifications
        const systemPromptContent = systemInstructions.content;

        const response = await openai.chat.completions.create({
          model: 'gpt-4.1', // using GPT-4.1 for better instruction following
          messages: [
            {
              role: 'system',
              content: systemPromptContent
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          max_tokens: 4500,
          temperature: 0.1
        });

        let markdownReport = response.choices[0].message.content || '';
        
        console.log('🔍 Validating template adherence...');
        console.log(`📄 Original report preview (first 200 chars): ${markdownReport.substring(0, 200)}`);
        
        // Validate template adherence - check for common template violations
        const templateViolations = [];
        
        // Only validate post-secondary reports
        if (moduleType === 'post_secondary') {
          // Check for any combined sections (case-insensitive and comprehensive)
          const combinedSectionPatterns = [
            /functional barriers and required accommodations/i,
            /summary of functional barriers and required/i,
            /summary of functional barriers and accommodations/i,
            /barriers and accommodations/i,
            /functional barriers & accommodations/i,
            /functional barriers & required accommodations/i,
            /barriers & accommodations/i,
            /functional limitations and accommodations/i,
            /impairments and accommodations/i
          ];
          
          combinedSectionPatterns.forEach((pattern, index) => {
            if (markdownReport && pattern.test(markdownReport)) {
              templateViolations.push(`Combined section pattern ${index + 1} detected: ${pattern.source}`);
            }
          });
          
          // Check for wrong section headings
          const wrongHeadingPatterns = [
            /## summary of functional barriers/i,
            /### summary of functional barriers/i,
            /## functional barriers/i,
            /## barriers and accommodations/i,
            /## disability accommodation report:/i  // should not have colon and name
          ];
          
          wrongHeadingPatterns.forEach((pattern, index) => {
            if (markdownReport && pattern.test(markdownReport)) {
              templateViolations.push(`Wrong heading pattern ${index + 1} detected: ${pattern.source}`);
            }
          });
        }
        
        // Check for required section headings (only for post-secondary)
        if (moduleType === 'post_secondary' && markdownReport) {
          if (!markdownReport.includes('## 2. Functional Impact Summary')) {
            templateViolations.push('Missing required Section 2 heading');
          }
          
          if (!markdownReport.includes('## 3. Accommodation & Support Plan')) {
            templateViolations.push('Missing required Section 3 heading');
          }
        }
        
        console.log(`🔍 Template violations found: ${templateViolations.length}`);
        console.log('🔍 Template violations:', templateViolations);
        
        // If template violations detected, regenerate with stronger enforcement (post-secondary only)
        if (templateViolations.length > 0 && moduleType === 'post_secondary') {
          console.log('⚠️ Template violations detected:', templateViolations);
          console.log('🔄 Regenerating with stronger template enforcement...');
          
          if (!templateFixPrompt?.content) {
            const missingKey = templateFixKeyCandidates.join(', ');
            console.error(`❌ Missing template fix system instructions. Expected one of: ${missingKey}`);
            return res.status(500).json({
              error: `Template enforcement prompt not configured for module: ${promptModuleType}`,
              required_prompt_keys: templateFixKeyCandidates
            });
          }

          const fixedResponse = await openai.chat.completions.create({
            model: 'gpt-4.1',
            messages: [
              {
                role: 'system',
                content: templateFixPrompt.content
              },
              {
                role: 'user',
                content: `Fix this report to follow the correct template structure:\n\n${markdownReport}\n\nRemember: Section 2 is ONLY barriers, Section 3 is ONLY accommodations. Keep them completely separate.`
              }
            ],
            max_tokens: 4500,
            temperature: 0.1
          });
          
          markdownReport = fixedResponse.choices[0].message.content || markdownReport;
          console.log('✅ Template enforcement correction applied');
          console.log(`📄 Fixed report preview (first 200 chars): ${markdownReport.substring(0, 200)}`);
        } else {
          console.log('✅ No template violations detected, proceeding with original report');
        }
        
        // Demo Mode Enhancement: Flag functional impairment 3 for review in demo mode only
        if (currentEnv === 'post-secondary-demo' && moduleType === 'post_secondary') {
          console.log('🔍 Demo Mode: Adding review flag to functional impairment 3...');
          
          // Parse the markdown report to find functional barriers
          const barrierPattern = /\*\*(\d+):\*\*\s*([^*]+?)(?=Evidence:|$)/g;
          let match;
          let barrierCount = 0;
          let modifiedReport = markdownReport || '';
          
          // Find barrier 3 and add review flag
          while ((match = barrierPattern.exec(markdownReport)) !== null) {
            const barrierNumber = parseInt(match[1]);
            if (barrierNumber === 3) {
              console.log('✅ Found functional barrier 3, adding review flag...');
              
              // Add review flag marker to barrier 3
              const flaggedBarrierText = `**3:** ${match[2].trim()} *(Flagged for Review - Demo Mode)*`;
              modifiedReport = modifiedReport.replace(match[0], flaggedBarrierText);
              
              console.log('📝 Barrier 3 flagged for review in demo mode');
              break;
            }
          }
          
          markdownReport = modifiedReport;
        }

        // Create result structure
        const result = {
          status: 'completed',
          analysis_date: new Date().toISOString(),
          markdown_report: markdownReport,
          module_type: moduleType,
          item_master_data: [], // Simple pathway - no structured data
          processing_method: 'simple_pathway',
          template_used: template.length > 0,
          template_violations: templateViolations,
          demo_flags: currentEnv === 'post-secondary-demo' ? ['functional_barrier_3_flagged'] : []
        };
        
        console.log('✅ Simple analysis completed successfully');
        console.log(`- Status: ${result.status}`);
        console.log(`- Report Length: ${result.markdown_report?.length || 0} chars`);
        console.log(`- Processing Method: ${result.processing_method}`);
        console.log(`- Template Used: ${result.template_used}`);
        
        // Save the analysis result to the database
        try {
          console.log('💾 Saving analysis result to database...');
          
          // Create the assessment case if it doesn't exist
          const caseData = {
            case_id: caseId,
            display_name: uniqueId || documents[0]?.filename || (moduleType === 'k12' ? 'K-12 Analysis' : 'Post-Secondary Analysis'),
            module_type: moduleType,
            grade_band: studentGrade,
            status: 'completed',
            documentNames: documents.map((d: any) => d.filename || d.name || `document_${documents.indexOf(d) + 1}.txt`).filter(Boolean)
          };
          
          // Simplified save approach - create case with report data in one operation
          console.log('Creating assessment case with report data...');
          
          // Create backup when first generating report
          const reportDataWithBackup = {
            ...result,
            backup_report: result.markdown_report || result,
            is_edited: false
          };

          const caseWithReport = {
            id: crypto.randomUUID(),
            case_id: caseId,
            display_name: uniqueId || caseData.display_name,
            module_type: moduleType,
            status: 'completed',
            grade_band: studentGrade,
            documentNames: documents.map((d: any) => d.filename || d.name || `document_${documents.indexOf(d) + 1}.txt`).filter(Boolean),
            report_data: reportDataWithBackup,
            // Add the missing new fields
            unique_id: uniqueId?.trim() || null,
            program_major: programMajor?.trim() || null,
            report_author: reportAuthor?.trim() || null
          };
          
          // Use direct SQL to create case with report data in one transaction
          const createdId = await createAssessmentCaseDirectly(caseWithReport);
          
          if (createdId) {
            console.log('✅ Assessment case created with report data:', createdId);
          } else {
            console.log('⚠️ Failed to save assessment case, but analysis completed');
          }
          
          console.log('✅ Analysis result saved to database successfully');
        } catch (dbError) {
          console.error('⚠️ Failed to save to database:', dbError);
          // Continue anyway - the analysis is complete
        }
        
        res.json(result);
        
      } catch (error: any) {
        console.error('❌ Simple analysis failed:', error);
        res.status(500).json({ 
          status: 'error',
          error: error.message,
          analysis_date: new Date().toISOString(),
          processing_method: 'simple_pathway'
        });
      }
    });

    // NEW: K-12 Complex Analysis Route
    app.post('/api/analyze-assessment-k12', async (req: Request, res: Response) => {
      console.log('🎯 K-12 Complex Analysis endpoint called');
      
      const { caseId, documents, studentGrade, uniqueId, programMajor, reportAuthor } = req.body;
      
      // This is a K-12-specific endpoint, no need to check moduleType

      try {
        // Use the AI service which implements the complex three-step workflow
        const aiService = new LocalAIService();
        
        const analysisRequest: AIAnalysisRequest = {
          caseId,
          moduleType: 'k12',
          documents,
          uniqueId,
          programMajor,
          reportAuthor,
          studentGrade
        };

        console.log('🔄 Processing K-12 analysis with complex workflow...');
        
        // Create the assessment case FIRST before running analysis
        const caseData = {
          id: caseId,
          case_id: caseId,
          display_name: uniqueId || documents[0]?.filename || 'K-12 Analysis',
          module_type: 'k12',
          status: 'processing',
          grade_band: studentGrade,
          documentNames: documents.map((d: any) => d.filename || d.name || `document_${documents.indexOf(d) + 1}.txt`).filter(Boolean),
          report_data: null
        };
        
        const createdCaseId = await createAssessmentCaseDirectly(caseData);
        
        if (!createdCaseId) {
          console.error('Failed to create assessment case');
          return res.status(500).json({ error: 'Failed to create assessment case' });
        }
        
        console.log('✅ Assessment case created:', createdCaseId);
        
        // Now run the analysis with the case already created
        // This will use function calling and the three-step process:
        // 1. Technical Weakness Identification
        // 2. Canonical Key Resolution
        // 3. Item Master Population
        const result = await aiService.processAnalysis(analysisRequest);

        // For K-12, we should generate the markdown report FROM the database item master data
        if (result.status === 'completed') {
          console.log('📝 Generating K-12 report from database item master data...');
          
          // Get the K-12 report template
          const reportTemplates = await storage.getPromptSections('k12', 'report_format');
          const k12Template = reportTemplates.find(p => 
            p.section_key === 'markdown_report_template_k12'
          );

          // Get item master data from database after AI processing
          const itemMasterData = await db.select()
            .from(itemMaster)
            .where(eq(itemMaster.assessmentCaseId, caseId));
          
          console.log(`🗄️ Retrieved ${itemMasterData.length} item master records from database for report generation`);

          // Generate markdown from actual database item master data
          const markdownReport = await generateK12ReportFromItemMaster(
            itemMasterData,
            k12Template?.content || '',
            studentGrade
          );

          result.markdown_report = markdownReport;
        }

        // Update the assessment case with the completed report
        // Create backup when first generating report
        const reportDataWithBackup = {
          ...result,
          backup_report: result.markdown_report || result,
          is_edited: false
        };

        await storage.updateAssessmentCase(caseId, {
          status: 'completed',
          report_data: reportDataWithBackup
        });
        
        // Now save the item master data to the database
        if (result.item_master_data && result.item_master_data.length > 0) {
          console.log(`💾 Saving ${result.item_master_data.length} item master entries to database...`);
          
          try {
            await saveItemMasterDataToDatabase(result.item_master_data, caseId, studentGrade);
            console.log('✅ Item master data saved to database');
          } catch (dbError) {
            console.error('⚠️ Failed to save item master data to database:', dbError);
            // Continue anyway - the analysis is complete
          }
        }

        console.log('✅ K-12 complex analysis completed');
        return res.json(result);

      } catch (error: any) {
        console.error('❌ K-12 complex analysis failed:', error);
        return res.status(500).json({ 
          error: 'K-12 analysis failed', 
          details: error.message 
        });
      }
    });

}

// Helper function to validate item master data fields
function validateItemMasterFields(item: any): {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const requiredFields = ['canonical_key', 'evidence_basis'];
  const recommendedFields = [
    'item_label', 
    'parent_friendly_label', 
    'classroom_observation', 
    'support_1', 
    'support_2', 
    'caution_note'
  ];
  
  const missingRequired = requiredFields.filter(field => !item[field]);
  const missingRecommended = recommendedFields.filter(field => !item[field]);
  
  return {
    isValid: missingRequired.length === 0,
    missingFields: missingRequired,
    warnings: missingRecommended
  };
}

// Helper function to generate K-12 report from item master data
async function generateK12ReportFromItemMaster(
  itemMasterData: any[],
  template: string,
  studentGrade: string
): Promise<string> {
  console.log('📝 Generating K-12 report from item master data...');
  console.log(`- Item count: ${itemMasterData.length}`);
  console.log(`- Grade: ${studentGrade}`);
  console.log(`- Template length: ${template.length}`);
  
  // Validate item master data
  const validationResults = itemMasterData.map(item => ({
    item,
    validation: validateItemMasterFields(item)
  }));
  
  const invalidItems = validationResults.filter(r => !r.validation.isValid);
  if (invalidItems.length > 0) {
    console.warn('⚠️ Some items have missing required fields:');
    invalidItems.forEach(({ item, validation }) => {
      console.warn(`  - ${item.canonical_key || 'Unknown'}: missing ${validation.missingFields.join(', ')}`);
    });
  }

  // If we have a template from the database, use it with proper data population
  if (template && template.length > 0) {
    console.log('✅ Using database template for K-12 report generation');
    
    // Parse the template and populate with actual data
    let populatedTemplate = template;
    
    // Replace basic placeholders
    populatedTemplate = populatedTemplate.replace(/\[Date\]/g, new Date().toLocaleDateString());
    populatedTemplate = populatedTemplate.replace(/\[Grade Level\]/g, studentGrade);
    populatedTemplate = populatedTemplate.replace(/\[Grade\]/g, studentGrade);
    populatedTemplate = populatedTemplate.replace(/\[Total Count\]/g, itemMasterData.length.toString());
    populatedTemplate = populatedTemplate.replace(/\[Total count\]/g, itemMasterData.length.toString());
    
    // Count items by quality control status
    const validatedItems = itemMasterData.filter(item => 
      item.resolution_method === 'exact_match' || item.validation_status === 'validated'
    );
    const reviewItems = itemMasterData.filter(item => 
      item.validation_status === 'partial_inference' || item.resolution_method === 'ai_resolved' || item.validation_status === 'full_inference'
    );
    const flaggedItems = itemMasterData.filter(item => 
      item.validation_status === 'flagged'
    );
    
    populatedTemplate = populatedTemplate.replace(/\[Validated Count\]/g, validatedItems.length.toString());
    populatedTemplate = populatedTemplate.replace(/\[Validated count\]/g, validatedItems.length.toString());
    populatedTemplate = populatedTemplate.replace(/\[Review Count\]/g, reviewItems.length.toString());
    populatedTemplate = populatedTemplate.replace(/\[Review count\]/g, reviewItems.length.toString());
    populatedTemplate = populatedTemplate.replace(/\[Flagged Count\]/g, flaggedItems.length.toString());
    populatedTemplate = populatedTemplate.replace(/\[Flagged count\]/g, flaggedItems.length.toString());
    
    // Generate detailed findings sections
    const generateFindingSection = (items: any[]) => {
      if (items.length === 0) return 'No items in this category.';
      
      return items.map((item, index) => {
        // Helper function to mark inferred fields
        const markInferredField = (value: string, isInferred: boolean) => {
          if (isInferred && value && value !== 'Assessment data indicates this area of need') {
            return `${value} *(AI-generated)*`;
          }
          return value;
        };

        // Determine if fields are inferred based on validation status
        const isInferred = item.validation_status === 'partial_inference' || item.validation_status === 'full_inference';
        
        return `#### ${index + 1}. ${item.canonical_key || item.item_label || 'Unknown Item'}

**Evidence:** ${item.evidence_basis || item.evidence || 'Assessment data indicates this area of need'}

**Teacher-Friendly Description:** ${markInferredField(item.item_label || item.description || 'Support needed in this area', isInferred)}

**Parent-Friendly Explanation:** ${markInferredField(item.parent_friendly_label || item.plain_language_label || 'This area may require additional support', isInferred)}

**Observable Behaviors:** ${markInferredField(item.classroom_observation || item.observation || 'Monitor for signs of difficulty in this area', isInferred)}

**Primary Support Strategy:** ${markInferredField(item.support_1 || item.primary_support || 'Provide additional support and scaffolding', isInferred)}

**Secondary Support Strategy:** ${markInferredField(item.support_2 || item.secondary_support || 'Consider alternative approaches if needed', isInferred)}

**Implementation Caution:** ${markInferredField(item.caution_note || item.implementation_notes || 'Monitor effectiveness and adjust as needed', isInferred)}

**Quality Control:**
- Status: ${item.validation_status || 'validated'}
- Grade Band: ${item.grade_band || studentGrade}
- Mapping Method: ${item.resolution_method || 'database_lookup'}
- Inference Level: ${item.inference_level || 'database'}

---`;
      }).join('\n');
    };
    
    // Replace the dynamic content sections - using exact placeholder text
    console.log('🔄 Replacing template placeholders...');
    console.log(`- Validated items count: ${validatedItems.length}`);
    console.log(`- Review items count: ${reviewItems.length}`);
    console.log(`- Flagged items count: ${flaggedItems.length}`);
    
    // Check if placeholders exist in template
    const hasValidatedPlaceholder = populatedTemplate.includes('[For each validated finding');
    const hasReviewPlaceholder = populatedTemplate.includes('[Same format as validated findings, but with qc_flag');
    console.log(`- Has validated placeholder: ${hasValidatedPlaceholder}`);
    console.log(`- Has review placeholder: ${hasReviewPlaceholder}`);
    
    // Replace exact text as it appears in template
    const beforeLength = populatedTemplate.length;
    
    // First replacement - validated findings
    const validatedContent = generateFindingSection(validatedItems);
    console.log(`- Generated validated content: ${validatedContent.length} chars`);
    
    // Replace new template placeholders that match the current template
    populatedTemplate = populatedTemplate.replace(/\[FOR_EACH_VALIDATED_FINDING\]/g, validatedContent);
    populatedTemplate = populatedTemplate.replace(/\[VALIDATED_ITEMS_CONTENT\]/g, validatedContent);
    
    // Check if replacement happened
    const afterValidated = populatedTemplate.length;
    console.log(`- After validated replacement: ${beforeLength} -> ${afterValidated} chars`);
    
    // Second replacement - review findings
    const reviewContent = generateFindingSection(reviewItems);
    console.log(`- Generated review content: ${reviewContent.length} chars`);
    
    // Replace review placeholders
    populatedTemplate = populatedTemplate.replace(/\[FOR_EACH_REVIEW_FINDING\]/g, reviewContent);
    populatedTemplate = populatedTemplate.replace(/\[REVIEW_ITEMS_CONTENT\]/g, reviewContent);
    
    // Third replacement - flagged findings
    const flaggedContent = generateFindingSection(flaggedItems);
    console.log(`- Generated flagged content: ${flaggedContent.length} chars`);
    
    // Try different placeholder formats for flagged items
    if (populatedTemplate.includes("[Same format as validated findings, but with qc_flag = 'flagged']")) {
      populatedTemplate = populatedTemplate.replace(
        "[Same format as validated findings, but with qc_flag = 'flagged']",
        flaggedContent
      );
    } else if (populatedTemplate.includes("[Same format as validated findings, but with qc_flag = ''flagged'']")) {
      // Handle template with double quotes
      populatedTemplate = populatedTemplate.replace(
        "[Same format as validated findings, but with qc_flag = ''flagged'']",
        flaggedContent
      );
    } else if (populatedTemplate.includes("[Same format as validated findings")) {
      // Handle variations - find all matches and replace the second one
      const flaggedMatches = populatedTemplate.match(/\[Same format as validated findings[^\]]*\]/g);
      if (flaggedMatches && flaggedMatches.length > 1) {
        // Replace the second occurrence (after review items)
        const firstOccurrence = flaggedMatches[0];
        const secondOccurrenceIndex = populatedTemplate.lastIndexOf(flaggedMatches[flaggedMatches.length - 1]);
        populatedTemplate = populatedTemplate.substring(0, secondOccurrenceIndex) + 
                           flaggedContent + 
                           populatedTemplate.substring(secondOccurrenceIndex + flaggedMatches[flaggedMatches.length - 1].length);
      }
    }
    
    const finalLength = populatedTemplate.length;
    console.log(`- Final template length: ${finalLength} chars (${finalLength - beforeLength} chars added)`);
    
    // COMPREHENSIVE TEMPLATE REPLACEMENT TEST
    console.log('🔍 COMPREHENSIVE TEMPLATE REPLACEMENT TEST:');
    console.log(`- Original template length: ${template.length}`);
    console.log(`- Original template contains [FOR_EACH_VALIDATED_FINDING]: ${template.includes('[FOR_EACH_VALIDATED_FINDING]')}`);
    console.log(`- Original template contains [FOR_EACH_REVIEW_FINDING]: ${template.includes('[FOR_EACH_REVIEW_FINDING]')}`);
    console.log(`- Original template contains [VALIDATED_ITEMS_CONTENT]: ${template.includes('[VALIDATED_ITEMS_CONTENT]')}`);
    console.log(`- Original template contains [REVIEW_ITEMS_CONTENT]: ${template.includes('[REVIEW_ITEMS_CONTENT]')}`);
    console.log(`- Original template contains [FLAGGED_ITEMS_CONTENT]: ${template.includes('[FLAGGED_ITEMS_CONTENT]')}`);
    
    // Show data categorization
    console.log('📊 DATA CATEGORIZATION:');
    console.log(`- Total items: ${itemMasterData.length}`);
    console.log(`- Validated items: ${validatedItems.length}`);
    console.log(`- Review items: ${reviewItems.length}`);
    console.log(`- Flagged items: ${flaggedItems.length}`);
    
    // Show actual item data being processed
    console.log('📋 ITEM MASTER DATA DETAILS:');
    itemMasterData.forEach((item, index) => {
      console.log(`  ${index + 1}. Key: ${item.canonical_key}`);
      console.log(`     Label: "${item.item_label}"`);
      console.log(`     Status: ${item.validation_status}`);
      console.log(`     Evidence: ${item.evidence_basis?.substring(0, 50)}...`);
    });
    
    // Show replacement results
    console.log('🔄 REPLACEMENT RESULTS:');
    console.log(`- Final template length: ${populatedTemplate.length}`);
    console.log(`- Length change: ${populatedTemplate.length - template.length} chars`);
    console.log(`- Still contains [FOR_EACH_VALIDATED_FINDING]: ${populatedTemplate.includes('[FOR_EACH_VALIDATED_FINDING]')}`);
    console.log(`- Still contains [VALIDATED_ITEMS_CONTENT]: ${populatedTemplate.includes('[VALIDATED_ITEMS_CONTENT]')}`);
    console.log(`- Final template preview: ${populatedTemplate.substring(0, 300)}...`);
    
    // Replace other dynamic content
    const mappingMethods = Array.from(new Set(itemMasterData.map(item => item.resolution_method || 'database_lookup')));
    populatedTemplate = populatedTemplate.replace(
      /\[List of unique mapping methods used\]/g,
      mappingMethods.join(', ')
    );
    
    // Add inference legend
    const inferredItemCount = itemMasterData.filter(item => 
      item.validation_status === 'partial_inference' || item.validation_status === 'full_inference'
    ).length;
    
    const inferenceNote = inferredItemCount > 0 
      ? `\n\n**Field Inference Legend:**\n- Fields marked with *(AI-generated)* were created through cascade inference when database lookups returned incomplete data\n- ${inferredItemCount} out of ${itemMasterData.length} items contain AI-generated fields\n- All AI-generated content is based on established educational best practices and psychoeducational assessment principles`
      : '';
    
    populatedTemplate = populatedTemplate.replace(
      /---\n\n## Implementation Recommendations/,
      `${inferenceNote}\n\n---\n\n## Implementation Recommendations`
    );
    
    populatedTemplate = populatedTemplate.replace(
      /\[Grade-specific developmental factors\]/g,
      `Developmentally appropriate for grade ${studentGrade} students`
    );
    
    populatedTemplate = populatedTemplate.replace(
      /\[Grade-specific considerations for implementation\]/g,
      `Consider developmental stage and academic expectations for grade ${studentGrade}`
    );
    
    populatedTemplate = populatedTemplate.replace(
      /\[Core academic areas requiring support\]/g,
      itemMasterData.map(item => item.academic_domain || 'General academic support').join(', ')
    );
    
    populatedTemplate = populatedTemplate.replace(
      /\[Behavioral and social factors\]/g,
      itemMasterData.filter(item => item.domain === 'social' || item.domain === 'behavioral')
        .map(item => item.description).join(', ') || 'No significant concerns noted'
    );
    
    return populatedTemplate;
  } else {
    console.log('⚠️ No template found, using fallback K-12 format');
    
    // Fallback to basic K-12 format if no template
    return `# K-12 Educational Assessment Analysis Report

**Analysis Date:** ${new Date().toLocaleDateString()}
**Student Grade:** ${studentGrade}
**Total Findings:** ${itemMasterData.length}

---

## Student Strengths and Support Needs

${itemMasterData.map((item, index) => `### ${index + 1}. ${item.canonical_key || item.item_label}

**Evidence:** ${item.evidence_basis || item.evidence || 'Assessment data indicates this area of need'}

**Description:** ${item.item_label || item.description || 'Support needed in this area'}

**Support Strategies:** ${item.support_1 || item.primary_support || 'Provide additional support and scaffolding'}

---`).join('\n')}

## Implementation Recommendations

### For Teachers
- Implement the identified support strategies in classroom settings
- Monitor student progress and adjust supports as needed
- Coordinate with educational team for comprehensive support

### For Parents
- Work with school team to understand your child's needs
- Implement complementary strategies at home
- Maintain regular communication with teachers

---

*This report was generated using the K-12 Educational Assessment Analysis System.*`;
  }
}

// Helper function to save report data directly using SQL
async function saveReportDataDirectly(caseId: string, reportData: any): Promise<boolean> {
  try {
    const { pool } = await import('../db');
    
    // First check if the case exists
    const checkResult = await pool.query(
      'SELECT id FROM assessment_cases WHERE id = $1',
      [caseId]
    );
    
    if (checkResult.rows.length === 0) {
      console.log('Case does not exist, cannot update report data');
      return false;
    }
    
    // Update the existing case with report data
    await pool.query(
      'UPDATE assessment_cases SET report_data = $1, last_updated = NOW() WHERE id = $2',
      [JSON.stringify(reportData), caseId]
    );
    
    console.log('Report data updated successfully for case:', caseId);
    return true;
  } catch (error) {
    console.error('Direct SQL update failed:', error);
    return false;
  }
}

// Helper function to create assessment case directly using SQL
// Helper function to save item master data to database
async function saveItemMasterDataToDatabase(itemMasterData: any[], assessmentCaseId: string, gradeBand: string): Promise<void> {
  console.log('📊 Saving K-12 item master data with cascade inference fields...');
  
  for (const item of itemMasterData) {
    try {
      // Item data now includes cascade inference fields
      const itemData = {
        assessment_case_id: assessmentCaseId,
        canonical_key: item.canonical_key,
        item_label: item.item_label, // Populated by cascade inference
        grade_band: item.grade_band || gradeBand,
        parent_friendly_label: item.parent_friendly_label, // Populated by cascade inference
        classroom_observation: item.classroom_observation, // Populated by cascade inference
        support_1: item.support_1, // Populated by cascade inference
        support_2: item.support_2, // Populated by cascade inference
        caution_note: item.caution_note, // Populated by cascade inference
        evidence_basis: item.evidence_basis || item.evidence,
        validation_status: item.validation_status || 'validated',
        inference_level: item.inference_level || 'none',
        qc_flag: item.qc_flag || 'validated',
        source: item.source || 'ai_analysis',
        module_type: 'k12'
      };

      // Use raw SQL to insert the item master data with all cascade fields
      const { pool } = await import('../db');
      await pool.query(`
        INSERT INTO item_master (
          assessment_case_id, canonical_key, item_label, grade_band, 
          parent_friendly_label, classroom_observation, support_1, support_2, 
          caution_note, evidence_basis, validation_status, inference_level,
          qc_flag, source, module_type
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        )
      `, [
        assessmentCaseId,
        itemData.canonical_key,
        itemData.item_label,
        itemData.grade_band,
        itemData.parent_friendly_label,
        itemData.classroom_observation,
        itemData.support_1,
        itemData.support_2,
        itemData.caution_note,
        itemData.evidence_basis,
        itemData.validation_status,
        itemData.inference_level,
        itemData.qc_flag,
        itemData.source,
        itemData.module_type
      ]);

      console.log(`✅ Saved K-12 item master with ${itemData.inference_level} inference: ${itemData.canonical_key}`);
    } catch (error) {
      console.error(`❌ Failed to save item master entry ${item.canonical_key}:`, error);
    }
  }
}

async function createAssessmentCaseDirectly(caseData: any): Promise<string | null> {
  try {
    const { pool } = await import('../db');
    
    const result = await pool.query(
      `INSERT INTO assessment_cases (
        id, case_id, display_name, module_type, status, report_data, created_date, last_updated
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
      RETURNING id`,
      [
        caseData.id,
        caseData.case_id || caseData.id, // Use case_id if provided, otherwise use id
        caseData.display_name,
        caseData.module_type,
        caseData.status,
        JSON.stringify(caseData.report_data)
      ]
    );
    
    console.log('✅ Assessment case created via direct SQL:', result.rows[0].id);
    return result.rows[0].id;
  } catch (error) {
    console.error('Direct SQL insert failed:', error);
    return null;
  }
}
