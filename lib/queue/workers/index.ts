/**
 * Worker Orchestration
 * 
 * Main worker process that polls for jobs and dispatches to processors
 * Features:
 * - Configurable polling interval
 * - Graceful shutdown on SIGTERM/SIGINT
 * - Error handling and retry logic
 * - Process registry for job type routing
 */

import type { ProcessorRegistry } from '../types';
import { QueueFactory } from '../QueueFactory';
import { processAiGeneration } from './processors/aiGeneration';

// Register job processors
const processors: ProcessorRegistry = {
    ai_generation: processAiGeneration,
    campaign_send: async (job) => {
        console.log('[Processor:Campaign] Processing campaign send:', job.id);
        // TODO: Implement in future phase
    },
    crm_sync: async (job) => {
        console.log('[Processor:CRM] Processing CRM sync:', job.id);
        // TODO: Implement in future phase
    },
    lead_import: async (job) => {
        console.log('[Processor:LeadImport] Processing lead import:', job.id);
        // TODO: Implement in future phase
    },
};

let isShuttingDown = false;

/**
 * Start worker polling loop
 */
export async function startWorkers(): Promise<void> {
    console.log('🚀 [Worker] Starting job queue workers...');
    console.log('[Worker] Polling interval: 1000ms');

    const queue = QueueFactory.getQueue();

    // Setup graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown());
    process.on('SIGINT', () => gracefulShutdown());

    // Main polling loop
    while (!isShuttingDown) {
        try {
            // Get next job
            const job = await queue.getNextJob();

            if (!job) {
                // No jobs available, wait before next poll
                await sleep(1000);
                continue;
            }

            // Get processor for job type
            const processor = processors[job.type as keyof ProcessorRegistry];

            if (!processor) {
                console.error(`[Worker] No processor found for job type: ${job.type}`);
                await queue.markFailed(
                    job.id,
                    `No processor registered for job type: ${job.type}`,
                    false // Don't retry
                );
                continue;
            }

            // Process job
            try {
                await processor(job);
                await queue.markCompleted(job.id);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`[Worker] Job ${job.id} failed:`, errorMessage);

                // Retry logic - will retry unless max attempts reached
                await queue.markFailed(job.id, errorMessage, true);
            }
        } catch (error) {
            console.error('[Worker] Polling error:', error);
            await sleep(5000); // Back off on polling errors
        }
    }

    console.log('[Worker] Shutdown complete');
}

/**
 * Graceful shutdown handler
 */
function gracefulShutdown(): void {
    console.log('\n[Worker] Received shutdown signal, stopping gracefully...');
    isShuttingDown = true;
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
