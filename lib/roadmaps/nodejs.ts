// lib/roadmaps/nodejs.ts
//
// Node.js backend interview roadmap. Slugs in `topics` are real Topics in
// `nodejs-backend-kit`.

import type { Roadmap } from './types';

export const nodejsRoadmap: Roadmap = {
    id: 'nodejs',
    kitSlug: 'nodejs-backend-kit',
    title: 'Node.js Backend Roadmap',
    tagline: 'Event loop to production — the backend half of a full-stack interview.',
    audience: 'Frontend engineers moving to full-stack, and anyone interviewing for Node roles.',
    weeks: 10,
    accent: { from: 'from-green-500', to: 'to-emerald-600' },
    stages: [
        {
            id: 'runtime',
            title: 'The Runtime',
            goal: 'Explain what Node is, and what it is not, without saying "JavaScript on the server" and stopping there.',
            nodes: [
                {
                    id: 'what-is-node',
                    title: 'What Node.js actually is',
                    summary:
                        'A runtime: V8 plus libuv plus a standard library. Knowing it is not a language and not a framework is the first thing an interviewer checks.',
                    tier: 'beginner',
                    est: '2h',
                    topics: ['what-is-nodejs', 'node-vs-browser'],
                    external: [
                        {
                            title: 'Introduction to Node.js',
                            url: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs',
                        },
                    ],
                    interview: [
                        'What does Node have that the browser does not, and vice versa?',
                        'Is Node single-threaded? Answer carefully.',
                    ],
                },
                {
                    id: 'v8-libuv',
                    title: 'V8 & libuv',
                    summary:
                        'V8 executes your JavaScript; libuv provides the event loop, the thread pool and the async I/O. Almost every "how does Node do X concurrently" answer routes through libuv.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['v8-and-libuv'],
                    interview: [
                        'Which part of Node runs your JS and which part does the file read?',
                        'How many threads does a default Node process actually have?',
                    ],
                },
                {
                    id: 'process-env',
                    title: 'process, globals & environment',
                    summary:
                        'argv, env, exit codes, signals. Small surface, and it shows up the moment an interview turns to configuration or graceful shutdown.',
                    tier: 'beginner',
                    est: '2h',
                    topics: ['global-process-env', 'running-node-repl'],
                    external: [
                        { title: 'process — Node API', url: 'https://nodejs.org/api/process.html' },
                    ],
                    interview: [
                        'How do you read configuration in a 12-factor way?',
                        'What is the difference between SIGTERM and SIGKILL for your process?',
                    ],
                },
            ],
        },
        {
            id: 'event-loop',
            title: 'Event Loop & Async',
            goal: 'Order the output of any mixed timer / promise / I/O snippet, and know why blocking it is fatal.',
            nodes: [
                {
                    id: 'loop-phases',
                    title: 'The event loop phases',
                    summary:
                        'timers → pending → poll → check → close. The phase model is what makes setTimeout-vs-setImmediate answerable instead of memorised.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['event-loop-phases'],
                    external: [
                        {
                            title: 'The Node.js Event Loop',
                            url: 'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick',
                        },
                    ],
                    interview: [
                        'Name the phases in order and say what runs in each.',
                        'Why is the ordering of setTimeout(0) vs setImmediate non-deterministic at the top level but deterministic inside an I/O callback?',
                    ],
                },
                {
                    id: 'thread-pool',
                    title: 'libuv & the thread pool',
                    summary:
                        'Four threads by default, used for fs, dns, zlib and crypto — not for network I/O. The distinction is a favourite senior question.',
                    tier: 'advanced',
                    est: '2h',
                    topics: ['libuv-thread-pool'],
                    interview: [
                        'Which operations use the thread pool and which use the OS directly?',
                        'What happens when you fire five concurrent bcrypt hashes with the default pool size?',
                    ],
                },
                {
                    id: 'microtasks',
                    title: 'nextTick, microtasks & macrotasks',
                    summary:
                        'process.nextTick jumps the queue ahead of promises. Knowing that ordering — and that abusing nextTick can starve the loop — is the whole question.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['nexttick-vs-setimmediate', 'microtasks-vs-macrotasks'],
                    interview: [
                        'Order: nextTick, a resolved promise, setTimeout(0), setImmediate.',
                        'How can process.nextTick starve I/O?',
                    ],
                },
                {
                    id: 'blocking',
                    title: 'Blocking the event loop',
                    summary:
                        'One synchronous 200ms loop stalls every concurrent request on that process. This is the answer to half of all "why is our Node API slow" questions.',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['blocking-event-loop'],
                    external: [
                        {
                            title: "Don't Block the Event Loop",
                            url: 'https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop',
                        },
                    ],
                    interview: [
                        'Give three ways a request handler blocks the loop.',
                        'You must do a CPU-heavy transform per request. What are your options?',
                    ],
                },
                {
                    id: 'async-patterns',
                    title: 'Callbacks, promises & error handling',
                    summary:
                        'Error-first callbacks, promisification, and the async error-handling rules that differ from the browser because an unhandled rejection can kill the process.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['callbacks', 'promises', 'async-await', 'error-handling-async'],
                    interview: [
                        'What is the error-first callback convention and why did it exist?',
                        'What happens on an unhandled promise rejection in modern Node?',
                    ],
                },
                {
                    id: 'eventemitter',
                    title: 'EventEmitter',
                    summary:
                        'The observer pattern baked into the core. Streams, servers and sockets are all emitters, so this is prerequisite reading for the rest of the roadmap.',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['eventemitter'],
                    external: [
                        { title: 'events — Node API', url: 'https://nodejs.org/api/events.html' },
                    ],
                    interview: [
                        'Why does an `error` event with no listener crash the process?',
                        'What is the max-listeners warning telling you?',
                    ],
                    build: 'Implement EventEmitter from scratch: on, once, off, emit.',
                },
            ],
        },
        {
            id: 'core-modules',
            title: 'Core Modules & Streams',
            goal: 'Move data through a Node process without loading it all into memory.',
            nodes: [
                {
                    id: 'modules-npm',
                    title: 'Modules, resolution & npm',
                    summary:
                        'CommonJS vs ESM in Node specifically, how `require` resolves, and what package.json actually controls. Semver questions are near-guaranteed.',
                    tier: 'beginner',
                    est: '4h',
                    topics: [
                        'commonjs-modules',
                        'es-modules',
                        'module-resolution',
                        'package-json-semver',
                        'npm-and-scripts',
                    ],
                    external: [
                        { title: 'Modules: packages', url: 'https://nodejs.org/api/packages.html' },
                    ],
                    interview: [
                        'What does `^1.2.3` allow, and what does `~1.2.3` allow?',
                        'What is the difference between dependencies and devDependencies at deploy time?',
                        'Why is the module cache a footgun for singletons?',
                    ],
                },
                {
                    id: 'fs-path',
                    title: 'fs, path, os & URL',
                    summary:
                        'File I/O sync vs async vs promises, and portable paths. The sync-in-a-request-handler mistake connects straight back to blocking the loop.',
                    tier: 'beginner',
                    est: '3h',
                    topics: ['fs-module', 'path-os-url'],
                    external: [{ title: 'fs — Node API', url: 'https://nodejs.org/api/fs.html' }],
                    interview: [
                        'When is `readFileSync` acceptable and when is it a bug?',
                        'Why `path.join` instead of string concatenation?',
                    ],
                },
                {
                    id: 'buffer-crypto',
                    title: 'Buffer, crypto & timers',
                    summary:
                        'Binary data, hashing, HMAC and secure randomness. This is where the auth stage gets its primitives.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['buffer', 'crypto', 'timers'],
                    external: [{ title: 'crypto — Node API', url: 'https://nodejs.org/api/crypto.html' }],
                    interview: [
                        'Why `crypto.randomBytes` and not `Math.random` for a token?',
                        'What is a timing-safe comparison and when do you need one?',
                    ],
                },
                {
                    id: 'streams',
                    title: 'Streams & backpressure',
                    summary:
                        'The idea that makes Node good at I/O: process data in chunks, and let a slow consumer tell a fast producer to wait. Backpressure is the senior half of the question.',
                    tier: 'advanced',
                    est: '5h',
                    topics: [
                        'streams-overview',
                        'readable-writable',
                        'transform-duplex',
                        'backpressure-piping',
                    ],
                    external: [{ title: 'stream — Node API', url: 'https://nodejs.org/api/stream.html' }],
                    interview: [
                        'Copy a 10 GB file in a 512 MB container. How?',
                        'What is backpressure, and what does `pipe` do about it that a manual read/write loop does not?',
                        'Why prefer `pipeline()` over `pipe()`?',
                    ],
                    build: 'Write a Transform stream that gzips a large CSV line-by-line and reports progress, using pipeline().',
                },
            ],
        },
        {
            id: 'http',
            title: 'HTTP & Express',
            goal: 'Build and reason about an HTTP server with and without a framework.',
            nodes: [
                {
                    id: 'http-core',
                    title: 'The http module',
                    summary:
                        'Write a server with no framework once. Everything Express does stops being magic the moment you have done it by hand.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['http-module', 'request-response', 'routing-basics'],
                    external: [{ title: 'http — Node API', url: 'https://nodejs.org/api/http.html' }],
                    interview: [
                        'How do you read a JSON body without a body-parser?',
                        'The request object is a stream. What follows from that?',
                    ],
                    build: 'Build a JSON API with routing and body parsing using only `http`. No Express.',
                },
                {
                    id: 'https-tls',
                    title: 'HTTPS, TLS, HTTP/2 & CORS',
                    summary:
                        'The protocol layer. CORS especially — it is a browser rule your server has to satisfy, and candidates who cannot explain the preflight lose easy points.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['http-vs-https-tls'],
                    external: [
                        {
                            title: 'CORS — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS',
                        },
                    ],
                    interview: [
                        'What triggers a CORS preflight, and how do you satisfy one?',
                        'What does TLS actually give you — encryption, identity, or both?',
                    ],
                },
                {
                    id: 'express',
                    title: 'Express: routing & middleware',
                    summary:
                        'The middleware pipeline is the whole framework. Order matters, `next()` matters, and the 4-argument error handler is a guaranteed question.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: [
                        'express-basics',
                        'express-routing',
                        'middleware',
                        'req-res',
                        'express-error-handling',
                    ],
                    external: [{ title: 'Express — Using middleware', url: 'https://expressjs.com/en/guide/using-middleware.html' }],
                    interview: [
                        'How does Express know a function is an error handler?',
                        'An async route throws. Why does your error middleware not catch it in Express 4?',
                        'Write a middleware that logs every request with its duration.',
                    ],
                },
            ],
        },
        {
            id: 'api-data',
            title: 'APIs & Data',
            goal: 'Design an API and a schema you can defend in a design round.',
            nodes: [
                {
                    id: 'rest',
                    title: 'REST design',
                    summary:
                        'Resources, verbs, status codes, idempotency. Idempotency is the one that separates people who read a blog post from people who have shipped a payment endpoint.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['rest-principles', 'crud-status-codes'],
                    external: [
                        {
                            title: 'HTTP response status codes — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status',
                        },
                    ],
                    interview: [
                        'Which HTTP methods are idempotent, and why does it matter for retries?',
                        '201 vs 200 vs 204 — when do you send each?',
                        'What does "stateless" actually forbid?',
                    ],
                },
                {
                    id: 'api-hardening',
                    title: 'Validation, pagination, versioning & rate limits',
                    summary:
                        'The parts of API design that only show up once real traffic does. Cursor vs offset pagination is a very common follow-up.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['validation-pagination', 'api-versioning'],
                    interview: [
                        'Offset pagination breaks on a table with frequent inserts. Why, and what do you use instead?',
                        'Where do you validate input, and what do you return when it fails?',
                    ],
                },
                {
                    id: 'mongo',
                    title: 'MongoDB & schema design',
                    summary:
                        'Embed vs reference is the entire NoSQL design interview. Have a rule of thumb and an example where you would break it.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['mongodb-mongoose', 'schema-design'],
                    external: [
                        {
                            title: 'MongoDB data modeling',
                            url: 'https://www.mongodb.com/docs/manual/data-modeling/',
                        },
                    ],
                    interview: [
                        'When do you embed a sub-document and when do you reference it?',
                        'How do you model a many-to-many in MongoDB?',
                        'What does an index cost you on write?',
                    ],
                },
                {
                    id: 'sql-transactions',
                    title: 'SQL, pooling & transactions',
                    summary:
                        'ACID, isolation levels and why every server holds a connection pool rather than a connection. Asked even in "we use Mongo" shops.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['sql-basics', 'connection-pooling', 'transactions'],
                    interview: [
                        'Explain ACID with a bank-transfer example.',
                        'Why a pool? What breaks when the pool is exhausted?',
                        'What is a dirty read, and which isolation level prevents it?',
                    ],
                },
            ],
        },
        {
            id: 'security',
            title: 'Auth & Security',
            goal: 'Implement login without introducing the vulnerability the interviewer is fishing for.',
            nodes: [
                {
                    id: 'auth-basics',
                    title: 'Authentication vs authorisation',
                    summary:
                        'Who you are vs what you may do. Get the vocabulary right before the mechanism — plenty of candidates lose the plot here.',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['authentication-basics'],
                    interview: ['Difference between 401 and 403, precisely.'],
                },
                {
                    id: 'sessions-jwt',
                    title: 'Sessions, cookies & JWT',
                    summary:
                        'The trade-off question: stateful sessions you can revoke instantly, versus stateless tokens you cannot. Both answers are acceptable; "JWT because it is modern" is not.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['jwt', 'sessions-cookies'],
                    external: [
                        {
                            title: 'Set-Cookie — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie',
                        },
                    ],
                    interview: [
                        'How do you log a user out immediately when their JWT is still valid for 20 minutes?',
                        'httpOnly, Secure, SameSite — what does each defend against?',
                        'Where does the refresh token live and why?',
                    ],
                },
                {
                    id: 'password-hashing',
                    title: 'Password hashing',
                    summary:
                        'bcrypt/argon2, salts, and the reason a fast hash is a bad hash. Saying "we hash with SHA-256" is a fail.',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['password-hashing'],
                    interview: [
                        'Why is bcrypt deliberately slow?',
                        'What does a salt prevent that a pepper does not?',
                    ],
                },
                {
                    id: 'owasp',
                    title: 'OWASP for backend engineers',
                    summary:
                        'Injection, broken access control, SSRF, and the mitigations you should be able to name without notes.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['web-security-owasp'],
                    external: [
                        { title: 'OWASP Top Ten', url: 'https://owasp.org/www-project-top-ten/' },
                    ],
                    interview: [
                        'How do you prevent NoSQL injection in a Mongo query built from req.body?',
                        'What is broken access control, and why is it the most common real-world flaw?',
                    ],
                },
            ],
        },
        {
            id: 'production',
            title: 'Production',
            goal: 'Talk about running the thing, not just writing it.',
            nodes: [
                {
                    id: 'errors-logging',
                    title: 'Errors, logging & debugging',
                    summary:
                        'Operational vs programmer errors, structured logs, and what you do on an uncaught exception (hint: crash, then restart cleanly).',
                    tier: 'intermediate',
                    est: '4h',
                    topics: [
                        'error-handling-patterns',
                        'uncaught-unhandled',
                        'debugging-nodejs',
                        'logging',
                    ],
                    interview: [
                        'Should you keep the process alive after an uncaught exception? Defend it.',
                        'What goes in a log line so it is useful at 3am?',
                    ],
                },
                {
                    id: 'testing-node',
                    title: 'Testing',
                    summary:
                        'Unit vs integration for a server, test doubles, and what coverage does and does not tell you.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: [
                        'testing-fundamentals',
                        'unit-testing',
                        'integration-testing',
                        'mocking-coverage',
                    ],
                    interview: [
                        'How do you test a route that hits the database?',
                        'Is 100% coverage a good goal? Why not?',
                    ],
                },
                {
                    id: 'scaling',
                    title: 'Cluster, worker threads & child processes',
                    summary:
                        'Three ways to use more than one core, for three different problems. Mixing them up is a common and very visible mistake.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['cluster-module', 'worker-threads', 'child-processes'],
                    external: [
                        { title: 'worker_threads — Node API', url: 'https://nodejs.org/api/worker_threads.html' },
                    ],
                    interview: [
                        'cluster vs worker_threads — which for CPU-bound work, which for throughput, and why?',
                        'What breaks about in-memory sessions the moment you cluster?',
                    ],
                },
                {
                    id: 'caching',
                    title: 'Caching with Redis',
                    summary:
                        'Cache-aside, TTLs and invalidation. "There are only two hard things" is a joke; being unable to describe an invalidation strategy is not.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['caching-redis'],
                    interview: [
                        'Describe cache-aside and where it goes wrong.',
                        'What is a cache stampede and how do you prevent one?',
                    ],
                },
                {
                    id: 'deploy',
                    title: 'PM2, Docker & graceful shutdown',
                    summary:
                        'Shipping it. Graceful shutdown — stop accepting, drain in-flight, close the pool — is asked far more often than people expect.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['pm2-docker', 'graceful-shutdown'],
                    interview: [
                        'Walk me through what your process does between receiving SIGTERM and exiting.',
                        'Why does a container need to handle signals itself?',
                    ],
                    build: 'Add a real graceful shutdown to any Express app you have: stop the server, finish in-flight requests, close DB connections, exit.',
                },
            ],
        },
        {
            id: 'advanced',
            title: 'Beyond REST',
            goal: 'Have an opinion on the architecture questions in a senior loop.',
            nodes: [
                {
                    id: 'websockets',
                    title: 'Real-time with WebSockets',
                    summary:
                        'When polling is not enough. Scaling them across instances is the follow-up that catches people out.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['websockets'],
                    external: [
                        {
                            title: 'The WebSocket API — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API',
                        },
                    ],
                    interview: [
                        'WebSockets vs SSE vs long polling — pick one for a live notification feed and justify it.',
                        'You have three server instances behind a load balancer. How does a message reach a socket on another instance?',
                    ],
                },
                {
                    id: 'queues',
                    title: 'Message queues & background jobs',
                    summary:
                        'The answer to "the request takes 30 seconds". Also where at-least-once delivery and idempotent consumers come from.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['message-queues'],
                    interview: [
                        'A signup sends an email that takes 4 seconds. Redesign it.',
                        'Your queue guarantees at-least-once delivery. What must your consumer be?',
                    ],
                },
                {
                    id: 'graphql',
                    title: 'GraphQL basics',
                    summary:
                        'Enough to compare it to REST honestly — over-fetching solved, caching and N+1 made harder.',
                    tier: 'advanced',
                    kind: 'optional',
                    est: '3h',
                    topics: ['graphql-basics'],
                    interview: [
                        'What does GraphQL make harder than REST?',
                        'What is the N+1 problem in a resolver and how does DataLoader fix it?',
                    ],
                },
                {
                    id: 'microservices',
                    title: 'Microservices in Node',
                    summary:
                        'Mostly a "when NOT to" question at interview. Know the operational cost you are buying and the monolith-first argument.',
                    tier: 'advanced',
                    kind: 'optional',
                    est: '3h',
                    topics: ['microservices'],
                    interview: [
                        'When would you NOT split a monolith?',
                        'How do two services share data without sharing a database?',
                    ],
                },
            ],
        },
    ],
};
