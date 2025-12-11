/**
 * STORY 2.3: Format Utilities
 * 
 * Purpose: Provide consistent date and currency formatting across the Easy Panel
 * 
 * Functions:
 * - formatDate(isoString): Converts ISO date to "Dec 31, 2025" format
 * - formatCurrency(cents): Converts cents to "$X.XX" format
 * 
 * Dependencies: None (uses native JavaScript APIs)
 * Used by: BillingPanel, future components needing date/currency display
 */

/**
 * Format ISO date string to readable format: "Dec 31, 2025"
 * 
 * @param isoString - ISO 8601 date string (e.g., "2025-12-31T00:00:00Z")
 * @returns Formatted date string (e.g., "Dec 31, 2025")
 * 
 * Examples:
 * formatDate("2025-12-31T00:00:00Z") → "Dec 31, 2025"
 * formatDate("2025-01-15T10:30:00Z") → "Jan 15, 2025"
 * formatDate("2024-06-30T23:59:59Z") → "Jun 30, 2024"
 */
export function formatDate(isoString: string): string {
  if (!isoString) return "—"

  try {
    const date = new Date(isoString)
    
    // Check for invalid date
    if (isNaN(date.getTime())) {
      return "—"
    }

    // Use Intl.DateTimeFormat for locale-aware formatting
    const formatter = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })

    return formatter.format(date)
  } catch (error) {
    console.error("[formatDate] Error formatting date:", error)
    return "—"
  }
}

/**
 * Format currency value in cents to readable currency string: "$X.XX"
 * 
 * @param cents - Amount in cents (e.g., 39900 for $399.00)
 * @returns Formatted currency string (e.g., "$399.00")
 * 
 * Examples:
 * formatCurrency(0) → "$0.00"
 * formatCurrency(100) → "$1.00"
 * formatCurrency(39900) → "$399.00"
 * formatCurrency(1) → "$0.01"
 * formatCurrency(-1000) → "-$10.00" (handles negative for refunds)
 */
export function formatCurrency(cents: number): string {
  if (cents === null || cents === undefined || isNaN(cents)) {
    return "$0.00"
  }

  try {
    // Handle negative values (refunds)
    const isNegative = cents < 0
    const absoluteCents = Math.abs(cents)

    // Convert cents to dollars
    const dollars = absoluteCents / 100

    // Use Intl.NumberFormat for locale-aware currency formatting
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    const formatted = formatter.format(dollars)

    // Reapply negative sign if needed (Intl handles this but be explicit)
    return isNegative ? `-${formatted}` : formatted
  } catch (error) {
    console.error("[formatCurrency] Error formatting currency:", error)
    return "$0.00"
  }
}

/**
 * Format a number with thousand separators for readability
 * Used for displaying counts, rates, etc.
 * 
 * @param value - Number to format
 * @returns Formatted number string with thousand separators
 * 
 * Examples:
 * formatNumber(1000) → "1,000"
 * formatNumber(1500000) → "1,500,000"
 * formatNumber(42) → "42"
 */
export function formatNumber(value: number): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0"
  }

  try {
    return new Intl.NumberFormat("en-US").format(Math.round(value))
  } catch (error) {
    console.error("[formatNumber] Error formatting number:", error)
    return String(value)
  }
}

/**
 * Format percentage value with optional decimal places
 * Used for displaying usage percentages, conversion rates, etc.
 * 
 * @param value - Percentage value (0-100)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string
 * 
 * Examples:
 * formatPercentage(75) → "75%"
 * formatPercentage(75.5) → "75.5%"
 * formatPercentage(33.333, 2) → "33.33%"
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0%"
  }

  try {
    const rounded = Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
    return `${rounded.toFixed(decimals)}%`
  } catch (error) {
    console.error("[formatPercentage] Error formatting percentage:", error)
    return "0%"
  }
}

/**
 * Format relative time for display (e.g., "2 days ago")
 * Useful for showing when a subscription renews, when last activity occurred, etc.
 * 
 * @param dateString - ISO date string to compare to now
 * @returns Relative time string
 * 
 * Examples:
 * formatRelativeTime("2025-12-13T10:00:00Z") → "in 2 days"
 * formatRelativeTime("2025-12-09T10:00:00Z") → "2 days ago"
 */
export function formatRelativeTime(dateString: string): string {
  if (!dateString) return "—"

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "—"

    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

    if (Math.abs(diffDays) < 1) {
      const diffHours = Math.round(diffMs / (1000 * 60 * 60))
      if (diffHours === 0) return "today"
      if (diffHours > 0) return `in ${diffHours} hour${diffHours !== 1 ? "s" : ""}`
      return `${Math.abs(diffHours)} hour${Math.abs(diffHours) !== 1 ? "s" : ""} ago`
    }

    if (diffDays > 0) return `in ${diffDays} day${diffDays !== 1 ? "s" : ""}`
    return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""} ago`
  } catch (error) {
    console.error("[formatRelativeTime] Error formatting relative time:", error)
    return "—"
  }
}
