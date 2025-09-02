import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function PricingEnhanced() {
  return (
    <section id="pricing" className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <span>Pricing</span>
        </div>
        <h2 className="mt-3 text-2xl md:text-3xl font-semibold">Choose your kit</h2>
        <p className="mt-2 text-muted-foreground">
          Straightforward plans priced in ₹ with content aligned to interviews.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* JS Kit */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-lg">JS Interview Preparation Kit</CardTitle>
              <div className="mt-1 text-2xl font-semibold">₹99</div>
            </CardHeader>
            <CardContent className="text-sm text-foreground/80">
              <ul className="space-y-2">
                <li>- PDFs with topic-wise and company-wise JS questions</li>
                <li>- ES6+, closures, async/await, prototypes, event loop</li>
                <li>- Compact explanations for quick revision</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                aria-label="Buy JS Interview Preparation Kit"
              >
                Buy Now
              </Button>
            </CardFooter>
          </Card>

          {/* Complete FE Kit - highlighted */}
          <Card className="relative border-2 border-secondary">
            <div className="absolute right-3 top-3 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
              Recommended
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Complete Frontend Preparation Kit</CardTitle>
              <div className="mt-1 text-2xl font-semibold">₹299</div>
            </CardHeader>
            <CardContent className="text-sm text-foreground/80">
              <ul className="space-y-2">
                <li>- Everything in JS Kit</li>
                <li>- React fundamentals and patterns</li>
                <li>- HTML/CSS + accessibility essentials</li>
                <li>- Web performance checklists</li>
                <li>- Machine coding round practice</li>
                <li>- DSA essentials for FE interviews</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                aria-label="Buy Complete Frontend Preparation Kit"
              >
                Buy Now
              </Button>
            </CardFooter>
          </Card>

          {/* Interview Experiences Kit */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Frontend Interview Experiences Kit</CardTitle>
              <div className="mt-1 text-2xl font-semibold">Contact</div>
            </CardHeader>
            <CardContent className="text-sm text-foreground/80">
              <ul className="space-y-2">
                <li>- Round-by-round walkthroughs</li>
                <li>- Communication tips and trade-offs</li>
                <li>- Role-focused prep guidance</li>
                <li>- Framework-agnostic checklists</li>
              </ul>
            </CardContent>
            <CardFooter>
              <a
                href="mailto:your-email@example.com?subject=Geeky%20Frontend%20-%20Experiences%20Kit&body=Hi%2C%20I%27m%20interested%20in%20the%20Frontend%20Interview%20Experiences%20Kit."
                className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                aria-label="Contact for Interview Experiences Kit"
              >
                Contact Us
              </a>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  )
}
