'use client'

import { useEffect, useState } from 'react'
import { getDashboardMetrics } from '@/lib/actions/admin'
import { DashboardMetricsResponse } from '@/lib/types/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, Send, MessageSquare, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'

/**
 * STORY 1.2: StatsSection Component
 * 
 * Purpose: Display 3 analytics cards on the Easy Panel dashboard
 * - Total Leads (with month-over-month trend)
 * - Active Campaigns (with week-over-week trend)
 * - WhatsApp Message Usage (with daily limit progress bar)
 * 
 * Features:
 * - Server Action data fetching (getDashboardMetrics)
 * - Responsive grid layout (3-2-1 columns)
 * - Color-coded progress bar (green/yellow/red)
 * - Loading and error states
 * - Trend indicators (up/down arrows)
 */

interface StatCardProps {
  title: string
  value: number | string
  description: string
  icon: React.ComponentType<{ className?: string }>
  trend?: {
    value: number
    type: 'positive' | 'negative' | 'neutral'
  }
}

interface MessageProgressProps {
  current: number
  limit: number
}

// ============================================
// HELPER COMPONENTS
// ============================================

/**
 * Determine progress bar color based on percentage
 * Green: < 80%
 * Yellow: 80-95%
 * Red: > 95%
 */
function getProgressColor(percentage: number): string {
  if (percentage < 80) return 'bg-green-500'
  if (percentage <= 95) return 'bg-yellow-500'
  return 'bg-red-500'
}

/**
 * Message Progress Card Component
 * Shows usage/limit with color-coded progress bar
 */
function MessageProgressCard({ current, limit }: MessageProgressProps) {
  const percentage = limit > 0 ? Math.round((current / limit) * 100) : 0
  const progressColor = getProgressColor(percentage)

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">WhatsApp Message Usage</p>
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
        </div>

        <div className="space-y-4">
          {/* Current/Limit Display */}
          <div>
            <p className="text-3xl font-bold">{current}</p>
            <p className="text-xs text-muted-foreground">Messages today</p>
            <p className="text-sm text-gray-500 mt-1">
              {current} / {limit} messages
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${progressColor}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>

            {/* Percentage Text */}
            <div className="flex justify-between items-center">
              <p className="text-xs font-medium">{percentage}% of daily limit</p>
              {percentage > 95 && (
                <Badge variant="destructive" className="text-xs">
                  Limit warning
                </Badge>
              )}
              {percentage > 80 && percentage <= 95 && (
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                  Approaching limit
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Standard Stat Card with Trend
 */
function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          {/* Value */}
          <p className="text-3xl font-bold">{value}</p>

          {/* Description + Trend */}
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{description}</p>

            {trend && (
              <span
                className={`text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded ${
                  trend.type === 'positive'
                    ? 'text-green-600 bg-green-50'
                    : trend.type === 'negative'
                      ? 'text-red-600 bg-red-50'
                      : 'text-gray-600 bg-gray-50'
                }`}
              >
                {trend.type === 'positive' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : trend.type === 'negative' ? (
                  <TrendingDown className="w-3 h-3" />
                ) : null}
                {trend.type !== 'neutral' ? `${Math.abs(trend.value)}%` : 'No change'}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Loading Skeleton Card
 */
function SkeletonCard() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// MAIN COMPONENT: StatsSection
// ============================================

export function StatsSection() {
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch metrics on mount
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getDashboardMetrics()

        if (!response.success) {
          setError(response.error || 'Failed to load metrics')
          setMetrics(null)
        } else {
          setMetrics(response)
          setError(null)
        }
      } catch (err) {
        console.error('[StatsSection] Error fetching metrics:', err)
        setError('An unexpected error occurred while loading metrics')
        setMetrics(null)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  // Loading State: Show 3 skeleton cards
  if (loading) {
    return (
      <div className="w-full">
        <h2 className="text-2xl font-bold mb-6">Dashboard Analytics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  // Error State: Show error message
  if (error || !metrics?.success || !metrics.data) {
    return (
      <div className="w-full">
        <h2 className="text-2xl font-bold mb-6">Dashboard Analytics</h2>
        <Alert variant="destructive" className="max-w-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Failed to load dashboard metrics. Please try again later.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const { totalLeads, activeCampaigns, messagesToday, dailyLimit, trend } = metrics.data

  // Determine trend types based on values
  const leadsTrendType =
    trend.leads > 0 ? 'positive' : trend.leads < 0 ? 'negative' : 'neutral'
  const campaignsTrendType =
    trend.campaigns > 0 ? 'positive' : trend.campaigns < 0 ? 'negative' : 'neutral'

  return (
    <div className="w-full space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold">Dashboard Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time metrics for your company
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Total Leads */}
        <StatCard
          title="Total Leads"
          value={totalLeads}
          description="All prospects in system"
          icon={Users}
          trend={{
            value: Math.abs(trend.leads),
            type: leadsTrendType,
          }}
        />

        {/* Card 2: Active Campaigns */}
        <StatCard
          title="Active Campaigns"
          value={activeCampaigns}
          description="Campaigns sending messages"
          icon={Send}
          trend={{
            value: Math.abs(trend.campaigns),
            type: campaignsTrendType,
          }}
        />

        {/* Card 3: Message Usage */}
        <MessageProgressCard current={messagesToday} limit={dailyLimit} />
      </div>

      {/* Help Text */}
      <div className="text-xs text-muted-foreground">
        <p>
          💡 <strong>Tip:</strong> Leads and Campaigns trends show month-over-month and
          week-over-week changes. Message usage resets daily.
        </p>
      </div>
    </div>
  )
}

export default StatsSection
