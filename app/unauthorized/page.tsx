import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageSquare, Lock, Home } from "lucide-react"

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="flex items-center justify-center">
                    <div className="w-16 h-16 bg-destructive/10 rounded-lg flex items-center justify-center">
                        <Lock className="w-10 h-10 text-destructive" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-7xl font-bold text-destructive">403</h1>
                    <h2 className="text-3xl font-bold">Access Denied</h2>
                    <p className="text-lg text-muted-foreground">
                        You don't have permission to access this page.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Link href="/login">
                        <Button size="lg" className="w-full sm:w-auto">
                            Log In
                        </Button>
                    </Link>
                    <Link href="/">
                        <Button variant="outline" size="lg" className="w-full sm:w-auto">
                            <Home className="mr-2 w-5 h-5" />
                            Go Home
                        </Button>
                    </Link>
                </div>

                <p className="text-sm text-muted-foreground pt-8">
                    Need help? <Link href="/contact" className="text-primary hover:underline">Contact support</Link>
                </p>
            </div>
        </div>
    )
}
