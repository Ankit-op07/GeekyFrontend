import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Topic from '@/lib/models/Topic';
import QuizQuestion from '@/lib/models/QuizQuestion';
import { requireAdmin } from '@/lib/admin-auth';
import { verifyPredictOutput } from '@/lib/quiz/verify-output';

// Gemini call + vm verification → Node runtime.
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/admin/quiz/generate   Body: { topicId, count? }
 *
 * PRD-005 §8 content pipeline, adapted to predict-output MCQs:
 *   1. pull the topic's lesson content
 *   2. ask Gemini for `count` predict-output questions as strict JSON
 *   3. run EACH through the QA gate (execute the snippet, confirm the marked
 *      answer is the real output) — auto-`verified` only on a clean match
 *   4. save all as status:'draft', source:'ai' for human review
 *
 * A human still approves drafts → 'live'. The gate just means a reviewer is
 * fixing/approving, not hunting for silently-wrong answers.
 *
 * SCOPE: predict-output only, so it fits the ~10-20 topics that are runnable
 * plain JS. Most of the catalogue (React, ARIA, security, rendering) is
 * 'concept', which has no snippet to execute and therefore no gate this route
 * could apply — those are authored offline and imported by
 * scripts/quiz-insert-authored.ts, which corroborates them by blind re-solve.
 */

const SYSTEM_PROMPT = `You are an expert JavaScript interviewer writing "predict the output" multiple-choice questions.

Rules — follow EXACTLY:
- Each question shows a short, self-contained JavaScript snippet that uses console.log to print something.
- The snippet MUST be deterministic: no Math.random, no Date.now, no real network/time dependence.
- Provide exactly 4 options. Exactly one is correct.
- CRITICAL: the correct option must be the LITERAL console output. If the code logs 3 lines "3", "3", "3", the correct option is "3 3 3" (space-separated). If it throws, the correct option is the error name like "ReferenceError". Do not wrap string output in quotes.
- Wrong options must be plausible (common misconceptions), not absurd.
- Keep snippets focused on the concepts in the provided lesson content (closures, this, hoisting, event loop, promises, coercion, etc.).
- explanation: one or two plain sentences. Do NOT use markdown, backticks, or asterisks.

Return ONLY valid JSON, no prose, in this exact shape:
{"questions":[{"prompt":"What does this log?","code":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"...","difficulty":"easy|medium|hard"}]}`;

export async function POST(req: NextRequest) {
    const forbidden = requireAdmin(req);
    if (forbidden) return forbidden;

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY is not set. Get one at https://aistudio.google.com/apikey' },
                { status: 500 }
            );
        }

        const body = await req.json().catch(() => null);
        const topicId = body?.topicId;
        const count = Math.min(Math.max(Number(body?.count) || 5, 1), 10);
        if (!topicId) {
            return NextResponse.json({ error: 'Missing topicId' }, { status: 400 });
        }

        await connectToDatabase();
        const topic = await Topic.findById(topicId).select('title content kitId').lean() as any;
        if (!topic) {
            return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
        }

        // Trim content so we stay within a reasonable prompt size.
        const lesson = String(topic.content || '').slice(0, 8000);

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: SYSTEM_PROMPT },
                                { text: `\n\nGenerate ${count} questions. Topic: "${topic.title}".\n\nLesson content:\n\n${lesson}` },
                            ],
                        },
                    ],
                    generationConfig: { temperature: 0.4, maxOutputTokens: 8192 },
                }),
            }
        );

        if (!response.ok) {
            const status = response.status;
            return NextResponse.json(
                { error: status === 403 ? 'Invalid Gemini API key' : `Gemini error (${status})` },
                { status: 500 }
            );
        }

        const data = await response.json();
        const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();

        let parsed: any;
        try {
            parsed = JSON.parse(cleaned);
        } catch {
            return NextResponse.json(
                { error: 'Gemini returned unparseable JSON. Try again.' },
                { status: 502 }
            );
        }

        const rawQuestions: any[] = Array.isArray(parsed?.questions) ? parsed.questions : [];
        if (rawQuestions.length === 0) {
            return NextResponse.json({ error: 'No questions generated. Try again.' }, { status: 502 });
        }

        // Verify each, then persist as drafts.
        const toInsert = [];
        let matched = 0;
        for (const q of rawQuestions) {
            if (!q?.code || !Array.isArray(q?.options) || q.options.length < 2) continue;
            const correctIndex = Number.isInteger(q.correctIndex) ? q.correctIndex : 0;
            const gate = await verifyPredictOutput({ code: q.code, options: q.options, correctIndex });
            toInsert.push({
                kitId: topic.kitId,
                topicId: topic._id,
                type: 'predict-output',
                prompt: q.prompt || 'What does this log?',
                code: q.code,
                language: 'javascript',
                options: q.options.map(String),
                correctIndex,
                explanation: q.explanation || '',
                difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
                tags: [],
                status: 'draft' as const,
                source: 'ai' as const,
                verified: gate.status === 'match',
                verifiedBy: gate.status === 'match' ? ('vm' as const) : undefined,
                verifyNote: `${gate.status}: ${gate.note}`,
                order: 0,
            });
            if (gate.status === 'match') matched++;
        }

        if (toInsert.length === 0) {
            return NextResponse.json({ error: 'Generated questions were malformed.' }, { status: 502 });
        }

        const created = await QuizQuestion.insertMany(toInsert);

        return NextResponse.json({
            created: created.length,
            verified: matched,
            needsReview: created.length - matched,
            questions: created,
        }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
