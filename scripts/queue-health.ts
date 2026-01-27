/**
 * Queue Health Check Script
 * 
 * Checks Redis connection and queue health
 */

import { getRedisClient, checkRedisHealth } from '../lib/redis';
import { QueueFactory } from '../lib/queue/QueueFactory';

async function checkQueueHealth() {
    console.log('Queue Health Check\n' + '='.repeat(50));

    try {
        // Check Redis connection
        console.log('\n[1/3] Checking Redis connection...');
        const redisHealthy = await checkRedisHealth();

        if (redisHealthy) {
            console.log('✅ Redis: Connected');
        } else {
            console.log('❌ Redis: Connection failed');
            process.exit(1);
        }

        // Check queue driver
        console.log('\n[2/3] Checking queue driver...');
        const isBullMQ = QueueFactory.isBullMQ();
        console.log(`Driver: ${isBullMQ ? 'BullMQ (Redis)' : 'Prisma (Database)'}`);

        // Get queue stats (if BullMQ)
        if (isBullMQ) {
            console.log('\n[3/3] Checking queue stats...');
            const queue = QueueFactory.getQueue();

            // Try to get stats for known job types
            const jobTypes = ['whatsapp:webhook', 'email:send'];

            for (const jobType of jobTypes) {
                try {
                    const stats = await queue.getStats(jobType as any);
                    console.log(`\n  ${jobType}:`);
                    console.log(`    Waiting: ${stats.waiting}`);
                    console.log(`    Active: ${stats.active}`);
                    console.log(`    Completed: ${stats.completed}`);
                    console.log(`    Failed: ${stats.failed}`);
                    console.log(`    Delayed: ${stats.delayed}`);
                } catch (error) {
                    console.log(`  ${jobType}: No queue found (not created yet)`);
                }
            }
        } else {
            console.log('\n[3/3] Queue stats not available for Prisma driver');
        }

        console.log('\n' + '='.repeat(50));
        console.log('✅ Health check passed!\n');
        process.exit(0);

    } catch (error: any) {
        console.error('\n❌ Health check failed:', error.message);
        process.exit(1);
    }
}

// Run health check
checkQueueHealth();
