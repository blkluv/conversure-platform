/**
 * Meta WhatsApp Cloud API Webhook (Phase 3)
 * 
 * Handles incoming messages and status updates from Meta WhatsApp Business Platform
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { MetaCloudProvider } from '@/lib/messaging/providers/MetaCloudProvider';
import { normalizePhone } from '@/lib/messaging/PhoneNormalizer';
import { detectOptOut } from '@/lib/messaging/ComplianceChecker';
import { maskWebhookPayload } from '@/lib/security/encryption';
import { QueueFactory } from '@/lib/queue/QueueFactory';

const prisma = new PrismaClient();

/**
 * GET handler - Webhook verification (initial setup)
 * 
 * Meta sends: ?hub.mode=subscribe&hub.verify_token=xxx&hub.challenge=xxx
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const mode = searchParams.get('hub.mode');
        const token = searchParams.get('hub.verify_token');
        const challenge = searchParams.get('hub.challenge');

        const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'conversure-verify-token';

        if (mode === 'subscribe' && token === verifyToken) {
            console.log('[Meta Webhook] Verification successful');
            return new NextResponse(challenge, { status: 200 });
        }

        console.warn('[Meta Webhook] Verification failed:', { mode, token: '***' });
        return NextResponse.json({ error: 'Verification failed' }, { status: 403 });

    } catch (error) {
        console.error('[Meta Webhook] GET error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

/**
 * POST handler - Incoming webhooks
 */
export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();

        // Store webhook event for audit (masked)
        const maskedPayload = maskWebhookPayload(payload);

        const webhookEvent = await prisma.providerWebhookEvent.create({
            data: {
                provider: 'META',
                eventType: 'webhook.incoming',
                payloadJson: maskedPayload,
                status: 'PENDING',
            },
        });

        try {
            // Parse using Meta provider
            const provider = new MetaCloudProvider({
                apiUrl: '', // Not needed for parsing
                accessToken: '',
                phoneNumberId: '',
            });

            const messages = provider.parseInboundWebhook(payload);

            if (messages.length === 0) {
                // No messages to process (might be status update)
                await prisma.providerWebhookEvent.update({
                    where: { id: webhookEvent.id },
                    data: {
                        status: 'PROCESSED',
                        processedAt: new Date(),
                    },
                });

                return NextResponse.json({ status: 'ok', processed: 0 });
            }

            // Process each message
            for (const message of messages) {
                await processInboundMessage({
                    provider: 'META',
                    from: message.from,
                    to: message.to,
                    body: message.body,
                    messageId: message.messageId,
                    timestamp: message.timestamp,
                    mediaUrl: message.mediaUrl,
                    mediaType: message.mediaType,
                });
            }

            // Mark webhook as processed
            await prisma.providerWebhookEvent.update({
                where: { id: webhookEvent.id },
                data: {
                    status: 'PROCESSED',
                    processedAt: new Date(),
                },
            });

            return NextResponse.json({
                status: 'ok',
                processed: messages.length,
            });

        } catch (error: any) {
            console.error('[Meta Webhook] Processing error:', error);

            // Mark webhook as failed
            await prisma.providerWebhookEvent.update({
                where: { id: webhookEvent.id },
                data: {
                    status: 'FAILED',
                    errorMessage: error.message,
                    processedAt: new Date(),
                },
            });

            // Still return 200 to prevent Meta retries
            return NextResponse.json({ status: 'error', message: error.message });
        }

    } catch (error: any) {
        console.error('[Meta Webhook] POST error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

/**
 * Process inbound message (shared logic for all providers)
 */
async function processInboundMessage(params: {
    provider: string;
    from: string;
    to: string;
    body: string;
    messageId: string;
    timestamp: string;
    mediaUrl?: string;
    mediaType?: string;
}) {
    try {
        const { provider, from, to, body, messageId, timestamp, mediaUrl, mediaType } = params;

        // Normalize phone numbers
        const normalizedFrom = normalizePhone(from);
        const normalizedTo = normalizePhone(to);

        // Find company by business phone number
        const company = await prisma.company.findFirst({
            where: {
                OR: [
                    { whatsappBusinessNumber: normalizedTo },
                    { whatsappNumbers: { some: { number: normalizedTo } } },
                ],
            },
            include: {
                companySettings: true,
            },
        });

        if (!company) {
            console.warn(`[Webhook] No company found for business number ${normalizedTo}`);
            return;
        }

        // Check for opt-out keywords
        const isOptOut = await detectOptOut(company.id, normalizedFrom, body);

        if (isOptOut) {
            console.log(`[Webhook] Opt-out detected from ${normalizedFrom}`);
            // Don't process further, but don't error
            return;
        }

        // Find or create lead
        let lead = await prisma.lead.findFirst({
            where: {
                companyId: company.id,
                phone: normalizedFrom,
            },
        });

        if (!lead) {
            lead = await prisma.lead.create({
                data: {
                    companyId: company.id,
                    name: normalizedFrom, // Will be updated later
                    phone: normalizedFrom,
                    source: 'WhatsApp',
                    status: 'NEW',
                },
            });

            console.log(`[Webhook] Created new lead: ${lead.id} for ${normalizedFrom}`);
        }

        // Find or create conversation
        let conversation = await prisma.conversation.findFirst({
            where: {
                companyId: company.id,
                leadId: lead.id,
                status: 'ACTIVE',
            },
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    companyId: company.id,
                    leadId: lead.id,
                    whatsappNumber: normalizedTo,
                    lastMessageAt: new Date(timestamp),
                    lastDirection: 'INBOUND',
                    status: 'ACTIVE',
                },
            });

            console.log(`[Webhook] Created new conversation: ${conversation.id}`);
        }

        // Create message record
        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                direction: 'INBOUND',
                contentType: mediaUrl ? (mediaType === 'image' ? 'IMAGE' : 'DOCUMENT') : 'TEXT',
                body,
                wabaMessageId: messageId,
                sentAt: new Date(timestamp),
            },
        });

        // Update conversation
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
                lastMessageAt: new Date(timestamp),
                lastDirection: 'INBOUND',
            },
        });

        console.log(`[Webhook] Processed  inbound message for conversation ${conversation.id}`);

        // Trigger AI generation if enabled
        if (company.companySettings?.aiEnabled) {
            const queue = QueueFactory.getQueue();

            await queue.addJob(
                'ai_generation',
                {
                    conversationId: conversation.id,
                    companyId: company.id,
                },
                {
                    priority: 7, // High priority for inbound
                    idempotencyKey: `ai-gen-inbound-${messageId}`,
                }
            );

            console.log(`[Webhook] Enqueued AI generation for conversation ${conversation.id}`);
        }

    } catch (error) {
        console.error('[Webhook] Process inbound error:', error);
        throw error;
    }
}
