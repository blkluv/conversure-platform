/**
 * Prompt Manager - Full Implementation
 * 
 * Manages AI prompt templates with database backing and caching
 */

import { PrismaClient, AiPrompt } from '@prisma/client';

const prisma = new PrismaClient();

// Simple in-memory cache
const cache = new Map<string, { prompt: AiPrompt; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface GetActivePromptOptions {
    companyId: string | null;
    name: string;
}

export class PromptManager {
    /**
     * Get active prompt for a company or fall back to global platform prompt
     */
    async getActivePrompt(options: GetActivePromptOptions): Promise<AiPrompt | null> {
        const { companyId, name } = options;

        const cacheKey = `${companyId || 'global'}-${name}`;

        // Check cache first
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log('[PromptManager] Cache hit:', cacheKey);
            return cached.prompt;
        }

        try {
            // Try company-specific prompt first
            if (companyId) {
                const companyPrompt = await prisma.aiPrompt.findFirst({
                    where: {
                        companyId,
                        name,
                        isActive: true,
                    },
                    orderBy: { activatedAt: 'desc' },
                });

                if (companyPrompt) {
                    cache.set(cacheKey, { prompt: companyPrompt, timestamp: Date.now() });
                    console.log('[PromptManager] Found company-specific prompt:', companyId, name);
                    return companyPrompt;
                }
            }

            // Fallback to global platform prompt
            const globalPrompt = await prisma.aiPrompt.findFirst({
                where: {
                    companyId: null,
                    name,
                    isActive: true,
                },
                orderBy: { activatedAt: 'desc' },
            });

            if (globalPrompt) {
                cache.set(cacheKey, { prompt: globalPrompt, timestamp: Date.now() });
                console.log('[PromptManager] Using global prompt for:', name);
                return globalPrompt;
            }

            console.warn('[PromptManager] No active prompt found for:', name);
            return null;

        } catch (error) {
            console.error('[PromptManager] getActivePrompt error:', error);
            return null;
        }
    }

    /**
     * Create new prompt version
     */
    async createPrompt(data: Partial<AiPrompt>): Promise<AiPrompt> {
        try {
            const {
                companyId = null,
                name,
                version,
                systemPrompt,
                userPromptTemplate,
                variables = [],
                model = 'gpt-4-turbo',
                temperature = 0.7,
                maxTokens = 500,
                description,
                createdBy,
            } = data;

            if (!name || !version || !systemPrompt || !userPromptTemplate) {
                throw new Error('Missing required prompt fields');
            }

            // Check for existing prompt with same version
            const existing = await prisma.aiPrompt.findUnique({
                where: {
                    companyId_name_version: {
                        companyId: (companyId || undefined) as any,
                        name,
                        version,
                    },
                },
            });

            if (existing) {
                throw new Error(`Prompt ${name} version ${version} already exists`);
            }

            const prompt = await prisma.aiPrompt.create({
                data: {
                    companyId: companyId || undefined,
                    name,
                    version,
                    systemPrompt,
                    userPromptTemplate,
                    variables,
                    model,
                    temperature,
                    maxTokens,
                    description,
                    isActive: false, // Not active by default
                    createdBy,
                },
            });

            console.log('[PromptManager] Created prompt:', prompt.id, version);

            // Clear cache for this prompt name
            this.clearCacheForName(companyId, name);

            return prompt;

        } catch (error) {
            console.error('[PromptManager] createPrompt error:', error);
            throw error;
        }
    }

    /**
     * Activate a specific prompt version
     */
    async activatePrompt(promptId: string): Promise<void> {
        try {
            // Find the prompt to activate
            const prompt = await prisma.aiPrompt.findUnique({
                where: { id: promptId },
            });

            if (!prompt) {
                throw new Error(`Prompt not found: ${promptId}`);
            }

            // Atomic transaction: deactivate others, activate target
            await prisma.$transaction(async (tx) => {
                // Deactivate all other versions with same companyId + name
                await tx.aiPrompt.updateMany({
                    where: {
                        companyId: prompt.companyId,
                        name: prompt.name,
                        id: { not: promptId },
                    },
                    data: {
                        isActive: false,
                        deactivatedAt: new Date(),
                    },
                });

                // Activate target prompt
                await tx.aiPrompt.update({
                    where: { id: promptId },
                    data: {
                        isActive: true,
                        activatedAt: new Date(),
                        deactivatedAt: null,
                    },
                });
            });

            console.log('[PromptManager] Activated prompt:', promptId);

            // Clear cache
            this.clearCacheForName(prompt.companyId, prompt.name);

        } catch (error) {
            console.error('[PromptManager] activatePrompt error:', error);
            throw error;
        }
    }

    /**
     * Clear cache for specific prompt name
     */
    private clearCacheForName(companyId: string | null, name: string): void {
        const keys = Array.from(cache.keys());
        for (const key of keys) {
            if (key.includes(name)) {
                cache.delete(key);
            }
        }
    }

    /**
     * Clear entire cache (useful for testing)
     */
    clearCache(): void {
        cache.clear();
    }
}
