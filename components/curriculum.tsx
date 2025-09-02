export function Curriculum() {
  const sections = [
    {
      title: "JavaScript",
      points: ["Scopes & closures", "Async patterns & event loop", "Prototypes & classes", "Modules & tooling", "More..."],
    },
    {
      title: "React",
      points: ["Hooks & state", "Rendering & reconciliation", "Routing basics", "Performance patterns", "More..."],
    },
    {
      title: "HTML/CSS & A11y",
      points: ["Semantic HTML", "Forms & labels", "Flex/Grid layout", "Contrast & focus states", "More..."],
    },
    {
      title: "Web Performance",
      points: ["Core Web Vitals basics", "Code-splitting", "Network hints", "Images & fonts", "More..."],
    },
    {
      title: "Machine Coding",
      points: ["Small widgets", "Tables & filters", "Stateful flows", "Edge cases & tests", "More..."],
    },
    { title: "DSA Essentials", points: ["Arrays/strings", "Maps/sets", "Stacks/queues", "Time/space basics", "More..."] },
  ]

  return (
    <section id="curriculum" className="border-t bg-muted">
      <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Curriculum
        </div>
        <h2 className="mt-3 text-2xl md:text-3xl font-semibold text-balance">A clear, practical roadmap</h2>
        <p className="mt-2 text-muted-foreground">
          Content you can steadily work through and revisit before interviews.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {sections.map((s) => (
            <div key={s.title} className="rounded-lg border bg-card p-5">
              <h3 className="font-semibold">{s.title}</h3>
              <ul className="mt-3 text-sm text-foreground/80 space-y-2">
                {s.points.map((p) => (
                  <li key={p}>- {p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
