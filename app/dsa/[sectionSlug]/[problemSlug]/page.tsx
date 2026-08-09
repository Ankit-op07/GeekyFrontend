import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { marked } from "marked"
import { ArrowLeft, ArrowRight, Clock, ExternalLink, HardDrive, HelpCircle } from "lucide-react"
import { SECTIONS, getProblem, getApproach, getApproachNeighbours } from "@/lib/dsa"
import { videoSearchUrl, DSA_CODE_LANGS } from "@/lib/dsa/types"
import { YoutubeEmbed } from "@/components/dsa/youtube-embed"
import { ApproachCode } from "@/components/dsa/approach-code"
import { DsaReaderShell } from "@/components/dsa/reader-shell"
import { ProblemNotes } from "@/components/dsa/problem-notes"
import { buildDsaNav } from "@/lib/dsa/nav"

/**
 * "Our approach" — one problem, explained properly.
 *
 * A server component that reads authored code and renders. No database, no
 * session, no gating: these pages are public and statically generated, which is
 * what makes them an acquisition channel rather than just a feature. The
 * tracker at /dashboard?tab=dsa is where identity enters the picture.
 *
 * Only problems that HAVE an authored approach get a page. `generateStaticParams`
 * therefore filters on `getApproach`, and the runtime handler 404s for anything
 * else — the sheet renders those rows as "soon" rather than linking here, so a
 * 404 means someone typed a URL, not that we shipped a dead link.
 */

interface RouteParams {
    params: Promise<{ sectionSlug: string; problemSlug: string }>
}

/** Resolve the route to (section, problem, approach), or null if any part misses. */
function resolve(sectionSlug: string, problemSlug: string) {
    const match = getProblem(problemSlug)
    if (!match) return null
    // The section in the URL must be the problem's ACTUAL section. Without this
    // check every problem would be reachable under all 17 section paths, which
    // is duplicate content a crawler will penalise us for.
    if (match.section.id !== sectionSlug) return null
    const approach = getApproach(problemSlug)
    if (!approach) return null
    return { ...match, approach }
}

/**
 * Only the paths in `generateStaticParams` exist. Anything else is a real 404.
 *
 * ⚠️  Without this, Next renders unknown slugs ON DEMAND — and `notFound()`
 * inside a prerendered-and-cached segment came back as **HTTP 200** with the
 * body of the not-found page. A crawler reading that sees a valid page titled
 * "Problem not found", and every unwritten problem in the sheet becomes an
 * indexable soft-404. Verified against `next start`, not assumed.
 *
 * `false` is also simply the truth here: the catalogue is authored code, so the
 * complete set of valid URLs is known at build time. There is no case where a
 * legitimate page exists that the build did not already produce.
 */
export const dynamicParams = false

export function generateStaticParams() {
    return SECTIONS.flatMap((section) =>
        section.problems
            .filter((p) => getApproach(p.id))
            .map((p) => ({ sectionSlug: section.id, problemSlug: p.id }))
    )
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
    const { sectionSlug, problemSlug } = await params
    const found = resolve(sectionSlug, problemSlug)
    if (!found) return { title: "Problem not found" }

    const { problem, approach } = found
    const title = `${problem.title} — approach, complexity and solutions`
    // The restatement makes a better description than the body's first line: it
    // is one sentence, it is self-contained, and it answers the query a searcher
    // actually typed.
    const description = `${approach.restate} ${approach.complexity.time} time, ${approach.complexity.space} space, with C++, Java and JavaScript solutions.`

    return {
        title,
        description,
        openGraph: { title, description, type: "article" },
        alternates: { canonical: `/dsa/${sectionSlug}/${problemSlug}` },
    }
}

export default async function ApproachPage({ params }: RouteParams) {
    const { sectionSlug, problemSlug } = await params
    const found = resolve(sectionSlug, problemSlug)
    if (!found) notFound()

    const { problem, section, approach } = found
    const bodyHtml = marked.parse(approach.body, { breaks: true, gfm: true }) as string
    const { prev, next } = getApproachNeighbours(problem.id)

    const codeBlocks = DSA_CODE_LANGS.flatMap(({ lang, label }) => {
        const block = approach.code.find((c) => c.lang === lang)
        return block ? [{ lang, label, source: block.source }] : []
    })

    return (
        /**
         * Same shell as the Learn reader: fixed sidebar of the whole catalogue,
         * content in a measure-limited column beside it. The shell owns <main>,
         * so this page renders the article only.
         */
        <DsaReaderShell
            nav={buildDsaNav()}
            currentSectionId={section.id}
            currentProblemId={problem.id}
        >
            <article className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
                <nav aria-label="Breadcrumb" className="mb-6 text-sm text-reader-faint">
                    <Link href="/dashboard?tab=dsa" className="hover:text-reader-accent">
                        DSA Sheet
                    </Link>
                    <span className="px-1.5">/</span>
                    <Link
                        href={`/dashboard?tab=dsa&section=${section.id}`}
                        className="hover:text-reader-accent"
                    >
                        {section.title}
                    </Link>
                </nav>

                <header>
                <h1 className="text-3xl font-bold tracking-tight text-reader-heading">
                    {problem.title}
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <span
                        className={
                            problem.difficulty === "Easy"
                                ? "font-semibold text-reader-success"
                                : problem.difficulty === "Medium"
                                  ? "font-semibold text-reader-amber"
                                  : "font-semibold text-rose-700 dark:text-rose-400"
                        }
                    >
                        {problem.difficulty}
                    </span>
                    <a
                        href={problem.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-reader-accent hover:underline"
                    >
                        Solve it on LeetCode
                        <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                </div>

                {problem.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {problem.tags.map((tag) => (
                            <span
                                key={tag}
                                className="rounded-full border border-reader-border px-2.5 py-0.5 text-xs text-reader-faint"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </header>

            {/* The restatement leads, deliberately. Half of "I don't know how to
                start" is not knowing what is being asked. */}
            <p className="mt-8 rounded-xl border-l-4 border-reader-accent bg-reader-accent-soft px-5 py-4 text-base font-medium leading-relaxed text-reader-heading-alt">
                {approach.restate}
            </p>

            <article
                className="dsa-prose mt-8"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />

            <section className="mt-10">
                <h2 className="text-lg font-bold text-reader-heading">Complexity</h2>
                <div className="mt-3 flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-2 rounded-xl border border-reader-border bg-reader-surface px-4 py-2.5 text-sm">
                        <Clock className="h-4 w-4 text-reader-accent" />
                        <span className="text-reader-muted">Time</span>
                        <code className="font-semibold text-reader-heading">
                            {approach.complexity.time}
                        </code>
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-xl border border-reader-border bg-reader-surface px-4 py-2.5 text-sm">
                        <HardDrive className="h-4 w-4 text-reader-accent" />
                        <span className="text-reader-muted">Space</span>
                        <code className="font-semibold text-reader-heading">
                            {approach.complexity.space}
                        </code>
                    </span>
                </div>
            </section>

            <section className="mt-10">
                <h2 className="text-lg font-bold text-reader-heading">Solution</h2>
                <div className="mt-3">
                    <ApproachCode blocks={codeBlocks} />
                </div>
            </section>

            <section className="mt-10">
                <h2 className="text-lg font-bold text-reader-heading">Video walkthrough</h2>
                <div className="mt-3">
                    <YoutubeEmbed
                        videoId={problem.youtubeVideoId ?? section.youtubeVideoId}
                        title={problem.title}
                        searchUrl={videoSearchUrl(problem)}
                    />
                </div>
            </section>

            {/* Client island: the rest of this page is static and identical for
                everyone, so the per-user note is fetched after hydration. It
                renders nothing at all for signed-out visitors. */}
            <ProblemNotes
                problemId={problem.id}
                title={problem.title}
                difficulty={problem.difficulty}
            />

            {approach.followUps && approach.followUps.length > 0 && (
                <section className="mt-10 rounded-2xl border border-reader-border bg-reader-surface p-6">
                    <h2 className="flex items-center gap-2 text-base font-bold text-reader-heading">
                        <HelpCircle className="h-4 w-4 text-reader-accent" />
                        What they ask next
                    </h2>
                    <ul className="mt-3 space-y-2">
                        {approach.followUps.map((q) => (
                            <li
                                key={q}
                                className="flex gap-2.5 text-sm leading-relaxed text-reader-muted"
                            >
                                <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-reader-accent-bullet" />
                                {q}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Prev/next spans sections, so the study order stays continuous past
                a section boundary — the label names the section when it changes. */}
            <nav
                aria-label="Previous and next problem"
                className="mt-12 grid gap-3 border-t border-reader-border pt-6 sm:grid-cols-2"
            >
                {prev ? (
                    <Link
                        href={`/dsa/${prev.sectionId}/${prev.problemId}`}
                        className="group flex flex-col gap-1 rounded-xl border border-reader-border p-4 transition-colors hover:border-reader-accent"
                    >
                        <span className="flex items-center gap-1.5 text-xs text-reader-faint">
                            <ArrowLeft className="h-3.5 w-3.5" />
                            {prev.sectionId === section.id ? "Previous" : prev.sectionTitle}
                        </span>
                        <span className="text-sm font-medium text-reader-text group-hover:text-reader-accent">
                            {prev.title}
                        </span>
                    </Link>
                ) : (
                    // An empty grid cell, so "next" stays in the right-hand column
                    // on the first problem instead of sliding under the arrow.
                    <span aria-hidden className="hidden sm:block" />
                )}

                {next && (
                    <Link
                        href={`/dsa/${next.sectionId}/${next.problemId}`}
                        className="group flex flex-col gap-1 rounded-xl border border-reader-border p-4 text-right transition-colors hover:border-reader-accent"
                    >
                        <span className="flex items-center justify-end gap-1.5 text-xs text-reader-faint">
                            {next.sectionId === section.id ? "Next" : next.sectionTitle}
                            <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-sm font-medium text-reader-text group-hover:text-reader-accent">
                            {next.title}
                        </span>
                    </Link>
                )}
            </nav>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <Link
                    href={`/dashboard?tab=dsa&section=${section.id}`}
                    className="text-reader-muted hover:text-reader-accent"
                >
                    ← All {section.title} problems
                </Link>
                <Link
                    href="/dashboard?tab=dsa"
                    className="font-medium text-reader-accent hover:underline"
                >
                    Back to your sheet →
                </Link>
            </div>
            </article>
        </DsaReaderShell>
    )
}
