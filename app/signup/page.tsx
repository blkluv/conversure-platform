import { SignupForm } from "@/components/auth/signup-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Logo } from "@/components/Logo"

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-2xl space-y-6 relative z-10">
        <div className="text-center space-y-2 animate-slideDown">
          <Logo href="/" variant="full" size="md" className="mb-4 hover:opacity-80 transition-opacity" />
          <h1 className="text-4xl font-bold">Create Your Company Account</h1>
          <p className="text-muted-foreground text-lg">Start your 14-day free trial. No credit card required.</p>
        </div>

        <Card className="shadow-premium-lg glass-strong border-2 animate-scaleIn">
          <CardHeader>
            <CardTitle className="text-2xl">Company Registration</CardTitle>
            <CardDescription>Set up your real estate company on Conversure</CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground animate-fadeIn" style={{ animationDelay: '0.3s' }}>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline interactive-button">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
