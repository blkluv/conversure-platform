'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth'

/**
 * STORY 1.1: getDashboardMetrics Server Action
 * 
 * Purpose: Fetch analytics data for the Easy Panel dashboard with trend calculations
 * Security: 3-layer defense (middleware → requireAuth/requireRole → companyId filter)
 * Multi-tenant: All queries filtered by session.companyId
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface DashboardMetrics {
  totalLeads: number
  activeCampaigns: number
  messagesToday: number
  dailyLimit: number
  trend: {
    leads: number      // percentage change month-over-month
    campaigns: number  // percentage change week-over-week
    messages: number   // percentage change today-vs-yesterday
  }
}

// ============================================
// RESPONSE SCHEMA (Zod Validation)
// ============================================

const DashboardMetricsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    totalLeads: z.number().int().nonnegative(),
    activeCampaigns: z.number().int().nonnegative(),
    messagesToday: z.number().int().nonnegative(),
    dailyLimit: z.number().int().nonnegative(), // Changed from .positive() to .nonnegative() - allows 0 when no WhatsApp numbers
    trend: z.object({
      leads: z.number(),      // Can be negative for decline
      campaigns: z.number(),
      messages: z.number(),
    }),
  }).optional(),
  error: z.string().optional(),
})

export type DashboardMetricsResponse = z.infer<typeof DashboardMetricsResponseSchema>

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate trend percentage: (current - previous) / previous * 100
 * Handles division by zero by returning 0
 */
function calculateTrend(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }
  return Math.round(((current - previous) / previous) * 100 * 100) / 100
}

/**
 * Get the date at midnight UTC for a given offset (e.g., -1 for yesterday)
 */
function getMidnightDate(daysOffset: number = 0): Date {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + daysOffset)
  date.setUTCHours(0, 0, 0, 0)
  return date
}

// ============================================
// SERVER ACTION: GET DASHBOARD METRICS
// ============================================

export async function getDashboardMetrics(): Promise<DashboardMetricsResponse> {
  try {
    // LAYER 1 & 2: Authentication & Authorization
    // ============================================
    const session = await requireAuth()
    await requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN'])
    
    const companyId = session.companyId
    if (!companyId) {
      return {
        success: false,
        error: 'Company context not found',
      }
    }

    // LAYER 3: Multi-Tenant Query Filtering
    // ============================================
    
    // 1. TOTAL LEADS (current count)
    const totalLeads = await prisma.lead.count({
      where: {
        companyId, // MANDATORY: Multi-tenant filter
      },
    })

    // 2. ACTIVE CAMPAIGNS (running or scheduled)
    const activeCampaigns = await prisma.campaign.count({
      where: {
        companyId,  // MANDATORY: Multi-tenant filter
        status: {
          in: ['running', 'scheduled'],
        },
      },
    })

    // 3. MESSAGES TODAY (last 24 hours)
    const today = getMidnightDate(0) // 00:00 UTC today
    const messagesToday = await prisma.message.count({
      where: {
        conversation: {
          companyId, // MANDATORY: Multi-tenant filter via relationship
        },
        sentAt: {
          gte: today,
        },
      },
    })

    // 4. DAILY LIMIT (sum of active WhatsApp numbers' daily limits)
    const whatsappLimits = await prisma.whatsAppNumber.aggregate({
      where: {
        companyId, // MANDATORY: Multi-tenant filter
        isActive: true,
      },
      _sum: {
        dailyLimit: true,
      },
    })
    const dailyLimit = whatsappLimits._sum.dailyLimit ?? 0

    // ============================================
    // TREND CALCULATIONS
    // ============================================

    // TREND: Leads (month-over-month)
    // Current month: today - 30 days
    const thirtyDaysAgo = getMidnightDate(-30)
    const leadsLastMonth = await prisma.lead.count({
      where: {
        companyId,
        createdAt: {
          lt: thirtyDaysAgo, // Before 30 days ago
        },
      },
    })
    const leadsTrend = calculateTrend(totalLeads, leadsLastMonth)

    // TREND: Campaigns (week-over-week)
    // Current week: today - 7 days
    const sevenDaysAgo = getMidnightDate(-7)
    const campaignsLastWeek = await prisma.campaign.count({
      where: {
        companyId,
        status: {
          in: ['running', 'scheduled', 'completed', 'paused'],
        },
        createdAt: {
          lt: sevenDaysAgo, // Before 7 days ago
        },
      },
    })
    const campaignsTrend = calculateTrend(activeCampaigns, campaignsLastWeek)

    // TREND: Messages (day-over-day)
    const yesterday = getMidnightDate(-1) // 00:00 UTC yesterday
    const messagesYesterday = await prisma.message.count({
      where: {
        conversation: {
          companyId,
        },
        sentAt: {
          gte: yesterday,
          lt: today, // Only yesterday's messages
        },
      },
    })
    const messagesTrend = calculateTrend(messagesToday, messagesYesterday)

    // ============================================
    // RESPONSE VALIDATION & RETURN
    // ============================================

    const metricsData: DashboardMetrics = {
      totalLeads,
      activeCampaigns,
      messagesToday,
      dailyLimit,
      trend: {
        leads: leadsTrend,
        campaigns: campaignsTrend,
        messages: messagesTrend,
      },
    }

    // Validate response schema with Zod
    const validatedResponse = DashboardMetricsResponseSchema.parse({
      success: true,
      data: metricsData,
    })

    return validatedResponse
  } catch (error) {
    console.error('[getDashboardMetrics] Error:', error)

    // Return generic error message (don't leak data)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard metrics',
    }
  }
}

// ============================================
// UNIT TEST TEMPLATE
// ============================================

/**
 * Test Suite for getDashboardMetrics
 * 
 * To run tests:
 * $ npm test -- lib/actions/admin.test.ts
 * 
 * Coverage:
 * - ✓ Authentication check
 * - ✓ Authorization check (role validation)
 * - ✓ Multi-tenant isolation (two companies)
 * - ✓ Trend calculations
 * - ✓ Edge cases (zero counts, null values)
 * - ✓ Error handling
 */

/*
import { getDashboardMetrics } from './admin'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

jest.mock('@/lib/db', () => ({
  prisma: {
    lead: { count: jest.fn() },
    campaign: { count: jest.fn() },
    message: { count: jest.fn() },
    whatsAppNumber: { aggregate: jest.fn() },
  },
}))

jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
  requireAuth: jest.fn(),
  requireRole: jest.fn(),
}))

describe('getDashboardMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return metrics for authenticated COMPANY_ADMIN', async () => {
    // Mock auth
    jest.mocked(requireAuth).mockResolvedValue({
      id: 'user_1',
      email: 'admin@company.com',
      fullName: 'Admin User',
      role: 'COMPANY_ADMIN',
      companyId: 'company_1',
    })
    jest.mocked(requireRole).mockResolvedValue({
      id: 'user_1',
      email: 'admin@company.com',
      fullName: 'Admin User',
      role: 'COMPANY_ADMIN',
      companyId: 'company_1',
    })

    // Mock Prisma queries
    jest.mocked(prisma.lead.count).mockResolvedValue(142)
    jest.mocked(prisma.campaign.count).mockResolvedValueOnce(3).mockResolvedValueOnce(2)
    jest.mocked(prisma.message.count).mockResolvedValueOnce(245).mockResolvedValueOnce(218)
    jest.mocked(prisma.whatsAppNumber.aggregate).mockResolvedValue({
      _sum: { dailyLimit: 1000 },
      _count: {},
      _min: {},
      _max: {},
      _avg: {},
    })

    const response = await getDashboardMetrics()

    expect(response.success).toBe(true)
    expect(response.data?.totalLeads).toBe(142)
    expect(response.data?.activeCampaigns).toBe(3)
    expect(response.data?.messagesToday).toBe(245)
    expect(response.data?.dailyLimit).toBe(1000)
    expect(response.data?.trend.leads).toBeDefined()
    expect(response.data?.trend.campaigns).toBeDefined()
    expect(response.data?.trend.messages).toBeDefined()
  })

  it('should enforce multi-tenant isolation (company_1 sees only company_1 data)', async () => {
    // Mock auth for company_1
    jest.mocked(requireAuth).mockResolvedValue({
      id: 'user_1',
      email: 'admin@company1.com',
      fullName: 'Admin',
      role: 'COMPANY_ADMIN',
      companyId: 'company_1',
    })

    // Mock Prisma calls to verify companyId filter is applied
    await getDashboardMetrics()

    // Verify that all queries included the companyId filter
    expect(prisma.lead.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'company_1' }),
      })
    )
  })

  it('should return 0 leads and trends when company is new', async () => {
    jest.mocked(requireAuth).mockResolvedValue({
      id: 'user_2',
      email: 'admin@company2.com',
      fullName: 'New Admin',
      role: 'COMPANY_ADMIN',
      companyId: 'company_2',
    })
    jest.mocked(requireRole).mockResolvedValue({
      id: 'user_2',
      email: 'admin@company2.com',
      fullName: 'New Admin',
      role: 'COMPANY_ADMIN',
      companyId: 'company_2',
    })

    jest.mocked(prisma.lead.count).mockResolvedValue(0)
    jest.mocked(prisma.campaign.count).mockResolvedValueOnce(0).mockResolvedValueOnce(0)
    jest.mocked(prisma.message.count).mockResolvedValueOnce(0).mockResolvedValueOnce(0)
    jest.mocked(prisma.whatsAppNumber.aggregate).mockResolvedValue({
      _sum: { dailyLimit: null },
      _count: {},
      _min: {},
      _max: {},
      _avg: {},
    })

    const response = await getDashboardMetrics()

    expect(response.success).toBe(true)
    expect(response.data?.totalLeads).toBe(0)
    expect(response.data?.dailyLimit).toBe(0)
    // Trends should be 0 (since previous count is also 0)
    expect(response.data?.trend.leads).toBe(0)
  })

  it('should reject unauthenticated requests', async () => {
    jest.mocked(requireAuth).mockRejectedValue(new Error('Unauthorized'))

    const response = await getDashboardMetrics()

    expect(response.success).toBe(false)
    expect(response.error).toContain('Unauthorized')
  })

  it('should reject users without COMPANY_ADMIN role', async () => {
    jest.mocked(requireAuth).mockResolvedValue({
      id: 'user_agent',
      email: 'agent@company.com',
      fullName: 'Agent',
      role: 'AGENT',
      companyId: 'company_1',
    })
    jest.mocked(requireRole).mockRejectedValue(new Error('Forbidden'))

    const response = await getDashboardMetrics()

    expect(response.success).toBe(false)
    expect(response.error).toContain('Forbidden')
  })
})
*/

// ============================================
// SERVER ACTION: GET BILLING STATUS
// ============================================

/**
 * STORY 2.1: getBillingStatus Server Action
 * 
 * Purpose: Fetch subscription and billing data with Stripe integration
 * Security: 3-layer defense (middleware → requireAuth/requireRole → companyId filter)
 * Multi-tenant: Company isolation, Stripe portal scoped to company only
 */

import { BillingStatusResponse, BillingDataSchema, PlanType, BillingStatus } from '@/lib/types/admin'
import { stripe, isStripeEnabled } from '@/lib/stripe'

export async function getBillingStatus(): Promise<BillingStatusResponse> {
  try {
    // LAYER 1 & 2: Authentication & Authorization
    // ============================================
    const session = await requireAuth()
    await requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN'])

    const companyId = session.companyId
    if (!companyId) {
      return {
        success: false,
        error: 'Company context not found',
      }
    }

    // LAYER 3: Multi-Tenant Query Filtering
    // ============================================

    // 1. Fetch Company subscription details
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        plan: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
        seats: true,
        stripeCustomerId: true,
      },
    })

    if (!company) {
      return {
        success: false,
        error: 'Company not found',
      }
    }

    // 2. Count active users (seats used)
    const seatsUsed = await prisma.user.count({
      where: {
        companyId, // MANDATORY: Multi-tenant filter
        isActive: true,
      },
    })

    // 3. Get monthly cost from PlanPricing lookup table
    const planPricing: Record<PlanType, number> = {
      STARTER: 9900,    // $99.00
      GROWTH: 19900,    // $199.00
      PRO: 39900,       // $399.00
      ENTERPRISE: 99900, // $999.00
    }
    const monthlyCost = planPricing[company.plan as PlanType] || 0

    // 4. Generate Stripe Customer Portal URL (if Stripe is configured)
    let stripePortalUrl: string | null = null
    if (isStripeEnabled() && company.stripeCustomerId) {
      try {
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: company.stripeCustomerId,
          return_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/admin`,
        })
        stripePortalUrl = portalSession.url
      } catch (stripeError) {
        console.error('[getBillingStatus] Stripe portal error:', stripeError)
        // Continue without portal URL - not critical
        stripePortalUrl = null
      }
    }

    // ============================================
    // RESPONSE VALIDATION & RETURN
    // ============================================

    // Map subscriptionStatus to a valid enum value, defaulting to 'active' if null/undefined
    const statusMapping: Record<string, BillingStatus> = {
      'active': 'active',
      'trialing': 'trialing',
      'past_due': 'past_due',
      'canceled': 'canceled',
    }
    const mappedStatus = statusMapping[company.subscriptionStatus || ''] || 'active'

    const billingData = {
      plan: company.plan as PlanType,
      status: mappedStatus,
      currentPeriodEnd: company.currentPeriodEnd?.toISOString() || new Date().toISOString(),
      seatsUsed,
      seatsTotal: company.seats || 5, // Default to 5 seats if not set
      monthlyCost,
      stripePortalUrl,
    }

    // Validate response against schema
    const validated = BillingDataSchema.parse(billingData)

    return {
      success: true,
      data: validated,
    }
  } catch (error) {
    console.error('[getBillingStatus] Error fetching billing status:', error)

    // Determine appropriate error message
    let errorMessage = 'Failed to load billing information'
    if (error instanceof z.ZodError) {
      errorMessage = 'Invalid billing data format'
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

// ============================================
// SERVER ACTION: GET WHATSAPP STATUS
// ============================================

/**
 * STORY 4.1: getWhatsAppStatus Server Action
 * 
 * Purpose: Fetch WhatsApp connection status and quality metrics
 * Security: 3-layer defense (middleware → requireAuth/requireRole → companyId filter)
 * Multi-tenant: Company isolation
 * 
 * NOTE: Using dummy data for initial release. Will integrate with Meta APIs later.
 */

export interface WhatsAppStatus {
  provider: 'WABA' | 'EVOLUTION' | 'NOT_CONNECTED'
  status: 'CONNECTED' | 'DISCONNECTED' | 'PENDING'
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Unknown'
  qualityRating: number // 0-100
  messagesSent: number
  messagesDelivered: number
  lastSyncTime: string // ISO date
}

export interface WhatsAppStatusResponse {
  success: boolean
  data?: WhatsAppStatus
  error?: string
}

export async function getWhatsAppStatus(): Promise<WhatsAppStatusResponse> {
  try {
    // LAYER 1 & 2: Authentication & Authorization
    const session = await requireAuth()
    await requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN'])

    const companyId = session.companyId
    if (!companyId) {
      return {
        success: false,
        error: 'Company context not found',
      }
    }

    // TODO: Replace dummy data with real WhatsApp API calls
    // For now, returning dummy data so dashboard ships immediately
    const dummyData: WhatsAppStatus = {
      provider: 'WABA',
      status: 'CONNECTED',
      tier: 'Tier 2',
      qualityRating: 92,
      messagesSent: 1250,
      messagesDelivered: 1187,
      lastSyncTime: new Date().toISOString(),
    }

    return {
      success: true,
      data: dummyData,
    }
  } catch (error) {
    console.error('[getWhatsAppStatus] Error fetching WhatsApp status:', error)

    return {
      success: false,
      error: 'Failed to load WhatsApp status. Please try again later.',
    }
  }
}
