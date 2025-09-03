import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PaymentButton } from '@/components/payment-button';


const plans = [
  {
    name: "JS Interview Preparation Kit",
    description: "Topic-wise curated questions, patterns, and tricks to ace JavaScript interviews.",
    priceINR: 49,
    originalPriceINR: 99,
    discountPercentage: 50,
    popular: false,
    previewUrl: "https://drive.google.com/file/d/11t2PZoGjKk7dcOchtIEYizLV51DDbuDH/view?usp=sharing",
    paymentUrl: "https://rzp.io/rzp/IbkHIh2u",
    features: [
      "JS Interview preparation questions",
      "Tricky JS questions asked in interviews",
      "Polyfill and modern JS questions",
      "JS and React patterns and Solid principles",
      "Topic-wise breakdown: closures, async, prototypes, etc.",
      "Lightweight cheat-sheets and notes",
      "Regular updates included",
    ],
  },
  {
    name: "Complete Frontend Interview Preparation Kit",
    description: "End-to-end frontend prep: JS, React, HTML/CSS, Performance, DSA (JS), Machine Coding, Cold Emailing.",
    priceINR: 149,
    originalPriceINR: 299,
    discountPercentage: 50,
    popular: true,
    previewUrl: "https://docs.google.com/document/d/1PaZqenxA8LFhBiHVIm84A3pZBCdEDxZxzSC6bauPCLc/edit?usp=sharing",
    paymentUrl: "https://rzp.io/rzp/fmvRcM3",
    features: [
      "JS Interview Preparation Kit included",
      "Resources to learn Frontend (Gold Mine)",
      "React interview questions & patterns",
      "HTML & CSS mastery for interview questions",
      "Web performance and security",
      "DSA for Frontend: Must know problems",
      "Machine coding practice: components & mini-apps",
      "Cold Email Templates and How to Cold email guide (Bonus)",
      "Regular updates included",
    ],
  },
  {
    name: "Frontend Interview Experiences Kit",
    description: "Real-world interview experiences, formats, and debriefs across companies.",
    priceINR: 399,
    originalPriceINR: null,
    discountPercentage: null,
    popular: false,
    previewUrl: "https://drive.google.com/file/d/1Lrkv2ZewJ02YTp4meqcEXFZ92z2DTgE-/view?usp=sharing",
    paymentUrl: "",
    features: [
      "30+ curated interview experiences (SDE/Frontend)",
      "Company-wise patterns and rounds breakdown",
      "Role/seniority expectations & common pitfalls",
      "Questions that actually appeared",
      "Post-offer insights: timelines & negotiation pointers",
    ],
  },
] as const

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-12 md:py-16">
      <header className="text-center mb-8 md:mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Pricing
        </div>
        <h2 className="mt-3 text-pretty font-serif text-2xl md:text-4xl font-bold tracking-tight text-foreground">
          Simple, one-time pricing
        </h2>
        <p className="mt-2 text-muted-foreground">Pay once. Keep access forever. Designed for Indian interviews.</p>
      </header>

      <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => {
          const isCustom = p.priceINR === null
          const hasDiscount = p.originalPriceINR !== null && p.discountPercentage !== null
          
          return (
            <Card key={p.name} className="flex h-full flex-col relative">
              {hasDiscount && (
                <div className="absolute -top-3 -right-2 z-10">
                  <span className="inline-flex items-center rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow-md">
                    {p.discountPercentage}% OFF
                  </span>
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{p.name}</CardTitle>
                  {p.popular && (
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
                      Best
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">
                    {isCustom ? "Custom" : `₹${p.priceINR}`}
                  </span>
                  {hasDiscount && (
                    <span className="text-lg text-muted-foreground line-through">
                      ₹{p.originalPriceINR}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{p.description}</p>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-2 text-sm text-foreground/80">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span aria-hidden="true">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="mt-auto flex gap-2">
                <PaymentButton
  amount={p.priceINR}
  planName={p.name}
  buttonText="Buy Now"
  className="w-1/2"
  disabled={p.name === "Frontend Interview Experiences Kit"}
/>
                <a
                  href={p.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-full items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground hover:bg-accent/50"
                  aria-label={`Preview ${p.name} sample`}
                >
                  Preview
                </a>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </section>
  )
}