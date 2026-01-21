'use client'

import { useState, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, UserPlus, Mail } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const agentInviteSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
})

const agentJoinSchema = z.object({
    companyCode: z.string().min(6, 'Company code must be at least 6 characters'),
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
})

function AgentSignupContent() {
    const searchParams = useSearchParams()
    const inviteToken = searchParams?.get('invite')

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const inviteForm = useForm({
        resolver: zodResolver(agentInviteSchema),
    })

    const joinForm = useForm({
        resolver: zodResolver(agentJoinSchema),
    })

    const handleInviteSignup = async (data: any) => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/agents/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    inviteToken,
                }),
            })

            if (response.ok) {
                setSuccess(true)
                setTimeout(() => {
                    window.location.href = '/dashboard/agent'
                }, 1500)
            } else {
                const errorData = await response.json()
                setError(errorData.message || 'Registration failed. Please try again.')
            }
        } catch (err) {
            setError('Network error. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleJoinSignup = async (data: any) => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/agents/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            if (response.ok) {
                setSuccess(true)
                setTimeout(() => {
                    window.location.href = '/login'
                }, 1500)
            } else {
                const errorData = await response.json()
                setError(errorData.message || 'Join request failed. Please try again.')
            }
        } catch (err) {
            setError('Network error. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                            <UserPlus className="w-6 h-6 text-primary-foreground" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold">Join as an Agent</h1>
                    <p className="text-muted-foreground">
                        {inviteToken
                            ? "Complete your agent registration"
                            : "Join your company's WhatsApp team"}
                    </p>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        {inviteToken ? (
                            // Invite Link Flow
                            <form onSubmit={inviteForm.handleSubmit(handleInviteSignup)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name *</Label>
                                    <Input
                                        id="fullName"
                                        placeholder="Ahmed Al Mansouri"
                                        {...inviteForm.register('fullName')}
                                    />
                                    {inviteForm.formState.errors.fullName && (
                                        <p className="text-sm text-destructive">
                                            {inviteForm.formState.errors.fullName.message as string}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="ahmed@company.com"
                                        {...inviteForm.register('email')}
                                    />
                                    {inviteForm.formState.errors.email && (
                                        <p className="text-sm text-destructive">
                                            {inviteForm.formState.errors.email.message as string}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password *</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Minimum 8 characters"
                                        {...inviteForm.register('password')}
                                    />
                                    {inviteForm.formState.errors.password && (
                                        <p className="text-sm text-destructive">
                                            {inviteForm.formState.errors.password.message as string}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        {...inviteForm.register('confirmPassword')}
                                    />
                                    {inviteForm.formState.errors.confirmPassword && (
                                        <p className="text-sm text-destructive">
                                            {inviteForm.formState.errors.confirmPassword.message as string}
                                        </p>
                                    )}
                                </div>

                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                {success && (
                                    <Alert>
                                        <Mail className="h-4 w-4" />
                                        <AlertDescription>
                                            Registration successful! Redirecting to dashboard...
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Complete Registration
                                </Button>
                            </form>
                        ) : (
                            // Company Code Flow
                            <Tabs defaultValue="join" className="w-full">
                                <TabsList className="grid w-full grid-cols-1">
                                    <TabsTrigger value="join">Join with Company Code</TabsTrigger>
                                </TabsList>

                                <TabsContent value="join" className="space-y-4">
                                    <form onSubmit={joinForm.handleSubmit(handleJoinSignup)} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="companyCode">Company Code *</Label>
                                            <Input
                                                id="companyCode"
                                                placeholder="Enter your company's code"
                                                {...joinForm.register('companyCode')}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Ask your admin for the company code
                                            </p>
                                            {joinForm.formState.errors.companyCode && (
                                                <p className="text-sm text-destructive">
                                                    {joinForm.formState.errors.companyCode.message as string}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="join-fullName">Full Name *</Label>
                                            <Input
                                                id="join-fullName"
                                                placeholder="Ahmed Al Mansouri"
                                                {...joinForm.register('fullName')}
                                            />
                                            {joinForm.formState.errors.fullName && (
                                                <p className="text-sm text-destructive">
                                                    {joinForm.formState.errors.fullName.message as string}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="join-email">Email *</Label>
                                            <Input
                                                id="join-email"
                                                type="email"
                                                placeholder="ahmed@company.com"
                                                {...joinForm.register('email')}
                                            />
                                            {joinForm.formState.errors.email && (
                                                <p className="text-sm text-destructive">
                                                    {joinForm.formState.errors.email.message as string}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="join-password">Password *</Label>
                                            <Input
                                                id="join-password"
                                                type="password"
                                                placeholder="Minimum 8 characters"
                                                {...joinForm.register('password')}
                                            />
                                            {joinForm.formState.errors.password && (
                                                <p className="text-sm text-destructive">
                                                    {joinForm.formState.errors.password.message as string}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="join-confirmPassword">Confirm Password *</Label>
                                            <Input
                                                id="join-confirmPassword"
                                                type="password"
                                                {...joinForm.register('confirmPassword')}
                                            />
                                            {joinForm.formState.errors.confirmPassword && (
                                                <p className="text-sm text-destructive">
                                                    {joinForm.formState.errors.confirmPassword.message as string}
                                                </p>
                                            )}
                                        </div>

                                        {error && (
                                            <Alert variant="destructive">
                                                <AlertDescription>{error}</AlertDescription>
                                            </Alert>
                                        )}

                                        {success && (
                                            <Alert>
                                                <Mail className="h-4 w-4" />
                                                <AlertDescription>
                                                    Request sent! Your admin will approve your access.
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        <Button type="submit" className="w-full" disabled={isLoading}>
                                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Request to Join
                                        </Button>
                                    </form>
                                </TabsContent>
                            </Tabs>
                        )}
                    </CardContent>
                </Card>

                <p className="text-center text-sm text-muted-foreground">
                    Are you a company admin?{' '}
                    <Link href="/signup" className="font-medium text-primary hover:underline">
                        Create company account
                    </Link>
                </p>

                <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-primary hover:underline">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default function AgentSignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        }>
            <AgentSignupContent />
        </Suspense>
    )
}
