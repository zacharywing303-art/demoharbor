/**
 * ============================================================================
 * DASHBOARD - Real-time Event Monitoring
 * ============================================================================
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import {
  Activity,
  Eye,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  Clock,
  Server,
  Shield,
  RefreshCw,
  Trash2,
  Download,
  Filter,
  ChevronDown,
  Globe,
  Smartphone,
  Monitor,
  Wifi,
  WifiOff,
  Check,
  X,
  AlertCircle
} from 'lucide-react'
import { getDashboardStats, getDashboardEvents, clearEvents, getTimeline } from '../services/trackingService'
import { useTrackingStore } from '../store/trackingStore'
import { initializeSocket } from '../services/socketService'
import toast from 'react-hot-toast'

const COLORS = ['#0ea5e9', '#d946ef', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [events, setEvents] = useState([])
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const { isConnected, events: realtimeEvents } = useTrackingStore()

  // Initialize socket and fetch data
  useEffect(() => {
    initializeSocket()
    fetchData()
    
    const interval = setInterval(fetchData, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  // Update events when realtime events change
  useEffect(() => {
    if (realtimeEvents.length > 0) {
      setEvents(prev => {
        const newEvents = realtimeEvents.filter(
          re => !prev.find(e => e.eventId === re.eventId)
        )
        return [...newEvents, ...prev].slice(0, 100)
      })
    }
  }, [realtimeEvents])

  const fetchData = async () => {
    try {
      const [statsData, eventsData, timelineData] = await Promise.all([
        getDashboardStats(),
        getDashboardEvents({ limit: 50 }),
        getTimeline('minute', 1)
      ])
      
      setStats(statsData.stats)
      setEvents(eventsData.events)
      setTimeline(timelineData.timeline)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearEvents = async () => {
    try {
      await clearEvents()
      setEvents([])
      setStats(null)
      useTrackingStore.getState().clearEvents()
      toast.success('All events cleared')
      fetchData()
    } catch (error) {
      toast.error('Failed to clear events')
    }
  }

  const handleExport = () => {
    const data = {
      exportDate: new Date().toISOString(),
      stats,
      events
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sst-export-${Date.now()}.json`
    a.click()
    toast.success('Data exported')
  }

  const filteredEvents = events.filter(e => {
    if (filter === 'all') return true
    if (filter === 'ecommerce') return ['purchase', 'add_to_cart', 'view_item', 'begin_checkout'].includes(e.eventName)
    if (filter === 'blocked') return e.status === 'blocked_by_consent'
    return e.eventName === filter
  })

  // Prepare chart data
  const eventTypeData = stats?.byEventType 
    ? Object.entries(stats.byEventType).map(([name, value]) => ({ name, value }))
    : []

  const deviceData = stats?.byDevice
    ? Object.entries(stats.byDevice).map(([name, value]) => ({ name, value }))
    : []

  const browserData = stats?.byBrowser
    ? Object.entries(stats.byBrowser).map(([name, value]) => ({ name, value }))
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Real-time Server-Side Tracking monitor</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            isConnected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleExport}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            <Download className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleClearEvents}
            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Events"
          value={stats?.total || 0}
          icon={Activity}
          color="primary"
        />
        <StatsCard
          title="Last Hour"
          value={stats?.lastHour || 0}
          icon={Clock}
          color="accent"
        />
        <StatsCard
          title="Forwarded"
          value={stats?.totalForwarded || 0}
          icon={Server}
          color="green"
        />
        <StatsCard
          title="Blocked"
          value={stats?.totalBlocked || 0}
          icon={Shield}
          color="yellow"
        />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Event Types Chart */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Events by Type</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={eventTypeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {eventTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: '#1f2937', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Distribution */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Device Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" width={80} />
                <Tooltip 
                  contentStyle={{ 
                    background: '#1f2937', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Browser Distribution */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Browser Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={browserData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" width={80} />
                <Tooltip 
                  contentStyle={{ 
                    background: '#1f2937', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="#d946ef" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Timeline Chart */}
      {timeline.length > 0 && (
        <div className="glass rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Event Timeline (Last Hour)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#9ca3af"
                  tickFormatter={(value) => value.split('T')[1]?.slice(0, 5) || value}
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    background: '#1f2937', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  dot={{ fill: '#0ea5e9' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Events Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-white">Recent Events</h3>
          
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            >
              <Filter className="w-4 h-4" />
              {filter === 'all' ? 'All Events' : filter}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 rounded-lg bg-gray-800 border border-white/10 shadow-xl z-10"
                >
                  {['all', 'page_view', 'view_item', 'add_to_cart', 'purchase', 'ecommerce', 'blocked'].map((f) => (
                    <button
                      key={f}
                      onClick={() => { setFilter(f); setShowFilters(false) }}
                      className={`w-full px-4 py-2 text-left hover:bg-white/5 ${
                        filter === f ? 'text-primary-400' : 'text-gray-300'
                      }`}
                    >
                      {f === 'all' ? 'All Events' : f}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-white/5 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Device</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {filteredEvents.map((event, index) => (
                  <motion.tr
                    key={event.eventId || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="hover:bg-white/5"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getEventColor(event.eventName)}`}>
                          {getEventIcon(event.eventName)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{event.eventName}</div>
                          {event.productName && (
                            <div className="text-xs text-gray-400">{event.productName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        event.status === 'blocked_by_consent' 
                          ? 'bg-yellow-500/10 text-yellow-400'
                          : 'bg-green-500/10 text-green-400'
                      }`}>
                        {event.status === 'blocked_by_consent' ? (
                          <><AlertCircle className="w-3 h-3" /> Blocked</>
                        ) : (
                          <><Check className="w-3 h-3" /> Processed</>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        {getDeviceIcon(event.enrichment?.device?.type)}
                        <span>{event.enrichment?.device?.type || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Globe className="w-4 h-4" />
                        <span>{event.enrichment?.geo?.country || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatTime(event.serverTimestamp)}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {filteredEvents.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No events yet. Start interacting with the store!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Stats Card Component
function StatsCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    primary: 'from-primary-500/20 to-primary-500/5 text-primary-400',
    accent: 'from-accent-500/20 to-accent-500/5 text-accent-400',
    green: 'from-green-500/20 to-green-500/5 text-green-400',
    yellow: 'from-yellow-500/20 to-yellow-500/5 text-yellow-400'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-xl p-6 bg-gradient-to-br ${colorClasses[color]}`}
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-8 h-8" />
        <TrendingUp className="w-4 h-4 opacity-50" />
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value.toLocaleString()}</div>
      <div className="text-sm opacity-70">{title}</div>
    </motion.div>
  )
}

// Helper functions
function getEventIcon(eventName) {
  switch (eventName) {
    case 'page_view': return <Eye className="w-4 h-4" />
    case 'view_item': return <Eye className="w-4 h-4" />
    case 'add_to_cart': return <ShoppingCart className="w-4 h-4" />
    case 'purchase': return <CreditCard className="w-4 h-4" />
    case 'begin_checkout': return <CreditCard className="w-4 h-4" />
    default: return <Activity className="w-4 h-4" />
  }
}

function getEventColor(eventName) {
  switch (eventName) {
    case 'page_view': return 'bg-blue-500/10 text-blue-400'
    case 'view_item': return 'bg-purple-500/10 text-purple-400'
    case 'add_to_cart': return 'bg-orange-500/10 text-orange-400'
    case 'purchase': return 'bg-green-500/10 text-green-400'
    case 'begin_checkout': return 'bg-yellow-500/10 text-yellow-400'
    default: return 'bg-gray-500/10 text-gray-400'
  }
}

function getDeviceIcon(deviceType) {
  switch (deviceType) {
    case 'mobile': return <Smartphone className="w-4 h-4" />
    case 'tablet': return <Smartphone className="w-4 h-4" />
    default: return <Monitor className="w-4 h-4" />
  }
}

function formatTime(timestamp) {
  if (!timestamp) return 'N/A'
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}
