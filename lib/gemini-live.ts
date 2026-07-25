import { GoogleGenAI } from '@google/genai';
import { AI_INTERVIEW } from '@/lib/appConstants';

/**
 * Server-authored Gemini Live config for a voice interview. Returned to the
 * browser AND locked into the ephemeral token, so the two always match and the
 * client can't tamper with the persona or language.
 *
 * Key settings (fixes from real testing):
 *  - speechConfig.languageCode 'en-US' + an English-only instruction, so the
 *    native-audio model doesn't drift into Tamil/Hindi on accented English.
 *  - realtimeInputConfig VAD tuning so end-of-speech is detected promptly
 *    (less "it heard me late").
 *  - input/output transcription on, for the graded report afterwards.
 */
export function buildLiveConfig(systemInstruction: string) {
    return {
        responseModalities: ['AUDIO'],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        speechConfig: { languageCode: 'en-US' },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        realtimeInputConfig: {
            // Push-to-talk: DISABLE server auto voice-detection. The client sends
            // explicit activityStart/activityEnd and only streams mic audio while
            // the user holds "talk", so the AI's own voice never loops into the
            // mic (no echo) and there's no VAD confusion — instant, reliable input.
            automaticActivityDetection: { disabled: true },
        },
    };
}

/**
 * Mint a single-use ephemeral token for a browser-direct Gemini Live session,
 * locked to the given config. The GEMINI_API_KEY never leaves the server.
 * expireTime covers the whole session (maxSeconds + buffer) so the socket isn't
 * killed mid-interview; newSessionExpireTime is short (time to connect).
 */
export async function mintLiveToken(config: object, maxSeconds: number): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

    const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: 'v1alpha' } });
    const now = Date.now();
    const token = await ai.authTokens.create({
        config: {
            uses: 1,
            expireTime: new Date(now + (maxSeconds + 120) * 1000).toISOString(),
            newSessionExpireTime: new Date(now + 2 * 60 * 1000).toISOString(),
            liveConnectConstraints: { model: AI_INTERVIEW.LIVE_MODEL, config },
        },
    });

    if (!token?.name) throw new Error('Failed to mint live token');
    return token.name;
}
