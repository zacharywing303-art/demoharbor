/**
 * ============================================================================
 * ANALYTICS FORWARDER SERVICE
 * ============================================================================
 * 
 * This is where the "Server-Side" part of SST happens!
 * 
 * Instead of the browser sending data directly to Google/Facebook/etc.,
 * our server forwards it. This provides:
 * 
 * 1. AD-BLOCKER BYPASS: Browser only talks to your domain
 * 2. SECURE API KEYS: Tokens never leave the server
 * 3. DATA CONTROL: You decide what gets sent
 * 4. RELIABILITY: Server-to-server is more reliable than browser
 * 
 * SUPPORTED DESTINATIONS:
 * - Mock GTM Server Container
 * - Google Analytics 4 (Measurement Protocol)
 * - Facebook Conversions API
 * - Custom Webhooks
 */

import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Create axios instance with defaults
const httpClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Main forwarding function - sends data to all configured destinations
 */
export async function forwardToAnalytics(eventData, consentStatus) {
  const results = [];

  // Determine which services to forward to based on consent
  const services = getServicesForConsent(consentStatus);

  // Forward to each service in parallel
  const forwardingPromises = services.map(async (service) => {
    try {
      const result = await forwardToService(service, eventData);
      results.push({ service, ...result });
    } catch (error) {
      console.error(`[FORWARDING ERROR] ${service}:`, error.message);
      results.push({
        service,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  await Promise.allSettled(forwardingPromises);

  return results;
}

/**
 * Get list of services to forward to based on consent
 */
function getServicesForConsent(consentStatus) {
  const services = ['mock_gtm']; // Always send to our mock GTM

  if (consentStatus === 'granted' || consentStatus === 'full') {
    services.push('ga4', 'facebook_capi');
  } else if (consentStatus === 'analytics_only') {
    services.push('ga4');
  }

  return services;
}

/**
 * Forward to specific service
 */
async function forwardToService(service, eventData) {
  switch (service) {
    case 'mock_gtm':
      return await forwardToMockGTM(eventData);
    case 'ga4':
      return await forwardToGA4(eventData);
    case 'facebook_capi':
      return await forwardToFacebookCAPI(eventData);
    default:
      throw new Error(`Unknown service: ${service}`);
  }
}

/**
 * ============================================================================
 * MOCK GTM SERVER CONTAINER
 * ============================================================================
 * 
 * In a real setup, this would be your GTM Server-Side container URL
 * (e.g., https://sst.yourdomain.com)
 * 
 * The mock uses jsonplaceholder.typicode.com for demo purposes
 */
async function forwardToMockGTM(eventData) {
  const startTime = Date.now();
  
  const payload = {
    // GTM-compatible format
    client_id: eventData.clientId,
    event_name: eventData.eventName,
    event_params: {
      ...eventData,
      // Remove server-side only data before forwarding
      serverEnrichment: undefined
    },
    user_agent: eventData.enrichment?.browser?.name,
    ip_override: eventData.enrichment?.ip?.raw,
    timestamp_micros: Date.now() * 1000
  };

  try {
    const response = await httpClient.post(
      process.env.GTM_SERVER_URL || 'https://jsonplaceholder.typicode.com/posts',
      payload
    );

    console.log(`[FORWARDED TO GTM] Event: ${eventData.eventName}`);
    
    return {
      success: true,
      statusCode: response.status,
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      destination: 'GTM Server Container (Mock)'
    };
  } catch (error) {
    throw new Error(`GTM forwarding failed: ${error.message}`);
  }
}

/**
 * ============================================================================
 * GOOGLE ANALYTICS 4 - MEASUREMENT PROTOCOL
 * ============================================================================
 * 
 * Direct server-to-server GA4 tracking
 * Docs: https://developers.google.com/analytics/devguides/collection/protocol/ga4
 */
async function forwardToGA4(eventData) {
  const startTime = Date.now();
  
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  // Skip if not configured
  if (!measurementId || measurementId === 'G-XXXXXXXXXX') {
    return {
      success: true,
      skipped: true,
      reason: 'GA4 not configured (demo mode)',
      timestamp: new Date().toISOString()
    };
  }

  const payload = {
    client_id: eventData.clientId,
    timestamp_micros: Date.now() * 1000,
    events: [{
      name: eventData.eventName,
      params: {
        session_id: eventData.sessionId,
        engagement_time_msec: 100,
        // E-commerce params
        ...(eventData.ecommerce && {
          currency: eventData.currency || 'USD',
          value: eventData.transactionValue,
          items: eventData.ecommerce.items
        }),
        // Custom params
        page_location: eventData.pageUrl,
        page_title: eventData.pageTitle,
        // Device info
        device_type: eventData.enrichment?.device?.type,
        browser: eventData.enrichment?.browser?.name
      }
    }],
    user_properties: {
      country: { value: eventData.enrichment?.geo?.country }
    }
  };

  try {
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;
    
    // In demo mode, we'll simulate the request
    console.log(`[GA4 PAYLOAD] Would send to GA4:`, JSON.stringify(payload, null, 2));
    
    return {
      success: true,
      simulated: true,
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      destination: 'Google Analytics 4'
    };
  } catch (error) {
    throw new Error(`GA4 forwarding failed: ${error.message}`);
  }
}

/**
 * ============================================================================
 * FACEBOOK CONVERSIONS API (CAPI)
 * ============================================================================
 * 
 * Server-side Facebook tracking
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 */
async function forwardToFacebookCAPI(eventData) {
  const startTime = Date.now();
  
  const pixelId = process.env.FB_PIXEL_ID;
  const accessToken = process.env.FB_ACCESS_TOKEN;

  // Skip if not configured
  if (!pixelId || pixelId === 'your_pixel_id') {
    return {
      success: true,
      skipped: true,
      reason: 'Facebook CAPI not configured (demo mode)',
      timestamp: new Date().toISOString()
    };
  }

  // Map event names to Facebook standard events
  const fbEventName = mapToFacebookEvent(eventData.eventName);

  // Hash user data for privacy
  const userData = {
    client_ip_address: eventData.enrichment?.ip?.raw,
    client_user_agent: eventData.enrichment?.browser?.name,
    // Hash PII before sending
    em: eventData.email ? hashSHA256(eventData.email.toLowerCase()) : undefined,
    ph: eventData.phone ? hashSHA256(eventData.phone) : undefined,
    external_id: eventData.clientId ? hashSHA256(eventData.clientId) : undefined,
    // Geo data
    country: eventData.enrichment?.geo?.country?.toLowerCase(),
    ct: eventData.enrichment?.geo?.city?.toLowerCase()
  };

  const payload = {
    data: [{
      event_name: fbEventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: eventData.pageUrl,
      user_data: userData,
      custom_data: {
        currency: eventData.currency || 'USD',
        value: eventData.transactionValue,
        content_type: 'product',
        content_ids: eventData.productId ? [eventData.productId] : undefined
      }
    }]
  };

  try {
    // In demo mode, we'll simulate the request
    console.log(`[FB CAPI PAYLOAD] Would send to Facebook:`, JSON.stringify(payload, null, 2));
    
    return {
      success: true,
      simulated: true,
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      destination: 'Facebook Conversions API'
    };
  } catch (error) {
    throw new Error(`Facebook CAPI forwarding failed: ${error.message}`);
  }
}

/**
 * Map custom events to Facebook standard events
 */
function mapToFacebookEvent(eventName) {
  const mapping = {
    'page_view': 'PageView',
    'purchase': 'Purchase',
    'add_to_cart': 'AddToCart',
    'begin_checkout': 'InitiateCheckout',
    'view_item': 'ViewContent',
    'search': 'Search',
    'sign_up': 'CompleteRegistration',
    'lead': 'Lead',
    'contact': 'Contact'
  };

  return mapping[eventName] || eventName;
}

/**
 * Hash data with SHA256 (required by Facebook CAPI)
 */
function hashSHA256(data) {
  if (!data) return undefined;
  return crypto.createHash('sha256').update(data.toString()).digest('hex');
}

/**
 * ============================================================================
 * CUSTOM WEBHOOK FORWARDER
 * ============================================================================
 * 
 * Forward events to any custom webhook endpoint
 */
export async function forwardToWebhook(webhookUrl, eventData, headers = {}) {
  const startTime = Date.now();

  try {
    const response = await httpClient.post(webhookUrl, eventData, { headers });

    return {
      success: true,
      statusCode: response.status,
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
