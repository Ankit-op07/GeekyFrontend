/**
 * Shared logic for the AI interview routes: the interviewer persona, prompt
 * builders, the buyer gate, and the IST day helper for the daily cap.
 */

import { getAllowedSlugs } from '@/lib/appConstants';

export type InterviewMode = 'role' | 'kit';

export interface RoundMeta {
    id: string;
    label: string;
    focus: string;
}

/** The fixed role rounds. Kit interviews build their focus from topic titles. */
export const ROLE_ROUNDS: Record<string, RoundMeta> = {
    react: {
        id: 'react',
        label: 'React.js',
        focus: 'React.js — hooks, rendering & reconciliation, state management, performance, component patterns',
    },
    javascript: {
        id: 'javascript',
        label: 'JavaScript',
        focus: 'Core JavaScript — closures, prototypes & this, the event loop and async/await, type coercion, memory',
    },
    'machine-coding': {
        id: 'machine-coding',
        label: 'Machine Coding',
        focus: 'Frontend machine-coding — designing and building a UI component/feature; the candidate describes their approach, data flow, edge cases and code structure verbally',
    },
    hr: {
        id: 'hr',
        label: 'HR / Behavioural',
        focus: 'HR & behavioural — motivation, teamwork and conflict, strengths and weaknesses, past projects, communication',
    },
};

export interface InterviewContext {
    mode: InterviewMode;
    round: string;
    roundLabel: string;
    focus: string;
    kitName?: string;
}

/** Resolve label + focus for a request (role round or kit-grounded). */
export function resolveContext(
    mode: InterviewMode,
    round: string,
    opts: { kitName?: string; topicTitles?: string[] } = {},
): InterviewContext {
    if (mode === 'kit') {
        const titles = (opts.topicTitles || []).slice(0, 60);
        const focus = titles.length
            ? `the "${opts.kitName || round}" syllabus, drawing questions from these topics: ${titles.join('; ')}`
            : `the "${opts.kitName || round}" syllabus`;
        return { mode, round, roundLabel: opts.kitName || round, focus, kitName: opts.kitName };
    }
    const meta = ROLE_ROUNDS[round] || ROLE_ROUNDS.react;
    return { mode, round: meta.id, roundLabel: meta.label, focus: meta.focus };
}

/** Rebuild context from a persisted session (focus was resolved at /start). */
export function contextFromParts(parts: {
    mode: InterviewMode; round: string; roundLabel: string; focus: string;
}): InterviewContext {
    return { ...parts };
}

export function systemPrompt(ctx: InterviewContext): string {
    return [
        'You are a senior frontend engineer conducting a realistic but friendly mock interview.',
        `The focus of this interview is: ${ctx.focus}.`,
        'Ask ONE question at a time. Keep questions concise and conversational, like a real interviewer speaking aloud.',
        'Calibrate difficulty to the candidate\'s answers. Do not answer the questions yourself and do not give feedback mid-interview.',
        'Never break character or mention that you are an AI.',
    ].join(' ');
}

export function firstQuestionPrompt(): string {
    return 'Begin the interview with a suitable opening question. Return ONLY the question text — no preamble, no greeting boilerplate, no numbering, no quotation marks.';
}

export function nextQuestionPrompt(history: { question: string; answer: string }[]): string {
    const convo = history
        .map((t, i) => `Q${i + 1}: ${t.question}\nCandidate: ${t.answer || '(no answer)'}`)
        .join('\n\n');
    return [
        'Here is the interview so far:',
        '',
        convo,
        '',
        'Ask the NEXT question. You may ask a brief follow-up on the last answer if it is worth probing, otherwise move to a new area within the focus. Return ONLY the question text — no preamble, no numbering, no quotation marks.',
    ].join('\n');
}

export function gradePrompt(
    ctx: InterviewContext,
    transcript: { question: string; answer: string }[],
): string {
    const convo = transcript
        .map((t, i) => `Q${i + 1}: ${t.question}\nCandidate: ${t.answer || '(no answer)'}`)
        .join('\n\n');
    return [
        `Grade this ${ctx.roundLabel} mock interview as an experienced interviewer would.`,
        'Judge correctness, depth, clarity, and structure. Be specific, fair, and constructive.',
        '',
        convo,
        '',
        'Return ONLY valid JSON (no prose, no code fence) in EXACTLY this shape:',
        '{"overallScore":<0-100 integer>,"summary":"<2-3 sentence overall assessment>","perQuestion":[{"question":"<the question>","score":<0-100>,"feedback":"<1-2 sentences>"}],"strengths":["<short>","..."],"improvements":["<short>","..."],"recommendedTopics":["<topic to revise>","..."]}',
    ].join('\n');
}

/** Buyer gate. Any purchased kit unlocks role rounds; kit mode needs that kit. */
export function checkAccess(
    purchasedKits: string[] | undefined,
    mode: InterviewMode,
    kitSlug?: string,
): boolean {
    const allowed = getAllowedSlugs(purchasedKits || []);
    if (allowed.size === 0) return false;
    if (mode === 'kit') {
        if (!kitSlug) return false;
        return Array.from(allowed).some((s) => kitSlug.toLowerCase().includes(s.toLowerCase()));
    }
    return true;
}

/** IST (UTC+5:30) YYYY-MM-DD — matches the streak route's day boundary. */
export function istDateStr(date: Date = new Date()): string {
    const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
    return ist.toISOString().slice(0, 10);
}

/** Coerce an LLM-produced grade object into our trusted report shape (never trust its shape). */
export function sanitizeReport(raw: any) {
    const clampScore = (n: any) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
    const strList = (a: any, max = 8): string[] =>
        (Array.isArray(a) ? a : []).filter((s) => typeof s === 'string' && s.trim()).slice(0, max);
    return {
        overallScore: clampScore(raw?.overallScore),
        summary: typeof raw?.summary === 'string' ? raw.summary.slice(0, 2000) : '',
        perQuestion: (Array.isArray(raw?.perQuestion) ? raw.perQuestion : [])
            .slice(0, 20)
            .map((p: any) => ({
                question: String(p?.question || '').slice(0, 1000),
                score: clampScore(p?.score),
                feedback: String(p?.feedback || '').slice(0, 2000),
            })),
        strengths: strList(raw?.strengths),
        improvements: strList(raw?.improvements),
        recommendedTopics: strList(raw?.recommendedTopics),
    };
}
