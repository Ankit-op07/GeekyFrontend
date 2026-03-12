// components/company-wise-kit-landing.tsx
"use client"

import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { appConstants } from "@/lib/appConstants"
import {
    Building2, Check, Users, ChevronDown, Sparkles, Target,
    CheckCircle2, Flame, TrendingUp, Crown, Star, Zap
} from "lucide-react"

const companies = [
    { name: "Google", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" },
    { name: "Amazon", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" },
    { name: "Microsoft", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg" },
    { name: "Meta", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/facebook/facebook-original.svg" },
    { name: "Apple", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apple/apple-original.svg" },
    { name: "Netflix", logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" },
    { name: "Uber", logo: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png" },
    { name: "LinkedIn", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg" },
    { name: "Adobe", logo: "https://upload.wikimedia.org/wikipedia/commons/8/8d/Adobe_Corporate_Logo.png" },
    { name: "Flipkart", logo: "https://static-assets-web.flixcart.com/fk-sp-static/images/preloader.svg" },
]

const features = [
    "15+ top tech companies",
    "1700+ verified questions",
    "Timeline filters (45 days, 6 months, 1 year)",
    "Track your progress",
    "Weekly updates",
    "Direct LeetCode links",
]

export function CompanyWiseKitLanding() {
    const router = useRouter()
    const { company_kit_plans } = appConstants()

    const handleSelectPlan = (planId: string) => {
        router.push(`/company-wise-kit/checkout?plan=${planId}`)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
            {/* Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full blur-[120px] opacity-20" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full blur-[120px] opacity-20" />
            </div>

            <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-16">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full mb-6 border border-white/20">
                        <Users className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-semibold">Trusted by 100K+ Engineers</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight">
                        Company Wise{" "}
                        <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
                            DSA Questions
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-8">
                        Practice real interview questions from top tech companies.
                        Filter by timeline. Track your progress. Land your dream job.
                    </p>

                    {/* Stats */}
                    <div className="flex justify-center gap-8 md:gap-12 mb-12">
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-black text-yellow-400">15+</div>
                            <div className="text-sm text-slate-400">Companies</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-black text-green-400">1700+</div>
                            <div className="text-sm text-slate-400">Questions</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-black text-blue-400">Weekly</div>
                            <div className="text-sm text-slate-400">Updates</div>
                        </div>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
                    {Object.values(company_kit_plans).map((plan: any) => (
                        <Card
                            key={plan.id}
                            className={`relative bg-white/5 backdrop-blur-xl border-white/10 overflow-hidden transition-all duration-300 hover:scale-105 hover:bg-white/10 ${plan.popular ? 'ring-2 ring-yellow-400 scale-105' : ''
                                } ${plan.bestValue ? 'ring-2 ring-green-400' : ''}`}
                        >
                            {/* Badge */}
                            {plan.popular && (
                                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-black py-1.5 text-center text-sm font-bold">
                                    <Star className="w-4 h-4 inline mr-1" />
                                    MOST POPULAR
                                </div>
                            )}
                            {plan.bestValue && (
                                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-1.5 text-center text-sm font-bold">
                                    <Zap className="w-4 h-4 inline mr-1" />
                                    BEST VALUE
                                </div>
                            )}

                            <div className={`p-6 ${plan.popular || plan.bestValue ? 'pt-12' : ''}`}>
                                {/* Plan Name */}
                                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                                <p className="text-slate-400 text-sm mb-4">{plan.duration} access</p>

                                {/* Price */}
                                <div className="mb-6">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black text-white">₹{plan.price}</span>
                                        <span className="text-lg text-slate-500 line-through">₹{plan.originalPrice}</span>
                                    </div>
                                    {plan.perMonth && (
                                        <p className="text-green-400 text-sm mt-1">~₹{plan.perMonth}/month</p>
                                    )}
                                </div>

                                {/* Features */}
                                <ul className="space-y-2 mb-6">
                                    {features.slice(0, 4).map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                                            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA Button */}
                                <Button
                                    onClick={() => handleSelectPlan(plan.id)}
                                    className={`w-full h-12 font-bold rounded-xl transition-all ${plan.popular
                                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black'
                                        : plan.bestValue
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                                        }`}
                                >
                                    Get Started
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Company Logos */}
                <div className="mb-16">
                    <p className="text-center text-slate-400 text-sm mb-6">Questions from top companies:</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        {companies.map((company) => (
                            <div
                                key={company.name}
                                className="bg-white/5 backdrop-blur rounded-xl px-4 py-3 flex items-center gap-3 border border-white/10 hover:bg-white/10 transition-colors"
                            >
                                <img
                                    src={company.logo}
                                    alt={company.name}
                                    className="w-6 h-6 object-contain"
                                />
                                <span className="text-sm font-medium text-white">{company.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Features Grid */}
                <div className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10 mb-16">
                    <h2 className="text-2xl font-bold text-center mb-8">What's Included</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Building2 className="w-7 h-7 text-purple-400" />
                            </div>
                            <h3 className="font-bold mb-2">15+ Companies</h3>
                            <p className="text-sm text-slate-400">Google, Amazon, Meta, Microsoft, Apple & more</p>
                        </div>
                        <div className="text-center">
                            <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Target className="w-7 h-7 text-blue-400" />
                            </div>
                            <h3 className="font-bold mb-2">Timeline Filters</h3>
                            <p className="text-sm text-slate-400">Last 45 days, 6 months, 1 year, or all time</p>
                        </div>
                        <div className="text-center">
                            <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <TrendingUp className="w-7 h-7 text-green-400" />
                            </div>
                            <h3 className="font-bold mb-2">Progress Tracking</h3>
                            <p className="text-sm text-slate-400">Mark solved questions & track your prep</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="text-center text-slate-500 text-xs">
                    <div className="flex flex-wrap justify-center gap-4 mb-4">
                        <a href="/contact" className="hover:text-white transition-colors">Contact</a>
                        <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
                        <a href="/terms" className="hover:text-white transition-colors">Terms</a>
                        <a href="/refund" className="hover:text-white transition-colors">Refund</a>
                    </div>
                    <p>© 2026 Geeky Frontend. All rights reserved.</p>
                </footer>
            </div>
        </div>
    )
}
