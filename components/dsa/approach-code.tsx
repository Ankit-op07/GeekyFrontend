"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Copy } from "lucide-react"
import hljs from "highlight.js/lib/core"
import cpp from "highlight.js/lib/languages/cpp"
import java from "highlight.js/lib/languages/java"
import javascript from "highlight.js/lib/languages/javascript"
import { cn } from "@/lib/utils"

/**
 * Language registration is LOCAL to this component, not shared with
 * components/learn/code-block.tsx.
 *
 * That component registers the web stack (js/ts/html/css/bash/python) because
 * that is what the kits teach; it does not register C++ or Java, and adding
 * them there would push two more grammars into every lesson bundle for content
 * that never contains them. `hljs.registerLanguage` is idempotent and global, so
 * both files coexist safely — each pays only for what it renders.
 */
hljs.registerLanguage("cpp", cpp)
hljs.registerLanguage("java", java)
hljs.registerLanguage("javascript", javascript)

export interface ApproachCodeBlock {
    lang: "cpp" | "java" | "javascript"
    label: string
    source: string
}

/**
 * Tabbed reference solutions for an approach page.
 *
 * Defaults to C++ — the campus/competitive default in India, and the language
 * most of our audience is actually asked to write on a whiteboard. The choice
 * is remembered for the session so a Java candidate does not re-click on every
 * one of 155 pages.
 */
export function ApproachCode({ blocks }: { blocks: ApproachCodeBlock[] }) {
    const [active, setActive] = useState(0)
    const [copied, setCopied] = useState(false)
    const codeRef = useRef<HTMLElement>(null)

    // Restore the reader's language preference. sessionStorage, not localStorage:
    // a language choice is about the session you are revising in, and quietly
    // pinning it forever means a returning learner sees a language they picked
    // once, months ago, for one problem.
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem("gf-dsa-lang")
            if (!saved) return
            const idx = blocks.findIndex((b) => b.lang === saved)
            if (idx >= 0) setActive(idx)
        } catch {
            /* private mode — the default is fine */
        }
    }, [blocks])

    useEffect(() => {
        if (!codeRef.current) return
        codeRef.current.removeAttribute("data-highlighted")
        try {
            hljs.highlightElement(codeRef.current)
        } catch {
            /* unhighlighted source still reads fine */
        }
    }, [active, blocks])

    const current = blocks[active]
    if (!current) return null

    const select = (i: number) => {
        setActive(i)
        try {
            sessionStorage.setItem("gf-dsa-lang", blocks[i].lang)
        } catch {
            /* ignore */
        }
    }

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(current.source)
            setCopied(true)
            setTimeout(() => setCopied(false), 1600)
        } catch {
            /* clipboard blocked — the source is selectable anyway */
        }
    }

    return (
        <div className="overflow-hidden rounded-xl border border-reader-border">
            <div className="flex items-center justify-between border-b border-reader-border bg-reader-surface px-2">
                <div role="tablist" aria-label="Solution language" className="flex">
                    {blocks.map((b, i) => (
                        <button
                            key={b.lang}
                            role="tab"
                            aria-selected={i === active}
                            onClick={() => select(i)}
                            className={cn(
                                "px-3 py-2.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-reader-accent",
                                i === active
                                    ? "border-b-2 border-reader-accent text-reader-accent"
                                    : "border-b-2 border-transparent text-reader-faint hover:text-reader-text"
                            )}
                        >
                            {b.label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={copy}
                    aria-label="Copy solution"
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-reader-faint transition-colors hover:text-reader-text"
                >
                    {copied ? (
                        <>
                            <Check className="h-3.5 w-3.5" />
                            Copied
                        </>
                    ) : (
                        <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                        </>
                    )}
                </button>
            </div>

            <pre className="overflow-x-auto bg-reader-code p-4 text-[13px] leading-relaxed">
                {/* keyed so React replaces the node on tab change — reusing it
                    leaves highlight.js's previous spans in place */}
                <code key={current.lang} ref={codeRef} className={`language-${current.lang}`}>
                    {current.source}
                </code>
            </pre>
        </div>
    )
}
