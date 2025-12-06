import OpenAI from "openai"
import { GoogleGenerativeAI } from "@google/generative-ai"

export type AiProviderType = "OPENAI" | "GEMINI"

interface AiClient {
  complete(prompt: string, options?: AiCompletionOptions): Promise<string>
  chat(messages: AiMessage[], options?: AiCompletionOptions): Promise<string>
}

interface AiMessage {
  role: "system" | "user" | "assistant"
  content: string
}

interface AiCompletionOptions {
  temperature?: number
  maxTokens?: number
  model?: string
}

export function getAiClient(provider: AiProviderType): AiClient {
  if (provider === "GEMINI") {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set")
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const defaultModel = process.env.GEMINI_MODEL || "gemini-1.5-pro"

    return {
      async complete(prompt: string, options?: AiCompletionOptions) {
        const model = genAI.getGenerativeModel({
          model: options?.model || defaultModel,
        })

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options?.temperature,
            maxOutputTokens: options?.maxTokens,
          },
        })

        return result.response.text()
      },

      async chat(messages: AiMessage[], options?: AiCompletionOptions) {
        const model = genAI.getGenerativeModel({
          model: options?.model || defaultModel,
        })

        const contents = messages.map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        }))

        const result = await model.generateContent({
          contents,
          generationConfig: {
            temperature: options?.temperature,
            maxOutputTokens: options?.maxTokens,
          },
        })

        return result.response.text()
      },
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set")
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const defaultModel = process.env.OPENAI_MODEL || "gpt-4-turbo"

  return {
    async complete(prompt: string, options?: AiCompletionOptions) {
      const response = await client.chat.completions.create({
        model: options?.model || defaultModel,
        messages: [{ role: "user", content: prompt }],
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
      })

      return response.choices[0]?.message?.content || ""
    },

    async chat(messages: AiMessage[], options?: AiCompletionOptions) {
      const response = await client.chat.completions.create({
        model: options?.model || defaultModel,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
      })

      return response.choices[0]?.message?.content || ""
    },
  }
}

export async function generateWhatsAppReply(
  provider: AiProviderType,
  conversationHistory: string,
  leadContext: string,
  tone?: string,
): Promise<string[]> {
  const aiClient = getAiClient(provider)

  const toneInstruction = tone ? `Use a ${tone} tone.` : ""

  const prompt = `You are a real estate agent assistant in the UAE. Based on the conversation history and lead context, generate 3 different professional WhatsApp reply options.

${toneInstruction}

Lead Context:
${leadContext}

Conversation History:
${conversationHistory}

Generate 3 reply options (each 1-2 sentences max, suitable for WhatsApp):
1. [Reply option 1]
2. [Reply option 2]
3. [Reply option 3]`

  const response = await aiClient.complete(prompt, { temperature: 0.7 })

  const replies = response
    .split("\n")
    .filter((line) => line.match(/^\d+\./))
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter((line) => line.length > 0)

  return replies.length > 0 ? replies : ["Thank you for your message. I'll get back to you shortly."]
}

export async function summarizeConversation(
  provider: AiProviderType,
  messages: Array<{ sender: string; body: string; timestamp: Date }>,
): Promise<string> {
  const aiClient = getAiClient(provider)

  const conversationText = messages
    .map((msg) => `[${msg.timestamp.toISOString()}] ${msg.sender}: ${msg.body}`)
    .join("\n")

  const prompt = `Summarize this WhatsApp conversation between a real estate agent and a lead in 2-3 sentences. Focus on the lead's needs, property interests, and next steps.

Conversation:
${conversationText}

Summary:`

  return await aiClient.complete(prompt, { temperature: 0.5, maxTokens: 200 })
}

export async function analyzeFeedbackText(
  provider: AiProviderType,
  feedbackComment: string,
  rating: number,
): Promise<{
  sentiment: "positive" | "negative" | "neutral"
  themes: string[]
  summary: string
}> {
  const aiClient = getAiClient(provider)

  const prompt = `Analyze this customer feedback about a real estate agent experience (rating: ${rating}/5).

Feedback: "${feedbackComment}"

Provide analysis in JSON format:
{
  "sentiment": "positive|negative|neutral",
  "themes": ["theme1", "theme2"],
  "summary": "brief summary"
}

Focus on themes like: follow-up speed, property knowledge, communication quality, professionalism, responsiveness.`

  const response = await aiClient.complete(prompt, { temperature: 0.3, maxTokens: 300 })

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        sentiment: parsed.sentiment || "neutral",
        themes: Array.isArray(parsed.themes) ? parsed.themes : [],
        summary: parsed.summary || feedbackComment.substring(0, 100),
      }
    }
  } catch (e) {
    console.error("[v0] Failed to parse AI feedback analysis:", e)
  }

  return {
    sentiment: rating >= 4 ? "positive" : rating <= 2 ? "negative" : "neutral",
    themes: [],
    summary: feedbackComment.substring(0, 100),
  }
}

export async function analyzeContactDataset(
  provider: AiProviderType,
  contacts: Array<{ name?: string; phone: string; tags: string[]; language?: string }>,
): Promise<{
  insights: string
  suggestedSegments: Array<{ name: string; criteria: string }>
}> {
  const aiClient = getAiClient(provider)

  const sampleContacts = contacts.slice(0, 50)
  const allTags = Array.from(new Set(sampleContacts.flatMap((c) => c.tags)))
  const languages = Array.from(new Set(sampleContacts.map((c) => c.language).filter(Boolean)))

  const prompt = `Analyze this UAE real estate contact dataset (${contacts.length} total contacts, showing sample):

Languages: ${languages.join(", ") || "Not specified"}
Tags: ${allTags.join(", ") || "No tags"}

Sample contacts:
${sampleContacts
  .slice(0, 10)
  .map((c) => `- ${c.name || "Unknown"} (${c.phone}): ${c.tags.join(", ")}`)
  .join("\n")}

Provide analysis in JSON format:
{
  "insights": "2-3 sentence summary of the dataset characteristics",
  "suggestedSegments": [
    { "name": "segment name", "criteria": "description of who belongs here" }
  ]
}

Suggest 2-3 useful segments based on common patterns (location, buyer type, language, etc.).`

  const response = await aiClient.complete(prompt, { temperature: 0.5, maxTokens: 500 })

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        insights: parsed.insights || "Dataset analyzed successfully.",
        suggestedSegments: Array.isArray(parsed.suggestedSegments) ? parsed.suggestedSegments : [],
      }
    }
  } catch (e) {
    console.error("[v0] Failed to parse AI dataset analysis:", e)
  }

  return {
    insights: `Analyzed ${contacts.length} contacts with ${allTags.length} unique tags.`,
    suggestedSegments: [],
  }
}

export async function generateCampaignMessage(
  provider: AiProviderType,
  campaignGoal: string,
  targetAudience: string,
  tone?: string,
  language?: string,
): Promise<string> {
  const aiClient = getAiClient(provider)

  const toneInstruction = tone ? `Use a ${tone} tone.` : "Use a professional, friendly tone."
  const languageInstruction = language === "ar" ? "Write in Arabic." : "Write in English."

  const prompt = `Create a WhatsApp message for a real estate marketing campaign in the UAE.

Campaign Goal: ${campaignGoal}
Target Audience: ${targetAudience}
${toneInstruction}
${languageInstruction}

Requirements:
- Keep it under 160 characters (1 SMS length)
- Include a clear call-to-action
- Be conversational and WhatsApp-appropriate
- No emojis unless culturally appropriate

Message:`

  return await aiClient.complete(prompt, { temperature: 0.7, maxTokens: 150 })
}
