/**
 * Company Settings Page
 * 
 * Company profile and configuration
 */

'use client'


import { PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function CompanySettingsPage() {
    return (
        
            <div className="space-y-6 p-6">
                <PageHeader
                    title="Company Settings"
                    description="Manage your company profile"
                />

                <form className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Company Information</CardTitle>
                            <CardDescription>Basic company details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Company Name</Label>
                                <Input id="companyName" defaultValue="Acme Real Estate" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="domain">Domain</Label>
                                <Input id="domain" defaultValue="acme-realestate" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input id="city" defaultValue="Dubai" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="whatsapp">WhatsApp Business Number</Label>
                                <Input id="whatsapp" defaultValue="+971501234567" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>AI Settings</CardTitle>
                            <CardDescription>Configure AI assistant</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="tone">AI Tone</Label>
                                <Input id="tone" defaultValue="Friendly and Professional" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="languages">Supported Languages</Label>
                                <Input id="languages" defaultValue="en,ar" />
                            </div>
                        </CardContent>
                    </Card>

                    <Button type="submit">
                        Save Changes
                    </Button>
                </form>
            </div>
        
    )
}
