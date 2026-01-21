/**
 * Safety Checker - Full Implementation
 * 
 * Validates AI-generated messages against hard-block patterns and company policies
 */

import { PrismaClient, ViolationType, ViolationSeverity } from '@prisma/client';

const prisma = new PrismaClient();

export interface SafetyPolicy {
    allowedIntents: string[];
    autoSendIntents: string[];
    minConfidence: number;
    maxMessageLength: number;
    maxRiskScore: number;
    tone: string;
    languages: string[];
    respectOptOut: boolean;
    optOutKeywords: string[];
    escalateKeywords: string[];
    escalateNegativeSentiment: boolean;
}

export interface SafetyCheckResult {
    passed: boolean;
    riskScore: number;
    violations: ViolationDetail[];
    shouldEscalate: boolean;
    shouldBlock: boolean;
}

export interface ViolationDetail {
    type: ViolationType;
    severity: ViolationSeverity;
    detectedText: string;
    context?: string;
    ruleMatched: string;
    explanation: string;
}

export class SafetyChecker {
    /**
     * Validate AI-generated message against safety policy
     */
    async validate(
        message: string,
        intent: string | null,
        policy: SafetyPolicy
    ): Promise<SafetyCheckResult> {
        const violations: ViolationDetail[] = [];
        let riskScore = 0;

        try {
            // 1. Check message length
            if (message.length > policy.maxMessageLength) {
                violations.push({
                    type: ViolationType.OFF_TOPIC,
                    severity: ViolationSeverity.LOW,
                    detectedText: message.substring(0, 100) + '...',
                    ruleMatched: 'MAX_LENGTH_EXCEEDED',
                    explanation: `Message exceeds max length of ${policy.maxMessageLength} characters`,
                });
                riskScore += 5;
            }

            // 2. Check for price mentions (CRITICAL - never mention exact prices)
            const pricePatterns = [
                /\d+[\s,]*(?:million|m|k)\s*(?:aed|usd|dirham)/i,
                /aed\s*\d[\d,]*/i,
                /\d[\d,]*\s*aed/i,
                /price.*\d[\d,]*/i,
                /\$\s*\d[\d,]*/,
            ];

            for (const pattern of pricePatterns) {
                const match = message.match(pattern);
                if (match) {
                    violations.push({
                        type: ViolationType.PRICE_MENTION,
                        severity: ViolationSeverity.CRITICAL,
                        detectedText: match[0],
                        ruleMatched: 'PRICE_PATTERN',
                        explanation: 'AI must never mention specific prices or property values',
                    });
                    riskScore += 50; // High risk
                }
            }

            // 3. Check for legal advice keywords
            const legalKeywords = [
                'legally', 'legal advice', 'contract guarantees', 'sue', 'lawsuit',
                'attorney', 'lawyer', 'court', 'jurisdiction', 'liability insurance',
            ];

            for (const keyword of legalKeywords) {
                if (message.toLowerCase().includes(keyword)) {
                    violations.push({
                        type: ViolationType.LEGAL_ADVICE,
                        severity: ViolationSeverity.HIGH,
                        detectedText: keyword,
                        ruleMatched: 'LEGAL_KEYWORD',
                        explanation: 'AI cannot provide legal advice or legal interpretations',
                    });
                    riskScore += 30;
                    break; // Only count once
                }
            }

            // 4. Check for financial advice keywords
            const financialKeywords = [
                'invest', 'investment advice', 'guaranteed returns', 'tax benefits',
                'mortgage approval', 'loan guarantee', 'financial planning',
            ];

            for (const keyword of financialKeywords) {
                if (message.toLowerCase().includes(keyword)) {
                    violations.push({
                        type: ViolationType.FINANCIAL_ADVICE,
                        severity: ViolationSeverity.HIGH,
                        detectedText: keyword,
                        ruleMatched: 'FINANCIAL_KEYWORD',
                        explanation: 'AI cannot provide financial or investment advice',
                    });
                    riskScore += 30;
                    break;
                }
            }

            // 5. Check for personal data leaks (email, phone patterns)
            const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            const phonePattern = /\+?\d{10,}/g;

            const emails = message.match(emailPattern);
            const phones = message.match(phonePattern);

            if (emails) {
                violations.push({
                    type: ViolationType.PERSONAL_DATA_LEAK,
                    severity: ViolationSeverity.MEDIUM,
                    detectedText: emails[0],
                    ruleMatched: 'EMAIL_PATTERN',
                    explanation: 'Message contains email address which may be a data leak',
                });
                riskScore += 20;
            }

            if (phones) {
                violations.push({
                    type: ViolationType.PERSONAL_DATA_LEAK,
                    severity: ViolationSeverity.MEDIUM,
                    detectedText: phones[0],
                    ruleMatched: 'PHONE_PATTERN',
                    explanation: 'Message contains phone number which may be a data leak',
                });
                riskScore += 20;
            }

            // 6. Check for aggressive language
            const aggressiveKeywords = [
                'must buy', 'you have to', 'limited time only', 'act now or lose',
                'don\'t miss out', 'final offer', 'urgent decision',
            ];

            for (const keyword of aggressiveKeywords) {
                if (message.toLowerCase().includes(keyword)) {
                    violations.push({
                        type: ViolationType.AGGRESSIVE_LANGUAGE,
                        severity: ViolationSeverity.MEDIUM,
                        detectedText: keyword,
                        ruleMatched: 'AGGRESSIVE_KEYWORD',
                        explanation: 'Message uses high-pressure or aggressive sales language',
                    });
                    riskScore += 15;
                    break;
                }
            }

            // 7. Check for competitor mentions
            const competitors = [
                'emaar', 'damac', 'nakheel', 'dubai properties', 'meraas',
                'aldar', 'sobha', 'azizi',
            ];

            for (const competitor of competitors) {
                if (message.toLowerCase().includes(competitor)) {
                    violations.push({
                        type: ViolationType.COMPETITOR_MENTION,
                        severity: ViolationSeverity.LOW,
                        detectedText: competitor,
                        ruleMatched: 'COMPETITOR_NAME',
                        explanation: 'Message mentions competitor by name',
                    });
                    riskScore += 10;
                    break;
                }
            }

            // 8. Check for absolute availability claims
            const availabilityPatterns = [
                'definitely available',
                'guaranteed available',
                '100% available',
                'still available for sure',
            ];

            for (const pattern of availabilityPatterns) {
                if (message.toLowerCase().includes(pattern)) {
                    violations.push({
                        type: ViolationType.AVAILABILITY_CLAIM,
                        severity: ViolationSeverity.MEDIUM,
                        detectedText: pattern,
                        ruleMatched: 'AVAILABILITY_ABSOLUTE',
                        explanation: 'AI should not make absolute availability claims without verification',
                    });
                    riskScore += 20;
                    break;
                }
            }

            // 9. Check for opt-out keywords in response (shouldn't echo them)
            for (const keyword of policy.optOutKeywords) {
                if (message.toLowerCase().includes(keyword.toLowerCase())) {
                    violations.push({
                        type: ViolationType.SPAM_PATTERN,
                        severity: ViolationSeverity.LOW,
                        detectedText: keyword,
                        ruleMatched: 'OPT_OUT_ECHO',
                        explanation: 'Message echoes opt-out keyword which is confusing',
                    });
                    riskScore += 5;
                    break;
                }
            }

            // 10. Check if intent is allowed
            if (intent && !policy.allowedIntents.includes(intent)) {
                violations.push({
                    type: ViolationType.OFF_TOPIC,
                    severity: ViolationSeverity.MEDIUM,
                    detectedText: intent,
                    ruleMatched: 'INTENT_NOT_ALLOWED',
                    explanation: `Intent "${intent}" is not in allowed intents list`,
                });
                riskScore += 25;
            }

            // Determine if should escalate (check escalation keywords)
            const shouldEscalate = policy.escalateKeywords.some(kw =>
                message.toLowerCase().includes(kw.toLowerCase())
            );

            // Determine if should block (critical violations or risk too high)
            const hasCriticalViolation = violations.some(v => v.severity === ViolationSeverity.CRITICAL);
            const shouldBlock = hasCriticalViolation || riskScore > policy.maxRiskScore;

            const passed = !shouldBlock && violations.length === 0;

            return {
                passed,
                riskScore,
                violations,
                shouldEscalate,
                shouldBlock,
            };

        } catch (error) {
            console.error('[SafetyChecker] validate error:', error);

            // On error, fail safe: block the message
            return {
                passed: false,
                riskScore: 100,
                violations: [{
                    type: ViolationType.OFF_TOPIC,
                    severity: ViolationSeverity.CRITICAL,
                    detectedText: 'Error during validation',
                    ruleMatched: 'VALIDATION_ERROR',
                    explanation: 'Safety check failed due to error - blocking for safety',
                }],
                shouldEscalate: true,
                shouldBlock: true,
            };
        }
    }

    /**
     * Check if phone number has opted out
     */
    async isOptedOut(companyId: string, phone: string): Promise<boolean> {
        try {
            const optOut = await prisma.optOutList.findUnique({
                where: {
                    companyId_phone: {
                        companyId,
                        phone,
                    },
                },
            });

            // Check if opted out and hasn't opted back in
            const isOptedOut = optOut !== null && optOut.optedInAt === null;

            if (isOptedOut) {
                console.log('[SafetyChecker] Phone number is opted out:', phone);
            }

            return !!isOptedOut;

        } catch (error) {
            console.error('[SafetyChecker] isOptedOut error:', error);
            // On error, assume opted out (fail safe)
            return true;
        }
    }
}
