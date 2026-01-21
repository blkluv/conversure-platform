"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { Loader2, Upload, Save } from "lucide-react"

export default function BrandingSettingsPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        logoUrl: "",
        faviconUrl: "",
        primaryBrandColor: "#2563eb",
        secondaryBrandColor: "#06b6d4"
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch("/api/admin/settings/branding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })

            if (!response.ok) throw new Error("Failed to save settings")

            alert("Branding settings saved successfully!")
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
                <h1 className="text-3xl font-bold">Branding Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Customize your company's branding and visual identity
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Logo & Favicon</CardTitle>
                        <CardDescription>
                            Upload your company logo and favicon. Recommended: Logo (SVG or PNG, max 500KB), Favicon (16x16 or 32x32 ICO/PNG)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="logoUrl">Logo URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="logoUrl"
                                    placeholder="https://example.com/logo.png"
                                    value={formData.logoUrl}
                                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                                />
                                <Button type="button" variant="outline" size="icon">
                                    <Upload className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Enter the URL of your logo or click upload to select a file
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="faviconUrl">Favicon URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="faviconUrl"
                                    placeholder="https://example.com/favicon.ico"
                                    value={formData.faviconUrl}
                                    onChange={(e) => setFormData({ ...formData, faviconUrl: e.target.value })}
                                />
                                <Button type="button" variant="outline" size="icon">
                                    <Upload className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Brand Colors</CardTitle>
                        <CardDescription>
                            Set your primary and secondary brand colors. These will be used throughout the application.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="primaryColor">Primary Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="primaryColor"
                                        type="color"
                                        value={formData.primaryBrandColor}
                                        onChange={(e) => setFormData({ ...formData, primaryBrandColor: e.target.value })}
                                        className="h-10 w-20"
                                    />
                                    <Input
                                        value={formData.primaryBrandColor}
                                        onChange={(e) => setFormData({ ...formData, primaryBrandColor: e.target.value })}
                                        placeholder="#2563eb"
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="secondaryColor">Secondary Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="secondaryColor"
                                        type="color"
                                        value={formData.secondaryBrandColor}
                                        onChange={(e) => setFormData({ ...formData, secondaryBrandColor: e.target.value })}
                                        className="h-10 w-20"
                                    />
                                    <Input
                                        value={formData.secondaryBrandColor}
                                        onChange={(e) => setFormData({ ...formData, secondaryBrandColor: e.target.value })}
                                        placeholder="#06b6d4"
                                        className="flex-1"
                                    />
                                </div>
                            </div>
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
