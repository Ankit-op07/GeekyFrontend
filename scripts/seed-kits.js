/**
 * Seed script: Creates Kit, Chapter, and Topic documents for all 4 learning kits.
 * Safe to re-run — skips kits that already exist (by slug).
 *
 * Usage:  node scripts/seed-kits.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('❌ MONGODB_URI not set'); process.exit(1); }

/* ── Inline schemas (mirrors lib/models but avoids TS build) ── */
const KitSchema = new mongoose.Schema({
    name: String, slug: { type: String, unique: true }, description: String,
    icon: String, color: String, order: Number, purchasesCount: { type: Number, default: 0 },
}, { timestamps: true });

const ChapterSchema = new mongoose.Schema({
    kitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Kit' },
    title: String, slug: String, order: Number,
}, { timestamps: true });

const TopicSchema = new mongoose.Schema({
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
    kitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Kit' },
    title: String, slug: String, content: { type: String, default: '' }, order: Number,
}, { timestamps: true });

const Kit = mongoose.models.Kit || mongoose.model('Kit', KitSchema);
const Chapter = mongoose.models.Chapter || mongoose.model('Chapter', ChapterSchema);
const Topic = mongoose.models.Topic || mongoose.model('Topic', TopicSchema);

/* ── Kit definitions ─────────────────────────────────────────── */
const KITS = [
    {
        name: 'JavaScript Interview Kit',
        slug: 'javascript-interview-kit',
        description: 'Master JavaScript fundamentals — closures, async patterns, prototypes, ES6+, and tricky interview questions.',
        icon: '⚡', color: 'from-yellow-500 to-orange-500', order: 0,
        chapters: [
            {
                title: 'Closures & Scope', slug: 'closures-scope', order: 0,
                topics: [
                    { title: 'What is a Closure?', slug: 'what-is-a-closure', order: 0, content: '# What is a Closure?\n\nA **closure** is the combination of a function bundled together with references to its surrounding lexical environment.\n\n## Key Concepts\n\n- A closure gives you access to an outer function\'s scope from an inner function\n- Closures are created every time a function is created\n- They \"remember\" the environment in which they were created\n\n## Example\n\n```javascript\nfunction outerFunction(outerVariable) {\n    return function innerFunction(innerVariable) {\n        console.log(\'Outer:\', outerVariable);\n        console.log(\'Inner:\', innerVariable);\n    };\n}\n\nconst newFunction = outerFunction(\'outside\');\nnewFunction(\'inside\');\n// Outer: outside\n// Inner: inside\n```\n\n## Common Interview Questions\n\n1. What will the following code output?\n2. How do closures work with loops?\n3. What is the practical use of closures?' },
                    { title: 'Closures in Loops', slug: 'closures-in-loops', order: 1, content: '# Closures in Loops\n\nOne of the most common closure-related interview questions involves closures inside loops.\n\n## The Classic Problem\n\n```javascript\nfor (var i = 0; i < 3; i++) {\n    setTimeout(() => console.log(i), 1000);\n}\n// Output: 3, 3, 3 (not 0, 1, 2!)\n```\n\n## Why?\n\n`var` is function-scoped. By the time the `setTimeout` callback runs, the loop has already completed and `i` is 3.\n\n## Solutions\n\n### 1. Use `let`\n```javascript\nfor (let i = 0; i < 3; i++) {\n    setTimeout(() => console.log(i), 1000);\n}\n// Output: 0, 1, 2\n```\n\n### 2. Use IIFE\n```javascript\nfor (var i = 0; i < 3; i++) {\n    (function(j) {\n        setTimeout(() => console.log(j), 1000);\n    })(i);\n}\n```' },
                    { title: 'Practical Uses of Closures', slug: 'practical-closures', order: 2, content: '# Practical Uses of Closures\n\n## 1. Data Privacy / Encapsulation\n```javascript\nfunction createCounter() {\n    let count = 0;\n    return {\n        increment: () => ++count,\n        decrement: () => --count,\n        getCount: () => count\n    };\n}\n```\n\n## 2. Function Factories\n```javascript\nfunction multiplier(factor) {\n    return (number) => number * factor;\n}\nconst double = multiplier(2);\nconst triple = multiplier(3);\n```\n\n## 3. Memoization\n```javascript\nfunction memoize(fn) {\n    const cache = {};\n    return function(...args) {\n        const key = JSON.stringify(args);\n        if (cache[key]) return cache[key];\n        return cache[key] = fn.apply(this, args);\n    };\n}\n```' },
                ],
            },
            {
                title: 'Promises & Async', slug: 'promises-async', order: 1,
                topics: [
                    { title: 'Understanding Promises', slug: 'understanding-promises', order: 0, content: '# Understanding Promises\n\nA **Promise** represents the eventual completion or failure of an asynchronous operation.\n\n## States\n- **Pending** — initial state\n- **Fulfilled** — operation completed successfully\n- **Rejected** — operation failed\n\n## Creating a Promise\n```javascript\nconst promise = new Promise((resolve, reject) => {\n    setTimeout(() => resolve(\"Done!\"), 1000);\n});\n\npromise.then(result => console.log(result));\n```\n\n## Chaining\n```javascript\nfetch(\'/api/data\')\n    .then(res => res.json())\n    .then(data => process(data))\n    .catch(err => handleError(err))\n    .finally(() => cleanup());\n```' },
                    { title: 'Async/Await Patterns', slug: 'async-await-patterns', order: 1, content: '# Async/Await Patterns\n\n## Basic Usage\n```javascript\nasync function fetchUser(id) {\n    try {\n        const response = await fetch(`/api/users/${id}`);\n        const user = await response.json();\n        return user;\n    } catch (error) {\n        console.error(\'Failed:\', error);\n    }\n}\n```\n\n## Parallel Execution\n```javascript\n// Sequential (slow)\nconst user = await fetchUser(1);\nconst posts = await fetchPosts(1);\n\n// Parallel (fast)\nconst [user, posts] = await Promise.all([\n    fetchUser(1),\n    fetchPosts(1)\n]);\n```\n\n## Error Handling Patterns\n```javascript\n// Wrapper pattern\nfunction to(promise) {\n    return promise\n        .then(data => [null, data])\n        .catch(err => [err, null]);\n}\n\nconst [err, data] = await to(fetchUser(1));\n```' },
                    { title: 'Promise.all vs Promise.allSettled', slug: 'promise-all-settled', order: 2, content: '# Promise.all vs Promise.allSettled\n\n## Promise.all\nRejects immediately if **any** promise rejects.\n```javascript\ntry {\n    const [a, b, c] = await Promise.all([p1, p2, p3]);\n} catch (err) {\n    // One failed = all fail\n}\n```\n\n## Promise.allSettled\nWaits for **all** promises to complete, regardless of outcome.\n```javascript\nconst results = await Promise.allSettled([p1, p2, p3]);\nresults.forEach(r => {\n    if (r.status === \'fulfilled\') console.log(r.value);\n    else console.log(r.reason);\n});\n```\n\n## When to Use Which?\n- **Promise.all** — when all results are needed (fail-fast)\n- **Promise.allSettled** — when you want to know what succeeded/failed\n- **Promise.race** — when you want the fastest result\n- **Promise.any** — when you want the first success' },
                ],
            },
            {
                title: 'Event Loop & Execution', slug: 'event-loop', order: 2,
                topics: [
                    { title: 'How the Event Loop Works', slug: 'how-event-loop-works', order: 0, content: '# How the Event Loop Works\n\nThe event loop is the mechanism that allows JavaScript to perform non-blocking I/O operations.\n\n## The Call Stack\nJavaScript has a single call stack — it can only do one thing at a time.\n\n## The Queue\nCallback functions are placed in the task queue when their async operations complete.\n\n## The Loop\n1. Execute synchronous code on the call stack\n2. When stack is empty, check the microtask queue (Promises)\n3. Then check the macrotask queue (setTimeout, setInterval)\n4. Repeat\n\n## Classic Interview Question\n```javascript\nconsole.log(\'1\');\nsetTimeout(() => console.log(\'2\'), 0);\nPromise.resolve().then(() => console.log(\'3\'));\nconsole.log(\'4\');\n// Output: 1, 4, 3, 2\n```' },
                    { title: 'Microtasks vs Macrotasks', slug: 'microtasks-macrotasks', order: 1, content: '# Microtasks vs Macrotasks\n\n## Microtasks (higher priority)\n- Promise callbacks (.then, .catch, .finally)\n- queueMicrotask()\n- MutationObserver\n\n## Macrotasks (lower priority)\n- setTimeout / setInterval\n- setImmediate (Node.js)\n- I/O operations\n- UI rendering\n\n## Execution Order\nAll microtasks are processed before the next macrotask.\n\n```javascript\nsetTimeout(() => console.log(\'timeout\'), 0);\nPromise.resolve().then(() => console.log(\'promise\'));\nqueueMicrotask(() => console.log(\'microtask\'));\nconsole.log(\'sync\');\n\n// Output: sync, promise, microtask, timeout\n```' },
                ],
            },
            {
                title: 'Prototypes & this', slug: 'prototypes-this', order: 3,
                topics: [
                    { title: 'Prototypal Inheritance', slug: 'prototypal-inheritance', order: 0, content: '# Prototypal Inheritance\n\nJavaScript uses prototypal inheritance, not classical inheritance.\n\n## The Prototype Chain\nEvery object has a `[[Prototype]]` (accessible via `__proto__` or `Object.getPrototypeOf()`).\n\n```javascript\nconst animal = { speak() { return \'...\'; } };\nconst dog = Object.create(animal);\ndog.bark = function() { return \'Woof!\'; };\n\ndog.bark();  // \'Woof!\' — own property\ndog.speak(); // \'...\' — inherited from prototype\n```\n\n## Constructor Functions\n```javascript\nfunction Person(name) {\n    this.name = name;\n}\nPerson.prototype.greet = function() {\n    return `Hi, I\'m ${this.name}`;\n};\nconst john = new Person(\'John\');\n```\n\n## ES6 Classes (syntactic sugar)\n```javascript\nclass Person {\n    constructor(name) { this.name = name; }\n    greet() { return `Hi, I\'m ${this.name}`; }\n}\n```' },
                    { title: 'Understanding this', slug: 'understanding-this', order: 1, content: '# Understanding `this`\n\nThe value of `this` depends on **how** a function is called.\n\n## Rules (in order of precedence)\n\n### 1. `new` binding\n```javascript\nfunction Foo() { this.x = 1; }\nconst f = new Foo(); // this = new object\n```\n\n### 2. Explicit binding (call/apply/bind)\n```javascript\nfunction greet() { console.log(this.name); }\ngreet.call({ name: \'Alice\' }); // \'Alice\'\n```\n\n### 3. Implicit binding (method call)\n```javascript\nconst obj = { name: \'Bob\', greet() { console.log(this.name); } };\nobj.greet(); // \'Bob\'\n```\n\n### 4. Default binding\n```javascript\nfunction foo() { console.log(this); }\nfoo(); // window (or undefined in strict mode)\n```\n\n### Arrow functions\nArrow functions do NOT have their own `this`. They inherit from the enclosing scope.\n```javascript\nconst obj = {\n    name: \'Charlie\',\n    greet: () => console.log(this.name) // \'this\' is NOT obj!\n};\n```' },
                ],
            },
        ],
    },
    {
        name: 'React.js Interview Kit',
        slug: 'react-interview-kit',
        description: 'Deep-dive into React concepts — hooks, state management, performance, patterns, and machine coding rounds.',
        icon: '⚛️', color: 'from-cyan-500 to-blue-500', order: 1,
        chapters: [
            {
                title: 'React Fundamentals', slug: 'react-fundamentals', order: 0,
                topics: [
                    { title: 'Virtual DOM & Reconciliation', slug: 'virtual-dom', order: 0, content: '# Virtual DOM & Reconciliation\n\n## What is the Virtual DOM?\nThe Virtual DOM is a lightweight JavaScript representation of the actual DOM. React uses it to determine what changes need to be made to the real DOM.\n\n## How Reconciliation Works\n1. State changes → new Virtual DOM tree\n2. React **diffs** the new tree with the previous one\n3. Only the **changed nodes** are updated in the real DOM\n\n## Key Rules\n- Elements of different types produce different trees\n- Developer can hint which child elements are stable via `key` prop\n- React only updates the minimal set of changes\n\n## Fiber Architecture\nReact 16+ uses Fiber for incremental rendering:\n- Work can be split into chunks\n- Work can be paused, aborted, or reused\n- Different types of work have different priorities' },
                    { title: 'JSX Under the Hood', slug: 'jsx-under-the-hood', order: 1, content: '# JSX Under the Hood\n\nJSX is syntactic sugar for `React.createElement()` calls.\n\n```jsx\n// JSX\nconst element = <h1 className="title">Hello</h1>;\n\n// Compiles to\nconst element = React.createElement(\'h1\', { className: \'title\' }, \'Hello\');\n```\n\n## Rules of JSX\n- Must return a single root element (or use Fragment `<></>`)\n- `className` instead of `class`\n- `htmlFor` instead of `for`\n- camelCase for event handlers (`onClick`, `onChange`)\n- Expressions inside `{}`, not statements\n\n## Conditional Rendering\n```jsx\n{isLoggedIn && <Dashboard />}\n{isAdmin ? <AdminPanel /> : <UserPanel />}\n```' },
                    { title: 'Component Lifecycle', slug: 'component-lifecycle', order: 2, content: '# Component Lifecycle\n\n## Class Components\n- **Mounting**: constructor → render → componentDidMount\n- **Updating**: render → componentDidUpdate\n- **Unmounting**: componentWillUnmount\n\n## Functional Components (Hooks)\n```jsx\nuseEffect(() => {\n    // componentDidMount + componentDidUpdate\n    console.log(\'Effect ran\');\n\n    return () => {\n        // componentWillUnmount (cleanup)\n        console.log(\'Cleanup\');\n    };\n}, [dependency]); // runs when dependency changes\n```\n\n## Common Mistakes\n- Missing dependency in useEffect → stale closures\n- Not cleaning up subscriptions/timers\n- Using `setState` in render' },
                ],
            },
            {
                title: 'Hooks Deep Dive', slug: 'hooks-deep-dive', order: 1,
                topics: [
                    { title: 'useState & useReducer', slug: 'usestate-usereducer', order: 0, content: '# useState & useReducer\n\n## useState\n```jsx\nconst [count, setCount] = useState(0);\n\n// Functional update (when new state depends on old)\nsetCount(prev => prev + 1);\n\n// Lazy initialization (expensive computation)\nconst [data, setData] = useState(() => computeExpensiveValue());\n```\n\n## useReducer\nBetter for complex state logic:\n```jsx\nfunction reducer(state, action) {\n    switch (action.type) {\n        case \'increment\': return { count: state.count + 1 };\n        case \'decrement\': return { count: state.count - 1 };\n        default: throw new Error();\n    }\n}\n\nconst [state, dispatch] = useReducer(reducer, { count: 0 });\ndispatch({ type: \'increment\' });\n```\n\n## When to Use Which?\n- **useState**: simple values, independent state\n- **useReducer**: complex state, related values, state transitions' },
                    { title: 'useEffect Patterns', slug: 'useeffect-patterns', order: 1, content: '# useEffect Patterns\n\n## Run Once (mount)\n```jsx\nuseEffect(() => { fetchData(); }, []);\n```\n\n## Run on Change\n```jsx\nuseEffect(() => { search(query); }, [query]);\n```\n\n## Cleanup\n```jsx\nuseEffect(() => {\n    const ws = new WebSocket(url);\n    ws.onmessage = handleMessage;\n    return () => ws.close(); // cleanup\n}, [url]);\n```\n\n## Debounced Effect\n```jsx\nuseEffect(() => {\n    const timer = setTimeout(() => search(query), 300);\n    return () => clearTimeout(timer);\n}, [query]);\n```\n\n## Common Pitfalls\n- Infinite loops from missing/wrong dependencies\n- Race conditions in async effects\n- Not handling component unmount in async callbacks' },
                    { title: 'Custom Hooks', slug: 'custom-hooks', order: 2, content: '# Custom Hooks\n\nCustom hooks let you extract component logic into reusable functions.\n\n## Rules\n- Must start with `use`\n- Can call other hooks\n- Each call gets its own state\n\n## Example: useLocalStorage\n```jsx\nfunction useLocalStorage(key, initialValue) {\n    const [value, setValue] = useState(() => {\n        const saved = localStorage.getItem(key);\n        return saved ? JSON.parse(saved) : initialValue;\n    });\n\n    useEffect(() => {\n        localStorage.setItem(key, JSON.stringify(value));\n    }, [key, value]);\n\n    return [value, setValue];\n}\n\n// Usage\nconst [theme, setTheme] = useLocalStorage(\'theme\', \'dark\');\n```\n\n## Example: useFetch\n```jsx\nfunction useFetch(url) {\n    const [data, setData] = useState(null);\n    const [loading, setLoading] = useState(true);\n    const [error, setError] = useState(null);\n\n    useEffect(() => {\n        let cancelled = false;\n        fetch(url)\n            .then(r => r.json())\n            .then(d => { if (!cancelled) setData(d); })\n            .catch(e => { if (!cancelled) setError(e); })\n            .finally(() => { if (!cancelled) setLoading(false); });\n        return () => { cancelled = true; };\n    }, [url]);\n\n    return { data, loading, error };\n}\n```' },
                ],
            },
            {
                title: 'Performance Optimization', slug: 'performance-optimization', order: 2,
                topics: [
                    { title: 'React.memo, useMemo, useCallback', slug: 'memo-usememo-usecallback', order: 0, content: '# React.memo, useMemo, useCallback\n\n## React.memo\nPrevents re-renders when props haven\'t changed:\n```jsx\nconst ExpensiveList = React.memo(({ items }) => {\n    return items.map(item => <Item key={item.id} {...item} />);\n});\n```\n\n## useMemo\nMemoizes expensive **computations**:\n```jsx\nconst sorted = useMemo(\n    () => items.sort((a, b) => a.name.localeCompare(b.name)),\n    [items]\n);\n```\n\n## useCallback\nMemoizes **function references**:\n```jsx\nconst handleClick = useCallback((id) => {\n    setSelected(id);\n}, []); // stable reference\n```\n\n## When NOT to Optimize\n- Don\'t memoize everything — React is fast by default\n- Measure first with React DevTools Profiler\n- Only optimize when you see actual performance issues' },
                    { title: 'Code Splitting & Lazy Loading', slug: 'code-splitting', order: 1, content: '# Code Splitting & Lazy Loading\n\n## React.lazy\n```jsx\nconst Dashboard = React.lazy(() => import(\'./Dashboard\'));\n\nfunction App() {\n    return (\n        <Suspense fallback={<Spinner />}>\n            <Dashboard />\n        </Suspense>\n    );\n}\n```\n\n## Route-based Splitting\n```jsx\nconst Home = lazy(() => import(\'./pages/Home\'));\nconst About = lazy(() => import(\'./pages/About\'));\n\nfunction App() {\n    return (\n        <Suspense fallback={<Loading />}>\n            <Routes>\n                <Route path=\"/\" element={<Home />} />\n                <Route path=\"/about\" element={<About />} />\n            </Routes>\n        </Suspense>\n    );\n}\n```\n\n## Dynamic Imports\n```javascript\nbutton.addEventListener(\'click\', async () => {\n    const { heavyFunction } = await import(\'./heavy-module\');\n    heavyFunction();\n});\n```' },
                ],
            },
            {
                title: 'State Management', slug: 'state-management', order: 3,
                topics: [
                    { title: 'Context API vs Redux', slug: 'context-vs-redux', order: 0, content: '# Context API vs Redux\n\n## Context API\nBuilt into React. Best for low-frequency updates.\n```jsx\nconst ThemeContext = createContext(\'light\');\n\nfunction App() {\n    return (\n        <ThemeContext.Provider value=\"dark\">\n            <Page />\n        </ThemeContext.Provider>\n    );\n}\n\nfunction Button() {\n    const theme = useContext(ThemeContext);\n    return <button className={theme}>Click</button>;\n}\n```\n\n## When to Use Redux\n- Complex state with many actions\n- State shared across many components\n- Need middleware (logging, async)\n- Time-travel debugging needed\n\n## Modern Alternatives\n- **Zustand** — minimal, hook-based\n- **Jotai** — atomic state\n- **React Query / TanStack Query** — server state' },
                ],
            },
        ],
    },
    {
        name: 'Node.js Backend Kit',
        slug: 'nodejs-backend-kit',
        description: 'Master Node.js backend development — event-driven architecture, Express, databases, authentication, and system design.',
        icon: '🟢', color: 'from-green-500 to-emerald-500', order: 2,
        chapters: [
            {
                title: 'Node.js Core Concepts', slug: 'nodejs-core', order: 0,
                topics: [
                    { title: 'Event-Driven Architecture', slug: 'event-driven-architecture', order: 0, content: '# Event-Driven Architecture\n\nNode.js is built on an event-driven, non-blocking I/O model.\n\n## EventEmitter\n```javascript\nconst EventEmitter = require(\'events\');\nconst emitter = new EventEmitter();\n\nemitter.on(\'userCreated\', (user) => {\n    console.log(\'Send welcome email to\', user.email);\n});\n\nemitter.on(\'userCreated\', (user) => {\n    console.log(\'Log analytics for\', user.id);\n});\n\nemitter.emit(\'userCreated\', { id: 1, email: \'test@example.com\' });\n```\n\n## Why Event-Driven?\n- Decoupled components\n- Easy to add new listeners\n- Non-blocking by nature\n- Scales well for I/O-heavy workloads\n\n## Interview Tip\nBe ready to explain why Node.js is single-threaded but still handles concurrent requests efficiently through the event loop.' },
                    { title: 'Streams & Buffers', slug: 'streams-buffers', order: 1, content: '# Streams & Buffers\n\n## What are Streams?\nStreams are collections of data that might not be available all at once. They let you process data piece by piece.\n\n## Types of Streams\n- **Readable** — `fs.createReadStream()`, `http.IncomingMessage`\n- **Writable** — `fs.createWriteStream()`, `http.ServerResponse`\n- **Duplex** — TCP sockets\n- **Transform** — `zlib.createGzip()`\n\n## Example: File Copy\n```javascript\nconst fs = require(\'fs\');\nconst readStream = fs.createReadStream(\'input.txt\');\nconst writeStream = fs.createWriteStream(\'output.txt\');\nreadStream.pipe(writeStream);\n```\n\n## Why Streams?\n- Memory efficient — don\'t load entire file into memory\n- Time efficient — start processing as data arrives\n- Essential for large files, video streaming, real-time data' },
                ],
            },
            {
                title: 'Express.js & REST APIs', slug: 'express-rest', order: 1,
                topics: [
                    { title: 'Middleware Pattern', slug: 'middleware-pattern', order: 0, content: '# Middleware Pattern\n\nMiddleware functions have access to `req`, `res`, and `next`.\n\n## Execution Flow\n```\nRequest → MW1 → MW2 → MW3 → Route Handler → Response\n```\n\n## Types\n```javascript\n// Application-level\napp.use(cors());\napp.use(express.json());\n\n// Route-level\napp.get(\'/api/users\', authenticate, getUsers);\n\n// Error-handling (4 arguments)\napp.use((err, req, res, next) => {\n    res.status(500).json({ error: err.message });\n});\n```\n\n## Custom Middleware\n```javascript\nfunction logger(req, res, next) {\n    console.log(`${req.method} ${req.path}`);\n    const start = Date.now();\n    res.on(\'finish\', () => {\n        console.log(`${res.statusCode} in ${Date.now() - start}ms`);\n    });\n    next();\n}\n```' },
                    { title: 'RESTful API Design', slug: 'restful-api-design', order: 1, content: '# RESTful API Design\n\n## Principles\n- **Resources** as nouns: `/users`, `/posts`\n- **HTTP methods** as verbs: GET, POST, PUT, PATCH, DELETE\n- **Stateless** — each request contains all needed context\n- **Consistent** responses and error formats\n\n## URL Patterns\n```\nGET    /api/users          → list users\nPOST   /api/users          → create user\nGET    /api/users/:id       → get user\nPUT    /api/users/:id       → replace user\nPATCH  /api/users/:id       → update fields\nDELETE /api/users/:id       → delete user\nGET    /api/users/:id/posts → user\'s posts\n```\n\n## Response Format\n```json\n{\n    \"success\": true,\n    \"data\": { ... },\n    \"meta\": { \"page\": 1, \"total\": 100 }\n}\n```\n\n## Error Format\n```json\n{\n    \"success\": false,\n    \"error\": { \"code\": \"NOT_FOUND\", \"message\": \"User not found\" }\n}\n```' },
                ],
            },
            {
                title: 'Database & Authentication', slug: 'database-auth', order: 2,
                topics: [
                    { title: 'MongoDB with Mongoose', slug: 'mongodb-mongoose', order: 0, content: '# MongoDB with Mongoose\n\n## Schema Definition\n```javascript\nconst userSchema = new mongoose.Schema({\n    email: { type: String, required: true, unique: true },\n    name: { type: String, required: true },\n    role: { type: String, enum: [\'user\', \'admin\'], default: \'user\' },\n    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: \'Post\' }],\n}, { timestamps: true });\n```\n\n## Querying\n```javascript\n// Find with filters\nconst users = await User.find({ role: \'admin\' })\n    .select(\'name email\')\n    .sort({ createdAt: -1 })\n    .limit(10)\n    .lean();\n\n// Populate references\nconst user = await User.findById(id).populate(\'posts\');\n\n// Aggregation\nconst stats = await Order.aggregate([\n    { $match: { status: \'completed\' } },\n    { $group: { _id: \'$userId\', total: { $sum: \'$amount\' } } },\n]);\n```\n\n## Indexing\n```javascript\nuserSchema.index({ email: 1 }); // single index\nuserSchema.index({ name: \'text\' }); // text search\n```' },
                    { title: 'JWT Authentication', slug: 'jwt-authentication', order: 1, content: '# JWT Authentication\n\n## How JWT Works\n1. User sends credentials\n2. Server verifies and returns a signed JWT\n3. Client sends JWT in Authorization header\n4. Server verifies JWT on each request\n\n## Token Structure\n```\nheader.payload.signature\n```\n\n## Implementation\n```javascript\nconst jwt = require(\'jsonwebtoken\');\n\n// Generate token\nfunction generateToken(user) {\n    return jwt.sign(\n        { id: user._id, email: user.email },\n        process.env.JWT_SECRET,\n        { expiresIn: \'7d\' }\n    );\n}\n\n// Verify middleware\nfunction authenticate(req, res, next) {\n    const token = req.headers.authorization?.split(\' \')[1];\n    if (!token) return res.status(401).json({ error: \'No token\' });\n    try {\n        req.user = jwt.verify(token, process.env.JWT_SECRET);\n        next();\n    } catch {\n        res.status(401).json({ error: \'Invalid token\' });\n    }\n}\n```\n\n## Access vs Refresh Tokens\n- **Access token** — short-lived (15 min), used for API calls\n- **Refresh token** — long-lived (7 days), used to get new access tokens' },
                ],
            },
        ],
    },
    {
        name: 'Complete Frontend Kit',
        slug: 'complete-frontend-kit',
        description: 'The ultimate bundle — HTML/CSS mastery, web performance, system design, DSA for frontend, and machine coding practice.',
        icon: '🚀', color: 'from-violet-500 to-purple-600', order: 3,
        chapters: [
            {
                title: 'HTML & CSS Mastery', slug: 'html-css-mastery', order: 0,
                topics: [
                    { title: 'Semantic HTML', slug: 'semantic-html', order: 0, content: '# Semantic HTML\n\nSemantic HTML gives meaning to your content structure.\n\n## Key Elements\n- `<header>` — introductory content\n- `<nav>` — navigation links\n- `<main>` — primary content\n- `<article>` — self-contained content\n- `<section>` — thematic grouping\n- `<aside>` — tangentially related\n- `<footer>` — footer content\n- `<figure>` + `<figcaption>` — images with captions\n\n## Why It Matters\n- **Accessibility** — screen readers understand structure\n- **SEO** — search engines understand content hierarchy\n- **Maintainability** — code is self-documenting\n\n## Interview Question\n> "What\'s the difference between `<div>` and `<section>`?"\n\n`<div>` has no semantic meaning — it\'s a generic container.\n`<section>` represents a thematic grouping of content with a heading.' },
                    { title: 'CSS Flexbox & Grid', slug: 'flexbox-grid', order: 1, content: '# CSS Flexbox & Grid\n\n## Flexbox (1D layout)\n```css\n.container {\n    display: flex;\n    justify-content: space-between; /* main axis */\n    align-items: center;           /* cross axis */\n    gap: 16px;\n}\n\n.item {\n    flex: 1;        /* grow equally */\n    flex-shrink: 0; /* don\'t shrink */\n}\n```\n\n## Grid (2D layout)\n```css\n.grid {\n    display: grid;\n    grid-template-columns: repeat(3, 1fr);\n    grid-template-rows: auto 1fr auto;\n    gap: 20px;\n}\n\n.item {\n    grid-column: span 2; /* span 2 columns */\n}\n```\n\n## When to Use\n- **Flexbox** — navigation bars, card rows, centering\n- **Grid** — full page layouts, dashboards, image galleries\n- **Both together** — grid for layout, flexbox inside cells' },
                ],
            },
            {
                title: 'Web Performance', slug: 'web-performance', order: 1,
                topics: [
                    { title: 'Core Web Vitals', slug: 'core-web-vitals', order: 0, content: '# Core Web Vitals\n\nGoogle\'s metrics for user experience:\n\n## LCP (Largest Contentful Paint)\n- Measures loading performance\n- Goal: < 2.5 seconds\n- Fix: optimize images, preload critical resources, use CDN\n\n## FID (First Input Delay) → INP\n- Measures interactivity\n- Goal: < 100ms\n- Fix: break up long tasks, defer non-critical JS, use web workers\n\n## CLS (Cumulative Layout Shift)\n- Measures visual stability\n- Goal: < 0.1\n- Fix: set explicit dimensions on images/ads, avoid dynamic content injection above the fold\n\n## How to Measure\n- Chrome DevTools → Lighthouse\n- PageSpeed Insights\n- `web-vitals` npm package\n\n```javascript\nimport { getCLS, getFID, getLCP } from \'web-vitals\';\ngetCLS(console.log);\ngetFID(console.log);\ngetLCP(console.log);\n```' },
                    { title: 'Lazy Loading & Image Optimization', slug: 'lazy-loading', order: 1, content: '# Lazy Loading & Image Optimization\n\n## Native Lazy Loading\n```html\n<img src=\"photo.jpg\" loading=\"lazy\" alt=\"...\" />\n<iframe src=\"video.html\" loading=\"lazy\"></iframe>\n```\n\n## Intersection Observer\n```javascript\nconst observer = new IntersectionObserver((entries) => {\n    entries.forEach(entry => {\n        if (entry.isIntersecting) {\n            entry.target.src = entry.target.dataset.src;\n            observer.unobserve(entry.target);\n        }\n    });\n});\n\ndocument.querySelectorAll(\'img[data-src]\').forEach(img => {\n    observer.observe(img);\n});\n```\n\n## Image Formats\n- **WebP** — 25-35% smaller than JPEG\n- **AVIF** — even smaller, newer\n- Use `<picture>` for format fallbacks\n\n## Next.js Image\n```jsx\nimport Image from \'next/image\';\n<Image src=\"/photo.jpg\" width={800} height={600} alt=\"...\" />\n// Auto-optimizes, lazy loads, serves WebP\n```' },
                ],
            },
            {
                title: 'Machine Coding', slug: 'machine-coding', order: 2,
                topics: [
                    { title: 'Building a Modal Component', slug: 'building-modal', order: 0, content: '# Building a Modal Component\n\nA common machine coding round question.\n\n## Requirements\n- Overlay background\n- Centered content\n- Close on escape key\n- Close on overlay click\n- Focus trap (accessibility)\n- Prevent body scroll\n\n## Implementation\n```jsx\nfunction Modal({ isOpen, onClose, children }) {\n    useEffect(() => {\n        if (!isOpen) return;\n        const handleEsc = (e) => e.key === \'Escape\' && onClose();\n        document.addEventListener(\'keydown\', handleEsc);\n        document.body.style.overflow = \'hidden\';\n        return () => {\n            document.removeEventListener(\'keydown\', handleEsc);\n            document.body.style.overflow = \'\';\n        };\n    }, [isOpen, onClose]);\n\n    if (!isOpen) return null;\n\n    return createPortal(\n        <div className=\"overlay\" onClick={onClose}>\n            <div className=\"modal\" onClick={e => e.stopPropagation()}>\n                <button onClick={onClose}>×</button>\n                {children}\n            </div>\n        </div>,\n        document.body\n    );\n}\n```' },
                    { title: 'Building an Autocomplete', slug: 'building-autocomplete', order: 1, content: '# Building an Autocomplete\n\n## Key Features\n- Debounced API calls\n- Keyboard navigation\n- Highlight matching text\n- Loading/error states\n- Accessibility (ARIA)\n\n## Core Logic\n```jsx\nfunction Autocomplete({ fetchSuggestions }) {\n    const [query, setQuery] = useState(\'\');\n    const [suggestions, setSuggestions] = useState([]);\n    const [activeIndex, setActiveIndex] = useState(-1);\n\n    useEffect(() => {\n        if (!query.trim()) { setSuggestions([]); return; }\n        const timer = setTimeout(async () => {\n            const data = await fetchSuggestions(query);\n            setSuggestions(data);\n        }, 300);\n        return () => clearTimeout(timer);\n    }, [query]);\n\n    const handleKeyDown = (e) => {\n        if (e.key === \'ArrowDown\') {\n            setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));\n        } else if (e.key === \'ArrowUp\') {\n            setActiveIndex(i => Math.max(i - 1, 0));\n        } else if (e.key === \'Enter\' && activeIndex >= 0) {\n            selectSuggestion(suggestions[activeIndex]);\n        }\n    };\n\n    return (\n        <div role=\"combobox\">\n            <input value={query} onChange={e => setQuery(e.target.value)}\n                   onKeyDown={handleKeyDown} />\n            <ul role=\"listbox\">\n                {suggestions.map((s, i) => (\n                    <li key={s.id} role=\"option\"\n                        className={i === activeIndex ? \'active\' : \'\'}\n                        onClick={() => selectSuggestion(s)}>\n                        {s.label}\n                    </li>\n                ))}\n            </ul>\n        </div>\n    );\n}\n```' },
                ],
            },
        ],
    },
];

/* ── Main ────────────────────────────────────────────────────── */
async function seed() {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    for (const kitData of KITS) {
        // Check if kit already exists
        const existing = await Kit.findOne({ slug: kitData.slug });
        if (existing) {
            console.log(`⏭️  Kit "${kitData.name}" already exists — skipping`);
            continue;
        }

        // Create Kit
        const kit = await Kit.create({
            name: kitData.name,
            slug: kitData.slug,
            description: kitData.description,
            icon: kitData.icon,
            color: kitData.color,
            order: kitData.order,
        });
        console.log(`📦 Created kit: ${kit.name} (${kit.slug})`);

        // Create Chapters & Topics
        for (const chapData of kitData.chapters) {
            const chapter = await Chapter.create({
                kitId: kit._id,
                title: chapData.title,
                slug: chapData.slug,
                order: chapData.order,
            });
            console.log(`  📗 Chapter: ${chapter.title}`);

            for (const topicData of chapData.topics) {
                await Topic.create({
                    chapterId: chapter._id,
                    kitId: kit._id,
                    title: topicData.title,
                    slug: topicData.slug,
                    content: topicData.content,
                    order: topicData.order,
                });
                console.log(`    📄 Topic: ${topicData.title}`);
            }
        }
    }

    // Print summary
    const totalKits = await Kit.countDocuments();
    const totalChapters = await Chapter.countDocuments();
    const totalTopics = await Topic.countDocuments();
    console.log(`\n✅ Done! ${totalKits} kits, ${totalChapters} chapters, ${totalTopics} topics`);

    await mongoose.disconnect();
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
