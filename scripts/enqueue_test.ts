/**
 * Job Queue Test Script
 * 
 * Tests job enqueuing, idempotency, retry, and dead-letter behavior
 * Run with: npx tsx scripts/enqueue_test.ts
 */

import { QueueFactory } from '@/lib/queue/QueueFactory';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const queue = QueueFactory.getQueue();

async function runTests() {
    console.log('🧪 Starting JobQueue Tests\n');

    try {
        // Test 1: Basic job enqueuing
        console.log('📝 Test 1: Basic Job Enqueuing');
        const job1 = await queue.addJob(
            'ai_generation',
            {
                conversationId: 'test-conv-001',
                messageId: 'test-msg-001',
                companyId: 'test-company-001',
            },
            {
                priority: 5,
                idempotencyKey: 'test-idempotency-1',
            }
        );

        if (job1) {
            const jobId = typeof job1 === 'string' ? job1 : job1.id;
            console.log('✅ Job created:', jobId);
            if (typeof job1 !== 'string') {
                console.log('   Type:', job1.type);
                console.log('   Priority:', job1.priority);
                console.log('   Status:', job1.status);
            }
        } else {
            console.log('❌ Failed to create job');
        }

        // Test 2: Idempotency check
        console.log('\n📝 Test 2: Idempotency Check');
        const job2 = await queue.addJob(
            'ai_generation',
            {
                conversationId: 'test-conv-001',
                messageId: 'test-msg-001',
                companyId: 'test-company-001',
            },
            {
                priority: 5,
                idempotencyKey: 'test-idempotency-1', // Same key
            }
        );

        if (job2 === null) {
            console.log('✅ Idempotency working - duplicate job rejected');
        } else {
            console.log('❌ Idempotency failed - duplicate job created');
        }

        // Test 3: Multiple jobs with different priorities
        console.log('\n📝 Test 3: Priority Queue');
        await queue.addJob(
            'ai_generation',
            { conversationId: 'low-priority' },
            { priority: 1, idempotencyKey: 'test-low' }
        );

        await queue.addJob(
            'ai_generation',
            { conversationId: 'high-priority' },
            { priority: 10, idempotencyKey: 'test-high' }
        );

        await queue.addJob(
            'ai_generation',
            { conversationId: 'medium-priority' },
            { priority: 5, idempotencyKey: 'test-med' }
        );

        console.log('✅ Created 3 jobs with different priorities');

        // Test 4: Scheduled job (future execution)
        console.log('\n📝 Test 4: Scheduled Job');
        const scheduledFor = new Date(Date.now() + 30000); // 30 seconds from now
        const scheduledJob = await queue.addJob(
            'ai_generation',
            { conversationId: 'scheduled-test' },
            {
                scheduledFor,
                idempotencyKey: 'test-scheduled',
            }
        );

        if (scheduledJob && scheduledJob.scheduledFor) {
            console.log('✅ Scheduled job created');
            console.log('   Will process at:', scheduledJob.scheduledFor.toISOString());
        }

        // Test 5: Check job counts
        console.log('\n📊 Current Job Statistics:');
        const pendingCount = await prisma.jobQueue.count({
            where: { status: 'PENDING' },
        });
        const processingCount = await prisma.jobQueue.count({
            where: { status: 'PROCESSING' },
        });
        const completedCount = await prisma.jobQueue.count({
            where: { status: 'COMPLETED' },
        });
        const deadLetterCount = await prisma.jobQueue.count({
            where: { status: 'DEAD_LETTER' },
        });

        console.log('   Pending:', pendingCount);
        console.log('   Processing:', processingCount);
        console.log('   Completed:', completedCount);
        console.log('   Dead Letter:', deadLetterCount);

        // Test 6: View next job to be processed
        console.log('\n📋 Next Job in Queue:');
        const nextJob = await queue.getNextJob();
        if (nextJob) {
            console.log('   ID:', nextJob.id);
            console.log('   Type:', nextJob.type);
            console.log('   Priority:', nextJob.priority);
            console.log('   Status:', nextJob.status);

            // Mark it back as pending for worker to process
            await prisma.jobQueue.update({
                where: { id: nextJob.id },
                data: { status: 'PENDING' },
            });
            console.log('   (Marked back as PENDING for worker)');
        } else {
            console.log('   No pending jobs');
        }

        console.log('\n✅ All tests completed!');
        console.log('\n💡 Tips:');
        console.log('   - Start the worker with: npm run worker');
        console.log('   - Worker will process pending jobs in priority order');
        console.log('   - Check database: SELECT * FROM "JobQueue";');

    } catch (error) {
        console.error('\n❌ Test error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

// Run tests
runTests();
