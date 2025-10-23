import Queue from 'bull';
import { createLogger } from './reliability-improvements';

const logger = createLogger(process.env.NODE_ENV === 'development');

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

/**
 * AI Analysis Job Queue
 * Handles long-running AI processing operations asynchronously
 */
export const aiAnalysisQueue = new Queue('ai-analysis', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 604800, // Keep failed jobs for 7 days
      count: 5000,
    },
  },
});

// Job data interfaces
export interface AIAnalysisJobData {
  caseId: string;
  moduleType: string;
  documentText: string;
  userId?: number;
  customerId?: string;
  options?: Record<string, any>;
}

export interface JobStatus {
  jobId: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  progress: number;
  data?: any;
  error?: string;
  result?: any;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Add AI analysis job to queue
 */
export async function addAIAnalysisJob(data: AIAnalysisJobData): Promise<string> {
  try {
    const job = await aiAnalysisQueue.add('analyze', data, {
      timeout: 180000, // 3 minutes timeout
      attempts: 2, // Retry once on failure
    });

    logger.info('AI analysis job queued', { jobId: job.id, caseId: data.caseId });
    return job.id.toString();
  } catch (error) {
    logger.error('Failed to queue AI analysis job', error);
    throw new Error('Failed to queue analysis job');
  }
}

/**
 * Get job status by ID
 */
export async function getJobStatus(jobId: string): Promise<JobStatus | null> {
  try {
    const job = await aiAnalysisQueue.getJob(jobId);

    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress();

    return {
      jobId: job.id.toString(),
      status: state as JobStatus['status'],
      progress: typeof progress === 'number' ? progress : 0,
      data: job.data,
      error: job.failedReason,
      result: job.returnvalue,
      createdAt: new Date(job.timestamp),
      updatedAt: new Date(job.processedOn || job.timestamp),
    };
  } catch (error) {
    logger.error('Failed to get job status', { jobId, error });
    return null;
  }
}

/**
 * Wait for job completion (with timeout)
 */
export async function waitForJobCompletion(
  jobId: string,
  timeoutMs: number = 180000
): Promise<any> {
  const job = await aiAnalysisQueue.getJob(jobId);

  if (!job) {
    throw new Error('Job not found');
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Job timeout'));
    }, timeoutMs);

    job.finished()
      .then((result) => {
        clearTimeout(timeout);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

/**
 * Cancel a job
 */
export async function cancelJob(jobId: string): Promise<boolean> {
  try {
    const job = await aiAnalysisQueue.getJob(jobId);

    if (!job) {
      return false;
    }

    await job.remove();
    logger.info('Job cancelled', { jobId });
    return true;
  } catch (error) {
    logger.error('Failed to cancel job', { jobId, error });
    return false;
  }
}

/**
 * Get queue health metrics
 */
export async function getQueueHealth(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    aiAnalysisQueue.getWaitingCount(),
    aiAnalysisQueue.getActiveCount(),
    aiAnalysisQueue.getCompletedCount(),
    aiAnalysisQueue.getFailedCount(),
    aiAnalysisQueue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

/**
 * Clean up old jobs
 */
export async function cleanupOldJobs(): Promise<void> {
  try {
    // Remove completed jobs older than 24 hours
    await aiAnalysisQueue.clean(24 * 60 * 60 * 1000, 'completed');

    // Remove failed jobs older than 7 days
    await aiAnalysisQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');

    logger.info('Old jobs cleaned up');
  } catch (error) {
    logger.error('Failed to clean up old jobs', error);
  }
}

/**
 * Graceful shutdown
 */
export async function closeQueue(): Promise<void> {
  try {
    await aiAnalysisQueue.close();
    logger.info('Job queue closed');
  } catch (error) {
    logger.error('Failed to close job queue', error);
  }
}

// Log queue events
aiAnalysisQueue.on('error', (error) => {
  logger.error('Queue error', error);
});

aiAnalysisQueue.on('waiting', (jobId) => {
  logger.debug('Job waiting', { jobId });
});

aiAnalysisQueue.on('active', (job) => {
  logger.info('Job started', { jobId: job.id, caseId: job.data.caseId });
});

aiAnalysisQueue.on('completed', (job, result) => {
  logger.info('Job completed', {
    jobId: job.id,
    caseId: job.data.caseId,
    duration: Date.now() - job.timestamp,
  });
});

aiAnalysisQueue.on('failed', (job, error) => {
  logger.error('Job failed', {
    jobId: job?.id,
    caseId: job?.data.caseId,
    error: error.message,
  });
});

// Schedule periodic cleanup (every 6 hours)
setInterval(() => {
  cleanupOldJobs().catch((error) => {
    logger.error('Scheduled cleanup failed', error);
  });
}, 6 * 60 * 60 * 1000);

export default aiAnalysisQueue;
