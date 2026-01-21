/**
 * AI Generation Job Processor - Full Implementation
 * 
 * Processes AI message generation jobs using AiOrchestrator
 */

import type { Job } from '../../types';
import { AiOrchestrator } from '@/lib/ai/AiOrchestrator';

const orchestrator = new AiOrchestrator();

export async function processAiGeneration(job: Job): Promise<void> {
    console.log('[Processor:AI] Processing AI generation job:', job.id);

    try {
        // Extract payload
        const payload = job.payload as any;

        // Validate payload structure
        if (!payload.conversationId) {
            throw new Error('Missing conversationId in AI generation payload');
        }

        console.log('[Processor:AI] Generating reply for conversation:', payload.conversationId);

        // Call AiOrchestrator to generate reply
        const generation = await orchestrator.generateReply({
            conversationId: payload.conversationId,
            messageId: payload.messageId,
            companyId: payload.companyId,
        });

        if (!generation) {
            throw new Error('Failed to generate AI reply - no generation returned');
        }

        console.log('[Processor:AI] ✅ Generation created:', {
            generationId: generation.id,
            status: generation.status,
            safetyPassed: generation.safetyPassed,
            riskScore: generation.riskScore,
        });

    } catch (error) {
        console.error('[Processor:AI] Error:', error);
        throw error; // Re-throw to trigger job retry
    }
}
