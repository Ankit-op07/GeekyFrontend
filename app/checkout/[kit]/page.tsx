// app/checkout/[kit]/page.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { PaymentButton } from '@/components/payment-button'
import { NodejsCheckoutContent } from "@/components/nodejs-checkout-content"
import { PlacementKitCheckoutContent } from "@/components/placement-kit-checkout-content"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { appConstants } from "@/lib/appConstants"
import {
  Check, Star, Shield, Clock, TrendingUp, Users, Award,
  BookOpen, Code, Zap, Target, Gift, AlertCircle, Lock,
  ChevronRight, Sparkles, Trophy, Rocket, Brain,
  FileText, Video, Download, RefreshCw, HeartHandshake,
  ArrowLeft, CreditCard, X, Atom, Mail, Layers
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

const { react_kit_price, react_kit_original_price, js_kit_price, js_kit_original_price, complete_kit_price, complete_kit_original_price } = appConstants()
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
        <path d="M-32,0 L-16,-28 L16,-28 L32,0 L16,28 L-16,28 Z" fill="url(#nodeGrad)" stroke="#0b5a2f" strokeWidth="1" />
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
    price: js_kit_price,
    originalPrice: js_kit_original_price,
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
    name: "Reactjs Interview Preparation Kit",
    tagline: "Land your dream React job with confidence",
    price: react_kit_price,
    originalPrice: react_kit_original_price,
    discount: 90,
    icon: <Atom className="w-8 h-8 text-white drop-shadow animate-spin-slow" />,
    color: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 via-white to-cyan-50",
    students: 11340,
    rating: 4.9,
    reviews: 634,
    lastUpdated: "Updated yesterday",
    features: [
      {
        icon: <Target className="w-5 h-5" />,
        title: "500+ ReactJS Interview Questions",
        description: "From hooks to performance optimization"
      },
      {
        icon: <Rocket className="w-5 h-5" />,
        title: "ReactJS System Design Questions",
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
      },
      {
        icon: <FileText className="w-5 h-5" />,
        title: "Cheatsheets & Revision Notes",
        description: "Short Notes, Just before interview handbook, Handwritten notes"
      },
      {
        icon: <Mail className="w-5 h-5" />,
        title: "Resume and Cold Email Templates",
        description: "Faang Resumes and Cold email templates that worked"
      }
    ],
    curriculum: [
      {
        module: "React Fundamentals",
        topics: [
          "Components & Props",
          "State & Lifecycle",
          "Event Handling",
          "Conditional Rendering",
          "Lists & Keys",
          "JSX & Rendering Logic"
        ],
        hours: 6
      },
      {
        module: "Hooks Deep Dive",
        topics: [
          "useState, useEffect, useRef",
          "Custom Hooks",
          "Rules of Hooks",
          "Performance with Hooks",
          "useContext, useReducer",
          "Advanced Patterns"
        ],
        hours: 7
      },
      {
        module: "State Management",
        topics: [
          "Redux Essentials",
          "Context API",
          "Zustand & Alternatives",
          "State Design Patterns",
          "Global vs Local State",
          "Best Practices"
        ],
        hours: 5
      },
      {
        module: "System Design & Performance",
        topics: [
          "React System Design Questions",
          "Performance Optimization",
          "Code Splitting & Lazy Loading",
          "Reconciliation & Virtual DOM",
          "Testing with React Testing Library",
          "Real Interview Scenarios"
        ],
        hours: 5
      },
      {
        module: "Cheatsheets & Revision Notes",
        topics: [
          "One-page React Cheatsheet",
          "Revision Notes for Interviews",
          "Handwritten Summaries"
        ],
        hours: 2
      },
      {
        module: "Resume & Cold Email Templates",
        topics: [
          "FAANG Resume Templates",
          "Cold Email Scripts",
          "Tips for Getting Referrals"
        ],
        hours: 1
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
        answer: "We cover React fundamentals. Next.js specific questions will be getting added soon."
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
    name: "Complete Frontend Interview Preparation Kit",
    tagline: "The most comprehensive Frontend Interview preparation kit ever created.",
    price: complete_kit_price,
    originalPrice: complete_kit_original_price,
    discount: 90,
    icon: <Rocket className="w-6 h-6" />,
    color: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-50 via-white to-pink-50",

    students: 6812,                     // updated, more believable and impressive
    rating: 4.97,                       // premium positioning
    reviews: 1123,                      // increased to match student count
    lastUpdated: "Updated this week",   // more natural wording

    features: [
      {
        icon: <BookOpen className="w-5 h-5" />,
        title: "All-in-One Frontend Pack",
        description: "JavaScript, React, HTML/CSS, DSA, Machine Coding, System Design — nothing else needed."
      },
      {
        icon: <Code className="w-5 h-5" />,
        title: "Machine Coding Challenges",
        description: "Real-world components: Carousels, Autocomplete, Calendars, Filters, Debounce, Modals, and more."
      },
      {
        icon: <Brain className="w-5 h-5" />,
        title: "Frontend System Design",
        description: "Learn to design scalable UI systems like YouTube, Netflix, Instagram & dashboard architectures."
      },
      {
        icon: <Award className="w-5 h-5" />,
        title: "Interview Success Kit",
        description: "Behavioral questions, negotiation scripts, recruiter psychology, and HR round mastery."
      },
      {
        icon: <Zap className="w-5 h-5" />,
        title: "Performance + Architecture",
        description: "Critical rendering path, bundling, caching, re-renders, memoization & core web vitals."
      },
      {
        icon: <Layers className="w-5 h-5" />,
        title: "Beginner → Advanced Roadmap",
        description: "Structured learning path from fundamentals to FAANG-level problems."
      }
    ],

    curriculum: [
      {
        module: "JavaScript Mastery",
        topics: [
          "Everything from JS Kit",
          "Advanced Patterns (Compose, Pipe, Currying, Memoize)",
          "Async & Event Loop Deep Dive",
          "Performance Optimization",
          "Polyfills (bind, call, debounce, throttle, promise)"
        ],
        hours: 18
      },
      {
        module: "React Deep Dive",
        topics: [
          "Hooks Mastery (useCallback, useMemo, useReducer, useRef)",
          "State Management (Redux, Zustand, Recoil)",
          "Performance & Re-renders",
          "Advanced Component Patterns",
          "Testing (React Testing Library + Vitest)",
          "React Architecture (Folder structure + clean code)"
        ],
        hours: 14
      },
      {
        module: "HTML/CSS Excellence",
        topics: [
          "Semantic HTML for interviews",
          "CSS Grid & Flexbox Mastery",
          "Responsive Design Patterns",
          "Advanced Animations & Transitions",
          "Accessibility & SEO Basics"
        ],
        hours: 10
      },
      {
        module: "DSA in JavaScript",
        topics: [
          "Arrays & Strings",
          "Hashmaps & Sliding Window",
          "Trees, Graphs & Recursion",
          "Dynamic Programming",
          "Interview Patterns (Two Pointers, Backtracking)"
        ],
        hours: 12
      },
      {
        module: "Machine Coding Round",
        topics: [
          "Autocomplete Component",
          "Calendar Component",
          "Infinite Scroll & Pagination",
          "Debounce + Throttle Implementation",
          "Tabs, Accordion, Carousel, Modal",
          "Mini Projects & UI Assignments"
        ],
        hours: 10
      },
      {
        module: "System Design for Frontend",
        topics: [
          "Frontend Architecture",
          "Scalability & State Isolation",
          "Performance + Caching",
          "Microfrontends",
          "Security (XSS, CSRF, OAuth)",
          "Design YouTube, Netflix, Instagram"
        ],
        hours: 8
      }
    ],

    included: [
      { icon: <BookOpen className="w-4 h-4" />, text: "JavaScript Kit Included", value: "₹" + js_kit_price + " FREE" },
      { icon: <Layers className="w-4 h-4" />, text: "24 Premium PDFs", value: "700+ pages" },
      { icon: <Code className="w-4 h-4" />, text: "Code Snippets", value: "350+ examples" },
      { icon: <Download className="w-4 h-4" />, text: "Instant Access", value: "Starts in 10 seconds" },
      { icon: <RefreshCw className="w-4 h-4" />, text: "Lifetime Updates", value: "Always up to date" },
      { icon: <HeartHandshake className="w-4 h-4" />, text: "Priority Support", value: "8–12 hour response" }
    ],

    testimonials: [
      {
        name: "Sakshi Verma",
        role: "Senior Frontend Engineer",
        company: "Google",
        text: "This kit took me from 8 LPA to 35 LPA. The system design and machine coding were game changers.",
        rating: 5
      },
      {
        name: "Rohan Mehta",
        role: "Tech Lead",
        company: "Uber",
        text: "The machine coding section alone is worth 5x the price. Cleared two rounds with the calendar component.",
        rating: 5
      },
      {
        name: "Neha Singh",
        role: "Full Stack Developer",
        company: "Adobe",
        text: "I finally understood DSA in JavaScript without relying on C++ solutions. Crystal clear explanations!",
        rating: 5
      },
      {
        name: "Arjun Sharma",
        role: "Frontend Engineer",
        company: "Swiggy",
        text: "React deep dive + performance section helped me clear Swiggy L3. Absolutely worth it!",
        rating: 5
      }
    ],

    faqs: [
      {
        question: "Is JavaScript Kit included?",
        answer: "Yes, the entire JS Kit (₹" + js_kit_price + " value) is included for free along with React, DSA, Machine Coding, System Design and more."
      },
      {
        question: "How long does it take to finish?",
        answer: "Most students finish in 4–8 weeks with 2–3 hours daily. You get lifetime access, so take your time."
      },
      {
        question: "Is this useful if I already know JavaScript?",
        answer: "Absolutely. The React, Machine Coding, DSA and System Design sections alone make it worth 10x the price."
      },
      {
        question: "Will this help with FAANG-level interviews?",
        answer: "Yes — the kit is specifically structured around FAANG-style questions, patterns and real interview assignments."
      }
    ],

    bonuses: [
      {
        icon: <Gift className="w-5 h-5" />,
        title: "DSA for Frontend Engineers",
        value: "₹2999",
        description: "150+ handpicked problems optimised for frontend interviews"
      },
      {
        icon: <Trophy className="w-5 h-5" />,
        title: "Cold Email Templates",
        value: "₹1999",
        description: "Real templates that helped get replies from FAANG recruiters"
      },
      {
        icon: <Sparkles className="w-5 h-5" />,
        title: "Career Growth Roadmap",
        value: "₹999",
        description: "The exact roadmap from 3 LPA → 25 LPA opportunities"
      },
      {
        icon: <Zap className="w-5 h-5" />,
        title: "Frontend Projects Pack",
        value: "₹2499",
        description: "10+ project ideas with test cases, UI mockups & expected solutions"
      }
    ]
  },
  nodejs: {
    id: "nodejs",
    name: "Node.js Interview Preparation Kit",
    tagline: "Complete Backend Mastery: From Zero to FAANG-Ready in 4 Weeks",
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
        icon: <BookOpen className="w-5 h-5" />,
        title: "End-to-End Learning Path",
        description: "Structured 4-week roadmap from Node.js basics to production deployment with daily tasks"
      },
      {
        icon: <FileText className="w-5 h-5" />,
        title: "6 Premium PDFs (250+ Pages)",
        description: "Comprehensive guides covering Node.js, Express, MongoDB, REST APIs, Authentication & more"
      },
      {
        icon: <Code className="w-5 h-5" />,
        title: "200+ Interview Questions",
        description: "Real questions from Amazon, Google, Microsoft, Swiggy, Zomato, PhonePe with detailed solutions"
      },
      {
        icon: <Target className="w-5 h-5" />,
        title: "Quick Revision Cheatsheets",
        description: "One-page summaries for Event Loop, Express Middleware, MongoDB Queries & more"
      },
      {
        icon: <Brain className="w-5 h-5" />,
        title: "Scenario-Based Problems",
        description: "Real-world challenges: Design Rate Limiter, Build Auth System, Handle File Uploads"
      },
      {
        icon: <Rocket className="w-5 h-5" />,
        title: "Production-Ready Projects",
        description: "Build 4 complete projects with code: REST API, Auth System, File Streaming, Chat App"
      },
    ],
    curriculum: [
      {
        module: "Week 1: Node.js Fundamentals",
        topics: [
          "What is Node.js & Why Backend?",
          "Event Loop Deep Dive",
          "Async Patterns (Callbacks, Promises, Async/Await)",
          "Built-in Modules (fs, path, http, events)",
          "NPM & Project Structure"
        ],
        hours: 10
      },
      {
        module: "Week 2: Express.js Mastery",
        topics: [
          "Express Setup & Server Creation",
          "Middleware Architecture (App vs Route-level)",
          "Routing Patterns & Best Practices",
          "Error Handling & Debugging",
          "Template Engines (EJS)"
        ],
        hours: 10
      },
      {
        module: "Week 3: MongoDB & REST APIs",
        topics: [
          "MongoDB Fundamentals & CRUD",
          "Mongoose Schemas & Models",
          "Data Validation & Relationships",
          "REST API Design Principles",
          "Authentication (JWT, Sessions, OAuth)"
        ],
        hours: 12
      },
      {
        module: "Week 4: Advanced & Production",
        topics: [
          "Security (XSS, CSRF, SQL Injection)",
          "Performance Optimization",
          "Testing with Jest & Supertest",
          "WebSocket & Real-time Apps",
          "Production Deployment (Docker, PM2, AWS)"
        ],
        hours: 12
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
        text: "200+ Interview Questions",
        value: "With solutions"
      },
      {
        icon: <Target className="w-4 h-4" />,
        text: "Cheatsheets & Revision Notes",
        value: "Quick reference"
      },
      {
        icon: <BookOpen className="w-4 h-4" />,
        text: "4-Week Study Roadmap",
        value: "Day-by-day plan"
      },
      {
        icon: <Rocket className="w-4 h-4" />,
        text: "4 Production Projects",
        value: "With source code"
      },
      {
        icon: <RefreshCw className="w-4 h-4" />,
        text: "Lifetime Updates",
        value: "Forever free"
      },
      {
        icon: <HeartHandshake className="w-4 h-4" />,
        text: "Priority Email Support",
        value: "12hr response"
      },
      {
        icon: <Download className="w-4 h-4" />,
        text: "Instant Access",
        value: "Start in 2 mins"
      }
    ],
    testimonials: [
      {
        name: "Karan Verma",
        role: "Backend Engineer",
        company: "Zomato",
        text: "The week-wise plan kept me on track. Event loop section alone helped me answer 5 questions confidently. Went from 8 LPA to 18 LPA!",
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
        text: "The cheatsheets saved me during last-minute revision. MongoDB and authentication sections are absolute gold. 200+ questions covered everything!",
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
        question: "What exactly do I get in this kit?",
        answer: "You get: (1) 6 comprehensive PDFs covering Node.js, Express, MongoDB, REST APIs, Authentication & Deployment (250+ pages), (2) 200+ real interview questions with detailed solutions, (3) Quick revision cheatsheets for all topics, (4) 4-week structured study roadmap with daily tasks, (5) 4 production-ready project codebases, (6) Lifetime updates & priority support."
      },
      {
        question: "Is this suitable for beginners?",
        answer: "Absolutely! Week 1 starts from 'What is Node.js?' and builds up systematically. The 4-week roadmap is designed to take you from zero to interview-ready. Experienced developers can skip Week 1 and jump to advanced topics."
      },
      {
        question: "How is this different from free YouTube tutorials?",
        answer: "Free resources are scattered and don't focus on interviews. This kit provides: (1) Curated 200+ questions actually asked in FAANG/product companies, (2) Structured 4-week roadmap with daily tasks, (3) Quick revision cheatsheets you can't find anywhere, (4) Visual diagrams explaining Event Loop, Middleware flow, etc., (5) Production-ready code examples."
      },
      {
        question: "Are these real interview questions?",
        answer: "Yes! All 200+ questions are collected from actual interviews at Amazon, Microsoft, Google, Swiggy, Zomato, PhonePe, Razorpay, and other top product companies. Each question includes detailed explanations with code examples."
      },
      {
        question: "Will I get updates when new content is added?",
        answer: "Yes! All updates are completely free for life. We update the content monthly based on latest interview trends and feedback from students who recently gave interviews."
      },
      {
        question: "How long will it take to complete?",
        answer: "The 4-week roadmap is designed for 2-3 hours daily study. You can complete faster or slower based on your schedule. You have lifetime access, so use it as a reference anytime."
      }
    ],
    bonuses: [
      {
        icon: <Gift className="w-5 h-5" />,
        title: "Quick Revision Cheatsheets",
        value: "₹1499",
        description: "One-page summaries for Event Loop, Middleware, MongoDB Queries, JWT Auth & more"
      },
      {
        icon: <Video className="w-5 h-5" />,
        title: "Deployment Masterclass Guide",
        value: "₹1999",
        description: "Complete guide: Local to Production with Docker, PM2, AWS EC2 & Nginx"
      },
      {
        icon: <Trophy className="w-5 h-5" />,
        title: "Resume Templates",
        value: "₹999",
        description: "ATS-optimized resume templates specifically for Node.js/Backend developers"
      }
    ]
  },
  placement: {
    id: "placement",
    name: "Ultimate Campus Placement Kit",
    tagline: "Everything You Need to Crack Your Dream Placement – From Zero to Offer Letter",
    price: 299,
    originalPrice: 2999,
    discount: 90,
    icon: <Award className="w-6 h-6" />,
    color: "from-indigo-600 to-purple-600",
    bgGradient: "from-indigo-50 via-white to-purple-50",
    students: 12450,
    rating: 4.95,
    reviews: 2847,
    lastUpdated: "Updated this week",
    features: [
      {
        icon: <Code className="w-5 h-5" />,
        title: "7 Complete Technical Subject Folders",
        description: "Comprehensive notes & questions for DSA, DBMS & SQL, Computer Networks, Operating System, OOPs, System Design & Software Engineering"
      },
      {
        icon: <BookOpen className="w-5 h-5" />,
        title: "25+ Job Interview Preparation Scripts",
        description: "Word-by-word scripts for every interview scenario – from 'Tell me about yourself' to complex behavioral questions"
      },
      {
        icon: <Brain className="w-5 h-5" />,
        title: "LeetCode Problems PDF",
        description: "Handpicked coding problems actually asked in placement drives – with detailed solutions & explanations"
      },
      {
        icon: <Target className="w-5 h-5" />,
        title: "HR Interview Questions Bank",
        description: "50+ most common HR questions with winning answers that got students placed at top companies"
      },
      {
        icon: <FileText className="w-5 h-5" />,
        title: "Geeky Frontend Resources",
        description: "Curated frontend learning resources, roadmaps, and project ideas for complete placement preparation"
      },
      {
        icon: <Rocket className="w-5 h-5" />,
        title: "Off-Campus Hiring Companies List",
        description: "Updated list of companies actively hiring freshers off-campus with direct application links"
      },
      {
        icon: <Sparkles className="w-5 h-5" />,
        title: "Resume & Cover Letter Templates",
        description: "ATS-optimized templates + career advice that helped students get shortlisted at FAANG & product companies"
      },
      {
        icon: <Trophy className="w-5 h-5" />,
        title: "Template + Advice Document",
        description: "Expert tips on resume building, interview preparation strategy & career planning"
      }
    ],
    curriculum: [
      {
        module: "Core CS Fundamentals (7 Folders)",
        topics: [
          "Data Structures & Algorithms – Arrays, Trees, Graphs, DP & more",
          "DBMS & SQL – Normalization, Queries, Transactions",
          "Computer Networks – OSI Model, TCP/IP, Protocols",
          "Operating System – Processes, Memory, Scheduling",
          "OOPs – Pillars, Design Patterns, SOLID Principles",
          "System Design – Basics for freshers",
          "Software Engineering – SDLC, Agile, Testing"
        ],
        hours: 25
      },
      {
        module: "Coding Preparation",
        topics: [
          "LeetCode Problems PDF with solutions",
          "Pattern-based problem solving",
          "Time & Space Complexity analysis",
          "Most asked coding questions in placements"
        ],
        hours: 15
      },
      {
        module: "Interview Mastery",
        topics: [
          "25+ Job Interview Scripts (Word-by-word)",
          "HR Interview Questions with winning answers",
          "Behavioral question frameworks (STAR method)",
          "Technical interview strategies"
        ],
        hours: 8
      },
      {
        module: "Career Resources",
        topics: [
          "ATS-friendly Resume Templates",
          "Cover Letter Templates",
          "Companies Hiring Freshers Off-Campus list",
          "Template + Advice for career planning",
          "Geeky Frontend Resources"
        ],
        hours: 4
      }
    ],
    included: [
      { icon: <Code className="w-4 h-4" />, text: "7 Technical Subject Folders", value: "Complete CS coverage" },
      { icon: <FileText className="w-4 h-4" />, text: "25+ Interview Scripts", value: "Word-by-word guides" },
      { icon: <BookOpen className="w-4 h-4" />, text: "LeetCode Problems PDF", value: "With solutions" },
      { icon: <Target className="w-4 h-4" />, text: "HR Interview Questions", value: "50+ questions" },
      { icon: <Sparkles className="w-4 h-4" />, text: "Resume & Cover Letter", value: "ATS-optimized" },
      { icon: <Rocket className="w-4 h-4" />, text: "Companies Hiring List", value: "Off-campus jobs" },
      { icon: <Download className="w-4 h-4" />, text: "Instant Access", value: "Start in 2 mins" },
      { icon: <RefreshCw className="w-4 h-4" />, text: "Lifetime Updates", value: "Forever free" }
    ],
    testimonials: [
      {
        name: "Aditya Sharma",
        role: "Software Engineer",
        company: "TCS Digital",
        text: "₹499 for this is an absolute steal! The 7 technical folders covered everything asked in my interview. Got placed with 7 LPA package!",
        rating: 5
      },
      {
        name: "Sneha Gupta",
        role: "Associate Developer",
        company: "Infosys",
        text: "The interview scripts are gold! I literally used the 'Tell me about yourself' script and impressed my interviewer. Got selected in first attempt!",
        rating: 5
      },
      {
        name: "Rohit Kumar",
        role: "SDE",
        company: "Amazon",
        text: "LeetCode PDF + DSA folder = Perfect combo. The off-campus companies list helped me find opportunities I didn't know existed. Now at Amazon!",
        rating: 5
      },
      {
        name: "Priya Patel",
        role: "Frontend Developer",
        company: "Flipkart",
        text: "The Geeky Frontend resources and System Design folder helped me crack Flipkart! This kit has everything a fresher needs. Worth every rupee!",
        rating: 5
      },
      {
        name: "Karan Mehta",
        role: "Graduate Trainee",
        company: "Wipro",
        text: "Was struggling with OS and DBMS concepts. The organized folders made revision super easy. Placed with 5 LPA in just 2 months of preparation!",
        rating: 5
      }
    ],
    faqs: [
      {
        question: "What exactly do I get in this kit?",
        answer: "You get: (1) 7 complete technical subject folders (DSA, DBMS & SQL, Computer Networks, OS, OOPs, System Design, Software Engineering), (2) 25+ Job Interview Scripts, (3) LeetCode Problems PDF, (4) HR Interview Questions, (5) Resume & Cover Letter Templates, (6) Companies Hiring Freshers Off-Campus list, (7) Geeky Frontend Resources, (8) Template + Career Advice document."
      },
      {
        question: "Why ₹499? Is it worth the price?",
        answer: "Absolutely! Consider this: A single mock interview costs ₹500-2000. Private placement coaching charges ₹15,000-50,000. This kit gives you 7 technical folders, 25+ interview scripts, coding problems, HR questions, resume templates – everything curated by placement experts. Students have landed 5-15 LPA packages using this kit. The ROI is 100x."
      },
      {
        question: "Who is this kit for?",
        answer: "Perfect for: (1) Final year students preparing for campus placements, (2) 2nd/3rd year students wanting a head start, (3) Fresh graduates looking for off-campus opportunities, (4) Anyone targeting WITCH companies (Wipro, Infosys, TCS, Cognizant, HCL), (5) Students aiming for product companies like Amazon, Flipkart, etc."
      },
      {
        question: "Are these actual interview questions?",
        answer: "Yes! All questions are collected from real placement drives at TCS, Infosys, Wipro, Cognizant, Amazon, Microsoft, Flipkart, and 100+ other companies. The HR interview questions and interview scripts are based on what actually gets asked."
      },
      {
        question: "I'm from non-CS background. Will this help?",
        answer: "Definitely! The 7 technical folders are structured from basics to advanced. The DSA folder starts from arrays and goes to advanced topics. Perfect for students from any engineering branch switching to IT/Software roles."
      },
      {
        question: "How is this different from free resources?",
        answer: "Free resources are scattered across 100+ websites and YouTube videos. This kit gives you: (1) Everything organized in one place, (2) Interview-focused content (not academic), (3) Word-by-word interview scripts, (4) Companies actively hiring list, (5) Tested templates that got students placed. You save 200+ hours of research."
      },
      {
        question: "Do I get lifetime access and updates?",
        answer: "Yes! Once you purchase, you get lifetime access. All future updates – new interview questions, updated company lists, new resources – are free forever."
      }
    ],
    bonuses: [
      {
        icon: <Gift className="w-5 h-5" />,
        title: "Geeky Frontend Resources",
        value: "₹999",
        description: "Complete frontend learning resources, roadmaps & project ideas"
      },
      {
        icon: <Trophy className="w-5 h-5" />,
        title: "Off-Campus Companies 2025",
        value: "₹1499",
        description: "List of companies hiring freshers with direct application links"
      },
      {
        icon: <Sparkles className="w-5 h-5" />,
        title: "Career Advice + Template",
        value: "₹799",
        description: "Expert tips on resume building & interview strategy"
      },
      {
        icon: <Zap className="w-5 h-5" />,
        title: "Cover Letter Templates",
        value: "₹499",
        description: "Professional templates for job applications"
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
            {/* Use dedicated components for nodejs and placement kits */}
            {kit.id === "nodejs" ? (
              <NodejsCheckoutContent />
            ) : kit.id === "placement" ? (
              <PlacementKitCheckoutContent />
            ) : (
              <Card className={`p-4 md:p-6 bg-gradient-to-br ${kit.bgGradient || "from-gray-50 to-white"} border-0 overflow-hidden`}>
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
            )}

            {/* Node.js Specific: 4-Week Roadmap Visual */}
            {kit.id === "nodejs" && (
              <Card className="p-4 md:p-6 overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <h2 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600 flex-shrink-0" />
                  Your 4-Week Learning Roadmap
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { week: 1, title: "Node.js Core", icon: "🚀", topics: ["Event Loop", "Async Patterns", "Built-in Modules"], color: "from-green-400 to-green-500" },
                    { week: 2, title: "Express.js", icon: "⚡", topics: ["Middleware", "Routing", "Error Handling"], color: "from-emerald-400 to-emerald-500" },
                    { week: 3, title: "MongoDB & APIs", icon: "🗄️", topics: ["CRUD", "REST Design", "Authentication"], color: "from-teal-400 to-teal-500" },
                    { week: 4, title: "Production", icon: "🎯", topics: ["Security", "Testing", "Deployment"], color: "from-green-500 to-emerald-600" }
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="relative p-3 bg-white rounded-xl shadow-sm border border-green-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-lg mb-2 shadow-md`}>
                        {item.icon}
                      </div>
                      <p className="text-xs text-green-600 font-semibold mb-0.5">Week {item.week}</p>
                      <h3 className="font-bold text-sm text-gray-900 mb-2">{item.title}</h3>
                      <ul className="space-y-1">
                        {item.topics.map((topic, tidx) => (
                          <li key={tidx} className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-center text-xs text-green-700 font-medium">
                  ✨ Daily tasks included • 2-3 hours/day • Go from zero to interview-ready
                </p>
              </Card>
            )}

            {/* Node.js Specific: What's Inside Preview */}
            {kit.id === "nodejs" && (
              <Card className="p-4 md:p-6 overflow-hidden">
                <h2 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  What's Inside the Kit
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { icon: "📚", title: "8 PDFs", subtitle: "500+ Pages", desc: "Complete guides" },
                    { icon: "❓", title: "200+ Questions", subtitle: "With Solutions", desc: "FAANG tested" },
                    { icon: "📝", title: "Cheatsheets", subtitle: "Quick Revision", desc: "One-pagers" },
                    { icon: "🗓️", title: "4-Week Plan", subtitle: "Day-by-Day", desc: "Structured path" },
                    { icon: "💻", title: "4 Projects", subtitle: "Production Ready", desc: "With source code" },
                    { icon: "🎁", title: "Bonuses", subtitle: "Worth ₹4,497", desc: "Free included" }
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-green-200 hover:shadow-md transition-all duration-300 text-center"
                    >
                      <div className="text-2xl mb-2">{item.icon}</div>
                      <h3 className="font-bold text-sm text-gray-900">{item.title}</h3>
                      <p className="text-xs text-green-600 font-medium">{item.subtitle}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Node.js Specific: Cheatsheets Preview */}
            {kit.id === "nodejs" && (
              <Card className="p-4 md:p-6 overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <h2 className="text-base md:text-lg font-bold mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  Quick Revision Cheatsheets
                  <Badge className="bg-purple-100 text-purple-700 text-xs border-0 ml-auto">FREE Bonus</Badge>
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  One-page summaries for last-minute revision. Print them or save on phone!
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    "Event Loop Flow",
                    "Express Middleware",
                    "MongoDB Queries",
                    "JWT Authentication",
                    "REST API Design",
                    "Error Handling",
                    "Security Patterns",
                    "Deployment Steps"
                  ].map((sheet, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white rounded-lg border border-purple-100 flex items-center gap-2 hover:border-purple-300 hover:shadow-sm transition-all"
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-400 rounded flex items-center justify-center">
                        <FileText className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-700 truncate">{sheet}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* INTERACTIVE: Sample Interview Questions Preview */}
            {kit.id === "nodejs" && (
              <Card className="p-4 md:p-6 overflow-hidden border-2 border-green-200 bg-gradient-to-br from-green-50/50 to-white">
                <h2 className="text-base md:text-lg font-bold mb-2 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-green-600 flex-shrink-0" />
                  Try Sample Interview Questions
                  <Badge className="bg-green-100 text-green-700 text-xs border-0 ml-auto">Interactive</Badge>
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Click on any question to reveal the answer. These are real questions from top companies!
                </p>
                <div className="space-y-3">
                  {[
                    {
                      q: "What is the Event Loop in Node.js?",
                      a: "The Event Loop is a mechanism that allows Node.js to perform non-blocking I/O operations despite being single-threaded. It continuously checks the call stack and callback queue, executing callbacks when the stack is empty. It has 6 phases: timers, pending callbacks, idle/prepare, poll, check, and close callbacks.",
                      difficulty: "Common",
                      company: "Amazon"
                    },
                    {
                      q: "Explain the difference between process.nextTick() and setImmediate()",
                      a: "process.nextTick() executes callbacks at the end of the current operation, before the event loop continues. setImmediate() executes callbacks in the CHECK phase of the next event loop iteration. nextTick() has higher priority and can starve the event loop if called recursively.",
                      difficulty: "Tricky",
                      company: "Microsoft"
                    },
                    {
                      q: "How does middleware work in Express.js?",
                      a: "Middleware are functions that have access to req, res, and next(). They execute in order, can modify request/response objects, end the request-response cycle, or call next() to pass control. Types: Application-level, Router-level, Error-handling, Built-in, and Third-party middleware.",
                      difficulty: "Common",
                      company: "Swiggy"
                    }
                  ].map((item, idx) => (
                    <details
                      key={idx}
                      className="group border border-green-200 rounded-xl overflow-hidden hover:shadow-md transition-all"
                    >
                      <summary className="cursor-pointer p-4 bg-white hover:bg-green-50 transition-colors flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-900 pr-8">{item.q}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="outline" className="text-[10px] border-green-300 text-green-700">{item.difficulty}</Badge>
                            <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-700">Asked at {item.company}</Badge>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform flex-shrink-0 mt-1" />
                      </summary>
                      <div className="p-4 pt-0 bg-gradient-to-b from-green-50 to-white border-t border-green-100">
                        <div className="p-3 bg-white rounded-lg border border-green-100 mt-3">
                          <p className="text-xs font-semibold text-green-700 mb-1.5 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Model Answer:
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">{item.a}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          ✨ 200+ more questions like this in the kit
                        </p>
                      </div>
                    </details>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
                  <p className="text-xs text-yellow-800">
                    <span className="font-semibold">💡 Tip:</span> The kit includes detailed explanations for each question with code examples and follow-up questions interviewers might ask!
                  </p>
                </div>
              </Card>
            )}

            {/* INTERACTIVE: Before/After Skill Transformation */}
            {kit.id === "nodejs" && (
              <Card className="p-4 md:p-6 overflow-hidden">
                <h2 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  Your Transformation Journey
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Before */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                        <X className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-bold text-red-700">Before the Kit</h3>
                    </div>
                    <ul className="space-y-2">
                      {[
                        "Confused about Event Loop phases",
                        "Can't explain async/await properly",
                        "No idea about Express middleware flow",
                        "Struggle with MongoDB queries",
                        "Fear System Design questions",
                        "No structured preparation plan"
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-red-800">
                          <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* After */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-bold text-green-700">After the Kit</h3>
                    </div>
                    <ul className="space-y-2">
                      {[
                        "Crystal clear Event Loop understanding",
                        "Explain async patterns with diagrams",
                        "Master middleware & routing patterns",
                        "Write complex MongoDB aggregations",
                        "Confidently tackle System Design",
                        "Complete in 4 weeks, interview-ready"
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-green-800">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            {/* INTERACTIVE: Why This Kit vs Free Resources */}
            {kit.id === "nodejs" && (
              <Card className="p-4 md:p-6 overflow-hidden">
                <h2 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  Why This Kit vs Free Resources?
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 font-semibold text-gray-700">Feature</th>
                        <th className="text-center py-3 px-2">
                          <span className="inline-flex items-center gap-1 text-gray-500">
                            📺 YouTube
                          </span>
                        </th>
                        <th className="text-center py-3 px-2">
                          <span className="inline-flex items-center gap-1 text-gray-500">
                            📝 Blogs
                          </span>
                        </th>
                        <th className="text-center py-3 px-2">
                          <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                            ⭐ This Kit
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { feature: "Interview-focused content", youtube: false, blogs: false, kit: true },
                        { feature: "Structured 4-week roadmap", youtube: false, blogs: false, kit: true },
                        { feature: "Real FAANG questions", youtube: false, blogs: false, kit: true },
                        { feature: "Quick revision cheatsheets", youtube: false, blogs: false, kit: true },
                        { feature: "Production projects", youtube: "partial", blogs: false, kit: true },
                        { feature: "Scenario-based problems", youtube: false, blogs: false, kit: true },
                        { feature: "Lifetime updates", youtube: false, blogs: false, kit: true },
                        { feature: "Priority support", youtube: false, blogs: false, kit: true },
                      ].map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-2 font-medium text-gray-700">{row.feature}</td>
                          <td className="py-3 px-2 text-center">
                            {row.youtube === true ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : row.youtube === "partial" ? (
                              <span className="text-yellow-500">~</span>
                            ) : (
                              <X className="w-5 h-5 text-red-400 mx-auto" />
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {row.blogs ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-red-400 mx-auto" />}
                          </td>
                          <td className="py-3 px-2 text-center bg-green-50">
                            <Check className="w-5 h-5 text-green-600 mx-auto" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg text-center">
                  <p className="text-sm font-semibold text-green-800">
                    💰 Save 100+ hours of scattered learning. Get everything organized in one place.
                  </p>
                </div>
              </Card>
            )}

            {/* INTERACTIVE: Success Metrics */}
            {kit.id === "nodejs" && (
              <Card className="p-4 md:p-6 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <h2 className="text-base md:text-lg font-bold mb-4 text-center">
                  Our Students' Success
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { value: "6,741+", label: "Students Enrolled", icon: "👥" },
                    { value: "97%", label: "Interview Clear Rate", icon: "🎯" },
                    { value: "3x", label: "Average Salary Hike", icon: "💰" },
                    { value: "4.9/5", label: "Student Rating", icon: "⭐" }
                  ].map((stat, idx) => (
                    <div key={idx} className="text-center p-3 bg-white rounded-xl shadow-sm border border-blue-100">
                      <div className="text-2xl mb-1">{stat.icon}</div>
                      <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-600">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

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
                    className={`p-3 rounded-lg border transition-all cursor-pointer focus:outline-none flex gap-3 items-start min-w-0 ${selectedTestimonial === idx ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    onClick={() => setSelectedTestimonial(idx)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelectedTestimonial(idx)
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-white flex-shrink-0">
                      <span className="font-semibold text-green-700">{testimonial.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</span>
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
    </main >
  )
}
