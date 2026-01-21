import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageSquare, Home, Search } from "lucide-react"

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="flex items-center justify-center">
                    <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-10 h-10 text-primary-foreground" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-9xl font-bold text-primary">404</h1>
                    <h2 className="text-3xl font-bold">Page Not Found</h2>
                    <p className="text-lg text-muted-foreground">
                        Sorry, we couldn't find the page you're looking for.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Link href="/">
                        <Button size="lg" className="w-full sm:w-auto">
                            <Home className="mr-2 w-5 h-5" />
                            Go Home
                        </Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button variant="outline" size="lg" className="w-full sm:w-auto">
                            <Search className="mr-2 w-5 h-5" />
                            Go to Dashboard
                        </Button>
                    </Link>
                </div>

                <p className="text-sm text-muted-foreground pt-8">
                    If you believe this is an error, please{" "}
                    <Link href="/contact" className="text-primary hover:underline">
                        contact support
                    </Link>
                </p>
            </div>
        </div>
    )
}
