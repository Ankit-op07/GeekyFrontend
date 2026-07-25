// Chapter 4 — Asynchronous Patterns (Node.js Backend Kit)
// Content authored for the Learn reader. Each topic.content is an ARRAY of
// backtick strings joined with '\n'. Figures are referenced with the
// {{fig:...}} macro on their own line. Code blocks escape < > & and use
// single-quoted strings to avoid template-literal pitfalls.

module.exports = {
  title: 'Asynchronous Patterns',
  slug: 'async-patterns',
  order: 3,
  topics: [
    // ------------------------------------------------------------------ 0
    {
      title: 'Callbacks',
      slug: 'callbacks',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Node.js is single-threaded for your JavaScript, yet it powers servers that juggle thousands of simultaneous connections. It pulls that off by never blocking the one thread on slow work — reading a file, querying a database, calling another service. Instead of freezing until the result is ready, Node takes a function from you, walks away to do the slow work elsewhere, and calls your function back when the answer arrives. That function is a <strong>callback</strong>, and it is the original, foundational async pattern in Node. Promises and <code>async/await</code> are built on top of it.</p>`,
        `<p>You cannot really understand Node without understanding callbacks. Every higher-level abstraction — the entire streams system, the <code>EventEmitter</code>, most of the classic <code>fs</code> and <code>net</code> APIs, and countless npm packages written before 2016 — speaks callbacks. When you debug a stack trace that jumps out of nowhere, or wrap an old library so it returns a promise, you are working directly with this pattern. Interviewers reach for it constantly because it exposes whether you actually understand the event loop or just memorised <code>await</code>.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A callback is just a function you pass to another function, to be invoked <em>later</em>, when some work finishes. Synchronous callbacks (like the function you give <code>Array.map</code>) run immediately. The interesting ones are <strong>asynchronous</strong> callbacks: you hand them over now, your code keeps running, and Node invokes them on a future turn of the event loop once the awaited event happens.</p>`,
        `<p>Node standardised a convention called the <strong>error-first callback</strong> (sometimes "node-style" or "errback"): the callback's first parameter is an error, and the actual result comes after it. If the operation failed, the first argument is an <code>Error</code> and the rest are undefined; if it succeeded, the first argument is <code>null</code> and the data follows. This single convention makes thousands of unrelated APIs feel consistent.</p>`,
        `{{fig:ch4-callback-flow.svg|Diagram of an error-first callback: caller passes a callback, the async op runs off the stack, then cb(err, data) is invoked with either the error path or the success path|In an error-first callback the failure branch is always checked first; only then is the data used.}}`,
        `<h2>How it works</h2>`,
        `<p>When you call <code>fs.readFile('a.txt', cb)</code>, Node does not read the file on your thread. It registers the request with the operating system (via the libuv thread pool for file I/O) and returns immediately — the very next line of your code runs before the file is read. Your callback is parked. When the read completes, libuv places your callback on a queue, and once the current call stack is empty the event loop picks it up and runs it. This is why a <code>console.log</code> after the <code>readFile</code> call prints <em>before</em> the callback fires.</p>`,
        `<p>The critical consequence: a callback runs on a <strong>fresh, empty call stack</strong>, disconnected from the code that scheduled it. The function that called <code>readFile</code> has long since returned. That is why you cannot wrap an async callback in a <code>try/catch</code> and expect to catch its error — by the time the callback throws, the <code>try</code> block is gone from the stack. The error-first convention exists precisely because <code>throw</code> is useless here: errors must be passed <em>as data</em> into the callback instead.</p>`,
        `<p>Because each async step schedules the next one only from inside its own callback, sequencing several dependent operations means nesting callbacks inside callbacks. Each level must independently check its own error argument. This is where the pattern's ergonomics break down — the code drifts to the right and error handling is duplicated at every level.</p>`,
        `<p>There's a subtle timing distinction worth internalising. Not all deferrals are equal: <code>process.nextTick(cb)</code> runs your callback <em>before</em> the event loop continues to the next phase — effectively at the front of the queue, even ahead of promise microtasks — whereas <code>setImmediate(cb)</code> runs it on the next loop iteration's check phase, and <code>setTimeout(cb, 0)</code> runs it in the timers phase. For merely making a synchronous path asynchronous, <code>setImmediate</code> is the safest default because <code>nextTick</code> can starve the event loop if you schedule it recursively. The takeaway for callbacks specifically: when you need to defer to avoid releasing Zalgo, prefer <code>setImmediate</code> unless you have a concrete reason to jump the queue.</p>`,
        `<p>The three ways to defer a callback differ in <em>when</em> on the loop they run, and confusing them causes ordering bugs that only appear under load:</p>`,
        `<table>
          <thead><tr><th>Primitive</th><th>Runs</th><th>Drains</th><th>Starvation risk</th></tr></thead>
          <tbody>
            <tr><td><code>process.nextTick(cb)</code></td><td>Before the loop advances, ahead of promise microtasks</td><td>Fully, after each operation</td><td>High — recursive scheduling blocks the loop</td></tr>
            <tr><td>Promise <code>.then</code> / <code>queueMicrotask</code></td><td>After nextTick, before the next phase</td><td>Fully, before any macrotask</td><td>High if scheduled recursively</td></tr>
            <tr><td><code>setImmediate(cb)</code></td><td>Next iteration, in the check phase</td><td>One per iteration</td><td>Low — yields between iterations</td></tr>
            <tr><td><code>setTimeout(cb, 0)</code></td><td>Timers phase, after a &ge;1ms clamp</td><td>One per iteration</td><td>Low</td></tr>
          </tbody>
        </table>`,
        `<p>One more mechanic behind file-system callbacks explains a lot of otherwise-baffling throughput ceilings. Network sockets use the operating system's own event notification, so thousands can be in flight at once. File I/O and a few CPU-bound operations (<code>crypto.pbkdf2</code>, <code>zlib</code>, DNS <code>lookup</code>) cannot be done that way, so libuv runs them on a small pool of worker threads whose default size is only <strong>four</strong> (<code>UV_THREADPOOL_SIZE</code>). Fire off five concurrent <code>fs.readFile</code> calls and the fifth callback waits for a worker to free up, even though your JavaScript looks fully parallel. Knowing which of your callbacks share that pool tells you which ones can actually overlap and which merely queue.</p>`,
        `{{fig:ch4-callback-hell.svg|Four callbacks nested inside one another, each indented further right, forming a pyramid shape known as callback hell|Dependent async steps nest, each repeating its own error check — the pyramid of doom.}}`,
        `<h2>Code examples</h2>`,
        `<p>The canonical error-first pattern. Notice the error branch is handled first and returns early, so the success code never runs on a failure:</p>`,
        `<pre><code class="language-javascript">const fs = require('node:fs');

fs.readFile('config.json', 'utf8', (err, data) =&gt; {
  if (err) {
    console.error('Failed to read config:', err.message);
    return; // stop — do NOT fall through to use data
  }
  const config = JSON.parse(data);
  console.log('Port:', config.port);
});

console.log('This logs FIRST — readFile is async.');</code></pre>`,
        `<p>Sequencing dependent steps produces the nesting the diagram showed. Each step needs the previous step's result:</p>`,
        `<pre><code class="language-javascript">getUser(1, (err, user) =&gt; {
  if (err) return done(err);
  getOrders(user.id, (err, orders) =&gt; {
    if (err) return done(err);
    getItems(orders[0].id, (err, items) =&gt; {
      if (err) return done(err);
      done(null, items); // finally, the result
    });
  });
});</code></pre>`,
        `<p>Writing an async function of your own means <em>always</em> calling the callback the same way — error first, and never both calling back with an error and continuing. Deferring with <code>setImmediate</code> keeps the API consistently asynchronous:</p>`,
        `<pre><code class="language-javascript">function loadUser(id, cb) {
  if (typeof id !== 'number') {
    // Defer so the callback never runs synchronously — see gotchas below.
    return setImmediate(() =&gt; cb(new Error('id must be a number')));
  }
  db.find(id, (err, row) =&gt; {
    if (err) return cb(err);        // pass the error along
    cb(null, { id: row.id, name: row.name }); // null error on success
  });
}</code></pre>`,
        `<p>Running independent callback operations in parallel and collecting results by hand shows why libraries and promises were welcomed. You must count completions yourself and guard against calling <code>done</code> twice:</p>`,
        `<pre><code class="language-javascript">function loadAll(ids, done) {
  const results = [];
  let remaining = ids.length;
  let finished = false;
  if (remaining === 0) return done(null, results);

  ids.forEach((id, i) =&gt; {
    loadUser(id, (err, user) =&gt; {
      if (finished) return;         // already errored out
      if (err) { finished = true; return done(err); }
      results[i] = user;            // preserve order by index
      if (--remaining === 0) done(null, results);
    });
  });
}</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>
          <li><strong>Wrapping an async callback in try/catch.</strong> The <code>try</code> block has already unwound by the time the callback runs, so it catches nothing. Handle the <code>err</code> argument instead.</li>
          <li><strong>Forgetting to <code>return</code> after handling the error.</strong> Without the early return, execution falls through and runs the success path with undefined data — often crashing on <code>JSON.parse(undefined)</code> or a null dereference.</li>
          <li><strong>Calling the callback more than once.</strong> Firing <code>cb</code> on error and then again on success (or in a loop) causes duplicated downstream work and double responses. Guard with a <code>finished</code> flag or return after each call.</li>
          <li><strong>Releasing Zalgo — a callback that is sometimes sync, sometimes async.</strong> If <code>loadUser</code> called <code>cb</code> synchronously for the validation error but asynchronously for the DB path, callers get inconsistent ordering and subtle bugs. Always defer synchronous callbacks with <code>setImmediate</code> or <code>process.nextTick</code>.</li>
          <li><strong>Swallowing errors.</strong> An empty <code>if (err) {}</code> or an ignored first argument hides real failures. At minimum log and stop.</li>
          <li><strong>Losing <code>this</code>.</strong> Passing a method as a bare callback (<code>emitter.on('x', obj.handle)</code>) detaches <code>this</code>. Use an arrow wrapper or <code>.bind()</code>.</li>
          <li><strong>Assuming <code>fs</code> callbacks run in parallel.</strong> They share libuv's four-thread pool by default, so heavy concurrent file, crypto, or zlib work serialises behind it. Raise <code>UV_THREADPOOL_SIZE</code> (set it before the first pool use) or throttle the work if throughput plateaus.</li>
        </ul>`,
        `<h2>Best practices</h2>`,
        `<ul>
          <li>Follow the error-first convention rigidly in every callback you author — first arg is the error, and only the error.</li>
          <li>Handle the error branch first and <code>return</code> immediately, so the happy path reads linearly below it.</li>
          <li>Keep callbacks async-only: never invoke a callback synchronously; defer with <code>setImmediate</code> to avoid Zalgo.</li>
          <li>Name your callback functions instead of deeply nesting anonymous ones — flatter code and better stack traces.</li>
          <li>For anything beyond one or two steps, promote to promises with <code>util.promisify</code> or use the promise-based core APIs (<code>fs.promises</code>) rather than hand-nesting.</li>
          <li>Never call a callback twice; enforce it with a guard flag when the control flow makes it possible.</li>
        </ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: What is an error-first callback and why did Node adopt it?</strong><br/>Because an async callback runs on a fresh stack, <code>throw</code> cannot reach the original caller. Passing the error as the first argument gives every async API a uniform, throw-free way to report failure, so callers always check the same place.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why does <code>console.log</code> after <code>fs.readFile</code> print before the file contents?</strong><br/><code>readFile</code> offloads the work and returns immediately; the callback is queued and only runs after the current synchronous code finishes and the stack empties. This is the event loop deferring the callback to a later tick.</p></blockquote>`,
        `<blockquote><p><strong>Q: Can a <code>try/catch</code> catch an error thrown inside an async callback?</strong><br/>No. The <code>try</code> block has already returned by the time the callback fires on a new stack. The thrown error escapes as an uncaught exception. This is the core reason errors are passed as data, not thrown.</p></blockquote>`,
        `<blockquote><p><strong>Q: What is "callback hell" and what actually causes it?</strong><br/>Deeply nested callbacks caused by sequencing dependent async steps — each step can only schedule the next from inside its own callback. The trap: it isn't just ugly, it also duplicates error handling at every level and makes early exit awkward.</p></blockquote>`,
        `<blockquote><p><strong>Q: What is "releasing Zalgo"? (trap)</strong><br/>Writing a function that invokes its callback synchronously on one path and asynchronously on another. Callers can't reason about ordering, leading to race-like bugs. Fix by always deferring the synchronous path with <code>setImmediate</code> or <code>process.nextTick</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you convert a callback API into a promise?</strong><br/>Wrap it with <code>util.promisify(fn)</code> (which relies on the error-first convention), or construct a <code>new Promise</code> and call <code>resolve(data)</code> / <code>reject(err)</code> from inside the callback.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>
          <li><strong>Shape:</strong> <code>(err, data) =&gt; {}</code> — error first, always.</li>
          <li><strong>Runs:</strong> later, on an empty stack, via the event loop.</li>
          <li><strong>Errors:</strong> passed as arg #1, never thrown — <code>try/catch</code> won't catch them.</li>
          <li><strong>Rule:</strong> handle <code>err</code>, then <code>return</code>; never call <code>cb</code> twice.</li>
          <li><strong>Zalgo:</strong> keep callbacks always-async; defer sync paths with <code>setImmediate</code>.</li>
          <li><strong>Escape hatch:</strong> <code>util.promisify</code> / <code>fs.promises</code> to move up to promises.</li>
        </ul>`
      ].join('\n')
    },

    // ------------------------------------------------------------------ 1
    {
      title: 'Promises',
      slug: 'promises',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Promises are the backbone of modern asynchronous JavaScript. <code>async/await</code> — the syntax you probably reach for first — is not a separate mechanism; it is sugar over promises. Every <code>await</code> unwraps a promise, and every <code>async</code> function returns one. If your mental model of promises is fuzzy, then <code>async/await</code> will occasionally do surprising things and you won't know why. Master promises and the rest of asynchronous Node stops being mysterious.</p>`,
        `<p>Promises also solved the concrete problems callbacks created: the rightward nesting, the duplicated error checks, the inability to compose. A promise is a <em>value you can pass around and combine</em> — you can return it, store it, hand it to <code>Promise.all</code>, or chain transformations onto it. That composability is why the whole ecosystem migrated. In interviews, promise combinators (<code>all</code>, <code>allSettled</code>, <code>race</code>, <code>any</code>) and the exact rules of chaining are among the most common questions because they reveal whether you can reason about concurrency, not just await one thing.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A promise is an object representing the eventual result of an asynchronous operation. It is a placeholder for a value that isn't ready yet. A promise is always in exactly one of three states: <strong>pending</strong> (still working), <strong>fulfilled</strong> (finished with a value), or <strong>rejected</strong> (failed with a reason). The move from pending to either fulfilled or rejected is called <strong>settling</strong>, and it happens <em>at most once</em>. After a promise settles, its state and value are frozen forever — you cannot un-settle it or change the value.</p>`,
        `{{fig:ch4-promise-states.svg|A promise starts pending and transitions one-way to either fulfilled via resolve or rejected via reject, and once settled the value is frozen|A promise settles once and only once; the transition is one-way and irreversible.}}`,
        `<p>You read a promise's outcome with three methods. <code>.then(onFulfilled, onRejected)</code> registers what to do when it fulfils (and optionally when it rejects). <code>.catch(onRejected)</code> handles rejection. <code>.finally(fn)</code> runs a cleanup callback regardless of outcome, without touching the value. All three return <em>new</em> promises, which is what makes chaining possible.</p>`,
        `<h2>How it works</h2>`,
        `<p>Consider the resolution process. When you construct <code>new Promise((resolve, reject) =&gt; {...})</code>, the executor runs <strong>synchronously</strong> right away. Calling <code>resolve(value)</code> settles the promise as fulfilled; <code>reject(reason)</code> settles it as rejected. Crucially, resolving with another promise (a "thenable") doesn't fulfil with that promise as a value — it <em>adopts</em> it, waiting for the inner promise to settle first. This flattening is why you rarely see promises nested inside promises.</p>`,
        `<p>The handlers you attach with <code>.then</code> never run synchronously, even if the promise is already settled. They are scheduled as <strong>microtasks</strong>. The microtask queue drains completely after the current synchronous call stack finishes and <em>before</em> the event loop processes the next macrotask (like a <code>setTimeout</code> callback or I/O event). This is why a <code>.then</code> callback runs before a <code>setTimeout(fn, 0)</code> queued at the same time.</p>`,
        `{{fig:ch4-microtask-queue.svg|Three lanes showing synchronous call stack first, then the microtask queue draining fully, then the macrotask queue, illustrating that promise callbacks run before timers|Promise callbacks are microtasks: they drain fully before the next timer or I/O callback.}}`,
        `<p>Chaining works because each <code>.then</code> returns a new promise resolved with whatever its callback returns. Return a plain value and the next <code>.then</code> receives it; return a promise and the chain waits for it to settle before continuing. <strong>Throw</strong> inside a handler (or return a rejected promise) and the chain skips every subsequent <code>.then</code> until it hits a <code>.catch</code> — errors propagate down the chain looking for a rejection handler, exactly like exceptions bubble up a call stack.</p>`,
        `<p>Two mechanics are worth pinning down because interview answers hinge on them. First, <code>Promise.resolve(x)</code> returns <code>x</code> unchanged when it is already a native promise and otherwise wraps it — so it is the cheap, correct way to normalise a "value or promise" without the <code>new Promise</code> anti-pattern. Second, a "thenable" is <em>any</em> object with a <code>.then</code> method, not only a real <code>Promise</code>; the resolution algorithm calls that <code>.then</code> to adopt it, which is how promises from different libraries interoperate. Adopting a thenable costs an <strong>extra microtask tick</strong> — the engine schedules an internal <code>.then</code> to unwrap it — so a handler that returns <code>Promise.resolve(v)</code> resumes one tick later than one that returns <code>v</code> directly. This rarely affects correctness but explains surprising ordering in tight benchmarks.</p>`,
        `<p>Working through an explicit ordering puzzle cements the microtask rule. Predict the output before reading it:</p>`,
        `<pre><code class="language-javascript">console.log('1 sync');
setTimeout(() =&gt; console.log('2 timeout'), 0);
Promise.resolve().then(() =&gt; console.log('3 microtask'));
queueMicrotask(() =&gt; console.log('4 microtask'));
console.log('5 sync');

// Output:
// 1 sync        ← runs now, on the call stack
// 5 sync        ← runs now, on the call stack
// 3 microtask   ← microtask queue drains before any timer
// 4 microtask   ← same queue, in registration order
// 2 timeout     ← macrotask — only after every microtask</code></pre>`,
        `<p>A single table captures how the four combinators differ on the two axes that matter — when they settle and how they treat failure:</p>`,
        `<table>
          <thead><tr><th>Combinator</th><th>Fulfils when</th><th>Rejects when</th><th>Result shape</th></tr></thead>
          <tbody>
            <tr><td><code>Promise.all</code></td><td>Every input fulfils</td><td>First input rejects (fail-fast)</td><td>Array of values</td></tr>
            <tr><td><code>Promise.allSettled</code></td><td>All inputs settle</td><td>Never</td><td>Array of <code>{status, value|reason}</code></td></tr>
            <tr><td><code>Promise.race</code></td><td>First input to settle was a fulfilment</td><td>First input to settle was a rejection</td><td>Single value / reason</td></tr>
            <tr><td><code>Promise.any</code></td><td>First input fulfils</td><td>Every input rejects</td><td>Value / <code>AggregateError</code></td></tr>
          </tbody>
        </table>`,
        `<p>All four accept any iterable and, apart from <code>allSettled</code>, propagate the first relevant settlement without cancelling the others — there is no cancellation primitive in the promise model, so siblings always run to completion regardless of which combinator you chose.</p>`,
        `<h2>Code examples</h2>`,
        `<p>Promisifying a callback API by hand. The executor runs now; <code>resolve</code>/<code>reject</code> settle it later from inside the callback:</p>`,
        `<pre><code class="language-javascript">function delay(ms, value) {
  return new Promise((resolve, reject) =&gt; {
    if (ms &lt; 0) return reject(new Error('ms must be &gt;= 0'));
    setTimeout(() =&gt; resolve(value), ms);
  });
}

delay(100, 'done').then((v) =&gt; console.log(v)); // 'done' after 100ms</code></pre>`,
        `<p>A chain that transforms a value step by step. Each <code>.then</code> hands its return to the next; the single <code>.catch</code> at the end handles a failure anywhere above it:</p>`,
        `<pre><code class="language-javascript">fetchUser(1)
  .then((user) =&gt; fetchOrders(user.id)) // return a promise → chain waits
  .then((orders) =&gt; orders.filter((o) =&gt; o.paid))
  .then((paid) =&gt; console.log('paid orders:', paid.length))
  .catch((err) =&gt; console.error('chain failed:', err.message))
  .finally(() =&gt; console.log('done, success or not'));</code></pre>`,
        `<p>The four combinators cover distinct concurrency needs. <code>Promise.all</code> fails fast; <code>allSettled</code> reports every outcome:</p>`,
        `<pre><code class="language-javascript">// all: need every result; one rejection rejects the whole thing.
const [a, b, c] = await Promise.all([load('a'), load('b'), load('c')]);

// allSettled: never rejects — inspect each result individually.
const results = await Promise.allSettled([load('a'), load('b')]);
for (const r of results) {
  if (r.status === 'fulfilled') console.log('ok', r.value);
  else console.log('failed', r.reason.message);
}</code></pre>`,
        `<p><code>Promise.race</code> settles on the first to finish (win or lose) — ideal for timeouts. <code>Promise.any</code> waits for the first <em>success</em>, ignoring rejections until all fail:</p>`,
        `<pre><code class="language-javascript">// race: timeout wrapper — whichever settles first wins.
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =&gt;
    setTimeout(() =&gt; reject(new Error('timed out')), ms));
  return Promise.race([promise, timeout]);
}

// any: first mirror to succeed; rejects with AggregateError only if all fail.
const fastest = await Promise.any([mirror1(), mirror2(), mirror3()]);</code></pre>`,
        `{{fig:ch4-promise-combinators.svg|Four cards contrasting Promise.all fail-fast, allSettled never-rejects, race first-to-settle, and any first-fulfilment with their use cases|Pick the combinator by intent: every result (all), every outcome (allSettled), first settle (race), first success (any).}}`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>
          <li><strong>Forgetting to return inside <code>.then</code>.</strong> If you call <code>fetchOrders(...)</code> without <code>return</code>, the chain doesn't wait for it and the next <code>.then</code> gets <code>undefined</code>. Always return the promise you want the chain to await.</li>
          <li><strong>The floating promise.</strong> Starting a promise without <code>await</code>, <code>return</code>, or <code>.catch</code> means its rejection goes unhandled and its completion is unordered relative to your code.</li>
          <li><strong>The forgotten <code>.catch</code>.</strong> An unhandled rejection triggers a process warning and, by default in current Node, can crash the process. Every chain needs a terminal <code>.catch</code> (or an <code>await</code> inside a <code>try/catch</code>).</li>
          <li><strong>The explicit-construction anti-pattern.</strong> Wrapping a function that already returns a promise in <code>new Promise((resolve) =&gt; fn().then(resolve))</code> loses error propagation and is pointless — just return <code>fn()</code>.</li>
          <li><strong>Assuming <code>Promise.all</code> cancels siblings on rejection.</strong> It rejects immediately, but the other promises keep running to completion — there is no cancellation. Their later rejections may become unhandled.</li>
          <li><strong>Mixing up <code>race</code> and <code>any</code>.</strong> <code>race</code> settles on the first to settle, so an early rejection wins; <code>any</code> ignores rejections and waits for the first fulfilment.</li>
          <li><strong>Expecting a settled promise's <code>.then</code> to run synchronously.</strong> It never does — it's always a microtask, so ordering with sync code can surprise you.</li>
        </ul>`,
        `<h2>Best practices</h2>`,
        `<ul>
          <li>Always terminate a chain with <code>.catch</code>, or <code>await</code> it inside <code>try/catch</code> — never leave a rejection unhandled.</li>
          <li>Return the promise from inside <code>.then</code> so the chain waits; a missing return is the most common promise bug.</li>
          <li>Prefer the built-in combinators over hand-rolled counters, and choose the one that matches your intent (all / allSettled / race / any).</li>
          <li>Reject with <code>Error</code> objects, not strings, so you keep a stack trace and a <code>.message</code>.</li>
          <li>Don't wrap existing promises in <code>new Promise</code>; return or chain them directly.</li>
          <li>Use <code>allSettled</code> when partial failure is acceptable and you need to report each outcome; use <code>all</code> only when you truly need every result.</li>
        </ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: What are the three states of a promise and which transitions are legal?</strong><br/>Pending, fulfilled, rejected. It starts pending and moves once — pending → fulfilled or pending → rejected. Settling is one-way and happens at most once; the value is then frozen.</p></blockquote>`,
        `<blockquote><p><strong>Q: Does a <code>.then</code> handler run synchronously if the promise is already resolved?</strong><br/>No. <code>.then</code> callbacks are always scheduled as microtasks, running after the current synchronous stack finishes but before the next timer or I/O callback.</p></blockquote>`,
        `<blockquote><p><strong>Q: Difference between <code>Promise.all</code> and <code>Promise.allSettled</code>?</strong><br/><code>all</code> rejects as soon as any input rejects (fail-fast) and otherwise fulfils with an array of values. <code>allSettled</code> never rejects; it waits for all and returns an array of <code>{status, value|reason}</code> descriptors.</p></blockquote>`,
        `<blockquote><p><strong>Q: <code>Promise.race</code> vs <code>Promise.any</code>? (trap)</strong><br/><code>race</code> settles with the first promise to <em>settle</em>, so a fast rejection can win. <code>any</code> settles with the first to <em>fulfil</em>, ignoring rejections, and only rejects (with an <code>AggregateError</code>) if every input rejects.</p></blockquote>`,
        `<blockquote><p><strong>Q: If <code>Promise.all</code> rejects, what happens to the other promises?</strong><br/>Nothing stops them — there's no cancellation. They keep running; <code>all</code> just ignores their later results. If one of those later rejects with no handler, you can get an unhandled rejection.</p></blockquote>`,
        `<blockquote><p><strong>Q: What does <code>resolve</code>-ing a promise with another promise do?</strong><br/>It adopts the inner promise: the outer stays pending until the inner settles, then takes on its state and value. This thenable-flattening is why promises don't nest.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>
          <li><strong>States:</strong> pending → fulfilled | rejected. Settles once, frozen after.</li>
          <li><strong>Read with:</strong> <code>.then</code> / <code>.catch</code> / <code>.finally</code> — each returns a new promise.</li>
          <li><strong>Handlers:</strong> always microtasks; run before timers, never sync.</li>
          <li><strong>all</strong> = every result, fail-fast. <strong>allSettled</strong> = every outcome, never rejects.</li>
          <li><strong>race</strong> = first to settle (loss can win). <strong>any</strong> = first to fulfil (ignores rejects).</li>
          <li><strong>Rules:</strong> return inside <code>.then</code>; always terminate with <code>.catch</code>; reject with <code>Error</code>.</li>
        </ul>`
      ].join('\n')
    },

    // ------------------------------------------------------------------ 2
    {
      title: 'Async / Await',
      slug: 'async-await',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p><code>async/await</code> is how modern Node code reads: top to bottom, like synchronous logic, even though it's fully asynchronous underneath. It removes the nesting of callbacks and the boilerplate of long <code>.then</code> chains, and it lets you use ordinary language features — <code>try/catch</code>, <code>for</code> loops, <code>if</code>, early <code>return</code> — with asynchronous values. For most day-to-day backend code, this is the pattern you'll write.</p>`,
        `<p>But its readability is also a trap. Because <code>await</code> makes async code <em>look</em> sequential, it's dangerously easy to make everything sequential by accident — awaiting three independent requests one after another when they could have run together, turning a 100ms operation into 300ms. Interviewers love this exact scenario: give the candidate a snippet with three awaits and ask how to make it faster. Knowing that <code>async/await</code> is just promise syntax, and knowing when to break out of the sequential reading to run things in parallel, is what separates people who <em>use</em> it from people who <em>understand</em> it.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Marking a function <code>async</code> does two things: it makes the function always return a promise (whatever you return becomes the fulfilment value; whatever you throw becomes the rejection reason), and it allows <code>await</code> inside it. <code>await</code> takes a promise, pauses the async function until that promise settles, and then evaluates to the fulfilled value — or throws the rejection reason as if it were a normal exception.</p>`,
        `<p>The key mental correction: <code>await</code> <strong>pauses your function, it does not block the thread</strong>. While your function is suspended at an <code>await</code>, the event loop is free to run other work — handle other requests, fire timers, process I/O. Nothing is frozen; only <em>this one function</em> is parked until its promise is ready.</p>`,
        `{{fig:ch4-await-desugar.svg|Left side shows code written with await reading top to bottom; right side shows the engine desugaring it into a .then continuation that suspends the function and frees the event loop|await reads like synchronous code but the engine turns it into a suspended continuation — the thread stays free.}}`,
        `<h2>How it works</h2>`,
        `<p>An <code>async</code> function is a state machine. When execution reaches an <code>await</code>, the function <em>suspends</em>: it saves its local state, attaches a continuation to the awaited promise (conceptually a <code>.then</code>), and returns control to the caller. The rest of the function body becomes that continuation, scheduled as a microtask when the promise settles. So <code>const u = await getUser()</code> is, roughly, <code>getUser().then(u =&gt; { /* rest of function */ })</code>. This is why everything after an <code>await</code> runs on a later microtask, never synchronously.</p>`,
        `<p>Because the continuation runs as a microtask, the same ordering rules from promises apply: code after an <code>await</code> runs before a <code>setTimeout(fn, 0)</code> scheduled beforehand. And because a rejected awaited promise <em>throws</em> at the <code>await</code> point, ordinary <code>try/catch</code> works again — the async error handling that callbacks couldn't offer is restored, because the language rethrows the rejection synchronously into your paused function.</p>`,
        `{{fig:ch4-microtask-queue.svg|Three lanes showing the synchronous call stack draining first, then the microtask queue where await continuations run, then macrotasks like timers|The code after an await resumes as a microtask, ahead of any timer or I/O callback queued at the same time.}}`,
        `<p>The performance model follows directly. Two <code>await</code>s in a row mean the second operation doesn't even <em>start</em> until the first has finished — that's sequential, and the total time is the sum. To run independent operations concurrently you must <strong>start them all first</strong> (call the functions, collect the promises) and only then <code>await</code> them together, typically with <code>Promise.all</code>. Then the total time is roughly the slowest single operation.</p>`,
        `{{fig:ch4-seq-vs-parallel.svg|Top timeline shows three 100ms tasks awaited one after another totalling 300ms; bottom shows the same three started together and awaited via Promise.all totalling 100ms|Awaiting in a row sums the durations; starting all the promises first and awaiting together takes only as long as the slowest.}}`,
        `<p>Unbounded parallelism is the failure mode on the far side of the sequential trap. <code>await Promise.all(tenThousandIds.map(fetchRow))</code> starts all ten thousand operations at once, opening as many sockets or file handles, and typically collapses under its own weight or trips a downstream rate limit. The middle ground is <strong>bounded concurrency</strong>: run at most N operations in flight at a time. A well-worn library such as <code>p-limit</code> does this, but the idea is small enough to hand-roll with a fixed pool of workers pulling from a shared index — which is worth being able to write on a whiteboard.</p>`,
        `<p>A minimal concurrency limiter: N workers drain a shared queue, and results stay in input order because each worker writes to the index it claimed.</p>`,
        `<pre><code class="language-javascript">async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next &lt; items.length) {
      const i = next++;              // claim an index — safe on one thread
      results[i] = await fn(items[i], i);
    }
  }
  const size = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: size }, worker));
  return results;
}

// At most 5 requests in flight at once, regardless of ids.length.
const rows = await mapLimit(ids, 5, fetchRow);</code></pre>`,
        `<p>One more subtlety about <code>await Promise.all</code>: it rejects with the <em>first</em> rejection the instant it arrives, but the other in-flight promises are <strong>not</strong> cancelled — they run to completion and their results are simply discarded. If one of those stragglers later rejects with nothing awaiting it, you can still get an <code>unhandledRejection</code> after your <code>catch</code> has already run. When partial success is acceptable, prefer <code>Promise.allSettled</code> so every outcome is captured and nothing is left dangling.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The sequential trap and its fix. The first version takes the sum of all three; the second takes the max because the requests overlap:</p>`,
        `<pre><code class="language-javascript">// SLOW — sequential: each await waits for the previous (≈300ms).
async function slow() {
  const a = await load('a'); // 100ms
  const b = await load('b'); // another 100ms
  const c = await load('c'); // another 100ms
  return [a, b, c];
}

// FAST — parallel: start all three, then await together (≈100ms).
async function fast() {
  const [a, b, c] = await Promise.all([load('a'), load('b'), load('c')]);
  return [a, b, c];
}</code></pre>`,
        `<p>Sequential is correct — and required — when steps <em>depend</em> on each other. You cannot parallelise what needs the previous result:</p>`,
        `<pre><code class="language-javascript">async function checkout(userId) {
  const user = await getUser(userId);        // must run first
  const cart = await getCart(user.cartId);   // needs user
  const charge = await pay(cart.total);      // needs cart
  return charge.receipt;
}</code></pre>`,
        `<p>Error handling reads like synchronous code — the rejected promise throws at the <code>await</code>, and <code>catch</code> receives it. <code>finally</code> runs either way:</p>`,
        `<pre><code class="language-javascript">async function safeLoad(id) {
  try {
    const data = await load(id);
    return process(data);
  } catch (err) {
    console.error('load failed:', err.message);
    return null;                 // graceful fallback
  } finally {
    console.log('attempt finished'); // always runs
  }
}</code></pre>`,
        `<p>Iterating with <code>await</code> in a <code>for...of</code> is sequential by design — use it when order matters or to limit concurrency. For unordered parallelism, map to promises and <code>Promise.all</code>. Note that <code>forEach</code> does <em>not</em> await:</p>`,
        `<pre><code class="language-javascript">// Sequential, ordered — one at a time.
for (const id of ids) {
  await handle(id);
}

// Parallel — all at once, results in order.
const results = await Promise.all(ids.map((id) =&gt; handle(id)));

// BUG: forEach ignores the returned promise — these run "in the background",
// and the outer function does NOT wait for them.
ids.forEach(async (id) =&gt; { await handle(id); }); // don't do this</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>
          <li><strong>The forgotten <code>await</code>.</strong> Dropping <code>await</code> gives you the pending <em>promise object</em>, not the value — so <code>if (user.isAdmin)</code> reads a property off a Promise and is silently truthy/undefined. The operation also isn't sequenced.</li>
          <li><strong>Accidental sequential awaits.</strong> Awaiting independent operations one per line serialises them needlessly. Start them together and <code>await Promise.all</code>.</li>
          <li><strong>Floating promise from a missing <code>await</code> or <code>return</code>.</strong> The function returns before the async work finishes, and any rejection becomes unhandled.</li>
          <li><strong><code>await</code> inside <code>Array.forEach</code>/<code>map</code> without collecting.</strong> <code>forEach</code> ignores the returned promise entirely; an <code>async</code> callback runs detached. Use <code>for...of</code> for sequential or <code>Promise.all(map(...))</code> for parallel.</li>
          <li><strong>Unbounded parallelism.</strong> <code>Promise.all(hugeArray.map(fetch))</code> can open thousands of sockets at once and exhaust resources. Batch or use a concurrency limiter.</li>
          <li><strong><code>return await</code> confusion.</strong> Inside a <code>try</code> block, <code>return await fn()</code> is needed so the <code>catch</code> can catch a rejection; outside a <code>try</code> it's a harmless minor extra tick.</li>
          <li><strong>Top-level <code>await</code> availability.</strong> It works in ES modules (<code>.mjs</code> or <code>"type":"module"</code>) but not in classic CommonJS module scope.</li>
        </ul>`,
        `<h2>Best practices</h2>`,
        `<ul>
          <li>Default to <code>async/await</code> for readability; drop to <code>Promise.all</code> the moment operations are independent.</li>
          <li>Start independent promises <em>before</em> awaiting — collect them, then <code>await Promise.all</code>.</li>
          <li>Use <code>try/catch/finally</code> for error handling and cleanup; it works naturally with <code>await</code>.</li>
          <li>Use <code>for...of</code> with <code>await</code> for ordered/sequential work; never rely on <code>forEach</code> to await.</li>
          <li>Cap concurrency for large collections with batching or a limiter (e.g. p-limit) instead of a bare <code>Promise.all</code> over thousands of items.</li>
          <li>Await or return every promise you create; a lint rule for floating promises catches the rest.</li>
        </ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: Does <code>await</code> block the event loop?</strong><br/>No. It suspends only the current async function and returns control to the event loop, which is free to run other work. The thread is never frozen — a common misconception.</p></blockquote>`,
        `<blockquote><p><strong>Q: These three awaits take 300ms — make them 100ms.</strong><br/>They're independent but awaited sequentially, so each waits for the last. Start all three (call the functions to get promises) and <code>await Promise.all([...])</code>; total time drops to the slowest single call.</p></blockquote>`,
        `<blockquote><p><strong>Q: What does an <code>async</code> function return?</strong><br/>Always a promise. A returned value becomes the fulfilment; a thrown error (or a rejected awaited promise) becomes the rejection. Even <code>return 5</code> yields <code>Promise&lt;5&gt;</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why doesn't <code>await</code> work inside <code>forEach</code>? (trap)</strong><br/><code>forEach</code> doesn't look at the promise its callback returns, so it doesn't wait — the loop finishes immediately while the async callbacks run detached. Use <code>for...of</code> for sequential or <code>Promise.all(arr.map(...))</code> for parallel.</p></blockquote>`,
        `<blockquote><p><strong>Q: What is <code>async/await</code> compiled to conceptually?</strong><br/>A promise-based state machine. Each <code>await</code> suspends the function and attaches its continuation to the awaited promise as a microtask — essentially the code after it becomes a <code>.then</code> callback.</p></blockquote>`,
        `<blockquote><p><strong>Q: When does <code>return await x</code> differ from <code>return x</code>?</strong><br/>Inside a <code>try</code> block: <code>return await</code> lets the local <code>catch</code> handle a rejection, whereas <code>return x</code> hands the still-pending promise to the caller and skips your <code>catch</code>. Outside a <code>try</code> the difference is a negligible extra microtask.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>
          <li><strong><code>async</code> fn</strong> → always returns a promise; <code>return</code> = fulfil, <code>throw</code> = reject.</li>
          <li><strong><code>await</code></strong> pauses the function, frees the event loop — never blocks the thread.</li>
          <li><strong>Sequential</strong> awaits sum durations; use only for dependent steps.</li>
          <li><strong>Parallel:</strong> start promises first, then <code>await Promise.all([...])</code>.</li>
          <li><strong>Errors:</strong> <code>try/catch</code> works because a rejected await throws.</li>
          <li><strong>Loops:</strong> <code>for...of</code> awaits; <code>forEach</code> does not. Cap huge parallelism.</li>
        </ul>`
      ].join('\n')
    },

    // ------------------------------------------------------------------ 3
    {
      title: 'Error Handling in Async Code',
      slug: 'error-handling-async',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Synchronous error handling is a solved problem: <code>throw</code> unwinds the stack, <code>try/catch</code> catches it, done. Asynchronous errors are where real Node applications fall over — because an error that fires <em>after</em> the stack that scheduled it has unwound cannot be caught the same way, and the three async styles (callbacks, promises, <code>async/await</code>) each surface errors in a different place. Get this wrong and errors vanish silently, a single unhandled rejection crashes the whole process, or a failed request hangs forever with no response.</p>`,
        `<p>This topic is disproportionately represented in interviews and code reviews because it separates people who can write a happy path from people who can ship a service that stays up. Knowing exactly <em>where</em> an error appears in each style, how it propagates, and what happens when nobody handles it is core backend competence.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>The single most important idea: <strong>an async error surfaces at a different place depending on the style</strong>. In a callback, the error is the first argument — <code>throw</code> is useless and <code>try/catch</code> won't help. In a promise, the error is a <em>rejection</em> that travels down the chain to the nearest <code>.catch</code>. In <code>async/await</code>, the rejection is re-thrown at the <code>await</code> point, so ordinary <code>try/catch</code> catches it again. Three styles, three landing spots.</p>`,
        `{{fig:ch4-error-propagation.svg|Three boxes showing a callback error arriving as the first argument, a promise rejection travelling to .catch, and an async/await rejection caught by try/catch, all feeding into an unhandled path that warns or crashes the process|Each async style surfaces errors in its own place; anything left unhandled becomes a process-level rejection that can crash Node.}}`,
        `<p>And the safety net matters: if none of those handlers fire, the error becomes a global event — an <code>uncaughtException</code> for a thrown sync error, or an <code>unhandledRejection</code> for a promise nobody caught. In current Node these are treated as fatal by default and terminate the process.</p>`,
        `<h2>How it works</h2>`,
        `<p><strong>Callbacks.</strong> Because the callback runs on a fresh stack, the function that scheduled it has already returned. A <code>throw</code> inside the callback can't reach that caller — it escapes as an <code>uncaughtException</code>. So the convention is to pass the error as the first argument, and every layer must check it and forward it (<code>if (err) return cb(err)</code>). Miss one check and the error is silently swallowed.</p>`,
        `<p><strong>Promises.</strong> Throwing inside a <code>.then</code> handler, or returning a rejected promise, rejects the promise that handler returned. That rejection then <em>skips every subsequent <code>.then</code></em> and looks downward for a <code>.catch</code> (or the rejection handler of a later <code>.then</code>). This mirrors how synchronous exceptions skip code and unwind to a <code>catch</code> — except it travels <em>down</em> the chain rather than <em>up</em> the stack. A <code>.catch</code> that handles the error and returns a value puts the chain back on the fulfilled track.</p>`,
        `<p><strong>async/await.</strong> When you <code>await</code> a promise that rejects, the engine re-throws the rejection reason as a synchronous exception at that line inside your function. That's the whole trick: it re-enters the normal exception machinery, so <code>try/catch/finally</code> behaves exactly as it does for sync code. An uncaught throw in an <code>async</code> function simply rejects the promise that function returned — pushing the problem to <em>its</em> caller.</p>`,
        `<p><strong>The unhandled path.</strong> A promise that rejects with no handler attached (by the time the microtask queue drains) emits <code>process.on('unhandledRejection')</code>. A synchronous throw that nothing catches emits <code>process.on('uncaughtException')</code>. Both default to crashing. The correct response to <code>uncaughtException</code> is to <em>log and exit</em>, not to resume — the process is in an unknown state.</p>`,
        `<p><strong>Custom Error subclasses.</strong> Branching on <code>err.message.includes('not found')</code> is fragile — messages get reworded, localised, or wrapped. The robust pattern is to subclass <code>Error</code> so callers branch on a <em>type</em> or a stable <code>code</code> instead of prose. Extend <code>Error</code>, call <code>super(message)</code>, and set <code>this.name = this.constructor.name</code> so the stack header reads correctly. Because a rejection reason travels through the chain by <em>reference</em> (it is never copied), <code>instanceof</code> keeps working across every <code>await</code> and <code>.catch</code> between the throw site and the boundary. Give each subclass a machine-readable <code>code</code> and an HTTP <code>status</code>, and the boundary handler becomes a lookup rather than a pile of string matches.</p>`,
        `<p>A small hierarchy of typed errors makes the boundary handler declarative:</p>`,
        `<pre><code class="language-javascript">class AppError extends Error {
  constructor(message, { code, status } = {}) {
    super(message);
    this.name = this.constructor.name;   // fixes the stack's error label
    this.code = code ?? 'INTERNAL';
    this.status = status ?? 500;
    Error.captureStackTrace?.(this, this.constructor); // trim our own frame
  }
}
class NotFoundError extends AppError {
  constructor(what) { super(what + ' not found', { code: 'NOT_FOUND', status: 404 }); }
}

async function handler(req, res) {
  try {
    res.json(await loadUser(req.id));    // may throw NotFoundError
  } catch (err) {
    const status = err instanceof AppError ? err.status : 500;
    res.status(status).json({ error: err.code ?? 'INTERNAL', message: err.message });
  }
}</code></pre>`,
        `<p>One built-in subclass is specific to async code: <code>AggregateError</code>, the reason <code>Promise.any</code> rejects with when <em>every</em> input fails. It carries an <code>.errors</code> array holding each individual rejection, so you inspect the collection rather than a single reason — the one common case where a rejection reason is naturally a bundle of errors instead of one.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The same failure in all three styles, so the landing spot is obvious:</p>`,
        `<pre><code class="language-javascript">// Callback: error is arg #1. try/catch here would catch NOTHING.
readConfig((err, cfg) =&gt; {
  if (err) return console.error('callback error:', err.message);
  use(cfg);
});

// Promise: rejection flows to .catch, skipping the .then above it.
readConfig()
  .then((cfg) =&gt; use(cfg))
  .catch((err) =&gt; console.error('promise error:', err.message));

// async/await: rejection is re-thrown at the await; try/catch works.
async function run() {
  try {
    const cfg = await readConfig();
    use(cfg);
  } catch (err) {
    console.error('await error:', err.message);
  }
}</code></pre>`,
        `<p>Propagation: re-throwing (or letting it throw) lets a higher layer decide. Don't catch just to log and swallow — that hides failures:</p>`,
        `<pre><code class="language-javascript">async function loadUser(id) {
  const row = await db.find(id);
  if (!row) throw new Error('user not found: ' + id); // becomes a rejection
  return row;
}

async function handler(req, res) {
  try {
    const user = await loadUser(req.id);
    res.json(user);
  } catch (err) {
    // Handle ONCE, at the boundary — map to a response.
    res.status(err.message.includes('not found') ? 404 : 500)
       .json({ error: err.message });
  }
}</code></pre>`,
        `<p>Partial failure with <code>allSettled</code>, so one bad item doesn't sink the batch — and a global safety net for anything that slips through:</p>`,
        `<pre><code class="language-javascript">const results = await Promise.allSettled(ids.map(loadUser));
const users = results.filter((r) =&gt; r.status === 'fulfilled').map((r) =&gt; r.value);
const failures = results.filter((r) =&gt; r.status === 'rejected');
console.log('loaded', users.length, 'failed', failures.length);

// Last-resort net: log and exit — never silently resume.
process.on('unhandledRejection', (reason) =&gt; {
  console.error('UNHANDLED REJECTION:', reason);
  process.exit(1);
});
process.on('uncaughtException', (err) =&gt; {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});</code></pre>`,
        `<p>A subtle propagation trap — <code>return</code> vs <code>return await</code> inside <code>try</code>:</p>`,
        `<pre><code class="language-javascript">async function a() {
  try {
    return await mightReject(); // await → rejection caught here
  } catch (err) {
    return fallback();          // this runs on rejection
  }
}
// With plain 'return mightReject()' the pending promise leaves the try
// block first, so the catch never fires and the caller gets the rejection.</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>
          <li><strong>Wrapping async callbacks in <code>try/catch</code>.</strong> It catches nothing — the callback runs on a new stack. Check the <code>err</code> argument instead.</li>
          <li><strong>The missing <code>.catch</code> / unhandled rejection.</strong> A rejected promise with no handler warns and, by default, crashes current Node. Every chain needs a terminal handler.</li>
          <li><strong>Swallowing errors.</strong> <code>catch (e) {}</code> or a <code>.catch</code> that only logs and returns hides real failures and leaves callers thinking things succeeded.</li>
          <li><strong>Catching too early.</strong> Handling an error deep in a helper and returning <code>null</code> forces every caller to guess whether <code>null</code> means "empty" or "failed". Prefer to propagate and handle once at the boundary.</li>
          <li><strong>Rejecting/throwing non-Errors.</strong> <code>throw 'oops'</code> or <code>reject('bad')</code> loses the stack trace and breaks <code>err.message</code>. Always use <code>Error</code> objects.</li>
          <li><strong><code>return</code> vs <code>return await</code> in a <code>try</code>.</strong> Without <code>await</code>, the promise escapes the <code>try</code> before it can reject, so the local <code>catch</code> never runs.</li>
          <li><strong>Trying to resume after <code>uncaughtException</code>.</strong> The process state is corrupt; log and exit (let a supervisor restart), don't continue serving.</li>
          <li><strong>Sibling rejections in <code>Promise.all</code>.</strong> After <code>all</code> rejects, other promises keep running; if one later rejects unhandled, you get a separate unhandled rejection.</li>
          <li><strong>Losing the subclass by cloning the error.</strong> Serialising an error to JSON and rethrowing the plain object strips its prototype, so <code>instanceof</code> and <code>code</code> checks fail downstream. Pass the original <code>Error</code> by reference through the chain, and only serialise it at the very edge (the log line or HTTP body).</li>
        </ul>`,
        `<h2>Best practices</h2>`,
        `<ul>
          <li>Always terminate promise chains with <code>.catch</code>, or <code>await</code> them inside <code>try/catch</code>.</li>
          <li>Propagate errors to a single boundary (route handler, job runner) and translate them to responses/retries there — handle once.</li>
          <li>Throw and reject with <code>Error</code> subclasses so you keep stacks and can branch on <code>error.code</code> or <code>instanceof</code>.</li>
          <li>Register <code>unhandledRejection</code> and <code>uncaughtException</code> handlers that log and <strong>exit</strong>; rely on a process manager to restart.</li>
          <li>Use <code>allSettled</code> when partial success is acceptable, so one failure doesn't discard every good result.</li>
          <li>Add cleanup in <code>finally</code> (release connections, clear timers) so it runs on both success and failure.</li>
          <li>Enable a linter rule for floating promises and unhandled rejections — catch the bug before production does.</li>
        </ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: Why can't <code>try/catch</code> catch an error from an async callback?</strong><br/>The callback runs on a fresh stack after the <code>try</code> block has already returned. The throw escapes as an <code>uncaughtException</code>. That's why the error is passed as the callback's first argument instead.</p></blockquote>`,
        `<blockquote><p><strong>Q: How does an error propagate through a promise chain?</strong><br/>A throw or rejection skips every subsequent <code>.then</code> and travels down to the nearest rejection handler (<code>.catch</code> or a <code>.then</code>'s second argument), much like an exception unwinding to a <code>catch</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: What happens on an unhandled promise rejection in current Node?</strong><br/>It emits <code>process.on('unhandledRejection')</code> and, by default, terminates the process with a non-zero exit code. You should attach handlers and, for uncaught cases, log and exit rather than resume.</p></blockquote>`,
        `<blockquote><p><strong>Q: <code>unhandledRejection</code> vs <code>uncaughtException</code> — difference?</strong><br/><code>uncaughtException</code> is a synchronous throw nothing caught; <code>unhandledRejection</code> is a rejected promise with no handler when the microtask queue drains. Both are last-resort signals; the safe action for both is log and exit.</p></blockquote>`,
        `<blockquote><p><strong>Q: Should you keep serving after an <code>uncaughtException</code>? (trap)</strong><br/>No. The process may be in a corrupt, unknown state. Log, run fast cleanup, and exit; let a supervisor (pm2, systemd, Kubernetes) restart a clean process.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why prefer propagating an error over catching it deep inside a helper?</strong><br/>Local catches that return <code>null</code> force every caller to disambiguate "no data" from "failure" and scatter handling everywhere. Propagating to one boundary centralises the policy (status code, retry, log) and keeps helpers honest.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>
          <li><strong>Callback:</strong> error is arg #1; <code>try/catch</code> can't catch it — check &amp; forward.</li>
          <li><strong>Promise:</strong> rejection flows down to <code>.catch</code>, skipping <code>.then</code>s.</li>
          <li><strong>await:</strong> rejection re-throws at the await → normal <code>try/catch</code>.</li>
          <li><strong>Unhandled:</strong> <code>unhandledRejection</code> / <code>uncaughtException</code> → default crash.</li>
          <li><strong>Rule:</strong> throw <code>Error</code>s, propagate to one boundary, handle once.</li>
          <li><strong>Safety net:</strong> global handlers should log &amp; <code>process.exit(1)</code>, not resume.</li>
        </ul>`
      ].join('\n')
    },

    // ------------------------------------------------------------------ 4
    {
      title: 'EventEmitter',
      slug: 'eventemitter',
      order: 4,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Promises and <code>async/await</code> model a <em>single</em> future result. But a huge amount of Node is about things that happen <em>repeatedly</em> over time: a socket receiving many chunks, an HTTP server handling request after request, a stream emitting <code>data</code> then <code>end</code>, a file watcher firing on every change. A promise can't model "this will happen many times." That's what the <strong>EventEmitter</strong> is for, and it sits at the heart of Node's most important subsystems — streams, servers, sockets, the process object itself.</p>`,
        `<p>Understanding <code>EventEmitter</code> is what lets you read Node's own APIs fluently (<code>req.on('data', ...)</code>, <code>server.on('connection', ...)</code>) and build clean decoupled architectures of your own. It's also a classic interview topic: the memory-leak warning about too many listeners, the difference between <code>on</code> and <code>once</code>, the fact that emission is synchronous, and the special status of the <code>'error'</code> event all trip up people who've only ever used it casually.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>An <code>EventEmitter</code> is an object that lets you <strong>publish</strong> named events and <strong>subscribe</strong> to them — the observer (pub/sub) pattern, built into Node's core. You register a listener with <code>emitter.on('event', handler)</code>, and later something calls <code>emitter.emit('event', ...args)</code>, which invokes every registered handler for that name, in order, passing along the arguments. The emitter and the listeners don't know about each other's internals — that decoupling is the whole point.</p>`,
        `{{fig:ch4-eventemitter.svg|One emitter calling emit('data') which fans out synchronously to three registered listeners A, B, and a once-listener C, in registration order|A single emit call invokes every registered listener for that event synchronously, in the order they were added.}}`,
        `<p>Two subscription verbs matter: <code>on</code> (alias <code>addListener</code>) registers a handler that fires <em>every</em> time the event is emitted; <code>once</code> registers one that fires <em>only the first time</em> and then removes itself automatically. You unsubscribe with <code>off</code> (alias <code>removeListener</code>). Most Node objects you use daily — streams, servers, sockets — <em>are</em> EventEmitters or inherit from one.</p>`,
        `<h2>How it works</h2>`,
        `<p>Internally an emitter keeps a map from event name to an array of listener functions. <code>emit(name, ...args)</code> looks up that array and calls each function <strong>synchronously</strong>, one after another, on the current stack — right there, before <code>emit</code> returns. This surprises people: emitting an event is <em>not</em> asynchronous. If a listener does slow synchronous work, it blocks. If a listener throws, it propagates out of the <code>emit</code> call and can stop later listeners from running. Listeners fire in registration order; <code>emit</code> returns <code>true</code> if there were listeners, <code>false</code> if none.</p>`,
        `<p><code>once</code> works by wrapping your handler: the wrapper removes itself from the listener array before (or as) it calls your function, guaranteeing a single invocation. <code>removeListener</code>/<code>off</code> splices the function out of the array — which is why you must pass the <em>same function reference</em> you registered; an inline arrow can't be removed because you no longer hold its reference.</p>`,
        `<p>Two special behaviours are worth memorising. First, the <code>'error'</code> event is privileged: if an emitter emits <code>'error'</code> and there is <strong>no</strong> listener for it, Node <em>throws</em> the error, typically crashing the process. So any long-lived emitter must have an <code>'error'</code> listener. Second, there's a built-in leak guard: if you add more than <code>defaultMaxListeners</code> (10) listeners for a single event, Node prints a <code>MaxListenersExceededWarning</code>. It's not an error — it's a heuristic that you're probably adding listeners in a loop and forgetting to remove them.</p>`,
        `<p>It helps to contrast the EventEmitter with a promise directly, because they solve genuinely different shapes of problem. A promise is a <em>value</em>: it settles exactly once, it caches its result, and a consumer that subscribes <em>after</em> it settles still gets the value. An event is a <em>notification</em>: <code>emit</code> fans out to whoever is listening <em>at that moment</em>, keeps no history, and a listener that subscribes after the emission simply misses it. That single difference — replayable value versus fire-and-forget signal — is the deciding factor when you're choosing between them. Repeated occurrences, multiple independent subscribers, or "tell me each time X happens" all point to events; "give me the one result of this operation" points to a promise.</p>`,
        `<p>A few more mechanics round out the model. <code>emitter.listenerCount(name)</code> tells you how many handlers are registered, and <code>emitter.eventNames()</code> lists the events that currently have any. <code>prependListener</code> adds a handler to the <em>front</em> of the array so it runs before existing ones — occasionally useful for instrumentation. <code>emitter.setMaxListeners(n)</code> raises the warning threshold for that instance, and <code>EventEmitter.defaultMaxListeners</code> changes it globally. And because listeners run synchronously, the value <code>emit</code> returns (<code>true</code> if any listener ran, else <code>false</code>) is known immediately — there is no waiting involved.</p>`,
        `<p>The core method surface is small; this table is effectively the whole working vocabulary:</p>`,
        `<table>
          <thead><tr><th>Method</th><th>Effect</th></tr></thead>
          <tbody>
            <tr><td><code>on(name, fn)</code> / <code>addListener</code></td><td>Subscribe; fires on every emission</td></tr>
            <tr><td><code>once(name, fn)</code></td><td>Subscribe; fires once, then self-removes</td></tr>
            <tr><td><code>off(name, fn)</code> / <code>removeListener</code></td><td>Unsubscribe by function reference</td></tr>
            <tr><td><code>emit(name, ...args)</code></td><td>Invoke every listener synchronously; returns <code>true</code> if any ran</td></tr>
            <tr><td><code>prependListener(name, fn)</code></td><td>Subscribe at the front of the queue</td></tr>
            <tr><td><code>removeAllListeners(name?)</code></td><td>Drop all listeners for one event, or for every event</td></tr>
            <tr><td><code>listenerCount(name)</code> / <code>eventNames()</code></td><td>Introspect current subscriptions</td></tr>
            <tr><td><code>setMaxListeners(n)</code></td><td>Raise this instance's leak-warning threshold</td></tr>
          </tbody>
        </table>`,
        `<p>Because listeners run synchronously and share the emitter's stack, a listener that <code>await</code>s does <em>not</em> make <code>emit</code> wait: <code>emit</code> returns the instant the synchronous portion of every listener has run, long before any async work inside them settles. The EventEmitter contract simply has no way to report "all listener work finished" — if you need that, collect the listeners' promises yourself or model the flow with a promise instead. The same shared stack is why a throw inside one listener can stop the listeners registered after it from running at all: the exception unwinds <code>emit</code> before it reaches them. Keeping each listener fast, non-throwing, and self-contained is therefore not just style — it is what keeps one subscriber from silently breaking the others.</p>`,
        `<h2>Code examples</h2>`,
        `<p>Basic pub/sub with <code>on</code>, <code>once</code>, and <code>emit</code>. Note the once-listener fires a single time:</p>`,
        `<pre><code class="language-javascript">const { EventEmitter } = require('node:events');
const bus = new EventEmitter();

bus.on('order', (id, total) =&gt; console.log('order', id, 'for', total));
bus.once('ready', () =&gt; console.log('ready — fires only once'));

bus.emit('ready');           // logs
bus.emit('ready');           // nothing — once already removed itself
bus.emit('order', 42, 999);  // logs: order 42 for 999</code></pre>`,
        `<p>Building your own emitter by extending the class — the idiomatic way to give an object an event API:</p>`,
        `<pre><code class="language-javascript">class Job extends EventEmitter {
  async run() {
    this.emit('start');
    try {
      const result = await doWork();
      this.emit('done', result); // listeners run synchronously here
    } catch (err) {
      this.emit('error', err);   // MUST have an 'error' listener
    }
  }
}

const job = new Job();
job.on('start', () =&gt; console.log('started'));
job.on('done', (r) =&gt; console.log('finished', r));
job.on('error', (e) =&gt; console.error('failed', e.message)); // required
job.run();</code></pre>`,
        `<p>Removing listeners correctly (keep the reference) and proving emission is synchronous:</p>`,
        `<pre><code class="language-javascript">function onData(chunk) { console.log('got', chunk); }
bus.on('data', onData);
bus.off('data', onData);      // works — same reference
// bus.off('data', (c) =&gt; {}); // would NOT remove anything

console.log('before emit');
bus.on('sync', () =&gt; console.log('during emit'));
bus.emit('sync');
console.log('after emit');
// Order: before emit → during emit → after emit  (synchronous!)</code></pre>`,
        `<p>Bridging an event-based flow to a promise with <code>events.once</code> — useful when you want to <code>await</code> the next occurrence of an event:</p>`,
        `<pre><code class="language-javascript">const { once } = require('node:events');

async function waitForConnect(server) {
  server.listen(3000);
  await once(server, 'listening'); // resolves on the event, rejects on 'error'
  console.log('server is up');
}</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>
          <li><strong>No <code>'error'</code> listener.</strong> An emitted <code>'error'</code> with no handler is <em>thrown</em> and usually crashes the process. Always attach an <code>'error'</code> listener to long-lived emitters (streams, sockets, servers).</li>
          <li><strong>Assuming <code>emit</code> is async.</strong> Listeners run synchronously on the current stack before <code>emit</code> returns. Slow listener work blocks; if you need async, defer inside the listener.</li>
          <li><strong>The memory leak: adding listeners in a loop.</strong> Registering a listener per request/iteration without removing them grows the array unboundedly. The <code>MaxListenersExceededWarning</code> at 11 listeners is Node telling you so.</li>
          <li><strong>Removing an anonymous listener.</strong> You can only <code>off</code>/<code>removeListener</code> a function you hold a reference to. Inline arrows can never be removed — keep a named reference or use <code>once</code>.</li>
          <li><strong>A throwing listener halting the rest.</strong> An exception in one synchronous listener propagates out of <code>emit</code> and can prevent later listeners from running. Keep listeners defensive.</li>
          <li><strong>Bumping <code>setMaxListeners</code> to silence the warning.</strong> That hides a real leak. Fix the registration/removal logic instead, and only raise the limit when you genuinely need many listeners.</li>
          <li><strong>Using events for one-shot request/response.</strong> If something happens exactly once and you need its value, a promise is clearer than wiring up and tearing down listeners.</li>
        </ul>`,
        `<h2>Best practices</h2>`,
        `<ul>
          <li>Always register an <code>'error'</code> listener on any emitter that can emit one; unhandled <code>'error'</code> crashes the process.</li>
          <li>Use <code>once</code> for one-time events so the listener cleans itself up automatically.</li>
          <li>Keep named references to listeners you'll need to remove, and remove them when the subscriber goes away to prevent leaks.</li>
          <li>Keep listeners fast and non-throwing; do heavy or async work by scheduling it, not inline in the listener.</li>
          <li>Treat the <code>MaxListenersExceededWarning</code> as a leak signal to investigate, not noise to suppress.</li>
          <li>Reach for <code>events.once(emitter, name)</code> to <code>await</code> a single future event, and <code>events.on</code> (async iterator) to consume a stream of them.</li>
          <li>Choose events for <em>recurring</em> or <em>broadcast</em> notifications; choose promises for a <em>single</em> eventual result.</li>
        </ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: Is <code>emit</code> synchronous or asynchronous?</strong><br/>Synchronous. It invokes every listener for the event in registration order, on the current stack, before <code>emit</code> returns. This surprises people who assume events are always deferred.</p></blockquote>`,
        `<blockquote><p><strong>Q: What happens if you emit <code>'error'</code> with no listener? (trap)</strong><br/>Node throws the error as an exception, which typically crashes the process. The <code>'error'</code> event is special-cased precisely so silent failures don't go unnoticed — always attach a handler.</p></blockquote>`,
        `<blockquote><p><strong>Q: Difference between <code>on</code> and <code>once</code>?</strong><br/><code>on</code> fires the listener on every emission; <code>once</code> fires it only the first time and then auto-removes it. <code>once</code> is implemented as a self-removing wrapper around your handler.</p></blockquote>`,
        `<blockquote><p><strong>Q: What causes the MaxListenersExceededWarning and is it an error?</strong><br/>Adding more than 10 listeners (the default) for one event name. It's a warning, not an error — a heuristic that you're likely leaking listeners by adding them repeatedly without removing them.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why can't you remove an inline arrow-function listener?</strong><br/><code>removeListener</code>/<code>off</code> matches by function reference. An inline arrow creates a new function you don't keep a handle to, so there's nothing to pass back to remove it. Keep a named reference.</p></blockquote>`,
        `<blockquote><p><strong>Q: When would you use an EventEmitter over a promise?</strong><br/>When the thing happens more than once or is broadcast to multiple independent subscribers — streaming data, connection events, progress updates. Promises model a single eventual value; events model an ongoing stream of occurrences.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>
          <li><strong>Pattern:</strong> pub/sub — <code>on</code>/<code>once</code> to subscribe, <code>emit</code> to publish.</li>
          <li><strong><code>emit</code> is synchronous</strong> — listeners run in order, on the current stack.</li>
          <li><strong><code>once</code></strong> fires once and self-removes; <code>off</code> needs the same reference.</li>
          <li><strong><code>'error'</code></strong> with no listener throws and crashes — always handle it.</li>
          <li><strong>Leak guard:</strong> &gt;10 listeners on one event → warning; fix removal, don't mute.</li>
          <li><strong>Use events</strong> for many/broadcast occurrences; <strong>promises</strong> for a single result.</li>
        </ul>`
      ].join('\n')
    }
  ]
};
