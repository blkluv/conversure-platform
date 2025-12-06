import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"
import { MessageSquare } from "lucide-react"

export default async function OnboardingPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  // Only admins can access onboarding
  if (session.role !== "COMPANY_ADMIN" && session.role !== "SUPER_ADMIN") {
    redirect("/dashboard/agent")
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-16">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">Conversure</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to Conversure!</h1>
          <p className="text-lg text-muted-foreground">
            Let's set up your WhatsApp and CRM integration in 3 easy steps
          </p>
        </div>

        <OnboardingWizard companyId={session.companyId} />
      </div>
    </div>
  )
}
