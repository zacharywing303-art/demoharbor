/**
 * ============================================================================
 * DATA ENRICHMENT SERVICE
 * ============================================================================
 * 
 * This is the CORE BENEFIT of Server-Side Tracking!
 * 
 * We enrich client-side events with server-side data:
 * - IP address (with anonymization options)
 * - User-Agent parsing (device, browser, OS)
 * - Geolocation (country, city, region)
 * - Server timestamp (more reliable than client time)
 * - Session management
 * - Server-side computed values
 * 
 * WHY THIS MATTERS:
 * 1. More accurate data (server time vs client time)
 * 2. Data clients can't easily spoof (IP, headers)
 * 3. Adds context without exposing it to client JS
 * 4. API keys stay secure
 */

import UAParser from 'ua-parser-js';
import geoip from 'geoip-lite';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Main enrichment function
 */
export async function enrichEventData(eventData, req, eventId) {
  const startTime = Date.now();
  
  // Get raw request data
  const rawIp = getClientIp(req);
  const userAgent = req.headers['user-agent'] || '';
  const referer = req.headers['referer'] || req.headers['referrer'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';

  // Parse User-Agent
  const uaParser = new UAParser(userAgent);
  const uaResult = uaParser.getResult();

  // Get geolocation
  const geo = rawIp ? geoip.lookup(rawIp) : null;

  // Anonymize IP if configured
  const anonymizedIp = process.env.ANONYMIZE_IP === 'true' 
    ? anonymizeIp(rawIp, Number(process.env.IP_ANONYMIZATION_MASK) || 2)
    : rawIp;

  // Generate or use existing session ID
  const sessionId = req.headers['x-session-id'] || generateSessionId(rawIp, userAgent);
  
  // Generate client hash (for user identification without cookies)
  const clientHash = generateClientHash(rawIp, userAgent, acceptLanguage);

  // Build enriched data
  const enrichedData = {
    // Original event data
    ...eventData,
    
    // Event metadata
    eventId,
    serverTimestamp: new Date().toISOString(),
    clientTimestamp: eventData.timestamp || eventData.clientTimestamp,
    
    // Session info
    sessionId,
    clientId: req.headers['x-client-id'] || clientHash,
    
    // Enrichment data
    enrichment: {
      // IP Information (anonymized)
      ip: {
        raw: anonymizedIp,
        isAnonymized: process.env.ANONYMIZE_IP === 'true',
        version: rawIp?.includes(':') ? 'ipv6' : 'ipv4'
      },
      
      // Device Information
      device: {
        type: uaResult.device.type || 'desktop',
        vendor: uaResult.device.vendor || 'unknown',
        model: uaResult.device.model || 'unknown'
      },
      
      // Browser Information
      browser: {
        name: uaResult.browser.name || 'unknown',
        version: uaResult.browser.version || 'unknown',
        major: uaResult.browser.major || 'unknown'
      },
      
      // Operating System
      os: {
        name: uaResult.os.name || 'unknown',
        version: uaResult.os.version || 'unknown'
      },
      
      // Engine (rendering)
      engine: {
        name: uaResult.engine.name || 'unknown',
        version: uaResult.engine.version || 'unknown'
      },
      
      // Geolocation (based on IP)
      geo: geo ? {
        country: geo.country,
        region: geo.region,
        city: geo.city,
        timezone: geo.timezone,
        ll: geo.ll // [latitude, longitude]
      } : null,
      
      // Request metadata
      request: {
        referer: referer,
        language: parseAcceptLanguage(acceptLanguage),
        method: req.method,
        protocol: req.protocol,
        secure: req.secure
      },
      
      // User identification (privacy-safe hash)
      userHash: clientHash
    },
    
    // Server-side additions (SECURE - never exposed to browser)
    serverEnrichment: {
      apiKey: process.env.API_KEY, // Added server-side, never sent to browser!
      serverVersion: '1.0.0',
      processingNode: process.env.HOSTNAME || 'primary',
      enrichmentTime: Date.now() - startTime
    }
  };

  return enrichedData;
}

/**
 * Extract client IP from request
 * Handles various proxy setups (Cloudflare, nginx, etc.)
 */
function getClientIp(req) {
  // Priority order for IP headers
  const headers = [
    'cf-connecting-ip',        // Cloudflare
    'x-real-ip',               // nginx
    'x-forwarded-for',         // Standard proxy header
    'x-client-ip',             // Custom
    'x-cluster-client-ip',     // Some load balancers
    'forwarded'                // RFC 7239
  ];

  for (const header of headers) {
    const value = req.headers[header];
    if (value) {
      // x-forwarded-for can contain multiple IPs
      const ip = value.split(',')[0].trim();
      if (isValidIp(ip)) {
        return ip;
      }
    }
  }

  // Fall back to socket remote address
  return req.ip || req.socket?.remoteAddress || '0.0.0.0';
}

/**
 * Validate IP address format
 */
function isValidIp(ip) {
  // IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip.includes('::');
}

/**
 * Anonymize IP address (GDPR compliance)
 * Mask the last N octets of the IP
 */
function anonymizeIp(ip, maskOctets = 2) {
  if (!ip) return null;
  
  // IPv4 anonymization
  if (!ip.includes(':')) {
    const parts = ip.split('.');
    for (let i = Math.max(0, 4 - maskOctets); i < 4; i++) {
      parts[i] = '0';
    }
    return parts.join('.');
  }
  
  // IPv6 anonymization (mask last groups)
  const parts = ip.split(':');
  for (let i = Math.max(0, parts.length - maskOctets); i < parts.length; i++) {
    parts[i] = '0';
  }
  return parts.join(':');
}

/**
 * Generate session ID from request data
 */
function generateSessionId(ip, userAgent) {
  const data = `${ip}-${userAgent}-${Math.floor(Date.now() / (30 * 60 * 1000))}`; // 30-min windows
  return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
}

/**
 * Generate client hash for identification
 * This creates a fingerprint without using cookies
 */
function generateClientHash(ip, userAgent, language) {
  const data = `${ip}-${userAgent}-${language}`;
  return crypto.createHash('sha256').update(data).digest('hex').slice(0, 24);
}

/**
 * Parse Accept-Language header
 */
function parseAcceptLanguage(header) {
  if (!header) return null;
  
  const languages = header.split(',').map(lang => {
    const [code, quality] = lang.trim().split(';q=');
    return {
      code: code.trim(),
      quality: quality ? parseFloat(quality) : 1.0
    };
  });
  
  languages.sort((a, b) => b.quality - a.quality);
  
  return {
    primary: languages[0]?.code || 'en',
    all: languages.map(l => l.code)
  };
}
