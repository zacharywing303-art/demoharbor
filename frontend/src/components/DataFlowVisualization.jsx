/**
 * ============================================================================
 * DATA FLOW VISUALIZATION
 * ============================================================================
 * 
 * Visual representation of how data flows from Frontend → Backend → GTM/Analytics
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Monitor,
  Server,
  Cloud,
  ArrowRight,
  Check,
  Shield,
  Lock,
  Eye,
  Database,
  Zap,
  Globe,
  Smartphone,
  RefreshCw,
  Play,
  Pause
} from 'lucide-react'
import { trackEvent } from '../services/trackingService'
import { useTrackingStore } from '../store/trackingStore'
import toast from 'react-hot-toast'

export default function DataFlowVisualization() {
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [flowData, setFlowData] = useState(null)
  const [autoPlay, setAutoPlay] = useState(false)
  const { events } = useTrackingStore()

  // Steps in the data flow
  const steps = [
    {
      id: 1,
      title: 'User Action',
      description: 'User clicks "Buy Now" button',
      icon: Monitor,
      color: 'primary',
      data: {
        eventName: 'purchase',
        product: 'MacBook Pro',
        price: 3499
      }
    },
    {
      id: 2,
      title: 'Browser Request',
      description: 'Data sent to YOUR server (localhost:5000)',
      icon: ArrowRight,
      color: 'blue',
      highlight: 'Ad-blockers see this as a normal API call!'
    },
    {
      id: 3,
      title: 'Server Processing',
      description: 'Express server receives and enriches data',
      icon: Server,
      color: 'accent',
      enrichments: [
        'IP Address (anonymized)',
        'User-Agent parsing',
        'Geolocation',
        'Server timestamp',
        'Session ID',
        'API Key (secret!)'
      ]
    },
    {
      id: 4,
      title: 'Consent Check',
      description: 'Verify user consent before forwarding',
      icon: Shield,
      color: 'yellow'
    },
    {
      id: 5,
      title: 'Server Forwarding',
      description: 'Server sends to GTM/GA4/Facebook',
      icon: Cloud,
      color: 'green',
      destinations: ['GTM Server', 'GA4', 'Facebook CAPI']
    },
    {
      id: 6,
      title: 'Complete',
      description: 'Event tracked with full enrichment!',
      icon: Check,
      color: 'green'
    }
  ]

  // Animate through steps
  useEffect(() => {
    if (isAnimating && currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1)
      }, 1500)
      return () => clearTimeout(timer)
    } else if (isAnimating && currentStep >= steps.length) {
      setIsAnimating(false)
    }
  }, [isAnimating, currentStep])

  // Auto-play when new events come in
  useEffect(() => {
    if (autoPlay && events.length > 0) {
      const latestEvent = events[0]
      setFlowData(latestEvent)
      startAnimation()
    }
  }, [events, autoPlay])

  const startAnimation = () => {
    setCurrentStep(0)
    setIsAnimating(true)
  }

  const triggerTestEvent = async () => {
    try {
      const result = await trackEvent('demo_flow', {
        action: 'visualization_test',
        timestamp: new Date().toISOString()
      })
      setFlowData(result)
      startAnimation()
      toast.success('Test event triggered!')
    } catch (error) {
      toast.error('Failed to trigger event')
    }
  }

  const getColorClasses = (color) => {
    const colors = {
      primary: 'bg-primary-500/20 border-primary-500/30 text-primary-400',
      accent: 'bg-accent-500/20 border-accent-500/30 text-accent-400',
      green: 'bg-green-500/20 border-green-500/30 text-green-400',
      yellow: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
      blue: 'bg-blue-500/20 border-blue-500/30 text-blue-400'
    }
    return colors[color] || colors.primary
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold mb-4"
        >
          <span className="gradient-text">Server-Side Tracking Flow</span>
        </motion.h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Watch how data flows from your browser to analytics platforms through your server.
          This bypasses ad-blockers and keeps your API keys secure!
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        <button
          onClick={triggerTestEvent}
          disabled={isAnimating}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap className="w-5 h-5" />
          Trigger Test Event
        </button>
        
        <button
          onClick={() => setAutoPlay(!autoPlay)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl border transition-all ${
            autoPlay 
              ? 'bg-green-500/20 border-green-500/30 text-green-400' 
              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          {autoPlay ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {autoPlay ? 'Auto-Play On' : 'Auto-Play Off'}
        </button>
        
        <button
          onClick={startAnimation}
          disabled={isAnimating}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${isAnimating ? 'animate-spin' : ''}`} />
          Replay Animation
        </button>
      </div>

      {/* Flow Visualization */}
      <div className="relative">
        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          <defs>
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#d946ef" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.5" />
            </linearGradient>
          </defs>
        </svg>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: currentStep >= index ? 1 : 0.95
              }}
              transition={{ delay: index * 0.1 }}
              className={`relative glass rounded-2xl p-6 transition-all ${
                currentStep === index ? 'ring-2 ring-primary-500 scale-105' : ''
              } ${currentStep > index ? 'opacity-100' : currentStep === index ? 'opacity-100' : 'opacity-50'}`}
            >
              {/* Step Number */}
              <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep >= index ? 'bg-primary-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}>
                {currentStep > index ? <Check className="w-4 h-4" /> : step.id}
              </div>

              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${getColorClasses(step.color)}`}>
                <step.icon className="w-6 h-6" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-gray-400 mb-3">{step.description}</p>

              {/* Step-specific content */}
              {currentStep >= index && (
                <AnimatePresence>
                  {step.highlight && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs"
                    >
                      💡 {step.highlight}
                    </motion.div>
                  )}
                  
                  {step.enrichments && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 space-y-1"
                    >
                      {step.enrichments.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                          <Check className="w-3 h-3 text-green-400" />
                          {item}
                        </div>
                      ))}
                    </motion.div>
                  )}
                  
                  {step.destinations && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 flex flex-wrap gap-2"
                    >
                      {step.destinations.map((dest, i) => (
                        <span key={i} className="px-2 py-1 rounded-full bg-white/10 text-xs text-gray-300">
                          {dest}
                        </span>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}

              {/* Animated data flow indicator */}
              {currentStep === index && isAnimating && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-b-2xl"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.5 }}
                  style={{ originX: 0 }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Architecture Diagram */}
      <div className="glass rounded-2xl p-8 mb-12">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">SST Architecture</h2>
        
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
          {/* Browser */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto rounded-2xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center mb-3">
              <Monitor className="w-12 h-12 text-primary-400" />
            </div>
            <h3 className="font-semibold text-white">Browser</h3>
            <p className="text-sm text-gray-400">User's device</p>
          </div>

          {/* Arrow */}
          <div className="flex items-center gap-2">
            <div className="w-16 lg:w-24 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 relative">
              <div className="absolute inset-0 data-flow" />
            </div>
            <ArrowRight className="w-6 h-6 text-accent-400" />
          </div>

          {/* Your Server */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto rounded-2xl bg-accent-500/20 border border-accent-500/30 flex items-center justify-center mb-3 relative">
              <Server className="w-12 h-12 text-accent-400" />
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <Lock className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="font-semibold text-white">Your Server</h3>
            <p className="text-sm text-gray-400">localhost:5000</p>
            <div className="mt-2 space-y-1">
              <span className="inline-block px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs">
                Data Enrichment
              </span>
              <span className="inline-block px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-xs">
                Consent Check
              </span>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center gap-2">
            <div className="w-16 lg:w-24 h-0.5 bg-gradient-to-r from-accent-500 to-green-500 relative">
              <div className="absolute inset-0 data-flow" />
            </div>
            <ArrowRight className="w-6 h-6 text-green-400" />
          </div>

          {/* Analytics Platforms */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-3">
              <Cloud className="w-12 h-12 text-green-400" />
            </div>
            <h3 className="font-semibold text-white">Analytics</h3>
            <p className="text-sm text-gray-400">GTM, GA4, FB</p>
          </div>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <BenefitCard
          icon={Shield}
          title="Ad-Blocker Bypass"
          description="Requests go to your domain, not directly to analytics. Ad-blockers can't distinguish from normal API calls."
          color="green"
        />
        <BenefitCard
          icon={Lock}
          title="Secure API Keys"
          description="API keys and tokens stay on the server. Never exposed to browser DevTools or network inspection."
          color="primary"
        />
        <BenefitCard
          icon={Database}
          title="Data Enrichment"
          description="Add server-side data like IP geolocation, accurate timestamps, and session info."
          color="accent"
        />
        <BenefitCard
          icon={Eye}
          title="Full Control"
          description="Validate, filter, and transform data before it leaves your server. Complete data ownership."
          color="yellow"
        />
      </div>

      {/* Code Preview */}
      <div className="mt-12 glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How It Works - Code Flow</h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Frontend Code */}
          <div>
            <h4 className="text-sm font-medium text-primary-400 mb-2">1. Frontend (Browser)</h4>
            <pre className="p-4 rounded-lg bg-gray-900 text-sm text-gray-300 overflow-x-auto">
{`// Sends to YOUR server
await axios.post(
  'http://localhost:5000/track-event',
  { eventName: 'purchase', ... }
);`}
            </pre>
          </div>

          {/* Backend Code */}
          <div>
            <h4 className="text-sm font-medium text-accent-400 mb-2">2. Backend (Server)</h4>
            <pre className="p-4 rounded-lg bg-gray-900 text-sm text-gray-300 overflow-x-auto">
{`// Enrich with server data
const enriched = {
  ...eventData,
  ip: req.ip,
  apiKey: process.env.SECRET,
  geo: geoip.lookup(req.ip)
};`}
            </pre>
          </div>

          {/* Forwarding Code */}
          <div>
            <h4 className="text-sm font-medium text-green-400 mb-2">3. Forward to Analytics</h4>
            <pre className="p-4 rounded-lg bg-gray-900 text-sm text-gray-300 overflow-x-auto">
{`// Server-to-server call
await axios.post(
  'https://gtm-server.com',
  enrichedData
);`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

function BenefitCard({ icon: Icon, title, description, color }) {
  const colorClasses = {
    primary: 'bg-primary-500/20 border-primary-500/30 text-primary-400',
    accent: 'bg-accent-500/20 border-accent-500/30 text-accent-400',
    green: 'bg-green-500/20 border-green-500/30 text-green-400',
    yellow: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="glass rounded-2xl p-6"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorClasses[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </motion.div>
  )
}
