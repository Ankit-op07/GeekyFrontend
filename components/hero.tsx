// components/hero.tsx
"use client"
import Image from "next/image"
import { useDevicePricing } from '@/hooks/use-device-detection';
import { appConstants } from "@/lib/appConstants";

export function Hero() {
    const { js, complete, isLoading } = useDevicePricing();
    const { js_kit_price, js_kit_original_price, discount_percentage } = appConstants();
  return (
    <section className="relative mx-auto max-w-7xl px-4 pt-24 pb-12 md:pt-32 md:pb-20 overflow-hidden">
      {/* Animated gradient background - adjusted for mobile */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 -left-20 w-40 h-40 md:w-72 md:h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob"></div>
        <div className="absolute top-10 -right-20 w-40 h-40 md:w-72 md:h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-10 w-40 h-40 md:w-72 md:h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-4000"></div>
      </div>

      <div className="grid gap-8 md:gap-12 md:grid-cols-2 md:items-center">
        <div className="relative z-10">
          {/* Urgency Banner */}
          <div className="inline-flex items-center gap-2 rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 mb-4 animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            🔥 Limited Time: {discount_percentage}% OFF • Ends in 4 Hours
          </div>

          {/* Main Headline - More Direct */}
          <h1 className="text-pretty font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            <span className="text-foreground">Crack Frontend Interviews With</span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Real Interview Questions
            </span>
            <br />
            <span className="text-foreground">in 30 days</span>
          </h1>

          {/* Clear Value Proposition */}
          <p className="mt-4 text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
            Ace frontend interview rounds using our curated Interview Kits containing latest and real interview questions from top tech companies like
            <span className="font-semibold text-foreground"> Google, Amazon, Microsoft</span> and more.
          </p>

          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Get Javascript Interview Kit At Just</p>
                <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{js_kit_price}</span>
                      <span className="text-sm text-muted-foreground line-through">₹{js_kit_original_price}</span>
                      <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">
                        SAVE {discount_percentage}%
                      </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold">✓ Instant Access</p>
                <p className="text-xs text-muted-foreground">✓ Lifetime Updates</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons with Urgency */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <a href="#pricing" className="group inline-flex relative">
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-200"></span>
              <span className="relative w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-white font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105">
                Get Instant Access →
                <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded">{discount_percentage}% OFF</span>
              </span>
            </a>
            <a href="#features" className="inline-flex group">
              <span className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border-2 border-secondary text-secondary px-4 sm:px-6 py-3 font-medium hover:bg-secondary/10 transition-all group-hover:border-primary">
                Know More 
              </span>
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs sm:text-sm">
            {/* Keep empty as per your existing code */}
          </div>
        </div>

        {/* Right Column - Hero Image (Desktop Only) */}
        <div className="hidden md:block relative">
          <div className="relative w-full h-[500px]">
            {/* Main illustration container */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-3xl overflow-hidden shadow-2xl">
              {/* You can replace this with an actual image */}
              <Image
                src="/hero-illustration.png" // Add your actual image path
                alt="Frontend Interview Preparation"
                fill
                className="object-cover"
                priority
                onError={(e) => {
                  // Fallback to placeholder if image doesn't exist
                  e.currentTarget.style.display = 'none';
                }}
              />
              
              {/* Fallback illustration if no image */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10">
                <div className="text-center p-8">
                  {/* Code editor illustration */}
                  <div className="bg-gray-900 rounded-lg p-4 shadow-2xl max-w-sm mx-auto">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="space-y-2 font-mono text-xs text-left">
                      <div className="text-purple-400">const <span className="text-blue-400">interview</span> = {`{`}</div>
                      <div className="ml-4 text-green-400">javascript: <span className="text-yellow-300">"500+ Questions"</span>,</div>
                      <div className="ml-4 text-green-400">react: <span className="text-yellow-300">"300+ Questions"</span>,</div>
                      <div className="ml-4 text-green-400">dsa: <span className="text-yellow-300">"200+ Problems"</span>,</div>
                      <div className="ml-4 text-green-400">success: <span className="text-orange-400">true</span></div>
                      <div className="text-purple-400">{`}`};</div>
                    </div>
                  </div>

                  {/* Floating badges */}
                  <div className="mt-6 flex justify-center gap-4">
                    <div className="bg-white rounded-full px-3 py-1 shadow-lg text-xs font-semibold text-gray-800 animate-bounce">
                      JS
                    </div>
                    <div className="bg-white rounded-full px-3 py-1 shadow-lg text-xs font-semibold text-gray-800 animate-bounce animation-delay-2000">
                      REACT
                    </div>
                    <div className="bg-white rounded-full px-3 py-1 shadow-lg text-xs font-semibold text-gray-800 animate-bounce animation-delay-4000">
                      DSA
                    </div>
                  </div>

                  {/* Success stats */}
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="bg-white/80 backdrop-blur rounded-lg p-3">
                      <div className="text-2xl font-bold text-blue-600">2.5K+</div>
                      <div className="text-xs text-gray-600">Engineers Placed</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-600">97%</div>
                      <div className="text-xs text-gray-600">Success Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-400 rounded-full opacity-20 animate-pulse animation-delay-2000"></div>
          </div>
        </div>
      </div>
    </section>
  )
}