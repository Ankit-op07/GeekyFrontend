// app/company-wise-kit/success/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    CheckCircle2, Sparkles, Rocket, ArrowRight,
    PartyPopper, Star, Zap
} from "lucide-react"

export default function SuccessPage() {
    const router = useRouter()
    const [countdown, setCountdown] = useState(5)

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    router.push('/company-wise-kit')
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [router])

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-purple-50 flex items-center justify-center p-4">
            {/* Confetti effect placeholder */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute animate-bounce"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 50}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 2}s`,
                        }}
                    >
                        {i % 3 === 0 ? (
                            <Star className="w-4 h-4 text-yellow-400" />
                        ) : i % 3 === 1 ? (
                            <Sparkles className="w-4 h-4 text-purple-400" />
                        ) : (
                            <Zap className="w-3 h-3 text-blue-400" />
                        )}
                    </div>
                ))}
            </div>

            <Card className="max-w-md w-full p-8 text-center shadow-2xl border-0 bg-white/90 backdrop-blur relative overflow-hidden">
                {/* Success Animation */}
                <div className="relative mb-6">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                        <CheckCircle2 className="w-16 h-16 text-green-500" />
                    </div>
                    <PartyPopper className="absolute top-0 right-1/4 w-8 h-8 text-yellow-500 animate-bounce" />
                </div>

                <h1 className="text-3xl font-black text-gray-900 mb-2">
                    Payment Successful! 🎉
                </h1>

                <p className="text-gray-600 mb-6">
                    Welcome to the Company Wise DSA Kit!
                    <br />
                    Your 30-day access is now active.
                </p>

                {/* What's Next */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-6 text-left">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-purple-600" />
                        What's Next?
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600 font-bold">1.</span>
                            Browse questions from 15+ top tech companies
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600 font-bold">2.</span>
                            Filter by timeline to focus on recent questions
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600 font-bold">3.</span>
                            Track your progress as you solve questions
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600 font-bold">4.</span>
                            Ace your interviews and land your dream job!
                        </li>
                    </ul>
                </div>

                {/* CTA Button */}
                <Button
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 mb-4"
                    onClick={() => router.push('/company-wise-kit')}
                >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start Practicing Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                <p className="text-sm text-gray-400">
                    Redirecting in {countdown} seconds...
                </p>
            </Card>
        </div>
    )
}
