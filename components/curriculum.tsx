// components/curriculum.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Code, Atom, Rocket, Server, ChevronRight,
  CheckCircle2, BookOpen, ArrowRight, Sparkles,
  Zap, Brain, Target, FileText, Database, Shield
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface KitCurriculum {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  color: string
  bgGradient: string
  modules: {
    name: string
    topics: string[]
  }[]
}

const kitsCurriculum: KitCurriculum[] = [
  {
    id: "javascript",
    title: "JavaScript Kit",
    subtitle: "Foundation Mastery",
    icon: (
      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
        <span className="font-black text-lg text-white">JS</span>
      </div>
    ),
    color: "text-yellow-600",
    bgGradient: "from-yellow-400 to-orange-500",
    modules: [
      {
        name: "Core JavaScript",
        topics: ["Scopes & Closures", "Event Loop & Async", "Prototypes & Classes", "this keyword"]
      },
      {
        name: "Advanced Concepts",
        topics: ["Promises & Async/Await", "ES6+ Features", "Module Systems", "Error Handling"]
      },
      {
        name: "Polyfills & Implementations",
        topics: ["Custom Promise", "bind/call/apply", "Array Methods", "Debounce/Throttle"]
      },
      {
        name: "Design Patterns",
        topics: ["Factory Pattern", "Observer Pattern", "Module Pattern", "SOLID Principles"]
      }
    ]
  },
  {
    id: "react",
    title: "React.js Kit",
    subtitle: "Framework Excellence",
    icon: (
      <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
        <Atom className="w-6 h-6 text-white" />
      </div>
    ),
    color: "text-blue-600",
    bgGradient: "from-cyan-400 to-blue-600",
    modules: [
      {
        name: "React Fundamentals",
        topics: ["Components & Props", "State & Lifecycle", "Event Handling", "JSX & Rendering"]
      },
      {
        name: "Hooks Deep Dive",
        topics: ["useState, useEffect", "useRef, useMemo", "Custom Hooks", "Rules of Hooks"]
      },
      {
        name: "State Management",
        topics: ["Context API", "Redux Essentials", "Zustand & Alternatives", "State Patterns"]
      },
      {
        name: "Performance & Testing",
        topics: ["Performance Optimization", "React Testing Library", "Code Splitting", "Virtual DOM"]
      }
    ]
  },
  {
    id: "complete",
    title: "Complete Frontend Kit",
    subtitle: "All-in-One Bundle",
    icon: (
      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
        <Rocket className="w-6 h-6 text-white" />
      </div>
    ),
    color: "text-purple-600",
    bgGradient: "from-purple-500 to-pink-500",
    modules: [
      {
        name: "JavaScript + React",
        topics: ["Everything from JS Kit", "Everything from React Kit", "Advanced Patterns", "Best Practices"]
      },
      {
        name: "HTML/CSS Excellence",
        topics: ["Semantic HTML5", "CSS Grid & Flexbox", "Responsive Design", "Accessibility (a11y)"]
      },
      {
        name: "Machine Coding",
        topics: ["Autocomplete", "Calendar Widget", "Infinite Scroll", "Debounce/Throttle"]
      },
      {
        name: "DSA in JavaScript",
        topics: ["Arrays & Strings", "Trees & Graphs", "Dynamic Programming", "Interview Patterns"]
      },
      {
        name: "System Design",
        topics: ["Frontend Architecture", "Performance & Caching", "Microfrontends", "Security (XSS, CSRF)"]
      }
    ]
  },
  {
    id: "nodejs",
    title: "Node.js Kit",
    subtitle: "Backend Proficiency",
    icon: (
      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
        <Server className="w-6 h-6 text-white" />
      </div>
    ),
    color: "text-green-600",
    bgGradient: "from-green-500 to-emerald-600",
    modules: [
      {
        name: "Node.js Core",
        topics: ["Event Loop & Async", "V8 Engine", "Built-in Modules", "NPM & Project Setup"]
      },
      {
        name: "Express.js Mastery",
        topics: ["Routing & Middleware", "Error Handling", "Template Engines", "Best Practices"]
      },
      {
        name: "MongoDB & Mongoose",
        topics: ["CRUD Operations", "Schemas & Models", "Indexes & Performance", "Data Validation"]
      },
      {
        name: "REST API & Security",
        topics: ["API Design", "JWT Authentication", "Security Patterns", "Performance & Testing"]
      }
    ]
  }
]

export function Curriculum() {
  const [activeKit, setActiveKit] = useState<string>("complete")

  const selectedKit = kitsCurriculum.find(kit => kit.id === activeKit) || kitsCurriculum[2]

  return (
    <section id="curriculum" className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-1.5 text-sm font-medium text-purple-700 mb-4">
            <BookOpen className="w-4 h-4" />
            Curriculum Overview
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            What's Inside Each
            <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Interview Kit
            </span>
          </h2>

          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive modules designed to cover every topic asked in frontend interviews
          </p>
        </div>

        {/* Kit Selector Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {kitsCurriculum.map((kit) => (
            <button
              key={kit.id}
              onClick={() => setActiveKit(kit.id)}
              className={`
                flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm
                transition-all duration-300
                ${activeKit === kit.id
                  ? `bg-gradient-to-r ${kit.bgGradient} text-white shadow-lg scale-105`
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-md'
                }
              `}
            >
              {kit.icon}
              <span className="hidden sm:inline">{kit.title}</span>
              <span className="sm:hidden">{kit.title.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Active Kit Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Kit Header */}
          <div className={`bg-gradient-to-r ${selectedKit.bgGradient} px-6 py-5 md:px-8 md:py-6`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                {selectedKit.id === "javascript" && <span className="font-black text-2xl text-white">JS</span>}
                {selectedKit.id === "react" && <Atom className="w-8 h-8 text-white" />}
                {selectedKit.id === "complete" && <Rocket className="w-8 h-8 text-white" />}
                {selectedKit.id === "nodejs" && <Server className="w-8 h-8 text-white" />}
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">{selectedKit.subtitle}</p>
                <h3 className="text-xl md:text-2xl font-bold text-white">{selectedKit.title}</h3>
              </div>
              {selectedKit.id === "complete" && (
                <Badge className="ml-auto bg-white/20 text-white border-0 px-3 py-1">
                  Most Comprehensive
                </Badge>
              )}
            </div>
          </div>

          {/* Modules Grid */}
          <div className="p-6 md:p-8">
            <div className={`grid gap-4 ${selectedKit.modules.length > 4 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
              {selectedKit.modules.map((module, idx) => (
                <div
                  key={idx}
                  className="group bg-gray-50 hover:bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${selectedKit.bgGradient} flex items-center justify-center text-white text-xs font-bold`}>
                      {idx + 1}
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm">{module.name}</h4>
                  </div>
                  <ul className="space-y-2">
                    {module.topics.map((topic, topicIdx) => (
                      <li key={topicIdx} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${selectedKit.color}`} />
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-gray-600 text-sm">
                Ready to master <span className="font-semibold text-gray-900">{selectedKit.title}</span>?
              </p>
              <Link href={`/checkout/${selectedKit.id}`}>
                <button className={`
                  inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white
                  bg-gradient-to-r ${selectedKit.bgGradient}
                  hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5
                `}>
                  Get {selectedKit.title}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 px-5 py-3 rounded-full">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-blue-800">
              All kits include lifetime updates and priority email support
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}