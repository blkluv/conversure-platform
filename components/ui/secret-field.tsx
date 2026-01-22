
"use client"

import { useState } from "react"
import { Eye, EyeOff, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SecretFieldProps {
    value: string
    label?: string
    className?: string
    startMasked?: boolean
}

export function SecretField({
    value,
    label,
    className,
    startMasked = true
}: SecretFieldProps) {
    const [isMasked, setIsMasked] = useState(startMasked)
    const [copied, setCopied] = useState(false)

    const toggleVisibility = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsMasked(!isMasked)
    }

    const copyToClipboard = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy text:", err)
        }
    }

    // Generate masked string of same length (limit to 10 chars like original)
    const displayValue = isMasked ? "•".repeat(Math.min(value.length, 10) || 10) : value

    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            {label && <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>}

            <div className="relative flex items-center group">
                <div
                    className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                        "text-muted-foreground font-mono",
                        !isMasked && "text-foreground"
                    )}
                >
                    {displayValue}
                </div>

                <div className="absolute right-1 flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={toggleVisibility}
                        title={isMasked ? "Show secret" : "Hide secret"}
                    >
                        {isMasked ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={copyToClipboard}
                        title="Copy to clipboard"
                    >
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
    )
}
