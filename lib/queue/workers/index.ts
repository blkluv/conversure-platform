/**
 * BullMQ Workers Registry
 * 
 * Starts and manages all BullMQ workers for async job processing
 */

import { Worker } from 'bullmq';
import { createWhatsAppWebhookWorker } from './whatsappWebhookWorker';
import { createEmailWorker } from './emailWorker';

export function startWorkers() {
    const workers: Worker[] = [];

    console.log('[Workers] Starting BullMQ workers...');

    // Start WhatsApp webhook worker
    const whatsappWorker = createWhatsAppWebhookWorker();
    if (whatsappWorker) {
        workers.push(whatsappWorker);
        console.log('[Workers] WhatsApp webhook worker started');
    }

    // Start Email worker
    const emailWorker = createEmailWorker();
    if (emailWorker) {
        workers.push(emailWorker);
        console.log('[Workers] Email worker started');
    }

    // TODO: Add more workers as needed
    // - AI generation worker
    // - Campaign execution worker
    // - etc.

    // Graceful shutdown
    const shutdown = async () => {
        console.log('[Workers] Shutting down workers...');

        await Promise.all(
            workers.map(async (worker) => {
                await worker.close();
            })
        );

        console.log('[Workers] All workers shut down');
        process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    console.log(`[Workers] ${workers.length} worker(s) running`);

    return workers;
}

// Auto-start workers if this file is run directly
if (require.main === module) {
    startWorkers();
}
