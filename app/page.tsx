import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, TrendingUp, Users, Zap, CheckCircle2, ArrowRight, BarChart3, Clock, Shield } from "lucide-react"
import ContactForm from "@/components/ContactForm"
import { PricingSection } from "@/components/PricingSection"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-foreground">Conversure</span>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="#features"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                How It Works
              </Link>
              <Link
                href="#pricing"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/contact"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="sm" aria-label="Log In to Conversure" id="nav-login-btn">
                  Log In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" aria-label="Start Free Trial" id="nav-signup-btn">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - PREMIUM ANIMATED */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border text-sm animate-slideDown">
              <Zap className="w-4 h-4 text-primary animate-pulse-slow" />
              <span className="text-muted-foreground">WhatsApp-Compliant AI for UAE Real Estate</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance animate-fadeIn">
              <span className="text-gradient">WhatsApp CRM & AI Copilot</span>
              <br />for UAE Real Estate Agents
            </h1>

            <p className="text-xl md:text-2xl font-semibold text-balance max-w-3xl mx-auto animate-slideUp" style={{ animationDelay: '0.1s' }}>
              Auto-draft replies, sync leads to Bitrix24, never miss a follow-up —
              all while staying WhatsApp-compliant
            </p>

            <p className="text-lg text-muted-foreground text-pretty max-w-3xl mx-auto animate-slideUp" style={{ animationDelay: '0.2s' }}>
              Conversure connects your WhatsApp Business API to your CRM,
              giving agents AI suggestions and admins full visibility.
              Used by UAE real estate agencies to close deals faster.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-slideUp" style={{ animationDelay: '0.3s' }}>
              <Link href="/signup">
                <Button
                  size="lg"
                  className="text-base px-8 shadow-premium hover:shadow-premium-lg interactive-button gradient-primary"
                  aria-label="Start Free Trial - Sign Up"
                  id="hero-signup-btn"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="#contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 bg-transparent border-2 hover:bg-primary/5 interactive-button"
                  aria-label="Book a Demo - Contact Us"
                  id="hero-demo-btn"
                >
                  Book Demo
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm animate-fadeIn" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="font-medium">WhatsApp Policy Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="font-medium">No Spam, No Bans</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>14-day free trial</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - OUTCOME-FOCUSED REWRITE */}
      <section id="features" className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">WhatsApp Automation That Prevents Bans</h2>
            <p className="text-lg text-muted-foreground">
              Built for UAE real estate with compliance, CRM sync, and AI that stays in control
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: WhatsApp Integration */}
            <Card
              className="border-2 hover:border-primary/50 interactive-card group cursor-pointer glass-strong shadow-premium"
              aria-label="WhatsApp Integration Feature"
              id="feature-whatsapp"
            >
              <CardHeader>
                <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                  <MessageSquare className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>Never Lose a Lead in WhatsApp Chaos</CardTitle>
                <CardDescription>
                  All conversations in one dashboard. Assign to agents, track status, search instantly.
                  Supports Meta WABA, Chatwoot, Evolution API.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2: Bitrix24 CRM */}
            <Card
              className="border-2 hover:border-secondary/50 transition-all duration-300 hover:shadow-lg group"
              aria-label="Bitrix24 CRM Sync Feature"
              id="feature-bitrix"
            >
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary/80 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-secondary-foreground" />
                </div>
                <CardTitle>Leads Flow to Your CRM Automatically</CardTitle>
                <CardDescription>
                  Every WhatsApp contact becomes a Bitrix24 lead. No manual data entry.
                  Full conversation history synced in real-time.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3: Agent Management */}
            <Card
              className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group"
              aria-label="Agent Management Feature"
              id="feature-agents"
            >
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>Empower Your Team Without Losing Control</CardTitle>
                <CardDescription>
                  Invite agents, assign leads, track performance.
                  Admins see everything. Agents stay focused on conversations.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4: Smart Warm-up */}
            <Card
              className="border-2 hover:border-secondary/50 transition-all duration-300 hover:shadow-lg group"
              aria-label="Smart Warm-up Feature"
              id="feature-warmup"
            >
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary/80 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-secondary-foreground" />
                </div>
                <CardTitle>Protect Your WhatsApp Number From Bans</CardTitle>
                <CardDescription>
                  We enforce WhatsApp's 24-hour policy, daily limits, and template compliance.
                  Your number stays safe. No spam, ever.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 5: Real-time Analytics */}
            <Card
              className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group"
              aria-label="Real-time Analytics Feature"
              id="feature-analytics"
            >
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>See Exactly What's Working (And What's Not)</CardTitle>
                <CardDescription>
                  Response times, conversion rates, agent performance.
                  Make data-driven decisions, not guesses.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 6: Template Messages */}
            <Card
              className="border-2 hover:border-secondary/50 transition-all duration-300 hover:shadow-lg group"
              aria-label="Template Messages Feature"
              id="feature-templates"
            >
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary/80 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-secondary-foreground" />
                </div>
                <CardTitle>Re-engage Leads After 24 Hours (Compliantly)</CardTitle>
                <CardDescription>
                  Send pre-approved templates for reminders, viewings, offers.
                  WhatsApp-compliant, admin-controlled.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* NEW SECTION: How AI Works */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How AI Replies Work (With Your Approval)</h2>
            <p className="text-lg text-muted-foreground">
              Conversure doesn't spam. AI drafts replies, agents approve.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <CardTitle className="mb-4">AI Drafts Reply</CardTitle>
                <CardDescription className="text-left">
                  When a lead messages, AI suggests a response based on:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Conversation history</li>
                    <li>Lead profile (budget, location)</li>
                    <li>Your company tone</li>
                  </ul>
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <CardTitle className="mb-4">Agent Reviews & Edits</CardTitle>
                <CardDescription className="text-left">
                  Notification sent to agent. They can:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Send as-is (one click)</li>
                    <li>Edit the draft</li>
                    <li>Write their own reply</li>
                  </ul>
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <CardTitle className="mb-4">You Stay in Control</CardTitle>
                <CardDescription className="text-left">
                  AI learns from approvals. Admins can:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Set AI tone (professional, friendly)</li>
                    <li>Disable AI anytime</li>
                    <li>Review all messages</li>
                  </ul>
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* NEW SECTION: WhatsApp Compliance */}
      <section className="py-16 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">WhatsApp-Compliant By Design</h2>
            <p className="text-lg text-muted-foreground">
              We protect your business number from bans and blocks
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">24-Hour Window</h3>
              <p className="text-sm text-muted-foreground">
                Enforced automatically. No messages sent after window expires.
              </p>
            </div>
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Daily Limits</h3>
              <p className="text-sm text-muted-foreground">
                Smart warm-up prevents bans. Gradual volume increase over 4 weeks.
              </p>
            </div>
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Opt-Out Honored</h3>
              <p className="text-sm text-muted-foreground">
                Automatic blocking when leads ask to stop. No manual work needed.
              </p>
            </div>
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Template Compliance</h3>
              <p className="text-sm text-muted-foreground">
                Only approved templates sent. Admins review before deployment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - KEEEP EXISTING */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">From Lead to Deal in 3 Steps</h2>
            <p className="text-lg text-muted-foreground">
              Get started in minutes — no technical expertise required
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                1
              </div>
              <h3 className="text-xl font-semibold">Connect Your WhatsApp</h3>
              <p className="text-muted-foreground">
                Link your WhatsApp Business API account in minutes. We support Meta WABA, Chatwoot, and Evolution API.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                2
              </div>
              <h3 className="text-xl font-semibold">Invite Your Team</h3>
              <p className="text-muted-foreground">
                Add agents, assign leads, set daily quotas. Each agent gets access to their assigned conversations.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                3
              </div>
              <h3 className="text-xl font-semibold">Start Closing Deals</h3>
              <p className="text-muted-foreground">
                AI suggests replies, you approve or edit. Leads auto-sync to Bitrix24. Track everything in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/30">
        <PricingSection />
      </section>

      {/* Contact Form */}
      <section id="contact" className="py-20">
        <ContactForm />
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</Link></li>
                <li><Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</Link></li>
                <li><Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">About</Link></li>
                <li><Link href="/careers" className="text-sm text-muted-foreground hover:text-foreground">Careers</Link></li>
                <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="/support" className="text-sm text-muted-foreground hover:text-foreground">Support</Link></li>
                <li><Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link></li>
                <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2025 Conversure. All rights reserved. Built for UAE Real Estate.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
