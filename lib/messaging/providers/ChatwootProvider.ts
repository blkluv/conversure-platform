/**
 * Chatwoot Provider (Phase 3)
 * 
 * Open-source customer engagement platform with WhatsApp integration
 * Docs: https://www.chatwoot.com/docs/product/channels/whatsapp/
 */

import type {
    WhatsAppProvider,
    SendTextMessageParams,
    SendTemplateMessageParams,
    SendMessageResult,
    InboundMessage,
    WebhookVerificationParams,
    ChatwootCredentials,
} from './WhatsAppProvider';

export class ChatwootProvider implements WhatsAppProvider {
    readonly name = 'CHATWOOT';

    constructor(private credentials: ChatwootCredentials) {
        if (!credentials.baseUrl || !credentials.apiToken || !credentials.inboxId) {
            throw new Error('Chatwoot requires baseUrl, apiToken, and inboxId');
        }
    }

    /**
     * Send text message via Chatwoot API
     */
    async sendTextMessage(params: SendTextMessageParams): Promise<SendMessageResult> {
        try {
            const { to, body } = params;

            const { baseUrl, apiToken, accountId, inboxId } = this.credentials;

            // Clean phone number
            const cleanPhone = to.replace(/\D/g, '');

            // Step 1: Find or create contact
            let contactId = await this.findContact(cleanPhone);

            if (!contactId) {
                contactId = await this.createContact(cleanPhone);
            }

            // Step 2: Find or create conversation
            let conversationId = await this.findConversation(contactId, inboxId);

            if (!conversationId) {
                conversationId = await this.createConversation(contactId, inboxId);
            }

            // Step 3: Send message as outgoing
            const response = await fetch(
                `${baseUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'api_access_token': apiToken,
                    },
                    body: JSON.stringify({
                        content: body,
                        message_type: 'outgoing',
                        private: false,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Chatwoot send error: ${response.status}`);
            }

            const data = await response.json();
            const messageId = String(data.id);

            return {
                success: true,
                messageId,
                provider: this.name,
            };

        } catch (error: any) {
            console.error('[ChatwootProvider] Send text error:', error);
            return {
                success: false,
                error: error.message,
                provider: this.name,
            };
        }
    }

    /**
     * Send template message
     * Note: Chatwoot doesn't have native template support; send as regular message
     */
    async sendTemplateMessage(params: SendTemplateMessageParams): Promise<SendMessageResult> {
        // Chatwoot doesn't support templates; fall back to text message
        const { to, templateParams } = params;

        // Render template manually (simple placeholder replacement)
        let body = params.templateName;
        if (templateParams) {
            for (const [key, value] of Object.entries(templateParams)) {
                body = body.replace(`{{${key}}}`, value);
            }
        }

        return this.sendTextMessage({
            to,
            from: '', // Not used for Chatwoot
            body,
        });
    }

    /**
     * Parse Chatwoot webhook payload
     * 
     * Chatwoot sends:
     * {
     *   event: "message_created",
     *   message_type: "incoming",
     *   conversation: {...},
     *   sender: {...},
     *   content: "..."
     * }
     */
    parseInboundWebhook(payload: any): InboundMessage[] {
        const messages: InboundMessage[] = [];

        try {
            // Only process incoming messages
            if (payload.event !== 'message_created' || payload.message_type !== 'incoming') {
                return messages;
            }

            const from = payload.sender?.phone_number || payload.sender?.identifier;
            const to = payload.inbox?.phone_number || '';
            const body = payload.content || '';
            const messageId = String(payload.id);
            const timestamp = payload.created_at || new Date().toISOString();

            // Handle attachments
            let mediaUrl: string | undefined;
            let mediaType: 'image' | 'audio' | 'video' | 'document' | undefined;

            if (payload.attachments && payload.attachments.length > 0) {
                const attachment = payload.attachments[0];
                mediaUrl = attachment.data_url;

                if (attachment.file_type?.startsWith('image/')) mediaType = 'image';
                else if (attachment.file_type?.startsWith('video/')) mediaType = 'video';
                else if (attachment.file_type?.startsWith('audio/')) mediaType = 'audio';
                else mediaType = 'document';
            }

            if (from && messageId) {
                messages.push({
                    from: from.startsWith('+') ? from : `+${from}`,
                    to: to.startsWith('+') ? to : `+${to}`,
                    body: body || '[Media]',
                    messageId,
                    timestamp,
                    mediaUrl,
                    mediaType,
                });
            }

        } catch (error) {
            console.error('[ChatwootProvider] Parse webhook error:', error);
        }

        return messages;
    }

    /**
     * Verify Chatwoot webhook
     * Chatwoot doesn't provide signature verification by default
     */
    verifyWebhook(params: WebhookVerificationParams): boolean {
        // Chatwoot doesn't have built-in signature verification
        // Could implement IP whitelist or custom token if needed
        return true;
    }

    /**
     * Helper: Find contact by phone number
     */
    private async findContact(phone: string): Promise<string | null> {
        try {
            const { baseUrl, apiToken, accountId } = this.credentials;

            const response = await fetch(
                `${baseUrl}/api/v1/accounts/${accountId}/contacts/search?q=${phone}`,
                {
                    headers: {
                        'api_access_token': apiToken,
                    },
                }
            );

            if (!response.ok) return null;

            const data = await response.json();
            const contact = data.payload?.[0];

            return contact ? String(contact.id) : null;

        } catch (error) {
            console.error('[ChatwootProvider] Find contact error:', error);
            return null;
        }
    }

    /**
     * Helper: Create new contact
     */
    private async createContact(phone: string): Promise<string> {
        const { baseUrl, apiToken, accountId, inboxId } = this.credentials;

        const response = await fetch(
            `${baseUrl}/api/v1/accounts/${accountId}/contacts`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api_access_token': apiToken,
                },
                body: JSON.stringify({
                    inbox_id: inboxId,
                    name: phone,
                    phone_number: phone,
                }),
            }
        );

        if (!response.ok) {
            throw new Error('Failed to create Chatwoot contact');
        }

        const data = await response.json();
        return String(data.payload.contact.id);
    }

    /**
     * Helper: Find conversation for contact
     */
    private async findConversation(contactId: string, inboxId: string): Promise<string | null> {
        try {
            const { baseUrl, apiToken, accountId } = this.credentials;

            const response = await fetch(
                `${baseUrl}/api/v1/accounts/${accountId}/contacts/${contactId}/conversations`,
                {
                    headers: {
                        'api_access_token': apiToken,
                    },
                }
            );

            if (!response.ok) return null;

            const data = await response.json();

            // Find conversation in this inbox
            const conversation = data.payload?.find(
                (conv: any) => conv.inbox_id === parseInt(inboxId) && conv.status !== 'resolved'
            );

            return conversation ? String(conversation.id) : null;

        } catch (error) {
            console.error('[ChatwootProvider] Find conversation error:', error);
            return null;
        }
    }

    /**
     * Helper: Create new conversation
     */
    private async createConversation(contactId: string, inboxId: string): Promise<string> {
        const { baseUrl, apiToken, accountId } = this.credentials;

        const response = await fetch(
            `${baseUrl}/api/v1/accounts/${accountId}/conversations`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api_access_token': apiToken,
                },
                body: JSON.stringify({
                    inbox_id: inboxId,
                    contact_id: contactId,
                    status: 'open',
                }),
            }
        );

        if (!response.ok) {
            throw new Error('Failed to create Chatwoot conversation');
        }

        const data = await response.json();
        return String(data.id);
    }
}
