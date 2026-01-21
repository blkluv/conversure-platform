/**
 * Encryption Utilities (Phase 3)
 * 
 * AES-256-GCM encryption for sensitive credentials
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes IV for GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes auth tag
const SALT_LENGTH = 32; // 32 bytes salt for key derivation

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;

    if (!key) {
        throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    // If key is hex-encoded, convert to buffer
    if (key.length === 64) {
        return Buffer.from(key, 'hex');
    }

    // Otherwise derive key from passphrase using PBKDF2
    const salt = Buffer.from('conversure-salt-v1', 'utf-8'); // Static salt for consistency
    return crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');
}

/**
 * Encrypt data using AES-256-GCM
 * 
 * @param plaintext - Data to encrypt (string or object)
 * @returns Encrypted data as base64 string with format: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string | object): string {
    try {
        const data = typeof plaintext === 'string' ? plaintext : JSON.stringify(plaintext);
        const key = getEncryptionKey();

        // Generate random IV
        const iv = crypto.randomBytes(IV_LENGTH);

        // Create cipher
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        // Encrypt
        let encrypted = cipher.update(data, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        // Get auth tag
        const authTag = cipher.getAuthTag();

        // Combine IV:authTag:ciphertext
        const result = `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;

        return result;
    } catch (error) {
        console.error('[Encryption] Encrypt error:', error);
        throw new Error('Encryption failed');
    }
}

/**
 * Decrypt data using AES-256-GCM
 * 
 * @param encrypted - Encrypted data in format: iv:authTag:ciphertext
 * @returns Decrypted plaintext
 */
export function decrypt(encrypted: string): string {
    try {
        const key = getEncryptionKey();

        // Split components
        const parts = encrypted.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted data format');
        }

        const iv = Buffer.from(parts[0], 'base64');
        const authTag = Buffer.from(parts[1], 'base64');
        const ciphertext = parts[2];

        // Create decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        // Decrypt
        let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('[Encryption] Decrypt error:', error);
        throw new Error('Decryption failed');
    }
}

/**
 * Decrypt and parse JSON object
 */
export function decryptJson<T = any>(encrypted: string): T {
    const decrypted = decrypt(encrypted);
    return JSON.parse(decrypted);
}

/**
 * Mask phone number for logging
 * Shows first 4 and last 4 digits: +971****5678
 */
export function maskPhone(phone: string): string {
    if (!phone || phone.length < 8) {
        return '***';
    }

    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 8) {
        return '***';
    }

    const start = phone.substring(0, Math.min(4, phone.length));
    const end = phone.substring(Math.max(phone.length - 4, 4));
    const masked = `${start}****${end}`;

    return masked;
}

/**
 * Mask sensitive data in webhook payloads
 */
export function maskWebhookPayload(payload: any): any {
    const masked = JSON.parse(JSON.stringify(payload));

    // Common fields to mask
    const sensitiveFields = [
        'phone', 'phone_number', 'from', 'to',
        'email', 'api_key', 'token', 'password',
        'access_token', 'refresh_token', 'secret',
    ];

    function maskObject(obj: any) {
        if (!obj || typeof obj !== 'object') return;

        for (const key of Object.keys(obj)) {
            const lowerKey = key.toLowerCase();

            if (sensitiveFields.some(field => lowerKey.includes(field))) {
                if (typeof obj[key] === 'string') {
                    if (lowerKey.includes('phone') || lowerKey.includes('from') || lowerKey.includes('to')) {
                        obj[key] = maskPhone(obj[key]);
                    } else {
                        obj[key] = '***REDACTED***';
                    }
                }
            } else if (typeof obj[key] === 'object') {
                maskObject(obj[key]);
            }
        }
    }

    maskObject(masked);
    return masked;
}

/**
 * Generate webhook signature verification
 */
export function verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
): boolean {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const computed = hmac.digest('hex');

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(computed)
    );
}
