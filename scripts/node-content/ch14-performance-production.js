/**
 * Node.js Backend Kit — Chapter 14: Performance, Scaling & Production.
 * Pure data module (no runtime deps). Diagrams are referenced via
 * {{fig:filename.svg|ALT|CAPTION}} markers, resolved by the seed script.
 *
 * Depth target: every topic 1800-2500+ words of accurate, modern (Node v20+)
 * material aimed at both learners and interviews. Sections are fixed and ordered:
 * Why it matters / The concept, simply / How it works / Code examples /
 * Common mistakes & gotchas / Best practices / Interview lens / Cheat-card.
 */
module.exports = {
  title: 'Performance, Scaling & Production',
  slug: 'performance-production',
  order: 13,
  topics: [
    // ────────────────────────────────────────────────────────────────
    // TOPIC 0 — The cluster module
    // ────────────────────────────────────────────────────────────────
    {
      title: 'The cluster module',
      slug: 'cluster-module',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Node.js runs your JavaScript on a <strong>single thread</strong>. That is the defining fact of the runtime, and it has a blunt consequence: a plain Node process uses exactly <em>one</em> CPU core, no matter how many the machine has. Rent an 8-core server, run <code>node server.js</code>, and seven cores sit idle while one does all the work. Under real traffic that single core saturates, the event loop backs up, and latency climbs — while <code>htop</code> shows the box is 88% idle. This is one of the most common "why is production slow?" surprises for engineers new to Node.</p>`,
        `<p>The <strong>cluster</strong> module is Node's built-in answer. It lets you fork the process into one <em>worker</em> per core, all sharing the same server port, so incoming connections are spread across every core. For a typical I/O-bound web service, moving from one process to N workers is close to an <strong>N&times; throughput</strong> increase for zero application-code changes. In interviews, "how do you make Node use all the cores?" is a near-guaranteed question, and cluster (or a process manager that wraps it, like PM2) is the canonical answer. Knowing how it works — and its limits — separates people who have run Node in production from people who have only read about it.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Cluster follows a <strong>primary / worker</strong> model (older docs and APIs say "master/worker"; the modern term is primary). One <em>primary</em> process starts first. Its only job is to <strong>fork worker processes</strong> and supervise them — it does not handle requests itself. Each worker is a full, independent Node process with its own memory, its own V8 heap, and its own event loop. The workers are where your actual app runs.</p>`,
        `<p>The clever part is the shared port. Normally two processes cannot both <code>listen</code> on port 3000 — you would get <code>EADDRINUSE</code>. Under cluster, the workers do not each open their own socket. The primary opens the listening socket once and hands it down, so all workers accept connections from the <em>same</em> socket. The operating system (or the primary, depending on platform) then distributes new connections among them.</p>`,
        `{{fig:ch14-cluster-model.svg|Diagram of a primary process forking four worker processes that all share one listening socket on port 3000|The primary forks one worker per core; all workers accept from a single shared listening socket, and connections are distributed among them.}}`,
        `<p>The mental model to lock in: <strong>cluster is horizontal scaling <em>inside a single machine</em></strong>. It is the same idea as running many replicas behind a load balancer, except the "load balancer" is the kernel and the "replicas" are sibling processes sharing a port. Because each worker is a separate process, they share <em>nothing</em> in memory — no shared variables, no shared in-process cache, no shared counters. That isolation is both the safety (one worker crashing doesn't take the others down) and the main constraint (any shared state must live outside the process, e.g. in Redis).</p>`,
        `{{fig:ch14-cluster-scaling.svg|Comparison showing a single Node process using one core while three others sit idle versus cluster keeping all four cores busy|A lone process pins one core; cluster spreads workers so every core does useful work.}}`,
        `<h2>How it works</h2>`,
        `<p>When you run a cluster program, the same file executes in both the primary and every worker — the code uses <code>cluster.isPrimary</code> (aliased <code>cluster.isMaster</code> in older code) to branch. In the primary branch you call <code>cluster.fork()</code> once per core; in the worker branch you start your normal HTTP server. Under the hood <code>fork()</code> uses <code>child_process.fork()</code>, so each worker is a genuine OS process with an IPC channel back to the primary.</p>`,
        `<p><strong>Connection distribution</strong> has two strategies. On Linux and macOS the default is <code>SCHED_RR</code> (round-robin): the primary accepts connections and hands each one to the next worker in turn, which spreads load evenly. On Windows the default is <code>SCHED_NONE</code>: the primary passes the listening socket to all workers and lets the OS decide, which can be uneven because the kernel tends to favour whichever worker is ready first. You can force round-robin everywhere by setting <code>cluster.schedulingPolicy = cluster.SCHED_RR</code> before forking. Round-robin distributes <em>connections</em>, not requests — with HTTP keep-alive, one connection can carry many requests, so a long-lived connection stays pinned to one worker.</p>`,
        `<p>Workers communicate with the primary only through <strong>message passing</strong> over IPC (<code>worker.send()</code> / <code>process.on('message')</code>). Messages are serialized (structured-clone by default), so you cannot pass a live object or a shared buffer through this channel and expect shared memory — each side gets a copy. This is exactly why cluster is <em>not</em> a tool for sharing CPU-heavy data structures; it is a tool for accepting more concurrent connections.</p>`,
        `<p><strong>Resilience</strong> is a first-class feature. The primary receives an <code>'exit'</code> event when a worker dies. The standard pattern is to fork a replacement immediately, so a crash (an uncaught exception, an OOM kill) degrades throughput for milliseconds instead of taking the service down. This also enables <strong>zero-downtime reloads</strong>: on a deploy signal, fork new workers, wait for them to come up, then gracefully retire the old ones one at a time — the port never stops listening.</p>`,
        `<p>One subtlety: the right number of workers is usually the number of <em>logical</em> cores, which you read from <code>os.availableParallelism()</code> (added in Node 19.4; prefer it over the older <code>os.cpus().length</code> because it respects cgroup/container CPU limits). In a container capped at 2 CPUs, spawning 16 workers just creates scheduler thrash and memory bloat — each worker carries its own V8 heap.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The canonical cluster setup: primary forks one worker per available core and respawns on death; workers run an ordinary HTTP server.</p>`,
        `<pre><code class="language-javascript">// server.js
import cluster from 'node:cluster';
import http from 'node:http';
import { availableParallelism } from 'node:os';
import process from 'node:process';

if (cluster.isPrimary) {
  const cpus = availableParallelism();          // respects container limits
  console.log(\`Primary \${process.pid} forking \${cpus} workers\`);

  for (let i = 0; i &lt; cpus; i++) cluster.fork();

  cluster.on('exit', (worker, code, signal) =&gt; {
    console.warn(\`Worker \${worker.process.pid} died (\${signal || code}); respawning\`);
    cluster.fork();                             // keep the pool full
  });
} else {
  // Each worker is a full Node process with its own event loop.
  http.createServer((req, res) =&gt; {
    res.end(\`Handled by worker \${process.pid}\\n\`);
  }).listen(3000);

  console.log(\`Worker \${process.pid} listening on :3000\`);
}</code></pre>`,
        `<p>Primary and workers can talk over IPC. Here the primary keeps a global request tally by collecting counts the workers report — the kind of aggregation you cannot do with a shared variable.</p>`,
        `<pre><code class="language-javascript">// Aggregating per-worker metrics in the primary
if (cluster.isPrimary) {
  let total = 0;
  for (let i = 0; i &lt; availableParallelism(); i++) {
    const worker = cluster.fork();
    worker.on('message', (msg) =&gt; {
      if (msg.type === 'hit') {
        total++;
        if (total % 1000 === 0) console.log('total requests:', total);
      }
    });
  }
} else {
  http.createServer((req, res) =&gt; {
    process.send({ type: 'hit' });              // report up to the primary
    res.end('ok');
  }).listen(3000);
}</code></pre>`,
        `<p>Graceful, zero-downtime worker reloading — retire workers one at a time so the port always has capacity behind it.</p>`,
        `<pre><code class="language-javascript">// Rolling restart of workers without dropping the port
async function reload() {
  const workers = Object.values(cluster.workers);
  for (const worker of workers) {
    await new Promise((resolve) =&gt; {
      const replacement = cluster.fork();
      replacement.once('listening', () =&gt; {
        worker.disconnect();                    // stop new conns to old worker
        worker.once('exit', resolve);           // wait until it drains + exits
      });
    });
  }
}
process.on('SIGUSR2', reload);                  // trigger on a deploy signal</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Assuming shared memory.</strong> Workers are separate processes. An in-memory cache, rate-limit counter, or session map in one worker is invisible to the others. Round-robin means consecutive requests from the same user can land on different workers — so a login stored in worker A's RAM looks logged-out on worker B. Put shared state in Redis/DB or a sticky session layer.</li>`,
        `<li><strong>Thinking cluster fixes CPU-bound code.</strong> Cluster multiplies your capacity for <em>concurrent I/O</em>. If a <em>single</em> request does heavy synchronous computation, it still blocks its worker's one thread; cluster just means fewer requests are affected at once. For per-request CPU work, reach for worker_threads instead.</li>`,
        `<li><strong>Forking too many workers.</strong> More workers than cores causes context-switch thrash and multiplies memory (each worker = a full V8 heap). In containers, <code>os.cpus().length</code> reports host cores, not your CPU limit — use <code>availableParallelism()</code>.</li>`,
        `<li><strong>WebSockets / sticky sessions.</strong> Round-robin distributes the initial connection, but stateful protocols (Socket.IO with in-memory adapters, long polling) assume a client stays on one worker. Without sticky routing and a shared adapter (e.g. the Redis adapter), messages get lost across workers.</li>`,
        `<li><strong>No respawn logic.</strong> Forgetting the <code>'exit'</code> handler means every crashed worker permanently reduces capacity until the whole service is restarted.</li>`,
        `<li><strong>Sharing a DB connection object across the fork.</strong> Connections are per-process; each worker must open its own pool. You cannot inherit a live socket handle as a usable client.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Prefer a process manager in production.</strong> PM2 (<code>pm2 start app.js -i max</code>) or the container orchestrator's replicas wrap cluster's fork/respawn/reload logic so you don't hand-roll it. Many teams run one process per container and let Kubernetes do the horizontal scaling instead of clustering inside the container.</li>`,
        `<li><strong>Keep workers stateless.</strong> Externalize sessions, caches, counters, and locks to Redis or the database. Stateless workers can be killed and respawned freely.</li>`,
        `<li><strong>Size workers to available parallelism</strong> via <code>availableParallelism()</code>, and leave headroom for the primary and OS.</li>`,
        `<li><strong>Implement graceful shutdown per worker</strong> — on <code>disconnect</code>/<code>SIGTERM</code>, stop accepting, drain in-flight requests, then exit (see the graceful-shutdown topic).</li>`,
        `<li><strong>Log the worker pid</strong> in every log line so you can trace which worker served a request.</li>`,
        `<li><strong>Don't cluster CPU-bound single requests</strong> — profile first; if one request pins a core, offload to worker_threads or a queue.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: Why does a Node process only use one CPU core, and how does cluster change that?</strong><br>A: Your JavaScript runs on a single main thread (libuv has a thread pool for some I/O, but <em>your</em> code is single-threaded). One process therefore pins one core. Cluster forks one worker process per core, each with its own event loop, all sharing one listening socket, so connections spread across every core — roughly N&times; throughput for I/O-bound work.</p></blockquote>`,
        `<blockquote><p><strong>Q: Do cluster workers share memory?</strong><br>A: No. They are independent OS processes with separate heaps. They communicate only via IPC message passing, and messages are serialized copies. Any shared state must live outside the process, e.g. Redis. (Trap: interviewers wait for candidates to suggest a shared in-memory cache across workers — it doesn't exist.)</p></blockquote>`,
        `<blockquote><p><strong>Q: How are incoming connections distributed to workers?</strong><br>A: Default is round-robin (<code>SCHED_RR</code>) on Linux/macOS — the primary accepts and hands each connection to the next worker. Windows defaults to letting the OS decide (<code>SCHED_NONE</code>), which can be uneven. Note it distributes <em>connections</em>, not requests, so keep-alive pins many requests to one worker.</p></blockquote>`,
        `<blockquote><p><strong>Q: Does cluster help with a CPU-bound endpoint?</strong><br>A: Only indirectly. Each worker is still single-threaded, so a heavy synchronous request blocks its worker. Cluster reduces how many requests are affected at once but doesn't speed up the computation. For genuinely CPU-heavy work per request, use worker_threads or a job queue. (Common trap.)</p></blockquote>`,
        `<blockquote><p><strong>Q: cluster vs running multiple containers behind a load balancer — when each?</strong><br>A: Same idea at different layers. Cluster maximizes a single machine's cores cheaply, in-process. Multiple containers/replicas add cross-machine scaling, isolation, and independent rolling deploys. Many modern setups run one Node process per small container and let the orchestrator scale horizontally — simpler ops, no in-process supervisor to maintain.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you achieve zero-downtime reloads with cluster?</strong><br>A: On a reload signal, fork new workers, wait for each to emit <code>listening</code>, then <code>disconnect()</code> old workers one at a time so they finish in-flight requests before exiting. The shared listening socket stays open the whole time, so the port never drops.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li>Node app code is <strong>single-threaded</strong> → one process = one core. Cluster = one worker process per core.</li>`,
        `<li><strong>Primary</strong> forks + supervises (no request handling); <strong>workers</strong> run your server, share one listening socket.</li>`,
        `<li>Branch on <code>cluster.isPrimary</code>; scale to <code>os.availableParallelism()</code> (container-aware).</li>`,
        `<li>Distribution: <strong>round-robin</strong> (Linux/macOS default), by connection not request.</li>`,
        `<li><strong>No shared memory</strong> — IPC copies only; externalize state to Redis/DB.</li>`,
        `<li>Respawn on <code>'exit'</code>; graceful reload = fork new, <code>disconnect()</code> old one-by-one.</li>`,
        `<li>Great for I/O concurrency; <strong>not</strong> a fix for CPU-bound single requests (→ worker_threads).</li>`,
        `<li>In production, usually let PM2 (<code>-i max</code>) or the orchestrator manage it.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // TOPIC 1 — worker_threads
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Worker threads',
      slug: 'worker-threads',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Node's event loop is fast at one thing above all: juggling <em>waiting</em>. Reading files, calling databases, awaiting HTTP — none of that occupies the CPU, so a single thread can shepherd thousands of concurrent I/O operations. But the moment a request needs to <em>compute</em> — hash a password, resize an image, parse a 20&nbsp;MB CSV, run a regex over huge input, do cryptography or ML inference — that work runs <strong>on the main thread</strong>, and while it runs the event loop is frozen. Every other in-flight request stalls until the computation finishes. This is the infamous "blocking the event loop," and it is the number-one way a Node service goes from snappy to unresponsive under real workloads.</p>`,
        `<p>The <strong>worker_threads</strong> module (stable since Node 12) is the correct tool for this. It lets you run JavaScript on <em>additional</em> threads inside the same process, so CPU-heavy work happens off the main thread and the event loop stays free to serve requests. In interviews, "how do you handle CPU-intensive work in Node without blocking?" is a staple, and the crisp answer — worker_threads for CPU-bound work, and here's when it beats cluster — is exactly what distinguishes a senior answer from "just use async/await" (which does nothing for CPU-bound code).</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A worker thread is a <strong>separate JavaScript execution context running on its own OS thread, inside the same process</strong>. Each worker gets its own V8 <em>isolate</em>: its own event loop, its own micro/macro task queues, and — crucially — its own heap. So by default, two threads do <em>not</em> share variables; each has its own copy of everything. This makes worker_threads safe by default: you don't get the classic multithreaded data races on ordinary objects, because ordinary objects aren't shared.</p>`,
        `<p>Threads talk to each other by <strong>passing messages</strong> through a <code>MessagePort</code> (<code>worker.postMessage()</code> / <code>parentPort.on('message')</code>). By default a message is <em>copied</em> using the structured clone algorithm. If copying a big payload is too expensive, you have two escape hatches: <strong>transfer</strong> an <code>ArrayBuffer</code> (hand over ownership with zero copy — the sender loses access), or use a <strong>SharedArrayBuffer</strong>, which is genuinely shared memory both threads can read and write live (coordinated with <code>Atomics</code>).</p>`,
        `{{fig:ch14-worker-vs-cluster.svg|Side-by-side comparison of worker_threads sharing one process and heap versus cluster forking separate processes with isolated memory|worker_threads live in one process and can share memory; cluster spawns separate processes that share nothing but a port.}}`,
        `<p>The key distinction from cluster: <strong>cluster is many processes for I/O throughput; worker_threads is many threads for CPU work.</strong> Cluster answers "serve more simultaneous connections across cores." Worker_threads answers "do this heavy calculation without freezing the request handler." They are complementary, not competitors — a big service might cluster for concurrency <em>and</em> use worker_threads (or a pool of them) for the occasional CPU-bound job.</p>`,
        `<h2>How it works</h2>`,
        `<p>You create a worker with <code>new Worker(filename, { workerData })</code>. Node spins up a new thread, creates a fresh V8 isolate on it, and runs the given file from scratch — modules are <em>not</em> shared, so the worker re-imports what it needs. The <code>workerData</code> value is structured-cloned into the worker at start-up as its initial input. From then on, the two sides exchange messages over the port.</p>`,
        `<p><strong>Data movement</strong> has three modes, and understanding their cost is the whole game:</p>`,
        `{{fig:ch14-worker-data-sharing.svg|Three panels showing copy via structured clone transfer of an ArrayBuffer and true sharing via SharedArrayBuffer|Copy is safe but scales with payload size; transfer hands over an ArrayBuffer with zero copy; SharedArrayBuffer is real shared memory coordinated with Atomics.}}`,
        `<ul>`,
        `<li><strong>Copy (default):</strong> <code>postMessage(obj)</code> deep-clones the object. Simple and safe, but the cost grows with size — cloning hundreds of MB defeats the purpose.</li>`,
        `<li><strong>Transfer (zero-copy):</strong> <code>postMessage(buf, [buf.buffer])</code> moves an <code>ArrayBuffer</code>'s ownership to the other thread without copying bytes. The sender's buffer becomes <em>detached</em> (unusable). Ideal for handing a large binary payload one-way.</li>`,
        `<li><strong>Share (concurrent):</strong> a <code>SharedArrayBuffer</code> is mapped into both threads' memory. Both can read and write it simultaneously — which means you now <em>do</em> have real concurrency and must coordinate with <code>Atomics</code> (atomic loads/stores, <code>Atomics.wait</code>/<code>notify</code>) to avoid races.</li>`,
        `</ul>`,
        `<p><strong>Cost of creation matters.</strong> Spinning up a worker is not free — a new thread plus a new V8 isolate costs single-digit-to-tens of milliseconds and a few MB of memory. Creating one worker per request under load will bury you. The production pattern is a <strong>worker pool</strong>: a fixed set of long-lived workers that pull jobs from a queue, so you pay start-up once and reuse. Node 12.11+ ships <code>node:worker_threads</code> primitives, and libraries like <code>piscina</code> provide a battle-tested pool; you can also hand-roll one.</p>`,
        `<p>Note that some of Node's own async APIs already offload to libuv's thread pool without any worker_threads involvement — <code>crypto.pbkdf2</code>, <code>zlib</code>, <code>fs</code>, <code>crypto.randomBytes</code>. If a heavy operation has an async built-in variant, prefer it; worker_threads is for <em>your</em> JavaScript computation that has no such offload.</p>`,
        `<h2>Code examples</h2>`,
        `<p>Offload a CPU-bound calculation so the main thread's event loop stays responsive.</p>`,
        `<pre><code class="language-javascript">// main.js
import { Worker } from 'node:worker_threads';

function runHeavyJob(input) {
  return new Promise((resolve, reject) =&gt; {
    const worker = new Worker('./heavy.js', { workerData: input });
    worker.once('message', resolve);
    worker.once('error', reject);
    worker.once('exit', (code) =&gt; {
      if (code !== 0) reject(new Error(\`Worker stopped with code \${code}\`));
    });
  });
}

// The event loop keeps serving requests while this runs on another thread.
const result = await runHeavyJob({ n: 45 });
console.log('fib:', result);</code></pre>`,
        `<pre><code class="language-javascript">// heavy.js — runs on its own thread with its own heap
import { workerData, parentPort } from 'node:worker_threads';

function fib(n) { return n &lt; 2 ? n : fib(n - 1) + fib(n - 2); }

const answer = fib(workerData.n);   // blocks THIS thread only
parentPort.postMessage(answer);     // send the result back, then exit</code></pre>`,
        `<p>A minimal reusable worker <strong>pool</strong> — the pattern you actually ship. Fixed workers, a task queue, one worker per job at a time.</p>`,
        `<pre><code class="language-javascript">// pool.js — tiny fixed-size worker pool
import { Worker } from 'node:worker_threads';
import { availableParallelism } from 'node:os';

export class Pool {
  #idle = [];
  #queue = [];
  constructor(file, size = availableParallelism()) {
    for (let i = 0; i &lt; size; i++) this.#idle.push(new Worker(file));
  }
  run(data) {
    return new Promise((resolve, reject) =&gt; {
      this.#queue.push({ data, resolve, reject });
      this.#pump();
    });
  }
  #pump() {
    if (!this.#queue.length || !this.#idle.length) return;
    const worker = this.#idle.pop();
    const { data, resolve, reject } = this.#queue.shift();
    const done = (fn) =&gt; (v) =&gt; { worker.off('error', onErr); this.#idle.push(worker); this.#pump(); fn(v); };
    const onErr = done(reject);
    worker.once('message', done(resolve));
    worker.once('error', onErr);
    worker.postMessage(data);
  }
}</code></pre>`,
        `<p>Real shared memory with <code>SharedArrayBuffer</code> and <code>Atomics</code> — multiple threads incrementing one counter safely.</p>`,
        `<pre><code class="language-javascript">// Shared counter across threads (no copy, no message per update)
import { Worker, isMainThread, workerData } from 'node:worker_threads';

if (isMainThread) {
  const shared = new SharedArrayBuffer(4);       // 4 bytes = one Int32
  const view = new Int32Array(shared);
  for (let i = 0; i &lt; 4; i++) new Worker(new URL(import.meta.url), { workerData: shared });
  setTimeout(() =&gt; console.log('total:', Atomics.load(view, 0)), 500);
} else {
  const view = new Int32Array(workerData);
  for (let i = 0; i &lt; 100000; i++) Atomics.add(view, 0, 1);  // atomic += 1
}</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Creating a worker per request.</strong> Thread + isolate startup is expensive; under load this melts down. Use a fixed pool and reuse workers.</li>`,
        `<li><strong>Expecting shared variables by default.</strong> Threads have separate heaps. A module-level variable in the worker is not the same object as in main. Only <code>SharedArrayBuffer</code> is truly shared; everything else is copied or transferred.</li>`,
        `<li><strong>Using a transferred buffer after transfer.</strong> After <code>postMessage(buf, [buf.buffer])</code>, the sender's buffer is detached — reading it throws or yields empty. Transfer is a hand-off, not a share.</li>`,
        `<li><strong>Reaching for worker_threads for I/O.</strong> I/O is already non-blocking on the main thread. Threading it adds overhead for no gain. Worker_threads is for <em>CPU</em>-bound JS. Use cluster (or just async I/O) for concurrency.</li>`,
        `<li><strong>Forgetting to terminate workers.</strong> Leaked workers keep threads and memory alive and can prevent the process from exiting. Call <code>worker.terminate()</code> when done (pools should reuse, but bound the pool and clean up on shutdown).</li>`,
        `<li><strong>Ignoring the <code>'error'</code> and non-zero <code>'exit'</code> events.</strong> An uncaught throw inside a worker surfaces as an <code>'error'</code> event, not a rejected promise, unless you wire it up. Unhandled, it can crash the worker silently.</li>`,
        `<li><strong>Races on SharedArrayBuffer without Atomics.</strong> Plain reads/writes to shared memory across threads are not safe. Use <code>Atomics</code> for correctness and for the wait/notify handshake.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Pool, don't spawn per task.</strong> Use <code>piscina</code> or a small fixed pool sized to <code>availableParallelism()</code>; queue work onto idle workers.</li>`,
        `<li><strong>Move only what you must.</strong> Send inputs, return outputs — don't ship huge objects back and forth. Transfer ArrayBuffers for large binary data; share via SharedArrayBuffer only when threads genuinely need live concurrent access.</li>`,
        `<li><strong>Prefer built-in async offloads first.</strong> <code>zlib</code>, <code>crypto.pbkdf2</code>, async <code>fs</code> already use libuv's pool. Reach for worker_threads only for your own CPU-bound JavaScript.</li>`,
        `<li><strong>Keep workers pure and stateless</strong> where possible — input in, result out — so they're easy to pool and restart.</li>`,
        `<li><strong>Always handle <code>error</code>/<code>exit</code></strong> and set timeouts so a stuck job doesn't leak a worker.</li>`,
        `<li><strong>Measure before threading.</strong> If the op has an async built-in or the payload is tiny, the overhead of a worker can exceed the benefit.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: worker_threads vs cluster — what's the real difference and when do you use each?</strong><br>A: cluster forks separate <em>processes</em> sharing a port to scale I/O concurrency across cores; they share no memory. worker_threads spawns <em>threads</em> inside one process to run CPU-bound JavaScript off the main thread, and they can share memory via SharedArrayBuffer. Rule of thumb: many concurrent requests → cluster; heavy computation per request → worker_threads.</p></blockquote>`,
        `<blockquote><p><strong>Q: Does async/await help with CPU-bound work?</strong><br>A: No. async/await only helps with <em>waiting</em> (I/O). A synchronous computation still runs to completion on the current thread and blocks the event loop regardless of async syntax. You need worker_threads (or a queue/external service) to get it off the main thread. (Very common trap.)</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you share data with a worker without copying it?</strong><br>A: Two ways. Transfer an ArrayBuffer with the transfer list — zero-copy ownership hand-off, sender's buffer detaches. Or use a SharedArrayBuffer for genuinely shared memory both threads read/write live, coordinated with Atomics. The default <code>postMessage</code> copies via structured clone.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why is creating a worker per request a bad idea?</strong><br>A: Each worker needs a new OS thread and a new V8 isolate — milliseconds of startup and megabytes of memory. Per-request creation collapses under load. Use a fixed-size worker pool that reuses long-lived workers pulling from a job queue.</p></blockquote>`,
        `<blockquote><p><strong>Q: Do worker threads share the same event loop as the main thread?</strong><br>A: No. Each worker has its own event loop, its own microtask/macrotask queues, and its own heap. Blocking one thread does not block another's loop — that isolation is the whole point.</p></blockquote>`,
        `<blockquote><p><strong>Q: You need to hash passwords under heavy signup load. worker_threads or something else?</strong><br>A: Prefer the built-in async offload first — <code>crypto.pbkdf2</code>/<code>scrypt</code> already run on libuv's thread pool, off the main thread, no worker_threads needed. Reach for worker_threads only for CPU-bound JS that has no async built-in. (Good senior answer names the async built-in.)</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>worker_threads = threads in one process</strong> for CPU-bound JS; each has its own loop + heap.</li>`,
        `<li>Default message = <strong>structured-clone copy</strong>; transfer an <code>ArrayBuffer</code> = zero-copy; <code>SharedArrayBuffer</code> = real shared memory + <code>Atomics</code>.</li>`,
        `<li><strong>cluster</strong> = processes for I/O concurrency; <strong>worker_threads</strong> = threads for computation. Complementary.</li>`,
        `<li>async/await does <strong>nothing</strong> for CPU-bound code — only worker_threads/queue gets it off the main thread.</li>`,
        `<li>Never spawn per request → use a <strong>fixed pool</strong> (piscina) sized to <code>availableParallelism()</code>.</li>`,
        `<li>Prefer built-in async offloads (<code>zlib</code>, <code>crypto.pbkdf2</code>, async <code>fs</code>) before threading.</li>`,
        `<li>Handle <code>error</code>/<code>exit</code>; terminate/clean up workers on shutdown.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // TOPIC 2 — Child processes
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Child processes',
      slug: 'child-processes',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Not everything your service needs to do is JavaScript. You want to transcode a video with <code>ffmpeg</code>, run a Git command, shell out to a Python script, invoke ImageMagick, run a database backup, or call any of the thousands of mature command-line tools that already solve a problem better than you could re-implement it. The <strong>child_process</strong> module is Node's bridge to the operating system: it lets your app <strong>launch and control external programs</strong>, stream their output, feed them input, and get their exit status.</p>`,
        `<p>It is also how Node scales itself — <code>cluster</code> is built on <code>child_process.fork()</code> — and it is where one of the most dangerous security bugs in the ecosystem lives: <strong>command injection</strong>. Choosing <code>exec</code> vs <code>spawn</code> vs <code>execFile</code>, and whether a shell is involved, is not a stylistic preference; it decides whether an attacker who controls a filename can run arbitrary commands on your server. In interviews, being able to say <em>which</em> of the four methods to use and <em>why</em> — especially the shell/injection distinction — signals real production experience.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>child_process gives you four ways to start another program, and they differ along three axes: <strong>does a shell get involved</strong>, <strong>is the output streamed or buffered</strong>, and <strong>is there a built-in messaging channel</strong>.</p>`,
        `{{fig:ch14-child-process-methods.svg|Four quadrants comparing spawn exec execFile and fork by shell usage output buffering and IPC|spawn streams output with no shell; exec buffers all output through a shell; execFile runs a binary directly without a shell; fork starts a Node child with a built-in IPC channel.}}`,
        `<ul>`,
        `<li><strong>spawn(cmd, args)</strong> — launches a program and gives you its <code>stdout</code>/<code>stderr</code> as <em>streams</em>. Output arrives incrementally, so there's no size limit. No shell by default. Best for long-running or high-output processes (ffmpeg, <code>tail -f</code>, backups).</li>`,
        `<li><strong>exec(cmdString)</strong> — runs a command <em>through a shell</em> and <em>buffers</em> all output, handing it to a callback at the end. Convenient (pipes, <code>&amp;&amp;</code>, globs work), but capped by <code>maxBuffer</code> (1&nbsp;MB default) and shell-based → injection risk. Best for short commands with small output.</li>`,
        `<li><strong>execFile(file, args)</strong> — like exec but <em>no shell</em>: it runs a binary directly with an args array. Safer against injection because shell metacharacters aren't interpreted. Buffered output like exec.</li>`,
        `<li><strong>fork(modulePath)</strong> — a specialization of spawn for running <em>another Node.js script</em>, with an automatic <strong>IPC channel</strong> so parent and child exchange messages via <code>child.send()</code> / <code>process.on('message')</code>. This is what cluster uses.</li>`,
        `</ul>`,
        `<p>The mental shortcut: <strong>spawn/execFile take an args array and skip the shell (safe); exec takes one command string and uses a shell (convenient but risky); fork is for Node-to-Node with messaging.</strong> All of them create a genuine separate OS process with its own memory — so this is another way (besides cluster and worker_threads) to move heavy or blocking work off your event loop.</p>`,
        `<h2>How it works</h2>`,
        `<p>Every child process exposes three standard streams — <code>stdin</code>, <code>stdout</code>, <code>stderr</code> — plus lifecycle events: <code>'spawn'</code> (started), <code>'exit'</code> (process ended, with code/signal), <code>'error'</code> (failed to start, e.g. binary not found), and <code>'close'</code> (streams flushed). With <code>spawn</code> you subscribe to <code>child.stdout.on('data', ...)</code> to consume output as it flows; with <code>exec</code>/<code>execFile</code> Node accumulates it for you and calls back with <code>(err, stdout, stderr)</code>.</p>`,
        `<p><strong>The shell distinction is the crux.</strong> <code>exec</code> effectively runs <code>/bin/sh -c "your string"</code>. The shell parses that string, so metacharacters like <code>;</code>, <code>|</code>, <code>&amp;&amp;</code>, <code>$()</code>, and backticks are <em>interpreted</em>. If any part of that string comes from user input, an attacker can inject commands: a "filename" of <code>a.txt; rm -rf /</code> becomes two commands. <code>spawn</code>/<code>execFile</code> with an args array pass arguments <em>directly</em> to the program via the OS, with no shell parsing, so a malicious "filename" is just a (harmless) literal argument. This is why the rule is: <strong>never build a shell command string from untrusted input; use spawn/execFile with an args array.</strong> (If you truly need shell features, <code>spawn(cmd, args, { shell: true })</code> exists — but then you own the injection risk again.)</p>`,
        `<p><strong>maxBuffer</strong> is the other classic footgun. Because <code>exec</code>/<code>execFile</code> buffer all output in memory, they cap it (default 1&nbsp;MB). A command that prints more than that is killed with an <code>ERR_CHILD_PROCESS_STDOUT_MAXBUFFER_EXCEEDED</code> error and truncated output — a silent, confusing failure in production. For anything that can produce large output, use <code>spawn</code> and stream.</p>`,
        `<p><strong>IPC via fork.</strong> When you <code>fork</code> a Node module, Node opens an extra pipe as a message channel. <code>child.send(obj)</code> serializes <code>obj</code> (JSON/structured-clone) and delivers it to the child's <code>process.on('message')</code>, and vice versa. Like cluster, this is copy-based messaging, not shared memory. You can also pass a server handle or socket over this channel, which is precisely how cluster shares its listening socket with workers.</p>`,
        `<p>All variants also have <strong>synchronous siblings</strong> — <code>spawnSync</code>, <code>execSync</code>, <code>execFileSync</code>. These <em>block the event loop</em> until the child exits, so they're fine in build scripts and CLIs but should essentially never appear in a request handler.</p>`,
        `<h2>Code examples</h2>`,
        `<p>Stream a long-running external tool with <code>spawn</code> — output arrives incrementally, no buffer cap, no shell.</p>`,
        `<pre><code class="language-javascript">import { spawn } from 'node:child_process';

// Note: command and args are SEPARATE — no shell parses this string.
const ffmpeg = spawn('ffmpeg', ['-i', 'input.mov', '-vcodec', 'h264', 'out.mp4']);

ffmpeg.stdout.on('data', (chunk) =&gt; process.stdout.write(chunk));
ffmpeg.stderr.on('data', (chunk) =&gt; process.stderr.write(chunk));   // ffmpeg logs here

ffmpeg.on('error', (err) =&gt; console.error('failed to start:', err.message));
ffmpeg.on('close', (code) =&gt; {
  console.log(code === 0 ? 'transcode done' : \`ffmpeg exited \${code}\`);
});</code></pre>`,
        `<p>The safe way to pass user input: <code>execFile</code> (or spawn) with an args array — shell metacharacters can't break out.</p>`,
        `<pre><code class="language-javascript">import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);

async function countLines(userPath) {
  // Even if userPath is "a.txt; rm -rf /", it's passed as ONE literal arg.
  const { stdout } = await run('wc', ['-l', userPath], { timeout: 5000 });
  return Number(stdout.trim().split(/\\s+/)[0]);
}

// DANGER — never do this with untrusted input:
//   exec(\`wc -l \${userPath}\`)   // shell parses ';' → command injection</code></pre>`,
        `<p>Two-way messaging with <code>fork</code> — offload a job to a Node child and get the result over IPC.</p>`,
        `<pre><code class="language-javascript">// parent.js
import { fork } from 'node:child_process';

const child = fork('./report-worker.js');
child.send({ type: 'build-report', month: '2026-07' });
child.on('message', (msg) =&gt; {
  if (msg.type === 'done') { console.log('report ready:', msg.path); child.disconnect(); }
});

// report-worker.js
process.on('message', async (msg) =&gt; {
  if (msg.type === 'build-report') {
    const path = await buildHeavyReport(msg.month);   // CPU/IO heavy, off parent's loop
    process.send({ type: 'done', path });
  }
});</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Command injection via exec + user input.</strong> The single most dangerous mistake. Interpolating untrusted data into an <code>exec</code> string lets attackers run arbitrary shell commands. Use <code>execFile</code>/<code>spawn</code> with an args array.</li>`,
        `<li><strong>maxBuffer overflow with exec.</strong> Output over 1&nbsp;MB kills the child and truncates results. For large/streaming output use <code>spawn</code>.</li>`,
        `<li><strong>Ignoring <code>stderr</code> and exit codes.</strong> Many tools (ffmpeg, git) write progress/errors to stderr and signal failure via a non-zero exit code, not by throwing. Check <code>code</code> on <code>'exit'</code>/<code>'close'</code> and read stderr.</li>`,
        `<li><strong>Confusing <code>'error'</code> with a non-zero exit.</strong> <code>'error'</code> fires when the process couldn't <em>start</em> (binary missing, permission denied). A process that starts and then fails emits <code>'exit'</code> with a non-zero code — not <code>'error'</code>.</li>`,
        `<li><strong>Using the <code>*Sync</code> variants in a server.</strong> <code>execSync</code>/<code>spawnSync</code> block the entire event loop until the child finishes — fine in CLIs, catastrophic in request handlers.</li>`,
        `<li><strong>Zombie/orphan processes.</strong> If your Node process dies without cleaning up, long-running children can be orphaned. Track children and kill them on shutdown; consider <code>detached</code>/process groups deliberately.</li>`,
        `<li><strong>Assuming fork shares memory.</strong> fork's IPC copies messages; it is not shared memory. Large data over <code>send()</code> is serialized every time.</li>`,
        `<li><strong>No timeout.</strong> An external tool that hangs will hang your request forever. Always pass a <code>timeout</code> (and handle the kill).</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Default to <code>spawn</code>/<code>execFile</code> with an args array.</strong> Only use a shell (<code>exec</code> or <code>shell: true</code>) when you truly need shell features <em>and</em> the whole command is trusted/static.</li>`,
        `<li><strong>Never interpolate untrusted input into a command string.</strong> Validate/allowlist arguments; pass them as array elements, not concatenated text.</li>`,
        `<li><strong>Stream large output with spawn</strong> instead of buffering with exec; set <code>maxBuffer</code> deliberately if you must buffer.</li>`,
        `<li><strong>Always set a <code>timeout</code></strong> and handle the resulting kill signal; check exit codes and stderr for failure.</li>`,
        `<li><strong>Track and clean up children</strong> on <code>SIGTERM</code>/shutdown so you don't leak processes.</li>`,
        `<li><strong>Prefer a native/library solution when one exists</strong> — shelling out adds a process, a dependency on an installed binary, and an attack surface. Use child_process when a mature external tool genuinely beats reimplementing.</li>`,
        `<li><strong>Use <code>fork</code> only for Node-to-Node</strong> with messaging; for arbitrary binaries use spawn/execFile.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: spawn vs exec — what's the difference and when do you pick each?</strong><br>A: <code>spawn</code> streams output (no size limit) and by default doesn't use a shell — best for long-running or high-output processes. <code>exec</code> runs through a shell and buffers all output into a callback (capped by <code>maxBuffer</code>, 1&nbsp;MB) — convenient for short commands but risky with user input. Rule: spawn for streaming/large output, exec only for small trusted commands.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you prevent command injection when shelling out?</strong><br>A: Don't build a shell command string from user input. Use <code>execFile</code> or <code>spawn</code> with the command and an <em>args array</em>, so no shell interprets metacharacters — a malicious "filename" like <code>a; rm -rf /</code> is passed as a single literal argument. Avoid <code>exec</code> and <code>shell: true</code> with untrusted data. (This is the trap they're fishing for.)</p></blockquote>`,
        `<blockquote><p><strong>Q: What does fork give you that spawn doesn't?</strong><br>A: fork is spawn specialized for launching another Node.js module, and it automatically sets up an IPC channel so parent and child exchange messages via <code>send()</code>/<code>'message'</code>. It's what cluster uses to fork and coordinate workers. spawn can run any binary but has no built-in messaging.</p></blockquote>`,
        `<blockquote><p><strong>Q: You run <code>exec('git log')</code> on a huge repo and it fails. Why?</strong><br>A: <code>exec</code> buffers all stdout in memory with a default <code>maxBuffer</code> of 1&nbsp;MB. Large output exceeds it, so the child is killed and output truncated with a maxBuffer error. Fix: use <code>spawn</code> and stream stdout, or raise <code>maxBuffer</code> intentionally.</p></blockquote>`,
        `<blockquote><p><strong>Q: Difference between the <code>'error'</code> event and a non-zero exit code?</strong><br>A: <code>'error'</code> means the process failed to <em>start</em> (binary not found, no permission). A non-zero <code>exit</code>/<code>close</code> code means it started but the program itself failed. You must handle both — many candidates only check one.</p></blockquote>`,
        `<blockquote><p><strong>Q: child_process vs worker_threads for offloading work?</strong><br>A: child_process spawns a whole separate OS process (heavier, full isolation, good for running external programs or separate Node scripts). worker_threads runs threads inside the current process (lighter, can share memory via SharedArrayBuffer, best for CPU-bound JavaScript). For invoking ffmpeg/git → child_process; for a heavy JS calculation → worker_threads.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>spawn</strong> = stream output, no shell, no size cap → long-running / large output.</li>`,
        `<li><strong>exec</strong> = shell + buffered output (<code>maxBuffer</code> 1&nbsp;MB) → short, <em>trusted</em> commands only.</li>`,
        `<li><strong>execFile</strong> = like exec but no shell, args array → safe way to buffer.</li>`,
        `<li><strong>fork</strong> = spawn a Node module + auto IPC (<code>send</code>/<code>message</code>) → what cluster uses.</li>`,
        `<li><strong>Injection rule:</strong> untrusted input → spawn/execFile with an <strong>args array</strong>, never an exec string.</li>`,
        `<li>Events: <code>error</code> = failed to start; non-zero <code>exit</code> = ran but failed. Handle both + read stderr.</li>`,
        `<li>Always set a <strong>timeout</strong>; kill children on shutdown; avoid <code>*Sync</code> in servers.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // TOPIC 3 — Caching with Redis
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Caching with Redis',
      slug: 'caching-redis',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>The fastest query is the one you never run. Every time your API can answer from a fast in-memory store instead of hitting the primary database, you save tens of milliseconds, cut database load, and buy headroom to serve more traffic on the same hardware. Under real load, <strong>caching is frequently the single highest-leverage performance change you can make</strong> — a well-placed cache in front of a hot, read-heavy endpoint can turn a p99 of 400&nbsp;ms into 5&nbsp;ms and drop database CPU by half.</p>`,
        `<p><strong>Redis</strong> is the default tool for this in the Node world. It's an in-memory data store that reads and writes in microseconds, speaks a simple protocol, and offers exactly the primitives caching needs: key/value with per-key expiry (TTL), atomic counters, pub/sub, and data structures (hashes, sorted sets, lists). It's also the standard place to keep the <em>shared</em> state that cluster workers and multiple containers can't hold in local memory — sessions, rate-limit counters, distributed locks. In interviews, caching is where the questions get sharp: anyone can call "cache it," but the real signal is understanding <strong>invalidation</strong> — famously "one of the two hard things in computer science" — and the failure modes (stampede, penetration, avalanche) that separate a cache that helps from one that takes down your database at 3&nbsp;a.m.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A cache is a small, fast store that holds copies of data that's expensive to compute or fetch, keyed so you can look it up quickly. The core question is always <strong>where does the data live and how does it stay correct</strong>. The dominant read pattern is <strong>cache-aside</strong> (a.k.a. lazy loading): your app checks the cache first; on a <em>hit</em> it returns immediately; on a <em>miss</em> it reads the database, stores the result in the cache (with a TTL), and returns it. The cache fills itself on demand — only data that's actually requested gets cached.</p>`,
        `{{fig:ch14-cache-aside.svg|Flow of a cache-aside read where the app checks Redis first returns on a hit and on a miss queries the database then back-fills the cache with a TTL|Cache-aside: check Redis, return on hit; on a miss read the DB, write the value back with a TTL, and return it. On writes, update the DB then invalidate the key.}}`,
        `<p>The other half is <strong>writes and invalidation</strong> — keeping the cache from serving stale data after the underlying record changes. The common strategies:</p>`,
        `<ul>`,
        `<li><strong>Write-through:</strong> write to cache and DB together on every write. Cache is always fresh, but writes are slower and you cache data nobody may read.</li>`,
        `<li><strong>Write-around:</strong> write only to the DB; let the cache fill on the next read. Good for write-heavy data, but the first read after a write is a miss.</li>`,
        `<li><strong>Write-back:</strong> write to cache now, flush to DB later. Fastest writes, but you can lose data if the cache dies before flushing — rarely used for durable data.</li>`,
        `</ul>`,
        `<p>Most APIs use <strong>cache-aside for reads + explicit invalidation on writes</strong>: after you update the database, you <em>delete</em> the cache key (rather than trying to update it), so the next read repopulates fresh. Layered on top, a <strong>TTL</strong> on every key acts as a safety net — even if an invalidation is missed, the stale entry self-heals when it expires.</p>`,
        `{{fig:ch14-cache-patterns.svg|Top row compares write-through write-back and write-around strategies bottom row shows cache stampede penetration and avalanche failures with fixes|Write strategies (top) and the three cache failure modes under load (bottom): stampede on a hot-key miss, penetration by keys that never exist, and avalanche when many keys expire together.}}`,
        `<h2>How it works</h2>`,
        `<p>In Node you talk to Redis through a client — <strong><code>ioredis</code></strong> (feature-rich, cluster-aware) or the official <strong><code>redis</code></strong> (node-redis v4+) package. Both are promise-based and maintain a persistent TCP connection (you create the client once at startup and reuse it — never per request). You mostly use a handful of commands: <code>GET</code>/<code>SET</code>, <code>SET key val EX seconds</code> (set with expiry), <code>DEL</code> (invalidate), <code>INCR</code> (atomic counter for rate limiting), <code>EXPIRE</code>, and for grouped data <code>HSET</code>/<code>HGETALL</code>. Values are strings/bytes, so objects are stored as <code>JSON.stringify</code> and parsed on read.</p>`,
        `<p><strong>TTL and eviction.</strong> Every cache key should expire. TTL bounds staleness and stops the cache growing without limit. Redis also enforces a memory cap via <code>maxmemory</code> + an eviction policy — for a pure cache you typically set <code>allkeys-lru</code> (evict least-recently-used keys when full), so Redis behaves like a proper bounded cache rather than filling up and rejecting writes.</p>`,
        `<p>Now the three failure modes the diagram names — this is the depth interviewers probe:</p>`,
        `<ul>`,
        `<li><strong>Cache stampede (thundering herd):</strong> a very popular key expires, and in the microsecond it's gone, thousands of concurrent requests all miss simultaneously and hit the database at once — potentially overwhelming it. Fixes: a short <em>lock</em> so only one request recomputes while others wait or serve stale; <em>early/probabilistic refresh</em> (recompute just before expiry); or serve-stale-while-revalidate.</li>`,
        `<li><strong>Cache penetration:</strong> requests for keys that <em>don't exist</em> (e.g. random product IDs from a scraper) always miss the cache and always hit the DB, because there's nothing to cache. Fix: cache the negative result (store a short-TTL "null" marker), and/or use a Bloom filter to reject unknown keys.</li>`,
        `<li><strong>Cache avalanche:</strong> many keys are given the <em>same</em> TTL (e.g. warmed at boot with 1-hour expiry) and all expire at the same instant, causing a coordinated flood of misses. Fix: add <em>jitter</em> — randomize each TTL by, say, ±10% so expirations spread out.</li>`,
        `</ul>`,
        `<p><strong>Sessions and shared state.</strong> Beyond caching query results, Redis is the standard session store. In a clustered or multi-container deployment, workers don't share memory, so an in-process session map breaks the moment a user's next request lands on a different worker (see the cluster topic). Storing sessions in Redis — via <code>connect-redis</code> for <code>express-session</code>, keyed by session ID with a TTL — makes any worker able to serve any user. The same logic makes Redis the home for rate-limit counters (<code>INCR</code> + <code>EXPIRE</code>) and distributed locks.</p>`,
        `<h2>Code examples</h2>`,
        `<p>Cache-aside read with a TTL, using ioredis — the everyday pattern.</p>`,
        `<pre><code class="language-javascript">import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);   // one client, reused

async function getUser(id) {
  const key = \`user:\${id}\`;

  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);          // HIT

  const user = await db.users.findById(id);       // MISS → source of truth
  if (user) {
    // EX = expire seconds; add jitter to avoid avalanche
    const ttl = 300 + Math.floor(Math.random() * 60);
    await redis.set(key, JSON.stringify(user), 'EX', ttl);
  }
  return user;
}</code></pre>`,
        `<p>Write path: update the database, then <em>invalidate</em> (delete) the key so the next read repopulates fresh — don't leave stale data behind.</p>`,
        `<pre><code class="language-javascript">async function updateUser(id, patch) {
  const user = await db.users.update(id, patch);
  await redis.del(\`user:\${id}\`);                  // invalidate; next GET refills
  return user;
}

// Cache penetration guard: cache the "not found" result briefly so
// repeated lookups of a non-existent id don't keep hammering the DB.
async function getUserSafe(id) {
  const key = \`user:\${id}\`;
  const cached = await redis.get(key);
  if (cached === '__missing__') return null;
  if (cached) return JSON.parse(cached);

  const user = await db.users.findById(id);
  await redis.set(key, user ? JSON.stringify(user) : '__missing__', 'EX', user ? 300 : 30);
  return user;
}</code></pre>`,
        `<p>Stampede protection with a lock — only one request recomputes a hot key; others briefly back off. (<code>SET NX</code> = set only if absent, atomic.)</p>`,
        `<pre><code class="language-javascript">async function getWithLock(key, loader, ttl = 300) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  // Try to acquire a short lock so only ONE caller rebuilds the value.
  const gotLock = await redis.set(\`lock:\${key}\`, '1', 'EX', 10, 'NX');
  if (!gotLock) {
    await new Promise((r) =&gt; setTimeout(r, 50));   // let the winner fill it
    return getWithLock(key, loader, ttl);          // retry the cache
  }
  try {
    const value = await loader();                  // the single DB hit
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
    return value;
  } finally {
    await redis.del(\`lock:\${key}\`);
  }
}</code></pre>`,
        `<p>Sessions in Redis so any cluster worker / container can authenticate a user.</p>`,
        `<pre><code class="language-javascript">import session from 'express-session';
import { RedisStore } from 'connect-redis';
import Redis from 'ioredis';

const store = new RedisStore({ client: new Redis(process.env.REDIS_URL) });
app.use(session({
  store,                                   // sessions live in Redis, not process memory
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: true, maxAge: 86_400_000 },
}));</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Caching without a TTL.</strong> Keys live forever, memory fills, and any missed invalidation serves stale data indefinitely. Always set an expiry.</li>`,
        `<li><strong>Updating the cache instead of invalidating it.</strong> Trying to keep the cached copy in sync with every write is error-prone (concurrent writes, partial updates). The robust default is delete-on-write and let the next read refill.</li>`,
        `<li><strong>Identical TTLs → avalanche.</strong> Warming many keys with the same expiry makes them all die at once. Add jitter.</li>`,
        `<li><strong>No stampede protection on hot keys.</strong> A single expiring hot key can unleash a thundering herd on the DB. Use a lock, early refresh, or stale-while-revalidate.</li>`,
        `<li><strong>Ignoring cache penetration.</strong> Lookups for non-existent keys bypass the cache entirely. Cache negatives (short TTL) or filter with a Bloom filter.</li>`,
        `<li><strong>Creating a Redis client per request.</strong> Connection setup is expensive; create one client at startup and reuse it. Per-request clients exhaust connections.</li>`,
        `<li><strong>Treating the cache as a system of record.</strong> Redis (as a cache) can evict or be flushed; never store the only copy of durable data in it. The DB is the source of truth.</li>`,
        `<li><strong>Not handling Redis being down.</strong> If Redis is unreachable, your app should degrade to hitting the DB, not throw 500s. Wrap cache reads so a cache error falls through to the source.</li>`,
        `<li><strong>Large <code>KEYS</code> scans in production.</strong> <code>KEYS *</code> blocks Redis (single-threaded). Use <code>SCAN</code>, or better, structure keys so you can delete by known key, not by scanning.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Default to cache-aside + delete-on-write + TTL.</strong> It's simple, robust, and covers most read-heavy APIs.</li>`,
        `<li><strong>Always expire keys, and jitter TTLs</strong> to prevent synchronized expiry.</li>`,
        `<li><strong>Set <code>maxmemory</code> + <code>allkeys-lru</code></strong> so Redis behaves as a bounded cache and evicts cold data instead of failing writes.</li>`,
        `<li><strong>Protect hot keys</strong> with a rebuild lock or early refresh; cache negatives to stop penetration.</li>`,
        `<li><strong>Use one shared client</strong> (ioredis/node-redis) created at startup; enable reconnection and command timeouts.</li>`,
        `<li><strong>Fail open.</strong> On a cache error, fall back to the database so a Redis blip doesn't become an outage.</li>`,
        `<li><strong>Namespace and version keys</strong> (<code>user:v2:42</code>) so you can invalidate a whole shape by bumping the version.</li>`,
        `<li><strong>Store shared state (sessions, rate limits, locks) in Redis</strong> so it survives across cluster workers and containers.</li>`,
        `<li><strong>Only cache what's hot and read-heavy.</strong> Caching rarely-read data wastes memory; measure hit rate and evict cold entries.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: Explain the cache-aside pattern.</strong><br>A: The app checks the cache first. On a hit it returns the cached value; on a miss it reads the database, writes the result into the cache with a TTL, and returns it. Writes update the DB and then delete (invalidate) the key so the next read refills. The cache lazily fills with only the data actually requested.</p></blockquote>`,
        `<blockquote><p><strong>Q: What's a cache stampede and how do you prevent it?</strong><br>A: A hot key expires and thousands of concurrent requests all miss at once, flooding the database. Prevent it with a short lock so only one request rebuilds the value while others wait or serve stale, with probabilistic early refresh before expiry, or with stale-while-revalidate. (Interviewers love this because "just cache it" candidates miss it.)</p></blockquote>`,
        `<blockquote><p><strong>Q: On a write, do you update the cache or delete it? Why?</strong><br>A: Usually delete (invalidate). Updating the cached copy on every write is fragile under concurrent/partial writes and can leave the cache inconsistent with the DB. Deleting the key means the next read repopulates from the source of truth — simpler and safer. A TTL backs it up in case an invalidation is missed.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why store sessions in Redis instead of in memory?</strong><br>A: With cluster or multiple containers, workers don't share memory, so an in-process session is invisible when the user's next request lands on a different worker — they appear logged out. Redis is a shared store any worker can read, keyed by session ID with a TTL. (Same reasoning applies to rate-limit counters and distributed locks.)</p></blockquote>`,
        `<blockquote><p><strong>Q: Cache penetration vs avalanche vs stampede?</strong><br>A: Penetration = requests for keys that never exist always miss and hit the DB (fix: cache the null / Bloom filter). Avalanche = many keys expire at the same instant causing a flood (fix: jitter TTLs). Stampede = one hot key expires and many concurrent requests rebuild it at once (fix: lock / early refresh). Distinct problems, distinct fixes.</p></blockquote>`,
        `<blockquote><p><strong>Q: What happens to your app if Redis goes down?</strong><br>A: It should degrade gracefully — cache reads fail open and fall through to the database, maybe slower but still correct. If your app 500s when Redis is unreachable, the cache became a single point of failure. Wrap cache access so errors don't propagate as request failures.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Cache-aside:</strong> check cache → hit returns; miss → read DB, <code>SET … EX</code>, return.</li>`,
        `<li><strong>On write:</strong> update DB then <code>DEL</code> key (invalidate); TTL is the safety net.</li>`,
        `<li>Write strategies: <strong>through</strong> (fresh, slow) / <strong>around</strong> (write-heavy) / <strong>back</strong> (fast, risky).</li>`,
        `<li>Three failures: <strong>stampede</strong> (lock/early refresh), <strong>penetration</strong> (cache null/Bloom), <strong>avalanche</strong> (jitter TTLs).</li>`,
        `<li>Redis clients: <code>ioredis</code>/<code>redis</code> — <strong>one shared client</strong>, never per request.</li>`,
        `<li><code>maxmemory</code> + <code>allkeys-lru</code>; DB is source of truth; <strong>fail open</strong> if Redis is down.</li>`,
        `<li>Redis also holds <strong>shared state</strong>: sessions, rate limits (<code>INCR</code>+<code>EXPIRE</code>), locks (<code>SET NX</code>).</li>`,
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // TOPIC 4 — PM2 & Docker
    // ────────────────────────────────────────────────────────────────
    {
      title: 'PM2 & Docker',
      slug: 'pm2-docker',
      order: 4,
      content: [
        `<h2>Why it matters</h2>`,
        `<p><code>node server.js</code> is how you run an app on your laptop. It is <em>not</em> how you run one in production. In production the process must survive crashes (restart automatically), use every CPU core, never lose your one running copy to an SSH disconnect, capture logs somewhere, and roll out new versions without dropping traffic. And it must run <em>the same way</em> on a teammate's machine, in CI, and on the server — no "works on my machine." The two tools that dominate this space in the Node world are <strong>PM2</strong> (a process manager) and <strong>Docker</strong> (containerization), and the discipline that ties them together is the <strong>12-factor</strong> methodology.</p>`,
        `<p>These come up constantly in interviews because they're where "I can write an endpoint" becomes "I can operate a service." Being able to explain why config belongs in environment variables (not committed files), why you build a Docker image in multiple stages, why the container should run as a non-root user, and how PM2's cluster mode relates to the <code>cluster</code> module — that's the operational literacy senior backend roles screen for.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p><strong>PM2</strong> is a production process manager for Node. You hand it your app and it keeps it alive: it restarts the process if it crashes or runs out of memory, can run <strong>one instance per CPU core in cluster mode</strong> (wrapping the <code>cluster</code> module for you), aggregates logs, and reloads new code with zero downtime. It's the classic way to run Node directly on a VM.</p>`,
        `<p><strong>Docker</strong> packages your app <em>and</em> its entire runtime — the exact Node version, your dependencies, system libraries, everything — into an <strong>image</strong>: a portable, immutable artifact. A running instance of an image is a <strong>container</strong>. Because the image contains everything, it runs identically anywhere Docker runs. This solves "works on my machine" and makes your app deployable to any container platform (Kubernetes, ECS, Cloud Run).</p>`,
        `<p>The key Docker technique for Node is the <strong>multi-stage build</strong>: use a full "builder" image (with compilers and dev dependencies) to install and build, then copy <em>only</em> the runtime artifacts into a small, clean final image. The result is a smaller, faster, more secure image with no build tools left inside.</p>`,
        `{{fig:ch14-docker-layers.svg|Two-stage Docker build where a builder stage installs deps and compiles then a slim runtime stage copies only the built output and runs as a non-root user|Multi-stage build: a fat builder stage compiles and installs everything; the slim runtime stage copies only the built artifacts and production dependencies, drops to a non-root user, and runs the app.}}`,
        `<p><strong>12-factor</strong> is the glue: a set of principles for building services that run well in these environments. The one you'll be asked about most is <strong>config in the environment</strong> — store deploy-specific settings (DB URLs, secrets, feature flags) in environment variables, never hard-coded or committed, so the <em>same</em> image runs in dev, staging, and prod with different env values. Other factors that matter here: treat processes as <strong>stateless</strong> (no local session/file state — put it in a backing service), <strong>logs as event streams</strong> to stdout/stderr (let the platform collect them), and <strong>fast startup / graceful shutdown</strong> so instances are disposable.</p>`,
        `<h2>How it works</h2>`,
        `<p><strong>PM2</strong> runs a background daemon that supervises your processes. <code>pm2 start app.js -i max</code> launches one worker per core in cluster mode; PM2 is the primary, forking workers exactly like the cluster module (it uses it internally), so you get multi-core scaling and automatic respawn without writing fork/exit logic yourself. An <strong>ecosystem file</strong> (<code>ecosystem.config.js</code>) declares apps, instance counts, env vars per environment, memory-restart thresholds, and log paths. <code>pm2 reload</code> does a rolling zero-downtime restart (new workers up before old ones retire); <code>pm2 startup</code> + <code>pm2 save</code> make it survive server reboots.</p>`,
        `<p><strong>Docker builds</strong> from a <code>Dockerfile</code> — an ordered list of instructions, each producing a cached <em>layer</em>. Layer caching is why instruction order matters: copy <code>package.json</code> and run <code>npm ci</code> <em>before</em> copying your source, so that changing a source file doesn't invalidate the (slow) dependency-install layer. <code>npm ci</code> (not <code>npm install</code>) is the production install: it installs exactly what's in the lockfile, deterministically, and is faster in CI. A multi-stage <code>Dockerfile</code> has multiple <code>FROM</code> lines; the final stage <code>COPY --from=builder</code> pulls only what it needs, leaving compilers and dev dependencies behind. A <code>.dockerignore</code> keeps <code>node_modules</code>, <code>.git</code>, and secrets out of the build context.</p>`,
        `<p><strong>Security and correctness details</strong> the diagram highlights: run as a <strong>non-root user</strong> (<code>USER node</code> — the official images ship a <code>node</code> user) so a container escape isn't automatically root; set <code>NODE_ENV=production</code> (many libraries, including Express, optimize on it, and it prunes dev dependencies); pick a slim base (<code>node:20-slim</code> or a distroless/Alpine variant) to shrink attack surface and size; and pin the Node major version rather than <code>latest</code>. Handle <strong>PID 1 and signals</strong>: a Node process running as PID 1 in a container doesn't get default signal handlers, so <code>SIGTERM</code> may be ignored — use <code>--init</code> (or <code>tini</code>) and implement graceful shutdown (next topic) so orchestrator stop/rolling-deploy signals are honored.</p>`,
        `<p><strong>PM2 vs Docker — do you need both?</strong> They overlap on "keep it running and use all cores." A very common modern pattern is <strong>one Node process per container</strong> and let the orchestrator (Kubernetes) handle restarts and horizontal scaling with multiple container replicas — in that world you often <em>don't</em> run PM2 cluster mode inside the container, because the platform already supervises and scales. PM2 shines when you deploy straight onto VMs without an orchestrator. Knowing that trade-off is the senior answer.</p>`,
        `<h2>Code examples</h2>`,
        `<p>A production multi-stage Dockerfile for a Node app — small, non-root, deterministic.</p>`,
        `<pre><code class="language-dockerfile"># ---- Stage 1: build ----
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./          # copy manifests first for layer caching
RUN npm ci                     # deterministic install (dev + prod)
COPY . .
RUN npm run build              # produce dist/
RUN npm prune --omit=dev       # drop dev deps for the runtime copy

# ---- Stage 2: runtime ----
FROM node:20-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
USER node                      # drop root privileges
EXPOSE 3000
CMD ["node", "dist/server.js"]</code></pre>`,
        `<p>A matching <code>.dockerignore</code> keeps the build context small and secrets out of the image.</p>`,
        `<pre><code class="language-bash"># .dockerignore
node_modules
npm-debug.log
.git
.env
Dockerfile
dist
coverage</code></pre>`,
        `<p>Reading config from the environment (12-factor). The same image runs everywhere; only env values change.</p>`,
        `<pre><code class="language-javascript">// config.js — validate env once at startup, fail fast if misconfigured
const required = ['DATABASE_URL', 'REDIS_URL', 'SESSION_SECRET'];
const missing = required.filter((k) =&gt; !process.env[k]);
if (missing.length) {
  console.error('Missing env vars:', missing.join(', '));
  process.exit(1);                       // don't boot half-configured
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  nodeEnv: process.env.NODE_ENV ?? 'development',
};</code></pre>`,
        `<p>A PM2 ecosystem file for VM deployments — cluster mode, per-env config, auto memory restart.</p>`,
        `<pre><code class="language-javascript">// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'api',
    script: 'dist/server.js',
    instances: 'max',            // one worker per CPU core (cluster mode)
    exec_mode: 'cluster',
    max_memory_restart: '500M',  // restart a worker if it leaks past 500MB
    env: { NODE_ENV: 'development', PORT: 3000 },
    env_production: { NODE_ENV: 'production', PORT: 8080 },
  }],
};
// pm2 start ecosystem.config.js --env production
// pm2 reload api   # zero-downtime rolling restart</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Hard-coding config or committing <code>.env</code>.</strong> Secrets in the repo/image leak and can't vary per environment. Read config from env vars; inject secrets at deploy time.</li>`,
        `<li><strong>Single-stage images with dev tooling inside.</strong> Shipping compilers, dev dependencies, and source bloats the image and widens the attack surface. Use multi-stage and copy only runtime artifacts.</li>`,
        `<li><strong>Running as root.</strong> The default container user is root; a compromise is then root inside the container. Add <code>USER node</code>.</li>`,
        `<li><strong>Copying source before installing deps.</strong> Breaks layer caching, so every code change reinstalls all dependencies. Copy <code>package*.json</code> and <code>npm ci</code> first.</li>`,
        `<li><strong><code>npm install</code> instead of <code>npm ci</code> in builds.</strong> <code>install</code> can drift from the lockfile; <code>ci</code> is deterministic and faster for CI/images.</li>`,
        `<li><strong>Ignoring PID 1 / signals.</strong> Node as PID 1 doesn't get default signal handling, so <code>docker stop</code>'s SIGTERM may be ignored and the container is SIGKILLed after a timeout, cutting off in-flight requests. Use <code>--init</code>/tini + graceful shutdown.</li>`,
        `<li><strong>Forgetting <code>NODE_ENV=production</code>.</strong> Without it you keep dev-only overhead and dev dependencies, and some frameworks run slower.</li>`,
        `<li><strong>Running PM2 cluster mode <em>inside</em> Kubernetes.</strong> Double-scaling (PM2 forks × pod replicas) confuses resource accounting and health checks. Usually one process per container and let the orchestrator scale.</li>`,
        `<li><strong>Storing state on the container's filesystem.</strong> Containers are ephemeral; local files/sessions vanish on restart. Keep state in backing services (DB, Redis, object storage).</li>`,
        `<li><strong>Writing logs to files inside the container.</strong> 12-factor says stream logs to stdout/stderr and let the platform collect them.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Config in the environment</strong>, validated at startup (fail fast on missing vars). One image, many environments.</li>`,
        `<li><strong>Multi-stage builds</strong>: fat builder, slim runtime; copy only <code>dist</code> + prod <code>node_modules</code>.</li>`,
        `<li><strong>Slim, pinned base image</strong> (<code>node:20-slim</code>/distroless), <code>NODE_ENV=production</code>, non-root <code>USER node</code>.</li>`,
        `<li><strong>Order Dockerfile for cache</strong>: manifests + <code>npm ci</code> before source; keep a <code>.dockerignore</code>.</li>`,
        `<li><strong>Handle signals</strong>: <code>--init</code>/tini + graceful shutdown so rolling deploys don't drop requests.</li>`,
        `<li><strong>Stateless processes; logs to stdout</strong>; state and sessions in backing services.</li>`,
        `<li><strong>Pick one scaling owner</strong>: PM2 cluster on VMs, <em>or</em> one process per container + orchestrator replicas — not both.</li>`,
        `<li><strong>Add a health-check endpoint</strong> and wire it to the platform's liveness/readiness probes.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: Why not just run <code>node server.js</code> in production?</strong><br>A: It doesn't restart on crash, uses only one core, has no zero-downtime reload, and dies with your shell. You need a supervisor — PM2 (restarts, cluster mode, log aggregation, reloads) on VMs, or a container platform (Kubernetes restarts + replicas) that provides the same guarantees.</p></blockquote>`,
        `<blockquote><p><strong>Q: What is a multi-stage Docker build and why use it for Node?</strong><br>A: A Dockerfile with multiple stages: a builder stage with the full toolchain installs and compiles, then a slim runtime stage <code>COPY --from=builder</code> pulls only the built output and production dependencies. Result: a much smaller image with no compilers, dev deps, or source — faster to ship and a smaller attack surface.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why put config in environment variables (12-factor)?</strong><br>A: So the same immutable image runs unchanged in dev, staging, and prod, with only env values differing — and secrets stay out of the repo and image. Hard-coded or committed config leaks secrets and forces a rebuild per environment. Validate required vars at startup and fail fast.</p></blockquote>`,
        `<blockquote><p><strong>Q: How does PM2 cluster mode relate to the cluster module?</strong><br>A: PM2 cluster mode uses Node's cluster module under the hood — PM2 acts as the primary and forks one worker per core, sharing the port, so you get multi-core scaling and respawn without writing fork/exit code. It's cluster with production ergonomics (logs, reloads, monitoring).</p></blockquote>`,
        `<blockquote><p><strong>Q: Why run the container as a non-root user, and what's the PID 1 problem?</strong><br>A: Non-root (<code>USER node</code>) limits blast radius — a container escape isn't automatically host root. PID 1: a process running as PID 1 doesn't get default signal handlers, so <code>SIGTERM</code> from <code>docker stop</code>/rolling deploys can be ignored and the container gets SIGKILLed, dropping in-flight requests. Fix with <code>--init</code>/tini plus graceful shutdown handling.</p></blockquote>`,
        `<blockquote><p><strong>Q: Do you need PM2 if you're deploying to Kubernetes?</strong><br>A: Usually not in cluster mode. Kubernetes already restarts crashed containers and scales horizontally with replicas, so running PM2's multi-process cluster inside a pod double-counts CPU/memory and confuses probes. The common pattern is one Node process per container and let the orchestrator own scaling and restarts. PM2 is for VM deployments without an orchestrator.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>PM2</strong>: production process manager — restart on crash, <code>-i max</code> cluster mode (wraps cluster module), zero-downtime <code>reload</code>, boot persistence.</li>`,
        `<li><strong>Docker image</strong> = app + runtime, portable/immutable; <strong>container</strong> = running instance.</li>`,
        `<li><strong>Multi-stage build</strong>: fat builder compiles → slim runtime copies only <code>dist</code> + prod deps.</li>`,
        `<li>Dockerfile: <code>package*.json</code> + <code>npm ci</code> <strong>before</strong> source (layer cache); <code>.dockerignore</code>; slim pinned base.</li>`,
        `<li><code>NODE_ENV=production</code>, <code>USER node</code> (non-root), <code>--init</code>/tini for signals.</li>`,
        `<li><strong>12-factor</strong>: config in env, stateless procs, logs to stdout, fast start / graceful stop.</li>`,
        `<li>Scale owner is <strong>one</strong>: PM2 cluster on VMs <em>or</em> one-process-per-container + orchestrator replicas.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // TOPIC 5 — Graceful shutdown & monitoring
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Graceful shutdown & monitoring',
      slug: 'graceful-shutdown',
      order: 5,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>In a modern deployment, your process gets <strong>killed constantly</strong> — and that's normal. Every rolling deploy stops the old version, every autoscaling scale-down removes instances, every Kubernetes node drain evicts pods, every crash-and-restart cycle ends a process. The question is not <em>whether</em> your app will be told to stop, but <em>what happens to the requests in flight</em> when it is. Done naively, the process dies mid-request: a user's payment is cut off half-committed, a database write is left dangling, a queued job is lost. Done right — <strong>graceful shutdown</strong> — the app stops accepting new work, finishes what it's already doing, closes its connections cleanly, and exits. The difference is invisible when it works and a 3&nbsp;a.m. incident when it doesn't.</p>`,
        `<p>The flip side is <strong>monitoring and health checks</strong>: the platform needs to know, continuously, whether your instance is alive and whether it's ready to receive traffic — and you need to know your service's latency, error rate, and resource use before users tell you. Together, graceful shutdown and health/monitoring are what make a Node service <em>operable</em>. In interviews they're a favourite because they reveal whether you've actually run software in production: "what happens when Kubernetes sends SIGTERM?" is a question you can only answer well if you've had to.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>When an orchestrator wants your process to stop, it sends the <strong>SIGTERM</strong> signal — a polite "please shut down." (Contrast <strong>SIGKILL</strong>, which can't be caught and kills instantly, and <strong>SIGINT</strong>, what Ctrl-C sends in your terminal.) By default Node exits on SIGTERM immediately, abandoning in-flight work. Graceful shutdown means <em>catching</em> SIGTERM and running an orderly teardown before exiting.</p>`,
        `<p>The teardown has a fixed shape: <strong>(1)</strong> stop taking new requests, <strong>(2)</strong> let in-flight requests finish (drain), <strong>(3)</strong> close resources — DB pool, Redis, message-queue consumers, flush logs/metrics, <strong>(4)</strong> exit with code 0. And critically, <strong>(5)</strong> a <em>forced-exit timer</em>: if draining takes too long (a stuck request), a timeout forces the exit so shutdown can't hang forever.</p>`,
        `{{fig:ch14-graceful-shutdown.svg|Ordered sequence for graceful shutdown on SIGTERM flip readiness to not-ready stop accepting connections drain in-flight requests close resources exit and a forced-exit safety timer|Graceful shutdown on SIGTERM: mark not-ready so the LB stops routing, stop accepting new connections, drain in-flight requests, close DB/Redis/consumers, then exit — with a forced-exit timer as a safety net.}}`,
        `<p><strong>Health checks</strong> come in two flavours that people constantly conflate. A <strong>liveness</strong> probe answers "is the process alive, or wedged and needing a restart?" — fail it and the platform kills+restarts the instance. A <strong>readiness</strong> probe answers "is this instance ready to receive traffic <em>right now</em>?" — fail it and the load balancer stops routing to it <em>without</em> killing it. The distinction is what makes zero-downtime shutdown work: on SIGTERM you flip <em>readiness</em> to not-ready first, so the load balancer drains you, while the process stays up long enough to finish current requests.</p>`,
        `<p><strong>Monitoring</strong> is the always-on version of the same instinct: continuously observe the service through metrics (latency, throughput, error rate, event-loop lag, memory), logs (structured, to stdout), and traces, so you can see problems before users do and diagnose them fast.</p>`,
        `<h2>How it works</h2>`,
        `<p>You register handlers for the termination signals. On SIGTERM (and usually SIGINT for local dev), you kick off the shutdown sequence. The linchpin is <strong><code>server.close()</code></strong>: it tells the HTTP server to <em>stop accepting new connections</em> but keeps existing ones open until their in-flight requests complete, then fires its callback. That callback is where you close everything else — <code>await pool.end()</code>, <code>await redis.quit()</code>, stop queue consumers, flush your metrics/log buffers — and finally exit.</p>`,
        `<p>Two subtleties make this actually work in production. First, <strong>keep-alive connections</strong>: idle keep-alive sockets can keep <code>server.close()</code> from ever completing because the connection is open with no active request. Node's <code>server.closeIdleConnections()</code> (and, more aggressively, <code>closeAllConnections()</code>) handle this; libraries and Node's own <code>server.keepAliveTimeout</code> also help. Second, the <strong>ordering with the load balancer</strong>: if you call <code>server.close()</code> before the LB has noticed you're going away, new requests it already routed can hit a closing server. That's why you flip the readiness probe to not-ready <em>first</em>, wait a beat for the LB to stop sending traffic, and only then stop accepting. In Kubernetes this is also handled by the pod's <code>preStop</code> hook and <code>terminationGracePeriodSeconds</code>.</p>`,
        `<p>The <strong>forced-exit timer</strong> is non-negotiable: <code>setTimeout(() =&gt; process.exit(1), 10_000).unref()</code>. If a request hangs (a slow upstream, a stuck DB query), you don't want shutdown to block indefinitely — after the grace period, exit anyway. The <code>.unref()</code> ensures this timer itself doesn't keep the process alive if everything <em>else</em> finished cleanly.</p>`,
        `<p><strong>Health endpoints</strong> are ordinary HTTP routes. A liveness route (<code>/healthz</code>) returns 200 as long as the process can respond — keep it cheap and dependency-free so a slow DB doesn't cause needless restarts. A readiness route (<code>/readyz</code>) checks that critical dependencies (DB, Redis) are reachable <em>and</em> returns 503 once shutdown has begun, so the LB drains you. For monitoring, you expose metrics (commonly a Prometheus <code>/metrics</code> endpoint via <code>prom-client</code>), and you watch <strong>event-loop lag</strong> specifically — rising lag is Node's canary for a blocked event loop, the failure this whole chapter's other topics exist to prevent.</p>`,
        `<p>Finally, handle the <strong>crash signals</strong>: <code>uncaughtException</code> and <code>unhandledRejection</code>. Best practice is to log, attempt a fast cleanup, and exit — because after an uncaught exception the process is in an unknown state, so you let the supervisor restart a fresh one rather than limp on corrupted.</p>`,
        `<h2>Code examples</h2>`,
        `<p>A complete, production-shaped graceful shutdown: readiness flip, drain, resource cleanup, forced-exit safety net.</p>`,
        `<pre><code class="language-javascript">import http from 'node:http';

let shuttingDown = false;
const server = http.createServer(app);
server.keepAliveTimeout = 5000;                 // don't let idle sockets linger
server.listen(3000);

async function shutdown(signal) {
  if (shuttingDown) return;                      // idempotent — signals can repeat
  shuttingDown = true;
  console.log(\`\${signal} received — shutting down\`);

  // 1) Force-exit safety net so a stuck request can't hang us forever.
  const killer = setTimeout(() =&gt; {
    console.error('Drain timed out — forcing exit');
    process.exit(1);
  }, 10_000);
  killer.unref();

  // 2) Stop accepting new connections; finish in-flight requests.
  server.close(async () =&gt; {
    try {
      await pool.end();                          // close DB pool
      await redis.quit();                        // close Redis
      console.log('Clean shutdown complete');
      process.exit(0);
    } catch (err) {
      console.error('Error during cleanup', err);
      process.exit(1);
    }
  });
  server.closeIdleConnections?.();               // release idle keep-alive sockets
}

process.on('SIGTERM', () =&gt; shutdown('SIGTERM'));
process.on('SIGINT', () =&gt; shutdown('SIGINT'));  // Ctrl-C in dev</code></pre>`,
        `<p>Liveness vs readiness endpoints — note how readiness reports not-ready as soon as shutdown starts, so the load balancer drains this instance.</p>`,
        `<pre><code class="language-javascript">// Liveness: is the process responsive at all? Keep it cheap, no deps.
app.get('/healthz', (req, res) =&gt; res.status(200).send('ok'));

// Readiness: should traffic be routed here right now?
app.get('/readyz', async (req, res) =&gt; {
  if (shuttingDown) return res.status(503).send('shutting down');  // drain me
  try {
    await pool.query('SELECT 1');                // critical dep reachable?
    await redis.ping();
    res.status(200).send('ready');
  } catch {
    res.status(503).send('dependencies unavailable');
  }
});</code></pre>`,
        `<p>Minimal monitoring: expose Prometheus metrics and watch event-loop lag, Node's early warning for a blocked loop.</p>`,
        `<pre><code class="language-javascript">import client from 'prom-client';
import { monitorEventLoopDelay } from 'node:perf_hooks';

client.collectDefaultMetrics();                  // CPU, memory, GC, handles
const loopLag = monitorEventLoopDelay({ resolution: 20 });
loopLag.enable();

const lagGauge = new client.Gauge({
  name: 'nodejs_eventloop_lag_p99_ms',
  collect() { this.set(loopLag.percentile(99) / 1e6); },  // ns → ms
});

app.get('/metrics', async (req, res) =&gt; {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});</code></pre>`,
        `<p>Crash handlers — log and exit so the supervisor restarts a clean process rather than continuing in an unknown state.</p>`,
        `<pre><code class="language-javascript">process.on('uncaughtException', (err) =&gt; {
  console.error('uncaughtException — exiting', err);
  process.exit(1);                               // let PM2/k8s restart a fresh process
});
process.on('unhandledRejection', (reason) =&gt; {
  console.error('unhandledRejection — exiting', reason);
  process.exit(1);
});</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Not handling SIGTERM at all.</strong> Node's default is immediate exit, so every deploy/scale-down kills in-flight requests. You must catch it and drain.</li>`,
        `<li><strong>No forced-exit timer.</strong> If a request hangs, <code>server.close()</code> never calls back and the process hangs until the platform SIGKILLs it — losing the graceful part entirely. Always add an unref'd timeout.</li>`,
        `<li><strong>Idle keep-alive sockets block <code>server.close()</code>.</strong> Without closing idle connections (or a keep-alive timeout), drain can stall on connections with no active request.</li>`,
        `<li><strong>Confusing liveness and readiness.</strong> Putting dependency checks in the <em>liveness</em> probe means a brief DB blip triggers pointless restarts. Deep checks belong in readiness; liveness should just prove the process responds.</li>`,
        `<li><strong>Closing the server before the LB stops routing.</strong> Flip readiness to not-ready first and wait a moment, or new requests hit a closing server. (In k8s, also mind <code>preStop</code> and grace period.)</li>`,
        `<li><strong>Trying to continue after <code>uncaughtException</code>.</strong> The process state is unknown; limping on risks corrupt data. Log and exit; let the supervisor restart.</li>`,
        `<li><strong>Not making the handler idempotent.</strong> Signals can arrive more than once; without a guard you start shutdown twice.</li>`,
        `<li><strong>Ignoring event-loop lag.</strong> High lag means the loop is blocked (CPU-bound code) — the one metric most specific to Node health, and the one people forget to watch.</li>`,
        `<li><strong>Grace period mismatch.</strong> If your drain timeout exceeds the platform's <code>terminationGracePeriodSeconds</code>, the platform SIGKILLs you mid-drain. Keep your forced-exit shorter than the platform grace period.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Catch SIGTERM (and SIGINT) and run an ordered drain</strong>: readiness→not-ready, <code>server.close()</code>, close DB/Redis/consumers, exit 0.</li>`,
        `<li><strong>Always add an unref'd forced-exit timer</strong> shorter than the platform's grace period.</li>`,
        `<li><strong>Close idle keep-alive connections</strong> so drain can complete; set a sane <code>keepAliveTimeout</code>.</li>`,
        `<li><strong>Separate liveness (cheap, no deps) from readiness (checks deps + reports draining).</strong></li>`,
        `<li><strong>Make the shutdown handler idempotent</strong> and log each step so you can debug slow drains.</li>`,
        `<li><strong>On <code>uncaughtException</code>/<code>unhandledRejection</code>: log and exit</strong>; rely on the supervisor to restart clean.</li>`,
        `<li><strong>Expose metrics (Prometheus/OpenTelemetry) and watch event-loop lag, error rate, latency, memory.</strong> Alert on symptoms users feel.</li>`,
        `<li><strong>Log structured JSON to stdout</strong> (12-factor) and let the platform aggregate; include request IDs for tracing.</li>`,
        `<li><strong>Test shutdown</strong> — send a real SIGTERM under load and confirm in-flight requests complete and connections close.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: What happens when Kubernetes sends your pod SIGTERM, and what should happen?</strong><br>A: By default Node exits immediately, killing in-flight requests. It <em>should</em> catch SIGTERM and drain: flip readiness to not-ready so the LB stops routing, call <code>server.close()</code> to stop accepting new connections while finishing current ones, close DB/Redis/consumers, then exit 0 — with a forced-exit timer (shorter than <code>terminationGracePeriodSeconds</code>) as a safety net.</p></blockquote>`,
        `<blockquote><p><strong>Q: Liveness vs readiness probe — what's the difference?</strong><br>A: Liveness answers "is the process alive or wedged?" — failing it restarts the instance. Readiness answers "should it get traffic right now?" — failing it removes it from the load balancer <em>without</em> restarting. You flip readiness to not-ready on shutdown to drain traffic while the process finishes current work. (Common trap: putting DB checks in liveness, causing restart storms on a DB blip.)</p></blockquote>`,
        `<blockquote><p><strong>Q: Why do you need a forced-exit timeout during shutdown?</strong><br>A: Because <code>server.close()</code> only fires once all in-flight requests finish; a single stuck request (slow upstream, hung query) would block shutdown forever, and the platform would eventually SIGKILL you. An unref'd <code>setTimeout(process.exit, N)</code> guarantees you exit within a bounded time.</p></blockquote>`,
        `<blockquote><p><strong>Q: Should you keep running after an uncaughtException?</strong><br>A: No. After an uncaught exception the process is in an undefined state — continuing risks corrupt data and hidden bugs. Log it, attempt fast cleanup, and exit so the supervisor (PM2/k8s) starts a fresh process. Use uncaughtException as a last-resort log-and-die, not as normal error handling.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why does <code>server.close()</code> sometimes never complete?</strong><br>A: It waits for all open connections to go idle, but idle HTTP keep-alive sockets stay open with no active request, so they never "finish." Use <code>server.closeIdleConnections()</code> (and a <code>keepAliveTimeout</code>) so drain can complete. This surprises a lot of people.</p></blockquote>`,
        `<blockquote><p><strong>Q: What Node-specific metric would you monitor and why?</strong><br>A: Event-loop lag/delay. Because Node runs your code on one thread, rising loop lag means the loop is blocked by synchronous/CPU-bound work — requests are queuing even if CPU looks fine. It's the earliest, most Node-specific signal of the exact failure that worker_threads/clustering exist to avoid. (Alongside standard latency, error rate, and memory.)</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>SIGTERM</strong> = polite stop (catch it); <strong>SIGKILL</strong> = uncatchable; <strong>SIGINT</strong> = Ctrl-C.</li>`,
        `<li>Drain order: readiness→not-ready → <code>server.close()</code> → close DB/Redis/consumers → <code>exit(0)</code>.</li>`,
        `<li><strong>Always</strong> add an unref'd <strong>forced-exit timer</strong>, shorter than the platform grace period.</li>`,
        `<li><code>server.close()</code> can hang on idle keep-alives → <code>closeIdleConnections()</code> + <code>keepAliveTimeout</code>.</li>`,
        `<li><strong>Liveness</strong> = alive? (cheap, restarts) vs <strong>Readiness</strong> = take traffic? (deps + reports draining, no restart).</li>`,
        `<li><code>uncaughtException</code>/<code>unhandledRejection</code> → log and <strong>exit</strong>; let the supervisor restart.</li>`,
        `<li>Monitor <strong>event-loop lag</strong> (Node's canary) + latency, error rate, memory; logs as JSON to stdout.</li>`,
        `<li>Make the handler <strong>idempotent</strong>; test shutdown under real load.</li>`,
        `</ul>`,
      ].join('\n'),
    },
  ],
};
