/**
 * Extended Queue Types for BullMQ Integration
 * 
 * Extends existing queue system with BullMQ-compatible types
 */

import { JobStatus } from '@prisma/client';

// Re-export existing types
export { JobStatus };

// ============================================
// EXTENDED JOB TYPES
// ============================================

export type ExtendedJobType =
    // Existing types
    | 'ai_generation'
    | 'campaign_send'
    | 'crm_sync'
    | 'lead_import'

    // New BullMQ job types
    | 'whatsapp:webhook'
    | 'whatsapp:send-message'
    | 'whatsapp:send-bulk'
    | 'bitrix:sync'
    | 'stripe:webhook'
    | 'email:send'
    | 'ai:analyze-sentiment'
    | 'export:data';

// ============================================
// BULLMQ-SPECIFIC OPTIONS
// ============================================

export interface BullMQJobOptions {
    /**
     * Unique key to prevent duplicate job execution
     */
    idempotencyKey?: string;

    /**
     * Maximum number of retry attempts
     * @default 5
     */
    maxAttempts?: number;

    /**
     * Job priority (1-10, higher = more important)
     * @default 5
     */
    priority?: number;

    /**
     * Schedule job for future execution
     */
    scheduledFor?: Date;

    /**
     * Custom delay in milliseconds
     */
    delay?: number;

    /**
     * Metadata for tracking
     */
    metadata?: Record<string, any>;
}

// ============================================
// QUEUE STATS
// ============================================

export interface QueueStats {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
}

// ============================================
// JOB INFO
// ============================================

export interface JobInfo {
    id: string;
    type: string;
    status: JobStatus;
    attempts: number;
    maxAttempts: number;
    data: Record<string, any>;
    error?: string;
    createdAt: Date;
    processedAt?: Date;
}

// ============================================
// ENHANCED QUEUE DRIVER
// ============================================

export interface EnhancedQueueDriver {
    /**
     * Add a new job to the queue
     */
    addJob(
        type: ExtendedJobType,
        payload: Record<string, any>,
        opts?: BullMQJobOptions
    ): Promise<string>;

    /**
     * Get job status by ID
     */
    getJobStatus(jobId: string): Promise<JobInfo | null>;

    /**
     * Cancel a pending/delayed job
     */
    cancelJob(jobId: string): Promise<boolean>;

    /**
     * Get queue statistics
     */
    getStats(type?: ExtendedJobType): Promise<QueueStats>;

    /**
     * Gracefully close all connections
     */
    close(): Promise<void>;
}
