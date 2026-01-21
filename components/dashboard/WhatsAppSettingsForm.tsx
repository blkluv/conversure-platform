'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MessageSquare, Save, CheckCircle2, AlertCircle } from 'lucide-react'

interface WhatsAppSettingsFormProps {
    initialData: {
        whatsappBusinessNumber?: string | null
        wabaProvider?: string | null
        wabaStatus?: string | null
        whatsappProvider?: string
    }
}

export function WhatsAppSettingsForm({ initialData }: WhatsAppSettingsFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const [formData, setFormData] = useState({
        whatsappBusinessNumber: initialData.whatsappBusinessNumber || '',
        wabaProvider: initialData.wabaProvider || '',
        whatsappProvider: initialData.whatsappProvider || 'WABA',
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
                setMessage({ type: 'success', text: data.message || 'WhatsApp settings saved!' })
                setTimeout(() => window.location.reload(), 1000)
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save WhatsApp settings' })
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
                    <MessageSquare className="w-5 h-5" />
                    WhatsApp Configuration
                </CardTitle>
                <CardDescription>
                    Manage your WhatsApp Business API settings
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Provider Selection */}
                    <div className="space-y-4">
                        <Label>WhatsApp Provider</Label>
                        <div className="grid gap-4">
                            <div
                                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${formData.whatsappProvider === 'WABA' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                                    }`}
                                onClick={() => setFormData({ ...formData, whatsappProvider: 'WABA' })}
                            >
                                <div>
                                    <h4 className="font-medium">WhatsApp Business API (WABA)</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Official Meta API - Best for high volume
                                    </p>
                                </div>
                                <Badge variant={formData.whatsappProvider === 'WABA' ? 'default' : 'outline'}>
                                    {formData.whatsappProvider === 'WABA' ? 'Selected' : 'Available'}
                                </Badge>
                            </div>

                            <div
                                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${formData.whatsappProvider === 'CHATWOOT' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                                    }`}
                                onClick={() => setFormData({ ...formData, whatsappProvider: 'CHATWOOT' })}
                            >
                                <div>
                                    <h4 className="font-medium">Chatwoot</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Open-source customer engagement platform
                                    </p>
                                </div>
                                <Badge variant={formData.whatsappProvider === 'CHATWOOT' ? 'default' : 'outline'}>
                                    {formData.whatsappProvider === 'CHATWOOT' ? 'Selected' : 'Available'}
                                </Badge>
                            </div>

                            <div
                                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${formData.whatsappProvider === 'EVOLUTION' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                                    }`}
                                onClick={() => setFormData({ ...formData, whatsappProvider: 'EVOLUTION' })}
                            >
                                <div>
                                    <h4 className="font-medium">Evolution API</h4>
                                    <p className="text-sm text-muted-foreground">
                                        WhatsApp Web gateway - Quick setup
                                    </p>
                                </div>
                                <Badge variant={formData.whatsappProvider === 'EVOLUTION' ? 'default' : 'outline'}>
                                    {formData.whatsappProvider === 'EVOLUTION' ? 'Selected' : 'Available'}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* WABA Credentials */}
                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="font-medium">WABA Credentials</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="waba-number">Business Phone Number</Label>
                                <Input
                                    id="waba-number"
                                    value={formData.whatsappBusinessNumber}
                                    onChange={(e) => setFormData({ ...formData, whatsappBusinessNumber: e.target.value })}
                                    placeholder="+971501234567"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="waba-provider">Provider</Label>
                                <Input
                                    id="waba-provider"
                                    value={formData.wabaProvider}
                                    onChange={(e) => setFormData({ ...formData, wabaProvider: e.target.value })}
                                    placeholder="360dialog, Twilio, Meta Cloud"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <div className="flex items-center gap-2">
                                {initialData.wabaStatus === 'ACTIVE' ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-amber-600" />
                                )}
                                <Badge variant={initialData.wabaStatus === 'ACTIVE' ? 'default' : 'secondary'}>
                                    {initialData.wabaStatus || 'PENDING'}
                                </Badge>
                            </div>
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
                                Save WhatsApp Settings
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
