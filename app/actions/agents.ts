/**
 * Agent Management Server Actions
 * 
 * CRUD operations for managing agents (team members)
 * Ported from Rails Api::V1::Accounts::AgentsController
 */

'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { hashPassword } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createAgentSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    role: z.enum(['AGENT', 'COMPANY_ADMIN']).default('AGENT'),
    sendInviteEmail: z.boolean().default(true)
})

const updateAgentSchema = z.object({
    id: z.string(),
    fullName: z.string().min(2).optional(),
    phone: z.string().optional(),
    isActive: z.boolean().optional()
})

export type CreateAgentInput = z.infer<typeof createAgentSchema>
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>

/**
 * Get all agents for the current company
 */
export async function getAgents() {
    try {
        const user = await getCurrentUser()

        if (!user) {
            throw new Error('Unauthorized')
        }

        const agents = await db.user.findMany({
            where: {
                companyId: user.companyId
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                createdAt: true
            },
            orderBy: {
                fullName: 'asc'
            }
        })

        return { success: true, data: agents }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Create a new agent
 */
export async function createAgent(data: CreateAgentInput) {
    try {
        const user = await getCurrentUser()

        if (!user || user.role === 'AGENT') {
            throw new Error('Unauthorized: Only admins can create agents')
        }

        // Validate input
        const validated = createAgentSchema.parse(data)

        // Check if email already exists
        const existingUser = await db.user.findUnique({
            where: { email: validated.email }
        })

        if (existingUser) {
            throw new Error('Email already in use')
        }

        // Check company seat limit
        const company = await db.company.findUnique({
            where: { id: user.companyId },
            include: {
                _count: {
                    select: { users: true }
                }
            }
        })

        if (!company) {
            throw new Error('Company not found')
        }

        if (company._count.users >= company.seats) {
            throw new Error('Company seat limit reached. Please upgrade your plan.')
        }

        // Generate temporary password
        const tempPassword = generateTemporaryPassword()
        const passwordHash = await hashPassword(tempPassword)

        // Create agent
        const agent = await db.user.create({
            data: {
                fullName: validated.fullName,
                email: validated.email,
                phone: validated.phone,
                role: validated.role,
                passwordHash,
                companyId: user.companyId,
                isActive: true
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                createdAt: true
            }
        })

        // TODO: Send invitation email with temp password
        if (validated.sendInviteEmail) {
            console.log(`[Agent] TODO: Send invite email to ${agent.email} with password: ${tempPassword}`)
        }

        revalidatePath('/agents')
        revalidatePath('/dashboard')

        return {
            success: true,
            data: agent,
            tempPassword: validated.sendInviteEmail ? undefined : tempPassword
        }
    } catch (error: any) {
        console.error('[Create Agent] Error:', error)

        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: 'Validation error',
                details: error.errors
            }
        }

        return {
            success: false,
            error: error.message || 'Failed to create agent'
        }
    }
}

/**
 * Update an agent
 */
export async function updateAgent(data: UpdateAgentInput) {
    try {
        const user = await getCurrentUser()

        if (!user || user.role === 'AGENT') {
            throw new Error('Unauthorized: Only admins can update agents')
        }

        const validated = updateAgentSchema.parse(data)

        // Verify agent belongs to same company
        const agent = await db.user.findFirst({
            where: {
                id: validated.id,
                companyId: user.companyId
            }
        })

        if (!agent) {
            throw new Error('Agent not found')
        }

        // Update agent
        const updatedAgent = await db.user.update({
            where: { id: validated.id },
            data: {
                fullName: validated.fullName,
                phone: validated.phone,
                isActive: validated.isActive
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                role: true,
                isActive: true
            }
        })

        revalidatePath('/agents')

        return { success: true, data: updatedAgent }
    } catch (error: any) {
        console.error('[Update Agent] Error:', error)

        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: 'Validation error',
                details: error.errors
            }
        }

        return {
            success: false,
            error: error.message || 'Failed to update agent'
        }
    }
}

/**
 * Delete an agent
 */
export async function deleteAgent(agentId: string) {
    try {
        const user = await getCurrentUser()

        if (!user || user.role === 'AGENT') {
            throw new Error('Unauthorized: Only admins can delete agents')
        }

        // Verify agent belongs to same company
        const agent = await db.user.findFirst({
            where: {
                id: agentId,
                companyId: user.companyId
            }
        })

        if (!agent) {
            throw new Error('Agent not found')
        }

        // Don't allow deleting self
        if (agent.id === user.id) {
            throw new Error('Cannot delete your own account')
        }

        // Don't allow deleting last admin
        if (agent.role === 'COMPANY_ADMIN') {
            const adminCount = await db.user.count({
                where: {
                    companyId: user.companyId,
                    role: 'COMPANY_ADMIN',
                    isActive: true
                }
            })

            if (adminCount <= 1) {
                throw new Error('Cannot delete the last admin')
            }
        }

        // Soft delete by deactivating
        await db.user.update({
            where: { id: agentId },
            data: { isActive: false }
        })

        revalidatePath('/agents')

        return { success: true, message: 'Agent deleted successfully' }
    } catch (error: any) {
        console.error('[Delete Agent] Error:', error)
        return {
            success: false,
            error: error.message || 'Failed to delete agent'
        }
    }
}

/**
 * Bulk create agents from email list
 */
export async function bulkCreateAgents(emails: string[]) {
    try {
        const user = await getCurrentUser()

        if (!user || user.role === 'AGENT') {
            throw new Error('Unauthorized: Only admins can create agents')
        }

        const company = await db.company.findUnique({
            where: { id: user.companyId },
            include: {
                _count: { select: { users: true } }
            }
        })

        if (!company) {
            throw new Error('Company not found')
        }

        const available = company.seats - company._count.users

        if (emails.length > available) {
            throw new Error(`Not enough seats available. You have ${available} seats remaining.`)
        }

        const results = []
        const tempPassword = generateTemporaryPassword()
        const passwordHash = await hashPassword(tempPassword)

        for (const email of emails) {
            try {
                // Check if already exists
                const existing = await db.user.findUnique({ where: { email } })
                if (existing) {
                    results.push({ email, status: 'skipped', reason: 'Already exists' })
                    continue
                }

                // Create agent
                const agent = await db.user.create({
                    data: {
                        fullName: email.split('@')[0],
                        email,
                        role: 'AGENT',
                        passwordHash,
                        companyId: user.companyId,
                        isActive: true
                    }
                })

                results.push({ email, status: 'created', id: agent.id })
            } catch (error: any) {
                results.push({ email, status: 'error', reason: error.message })
            }
        }

        revalidatePath('/agents')

        return {
            success: true,
            data: results,
            tempPassword
        }
    } catch (error: any) {
        console.error('[Bulk Create Agents] Error:', error)
        return {
            success: false,
            error: error.message || 'Failed to bulk create agents'
        }
    }
}

/**
 * Helper: Generate temporary password
 */
function generateTemporaryPassword(): string {
    return Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10).toUpperCase() + '!1'
}
