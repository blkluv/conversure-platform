# JobQueue System Documentation

## Overview

The Conversure JobQueue system provides reliable, asynchronous job processing for AI generation, campaign sends, CRM syncs, and lead imports. Built on PostgreSQL via Prisma ORM, it offers production-grade features including retries, exponential backoff, idempotency, and dead-letter queues.

## Prerequisites

- **PostgreSQL**: Running locally on `localhost:5432`
- **Database**: `conversure` database created
- **Node.js**: Version 20.19.0 or higher
- **Dependencies**: All npm packages installed

## Database Setup

### Initial Setup

1. **Configure environment variables**

   Ensure your `.env` file contains:
   ```env
   DATABASE_URL="postgresql://postgres:conversurepass@localhost:5432/conversure?schema=public"
   ```

2. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

3. **Push schema to database**
   ```bash
   npx prisma db push
   ```

4. **Seed initial data**
   ```bash
   npx prisma db seed
   ```

### Verify Database Connection

Test PostgreSQL connection:
```bash
psql -U postgres -d conversure -c "SELECT COUNT(*) FROM \"JobQueue\";"
```

Expected: Returns `0` or count of existing jobs.

## Running the Worker

### Start Worker Process

In a separate terminal from your Next.js dev server:

```bash
npm run worker
```

Expected output:
```
🔧 [Worker] Initializing Conversure job queue worker...
🚀 [Worker] Starting job queue workers...
[Worker] Polling interval: 1000ms
```

### Stop Worker

Press `Ctrl+C` to trigger graceful shutdown:

```
[Worker] Received shutdown signal, stopping gracefully...
[Worker] Shutdown complete
```

## Enqueueing Jobs

### Using QueueFactory

```typescript
import { QueueFactory } from '@/lib/queue/QueueFactory';

const queue = QueueFactory.getQueue();

// Example: AI generation job
await queue.addJob(
  'ai_generation',
  {
    conversationId: 'conv_123',
    messageId: 'msg_456',
    companyId: 'comp_789'
  },
  {
    priority: 5,              // 0-10, higher = more urgent
    idempotencyKey: 'unique_key_123',  // Prevents duplicates
    maxAttempts: 3,           // Retry up to 3 times
    scheduledFor: new Date(Date.now() + 60000) // Delay 1 minute
  }
);
```

### Job Types

Available job types:
- `ai_generation` - AI message generation
- `campaign_send` - Campaign message dispatch
- `crm_sync` - Bitrix24 CRM synchronization
- `lead_import` - Bulk lead import processing

## Architecture

### Components

1. **QueueFactory** - Singleton factory for queue driver instantiation
2. **PrismaQueueDriver** - Database queue implementation
3. **Worker** - Polling-based job processor
4. **Processors** - Job-specific processing logic

### Job Lifecycle

```
PENDING → PROCESSING → COMPLETED
    ↓         ↓
    ↓     (retry with backoff)
    ↓         ↓
    └──→ DEAD_LETTER
```

### Retry Logic

- **Exponential backoff**: `2^attempts * 1000ms`
  - Attempt 1: Immediate
  - Attempt 2: 2 seconds
  - Attempt 3: 4 seconds
  - Attempt 4: 8 seconds (if maxAttempts > 3)

- **Dead Letter**: Jobs exceeding `maxAttempts` move to `DEAD_LETTER` status

### Idempotency

Jobs with the same `idempotencyKey` are deduplicated:
```typescript
// First call creates job
await queue.addJob('ai_generation', payload, { idempotencyKey: 'key1' });

// Second call returns null (duplicate)
await queue.addJob('ai_generation', payload, { idempotencyKey: 'key1' });
```

## Troubleshooting

### PostgreSQL Connection Issues

**Error**: `Can't reach database server`

**Fix**:
1. Check PostgreSQL service is running:
   ```powershell
   Get-Service postgresql*
   ```

2. If stopped, start it:
   ```powershell
   Start-Service postgresql-x64-14  # Adjust version number
   ```

3. Verify connection string in `.env`:
   - Host: `localhost`
   - Port: `5432`
   - User: `postgres`
   - Password: Match your PostgreSQL password
   - Database: `conversure`

**Error**: `Password authentication failed`

**Fix**:
1. Check `pg_hba.conf` allows password auth:
   ```
   host    all    postgres    127.0.0.1/32    md5
   ```

2. Restart PostgreSQL after changes:
   ```powershell
   Restart-Service postgresql-x64-14
   ```

### Worker Not Processing Jobs

**Issue**: Worker starts but doesn't process jobs

**Diagnosis**:
1. Check jobs exist:
   ```sql
   SELECT id, type, status FROM "JobQueue" WHERE status = 'PENDING';
   ```

2. Check scheduled jobs haven't been delayed:
   ```sql
   SELECT id, scheduledFor FROM "JobQueue" WHERE scheduledFor > NOW();
   ```

3. Check worker logs for errors

### TypeScript Path Alias Issues

**Error**: `Cannot find module '@/lib/queue/...'`

**Fix**: The project uses `tsx` which supports TypeScript path aliases. Ensure:
1. `tsx` is installed: `npm install -D tsx`
2. `tsconfig.json` has paths configured:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./*"]
       }
     }
   }
   ```

### Import Errors in Worker

**Error**: `Prisma Client not generated`

**Fix**:
```bash
npx prisma generate
```

### Job Stuck in PROCESSING

**Cause**: Worker crashed mid-processing

**Fix**: Manually reset job status in database:
```sql
UPDATE "JobQueue" 
SET status = 'PENDING', attempts = attempts + 1 
WHERE id = 'stuck_job_id';
```

### High Database Load

**Symptom**: Slow job processing, high CPU

**Fix**:
1. Increase polling interval in `lib/queue/workers/index.ts`:
   ```typescript
   await sleep(5000); // 5 seconds instead of 1
   ```

2. Add database indexes (already included in schema):
   - `[status, scheduledFor, priority]`
   - `[type, status]`

## Production Deployment

### Systemd Service (Linux)

Create `/etc/systemd/system/conversure-worker.service`:

```ini
[Unit]
Description=Conversure Job Queue Worker
After=postgresql.service

[Service]
Type=simple
User=conversure
WorkingDirectory=/opt/conversure
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run worker
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable conversure-worker
sudo systemctl start conversure-worker
```

### Docker Compose

```yaml
version: '3.8'
services:
  worker:
    build: .
    command: npm run worker
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NODE_ENV=production
    restart: always
    depends_on:
      - postgres
```

### Windows Service

Use `node-windows` or `pm2`:

```bash
npm install -g pm2
pm2 start npm --name "conversure-worker" -- run worker
pm2 save
pm2 startup
```

## Monitoring

### Job Status Dashboard

Query job statistics:

```sql
-- Job counts by status
SELECT status, COUNT(*) 
FROM "JobQueue" 
GROUP BY status;

-- Recent failures
SELECT id, type, lastError, attempts, createdAt 
FROM "JobQueue" 
WHERE status = 'DEAD_LETTER' 
ORDER BY createdAt DESC 
LIMIT 10;

-- Average processing time
SELECT AVG(EXTRACT(EPOCH FROM (completedAt - startedAt))) as avg_seconds
FROM "JobQueue"
WHERE status = 'COMPLETED' AND completedAt IS NOT NULL;
```

### Alerting

Set up alerts for:
- Dead letter queue size > threshold
- Worker process down
- High retry rates
- Processing time anomalies

## Next Steps (Phase 2B)

The current implementation provides a complete queue infrastructure. Phase 2B will add:

1. **AI Provider Integration** - OpenAI/Gemini API calls in `AiOrchestrator`
2. **Prompt Management** - Database-driven prompt versioning
3. **Safety Validation** - Comprehensive policy enforcement
4. **WhatsApp Integration** - Actual message sending
5. **Campaign Processor** - Bulk message dispatch
6. **CRM Sync Processor** - Bitrix24 integration
7. **Lead Import Processor** - CSV batch processing
