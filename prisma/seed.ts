// Seed script for demo data
// Run with: npx prisma db seed

import { PrismaClient } from "@prisma/client"
import * as bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create demo company
  const company = await prisma.company.upsert({
    where: { id: "demo-company-1" },
    update: {},
    create: {
      id: "demo-company-1",
      name: "Elite Properties UAE",
      domain: "eliteproperties.ae",
      country: "UAE",
      city: "Dubai",
      whatsappBusinessNumber: "+971501234567",
      wabaProvider: "360dialog",
      wabaStatus: "WARMING_UP",
      bitrixDomain: "eliteproperties.bitrix24.com",
      warmupStage: 2,
    },
  })

  console.log("✅ Created company:", company.name)

  // Create admin user
  const adminPassword = await bcrypt.hash("Admin@123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@eliteproperties.ae" },
    update: {},
    create: {
      fullName: "Ahmed Al Mansouri",
      email: "admin@eliteproperties.ae",
      phone: "+971501234567",
      role: "COMPANY_ADMIN",
      passwordHash: adminPassword,
      companyId: company.id,
    },
  })

  console.log("✅ Created admin:", admin.email, "/ Password: Admin@123")

  // Create agent user
  const agentPassword = await bcrypt.hash("Agent@123", 10)
  const agent = await prisma.user.upsert({
    where: { email: "sarah@eliteproperties.ae" },
    update: {},
    create: {
      fullName: "Sarah Johnson",
      email: "sarah@eliteproperties.ae",
      phone: "+971507654321",
      role: "AGENT",
      passwordHash: agentPassword,
      companyId: company.id,
    },
  })

  console.log("✅ Created agent:", agent.email, "/ Password: Agent@123")

  // Create agent quota
  const resetAt = new Date()
  resetAt.setHours(24, 0, 0, 0) // Reset at midnight

  await prisma.agentQuota.upsert({
    where: { agentId: agent.id },
    update: {},
    create: {
      agentId: agent.id,
      companyId: company.id,
      dailyLimit: 50, // Week 2 limit
      messagesSentToday: 0,
      resetAt,
    },
  })

  console.log("✅ Created agent quota")

  // Create warm-up plans
  const warmupPlans = [
    { weekNumber: 1, maxMessagesPerDay: 20 },
    { weekNumber: 2, maxMessagesPerDay: 50, isActive: true },
    { weekNumber: 3, maxMessagesPerDay: 100 },
    { weekNumber: 4, maxMessagesPerDay: 1000 },
  ]

  for (const plan of warmupPlans) {
    await prisma.warmupPlan.create({
      data: {
        companyId: company.id,
        ...plan,
      },
    })
  }

  console.log("✅ Created warm-up plans")

  // Create demo lead
  const lead = await prisma.lead.create({
    data: {
      companyId: company.id,
      agentId: agent.id,
      name: "Mohammed Hassan",
      phone: "+971509876543",
      email: "mohammed@example.com",
      source: "WhatsApp",
      status: "HOT",
      tags: ["First Time Buyer", "Dubai Marina"],
      budget: "1.5M - 2M AED",
      propertyType: "Apartment",
      location: "Dubai Marina",
      bedrooms: 2,
    },
  })

  console.log("✅ Created demo lead:", lead.name)

  // Create demo conversation
  const conversation = await prisma.conversation.create({
    data: {
      companyId: company.id,
      leadId: lead.id,
      agentId: agent.id,
      whatsappNumber: lead.phone,
      status: "ACTIVE",
    },
  })

  // Create demo messages
  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation.id,
        direction: "INBOUND",
        contentType: "TEXT",
        body: "Hi, I am interested in 2-bedroom apartments in Dubai Marina",
        sentAt: new Date(Date.now() - 3600000), // 1 hour ago
      },
      {
        conversationId: conversation.id,
        senderId: agent.id,
        direction: "OUTBOUND",
        contentType: "TEXT",
        body: "Hello Mohammed! Thank you for reaching out. I have some excellent options in Dubai Marina. What is your budget range?",
        sentAt: new Date(Date.now() - 3000000), // 50 mins ago
        deliveredAt: new Date(Date.now() - 2990000),
        readAt: new Date(Date.now() - 2980000),
      },
      {
        conversationId: conversation.id,
        direction: "INBOUND",
        contentType: "TEXT",
        body: "Looking for something between 1.5M to 2M AED",
        sentAt: new Date(Date.now() - 2400000), // 40 mins ago
      },
    ],
  })

  console.log("✅ Created demo conversation with messages")

  // Create demo templates
  await prisma.template.createMany({
    data: [
      {
        companyId: company.id,
        metaTemplateName: "property_viewing_confirmation",
        displayName: "Property Viewing Confirmation",
        language: "en",
        category: "UTILITY",
        status: "APPROVED",
        bodyPreview: "Hi {{1}}, your property viewing is confirmed for {{2}} at {{3}}.",
      },
      {
        companyId: company.id,
        metaTemplateName: "new_listing_alert",
        displayName: "New Listing Alert",
        language: "en",
        category: "MARKETING",
        status: "APPROVED",
        bodyPreview: "New property just listed! {{1}} in {{2}}. Price: {{3}} AED. Interested?",
      },
    ],
  })

  console.log("✅ Created demo templates")

  console.log("🎉 Seeding completed successfully!")
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
