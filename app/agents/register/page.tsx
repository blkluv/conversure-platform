import { AgentRegistrationForm } from "@/components/forms/agent-registration-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { MessageSquare } from "lucide-react"

export default function AgentRegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">Conversure</span>
          </Link>
          <h1 className="text-3xl font-bold">Become a Conversure Agent</h1>
          <p className="text-muted-foreground">Join leading UAE real estate agencies and accelerate your sales</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agent Registration</CardTitle>
            <CardDescription>Tell us about yourself and we'll help you get started</CardDescription>
          </CardHeader>
          <CardContent>
            <AgentRegistrationForm />
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
