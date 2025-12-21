// components/features.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Code, Atom, Rocket, Server,
  CheckCircle2, ArrowRight, Sparkles,
  BookOpen, Brain, Target, Zap, Trophy,
  FileText, Users, TrendingUp, Star
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { appConstants } from "@/lib/appConstants"

const { js_kit_price, react_kit_price, complete_kit_price } = appConstants()

interface Kit {
  id: string
  title: string
  subtitle: string
  description: string
  icon: React.ReactNode
  color: string
  bgGradient: string
  borderColor: string
  price: number
  highlights: {
    icon: React.ReactNode
    text: string
  }[]
  popular?: boolean
  bestValue?: boolean
}

const kits: Kit[] = [
  {
    id: "javascript",
    title: "JavaScript Kit",
    subtitle: "Foundation Mastery",
    description: "Master JavaScript concepts that 90% of candidates fail in interviews",
    icon: (
      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
        <span className="font-black text-xl text-white">JS</span>
      </div>
    ),
    color: "text-yellow-600",
    bgGradient: "from-yellow-50 to-amber-50",
    borderColor: "border-yellow-200 hover:border-yellow-400",
    price: js_kit_price,
    highlights: [
      { icon: <FileText className="w-4 h-4" />, text: "500+ Interview Questions" },
      { icon: <Target className="w-4 h-4" />, text: "Company-Specific Patterns" },
      { icon: <BookOpen className="w-4 h-4" />, text: "Quick Revision Sheets" },
      { icon: <Brain className="w-4 h-4" />, text: "Tricky Questions Decoded" }
    ]
  },
  {
    id: "react",
    title: "React.js Kit",
    subtitle: "Framework Excellence",
    description: "Land your dream React job with confidence and expertise",
    icon: (
      <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
        <Atom className="w-7 h-7 text-white animate-spin-slow" />
      </div>
    ),
    color: "text-blue-600",
    bgGradient: "from-blue-50 to-cyan-50",
    borderColor: "border-blue-200 hover:border-blue-400",
    price: react_kit_price,
    highlights: [
      { icon: <Code className="w-4 h-4" />, text: "500+ React Questions" },
      { icon: <Zap className="w-4 h-4" />, text: "Hooks Deep Dive" },
      { icon: <Target className="w-4 h-4" />, text: "State Management Patterns" },
      { icon: <Rocket className="w-4 h-4" />, text: "System Design Questions" }
    ]
  },
  {
    id: "complete",
    title: "Complete Frontend",
    subtitle: "All-in-One Bundle",
    description: "The most comprehensive Frontend Interview preparation kit ever created",
    icon: (
      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
        <Rocket className="w-7 h-7 text-white" />
      </div>
    ),
    color: "text-purple-600",
    bgGradient: "from-purple-50 to-pink-50",
    borderColor: "border-purple-300 hover:border-purple-500",
    price: complete_kit_price,
    popular: true,
    bestValue: true,
    highlights: [
      { icon: <BookOpen className="w-4 h-4" />, text: "JS + React + DSA Included" },
      { icon: <Code className="w-4 h-4" />, text: "Machine Coding Challenges" },
      { icon: <Brain className="w-4 h-4" />, text: "Frontend System Design" },
      { icon: <Trophy className="w-4 h-4" />, text: "Interview Success Kit" }
    ]
  },
  {
    id: "nodejs",
    title: "Node.js Kit",
    subtitle: "Backend Proficiency",
    description: "Interview questions from real FAANG & Product Company interviews",
    icon: (
      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
        <Server className="w-7 h-7 text-white" />
      </div>
    ),
    color: "text-green-600",
    bgGradient: "from-green-50 to-emerald-50",
    borderColor: "border-green-200 hover:border-green-400",
    price: 299,
    highlights: [
      { icon: <FileText className="w-4 h-4" />, text: "200+ Backend Questions" },
      { icon: <Target className="w-4 h-4" />, text: "Express & MongoDB" },
      { icon: <Zap className="w-4 h-4" />, text: "REST API Mastery" },
      { icon: <Brain className="w-4 h-4" />, text: "Scenario-Based Problems" }
    ]
  }
]

export function Features() {
  const [hoveredKit, setHoveredKit] = useState<string | null>(null)

  return (
    <section id="features" className="relative py-16 md:py-24 overflow-hidden">
      {/* Premium background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/50 to-white" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-50/30 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-1.5 text-sm font-medium text-blue-700 mb-4">
            <Sparkles className="w-4 h-4" />
            Premium Interview Kits
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Everything You Need to
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Crack Any Interview
            </span>
          </h2>

          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive materials designed by engineers who cracked FAANG interviews.
            Join <span className="font-semibold text-gray-900">25,000+</span> successful developers.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 mb-12 md:mb-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">25,000+</p>
              <p className="text-xs text-gray-500">Students</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">97%</p>
              <p className="text-xs text-gray-500">Success Rate</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">4.9/5</p>
              <p className="text-xs text-gray-500">Rating</p>
            </div>
          </div>
        </div>

        {/* Kits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {kits.map((kit) => (
            <div
              key={kit.id}
              className="group relative"
              onMouseEnter={() => setHoveredKit(kit.id)}
              onMouseLeave={() => setHoveredKit(null)}
            >
              {/* Popular/Best Value Badge */}
              {kit.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-3 py-1 text-xs font-bold shadow-lg">
                    ⭐ BESTSELLER
                  </Badge>
                </div>
              )}

              <div
                className={`
                  relative h-full rounded-2xl border-2 transition-all duration-300
                  ${kit.borderColor}
                  ${hoveredKit === kit.id ? 'shadow-xl -translate-y-1' : 'shadow-md'}
                  ${kit.popular ? 'ring-2 ring-purple-200' : ''}
                `}
              >
                {/* Card Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${kit.bgGradient} rounded-2xl opacity-50`} />

                <div className="relative p-5 md:p-6 h-full flex flex-col">
                  {/* Icon and Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="transform group-hover:scale-110 transition-transform duration-300">
                      {kit.icon}
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs font-semibold ${kit.color} mb-0.5`}>{kit.subtitle}</p>
                      <h3 className="font-bold text-lg text-gray-900">{kit.title}</h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    {kit.description}
                  </p>

                  {/* Highlights */}
                  <ul className="space-y-2.5 mb-5 flex-1">
                    {kit.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-center gap-2.5">
                        <div className={`${kit.color} opacity-80`}>
                          {highlight.icon}
                        </div>
                        <span className="text-sm text-gray-700">{highlight.text}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Price and CTA */}
                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-gray-900">₹{kit.price}</span>
                        {kit.bestValue && (
                          <Badge className="bg-green-100 text-green-700 text-[10px] border-0">
                            Best Value
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Link href={`/checkout/${kit.id}`}>
                      <button className={`
                        w-full py-2.5 rounded-lg text-sm font-semibold
                        flex items-center justify-center gap-2
                        bg-gray-900 text-white
                        hover:bg-gray-800 transition-all duration-300
                        group/btn
                      `}>
                        Get Access
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 md:mt-16 text-center">
          <p className="text-gray-600 mb-4">
            Not sure which kit is right for you?
          </p>
          <Link href="#products">
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
              Compare All Kits
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </section>
  )
}