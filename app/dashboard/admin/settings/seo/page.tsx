"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { Loader2, Save } from "lucide-react"

export default function SEOSettingsPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        seoMetaTitle: "",
        seoMetaDescription: "",
        seoKeywords: "",
        seoOgImageUrl: "",
        googleAnalyticsId: "",
        googleSearchConsoleCode: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch("/api/admin/settings/seo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    seoKeywords: formData.seoKeywords.split(',').map(k => k.trim()).filter(Boolean)
                })
            })

            if (!response.ok) throw new Error("Failed to save settings")

            alert("SEO settings saved successfully!")
            router.refresh()
        } catch (error) {
            console.error("Save error:", error)
            alert("Failed to save settings. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">SEO Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Optimize your website for search engines
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Meta Tags</CardTitle>
                        <CardDescription>
                            Configure your website's meta title, description, and keywords for better SEO
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="metaTitle">Meta Title</Label>
                            <Input
                                id="metaTitle"
                                placeholder="Your Company Name - Real Estate CRM"
                                value={formData.seoMetaTitle}
                                onChange={(e) => setFormData({ ...formData, seoMetaTitle: e.target.value })}
                                maxLength={60}
                            />
                            <p className="text-xs text-muted-foreground">
                                Keep it under 60 characters for best results
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="metaDescription">Meta Description</Label>
                            <Textarea
                                id="metaDescription"
                                placeholder="Brief description of your company and services..."
                                value={formData.seoMetaDescription}
                                onChange={(e) => setFormData({ ...formData, seoMetaDescription: e.target.value })}
                                rows={3}
                                maxLength={160}
                            />
                            <p className="text-xs text-muted-foreground">
                                Keep it under 160 characters
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="keywords">Keywords</Label>
                            <Input
                                id="keywords"
                                placeholder="real estate, Dubai, CRM, property management"
                                value={formData.seoKeywords}
                                onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Separate keywords with commas
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ogImage">OpenGraph Image URL</Label>
                            <Input
                                id="ogImage"
                                placeholder="https://example.com/og-image.jpg"
                                value={formData.seoOgImageUrl}
                                onChange={(e) => setFormData({ ...formData, seoOgImageUrl: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Recommended: 1200x630px
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Analytics & Tracking</CardTitle>
                        <CardDescription>
                            Connect your Google Analytics and Search Console accounts
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="gaId">Google Analytics ID</Label>
                            <Input
                                id="gaId"
                                placeholder="G-XXXXXXXXXX"
                                value={formData.googleAnalyticsId}
                                onChange={(e) => setFormData({ ...formData, googleAnalyticsId: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Your GA4 Measurement ID
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="gscCode">Google Search Console Verification Code</Label>
                            <Input
                                id="gscCode"
                                placeholder="verification code"
                                value={formData.googleSearchConsoleCode}
                                onChange={(e) => setFormData({ ...formData, googleSearchConsoleCode: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Paste the verification code from Search Console
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
