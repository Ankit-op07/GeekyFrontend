// lib/dsa/types.ts
//
// Shapes for the hand-authored DSA sheet rendered at /dashboard?tab=dsa (the
// tracker) and /dsa/<section>/<problem> (the public approach page).
//
// WHY AUTHORED AS CODE (and not a Mongo collection behind an admin screen)
// ------------------------------------------------------------------------
// Same reasoning as lib/roadmaps/. The catalogue is editorial: which problems,
// in which order, grouped under which idea. It changes when WE change our mind
// about how to teach, not when a user does something — so it belongs in git,
// where a change is reviewable and revertable, rather than in a database where
// it is a silent UPDATE nobody can diff. It also means the sheet renders with
// zero database reads; the only thing Mongo holds is per-user state.
//
// The split, stated once:
//   • catalogue (sections, problems, approaches, videos) → this directory
//   • per-user state (solved / favourite / notes)        → DsaProgress, DsaNote
//
// ⚠️  A problem's `id` is the key its progress is stored under AND the URL of
// its approach page. Renaming one silently resets every learner's tick and
// 404s any link they saved. Change `title` instead; treat `id` as permanent.

/** LeetCode's own three bands. Kept identical so the badge matches the target site. */
export type DsaDifficulty = 'Easy' | 'Medium' | 'Hard';

/** Where the problem is actually solved. We link out; we do not host a judge. */
export type DsaPlatform = 'leetcode' | 'gfg';

/**
 * A learner-set marker on one problem.
 *
 * `pending` is the ABSENCE of a key, never a stored value — an untouched sheet
 * costs no storage, exactly like RoadmapProgress.
 *
 * `attempted` is written for you when you open the problem on LeetCode. It is a
 * breadcrumb ("you were here"), not a claim that you got it — only you set
 * `solved`, and nothing ever downgrades a `solved` back to `attempted`.
 */
export type DsaProblemStatus = 'pending' | 'attempted' | 'solved';

/** Statuses that can actually be stored (i.e. everything but the zero state). */
export const DSA_STORED_STATUSES = ['attempted', 'solved'] as const;

/**
 * Languages we publish reference solutions in.
 *
 * Three, deliberately, and Python is NOT one of them: our audience interviews
 * in C++ (campus/competitive), Java (service companies and most Indian product
 * firms) or JavaScript (our own kits). A fourth language is a fourth thing to
 * keep correct on every one of ~155 pages, and an unmaintained solution that
 * has drifted from the explanation is worse than an absent one.
 */
export type DsaCodeLang = 'cpp' | 'java' | 'javascript';

/** Display order of the code tabs. C++ first — it is the campus default. */
export const DSA_CODE_LANGS: { lang: DsaCodeLang; label: string }[] = [
    { lang: 'cpp', label: 'C++' },
    { lang: 'java', label: 'Java' },
    { lang: 'javascript', label: 'JavaScript' },
];

/** A reference solution shown on the approach page. */
export interface DsaApproachCode {
    /** highlight.js language id — drives syntax colouring. */
    lang: DsaCodeLang;
    source: string;
}

/**
 * "Our approach" — the thing that makes this more than a link list.
 *
 * Deliberately STRUCTURED rather than one free-form markdown blob. Three
 * reasons: every page then teaches in the same order (so a learner builds a
 * habit rather than re-orienting on each one), the sections can be rendered
 * with their own affordances (complexity as a chip, code as tabs), and 150 of
 * these are far faster to author against a fixed skeleton than from a blank
 * page — which is what decides whether the corpus ever gets finished.
 *
 * `body` is markdown and carries the actual teaching; the rest is scaffolding.
 */
export interface DsaApproach {
    /** What the problem is REALLY asking, in one line, without the story. */
    restate: string;
    /**
     * The explanation, in markdown. House style: start from the brute force and
     * say why it is too slow, then the observation that unlocks the optimal
     * solution, then the algorithm. A learner who only reads the first paragraph
     * should still come away with the idea.
     */
    body: string;
    /** Complexity of the RECOMMENDED solution (the one in `code`). */
    complexity: { time: string; space: string };
    /** Working solutions. At least one; JavaScript first, since that is our audience. */
    code: DsaApproachCode[];
    /** What an interviewer asks once you have solved it. */
    followUps?: string[];
}

export interface DsaProblem {
    /**
     * Stable id, unique across the WHOLE sheet (not just its section) — progress
     * is keyed by it globally so a problem can later appear in a second sheet
     * without splitting a learner's history.
     *
     * Must be [a-z0-9-]: it is used as a MongoDB sub-document key
     * (`problems.<id>`), where a dot or `$` would be read as a path or operator,
     * and as a URL segment.
     */
    id: string;
    title: string;
    difficulty: DsaDifficulty;
    platform: DsaPlatform;
    /** The canonical problem page. Opened in a new tab; also marks `attempted`. */
    externalUrl: string;
    /** Concepts, for the filter chips. Lowercase, hyphenated. */
    tags: string[];
    /**
     * 11-char YouTube video id (NOT a URL — normalised once, here, so the player
     * never has to parse user input).
     *
     * Optional on purpose: a WRONG id is worse than no id, because it embeds a
     * confidently-playing video about the wrong problem and the learner blames
     * themselves. Where we have not verified one, the UI falls back to a
     * YouTube search for the problem title, which is honest about being a
     * search. See `videoSearchUrl()` below.
     */
    youtubeVideoId?: string;
    /** Companies that ask it often. Display only — not the company-kit bank. */
    companies?: string[];
}

export interface DsaSection {
    /** URL slug, e.g. "arrays-hashing" → /dsa/arrays-hashing. [a-z0-9-]. */
    id: string;
    title: string;
    /** One or two sentences: the IDEA the section teaches, not a problem list. */
    blurb: string;
    /** What you should be able to do after it. The honest version of a goal. */
    goal: string;
    /** Rough focused time, e.g. "1 week". Displayed, never summed into a promise. */
    est: string;
    /** Tailwind gradient stops for the section card. */
    accent: { from: string; to: string };
    /**
     * One "learn the whole pattern" video for the section, shown at the top of
     * the section before any individual problem. Same verified-or-absent rule as
     * `DsaProblem.youtubeVideoId`.
     *
     * This exists because a per-problem video answers "how do I do THIS one",
     * which is the less valuable question — a learner who watches one good
     * explanation of monotonic stacks can then do six problems unaided.
     */
    youtubeVideoId?: string;
    problems: DsaProblem[];
}

export interface DsaSheet {
    id: string;
    title: string;
    tagline: string;
    sections: DsaSection[];
}

/* ── Derived helpers (pure; used by the API, the pages and the validator) ──── */

/** Every problem in sheet order. */
export function allProblems(sheet: DsaSheet): DsaProblem[] {
    return sheet.sections.flatMap((s) => s.problems);
}

/** Count by difficulty, for the section header and the progress ring. */
export function difficultyBreakdown(problems: DsaProblem[]): Record<DsaDifficulty, number> {
    const out: Record<DsaDifficulty, number> = { Easy: 0, Medium: 0, Hard: 0 };
    for (const p of problems) out[p.difficulty] += 1;
    return out;
}

/**
 * Fallback when we have no verified video id.
 *
 * A search URL rather than a guessed watch URL: it cannot be wrong, and the
 * learner can see it is a search. Deliberately scoped with "solution" and the
 * platform name so the first results are explanations, not problem readings.
 */
export function videoSearchUrl(problem: DsaProblem): string {
    const q = `${problem.title} leetcode solution explained`;
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

/** Privacy-mode embed URL. Only ever called with an id we authored. */
export function videoEmbedUrl(videoId: string): string {
    return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}

/**
 * Poster frame for the click-to-play placeholder.
 *
 * `hqdefault` (480×360) rather than `maxresdefault`: maxres is absent for a
 * meaningful share of older videos and 404s to a broken image, whereas
 * hqdefault exists for every video ever uploaded.
 */
export function videoPosterUrl(videoId: string): string {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
