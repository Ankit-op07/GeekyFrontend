import Image from "next/image"

export function Hero() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 pt-24 pb-12 md:pt-32 md:pb-20 overflow-hidden">
      {/* Animated gradient background - adjusted for mobile */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 -left-20 w-40 h-40 md:w-72 md:h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob"></div>
        <div className="absolute top-10 -right-20 w-40 h-40 md:w-72 md:h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-10 w-40 h-40 md:w-72 md:h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-4000"></div>
      </div>

      <div className="grid gap-8 md:gap-12 md:grid-cols-2 md:items-center">
        <div className="relative z-10 order-2 md:order-1">
          {/* Urgency Banner */}
          <div className="inline-flex items-center gap-2 rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 mb-4 animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            🔥 Limited Time: 50% OFF • Ends in 24 Hours
          </div>

          {/* Main Headline - More Direct */}
          <h1 className="text-pretty font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="text-foreground">Land Your Dream</span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Frontend Job
            </span>
            <br />
            <span className="text-foreground">in 30 Days</span>
          </h1>

          {/* Clear Value Proposition */}
          <p className="mt-4 text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
            Complete interview prep kits with <span className="font-semibold text-foreground">500+ real questions</span> from Top tech companies like
            <span className="font-semibold text-foreground"> Google, Amazon, Microsoft</span> and more. Everything you need to crack frontend interviews.
          </p>

          {/* Social Proof Section */}
          {/* <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 border-2 border-white dark:border-gray-900" />
                ))}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★★★★★</span>
                <span className="text-sm font-bold">4.9/5</span>
              </div>
            </div>
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">
              "Got placed at Microsoft in just 6 weeks!" - <span className="italic">Priya S.</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Join 2,500+ engineers already placed at top companies
            </p>
          </div> */}

          {/* Pricing Preview */}
          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Starting at just</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹49</span>
                  <span className="text-sm text-muted-foreground line-through">₹99</span>
                  <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">SAVE 50%</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold">✓ Instant Access</p>
                <p className="text-xs text-muted-foreground">✓ Lifetime Updates</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons with Urgency */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <a href="#pricing" className="group inline-flex relative">
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-200"></span>
              <span className="relative w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-white font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105">
                Get Instant Access →
                <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded">50% OFF</span>
              </span>
            </a>
            <a href="#features" className="inline-flex group">
              <span className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border-2 border-secondary text-secondary px-4 sm:px-6 py-3 font-medium hover:bg-secondary/10 transition-all group-hover:border-primary">
                {/* <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg> */}
                Learn More
              </span>
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1">
              {/* <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg> */}
              {/* <span className="font-medium">Money-Back Guarantee</span> */}
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Secure Payment</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">12,847 Developers</span>
            </div>
          </div>

          {/* Scarcity Element */}
          <div className="mt-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">
              ⚡ Only 20 spots left at this price • Price increases to ₹99 after that
            </p>
          </div>
        </div>

        {/* Right Column - Testimonial Card Instead of Generic Image */}

      </div>
    </section>
  )
}