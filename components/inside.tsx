export function Inside() {
  return (
    <section id="inside" className="mx-auto max-w-6xl px-4 py-12 md:py-16">
      <div className="grid gap-8 md:grid-cols-3">
        <div className="rounded-lg border border-border p-6 bg-card">
          <h3 className="font-serif font-semibold text-lg text-foreground">Company-wise PDFs</h3>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Fresh question banks organized per company so you prepare for real trends, not random lists.
          </p>
        </div>
        <div className="rounded-lg border border-border p-6 bg-card">
          <h3 className="font-serif font-semibold text-lg text-foreground">Structured Roadmaps</h3>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Clear, no-fluff learning paths for JS, React, HTML/CSS, performance, DSA, and machine coding.
          </p>
        </div>
        <div className="rounded-lg border border-border p-6 bg-card">
          <h3 className="font-serif font-semibold text-lg text-foreground">Real Experiences</h3>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Get insider context: rounds format, expectations, pitfalls, and what actually gets asked.
          </p>
        </div>
      </div>
    </section>
  )
}
