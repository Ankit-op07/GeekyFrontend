// components/nodejs-checkout-content.tsx
"use client"

import { useState } from "react"
import Image from "next/image"
import { PaymentButton } from '@/components/payment-button'
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
    Check, Star, TrendingUp, Users,
    ChevronDown, Lock, Calendar, Folder, MessageCircle, X,
    FileText, Download, RefreshCw, Eye, BookOpen, Code, Award
} from "lucide-react"

/* ---------- Custom Node SVG Icon ---------- */
function NodeIcon({ size = 36 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <defs>
                <linearGradient id="nodeGrad" x1="0" x2="1">
                    <stop offset="0" stopColor="#83c66a" />
                    <stop offset="1" stopColor="#2f9f1e" />
                </linearGradient>
            </defs>
            <g transform="translate(50,50)">
                <path d="M-32,0 L-16,-28 L16,-28 L32,0 L16,28 L-16,28 Z" fill="url(#nodeGrad)" stroke="#0b5a2f" strokeWidth="1" />
                <text x="-6" y="6" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="22" fill="white">N</text>
            </g>
        </svg>
    )
}

export function NodejsCheckoutContent() {
    const [openFaq, setOpenFaq] = useState<number | null>(null)
    const [activePreview, setActivePreview] = useState(0)

    const previewImages = [
        { src: "/nodejs-preview/q1-multi-threaded.png", title: "Multi-Threaded Programming" },
        { src: "/nodejs-preview/q2-events-module.png", title: "Events Module & Event Loop" },
        { src: "/nodejs-preview/q3-function-event.png", title: "Function vs Event" },
        { src: "/nodejs-preview/q4-http-module.png", title: "HTTP Module in Node" }
    ]

    const faqs = [
        {
            question: "What exactly do I get?",
            answer: "200+ Interview Questions document with visual diagrams, 4-week structured study roadmap, JavaScript essentials folder, and lifetime updates."
        },
        {
            question: "Is this for beginners or experienced devs?",
            answer: "Both! Week 1 covers basics for freshers. Experienced devs can jump to Week 3-4 for advanced topics."
        },
        {
            question: "Why pay when YouTube is free?",
            answer: "YouTube is scattered and outdated. This is structured, interview-focused, and includes 200+ questions with visual explanations you won't find free."
        },
        {
            question: "Do I get updates?",
            answer: "Yes. Lifetime updates. When interview trends change, your kit updates too."
        }
    ]

    return (
        <div className="space-y-5">
            {/* CSS for animations */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.4); }
                    50% { box-shadow: 0 0 40px rgba(34, 197, 94, 0.7); }
                }
                @keyframes shine {
                    0% { background-position: -100% 0; }
                    100% { background-position: 200% 0; }
                }
                .animate-float { animation: float 3s ease-in-out infinite; }
                .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
                .shine-effect {
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                    background-size: 200% 100%;
                    animation: shine 3s infinite;
                }
            `}</style>

            {/* 1. Hero - FANCY with animations */}
            <Card className="p-6 md:p-8 overflow-hidden relative bg-gradient-to-br from-green-50 via-white to-emerald-50 border-green-300 border-2">
                {/* Animated background circles */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-200/40 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <div className="flex items-start gap-4 mb-6">
                        {/* Animated Logo */}
                        <div className="animate-float">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl animate-pulse-glow">
                                <NodeIcon size={48} />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-green-600 text-white border-0 text-xs">2025 Edition</Badge>
                                <Badge className="bg-yellow-500 text-white border-0 text-xs">🔥 Bestseller</Badge>
                            </div>
                            <h1 className="text-xl md:text-3xl font-black text-gray-900 leading-tight">
                                Node.js Interview <br className="hidden md:block" />Preparation Kit
                            </h1>
                        </div>
                    </div>

                    {/* Tagline with highlight */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 mb-5 border border-green-200">
                        <p className="text-sm md:text-base text-gray-700 text-center">
                            Go from <span className="line-through text-red-400">confused</span> to <span className="font-bold text-green-600">interview-ready</span> in just <span className="font-bold text-green-600">4 weeks</span>
                        </p>
                    </div>

                    {/* Stats Row - Fancy boxes */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-white rounded-xl p-3 text-center border border-gray-200 shadow-sm hover:shadow-lg transition-shadow">
                            <div className="text-2xl font-black text-blue-600">6,741+</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wide">Students</div>
                        </div>
                        <div className="bg-white rounded-xl p-3 text-center border border-gray-200 shadow-sm hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-center gap-1">
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                <span className="text-2xl font-black text-yellow-600">4.9</span>
                            </div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wide">Rating</div>
                        </div>
                        <div className="bg-white rounded-xl p-3 text-center border border-gray-200 shadow-sm hover:shadow-lg transition-shadow">
                            <div className="text-2xl font-black text-green-600">97%</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wide">Success</div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* 2. Your Learning Journey - Visual Roadmap */}
            <Card className="p-5 md:p-6 overflow-hidden">
                <h2 className="text-lg font-bold mb-2 text-center">Your 4-Week Journey</h2>
                <p className="text-xs text-gray-500 text-center mb-5">A structured path from basics to interview-ready</p>

                {/* Visual Roadmap Diagram */}
                <div className="relative">
                    {/* Connection Line */}
                    <div className="absolute top-1/2 left-8 right-8 h-1 bg-gradient-to-r from-blue-300 via-purple-300 via-orange-300 to-green-400 rounded-full hidden md:block" style={{ transform: 'translateY(-50%)' }} />

                    {/* Week Cards - Desktop */}
                    <div className="hidden md:grid md:grid-cols-4 gap-3 relative z-10">
                        {[
                            { week: 1, title: "Foundation", topics: "JS + Node Basics", color: "blue", icon: "📚" },
                            { week: 2, title: "Backend", topics: "Express + REST APIs", color: "purple", icon: "⚡" },
                            { week: 3, title: "Database", topics: "MongoDB + Auth", color: "orange", icon: "🗄️" },
                            { week: 4, title: "Advanced", topics: "System Design", color: "green", icon: "🚀" }
                        ].map((w, i) => (
                            <div key={i} className={`group relative bg-white rounded-xl p-4 border-2 border-${w.color}-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer`}>
                                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-${w.color}-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                                    {w.week}
                                </div>
                                <div className="text-center pt-3">
                                    <div className="text-2xl mb-1">{w.icon}</div>
                                    <h4 className={`font-bold text-sm text-${w.color}-700`}>{w.title}</h4>
                                    <p className="text-[10px] text-gray-500 mt-1">{w.topics}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Week Cards - Mobile (Vertical) */}
                    <div className="md:hidden space-y-3">
                        {[
                            { week: 1, title: "Foundation", topics: "JS + Node Basics", color: "bg-blue-50 border-blue-200", dot: "bg-blue-500", icon: "📚" },
                            { week: 2, title: "Backend", topics: "Express + REST APIs", color: "bg-purple-50 border-purple-200", dot: "bg-purple-500", icon: "⚡" },
                            { week: 3, title: "Database", topics: "MongoDB + Auth", color: "bg-orange-50 border-orange-200", dot: "bg-orange-500", icon: "🗄️" },
                            { week: 4, title: "Advanced", topics: "System Design", color: "bg-green-50 border-green-200", dot: "bg-green-500", icon: "🚀" }
                        ].map((w, i) => (
                            <div key={i} className={`flex items-center gap-4 p-3 rounded-xl border ${w.color}`}>
                                <div className={`w-10 h-10 ${w.dot} rounded-full flex items-center justify-center text-white font-bold text-sm shadow`}>
                                    {w.week}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{w.icon}</span>
                                        <h4 className="font-bold text-sm text-gray-900">{w.title}</h4>
                                    </div>
                                    <p className="text-xs text-gray-500">{w.topics}</p>
                                </div>
                                {i < 3 && <ChevronDown className="w-4 h-4 text-gray-300" />}
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* 3. What's Included - Fancy Cards */}
            <Card className="p-5 md:p-6">
                <h2 className="text-lg font-bold mb-4 text-center">What's Included</h2>

                <div className="grid gap-4">
                    {/* 200+ Questions - THE STAR - Full width fancy */}
                    <div className="relative overflow-hidden bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 rounded-2xl p-5 border-2 border-yellow-300 shadow-lg">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-200/50 rounded-full blur-2xl" />
                        <div className="relative z-10 flex items-start gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-2xl shadow-lg animate-float">
                                🔥
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <h3 className="font-bold text-base text-gray-900">200+ Interview Questions</h3>
                                    <Badge className="bg-yellow-500 text-white border-0 text-[10px]">⭐ THE STAR</Badge>
                                </div>
                                <p className="text-xs text-gray-600">
                                    Every question explained with <strong>visual diagrams</strong> & code examples.
                                    This is what makes our kit different from any free resource.
                                </p>
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {["Visual Diagrams", "Code Examples", "FAANG Questions", "Updated 2025"].map((tag, i) => (
                                        <span key={i} className="text-[10px] bg-white/60 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-200">
                                            ✓ {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Other items - 2 column */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 hover:shadow-md transition-shadow">
                            <div className="text-2xl mb-2">📅</div>
                            <h4 className="font-bold text-sm text-gray-900">4-Week Roadmap</h4>
                            <p className="text-[10px] text-gray-500 mt-1">Day-by-day study plan</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 hover:shadow-md transition-shadow">
                            <div className="text-2xl mb-2">💻</div>
                            <h4 className="font-bold text-sm text-gray-900">JS Essentials</h4>
                            <p className="text-[10px] text-gray-500 mt-1">ES6+, async, closures</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4 border border-green-200 hover:shadow-md transition-shadow">
                            <div className="text-2xl mb-2">🔄</div>
                            <h4 className="font-bold text-sm text-gray-900">Lifetime Updates</h4>
                            <p className="text-[10px] text-gray-500 mt-1">Always stay current</p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 hover:shadow-md transition-shadow">
                            <div className="text-2xl mb-2">⚡</div>
                            <h4 className="font-bold text-sm text-gray-900">Instant Access</h4>
                            <p className="text-[10px] text-gray-500 mt-1">Download immediately</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* 3. 200+ Questions - What's Covered */}
            <Card className="p-5 border-2 border-yellow-200 bg-gradient-to-br from-yellow-50/50 to-white">
                <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-yellow-600" />
                    Inside the 200+ Questions Document
                </h2>
                <p className="text-xs text-gray-600 mb-4">
                    Comprehensive coverage across all Node.js interview topics:
                </p>

                {/* Categories Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                    <div className="bg-orange-50 rounded-lg p-3 border-l-4 border-orange-400">
                        <h4 className="font-bold text-xs text-orange-800">Fundamentals</h4>
                        <p className="text-[10px] text-gray-600 mt-1">Node.js basics, modules, built-ins</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 border-l-4 border-purple-500">
                        <h4 className="font-bold text-xs text-purple-800">Express</h4>
                        <p className="text-[10px] text-gray-600 mt-1">Middleware, routing, templates</p>
                    </div>
                    <div className="bg-pink-50 rounded-lg p-3 border-l-4 border-pink-500">
                        <h4 className="font-bold text-xs text-pink-800">REST API</h4>
                        <p className="text-[10px] text-gray-600 mt-1">HTTP methods, CORS, auth</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border-l-4 border-green-500">
                        <h4 className="font-bold text-xs text-green-800">MongoDB</h4>
                        <p className="text-[10px] text-gray-600 mt-1">CRUD, queries, Mongoose</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 border-l-4 border-red-400">
                        <h4 className="font-bold text-xs text-red-800">Node-Others</h4>
                        <p className="text-[10px] text-gray-600 mt-1">Security, testing, WebSocket</p>
                    </div>
                    <div className="bg-yellow-100 rounded-lg p-3 border-l-4 border-yellow-500">
                        <h4 className="font-bold text-xs text-yellow-800">⭐ Bonus</h4>
                        <p className="text-[10px] text-gray-600 mt-1">Scenario-based, application Q's</p>
                    </div>
                </div>

                {/* Key Differentiator */}
                <div className="bg-white rounded-lg p-3 border border-yellow-200">
                    <p className="text-xs text-gray-700 flex items-start gap-2">
                        <span className="text-lg">💡</span>
                        <span>
                            <strong>What makes it different:</strong> Every answer includes visual diagrams & flowcharts.
                            You'll <em>see</em> how Event Loop works, not just read about it.
                        </span>
                    </p>
                </div>
            </Card>

            {/* 4. See Actual Pages - Content Preview */}
            <Card className="p-5 border-2 border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-5 h-5 text-gray-600" />
                    <h2 className="text-base font-bold text-gray-900">See Actual Pages</h2>
                    <Badge variant="outline" className="text-[10px] ml-auto">Real Content</Badge>
                </div>

                {/* Main Preview Image */}
                <div className="relative bg-gray-900 rounded-xl overflow-hidden mb-3 aspect-[16/10]">
                    <Image
                        src={previewImages[activePreview].src}
                        alt={previewImages[activePreview].title}
                        fill
                        className="object-contain"
                    />
                </div>

                {/* Current Question Title */}
                <p className="text-xs text-center text-gray-600 mb-2">
                    <strong>Q:</strong> {previewImages[activePreview].title}
                </p>

                {/* Thumbnail Selector */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                    {previewImages.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActivePreview(idx)}
                            className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${activePreview === idx ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200 hover:border-green-400'}`}
                        >
                            <Image
                                src={img.src}
                                alt={img.title}
                                fill
                                className="object-cover"
                            />
                        </button>
                    ))}
                </div>

                <p className="text-[11px] text-center text-gray-500">
                    👆 Click to preview different questions. Notice the visual diagrams in each answer!
                </p>
            </Card>

            {/* 5. Before / After - Your Transformation */}
            <Card className="p-5">
                <h2 className="text-base font-bold mb-3">Your Transformation</h2>
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                        <p className="font-bold text-xs text-red-700 mb-2 flex items-center gap-1">
                            <X className="w-3 h-3" /> Before
                        </p>
                        <ul className="text-[11px] text-red-800 space-y-1.5">
                            <li>• Confused about Event Loop</li>
                            <li>• Fear MongoDB questions</li>
                            <li>• No clear preparation path</li>
                        </ul>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                        <p className="font-bold text-xs text-green-700 mb-2 flex items-center gap-1">
                            <Check className="w-3 h-3" /> After
                        </p>
                        <ul className="text-[11px] text-green-800 space-y-1.5">
                            <li>• Explain concepts visually</li>
                            <li>• Answer with confidence</li>
                            <li>• Complete prep in 4 weeks</li>
                        </ul>
                    </div>
                </div>
            </Card>

            {/* 6. Why This Kit - Quick Comparison */}
            <Card className="p-5">
                <h2 className="text-base font-bold mb-3">Free Resources vs This Kit</h2>
                <div className="space-y-2">
                    {[
                        { feature: "Structured 4-week roadmap", free: false, kit: true },
                        { feature: "Visual diagrams in answers", free: false, kit: true },
                        { feature: "Interview-focused only", free: false, kit: true },
                        { feature: "Lifetime updates", free: false, kit: true },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <span className="text-xs text-gray-700">{item.feature}</span>
                            <div className="flex gap-6">
                                <span className="text-xs text-gray-400 w-10 text-center">Free</span>
                                <span className="text-xs text-green-600 font-medium w-10 text-center">Kit</span>
                            </div>
                        </div>
                    ))}
                    <div className="flex items-center justify-between pt-1">
                        <span></span>
                        <div className="flex gap-6">
                            <X className="w-4 h-4 text-red-400 mx-auto" style={{ marginLeft: '12px' }} />
                            <Check className="w-4 h-4 text-green-600 mx-auto" style={{ marginLeft: '12px' }} />
                        </div>
                    </div>
                </div>
            </Card>

            {/* 7. Quick Testimonial */}
            <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center font-bold text-green-700 text-sm flex-shrink-0">
                        KV
                    </div>
                    <div>
                        <p className="text-sm text-gray-700 italic">"Event loop visual helped me answer 5 questions. Got 18 LPA after this!"</p>
                        <p className="text-xs text-gray-500 mt-1">— Karan V., Backend Engineer @ Zomato</p>
                    </div>
                </div>
            </Card>

            {/* 8. FAQs - Minimal */}
            <Card className="p-5">
                <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-purple-600" />
                    Questions?
                </h2>
                <div className="space-y-2">
                    {faqs.map((faq, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                className="w-full p-3 text-left flex items-center justify-between gap-2 hover:bg-gray-50"
                            >
                                <span className="font-medium text-sm text-gray-900">{faq.question}</span>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${openFaq === idx ? 'rotate-180' : ''}`} />
                            </button>
                            {openFaq === idx && (
                                <div className="p-3 pt-0 text-xs text-gray-600 bg-gray-50">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            {/* 9. Final CTA */}
            <Card className="p-5 bg-gradient-to-br from-green-600 to-emerald-700 text-white border-0">
                <div className="text-center mb-4">
                    <Badge className="bg-white/20 text-white border-0 mb-2">90% OFF - Limited Time</Badge>
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <span className="text-3xl font-black">₹299</span>
                        <span className="text-lg line-through text-green-300">₹2,999</span>
                    </div>
                    <p className="text-xs text-green-200">Instant access • Lifetime updates • 200+ Questions</p>
                </div>

                <PaymentButton
                    amount={299}
                    originalAmount={2999}
                    planName="Node.js Interview Preparation Kit"
                    buttonText="🚀 Get Instant Access"
                    className="w-full h-12 text-base font-bold bg-white text-green-700 hover:bg-green-50 shadow-xl"
                />

                <div className="mt-3 flex items-center justify-center gap-4 text-xs text-green-200">
                    <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Secure</span>
                    <span className="flex items-center gap-1"><Download className="w-3 h-3" /> Instant</span>
                    <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Updates</span>
                </div>
            </Card>
        </div>
    )
}
