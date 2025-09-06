export function Features() {
  const features = [
    {
      icon: "📚",
      title: "JS Interview Kit",
      description: "Master JavaScript with real interview questions",
      highlights: [
        "500+ curated questions",
        "Company patterns",
        "Quick revision sheets"
      ],
      color: "bg-yellow-500"
    },
    {
      icon: "🚀",
      title: "Complete Frontend",
      description: "Everything for frontend engineering roles",
      highlights: [
        "JS + React + DSA",
        "Machine coding",
        "System design"
      ],
      color: "bg-blue-500",
      popular: true
    },
    {
      icon: "💼",
      title: "Interview Experiences",
      description: "Learn from real interview experiences",
      highlights: [
        "30+ experiences",
        "Round breakdown",
        "Negotiation tips"
      ],
      color: "bg-green-500"
    }
  ]

  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-12 md:py-20">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary mb-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
          </span>
          What's Inside
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2">
          Choose Your Path
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
          Comprehensive materials designed by successful engineers
        </p>
      </div>

      {/* Mobile-first horizontal scroll on small screens, grid on larger */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:pb-0 scrollbar-hide">
          {features.map((feature, index) => (
            <article 
              key={index}
              className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-auto snap-center"
            >
              <div className={`relative h-full rounded-2xl ${feature.color} p-[2px]`}>
                <div className="relative h-full bg-background rounded-2xl p-4 sm:p-6">
                  {feature.popular && (
                    <div className="absolute -top-3 left-4">
                      <span className="inline-flex z-40 items-center rounded-full bg-blue-500 px-3 py-0.5 text-xs font-bold text-white">
                        POPULAR
                      </span>
                    </div>
                  )}
                  
                  {/* Icon and title in same row for mobile */}
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">{feature.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-base sm:text-lg">{feature.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {feature.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm">
                        <div className={`w-1.5 h-1.5 rounded-full ${feature.color}`} />
                        <span className="text-foreground/80">{highlight}</span>
                      </li>
                    ))}
                  </ul>

                  <a 
                    href="#pricing" 
                    className="mt-4 inline-flex items-center text-xs sm:text-sm font-medium text-primary hover:underline"
                  >
                    View pricing →
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
        
        {/* Scroll indicator for mobile */}
        <div className="flex justify-center gap-1 mt-4 md:hidden">
          {features.map((_, idx) => (
            <div key={idx} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
          ))}
        </div>
      </div>
    </section>
  )
}