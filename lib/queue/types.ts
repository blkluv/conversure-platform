/**
 * JobQueue Type Definitions
 * 
 * Type-safe job queue system for asynchronous processing
 */

import { JobStatus } from '@prisma/client';

// Job types supported by the queue
export type JobType =
    | 'ai_generation'
    | 'campaign_send'
    | 'crm_sync'
    | 'lead_import';

// Job payload interfaces (discriminated union for type safety)
export type JobPayload =
    | AiGenerationPayload
    | CampaignSendPayload
    | CrmSyncPayload
    | LeadImportPayload;

export interface AiGenerationPayload {
    type: 'ai_generation';
    conversationId: string;
    messageId?: string;
    companyId?: string;
}

export interface CampaignSendPayload {
    type: 'campaign_send';
    campaignId: string;
    recipientId: string;
}

export interface CrmSyncPayload {
    type: 'crm_sync';
    companyId: string;
    leadId: string;
    action: 'create' | 'update';
}

export interface LeadImportPayload {
    type: 'lead_import';
    companyId: string;
    batchId: string;
    rowData: Record<string, any>;
}

// Job options for queue operations
export interface JobOptions {
    priority?: number;           // 0-10, higher = more urgent
    scheduledFor?: Date;          // Delay job execution
    maxAttempts?: number;         // Override default retry limit
    idempotencyKey?: string;      // Prevent duplicate processing
}

// Job result type
export interface Job {
    id: string;
    type: JobType;
    payload: any;
    status: JobStatus;
    priority: number;
    attempts: number;
    maxAttempts: number;
    lastError: string | null;
    idempotencyKey: string | null;
    scheduledFor: Date | null;
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

// Queue driver interface
export interface QueueDriver {
    /**
     * Add a new job to the queue
     * Returns null if job with same idempotencyKey already exists
     */
    addJob(
        type: JobType,
        payload: Record<string, any>,
        options?: JobOptions
    ): Promise<Job | null>;

    /**
     * Atomically claim the next pending job
     * Returns null if no jobs available
     */
    getNextJob(): Promise<Job | null>;

    /**
     * Mark job as completed successfully
     */
    markCompleted(jobId: string): Promise<void>;

    /**
     * Mark job as failed, applying retry logic
     * If shouldRetry is false, moves to DEAD_LETTER
     */
    markFailed(
        jobId: string,
        error: string,
        shouldRetry: boolean
    ): Promise<void>;
}

// Job processor function type
export type JobProcessor = (job: Job) => Promise<void>;

// Process registry type
export type ProcessorRegistry = Record<JobType, JobProcessor>;
