/**
 * ============================================================================
 * SERVER-SIDE TRACKING (SST) - MAIN SERVER
 * ============================================================================
 * 
 * This is a full-featured Server-Side Tracking implementation that demonstrates:
 * 
 * 🔒 SECURITY BENEFITS:
 * - API keys are stored server-side (never exposed to browser)
 * - Data validation happens on the server
 * - Rate limiting prevents abuse
 * 
 * 🛡️ AD-BLOCKER BYPASS:
 * - Requests go to YOUR domain first (localhost:5000)
 * - Ad-blockers can't distinguish tracking from regular API calls
 * - First-party context for all tracking requests
 * 
 * 📊 DATA ENRICHMENT:
 * - IP address capture and anonymization
 * - User-Agent parsing for device info
 * - Geolocation data
 * - Server timestamp (more reliable than client)
 * - Session management
 * 
 * 🔐 PRIVACY COMPLIANCE (GDPR/CCPA):
 * - Consent management
 * - IP anonymization
 * - Data retention controls
 * - PII redaction
 * 
 * ============================================================================
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Import our custom modules
import { trackingRouter } from './routes/tracking.js';
import { consentRouter } from './routes/consent.js';
import { dashboardRouter } from './routes/dashboard.js';
import { initializeSocketIO } from './services/socketService.js';
import { EventStore } from './services/eventStore.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO for real-time dashboard updates
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize Socket.IO service
initializeSocketIO(io);

// Initialize Event Store (in-memory for demo, use Redis/DB in production)
export const eventStore = new EventStore();

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-ID', 'X-Session-ID', 'X-Consent-Status']
}));

// Request logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting - prevents abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ============================================================================
// ROUTES
// ============================================================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Main tracking routes
app.use('/track-event', trackingRouter);
app.use('/consent', consentRouter);
app.use('/dashboard', dashboardRouter);

// API documentation endpoint
app.get('/api-docs', (req, res) => {
  res.json({
    name: 'Server-Side Tracking API',
    version: '1.0.0',
    endpoints: {
      'POST /track-event': 'Track a single event',
      'POST /track-event/batch': 'Track multiple events in batch',
      'POST /track-event/page-view': 'Track page view',
      'POST /track-event/ecommerce': 'Track e-commerce events',
      'POST /consent/update': 'Update user consent preferences',
      'GET /consent/status': 'Get current consent status',
      'GET /dashboard/events': 'Get tracked events',
      'GET /dashboard/stats': 'Get analytics statistics',
      'GET /health': 'Health check'
    },
    features: [
      'Data enrichment (IP, User-Agent, Geo)',
      'IP anonymization',
      'Consent management',
      'Real-time WebSocket updates',
      'Event batching',
      'Rate limiting',
      'PII redaction'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   🚀 SERVER-SIDE TRACKING SERVER RUNNING                         ║
║                                                                   ║
║   Port: ${PORT}                                                      ║
║   Environment: ${process.env.NODE_ENV || 'development'}                                    ║
║                                                                   ║
║   Endpoints:                                                      ║
║   • POST /track-event         - Track events                      ║
║   • POST /track-event/batch   - Batch tracking                    ║
║   • POST /consent/update      - Update consent                    ║
║   • GET  /dashboard/events    - View events                       ║
║   • GET  /dashboard/stats     - Analytics stats                   ║
║                                                                   ║
║   WebSocket: Real-time dashboard updates enabled                  ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
  `);
});

export { io };
