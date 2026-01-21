'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BarChart3, Save, CheckCircle2, AlertCircle } from 'lucide-react'

interface Bitrix24SettingsFormProps {
    initialData: {
        bitrixDomain?: string | null
        bitrixWebhookUrl?: string | null
    }
}

export function Bitrix24SettingsForm({ initialData }: Bitrix24SettingsFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const [formData, setFormData] = useState({
        bitrixDomain: initialData.bitrixDomain || '',
        bitrixWebhookUrl: initialData.bitrixWebhookUrl || '',
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
                setMessage({ type: 'success', text: data.message || 'Bitrix24 settings saved!' })
                setTimeout(() => window.location.reload(), 1000)
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save Bitrix24 settings' })
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
                    <BarChart3 className="w-5 h-5" />
                    Bitrix24 CRM Integration
                </CardTitle>
                <CardDescription>
                    Connect your Bitrix24 CRM for automatic lead sync
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bitrix-domain">Bitrix24 Domain</Label>
                            <Input
                                id="bitrix-domain"
                                value={formData.bitrixDomain}
                                onChange={(e) => setFormData({ ...formData, bitrixDomain: e.target.value })}
                                placeholder="yourcompany.bitrix24.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bitrix-webhook">Webhook URL</Label>
                            <Input
                                id="bitrix-webhook"
                                type="password"
                                value={formData.bitrixWebhookUrl}
                                onChange={(e) => setFormData({ ...formData, bitrixWebhookUrl: e.target.value })}
                                placeholder="https://yourcompany.bitrix24.com/rest/..."
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
                                Save Bitrix24 Settings
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
