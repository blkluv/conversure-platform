"use client"

import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeatureCellProps {
    icon?: LucideIcon
    value: string | number
    label?: string
    className?: string
    variant?: "default" | "success" | "warning" | "info"
}

const variantStyles = {
    default: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
    success: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300",
    warning: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300",
    info: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300"
}

export function FeatureCell({
    icon: Icon,
    value,
    label,
    className,
    variant = "default"
}: FeatureCellProps) {
    return (
        <div
            className={cn(
                "feature-cell inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-sm font-medium",
                variantStyles[variant],
                className
            )}
        >
            {Icon && (
                <span className="icon-container">
                    <Icon className="h-4 w-4" />
                </span>
            )}
            <span className="value-container">
                {label && <span className="text-xs opacity-75">{label}: </span>}
                {value}
            </span>
        </div>
    )
}

interface FeatureContainerProps {
    children: React.ReactNode
    className?: string
}

export function FeatureContainer({ children, className }: FeatureContainerProps) {
    return (
        <div className={cn("feature-container flex flex-wrap gap-2", className)}>
            {children}
        </div>
    )
}
