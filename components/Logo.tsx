"use client"

import Image from "next/image"
import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoProps {
    variant?: "full" | "icon" | "text"
    size?: "sm" | "md" | "lg"
    className?: string
    href?: string
    logoUrl?: string
    companyName?: string
}

const sizeClasses = {
    sm: {
        icon: "w-6 h-6",
        container: "w-6 h-6",
        text: "text-lg",
        wrapper: "gap-2"
    },
    md: {
        icon: "w-8 h-8",
        container: "w-10 h-10",
        text: "text-xl",
        wrapper: "gap-2.5"
    },
    lg: {
        icon: "w-10 h-10",
        container: "w-12 h-12",
        text: "text-2xl",
        wrapper: "gap-3"
    }
}

export function Logo({
    variant = "full",
    size = "md",
    className,
    href,
    logoUrl,
    companyName = "Conversure"
}: LogoProps) {
    const sizes = sizeClasses[size]

    const LogoContent = () => {
        switch (variant) {
            case "icon":
                return logoUrl ? (
                    <div className={cn("relative overflow-hidden rounded-lg", sizes.container)}>
                        <Image
                            src={logoUrl}
                            alt={`${companyName} logo`}
                            fill
                            className="object-cover"
                        />
                    </div>
                ) : (
                    <div className={cn(
                        "bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg",
                        sizes.container
                    )}>
                        <MessageSquare className={cn("text-primary-foreground", sizes.icon)} />
                    </div>
                )

            case "text":
                return (
                    <span className={cn("font-bold", sizes.text)}>
                        {companyName}
                    </span>
                )

            case "full":
            default:
                return (
                    <div className={cn("flex items-center", sizes.wrapper)}>
                        {logoUrl ? (
                            <div className={cn("relative overflow-hidden rounded-lg", sizes.container)}>
                                <Image
                                    src={logoUrl}
                                    alt={`${companyName} logo`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className={cn(
                                "bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg",
                                sizes.container
                            )}>
                                <MessageSquare className={cn("text-primary-foreground", sizes.icon)} />
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className={cn("font-bold", sizes.text)}>{companyName}</span>
                            {size !== "sm" && (
                                <span className="text-xs text-muted-foreground">Real Estate CRM</span>
                            )}
                        </div>
                    </div>
                )
        }
    }

    if (href) {
        return (
            <Link href={href} className={cn("inline-flex", className)}>
                <LogoContent />
            </Link>
        )
    }

    return <div className={cn("inline-flex", className)}><LogoContent /></div>
}
