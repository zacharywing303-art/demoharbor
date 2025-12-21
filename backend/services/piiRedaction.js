/**
 * ============================================================================
 * PII REDACTION SERVICE
 * ============================================================================
 * 
 * Automatically detects and redacts Personally Identifiable Information (PII)
 * before data is stored or forwarded.
 * 
 * GDPR-SENSITIVE DATA:
 * - Email addresses
 * - Phone numbers
 * - Credit card numbers
 * - IP addresses (partial)
 * - Names
 * - Social security numbers
 */

import crypto from 'crypto';

// Regex patterns for PII detection
const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /\b(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/g,
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  ssn: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
  ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
};

// Fields that commonly contain PII
const PII_FIELDS = [
  'email',
  'phone',
  'phoneNumber',
  'telephone',
  'creditCard',
  'cardNumber',
  'ssn',
  'socialSecurity',
  'password',
  'name',
  'firstName',
  'lastName',
  'fullName',
  'address',
  'streetAddress',
  'dateOfBirth',
  'dob',
  'passport',
  'drivingLicense'
];

/**
 * Main PII redaction function
 */
export function redactPII(data, options = {}) {
  const {
    hashSensitive = true,    // Hash instead of completely remove
    preserveFormat = false,   // Preserve data format (e.g., email@*****.com)
    redactFields = PII_FIELDS // Fields to redact
  } = options;

  if (!data || typeof data !== 'object') {
    return data;
  }

  const redacted = deepClone(data);
  redactObject(redacted, { hashSensitive, preserveFormat, redactFields });
  
  return redacted;
}

/**
 * Recursively redact PII from an object
 */
function redactObject(obj, options) {
  if (!obj || typeof obj !== 'object') {
    return;
  }

  for (const key of Object.keys(obj)) {
    const value = obj[key];

    // Check if field name suggests PII
    if (isPIIField(key, options.redactFields)) {
      obj[key] = redactValue(value, key, options);
      continue;
    }

    // Check string values for PII patterns
    if (typeof value === 'string') {
      obj[key] = redactStringPatterns(value, options);
    }

    // Recursively process nested objects
    if (typeof value === 'object' && value !== null) {
      redactObject(value, options);
    }
  }
}

/**
 * Check if a field name indicates PII
 */
function isPIIField(fieldName, piiFields) {
  const normalized = fieldName.toLowerCase();
  return piiFields.some(pii => 
    normalized === pii.toLowerCase() || 
    normalized.includes(pii.toLowerCase())
  );
}

/**
 * Redact a value based on its type and field
 */
function redactValue(value, fieldName, options) {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value !== 'string') {
    return '[REDACTED]';
  }

  if (options.hashSensitive) {
    // Create a one-way hash of the value
    const hash = crypto.createHash('sha256')
      .update(value.toString())
      .digest('hex')
      .slice(0, 12);
    return `[HASHED:${hash}]`;
  }

  if (options.preserveFormat) {
    return preserveFormatRedaction(value, fieldName);
  }

  return '[REDACTED]';
}

/**
 * Preserve format while redacting (e.g., j***@example.com)
 */
function preserveFormatRedaction(value, fieldName) {
  const normalized = fieldName.toLowerCase();

  // Email: show first char and domain
  if (normalized.includes('email') && value.includes('@')) {
    const [local, domain] = value.split('@');
    return `${local[0]}***@${domain}`;
  }

  // Phone: show last 4 digits
  if (normalized.includes('phone') || normalized.includes('telephone')) {
    return `***-***-${value.slice(-4)}`;
  }

  // Credit card: show last 4 digits
  if (normalized.includes('card') || normalized.includes('credit')) {
    return `****-****-****-${value.slice(-4)}`;
  }

  // Default: show first and last char
  if (value.length > 2) {
    return `${value[0]}${'*'.repeat(value.length - 2)}${value[value.length - 1]}`;
  }

  return '[REDACTED]';
}

/**
 * Scan and redact PII patterns in strings
 */
function redactStringPatterns(str, options) {
  let result = str;

  // Don't scan very short strings
  if (str.length < 5) {
    return str;
  }

  // Check for email patterns
  if (PII_PATTERNS.email.test(str)) {
    result = result.replace(PII_PATTERNS.email, (match) => {
      if (options.hashSensitive) {
        const hash = crypto.createHash('sha256').update(match).digest('hex').slice(0, 8);
        return `[EMAIL:${hash}]`;
      }
      return '[EMAIL_REDACTED]';
    });
    // Reset lastIndex
    PII_PATTERNS.email.lastIndex = 0;
  }

  // Check for phone patterns
  if (PII_PATTERNS.phone.test(str)) {
    result = result.replace(PII_PATTERNS.phone, (match) => {
      if (options.hashSensitive) {
        return `[PHONE:***${match.slice(-4)}]`;
      }
      return '[PHONE_REDACTED]';
    });
    PII_PATTERNS.phone.lastIndex = 0;
  }

  // Check for credit card patterns
  if (PII_PATTERNS.creditCard.test(str)) {
    result = result.replace(PII_PATTERNS.creditCard, (match) => {
      return `[CARD:****${match.slice(-4)}]`;
    });
    PII_PATTERNS.creditCard.lastIndex = 0;
  }

  // Check for SSN patterns
  if (PII_PATTERNS.ssn.test(str)) {
    result = result.replace(PII_PATTERNS.ssn, '[SSN_REDACTED]');
    PII_PATTERNS.ssn.lastIndex = 0;
  }

  return result;
}

/**
 * Deep clone an object
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }

  const cloned = {};
  for (const key of Object.keys(obj)) {
    cloned[key] = deepClone(obj[key]);
  }
  return cloned;
}

/**
 * Check if data contains PII (for validation)
 */
export function containsPII(data) {
  const jsonStr = JSON.stringify(data);
  
  return Object.entries(PII_PATTERNS).some(([type, pattern]) => {
    pattern.lastIndex = 0;
    return pattern.test(jsonStr);
  });
}
