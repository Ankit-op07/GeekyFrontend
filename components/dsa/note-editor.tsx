"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Code2, Eye, Loader2, Pencil } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { NoteMarkdown } from "@/components/dsa/note-markdown"

/**
 * Client-side mirror of DSA_NOTE_MAX_LENGTH in lib/models/DsaNote.ts.
 *
 * Duplicated rather than imported: that module pulls in mongoose, and importing
 * it from a client component drags the whole ODM into the browser bundle for
 * one integer. The server still enforces the real limit.
 */
export const NOTE_MAX_LENGTH = 8000

const DIFFICULTY_STYLES: Record<string, string> = {
    Easy: "text-emerald-700 dark:text-emerald-400",
    Medium: "text-amber-700 dark:text-amber-400",
    Hard: "text-rose-700 dark:text-rose-400",
}

/**
 * The note editor, shared by the dashboard tracker and the approach page.
 *
 * ONE COMPONENT, TWO SURFACES, on purpose. A note written while ticking a
 * problem off and a note written while reading its explanation are the same
 * note — same row, same field. Two editors would drift in their formatting
 * rules the first time either was touched, and a learner would have to learn
 * both.
 *
 * The editor has an Edit/Preview split rather than live rendering: a
 * side-by-side preview does not fit a 28rem panel, and rendering in place would
 * fight the cursor. Two tabs is the honest shape at this width.
 */
export function DsaNoteEditor({
    problemId,
    title,
    difficulty,
    open,
    onClose,
    onSaved,
}: {
    problemId: string | null
    title?: string
    difficulty?: string
    open: boolean
    onClose: () => void
    /** Lets a caller refresh its own copy of the note after a successful save. */
    onSaved?: (body: string) => void
}) {
    const [body, setBody] = useState("")
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [tab, setTab] = useState<"write" | "preview">("write")
    const [needsAuth, setNeedsAuth] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (!open || !problemId) return
        setBody("")
        setTab("write")
        setNeedsAuth(false)
        setLoading(true)
        let cancelled = false

        fetch(`/api/dsa/notes?problemId=${encodeURIComponent(problemId)}`)
            .then((r) => {
                // 401 is not an error state — it is a signed-out visitor on a
                // public approach page, which is a normal thing to be.
                if (r.status === 401) {
                    if (!cancelled) setNeedsAuth(true)
                    return null
                }
                return r.ok ? r.json() : Promise.reject(new Error("failed"))
            })
            .then((json) => {
                if (!cancelled && json) setBody(json.note?.body || "")
            })
            .catch(() => {
                /* An unreadable note leaves the box empty. Saving would overwrite
                   it, so the failure shows as an empty state rather than
                   silently discarding what is stored. */
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [open, problemId])

    /**
     * Wrap the selection in a fenced block, or drop an empty one at the cursor.
     *
     * The cursor is then placed INSIDE the fence, because the next thing anyone
     * does after clicking "Code" is type code — landing them after the closing
     * fence would make the button actively unhelpful.
     */
    const insertCode = useCallback(() => {
        const el = textareaRef.current
        if (!el) return

        const start = el.selectionStart
        const end = el.selectionEnd
        const selected = body.slice(start, end)

        // Keep the fence on its own line: a fence with text before it on the
        // same line is not a fence at all, and the block silently renders as
        // prose.
        const before = body.slice(0, start)
        const lead = before && !before.endsWith("\n") ? "\n" : ""
        const after = body.slice(end)
        const trail = after && !after.startsWith("\n") ? "\n" : ""

        const block = `${lead}\`\`\`cpp\n${selected}\n\`\`\`${trail}`
        const next = before + block + after
        if (next.length > NOTE_MAX_LENGTH) return

        setBody(next)

        // Place the caret on the (possibly empty) line between the fences.
        const caret = before.length + lead.length + "```cpp\n".length + selected.length
        requestAnimationFrame(() => {
            el.focus()
            el.setSelectionRange(caret, caret)
        })
    }, [body])

    const submit = useCallback(async () => {
        if (!problemId) return
        setSaving(true)
        try {
            const res = await fetch("/api/dsa/notes", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ problemId, body }),
            })
            if (res.ok) {
                onSaved?.(body.trim())
                onClose()
            }
        } finally {
            setSaving(false)
        }
    }, [problemId, body, onClose, onSaved])

    const used = body.length
    const nearLimit = used > NOTE_MAX_LENGTH * 0.9

    return (
        <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
            {/* gap-0 + p-0: each band supplies its own padding and they are
                separated by hairlines, so the default gap would add a second,
                competing rhythm. */}
            <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
                {/* pr-12 clears the Sheet's own close button at top-4 right-4. */}
                <SheetHeader className="space-y-1 border-b border-hairline px-5 py-4 pr-12 text-left">
                    <SheetTitle className="text-base leading-snug">{title}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 text-xs">
                        {difficulty && (
                            <span className={cn("font-semibold", DIFFICULTY_STYLES[difficulty])}>
                                {difficulty}
                            </span>
                        )}
                        <span className="text-muted-foreground/70">Private to you</span>
                    </SheetDescription>
                </SheetHeader>

                {needsAuth ? (
                    <div className="flex flex-1 items-center justify-center px-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            <a
                                href="/login"
                                className="font-medium text-violet-700 underline dark:text-violet-400"
                            >
                                Log in
                            </a>{" "}
                            to keep notes on this problem.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Toolbar: mode switch on the left, the one formatting
                            action on the right. */}
                        <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
                            <div className="flex items-center gap-0.5">
                                <ToolbarTab
                                    active={tab === "write"}
                                    onClick={() => setTab("write")}
                                    icon={<Pencil className="h-3.5 w-3.5" />}
                                    label="Write"
                                />
                                <ToolbarTab
                                    active={tab === "preview"}
                                    onClick={() => setTab("preview")}
                                    icon={<Eye className="h-3.5 w-3.5" />}
                                    label="Preview"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={insertCode}
                                disabled={tab !== "write" || loading}
                                title="Insert a code block"
                                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-overlay hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                            >
                                <Code2 className="h-3.5 w-3.5" />
                                Code
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex h-full items-center justify-center">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : tab === "write" ? (
                                <Textarea
                                    ref={textareaRef}
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    maxLength={NOTE_MAX_LENGTH}
                                    autoFocus
                                    placeholder="Start typing…"
                                    /* field-sizing-fixed and dark:bg-transparent undo two
                                       defaults in components/ui/textarea: the base grows to
                                       fit its content (fighting h-full) and paints a dark
                                       fill that reads as a panel inside a panel. */
                                    className="h-full resize-none rounded-none border-0 bg-transparent px-5 py-4 text-sm leading-relaxed shadow-none field-sizing-fixed focus-visible:ring-0 dark:bg-transparent"
                                />
                            ) : body.trim() ? (
                                <NoteMarkdown body={body} className="px-5 py-4" />
                            ) : (
                                <p className="px-5 py-4 text-sm text-muted-foreground/60">
                                    Nothing to preview yet.
                                </p>
                            )}
                        </div>

                        <SheetFooter className="flex-row items-center justify-between gap-3 border-t border-hairline px-5 py-3">
                            {/* Hidden while empty — a counter on a blank note is noise. */}
                            <span
                                className={cn(
                                    "text-xs tabular-nums",
                                    used === 0 && "invisible",
                                    nearLimit
                                        ? "text-amber-700 dark:text-amber-400"
                                        : "text-muted-foreground/60"
                                )}
                            >
                                {used.toLocaleString()} / {NOTE_MAX_LENGTH.toLocaleString()}
                            </span>

                            <span className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
                                    Cancel
                                </Button>
                                <Button size="sm" onClick={submit} disabled={saving || loading}>
                                    {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                                    Save
                                </Button>
                            </span>
                        </SheetFooter>
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}

function ToolbarTab({
    active,
    onClick,
    icon,
    label,
}: {
    active: boolean
    onClick: () => void
    icon: React.ReactNode
    label: string
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                active
                    ? "bg-overlay-strong text-foreground"
                    : "text-muted-foreground hover:text-foreground"
            )}
        >
            {icon}
            {label}
        </button>
    )
}
