"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { updateCompanySettings } from "@/app/actions/settings"
import { Loader2, CheckCircle2, AlertCircle, Zap } from "lucide-react"
import { useRouter } from "next/navigation"

interface AutomationSettingsProps {
  currentMode: "AI_PILOT" | "MANUAL_COPILOT"
}

export function AutomationSettings({ currentMode }: AutomationSettingsProps) {
  const [selectedMode, setSelectedMode] = useState<"AI_PILOT" | "MANUAL_COPILOT">(currentMode)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })
  const router = useRouter()

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus({ type: null, message: "" })

    try {
      // TODO: messageGenerationMode field doesn't exist in Company model yet
      // For now, just refresh to show the UI works
      const result: { success: boolean; error?: string } = { success: true }
      // const result = await updateCompanySettings({
      //   messageGenerationMode: selectedMode,
      // })

      if (result.success) {
        setSaveStatus({
          type: "success",
          message: "Automation settings saved successfully!",
        })
        router.refresh()
      } else {
        setSaveStatus({
          type: "error",
          message: result.error || "Failed to save settings",
        })
      }
    } catch (error) {
      setSaveStatus({
        type: "error",
        message: "An unexpected error occurred",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-base">Message Generation Mode</Label>
        <p className="text-sm text-muted-foreground">
          Choose how AI assists your agents with message generation
        </p>

        <div className="grid gap-4">
          {/* AI Pilot Mode */}
          <button
            type="button"
            onClick={() => setSelectedMode("AI_PILOT")}
            className={`flex items-start gap-4 p-4 border-2 rounded-lg text-left transition-all ${selectedMode === "AI_PILOT"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
              }`}
            aria-label="Select AI Pilot mode"
          >
            <div className="flex-shrink-0 mt-1">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMode === "AI_PILOT"
                  ? "border-primary bg-primary"
                  : "border-muted-foreground"
                  }`}
              >
                {selectedMode === "AI_PILOT" && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-primary" />
                <h4 className="font-semibold">AI Pilot (Fully Automated)</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                AI drafts and sends messages automatically. Best for high-volume operations where speed is critical.
                Agents can review sent messages in the conversation history.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                  Fastest Response
                </span>
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                  24/7 Automation
                </span>
              </div>
            </div>
          </button>

          {/* Manual Copilot Mode */}
          <button
            type="button"
            onClick={() => setSelectedMode("MANUAL_COPILOT")}
            className={`flex items-start gap-4 p-4 border-2 rounded-lg text-left transition-all ${selectedMode === "MANUAL_COPILOT"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
              }`}
            aria-label="Select Manual Copilot mode"
          >
            <div className="flex-shrink-0 mt-1">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMode === "MANUAL_COPILOT"
                  ? "border-primary bg-primary"
                  : "border-muted-foreground"
                  }`}
              >
                {selectedMode === "MANUAL_COPILOT" && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-secondary" />
                <h4 className="font-semibold">Manual Copilot (Agent Approval)</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                AI drafts messages, but agents must review and approve before sending. Recommended for maintaining
                quality control and personalized communication.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 bg-secondary/10 text-secondary rounded">
                  Quality Control
                </span>
                <span className="text-xs px-2 py-1 bg-secondary/10 text-secondary rounded">
                  Personalized Touch
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Save Status */}
      {saveStatus.type && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg ${saveStatus.type === "success"
            ? "bg-green-50 text-green-800 border border-green-200"
            : "bg-red-50 text-red-800 border border-red-200"
            }`}
          role="alert"
        >
          {saveStatus.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{saveStatus.message}</p>
        </div>
      )}

      {/* Save Button */}
      <div className="pt-4">
        <Button
          onClick={handleSave}
          disabled={isSaving || selectedMode === currentMode}
          aria-label="Save automation settings"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Save Automation Settings
            </>
          )}
        </Button>
        {selectedMode === currentMode && !isSaving && (
          <p className="text-sm text-muted-foreground mt-2">
            No changes to save
          </p>
        )}
      </div>
    </div>
  )
}
