/**
 * AI Approve Draft API Endpoint
 * POST /api/ai/approve-draft
 * 
 * Approve AI-generated message and send (or edit first)
 */

import { NextRequest, NextResponse } from 'next/server';
import { AiOrchestrator } from '@/lib/ai/AiOrchestrator';

const orchestrator = new AiOrchestrator();

export async function POST(req: NextRequest) {
    try {
        // 1. Parse request body
        const body = await req.json();
        const { generationId, approvedBy, editedMessage, action } = body;

        // 2. Validate required fields
        if (!generationId) {
            return NextResponse.json(
                { error: 'generationId is required' },
                { status: 400 }
            );
        }

        if (!approvedBy) {
            return NextResponse.json(
                { error: 'approvedBy (userId) is required' },
                { status: 400 }
            );
        }

        // 3. Handle rejection
        if (action === 'reject') {
            // TODO: Implement rejection logic
            return NextResponse.json(
                { success: true, message: 'Draft rejected (not implemented yet)' },
                { status: 200 }
            );
        }

        // 4. Approve and send
        await orchestrator.approveAndSend({
            generationId,
            approvedBy,
            editedMessage,
        });

        return NextResponse.json({
            success: true,
            message: editedMessage
                ? 'Draft edited and sent successfully'
                : 'Draft approved and sent successfully',
        });

    } catch (error) {
        console.error('[API] /api/ai/approve-draft error:', error);
        return NextResponse.json(
            {
                error: 'Failed to approve draft',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
