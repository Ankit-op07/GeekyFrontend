// Chapter 3 — Modules & npm  (Node.js Backend Kit)
// Content module: consumed by the Learn reader seeding pipeline.
// Each topic.content is an ARRAY of HTML strings joined with '\n'.

module.exports = {
  title: 'Modules & npm',
  slug: 'modules-npm',
  order: 2,
  topics: [
    // ────────────────────────────────────────────────────────────────
    // 0. commonjs-modules
    // ────────────────────────────────────────────────────────────────
    {
      title: 'CommonJS Modules',
      slug: 'commonjs-modules',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Every non-trivial Node program is split across many files, and CommonJS (CJS) is the mechanism that has glued those files together since Node's first release in 2009. When you type <code>require('express')</code> or <code>module.exports = router</code>, you are using CommonJS. Even in 2025, with ES Modules fully supported, the overwhelming majority of packages on npm still ship CommonJS, and the default for a <code>.js</code> file with no <code>"type"</code> declaration is still CommonJS. If you cannot explain what <code>require</code>, <code>module.exports</code>, and <code>exports</code> actually do, you will hit bugs that feel like magic: a value that is mysteriously <code>undefined</code>, a module that runs twice, or a circular dependency that returns half an object.</p>`,
        `<p>CommonJS is also a favourite interview topic precisely because it looks trivial but hides real machinery: a wrapper function, a resolution algorithm, and a cache. Understanding it separates people who copy-paste <code>require</code> lines from people who can debug a production module-loading problem at 2 a.m.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>A CommonJS module is just a file. Each file gets its own private scope — variables you declare at the top level of a file are <em>not</em> global, they belong to that file. To share something with other files, you attach it to a special object called <code>module.exports</code>. To pull in what another file shared, you call <code>require('./that-file')</code>, which returns whatever that file assigned to its <code>module.exports</code>.</p>`,
        `<p>Two directions, two keywords:</p>`,
        `<ul>
          <li><strong>Export</strong> — <code>module.exports = something</code> (or <code>exports.name = something</code>) publishes a value.</li>
          <li><strong>Import</strong> — <code>const x = require('./file')</code> reads that published value synchronously.</li>
        </ul>`,
        `<p>The reason each file has a private scope is not a language feature of JavaScript — it is a trick Node plays. Before running your file, Node wraps its source in a function. That single fact explains almost everything surprising about CommonJS.</p>`,
        `{{fig:ch3-module-wrapper.svg|Diagram showing a user file being wrapped in a function with five parameters|Node wraps every module's source in a function before executing it, which is why top-level variables stay private and why exports, require, module, __filename and __dirname are magically available.}}`,

        `<h2>How it works</h2>`,
        `<p><strong>The module wrapper.</strong> Node never runs your file's source directly. It concatenates it into a function that looks exactly like this:</p>`,
        `<pre><code class="language-javascript">(function (exports, require, module, __filename, __dirname) {
  // ... your file's code goes here ...
});</code></pre>`,
        `<p>Node then calls that function with the five arguments. This is why <code>require</code>, <code>module</code>, <code>exports</code>, <code>__filename</code>, and <code>__dirname</code> appear "out of nowhere" in every file — they are ordinary function parameters, not globals. It is also why a <code>const</code> declared at the top of a file does not leak: it is a local variable inside that wrapper function. You can even see the template at <code>require('module').wrapper</code> in older versions, or inspect <code>arguments.length === 5</code> at the top of any module.</p>`,
        `<p><strong>module.exports vs exports.</strong> When the wrapper runs, Node sets up <code>module.exports = {}</code> and then does <code>exports = module.exports</code>. So <code>exports</code> starts as a reference to the same empty object. Mutating that object works for both: <code>exports.add = ...</code> and <code>module.exports.add = ...</code> touch the same object. But <em>reassigning</em> <code>exports = someNewThing</code> only rebinds the local parameter — it no longer points at <code>module.exports</code>, so nothing is exported. The value that is actually returned to the caller is always <code>module.exports</code>. Rule of thumb: to export one thing (a class, a function), write <code>module.exports = X</code>; to export several named things, attach them with <code>exports.name = ...</code> or <code>module.exports.name = ...</code>.</p>`,
        `<p><strong>The resolution + cache flow.</strong> When you call <code>require(spec)</code>, Node runs the module resolution algorithm to turn <code>spec</code> into a single absolute file path (covered in depth in the module-resolution topic). It then checks <code>require.cache</code>, an object keyed by that resolved absolute path. If an entry exists, Node returns its <code>.exports</code> immediately — the file is <strong>not</strong> re-run. If there is no entry, Node creates a new <code>Module</code> object, stores it in the cache <em>before</em> executing (this is what lets circular dependencies terminate), wraps and runs the file, and finally returns <code>module.exports</code>.</p>`,
        `{{fig:ch3-require-cache.svg|Flow diagram showing require checking the cache keyed by resolved path, running the file once on a miss and returning cached exports on a hit|The first require of a path runs the file and stores its exports; every later require of the same resolved path returns the cached object without re-running the module — modules are effectively singletons.}}`,
        `<p><strong>Caching means modules are singletons.</strong> Because the cache is keyed by resolved path, requiring the same module ten times from ten files gives every file the exact same object. This is how a database connection or a config object is shared across an app. The side effect of a module's top-level code runs exactly once per process. If you truly need a fresh evaluation you must delete the cache entry (<code>delete require.cache[require.resolve('./x')]</code>) — a hack used in test tooling and hot-reloaders, almost never in application code.</p>`,
        `<p><strong>__dirname and __filename.</strong> <code>__filename</code> is the absolute path of the current file; <code>__dirname</code> is the directory containing it. Both are computed by Node per file and injected via the wrapper. They are essential for building paths that work regardless of the process's current working directory — always prefer <code>path.join(__dirname, 'data.json')</code> over a bare relative string, because <code>fs</code> resolves bare relative paths against <code>process.cwd()</code>, not against the file.</p>`,
        `<p><strong>require is synchronous.</strong> <code>require</code> reads and executes the target file on the spot, blocking until it returns. That is acceptable because it happens at startup, but it is also why <code>require</code> cannot load ES Modules (which may need asynchronous, top-level <code>await</code>) in older Node versions — bridging the two worlds needs the async <code>import()</code> instead.</p>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. Exporting several named values.</strong></p>`,
        `<pre><code class="language-javascript">// math.js
function add(a, b) { return a + b; }
function sub(a, b) { return a - b; }

exports.add = add;          // same as module.exports.add
module.exports.sub = sub;   // both attach to the one exports object

// app.js
const math = require('./math');
console.log(math.add(2, 3)); // 5
const { sub } = require('./math'); // destructure named exports
console.log(sub(9, 4));      // 5</code></pre>`,
        `<p><strong>2. Exporting a single thing (the classic gotcha).</strong></p>`,
        `<pre><code class="language-javascript">// logger.js  — WRONG
exports = function log(msg) { console.log(msg); };
// reassigns the local 'exports' param; module.exports is still {}

// logger.js  — RIGHT
module.exports = function log(msg) { console.log(msg); };

// app.js
const log = require('./logger');
log('hello'); // works only with the RIGHT version</code></pre>`,
        `<p><strong>3. The cache makes modules singletons.</strong></p>`,
        `<pre><code class="language-javascript">// counter.js
let count = 0;
module.exports = {
  inc() { return ++count; },
  get() { return count; },
};

// a.js
const c = require('./counter');
c.inc(); c.inc();

// b.js
const c = require('./counter');
console.log(c.get()); // 2 — same instance as a.js, count is shared</code></pre>`,
        `<p><strong>4. Reading a file next to the module, safely.</strong></p>`,
        `<pre><code class="language-javascript">const fs = require('node:fs');
const path = require('node:path');

// Robust: resolves against THIS file, not the process cwd.
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
module.exports = config;</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>
          <li><strong>Reassigning <code>exports</code>.</strong> <code>exports = fn</code> silently exports nothing. Only <code>module.exports = fn</code> works for single-value exports.</li>
          <li><strong>Expecting a fresh module each require.</strong> The cache returns the same object; top-level side effects run once. Do not put per-request state at module scope.</li>
          <li><strong>Assuming top-level <code>const</code> is global.</strong> It is scoped to the file's wrapper — that is by design, and it is why one file cannot see another file's locals.</li>
          <li><strong>Bare relative paths in <code>fs</code>.</strong> <code>fs.readFileSync('config.json')</code> resolves against <code>process.cwd()</code>, so it breaks when the app is started from another directory. Use <code>__dirname</code>.</li>
          <li><strong>Circular dependencies returning a partial object.</strong> If A requires B while B is still requiring A, B receives A's <em>incomplete</em> <code>module.exports</code> (whatever was assigned so far). Move the <code>require</code> below the code that finishes populating exports, or restructure.</li>
          <li><strong>Mutating another module's exports object.</strong> Because it is a shared singleton, changing a property leaks to every other requirer. Treat imported objects as read-only.</li>
          <li><strong>Requiring inside a hot loop.</strong> After the first call it is a cache lookup, but it still costs a resolution hash and clutters code — require at the top of the file.</li>
        </ul>`,

        `<h2>Best practices</h2>`,
        `<ul>
          <li>Put all <code>require</code> calls at the top of the file so dependencies are obvious and load order is predictable.</li>
          <li>Prefer <code>module.exports = { a, b, c }</code> (one object literal) over many <code>exports.x =</code> lines — it reads as a clear public API and avoids the <code>exports</code>-reassignment trap.</li>
          <li>Use the <code>node:</code> prefix for builtins (<code>require('node:fs')</code>) so it is unambiguous a core module is meant and never shadowed by a package named <code>fs</code>.</li>
          <li>Keep top-level module code cheap and side-effect-light; heavy work (opening connections) should be a function you call, so the cost is explicit.</li>
          <li>Always build filesystem paths with <code>path.join(__dirname, ...)</code>.</li>
          <li>Avoid <code>delete require.cache[...]</code> in application code — it is a testing/tooling hack that leads to memory leaks and duplicate singletons.</li>
          <li>Break circular dependencies by extracting the shared piece into a third module both can require.</li>
        </ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: What is the module wrapper function and why does it exist?</strong> Node wraps each file's source in <code>(function (exports, require, module, __filename, __dirname) { ... })</code> and calls it. It gives every file a private scope (top-level vars are locals, not globals) and injects the five module-scoped identifiers as parameters. This is why <code>require</code> and <code>__dirname</code> "just exist" without being imported.</p></blockquote>`,
        `<blockquote><p><strong>Q: Difference between <code>module.exports</code> and <code>exports</code>?</strong> They start pointing at the same object (<code>exports = module.exports = {}</code>). Mutating properties on either works. But only <code>module.exports</code> is returned to the caller, so reassigning <code>exports</code> to a new value breaks the export while reassigning <code>module.exports</code> works. Trap: interviewers show <code>exports = function(){}</code> and ask what the caller receives — answer: an empty object <code>{}</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: Is <code>require</code> synchronous or asynchronous, and where is the result stored?</strong> Synchronous — it reads and executes the file immediately, blocking. Results are cached in <code>require.cache</code>, keyed by the module's resolved absolute path, so the file runs at most once per process.</p></blockquote>`,
        `<blockquote><p><strong>Q: What happens with a circular dependency in CommonJS?</strong> Node stores the module in the cache <em>before</em> executing it. If A→B→A, the second require of A returns A's partially-built exports (whatever existed at that moment), not a crash and not the finished object. This can yield <code>undefined</code> for members assigned later. Fix by reordering requires or extracting shared code.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you make a module NOT be a singleton?</strong> You can't cleanly — the cache guarantees a singleton per resolved path. Options: export a factory function callers invoke to get fresh instances, or (hack) delete the cache entry. The idiomatic answer is "export a factory."</p></blockquote>`,
        `<blockquote><p><strong>Q: Why is <code>path.join(__dirname, 'x.json')</code> safer than <code>'./x.json'</code> for <code>fs</code>?</strong> <code>fs</code> resolves relative paths against <code>process.cwd()</code> (where <code>node</code> was launched), not the file's location. <code>__dirname</code> is always the file's own directory, so the path is correct no matter where the process started.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>
          <li><strong>Wrapper:</strong> <code>(exports, require, module, __filename, __dirname) =&gt; {}</code> — private scope + injected identifiers.</li>
          <li><strong>Export one:</strong> <code>module.exports = X</code>. <strong>Export many:</strong> <code>exports.a = ...</code>.</li>
          <li><strong>Never</strong> <code>exports = X</code> — rebinds the param, exports nothing.</li>
          <li><strong>require</strong> is synchronous; result cached in <code>require.cache</code> by resolved absolute path.</li>
          <li><strong>Modules are singletons</strong> — top-level code runs once per process.</li>
          <li><strong>Circular dep</strong> → partial exports, not a crash (cached before execution).</li>
          <li><strong>__dirname</strong> = file's dir, <strong>__filename</strong> = file's path; use <code>path.join(__dirname, ...)</code>.</li>
          <li>Prefix builtins: <code>require('node:fs')</code>.</li>
        </ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // 1. es-modules
    // ────────────────────────────────────────────────────────────────
    {
      title: 'ES Modules',
      slug: 'es-modules',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>ES Modules (ESM) are the official, standardized module system of JavaScript — the same <code>import</code> and <code>export</code> syntax that runs in browsers. For years Node had only CommonJS; today Node fully supports ESM, and a large and growing slice of the ecosystem is ESM-only or dual-published. If you are writing new backend code, publishing a library, or sharing code between a Node server and a browser bundle, you need to be fluent in ESM. Just as importantly, the boundary between ESM and CommonJS is where a huge number of real-world errors live — <code>ERR_REQUIRE_ESM</code>, <code>Cannot use import statement outside a module</code>, <code>__dirname is not defined</code>. Understanding both systems and how they interoperate is what makes those errors instantly diagnosable instead of terrifying.</p>`,
        `<p>ESM is not just "new syntax for the same thing." It changes <em>when</em> dependencies are resolved (statically, before execution), <em>how</em> bindings behave (live, not copied), and <em>what</em> is available (top-level <code>await</code>, but no <code>__dirname</code>). Those differences have practical consequences the moment you switch.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>Instead of <code>require</code>/<code>module.exports</code>, ESM uses declarative <code>import</code> and <code>export</code> statements:</p>`,
        `<pre><code class="language-javascript">// math.mjs
export function add(a, b) { return a + b; }
export const PI = 3.14159;
export default function multiply(a, b) { return a * b; }

// app.mjs
import multiply, { add, PI } from './math.mjs';</code></pre>`,
        `<p>The key mental shift: <code>import</code>/<code>export</code> are not function calls that run line by line — they are <em>static declarations</em> that the engine reads before any code executes. Node parses the whole dependency graph first, links it, and only then runs module bodies. That is why <code>import</code> must appear at the top level (not inside an <code>if</code>) and why the specifier must be a string literal, not a computed expression. For genuinely dynamic loading, ESM offers <code>await import(expr)</code>, which is an async function returning a promise.</p>`,
        `{{fig:ch3-esm-vs-cjs.svg|Side-by-side comparison table of CommonJS and ES Modules covering file types, loading, exports, timing, bindings and top-level await|CommonJS and ES Modules differ in more than syntax: loading model (sync vs async), binding semantics (copied values vs live references), and available globals all change when you switch.}}`,

        `<h2>How it works</h2>`,
        `<p><strong>Telling Node a file is ESM.</strong> Node decides a file's module system by three signals, in order: a <code>.mjs</code> extension is always ESM; a <code>.cjs</code> extension is always CommonJS; a plain <code>.js</code> file follows the nearest <code>package.json</code>'s <code>"type"</code> field — <code>"type": "module"</code> makes <code>.js</code> ESM, <code>"type": "commonjs"</code> (or absent) makes it CommonJS. So the same <code>.js</code> source can be interpreted either way depending on the package it lives in.</p>`,
        `<p><strong>Three phases: parse, link, evaluate.</strong> ESM loading is not a single synchronous read like <code>require</code>. Node (1) <em>parses</em> every module in the graph to discover its imports and exports without running any code, (2) <em>links</em> them — connecting each import to the exact exported binding it refers to — and (3) <em>evaluates</em> module bodies in dependency order. This static, ahead-of-time analysis is what enables bundler tree-shaking and what makes circular ESM graphs behave more predictably than CommonJS ones.</p>`,
        `<p><strong>Live bindings, not copies.</strong> A CommonJS <code>require</code> gives you a snapshot of <code>module.exports</code> at require time. An ESM <code>import</code> gives you a <em>live, read-only view</em> of the exporter's binding. If the exporting module later reassigns an exported <code>let</code>, importers see the new value. You cannot reassign an imported binding — imports are constant references into the source module.</p>`,
        `<pre><code class="language-javascript">// counter.mjs
export let count = 0;
export function inc() { count++; }

// app.mjs
import { count, inc } from './counter.mjs';
console.log(count); // 0
inc();
console.log(count); // 1  — live binding reflects the change
// count = 5;       // TypeError: Assignment to constant variable-like binding</code></pre>`,
        `<p><strong>Top-level await.</strong> ESM module bodies may use <code>await</code> at the top level. Node treats such a module as asynchronous: any module importing it waits for its top-level awaits to settle before its own body runs. This is impossible in CommonJS and is a major reason <code>require</code> cannot synchronously load an ESM module that uses it.</p>`,
        `<p><strong>Evaluated once, then cached.</strong> Like CommonJS, ESM keeps a module map (the module registry) keyed by the resolved URL, so a given module's body runs exactly once per process no matter how many files import it. The difference is what the cache holds: CommonJS caches the finished <code>module.exports</code> object, whereas ESM caches a <em>Module Record</em> whose exported bindings stay live. Import the same module from ten places and every importer shares one instance — the same singleton guarantee that makes a shared config or connection pool work, and the same trap if you mutate module-level state expecting isolation. One subtlety: the registry key is the fully-resolved URL including any query string, so <code>import './x.js?v=1'</code> and <code>import './x.js?v=2'</code> are two <em>separate</em> instances — the closest thing ESM has to cache-busting, since there is no <code>delete require.cache</code> equivalent.</p>`,
        `<p><strong><code>import.meta</code> — per-module metadata.</strong> <code>import.meta</code> is an object the host populates with information about the current module. Node always provides <code>import.meta.url</code> (the module's absolute <code>file:</code> URL) and, on Node 20.11+/21.2+, the convenience properties <code>import.meta.dirname</code> and <code>import.meta.filename</code>. It also exposes <code>import.meta.resolve(specifier)</code>, the ESM counterpart to <code>require.resolve</code>, which returns the URL a specifier would resolve to without loading it — handy for locating an asset shipped beside your code. Because <code>import.meta.url</code> is a real URL string, the idiomatic way back to a filesystem path is always <code>fileURLToPath(import.meta.url)</code>; slicing off the <code>file://</code> prefix by hand breaks on Windows drive letters and on paths containing spaces or non-ASCII characters, which is exactly why the <code>node:url</code> helper exists.</p>`,
        `<p><strong>No <code>__dirname</code>, no <code>require</code>.</strong> ESM files do not get the CommonJS wrapper, so <code>require</code>, <code>module</code>, <code>exports</code>, <code>__filename</code>, and <code>__dirname</code> do not exist. Instead you get <code>import.meta.url</code> (the module's URL). Reconstruct the old values with the <code>url</code> module, or on modern Node use the built-in helpers:</p>`,
        `<pre><code class="language-javascript">import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Node 20.11+ / 21.2+ also expose import.meta.dirname and import.meta.filename directly.</code></pre>`,
        `<p><strong>ESM ↔ CJS interop.</strong> The two systems meet under clear rules:</p>`,
        `<ul>
          <li><strong>ESM importing CJS:</strong> allowed. The CommonJS <code>module.exports</code> object becomes the ESM <em>default</em> export. So <code>import pkg from 'some-cjs-lib'</code> gives you <code>module.exports</code>. Node also tries to statically detect named exports (<code>import { readFile } from 'node:fs'</code> works for builtins and many packages), but detection is best-effort — when it fails, import the default and destructure.</li>
          <li><strong>CJS importing ESM:</strong> historically forbidden — <code>require()</code> of an ESM file threw <code>ERR_REQUIRE_ESM</code>. The universal escape hatch is dynamic <code>await import()</code>, which works in both worlds. (Recent Node versions can <code>require()</code> a synchronous ESM module — one with no top-level await — but <code>import()</code> remains the portable answer.)</li>
          <li>File extensions are mandatory in relative ESM specifiers: <code>import './util.js'</code>, not <code>import './util'</code>. CommonJS's extension guessing does not apply.</li>
        </ul>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. Named, default, and namespace imports.</strong></p>`,
        `<pre><code class="language-javascript">// shapes.mjs
export const PI = 3.14159;
export function area(r) { return PI * r * r; }
export default class Circle { constructor(r) { this.r = r; } }

// app.mjs
import Circle, { area, PI } from './shapes.mjs'; // default + named
import * as shapes from './shapes.mjs';          // namespace object
console.log(shapes.PI, shapes.default);          // 3.14159, [class Circle]</code></pre>`,
        `<p><strong>2. Top-level await at module scope.</strong></p>`,
        `<pre><code class="language-javascript">// config.mjs
const res = await fetch('https://example.com/config.json');
export const config = await res.json();

// server.mjs — waits for config.mjs's top-level awaits before running
import { config } from './config.mjs';
console.log('Loaded config:', config);</code></pre>`,
        `<p><strong>3. Loading a CommonJS module from ESM.</strong></p>`,
        `<pre><code class="language-javascript">// legacy-lib is CommonJS: module.exports = { greet }
import legacy from 'legacy-lib';   // whole module.exports as default
legacy.greet('world');
// Named import may also work if Node detects it:
import { greet } from 'legacy-lib'; // best-effort static analysis</code></pre>`,
        `<p><strong>4. Loading ESM from CommonJS with dynamic import.</strong></p>`,
        `<pre><code class="language-javascript">// index.cjs (CommonJS)
async function main() {
  const { default: chalk } = await import('chalk'); // chalk is ESM-only
  console.log(chalk.green('works from CJS via import()'));
}
main();</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>
          <li><strong>Omitting the file extension.</strong> <code>import './util'</code> throws <code>ERR_MODULE_NOT_FOUND</code> in ESM — write <code>'./util.js'</code>.</li>
          <li><strong>Using <code>__dirname</code> in ESM.</strong> Not defined — reconstruct from <code>import.meta.url</code> or use <code>import.meta.dirname</code>.</li>
          <li><strong><code>require</code> of an ESM package.</strong> Classic <code>ERR_REQUIRE_ESM</code>. Use <code>await import()</code> instead, or make your own file ESM.</li>
          <li><strong>Forgetting <code>"type": "module"</code>.</strong> A <code>.js</code> file using <code>import</code> in a default package throws <code>Cannot use import statement outside a module</code>.</li>
          <li><strong>Expecting <code>import</code> to run conditionally.</strong> Static <code>import</code> is hoisted and always evaluated. For conditional/dynamic loading use <code>await import()</code>.</li>
          <li><strong>Assuming named imports always exist on a CJS package.</strong> Node's named-export detection is heuristic; import the default and destructure when it fails.</li>
          <li><strong>Trying to reassign an import.</strong> Imports are read-only live bindings — assignment is a syntax/type error.</li>
          <li><strong>Mixing <code>module.exports</code> and <code>export</code> in one file.</strong> A file is one system or the other; you cannot use both.</li>
        </ul>`,

        `<h2>Best practices</h2>`,
        `<ul>
          <li>For new projects, prefer ESM: set <code>"type": "module"</code> and use <code>.js</code> with <code>import</code>/<code>export</code>.</li>
          <li>Always include explicit file extensions in relative imports.</li>
          <li>Replace <code>__dirname</code> with <code>import.meta.dirname</code> (or <code>fileURLToPath(import.meta.url)</code> for older Node).</li>
          <li>When publishing a library, ship <strong>dual</strong> builds and wire them with the <code>exports</code> field's <code>import</code>/<code>require</code> conditions so both worlds work.</li>
          <li>Use <code>await import()</code> as the portable bridge whenever you must load ESM from CJS or load a module conditionally/lazily.</li>
          <li>Keep top-level <code>await</code> deliberate — it delays every importer; do not use it for work that could be a lazily-called async function.</li>
          <li>Prefer named exports for tree-shakeable, discoverable APIs; reserve <code>default</code> for a single primary export.</li>
        </ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: Name three concrete differences between ESM and CommonJS beyond syntax.</strong> (1) Loading: <code>require</code> is synchronous and runtime; <code>import</code> is statically analysed and async. (2) Bindings: CJS gives a copied snapshot of exports; ESM gives live read-only bindings. (3) Environment: ESM has top-level <code>await</code> and <code>import.meta</code> but no <code>__dirname</code>/<code>require</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: What does "live binding" mean?</strong> An imported name is a reference into the exporting module's variable, not a copy. If the exporter reassigns an exported <code>let</code> later, importers observe the new value. In CommonJS you would have captured the old value at require time.</p></blockquote>`,
        `<blockquote><p><strong>Q: How does Node decide whether a <code>.js</code> file is ESM or CJS?</strong> The nearest <code>package.json</code>'s <code>"type"</code> field: <code>"module"</code> → ESM, <code>"commonjs"</code> or absent → CJS. <code>.mjs</code> is always ESM and <code>.cjs</code> always CJS regardless of <code>"type"</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: You get <code>ERR_REQUIRE_ESM</code>. What is happening and how do you fix it?</strong> Code is calling <code>require()</code> on an ESM-only package. Options: convert the calling file to ESM, or use <code>const mod = await import('pkg')</code> which works from both systems. Trap: interviewers may ask why you can't "just require it" — because ESM may use top-level await, which cannot resolve synchronously.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you get <code>__dirname</code> in an ES module?</strong> <code>const __dirname = path.dirname(fileURLToPath(import.meta.url))</code>, or directly <code>import.meta.dirname</code> on Node 20.11+.</p></blockquote>`,
        `<blockquote><p><strong>Q: When you <code>import x from</code> a CommonJS module, what is <code>x</code>?</strong> The module's entire <code>module.exports</code> object, bound as the default export. Named imports may additionally work if Node's static analysis detects them.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>
          <li><strong>ESM signals:</strong> <code>.mjs</code>, or <code>.js</code> + <code>"type":"module"</code>. <strong>CJS:</strong> <code>.cjs</code>, or <code>.js</code> default.</li>
          <li><strong>Syntax:</strong> <code>export</code> / <code>export default</code> / <code>import x, { y } from './f.js'</code>.</li>
          <li><strong>Extensions required</strong> in relative ESM specifiers.</li>
          <li><strong>Live bindings</strong> (read-only) vs CJS copied snapshot.</li>
          <li><strong>Top-level await</strong> allowed in ESM only; makes the module async.</li>
          <li><strong>No <code>__dirname</code></strong> → use <code>import.meta.dirname</code> / <code>fileURLToPath(import.meta.url)</code>.</li>
          <li><strong>Interop:</strong> ESM imports CJS as default; CJS loads ESM via <code>await import()</code>.</li>
          <li><strong><code>await import(expr)</code></strong> = dynamic/conditional loading, works in both systems.</li>
        </ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // 2. module-resolution
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Module Resolution',
      slug: 'module-resolution',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Module resolution is the algorithm that turns a short string like <code>'express'</code> or <code>'./utils'</code> into one exact file on disk. It runs on every <code>require</code> and every <code>import</code>, and when it goes wrong you get the two most common Node errors in existence: <code>MODULE_NOT_FOUND</code> and <code>ERR_MODULE_NOT_FOUND</code>. Understanding resolution is what lets you answer questions that otherwise feel like black magic: "Why did it find version 2 of this package and not version 3?", "Why does <code>import 'pkg/internal'</code> suddenly fail after an upgrade?", "Why does my monorepo pick the wrong copy of a dependency?" These are all resolution questions.</p>`,
        `<p>Resolution is also central to modern package design. The <code>exports</code> field and conditional exports let a package author decide precisely which files consumers can reach and whether they get the ESM or CommonJS build. If you publish libraries — or debug why a dependency behaves differently under <code>import</code> than <code>require</code> — resolution is the topic that explains it.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>Every specifier you pass falls into one of three buckets, and each is resolved differently:</p>`,
        `<ul>
          <li><strong>Relative or absolute</strong> — starts with <code>./</code>, <code>../</code>, or <code>/</code>. Node treats it as a path from the current file (or filesystem root) and looks for a matching file or directory.</li>
          <li><strong>Bare specifier (a package name)</strong> — <code>'express'</code>, <code>'lodash/fp'</code>, <code>'@scope/pkg'</code>. Node searches <code>node_modules</code> folders, walking up the directory tree.</li>
          <li><strong>Builtin</strong> — <code>'fs'</code>, <code>'path'</code>, or the explicit <code>'node:fs'</code> form. Resolved instantly from Node itself, no disk lookup.</li>
        </ul>`,
        `{{fig:ch3-resolution-algorithm.svg|Diagram of the three specifier types and a node_modules lookup walking up the directory tree from a source file to the filesystem root|A specifier is relative/absolute, a bare package name, or a builtin. Package names trigger a walk up successive node_modules folders until the package is found or the filesystem root is reached.}}`,

        `<h2>How it works</h2>`,
        `<p><strong>Relative/absolute resolution (CommonJS).</strong> Given <code>require('./util')</code>, Node tries, in order: (1) the exact path as a file — <code>./util</code>; (2) the path plus extensions — <code>./util.js</code>, then <code>./util.json</code>, then <code>./util.node</code>; (3) the path as a directory — it reads <code>./util/package.json</code> and uses its <code>main</code> field, or falls back to <code>./util/index.js</code>. The first hit wins. This "try several extensions and an index file" behaviour is the convenient extension guessing that CommonJS is known for.</p>`,
        `<p><strong>Relative resolution (ESM) is stricter.</strong> ES Modules do <em>not</em> guess extensions and do <em>not</em> auto-resolve <code>index.js</code> for a bare directory. <code>import './util'</code> fails; you must write <code>import './util.js'</code> or <code>import './util/index.js'</code> explicitly. This strictness is intentional — it makes resolution unambiguous and matches browser behaviour.</p>`,
        `<p><strong>Bare specifier resolution — the <code>node_modules</code> walk.</strong> For <code>require('express')</code> from <code>/app/src/server.js</code>, Node looks for <code>express</code> in a series of <code>node_modules</code> directories, starting next to the file and climbing toward the root: <code>/app/src/node_modules/express</code>, then <code>/app/node_modules/express</code>, then <code>/node_modules/express</code>. The first one found wins. This upward walk is exactly why a nested dependency can have its own private copy of a package (in its local <code>node_modules</code>) while the top-level app uses a different version — the resolution starts from wherever the requiring file lives.</p>`,
        `<p><strong>Inside a found package.</strong> Once Node locates <code>node_modules/express</code>, it reads that package's <code>package.json</code> to decide the entry file. Modern resolution consults the <code>exports</code> field first (if present); otherwise it uses <code>main</code> (and, for some tools, <code>module</code> or <code>browser</code>); with neither, it falls back to <code>index.js</code>. A subpath like <code>'lodash/fp'</code> means "the <code>fp</code> entry inside the <code>lodash</code> package," resolved either through the package's <code>exports</code> subpaths or as a literal file path when no <code>exports</code> map exists.</p>`,
        `<p><strong>The <code>exports</code> field — encapsulation.</strong> When a package declares <code>"exports"</code>, it becomes the <em>only</em> gateway into the package. Any file not listed is unreachable, even if it physically exists — <code>import 'pkg/lib/internal.js'</code> throws <code>ERR_PACKAGE_PATH_NOT_EXPORTED</code>. This lets authors ship internal files without them becoming part of the public API. The map keys are subpaths (<code>"."</code> is the package root, <code>"./utils"</code> a named subpath) and the values are the real files.</p>`,
        `{{fig:ch3-exports-field.svg|Diagram showing a package.json exports map with import, require and types conditions, and which import specifiers resolve or are blocked|The exports field maps public subpaths to real files and can branch on conditions like import vs require; anything not listed becomes private and un-importable.}}`,
        `<p><strong>Conditional exports.</strong> An entry can be an object whose keys are <em>conditions</em> Node evaluates against the current environment, matched top-to-bottom (order matters):</p>`,
        `<ul>
          <li><code>"import"</code> — used when the package is loaded via <code>import</code> / <code>await import()</code> (ESM).</li>
          <li><code>"require"</code> — used when loaded via <code>require()</code> (CJS).</li>
          <li><code>"node"</code>, <code>"browser"</code>, <code>"default"</code> — platform/fallback conditions; <code>"default"</code> matches anything and should come last.</li>
          <li><code>"types"</code> — where TypeScript should look for declarations (must come first among conditions).</li>
        </ul>`,
        `<p>This is how one package serves an ESM build to <code>import</code> and a CommonJS build to <code>require</code> from the same install — the classic "dual package." It is also the mechanism behind subtle bugs where the <code>import</code> and <code>require</code> paths load different files with slightly different behaviour.</p>`,
        `<p><strong>Conditions are matched, not merged.</strong> Node walks the condition keys of an <code>exports</code> object <em>in the order they are written</em> and takes the first one that applies to the current request, then stops — it never blends two branches. That single rule explains most misconfigured packages: if <code>"default"</code> sits above <code>"import"</code>, the ESM branch is dead code because <code>"default"</code> already matched; if <code>"types"</code> is not first, TypeScript resolves a JavaScript file before it ever sees the declarations. A request also carries more than one active condition at once — an <code>import</code> from Node matches <em>both</em> <code>"import"</code> and <code>"node"</code> — so specificity, not just presence, decides the winner, and the author controls that purely through key order. The table below shows what is active for common load styles.</p>`,
        `<table>
          <thead><tr><th>How the package is loaded</th><th>Active conditions (most to least specific)</th></tr></thead>
          <tbody>
            <tr><td><code>import 'pkg'</code> in Node</td><td><code>node</code>, <code>import</code>, <code>module-sync</code>, <code>default</code></td></tr>
            <tr><td><code>require('pkg')</code> in Node</td><td><code>node</code>, <code>require</code>, <code>default</code></td></tr>
            <tr><td>bundled for the browser</td><td><code>browser</code>, <code>import</code>/<code>require</code>, <code>default</code></td></tr>
            <tr><td>type-checked by TypeScript</td><td><code>types</code> (must precede the runtime keys), then the runtime set</td></tr>
          </tbody>
        </table>`,
        `<p><strong>Self-referencing and the resolution's endpoint.</strong> A useful consequence of the <code>exports</code> map is that a package can import <em>itself</em> by name — <code>import { thing } from 'mylib'</code> from inside <code>mylib</code> resolves through its own <code>exports</code>, so tests and internal files exercise the exact public surface consumers see, not a relative shortcut that skips the map. Whichever branch is chosen, resolution ends the same way for every specifier type: the algorithm produces one absolute path (CommonJS) or one <code>file:</code> URL (ESM), and that fully-resolved string — not the original specifier — is the key used for caching. Two different specifiers that resolve to the same real file therefore share one cached instance, which is why a symlinked or path-aliased dependency can accidentally load twice if the two routes normalise to different absolute paths.</p>`,
        `<p><strong>Other resolution features.</strong> <code>imports</code> (with keys starting <code>#</code>) defines private, internal-only aliases usable within the package (<code>import x from '#internal/thing'</code>). The <code>NODE_PATH</code> environment variable adds extra global lookup directories but is discouraged. <code>require.resolve('pkg')</code> runs the algorithm and returns the resolved path without loading — invaluable for debugging "which file is this actually?".</p>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. Inspect what a specifier resolves to.</strong></p>`,
        `<pre><code class="language-javascript">// Prints the exact file Node would load — great for debugging duplicates.
console.log(require.resolve('express'));
// e.g. /app/node_modules/express/lib/express.js
console.log(require.resolve('./utils'));
// e.g. /app/src/utils/index.js
console.log(module.paths); // the ordered node_modules dirs Node will search</code></pre>`,
        `<p><strong>2. A dual-package <code>exports</code> map.</strong></p>`,
        `<pre><code class="language-json">{
  "name": "mylib",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "default": "./dist/index.mjs"
    },
    "./utils": "./dist/utils.js"
  }
}</code></pre>`,
        `<p><strong>3. Encapsulation in action.</strong></p>`,
        `<pre><code class="language-javascript">import mylib from 'mylib';          // -> dist/index.mjs (import condition)
import u from 'mylib/utils';        // -> dist/utils.js (listed subpath)
import x from 'mylib/dist/secret.js';
// throws ERR_PACKAGE_PATH_NOT_EXPORTED — not listed in "exports"</code></pre>`,
        `<p><strong>4. Internal imports with the <code>#</code> prefix.</strong></p>`,
        `<pre><code class="language-json">{
  "imports": {
    "#config": "./src/config.js",
    "#utils/*": "./src/utils/*.js"
  }
}</code></pre>`,
        `<pre><code class="language-javascript">// Anywhere inside the package:
import config from '#config';         // -> ./src/config.js
import { slug } from '#utils/string'; // -> ./src/utils/string.js</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>
          <li><strong>Relying on extension guessing in ESM.</strong> Works in CJS, fails in ESM — always write the full filename in <code>import</code>.</li>
          <li><strong>Reaching into a package's internals.</strong> <code>import 'pkg/lib/x'</code> breaks when the author adds an <code>exports</code> field. Use only documented entry points.</li>
          <li><strong>Duplicate copies of a package.</strong> The upward <code>node_modules</code> walk can load two versions of the same library (e.g. two React copies), causing "invalid hook" style bugs. Diagnose with <code>require.resolve</code> and <code>npm ls pkg</code>.</li>
          <li><strong>Wrong condition order.</strong> Putting <code>"default"</code> before <code>"import"</code> in <code>exports</code> makes <code>"default"</code> always win; conditions match top-down, so specific ones come first and <code>"default"</code> last.</li>
          <li><strong>Forgetting <code>"types"</code> first.</strong> TypeScript needs the <code>"types"</code> condition to appear before <code>"import"</code>/<code>"require"</code> or it won't find declarations.</li>
          <li><strong>Assuming <code>main</code> still applies with <code>exports</code>.</strong> When <code>exports</code> is present it takes precedence for module resolution; <code>main</code> becomes a fallback for legacy tools only.</li>
          <li><strong>Casing on case-insensitive filesystems.</strong> <code>require('./Util')</code> may work on macOS/Windows but fail on Linux/CI. Match the real filename exactly.</li>
          <li><strong>Abusing <code>NODE_PATH</code>.</strong> It hides real dependencies and is non-portable; declare deps in <code>package.json</code> instead.</li>
        </ul>`,

        `<h2>Best practices</h2>`,
        `<ul>
          <li>Use <code>require.resolve('pkg')</code> and <code>npm ls pkg</code> to confirm exactly which file/version is loaded when debugging.</li>
          <li>Import packages only through their documented entry points, never deep internal paths.</li>
          <li>When publishing, define an <code>exports</code> field to encapsulate internals and to serve correct ESM/CJS builds via conditions.</li>
          <li>Order conditions carefully: <code>"types"</code> first, then <code>"import"</code>/<code>"require"</code>, with <code>"default"</code> last.</li>
          <li>Prefer the <code>#</code>-prefixed <code>imports</code> map for internal aliases over brittle relative-path chains.</li>
          <li>Write full file extensions in every relative ESM specifier.</li>
          <li>Keep the dependency tree flat and deduped (lockfile + <code>npm dedupe</code>) to avoid duplicate-copy bugs.</li>
        </ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: Walk me through how Node resolves <code>require('express')</code>.</strong> It is a bare specifier, so Node searches <code>node_modules</code> folders from the requiring file's directory upward: <code>./node_modules/express</code>, <code>../node_modules/express</code>, and so on to the filesystem root. On the first hit it reads that package's <code>package.json</code>, consulting <code>exports</code> (else <code>main</code>, else <code>index.js</code>) to pick the entry file.</p></blockquote>`,
        `<blockquote><p><strong>Q: How does resolving <code>'./util'</code> differ between CJS and ESM?</strong> CJS tries <code>util</code>, then <code>util.js/.json/.node</code>, then <code>util/index.js</code> — it guesses extensions and index files. ESM does none of that; you must write the exact filename with extension. Trap: code that "worked" is really relying on CJS guessing and breaks on the switch to ESM.</p></blockquote>`,
        `<blockquote><p><strong>Q: What does the <code>exports</code> field do that <code>main</code> doesn't?</strong> It <em>encapsulates</em> the package — only listed subpaths are importable, everything else becomes private (<code>ERR_PACKAGE_PATH_NOT_EXPORTED</code>) — and it supports <em>conditional</em> resolution (different files for <code>import</code> vs <code>require</code>, node vs browser). <code>main</code> is a single legacy entry point with no encapsulation or conditions.</p></blockquote>`,
        `<blockquote><p><strong>Q: How can one <code>require</code> and <code>import</code> of the same package load different code?</strong> Via conditional exports: <code>"exports": { ".": { "import": "./esm.js", "require": "./cjs.js" } }</code>. Node picks the branch matching how the package was loaded. This is the dual-package pattern (and a source of "dual package hazard" if the two builds hold separate state).</p></blockquote>`,
        `<blockquote><p><strong>Q: You suspect two versions of a library are loaded. How do you confirm?</strong> <code>require.resolve('lib')</code> from different files shows the actual paths; <code>npm ls lib</code> shows every version in the tree. Duplicates arise because the <code>node_modules</code> walk resolves from each file's location, so nested deps can pin their own copy.</p></blockquote>`,
        `<blockquote><p><strong>Q: What is the <code>#</code> in <code>import '#config'</code>?</strong> A package-internal import defined in the <code>imports</code> field of <code>package.json</code>. It creates a private alias usable only inside that package — a clean alternative to long <code>../../</code> relative chains.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>
          <li><strong>Three specifier types:</strong> relative/absolute · bare (package) · builtin (<code>node:</code>).</li>
          <li><strong>CJS relative:</strong> exact → +<code>.js/.json/.node</code> → <code>dir/index.js</code>. <strong>ESM:</strong> exact filename only.</li>
          <li><strong>Bare:</strong> walk <code>node_modules</code> upward to root; first hit wins.</li>
          <li><strong>Entry pick:</strong> <code>exports</code> → <code>main</code> → <code>index.js</code>.</li>
          <li><strong><code>exports</code> field</strong> encapsulates: unlisted paths = <code>ERR_PACKAGE_PATH_NOT_EXPORTED</code>.</li>
          <li><strong>Conditions</strong> (top-down): <code>types</code> → <code>import</code>/<code>require</code>/<code>node</code>/<code>browser</code> → <code>default</code> last.</li>
          <li><strong><code>imports</code> + <code>#</code></strong> = private internal aliases.</li>
          <li><strong>Debug:</strong> <code>require.resolve('x')</code>, <code>module.paths</code>, <code>npm ls x</code>.</li>
        </ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // 3. package-json-semver
    // ────────────────────────────────────────────────────────────────
    {
      title: 'package.json & Semantic Versioning',
      slug: 'package-json-semver',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p><code>package.json</code> is the manifest at the heart of every Node project — it names the project, lists its dependencies, defines its scripts, and controls how the package is published and consumed. Get it right and installs are reproducible, upgrades are predictable, and CI is green. Get it wrong and you ship the classic disasters: "works on my machine," a dependency that silently jumped a major version and broke production, or a deploy that pulled different code than your laptop did. Almost every reproducibility and supply-chain incident traces back to a misunderstanding of two things in this file: version ranges (<code>^</code> vs <code>~</code>) and the role of the lockfile.</p>`,
        `<p>Semantic Versioning (semver) is the contract that makes ranges meaningful. It is a shared promise between package authors and consumers about what a version number change implies. Interviewers love this topic because it is where "I can install packages" becomes "I understand why my build is or isn't reproducible."</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>A semver version has three numbers: <strong>MAJOR.MINOR.PATCH</strong>, e.g. <code>4.18.2</code>. The promise is:</p>`,
        `<ul>
          <li><strong>MAJOR</strong> — incremented for a <em>breaking</em> change. Upgrading may require code changes on your side.</li>
          <li><strong>MINOR</strong> — new functionality added in a <em>backward-compatible</em> way. Safe to take.</li>
          <li><strong>PATCH</strong> — a backward-compatible <em>bug fix</em>. Safe to take.</li>
        </ul>`,
        `<p>In <code>package.json</code> you rarely pin one exact version. Instead you write a <em>range</em> — a rule for which versions are acceptable — using prefixes like <code>^</code> (caret) and <code>~</code> (tilde). The range says "install the newest version that satisfies this rule." A separate <em>lockfile</em> then records the exact version that was actually installed, so everyone and every deploy gets byte-identical dependencies.</p>`,
        `{{fig:ch3-semver.svg|Diagram of MAJOR MINOR PATCH meaning and the caret, tilde, exact and wildcard range rules against a base version|Semver encodes intent — major means breaking, minor means new-and-safe, patch means fix — and range operators like caret and tilde decide how far npm may upgrade automatically.}}`,

        `<h2>How it works</h2>`,
        `<p><strong>Key <code>package.json</code> fields.</strong></p>`,
        `<ul>
          <li><code>name</code> and <code>version</code> — identity; required to publish. <code>version</code> must be valid semver.</li>
          <li><code>type</code> — <code>"module"</code> or <code>"commonjs"</code>; decides how <code>.js</code> files are interpreted.</li>
          <li><code>main</code> / <code>exports</code> — the package's entry point(s) (see module-resolution).</li>
          <li><code>scripts</code> — named commands run with <code>npm run</code> (see npm-and-scripts).</li>
          <li><code>dependencies</code> — packages your code needs at <em>runtime</em>; installed for anyone who installs your package.</li>
          <li><code>devDependencies</code> — packages needed only to <em>develop/build/test</em> (bundlers, test runners, TypeScript, linters). Skipped when your package is installed as someone else's dependency, and skippable in production with <code>npm ci --omit=dev</code>.</li>
          <li><code>peerDependencies</code> — packages the host app must provide (e.g. a React plugin declares <code>react</code> as a peer so it shares the app's single copy).</li>
          <li><code>optionalDependencies</code> — install failures are tolerated (platform-specific binaries).</li>
          <li><code>engines</code> — declares supported Node/npm versions; a guardrail against running on an unsupported runtime.</li>
          <li><code>files</code> — allowlist of what actually gets published to npm; keeps the tarball lean.</li>
          <li><code>bin</code> — maps a command name to an executable file, powering CLIs and <code>npx</code>.</li>
        </ul>`,
        `<p><strong>Range operators against a base version (say <code>1.2.3</code>).</strong></p>`,
        `<ul>
          <li><code>^1.2.3</code> (<strong>caret</strong>) — allows changes that do not modify the left-most non-zero digit: <code>&gt;=1.2.3 &lt;2.0.0</code>. Takes new minors and patches, not a new major. This is npm's default when you <code>npm install pkg</code>. Special zero-rules: <code>^0.2.3</code> means <code>&gt;=0.2.3 &lt;0.3.0</code> (minor is treated as breaking when major is 0), and <code>^0.0.3</code> means exactly <code>0.0.3</code> patch range <code>&gt;=0.0.3 &lt;0.0.4</code>.</li>
          <li><code>~1.2.3</code> (<strong>tilde</strong>) — allows patch-level changes if a minor is specified: <code>&gt;=1.2.3 &lt;1.3.0</code>. Takes patches only.</li>
          <li><code>1.2.3</code> (<strong>exact</strong>) — only that version.</li>
          <li><code>1.2.x</code> / <code>1.2</code> — any patch of <code>1.2</code>. <code>1.x</code> — any minor/patch of major 1.</li>
          <li><code>&gt;=1.2.3 &lt;2.0.0</code> — explicit compound range (what caret expands to).</li>
          <li><code>*</code> or <code>latest</code> — any/newest version; unreproducible, avoid.</li>
        </ul>`,
        `<p><strong>The lockfile is the source of truth for installs.</strong> Ranges describe what is <em>allowed</em>; the lockfile records what was <em>chosen</em>. npm writes <code>package-lock.json</code>, yarn writes <code>yarn.lock</code>, pnpm writes <code>pnpm-lock.yaml</code>. It captures the exact resolved version and integrity hash of every package in the entire tree — including transitive dependencies. Commit it. Two commands behave very differently:</p>`,
        `<ul>
          <li><code>npm install</code> — may update the lockfile to newer versions still satisfying your ranges, and can mutate <code>package.json</code>.</li>
          <li><code>npm ci</code> — installs <em>exactly</em> what the lockfile says, fails if <code>package.json</code> and the lockfile disagree, and deletes <code>node_modules</code> first. This is the command for CI and production because it is deterministic.</li>
        </ul>`,
        `<p><strong>The caret's real rule: the left-most non-zero digit.</strong> The single sentence that makes caret behaviour predictable is "allow anything that does not change the left-most non-zero part of the version." For a normal <code>1.x.y</code> release the left-most non-zero digit is the major, so <code>^1.2.3</code> floats the minor and patch up to (but not including) <code>2.0.0</code>. Drop into pre-1.0 territory and the left-most non-zero digit shifts right, which is why the operator quietly tightens. This is not npm being inconsistent — it is one rule applied uniformly, and pre-1.0 packages lean on it because SemVer explicitly says <code>0.y.z</code> offers no stability guarantee, so every <code>0.x</code> bump is treated as potentially breaking. The table makes the shift concrete:</p>`,
        `<table>
          <thead><tr><th>Range</th><th>Expands to</th><th>Takes</th></tr></thead>
          <tbody>
            <tr><td><code>^1.2.3</code></td><td><code>&gt;=1.2.3 &lt;2.0.0</code></td><td>minor + patch</td></tr>
            <tr><td><code>^0.2.3</code></td><td><code>&gt;=0.2.3 &lt;0.3.0</code></td><td>patch only (minor is treated as breaking)</td></tr>
            <tr><td><code>^0.0.3</code></td><td><code>&gt;=0.0.3 &lt;0.0.4</code></td><td>nothing — effectively pinned</td></tr>
            <tr><td><code>~1.2.3</code></td><td><code>&gt;=1.2.3 &lt;1.3.0</code></td><td>patch only</td></tr>
            <tr><td><code>~1.2</code></td><td><code>&gt;=1.2.0 &lt;1.3.0</code></td><td>patch only</td></tr>
            <tr><td><code>~1</code></td><td><code>&gt;=1.0.0 &lt;2.0.0</code></td><td>minor + patch</td></tr>
          </tbody>
        </table>`,
        `<p><strong>Pre-release tags sit outside the ordinary ranges.</strong> A version can carry a pre-release suffix such as <code>2.0.0-beta.1</code> or <code>2.0.0-rc.2</code>, and SemVer orders these <em>below</em> the matching stable release: <code>2.0.0-beta.1 &lt; 2.0.0-rc.2 &lt; 2.0.0</code>. Crucially, npm will not hand a pre-release to a plain range by default — <code>^1.2.3</code> never selects <code>2.0.0-beta.1</code>, and even <code>^2.0.0-beta.1</code> only matches other <code>2.0.0</code> pre-releases, not later ones — precisely so an unfinished build cannot sneak into a normal install. You opt in explicitly, e.g. <code>npm install pkg@next</code> or a range like <code>2.0.0-rc.2</code>. Build metadata after a <code>+</code> (<code>1.4.0+20240115</code>) is ignored entirely for ordering. This is why a teammate on a beta and a teammate on the range can end up on genuinely different code even though both "satisfy" the intent — another reason the committed lockfile, not the range, is the real record of what shipped.</p>`,
        `<p><strong>Why ranges + lockfile together.</strong> Ranges let you accept safe upgrades when you deliberately run <code>npm update</code>; the lockfile guarantees that, until you do, everyone installs identical code. Without a lockfile, <code>^4.18.2</code> could resolve to <code>4.18.2</code> today and <code>4.20.0</code> next week, and "it worked yesterday" becomes unexplainable. This is precisely why the caret default is safe in practice — the lockfile pins the real version even though the range would allow drift.</p>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. A realistic <code>package.json</code>.</strong></p>`,
        `<pre><code class="language-json">{
  "name": "my-api",
  "version": "1.4.0",
  "type": "module",
  "engines": { "node": ">=20" },
  "main": "./dist/index.js",
  "scripts": {
    "dev": "node --watch src/index.js",
    "build": "tsc -p tsconfig.json",
    "test": "node --test"
  },
  "dependencies": {
    "express": "^4.18.2",
    "zod": "~3.23.8"
  },
  "devDependencies": {
    "typescript": "^5.5.0"
  },
  "files": ["dist"]
}</code></pre>`,
        `<p><strong>2. What each range accepts.</strong></p>`,
        `<pre><code class="language-javascript">// Given published versions: 1.2.3, 1.2.9, 1.3.0, 1.9.5, 2.0.0
// "^1.2.3" -> highest of 1.2.3 .. 1.9.5 (any minor/patch, not 2.x) -> 1.9.5
// "~1.2.3" -> highest of 1.2.3 .. 1.2.9 (patch only, not 1.3.0)    -> 1.2.9
// "1.2.3"  -> exactly 1.2.3
// "*"      -> 2.0.0 (newest, unpredictable over time)</code></pre>`,
        `<p><strong>3. Reproducible install in CI.</strong></p>`,
        `<pre><code class="language-javascript">// package.json + package-lock.json are committed together.
// CI / Dockerfile:
//   npm ci                 // exact lockfile install, deterministic
//   npm ci --omit=dev      // production: skip devDependencies
// NOT \`npm install\` in CI — it may silently bump versions.</code></pre>`,
        `<p><strong>4. Pinning when you cannot risk any drift.</strong></p>`,
        `<pre><code class="language-javascript">// Save an exact version instead of a caret range:
//   npm install lodash --save-exact   // writes "lodash": "4.17.21"
// Or set once in .npmrc:  save-exact=true</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>
          <li><strong>Not committing the lockfile.</strong> Installs stop being reproducible; teammates and CI can get different transitive versions.</li>
          <li><strong>Using <code>npm install</code> in CI.</strong> It may update versions and the lockfile. Use <code>npm ci</code>.</li>
          <li><strong>Confusing dependencies with devDependencies.</strong> Putting a build tool in <code>dependencies</code> bloats production installs; putting a runtime library in <code>devDependencies</code> makes production crash with "module not found."</li>
          <li><strong>Assuming <code>^0.x</code> behaves like <code>^1.x</code>.</strong> With a <code>0</code> major, caret does NOT allow minor bumps — <code>^0.2.0</code> stays within <code>0.2.x</code> because pre-1.0 packages treat every minor as potentially breaking.</li>
          <li><strong>Trusting semver blindly.</strong> Authors make mistakes; a "patch" can break you. That is exactly why the lockfile plus a test suite matter.</li>
          <li><strong>Using <code>*</code> or <code>latest</code> ranges.</strong> Non-deterministic; a future major can land unannounced.</li>
          <li><strong>Editing versions by hand and forgetting the lockfile.</strong> The two drift apart; <code>npm ci</code> then refuses to install.</li>
          <li><strong>Ignoring <code>peerDependencies</code> warnings.</strong> Mismatched peers cause duplicate copies and subtle runtime bugs.</li>
        </ul>`,

        `<h2>Best practices</h2>`,
        `<ul>
          <li>Always commit the lockfile and treat it as reviewed source.</li>
          <li>Use <code>npm ci</code> (not <code>npm install</code>) in CI and Docker builds; add <code>--omit=dev</code> for production images.</li>
          <li>Classify dependencies correctly: runtime → <code>dependencies</code>, tooling → <code>devDependencies</code>, host-provided → <code>peerDependencies</code>.</li>
          <li>Keep the caret default for most deps (safe with a lockfile), but pin exact versions for anything security- or behaviour-critical, or use tilde for cautious patch-only updates.</li>
          <li>Set <code>engines.node</code> so an unsupported runtime fails fast.</li>
          <li>Add a <code>files</code> allowlist (or <code>.npmignore</code>) so you publish only what is needed.</li>
          <li>Upgrade deliberately with <code>npm update</code> / <code>npm outdated</code>, then run tests, then commit the new lockfile.</li>
          <li>Never hand-edit <code>package-lock.json</code>; let the CLI manage it.</li>
        </ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: Explain <code>^1.2.3</code> vs <code>~1.2.3</code>.</strong> Caret allows minor and patch updates: <code>&gt;=1.2.3 &lt;2.0.0</code>. Tilde allows patch updates only (when a minor is given): <code>&gt;=1.2.3 &lt;1.3.0</code>. Caret is npm's default and takes more updates; tilde is more conservative.</p></blockquote>`,
        `<blockquote><p><strong>Q: If <code>package.json</code> pins ranges, why do we also need a lockfile?</strong> Ranges say what is <em>allowed</em>, not what is <em>installed</em>. Without a lockfile, <code>^4.18.2</code> can resolve to different actual versions over time and across machines. The lockfile records the exact resolved version and integrity hash of every package (including transitive deps), making installs byte-reproducible.</p></blockquote>`,
        `<blockquote><p><strong>Q: Difference between <code>npm install</code> and <code>npm ci</code>?</strong> <code>npm install</code> resolves ranges, may update the lockfile and <code>package.json</code>, and installs on top of existing <code>node_modules</code>. <code>npm ci</code> wipes <code>node_modules</code> and installs the lockfile exactly, failing if it disagrees with <code>package.json</code>. Use <code>ci</code> for deterministic CI/production installs.</p></blockquote>`,
        `<blockquote><p><strong>Q: dependencies vs devDependencies vs peerDependencies?</strong> <code>dependencies</code> ship to consumers and are needed at runtime. <code>devDependencies</code> are for building/testing and are not installed when your package is a dependency of another. <code>peerDependencies</code> declare something the host app must supply, so a plugin shares the app's single copy (e.g. React) instead of bundling its own.</p></blockquote>`,
        `<blockquote><p><strong>Q: Trap — what does <code>^0.2.3</code> allow?</strong> Only <code>&gt;=0.2.3 &lt;0.3.0</code>. When MAJOR is 0, caret does not permit minor bumps because pre-1.0 packages may break in any minor. Many candidates wrongly say it allows up to <code>&lt;1.0.0</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: A "patch" upgrade broke production. What went wrong and how do you prevent it?</strong> Semver is a promise authors can violate; a patch release contained a breaking change. Prevention: a committed lockfile + <code>npm ci</code> so upgrades only happen when you choose, plus a test suite run before adopting the new lockfile. Consider pinning exact versions for critical packages.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>
          <li><strong>Semver:</strong> MAJOR = breaking · MINOR = new+safe · PATCH = fix+safe.</li>
          <li><strong>^1.2.3</strong> → <code>&gt;=1.2.3 &lt;2.0.0</code> (minor+patch, npm default).</li>
          <li><strong>~1.2.3</strong> → <code>&gt;=1.2.3 &lt;1.3.0</code> (patch only).</li>
          <li><strong>^0.2.3</strong> → <code>&gt;=0.2.3 &lt;0.3.0</code> (0-major quirk).</li>
          <li><strong>Avoid</strong> <code>*</code> / <code>latest</code> — unreproducible.</li>
          <li><strong>deps</strong> = runtime · <strong>devDeps</strong> = build/test · <strong>peerDeps</strong> = host-provided.</li>
          <li><strong>Lockfile</strong> pins exact tree + hashes — commit it.</li>
          <li><strong><code>npm ci</code></strong> = deterministic lockfile install for CI/prod (<code>--omit=dev</code>).</li>
        </ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // 4. npm-and-scripts
    // ────────────────────────────────────────────────────────────────
    {
      title: 'npm & Scripts',
      slug: 'npm-and-scripts',
      order: 4,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>npm is the package manager that ships with Node and the front door to the largest software registry in the world. Every day you use it to install dependencies, run tasks, execute one-off tools, and — if you publish — share your own code. The scripts you define in <code>package.json</code> become the shared vocabulary of a project: <code>npm run dev</code>, <code>npm test</code>, <code>npm run build</code> mean the same thing on every machine and in CI, regardless of the developer's local setup. Mastering npm scripts, <code>npx</code>, the alternative clients (yarn, pnpm), and security tooling like <code>npm audit</code> is what turns "I can install stuff" into "I can run and ship a real Node project safely."</p>`,
        `<p>This is also a security surface. Installing a package runs its lifecycle scripts on your machine; publishing exposes your code and credentials to the world. Knowing how scripts fire and how to audit dependencies is table stakes for professional Node work.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p><strong>npm scripts</strong> are named shell commands stored under <code>"scripts"</code> in <code>package.json</code>. You run them with <code>npm run &lt;name&gt;</code> — and a few names (<code>start</code>, <code>test</code>, <code>stop</code>, <code>restart</code>) can drop the <code>run</code>. When a script runs, npm temporarily adds your project's <code>node_modules/.bin</code> to the <code>PATH</code>, so you can call locally-installed tools (like <code>tsc</code> or <code>eslint</code>) by their bare name without a global install.</p>`,
        `<p><strong><code>npx</code></strong> executes a package's binary without permanently installing it — ideal for scaffolding (<code>npx create-vite</code>) or running a tool once. <strong>yarn</strong> and <strong>pnpm</strong> are alternative clients that read the same <code>package.json</code> but store dependencies differently and offer speed or disk-efficiency gains. <strong><code>npm audit</code></strong> scans your dependency tree against a vulnerability database.</p>`,
        `{{fig:ch3-npm-lifecycle.svg|Diagram showing prebuild, build and postbuild scripts running in order, plus reserved lifecycle names like postinstall|npm runs pre and post hooks around any script automatically, and reserved lifecycle names like postinstall fire during install — a real supply-chain consideration.}}`,

        `<h2>How it works</h2>`,
        `<p><strong>Script lifecycle hooks.</strong> For any script <code>x</code>, npm automatically runs <code>prex</code> before it and <code>postx</code> after it, if those scripts exist. So defining <code>build</code>, <code>prebuild</code>, and <code>postbuild</code> makes <code>npm run build</code> execute all three in order. This is how projects clean a folder, compile, then copy assets without a task runner. Several names are <em>reserved lifecycle</em> scripts that npm fires at specific moments: <code>preinstall</code>/<code>install</code>/<code>postinstall</code> run during <code>npm install</code>; <code>prepare</code> runs on local install and before publishing (commonly used to build a package or set up git hooks); <code>prepublishOnly</code> runs only before <code>npm publish</code>.</p>`,
        `<p><strong>Why lifecycle scripts are a security concern.</strong> Because <code>postinstall</code> runs automatically whenever someone installs a package, a malicious dependency can execute arbitrary code on your machine at install time. This is a real supply-chain attack vector. Mitigations include reviewing dependencies, using <code>npm ci</code> with <code>--ignore-scripts</code> in sensitive environments, and pinning versions via the lockfile so you don't silently pull a compromised release.</p>`,
        `<p><strong>Passing arguments and chaining.</strong> Pass flags to the underlying command with <code>--</code>: <code>npm run test -- --watch</code> forwards <code>--watch</code> to the test runner. Chain scripts by calling <code>npm run other</code> inside a script, or run several with <code>&amp;&amp;</code> (sequential) — for parallelism reach for a tool like <code>npm-run-all</code> or <code>concurrently</code>, since raw <code>&amp;</code> is not portable to Windows.</p>`,
        `<p><strong>node_modules/.bin on PATH.</strong> When a script runs, npm prepends <code>node_modules/.bin</code> to <code>PATH</code>. That directory holds the executables of your installed packages (created from each package's <code>bin</code> field). So <code>"build": "tsc"</code> works even though <code>tsc</code> isn't installed globally — it resolves to your local TypeScript. This keeps tool versions pinned per-project.</p>`,
        `<p><strong>npx resolution.</strong> <code>npx foo</code> looks for <code>foo</code> in the local <code>node_modules/.bin</code> first; if not found, it downloads the package to a temporary cache, runs it, and (by default) discards it. <code>npx create-next-app</code> is the canonical use — run a scaffolder once without polluting global installs. You can pin a version with <code>npx pkg@1.2.3</code>.</p>`,
        `<p><strong>yarn vs pnpm vs npm.</strong> All three consume the same <code>package.json</code>. Practical differences: <strong>npm</strong> is built-in, uses a flattened <code>node_modules</code>, lockfile <code>package-lock.json</code>. <strong>yarn</strong> (classic and modern/Berry) popularised fast, deterministic installs and workspaces; modern yarn offers Plug'n'Play (no <code>node_modules</code>). <strong>pnpm</strong> stores every package version once in a global content-addressable store and links it into projects, saving huge amounts of disk and creating a stricter, non-flattened <code>node_modules</code> that prevents "phantom dependency" access to undeclared packages. Each has its own lockfile — do not mix clients in one repo, or you'll get competing lockfiles.</p>`,
        `<p><strong>Publishing basics.</strong> To share a package: ensure <code>name</code>/<code>version</code> are set and the version is bumped (use <code>npm version patch|minor|major</code>, which updates <code>package.json</code> and creates a git tag), authenticate with <code>npm login</code>, control what ships with the <code>files</code> allowlist (or <code>.npmignore</code>), preview the tarball with <code>npm pack --dry-run</code>, then run <code>npm publish</code> (add <code>--access public</code> for a scoped public package). A <code>prepublishOnly</code> or <code>prepare</code> script commonly runs the build first.</p>`,
        `<p><strong>Auditing.</strong> <code>npm audit</code> compares your installed tree against the advisory database and reports known vulnerabilities by severity. <code>npm audit fix</code> upgrades within your ranges automatically; <code>--force</code> allows breaking upgrades (review carefully). Audit is advisory — not every finding is exploitable in your usage — but it is a fast first pass and belongs in CI.</p>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. Scripts with pre/post hooks and local binaries.</strong></p>`,
        `<pre><code class="language-json">{
  "scripts": {
    "clean": "rimraf dist",
    "prebuild": "npm run clean",
    "build": "tsc -p tsconfig.json",
    "postbuild": "cp -r public dist/public",
    "dev": "node --watch src/index.js",
    "test": "node --test",
    "lint": "eslint ."
  }
}</code></pre>`,
        `<p><strong>2. Running scripts and forwarding args.</strong></p>`,
        `<pre><code class="language-javascript">// npm run build        -> runs prebuild, build, postbuild in order
// npm test             -> shorthand for \`npm run test\`
// npm run test -- --watch   // forwards --watch to node --test
// npm run lint -- --fix     // forwards --fix to eslint</code></pre>`,
        `<p><strong>3. npx for one-off tools.</strong></p>`,
        `<pre><code class="language-javascript">// Scaffold a project without a global install:
//   npx create-vite@latest my-app
// Run a specific version once:
//   npx prettier@3.3.3 --check "src/**/*.js"
// Uses local node_modules/.bin if the tool is already installed.</code></pre>`,
        `<p><strong>4. Publish flow and audit.</strong></p>`,
        `<pre><code class="language-javascript">// One-time: npm login
// Bump version (also creates a git tag):
//   npm version patch        // 1.4.0 -> 1.4.1
// Preview exactly what will be published:
//   npm pack --dry-run
// Publish (scoped public package):
//   npm publish --access public
// Security pass:
//   npm audit                 // report
//   npm audit fix             // safe upgrades within ranges</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>
          <li><strong>Forgetting <code>--</code> when passing flags.</strong> <code>npm run test --watch</code> gives the flag to npm, not your script. Use <code>npm run test -- --watch</code>.</li>
          <li><strong>Global installs of project tools.</strong> Leads to version mismatches across machines. Install locally and call via scripts or <code>npx</code>.</li>
          <li><strong>Mixing package managers.</strong> Running <code>yarn</code> then <code>npm install</code> creates two lockfiles and inconsistent trees. Pick one client per repo.</li>
          <li><strong>Ignoring <code>postinstall</code> risk.</strong> Untrusted dependencies can run code at install time; audit deps and consider <code>--ignore-scripts</code> in CI for sensitive builds.</li>
          <li><strong>Using <code>&amp;</code> for parallel scripts.</strong> Not portable to Windows; use <code>npm-run-all -p</code> or <code>concurrently</code>.</li>
          <li><strong>Publishing more than intended.</strong> Without a <code>files</code> allowlist you may ship source, tests, or secrets. Preview with <code>npm pack --dry-run</code>.</li>
          <li><strong>Publishing a scoped package without <code>--access public</code>.</strong> It fails or publishes privately unexpectedly.</li>
          <li><strong>Treating every audit finding as critical.</strong> Advisories may not apply to your code path; assess severity and reachability, and avoid blind <code>audit fix --force</code>, which can introduce breaking major upgrades.</li>
        </ul>`,

        `<h2>Best practices</h2>`,
        `<ul>
          <li>Standardise on a small set of scripts (<code>dev</code>, <code>build</code>, <code>test</code>, <code>lint</code>, <code>start</code>) so every project feels the same.</li>
          <li>Install tools locally and invoke them through scripts/<code>npx</code>; avoid global installs of project dependencies.</li>
          <li>Use pre/post hooks for setup and teardown instead of pulling in a heavier task runner.</li>
          <li>Pick one package manager per repo and commit only its lockfile; consider pnpm for large monorepos to save disk and catch phantom deps.</li>
          <li>Run <code>npm audit</code> (and dependency review) in CI; keep dependencies few and reputable to shrink the attack surface.</li>
          <li>Before publishing: bump with <code>npm version</code>, gate the build behind <code>prepublishOnly</code>/<code>prepare</code>, restrict output with <code>files</code>, and dry-run with <code>npm pack</code>.</li>
          <li>In CI/Docker use <code>npm ci</code> for reproducibility; add <code>--ignore-scripts</code> where install-time code execution is a concern.</li>
        </ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: How do npm script lifecycle hooks work?</strong> For any script <code>x</code>, npm runs <code>prex</code> before and <code>postx</code> after automatically if defined. Reserved lifecycle names (<code>preinstall</code>/<code>postinstall</code>, <code>prepare</code>, <code>prepublishOnly</code>) fire during install and publish. That is how <code>npm run build</code> can run clean → compile → copy without a task runner.</p></blockquote>`,
        `<blockquote><p><strong>Q: Difference between <code>npm install pkg</code> and <code>npx pkg</code>?</strong> <code>npm install</code> adds the package to <code>node_modules</code> and <code>package.json</code> for repeated use. <code>npx</code> executes a package's binary once — using a local copy if present, otherwise downloading to a temp cache and discarding it — ideal for scaffolders and one-off tools.</p></blockquote>`,
        `<blockquote><p><strong>Q: How does <code>npm run build</code> find <code>tsc</code> without a global install?</strong> npm prepends <code>node_modules/.bin</code> to <code>PATH</code> when running a script. That folder contains executables for locally-installed packages (from each package's <code>bin</code> field), so bare tool names resolve to the project-local, version-pinned copies.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why are <code>postinstall</code> scripts a security risk?</strong> They run automatically on <code>npm install</code>, so a malicious dependency executes arbitrary code on your machine or CI at install time — a supply-chain attack. Mitigate with dependency review, lockfile pinning, and <code>--ignore-scripts</code> in sensitive environments.</p></blockquote>`,
        `<blockquote><p><strong>Q: npm vs yarn vs pnpm — what actually differs?</strong> They share <code>package.json</code> but differ in storage and lockfiles. npm flattens <code>node_modules</code> (<code>package-lock.json</code>). pnpm uses a global content-addressable store with symlinks — big disk savings and a strict layout that blocks phantom (undeclared) dependencies. yarn added fast installs, workspaces, and optional Plug'n'Play (no <code>node_modules</code>). Don't mix them in one repo.</p></blockquote>`,
        `<blockquote><p><strong>Q: Walk through publishing a package safely.</strong> <code>npm login</code>; bump with <code>npm version patch|minor|major</code> (updates version + git tag); restrict output via the <code>files</code> allowlist; build in a <code>prepublishOnly</code>/<code>prepare</code> script; preview with <code>npm pack --dry-run</code>; then <code>npm publish</code> (<code>--access public</code> for scoped). Run <code>npm audit</code> beforehand.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>
          <li><strong>Run scripts:</strong> <code>npm run x</code>; <code>start</code>/<code>test</code>/<code>stop</code>/<code>restart</code> skip <code>run</code>.</li>
          <li><strong>Hooks:</strong> <code>prex</code> → <code>x</code> → <code>postx</code> auto-fire; reserved: <code>postinstall</code>, <code>prepare</code>, <code>prepublishOnly</code>.</li>
          <li><strong>Pass flags:</strong> <code>npm run x -- --flag</code>.</li>
          <li><strong>Local bins:</strong> npm adds <code>node_modules/.bin</code> to PATH.</li>
          <li><strong>npx</strong> = run a binary once (local first, else temp download).</li>
          <li><strong>pnpm</strong> = shared store + strict layout; <strong>yarn</strong> = workspaces/PnP; one client per repo.</li>
          <li><strong>Publish:</strong> <code>npm version</code> → <code>files</code> allowlist → <code>npm pack --dry-run</code> → <code>npm publish [--access public]</code>.</li>
          <li><strong>Security:</strong> <code>npm audit</code> / <code>audit fix</code>; <code>--ignore-scripts</code> for untrusted installs.</li>
        </ul>`,
      ].join('\n'),
    },
  ],
};
