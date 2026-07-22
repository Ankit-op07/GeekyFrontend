// lib/topic-references.ts
// Per-topic "learn more" references (articles + videos) shown in the reader's
// right rail. Curated entries live here; anything not curated falls back to
// live search links derived from the topic title, so every topic shows
// something useful. In a later phase these can move to the DB or be fetched
// from the YouTube Data API — see components/learn/topic-references.tsx.

export interface RefLink {
    title: string;
    url: string;
    /** Display source, e.g. "react.dev" or "YouTube". Derived if omitted. */
    source?: string;
    /** YouTube video id — when present, the card shows a real thumbnail. */
    videoId?: string;
    /** Optional channel / author label shown under a video. */
    channel?: string;
}

export interface TopicRefs {
    articles: RefLink[];
    videos: RefLink[];
}

const yt = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
const google = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

// ── Curated references, keyed by topic slug ──────────────────────────────
const CURATED: Record<string, TopicRefs> = {
    'virtual-dom': {
        articles: [
            { title: 'Render and Commit', url: 'https://react.dev/learn/render-and-commit', source: 'react.dev' },
            { title: 'Preserving and Resetting State', url: 'https://react.dev/learn/preserving-and-resetting-state', source: 'react.dev' },
            { title: 'Reconciliation (how the diffing works)', url: 'https://legacy.reactjs.org/docs/reconciliation.html', source: 'reactjs.org' },
            { title: 'React Fiber Architecture — deep dive', url: 'https://github.com/acdlite/react-fiber-architecture', source: 'github.com' },
        ],
        // Real, verified YouTube videos (thumbnails render from the videoId).
        videos: [
            { title: 'Virtual DOM, Reconciliation & Diffing in React', url: 'https://www.youtube.com/watch?v=jiziEC8dPSE', videoId: 'jiziEC8dPSE' },
            { title: 'React Fiber — confusing, made simple', url: 'https://www.youtube.com/watch?v=6JOm5rGvogc', videoId: '6JOm5rGvogc' },
            { title: 'React Fiber Reconciliation: how it works', url: 'https://www.youtube.com/watch?v=rKk4XJYzSQA', videoId: 'rKk4XJYzSQA' },
        ],
    },

    'jsx-it-s-not-html': {
        articles: [
            { title: 'Writing Markup with JSX', url: 'https://react.dev/learn/writing-markup-with-jsx', source: 'react.dev' },
            { title: 'JavaScript in JSX with Curly Braces', url: 'https://react.dev/learn/javascript-in-jsx-with-curly-braces', source: 'react.dev' },
            { title: 'Introducing JSX (deep dive)', url: 'https://legacy.reactjs.org/docs/introducing-jsx.html', source: 'reactjs.org' },
        ],
        videos: [
            { title: 'What is JSX? Syntax explained with examples', url: 'https://www.youtube.com/watch?v=C3OvWKv_a6w', videoId: 'C3OvWKv_a6w' },
            { title: 'Learn JSX in React — the essential guide', url: 'https://www.youtube.com/watch?v=pIpzObwzJqo', videoId: 'pIpzObwzJqo' },
            { title: 'JSX explained for beginners', url: 'https://www.youtube.com/watch?v=C-TCQl4VvCs', videoId: 'C-TCQl4VvCs' },
        ],
    },

    'components-props-composition': {
        articles: [
            { title: 'Your First Component', url: 'https://react.dev/learn/your-first-component', source: 'react.dev' },
            { title: 'Passing Props to a Component', url: 'https://react.dev/learn/passing-props-to-a-component', source: 'react.dev' },
            { title: 'Passing Data Deeply with Context', url: 'https://react.dev/learn/passing-data-deeply-with-context', source: 'react.dev' },
        ],
        videos: [
            { title: 'React props — a detailed, simplified explanation', url: 'https://www.youtube.com/watch?v=KGDi6818H4w', videoId: 'KGDi6818H4w' },
            { title: 'Prop drilling & component composition', url: 'https://www.youtube.com/watch?v=7bmrhfOIGFY', videoId: '7bmrhfOIGFY' },
            { title: 'Composition with props.children', url: 'https://www.youtube.com/watch?v=UyxjZZLPTSY', videoId: 'UyxjZZLPTSY' },
        ],
    },

    'state-usestate-deep-dive': {
        articles: [
            { title: 'State: A Component’s Memory', url: 'https://react.dev/learn/state-a-components-memory', source: 'react.dev' },
            { title: 'useState — API reference', url: 'https://react.dev/reference/react/useState', source: 'react.dev' },
            { title: 'Queueing a Series of State Updates', url: 'https://react.dev/learn/queueing-a-series-of-state-updates', source: 'react.dev' },
            { title: 'Updating Objects in State', url: 'https://react.dev/learn/updating-objects-in-state', source: 'react.dev' },
        ],
        videos: [
            { title: 'Learn useState in 15 minutes', url: 'https://www.youtube.com/watch?v=O6P86uwfdR0', videoId: 'O6P86uwfdR0' },
            { title: 'useState explained: beginner → advanced', url: 'https://www.youtube.com/watch?v=6ZsqXE_r9BI', videoId: '6ZsqXE_r9BI' },
            { title: 'Using state (useState hook)', url: 'https://www.youtube.com/watch?v=4pO-HcG2igk', videoId: '4pO-HcG2igk' },
        ],
    },

    'component-lifecycle-useeffect-mastery': {
        articles: [
            { title: 'Synchronizing with Effects', url: 'https://react.dev/learn/synchronizing-with-effects', source: 'react.dev' },
            { title: 'useEffect — API reference', url: 'https://react.dev/reference/react/useEffect', source: 'react.dev' },
            { title: 'You Might Not Need an Effect', url: 'https://react.dev/learn/you-might-not-need-an-effect', source: 'react.dev' },
        ],
        videos: [
            { title: 'useEffect hook — the basics', url: 'https://www.youtube.com/watch?v=gv9ugDJ1ynU', videoId: 'gv9ugDJ1ynU' },
            { title: 'useEffect: what you need to know', url: 'https://www.youtube.com/watch?v=vpPkUr86IG8', videoId: 'vpPkUr86IG8' },
            { title: 'useEffect explained in 4 minutes', url: 'https://www.youtube.com/watch?v=jO1lPbllUz4', videoId: 'jO1lPbllUz4' },
        ],
    },

    'conditional-rendering-list-rendering': {
        articles: [
            { title: 'Conditional Rendering', url: 'https://react.dev/learn/conditional-rendering', source: 'react.dev' },
            { title: 'Rendering Lists (and keys)', url: 'https://react.dev/learn/rendering-lists', source: 'react.dev' },
            { title: 'Lists and Keys (deep dive)', url: 'https://legacy.reactjs.org/docs/lists-and-keys.html', source: 'reactjs.org' },
        ],
        videos: [
            { title: 'Lists and keys in React', url: 'https://www.youtube.com/watch?v=0sasRxl35_8', videoId: '0sasRxl35_8' },
            { title: 'Conditional rendering & rendering lists', url: 'https://www.youtube.com/watch?v=96DGjqlAIxs', videoId: '96DGjqlAIxs' },
            { title: 'React conditional-rendering mistakes', url: 'https://www.youtube.com/watch?v=T3yQZ3LNHmc', videoId: 'T3yQZ3LNHmc' },
        ],
    },

    'forms-controlled-vs-uncontrolled-components': {
        articles: [
            { title: 'Reacting to Input with State', url: 'https://react.dev/learn/reacting-to-input-with-state', source: 'react.dev' },
            { title: '<input> — controlled inputs', url: 'https://react.dev/reference/react-dom/components/input', source: 'react.dev' },
            { title: 'Sharing State Between Components', url: 'https://react.dev/learn/sharing-state-between-components', source: 'react.dev' },
        ],
        videos: [
            { title: 'Controlled vs uncontrolled — explained clearly', url: 'https://www.youtube.com/watch?v=TRZ6K7hzBzo', videoId: 'TRZ6K7hzBzo' },
            { title: 'Master React forms: controlled vs uncontrolled', url: 'https://www.youtube.com/watch?v=yzqUCV3qPX0', videoId: 'yzqUCV3qPX0' },
            { title: 'Controlled vs uncontrolled — interview take', url: 'https://www.youtube.com/watch?v=xl-FIkD6OIE', videoId: 'xl-FIkD6OIE' },
        ],
    },

    'event-handling-in-react': {
        articles: [
            { title: 'Responding to Events', url: 'https://react.dev/learn/responding-to-events', source: 'react.dev' },
            { title: 'Handling Events (deep dive)', url: 'https://legacy.reactjs.org/docs/handling-events.html', source: 'reactjs.org' },
            { title: 'React event object (SyntheticEvent)', url: 'https://react.dev/reference/react-dom/components/common#react-event-object', source: 'react.dev' },
        ],
        videos: [
            { title: 'Synthetic events & event handling', url: 'https://www.youtube.com/watch?v=0RuGOyDvPyc', videoId: '0RuGOyDvPyc' },
            { title: 'Event handling, synthetic events & bubbling', url: 'https://www.youtube.com/watch?v=H7LeEvw9hLw', videoId: 'H7LeEvw9hLw' },
            { title: 'Synthetic events in React', url: 'https://www.youtube.com/watch?v=_vU4vP3m4e0', videoId: '_vU4vP3m4e0' },
        ],
    },

    'refs-useref-beyond-dom-access': {
        articles: [
            { title: 'Referencing Values with Refs', url: 'https://react.dev/learn/referencing-values-with-refs', source: 'react.dev' },
            { title: 'Manipulating the DOM with Refs', url: 'https://react.dev/learn/manipulating-the-dom-with-refs', source: 'react.dev' },
            { title: 'useRef — API reference', url: 'https://react.dev/reference/react/useRef', source: 'react.dev' },
        ],
        videos: [
            { title: 'useRef — simply explained', url: 'https://www.youtube.com/watch?v=42BkpGe8oxg', videoId: '42BkpGe8oxg' },
            { title: 'useRef vs useState — compared', url: 'https://www.youtube.com/watch?v=isWGbPcpI3g', videoId: 'isWGbPcpI3g' },
            { title: 'The useRef hook in React', url: 'https://www.youtube.com/watch?v=VlSNiL_x4mo', videoId: 'VlSNiL_x4mo' },
        ],
    },

    'error-boundaries-handling-errors-gracefully': {
        articles: [
            { title: 'Error Boundaries (Component reference)', url: 'https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary', source: 'react.dev' },
            { title: 'Error Boundaries (deep dive)', url: 'https://legacy.reactjs.org/docs/error-boundaries.html', source: 'reactjs.org' },
            { title: 'react-error-boundary (popular library)', url: 'https://github.com/bvaughn/react-error-boundary', source: 'github.com' },
        ],
        videos: [
            { title: 'Error boundaries in 7 minutes', url: 'https://www.youtube.com/watch?v=_FuDMEgIy7I', videoId: '_FuDMEgIy7I' },
            { title: 'Handle errors correctly with Error Boundary', url: 'https://www.youtube.com/watch?v=gVj84413hVg', videoId: 'gVj84413hVg' },
            { title: 'Mastering error boundaries in React', url: 'https://www.youtube.com/watch?v=BZ6NBdSbKKI', videoId: 'BZ6NBdSbKKI' },
        ],
    },

    // ── Chapter 2 · Advanced Hooks & Patterns ──
    'usereducer-when-usestate-isn-t-enough': {
        articles: [
            { title: 'useReducer — API reference', url: 'https://react.dev/reference/react/useReducer', source: 'react.dev' },
            { title: 'Extracting State Logic into a Reducer', url: 'https://react.dev/learn/extracting-state-logic-into-a-reducer', source: 'react.dev' },
        ],
        videos: [
            { title: 'useReducer — simply explained', url: 'https://www.youtube.com/watch?v=rgp_iCVS8ys', videoId: 'rgp_iCVS8ys' },
            { title: 'Learn useReducer in 15 minutes', url: 'https://www.youtube.com/watch?v=R5G2acJ6_vQ', videoId: 'R5G2acJ6_vQ' },
            { title: 'useReducer vs useState — when to use', url: 'https://www.youtube.com/watch?v=PMyPyT8N4m8', videoId: 'PMyPyT8N4m8' },
        ],
    },
    'usecontext-the-context-api': {
        articles: [
            { title: 'useContext — API reference', url: 'https://react.dev/reference/react/useContext', source: 'react.dev' },
            { title: 'Passing Data Deeply with Context', url: 'https://react.dev/learn/passing-data-deeply-with-context', source: 'react.dev' },
            { title: 'Scaling Up with Reducer and Context', url: 'https://react.dev/learn/scaling-up-with-reducer-and-context', source: 'react.dev' },
        ],
        videos: [
            { title: 'useContext — simply explained', url: 'https://www.youtube.com/watch?v=HYKDUF8X3qI', videoId: 'HYKDUF8X3qI' },
            { title: 'Learn useContext in 13 minutes', url: 'https://www.youtube.com/watch?v=5LrDIWkK_Bc', videoId: '5LrDIWkK_Bc' },
            { title: 'React Context API tutorial', url: 'https://www.youtube.com/watch?v=bJMwH1FWSmU', videoId: 'bJMwH1FWSmU' },
        ],
    },
    'usememo-usecallback-performance-hooks': {
        articles: [
            { title: 'useMemo — API reference', url: 'https://react.dev/reference/react/useMemo', source: 'react.dev' },
            { title: 'useCallback — API reference', url: 'https://react.dev/reference/react/useCallback', source: 'react.dev' },
        ],
        videos: [
            { title: 'useCallback, useMemo & React.memo explained', url: 'https://www.youtube.com/watch?v=x10C19dWCKo', videoId: 'x10C19dWCKo' },
            { title: 'useMemo and useCallback', url: 'https://www.youtube.com/watch?v=JGtVj_P9XEE', videoId: 'JGtVj_P9XEE' },
            { title: 'useMemo vs React.memo vs useCallback', url: 'https://www.youtube.com/watch?v=GYT2TetMLbE', videoId: 'GYT2TetMLbE' },
        ],
    },
    'custom-hooks-building-reusable-logic': {
        articles: [
            { title: 'Reusing Logic with Custom Hooks', url: 'https://react.dev/learn/reusing-logic-with-custom-hooks', source: 'react.dev' },
        ],
        videos: [
            { title: 'Custom React hook in 12 minutes', url: 'https://www.youtube.com/watch?v=h2fh_pdISeI', videoId: 'h2fh_pdISeI' },
            { title: 'Making a custom hook', url: 'https://www.youtube.com/watch?v=Jl4q2cccwf0', videoId: 'Jl4q2cccwf0' },
            { title: 'Custom hooks — deep dive', url: 'https://www.youtube.com/watch?v=l-s9MgoMwTI', videoId: 'l-s9MgoMwTI' },
        ],
    },
    'react-memo-purecomponent-re-render-prevention': {
        articles: [
            { title: 'memo — API reference', url: 'https://react.dev/reference/react/memo', source: 'react.dev' },
            { title: 'PureComponent — API reference', url: 'https://react.dev/reference/react/PureComponent', source: 'react.dev' },
        ],
        videos: [
            { title: 'Preventing re-renders with React.memo', url: 'https://www.youtube.com/watch?v=feEY3Qajrwg', videoId: 'feEY3Qajrwg' },
            { title: 'useMemo & useCallback do NOT prevent re-renders', url: 'https://www.youtube.com/watch?v=HA96JzJ_G1A', videoId: 'HA96JzJ_G1A' },
            { title: 'Optimising with React.memo', url: 'https://www.youtube.com/watch?v=2woSmgfUjC8', videoId: '2woSmgfUjC8' },
        ],
    },
    'uselayouteffect-vs-useeffect': {
        articles: [
            { title: 'useLayoutEffect — API reference', url: 'https://react.dev/reference/react/useLayoutEffect', source: 'react.dev' },
            { title: 'useEffect — API reference', url: 'https://react.dev/reference/react/useEffect', source: 'react.dev' },
        ],
        videos: [
            { title: 'useLayoutEffect vs useEffect', url: 'https://www.youtube.com/watch?v=pHxQtHwcT-s', videoId: 'pHxQtHwcT-s' },
            { title: 'useLayoutEffect vs useEffect — which is better?', url: 'https://www.youtube.com/watch?v=sRDUOd1IkS8', videoId: 'sRDUOd1IkS8' },
            { title: 'The difference, in depth', url: 'https://www.youtube.com/watch?v=6jd7d1FfEW0', videoId: '6jd7d1FfEW0' },
        ],
    },

    // ── Chapter 3 · Routing & Navigation ──
    'react-router-complete-guide': {
        articles: [
            { title: 'React Router — Routing', url: 'https://reactrouter.com/start/library/routing', source: 'reactrouter.com' },
            { title: 'React Router — home & docs', url: 'https://reactrouter.com', source: 'reactrouter.com' },
        ],
        videos: [
            { title: 'React Router v6 in 45 minutes', url: 'https://www.youtube.com/watch?v=Ul3y1LXxzdU', videoId: 'Ul3y1LXxzdU' },
            { title: 'A complete guide to routing in React', url: 'https://www.youtube.com/watch?v=OspIifDD0pk', videoId: 'OspIifDD0pk' },
            { title: 'React Router 6 for beginners', url: 'https://www.youtube.com/watch?v=59IXY5IDrBA', videoId: '59IXY5IDrBA' },
        ],
    },
    'protected-routes-authentication-flow': {
        articles: [
            { title: 'React Router — Routing basics', url: 'https://reactrouter.com/start/library/routing', source: 'reactrouter.com' },
            { title: 'React Router — home & docs', url: 'https://reactrouter.com', source: 'reactrouter.com' },
        ],
        videos: [
            { title: 'Protected routes & auth with React Router v6', url: 'https://www.youtube.com/watch?v=q94v5AhgrW4', videoId: 'q94v5AhgrW4' },
            { title: 'Authentication and protected routes', url: 'https://www.youtube.com/watch?v=X8eAbu1RWZ4', videoId: 'X8eAbu1RWZ4' },
            { title: 'Private & protected routes (v6)', url: 'https://www.youtube.com/watch?v=9RfaG0IzccE', videoId: '9RfaG0IzccE' },
        ],
    },
    'code-splitting-lazy-loading-routes': {
        articles: [
            { title: 'lazy — API reference', url: 'https://react.dev/reference/react/lazy', source: 'react.dev' },
            { title: 'Suspense — API reference', url: 'https://react.dev/reference/react/Suspense', source: 'react.dev' },
        ],
        videos: [
            { title: 'Lazy loading & code splitting with React Router', url: 'https://www.youtube.com/watch?v=LTrlE-f8nPI', videoId: 'LTrlE-f8nPI' },
            { title: 'Code splitting in React — performance', url: 'https://www.youtube.com/watch?v=IBrmsyy9R94', videoId: 'IBrmsyy9R94' },
            { title: 'Route-based code splitting & lazy loading', url: 'https://www.youtube.com/watch?v=lkOWOYPCbxA', videoId: 'lkOWOYPCbxA' },
        ],
    },

    // ── Chapter 4 · State Management ──
    'state-management-when-why-you-need-it': {
        articles: [
            { title: 'Managing State', url: 'https://react.dev/learn/managing-state', source: 'react.dev' },
            { title: 'Choosing the State Structure', url: 'https://react.dev/learn/choosing-the-state-structure', source: 'react.dev' },
        ],
        videos: [
            { title: 'React state management', url: 'https://www.youtube.com/watch?v=-bEzt5ISACA', videoId: '-bEzt5ISACA' },
            { title: 'State management: the beginner’s guide', url: 'https://www.youtube.com/watch?v=U-uD-DNsKgU', videoId: 'U-uD-DNsKgU' },
            { title: 'The state of state management in React', url: 'https://www.youtube.com/watch?v=BhQYZmaxTCM', videoId: 'BhQYZmaxTCM' },
        ],
    },
    'redux-from-scratch-core-principles': {
        articles: [
            { title: 'Redux Fundamentals — Overview', url: 'https://redux.js.org/tutorials/fundamentals/part-1-overview', source: 'redux.js.org' },
            { title: 'Redux — Getting Started', url: 'https://redux.js.org/introduction/getting-started', source: 'redux.js.org' },
        ],
        videos: [
            { title: 'Redux tutorial for beginners', url: 'https://www.youtube.com/watch?v=wl_t7b7u0d4', videoId: 'wl_t7b7u0d4' },
            { title: 'Introduction to Redux — what is Redux?', url: 'https://www.youtube.com/watch?v=hMIGj1690QA', videoId: 'hMIGj1690QA' },
            { title: 'Redux — beginner to advanced', url: 'https://www.youtube.com/watch?v=zrs7u6bdbUw', videoId: 'zrs7u6bdbUw' },
        ],
    },
    'redux-toolkit-the-modern-way': {
        articles: [
            { title: 'Redux Toolkit — official docs', url: 'https://redux-toolkit.js.org/', source: 'redux-toolkit.js.org' },
            { title: 'Redux Toolkit — Quick Start', url: 'https://redux.js.org/tutorials/quick-start', source: 'redux.js.org' },
        ],
        videos: [
            { title: 'Redux Toolkit — complete tutorial', url: 'https://www.youtube.com/watch?v=5yEG6GhoJBs', videoId: '5yEG6GhoJBs' },
            { title: 'Learn Redux Toolkit with a project', url: 'https://www.youtube.com/watch?v=A_vRvDAZuOo', videoId: 'A_vRvDAZuOo' },
            { title: 'React 18 with Redux Toolkit', url: 'https://www.youtube.com/watch?v=2-crBg6wpp0', videoId: '2-crBg6wpp0' },
        ],
    },
    'redux-middleware-side-effects': {
        articles: [
            { title: 'Redux Middleware — concepts', url: 'https://redux.js.org/understanding/history-and-design/middleware', source: 'redux.js.org' },
            { title: 'Redux Toolkit — Quick Start (thunks)', url: 'https://redux.js.org/tutorials/quick-start', source: 'redux.js.org' },
        ],
        videos: [
            { title: 'Redux middleware: thunk, saga & custom', url: 'https://www.youtube.com/watch?v=hVANZEQJFI4', videoId: 'hVANZEQJFI4' },
            { title: 'What is Redux Thunk middleware?', url: 'https://www.youtube.com/watch?v=1MoArYk7BA4', videoId: '1MoArYk7BA4' },
            { title: 'Redux Thunk crash course', url: 'https://www.youtube.com/watch?v=lSSQ1r8zgtY', videoId: 'lSSQ1r8zgtY' },
        ],
    },
    'context-api-vs-redux-the-real-answer': {
        articles: [
            { title: 'Passing Data Deeply with Context', url: 'https://react.dev/learn/passing-data-deeply-with-context', source: 'react.dev' },
            { title: 'Redux FAQ — When should I use Redux?', url: 'https://redux.js.org/faq/general', source: 'redux.js.org' },
        ],
        videos: [
            { title: 'Redux vs Context API — which one?', url: 'https://www.youtube.com/watch?v=n0Cvo2MrJbk', videoId: 'n0Cvo2MrJbk' },
            { title: 'Redux vs Context API — interview take', url: 'https://www.youtube.com/watch?v=hh4Jxd9ZZ5M', videoId: 'hh4Jxd9ZZ5M' },
            { title: 'React Context vs Redux — who wins?', url: 'https://www.youtube.com/watch?v=OvM4hIxrqAw', videoId: 'OvM4hIxrqAw' },
        ],
    },

    // ── Chapter 5 · Performance Optimization ──
    'react-performance-the-complete-toolkit': {
        articles: [
            { title: 'memo — API reference', url: 'https://react.dev/reference/react/memo', source: 'react.dev' },
            { title: 'useMemo — API reference', url: 'https://react.dev/reference/react/useMemo', source: 'react.dev' },
        ],
        videos: [
            { title: 'Best ways to optimize modern React', url: 'https://www.youtube.com/watch?v=LuQ8VWh6eYE', videoId: 'LuQ8VWh6eYE' },
            { title: '8 React performance techniques', url: 'https://www.youtube.com/watch?v=CaShN6mCJB0', videoId: 'CaShN6mCJB0' },
            { title: 'Ultimate React performance guide', url: 'https://www.youtube.com/watch?v=G8Mk6lsSOcw', videoId: 'G8Mk6lsSOcw' },
        ],
    },
    'code-splitting-lazy-loading-suspense-deep-dive': {
        articles: [
            { title: 'lazy — API reference', url: 'https://react.dev/reference/react/lazy', source: 'react.dev' },
            { title: 'Suspense — API reference', url: 'https://react.dev/reference/react/Suspense', source: 'react.dev' },
        ],
        videos: [
            { title: 'React lazy loading explained (lazy + Suspense)', url: 'https://www.youtube.com/watch?v=wtW06D5MYbg', videoId: 'wtW06D5MYbg' },
            { title: 'Lazy loading & Suspense for performance', url: 'https://www.youtube.com/watch?v=MS2kbyWOXI8', videoId: 'MS2kbyWOXI8' },
            { title: 'Code splitting & Suspense', url: 'https://www.youtube.com/watch?v=m1XU0AkPoPU', videoId: 'm1XU0AkPoPU' },
        ],
    },
    'virtualization-rendering-10-000-rows': {
        articles: [
            { title: 'react-window (windowing library)', url: 'https://github.com/bvaughn/react-window', source: 'github.com' },
            { title: 'TanStack Virtual', url: 'https://github.com/TanStack/virtual', source: 'github.com' },
        ],
        videos: [
            { title: 'Render large lists with react-window', url: 'https://www.youtube.com/watch?v=8glwCms18rQ', videoId: '8glwCms18rQ' },
            { title: 'Efficiently render 100,000 rows', url: 'https://www.youtube.com/watch?v=MFtvsEe2rUA', videoId: 'MFtvsEe2rUA' },
            { title: 'Build a virtualized list from scratch', url: 'https://www.youtube.com/watch?v=Yz4eK-4LKXg', videoId: 'Yz4eK-4LKXg' },
        ],
    },
    'memoization-strategies-when-not-to-optimize': {
        articles: [
            { title: 'useMemo — “should you add it everywhere?”', url: 'https://react.dev/reference/react/useMemo', source: 'react.dev' },
            { title: 'memo — API reference', url: 'https://react.dev/reference/react/memo', source: 'react.dev' },
        ],
        videos: [
            { title: 'STOP using React.memo (when not to)', url: 'https://www.youtube.com/watch?v=N_4IjS8xOU4', videoId: 'N_4IjS8xOU4' },
            { title: 'When NOT to use React.memo', url: 'https://www.youtube.com/watch?v=qGGu46ZoMqQ', videoId: 'qGGu46ZoMqQ' },
            { title: 'Mastering memoization (advanced)', url: 'https://www.youtube.com/watch?v=huBxeruVnAM', videoId: 'huBxeruVnAM' },
        ],
    },
    'web-vitals-tree-shaking-bundle-optimization': {
        articles: [
            { title: 'Web Vitals', url: 'https://web.dev/articles/vitals', source: 'web.dev' },
            { title: 'Tree shaking (MDN glossary)', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking', source: 'MDN' },
        ],
        videos: [
            { title: 'Tree shaking — optimize bundle size', url: 'https://www.youtube.com/watch?v=MUSoj2JcD4A', videoId: 'MUSoj2JcD4A' },
            { title: 'Perfect web vitals (Next.js)', url: 'https://www.youtube.com/watch?v=Sk2XRK3tO-A', videoId: 'Sk2XRK3tO-A' },
            { title: 'Make your JS bundle smaller', url: 'https://www.youtube.com/watch?v=kwUfeWe7DCw', videoId: 'kwUfeWe7DCw' },
        ],
    },

    // ── Chapter 6 · Design Patterns in React ──
    'container-presentational-pattern': {
        articles: [
            { title: 'Thinking in React (split UI)', url: 'https://react.dev/learn/thinking-in-react', source: 'react.dev' },
        ],
        videos: [
            { title: 'Presentational & container components', url: 'https://www.youtube.com/watch?v=NazjKgJp7sQ', videoId: 'NazjKgJp7sQ' },
            { title: 'Container & presentational — beginner friendly', url: 'https://www.youtube.com/watch?v=L_5pikTGYPA', videoId: 'L_5pikTGYPA' },
            { title: 'Container/presentational — step by step', url: 'https://www.youtube.com/watch?v=P6lEYiXq_v4', videoId: 'P6lEYiXq_v4' },
        ],
    },
    'higher-order-components-hoc': {
        articles: [
            { title: 'Higher-Order Components (docs)', url: 'https://legacy.reactjs.org/docs/higher-order-components.html', source: 'reactjs.org' },
        ],
        videos: [
            { title: 'HOC in 30 minutes for beginners', url: 'https://www.youtube.com/watch?v=tsCoBd7xSK8', videoId: 'tsCoBd7xSK8' },
            { title: 'Learn HOC in 10 minutes', url: 'https://www.youtube.com/watch?v=J5P0q7EROfw', videoId: 'J5P0q7EROfw' },
            { title: 'HOC as a design pattern', url: 'https://www.youtube.com/watch?v=ZeNHbHtKNFo', videoId: 'ZeNHbHtKNFo' },
        ],
    },
    'render-props-pattern': {
        articles: [
            { title: 'Render Props (docs)', url: 'https://legacy.reactjs.org/docs/render-props.html', source: 'reactjs.org' },
        ],
        videos: [
            { title: 'When to use the render props pattern', url: 'https://www.youtube.com/watch?v=SePeEFeFby8', videoId: 'SePeEFeFby8' },
            { title: 'Render props made simple', url: 'https://www.youtube.com/watch?v=3IdCQ7QAs38', videoId: '3IdCQ7QAs38' },
            { title: 'Render prop pattern in React', url: 'https://www.youtube.com/watch?v=uCDm0tIEG6U', videoId: 'uCDm0tIEG6U' },
        ],
    },
    'compound-component-pattern': {
        articles: [
            { title: 'Compound Pattern (patterns.dev)', url: 'https://www.patterns.dev/react/compound-pattern', source: 'patterns.dev' },
        ],
        videos: [
            { title: 'Compound components pattern', url: 'https://www.youtube.com/watch?v=PPOKvugfi98', videoId: 'PPOKvugfi98' },
            { title: 'The magic of compound components', url: 'https://www.youtube.com/watch?v=WSM2MpJIwFg', videoId: 'WSM2MpJIwFg' },
            { title: 'Compound components (design patterns)', url: 'https://www.youtube.com/watch?v=N_WgBU3S9W8', videoId: 'N_WgBU3S9W8' },
        ],
    },
    'solid-principles-in-react': {
        articles: [
            { title: 'SOLID principles (overview)', url: 'https://en.wikipedia.org/wiki/SOLID', source: 'wikipedia.org' },
            { title: 'Thinking in React', url: 'https://react.dev/learn/thinking-in-react', source: 'react.dev' },
        ],
        videos: [
            { title: 'React clean code — SOLID examples', url: 'https://www.youtube.com/watch?v=t_h_A6RkM7A', videoId: 't_h_A6RkM7A' },
            { title: 'The right way to write React (SOLID)', url: 'https://www.youtube.com/watch?v=MSq_DCRxOxw', videoId: 'MSq_DCRxOxw' },
            { title: 'SOLID for interviews', url: 'https://www.youtube.com/watch?v=GFtKI2BQOJY', videoId: 'GFtKI2BQOJY' },
        ],
    },
    'provider-pattern-composition-pattern': {
        articles: [
            { title: 'Passing Data Deeply with Context', url: 'https://react.dev/learn/passing-data-deeply-with-context', source: 'react.dev' },
            { title: 'Passing Props (composition & children)', url: 'https://react.dev/learn/passing-props-to-a-component', source: 'react.dev' },
        ],
        videos: [
            { title: 'The Provider pattern', url: 'https://www.youtube.com/watch?v=xPlIaTJTsOw', videoId: 'xPlIaTJTsOw' },
            { title: 'Composition pattern in React', url: 'https://www.youtube.com/watch?v=GBh59sRi8qQ', videoId: 'GBh59sRi8qQ' },
            { title: 'Context API & Provider pattern', url: 'https://www.youtube.com/watch?v=Kdxkn7HM26s', videoId: 'Kdxkn7HM26s' },
        ],
    },

    // ── Chapter 7 · API Integration & Real-World Patterns ──
    'fetching-data-fetch-vs-axios-vs-react-query': {
        articles: [
            { title: 'TanStack Query (React Query)', url: 'https://github.com/TanStack/query', source: 'github.com' },
            { title: 'Axios (HTTP client)', url: 'https://github.com/axios/axios', source: 'github.com' },
        ],
        videos: [
            { title: 'Data fetching in React — every way', url: 'https://www.youtube.com/watch?v=RoYUlfbSChY', videoId: 'RoYUlfbSChY' },
            { title: 'Axios vs fetch — full comparison', url: 'https://www.youtube.com/watch?v=y2XhLTz7Mio', videoId: 'y2XhLTz7Mio' },
            { title: 'Axios, fetch & React Query in practice', url: 'https://www.youtube.com/watch?v=GOpkIVbeQAg', videoId: 'GOpkIVbeQAg' },
        ],
    },
    'loading-error-empty-states': {
        articles: [
            { title: 'Suspense — API reference', url: 'https://react.dev/reference/react/Suspense', source: 'react.dev' },
            { title: 'TanStack Query — request states', url: 'https://github.com/TanStack/query', source: 'github.com' },
        ],
        videos: [
            { title: 'Loading, error, empty & success states', url: 'https://www.youtube.com/watch?v=_0iFVd_bC9w', videoId: '_0iFVd_bC9w' },
            { title: 'A better way to do loading states', url: 'https://www.youtube.com/watch?v=V0VfR0eaz98', videoId: 'V0VfR0eaz98' },
            { title: 'Rethinking isLoading in data fetching', url: 'https://www.youtube.com/watch?v=o4bcGpAtbgE', videoId: 'o4bcGpAtbgE' },
        ],
    },
    'authentication-jwt-in-react': {
        articles: [
            { title: 'Introduction to JWT', url: 'https://jwt.io/introduction', source: 'jwt.io' },
            { title: 'React Router — home & docs', url: 'https://reactrouter.com', source: 'reactrouter.com' },
        ],
        videos: [
            { title: 'JWT auth: access & refresh tokens', url: 'https://www.youtube.com/watch?v=AcYF18oGn6Y', videoId: 'AcYF18oGn6Y' },
            { title: 'JWT authentication (React + Node)', url: 'https://www.youtube.com/watch?v=KgXT63wPMPc', videoId: 'KgXT63wPMPc' },
            { title: 'Storing a JWT in a cookie', url: 'https://www.youtube.com/watch?v=Avfa7RrPx_Q', videoId: 'Avfa7RrPx_Q' },
        ],
    },
    'debouncing-throttling': {
        articles: [
            { title: 'Debouncing & Throttling explained', url: 'https://css-tricks.com/debouncing-throttling-explained-examples/', source: 'css-tricks.com' },
            { title: 'Lodash — debounce & throttle', url: 'https://lodash.com/docs', source: 'lodash.com' },
        ],
        videos: [
            { title: 'Debounce & throttle in 16 minutes', url: 'https://www.youtube.com/watch?v=cjIswDCKgu0', videoId: 'cjIswDCKgu0' },
            { title: 'Throttling & debouncing with examples', url: 'https://www.youtube.com/watch?v=E9XcoEMu1lk', videoId: 'E9XcoEMu1lk' },
            { title: 'Fastest debounce & throttle explanation', url: 'https://www.youtube.com/watch?v=mPYDvHxInOU', videoId: 'mPYDvHxInOU' },
        ],
    },

    // ── Chapter 8 · Testing in React ──
    'testing-fundamentals-what-why-and-how': {
        articles: [
            { title: 'React Testing Library — intro', url: 'https://testing-library.com/docs/react-testing-library/intro', source: 'testing-library.com' },
            { title: 'Jest — official docs', url: 'https://jestjs.io', source: 'jestjs.io' },
        ],
        videos: [
            { title: 'React testing for beginners — start here', url: 'https://www.youtube.com/watch?v=8Xwq35cPwYg', videoId: '8Xwq35cPwYg' },
            { title: 'Intro to React testing (Jest + RTL)', url: 'https://www.youtube.com/watch?v=ZmVBCpefQe8', videoId: 'ZmVBCpefQe8' },
            { title: 'React unit testing crash course', url: 'https://www.youtube.com/watch?v=iIMaFgeNzc8', videoId: 'iIMaFgeNzc8' },
        ],
    },
    'react-testing-library-practical-guide': {
        articles: [
            { title: 'React Testing Library — intro', url: 'https://testing-library.com/docs/react-testing-library/intro', source: 'testing-library.com' },
            { title: 'Which query should I use?', url: 'https://testing-library.com/docs/queries/about', source: 'testing-library.com' },
        ],
        videos: [
            { title: 'React Testing Library — introduction', url: 'https://www.youtube.com/watch?v=7dTTFW7yACQ', videoId: '7dTTFW7yACQ' },
            { title: 'RTL & Jest crash course', url: 'https://www.youtube.com/watch?v=Flo268xRpV0', videoId: 'Flo268xRpV0' },
            { title: 'Start testing in ReactJS', url: 'https://www.youtube.com/watch?v=jrSE7XgGwRQ', videoId: 'jrSE7XgGwRQ' },
        ],
    },
    'mocking-api-calls-hooks-context': {
        articles: [
            { title: 'Mock Service Worker (MSW)', url: 'https://mswjs.io', source: 'mswjs.io' },
            { title: 'React Testing Library — intro', url: 'https://testing-library.com/docs/react-testing-library/intro', source: 'testing-library.com' },
        ],
        videos: [
            { title: 'Mock API calls with MSW', url: 'https://www.youtube.com/watch?v=oMv2eAGWtZU', videoId: 'oMv2eAGWtZU' },
            { title: 'Mock a REST API with Jest & RTL', url: 'https://www.youtube.com/watch?v=k0LPNKWCxx0', videoId: 'k0LPNKWCxx0' },
            { title: 'Mocking API calls (Jest & MSW)', url: 'https://www.youtube.com/watch?v=P36kXz9ivMw', videoId: 'P36kXz9ivMw' },
        ],
    },

    // ── Chapter 9 · Scenario-Based & Behavioral ──
    'scenario-this-react-app-is-slow-how-do-you-fix-it': {
        articles: [
            { title: 'memo — API reference', url: 'https://react.dev/reference/react/memo', source: 'react.dev' },
            { title: 'useMemo — API reference', url: 'https://react.dev/reference/react/useMemo', source: 'react.dev' },
        ],
        videos: [
            { title: 'React performance: fix a slow app', url: 'https://www.youtube.com/watch?v=AZ9i3eoyrnE', videoId: 'AZ9i3eoyrnE' },
            { title: 'React performance optimization patterns', url: 'https://www.youtube.com/watch?v=keTcXT145CI', videoId: 'keTcXT145CI' },
            { title: 'Best ways to optimize modern React', url: 'https://www.youtube.com/watch?v=LuQ8VWh6eYE', videoId: 'LuQ8VWh6eYE' },
        ],
    },
    'scenario-design-the-component-architecture-for-this-feature': {
        articles: [
            { title: 'Thinking in React', url: 'https://react.dev/learn/thinking-in-react', source: 'react.dev' },
        ],
        videos: [
            { title: 'Structure your React app: small → large', url: 'https://www.youtube.com/watch?v=QhSXNY8sy_0', videoId: 'QhSXNY8sy_0' },
            { title: 'The architecture of a scalable React app', url: 'https://www.youtube.com/watch?v=qqvJR1tTBbs', videoId: 'qqvJR1tTBbs' },
            { title: '5 React architecture styles', url: 'https://www.youtube.com/watch?v=eoPPTKdXs0U', videoId: 'eoPPTKdXs0U' },
        ],
    },
    'scenario-how-do-you-manage-state-in-a-large-react-app': {
        articles: [
            { title: 'Managing State', url: 'https://react.dev/learn/managing-state', source: 'react.dev' },
            { title: 'Choosing the State Structure', url: 'https://react.dev/learn/choosing-the-state-structure', source: 'react.dev' },
        ],
        videos: [
            { title: 'React state management', url: 'https://www.youtube.com/watch?v=-bEzt5ISACA', videoId: '-bEzt5ISACA' },
            { title: 'State management: the beginner’s guide', url: 'https://www.youtube.com/watch?v=U-uD-DNsKgU', videoId: 'U-uD-DNsKgU' },
            { title: 'The state of state management in React', url: 'https://www.youtube.com/watch?v=BhQYZmaxTCM', videoId: 'BhQYZmaxTCM' },
        ],
    },
    'scenario-walk-me-through-what-happens-when-you-type-a-url-and-see-a-react-page': {
        articles: [
            { title: 'How browsers work (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work', source: 'MDN' },
        ],
        videos: [
            { title: 'What happens when you type a URL?', url: 'https://www.youtube.com/watch?v=AlkDbnbv7dk', videoId: 'AlkDbnbv7dk' },
            { title: 'Typing a URL — the full journey', url: 'https://www.youtube.com/watch?v=3109b5ZyvcU', videoId: '3109b5ZyvcU' },
            { title: 'What happens when a user types a URL', url: 'https://www.youtube.com/watch?v=zp45ysqZTzU', videoId: 'zp45ysqZTzU' },
        ],
    },
    'behavioral-questions-what-interviewers-really-want': {
        articles: [
            { title: 'The STAR method (overview)', url: 'https://en.wikipedia.org/wiki/Situation,_task,_action,_result', source: 'wikipedia.org' },
        ],
        videos: [
            { title: 'SWE behavioral questions (STAR answers)', url: 'https://www.youtube.com/watch?v=ktUHzfvCNs8', videoId: 'ktUHzfvCNs8' },
            { title: 'STAR method for developers', url: 'https://www.youtube.com/watch?v=OMhr7SJCpmQ', videoId: 'OMhr7SJCpmQ' },
            { title: 'STAR method with examples', url: 'https://www.youtube.com/watch?v=dRqN4BuhCHU', videoId: 'dRqN4BuhCHU' },
        ],
    },

    // ── Chapter 10 · Machine Coding ──
    'build-counter-with-usereducer': {
        articles: [{ title: 'useReducer — API reference', url: 'https://react.dev/reference/react/useReducer', source: 'react.dev' }],
        videos: [
            { title: 'Counter with useReducer', url: 'https://www.youtube.com/watch?v=5nB4HfTjPtQ', videoId: '5nB4HfTjPtQ' },
            { title: 'useReducer counter example', url: 'https://www.youtube.com/watch?v=_56V7csSBI8', videoId: '_56V7csSBI8' },
            { title: 'useReducer vs useState (counter)', url: 'https://www.youtube.com/watch?v=8mIz-KJE9YE', videoId: '8mIz-KJE9YE' },
        ],
    },
    'build-dynamic-checkbox-with-select-all': {
        articles: [{ title: '<input> — checkboxes', url: 'https://react.dev/reference/react-dom/components/input', source: 'react.dev' }],
        videos: [
            { title: 'Multiple + select-all checkboxes', url: 'https://www.youtube.com/watch?v=0mJiHsljqsM', videoId: '0mJiHsljqsM' },
            { title: 'Working with checkboxes in React', url: 'https://www.youtube.com/watch?v=WwBu3oykkBs', videoId: 'WwBu3oykkBs' },
            { title: 'Select-all checkbox', url: 'https://www.youtube.com/watch?v=mGV9r0wgCrI', videoId: 'mGV9r0wgCrI' },
        ],
    },
    'build-todo-app-with-crud': {
        articles: [{ title: 'Updating Arrays in State', url: 'https://react.dev/learn/updating-arrays-in-state', source: 'react.dev' }],
        videos: [
            { title: 'React todo list (CRUD)', url: 'https://www.youtube.com/watch?v=Q3EnrxAmLdM', videoId: 'Q3EnrxAmLdM' },
            { title: 'Modern React CRUD todo app', url: 'https://www.youtube.com/watch?v=7u2Rv4HfCYQ', videoId: '7u2Rv4HfCYQ' },
            { title: 'Todo app from scratch (hooks)', url: 'https://www.youtube.com/watch?v=dD0MdMRVHoo', videoId: 'dD0MdMRVHoo' },
        ],
    },
    'build-search-bar-with-debounced-api-calls': {
        articles: [{ title: 'Debouncing & Throttling explained', url: 'https://css-tricks.com/debouncing-throttling-explained-examples/', source: 'css-tricks.com' }],
        videos: [
            { title: 'Debounced search input + API call', url: 'https://www.youtube.com/watch?v=MHm-2YmWEek', videoId: 'MHm-2YmWEek' },
            { title: 'Debounce input — stop spamming your API', url: 'https://www.youtube.com/watch?v=n52A60Z7Ha0', videoId: 'n52A60Z7Ha0' },
            { title: 'Debounced input with a custom hook', url: 'https://www.youtube.com/watch?v=Wf7INnelvkI', videoId: 'Wf7INnelvkI' },
        ],
    },
    'build-infinite-scroll-list': {
        articles: [{ title: 'Intersection Observer API (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API', source: 'MDN' }],
        videos: [
            { title: 'Easiest way to infinite scroll', url: 'https://www.youtube.com/watch?v=nR85ayDEVBc', videoId: 'nR85ayDEVBc' },
            { title: 'Infinite scrolling — machine coding round', url: 'https://www.youtube.com/watch?v=MsHbwbeJR8g', videoId: 'MsHbwbeJR8g' },
            { title: 'Infinite scroll — full tutorial', url: 'https://www.youtube.com/watch?v=JWlOcDus_rs', videoId: 'JWlOcDus_rs' },
        ],
    },
    'build-star-rating-component': {
        articles: [{ title: 'State: A Component’s Memory', url: 'https://react.dev/learn/state-a-components-memory', source: 'react.dev' }],
        videos: [
            { title: 'Star rating component — step by step', url: 'https://www.youtube.com/watch?v=MTR0WFKWH78', videoId: 'MTR0WFKWH78' },
            { title: 'Star rating (interview question)', url: 'https://www.youtube.com/watch?v=3X8aebi9eA0', videoId: '3X8aebi9eA0' },
            { title: 'Create a star rating component', url: 'https://www.youtube.com/watch?v=9sSBMF8K7sY', videoId: '9sSBMF8K7sY' },
        ],
    },
    'build-accordion-faq-component': {
        articles: [{ title: 'Conditional Rendering', url: 'https://react.dev/learn/conditional-rendering', source: 'react.dev' }],
        videos: [
            { title: 'Build an accordion from scratch', url: 'https://www.youtube.com/watch?v=Y6AfeQIgtVw', videoId: 'Y6AfeQIgtVw' },
            { title: 'Accordion — machine coding', url: 'https://www.youtube.com/watch?v=D8CY_Lhv6rg', videoId: 'D8CY_Lhv6rg' },
            { title: 'React accordion from scratch', url: 'https://www.youtube.com/watch?v=bGpZrr32ECw', videoId: 'bGpZrr32ECw' },
        ],
    },
    'build-nested-circles-recursive-component': {
        articles: [{ title: 'Rendering Lists (recursion)', url: 'https://react.dev/learn/rendering-lists', source: 'react.dev' }],
        videos: [
            { title: 'Recursive component — how & why', url: 'https://www.youtube.com/watch?v=FR07idGIMAE', videoId: 'FR07idGIMAE' },
            { title: 'Build a recursive React component', url: 'https://www.youtube.com/watch?v=6UU2Ey4KZr8', videoId: '6UU2Ey4KZr8' },
            { title: 'Recursive components in React', url: 'https://www.youtube.com/watch?v=ZGqdrNZroYg', videoId: 'ZGqdrNZroYg' },
        ],
    },
    'build-multi-step-form-with-validation': {
        articles: [
            { title: 'React Hook Form', url: 'https://react-hook-form.com', source: 'react-hook-form.com' },
            { title: 'Sharing State Between Components', url: 'https://react.dev/learn/sharing-state-between-components', source: 'react.dev' },
        ],
        videos: [
            { title: 'Create a multi-step form in React', url: 'https://www.youtube.com/watch?v=bdeQMFdf-hE', videoId: 'bdeQMFdf-hE' },
            { title: 'Multi-step form with validation', url: 'https://www.youtube.com/watch?v=FqThW74O0fQ', videoId: 'FqThW74O0fQ' },
            { title: 'Multi-step form with react-hook-form', url: 'https://www.youtube.com/watch?v=Wlz2cy33bMU', videoId: 'Wlz2cy33bMU' },
        ],
    },
    'build-modal-dialog-component': {
        articles: [{ title: 'createPortal — for modals', url: 'https://react.dev/reference/react-dom/createPortal', source: 'react.dev' }],
        videos: [
            { title: 'Reusable modal component with hooks', url: 'https://www.youtube.com/watch?v=46F4S-m-XEQ', videoId: '46F4S-m-XEQ' },
            { title: 'Accessible modals with <dialog>', url: 'https://www.youtube.com/watch?v=5zrwR4vqw5M', videoId: '5zrwR4vqw5M' },
            { title: 'Best way to add popup modals', url: 'https://www.youtube.com/watch?v=FSY2A0vzwko', videoId: 'FSY2A0vzwko' },
        ],
    },
    'build-custom-dropdown-select': {
        articles: [{ title: 'Manipulating the DOM with Refs (click-outside)', url: 'https://react.dev/learn/manipulating-the-dom-with-refs', source: 'react.dev' }],
        videos: [
            { title: 'Build a custom select/dropdown', url: 'https://www.youtube.com/watch?v=n_VdjuKvQ_Y', videoId: 'n_VdjuKvQ_Y' },
            { title: 'Custom dropdown menu component', url: 'https://www.youtube.com/watch?v=t8JK5bVoVBw', videoId: 't8JK5bVoVBw' },
            { title: 'React custom dropdown menu', url: 'https://www.youtube.com/watch?v=Lg5kr69CzpE', videoId: 'Lg5kr69CzpE' },
        ],
    },
    'build-tic-tac-toe-game': {
        articles: [{ title: 'Tutorial: Tic-Tac-Toe (official)', url: 'https://react.dev/learn/tutorial-tic-tac-toe', source: 'react.dev' }],
        videos: [
            { title: 'Build tic-tac-toe in React', url: 'https://www.youtube.com/watch?v=4Gt_YyGf6B0', videoId: '4Gt_YyGf6B0' },
            { title: 'Master React by building tic-tac-toe', url: 'https://www.youtube.com/watch?v=ZF4hD1ffitU', videoId: 'ZF4hD1ffitU' },
            { title: 'Tic-tac-toe — beginners tutorial', url: 'https://www.youtube.com/watch?v=c8dXnuVwmA8', videoId: 'c8dXnuVwmA8' },
        ],
    },
    'build-pagination-component': {
        articles: [{ title: 'Rendering Lists', url: 'https://react.dev/learn/rendering-lists', source: 'react.dev' }],
        videos: [
            { title: 'Make pagination in React', url: 'https://www.youtube.com/watch?v=ovG1swpy_RE', videoId: 'ovG1swpy_RE' },
            { title: 'Pagination without any libraries', url: 'https://www.youtube.com/watch?v=jmNHcW_oszg', videoId: 'jmNHcW_oszg' },
            { title: 'Pagination from scratch', url: 'https://www.youtube.com/watch?v=6DtBw3PaeHs', videoId: '6DtBw3PaeHs' },
        ],
    },
    'build-shopping-cart-with-context': {
        articles: [{ title: 'Scaling Up with Reducer and Context', url: 'https://react.dev/learn/scaling-up-with-reducer-and-context', source: 'react.dev' }],
        videos: [
            { title: 'Shopping cart with Context + useReducer', url: 'https://www.youtube.com/watch?v=uMBgUUPkgUY', videoId: 'uMBgUUPkgUY' },
            { title: 'Shopping cart (Context API + useReducer)', url: 'https://www.youtube.com/watch?v=HptuMAUaNGk', videoId: 'HptuMAUaNGk' },
            { title: 'Context API shopping cart (hooks)', url: 'https://www.youtube.com/watch?v=hhAT0CJDWqM', videoId: 'hhAT0CJDWqM' },
        ],
    },
    'machine-coding-round-strategy-setup': {
        articles: [
            { title: 'Thinking in React (how to approach)', url: 'https://react.dev/learn/thinking-in-react', source: 'react.dev' },
            { title: 'Tutorial: Tic-Tac-Toe (practice)', url: 'https://react.dev/learn/tutorial-tic-tac-toe', source: 'react.dev' },
        ],
        videos: [
            { title: 'React machine coding interview prep', url: 'https://www.youtube.com/watch?v=v-DvIojwn3s', videoId: 'v-DvIojwn3s' },
            { title: 'React machine coding round questions', url: 'https://www.youtube.com/watch?v=M7S0z544x4U', videoId: 'M7S0z544x4U' },
            { title: 'Machine coding — a worked example', url: 'https://www.youtube.com/watch?v=84o1kuPuYdU', videoId: '84o1kuPuYdU' },
        ],
    },

    /* ═══════════ JavaScript Interview Kit ═══════════ */
    'tricky-javascript-questions': {
        articles: [
            { title: 'JavaScript output questions (repo)', url: 'https://github.com/lydiahallie/javascript-questions', source: 'github.com' },
            { title: 'The Modern JavaScript Tutorial', url: 'https://javascript.info', source: 'javascript.info' },
        ],
        videos: [
            { title: 'Solving output-based JS questions', url: 'https://www.youtube.com/watch?v=UXGwPCOkg6M', videoId: 'UXGwPCOkg6M' },
            { title: 'Top 20 output-based questions', url: 'https://www.youtube.com/watch?v=cmkSBoUAbCg', videoId: 'cmkSBoUAbCg' },
            { title: 'JS output tricky questions', url: 'https://www.youtube.com/watch?v=moNpNrd41jk', videoId: 'moNpNrd41jk' },
        ],
    },
    'polyfill-coding-questions': {
        articles: [
            { title: 'Polyfill (MDN glossary)', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Polyfill', source: 'MDN' },
            { title: 'JS interview questions (repo)', url: 'https://github.com/sudheerj/javascript-interview-questions', source: 'github.com' },
        ],
        videos: [
            { title: '12 polyfills (bind, reduce, map…)', url: 'https://www.youtube.com/watch?v=Th3rZjfKKhI', videoId: 'Th3rZjfKKhI' },
            { title: 'Polyfills — interview questions', url: 'https://www.youtube.com/watch?v=YMPYk-P7UXI', videoId: 'YMPYk-P7UXI' },
            { title: 'map, filter & reduce polyfills', url: 'https://www.youtube.com/watch?v=dGq0gi0wv64', videoId: 'dGq0gi0wv64' },
        ],
    },
    'js-and-react-patterns-and-solid-principles': {
        articles: [
            { title: 'Patterns.dev', url: 'https://www.patterns.dev', source: 'patterns.dev' },
            { title: 'SOLID principles (overview)', url: 'https://en.wikipedia.org/wiki/SOLID', source: 'wikipedia.org' },
        ],
        videos: [
            { title: 'JS design patterns for beginners', url: 'https://www.youtube.com/watch?v=kslfZCbr_Fg', videoId: 'kslfZCbr_Fg' },
            { title: '20 JavaScript design patterns', url: 'https://www.youtube.com/watch?v=RIkxzDLuT4E', videoId: 'RIkxzDLuT4E' },
            { title: 'Singleton pattern in 10 minutes', url: 'https://www.youtube.com/watch?v=CWkD2kP6Wug', videoId: 'CWkD2kP6Wug' },
        ],
    },
    'javascript-interview-preparation-questions': {
        articles: [
            { title: 'JS interview questions (repo)', url: 'https://github.com/sudheerj/javascript-interview-questions', source: 'github.com' },
            { title: 'The Modern JavaScript Tutorial', url: 'https://javascript.info', source: 'javascript.info' },
        ],
        videos: [
            { title: 'Top 100 JavaScript interview questions', url: 'https://www.youtube.com/watch?v=AUTO7ALJk2U', videoId: 'AUTO7ALJk2U' },
            { title: '50 JS interview questions in 1 hour', url: 'https://www.youtube.com/watch?v=qTszFuibDEg', videoId: 'qTszFuibDEg' },
            { title: 'Concepts you must know', url: 'https://www.youtube.com/watch?v=vMxmul9EPI8', videoId: 'vMxmul9EPI8' },
        ],
    },
    'data-types-and-coercion': {
        articles: [
            { title: 'JavaScript data types (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures', source: 'MDN' },
            { title: 'Equality comparisons & sameness', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness', source: 'MDN' },
        ],
        videos: [
            { title: 'Type conversion & coercion', url: 'https://www.youtube.com/watch?v=mL-DWRZpOxY', videoId: 'mL-DWRZpOxY' },
            { title: 'Coercion & type conversion, simplified', url: 'https://www.youtube.com/watch?v=00vjwv2BJqE', videoId: '00vjwv2BJqE' },
            { title: 'How type coercion works', url: 'https://www.youtube.com/watch?v=XWNq7XJuwoo', videoId: 'XWNq7XJuwoo' },
        ],
    },
    'scope-hoisting-and-tdz': {
        articles: [
            { title: 'Hoisting (MDN glossary)', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Hoisting', source: 'MDN' },
            { title: 'let & the temporal dead zone', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let', source: 'MDN' },
        ],
        videos: [
            { title: 'let, const & the TDZ (Namaste JS)', url: 'https://www.youtube.com/watch?v=BNC6slYCj50', videoId: 'BNC6slYCj50' },
            { title: 'Temporal dead zone, simplified', url: 'https://www.youtube.com/watch?v=Cad46WAHApY', videoId: 'Cad46WAHApY' },
            { title: 'Hoisting & the TDZ explained', url: 'https://www.youtube.com/watch?v=WjM4z0ze3_M', videoId: 'WjM4z0ze3_M' },
        ],
    },
    'execution-context-and-call-stack': {
        articles: [
            { title: 'Call stack (MDN glossary)', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Call_stack', source: 'MDN' },
            { title: 'The Modern JavaScript Tutorial', url: 'https://javascript.info', source: 'javascript.info' },
        ],
        videos: [
            { title: 'How JS is executed & the call stack', url: 'https://www.youtube.com/watch?v=iLWTnMzWtj4', videoId: 'iLWTnMzWtj4' },
            { title: 'How JS works under the hood', url: 'https://www.youtube.com/watch?v=xvBSmxb_Dq8', videoId: 'xvBSmxb_Dq8' },
            { title: 'Execution context & call stack', url: 'https://www.youtube.com/watch?v=45Dj7BqpmHY', videoId: '45Dj7BqpmHY' },
        ],
    },
    'closures-in-depth': {
        articles: [
            { title: 'Closures (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures', source: 'MDN' },
            { title: 'Closure (javascript.info)', url: 'https://javascript.info/closure', source: 'javascript.info' },
        ],
        videos: [
            { title: 'JavaScript Visualized — Closures', url: 'https://www.youtube.com/watch?v=6Ixyltr8_R0', videoId: '6Ixyltr8_R0' },
            { title: 'Closures explained in depth', url: 'https://www.youtube.com/watch?v=aHrvi2zTlaU', videoId: 'aHrvi2zTlaU' },
            { title: 'Scope & closures, beginner → advanced', url: 'https://www.youtube.com/watch?v=1p1UVoIERMA', videoId: '1p1UVoIERMA' },
        ],
    },
    'the-this-keyword': {
        articles: [{ title: 'this (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this', source: 'MDN' }],
        videos: [
            { title: 'The "this" keyword explained', url: 'https://www.youtube.com/watch?v=2mRN8FyjnE4', videoId: '2mRN8FyjnE4' },
            { title: '"this" — JavaScript in depth', url: 'https://www.youtube.com/watch?v=rpSRRB2VZ2A', videoId: 'rpSRRB2VZ2A' },
            { title: '"this" explained simply', url: 'https://www.youtube.com/watch?v=cwChC4BQF0Q', videoId: 'cwChC4BQF0Q' },
        ],
    },
    'call-apply-bind-and-currying': {
        articles: [
            { title: 'Function.prototype.bind (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind', source: 'MDN' },
            { title: 'Currying (javascript.info)', url: 'https://javascript.info/currying-partials', source: 'javascript.info' },
        ],
        videos: [
            { title: 'bind, call & apply explained', url: 'https://www.youtube.com/watch?v=LCFeRoZXI9Q', videoId: 'LCFeRoZXI9Q' },
            { title: 'call, apply & bind step by step', url: 'https://www.youtube.com/watch?v=75W8UPQ5l7k', videoId: '75W8UPQ5l7k' },
            { title: 'call vs apply vs bind (interview)', url: 'https://www.youtube.com/watch?v=Q-B1ypPpji0', videoId: 'Q-B1ypPpji0' },
        ],
    },
    'higher-order-functions-and-functional-patterns': {
        articles: [{ title: 'First-class functions (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Glossary/First-class_Function', source: 'MDN' }],
        videos: [
            { title: 'Higher-order functions, simply', url: 'https://www.youtube.com/watch?v=gVhRtrOw-oM', videoId: 'gVhRtrOw-oM' },
            { title: 'HOF simplified', url: 'https://www.youtube.com/watch?v=8EW_AZRPxXM', videoId: '8EW_AZRPxXM' },
            { title: 'Higher-order functions (Coding Train)', url: 'https://www.youtube.com/watch?v=H4awPsyugS0', videoId: 'H4awPsyugS0' },
        ],
    },
    'objects-and-property-descriptors': {
        articles: [
            { title: 'Object.defineProperty (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty', source: 'MDN' },
            { title: 'Getters (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get', source: 'MDN' },
        ],
        videos: [
            { title: 'Getters and setters in JavaScript', url: 'https://www.youtube.com/watch?v=tjqjHxDL2Mg', videoId: 'tjqjHxDL2Mg' },
            { title: 'Getters and setters explained', url: 'https://www.youtube.com/watch?v=qkAb-4ZR5Yw', videoId: 'qkAb-4ZR5Yw' },
            { title: 'Object.defineProperty with get/set', url: 'https://www.youtube.com/watch?v=xxwc9q7W7BU', videoId: 'xxwc9q7W7BU' },
        ],
    },
    'prototype-chain-and-inheritance': {
        articles: [{ title: 'Inheritance & the prototype chain (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain', source: 'MDN' }],
        videos: [
            { title: 'Prototype chain & inheritance', url: 'https://www.youtube.com/watch?v=KGsQiqLdeuw', videoId: 'KGsQiqLdeuw' },
            { title: 'Understanding the prototype chain', url: 'https://www.youtube.com/watch?v=GhJTy5-X3kA', videoId: 'GhJTy5-X3kA' },
            { title: 'Inheritance and the prototype chain', url: 'https://www.youtube.com/watch?v=RFWvIEVZ_j8', videoId: 'RFWvIEVZ_j8' },
        ],
    },
    'es6-classes': {
        articles: [{ title: 'Classes (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes', source: 'MDN' }],
        videos: [
            { title: 'JavaScript ES6 classes (OOP)', url: 'https://www.youtube.com/watch?v=q119dA8HIRs', videoId: 'q119dA8HIRs' },
            { title: 'Learn classes in 6 minutes', url: 'https://www.youtube.com/watch?v=U2vxAEiaVRY', videoId: 'U2vxAEiaVRY' },
            { title: 'ES6 classes — constructors, statics…', url: 'https://www.youtube.com/watch?v=j1pcKN5vuqY', videoId: 'j1pcKN5vuqY' },
        ],
    },
    'the-event-loop': {
        articles: [{ title: 'The event loop (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop', source: 'MDN' }],
        videos: [
            { title: 'What the heck is the event loop? (Philip Roberts)', url: 'https://www.youtube.com/watch?v=8aGhZQkoFbQ', videoId: '8aGhZQkoFbQ' },
            { title: 'The event loop in 5 minutes', url: 'https://www.youtube.com/watch?v=lqLSNG_79lI', videoId: 'lqLSNG_79lI' },
            { title: 'What exactly is the event loop?', url: 'https://www.youtube.com/watch?v=XBt1tDunZj4', videoId: 'XBt1tDunZj4' },
        ],
    },
    'promises-deep-dive': {
        articles: [
            { title: 'Using promises (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises', source: 'MDN' },
            { title: 'Promise (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise', source: 'MDN' },
        ],
        videos: [
            { title: 'Promises explained in depth', url: 'https://www.youtube.com/watch?v=RpxX1QIWlVs', videoId: 'RpxX1QIWlVs' },
            { title: 'Promise.all, race, any & allSettled', url: 'https://www.youtube.com/watch?v=EHDExNi1Sx8', videoId: 'EHDExNi1Sx8' },
            { title: 'Promises — JavaScript in depth', url: 'https://www.youtube.com/watch?v=M-gbygLA2PU', videoId: 'M-gbygLA2PU' },
        ],
    },
    'async-await': {
        articles: [
            { title: 'async function (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function', source: 'MDN' },
            { title: 'Using promises (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises', source: 'MDN' },
        ],
        videos: [
            { title: 'async/await simply explained', url: 'https://www.youtube.com/watch?v=wKY4-WMmbZw', videoId: 'wKY4-WMmbZw' },
            { title: 'async/await vs promises', url: 'https://www.youtube.com/watch?v=spvYqO_Kp9Q', videoId: 'spvYqO_Kp9Q' },
            { title: 'async/await is easy!', url: 'https://www.youtube.com/watch?v=9j1dZwFEJ-c', videoId: '9j1dZwFEJ-c' },
        ],
    },
    'callbacks-generators-and-iterators': {
        articles: [
            { title: 'Generator (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator', source: 'MDN' },
            { title: 'Iteration protocols (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols', source: 'MDN' },
        ],
        videos: [
            { title: 'What are generators & iterators?', url: 'https://www.youtube.com/watch?v=6D7XOGXbyfs', videoId: '6D7XOGXbyfs' },
            { title: 'Iterator & generator fundamentals', url: 'https://www.youtube.com/watch?v=NoUPIQobeLw', videoId: 'NoUPIQobeLw' },
            { title: 'Generators in 7 minutes', url: 'https://www.youtube.com/watch?v=k2kVPWPmagQ', videoId: 'k2kVPWPmagQ' },
        ],
    },
    'destructuring-spread-and-rest': {
        articles: [
            { title: 'Destructuring assignment (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment', source: 'MDN' },
            { title: 'Spread syntax (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax', source: 'MDN' },
        ],
        videos: [
            { title: 'Destructuring, spread & rest', url: 'https://www.youtube.com/watch?v=SFplA5KrAmQ', videoId: 'SFplA5KrAmQ' },
            { title: 'Destructuring and rest/spread', url: 'https://www.youtube.com/watch?v=wCv2xOkFC70', videoId: 'wCv2xOkFC70' },
            { title: 'Destructuring, spread & rest syntaxes', url: 'https://www.youtube.com/watch?v=jEw5ZqFcenk', videoId: 'jEw5ZqFcenk' },
        ],
    },
    'map-set-weakmap-weakset': {
        articles: [
            { title: 'Map (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map', source: 'MDN' },
            { title: 'WeakMap (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap', source: 'MDN' },
        ],
        videos: [
            { title: 'Map, Set, WeakMap & WeakSet (interview)', url: 'https://www.youtube.com/watch?v=h01qi0TFf84', videoId: 'h01qi0TFf84' },
            { title: 'Map/Set/WeakMap/WeakSet — real use case', url: 'https://www.youtube.com/watch?v=rMmnFYvqKtw', videoId: 'rMmnFYvqKtw' },
            { title: 'Map vs WeakMap', url: 'https://www.youtube.com/watch?v=iSt5iLwqtdI', videoId: 'iSt5iLwqtdI' },
        ],
    },
    'modules-esm-vs-commonjs': {
        articles: [
            { title: 'JavaScript modules (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules', source: 'MDN' },
            { title: 'ECMAScript modules (Node.js)', url: 'https://nodejs.org/api/esm.html', source: 'nodejs.org' },
        ],
        videos: [
            { title: 'ESM vs CommonJS in Node', url: 'https://www.youtube.com/watch?v=I3DrifH-rJE', videoId: 'I3DrifH-rJE' },
            { title: 'Say goodbye to CommonJS, use ESM', url: 'https://www.youtube.com/watch?v=TrLMm4BCdlg', videoId: 'TrLMm4BCdlg' },
            { title: 'Modules in Node: CommonJS & ESM', url: 'https://www.youtube.com/watch?v=4N00XnEcNWE', videoId: '4N00XnEcNWE' },
        ],
    },
    'symbols-iterators-and-proxy': {
        articles: [
            { title: 'Proxy (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy', source: 'MDN' },
            { title: 'Symbol (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol', source: 'MDN' },
        ],
        videos: [
            { title: 'Proxy and Reflect objects', url: 'https://www.youtube.com/watch?v=TGGoiJBuv-Y', videoId: 'TGGoiJBuv-Y' },
            { title: 'Proxy object in ES6', url: 'https://www.youtube.com/watch?v=agEki62bmN4', videoId: 'agEki62bmN4' },
            { title: 'Reflect & Proxy for beginners', url: 'https://www.youtube.com/watch?v=NQIsue1YeO8', videoId: 'NQIsue1YeO8' },
        ],
    },
    'memory-management-and-garbage-collection': {
        articles: [{ title: 'Memory management (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management', source: 'MDN' }],
        videos: [
            { title: 'Understand the JS garbage collector in 4 min', url: 'https://www.youtube.com/watch?v=FZ42HMWG6xg', videoId: 'FZ42HMWG6xg' },
            { title: 'Memory management (mark & sweep)', url: 'https://www.youtube.com/watch?v=gOeW5_UnN9g', videoId: 'gOeW5_UnN9g' },
            { title: 'Heap, stack & garbage collection', url: 'https://www.youtube.com/watch?v=wRSL2jwtpRg', videoId: 'wRSL2jwtpRg' },
        ],
    },

    /* ═══════════ Frontend System Design Kit ═══════════ */
    'semantic-structure': {
        articles: [{ title: 'Semantics (MDN glossary)', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Semantics', source: 'MDN' }],
        videos: [
            { title: 'Semantic HTML in 4 minutes', url: 'https://www.youtube.com/watch?v=YPzFPoqwTmI', videoId: 'YPzFPoqwTmI' },
            { title: 'Semantic HTML elements tutorial', url: 'https://www.youtube.com/watch?v=kX3TfdUqpuU', videoId: 'kX3TfdUqpuU' },
            { title: 'Semantic tags explained simply', url: 'https://www.youtube.com/watch?v=_ncr495dqK0', videoId: '_ncr495dqK0' },
        ],
    },
    'html5-apis-and-forms': {
        articles: [
            { title: '<dialog> element (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog', source: 'MDN' },
            { title: 'FormData API (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/FormData', source: 'MDN' },
        ],
        videos: [
            { title: 'The <dialog> element changes modals', url: 'https://www.youtube.com/watch?v=ywtkJkxJsdg', videoId: 'ywtkJkxJsdg' },
            { title: 'Exploring the HTML dialog element', url: 'https://www.youtube.com/watch?v=HuaepozXIWY', videoId: 'HuaepozXIWY' },
            { title: 'FormData API in practice', url: 'https://www.youtube.com/watch?v=WrX5RndZIzw', videoId: 'WrX5RndZIzw' },
        ],
    },
    'loading-and-resource-hints': {
        articles: [{ title: 'rel=preload (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload', source: 'MDN' }],
        videos: [
            { title: 'Preload, prefetch & preconnect', url: 'https://www.youtube.com/watch?v=PLYIrkT4OCg', videoId: 'PLYIrkT4OCg' },
            { title: 'async & defer made easy', url: 'https://www.youtube.com/watch?v=RaPMjzYFF9Y', videoId: 'RaPMjzYFF9Y' },
            { title: 'An intro to resource hints', url: 'https://www.youtube.com/watch?v=6q75MVFLlok', videoId: '6q75MVFLlok' },
        ],
    },
    'aria-and-semantics': {
        articles: [{ title: 'ARIA (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA', source: 'MDN' }],
        videos: [
            { title: "What the heck is ARIA?", url: 'https://www.youtube.com/watch?v=aHNULzcGtDc', videoId: 'aHNULzcGtDc' },
            { title: 'Using ARIA in web development', url: 'https://www.youtube.com/watch?v=G6OjlKrBJw4', videoId: 'G6OjlKrBJw4' },
            { title: 'ARIA attributes — the ultimate guide', url: 'https://www.youtube.com/watch?v=3BPxDkj9UzQ', videoId: '3BPxDkj9UzQ' },
        ],
    },
    'focus-management': {
        articles: [{ title: 'Keyboard-navigable widgets (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_JavaScript_widgets', source: 'MDN' }],
        videos: [
            { title: 'Web accessibility: keyboard, ARIA, contrast', url: 'https://www.youtube.com/watch?v=VyWRmepESoQ', videoId: 'VyWRmepESoQ' },
            { title: 'Keyboard navigation deep dive', url: 'https://www.youtube.com/watch?v=dmnI4r0mXDA', videoId: 'dmnI4r0mXDA' },
            { title: 'Fixing keyboard focus in modern apps', url: 'https://www.youtube.com/watch?v=-8ll1Iqc95M', videoId: '-8ll1Iqc95M' },
        ],
    },
    'dynamic-content-and-forms': {
        articles: [{ title: 'ARIA live regions (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions', source: 'MDN' }],
        videos: [
            { title: 'Announce content changes with live regions', url: 'https://www.youtube.com/watch?v=EGFUQ2ypnrE', videoId: 'EGFUQ2ypnrE' },
            { title: 'aria-live for dynamic pages', url: 'https://www.youtube.com/watch?v=fpihdncIgiY', videoId: 'fpihdncIgiY' },
            { title: 'ARIA live regions in React', url: 'https://www.youtube.com/watch?v=2Ww9eC7_2Wg', videoId: '2Ww9eC7_2Wg' },
        ],
    },
    'layout-and-visual': {
        articles: [
            { title: 'A Complete Guide to Flexbox', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', source: 'css-tricks.com' },
            { title: 'A Complete Guide to Grid', url: 'https://css-tricks.com/snippets/css/complete-guide-grid/', source: 'css-tricks.com' },
        ],
        videos: [
            { title: 'Flexbox vs Grid — the real difference', url: 'https://www.youtube.com/watch?v=HheRpUCYN9Q', videoId: 'HheRpUCYN9Q' },
            { title: 'Flexbox vs Grid — which & when', url: 'https://www.youtube.com/watch?v=18VLSXfsj94', videoId: '18VLSXfsj94' },
            { title: 'Why you need both flexbox & grid', url: 'https://www.youtube.com/watch?v=OlqQiUHaz0o', videoId: 'OlqQiUHaz0o' },
        ],
    },
    'architecture-and-scale': {
        articles: [{ title: 'BEM methodology', url: 'https://getbem.com', source: 'getbem.com' }],
        videos: [
            { title: 'BEM — the what, how & why', url: 'https://www.youtube.com/watch?v=aKenj9ZQwJg', videoId: 'aKenj9ZQwJg' },
            { title: 'Why you should be using BEM', url: 'https://www.youtube.com/watch?v=nQr0Q6VpMTM', videoId: 'nQr0Q6VpMTM' },
            { title: 'BEM explained', url: 'https://www.youtube.com/watch?v=Kfi7c4qvF6E', videoId: 'Kfi7c4qvF6E' },
        ],
    },
    'performance-and-animation': {
        articles: [{ title: 'CSS/JS animation performance (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/Performance/CSS_JavaScript_animation_performance', source: 'MDN' }],
        videos: [
            { title: 'How to create performant CSS animations', url: 'https://www.youtube.com/watch?v=4PStxeSIL9I', videoId: '4PStxeSIL9I' },
            { title: 'What to animate (and what to avoid)', url: 'https://www.youtube.com/watch?v=39K1C92TkWo', videoId: '39K1C92TkWo' },
            { title: 'CSS vs JavaScript animations', url: 'https://www.youtube.com/watch?v=NEo6393TIFE', videoId: 'NEo6393TIFE' },
        ],
    },
    'typescript-fundamentals': {
        articles: [{ title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/', source: 'typescriptlang.org' }],
        videos: [
            { title: 'TypeScript fundamentals — full course', url: 'https://www.youtube.com/watch?v=ZvtsLjXlP8M', videoId: 'ZvtsLjXlP8M' },
            { title: 'TypeScript 101 crash course', url: 'https://www.youtube.com/watch?v=1OLUi77XKWY', videoId: '1OLUi77XKWY' },
            { title: 'TypeScript — the basics', url: 'https://www.youtube.com/watch?v=ahCwqrYpIuM', videoId: 'ahCwqrYpIuM' },
        ],
    },
    'generics-advanced-types': {
        articles: [{ title: 'Generics (TS Handbook)', url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html', source: 'typescriptlang.org' }],
        videos: [
            { title: "Let's learn generics (Matt Pocock)", url: 'https://www.youtube.com/watch?v=xk_PbxR7G8A', videoId: 'xk_PbxR7G8A' },
            { title: 'Advanced TypeScript: utility types, generics…', url: 'https://www.youtube.com/watch?v=DgXC5fwIXTo', videoId: 'DgXC5fwIXTo' },
            { title: 'Generics & advanced types deep dive', url: 'https://www.youtube.com/watch?v=suDwrDGkn9I', videoId: 'suDwrDGkn9I' },
        ],
    },
    'typescript-in-practice': {
        articles: [{ title: 'React + TypeScript Cheatsheet', url: 'https://github.com/typescript-cheatsheets/react', source: 'github.com' }],
        videos: [
            { title: 'React & TypeScript best practices', url: 'https://www.youtube.com/watch?v=H8QhMz3CYso', videoId: 'H8QhMz3CYso' },
            { title: 'All the TypeScript you need for React', url: 'https://www.youtube.com/watch?v=665UnOGx3Pg', videoId: '665UnOGx3Pg' },
            { title: 'React + TypeScript best practices (beginners)', url: 'https://www.youtube.com/watch?v=FknaQpe9Y5s', videoId: 'FknaQpe9Y5s' },
        ],
    },
    'networking-and-protocols': {
        articles: [
            { title: 'An overview of HTTP (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview', source: 'MDN' },
            { title: 'DNS (MDN glossary)', url: 'https://developer.mozilla.org/en-US/docs/Glossary/DNS', source: 'MDN' },
        ],
        videos: [
            { title: 'Every network protocol, simply explained', url: 'https://www.youtube.com/watch?v=IKYZDm1f4pc', videoId: 'IKYZDm1f4pc' },
            { title: 'DNS lookup, TCP handshake & HTTP in 3 min', url: 'https://www.youtube.com/watch?v=1XbvNSwvkAs', videoId: '1XbvNSwvkAs' },
            { title: 'Master network protocols', url: 'https://www.youtube.com/watch?v=y6atCDyKNYg', videoId: 'y6atCDyKNYg' },
        ],
    },
    'browser-internals': {
        articles: [{ title: 'How browsers work (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work', source: 'MDN' }],
        videos: [
            { title: 'How the browser renders a website', url: 'https://www.youtube.com/watch?v=SmE4OwHztCc', videoId: 'SmE4OwHztCc' },
            { title: 'How web browsers work, step by step', url: 'https://www.youtube.com/watch?v=yLY1MC0G6t4', videoId: 'yLY1MC0G6t4' },
            { title: 'How web browsers work', url: 'https://www.youtube.com/watch?v=EoYkl8rwbiM', videoId: 'EoYkl8rwbiM' },
        ],
    },
    'realtime-and-browser-apis': {
        articles: [
            { title: 'WebSockets API (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API', source: 'MDN' },
            { title: 'Server-sent events (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events', source: 'MDN' },
        ],
        videos: [
            { title: 'SSE vs WebSocket', url: 'https://www.youtube.com/watch?v=Zt2uGx2gsco', videoId: 'Zt2uGx2gsco' },
            { title: 'WebSockets vs polling vs SSE', url: 'https://www.youtube.com/watch?v=OP99ry_vRcA', videoId: 'OP99ry_vRcA' },
            { title: 'WebSockets vs Server-Sent Events', url: 'https://www.youtube.com/watch?v=1pHEwnUovls', videoId: '1pHEwnUovls' },
        ],
    },
    'common-attacks': {
        articles: [
            { title: 'Web security (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/Security', source: 'MDN' },
            { title: 'Cross-site scripting (OWASP)', url: 'https://owasp.org/www-community/attacks/xss/', source: 'owasp.org' },
        ],
        videos: [
            { title: 'XSS & CSRF explained', url: 'https://www.youtube.com/watch?v=YuSdhKsOgEU', videoId: 'YuSdhKsOgEU' },
            { title: '1 hour of popular web attacks', url: 'https://www.youtube.com/watch?v=pdC3H8SX-F4', videoId: 'pdC3H8SX-F4' },
            { title: 'XSS vs CSRF — the difference', url: 'https://www.youtube.com/watch?v=OVU9FDBjaMg', videoId: 'OVU9FDBjaMg' },
        ],
    },
    'authentication-and-authorization': {
        articles: [
            { title: 'HTTP authentication (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication', source: 'MDN' },
            { title: 'Introduction to JWT', url: 'https://jwt.io/introduction', source: 'jwt.io' },
        ],
        videos: [
            { title: 'Auth vs authz: session vs JWT', url: 'https://www.youtube.com/watch?v=7IMMlUPX2OI', videoId: '7IMMlUPX2OI' },
            { title: 'Sessions vs JWT vs OAuth', url: 'https://www.youtube.com/watch?v=rUkCIfMm2NI', videoId: 'rUkCIfMm2NI' },
            { title: 'Basic, Bearer, OAuth2, JWT & SSO', url: 'https://www.youtube.com/watch?v=9JPnN1Z_iSY', videoId: '9JPnN1Z_iSY' },
        ],
    },
    'headers-and-infrastructure': {
        articles: [
            { title: 'Content Security Policy (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP', source: 'MDN' },
            { title: 'CORS (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS', source: 'MDN' },
        ],
        videos: [
            { title: 'HTTP secure headers (CORS, CSP, HSTS)', url: 'https://www.youtube.com/watch?v=4bQeGUzHpOE', videoId: '4bQeGUzHpOE' },
            { title: 'CSP vs CORS explained', url: 'https://www.youtube.com/watch?v=OOYVPKeBmHo', videoId: 'OOYVPKeBmHo' },
            { title: 'Stop copying CORS headers', url: 'https://www.youtube.com/watch?v=cGg7aRcIm8o', videoId: 'cGg7aRcIm8o' },
        ],
    },
    'core-rendering-strategies': {
        articles: [{ title: 'Rendering on the web (web.dev)', url: 'https://web.dev/articles/rendering-on-the-web', source: 'web.dev' }],
        videos: [
            { title: 'CSR, SSR, SSG, ISR explained', url: 'https://www.youtube.com/watch?v=VDqEg0IoSIs', videoId: 'VDqEg0IoSIs' },
            { title: 'Rendering strategies: SSR/ISR/SSG/CSR', url: 'https://www.youtube.com/watch?v=bckIp4AYwO8', videoId: 'bckIp4AYwO8' },
            { title: 'CSR/SSR/SSG/RSC patterns', url: 'https://www.youtube.com/watch?v=SLQa-XdDOtk', videoId: 'SLQa-XdDOtk' },
        ],
    },
    'modern-rendering-patterns': {
        articles: [
            { title: 'Rendering on the web (web.dev)', url: 'https://web.dev/articles/rendering-on-the-web', source: 'web.dev' },
            { title: 'Patterns.dev', url: 'https://www.patterns.dev', source: 'patterns.dev' },
        ],
        videos: [
            { title: 'React Server Components vs SSR', url: 'https://www.youtube.com/watch?v=xoi-bDY_gmU', videoId: 'xoi-bDY_gmU' },
            { title: 'RSC vs SSR', url: 'https://www.youtube.com/watch?v=jEJEFAc8tSI', videoId: 'jEJEFAc8tSI' },
            { title: 'Streaming SSR can fix a slow app', url: 'https://www.youtube.com/watch?v=zQoqgClU278', videoId: 'zQoqgClU278' },
        ],
    },
    'rendering-and-loading': {
        articles: [{ title: 'Critical rendering path (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path', source: 'MDN' }],
        videos: [
            { title: 'Critical rendering path explained', url: 'https://www.youtube.com/watch?v=FnhieCCfhlA', videoId: 'FnhieCCfhlA' },
            { title: 'Critical rendering path walkthrough', url: 'https://www.youtube.com/watch?v=d_oIZzkyQ-E', videoId: 'd_oIZzkyQ-E' },
            { title: 'CRP — frontend interview question', url: 'https://www.youtube.com/watch?v=zswm7sKk_Xo', videoId: 'zswm7sKk_Xo' },
        ],
    },
    'runtime-and-network': {
        articles: [{ title: 'Web performance (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/Performance', source: 'MDN' }],
        videos: [
            { title: 'Optimize network performance for web apps', url: 'https://www.youtube.com/watch?v=XSVkWiW-t4k', videoId: 'XSVkWiW-t4k' },
            { title: 'Front-end performance: techniques & tools', url: 'https://www.youtube.com/watch?v=9tO8AX7Ah2I', videoId: '9tO8AX7Ah2I' },
            { title: '10 frontend performance tips', url: 'https://www.youtube.com/watch?v=mnuYVi5pcfQ', videoId: 'mnuYVi5pcfQ' },
        ],
    },
    'measurement-and-strategy': {
        articles: [{ title: 'Web Vitals (web.dev)', url: 'https://web.dev/articles/vitals', source: 'web.dev' }],
        videos: [
            { title: 'Understanding performance with Core Web Vitals', url: 'https://www.youtube.com/watch?v=F0NYT7DIlDQ', videoId: 'F0NYT7DIlDQ' },
            { title: 'Check Core Web Vitals with Lighthouse', url: 'https://www.youtube.com/watch?v=M7ygWd50hro', videoId: 'M7ygWd50hro' },
            { title: 'Debugging Core Web Vitals with DevTools', url: 'https://www.youtube.com/watch?v=M3lA6tJx-a4', videoId: 'M3lA6tJx-a4' },
        ],
    },
    'creational-patterns': {
        articles: [{ title: 'Creational patterns (Refactoring.Guru)', url: 'https://refactoring.guru/design-patterns/creational-patterns', source: 'refactoring.guru' }],
        videos: [
            { title: 'All creational design patterns', url: 'https://www.youtube.com/watch?v=OuNOyFg942M', videoId: 'OuNOyFg942M' },
            { title: 'Creational patterns for interviews (LLD)', url: 'https://www.youtube.com/watch?v=7X7rdmJGtY8', videoId: '7X7rdmJGtY8' },
            { title: 'Factory, builder, singleton', url: 'https://www.youtube.com/watch?v=VCxNt2K7aVY', videoId: 'VCxNt2K7aVY' },
        ],
    },
    'behavioral-patterns': {
        articles: [{ title: 'Behavioral patterns (Refactoring.Guru)', url: 'https://refactoring.guru/design-patterns/behavioral-patterns', source: 'refactoring.guru' }],
        videos: [
            { title: 'All behavioral design patterns', url: 'https://www.youtube.com/watch?v=DBDnUkTobaE', videoId: 'DBDnUkTobaE' },
            { title: 'Behavioral patterns (LLD)', url: 'https://www.youtube.com/watch?v=TChPONDK51U', videoId: 'TChPONDK51U' },
            { title: 'The observer pattern explained', url: 'https://www.youtube.com/watch?v=-oLDJ2dbadA', videoId: '-oLDJ2dbadA' },
        ],
    },
    'structural-patterns': {
        articles: [{ title: 'Structural patterns (Refactoring.Guru)', url: 'https://refactoring.guru/design-patterns/structural-patterns', source: 'refactoring.guru' }],
        videos: [
            { title: 'All structural design patterns', url: 'https://www.youtube.com/watch?v=WxGtmIBZszk', videoId: 'WxGtmIBZszk' },
            { title: 'The facade pattern explained', url: 'https://www.youtube.com/watch?v=xWk6jvqyhAQ', videoId: 'xWk6jvqyhAQ' },
            { title: 'Decorator, bridge & adapter', url: 'https://www.youtube.com/watch?v=5Va1fslNKEo', videoId: '5Va1fslNKEo' },
        ],
    },
    'architectural-patterns': {
        articles: [{ title: 'Architectural patterns (overview)', url: 'https://en.wikipedia.org/wiki/Architectural_pattern', source: 'wikipedia.org' }],
        videos: [
            { title: 'MVC vs MVP vs MVVM explained', url: 'https://www.youtube.com/watch?v=yns5gBO7IXU', videoId: 'yns5gBO7IXU' },
            { title: 'Architectural patterns 101', url: 'https://www.youtube.com/watch?v=6_qVQXlq-sA', videoId: '6_qVQXlq-sA' },
            { title: 'MVC, MVP & MVVM explained', url: 'https://www.youtube.com/watch?v=izZ858Gbwh0', videoId: 'izZ858Gbwh0' },
        ],
    },
    'state-management': {
        articles: [
            { title: 'Managing State (react.dev)', url: 'https://react.dev/learn/managing-state', source: 'react.dev' },
            { title: 'TanStack Query (server state)', url: 'https://github.com/TanStack/query', source: 'github.com' },
        ],
        videos: [
            { title: 'What is state management?', url: 'https://www.youtube.com/watch?v=e0pw9j4pi2A', videoId: 'e0pw9j4pi2A' },
            { title: 'State management concepts — just enough', url: 'https://www.youtube.com/watch?v=9EvA4dnBik8', videoId: '9EvA4dnBik8' },
            { title: 'Benefits of state management & patterns', url: 'https://www.youtube.com/watch?v=PEMJqxJUegU', videoId: 'PEMJqxJUegU' },
        ],
    },
    'foundations': {
        articles: [{ title: 'Front-End System Design Playbook', url: 'https://www.greatfrontend.com/front-end-system-design-playbook', source: 'greatfrontend.com' }],
        videos: [
            { title: 'Front-end system design fundamentals', url: 'https://www.youtube.com/watch?v=NEzu4FD25KM', videoId: 'NEzu4FD25KM' },
            { title: 'What is front-end system design?', url: 'https://www.youtube.com/watch?v=XPNMiWyHBAU', videoId: 'XPNMiWyHBAU' },
            { title: 'How to prepare for the FE system design interview', url: 'https://www.youtube.com/watch?v=JhcW0fuR_ig', videoId: 'JhcW0fuR_ig' },
        ],
    },
    'communication-and-realtime': {
        articles: [{ title: 'WebSockets API (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API', source: 'MDN' }],
        videos: [
            { title: 'Chat application — front-end system design', url: 'https://www.youtube.com/watch?v=LEaiGjffLEs', videoId: 'LEaiGjffLEs' },
            { title: 'WhatsApp front-end system design', url: 'https://www.youtube.com/watch?v=3mi-Cah2PtM', videoId: '3mi-Cah2PtM' },
            { title: 'Realtime communication with WebSockets', url: 'https://www.youtube.com/watch?v=aobAcg2lmHo', videoId: 'aobAcg2lmHo' },
        ],
    },
    'content-and-media': {
        articles: [{ title: 'Lazy loading (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading', source: 'MDN' }],
        videos: [
            { title: 'Facebook news feed — FE system design', url: 'https://www.youtube.com/watch?v=5vyKhm2NTfw', videoId: '5vyKhm2NTfw' },
            { title: 'How social feeds scroll infinitely', url: 'https://www.youtube.com/watch?v=QQp4VLav72s', videoId: 'QQp4VLav72s' },
            { title: 'Design infinite scroll (interview)', url: 'https://www.youtube.com/watch?v=IOJOUaKuj6M', videoId: 'IOJOUaKuj6M' },
        ],
    },
    'ecommerce': {
        articles: [{ title: 'Front-End System Design Playbook', url: 'https://www.greatfrontend.com/front-end-system-design-playbook', source: 'greatfrontend.com' }],
        videos: [
            { title: 'E-commerce with React — mock interview', url: 'https://www.youtube.com/watch?v=ID4puHX8YKA', videoId: 'ID4puHX8YKA' },
            { title: 'Complete front-end e-commerce build', url: 'https://www.youtube.com/watch?v=5r6lnqP4V2s', videoId: '5r6lnqP4V2s' },
            { title: 'Build an e-commerce store (front-end)', url: 'https://www.youtube.com/watch?v=DsUY7ZbVkgY', videoId: 'DsUY7ZbVkgY' },
        ],
    },
    'productivity-and-saas': {
        articles: [{ title: 'Operational transformation (overview)', url: 'https://en.wikipedia.org/wiki/Operational_transformation', source: 'wikipedia.org' }],
        videos: [
            { title: 'Google Docs — operational transformation', url: 'https://www.youtube.com/watch?v=YiZh9Gj75HI', videoId: 'YiZh9Gj75HI' },
            { title: 'Design a real-time collaborative editor', url: 'https://www.youtube.com/watch?v=nH8Hl3PyouE', videoId: 'nH8Hl3PyouE' },
            { title: 'Mock design: Google Docs', url: 'https://www.youtube.com/watch?v=Fp-Wd1BH3hc', videoId: 'Fp-Wd1BH3hc' },
        ],
    },
    'platform-and-infrastructure': {
        articles: [{ title: 'HTTP caching (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching', source: 'MDN' }],
        videos: [
            { title: 'CDNs explained in 6 minutes', url: 'https://www.youtube.com/watch?v=PMQdGWt3_L4', videoId: 'PMQdGWt3_L4' },
            { title: 'CDN architecture explained', url: 'https://www.youtube.com/watch?v=OtMVyKirvDg', videoId: 'OtMVyKirvDg' },
            { title: 'The ultimate guide to caching', url: 'https://www.youtube.com/watch?v=YgDRv0mcLIc', videoId: 'YgDRv0mcLIc' },
        ],
    },
    'modules-and-bundlers': {
        articles: [
            { title: 'Vite — guide', url: 'https://vitejs.dev/guide/', source: 'vitejs.dev' },
            { title: 'JavaScript modules (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules', source: 'MDN' },
        ],
        videos: [
            { title: '5 module bundlers compared', url: 'https://www.youtube.com/watch?v=EBTbwjAgBAw', videoId: 'EBTbwjAgBAw' },
            { title: 'Vite vs Webpack', url: 'https://www.youtube.com/watch?v=YYGY5rqU7dc', videoId: 'YYGY5rqU7dc' },
            { title: 'Webpack vs Vite vs Parcel vs esbuild', url: 'https://www.youtube.com/watch?v=i9Xq8aExZr4', videoId: 'i9Xq8aExZr4' },
        ],
    },
    'tooling-and-environment': {
        articles: [
            { title: 'ESLint', url: 'https://eslint.org', source: 'eslint.org' },
            { title: 'Prettier', url: 'https://prettier.io', source: 'prettier.io' },
        ],
        videos: [
            { title: 'Tooling: Webpack, Babel, ESLint, Prettier', url: 'https://www.youtube.com/watch?v=P6uaTzshy1M', videoId: 'P6uaTzshy1M' },
            { title: 'ESLint + Prettier + VS Code setup', url: 'https://www.youtube.com/watch?v=lHAeK8t94as', videoId: 'lHAeK8t94as' },
            { title: 'ESLint setup with Prettier', url: 'https://www.youtube.com/watch?v=eMgLHOrDkAs', videoId: 'eMgLHOrDkAs' },
        ],
    },
    'code-management': {
        articles: [{ title: 'Git workflows (Atlassian)', url: 'https://www.atlassian.com/git/tutorials/comparing-workflows', source: 'atlassian.com' }],
        videos: [
            { title: 'Monorepo vs multirepo', url: 'https://www.youtube.com/watch?v=nAcFjYXnJVE', videoId: 'nAcFjYXnJVE' },
            { title: 'Monorepo explained', url: 'https://www.youtube.com/watch?v=HIl5ZIL9HqE', videoId: 'HIl5ZIL9HqE' },
            { title: 'Git workflow & branching strategies', url: 'https://www.youtube.com/watch?v=HTm1aAg9bkw', videoId: 'HTm1aAg9bkw' },
        ],
    },
    'app-router-and-rendering': {
        articles: [{ title: 'Next.js App Router (docs)', url: 'https://nextjs.org/docs/app', source: 'nextjs.org' }],
        videos: [
            { title: 'Next.js App Router explained simply', url: 'https://www.youtube.com/watch?v=Tjf2BZlGVbU', videoId: 'Tjf2BZlGVbU' },
            { title: 'App Router: routing, data fetching, caching', url: 'https://www.youtube.com/watch?v=gSSsZReIFRk', videoId: 'gSSsZReIFRk' },
            { title: 'App Router — what I wish I knew earlier', url: 'https://www.youtube.com/watch?v=EbrBRQ6UbIY', videoId: 'EbrBRQ6UbIY' },
        ],
    },
    'features-and-deployment': {
        articles: [{ title: 'Next.js documentation', url: 'https://nextjs.org/docs', source: 'nextjs.org' }],
        videos: [
            { title: "Server Actions: Next.js's best feature", url: 'https://www.youtube.com/watch?v=czvSZqnpTHs', videoId: 'czvSZqnpTHs' },
            { title: 'Server Actions in 5 minutes', url: 'https://www.youtube.com/watch?v=m0Ao0cu7GmY', videoId: 'm0Ao0cu7GmY' },
            { title: 'Server Actions tutorial', url: 'https://www.youtube.com/watch?v=JR2CEqwZFCE', videoId: 'JR2CEqwZFCE' },
        ],
    },
    'ai-integration': {
        articles: [
            { title: 'Vercel AI SDK — docs', url: 'https://sdk.vercel.ai/docs', source: 'sdk.vercel.ai' },
            { title: 'Anthropic API docs', url: 'https://docs.anthropic.com', source: 'anthropic.com' },
        ],
        videos: [
            { title: 'Integrating LLM APIs in the frontend', url: 'https://www.youtube.com/watch?v=umTLp7OvRTs', videoId: 'umTLp7OvRTs' },
            { title: 'AI-powered apps with Next.js', url: 'https://www.youtube.com/watch?v=gTsnsfKB-XM', videoId: 'gTsnsfKB-XM' },
            { title: 'Integrating LLMs using APIs', url: 'https://www.youtube.com/watch?v=r6cLANbds_I', videoId: 'r6cLANbds_I' },
        ],
    },
    'ai-cost-tokens-models': {
        articles: [
            { title: 'Anthropic — model pricing', url: 'https://www.anthropic.com/pricing', source: 'anthropic.com' },
            { title: 'Anthropic API docs', url: 'https://docs.anthropic.com', source: 'anthropic.com' },
        ],
        videos: [
            { title: 'Understanding tokens & what they cost', url: 'https://www.youtube.com/watch?v=ZUCVRppXPSc', videoId: 'ZUCVRppXPSc' },
            { title: 'Tokens, context windows & API costs', url: 'https://www.youtube.com/watch?v=SWE0LV0xnZ4', videoId: 'SWE0LV0xnZ4' },
            { title: 'LLM pricing explained', url: 'https://www.youtube.com/watch?v=ooNRL9FJSuk', videoId: 'ooNRL9FJSuk' },
        ],
    },
    'ai-tool-use-agents': {
        articles: [
            { title: 'Tool use (Anthropic)', url: 'https://docs.anthropic.com/en/docs/build-with-claude/tool-use', source: 'anthropic.com' },
            { title: 'Function calling (OpenAI)', url: 'https://platform.openai.com/docs/guides/function-calling', source: 'openai.com' },
        ],
        videos: [
            { title: 'LLM tool calling explained', url: 'https://www.youtube.com/watch?v=vdUxBDulv1M', videoId: 'vdUxBDulv1M' },
            { title: 'How LLM tool calling works', url: 'https://www.youtube.com/watch?v=QiRdYCNXAxk', videoId: 'QiRdYCNXAxk' },
            { title: 'Turn your LLM into an AI agent', url: 'https://www.youtube.com/watch?v=KJf7SqPCRXg', videoId: 'KJf7SqPCRXg' },
        ],
    },
    'ai-reasoning-ui': {
        articles: [{ title: 'Vercel AI SDK — docs', url: 'https://sdk.vercel.ai/docs', source: 'sdk.vercel.ai' }],
        videos: [
            { title: '10 UX patterns every AI chat needs', url: 'https://www.youtube.com/watch?v=bppkpufBJsI', videoId: 'bppkpufBJsI' },
            { title: 'Stream API responses (like an AI chat)', url: 'https://www.youtube.com/watch?v=XVCU4WkIwiY', videoId: 'XVCU4WkIwiY' },
            { title: 'The UX of conversational AI', url: 'https://www.youtube.com/watch?v=L8uGT1px9IU', videoId: 'L8uGT1px9IU' },
        ],
    },
    'core-hooks': {
        articles: [{ title: 'Built-in React hooks (reference)', url: 'https://react.dev/reference/react/hooks', source: 'react.dev' }],
        videos: [
            { title: '8 React hooks explained', url: 'https://www.youtube.com/watch?v=DfTTn6gKPG4', videoId: 'DfTTn6gKPG4' },
            { title: 'Master useState, useEffect & more', url: 'https://www.youtube.com/watch?v=2Vwy12xK2kM', videoId: '2Vwy12xK2kM' },
            { title: 'All React hooks in 12 minutes', url: 'https://www.youtube.com/watch?v=LOH1l-MP_9k', videoId: 'LOH1l-MP_9k' },
        ],
    },
    'specialized-hooks': {
        articles: [{ title: 'Built-in React hooks (reference)', url: 'https://react.dev/reference/react/hooks', source: 'react.dev' }],
        videos: [
            { title: 'Advanced hooks: useRef, useMemo, useCallback, useReducer', url: 'https://www.youtube.com/watch?v=uccuCKp5JPw', videoId: 'uccuCKp5JPw' },
            { title: 'useCallback, useMemo & useRef', url: 'https://www.youtube.com/watch?v=0OwhrhrBGac', videoId: '0OwhrhrBGac' },
            { title: 'When to use useCallback & useMemo', url: 'https://www.youtube.com/watch?v=QSLKhwYKBc4', videoId: 'QSLKhwYKBc4' },
        ],
    },
    'react-19-hooks': {
        articles: [{ title: 'React 19 (release blog)', url: 'https://react.dev/blog/2024/12/05/react-19', source: 'react.dev' }],
        videos: [
            { title: 'React 19 hooks in 20 minutes', url: 'https://www.youtube.com/watch?v=iNQbsdhOqGI', videoId: 'iNQbsdhOqGI' },
            { title: 'React 19: useActionState, useOptimistic & more', url: 'https://www.youtube.com/watch?v=6emXK4uW0VI', videoId: '6emXK4uW0VI' },
            { title: 'useOptimistic — everything you need', url: 'https://www.youtube.com/watch?v=QWVr7uDyBXE', videoId: 'QWVr7uDyBXE' },
        ],
    },
    'custom-hooks-and-rules': {
        articles: [
            { title: 'Rules of Hooks', url: 'https://react.dev/reference/rules/rules-of-hooks', source: 'react.dev' },
            { title: 'Reusing logic with custom hooks', url: 'https://react.dev/learn/reusing-logic-with-custom-hooks', source: 'react.dev' },
        ],
        videos: [
            { title: 'Rules of hooks for beginners', url: 'https://www.youtube.com/watch?v=_KMCd9Vdfy0', videoId: '_KMCd9Vdfy0' },
            { title: 'Custom hooks every dev should know', url: 'https://www.youtube.com/watch?v=397259iiZ6M', videoId: '397259iiZ6M' },
            { title: 'Custom hooks and rules', url: 'https://www.youtube.com/watch?v=2Xz_gW0sO-g', videoId: '2Xz_gW0sO-g' },
        ],
    },
    'testing-fundamentals': {
        articles: [
            { title: 'React Testing Library — intro', url: 'https://testing-library.com/docs/react-testing-library/intro', source: 'testing-library.com' },
            { title: 'Jest — official docs', url: 'https://jestjs.io', source: 'jestjs.io' },
        ],
        videos: [
            { title: 'Unit, integration & e2e tests', url: 'https://www.youtube.com/watch?v=r9HdJ8P6GQI', videoId: 'r9HdJ8P6GQI' },
            { title: 'When to unit, e2e & integration test', url: 'https://www.youtube.com/watch?v=isI1c0eGSZ0', videoId: 'isI1c0eGSZ0' },
            { title: 'Static, unit, integration & e2e explained', url: 'https://www.youtube.com/watch?v=TLccnKIMggA', videoId: 'TLccnKIMggA' },
        ],
    },
    'advanced-testing': {
        articles: [
            { title: 'Playwright', url: 'https://playwright.dev', source: 'playwright.dev' },
            { title: 'Cypress', url: 'https://www.cypress.io', source: 'cypress.io' },
        ],
        videos: [
            { title: 'Cypress or Playwright?', url: 'https://www.youtube.com/watch?v=fGUzedrUyxA', videoId: 'fGUzedrUyxA' },
            { title: 'Get started with Playwright', url: 'https://www.youtube.com/watch?v=4-LwodVujTg', videoId: '4-LwodVujTg' },
            { title: 'Cypress vs Playwright for e2e', url: 'https://www.youtube.com/watch?v=DoGV8G0Gr_I', videoId: 'DoGV8G0Gr_I' },
        ],
    },
    'testing-patterns': {
        articles: [{ title: 'Guiding principles (Testing Library)', url: 'https://testing-library.com/docs/guiding-principles', source: 'testing-library.com' }],
        videos: [
            { title: 'React testing: pitfalls & best practices', url: 'https://www.youtube.com/watch?v=n6HFSRHEFuY', videoId: 'n6HFSRHEFuY' },
            { title: 'Testing React like a pro', url: 'https://www.youtube.com/watch?v=okexPB5COko', videoId: 'okexPB5COko' },
            { title: 'Best practices for testing React apps', url: 'https://www.youtube.com/watch?v=M35_AgRgfCU', videoId: 'M35_AgRgfCU' },
        ],
    },
    'linear-data-structures': {
        articles: [
            { title: 'Linked list (VisuAlgo)', url: 'https://visualgo.net/en/list', source: 'visualgo.net' },
            { title: 'Data structures (GeeksforGeeks)', url: 'https://www.geeksforgeeks.org/data-structures/', source: 'geeksforgeeks.org' },
        ],
        videos: [
            { title: 'Arrays, linked lists, stacks & queues', url: 'https://www.youtube.com/watch?v=nfOV4vwXjoc', videoId: 'nfOV4vwXjoc' },
            { title: 'Introduction to linear data structures', url: 'https://www.youtube.com/watch?v=rRaP6YhwmKo', videoId: 'rRaP6YhwmKo' },
            { title: 'Stacks, queues & linked lists', url: 'https://www.youtube.com/watch?v=9gTGH8GiXkY', videoId: '9gTGH8GiXkY' },
        ],
    },
    'hash-based-structures': {
        articles: [{ title: 'Hash table (VisuAlgo)', url: 'https://visualgo.net/en/hashtable', source: 'visualgo.net' }],
        videos: [
            { title: 'Hash table — illustrated', url: 'https://www.youtube.com/watch?v=jalSiaIi8j4', videoId: 'jalSiaIi8j4' },
            { title: 'Learn hash tables in 13 minutes', url: 'https://www.youtube.com/watch?v=FsfRsGFHuv4', videoId: 'FsfRsGFHuv4' },
            { title: 'Intro to hash tables & dictionaries', url: 'https://www.youtube.com/watch?v=sfWyugl4JWA', videoId: 'sfWyugl4JWA' },
        ],
    },
    'tree-and-graph-structures': {
        articles: [{ title: 'Binary search tree (VisuAlgo)', url: 'https://visualgo.net/en/bst', source: 'visualgo.net' }],
        videos: [
            { title: 'Introduction to graphs', url: 'https://www.youtube.com/watch?v=4IZ80K72OXo', videoId: '4IZ80K72OXo' },
            { title: 'Trees & graphs explained', url: 'https://www.youtube.com/watch?v=VOsvNDtOHz8', videoId: 'VOsvNDtOHz8' },
            { title: 'Data structures: trees & graphs', url: 'https://www.youtube.com/watch?v=BwCnIuM81Iw', videoId: 'BwCnIuM81Iw' },
        ],
    },
    'sorting-algorithms': {
        articles: [{ title: 'Sorting visualizer (VisuAlgo)', url: 'https://visualgo.net/en/sorting', source: 'visualgo.net' }],
        videos: [
            { title: '15 sorting algorithms in 6 minutes', url: 'https://www.youtube.com/watch?v=kPRA0W1kECg', videoId: 'kPRA0W1kECg' },
            { title: '5 must-know sorting algorithms', url: 'https://www.youtube.com/watch?v=W35KhZq2xFQ', videoId: 'W35KhZq2xFQ' },
            { title: 'Every sorting algorithm explained', url: 'https://www.youtube.com/watch?v=h1Bi0granxM', videoId: 'h1Bi0granxM' },
        ],
    },
    'searching': {
        articles: [{ title: 'Binary search (GeeksforGeeks)', url: 'https://www.geeksforgeeks.org/binary-search/', source: 'geeksforgeeks.org' }],
        videos: [
            { title: 'Learn binary search in 10 minutes', url: 'https://www.youtube.com/watch?v=xrMppTpoqdw', videoId: 'xrMppTpoqdw' },
            { title: 'Binary search in 100 seconds', url: 'https://www.youtube.com/watch?v=MFhxShGxHWc', videoId: 'MFhxShGxHWc' },
            { title: 'Binary search explained visually', url: 'https://www.youtube.com/watch?v=iO_gdw4HZ84', videoId: 'iO_gdw4HZ84' },
        ],
    },
    'two-pointer': {
        articles: [{ title: 'Two-pointers technique (GfG)', url: 'https://www.geeksforgeeks.org/two-pointers-technique/', source: 'geeksforgeeks.org' }],
        videos: [
            { title: 'Two pointers in 7 minutes', url: 'https://www.youtube.com/watch?v=QzZ7nmouLTI', videoId: 'QzZ7nmouLTI' },
            { title: 'Master two pointers & fast/slow', url: 'https://www.youtube.com/watch?v=G5cC3WbUQ7E', videoId: 'G5cC3WbUQ7E' },
            { title: 'Visual intro to two pointers', url: 'https://www.youtube.com/watch?v=On03HWe2tZM', videoId: 'On03HWe2tZM' },
        ],
    },
    'sliding-window': {
        articles: [{ title: 'Sliding window technique (GfG)', url: 'https://www.geeksforgeeks.org/window-sliding-technique/', source: 'geeksforgeeks.org' }],
        videos: [
            { title: 'Sliding window in 7 minutes', url: 'https://www.youtube.com/watch?v=y2d0VHdvfdc', videoId: 'y2d0VHdvfdc' },
            { title: 'Sliding window — full course', url: 'https://www.youtube.com/watch?v=tLsoelNl3To', videoId: 'tLsoelNl3To' },
            { title: 'Sliding window for beginners', url: 'https://www.youtube.com/watch?v=a8GvJ2Ckttk', videoId: 'a8GvJ2Ckttk' },
        ],
    },
    'recursion-backtracking': {
        articles: [{ title: 'Backtracking (GeeksforGeeks)', url: 'https://www.geeksforgeeks.org/backtracking-algorithms/', source: 'geeksforgeeks.org' }],
        videos: [
            { title: 'Recursion & backtracking — beginner to pro', url: 'https://www.youtube.com/watch?v=B_duInxhEQk', videoId: 'B_duInxhEQk' },
            { title: 'What is backtracking?', url: 'https://www.youtube.com/watch?v=Peo7k2osVVs', videoId: 'Peo7k2osVVs' },
            { title: 'Intro to backtracking', url: 'https://www.youtube.com/watch?v=vqnZ9RhhkmY', videoId: 'vqnZ9RhhkmY' },
        ],
    },
    'dynamic-programming': {
        articles: [{ title: 'Dynamic programming (GeeksforGeeks)', url: 'https://www.geeksforgeeks.org/dynamic-programming/', source: 'geeksforgeeks.org' }],
        videos: [
            { title: 'Dynamic programming — freeCodeCamp', url: 'https://www.youtube.com/watch?v=oBt53YbR9Kk', videoId: 'oBt53YbR9Kk' },
            { title: 'DP with animations — full course', url: 'https://www.youtube.com/watch?v=66hDgWottdA', videoId: '66hDgWottdA' },
            { title: 'Dynamic programming — introduction', url: 'https://www.youtube.com/watch?v=nqowUJzG-iM', videoId: 'nqowUJzG-iM' },
        ],
    },
    'greedy': {
        articles: [{ title: 'Greedy algorithms (GeeksforGeeks)', url: 'https://www.geeksforgeeks.org/greedy-algorithms/', source: 'geeksforgeeks.org' }],
        videos: [
            { title: 'Greedy algorithms explained', url: 'https://www.youtube.com/watch?v=lfQvPHGtu6Q', videoId: 'lfQvPHGtu6Q' },
            { title: 'Greedy in-depth for interviews', url: 'https://www.youtube.com/watch?v=-WTslqPbj7I', videoId: '-WTslqPbj7I' },
            { title: 'Greedy for beginners', url: 'https://www.youtube.com/watch?v=t_LNyLz1a9o', videoId: 't_LNyLz1a9o' },
        ],
    },
    'trees': {
        articles: [{ title: 'Binary search tree (VisuAlgo)', url: 'https://visualgo.net/en/bst', source: 'visualgo.net' }],
        videos: [
            { title: 'Binary tree traversals', url: 'https://www.youtube.com/watch?v=-b2lciNd2L4', videoId: '-b2lciNd2L4' },
            { title: 'Intro to binary trees & traversal', url: 'https://www.youtube.com/watch?v=sLbklMIQYKw', videoId: 'sLbklMIQYKw' },
            { title: 'Tree traversal algorithms', url: 'https://www.youtube.com/watch?v=A7XEINOLEdM', videoId: 'A7XEINOLEdM' },
        ],
    },
    'graphs': {
        articles: [{ title: 'Graph data structure (VisuAlgo)', url: 'https://visualgo.net/en/graphds', source: 'visualgo.net' }],
        videos: [
            { title: 'BFS & DFS graph traversal explained', url: 'https://www.youtube.com/watch?v=D8ZS32wGs0s', videoId: 'D8ZS32wGs0s' },
            { title: 'Graph traversals: BFS & DFS', url: 'https://www.youtube.com/watch?v=pcKY4hjDrxk', videoId: 'pcKY4hjDrxk' },
            { title: 'Master graphs: representation + BFS/DFS', url: 'https://www.youtube.com/watch?v=yjyyDspl-0w', videoId: 'yjyyDspl-0w' },
        ],
    },
    'stack-queue': {
        articles: [{ title: 'Stack data structure (GfG)', url: 'https://www.geeksforgeeks.org/stack-data-structure/', source: 'geeksforgeeks.org' }],
        videos: [
            { title: 'Intro to stacks & queues', url: 'https://www.youtube.com/watch?v=A3ZUpyrnCbM', videoId: 'A3ZUpyrnCbM' },
            { title: 'Stack & queue: LIFO vs FIFO', url: 'https://www.youtube.com/watch?v=Ws5Vk01WzpU', videoId: 'Ws5Vk01WzpU' },
            { title: 'Introduction to stack & queue', url: 'https://www.youtube.com/watch?v=tqQ5fTamIN4', videoId: 'tqQ5fTamIN4' },
        ],
    },
    'strings': {
        articles: [{ title: 'String data structure (GfG)', url: 'https://www.geeksforgeeks.org/string-data-structure/', source: 'geeksforgeeks.org' }],
        videos: [
            { title: 'Strings for coding interviews — full course', url: 'https://www.youtube.com/watch?v=Dt6gzsNrghQ', videoId: 'Dt6gzsNrghQ' },
            { title: 'The 5 string interview patterns', url: 'https://www.youtube.com/watch?v=9clnwaqOU2E', videoId: '9clnwaqOU2E' },
            { title: 'String & array problems step by step', url: 'https://www.youtube.com/watch?v=UWLQX-cOEgU', videoId: 'UWLQX-cOEgU' },
        ],
    },
    'bit-manipulation': {
        articles: [{ title: 'Bitwise algorithms (GeeksforGeeks)', url: 'https://www.geeksforgeeks.org/bitwise-algorithms/', source: 'geeksforgeeks.org' }],
        videos: [
            { title: 'Bit manipulation: 5 must-know tricks', url: 'https://www.youtube.com/watch?v=M7n-1dXNsnY', videoId: 'M7n-1dXNsnY' },
            { title: 'Master bit manipulation', url: 'https://www.youtube.com/watch?v=JcHiYWeLJdE', videoId: 'JcHiYWeLJdE' },
            { title: 'Bit manipulation (HackerRank)', url: 'https://www.youtube.com/watch?v=NLKQEOgBAnw', videoId: 'NLKQEOgBAnw' },
        ],
    },
    'math': {
        articles: [{ title: 'Mathematical algorithms (GfG)', url: 'https://www.geeksforgeeks.org/mathematical-algorithms/', source: 'geeksforgeeks.org' }],
        videos: [
            { title: 'Math & number theory for interviews', url: 'https://www.youtube.com/watch?v=0xuCMRuEzms', videoId: '0xuCMRuEzms' },
            { title: 'Top maths questions for interviews', url: 'https://www.youtube.com/watch?v=aqejRkssx2w', videoId: 'aqejRkssx2w' },
            { title: 'Number theory for coding interviews', url: 'https://www.youtube.com/watch?v=LyCcBOTb5Fo', videoId: 'LyCcBOTb5Fo' },
        ],
    },
    'miscellaneous': {
        articles: [{ title: 'DSA roadmap (NeetCode)', url: 'https://neetcode.io/roadmap', source: 'neetcode.io' }],
        videos: [
            { title: '14 patterns to ace coding interviews', url: 'https://www.youtube.com/watch?v=uOefwtUoH4M', videoId: 'uOefwtUoH4M' },
            { title: 'Ace interviews by thinking in patterns', url: 'https://www.youtube.com/watch?v=U3RtWqodZ8U', videoId: 'U3RtWqodZ8U' },
            { title: 'DSA patterns for LeetCode interviews', url: 'https://www.youtube.com/watch?v=Z_c4byLrNBU', videoId: 'Z_c4byLrNBU' },
        ],
    },
    'js-problems-sde1': {
        articles: [{ title: 'JS interview questions (repo)', url: 'https://github.com/sudheerj/javascript-interview-questions', source: 'github.com' }],
        videos: [
            { title: 'Array & string interview questions', url: 'https://www.youtube.com/watch?v=NShqabRufDo', videoId: 'NShqabRufDo' },
            { title: '9 array methods + practice', url: 'https://www.youtube.com/watch?v=L_FaBULM7Io', videoId: 'L_FaBULM7Io' },
            { title: 'String & array problems step by step', url: 'https://www.youtube.com/watch?v=UWLQX-cOEgU', videoId: 'UWLQX-cOEgU' },
        ],
    },
    'js-problems-sde2': {
        articles: [{ title: 'JS interview questions (repo)', url: 'https://github.com/sudheerj/javascript-interview-questions', source: 'github.com' }],
        videos: [
            { title: '50 JS interview questions in 1 hour', url: 'https://www.youtube.com/watch?v=qTszFuibDEg', videoId: 'qTszFuibDEg' },
            { title: 'Top 10 JS coding questions', url: 'https://www.youtube.com/watch?v=O4uuPOHfefg', videoId: 'O4uuPOHfefg' },
            { title: 'Solve JS coding problems with examples', url: 'https://www.youtube.com/watch?v=s3cUE6iz9A0', videoId: 's3cUE6iz9A0' },
        ],
    },
    'js-problems-sde3': {
        articles: [{ title: 'Tricky JS questions (repo)', url: 'https://github.com/lydiahallie/javascript-questions', source: 'github.com' }],
        videos: [
            { title: 'JS questions for senior developers', url: 'https://www.youtube.com/watch?v=SLWNw5Btqyw', videoId: 'SLWNw5Btqyw' },
            { title: 'Advanced JS interview questions', url: 'https://www.youtube.com/watch?v=-8qfwR-ANDk', videoId: '-8qfwR-ANDk' },
            { title: 'Top advanced JS interview questions', url: 'https://www.youtube.com/watch?v=O1UizGrR79U', videoId: 'O1UizGrR79U' },
        ],
    },
    'problems': {
        articles: [{ title: 'Front-End System Design Playbook', url: 'https://www.greatfrontend.com/front-end-system-design-playbook', source: 'greatfrontend.com' }],
        videos: [
            { title: 'Machine coding round with questions', url: 'https://www.youtube.com/watch?v=GSq_GqJ-PuQ', videoId: 'GSq_GqJ-PuQ' },
            { title: 'Machine coding for frontend developers', url: 'https://www.youtube.com/watch?v=98A5o2_1twI', videoId: '98A5o2_1twI' },
            { title: '30 React machine-coding projects', url: 'https://www.youtube.com/watch?v=IgWWQT5njag', videoId: 'IgWWQT5njag' },
        ],
    },
    'approach-and-core-components': {
        articles: [{ title: 'Front-End System Design Playbook', url: 'https://www.greatfrontend.com/front-end-system-design-playbook', source: 'greatfrontend.com' }],
        videos: [
            { title: 'How to crack front-end coding (LLD)', url: 'https://www.youtube.com/watch?v=yun65Nk8_vQ', videoId: 'yun65Nk8_vQ' },
            { title: 'Toast component — HLD & LLD', url: 'https://www.youtube.com/watch?v=v50uJDEFnqM', videoId: 'v50uJDEFnqM' },
            { title: 'Front-end system design: LLD & HLD', url: 'https://www.youtube.com/watch?v=LtfvBTLXB_4', videoId: 'LtfvBTLXB_4' },
        ],
    },
    'form-and-input-components': {
        articles: [
            { title: '<input> (MDN / React)', url: 'https://react.dev/reference/react-dom/components/input', source: 'react.dev' },
            { title: 'React Hook Form', url: 'https://react-hook-form.com', source: 'react-hook-form.com' },
        ],
        videos: [
            { title: 'Reusable input field component', url: 'https://www.youtube.com/watch?v=HIFxC7Gkgfo', videoId: 'HIFxC7Gkgfo' },
            { title: 'Reusable form input UI component', url: 'https://www.youtube.com/watch?v=0uK9z3_WElY', videoId: '0uK9z3_WElY' },
            { title: 'Reusable create/edit form (RHF + Zod)', url: 'https://www.youtube.com/watch?v=_XQ_9qaQsQU', videoId: '_XQ_9qaQsQU' },
        ],
    },
    'layout-and-data-display': {
        articles: [{ title: 'TanStack Table', url: 'https://github.com/TanStack/table', source: 'github.com' }],
        videos: [
            { title: 'Data table grid with sorting & filter', url: 'https://www.youtube.com/watch?v=EbcrnicjwQE', videoId: 'EbcrnicjwQE' },
            { title: 'Create a React data table component', url: 'https://www.youtube.com/watch?v=Wn3MvmKiRrE', videoId: 'Wn3MvmKiRrE' },
            { title: 'Build a table component in React', url: 'https://www.youtube.com/watch?v=5NFLXEKmQSs', videoId: '5NFLXEKmQSs' },
        ],
    },
    'applications-and-advanced': {
        articles: [{ title: 'Thinking in React', url: 'https://react.dev/learn/thinking-in-react', source: 'react.dev' }],
        videos: [
            { title: 'Quiz app — machine coding', url: 'https://www.youtube.com/watch?v=TF1FKrzsRDM', videoId: 'TF1FKrzsRDM' },
            { title: 'Cinema hall seat booking', url: 'https://www.youtube.com/watch?v=9NV9OhnPKGo', videoId: '9NV9OhnPKGo' },
            { title: 'Multi-step form — machine coding', url: 'https://www.youtube.com/watch?v=LdMlBwKEnaU', videoId: 'LdMlBwKEnaU' },
        ],
    },
    'interview-guide': {
        articles: [{ title: 'Front-End Interview Playbook', url: 'https://www.greatfrontend.com/front-end-interview-playbook', source: 'greatfrontend.com' }],
        videos: [
            { title: 'How to prepare for front-end interviews', url: 'https://www.youtube.com/watch?v=i6s4FhqlSwM', videoId: 'i6s4FhqlSwM' },
            { title: 'Ultimate front-end interview prep guide', url: 'https://www.youtube.com/watch?v=i5gRxiQFupU', videoId: 'i5gRxiQFupU' },
            { title: 'How to prepare for FE coding interviews', url: 'https://www.youtube.com/watch?v=YM-9nPLqezQ', videoId: 'YM-9nPLqezQ' },
        ],
    },
    'quick-revision-sheets': {
        articles: [
            { title: 'JS interview questions (repo)', url: 'https://github.com/sudheerj/javascript-interview-questions', source: 'github.com' },
            { title: 'The Modern JavaScript Tutorial', url: 'https://javascript.info', source: 'javascript.info' },
        ],
        videos: [
            { title: 'JavaScript revision & interview cheat sheet', url: 'https://www.youtube.com/watch?v=xejr5Uv_sAQ', videoId: 'xejr5Uv_sAQ' },
            { title: 'The only JavaScript cheat sheet you need', url: 'https://www.youtube.com/watch?v=qxICCY9eNwk', videoId: 'qxICCY9eNwk' },
            { title: 'DSA cheat sheet for coding interviews', url: 'https://www.youtube.com/watch?v=Zed1QNWVQx8', videoId: 'Zed1QNWVQx8' },
        ],
    },
};

/** Strip a leading lesson number like "1.1 — " or "23. " from a title. */
function cleanTitle(title: string): string {
    return title.replace(/^\s*\d+[a-z]?(\.\d+)?\s*[—.\-:]*\s*/i, '').trim();
}

/**
 * References for a topic. Returns curated links when available, otherwise
 * builds live search links from the topic title so the rail is never empty.
 */
export function getTopicReferences(slug: string, title: string, kitName?: string): TopicRefs {
    const curated = CURATED[slug];
    if (curated) return curated;

    const subject = cleanTitle(title);
    const context = kitName?.toLowerCase().includes('react')
        ? 'react'
        : kitName?.toLowerCase().includes('node')
            ? 'node.js'
            : 'javascript';
    const q = `${subject} ${context}`.trim();

    return {
        articles: [
            { title: `Articles about “${subject}”`, url: google(`${q} tutorial`), source: 'Google' },
            { title: `${subject} on MDN`, url: google(`${subject} MDN web docs`), source: 'MDN' },
        ],
        videos: [
            { title: `“${subject}” — video explainers`, url: yt(`${q} explained`) },
            { title: `${subject} interview questions`, url: yt(`${q} interview questions`) },
        ],
    };
}

/** True when this topic has hand-picked references (vs. search fallbacks). */
export function hasCuratedReferences(slug: string): boolean {
    return slug in CURATED;
}
