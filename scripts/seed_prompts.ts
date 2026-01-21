/**
 * Seed Default AI Prompts
 * 
 * Adds default platform-level prompts for AI message generation
 * Run with: npx tsx scripts/seed_prompts.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPrompts() {
    console.log('🌱 Seeding default AI prompts...\n');

    try {
        // Default conversation reply prompt
        await prisma.aiPrompt.createMany({
            data: [
                {
                    name: 'conversation_reply',
                    version: 'v1.0.0',
                    systemPrompt: `You are a professional real estate assistant for a UAE-based property agency. Your role is to help customers find their ideal property by providing helpful, accurate, and friendly information.

IMPORTANT RULES:
1. NEVER mention specific property prices or values
2. NEVER provide legal or financial advice
3. NEVER make absolute availability claims without agent confirmation
4. NEVER share personal data (emails, phone numbers)
5. ALWAYS maintain a professional tone
6. ALWAYS respond in clear, concise language
7. If asked about price, direct them to speak with an agent
8. If asked for legal/financial advice, recommend consulting a professional
9. Keep responses under 300 characters
10. Focus on gathering requirements and scheduling viewings

Your goal is to qualify leads and facilitate communication, not to close deals or provide expert advice.`,
                    userPromptTemplate: `Customer Name: {{leadName}}
Property Interest: {{propertyType}} in {{location}}
Budget: {{budget}}
Bedrooms: {{bedrooms}}

Recent Message:
{{lastMessage}}

Generate a helpful response that:
1. Addresses their latest message
2. Asks relevant qualifying questions
3. Suggests next steps (viewing, more info, etc.)
4. Is warm and professional

Response:`,
                    variables: [
                        'leadName',
                        'propertyType',
                        'location',
                        'budget',
                        'bedrooms',
                        'lastMessage',
                    ],
                    model: 'gpt-4-turbo',
                    temperature: 0.7,
                    maxTokens: 500,
                    isActive: true,
                    activatedAt: new Date(),
                    description: 'Default prompt for generating conversational replies to customer inquiries',
                },
                {
                    name: 'lead_qualification',
                    version: 'v1.0.0',
                    systemPrompt: `You are analyzing customer messages to qualify real estate leads. Extract key information and detect intent.`,
                    userPromptTemplate: `Message: {{lastMessage}}

Analyze and extract key requirements.`,
                    variables: ['lastMessage'],
                    model: 'gpt-3.5-turbo',
                    temperature: 0.3,
                    maxTokens: 300,
                    isActive: false,
                    description: 'Analyze and qualify leads based on message content',
                },
            ],
            skipDuplicates: true,
        });

        console.log('✅ Created default prompts');
        console.log('\n📊 Prompt Summary:');

        const prompts = await prisma.aiPrompt.findMany({
            where: { companyId: null },
            select: { name: true, version: true, isActive: true },
        });

        for (const prompt of prompts) {
            console.log(`   ${prompt.name} (${prompt.version}) - Active: ${prompt.isActive}`);
        }

        console.log('\n🎉 Prompt seeding completed!');

    } catch (error) {
        console.error('❌ Error seeding prompts:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

seedPrompts();
