"use client"
import { useState } from "react"
import Link from "next/link"

// This would go in app/preview/page.tsx
export default function ContentPreviewPage() {
  const [activeKit, setActiveKit] = useState("complete")

  const kits = {
    js: {
      name: "JS Interview Kit",
      price: "₹49",
      originalPrice: "₹99",
      icon: "⚡",
      tagline: "Master JavaScript in 2 weeks",
      highlights: [
        "Get job-ready in 14 days",
        "Questions from Google, Amazon, Microsoft",
        "Save 100+ hours of preparation time"
      ],
      modules: [
        {
          title: "🎯 Core JavaScript Mastery",
          topics: [
            "25 Closure patterns that 90% candidates fail",
            "Event loop explained with visual diagrams",
            "Prototype chain - Never get confused again",
            "Async JavaScript - Promises, Async/Await mastery"
          ],
          realValue: "Interview coaches charge ₹5000 for this"
        },
        {
          title: "🔥 Tricky Questions Bank",
          topics: [
            "50+ questions that eliminate 80% candidates",
            "Exact questions from recent interviews",
            "Hidden JavaScript behaviors exposed",
            "Common traps and how to avoid them"
          ],
          realValue: "Collected from 100+ real interviews"
        },
        {
          title: "💎 Polyfills & Modern JS",
          topics: [
            "Write your own Promise, bind, call, apply",
            "ES6+ features that impress interviewers",
            "Code that shows senior-level thinking",
            "Stand out from other candidates"
          ],
          realValue: "Senior engineers' secret weapons"
        },
        {
          title: "🏆 Patterns & Best Practices",
          topics: [
            "SOLID principles in JavaScript",
            "Design patterns used in React/Vue/Angular",
            "Clean code that gets you hired",
            "Architecture questions answered"
          ],
          realValue: "₹20,000 bootcamp material included"
        }
      ]
    },
    complete: {
      name: "Complete Frontend Kit",
      price: "₹149",
      originalPrice: "₹299",
      icon: "🚀",
      tagline: "Everything you need to crack any frontend interview",
      highlights: [
        "Land ₹15-40 LPA frontend roles",
        "Complete roadmap from basics to expert",
        "2500+ engineers already placed"
      ],
      modules: [
        {
          title: "⚡ Everything from JS Kit",
          topics: [
            "Complete JavaScript mastery included",
            "All polyfills and patterns",
            "Tricky questions bank",
            "₹99 value included FREE"
          ],
          realValue: "JS Kit included (₹99 value)"
        },
        {
          title: "⚛️ React Deep Dive",
          topics: [
            "Hooks - useState to custom hooks",
            "Performance optimization secrets",
            "Context vs Redux vs Zustand",
            "Questions from Meta & Netflix interviews"
          ],
          realValue: "₹10,000 course content"
        },
        {
          title: "🎨 HTML/CSS Mastery",
          topics: [
            "Flexbox & Grid - become a layout expert",
            "Responsive design that works everywhere",
            "CSS questions that trick seniors",
            "Accessibility - stand out from crowd"
          ],
          realValue: "Often ignored but always asked"
        },
        {
          title: "📊 DSA in JavaScript",
          topics: [
            "100+ problems solved in JavaScript",
            "Arrays, Strings, Trees, Graphs",
            "LeetCode patterns decoded",
            "Time complexity made simple"
          ],
          realValue: "₹15,000 DSA course included"
        },
        {
          title: "🏗️ System Design Frontend",
          topics: [
            "Design YouTube, Netflix, Uber UI",
            "Scalable frontend architecture",
            "Performance at scale",
            "Impress senior interviewers"
          ],
          realValue: "Senior engineer material"
        },
        {
          title: "💻 Machine Coding Round",
          topics: [
            "Build components in 45 minutes",
            "Autocomplete, Calendar, Carousel",
            "Clean code under pressure",
            "Actual interview components"
          ],
          realValue: "Practice what's actually asked"
        },
        {
          title: "🎁 BONUS: Success Kit",
          topics: [
            "Resources to learn (Gold mine of links)",
            "Cold email templates that work",
            "How I went from 3LPA to 25LPA",
            "Interview preparation timeline"
          ],
          realValue: "Priceless career advice"
        }
      ]
    }
  }

  const activeKitData = kits[activeKit as keyof typeof kits]

  const testimonials = [
    { name: "Rahul S.", role: "Frontend @ Amazon", text: "Questions were exactly what I faced!" },
    { name: "Priya M.", role: "SDE @ Microsoft", text: "Worth 100x the price. Got 3 offers!" },
    { name: "Amit K.", role: "React Dev @ Flipkart", text: "From 8LPA to 24LPA. Life changing!" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back</span>
          </Link>
          <Link href="/#pricing">
            <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-semibold">
              Get Access Now
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1 text-xs font-bold text-red-600 dark:text-red-400 mb-4 animate-pulse">
          🔥 50% OFF - Limited Time
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            See Why 2500+ Engineers
          </span>
          <br />
          <span>Choose Our Kits</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Real content that gets you real jobs
        </p>
      </section>

      {/* Kit Selector - Mobile Optimized */}
      <div className="px-4 mb-6">
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          {Object.entries(kits).map(([key, kit]) => (
            <button
              key={key}
              onClick={() => setActiveKit(key)}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                activeKit === key 
                  ? 'bg-background shadow-sm' 
                  : 'text-muted-foreground'
              }`}
            >
              <span className="mr-1">{kit.icon}</span>
              <span className="hidden sm:inline">{kit.name}</span>
              <span className="sm:hidden">{key === 'js' ? 'JS' : 'Complete'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Card - Mobile First */}
      <div className="px-4 mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-90">{activeKitData.name}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold">{activeKitData.price}</span>
                <span className="text-sm line-through opacity-70">{activeKitData.originalPrice}</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">SAVE 50%</span>
              </div>
              <p className="text-xs mt-1 opacity-90">{activeKitData.tagline}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl">{activeKitData.icon}</p>
              <Link href="/#pricing">
                <button className="mt-2 px-4 py-1.5 bg-white text-blue-600 rounded-full text-xs font-bold">
                  Get Now →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Value Highlights */}
      <div className="px-4 mb-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs font-bold text-yellow-800 dark:text-yellow-400 mb-2">
            🎯 Why this kit will change your career:
          </p>
          <ul className="space-y-1">
            {activeKitData.highlights.map((highlight, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs">
                <span className="text-green-500 mt-0.5">✓</span>
                <span className="text-yellow-900 dark:text-yellow-300">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Content Modules - Premium Display */}
      <div className="px-4 pb-8">
        <h2 className="font-bold text-lg mb-4">What You'll Master:</h2>
        <div className="space-y-4">
          {activeKitData.modules.map((module, idx) => (
            <div key={idx} className="bg-card rounded-xl border overflow-hidden hover:shadow-lg transition-all">
              <div className="p-4">
                <h3 className="font-bold text-base mb-2">{module.title}</h3>
                <ul className="space-y-2 mb-3">
                  {module.topics.map((topic, topicIdx) => (
                    <li key={topicIdx} className="flex items-start gap-2 text-xs">
                      <span className="text-primary mt-0.5">•</span>
                      <span className="text-muted-foreground">{topic}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-3 border-t">
                  <p className="text-xs font-medium text-green-600 dark:text-green-400">
                    💰 Real value: {module.realValue}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Social Proof */}
      <div className="bg-muted/50 px-4 py-6">
        <h3 className="font-bold text-base mb-4 text-center">What Engineers Say:</h3>
        <div className="space-y-3">
          {testimonials.map((testimonial, idx) => (
            <div key={idx} className="bg-background rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-2">"{testimonial.text}"</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600" />
                <div>
                  <p className="text-xs font-medium">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating CTA - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t md:hidden">
        <Link href="/#pricing" className="block">
          <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold shadow-lg">
            Get Instant Access - {activeKitData.price}
          </button>
        </Link>
      </div>

      {/* Desktop CTA */}
      <div className="hidden md:block px-4 pb-8">
        <div className="max-w-2xl mx-auto">
          <Link href="/#pricing">
            <button className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-xl hover:scale-105 transition-transform">
              Get Instant Access - {activeKitData.price} (50% OFF)
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}