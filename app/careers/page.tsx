import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Briefcase, Code, TrendingUp, Users } from "lucide-react"

export default function CareersPage() {
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
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
                    <Briefcase className="w-16 h-16 text-primary mx-auto" />
                    <h1 className="text-5xl font-bold">Join Our Team</h1>
                    <p className="text-xl text-muted-foreground">
                        Help us build the future of real estate communication in the UAE
                    </p>

                    <Card className="text-left">
                        <CardHeader>
                            <CardTitle>We're Growing</CardTitle>
                            <CardDescription>
                                Conversure is expanding rapidly. We're looking for talented individuals who are passionate
                                about SaaS, AI, and real estate tech.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <Code className="w-5 h-5 text-primary" />
                                    Engineering
                                </h3>
                                <p className="text-muted-foreground">
                                    Full-stack engineers, AI engineers, DevOps specialists
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary" />
                                    Customer Success
                                </h3>
                                <p className="text-muted-foreground">
                                    Help real estate agencies succeed with Conversure
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-primary" />
                                    Sales & Marketing
                                </h3>
                                <p className="text-muted-foreground">
                                    Grow our presence in the UAE real estate market
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="pt-8">
                        <p className="text-muted-foreground mb-4">
                            Interested in joining? Send your CV to:
                        </p>
                        <a href="mailto:careers@conversure.com" className="text-primary font-medium text-lg hover:underline">
                            careers@conversure.com
                        </a>
                    </div>
                </div>
            </section>
        </div>
    )
}
