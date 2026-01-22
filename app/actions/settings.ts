/**
 * Settings & Configuration Server Actions
 * 
 * Company settings, working hours, webhooks, notifications
 * Consolidated from multiple Rails controllers
 */

'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

/**
 * Get company settings
 */
export async function getCompanySettings() {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const company = await db.company.findUnique({
      where: { id: user.companyId },
      include: {
        companySettings: true
      }
    })

    return { success: true, data: company }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Update company settings
 */
export async function updateCompanySettings(data: {
  name?: string
  domain?: string
  city?: string
  aiTone?: string
  aiLanguages?: string
  aiEnabled?: boolean
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'COMPANY_ADMIN') {
      throw new Error('Unauthorized: Company admin access required')
    }

    const updated = await db.company.update({
      where: { id: user.companyId },
      data
    })

    revalidatePath('/settings')

    return { success: true, data: updated }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Update automation settings (CompanySettings)
 */
export async function updateAutomationSettings(data: {
  messageGenerationMode?: 'AI_PILOT' | 'MANUAL_COPILOT'
  aiEnabled?: boolean
  aiTone?: string
  aiLanguages?: string[]
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'COMPANY_ADMIN') {
      throw new Error('Unauthorized: Company admin access required')
    }

    const updated = await db.companySettings.upsert({
      where: { companyId: user.companyId },
      create: {
        companyId: user.companyId,
        messageGenerationMode: data.messageGenerationMode || 'MANUAL_COPILOT',
        aiEnabled: data.aiEnabled ?? true,
        aiTone: data.aiTone || 'professional',
        aiLanguages: data.aiLanguages || ['en', 'ar']
      },
      update: {
        ...(data.messageGenerationMode && { messageGenerationMode: data.messageGenerationMode }),
        ...(data.aiEnabled !== undefined && { aiEnabled: data.aiEnabled }),
        ...(data.aiTone && { aiTone: data.aiTone }),
        ...(data.aiLanguages && { aiLanguages: data.aiLanguages })
      }
    })

    revalidatePath('/settings')
    return { success: true, data: updated }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
