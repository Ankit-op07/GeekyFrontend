// components/site-header.tsx
"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Menu, X, ChevronRight, Sparkles, Zap, ArrowRight } from "lucide-react"

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  const navLinks = [
    { href: "#pricing", label: "Pricing", badge: "90% OFF" },
    { href: "#features", label: "Features" },
    { href: "#curriculum", label: "Curriculum" },
    { href: "#faq", label: "FAQ" }
  ]

  return (
    <>
      <header className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-500
        ${scrolled 
          ? 'backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-lg' 
          : 'bg-white/70 backdrop-blur-md'
        }
      `}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <div className="relative">
                {/* Desktop Logo */}
                <Image
                  src="/inter.png"
                  alt="Geeky Frontend"
                  height={140}
                  width={140}
                  className="hidden sm:block transition-transform duration-300 group-hover:scale-105"
                  priority
                />
                {/* Mobile Logo */}
                <Image
                  src="/inter-mobile.jpg"
                  alt="Geeky Frontend"
                  height={50}
                  width={50}
                  className="sm:hidden rounded-lg"
                  priority
                />
                {/* Logo glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 rounded-full" />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <div key={link.href} className="relative">
                  <a
                    href={link.href}
                    className="relative px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-all duration-300 group"
                  >
                    <span className="relative z-10">{link.label}</span>
                    {link.badge && (
                      <Badge className="absolute -top-2 -right-1 bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 text-[9px] px-1.5 py-0.5 animate-pulse">
                        {link.badge}
                      </Badge>
                    )}
                    {/* Hover effect */}
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300" />
                  </a>
                </div>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Limited time badge - Desktop only */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full border border-orange-200">
                <Zap className="w-3 h-3 text-orange-500 animate-pulse" />
                <span className="text-xs font-semibold text-orange-700">Limited Offer</span>
              </div>

              {/* CTA Button */}
              <Button 
                size="sm" 
                className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 px-5 h-10"
                asChild
              >
                <a href="#pricing">
                  <Sparkles className="w-4 h-4" />
                  Get Started
                  <ArrowRight className="w-3 h-3" />
                </a>
              </Button>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden mt-4 relative w-10 h-10 flex items-center justify-center rounded-xl  from-gray-50 to-gray-100  hover:shadow-lg transition-all duration-300 group"
              >
                <div className="relative w-6 h-6">
                  {/* Animated burger/close icon */}
                  <span className={`absolute block h-0.5 w-5 bg-gray-700 transform transition-all duration-300 ${
                    mobileMenuOpen ? 'rotate-45 translate-y-0' : '-translate-y-1.5'
                  }`} />
                  <span className={`absolute block h-0.5 w-5 bg-gray-700 transition-all duration-300 ${
                    mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`} />
                  <span className={`absolute block h-0.5 w-5 bg-gray-700 transform transition-all duration-300 ${
                    mobileMenuOpen ? '-rotate-45 translate-y-0' : 'translate-y-1.5'
                  }`} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu - Premium sliding panel */}
      <div className={`
        fixed inset-0 z-[60] lg:hidden transition-all duration-500
        ${mobileMenuOpen ? 'visible' : 'invisible'}
      `}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Menu panel */}
        <div className={`
          absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl transition-all duration-500 transform
          ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          {/* Gradient header */}
          <div className="relative h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-6">
            {/* Close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            
            {/* Logo in menu */}
            <div className="absolute bottom-6 left-6">
              <div className="text-white">
                <h3 className="text-xl font-bold">Geeky Frontend</h3>
                <p className="text-xs text-white/80">Interview Prep Platform</p>
              </div>
            </div>

            {/* Decorative circles */}
            <div className="absolute top-4 left-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
            <div className="absolute bottom-4 right-8 w-16 h-16 bg-white/10 rounded-full blur-xl" />
          </div>

          {/* Navigation items */}
          <nav className="p-6 space-y-2">
            {navLinks.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="group flex items-center justify-between p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                style={{
                  animation: mobileMenuOpen ? `slideInRight ${0.3 + index * 0.1}s ease-out` : 'none'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full group-hover:scale-150 transition-transform" />
                  <span className="font-medium text-gray-700 group-hover:text-gray-900">
                    {link.label}
                  </span>
                  {link.badge && (
                    <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 text-[9px] px-2 py-0.5 animate-pulse">
                      {link.badge}
                    </Badge>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
              </a>
            ))}
          </nav>

          {/* Special offer card */}
          <div className="px-6 mb-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-red-400 p-4 shadow-xl">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-white" />
                  <span className="text-white font-bold text-sm">Limited Time Offer</span>
                </div>
                <p className="text-white/90 text-xs mb-3">
                  Get 90% off on all interview kits. Offer ends soon!
                </p>
                <div className="text-white text-2xl font-black">
                  90% OFF
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/20 rounded-full blur-2xl" />
            </div>
          </div>

          {/* CTA Button */}
          <div className="px-6 pb-6">
            <Button 
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-xl text-base font-semibold"
              onClick={() => {
                setMobileMenuOpen(false)
                // Navigate to pricing
                window.location.href = '#pricing'
              }}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Get Started Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Bottom decorative line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </>
  )
}