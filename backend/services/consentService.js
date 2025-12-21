/**
 * ============================================================================
 * CONSENT SERVICE
 * ============================================================================
 * 
 * Manages consent checking for GDPR/CCPA compliance.
 * 
 * CONSENT LEVELS:
 * - denied: Only necessary tracking (security, fraud)
 * - analytics_only: Analytics allowed, marketing denied
 * - granted/full: All tracking allowed
 */

import { consentStore } from '../routes/consent.js';

// Events that are always allowed (necessary for site function)
const NECESSARY_EVENTS = [
  'error',
  'security_event',
  'fraud_check',
  'session_start',
  'consent_update'
];

// Events that require marketing consent
const MARKETING_EVENTS = [
  'purchase',
  'add_to_cart',
  'view_item',
  'begin_checkout',
  'sign_up',
  'lead',
  'contact'
];

/**
 * Check if event is allowed based on consent status
 */
export function checkConsent(consentStatus, eventName) {
  // Necessary events are always allowed
  if (NECESSARY_EVENTS.includes(eventName)) {
    return {
      allowed: true,
      reason: 'Necessary event - always allowed',
      category: 'necessary'
    };
  }

  // Check consent status
  switch (consentStatus) {
    case 'granted':
    case 'full':
      return {
        allowed: true,
        reason: 'Full consent granted',
        category: 'granted'
      };

    case 'analytics_only':
      // Marketing events blocked
      if (MARKETING_EVENTS.includes(eventName)) {
        return {
          allowed: false,
          reason: 'Marketing consent not granted',
          category: 'marketing_blocked'
        };
      }
      return {
        allowed: true,
        reason: 'Analytics consent granted',
        category: 'analytics'
      };

    case 'denied':
    case 'none':
      return {
        allowed: false,
        reason: 'Consent not granted',
        category: 'denied'
      };

    default:
      // Default to denied for unknown consent status
      console.warn(`[CONSENT] Unknown consent status: ${consentStatus}`);
      return {
        allowed: false,
        reason: 'Unknown consent status - defaulting to denied',
        category: 'unknown'
      };
  }
}

/**
 * Get consent status for a client
 */
export function getClientConsent(clientId) {
  if (!clientId) {
    return {
      status: 'unknown',
      categories: {
        necessary: true,
        analytics: false,
        marketing: false,
        functional: false
      }
    };
  }

  const consent = consentStore.get(clientId);
  
  if (!consent) {
    return {
      status: 'not_set',
      categories: {
        necessary: true,
        analytics: false,
        marketing: false,
        functional: false
      }
    };
  }

  return {
    status: 'set',
    categories: consent.categories,
    updatedAt: consent.timestamp
  };
}

/**
 * Check if specific consent category is granted
 */
export function hasConsentFor(clientId, category) {
  const consent = getClientConsent(clientId);
  return consent.categories[category] === true;
}

/**
 * Get consent mode string for analytics platforms
 */
export function getConsentModeString(clientId) {
  const consent = getClientConsent(clientId);
  
  if (consent.categories.marketing && consent.categories.analytics) {
    return 'granted';
  } else if (consent.categories.analytics) {
    return 'analytics_only';
  } else {
    return 'denied';
  }
}
