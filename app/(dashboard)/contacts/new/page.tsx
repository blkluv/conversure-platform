/**
 * Contact Create/Edit Form
 * 
 * Comprehensive form for creating and editing contacts
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function ContactFormPage() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        city: '',
        leadSource: '',
        leadStatus: 'NEW',
        budget: '',
        propertyType: ''
    })

    function handleChange(field: string, value: string) {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        startTransition(async () => {
            try {
                // Call server action here
                // const result = await createContact(formData)

                toast.success('Contact created successfully')
                router.push('/contacts')
            } catch (error) {
                toast.error('Failed to create contact')
            }
        })
    }

    return (
        
            <div className="space-y-6 p-6">
                <PageHeader
                    title="New Contact"
                    description="Add a new contact to your CRM"
                />

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                                <CardDescription>Contact details and identification</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        placeholder="john@example.com"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number *</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        placeholder="+971501234567"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        value={formData.city}
                                        onChange={(e) => handleChange('city', e.target.value)}
                                        placeholder="Dubai"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Lead Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Lead Information</CardTitle>
                                <CardDescription>Source, status, and qualification</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="leadSource">Lead Source</Label>
                                    <Select value={formData.leadSource} onValueChange={(v) => handleChange('leadSource', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select source" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="WEBSITE">Website</SelectItem>
                                            <SelectItem value="REFERRAL">Referral</SelectItem>
                                            <SelectItem value="SOCIAL">Social Media</SelectItem>
                                            <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                                            <SelectItem value="OTHER">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="leadStatus">Lead Status</Label>
                                    <Select value={formData.leadStatus} onValueChange={(v) => handleChange('leadStatus', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NEW">New</SelectItem>
                                            <SelectItem value="CONTACTED">Contacted</SelectItem>
                                            <SelectItem value="QUALIFIED">Qualified</SelectItem>
                                            <SelectItem value="WARM">Warm</SelectItem>
                                            <SelectItem value="HOT">Hot</SelectItem>
                                            <SelectItem value="COLD">Cold</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="budget">Budget</Label>
                                    <Input
                                        id="budget"
                                        value={formData.budget}
                                        onChange={(e) => handleChange('budget', e.target.value)}
                                        placeholder="AED 1,000,000"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="propertyType">Property Type</Label>
                                    <Select value={formData.propertyType} onValueChange={(v) => handleChange('propertyType', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="APARTMENT">Apartment</SelectItem>
                                            <SelectItem value="VILLA">Villa</SelectItem>
                                            <SelectItem value="TOWNHOUSE">Townhouse</SelectItem>
                                            <SelectItem value="PENTHOUSE">Penthouse</SelectItem>
                                            <SelectItem value="LAND">Land</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex items-center justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Contact
                        </Button>
                    </div>
                </form>
            </div>
        
    )
}

