// components/pricing.tsx
"use client"
import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PaymentButton } from '@/components/payment-button';
import { useDevicePricing } from '@/hooks/use-device-detection';
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link"
import { appConstants } from "@/lib/appConstants";
import { Check, Star, Zap, Shield, Clock, Eye, ArrowRight, Sparkles, Crown, Rocket, TrendingUp } from "lucide-react"

export function Pricing() {
  const { js, complete, experiences, isLoading } = useDevicePricing();
  const { js_kit_price, js_kit_original_price, discount_percentage, complete_kit_price, complete_kit_original_price } = appConstants();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  
  // Show loading state while detecting device
  if (isLoading) {
    return <PricingSkeletonLoader />;
  }
  
  const plans = [
    {
      name: "JS Interview Kit",
      fullName: "JS Interview Preparation Kit",
      description: "Master JavaScript fundamentals",
      priceINR: js_kit_price,
      originalPriceINR: js_kit_original_price,
      discountPercentage: discount_percentage,
      popular: false,
      icon: <Zap className="w-6 h-6" />,
      color: "from-yellow-400 to-orange-500",
      bgGradient: "from-yellow-50 via-amber-50/50 to-orange-50",
      shadowColor: "shadow-yellow-200",
      previewUrl: "/preview",
      badge: "FOUNDATION",
      savings: js_kit_original_price - js_kit_price,
      features: [
        "JS Interview preparation questions",
        "Tricky JS questions asked in interviews",
        "Polyfill and modern JS questions",
        "JS and React patterns and Solid principles",
        "Topic-wise breakdown: closures, async, prototypes, etc.",
        "Lightweight cheat-sheets and notes",
        "Regular updates included",
        "Lifetime access",
      ],
      highlights: ["500+ Questions", "Quick Notes", "Weekly Updates"]
    },
    {
      name: "Frontend Mastery Pro Interview Kit",
      fullName: "Frontend Mastery Pro Interview Preparation Kit",
      description: "Everything you need to crack frontend interviews",
      priceINR: complete_kit_price,
      originalPriceINR: complete_kit_original_price,
      discountPercentage: discount_percentage,
      previewUrl: "/preview",
      popular: true,
      icon: <Crown className="w-6 h-6" />,
      color: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 via-pink-50/50 to-rose-50",
      shadowColor: "shadow-purple-200",
      badge: "BEST VALUE",
      savings: complete_kit_original_price - complete_kit_price,
      features: [
        "JS Interview Preparation Kit content included",
        "Resources to learn Frontend (Gold Mine)",
        "React interview questions & patterns",
        "HTML & CSS mastery for interview questions",
        "Web performance and security",
        "DSA for Frontend: Must know problems",
        "Machine coding practice: components & mini-apps",
        "Cold Email Templates and How to Cold email guide (Bonus)",
        "Include Real Interview Experiences ",
        "Regular updates included",
        "Lifetime access",
      ],
      highlights: ["All-in-One", "DSA Included", "Premium Support"]
    },
    {
      name: "Interview Experiences",
      fullName: "Frontend Interview Experiences Kit",
      description: "Learn from real experiences",
      priceINR: 299,
      originalPriceINR: 2999,
      discountPercentage: 90,
      popular: false,
      icon: <Rocket className="w-6 h-6" />,
      color: "from-indigo-500 to-purple-600",
      bgGradient: "from-indigo-50 via-purple-50/50 to-indigo-50",
      shadowColor: "shadow-indigo-200",
      badge: "INSIDER",
      savings: 2700,
      comingSoon: true,
      features: [
        "30+ curated interview experiences (SDE/Frontend)",
        "Company-wise patterns and rounds breakdown",
        "Role/seniority expectations & common pitfalls",
        "Questions that actually appeared",
        "Post-offer insights: timelines & negotiation pointers",
        "Regular updates included",
        "Lifetime access",
      ],
      highlights: ["30+ Stories", "Real Questions", "Negotiation Tips"]
    },
  ] as const;

  return (
    <section id="pricing" className="relative py-16 md:py-24 overflow-hidden">
      {/* Premium background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50/50" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      </div>

      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <header className="text-center mb-12">
          {/* Limited time badge */}
          <div className="inline-flex items-center gap-2 mb-6 animate-bounce">
            <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 px-4 py-1.5 text-xs font-bold shadow-lg">
              <Sparkles className="w-4 h-4 mr-1.5 animate-pulse" />
              LIMITED TIME: {discount_percentage}% OFF ALL KITS
            </Badge>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gray-900">Invest in Your</span>
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent ml-2">
              Future
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            One-time payment, lifetime value. Join thousands who've landed their dream jobs.
          </p>

          {/* Value props */}
          {/* <div className="mt-8 flex justify-center items-center gap-8 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-500">Instant</p>
                <p className="text-sm font-semibold">Download</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-500">Secure</p>
                <p className="text-sm font-semibold">Payment</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-500">Lifetime</p>
                <p className="text-sm font-semibold">Access</p>
              </div>
            </div>
          </div> */}
        </header>

        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-3 lg:gap-10 mb-12">
          {plans.map((plan, index) => {
            const isHovered = hoveredCard === index;
            
            return (
              <div
                key={plan.name}
                className={`relative ${plan.popular ? 'md:-mt-4' : ''}`}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Popular glow effect */}
                {plan.popular && (
                  <div className="absolute -inset-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl opacity-20 blur-2xl animate-pulse" />
                )}

                <Card 
                  className={`
                    relative h-full transition-all duration-500 border-0 rounded-2xl
                    ${isHovered ? 'transform -translate-y-2 scale-[1.02]' : ''}
                    ${plan.comingSoon ? 'opacity-90' : ''}
                  `}
                  style={{
                    background: `linear-gradient(135deg, ${plan.bgGradient})`,
                    boxShadow: isHovered 
                      ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' 
                      : '0 10px 30px -10px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  {/* Card background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${plan.bgGradient} opacity-50 rounded-2xl`} />

                  {/* Top badges */}
                  <div className="absolute -top-3 left-0 right-0 flex justify-center gap-2 z-20">
                    {plan.popular && (
                      <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 px-4 py-1 text-xs font-bold shadow-lg">
                        <Star className="w-3 h-3 mr-1 fill-white" />
                        MOST POPULAR
                      </Badge>
                    )}
                    {plan.badge && !plan.popular && (
                      <Badge className="bg-white/90 backdrop-blur text-gray-700 border-0 px-3 py-1 text-xs font-semibold shadow-md">
                        {plan.badge}
                      </Badge>
                    )}
                  </div>

                  {/* Discount corner badge */}
                  {!plan.comingSoon && (
                    <div className="absolute -top-2 -right-2 z-20">
                      <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm px-3 py-1.5 rounded-full font-bold shadow-lg transform rotate-3 hover:rotate-6 transition-transform">
                        -{plan.discountPercentage}%
                      </div>
                    </div>
                  )}

                  <CardHeader className="relative z-10 pb-4">
                    {/* Icon */}
                    <div className="mb-4">
                      <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center shadow-lg mx-auto transform ${isHovered ? 'rotate-6 scale-110' : ''} transition-all duration-300`}>
                        <div className="text-white">{plan.icon}</div>
                      </div>
                    </div>

                    {/* Title */}
                    <CardTitle className="text-xl font-bold text-center text-gray-900 mb-2">
                      {plan.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 text-center">{plan.description}</p>

                    {/* Quick highlights */}
                    <div className="flex flex-wrap gap-1 justify-center mt-3">
                      {plan.highlights.map((highlight, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] px-2 py-0.5 bg-white/70">
                          {highlight}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>

                  <CardContent className="relative z-10 py-4">
                    {/* Price section */}
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-4xl font-black text-gray-900">
                          ₹{plan.priceINR}
                        </span>
                        <div className="text-left">
                          <div className="text-xs text-gray-500 line-through">₹{plan.originalPriceINR}</div>
                          <div className="text-xs font-semibold text-green-600">Save ₹{plan.savings}</div>
                        </div>
                      </div>
                    </div>

                    {/* Features list - Show all with better design */}
                    <div className="space-y-0 bg-white/50 rounded-xl p-3">
                      {plan.features.map((feature, idx) => (
                        <div 
                          key={idx} 
                          className={`flex items-start gap-2 py-1.5 ${idx !== plan.features.length - 1 ? 'border-b border-gray-100' : ''}`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                          <span className="text-xs text-gray-700 leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter className="relative z-10 flex flex-col gap-3 pt-4">
                    {/* CTA Button */}
                    {!plan.comingSoon ? (
                      <>
                        <PaymentButton
                          amount={plan.priceINR}
                          originalAmount={plan.originalPriceINR}
                          planName={plan.fullName}
                          buttonText="Get Instant Access"
                          className={`
                            w-full h-12 text-sm font-bold shadow-lg
                            ${plan.popular 
                              ? `bg-gradient-to-r ${plan.color} text-white hover:shadow-xl` 
                              : 'bg-gray-900 text-white hover:bg-gray-800'
                            }
                            transform transition-all duration-300 hover:scale-[1.02]
                            ${isHovered ? 'shadow-xl' : ''}
                          `}
                          disabled={false}
                        />
                        
                        {/* Preview link - Only for JS Kit */}
                        {plan.previewUrl && (
                          <Link href={plan.previewUrl} className="w-full">
                            <button className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-lg border-2 border-gray-200 bg-white/70 backdrop-blur text-sm font-medium hover:bg-gray-50 transition-all group">
                              <Eye className="w-4 h-4" />
                              Preview Content
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </Link>
                        )}
                      </>
                    ) : (
                      <button 
                        disabled 
                        className="w-full h-12 text-sm font-bold bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
                      >
                        Coming Soon
                      </button>
                    )}
                  </CardFooter>
                </Card>
              </div>
            )
          })}
        </div>

        {/* Bottom section */}
        <div className="text-center">
          <div className="inline-flex items-center gap-8 px-8 py-4 bg-white/80 backdrop-blur rounded-full shadow-lg">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-gray-700">2,500+ Placed</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-gray-700">4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-blue-500" />
              <span className="text-gray-700">Secure Checkout</span>
            </div>
          </div>

          <p className="mt-8 text-sm text-gray-500">
            🔒 SSL Secured • 💳 Multiple Payment Options • 📧 Instant Email Delivery
          </p>
        </div>
      </div>
    </section>
  )
}

// Skeleton loader for pricing section
function PricingSkeletonLoader() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="text-center mb-12">
        <Skeleton className="h-8 w-64 mx-auto mb-4" />
        <Skeleton className="h-12 w-96 mx-auto mb-2" />
        <Skeleton className="h-6 w-64 mx-auto" />
      </div>
      
      <div className="grid gap-8 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="relative">
            <Card className="h-full">
              <CardHeader>
                <Skeleton className="h-16 w-16 mx-auto mb-4 rounded-2xl" />
                <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-32 mx-auto mb-4" />
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-12 w-full" />
              </CardFooter>
            </Card>
          </div>
        ))}
      </div>
    </section>
  );
}