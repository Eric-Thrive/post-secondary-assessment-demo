// @ts-nocheck
import { aiAnalysisQueue, type AIAnalysisJobData, closeQueue } from './job-queue';
import { createLogger } from './reliability-improvements';
import { storage } from './storage';

const logger = createLogger(process.env.NODE_ENV === 'development');

/**
 * AI Analysis Job Worker
 * Processes AI analysis jobs from the queue
 *
 * This worker can be run in a separate process or as part of the main server.
 * For production, consider running multiple workers for parallel processing.
 */

// Process AI analysis jobs
aiAnalysisQueue.process('analyze', 2, async (job) => {
  const { caseId, moduleType, documentText, userId, customerId, options } = job.data as AIAnalysisJobData;

  logger.info('Processing AI analysis job', { jobId: job.id, caseId, moduleType });

  try {
    // Update progress: Starting analysis
    await job.progress(10);

    // Import AI service dynamically to avoid circular dependencies
    const { LocalAIService } = await import('./ai-service');
    const aiService = new LocalAIService();

    // Update progress: Initializing
    await job.progress(20);

    // Prepare analysis request
    const analysisRequest = {
      caseId,
      moduleType,
      documentText,
      options: options || {},
    };

    // Update progress: Analyzing with AI
    await job.progress(30);

    // Perform AI analysis (this is the long-running operation)
    const result = await aiService.analyzeAssessment(analysisRequest);

    // Update progress: Saving results
    await job.progress(80);

    // Save results to database
    await storage.updateAssessmentCase(caseId, {
      report_data: result,
      status: 'completed',
    });

    // Update progress: Complete
    await job.progress(100);

    logger.info('AI analysis job completed', { jobId: job.id, caseId });

    return {
      success: true,
      caseId,
      result,
    };
  } catch (error) {
    logger.error('AI analysis job failed', {
      jobId: job.id,
      caseId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Re-throw to mark job as failed
    throw error;
  }
});

// Handle worker lifecycle
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing worker gracefully');
  await closeQueue();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing worker gracefully');
  await closeQueue();
  process.exit(0);
});

logger.info('AI analysis worker started', {
  concurrency: 2,
  environment: process.env.NODE_ENV,
});

export default aiAnalysisQueue;
