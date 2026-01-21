/**
 * AI Orchestrator - Full Implementation
 * 
 * Central coordinator for AI-powered message generation with safety checks
 */

import { PrismaClient, AiMessageGeneration, AiProvider, GenerationStatus } from '@prisma/client';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PromptManager } from './PromptManager';
import { SafetyChecker } from './SafetyChecker';

const prisma = new PrismaClient();
const promptManager = new PromptManager();
const safetyChecker = new SafetyChecker();

// Initialize AI providers (graceful if keys missing)
const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

const gemini = process.env.GOOGLE_AI_API_KEY
    ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
    : null;

export interface GenerateReplyOptions {
    conversationId: string;
    messageId?: string;
    companyId?: string;
}

export interface ApproveAndSendOptions {
    generationId: string;
    approvedBy: string;
    editedMessage?: string;
}

export class AiOrchestrator {
    /**
     * Generate AI reply for a conversation
     */
    async generateReply(options: GenerateReplyOptions): Promise<AiMessageGeneration | null> {
        const { conversationId, messageId, companyId: overrideCompanyId } = options;

        try {
            // 1. Fetch conversation context
            const conversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: {
                    lead: true,
                    company: true,
                    messages: {
                        orderBy: { sentAt: 'desc' },
                        take: 10, // Last 10 messages for context
                    },
                },
            });

            if (!conversation) {
                throw new Error(`Conversation not found: ${conversationId}`);
            }

            const companyId = overrideCompanyId || conversation.companyId;

            // 2. Get company AI settings
            const settings = await prisma.companySettings.findUnique({
                where: { companyId },
            });

            if (!settings || !settings.aiEnabled) {
                throw new Error('AI is not enabled for this company');
            }

            const company = await prisma.company.findUnique({
                where: { id: companyId },
            });

            if (!company) {
                throw new Error(`Company not found: ${companyId}`);
            }

            // 3. Get active prompt
            const prompt = await promptManager.getActivePrompt({
                companyId,
                name: 'conversation_reply',
            });

            if (!prompt) {
                throw new Error('No active prompt found for conversation_reply');
            }

            // 4. Build context for AI
            const context = this.buildContext(conversation, settings);

            // 5. Call AI provider
            const provider = company.aiProvider;
            let aiResponse;
            let inputTokens = 0;
            let outputTokens = 0;
            let model = '';

            if (provider === AiProvider.OPENAI) {
                if (!openai) {
                    throw new Error('OpenAI API key not configured');
                }

                const completion = await openai.chat.completions.create({
                    model: prompt.model || 'gpt-4-turbo',
                    messages: [
                        { role: 'system', content: prompt.systemPrompt },
                        { role: 'user', content: this.populatePromptTemplate(prompt.userPromptTemplate, context) },
                    ],
                    temperature: prompt.temperature,
                    max_tokens: prompt.maxTokens,
                });

                aiResponse = completion.choices[0].message.content || '';
                inputTokens = completion.usage?.prompt_tokens || 0;
                outputTokens = completion.usage?.completion_tokens || 0;
                model = completion.model;

            } else if (provider === AiProvider.GEMINI) {
                if (!gemini) {
                    throw new Error('Google AI API key not configured');
                }

                const geminiModel = gemini.getGenerativeModel({
                    model: prompt.model || 'gemini-pro',
                });

                const result = await geminiModel.generateContent([
                    prompt.systemPrompt,
                    this.populatePromptTemplate(prompt.userPromptTemplate, context),
                ].join('\n\n'));

                aiResponse = result.response.text();

                // Gemini doesn't provide token counts in same way, estimate
                inputTokens = Math.ceil((prompt.systemPrompt.length + context.lastMessage.length) / 4);
                outputTokens = Math.ceil(aiResponse.length / 4);
                model = 'gemini-pro';

            } else {
                throw new Error(`Unsupported AI provider: ${provider}`);
            }

            // 6. Detect intent (simple keyword-based for now)
            const intent = this.detectIntent(context.lastMessage);
            const intentConfidence = 0.8; // Placeholder

            // 7. Run safety checker
            const safetyResult = await safetyChecker.validate(
                aiResponse,
                intent.type,
                {
                    allowedIntents: settings.aiAllowedIntents,
                    autoSendIntents: settings.aiAutoSendIntents,
                    minConfidence: settings.aiMinConfidence,
                    maxMessageLength: settings.aiMaxMessageLength,
                    maxRiskScore: settings.aiMaxRiskScore,
                    tone: settings.aiTone,
                    languages: settings.aiLanguages,
                    respectOptOut: settings.aiRespectOptOut,
                    optOutKeywords: settings.aiOptOutKeywords,
                    escalateKeywords: settings.aiEscalateKeywords,
                    escalateNegativeSentiment: settings.aiEscalateNegativeSentiment,
                }
            );

            // 8. Calculate cost (rough estimate)
            const estimatedCostUsd = this.calculateCost(provider, model, inputTokens, outputTokens);

            // 9. Determine status based on safety and settings
            let status: GenerationStatus = GenerationStatus.PENDING_APPROVAL;

            if (safetyResult.shouldBlock) {
                status = GenerationStatus.BLOCKED;
            } else if (
                settings.aiMode === 'AI_PILOT' &&
                settings.aiAutoSendIntents.includes(intent.type)
            ) {
                status = GenerationStatus.AUTO_SENT;
            }

            // 10. Store AiMessageGeneration record
            const generation = await prisma.aiMessageGeneration.create({
                data: {
                    conversationId,
                    messageId: messageId || null,
                    promptId: prompt.id,
                    promptVersion: prompt.version,
                    provider: provider.toLowerCase(),
                    model,
                    inputTokens,
                    outputTokens,
                    totalTokens: inputTokens + outputTokens,
                    estimatedCostUsd,
                    detectedIntent: intent.type,
                    intentConfidence,
                    entities: intent.entities,
                    sentiment: intent.sentiment,
                    urgency: intent.urgency,
                    draftMessage: aiResponse,
                    safetyPassed: safetyResult.passed,
                    riskScore: safetyResult.riskScore,
                    violations: safetyResult.violations as any,
                    status,
                },
            });

            // 11. Log safety violations if any
            if (safetyResult.violations.length > 0) {
                for (const violation of safetyResult.violations) {
                    await prisma.aiSafetyViolation.create({
                        data: {
                            companyId,
                            generationId: generation.id,
                            violationType: violation.type,
                            severity: violation.severity,
                            detectedText: violation.detectedText,
                            context: violation.context,
                            ruleMatched: violation.ruleMatched,
                            explanation: violation.explanation,
                            wasBlocked: safetyResult.shouldBlock,
                        },
                    });
                }
            }

            console.log('[AiOrchestrator] Generated reply:', {
                generationId: generation.id,
                status: generation.status,
                safetyPassed: generation.safetyPassed,
                riskScore: generation.riskScore,
            });

            return generation;

        } catch (error) {
            console.error('[AiOrchestrator] generateReply error:', error);
            throw error;
        }
    }

    /**
     * Approve AI-generated message and send to customer
     */
    async approveAndSend(options: ApproveAndSendOptions): Promise<void> {
        const { generationId, approvedBy, editedMessage } = options;

        try {
            // 1. Fetch generation record
            const generation = await prisma.aiMessageGeneration.findUnique({
                where: { id: generationId },
                include: {
                    conversation: {
                        include: {
                            lead: true,
                            company: true,
                        },
                    },
                },
            });

            if (!generation) {
                throw new Error(`Generation not found: ${generationId}`);
            }

            if (generation.status !== GenerationStatus.PENDING_APPROVAL) {
                throw new Error(`Cannot approve generation with status: ${generation.status}`);
            }

            // 2. Check opt-out before sending
            const isOptedOut = await safetyChecker.isOptedOut(
                generation.conversation.companyId,
                generation.conversation.whatsappNumber
            );

            if (isOptedOut) {
                throw new Error('Cannot send to opted-out number');
            }

            // 3. Determine final message (edited or original)
            const finalMessage = editedMessage || generation.draftMessage;
            const status = editedMessage ? GenerationStatus.EDITED : GenerationStatus.APPROVED;

            // 4. Update generation record
            await prisma.aiMessageGeneration.update({
                where: { id: generationId },
                data: {
                    status,
                    wasApproved: true,
                    approvedBy,
                    approvedAt: new Date(),
                    editedMessage: editedMessage || null,
                    sentAt: new Date(),
                },
            });

            // 5. Create message record (actual sending would be done via WhatsApp provider)
            const message = await prisma.message.create({
                data: {
                    conversationId: generation.conversationId,
                    senderId: approvedBy,
                    direction: 'OUTBOUND',
                    contentType: 'TEXT',
                    body: finalMessage,
                    sentAt: new Date(),
                },
            });

            // 6. Link message to generation
            await prisma.aiMessageGeneration.update({
                where: { id: generationId },
                data: { messageId: message.id },
            });

            // 7. Update conversation timestamp
            await prisma.conversation.update({
                where: { id: generation.conversationId },
                data: {
                    lastMessageAt: new Date(),
                    lastDirection: 'OUTBOUND',
                },
            });

            // TODO: Actually send via WhatsApp provider (Phase 3)
            console.log('[AiOrchestrator] Message approved and queued for sending:', {
                messageId: message.id,
                generationId,
                wasEdited: !!editedMessage,
            });

        } catch (error) {
            console.error('[AiOrchestrator] approveAndSend error:', error);
            throw error;
        }
    }

    /**
     * Build context object from conversation data
     */
    private buildContext(conversation: any, settings: any): any {
        const messages = conversation.messages || [];
        const lastMessage = messages[0]?.body || '';
        const lead = conversation.lead || {};

        return {
            lastMessage,
            leadName: lead.name || 'Customer',
            leadPhone: conversation.whatsappNumber,
            propertyType: lead.propertyType || 'property',
            location: lead.location || 'Dubai',
            budget: lead.budget || 'not specified',
            bedrooms: lead.bedrooms || 'not specified',
            conversationHistory: messages.slice(0, 5).map((m: any) => ({
                direction: m.direction,
                body: m.body,
                sentAt: m.sentAt,
            })),
            tone: settings.aiTone || 'professional',
            language: settings.aiLanguages[0] || 'en',
        };
    }

    /**
     * Populate prompt template with context variables
     */
    private populatePromptTemplate(template: string, context: any): string {
        let populated = template;

        for (const [key, value] of Object.entries(context)) {
            if (typeof value === 'string' || typeof value === 'number') {
                populated = populated.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
            }
        }

        return populated;
    }

    /**
     * Simple intent detection (keyword-based)
     */
    private detectIntent(message: string): any {
        const lower = message.toLowerCase();

        if (lower.includes('viewing') || lower.includes('visit') || lower.includes('tour')) {
            return {
                type: 'VIEWING_REQUEST',
                sentiment: 'positive',
                urgency: 'high',
                entities: {},
            };
        }

        if (lower.includes('price') || lower.includes('cost') || lower.includes('aed')) {
            return {
                type: 'PRICE_INQUIRY',
                sentiment: 'neutral',
                urgency: 'medium',
                entities: {},
            };
        }

        if (lower.includes('interested') || lower.includes('looking for')) {
            return {
                type: 'INQUIRY',
                sentiment: 'positive',
                urgency: 'medium',
                entities: {},
            };
        }

        if (lower.includes('available') || lower.includes('availability')) {
            return {
                type: 'AVAILABILITY_CHECK',
                sentiment: 'neutral',
                urgency: 'medium',
                entities: {},
            };
        }

        return {
            type: 'FOLLOW_UP',
            sentiment: 'neutral',
            urgency: 'low',
            entities: {},
        };
    }

    /**
     * Calculate API cost estimate
     */
    private calculateCost(provider: AiProvider, model: string, inputTokens: number, outputTokens: number): number {
        // Rough pricing (as of 2024, update as needed)
        if (provider === AiProvider.OPENAI) {
            if (model.includes('gpt-4')) {
                return (inputTokens * 0.03 + outputTokens * 0.06) / 1000;
            } else {
                return (inputTokens * 0.0015 + outputTokens * 0.002) / 1000;
            }
        } else if (provider === AiProvider.GEMINI) {
            // Gemini Pro pricing
            return (inputTokens * 0.00025 + outputTokens * 0.0005) / 1000;
        }

        return 0;
    }
}
