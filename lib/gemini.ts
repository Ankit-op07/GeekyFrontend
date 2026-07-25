/**
 * Minimal server-side Gemini (Google Generative Language) REST client.
 *
 * Extracted from the hand-rolled fetch used in app/api/admin/quiz/generate and
 * app/api/admin/format-content so paid AI surfaces (the AI interview) share one
 * implementation. The API key is read from GEMINI_API_KEY and NEVER leaves the
 * server — all callers are API routes.
 */

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-flash-latest';

export class GeminiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'GeminiError';
        this.status = status;
    }
}

interface CallOptions {
    /** System instruction (role/behaviour). */
    system?: string;
    /** The user turn / task text. */
    user: string;
    temperature?: number;
    maxOutputTokens?: number;
    model?: string;
    /** e.g. 'application/json' to force structured JSON output. */
    responseMimeType?: string;
    /**
     * "Thinking" token budget. Defaults to 0 (thinking OFF) — none of our calls
     * need chain-of-thought, and on Flash models thoughts are billed tokens and
     * were the dominant cost. Pass a positive number only to re-enable it.
     */
    thinkingBudget?: number;
}

/** Single-turn Gemini call → raw text. Throws GeminiError on failure. */
export async function callGemini(opts: CallOptions): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new GeminiError('GEMINI_API_KEY is not set', 500);
    }

    const model = opts.model || DEFAULT_MODEL;
    const generationConfig: Record<string, unknown> = {
        temperature: opts.temperature ?? 0.7,
        maxOutputTokens: opts.maxOutputTokens ?? 2048,
        // Disable "thinking" by default — the hidden cost driver on Flash models.
        thinkingConfig: { thinkingBudget: opts.thinkingBudget ?? 0 },
    };
    if (opts.responseMimeType) generationConfig.responseMimeType = opts.responseMimeType;
    const body: Record<string, unknown> = {
        contents: [{ parts: [{ text: opts.user }] }],
        generationConfig,
    };
    if (opts.system) {
        body.systemInstruction = { parts: [{ text: opts.system }] };
    }

    const res = await fetch(`${ENDPOINT}/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        // Don't leak the upstream body (may echo the key or internals).
        throw new GeminiError(
            res.status === 403 ? 'Invalid Gemini API key' : `Gemini error (${res.status})`,
            502,
        );
    }

    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) throw new GeminiError('Empty response from Gemini', 502);
    return text;
}

/** Strip a ```json … ``` fence (if present) and return the inner text. */
function stripFence(text: string): string {
    return text.replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/i, '').trim();
}

/**
 * Gemini call that must return JSON. Parses the (possibly fenced) response.
 * Throws GeminiError(502) if the model didn't return parseable JSON.
 */
export async function callGeminiJSON<T = unknown>(opts: CallOptions): Promise<T> {
    // Force JSON output mode (no prose/fences) and give a generous token budget —
    // "thinking" Flash models spend part of the budget on thoughts, so a small
    // cap truncates the JSON and breaks parsing.
    const text = await callGemini({
        temperature: 0.4,
        maxOutputTokens: 8192,
        ...opts,
        responseMimeType: 'application/json',
    });
    try {
        return JSON.parse(stripFence(text)) as T;
    } catch {
        throw new GeminiError('Gemini did not return valid JSON', 502);
    }
}
