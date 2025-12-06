"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Copy, CheckCircle2, ExternalLink } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const bitrixSchema = z.object({
  bitrixDomain: z.string().min(1, "Bitrix24 domain is required"),
  bitrixWebhookUrl: z.string().url("Please enter a valid webhook URL"),
  bitrixAccessToken: z.string().optional(),
})

type BitrixFormData = z.infer<typeof bitrixSchema>

interface BitrixSetupStepProps {
  companyId: string
  onComplete: () => void
}

export function BitrixSetupStep({ companyId, onComplete }: BitrixSetupStepProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [conversureWebhook, setConversureWebhook] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BitrixFormData>({
    resolver: zodResolver(bitrixSchema),
  })

  const onSubmit = async (data: BitrixFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/onboarding/bitrix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, companyId }),
      })

      if (response.ok) {
        const result = await response.json()
        setConversureWebhook(result.conversureWebhookUrl)

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
        <AlertTitle>Bitrix24 CRM Integration</AlertTitle>
        <AlertDescription>
          Connect your Bitrix24 account to automatically sync leads and conversations. Need help?{" "}
          <a
            href="https://www.bitrix24.com/apps/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline inline-flex items-center gap-1"
          >
            View Bitrix24 webhook guide
            <ExternalLink className="w-3 h-3" />
          </a>
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bitrixDomain">Bitrix24 Portal URL *</Label>
          <Input id="bitrixDomain" type="text" placeholder="yourcompany.bitrix24.com" {...register("bitrixDomain")} />
          <p className="text-xs text-muted-foreground">Your Bitrix24 portal domain (without https://)</p>
          {errors.bitrixDomain && <p className="text-sm text-destructive">{errors.bitrixDomain.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bitrixWebhookUrl">Bitrix24 Webhook URL *</Label>
          <Input
            id="bitrixWebhookUrl"
            type="url"
            placeholder="https://yourcompany.bitrix24.com/rest/1/webhook_key/"
            {...register("bitrixWebhookUrl")}
          />
          <p className="text-xs text-muted-foreground">
            Create a webhook in Bitrix24 Settings → Developer Tools → Webhooks
          </p>
          {errors.bitrixWebhookUrl && <p className="text-sm text-destructive">{errors.bitrixWebhookUrl.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bitrixAccessToken">Access Token (Optional)</Label>
          <Input
            id="bitrixAccessToken"
            type="password"
            placeholder="Enter access token if required"
            {...register("bitrixAccessToken")}
          />
        </div>

        {conversureWebhook && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">Integration Successful!</AlertTitle>
            <AlertDescription className="text-green-800">
              <p className="mb-2">Copy this Conversure webhook URL and add it to your Bitrix24 webhooks:</p>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 p-2 bg-white rounded text-xs border">{conversureWebhook}</code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(conversureWebhook)}
                  className="shrink-0"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs mt-2">Subscribe to events: ONCRMLEADADD, ONCRMLEADUPDATE, ONCRMDEALUPDATE</p>
            </AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={isLoading || conversureWebhook !== null}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {conversureWebhook ? "Completed" : "Save & Continue"}
        </Button>
      </form>
    </div>
  )
}
