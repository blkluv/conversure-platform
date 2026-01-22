/**
 * Teams Server Actions
 * 
 * Team management for organizing agents
 * Ported from Rails Api::V1::Accounts::TeamsController and TeamMembersController
 */

'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const teamSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    allowAutoAssign: z.boolean().default(true)
})

/**
 * Get all teams
 */
export async function getTeams() {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const teams = await db.team.findMany({
            where: { companyId: user.companyId },
            include: {
                members: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true
                    }
                },
                _count: {
                    select: { members: true }
                }
            },
            orderBy: { name: 'asc' }
        })

        return { success: true, data: teams }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Create team
 */
export async function createTeam(data: z.infer<typeof teamSchema>) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') {
            throw new Error('Unauthorized: Admin access required')
        }

        const validated = teamSchema.parse(data)

        const team = await db.team.create({
            data: {
                companyId: user.companyId,
                ...validated
            }
        })

        revalidatePath('/teams')

        return { success: true, data: team }
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: 'Validation error', details: error.errors }
        }
        return { success: false, error: error.message }
    }
}

/**
 * Update team
 */
export async function updateTeam(id: string, data: Partial<z.infer<typeof teamSchema>>) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') {
            throw new Error('Unauthorized')
        }

        const team = await db.team.findFirst({
            where: { id, companyId: user.companyId }
        })

        if (!team) {
            return { success: false, error: 'Team not found' }
        }

        const updated = await db.team.update({
            where: { id },
            data
        })

        revalidatePath(`/teams/${id}`)
        revalidatePath('/teams')

        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Delete team
 */
export async function deleteTeam(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') {
            throw new Error('Unauthorized')
        }

        const team = await db.team.findFirst({
            where: { id, companyId: user.companyId }
        })

        if (!team) {
            return { success: false, error: 'Team not found' }
        }

        await db.team.delete({ where: { id } })

        revalidatePath('/teams')

        return { success: true, message: 'Team deleted' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Add members to team
 */
export async function addTeamMembers(teamId: string, userIds: string[]) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') {
            throw new Error('Unauthorized')
        }

        const team = await db.team.findFirst({
            where: { id: teamId, companyId: user.companyId },
            include: { members: true }
        })

        if (!team) {
            return { success: false, error: 'Team not found' }
        }

        // Verify all users belong to same company
        const users = await db.user.findMany({
            where: {
                id: { in: userIds },
                companyId: user.companyId
            }
        })

        if (users.length !== userIds.length) {
            return { success: false, error: 'Some users not found' }
        }

        // Update team with new members
        await db.team.update({
            where: { id: teamId },
            data: {
                members: {
                    connect: userIds.map(id => ({ id }))
                }
            }
        })

        revalidatePath(`/teams/${teamId}`)

        return { success: true, message: 'Members added successfully' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Remove members from team
 */
export async function removeTeamMembers(teamId: string, userIds: string[]) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') {
            throw new Error('Unauthorized')
        }

        const team = await db.team.findFirst({
            where: { id: teamId, companyId: user.companyId }
        })

        if (!team) {
            return { success: false, error: 'Team not found' }
        }

        await db.team.update({
            where: { id: teamId },
            data: {
                members: {
                    disconnect: userIds.map(id => ({ id }))
                }
            }
        })

        revalidatePath(`/teams/${teamId}`)

        return { success: true, message: 'Members removed successfully' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
