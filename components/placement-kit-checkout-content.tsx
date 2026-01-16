// components/placement-kit-checkout-content.tsx
"use client"

import { useState } from "react"
import { PaymentButton } from '@/components/payment-button'
import { Badge } from "@/components/ui/badge"
import {
    Check, Star, Lock, Download, RefreshCw, ChevronDown,
    Folder, FileText, Users, Award, TrendingUp, Shield, ArrowRight,
    BookOpen, Code, Briefcase, GraduationCap
} from "lucide-react"

export function PlacementKitCheckoutContent() {
    const [expandedSection, setExpandedSection] = useState<number | null>(null)
    const [activeTab, setActiveTab] = useState<'folders' | 'documents'>('folders')

    const technicalFolders = [
        { name: "Data Structures & Algorithms", topics: "Arrays, Trees, Graphs, DP, Sorting" },
        { name: "DBMS & SQL", topics: "Normalization, Queries, Joins, Indexes" },
        { name: "Computer Networks", topics: "OSI, TCP/IP, HTTP, DNS, Protocols" },
        { name: "Operating System", topics: "Processes, Memory, Scheduling, Deadlocks" },
        { name: "Object-Oriented Programming", topics: "Pillars, SOLID, Design Patterns" },
        { name: "System Design", topics: "Scalability, Load Balancing, Caching" },
        { name: "Software Engineering", topics: "SDLC, Agile, Testing, CI/CD" },
    ]

    const documents = [
        { name: "25+ Job Interview Scripts", desc: "Complete answers for common interview questions" },
        { name: "HR Interview Questions", desc: "50+ questions with professional responses" },
        { name: "LeetCode Problems PDF", desc: "Curated coding problems for placement prep" },
        { name: "Resume Templates", desc: "ATS-optimized formats that get shortlisted" },
        { name: "Cover Letter Templates", desc: "Professional templates for applications" },
        { name: "Companies Hiring Freshers", desc: "Updated list with application links" },
        { name: "Geeky Frontend Resources", desc: "Learning roadmaps and project ideas" },
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

    return (
        <div className="space-y-5 pb-6">
            {/* Hero Section - Professional */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <GraduationCap className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mb-2">
                            12,450+ Students Placed
                        </Badge>
                        <h1 className="text-xl md:text-2xl font-bold leading-tight">
                            Campus Placement Preparation Kit
                        </h1>
                    </div>
                </div>

                <p className="text-slate-300 text-sm mb-5">
                    Complete preparation materials for campus and off-campus placements.
                    Everything you need to crack technical and HR interviews.
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/10 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold">7</div>
                        <div className="text-xs text-slate-400">Tech Folders</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold">200+</div>
                        <div className="text-xs text-slate-400">Resources</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-xl font-bold">4.9</span>
                        </div>
                        <div className="text-xs text-slate-400">Rating</div>
                    </div>
                </div>
            </div>

            {/* What's Included - Tab View */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                {/* Tab Header */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('folders')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeTab === 'folders'
                                ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Folder className="w-4 h-4 inline-block mr-2" />
                        Technical Folders
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeTab === 'documents'
                                ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <FileText className="w-4 h-4 inline-block mr-2" />
                        Documents
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-4">
                    {activeTab === 'folders' ? (
                        <div className="space-y-2">
                            {technicalFolders.map((folder, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Folder className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-gray-900">{folder.name}</p>
                                        <p className="text-xs text-gray-500">{folder.topics}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {documents.map((doc, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-gray-900">{doc.name}</p>
                                        <p className="text-xs text-gray-500">{doc.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Value Proposition */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    Why Students Choose This Kit
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { icon: BookOpen, text: "Complete CS coverage" },
                        { icon: Code, text: "Interview-focused content" },
                        { icon: Download, text: "Instant download access" },
                        { icon: RefreshCw, text: "Free lifetime updates" },
                        { icon: Briefcase, text: "Job-ready materials" },
                        { icon: Shield, text: "Trusted by 12,450+" },
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                            <item.icon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                            <span>{item.text}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Success Stories - Clean */}
            <div className="bg-white rounded-2xl border p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Recent Placements
                </h3>
                <div className="space-y-3">
                    {[
                        { name: "Aditya S.", company: "TCS Digital", package: "7 LPA" },
                        { name: "Sneha G.", company: "Amazon", package: "12 LPA" },
                        { name: "Rohit K.", company: "Microsoft", package: "18 LPA" },
                    ].map((story, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                    {story.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-medium text-sm text-gray-900">{story.name}</p>
                                    <p className="text-xs text-gray-500">{story.company}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-green-600">{story.package}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-2xl border overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                    <h3 className="font-semibold text-gray-900">Frequently Asked Questions</h3>
                </div>
                <div className="divide-y">
                    {faqs.map((faq, idx) => (
                        <button
                            key={idx}
                            onClick={() => setExpandedSection(expandedSection === idx ? null : idx)}
                            className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <span className="font-medium text-sm text-gray-900">{faq.q}</span>
                                <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expandedSection === idx ? 'rotate-180' : ''
                                    }`} />
                            </div>
                            {expandedSection === idx && (
                                <p className="text-sm text-gray-600 mt-3 pr-8">{faq.a}</p>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Pricing & CTA */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
                <div className="text-center mb-5">
                    <p className="text-indigo-200 text-sm mb-2">Complete Kit Price</p>
                    <div className="flex items-center justify-center gap-3">
                        <span className="text-4xl font-bold">₹499</span>
                        <div className="text-left">
                            <span className="text-lg text-indigo-300 line-through block">₹4,999</span>
                            <Badge className="bg-white/20 text-white border-0 text-xs">Save 90%</Badge>
                        </div>
                    </div>
                </div>

                <PaymentButton
                    amount={499}
                    originalAmount={4999}
                    planName="Ultimate Campus Placement Kit"
                    buttonText="Get Instant Access"
                    className="w-full h-12 text-base font-semibold bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl shadow-lg"
                />

                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-indigo-200">
                    <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Secure Payment
                    </span>
                    <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" /> Instant Access
                    </span>
                    <span className="flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" /> Lifetime Updates
                    </span>
                </div>
            </div>

            {/* Trust Footer */}
            <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    ))}
                </div>
                <p className="text-xs text-gray-500">4.9 out of 5 based on 2,847 reviews</p>
            </div>
        </div>
    )
}
