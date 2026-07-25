'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Bot, Mic, MicOff, Send, Loader2, Volume2, Sparkles, ArrowLeft,
    Trophy, RotateCcw, Lock, ChevronRight, CheckCircle2, AlertCircle, Clock, MessageSquare,
} from 'lucide-react';
import { getAllowedSlugs, AI_INTERVIEW } from '@/lib/appConstants';
import { KitLogo, getKitLogo } from '@/components/kit-logo';
import { AiInterviewLive } from './ai-interview-live';
import { InterviewReport, scoreColor, type Report } from './interview-report';

interface SessionUser { purchasedKits?: string[] }
interface Turn { question: string; answer: string }
interface HistoryItem {
    id: string; mode: string; roundLabel: string; overallScore: number;
    summary: string; createdAt: string;
}
interface OwnedKit { slug: string; name: string; icon?: string; color?: string }

const ROLE_ROUNDS = [
    { id: 'react', label: 'React.js', emoji: '⚛️', desc: 'Hooks, rendering, performance, patterns' },
    { id: 'javascript', label: 'JavaScript', emoji: '🟨', desc: 'Closures, async, prototypes, coercion' },
    { id: 'machine-coding', label: 'Machine Coding', emoji: '🧩', desc: 'Design & build a component, verbally' },
    { id: 'hr', label: 'HR / Behavioural', emoji: '💬', desc: 'Motivation, teamwork, projects' },
];

type Phase = 'setup' | 'live' | 'grading' | 'grade-error' | 'summary' | 'voice';

export function AiInterviewTab({ user }: { user: SessionUser }) {
    // Match the server gate exactly (getAllowedSlugs) so the UI and API agree
    // even when a purchased plan name isn't mapped in PLAN_TO_SLUGS.
    const isBuyer = getAllowedSlugs(user.purchasedKits || []).size > 0;

    const [phase, setPhase] = useState<Phase>('setup');
    const [ownedKits, setOwnedKits] = useState<OwnedKit[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [remaining, setRemaining] = useState<number>(0);
    const [dailyLimit, setDailyLimit] = useState<number>(AI_INTERVIEW.DAILY_LIMIT);
    const [questionCount, setQuestionCount] = useState<number>(AI_INTERVIEW.QUESTION_COUNT);
    const [metaLoaded, setMetaLoaded] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [delivery, setDelivery] = useState<'text' | 'voice'>('text');
    const [voiceCfg, setVoiceCfg] = useState<{ mode: 'role' | 'kit'; round: string; kitSlug?: string; label: string } | null>(null);

    // Active interview (server-owned session)
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [roundLabel, setRoundLabel] = useState('');
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [qNumber, setQNumber] = useState(1); // display only; server is authoritative
    const [busy, setBusy] = useState(false);
    const [listening, setListening] = useState(false);

    // Result
    const [report, setReport] = useState<Report | null>(null);
    const recognitionRef = useRef<any>(null);

    const loadMeta = useCallback(async () => {
        try {
            const [h, k] = await Promise.all([
                fetch('/api/interview/history').then(r => (r.ok ? r.json() : null)),
                fetch('/api/learn/kits').then(r => (r.ok ? r.json() : null)),
            ]);
            if (h) {
                setHistory(h.sessions || []);
                setRemaining(h.remaining ?? 0);
                setDailyLimit(h.dailyLimit ?? 3);
                setQuestionCount(h.questionCount ?? 5);
            }
            if (k?.kits) {
                setOwnedKits(k.kits.filter((x: any) => x.hasAccess)
                    .map((x: any) => ({ slug: x.slug, name: x.name, icon: x.icon, color: x.color })));
            }
        } catch { /* non-critical */ } finally {
            setMetaLoaded(true);
        }
    }, []);

    useEffect(() => { loadMeta(); }, [loadMeta]);

    // ── Voice ──────────────────────────────────────────────
    const speak = useCallback((text: string) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-IN';
        window.speechSynthesis.speak(u);
    }, []);

    const toggleMic = useCallback(() => {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) { setNotice('Voice input is not supported in this browser — please type instead.'); return; }
        if (listening) { recognitionRef.current?.stop(); return; }
        const rec = new SR();
        rec.lang = 'en-IN';
        rec.continuous = true;
        rec.interimResults = false;
        rec.onresult = (e: any) => {
            let chunk = '';
            for (let i = e.resultIndex; i < e.results.length; i++) chunk += e.results[i][0].transcript;
            setAnswer(prev => (prev ? prev + ' ' : '') + chunk.trim());
        };
        rec.onend = () => setListening(false);
        rec.onerror = () => setListening(false);
        recognitionRef.current = rec;
        rec.start();
        setListening(true);
    }, [listening]);

    const stopVoice = useCallback(() => {
        recognitionRef.current?.stop?.();
        if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
        setListening(false);
    }, []);

    // ── Flow ───────────────────────────────────────────────
    // Route a chosen round/kit to either the text flow or the live voice component.
    const launch = (m: 'role' | 'kit', r: string, label: string, ks?: string) => {
        if (delivery === 'voice') { setVoiceCfg({ mode: m, round: r, kitSlug: ks, label }); setPhase('voice'); }
        else startInterview(m, r, label, ks);
    };

    const startInterview = async (m: 'role' | 'kit', r: string, label: string, ks?: string) => {
        setNotice(null);
        setBusy(true);
        try {
            const res = await fetch('/api/interview/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: m, round: r, kitSlug: ks }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.status === 429) { setNotice(`You've used all ${dailyLimit} interviews for today. Come back tomorrow!`); return; }
            if (res.status === 403) { setNotice('AI Interview is available to kit owners. Purchase a kit to unlock it.'); return; }
            if (!res.ok || !data.sessionId) { setNotice(data.error || 'Could not start the interview. Please try again.'); return; }

            setSessionId(data.sessionId);
            setRoundLabel(data.roundLabel || label);
            setAnswer(''); setReport(null); setQNumber(1);
            setQuestion(data.question);
            setRemaining(data.remaining ?? remaining);
            setPhase('live');
        } catch {
            setNotice('Could not start the interview. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    // Grade the server-owned session. Idempotent + retriable (the transcript is
    // already persisted), so a transient failure never loses the interview.
    const gradeInterview = async (sid: string, finalAnswer?: string) => {
        setPhase('grading');
        stopVoice();
        try {
            const res = await fetch('/api/interview/finish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: sid, answer: finalAnswer }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.report) { setNotice(data.error || 'Could not grade the interview.'); setPhase('grade-error'); return; }
            setReport(data.report);
            setPhase('summary');
            loadMeta(); // refresh history + remaining
        } catch {
            setNotice('Could not grade the interview.'); setPhase('grade-error');
        }
    };

    const submitAnswer = async (endNow = false) => {
        if (busy || !sessionId) return;
        const sid = sessionId;
        const currentAnswer = answer.trim();
        setAnswer('');
        stopVoice();

        // "End" grades immediately with whatever is answered so far.
        if (endNow) { await gradeInterview(sid, currentAnswer); return; }

        setBusy(true);
        try {
            const res = await fetch('/api/interview/next', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: sid, answer: currentAnswer }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.status === 409) { setNotice('This interview is no longer active.'); setPhase('setup'); return; }
            if (!res.ok) { setNotice(data.error || 'Something went wrong.'); return; }
            if (data.done) { await gradeInterview(sid); return; }
            setQuestion(data.question);
            setQNumber(n => n + 1);
        } catch {
            setNotice('Something went wrong. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    const viewSession = async (id: string) => {
        setBusy(true);
        try {
            const res = await fetch(`/api/interview/${id}`);
            const data = await res.json();
            if (res.ok && data.report) {
                setReport(data.report);
                setRoundLabel(data.roundLabel || '');
                setPhase('summary');
            }
        } catch { /* ignore */ } finally { setBusy(false); }
    };

    const backToSetup = () => { stopVoice(); setPhase('setup'); setReport(null); };

    // ── Renders ────────────────────────────────────────────
    const Header = () => (
        <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
                <h3 className="text-foreground font-semibold text-base">AI Interview</h3>
                <p className="text-muted-foreground text-xs">Practice with an AI interviewer and get a graded report</p>
            </div>
        </div>
    );

    if (!isBuyer) {
        return (
            <div className="space-y-6 max-w-3xl">
                <Header />
                <div className="bg-card border border-hairline rounded-2xl p-10 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-overlay border border-hairline flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-foreground font-medium mb-1">Unlock AI mock interviews</p>
                    <p className="text-muted-foreground text-sm mb-5">Purchase any kit to practise with an AI interviewer and get instant, graded feedback.</p>
                    <a href="/#pricing" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors">
                        View kits <ChevronRight className="w-4 h-4" />
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${phase === 'voice' ? 'max-w-6xl' : 'max-w-3xl'}`}>
            {phase !== 'voice' && <Header />}

            {notice && (
                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 rounded-xl px-4 py-3 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{notice}</span>
                </div>
            )}

            {/* ── SETUP ── */}
            {phase === 'setup' && (
                <>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <p className="text-muted-foreground text-xs">
                            {delivery === 'voice'
                                ? `Spoken interview · up to 5 min · ${AI_INTERVIEW.VOICE_DAILY_LIMIT}/day`
                                : `Each interview asks ${questionCount} questions, then grades you.`}
                        </p>
                        {delivery === 'text' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-700 dark:text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-full px-2.5 py-1">
                                <Clock className="w-3 h-3" />
                                {remaining} of {dailyLimit} left today
                            </span>
                        )}
                    </div>

                    {/* Text vs Voice */}
                    <div className="inline-flex rounded-xl border border-hairline bg-overlay p-1 text-sm">
                        <button onClick={() => setDelivery('text')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${delivery === 'text' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                            <MessageSquare className="w-3.5 h-3.5" /> Text
                        </button>
                        <button onClick={() => setDelivery('voice')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${delivery === 'voice' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                            <Mic className="w-3.5 h-3.5" /> Voice <span className="text-[10px] text-violet-600 dark:text-violet-400">live</span>
                        </button>
                    </div>

                    <div>
                        <p className="text-foreground text-sm font-semibold mb-3">Choose a round</p>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {ROLE_ROUNDS.map(r => (
                                <button
                                    key={r.id}
                                    disabled={busy || (delivery === 'text' && remaining <= 0)}
                                    onClick={() => launch('role', r.id, r.label)}
                                    className="group text-left bg-card border border-hairline rounded-2xl p-4 hover:border-violet-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-overlay border border-hairline flex items-center justify-center text-lg">
                                            <KitLogo nameKey={r.id} fallback={r.emoji} alt={r.label} imgClassName="w-6 h-6 object-contain" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-foreground text-sm font-semibold">{r.label}</p>
                                            <p className="text-muted-foreground text-xs truncate">{r.desc}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {ownedKits.length > 0 && (
                        <div>
                            <p className="text-foreground text-sm font-semibold mb-3">Or interview on a kit you own</p>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {ownedKits.map(k => (
                                    <button
                                        key={k.slug}
                                        disabled={busy || (delivery === 'text' && remaining <= 0)}
                                        onClick={() => launch('kit', k.slug, k.name, k.slug)}
                                        className="group text-left bg-card border border-hairline rounded-2xl p-4 hover:border-violet-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="flex items-center gap-3">
                                            {getKitLogo(k.slug || k.name) ? (
                                                <div className="w-10 h-10 rounded-xl bg-overlay border border-hairline flex items-center justify-center">
                                                    <KitLogo nameKey={k.slug || k.name} alt={k.name} imgClassName="w-6 h-6 object-contain" />
                                                </div>
                                            ) : (
                                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.color || 'from-violet-500 to-purple-600'} flex items-center justify-center text-base`}>{k.icon || '📘'}</div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-foreground text-sm font-semibold truncate">{k.name}</p>
                                                <p className="text-muted-foreground text-xs">Grounded in your kit's topics</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {history.length > 0 && (
                        <div>
                            <p className="text-foreground text-sm font-semibold mb-3">Past interviews</p>
                            <div className="space-y-2">
                                {history.map(h => (
                                    <button
                                        key={h.id}
                                        onClick={() => viewSession(h.id)}
                                        className="w-full text-left bg-card border border-hairline rounded-xl p-3 hover:border-violet-500/30 transition-all flex items-center gap-3"
                                    >
                                        <div className={`text-lg font-bold ${scoreColor(h.overallScore)} w-12 text-center`}>{h.overallScore}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-foreground text-sm font-medium truncate">{h.roundLabel}</p>
                                            <p className="text-muted-foreground text-xs truncate">{h.summary || new Date(h.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── VOICE (live) ── */}
            {phase === 'voice' && voiceCfg && (
                <AiInterviewLive
                    mode={voiceCfg.mode}
                    round={voiceCfg.round}
                    kitSlug={voiceCfg.kitSlug}
                    label={voiceCfg.label}
                    onExit={() => { setVoiceCfg(null); setPhase('setup'); loadMeta(); }}
                />
            )}

            {/* ── LIVE (text) ── */}
            {phase === 'live' && (
                <div className="bg-card border border-hairline rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-violet-700 dark:text-violet-300">{roundLabel}</span>
                        <span className="text-xs text-muted-foreground">Question {qNumber} of {questionCount}</span>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-foreground text-[15px] leading-relaxed flex-1">{question}</p>
                        <button onClick={() => speak(question)} title="Read aloud" className="text-muted-foreground hover:text-foreground p-1">
                            <Volume2 className="w-4 h-4" />
                        </button>
                    </div>

                    <textarea
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                        placeholder="Type your answer, or use the mic to speak it…"
                        rows={5}
                        disabled={busy}
                        className="w-full rounded-xl bg-overlay border border-hairline p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/40 resize-y"
                    />

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleMic}
                            disabled={busy}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${listening ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30' : 'bg-overlay text-muted-foreground border-hairline hover:text-foreground'}`}
                        >
                            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            {listening ? 'Stop' : 'Speak'}
                        </button>
                        <button
                            onClick={() => submitAnswer(false)}
                            disabled={busy || answer.trim().length < 15}
                            title={answer.trim().length < 15 ? 'Write a bit more before submitting' : ''}
                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {qNumber >= questionCount ? 'Submit & finish' : 'Submit answer'}
                        </button>
                        <button
                            onClick={() => submitAnswer(true)}
                            disabled={busy}
                            className="px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground border border-hairline transition-colors disabled:opacity-50"
                            title="End the interview now and grade what you've answered"
                        >
                            End
                        </button>
                    </div>
                </div>
            )}

            {/* ── GRADING ── */}
            {phase === 'grading' && (
                <div className="bg-card border border-hairline rounded-2xl p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
                    <p className="text-foreground font-medium">Evaluating your interview…</p>
                    <p className="text-muted-foreground text-sm mt-1">The AI is scoring your answers and writing feedback.</p>
                </div>
            )}

            {/* ── GRADE ERROR (retriable — transcript is saved) ── */}
            {phase === 'grade-error' && (
                <div className="bg-card border border-hairline rounded-2xl p-10 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="text-foreground font-medium mb-1">Grading didn't finish</p>
                    <p className="text-muted-foreground text-sm mb-5">Your answers are saved — this won't use another interview.</p>
                    <div className="flex items-center justify-center gap-3">
                        <button onClick={() => sessionId && gradeInterview(sessionId)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors">
                            <RotateCcw className="w-4 h-4" /> Retry grading
                        </button>
                        <button onClick={backToSetup} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground border border-hairline">
                            Back
                        </button>
                    </div>
                </div>
            )}

            {/* ── SUMMARY ── */}
            {phase === 'summary' && report && (
                <div className="space-y-5">
                    <InterviewReport report={report} label={`${roundLabel} interview`} />
                    <div className="flex items-center gap-3">
                        <button onClick={backToSetup} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <button onClick={backToSetup} className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors">
                            <RotateCcw className="w-4 h-4" /> New interview
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
