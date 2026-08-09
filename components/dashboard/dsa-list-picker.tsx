"use client"

import { useCallback, useRef, useState } from "react"
import { Check, FolderPlus, Loader2, Plus } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface DsaListDto {
    id: string
    name: string
    problemIds: string[]
}

/** Mirror of DSA_LIST_NAME_MAX in lib/models/DsaList.ts — see the note in
 *  note-editor.tsx for why these are duplicated rather than imported. */
const LIST_NAME_MAX = 40

/**
 * The per-problem "add to a list" control.
 *
 * WHY A POPOVER OF CHECKBOXES rather than a drag target or a dialog: a problem
 * belongs to zero or more lists, and the question being asked is "which ones?"
 * — a multi-select. A dialog would be too heavy for a toggle people do while
 * scanning a list of 155 rows, and drag-and-drop cannot be operated from a
 * keyboard or a phone.
 *
 * Creating a list is inline at the foot of the same popover. Sending someone to
 * a separate "manage lists" screen to make the list they wanted two seconds ago
 * loses the problem they were filing.
 */
export function DsaListPicker({
    problemId,
    lists,
    onToggle,
    onCreate,
    disabled,
    children,
}: {
    problemId: string
    lists: DsaListDto[]
    /** Add or remove this problem. Resolves false if the write failed. */
    onToggle: (listId: string, member: boolean) => Promise<boolean>
    /** Create a list and file this problem into it. Returns an error message, or null. */
    onCreate: (name: string) => Promise<string | null>
    disabled?: boolean
    /** The trigger — an icon button supplied by the row. */
    children: React.ReactNode
}) {
    const [open, setOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    const [name, setName] = useState("")
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const startCreating = useCallback(() => {
        setCreating(true)
        setError(null)
        // The input mounts on the same tick, so focus has to wait for paint.
        requestAnimationFrame(() => inputRef.current?.focus())
    }, [])

    const submitNew = useCallback(async () => {
        const trimmed = name.trim()
        if (!trimmed || busy) return
        setBusy(true)
        const err = await onCreate(trimmed)
        setBusy(false)
        if (err) {
            setError(err)
            return
        }
        setName("")
        setCreating(false)
        setError(null)
    }, [name, busy, onCreate])

    const reset = useCallback(() => {
        setCreating(false)
        setName("")
        setError(null)
    }, [])

    return (
        <Popover
            open={open}
            onOpenChange={(next) => {
                setOpen(next)
                if (!next) reset()
            }}
        >
            <PopoverTrigger asChild disabled={disabled}>
                {children}
            </PopoverTrigger>

            <PopoverContent align="end" className="w-60 p-0">
                <p className="border-b border-hairline px-3 py-2 text-xs font-medium text-muted-foreground">
                    Save to a list
                </p>

                {lists.length === 0 && !creating && (
                    <p className="px-3 py-4 text-center text-xs text-muted-foreground/70">
                        No lists yet.
                    </p>
                )}

                {lists.length > 0 && (
                    <div className="max-h-56 overflow-y-auto py-1">
                        {lists.map((list) => {
                            const member = list.problemIds.includes(problemId)
                            return (
                                <button
                                    key={list.id}
                                    onClick={() => onToggle(list.id, !member)}
                                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-overlay"
                                >
                                    <span
                                        className={cn(
                                            "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors",
                                            member
                                                ? "border-violet-500 bg-violet-500"
                                                : "border-border"
                                        )}
                                    >
                                        {member && (
                                            <Check className="h-3 w-3 text-white" strokeWidth={3} />
                                        )}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate text-foreground">
                                        {list.name}
                                    </span>
                                    <span className="flex-shrink-0 text-[11px] tabular-nums text-muted-foreground/60">
                                        {list.problemIds.length}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                )}

                <div className="border-t border-hairline p-2">
                    {creating ? (
                        <div className="space-y-2">
                            <Input
                                ref={inputRef}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") submitNew()
                                    if (e.key === "Escape") reset()
                                }}
                                maxLength={LIST_NAME_MAX}
                                placeholder="List name"
                                className="h-8 text-sm"
                            />
                            {error && (
                                <p className="px-0.5 text-[11px] text-rose-600 dark:text-rose-400">
                                    {error}
                                </p>
                            )}
                            <div className="flex justify-end gap-1.5">
                                <button
                                    onClick={reset}
                                    className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitNew}
                                    disabled={!name.trim() || busy}
                                    className="flex items-center gap-1 rounded-md bg-violet-600 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50"
                                >
                                    {busy && <Loader2 className="h-3 w-3 animate-spin" />}
                                    Create
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={startCreating}
                            className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-sm text-violet-700 transition-colors hover:bg-overlay dark:text-violet-400"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            New list
                        </button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}

/** Shown in the filter bar when no lists exist yet — the entry point for the
 *  very first one, which the per-row popover cannot advertise. */
export function EmptyListsHint() {
    return (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
            <FolderPlus className="h-3.5 w-3.5" />
            Use the folder icon on any problem to start a list
        </span>
    )
}
