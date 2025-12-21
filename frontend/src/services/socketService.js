/**
 * ============================================================================
 * SOCKET SERVICE - Real-time Connection to Backend
 * ============================================================================
 */

import { io } from 'socket.io-client'
import { useTrackingStore } from '../store/trackingStore'

let socket = null

export function initializeSocket() {
  if (socket) return socket

  socket = io('http://localhost:5000', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  })

  socket.on('connect', () => {
    console.log('[SOCKET] Connected to SST server')
    useTrackingStore.getState().setIsConnected(true)
  })

  socket.on('disconnect', (reason) => {
    console.log('[SOCKET] Disconnected:', reason)
    useTrackingStore.getState().setIsConnected(false)
  })

  socket.on('connected', (data) => {
    console.log('[SOCKET] Welcome message:', data)
    useTrackingStore.getState().setServerStatus(data)
  })

  // Listen for tracked events
  socket.on('event:tracked', (payload) => {
    console.log('[SOCKET] Event tracked:', payload)
    useTrackingStore.getState().addEvent(payload.data)
  })

  // Listen for blocked events
  socket.on('event:blocked', (payload) => {
    console.log('[SOCKET] Event blocked:', payload)
    useTrackingStore.getState().addEvent({ ...payload.data, blocked: true })
  })

  // Listen for e-commerce events
  socket.on('event:ecommerce', (payload) => {
    console.log('[SOCKET] E-commerce event:', payload)
    useTrackingStore.getState().addEvent(payload.data)
  })

  // Listen for page views
  socket.on('event:pageview', (payload) => {
    console.log('[SOCKET] Page view:', payload)
    useTrackingStore.getState().addEvent(payload.data)
  })

  // Listen for consent updates
  socket.on('consent:updated', (payload) => {
    console.log('[SOCKET] Consent updated:', payload)
  })

  // Listen for batch events
  socket.on('event:batch', (payload) => {
    console.log('[SOCKET] Batch event:', payload)
  })

  // Error handling
  socket.on('connect_error', (error) => {
    console.error('[SOCKET] Connection error:', error)
    useTrackingStore.getState().setIsConnected(false)
  })

  return socket
}

export function getSocket() {
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function subscribeToEvents(eventTypes) {
  if (socket && socket.connected) {
    socket.emit('subscribe', eventTypes)
  }
}

export function unsubscribeFromEvents(eventTypes) {
  if (socket && socket.connected) {
    socket.emit('unsubscribe', eventTypes)
  }
}
