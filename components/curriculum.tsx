export function Curriculum() {
  const sections = [
    {
      title: "JavaScript",
      icon: "⚡",
      points: [
        "Scopes & closures",
        "Event loop & async patterns",
        "Prototypes & classes",
        "ES6+ modern features",
        "Module systems"
      ],
      color: "from-yellow-400 to-orange-500"
    },
    {
      title: "React",
      icon: "⚛️",
      points: [
        "Hooks & state management",
        "Performance optimization",
        "Component patterns",
        "Server-side rendering",
        "Testing strategies"
      ],
      color: "from-blue-400 to-cyan-500"
    },
    {
      title: "HTML/CSS",
      icon: "🎨",
      points: [
        "Semantic HTML5",
        "Modern CSS (Grid, Flexbox)",
        "Responsive design",
        "Web accessibility",
        "CSS architecture"
      ],
      color: "from-purple-400 to-pink-500"
    },
    {
      title: "Web Performance",
      icon: "🚀",
      points: [
        "Core Web Vitals",
        "Code splitting",
        "Image optimization",
        "Caching strategies",
        "Performance monitoring"
      ],
      color: "from-green-400 to-emerald-500"
    },
    {
      title: "Machine Coding",
      icon: "💻",
      points: [
        "Component architecture",
        "State management",
        "Real-time features",
        "Testing approach",
        "Edge case handling"
      ],
      color: "from-pink-400 to-rose-500"
    },
    {
      title: "DSA in JavaScript",
      icon: "🧮",
      points: [
        "Array & string patterns",
        "HashMap & Set",
        "Tree & graph algorithms",
        "Dynamic programming",
        "Complexity analysis"
      ],
      color: "from-indigo-400 to-purple-500"
    }
  ]

  return (
    <section id="curriculum" className="border-t bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-3">
            Topics Covered
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            Comprehensive Coverage
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Master all essential topics asked in frontend interviews at top companies
          </p>
        </div>

        {/* Topics grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <div
              key={section.title}
              className="group bg-card rounded-xl border hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden"
            >
              {/* Gradient top border */}
              <div className={`h-1 bg-gradient-to-r ${section.color}`} />
              
              <div className="p-4 sm:p-5">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{section.icon}</span>
                  <h3 className="font-bold text-base sm:text-lg">{section.title}</h3>
                </div>

                {/* Topics list */}
                <ul className="space-y-1.5">
                  {section.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-xs sm:text-sm">
                      <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 text-primary`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-muted-foreground">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Optional: Add a note about roadmaps */}
        <div className="mt-8 text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-400 mb-2">
            💡 Want a structured learning path?
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Each kit includes a suggested study sequence to maximize your preparation efficiency
          </p>
        </div>
      </div>
    </section>
  )
}