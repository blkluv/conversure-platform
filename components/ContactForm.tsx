"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { submitContactForm } from "@/app/actions/contact"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    identity: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus({ type: null, message: "" })

    // Client-side validation
    if (!formData.name || !formData.email || !formData.phone || !formData.identity) {
      setSubmitStatus({
        type: "error",
        message: "Please fill in all fields",
      })
      setIsSubmitting(false)
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setSubmitStatus({
        type: "error",
        message: "Please enter a valid email address",
      })
      setIsSubmitting(false)
      return
    }

    // Phone validation (basic)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    if (!phoneRegex.test(formData.phone)) {
      setSubmitStatus({
        type: "error",
        message: "Please enter a valid phone number",
      })
      setIsSubmitting(false)
      return
    }

    try {
      const result = await submitContactForm(formData)

      if (result.success) {
        setSubmitStatus({
          type: "success",
          message: "Thank you! We'll get back to you within 24 hours.",
        })
        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          identity: "",
        })
      } else {
        setSubmitStatus({
          type: "error",
          message: result.error || "Something went wrong. Please try again.",
        })
      }
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: "Failed to submit form. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto border-2 shadow-xl">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Book a Demo
        </CardTitle>
        <CardDescription className="text-base">
          See how Conversure can transform your real estate business. Fill out the form below and we'll reach out to
          schedule a personalized demo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name *
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSubmitting}
              className="h-11"
              aria-label="Full Name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address *
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isSubmitting}
              className="h-11"
              aria-label="Email Address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number *
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+971 55 952 8781"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={isSubmitting}
              className="h-11"
              aria-label="Phone Number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="identity" className="text-sm font-medium">
              I am a *
            </Label>
            <Select
              value={formData.identity}
              onValueChange={(value) => setFormData({ ...formData, identity: value })}
              disabled={isSubmitting}
              required
            >
              <SelectTrigger id="identity" className="h-11" aria-label="Identity Selection">
                <SelectValue placeholder="Select your identity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company">Real Estate Company</SelectItem>
                <SelectItem value="agent">Individual Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {submitStatus.type && (
            <div
              className={`flex items-center gap-2 p-4 rounded-lg ${submitStatus.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
                }`}
              role="alert"
            >
              {submitStatus.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="text-sm font-medium">{submitStatus.message}</p>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full h-12 text-base font-semibold"
            disabled={isSubmitting}
            aria-label="Submit Contact Form"
            id="contact-form-submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              "Book Your Demo"
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By submitting this form, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
