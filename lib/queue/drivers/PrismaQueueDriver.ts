/**
 * PrismaQueueDriver
 * 
 * Production-safe database queue implementation using Prisma ORM
 * Features:
 * - Atomic job claiming via transactions
 * - Exponential backoff retry strategy
 * - Idempotency key support
 * - Dead letter queue for failed jobs
 * - Priority-based job ordering
 */

import { PrismaClient, JobStatus } from '@prisma/client';
import type { QueueDriver, Job, JobType, JobOptions } from '../types';

const prisma = new PrismaClient();

export class PrismaQueueDriver implements QueueDriver {
    /**
     * Add a new job to the queue
     */
    async addJob(
        type: JobType,
        payload: Record<string, any>,
        options: JobOptions = {}
    ): Promise<Job | null> {
        const {
            priority = 0,
            scheduledFor = null,
            maxAttempts = 3,
            idempotencyKey = null,
        } = options;

        // Check for existing job with same idempotency key
        if (idempotencyKey) {
            const existing = await prisma.jobQueue.findUnique({
                where: { idempotencyKey },
            });

            if (existing) {
                console.log(`[Queue] Job with idempotencyKey "${idempotencyKey}" already exists`);
                return null;
            }
        }

        // Create new job
        const job = await prisma.jobQueue.create({
            data: {
                type,
                payload,
                priority,
                scheduledFor,
                maxAttempts,
                idempotencyKey,
                status: JobStatus.PENDING,
            },
        });

        console.log(`[Queue] Added job: ${job.id} (${type}) priority=${priority}`);
        return job as Job;
    }

    /**
     * Atomically claim the next pending job
     * Uses transaction to prevent race conditions
     */
    async getNextJob(): Promise<Job | null> {
        try {
            // Find next eligible job
            const now = new Date();
            const candidates = await prisma.jobQueue.findMany({
                where: {
                    status: JobStatus.PENDING,
                    OR: [
                        { scheduledFor: null },
                        { scheduledFor: { lte: now } },
                    ],
                },
                orderBy: [
                    { priority: 'desc' },
                    { scheduledFor: 'asc' },
                    { createdAt: 'asc' },
                ],
                take: 1,
            });

            if (candidates.length === 0) {
                return null;
            }

            const candidate = candidates[0];

            // Atomically claim the job using transaction
            const job = await prisma.$transaction(async (tx) => {
                // Re-check job is still PENDING (prevent race condition)
                const current = await tx.jobQueue.findUnique({
                    where: { id: candidate.id },
                });

                if (!current || current.status !== JobStatus.PENDING) {
                    return null;
                }

                // Mark as PROCESSING
                return await tx.jobQueue.update({
                    where: { id: candidate.id },
                    data: {
                        status: JobStatus.PROCESSING,
                        startedAt: now,
                    },
                });
            });

            if (job) {
                console.log(`[Queue] Claimed job: ${job.id} (${job.type})`);
                return job as Job;
            }

            return null;
        } catch (error) {
            console.error('[Queue] Error claiming job:', error);
            return null;
        }
    }

    /**
     * Mark job as completed successfully
     */
    async markCompleted(jobId: string): Promise<void> {
        await prisma.jobQueue.update({
            where: { id: jobId },
            data: {
                status: JobStatus.COMPLETED,
                completedAt: new Date(),
            },
        });

        console.log(`[Queue] Job completed: ${jobId}`);
    }

    /**
     * Mark job as failed with retry logic
     * Applies exponential backoff: 2^attempts * 1000ms
     */
    async markFailed(
        jobId: string,
        error: string,
        shouldRetry: boolean = true
    ): Promise<void> {
        const job = await prisma.jobQueue.findUnique({
            where: { id: jobId },
        });

        if (!job) {
            console.error(`[Queue] Job not found: ${jobId}`);
            return;
        }

        const newAttempts = job.attempts + 1;
        const maxAttempts = job.maxAttempts;

        // Determine if we should retry
        const canRetry = shouldRetry && newAttempts < maxAttempts;

        if (canRetry) {
            // Calculate exponential backoff: 2^attempts * 1000ms
            const backoffMs = Math.pow(2, newAttempts) * 1000;
            const scheduledFor = new Date(Date.now() + backoffMs);

            await prisma.jobQueue.update({
                where: { id: jobId },
                data: {
                    status: JobStatus.PENDING,
                    attempts: newAttempts,
                    lastError: error,
                    scheduledFor,
                },
            });

            console.log(
                `[Queue] Job ${jobId} failed (attempt ${newAttempts}/${maxAttempts}). ` +
                `Retry in ${backoffMs}ms`
            );
        } else {
            // Move to dead letter queue
            await prisma.jobQueue.update({
                where: { id: jobId },
                data: {
                    status: JobStatus.DEAD_LETTER,
                    attempts: newAttempts,
                    lastError: error,
                    completedAt: new Date(),
                },
            });

            console.error(
                `[Queue] Job ${jobId} moved to DEAD_LETTER after ${newAttempts} attempts. ` +
                `Error: ${error}`
            );
        }
    }

    /**
     * Cleanup: disconnect Prisma client
     */
    async disconnect(): Promise<void> {
        await prisma.$disconnect();
    }
}
