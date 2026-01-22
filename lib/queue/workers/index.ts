/**
 * BullMQ Workers Registry
 * 
 * Starts and manages all BullMQ workers for async job processing
 */

import { createWhatsAppWebhookWorker } from './whatsappWebhookWorker';

export function startWorkers() {
    const workers = [];

    console.log('[Workers] Starting BullMQ workers...');

    // Start WhatsApp webhook worker
    const whatsappWorker = createWhatsAppWebhookWorker();
    if (whatsappWorker) {
        workers.push(whatsappWorker);
        console.log('[Workers] WhatsApp webhook worker started');
    }

    // TODO: Add more workers as needed
    // - AI generation worker
    // - Campaign execution worker
    // - Email worker
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
