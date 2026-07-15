"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Sparkles, Loader2 } from "lucide-react";
import { CodeBlock } from "@/components/learn/code-block";
import { cn } from "@/lib/utils";

/**
 * PRD-005 Phase 0 — inline predict-output self-check.
 *
 * Renders keyword-matched MCQs beneath a topic. No code execution: options are
 * fetched (answer-stripped) from /api/quiz/questions and graded server-side via
 * /api/quiz/attempt. Purely to measure whether learners want to practise — the
 * ≥30% attempt-rate gate. Shows nothing when the topic matches no questions.
 *
 * Styling uses the Learn reader tokens (bg-reader-surface / text-reader-heading
 * / border-reader-border / text-reader-accent / *-success) per the CLAUDE.md
 * theming convention for app/learn/** components, so it tracks the reader's
 * light/dark toggle. The reader palette has no "error" token, so the incorrect
 * state uses red as a minimal status accent with an explicit dark: variant
 * (which still responds to the toggle).
 */

interface PublicQuestion {
    id: string;
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

export function PredictOutputQuiz({
    kitSlug,
    topicSlug,
}: {
    kitSlug: string;
    topicSlug: string;
}) {
    const [questions, setQuestions] = useState<PublicQuestion[]>([]);
    const [state, setState] = useState<Record<string, QuestionState>>({});

    useEffect(() => {
        let cancelled = false;
        setQuestions([]);
        setState({});
        fetch(`/api/quiz/questions?kit=${encodeURIComponent(kitSlug)}&topic=${encodeURIComponent(topicSlug)}`)
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
            .catch(() => { /* quiz is non-critical; fail silent */ });
        return () => { cancelled = true; };
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
                <span className="text-xs text-reader-faint">— predict the output. No marks, just for you.</span>
            </div>

            <div className="space-y-5">
                {questions.map((q, qi) => {
                    const st = state[q.id] || { selected: null, submitting: false, result: null };
                    const answered = !!st.result;
                    return (
                        <fieldset
                            key={q.id}
                            className="rounded-xl border border-reader-border bg-reader-surface p-4 sm:p-5"
                        >
                            <legend className="text-sm font-medium text-reader-heading px-1">
                                {qi + 1}. {q.prompt}
                            </legend>

                            <CodeBlock code={q.code} language={q.language} />

                            <div className="grid gap-2 mt-3" role="radiogroup" aria-label={`Options for question ${qi + 1}`}>
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
                                                isSelected && !answered && "border-reader-accent bg-reader-accent-soft hover:bg-reader-accent-soft",
                                                isCorrect && "border-reader-success-soft-border bg-reader-success-soft hover:bg-reader-success-soft",
                                                isWrongPick && "border-red-500/40 bg-red-500/10 hover:bg-red-500/10",
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
                                            <code className="font-mono text-reader-text flex-1">{opt}</code>
                                            {isCorrect && <CheckCircle2 className="w-4 h-4 text-reader-success shrink-0" />}
                                            {isWrongPick && <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />}
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
                                    <p className={cn(
                                        "text-sm font-semibold m-0 mb-1 flex items-center gap-1.5",
                                        st.result!.correct
                                            ? "text-reader-success"
                                            : "text-red-600 dark:text-red-400"
                                    )}>
                                        {st.result!.correct ? (
                                            <><CheckCircle2 className="w-4 h-4" /> Correct</>
                                        ) : (
                                            <><XCircle className="w-4 h-4" /> Not quite</>
                                        )}
                                    </p>
                                    <p className="text-sm text-reader-text m-0 leading-relaxed">
                                        {st.result!.explanation}
                                    </p>
                                </div>
                            )}
                        </fieldset>
                    );
                })}
            </div>
        </section>
    );
}
