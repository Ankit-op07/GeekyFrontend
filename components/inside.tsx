export function Inside() {
  const features = [
    {
      icon: "📊",
      title: "Company-wise PDFs",
      description: "Fresh question banks organized per company so you prepare for real trends, not random lists.",
      gradient: "from-blue-500 to-cyan-500",
      stats: "50+ Companies"
    },
    {
      icon: "🗺️",
      title: "Structured Roadmaps",
      description: "Clear, no-fluff learning paths for JS, React, HTML/CSS, performance, DSA, and machine coding.",
      gradient: "from-purple-500 to-pink-500",
      stats: "8-Week Program"
    },
    {
      icon: "💡",
      title: "Real Experiences",
      description: "Get insider context: rounds format, expectations, pitfalls, and what actually gets asked.",
      gradient: "from-orange-500 to-red-500",
      stats: "30+ Experiences"
    }
  ]

  return (
    <section id="inside" className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
      {/* Section header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 dark:bg-purple-900/30 px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-400 mb-4">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
          </svg>
          What Makes Us Different
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Curated by Engineers,
          </span>
          <br />
          <span className="text-foreground">For Engineers</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          We've been through the grind. Now we're helping you skip the confusion and focus on what matters.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {features.map((feature, index) => (
          <div
            key={index}
            className="group relative rounded-2xl border border-border bg-card p-8 transition-all hover:shadow-2xl hover:-translate-y-2 hover:border-primary/50 overflow-hidden"
          >
            {/* Background gradient on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />
            
            {/* Icon */}
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
              <span className="text-2xl">{feature.icon}</span>
            </div>

            {/* Stats badge */}
            <div className="absolute top-6 right-6">
              <span className="text-xs font-bold text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full">
                {feature.stats}
              </span>
            </div>

            <h3 className="font-serif font-semibold text-xl text-foreground mb-3">
              {feature.title}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {feature.description}
            </p>

            {/* Bottom decoration */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
          </div>
        ))}
      </div>

      {/* Bottom section with numbers */}
      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 border-t pt-12">
        <div className="text-center">
          <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">500+</p>
          <p className="text-sm text-muted-foreground mt-1">Interview Questions</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">50+</p>
          <p className="text-sm text-muted-foreground mt-1">Company Patterns</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">2500+</p>
          <p className="text-sm text-muted-foreground mt-1">Engineers Placed</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">4.9★</p>
          <p className="text-sm text-muted-foreground mt-1">Student Rating</p>
        </div>
      </div>
    </section>
  )
}