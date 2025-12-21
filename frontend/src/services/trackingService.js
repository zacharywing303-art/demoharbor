/**
 * ============================================================================
 * TRACKING SERVICE - Client-Side Tracking API
 * ============================================================================
 * 
 * This service handles all tracking calls from the frontend to our SST backend.
 * 
 * KEY POINT: All requests go to our own server (localhost:5000), NOT directly
 * to Google/Facebook/etc. This is what makes it "Server-Side Tracking"!
 */

import axios from 'axios'
import { useTrackingStore } from '../store/trackingStore'

// API base URL - points to OUR server, not third-party
const API_BASE = 'http://localhost:5000'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add request interceptor to include tracking headers
api.interceptors.request.use((config) => {
  const store = useTrackingStore.getState()
  
  // Add client identification headers
  config.headers['X-Client-ID'] = store.clientId
  config.headers['X-Session-ID'] = store.sessionId
  config.headers['X-Consent-Status'] = store.getConsentString()
  
  return config
})

/**
 * Track a generic event
 */
export async function trackEvent(eventName, eventData = {}) {
  const store = useTrackingStore.getState()
  store.setIsTracking(true)
  store.setLastTrackingError(null)
  
  try {
    const payload = {
      eventName,
      ...eventData,
      clientId: store.clientId,
      sessionId: store.sessionId,
      timestamp: new Date().toISOString(),
      pageUrl: window.location.href,
      pageTitle: document.title,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      platform: navigator.platform,
      referrer: document.referrer
    }

    const response = await api.post('/track-event', payload)
    
    console.log(`[SST] Event tracked: ${eventName}`, response.data)
    return response.data
    
  } catch (error) {
    console.error(`[SST] Tracking error:`, error)
    store.setLastTrackingError(error.message)
    throw error
  } finally {
    store.setIsTracking(false)
  }
}

/**
 * Track page view
 */
export async function trackPageView(pageData = {}) {
  return trackEvent('page_view', {
    pageUrl: window.location.href,
    pageTitle: document.title,
    pagePath: window.location.pathname,
    pageSearch: window.location.search,
    pageHash: window.location.hash,
    ...pageData
  })
}

/**
 * Track e-commerce events
 */
export async function trackEcommerce(action, data = {}) {
  const store = useTrackingStore.getState()
  store.setIsTracking(true)
  
  try {
    const payload = {
      action,
      ...data,
      clientId: store.clientId,
      sessionId: store.sessionId,
      timestamp: new Date().toISOString(),
      pageUrl: window.location.href
    }

    const response = await api.post('/track-event/ecommerce', payload)
    
    console.log(`[SST] E-commerce event tracked: ${action}`, response.data)
    return response.data
    
  } catch (error) {
    console.error(`[SST] E-commerce tracking error:`, error)
    store.setLastTrackingError(error.message)
    throw error
  } finally {
    store.setIsTracking(false)
  }
}

/**
 * Track custom events
 */
export async function trackCustom(eventName, customData = {}) {
  const store = useTrackingStore.getState()
  
  try {
    const payload = {
      eventName,
      customData,
      clientId: store.clientId,
      sessionId: store.sessionId,
      timestamp: new Date().toISOString()
    }

    const response = await api.post('/track-event/custom', payload)
    return response.data
    
  } catch (error) {
    console.error(`[SST] Custom event tracking error:`, error)
    throw error
  }
}

/**
 * Batch track multiple events
 */
export async function trackBatch(events) {
  try {
    const response = await api.post('/track-event/batch', { events })
    console.log(`[SST] Batch tracked: ${events.length} events`, response.data)
    return response.data
  } catch (error) {
    console.error(`[SST] Batch tracking error:`, error)
    throw error
  }
}

/**
 * Update consent preferences
 */
export async function updateConsent(consent) {
  const store = useTrackingStore.getState()
  
  try {
    const response = await api.post('/consent/update', {
      clientId: store.clientId,
      consent
    })
    
    store.setConsent(consent)
    console.log(`[SST] Consent updated`, response.data)
    return response.data
    
  } catch (error) {
    console.error(`[SST] Consent update error:`, error)
    throw error
  }
}

/**
 * Get current consent status from server
 */
export async function getConsentStatus() {
  const store = useTrackingStore.getState()
  
  try {
    const response = await api.get('/consent/status', {
      params: { clientId: store.clientId }
    })
    return response.data
  } catch (error) {
    console.error(`[SST] Get consent error:`, error)
    throw error
  }
}

/**
 * Revoke all consent (opt-out)
 */
export async function revokeConsent() {
  const store = useTrackingStore.getState()
  
  try {
    const response = await api.post('/consent/revoke', {
      clientId: store.clientId
    })
    
    store.setConsent({
      analytics: false,
      marketing: false,
      functional: false,
      necessary: true
    })
    
    return response.data
  } catch (error) {
    console.error(`[SST] Revoke consent error:`, error)
    throw error
  }
}

/**
 * Get dashboard events
 */
export async function getDashboardEvents(params = {}) {
  try {
    const response = await api.get('/dashboard/events', { params })
    return response.data
  } catch (error) {
    console.error(`[SST] Get events error:`, error)
    throw error
  }
}

/**
 * Get dashboard stats
 */
export async function getDashboardStats() {
  try {
    const response = await api.get('/dashboard/stats')
    return response.data
  } catch (error) {
    console.error(`[SST] Get stats error:`, error)
    throw error
  }
}

/**
 * Get timeline data
 */
export async function getTimeline(interval = 'hour', hours = 24) {
  try {
    const response = await api.get('/dashboard/timeline', {
      params: { interval, hours }
    })
    return response.data
  } catch (error) {
    console.error(`[SST] Get timeline error:`, error)
    throw error
  }
}

/**
 * Clear all events (for demo)
 */
export async function clearEvents() {
  try {
    const response = await api.delete('/dashboard/events/clear')
    return response.data
  } catch (error) {
    console.error(`[SST] Clear events error:`, error)
    throw error
  }
}

/**
 * Health check
 */
export async function checkHealth() {
  try {
    const response = await api.get('/health')
    return response.data
  } catch (error) {
    console.error(`[SST] Health check error:`, error)
    throw error
  }
}

export default {
  trackEvent,
  trackPageView,
  trackEcommerce,
  trackCustom,
  trackBatch,
  updateConsent,
  getConsentStatus,
  revokeConsent,
  getDashboardEvents,
  getDashboardStats,
  getTimeline,
  clearEvents,
  checkHealth
}
