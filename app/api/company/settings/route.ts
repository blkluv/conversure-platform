import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getCurrentUser()

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const company = await db.company.findUnique({
      where: { id: session.companyId },
      select: {
        aiProvider: true,
        aiTone: true,
        aiLanguages: true,
        aiEnabled: true,
        plan: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
      },
    })

    if (!company) {
      return new NextResponse("Company not found", { status: 404 })
    }

    const whatsappSettings = await db.companySettings.findUnique({
      where: { companyId: session.companyId },
      select: {
        whatsappProvider: true,
        chatwootBaseUrl: true,
        chatwootAccountId: true,
        chatwootInboxId: true,
        evolutionBaseUrl: true,
        evolutionInstanceId: true,
      },
    })

    return NextResponse.json({
      ...company,
      whatsappProvider: whatsappSettings?.whatsappProvider || "WABA",
      chatwootBaseUrl: whatsappSettings?.chatwootBaseUrl,
      chatwootAccountId: whatsappSettings?.chatwootAccountId,
      chatwootInboxId: whatsappSettings?.chatwootInboxId,
      evolutionBaseUrl: whatsappSettings?.evolutionBaseUrl,
      evolutionInstanceId: whatsappSettings?.evolutionInstanceId,
    })
  } catch (error) {
    console.error("[v0] Settings fetch error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getCurrentUser()

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const {
      // Company profile fields
      name,
      domain,
      city,
      whatsappBusinessNumber,
      wabaProvider,
      bitrixDomain,
      bitrixWebhookUrl,
      // AI fields
      aiProvider,
      aiTone,
      aiLanguages,
      aiEnabled,
      // WhatsApp provider fields
      whatsappProvider,
      chatwootBaseUrl,
      chatwootApiToken,
      chatwootAccountId,
      chatwootInboxId,
      evolutionBaseUrl,
      evolutionInstanceId,
      evolutionApiToken,
      // Automation mode
      messageGenerationMode,
    } = body

    // Update Company table fields
    const companyUpdates: any = {}
    if (name !== undefined) companyUpdates.name = name
    if (domain !== undefined) companyUpdates.domain = domain
    if (city !== undefined) companyUpdates.city = city
    if (whatsappBusinessNumber !== undefined) companyUpdates.whatsappBusinessNumber = whatsappBusinessNumber
    if (wabaProvider !== undefined) companyUpdates.wabaProvider = wabaProvider
    if (bitrixDomain !== undefined) companyUpdates.bitrixDomain = bitrixDomain
    if (bitrixWebhookUrl !== undefined) companyUpdates.bitrixWebhookUrl = bitrixWebhookUrl
    if (aiProvider !== undefined) companyUpdates.aiProvider = aiProvider
    if (aiTone !== undefined) companyUpdates.aiTone = aiTone
    if (aiLanguages !== undefined) companyUpdates.aiLanguages = aiLanguages
    if (aiEnabled !== undefined) companyUpdates.aiEnabled = aiEnabled

    if (Object.keys(companyUpdates).length > 0) {
      await db.company.update({
        where: { id: session.companyId },
        data: companyUpdates,
      })
    }

    // Update CompanySettings table fields
    if (
      whatsappProvider ||
      chatwootBaseUrl ||
      chatwootApiToken ||
      chatwootAccountId ||
      chatwootInboxId ||
      evolutionBaseUrl ||
      evolutionInstanceId ||
      evolutionApiToken ||
      messageGenerationMode
    ) {
      await db.companySettings.upsert({
        where: { companyId: session.companyId },
        create: {
          companyId: session.companyId,
          whatsappProvider: whatsappProvider || "WABA",
          chatwootBaseUrl,
          chatwootApiToken,
          chatwootAccountId,
          chatwootInboxId,
          evolutionBaseUrl,
          evolutionInstanceId,
          evolutionApiToken,
          messageGenerationMode: messageGenerationMode || "MANUAL_COPILOT",
        },
        update: {
          whatsappProvider: whatsappProvider || undefined,
          chatwootBaseUrl: chatwootBaseUrl !== undefined ? chatwootBaseUrl : undefined,
          chatwootApiToken: chatwootApiToken !== undefined ? chatwootApiToken : undefined,
          chatwootAccountId: chatwootAccountId !== undefined ? chatwootAccountId : undefined,
          chatwootInboxId: chatwootInboxId !== undefined ? chatwootInboxId : undefined,
          evolutionBaseUrl: evolutionBaseUrl !== undefined ? evolutionBaseUrl : undefined,
          evolutionInstanceId: evolutionInstanceId !== undefined ? evolutionInstanceId : undefined,
          evolutionApiToken: evolutionApiToken !== undefined ? evolutionApiToken : undefined,
          messageGenerationMode: messageGenerationMode !== undefined ? messageGenerationMode : undefined,
        },
      })
    }

    return NextResponse.json({ success: true, message: "Settings updated successfully" })
  } catch (error) {
    console.error("[Settings API] Update error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// PUT is an alias to PATCH for consistency
export const PUT = PATCH
