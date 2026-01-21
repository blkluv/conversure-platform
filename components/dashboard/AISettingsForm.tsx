'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Zap, Save, CheckCircle2, AlertCircle } from 'lucide-react'

interface AISettingsFormProps {
    initialData: {
        aiEnabled?: boolean
        aiTone?: string | null
        aiLanguages?: string | null
    }
}

export function AISettingsForm({ initialData }: AISettingsFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const [formData, setFormData] = useState({
        aiEnabled: initialData.aiEnabled || false,
        aiTone: initialData.aiTone || 'professional',
        aiLanguages: initialData.aiLanguages || 'en,ar',
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
                setMessage({ type: 'success', text: data.message || 'AI settings saved!' })
                setTimeout(() => window.location.reload(), 1000)
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save AI settings' })
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
                    <Zap className="w-5 h-5" />
                    AI Configuration
                </CardTitle>
                <CardDescription>
                    Configure AI-powered features for your team
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>AI Suggestions</Label>
                            <p className="text-sm text-muted-foreground">
                                Enable AI-powered reply suggestions for agents
                            </p>
                        </div>
                        <Switch
                            checked={formData.aiEnabled}
                            onCheckedChange={(checked) => setFormData({ ...formData, aiEnabled: checked })}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="ai-tone">AI Tone</Label>
                            <Input
                                id="ai-tone"
                                value={formData.aiTone}
                                onChange={(e) => setFormData({ ...formData, aiTone: e.target.value })}
                                placeholder="professional, friendly, luxury"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ai-languages">Supported Languages</Label>
                            <Input
                                id="ai-languages"
                                value={formData.aiLanguages}
                                onChange={(e) => setFormData({ ...formData, aiLanguages: e.target.value })}
                                placeholder="en,ar"
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
                                Save AI Settings
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
