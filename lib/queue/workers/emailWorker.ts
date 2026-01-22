/**
 * Email Worker
 * 
 * Processes email sending jobs asynchronously
 */

import { Worker, Job } from 'bullmq';
import nodemailer from 'nodemailer';

export function createEmailWorker() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        console.warn('[Email Worker] REDIS_URL not set, worker not started');
        return null;
    }

    const worker = new Worker('email:send', async (job: Job) => {
        const { to, subject, html, from } = job.data;

        console.log(`[Email Worker] Sending email to ${to}: ${subject}`);

        try {
            const transporter = nodemailer.createTransporter({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD
                }
            });

            const info = await transporter.sendMail({
                from: from || process.env.SMTP_FROM || 'noreply@conversure.ae',
                to,
                subject,
                html
            });

            console.log(`[Email Worker] Email sent: ${info.messageId}`);
            return { success: true, messageId: info.messageId };

        } catch (error: any) {
            console.error(`[Email Worker] Failed to send email:`, error);
            throw error;
        }
    }, {
        connection: redisUrl as any,
        concurrency: 3,
        limiter: {
            max: 10, // 10 emails
            duration: 1000 // per second
        }
    });

    worker.on('completed', (job) => {
        console.log(`[Email Worker] Job ${job.id} completed`);
    });

    worker.on('failed', (job, error) => {
        console.error(`[Email Worker] Job ${job?.id} failed:`, error);
    });

    return worker;
}
