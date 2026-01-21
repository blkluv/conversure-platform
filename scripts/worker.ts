/**
 * Worker Runner Script
 * 
 * Entry point for background job processing
 * Run with: npm run worker
 */

import { startWorkers } from '@/lib/queue/workers';

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
    console.error('❌ [Worker] Unhandled rejection:', error);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('❌ [Worker] Uncaught exception:', error);
    process.exit(1);
});

// Start workers
console.log('🔧 [Worker] Initializing Conversure job queue worker...');

startWorkers()
    .then(() => {
        console.log('✅ [Worker] Worker process exited cleanly');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ [Worker] Fatal error:', error);
        process.exit(1);
    });
