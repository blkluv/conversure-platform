"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2 } from "lucide-react"
import { WhatsAppSetupStep } from "./whatsapp-setup-step"
import { BitrixSetupStep } from "./bitrix-setup-step"
import { WarmupSetupStep } from "./warmup-setup-step"

interface OnboardingWizardProps {
  companyId: string
}

export function OnboardingWizard({ companyId }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const steps = [
    { number: 1, title: "WhatsApp Setup", description: "Connect your WhatsApp Business API" },
    { number: 2, title: "Bitrix24 Integration", description: "Link your CRM" },
    { number: 3, title: "Messaging Warm-up", description: "Configure warm-up plan" },
  ]

  const handleStepComplete = (stepNumber: number) => {
    if (!completedSteps.includes(stepNumber)) {
      setCompletedSteps([...completedSteps, stepNumber])
    }

    if (stepNumber < 3) {
      setCurrentStep(stepNumber + 1)
    } else {
      // All steps completed, redirect to dashboard
      window.location.href = "/dashboard/admin"
    }
  }

  const progress = (completedSteps.length / 3) * 100

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {currentStep} of 3</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                  completedSteps.includes(step.number)
                    ? "bg-primary border-primary text-primary-foreground"
                    : currentStep === step.number
                      ? "border-primary text-primary"
                      : "border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {completedSteps.includes(step.number) ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <span className="text-lg font-semibold">{step.number}</span>
                )}
              </div>
              <div className="text-center mt-2">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground hidden sm:block">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-4 transition-colors ${
                  completedSteps.includes(step.number) ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && <WhatsAppSetupStep companyId={companyId} onComplete={() => handleStepComplete(1)} />}
          {currentStep === 2 && <BitrixSetupStep companyId={companyId} onComplete={() => handleStepComplete(2)} />}
          {currentStep === 3 && <WarmupSetupStep companyId={companyId} onComplete={() => handleStepComplete(3)} />}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        <Button variant="ghost" onClick={() => (window.location.href = "/dashboard/admin")}>
          Skip for Now
        </Button>
      </div>
    </div>
  )
}
