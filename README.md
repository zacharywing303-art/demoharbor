# Server-Side Tracking (SST) Demo

A comprehensive demonstration of Server-Side Tracking implementation using React, Node.js, and Express. This project showcases how to bypass ad-blockers, keep API keys secure, and have full control over your analytics data flow.

![SST Demo](https://via.placeholder.com/800x400?text=Server-Side+Tracking+Demo)

## 🚀 Features

### Backend (Node.js/Express)
- **Data Enrichment**: Automatically adds IP address, User-Agent parsing, geolocation, and server timestamps
- **Consent Management**: GDPR/CCPA compliant consent handling
- **PII Redaction**: Automatic detection and redaction of sensitive information
- **Multi-Platform Forwarding**: Forward events to GTM, GA4, and Facebook CAPI
- **Real-time WebSocket**: Live event streaming to dashboard
- **Rate Limiting**: Protection against abuse
- **IP Anonymization**: Configurable IP masking for privacy

### Frontend (React/Vite)
- **E-commerce Demo**: Interactive product store with tracking
- **Real-time Dashboard**: Live analytics visualization with charts
- **Data Flow Visualization**: Step-by-step visualization of SST flow
- **Consent Banner**: Customizable privacy consent UI
- **Modern UI**: Beautiful glassmorphism design with Tailwind CSS

## 📦 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Recharts, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO, Axios, UAParser, GeoIP-Lite
- **State Management**: Zustand

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd server-side-tracking
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables**
   ```bash
   cd ../backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Running the Application

1. **Start the backend server** (Terminal 1)
   ```bash
   cd backend
   npm run dev
   ```
   The server will start on `http://localhost:5000`

2. **Start the frontend** (Terminal 2)
   ```bash
   cd frontend
   npm run dev
   ```
   The app will open on `http://localhost:5173`

## 📁 Project Structure

```
server-side-tracking/
├── backend/
│   ├── routes/
│   │   ├── tracking.js      # Main tracking endpoints
│   │   ├── consent.js       # Consent management
│   │   └── dashboard.js     # Dashboard API
│   ├── services/
│   │   ├── dataEnrichment.js    # Server-side data enrichment
│   │   ├── analyticsForwarder.js # Forward to GTM/GA4/FB
│   │   ├── consentService.js    # Consent checking
│   │   ├── piiRedaction.js      # PII detection & redaction
│   │   ├── socketService.js     # WebSocket management
│   │   └── eventStore.js        # In-memory event storage
│   ├── server.js            # Express server setup
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LandingPage.jsx       # E-commerce demo
│   │   │   ├── Dashboard.jsx          # Analytics dashboard
│   │   │   ├── DataFlowVisualization.jsx  # SST flow viz
│   │   │   └── ConsentBanner.jsx      # Privacy consent UI
│   │   ├── services/
│   │   │   ├── trackingService.js     # API client
│   │   │   └── socketService.js       # WebSocket client
│   │   ├── store/
│   │   │   └── trackingStore.js       # Zustand state
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## 🔄 How SST Works

### Traditional Client-Side Tracking
```
Browser → Google Analytics/Facebook (blocked by ad-blockers!)
```

### Server-Side Tracking
```
Browser → Your Server → Google Analytics/Facebook (bypasses ad-blockers!)
```

### Key Benefits

1. **Ad-Blocker Bypass**: Requests go to your domain first, appearing as normal API calls
2. **Secure API Keys**: Tokens never leave your server
3. **Data Enrichment**: Add server-side information (IP, geo, etc.)
4. **Full Control**: Filter, validate, and transform data before forwarding
5. **Better Privacy**: Implement consent management at the server level

## 📊 API Endpoints

### Tracking
- `POST /track-event` - Track a single event
- `POST /track-event/batch` - Track multiple events
- `POST /track-event/page-view` - Track page views
- `POST /track-event/ecommerce` - Track e-commerce events
- `POST /track-event/custom` - Track custom events

### Consent
- `POST /consent/update` - Update consent preferences
- `GET /consent/status` - Get current consent status
- `POST /consent/revoke` - Revoke all consent
- `GET /consent/export` - Export consent data (GDPR)
- `DELETE /consent/delete` - Delete consent data (GDPR)

### Dashboard
- `GET /dashboard/events` - Get tracked events
- `GET /dashboard/stats` - Get analytics statistics
- `GET /dashboard/timeline` - Get event timeline
- `GET /dashboard/event/:id` - Get single event

## 🔐 Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# SST Configuration
API_KEY=your_secret_api_key

# GTM Server-Side Container
GTM_SERVER_URL=https://your-gtm-server.com

# Google Analytics 4
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=your_ga4_secret

# Facebook Conversions API
FB_PIXEL_ID=your_pixel_id
FB_ACCESS_TOKEN=your_fb_token

# Privacy Settings
ANONYMIZE_IP=true
IP_ANONYMIZATION_MASK=2
```

## 🛡️ Privacy & Compliance

This demo includes features for GDPR/CCPA compliance:

- **Consent Management**: Category-based consent (necessary, functional, analytics, marketing)
- **IP Anonymization**: Configurable IP masking
- **PII Redaction**: Automatic detection and redaction of emails, phones, etc.
- **Data Export**: GDPR Article 20 data portability
- **Data Deletion**: GDPR Article 17 right to erasure

## 🎨 Screenshots

### Landing Page (E-commerce Demo)
- Product cards with tracking on view, add to cart, purchase
- Real-time consent status indicator

### Dashboard
- Live event stream
- Charts for event types, devices, browsers
- Event timeline visualization

### Data Flow Visualization
- Step-by-step animation of SST flow
- Architecture diagram
- Code examples

## 🔧 Customization

### Adding New Analytics Destinations

Edit `backend/services/analyticsForwarder.js`:

```javascript
async function forwardToYourService(eventData) {
  // Add your custom forwarding logic
}
```

### Modifying Data Enrichment

Edit `backend/services/dataEnrichment.js`:

```javascript
// Add custom enrichment fields
enrichment: {
  // ... existing fields
  customField: 'your value'
}
```

## 📝 License

MIT License - feel free to use this demo for learning and production!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📚 Resources

- [Google Tag Manager Server-Side](https://developers.google.com/tag-platform/tag-manager/server-side)
- [GA4 Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [Facebook Conversions API](https://developers.facebook.com/docs/marketing-api/conversions-api)

---

Built with ❤️ for the analytics community
