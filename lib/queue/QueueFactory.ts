/**
 * QueueFactory
 * 
 * Factory pattern for instantiating queue drivers
 * Supports both Prisma (DB-based) and BullMQ (Redis-based) implementations
 */

import type { QueueDriver } from './types';
import type { EnhancedQueueDriver } from './bullmq-types';
import { PrismaQueueDriver } from './drivers/PrismaQueueDriver';
import { BullMQQueueDriver } from './drivers/BullMQQueueDriver';

export class QueueFactory {
    private static instance: QueueDriver | EnhancedQueueDriver | null = null;

    /**
     * Get singleton queue driver instance
     * Driver selection based on QUEUE_DRIVER environment variable
     */
    static getQueue(): QueueDriver | EnhancedQueueDriver {
        if (!this.instance) {
            const driver = process.env.QUEUE_DRIVER || 'prisma';

            switch (driver.toLowerCase()) {
                case 'bullmq':
                case 'redis':
                    console.log('[QueueFactory] Using BullMQ driver');
                    this.instance = new BullMQQueueDriver();
                    break;

                case 'prisma':
                case 'database':
                default:
                    console.log('[QueueFactory] Using Prisma driver');
                    this.instance = new PrismaQueueDriver();
                    break;
            }
        }

        return this.instance;
    }

    /**
     * Reset instance (useful for testing or driver switching)
     */
    static reset(): void {
        this.instance = null;
    }

    /**
     * Check if using BullMQ driver
     */
    static isBullMQ(): boolean {
        const driver = process.env.QUEUE_DRIVER || 'prisma';
        return driver.toLowerCase() === 'bullmq' || driver.toLowerCase() === 'redis';
    }
}
