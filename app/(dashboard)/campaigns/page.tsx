/**
 * Campaigns List Page
 * 
 * Campaign management with stats and quick actions
 */

'use client'

import { useState } from 'react'

import { PageHeader, EmptyState, StatsCard } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Megaphone, Users, Send, Clock, Plus, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Campaign = {
  id: string
  name: string
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'PAUSED'
  targetCount: number
  sentCount: number
  deliveredCount: number
  scheduledFor?: Date
  createdAt: Date
}

// Mock data
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Villa Launch Campaign',
    status: 'SENT',
    targetCount: 150,
    sentCount: 150,
    deliveredCount: 147,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
  },
  {
    id: '2',
    name: 'Weekend Open House',
    status: 'SCHEDULED',
    targetCount: 200,
    sentCount: 0,
    deliveredCount: 0,
    scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 24),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4)
  }
]

export default function CampaignsPage() {
  const router = useRouter()

  const stats = {
    totalCampaigns: mockCampaigns.length,
    activeCampaigns: mockCampaigns.filter(c => c.status === 'SENDING' || c.status === 'SCHEDULED').length,
    totalSent: mockCampaigns.reduce((sum, c) => sum + c.sentCount, 0),
    avgDeliveryRate: 98
  }

  return (
    
      <div className="space-y-6 p-6">
        <PageHeader
          title="Campaigns"
          description="Broadcast messages to your contacts"
          actions={
            <Button asChild>
              <Link href="/campaigns/create">
                <Plus className="mr-2 h-4 w-4" />
                New Campaign
              </Link>
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard
            title="Total Campaigns"
            value={stats.totalCampaigns}
            icon={Megaphone}
            description="All time"
          />
          <StatsCard
            title="Active"
            value={stats.activeCampaigns}
            icon={Clock}
            description="Sending or scheduled"
          />
          <StatsCard
            title="Messages Sent"
            value={stats.totalSent.toLocaleString()}
            icon={Send}
            description="This month"
          />
          <StatsCard
            title="Delivery Rate"
            value={`${stats.avgDeliveryRate}%`}
            icon={Users}
            description="Average"
            trend={{ value: 2.5, isPositive: true }}
          />
        </div>

        {/* Campaigns List */}
        <div className="space-y-4">
          {mockCampaigns.length > 0 ? (
            mockCampaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{campaign.name}</CardTitle>
                      <CardDescription>
                        Created {new Date(campaign.createdAt).toLocaleDateString()}
                        {campaign.scheduledFor && (
                          <> • Scheduled for {new Date(campaign.scheduledFor).toLocaleString()}</>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        campaign.status === 'SENT' ? 'secondary' :
                          campaign.status === 'SENDING' ? 'default' :
                            campaign.status === 'SCHEDULED' ? 'outline' : 'secondary'
                      }>
                        {campaign.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          {campaign.status === 'DRAFT' && (
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress */}
                    {campaign.status === 'SENDING' || campaign.status === 'SENT' ? (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">
                              {campaign.sentCount} / {campaign.targetCount}
                            </span>
                          </div>
                          <Progress value={(campaign.sentCount / campaign.targetCount) * 100} />
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Sent</p>
                            <p className="text-2xl font-bold">{campaign.sentCount}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Delivered</p>
                            <p className="text-2xl font-bold">{campaign.deliveredCount}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Delivery Rate</p>
                            <p className="text-2xl font-bold">
                              {Math.round((campaign.deliveredCount / campaign.sentCount) * 100)}%
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Target: {campaign.targetCount} contacts</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState
              icon={Megaphone}
              title="No campaigns yet"
              description="Create your first campaign to send broadcast messages"
              action={{
                label: 'Create Campaign',
                onClick: () => router.push('/campaigns/create')
              }}
            />
          )}
        </div>
      </div>
    
  )
}

