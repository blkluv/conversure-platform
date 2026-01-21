/**
 * Phone Number Normalization & Validation
 * 
 * E.164 format standardization for UAE phone numbers
 */

/**
 * Normalize phone number to E.164 format
 * 
 * Examples:
 * - "0501234567" -> "+971501234567"
 * - "501234567" -> "+971501234567"
 * - "+971 50 123 4567" -> "+971501234567"
 * - "971501234567" -> "+971501234567"
 */
export function normalizePhone(phone: string, defaultCountryCode: string = '+971'): string {
    if (!phone) {
        throw new Error('Phone number is required');
    }

    // Remove all non-digit characters except leading +
    let cleaned = phone.trim().replace(/\s+/g, '');

    // Extract digits only
    const digitsOnly = cleaned.replace(/\D/g, '');

    // If already has +, validate and return
    if (cleaned.startsWith('+')) {
        // Must be at least 10 digits (country code + number)
        if (digitsOnly.length < 10) {
            throw new Error('Invalid phone number: too short');
        }
        return `+${digitsOnly}`;
    }

    // UAE-specific normalization
    if (defaultCountryCode === '+971') {
        // Remove leading 971 if present
        let normalized = digitsOnly;
        if (normalized.startsWith('971')) {
            normalized = normalized.substring(3);
        }

        // Remove leading 0 if present (UAE mobile format)
        if (normalized.startsWith('0')) {
            normalized = normalized.substring(1);
        }

        // UAE numbers should be 9 digits after country code
        if (normalized.length !== 9) {
            throw new Error(`Invalid UAE phone number: expected 9 digits, got ${normalized.length}`);
        }

        // Validate UAE mobile prefixes (50, 52, 54, 55, 56, 58)
        const validPrefixes = ['50', '52', '54', '55', '56', '58'];
        if (!validPrefixes.some(prefix => normalized.startsWith(prefix))) {
            console.warn(`[PhoneNormalizer] Unusual UAE prefix: ${normalized.substring(0, 2)}`);
        }

        return `+971${normalized}`;
    }

    // Generic normalization for other countries
    if (digitsOnly.length < 10) {
        throw new Error('Invalid phone number: too short');
    }

    // If starts with country code (without +), add +
    if (digitsOnly.length > 10) {
        return `+${digitsOnly}`;
    }

    // Otherwise prepend default country code
    return `${defaultCountryCode}${digitsOnly}`;
}

/**
 * Validate if phone number is in E.164 format
 */
export function isValidE164(phone: string): boolean {
    if (!phone) return false;

    // E.164: + followed by 1-15 digits
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
}

/**
 * Format UAE phone number for display
 * "+971501234567" -> "+971 50 123 4567"
 */
export function formatUAEPhone(phone: string): string {
    if (!phone || !phone.startsWith('+971')) {
        return phone;
    }

    const digits = phone.substring(4); // Remove +971
    if (digits.length !== 9) {
        return phone;
    }

    return `+971 ${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5)}`;
}

/**
 * Extract country code from E.164 phone
 */
export function getCountryCode(phone: string): string | null {
    if (!isValidE164(phone)) {
        return null;
    }

    // UAE
    if (phone.startsWith('+971')) return '+971';

    // Saudi Arabia
    if (phone.startsWith('+966')) return '+966';

    // Generic: first 2-4 digits after +
    const match = phone.match(/^\+(\d{1,4})/);
    return match ? `+${match[1]}` : null;
}

/**
 * Check if phone is UAE mobile number
 */
export function isUAEMobile(phone: string): boolean {
    if (!phone.startsWith('+971')) {
        return false;
    }

    const digits = phone.substring(4);
    const validPrefixes = ['50', '52', '54', '55', '56', '58'];

    return digits.length === 9 && validPrefixes.some(prefix => digits.startsWith(prefix));
}
