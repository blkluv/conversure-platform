/**
 * WhatsApp Provider Interface (Phase 3)
 * 
 * Unified interface for all WhatsApp messaging providers
 */

export interface SendTextMessageParams {
    to: string;        // E.164 format: +971501234567
    from: string;      // Business phone number
    body: string;      // Message text
    mediaUrl?: string; // Optional media attachment
}

export interface SendTemplateMessageParams {
    to: string;
    from: string;
    templateName: string;
    templateParams?: Record<string, string>;
    languageCode?: string; // Default: 'en'
}

export interface SendMessageResult {
    success: boolean;
    messageId?: string;
    error?: string;
    provider: string;
}

export interface MarkAsReadParams {
    messageId: string;
}

export interface InboundMessage {
    from: string;          // Customer phone (E.164)
    to: string;            // Business phone
    body: string;
    messageId: string;
    timestamp: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'audio' | 'video' | 'document';
}

export interface WebhookVerificationParams {
    query: Record<string, string>;
    headers: Record<string, string>;
}

/**
 * WhatsApp Provider Interface
 * 
 * All provider implementations must implement this interface
 */
export interface WhatsAppProvider {
    /**
     * Provider identifier
     */
    readonly name: string;

    /**
     * Send text message
     */
    sendTextMessage(params: SendTextMessageParams): Promise<SendMessageResult>;

    /**
     * Send template message (required for messages outside 24h window)
     */
    sendTemplateMessage(params: SendTemplateMessageParams): Promise<SendMessageResult>;

    /**
     * Mark message as read (optional)
     */
    markAsRead?(params: MarkAsReadParams): Promise<void>;

    /**
     * Parse inbound webhook payload
     */
    parseInboundWebhook(payload: any): InboundMessage[];

    /**
     * Verify webhook signature/token (for security)
     */
    verifyWebhook(params: WebhookVerificationParams): boolean;

    /**
     * Get provider health status
     */
    isHealthy?(): Promise<boolean>;
}

/**
 * Provider configuration stored in database (encrypted)
 */
export interface ProviderConfig {
    provider: 'META' | 'CHATWOOT' | 'EVOLUTION' | 'GENERIC';
    credentials: MetaCredentials | ChatwootCredentials | EvolutionCredentials | GenericCredentials;
    webhookSecret?: string;
    isActive: boolean;
}

export interface MetaCredentials {
    apiUrl: string;
    accessToken: string;
    phoneNumberId: string;
    businessAccountId?: string;
}

export interface ChatwootCredentials {
    baseUrl: string;
    apiToken: string;
    accountId: string;
    inboxId: string;
}

export interface EvolutionCredentials {
    baseUrl: string;
    instanceId: string;
    apiToken: string;
}

export interface GenericCredentials {
    baseUrl: string;
    authType: 'bearer' | 'api_key' | 'custom';
    authToken: string;
    customHeaders?: Record<string, string>;
}
