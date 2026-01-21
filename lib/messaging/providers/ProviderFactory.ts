/**
 * Provider Factory (Phase 3)
 * 
 * Creates and manages WhatsApp provider instances
 */

import { PrismaClient } from '@prisma/client';
import type { WhatsAppProvider } from './WhatsAppProvider';
import { MetaCloudProvider } from './MetaCloudProvider';
import { ChatwootProvider } from './ChatwootProvider';
import { EvolutionProvider } from './EvolutionProvider';
import { decrypt, decryptJson } from '@/lib/security/encryption';

const prisma = new PrismaClient();

// In-memory cache of provider instances
const providerCache = new Map<string, { provider: WhatsAppProvider; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get WhatsApp provider for a company
 * 
 * Reads configuration from CompanySettings and creates appropriate provider instance
 */
export async function getProviderForCompany(companyId: string): Promise<WhatsAppProvider> {
    // Check cache first
    const cached = providerCache.get(companyId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.provider;
    }

    try {
        // Fetch company settings
        const settings = await prisma.companySettings.findUnique({
            where: { companyId },
            select: {
                whatsappProvider: true,
                chatwootBaseUrl: true,
                chatwootApiToken: true,
                chatwootAccountId: true,
                chatwootInboxId: true,
                evolutionBaseUrl: true,
                evolutionInstanceId: true,
                evolutionApiToken: true,
            },
        });

        if (!settings) {
            throw new Error(`Company settings not found for company ${companyId}`);
        }

        let provider: WhatsAppProvider;

        switch (settings.whatsappProvider) {
            case 'CHATWOOT':
                provider = createChatwootProvider(settings);
                break;

            case 'EVOLUTION':
                provider = createEvolutionProvider(settings);
                break;

            case 'WABA':
            default:
                provider = await createMetaProvider(companyId);
                break;
        }

        // Cache provider instance
        providerCache.set(companyId, {
            provider,
            timestamp: Date.now(),
        });

        return provider;

    } catch (error) {
        console.error('[ProviderFactory] Error getting provider:', error);
        throw error;
    }
}

/**
 * Create Meta Cloud API provider
 */
async function createMetaProvider(companyId: string): Promise<MetaCloudProvider> {
    // Get credentials from environment or company-specific config
    const apiUrl = process.env.WHATSAPP_API_URL || process.env.META_WHATSAPP_API_URL;
    const accessToken = process.env.WHATSAPP_API_KEY || process.env.META_ACCESS_TOKEN;

    if (!apiUrl || !accessToken) {
        throw new Error('Meta WhatsApp Cloud API credentials not configured');
    }

    // Check if credentials are encrypted
    let decryptedToken = accessToken;
    if (accessToken.includes(':')) {
        // Likely encrypted
        try {
            decryptedToken = decrypt(accessToken);
        } catch (error) {
            console.warn('[ProviderFactory] Failed to decrypt Meta token, using as-is');
        }
    }

    return new MetaCloudProvider({
        apiUrl,
        accessToken: decryptedToken,
        phoneNumberId: '', // Can be extracted from API URL or stored separately
    });
}

/**
 * Create Chatwoot provider
 */
function createChatwootProvider(settings: any): ChatwootProvider {
    const baseUrl = settings.chatwootBaseUrl || process.env.CHATWOOT_DEFAULT_BASE_URL;
    const apiToken = settings.chatwootApiToken || process.env.CHATWOOT_DEFAULT_API_TOKEN;
    const accountId = settings.chatwootAccountId || process.env.CHATWOOT_DEFAULT_ACCOUNT_ID;
    const inboxId = settings.chatwootInboxId || process.env.CHATWOOT_DEFAULT_INBOX_ID;

    if (!baseUrl || !apiToken || !accountId || !inboxId) {
        throw new Error('Chatwoot credentials not configured');
    }

    // Decrypt if encrypted
    let decryptedToken = apiToken;
    if (apiToken.includes(':')) {
        try {
            decryptedToken = decrypt(apiToken);
        } catch (error) {
            console.warn('[ProviderFactory] Failed to decrypt Chatwoot token, using as-is');
        }
    }

    return new ChatwootProvider({
        baseUrl,
        apiToken: decryptedToken,
        accountId,
        inboxId,
    });
}

/**
 * Create Evolution API provider
 */
function createEvolutionProvider(settings: any): EvolutionProvider {
    const baseUrl = settings.evolutionBaseUrl || process.env.EVOLUTION_DEFAULT_BASE_URL;
    const instanceId = settings.evolutionInstanceId || process.env.EVOLUTION_DEFAULT_INSTANCE_ID;
    const apiToken = settings.evolutionApiToken || process.env.EVOLUTION_DEFAULT_API_TOKEN;

    if (!baseUrl || !instanceId || !apiToken) {
        throw new Error('Evolution API credentials not configured');
    }

    // Decrypt if encrypted
    let decryptedToken = apiToken;
    if (apiToken.includes(':')) {
        try {
            decryptedToken = decrypt(apiToken);
        } catch (error) {
            console.warn('[ProviderFactory] Failed to decrypt Evolution token, using as-is');
        }
    }

    return new EvolutionProvider({
        baseUrl,
        instanceId,
        apiToken: decryptedToken,
    });
}

/**
 * Clear provider cache (useful for testing or config changes)
 */
export function clearProviderCache(companyId?: string): void {
    if (companyId) {
        providerCache.delete(companyId);
    } else {
        providerCache.clear();
    }
}

/**
 * Get provider instance directly (for webhook handling when companyId is unknown)
 */
export function createProviderFromType(
    type: 'META' | 'CHATWOOT' | 'EVOLUTION',
    credentials: any
): WhatsAppProvider {
    switch (type) {
        case 'META':
            return new MetaCloudProvider(credentials);
        case 'CHATWOOT':
            return new ChatwootProvider(credentials);
        case 'EVOLUTION':
            return new EvolutionProvider(credentials);
        default:
            throw new Error(`Unsupported provider type: ${type}`);
    }
}
