# Background Job Processing

This application uses **Bull** (backed by Redis) to process long-running AI analysis operations asynchronously, improving server responsiveness and user experience.

## Why Background Jobs?

AI analysis operations can take 30 seconds to 2 minutes. Processing these synchronously blocks the server and creates a poor user experience. Background jobs solve this by:

1. **Non-blocking requests** - Server responds immediately with a job ID
2. **Progress tracking** - Clients can poll for status updates
3. **Retry logic** - Failed jobs automatically retry
4. **Scalability** - Multiple workers can process jobs in parallel
5. **Reliability** - Jobs persist in Redis even if server restarts

## Architecture

```
Client Request → API → Job Queue (Redis) → Background Worker → Database
     ↓                                            ↓
Job ID returned                            AI Analysis happens here
     ↓                                            ↓
Poll for status ←─────────────────── Job completes, result saved
```

## Setup

### 1. Install Redis

#### macOS
```bash
brew install redis
brew services start redis
```

#### Ubuntu/Debian
```bash
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

#### Verify Redis is running
```bash
redis-cli ping
# Should return: PONG
```

### 2. Configure Environment

Add to your `.env`:

```bash
# Redis Configuration (optional if using defaults)
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=your-password-if-needed
```

### 3. Start the Background Worker

The worker can run in two modes:

#### Option A: Integrated Mode (Development)
The worker runs automatically when you start the dev server:

```bash
npm run dev
```

The server will process jobs in the background while serving requests.

#### Option B: Separate Process (Production Recommended)
Run the worker in a separate process for better isolation and scaling:

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Start worker
npm run worker
```

Add this script to `package.json`:
```json
{
  "scripts": {
    "worker": "tsx --env-file=.env server/job-worker.ts"
  }
}
```

## Usage

### API Endpoints

#### 1. Submit AI Analysis Job

**POST** `/api/ai-analysis/submit`

```typescript
{
  "caseId": "uuid",
  "moduleType": "post_secondary",
  "documentText": "Assessment text...",
  "userId": 123,
  "customerId": "customer-id"
}
```

**Response:**
```json
{
  "jobId": "12345",
  "status": "waiting",
  "message": "Analysis job queued successfully"
}
```

#### 2. Check Job Status

**GET** `/api/ai-analysis/status/:jobId`

**Response:**
```json
{
  "jobId": "12345",
  "status": "active",
  "progress": 45,
  "createdAt": "2025-01-22T10:00:00Z",
  "updatedAt": "2025-01-22T10:00:30Z"
}
```

Possible statuses:
- `waiting` - Job is queued
- `active` - Job is being processed
- `completed` - Job finished successfully
- `failed` - Job failed (check `error` field)
- `delayed` - Job is delayed (will retry)

#### 3. Get Job Result

**GET** `/api/ai-analysis/result/:jobId`

**Response:**
```json
{
  "jobId": "12345",
  "status": "completed",
  "result": {
    "markdown_report": "...",
    "analysis_data": {...}
  }
}
```

#### 4. Cancel Job

**DELETE** `/api/ai-analysis/:jobId`

**Response:**
```json
{
  "success": true,
  "message": "Job cancelled successfully"
}
```

#### 5. Queue Health Check

**GET** `/api/ai-analysis/health`

**Response:**
```json
{
  "queue": "healthy",
  "stats": {
    "waiting": 2,
    "active": 1,
    "completed": 145,
    "failed": 3,
    "delayed": 0
  }
}
```

### Client Implementation Example

```typescript
// Submit analysis job
async function analyzeAssessment(documentText: string) {
  const response = await fetch('/api/ai-analysis/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      caseId: 'new-case-uuid',
      moduleType: 'post_secondary',
      documentText,
    }),
  });

  const { jobId } = await response.json();

  // Poll for status
  return pollJobStatus(jobId);
}

// Poll job status until complete
async function pollJobStatus(jobId: string): Promise<any> {
  const maxAttempts = 120; // 2 minutes (1 second intervals)
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(`/api/ai-analysis/status/${jobId}`);
    const status = await response.json();

    if (status.status === 'completed') {
      // Get final result
      const resultResponse = await fetch(`/api/ai-analysis/result/${jobId}`);
      return resultResponse.json();
    }

    if (status.status === 'failed') {
      throw new Error(status.error || 'Analysis failed');
    }

    // Update UI with progress
    updateProgress(status.progress);

    // Wait 1 second before next poll
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }

  throw new Error('Analysis timeout');
}

// Update UI with progress
function updateProgress(progress: number) {
  document.getElementById('progress-bar').style.width = `${progress}%`;
  document.getElementById('progress-text').textContent = `${progress}%`;
}
```

## Monitoring

### View Queue Dashboard (Development)

Bull provides a web UI called Bull Board. Install it:

```bash
npm install @bull-board/express @bull-board/api
```

Then add to your server:

```typescript
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { aiAnalysisQueue } from './job-queue';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullAdapter(aiAnalysisQueue)],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
```

Access dashboard at: `http://localhost:5001/admin/queues`

### Redis CLI Monitoring

```bash
# Monitor Redis operations in real-time
redis-cli MONITOR

# Check queue keys
redis-cli KEYS bull:ai-analysis:*

# Get queue stats
redis-cli INFO stats
```

### Log Monitoring

```bash
# View worker logs
tail -f logs/worker.log

# Filter for specific job
grep "jobId: 12345" logs/worker.log
```

## Scaling

### Horizontal Scaling

Run multiple worker processes:

```bash
# Start 4 worker processes
for i in {1..4}; do
  npm run worker &
done
```

Or use a process manager like PM2:

```bash
npm install -g pm2

# Start 4 worker processes
pm2 start server/job-worker.ts -i 4 --name ai-worker
```

### Rate Limiting

Limit job submission rate:

```typescript
import rateLimit from 'express-rate-limit';

const aiAnalysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many analysis requests, please try again later',
});

app.post('/api/ai-analysis/submit', aiAnalysisLimiter, async (req, res) => {
  // ... submit job
});
```

## Troubleshooting

### Redis Connection Failed

```bash
# Check if Redis is running
redis-cli ping

# Check Redis logs
tail -f /var/log/redis/redis-server.log

# Restart Redis
brew services restart redis  # macOS
sudo systemctl restart redis  # Linux
```

### Jobs Stuck in "Active" State

```bash
# Clean stuck jobs
redis-cli
> DEL bull:ai-analysis:active

# Or use Bull's clean method in code
await aiAnalysisQueue.clean(0, 'active');
```

### Worker Not Processing Jobs

1. Check worker logs for errors
2. Verify Redis connection
3. Ensure job processor is registered
4. Check for uncaught exceptions

### High Memory Usage

```bash
# Clean up old jobs
redis-cli
> SCAN 0 MATCH bull:ai-analysis:* COUNT 1000

# Adjust job retention in job-queue.ts
removeOnComplete: {
  age: 3600, // Reduce from 24 hours to 1 hour
  count: 100, // Reduce from 1000 to 100
}
```

## Production Checklist

- [ ] Redis persistence enabled (RDB or AOF)
- [ ] Redis password configured
- [ ] Multiple workers for redundancy
- [ ] Process manager (PM2, Docker, Kubernetes)
- [ ] Monitoring and alerting (Grafana, Datadog)
- [ ] Log aggregation (ELK, Splunk)
- [ ] Job retention policies configured
- [ ] Rate limiting enabled
- [ ] Health checks configured
- [ ] Backup strategy for Redis data

## Additional Resources

- [Bull Documentation](https://github.com/OptimalBits/bull)
- [Redis Documentation](https://redis.io/documentation)
- [Bull Board UI](https://github.com/felixmosh/bull-board)
