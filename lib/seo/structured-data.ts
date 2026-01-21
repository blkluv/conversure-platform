/**
 * Structured Data for SEO (JSON-LD)
 * Helps search engines understand Conversure as a SaaS product
 */

export const conversureStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Conversure",
    "applicationCategory": "BusinessApplication",
    "applicationSubCategory": "CRM Software",
    "operatingSystem": "Web, Cloud",
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "description": "14-day free trial, no credit card required",
        "eligibleRegion": {
            "@type": "Place",
            "name": "United Arab Emirates"
        }
    },
    "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "50",
        "bestRating": "5",
        "worstRating": "1"
    },
    "description": "AI-powered WhatsApp CRM for UAE real estate agents. Auto-draft replies, sync Bitrix24, manage leads compliantly.",
    "featureList": [
        "WhatsApp Business API Integration",
        "AI-powered reply suggestions",
        "Bitrix24 CRM sync",
        "Agent management",
        "WhatsApp compliance enforcement",
        "Real-time analytics"
    ],
    "screenshot": "https://conversure.ae/screenshot.png",
    "softwareVersion": "1.0",
    "datePublished": "2025-01-01",
    "author": {
        "@type": "Organization",
        "name": "Conversure",
        "url": "https://conversure.ae"
    },
    "provider": {
        "@type": "Organization",
        "name": "Conversure",
        "url": "https://conversure.ae",
        "logo": "https://conversure.ae/logo.png",
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+971-50-123-4567",
            "contactType": "Customer Service",
            "areaServed": "AE",
            "availableLanguage": ["en", "ar"]
        }
    }
}

export const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Conversure",
    "url": "https://conversure.ae",
    "logo": "https://conversure.ae/logo.png",
    "description": "WhatsApp CRM & AI Copilot for UAE Real Estate Agents",
    "address": {
        "@type": "PostalAddress",
        "addressCountry": "AE",
        "addressRegion": "Dubai"
    },
    "sameAs": [
        "https://twitter.com/conversure",
        "https://linkedin.com/company/conversure"
    ]
}
