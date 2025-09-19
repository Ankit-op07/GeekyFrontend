"use client"
// components/pricing.tsx
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PaymentButton } from '@/components/payment-button';
import { useDevicePricing } from '@/hooks/use-device-detection';
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link"
import { appConstants } from "@/lib/appConstants";

export function Pricing() {
  const { js, complete, experiences, isLoading } = useDevicePricing();
      const { js_kit_price, js_kit_original_price, discount_percentage, complete_kit_price, complete_kit_original_price  } = appConstants();
  
  // Show loading state while detecting device
  if (isLoading) {
    return <PricingSkeletonLoader />;
  }
  
  const plans = [
    {
      name: "JS Interview Preparation Kit",
      description: "JavaScript focused preparation",
      priceINR: js_kit_price,
      originalPriceINR: js_kit_original_price,
      discountPercentage: discount_percentage,
      popular: false,
      previewUrl: "https://drive.google.com/file/d/11t2PZoGjKk7dcOchtIEYizLV51DDbuDH/view?usp=sharing",
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
    },
    {
      name: "Complete Frontend Interview Preparation Kit",
      description: "End-to-end interview preparation",
      priceINR: complete_kit_price,
      originalPriceINR: complete_kit_original_price,
      discountPercentage: discount_percentage,
      popular: true,
      features: [
        "JS Interview Preparation Kit content included",
        "Resources to learn Frontend (Gold Mine)",
        "React interview questions & patterns",
        "HTML & CSS mastery for interview questions",
        "Web performance and security",
        "DSA for Frontend: Must know problems",
        "Machine coding practice: components & mini-apps",
        "Cold Email Templates and How to Cold email guide (Bonus)",
        "Regular updates included",
        "Lifetime access",
      ],
    },
    {
      name: "Frontend Interview Experiences Kit",
      description: "Real interview insights",
      priceINR: 299,
      originalPriceINR: 2999,
      discountPercentage: 90,
      popular: false,
      features: [
        "30+ curated interview experiences (SDE/Frontend)",
        "Company-wise patterns and rounds breakdown",
        "Role/seniority expectations & common pitfalls",
        "Questions that actually appeared",
        "Post-offer insights: timelines & negotiation pointers",
        "Regular updates included",
        "Lifetime access",
      ],
    },
  ] as const;

  return (
    <section id="pricing" className="mx-auto max-w-7xl px-4 py-12 md:py-20">
      <header className="text-center mb-8">
        {/* Limited time badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1 text-xs font-bold text-red-600 dark:text-red-400 mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          LIMITED TIME: {plans[0].discountPercentage}% OFF
        </div>
        
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2">
          Simple Pricing
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          One-time payment, lifetime access
        </p>

        {/* Trust indicators */}
        <div className="mt-6 flex justify-center items-center gap-3 sm:gap-6 flex-wrap text-xs sm:text-sm">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Instant Access</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">2500+ Developers</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Secure Payment</span>
          </div>
        </div>
      </header>

      {/* Mobile-first card layout */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        {plans.map((p, index) => {
          const hasDiscount = p.originalPriceINR !== null && p.discountPercentage !== null
          
          return (
            <Card 
              key={p.name} 
              className={`relative flex flex-col ${
                p.popular 
                  ? `border-2 border-blue-500 shadow-lg md:scale-105` 
                  : 'border hover:shadow-md transition-shadow'
              }`}
            >
              {/* Popular badge */}
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-flex items-center rounded-full bg-blue-500 px-3 py-0.5 text-xs font-bold text-white whitespace-nowrap">
                    MOST POPULAR
                  </span>
                </div>
              )}

              {/* Discount badge */}
              {hasDiscount && (
                <div className="absolute -top-2 -right-2 z-10">
                  <span className="inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                    -{p.discountPercentage}%
                  </span>
                </div>
              )}
              
              <CardHeader className="pb-3">
                {/* Title */}
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-base sm:text-lg">{p.name}</CardTitle>
                </div>
                
                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold">
                    ₹{p.priceINR || "Custom"}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm sm:text-base text-muted-foreground line-through">
                      ₹{p.originalPriceINR}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
              </CardHeader>

              <CardContent className="flex-1 py-3">
                <ul className="space-y-1.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2 text-xs sm:text-sm">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-foreground/80">{f}</span>
                    </li>
                  ))}
                  {/* {p.features.length > 5 && (
                    <li className="text-xs text-muted-foreground pl-6">
                      +{p.features.length - 5} more features
                    </li>
                  )} */}
                </ul>
              </CardContent>

              <CardFooter className="flex flex-col gap-2 pt-3">
                <PaymentButton
                  amount={p.priceINR}
                  originalAmount={p.originalPriceINR || undefined}
                  planName={p.name}
                  buttonText={index === 2 ? "Coming Soon" : "Get Access"}
                  className={`w-full h-10 text-sm font-semibold ${
                    p.popular 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                  disabled={index === 2}
                />
                
                <Link href="/preview" className="w-full">
                  <button className="w-full h-9 inline-flex items-center justify-center rounded-md border text-xs font-medium hover:bg-accent/50 transition-colors">
                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  Preview Content
                  </button>
                </Link>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Bottom note */}
      <p className="text-center text-xs sm:text-sm text-muted-foreground mt-8">
        ✓ Instant access after payment • ✓ Lifetime updates included • ✓ 100% genuine content
      </p>
    </section>
  )
}

// Skeleton loader for pricing section
function PricingSkeletonLoader() {
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-4 py-12 md:py-20">
      <div className="text-center mb-8">
        <Skeleton className="h-8 w-48 mx-auto mb-4" />
        <Skeleton className="h-10 w-64 mx-auto mb-2" />
        <Skeleton className="h-6 w-48 mx-auto" />
      </div>
      
      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="relative flex flex-col">
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-10 w-24" />
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}