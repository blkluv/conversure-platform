import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Conversure - WhatsApp CRM & AI Copilot for UAE Real Estate | Dubai 2025",
  description:
    "AI-powered WhatsApp automation for UAE real estate agents. Auto-draft replies, sync leads to Bitrix24, prevent bans. 14-day free trial. Used by Dubai agencies.",
  keywords: [
    "WhatsApp CRM UAE",
    "WhatsApp Business API Dubai",
    "Real estate WhatsApp automation",
    "Bitrix24 WhatsApp integration",
    "AI WhatsApp copilot",
    "WhatsApp lead management Dubai",
    "Real estate agent software UAE",
    "WhatsApp compliance UAE",
    "Property lead follow-up automation",
    "Dubai real estate CRM",
    "WhatsApp Business Dubai",
    "AI real estate assistant UAE",
  ],
  authors: [{ name: "Conversure" }],
  creator: "Conversure",
  publisher: "Conversure",
  metadataBase: new URL("https://conversure.ae"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_AE",
    url: "https://conversure.ae",
    title: "Conversure - WhatsApp CRM & AI Copilot for UAE Real Estate",
    description:
      "AI-powered WhatsApp automation for UAE real estate. Auto-draft replies, sync Bitrix24, prevent bans. 14-day free trial. Used by Dubai agencies.",
    siteName: "Conversure",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Conversure - WhatsApp CRM & AI Copilot for UAE Real Estate Agents",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Conversure - WhatsApp CRM for UAE Real Estate | Dubai 2025",
    description:
      "AI WhatsApp automation for real estate agents. Auto-draft replies, sync Bitrix24, prevent bans. 14-day free trial.",
    images: ["/og-image.png"],
    creator: "@conversure",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    // Add other verification codes as needed
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
