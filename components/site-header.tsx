// components/site-header.tsx
"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { Menu, X, ChevronRight, Sparkles, Zap, ArrowRight, User, LogOut, LayoutDashboard, ChevronDown } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

interface SessionUser {
  id: string
  email: string
  name: string
  profilePicture?: string
}

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [mobileMenuOpen])

  // Fetch session on mount and on route change
  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(d => {
      setUser(d.user || null)
    }).catch(() => setUser(null))
  }, [pathname])

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleLogout = async () => {
    await fetch("/api/auth/session", { method: "DELETE" })
    localStorage.removeItem("companyKitToken")
    setUser(null)
    setProfileOpen(false)
    router.push("/")
  }

  const navLinks = [
    { href: "/#pricing", label: "Pricing", badge: "90% OFF" },
    { href: "/#features", label: "Features" },
    { href: "/#curriculum", label: "Curriculum" },
    { href: "/#faq", label: "FAQ" }
  ]

  const initials = user?.name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() || "?"

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
                <Image src="/inter.png" alt="Geeky Frontend" height={140} width={140}
                  className="hidden sm:block transition-transform duration-300 group-hover:scale-105" priority />
                <Image src="/inter-mobile.jpg" alt="Geeky Frontend" height={50} width={50}
                  className="sm:hidden rounded-lg" priority />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 rounded-full" />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <div key={link.href} className="relative">
                  <Link href={link.href}
                    className="relative px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-all duration-300 group">
                    <span className="relative z-10">{link.label}</span>
                    {link.badge && (
                      <Badge className="absolute -top-2 -right-1 bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 text-[9px] px-1.5 py-0.5 animate-pulse">
                        {link.badge}
                      </Badge>
                    )}
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300" />
                  </Link>
                </div>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full border border-orange-200">
                <Zap className="w-3 h-3 text-orange-500 animate-pulse" />
                <span className="text-xs font-semibold text-orange-700">Limited Offer</span>
              </div>

              {user ? (
                /* ── Profile Avatar Dropdown ── */
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 hover:shadow-md transition-all duration-200 group"
                  >
                    {user.profilePicture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.profilePicture} alt={user.name}
                        className="w-8 h-8 rounded-full border-2 border-violet-300 object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {initials}
                      </div>
                    )}
                    <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                      {user.name.split(" ")[0]}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown */}
                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* User info */}
                      <div className="px-4 py-3 bg-gradient-to-br from-violet-50 to-purple-50 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link href="/dashboard" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors">
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Link>
                        <Link href="/dashboard?tab=profile" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors">
                          <User className="w-4 h-4" />
                          Profile
                        </Link>
                        <div className="h-px bg-gray-100 my-1" />
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                          <LogOut className="w-4 h-4" />
                          Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Login button ── */
                <Button size="sm" variant="outline"
                  className="hidden sm:flex items-center gap-2 border-violet-200 text-violet-700 hover:bg-violet-50 h-10"
                  asChild>
                  <Link href={`/login?redirect=${encodeURIComponent(pathname || "/dashboard")}`}>
                    <User className="w-4 h-4" />
                    Login
                  </Link>
                </Button>
              )}

              {/* Desktop CTA */}
              {!user && (
                <Button size="sm"
                  className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 px-5 h-10"
                  asChild>
                  <Link href="#pricing">
                    <Sparkles className="w-4 h-4" />
                    Get Started
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </Button>
              )}

              {/* Mobile menu button */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden mt-4 relative w-10 h-10 flex items-center justify-center rounded-xl from-gray-50 to-gray-100 hover:shadow-lg transition-all duration-300 group">
                <div className="relative w-6 h-6">
                  <span className={`absolute block h-0.5 w-5 bg-gray-700 transform transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-0' : '-translate-y-1.5'}`} />
                  <span className={`absolute block h-0.5 w-5 bg-gray-700 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`} />
                  <span className={`absolute block h-0.5 w-5 bg-gray-700 transform transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 translate-y-0' : 'translate-y-1.5'}`} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div className={`fixed inset-0 z-[60] lg:hidden transition-all duration-500 ${mobileMenuOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileMenuOpen(false)} />
        <div className={`absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl transition-all duration-500 transform ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="relative h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-6">
            <button onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
            {user ? (
              <div className="absolute bottom-6 left-6 flex items-center gap-3">
                {user.profilePicture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.profilePicture} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white/50" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                    {initials}
                  </div>
                )}
                <div className="text-white">
                  <p className="font-semibold text-sm">{user.name}</p>
                  <p className="text-xs text-white/70">{user.email}</p>
                </div>
              </div>
            ) : (
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-xl font-bold">Geeky Frontend</h3>
                <p className="text-xs text-white/80">Interview Prep Platform</p>
              </div>
            )}
            <div className="absolute top-4 left-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
            <div className="absolute bottom-4 right-8 w-16 h-16 bg-white/10 rounded-full blur-xl" />
          </div>

          <nav className="p-6 space-y-2">
            {user && (
              <>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-4 rounded-xl bg-violet-50 text-violet-700 font-medium mb-2">
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <div className="h-px bg-gray-100 mb-2" />
              </>
            )}
            {navLinks.map((link, index) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}
                className="group flex items-center justify-between p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                style={{ animation: mobileMenuOpen ? `slideInRight ${0.3 + index * 0.1}s ease-out` : 'none' }}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full group-hover:scale-150 transition-transform" />
                  <span className="font-medium text-gray-700 group-hover:text-gray-900">{link.label}</span>
                  {link.badge && (
                    <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 text-[9px] px-2 py-0.5 animate-pulse">
                      {link.badge}
                    </Badge>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </nav>

          <div className="px-6 pb-4">
            {user ? (
              <button onClick={() => { handleLogout(); setMobileMenuOpen(false) }}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium">
                <LogOut className="w-4 h-4" /> Log out
              </button>
            ) : (
              <div className="space-y-3">
                <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold" asChild>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Sparkles className="w-5 h-5 mr-2" /> Sign In / Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  )
}