'use client'

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageSquare, RefreshCw, Home } from "lucide-react"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log error to console (in production, send to error tracking service)
        console.error('Application error:', error)
    }, [error])

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="flex items-center justify-center">
                    <div className="w-16 h-16 bg-destructive/10 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-10 h-10 text-destructive" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-7xl font-bold text-destructive">500</h1>
                    <h2 className="text-3xl font-bold">Something Went Wrong</h2>
                    <p className="text-lg text-muted-foreground">
                        We're experiencing a technical issue. Please try again.
                    </p>
                    {error.digest && (
                        <p className="text-sm text-muted-foreground font-mono">
                            Error ID: {error.digest}
                        </p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Button onClick={reset} size="lg" className="w-full sm:w-auto">
                        <RefreshCw className="mr-2 w-5 h-5" />
                        Try Again
                    </Button>
                    <Link href="/">
                        <Button variant="outline" size="lg" className="w-full sm:w-auto">
                            <Home className="mr-2 w-5 h-5" />
                            Go Home
                        </Button>
                    </Link>
                </div>

                <p className="text-sm text-muted-foreground pt-8">
                    If the problem persists, please{" "}
                    <Link href="/contact" className="text-primary hover:underline">
                        contact support
                    </Link>
                </p>
            </div>
        </div>
    )
}
