import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter as UIDialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"

const AfterPaymentInstructions = () => (
  <div className="payment-instructions space-y-3">
    <h3 className="text-base font-semibold text-foreground">After Payment:</h3>
    <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
      <li>Take screenshot of payment confirmation</li>
      <li>Send to WhatsApp: +91-9166011247 or</li>
      <li>Send Email to: dhakedbhai786@gmail.com</li>
      <li>Include: Your email + Course name</li>
      <li>Receive access within  10 minutes</li>
    </ol>
  </div>
)

const plans = [
  {
    name: "JS Interview Preparation Kit",
    description: "Company-wise PDFs and topic-wise question sets for JS rounds.",
    priceINR: 99,
    popular: false,
    previewUrl: "https://drive.google.com/file/d/11t2PZoGjKk7dcOchtIEYizLV51DDbuDH/view?usp=sharing", // TODO: replace with your public Drive URL
    paymentUrl: "https://rzp.io/rzp/yaPSvlmX",
    features: [
      "Topic-wise breakdown: closures, async, prototypes, etc.",
      "Curated coding prompts for JS-only rounds",
      "Lightweight cheat-sheets and notes",
      "Quarterly updates included",
    ],
  },
  {
    name: "Complete Frontend Preparation Kit",
    description: "End-to-end frontend prep: JS, React, HTML/CSS, Performance, DSA (JS), Machine Coding.",
    priceINR: 299,
    popular: true,
    previewUrl: "https://docs.google.com/document/d/1PaZqenxA8LFhBiHVIm84A3pZBCdEDxZxzSC6bauPCLc/edit?usp=sharing", // TODO: replace with your public Drive URL
    paymentUrl: "https://rzp.io/rzp/OazwmQ8Q",
    features: [
      "Modern JavaScript deep-dive + patterns",
      "React fundamentals to advanced (hooks, state, patterns)",
      "HTML & CSS mastery for interviews",
      "Web performance essentials & profiling tips",
      "DSA in JavaScript: must-know problems",
      "Machine coding practice: components & mini-apps",
      "Resources to learn Frontend (Gold Mine)"
    ],
  },
  {
    name: "Frontend Interview Experiences Kit",
    description: "Real-world interview experiences, formats, and debriefs across companies.",
    priceINR: 399, // custom price (don’t invent)
    popular: false,
    previewUrl: "https://drive.google.com/file/d/1Lrkv2ZewJ02YTp4meqcEXFZ92z2DTgE-/view?usp=sharing", // TODO: replace with your public Drive URL
    paymentUrl: "https://rzp.io/rzp/F14S3la",
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
          return (
            <Card key={p.name} className="flex h-full flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{p.name}</CardTitle>
                  {p.popular && (
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
                      Best
                    </span>
                  )}
                </div>
                <div className="mt-1 text-2xl font-semibold">{isCustom ? "Custom" : `₹${p.priceINR}`}</div>
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
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      aria-label={`Purchase ${p.name}`}
                    >
                      Buy Now
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Complete purchase — {p.name}</DialogTitle>
                      <DialogDescription>
                        Pay securely using the button below. Then follow the instructions to get access.
                      </DialogDescription>
                    </DialogHeader>

                    <AfterPaymentInstructions />

                    <UIDialogFooter className="mt-4 flex gap-2">
                      <a
                        href={p.paymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        aria-label={`Proceed to payment for ${p.name}`}
                      >
                        Proceed to Payment
                      </a>
                      <DialogClose asChild>
                        <button
                          type="button"
                          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-accent/50"
                        >
                          Close
                        </button>
                      </DialogClose>
                    </UIDialogFooter>
                  </DialogContent>
                </Dialog>

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

