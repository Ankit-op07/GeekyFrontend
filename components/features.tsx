export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-14 md:py-16">
      <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
        What’s inside
      </div>
      <h2 className="mt-3 text-2xl md:text-3xl font-semibold text-balance">Designed for real frontend interviews</h2>
      <p className="mt-2 text-muted-foreground">
        Practical, current material aligned with common interview formats: theory checks, hands-on rounds, and
        discussions.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <article className="rounded-lg border bg-card p-5">
          <h3 className="font-semibold">JS Interview Preparation Kit</h3>
          <ul className="mt-3 text-sm text-foreground/80 space-y-2">
            <li>- Topic-wise JS questions with concise answers (PDFs)</li>
            <li>- Company-wise patterns: product, startup, enterprise</li>
            <li>- ES6+, closures, async/await, prototypes, event loop</li>
            <li>- Short references to skim before rounds</li>
          </ul>
        </article>

        <article className="rounded-lg border bg-card p-5">
          <h3 className="font-semibold">Complete Frontend Preparation Kit</h3>
          <ul className="mt-3 text-sm text-foreground/80 space-y-2">
            <li>- Everything in JS Kit</li>
            <li>- React: hooks, state, effects, rendering, patterns</li>
            <li>- HTML/CSS: semantics, forms, layout, a11y</li>
            <li>- Web performance: CWV checklists</li>
            <li>- Machine coding: small widgets and UI flows</li>
            <li>- DSA essentials for FE interviews</li>
          </ul>
        </article>

        <article className="rounded-lg border bg-card p-5">
          <h3 className="font-semibold">Frontend Interview Experiences Kit</h3>
          <ul className="mt-3 text-sm text-foreground/80 space-y-2">
            <li>- Round-wise walkthroughs and expectations</li>
            <li>- Tips to communicate trade-offs and constraints</li>
            <li>- Role-focused prep (FE dev / FE engineer)</li>
            <li>- Framework-agnostic checklists</li>
          </ul>
          {/* <p className="mt-2 text-xs text-muted-foreground">Contact us for access details.</p> */}
        </article>
      </div>
    </section>
  )
}
