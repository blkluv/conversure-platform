/**
 * Knowledge Base - Portals Management
 * 
 * Manage help center portals
 */

'use client'

import { DashboardLayout } from '@/components/layout'
import { PageHeader, EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, BookOpen, FileText } from 'lucide-react'
import Link from 'next/link'

const mockPortals = [
    { id: '1', name: 'Help Center', slug: 'help', articleCount: 45, categoryCount: 8, published: true },
    { id: '2', name: 'Product Guides', slug: 'guides', articleCount: 23, categoryCount: 5, published: false }
]

export default function KnowledgeBasePage() {
    return (
        <DashboardLayout>
            <div className="space-y-6 p-6">
                <PageHeader
                    title="Knowledge Base"
                    description="Manage help centers and documentation"
                    actions={
                        <Button asChild>
                            <Link href="/knowledge-base/portals/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Portal
                            </Link>
                        </Button>
                    }
                />

                {mockPortals.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {mockPortals.map((portal) => (
                            <Card key={portal.id} className="cursor-pointer hover:bg-accent" asChild>
                                <Link href={`/knowledge-base/portals/${portal.id}`}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <BookOpen className="h-5 w-5" />
                                                {portal.name}
                                            </span>
                                            <Badge variant={portal.published ? 'default' : 'secondary'}>
                                                {portal.published ? 'Published' : 'Draft'}
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription>/{portal.slug}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span>{portal.articleCount} articles</span>
                                            <span>•</span>
                                            <span>{portal.categoryCount} categories</span>
                                        </div>
                                    </CardContent>
                                </Link>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={BookOpen}
                        title="No portals yet"
                        description="Create a help center to organize your articles"
                        action={{ label: 'Create Portal', onClick: () => { } }}
                    />
                )}
            </div>
        </DashboardLayout>
    )
}
