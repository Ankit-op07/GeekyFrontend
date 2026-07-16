import vm from 'node:vm';

/**
 * PRD-005 — the predict-output QA gate.
 *
 * Executes a question's code snippet in a throwaway V8 context, captures what it
 * logs (and models microtasks + timers so event-loop questions resolve), then
 * checks whether the ACTUAL output matches the option marked correct.
 *
 * This runs ONLY on admin-authored / AI-generated content, never on learner
 * input, so a plain `vm` context (not a hardened sandbox) is acceptable — the
 * threat model is "a bad AI draft", not "a hostile user". It exists to catch the
 * single worst failure mode: a live question that tells a correct learner they
 * are wrong. A `mismatch` is a proven-wrong answer and is refused publication by
 * the admin API; `inconclusive` means the gate could not evaluate the snippet
 * cleanly and a human decides. Nothing is ever silently passed.
 *
 * Matching is deliberately forgiving (strips surrounding quotes, collapses
 * whitespace) because option text is human/AI-written prose, not a byte-exact
 * console transcript. For AI generation we additionally instruct the model to
 * make options the literal console output, which makes `match` reliable.
 */

export type VerifyStatus = 'match' | 'mismatch' | 'inconclusive';

export interface VerifyResult {
    status: VerifyStatus;
    /** what the snippet actually produced (joined logs, or the thrown error name). */
    actualOutput: string | null;
    note: string;
}

function formatArg(a: unknown): string {
    if (typeof a === 'string') return a;
    if (typeof a === 'number' || typeof a === 'boolean' || typeof a === 'bigint') return String(a);
    if (a === null) return 'null';
    if (a === undefined) return 'undefined';
    if (typeof a === 'function') return '[Function]';
    try {
        return JSON.stringify(a);
    } catch {
        return String(a);
    }
}

/** Let the real microtask queue drain between simulated event-loop steps. */
function flushMicrotasks(): Promise<void> {
    return new Promise((resolve) => setImmediate(resolve));
}

interface RunResult {
    logs: string[];
    threw: string | null; // error *name* (e.g. "ReferenceError"), if it threw
}

/**
 * Read an error's name across a realm boundary.
 *
 * Errors thrown inside a vm context are built from THAT context's intrinsics, so
 * their prototype chain points at the vm's `Error`, not ours — host-side
 * `e instanceof Error` is false for every one of them. Branching on `instanceof`
 * therefore collapsed every thrown error to the literal string "Error", which
 * matches no option and made the gate return `inconclusive` for the whole class
 * of error-prediction questions. Read `.name` directly instead.
 */
function errorName(e: unknown): string {
    const name = (e as { name?: unknown } | null)?.name;
    return typeof name === 'string' && name ? name : 'Error';
}

/** Timer scheduled by the snippet, on the virtual clock. */
interface VirtualTimer {
    time: number; // absolute virtual ms — `now + delay` at schedule time
    seq: number; // tie-break: scheduling order at equal time
    fn: () => void;
}

/** Backstop for a snippet whose timers reschedule themselves forever. */
const MAX_TIMER_TICKS = 1000;

async function runSnippet(code: string, timeoutMs = 1000): Promise<RunResult> {
    const logs: string[] = [];
    const timers: VirtualTimer[] = [];
    let seq = 0;
    let now = 0; // virtual clock, advanced by whichever timer fires next

    const record = (...args: unknown[]) => logs.push(args.map(formatArg).join(' '));

    // NOTE: pass ONLY host functions the snippet cannot get from its own realm
    // (console, timers). Do NOT pass Object/Array/Promise/Date/etc. — a
    // contextified object already has realm-native intrinsics, and handing it
    // ours SHADOWS them, at which point `({}) instanceof Object` is false inside
    // the sandbox and every prototype/coercion question grades against broken
    // semantics.
    const sandbox: Record<string, unknown> = {
        console: { log: record, info: record, warn: record, error: record, debug: record },
        setTimeout: (fn: () => void, delay = 0) => {
            timers.push({ time: now + (Number(delay) || 0), seq: seq++, fn });
            return timers.length;
        },
        clearTimeout: () => {},
        setInterval: () => 0, // intervals aren't modelled; they'd never terminate
        clearInterval: () => {},
        queueMicrotask: (fn: () => void) => Promise.resolve().then(fn),
    };

    const context = vm.createContext(sandbox);

    let threw: string | null = null;
    try {
        // `timeout` only interrupts synchronous work — enough to kill an
        // accidental infinite loop in a bad snippet.
        vm.runInContext(code, context, { timeout: timeoutMs });
    } catch (e) {
        threw = errorName(e);
    }

    // Minimal event loop: drain microtasks, then repeatedly fire the earliest
    // pending timer, draining microtasks after each. Re-selecting the earliest
    // every tick (rather than sorting once up front) is what makes a timer
    // scheduled *by another timer* land in the right place — the common shape in
    // event-loop interview questions.
    await flushMicrotasks();
    for (let tick = 0; timers.length > 0 && tick < MAX_TIMER_TICKS; tick++) {
        let next = 0;
        for (let i = 1; i < timers.length; i++) {
            const t = timers[i];
            const best = timers[next];
            if (t.time < best.time || (t.time === best.time && t.seq < best.seq)) next = i;
        }
        const t = timers.splice(next, 1)[0];
        now = Math.max(now, t.time);
        try {
            t.fn();
        } catch {
            /* a timer callback throwing doesn't change the primary output */
        }
        await flushMicrotasks();
    }

    return { logs, threw };
}

function normalize(s: string): string {
    return s
        .trim()
        .replace(/^['"`]+|['"`]+$/g, '') // strip surrounding quotes/backticks
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Verify that `options[correctIndex]` is what the snippet actually produces.
 * Never throws — failure to evaluate returns `inconclusive`.
 */
export async function verifyPredictOutput(question: {
    code: string;
    options: string[];
    correctIndex: number;
}): Promise<VerifyResult> {
    const { code, options, correctIndex } = question;

    if (
        !Array.isArray(options) ||
        options.length === 0 ||
        correctIndex < 0 ||
        correctIndex >= options.length
    ) {
        return { status: 'inconclusive', actualOutput: null, note: 'Malformed question (options/correctIndex).' };
    }

    let run: RunResult;
    try {
        run = await runSnippet(code);
    } catch (e) {
        return {
            status: 'inconclusive',
            actualOutput: null,
            note: `Could not execute snippet: ${e instanceof Error ? e.message : String(e)}`,
        };
    }

    const actual = run.threw ? run.threw : run.logs.join('\n');
    const normActual = normalize(actual);

    const matched = options
        .map((o, i) => ({ i, hit: normalize(o) === normActual }))
        .filter((x) => x.hit)
        .map((x) => x.i);

    if (matched.length === 1 && matched[0] === correctIndex) {
        return { status: 'match', actualOutput: actual, note: 'Actual output matches the marked answer.' };
    }
    if (matched.length >= 1 && !matched.includes(correctIndex)) {
        return {
            status: 'mismatch',
            actualOutput: actual,
            note: `Actual output "${actual}" matches option ${matched[0]} ("${options[matched[0]]}"), not the marked correct option ${correctIndex} ("${options[correctIndex]}").`,
        };
    }
    if (matched.length > 1) {
        return {
            status: 'inconclusive',
            actualOutput: actual,
            note: `Output "${actual}" matched more than one option — options may be ambiguous.`,
        };
    }
    return {
        status: 'inconclusive',
        actualOutput: actual,
        note: `Output "${actual}" did not cleanly match any option (async/error/formatting) — needs human review.`,
    };
}
