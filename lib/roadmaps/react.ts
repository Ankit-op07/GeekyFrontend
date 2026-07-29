// lib/roadmaps/react.ts
//
// React interview roadmap. Every slug in `topics` is a real Topic in
// `react-interview-kit`; `crossKit` slugs are real Topics in the kit named.
// Ordered the way a candidate should STUDY, which is not the kit's chapter
// order — e.g. `useEffect` is taught in chapter 0 but only makes sense after
// render/commit, and the machine-coding builds live in the last chapter but
// should start in week two, not week six.

import type { Roadmap } from './types';

export const reactRoadmap: Roadmap = {
    id: 'react',
    kitSlug: 'react-interview-kit',
    title: 'React.js Interview Roadmap',
    tagline: 'From the render model to the machine-coding round.',
    audience: 'Frontend engineers targeting React roles — 0 to 5 years.',
    weeks: 8,
    accent: { from: 'from-cyan-500', to: 'to-blue-600' },
    stages: [
        {
            id: 'prereq',
            title: 'Before You Touch React',
            goal: 'Read any React codebase without the JavaScript getting in the way.',
            nodes: [
                {
                    id: 'js-closures-this',
                    title: 'Closures, `this` & the event loop',
                    summary:
                        'Almost every "React bug" in an interview is a JavaScript bug. Stale closures in useEffect, a lost `this` in a class handler, and a setState that "did not update" are all this material.',
                    tier: 'beginner',
                    est: '4h',
                    crossKit: [
                        {
                            kitSlug: 'javascript-interview-kit',
                            topics: ['closures-in-depth', 'the-this-keyword', 'the-event-loop'],
                        },
                    ],
                    external: [
                        {
                            title: 'Closures — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures',
                        },
                    ],
                    interview: [
                        'Why does the callback inside setTimeout in a useEffect see an old value of state?',
                        'What does `this` refer to inside an arrow function used as a class field?',
                    ],
                },
                {
                    id: 'js-immutability',
                    title: 'References, copying & immutability',
                    summary:
                        'React decides whether to re-render by comparing references. If you cannot say why `arr.push(x)` fails to re-render but `[...arr, x]` works, nothing later in this roadmap will make sense.',
                    tier: 'beginner',
                    est: '3h',
                    crossKit: [
                        {
                            kitSlug: 'javascript-interview-kit',
                            topics: ['data-types-and-coercion', 'destructuring-spread-and-rest'],
                        },
                    ],
                    external: [
                        {
                            title: 'Updating Objects in State',
                            url: 'https://react.dev/learn/updating-objects-in-state',
                        },
                        {
                            title: 'Updating Arrays in State',
                            url: 'https://react.dev/learn/updating-arrays-in-state',
                        },
                    ],
                    interview: [
                        'Why is mutating state directly a bug even though the value on screen is "correct" after the next render?',
                        'Is a shallow copy enough for nested state? What breaks?',
                    ],
                },
                {
                    id: 'js-async',
                    title: 'Promises & async/await',
                    summary:
                        'Data fetching, Suspense, and every "what happens if the user navigates away mid-request" follow-up sit on this.',
                    tier: 'beginner',
                    est: '3h',
                    crossKit: [
                        {
                            kitSlug: 'javascript-interview-kit',
                            topics: ['promises-deep-dive', 'async-await'],
                        },
                    ],
                    interview: [
                        'What is the difference between Promise.all and Promise.allSettled, and which do you want for a dashboard of independent widgets?',
                    ],
                },
                {
                    id: 'tooling-basics',
                    title: 'Node, npm & a bundler',
                    summary:
                        'You do not need to be a build engineer, but you should be able to explain what Vite actually does to your JSX before the browser sees it.',
                    tier: 'beginner',
                    kind: 'optional',
                    est: '2h',
                    external: [
                        { title: 'Vite — Why Vite', url: 'https://vite.dev/guide/why.html' },
                        {
                            title: 'Start a New React Project',
                            url: 'https://react.dev/learn/start-a-new-react-project',
                        },
                    ],
                    interview: ['Browsers cannot run JSX. What turns it into something they can?'],
                },
            ],
        },
        {
            id: 'core',
            title: 'The Render Model',
            goal: 'Explain out loud what React does between a click and a pixel changing.',
            nodes: [
                {
                    id: 'vdom',
                    title: 'Virtual DOM & reconciliation',
                    summary:
                        'The single most-asked React question. The honest answer is not "it is faster than the DOM" — it is that React trades a cheap diff for a predictable programming model.',
                    tier: 'beginner',
                    est: '3h',
                    topics: ['virtual-dom'],
                    external: [
                        { title: 'Render and Commit', url: 'https://react.dev/learn/render-and-commit' },
                        {
                            title: 'Preserving and Resetting State',
                            url: 'https://react.dev/learn/preserving-and-resetting-state',
                        },
                    ],
                    interview: [
                        'Is the virtual DOM faster than direct DOM manipulation? Defend your answer.',
                        'What is the reconciliation heuristic React uses for element type, and what does it cost you when it guesses wrong?',
                    ],
                },
                {
                    id: 'keys',
                    title: 'Lists, keys & conditional rendering',
                    summary:
                        'Using the array index as a key is the most common React bug in production. Know exactly which cases it breaks and which it does not.',
                    tier: 'beginner',
                    est: '2h',
                    topics: ['conditional-rendering-list-rendering'],
                    external: [
                        {
                            title: 'Rendering Lists',
                            url: 'https://react.dev/learn/rendering-lists',
                        },
                    ],
                    interview: [
                        'When is `key={index}` safe, and what exactly goes wrong when it is not?',
                        'Why does a controlled input inside a re-ordered list keep the wrong value?',
                    ],
                },
                {
                    id: 'jsx',
                    title: 'JSX — it is not HTML',
                    summary:
                        'JSX is a function call in disguise. Once you can hand-write the `createElement` a snippet compiles to, half the "why is this undefined" questions answer themselves.',
                    tier: 'beginner',
                    est: '2h',
                    topics: ['jsx-it-s-not-html'],
                    external: [
                        {
                            title: 'Writing Markup with JSX',
                            url: 'https://react.dev/learn/writing-markup-with-jsx',
                        },
                    ],
                    interview: [
                        'What does `<Foo bar={1}>hi</Foo>` compile to?',
                        'Why must a component name start with a capital letter?',
                    ],
                },
                {
                    id: 'components-props',
                    title: 'Components, props & composition',
                    summary:
                        'Props down, events up, and `children` as the escape hatch that removes most of the need for inheritance.',
                    tier: 'beginner',
                    est: '3h',
                    topics: ['components-props-composition'],
                    external: [
                        {
                            title: 'Passing Props to a Component',
                            url: 'https://react.dev/learn/passing-props-to-a-component',
                        },
                        {
                            title: 'Keeping Components Pure',
                            url: 'https://react.dev/learn/keeping-components-pure',
                        },
                    ],
                    interview: [
                        'How do you let a parent customise the middle of a component without adding ten boolean props?',
                        'What does it mean for a component to be pure, and what breaks when it is not?',
                    ],
                },
                {
                    id: 'usestate',
                    title: 'State & useState',
                    summary:
                        'State is a snapshot, not a variable. Batching, the updater form, and lazy initialisation are the three things interviewers probe.',
                    tier: 'beginner',
                    est: '4h',
                    topics: ['state-usestate-deep-dive'],
                    external: [
                        {
                            title: "State as a Snapshot",
                            url: 'https://react.dev/learn/state-as-a-snapshot',
                        },
                        {
                            title: 'Queueing a Series of State Updates',
                            url: 'https://react.dev/learn/queueing-a-series-of-state-updates',
                        },
                    ],
                    interview: [
                        'Calling `setCount(count + 1)` three times in one handler increments by one. Why, and how do you fix it?',
                        'What is the difference between `useState(expensive())` and `useState(() => expensive())`?',
                    ],
                },
                {
                    id: 'effects',
                    title: 'useEffect, honestly',
                    summary:
                        'The hook people over-use. Learn the lifecycle mapping, the dependency array, cleanup, and — most importantly — the cases where you should not reach for an effect at all.',
                    tier: 'intermediate',
                    est: '5h',
                    topics: ['component-lifecycle-useeffect-mastery'],
                    external: [
                        {
                            title: 'Synchronizing with Effects',
                            url: 'https://react.dev/learn/synchronizing-with-effects',
                        },
                        {
                            title: 'You Might Not Need an Effect',
                            url: 'https://react.dev/learn/you-might-not-need-an-effect',
                        },
                    ],
                    interview: [
                        'Name three things people do in useEffect that should not be in an effect at all.',
                        'Why does the cleanup function run before every re-run and not just on unmount?',
                        'Your effect fires twice in development. Is that a bug?',
                    ],
                },
                {
                    id: 'events',
                    title: 'Event handling & synthetic events',
                    summary:
                        'React attaches one listener at the root and replays events through its own system. That is why `e.stopPropagation()` sometimes does not do what you expect around non-React code.',
                    tier: 'beginner',
                    est: '2h',
                    topics: ['event-handling-in-react'],
                    interview: [
                        'What is a synthetic event and why does React use one?',
                        'How do you pass an argument to a handler without creating a new function every render — and does that actually matter?',
                    ],
                },
                {
                    id: 'forms',
                    title: 'Forms: controlled vs uncontrolled',
                    summary:
                        'A real design decision, not trivia: controlled gives you validation-on-keystroke and costs a render per keystroke; uncontrolled gives you speed and costs you the value.',
                    tier: 'beginner',
                    est: '3h',
                    topics: ['forms-controlled-vs-uncontrolled-components'],
                    interview: [
                        'A 40-field form re-renders on every keystroke and feels slow. Walk through your options.',
                        'Why does an input flip from uncontrolled to controlled and warn in the console?',
                    ],
                },
                {
                    id: 'refs',
                    title: 'Refs & useRef beyond the DOM',
                    summary:
                        'A ref is a mutable box that survives renders without causing one. Focus management, previous-value tracking, and holding an interval id all live here.',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['refs-useref-beyond-dom-access'],
                    external: [
                        {
                            title: 'Referencing Values with Refs',
                            url: 'https://react.dev/learn/referencing-values-with-refs',
                        },
                        {
                            title: 'Manipulating the DOM with Refs',
                            url: 'https://react.dev/learn/manipulating-the-dom-with-refs',
                        },
                    ],
                    interview: [
                        'When do you use a ref instead of state?',
                        'Why can you not read `ref.current` for a DOM node during render?',
                    ],
                },
                {
                    id: 'error-boundaries',
                    title: 'Error boundaries',
                    summary:
                        'The one thing hooks still cannot do. Know what they catch (render, lifecycle) and what they do not (event handlers, async, SSR).',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['error-boundaries-handling-errors-gracefully'],
                    external: [
                        {
                            title: 'Catching rendering errors with an error boundary',
                            url: 'https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary',
                        },
                    ],
                    interview: [
                        'An error thrown in an onClick handler is not caught by your error boundary. Why, and what do you do instead?',
                    ],
                },
            ],
        },
        {
            id: 'hooks',
            title: 'Hooks in Depth',
            goal: 'Pick the right hook on instinct and defend the choice.',
            nodes: [
                {
                    id: 'usereducer',
                    title: 'useReducer',
                    summary:
                        'The answer to "how do you manage state in a large component" long before Redux is the answer. Reach for it when the next state depends on the previous one across several fields.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['usereducer-when-usestate-isn-t-enough'],
                    external: [
                        {
                            title: 'Extracting State Logic into a Reducer',
                            url: 'https://react.dev/learn/extracting-state-logic-into-a-reducer',
                        },
                    ],
                    interview: [
                        'Give a concrete case where useReducer beats three useStates.',
                        'Must a reducer be pure? What breaks if it is not?',
                    ],
                },
                {
                    id: 'context',
                    title: 'useContext & the Context API',
                    summary:
                        'Context solves prop drilling, not state management. Its performance model — every consumer re-renders when the value identity changes — is the whole interview.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['usecontext-the-context-api'],
                    external: [
                        {
                            title: 'Passing Data Deeply with Context',
                            url: 'https://react.dev/learn/passing-data-deeply-with-context',
                        },
                        {
                            title: 'Scaling Up with Reducer and Context',
                            url: 'https://react.dev/learn/scaling-up-with-reducer-and-context',
                        },
                    ],
                    interview: [
                        'Why does `value={{ user, setUser }}` re-render every consumer on each parent render, and how do you fix it?',
                        'Is Context a state manager? Argue both sides.',
                    ],
                },
                {
                    id: 'memo-hooks',
                    title: 'useMemo, useCallback & React.memo',
                    summary:
                        'Three tools that all do the same thing — preserve identity — at three different levels. The trap is that memoising everything is slower than memoising nothing.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: [
                        'usememo-usecallback-performance-hooks',
                        'react-memo-purecomponent-re-render-prevention',
                    ],
                    external: [
                        { title: 'useMemo — reference', url: 'https://react.dev/reference/react/useMemo' },
                        { title: 'memo — reference', url: 'https://react.dev/reference/react/memo' },
                    ],
                    interview: [
                        'You wrapped a child in React.memo and it still re-renders. Give two reasons.',
                        'What does useCallback cost when it is not needed?',
                    ],
                },
                {
                    id: 'custom-hooks',
                    title: 'Custom hooks',
                    summary:
                        'The real reuse primitive in modern React. A custom hook shares logic, never state — two components calling `useCounter()` get two independent counters.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['custom-hooks-building-reusable-logic'],
                    external: [
                        {
                            title: 'Reusing Logic with Custom Hooks',
                            url: 'https://react.dev/learn/reusing-logic-with-custom-hooks',
                        },
                    ],
                    interview: [
                        'Do two components using the same custom hook share state?',
                        'Why must a hook name start with "use"?',
                    ],
                    build: 'Write `useDebounce`, `useLocalStorage` and `useFetch` from scratch, with cleanup that cancels in-flight work.',
                },
                {
                    id: 'uselayouteffect',
                    title: 'useLayoutEffect vs useEffect',
                    summary:
                        'One runs before the browser paints and one after. Measuring a tooltip is the canonical case where the difference is a visible flicker.',
                    tier: 'advanced',
                    kind: 'optional',
                    est: '1h',
                    topics: ['uselayouteffect-vs-useeffect'],
                    external: [
                        {
                            title: 'useLayoutEffect — reference',
                            url: 'https://react.dev/reference/react/useLayoutEffect',
                        },
                    ],
                    interview: [
                        'When is useLayoutEffect the right call, and why is it a warning in SSR?',
                    ],
                },
                {
                    id: 'rules-of-hooks',
                    title: 'The rules of hooks (and why they exist)',
                    summary:
                        'Hooks are stored in a per-component list and matched by call order. That single implementation detail explains every rule.',
                    tier: 'intermediate',
                    est: '1h',
                    external: [
                        { title: 'Rules of Hooks', url: 'https://react.dev/reference/rules/rules-of-hooks' },
                    ],
                    interview: [
                        'Why can you not call a hook inside an if?',
                        'How does React know which useState call is which between renders?',
                    ],
                },
            ],
        },
        {
            id: 'patterns',
            title: 'Composition & Patterns',
            goal: 'Design a component API a teammate can use without reading its source.',
            nodes: [
                {
                    id: 'container-presentational',
                    title: 'Container / presentational',
                    summary:
                        'Mostly historical since hooks, and interviewers like hearing you say so — then explain what replaced it.',
                    tier: 'intermediate',
                    kind: 'optional',
                    est: '1h',
                    topics: ['container-presentational-pattern'],
                    interview: ['Is this pattern still relevant in a hooks codebase? Why or why not?'],
                },
                {
                    id: 'hoc-render-props',
                    title: 'HOCs & render props',
                    summary:
                        'You will not write many new ones, but every legacy codebase and every React-Router-v5 question needs you to read them fluently.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['higher-order-components-hoc', 'render-props-pattern'],
                    interview: [
                        'What problem do HOCs and render props both solve, and what did hooks change?',
                        'What is the wrapper-hell problem?',
                    ],
                },
                {
                    id: 'compound-components',
                    title: 'Compound components',
                    summary:
                        'How `<Tabs><Tab/></Tabs>` shares implicit state. The pattern behind almost every headless UI library, and a favourite "design this API" question.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['compound-component-pattern', 'provider-pattern-composition-pattern'],
                    interview: [
                        'Design an Accordion whose items are declared as children but that only allows one open at a time.',
                    ],
                    build: 'Build a `<Select>` with `<Select.Option>` children that shares state through context — no prop drilling and no cloneElement.',
                },
                {
                    id: 'solid-react',
                    title: 'SOLID applied to components',
                    summary:
                        'The vocabulary senior interviewers use for "this component does too much". Worth having concrete React examples ready.',
                    tier: 'advanced',
                    est: '2h',
                    topics: ['solid-principles-in-react'],
                    interview: [
                        'Give a React example of the single-responsibility principle being violated and how you would split it.',
                    ],
                },
            ],
        },
        {
            id: 'data',
            title: 'Data, Routing & Auth',
            goal: 'Wire a real app to a real API without hand-rolling a cache.',
            nodes: [
                {
                    id: 'fetching',
                    title: 'Data fetching: fetch vs axios vs React Query',
                    summary:
                        'The modern answer to "how do you fetch data" is "I do not put it in useEffect". Know why a server-cache library exists and what it does for you.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['fetching-data-fetch-vs-axios-vs-react-query'],
                    external: [
                        { title: 'TanStack Query docs', url: 'https://tanstack.com/query/latest' },
                        {
                            title: 'AbortController — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortController',
                        },
                    ],
                    interview: [
                        'What are the race conditions in a naive useEffect fetch, and how do you kill them?',
                        'What does React Query give you that useEffect + useState does not?',
                    ],
                },
                {
                    id: 'ui-states',
                    title: 'Loading, error & empty states',
                    summary:
                        'The cheapest way to look senior in a machine-coding round: handle all four states, not just the happy one.',
                    tier: 'beginner',
                    est: '1h',
                    topics: ['loading-error-empty-states'],
                    interview: ['Name the four states every data-driven view has.'],
                },
                {
                    id: 'debounce-throttle',
                    title: 'Debouncing & throttling',
                    summary:
                        'Asked in almost every frontend interview, usually as "make this search box not hammer the API".',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['debouncing-throttling'],
                    interview: [
                        'Implement debounce from scratch. Now add a `cancel` method.',
                        'When is throttle the right choice over debounce?',
                    ],
                    build: 'Implement both from scratch, then wrap debounce in a hook that cleans up on unmount.',
                },
                {
                    id: 'routing',
                    title: 'Routing & navigation',
                    summary:
                        'Client-side routing, nested routes, and the URL as a piece of state you do not have to manage yourself.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['react-router-complete-guide'],
                    external: [{ title: 'React Router docs', url: 'https://reactrouter.com/' }],
                    interview: [
                        'What actually happens on a client-side route change — how does the URL update without a request?',
                        'Why does a hard refresh on /users/42 404 on a static host, and how do you fix it?',
                    ],
                },
                {
                    id: 'auth',
                    title: 'Protected routes, JWT & auth flow',
                    summary:
                        'Where the frontend interview meets the security interview. Have an opinion on localStorage vs httpOnly cookies and be able to justify it.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['protected-routes-authentication-flow', 'authentication-jwt-in-react'],
                    external: [
                        {
                            title: 'Using HTTP cookies — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies',
                        },
                    ],
                    interview: [
                        'Where do you store a JWT, and what attack does each option expose you to?',
                        'How do you handle a token expiring mid-session without logging the user out?',
                    ],
                },
            ],
        },
        {
            id: 'state',
            title: 'State Management at Scale',
            goal: 'Answer "how would you manage state in a large app" with a decision, not a library name.',
            nodes: [
                {
                    id: 'state-decision',
                    title: 'When you actually need a state library',
                    summary:
                        'Start here, not with Redux. Local → lifted → context → server cache → global store is the ladder, and most apps stop before the last rung.',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['state-management-when-why-you-need-it'],
                    external: [
                        {
                            title: 'Sharing State Between Components',
                            url: 'https://react.dev/learn/sharing-state-between-components',
                        },
                    ],
                    interview: [
                        'Walk me up the ladder from useState to a global store and tell me what forces each step.',
                    ],
                },
                {
                    id: 'redux-core',
                    title: 'Redux from first principles',
                    summary:
                        'Store, actions, reducers, immutability, single source of truth. Even in a Zustand codebase, this is the vocabulary interviews are conducted in.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['redux-from-scratch-core-principles'],
                    external: [
                        { title: 'Redux Style Guide', url: 'https://redux.js.org/style-guide/' },
                    ],
                    interview: [
                        'Why must reducers be pure functions?',
                        'What is the difference between an action and an action creator?',
                    ],
                    build: 'Write a 30-line `createStore` with subscribe/dispatch/getState. It makes the whole model click.',
                },
                {
                    id: 'redux-toolkit',
                    title: 'Redux Toolkit',
                    summary:
                        'What people actually ship. `createSlice`, Immer-backed "mutation", and RTK Query — and why hand-written Redux boilerplate is now a red flag.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['redux-toolkit-the-modern-way'],
                    external: [{ title: 'Redux Toolkit docs', url: 'https://redux-toolkit.js.org/' }],
                    interview: [
                        'RTK lets you write `state.value += 1` in a reducer. Is that a mutation? Explain what Immer does.',
                    ],
                },
                {
                    id: 'middleware',
                    title: 'Middleware & side effects',
                    summary:
                        'Thunk vs saga, and the more useful framing: where do side effects belong when reducers must stay pure?',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['redux-middleware-side-effects'],
                    interview: [
                        'Reducers must be pure, so where does the API call go?',
                        'When is a saga worth its learning curve over a thunk?',
                    ],
                },
                {
                    id: 'context-vs-redux',
                    title: 'Context vs Redux — the real answer',
                    summary:
                        'A comparison question with a wrong answer ("they are the same"), a mediocre answer ("Redux is for big apps") and a good one about re-render granularity, devtools and middleware.',
                    tier: 'advanced',
                    est: '2h',
                    topics: ['context-api-vs-redux-the-real-answer'],
                    interview: [
                        'Replace Redux with Context in a 200-component app. What degrades first?',
                    ],
                },
            ],
        },
        {
            id: 'perf',
            title: 'Performance',
            goal: 'Diagnose a slow React app with a profiler instead of a guess.',
            nodes: [
                {
                    id: 'perf-toolkit',
                    title: 'The performance toolkit',
                    summary:
                        'Measure, find the cause, then pick the fix. The order matters — a candidate who reaches for useMemo before opening the Profiler loses the point.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['react-performance-the-complete-toolkit'],
                    external: [
                        { title: '<Profiler> — reference', url: 'https://react.dev/reference/react/Profiler' },
                    ],
                    interview: [
                        'How do you find out WHY a component re-rendered?',
                        'What are the three broad causes of a slow React screen?',
                    ],
                },
                {
                    id: 'memo-strategy',
                    title: 'When NOT to optimise',
                    summary:
                        'Memoisation is not free: it costs a comparison, an allocation, and readability. Knowing when to skip it is the senior signal.',
                    tier: 'advanced',
                    est: '2h',
                    topics: ['memoization-strategies-when-not-to-optimize'],
                    interview: [
                        'When does React.memo make a component slower?',
                        'Is re-rendering the same as re-mounting? Is a re-render always a problem?',
                    ],
                },
                {
                    id: 'code-splitting',
                    title: 'Code splitting, lazy & Suspense',
                    summary:
                        'Route-level splitting is the highest-leverage frontend performance change there is, and it is three lines of code.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: [
                        'code-splitting-lazy-loading-routes',
                        'code-splitting-lazy-loading-suspense-deep-dive',
                    ],
                    external: [
                        { title: 'lazy — reference', url: 'https://react.dev/reference/react/lazy' },
                        { title: '<Suspense> — reference', url: 'https://react.dev/reference/react/Suspense' },
                    ],
                    interview: [
                        'Where do you put the split points, and how do you avoid a loading spinner flashing on every navigation?',
                    ],
                },
                {
                    id: 'virtualization',
                    title: 'Virtualisation: 10,000 rows',
                    summary:
                        'The canonical "render a huge list" question. Render what is in the viewport, and know the accessibility and ctrl-F costs of doing so.',
                    tier: 'advanced',
                    est: '2h',
                    topics: ['virtualization-rendering-10-000-rows'],
                    interview: [
                        'Render a 100,000-row table without freezing the browser. Walk me through it.',
                        'What does virtualisation break?',
                    ],
                    build: 'Implement a fixed-height windowed list yourself before reaching for a library.',
                },
                {
                    id: 'web-vitals',
                    title: 'Web Vitals & bundle size',
                    summary:
                        'The metrics a hiring manager has on a dashboard: LCP, INP, CLS. Tie your React work to them and you are speaking their language.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['web-vitals-tree-shaking-bundle-optimization'],
                    external: [
                        { title: 'Web Vitals', url: 'https://web.dev/articles/vitals' },
                    ],
                    interview: [
                        'What is INP and what typically causes a bad one in a React app?',
                        'Your bundle is 2.5 MB. What are your first three moves?',
                    ],
                },
            ],
        },
        {
            id: 'testing',
            title: 'Testing & Quality',
            goal: 'Write a test that would actually have caught the bug.',
            nodes: [
                {
                    id: 'testing-basics',
                    title: 'Testing fundamentals',
                    summary:
                        'The pyramid, what a unit is in a UI, and why "test behaviour, not implementation" is more than a slogan.',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['testing-fundamentals-what-why-and-how'],
                    interview: [
                        'What do you NOT test in a React component?',
                        'Why is asserting on state a smell?',
                    ],
                },
                {
                    id: 'rtl',
                    title: 'React Testing Library',
                    summary:
                        'Query by role, act like a user, avoid the DOM internals. The query priority list is worth memorising — it doubles as accessibility knowledge.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['react-testing-library-practical-guide'],
                    external: [
                        {
                            title: 'React Testing Library — intro',
                            url: 'https://testing-library.com/docs/react-testing-library/intro/',
                        },
                        {
                            title: 'About Queries — priority',
                            url: 'https://testing-library.com/docs/queries/about/',
                        },
                    ],
                    interview: [
                        'Why is getByRole preferred over getByTestId?',
                        'What is the difference between getBy, queryBy and findBy?',
                    ],
                },
                {
                    id: 'mocking',
                    title: 'Mocking APIs, hooks & context',
                    summary:
                        'How to test the component without testing the network — and why mocking at the network boundary beats mocking your own modules.',
                    tier: 'advanced',
                    est: '2h',
                    topics: ['mocking-api-calls-hooks-context'],
                    interview: ['How do you test a component that consumes context and fetches data?'],
                },
            ],
        },
        {
            id: 'machine-coding',
            title: 'The Machine-Coding Round',
            goal: 'Ship a working, accessible component in 45 minutes while narrating your decisions.',
            nodes: [
                {
                    id: 'mc-strategy',
                    title: 'Round strategy & setup',
                    summary:
                        'Clarify, sketch the state, build the happy path, then harden. Candidates lose this round on process far more often than on React.',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['machine-coding-round-strategy-setup'],
                    interview: [
                        'What do you ask before writing a single line?',
                        'You have 10 minutes left and it is not done. What do you do?',
                    ],
                },
                {
                    id: 'mc-warmup',
                    title: 'Warm-ups: counter, checkboxes, star rating',
                    summary:
                        'Short builds to get the muscle memory for state shape and event wiring. Time-box each to 20 minutes.',
                    tier: 'beginner',
                    kind: 'practice',
                    est: '3h',
                    topics: [
                        'build-counter-with-usereducer',
                        'build-dynamic-checkbox-with-select-all',
                        'build-star-rating-component',
                    ],
                    build: 'All three, from a blank file, without looking at the solution first.',
                },
                {
                    id: 'mc-lists',
                    title: 'Lists: todo, pagination, infinite scroll',
                    summary:
                        'CRUD, derived state and the two ways of showing a long list. Infinite scroll pulls in IntersectionObserver, which is its own interview question.',
                    tier: 'intermediate',
                    kind: 'practice',
                    est: '5h',
                    topics: [
                        'build-todo-app-with-crud',
                        'build-pagination-component',
                        'build-infinite-scroll-list',
                    ],
                    external: [
                        {
                            title: 'Intersection Observer API — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API',
                        },
                    ],
                    build: 'Build the todo app, then add pagination to it, then swap pagination for infinite scroll.',
                },
                {
                    id: 'mc-async',
                    title: 'Async UI: debounced search, shopping cart',
                    summary:
                        'Where debouncing, race conditions, cleanup and context all show up in one 45-minute build.',
                    tier: 'intermediate',
                    kind: 'practice',
                    est: '4h',
                    topics: [
                        'build-search-bar-with-debounced-api-calls',
                        'build-shopping-cart-with-context',
                    ],
                    build: 'Search bar: cancel the in-flight request when a new keystroke arrives. Interviewers look for exactly this.',
                },
                {
                    id: 'mc-widgets',
                    title: 'Widgets: modal, dropdown, accordion',
                    summary:
                        'The accessibility round in disguise — focus trapping, Escape to close, aria-expanded, click-outside. Getting a11y right here is a strong senior signal.',
                    tier: 'advanced',
                    kind: 'practice',
                    est: '5h',
                    topics: [
                        'build-modal-dialog-component',
                        'build-custom-dropdown-select',
                        'build-accordion-faq-component',
                    ],
                    external: [
                        {
                            title: 'ARIA Authoring Practices — patterns',
                            url: 'https://www.w3.org/WAI/ARIA/apg/patterns/',
                        },
                    ],
                    build: 'Make the modal keyboard-complete: focus moves in on open, traps inside, returns to the trigger on close.',
                },
                {
                    id: 'mc-hard',
                    title: 'Harder: multi-step form, nested circles, tic-tac-toe',
                    summary:
                        'Recursion, derived winner state and multi-step validation — the builds that separate a pass from a strong hire.',
                    tier: 'advanced',
                    kind: 'practice',
                    est: '5h',
                    topics: [
                        'build-multi-step-form-with-validation',
                        'build-nested-circles-recursive-component',
                        'build-tic-tac-toe-game',
                    ],
                    build: 'Tic-tac-toe with move history (time travel). It is the classic follow-up.',
                },
            ],
        },
        {
            id: 'interview-day',
            title: 'Interview Day',
            goal: 'Handle the discussion round, not just the coding round.',
            nodes: [
                {
                    id: 'scenario-slow-app',
                    title: 'Scenario: "this app is slow"',
                    summary:
                        'An open-ended diagnosis question. The structure of your answer is the answer: measure, categorise, fix, verify.',
                    tier: 'advanced',
                    est: '2h',
                    topics: ['scenario-this-react-app-is-slow-how-do-you-fix-it'],
                    interview: ['Give your first five questions before touching any code.'],
                },
                {
                    id: 'scenario-architecture',
                    title: 'Scenario: component architecture & large-app state',
                    summary:
                        'Design questions scaled to a component tree — where boundaries go, what is shared, what is local.',
                    tier: 'advanced',
                    est: '2h',
                    topics: [
                        'scenario-design-the-component-architecture-for-this-feature',
                        'scenario-how-do-you-manage-state-in-a-large-react-app',
                    ],
                    interview: [
                        'Design the component tree for a data table with filters, sorting, row selection and bulk actions.',
                    ],
                },
                {
                    id: 'scenario-url',
                    title: 'Scenario: URL → rendered React page',
                    summary:
                        'The end-to-end question that proves you understand the browser under React, not only React.',
                    tier: 'advanced',
                    est: '2h',
                    topics: [
                        'scenario-walk-me-through-what-happens-when-you-type-a-url-and-see-a-react-page',
                    ],
                    interview: [
                        'Take it from DNS to hydration. Where in that chain would you add SSR, and what does it buy you?',
                    ],
                },
                {
                    id: 'behavioral',
                    title: 'Behavioural questions',
                    summary:
                        'The round most engineers under-prepare and most rejections quietly come from. Have three stories ready in STAR form.',
                    tier: 'beginner',
                    est: '2h',
                    topics: ['behavioral-questions-what-interviewers-really-want'],
                    interview: [
                        'Tell me about a technical decision you got wrong.',
                        'Tell me about a disagreement with a teammate and how it resolved.',
                    ],
                },
                {
                    id: 'react19',
                    title: 'React 19 & the server-component world',
                    summary:
                        'Not required for most React roles yet, but "what is new in React" is a common closer. Know Server Components, Actions, and the new `use` hook well enough to have an opinion.',
                    tier: 'advanced',
                    kind: 'optional',
                    est: '3h',
                    crossKit: [
                        { kitSlug: 'complete-frontend-kit', topics: ['react-19-hooks', 'app-router-and-rendering'] },
                    ],
                    external: [
                        { title: 'React 19 blog post', url: 'https://react.dev/blog/2024/12/05/react-19' },
                        {
                            title: 'Server Components — reference',
                            url: 'https://react.dev/reference/rsc/server-components',
                        },
                    ],
                    interview: [
                        'What problem do Server Components solve that code splitting does not?',
                    ],
                },
            ],
        },
    ],
};
