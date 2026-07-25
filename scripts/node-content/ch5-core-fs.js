// Chapter 5 — Core Modules & File System (slug: core-fs, order 4)
// Node.js Backend Kit. Node v20+ / v22 accurate. fs/promises-first.
// Content authored as arrays of backtick strings joined with '\n'.

module.exports = {
  title: 'Core Modules & File System',
  slug: 'core-fs',
  order: 4,
  topics: [
    // ───────────────────────────── 0. fs-module ─────────────────────────────
    {
      title: 'The fs Module: Reading & Writing Files',
      slug: 'fs-module',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Almost every real backend touches the file system. You read a config file at boot, stream an uploaded avatar to disk, write structured logs, generate a PDF invoice, cache a rendered template, or serve a static asset. Node's built-in <code>fs</code> module is the single door to all of that, and how you open that door decides whether your server stays responsive under load or freezes for every user at once.</p>`,
        `<p>The <code>fs</code> module is also the place where the difference between <em>blocking</em> and <em>non-blocking</em> code becomes concrete and unforgiving. JavaScript on the server runs your application logic on a single main thread. A file read that blocks that thread does not just slow down the one request that asked for the file &mdash; it stops <em>every</em> concurrent request, every timer, and every incoming connection until the disk answers. Interviewers probe <code>fs</code> precisely because it is where candidates reveal whether they truly understand Node's execution model or have only memorised syntax. Getting this right is foundational; getting it wrong quietly caps your throughput at one slow disk operation at a time.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>The <code>fs</code> module ships in three flavours that do the same jobs with different control flow. <strong>Synchronous</strong> methods (<code>readFileSync</code>) run to completion and return the result directly, blocking the thread while they wait. <strong>Callback</strong> methods (<code>fs.readFile(path, cb)</code>) hand the work to Node's internal thread pool and call you back later with an error-first callback. <strong>Promise</strong> methods, imported from <code>node:fs/promises</code>, do the same non-blocking work but return a promise you can <code>await</code>, which reads like synchronous code but never blocks.</p>`,
        `<p>The mental model: sync is a phone call where you hold the line until you have your answer; async is texting a request and getting on with your day until a reply buzzes back. On a server serving many people, you always want the second one.</p>`,
        `{{fig:ch5-fs-async-flow.svg|Three columns comparing readFileSync, callback readFile, and fs/promises readFile|The same file read expressed three ways. Only the sync form freezes the thread; both async forms keep the event loop free.}}`,
        `<h2>How it works (deep)</h2>`,
        `<p>When you call an asynchronous <code>fs</code> method, Node does not read the file on the main thread. File-system calls are handed to <strong>libuv</strong>, the C library underneath Node, which maintains a small pool of worker threads (four by default, tunable with the <code>UV_THREADPOOL_SIZE</code> environment variable). A worker performs the actual blocking <code>read()</code> or <code>write()</code> syscall while your main thread keeps running other JavaScript. When the worker finishes, libuv queues your callback (or resolves your promise) so the event loop can run it on the next available tick. This is why "non-blocking" is accurate from JavaScript's point of view even though the underlying OS call is blocking &mdash; the blocking simply happens on a thread that is not yours.</p>`,
        `<p>Synchronous methods skip all of that. <code>readFileSync</code> performs the syscall directly on the main thread and does not return until the kernel hands back the bytes. During that window nothing else in your process advances: no HTTP requests are accepted, no timers fire, no promises resolve. On a laptop reading a 2&nbsp;KB config this is microseconds and invisible; under a server handling hundreds of requests per second against a slow network drive it is a self-inflicted outage.</p>`,
        `{{fig:ch5-fs-blocking.svg|Timeline showing readFileSync stalling all requests versus async serving other requests during the disk wait|Sync I/O serialises everyone behind the disk. Async lets the single thread serve other requests while the read is in flight.}}`,
        `<p>The <code>fs/promises</code> API is not a thin wrapper you bolt on yourself &mdash; it is a first-class, separately maintained surface (<code>node:fs/promises</code>) that returns native promises directly from libuv completions. Under the hood it uses the same thread pool as the callback API, so it carries no extra cost; it simply gives you <code>async/await</code> ergonomics, real <code>try/catch</code> error handling, and clean composition with other async work. For code written today, it is the default you should reach for.</p>`,
        `<p>One more layer worth knowing: reading an entire file with <code>readFile</code> buffers the whole thing into memory before you see a single byte. That is perfect for small files but ruinous for large ones &mdash; a 2&nbsp;GB file becomes a 2&nbsp;GB allocation. For large or unbounded data you switch to <strong>streams</strong> (<code>fs.createReadStream</code> / <code>createWriteStream</code>), which move data in small chunks with built-in back-pressure so memory stays flat regardless of file size.</p>`,
        `<h2>Code examples</h2>`,
        `<p>Reading and writing with the modern promise API, with proper error handling:</p>`,
        `<pre><code class="language-javascript">import { readFile, writeFile } from 'node:fs/promises';

async function loadConfig() {
  try {
    const raw = await readFile('config.json', 'utf8'); // string, not Buffer
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // File missing: fall back to defaults instead of crashing.
      return { port: 3000 };
    }
    throw err; // Anything else (permissions, corrupt JSON) is a real error.
  }
}

async function saveConfig(cfg) {
  await writeFile('config.json', JSON.stringify(cfg, null, 2), 'utf8');
}
</code></pre>`,
        `<p>Passing the <code>'utf8'</code> encoding makes <code>readFile</code> return a decoded string. Omit it and you get a raw <code>Buffer</code> instead &mdash; useful for binary data, wrong for JSON parsing.</p>`,
        `<p>Appending log lines, creating directories, and checking existence the right way:</p>`,
        `<pre><code class="language-javascript">import { appendFile, mkdir, access, constants } from 'node:fs/promises';

// mkdir with recursive:true is idempotent — safe to call every boot.
await mkdir('logs', { recursive: true });

// Append never truncates; it creates the file if absent.
await appendFile('logs/app.log', \`\${new Date().toISOString()} started\\n\`);

// Prefer trying the operation over checking first (see gotchas: TOCTOU).
async function canRead(path) {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}
</code></pre>`,
        `<p>Streaming a large file instead of buffering it, using the pipeline helper that wires up back-pressure and error propagation for you:</p>`,
        `<pre><code class="language-javascript">import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';

// Compress a 5 GB file with flat memory — chunks flow through, nothing buffers.
await pipeline(
  createReadStream('backup.tar'),
  createGzip(),
  createWriteStream('backup.tar.gz')
);
console.log('done — memory stayed constant regardless of file size');
</code></pre>`,
        `<p>Watching a file for changes, for a dev-time reload or a config hot-reload:</p>`,
        `<pre><code class="language-javascript">import { watch } from 'node:fs/promises';

// Async-iterator watcher: clean, cancellable with an AbortSignal.
const ac = new AbortController();
setTimeout(() => ac.abort(), 60_000); // stop watching after a minute

try {
  for await (const event of watch('config.json', { signal: ac.signal })) {
    console.log('config changed:', event.eventType);
  }
} catch (err) {
  if (err.name !== 'AbortError') throw err;
}
</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Using <code>*Sync</code> methods inside a request handler.</strong> It works in every test with one user and collapses under real concurrency because it blocks the whole event loop. Sync is fine at startup or in CLI scripts; it is a bug in a hot server path.</li>`,
        `<li><strong>Forgetting the encoding and being surprised by a <code>Buffer</code>.</strong> <code>await readFile('x.txt')</code> returns a <code>Buffer</code>; <code>JSON.parse</code> on it happens to work (it stringifies) but <code>.trim()</code> or string comparisons will not behave as expected. Pass <code>'utf8'</code> when you want text.</li>`,
        `<li><strong>The check-then-act (TOCTOU) race.</strong> Calling <code>existsSync</code> or <code>access</code> and <em>then</em> reading/writing invites a race: the file can vanish or appear between the two calls. Just attempt the operation and handle the error code (<code>ENOENT</code>, <code>EEXIST</code>). <code>fs.exists</code> is deprecated for exactly this reason.</li>`,
        `<li><strong>Swallowing the error-first callback's first argument.</strong> In callback style, <code>(err, data) =&gt; { use(data) }</code> that ignores <code>err</code> will read <code>undefined</code> data and crash later with a confusing stack. Always check <code>err</code> first.</li>`,
        `<li><strong>Reading a huge file with <code>readFile</code>.</strong> It allocates the entire file in memory at once. A few concurrent large reads can OOM the process. Stream anything that is not comfortably small and bounded.</li>`,
        `<li><strong>Assuming <code>writeFile</code> is atomic.</strong> A crash mid-write can leave a truncated file. For durability, write to a temp file and <code>rename</code> it into place &mdash; <code>rename</code> is atomic on the same filesystem.</li>`,
        `<li><strong>Relative paths depending on the current working directory.</strong> <code>readFile('data.json')</code> resolves against <code>process.cwd()</code>, not the file's own folder, so it breaks when the process is launched from elsewhere. Anchor paths to <code>import.meta.dirname</code> (or <code>__dirname</code>).</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Default to <code>node:fs/promises</code> with <code>async/await</code>.</strong> It is non-blocking, composes cleanly, and gives you real <code>try/catch</code>.</li>`,
        `<li><strong>Reserve <code>*Sync</code> for startup and scripts.</strong> Loading config before the server listens, or one-off CLI tooling, is exactly where sync is acceptable and even clearer.</li>`,
        `<li><strong>Stream anything large or of unknown size,</strong> using <code>stream/promises</code> <code>pipeline</code> so errors and back-pressure are handled for you.</li>`,
        `<li><strong>Branch on <code>err.code</code>, not on message strings.</strong> Codes like <code>ENOENT</code>, <code>EACCES</code>, <code>EEXIST</code> are stable; human-readable messages are not.</li>`,
        `<li><strong>Build paths with the <code>path</code> module and anchor to <code>import.meta.dirname</code>,</strong> never by concatenating strings with <code>/</code>.</li>`,
        `<li><strong>Write-then-rename for files that must not be seen half-written.</strong> Temp file plus atomic <code>rename</code> gives you crash-safety cheaply.</li>`,
        `<li><strong>Prefer attempting an operation over pre-checking existence,</strong> to avoid TOCTOU races and an extra syscall.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: What is the real difference between <code>fs.readFileSync</code> and <code>fs.readFile</code>?</strong> <code>readFileSync</code> blocks the main thread until the OS returns the bytes, so nothing else in the process runs meanwhile. <code>readFile</code> hands the work to libuv's thread pool and invokes your callback later, keeping the event loop free to serve other requests. The trap is claiming sync is "faster" &mdash; for one isolated read the latency is similar, but on a server sync destroys concurrency.</p></blockquote>`,
        `<blockquote><p><strong>Q: If Node is single-threaded, how does async file I/O actually run in parallel?</strong> Your JavaScript is single-threaded, but I/O is delegated to libuv's thread pool (default size 4). Those worker threads perform the blocking syscalls; when they finish, the completion callback is queued back onto the single main thread. So the parallelism is in the C layer, not in your JS.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why prefer <code>fs/promises</code> over the callback API if they use the same thread pool?</strong> They have identical performance because the mechanism is the same. The win is purely ergonomic: <code>await</code> avoids callback nesting, <code>try/catch</code> handles errors naturally, and it composes with other promises. There is no runtime downside.</p></blockquote>`,
        `<blockquote><p><strong>Q: You must read a 4&nbsp;GB file and transform it. How?</strong> Never <code>readFile</code> it &mdash; that would try to allocate 4&nbsp;GB. Use <code>createReadStream</code> and process chunks, ideally via <code>pipeline</code> so back-pressure and error handling are automatic. Memory stays flat regardless of file size.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you check if a file exists before reading it?</strong> The trick answer: usually you should not. Pre-checking with <code>access</code>/<code>existsSync</code> then reading opens a TOCTOU race and costs an extra syscall. Just <code>readFile</code> and catch <code>err.code === 'ENOENT'</code>. This shows you understand races, not just APIs.</p></blockquote>`,
        `<blockquote><p><strong>Q: How would you make a config write crash-safe?</strong> Write to a temporary file in the same directory, then <code>rename</code> it over the target. <code>rename</code> within one filesystem is atomic, so a reader ever sees either the old file or the fully new one, never a truncated write.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><code>import { readFile, writeFile } from 'node:fs/promises'</code> &mdash; the default modern API.</li>`,
        `<li>Pass <code>'utf8'</code> for a string; omit it for a raw <code>Buffer</code>.</li>`,
        `<li>Async = libuv thread pool (default 4, set <code>UV_THREADPOOL_SIZE</code>); main thread stays free.</li>`,
        `<li><code>*Sync</code> only at startup / in scripts &mdash; never in a request handler.</li>`,
        `<li>Large or unbounded data &rarr; <code>createReadStream</code> + <code>pipeline</code>, not <code>readFile</code>.</li>`,
        `<li>Switch on <code>err.code</code>: <code>ENOENT</code> (missing), <code>EACCES</code> (permissions), <code>EEXIST</code> (already there).</li>`,
        `<li><code>mkdir(dir, { recursive: true })</code> is idempotent; <code>appendFile</code> creates + never truncates.</li>`,
        `<li>Crash-safe write = temp file + atomic <code>rename</code>.</li>`,
        `<li>Anchor paths to <code>import.meta.dirname</code>, never <code>process.cwd()</code>.</li>`,
        `</ul>`
      ].join('\n')
    },

    // ───────────────────────────── 1. path-os-url ─────────────────────────────
    {
      title: 'path, os & URL: Portable Filesystem and Environment Info',
      slug: 'path-os-url',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Code that hand-builds file paths by gluing strings together with <code>'/'</code> is a bug waiting for a Windows machine, a trailing slash, or a <code>..</code> in user input. The <code>path</code> module exists so you never have to think about those edge cases: it joins, resolves, and dissects paths correctly on every operating system. Alongside it, <code>os</code> tells you about the machine you are running on &mdash; CPU count, free memory, platform, temp directory &mdash; which you need for sizing worker pools, choosing scratch space, and logging diagnostics. And the WHATWG <code>URL</code> class parses and builds URLs safely, replacing the error-prone string-splitting that leads to security holes.</p>`,
        `<p>These three modules are unglamorous but they show up in nearly every backend, and interviewers use them to separate people who understand portability and safe parsing from those who improvise. A single <code>path.join</code> in the right place is the difference between code that runs identically on your Mac, your Linux server, and a teammate's Windows box.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p><strong><code>path</code></strong> manipulates path <em>strings</em> &mdash; it never touches the disk. <code>join</code> concatenates segments with the correct separator and collapses redundant slashes. <code>resolve</code> produces an absolute path by walking from right to left until it has one. <code>basename</code>, <code>dirname</code>, <code>extname</code>, and <code>parse</code> pull a path apart into its pieces. <strong><code>os</code></strong> reports facts about the host: <code>os.cpus()</code>, <code>os.freemem()</code>, <code>os.platform()</code>, <code>os.tmpdir()</code>, <code>os.hostname()</code>. <strong><code>URL</code></strong> (a global, no import needed) parses a URL string into structured parts &mdash; <code>protocol</code>, <code>hostname</code>, <code>pathname</code>, <code>searchParams</code> &mdash; and lets you build and mutate URLs without manual escaping.</p>`,
        `{{fig:ch5-path-anatomy.svg|A file path broken into dirname, basename, name, and ext parts|path.parse() decomposes a path into dir, base, name, and ext in one call — no manual string splitting.}}`,
        `<h2>How it works (deep)</h2>`,
        `<p>The key insight about <code>path</code> is that it is <em>platform-aware</em>. On POSIX systems the separator is <code>/</code>; on Windows it is <code>\\</code> (and both are accepted on input). <code>path.join('a', 'b')</code> yields <code>a/b</code> on Linux and <code>a\\b</code> on Windows automatically. If you ever need to force one behaviour regardless of host, <code>path.posix</code> and <code>path.win32</code> give you the platform-specific variants explicitly &mdash; handy when constructing URL-style paths that must always use forward slashes.</p>`,
        `<p><code>join</code> versus <code>resolve</code> trips people up. <code>join</code> simply concatenates and normalises: <code>path.join('/a', 'b', '..', 'c')</code> gives <code>/a/c</code>. <code>resolve</code> builds an <em>absolute</em> path by processing arguments right-to-left, prepending <code>process.cwd()</code> only if it has not yet reached an absolute segment: <code>path.resolve('b', 'c')</code> gives <code>/current/working/dir/b/c</code>, while <code>path.resolve('/a', 'b')</code> gives <code>/a/b</code> because <code>/a</code> is already absolute and short-circuits the walk. Rule of thumb: use <code>join</code> to stitch known relative pieces, use <code>resolve</code> when you need a guaranteed absolute path.</p>`,
        `<p>The <code>os</code> module reads from the operating system at call time. <code>os.cpus()</code> returns one entry per logical core, which is the canonical way to size a cluster or worker pool. <code>os.tmpdir()</code> returns the correct scratch directory for the platform (respecting <code>TMPDIR</code>/<code>TEMP</code> env vars), so temp files land somewhere writable and auto-cleaned rather than in your project folder. <code>os.platform()</code> returns <code>'linux'</code>, <code>'darwin'</code>, or <code>'win32'</code> &mdash; useful for platform branches, though you should lean on cross-platform APIs before branching.</p>`,
        `<p>The <code>URL</code> class implements the WHATWG URL Standard &mdash; the exact same parser browsers use &mdash; so its behaviour is precisely specified and consistent. <code>new URL(str)</code> throws on an invalid absolute URL, which is a feature: it fails loudly instead of silently mis-parsing. <code>searchParams</code> is a live <code>URLSearchParams</code> object that handles percent-encoding for you: <code>url.searchParams.get('q')</code> returns the decoded value, and <code>set</code>/<code>append</code> re-encode correctly. The legacy <code>querystring</code> module and the old <code>url.parse()</code> function still exist but are effectively superseded &mdash; <code>URL</code> and <code>URLSearchParams</code> are the standard, safer choice for new code.</p>`,
        `<p>Beyond <code>join</code> and <code>resolve</code>, a handful of smaller <code>path</code> helpers earn their keep once you internalise them. <code>path.normalize</code> collapses <code>.</code>, <code>..</code>, and duplicate separators <em>without</em> making the path absolute &mdash; it is the string clean-up half of <code>resolve</code>. <code>path.isAbsolute</code> answers the platform-specific question the right way (on Windows, <code>C:\\x</code> and <code>\\\\server\\share</code> are absolute; a bare <code>/x</code> is not). <code>path.relative(from, to)</code> computes the <code>..</code>-laden hop from one location to another, which is how build tools print tidy relative paths. And two constants matter for cross-platform correctness: <code>path.sep</code> is the segment separator (<code>/</code> or <code>\\</code>), while <code>path.delimiter</code> is the <em>list</em> separator used inside variables like <code>PATH</code> (<code>:</code> on POSIX, <code>;</code> on Windows) &mdash; splitting <code>process.env.PATH</code> on a hard-coded <code>':'</code> is a classic Windows bug.</p>`,
        `<p>It helps to see how the two main joiners diverge on identical inputs. The table below assumes a current working directory of <code>/home/app</code> on a POSIX host:</p>`,
        `<table>`,
        `<thead><tr><th>Call</th><th>Result</th><th>Why</th></tr></thead>`,
        `<tbody>`,
        `<tr><td><code>path.join('a', 'b', 'c')</code></td><td><code>a/b/c</code></td><td>Concatenates; stays relative.</td></tr>`,
        `<tr><td><code>path.join('/a', '/b')</code></td><td><code>/a/b</code></td><td>A leading slash on a later arg is just a separator, not a reset.</td></tr>`,
        `<tr><td><code>path.resolve('a', 'b')</code></td><td><code>/home/app/a/b</code></td><td>Prepends <code>cwd</code> to reach an absolute path.</td></tr>`,
        `<tr><td><code>path.resolve('/a', 'b')</code></td><td><code>/a/b</code></td><td>The absolute <code>/a</code> short-circuits the right-to-left walk.</td></tr>`,
        `<tr><td><code>path.resolve('/a', '/b')</code></td><td><code>/b</code></td><td>The <em>last</em> absolute arg wins; earlier ones are discarded.</td></tr>`,
        `<tr><td><code>path.normalize('a//b/../c')</code></td><td><code>a/c</code></td><td>Cleans separators and <code>..</code> without going absolute.</td></tr>`,
        `</tbody>`,
        `</table>`,
        `<h2>Code examples</h2>`,
        `<p>Building paths portably and anchoring to the current module's directory:</p>`,
        `<pre><code class="language-javascript">import path from 'node:path';
import { readFile } from 'node:fs/promises';

// import.meta.dirname (Node 20.11+) is the folder THIS file lives in.
const dataFile = path.join(import.meta.dirname, 'data', 'users.json');

const users = JSON.parse(await readFile(dataFile, 'utf8'));

// join vs resolve
path.join('/var', 'log', '..', 'www');   // '/var/www'
path.resolve('src', 'index.js');          // '/abs/cwd/src/index.js'
path.resolve('/etc', 'src');              // '/etc/src' (abs arg short-circuits)
</code></pre>`,
        `<p>Decomposing a path and safely swapping an extension:</p>`,
        `<pre><code class="language-javascript">import path from 'node:path';

const p = '/home/app/reports/q3.csv';
path.basename(p);          // 'q3.csv'
path.basename(p, '.csv');  // 'q3'  (strips the given suffix)
path.dirname(p);           // '/home/app/reports'
path.extname(p);           // '.csv'
path.parse(p);
// { root:'/', dir:'/home/app/reports', base:'q3.csv', name:'q3', ext:'.csv' }

// Change the extension the correct way:
const asJson = path.format({ ...path.parse(p), base: undefined, ext: '.json' });
// '/home/app/reports/q3.json'
</code></pre>`,
        `<p>Reading machine info to size a worker pool and pick scratch space:</p>`,
        `<pre><code class="language-javascript">import os from 'node:os';
import path from 'node:path';

const workers = os.cpus().length;                 // one per logical core
const scratch = path.join(os.tmpdir(), 'myapp');  // correct temp dir per OS

console.log({
  platform: os.platform(),      // 'linux' | 'darwin' | 'win32'
  cores: workers,
  freeMemMB: Math.round(os.freemem() / 1024 / 1024),
  home: os.homedir(),
});
</code></pre>`,
        `<p>Parsing and building URLs with the WHATWG API instead of string surgery:</p>`,
        `<pre><code class="language-javascript">const u = new URL('https://api.example.com/v2/search?q=node+fs&page=2');

u.protocol;                    // 'https:'
u.hostname;                    // 'api.example.com'
u.pathname;                    // '/v2/search'
u.searchParams.get('q');       // 'node fs'  (decoded automatically)
u.searchParams.get('page');    // '2'

// Mutate safely — encoding is handled for you:
u.searchParams.set('page', '3');
u.searchParams.append('sort', 'date');
u.toString(); // '...?q=node+fs&page=3&sort=date'

// Resolve a relative URL against a base (great for API clients):
new URL('../users', 'https://api.example.com/v2/search').href;
// 'https://api.example.com/users'
</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Concatenating paths with <code>'/'</code> or template strings.</strong> It breaks on Windows and mishandles trailing slashes and <code>..</code>. Always use <code>path.join</code>/<code>path.resolve</code>.</li>`,
        `<li><strong>Confusing <code>join</code> and <code>resolve</code>.</strong> <code>join</code> just concatenates; <code>resolve</code> guarantees an absolute path and short-circuits on the first absolute argument (right-to-left). Reaching for the wrong one gives subtly wrong paths.</li>`,
        `<li><strong>Path traversal from user input.</strong> <code>path.join(uploadDir, req.body.name)</code> where <code>name</code> is <code>'../../etc/passwd'</code> escapes your directory. Resolve the full path and verify it still starts with the intended base directory before touching it.</li>`,
        `<li><strong>Assuming <code>__dirname</code> exists in ES modules.</strong> In ESM there is no <code>__dirname</code>/<code>__filename</code>. Use <code>import.meta.dirname</code>/<code>import.meta.filename</code> (Node 20.11+), or derive them from <code>import.meta.url</code>.</li>`,
        `<li><strong>Using the legacy <code>url.parse()</code>.</strong> It is lenient in unsafe ways and predates the WHATWG standard. Prefer <code>new URL()</code>, which rejects malformed input.</li>`,
        `<li><strong>Manually encoding query strings.</strong> Hand-rolled <code>encodeURIComponent</code> concatenation drifts from spec. <code>URLSearchParams</code> encodes and decodes correctly, including repeated keys and spaces.</li>`,
        `<li><strong>Treating <code>os.freemem()</code> as "available" memory.</strong> On Linux free memory excludes reclaimable cache, so it can look alarmingly low while the system is healthy. It is a rough signal, not a capacity planner.</li>`,
        `<li><strong>Splitting <code>PATH</code> (or any list env var) on a hard-coded <code>':'</code>.</strong> Windows separates <code>PATH</code> entries with <code>;</code>, so <code>process.env.PATH.split(':')</code> mangles drive letters like <code>C:</code>. Split on <code>path.delimiter</code> instead, and join segments with <code>path.sep</code>.</li>`,
        `<li><strong>Assuming <code>path.win32</code> paths behave on POSIX (and vice-versa).</strong> The active <code>path</code> API follows the host OS. If you must parse or build the <em>other</em> platform's paths &mdash; e.g. handling a Windows path on a Linux CI runner &mdash; reach for <code>path.win32.*</code> or <code>path.posix.*</code> explicitly rather than trusting the default.</li>`,
        `<li><strong>Forgetting that a WHATWG <code>URL</code> needs a base for relative inputs.</strong> <code>new URL('/v2/users')</code> throws because it is not absolute; pass a base as the second argument (<code>new URL('/v2/users', origin)</code>) or the parse fails.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Never build a path by hand;</strong> always go through <code>path.join</code>/<code>resolve</code> so the code is portable by construction.</li>`,
        `<li><strong>Anchor file access to <code>import.meta.dirname</code></strong> (or <code>__dirname</code> in CommonJS), not <code>process.cwd()</code>, so it works no matter where the process is launched.</li>`,
        `<li><strong>Validate resolved user paths against a base directory</strong> before reading or writing, to block traversal attacks.</li>`,
        `<li><strong>Size pools with <code>os.cpus().length</code></strong> rather than hard-coding a worker count.</li>`,
        `<li><strong>Write temp files under <code>os.tmpdir()</code>,</strong> never inside your project or CWD.</li>`,
        `<li><strong>Use <code>new URL()</code> and <code>URLSearchParams</code> for all URL work;</strong> let the standard parser handle encoding and validation.</li>`,
        `<li><strong>Use <code>path.posix</code> explicitly</strong> when you need forward-slash paths regardless of host (e.g. building URL paths on Windows).</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: Why use <code>path.join</code> instead of just writing <code>dir + '/' + file</code>?</strong> Portability and correctness. <code>join</code> uses the OS-correct separator (<code>\\</code> on Windows), collapses duplicate slashes, and resolves <code>.</code>/<code>..</code> segments. String concatenation breaks across platforms and mishandles trailing slashes.</p></blockquote>`,
        `<blockquote><p><strong>Q: What is the difference between <code>path.join</code> and <code>path.resolve</code>?</strong> <code>join</code> concatenates and normalises segments, staying relative if the inputs are relative. <code>resolve</code> always produces an absolute path, processing arguments right-to-left and prepending <code>process.cwd()</code> only until it hits an absolute segment, which short-circuits the rest.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you prevent a path-traversal attack when joining user input?</strong> Resolve the final absolute path, then confirm it is still inside the intended base directory (e.g. <code>resolved.startsWith(baseDir + path.sep)</code>). If it escaped via <code>..</code>, reject it. Never trust the raw filename.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you get the current file's directory in an ES module?</strong> Use <code>import.meta.dirname</code> (Node 20.11+). There is no <code>__dirname</code> in ESM; older code derived it from <code>fileURLToPath(import.meta.url)</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why prefer the <code>URL</code> class over <code>querystring</code> or <code>url.parse()</code>?</strong> <code>URL</code>/<code>URLSearchParams</code> implement the WHATWG standard that browsers use, so parsing is consistent and encoding is handled correctly. <code>url.parse()</code> is legacy and lenient in unsafe ways; <code>querystring</code> is superseded by <code>URLSearchParams</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: How would you decide how many worker processes to spawn?</strong> Base it on <code>os.cpus().length</code> &mdash; typically one worker per logical core for CPU-bound work &mdash; rather than a hard-coded number, so it scales with the host.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><code>path.join(...)</code> = concatenate + normalise; <code>path.resolve(...)</code> = force absolute, right-to-left.</li>`,
        `<li><code>basename</code> / <code>dirname</code> / <code>extname</code> / <code>parse</code> / <code>format</code> dissect and rebuild paths.</li>`,
        `<li><code>path</code> only edits strings &mdash; it never hits the disk.</li>`,
        `<li>ESM: <code>import.meta.dirname</code> / <code>import.meta.filename</code> (no <code>__dirname</code>).</li>`,
        `<li><code>os.cpus().length</code> sizes pools; <code>os.tmpdir()</code> for scratch; <code>os.platform()</code> for branches.</li>`,
        `<li><code>new URL(str)</code> throws on bad input; <code>url.searchParams</code> decodes/encodes automatically.</li>`,
        `<li>Guard user paths: resolve, then check it still starts with the base dir.</li>`,
        `<li>Legacy <code>url.parse()</code> and <code>querystring</code> &rarr; use <code>URL</code> / <code>URLSearchParams</code>.</li>`,
        `</ul>`
      ].join('\n')
    },

    // ───────────────────────────── 2. buffer ─────────────────────────────
    {
      title: 'Buffer: Working with Binary Data',
      slug: 'buffer',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>JavaScript grew up in the browser handling text and objects, not raw bytes off a socket or disk. The server needs both. Every file you read, every TCP packet, every image upload, every cryptographic digest is fundamentally a sequence of bytes, and Node represents those bytes with the <code>Buffer</code> class. If you have ever wondered why <code>fs.readFile</code> without an encoding returns something that prints as <code>&lt;Buffer 48 69&gt;</code>, or why a multi-byte emoji breaks when you slice a chunk in half, the answer is buffers.</p>`,
        `<p>Understanding <code>Buffer</code> is what lets you handle uploads, parse binary protocols, convert between encodings, and reason about memory correctly. It is also a favourite interview topic because it exposes whether you understand the boundary between <em>bytes</em> and <em>characters</em> &mdash; a distinction that, when blurred, produces corrupted data, wrong lengths, and subtle security bugs. Buffers are where "it's just a string" stops being true.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A <code>Buffer</code> is a fixed-length chunk of raw memory holding bytes, each an integer from 0 to 255. It is Node's original binary type, built on top of the standard <code>Uint8Array</code> (in fact a <code>Buffer</code> <em>is</em> a <code>Uint8Array</code> with extra convenience methods). Unlike a JavaScript string, a buffer is not text and has no inherent character meaning &mdash; it is just bytes. To turn bytes into readable text, or text into bytes, you apply an <strong>encoding</strong> (<code>utf8</code>, <code>hex</code>, <code>base64</code>, <code>ascii</code>, <code>latin1</code>). The same bytes look completely different depending on which encoding you use to view them.</p>`,
        `{{fig:ch5-buffer-memory.svg|A two-byte buffer showing characters H and i as byte values, plus safe vs unsafe allocation|A Buffer is fixed raw bytes. alloc zero-fills for safety; allocUnsafe is faster but hands you old memory you must overwrite.}}`,
        `<h2>How it works (deep)</h2>`,
        `<p>Buffers live in memory allocated outside the main V8 JavaScript heap. This matters: it keeps large binary blobs from bloating the heap and pressuring the garbage collector, and it allows fast, zero-copy handoff to C++ and the OS during I/O. A buffer is backed by an <code>ArrayBuffer</code> &mdash; the raw memory &mdash; and the <code>Buffer</code> instance is a typed view over it.</p>`,
        `<p>The crucial property is that a buffer has a <strong>fixed length set at allocation</strong>. You cannot grow it. If you need more room you allocate a new, larger buffer and copy, or you collect chunks in an array and <code>Buffer.concat</code> them at the end. This is the opposite of a JavaScript string or array that grows on demand, and it is why streaming code accumulates chunks and joins once rather than appending repeatedly.</p>`,
        `<p>Allocation comes in two forms with a real safety difference. <code>Buffer.alloc(n)</code> returns <code>n</code> bytes <strong>zero-filled</strong> &mdash; safe and predictable. <code>Buffer.allocUnsafe(n)</code> is faster because it hands you a slice of previously used memory <em>without clearing it</em>, which means it may contain leftover data from earlier operations &mdash; potentially another request's secrets. It is safe only if you immediately overwrite every byte before reading or returning it. Use <code>alloc</code> by default; reach for <code>allocUnsafe</code> only in hot paths where you provably fill the whole buffer.</p>`,
        `<p>Encoding is where bytes meet characters, and it is the number-one source of buffer bugs. In <strong>UTF-8</strong>, ASCII characters take one byte but many characters take two, three, or four &mdash; an emoji like a face is four bytes. So <code>Buffer.byteLength(str)</code> (bytes) and <code>str.length</code> (UTF-16 code units) frequently disagree. Worse, if you split a UTF-8 byte stream at an arbitrary boundary &mdash; as happens between stream chunks &mdash; you can cut a multi-byte character in half, and decoding each half independently produces garbage. The fix is <code>string_decoder</code>'s <code>StringDecoder</code>, which buffers incomplete multi-byte sequences across chunk boundaries.</p>`,
        `{{fig:ch5-buffer-encodings.svg|The same four bytes shown decoded as utf8 text, hex, and base64|One buffer, three encodings. Encoding is how you interpret bytes for reading or writing — it does not change the underlying bytes.}}`,
        `<p>You typically encounter buffers whenever data crosses the process boundary as bytes: <code>fs</code> reads without an encoding, network sockets, <code>crypto</code> digests and random bytes, <code>zlib</code> compression, image and file processing, and any binary protocol. Text-first APIs hide buffers behind an encoding argument; drop the encoding and the buffer surfaces.</p>`,
        `<p>It is worth being precise about what each <strong>encoding label</strong> actually means, because they are not interchangeable views of the same idea. <code>'utf8'</code> is the real text codec &mdash; variable-width, 1&ndash;4 bytes per character, and the correct default for anything human-readable. <code>'hex'</code> and <code>'base64'</code> are <em>transport</em> encodings: they render arbitrary bytes as safe ASCII (2 hex chars or ~1.33 base64 chars per byte) so binary can ride through JSON, URLs, or headers &mdash; Node also accepts <code>'base64url'</code>, the URL-safe variant. <code>'latin1'</code> (a.k.a. <code>'binary'</code>) is a 1:1 byte-to-code-point map that never fails but silently corrupts real Unicode. <code>'ascii'</code> is 7-bit only and masks the high bit off every byte, so it mangles anything above <code>0x7F</code>. Choosing <code>'ascii'</code> or <code>'latin1'</code> for what is genuinely UTF-8 data is a common, quiet source of mojibake.</p>`,
        `<p>Two ownership details separate people who <em>use</em> buffers from people who <em>debug</em> them. First, <code>Buffer.from(arrayBuffer)</code> creates a <strong>view that shares</strong> the underlying <code>ArrayBuffer</code> &mdash; no copy &mdash; whereas <code>Buffer.from(string)</code> and <code>Buffer.from(array)</code> allocate fresh memory. Second, small buffers are quietly pooled: for allocations under <code>Buffer.poolSize &gt;&gt; 1</code> (4&nbsp;KB by default), <code>Buffer.allocUnsafe</code> and <code>Buffer.from</code> carve a slice out of a shared internal <code>ArrayBuffer</code>. That is why <code>buf.byteOffset</code> is often non-zero and why <code>buf.buffer</code> can be far larger than <code>buf.length</code> &mdash; the <code>Buffer</code> is a window onto a bigger pool, not a private allocation. If you hand <code>buf.buffer</code> to another API expecting the whole thing, you leak neighbouring buffers' bytes; always pass <code>buf.byteOffset</code> and <code>buf.byteLength</code> too.</p>`,
        `<h2>Code examples</h2>`,
        `<p>Creating buffers and converting between bytes and encodings:</p>`,
        `<pre><code class="language-javascript">// From text (defaults to utf8):
const buf = Buffer.from('Node');
buf;                       // <Buffer 4e 6f 64 65>
buf.length;                // 4 bytes
buf.toString('hex');       // '4e6f6465'
buf.toString('base64');    // 'Tm9kZQ=='
buf.toString('utf8');      // 'Node'

// Decode data that arrived in a different encoding:
const fromB64 = Buffer.from('Tm9kZQ==', 'base64');
fromB64.toString('utf8');  // 'Node'

// Safe vs fast allocation:
const zeroed = Buffer.alloc(8);        // <Buffer 00 00 00 00 00 00 00 00>
const fast   = Buffer.allocUnsafe(8);  // arbitrary leftover bytes — must fill!
fast.fill(0);                          // now safe to use
</code></pre>`,
        `<p>Why byte length and character length differ &mdash; the classic emoji trap:</p>`,
        `<pre><code class="language-javascript">const s = 'a\\u{1F600}';        // 'a' + a 4-byte emoji
s.length;                       // 3  (UTF-16 code units)
Buffer.byteLength(s, 'utf8');   // 5  (1 byte + 4 bytes)

// Slicing bytes blindly can cut a character in half:
const b = Buffer.from(s, 'utf8');
b.subarray(0, 2).toString('utf8'); // 'a\\uFFFD' — broken: half an emoji
</code></pre>`,
        `<p>Collecting stream chunks the right way &mdash; accumulate, then concat once:</p>`,
        `<pre><code class="language-javascript">import { createReadStream } from 'node:fs';

async function readAllBytes(path) {
  const chunks = [];
  for await (const chunk of createReadStream(path)) {
    chunks.push(chunk); // each chunk is a Buffer
  }
  return Buffer.concat(chunks); // single allocation at the end
}

// For text streams, decode across chunk boundaries safely:
import { StringDecoder } from 'node:string_decoder';
const decoder = new StringDecoder('utf8');
// decoder.write(chunk) holds back any partial multi-byte char until complete.
</code></pre>`,
        `<p>Reading and writing fixed-width binary fields (parsing a simple protocol header):</p>`,
        `<pre><code class="language-javascript">// Build a 4-byte big-endian header: version(1) + payloadLength(uint16) + flag(1)
const header = Buffer.alloc(4);
header.writeUInt8(2, 0);          // version = 2 at offset 0
header.writeUInt16BE(512, 1);     // length  = 512 at offset 1 (2 bytes)
header.writeUInt8(1, 3);          // flag    = 1 at offset 3

// Read it back:
header.readUInt8(0);     // 2
header.readUInt16BE(1);  // 512
</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Confusing <code>str.length</code> with byte length.</strong> <code>str.length</code> counts UTF-16 code units; bytes on the wire are <code>Buffer.byteLength(str, 'utf8')</code>. They differ for any non-ASCII text, which breaks <code>Content-Length</code> headers and offset math.</li>`,
        `<li><strong>Slicing a multi-byte character in half.</strong> Splitting UTF-8 bytes at a chunk boundary and decoding each half yields replacement characters (garbage). Use <code>StringDecoder</code> for streamed text.</li>`,
        `<li><strong>Using <code>allocUnsafe</code> without fully overwriting it.</strong> It exposes leftover memory &mdash; possibly another request's data &mdash; which is both a correctness and a security bug. Default to <code>alloc</code>.</li>`,
        `<li><strong>Trusting the deprecated <code>new Buffer()</code> constructor.</strong> <code>new Buffer(number)</code> historically returned uninitialised memory. It is deprecated; always use <code>Buffer.alloc</code>/<code>Buffer.from</code>.</li>`,
        `<li><strong>Building a big buffer by repeated <code>Buffer.concat</code> in a loop.</strong> Buffers cannot grow, so each concat reallocates and copies &mdash; O(n&sup2;). Push chunks into an array and <code>Buffer.concat</code> once.</li>`,
        `<li><strong>Assuming <code>buf.slice()</code> copies.</strong> Both <code>slice</code> and <code>subarray</code> return a <em>view</em> sharing the same memory &mdash; mutating one changes the other. Use <code>Buffer.from(buf)</code> for an independent copy.</li>`,
        `<li><strong>Forgetting endianness in binary protocols.</strong> <code>readUInt16BE</code> vs <code>readUInt16LE</code> read the same bytes as different numbers. Match the protocol's byte order exactly.</li>`,
        `<li><strong>Passing <code>buf.buffer</code> to another API without the offset and length.</strong> Because small buffers are pooled, <code>buf.buffer</code> is frequently a shared 8&nbsp;KB <code>ArrayBuffer</code>, not your bytes alone. Handing the bare <code>ArrayBuffer</code> to <code>new Uint8Array(buf.buffer)</code> or a crypto call exposes unrelated buffers' data. Always pass <code>buf.byteOffset</code> and <code>buf.byteLength</code>, or copy with <code>Buffer.from(buf)</code>.</li>`,
        `<li><strong>Reading multi-byte integers that exceed 48 bits with the <code>*BE</code>/<code>*LE</code> helpers.</strong> <code>readUInt32BE</code> is fine, but JavaScript numbers lose precision past 2^53, so 64-bit fields must use <code>readBigUInt64BE</code>/<code>LE</code> (which return a <code>BigInt</code>). Using the non-Big variants silently truncates.</li>`,
        `<li><strong>Picking <code>'ascii'</code> or <code>'latin1'</code> for text that is actually UTF-8.</strong> Both decode byte-per-character and never throw, so the bug is invisible until a non-ASCII character arrives and turns into mojibake. Use <code>'utf8'</code> for text and a transport encoding (<code>'hex'</code>/<code>'base64'</code>) for raw bytes.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Use <code>Buffer.alloc</code> and <code>Buffer.from</code>;</strong> never the deprecated <code>new Buffer()</code> constructor.</li>`,
        `<li><strong>Default to <code>alloc</code> (zero-filled);</strong> use <code>allocUnsafe</code> only in hot paths where you overwrite every byte.</li>`,
        `<li><strong>Measure wire size with <code>Buffer.byteLength(str, 'utf8')</code>,</strong> not <code>str.length</code>.</li>`,
        `<li><strong>Decode streamed text with <code>StringDecoder</code></strong> so multi-byte characters survive chunk boundaries.</li>`,
        `<li><strong>Accumulate chunks in an array and <code>Buffer.concat</code> once</strong> rather than concatenating repeatedly.</li>`,
        `<li><strong>Copy with <code>Buffer.from(buf)</code> when you need independence;</strong> remember <code>slice</code>/<code>subarray</code> share memory.</li>`,
        `<li><strong>Be explicit about encoding and endianness</strong> at every byte boundary &mdash; never let it default by accident.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: What is a Buffer and how does it differ from a string?</strong> A <code>Buffer</code> is a fixed-length region of raw bytes (0&ndash;255 each), stored outside the V8 heap and backed by an <code>ArrayBuffer</code>; it is a <code>Uint8Array</code> subclass. A string is text made of UTF-16 code units with character meaning. Buffers are bytes; strings are characters. You convert between them with an explicit encoding.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why is <code>allocUnsafe</code> "unsafe"?</strong> It skips zero-filling and hands you a slice of previously used memory, which may still hold sensitive data from earlier operations. If you read it before overwriting, you can leak that data. It is only safe when you immediately fill every byte, and it exists purely for performance.</p></blockquote>`,
        `<blockquote><p><strong>Q: <code>'caf\\u00e9'.length</code> is 4, but how many bytes is it in UTF-8?</strong> Five &mdash; the accented e is two bytes in UTF-8 while the other three are one each. This is why you must use <code>Buffer.byteLength</code> for anything that counts wire bytes, like <code>Content-Length</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: You read a stream in chunks and decode each with <code>chunk.toString()</code>; some characters are garbled. Why?</strong> A multi-byte UTF-8 character was split across two chunks, so each half decoded to a replacement character. Fix it with <code>StringDecoder</code>, which holds incomplete byte sequences until the next chunk completes them.</p></blockquote>`,
        `<blockquote><p><strong>Q: Does <code>buf.slice(0, 4)</code> copy the data?</strong> No. <code>slice</code> (and <code>subarray</code>) return a view over the same underlying memory, so mutating the slice mutates the original. Use <code>Buffer.from(buf.subarray(0,4))</code> for a real copy.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why are buffers stored off the V8 heap?</strong> To avoid bloating the JavaScript heap with large binary blobs and pressuring the garbage collector, and to allow zero-copy handoff to native code and the OS during I/O. It keeps binary-heavy workloads efficient.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><code>Buffer</code> = fixed-length raw bytes (0&ndash;255), a <code>Uint8Array</code> subclass, off the V8 heap.</li>`,
        `<li>Create: <code>Buffer.from(str)</code>, <code>Buffer.alloc(n)</code> (zeroed), <code>Buffer.allocUnsafe(n)</code> (fast, must fill).</li>`,
        `<li>Convert: <code>buf.toString('hex'|'base64'|'utf8')</code>; <code>Buffer.from(s, 'base64')</code>.</li>`,
        `<li>Bytes on the wire = <code>Buffer.byteLength(str,'utf8')</code>, not <code>str.length</code>.</li>`,
        `<li>Streamed text &rarr; <code>StringDecoder</code> to survive chunk splits.</li>`,
        `<li>Many chunks &rarr; array + one <code>Buffer.concat</code> (buffers can't grow).</li>`,
        `<li><code>slice</code>/<code>subarray</code> share memory; <code>Buffer.from(buf)</code> copies.</li>`,
        `<li>Binary fields: <code>readUInt16BE</code>/<code>LE</code> &mdash; mind endianness.</li>`,
        `<li>Never use deprecated <code>new Buffer()</code>.</li>`,
        `</ul>`
      ].join('\n')
    },

    // ───────────────────────────── 3. crypto ─────────────────────────────
    {
      title: 'crypto: Hashing, HMAC, Random & Encryption',
      slug: 'crypto',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Security bugs are the most expensive kind of bug, and cryptography is the one area where "it looks like it works" is worthless &mdash; a broken scheme runs perfectly and encrypts nothing meaningful. Node's built-in <code>crypto</code> module gives you battle-tested primitives (backed by OpenSSL) for hashing, message authentication, secure random generation, password storage, and encryption. Knowing which primitive solves which problem &mdash; and, just as important, which ones must <em>never</em> be used for a given job &mdash; is core backend competence.</p>`,
        `<p>Interviewers lean on <code>crypto</code> because it separates people who reach for the right tool from those who "just SHA-256 the password." The consequences of getting it wrong are concrete: leaked credentials, forgeable tokens, predictable IDs, timing attacks. You do not need to invent cryptography &mdash; you need to use these primitives correctly and know their boundaries. This topic is about exactly that judgement.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Four distinct jobs, four distinct tools. <strong>Hashing</strong> (<code>createHash</code>, e.g. SHA-256) turns any input into a fixed-size, one-way digest &mdash; used for integrity checks and deduplication, <em>not</em> secrecy. <strong>HMAC</strong> (<code>createHmac</code>) combines a hash with a secret key to prove a message came from someone who holds the key &mdash; used to sign and verify webhooks and tokens. <strong>Secure randomness</strong> (<code>randomBytes</code>, <code>randomUUID</code>) produces unpredictable values for tokens, salts, and IDs. <strong>Password hashing</strong> (<code>scrypt</code>, or argon2/bcrypt via libraries) is deliberately slow and salted, purpose-built to store passwords. <strong>Encryption</strong> (<code>createCipheriv</code> with AES-GCM) provides confidentiality with an authenticated tag, for data you must later read back.</p>`,
        `{{fig:ch5-crypto-hash.svg|Three columns comparing SHA-256 hashing, HMAC, and scrypt password hashing by purpose|Match the primitive to the job: fast digests for integrity, HMAC for authenticity, slow salted hashing for passwords. They are not interchangeable.}}`,
        `<h2>How it works (deep)</h2>`,
        `<p>A <strong>cryptographic hash</strong> is deterministic (same input, same digest), fixed-size (SHA-256 is always 32 bytes), one-way (you cannot reverse the digest to the input), and collision-resistant (finding two inputs with the same digest is infeasible). This makes it ideal for verifying that a file or message has not changed. It is disastrous for passwords, though, precisely <em>because</em> it is fast: an attacker with a leaked digest can try billions of guesses per second, and identical passwords produce identical digests, so rainbow tables crack them wholesale. Speed is a feature for integrity and a vulnerability for passwords.</p>`,
        `<p><strong>HMAC</strong> fixes a subtle problem with plain hashing for authentication. You cannot simply hash <code>secret + message</code> to sign it &mdash; that construction is vulnerable to length-extension attacks against Merkle&ndash;Damg&aring;rd hashes. HMAC's specific nested construction (hashing the key with inner and outer pads) is proven secure. When you receive a signed webhook, you recompute the HMAC over the raw body with your shared secret and compare it to the sender's signature. Crucially, that comparison must be <strong>constant-time</strong> (<code>crypto.timingSafeEqual</code>): a naive <code>===</code> returns as soon as bytes differ, leaking timing information that lets an attacker recover the signature byte by byte.</p>`,
        `<p><strong>Secure randomness</strong> comes from the OS's cryptographically secure RNG via <code>crypto.randomBytes</code> and <code>crypto.randomUUID</code>. This is categorically different from <code>Math.random()</code>, which is fast but predictable and must <em>never</em> generate tokens, session IDs, password-reset codes, or salts. If an attacker can guess your randomness, every security guarantee downstream collapses.</p>`,
        `<p><strong>Password hashing</strong> inverts the speed logic on purpose. <code>scrypt</code> (built in), <code>argon2</code>, and <code>bcrypt</code> are <em>slow</em> and memory-hard, with a tunable cost factor, and each password gets a unique random <strong>salt</strong> so identical passwords produce different stored hashes and rainbow tables are useless. You store the salt alongside the hash; on login you re-derive with the same salt and compare in constant time. The slowness is the whole point &mdash; it caps how many guesses an attacker can make per second.</p>`,
        `<p><strong>Encryption</strong> is for data you must read back, unlike hashing. Use <strong>AES-256-GCM</strong>, an authenticated cipher: it needs a 32-byte key and a unique <strong>IV</strong> (initialisation vector) per message, and it produces both ciphertext and an authentication tag that detects tampering on decryption. The cardinal rule is <em>never reuse an IV with the same key</em> &mdash; doing so with GCM catastrophically breaks confidentiality and authenticity. Generate a fresh random IV for every encryption and store it with the ciphertext (it is not secret).</p>`,
        `<h2>Code examples</h2>`,
        `<p>Hashing for integrity, and HMAC for verifying a signed webhook in constant time:</p>`,
        `<pre><code class="language-javascript">import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

// Integrity digest of a payload (NOT for passwords):
const digest = createHash('sha256').update('file contents').digest('hex');

// Verify a webhook signature safely:
function verifyWebhook(rawBody, signatureHex, secret) {
  const expected = createHmac('sha256', secret).update(rawBody).digest();
  const got = Buffer.from(signatureHex, 'hex');
  // Length check first — timingSafeEqual throws on length mismatch.
  return got.length === expected.length && timingSafeEqual(got, expected);
}
</code></pre>`,
        `<p>Generating unpredictable tokens and IDs the secure way:</p>`,
        `<pre><code class="language-javascript">import { randomBytes, randomUUID, randomInt } from 'node:crypto';

const sessionToken = randomBytes(32).toString('hex'); // 256-bit token
const requestId = randomUUID();                        // RFC 4122 v4
const otp = randomInt(0, 1_000_000).toString().padStart(6, '0'); // secure OTP
// NEVER: Math.random() for any of these — it is predictable.
</code></pre>`,
        `<p>Storing and verifying a password with the built-in <code>scrypt</code> (slow + salted):</p>`,
        `<pre><code class="language-javascript">import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64); // 64-byte derived key
  return \`\${salt.toString('hex')}:\${key.toString('hex')}\`; // store both
}

async function verifyPassword(password, stored) {
  const [saltHex, keyHex] = stored.split(':');
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(keyHex, 'hex');
  const actual = await scryptAsync(password, salt, expected.length);
  return timingSafeEqual(actual, expected); // constant-time compare
}
</code></pre>`,
        `<p>Authenticated encryption with AES-256-GCM (fresh IV every time, store the tag):</p>`,
        `<pre><code class="language-javascript">import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

const KEY = randomBytes(32); // 256-bit key — in real code load from a secret store

function encrypt(plaintext) {
  const iv = randomBytes(12);                       // unique per message!
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();                  // detects tampering
  return { iv: iv.toString('hex'), tag: tag.toString('hex'), data: enc.toString('hex') };
}

function decrypt({ iv, tag, data }) {
  const decipher = createDecipheriv('aes-256-gcm', KEY, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));     // throws if tampered
  return Buffer.concat([
    decipher.update(Buffer.from(data, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}
</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Hashing passwords with SHA-256/MD5.</strong> Fast hashes are trivially brute-forced. Passwords need slow, salted <code>scrypt</code>/argon2/bcrypt. This is the single most common crypto mistake.</li>`,
        `<li><strong>Comparing secrets with <code>===</code>.</strong> String/Buffer equality short-circuits on the first differing byte, leaking timing. Use <code>crypto.timingSafeEqual</code> on equal-length buffers.</li>`,
        `<li><strong>Using <code>Math.random()</code> for anything security-sensitive.</strong> It is predictable. Tokens, salts, IVs, OTPs, and IDs must come from <code>crypto.randomBytes</code>/<code>randomUUID</code>.</li>`,
        `<li><strong>Reusing an IV (nonce) with AES-GCM.</strong> Nonce reuse under the same key destroys GCM's security entirely. Generate a fresh random IV per message and store it with the ciphertext.</li>`,
        `<li><strong>Confusing encoding with encryption.</strong> Base64 is not encryption &mdash; it is reversible by anyone. Encoding hides nothing.</li>`,
        `<li><strong>Encrypting without authentication.</strong> Plain AES-CBC without a MAC lets attackers tamper undetected. Prefer AES-GCM (built-in authentication) and always verify the tag on decrypt.</li>`,
        `<li><strong>Hardcoding keys in source.</strong> Keys in the repo are compromised the moment the repo is. Load them from environment/secret managers and rotate them.</li>`,
        `<li><strong>Rolling your own crypto.</strong> Custom schemes are almost always broken. Use standard primitives with standard modes.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Passwords &rarr; <code>scrypt</code>/argon2/bcrypt with a unique per-user salt,</strong> never a plain hash.</li>`,
        `<li><strong>Compare all secrets with <code>timingSafeEqual</code></strong> on equal-length buffers.</li>`,
        `<li><strong>Generate every token, salt, IV, and ID with <code>crypto.randomBytes</code>/<code>randomUUID</code>.</strong></li>`,
        `<li><strong>Encrypt with AES-256-GCM,</strong> a fresh IV per message, and always verify the auth tag on decrypt.</li>`,
        `<li><strong>Store the salt/IV/tag alongside the ciphertext</strong> &mdash; they are not secret, and you need them to verify/decrypt.</li>`,
        `<li><strong>Keep keys out of source;</strong> load from a secret manager and support rotation.</li>`,
        `<li><strong>Verify webhooks with HMAC over the raw body</strong> (not the parsed/re-serialised body) and constant-time comparison.</li>`,
        `<li><strong>Use standard primitives and modes; do not invent your own.</strong></li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: Why can't you store passwords with SHA-256?</strong> Because SHA-256 is fast and unsalted by default: an attacker with the digests can try billions of guesses per second, and identical passwords hash identically, so rainbow tables crack them en masse. Passwords need a deliberately slow, salted, memory-hard function like <code>scrypt</code>, argon2, or bcrypt.</p></blockquote>`,
        `<blockquote><p><strong>Q: What is the difference between a hash and an HMAC?</strong> A plain hash is keyless &mdash; anyone can compute it, so it proves integrity but not origin. An HMAC mixes in a secret key with a proven construction, so a valid HMAC proves the message came from someone holding the key. HMAC is what you use to sign and verify webhooks and tokens.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why use <code>timingSafeEqual</code> instead of <code>===</code> for a signature?</strong> <code>===</code> returns as soon as two bytes differ, so the comparison time reveals how many leading bytes matched. An attacker can exploit that timing to reconstruct the secret byte by byte. <code>timingSafeEqual</code> always compares the full length in constant time.</p></blockquote>`,
        `<blockquote><p><strong>Q: What breaks if you reuse an IV with AES-GCM?</strong> Nonce reuse under the same key is catastrophic for GCM: it leaks the XOR of plaintexts and, worse, allows forging the authentication tag, breaking both confidentiality and integrity. Every message needs a fresh, unique IV.</p></blockquote>`,
        `<blockquote><p><strong>Q: Is base64 a form of encryption?</strong> No. Base64 is a reversible encoding with no key &mdash; anyone can decode it. It provides zero confidentiality; it only makes binary data safe to transport as text.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why not <code>Math.random()</code> for a session token?</strong> <code>Math.random()</code> is a fast PRNG seeded predictably and not designed for security; its output can be predicted, which would let an attacker guess valid tokens. Security-sensitive randomness must come from <code>crypto.randomBytes</code>/<code>randomUUID</code>, backed by the OS CSPRNG.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li>Integrity &rarr; <code>createHash('sha256')</code> (fast, keyless, one-way).</li>`,
        `<li>Authenticity &rarr; <code>createHmac('sha256', secret)</code> + <code>timingSafeEqual</code>.</li>`,
        `<li>Passwords &rarr; <code>scrypt</code>/argon2/bcrypt, unique salt, slow on purpose. Never SHA/MD5.</li>`,
        `<li>Randomness &rarr; <code>randomBytes</code> / <code>randomUUID</code> / <code>randomInt</code>. Never <code>Math.random()</code>.</li>`,
        `<li>Encryption &rarr; AES-256-GCM, fresh IV per message, verify the auth tag.</li>`,
        `<li>Store salt/IV/tag next to ciphertext (not secret); keep <em>keys</em> in a secret manager.</li>`,
        `<li>Base64 = encoding, not encryption.</li>`,
        `<li>Compare secrets in constant time; never <code>===</code>.</li>`,
        `<li>Use standard primitives &mdash; never roll your own.</li>`,
        `</ul>`
      ].join('\n')
    },

    // ───────────────────────────── 4. timers ─────────────────────────────
    {
      title: 'Timers: setTimeout, setInterval, setImmediate & the Event Loop',
      slug: 'timers',
      order: 4,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Timers look like the simplest API in Node &mdash; "run this later" &mdash; yet they are where the event loop's behaviour becomes visible, and where subtle ordering bugs and memory leaks hide. You use timers constantly: retry backoffs, request timeouts, polling, debouncing, rate limiting, scheduled cleanup. Understanding <em>when</em> a timer callback actually runs, and how that interacts with promises and I/O, is what lets you reason about ordering instead of guessing.</p>`,
        `<p>Interviewers love timers because a single question &mdash; "what order do these logs print?" &mdash; instantly reveals whether you understand the event loop, microtasks versus macrotasks, and the fact that <code>setTimeout(fn, 0)</code> does not mean "now." These are not trivia; timeout handling and leaked intervals are real production concerns. This topic ties the whole chapter's async foundation together.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Node gives you three scheduling primitives. <strong><code>setTimeout(fn, ms)</code></strong> runs <code>fn</code> once after <em>at least</em> <code>ms</code> milliseconds. <strong><code>setInterval(fn, ms)</code></strong> runs <code>fn</code> repeatedly every <code>ms</code> until you stop it. <strong><code>setImmediate(fn)</code></strong> runs <code>fn</code> on the very next loop iteration, after the current I/O phase. Each returns a handle you cancel with <code>clearTimeout</code>, <code>clearInterval</code>, or <code>clearImmediate</code>. Two more sit alongside them at higher priority: <strong><code>process.nextTick(fn)</code></strong> and <strong>Promise microtasks</strong>, which drain <em>before</em> the loop moves on. The single most important truth: timers specify a <em>minimum</em> delay, not an exact one &mdash; the callback runs when the event loop reaches the timers phase and the thread is free, never sooner.</p>`,
        `{{fig:ch5-timers-loop.svg|Event loop phases showing timers, poll, and check, with nextTick and microtasks draining between phases|setTimeout fires in the timers phase, setImmediate in check. process.nextTick and Promise microtasks drain between every phase, ahead of both.}}`,
        `<h2>How it works (deep)</h2>`,
        `<p>The event loop runs in <strong>phases</strong>, cycling continuously. The three that matter for timers are: the <strong>timers</strong> phase, where expired <code>setTimeout</code>/<code>setInterval</code> callbacks run; the <strong>poll</strong> phase, where I/O callbacks (completed file reads, incoming sockets) run and where the loop will wait for new I/O; and the <strong>check</strong> phase, where <code>setImmediate</code> callbacks run. Between <em>every</em> phase transition, Node drains two higher-priority queues first: the <code>process.nextTick</code> queue, then the Promise microtask queue. This is why an <code>await</code> continuation or a <code>.then</code> callback always runs before the next <code>setTimeout</code>, even a zero-delay one.</p>`,
        `<p>That ordering explains the classic puzzle. <code>setTimeout(fn, 0)</code> does not run immediately: the callback is registered, the current synchronous code finishes, then microtasks drain, and only when the loop reaches the timers phase does <code>fn</code> run. Meanwhile a <code>Promise.resolve().then(...)</code> queued in the same tick runs first because microtasks jump ahead of the next macrotask. And a <code>process.nextTick</code> beats even that, because its queue drains before microtasks. The hierarchy per turn is: current synchronous code &rarr; <code>process.nextTick</code> queue &rarr; Promise microtasks &rarr; next event-loop phase (timers/poll/check).</p>`,
        `<p>The relationship between <code>setTimeout(fn, 0)</code> and <code>setImmediate(fn)</code> is famously order-dependent at the top level. Called from the main module, their order is non-deterministic because it depends on how much time the loop has already consumed before reaching the timers phase. But called from <em>inside an I/O callback</em> (the poll phase), <code>setImmediate</code> <em>always</em> fires first, because <code>check</code> is the very next phase after <code>poll</code>, whereas <code>timers</code> is a full loop away. That deterministic difference is a common interview follow-up.</p>`,
        `<p>Timers also carry practical weight. A <code>setInterval</code> that is never cleared runs forever and, if its callback closes over large objects, leaks memory &mdash; a frequent cause of slowly growing servers. Timers also keep the process alive: by default a pending timer prevents Node from exiting. If you have a background poller that should not block shutdown, call <code>.unref()</code> on the handle so the loop can exit while it is the only thing left. Finally, <code>setInterval</code> does not guarantee even spacing: if the callback (or a blocked loop) takes longer than the interval, executions bunch up or drift, which is why a self-scheduling <code>setTimeout</code> is often better for reliable spacing.</p>`,
        `<p>A detail that bites people building long schedulers: Node stores a timer's delay as a <strong>signed 32-bit integer</strong>, so the maximum is <code>2147483647</code> ms (about 24.8 days). Pass anything larger &mdash; or <code>NaN</code>, <code>Infinity</code>, or a negative &mdash; and Node clamps the delay to <code>1</code> ms and emits a <code>TimeoutOverflowWarning</code>. So a naive <code>setTimeout(fn, days * 86400000)</code> for a 30-day reminder fires almost immediately instead of a month later. Long delays must be chunked (re-arm the timer in bounded steps) or driven by a real scheduler that compares wall-clock time. On the input side, a non-integer delay is truncated and a delay below <code>1</code> is treated as <code>1</code>.</p>`,
        `<p>The modern <code>node:timers/promises</code> module is worth reaching for by default in async code. <code>setTimeout(ms, value, { signal, ref })</code> returns a promise that resolves to <code>value</code> after the delay, so <code>await setTimeout(200)</code> replaces the hand-rolled <code>new Promise(r =&gt; setTimeout(r, 200))</code> wrapper. It accepts an <code>AbortSignal</code> so a pending delay can be cancelled (rejecting with an <code>AbortError</code>), and a <code>{ ref: false }</code> option that mirrors <code>.unref()</code>. There is also a <code>setInterval</code> async-generator form &mdash; <code>for await (const _ of setInterval(1000, null, { signal }))</code> &mdash; that yields on each tick and, because your loop body is awaited before the next yield, sidesteps the bunching problem that the callback-based <code>setInterval</code> suffers from. It is the cleanest way to write a cancellable, non-overlapping poller.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The ordering that interviewers ask about &mdash; predict the output:</p>`,
        `<pre><code class="language-javascript">console.log('1: sync start');

setTimeout(() =&gt; console.log('2: setTimeout 0'), 0);

Promise.resolve().then(() =&gt; console.log('3: promise microtask'));

process.nextTick(() =&gt; console.log('4: nextTick'));

console.log('5: sync end');

// Output order:
// 1: sync start
// 5: sync end
// 4: nextTick          (nextTick queue drains first)
// 3: promise microtask (microtasks next)
// 2: setTimeout 0      (timers phase last)
</code></pre>`,
        `<p>Clearing timers to cancel work, and using <code>unref</code> so a poller does not block exit:</p>`,
        `<pre><code class="language-javascript">// A cancellable interval:
const handle = setInterval(() =&gt; console.log('poll'), 1000);
// Later, stop it — otherwise it runs forever and can leak memory:
clearInterval(handle);

// A background heartbeat that must not keep the process alive on shutdown:
const beat = setInterval(() =&gt; sendHeartbeat(), 30_000);
beat.unref(); // process can exit even while this timer is pending
</code></pre>`,
        `<p>A promise-based delay and a timeout wrapper &mdash; the modern way to add deadlines:</p>`,
        `<pre><code class="language-javascript">import { setTimeout as delay } from 'node:timers/promises';

// Await a delay without wrapping setTimeout by hand:
await delay(200);
console.log('ran after ~200ms');

// Race any promise against a deadline using AbortSignal.timeout:
async function fetchWithTimeout(url, ms) {
  const res = await fetch(url, { signal: AbortSignal.timeout(ms) });
  return res.json();
}
// If the request exceeds ms, it rejects with a TimeoutError.
</code></pre>`,
        `<p>Reliable fixed spacing with self-scheduling <code>setTimeout</code> instead of <code>setInterval</code>:</p>`,
        `<pre><code class="language-javascript">// setInterval can bunch up if the task runs long; this waits for completion,
// THEN schedules the next run — guaranteeing a real gap between executions.
async function poll(task, gapMs) {
  while (true) {
    await task();
    await new Promise((r) =&gt; setTimeout(r, gapMs));
  }
}
</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Believing <code>setTimeout(fn, 0)</code> runs "immediately."</strong> It runs after the current sync code, the <code>nextTick</code> queue, and all microtasks &mdash; and only when the timers phase is reached. Zero is a minimum, not an exact delay.</li>`,
        `<li><strong>Never clearing a <code>setInterval</code>.</strong> It runs forever and, if it captures large state, leaks memory. Always keep the handle and <code>clearInterval</code> when done.</li>`,
        `<li><strong>Expecting <code>setInterval</code> to space runs evenly.</strong> If the callback or a blocked event loop overruns the interval, executions drift or pile up. Self-schedule with <code>setTimeout</code> for guaranteed gaps.</li>`,
        `<li><strong>Blocking the event loop and blaming the timer.</strong> A long synchronous computation delays <em>all</em> timers, because callbacks only run when the loop is free. The timer is fine; the blocking code is the problem.</li>`,
        `<li><strong>Assuming <code>setTimeout(0)</code> vs <code>setImmediate</code> ordering at the top level.</strong> It is non-deterministic in the main module; it is only guaranteed (<code>setImmediate</code> first) inside an I/O callback.</li>`,
        `<li><strong>Forgetting timers keep the process alive.</strong> A pending timer blocks a clean exit. Use <code>.unref()</code> for background timers that should not.</li>`,
        `<li><strong>Starving the loop with recursive <code>process.nextTick</code>.</strong> Because <code>nextTick</code> drains fully before the loop advances, an ever-growing <code>nextTick</code> chain can starve I/O and timers entirely.</li>`,
        `<li><strong>Scheduling a delay longer than ~24.8 days.</strong> The delay is a signed 32-bit int; anything over <code>2147483647</code> ms (or <code>NaN</code>/<code>Infinity</code>/negative) is clamped to <code>1</code> ms with a <code>TimeoutOverflowWarning</code>, so a "fire in 30 days" timer fires now. Chunk long waits or use a wall-clock scheduler.</li>`,
        `<li><strong>Leaking a promise-based timer's <code>AbortSignal</code> listener.</strong> When you race <code>timers/promises</code> <code>setTimeout</code> against other work, pass an <code>AbortController</code> and abort the loser; otherwise the pending timer (and its signal listener) lingers until it fires, quietly retaining whatever the callback closed over.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Always store and clear timer handles;</strong> treat an uncleared <code>setInterval</code> as a leak.</li>`,
        `<li><strong>Prefer self-scheduling <code>setTimeout</code> over <code>setInterval</code></strong> when even spacing or waiting for async work matters.</li>`,
        `<li><strong>Use <code>node:timers/promises</code></strong> (<code>setTimeout</code>/<code>setInterval</code> promise forms) for clean <code>await</code>-based delays.</li>`,
        `<li><strong>Implement deadlines with <code>AbortSignal.timeout</code>,</strong> which cancels the underlying work rather than just ignoring a late result.</li>`,
        `<li><strong>Call <code>.unref()</code> on background timers</strong> that should not keep the process alive.</li>`,
        `<li><strong>Keep event-loop turns short;</strong> offload heavy CPU work to worker threads so timers and I/O stay responsive.</li>`,
        `<li><strong>Reason about ordering explicitly:</strong> sync &rarr; <code>nextTick</code> &rarr; microtasks &rarr; timers/check, every turn.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: Does <code>setTimeout(fn, 0)</code> run <code>fn</code> immediately?</strong> No. It schedules <code>fn</code> to run in the timers phase after the current synchronous code completes and after the <code>nextTick</code> and microtask queues drain. Zero is a minimum delay; the actual delay depends on when the loop reaches the timers phase and whether the thread is free.</p></blockquote>`,
        `<blockquote><p><strong>Q: In what order do <code>setTimeout(0)</code>, <code>Promise.then</code>, and <code>process.nextTick</code> run?</strong> <code>process.nextTick</code> first (its queue drains before everything), then Promise microtasks, then the <code>setTimeout</code> callback in the timers phase. Microtasks always beat macrotasks; <code>nextTick</code> beats even microtasks.</p></blockquote>`,
        `<blockquote><p><strong>Q: <code>setTimeout(fn,0)</code> vs <code>setImmediate(fn)</code> &mdash; which runs first?</strong> At the top level it is non-deterministic and depends on loop timing. But <em>inside an I/O callback</em>, <code>setImmediate</code> always runs first, because <code>check</code> is the phase immediately after <code>poll</code>, whereas the timers phase is a full loop iteration away.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why did my <code>setTimeout(fn, 1000)</code> fire much later than 1 second?</strong> Because a timer's delay is a minimum. If the event loop was busy &mdash; a long synchronous task or a backlog of callbacks &mdash; <code>fn</code> waits until the loop is free and reaches the timers phase. The timer was not late; the loop was blocked.</p></blockquote>`,
        `<blockquote><p><strong>Q: How can a <code>setInterval</code> cause a memory leak?</strong> If it is never cleared and its callback closes over objects, those objects are retained for the life of the process, and the interval itself keeps running. Always clear intervals you no longer need, and use <code>.unref()</code> for ones that should not block shutdown.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why prefer a self-scheduling <code>setTimeout</code> over <code>setInterval</code> for polling an API?</strong> <code>setInterval</code> fires on a fixed schedule regardless of whether the previous call finished, so slow responses cause overlapping or bunched requests. Re-scheduling with <code>setTimeout</code> after each call completes guarantees a real gap and no overlap.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><code>setTimeout</code> = once after &ge; ms; <code>setInterval</code> = repeat; <code>setImmediate</code> = next loop, check phase.</li>`,
        `<li>Cancel with <code>clearTimeout</code>/<code>clearInterval</code>/<code>clearImmediate</code>.</li>`,
        `<li>Per turn: sync &rarr; <code>process.nextTick</code> &rarr; Promise microtasks &rarr; timers/poll/check.</li>`,
        `<li>Delay is a <em>minimum</em>, never exact &mdash; a blocked loop delays every timer.</li>`,
        `<li>Inside an I/O callback, <code>setImmediate</code> beats <code>setTimeout(0)</code> deterministically.</li>`,
        `<li>Uncleared <code>setInterval</code> = leak + keeps process alive; use <code>.unref()</code> for background timers.</li>`,
        `<li>Even spacing / await async work &rarr; self-scheduling <code>setTimeout</code>, not <code>setInterval</code>.</li>`,
        `<li>Modern: <code>node:timers/promises</code> for <code>await</code> delays; <code>AbortSignal.timeout</code> for deadlines.</li>`,
        `</ul>`
      ].join('\n')
    }
  ]
};
