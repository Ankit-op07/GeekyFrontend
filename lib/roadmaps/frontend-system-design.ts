// lib/roadmaps/frontend-system-design.ts
//
// The senior-frontend roadmap: the platform, the design rounds and the DSA
// round. Slugs in `topics` are real Topics in `complete-frontend-kit`.

import type { Roadmap } from './types';

export const frontendSystemDesignRoadmap: Roadmap = {
    id: 'frontend-system-design',
    kitSlug: 'complete-frontend-kit',
    title: 'Frontend System Design Roadmap',
    tagline: 'The platform, the design round and the DSA round — for SDE-2 and above.',
    audience: 'Frontend engineers targeting senior roles and product-company loops.',
    weeks: 14,
    accent: { from: 'from-violet-500', to: 'to-purple-600' },
    stages: [
        {
            id: 'platform',
            title: 'The Platform Under Your Framework',
            goal: 'Answer browser questions without a framework to hide behind.',
            nodes: [
                {
                    id: 'semantic-html',
                    title: 'Semantic HTML',
                    summary:
                        'The free accessibility, SEO and default behaviour you get for choosing the right element. A senior candidate who reaches for a div for everything gets noticed.',
                    tier: 'beginner',
                    est: '3h',
                    topics: ['semantic-structure', 'html5-apis-and-forms'],
                    external: [
                        {
                            title: 'HTML elements reference — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements',
                        },
                    ],
                    interview: [
                        'What do you get free from a <button> that you must rebuild on a clickable <div>?',
                        'When is a <section> wrong and a <div> right?',
                    ],
                },
                {
                    id: 'browser-internals',
                    title: 'Browser internals',
                    summary:
                        'Parsing, the DOM and CSSOM, layout, paint, composite. This is what makes performance advice make sense instead of being folklore.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['browser-internals'],
                    interview: [
                        'What is the critical rendering path?',
                        'Reflow vs repaint vs composite — which CSS properties avoid the first two?',
                        'Why does a script tag block parsing, and what do defer and async change?',
                    ],
                },
                {
                    id: 'networking',
                    title: 'Networking & protocols',
                    summary:
                        'HTTP/1.1 vs 2 vs 3, caching headers, CORS, cookies. Caching headers are the highest-yield item in this node.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['networking-and-protocols'],
                    external: [
                        {
                            title: 'HTTP caching — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching',
                        },
                    ],
                    interview: [
                        'Cache-Control: what do max-age, no-cache, no-store and immutable each mean?',
                        'What did HTTP/2 multiplexing make obsolete about our bundling advice?',
                        'Walk through a CORS preflight.',
                    ],
                },
                {
                    id: 'browser-apis',
                    title: 'Real-time & browser APIs',
                    summary:
                        'WebSockets, SSE, IntersectionObserver, Web Workers, storage. The toolbox every frontend system design answer draws from.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['realtime-and-browser-apis'],
                    interview: [
                        'Polling vs long polling vs SSE vs WebSocket — pick one for a live sports score and justify it.',
                        'What can a Web Worker not do, and when is one worth the complexity?',
                    ],
                },
                {
                    id: 'css',
                    title: 'CSS at scale',
                    summary:
                        'Layout and the cascade, then the part interviews care about: how CSS is organised so it does not rot, and which properties animate cheaply.',
                    tier: 'intermediate',
                    est: '5h',
                    topics: ['layout-and-visual', 'architecture-and-scale', 'performance-and-animation'],
                    interview: [
                        'Why do transform and opacity animate at 60fps when top and left do not?',
                        'How do you keep CSS maintainable across 200 components — and what does CSS-in-JS cost?',
                        'Explain the stacking context.',
                    ],
                },
                {
                    id: 'a11y',
                    title: 'Accessibility',
                    summary:
                        'ARIA, focus management, and announcing dynamic changes. Accessibility questions are now standard in senior loops and most candidates are weak here — which makes it cheap points.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['aria-and-semantics', 'focus-management', 'dynamic-content-and-forms'],
                    external: [
                        { title: 'ARIA Authoring Practices Guide', url: 'https://www.w3.org/WAI/ARIA/apg/' },
                    ],
                    interview: [
                        'What is the first rule of ARIA?',
                        'Make a modal accessible: list every requirement.',
                        'How does a screen reader learn that a toast appeared?',
                    ],
                    build: 'Take a component you have built and drive it end to end with the keyboard only, then with a screen reader on.',
                },
            ],
        },
        {
            id: 'typescript',
            title: 'TypeScript',
            goal: 'Type a real API surface, not just annotate variables.',
            nodes: [
                {
                    id: 'ts-fundamentals',
                    title: 'Fundamentals',
                    summary:
                        'Structural typing, unions, narrowing, and the difference between `any`, `unknown` and `never` that interviewers reliably ask about.',
                    tier: 'beginner',
                    est: '4h',
                    topics: ['typescript-fundamentals'],
                    external: [
                        {
                            title: 'TypeScript Handbook',
                            url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
                        },
                    ],
                    interview: [
                        'any vs unknown vs never — when do you use each?',
                        'interface vs type — what can each do that the other cannot?',
                    ],
                },
                {
                    id: 'ts-generics',
                    title: 'Generics & advanced types',
                    summary:
                        'Conditional types, mapped types, template literal types. Where a "do you actually know TypeScript" question goes.',
                    tier: 'advanced',
                    est: '5h',
                    topics: ['generics-advanced-types'],
                    interview: [
                        'Implement `DeepPartial<T>`.',
                        'What does `keyof` combined with an indexed access type let you build?',
                        'Explain a discriminated union and why it beats optional fields.',
                    ],
                    build: 'Write DeepPartial, DeepReadonly and a type-safe `get(obj, "a.b.c")`. All three are common live asks.',
                },
                {
                    id: 'ts-practice',
                    title: 'TypeScript in practice',
                    summary:
                        'Typing API responses, generic components, strictness settings, and how far to push the type system before it costs more than it saves.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['typescript-in-practice'],
                    interview: [
                        'How do you type an API response you do not control?',
                        'Is `strict: true` always right? Where would you loosen it and why?',
                    ],
                },
            ],
        },
        {
            id: 'security',
            title: 'Frontend Security',
            goal: 'Name the attack, the mechanism, and the mitigation.',
            nodes: [
                {
                    id: 'attacks',
                    title: 'XSS, CSRF & clickjacking',
                    summary:
                        'The three you will be asked about. For each: how it works, one concrete example, and the specific defence.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['common-attacks'],
                    external: [
                        { title: 'OWASP Top Ten', url: 'https://owasp.org/www-project-top-ten/' },
                    ],
                    interview: [
                        'Stored vs reflected vs DOM-based XSS.',
                        'Why does SameSite=Lax mostly kill CSRF, and what does it not cover?',
                        'What does dangerouslySetInnerHTML expose you to and how do you make it safe?',
                    ],
                },
                {
                    id: 'authn',
                    title: 'Authentication & authorisation',
                    summary:
                        'Sessions, JWTs, OAuth, and where a token is safe to keep. Have a defended opinion — the follow-ups punish a memorised one.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['authentication-and-authorization'],
                    interview: [
                        'localStorage vs httpOnly cookie for a token — trade-offs, not a slogan.',
                        'Explain the OAuth authorisation-code flow with PKCE and why PKCE exists.',
                    ],
                },
                {
                    id: 'headers',
                    title: 'Security headers & infrastructure',
                    summary:
                        'CSP, HSTS, CORS, SRI. CSP in particular is a strong senior signal because so few candidates can describe one accurately.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['headers-and-infrastructure'],
                    external: [
                        {
                            title: 'Content-Security-Policy — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy',
                        },
                    ],
                    interview: [
                        'Write a CSP for an app with a CDN and inline styles. What breaks first?',
                        'What is Subresource Integrity for?',
                    ],
                },
            ],
        },
        {
            id: 'rendering',
            title: 'Rendering & Performance',
            goal: 'Choose a rendering strategy and prove the result with numbers.',
            nodes: [
                {
                    id: 'rendering-strategies',
                    title: 'CSR, SSR, SSG & ISR',
                    summary:
                        'The single most common frontend system design question. Each has a TTFB/interactivity/cost profile, and the answer is always "it depends — here is on what".',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['core-rendering-strategies', 'modern-rendering-patterns'],
                    external: [
                        { title: 'Rendering on the Web', url: 'https://web.dev/articles/rendering-on-the-web' },
                    ],
                    interview: [
                        'Pick a rendering strategy for a news site, a dashboard and a marketing page. Justify each.',
                        'What is hydration and why is it the expensive part?',
                        'What do streaming SSR and islands each solve?',
                    ],
                },
                {
                    id: 'loading-perf',
                    title: 'Loading performance',
                    summary:
                        'Critical path, resource hints, image strategy, fonts. The highest-leverage work on most real sites.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['loading-and-resource-hints', 'rendering-and-loading'],
                    interview: [
                        'preload vs prefetch vs preconnect — one sentence each.',
                        'How do you stop a web font from causing layout shift?',
                        'Your LCP is 4.5s. Name your first four checks.',
                    ],
                },
                {
                    id: 'runtime-perf',
                    title: 'Runtime & network performance',
                    summary:
                        'Long tasks, memory, request waterfalls and caching. Where INP problems actually come from.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['runtime-and-network'],
                    interview: [
                        'What is a long task and how do you break one up?',
                        'How do you eliminate a request waterfall?',
                    ],
                },
                {
                    id: 'measurement',
                    title: 'Measurement & strategy',
                    summary:
                        'Core Web Vitals, lab vs field data, and performance budgets. Saying "I would measure first" is only credible if you can say with what.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['measurement-and-strategy'],
                    external: [{ title: 'Web Vitals', url: 'https://web.dev/articles/vitals' }],
                    interview: [
                        'LCP, INP and CLS — what does each measure and what is a good value?',
                        'Lighthouse says 98 but users complain. How is that possible?',
                        'What is a performance budget and how do you enforce it in CI?',
                    ],
                },
            ],
        },
        {
            id: 'architecture',
            title: 'Architecture & Patterns',
            goal: 'Argue about structure using the same words the interviewer does.',
            nodes: [
                {
                    id: 'patterns',
                    title: 'Design patterns',
                    summary:
                        'Creational, structural, behavioural and architectural — with the JavaScript example of each, not the Java one.',
                    tier: 'advanced',
                    est: '5h',
                    topics: [
                        'creational-patterns',
                        'structural-patterns',
                        'behavioral-patterns',
                        'architectural-patterns',
                    ],
                    interview: [
                        'Implement an observer/pub-sub. Now add once() and unsubscribe.',
                        'Where would you use a facade in a frontend codebase?',
                        'MVC, MVVM, Flux — which one is React + Redux, really?',
                    ],
                },
                {
                    id: 'state-arch',
                    title: 'State management as architecture',
                    summary:
                        'Server state vs client state vs URL state vs form state. Naming those four categories is most of the answer to "how do you manage state".',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['state-management'],
                    interview: [
                        'Name the kinds of state in a web app and where each belongs.',
                        'Why is a server cache a different problem from global client state?',
                    ],
                },
                {
                    id: 'build-tools',
                    title: 'Modules, bundlers & tooling',
                    summary:
                        'What a bundler does, tree shaking, code splitting, and why the ecosystem moved to esbuild/SWC-based tools.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['modules-and-bundlers', 'tooling-and-environment'],
                    interview: [
                        'How does tree shaking work, and what stops it from working?',
                        'What is the difference between a dev server with HMR and a production build?',
                    ],
                },
                {
                    id: 'code-management',
                    title: 'Code management at scale',
                    summary:
                        'Monorepos, versioning, code review, design systems. The "how does your team work" questions in a senior loop.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['code-management'],
                    interview: [
                        'Monorepo vs polyrepo for 12 frontend apps sharing a component library.',
                        'How do you ship a breaking change to a shared component?',
                    ],
                },
                {
                    id: 'nextjs',
                    title: 'Next.js App Router',
                    summary:
                        'Server components, routing, caching and deployment. Increasingly assumed knowledge rather than a bonus.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['app-router-and-rendering', 'features-and-deployment'],
                    external: [{ title: 'Next.js docs', url: 'https://nextjs.org/docs' }],
                    interview: [
                        'Server component vs client component — what can each not do?',
                        'What are the caching layers in the App Router and how do you bust each?',
                    ],
                },
                {
                    id: 'react-hooks-ref',
                    title: 'React hooks reference',
                    summary:
                        'A consolidated pass over core, specialised and React 19 hooks — useful as revision if React is your framework for the design round.',
                    tier: 'intermediate',
                    kind: 'optional',
                    est: '4h',
                    topics: ['core-hooks', 'specialized-hooks', 'react-19-hooks', 'custom-hooks-and-rules'],
                    interview: [
                        'What do useTransition and useDeferredValue each solve?',
                        'What does the `use` hook change about data fetching?',
                    ],
                },
            ],
        },
        {
            id: 'system-design',
            title: 'The System Design Round',
            goal: 'Drive a 45-minute open-ended design conversation.',
            nodes: [
                {
                    id: 'sd-foundations',
                    title: 'The framework',
                    summary:
                        'Requirements → API → data model → component architecture → deep dives → trade-offs. Structure is what is actually being graded; the design is second.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['foundations'],
                    interview: [
                        'What are your first five clarifying questions in ANY frontend design round?',
                        'How do you decide what to deep-dive on when you have 20 minutes left?',
                    ],
                },
                {
                    id: 'sd-realtime',
                    title: 'Design: chat & collaborative editing',
                    summary:
                        'The real-time family — transport choice, ordering, offline queue, optimistic UI and conflict resolution.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['communication-and-realtime'],
                    interview: [
                        'Design WhatsApp Web.',
                        'Design a collaborative document editor. How do two simultaneous edits reconcile?',
                        'How do you show "sending / sent / delivered" reliably on a flaky network?',
                    ],
                },
                {
                    id: 'sd-feed',
                    title: 'Design: feeds & media',
                    summary:
                        'Infinite scroll, pagination strategy, image and video delivery, virtualisation. The single most-asked frontend design question is a news feed.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['content-and-media'],
                    interview: [
                        'Design the Facebook news feed. How do you paginate when new items arrive at the top?',
                        'Design an image-heavy gallery for a 3G connection.',
                    ],
                },
                {
                    id: 'sd-ecommerce',
                    title: 'Design: e-commerce',
                    summary:
                        'Product listing, search and filters, cart consistency and checkout. Rendering strategy per page type is the interesting part.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['ecommerce'],
                    interview: [
                        'Design Amazon\'s product listing page with filters and 10ms-feeling interactions.',
                        'The cart must survive a device switch. What does that change?',
                    ],
                },
                {
                    id: 'sd-saas',
                    title: 'Design: dashboards & productivity apps',
                    summary:
                        'Data-dense tables, drag-and-drop, autosave, undo. Where offline-first and conflict handling come up.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['productivity-and-saas'],
                    interview: [
                        'Design a Trello-style board with drag-and-drop and multi-user updates.',
                        'Design a spreadsheet that stays responsive at 100,000 cells.',
                    ],
                },
                {
                    id: 'sd-platform',
                    title: 'Design: platform & infrastructure',
                    summary:
                        'Micro-frontends, design systems, i18n, feature flags, analytics. The questions asked when the role is a platform team.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['platform-and-infrastructure'],
                    interview: [
                        'Design a micro-frontend architecture for six teams. What do you NOT share?',
                        'Design a feature-flag system, including how the flag reaches the client without a flash.',
                    ],
                },
            ],
        },
        {
            id: 'dsa',
            title: 'The DSA Round',
            goal: 'Clear the algorithmic screen that stands between you and the frontend rounds.',
            nodes: [
                {
                    id: 'data-structures',
                    title: 'Data structures',
                    summary:
                        'Arrays, linked lists, stacks, queues, hash tables, trees, graphs — and the complexity of every operation on each.',
                    tier: 'intermediate',
                    est: '6h',
                    topics: [
                        'linear-data-structures',
                        'hash-based-structures',
                        'tree-and-graph-structures',
                    ],
                    interview: [
                        'When does a hash table degrade to O(n)?',
                        'Implement an LRU cache with O(1) get and put.',
                    ],
                },
                {
                    id: 'patterns-core',
                    title: 'Core patterns: two pointers, sliding window, stack',
                    summary:
                        'Three patterns that between them cover a large share of the array and string questions you will actually be asked.',
                    tier: 'intermediate',
                    kind: 'practice',
                    est: '8h',
                    topics: ['two-pointer', 'sliding-window', 'stack-queue', 'strings'],
                    build: 'Longest substring without repeating characters, valid parentheses, and trapping rain water. Then re-do them a week later.',
                },
                {
                    id: 'search-sort',
                    title: 'Searching & sorting',
                    summary:
                        'Binary search and its boundary conditions — the most common source of off-by-one failures under pressure — plus the sorts you should be able to describe.',
                    tier: 'intermediate',
                    kind: 'practice',
                    est: '5h',
                    topics: ['searching', 'sorting-algorithms'],
                    interview: [
                        'Write binary search without an off-by-one. Now find the first index >= target.',
                        'Which sort is stable, and when does stability matter?',
                    ],
                },
                {
                    id: 'recursion-dp',
                    title: 'Recursion, backtracking & DP',
                    summary:
                        'The hardest category and the one where a structured approach — recurrence, memoise, then tabulate — beats memorising solutions.',
                    tier: 'advanced',
                    kind: 'practice',
                    est: '10h',
                    topics: ['recursion-backtracking', 'dynamic-programming', 'greedy'],
                    interview: [
                        'Climbing stairs → coin change → longest common subsequence. Do all three as recursion, then memo, then tabulation.',
                        'How do you recognise a DP problem in the first 60 seconds?',
                    ],
                },
                {
                    id: 'trees-graphs',
                    title: 'Trees & graphs',
                    summary:
                        'Traversals, BFS/DFS, and the fact that most graph questions in a frontend loop are really BFS in disguise.',
                    tier: 'advanced',
                    kind: 'practice',
                    est: '8h',
                    topics: ['trees', 'graphs'],
                    interview: [
                        'Level-order traversal, then serialise and deserialise a binary tree.',
                        'Detect a cycle in a directed graph.',
                    ],
                },
                {
                    id: 'misc-dsa',
                    title: 'Bit manipulation, math & odds and ends',
                    summary:
                        'Lower frequency, cheap to cover. Worth a pass so nothing in this category is a surprise.',
                    tier: 'intermediate',
                    kind: 'optional',
                    est: '3h',
                    topics: ['bit-manipulation', 'math', 'miscellaneous'],
                },
                {
                    id: 'js-problems',
                    title: 'JS problems by level (SDE1 → SDE3)',
                    summary:
                        'JavaScript-specific problem sets graded by level — polyfills, async utilities and closures-under-pressure. Closer to what a frontend loop actually asks than generic LeetCode.',
                    tier: 'intermediate',
                    kind: 'practice',
                    est: '10h',
                    topics: ['js-problems-sde1', 'js-problems-sde2', 'js-problems-sde3'],
                    build: 'Work the set matching the level you are targeting, on a timer, out loud.',
                },
            ],
        },
        {
            id: 'lld',
            title: 'Machine Coding & LLD',
            goal: 'Build a component under time pressure and talk while you do it.',
            nodes: [
                {
                    id: 'lld-approach',
                    title: 'Approach & core components',
                    summary:
                        'How to decompose a UI problem in five minutes: state shape first, component boundaries second, then the API of each.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['approach-and-core-components'],
                    interview: ['Design the component API for a reusable data table. What are the props?'],
                },
                {
                    id: 'lld-forms',
                    title: 'Form & input components',
                    summary:
                        'Autocomplete, multi-select, date picker, OTP input. Accessibility and keyboard behaviour are the graded parts.',
                    tier: 'advanced',
                    kind: 'practice',
                    est: '6h',
                    topics: ['form-and-input-components'],
                    build: 'Build an autocomplete with debounce, keyboard navigation, aria-activedescendant and a loading state.',
                },
                {
                    id: 'lld-layout',
                    title: 'Layout & data display',
                    summary:
                        'Tables with sorting and pagination, carousels, tabs, trees. The bread and butter of machine-coding rounds.',
                    tier: 'advanced',
                    kind: 'practice',
                    est: '6h',
                    topics: ['layout-and-data-display'],
                    build: 'Build a sortable, paginated, filterable table. Then make every interaction keyboard-accessible.',
                },
                {
                    id: 'lld-apps',
                    title: 'Applications & advanced',
                    summary:
                        'Whole small apps — kanban, chat, file explorer — where state design matters more than any single widget.',
                    tier: 'advanced',
                    kind: 'practice',
                    est: '8h',
                    topics: ['applications-and-advanced', 'problems'],
                    build: 'Pick three and time-box each to 60 minutes. Ship something working rather than something perfect.',
                },
            ],
        },
        {
            id: 'testing-ai',
            title: 'Testing & AI Integration',
            goal: 'Cover the two topics that increasingly decide senior offers.',
            nodes: [
                {
                    id: 'testing',
                    title: 'Testing',
                    summary:
                        'Strategy, not syntax: what to test at which level, how to keep a suite fast, and what a flaky test is telling you.',
                    tier: 'intermediate',
                    est: '5h',
                    topics: ['testing-fundamentals', 'advanced-testing', 'testing-patterns'],
                    interview: [
                        'What is your testing strategy for a design system component?',
                        'A test is flaky. What are the usual causes and how do you fix them properly?',
                        'When is an E2E test worth its runtime?',
                    ],
                },
                {
                    id: 'ai-integration',
                    title: 'Integrating AI into a frontend',
                    summary:
                        'Streaming responses, latency and loading design, cost and token budgets, tool calls, and showing reasoning without confusing the user. Now a common senior design prompt.',
                    tier: 'advanced',
                    est: '5h',
                    topics: [
                        'ai-integration',
                        'ai-cost-tokens-models',
                        'ai-tool-use-agents',
                        'ai-reasoning-ui',
                    ],
                    interview: [
                        'Design a chat UI over a streaming LLM API. How do you handle a mid-stream cancel and a retry?',
                        'What do you show the user during a 12-second tool call?',
                        'Where do you put the API key, and why is that non-negotiable?',
                    ],
                },
            ],
        },
        {
            id: 'final',
            title: 'Interview Day',
            goal: 'Walk in with revision done and a plan.',
            nodes: [
                {
                    id: 'guide',
                    title: 'Interview guide',
                    summary:
                        'Round-by-round expectations, how to structure answers, and what a "strong hire" sounds like versus a "hire".',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['interview-guide'],
                },
                {
                    id: 'revision',
                    title: 'Quick revision sheets',
                    summary:
                        'The night-before pass. Only useful if the stages above are done — this is refresh, not learning.',
                    tier: 'beginner',
                    est: '2h',
                    topics: ['quick-revision-sheets'],
                },
            ],
        },
    ],
};
