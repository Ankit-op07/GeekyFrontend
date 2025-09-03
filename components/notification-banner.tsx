"use client"
import { X, Sparkles, Clock, ArrowRight } from "lucide-react"
import { useState, useEffect } from "react"

export function NotificationBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const [timeLeft, setTimeLeft] = useState({ hours: 24, minutes: 0, seconds: 0 })

  // useEffect(() => {
  //   // Check if banner was previously closed
  //   const bannerClosed = localStorage.getItem('bannerClosed')
  //   const closedTime = localStorage.getItem('bannerClosedTime')
    
  //   if (bannerClosed && closedTime) {
  //     const timeSinceClosed = Date.now() - parseInt(closedTime)
  //     const oneDay = 24 * 60 * 60 * 1000
      
  //     // Show banner again after 24 hours
  //     if (timeSinceClosed < oneDay) {
  //       setIsVisible(false)
  //     } else {
  //       localStorage.removeItem('bannerClosed')
  //       localStorage.removeItem('bannerClosedTime')
  //     }
  //   }

  //   // Countdown timer
  //   const timer = setInterval(() => {
  //     setTimeLeft(prev => {
  //       if (prev.seconds > 0) {
  //         return { ...prev, seconds: prev.seconds - 1 }
  //       } else if (prev.minutes > 0) {
  //         return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 }
  //       } else if (prev.hours > 0) {
  //         return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
  //       }
  //       return prev
  //     })
  //   }, 1000)

  //   return () => clearInterval(timer)
  // }, [])

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem('bannerClosed', 'true')
    localStorage.setItem('bannerClosedTime', Date.now().toString())
  }

  if (!isVisible) return null

  return (
    <div className="relative w-full bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)`
        }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left section with icon */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            
            {/* Main message */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="text-sm font-semibold">
                🎉 Limited Time: 50% OFF on all interview prep kits!
              </span>
              
              {/* Timer */}
              {/* <div className="flex items-center gap-2 text-sm">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-mono">
                  {String(timeLeft.hours).padStart(2, '0')}:
                  {String(timeLeft.minutes).padStart(2, '0')}:
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="opacity-90">left</span>
              </div> */}
            </div>
          </div>

          {/* CTA and Close */}
          <div className="flex items-center gap-2">
            <a
              href="#pricing"
              className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-all hover:bg-white/30"
              onClick={() => {
                // Smooth scroll to pricing section
                const pricingSection = document.getElementById('pricing')
                if (pricingSection) {
                  pricingSection.scrollIntoView({ behavior: 'smooth' })
                }
              }}
            >
              <span>Claim Offer</span>
              <ArrowRight className="w-3 h-3" />
            </a>
            
            <button
              onClick={handleClose}
              className="rounded-full p-1 hover:bg-white/20 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="sm:hidden mt-2">
          <a
            href="#pricing"
            className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium backdrop-blur-sm"
            onClick={(e) => {
              e.preventDefault()
              const pricingSection = document.getElementById('pricing')
              if (pricingSection) {
                pricingSection.scrollIntoView({ behavior: 'smooth' })
              }
            }}
          >
            <span>Claim Offer</span>
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  )
}

// Alternative designs for different notification types
export function InfoBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="relative w-full bg-blue-50 border-b border-blue-100">
      <div className="mx-auto max-w-7xl px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-blue-900">
            <span className="font-medium">📚 New:</span>
            <span>Frontend System Design questions added to the Complete Kit</span>
            <a href="#curriculum" className="font-medium underline underline-offset-2 hover:no-underline">
              Learn more →
            </a>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="rounded-full p-1 hover:bg-blue-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5 text-blue-600" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Minimal sticky banner option
export function MinimalBanner() {
  return (
    <div className="w-full bg-gray-900 text-white py-2 text-center text-sm">
      <span>🚀 Early bird offer: Get 50% off today only • </span>
      <a href="#pricing" className="font-semibold underline underline-offset-2 hover:no-underline">
        Get Started
      </a>
    </div>
  )
}