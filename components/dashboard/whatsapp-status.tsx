'use client'

import { useEffect, useState } from 'react'
import { getWhatsAppStatus } from '@/lib/actions/admin'
import { WhatsAppStatusResponse } from '@/lib/actions/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, MessageCircle } from 'lucide-react'

/**
 * STORY 4.2: WhatsAppStatus Component
 * Displays WhatsApp connection status and quality rating
 */

export function WhatsAppStatus() {
  const [status, setStatus] = useState<WhatsAppStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getWhatsAppStatus()
        setStatus(response)
        if (!response.success) {
          setError(response.error || 'Failed to load WhatsApp status')
        }
      } catch (err) {
        console.error('[WhatsAppStatus] Error:', err)
        setError('An error occurred while loading WhatsApp status')
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error || !status?.success) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error || 'Failed to load WhatsApp status'}</AlertDescription>
      </Alert>
    )
  }

  const data = status.data
  if (!data) return null

  const getStatusBadgeColor = (connectionStatus: string) => {
    switch (connectionStatus) {
      case 'CONNECTED':
        return 'bg-green-100 text-green-800'
      case 'DISCONNECTED':
        return 'bg-red-100 text-red-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getQualityColor = (rating: number) => {
    if (rating >= 85) return 'text-green-600'
    if (rating >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <CardTitle>WhatsApp Status</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${data.status === 'CONNECTED' ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-semibold">{data.status}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Provider</p>
            <p className="text-sm font-semibold mt-1">{data.provider}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Tier</p>
            <p className="text-sm font-semibold mt-1">{data.tier}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Quality Rating</p>
            <p className={`text-lg font-bold mt-1 ${getQualityColor(data.qualityRating)}`}>
              {data.qualityRating}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Messages Delivered</p>
            <p className="text-sm font-semibold mt-1">
              {data.messagesDelivered}/{data.messagesSent}
            </p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Last sync: {new Date(data.lastSyncTime).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  )
}
