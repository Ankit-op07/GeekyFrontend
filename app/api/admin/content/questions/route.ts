import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import QuizQuestion from '@/lib/models/QuizQuestion';
import { requireAdmin } from '@/lib/admin-auth';
import { verifyPredictOutput } from '@/lib/quiz/verify-output';

// vm-based verification needs the Node runtime, not edge.
export const runtime = 'nodejs';

/**
 * Admin CRUD for quiz questions. Mirrors app/api/admin/content/{kits,chapters,
 * topics}/route.ts (requireAdmin → connect → operate).
 *
 * On create/update we re-run the QA gate for the question's type so
 * `verified`/`verifiedBy`/`verifyNote` always describe the CURRENT content — a
 * stale "verified" on an edited question is worse than no flag at all.
 *
 * PUBLICATION RULE: a question the gate has PROVEN wrong (its snippet's real
 * output contradicts the marked answer) cannot be set live, by anyone, ever.
 * That is the one failure mode PRD-005 §13 Q13 calls a trust incident rather
 * than a bug: telling a correct learner they are wrong. Everything softer —
 * 'inconclusive', or a concept question with no mechanical gate — stays a human
 * judgement call and publishes freely.
 *
 * GET    ?topicId= | ?kitId=   → list (admin sees drafts too)
 * POST   { ...question }       → create
 * PUT    { _id, ...update }    → update
 * DELETE ?id=                  → remove
 */

interface GateResult {
    verified: boolean;
    verifiedBy?: 'vm' | 'peer';
    verifyNote: string;
    /** 'mismatch' is the only verdict that blocks publication. */
    status: 'match' | 'mismatch' | 'inconclusive' | 'not-applicable';
}

async function runGate(doc: {
    type?: string;
    code?: string;
    options: string[];
    correctIndex: number;
}): Promise<GateResult> {
    const type = doc.type ?? 'predict-output';

    if (type !== 'predict-output') {
        // A concept question has no snippet to run. It earns `verified` only via
        // independent-solver agreement at authoring time; an admin writing one
        // by hand here is the reviewer, so we record honestly that nothing
        // mechanical checked it rather than implying it passed.
        return {
            verified: false,
            verifyNote: 'concept: no automated gate — accuracy is the author\'s call.',
            status: 'not-applicable',
        };
    }

    const r = await verifyPredictOutput({
        code: doc.code ?? '',
        options: doc.options,
        correctIndex: doc.correctIndex,
    });
    return {
        verified: r.status === 'match',
        verifiedBy: r.status === 'match' ? 'vm' : undefined,
        verifyNote: `${r.status}: ${r.note}`,
        status: r.status,
    };
}

/** Shared 409 for "the gate proved this answer wrong". */
const refusePublish = (gate: GateResult) =>
    NextResponse.json(
        {
            error: 'Cannot publish: the snippet\'s actual output contradicts the marked answer.',
            detail: gate.verifyNote,
            hint: 'Fix the code, the options, or correctIndex — then set it live.',
        },
        { status: 409 }
    );

export async function GET(req: NextRequest) {
    const forbidden = requireAdmin(req);
    if (forbidden) return forbidden;
    try {
        await connectToDatabase();
        const { searchParams } = req.nextUrl;
        const topicId = searchParams.get('topicId');
        const kitId = searchParams.get('kitId');
        const filter: Record<string, unknown> = {};
        if (topicId) filter.topicId = topicId;
        if (kitId) filter.kitId = kitId;
        const questions = await QuizQuestion.find(filter).sort({ order: 1, createdAt: 1 }).lean();
        return NextResponse.json({ questions });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const forbidden = requireAdmin(req);
    if (forbidden) return forbidden;
    try {
        await connectToDatabase();
        const body = await req.json().catch(() => null);
        if (!body?.kitId || !body?.prompt || !Array.isArray(body?.options)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const gate = await runGate(body);
        const status = body.status || 'draft';
        if (status === 'live' && gate.status === 'mismatch') return refusePublish(gate);

        const question = await QuizQuestion.create({
            kitId: body.kitId,
            topicId: body.topicId || undefined,
            type: body.type || 'predict-output',
            prompt: body.prompt,
            code: body.code || '',
            language: body.language || 'javascript',
            options: body.options,
            correctIndex: body.correctIndex ?? 0,
            explanation: body.explanation || '',
            difficulty: body.difficulty || 'medium',
            tags: body.tags || [],
            status,
            source: body.source || 'manual',
            order: body.order ?? 0,
            verified: gate.verified,
            verifiedBy: gate.verifiedBy,
            verifyNote: gate.verifyNote,
        });
        return NextResponse.json({ question }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const forbidden = requireAdmin(req);
    if (forbidden) return forbidden;
    try {
        await connectToDatabase();
        const body = await req.json().catch(() => null);
        const { _id, ...update } = body || {};
        if (!_id) return NextResponse.json({ error: 'Missing _id' }, { status: 400 });

        const current = (await QuizQuestion.findById(_id).lean()) as any;
        if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Re-grade whenever an answer-defining field changes, OR when something
        // is being promoted to live — publication must be decided on a verdict
        // about the content as it stands right now, not one cached from before
        // the last edit.
        const answerChanged =
            update.code !== undefined ||
            update.options !== undefined ||
            update.correctIndex !== undefined ||
            update.type !== undefined;
        const goingLive = update.status === 'live' && current.status !== 'live';

        if (answerChanged || goingLive) {
            const gate = await runGate({
                type: update.type ?? current.type,
                code: update.code ?? current.code,
                options: update.options ?? current.options,
                correctIndex: update.correctIndex ?? current.correctIndex,
            });
            const willBeLive = (update.status ?? current.status) === 'live';
            if (willBeLive && gate.status === 'mismatch') return refusePublish(gate);

            update.verified = gate.verified;
            update.verifyNote = gate.verifyNote;
            // An edit invalidates a prior 'peer' corroboration too — the blind
            // solver agreed with the OLD wording, not this one.
            update.verifiedBy = gate.verifiedBy ?? undefined;
        }

        const question = await QuizQuestion.findByIdAndUpdate(_id, update, { new: true }).lean();
        return NextResponse.json({ question });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const forbidden = requireAdmin(req);
    if (forbidden) return forbidden;
    try {
        await connectToDatabase();
        const id = req.nextUrl.searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        await QuizQuestion.findByIdAndDelete(id);
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
