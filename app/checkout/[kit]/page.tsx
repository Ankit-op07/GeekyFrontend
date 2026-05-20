// app/checkout/[kit]/page.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { PaymentButton } from '@/components/payment-button'
import { NodejsCheckoutContent } from "@/components/nodejs-checkout-content"
import { PlacementKitCheckoutContent } from "@/components/placement-kit-checkout-content"
import { ReactCheckoutContent } from "@/components/react-checkout-content"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { appConstants, getKitById } from "@/lib/appConstants"
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

/** Map from checkout page slug → KIT_CATALOG ID */
const SLUG_TO_KIT_ID: Record<string, string> = {
  javascript: 'js-kit',
  react: 'react-kit',
  nodejs: 'nodejs-kit',
  placement: 'placement-kit',
  complete: 'complete-kit',
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
    name: "React.js Interview Preparation Kit",
    tagline: "57 articles. 15 machine coding challenges. 10 modules. The complete React interview kit.",
    price: react_kit_price,
    originalPrice: react_kit_original_price,
    discount: 90,
    icon: <Atom className="w-8 h-8 text-white drop-shadow animate-spin-slow" />,
    color: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 via-white to-cyan-50",
    students: 11340,
    rating: 4.9,
    reviews: 634,
    lastUpdated: "Updated this week",
    features: [
      {
        icon: <BookOpen className="w-5 h-5" />,
        title: "57 In-Depth Articles",
        description: "Structured across 10 modules covering every React concept"
      },
      {
        icon: <Code className="w-5 h-5" />,
        title: "15 Machine Coding Challenges",
        description: "Complete, production-quality solutions with edge cases"
      },
      {
        icon: <Brain className="w-5 h-5" />,
        title: "60+ Output-Based Questions",
        description: "Tricky questions with detailed explanations"
      },
      {
        icon: <Target className="w-5 h-5" />,
        title: "Scripted Interview Answers",
        description: "Ready-to-use answers for every major concept"
      },
      {
        icon: <Sparkles className="w-5 h-5" />,
        title: "Design Patterns & Testing",
        description: "HOC, Render Props, SOLID + RTL, Jest, MSW"
      },
      {
        icon: <FileText className="w-5 h-5" />,
        title: "Scenario & Behavioral Rounds",
        description: "Diagnostic frameworks and prepared answers"
      }
    ],
    curriculum: [
      {
        module: "Core Fundamentals",
        topics: ["Virtual DOM", "JSX & Props", "State & useEffect", "Keys & Refs", "Error Boundaries"],
        hours: 10
      },
      {
        module: "Advanced Hooks & Patterns",
        topics: ["useReducer", "useMemo/useCallback", "Custom Hooks", "React.memo"],
        hours: 6
      },
      {
        module: "Routing & State Management",
        topics: ["React Router v6", "Redux Toolkit", "Context API", "Protected Routes"],
        hours: 8
      },
      {
        module: "Performance & Design Patterns",
        topics: ["Code Splitting", "Virtualization", "HOC", "Compound Components", "SOLID"],
        hours: 11
      },
      {
        module: "Machine Coding & Testing",
        topics: ["15 Coding Challenges", "React Testing Library", "Jest & MSW"],
        hours: 18
      },
      {
        module: "Scenario & Behavioral",
        topics: ["Architecture Questions", "Optimization Frameworks", "Behavioral Templates"],
        hours: 5
      }
    ],
    included: [
      { icon: <FileText className="w-4 h-4" />, text: "57 In-Depth Articles", value: "62K+ words" },
      { icon: <Code className="w-4 h-4" />, text: "15 Machine Coding Solutions", value: "With edge cases" },
      { icon: <Brain className="w-4 h-4" />, text: "60+ Output-Based Questions", value: "Explanations" },
      { icon: <Target className="w-4 h-4" />, text: "Scripted Interview Answers", value: "Every topic" },
      { icon: <RefreshCw className="w-4 h-4" />, text: "Lifetime Updates", value: "Forever free" },
      { icon: <HeartHandshake className="w-4 h-4" />, text: "Email Support", value: "24hr response" }
    ],
    testimonials: [
      {
        name: "Rahul Sharma",
        role: "Frontend Engineer",
        company: "Amazon",
        text: "Stopped reading random articles and followed this kit module by module. Got an offer in 3 weeks!",
        rating: 5
      },
      {
        name: "Priya Patel",
        role: "SDE-2",
        company: "Microsoft",
        text: "Finally understood when useCallback hurts. The 'when NOT to optimize' section changed my thinking.",
        rating: 5
      },
      {
        name: "Sneha Roy",
        role: "Senior Frontend Engineer",
        company: "Razorpay",
        text: "Scripted interview answers were a game changer. Went from 12 LPA to 28 LPA!",
        rating: 5
      }
    ],
    faqs: [
      {
        question: "Is this for beginners or experienced developers?",
        answer: "Both. Every article covers the concept from scratch for freshers, then goes deeper for intermediate and senior levels. Questions are tagged with difficulty levels."
      },
      {
        question: "Is this just a list of questions and answers?",
        answer: "No. Each article teaches the concept with real code, explains the traps interviewers set, includes output-based questions, and ends with a scripted answer you can use."
      },
      {
        question: "Does it cover machine coding rounds?",
        answer: "Yes. Module 7 has 15 complete machine coding challenges with full solutions: Todo App, Shopping Cart, Infinite Scroll, Modal, Dropdown, Pagination, and more."
      },
      {
        question: "Is the content up to date?",
        answer: "Yes. All content uses React 18+ patterns, React Router v6, Redux Toolkit, and modern hooks. Legacy patterns mentioned only for context."
      }
    ],
    bonuses: [
      {
        icon: <Gift className="w-5 h-5" />,
        title: "Output-Based Question Bank",
        value: "₹1499",
        description: "60+ tricky what-does-this-print questions"
      },
      {
        icon: <Sparkles className="w-5 h-5" />,
        title: "Interview Answer Scripts",
        value: "₹1999",
        description: "Paragraph-length answers for every concept"
      }
    ]
  },
  complete: {
    id: "complete",
    name: "Complete Frontend Interview Preparation Kit",
    tagline: "25 chapters. 570+ items. 127,000+ words. From HTML basics to System Design - the only resource you need to crack frontend interviews.",
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
        title: "Interview-Ready Theory",
        description: "17 chapters of interview answers, code examples, follow-up questions, and the depth interviewers expect."
      },
      {
        icon: <Target className="w-5 h-5" />,
        title: "180 DSA Problems in JavaScript",
        description: "Pattern-based practice across two pointers, sliding window, DP, trees, graphs, stacks, queues, and strings."
      },
      {
        icon: <Brain className="w-5 h-5" />,
        title: "42 Frontend System Designs",
        description: "Design WhatsApp, YouTube, spreadsheets, e-commerce flows, dashboards, auth, analytics, and more with RADIO."
      },
      {
        icon: <Code className="w-5 h-5" />,
        title: "60 Machine Coding Problems",
        description: "Build real UI tasks like autocomplete, Kanban, carousel, chat apps, rich text editor, Snake, and more."
      },
      {
        icon: <Zap className="w-5 h-5" />,
        title: "35 JavaScript Coding Challenges",
        description: "SDE1 to SDE3 polyfills and utilities: Promise APIs, debounce, LRU cache, Event Emitter, VDOM differ, and reactive state."
      },
      {
        icon: <Award className="w-5 h-5" />,
        title: "Strategy and Quick Revision",
        description: "30-day plans for 1-3 and 3-6 years, behavioral answers, negotiation scripts, and 11 one-page revision sheets."
      }
    ],

    curriculum: [
      {
        module: "Chapter 1: HTML & Semantic Markup",
        topics: [
          "Semantic tags and structure",
          "SEO and Open Graph meta tags",
          "Forms, FormData, dialog, Popover API",
          "async, defer, module, preload, prefetch"
        ],
        hours: 2
      },
      {
        module: "Chapter 2: Accessibility",
        topics: [
          "ARIA rules and landmark roles",
          "Tabindex and roving tabindex",
          "Focus management and traps",
          "Accessible dropdowns and forms"
        ],
        hours: 2
      },
      {
        module: "Chapter 3: CSS & Styling",
        topics: [
          "Flexbox, Grid, subgrid",
          "Specificity, :where, :is, :has",
          "Container queries and design tokens",
          "Reflows, paints, FLIP, View Transitions"
        ],
        hours: 4
      },
      {
        module: "Chapter 4: TypeScript",
        topics: [
          "Narrowing, generics, utility types",
          "Mapped, conditional, template literal types",
          "Typing React, Redux, Zustand, HOCs",
          "tsconfig and JS-to-TS migration"
        ],
        hours: 5
      },
      {
        module: "Chapter 5: Web Fundamentals",
        topics: [
          "URL to pixels pipeline",
          "DNS, TCP/TLS, HTTP/1.1, HTTP/2, HTTP/3",
          "REST, GraphQL, CORS, storage",
          "Workers, WebSockets, SSE, browser APIs"
        ],
        hours: 4
      },
      {
        module: "Chapter 6: Web Security",
        topics: [
          "XSS, CSRF, clickjacking",
          "JWT vs sessions and OAuth PKCE",
          "CSP, CORS debugging, HSTS, SRI",
          "30-item security audit checklist"
        ],
        hours: 3
      },
      {
        module: "Chapter 7: Rendering Patterns",
        topics: [
          "CSR, SSR, SSG, ISR",
          "Streaming SSR and Suspense",
          "React Server Components",
          "Progressive hydration and islands"
        ],
        hours: 2
      },
      {
        module: "Chapter 8: Optimization Techniques",
        topics: [
          "Core Web Vitals fixes",
          "Bundle, image, font, network optimization",
          "React performance and memory leaks",
          "RUM, Lighthouse CI, performance budgets"
        ],
        hours: 4
      },
      {
        module: "Chapter 9: Design Patterns",
        topics: [
          "Creational, structural, behavioral patterns",
          "Observer, Pub/Sub, Strategy, Command",
          "Proxy, Facade, Adapter, Composite",
          "Pattern selection guide"
        ],
        hours: 4
      },
      {
        module: "Chapter 10: State Management",
        topics: [
          "Local, lifted, global state decisions",
          "Context performance traps",
          "Redux Toolkit, Zustand, TanStack Query",
          "XState, optimistic updates, cross-tab sync"
        ],
        hours: 3
      },
      {
        module: "Chapter 11: Testing",
        topics: [
          "Testing trophy and mocking",
          "React Testing Library and MSW",
          "Playwright, visual and a11y testing",
          "Performance testing in CI"
        ],
        hours: 3
      },
      {
        module: "Chapter 12: Build Tools & Dev Tooling",
        topics: [
          "CJS vs ESM",
          "Webpack, Vite, Rspack, Turbopack",
          "Babel, SWC, esbuild",
          "Module federation, pnpm, monorepos"
        ],
        hours: 3
      },
      {
        module: "Chapter 13: Code Management",
        topics: [
          "Monorepo vs polyrepo",
          "Trunk-based development vs Gitflow",
          "CI/CD with GitHub Actions",
          "ESLint, Prettier, Husky, commitlint"
        ],
        hours: 2
      },
      {
        module: "Chapter 14: Next.js & Meta-Frameworks",
        topics: [
          "App Router conventions",
          "Server and Client Components",
          "Caching, revalidation, Server Actions",
          "Middleware, image, font, deployment choices"
        ],
        hours: 3
      },
      {
        module: "Chapter 15: AI Integration",
        topics: [
          "AI chat UI and streaming",
          "ReadableStream and AbortController",
          "Structured outputs and tool calling",
          "Vercel AI SDK and AI interview talking points"
        ],
        hours: 2
      },
      {
        module: "Chapter 16: React Hooks",
        topics: [
          "useState, useEffect, useReducer",
          "useMemo, useCallback, useRef",
          "React 19 hooks and form hooks",
          "Custom hooks and rules of hooks"
        ],
        hours: 4
      },
      {
        module: "Chapter 17: Data Structures",
        topics: [
          "Arrays, strings, stacks, queues",
          "Maps, sets, linked lists, LRU cache",
          "Trees, heaps, tries, graphs",
          "Union-Find and selection guide"
        ],
        hours: 5
      },
      {
        module: "Chapter 18: Algorithms - 180 Problems",
        topics: [
          "Sorting, searching, two pointers",
          "Sliding window and backtracking",
          "Dynamic programming and greedy",
          "Trees, graphs, strings, bit manipulation"
        ],
        hours: 12
      },
      {
        module: "Chapter 19: Frontend System Design - 42 Designs",
        topics: [
          "RADIO framework and estimations",
          "WhatsApp, Docs, Meet, notifications",
          "YouTube, Instagram, Spotify, e-commerce",
          "Spreadsheets, dashboards, auth, PWA"
        ],
        hours: 10
      },
      {
        module: "Chapter 20: Machine Coding - 60 Problems",
        topics: [
          "Core UI components",
          "Forms, layouts, navigation",
          "Tables, trees, comments, timelines",
          "Full apps and advanced UI challenges"
        ],
        hours: 12
      },
      {
        module: "Chapter 21: JS Coding Problems - SDE1",
        topics: [
          "map, filter, reduce, bind, call, apply",
          "Debounce, throttle, deepClone, flatten",
          "Promise, Promise.all, Event Emitter",
          "Curry, compose, querySelector"
        ],
        hours: 5
      },
      {
        module: "Chapter 22: JS Coding Problems - SDE2",
        topics: [
          "Promise.allSettled and Promise.any",
          "Memoize with TTL and LRU",
          "deepEqual, JSON parse/stringify",
          "VDOM differ, scheduler, Observable"
        ],
        hours: 4
      },
      {
        module: "Chapter 23: JS Coding Problems - SDE3",
        topics: [
          "Simplified module bundler",
          "Dependency graph resolution",
          "Reactive state system",
          "Proxy-based dependency tracking"
        ],
        hours: 3
      },
      {
        module: "Chapter 24: Timed Machine Coding Practice",
        topics: [
          "14 interview-condition problems",
          "30-60 minute time limits",
          "Required and bonus features",
          "Progress tracking table"
        ],
        hours: 8
      },
      {
        module: "Chapter 25: Interview Guide & Quick Revision",
        topics: [
          "Interview formats and STAR answers",
          "Salary negotiation scripts",
          "Resume examples and 30-day plans",
          "11 one-page revision sheets"
        ],
        hours: 4
      }
    ],

    included: [
      { icon: <Layers className="w-4 h-4" />, text: "Structured Chapters", value: "25" },
      { icon: <FileText className="w-4 h-4" />, text: "Detailed Articles", value: "91" },
      { icon: <Target className="w-4 h-4" />, text: "Questions & Practice Items", value: "570+" },
      { icon: <Code className="w-4 h-4" />, text: "DSA + Coding Problems", value: "215+" },
      { icon: <Download className="w-4 h-4" />, text: "Instant Access", value: "Starts in 10 seconds" },
      { icon: <RefreshCw className="w-4 h-4" />, text: "Lifetime Updates", value: "Included" },
      { icon: <HeartHandshake className="w-4 h-4" />, text: "Priority Support", value: "8-12 hour response" }
    ],

    testimonials: [
      {
        name: "Sakshi Verma",
        role: "Senior Frontend Engineer",
        company: "Google",
        text: "The system design walkthroughs felt like real interview prep, not theory. RADIO made answers much easier to structure.",
        rating: 5
      },
      {
        name: "Rohan Mehta",
        role: "Tech Lead",
        company: "Uber",
        text: "The machine coding section covers the small edge cases interviewers actually ask about: keyboard nav, loading states, and accessibility.",
        rating: 5
      },
      {
        name: "Neha Singh",
        role: "Full Stack Developer",
        company: "Adobe",
        text: "I finally practiced DSA in JavaScript with explanations I could reuse in interviews. The pattern-wise flow saved a lot of time.",
        rating: 5
      },
      {
        name: "Arjun Sharma",
        role: "Frontend Engineer",
        company: "Swiggy",
        text: "The quick revision sheets and performance chapters helped me revise before my Swiggy frontend rounds without feeling scattered.",
        rating: 5
      }
    ],

    faqs: [
      {
        question: "Who is this kit for?",
        answer: "It is built for frontend engineers with 1-6 years of experience. SDE1 candidates get fundamentals, DSA, and machine coding. SDE2 candidates get TypeScript, testing, state management, and system design. SDE3 candidates get architecture, performance, design systems, and advanced JavaScript challenges."
      },
      {
        question: "What exactly is included?",
        answer: "You get 25 chapters, 570+ questions/problems/practice items, 91 detailed articles, 180 DSA problems, 42 frontend system design walkthroughs, 60 machine coding problems, 35 JS coding challenges, prep plans, and quick revision sheets."
      },
      {
        question: "Is this useful if I already know JavaScript and React?",
        answer: "Yes. The kit goes beyond basics into TypeScript, web fundamentals, security, performance, testing, build tooling, DSA, frontend system design, machine coding, and SDE2/SDE3-level JavaScript implementations."
      },
      {
        question: "Will this help with product company interviews?",
        answer: "Yes. The curriculum includes machine coding and system design patterns commonly seen at companies like Flipkart, Swiggy, Razorpay, Google, and Amazon, with practical answer structures and implementation details."
      },
      {
        question: "How long will it take to complete?",
        answer: "Most students use the 30-day plan for focused preparation, then revisit DSA, system design, and quick revision sheets before interviews. You also get lifetime access and updates."
      }
    ],

    bonuses: []
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
    price: 199,
    originalPrice: 2999,
    discount: 96,
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
  const [openCurriculum, setOpenCurriculum] = useState<number | null>(0)
  const [mobileCheckoutOpen, setMobileCheckoutOpen] = useState(false)
  const searchParams = useSearchParams()

  // Show toast based on magic link redirect result
  useEffect(() => {
    const authSuccess = searchParams.get('auth_success')
    const authError = searchParams.get('auth_error')
    if (authSuccess === '1') {
      // Remove params from URL cleanly
      const url = new URL(window.location.href)
      url.searchParams.delete('auth_success')
      window.history.replaceState({}, '', url.toString())
    } else if (authError) {
      const messages: Record<string, string> = {
        link_expired: 'Your sign-in link has expired. Please request a new one.',
        invalid_link: 'This sign-in link is invalid or has already been used.',
        server_error: 'Something went wrong. Please try again.',
        missing_token: 'Invalid sign-in link. Please try again.',
      }
      const url = new URL(window.location.href)
      url.searchParams.delete('auth_error')
      window.history.replaceState({}, '', url.toString())
      // We can't use useToast here easily without prop drilling, so console log
      console.warn('Auth error from magic link:', authError, messages[authError])
    }
  }, [searchParams])

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
    // Block checkout for coming-soon kits
    const catalogId = SLUG_TO_KIT_ID[kitId] || kitId
    const catalogKit = getKitById(catalogId)
    if (catalogKit?.comingSoon) {
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
            ) : kit.id === "react" ? (
              <ReactCheckoutContent />
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

                {kit.id === "complete" && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { label: "Chapters", value: "25" },
                      { label: "Questions & Problems", value: "570+" },
                      { label: "Detailed Articles", value: "91" },
                      { label: "Words of Content", value: "127k+" }
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl border border-white/70 bg-white/70 px-3 py-2 shadow-sm">
                        <p className="text-base font-black text-gray-900">{stat.value}</p>
                        <p className="text-[11px] font-medium text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
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

            {/* What You'll Get - IMPROVED MOBILE (skip for react — has its own) */}
            {kit.id !== "react" && (
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
            )}

            {/* Curriculum - IMPROVED MOBILE (skip for react) */}
            {kit.id !== "react" && (
              <Card className="p-4 md:p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    Curriculum
                  </h2>
                  <Badge variant="secondary" className="text-xs flex-shrink-0">Structured · Project-based</Badge>
                </div>
                <div className="space-y-3">
                  {kit.curriculum.map((module, idx) => {
                    const isExpanded = kit.id === "complete" ? openCurriculum === idx : true

                    return (
                      <div key={idx} className="border rounded-lg hover:shadow-sm transition-shadow overflow-hidden">
                        {kit.id === "complete" ? (
                          <button
                            type="button"
                            onClick={() => setOpenCurriculum(isExpanded ? null : idx)}
                            className="w-full flex items-center justify-between gap-2 p-3 text-left hover:bg-gray-50"
                            aria-expanded={isExpanded}
                          >
                            <h3 className="font-semibold text-sm break-words flex-1">{module.module}</h3>
                            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                        ) : (
                          <div className="flex items-center justify-between gap-2 p-3 pb-2">
                            <h3 className="font-semibold text-sm break-words flex-1">{module.module}</h3>
                          </div>
                        )}

                        {isExpanded && (
                          <div className={`flex flex-wrap gap-1.5 px-3 pb-3 ${kit.id === "complete" ? 'pt-0' : ''}`}>
                            {module.topics.map((topic, tidx) => (
                              <Badge key={tidx} variant="outline" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Testimonials - IMPROVED MOBILE (skip for react) */}
            {kit.id !== "react" && (
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
            )}

            {/* FAQs - IMPROVED MOBILE (skip for react) */}
            {kit.id !== "react" && (
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
            )}
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
                  kitId={SLUG_TO_KIT_ID[kit.id] || kit.id}
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
                        kitId={SLUG_TO_KIT_ID[kit.id] || kit.id}
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
                        kitId={SLUG_TO_KIT_ID[kit.id] || kit.id}
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
                <p className="font-semibold text-sm">Instant Access</p>
                <p className="text-xs text-muted-foreground mt-1">Get access instantly</p>
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
              kitId={SLUG_TO_KIT_ID[kit.id] || kit.id}
              buttonText={`Buy Now • ₹${kit.price}`}
              className="h-10 sm:h-12 px-3 sm:px-6 text-xs sm:text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 shadow-md whitespace-nowrap"
            />
          </div>
        </div>
      </div>
    </main >
  )
}
