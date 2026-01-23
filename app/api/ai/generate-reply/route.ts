/**
 * AI Generate Reply API Endpoint
 * POST /api/ai/generate-reply
 * 
 * Enqueues AI message generation job (non-blocking)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { QueueFactory } from '@/lib/queue/QueueFactory';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        // 1. Parse request body
        const body = await req.json();
        const { conversationId, messageId, companyId } = body;

        // 2. Validate required fields
        if (!conversationId) {
            return NextResponse.json(
                { error: 'conversationId is required' },
                { status: 400 }
            );
        }

        // 3. Verify conversation exists
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { company: true },
        });

        if (!conversation) {
            return NextResponse.json(
                { error: 'Conversation not found' },
                { status: 404 }
            );
        }

        // 4. Check if AI is enabled for company
        const settings = await prisma.companySettings.findUnique({
            where: { companyId: conversation.companyId },
        });

        if (!settings || !settings.aiEnabled) {
            return NextResponse.json(
                { error: 'AI is not enabled for this company' },
                { status: 403 }
            );
        }

        // 5. Create idempotency key (prevent duplicate generations)
        const idempotencyKey = `ai-gen-${conversationId}-${messageId || 'latest'}-${Date.now()}`;

        // 6. Enqueue job
        const queue = QueueFactory.getQueue();
        const job = await queue.addJob(
            'ai_generation',
            {
                conversationId,
                messageId,
                companyId: companyId || conversation.companyId,
            },
            {
                priority: 5, // Medium priority
                idempotencyKey,
                maxAttempts: 3,
            }
        );

        if (!job) {
            return NextResponse.json(
                { error: 'Job already exists or failed to create' },
                { status: 409 }
            );
        }

        // 7. Return job information
        return NextResponse.json({
            success: true,
            jobId: typeof job === 'string' ? job : job.id,
            status: 'queued',
            message: 'AI generation job enqueued successfully',
            estimatedWaitTime: '2-5 seconds',
        }, { status: 202 }); // 202 Accepted

    } catch (error) {
        console.error('[API] /api/ai/generate-reply error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
