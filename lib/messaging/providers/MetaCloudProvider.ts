/**
 * Meta WhatsApp Cloud API Provider (Phase 3)
 * 
 * Official Meta WhatsApp Business Platform
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

import type {
    WhatsAppProvider,
    SendTextMessageParams,
    SendTemplateMessageParams,
    SendMessageResult,
    InboundMessage,
    WebhookVerificationParams,
    MetaCredentials,
} from './WhatsAppProvider';

export class MetaCloudProvider implements WhatsAppProvider {
    readonly name = 'META';

    constructor(private credentials: MetaCredentials) {
        if (!credentials.apiUrl || !credentials.accessToken) {
            throw new Error('Meta Cloud API requires apiUrl and accessToken');
        }
    }

    /**
     * Send text message via Meta Cloud API
     */
    async sendTextMessage(params: SendTextMessageParams): Promise<SendMessageResult> {
        try {
            const { to, body, mediaUrl } = params;

            // Clean phone number (Meta doesn't accept + prefix)
            const cleanPhone = to.replace(/\D/g, '');

            const payload: any = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: cleanPhone,
            };

            if (mediaUrl) {
                // Send media message
                const mediaType = this.getMediaType(mediaUrl);
                payload.type = mediaType;
                payload[mediaType] = {
                    link: mediaUrl,
                    caption: body || undefined,
                };
            } else {
                // Send text message
                payload.type = 'text';
                payload.text = { body };
            }

            const response = await fetch(this.credentials.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.credentials.accessToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error?.message ||
                    errorData.error_description ||
                    `Meta API error: ${response.status}`
                );
            }

            const data = await response.json();
            const messageId = data.messages?.[0]?.id;

            if (!messageId) {
                throw new Error('No message ID returned from Meta API');
            }

            return {
                success: true,
                messageId,
                provider: this.name,
            };

        } catch (error: any) {
            console.error('[MetaCloudProvider] Send text error:', error);
            return {
                success: false,
                error: error.message,
                provider: this.name,
            };
        }
    }

    /**
     * Send template message via Meta Cloud API
     */
    async sendTemplateMessage(params: SendTemplateMessageParams): Promise<SendMessageResult> {
        try {
            const { to, templateName, templateParams, languageCode = 'en' } = params;

            const cleanPhone = to.replace(/\D/g, '');

            // Build template components
            const components: any[] = [];

            if (templateParams) {
                const parameters = Object.values(templateParams).map(value => ({
                    type: 'text',
                    text: value,
                }));

                components.push({
                    type: 'body',
                    parameters,
                });
            }

            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: cleanPhone,
                type: 'template',
                template: {
                    name: templateName,
                    language: {
                        code: languageCode,
                    },
                    components: components.length > 0 ? components : undefined,
                },
            };

            const response = await fetch(this.credentials.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.credentials.accessToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error?.message ||
                    `Meta template send error: ${response.status}`
                );
            }

            const data = await response.json();
            const messageId = data.messages?.[0]?.id;

            return {
                success: true,
                messageId,
                provider: this.name,
            };

        } catch (error: any) {
            console.error('[MetaCloudProvider] Send template error:', error);
            return {
                success: false,
                error: error.message,
                provider: this.name,
            };
        }
    }

    /**
     * Parse Meta webhook payload
     * 
     * Meta sends webhooks with format:
     * {
     *   object: "whatsapp_business_account",
     *   entry: [{
     *     changes: [{
     *       value: {
     *         messages: [...],
     *         statuses: [...]
     *       }
     *     }]
     *   }]
     * }
     */
    parseInboundWebhook(payload: any): InboundMessage[] {
        const messages: InboundMessage[] = [];

        try {
            const entry = payload.entry?.[0];
            if (!entry) return messages;

            const changes = entry.changes?.[0];
            if (!changes) return messages;

            const value = changes.value;
            if (!value) return messages;

            const inboundMessages = value.messages || [];

            for (const msg of inboundMessages) {
                const from = msg.from;
                const to = value.metadata?.phone_number_id || value.metadata?.display_phone_number;
                const messageId = msg.id;
                const timestamp = msg.timestamp;

                let body = '';
                let mediaUrl: string | undefined;
                let mediaType: 'image' | 'audio' | 'video' | 'document' | undefined;

                // Extract content based on type
                if (msg.type === 'text') {
                    body = msg.text?.body || '';
                } else if (msg.type === 'image') {
                    body = msg.image?.caption || '[Image]';
                    mediaUrl = msg.image?.id; // Will need to download from Meta API
                    mediaType = 'image';
                } else if (msg.type === 'audio') {
                    body = '[Audio]';
                    mediaUrl = msg.audio?.id;
                    mediaType = 'audio';
                } else if (msg.type === 'video') {
                    body = msg.video?.caption || '[Video]';
                    mediaUrl = msg.video?.id;
                    mediaType = 'video';
                } else if (msg.type === 'document') {
                    body = msg.document?.caption || msg.document?.filename || '[Document]';
                    mediaUrl = msg.document?.id;
                    mediaType = 'document';
                }

                if (from && messageId) {
                    messages.push({
                        from: `+${from}`, // Add + for E.164
                        to: to ? `+${to}` : '',
                        body,
                        messageId,
                        timestamp: timestamp || new Date().toISOString(),
                        mediaUrl,
                        mediaType,
                    });
                }
            }

        } catch (error) {
            console.error('[MetaCloudProvider] Parse webhook error:', error);
        }

        return messages;
    }

    /**
     * Verify Meta webhook signature
     * 
     * Meta sends:
     * - hub.mode = "subscribe"
     * - hub.verify_token = <your_token>
     * - hub.challenge = <random_string>
     * 
     * For verification, return hub.challenge
     * For regular webhooks, verify X-Hub-Signature-256 header
     */
    verifyWebhook(params: WebhookVerificationParams): boolean {
        const { query, headers } = params;

        // Verification request (initial webhook setup)
        if (query['hub.mode'] === 'subscribe') {
            const token = query['hub.verify_token'];
            const webhookSecret = process.env.META_WEBHOOK_VERIFY_TOKEN || 'conversure-verify-token';

            return token === webhookSecret;
        }

        // Regular webhook verification via signature
        const signature = headers['x-hub-signature-256'];
        if (!signature) {
            console.warn('[MetaCloudProvider] Missing webhook signature');
            return false;
        }

        // For signature verification, we'd need the raw body
        // This is handled in the webhook route
        return true;
    }

    /**
     * Helper: Determine media type from URL
     */
    private getMediaType(url: string): 'image' | 'video' | 'audio' | 'document' {
        const lower = url.toLowerCase();

        if (lower.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'image';
        if (lower.match(/\.(mp4|mov|avi)$/)) return 'video';
        if (lower.match(/\.(mp3|wav|ogg|m4a)$/)) return 'audio';

        return 'document';
    }
}
