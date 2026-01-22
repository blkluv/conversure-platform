/**
 * Redis Client Singleton
 * 
 * Provides a single Redis connection for the entire application
 * Used by BullMQ queues, caching, and session storage
 */

import Redis from 'ioredis';

let redisClient: Redis | null = null;

/**
 * Get or create Redis client instance
 */
export function getRedisClient(): Redis {
    if (!redisClient) {
        const redisUrl = process.env.REDIS_URL;

        if (!redisUrl) {
            throw new Error('REDIS_URL environment variable is required');
        }

        redisClient = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            reconnectOnError(err) {
                const targetError = 'READONLY';
                if (err.message.includes(targetError)) {
                    // Only reconnect when the error contains "READONLY"
                    return true;
                }
                return false;
            }
        });

        // Connection event handlers
        redisClient.on('connect', () => {
            console.log('[Redis] Connected successfully');
        });

        redisClient.on('error', (err) => {
            console.error('[Redis] Connection error:', err);
        });

        redisClient.on('ready', () => {
            console.log('[Redis] Client ready');
        });
    }

    return redisClient;
}

/**
 * Check Redis connection health
 */
export async function checkRedisHealth(): Promise<boolean> {
    try {
        const client = getRedisClient();
        const result = await client.ping();
        return result === 'PONG';
    } catch (error) {
        console.error('[Redis] Health check failed:', error);
        return false;
    }
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        console.log('[Redis] Connection closed');
    }
}
