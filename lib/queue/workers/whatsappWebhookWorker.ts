/**
 * WhatsApp Webhook Worker
 * 
 * BullMQ worker that processes WhatsApp webhook events asynchronously
 */

import { Worker, Job } from 'bullmq';
import { db } from '@/lib/db';
import { processInboundMessage, processStatusUpdate } from '@/lib/whatsapp';

export function createWhatsAppWebhookWorker() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        console.warn('[WhatsApp Worker] REDIS_URL not set, worker not started');
        return null;
    }

    const worker = new Worker('whatsapp:webhook', async (job: Job) => {
        const { eventId, provider } = job.data;

        console.log(`[WhatsApp Worker] Processing event ${eventId} (attempt ${job.attemptsMade + 1})`);

        try {
            // Fetch webhook event
            const event = await db.webhookEvent.findUnique({
                where: { id: eventId }
            });

            if (!event) {
                throw new Error(`Webhook event ${eventId} not found`);
            }

            const payload = event.payload as any;

            // Process based on provider
            switch (provider) {
                case 'meta':
                    await processMetaWebhook(payload);
                    break;

                default:
                    console.warn(`[WhatsApp Worker] Unknown provider: ${provider}`);
            }

            console.log(`[WhatsApp Worker] Successfully processed event ${eventId}`);
            return { success: true, eventId };

        } catch (error: any) {
            console.error(`[WhatsApp Worker] Error processing event ${eventId}:`, error);
            throw error; // BullMQ will handle retries
        }
    }, {
        connection: redisUrl as any,
        concurrency: 5, // Process up to 5 webhooks simultaneously
        limiter: {
            max: 100, // Max 100 jobs
            duration: 1000 // per second
        }
    });

    // Event listeners
    worker.on('completed', (job) => {
        console.log(`[WhatsApp Worker] Job ${job.id} completed`);
    });

    worker.on('failed', (job, error) => {
        console.error(`[WhatsApp Worker] Job ${job?.id} failed:`, error);
    });

    worker.on('error', (error) => {
        console.error('[WhatsApp Worker] Worker error:', error);
    });

    return worker;
}

/**
 * Process Meta Cloud API webhook
 */
async function processMetaWebhook(body: any) {
    const entries = body.entry || [];

    for (const entry of entries) {
        const changes = entry.changes || [];

        for (const change of changes) {
            const value = change.value;

            if (!value) continue;

            // Handle inbound messages
            if (value.messages && value.messages.length > 0) {
                for (const message of value.messages) {
                    const companyNumber = value.metadata?.display_phone_number;
                    const company = await findCompanyByNumber(companyNumber);

                    if (!company) {
                        console.warn('[WhatsApp Worker] Company not found for number:', companyNumber);
                        continue;
                    }

                    await processInboundMessage({
                        companyId: company.id,
                        from: message.from,
                        to: companyNumber,
                        body: message.text?.body || message.caption || '',
                        messageId: message.id,
                        mediaUrl: message.image?.link || message.video?.link || message.document?.link,
                        timestamp: message.timestamp,
                    });
                }
            }

            // Handle status updates
            if (value.statuses && value.statuses.length > 0) {
                for (const status of value.statuses) {
                    await processStatusUpdate({
                        messageId: status.id,
                        status: status.status,
                        timestamp: status.timestamp,
                        error: status.errors?.[0]?.message,
                    });
                }
            }
        }
    }
}

/**
 * Find company by WhatsApp business number
 */
async function findCompanyByNumber(number: string) {
    if (!number) return null;

    const normalized = number.replace(/[^0-9]/g, '');

    return await db.company.findFirst({
        where: {
            OR: [
                { whatsappBusinessNumber: number },
                { whatsappBusinessNumber: `+${normalized}` },
                { whatsappBusinessNumber: normalized },
            ],
        },
    });
}
