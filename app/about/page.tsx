import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Users, Target, Award, Globe, TrendingUp } from "lucide-react"

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
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

            {/* Hero */}
            <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto space-y-6">
                        <h1 className="text-5xl md:text-6xl font-bold">About Conversure</h1>
                        <p className="text-xl text-muted-foreground">
                            We're building the intelligence layer between WhatsApp and CRM for UAE real estate
                        </p>
                    </div>
                </div>
            </section>

            {/* Mission */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
                            <p className="text-lg text-muted-foreground mb-4">
                                Real estate agencies in the UAE handle hundreds of WhatsApp conversations daily.
                                We built Conversure to help them manage, automate, and scale these conversations
                                without losing the personal touch.
                            </p>
                            <p className="text-lg text-muted-foreground">
                                By combining AI-powered automation with human oversight, we enable agencies to
                                respond faster, track leads better, and close more deals.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <Target className="w-8 h-8 text-primary mb-2" />
                                    <CardTitle>10,000+</CardTitle>
                                    <CardDescription>Messages processed daily</CardDescription>
                                </CardHeader>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <Users className="w-8 h-8 text-primary mb-2" />
                                    <CardTitle>50+</CardTitle>
                                    <CardDescription>Agencies using Conversure</CardDescription>
                                </CardHeader>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <Globe className="w-8 h-8 text-primary mb-2" />
                                    <CardTitle>UAE</CardTitle>
                                    <CardDescription>Built for local market</CardDescription>
                                </CardHeader>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <TrendingUp className="w-8 h-8 text-primary mb-2" />
                                    <CardTitle>40%</CardTitle>
                                    <CardDescription>Faster response times</CardDescription>
                                </CardHeader>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-20 bg-muted/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl font-bold text-center mb-12">Our Values</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <Card>
                            <CardHeader>
                                <Award className="w-10 h-10 text-primary mb-4" />
                                <CardTitle>Customer First</CardTitle>
                                <CardDescription>
                                    Every feature we build starts with understanding real estate agencies'
                                    actual needs and challenges.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader>
                                <MessageSquare className="w-10 h-10 text-primary mb-4" />
                                <CardTitle>Transparency</CardTitle>
                                <CardDescription>
                                    Clear pricing, honest communication, and no hidden surprises.
                                    What you see is what you get.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader>
                                <TrendingUp className="w-10 h-10 text-primary mb-4" />
                                <CardTitle>Continuous Innovation</CardTitle>
                                <CardDescription>
                                    We're constantly improving based on feedback and staying ahead
                                    of WhatsApp and CRM changes.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
                    <h2 className="text-4xl font-bold">Ready to transform your conversations?</h2>
                    <p className="text-xl text-muted-foreground">
                        Join UAE real estate agencies using Conversure to close more deals
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/signup">
                            <Button size="lg">Start Free Trial</Button>
                        </Link>
                        <Link href="/contact">
                            <Button size="lg" variant="outline">Contact Us</Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-12 bg-muted/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-muted-foreground">&copy; 2025 Conversure. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}
