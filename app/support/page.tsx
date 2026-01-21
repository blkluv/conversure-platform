import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Mail, Phone, MessageCircle } from "lucide-react"

export default function SupportPage() {
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
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h1 className="text-5xl font-bold mb-4">We're Here to Help</h1>
                        <p className="text-xl text-muted-foreground">
                            Get in touch with our support team - we typically respond within 2 hours
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <Card>
                            <CardHeader className="text-center">
                                <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
                                <CardTitle>Email Support</CardTitle>
                                <CardDescription>Best for non-urgent questions</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center">
                                <a
                                    href="mailto:support@conversure.com"
                                    className="text-primary font-medium hover:underline"
                                >
                                    support@conversure.com
                                </a>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Response time: 2-4 hours
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="text-center">
                                <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                                <CardTitle>WhatsApp</CardTitle>
                                <CardDescription>Quick answers to urgent issues</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center">
                                <a
                                    href="https://wa.me/971501234567"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary font-medium hover:underline"
                                >
                                    +971 50 123 4567
                                </a>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Available: 9AM - 6PM GST
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="text-center">
                                <Phone className="w-12 h-12 text-primary mx-auto mb-4" />
                                <CardTitle>Phone Support</CardTitle>
                                <CardDescription>For enterprise customers</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center">
                                <a
                                    href="tel:+971501234567"
                                    className="text-primary font-medium hover:underline"
                                >
                                    +971 50 123 4567
                                </a>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Enterprise plan only
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="mt-16 text-center">
                        <p className="text-muted-foreground mb-6">
                            Or use our contact form for detailed inquiries
                        </p>
                        <Link href="/contact">
                            <Button size="lg">Contact Us</Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}
