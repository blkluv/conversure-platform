/**
 * BullMQ Queue Driver
 * 
 * Redis-based queue implementation using BullMQ for scalable job processing
 */

import { Queue, QueueOptions, Job } from 'bullmq';
import {
    ExtendedJobType,
    BullMQJobOptions,
    EnhancedQueueDriver,
    JobInfo,
    QueueStats
} from '../bullmq-types';
import { JobStatus } from '@prisma/client';

export class BullMQQueueDriver implements EnhancedQueueDriver {
    private queues: Map<string, Queue>;
    private defaultOptions: QueueOptions;

    constructor() {
        this.queues = new Map();

        const redisUrl = process.env.REDIS_URL;
        if (!redisUrl) {
            throw new Error('REDIS_URL environment variable is required for BullMQ');
        }

        this.defaultOptions = {
            connection: redisUrl as any, // BullMQ will parse the URL string
            defaultJobOptions: {
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: 1000
                },
                removeOnComplete: {
                    age: 86400, // Keep for 24 hours
                    count: 1000
                },
                removeOnFail: {
                    age: 604800 // Keep for 7 days
                }
            }
        };
    }

    /**
     * Get or create queue for a job type
     */
    private getQueue(type: ExtendedJobType): Queue {
        if (!this.queues.has(type)) {
            const queue = new Queue(type, this.defaultOptions);

            // Add event listeners
            queue.on('error', (error) => {
                console.error(`[BullMQ] Queue ${type} error:`, error);
            });

            this.queues.set(type, queue);
        }

        return this.queues.get(type)!;
    }

    /**
     * Add a new job to the queue
     */
    async addJob(
        type: ExtendedJobType,
        payload: Record<string, any>,
        opts?: BullMQJobOptions
    ): Promise<string> {
        const queue = this.getQueue(type);

        try {
            const job = await queue.add(
                type,
                payload,
                {
                    jobId: opts?.idempotencyKey,
                    attempts: opts?.maxAttempts ?? 5,
                    priority: opts?.priority,
                    delay: opts?.delay ?? (opts?.scheduledFor ? opts.scheduledFor.getTime() - Date.now() : undefined),
                    // Store metadata in job data
                    ...(opts?.metadata && { metadata: opts.metadata })
                }
            );

            console.log(`[BullMQ] Job added: ${job.id} (type: ${type})`);
            return job.id!;
        } catch (error: any) {
            console.error(`[BullMQ] Failed to add job:`, error);
            throw error;
        }
    }

    /**
     * Get job status by ID
     */
    async getJobStatus(jobId: string): Promise<JobInfo | null> {
        // Try to find job in all queues
        for (const [type, queue] of this.queues) {
            try {
                const job = await queue.getJob(jobId);
                if (job) {
                    const state = await job.getState();

                    return {
                        id: job.id!,
                        type: job.name,
                        status: this.mapBullMQStateToStatus(state),
                        attempts: job.attemptsMade,
                        maxAttempts: job.opts.attempts ?? 5,
                        data: job.data,
                        error: job.failedReason,
                        createdAt: new Date(job.timestamp),
                        processedAt: job.finishedOn ? new Date(job.finishedOn) : undefined
                    };
                }
            } catch (error) {
                console.error(`[BullMQ] Error getting job ${jobId} from queue ${type}:`, error);
            }
        }

        return null;
    }

    /**
     * Cancel a pending or delayed job
     */
    async cancelJob(jobId: string): Promise<boolean> {
        for (const [type, queue] of this.queues) {
            try {
                const job = await queue.getJob(jobId);
                if (job) {
                    await job.remove();
                    console.log(`[BullMQ] Job cancelled: ${jobId}`);
                    return true;
                }
            } catch (error) {
                console.error(`[BullMQ] Error cancelling job ${jobId}:`, error);
            }
        }

        return false;
    }

    /**
     * Get queue statistics
     */
    async getStats(type?: ExtendedJobType): Promise<QueueStats> {
        const stats: QueueStats = {
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            delayed: 0
        };

        const queuesToCheck = type
            ? [this.getQueue(type)]
            : Array.from(this.queues.values());

        for (const queue of queuesToCheck) {
            try {
                const counts = await queue.getJobCounts();
                stats.waiting += counts.waiting || 0;
                stats.active += counts.active || 0;
                stats.completed += counts.completed || 0;
                stats.failed += counts.failed || 0;
                stats.delayed += counts.delayed || 0;
            } catch (error) {
                console.error('[BullMQ] Error getting stats:', error);
            }
        }

        return stats;
    }

    /**
     * Gracefully close all queue connections
     */
    async close(): Promise<void> {
        console.log('[BullMQ] Closing all queues...');

        await Promise.all(
            Array.from(this.queues.values()).map(queue =>
                queue.close()
            )
        );

        this.queues.clear();
        console.log('[BullMQ] All queues closed');
    }

    /**
     * Map BullMQ job state to our JobStatus enum
     */
    private mapBullMQStateToStatus(state: string): JobStatus {
        switch (state) {
            case 'waiting':
            case 'waiting-children':
                return JobStatus.PENDING;
            case 'active':
                return JobStatus.PROCESSING; // Use PROCESSING instead of ACTIVE
            case 'completed':
                return JobStatus.COMPLETED;
            case 'failed':
                return JobStatus.FAILED;
            case 'delayed':
            case 'paused':
                return JobStatus.PENDING; // Use PENDING instead of DELAYED
            default:
                return JobStatus.PENDING;
        }
    }
}
