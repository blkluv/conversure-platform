/**
 * CSAT Page
 * 
 * Customer satisfaction surveys and metrics
 */

'use client'


import { PageHeader, StatsCard } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ThumbsUp, ThumbsDown, Meh, TrendingUp } from 'lucide-react'

export default function CSATPage() {
    return (
        
            <div className="space-y-6 p-6">
                <PageHeader
                    title="Customer Satisfaction"
                    description="Track customer feedback and ratings"
                />

                <div className="grid gap-4 md:grid-cols-4">
                    <StatsCard
                        title="Total Responses"
                        value="248"
                        icon={ThumbsUp}
                        description="Last 30 days"
                    />
                    <StatsCard
                        title="Average Rating"
                        value="4.2"
                        icon={TrendingUp}
                        trend={{ value: 5.2, isPositive: true }}
                        description="Out of 5"
                    />
                    <StatsCard
                        title="Positive"
                        value="82%"
                        icon={ThumbsUp}
                        description="Ratings 4-5"
                    />
                    <StatsCard
                        title="Negative"
                        value="8%"
                        icon={ThumbsDown}
                        description="Ratings 1-2"
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Feedback</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 border-b pb-4 last:border-0">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                                    <ThumbsUp className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">Great service!</p>
                                    <p className="text-sm text-muted-foreground">Very helpful and professional</p>
                                    <p className="mt-1 text-xs text-muted-foreground">Mohammed Ali • 2 hours ago</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        
    )
}
