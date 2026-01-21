import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageSquare, BookOpen, Code, HelpCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-background">
            <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <span className="text-2xl font-bold">Conversure</span>
                        </Link>
                        <Link href="/"><Button variant="ghost">Back to Home</Button></Link>
                    </div>
                </div>
            </nav>

            <section className="py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                    <div className="text-center space-y-4">
                        <BookOpen className="w-16 h-16 text-primary mx-auto" />
                        <h1 className="text-5xl font-bold">Documentation</h1>
                        <p className="text-xl text-muted-foreground">
                            Complete guides for getting started with Conversure
                        </p>
                    </div>

                    <Alert>
                        <HelpCircle className="h-4 w-4" />
                        <AlertTitle>Documentation Coming Soon</AlertTitle>
                        <AlertDescription>
                            We're currently building comprehensive documentation for Conversure.
                            In the meantime, please contact our support team for assistance.
                        </AlertDescription>
                    </Alert>

                    <div className="grid md:grid-cols-2 gap-6 pt-8">
                        <Link href="/signup">
                            <Button className="w-full" size="lg">
                                <Code className="mr-2 w-5 h-5" />
                                Start Free Trial
                            </Button>
                        </Link>
                        <Link href="/contact">
                            <Button variant="outline" className="w-full" size="lg">
                                <HelpCircle className="mr-2 w-5 h-5" />
                                Contact Support
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}
