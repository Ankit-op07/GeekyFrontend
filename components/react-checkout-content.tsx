// components/react-checkout-content.tsx
"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Check, Star, BookOpen, Code, Zap, Target, Brain,
  FileText, Atom, ChevronRight, Sparkles, Trophy, Rocket,
  X, Award, TrendingUp, Users, Layers, Shield, Eye, Cpu,
  TestTube, MessageSquare, Palette, GitBranch, Box
} from "lucide-react"

/* ─── Module Data ─── */
const modules = [
  {
    id: 1,
    title: "React Core Fundamentals",
    articles: 10,
    icon: <Atom className="w-5 h-5" />,
    color: "from-cyan-500 to-blue-600",
    topics: [
      "Virtual DOM & Reconciliation",
      "JSX, Components & Props",
      "State & useEffect Lifecycle",
      "Conditional & List Rendering with Keys",
      "Forms, Event Handling & Refs",
      "Error Boundaries",
    ],
    highlight: "Exact interview questions + output-based traps for each concept",
  },
  {
    id: 2,
    title: "Advanced Hooks & Patterns",
    articles: 6,
    icon: <Zap className="w-5 h-5" />,
    color: "from-violet-500 to-purple-600",
    topics: [
      "useReducer for Complex State",
      "useContext & Prop Drilling Solutions",
      "useMemo, useCallback — When to Use & When NOT to",
      "Custom Hooks (useDebounce, useFetch, useLocalStorage)",
      "React.memo & Re-render Prevention",
      "useLayoutEffect vs useEffect",
    ],
    highlight: "Learn when optimization HURTS — not just when it helps",
  },
  {
    id: 3,
    title: "Routing & Navigation",
    articles: 3,
    icon: <GitBranch className="w-5 h-5" />,
    color: "from-emerald-500 to-teal-600",
    topics: [
      "React Router v6 Complete Guide",
      "Nested Routes with Outlet",
      "Protected Routes (Auth + Role-based)",
      "Lazy Loading Routes with Code Splitting",
    ],
    highlight: "Includes v5 → v6 migration reference",
  },
  {
    id: 4,
    title: "State Management",
    articles: 5,
    icon: <Layers className="w-5 h-5" />,
    color: "from-orange-500 to-red-500",
    topics: [
      "When You Actually Need a State Library",
      "Redux Core Principles & Data Flow",
      "Redux Toolkit (createSlice, configureStore, createAsyncThunk)",
      "Middleware & Side Effects",
      "Context API vs Redux — The Real Answer",
    ],
    highlight: "The interview-winning answer to 'Context vs Redux'",
  },
  {
    id: 5,
    title: "Performance Optimization",
    articles: 5,
    icon: <TrendingUp className="w-5 h-5" />,
    color: "from-green-500 to-emerald-600",
    topics: [
      "React DevTools, Lighthouse & Bundle Analyzer",
      "Code Splitting with Dynamic Imports",
      "Virtualization for 10,000-row Lists",
      "When Memoization Hurts More Than It Helps",
      "Core Web Vitals (LCP, INP, CLS)",
      "CSR vs SSR vs SSG Comparison",
    ],
    highlight: "The honest truth about React performance",
  },
  {
    id: 6,
    title: "Design Patterns",
    articles: 6,
    icon: <Palette className="w-5 h-5" />,
    color: "from-pink-500 to-rose-600",
    topics: [
      "Container / Presentational Pattern",
      "Higher-Order Components (HOC)",
      "Render Props & Composition",
      "Compound Components Pattern",
      "Provider Pattern",
      "SOLID Principles in React",
    ],
    highlight: "When to use, when NOT to use, and the modern alternative",
  },
  {
    id: 7,
    title: "Machine Coding Problems",
    articles: 15,
    icon: <Code className="w-5 h-5" />,
    color: "from-blue-600 to-indigo-700",
    topics: [
      "Counter with useReducer",
      "Todo App with Full CRUD",
      "Debounced Search with API",
      "Infinite Scroll",
      "Multi-Step Form with Validation",
      "Star Rating Component",
      "Accordion & Modal with Portal",
      "Custom Dropdown with Keyboard Nav",
      "Tic-Tac-Toe Game",
      "Shopping Cart with Context",
      "Pagination Component",
      "Dynamic Checkbox with Select All",
      "Nested Circles (Recursion)",
    ],
    highlight: "Complete working solutions with edge case handling",
  },
  {
    id: 8,
    title: "Testing in React",
    articles: 3,
    icon: <TestTube className="w-5 h-5" />,
    color: "from-teal-500 to-cyan-600",
    topics: [
      "Testing Fundamentals & Philosophy",
      "React Testing Library Deep Dive",
      "Mocking APIs with Jest & MSW",
      "Testing Components with Context",
      "Testing Custom Hooks with renderHook",
    ],
    highlight: "From zero testing knowledge to writing real tests",
  },
  {
    id: 9,
    title: "Scenario & Behavioral Questions",
    articles: 5,
    icon: <MessageSquare className="w-5 h-5" />,
    color: "from-amber-500 to-orange-600",
    topics: [
      '"This App Is Slow" — 4-Step Diagnostic Framework',
      '"Design the Component Architecture" — E-commerce Case Study',
      '"How Do You Manage State?" — 4-Layer State Model',
      '"URL to Rendered Page" — Full 12-Step Sequence',
      "5 Behavioral Question Templates with Answers",
    ],
    highlight: "Structured frameworks that win senior-level rounds",
  },
]

const machineCodingChallenges = [
  "Counter with useReducer",
  "Dynamic Checkbox + Select All",
  "Todo App with Full CRUD",
  "Debounced Search with API",
  "Nested Circles (Recursion)",
  "Infinite Scroll",
  "Multi-Step Form + Validation",
  "Star Rating",
  "Accordion",
  "Modal with Portal",
  "Dropdown with Keyboard Nav",
  "Tic-Tac-Toe",
  "Pagination",
  "Shopping Cart with Context",
  "Nested Comments",
]

const sampleQuestions = [
  {
    q: "What is the Virtual DOM? How does reconciliation actually work?",
    a: "The Virtual DOM is a lightweight JavaScript object that mirrors the real DOM. When state changes, React creates a new Virtual DOM tree, diffs it against the previous one using its reconciliation algorithm (React Fiber), and batches the minimum number of real DOM updates needed. This is why React is fast — it avoids expensive direct DOM manipulation.",
    difficulty: "Fresher",
    frequency: "★★★★★",
  },
  {
    q: "When does useMemo actually help, and when does it hurt?",
    a: "useMemo helps when you have expensive computations (sorting large arrays, complex filtering) that re-run on every render. It HURTS when used on cheap operations — the memoization overhead (comparing deps, storing cached values) can actually be slower than re-computing. Rule of thumb: profile first, memoize second. Never memoize by default.",
    difficulty: "Intermediate",
    frequency: "★★★★☆",
  },
  {
    q: "What does this code print and why?",
    code: `function App() {
  const [count, setCount] = useState(0);
  
  const handleClick = () => {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
    console.log(count);
  };
  // What happens?
}`,
    a: "console.log prints 0 (the stale closure value). count only increments by 1, not 3, because all three setCount calls use the same stale 'count' value from the closure. To increment by 3, use the functional updater: setCount(prev => prev + 1). This is a batching + closure trap that catches 80% of candidates.",
    difficulty: "Tricky",
    frequency: "★★★★★",
  },
]

const testimonials = [
  {
    name: "Rahul Sharma",
    role: "Frontend Engineer",
    company: "Amazon",
    text: "I stopped reading random Medium articles and just followed this kit module by module. Got an offer in 3 weeks. The machine coding solutions alone are worth 10x the price.",
    rating: 5,
  },
  {
    name: "Priya Patel",
    role: "SDE-2",
    company: "Microsoft",
    text: "Finally understood why useCallback matters (and when it doesn't). The 'when NOT to optimize' section changed how I think about performance. Cleared two rounds with confidence.",
    rating: 5,
  },
  {
    name: "Amit Kumar",
    role: "React Developer",
    company: "Flipkart",
    text: "The shopping cart machine coding solution was almost exactly what I was asked in my interview. The interviewer was impressed with edge case handling. Got the offer at 18 LPA.",
    rating: 5,
  },
  {
    name: "Sneha Roy",
    role: "Senior Frontend Engineer",
    company: "Razorpay",
    text: "The scripted interview answers were a game changer. Instead of fumbling with explanations, I had structured, confident responses for every React concept. Went from 12 LPA to 28 LPA.",
    rating: 5,
  },
]

const faqs = [
  {
    q: "Is this for beginners or experienced developers?",
    a: "Both. Every article covers the concept from scratch for freshers, then goes deeper for intermediate and senior levels. Questions are tagged with difficulty levels so you can focus on what matches your experience.",
  },
  {
    q: "Is this just a list of questions and answers?",
    a: "No. Each article teaches the concept with real code, explains the traps interviewers set, includes output-based questions, and ends with a scripted answer you can use in your interview. It's a course, not a cheat sheet.",
  },
  {
    q: "Does it cover machine coding / live coding rounds?",
    a: "Yes. Module 7 has 15 complete machine coding challenges with working solutions: Todo App, Shopping Cart, Infinite Scroll, Star Rating, Tic-Tac-Toe, Modal, Dropdown, Pagination, and more. Each solution handles edge cases and includes what the interviewer evaluates.",
  },
  {
    q: "What about Redux and state management?",
    a: "Module 4 covers Redux core principles, Redux Toolkit (createSlice, configureStore, createAsyncThunk), middleware, and the Context vs Redux comparison. It also covers when you DON'T need Redux — which is equally important.",
  },
  {
    q: "Is the content up to date?",
    a: "Yes. All content uses React 18+ patterns, React Router v6, Redux Toolkit (not legacy Redux), and modern hooks. Legacy patterns like class components and Enzyme are mentioned only for context, not as primary content.",
  },
]

/* ─── Main Component ─── */
export function ReactCheckoutContent() {
  const [expandedModule, setExpandedModule] = useState<number | null>(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* ━━━ HERO SECTION ━━━ */}
      <Card className="p-0 border-0 overflow-hidden shadow-xl">
        <div className="relative bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 p-5 md:p-8 text-white">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                <Atom className="w-7 h-7 text-white animate-spin" style={{ animationDuration: "8s" }} />
              </div>
              <Badge className="bg-white/20 text-white border-white/30 text-xs backdrop-blur-sm">
                ⭐ BESTSELLER
              </Badge>
            </div>

            <h1 className="text-xl md:text-3xl font-bold leading-tight mb-3">
              The Only React Interview Guide That Covers What Actually Gets Asked
            </h1>

            <p className="text-sm md:text-base text-white/85 leading-relaxed mb-5 max-w-2xl">
              Not another Q&A dump. A structured 10-module course with deep explanations, complete machine coding solutions, output-based trick questions, and ready-to-use interview answers.
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-3 md:gap-5">
              {[
                { value: "57", label: "In-depth Articles" },
                { value: "15", label: "Machine Coding Solutions" },
                { value: "60+", label: "Output-Based Traps" },
                { value: "10", label: "Structured Modules" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-3 py-2 text-center">
                  <p className="text-lg md:text-2xl font-black">{stat.value}</p>
                  <p className="text-[10px] md:text-xs text-white/70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Social proof bar */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-gray-900" />
              ))}
            </div>
            <span className="text-xs text-gray-300">
              <strong className="text-white">11,340+</strong> students enrolled
            </span>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            ))}
            <span className="text-xs text-gray-300 ml-1">4.9/5 rating</span>
          </div>
        </div>
      </Card>

      {/* ━━━ PAIN POINT / WHY THIS KIT ━━━ */}
      <Card className="p-5 md:p-6 border-0 bg-gradient-to-br from-red-50 via-white to-orange-50 shadow-md">
        <h2 className="text-base md:text-lg font-bold mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-500 flex-shrink-0" />
          Why Most React Interview Prep Fails
        </h2>
        <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>
            Most React guides give you a list of 100 questions with one-line answers. You memorize them, walk into the interview, and <strong className="text-red-600">freeze</strong> when the interviewer asks <em>"why?"</em> or gives you a variation you haven't seen before.
          </p>
          <p>
            This kit is different. It's built around how React interviews <strong>actually work</strong>: concept questions with follow-ups, output-based traps, live coding challenges, system design scenarios, and behavioral rounds.
          </p>
          <p className="font-medium text-gray-900">
            Every article teaches you the concept, shows you the code, warns you about the traps, and gives you a <span className="text-blue-600">scripted answer you can adapt to your own voice</span>.
          </p>
        </div>
      </Card>

      {/* ━━━ WHAT MAKES THIS DIFFERENT ━━━ */}
      <Card className="p-5 md:p-6 border-0 shadow-md">
        <h2 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0" />
          What Makes This Different
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              icon: <Brain className="w-5 h-5" />,
              title: "Deep Understanding, Not Memorization",
              desc: "Every article teaches the 'why' so you can handle follow-up questions and variations.",
              color: "from-blue-500 to-cyan-500",
            },
            {
              icon: <Eye className="w-5 h-5" />,
              title: "Real Interview Format",
              desc: "Each article opens with exact questions, difficulty level, and frequency tables.",
              color: "from-purple-500 to-violet-500",
            },
            {
              icon: <Cpu className="w-5 h-5" />,
              title: 'Output-Based Traps Included',
              desc: 'Tricky "what does this print?" questions with detailed explanations woven into every article.',
              color: "from-red-500 to-orange-500",
            },
            {
              icon: <Code className="w-5 h-5" />,
              title: "Machine Coding That Works",
              desc: "Complete runnable code: edge cases, keyboard events, loading states, cleanup on unmount.",
              color: "from-green-500 to-emerald-500",
            },
            {
              icon: <FileText className="w-5 h-5" />,
              title: "Scripted Interview Answers",
              desc: "Paragraph-length answers structured to show depth without rambling. Ready to use.",
              color: "from-amber-500 to-yellow-500",
            },
            {
              icon: <Target className="w-5 h-5" />,
              title: "All Experience Levels",
              desc: "Tagged by difficulty (fresher/intermediate/senior) and real-world frequency.",
              color: "from-pink-500 to-rose-500",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 mb-0.5">{item.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ━━━ 10 MODULES — EXPANDABLE ━━━ */}
      <Card className="p-5 md:p-6 border-0 shadow-md">
        <div className="flex items-center justify-between mb-4 gap-2">
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500 flex-shrink-0" />
            What's Inside — 10 Modules
          </h2>
          <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
            57 Articles
          </Badge>
        </div>

        <div className="space-y-2">
          {modules.map((mod, idx) => {
            const isOpen = expandedModule === idx
            return (
              <div
                key={mod.id}
                className={`border rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? "border-blue-300 shadow-md bg-blue-50/30" : "border-gray-200 hover:border-gray-300"}`}
              >
                <button
                  onClick={() => setExpandedModule(isOpen ? null : idx)}
                  className="w-full p-3 md:p-4 text-left flex items-center gap-3 hover:bg-gray-50/50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${mod.color} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
                    {mod.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-gray-900">
                        Module {mod.id}: {mod.title}
                      </h3>
                      <Badge variant="outline" className="text-[10px] border-gray-300">
                        {mod.articles} {mod.id === 7 ? "challenges" : "articles"}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`} />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="ml-[52px] space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {mod.topics.map((topic, tidx) => (
                          <Badge key={tidx} variant="secondary" className="text-xs bg-white border border-gray-200">
                            <Check className="w-3 h-3 text-green-500 mr-1" />
                            {topic}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-blue-700 font-medium bg-blue-50 px-3 py-2 rounded-lg mt-2 border border-blue-100">
                        ✨ {mod.highlight}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* ━━━ MACHINE CODING CHALLENGES ━━━ */}
      <Card className="p-5 md:p-6 border-0 shadow-md bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        <h2 className="text-base md:text-lg font-bold mb-2 flex items-center gap-2">
          <Code className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          15 Machine Coding Challenges
          <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs ml-auto">
            Complete Solutions
          </Badge>
        </h2>
        <p className="text-xs text-gray-600 mb-4">
          The most asked build-it-live challenges with production-quality solutions. Each handles edge cases and includes what the interviewer evaluates.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {machineCodingChallenges.map((challenge, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-white border border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 group-hover:scale-110 transition-transform">
                  {idx + 1}
                </div>
                <span className="text-xs font-medium text-gray-800 leading-tight">{challenge}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-indigo-100/60 rounded-lg border border-indigo-200 text-center">
          <p className="text-xs text-indigo-800 font-medium">
            💡 Each solution includes: Component architecture • State management • Edge cases • Keyboard accessibility • What the interviewer evaluates
          </p>
        </div>
      </Card>

      {/* ━━━ INTERACTIVE SAMPLE QUESTIONS ━━━ */}
      <Card className="p-5 md:p-6 border-0 shadow-md border-2 border-cyan-200 bg-gradient-to-br from-cyan-50/50 to-white">
        <h2 className="text-base md:text-lg font-bold mb-2 flex items-center gap-2">
          <Brain className="w-5 h-5 text-cyan-600 flex-shrink-0" />
          Try Sample Questions
          <Badge className="bg-cyan-100 text-cyan-700 border-0 text-xs ml-auto">Interactive</Badge>
        </h2>
        <p className="text-xs text-gray-600 mb-4">
          Click to reveal answers. These are real questions from top companies with the depth of explanation you'll find in every article.
        </p>

        <div className="space-y-3">
          {sampleQuestions.map((item, idx) => (
            <details key={idx} className="group border border-cyan-200 rounded-xl overflow-hidden hover:shadow-md transition-all">
              <summary className="cursor-pointer p-4 bg-white hover:bg-cyan-50/50 transition-colors flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900 pr-6">{item.q}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-[10px] border-cyan-300 text-cyan-700">{item.difficulty}</Badge>
                    <span className="text-[10px] text-amber-600">{item.frequency}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform flex-shrink-0 mt-1" />
              </summary>
              <div className="p-4 pt-0 bg-gradient-to-b from-cyan-50/50 to-white border-t border-cyan-100">
                {item.code && (
                  <pre className="mt-3 p-3 bg-gray-900 text-green-400 rounded-lg text-xs overflow-x-auto font-mono">
                    <code>{item.code}</code>
                  </pre>
                )}
                <div className="p-3 bg-white rounded-lg border border-cyan-100 mt-3">
                  <p className="text-xs font-semibold text-cyan-700 mb-1.5 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Model Answer:
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">{item.a}</p>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  ✨ 57 articles with this depth of explanation in the kit
                </p>
              </div>
            </details>
          ))}
        </div>
      </Card>

      {/* ━━━ BEFORE / AFTER TRANSFORMATION ━━━ */}
      <Card className="p-5 md:p-6 border-0 shadow-md">
        <h2 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2">
          <Rocket className="w-5 h-5 text-blue-600 flex-shrink-0" />
          What You'll Be Able to Do
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Before */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-red-700">Before</h3>
            </div>
            <ul className="space-y-2">
              {[
                "Memorize answers, freeze at follow-ups",
                "Panic at output-based trick questions",
                "Struggle with machine coding time limits",
                'Can\'t explain "how would you architect this?"',
                "Fumble with Redux vs Context debate",
                "No structured prep — random articles",
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
              <h3 className="font-bold text-green-700">After This Kit</h3>
            </div>
            <ul className="space-y-2">
              {[
                "Explain any React concept with code & tradeoffs",
                "Solve machine coding challenges in 45-60 mins",
                "Handle output traps without getting caught",
                "Answer architecture & optimization questions",
                "Write tests with React Testing Library + Jest",
                "Talk about Redux & patterns at senior level",
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

      {/* ━━━ WHO IS THIS FOR ━━━ */}
      <Card className="p-5 md:p-6 border-0 shadow-md bg-gradient-to-br from-violet-50 via-white to-purple-50">
        <h2 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-violet-600 flex-shrink-0" />
          Who Is This For
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { emoji: "👨‍💻", title: "Frontend Developers", desc: "Preparing for React interviews at product companies" },
            { emoji: "🔄", title: "Framework Switchers", desc: "Moving from Angular/Vue to React and need interview-specific prep" },
            { emoji: "🎓", title: "Freshers to Seniors", desc: "0 to 6+ years experience. All difficulty levels are tagged." },
            { emoji: "🧠", title: "Deep Learners", desc: "Anyone who wants to understand React deeply, not just memorize Q&A" },
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-violet-100 hover:border-violet-300 hover:shadow-sm transition-all">
              <span className="text-2xl flex-shrink-0">{item.emoji}</span>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">{item.title}</h3>
                <p className="text-xs text-gray-600 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ━━━ VS FREE RESOURCES TABLE ━━━ */}
      <Card className="p-5 md:p-6 border-0 shadow-md">
        <h2 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          Why This Kit vs Free Resources?
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Feature</th>
                <th className="text-center py-3 px-2"><span className="text-gray-500 text-xs">📺 YouTube</span></th>
                <th className="text-center py-3 px-2"><span className="text-gray-500 text-xs">📝 Blogs</span></th>
                <th className="text-center py-3 px-2">
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-2.5 py-1 rounded-full text-xs font-bold">⭐ This Kit</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: "Structured 10-module course", yt: false, blog: false, kit: true },
                { feature: "Output-based trick questions", yt: false, blog: false, kit: true },
                { feature: "Complete machine coding solutions", yt: "partial", blog: false, kit: true },
                { feature: "Scripted interview answers", yt: false, blog: false, kit: true },
                { feature: "Difficulty-tagged questions", yt: false, blog: false, kit: true },
                { feature: "Design patterns with anti-patterns", yt: false, blog: "partial", kit: true },
                { feature: "Testing (RTL + Jest + MSW)", yt: false, blog: false, kit: true },
                { feature: "Lifetime updates", yt: false, blog: false, kit: true },
              ].map((row, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="py-3 px-2 font-medium text-gray-700 text-xs sm:text-sm">{row.feature}</td>
                  <td className="py-3 px-2 text-center">
                    {row.yt === true ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : row.yt === "partial" ? <span className="text-yellow-500 text-sm">~</span> : <X className="w-5 h-5 text-red-400 mx-auto" />}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {row.blog === true ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : row.blog === "partial" ? <span className="text-yellow-500 text-sm">~</span> : <X className="w-5 h-5 text-red-400 mx-auto" />}
                  </td>
                  <td className="py-3 px-2 text-center bg-cyan-50/50">
                    <Check className="w-5 h-5 text-cyan-600 mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-3 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-lg text-center">
          <p className="text-sm font-semibold text-cyan-800">
            💰 Save 100+ hours of scattered learning. Get everything organized in one place.
          </p>
        </div>
      </Card>

      {/* ━━━ SUCCESS STORIES ━━━ */}
      <Card className="p-5 md:p-6 border-0 shadow-md">
        <div className="flex items-center justify-between mb-4 gap-2">
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-green-500 flex-shrink-0" />
            Success Stories
          </h2>
          <Badge variant="secondary" className="text-xs flex-shrink-0">634+ reviews</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {testimonials.map((t, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {t.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role} • {t.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5 mb-2">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                ))}
                <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 text-[10px] ml-auto">Verified</Badge>
              </div>
              <p className="text-sm text-gray-700 italic leading-relaxed">"{t.text}"</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ━━━ SUCCESS METRICS ━━━ */}
      <Card className="p-5 md:p-6 border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <h2 className="text-base md:text-lg font-bold mb-4 text-center">Our Students' Results</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: "11,340+", label: "Students Enrolled", icon: "👥" },
            { value: "97%", label: "Interview Clear Rate", icon: "🎯" },
            { value: "3x", label: "Average Salary Hike", icon: "💰" },
            { value: "4.9/5", label: "Student Rating", icon: "⭐" },
          ].map((stat, idx) => (
            <div key={idx} className="text-center p-3 bg-white rounded-xl shadow-sm border border-blue-100">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <p className="text-xl md:text-2xl font-black text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ━━━ FAQ ━━━ */}
      <Card className="p-5 md:p-6 border-0 shadow-md">
        <h2 className="text-base md:text-lg font-bold mb-3 flex items-center gap-2">
          <Box className="w-5 h-5 text-purple-500 flex-shrink-0" />
          Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-sm text-gray-900">{faq.q}</span>
                <ChevronRight className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${openFaq === idx ? "rotate-90" : ""}`} />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
