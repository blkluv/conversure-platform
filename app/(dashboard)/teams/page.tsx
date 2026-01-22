/**
 * Teams List Page
 * 
 * Team management with member counts
 */

'use client'


import { PageHeader, EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Plus, Users, MoreVertical } from 'lucide-react'
import Link from 'next/link'

const mockTeams = [
    { id: '1', name: 'Sales Team', description: 'Primary sales agents', memberCount: 5, allowAutoAssign: true },
    { id: '2', name: 'Support Team', description: 'Customer support', memberCount: 3, allowAutoAssign: false }
]

export default function TeamsPage() {
    return (
        
            <div className="space-y-6 p-6">
                <PageHeader
                    title="Teams"
                    description="Organize agents into teams"
                    actions={
                        <Button asChild>
                            <Link href="/teams/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Team
                            </Link>
                        </Button>
                    }
                />

                {mockTeams.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {mockTeams.map((team) => (
                            <Card key={team.id} className="cursor-pointer hover:bg-accent">
                                <Link href={`/teams/${team.id}`}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            {team.name}
                                            {team.allowAutoAssign && (
                                                <Badge variant="secondary" className="text-xs">Auto-assign</Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription>{team.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Users className="h-4 w-4" />
                                            <span>{team.memberCount} members</span>
                                        </div>
                                    </CardContent>
                                </Link>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={Users}
                        title="No teams yet"
                        description="Create teams to organize your agents"
                        action={{ label: 'Create Team', onClick: () => { } }}
                    />
                )}
            </div>
        
    )
}


