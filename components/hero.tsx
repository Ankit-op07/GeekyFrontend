import Image from "next/image"

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-10 pb-8 md:pt-16 md:pb-12">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
            New: 2025 syllabus update
          </div>
          <h1 className="text-pretty font-serif text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            Crack your Frontend Interview with confidence.
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Curated kits for JavaScript, complete frontend prep, and real interview experiences. Built for Indian
            candidates with focused, no-noise content.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <a href="#pricing" className="inline-flex">
              <span className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-primary-foreground font-medium hover:bg-primary/90">
                See Pricing
              </span>
            </a>
            <a href="#inside" className="inline-flex">
              <span className="inline-flex items-center rounded-md border border-secondary text-secondary px-4 py-2 font-medium hover:bg-secondary/10">
                What’s inside
              </span>
            </a>
          </div>
          <ul className="mt-6 grid gap-2 text-sm text-muted-foreground">
            <li>• Company-wise questions and PDFs</li>
            <li>• JS, React, HTML/CSS, DSA for JS, Performance, Machine Coding</li>
            <li>• First-hand interview experiences and insights</li>
          </ul>
        </div>

        <div className="relative aspect-[4/3] md:aspect-[5/4] rounded-xl overflow-hidden">
          <Image
            src={"/interview.png"}
            alt="Illustration of frontend interview preparation materials"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  )
}
