// components/placement-kit-checkout-content.tsx
"use client"

import { useState, useEffect } from "react"
import { PaymentButton } from '@/components/payment-button'
import { Badge } from "@/components/ui/badge"
import {
    Check, Star, Lock, Download, RefreshCw, ChevronDown, ChevronRight,
    Folder, FileText, Users, Award, TrendingUp, Shield, ArrowRight,
    BookOpen, Code, Briefcase, GraduationCap, Sparkles, Target, Zap,
    Clock, Gift, Trophy, Brain, Rocket
} from "lucide-react"

export function PlacementKitCheckoutContent() {
    const [expandedSection, setExpandedSection] = useState<number | null>(null)
    const [activeTab, setActiveTab] = useState<'folders' | 'documents'>('folders')
    const [animatedCount, setAnimatedCount] = useState(0)

    // Animated counter effect
    useEffect(() => {
        const target = 12450
        const duration = 2000
        const steps = 50
        const increment = target / steps
        let current = 0

        const timer = setInterval(() => {
            current += increment
            if (current >= target) {
                setAnimatedCount(target)
                clearInterval(timer)
            } else {
                setAnimatedCount(Math.floor(current))
            }
        }, duration / steps)

        return () => clearInterval(timer)
    }, [])

    const technicalFolders = [
        { name: "Data Structures & Algorithms", topics: "Arrays, Trees, Graphs, DP, Sorting", icon: "🔢", color: "from-blue-500 to-indigo-600" },
        { name: "DBMS & SQL", topics: "Normalization, Queries, Joins, Indexes", icon: "🗄️", color: "from-emerald-500 to-teal-600" },
        { name: "Computer Networks", topics: "OSI, TCP/IP, HTTP, DNS, Protocols", icon: "🌐", color: "from-cyan-500 to-blue-600" },
        { name: "Operating System", topics: "Processes, Memory, Scheduling, Deadlocks", icon: "⚙️", color: "from-purple-500 to-violet-600" },
        { name: "Object-Oriented Programming", topics: "Pillars, SOLID, Design Patterns", icon: "🎯", color: "from-orange-500 to-red-600" },
        { name: "System Design", topics: "Scalability, Load Balancing, Caching", icon: "🏗️", color: "from-pink-500 to-rose-600" },
        { name: "Software Engineering", topics: "SDLC, Agile, Testing, CI/CD", icon: "🚀", color: "from-amber-500 to-orange-600" },
    ]

    const documents = [
        { name: "25+ Job Interview Scripts", desc: "Word-by-word answers for every interview scenario", icon: "📝", highlight: true },
        { name: "HR Interview Questions", desc: "50+ questions with winning responses", icon: "🎤", highlight: false },
        { name: "LeetCode Problems PDF", desc: "Curated coding problems with solutions", icon: "💻", highlight: true },
        { name: "Resume Templates", desc: "ATS-optimized formats that get shortlisted", icon: "📄", highlight: false },
        { name: "Cover Letter Templates", desc: "Professional templates for applications", icon: "✉️", highlight: false },
        { name: "Companies Hiring Freshers", desc: "Updated 2025 list with application links", icon: "🏢", highlight: true },
        { name: "Geeky Frontend Resources", desc: "Learning roadmaps and project ideas", icon: "🎨", highlight: false },
    ]

    const faqs = [
        {
            q: "What's included in this kit?",
            a: "7 comprehensive technical folders covering all CS fundamentals, 25+ interview scripts, HR questions bank, LeetCode problems PDF, resume templates, and an updated list of companies hiring freshers."
        },
        {
            q: "Is this suitable for beginners?",
            a: "Yes. All materials are structured from basics to advanced. Students from any engineering branch can use this for placement preparation."
        },
        {
            q: "How will I receive the materials?",
            a: "Immediately after payment, you'll receive a download link via email. All materials are in PDF and document format for easy access."
        },
        {
            q: "Are updates included?",
            a: "Yes. You get lifetime access with free updates whenever new content is added or existing materials are refreshed."
        },
    ]

    const successStories = [
        { name: "Aditya Sharma", company: "TCS Digital", package: "7 LPA", role: "Software Engineer", image: "A" },
        { name: "Sneha Gupta", company: "Amazon", package: "12 LPA", role: "SDE I", image: "S" },
        { name: "Rohit Kumar", company: "Microsoft", package: "18 LPA", role: "Software Engineer", image: "R" },
        { name: "Priya Patel", company: "Flipkart", package: "15 LPA", role: "Frontend Developer", image: "P" },
    ]

    return (
        <div className="space-y-5 pb-6">
            {/* Hero Section - Premium Dark Gradient */}
            <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 rounded-2xl p-6 text-white overflow-hidden">
                {/* Animated background effects */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 left-1/4 w-72 h-72 bg-indigo-500 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-500 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10">
                    {/* Top Badge Row */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0 font-semibold px-3 py-1">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Most Popular
                        </Badge>
                        <Badge className="bg-white/15 backdrop-blur-sm text-white border-white/20 font-medium">
                            🎓 {animatedCount.toLocaleString()}+ Students
                        </Badge>
                    </div>

                    <div className="flex items-start gap-4 mb-5">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/30 flex-shrink-0">
                            <GraduationCap className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-2 bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                                Ultimate Campus Placement Kit
                            </h1>
                            <p className="text-slate-300 text-sm">
                                From Zero to Offer Letter – Everything you need for placements
                            </p>
                        </div>
                    </div>

                    {/* Stats Row - Glassmorphism Cards */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/10 hover:bg-white/15 transition-all">
                            <div className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">7</div>
                            <div className="text-xs text-slate-400 font-medium">Tech Folders</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/10 hover:bg-white/15 transition-all">
                            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">200+</div>
                            <div className="text-xs text-slate-400 font-medium">Resources</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/10 hover:bg-white/15 transition-all">
                            <div className="flex items-center justify-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">4.95</span>
                            </div>
                            <div className="text-xs text-slate-400 font-medium">Rating</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Benefits Strip */}
            <div className="flex flex-wrap gap-2 justify-center">
                {[
                    { icon: Zap, text: "Instant Access", color: "text-yellow-600 bg-yellow-50" },
                    { icon: RefreshCw, text: "Lifetime Updates", color: "text-green-600 bg-green-50" },
                    { icon: Shield, text: "Secure Payment", color: "text-blue-600 bg-blue-50" },
                ].map((item, idx) => (
                    <div key={idx} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${item.color}`}>
                        <item.icon className="w-3.5 h-3.5" />
                        {item.text}
                    </div>
                ))}
            </div>

            {/* What's Included - Premium Tab View */}
            <div className="bg-white rounded-2xl border shadow-lg overflow-hidden">
                {/* Tab Header */}
                <div className="flex bg-gray-50">
                    <button
                        onClick={() => setActiveTab('folders')}
                        className={`flex-1 py-3.5 px-4 text-sm font-semibold transition-all relative ${activeTab === 'folders'
                            ? 'bg-white text-indigo-700 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Folder className="w-4 h-4 inline-block mr-2" />
                        7 Technical Folders
                        {activeTab === 'folders' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`flex-1 py-3.5 px-4 text-sm font-semibold transition-all relative ${activeTab === 'documents'
                            ? 'bg-white text-indigo-700 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <FileText className="w-4 h-4 inline-block mr-2" />
                        Documents & Resources
                        {activeTab === 'documents' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
                        )}
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-4">
                    {activeTab === 'folders' ? (
                        <div className="space-y-2.5">
                            {technicalFolders.map((folder, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all group"
                                >
                                    <div className={`w-11 h-11 bg-gradient-to-br ${folder.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 text-xl group-hover:scale-110 transition-transform`}>
                                        {folder.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-gray-900">{folder.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{folder.topics}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {documents.map((doc, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all group ${doc.highlight
                                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 hover:border-indigo-300'
                                        : 'bg-gradient-to-r from-gray-50 to-white border-gray-100 hover:border-gray-200'
                                        } hover:shadow-md`}
                                >
                                    <div className={`w-11 h-11 ${doc.highlight ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 text-xl group-hover:scale-110 transition-transform`}>
                                        {doc.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-sm text-gray-900">{doc.name}</p>
                                            {doc.highlight && (
                                                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 text-[10px] px-1.5 py-0">Popular</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">{doc.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Value Comparison - Why Choose This */}
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-5 border border-indigo-100/50">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                    <Award className="w-5 h-5 text-indigo-600" />
                    Why ₹299 is a No-Brainer
                </h3>

                <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: "Mock Interview", price: "₹500-2,000", icon: "🎤" },
                            { label: "Placement Course", price: "₹15,000+", icon: "📚" },
                            { label: "Interview Coaching", price: "₹10,000+", icon: "👨‍🏫" },
                            { label: "Resume Help", price: "₹1,000+", icon: "📄" },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                                <span className="text-lg">{item.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-600 truncate">{item.label}</p>
                                    <p className="text-sm font-bold text-red-600">{item.price}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-dashed border-gray-200 flex items-center justify-between">
                        <span className="text-sm text-gray-600">Get ALL this in one kit</span>
                        <span className="text-xl font-black text-green-600">Just ₹299</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                    {[
                        { icon: BookOpen, text: "Complete CS Coverage" },
                        { icon: Target, text: "Interview-Focused" },
                        { icon: Download, text: "Instant Access" },
                        { icon: RefreshCw, text: "Lifetime Updates" },
                        { icon: Brain, text: "200+ Questions" },
                        { icon: Trophy, text: "Proven Results" },
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-white/70 rounded-lg p-2">
                            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <item.icon className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="font-medium text-xs">{item.text}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Success Stories - Premium Cards */}
            <div className="bg-white rounded-2xl border shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Recent Placement Success
                    <Badge className="bg-green-100 text-green-700 border-0 ml-auto text-xs">Verified</Badge>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {successStories.map((story, idx) => (
                        <div key={idx} className="p-3 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md hover:border-green-200 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                                    {story.image}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-xs text-gray-900 truncate">{story.name}</p>
                                    <p className="text-[10px] text-gray-500">{story.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between bg-green-50 rounded-lg p-2">
                                <span className="text-xs text-gray-600">{story.company}</span>
                                <span className="font-bold text-green-600 text-sm">{story.package}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FAQ Section - Cleaner Design */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-600" />
                        Frequently Asked Questions
                    </h3>
                </div>
                <div className="divide-y">
                    {faqs.map((faq, idx) => (
                        <button
                            key={idx}
                            onClick={() => setExpandedSection(expandedSection === idx ? null : idx)}
                            className="w-full p-4 text-left hover:bg-gray-50/50 transition-colors"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <span className="font-medium text-sm text-gray-900">{faq.q}</span>
                                <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${expandedSection === idx ? 'rotate-180' : ''
                                    }`} />
                            </div>
                            <div className={`overflow-hidden transition-all duration-200 ${expandedSection === idx ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                                <p className="text-sm text-gray-600 pr-8 bg-indigo-50/50 p-3 rounded-lg">{faq.a}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Pricing & CTA - Premium Gradient */}
            <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white overflow-hidden">
                {/* Background effects */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-[80px]" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-300 rounded-full blur-[80px]" />
                </div>

                <div className="relative z-10">
                    {/* Limited Time Banner */}
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4 inline-flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-xs font-semibold">94% OFF – Limited Time Offer</span>
                    </div>

                    <div className="text-center mb-5">
                        <p className="text-indigo-200 text-sm mb-2">Complete Placement Kit</p>
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-5xl font-black">₹299</span>
                            <div className="text-left">
                                <span className="text-xl text-white/60 line-through block">₹4,999</span>
                                <Badge className="bg-white/20 text-white border-0 text-xs font-bold">
                                    Save ₹4,700
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <PaymentButton
                        amount={299}
                        originalAmount={4999}
                        planName="Ultimate Campus Placement Kit"
                        buttonText="Get Instant Access →"
                        className="w-full h-14 text-lg font-bold bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]"
                    />

                    <div className="mt-4 flex items-center justify-center gap-4 text-xs text-white/80">
                        <span className="flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Secure Payment
                        </span>
                        <span className="flex items-center gap-1">
                            <Download className="w-3 h-3" /> Instant Access
                        </span>
                        <span className="flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> Free Updates
                        </span>
                    </div>
                </div>
            </div>

            {/* Trust Footer - Enhanced */}
            <div className="text-center py-2">
                <div className="flex items-center justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    ))}
                </div>
                <p className="text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">4.95 out of 5</span> based on 2,847 verified reviews
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px] text-gray-500">
                        <Shield className="w-3 h-3 mr-1" />
                        Trusted by 12,450+ Students
                    </Badge>
                </div>
            </div>
        </div>
    )
}
