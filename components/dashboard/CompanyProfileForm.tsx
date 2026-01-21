'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, Save, CheckCircle2, AlertCircle } from 'lucide-react'

interface CompanyProfileFormProps {
    initialData: {
        name?: string
        domain?: string | null
        city?: string | null
        country?: string
    }
}

export function CompanyProfileForm({ initialData }: CompanyProfileFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const [formData, setFormData] = useState({
        name: initialData.name || '',
        domain: initialData.domain || '',
        city: initialData.city || '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage(null)

        try {
            const response = await fetch('/api/company/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (response.ok) {
                setMessage({ type: 'success', text: data.message || 'Settings saved successfully!' })
                // Refresh page after 1 second
                setTimeout(() => window.location.reload(), 1000)
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save settings' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error. Please try again.' })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Company Profile
                </CardTitle>
                <CardDescription>
                    Update your company information and branding
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="company-name">Company Name</Label>
                            <Input
                                id="company-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Your Company Name"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="company-domain">Domain</Label>
                            <Input
                                id="company-domain"
                                value={formData.domain}
                                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                placeholder="yourcompany.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                placeholder="Dubai"
                            />
                        </div>
                    </div>

                    {message && (
                        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                            {message.type === 'success' ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : (
                                <AlertCircle className="h-4 w-4" />
                            )}
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>Saving...</>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
