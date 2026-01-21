
import { db } from "@/lib/db"
import { sendWhatsAppMessage } from "@/lib/whatsapp"

async function main() {
    console.log("🚀 Starting send-test-message script...")

    try {
        // 1. Find a company with a WhatsApp number
        const company = await db.company.findFirst({
            where: {
                whatsappBusinessNumber: { not: null }
            }
        })

        if (!company || !company.whatsappBusinessNumber) {
            console.error("❌ No company found with a WhatsApp business number.")
            process.exit(1)
        }

        console.log(`✅ Found company: ${company.name} (${company.id})`)
        console.log(`📱 From: ${company.whatsappBusinessNumber}`)

        // 2. Define message details
        const to = "+971501191723"
        const body = "Name Abdallah Emam interested to 2 Bedroom in Damc , Dubai"

        console.log(`📤 Sending message to: ${to}`)
        console.log(`📝 Body: "${body}"`)

        // 3. Send message
        const result = await sendWhatsAppMessage({
            to,
            from: company.whatsappBusinessNumber,
            body,
            companyId: company.id,
            provider: company.wabaProvider || "meta"
        })

        if (result.success) {
            console.log("✅ Message sent successfully!")
            if (result.messageId) console.log(`🆔 Message ID: ${result.messageId}`)
        } else {
            console.error("❌ Failed to send message:", result.error)
        }

    } catch (error) {
        console.error("❌ Script error:", error)
    } finally {
        await db.$disconnect()
    }
}

main()
