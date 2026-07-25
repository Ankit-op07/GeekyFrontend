// Chapter 1 — Node.js Fundamentals
// Node.js Backend Kit. Content authored for learners AND interview candidates.
// Figures live in /node-diagrams/ and are referenced via {{fig:ch1-xxx.svg|ALT|CAPTION}}.

module.exports = {
  title: 'Node.js Fundamentals',
  slug: 'node-fundamentals',
  order: 0,
  topics: [
    // ────────────────────────────────────────────────────────────────────
    // Topic 0 — what-is-nodejs
    // ────────────────────────────────────────────────────────────────────
    {
      title: 'What is Node.js?',
      slug: 'what-is-nodejs',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>For most of JavaScript's life, the language could only run in one place: a web browser. If you wanted to build the <em>server</em> behind a website &mdash; the part that talks to a database, checks passwords, sends emails, and returns data &mdash; you had to reach for a different language like PHP, Python, Java, or Ruby. That meant every full-stack developer was really two developers stitched together: one who thought in JavaScript on the front end, and another who thought in some other language on the back end.</p>`,
        `<p><strong>Node.js changed that.</strong> It lets you run JavaScript on a server, on your laptop, in a build pipeline &mdash; anywhere, outside the browser. Suddenly the same language, the same mental model, and often the same code could power both the button a user clicks and the server that answers when they click it. That single shift is why Node.js became the backbone of modern web development: Next.js, the npm ecosystem, most command-line dev tools, serverless functions, and a huge share of production APIs all run on it.</p>`,
        `<p>Understanding what Node.js actually <em>is</em> &mdash; and just as importantly, what it is <em>not</em> &mdash; is the foundation everything else in this kit stands on. Get this right and topics like the event loop, streams, and Express will feel like natural extensions. Get it fuzzy and they will feel like magic. This lesson makes it concrete.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Here is the one-sentence definition worth memorising: <strong>Node.js is a runtime that lets you run JavaScript outside the browser.</strong> That's it. It is not a language, not a framework, and not a library you import. It is a program you install on a machine, and that program can execute <code>.js</code> files.</p>`,
        `<p>An analogy: JavaScript is like a screenplay &mdash; just text with instructions. To turn a screenplay into a performance, you need actors, a stage, lights, and a director. In the browser, Chrome provides all of that. Node.js provides a <em>different</em> stage &mdash; one built for servers instead of web pages. Same screenplay (JavaScript), different theatre (Node instead of Chrome).</p>`,
        `<p>Node.js is built from two big pieces bundled together: <strong>V8</strong>, the same engine that runs JavaScript inside Google Chrome, and <strong>libuv</strong>, a library that handles talking to the operating system &mdash; reading files, listening on the network, and juggling many tasks at once without freezing. Wrapped around those, Node adds a standard library of built-in modules (<code>fs</code>, <code>http</code>, <code>path</code>, and more) so your JavaScript can do server things it could never do in a browser.</p>`,
        `{{fig:ch1-nodejs-runtime-stack.svg|Layered diagram showing your JavaScript on top, then Node APIs and C++ bindings, then V8 and libuv, then the operating system|Node.js is a stack: your code sits on Node's APIs, which sit on V8 and libuv, which talk to the OS.}}`,
        `<p>Notice what this means. When you write <code>node app.js</code> in a terminal, you are handing your file to this whole stack. V8 turns your JavaScript into machine instructions the CPU understands, and libuv arranges for slow things &mdash; disk reads, network calls &mdash; to happen in the background so your program stays responsive.</p>`,
        `<h2>How it works</h2>`,
        `<p>Let's trace what actually happens when Node runs a program, because the details demystify a lot of later topics.</p>`,
        `<p><strong>1. You start the process.</strong> Typing <code>node server.js</code> launches the Node executable and hands it your file. Node sets up the global environment (the <code>process</code> object, <code>console</code>, timers, and so on), then reads your file.</p>`,
        `<p><strong>2. V8 compiles and runs your code.</strong> V8 parses the JavaScript, compiles the frequently-used parts down to fast machine code (this is called Just-In-Time or JIT compilation), and begins executing it line by line on a single main thread.</p>`,
        `<p><strong>3. Slow work is offloaded.</strong> When your code asks to read a file or wait for a network response, Node does not sit and wait. It hands that job to libuv, registers a callback (&ldquo;call me when it's done&rdquo;), and immediately moves on. This is the essence of Node's <em>non-blocking, asynchronous</em> model.</p>`,
        `<p><strong>4. The event loop delivers results.</strong> When the file finishes reading, libuv puts your callback in a queue, and the event loop runs it. Your single main thread never blocked waiting &mdash; it stayed free to handle other requests.</p>`,
        `<p>This is what people mean when they say Node is &ldquo;single-threaded but non-blocking.&rdquo; One thread runs your JavaScript, but heavy waiting is delegated, so one server can juggle thousands of simultaneous connections without spawning a thread per connection. Contrast this with a traditional model:</p>`,
        `<table>`,
        `<thead><tr><th>Aspect</th><th>Traditional thread-per-request server</th><th>Node.js</th></tr></thead>`,
        `<tbody>`,
        `<tr><td>Concurrency model</td><td>One OS thread per request</td><td>One thread + event loop</td></tr>`,
        `<tr><td>Cost of 10,000 idle connections</td><td>10,000 threads (heavy memory)</td><td>One thread, cheap</td></tr>`,
        `<tr><td>Best at</td><td>CPU-heavy work</td><td>I/O-heavy work (APIs, DBs, files)</td></tr>`,
        `<tr><td>Blocking a request</td><td>Ties up one thread</td><td>Can freeze the whole server</td></tr>`,
        `</tbody>`,
        `</table>`,
        `<p>That last row is the trade-off worth remembering: because one thread serves everyone, a slow synchronous operation in Node hurts <em>every</em> user at once, not just one. We will return to this repeatedly.</p>`,
        `<p><strong>What Node is good at.</strong> Node shines when the work is mostly waiting on I/O &mdash; the network, databases, files, other services. That describes the vast majority of web backends: receive a request, ask the database, wait, format the answer, respond. During the &ldquo;wait,&rdquo; Node is free to serve other users. It is <em>less</em> ideal for pure number-crunching (video encoding, cryptographic hashing of huge data, machine-learning math) because that CPU work runs on the one main thread and can block it &mdash; though worker threads and native add-ons exist for exactly those cases.</p>`,
        `{{fig:ch1-nodejs-use-cases.svg|Grid of common Node.js use cases including web APIs, real-time apps, tooling, microservices, server-side rendering, and data glue|Node.js powers APIs, real-time apps, developer tooling, microservices, SSR frameworks, and data pipelines.}}`,
        `<h2>Code examples</h2>`,
        `<p><strong>Example 1 &mdash; the smallest useful Node program.</strong> No browser, no HTML, just JavaScript talking to a terminal.</p>`,
        `<pre><code class="language-javascript">// hello.js
console.log('Hello from Node.js!');
console.log('Running on Node version:', process.version);
console.log('On platform:', process.platform);

// Run it:  node hello.js
// Output (example):
//   Hello from Node.js!
//   Running on Node version: v22.11.0
//   On platform: darwin</code></pre>`,
        `<p>Notice <code>process</code> &mdash; a global object that only exists in Node, never in a browser. It is your window into the running program itself.</p>`,
        `<p><strong>Example 2 &mdash; doing something a browser physically cannot: read a file from disk.</strong></p>`,
        `<pre><code class="language-javascript">// read-file.js
const fs = require('node:fs/promises');

async function main() {
  const text = await fs.readFile('notes.txt', 'utf8');
  console.log('File contents:\\n' + text);
}

main().catch((err) =&gt; {
  console.error('Could not read file:', err.message);
});</code></pre>`,
        `<p>Browser JavaScript is sandboxed and cannot touch your file system for security reasons. Node, running with your permissions on your machine, can &mdash; that power is the whole point of a server runtime.</p>`,
        `<p><strong>Example 3 &mdash; a real web server in a handful of lines.</strong> This is the &ldquo;wow&rdquo; moment for most learners.</p>`,
        `<pre><code class="language-javascript">// server.js
const http = require('node:http');

const server = http.createServer((req, res) =&gt; {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Hello from a Node server', path: req.url }));
});

server.listen(3000, () =&gt; {
  console.log('Server listening on http://localhost:3000');
});</code></pre>`,
        `<p>Run <code>node server.js</code>, open <code>http://localhost:3000</code> in a browser, and you are talking to a server <em>you</em> wrote in JavaScript. No Apache, no Nginx required &mdash; Node <em>is</em> the web server. That single callback runs for every incoming request, on the one main thread, which is why keeping it fast and non-blocking matters.</p>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Thinking Node.js is a programming language.</strong> It is not. The language is JavaScript. Node is the runtime that executes it. In interviews, saying &ldquo;I code in Node&rdquo; is imprecise &mdash; you code in JavaScript and run it on Node.</li>`,
        `<li><strong>Confusing Node.js with a framework like Express.</strong> Express is a library you install <em>on top of</em> Node to make building web servers easier. Node can build a server with zero dependencies (see Example 3). Frameworks are conveniences, not requirements.</li>`,
        `<li><strong>Expecting browser globals to exist.</strong> There is no <code>window</code>, no <code>document</code>, no <code>alert</code>, and no <code>localStorage</code> in Node. Copy-pasting front-end code that touches the DOM into a Node file throws <code>ReferenceError: document is not defined</code>.</li>`,
        `<li><strong>Assuming Node is multi-threaded by default.</strong> Your JavaScript runs on one thread. Firing off a heavy <code>for</code> loop that runs for two seconds freezes the entire server for those two seconds &mdash; every other user waits.</li>`,
        `<li><strong>Believing Node is only for web servers.</strong> A huge portion of Node usage is command-line tooling: bundlers, linters, test runners, and the npm scripts you run every day are all Node programs.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Use the current LTS version</strong> (Long-Term Support &mdash; e.g. Node 20 or 22) for anything real. Even-numbered releases become LTS and get security fixes for years; odd-numbered ones are short-lived and experimental.</li>`,
        `<li><strong>Prefer asynchronous, non-blocking APIs</strong> (<code>fs.promises.readFile</code>) over their synchronous cousins (<code>fs.readFileSync</code>) in server code, so the one thread stays free.</li>`,
        `<li><strong>Reach for the built-in <code>node:</code> prefix</strong> when importing core modules (<code>require('node:fs')</code>). It makes intent explicit and prevents a local package named <code>fs</code> from shadowing the built-in.</li>`,
        `<li><strong>Keep CPU-heavy work off the main thread</strong> &mdash; use worker threads, a queue, or a separate service so one expensive calculation cannot stall every request.</li>`,
        `<li><strong>Learn the standard library before adding dependencies.</strong> Node ships with capable <code>http</code>, <code>fs</code>, <code>path</code>, <code>crypto</code>, and <code>stream</code> modules; many small packages just wrap them.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: &ldquo;What is Node.js in one sentence?&rdquo;</strong><br>A: It is a runtime that executes JavaScript outside the browser, built on Google's V8 engine plus libuv, giving JavaScript access to the file system, network, and operating system. <em>Trap:</em> do not call it a language or a framework &mdash; that signals a shaky mental model.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;Why is Node good for I/O-heavy apps but not CPU-heavy ones?&rdquo;</strong><br>A: I/O (files, network, DB) is offloaded to libuv and doesn't block the main thread, so one thread serves thousands of waiting connections cheaply. CPU work runs <em>on</em> that one thread, so a heavy computation blocks everyone. <em>Trap:</em> interviewers want you to name the single-threaded event loop as the reason.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;Is Node.js single-threaded or multi-threaded?&rdquo;</strong><br>A: Your JavaScript runs on a single main thread, but Node is not single-threaded overall &mdash; libuv maintains a thread pool (default 4) for certain async operations, and you can spawn worker threads. <em>Trap:</em> a flat &ldquo;single-threaded&rdquo; answer is incomplete; mention the thread pool.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;What's the difference between Node.js and a browser like Chrome? They both use V8.&rdquo;</strong><br>A: Both embed V8 to run JavaScript, but they provide different surroundings. Chrome adds the DOM, <code>window</code>, and Web APIs; Node adds the <code>process</code> object and modules for files, networking, and OS access. Same engine, different capabilities.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;Can Node.js replace a web server like Nginx?&rdquo;</strong><br>A: Node can <em>be</em> the HTTP server &mdash; it listens on a port and handles requests directly. In production people often still put Nginx in front for TLS termination, static-file serving, and load balancing, but that's an architecture choice, not a requirement. <em>Trap:</em> don't say Node &ldquo;needs&rdquo; Nginx.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;Give a real reason a company would pick Node.&rdquo;</strong><br>A: One language across front end and back end (shared code, shared hires), a massive npm ecosystem, and excellent throughput on I/O-bound workloads like APIs and real-time features. Great for the common &ldquo;take a request, hit a database, respond&rdquo; shape.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Node.js =</strong> a runtime to run JavaScript outside the browser.</li>`,
        `<li><strong>Built from</strong> V8 (runs the JS) + libuv (async I/O, event loop) + core modules.</li>`,
        `<li><strong>Model:</strong> single main thread, non-blocking, event-driven. Great for I/O, weak for heavy CPU.</li>`,
        `<li><strong>Gives JS:</strong> file system, network, OS, <code>process</code> &mdash; things browsers forbid.</li>`,
        `<li><strong>Not:</strong> a language, not a framework, not multi-threaded by default.</li>`,
        `<li><strong>Run it:</strong> <code>node file.js</code>. Use the LTS version for production.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────────
    // Topic 1 — node-vs-browser
    // ────────────────────────────────────────────────────────────────────
    {
      title: 'Node.js vs the Browser',
      slug: 'node-vs-browser',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>You already know JavaScript from the browser &mdash; buttons, forms, <code>fetch</code>, maybe some React. So a fair question is: if Node runs the same JavaScript, why does so much front-end code break the moment you paste it into a Node file? The answer is that <strong>the language is the same, but the environment around it is completely different.</strong> JavaScript the language gives you variables, functions, loops, objects, and Promises. Everything else &mdash; <code>document</code>, <code>window</code>, <code>fs</code>, <code>process</code> &mdash; is provided by whoever is <em>hosting</em> the language. The browser hosts it one way; Node hosts it another.</p>`,
        `<p>This distinction trips up nearly every developer moving to the back end, and it is a favourite interview probe because it reveals whether you understand that &ldquo;JavaScript&rdquo; and &ldquo;the browser's JavaScript features&rdquo; are two separate things. Once the boundary is clear, whole categories of confusing errors (&ldquo;why is <code>window</code> not defined?&rdquo;, &ldquo;why can't I use <code>localStorage</code> on the server?&rdquo;) simply disappear.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Picture the same actor performing in two theatres. In one theatre (the browser) the set is a living web page: there are lights (the DOM), an audience she can address (the user), and props like cookies and local storage. In the other theatre (Node) the set is a server room: filing cabinets (the file system), phone lines to other buildings (the network), and a control panel for the building itself (<code>process</code>). The actor &mdash; JavaScript &mdash; is identical. The props are not.</p>`,
        `<p>Concretely, both environments share the JavaScript <em>core</em>: syntax, data types, <code>Array</code>/<code>Object</code>/<code>Map</code>, <code>Promise</code>, <code>async/await</code>, <code>JSON</code>, <code>Math</code>, closures, and so on. Where they diverge is the <strong>host objects and APIs</strong> layered on top.</p>`,
        `{{fig:ch1-node-vs-browser.svg|Two side-by-side panels comparing browser JavaScript and Node.js JavaScript across globals, DOM, APIs, sandboxing, and modules|Same JavaScript core, two very different hosts: the browser gives you window and a DOM; Node gives you process and OS access.}}`,
        `<p>The single most useful thing to internalise: <strong>the browser's global object is <code>window</code>; Node's is <code>global</code>.</strong> Modern code can use <code>globalThis</code> to mean &ldquo;whichever global object exists here,&rdquo; which is exactly how you write code that runs in both places.</p>`,
        `<h2>How it works</h2>`,
        `<p>Let's walk the major differences one layer at a time.</p>`,
        `<p><strong>The global object.</strong> In a browser, top-level <code>var</code> declarations and functions attach to <code>window</code>, and you can write <code>window.alert()</code>. In Node, the global object is called <code>global</code>, there is no <code>window</code>, and &mdash; importantly &mdash; variables you declare at the top of a module do <em>not</em> become global properties, because each file is wrapped in its own module scope. Both environments expose <code>globalThis</code> as the portable name.</p>`,
        `<p><strong>The DOM.</strong> The browser has a Document Object Model &mdash; a live tree of HTML elements you manipulate with <code>document.querySelector</code>, event listeners, and so on. Node has <em>none</em> of this. There is no HTML, no <code>document</code>, no <code>getElementById</code>. Node deals in data and I/O, not visual elements. (If you need to parse HTML on the server, you install a library like <code>cheerio</code> that simulates a DOM &mdash; it is not built in.)</p>`,
        `<p><strong>Available APIs.</strong> Here is the crux of the differences:</p>`,
        `<table>`,
        `<thead><tr><th>Capability</th><th>Browser</th><th>Node.js</th></tr></thead>`,
        `<tbody>`,
        `<tr><td>Global object</td><td><code>window</code></td><td><code>global</code></td></tr>`,
        `<tr><td>UI / DOM</td><td><code>document</code>, DOM APIs</td><td>None</td></tr>`,
        `<tr><td>Storage</td><td><code>localStorage</code>, cookies</td><td>Files, databases</td></tr>`,
        `<tr><td>File system</td><td>Forbidden (sandboxed)</td><td><code>fs</code> module</td></tr>`,
        `<tr><td>Networking</td><td><code>fetch</code>, WebSocket, XHR</td><td><code>http</code>, <code>net</code>, and <code>fetch</code> (built in since v18)</td></tr>`,
        `<tr><td>Program info</td><td>None</td><td><code>process</code> (argv, env, cwd)</td></tr>`,
        `<tr><td>Modules</td><td>ES modules only</td><td>CommonJS + ES modules</td></tr>`,
        `<tr><td>Security context</td><td>Sandboxed to the tab</td><td>Full access, runs as you</td></tr>`,
        `</tbody>`,
        `</table>`,
        `<p>Some APIs have been deliberately harmonised over time. Modern Node includes a built-in <code>fetch</code> (since v18), <code>URL</code>, <code>TextEncoder</code>, <code>structuredClone</code>, and Web Streams, precisely so that code and knowledge transfer between the two worlds. But the fundamentals &mdash; DOM vs no DOM, sandbox vs full access &mdash; do not converge, because they reflect what each environment is <em>for</em>.</p>`,
        `<p><strong>Modules: the big historical difference.</strong> Browsers only ever had one native module system: ES modules (<code>import</code>/<code>export</code>). Node predates that standard, so it shipped with <strong>CommonJS</strong> (<code>require()</code> and <code>module.exports</code>) and still supports it everywhere. Today Node supports both: a file is treated as CommonJS by default, or as an ES module if the file ends in <code>.mjs</code> or the nearest <code>package.json</code> has <code>"type": "module"</code>. This is why you will see two different import styles in Node tutorials &mdash; both are valid, and we cover the details in the modules chapter.</p>`,
        `<p><strong>Security.</strong> Browser JavaScript is heavily sandboxed: a web page cannot read arbitrary files off your disk or open raw network sockets, because random websites must not be trusted with that power. Node code, by contrast, runs with the <em>full permissions of the user who launched it</em>. That is the freedom that makes servers possible &mdash; and the responsibility that makes running untrusted code in Node dangerous.</p>`,
        `<h2>Code examples</h2>`,
        `<p><strong>Example 1 &mdash; the same logic, different surroundings.</strong> Core JavaScript is identical; only the environment-specific parts differ.</p>`,
        `<pre><code class="language-javascript">// This pure-JS core works in BOTH the browser and Node:
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map((n) =&gt; n * 2);
const total = doubled.reduce((sum, n) =&gt; sum + n, 0);

// Environment-specific output:
// In the browser you might do:  document.body.textContent = total;
// In Node you do:
console.log('Total:', total); // 30</code></pre>`,
        `<p><strong>Example 2 &mdash; code that only works in Node.</strong> These globals do not exist in a browser.</p>`,
        `<pre><code class="language-javascript">// node-only.js
console.log('Global object has "global"?', typeof global);      // 'object'
console.log('Global object has "window"?', typeof window);      // 'undefined'
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);

// A browser would throw on process/global and succeed on window.</code></pre>`,
        `<p><strong>Example 3 &mdash; writing code that runs in both places.</strong> Use <code>globalThis</code> and feature-detection instead of assuming an environment.</p>`,
        `<pre><code class="language-javascript">// isomorphic.js — safe in browser AND Node
function getEnvironment() {
  if (typeof window !== 'undefined' &amp;&amp; typeof document !== 'undefined') {
    return 'browser';
  }
  if (typeof process !== 'undefined' &amp;&amp; process.versions &amp;&amp; process.versions.node) {
    return 'node';
  }
  return 'unknown';
}

// globalThis points at the correct global object in either world:
globalThis.appName = 'GeekyFrontend';
console.log('Running in:', getEnvironment());</code></pre>`,
        `<p>This pattern is the backbone of &ldquo;isomorphic&rdquo; or &ldquo;universal&rdquo; JavaScript &mdash; code (like a validation function) shared between a React front end and a Node back end.</p>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Using <code>window</code> in Node.</strong> Throws <code>ReferenceError: window is not defined</code>. Reach for <code>globalThis</code> if you truly need the global object, or (better) restructure so you don't.</li>`,
        `<li><strong>Expecting the DOM on the server.</strong> <code>document</code>, <code>localStorage</code>, and <code>alert</code> do not exist in Node. This is the number-one error when moving front-end snippets server-side.</li>`,
        `<li><strong>Assuming top-level variables are global.</strong> In a browser script, <code>var x = 1</code> attaches to <code>window</code>. In a Node module it stays local to that file &mdash; another file cannot see it without an explicit export.</li>`,
        `<li><strong>Mixing <code>require</code> and <code>import</code> carelessly.</strong> A file is either CommonJS or ESM; you cannot freely combine both styles in one file. Know which mode your file is in.</li>`,
        `<li><strong>Forgetting Node now has <code>fetch</code>.</strong> On Node 18+ you no longer need <code>node-fetch</code>; <code>fetch</code> is global &mdash; but only on recent versions, so check your runtime.</li>`,
        `<li><strong>Treating Node like a sandbox.</strong> Node code can delete files and open sockets. Never run code you don't trust; there is no browser sandbox protecting you.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Keep environment-specific code at the edges.</strong> Put DOM code in browser files and <code>fs</code>/<code>process</code> code in server files; keep the shared business logic pure so it runs anywhere.</li>`,
        `<li><strong>Use <code>globalThis</code>, never <code>window</code> or <code>global</code> directly</strong>, when you genuinely need the global object &mdash; it is the portable, standard name.</li>`,
        `<li><strong>Feature-detect instead of environment-guessing</strong> when possible (check <code>typeof document !== 'undefined'</code>) so your code degrades gracefully.</li>`,
        `<li><strong>Pick one module system per project</strong> and be consistent &mdash; set <code>"type": "module"</code> in <code>package.json</code> for ESM, or stay on CommonJS deliberately.</li>`,
        `<li><strong>Remember the security model:</strong> validate and sanitise anything from users before it touches the file system or shell, because Node has real power the browser never granted.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: &ldquo;If Node and the browser both run JavaScript, why does browser code break in Node?&rdquo;</strong><br>A: They share the JavaScript language core but provide different host environments. Browser globals like <code>window</code> and <code>document</code> don't exist in Node, which instead provides <code>process</code>, <code>fs</code>, and networking. The language is the same; the surrounding APIs differ. <em>Trap:</em> saying &ldquo;they use different JavaScript&rdquo; &mdash; they don't; same V8-class engine, same language.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;What is the global object in each?&rdquo;</strong><br>A: <code>window</code> in the browser, <code>global</code> in Node, and <code>globalThis</code> is the standard portable reference that works in both.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;Name three things you can do in Node that you can't in a browser.&rdquo;</strong><br>A: Read/write the file system (<code>fs</code>), open raw TCP servers/sockets (<code>net</code>, <code>http</code>), and inspect/control the running process and OS (<code>process.env</code>, <code>process.argv</code>). All are blocked in the browser sandbox.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;Node vs browser &mdash; how do modules differ?&rdquo;</strong><br>A: Browsers only support ES modules natively. Node supports both CommonJS (<code>require</code>/<code>module.exports</code>, its original system) and ES modules (<code>import</code>/<code>export</code>), chosen by file extension or the <code>package.json</code> <code>"type"</code> field. <em>Trap:</em> claiming Node &ldquo;doesn't support import&rdquo; &mdash; it has for years.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;What does &lsquo;isomorphic&rsquo; or &lsquo;universal&rsquo; JavaScript mean?&rdquo;</strong><br>A: Code written to run in both the browser and Node &mdash; typically shared logic like validation or formatting &mdash; by avoiding environment-specific globals and using <code>globalThis</code> plus feature detection. It's why SSR frameworks like Next.js can run the same components in both places.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;Is browser JavaScript or Node JavaScript more restricted?&rdquo;</strong><br>A: The browser is more restricted &mdash; it sandboxes JavaScript so untrusted web pages can't read your files or your network. Node runs with the launching user's full permissions, which is why it can build servers but also why you must never run untrusted code in it.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Same language core</strong> (syntax, types, Promises); <strong>different host</strong> (globals &amp; APIs).</li>`,
        `<li><strong>Global object:</strong> browser = <code>window</code>, Node = <code>global</code>, portable = <code>globalThis</code>.</li>`,
        `<li><strong>Browser only:</strong> DOM, <code>document</code>, <code>localStorage</code>, cookies, sandboxed.</li>`,
        `<li><strong>Node only:</strong> <code>fs</code>, <code>process</code>, raw networking, full OS access.</li>`,
        `<li><strong>Modules:</strong> browser = ESM only; Node = CommonJS + ESM.</li>`,
        `<li><strong>Isomorphic code:</strong> avoid env globals, use <code>globalThis</code> + feature detection.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────────
    // Topic 2 — v8-and-libuv
    // ────────────────────────────────────────────────────────────────────
    {
      title: 'V8 and libuv: How JavaScript Actually Runs',
      slug: 'v8-and-libuv',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>&ldquo;Node is single-threaded but non-blocking&rdquo; is one of those phrases everyone repeats and few can actually explain. If you can explain it &mdash; naming the two engines under the hood and how they cooperate &mdash; you instantly sound like someone who understands the platform rather than someone who memorised a slogan. More practically, this mechanism is the reason certain code freezes your server, why <code>async/await</code> exists, and why a poorly-placed <code>while</code> loop can take down an entire API for every user at once.</p>`,
        `<p>The two pieces to understand are <strong>V8</strong>, which <em>runs</em> your JavaScript, and <strong>libuv</strong>, which handles all the <em>waiting</em>. Nearly every Node performance question, and a large share of Node interview questions, comes back to how these two divide the labour. This lesson gives you a mental model precise enough to reason about real code.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Think of a busy restaurant with <strong>one</strong> extremely fast waiter (that's V8, running your JavaScript on a single main thread). The waiter takes an order and, crucially, does <em>not</em> stand at the table waiting for the kitchen to cook. He hands the order to the kitchen (that's libuv), immediately goes to serve the next table, and comes back only when the kitchen rings a bell to say a dish is ready. One waiter serves a packed restaurant because he never stands idle waiting &mdash; the slow work happens elsewhere.</p>`,
        `<p><strong>V8</strong> is Google's open-source JavaScript engine, the same one inside Chrome. Its job is to take your JavaScript text, compile it to fast machine code, run it, and manage memory (garbage collection). It maintains the <em>call stack</em> &mdash; the single place where your functions actually execute, one at a time.</p>`,
        `<p><strong>libuv</strong> is a C library that gives Node its superpower: asynchronous, non-blocking I/O. It runs the <em>event loop</em>, talks to the operating system for file and network operations, and maintains a small pool of background threads for work that can't be done asynchronously by the OS. Together, V8 + libuv (plus Node's own C++ glue and JavaScript standard library) <em>are</em> the Node.js runtime.</p>`,
        `{{fig:ch1-v8-libuv-arch.svg|Diagram of V8 on the left compiling and running JS, libuv on the right handling the event loop and thread pool, both feeding one main thread|V8 runs your JavaScript on one thread; libuv handles the waiting. Together they are the Node runtime.}}`,
        `<h2>How it works</h2>`,
        `<p><strong>What V8 does with your code.</strong> When Node loads your file, V8 parses the JavaScript into an internal representation, compiles it to bytecode, and starts executing. A component called <em>Ignition</em> interprets the bytecode; when a function runs often enough (&ldquo;hot&rdquo; code), an optimising compiler called <em>TurboFan</em> recompiles it into highly optimised machine code. V8 also runs the garbage collector, automatically freeing memory your program no longer references, so you rarely manage memory by hand.</p>`,
        `<p><strong>The call stack &mdash; where single-threaded lives.</strong> V8 has exactly one call stack. When you call a function, a frame is pushed on; when it returns, the frame pops off. Because there is one stack, only one piece of JavaScript runs at any instant. This is what &ldquo;single-threaded&rdquo; literally means: one call stack, one thing at a time. If a function on the stack takes two seconds (a giant synchronous loop), the stack is stuck for two seconds and <em>nothing else</em> &mdash; no other request, no timer &mdash; can run. This is called <strong>blocking</strong>, and it is the cardinal sin of Node.</p>`,
        `<p><strong>How the waiting is delegated.</strong> When your JavaScript calls something asynchronous &mdash; <code>fs.readFile</code>, a database query, an HTTP request, a <code>setTimeout</code> &mdash; it does not perform the slow work on the call stack. Instead it hands the request to Node's C++ layer, which asks libuv (and through it, the operating system) to do the work in the background, and registers your callback. The call stack is now free. Your JavaScript keeps running the next lines immediately.</p>`,
        `<p><strong>The event loop.</strong> libuv runs a loop that repeatedly checks: &ldquo;Has any background work finished? Any timers due? Any I/O ready?&rdquo; When something is ready, it places the corresponding callback in a queue. Whenever the call stack is empty, the event loop takes the next callback from the queue and pushes it onto the stack for V8 to run. This hand-off &mdash; background work finishes, callback queued, event loop runs it when the stack clears &mdash; is the heartbeat of Node.</p>`,
        `{{fig:ch1-event-loop-thread-pool.svg|Diagram showing the call stack starting an async task, the thread pool doing slow work, and the event loop moving finished callbacks back to the stack|One thread runs your code; slow work is offloaded to the thread pool; the event loop feeds finished callbacks back when the stack is empty.}}`,
        `<p><strong>The thread pool.</strong> Most network I/O is handled by the OS asynchronously, so it doesn't need extra threads. But some operations can't be done that way &mdash; file-system work, DNS lookups (<code>dns.lookup</code>), and CPU-bound crypto like <code>crypto.pbkdf2</code> or <code>zlib</code> compression. For these, libuv keeps a <strong>thread pool</strong> (4 threads by default, configurable via the <code>UV_THREADPOOL_SIZE</code> environment variable). Your one JavaScript thread offloads such tasks to a pool thread and gets the result via a callback. So Node is single-threaded for <em>your JavaScript</em>, but the runtime as a whole uses several threads.</p>`,
        `<p><strong>Microtasks vs macrotasks.</strong> One subtlety worth knowing: not all callbacks are equal. Promise callbacks (<code>.then</code>, and the continuation after <code>await</code>) go into a <em>microtask</em> queue that is drained completely after each operation and before the next timer or I/O callback. Timers and I/O callbacks are <em>macrotasks</em>. This is why a resolved Promise's <code>.then</code> runs before a <code>setTimeout(fn, 0)</code>.</p>`,
        `<table>`,
        `<thead><tr><th>Piece</th><th>Written in</th><th>Responsibility</th></tr></thead>`,
        `<tbody>`,
        `<tr><td>V8</td><td>C++</td><td>Compile &amp; run JS, call stack, garbage collection</td></tr>`,
        `<tr><td>libuv</td><td>C</td><td>Event loop, async I/O, thread pool, timers</td></tr>`,
        `<tr><td>Node bindings</td><td>C++</td><td>Bridge JS APIs to V8 and libuv</td></tr>`,
        `<tr><td>Standard library</td><td>JavaScript</td><td><code>fs</code>, <code>http</code>, <code>path</code>, etc.</td></tr>`,
        `</tbody>`,
        `</table>`,
        `<h2>Code examples</h2>`,
        `<p><strong>Example 1 &mdash; proving non-blocking behaviour.</strong> The output order reveals the event loop at work.</p>`,
        `<pre><code class="language-javascript">console.log('1: start');

setTimeout(() =&gt; {
  console.log('3: timeout callback (runs later, via event loop)');
}, 0);

Promise.resolve().then(() =&gt; {
  console.log('2b: promise callback (microtask, before timers)');
});

console.log('2: end of synchronous code');

// Output order:
// 1: start
// 2: end of synchronous code
// 2b: promise callback (microtask, before timers)
// 3: timeout callback (runs later, via event loop)</code></pre>`,
        `<p>The synchronous lines run first and empty the stack. Then microtasks (the Promise) drain, and only then the timer callback runs &mdash; even though the timeout was <code>0</code>.</p>`,
        `<p><strong>Example 2 &mdash; blocking the single thread (the anti-pattern).</strong> This is what NOT to do in a server.</p>`,
        `<pre><code class="language-javascript">const http = require('node:http');

http.createServer((req, res) =&gt; {
  if (req.url === '/block') {
    // A synchronous loop hogs the ONE thread — every other
    // request is frozen until this finishes.
    const end = Date.now() + 5000;
    while (Date.now() &lt; end) { /* busy-wait 5 seconds */ }
    res.end('done blocking');
  } else {
    res.end('fast response');
  }
}).listen(3000);

// While /block runs, even /fast requests hang. One slow
// synchronous task punishes every user at once.</code></pre>`,
        `<p><strong>Example 3 &mdash; offloading CPU work to the thread pool.</strong> The async crypto API uses libuv's pool, keeping the main thread free.</p>`,
        `<pre><code class="language-javascript">const crypto = require('node:crypto');

console.log('start hashing (offloaded to thread pool)');

// pbkdf2 is CPU-heavy; the async form runs on a libuv pool thread,
// so the main thread stays responsive to other work.
crypto.pbkdf2('password', 'salt', 200000, 64, 'sha512', (err, key) =&gt; {
  if (err) throw err;
  console.log('hash ready:', key.toString('hex').slice(0, 16) + '...');
});

console.log('this logs BEFORE the hash — main thread was never blocked');</code></pre>`,
        `<p><strong>Example 4 &mdash; seeing the thread pool size.</strong></p>`,
        `<pre><code class="language-javascript">// Default is 4. Increase for I/O-heavy file/crypto workloads:
//   UV_THREADPOOL_SIZE=8 node app.js
console.log('Thread pool size:', process.env.UV_THREADPOOL_SIZE || '4 (default)');</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Saying &ldquo;Node is single-threaded&rdquo; without nuance.</strong> Your JavaScript runs on one thread, but libuv's thread pool (default 4) and V8's own background threads mean the process uses several threads. Precision matters in interviews.</li>`,
        `<li><strong>Blocking the event loop with synchronous work.</strong> Big <code>JSON.parse</code>/<code>stringify</code>, synchronous <code>fs</code> calls, huge loops, or synchronous crypto on the main thread freeze the whole server. Use async variants or worker threads.</li>`,
        `<li><strong>Thinking <code>setTimeout(fn, 0)</code> runs immediately.</strong> It runs after the current synchronous code <em>and</em> after all pending microtasks &mdash; it's &ldquo;as soon as possible on the next loop tick,&rdquo; not instant.</li>`,
        `<li><strong>Assuming Promises and timers share a queue.</strong> Microtasks (Promises) drain fully before the next macrotask (timers, I/O), which is why a <code>.then</code> beats a <code>setTimeout(_, 0)</code>.</li>`,
        `<li><strong>Ignoring the thread-pool bottleneck.</strong> Fire off dozens of file reads or <code>pbkdf2</code> calls and they queue behind just 4 pool threads &mdash; raising <code>UV_THREADPOOL_SIZE</code> can help I/O-bound throughput.</li>`,
        `<li><strong>Confusing V8 with Node.</strong> V8 only runs JavaScript and manages memory; it knows nothing about files or the network. Those come from libuv and Node's modules, not V8.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Keep the event loop free.</strong> Prefer asynchronous APIs; never do multi-second synchronous work on the main thread in a server.</li>`,
        `<li><strong>Move heavy CPU work off-thread</strong> &mdash; use <code>worker_threads</code>, a job queue, or a separate service for encoding, big data crunching, or intense math.</li>`,
        `<li><strong>Break large synchronous tasks into chunks</strong> (e.g. with <code>setImmediate</code>) so the loop can breathe between pieces and still serve requests.</li>`,
        `<li><strong>Tune <code>UV_THREADPOOL_SIZE</code> for I/O-bound file/crypto workloads</strong>, and measure &mdash; don't guess &mdash; before and after.</li>`,
        `<li><strong>Understand microtask ordering</strong> so async control flow is predictable; reach for <code>queueMicrotask</code> or Promises when you need work to run before the next timer tick.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: &ldquo;What are V8 and libuv, and how do they relate?&rdquo;</strong><br>A: V8 is Google's engine that compiles and runs JavaScript and manages the call stack and garbage collection. libuv is a C library that provides the event loop, asynchronous I/O, and a thread pool. Node bundles both: V8 runs your code, libuv handles the waiting. <em>Trap:</em> attributing async I/O to V8 &mdash; that's libuv's job.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;Explain &lsquo;single-threaded but non-blocking.&rsquo;&rdquo;</strong><br>A: Your JavaScript executes on one thread (one V8 call stack), so only one line runs at a time. But slow I/O is delegated to libuv/the OS, so the thread doesn't wait &mdash; it moves on and runs callbacks later via the event loop. One thread, no idle waiting. <em>Trap:</em> forgetting to mention delegation is what makes it non-blocking.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;If it's single-threaded, how does Node do multiple things at once?&rdquo;</strong><br>A: It doesn't run JavaScript in parallel, but it overlaps waiting. While one request waits on the database, the thread serves others. True parallelism for CPU work comes from libuv's thread pool and <code>worker_threads</code>, not from the main JS thread.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;What is the thread pool and what uses it?&rdquo;</strong><br>A: libuv keeps a pool (4 threads by default, set via <code>UV_THREADPOOL_SIZE</code>) for operations that can't be async at the OS level: file-system I/O, <code>dns.lookup</code>, and CPU-bound crypto/zlib. Network sockets mostly use the OS directly and don't consume the pool. <em>Trap:</em> claiming <em>all</em> async work uses the pool.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;Why does a Promise callback run before setTimeout(fn, 0)?&rdquo;</strong><br>A: Promise callbacks are microtasks; the microtask queue is fully drained after the current operation and before the event loop moves on to macrotasks like timers. So the <code>.then</code> runs first even with a zero-delay timer.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;What happens if you run a five-second while-loop in a request handler?&rdquo;</strong><br>A: It blocks the single main thread for five seconds &mdash; the event loop can't run any other callback, so every concurrent request hangs. The fix is to make the work async or offload it to a worker thread. This is the classic &ldquo;don't block the event loop&rdquo; lesson.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>V8:</strong> compiles &amp; runs JS, one call stack, garbage collection. (Also in Chrome.)</li>`,
        `<li><strong>libuv:</strong> event loop + async I/O + thread pool (default 4) + timers.</li>`,
        `<li><strong>Single-threaded</strong> = one call stack, one JS line at a time.</li>`,
        `<li><strong>Non-blocking</strong> = slow I/O delegated, thread never idles.</li>`,
        `<li><strong>Thread pool used by:</strong> file I/O, <code>dns.lookup</code>, crypto/zlib &mdash; not most network sockets.</li>`,
        `<li><strong>Microtasks (Promises) before macrotasks (timers/I/O).</strong></li>`,
        `<li><strong>Never block the loop</strong> &mdash; offload CPU work to <code>worker_threads</code>.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────────
    // Topic 3 — global-process-env
    // ────────────────────────────────────────────────────────────────────
    {
      title: 'The Global Object, process, and Environment',
      slug: 'global-process-env',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Every real Node application needs to answer questions about <em>itself and its surroundings</em>: What arguments did the user pass on the command line? Which database URL should I connect to &mdash; the local one or the production one? What directory am I running in? Am I in development or production mode? How do I shut down cleanly? All of these answers come from one place: the global <code>process</code> object.</p>`,
        `<p><code>process</code> is the single most important global in Node. It is how configuration flows into your app (through environment variables), how command-line tools read their inputs (through <code>process.argv</code>), and how servers manage their own lifecycle (through exit codes and signal handlers). Master <code>process</code> and you can configure, deploy, and operate real services. It also happens to be one of the clearest markers of Node fluency in interviews &mdash; the difference between someone who has run <code>node app.js</code> once and someone who has shipped something.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>In the browser, the global object is <code>window</code> and it represents the browser tab. In Node, the global object is <code>global</code> and it represents the running program. There is <strong>no <code>window</code></strong> in Node &mdash; that's a browser thing. A small set of things are available everywhere without importing them: <code>console</code>, <code>setTimeout</code>, <code>process</code>, <code>Buffer</code>, <code>__dirname</code>, and <code>__filename</code> (the last two only in CommonJS modules). The modern, portable way to refer to the global object itself is <code>globalThis</code>.</p>`,
        `<p>The star of the show is <strong><code>process</code></strong> &mdash; a global object that represents the current running Node process, like a control panel for your program. Through it you read command-line arguments, environment variables, the working directory, the process ID, memory usage, and platform; and you can hook into lifecycle events or exit the program.</p>`,
        `{{fig:ch1-process-object.svg|Diagram of the process object branching into argv, env, and cwd, with a footer listing exit, platform, pid, and memoryUsage|The process object is your program's control panel: argv for arguments, env for config, cwd for location, plus lifecycle controls.}}`,
        `<p>The three you will use constantly: <code>process.argv</code> (command-line arguments), <code>process.env</code> (environment variables &mdash; where configuration and secrets live), and <code>process.cwd()</code> (the directory the process was started from).</p>`,
        `<h2>How it works</h2>`,
        `<p><strong><code>process.argv</code> &mdash; command-line arguments.</strong> This is an array of strings. Its first two elements are always fixed: index 0 is the path to the Node executable, and index 1 is the path to the script being run. Your <em>actual</em> arguments start at index 2. So to read what the user typed, you slice from index 2:</p>`,
        `<table>`,
        `<thead><tr><th>Index</th><th>Value for <code>node app.js hello 42</code></th></tr></thead>`,
        `<tbody>`,
        `<tr><td>0</td><td>/usr/local/bin/node (the Node binary)</td></tr>`,
        `<tr><td>1</td><td>/path/to/app.js (your script)</td></tr>`,
        `<tr><td>2</td><td>hello (your first argument)</td></tr>`,
        `<tr><td>3</td><td>42 (your second argument, as a string)</td></tr>`,
        `</tbody>`,
        `</table>`,
        `<p>Note that everything in <code>argv</code> is a <em>string</em> &mdash; <code>"42"</code>, not the number <code>42</code>. You must convert types yourself.</p>`,
        `<p><strong><code>process.env</code> &mdash; environment variables.</strong> This is a plain object whose keys and values are strings, populated from the environment the process was launched in. It is the standard way to pass <em>configuration</em> into an app without hard-coding it: database URLs, API keys, feature flags, and the all-important <code>NODE_ENV</code> (conventionally <code>"development"</code>, <code>"production"</code>, or <code>"test"</code>). Two rules: every value is a string (so <code>process.env.PORT</code> is <code>"3000"</code>, not <code>3000</code>), and any key you never set reads as <code>undefined</code>. Secrets belong in environment variables, never committed to source code.</p>`,
        `<p><strong><code>process.cwd()</code> vs <code>__dirname</code>.</strong> A subtle but interview-relevant distinction. <code>process.cwd()</code> returns the <em>current working directory</em> &mdash; wherever you were standing in the terminal when you launched Node. <code>__dirname</code> returns the directory of the <em>current file</em>. They are often different: if you're in <code>/home/me</code> and run <code>node ./scripts/build.js</code>, then <code>process.cwd()</code> is <code>/home/me</code> but <code>__dirname</code> is <code>/home/me/scripts</code>. Use <code>__dirname</code> to reliably locate files relative to your code; use <code>cwd()</code> for &ldquo;wherever the user invoked me.&rdquo;</p>`,
        `<p><strong>Lifecycle and signals.</strong> <code>process.exit(code)</code> ends the program immediately with an exit code (0 = success, non-zero = failure). You can listen for events: <code>process.on('exit', ...)</code> for final cleanup, <code>process.on('SIGINT', ...)</code> to catch Ctrl-C for graceful shutdown, and <code>process.on('uncaughtException', ...)</code> as a last resort for unhandled errors. Well-behaved servers use these to finish in-flight requests and close database connections before exiting.</p>`,
        `<p><strong>Other useful <code>process</code> members:</strong> <code>process.version</code> (the Node version), <code>process.platform</code> (<code>'darwin'</code>, <code>'linux'</code>, <code>'win32'</code>), <code>process.pid</code> (the OS process ID), <code>process.memoryUsage()</code> (heap stats), and <code>process.uptime()</code> (seconds running). And <code>global</code> itself lets you attach truly global values &mdash; though you should almost never do that.</p>`,
        `<h2>Code examples</h2>`,
        `<p><strong>Example 1 &mdash; reading command-line arguments.</strong> A tiny greeting CLI.</p>`,
        `<pre><code class="language-javascript">// greet.js
const args = process.argv.slice(2); // drop node path + script path
const name = args[0] || 'world';
const times = Number(args[1]) || 1;  // argv values are strings — convert!

for (let i = 0; i &lt; times; i++) {
  console.log('Hello, ' + name + '!');
}

// Run:  node greet.js Ankit 3
// Output: Hello, Ankit!  (three times)</code></pre>`,
        `<p><strong>Example 2 &mdash; configuration via environment variables.</strong> The backbone of every deployable app.</p>`,
        `<pre><code class="language-javascript">// config.js
const config = {
  port: Number(process.env.PORT) || 3000,        // string -&gt; number, with default
  nodeEnv: process.env.NODE_ENV || 'development',
  dbUrl: process.env.DATABASE_URL,               // required in production
  isProd: process.env.NODE_ENV === 'production',
};

if (config.isProd &amp;&amp; !config.dbUrl) {
  console.error('DATABASE_URL is required in production');
  process.exit(1); // non-zero = failure, stops deploy scripts
}

console.log('Starting in ' + config.nodeEnv + ' on port ' + config.port);

// Run:  PORT=8080 NODE_ENV=production DATABASE_URL=... node config.js</code></pre>`,
        `<p><strong>Example 3 &mdash; inspecting the environment and locating files.</strong></p>`,
        `<pre><code class="language-javascript">// info.js
const path = require('node:path');

console.log('Node version :', process.version);
console.log('Platform     :', process.platform);
console.log('Process ID   :', process.pid);
console.log('Launched from :', process.cwd());
console.log('This file dir :', __dirname);

// Build a path relative to THIS file, not the caller's location:
const dataFile = path.join(__dirname, 'data', 'seed.json');
console.log('Data file    :', dataFile);

const mb = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
console.log('Heap used    :', mb + ' MB');</code></pre>`,
        `<p><strong>Example 4 &mdash; graceful shutdown.</strong> Catch Ctrl-C and clean up.</p>`,
        `<pre><code class="language-javascript">// shutdown.js
console.log('Running... press Ctrl-C to stop. PID:', process.pid);

process.on('SIGINT', () =&gt; {
  console.log('\\nCaught interrupt — closing connections, flushing logs...');
  // ...close DB, finish in-flight requests here...
  process.exit(0); // clean exit
});

setInterval(() =&gt; console.log('still working:', process.uptime().toFixed(0) + 's'), 1000);</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Forgetting to <code>slice(2)</code> on <code>process.argv</code>.</strong> The first two entries are the Node binary and your script path, not user input. Reading <code>argv[0]</code> as an argument is a classic bug.</li>`,
        `<li><strong>Treating <code>process.env</code> values as non-strings.</strong> <code>process.env.PORT</code> is <code>"3000"</code>; <code>process.env.DEBUG</code> is <code>"true"</code> or <code>"false"</code> as strings. <code>"false"</code> is truthy! Convert explicitly with <code>Number()</code> and compare strings deliberately.</li>`,
        `<li><strong>Hard-coding secrets instead of using <code>process.env</code>.</strong> API keys and database passwords committed to source are a security incident waiting to happen. Read them from the environment.</li>`,
        `<li><strong>Confusing <code>process.cwd()</code> with <code>__dirname</code>.</strong> <code>cwd()</code> depends on where the user ran the command; <code>__dirname</code> is fixed to the file. Using <code>cwd()</code> to load a bundled file breaks when invoked from another directory.</li>`,
        `<li><strong>Reaching for <code>window</code>.</strong> It does not exist in Node &mdash; use <code>process</code>, or <code>globalThis</code> for the global object.</li>`,
        `<li><strong>Calling <code>process.exit()</code> too eagerly.</strong> It terminates immediately and can cut off pending writes (like buffered <code>console.log</code> or in-flight I/O). Prefer letting the program end naturally, or set <code>process.exitCode</code> and finish gracefully.</li>`,
        `<li><strong>Polluting <code>global</code>.</strong> Attaching your own values to <code>global</code> creates hidden, hard-to-test coupling. Pass values explicitly instead.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Centralise configuration.</strong> Read all <code>process.env</code> values once into a single <code>config</code> object, validate required ones at startup, and fail fast with <code>process.exit(1)</code> if something critical is missing.</li>`,
        `<li><strong>Always convert and default env values:</strong> <code>Number(process.env.PORT) || 3000</code>. Never trust that a variable is set or is the right type.</li>`,
        `<li><strong>Keep secrets in the environment</strong> (or a secrets manager), and use a <code>.env</code> file locally that is git-ignored &mdash; loaded via a tool or Node's built-in <code>--env-file</code> flag.</li>`,
        `<li><strong>Use <code>__dirname</code> with <code>path.join</code></strong> to locate files bundled with your code, so paths work regardless of the current directory.</li>`,
        `<li><strong>Handle <code>SIGTERM</code> and <code>SIGINT</code> for graceful shutdown</strong> in servers &mdash; close connections and finish requests before exiting so deploys don't drop traffic.</li>`,
        `<li><strong>Prefer <code>globalThis</code> over <code>global</code></strong> when you need the global object, for portability with browser and edge runtimes.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: &ldquo;What is the <code>process</code> object?&rdquo;</strong><br>A: A global object representing the current running Node process. It exposes command-line arguments (<code>argv</code>), environment variables (<code>env</code>), the working directory (<code>cwd()</code>), process info (<code>pid</code>, <code>platform</code>, <code>version</code>, <code>memoryUsage()</code>), and lifecycle controls (<code>exit()</code>, signal events). It's how a program reads its inputs and manages itself.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;What's in <code>process.argv[0]</code> and <code>[1]</code>?&rdquo;</strong><br>A: Index 0 is the path to the Node executable, index 1 is the path to the running script; real arguments start at index 2, so you typically use <code>process.argv.slice(2)</code>. <em>Trap:</em> assuming user args start at index 0.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;How do you pass configuration into a Node app, and why not hard-code it?&rdquo;</strong><br>A: Through environment variables read via <code>process.env</code>. It keeps config and secrets out of source control, lets the same build run differently in dev/staging/prod, and follows twelve-factor principles. <em>Trap:</em> not mentioning that env values are always strings and need conversion.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;Difference between <code>process.cwd()</code> and <code>__dirname</code>?&rdquo;</strong><br>A: <code>process.cwd()</code> is the directory the process was launched from (varies with how it's invoked); <code>__dirname</code> is the directory of the current file (fixed). Use <code>__dirname</code> to locate bundled assets reliably.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;Is there a <code>window</code> object in Node?&rdquo;</strong><br>A: No &mdash; <code>window</code> is a browser global. Node's global object is <code>global</code>, and the portable reference is <code>globalThis</code>. The everyday global you actually use is <code>process</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;How would you implement graceful shutdown?&rdquo;</strong><br>A: Listen for <code>SIGTERM</code>/<code>SIGINT</code> with <code>process.on(...)</code>, then stop accepting new connections, finish in-flight requests, close DB pools, and call <code>process.exit(0)</code> (or let the loop drain). <em>Trap:</em> calling <code>process.exit()</code> immediately, which drops pending work.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Global object:</strong> <code>global</code> in Node (no <code>window</code>); portable = <code>globalThis</code>.</li>`,
        `<li><strong><code>process.argv</code>:</strong> string array; real args at index 2 &mdash; <code>slice(2)</code>.</li>`,
        `<li><strong><code>process.env</code>:</strong> config &amp; secrets; all values are strings; missing = <code>undefined</code>.</li>`,
        `<li><strong><code>process.cwd()</code></strong> = launch dir; <strong><code>__dirname</code></strong> = file's dir.</li>`,
        `<li><strong>Lifecycle:</strong> <code>process.exit(code)</code>, <code>process.on('SIGINT'/'SIGTERM'/'exit')</code>.</li>`,
        `<li><strong>Info:</strong> <code>process.version</code>, <code>.platform</code>, <code>.pid</code>, <code>.memoryUsage()</code>.</li>`,
        `<li><strong>Rule:</strong> convert env values, never hard-code secrets, don't pollute <code>global</code>.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────────
    // Topic 4 — running-node-repl
    // ────────────────────────────────────────────────────────────────────
    {
      title: 'Running Node: Scripts, the REPL, the CLI, and nvm',
      slug: 'running-node-repl',
      order: 4,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Knowing the concepts is one thing; actually <em>running</em> Node fluently is what makes you productive day to day. There is a real difference between a developer who only knows <code>node app.js</code> and one who reaches for the REPL to test an idea in two seconds, uses <code>node -e</code> in a shell script, keeps the right Node version per project with nvm, and knows the CLI flags that turn a manual dev loop into an automatic one. These are small skills, but together they are the difference between fighting your tools and flowing with them.</p>`,
        `<p>They also come up constantly in interviews and on the job: &ldquo;How do you check your Node version?&rdquo;, &ldquo;How would you quickly test whether this snippet works?&rdquo;, &ldquo;How do you run different Node versions for different projects?&rdquo; This lesson gives you a confident answer to all of them and a mental map of the ways Node executes code.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>There are three everyday ways to run JavaScript with Node, and it helps to picture them as three doors into the same runtime.</p>`,
        `<p><strong>1. Run a file:</strong> <code>node app.js</code> executes a whole script from top to bottom. This is how you run real programs and servers &mdash; the everyday default.</p>`,
        `<p><strong>2. The REPL:</strong> type <code>node</code> with no file and you drop into an interactive prompt (Read&ndash;Eval&ndash;Print Loop). You type an expression, press Enter, and Node immediately evaluates it and prints the result &mdash; perfect for experimenting, checking how an API behaves, or doing quick calculations.</p>`,
        `<p><strong>3. Inline evaluation:</strong> <code>node -e "code"</code> runs a single snippet passed as a string, straight from the command line &mdash; handy inside shell scripts and one-off checks.</p>`,
        `{{fig:ch1-node-execution-modes.svg|Three panels showing node app.js to run a file, node for the interactive REPL, and node -e for inline evaluation|Three doors into the runtime: run a file, open the interactive REPL, or evaluate a one-line snippet inline.}}`,
        `<p>On top of <em>how</em> you run Node sits <em>which version</em> of Node you run. Because projects target different Node versions, a tool called <strong>nvm</strong> (Node Version Manager) lets you install several versions side by side and switch between them per project &mdash; so an old client project on Node 18 and a new one on Node 22 can coexist on one machine.</p>`,
        `<h2>How it works</h2>`,
        `<p><strong>Running a file.</strong> <code>node path/to/file.js</code> starts a process, loads the file, runs it, and &mdash; importantly &mdash; keeps the process alive as long as there is pending asynchronous work (an open server, a timer, a pending Promise). A plain script with no async work exits as soon as the last line runs. This is why a web server &ldquo;stays running&rdquo;: <code>server.listen()</code> keeps the event loop busy. You can pass arguments after the filename (<code>node app.js --port 8080</code>), and read them via <code>process.argv</code>.</p>`,
        `<p><strong>The REPL in depth.</strong> Start it with <code>node</code>. Each line you type is evaluated and its result printed. Useful REPL features:</p>`,
        `<ul>`,
        `<li><code>_</code> holds the value of the last evaluated expression (like a calculator's answer memory).</li>`,
        `<li>Tab completion works &mdash; type <code>process.</code> and press Tab to see available properties.</li>`,
        `<li>Multi-line input is supported: an unfinished statement (an open brace or bracket) shows a <code>...</code> continuation prompt.</li>`,
        `<li>Dot commands start with a period: <code>.help</code>, <code>.exit</code> (or Ctrl-D) to quit, <code>.clear</code> to reset the context, <code>.load file.js</code> and <code>.save file.js</code>.</li>`,
        `<li>Core modules are pre-loaded lazily &mdash; you can just type <code>os.platform()</code> without requiring <code>os</code> first.</li>`,
        `</ul>`,
        `<p>The REPL is the fastest way to answer &ldquo;what does this actually return?&rdquo; without creating a file.</p>`,
        `<p><strong>Handy CLI flags.</strong> The <code>node</code> command has flags worth knowing:</p>`,
        `<table>`,
        `<thead><tr><th>Command / flag</th><th>What it does</th></tr></thead>`,
        `<tbody>`,
        `<tr><td><code>node app.js</code></td><td>Run a script file</td></tr>`,
        `<tr><td><code>node</code></td><td>Start the interactive REPL</td></tr>`,
        `<tr><td><code>node -e "expr"</code></td><td>Evaluate a snippet inline</td></tr>`,
        `<tr><td><code>node -p "expr"</code></td><td>Evaluate <em>and print</em> the result</td></tr>`,
        `<tr><td><code>node --version</code> / <code>-v</code></td><td>Print the Node version</td></tr>`,
        `<tr><td><code>node --watch app.js</code></td><td>Re-run automatically when files change (built in, v18.11+)</td></tr>`,
        `<tr><td><code>node --env-file=.env app.js</code></td><td>Load env vars from a file (built in, v20.6+)</td></tr>`,
        `<tr><td><code>node --check app.js</code></td><td>Syntax-check without running</td></tr>`,
        `<tr><td><code>node --inspect app.js</code></td><td>Enable the debugger (Chrome DevTools)</td></tr>`,
        `</tbody>`,
        `</table>`,
        `<p><code>--watch</code> and <code>--env-file</code> are especially nice: modern Node can auto-restart on save and read a <code>.env</code> file without extra packages like <code>nodemon</code> or <code>dotenv</code> for simple cases.</p>`,
        `<p><strong>nvm basics.</strong> Node versions matter because language features, performance, and security fixes differ between them, and each project may pin a version. nvm (on macOS/Linux; nvm-windows or alternatives like <code>fnm</code>/<code>Volta</code> elsewhere) manages this. The core commands:</p>`,
        `<table>`,
        `<thead><tr><th>Command</th><th>Meaning</th></tr></thead>`,
        `<tbody>`,
        `<tr><td><code>nvm install 22</code></td><td>Install Node 22 (latest of that major)</td></tr>`,
        `<tr><td><code>nvm install --lts</code></td><td>Install the latest LTS release</td></tr>`,
        `<tr><td><code>nvm use 20</code></td><td>Switch the current shell to Node 20</td></tr>`,
        `<tr><td><code>nvm ls</code></td><td>List installed versions</td></tr>`,
        `<tr><td><code>nvm alias default 22</code></td><td>Set the default version for new shells</td></tr>`,
        `</tbody>`,
        `</table>`,
        `{{fig:ch1-nvm-versions.svg|Diagram showing nvm at the top feeding three projects each pinned to a different Node version: 20, 22, and 18|nvm installs multiple Node versions side by side so each project can use the version it was built for.}}`,
        `<p>A common workflow: put an <code>.nvmrc</code> file containing a version (e.g. <code>22</code>) in a project, and <code>nvm use</code> reads it automatically &mdash; so everyone on the team runs the same Node. Under the hood, LTS versions are the ones to prefer: even-numbered majors (18, 20, 22) get long-term support and security patches; odd ones are experimental and short-lived.</p>`,
        `<h2>Code examples</h2>`,
        `<p><strong>Example 1 &mdash; a REPL session.</strong> Everything after <code>&gt;</code> is what you type.</p>`,
        `<pre><code class="language-javascript">$ node
Welcome to Node.js v22.11.0.
&gt; 2 + 2
4
&gt; _ * 10          // _ is the last result
40
&gt; const os = require('node:os');
undefined
&gt; os.platform()
'darwin'
&gt; [1, 2, 3].map(n =&gt; n * n)
[ 1, 4, 9 ]
&gt; .exit           // or press Ctrl-D</code></pre>`,
        `<p><strong>Example 2 &mdash; inline evaluation for quick answers and scripts.</strong></p>`,
        `<pre><code class="language-javascript"># -e runs code; -p runs AND prints the result:
$ node -p "process.version"
v22.11.0

$ node -p "Math.max(3, 7, 2)"
7

# Useful inside shell scripts / CI:
$ node -e "console.log('Build at', new Date().toISOString())"</code></pre>`,
        `<p><strong>Example 3 &mdash; running a file with the modern dev flags.</strong></p>`,
        `<pre><code class="language-javascript">// server.js
const http = require('node:http');
const port = Number(process.env.PORT) || 3000;

http.createServer((req, res) =&gt; res.end('ok'))
  .listen(port, () =&gt; console.log('listening on ' + port));

// Auto-restart on save + load env from a file — no extra packages:
//   node --watch --env-file=.env server.js
// The process stays alive because server.listen keeps the loop busy.</code></pre>`,
        `<p><strong>Example 4 &mdash; checking and switching versions.</strong></p>`,
        `<pre><code class="language-javascript"># Which Node am I running?
$ node -v
v22.11.0

# Install and pin the LTS for a project:
$ nvm install --lts
$ echo "22" &gt; .nvmrc
$ nvm use
Now using node v22.11.0 (npm v10.x)</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Expecting a plain script to &ldquo;stay running.&rdquo;</strong> Node exits when there's no pending async work. A script only keeps running if something (a server, an interval) holds the event loop open.</li>`,
        `<li><strong>Confusing <code>-e</code> and <code>-p</code>.</strong> <code>node -e</code> runs code but prints nothing unless you <code>console.log</code>; <code>node -p</code> runs it <em>and</em> prints the returned value. Reaching for <code>-e</code> when you wanted the result is a common slip.</li>`,
        `<li><strong>Treating REPL results as if they came from your program.</strong> REPL variables and state vanish when you exit &mdash; it's a scratchpad, not persistence. Also, a statement like <code>const x = 5</code> shows <code>undefined</code> (the statement's value), which confuses beginners.</li>`,
        `<li><strong>Version drift across a team.</strong> Without an <code>.nvmrc</code> or pinned version, teammates run different Node versions and hit &ldquo;works on my machine&rdquo; bugs. Pin it.</li>`,
        `<li><strong>Installing global packages under the wrong Node version.</strong> With nvm, global installs are per-version &mdash; switch versions and your globally-installed CLI may &ldquo;disappear&rdquo; because it lives under the other version.</li>`,
        `<li><strong>Using odd-numbered Node versions in production.</strong> Odd majors (19, 21, 23) are short-lived and don't get long-term support; stick to LTS (even) majors for anything real.</li>`,
        `<li><strong>Reaching for <code>nodemon</code> when <code>--watch</code> exists.</strong> Modern Node restarts on file change natively; you often don't need an extra dependency for simple cases.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Use the REPL to learn APIs fast</strong> &mdash; when unsure what a method returns, type it into <code>node</code> rather than guessing or writing a throwaway file.</li>`,
        `<li><strong>Pin your Node version per project</strong> with an <code>.nvmrc</code> (and an <code>engines</code> field in <code>package.json</code>) so everyone, including CI, runs the same version.</li>`,
        `<li><strong>Prefer LTS versions</strong> (even-numbered majors) for production; upgrade deliberately when an LTS line reaches end of life.</li>`,
        `<li><strong>Lean on built-in flags before adding tools:</strong> <code>--watch</code> for auto-restart, <code>--env-file</code> for env loading, <code>--inspect</code> for debugging &mdash; fewer dependencies, less to break.</li>`,
        `<li><strong>Put run commands in <code>package.json</code> scripts</strong> (<code>npm run dev</code>) so the exact flags are documented and shared, not re-typed from memory.</li>`,
        `<li><strong>Know how to exit the REPL</strong> (<code>.exit</code> or Ctrl-D, twice-Ctrl-C) so you're never stuck &mdash; a small thing that saves real friction.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: &ldquo;What is the Node REPL and when would you use it?&rdquo;</strong><br>A: REPL = Read&ndash;Eval&ndash;Print Loop, an interactive prompt started by running <code>node</code> with no file. You type expressions and see results immediately &mdash; ideal for testing snippets, exploring an API, or quick calculations without creating a file. <code>_</code> holds the last result. <em>Trap:</em> not knowing what the acronym stands for.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;How do you run a one-off JavaScript snippet without a file?&rdquo;</strong><br>A: <code>node -e "code"</code> to execute it, or <code>node -p "code"</code> to execute and print the result. Great for shell scripts and CI checks.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;How do you run different Node versions on the same machine?&rdquo;</strong><br>A: A version manager like nvm (or fnm/Volta). Install versions with <code>nvm install</code>, switch with <code>nvm use</code>, and pin per-project with an <code>.nvmrc</code> file so the team stays consistent. <em>Trap:</em> suggesting you reinstall Node each time &mdash; the point is coexistence.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;Why does a Node web server keep running while a plain script exits?&rdquo;</strong><br>A: Node exits when the event loop has no more work. A server calls <code>listen()</code>, which keeps a handle open and the loop alive; a plain synchronous script finishes its last line with nothing pending, so the process ends.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;What's the difference between LTS and Current Node releases?&rdquo;</strong><br>A: Even-numbered majors become LTS (Long-Term Support) with ~30 months of maintenance and security fixes &mdash; use these in production. Odd-numbered &lsquo;Current&rsquo; releases are short-lived and carry the newest experimental features. <em>Trap:</em> recommending a bleeding-edge odd version for production.</p></blockquote>`,
        `<blockquote><p><strong>Q: &ldquo;How would you auto-restart a Node app during development without extra packages?&rdquo;</strong><br>A: Use the built-in <code>node --watch app.js</code> (Node 18.11+), which restarts on file changes &mdash; historically people used <code>nodemon</code>, but it's now built in. Pair with <code>--env-file</code> to load a <code>.env</code> without <code>dotenv</code>.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Run a file:</strong> <code>node app.js</code> (stays alive while async work is pending).</li>`,
        `<li><strong>REPL:</strong> <code>node</code> &rarr; interactive; <code>_</code> = last result; <code>.exit</code> / Ctrl-D to quit.</li>`,
        `<li><strong>Inline:</strong> <code>node -e "code"</code> runs; <code>node -p "code"</code> runs and prints.</li>`,
        `<li><strong>Version:</strong> <code>node -v</code>. <strong>Dev flags:</strong> <code>--watch</code>, <code>--env-file</code>, <code>--inspect</code>, <code>--check</code>.</li>`,
        `<li><strong>nvm:</strong> <code>install</code>, <code>use</code>, <code>ls</code>; pin with <code>.nvmrc</code> + <code>engines</code>.</li>`,
        `<li><strong>Versions:</strong> even = LTS (use in prod); odd = short-lived/experimental.</li>`,
        `</ul>`,
      ].join('\n'),
    },
  ],
};
