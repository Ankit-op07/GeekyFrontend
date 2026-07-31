/**
 * The single place a RawJob becomes a NormalizedJob.
 *
 * Everything the board filters on — category, level, tags, remote, country,
 * the dedupe fingerprint — is derived HERE and nowhere else. Sources disagree
 * wildly on how they describe the same job (Remotive calls it "Software
 * Development", Arbeitnow tags it "javascript", HN writes it in prose), so
 * classification has to happen after the source-specific shape is gone.
 */

import type {
    EmploymentType,
    JobCategory,
    JobLevel,
    JobSource,
    NormalizedJob,
    RawJob,
} from './types';

// ── Text helpers ──────────────────────────────────────────────────────────

/** HTML → plain text. Feeds from Greenhouse/Remotive/HN are HTML; the card and
 *  drawer render text only, so we never ship markup to the client. */
export function stripHtml(input: string): string {
    return input
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

export function truncate(input: string, max: number): string {
    if (input.length <= max) return input;
    return `${input.slice(0, max).trimEnd()}…`;
}

/** Lowercase, strip punctuation and legal suffixes — used for the fingerprint,
 *  so "Zomato Ltd." and "zomato" collapse to the same key. */
function normKey(input: string): string {
    return input
        .toLowerCase()
        .replace(/\b(pvt|private|ltd|limited|inc|llc|llp|gmbh|corp|corporation|co|technologies|technology|labs|software|solutions)\b/g, ' ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, '-');
}

/**
 * Employers name their job board, not themselves — Greenhouse handed us
 * "HackerRank Careers" and "Rubrik Job Board" as company names. That is bad on
 * a card and worse in the fingerprint: "HackerRank Careers" and "HackerRank"
 * are different dedupe keys, so the same opening from two sources survives as
 * two rows. Stripped here so both problems are fixed in one place.
 */
export function cleanCompanyName(input: string): string {
    return stripHtml(input)
        .replace(/\s+/g, ' ')
        .replace(/[\s,|-]*\b(careers?|job ?board|jobs|hiring|openings|opportunities)\b\s*$/i, '')
        .trim();
}

// ── Tag vocabulary ────────────────────────────────────────────────────────

/**
 * Canonical tag → the patterns that mean it. Word-boundary matched against
 * `title + tags + description`, so "node" won't fire on "nodejs-adjacent
 * anodes" and "go" won't fire on "going". Deliberately a small, curated list:
 * an open tag set from five aggregators is unusable as a filter (we'd have
 * "reactjs", "react.js", "React JS" as three chips).
 */
const TAG_PATTERNS: Record<string, RegExp> = {
    react: /\breact(\.?js)?\b/i,
    'next.js': /\bnext\.?js\b/i,
    vue: /\bvue(\.?js)?\b/i,
    angular: /\bangular(js)?\b/i,
    svelte: /\bsvelte(kit)?\b/i,
    javascript: /\b(javascript|js)\b/i,
    typescript: /\b(typescript|ts)\b/i,
    'node.js': /\bnode(\.?js)?\b/i,
    python: /\bpython\b/i,
    java: /\bjava\b(?!script)/i,
    go: /\b(golang|go lang)\b/i,
    rust: /\brust\b/i,
    php: /\bphp\b/i,
    ruby: /\bruby( on rails)?\b|\brails\b/i,
    'c#': /\b(c#|\.net|dotnet|asp\.net)\b/i,
    'c++': /\bc\+\+\b/i,
    graphql: /\bgraphql\b/i,
    rest: /\brest(ful)? api(s)?\b/i,
    sql: /\b(sql|mysql|postgres(ql)?)\b/i,
    mongodb: /\bmongo(db)?\b/i,
    redis: /\bredis\b/i,
    aws: /\baws\b|\bamazon web services\b/i,
    gcp: /\bgcp\b|\bgoogle cloud\b/i,
    azure: /\bazure\b/i,
    docker: /\bdocker\b/i,
    kubernetes: /\b(kubernetes|k8s)\b/i,
    'react native': /\breact native\b/i,
    flutter: /\bflutter\b/i,
    android: /\bandroid\b|\bkotlin\b/i,
    ios: /\bios\b|\bswift(ui)?\b/i,
    css: /\b(css|tailwind|sass|scss)\b/i,
    html: /\bhtml5?\b/i,
    testing: /\b(jest|cypress|playwright|vitest|selenium)\b/i,
    ai: /\b(machine learning|deep learning|llm|genai|nlp|pytorch|tensorflow)\b/i,
};

/** Canonical tags in a stable display order, so chips don't reshuffle per job. */
const TAG_ORDER = Object.keys(TAG_PATTERNS);

function extractTags(haystack: string, sourceTags: string[]): string[] {
    // Source tags count as signal but are searched with the same patterns, so a
    // source's "ReactJS" and our "react" end up as one chip.
    const text = `${haystack} ${sourceTags.join(' ')}`;
    const found = TAG_ORDER.filter((tag) => TAG_PATTERNS[tag].test(text));
    return found.slice(0, 8);
}

// ── Classification ────────────────────────────────────────────────────────

/**
 * Is this a software-engineering job at all?
 *
 * Several sources are general job boards (Arbeitnow is mostly German non-tech;
 * Adzuna is everything). Without this gate the board fills with warehouse and
 * nursing roles, which is worse than an empty board for an interview-prep
 * audience. Matched on the TITLE only — descriptions mention "developer" in
 * boilerplate far too often.
 */
const ENGINEERING_TITLE = new RegExp(
    [
        'engineer', 'developer', 'programmer', 'architect', 'sde\\b', 'swe\\b',
        'full[ -]?stack', 'front[ -]?end', 'back[ -]?end', 'web dev',
        'data scientist', 'data analyst', 'devops', 'sre\\b', 'platform',
        'mobile dev', 'android', 'ios\\b', 'qa\\b', 'test automation',
        'tech lead', 'engineering manager', 'cto\\b',
        'react', 'angular', 'vue', 'node', 'python', 'java\\b', 'golang',
    ].join('|'),
    'i'
);

/**
 * Titles that match ENGINEERING_TITLE but aren't engineering roles.
 *
 * Two groups. The business side of an engineering org — "Compensation Partner
 * (Engineering)", "Technical Recruiter, Platform" — which match on
 * "engineering"/"platform" and are neither. And engineering that is not
 * SOFTWARE engineering: a real corpus turned up "Overhead Line (OHL) Design
 * engineer" and "Tier III Service Desk Engineer", both of which sailed through
 * the title gate on the word "engineer" alone.
 */
const TITLE_EXCLUDE =
    /\b(sales|recruit(er|ing)?|account executive|marketing|hr\b|talent|people (ops|operations|partner)|compensation|business development|customer success|legal|counsel|controller|accountant|mechanical|electrical|civil|chemical|structural|(service|help) ?desk|field service)\b/i;

export function isEngineeringRole(title: string): boolean {
    return ENGINEERING_TITLE.test(title) && !TITLE_EXCLUDE.test(title);
}

/** Order matters: the first match wins, so the most specific patterns lead. */
const CATEGORY_RULES: [JobCategory, RegExp][] = [
    ['mobile', /\b(android|ios|react native|flutter|mobile (app )?(developer|engineer)|swift|kotlin)\b/i],
    ['fullstack', /\bfull[ -]?stack\b|\bmern\b|\bmean stack\b/i],
    ['devops', /\b(devops|sre|site reliability|infrastructure|platform engineer|cloud engineer)\b/i],
    ['data', /\b(data (engineer|scientist|analyst)|machine learning|ml engineer|ai engineer|analytics)\b/i],
    ['qa', /\b(qa\b|quality assurance|test (engineer|automation)|sdet)\b/i],
    ['frontend', /\bfront[ -]?end\b|\bui (engineer|developer)\b|\breact\b|\bangular\b|\bvue\b|\bjavascript\b|\bweb developer\b/i],
    ['backend', /\bback[ -]?end\b|\bnode\b|\bjava\b(?!script)|\bpython\b|\bgolang\b|\bapi (engineer|developer)\b|\bserver[ -]?side\b/i],
    /**
     * The catch-all for engineering roles that declare no specialty —
     * "Software Engineer, Storage", "Engineering Manager, Notifications",
     * "SDE II". LAST on purpose: every specialty above gets first refusal.
     *
     * This bucket is not cosmetic. Without it 69% of a real 2,500-job corpus
     * landed in `other`, which made the category filter — the board's primary
     * navigation — unable to reach most of the board. "General software
     * engineering" is a truthful answer for these titles; `other` is not.
     */
    ['software', /\b(software (engineer|developer)|sde\b|swe\b|engineering manager|programmer|member of technical staff|application developer|product engineer|founding engineer|(staff|principal|distributed systems) engineer)\b/i],
];

/**
 * Classify from the TITLE, falling back to the source's own tags.
 *
 * The job description is deliberately NOT consulted, and that was a correction:
 * an earlier version fell back to the description and, measured against ~1,300
 * real ATS listings, classified 227 roles as devops purely because the word
 * "infrastructure" appeared in the opening paragraph — "Software Engineer,
 * Storage", "Software Engineer I, Entry-Level" and similar. Narrowing the
 * window to the first 400 characters barely helped.
 *
 * A job description names every technology in the building. It cannot tell you
 * what the job is. Titles and curated tags can, so an unclassifiable role is
 * left as `other` rather than guessed at — a user who filters to "Frontend"
 * and gets a storage role stops trusting the filter, which costs more than the
 * bigger `other` bucket does.
 */
export function detectCategory(title: string, sourceTags: string): JobCategory {
    for (const [category, pattern] of CATEGORY_RULES) {
        if (pattern.test(title)) return category;
    }
    for (const [category, pattern] of CATEGORY_RULES) {
        if (pattern.test(sourceTags)) return category;
    }
    return 'other';
}

/**
 * Ordered most-specific first: "senior staff engineer" must read as lead, and
 * "senior" must not win over "intern" in "Senior Intern Program".
 *
 * The numbered-ladder rules matter more than they look. Indian employers title
 * almost everything "SDE-1 / SDE-2 / SDE-3" or "Software Engineer I/II/III"
 * and never write "junior" or "mid-level" — without those patterns the entire
 * Indian ladder falls through to `unknown` and the experience filter is blind
 * to exactly the audience this platform serves. `\bi\b` cannot match "II"
 * (the following I is a word character), so the three tiers stay distinct.
 */
const LEVEL_RULES: [JobLevel, RegExp][] = [
    ['internship', /\b(intern|internship|trainee|apprentice)\b/i],
    ['lead', /\b(lead|principal|staff|head of|director|architect|vp of engineering|manager|sde[ -]?(iv|4)\b)\b/i],
    ['senior', /\b(senior|sr\.?|(sde|software engineer)[ -]?(iii|3)\b|[5-9]\+? years|1[0-9]\+? years)\b/i],
    [
        'junior',
        /\b(junior|jr\.?|entry[ -]level|fresher|graduate|campus|0-2 years|new grad|associate software engineer|(sde|software engineer)[ -]?(i|1)\b)\b/i,
    ],
    /**
     * Mid LAST among the ladder rules, so "Senior SDE-2" reads as senior.
     * Without this rule the "Mid-level" option in the dashboard filter matched
     * zero rows in a 3,800-job corpus — a filter that can never return a
     * result is worse than no filter, because it reads as "nothing available".
     */
    ['mid', /\b(mid[ -]level|(sde|software engineer)[ -]?(ii|2)\b|2-5 years|3\+? years)\b/i],
];

export function detectLevel(title: string, body: string): JobLevel {
    for (const [level, pattern] of LEVEL_RULES) {
        if (pattern.test(title)) return level;
    }
    // The description is much noisier ("report to a senior engineer"), so only
    // internship and explicit experience ranges are trusted from it.
    if (/\b(internship|intern position)\b/i.test(body)) return 'internship';
    if (/\b([5-9]|1[0-9])\+? years? of experience\b/i.test(body)) return 'senior';
    if (/\b(0-2|1-3|fresher|entry[ -]level)\b/i.test(body)) return 'junior';
    if (/\b(2-5|3-6)\+? years? of experience\b/i.test(body)) return 'mid';
    return 'unknown';
}

const EMPLOYMENT_RULES: [EmploymentType, RegExp][] = [
    ['internship', /\bintern(ship)?\b/i],
    ['part-time', /\bpart[ -_]?time\b/i],
    ['contract', /\b(contract|temporary|fixed[ -]term)\b/i],
    ['freelance', /\b(freelance|consultant)\b/i],
    ['full-time', /\bfull[ -_]?time\b|\bpermanent\b/i],
];

export function detectEmploymentType(raw: string): EmploymentType {
    for (const [type, pattern] of EMPLOYMENT_RULES) {
        if (pattern.test(raw)) return type;
    }
    return 'unknown';
}

const REMOTE_PATTERN = /\b(remote|work from home|wfh|anywhere|distributed)\b/i;
/** "Remote" in these phrasings means the opposite. */
const NOT_REMOTE_PATTERN = /\b(no remote|not remote|on[ -]?site only|hybrid[ -]?only|remote: no)\b/i;

export function detectRemote(location: string, body: string): boolean {
    if (NOT_REMOTE_PATTERN.test(location) || NOT_REMOTE_PATTERN.test(body)) return false;
    // Location is the reliable field; the body says "remote-friendly culture"
    // about jobs that are not remote, so only the first line of it is used.
    return REMOTE_PATTERN.test(location) || REMOTE_PATTERN.test(body.slice(0, 200));
}

/**
 * Best-effort country. Only the handful we expose as quick filters — this is a
 * UI convenience, not a geography service, and anything unmatched stays
 * undefined rather than being guessed.
 */
const COUNTRY_RULES: [string, RegExp][] = [
    // India gets the widest net of any country here, because it is the only one
    // the board keeps (see `isIndianJob`) and a miss means dropping a real job.
    // States are included: SmartRecruiters emits "Hyderabad, TG" and Greenhouse
    // "Bengaluru, Karnataka" with no country token at all.
    ['IN', /\b(india|ind\b|bengaluru|bangalore|hyderabad|mumbai|pune|delhi|ncr\b|noida|gurgaon|gurugram|faridabad|ghaziabad|chennai|kolkata|ahmedabad|indore|jaipur|kochi|cochin|trivandrum|thiruvananthapuram|coimbatore|chandigarh|mohali|vadodara|surat|nagpur|mysuru|mysore|thane|bhubaneswar|lucknow|kanpur|visakhapatnam|vizag|goa|dehradun|karnataka|maharashtra|telangana|tamil nadu|kerala|gujarat|haryana|uttar pradesh|west bengal|rajasthan|andhra pradesh|madhya pradesh)\b/i],
    ['US', /\b(usa|u\.s\.a?\.?|united states|new york|san francisco|seattle|austin|boston|chicago|los angeles|remote us)\b/i],
    ['GB', /\b(uk|united kingdom|london|manchester|england|scotland)\b/i],
    ['DE', /\b(germany|deutschland|berlin|munich|münchen|hamburg|frankfurt)\b/i],
    ['CA', /\b(canada|toronto|vancouver|montreal)\b/i],
    ['SG', /\bsingapore\b/i],
    ['AE', /\b(uae|dubai|abu dhabi|united arab emirates)\b/i],
    ['AU', /\b(australia|sydney|melbourne)\b/i],
];

export function detectCountry(location: string): string | undefined {
    for (const [code, pattern] of COUNTRY_RULES) {
        if (pattern.test(location)) return code;
    }
    return undefined;
}

/**
 * The board is India-only, so "which country" is a settled question and the
 * filter people actually want is **which city**. This is that filter.
 *
 * Canonical metro → the ways employers write it. Delhi NCR is deliberately one
 * bucket: Gurgaon, Gurugram, Noida and Faridabad are one job market that people
 * commute across, and splitting them into four chips would hide roles from
 * candidates who would happily take them. Order matters — NCR's satellite
 * cities are matched before Delhi itself so "Gurugram, Delhi NCR" doesn't
 * depend on which token appears first.
 */
const INDIAN_CITY_RULES: [string, RegExp][] = [
    ['Bengaluru', /\b(bengaluru|bangalore|bangalore urban)\b/i],
    ['Hyderabad', /\b(hyderabad|secunderabad|telangana)\b/i],
    ['Delhi NCR', /\b(gurgaon|gurugram|noida|faridabad|ghaziabad|ncr|new delhi|delhi)\b/i],
    ['Mumbai', /\b(mumbai|bombay|navi mumbai|thane)\b/i],
    ['Pune', /\b(pune|pimpri|chinchwad)\b/i],
    ['Chennai', /\b(chennai|madras)\b/i],
    ['Kolkata', /\b(kolkata|calcutta)\b/i],
    ['Ahmedabad', /\b(ahmedabad|gandhinagar)\b/i],
    ['Kochi', /\b(kochi|cochin|trivandrum|thiruvananthapuram)\b/i],
    ['Chandigarh', /\b(chandigarh|mohali)\b/i],
    ['Jaipur', /\bjaipur\b/i],
    ['Indore', /\bindore\b/i],
    ['Coimbatore', /\bcoimbatore\b/i],
];

/** Cities the UI offers as filter chips, in the order it shows them. */
export const INDIAN_CITIES = INDIAN_CITY_RULES.map(([city]) => city);

/**
 * Returns the metro, 'Remote' for location-independent roles, or undefined when
 * the posting names somewhere in India we don't have a bucket for. Undefined is
 * a real answer, not a failure — those jobs still show under "All cities".
 */
export function detectIndianCity(location: string, isRemote: boolean): string | undefined {
    for (const [city, pattern] of INDIAN_CITY_RULES) {
        if (pattern.test(location)) return city;
    }
    // Checked only after the metros: "Remote — Bengaluru" is a Bengaluru job to
    // anyone searching for one.
    if (isRemote) return 'Remote';
    return undefined;
}

// ── Fingerprint ───────────────────────────────────────────────────────────

/**
 * The cross-source dedupe key.
 *
 * Same role reposted to RemoteOK, Remotive and the company's own Greenhouse
 * board must land on ONE row. company+title alone is too loose (Amazon posts
 * "Software Development Engineer" in twelve cities and they are different
 * jobs), so locality is in the key — collapsed to "remote" when it is remote,
 * because remote listings word their location a dozen ways.
 *
 * Seniority words are kept in the title part on purpose: "Senior React
 * Developer" and "React Developer" at the same company are different openings.
 */
export function fingerprintJob(company: string, title: string, location: string, isRemote: boolean): string {
    const locality = isRemote
        ? 'remote'
        : normKey(location.split(/[,|/(]/)[0] || '').slice(0, 24) || 'unknown';
    return `${normKey(company)}|${normKey(title)}|${locality}`;
}

// ── Entry point ───────────────────────────────────────────────────────────

/** Descriptions are stored to render a preview + drawer, not to reproduce the
 *  posting. Capped so a few thousand rows stay a small collection. */
const DESCRIPTION_MAX = 4000;

/**
 * Turns a source's RawJob into the stored shape.
 *
 * Returns null when the job should not be on this board — not an engineering
 * role, missing an apply link, or dated absurdly (some feeds emit epoch 0,
 * which would otherwise sort to the bottom forever and never expire correctly).
 */
export function normalizeJob(source: JobSource, raw: RawJob): NormalizedJob | null {
    const title = stripHtml(raw.title || '').replace(/\s+/g, ' ').trim();
    const company = cleanCompanyName(raw.company || '');
    const applyUrl = (raw.applyUrl || '').trim();

    if (!title || !company || !applyUrl) return null;
    if (!/^https?:\/\//i.test(applyUrl)) return null;
    if (!isEngineeringRole(title)) return null;

    const description = truncate(stripHtml(raw.description || ''), DESCRIPTION_MAX);
    const location = (stripHtml(raw.location || '').replace(/\s+/g, ' ').trim()) || 'Not specified';
    const sourceTags = (raw.tags || []).map((t) => String(t)).filter(Boolean);

    // The source's own flag wins when it has one — it knows. Only infer when it doesn't.
    const isRemote = raw.isRemote ?? detectRemote(location, description);

    const haystack = `${title} ${description}`;
    const employmentType =
        detectEmploymentType(`${raw.employmentType || ''} ${title}`) === 'unknown'
            ? detectEmploymentType(sourceTags.join(' '))
            : detectEmploymentType(`${raw.employmentType || ''} ${title}`);

    // A posted date in the future (or before 2000) is a broken feed value, not
    // a fresh job — clamp to now so it can't pin itself to the top of the list.
    const now = Date.now();
    const rawTime = raw.postedAt instanceof Date ? raw.postedAt.getTime() : NaN;
    const postedAt =
        Number.isFinite(rawTime) && rawTime > Date.UTC(2000, 0, 1) && rawTime <= now
            ? new Date(rawTime)
            : new Date(now);

    return {
        sourceId: `${source}:${raw.externalId}`,
        source,
        fingerprint: fingerprintJob(company, title, location, isRemote),
        title,
        company,
        companyLogo: raw.companyLogo && /^https?:\/\//i.test(raw.companyLogo) ? raw.companyLogo : undefined,
        applyUrl,
        location: isRemote && location === 'Not specified' ? 'Remote' : location,
        isRemote,
        // Location ONLY — never the title. "Engineering Manager, India Team"
        // sitting in San Francisco is not an Indian job, and on an India-only
        // board a false positive is worse than a miss: it is the non-Indian
        // listing the whole gate exists to keep out.
        countryCode: detectCountry(location),
        city: detectIndianCity(location, isRemote),
        employmentType,
        category: detectCategory(title, sourceTags.join(' ')),
        level: detectLevel(title, description),
        tags: extractTags(haystack, sourceTags),
        isStartup: raw.isStartup ?? false,
        description,
        salaryMin: Number.isFinite(raw.salaryMin) ? raw.salaryMin : undefined,
        salaryMax: Number.isFinite(raw.salaryMax) ? raw.salaryMax : undefined,
        salaryCurrency: raw.salaryCurrency,
        salaryText: raw.salaryText,
        postedAt,
    };
}

/** All canonical tags, for the filter chip list. */
export const ALL_TAGS = TAG_ORDER;
