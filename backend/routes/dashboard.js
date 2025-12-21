/**
 * ============================================================================
 * DASHBOARD ROUTES - Event & Analytics Viewing
 * ============================================================================
 * 
 * API endpoints for the dashboard to retrieve tracked events and statistics.
 */

import express from 'express';
import { eventStore } from '../server.js';

const router = express.Router();

/**
 * GET /dashboard/events
 * Get all tracked events with pagination
 */
router.get('/events', (req, res) => {
  const { 
    limit = 50, 
    offset = 0, 
    eventName, 
    status,
    startDate,
    endDate 
  } = req.query;

  let events = eventStore.getEvents();

  // Filter by event name
  if (eventName) {
    events = events.filter(e => e.eventName === eventName);
  }

  // Filter by status
  if (status) {
    events = events.filter(e => e.status === status);
  }

  // Filter by date range
  if (startDate) {
    const start = new Date(startDate);
    events = events.filter(e => new Date(e.serverTimestamp) >= start);
  }

  if (endDate) {
    const end = new Date(endDate);
    events = events.filter(e => new Date(e.serverTimestamp) <= end);
  }

  // Sort by timestamp (most recent first)
  events.sort((a, b) => new Date(b.serverTimestamp) - new Date(a.serverTimestamp));

  // Paginate
  const total = events.length;
  const paginatedEvents = events.slice(Number(offset), Number(offset) + Number(limit));

  res.json({
    success: true,
    total,
    limit: Number(limit),
    offset: Number(offset),
    hasMore: Number(offset) + Number(limit) < total,
    events: paginatedEvents
  });
});

/**
 * GET /dashboard/stats
 * Get analytics statistics
 */
router.get('/stats', (req, res) => {
  const events = eventStore.getEvents();
  const stats = eventStore.getStats();

  // Calculate additional stats
  const now = new Date();
  const last24h = new Date(now - 24 * 60 * 60 * 1000);
  const lastHour = new Date(now - 60 * 60 * 1000);

  const eventsLast24h = events.filter(e => new Date(e.serverTimestamp) >= last24h);
  const eventsLastHour = events.filter(e => new Date(e.serverTimestamp) >= lastHour);

  // Count by event type
  const eventTypeCounts = events.reduce((acc, e) => {
    acc[e.eventName] = (acc[e.eventName] || 0) + 1;
    return acc;
  }, {});

  // Count by status
  const statusCounts = events.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1;
    return acc;
  }, {});

  // Count by device type
  const deviceCounts = events.reduce((acc, e) => {
    const device = e.enrichment?.device?.type || 'unknown';
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {});

  // Count by browser
  const browserCounts = events.reduce((acc, e) => {
    const browser = e.enrichment?.browser?.name || 'unknown';
    acc[browser] = (acc[browser] || 0) + 1;
    return acc;
  }, {});

  // Calculate total revenue
  const totalRevenue = events
    .filter(e => e.transactionValue)
    .reduce((sum, e) => sum + (e.transactionValue || 0), 0);

  // Count by forwarding service
  const forwardingCounts = {};
  events.forEach(e => {
    if (e.forwardingResults) {
      e.forwardingResults.forEach(r => {
        forwardingCounts[r.service] = (forwardingCounts[r.service] || 0) + 1;
      });
    }
  });

  res.json({
    success: true,
    stats: {
      total: events.length,
      last24Hours: eventsLast24h.length,
      lastHour: eventsLastHour.length,
      byEventType: eventTypeCounts,
      byStatus: statusCounts,
      byDevice: deviceCounts,
      byBrowser: browserCounts,
      byForwardingService: forwardingCounts,
      totalRevenue,
      averageProcessingTime: stats.averageProcessingTime || 0,
      ...stats
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /dashboard/event/:id
 * Get a single event by ID
 */
router.get('/event/:id', (req, res) => {
  const { id } = req.params;
  const event = eventStore.getEventById(id);

  if (!event) {
    return res.status(404).json({
      success: false,
      error: 'Event not found'
    });
  }

  res.json({
    success: true,
    event
  });
});

/**
 * GET /dashboard/timeline
 * Get events grouped by time for timeline visualization
 */
router.get('/timeline', (req, res) => {
  const { interval = 'hour', hours = 24 } = req.query;
  const events = eventStore.getEvents();
  
  const now = new Date();
  const startTime = new Date(now - Number(hours) * 60 * 60 * 1000);

  const relevantEvents = events.filter(e => new Date(e.serverTimestamp) >= startTime);

  // Group by interval
  const timeline = {};
  
  relevantEvents.forEach(e => {
    const date = new Date(e.serverTimestamp);
    let key;
    
    if (interval === 'minute') {
      key = date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    } else if (interval === 'hour') {
      key = date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
    } else {
      key = date.toISOString().slice(0, 10); // YYYY-MM-DD
    }

    if (!timeline[key]) {
      timeline[key] = { timestamp: key, count: 0, events: [] };
    }
    timeline[key].count++;
    timeline[key].events.push(e.eventName);
  });

  res.json({
    success: true,
    interval,
    hours: Number(hours),
    timeline: Object.values(timeline).sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  });
});

/**
 * DELETE /dashboard/events/clear
 * Clear all events (for demo purposes)
 */
router.delete('/events/clear', (req, res) => {
  eventStore.clear();
  
  res.json({
    success: true,
    message: 'All events cleared'
  });
});

/**
 * GET /dashboard/forwarding-log
 * Get log of all forwarded events
 */
router.get('/forwarding-log', (req, res) => {
  const events = eventStore.getEvents();
  
  const forwardingLog = events
    .filter(e => e.forwardingResults && e.forwardingResults.length > 0)
    .map(e => ({
      eventId: e.eventId,
      eventName: e.eventName,
      timestamp: e.serverTimestamp,
      forwardingResults: e.forwardingResults
    }));

  res.json({
    success: true,
    total: forwardingLog.length,
    log: forwardingLog
  });
});

export { router as dashboardRouter };
