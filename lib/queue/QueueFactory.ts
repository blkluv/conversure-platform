/**
 * QueueFactory
 * 
 * Factory pattern for instantiating queue drivers
 * Allows easy swapping between implementations (Prisma, Redis, BullMQ, etc.)
 */

import type { QueueDriver } from './types';
import { PrismaQueueDriver } from './drivers/PrismaQueueDriver';

export class QueueFactory {
    private static instance: QueueDriver | null = null;

    /**
     * Get singleton queue driver instance
     */
    static getQueue(): QueueDriver {
        if (!this.instance) {
            // Currently using Prisma driver
            // Can easily swap to Redis/BullMQ in future
            this.instance = new PrismaQueueDriver();
        }

        return this.instance;
    }

    /**
     * Reset instance (useful for testing)
     */
    static reset(): void {
        this.instance = null;
    }
}
