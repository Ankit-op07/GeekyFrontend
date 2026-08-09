"use client"

import { useCallback, useEffect, useState } from "react"
import { NotebookPen, Pencil } from "lucide-react"
import { DsaNoteEditor } from "@/components/dsa/note-editor"
import { NoteMarkdown } from "@/components/dsa/note-markdown"

/**
 * "Your notes" on a public approach page.
 *
 * WHY THIS IS A CLIENT ISLAND ON AN OTHERWISE STATIC PAGE. The approach pages
 * are prerendered and identical for every visitor — that is what makes them
 * cheap to serve and indexable. A note is per-user, so it cannot be baked in.
 * Fetching it after hydration keeps the page static and adds one small request
 * only for people who are signed in.
 *
 * SIGNED-OUT VISITORS SEE NOTHING AT ALL. Not a locked card, not a teaser: the
 * component renders null. Most arrivals here come from search and have no
 * account, and a "log in to unlock" block on an otherwise free page reads as a
 * paywall on content that is not paywalled. The affordance appears once you are
 * someone who can use it.
 */
export function ProblemNotes({
    problemId,
    title,
    difficulty,
}: {
    problemId: string
    title: string
    difficulty: string
}) {
    // null = not loaded yet, false = signed out, string = the note (possibly "")
    const [note, setNote] = useState<string | null>(null)
    const [signedOut, setSignedOut] = useState(false)
    const [editing, setEditing] = useState(false)

    useEffect(() => {
        let cancelled = false
        fetch(`/api/dsa/notes?problemId=${encodeURIComponent(problemId)}`)
            .then((r) => {
                if (r.status === 401) {
                    if (!cancelled) setSignedOut(true)
                    return null
                }
                return r.ok ? r.json() : Promise.reject(new Error("failed"))
            })
            .then((json) => {
                if (!cancelled && json) setNote(json.note?.body || "")
            })
            .catch(() => {
                // Treat an unreachable API as signed-out rather than showing a
                // broken card: the page's actual content is unaffected.
                if (!cancelled) setSignedOut(true)
            })
        return () => {
            cancelled = true
        }
    }, [problemId])

    const onSaved = useCallback((body: string) => setNote(body), [])

    // Nothing to show until we know who this is.
    if (signedOut || note === null) return null

    return (
        <section className="mt-10">
            <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-bold text-reader-heading">
                    <NotebookPen className="h-4 w-4 text-reader-accent" />
                    Your notes
                </h2>
                <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-reader-border px-3 py-1.5 text-xs font-medium text-reader-muted transition-colors hover:border-reader-accent hover:text-reader-accent"
                >
                    <Pencil className="h-3.5 w-3.5" />
                    {note ? "Edit" : "Add a note"}
                </button>
            </div>

            <div className="mt-3">
                {note ? (
                    <div className="rounded-xl border border-reader-border bg-reader-surface px-5 py-4">
                        <NoteMarkdown body={note} />
                    </div>
                ) : (
                    <button
                        onClick={() => setEditing(true)}
                        className="w-full rounded-xl border border-dashed border-reader-border px-5 py-6 text-left text-sm text-reader-faint transition-colors hover:border-reader-accent hover:text-reader-muted"
                    >
                        What tripped you up here? Anything you write is private to you.
                    </button>
                )}
            </div>

            <DsaNoteEditor
                problemId={editing ? problemId : null}
                title={title}
                difficulty={difficulty}
                open={editing}
                onClose={() => setEditing(false)}
                onSaved={onSaved}
            />
        </section>
    )
}
