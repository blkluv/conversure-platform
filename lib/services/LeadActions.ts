
import { PrismaClient, Lead, Conversation, Message } from '@prisma/client'
import { db } from '@/lib/db'

type LeadAttributes = {
    name?: string
    email?: string
    phone?: string
    identifier?: string // Maps to bitrixLeadId or logic can be adapted
    avatar_url?: string // Not currently in Lead model, placeholder
}

interface LeadIdentifyParams {
    companyId: string
    params: LeadAttributes
}

/**
 * LeadIdentifyAction
 * 
 * Ports the logic from Chatwoot's ContactIdentifyAction to Conversure's Lead model.
 * Handles identification, deduplication, and merging of Leads based on Phone and Email.
 */
export class LeadIdentifyAction {
    private companyId: string
    private params: LeadAttributes
    private lead: Lead | null = null

    constructor({ companyId, params }: LeadIdentifyParams) {
        this.companyId = companyId
        this.params = params
    }

    public async perform(): Promise<Lead> {
        // We execute in a transaction to ensure integrity during potential merges
        return await db.$transaction(async (tx) => {
            // 1. Try to find by Identifier (e.g. Bitrix ID)
            const existingByIdentifier = await this.findExistingByIdentifier(tx)
            if (existingByIdentifier) {
                await this.processMerge(existingByIdentifier, tx)
            }

            // 2. Try to find by Email
            const existingByEmail = await this.findExistingByEmail(tx)
            if (existingByEmail) {
                await this.processMerge(existingByEmail, tx)
            }

            // 3. Try to find by Phone
            const existingByPhone = await this.findExistingByPhone(tx)
            if (existingByPhone && this.isMergeablePhoneContact(existingByPhone)) {
                await this.processMerge(existingByPhone, tx)
            }

            // 4. Create or Update the final Lead
            if (!this.lead) {
                this.lead = await this.createLead(tx)
            } else {
                await this.updateLead(tx)
            }

            if (!this.lead) throw new Error("Failed to identify or create lead")

            return this.lead
        })
    }

    private async findExistingByIdentifier(tx: any) {
        if (!this.params.identifier) return null
        return tx.lead.findFirst({
            where: {
                companyId: this.companyId,
                bitrixLeadId: this.params.identifier,
            },
        })
    }

    private async findExistingByEmail(tx: any) {
        if (!this.params.email) return null
        return tx.lead.findFirst({
            where: {
                companyId: this.companyId,
                email: this.params.email,
                id: { not: this.lead?.id }, // Exclude current if set
            },
        })
    }

    private async findExistingByPhone(tx: any) {
        if (!this.params.phone) return null
        return tx.lead.findFirst({
            where: {
                companyId: this.companyId,
                phone: this.params.phone,
                id: { not: this.lead?.id }, // Exclude current if set
            },
        })
    }

    /**
     * Prevents merging if the phone-matched lead has a DIFFERENT email than the one provided.
     * Logic ported from `mergable_phone_contact?` in Ruby.
     */
    private isMergeablePhoneContact(existingLead: Lead): boolean {
        if (!this.params.email) return true

        if (existingLead.email && existingLead.email !== this.params.email) {
            // Logic: Email mismatch implies different person sharing a phone? 
            // Or we prioritize email as a stronger separator.
            // In the Ruby code, they delete :phone_number from update list and return false.
            // Here we just skip the merge.
            return false
        }
        return true
    }

    private async processMerge(mergeeLead: Lead, tx: any) {
        // If we haven't identified a "primary" lead yet, this one becomes it.
        if (!this.lead) {
            this.lead = mergeeLead
            return
        }

        // If matches same ID, no-op
        if (this.lead.id === mergeeLead.id) return

        // MERGE ACTION
        // We merge 'mergeeLead' INTO 'this.lead'
        this.lead = await new LeadMergeAction({
            companyId: this.companyId,
            baseLead: this.lead,
            mergeeLead: mergeeLead,
        }).perform(tx)
    }

    private async createLead(tx: any) {
        if (!this.params.phone) throw new Error("Phone number required to create a lead")

        return tx.lead.create({
            data: {
                companyId: this.companyId,
                name: this.params.name || this.params.phone,
                phone: this.params.phone,
                email: this.params.email,
                bitrixLeadId: this.params.identifier,
                source: "API/Webhook",
            },
        })
    }

    private async updateLead(tx: any) {
        if (!this.lead) return

        // Update fields if provided and empty in current lead, or overwrite?
        // Ruby logic: params.slice(*attributes_to_update).reject(&:blank?)
        // We'll standard overwrite for now, or use smart merge.

        const updates: any = {}
        if (this.params.name) updates.name = this.params.name
        if (this.params.email) updates.email = this.params.email
        if (this.params.identifier) updates.bitrixLeadId = this.params.identifier
        // Phone usually doesn't change if used for lookup, but can if identifiers matched

        if (Object.keys(updates).length > 0) {
            this.lead = await tx.lead.update({
                where: { id: this.lead.id },
                data: updates,
            })
        }
    }
}

/**
 * LeadMergeAction
 * 
 * Merges two leads, moving all related entities (conversations, messages, etc.)
 * from `mergeeLead` to `baseLead`, then deletes `mergeeLead`.
 */
export class LeadMergeAction {
    private companyId: string
    private baseLead: Lead
    private mergeeLead: Lead

    constructor({ companyId, baseLead, mergeeLead }: { companyId: string, baseLead: Lead, mergeeLead: Lead }) {
        this.companyId = companyId
        this.baseLead = baseLead
        this.mergeeLead = mergeeLead
    }

    public async perform(tx: any): Promise<Lead> {
        if (this.baseLead.id === this.mergeeLead.id) return this.baseLead

        // 1. Merge Conversations
        await tx.conversation.updateMany({
            where: { leadId: this.mergeeLead.id },
            data: { leadId: this.baseLead.id },
        })

        // 2. Merge Feedback
        await tx.feedback.updateMany({
            where: { leadId: this.mergeeLead.id },
            data: { leadId: this.baseLead.id },
        })

        // 3. Merge Campaign Recipients
        await tx.campaignRecipient.updateMany({
            where: { leadId: this.mergeeLead.id },
            data: { leadId: this.baseLead.id },
        })

        // 4. Merge Attributes (Base takes priority, or mergee fills gaps?)
        // Chatwoot: "merged_attributes = mergee_contact_attributes.deep_merge(base_contact_attributes)"
        // i.e., Base attributes overwrite Mergee attributes.
        // We already have Base, we just need to fill gaps from Mergee if any.

        const updates: any = {}
        if (!this.baseLead.email && this.mergeeLead.email) updates.email = this.mergeeLead.email
        if (!this.baseLead.bitrixLeadId && this.mergeeLead.bitrixLeadId) updates.bitrixLeadId = this.mergeeLead.bitrixLeadId
        // Add other fields as needed

        if (Object.keys(updates).length > 0) {
            await tx.lead.update({
                where: { id: this.baseLead.id },
                data: updates,
            })
        }

        // 5. Delete Mergee
        await tx.lead.delete({
            where: { id: this.mergeeLead.id },
        })

        return this.baseLead
    }
}
