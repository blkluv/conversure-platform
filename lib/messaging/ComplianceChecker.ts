/**
 * Compliance Checker (Phase 3)
 * 
 * Enforces WhatsApp Business API compliance:
 * - 24-hour customer care window
 * - Opt-out list enforcement
 * - Template message requirements
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export interface ComplianceCheckResult {
    allowed: boolean;
    reason?: string;
    requiresTemplate: boolean;
    withinWindow: boolean;
    isOptedOut: boolean;
}

/**
 * Check if outbound message is compliant
 * 
 * WhatsApp Business Policy:
 * - Messages to leads can be sent freely within 24h of their last inbound message
 * - After 24h, must use approved template messages
 * - Opted-out numbers cannot receive any messages
 */
export async function checkCompliance(
    companyId: string,
    phone: string,
    conversationId?: string
): Promise<ComplianceCheckResult> {
    try {
        // 1. Check opt-out first (hard stop)
        const isOptedOut = await isPhoneOptedOut(companyId, phone);

        if (isOptedOut) {
            return {
                allowed: false,
                reason: 'Phone number has opted out of communications',
                requiresTemplate: false,
                withinWindow: false,
                isOptedOut: true,
            };
        }

        // 2. Check 24-hour window
        let withinWindow = false;

        if (conversationId) {
            withinWindow = await isWithin24HourWindow(conversationId);
        }

        // 3. Determine if template required
        const requiresTemplate = !withinWindow;

        return {
            allowed: true,
            requiresTemplate,
            withinWindow,
            isOptedOut: false,
        };

    } catch (error) {
        console.error('[ComplianceChecker] Error:', error);

        // Fail-safe: block message on error
        return {
            allowed: false,
            reason: 'Compliance check failed - blocking for safety',
            requiresTemplate: true,
            withinWindow: false,
            isOptedOut: false,
        };
    }
}

/**
 * Check if phone number has opted out
 */
export async function isPhoneOptedOut(companyId: string, phone: string): Promise<boolean> {
    try {
        const optOut = await prisma.optOutList.findUnique({
            where: {
                companyId_phone: {
                    companyId,
                    phone,
                },
            },
        });

        // If opted out and hasn't opted back in
        const isOptedOut = optOut !== null && optOut.optedInAt === null;

        if (isOptedOut) {
            console.log(`[ComplianceChecker] Phone ${phone} is opted out`);
        }

        return isOptedOut;

    } catch (error) {
        console.error('[ComplianceChecker] Opt-out check error:', error);
        // Fail-safe: assume opted out on error
        return true;
    }
}

/**
 * Check if conversation is within 24-hour customer care window
 * 
 * Window starts from last INBOUND message
 */
export async function isWithin24HourWindow(conversationId: string): Promise<boolean> {
    try {
        // Find last inbound message
        const lastInbound = await prisma.message.findFirst({
            where: {
                conversationId,
                direction: 'INBOUND',
            },
            orderBy: {
                sentAt: 'desc',
            },
            select: {
                sentAt: true,
            },
        });

        if (!lastInbound) {
            // No inbound messages yet - cannot send freeform
            console.log(`[ComplianceChecker] No inbound messages in conversation ${conversationId}`);
            return false;
        }

        const now = new Date();
        const timeSinceLastInbound = now.getTime() - lastInbound.sentAt.getTime();
        const withinWindow = timeSinceLastInbound < TWENTY_FOUR_HOURS_MS;

        if (!withinWindow) {
            console.log(
                `[ComplianceChecker] Conversation ${conversationId} outside 24h window (${Math.round(timeSinceLastInbound / 1000 / 60 / 60)}h ago)`
            );
        }

        return withinWindow;

    } catch (error) {
        console.error('[ComplianceChecker] Window check error:', error);
        // Fail-safe: assume outside window
        return false;
    }
}

/**
 * Process inbound message for opt-out keywords
 * 
 * Detects: "stop", "unsubscribe", "opt out", Arabic equivalents
 */
export async function detectOptOut(
    companyId: string,
    phone: string,
    messageBody: string
): Promise<boolean> {
    const lowerBody = messageBody.toLowerCase().trim();

    // Get company's opt-out keywords
    const settings = await prisma.companySettings.findUnique({
        where: { companyId },
        select: { aiOptOutKeywords: true },
    });

    const keywords = settings?.aiOptOutKeywords || [
        'stop',
        'unsubscribe',
        'opt out',
        'opt-out',
        'optout',
        'لا تتصل', // Arabic: "don't call"
        'توقف',     // Arabic: "stop"
        'إلغاء الاشتراك', // Arabic: "unsubscribe"
    ];

    // Check if message contains opt-out keywords
    const containsOptOut = keywords.some(keyword =>
        lowerBody.includes(keyword.toLowerCase())
    );

    if (containsOptOut) {
        console.log(`[ComplianceChecker] Opt-out detected from ${phone}: "${messageBody}"`);

        // Add to opt-out list
        await prisma.optOutList.upsert({
            where: {
                companyId_phone: {
                    companyId,
                    phone,
                },
            },
            create: {
                companyId,
                phone,
                reason: `Keyword detected in message: "${messageBody.substring(0, 50)}..."`,
                source: 'INBOUND_MESSAGE',
            },
            update: {
                optedInAt: null, // Reset opt-in if they opt-out again
                reason: `Keyword detected in message: "${messageBody.substring(0, 50)}..."`,
            },
        });

        return true;
    }

    return false;
}

/**
 * Manually opt-out a phone number (admin action)
 */
export async function manualOptOut(
    companyId: string,
    phone: string,
    reason: string
): Promise<void> {
    await prisma.optOutList.upsert({
        where: {
            companyId_phone: {
                companyId,
                phone,
            },
        },
        create: {
            companyId,
            phone,
            reason,
            source: 'MANUAL',
        },
        update: {
            optedInAt: null,
            reason,
        },
    });

    console.log(`[ComplianceChecker] Manually opted out ${phone}: ${reason}`);
}

/**
 * Opt-in a phone number (re-enable communications)
 */
export async function optIn(companyId: string, phone: string): Promise<void> {
    await prisma.optOutList.update({
        where: {
            companyId_phone: {
                companyId,
                phone,
            },
        },
        data: {
            optedInAt: new Date(),
        },
    });

    console.log(`[ComplianceChecker] Phone ${phone} opted back in`);
}
