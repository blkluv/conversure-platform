"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Check, Building2, User, Lock, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

const signupSchema = z
  .object({
    companyName: z.string().min(2, "Company name must be at least 2 characters"),
    domain: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
    country: z.string().min(1, "Country is required"),
    city: z.string().min(1, "City is required"),
    adminName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    phone: z.string().min(8, "Please enter a valid phone number"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type SignupFormData = z.infer<typeof signupSchema>

const steps = [
  { id: 1, name: "Company Info", icon: Building2 },
  { id: 2, name: "Admin Details", icon: User },
  { id: 3, name: "Security", icon: Lock },
]

export function SignupForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      country: "UAE",
    },
    mode: "onChange",
  })

  const password = watch("password", "")

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" }
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    if (strength <= 1) return { strength: 25, label: "Weak", color: "bg-red-500" }
    if (strength === 2) return { strength: 50, label: "Fair", color: "bg-yellow-500" }
    if (strength === 3) return { strength: 75, label: "Good", color: "bg-blue-500" }
    return { strength: 100, label: "Strong", color: "bg-green-500" }
  }

  const passwordStrength = getPasswordStrength(password)

  const nextStep = async () => {
    let fieldsToValidate: (keyof SignupFormData)[] = []

    if (currentStep === 1) {
      fieldsToValidate = ["companyName", "domain", "country", "city"]
    } else if (currentStep === 2) {
      fieldsToValidate = ["adminName", "email", "phone"]
    }

    const isValid = await trigger(fieldsToValidate)
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        window.location.href = "/onboarding"
      } else {
        const error = await response.json()
        alert(error.message || "Signup failed. Please try again.")
      }
    } catch (error) {
      alert("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Step Progress Indicator */}
      <div className="relative">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isComplete = step.id < currentStep
            const isCurrent = step.id === currentStep

            return (
              <div key={step.id} className="flex flex-col items-center flex-1 relative">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    isComplete && "bg-green-600 text-white shadow-lg scale-110",
                    isCurrent && "bg-primary text-primary-foreground shadow-premium animate-pulse-slow ring-4 ring-primary/20",
                    !isComplete && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={cn(
                  "text-xs mt-2 font-medium transition-colors",
                  (isCurrent || isComplete) && "text-foreground",
                  !isComplete && !isCurrent && "text-muted-foreground"
                )}>
                  {step.name}
                </span>

                {index < steps.length - 1 && (
                  <div className="absolute top-5 left-1/2 w-full h-0.5 -z-10">
                    <div className={cn(
                      "h-full transition-all duration-500",
                      isComplete ? "bg-green-600" : "bg-muted"
                    )} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Form Steps */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Company Info */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-slideInRight">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="Elite Properties UAE"
                {...register("companyName")}
                className="transition-all focus:scale-[1.01]"
                autoFocus
              />
              {errors.companyName && <p className="text-sm text-destructive animate-slideDown">{errors.companyName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Company Website</Label>
              <Input
                id="domain"
                type="url"
                placeholder="https://eliteproperties.ae"
                {...register("domain")}
                className="transition-all focus:scale-[1.01]"
              />
              {errors.domain && <p className="text-sm text-destructive animate-slideDown">{errors.domain.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Select defaultValue="UAE" onValueChange={(value) => setValue("country", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UAE">UAE</SelectItem>
                    <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                    <SelectItem value="Qatar">Qatar</SelectItem>
                    <SelectItem value="Kuwait">Kuwait</SelectItem>
                  </SelectContent>
                </Select>
                {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="Dubai"
                  {...register("city")}
                  className="transition-all focus:scale-[1.01]"
                />
                {errors.city && <p className="text-sm text-destructive animate-slideDown">{errors.city.message}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Admin Details */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-slideInRight">
            <div className="space-y-2">
              <Label htmlFor="adminName">Full Name *</Label>
              <Input
                id="adminName"
                placeholder="Ahmed Al Mansouri"
                {...register("adminName")}
                className="transition-all focus:scale-[1.01]"
                autoFocus
              />
              {errors.adminName && <p className="text-sm text-destructive animate-slideDown">{errors.adminName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@eliteproperties.ae"
                {...register("email")}
                className="transition-all focus:scale-[1.01]"
              />
              {errors.email && <p className="text-sm text-destructive animate-slideDown">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+971501234567"
                {...register("phone")}
                className="transition-all focus:scale-[1.01]"
              />
              {errors.phone && <p className="text-sm text-destructive animate-slideDown">{errors.phone.message}</p>}
            </div>
          </div>
        )}

        {/* Step 3: Security */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-slideInRight">
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 characters"
                {...register("password")}
                className="transition-all focus:scale-[1.01]"
                autoFocus
              />
              {errors.password && <p className="text-sm text-destructive animate-slideDown">{errors.password.message}</p>}

              {password && (
                <div className="space-y-1 animate-slideDown">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Strength:</span>
                    <span className={cn(
                      "font-medium",
                      passwordStrength.strength === 100 && "text-green-600",
                      passwordStrength.strength === 75 && "text-blue-600",
                      passwordStrength.strength === 50 && "text-yellow-600",
                      passwordStrength.strength === 25 && "text-red-600"
                    )}>{passwordStrength.label}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all duration-500", passwordStrength.color)}
                      style={{ width: `${passwordStrength.strength}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                className="transition-all focus:scale-[1.01]"
              />
              {errors.confirmPassword && <p className="text-sm text-destructive animate-slideDown">{errors.confirmPassword.message}</p>}
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2 animate-slideUp">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-4">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="interactive-button"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}

          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="flex-1 interactive-button gradient-primary"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              className="flex-1 interactive-button gradient-primary"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          )}
        </div>

        {currentStep === 3 && (
          <p className="text-xs text-center text-muted-foreground animate-fadeIn">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        )}
      </form>
    </div>
  )
}
