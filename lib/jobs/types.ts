/**
 * The job board's shared vocabulary.
 *
 * Every source adapter in `lib/jobs/sources/` returns `RawJob` — the fields it
 * can actually get from its upstream API, nothing derived. `normalizeJob()`
 * (lib/jobs/normalize.ts) turns that into a `NormalizedJob`, which is what the
 * DB stores and the UI filters on. Adapters must never derive category, level,
 * tags or the fingerprint themselves: if two adapters classify the same job
 * differently the board shows it twice, and dedupe is the whole point.
 */

/** Every source we can pull from. Persisted on the row, so don't rename values. */
export type JobSource =
    | 'remoteok'
    | 'remotive'
    | 'arbeitnow'
    | 'jobicy'
    | 'himalayas'
    | 'hnhiring'
    | 'greenhouse'
    | 'lever'
    | 'ashby'
    | 'smartrecruiters'
    | 'adzuna'
    | 'jsearch';

export type JobCategory =
    | 'frontend'
    | 'backend'
    | 'fullstack'
    | 'mobile'
    | 'data'
    | 'devops'
    | 'qa'
    | 'software'
    | 'other';

export type JobLevel = 'internship' | 'junior' | 'mid' | 'senior' | 'lead' | 'unknown';

export type EmploymentType =
    | 'full-time'
    | 'part-time'
    | 'contract'
    | 'internship'
    | 'freelance'
    | 'unknown';

/** What a source adapter produces. Only `externalId`, `title`, `company` and
 *  `applyUrl` are mandatory — everything else is best-effort per source. */
export interface RawJob {
    /** Stable id *within* the source. Combined with the source name it forms
     *  `sourceId`, which is what makes a re-fetch idempotent. */
    externalId: string;
    title: string;
    company: string;
    applyUrl: string;
    companyLogo?: string;
    /** Free-text location as the source words it ("Bengaluru, India", "Remote — EU"). */
    location?: string;
    /** Only set it when the SOURCE says so. Otherwise leave undefined and let
     *  normalize infer it from the location/description. */
    isRemote?: boolean;
    employmentType?: string;
    description?: string;
    /** Tags/skills the source already provides. Merged with tags mined from the
     *  title + description, then filtered to the canonical vocabulary. */
    tags?: string[];
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
    /** Pre-formatted salary string when the source only gives prose. */
    salaryText?: string;
    postedAt?: Date;
    /** True when the source is inherently a startup channel (HN Who-is-hiring,
     *  a curated startup ATS board). Aggregators leave it undefined. */
    isStartup?: boolean;
}

export interface NormalizedJob {
    /** `${source}:${externalId}` — unique per source row. */
    sourceId: string;
    source: JobSource;
    /** Dedupe key across sources: company + title + locality. */
    fingerprint: string;

    title: string;
    company: string;
    companyLogo?: string;
    applyUrl: string;

    location: string;
    isRemote: boolean;
    /** ISO-3166 alpha-2 when we can tell, else undefined. On this board it is
     *  always 'IN' — the ingest drops everything else — but it is kept because
     *  it is the field that decision is MADE on, and a stored 'IN' is what
     *  distinguishes a row that passed the gate from one written before the
     *  gate existed. */
    countryCode?: string;
    /** Indian metro, 'Remote', or undefined. The board's primary location
     *  filter now that country is a settled question — see `detectIndianCity`. */
    city?: string;

    employmentType: EmploymentType;
    category: JobCategory;
    level: JobLevel;
    tags: string[];
    isStartup: boolean;

    /** Plain text, HTML stripped, capped — the card and drawer render it as text. */
    description: string;

    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
    salaryText?: string;

    postedAt: Date;
}

/** Per-source outcome from one ingest run. Returned by the refresh endpoint so
 *  a dead upstream (or a wrong ATS board token) is visible instead of silent. */
export interface SourceResult {
    source: JobSource;
    /** Which board/query inside the source, for the ATS adapters. */
    label: string;
    ok: boolean;
    fetched: number;
    error?: string;
    ms: number;
}
