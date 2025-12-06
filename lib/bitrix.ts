import { db } from "@/lib/db"

// Define BitrixLead type directly in this file
export interface BitrixLead {
  TITLE: string
  NAME: string
  PHONE: Array<{ VALUE: string; VALUE_TYPE: string }>
  EMAIL?: Array<{ VALUE: string; VALUE_TYPE: string }>
  SOURCE_ID?: string
  STATUS_ID?: string
  COMMENTS?: string
}

/**
 * Bitrix24 REST API Client
 *
 * This module handles integration with Bitrix24 CRM:
 * - Creating leads from WhatsApp conversations
 * - Syncing lead status updates
 * - Handling webhook events from Bitrix24
 *
 * Bitrix24 REST API Documentation:
 * https://training.bitrix24.com/rest_help/
 *
 * Environment variables:
 * - Company-specific bitrixWebhookUrl stored in Company model
 */

/**
 * Create a lead in Bitrix24 from a Conversure lead/conversation
 */
export async function createBitrixLead(
  companyId: string,
  leadId: string,
): Promise<{ success: boolean; bitrixLeadId?: string; error?: string }> {
  try {
    const company = await db.company.findUnique({
      where: { id: companyId },
    })

    if (!company || !company.bitrixWebhookUrl) {
      return { success: false, error: "Bitrix24 not configured" }
    }

    const lead = await db.lead.findUnique({
      where: { id: leadId },
    })

    if (!lead) {
      return { success: false, error: "Lead not found" }
    }

    // Build Bitrix24 lead payload
    const bitrixPayload: BitrixLead = {
      TITLE: `WhatsApp Lead: ${lead.name}`,
      NAME: lead.name,
      PHONE: [{ VALUE: lead.phone, VALUE_TYPE: "MOBILE" }],
      SOURCE_ID: "WEBFORM", // You can customize this or add WhatsApp as a custom source
      STATUS_ID: "NEW",
      COMMENTS: `Lead from WhatsApp. Phone: ${lead.phone}`,
    }

    if (lead.email) {
      bitrixPayload.EMAIL = [{ VALUE: lead.email, VALUE_TYPE: "WORK" }]
    }

    // Add real estate specific fields if available
    if (lead.budget || lead.propertyType || lead.location) {
      bitrixPayload.COMMENTS += `\n\nProperty Interest:\n`
      if (lead.budget) bitrixPayload.COMMENTS += `Budget: ${lead.budget}\n`
      if (lead.propertyType) bitrixPayload.COMMENTS += `Type: ${lead.propertyType}\n`
      if (lead.location) bitrixPayload.COMMENTS += `Location: ${lead.location}\n`
      if (lead.bedrooms) bitrixPayload.COMMENTS += `Bedrooms: ${lead.bedrooms}\n`
    }

    // Call Bitrix24 REST API
    const url = `${company.bitrixWebhookUrl}/crm.lead.add.json`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: bitrixPayload,
        params: { REGISTER_SONET_EVENT: "Y" },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error_description || `Bitrix API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.result) {
      throw new Error("No lead ID returned from Bitrix24")
    }

    const bitrixLeadId = String(data.result)

    // Update lead with Bitrix ID
    await db.lead.update({
      where: { id: leadId },
      data: { bitrixLeadId },
    })

    // Log sync
    await db.bitrixSyncLog.create({
      data: {
        companyId,
        leadId,
        direction: "TO_BITRIX",
        action: "create",
        status: "SUCCESS",
        message: `Lead created in Bitrix24: ${bitrixLeadId}`,
        payload: { request: bitrixPayload, response: data },
      },
    })

    return { success: true, bitrixLeadId }
  } catch (error: any) {
    console.error("[Bitrix] Create lead error:", error)

    // Log failed sync
    await db.bitrixSyncLog.create({
      data: {
        companyId,
        leadId,
        direction: "TO_BITRIX",
        action: "create",
        status: "FAILED",
        message: error.message,
      },
    })

    return { success: false, error: error.message }
  }
}

/**
 * Update lead status in Bitrix24
 */
export async function updateBitrixLeadStatus(
  companyId: string,
  leadId: string,
  statusId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const company = await db.company.findUnique({
      where: { id: companyId },
    })

    if (!company || !company.bitrixWebhookUrl) {
      return { success: false, error: "Bitrix24 not configured" }
    }

    const lead = await db.lead.findUnique({
      where: { id: leadId },
    })

    if (!lead || !lead.bitrixLeadId) {
      return { success: false, error: "Lead not synced with Bitrix24" }
    }

    const url = `${company.bitrixWebhookUrl}/crm.lead.update.json`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: lead.bitrixLeadId,
        fields: {
          STATUS_ID: statusId,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error_description || `Bitrix API error: ${response.status}`)
    }

    await db.bitrixSyncLog.create({
      data: {
        companyId,
        leadId,
        direction: "TO_BITRIX",
        action: "update",
        status: "SUCCESS",
        message: `Lead status updated to ${statusId}`,
      },
    })

    return { success: true }
  } catch (error: any) {
    console.error("[Bitrix] Update status error:", error)

    await db.bitrixSyncLog.create({
      data: {
        companyId,
        leadId,
        direction: "TO_BITRIX",
        action: "update",
        status: "FAILED",
        message: error.message,
      },
    })

    return { success: false, error: error.message }
  }
}

/**
 * Get lead details from Bitrix24
 */
export async function getBitrixLead(
  companyId: string,
  bitrixLeadId: string,
): Promise<{ success: boolean; lead?: any; error?: string }> {
  try {
    const company = await db.company.findUnique({
      where: { id: companyId },
    })

    if (!company || !company.bitrixWebhookUrl) {
      return { success: false, error: "Bitrix24 not configured" }
    }

    const url = `${company.bitrixWebhookUrl}/crm.lead.get.json?id=${bitrixLeadId}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Bitrix API error: ${response.status}`)
    }

    const data = await response.json()

    return { success: true, lead: data.result }
  } catch (error: any) {
    console.error("[Bitrix] Get lead error:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Process webhook event from Bitrix24
 */
export async function processBitrixWebhook(
  companyId: string,
  event: string,
  data: any,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[Bitrix Webhook] Processing:", event, data)

    switch (event) {
      case "ONCRMLEADADD":
        return await handleLeadAdd(companyId, data)

      case "ONCRMLEADUPDATE":
        return await handleLeadUpdate(companyId, data)

      case "ONCRMDEALUPDATE":
        return await handleDealUpdate(companyId, data)

      default:
        console.log("[Bitrix Webhook] Unhandled event:", event)
        return { success: true } // Acknowledge unknown events
    }
  } catch (error: any) {
    console.error("[Bitrix Webhook] Process error:", error)
    return { success: false, error: error.message }
  }
}

async function handleLeadAdd(companyId: string, data: any) {
  const bitrixLeadId = String(data.data?.FIELDS?.ID || data.FIELDS?.ID)

  if (!bitrixLeadId) {
    return { success: false, error: "No lead ID in webhook" }
  }

  // Check if we already have this lead
  const existingLead = await db.lead.findUnique({
    where: { bitrixLeadId },
  })

  if (existingLead) {
    return { success: true } // Already synced
  }

  // Fetch full lead details from Bitrix
  const leadResult = await getBitrixLead(companyId, bitrixLeadId)

  if (!leadResult.success || !leadResult.lead) {
    return { success: false, error: "Could not fetch lead from Bitrix" }
  }

  const bitrixLead = leadResult.lead

  // Create lead in Conversure
  const phone = bitrixLead.PHONE?.[0]?.VALUE
  const email = bitrixLead.EMAIL?.[0]?.VALUE

  if (!phone) {
    return { success: false, error: "Lead has no phone number" }
  }

  await db.lead.create({
    data: {
      companyId,
      name: bitrixLead.NAME || bitrixLead.TITLE || "Unknown",
      phone,
      email,
      source: "Bitrix24",
      status: "NEW",
      bitrixLeadId,
    },
  })

  await db.bitrixSyncLog.create({
    data: {
      companyId,
      direction: "FROM_BITRIX",
      action: "create",
      status: "SUCCESS",
      message: `Lead imported from Bitrix24: ${bitrixLeadId}`,
    },
  })

  return { success: true }
}

async function handleLeadUpdate(companyId: string, data: any) {
  const bitrixLeadId = String(data.data?.FIELDS?.ID || data.FIELDS?.ID)

  if (!bitrixLeadId) {
    return { success: true }
  }

  const lead = await db.lead.findUnique({
    where: { bitrixLeadId },
  })

  if (!lead) {
    return { success: true } // Not our lead, ignore
  }

  // Fetch updated lead data
  const leadResult = await getBitrixLead(companyId, bitrixLeadId)

  if (leadResult.success && leadResult.lead) {
    const bitrixLead = leadResult.lead

    await db.lead.update({
      where: { id: lead.id },
      data: {
        name: bitrixLead.NAME || lead.name,
        email: bitrixLead.EMAIL?.[0]?.VALUE || lead.email,
      },
    })

    await db.bitrixSyncLog.create({
      data: {
        companyId,
        leadId: lead.id,
        direction: "FROM_BITRIX",
        action: "update",
        status: "SUCCESS",
        message: "Lead updated from Bitrix24",
      },
    })
  }

  return { success: true }
}

async function handleDealUpdate(companyId: string, data: any) {
  const dealId = String(data.data?.FIELDS?.ID || data.FIELDS?.ID)
  const stageId = String(data.data?.FIELDS?.STAGE_ID || data.FIELDS?.STAGE_ID)

  if (!dealId || !stageId) {
    return { success: true }
  }

  const feedbackTriggerStages = ["WON", "LOST", "C7:WON", "C7:LOST", "VIEWING_DONE", "VIEWING_COMPLETED"]

  const shouldTriggerFeedback = feedbackTriggerStages.some((stage) => stageId.includes(stage))

  if (shouldTriggerFeedback) {
    await triggerFeedbackRequest(companyId, dealId, data)
  }

  return { success: true }
}

async function triggerFeedbackRequest(companyId: string, dealId: string, dealData: any) {
  try {
    const lead = await db.lead.findFirst({
      where: {
        companyId,
        bitrixDealId: dealId,
      },
      include: {
        agent: true,
        conversations: {
          where: { status: "ACTIVE" },
          orderBy: { lastMessageAt: "desc" },
          take: 1,
        },
      },
    })

    if (!lead || !lead.agent || !lead.conversations[0]) {
      console.log("[v0] Cannot trigger feedback: missing lead, agent, or conversation")
      return
    }

    const existingFeedback = await db.feedback.findFirst({
      where: {
        companyId,
        leadId: lead.id,
        agentId: lead.agentId!,
        requestedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    })

    if (existingFeedback) {
      console.log("[v0] Feedback already requested recently for this lead")
      return
    }

    const feedback = await db.feedback.create({
      data: {
        companyId,
        leadId: lead.id,
        agentId: lead.agentId!,
        rating: 0,
        source: "whatsapp",
        requestedAt: new Date(),
      },
    })

    const feedbackMessage = `Hi ${lead.name}, thank you for viewing the property with ${lead.agent.fullName} from ${companyId}. On a scale of 1–5, how would you rate your experience? (1 = Poor, 5 = Excellent). You can also share any comments.`

    const { sendWhatsAppMessage } = await import("@/lib/whatsapp")

    await sendWhatsAppMessage({
      to: lead.phone,
      body: feedbackMessage,
      companyId,
      templateId: "feedback_after_viewing",
    })

    console.log(`[v0] Feedback request sent to ${lead.phone} for agent ${lead.agent.fullName}`)
  } catch (error) {
    console.error("[v0] Error triggering feedback request:", error)
  }
}
