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
    /* ── Node.js Backend Kit references (68 topics, verified links) ── */
    "what-is-nodejs": {"articles":[{"title":"Introduction to Node.js","url":"https://nodejs.org/en/learn/getting-started/introduction-to-nodejs","source":"nodejs.org"},{"title":"Node.js server without a framework","url":"https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Node_server_without_framework","source":"developer.mozilla.org"}],"videos":[{"title":"Node.js Ultimate Beginner's Guide in 7 Easy Steps","url":"https://www.youtube.com/watch?v=ENrzD9HAZK4","videoId":"ENrzD9HAZK4","channel":"Fireship"},{"title":"Learn Node.js - Full Tutorial for Beginners","url":"https://www.youtube.com/watch?v=RLtyhwFtXQA","videoId":"RLtyhwFtXQA","channel":"freeCodeCamp.org"}]},
    "node-vs-browser": {"articles":[{"title":"Differences between Node.js and the Browser","url":"https://nodejs.org/en/learn/getting-started/differences-between-nodejs-and-the-browser","source":"nodejs.org"},{"title":"Introduction to Node.js","url":"https://nodejs.org/en/learn/getting-started/introduction-to-nodejs","source":"nodejs.org"}],"videos":[{"title":"Node.js Ultimate Beginner's Guide in 7 Easy Steps","url":"https://www.youtube.com/watch?v=ENrzD9HAZK4","videoId":"ENrzD9HAZK4","channel":"Fireship"}]},
    "v8-and-libuv": {"articles":[{"title":"The V8 JavaScript Engine","url":"https://nodejs.org/en/learn/getting-started/the-v8-javascript-engine","source":"nodejs.org"},{"title":"The Node.js Event Loop","url":"https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick","source":"nodejs.org"}],"videos":[{"title":"What the heck is the event loop anyway? | Philip Roberts | JSConf EU","url":"https://www.youtube.com/watch?v=8aGhZQkoFbQ","videoId":"8aGhZQkoFbQ","channel":"JSConf"}]},
    "global-process-env": {"articles":[{"title":"Process | Node.js API Documentation","url":"https://nodejs.org/api/process.html","source":"nodejs.org"},{"title":"Global objects | Node.js API Documentation","url":"https://nodejs.org/api/globals.html","source":"nodejs.org"},{"title":"How to read environment variables from Node.js","url":"https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs","source":"nodejs.org"}],"videos":[{"title":"Learn Node.js - Full Tutorial for Beginners","url":"https://www.youtube.com/watch?v=RLtyhwFtXQA","videoId":"RLtyhwFtXQA","channel":"freeCodeCamp.org"}]},
    "running-node-repl": {"articles":[{"title":"How to use the Node.js REPL","url":"https://nodejs.org/en/learn/command-line/how-to-use-the-nodejs-repl","source":"nodejs.org"},{"title":"Run Node.js scripts from the command line","url":"https://nodejs.org/en/learn/command-line/run-nodejs-scripts-from-the-command-line","source":"nodejs.org"},{"title":"REPL | Node.js API Documentation","url":"https://nodejs.org/api/repl.html","source":"nodejs.org"}],"videos":[{"title":"Node.js Crash Course","url":"https://www.youtube.com/watch?v=fBNz5xF-Kx4","videoId":"fBNz5xF-Kx4","channel":"Traversy Media"}]},
    "event-loop-phases": {"articles":[{"title":"The Node.js Event Loop","url":"https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick","source":"nodejs.org"},{"title":"Overview of Blocking vs Non-Blocking","url":"https://nodejs.org/en/learn/asynchronous-work/overview-of-blocking-vs-non-blocking","source":"nodejs.org"},{"title":"Don't Block the Event Loop (or the Worker Pool)","url":"https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop","source":"nodejs.org"}],"videos":[{"title":"This is how the Node.js Event Loop really works","url":"https://www.youtube.com/watch?v=paI6J8my3Yw","videoId":"paI6J8my3Yw","channel":"Software Developer Diaries"},{"title":"What the heck is the event loop anyway? | Philip Roberts | JSConf EU","url":"https://www.youtube.com/watch?v=8aGhZQkoFbQ","videoId":"8aGhZQkoFbQ","channel":"JSConf"}]},
    "libuv-thread-pool": {"articles":[{"title":"Thread pool work scheduling","url":"https://docs.libuv.org/en/v1.x/threadpool.html","source":"docs.libuv.org"},{"title":"Don't Block the Event Loop (or the Worker Pool)","url":"https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop","source":"nodejs.org"}],"videos":[{"title":"Node.js Tutorial - 39 - Thread Pool","url":"https://www.youtube.com/watch?v=I1sqnbJ1Fno","videoId":"I1sqnbJ1Fno","channel":"Codevolution"},{"title":"This is how the Node.js Event Loop really works","url":"https://www.youtube.com/watch?v=paI6J8my3Yw","videoId":"paI6J8my3Yw","channel":"Software Developer Diaries"}]},
    "nexttick-vs-setimmediate": {"articles":[{"title":"The Node.js Event Loop (process.nextTick vs setImmediate)","url":"https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick","source":"nodejs.org"},{"title":"Understanding setImmediate()","url":"https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate","source":"nodejs.org"},{"title":"process.nextTick(callback[, ...args]) — API docs","url":"https://nodejs.org/api/process.html","source":"nodejs.org"},{"title":"setImmediate(callback[, ...args]) — Timers API docs","url":"https://nodejs.org/api/timers.html","source":"nodejs.org"}],"videos":[{"title":"This is how the Node.js Event Loop really works","url":"https://www.youtube.com/watch?v=paI6J8my3Yw","videoId":"paI6J8my3Yw","channel":"Software Developer Diaries"}]},
    "microtasks-vs-macrotasks": {"articles":[{"title":"Using microtasks in JavaScript with queueMicrotask()","url":"https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide","source":"developer.mozilla.org"},{"title":"In depth: Microtasks and the JavaScript runtime environment","url":"https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide/In_depth","source":"developer.mozilla.org"},{"title":"Understanding setImmediate() (nextTick / microtask / macrotask queue order)","url":"https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate","source":"nodejs.org"}],"videos":[{"title":"JavaScript Visualized - Event Loop, Web APIs, (Micro)task Queue","url":"https://www.youtube.com/watch?v=eiC58R16hb8","videoId":"eiC58R16hb8","channel":"Lydia Hallie"},{"title":"Jake Archibald: In The Loop — event loop, setTimeout, micro tasks (JSConf.Asia)","url":"https://www.youtube.com/watch?v=cCOL7MC4Pl0","videoId":"cCOL7MC4Pl0","channel":"JSConf"}]},
    "blocking-event-loop": {"articles":[{"title":"Don't Block the Event Loop (or the Worker Pool)","url":"https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop","source":"nodejs.org"},{"title":"Overview of Blocking vs Non-Blocking","url":"https://nodejs.org/en/learn/asynchronous-work/overview-of-blocking-vs-non-blocking","source":"nodejs.org"}],"videos":[{"title":"What the heck is the event loop anyway? | Philip Roberts | JSConf EU","url":"https://www.youtube.com/watch?v=8aGhZQkoFbQ","videoId":"8aGhZQkoFbQ","channel":"JSConf"},{"title":"This is how the Node.js Event Loop really works","url":"https://www.youtube.com/watch?v=paI6J8my3Yw","videoId":"paI6J8my3Yw","channel":"Software Developer Diaries"}]},
    "commonjs-modules": {"articles":[{"title":"Modules: CommonJS modules","url":"https://nodejs.org/api/modules.html","source":"nodejs.org"},{"title":"JavaScript modules (import / export)","url":"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules","source":"developer.mozilla.org"}],"videos":[{"title":"Node JS Tutorial for Beginners #6 - Modules and require()","url":"https://www.youtube.com/watch?v=xHLd36QoS4k","videoId":"xHLd36QoS4k","channel":"Net Ninja"},{"title":"How to Import and Export Modules in Node JS (CommonJS)","url":"https://www.youtube.com/watch?v=XTND4rjATXA","videoId":"XTND4rjATXA","channel":"Nikita Dev"}]},
    "es-modules": {"articles":[{"title":"Modules: ECMAScript modules","url":"https://nodejs.org/api/esm.html","source":"nodejs.org"},{"title":"JavaScript modules (import / export)","url":"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules","source":"developer.mozilla.org"}],"videos":[{"title":"ESM vs CommonJS in your Node Projects","url":"https://www.youtube.com/watch?v=I3DrifH-rJE","videoId":"I3DrifH-rJE","channel":"Covalence"}]},
    "module-resolution": {"articles":[{"title":"Modules: Packages (resolution, exports, imports)","url":"https://nodejs.org/api/packages.html","source":"nodejs.org"},{"title":"Modules: CommonJS modules (module resolution algorithm)","url":"https://nodejs.org/api/modules.html","source":"nodejs.org"}],"videos":[{"title":"Node JS Tutorial for Beginners #7 - Module Patterns","url":"https://www.youtube.com/watch?v=9UaZtgB5tQI","videoId":"9UaZtgB5tQI","channel":"Net Ninja"}]},
    "package-json-semver": {"articles":[{"title":"package.json","url":"https://docs.npmjs.com/cli/v10/configuring-npm/package-json","source":"docs.npmjs.com"},{"title":"About semantic versioning","url":"https://docs.npmjs.com/about-semantic-versioning","source":"docs.npmjs.com"},{"title":"Modules: Packages (package.json fields)","url":"https://nodejs.org/api/packages.html","source":"nodejs.org"}],"videos":[{"title":"NPM Semantic Versioning (SemVer) Explained for Beginners!","url":"https://www.youtube.com/watch?v=3GmNhGBow7Q","videoId":"3GmNhGBow7Q","channel":"CodeLucky"}]},
    "npm-and-scripts": {"articles":[{"title":"scripts","url":"https://docs.npmjs.com/cli/v10/using-npm/scripts","source":"docs.npmjs.com"},{"title":"An introduction to the npm package manager","url":"https://nodejs.org/en/learn/getting-started/an-introduction-to-the-npm-package-manager","source":"nodejs.org"},{"title":"npm run-script","url":"https://docs.npmjs.com/cli/v10/commands/npm-run-script","source":"docs.npmjs.com"}],"videos":[{"title":"NPM Scripts | Define Custom Scripts in package.json","url":"https://www.youtube.com/watch?v=4oz0rqoB6VM","videoId":"4oz0rqoB6VM","channel":"Rapid Tutor"},{"title":"Node.js Crash Course","url":"https://www.youtube.com/watch?v=fBNz5xF-Kx4","videoId":"fBNz5xF-Kx4","channel":"Traversy Media"}]},
    "callbacks": {"articles":[{"title":"JavaScript Asynchronous Programming and Callbacks","url":"https://nodejs.org/en/learn/asynchronous-work/javascript-asynchronous-programming-and-callbacks","source":"nodejs.org"},{"title":"Introducing asynchronous JavaScript","url":"https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Async_JS/Introducing","source":"developer.mozilla.org"}],"videos":[{"title":"Async JS Crash Course - Callbacks, Promises, Async Await","url":"https://www.youtube.com/watch?v=PoRJizFvM7s","videoId":"PoRJizFvM7s","channel":"Traversy Media"},{"title":"Error First Callback Patterns in JS","url":"https://www.youtube.com/watch?v=0pNo1O42m6k","videoId":"0pNo1O42m6k","channel":"Steve Griffith - Prof3ssorSt3v3"}]},
    "promises": {"articles":[{"title":"Using promises","url":"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises","source":"developer.mozilla.org"},{"title":"Promise","url":"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise","source":"developer.mozilla.org"},{"title":"Promise.prototype.then()","url":"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then","source":"developer.mozilla.org"}],"videos":[{"title":"JavaScript Promise in 100 Seconds","url":"https://www.youtube.com/watch?v=RvYYCGs45L4","videoId":"RvYYCGs45L4","channel":"Fireship"},{"title":"JavaScript Promises In 10 Minutes","url":"https://www.youtube.com/watch?v=DHvZLI7Db8E","videoId":"DHvZLI7Db8E","channel":"Web Dev Simplified"}]},
    "error-handling-async": {"articles":[{"title":"try...catch","url":"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch","source":"developer.mozilla.org"},{"title":"Node.js Errors","url":"https://nodejs.org/api/errors.html","source":"nodejs.org"}],"videos":[{"title":"JavaScript Async Await","url":"https://www.youtube.com/watch?v=V_Kr9OSfDeU","videoId":"V_Kr9OSfDeU","channel":"Web Dev Simplified"},{"title":"Async JS Crash Course - Callbacks, Promises, Async Await","url":"https://www.youtube.com/watch?v=PoRJizFvM7s","videoId":"PoRJizFvM7s","channel":"Traversy Media"}]},
    "eventemitter": {"articles":[{"title":"Events (EventEmitter) API","url":"https://nodejs.org/api/events.html","source":"nodejs.org"},{"title":"The Node.js Event emitter","url":"https://nodejs.org/en/learn/asynchronous-work/the-nodejs-event-emitter","source":"nodejs.org"}],"videos":[{"title":"Node JS Tutorial for Beginners #8 - The Node Event Emitter","url":"https://www.youtube.com/watch?v=NtrnaTKqFPQ","videoId":"NtrnaTKqFPQ","channel":"Net Ninja"},{"title":"Node.js \"Event Emitters\" Explained","url":"https://www.youtube.com/watch?v=wINRm5arVlM","videoId":"wINRm5arVlM","channel":"Software Developer Diaries"}]},
    "fs-module": {"articles":[{"title":"File system | Node.js Documentation","url":"https://nodejs.org/api/fs.html","source":"nodejs.org"},{"title":"Reading files with Node.js","url":"https://nodejs.org/en/learn/manipulating-files/reading-files-with-nodejs","source":"nodejs.org"},{"title":"Working with file descriptors in Node.js","url":"https://nodejs.org/en/learn/manipulating-files/working-with-file-descriptors-in-nodejs","source":"nodejs.org"}],"videos":[{"title":"A Beginner's Guide To The File System Module In Node.js","url":"https://www.youtube.com/watch?v=QkwHP4d01xA","videoId":"QkwHP4d01xA","channel":"Catalin Pit"}]},
    "path-os-url": {"articles":[{"title":"Path | Node.js Documentation","url":"https://nodejs.org/api/path.html","source":"nodejs.org"},{"title":"OS | Node.js Documentation","url":"https://nodejs.org/api/os.html","source":"nodejs.org"},{"title":"URL | Node.js Documentation","url":"https://nodejs.org/api/url.html","source":"nodejs.org"},{"title":"Node.js File Paths","url":"https://nodejs.org/en/learn/manipulating-files/nodejs-file-paths","source":"nodejs.org"}],"videos":[{"title":"Node JS Path Module | path.resolve | path.join | path.normalize","url":"https://www.youtube.com/watch?v=BapA-vG9HZI","videoId":"BapA-vG9HZI","channel":"Tech Altum Tutorial"}]},
    "buffer": {"articles":[{"title":"Buffer | Node.js Documentation","url":"https://nodejs.org/api/buffer.html","source":"nodejs.org"},{"title":"Uint8Array - JavaScript | MDN","url":"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array","source":"developer.mozilla.org"}],"videos":[{"title":"Node.js Tutorial - 24 - Streams and Buffers","url":"https://www.youtube.com/watch?v=br8VB99qPzE","videoId":"br8VB99qPzE","channel":"Codevolution"}]},
    "crypto": {"articles":[{"title":"Crypto | Node.js Documentation","url":"https://nodejs.org/api/crypto.html","source":"nodejs.org"},{"title":"Web Crypto API | Node.js Documentation","url":"https://nodejs.org/api/webcrypto.html","source":"nodejs.org"},{"title":"Web Crypto API | MDN","url":"https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API","source":"developer.mozilla.org"}],"videos":[{"title":"7 Cryptography Concepts EVERY Developer Should Know","url":"https://www.youtube.com/watch?v=NuyzuNBFWxQ","videoId":"NuyzuNBFWxQ","channel":"Fireship"}]},
    "timers": {"articles":[{"title":"Timers | Node.js Documentation","url":"https://nodejs.org/api/timers.html","source":"nodejs.org"},{"title":"Discover JavaScript Timers","url":"https://nodejs.org/learn/asynchronous-work/discover-javascript-timers","source":"nodejs.org"}],"videos":[{"title":"Node.js Timers (setTimeout, setInterval, setImmediate)","url":"https://www.youtube.com/watch?v=hkvCtgxdaMU","videoId":"hkvCtgxdaMU","channel":"Thomas Gentilhomme"}]},
    "streams-overview": {"articles":[{"title":"Stream | Node.js Documentation","url":"https://nodejs.org/api/stream.html","source":"nodejs.org"},{"title":"How To Use Streams | Node.js Learn","url":"https://nodejs.org/en/learn/modules/how-to-use-streams","source":"nodejs.org"},{"title":"Streams API | MDN","url":"https://developer.mozilla.org/en-US/docs/Web/API/Streams_API","source":"developer.mozilla.org"}],"videos":[{"title":"How to use \"Streams\" to improve performance in Node.js?","url":"https://www.youtube.com/watch?v=VSBq9Q7QrGk","videoId":"VSBq9Q7QrGk","channel":"Software Developer Diaries"},{"title":"Everything You Should Know about Node.js Streams","url":"https://www.youtube.com/watch?v=BdePYKgrMh0","videoId":"BdePYKgrMh0","channel":"Erick Wendel"}]},
    "readable-writable": {"articles":[{"title":"Stream | Node.js Documentation","url":"https://nodejs.org/api/stream.html","source":"nodejs.org"},{"title":"Node.js Streams: Everything you need to know","url":"https://www.freecodecamp.org/news/node-js-streams-everything-you-need-to-know-c9141306be93","source":"freecodecamp.org"}],"videos":[{"title":"Learn Node.js Streams in 25 minutes | NodeJS Tutorials for Beginners","url":"https://www.youtube.com/watch?v=EcznOgzOdxI","videoId":"EcznOgzOdxI","channel":"Dipesh Malvia"}]},
    "transform-duplex": {"articles":[{"title":"Stream | Node.js Documentation","url":"https://nodejs.org/api/stream.html","source":"nodejs.org"},{"title":"Node.js Streams: Everything you need to know","url":"https://www.freecodecamp.org/news/node-js-streams-everything-you-need-to-know-c9141306be93","source":"freecodecamp.org"}],"videos":[{"title":"Learn Node.js Streams in 25 minutes | NodeJS Tutorials for Beginners","url":"https://www.youtube.com/watch?v=EcznOgzOdxI","videoId":"EcznOgzOdxI","channel":"Dipesh Malvia"}]},
    "backpressure-piping": {"articles":[{"title":"Backpressuring in Streams | Node.js Learn","url":"https://nodejs.org/en/learn/modules/backpressuring-in-streams","source":"nodejs.org"},{"title":"Stream | Node.js Documentation","url":"https://nodejs.org/api/stream.html","source":"nodejs.org"}],"videos":[{"title":"Node.js Streams EXPLAINED: Backpressure, Buffer Overflow & drain Event","url":"https://www.youtube.com/watch?v=scASodUqlbo","videoId":"scASodUqlbo","channel":"Leela Web Dev"}]},
    "http-module": {"articles":[{"title":"HTTP | Node.js Documentation","url":"https://nodejs.org/api/http.html","source":"nodejs.org"},{"title":"Introduction to Node.js | Node.js Learn","url":"https://nodejs.org/en/learn/getting-started/introduction-to-nodejs","source":"nodejs.org"},{"title":"Overview of HTTP | MDN","url":"https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview","source":"developer.mozilla.org"}],"videos":[{"title":"How to Create a Simple HTTP Server in Node.js | HTTP Module Basics","url":"https://www.youtube.com/watch?v=qNDUQ-hLeoE","videoId":"qNDUQ-hLeoE","channel":"ProgrammingKnowledge"}]},
    "request-response": {"articles":[{"title":"HTTP messages | MDN","url":"https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages","source":"developer.mozilla.org"},{"title":"Overview of HTTP | MDN","url":"https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview","source":"developer.mozilla.org"},{"title":"HTTP | Node.js Documentation","url":"https://nodejs.org/api/http.html","source":"nodejs.org"}],"videos":[{"title":"How to Create a Simple HTTP Server in Node.js | HTTP Module Basics","url":"https://www.youtube.com/watch?v=qNDUQ-hLeoE","videoId":"qNDUQ-hLeoE","channel":"ProgrammingKnowledge"}]},
    "routing-basics": {"articles":[{"title":"HTTP | Node.js Documentation","url":"https://nodejs.org/api/http.html","source":"nodejs.org"},{"title":"Introduction to Node.js | Node.js Learn","url":"https://nodejs.org/en/learn/getting-started/introduction-to-nodejs","source":"nodejs.org"}],"videos":[{"title":"How to Handle Different Routes in Node.js HTTP Module | Build Custom Routing Logic","url":"https://www.youtube.com/watch?v=7efjCmL9Bss","videoId":"7efjCmL9Bss","channel":"ProgrammingKnowledge"}]},
    "http-vs-https-tls": {"articles":[{"title":"HTTPS | Node.js Documentation","url":"https://nodejs.org/api/https.html","source":"nodejs.org"},{"title":"TLS (SSL) | Node.js Documentation","url":"https://nodejs.org/api/tls.html","source":"nodejs.org"},{"title":"Transport Layer Security (TLS) | MDN","url":"https://developer.mozilla.org/en-US/docs/Glossary/TLS","source":"developer.mozilla.org"},{"title":"Evolution of HTTP | MDN","url":"https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Evolution_of_HTTP","source":"developer.mozilla.org"}],"videos":[{"title":"The TLS Handshake Explained with Example (the Math)","url":"https://www.youtube.com/watch?v=64geP_LAZ5U","videoId":"64geP_LAZ5U","channel":"Hussein Nasser"}]},
    "express-basics": {"articles":[{"title":"Hello world example","url":"https://expressjs.com/en/starter/hello-world.html","source":"expressjs.com"},{"title":"Express 4.x API Reference","url":"https://expressjs.com/en/4x/api.html","source":"expressjs.com"}],"videos":[{"title":"Express JS Crash Course","url":"https://www.youtube.com/watch?v=L72fhGm1tfE","videoId":"L72fhGm1tfE","channel":"Traversy Media"},{"title":"Learn Express JS In 35 Minutes","url":"https://www.youtube.com/watch?v=SccSCuHhOw0","videoId":"SccSCuHhOw0","channel":"Web Dev Simplified"}]},
    "express-routing": {"articles":[{"title":"Routing","url":"https://expressjs.com/en/guide/routing.html","source":"expressjs.com"},{"title":"Basic routing","url":"https://expressjs.com/en/starter/basic-routing.html","source":"expressjs.com"}],"videos":[{"title":"Node.js Crash Course Tutorial #11 - Express Router & MVC","url":"https://www.youtube.com/watch?v=zW_tZR0Ir3Q","videoId":"zW_tZR0Ir3Q","channel":"Net Ninja"}]},
    "middleware": {"articles":[{"title":"Using middleware","url":"https://expressjs.com/en/guide/using-middleware.html","source":"expressjs.com"},{"title":"Writing middleware for use in Express apps","url":"https://expressjs.com/en/guide/writing-middleware.html","source":"expressjs.com"}],"videos":[{"title":"Learn Express Middleware In 14 Minutes","url":"https://www.youtube.com/watch?v=lY6icfhap2o","videoId":"lY6icfhap2o","channel":"Web Dev Simplified"}]},
    "express-error-handling": {"articles":[{"title":"Error Handling","url":"https://expressjs.com/en/guide/error-handling.html","source":"expressjs.com"},{"title":"Using middleware","url":"https://expressjs.com/en/guide/using-middleware.html","source":"expressjs.com"}],"videos":[{"title":"REST API Tutorial (Node, Express & Mongo) #10 - Error Handling","url":"https://www.youtube.com/watch?v=w1V2SdzdQBs","videoId":"w1V2SdzdQBs","channel":"Net Ninja"}]},
    "req-res": {"articles":[{"title":"Request Object (req)","url":"https://expressjs.com/en/4x/api/request.html","source":"expressjs.com"},{"title":"Response Object (res)","url":"https://expressjs.com/en/4x/api/response.html","source":"expressjs.com"}],"videos":[{"title":"Node.js and Express.js - Full Course","url":"https://www.youtube.com/watch?v=Oe421EPjeBE","videoId":"Oe421EPjeBE","channel":"freeCodeCamp.org"}]},
    "rest-principles": {"articles":[{"title":"REST - MDN Web Docs Glossary","url":"https://developer.mozilla.org/en-US/docs/Glossary/REST","source":"developer.mozilla.org"},{"title":"An overview of HTTP","url":"https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview","source":"developer.mozilla.org"},{"title":"Web API Design Best Practices - Azure Architecture Center","url":"https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design","source":"learn.microsoft.com"}],"videos":[{"title":"REST API concepts and examples","url":"https://www.youtube.com/watch?v=7YcW25PHnAA","videoId":"7YcW25PHnAA","channel":"WebConcepts"},{"title":"APIs for Beginners - How to use an API (Full Course / Tutorial)","url":"https://www.youtube.com/watch?v=WXsD0ZgxjRw","videoId":"WXsD0ZgxjRw","channel":"freeCodeCamp.org"}]},
    "crud-status-codes": {"articles":[{"title":"HTTP response status codes","url":"https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status","source":"developer.mozilla.org"},{"title":"HTTP request methods","url":"https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods","source":"developer.mozilla.org"}],"videos":[{"title":"Learn HTTP Status Codes In 10 Minutes","url":"https://www.youtube.com/watch?v=wJa5CTIFj7U","videoId":"wJa5CTIFj7U","channel":"Web Dev Simplified"}]},
    "validation-pagination": {"articles":[{"title":"express-validator - Getting Started","url":"https://express-validator.github.io/docs/","source":"express-validator.github.io"},{"title":"cursor.skip() - MongoDB Manual (Pagination)","url":"https://www.mongodb.com/docs/manual/reference/method/cursor.skip/","source":"www.mongodb.com"},{"title":"Mongoose Queries (limit, skip, sort)","url":"https://mongoosejs.com/docs/queries.html","source":"mongoosejs.com"}],"videos":[{"title":"Create A Paginated API With Node.js - Complete Tutorial","url":"https://www.youtube.com/watch?v=ZX3qt0UWifc","videoId":"ZX3qt0UWifc","channel":"Web Dev Simplified"}]},
    "api-versioning": {"articles":[{"title":"Web API Design Best Practices (API Versioning) - Azure Architecture Center","url":"https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design","source":"learn.microsoft.com"},{"title":"Microsoft Azure REST API Guidelines - API Versioning","url":"https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md","source":"github.com"}],"videos":[{"title":"API Versioning Explained | Lightboard Series","url":"https://www.youtube.com/watch?v=_WWr_eFRDeM","videoId":"_WWr_eFRDeM","channel":"MuleSoft Videos"}]},
    "mongodb-mongoose": {"articles":[{"title":"Getting Started with Mongoose","url":"https://mongoosejs.com/docs/index.html","source":"mongoosejs.com"},{"title":"Mongoose Schemas Guide","url":"https://mongoosejs.com/docs/guide.html","source":"mongoosejs.com"},{"title":"Mongoose Validation","url":"https://mongoosejs.com/docs/validation.html","source":"mongoosejs.com"}],"videos":[{"title":"Mongoose Crash Course - Beginner Through Advanced","url":"https://www.youtube.com/watch?v=DZBGEVgL2eE","videoId":"DZBGEVgL2eE","channel":"Web Dev Simplified"},{"title":"MongoDB Tutorial #1 - Introduction to MongoDB","url":"https://www.youtube.com/watch?v=9OPP_1eAENg","videoId":"9OPP_1eAENg","channel":"Net Ninja"}]},
    "schema-design": {"articles":[{"title":"Data Modeling in MongoDB","url":"https://www.mongodb.com/docs/manual/data-modeling/","source":"www.mongodb.com"},{"title":"Data Model Design (Embedding vs Referencing)","url":"https://www.mongodb.com/docs/manual/core/data-model-design/","source":"www.mongodb.com"},{"title":"Mongoose Schemas Guide","url":"https://mongoosejs.com/docs/guide.html","source":"mongoosejs.com"}],"videos":[{"title":"MongoDB Data Modeling and Schema Fundamentals | From Relational to Document Model","url":"https://www.youtube.com/watch?v=hmGz79ae2AY","videoId":"hmGz79ae2AY","channel":"MongoDB"},{"title":"A Complete Methodology of Data Modeling for MongoDB","url":"https://www.youtube.com/watch?v=DUCvYbcgGsQ","videoId":"DUCvYbcgGsQ","channel":"MongoDB"}]},
    "sql-basics": {"articles":[{"title":"node-postgres — PostgreSQL client for Node.js","url":"https://node-postgres.com/","source":"node-postgres.com"},{"title":"The SQL Language (PostgreSQL Tutorial, Chapter 2)","url":"https://www.postgresql.org/docs/current/tutorial-sql.html","source":"www.postgresql.org"},{"title":"MySQL 8.0 Reference Manual: Tutorial","url":"https://dev.mysql.com/doc/refman/8.0/en/tutorial.html","source":"dev.mysql.com"}],"videos":[{"title":"SQL Tutorial - Full Database Course for Beginners","url":"https://www.youtube.com/watch?v=HXV3zeQKqGY","videoId":"HXV3zeQKqGY","channel":"freeCodeCamp.org"}]},
    "connection-pooling": {"articles":[{"title":"Connection Pooling — node-postgres","url":"https://node-postgres.com/features/pooling","source":"node-postgres.com"},{"title":"Connection Pool — Sequelize","url":"https://sequelize.org/docs/v6/other-topics/connection-pool/","source":"sequelize.org"},{"title":"Connection pool (Wikipedia)","url":"https://en.wikipedia.org/wiki/Connection_pool","source":"en.wikipedia.org"}],"videos":[{"title":"Connection Pooling in PostgresSQL with NodeJS (Performance Numbers)","url":"https://www.youtube.com/watch?v=GTeCtIoV2Tw","videoId":"GTeCtIoV2Tw","channel":"Hussein Nasser"}]},
    "transactions": {"articles":[{"title":"Transactions (PostgreSQL Tutorial, Section 3.4)","url":"https://www.postgresql.org/docs/current/tutorial-transactions.html","source":"www.postgresql.org"},{"title":"START TRANSACTION, COMMIT, and ROLLBACK Statements (MySQL 8.0)","url":"https://dev.mysql.com/doc/refman/8.0/en/commit.html","source":"dev.mysql.com"},{"title":"ACID (Wikipedia)","url":"https://en.wikipedia.org/wiki/ACID","source":"en.wikipedia.org"},{"title":"Transactions — MongoDB Manual","url":"https://www.mongodb.com/docs/manual/core/transactions/","source":"www.mongodb.com"}],"videos":[{"title":"Relational Database ACID Transactions (Explained by Example)","url":"https://www.youtube.com/watch?v=pomxJOFVcQs","videoId":"pomxJOFVcQs","channel":"Hussein Nasser"}]},
    "authentication-basics": {"articles":[{"title":"Authentication Cheat Sheet — OWASP","url":"https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html","source":"cheatsheetseries.owasp.org"},{"title":"Authorization Cheat Sheet — OWASP","url":"https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html","source":"cheatsheetseries.owasp.org"},{"title":"HTTP authentication — MDN","url":"https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Authentication","source":"developer.mozilla.org"}],"videos":[{"title":"Auth0 in 100 Seconds // And beyond with a Next.js Authentication Tutorial","url":"https://www.youtube.com/watch?v=yufqeJLP1rI","videoId":"yufqeJLP1rI","channel":"Fireship"}]},
    "jwt": {"articles":[{"title":"Introduction to JSON Web Tokens","url":"https://jwt.io/introduction","source":"jwt.io"},{"title":"JSON Web Token Cheat Sheet — OWASP","url":"https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html","source":"cheatsheetseries.owasp.org"},{"title":"RFC 7519: JSON Web Token (JWT)","url":"https://datatracker.ietf.org/doc/html/rfc7519","source":"datatracker.ietf.org"}],"videos":[{"title":"JWT Authentication Tutorial - Node.js","url":"https://www.youtube.com/watch?v=mbsmsi7l3r4","videoId":"mbsmsi7l3r4","channel":"Web Dev Simplified"}]},
    "sessions-cookies": {"articles":[{"title":"Using HTTP cookies — MDN","url":"https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies","source":"developer.mozilla.org"},{"title":"Session Management Cheat Sheet — OWASP","url":"https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html","source":"cheatsheetseries.owasp.org"},{"title":"Set-Cookie header — MDN","url":"https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie","source":"developer.mozilla.org"}],"videos":[{"title":"Session vs Token Authentication in 100 Seconds","url":"https://www.youtube.com/watch?v=UBUNrFtufWo","videoId":"UBUNrFtufWo","channel":"Fireship"}]},
    "password-hashing": {"articles":[{"title":"Password Storage Cheat Sheet","url":"https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html","source":"cheatsheetseries.owasp.org"},{"title":"bcrypt for Node.js (node.bcrypt.js)","url":"https://github.com/kelektiv/node.bcrypt.js","source":"github.com"},{"title":"Crypto — scrypt & pbkdf2 (Node.js API)","url":"https://nodejs.org/api/crypto.html","source":"nodejs.org"}],"videos":[{"title":"Node Password Hashing with bcrypt","url":"https://www.youtube.com/watch?v=esa_t_-PJ6A","videoId":"esa_t_-PJ6A","channel":"WittCode"}]},
    "web-security-owasp": {"articles":[{"title":"OWASP Top Ten Web Application Security Risks","url":"https://owasp.org/www-project-top-ten/","source":"owasp.org"},{"title":"OWASP Cheat Sheet Series","url":"https://cheatsheetseries.owasp.org/","source":"cheatsheetseries.owasp.org"},{"title":"Web security (MDN)","url":"https://developer.mozilla.org/en-US/docs/Web/Security","source":"developer.mozilla.org"}],"videos":[{"title":"OWASP API Security Top 10 Course – Secure Your Web Apps","url":"https://www.youtube.com/watch?v=YYe0FdfdgDU","videoId":"YYe0FdfdgDU","channel":"freeCodeCamp.org"}]},
    "error-handling-patterns": {"articles":[{"title":"Errors (Node.js API)","url":"https://nodejs.org/api/errors.html","source":"nodejs.org"},{"title":"try...catch — JavaScript (MDN)","url":"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch","source":"developer.mozilla.org"}],"videos":[{"title":"Error Handling in NodeJS (Complete Guide) | Node Tutorial","url":"https://www.youtube.com/watch?v=mGPj-pCGS2c","videoId":"mGPj-pCGS2c","channel":"Nikita Dev"}]},
    "uncaught-unhandled": {"articles":[{"title":"Process — 'uncaughtException' & 'unhandledRejection' events (Node.js API)","url":"https://nodejs.org/api/process.html","source":"nodejs.org"},{"title":"Errors (Node.js API)","url":"https://nodejs.org/api/errors.html","source":"nodejs.org"}],"videos":[]},
    "debugging-nodejs": {"articles":[{"title":"Debugging Node.js","url":"https://nodejs.org/en/learn/getting-started/debugging","source":"nodejs.org"},{"title":"Debugger (Node.js API)","url":"https://nodejs.org/api/debugger.html","source":"nodejs.org"}],"videos":[{"title":"Getting started with Node.js debugging in VS Code","url":"https://www.youtube.com/watch?v=2oFKNL7vYV8","videoId":"2oFKNL7vYV8","channel":"Visual Studio Code"}]},
    "logging": {"articles":[{"title":"Pino — Super fast, all natural JSON logger for Node.js","url":"https://getpino.io/","source":"getpino.io"},{"title":"winston — A logger for just about everything","url":"https://github.com/winstonjs/winston","source":"github.com"}],"videos":[{"title":"The BEST Way to Log in Node.js - Winston","url":"https://www.youtube.com/watch?v=He7Dc6DuxdI","videoId":"He7Dc6DuxdI","channel":"Better Stack"},{"title":"Node.js Logging Like a Pro: Centralized Logs Using Pino Transport, Loki & Grafana","url":"https://www.youtube.com/watch?v=d1VRuGpJd10","videoId":"d1VRuGpJd10","channel":"Code with Jay"}]},
    "unit-testing": {"articles":[{"title":"Node.js Test Runner (node:test)","url":"https://nodejs.org/api/test.html","source":"nodejs.org"},{"title":"Discovering Node.js's test runner","url":"https://nodejs.org/en/learn/test-runner/introduction","source":"nodejs.org"},{"title":"Jest: Getting Started","url":"https://jestjs.io/docs/getting-started","source":"jestjs.io"}],"videos":[{"title":"Jest Crash Course - Unit Testing in JavaScript","url":"https://www.youtube.com/watch?v=7r4xVDI2vho","videoId":"7r4xVDI2vho","channel":"Traversy Media"}]},
    "integration-testing": {"articles":[{"title":"SuperTest - HTTP assertions for Node.js servers","url":"https://github.com/ladjs/supertest","source":"github.com"},{"title":"Node.js Test Runner (node:test)","url":"https://nodejs.org/api/test.html","source":"nodejs.org"},{"title":"Jest: Getting Started","url":"https://jestjs.io/docs/getting-started","source":"jestjs.io"}],"videos":[{"title":"Supertest express tutorial | Node REST API testing","url":"https://www.youtube.com/watch?v=T2sYitv2OAY","videoId":"T2sYitv2OAY","channel":"Jan Goebel"}]},
    "mocking-coverage": {"articles":[{"title":"Jest: Mock Functions","url":"https://jestjs.io/docs/mock-functions","source":"jestjs.io"},{"title":"Jest: Configuring code coverage (collectCoverage, coverageThreshold)","url":"https://jestjs.io/docs/configuration","source":"jestjs.io"},{"title":"Node.js test runner: mocking & code coverage","url":"https://nodejs.org/api/test.html","source":"nodejs.org"}],"videos":[{"title":"Testing with Jest - Mock Function","url":"https://www.youtube.com/watch?v=sVX6LNiNAeA","videoId":"sVX6LNiNAeA","channel":"Piotr N"}]},
    "cluster-module": {"articles":[{"title":"Node.js Cluster module","url":"https://nodejs.org/api/cluster.html","source":"nodejs.org"},{"title":"Node.js Worker Threads (cluster vs threads)","url":"https://nodejs.org/api/worker_threads.html","source":"nodejs.org"}],"videos":[{"title":"Scaling your Node.js app using the \"cluster\" module","url":"https://www.youtube.com/watch?v=6lHvks6R6cI","videoId":"6lHvks6R6cI","channel":"Software Developer Diaries"}]},
    "worker-threads": {"articles":[{"title":"Node.js Worker Threads (worker_threads)","url":"https://nodejs.org/api/worker_threads.html","source":"nodejs.org"},{"title":"Node.js Cluster module (process-level vs thread-level)","url":"https://nodejs.org/api/cluster.html","source":"nodejs.org"}],"videos":[{"title":"Multithreading in Node.js with Worker Threads Explained","url":"https://www.youtube.com/watch?v=JTl6tQ4bqYA","videoId":"JTl6tQ4bqYA","channel":"logicBase Labs"}]},
    "child-processes": {"articles":[{"title":"Node.js Child Process (spawn / exec / execFile / fork)","url":"https://nodejs.org/api/child_process.html","source":"nodejs.org"},{"title":"Node.js Cluster module (built on child_process.fork)","url":"https://nodejs.org/api/cluster.html","source":"nodejs.org"}],"videos":[{"title":"All you need to know about \"child_process\" in Node.js","url":"https://www.youtube.com/watch?v=C1v4MXGhpcM","videoId":"C1v4MXGhpcM","channel":"Software Developer Diaries"}]},
    "caching-redis": {"articles":[{"title":"node-redis guide (connect a Node.js app to Redis)","url":"https://redis.io/docs/latest/develop/clients/nodejs/","source":"redis.io"},{"title":"node-redis: Production usage (errors, reconnection, timeouts)","url":"https://redis.io/docs/latest/develop/clients/nodejs/produsage/","source":"redis.io"}],"videos":[{"title":"Redis Crash Course","url":"https://www.youtube.com/watch?v=jgpVdJB2sKQ","videoId":"jgpVdJB2sKQ","channel":"Web Dev Simplified"}]},
    "pm2-docker": {"articles":[{"title":"PM2 Quick Start","url":"https://pm2.keymetrics.io/docs/usage/quick-start/","source":"pm2.keymetrics.io"},{"title":"Containerize a Node.js application (Docker guide)","url":"https://docs.docker.com/guides/nodejs/","source":"docs.docker.com"}],"videos":[{"title":"How to Use PM2 for Node.js Application Management","url":"https://www.youtube.com/watch?v=_6nxB2RiSKI","videoId":"_6nxB2RiSKI","channel":"Code With KASA"},{"title":"How to Build Node.js Apps with Docker | Dockerize Node.js and Express Apps","url":"https://www.youtube.com/watch?v=nH47lsxvY9c","videoId":"nH47lsxvY9c","channel":"Dipesh Malvia"}]},
    "graceful-shutdown": {"articles":[{"title":"Node.js process: signal events (SIGTERM/SIGINT) & exit","url":"https://nodejs.org/api/process.html","source":"nodejs.org"},{"title":"Node.js http: server.close() for draining connections","url":"https://nodejs.org/api/http.html","source":"nodejs.org"}],"videos":[{"title":"Here's how to Gracefully Shutdown your apps (with Node.js examples)","url":"https://www.youtube.com/watch?v=-OjPhPV6Rjs","videoId":"-OjPhPV6Rjs","channel":"Software Developer Diaries"}]},
    "websockets": {"articles":[{"title":"Socket.IO v4 Documentation - Introduction","url":"https://socket.io/docs/v4/","source":"socket.io"},{"title":"The WebSocket API (MDN)","url":"https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API","source":"developer.mozilla.org"}],"videos":[{"title":"WebSockets in 100 Seconds & Beyond with Socket.io","url":"https://www.youtube.com/watch?v=1BfCnjr_Vjg","videoId":"1BfCnjr_Vjg","channel":"Fireship"}]},
    "graphql-basics": {"articles":[{"title":"Learn GraphQL - Introduction, Queries & Schema","url":"https://graphql.org/learn/","source":"graphql.org"},{"title":"Getting Started With GraphQL.js (Node.js)","url":"https://graphql.org/graphql-js/","source":"graphql.org"}],"videos":[{"title":"Learn GraphQL In 22 Minutes (crash course)","url":"https://www.youtube.com/watch?v=QwpIvFwTTPI","videoId":"QwpIvFwTTPI","channel":"SWE with Vivek Bharatha"}]},
    "microservices": {"articles":[{"title":"Microservices (Martin Fowler & James Lewis)","url":"https://martinfowler.com/articles/microservices.html","source":"martinfowler.com"},{"title":"Pattern: Microservice Architecture","url":"https://microservices.io/patterns/microservices.html","source":"microservices.io"}],"videos":[{"title":"What Are Microservices Really All About? (And When Not To Use It)","url":"https://www.youtube.com/watch?v=lTAcCNbJ7KE","videoId":"lTAcCNbJ7KE","channel":"ByteByteGo"}]},
    "message-queues": {"articles":[{"title":"RabbitMQ Tutorial - \"Hello World!\" (JavaScript/amqplib)","url":"https://www.rabbitmq.com/tutorials/tutorial-one-javascript","source":"rabbitmq.com"},{"title":"RabbitMQ Tutorial - Work Queues (JavaScript/amqplib)","url":"https://www.rabbitmq.com/tutorials/tutorial-two-javascript","source":"rabbitmq.com"}],"videos":[{"title":"Kafka vs RabbitMQ: The Best Message Queue Explained","url":"https://www.youtube.com/watch?v=PQHf_IzmUXE","videoId":"PQHf_IzmUXE","channel":"The Coding Gopher"}]},
    /* ── Angular Interview Kit references (60 topics, verified links) ── */
    "introduction-to-angular": {"articles":[{"title":"What is Angular?","url":"https://angular.dev/overview","source":"angular.dev"},{"title":"Essentials: A short introduction to Angular's main concepts","url":"https://angular.dev/essentials","source":"angular.dev"}],"videos":[{"title":"Introduction to Angular","url":"https://www.youtube.com/watch?v=qxchrt04bTA","videoId":"qxchrt04bTA","channel":"Chrome for Developers"},{"title":"Angular Tutorial for Beginners - Web Framework with Typescript Course","url":"https://www.youtube.com/watch?v=AAu8bjj6-UI","videoId":"AAu8bjj6-UI","channel":"freeCodeCamp.org"}]},
    "angular-architecture": {"articles":[{"title":"Components overview","url":"https://angular.dev/guide/components","source":"angular.dev"},{"title":"Dependency injection in Angular","url":"https://angular.dev/guide/di","source":"angular.dev"},{"title":"Essentials: Angular's core concepts","url":"https://angular.dev/essentials","source":"angular.dev"}],"videos":[{"title":"Master Angular: Understanding Architecture & Building Blocks","url":"https://www.youtube.com/watch?v=C7TirNFpRgQ","videoId":"C7TirNFpRgQ","channel":"CrioDo"},{"title":"Architecture of an Angular application","url":"https://www.youtube.com/watch?v=laicOZbQRMY","videoId":"laicOZbQRMY","channel":"GeneXus Training"}]},
    "cli-project-structure": {"articles":[{"title":"The Angular CLI","url":"https://angular.dev/tools/cli","source":"angular.dev"},{"title":"Workspace and project file structure","url":"https://angular.dev/reference/configs/file-structure","source":"angular.dev"},{"title":"Setting up the local environment and workspace","url":"https://angular.dev/tools/cli/setup-local","source":"angular.dev"}],"videos":[{"title":"How to Setup Angular Project | Folder Structure | Angular 17","url":"https://www.youtube.com/watch?v=sgTySymt99I","videoId":"sgTySymt99I","channel":"LEARNING PARTNER"},{"title":"Angular Project Structure : Part 3","url":"https://www.youtube.com/watch?v=eOe8ihI-i_o","videoId":"eOe8ihI-i_o","channel":"helpmecoder"}]},
    "bootstrap-flow": {"articles":[{"title":"bootstrapApplication API reference","url":"https://angular.dev/api/platform-browser/bootstrapApplication","source":"angular.dev"},{"title":"Components overview (root component)","url":"https://angular.dev/guide/components","source":"angular.dev"}],"videos":[{"title":"How does Angular works? - Bootstrapping - angular.json, index.html, main.ts","url":"https://www.youtube.com/watch?v=CF-cFgPGknk","videoId":"CF-cFgPGknk","channel":"Programming with Felipe Gavilan"},{"title":"Angular 11 Bootstrapping Process | How angular loads first component","url":"https://www.youtube.com/watch?v=BCmXodjbNLE","videoId":"BCmXodjbNLE","channel":"Coding Learning Hub"}]},
    "standalone-vs-ngmodule": {"articles":[{"title":"Migrate to standalone components","url":"https://angular.dev/reference/migrations/standalone","source":"angular.dev"},{"title":"Components overview (standalone by default)","url":"https://angular.dev/guide/components","source":"angular.dev"}],"videos":[{"title":"Angular Standalone Components Explained: The Complete Guide (v17 & Higher)","url":"https://www.youtube.com/watch?v=2SubpkPOE7M","videoId":"2SubpkPOE7M","channel":"procademy"},{"title":"Standalone Components vs Traditional NgModules - Interview Questions","url":"https://www.youtube.com/watch?v=lNWh0Jbe4BM","videoId":"lNWh0Jbe4BM","channel":"Adnan Halilovic"}]},
    "lifecycle-hooks": {"articles":[{"title":"Component lifecycle","url":"https://angular.dev/guide/components/lifecycle","source":"angular.dev"},{"title":"Components overview","url":"https://angular.dev/guide/components","source":"angular.dev"}],"videos":[{"title":"Component Lifecycle Hooks in Angular with real world example","url":"https://www.youtube.com/watch?v=hn1c8F51UVA","videoId":"hn1c8F51UVA","channel":"WebGentle"},{"title":"Angular 16 Life Cycle Hooks - Explained with Examples","url":"https://www.youtube.com/watch?v=Qts7H8P-FpI","videoId":"Qts7H8P-FpI","channel":"Programming with Umair"}]},
    "data-binding": {"articles":[{"title":"Binding dynamic text, properties and attributes","url":"https://angular.dev/guide/templates/binding","source":"angular.dev"},{"title":"Template syntax overview","url":"https://angular.dev/guide/templates","source":"angular.dev"}],"videos":[{"title":"Angular 16 Tutorial - Data Binding and Types #3","url":"https://www.youtube.com/watch?v=E5kle3LPVV8","videoId":"E5kle3LPVV8","channel":"Programming with Umair"},{"title":"What is Data Binding in Angular | Angular 19 Tutorial | Part 3","url":"https://www.youtube.com/watch?v=NcEMG7OfxGY","videoId":"NcEMG7OfxGY","channel":"LEARNING PARTNER"}]},
    "input-output": {"articles":[{"title":"Accepting data with input properties","url":"https://angular.dev/guide/components/inputs","source":"angular.dev"},{"title":"Custom events with outputs","url":"https://angular.dev/guide/components/outputs","source":"angular.dev"}],"videos":[{"title":"Mastering Angular 18's @Input and @Output for Seamless Data Sharing","url":"https://www.youtube.com/watch?v=eEIXfMFm1eY","videoId":"eEIXfMFm1eY","channel":"Learn Smart Coding"},{"title":"Angular Component Communication: @Input/@Output vs. Services","url":"https://www.youtube.com/watch?v=4WCEwG1RDWM","videoId":"4WCEwG1RDWM","channel":"CodingForBeginners"}]},
    "viewchild-contentchild": {"articles":[{"title":"Referencing component children with queries","url":"https://angular.dev/guide/components/queries","source":"angular.dev"},{"title":"Components overview","url":"https://angular.dev/guide/components","source":"angular.dev"}],"videos":[{"title":"@ViewChild in Angular | Angular Tutorial","url":"https://www.youtube.com/watch?v=H4NrzZj5FIQ","videoId":"H4NrzZj5FIQ","channel":"WebGentle"},{"title":"Angular @ContentChild & @ContentChildren - (Tutorial 40)","url":"https://www.youtube.com/watch?v=bt6d9RJJsi8","videoId":"bt6d9RJJsi8","channel":"Nisha Singla"}]},
    "view-encapsulation": {"articles":[{"title":"Styling components and view encapsulation","url":"https://angular.dev/guide/components/styling","source":"angular.dev"},{"title":"Using shadow DOM","url":"https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM","source":"developer.mozilla.org"}],"videos":[{"title":"3 View Encapsulation Modes in Angular Explained | Shadow DOM vs Emulated vs None","url":"https://www.youtube.com/watch?v=CLKoSNRtGyg","videoId":"CLKoSNRtGyg","channel":"Technical Rajni"},{"title":"Understand View Encapsulation in Angular. Difference between Emulated, None, and Shadow Dom","url":"https://www.youtube.com/watch?v=bUITojTRMnM","videoId":"bUITojTRMnM","channel":"Leela Web Dev"}]},
    "structural-vs-attribute": {"articles":[{"title":"Directives (attribute directives)","url":"https://angular.dev/guide/directives","source":"angular.dev"},{"title":"Structural directives","url":"https://angular.dev/guide/directives/structural-directives","source":"angular.dev"}],"videos":[{"title":"Angular | Components vs Structural vs Attribute Directives","url":"https://www.youtube.com/watch?v=GhO136gKJ0g","videoId":"GhO136gKJ0g","channel":"Code Radiance"},{"title":"Angular 6 - Directives, Structural Directives, Attribute Directives and Component Directives","url":"https://www.youtube.com/watch?v=HRhENpdYhPM","videoId":"HRhENpdYhPM","channel":"CodeWithSrini"}]},
    "control-flow": {"articles":[{"title":"Control flow (@if / @for / @switch)","url":"https://angular.dev/guide/templates/control-flow","source":"angular.dev"},{"title":"Template syntax overview","url":"https://angular.dev/guide/templates","source":"angular.dev"}],"videos":[{"title":"Angular 17 Tutorial - New Control Flow @if @for and @switch #6","url":"https://www.youtube.com/watch?v=l0QlgYqwQZk","videoId":"l0QlgYqwQZk","channel":"Programming with Umair"},{"title":"Mastering Angular 18's Control Flow: @for, @if, @switch, and RedirectTo function","url":"https://www.youtube.com/watch?v=y0qhaudxIZI","videoId":"y0qhaudxIZI","channel":"JSgigs"}]},
    "custom-directives": {"articles":[{"title":"Building attribute directives","url":"https://angular.dev/guide/directives","source":"angular.dev"},{"title":"Directive composition API","url":"https://angular.dev/guide/directives/directive-composition-api","source":"angular.dev"},{"title":"Host elements, HostBinding and HostListener","url":"https://angular.dev/guide/components/host-elements","source":"angular.dev"}],"videos":[{"title":"Create a Custom Directive in Angular | Highlight Directive Step by Step","url":"https://www.youtube.com/watch?v=ojSeAvSUF_I","videoId":"ojSeAvSUF_I","channel":"CodingForBeginners"},{"title":"Structural Directives in Angular - How to Create Custom Directive","url":"https://www.youtube.com/watch?v=07CaGlbMPbw","videoId":"07CaGlbMPbw","channel":"Decoded Frontend"}]},
    "pure-impure-pipes": {"articles":[{"title":"Pipes (pure and impure pipes)","url":"https://angular.dev/guide/templates/pipes","source":"angular.dev"},{"title":"Template syntax overview","url":"https://angular.dev/guide/templates","source":"angular.dev"}],"videos":[{"title":"Angular 17 Tutorial #35 - Pure vs Impure Pipe in Angular","url":"https://www.youtube.com/watch?v=0fPpg3wh0cg","videoId":"0fPpg3wh0cg","channel":"ARCTutorials"},{"title":"Angular | Pure vs Impure Pipes | What are the differences between Pure and Impure Pipes","url":"https://www.youtube.com/watch?v=GOSzA27iIdA","videoId":"GOSzA27iIdA","channel":"LearnLift-Eng"}]},
    "async-pipe": {"articles":[{"title":"AsyncPipe API reference","url":"https://angular.dev/api/common/AsyncPipe","source":"angular.dev"},{"title":"RxJS Introduction / Overview","url":"https://rxjs.dev/guide/overview","source":"rxjs.dev"}],"videos":[{"title":"Working with the AsyncPipe in Angular 19: Simplify Your Observables","url":"https://www.youtube.com/watch?v=kRZRL6TzaOs","videoId":"kRZRL6TzaOs","channel":"Technical Rajni"},{"title":"How to use the ASYNC PIPE effectively in Angular Templates","url":"https://www.youtube.com/watch?v=ev1yE0SYs9Y","videoId":"ev1yE0SYs9Y","channel":"Joshua Morony"}]},
    "what-is-di": {"articles":[{"title":"Dependency injection in Angular (Overview)","url":"https://angular.dev/guide/di","source":"angular.dev"},{"title":"Creating and using an injectable service","url":"https://angular.dev/guide/di/creating-and-using-services","source":"angular.dev"}],"videos":[{"title":"Angular Dependency Injection - Explained in easy words","url":"https://www.youtube.com/watch?v=B0FVAoG5srQ","videoId":"B0FVAoG5srQ","channel":"tutorialsEU"},{"title":"Dependency Injection in-depth | Advanced Angular","url":"https://www.youtube.com/watch?v=z7-Uk3WPYHE","videoId":"z7-Uk3WPYHE","channel":"Web Tech Talk"}]},
    "providers-injectors": {"articles":[{"title":"Defining dependency providers (useClass / useValue / useFactory / tokens)","url":"https://angular.dev/guide/di/defining-dependency-providers","source":"angular.dev"},{"title":"Injection context","url":"https://angular.dev/guide/di/dependency-injection-context","source":"angular.dev"},{"title":"Dependency injection in Angular (Overview)","url":"https://angular.dev/guide/di","source":"angular.dev"}],"videos":[{"title":"Angular Dependency Injection - Understanding Providers and Injection Tokens","url":"https://www.youtube.com/watch?v=tA9tuKbg5Yk","videoId":"tA9tuKbg5Yk","channel":"Angular University"}]},
    "provider-scope": {"articles":[{"title":"Creating and using an injectable service (providedIn: 'root')","url":"https://angular.dev/guide/di/creating-and-using-services","source":"angular.dev"},{"title":"Hierarchical injectors (environment vs element injectors)","url":"https://angular.dev/guide/di/hierarchical-dependency-injection","source":"angular.dev"},{"title":"Defining dependency providers","url":"https://angular.dev/guide/di/defining-dependency-providers","source":"angular.dev"}],"videos":[{"title":"Angular Dependency Injection – Understanding hierarchical injectors (2021)","url":"https://www.youtube.com/watch?v=G8zXugcYd7o","videoId":"G8zXugcYd7o","channel":"Decoded Frontend"},{"title":"Angular Tutorial - 18 - Dependency Injection","url":"https://www.youtube.com/watch?v=OFPIGlxunL0","videoId":"OFPIGlxunL0","channel":"Codevolution"}]},
    "hierarchical-injectors": {"articles":[{"title":"Hierarchical injectors and resolution modifiers","url":"https://angular.dev/guide/di/hierarchical-dependency-injection","source":"angular.dev"},{"title":"Injection context","url":"https://angular.dev/guide/di/dependency-injection-context","source":"angular.dev"}],"videos":[{"title":"Angular Dependency Injection – Understanding hierarchical injectors","url":"https://www.youtube.com/watch?v=G8zXugcYd7o","videoId":"G8zXugcYd7o","channel":"Decoded Frontend"}]},
    "inject-function": {"articles":[{"title":"inject() API reference","url":"https://angular.dev/api/core/inject","source":"angular.dev"},{"title":"Injection context (using inject() vs constructor injection)","url":"https://angular.dev/guide/di/dependency-injection-context","source":"angular.dev"}],"videos":[{"title":"Angular Inject Function - Better Than Constructor","url":"https://www.youtube.com/watch?v=SMFhsSQvsEc","videoId":"SMFhsSQvsEc","channel":"Monsterlessons Academy"}]},
    "observables-vs-promises": {"articles":[{"title":"Observable","url":"https://rxjs.dev/guide/observable","source":"rxjs.dev"},{"title":"Promise","url":"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise","source":"developer.mozilla.org"},{"title":"RxJS Introduction","url":"https://rxjs.dev/guide/overview","source":"rxjs.dev"}],"videos":[{"title":"The Biggest Misconception of PROMISES vs OBSERVABLES","url":"https://www.youtube.com/watch?v=vdsujUhFMLY","videoId":"vdsujUhFMLY","channel":"Joshua Morony"},{"title":"How are Observables Different from Promises? | Beginner RXJS Lessons","url":"https://www.youtube.com/watch?v=GSI7iyK_ju4","videoId":"GSI7iyK_ju4","channel":"NeverBenBetter"}]},
    "flattening-operators": {"articles":[{"title":"Higher-order Observables","url":"https://rxjs.dev/guide/higher-order-observables","source":"rxjs.dev"},{"title":"switchMap","url":"https://rxjs.dev/api/operators/switchMap","source":"rxjs.dev"},{"title":"mergeMap","url":"https://rxjs.dev/api/operators/mergeMap","source":"rxjs.dev"},{"title":"concatMap","url":"https://rxjs.dev/api/operators/concatMap","source":"rxjs.dev"}],"videos":[{"title":"Map, switchMap, mergeMap, flatMap, concatMap, exhaustMap in RxJS - what is the difference?","url":"https://www.youtube.com/watch?v=2zJRw3Cl_Vs","videoId":"2zJRw3Cl_Vs","channel":"Monsterlessons Academy"},{"title":"switchMap vs mergeMap vs concatMap vs exhaustMap practical guide!","url":"https://www.youtube.com/watch?v=40pC5wHowWw","videoId":"40pC5wHowWw","channel":"TheAngularGuy"}]},
    "subjects": {"articles":[{"title":"Subject (Subject, BehaviorSubject, ReplaySubject, AsyncSubject)","url":"https://rxjs.dev/guide/subject","source":"rxjs.dev"},{"title":"Observable","url":"https://rxjs.dev/guide/observable","source":"rxjs.dev"}],"videos":[{"title":"RxJs Subject - Subject, BehaviorSubject, ReplaySubject, AsyncSubject","url":"https://www.youtube.com/watch?v=5foQB5Qpock","videoId":"5foQB5Qpock","channel":"The Code Captain"},{"title":"Angular Essentials - Subjects vs BehaviorSubject vs ReplaySubject vs AsyncSubject + Source code","url":"https://www.youtube.com/watch?v=gcqZ2RbVZXE","videoId":"gcqZ2RbVZXE","channel":"Eric Programming"}]},
    "subscription-management": {"articles":[{"title":"Subscription","url":"https://rxjs.dev/guide/subscription","source":"rxjs.dev"},{"title":"takeUntilDestroyed API reference","url":"https://angular.dev/api/core/rxjs-interop/takeUntilDestroyed","source":"angular.dev"}],"videos":[{"title":"Use takeUntilDestroyed to Unsubscribe from Angular's Observables","url":"https://www.youtube.com/watch?v=Cr4NRfZxaP0","videoId":"Cr4NRfZxaP0","channel":"Deborah Kurata"},{"title":"Stop Your Angular Apps From LEAKING Memory!","url":"https://www.youtube.com/watch?v=1H613_7E-yE","videoId":"1H613_7E-yE","channel":"Code with Ahsan"}]},
    "signals": {"articles":[{"title":"Angular Signals (Overview)","url":"https://angular.dev/guide/signals","source":"angular.dev"},{"title":"Signal effects (effect())","url":"https://angular.dev/guide/signals/effect","source":"angular.dev"}],"videos":[{"title":"Computed Signals and Effects in-depth | Angular Signals","url":"https://www.youtube.com/watch?v=fEOkVoGFUwA","videoId":"fEOkVoGFUwA","channel":"NomadCoder"}]},
    "router-params": {"articles":[{"title":"Read route state (route params, query params, ActivatedRoute)","url":"https://angular.dev/guide/routing/read-route-state","source":"angular.dev"},{"title":"ActivatedRoute API reference","url":"https://angular.dev/api/router/ActivatedRoute","source":"angular.dev"},{"title":"Other common routing tasks","url":"https://angular.dev/guide/routing/common-router-tasks","source":"angular.dev"}],"videos":[{"title":"Angular - How to get query params from url using router","url":"https://www.youtube.com/watch?v=njYRW2MiasQ","videoId":"njYRW2MiasQ","channel":"Alex Khymenko"},{"title":"Angular 18: How to Easily Get Query Parameters from Route","url":"https://www.youtube.com/watch?v=PCQaD6kF4og","videoId":"PCQaD6kF4og","channel":"Adnan Halilovic"}]},
    "lazy-loading": {"articles":[{"title":"Route loading strategies (loadComponent / loadChildren)","url":"https://angular.dev/guide/routing/loading-strategies","source":"angular.dev"},{"title":"Angular Routing (Overview)","url":"https://angular.dev/guide/routing","source":"angular.dev"}],"videos":[{"title":"Modern Angular Lazy Loading Guide!","url":"https://www.youtube.com/watch?v=IJ3FGb3wn3U","videoId":"IJ3FGb3wn3U","channel":"Zoaib Khan"},{"title":"Loadcomponent() Vs LoadChildren() | Angular tutorial","url":"https://www.youtube.com/watch?v=4RkQ-VHWEtw","videoId":"4RkQ-VHWEtw","channel":"Tech Sharmit"}]},
    "route-guards": {"articles":[{"title":"Control route access with guards (CanActivate / CanMatch)","url":"https://angular.dev/guide/routing/route-guards","source":"angular.dev"},{"title":"Route data resolvers","url":"https://angular.dev/guide/routing/data-resolvers","source":"angular.dev"}],"videos":[{"title":"Angular Functional Route Guards Explained","url":"https://www.youtube.com/watch?v=S-oYPntMGeU","videoId":"S-oYPntMGeU","channel":"Web Tech Talk"},{"title":"Angular 14 Functional Router Guards: What They Are & How to Use Them","url":"https://www.youtube.com/watch?v=pD8vzZs559I","videoId":"pD8vzZs559I","channel":"Code Shots With Profanis"}]},
    "child-routes": {"articles":[{"title":"Show routes with outlets (router-outlet, nested/child routes)","url":"https://angular.dev/guide/routing/show-routes-with-outlets","source":"angular.dev"},{"title":"Other common routing tasks (child routes)","url":"https://angular.dev/guide/routing/common-router-tasks","source":"angular.dev"}],"videos":[{"title":"Angular 10 Tutorial - Nested Routing and Child Routes","url":"https://www.youtube.com/watch?v=-IoWuCZKxrc","videoId":"-IoWuCZKxrc","channel":"Surfside Media"},{"title":"Angular child routes and how to implement nested routing","url":"https://www.youtube.com/watch?v=6sdpyU9Zwns","videoId":"6sdpyU9Zwns","channel":"CodeSpace"}]},
    "template-vs-reactive-forms": {"articles":[{"title":"Forms overview","url":"https://angular.dev/guide/forms","source":"angular.dev"},{"title":"Reactive forms","url":"https://angular.dev/guide/forms/reactive-forms","source":"angular.dev"},{"title":"Template-driven forms","url":"https://angular.dev/guide/forms/template-driven-forms","source":"angular.dev"}],"videos":[{"title":"Why Use Angular Template Driven Forms Vs Model Driven or Reactive?","url":"https://www.youtube.com/watch?v=JsJp7sTKZHo","videoId":"JsJp7sTKZHo","channel":"Angular University"},{"title":"Reactive vs Template-driven Angular Forms Explained! Which One Should You Use?","url":"https://www.youtube.com/watch?v=MEbGUcj1fJE","videoId":"MEbGUcj1fJE","channel":"Leela Web Dev"}]},
    "reactive-forms-api": {"articles":[{"title":"Reactive forms","url":"https://angular.dev/guide/forms/reactive-forms","source":"angular.dev"},{"title":"FormGroup API","url":"https://angular.dev/api/forms/FormGroup","source":"angular.dev"},{"title":"FormControl API","url":"https://angular.dev/api/forms/FormControl","source":"angular.dev"},{"title":"FormArray API","url":"https://angular.dev/api/forms/FormArray","source":"angular.dev"}],"videos":[{"title":"Angular reactive forms","url":"https://www.youtube.com/watch?v=VLYc3ACWL-E","videoId":"VLYc3ACWL-E","channel":"kudvenkat"}]},
    "httpclient": {"articles":[{"title":"HTTP client overview","url":"https://angular.dev/guide/http","source":"angular.dev"},{"title":"Setting up HttpClient","url":"https://angular.dev/guide/http/setup","source":"angular.dev"},{"title":"Making HTTP requests","url":"https://angular.dev/guide/http/making-requests","source":"angular.dev"}],"videos":[{"title":"Angular HTTP Client Quick Start Tutorial","url":"https://www.youtube.com/watch?v=_05v0mrNLh0","videoId":"_05v0mrNLh0","channel":"Fireship"},{"title":"Angular Tutorial - 21 - Fetch Data Using HTTP","url":"https://www.youtube.com/watch?v=LmIsbzt-S_E","videoId":"LmIsbzt-S_E","channel":"Codevolution"}]},
    "http-interceptors": {"articles":[{"title":"Intercepting requests and responses","url":"https://angular.dev/guide/http/interceptors","source":"angular.dev"},{"title":"Setting up HttpClient (withInterceptors)","url":"https://angular.dev/guide/http/setup","source":"angular.dev"}],"videos":[{"title":"Angular 18 HTTP Interceptors Explained! Functional vs DI-Based Interceptors","url":"https://www.youtube.com/watch?v=kR9z8IX3Zno","videoId":"kR9z8IX3Zno","channel":"Leela Web Dev"},{"title":"Angular 18 Functional Interceptors: The Best Way to Handle HTTP Requests!","url":"https://www.youtube.com/watch?v=YJiw2vYr_lE","videoId":"YJiw2vYr_lE","channel":"Leela Web Dev"}]},
    "auth-interceptor": {"articles":[{"title":"Intercepting requests and responses (auth example)","url":"https://angular.dev/guide/http/interceptors","source":"angular.dev"},{"title":"Setting up HttpClient (withInterceptors)","url":"https://angular.dev/guide/http/setup","source":"angular.dev"},{"title":"Making HTTP requests","url":"https://angular.dev/guide/http/making-requests","source":"angular.dev"}],"videos":[{"title":"Angular 19 Tutorial | What is Interceptor | JWT login in Angular | Part 27","url":"https://www.youtube.com/watch?v=I27bRQC5gEY","videoId":"I27bRQC5gEY","channel":"LEARNING PARTNER"}]},
    "change-detection-strategies": {"articles":[{"title":"Skipping component subtrees (OnPush)","url":"https://angular.dev/best-practices/skipping-subtrees","source":"angular.dev"},{"title":"ChangeDetectionStrategy API","url":"https://angular.dev/api/core/ChangeDetectionStrategy","source":"angular.dev"},{"title":"Runtime performance optimization","url":"https://angular.dev/best-practices/runtime-performance","source":"angular.dev"}],"videos":[{"title":"Angular OnPush Change Detection - How Does it Work?","url":"https://www.youtube.com/watch?v=qklnVKgxMIY","videoId":"qklnVKgxMIY","channel":"Angular University"}]},
    "zonejs-zoneless": {"articles":[{"title":"Angular without ZoneJS (Zoneless)","url":"https://angular.dev/guide/zoneless","source":"angular.dev"},{"title":"Skipping component subtrees","url":"https://angular.dev/best-practices/skipping-subtrees","source":"angular.dev"},{"title":"Runtime performance optimization","url":"https://angular.dev/best-practices/runtime-performance","source":"angular.dev"}],"videos":[{"title":"WTF is \"Zone.js\" and is it making your app slow?","url":"https://www.youtube.com/watch?v=lmrf_gPIOZU","videoId":"lmrf_gPIOZU","channel":"Joshua Morony"}]},
    "trackby-cdref": {"articles":[{"title":"Control flow (@for and track)","url":"https://angular.dev/guide/templates/control-flow","source":"angular.dev"},{"title":"ChangeDetectorRef API","url":"https://angular.dev/api/core/ChangeDetectorRef","source":"angular.dev"},{"title":"Skipping component subtrees","url":"https://angular.dev/best-practices/skipping-subtrees","source":"angular.dev"}],"videos":[{"title":"Master Angular Change Detection | markForCheck, detectChanges, OnPush","url":"https://www.youtube.com/watch?v=L7ZCipJHACc","videoId":"L7ZCipJHACc","channel":"Angular"}]},
    "aot-jit": {"articles":[{"title":"Ahead-of-time (AOT) compilation","url":"https://angular.dev/tools/cli/aot-compiler","source":"angular.dev"},{"title":"Building Angular apps","url":"https://angular.dev/tools/cli/build","source":"angular.dev"}],"videos":[{"title":"Angular | Beginner to Pro #169 - JIT vs AOT Compilation [By Mosh Hamedani]","url":"https://www.youtube.com/watch?v=T4TeEoOQcS8","videoId":"T4TeEoOQcS8","channel":"Coding Codes"},{"title":"Angular aot vs jit","url":"https://www.youtube.com/watch?v=-h_zSpjL4TY","videoId":"-h_zSpjL4TY","channel":"kudvenkat"}]},
    "ngrx-overview": {"articles":[{"title":"NgRx Store","url":"https://ngrx.io/guide/store","source":"ngrx.io"},{"title":"NgRx Effects","url":"https://ngrx.io/guide/effects","source":"ngrx.io"},{"title":"NgRx Selectors","url":"https://ngrx.io/guide/store/selectors","source":"ngrx.io"}],"videos":[{"title":"Angular 19 + NgRx Store Tutorial | API Data with Actions, Reducers, Effects, and Selectors","url":"https://www.youtube.com/watch?v=TqBt4Kkdor0","videoId":"TqBt4Kkdor0","channel":"LEARNING PARTNER"},{"title":"NgRx Selectors - An In-Depth Explanation","url":"https://www.youtube.com/watch?v=QBjv-xV7Fac","videoId":"QBjv-xV7Fac","channel":"Angular University"}]},
    "testing": {"articles":[{"title":"Testing overview","url":"https://angular.dev/guide/testing","source":"angular.dev"},{"title":"Testing HTTP requests (HttpTestingController)","url":"https://angular.dev/guide/http/testing","source":"angular.dev"}],"videos":[{"title":"BeforeEach | TestBed | Dependency Injection | Angular Unit Testing Made Easy","url":"https://www.youtube.com/watch?v=HHtmCeTcCvM","videoId":"HHtmCeTcCvM","channel":"Web Tech Talk"}]},
    "why-ssr": {"articles":[{"title":"Server-side and hybrid-rendering","url":"https://angular.dev/guide/ssr","source":"angular.dev"},{"title":"Rendering on the Web","url":"https://web.dev/articles/rendering-on-the-web","source":"web.dev"}],"videos":[{"title":"Server-side rendering with Angular | Alain Chautard | ng-conf 2024","url":"https://www.youtube.com/watch?v=zCinRB33oqI","videoId":"zCinRB33oqI","channel":"ng-conf"}]},
    "angular-universal-setup": {"articles":[{"title":"Server-side and hybrid-rendering (ng add @angular/ssr)","url":"https://angular.dev/guide/ssr","source":"angular.dev"},{"title":"Hydration","url":"https://angular.dev/guide/hydration","source":"angular.dev"}],"videos":[{"title":"Server-side rendering with Angular | Alain Chautard | ng-conf 2024","url":"https://www.youtube.com/watch?v=zCinRB33oqI","videoId":"zCinRB33oqI","channel":"ng-conf"}]},
    "hydration": {"articles":[{"title":"Hydration (provideClientHydration, event replay)","url":"https://angular.dev/guide/hydration","source":"angular.dev"},{"title":"Server-side and hybrid-rendering","url":"https://angular.dev/guide/ssr","source":"angular.dev"},{"title":"Rendering on the Web","url":"https://web.dev/articles/rendering-on-the-web","source":"web.dev"}],"videos":[{"title":"Server-side rendering with Angular | Alain Chautard | ng-conf 2024","url":"https://www.youtube.com/watch?v=zCinRB33oqI","videoId":"zCinRB33oqI","channel":"ng-conf"}]},
    "deferrable-views": {"articles":[{"title":"Deferred loading with @defer","url":"https://angular.dev/guide/templates/defer","source":"angular.dev"},{"title":"Runtime performance optimization","url":"https://angular.dev/best-practices/runtime-performance","source":"angular.dev"}],"videos":[{"title":"Angular 17 Deferable Views (@defer) Explained | Complete Guide with Practical Examples","url":"https://www.youtube.com/watch?v=NNtmOIphSKA","videoId":"NNtmOIphSKA","channel":"procademy"},{"title":"Deferrable Views - New Feature in Angular 17","url":"https://www.youtube.com/watch?v=FCcD8CEGty0","videoId":"FCcD8CEGty0","channel":"Decoded Frontend"}]},
    "seo-transferstate": {"articles":[{"title":"Title service API","url":"https://angular.dev/api/platform-browser/Title","source":"angular.dev"},{"title":"Meta service API","url":"https://angular.dev/api/platform-browser/Meta","source":"angular.dev"},{"title":"TransferState API","url":"https://angular.dev/api/core/TransferState","source":"angular.dev"},{"title":"Server-side and hybrid-rendering","url":"https://angular.dev/guide/ssr","source":"angular.dev"}],"videos":[{"title":"#50 Angular 19 Tutorial: Dynamically Set Page Titles for SEO","url":"https://www.youtube.com/watch?v=OhD9B6Rc0ig","videoId":"OhD9B6Rc0ig","channel":"Technical Rajni"},{"title":"Angular Dynamic Meta Tags & Title Management : SEO with Platform Browser","url":"https://www.youtube.com/watch?v=pGCoLexZes8","videoId":"pGCoLexZes8","channel":"CodeInMinute"}]},
    "state-options-overview": {"articles":[{"title":"Signals • Overview","url":"https://angular.dev/guide/signals","source":"angular.dev"},{"title":"NgRx Store","url":"https://ngrx.io/guide/store","source":"ngrx.io"},{"title":"NgRx SignalStore","url":"https://ngrx.io/guide/signals/signal-store","source":"ngrx.io"}],"videos":[{"title":"Angular Signals vs NgRx Store (2026) — Don't Overengineer Your State","url":"https://www.youtube.com/watch?v=S4VcQVPgiN0","videoId":"S4VcQVPgiN0","channel":"ProDev AIHub"},{"title":"NgRx Signals Store: Angular State Management Made Simple","url":"https://www.youtube.com/watch?v=g5TvjjeUzMs","videoId":"g5TvjjeUzMs","channel":"Code with Ahsan"}]},
    "ngrx-store": {"articles":[{"title":"Store","url":"https://ngrx.io/guide/store","source":"ngrx.io"},{"title":"Store — Actions","url":"https://ngrx.io/guide/store/actions","source":"ngrx.io"},{"title":"Store — Reducers","url":"https://ngrx.io/guide/store/reducers","source":"ngrx.io"}],"videos":[{"title":"Angular ngrx-store Tutorial - Action, Reducer, Selector","url":"https://www.youtube.com/watch?v=GSc1fHXVBGg","videoId":"GSc1fHXVBGg","channel":"Genka"},{"title":"Angular 19 + NgRx Store Tutorial | API Data with Actions, Reducers, Effects, and Selectors","url":"https://www.youtube.com/watch?v=TqBt4Kkdor0","videoId":"TqBt4Kkdor0","channel":"LEARNING PARTNER"}]},
    "ngrx-effects-selectors": {"articles":[{"title":"Effects","url":"https://ngrx.io/guide/effects","source":"ngrx.io"},{"title":"Store — Selectors","url":"https://ngrx.io/guide/store/selectors","source":"ngrx.io"},{"title":"Entity","url":"https://ngrx.io/guide/entity","source":"ngrx.io"}],"videos":[{"title":"NGRX Effects Tutorial for Beginners: Angular State Management with a Project Example","url":"https://www.youtube.com/watch?v=zM6pUAaJZQM","videoId":"zM6pUAaJZQM","channel":"Let's Program"},{"title":"NgRx Selectors - An In-Depth Explanation","url":"https://www.youtube.com/watch?v=QBjv-xV7Fac","videoId":"QBjv-xV7Fac","channel":"Angular University"}]},
    "signalstore": {"articles":[{"title":"SignalStore","url":"https://ngrx.io/guide/signals/signal-store","source":"ngrx.io"},{"title":"Angular Signals • Overview","url":"https://angular.dev/guide/signals","source":"angular.dev"}],"videos":[{"title":"Angular NgRx Signal Store Crash Course (For NgRx Beginners)","url":"https://www.youtube.com/watch?v=HqxY0JPlh54","videoId":"HqxY0JPlh54","channel":"Angular University"}]},
    "services-with-signals": {"articles":[{"title":"Signals • Overview","url":"https://angular.dev/guide/signals","source":"angular.dev"},{"title":"Dependency Injection • Overview","url":"https://angular.dev/guide/di","source":"angular.dev"},{"title":"RxJS Interop with Angular Signals","url":"https://angular.dev/ecosystem/rxjs-interop","source":"angular.dev"}],"videos":[{"title":"Here's what I've figured out about Angular signals","url":"https://www.youtube.com/watch?v=yTz7ASkD-6Y","videoId":"yTz7ASkD-6Y","channel":"Joshua Morony"}]},
    "xss-sanitization": {"articles":[{"title":"Security — Preventing cross-site scripting (XSS)","url":"https://angular.dev/best-practices/security","source":"angular.dev"},{"title":"Cross-site scripting (XSS)","url":"https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/XSS","source":"developer.mozilla.org"}],"videos":[{"title":"Angular 15 Security: Inbuilt Data Sanitization","url":"https://www.youtube.com/watch?v=oYPdcNSgtGc","videoId":"oYPdcNSgtGc","channel":"Techie Ocean"}]},
    "domsanitizer": {"articles":[{"title":"DomSanitizer API","url":"https://angular.dev/api/platform-browser/DomSanitizer","source":"angular.dev"},{"title":"Security — Sanitization and security contexts","url":"https://angular.dev/best-practices/security","source":"angular.dev"}],"videos":[{"title":"Angular 15: How to Bypass Angular Security (DomSanitizer)","url":"https://www.youtube.com/watch?v=xcSK4-Hrjic","videoId":"xcSK4-Hrjic","channel":"Techie Ocean"}]},
    "xsrf-protection": {"articles":[{"title":"Security — Cross-site request forgery (HttpClient XSRF support)","url":"https://angular.dev/best-practices/security","source":"angular.dev"},{"title":"Cross-site request forgery (CSRF)","url":"https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/CSRF","source":"developer.mozilla.org"}],"videos":[{"title":"Understanding CSRF (aka XSRF) - Step-by-Step Attack Simulation","url":"https://www.youtube.com/watch?v=-CGuxS5jiGI","videoId":"-CGuxS5jiGI","channel":"Angular University"}]},
    "auth-patterns": {"articles":[{"title":"Intercepting requests and responses (HTTP interceptors)","url":"https://angular.dev/guide/http/interceptors","source":"angular.dev"},{"title":"CanActivateFn — route guard","url":"https://angular.dev/api/router/CanActivateFn","source":"angular.dev"}],"videos":[{"title":"Angular: Simple Auth Guard & Simple JWT Interceptor | Blog Project V-16","url":"https://www.youtube.com/watch?v=G1JZei9nkB4","videoId":"G1JZei9nkB4","channel":"TommiCodes"},{"title":"Angular HTTP Interceptor - Build An Authentication Interceptor (Step-by-Step Implementation)","url":"https://www.youtube.com/watch?v=suTtA0Hlwlk","videoId":"suTtA0Hlwlk","channel":"Angular University"}]},
    "csp-trusted-types": {"articles":[{"title":"Security — Content Security Policy & Enforcing Trusted Types","url":"https://angular.dev/best-practices/security","source":"angular.dev"},{"title":"Prevent DOM-based XSS with Trusted Types","url":"https://web.dev/articles/trusted-types","source":"web.dev"},{"title":"Content Security Policy (CSP)","url":"https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP","source":"developer.mozilla.org"}],"videos":[{"title":"NG-BE 2021 - Philippe De Ryck - Securing Angular with Trusted Types","url":"https://www.youtube.com/watch?v=csu44ra6hqw","videoId":"csu44ra6hqw","channel":"NG - BE"},{"title":"Securing Angular with Trusted Types - Philippe De Ryck | NG-DE 2022","url":"https://www.youtube.com/watch?v=Vmk_PLmcxZU","videoId":"Vmk_PLmcxZU","channel":"NG-DE Conference"}]},
    "angular-material-basics": {"articles":[{"title":"Getting started with Angular Material","url":"https://material.angular.dev/guide/getting-started","source":"material.angular.dev"},{"title":"Button • Angular Material","url":"https://material.angular.dev/components/button/overview","source":"material.angular.dev"}],"videos":[{"title":"Getting Started with Angular Material (2022)","url":"https://www.youtube.com/watch?v=667DW7YhM9Q","videoId":"667DW7YhM9Q","channel":"The Code Angle"},{"title":"Angular Material Crash Course for Beginners","url":"https://www.youtube.com/watch?v=_M4nept0Nn4","videoId":"_M4nept0Nn4","channel":"The Code Angle"}]},
    "material-theming": {"articles":[{"title":"Theming Angular Material","url":"https://material.angular.dev/guide/theming","source":"material.angular.dev"},{"title":"Theming your own components","url":"https://material.angular.dev/guide/theming-your-components","source":"material.angular.dev"}],"videos":[{"title":"The New Super-Simple Way to Theme Angular Material (v19)","url":"https://www.youtube.com/watch?v=5NSH8VvJH5o","videoId":"5NSH8VvJH5o","channel":"Zoaib Khan"},{"title":"Easy, Dynamic Angular Material Theming with just 6 colors!","url":"https://www.youtube.com/watch?v=h6-BhzFD1CM","videoId":"h6-BhzFD1CM","channel":"Zoaib Khan"}]},
    "cdk-overlay-portal": {"articles":[{"title":"CDK Overlay","url":"https://material.angular.dev/cdk/overlay/overview","source":"material.angular.dev"},{"title":"CDK Portal","url":"https://material.angular.dev/cdk/portal/overview","source":"material.angular.dev"}],"videos":[{"title":"Introduction to Angular CDK: Overlay - Create Floating Panels On Screen","url":"https://www.youtube.com/watch?v=8KnsW_cvYso","videoId":"8KnsW_cvYso","channel":"Briebug"},{"title":"Introduction to Angular CDK: Portal + Portalhost - Dynamic Rendering","url":"https://www.youtube.com/watch?v=4S3LNdCI46w","videoId":"4S3LNdCI46w","channel":"Briebug"}]},
    "cdk-a11y-dragdrop": {"articles":[{"title":"CDK Accessibility (a11y)","url":"https://material.angular.dev/cdk/a11y/overview","source":"material.angular.dev"},{"title":"CDK Drag and Drop","url":"https://material.angular.dev/cdk/drag-drop/overview","source":"material.angular.dev"}],"videos":[{"title":"Using Angular CDK Drag-Drop - Andrew Wiens","url":"https://www.youtube.com/watch?v=KyNDZ55kbJM","videoId":"KyNDZ55kbJM","channel":"Oasis Digital"},{"title":"Kanban w/ Draggable Cards in Angular :: Drag and Drop","url":"https://www.youtube.com/watch?v=YGCDAXFWAZo","videoId":"YGCDAXFWAZo","channel":"Devstackr"}]},
    "virtual-scrolling": {"articles":[{"title":"CDK Scrolling — Virtual scrolling","url":"https://material.angular.dev/cdk/scrolling/overview","source":"material.angular.dev"},{"title":"Virtualize large lists with the Angular CDK","url":"https://web.dev/articles/virtualize-lists-with-angular-cdk","source":"web.dev"}],"videos":[{"title":"How to implement virtual scrolling in Angular using angular cdk","url":"https://www.youtube.com/watch?v=oOJrJ4ZhKtI","videoId":"oOJrJ4ZhKtI","channel":"Eraoftech | Neweraofcoding"},{"title":"Virtual Scrolling With Angular Application In CDK (Component Development Kit)","url":"https://www.youtube.com/watch?v=eHd8kK16Mz4","videoId":"eHd8kK16Mz4","channel":"Jinal Shah"}]},
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
