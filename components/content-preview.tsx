import Link from "next/link"

export function ContentPreview() {
  return (
    <section className="border-t bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-20">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 dark:bg-green-900/20 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400 mb-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            100% Transparency
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
            See Exactly What You'll Get
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-2xl mx-auto">
            Browse through the complete content structure of each kit. No surprises, no hidden content.
          </p>

          {/* Preview Cards */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
            <div className="bg-card rounded-lg p-4 border hover:shadow-md transition-all">
              <span className="text-2xl mb-2 block">📚</span>
              <h3 className="font-semibold text-sm mb-1">JS Interview Kit</h3>
              <p className="text-xs text-muted-foreground mb-3">4 comprehensive files</p>
              <div className="text-xs text-left space-y-1 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span>✓</span> Interview Questions
                </div>
                <div className="flex items-center gap-1">
                  <span>✓</span> Patterns & Principles
                </div>
                <div className="flex items-center gap-1">
                  <span>✓</span> Tricky Questions
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border-2 border-blue-500 relative">
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">POPULAR</span>
              <span className="text-2xl mb-2 block">🚀</span>
              <h3 className="font-semibold text-sm mb-1">Complete Frontend</h3>
              <p className="text-xs text-muted-foreground mb-3">11 comprehensive files</p>
              <div className="text-xs text-left space-y-1 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span>✓</span> Everything in JS Kit
                </div>
                <div className="flex items-center gap-1">
                  <span>✓</span> React & HTML/CSS
                </div>
                <div className="flex items-center gap-1">
                  <span>✓</span> DSA & Performance
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">★</span> Bonus: Resources
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg p-4 border hover:shadow-md transition-all">
              <span className="text-2xl mb-2 block">💼</span>
              <h3 className="font-semibold text-sm mb-1">Interview Experiences</h3>
              <p className="text-xs text-muted-foreground mb-3">Coming Soon</p>
              <div className="text-xs text-left space-y-1 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span>✓</span> 30+ Experiences
                </div>
                <div className="flex items-center gap-1">
                  <span>✓</span> Company Insights
                </div>
                <div className="flex items-center gap-1">
                  <span>✓</span> Negotiation Tips
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Link href="/preview">
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all group">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Explore Full Content Structure
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </Link>

          <p className="text-xs text-muted-foreground mt-4">
            No signup required • Browse complete file structure • See exact content you'll receive
          </p>
        </div>
      </div>
    </section>
  )
}