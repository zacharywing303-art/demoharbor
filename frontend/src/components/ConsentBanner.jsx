/**
 * ============================================================================
 * CONSENT BANNER COMPONENT
 * ============================================================================
 * 
 * GDPR/CCPA compliant consent management UI
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Cookie, 
  BarChart2, 
  Target, 
  Settings, 
  Check, 
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { updateConsent } from '../services/trackingService'
import { useTrackingStore } from '../store/trackingStore'
import toast from 'react-hot-toast'

export default function ConsentBanner({ onClose }) {
  const [showDetails, setShowDetails] = useState(false)
  const [consent, setConsent] = useState({
    analytics: false,
    marketing: false,
    functional: true,
    necessary: true
  })
  const { setConsent: storeSetConsent } = useTrackingStore()

  const handleAcceptAll = async () => {
    const fullConsent = {
      analytics: true,
      marketing: true,
      functional: true,
      necessary: true
    }
    
    try {
      await updateConsent(fullConsent)
      storeSetConsent(fullConsent)
      toast.success('Preferences saved - Full tracking enabled')
      onClose()
    } catch (error) {
      toast.error('Failed to save preferences')
    }
  }

  const handleRejectAll = async () => {
    const minimalConsent = {
      analytics: false,
      marketing: false,
      functional: false,
      necessary: true
    }
    
    try {
      await updateConsent(minimalConsent)
      storeSetConsent(minimalConsent)
      toast.success('Preferences saved - Minimal tracking')
      onClose()
    } catch (error) {
      toast.error('Failed to save preferences')
    }
  }

  const handleSavePreferences = async () => {
    try {
      await updateConsent(consent)
      storeSetConsent(consent)
      toast.success('Preferences saved')
      onClose()
    } catch (error) {
      toast.error('Failed to save preferences')
    }
  }

  const consentCategories = [
    {
      id: 'necessary',
      name: 'Necessary',
      description: 'Essential for website functionality. Cannot be disabled.',
      icon: Shield,
      required: true,
      examples: ['Security', 'Error tracking', 'Session management']
    },
    {
      id: 'functional',
      name: 'Functional',
      description: 'Remember your preferences and settings.',
      icon: Settings,
      required: false,
      examples: ['Language preferences', 'Theme settings', 'Cart contents']
    },
    {
      id: 'analytics',
      name: 'Analytics',
      description: 'Help us understand how visitors use our website.',
      icon: BarChart2,
      required: false,
      examples: ['Google Analytics', 'Page views', 'Session duration']
    },
    {
      id: 'marketing',
      name: 'Marketing',
      description: 'Used for targeted advertising and remarketing.',
      icon: Target,
      required: false,
      examples: ['Facebook Pixel', 'Google Ads', 'Conversion tracking']
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed bottom-0 left-0 right-0 z-50 p-4"
    >
      <div className="max-w-4xl mx-auto glass rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary-500/20 text-primary-400">
              <Cookie className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">Cookie & Privacy Settings</h2>
              <p className="text-gray-400">
                We use cookies and tracking to improve your experience. 
                This demo uses Server-Side Tracking for better privacy control.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleAcceptAll}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold hover:opacity-90 transition-all"
          >
            <Check className="w-5 h-5" />
            Accept All
          </button>
          <button
            onClick={handleRejectAll}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all"
          >
            <X className="w-5 h-5" />
            Reject All
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:border-white/20 transition-all"
          >
            <Settings className="w-5 h-5" />
            Customize
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Detailed Settings */}
        <motion.div
          initial={false}
          animate={{ height: showDetails ? 'auto' : 0, opacity: showDetails ? 1 : 0 }}
          className="overflow-hidden"
        >
          <div className="p-6 space-y-4">
            {consentCategories.map((category) => (
              <div
                key={category.id}
                className={`p-4 rounded-xl border transition-all ${
                  consent[category.id] 
                    ? 'bg-primary-500/10 border-primary-500/30' 
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      consent[category.id] ? 'bg-primary-500/20 text-primary-400' : 'bg-white/10 text-gray-400'
                    }`}>
                      <category.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{category.name}</h3>
                      <p className="text-sm text-gray-400">{category.description}</p>
                    </div>
                  </div>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent[category.id]}
                      onChange={(e) => {
                        if (!category.required) {
                          setConsent(prev => ({ ...prev, [category.id]: e.target.checked }))
                        }
                      }}
                      disabled={category.required}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 rounded-full peer transition-all ${
                      consent[category.id] 
                        ? 'bg-primary-500' 
                        : 'bg-gray-600'
                    } ${category.required ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        consent[category.id] ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </div>
                  </label>
                </div>
                
                {/* Examples */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {category.examples.map((example, i) => (
                    <span 
                      key={i}
                      className="px-2 py-1 rounded-full bg-white/5 text-xs text-gray-400"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Save Button */}
            <button
              onClick={handleSavePreferences}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-all"
            >
              <Check className="w-5 h-5" />
              Save Preferences
            </button>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white/5 border-t border-white/10">
          <p className="text-xs text-gray-500 text-center">
            Your preferences are stored locally and sent to our server using Server-Side Tracking.
            You can change these settings at any time.
            <a href="#" className="text-primary-400 hover:underline ml-1">Privacy Policy</a>
          </p>
        </div>
      </div>
    </motion.div>
  )
}
