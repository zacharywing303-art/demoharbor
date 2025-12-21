/**
 * ============================================================================
 * CONSENT ROUTES - GDPR/CCPA Compliance
 * ============================================================================
 * 
 * Server-side consent management for privacy compliance.
 * 
 * CONSENT CATEGORIES:
 * - analytics: Google Analytics, etc.
 * - marketing: Facebook Pixel, Google Ads, etc.
 * - functional: Session tracking, preferences
 * - necessary: Always allowed (security, fraud prevention)
 */

import express from 'express';
import { emitEvent } from '../services/socketService.js';

const router = express.Router();

// In-memory consent storage (use Redis/DB in production)
const consentStore = new Map();

/**
 * POST /consent/update
 * Update user consent preferences
 */
router.post('/update', async (req, res) => {
  try {
    const {
      clientId,
      consent = {}
    } = req.body;

    if (!clientId) {
      return res.status(400).json({
        error: 'clientId is required',
        success: false
      });
    }

    // Validate consent categories
    const validCategories = ['analytics', 'marketing', 'functional', 'necessary'];
    const consentData = {
      clientId,
      timestamp: new Date().toISOString(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      categories: {
        necessary: true, // Always granted
        analytics: consent.analytics ?? false,
        marketing: consent.marketing ?? false,
        functional: consent.functional ?? true
      },
      rawConsent: consent
    };

    // Store consent
    consentStore.set(clientId, consentData);

    // Log consent update
    console.log(`[CONSENT UPDATE] Client ${clientId}:`, consentData.categories);

    // Emit consent update to dashboard
    emitEvent('consent:updated', consentData);

    res.json({
      success: true,
      clientId,
      consent: consentData.categories,
      message: 'Consent preferences updated successfully'
    });

  } catch (error) {
    console.error('[CONSENT UPDATE ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update consent'
    });
  }
});

/**
 * GET /consent/status
 * Get current consent status for a client
 */
router.get('/status', (req, res) => {
  const clientId = req.query.clientId || req.headers['x-client-id'];

  if (!clientId) {
    return res.json({
      success: true,
      hasConsent: false,
      consent: {
        necessary: true,
        analytics: false,
        marketing: false,
        functional: false
      },
      message: 'No consent recorded'
    });
  }

  const consentData = consentStore.get(clientId);

  if (!consentData) {
    return res.json({
      success: true,
      hasConsent: false,
      consent: {
        necessary: true,
        analytics: false,
        marketing: false,
        functional: false
      },
      message: 'No consent recorded for this client'
    });
  }

  res.json({
    success: true,
    hasConsent: true,
    consent: consentData.categories,
    updatedAt: consentData.timestamp
  });
});

/**
 * POST /consent/revoke
 * Revoke all consent (opt-out)
 */
router.post('/revoke', async (req, res) => {
  try {
    const { clientId } = req.body;

    if (!clientId) {
      return res.status(400).json({
        error: 'clientId is required',
        success: false
      });
    }

    // Set minimal consent
    const revokedConsent = {
      clientId,
      timestamp: new Date().toISOString(),
      ipAddress: req.ip,
      categories: {
        necessary: true,
        analytics: false,
        marketing: false,
        functional: false
      },
      revoked: true
    };

    consentStore.set(clientId, revokedConsent);

    console.log(`[CONSENT REVOKED] Client ${clientId}`);
    emitEvent('consent:revoked', { clientId, timestamp: revokedConsent.timestamp });

    res.json({
      success: true,
      clientId,
      message: 'All non-essential consent has been revoked'
    });

  } catch (error) {
    console.error('[CONSENT REVOKE ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke consent'
    });
  }
});

/**
 * GET /consent/export
 * Export consent data for GDPR data portability
 */
router.get('/export', (req, res) => {
  const clientId = req.query.clientId;

  if (!clientId) {
    return res.status(400).json({
      error: 'clientId is required',
      success: false
    });
  }

  const consentData = consentStore.get(clientId);

  if (!consentData) {
    return res.status(404).json({
      error: 'No consent data found for this client',
      success: false
    });
  }

  // Format for export
  const exportData = {
    exportDate: new Date().toISOString(),
    clientId,
    consentHistory: [consentData],
    categories: consentData.categories,
    lastUpdated: consentData.timestamp
  };

  res.setHeader('Content-Disposition', `attachment; filename=consent-export-${clientId}.json`);
  res.setHeader('Content-Type', 'application/json');
  res.json(exportData);
});

/**
 * DELETE /consent/delete
 * Delete all consent data (Right to be forgotten - GDPR Article 17)
 */
router.delete('/delete', async (req, res) => {
  try {
    const clientId = req.query.clientId || req.body.clientId;

    if (!clientId) {
      return res.status(400).json({
        error: 'clientId is required',
        success: false
      });
    }

    consentStore.delete(clientId);

    console.log(`[CONSENT DELETED] Client ${clientId} data removed`);
    emitEvent('consent:deleted', { clientId });

    res.json({
      success: true,
      message: 'All consent data has been deleted'
    });

  } catch (error) {
    console.error('[CONSENT DELETE ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete consent data'
    });
  }
});

// Export consent store for use in other services
export { router as consentRouter, consentStore };
