import { Trophy, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export interface Report {
    overallScore: number;
    summary: string;
    perQuestion: { question: string; score: number; feedback: string }[];
    strengths: string[];
    improvements: string[];
    recommendedTopics: string[];
}

export const scoreColor = (s: number) =>
    s >= 75 ? 'text-emerald-600 dark:text-emerald-400'
        : s >= 50 ? 'text-amber-600 dark:text-amber-400'
            : 'text-red-600 dark:text-red-400';

/** The graded-interview report body (score card + feedback). Shared by the
 *  text and voice interview flows; callers add their own surrounding nav. */
export function InterviewReport({ report, label }: { report: Report; label: string }) {
    return (
        <div className="space-y-5">
            <div className="bg-card border border-hairline rounded-2xl p-6 flex items-center gap-6">
                <div className="text-center flex-shrink-0">
                    <div className={`text-5xl font-bold ${scoreColor(report.overallScore)}`}>{report.overallScore}</div>
                    <p className="text-muted-foreground text-xs mt-1">/ 100</p>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Trophy className={`w-4 h-4 ${scoreColor(report.overallScore)}`} />
                        <p className="text-foreground font-semibold text-sm">{label}</p>
                    </div>
                    <p className="text-muted-foreground text-sm">{report.summary}</p>
                </div>
            </div>

            {report.perQuestion.length > 0 && (
                <div className="space-y-2">
                    <p className="text-foreground text-sm font-semibold">Per-question feedback</p>
                    {report.perQuestion.map((p, i) => (
                        <div key={i} className="bg-card border border-hairline rounded-xl p-4">
                            <div className="flex items-start justify-between gap-3">
                                <p className="text-foreground text-sm font-medium flex-1">{p.question}</p>
                                <span className={`text-sm font-bold ${scoreColor(p.score)} flex-shrink-0`}>{p.score}</span>
                            </div>
                            <p className="text-muted-foreground text-xs mt-1.5">{p.feedback}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
                {report.strengths.length > 0 && (
                    <div className="bg-card border border-hairline rounded-xl p-4">
                        <p className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-1.5 mb-2"><CheckCircle2 className="w-4 h-4" />Strengths</p>
                        <ul className="space-y-1">{report.strengths.map((s, i) => <li key={i} className="text-muted-foreground text-xs flex gap-1.5"><span className="text-emerald-500">•</span>{s}</li>)}</ul>
                    </div>
                )}
                {report.improvements.length > 0 && (
                    <div className="bg-card border border-hairline rounded-xl p-4">
                        <p className="text-amber-600 dark:text-amber-400 text-sm font-semibold flex items-center gap-1.5 mb-2"><AlertCircle className="w-4 h-4" />To improve</p>
                        <ul className="space-y-1">{report.improvements.map((s, i) => <li key={i} className="text-muted-foreground text-xs flex gap-1.5"><span className="text-amber-500">•</span>{s}</li>)}</ul>
                    </div>
                )}
            </div>

            {report.recommendedTopics.length > 0 && (
                <div className="bg-card border border-hairline rounded-xl p-4">
                    <p className="text-violet-700 dark:text-violet-300 text-sm font-semibold flex items-center gap-1.5 mb-2"><Sparkles className="w-4 h-4" />Recommended revision</p>
                    <div className="flex flex-wrap gap-2">
                        {report.recommendedTopics.map((t, i) => <span key={i} className="text-xs bg-overlay border border-hairline rounded-full px-2.5 py-1 text-muted-foreground">{t}</span>)}
                    </div>
                </div>
            )}
        </div>
    );
}
