// Chapter 2 — Event Loop & Async Architecture
// Node.js Backend Kit. Accurate for Node v20 / v22 (libuv-based event loop).
// Content authored as arrays of backtick HTML strings joined with '\n'.

module.exports = {
  title: 'Event Loop & Async Architecture',
  slug: 'event-loop',
  order: 1,
  topics: [
    // ─────────────────────────────────────────────────────────────
    // Topic 0 — event-loop-phases
    // ─────────────────────────────────────────────────────────────
    {
      title: 'The Event Loop Phases',
      slug: 'event-loop-phases',
      order: 0,
      content: [
`<h2>Why it matters</h2>`,
`<p>Node.js can serve thousands of simultaneous connections on a single thread, and the reason is the <strong>event loop</strong>. It is the scheduler at the heart of the runtime: a C-level loop, provided by the <code>libuv</code> library, that decides <em>which callback runs next</em>. Every timer that fires, every file that finishes reading, every HTTP request that lands on your server is a callback that the event loop picks up and hands to V8 to execute.</p>`,
`<p>If you do not understand the phases of this loop, three categories of bug become impossible to reason about. First, <strong>ordering bugs</strong>: "why did my <code>setTimeout</code> callback run before my <code>setImmediate</code> callback here, but after it over there?" Second, <strong>latency bugs</strong>: "why does my server occasionally stall for 400ms even though every handler looks fast?" Third, <strong>starvation bugs</strong>: "why does this recursive callback freeze the whole process?" All three trace back to the same source of truth — the order in which the loop drains its queues.</p>`,
`<p>This is also the single most reliably asked Node.js interview topic. Interviewers love it precisely because it separates people who have memorised "Node is non-blocking" from people who can predict the exact output of a snippet and explain <em>why</em>. That "why" is what this topic gives you.</p>`,

`<h2>The concept, simply</h2>`,
`<p>Think of the event loop as a person working through a set of inboxes, in a fixed order, over and over. Each inbox — Node calls them <strong>phases</strong> — holds a specific kind of pending callback. The worker opens the first inbox, handles everything of that type, closes it, moves to the next inbox, and so on. When they reach the last inbox they loop back to the first. That full trip around the inboxes is one <strong>tick</strong> (more precisely, one iteration of the loop).</p>`,
`<p>There are six phases, and their order never changes:</p>`,
`<ol>
  <li><strong>timers</strong> — runs callbacks scheduled by <code>setTimeout</code> and <code>setInterval</code> whose delay has elapsed.</li>
  <li><strong>pending callbacks</strong> — runs a small set of system-level callbacks deferred from a previous loop (e.g. certain TCP errors like <code>ECONNREFUSED</code>).</li>
  <li><strong>idle, prepare</strong> — internal to libuv only; you never schedule work here.</li>
  <li><strong>poll</strong> — the heart of the loop. Retrieves new I/O events and runs their callbacks (incoming data, completed file reads). This is the phase where the loop will <em>block and wait</em> if there is nothing else to do.</li>
  <li><strong>check</strong> — runs <code>setImmediate</code> callbacks.</li>
  <li><strong>close callbacks</strong> — runs <code>'close'</code> handlers, e.g. <code>socket.on('close', ...)</code>.</li>
</ol>`,
`<p>People usually shorten this to five that you actually schedule into: <strong>timers → pending → poll → check → close</strong>. The diagram below shows the ring the loop walks.</p>`,
`{{fig:ch2-event-loop-phases.svg|Circular diagram of the six event loop phases: timers, pending callbacks, idle/prepare, poll, check, and close callbacks|The event loop is a fixed ring of phases. Each phase drains its own queue before the loop advances to the next.}}`,

`<h2>How it works</h2>`,
`<p>Each phase owns a <strong>FIFO queue</strong> of callbacks. When the loop enters a phase, it executes callbacks from that phase's queue <em>one by one</em> until either the queue is empty or a system-dependent maximum number of callbacks has run. Then it moves to the next phase. Callbacks you schedule while inside a phase do not necessarily run in that same phase — they land in the appropriate phase's queue and are picked up when the loop next reaches it.</p>`,
`{{fig:ch2-phase-queues.svg|A phase box containing several queued I/O callbacks that drain left to right until empty, then hand off to the next phase|Within a phase the loop drains the queue callback by callback; when it empties, control passes to the next phase.}}`,
`<p>Two subtleties do most of the interview damage:</p>`,
`<p><strong>1. The poll phase has special blocking behaviour.</strong> When the loop reaches poll, it looks at the poll queue. If there are callbacks, it runs them. If the poll queue is empty, the loop does one of two things. If there are <code>setImmediate</code> callbacks waiting, it ends poll immediately and jumps to the check phase to run them. If there is no immediate work anywhere, it will <em>block</em> in poll, waiting for the operating system to deliver an I/O event — but only until the nearest timer is due. This is how an idle Node server uses ~0% CPU: it is parked in the poll phase inside a kernel call (<code>epoll_wait</code> on Linux), asleep until something happens.</p>`,
`<p><strong>2. Between operations, two special queues drain — and they are not phases.</strong> After the currently executing callback returns (and again at each phase boundary), Node fully drains the <code>process.nextTick</code> queue, then fully drains the Promise <strong>microtask</strong> queue, before doing anything else. These queues do not belong to any phase; they interleave <em>between</em> callbacks. This is why a promise <code>.then</code> always beats a <code>setTimeout(…, 0)</code>: the microtask queue is emptied before the loop is even allowed to advance to the next macrotask. We cover this fully in the microtasks topic — but you must hold the picture that phases are the coarse structure and microtasks squeeze in between every callback.</p>`,
`<p>So the true rhythm of one turn is: run a phase callback → drain nextTick → drain microtasks → run the next phase callback → drain nextTick → drain microtasks → … → queue empty → advance phase. The phases give the skeleton; the microtask drains happen constantly in between.</p>`,
`<p>One more framing that helps: the loop keeps running as long as there is any pending work — an open handle (a listening server, an active timer, an open socket). When no handles or requests remain, <code>uv_run</code> returns and the Node process exits naturally. That is why a bare script with a <code>setInterval</code> never exits, and why an HTTP server stays alive: the listening socket is a ref'd handle that keeps the loop turning.</p>`,

`<h2>Code examples</h2>`,
`<p><strong>Example 1 — timers vs immediate at the top level is not guaranteed.</strong></p>`,
`<pre><code class="language-javascript">setTimeout(() =&gt; console.log('timeout'), 0);
setImmediate(() =&gt; console.log('immediate'));

// Possible output A:        Possible output B:
//   timeout                   immediate
//   immediate                 timeout
</code></pre>`,
`<p>At the top level the result is a race. <code>setTimeout(fn, 0)</code> is clamped to a 1ms minimum. Whether the loop reaches the timers phase and finds that 1ms already elapsed depends on how long process startup took — a few hundred microseconds of jitter decides the winner. Never rely on this ordering.</p>`,
`<p><strong>Example 2 — inside an I/O callback, the order becomes deterministic.</strong></p>`,
`<pre><code class="language-javascript">const fs = require('fs');

fs.readFile(__filename, () =&gt; {
  setTimeout(() =&gt; console.log('timeout'), 0);
  setImmediate(() =&gt; console.log('immediate'));
});

// Output (always):
//   immediate
//   timeout
</code></pre>`,
`<p>The <code>readFile</code> callback runs in the <strong>poll</strong> phase. The very next phase is <strong>check</strong>, so the queued <code>setImmediate</code> fires first. The <code>setTimeout</code> has to wait for the loop to wrap all the way back around to the timers phase on the next iteration. This ordering is guaranteed, and it is a favourite interview question.</p>`,
`<p><strong>Example 3 — the loop stays alive because of a ref'd handle.</strong></p>`,
`<pre><code class="language-javascript">console.log('start');
const t = setInterval(() =&gt; console.log('tick'), 1000);
// The process never exits: the interval is an active handle.
// t.unref() would let the loop exit despite the timer still existing.

// Output:
//   start
//   tick   (every second, forever)
</code></pre>`,
`<p><strong>Example 4 — microtasks jump the phase queue.</strong></p>`,
`<pre><code class="language-javascript">setTimeout(() =&gt; console.log('timeout'), 0);
Promise.resolve().then(() =&gt; console.log('promise'));
console.log('sync');

// Output:
//   sync
//   promise
//   timeout
</code></pre>`,
`<p>Synchronous code runs first. Before the loop advances to the timers phase, it drains the microtask queue, so <code>promise</code> prints before <code>timeout</code> even though the timer was scheduled first.</p>`,

`<h2>Common mistakes &amp; gotchas</h2>`,
`<ul>
  <li><strong>Assuming <code>setTimeout(fn, 0)</code> runs "immediately".</strong> It runs in the next timers phase, after the current stack, after all microtasks, and after a 1ms minimum clamp — potentially much later under load.</li>
  <li><strong>Believing phase order guarantees <code>setTimeout</code> before <code>setImmediate</code>.</strong> Only true inside an I/O callback (and there it is the <em>reverse</em>). At the top level it is a race.</li>
  <li><strong>Thinking a callback scheduled during a phase runs in that same phase.</strong> It is queued for the next time the loop reaches the relevant phase, not appended to the phase you are currently in.</li>
  <li><strong>Forgetting the poll phase can block.</strong> If a timer is due in 200ms and there is no other work, the loop sleeps up to 200ms in poll — that is normal, not a hang.</li>
  <li><strong>Confusing "tick" meanings.</strong> A libuv loop <em>iteration</em> is one trip through the phases; <code>process.nextTick</code> is unrelated to that — its name is historical and misleading.</li>
  <li><strong>Expecting <code>setInterval(fn, 100)</code> to run exactly every 100ms.</strong> It fires no sooner than 100ms after the previous run <em>and</em> only when the loop reaches the timers phase; a busy loop makes intervals drift and coalesce.</li>
</ul>`,

`<h2>Best practices</h2>`,
`<ul>
  <li><strong>Never depend on top-level timer vs immediate ordering.</strong> If you need "run after I/O", use <code>setImmediate</code> inside the I/O callback; if you need "defer to next loop iteration", use <code>setTimeout(fn, 0)</code> and document why.</li>
  <li><strong>Use <code>setImmediate</code> to break up CPU work</strong> so the loop can service I/O between chunks (see the blocking topic).</li>
  <li><strong>Call <code>.unref()</code> on background timers</strong> (heartbeats, metrics flushers) that should not keep the process alive on their own.</li>
  <li><strong>Reason in terms of phases, not milliseconds.</strong> "This runs in the check phase" is precise; "this runs in ~0ms" is a guess.</li>
  <li><strong>Keep individual callbacks short.</strong> The loop is cooperative — it cannot preempt a callback that refuses to return.</li>
</ul>`,

`<h2>⭐ Interview lens</h2>`,
`<blockquote><p><strong>Q: Name the phases of the event loop in order.</strong><br/>Timers → pending callbacks → idle/prepare (internal) → poll → check → close callbacks. In practice you schedule into timers (<code>setTimeout</code>/<code>setInterval</code>), poll (I/O), check (<code>setImmediate</code>), and close. Between every callback the nextTick and microtask queues drain.</p></blockquote>`,
`<blockquote><p><strong>Q: What is the output?</strong><br/><code>setTimeout(() =&gt; console.log('A'), 0); setImmediate(() =&gt; console.log('B'));</code><br/>Indeterminate at the top level — could be A then B or B then A — because it depends on whether ~1ms has elapsed when the loop first reaches the timers phase. If you wrap both in an <code>fs.readFile</code> callback, it is always B then A, because the callback runs in poll and check comes next.</p></blockquote>`,
`<blockquote><p><strong>Q: Why does an idle Node server use almost no CPU?</strong><br/>Because the loop parks in the poll phase inside a blocking kernel call (<code>epoll_wait</code>/<code>kqueue</code>/IOCP), sleeping until the OS delivers an I/O event or the next timer is due. It is not spinning.</p></blockquote>`,
`<blockquote><p><strong>Q: What keeps the event loop — and the process — alive?</strong><br/>Pending work: active timers, open sockets, listening servers, pending thread-pool requests. These are "ref'd handles". When none remain, <code>uv_run</code> returns and the process exits. <code>unref()</code> marks a handle as not counting toward that.</p></blockquote>`,
`<blockquote><p><strong>Q: In the poll phase, when does the loop decide to move on instead of waiting?</strong><br/>If the poll queue is non-empty it runs those callbacks. If it is empty but <code>setImmediate</code> callbacks exist, it ends poll and goes to check. If nothing is pending anywhere, it blocks in poll until an I/O event arrives or the nearest timer's threshold is reached.</p></blockquote>`,
`<blockquote><p><strong>Q: Is the event loop the same as a thread?</strong><br/>No. The event loop is a scheduling algorithm running on the single main JS thread. libuv also manages a separate worker thread pool for certain blocking operations, but your JavaScript callbacks all execute on the one main thread, one at a time.</p></blockquote>`,

`<h2>Cheat-card</h2>`,
`<ul>
  <li><strong>Order:</strong> timers → pending → poll → check → close, then repeat.</li>
  <li><strong>timers:</strong> <code>setTimeout</code>/<code>setInterval</code>. <strong>poll:</strong> I/O callbacks (can block). <strong>check:</strong> <code>setImmediate</code>. <strong>close:</strong> <code>'close'</code> events.</li>
  <li>Each phase drains its FIFO queue, then advances.</li>
  <li>nextTick + microtasks drain <em>between every callback</em>, not as a phase.</li>
  <li>Inside I/O callback: <code>setImmediate</code> beats <code>setTimeout(0)</code> — always.</li>
  <li>Top level: timer vs immediate order is a race — never rely on it.</li>
  <li>Loop lives while ref'd handles exist; <code>unref()</code> releases them.</li>
</ul>`
      ].join('\n')
    },

    // ─────────────────────────────────────────────────────────────
    // Topic 1 — libuv-thread-pool
    // ─────────────────────────────────────────────────────────────
    {
      title: 'libuv & the Thread Pool',
      slug: 'libuv-thread-pool',
      order: 1,
      content: [
`<h2>Why it matters</h2>`,
`<p>"Node.js is single-threaded" is the most repeated — and most misleading — sentence in backend interviews. Your <em>JavaScript</em> runs on a single thread. Node as a whole is emphatically multi-threaded: underneath your code sits <strong>libuv</strong>, a C library that owns the event loop <em>and</em> a pool of worker threads, plus it hands as much work as possible straight to the operating system's own asynchronous machinery. Understanding this layer is what lets you answer the real questions: why does reading 4 files concurrently sometimes serialise into two batches? Why does <code>crypto.pbkdf2</code> scale to exactly 4 parallel calls and then stall? Why is a DNS lookup mysteriously slow while an HTTP request to the same host is fast?</p>`,
`<p>Every one of those has the same root: some operations are truly async at the OS level and cost no thread, while others are only <em>faked</em> as async by running them on libuv's small thread pool. Knowing which is which is the difference between an application that scales and one that intermittently freezes under load for reasons nobody can explain.</p>`,

`<h2>The concept, simply</h2>`,
`<p>Picture Node as three cooperating layers. At the top, <strong>V8</strong> runs your JavaScript on one thread. In the middle, <strong>libuv</strong> is the plumbing: it runs the event loop on that same main thread, and it also manages a separate <strong>thread pool</strong> (four background worker threads by default). At the bottom is the <strong>operating system kernel</strong>, which has its own efficient event notification systems (<code>epoll</code> on Linux, <code>kqueue</code> on macOS/BSD, IOCP on Windows).</p>`,
`{{fig:ch2-libuv-architecture.svg|Layered diagram showing the single main JS thread with the event loop, libuv bridging to the OS kernel for network I/O and to a four-worker thread pool for file and crypto work|One JS thread runs your code; libuv gives Node real concurrency via the OS kernel and a worker thread pool.}}`,
`<p>When your code does something asynchronous, libuv routes it down one of two paths:</p>`,
`<ul>
  <li><strong>The kernel path (free concurrency):</strong> network sockets — TCP, UDP, HTTP, HTTPS — are natively asynchronous in the OS. libuv just registers interest and the kernel notifies the poll phase when data arrives. <em>No thread is consumed.</em> You can have tens of thousands of idle connections for almost no cost.</li>
  <li><strong>The thread pool path (borrowed concurrency):</strong> some operations have no async kernel API, or their API is blocking. The filesystem is the classic case. For these, libuv hands the work to one of its worker threads, which performs the blocking call and then posts the result back to the loop. Because there are only four workers by default, only four such operations run truly in parallel.</li>
</ul>`,

`<h2>How it works</h2>`,
`<p><strong>What actually uses the thread pool.</strong> The list is short and worth memorising because it is exactly what interviewers probe:</p>`,
`<ul>
  <li><strong>File system</strong> — almost all of <code>fs.*</code> (<code>readFile</code>, <code>writeFile</code>, <code>stat</code>, etc.). The POSIX file API is synchronous, so libuv offloads it.</li>
  <li><strong>crypto</strong> — CPU-heavy async crypto: <code>crypto.pbkdf2</code>, <code>crypto.scrypt</code>, <code>crypto.randomBytes</code>, key generation.</li>
  <li><strong>zlib</strong> — asynchronous compression/decompression (gzip, deflate, brotli).</li>
  <li><strong><code>dns.lookup</code></strong> — because it calls the system resolver <code>getaddrinfo</code>, which is blocking. This is the sneaky one: it is what <code>http.get('http://example.com')</code> uses under the hood to resolve the hostname.</li>
</ul>`,
`{{fig:ch2-threadpool-offload.svg|Two columns comparing kernel-async operations like TCP, HTTP, pipes and dns.resolve against thread-pool operations like fs, crypto.pbkdf2, zlib and dns.lookup|Network I/O rides the kernel for free; file, crypto, zlib and dns.lookup borrow one of four worker threads.}}`,
`<p><strong>What does NOT use the thread pool.</strong> All network I/O. A thousand concurrent HTTP requests do not consume a thousand threads — they are multiplexed through the kernel and serviced in the poll phase. Confusingly, <code>dns.resolve()</code> (which speaks DNS directly via the bundled c-ares library over a socket) is kernel-async and does <em>not</em> touch the pool, while <code>dns.lookup()</code> (the default that <code>getaddrinfo</code> backs) <em>does</em>. Same-sounding functions, opposite thread behaviour.</p>`,
`<p><strong>The pool has exactly four slots by default.</strong> The environment variable <code>UV_THREADPOOL_SIZE</code> controls it (max 1024, and it must be set before the pool is created — practically, before you do any pool work). If you fire five <code>crypto.pbkdf2</code> calls at once, four start immediately and the fifth waits in a queue until a worker frees up. This produces a very recognisable performance signature: latency that is flat up to four concurrent operations, then rises in steps.</p>`,
`<p><strong>Why the "single-thread myth" is half true and half dangerous.</strong> It is true that your JS logic never runs on two threads at once — you get memory safety for free, no locks, no data races on your objects. It is dangerous when people conclude "so Node can't do parallel work". It can: I/O is parallel via the kernel, and heavy filesystem/crypto/zlib work is parallel via the pool. What is <em>not</em> parallel is your own CPU-bound JavaScript — a <code>for</code> loop crunching numbers occupies the one JS thread and blocks the loop (see the blocking topic, and use <code>worker_threads</code> for genuine JS parallelism).</p>`,

`<h2>Code examples</h2>`,
`<p><strong>Example 1 — the four-slot ceiling is observable.</strong></p>`,
`<pre><code class="language-javascript">const crypto = require('crypto');
const start = Date.now();

// Fire six identical CPU-bound hashes concurrently.
for (let i = 1; i &lt;= 6; i++) {
  crypto.pbkdf2('secret', 'salt', 100000, 64, 'sha512', () =&gt; {
    console.log(\`hash \${i} done in \${Date.now() - start}ms\`);
  });
}

// Typical output (4-core machine, default pool of 4):
//   hash 1 done in ~180ms
//   hash 2 done in ~180ms
//   hash 3 done in ~180ms
//   hash 4 done in ~180ms   &lt;- first four finish together
//   hash 5 done in ~360ms
//   hash 6 done in ~360ms   &lt;- next two wait for a free worker
</code></pre>`,
`<p>The first four run in parallel on the four workers; calls five and six queue and only start once a worker is free — so they finish in roughly double the time. This is the thread pool made visible.</p>`,
`<p><strong>Example 2 — raise the ceiling with <code>UV_THREADPOOL_SIZE</code>.</strong></p>`,
`<pre><code class="language-javascript">// Run with: UV_THREADPOOL_SIZE=8 node app.js
console.log(process.env.UV_THREADPOOL_SIZE); // '8'

// Now all six hashes above start immediately and finish together,
// because there are enough workers. Set it BEFORE any pool work;
// setting process.env.UV_THREADPOOL_SIZE at runtime is too late
// once the pool has been created.
</code></pre>`,
`<p><strong>Example 3 — network I/O ignores the pool entirely.</strong></p>`,
`<pre><code class="language-javascript">const https = require('https');
const start = Date.now();

// 50 concurrent requests — served via the kernel, not 50 threads.
for (let i = 0; i &lt; 50; i++) {
  https.get('https://example.com', (res) =&gt; {
    res.on('data', () =&gt; {});
    res.on('end', () =&gt; console.log(\`req \${i}: \${Date.now() - start}ms\`));
  });
}
// All 50 progress concurrently regardless of UV_THREADPOOL_SIZE;
// the pool default of 4 does not cap network concurrency.
</code></pre>`,
`<p><strong>Example 4 — the hidden DNS cost.</strong></p>`,
`<pre><code class="language-javascript">const dns = require('dns');

dns.lookup('example.com', () =&gt; {});   // uses a thread-pool worker
dns.resolve4('example.com', () =&gt; {}); // uses c-ares over a socket, no worker

// Under heavy fs load, dns.lookup can queue behind file operations
// on the pool. If DNS feels slow, dns.resolve() often sidesteps it.
</code></pre>`,

`<h2>Common mistakes &amp; gotchas</h2>`,
`<ul>
  <li><strong>Believing all async work is thread-pool work.</strong> Network I/O is kernel-async and does not touch the pool; assuming otherwise leads people to raise <code>UV_THREADPOOL_SIZE</code> hoping to serve more HTTP connections — it does nothing for that.</li>
  <li><strong>Assuming the pool is unlimited.</strong> Four workers by default. Heavy concurrent <code>fs</code> + <code>crypto</code> + <code>zlib</code> compete for the same four slots and can serialise.</li>
  <li><strong>Forgetting <code>dns.lookup</code> uses the pool.</strong> A burst of outbound HTTP can flood the pool with <code>getaddrinfo</code> calls and slow down unrelated file reads.</li>
  <li><strong>Setting <code>UV_THREADPOOL_SIZE</code> too late.</strong> It must be set in the environment before the first pool operation; mutating <code>process.env</code> mid-run after the pool exists has no effect.</li>
  <li><strong>Thinking <code>worker_threads</code> and the libuv thread pool are the same thing.</strong> They are not. The pool is internal to libuv for I/O-ish native work; <code>worker_threads</code> are separate V8 isolates you use to run <em>your own</em> CPU-bound JavaScript in parallel.</li>
  <li><strong>Expecting <code>fs</code> to be "free" like sockets.</strong> Filesystem calls are blocking under the hood; concurrency is bounded by the pool, not the disk.</li>
</ul>`,

`<h2>Best practices</h2>`,
`<ul>
  <li><strong>Match <code>UV_THREADPOOL_SIZE</code> to your workload,</strong> not blindly to CPU count. If you do heavy concurrent <code>fs</code>/<code>crypto</code>/<code>zlib</code>, a larger pool (e.g. 8–16) can help; measure before and after.</li>
  <li><strong>Use <code>dns.resolve()</code> instead of <code>dns.lookup()</code></strong> when you need many name resolutions and want to keep them off the pool.</li>
  <li><strong>Push genuine CPU-bound JavaScript to <code>worker_threads</code></strong> (or a separate process), never onto the libuv pool — the pool is for native I/O-style work.</li>
  <li><strong>Watch for the "flat then stepped" latency signature</strong> under load; it usually means you have saturated the pool.</li>
  <li><strong>Do not conflate connection scaling with pool size.</strong> To serve more sockets, tune the app and OS limits — the pool is irrelevant to network concurrency.</li>
</ul>`,

`<h2>⭐ Interview lens</h2>`,
`<blockquote><p><strong>Q: Is Node.js single-threaded?</strong><br/>Your JavaScript executes on a single main thread, so there are no data races on your objects. But Node itself is multi-threaded: libuv runs a thread pool (4 by default) for blocking native work like <code>fs</code> and <code>crypto</code>, and network I/O is handled asynchronously by the OS kernel. So "single-threaded" describes JS execution, not the whole runtime.</p></blockquote>`,
`<blockquote><p><strong>Q: Which operations use the libuv thread pool?</strong><br/>Filesystem (<code>fs.*</code>), CPU-heavy crypto (<code>pbkdf2</code>, <code>scrypt</code>, <code>randomBytes</code>, key generation), <code>zlib</code>, and <code>dns.lookup</code> (because it wraps blocking <code>getaddrinfo</code>). Network sockets do <em>not</em> — they are kernel-async.</p></blockquote>`,
`<blockquote><p><strong>Q: You run 6 <code>pbkdf2</code> calls concurrently and the last two are twice as slow. Why?</strong><br/>The default pool has 4 workers. The first four run in parallel; the fifth and sixth queue until a worker frees up, so they complete in roughly double the time. Raising <code>UV_THREADPOOL_SIZE</code> to ≥6 fixes it (given enough CPU cores).</p></blockquote>`,
`<blockquote><p><strong>Q: Does increasing <code>UV_THREADPOOL_SIZE</code> let my server handle more concurrent HTTP connections?</strong><br/>No. HTTP/TCP is serviced via the kernel in the poll phase and does not consume pool threads. The pool size only affects <code>fs</code>/<code>crypto</code>/<code>zlib</code>/<code>dns.lookup</code> throughput.</p></blockquote>`,
`<blockquote><p><strong>Q: What is the difference between <code>dns.lookup</code> and <code>dns.resolve</code>?</strong><br/><code>dns.lookup</code> calls the OS resolver <code>getaddrinfo</code>, which is blocking, so it runs on the thread pool. <code>dns.resolve</code> (and its variants) queries DNS servers directly via c-ares over a socket — kernel-async, no pool thread. Under heavy pool load, <code>lookup</code> can queue while <code>resolve</code> stays fast.</p></blockquote>`,
`<blockquote><p><strong>Q: Thread pool vs <code>worker_threads</code> — same thing?</strong><br/>No. The libuv pool is internal, runs native I/O-style work, and you cannot put arbitrary JS on it. <code>worker_threads</code> are separate V8 isolates you create explicitly to run your own CPU-bound JavaScript in parallel, communicating via message passing or <code>SharedArrayBuffer</code>.</p></blockquote>`,

`<h2>Cheat-card</h2>`,
`<ul>
  <li><strong>1 JS thread</strong> (V8) + <strong>libuv</strong> (event loop + thread pool) + <strong>OS kernel</strong>.</li>
  <li><strong>Kernel-async, no thread:</strong> TCP/UDP/HTTP sockets, pipes, <code>dns.resolve</code>.</li>
  <li><strong>Thread pool (4 default):</strong> <code>fs.*</code>, <code>crypto.pbkdf2/scrypt/randomBytes</code>, <code>zlib</code>, <code>dns.lookup</code>.</li>
  <li>Tune with <code>UV_THREADPOOL_SIZE</code> (max 1024); set it before any pool work.</li>
  <li>Pool ≠ network concurrency. Raising it won't serve more sockets.</li>
  <li>Real JS parallelism → <code>worker_threads</code>, not the pool.</li>
  <li>"Single-threaded" = JS execution only; the runtime is multi-threaded.</li>
</ul>`
      ].join('\n')
    },

    // ─────────────────────────────────────────────────────────────
    // Topic 2 — nexttick-vs-setimmediate
    // ─────────────────────────────────────────────────────────────
    {
      title: 'process.nextTick vs setImmediate',
      slug: 'nexttick-vs-setimmediate',
      order: 2,
      content: [
`<h2>Why it matters</h2>`,
`<p>Three functions promise to "run your callback later": <code>process.nextTick</code>, <code>setImmediate</code>, and <code>setTimeout(fn, 0)</code>. Their names are actively misleading. <code>nextTick</code> does <em>not</em> run on the next loop tick — it runs before the loop continues at all. <code>setImmediate</code> is not immediate — it runs in a specific later phase. And <code>setTimeout(fn, 0)</code> is not zero — it is clamped to at least 1ms. Every Node developer eventually ships a bug because they guessed at this ordering, and every serious Node interview tests whether you actually know it.</p>`,
`<p>The stakes are higher than trivia. Choosing <code>nextTick</code> where you meant <code>setImmediate</code> can <strong>starve the event loop</strong> — a recursive <code>nextTick</code> will prevent timers and I/O from <em>ever</em> running, freezing your server while it looks busy. Choosing the wrong deferral in library code changes the observable order of user callbacks and breaks people who depend on it. This topic makes the ordering deterministic in your head.</p>`,

`<h2>The concept, simply</h2>`,
`<p>Rank these deferral mechanisms by how soon they run, from a callback that is currently executing:</p>`,
`<ol>
  <li><strong><code>process.nextTick(fn)</code></strong> — soonest. Runs after the current operation finishes but <em>before</em> the event loop is allowed to proceed to any phase. It has its own dedicated queue that drains completely first.</li>
  <li><strong>Promise callbacks</strong> (<code>.then</code>, <code>await</code>, <code>queueMicrotask</code>) — the microtask queue, which drains right after the nextTick queue. (Full detail in the next topic.)</li>
  <li><strong><code>setImmediate(fn)</code></strong> — runs in the <strong>check</strong> phase of the loop. A macrotask.</li>
  <li><strong><code>setTimeout(fn, 0)</code></strong> — runs in the <strong>timers</strong> phase, subject to a ~1ms minimum. Also a macrotask.</li>
</ol>`,
`{{fig:ch2-nexttick-timing.svg|Four priority lanes stacked: process.nextTick first, Promise microtasks second, then setTimeout timers phase and setImmediate check phase as macrotasks|nextTick outranks promises, and both drain before any macrotask. setImmediate and setTimeout are macrotasks whose order depends on context.}}`,
`<p>The headline: <strong>nextTick and promises are not part of any phase</strong> — they run <em>between</em> phases, before the loop can advance. <code>setImmediate</code> and <code>setTimeout</code> <em>are</em> phases. So microtask-family callbacks always win against timer/immediate callbacks scheduled at the same moment.</p>`,

`<h2>How it works</h2>`,
`<p><strong>The nextTick queue is special and separate.</strong> Node keeps a dedicated <code>nextTick</code> queue that is <em>not</em> the same as the Promise microtask queue, and it is drained <em>first</em>. After the currently running JavaScript returns — and at every phase boundary — Node does: drain the entire nextTick queue (including any nextTicks added while draining), then drain the entire microtask (Promise) queue. Only then does the loop move forward. Because the nextTick queue is emptied exhaustively before promises, a <code>process.nextTick</code> callback always fires before a <code>Promise.resolve().then</code> callback registered at the same point.</p>`,
`<p><strong>Why nextTick can starve the loop.</strong> Since the loop is not allowed to advance until the nextTick queue is empty, a callback that schedules another <code>nextTick</code>, which schedules another, and so on, creates an infinite queue that never empties. The loop is frozen at that boundary forever: no timers fire, no I/O completes, no <code>setImmediate</code> runs. <code>setImmediate</code> does not have this problem — each <code>setImmediate</code> you schedule from within a check-phase callback runs on the <em>next</em> loop iteration's check phase, so the loop still cycles through poll and timers in between, keeping I/O alive.</p>`,
`{{fig:ch2-tick-lifecycle.svg|Timeline showing a macrotask callback followed by a microtask drain, then another macrotask, then another drain, illustrating recursion risk|Recursion in the nextTick/microtask lane keeps the drain running and can freeze the loop; setImmediate recursion yields between iterations.}}`,
`<p><strong>setImmediate vs setTimeout(0): it depends where you are.</strong> At the top level the order is non-deterministic (a startup-timing race, as in the phases topic). But <em>inside an I/O callback</em>, <code>setImmediate</code> always wins, because I/O callbacks run in the poll phase and the very next phase is check — the <code>setTimeout</code> must wait for the loop to wrap around to timers on the next iteration.</p>`,
`<p><strong>Putting the four mechanisms side by side.</strong> It helps to see exactly where each callback is parked and what governs its turn. The table below is the whole mental model in one place — memorise the "When it runs" column and most output-prediction questions collapse into a lookup.</p>`,
`<table>
  <thead>
    <tr><th>Mechanism</th><th>Queue / phase</th><th>When it runs</th><th>Can starve the loop?</th></tr>
  </thead>
  <tbody>
    <tr><td><code>process.nextTick</code></td><td>Dedicated nextTick queue (not a phase)</td><td>After the current op, before the loop advances; drained fully, ahead of promises</td><td><strong>Yes</strong> — recursive scheduling never lets the loop move on</td></tr>
    <tr><td><code>Promise.then</code> / <code>await</code> / <code>queueMicrotask</code></td><td>V8 microtask queue (not a phase)</td><td>Right after the nextTick queue empties, still before the loop advances</td><td><strong>Yes</strong> — an endless promise chain drains forever</td></tr>
    <tr><td><code>setImmediate</code></td><td>check phase</td><td>Once per loop iteration, when the loop reaches check</td><td>No — it yields between iterations</td></tr>
    <tr><td><code>setTimeout(fn, 0)</code></td><td>timers phase</td><td>Next timers phase, once the ~1ms floor has elapsed</td><td>No — it yields between iterations</td></tr>
  </tbody>
</table>`,
`<p><strong>A subtlety that trips up seniors: nextTick and microtasks interleave <em>with each other</em> during a single drain.</strong> Node does not run every nextTick once and then every promise once. It empties the whole nextTick queue, then the whole promise queue, then — if draining the promises produced new nextTicks — it goes back and drains those, then re-drains promises, alternating until <em>both</em> are genuinely empty. So the guarantee is not "all nextTicks before all promises" across the whole program; it is "nextTick beats promise <em>at each scheduling point</em>". A promise callback that itself calls <code>process.nextTick</code> will see that nextTick run before any promise scheduled after it, even though the promise queue was already mid-drain. This is exactly why an unbounded recursive <code>nextTick</code> is more dangerous than an unbounded promise chain: the nextTick queue is always re-checked and re-emptied first, so it can wedge the boundary shut while starving promises too.</p>`,
`<p><strong>What is <code>nextTick</code> actually for?</strong> Two legitimate uses. First, to let a function <em>appear</em> asynchronous consistently — e.g. deferring an error callback so it never fires synchronously in the same stack that called your function (the "don't release Zalgo" pattern). Second, to run cleanup or allow the caller to attach listeners before an event fires — emitting an event on <code>nextTick</code> gives the caller a chance to register a handler first. Both are about ordering guarantees, not about "running soon".</p>`,

`<h2>Code examples</h2>`,
`<p><strong>Example 1 — the canonical ordering question.</strong></p>`,
`<pre><code class="language-javascript">console.log('start');

setTimeout(() =&gt; console.log('setTimeout'), 0);
setImmediate(() =&gt; console.log('setImmediate'));
Promise.resolve().then(() =&gt; console.log('promise'));
process.nextTick(() =&gt; console.log('nextTick'));

console.log('end');

// Output:
//   start
//   end
//   nextTick        &lt;- microtask family, drains first (before promises)
//   promise         &lt;- microtask queue, right after nextTick
//   setTimeout / setImmediate  (these two race at the top level)
</code></pre>`,
`<p>Synchronous <code>start</code>/<code>end</code> run first. Then the loop drains nextTick (beats <code>promise</code>), then promises. The last two are macrotasks whose relative order is not guaranteed at the top level.</p>`,
`<p><strong>Example 2 — inside I/O, immediate is deterministic.</strong></p>`,
`<pre><code class="language-javascript">const fs = require('fs');

fs.readFile(__filename, () =&gt; {
  setTimeout(() =&gt; console.log('setTimeout'), 0);
  setImmediate(() =&gt; console.log('setImmediate'));
  process.nextTick(() =&gt; console.log('nextTick'));
  Promise.resolve().then(() =&gt; console.log('promise'));
});

// Output (always):
//   nextTick
//   promise
//   setImmediate
//   setTimeout
</code></pre>`,
`<p>nextTick and promise drain before the loop leaves the poll phase. Then check runs (<code>setImmediate</code>) before the loop wraps back to timers (<code>setTimeout</code>).</p>`,
`<p><strong>Example 3 — nextTick recursion freezes everything.</strong></p>`,
`<pre><code class="language-javascript">let count = 0;
setTimeout(() =&gt; console.log('timer fired'), 100);

function loop() {
  if (++count % 1000000 === 0) console.log('still ticking', count);
  process.nextTick(loop); // never lets the loop advance
}
loop();

// Output:
//   still ticking 1000000
//   still ticking 2000000
//   ... forever. 'timer fired' NEVER prints — the loop is starved.
</code></pre>`,
`<p>Swap <code>process.nextTick(loop)</code> for <code>setImmediate(loop)</code> and the timer <em>does</em> fire, because <code>setImmediate</code> yields between loop iterations so timers and I/O still get their turn.</p>`,
`<p><strong>Example 4 — nextTick to guarantee async, so listeners can attach.</strong></p>`,
`<pre><code class="language-javascript">const EventEmitter = require('events');

class Thing extends EventEmitter {
  constructor() {
    super();
    // WRONG: emit here fires before caller can add a listener.
    // Defer so the 'ready' handler below is registered first.
    process.nextTick(() =&gt; this.emit('ready'));
  }
}

const t = new Thing();
t.on('ready', () =&gt; console.log('ready!')); // attached in time

// Output:
//   ready!
</code></pre>`,

`<h2>Common mistakes &amp; gotchas</h2>`,
`<ul>
  <li><strong>Thinking <code>nextTick</code> runs "on the next tick of the loop".</strong> It runs <em>before</em> the loop advances at all — sooner than any phase, sooner than promises.</li>
  <li><strong>Using recursive <code>nextTick</code> for chunked work.</strong> It starves the loop. Use <code>setImmediate</code> for anything that should yield to I/O between iterations.</li>
  <li><strong>Assuming <code>nextTick</code> and <code>Promise.resolve().then</code> are interchangeable.</strong> nextTick drains first; if you schedule both, nextTick's callback runs earlier.</li>
  <li><strong>Believing <code>setImmediate</code> means "right now".</strong> It runs in the check phase, after poll — later than any pending microtask.</li>
  <li><strong>Expecting a fixed <code>setTimeout(0)</code> vs <code>setImmediate</code> order.</strong> Deterministic only inside I/O callbacks (immediate first); a race at the top level.</li>
  <li><strong>Emitting an event synchronously from a constructor.</strong> Listeners added after construction miss it; defer the emit with <code>nextTick</code>.</li>
  <li><strong>Assuming a <code>nextTick</code> scheduled from inside a promise runs after the current microtask drain.</strong> It does not — Node re-checks the nextTick queue during the drain, so that callback runs before any promise queued after it, not on the next loop iteration.</li>
  <li><strong>Treating <code>setImmediate</code> as "faster" than <code>setTimeout(fn, 0)</code>.</strong> Neither is inherently faster; they simply fire in different phases. The only firm rule is the I/O-callback case, where <code>setImmediate</code> precedes <code>setTimeout</code>.</li>
</ul>`,

`<h2>Best practices</h2>`,
`<ul>
  <li><strong>Reach for <code>setImmediate</code>, not <code>nextTick</code>, to break up work</strong> or to schedule "after this phase, but let I/O run".</li>
  <li><strong>Use <code>nextTick</code> only for ordering guarantees:</strong> making an API consistently async, or deferring an emit so callers can subscribe first.</li>
  <li><strong>Never build an unbounded recursive <code>nextTick</code> chain.</strong> If you must recurse in the microtask lane, cap it or hand off to <code>setImmediate</code> periodically.</li>
  <li><strong>Prefer promises/<code>queueMicrotask</code> over <code>nextTick</code> in new code</strong> unless you specifically need to beat the microtask queue — it keeps intent clear and portable.</li>
  <li><strong>Document any ordering you rely on.</strong> "This runs in the check phase after I/O" is a comment worth writing.</li>
</ul>`,

`<h2>⭐ Interview lens</h2>`,
`<blockquote><p><strong>Q: <code>nextTick</code> vs <code>setImmediate</code> — one sentence each.</strong><br/><code>process.nextTick</code> runs its callback before the event loop continues, ahead of the Promise microtask queue and every phase. <code>setImmediate</code> runs in the check phase of the loop, as a macrotask, after the current poll phase and after all pending microtasks.</p></blockquote>`,
`<blockquote><p><strong>Q: Predict the output.</strong><br/><code>process.nextTick(() =&gt; console.log('a')); Promise.resolve().then(() =&gt; console.log('b')); setImmediate(() =&gt; console.log('c'));</code><br/>Output: <code>a</code>, <code>b</code>, <code>c</code>. nextTick drains first, then the microtask queue (<code>b</code>), then the check phase (<code>c</code>).</p></blockquote>`,
`<blockquote><p><strong>Q: How can <code>process.nextTick</code> freeze a Node server?</strong><br/>The loop cannot advance until the nextTick queue is empty. A callback that schedules another <code>nextTick</code> indefinitely keeps the queue non-empty forever, so timers, I/O, and <code>setImmediate</code> never get to run. <code>setImmediate</code> recursion does not do this because it yields between loop iterations.</p></blockquote>`,
`<blockquote><p><strong>Q: Inside <code>fs.readFile</code>'s callback you schedule both <code>setTimeout(fn, 0)</code> and <code>setImmediate</code>. Which runs first?</strong><br/><code>setImmediate</code>, always. The callback runs in the poll phase; the next phase is check (<code>setImmediate</code>), while <code>setTimeout</code> waits for the timers phase on the next iteration.</p></blockquote>`,
`<blockquote><p><strong>Q: Why would a library emit an event via <code>process.nextTick</code> instead of synchronously?</strong><br/>To let the caller attach listeners first. If a constructor emits <code>'ready'</code> synchronously, any <code>.on('ready')</code> added afterward misses it. Deferring the emit to <code>nextTick</code> guarantees the emit happens after the current stack unwinds, once listeners are registered.</p></blockquote>`,
`<blockquote><p><strong>Q: Is <code>setTimeout(fn, 0)</code> the same as <code>setImmediate</code>?</strong><br/>No. <code>setTimeout(fn, 0)</code> is clamped to ~1ms and runs in the timers phase; <code>setImmediate</code> runs in the check phase with no delay clamp. At the top level their order races; inside an I/O callback <code>setImmediate</code> reliably wins.</p></blockquote>`,

`<h2>Cheat-card</h2>`,
`<ul>
  <li><strong>Priority:</strong> nextTick → promises → (timers | check macrotasks).</li>
  <li><code>process.nextTick</code>: before loop advances; own queue; drains before promises.</li>
  <li><code>setImmediate</code>: check phase; macrotask; yields between iterations.</li>
  <li><code>setTimeout(fn,0)</code>: timers phase; ~1ms floor; macrotask.</li>
  <li>Inside I/O callback: <code>setImmediate</code> &gt; <code>setTimeout(0)</code> (guaranteed).</li>
  <li>Recursive <code>nextTick</code> = starvation. Recursive <code>setImmediate</code> = safe.</li>
  <li>Use <code>nextTick</code> for ordering guarantees; <code>setImmediate</code> to yield to I/O.</li>
</ul>`
      ].join('\n')
    },

    // ─────────────────────────────────────────────────────────────
    // Topic 3 — microtasks-vs-macrotasks
    // ─────────────────────────────────────────────────────────────
    {
      title: 'Microtasks vs Macrotasks',
      slug: 'microtasks-vs-macrotasks',
      order: 3,
      content: [
`<h2>Why it matters</h2>`,
`<p>Every asynchronous callback in Node lands in one of two categories, and the category decides <em>when</em> it runs relative to everything else. <strong>Macrotasks</strong> are the phase-based callbacks — timers, I/O, <code>setImmediate</code>, close handlers. <strong>Microtasks</strong> are promise continuations and <code>queueMicrotask</code>, with <code>process.nextTick</code> as a special even-higher-priority sibling. The rule that governs their interplay is short and absolute: <strong>after every single macrotask, the entire microtask queue is drained before the next macrotask runs.</strong></p>`,
`<p>This is why <code>await</code> feels synchronous-ish but never blocks, why a promise chain always completes before a <code>setTimeout</code> that was scheduled earlier, and why a runaway promise chain can starve I/O just like a runaway <code>nextTick</code>. It is also the concept that unifies Node with the browser: the microtask/macrotask model is the same in both, which is why understanding it makes you better at <em>all</em> JavaScript, not just backend. Interviewers ask output-ordering questions precisely because they cannot be bluffed — either you can trace the queues or you cannot.</p>`,

`<h2>The concept, simply</h2>`,
`<p>Two kinds of work, two different scheduling rules:</p>`,
`<ul>
  <li><strong>Macrotask:</strong> the loop takes <em>one</em> per turn. <code>setTimeout</code>/<code>setInterval</code> (timers phase), I/O callbacks (poll phase), <code>setImmediate</code> (check phase), and close callbacks are all macrotasks. Each sits in a phase queue and the loop processes them as it walks the phases.</li>
  <li><strong>Microtask:</strong> the loop drains <em>all</em> of them — repeatedly, including any newly scheduled during the drain — after each macrotask and at every phase boundary. Promise <code>.then</code>/<code>.catch</code>/<code>.finally</code>, the continuation after an <code>await</code>, and <code>queueMicrotask</code> are microtasks. <code>process.nextTick</code> is a separate, higher-priority queue that drains <em>before</em> the promise microtasks.</li>
</ul>`,
`{{fig:ch2-micro-macro-queues.svg|Two panels: macrotasks (setTimeout, setImmediate, I/O, close) taken one per turn, versus microtasks (nextTick, promises, queueMicrotask) drained fully between them|The loop takes one macrotask, then empties the whole microtask queue, then takes the next macrotask.}}`,
`<p>Mnemonic: <strong>one macro, then all micros, then one macro, then all micros.</strong> Microtasks are greedy; macrotasks are polite and take turns.</p>`,

`<h2>How it works</h2>`,
`<p><strong>The drain is exhaustive.</strong> When Node drains microtasks, it does not process a fixed snapshot — it keeps going until the queue is genuinely empty. If microtask A schedules microtask B, and B schedules C, all of them run in the same drain, before the loop is allowed to move on. This is what makes <code>await</code> chains resolve in one continuous burst. It is also the starvation risk: an endless chain of promises-that-schedule-promises never lets the loop reach the next macrotask, freezing timers and I/O — exactly the <code>nextTick</code> starvation problem, one lane over.</p>`,
`{{fig:ch2-tick-lifecycle.svg|Alternating sequence of macrotask callback then microtask drain, repeated, with a note that microtask recursion can starve the loop|Microtasks drain fully after each macrotask; a self-scheduling microtask chain can starve the loop just like recursive nextTick.}}`,
`<p><strong>nextTick vs promise, precisely.</strong> Node maintains two distinct queues in the microtask family. The <code>process.nextTick</code> queue is drained first and completely; then the V8 Promise microtask queue is drained. If a nextTick callback schedules a promise, and a promise callback schedules a nextTick, Node re-checks: after promises run, if new nextTicks appeared, it drains those too, then re-drains promises — it keeps alternating until both are empty. The net effect you can rely on: <strong>at the same scheduling point, nextTick beats promise.</strong></p>`,
`<p><strong>How <code>await</code> maps onto this.</strong> An <code>await x</code> is sugar for "evaluate <code>x</code>, then schedule the rest of this function as a promise microtask". Everything before the first <code>await</code> runs synchronously; the moment you hit <code>await</code>, the function suspends and control returns to the caller. The continuation resumes as a microtask once the awaited value settles. So an <code>async</code> function is partly synchronous (up to the first <code>await</code>) and partly a series of microtasks (each resumption after an <code>await</code>).</p>`,
`<p><strong>Where macrotasks fit around all this.</strong> The loop enters a phase, runs one macrotask callback, then drains nextTick + promises fully, then runs the next macrotask callback in that phase, drains again, and so on until the phase queue empties — then advances. So microtasks are not "once per loop" or "once per phase"; they are <em>once per macrotask callback</em>. That granularity is the crux of most trick questions.</p>`,
`<p><strong>The two families at a glance.</strong> The table fixes the distinction that every ordering puzzle turns on — <em>how many</em> the loop takes per turn, and <em>when</em> it comes back for more.</p>`,
`<table>
  <thead>
    <tr><th>Property</th><th>Macrotask</th><th>Microtask</th></tr>
  </thead>
  <tbody>
    <tr><td>Examples</td><td><code>setTimeout</code>, <code>setInterval</code>, <code>setImmediate</code>, I/O, close callbacks</td><td><code>Promise.then/catch/finally</code>, <code>await</code> continuation, <code>queueMicrotask</code>, <code>process.nextTick</code> (higher-priority sibling)</td></tr>
    <tr><td>Lives in</td><td>A phase queue (timers, poll, check, close)</td><td>The nextTick queue and the V8 microtask queue — neither is a phase</td></tr>
    <tr><td>How many run per turn</td><td>Exactly one callback, then the loop pauses to drain microtasks</td><td>The entire queue, exhaustively, including any scheduled mid-drain</td></tr>
    <tr><td>When it next runs</td><td>Next time the loop reaches that phase</td><td>After every macrotask callback and at every phase boundary</td></tr>
    <tr><td>Starvation risk</td><td>Low — always yields between callbacks</td><td>High — a self-scheduling chain never lets the loop advance</td></tr>
  </tbody>
</table>`,
`<p><strong>A concrete trace that exposes the "once per macrotask" rule.</strong> Suppose two timers are both due, and each timer callback schedules a promise. The loop enters the timers phase, runs timer A, and <em>before touching timer B</em> it fully drains the microtask queue — so A's promise runs. Only then does it run timer B, and again drains microtasks, so B's promise runs. The output is <code>A, A-promise, B, B-promise</code>, never <code>A, B, A-promise, B-promise</code>. If microtasks drained "once per phase" instead, you would see the second, wrong ordering. Reproducing this by hand is the single best way to prove to yourself that the drain happens between the two macrotasks, not after both.</p>`,

`<h2>Code examples</h2>`,
`<p><strong>Example 1 — micro always beats macro.</strong></p>`,
`<pre><code class="language-javascript">console.log('sync 1');
setTimeout(() =&gt; console.log('macro: timeout'), 0);
Promise.resolve().then(() =&gt; console.log('micro: promise'));
console.log('sync 2');

// Output:
//   sync 1
//   sync 2
//   micro: promise    &lt;- microtask drains before the loop reaches timers
//   macro: timeout
</code></pre>`,
`<p><strong>Example 2 — a chain of promises drains before any timer.</strong></p>`,
`<pre><code class="language-javascript">setTimeout(() =&gt; console.log('timeout'), 0);

Promise.resolve()
  .then(() =&gt; console.log('p1'))
  .then(() =&gt; console.log('p2'))
  .then(() =&gt; console.log('p3'));

// Output:
//   p1
//   p2
//   p3
//   timeout
</code></pre>`,
`<p>Each <code>.then</code> schedules the next as a microtask; the whole chain empties in one drain before the timers phase gets its turn.</p>`,
`<p><strong>Example 3 — async/await ordering.</strong></p>`,
`<pre><code class="language-javascript">async function main() {
  console.log('A');
  await null;          // suspends here; rest becomes a microtask
  console.log('C');
}

console.log('start');
main();
console.log('end');

// Output:
//   start
//   A         &lt;- runs synchronously up to the await
//   end       &lt;- control returned to caller at the await
//   C         &lt;- resumes as a microtask after sync code finishes
</code></pre>`,
`<p><strong>Example 4 — the full six-way ordering trap.</strong></p>`,
`<pre><code class="language-javascript">console.log('1: sync');
setTimeout(() =&gt; console.log('2: setTimeout'), 0);
setImmediate(() =&gt; console.log('3: setImmediate'));
Promise.resolve().then(() =&gt; console.log('4: promise'));
process.nextTick(() =&gt; console.log('5: nextTick'));
(async () =&gt; { await null; console.log('6: await'); })();
console.log('7: sync');

// Output:
//   1: sync
//   7: sync
//   5: nextTick        &lt;- nextTick queue drains first
//   4: promise         &lt;- then the promise microtask queue...
//   6: await           &lt;- ...including the await continuation (FIFO)
//   2: setTimeout / 3: setImmediate  (macrotasks; order races at top level)
</code></pre>`,
`<p>Sync code (1, 7) first. Then all microtask-family work: nextTick (5) ahead of promises, then the promise queue in FIFO order (4 before 6, because <code>.then</code> was scheduled before the <code>await</code> continuation). Finally the two macrotasks, whose order is a top-level race.</p>`,

`<h2>Common mistakes &amp; gotchas</h2>`,
`<ul>
  <li><strong>Thinking microtasks run "once per loop iteration".</strong> They drain after <em>every</em> macrotask callback and at every phase boundary — far more often.</li>
  <li><strong>Assuming <code>setTimeout(fn, 0)</code> beats a promise scheduled just before it.</strong> It never does; the microtask queue empties before the loop reaches the timers phase.</li>
  <li><strong>Believing <code>await</code> blocks.</strong> It suspends the async function and returns control to the caller; the rest resumes later as a microtask.</li>
  <li><strong>Creating an unbounded microtask chain</strong> (a promise that always schedules another) — it starves timers and I/O exactly like recursive <code>nextTick</code>.</li>
  <li><strong>Confusing FIFO within a queue with priority across queues.</strong> Within the promise queue it is FIFO; but nextTick as a queue outranks the whole promise queue.</li>
  <li><strong>Forgetting synchronous code beats everything.</strong> Nothing async runs until the current call stack is empty.</li>
  <li><strong>Assuming microtasks drain "once per phase".</strong> They drain after <em>each macrotask callback</em> — so two due timers interleave with their own microtasks (<code>A, A-promise, B, B-promise</code>), not <code>A, B, A-promise, B-promise</code>.</li>
  <li><strong>Expecting a single big microtask drain to be interruptible by I/O.</strong> It is not — until the queue is empty the loop cannot reach the poll phase, so a long promise chain delays every pending socket read just like blocking code would.</li>
</ul>`,

`<h2>Best practices</h2>`,
`<ul>
  <li><strong>Prefer <code>queueMicrotask</code> or promises over <code>process.nextTick</code></strong> in application code unless you specifically need to beat the promise queue.</li>
  <li><strong>For CPU-bound chunking, use <code>setImmediate</code> (a macrotask), not microtasks,</strong> so I/O gets serviced between chunks.</li>
  <li><strong>Do not throw inside a microtask without handling it</strong> — an unhandled promise rejection propagates differently and can crash the process on modern Node defaults.</li>
  <li><strong>Trace ordering by drawing the two queues</strong> when a bug depends on it, rather than adding <code>setTimeout(…, 100)</code> "to be safe".</li>
  <li><strong>Keep microtask work small.</strong> Long synchronous work inside a <code>.then</code> still blocks the loop just as much as anywhere else.</li>
</ul>`,

`<h2>⭐ Interview lens</h2>`,
`<blockquote><p><strong>Q: Define microtask vs macrotask in Node.</strong><br/>A macrotask is a phase-based callback — <code>setTimeout</code>, I/O, <code>setImmediate</code>, close handlers — and the loop runs one per turn. A microtask is a promise continuation, <code>queueMicrotask</code>, or (higher-priority) <code>process.nextTick</code>; the entire microtask queue drains after every macrotask and at each phase boundary.</p></blockquote>`,
`<blockquote><p><strong>Q: Output?</strong> <code>setTimeout(() =&gt; console.log('t'), 0); Promise.resolve().then(() =&gt; console.log('p'));</code><br/><code>p</code> then <code>t</code>. The microtask queue empties before the loop advances to the timers phase, so the promise wins regardless of scheduling order.</p></blockquote>`,
`<blockquote><p><strong>Q: How often do microtasks drain — once per loop, once per phase, or more?</strong><br/>More: after <em>every</em> macrotask callback, plus at each phase transition. That is why a promise chain fully resolves before the next timer, and why a self-scheduling microtask can starve the loop.</p></blockquote>`,
`<blockquote><p><strong>Q: Trace this async snippet.</strong> <code>console.log(1); (async()=&gt;{console.log(2); await null; console.log(4);})(); console.log(3);</code><br/>Output: 1, 2, 3, 4. Code runs synchronously to the <code>await</code> (1, 2), control returns to the caller (3), then the continuation resumes as a microtask (4).</p></blockquote>`,
`<blockquote><p><strong>Q: Between a <code>process.nextTick</code> and a <code>Promise.then</code> scheduled together, which runs first, and why?</strong><br/>The nextTick callback. Node drains the dedicated nextTick queue completely before draining the Promise microtask queue, so nextTick always wins at the same scheduling point.</p></blockquote>`,
`<blockquote><p><strong>Q: Can microtasks starve the event loop like <code>nextTick</code> can?</strong><br/>Yes. Because the microtask queue is drained exhaustively — including newly added microtasks — an endless chain of promises-that-schedule-promises never yields to the loop, freezing timers and I/O. The fix is to move periodic work onto <code>setImmediate</code>.</p></blockquote>`,

`<h2>Cheat-card</h2>`,
`<ul>
  <li><strong>Rule:</strong> one macrotask → drain ALL microtasks → next macrotask.</li>
  <li><strong>Macrotasks:</strong> <code>setTimeout</code>, <code>setInterval</code>, <code>setImmediate</code>, I/O, close.</li>
  <li><strong>Microtasks:</strong> promise <code>.then</code>/<code>await</code>, <code>queueMicrotask</code>; <code>nextTick</code> = higher-priority sibling.</li>
  <li>Priority order: sync → nextTick → promises → macrotasks.</li>
  <li>Microtasks drain after every macrotask + every phase boundary (not once per loop).</li>
  <li><code>await</code> = suspend + resume-as-microtask; never blocks.</li>
  <li>Endless microtask chains starve the loop → use <code>setImmediate</code> to yield.</li>
</ul>`
      ].join('\n')
    },

    // ─────────────────────────────────────────────────────────────
    // Topic 4 — blocking-event-loop
    // ─────────────────────────────────────────────────────────────
    {
      title: 'Blocking the Event Loop',
      slug: 'blocking-event-loop',
      order: 4,
      content: [
`<h2>Why it matters</h2>`,
`<p>Node's whole performance model rests on one fragile assumption: <strong>callbacks return quickly</strong>. The event loop is cooperative, not preemptive — it cannot interrupt a callback that is busy. So the instant one callback runs a long synchronous loop, parses a giant JSON string, or hashes a password on the main thread, <em>the entire process stops serving everyone else</em>. No other request is handled, no timer fires, no I/O completes, health checks time out, and your p99 latency detonates. One slow function can take down a server that is otherwise 99% idle.</p>`,
`<p>This is the number-one production failure mode for Node services, and the number-one senior-level interview probe: "your service is fast in testing but freezes under load — what happened?" The answer is almost always a blocked event loop. This topic covers what blocks it, how to keep CPU-bound work off the main thread, and how to <em>measure</em> loop lag so you catch it before customers do.</p>`,

`<h2>The concept, simply</h2>`,
`<p>Because all your JavaScript runs on one thread, the event loop can only advance when the current callback <em>returns control</em>. A callback that takes 800ms of pure CPU means the loop is frozen for 800ms. Every request that arrives during that window waits in line; a request that would have taken 1ms now takes 801ms. The work is not lost — it is delayed — but the tail latency is catastrophic and the throughput collapses.</p>`,
`{{fig:ch2-blocking-timeline.svg|Two timelines: a healthy one with many small callbacks flowing, and a blocked one where a single CPU-bound handler stalls all following requests|A healthy loop turns constantly; one CPU-bound handler stalls every request queued behind it.}}`,
`<p>The mental test is simple: <strong>"Does this callback do a lot of work without <code>await</code>ing or returning?"</strong> If yes, it blocks the loop for the whole duration. Asynchronous I/O (a DB query, an HTTP call, a file read) does <em>not</em> block, because it hands off and the callback returns immediately — the loop is free while the OS or thread pool does the waiting.</p>`,

`<h2>How it works</h2>`,
`<p><strong>What actually blocks.</strong> Anything CPU-bound and synchronous on the main thread:</p>`,
`<ul>
  <li><strong>Tight loops</strong> over large arrays; nested loops with big <em>n</em>; regex with catastrophic backtracking (ReDoS).</li>
  <li><strong>Large <code>JSON.parse</code> / <code>JSON.stringify</code></strong> — these are synchronous and scale with payload size; a 50MB body can block for hundreds of milliseconds.</li>
  <li><strong>Synchronous crypto and compression</strong> — <code>crypto.pbkdf2Sync</code>, <code>bcrypt</code>'s sync API, <code>zlib.gzipSync</code>.</li>
  <li><strong>The <code>*Sync</code> filesystem calls</strong> — <code>fs.readFileSync</code> on a large file blocks the loop for the whole read, unlike the async version which uses the thread pool.</li>
  <li><strong>Heavy template rendering, image/PDF manipulation in pure JS, big sorts.</strong></li>
</ul>`,
`<p><strong>Why async I/O does not block.</strong> <code>fs.readFile</code> (async) offloads to the libuv thread pool and its callback returns instantly; the loop keeps serving others while a worker thread does the blocking read. A DB driver sends bytes over a socket (kernel-async) and registers a callback — the loop is free until the response arrives. The blocking happens only when <em>your JavaScript</em> occupies the main thread continuously.</p>`,
`<p><strong>How to keep the loop free.</strong> There are four standard strategies:</p>`,
`<ol>
  <li><strong>Offload to a Worker thread.</strong> <code>worker_threads</code> gives you a real second thread with its own V8 isolate. Run the CPU-bound function there and post the result back — the main loop never stalls. This is the right tool for genuine parallel computation (hashing, parsing, image work).</li>
  <li><strong>Offload to a child process or external service.</strong> For heavyweight or isolatable work, spawn a process (<code>child_process</code>) or push the job to a queue/worker pool.</li>
  <li><strong>Chunk the work and yield.</strong> Split a long computation into pieces and schedule the next piece with <code>setImmediate</code>, letting the loop service I/O between chunks. This trades total time for responsiveness.</li>
  <li><strong>Stream instead of buffering.</strong> Process data incrementally (streaming JSON parsers, <code>zlib</code> streams, line-by-line readers) so you never hold — or synchronously chew through — a huge blob at once.</li>
</ol>`,
`<p><strong>Measuring loop lag.</strong> "Lag" is how late a timer fires versus when it was due; rising lag is the earliest signal the loop is falling behind.</p>`,
`{{fig:ch2-event-loop-lag.svg|A timeline showing a timer's due time and its later actual run time, with the gap labelled as lag, and a note about monitorEventLoopDelay|Event loop lag is the gap between when a callback was due and when it actually ran — a direct measure of loop health.}}`,
`<p>The crude way is a self-correcting timer: schedule <code>setTimeout(fn, N)</code> and measure how much later than <code>N</code> it actually fires. The precise way is <code>perf_hooks.monitorEventLoopDelay()</code>, which gives you a high-resolution histogram (mean, p50, p99, max). Watch the <strong>tail</strong> (p99/max), not the mean — a healthy-looking average can hide periodic multi-hundred-millisecond stalls. Alert when p99 lag crosses a budget (say, 50–100ms).</p>`,

`<h2>Code examples</h2>`,
`<p><strong>Example 1 — a blocking handler stalls the whole server.</strong></p>`,
`<pre><code class="language-javascript">const http = require('http');

http.createServer((req, res) =&gt; {
  if (req.url === '/block') {
    // Synchronous CPU work — freezes the loop for ~2s.
    const end = Date.now() + 2000;
    while (Date.now() &lt; end) {}
    res.end('done blocking');
  } else {
    res.end('fast'); // normally instant...
  }
}).listen(3000);

// While ONE client hits /block, every request to '/' also hangs
// for up to 2 seconds. One handler blocks all of them.
</code></pre>`,
`<p><strong>Example 2 — measuring lag with a self-correcting timer.</strong></p>`,
`<pre><code class="language-javascript">let last = Date.now();
setInterval(() =&gt; {
  const now = Date.now();
  const lag = now - last - 500; // expected gap is 500ms
  if (lag &gt; 50) console.warn(\`event loop lag: \${lag}ms\`);
  last = now;
}, 500);

// If some other callback blocks for 400ms, this logs ~400ms of lag.
</code></pre>`,
`<p><strong>Example 3 — the precise way with perf_hooks.</strong></p>`,
`<pre><code class="language-javascript">const { monitorEventLoopDelay } = require('perf_hooks');

const h = monitorEventLoopDelay({ resolution: 20 });
h.enable();

setInterval(() =&gt; {
  console.log('p50:', (h.percentile(50) / 1e6).toFixed(1), 'ms',
              '| p99:', (h.percentile(99) / 1e6).toFixed(1), 'ms',
              '| max:', (h.max / 1e6).toFixed(1), 'ms');
  h.reset();
}, 1000);

// Values are in nanoseconds; divide by 1e6 for milliseconds.
// A healthy idle service shows p99 well under a few ms.
</code></pre>`,
`<p><strong>Example 4 — offloading CPU work to a Worker thread.</strong></p>`,
`<pre><code class="language-javascript">// main.js
const { Worker } = require('worker_threads');

function hashOffMainThread(password) {
  return new Promise((resolve, reject) =&gt; {
    const w = new Worker('./hash-worker.js', { workerData: password });
    w.on('message', resolve);
    w.on('error', reject);
  });
}

// The event loop stays responsive while the worker hashes.
hashOffMainThread('secret').then((hash) =&gt; console.log('hashed:', hash));

// hash-worker.js
// const { workerData, parentPort } = require('worker_threads');
// const crypto = require('crypto');
// const out = crypto.pbkdf2Sync(workerData, 'salt', 200000, 64, 'sha512');
// parentPort.postMessage(out.toString('hex'));
</code></pre>`,

`<h2>Common mistakes &amp; gotchas</h2>`,
`<ul>
  <li><strong>Using <code>*Sync</code> APIs on the request path.</strong> <code>fs.readFileSync</code>, <code>crypto.pbkdf2Sync</code>, <code>zlib.gzipSync</code> block the loop for their full duration — fine at startup, disastrous per-request.</li>
  <li><strong>Parsing huge payloads synchronously.</strong> <code>JSON.parse</code> of a multi-megabyte body is CPU-bound and blocks; use size limits and streaming parsers.</li>
  <li><strong>Assuming <code>Promise</code> or <code>async</code> makes CPU work non-blocking.</strong> Wrapping a synchronous loop in a promise does <em>not</em> yield the thread — it still runs to completion on the main thread and blocks.</li>
  <li><strong>Regex backtracking (ReDoS).</strong> A pathological pattern on attacker-controlled input can peg the loop for seconds; validate and bound input, prefer safe patterns.</li>
  <li><strong>Watching only average lag.</strong> The mean hides periodic stalls; alert on p99/max.</li>
  <li><strong>Reaching for the libuv thread pool for CPU work.</strong> The pool is for native I/O-style tasks; your own CPU-bound JS belongs in <code>worker_threads</code>.</li>
  <li><strong>Chunking with <code>process.nextTick</code>.</strong> That does not yield to I/O; use <code>setImmediate</code> between chunks.</li>
</ul>`,

`<h2>Best practices</h2>`,
`<ul>
  <li><strong>Keep per-callback work bounded.</strong> Treat "how long can this callback run?" as a first-class design constraint on the request path.</li>
  <li><strong>Offload CPU-bound work to <code>worker_threads</code></strong> (or a child process / job queue) — hashing, image/PDF processing, big parsing.</li>
  <li><strong>Prefer async I/O everywhere on the hot path;</strong> reserve <code>*Sync</code> calls for startup/CLI scripts.</li>
  <li><strong>Stream large data</strong> instead of buffering-then-parsing; enforce request body size limits.</li>
  <li><strong>Chunk long loops with <code>setImmediate</code></strong> when offloading is overkill, so I/O still gets serviced.</li>
  <li><strong>Instrument loop lag in production</strong> with <code>monitorEventLoopDelay()</code>; set a p99 budget and alert on it.</li>
  <li><strong>Load-test with concurrency,</strong> not just single-request timing — blocking only shows up when requests compete for the one thread.</li>
</ul>`,

`<h2>⭐ Interview lens</h2>`,
`<blockquote><p><strong>Q: Your Node service is fast in a single-request test but freezes under load. What's the likely cause?</strong><br/>A blocked event loop: some handler does synchronous CPU-bound work (large <code>JSON.parse</code>, sync crypto, a tight loop, a <code>*Sync</code> call, or ReDoS). Because the loop is single-threaded and cooperative, that one busy callback delays every other request queued behind it, spiking p99 latency.</p></blockquote>`,
`<blockquote><p><strong>Q: Does async I/O block the event loop?</strong><br/>No. Async I/O offloads to the OS kernel (network) or the libuv thread pool (<code>fs</code>, crypto) and its callback returns immediately, so the loop stays free. Only synchronous CPU work — or a <code>*Sync</code> API — that runs continuously on the main thread blocks it.</p></blockquote>`,
`<blockquote><p><strong>Q: How do you run CPU-bound work without blocking the loop?</strong><br/>Move it off the main thread: <code>worker_threads</code> for parallel JS computation, a child process or external job queue for heavier/isolatable work, or chunk the computation and yield with <code>setImmediate</code> between pieces. Streaming avoids holding huge buffers in the first place.</p></blockquote>`,
`<blockquote><p><strong>Q: Does wrapping CPU work in a Promise make it non-blocking?</strong><br/>No. A promise only affects <em>scheduling</em> of the callback, not <em>where</em> the code runs. A synchronous loop inside a <code>.then</code> still executes to completion on the main thread and blocks the loop just as much.</p></blockquote>`,
`<blockquote><p><strong>Q: How do you measure event loop lag, and what do you watch?</strong><br/>Crudely, a self-correcting <code>setInterval</code> that reports how much later than expected it fired. Precisely, <code>perf_hooks.monitorEventLoopDelay()</code>, which yields a nanosecond histogram (p50/p99/max). Watch the tail (p99/max), not the mean, and alert when it exceeds a budget like 50–100ms.</p></blockquote>`,
`<blockquote><p><strong>Q: Why offload to <code>worker_threads</code> rather than the libuv thread pool for CPU work?</strong><br/>The libuv pool is reserved for Node's native I/O-style operations (<code>fs</code>, crypto, zlib) and you cannot schedule arbitrary JavaScript on it. <code>worker_threads</code> give you a real second V8 isolate where your own CPU-bound JavaScript runs in parallel, communicating via message passing or <code>SharedArrayBuffer</code>.</p></blockquote>`,

`<h2>Cheat-card</h2>`,
`<ul>
  <li><strong>Loop is cooperative:</strong> one long callback stalls every request.</li>
  <li><strong>Blocks:</strong> tight loops, big <code>JSON.parse</code>, sync crypto/zlib, <code>*Sync</code> fs, ReDoS.</li>
  <li><strong>Doesn't block:</strong> async I/O (kernel or thread pool) — callback returns instantly.</li>
  <li><strong>Fixes:</strong> <code>worker_threads</code>, child process/queue, <code>setImmediate</code> chunking, streaming.</li>
  <li>Promise/async does NOT move CPU work off the main thread.</li>
  <li>CPU work → <code>worker_threads</code>, not the libuv pool.</li>
  <li><strong>Measure:</strong> <code>perf_hooks.monitorEventLoopDelay()</code>; alert on p99/max, not mean.</li>
</ul>`
      ].join('\n')
    }
  ]
};
