"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Sparkles, Loader2 } from "lucide-react";
import { CodeBlock } from "@/components/learn/code-block";
import { cn } from "@/lib/utils";

/**
 * PRD-005 Phase 0 — the end-of-topic self-check.
 *
 * Renders this topic's live questions. No code execution: options are fetched
 * (answer-stripped) from /api/quiz/questions and graded server-side via
 * /api/quiz/attempt, so the answer key never reaches the browser before the
 * learner commits. Purely to measure whether learners want to practise — the
 * ≥30% attempt-rate gate. Shows nothing when a topic has no live questions.
 *
 * Two question types (PRD §3 Seam 2):
 *   • predict-output — a JS snippet; options are literal console output, so they
 *     are rendered monospace.
 *   • concept        — prose drawn from the lesson; no snippet, and options are
 *     sentences, so they are rendered in the body font. Rendering prose in
 *     monospace is what made this look like a code quiz on lessons about ARIA.
 *
 * Styling uses the Learn reader tokens per the CLAUDE.md theming convention for
 * app/learn/** components, so it tracks the reader's light/dark toggle. The
 * reader palette has no "error" token, so the incorrect state uses red as a
 * minimal status accent with an explicit dark: variant.
 *
 * ⚠ Do NOT rebuild the card as <fieldset> + <legend>. It reads like the right
 * semantics and renders wrong: a browser lifts the legend OUT of the fieldset's
 * padding box and into the top border, so the question text straddles the card's
 * rounded edge instead of sitting inside it. (Fieldset also forces
 * min-inline-size: min-content, which fights the layout at phone widths.) A div
 * with role="radiogroup" + aria-labelledby gives the same grouping to a screen
 * reader, with no layout surprises.
 */

type QuizType = "predict-output" | "concept";

interface PublicQuestion {
    id: string;
    type: QuizType;
    prompt: string;
    code: string;
    language: string;
    options: string[];
}

interface AttemptResult {
    correct: boolean;
    correctIndex: number;
    explanation: string;
}

interface QuestionState {
    selected: number | null;
    submitting: boolean;
    result: AttemptResult | null;
}

export function TopicQuiz({ kitSlug, topicSlug }: { kitSlug: string; topicSlug: string }) {
    const [questions, setQuestions] = useState<PublicQuestion[]>([]);
    const [state, setState] = useState<Record<string, QuestionState>>({});

    useEffect(() => {
        let cancelled = false;
        setQuestions([]);
        setState({});
        fetch(
            `/api/quiz/questions?kit=${encodeURIComponent(kitSlug)}&topic=${encodeURIComponent(topicSlug)}`
        )
            .then((r) => (r.ok ? r.json() : { questions: [] }))
            .then((d) => {
                if (cancelled) return;
                const qs: PublicQuestion[] = d.questions || [];
                setQuestions(qs);
                setState(
                    Object.fromEntries(
                        qs.map((q) => [q.id, { selected: null, submitting: false, result: null }])
                    )
                );
            })
            .catch(() => {
                /* quiz is non-critical; fail silent rather than break the lesson */
            });
        return () => {
            cancelled = true;
        };
    }, [kitSlug, topicSlug]);

    if (questions.length === 0) return null;

    const select = (qid: string, idx: number) => {
        setState((s) => {
            if (s[qid]?.result) return s; // locked after submit
            return { ...s, [qid]: { ...s[qid], selected: idx } };
        });
    };

    const submit = async (q: PublicQuestion) => {
        const cur = state[q.id];
        if (!cur || cur.selected === null || cur.result || cur.submitting) return;
        setState((s) => ({ ...s, [q.id]: { ...s[q.id], submitting: true } }));
        try {
            const r = await fetch("/api/quiz/attempt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questionId: q.id,
                    chosenIndex: cur.selected,
                    kitSlug,
                    topicSlug,
                }),
            });
            const result: AttemptResult = await r.json();
            if (!r.ok) throw new Error("grading failed");
            setState((s) => ({ ...s, [q.id]: { ...s[q.id], submitting: false, result } }));
        } catch {
            setState((s) => ({ ...s, [q.id]: { ...s[q.id], submitting: false } }));
        }
    };

    return (
        <section className="mt-12" aria-label="Practice questions">
            <div className="flex items-center gap-2 mb-5">
                <Sparkles className="w-4 h-4 text-reader-accent" />
                <h2 className="text-sm font-semibold uppercase tracking-widest text-reader-accent m-0">
                    Quick check
                </h2>
                <span className="text-xs text-reader-faint">— no marks, just for you.</span>
            </div>

            <div className="space-y-5">
                {questions.map((q, qi) => {
                    const st = state[q.id] || { selected: null, submitting: false, result: null };
                    const answered = !!st.result;
                    const isCode = q.type === "predict-output";
                    const promptId = `quiz-prompt-${q.id}`;
                    return (
                        <div
                            key={q.id}
                            className="rounded-xl border border-reader-border bg-reader-surface p-4 sm:p-5"
                        >
                            <p
                                id={promptId}
                                className="text-sm font-medium text-reader-heading m-0 mb-3 break-words"
                            >
                                {qi + 1}. {q.prompt}
                            </p>

                            {isCode && q.code ? <CodeBlock code={q.code} language={q.language} /> : null}

                            <div
                                className={cn("grid gap-2", isCode && q.code ? "mt-3" : "mt-4")}
                                role="radiogroup"
                                aria-labelledby={promptId}
                            >
                                {q.options.map((opt, oi) => {
                                    const isSelected = st.selected === oi;
                                    const isCorrect = answered && oi === st.result!.correctIndex;
                                    const isWrongPick = answered && isSelected && !st.result!.correct;
                                    return (
                                        <label
                                            key={oi}
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors text-sm",
                                                "border-reader-border hover:border-reader-accent-soft-border hover:bg-reader-surface-hover",
                                                isSelected &&
                                                    !answered &&
                                                    "border-reader-accent bg-reader-accent-soft hover:bg-reader-accent-soft",
                                                isCorrect &&
                                                    "border-reader-success-soft-border bg-reader-success-soft hover:bg-reader-success-soft",
                                                isWrongPick &&
                                                    "border-red-500/40 bg-red-500/10 hover:bg-red-500/10",
                                                answered && "cursor-default"
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                name={q.id}
                                                value={oi}
                                                checked={isSelected}
                                                disabled={answered}
                                                onChange={() => select(q.id, oi)}
                                                className="accent-reader-accent w-4 h-4 shrink-0"
                                            />
                                            {/* Literal console output reads as code; a sentence
                                                about ARIA does not.
                                                min-w-0: a flex item defaults to min-width:auto and
                                                refuses to shrink below its content, which pushes a
                                                long option out past the card edge.
                                                whitespace-pre-line: a predict-output answer is the
                                                REAL console output and its newlines are the answer —
                                                "one\ntwo" must show as two lines, not "one two". */}
                                            <span
                                                className={cn(
                                                    "flex-1 min-w-0 text-reader-text break-words",
                                                    isCode ? "font-mono whitespace-pre-line" : "leading-relaxed"
                                                )}
                                            >
                                                {opt}
                                            </span>
                                            {isCorrect && (
                                                <CheckCircle2 className="w-4 h-4 text-reader-success shrink-0" />
                                            )}
                                            {isWrongPick && (
                                                <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                                            )}
                                        </label>
                                    );
                                })}
                            </div>

                            {!answered ? (
                                <button
                                    onClick={() => submit(q)}
                                    disabled={st.selected === null || st.submitting}
                                    className={cn(
                                        "mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                                        st.selected === null
                                            ? "bg-reader-surface-hover text-reader-faint cursor-not-allowed"
                                            : "bg-reader-accent text-white hover:bg-reader-accent-hover"
                                    )}
                                >
                                    {st.submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    Check answer
                                </button>
                            ) : (
                                <div
                                    className="mt-4 rounded-lg border border-reader-border bg-reader-surface-hover p-3"
                                    role="status"
                                    aria-live="polite"
                                >
                                    <p
                                        className={cn(
                                            "text-sm font-semibold m-0 mb-1 flex items-center gap-1.5",
                                            st.result!.correct
                                                ? "text-reader-success"
                                                : "text-red-600 dark:text-red-400"
                                        )}
                                    >
                                        {st.result!.correct ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" /> Correct
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-4 h-4" /> Not quite
                                            </>
                                        )}
                                    </p>
                                    <p className="text-sm text-reader-text m-0 leading-relaxed">
                                        {st.result!.explanation}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
