/**
 * ============================================================================
 * TRACKING STORE - Zustand State Management
 * ============================================================================
 * 
 * Centralized state for tracking, consent, and real-time events
 */

import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

// Get or create client ID
const getClientId = () => {
  let clientId = localStorage.getItem('sst_client_id')
  if (!clientId) {
    clientId = uuidv4()
    localStorage.setItem('sst_client_id', clientId)
  }
  return clientId
}

// Get or create session ID (expires after 30 min of inactivity)
const getSessionId = () => {
  const now = Date.now()
  const sessionData = JSON.parse(localStorage.getItem('sst_session') || '{}')
  
  // Session expires after 30 minutes
  if (sessionData.id && sessionData.lastActivity && now - sessionData.lastActivity < 30 * 60 * 1000) {
    // Update last activity
    sessionData.lastActivity = now
    localStorage.setItem('sst_session', JSON.stringify(sessionData))
    return sessionData.id
  }
  
  // Create new session
  const newSession = {
    id: uuidv4().slice(0, 16),
    lastActivity: now,
    startTime: now
  }
  localStorage.setItem('sst_session', JSON.stringify(newSession))
  return newSession.id
}

export const useTrackingStore = create((set, get) => ({
  // Client identification
  clientId: getClientId(),
  sessionId: getSessionId(),
  
  // Consent state
  consent: JSON.parse(localStorage.getItem('sst_consent') || JSON.stringify({
    analytics: false,
    marketing: false,
    functional: true,
    necessary: true
  })),
  showConsentBanner: !localStorage.getItem('sst_consent'),
  
  // Real-time events from server
  events: [],
  stats: null,
  
  // Connection status
  isConnected: false,
  serverStatus: null,
  
  // Loading states
  isTracking: false,
  lastTrackingError: null,
  
  // Actions
  setConsent: (consent) => {
    const newConsent = { ...get().consent, ...consent }
    localStorage.setItem('sst_consent', JSON.stringify(newConsent))
    set({ consent: newConsent })
  },
  
  setShowConsentBanner: (show) => set({ showConsentBanner: show }),
  
  addEvent: (event) => set((state) => ({
    events: [event, ...state.events].slice(0, 100) // Keep last 100 events
  })),
  
  setEvents: (events) => set({ events }),
  
  setStats: (stats) => set({ stats }),
  
  setIsConnected: (isConnected) => set({ isConnected }),
  
  setServerStatus: (status) => set({ serverStatus: status }),
  
  setIsTracking: (isTracking) => set({ isTracking }),
  
  setLastTrackingError: (error) => set({ lastTrackingError: error }),
  
  clearEvents: () => set({ events: [] }),
  
  // Get consent string for API
  getConsentString: () => {
    const { consent } = get()
    if (consent.marketing && consent.analytics) return 'granted'
    if (consent.analytics) return 'analytics_only'
    return 'denied'
  },
  
  // Reset client (for testing)
  resetClient: () => {
    localStorage.removeItem('sst_client_id')
    localStorage.removeItem('sst_session')
    localStorage.removeItem('sst_consent')
    set({
      clientId: getClientId(),
      sessionId: getSessionId(),
      consent: {
        analytics: false,
        marketing: false,
        functional: true,
        necessary: true
      },
      showConsentBanner: true,
      events: []
    })
  }
}))
