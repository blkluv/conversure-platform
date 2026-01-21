import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { PricingSection } from "@/components/PricingSection"

export default function PricingPage() {
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
                        <div className="flex items-center gap-4">
                            <Link href="/login">
                                <Button variant="ghost">Log In</Button>
                            </Link>
                            <Link href="/signup">
                                <Button>Start Free Trial</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <section className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
                        <p className="text-xl text-muted-foreground">
                            Choose the plan that fits your agency's needs
                        </p>
                    </div>
                    <PricingSection />
                </div>
            </section>
        </div>
    )
}
