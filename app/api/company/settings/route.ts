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
      aiProvider,
      aiTone,
      aiLanguages,
      aiEnabled,
      whatsappProvider,
      chatwootBaseUrl,
      chatwootApiToken,
      chatwootAccountId,
      chatwootInboxId,
      evolutionBaseUrl,
      evolutionInstanceId,
      evolutionApiToken,
    } = body

    if (aiProvider || aiTone || aiLanguages || aiEnabled !== undefined) {
      await db.company.update({
        where: { id: session.companyId },
        data: {
          aiProvider: aiProvider || undefined,
          aiTone: aiTone || undefined,
          aiLanguages: aiLanguages || undefined,
          aiEnabled: aiEnabled !== undefined ? aiEnabled : undefined,
        },
      })
    }

    if (
      whatsappProvider ||
      chatwootBaseUrl ||
      chatwootApiToken ||
      chatwootAccountId ||
      chatwootInboxId ||
      evolutionBaseUrl ||
      evolutionInstanceId ||
      evolutionApiToken
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
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Settings update error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
