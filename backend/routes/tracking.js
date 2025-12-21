/**
 * ============================================================================
 * TRACKING ROUTES - Main SST Event Processing
 * ============================================================================
 * 
 * These routes handle all incoming tracking events from the frontend.
 * Key features:
 * - Data enrichment with server-side information
 * - Consent checking before processing
 * - Forwarding to third-party analytics (GTM, GA4, Facebook)
 * - Real-time dashboard updates via WebSocket
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { enrichEventData } from '../services/dataEnrichment.js';
import { forwardToAnalytics } from '../services/analyticsForwarder.js';
import { checkConsent } from '../services/consentService.js';
import { redactPII } from '../services/piiRedaction.js';
import { emitEvent } from '../services/socketService.js';
import { eventStore } from '../server.js';

const router = express.Router();

/**
 * POST /track-event
 * Main tracking endpoint for single events
 * 
 * WHY SST IS BETTER:
 * 1. This request goes to YOUR server (localhost:5000), not directly to analytics
 * 2. Ad-blockers see it as a regular API call to your domain
 * 3. You can add server-side data that browsers don't have access to
 * 4. API keys stay secure on the server
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const eventData = req.body;
    
    // Validate required fields
    if (!eventData.eventName) {
      return res.status(400).json({ 
        error: 'Missing required field: eventName',
        success: false 
      });
    }

    // Generate unique event ID
    const eventId = uuidv4();

    // Check consent status from headers or request
    const consentStatus = req.headers['x-consent-status'] || eventData.consent || 'granted';
    const consentCheck = checkConsent(consentStatus, eventData.eventName);

    if (!consentCheck.allowed) {
      console.log(`[CONSENT DENIED] Event "${eventData.eventName}" blocked due to consent status: ${consentStatus}`);
      
      // Still log the attempt for transparency
      const blockedEvent = {
        eventId,
        eventName: eventData.eventName,
        status: 'blocked_by_consent',
        timestamp: new Date().toISOString(),
        reason: consentCheck.reason
      };
      
      eventStore.addEvent(blockedEvent);
      emitEvent('event:blocked', blockedEvent);
      
      return res.json({
        success: true,
        eventId,
        status: 'blocked_by_consent',
        message: consentCheck.reason
      });
    }

    // =========================================================================
    // DATA ENRICHMENT (The Power of SST!)
    // =========================================================================
    // This is where server-side tracking shines - we can add data that
    // the browser either doesn't have or shouldn't send directly
    
    const enrichedData = await enrichEventData(eventData, req, eventId);

    // =========================================================================
    // PII REDACTION
    // =========================================================================
    // Automatically redact sensitive information before forwarding
    
    const cleanedData = redactPII(enrichedData);

    // =========================================================================
    // STORE EVENT LOCALLY
    // =========================================================================
    
    const storedEvent = {
      ...cleanedData,
      processingTime: Date.now() - startTime,
      status: 'processed'
    };
    
    eventStore.addEvent(storedEvent);

    // =========================================================================
    // FORWARD TO ANALYTICS SERVICES (The SST Part!)
    // =========================================================================
    // Now we forward the enriched data to various analytics platforms
    // This happens server-to-server, completely invisible to ad-blockers
    
    const forwardingResults = await forwardToAnalytics(cleanedData, consentStatus);

    // =========================================================================
    // REAL-TIME DASHBOARD UPDATE
    // =========================================================================
    // Emit event to all connected dashboard clients
    
    emitEvent('event:tracked', {
      ...storedEvent,
      forwardingResults
    });

    // Return success response
    res.json({
      success: true,
      eventId,
      timestamp: cleanedData.serverTimestamp,
      processingTime: `${Date.now() - startTime}ms`,
      enrichedFields: Object.keys(cleanedData.enrichment || {}),
      forwardedTo: forwardingResults.map(r => r.service),
      message: 'Event tracked and forwarded successfully'
    });

  } catch (error) {
    console.error('[TRACKING ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process tracking event',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /track-event/batch
 * Batch tracking endpoint for multiple events
 * More efficient for high-volume tracking
 */
router.post('/batch', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { events } = req.body;
    
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        error: 'Invalid batch: events must be a non-empty array',
        success: false
      });
    }

    // Limit batch size
    if (events.length > 100) {
      return res.status(400).json({
        error: 'Batch too large: maximum 100 events per batch',
        success: false
      });
    }

    const consentStatus = req.headers['x-consent-status'] || 'granted';
    const results = [];

    for (const eventData of events) {
      const eventId = uuidv4();
      
      const consentCheck = checkConsent(consentStatus, eventData.eventName);
      
      if (!consentCheck.allowed) {
        results.push({
          eventId,
          eventName: eventData.eventName,
          status: 'blocked_by_consent'
        });
        continue;
      }

      const enrichedData = await enrichEventData(eventData, req, eventId);
      const cleanedData = redactPII(enrichedData);
      
      eventStore.addEvent({ ...cleanedData, status: 'processed' });
      
      results.push({
        eventId,
        eventName: eventData.eventName,
        status: 'processed'
      });
    }

    // Batch forward to analytics
    const processedEvents = results.filter(r => r.status === 'processed');
    if (processedEvents.length > 0) {
      await forwardToAnalytics({ batch: true, events: processedEvents }, consentStatus);
    }

    // Emit batch event to dashboard
    emitEvent('event:batch', {
      count: events.length,
      processed: processedEvents.length,
      blocked: results.length - processedEvents.length
    });

    res.json({
      success: true,
      totalEvents: events.length,
      processed: processedEvents.length,
      blocked: results.length - processedEvents.length,
      processingTime: `${Date.now() - startTime}ms`,
      results
    });

  } catch (error) {
    console.error('[BATCH TRACKING ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process batch tracking'
    });
  }
});

/**
 * POST /track-event/page-view
 * Specialized endpoint for page view tracking
 */
router.post('/page-view', async (req, res) => {
  const eventData = {
    ...req.body,
    eventName: 'page_view',
    eventCategory: 'navigation'
  };

  // Reuse main tracking logic
  req.body = eventData;
  
  const startTime = Date.now();
  const eventId = uuidv4();
  const consentStatus = req.headers['x-consent-status'] || 'granted';

  try {
    const enrichedData = await enrichEventData(eventData, req, eventId);
    const cleanedData = redactPII(enrichedData);
    
    eventStore.addEvent({ ...cleanedData, status: 'processed' });
    await forwardToAnalytics(cleanedData, consentStatus);
    
    emitEvent('event:pageview', cleanedData);

    res.json({
      success: true,
      eventId,
      processingTime: `${Date.now() - startTime}ms`
    });
  } catch (error) {
    console.error('[PAGE VIEW ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to track page view' });
  }
});

/**
 * POST /track-event/ecommerce
 * Specialized endpoint for e-commerce events (purchase, add_to_cart, etc.)
 */
router.post('/ecommerce', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { action, ...eventData } = req.body;
    
    // Validate e-commerce action
    const validActions = ['view_item', 'add_to_cart', 'remove_from_cart', 'begin_checkout', 'purchase', 'refund'];
    
    if (!validActions.includes(action)) {
      return res.status(400).json({
        error: `Invalid e-commerce action. Valid actions: ${validActions.join(', ')}`,
        success: false
      });
    }

    const eventId = uuidv4();
    const consentStatus = req.headers['x-consent-status'] || 'granted';

    const ecommerceEvent = {
      ...eventData,
      eventName: action,
      eventCategory: 'ecommerce',
      ecommerce: {
        action,
        ...eventData.ecommerce
      }
    };

    const enrichedData = await enrichEventData(ecommerceEvent, req, eventId);
    const cleanedData = redactPII(enrichedData);
    
    // Calculate transaction value for reporting
    if (action === 'purchase' && eventData.value) {
      cleanedData.transactionValue = eventData.value;
      cleanedData.currency = eventData.currency || 'USD';
    }

    eventStore.addEvent({ ...cleanedData, status: 'processed' });
    
    const forwardingResults = await forwardToAnalytics(cleanedData, consentStatus);
    
    emitEvent('event:ecommerce', {
      ...cleanedData,
      forwardingResults
    });

    res.json({
      success: true,
      eventId,
      action,
      processingTime: `${Date.now() - startTime}ms`,
      forwardedTo: forwardingResults.map(r => r.service)
    });

  } catch (error) {
    console.error('[ECOMMERCE TRACKING ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track e-commerce event'
    });
  }
});

/**
 * POST /track-event/custom
 * Custom event tracking with flexible schema
 */
router.post('/custom', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const eventId = uuidv4();
    const consentStatus = req.headers['x-consent-status'] || 'granted';
    
    const customEvent = {
      ...req.body,
      eventCategory: 'custom'
    };

    const enrichedData = await enrichEventData(customEvent, req, eventId);
    const cleanedData = redactPII(enrichedData);
    
    eventStore.addEvent({ ...cleanedData, status: 'processed' });
    await forwardToAnalytics(cleanedData, consentStatus);
    
    emitEvent('event:custom', cleanedData);

    res.json({
      success: true,
      eventId,
      processingTime: `${Date.now() - startTime}ms`
    });

  } catch (error) {
    console.error('[CUSTOM EVENT ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to track custom event' });
  }
});

export { router as trackingRouter };
