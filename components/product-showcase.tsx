// components/products-showcase.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Sparkles, Users, Star, Zap, TrendingUp, Clock, Flame, Code2, Atom, Server, Briefcase } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PaymentButton } from '@/components/payment-button';

export interface Product {
  id: string
  title: string
  shortTitle: string
  price: {
    current: number
    original: number
  }
  icon: React.ReactNode
  bgGradient: string
  iconBg: string
  popular?: boolean
  comingSoon?: boolean
  studentsCount?: number
  discount: number
  tag: string
}

const products: Product[] = [
  {
    id: "javascript-kit",
    title: "JS Interview Preparation Kit",
    shortTitle: "JavaScript Interview Kit",
    price: {
      current: 49,
      original: 499
    },
    icon: (
      <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
        <span className="font-black text-2xl text-white drop-shadow">JS</span>
      </div>
    ),
    bgGradient: "from-yellow-50 via-white to-amber-50",
    iconBg: "bg-gradient-to-br from-yellow-400 to-orange-500",
    studentsCount: 2547,
    discount: 90,
    tag: "Foundation"
  },
  {
    id: "react-kit",
    title: "Reactjs Interview Preparation Kit",
    shortTitle: "React.js Interview Kit",
    price: {
      current: 79,
      original: 799
    },
    icon: (
      <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
        <Atom className="w-8 h-8 text-white drop-shadow animate-spin-slow" />
      </div>
    ),
    bgGradient: "from-blue-50 via-white to-cyan-50",
    iconBg: "bg-gradient-to-br from-cyan-400 to-blue-600",
    studentsCount: 1823,
    discount: 90,
    tag: "Framework"
  },
  {
    id: "complete-frontend",
    title: "Complete Frontend Interview Preparation Kit",
    shortTitle: "Complete Frontend Interview Kit",
    price: {
      current: 99,
      original: 999
    },
    icon: (
      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
        <Code2 className="w-8 h-8 text-white drop-shadow" />
      </div>
    ),
    bgGradient: "from-purple-50 via-white to-pink-50",
    iconBg: "bg-gradient-to-br from-purple-500 to-pink-500",
    popular: true,
    studentsCount: 5892,
    discount: 90,
    tag: "All-in-One"
  },
  {
    id: "nodejs-kit",
    title: "Node.js Interview Preparation Kit",
    shortTitle: "Node.js Interview Kit",
    price: {
      current: 299,
      original: 2999
    },
    icon: (
      <div className="w-14 h-14 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
        <Server className="w-8 h-8 text-white drop-shadow" />
      </div>
    ),
    bgGradient: "from-green-50 via-white to-emerald-50",
    iconBg: "bg-gradient-to-br from-green-500 to-emerald-600",
    studentsCount: 6500,
    discount: 90,
    tag: "Backend"
  },
  {
    id: "interview-experiences",
    title: "Interview Experiences",
    shortTitle: "Interview Experiences",
    price: {
      current: 299,
      original: 2999
    },
    icon: (
      <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg opacity-80">
        <Briefcase className="w-8 h-8 text-white drop-shadow" />
      </div>
    ),
    bgGradient: "from-indigo-50 via-white to-purple-50",
    iconBg: "bg-gradient-to-br from-indigo-500 to-purple-600",
    comingSoon: true,
    discount: 90,
    tag: "Insights"
  }
]

export function ProductsShowcase() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  return (
    <section className="relative pb-12  md:py-20 overflow-hidden bg-gradient-to-b from-gray-50/50 via-white to-gray-50/50">
      {/* Premium background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-transparent to-transparent opacity-60" />
        <div className="absolute inset-0 bg-grid-gray-100/50 bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 relative">
        {/* Premium header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 px-4 py-1.5 text-xs font-bold shadow-lg animate-pulse">
              <Flame className="w-4 h-4 mr-1.5" />
              LIMITED TIME: 90% OFF
            </Badge>
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            Choose Your
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent ml-2">
              Interview Kit
            </span>
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Premium preparation materials trusted by thousands
          </p>
        </div>

        {/* Premium grid with better spacing */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
          {products.map((product) => (
            <div
              key={product.id}
            //   href={`/products/${product.id}`}
              className="group block h-full"
            //   onMouseEnter={() => setHoveredCard(product.id)}
            //   onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`
                relative h-full bg-white rounded-2xl p-4 transition-all duration-500
                ${hoveredCard === product.id 
                  ? 'transform -translate-y-2 scale-[1.02]' 
                  : 'hover:-translate-y-1'
                }
                ${product.comingSoon ? 'opacity-85' : ''}
              `}
              style={{
                boxShadow: hoveredCard === product.id 
                  ? '0 20px 40px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.03)' 
                  : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.02)'
              }}
              >
                {/* Subtle gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${product.bgGradient} opacity-40 rounded-2xl`} />
                
                {/* Popular badge - Elegant placement */}
                {product.popular && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
                    <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 text-[10px] px-3 py-1 font-bold shadow-md">
                      ⭐ BESTSELLER
                    </Badge>
                  </div>
                )}

                {/* Coming Soon overlay */}
                {/* {product.comingSoon && (
                  <div className="absolute inset-0 bg-gray-900/10 rounded-2xl z-10 flex items-center justify-center">
                    <Badge className="bg-white/90 text-gray-700 text-xs px-3 py-1.5 font-bold shadow-lg">
                      COMING SOON
                    </Badge>
                  </div>
                )} */}

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full">
                  {/* Icon centered */}
                  <div className="flex justify-center mb-3">
                    <div className="transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      {product.icon}
                    </div>
                  </div>

                  {/* Category tag */}
                  <div className="text-center mb-2">
                    <Badge variant="secondary" className="text-[9px] px-2 py-0.5 bg-gray-100">
                      {product.tag}
                    </Badge>
                  </div>

                  {/* Title - Full name */}
                  <h3 className="font-bold text-xs sm:text-sm text-center text-gray-900 leading-tight mb-2 min-h-[2rem]">
                    {product.shortTitle}
                  </h3>

                  {/* Students enrolled */}
                  {product.studentsCount && !product.comingSoon && (
                    <div className="flex items-center justify-center gap-1 mb-3">
                      <div className="flex -space-x-1">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-white" />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-600 font-medium">
                        {(product.studentsCount / 1000).toFixed(1)}k+ enrolled
                      </span>
                    </div>
                  )}

                  {/* Price Section - Premium styling */}
                  <div className="mt-auto">
                    {/* Discount badge - Better placement */}
                    {!product.comingSoon && (
                      <div className="flex justify-center mb-2">
                        <div className="inline-flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-md">
                          <Zap className="w-3 h-3" />
                          {product.discount}% OFF
                        </div>
                      </div>
                    )}

                    {/* Price */}
                    <div className="text-center mb-3">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl font-black text-gray-900">
                          ₹{product.price.current}
                        </span>
                        <span className="text-xs text-gray-400 line-through">
                          ₹{product.price.original}
                        </span>
                      </div>
                    </div>

                    {/* CTA Button - Premium style */}
                   <PaymentButton
                          amount={product.price.current}
                          originalAmount={product.price.original}
                          planName={product.title}
                          buttonText="Get Access"
                      className={`
                        w-full h-9 text-xs font-bold
                        ${product.comingSoon 
                          ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                          : `${product.iconBg} hover:opacity-95 text-white shadow-lg hover:shadow-xl`
                        }
                        border-0 transition-all duration-300
                        group/btn relative overflow-hidden rounded-lg
                      `}
                      disabled={product.comingSoon}
                        />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Premium bottom section */}
        <div className="flex flex-col items-center mt-12 space-y-4">
          {/* Trust badges with premium style */}
          <div className="flex flex-wrap justify-center items-center gap-6 px-6 py-3 bg-white/70 backdrop-blur rounded-full shadow-md">
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">Instant Access</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">97% Success Rate</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">Lifetime Support</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </section>
  )
}