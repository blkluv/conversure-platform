/**
 * Type Definitions for Easy Panel Server Actions
 * 
 * These types are shared across:
 * - lib/actions/admin.ts (getDashboardMetrics, getBillingStatus, getWhatsAppStatus)
 * - Components that consume these Server Actions
 * - API routes (optional, if using Route Handlers)
 */

import { z } from 'zod'

// ============================================
// DASHBOARD METRICS TYPES
// ============================================

export interface DashboardMetrics {
  totalLeads: number
  activeCampaigns: number
  messagesToday: number
  dailyLimit: number
  trend: {
    leads: number      // percentage change
    campaigns: number  // percentage change
    messages: number   // percentage change
  }
}

export const DashboardMetricsSchema = z.object({
  totalLeads: z.number().int().nonnegative(),
  activeCampaigns: z.number().int().nonnegative(),
  messagesToday: z.number().int().nonnegative(),
  dailyLimit: z.number().int().nonnegative(), // Changed from .positive() to .nonnegative() - allows 0 when no WhatsApp numbers
  trend: z.object({
    leads: z.number(),
    campaigns: z.number(),
    messages: z.number(),
  }),
})

// ============================================
// BILLING STATUS TYPES
// ============================================

export type PlanType = 'STARTER' | 'GROWTH' | 'PRO' | 'ENTERPRISE'
export type BillingStatus = 'active' | 'trialing' | 'past_due' | 'canceled'

export interface BillingData {
  plan: PlanType
  status: BillingStatus
  currentPeriodEnd: string // ISO date
  seatsUsed: number
  seatsTotal: number
  monthlyCost: number // in cents (e.g., 39900 = $399.00)
  stripePortalUrl: string | null
}

export const BillingDataSchema = z.object({
  plan: z.enum(['STARTER', 'GROWTH', 'PRO', 'ENTERPRISE']),
  status: z.enum(['active', 'trialing', 'past_due', 'canceled']),
  currentPeriodEnd: z.string().datetime(),
  seatsUsed: z.number().int().nonnegative(),
  seatsTotal: z.number().int().positive(),
  monthlyCost: z.number().int().nonnegative(),
  stripePortalUrl: z.string().url().nullable(),
})

// ============================================
// WHATSAPP STATUS TYPES
// ============================================

export type WhatsAppProvider = 'WABA' | 'CHATWOOT' | 'EVOLUTION'
export type WhatsAppConnectionStatus = 
  | 'PENDING'
  | 'CONNECTED'
  | 'WARMING_UP'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'ERROR'

export interface WhatsAppStatusData {
  provider: WhatsAppProvider
  status: WhatsAppConnectionStatus
  businessNumber: string      // E.164 format: +971501234567
  warmupWeek: number          // 1-4+
  warmupLimit: number         // 20/50/100/1000 based on week
  lastActivity: string | null // ISO date or null
  numbersActive: number
}

export const WhatsAppStatusSchema = z.object({
  provider: z.enum(['WABA', 'CHATWOOT', 'EVOLUTION']),
  status: z.enum([
    'PENDING',
    'CONNECTED',
    'WARMING_UP',
    'ACTIVE',
    'SUSPENDED',
    'ERROR',
  ]),
  businessNumber: z.string().regex(/^\+\d{1,15}$/),
  warmupWeek: z.number().int().positive(),
  warmupLimit: z.number().int().positive(),
  lastActivity: z.string().datetime().nullable(),
  numbersActive: z.number().int().nonnegative(),
})

// ============================================
// AGENT LIST TYPES
// ============================================

export interface AgentData {
  id: string
  fullName: string
  email: string
  phone: string | null
  role: 'AGENT'
  isActive: boolean
  dailyLimit: number
  messagesSentToday: number
  createdAt: string // ISO date
}

export const AgentDataSchema = z.object({
  id: z.string().cuid(),
  fullName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().nullable(),
  role: z.literal('AGENT'),
  isActive: z.boolean(),
  dailyLimit: z.number().int().min(1).max(1000),
  messagesSentToday: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
})

export interface PaginationMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const PaginationMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
})

// ============================================
// GENERIC SERVER ACTION RESPONSE TYPES
// ============================================

/**
 * Standard response wrapper for Server Actions
 * Used across all admin dashboard Server Actions for consistency
 */
export interface ServerActionResponse<T> {
  success: boolean
  data?: T
  error?: string
  field?: string // For validation errors that are field-specific
}

export function createSuccessResponse<T>(data: T): ServerActionResponse<T> {
  return {
    success: true,
    data,
  }
}

export function createErrorResponse<T>(
  error: string,
  field?: string
): ServerActionResponse<T> {
  return {
    success: false,
    error,
    field,
  }
}

// ============================================
// SESSION TYPE (For Type Safety)
// ============================================

export interface AuthSession {
  id: string
  email: string
  fullName: string
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'AGENT'
  companyId: string
}

// ============================================
// PLAN PRICING LOOKUP TABLE
// ============================================

export const PlanPricing: Record<PlanType, number> = {
  STARTER: 9900,      // $99.00
  GROWTH: 19900,      // $199.00
  PRO: 39900,         // $399.00
  ENTERPRISE: 99900,  // $999.00
}

/**
 * Get monthly cost in cents for a plan
 */
export function getMonthlyCost(plan: PlanType): number {
  return PlanPricing[plan] ?? PlanPricing.STARTER
}

// ============================================
// WARM-UP STAGE LIMITS
// ============================================

export const WarmupStageLimits: Record<number, number> = {
  1: 20,
  2: 50,
  3: 100,
  4: 1000,
}

/**
 * Get daily message limit for a warm-up stage
 */
export function getWarmupLimit(stage: number): number {
  return WarmupStageLimits[stage] ?? WarmupStageLimits[4]
}

// ============================================
// EXPORT CONSOLIDATED RESPONSE TYPES
// ============================================

export type DashboardMetricsResponse = ServerActionResponse<DashboardMetrics>
export type BillingStatusResponse = ServerActionResponse<BillingData>
export type WhatsAppStatusResponse = ServerActionResponse<WhatsAppStatusData>
export type AgentListResponse = ServerActionResponse<{
  agents: AgentData[]
  pagination: PaginationMeta
}>
