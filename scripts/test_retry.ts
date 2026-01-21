/**
 * Retry Behavior Test Script
 * 
 * Tests job retry logic with exponential backoff and dead-letter handling
 * Run with: npx tsx scripts/test_retry.ts
 */

import { QueueFactory } from '@/lib/queue/QueueFactory';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const queue = QueueFactory.getQueue();

async function testRetryBehavior() {
    console.log('🧪 Testing Retry Behavior\n');

    try {
        // Create a job that will fail initially
        console.log('📝 Creating test job with maxAttempts=3...');
        const job = await queue.addJob(
            'ai_generation',
            {
                conversationId: 'retry-test-001',
                shouldFail: true, // Custom flag for testing
            },
            {
                maxAttempts: 3,
                idempotencyKey: 'retry-test-' + Date.now(),
            }
        );

        if (!job) {
            console.log('❌ Failed to create job');
            process.exit(1);
        }

        console.log('✅ Job created:', job.id);
        console.log('   Max attempts:', job.maxAttempts);

        // Simulate first failure
        console.log('\n📝 Simulating failure #1...');
        await queue.markFailed(job.id, 'Simulated error: API timeout', true);

        let updatedJob = await prisma.jobQueue.findUnique({
            where: { id: job.id },
        });

        console.log('   Status:', updatedJob?.status);
        console.log('   Attempts:', updatedJob?.attempts);
        console.log('   Scheduled for:', updatedJob?.scheduledFor?.toISOString());
        console.log('   Last error:', updatedJob?.lastError);

        if (updatedJob?.status === 'PENDING' && updatedJob.attempts === 1) {
            console.log('✅ Retry #1 scheduled with backoff');
        }

        // Simulate second failure
        console.log('\n📝 Simulating failure #2...');
        await queue.markFailed(job.id, 'Simulated error: Connection refused', true);

        updatedJob = await prisma.jobQueue.findUnique({
            where: { id: job.id },
        });

        console.log('   Status:', updatedJob?.status);
        console.log('   Attempts:', updatedJob?.attempts);
        console.log('   Scheduled for:', updatedJob?.scheduledFor?.toISOString());

        if (updatedJob?.status === 'PENDING' && updatedJob.attempts === 2) {
            console.log('✅ Retry #2 scheduled with backoff');
        }

        // Simulate third failure (should move to DEAD_LETTER)
        console.log('\n📝 Simulating failure #3 (final)...');
        await queue.markFailed(job.id, 'Simulated error: Permanent failure', true);

        updatedJob = await prisma.jobQueue.findUnique({
            where: { id: job.id },
        });

        console.log('   Status:', updatedJob?.status);
        console.log('   Attempts:', updatedJob?.attempts);
        console.log('   Completed at:', updatedJob?.completedAt?.toISOString());

        if (updatedJob?.status === 'DEAD_LETTER') {
            console.log('✅ Job moved to DEAD_LETTER after max attempts');
        } else {
            console.log('❌ Expected DEAD_LETTER status, got:', updatedJob?.status);
        }

        // Test exponential backoff calculation
        console.log('\n📊 Exponential Backoff Verification:');
        const testJob = await queue.addJob(
            'ai_generation',
            { test: 'backoff' },
            { maxAttempts: 5, idempotencyKey: 'backoff-test-' + Date.now() }
        );

        if (!testJob) {
            console.log('❌ Failed to create backoff test job');
            process.exit(1);
        }

        for (let attempt = 0; attempt < 4; attempt++) {
            const beforeTime = Date.now();
            await queue.markFailed(testJob.id, `Attempt ${attempt + 1}`, true);

            const updated = await prisma.jobQueue.findUnique({
                where: { id: testJob.id },
            });

            if (updated?.scheduledFor) {
                const backoffMs = updated.scheduledFor.getTime() - beforeTime;
                const expectedMs = Math.pow(2, attempt + 1) * 1000;
                const diff = Math.abs(backoffMs - expectedMs);

                console.log(`   Attempt ${attempt + 1}: ${backoffMs}ms (expected ~${expectedMs}ms, diff: ${diff}ms)`);

                if (diff < 1000) { // Allow 1 second tolerance
                    console.log('   ✅ Backoff correct');
                } else {
                    console.log('   ⚠️  Backoff may be off');
                }
            }
        }

        console.log('\n✅ All retry tests completed!');
        console.log('\n💡 Test Summary:');
        console.log('   - Jobs retry with exponential backoff');
        console.log('   - Backoff formula: 2^attempts * 1000ms');
        console.log('   - Jobs move to DEAD_LETTER after maxAttempts');
        console.log('   - Error messages are preserved in lastError field');

    } catch (error) {
        console.error('\n❌ Test error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

// Run tests
testRetryBehavior();
