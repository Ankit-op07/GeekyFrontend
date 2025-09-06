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
          {/* Trust badges - mobile optimized */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400">
              ✨ 2500+ Placed
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
              🎯 2025 Updated
            </div>
          </div>

          {/* Title - mobile responsive */}
          <h1 className="text-pretty font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Crack Your Frontend
            </span>
            <br />
            <span className="text-foreground">Interviews With </span>
            <br></br>
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Confidence
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
            Master <span className="font-semibold text-foreground">JavaScript, React,</span> and 
            <span className="font-semibold text-foreground"> DSA</span> with interview prep kits trusted by top engineers.
          </p>

          {/* Stats - mobile grid */}
          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-4 border-t pt-6">
            <div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">500+</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Questions</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">50+</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Companies</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">4.9★</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Rating</p>
            </div>
          </div>

          {/* CTA Buttons - mobile stack */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <a href="#pricing" className="group inline-flex">
              <span className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-3 text-white font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105">
                Get Started Now
                <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </a>
            <a href="#features" className="inline-flex">
              <span className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border-2 border-secondary text-secondary px-4 sm:px-6 py-3 font-medium hover:bg-secondary/10 transition-all">
                Learn More
              </span>
            </a>
          </div>

          {/* Social proof - mobile optimized */}
          <div className="mt-6 flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 border-2 border-white dark:border-gray-900" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Join <span className="font-semibold text-foreground">2500+ engineers</span>
            </p>
          </div>
        </div>

        {/* Image - mobile optimized */}
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-xl order-1 md:order-2 hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 z-10 " />
          <Image
            src="/interview.png"
            alt="Frontend Interview Preparation"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  )
}