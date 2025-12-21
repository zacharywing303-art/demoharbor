/**
 * ============================================================================
 * LANDING PAGE - E-commerce Store Demo
 * ============================================================================
 * 
 * This simulates an e-commerce landing page where we track user interactions
 * using Server-Side Tracking.
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ShoppingCart, 
  Star, 
  Shield, 
  Truck, 
  CreditCard,
  Eye,
  Heart,
  Share2,
  Check,
  Loader2,
  Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'
import { trackEvent, trackEcommerce, trackPageView } from '../services/trackingService'
import { initializeSocket } from '../services/socketService'
import { useTrackingStore } from '../store/trackingStore'

const products = [
  {
    id: 'laptop-001',
    name: 'MacBook Pro 16"',
    description: 'Apple M3 Max chip, 36GB RAM, 1TB SSD',
    price: 3499,
    originalPrice: 3999,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
    rating: 4.9,
    reviews: 2847,
    category: 'Electronics'
  },
  {
    id: 'headphones-001',
    name: 'Sony WH-1000XM5',
    description: 'Premium noise-canceling wireless headphones',
    price: 349,
    originalPrice: 399,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    rating: 4.8,
    reviews: 5621,
    category: 'Electronics'
  },
  {
    id: 'watch-001',
    name: 'Apple Watch Ultra 2',
    description: '49mm Titanium Case with GPS + Cellular',
    price: 799,
    originalPrice: 849,
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500',
    rating: 4.7,
    reviews: 3892,
    category: 'Wearables'
  }
]

export default function LandingPage() {
  const [selectedProduct, setSelectedProduct] = useState(products[0])
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [wishlist, setWishlist] = useState([])
  const { isTracking, consent } = useTrackingStore()

  // Initialize socket and track page view on mount
  useEffect(() => {
    initializeSocket()
    
    // Track page view
    trackPageView({
      pageName: 'Landing Page',
      pageCategory: 'E-commerce'
    }).catch(console.error)
  }, [])

  // Handle product view
  const handleViewProduct = async (product) => {
    setSelectedProduct(product)
    
    try {
      await trackEcommerce('view_item', {
        productId: product.id,
        productName: product.name,
        price: product.price,
        currency: 'USD',
        category: product.category,
        ecommerce: {
          items: [{
            item_id: product.id,
            item_name: product.name,
            price: product.price
          }]
        }
      })
      toast.success(`Viewed: ${product.name}`, { icon: '👀' })
    } catch (error) {
      toast.error('Tracking failed')
    }
  }

  // Handle add to cart
  const handleAddToCart = async () => {
    setIsAddingToCart(true)
    
    try {
      await trackEcommerce('add_to_cart', {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        price: selectedProduct.price,
        currency: 'USD',
        quantity: 1,
        ecommerce: {
          items: [{
            item_id: selectedProduct.id,
            item_name: selectedProduct.name,
            price: selectedProduct.price,
            quantity: 1
          }]
        }
      })
      
      setCartCount(prev => prev + 1)
      toast.success(`Added to cart: ${selectedProduct.name}`, { icon: '🛒' })
    } catch (error) {
      toast.error('Tracking failed')
    } finally {
      setIsAddingToCart(false)
    }
  }

  // Handle purchase
  const handlePurchase = async () => {
    setIsPurchasing(true)
    
    try {
      // Track begin checkout
      await trackEcommerce('begin_checkout', {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        value: selectedProduct.price,
        currency: 'USD'
      })

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Track purchase
      await trackEcommerce('purchase', {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        value: selectedProduct.price,
        currency: 'USD',
        transactionId: `TXN-${Date.now()}`,
        ecommerce: {
          transaction_id: `TXN-${Date.now()}`,
          value: selectedProduct.price,
          currency: 'USD',
          items: [{
            item_id: selectedProduct.id,
            item_name: selectedProduct.name,
            price: selectedProduct.price,
            quantity: 1
          }]
        }
      })
      
      setCartCount(0)
      toast.success(`Purchase complete! $${selectedProduct.price}`, { 
        icon: '✅',
        duration: 5000
      })
    } catch (error) {
      toast.error('Tracking failed')
    } finally {
      setIsPurchasing(false)
    }
  }

  // Handle wishlist
  const handleWishlist = async (product) => {
    const isInWishlist = wishlist.includes(product.id)
    
    try {
      await trackEvent(isInWishlist ? 'remove_from_wishlist' : 'add_to_wishlist', {
        productId: product.id,
        productName: product.name,
        price: product.price
      })
      
      if (isInWishlist) {
        setWishlist(prev => prev.filter(id => id !== product.id))
        toast.success('Removed from wishlist', { icon: '💔' })
      } else {
        setWishlist(prev => [...prev, product.id])
        toast.success('Added to wishlist', { icon: '❤️' })
      }
    } catch (error) {
      toast.error('Tracking failed')
    }
  }

  // Handle share
  const handleShare = async (product) => {
    try {
      await trackEvent('share', {
        productId: product.id,
        productName: product.name,
        method: 'button_click'
      })
      
      // Copy link to clipboard
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!', { icon: '🔗' })
    } catch (error) {
      toast.error('Tracking failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-accent-500/10" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-primary-300">Server-Side Tracking Demo</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold mb-6"
            >
              <span className="gradient-text">Premium Tech Store</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-400 max-w-2xl mx-auto"
            >
              Every click, view, and purchase is tracked using Server-Side Tracking.
              Watch the dashboard to see the data flow in real-time!
            </motion.p>
          </div>

          {/* Trust Badges */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-6 mb-12"
          >
            {[
              { icon: Shield, text: 'Secure Payment' },
              { icon: Truck, text: 'Free Shipping' },
              { icon: CreditCard, text: 'Easy Returns' }
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-400">
                <badge.icon className="w-5 h-5 text-primary-400" />
                <span>{badge.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              onClick={() => handleViewProduct(product)}
              className={`group glass rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${
                selectedProduct.id === product.id ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <div className="aspect-square bg-gray-800 relative overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleWishlist(product) }}
                    className={`p-2 rounded-full backdrop-blur-sm transition-all ${
                      wishlist.includes(product.id) 
                        ? 'bg-red-500 text-white' 
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${wishlist.includes(product.id) ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleShare(product) }}
                    className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-all"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
                {selectedProduct.id === product.id && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500 text-white text-sm">
                    <Eye className="w-4 h-4" />
                    Selected
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">{product.rating}</span>
                  </div>
                  <span className="text-sm text-gray-500">({product.reviews.toLocaleString()} reviews)</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{product.name}</h3>
                <p className="text-sm text-gray-400 mb-3">{product.description}</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-white">${product.price}</span>
                  <span className="text-lg text-gray-500 line-through">${product.originalPrice}</span>
                  <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                    Save ${product.originalPrice - product.price}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Selected Product Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-8 max-w-2xl mx-auto"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {selectedProduct.name}
            </h2>
            <p className="text-gray-400">{selectedProduct.description}</p>
            <div className="text-3xl font-bold text-primary-400 mt-4">
              ${selectedProduct.price}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || isTracking}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAddingToCart ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ShoppingCart className="w-5 h-5" />
              )}
              Add to Cart
              {cartCount > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-primary-500 text-xs">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={handlePurchase}
              disabled={isPurchasing || isTracking}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed pulse-glow"
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Buy Now - ${selectedProduct.price}
                </>
              )}
            </button>
          </div>

          {/* Consent Status Indicator */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${consent.analytics ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <span className="text-gray-400">
                  Analytics: {consent.analytics ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${consent.marketing ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <span className="text-gray-400">
                  Marketing: {consent.marketing ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* SST Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/20"
        >
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-400" />
            How Server-Side Tracking Works
          </h3>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
              <span>Clicks go to <code className="px-2 py-0.5 rounded bg-white/10 text-primary-300">localhost:5000</code> (your server) - NOT directly to Google/Facebook</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
              <span>Ad-blockers can't distinguish this from regular API calls to your own domain</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
              <span>Server enriches data with IP, User-Agent, Geo location before forwarding</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
              <span>API keys stay secure on the server - never exposed to browser</span>
            </li>
          </ul>
        </motion.div>
      </section>
    </div>
  )
}
