'use client'

import { useEffect, useState } from 'react'
import { getBillingStatus } from '@/lib/actions/admin'
import { BillingStatusResponse } from '@/lib/types/admin'
import { formatDate, formatCurrency } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ExternalLink } from 'lucide-react'

/**
 * STORY 2.2: BillingPanel Component
 * 
 * Purpose: Display subscription and billing information for the company
 * - Plan type and status
 * - Seat usage
 * - Renewal date
 * - Monthly cost
 * - Link to Stripe customer portal
 * 
 * Features:
 * - Server Action data fetching (getBillingStatus)
 * - Loading and error states
 * - Plan badge color-coding
 * - Status badge color-coding
 * - Responsive layout
 * - Formatted currency and dates
 */

// ============================================
// HELPER COMPONENTS
// ============================================

/**
 * Determine plan badge color based on plan type
 */
function getPlanBadgeVariant(plan: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (plan) {
    case 'STARTER':
      return 'default' // Blue
    case 'GROWTH':
      return 'secondary' // Green-ish
    case 'PRO':
      return 'destructive' // Orange-ish
    case 'ENTERPRISE':
      return 'outline' // Purple-ish
    default:
      return 'default'
  }
}

/**
 * Determine status badge color based on billing status
 */
function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'trialing':
      return 'bg-blue-100 text-blue-800'
    case 'past_due':
      return 'bg-red-100 text-red-800'
    case 'canceled':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Get readable status text
 */
function getStatusText(status: string): string {
  switch (status) {
    case 'active':
      return 'Active'
    case 'trialing':
      return 'Trialing'
    case 'past_due':
      return 'Past Due'
    case 'canceled':
      return 'Canceled'
    default:
      return status
  }
}

/**
 * Loading Skeleton Card
 */
function BillingSkeletonCard() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 bg-gray-200 rounded w-40 animate-pulse mb-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-10 bg-gray-200 rounded w-full animate-pulse mt-4" />
      </CardContent>
    </Card>
  )
}

/**
 * Billing Info Row (label + value)
 */
function BillingInfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold mt-1">{value}</p>
    </div>
  )
}

// ============================================
// MAIN COMPONENT: BillingPanel
// ============================================

export function BillingPanel() {
  const [billing, setBilling] = useState<BillingStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch billing status on mount
  useEffect(() => {
    const fetchBilling = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getBillingStatus()

        if (!response.success) {
          setError(response.error || 'Failed to load billing information')
          setBilling(null)
        } else {
          setBilling(response)
          setError(null)
        }
      } catch (err) {
        console.error('[BillingPanel] Error fetching billing status:', err)
        setError('An unexpected error occurred while loading billing information')
        setBilling(null)
      } finally {
        setLoading(false)
      }
    }

    fetchBilling()
  }, [])

  // Loading State: Show skeleton card
  if (loading) {
    return <BillingSkeletonCard />
  }

  // Error State: Show error message
  if (error || !billing?.success || !billing.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || 'Failed to load billing information. Please try again later.'}
        </AlertDescription>
      </Alert>
    )
  }

  const { plan, status, currentPeriodEnd, seatsUsed, seatsTotal, monthlyCost, stripePortalUrl } =
    billing.data

  const planBadgeVariant = getPlanBadgeVariant(plan)
  const statusBadgeClass = getStatusBadgeClass(status)
  const statusText = getStatusText(status)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Subscription & Billing</CardTitle>
        <Badge variant={planBadgeVariant}>{plan}</Badge>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status Badge */}
        <div>
          <div className={`inline-flex items-center px-3 py-1 rounded-full ${statusBadgeClass}`}>
            <span className="text-xs font-semibold">{statusText}</span>
          </div>
        </div>

        {/* Billing Info Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <BillingInfoRow label="Current Period End" value={formatDate(currentPeriodEnd)} />
          <BillingInfoRow label="Seats Used" value={`${seatsUsed} / ${seatsTotal}`} />
          <BillingInfoRow label="Monthly Cost" value={formatCurrency(monthlyCost)} />
          <BillingInfoRow 
            label="Plan" 
            value={
              <span className="text-sm">
                {plan === 'STARTER' && 'Starter Plan'}
                {plan === 'GROWTH' && 'Growth Plan'}
                {plan === 'PRO' && 'Pro Plan'}
                {plan === 'ENTERPRISE' && 'Enterprise Plan'}
              </span>
            }
          />
        </div>

        {/* Manage Subscription Button */}
        {stripePortalUrl && (
          <Button
            asChild
            className="w-full"
            variant="default"
          >
            <a href={stripePortalUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Manage Subscription
            </a>
          </Button>
        )}

        {!stripePortalUrl && (
          <Button variant="outline" disabled className="w-full">
            <ExternalLink className="mr-2 h-4 w-4" />
            Manage Subscription (Not connected to Stripe)
          </Button>
        )}

        {/* Info Text */}
        <p className="text-xs text-muted-foreground">
          Manage your subscription plan, payment method, and billing information directly in the Stripe portal.
        </p>
      </CardContent>
    </Card>
  )
}

export default BillingPanel
