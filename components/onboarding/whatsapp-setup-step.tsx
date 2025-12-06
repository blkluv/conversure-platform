"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Copy, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const whatsappSchema = z.object({
  whatsappBusinessNumber: z.string().min(10, "Please enter a valid phone number"),
  wabaProvider: z.string().min(1, "Please select a provider"),
  wabaApiKey: z.string().min(1, "API key is required"),
})

type WhatsAppFormData = z.infer<typeof whatsappSchema>

interface WhatsAppSetupStepProps {
  companyId: string
  onComplete: () => void
}

export function WhatsAppSetupStep({ companyId, onComplete }: WhatsAppSetupStepProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<WhatsAppFormData>({
    resolver: zodResolver(whatsappSchema),
  })

  const onSubmit = async (data: WhatsAppFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/onboarding/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, companyId }),
      })

      if (response.ok) {
        const result = await response.json()
        setWebhookUrl(result.webhookUrl)

        // Auto-proceed after 2 seconds
        setTimeout(() => {
          onComplete()
        }, 2000)
      } else {
        alert("Setup failed. Please try again.")
      }
    } catch (error) {
      alert("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTitle>WhatsApp Business API Required</AlertTitle>
        <AlertDescription>
          You need a WhatsApp Business API account from providers like 360dialog, Twilio, or Meta Cloud API. Don't have
          one? Contact us for assistance.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="whatsappBusinessNumber">WhatsApp Business Number *</Label>
          <Input
            id="whatsappBusinessNumber"
            type="tel"
            placeholder="+971501234567"
            {...register("whatsappBusinessNumber")}
          />
          {errors.whatsappBusinessNumber && (
            <p className="text-sm text-destructive">{errors.whatsappBusinessNumber.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="wabaProvider">WABA Provider *</Label>
          <Select onValueChange={(value) => setValue("wabaProvider", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select your provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="360dialog">360dialog</SelectItem>
              <SelectItem value="Twilio">Twilio</SelectItem>
              <SelectItem value="Meta Cloud API">Meta Cloud API</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.wabaProvider && <p className="text-sm text-destructive">{errors.wabaProvider.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="wabaApiKey">API Key *</Label>
          <Input id="wabaApiKey" type="password" placeholder="Enter your WABA API key" {...register("wabaApiKey")} />
          <p className="text-xs text-muted-foreground">This will be encrypted and stored securely</p>
          {errors.wabaApiKey && <p className="text-sm text-destructive">{errors.wabaApiKey.message}</p>}
        </div>

        {webhookUrl && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">Setup Successful!</AlertTitle>
            <AlertDescription className="text-green-800">
              <p className="mb-2">Copy this webhook URL and paste it in your WABA provider dashboard:</p>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 p-2 bg-white rounded text-xs border">{webhookUrl}</code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(webhookUrl)}
                  className="shrink-0"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={isLoading || webhookUrl !== null}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {webhookUrl ? "Completed" : "Save & Continue"}
        </Button>
      </form>
    </div>
  )
}
