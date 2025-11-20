// app/checkout/[kit]/page.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { PaymentButton } from '@/components/payment-button'
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { appConstants } from "@/lib/appConstants"
import {
  Check, Star, Shield, Clock, TrendingUp, Users, Award,
  BookOpen, Code, Zap, Target, Gift, AlertCircle, Lock,
  ChevronRight, Sparkles, Trophy, Rocket, Brain,
  FileText, Video, Download, RefreshCw, HeartHandshake,
  ArrowLeft, CreditCard, X
} from "lucide-react"

interface KitDetails {
  id: string
  name: string
  tagline: string
  price: number
  originalPrice: number
  discount: number
  icon: React.ReactNode
  color: string
  bgGradient: string
  students: number
  rating: number
  reviews: number
  lastUpdated: string
  features: {
    icon: React.ReactNode
    title: string
    description: string
  }[]
  curriculum: {
    module: string
    topics: string[]
    hours: number
  }[]
  included: {
    icon: React.ReactNode
    text: string
    value?: string
  }[]
  testimonials: {
    name: string
    role: string
    company: string
    image?: string
    text: string
    rating: number
  }[]
  faqs: {
    question: string
    answer: string
  }[]
  bonuses?: {
    icon: React.ReactNode
    title: string
    value: string
    description: string
  }[]
}

/* ---------- Custom Node SVG Icon (inline) ---------- */
function NodeIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="nodeGrad" x1="0" x2="1">
          <stop offset="0" stopColor="#83c66a" />
          <stop offset="1" stopColor="#2f9f4e" />
        </linearGradient>
      </defs>
      <g transform="translate(50,50)">
        <path d="M-32,0 L-16,-28 L16,-28 L32,0 L16,28 L-16,28 Z" fill="url(#nodeGrad)" stroke="#0b5a2f" strokeWidth="1"/>
        <text x="-6" y="6" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="22" fill="white">N</text>
      </g>
    </svg>
  )
}

function parseCurrencyValue(value?: string): number {
  if (!value) return 0
  const digits = value.replace(/[^\d]/g, "")
  if (!digits) return 0
  return parseInt(digits, 10)
}

const kitsData: Record<string, KitDetails> = {
  javascript: {
    id: "javascript",
    name: "JavaScript Interview Mastery Kit",
    tagline: "Master JavaScript concepts that 90% of candidates fail",
    price: 49,
    originalPrice: 499,
    discount: 90,
    icon: <Zap className="w-6 h-6" />,
    color: "from-yellow-500 to-orange-500",
    bgGradient: "from-yellow-50 via-white to-orange-50",
    students: 2547,
    rating: 4.9,
    reviews: 487,
    lastUpdated: "Updated 2 days ago",
    features: [
      {
        icon: <Brain className="w-5 h-5" />,
        title: "500+ Curated Questions",
        description: "Real questions from Google, Amazon, Microsoft interviews"
      },
      {
        icon: <Target className="w-5 h-5" />,
        title: "Company-Specific Patterns",
        description: "Know exactly what each company asks"
      },
      {
        icon: <Rocket className="w-5 h-5" />,
        title: "Quick Revision Notes",
        description: "Last-minute preparation sheets that save hours"
      },
      {
        icon: <Trophy className="w-5 h-5" />,
        title: "Tricky Questions Decoded",
        description: "Master the questions that eliminate most candidates"
      }
    ],
    curriculum: [
      {
        module: "Core JavaScript Mastery",
        topics: ["Closures & Scopes", "Event Loop", "Prototypes", "this keyword", "Async Patterns"],
        hours: 8
      },
      {
        module: "Advanced Concepts",
        topics: ["Promises & Async/Await", "ES6+ Features", "Module Systems", "Error Handling"],
        hours: 6
      },
      {
        module: "Polyfills & Implementations",
        topics: ["Custom Promise", "bind/call/apply", "Array methods", "Debounce/Throttle"],
        hours: 5
      },
      {
        module: "Design Patterns",
        topics: ["SOLID Principles", "Factory Pattern", "Observer Pattern", "Module Pattern"],
        hours: 4
      }
    ],
    included: [
      { icon: <FileText className="w-4 h-4" />, text: "4 Comprehensive PDFs", value: "200+ pages" },
      { icon: <Code className="w-4 h-4" />, text: "Code Examples", value: "150+ snippets" },
      { icon: <Download className="w-4 h-4" />, text: "Instant Download", value: "Get in 2 mins" },
      { icon: <RefreshCw className="w-4 h-4" />, text: "Lifetime Updates", value: "Forever free" },
      { icon: <Users className="w-4 h-4" />, text: "Discord Community", value: "1000+ members" },
      { icon: <HeartHandshake className="w-4 h-4" />, text: "Email Support", value: "24hr response" }
    ],
    testimonials: [
      {
        name: "Rahul Sharma",
        role: "Frontend Engineer",
        company: "Amazon",
        text: "The tricky questions section alone is worth 10x the price. Got asked 3 exact questions!",
        rating: 5
      },
      {
        name: "Priya Patel",
        role: "SDE-2",
        company: "Microsoft",
        text: "Went from struggling with closures to explaining them confidently. Life-changing material!",
        rating: 5
      },
      {
        name: "Amit Kumar",
        role: "React Developer",
        company: "Flipkart",
        text: "Company-specific patterns helped me crack multiple offers. ROI is incredible!",
        rating: 5
      }
    ],
    faqs: [
      {
        question: "Is this suitable for beginners?",
        answer: "Yes! We start from fundamentals and gradually build to advanced concepts. Perfect for 0-3 years experience."
      },
      {
        question: "How is this different from free resources?",
        answer: "We've curated only what's actually asked in interviews, saving you 100+ hours of research. Plus, our explanations are interview-focused, not academic."
      },
      {
        question: "Do I get updates?",
        answer: "Yes! All updates are free for life. We update content monthly based on latest interview trends."
      }
    ],
    bonuses: [
      {
        icon: <Gift className="w-5 h-5" />,
        title: "Quick Revision Sheets",
        value: "₹999",
        description: "One-page summaries for last-minute prep"
      },
      {
        icon: <Video className="w-5 h-5" />,
        title: "Recorded Mock Interview",
        value: "₹1499",
        description: "Watch how to answer JS questions perfectly"
      }
    ]
  },
  react: {
    id: "react",
    name: "React Interview Mastery Kit",
    tagline: "Land your dream React job with confidence",
    price: 49,
    originalPrice: 499,
    discount: 90,
    icon: <Code className="w-6 h-6" />,
    color: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 via-white to-cyan-50",
    students: 3421,
    rating: 4.9,
    reviews: 634,
    lastUpdated: "Updated yesterday",
    features: [
      {
        icon: <Target className="w-5 h-5" />,
        title: "400+ React Questions",
        description: "From hooks to performance optimization"
      },
      {
        icon: <Rocket className="w-5 h-5" />,
        title: "Real Interview Scenarios",
        description: "Asked at Meta, Netflix, Airbnb"
      },
      {
        icon: <Brain className="w-5 h-5" />,
        title: "Hooks Deep Dive",
        description: "Master useState, useEffect, custom hooks"
      },
      {
        icon: <Sparkles className="w-5 h-5" />,
        title: "State Management",
        description: "Redux, Context, Zustand patterns"
      }
    ],
    curriculum: [
      {
        module: "React Fundamentals",
        topics: ["Components", "Props & State", "Lifecycle", "Events", "Conditional Rendering"],
        hours: 6
      },
      {
        module: "Hooks Mastery",
        topics: ["useState", "useEffect", "useContext", "useReducer", "Custom Hooks"],
        hours: 7
      },
      {
        module: "Advanced Patterns",
        topics: ["HOCs", "Render Props", "Compound Components", "Context Patterns"],
        hours: 5
      },
      {
        module: "Performance & Testing",
        topics: ["React.memo", "useMemo", "useCallback", "Code Splitting", "Testing Library"],
        hours: 5
      }
    ],
    included: [
      { icon: <FileText className="w-4 h-4" />, text: "5 Comprehensive PDFs", value: "250+ pages" },
      { icon: <Code className="w-4 h-4" />, text: "Component Examples", value: "180+ snippets" },
      { icon: <Download className="w-4 h-4" />, text: "Instant Download", value: "Get in 2 mins" },
      { icon: <RefreshCw className="w-4 h-4" />, text: "Lifetime Updates", value: "Forever free" },
      { icon: <Users className="w-4 h-4" />, text: "Discord Community", value: "1000+ members" },
      { icon: <HeartHandshake className="w-4 h-4" />, text: "Email Support", value: "24hr response" }
    ],
    testimonials: [
      {
        name: "Anjali Gupta",
        role: "React Developer",
        company: "Swiggy",
        text: "The hooks section cleared all my doubts. Got 3 offers after studying this!",
        rating: 5
      },
      {
        name: "Vikram Shah",
        role: "Frontend Lead",
        company: "PhonePe",
        text: "Performance optimization patterns helped me ace the technical round.",
        rating: 5
      },
      {
        name: "Sneha Roy",
        role: "SDE-2",
        company: "Razorpay",
        text: "Best investment I made. Covers everything from basics to advanced patterns!",
        rating: 5
      }
    ],
    faqs: [
      {
        question: "Do I need to know JavaScript first?",
        answer: "Yes, basic JavaScript knowledge is recommended. We have a separate JS Kit if you need to brush up."
      },
      {
        question: "Does this cover React 18?",
        answer: "Yes! All content is updated for React 18 including concurrent features and new hooks."
      },
      {
        question: "Is Next.js covered?",
        answer: "We cover React fundamentals. Next.js specific questions are in our Complete Kit."
      }
    ],
    bonuses: [
      {
        icon: <Gift className="w-5 h-5" />,
        title: "Component Library",
        value: "₹1499",
        description: "20+ production-ready components"
      },
      {
        icon: <Video className="w-5 h-5" />,
        title: "Live Coding Session",
        value: "₹1999",
        description: "Build a real-time app from scratch"
      }
    ]
  },
  complete: {
    id: "complete",
    name: "Complete Frontend Interview Kit",
    tagline: "Everything you need to crack any frontend interview",
    price: 99,
    originalPrice: 999,
    discount: 90,
    icon: <Rocket className="w-6 h-6" />,
    color: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-50 via-white to-pink-50",
    students: 5892,
    rating: 4.95,
    reviews: 892,
    lastUpdated: "Updated yesterday",
    features: [
      {
        icon: <BookOpen className="w-5 h-5" />,
        title: "All-in-One Solution",
        description: "JS, React, HTML/CSS, DSA - everything covered"
      },
      {
        icon: <Code className="w-5 h-5" />,
        title: "Machine Coding Practice",
        description: "Build components in 45 minutes like pros"
      },
      {
        icon: <Brain className="w-5 h-5" />,
        title: "System Design Frontend",
        description: "Design YouTube, Netflix UI architecture"
      },
      {
        icon: <Award className="w-5 h-5" />,
        title: "Interview Success Kit",
        description: "Behavioral questions, salary negotiation tips"
      }
    ],
    curriculum: [
      {
        module: "JavaScript Mastery",
        topics: ["Everything from JS Kit", "Advanced Patterns", "Performance"],
        hours: 15
      },
      {
        module: "React Deep Dive",
        topics: ["Hooks Mastery", "State Management", "Performance", "Testing"],
        hours: 12
      },
      {
        module: "HTML/CSS Excellence",
        topics: ["Semantic HTML", "CSS Grid/Flexbox", "Responsive Design", "Animations"],
        hours: 8
      },
      {
        module: "DSA in JavaScript",
        topics: ["Arrays/Strings", "Trees/Graphs", "Dynamic Programming", "Patterns"],
        hours: 10
      },
      {
        module: "Machine Coding",
        topics: ["Autocomplete", "Calendar", "Infinite Scroll", "Mini Apps"],
        hours: 8
      },
      {
        module: "System Design",
        topics: ["Frontend Architecture", "Scalability", "Performance", "Security"],
        hours: 6
      }
    ],
    included: [
      { icon: <FileText className="w-4 h-4" />, text: "11 Premium PDFs", value: "500+ pages" },
      { icon: <Code className="w-4 h-4" />, text: "Code Solutions", value: "300+ examples" },
      { icon: <BookOpen className="w-4 h-4" />, text: "JS Kit Included", value: "₹49 value FREE" },
      { icon: <Download className="w-4 h-4" />, text: "Instant Access", value: "Download now" },
      { icon: <RefreshCw className="w-4 h-4" />, text: "Lifetime Updates", value: "Always current" },
      { icon: <HeartHandshake className="w-4 h-4" />, text: "Priority Support", value: "12hr response" }
    ],
    testimonials: [
      {
        name: "Sakshi Verma",
        role: "Senior Frontend",
        company: "Google",
        text: "This kit got me from 8LPA to 35LPA. The ROI is insane! System design section is gold.",
        rating: 5
      },
      {
        name: "Rohan Mehta",
        role: "Tech Lead",
        company: "Uber",
        text: "Machine coding section saved me. Built a calendar component in 40 mins in my interview!",
        rating: 5
      },
      {
        name: "Neha Singh",
        role: "Full Stack Developer",
        company: "Adobe",
        text: "DSA in JavaScript is exactly what I needed. No more converting from C++ solutions!",
        rating: 5
      }
    ],
    faqs: [
      {
        question: "Is JS Kit included?",
        answer: "Yes! You get everything from JS Kit (₹49 value) plus React, DSA, Machine Coding, System Design, and more."
      },
      {
        question: "How long to complete?",
        answer: "Most students complete in 4-8 weeks studying 2-3 hours daily. You have lifetime access to go at your pace."
      },
      {
        question: "Is this worth it if I know JS?",
        answer: "Absolutely! React, DSA, Machine Coding, and System Design sections alone are worth 10x the price."
      }
    ],
    bonuses: [
      {
        icon: <Gift className="w-5 h-5" />,
        title: "Resource Collection",
        value: "₹2999",
        description: "Curated links, articles, videos worth gold"
      },
      {
        icon: <Trophy className="w-5 h-5" />,
        title: "Cold Email Templates",
        value: "₹1999",
        description: "Templates that got responses from FAANG"
      },
      {
        icon: <Sparkles className="w-5 h-5" />,
        title: "Success Roadmap",
        value: "₹999",
        description: "My journey from 3LPA to 25LPA"
      }
    ]
  },
  nodejs: {
    id: "nodejs",
    name: "Node.js Interview Preparation Kit",
    tagline: "Interview Questions from Real FAANG & Product Company Interviews",
    price: 299,
    originalPrice: 2999,
    discount: 90,
    icon: <NodeIcon size={40} />,
    color: "from-green-600 to-emerald-600",
    bgGradient: "linear-gradient(135deg,#e6f8ea 0%,#ffffff 50%,#eaf7ef 100%)",
    students: 6741,
    rating: 4.9,
    reviews: 2102,
    lastUpdated: "Updated 2 days ago",
    features: [
      {
        icon: <Shield className="w-5 h-5" />,
        title: "Complete Backend Concepts",
        description: "Event Loop, Streams, Clusters, Security, Performance & Production Deployment"
      },
      {
        icon: <Zap className="w-5 h-5" />,
        title: "25 Comprehensive Modules",
        description: "Node.js, Express, MongoDB, REST APIs, Authentication, Testing & More"
      },
      {
        icon: <BookOpen className="w-5 h-5" />,
        title: "Visual Learning Approach",
        description: "200+ pages with diagrams, flowcharts and step-by-step explanations"
      },
      {
        icon: <Brain className="w-5 h-5" />,
        title: "Scenario-Based Questions",
        description: "Learn how to think like a senior developer in problem-solving rounds"
      },
      {
        icon: <Code className="w-5 h-5" />,
        title: "200+ Real Interview Questions",
        description: "Actual questions from Amazon, Microsoft, Swiggy, Zomato, PhonePe & more"
      },
      {
        icon: <Rocket className="w-5 h-5" />,
        title: "Production-Ready Projects",
        description: "Build real-world apps: Rate Limiter, File Streaming, Auth System, Chat App"
      },
    ],
    curriculum: [
      {
        module: "Node.js Core & Fundamentals",
        topics: [
          "Event Loop & Async Flow",
          "Single-threaded vs Multi-threaded",
          "V8 Engine Deep Dive",
          "Built-in Modules (fs, path, http, events, os)",
          "NPM & Project Setup"
        ],
        hours: 8
      },
      {
        module: "Express.js Mastery",
        topics: [
          "Express Basics & Server Setup",
          "Middleware Architecture",
          "Routing Patterns & Best Practices",
          "Template Engines (EJS)",
          "Error Handling & Debugging",
          "Application vs Route-level Middleware"
        ],
        hours: 10
      },
      {
        module: "REST API Development",
        topics: [
          "REST Principles & Guidelines",
          "HTTP Methods & Status Codes",
          "CORS, Serialization & Deserialization",
          "Authentication (JWT, API Keys, OAuth)",
          "Authorization & Security Patterns"
        ],
        hours: 7
      },
      {
        module: "MongoDB & Mongoose",
        topics: [
          "NoSQL vs RDBMS Concepts",
          "MongoDB Setup & CRUD Operations",
          "Query Operators & Projection",
          "Indexes & Performance",
          "Mongoose Schemas & Models",
          "Data Validation & Relationships"
        ],
        hours: 9
      },
      {
        module: "Security, Performance & Deployment",
        topics: [
          "XSS & SQL Injection Prevention",
          "Password Hashing with Bcrypt",
          "Performance Optimization",
          "Production Deployment Strategies",
          "Testing with Jest",
          "WebSocket for Real-time Apps"
        ],
        hours: 6
      },
      {
        module: "JavaScript Essentials for Node",
        topics: [
          "Modern ES6+ Features",
          "Async/Await & Promises",
          "Destructuring & Spread Operators",
          "Arrow Functions & Callbacks",
          "Classes & Object-Oriented JS"
        ],
        hours: 4
      }
    ],
    included: [
      { 
        icon: <FileText className="w-4 h-4" />, 
        text: "6 Premium PDFs", 
        value: "250+ pages" 
      },
      { 
        icon: <Code className="w-4 h-4" />, 
        text: "200+ Code Examples", 
        value: "Copy-paste ready" 
      },
      { 
        icon: <Target className="w-4 h-4" />, 
        text: "Real Interview Questions", 
        value: "FAANG tested" 
      },
      { 
        icon: <Download className="w-4 h-4" />, 
        text: "Instant Access", 
        value: "Download now" 
      },
      { 
        icon: <RefreshCw className="w-4 h-4" />, 
        text: "Lifetime Updates", 
        value: "Forever free" 
      },
      { 
        icon: <HeartHandshake className="w-4 h-4" />, 
        text: "Priority Support", 
        value: "12hr response" 
      }
    ],
    testimonials: [
      {
        name: "Karan Verma",
        role: "Backend Engineer",
        company: "Zomato",
        text: "The 200+ questions covered everything I was asked. Event loop section alone helped me answer 5 questions confidently. Best money I ever spent!",
        rating: 5
      },
      {
        name: "Meera Joshi",
        role: "Full Stack Developer",
        company: "Swiggy",
        text: "Visual diagrams for async programming and middleware flow made complex concepts crystal clear. Cracked my interview in first attempt!",
        rating: 5
      },
      {
        name: "Sandeep Rao",
        role: "Senior Backend Developer",
        company: "PhonePe",
        text: "MongoDB and authentication sections are gold. The scenario-based questions prepared me for real-world problem solving rounds perfectly.",
        rating: 5
      },
      {
        name: "Priya Malhotra",
        role: "Node.js Developer",
        company: "Razorpay",
        text: "From 6 LPA to 18 LPA! The Express middleware and REST API sections gave me confidence to discuss architecture decisions in interviews.",
        rating: 5
      }
    ],
    faqs: [
      {
        question: "Is this suitable for beginners or experienced developers?",
        answer: "Perfect for both! Beginners will learn from basics (what is Node.js) to advanced concepts. Experienced developers (1-5 years) will benefit from the real interview questions, scenario-based problems, and production deployment strategies."
      },
      {
        question: "Are these real interview questions from top companies?",
        answer: "Yes! All the questions are collected from actual interviews at Amazon, Microsoft, Google, Swiggy, Zomato, PhonePe, Razorpay, and other top product companies. Each question includes detailed explanations with code examples."
      },
      {
        question: "How is this different from free YouTube tutorials?",
        answer: "Free resources are scattered and incomplete. This kit provides: (1) Structured learning path with multiple organized modules, (2) Curated interview questions you won't find together anywhere, (3) Visual diagrams explaining complex concepts, (4) Production-ready code examples, and (5) Scenario-based questions that test real problem-solving skills."
      },
      {
        question: "Do I get MongoDB and Express content too?",
        answer: "Absolutely! The kit includes chapters on Express.js (middleware, routing, error handling), chapters on MongoDB & Mongoose (schemas, queries, indexes), plus REST API development, authentication, testing, and deployment."
      },
      {
        question: "Will I get updates when new questions are added?",
        answer: "Yes! All updates are completely free for life. We update the content monthly based on latest interview trends and feedback from students who recently gave interviews."
      },
      {
        question: "How long will it take to complete?",
        answer: "Most students complete in 3-4 weeks studying 2-3 hours daily. However, you have lifetime access, so you can learn at your own pace and use it as a reference before interviews."
      }
    ],
    bonuses: [
      {
        icon: <Gift className="w-5 h-5" />,
        title: "Quick Revision Sheets",
        value: "₹1499",
        description: "One-page cheat sheets for last-minute prep covering all 25 modules"
      },
      {
        icon: <Video className="w-5 h-5" />,
        title: "Deployment Guide",
        value: "₹1999",
        description: "Complete guide: Local to Production with Docker, PM2, AWS EC2 & Nginx"
      },
      {
        icon: <Trophy className="w-5 h-5" />,
        title: "Resume Templates",
        value: "₹999",
        description: "ATS-optimized resume templates specifically for Node.js developers"
      }
    ]
  }
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const kitId = params.kit as string

  const [kit, setKit] = useState<KitDetails | null>(null)
  const [selectedTestimonial, setSelectedTestimonial] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [mobileCheckoutOpen, setMobileCheckoutOpen] = useState(false)

  const bonusesSum = useMemo(() => {
    return kit?.bonuses?.reduce((acc, b) => acc + parseCurrencyValue(b.value), 0) || 0
  }, [kit?.bonuses])

  const totalValue = useMemo(() => {
    return (kit?.originalPrice || 0) + bonusesSum
  }, [kit?.originalPrice, bonusesSum])

  const savings = useMemo(() => {
    return totalValue - (kit?.price || 0)
  }, [totalValue, kit?.price])

  useEffect(() => {
    if (!kitId || !kitsData[kitId]) {
      router.replace('/')
      return
    }
    setKit(kitsData[kitId])
  }, [kitId, router])

  useEffect(() => {
    if (!kit || !kit.testimonials || kit.testimonials.length === 0) {
      setSelectedTestimonial(0)
      return
    }

    setSelectedTestimonial(0)
    const interval = setInterval(() => {
      setSelectedTestimonial(prev => {
        const len = kit.testimonials.length || 1
        return (prev + 1) % len
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [kit?.id])

  if (!kit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50/50 to-white pt-12 lg:pt-8 overflow-x-hidden">
      <SiteHeader />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 md:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 md:mb-6 overflow-x-auto">
          <Link href="/" className="hover:text-primary flex items-center gap-1 flex-shrink-0">
            <ArrowLeft className="w-3 h-3" />
            Home
          </Link>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <span className="flex-shrink-0">Checkout</span>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <span className="text-foreground font-medium truncate">{kit.name}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8 min-w-0">
            {/* Hero Section - IMPROVED MOBILE */}
            <Card className={`p-4 md:p-6 bg-gradient-to-br ${kit.bgGradient || "from-green-50 to-white"} border-0 overflow-hidden`}>
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-5">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${kit.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                  {kit.id === "nodejs" ? <NodeIcon size={42} /> : kit.icon}
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-start gap-2 mb-1">
                    <h1 className="text-lg md:text-2xl font-bold leading-tight break-words">{kit.name}</h1>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-2 break-words">{kit.tagline}</p>

                  {/* Trust micro-row - IMPROVED WRAPPING */}
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm">
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold">{kit.students.toLocaleString()}</span>
                      <span className="text-muted-foreground">students</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{kit.rating}</span>
                      {/* <span className="text-muted-foreground">({kit.reviews})</span> */}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* <Clock className="w-4 h-4 text-green-500" /> */}
                      {/* <span className="text-green-600 font-medium text-xs">{kit.lastUpdated}</span> */}
                    </div>
                  </div>
                </div>
              </div>

              {/* Node hero sub-row - IMPROVED WRAPPING */}
              {kit.id === "nodejs" && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2 bg-white/60 px-2 py-1 rounded-md shadow-sm">
                    <Shield className="w-4 h-4 text-green-700 flex-shrink-0" />
                    <span className="whitespace-nowrap">Complete Backend ( NodeJS ) Roadmap</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/60 px-2 py-1 rounded-md shadow-sm">
                    <Target className="w-4 h-4 text-green-700 flex-shrink-0" />
                    <span className="whitespace-nowrap">Interview-focused questions and patterns</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/60 px-2 py-1 rounded-md shadow-sm">
                    <Rocket className="w-4 h-4 text-green-700 flex-shrink-0" />
                    <span className="whitespace-nowrap">200+ Interview Questions Ebook ( The Real Gem )</span>
                  </div>
                </div>
              )}
            </Card>

            {/* What You'll Get - IMPROVED MOBILE */}
            <Card className="p-4 md:p-6 overflow-hidden">
              <h2 className="text-base md:text-lg font-bold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                What You'll Get
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {kit.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-gray-100 shadow-sm transition-colors min-w-0">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${kit.color} flex items-center justify-center text-white flex-shrink-0`}>
                      {feature.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-0.5 text-sm break-words">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground break-words">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Curriculum - IMPROVED MOBILE */}
            <Card className="p-4 md:p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-3 gap-2">
                <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  Curriculum
                </h2>
                <Badge variant="secondary" className="text-xs flex-shrink-0">Structured · Project-based</Badge>
              </div>
              <div className="space-y-3">
                {kit.curriculum.map((module, idx) => (
                  <div key={idx} className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <h3 className="font-semibold text-sm break-words flex-1">{module.module}</h3>
                      {/* <Badge variant="secondary" className="text-xs flex-shrink-0">{module.hours} hrs</Badge> */}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {module.topics.map((topic, tidx) => (
                        <Badge key={tidx} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Testimonials - IMPROVED MOBILE */}
            <Card className="p-4 md:p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-3 gap-2">
                <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-green-500 flex-shrink-0" />
                  Success Stories
                </h2>
                <Badge variant="secondary" className="text-xs flex-shrink-0">{kit.reviews} reviews</Badge>
              </div>

              <div className="space-y-3" role="list" aria-roledescription="carousel">
                {kit.testimonials.map((testimonial, idx) => (
                  <div
                    key={idx}
                    role="listitem"
                    aria-hidden={selectedTestimonial !== idx}
                    className={`p-3 rounded-lg border transition-all cursor-pointer focus:outline-none flex gap-3 items-start min-w-0 ${
                      selectedTestimonial === idx ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTestimonial(idx)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelectedTestimonial(idx)
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-white flex-shrink-0">
                      <span className="font-semibold text-green-700">{testimonial.name.split(' ').map(n => n[0]).slice(0,2).join('')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm break-words">{testimonial.name}</p>
                          <p className="text-xs text-muted-foreground break-words">{testimonial.role} • {testimonial.company}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            ))}
                          </div>
                          <Badge className={`bg-gradient-to-r ${kit.color} text-white border-0 text-xs flex-shrink-0`}>Verified</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 italic break-words">"{testimonial.text}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* FAQs - IMPROVED MOBILE */}
            <Card className="p-4 md:p-6 overflow-hidden">
              <h2 className="text-base md:text-lg font-bold mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                FAQ
              </h2>
              <div className="space-y-2">
                {kit.faqs.map((faq, idx) => (
                  <div key={idx} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      aria-expanded={openFaq === idx}
                      aria-controls={`faq-panel-${idx}`}
                      className="w-full p-3 text-left flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors min-w-0"
                    >
                      <span className="font-medium text-sm break-words flex-1">{faq.question}</span>
                      <ChevronRight className={`w-4 h-4 transition-transform flex-shrink-0 ${openFaq === idx ? 'rotate-90' : ''}`} />
                    </button>
                    {openFaq === idx && (
                      <div id={`faq-panel-${idx}`} role="region" aria-hidden={openFaq !== idx} className="p-3 pt-0 text-sm text-muted-foreground break-words">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column - Sticky Checkout Card (desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-32">
              <Card className="p-4 md:p-6 border-2 shadow-lg overflow-hidden">
                {/* Price Section */}
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground mb-1">Special Launch Price</p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl md:text-4xl font-bold">₹{kit.price}</span>
                    <div className="text-left">
                      <p className="text-sm line-through text-muted-foreground">₹{kit.originalPrice}</p>
                      <Badge className="bg-green-600 text-white text-sm">{kit.discount}% OFF</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-green-600 font-medium mt-2">
                    You save ₹{kit.originalPrice - kit.price} today!
                  </p>
                </div>

                <Separator className="my-4" />

                {/* What's Included */}
                <div className="space-y-2 mb-4 text-sm">
                  <p className="font-semibold text-sm">Instant Access To:</p>
                  {kit.included.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="text-green-500 flex-shrink-0">{item.icon}</div>
                        <span className="truncate">{item.text}</span>
                      </div>
                      {item.value && (
                        <span className="text-muted-foreground font-medium text-xs flex-shrink-0">{item.value}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Bonuses */}
                {kit.bonuses && kit.bonuses.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-2 mb-4">
                      <p className="font-semibold text-sm flex items-center gap-2">
                        <Gift className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        FREE Bonuses (Worth ₹{kit.bonuses.reduce((acc, b) => acc + parseCurrencyValue(b.value), 0).toLocaleString()})
                      </p>
                      {kit.bonuses.map((bonus, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-purple-50 border border-purple-200">
                          <div className="flex items-start gap-2 min-w-0">
                            <div className="text-purple-500 flex-shrink-0">{bonus.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-medium text-sm break-words flex-1">{bonus.title}</p>
                                <Badge variant="secondary" className="text-xs flex-shrink-0">
                                  {bonus.value}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 break-words">{bonus.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <Separator className="my-4" />

                {/* Total Value */}
                <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Total Value:</span>
                    <span className="font-semibold line-through text-muted-foreground text-sm">₹{totalValue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">You Pay Today:</span>
                    <span className="text-xl font-bold text-green-600">₹{kit.price}</span>
                  </div>
                </div>

                {/* CTA Button */}
                <PaymentButton
                  amount={kit.price}
                  originalAmount={kit.originalPrice}
                  planName={kit.name}
                  buttonText="🔥 Get Instant Access Now"
                  className="w-full h-12 md:h-14 text-base font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md"
                />

                {/* Trust Badges */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-center gap-6 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Secure</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      <span>SSL</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      <span>Cards/UPI</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-yellow-50 border border-yellow-200 text-center">
                    <p className="text-xs">
                      <span className="font-semibold">⚡ {Math.max(8, Math.floor(kit.students / 25))}</span> people viewing
                    </p>
                  </div>

                  {/* <div className="text-center">
                    <p className="text-xs text-muted-foreground break-words">
                      Questions? Contact{' '}
                      <a href="https://wa.me/919166011247" className="text-primary underline">WhatsApp</a>
                    </p>
                  </div> */}
                </div>
              </Card>

              {/* 30 Day Guarantee */}
              <Card className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm mb-1">30-Day Money Back</p>
                    <p className="text-xs text-muted-foreground">
                      Full refund if not satisfied.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Mobile Checkout Card - IMPROVED */}
          <div className="lg:hidden">
            <div className="sticky bottom-20 z-40">
              <div className="mx-3 rounded-lg shadow-lg overflow-hidden">
                <div className="bg-white p-2 flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-md bg-gradient-to-br ${kit.color} flex items-center justify-center text-white flex-shrink-0`}>
                      {kit.id === "nodejs" ? <NodeIcon size={28} /> : kit.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Today's Price</p>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-base font-bold">₹{kit.price}</span>
                        <span className="text-xs line-through text-muted-foreground">₹{kit.originalPrice}</span>
                        <Badge className="bg-green-600 text-white text-xs">{kit.discount}%</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setMobileCheckoutOpen(!mobileCheckoutOpen)}
                      aria-expanded={mobileCheckoutOpen}
                      aria-controls="mobile-checkout-panel"
                      className="p-2 rounded-md bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-offset-1 focus:ring-primary"
                      aria-label={mobileCheckoutOpen ? "Close checkout" : "Open checkout"}
                    >
                      {mobileCheckoutOpen ? <X className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4 transform rotate-180" />}
                    </button>
                    <div className="w-20">
                      <PaymentButton
                        amount={kit.price}
                        originalAmount={kit.originalPrice}
                        planName={kit.name}
                        buttonText="Buy"
                        className="w-full h-10 text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                {mobileCheckoutOpen && (
                  <div id="mobile-checkout-panel" className="bg-white p-3 border-t">
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Total Value</span>
                        <span className="line-through text-muted-foreground text-xs">₹{totalValue.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-base font-semibold">
                        <span>You Pay</span>
                        <span>₹{kit.price}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">You save ₹{savings.toLocaleString()}</p>
                    </div>

                    <div className="space-y-1 mb-2">
                      {kit.included.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm gap-2 min-w-0">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="text-green-500 flex-shrink-0">{item.icon}</div>
                            <span className="truncate">{item.text}</span>
                          </div>
                          {item.value && (
                            <span className="text-muted-foreground font-medium text-xs flex-shrink-0">{item.value}</span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mb-2">
                      <PaymentButton
                        amount={kit.price}
                        originalAmount={kit.originalPrice}
                        planName={kit.name}
                        buttonText="Get Instant Access Now"
                        className="w-full h-10 text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600"
                      />
                    </div>

                    <div className="text-center text-xs text-muted-foreground">
                      <p>Secure payment • 30-day refund • Instant access</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Trust Section */}
        <div className="mt-10 py-6 border-t">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold text-sm">Instant Download</p>
                <p className="text-xs text-muted-foreground mt-1">Get access in 2 minutes</p>
              </div>
              <div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <RefreshCw className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold text-sm">Lifetime Updates</p>
                <p className="text-xs text-muted-foreground mt-1">Always current</p>
              </div>
              <div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold text-sm">{(kit.students + 5892).toLocaleString()}+ Students</p>
                <p className="text-xs text-muted-foreground mt-1">Join our community</p>
              </div>
              <div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <HeartHandshake className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold text-sm">24/7 Support</p>
                <p className="text-xs text-muted-foreground mt-1">We're here to help</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />

      {/* Sticky Bottom CTA - IMPROVED */}
      <div className="fixed left-0 right-0 bottom-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 py-3 px-3 sm:px-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className={`w-10 h-10 rounded-md bg-gradient-to-br ${kit.color} flex items-center justify-center text-white flex-shrink-0`}>
              {kit.id === "nodejs" ? <NodeIcon size={24} /> : kit.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">You pay</p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-bold">₹{kit.price}</span>
                <span className="text-xs line-through text-muted-foreground">₹{kit.originalPrice}</span>
              </div>
              <p className="text-xs text-green-600 font-medium truncate">{kit.discount}% OFF • Save ₹{kit.originalPrice - kit.price}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <PaymentButton
              amount={kit.price}
              originalAmount={kit.originalPrice}
              planName={kit.name}
              buttonText={`Buy Now • ₹${kit.price}`}
              className="h-10 sm:h-12 px-3 sm:px-6 text-xs sm:text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 shadow-md whitespace-nowrap"
            />
          </div>
        </div>
      </div>
    </main>
  )
}
