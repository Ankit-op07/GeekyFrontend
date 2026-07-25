'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Loader2, PhoneOff, ArrowLeft, RotateCcw, AlertCircle, Radio, Sparkles } from 'lucide-react';
import { InterviewReport, type Report } from './interview-report';

type Line = { role: 'user' | 'model'; text: string };
type Phase = 'ready' | 'connecting' | 'live' | 'grading' | 'summary' | 'error' | 'grade-error';

// Off-main-thread mic capture. Crucially, it RESAMPLES from the AudioContext's
// real rate (usually 48 kHz — browsers ignore a forced 16 kHz) down to the
// 16 kHz mono PCM16 Gemini expects, using a box-average decimator. Sending audio
// at the wrong rate was the main cause of "it doesn't register my voice" (the
// model heard slowed-down, garbled speech). `sampleRate` is a global in the
// worklet scope = the context's true rate.
const CAPTURE_WORKLET = `
class PCM16Worklet extends AudioWorkletProcessor {
  constructor(){ super(); this.ratio = sampleRate / 16000; this.phase = 0; this.sum = 0; this.cnt = 0; this.acc = []; }
  process(inputs){
    const ch = inputs[0] && inputs[0][0];
    if (ch) {
      for (let i=0;i<ch.length;i++){
        this.sum += ch[i]; this.cnt++;
        this.phase += 1;
        if (this.phase >= this.ratio){
          this.phase -= this.ratio;
          this.acc.push(this.cnt ? this.sum/this.cnt : 0);
          this.sum = 0; this.cnt = 0;
        }
      }
      if (this.acc.length >= 1024){           // ~64ms of 16 kHz audio per message
        const f=this.acc; this.acc=[];
        const i16=new Int16Array(f.length);
        for (let i=0;i<f.length;i++){ let s=f[i]; s=s<-1?-1:(s>1?1:s); i16[i]= s<0 ? s*0x8000 : s*0x7fff; }
        this.port.postMessage(i16.buffer, [i16.buffer]);
      }
    }
    return true;
  }
}
registerProcessor('pcm16-worklet', PCM16Worklet);
`;

function bytesToB64(bytes: Uint8Array): string {
    let bin = ''; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
}
function b64ToBytes(b64: string): Uint8Array {
    const bin = atob(b64); const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}

export function AiInterviewLive({
    mode, round, kitSlug, label, onExit,
}: {
    mode: 'role' | 'kit'; round: string; kitSlug?: string; label: string; onExit: () => void;
}) {
    const [phase, setPhase] = useState<Phase>('ready');
    const [notice, setNotice] = useState<string | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [maxSeconds, setMaxSeconds] = useState(300);
    const [speaking, setSpeaking] = useState(false);        // AI speaking
    const [talking, setTalking] = useState(false);          // user holding push-to-talk
    const [messages, setMessages] = useState<Line[]>([]);   // throttled transcript for display
    const [report, setReport] = useState<Report | null>(null);
    const talkingRef = useRef(false);

    const sessionRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const micCtxRef = useRef<AudioContext | null>(null);
    const playCtxRef = useRef<AudioContext | null>(null);
    const workletRef = useRef<AudioWorkletNode | null>(null);
    const nextPlayRef = useRef(0);
    const playingRef = useRef<AudioBufferSourceNode[]>([]);
    const suppressUntilRef = useRef(0); // ignore in-flight AI audio right after a barge-in
    const transcriptRef = useRef<Line[]>([]);
    const sessionIdRef = useRef<string | null>(null);
    const timerRef = useRef<any>(null);
    const flushRef = useRef<any>(null);
    const endedRef = useRef(false);
    const scrollRef = useRef<HTMLDivElement | null>(null);

    const teardownAudio = useCallback(() => {
        try { sessionRef.current?.close?.(); } catch { /* noop */ }
        sessionRef.current = null;
        try { workletRef.current?.disconnect(); } catch { /* noop */ }
        workletRef.current = null;
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        try { micCtxRef.current?.close(); } catch { /* noop */ }
        try { playCtxRef.current?.close(); } catch { /* noop */ }
        micCtxRef.current = null; playCtxRef.current = null;
        playingRef.current = [];
        if (timerRef.current) clearInterval(timerRef.current);
        if (flushRef.current) clearInterval(flushRef.current);
    }, []);

    useEffect(() => () => teardownAudio(), [teardownAudio]);

    // Keep the transcript panel scrolled to the latest line.
    useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages]);

    const flushPlayback = () => {
        playingRef.current.forEach(s => { try { s.stop(); } catch { /* noop */ } });
        playingRef.current = [];
        nextPlayRef.current = 0;
        // Drop any AI audio still in flight for the turn we just cut off.
        suppressUntilRef.current = performance.now() + 300;
        setSpeaking(false);
    };

    const playChunk = (b64: string) => {
        const ctx = playCtxRef.current; if (!ctx) return;
        if (performance.now() < suppressUntilRef.current) return; // just barged in
        const bytes = b64ToBytes(b64);
        const i16 = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
        const f32 = new Float32Array(i16.length);
        for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 0x8000;
        const buf = ctx.createBuffer(1, f32.length, 24000);
        buf.getChannelData(0).set(f32);
        const src = ctx.createBufferSource();
        src.buffer = buf; src.connect(ctx.destination);
        const t = Math.max(ctx.currentTime, nextPlayRef.current);
        src.start(t);
        nextPlayRef.current = t + buf.duration;
        setSpeaking(true);
        src.onended = () => {
            playingRef.current = playingRef.current.filter(s => s !== src);
            if (playingRef.current.length === 0) setSpeaking(false);
        };
        playingRef.current.push(src);
    };

    // Append transcription text to the running transcript (merging consecutive
    // same-speaker chunks). This mutates a ref on the hot path; the visible panel
    // is refreshed on a throttled interval, not per chunk.
    const appendTranscript = (role: 'user' | 'model', text: string) => {
        const last = transcriptRef.current[transcriptRef.current.length - 1];
        if (last && last.role === role) last.text += text;
        else transcriptRef.current.push({ role, text });
    };

    const gradeSession = useCallback(async (sid: string) => {
        setPhase('grading');
        try {
            const res = await fetch('/api/interview/live/finish', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: sid, transcript: transcriptRef.current }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.report) { setReport(data.report); setPhase('summary'); return; }
            if (res.ok && data.aborted) { setNotice('Interview ended early — no report. Your daily slot was refunded.'); onExit(); return; }
            setNotice(data.error || 'Could not grade the interview.'); setPhase('grade-error');
        } catch {
            setNotice('Could not grade the interview.'); setPhase('grade-error');
        }
    }, [onExit]);

    const endInterview = useCallback(async () => {
        if (endedRef.current) return;
        endedRef.current = true;
        teardownAudio();
        const sid = sessionIdRef.current;
        if (!sid) { onExit(); return; }
        await gradeSession(sid);
    }, [onExit, teardownAudio, gradeSession]);

    // Push-to-talk. Press interrupts the AI (barge-in) and opens the mic; release
    // closes the turn so the model answers.
    const startTalking = useCallback(() => {
        const s = sessionRef.current;
        if (!s || talkingRef.current || endedRef.current) return;
        flushPlayback();
        talkingRef.current = true; setTalking(true);
        try { s.sendRealtimeInput({ activityStart: {} }); } catch { /* closed */ }
    }, []);

    const stopTalking = useCallback(() => {
        const s = sessionRef.current;
        if (!s || !talkingRef.current) return;
        talkingRef.current = false; setTalking(false);
        try { s.sendRealtimeInput({ activityEnd: {} }); } catch { /* closed */ }
    }, []);

    const start = async () => {
        setNotice(null);
        setPhase('connecting');
        endedRef.current = false;
        transcriptRef.current = [];
        setMessages([]);
        try {
            const res = await fetch('/api/interview/live/start', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode, round, kitSlug }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.status === 429) { setNotice('You’ve used your voice interviews for today. Come back tomorrow!'); setPhase('error'); return; }
            if (res.status === 403) { setNotice('Voice interview is available to kit owners.'); setPhase('error'); return; }
            if (!res.ok || !data.token) { setNotice(data.error || 'Could not start. Try again shortly.'); setPhase('error'); return; }
            sessionIdRef.current = data.sessionId;
            setMaxSeconds(data.maxSeconds || 300);

            const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
            streamRef.current = stream;
            // Native rates — the worklet resamples the mic to 16 kHz, and the
            // 24 kHz AI buffers are auto-resampled by the playback context. Forcing
            // a context rate is silently ignored on many browsers, which corrupted
            // the audio.
            const micCtx = new AudioContext();
            micCtxRef.current = micCtx;
            const playCtx = new AudioContext();
            playCtxRef.current = playCtx;
            await micCtx.resume(); await playCtx.resume();

            const { GoogleGenAI } = await import('@google/genai/web');
            const ai = new (GoogleGenAI as any)({ apiKey: data.token, httpOptions: { apiVersion: 'v1alpha' } });
            const session = await ai.live.connect({
                model: data.model,
                config: data.config,   // server-authored: English-locked, VAD-tuned, transcription on
                callbacks: {
                    onopen: () => { /* connected */ },
                    onmessage: (msg: any) => {
                        const sc = msg.serverContent;
                        if (!sc) return;
                        if (sc.interrupted) flushPlayback();
                        if (sc.modelTurn?.parts) for (const p of sc.modelTurn.parts) {
                            if (p.inlineData?.data) playChunk(p.inlineData.data);
                        }
                        if (sc.outputTranscription?.text) appendTranscript('model', sc.outputTranscription.text);
                        if (sc.inputTranscription?.text) appendTranscript('user', sc.inputTranscription.text);
                    },
                    onerror: () => { setNotice('The voice connection dropped.'); endInterview(); },
                    onclose: () => { if (!endedRef.current) endInterview(); },
                },
            });
            sessionRef.current = session;

            // Off-thread PCM16 capture → stream to Gemini.
            const blob = new Blob([CAPTURE_WORKLET], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            await micCtx.audioWorklet.addModule(url);
            URL.revokeObjectURL(url);
            const node = new AudioWorkletNode(micCtx, 'pcm16-worklet');
            node.port.onmessage = (e) => {
                // Push-to-talk: only stream mic audio while the user holds "talk".
                if (endedRef.current || !talkingRef.current) return;
                try { session.sendRealtimeInput({ audio: { data: bytesToB64(new Uint8Array(e.data)), mimeType: 'audio/pcm;rate=16000' } }); } catch { /* closed */ }
            };
            micCtx.createMediaStreamSource(stream).connect(node);
            workletRef.current = node;

            // Kick off + throttled UI refresh + capped timer.
            try { session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: 'Begin the interview with your first question.' }] }], turnComplete: true }); } catch { /* noop */ }
            setPhase('live');
            // Only render the last few lines, refreshed at 400ms — keeps the main
            // thread free so the mic-send path is never starved.
            flushRef.current = setInterval(() => setMessages(transcriptRef.current.slice(-8).map(m => ({ ...m }))), 400);
            const startedAt = Date.now();
            timerRef.current = setInterval(() => {
                const s = Math.floor((Date.now() - startedAt) / 1000);
                setElapsed(s);
                if (s >= (data.maxSeconds || 300)) endInterview();
            }, 1000);
        } catch (err: any) {
            teardownAudio();
            setNotice(err?.name === 'NotAllowedError' ? 'Microphone permission is required for a voice interview.' : 'Could not start the voice interview.');
            setPhase('error');
        }
    };

    const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    // ── Summary ──
    if (phase === 'summary' && report) {
        return (
            <div className="space-y-5 max-w-4xl mx-auto">
                <InterviewReport report={report} label={`${label} · voice interview`} />
                <button onClick={onExit} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium"><RotateCcw className="w-4 h-4" /> Done</button>
            </div>
        );
    }

    // ── Live "interview room" (full width) ──
    if (phase === 'live') {
        return (
            <div className="min-h-[calc(100vh-8rem)] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" /></span>
                        <span className="text-sm font-semibold text-foreground">Live · {label}</span>
                    </div>
                    <span className={`text-sm font-mono px-3 py-1 rounded-full border ${elapsed >= maxSeconds - 30 ? 'text-red-500 border-red-500/30 bg-red-500/10' : 'text-muted-foreground border-hairline bg-overlay'}`}>{mmss(elapsed)} / {mmss(maxSeconds)}</span>
                </div>

                <div className="grid lg:grid-cols-5 gap-6 flex-1">
                    {/* Left: push-to-talk control */}
                    <div className="lg:col-span-2 bg-card border border-hairline rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent pointer-events-none" />
                        <p className={`text-xs font-medium mb-5 h-4 transition-opacity ${speaking ? 'opacity-100 text-violet-600 dark:text-violet-400' : 'opacity-0'}`}>● Interviewer is speaking</p>
                        <button
                            onPointerDown={startTalking}
                            onPointerUp={stopTalking}
                            onPointerLeave={stopTalking}
                            onPointerCancel={stopTalking}
                            onContextMenu={(e) => e.preventDefault()}
                            className={`relative select-none touch-none w-44 h-44 rounded-full flex flex-col items-center justify-center gap-2 font-semibold text-white transition-all duration-150 ${talking ? 'bg-gradient-to-br from-red-500 to-rose-600 scale-105 shadow-2xl shadow-red-900/40' : 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-xl shadow-violet-900/30 hover:scale-[1.02]'}`}
                        >
                            {talking && <span className="absolute inset-0 rounded-full bg-red-400/30 animate-ping" />}
                            <Mic className="w-10 h-10" />
                            <span className="text-sm">{talking ? 'Listening…' : 'Hold to talk'}</span>
                        </button>
                        <p className="text-muted-foreground text-xs mt-5">{talking ? 'Release to send your answer' : 'Press & hold, speak, then release'}</p>
                        <button onClick={endInterview} className="mt-6 flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium"><PhoneOff className="w-4 h-4" /> End &amp; get feedback</button>
                    </div>

                    {/* Right: live transcript */}
                    <div className="lg:col-span-3 bg-card border border-hairline rounded-3xl flex flex-col overflow-hidden">
                        <div className="px-5 py-3 border-b border-hairline flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-violet-500" />
                            <span className="text-sm font-medium text-foreground">Live transcript</span>
                        </div>
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[300px]">
                            {messages.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center mt-10">The conversation will appear here…</p>
                            ) : messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-violet-600 text-white' : 'bg-overlay text-foreground border border-hairline'}`}>
                                        <p className={`text-[10px] font-semibold mb-0.5 ${m.role === 'user' ? 'text-violet-100' : 'text-violet-500'}`}>{m.role === 'user' ? 'You' : 'Interviewer'}</p>
                                        {m.text || '…'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Ready / connecting / grading / errors (centered card) ──
    return (
        <div className="max-w-2xl mx-auto space-y-5">
            <button onClick={onExit} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> Back</button>

            {notice && (
                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 rounded-xl px-4 py-3 text-sm"><AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{notice}</span></div>
            )}

            {(phase === 'ready' || phase === 'error') && (
                <div className="bg-card border border-hairline rounded-3xl p-10 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet-900/20"><Mic className="w-8 h-8 text-white" /></div>
                    <p className="text-foreground font-bold text-lg mb-1">Voice interview · {label}</p>
                    <p className="text-muted-foreground text-sm mb-2">A real spoken conversation with an AI interviewer.</p>
                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mb-7">
                        <span>🎙️ Hold to talk</span><span>·</span><span>🗣️ English</span><span>·</span><span>⏱️ up to {Math.round(maxSeconds / 60)} min</span>
                    </div>
                    <button onClick={start} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-semibold shadow-lg shadow-violet-900/20 transition-colors"><Mic className="w-4 h-4" /> {phase === 'error' ? 'Try again' : 'Start voice interview'}</button>
                </div>
            )}

            {phase === 'connecting' && (
                <div className="bg-card border border-hairline rounded-3xl p-14 text-center"><Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" /><p className="text-foreground font-medium">Connecting…</p><p className="text-muted-foreground text-sm mt-1">Allow microphone access when prompted.</p></div>
            )}

            {phase === 'grading' && (
                <div className="bg-card border border-hairline rounded-3xl p-14 text-center"><Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" /><p className="text-foreground font-medium">Evaluating your interview…</p></div>
            )}

            {phase === 'grade-error' && (
                <div className="bg-card border border-hairline rounded-3xl p-10 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" /></div>
                    <p className="text-foreground font-medium mb-1">Grading didn’t finish</p>
                    <p className="text-muted-foreground text-sm mb-5">Your interview is saved — this won’t use another voice slot.</p>
                    <div className="flex items-center justify-center gap-3">
                        <button onClick={() => sessionIdRef.current && gradeSession(sessionIdRef.current)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium"><RotateCcw className="w-4 h-4" /> Retry grading</button>
                        <button onClick={onExit} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground border border-hairline">Back</button>
                    </div>
                </div>
            )}
        </div>
    );
}
