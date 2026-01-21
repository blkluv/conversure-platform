/**
 * AI Pending Approvals API Endpoint
 * GET /api/ai/pending-approvals
 * 
 * Fetch AI-generated messages pending approval
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, GenerationStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        // 1. Get query parameters
        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get('companyId');
        const status = searchParams.get('status') || 'PENDING_APPROVAL';
        const limit = parseInt(searchParams.get('limit') || '50');

        // 2. Validate company ID
        if (!companyId) {
            return NextResponse.json(
                { error: 'companyId is required' },
                { status: 400 }
            );
        }

        // 3. Fetch pending approvals
        const approvals = await prisma.aiMessageGeneration.findMany({
            where: {
                conversation: {
                    companyId,
                },
                status: status as GenerationStatus,
            },
            include: {
                conversation: {
                    include: {
                        lead: true,
                        messages: {
                            orderBy: { sentAt: 'desc' },
                            take: 5,
                        },
                    },
                },
                prompt: {
                    select: {
                        name: true,
                        version: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        });

        // 4. Format response with context
        const formatted = approvals.map((approval) => ({
            id: approval.id,
            conversationId: approval.conversationId,
            lead: {
                id: approval.conversation.lead?.id,
                name: approval.conversation.lead?.name,
                phone: approval.conversation.whatsappNumber,
            },
            draftMessage: approval.draftMessage,
            editedMessage: approval.editedMessage,
            status: approval.status,
            detectedIntent: approval.detectedIntent,
            intentConfidence: approval.intentConfidence,
            sentiment: approval.sentiment,
            safetyPassed: approval.safetyPassed,
            riskScore: approval.riskScore,
            violations: approval.violations,
            recentMessages: approval.conversation.messages.map((m) => ({
                direction: m.direction,
                body: m.body,
                sentAt: m.sentAt,
            })),
            prompt: {
                name: approval.prompt.name,
                version: approval.prompt.version,
            },
            createdAt: approval.createdAt,
            estimatedCostUsd: approval.estimatedCostUsd,
        }));

        return NextResponse.json({
            success: true,
            count: formatted.length,
            approvals: formatted,
        });

    } catch (error) {
        console.error('[API] /api/ai/pending-approvals error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
