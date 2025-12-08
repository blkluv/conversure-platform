import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ContactForm from "@/components/ContactForm"
import { MapPin, Mail, Phone, MessageSquare, ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Contact Us - Conversure",
  description: "Get in touch with Conversure. Book a demo or reach out to our sales team for UAE real estate CRM solutions.",
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">Conversure</span>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Get in Touch
            </h1>
            <p className="text-xl text-muted-foreground">
              Ready to transform your real estate business? We're here to help.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information & Form */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {/* Office Address */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>Office Address</CardTitle>
                <CardDescription>Visit us in Dubai</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Dubai Internet City<br />
                  Building 10, Office 234<br />
                  Dubai, United Arab Emirates
                </p>
              </CardContent>
            </Card>

            {/* Email Support */}
            <Card className="border-2 hover:border-secondary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary/80 rounded-lg flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-secondary-foreground" />
                </div>
                <CardTitle>Email Support</CardTitle>
                <CardDescription>We'll respond within 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <a 
                  href="mailto:support@conversure.ae" 
                  className="text-sm text-primary hover:underline block mb-2"
                >
                  support@conversure.ae
                </a>
                <a 
                  href="mailto:abdallah@betaedgetech.com" 
                  className="text-sm text-primary hover:underline block"
                >
                  abdallah@betaedgetech.com
                </a>
              </CardContent>
            </Card>

            {/* Sales Inquiry */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center mb-4">
                  <Phone className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>Sales Inquiry</CardTitle>
                <CardDescription>Speak with our team</CardDescription>
              </CardHeader>
              <CardContent>
                <a 
                  href="tel:+971501234567" 
                  className="text-sm text-primary hover:underline block mb-2"
                >
                  +971 50 123 4567
                </a>
                <p className="text-xs text-muted-foreground">
                  Monday - Friday: 9:00 AM - 6:00 PM GST
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="max-w-3xl mx-auto">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Additional Info */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold">Why Choose Conversure?</h2>
            <p className="text-lg text-muted-foreground">
              Join leading UAE real estate agencies using our AI-powered WhatsApp CRM to automate conversations, 
              manage leads, and close deals faster.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/signup">
                <Button size="lg" className="text-base px-8">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="outline" className="text-base px-8">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Conversure. All rights reserved. Built for UAE Real Estate.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
