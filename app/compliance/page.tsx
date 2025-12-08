import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, ArrowLeft, Shield, Lock, FileText, CheckCircle2 } from "lucide-react"

export const metadata = {
  title: "Data Privacy & Compliance - Conversure",
  description: "Learn about Conversure's commitment to data privacy, GDPR compliance, and UAE data protection standards.",
}

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">Conversure</span>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border text-sm mb-4">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Your Data, Protected</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Data Privacy & Compliance
            </h1>
            <p className="text-xl text-muted-foreground">
              We take your data security seriously. Learn about our commitment to privacy and compliance.
            </p>
          </div>
        </div>
      </section>

      {/* Compliance Overview */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card className="border-2">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>UAE Compliant</CardTitle>
                <CardDescription>
                  Fully compliant with UAE Data Protection Law
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary/80 rounded-lg flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-secondary-foreground" />
                </div>
                <CardTitle>GDPR Ready</CardTitle>
                <CardDescription>
                  European data protection standards
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>WhatsApp Policy</CardTitle>
                <CardDescription>
                  Adheres to WhatsApp Business guidelines
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Detailed Compliance Information */}
          <div className="prose prose-slate max-w-none space-y-12">
            {/* UAE Data Protection Law */}
            <div>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Shield className="w-8 h-8 text-primary" />
                UAE Data Protection Law
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Conversure is fully compliant with the UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data. 
                      We ensure that all personal data collected, processed, and stored within our platform adheres to the highest 
                      standards of data protection as mandated by UAE law.
                    </p>
                    
                    <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">Our Commitments:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span><strong>Lawful Processing:</strong> We only collect and process personal data with explicit consent or legitimate business purposes.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span><strong>Data Minimization:</strong> We collect only the data necessary for providing our CRM services.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span><strong>Data Security:</strong> All data is encrypted in transit and at rest using industry-standard protocols.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span><strong>Data Residency:</strong> Customer data is stored within UAE-approved data centers.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span><strong>User Rights:</strong> Users have the right to access, correct, delete, or export their personal data at any time.</span>
                      </li>
                    </ul>

                    <p className="mt-6">
                      For data protection inquiries, please contact our Data Protection Officer at{" "}
                      <a href="mailto:dpo@conversure.ae" className="text-primary hover:underline">
                        dpo@conversure.ae
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* GDPR Compliance */}
            <div>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Lock className="w-8 h-8 text-secondary" />
                GDPR Compliance
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      While Conversure primarily operates in the UAE, we recognize the importance of the European Union's 
                      General Data Protection Regulation (GDPR) for our international clients. Our platform is designed to 
                      support GDPR compliance requirements.
                    </p>
                    
                    <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">GDPR Features:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                        <span><strong>Right to Access:</strong> Users can request a copy of all personal data we hold about them.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                        <span><strong>Right to Erasure:</strong> Users can request deletion of their personal data ("right to be forgotten").</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                        <span><strong>Data Portability:</strong> Users can export their data in a machine-readable format.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                        <span><strong>Consent Management:</strong> Clear opt-in mechanisms for data collection and processing.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                        <span><strong>Breach Notification:</strong> We commit to notifying affected users within 72 hours of any data breach.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                        <span><strong>Data Processing Agreements:</strong> We provide DPAs for all enterprise customers.</span>
                      </li>
                    </ul>

                    <p className="mt-6">
                      Our platform includes built-in tools to help you maintain GDPR compliance when managing your customer data.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* WhatsApp Business Policy */}
            <div>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                WhatsApp Business Policy Compliance
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Conversure strictly adheres to WhatsApp's Business Policy and Commerce Policy to ensure that all 
                      communications sent through our platform comply with WhatsApp's guidelines and best practices.
                    </p>
                    
                    <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">Our WhatsApp Compliance Measures:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span><strong>Opt-In Required:</strong> All contacts must explicitly opt-in to receive WhatsApp messages.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span><strong>24-Hour Window:</strong> We enforce WhatsApp's 24-hour messaging window for customer service messages.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span><strong>Template Approval:</strong> All marketing message templates must be pre-approved by WhatsApp.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span><strong>Warm-Up Protocol:</strong> Our 4-week warm-up plan prevents account restrictions and maintains sender reputation.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span><strong>Quality Monitoring:</strong> We track message quality ratings and provide alerts to maintain account health.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span><strong>Opt-Out Mechanism:</strong> Easy opt-out options are provided in all marketing communications.</span>
                      </li>
                    </ul>

                    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-amber-900 text-sm">
                        <strong>Important:</strong> Violating WhatsApp's policies can result in account restrictions or bans. 
                        Conversure's built-in compliance features help you stay within WhatsApp's guidelines and maintain 
                        a healthy sender reputation.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Information */}
            <div>
              <h2 className="text-3xl font-bold mb-6">Additional Information</h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4 text-muted-foreground">
                    <h3 className="text-lg font-semibold text-foreground mb-3">Security Measures</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>End-to-end encryption for all WhatsApp communications</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>TLS 1.3 encryption for data in transit</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>AES-256 encryption for data at rest</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Regular security audits and penetration testing</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Role-based access control (RBAC) for team members</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Automated daily backups with 30-day retention</span>
                      </li>
                    </ul>

                    <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">Contact Us</h3>
                    <p>
                      For questions about our data privacy practices or to exercise your data rights, please contact:
                    </p>
                    <ul className="space-y-1 mt-2">
                      <li>
                        <strong>Email:</strong>{" "}
                        <a href="mailto:privacy@conversure.ae" className="text-primary hover:underline">
                          privacy@conversure.ae
                        </a>
                      </li>
                      <li>
                        <strong>Data Protection Officer:</strong>{" "}
                        <a href="mailto:dpo@conversure.ae" className="text-primary hover:underline">
                          dpo@conversure.ae
                        </a>
                      </li>
                      <li>
                        <strong>Support:</strong>{" "}
                        <a href="mailto:abdallah@betaedgetech.com" className="text-primary hover:underline">
                          abdallah@betaedgetech.com
                        </a>
                      </li>
                    </ul>

                    <p className="mt-6 text-sm">
                      <strong>Last Updated:</strong> December 8, 2025
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-foreground/90">
            Experience secure, compliant WhatsApp CRM for your real estate business
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="text-base px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button 
                size="lg" 
                variant="outline" 
                className="text-base px-8 bg-transparent border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Conversure. All rights reserved. Built for UAE Real Estate.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
