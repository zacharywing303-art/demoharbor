/**
 * ============================================================================
 * EVENT STORE - In-Memory Event Storage
 * ============================================================================
 * 
 * Stores events in memory for the dashboard.
 * In production, you'd use Redis, PostgreSQL, or a time-series database.
 */

export class EventStore {
  constructor(maxEvents = 1000) {
    this.events = [];
    this.maxEvents = maxEvents;
    this.stats = {
      totalProcessed: 0,
      totalBlocked: 0,
      totalForwarded: 0,
      processingTimes: []
    };
  }

  /**
   * Add an event to the store
   */
  addEvent(event) {
    this.events.unshift(event); // Add to beginning for recent-first order
    
    // Maintain max size
    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }

    // Update stats
    this.stats.totalProcessed++;
    
    if (event.status === 'blocked_by_consent') {
      this.stats.totalBlocked++;
    }
    
    if (event.forwardingResults?.length > 0) {
      this.stats.totalForwarded++;
    }

    if (event.processingTime) {
      this.stats.processingTimes.push(event.processingTime);
      // Keep only last 100 for average calculation
      if (this.stats.processingTimes.length > 100) {
        this.stats.processingTimes.shift();
      }
    }
  }

  /**
   * Get all events
   */
  getEvents() {
    return this.events;
  }

  /**
   * Get event by ID
   */
  getEventById(eventId) {
    return this.events.find(e => e.eventId === eventId);
  }

  /**
   * Get events by type
   */
  getEventsByType(eventName) {
    return this.events.filter(e => e.eventName === eventName);
  }

  /**
   * Get recent events
   */
  getRecentEvents(count = 10) {
    return this.events.slice(0, count);
  }

  /**
   * Get statistics
   */
  getStats() {
    const avgProcessingTime = this.stats.processingTimes.length > 0
      ? this.stats.processingTimes.reduce((a, b) => a + b, 0) / this.stats.processingTimes.length
      : 0;

    return {
      ...this.stats,
      currentEventCount: this.events.length,
      maxEvents: this.maxEvents,
      averageProcessingTime: Math.round(avgProcessingTime * 100) / 100
    };
  }

  /**
   * Clear all events
   */
  clear() {
    this.events = [];
    this.stats = {
      totalProcessed: 0,
      totalBlocked: 0,
      totalForwarded: 0,
      processingTimes: []
    };
  }

  /**
   * Export events as JSON
   */
  export() {
    return {
      exportDate: new Date().toISOString(),
      eventCount: this.events.length,
      stats: this.getStats(),
      events: this.events
    };
  }
}
