import { db } from "@/lib/db"

export type WhatsappProviderKind = "WABA" | "CHATWOOT" | "EVOLUTION"

export interface SendMessageArgs {
  to: string
  from: string
  body?: string
  templateName?: string
  templateParams?: Record<string, string>
  mediaUrl?: string
}

export interface SendMessageResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface MarkAsReadArgs {
  messageId: string
}

export interface WhatsappProviderClient {
  sendTextMessage(args: SendMessageArgs): Promise<SendMessageResult>
  sendTemplateMessage?(args: SendMessageArgs): Promise<SendMessageResult>
  markAsRead?(args: MarkAsReadArgs): Promise<void>
}

interface CompanySettings {
  whatsappProvider: WhatsappProviderKind
  chatwootBaseUrl?: string | null
  chatwootApiToken?: string | null
  chatwootAccountId?: string | null
  chatwootInboxId?: string | null
  evolutionBaseUrl?: string | null
  evolutionInstanceId?: string | null
  evolutionApiToken?: string | null
}

export async function getCompanySettings(companyId: string): Promise<CompanySettings> {
  const settings = await db.companySettings.findUnique({
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
  })

  if (!settings) {
    return {
      whatsappProvider: "WABA",
      chatwootBaseUrl: null,
      chatwootApiToken: null,
      chatwootAccountId: null,
      chatwootInboxId: null,
      evolutionBaseUrl: null,
      evolutionInstanceId: null,
      evolutionApiToken: null,
    }
  }

  return {
    whatsappProvider: settings.whatsappProvider as WhatsappProviderKind,
    chatwootBaseUrl: settings.chatwootBaseUrl,
    chatwootApiToken: settings.chatwootApiToken,
    chatwootAccountId: settings.chatwootAccountId,
    chatwootInboxId: settings.chatwootInboxId,
    evolutionBaseUrl: settings.evolutionBaseUrl,
    evolutionInstanceId: settings.evolutionInstanceId,
    evolutionApiToken: settings.evolutionApiToken,
  }
}

export function createWabaClient(settings: CompanySettings): WhatsappProviderClient {
  const apiUrl = process.env.WHATSAPP_PROVIDER_API_URL || process.env.WHATSAPP_API_URL
  const apiKey = process.env.WHATSAPP_PROVIDER_API_KEY || process.env.WHATSAPP_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error("WABA credentials not configured in environment")
  }

  return {
    async sendTextMessage(args: SendMessageArgs): Promise<SendMessageResult> {
      try {
        const payload = {
          messaging_product: "whatsapp",
          to: args.to.replace(/\+/g, ""),
          type: "text",
          text: { body: args.body },
        }

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `WABA API error: ${response.status}`)
        }

        const data = await response.json()
        const messageId = data.messages?.[0]?.id

        return { success: true, messageId }
      } catch (error: any) {
        console.error("[WABA] Send error:", error)
        return { success: false, error: error.message }
      }
    },

    async sendTemplateMessage(args: SendMessageArgs): Promise<SendMessageResult> {
      try {
        const payload = {
          messaging_product: "whatsapp",
          to: args.to.replace(/\+/g, ""),
          type: "template",
          template: {
            name: args.templateName,
            language: { code: "en" },
          },
        }

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `WABA API error: ${response.status}`)
        }

        const data = await response.json()
        const messageId = data.messages?.[0]?.id

        return { success: true, messageId }
      } catch (error: any) {
        console.error("[WABA] Template send error:", error)
        return { success: false, error: error.message }
      }
    },
  }
}

export function createChatwootClient(settings: CompanySettings): WhatsappProviderClient {
  const baseUrl = settings.chatwootBaseUrl || process.env.CHATWOOT_DEFAULT_BASE_URL
  const apiToken = settings.chatwootApiToken || process.env.CHATWOOT_DEFAULT_API_TOKEN
  const accountId = settings.chatwootAccountId || process.env.CHATWOOT_DEFAULT_ACCOUNT_ID
  const inboxId = settings.chatwootInboxId || process.env.CHATWOOT_DEFAULT_INBOX_ID

  if (!baseUrl || !apiToken || !accountId || !inboxId) {
    throw new Error("Chatwoot credentials not configured")
  }

  return {
    async sendTextMessage(args: SendMessageArgs): Promise<SendMessageResult> {
      try {
        const phone = args.to.replace(/\+/g, "")

        let conversationId = null

        const contactsResponse = await fetch(`${baseUrl}/api/v1/accounts/${accountId}/contacts/search?q=${phone}`, {
          headers: {
            "Content-Type": "application/json",
            api_access_token: apiToken,
          },
        })

        if (contactsResponse.ok) {
          const contactsData = await contactsResponse.json()
          if (contactsData.payload && contactsData.payload.length > 0) {
            const contact = contactsData.payload[0]

            const convsResponse = await fetch(
              `${baseUrl}/api/v1/accounts/${accountId}/contacts/${contact.id}/conversations`,
              {
                headers: {
                  "Content-Type": "application/json",
                  api_access_token: apiToken,
                },
              },
            )

            if (convsResponse.ok) {
              const convsData = await convsResponse.json()
              const whatsappConv = convsData.payload?.find((conv: any) => conv.inbox_id === Number.parseInt(inboxId))
              if (whatsappConv) {
                conversationId = whatsappConv.id
              }
            }
          }
        }

        if (!conversationId) {
          const createConvResponse = await fetch(`${baseUrl}/api/v1/accounts/${accountId}/conversations`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              api_access_token: apiToken,
            },
            body: JSON.stringify({
              inbox_id: inboxId,
              contact_id: phone,
              source_id: phone,
            }),
          })

          if (!createConvResponse.ok) {
            throw new Error("Failed to create Chatwoot conversation")
          }

          const convData = await createConvResponse.json()
          conversationId = convData.id
        }

        const response = await fetch(
          `${baseUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              api_access_token: apiToken,
            },
            body: JSON.stringify({
              content: args.body,
              message_type: "outgoing",
              private: false,
            }),
          },
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Chatwoot API error: ${response.status}`)
        }

        const data = await response.json()
        const messageId = String(data.id)

        return { success: true, messageId }
      } catch (error: any) {
        console.error("[Chatwoot] Send error:", error)
        return { success: false, error: error.message }
      }
    },
  }
}

export function createEvolutionClient(settings: CompanySettings): WhatsappProviderClient {
  const baseUrl = settings.evolutionBaseUrl || process.env.EVOLUTION_DEFAULT_BASE_URL
  const instanceId = settings.evolutionInstanceId || process.env.EVOLUTION_DEFAULT_INSTANCE_ID
  const apiToken = settings.evolutionApiToken || process.env.EVOLUTION_DEFAULT_API_TOKEN

  if (!baseUrl || !instanceId || !apiToken) {
    throw new Error("Evolution API credentials not configured")
  }

  return {
    async sendTextMessage(args: SendMessageArgs): Promise<SendMessageResult> {
      try {
        const phone = args.to.replace(/\+/g, "")
        const remoteJid = phone.includes("@") ? phone : `${phone}@s.whatsapp.net`

        const response = await fetch(`${baseUrl}/message/sendText/${instanceId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: apiToken,
          },
          body: JSON.stringify({
            number: remoteJid,
            text: args.body,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Evolution API error: ${response.status}`)
        }

        const data = await response.json()
        const messageId = data.key?.id || data.messageId || String(Date.now())

        return { success: true, messageId }
      } catch (error: any) {
        console.error("[Evolution] Send error:", error)
        return { success: false, error: error.message }
      }
    },
  }
}

export async function getWhatsappClientForCompany(companyId: string): Promise<WhatsappProviderClient> {
  const settings = await getCompanySettings(companyId)

  switch (settings.whatsappProvider) {
    case "CHATWOOT":
      return createChatwootClient(settings)
    case "EVOLUTION":
      return createEvolutionClient(settings)
    default:
      return createWabaClient(settings)
  }
}
