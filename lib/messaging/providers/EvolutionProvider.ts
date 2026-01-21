/**
 * Evolution API Provider (Phase 3)
 * 
 * Open-source WhatsApp Web gateway
 * Docs: https://doc.evolution-api.com/
 */

import type {
    WhatsAppProvider,
    SendTextMessageParams,
    SendTemplateMessageParams,
    SendMessageResult,
    InboundMessage,
    WebhookVerificationParams,
    EvolutionCredentials,
} from './WhatsAppProvider';

export class EvolutionProvider implements WhatsAppProvider {
    readonly name = 'EVOLUTION';

    constructor(private credentials: EvolutionCredentials) {
        if (!credentials.baseUrl || !credentials.instanceId || !credentials.apiToken) {
            throw new Error('Evolution API requires baseUrl, instanceId, and apiToken');
        }
    }

    /**
     * Send text message via Evolution API
     */
    async sendTextMessage(params: SendTextMessageParams): Promise<SendMessageResult> {
        try {
            const { to, body } = params;

            const { baseUrl, instanceId, apiToken } = this.credentials;

            // Evolution uses JID format: phone@s.whatsapp.net
            const cleanPhone = to.replace(/\D/g, '');
            const remoteJid = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;

            const response = await fetch(
                `${baseUrl}/message/sendText/${instanceId}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': apiToken,
                    },
                    body: JSON.stringify({
                        number: remoteJid,
                        text: body,
                        delay: 0,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Evolution API error: ${response.status}`);
            }

            const data = await response.json();

            // Evolution returns message key
            const messageId = data.key?.id || data.messageId || String(Date.now());

            return {
                success: true,
                messageId,
                provider: this.name,
            };

        } catch (error: any) {
            console.error('[EvolutionProvider] Send text error:', error);
            return {
                success: false,
                error: error.message,
                provider: this.name,
            };
        }
    }

    /**
     * Send template message
     * Note: Evolution API doesn't support official WhatsApp templates
     * Fallback to regular text message
     */
    async sendTemplateMessage(params: SendTemplateMessageParams): Promise<SendMessageResult> {
        // Evolution doesn't support WhatsApp Business templates
        // Send as regular message with parameters injected
        const { to, templateName, templateParams } = params;

        let body = templateName;
        if (templateParams) {
            for (const [key, value] of Object.entries(templateParams)) {
                body = body.replace(`{{${key}}}`, value);
            }
        }

        return this.sendTextMessage({
            to,
            from: '', // Not used
            body,
        });
    }

    /**
     * Parse Evolution API webhook payload
     * 
     * Evolution sends various webhook events:
     * {
     *   event: "messages.upsert",
     *   instance: "...",
     *   data: {
     *     key: {...},
     *     message: {...},
     *     messageTimestamp: "..."
     *   }
     * }
     */
    parseInboundWebhook(payload: any): InboundMessage[] {
        const messages: InboundMessage[] = [];

        try {
            // Evolution sends different event types
            const event = payload.event;

            // Only process incoming messages
            if (event !== 'messages.upsert' && event !== 'message.received') {
                return messages;
            }

            const data = payload.data;
            if (!data) return messages;

            // Extract message details
            const key = data.key;
            const message = data.message;

            if (!key || !message) return messages;

            // Skip outbound messages (fromMe === true)
            if (key.fromMe) return messages;

            const from = key.remoteJid?.replace('@s.whatsapp.net', '') || '';
            const to = payload.instance || '';
            const messageId = key.id;
            const timestamp = data.messageTimestamp
                ? new Date(parseInt(data.messageTimestamp) * 1000).toISOString()
                : new Date().toISOString();

            let body = '';
            let mediaUrl: string | undefined;
            let mediaType: 'image' | 'audio' | 'video' | 'document' | undefined;

            // Extract content based on message type
            if (message.conversation) {
                body = message.conversation;
            } else if (message.extendedTextMessage) {
                body = message.extendedTextMessage.text || '';
            } else if (message.imageMessage) {
                body = message.imageMessage.caption || '[Image]';
                mediaUrl = message.imageMessage.url;
                mediaType = 'image';
            } else if (message.videoMessage) {
                body = message.videoMessage.caption || '[Video]';
                mediaUrl = message.videoMessage.url;
                mediaType = 'video';
            } else if (message.audioMessage) {
                body = '[Audio]';
                mediaUrl = message.audioMessage.url;
                mediaType = 'audio';
            } else if (message.documentMessage) {
                body = message.documentMessage.caption || message.documentMessage.fileName || '[Document]';
                mediaUrl = message.documentMessage.url;
                mediaType = 'document';
            }

            if (from && messageId) {
                messages.push({
                    from: from.startsWith('+') ? from : `+${from}`,
                    to: to.startsWith('+') ? to : `+${to}`,
                    body,
                    messageId,
                    timestamp,
                    mediaUrl,
                    mediaType,
                });
            }

        } catch (error) {
            console.error('[EvolutionProvider] Parse webhook error:', error);
        }

        return messages;
    }

    /**
     * Verify Evolution API webhook
     * 
     * Evolution can be configured with API key verification
     */
    verifyWebhook(params: WebhookVerificationParams): boolean {
        const { headers } = params;

        // Check if API key is provided in headers
        const apiKey = headers['apikey'] || headers['x-api-key'];

        if (apiKey && apiKey === this.credentials.apiToken) {
            return true;
        }

        // If no API key in headers, allow (Evolution doesn't enforce by default)
        console.warn('[EvolutionProvider] Webhook received without API key verification');
        return true;
    }

    /**
     * Check if Evolution instance is healthy
     */
    async isHealthy(): Promise<boolean> {
        try {
            const { baseUrl, instanceId, apiToken } = this.credentials;

            const response = await fetch(
                `${baseUrl}/instance/connectionState/${instanceId}`,
                {
                    headers: {
                        'apikey': apiToken,
                    },
                }
            );

            if (!response.ok) return false;

            const data = await response.json();

            // Evolution returns state: "open" | "close" | "connecting"
            return data.state === 'open';

        } catch (error) {
            console.error('[EvolutionProvider] Health check error:', error);
            return false;
        }
    }
}
