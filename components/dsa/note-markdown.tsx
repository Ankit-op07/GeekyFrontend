"use client"

import { useEffect, useMemo, useRef } from "react"
import { marked } from "marked"
import hljs from "highlight.js/lib/core"
import cpp from "highlight.js/lib/languages/cpp"
import java from "highlight.js/lib/languages/java"
import javascript from "highlight.js/lib/languages/javascript"
import python from "highlight.js/lib/languages/python"
import { cn } from "@/lib/utils"

hljs.registerLanguage("cpp", cpp)
hljs.registerLanguage("java", java)
hljs.registerLanguage("javascript", javascript)
// Python is registered HERE but not in approach-code.tsx, and that asymmetry is
// deliberate: our published solutions are C++/Java/JS only, but a learner's own
// notes are their business and plenty of people take notes in Python.
hljs.registerLanguage("python", python)

/**
 * Renders a learner's note as markdown, with fenced code blocks highlighted.
 *
 * WHY MARKDOWN AT ALL. A note about a DSA problem is mostly prose with a
 * snippet in the middle — "the trick is the second loop", then five lines of
 * the loop. Plain text renders that snippet as an unreadable run-on; a
 * dedicated code field would force every note into a shape most do not have.
 * Fenced blocks let one field carry both, and cost nothing when unused.
 *
 * ⚠️  THIS RENDERS USER-SUPPLIED MARKDOWN THROUGH dangerouslySetInnerHTML.
 * That is safe here for one specific reason and it is worth stating: a note is
 * only ever fetched by, and rendered for, THE USER WHO WROTE IT
 * (/api/dsa/notes keys on the signed session and has no shape that returns
 * someone else's row). So the only script a reader can inject is their own —
 * self-XSS, which is not a vulnerability. If notes ever become shareable this
 * must be sanitised before that ships; there is nothing else guarding it.
 */
export function NoteMarkdown({
    body,
    className,
}: {
    body: string
    className?: string
}) {
    const ref = useRef<HTMLDivElement>(null)

    const html = useMemo(
        () => marked.parse(body || "", { breaks: true, gfm: true }) as string,
        [body]
    )

    // highlight.js walks the DOM rather than transforming the string, so it has
    // to run after the HTML is in place.
    useEffect(() => {
        if (!ref.current) return
        ref.current.querySelectorAll("pre code").forEach((el) => {
            el.removeAttribute("data-highlighted")
            try {
                hljs.highlightElement(el as HTMLElement)
            } catch {
                /* unknown language — plain text still reads fine */
            }
        })
    }, [html])

    return (
        <div
            ref={ref}
            className={cn("dsa-note-prose", className)}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    )
}
