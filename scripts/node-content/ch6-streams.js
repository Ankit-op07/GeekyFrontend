// Chapter 6 — Streams & Buffers (Node.js Backend Kit)
// Slug: streams, order 5. Four topics, order 0..3.
// Content authored for Node.js v20+ (validated on v22).

module.exports = {
  title: 'Streams & Buffers',
  slug: 'streams',
  order: 5,
  topics: [
    // ────────────────────────────────────────────────────────────────
    // Topic 0 — streams-overview
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Streams Overview',
      slug: 'streams-overview',
      order: 0,
      content: [
`<h2>Why it matters</h2>`,
`<p>Imagine a user uploads a 4&nbsp;GB video and your server has to hash it, resize a thumbnail, and store it. The naive approach &mdash; <code>const data = fs.readFileSync('video.mp4')</code> &mdash; pulls all four gigabytes into a single Buffer in RAM before you touch a single byte. Ten users doing that at once is 40&nbsp;GB of memory the process does not have, and it dies with <code>JavaScript heap out of memory</code>. The file did not get bigger; your strategy for reading it was wrong.</p>`,
`<p>Streams are Node's answer to this. Instead of &ldquo;load everything, then work,&rdquo; a stream lets you work on the data <em>as it arrives</em>, in small pieces called chunks, and then let each piece go. Memory stays flat &mdash; a few tens of kilobytes &mdash; whether the file is 4&nbsp;KB or 4&nbsp;TB. This is not a niche optimization: HTTP requests and responses, file I/O, TCP sockets, child-process stdout, compression, and crypto are <strong>all</strong> streams under the hood. If you understand streams, you understand how data actually moves through a Node server. If you do not, you will write code that works in development on tiny test files and falls over the moment real traffic hits it.</p>`,
`<p>Interviewers lean on streams for exactly this reason: the concept separates people who have shipped I/O-heavy Node services from people who have only built CRUD apps on small payloads. &ldquo;How would you process a file too big to fit in memory?&rdquo; is a stream question in disguise.</p>`,

`<h2>The concept, simply</h2>`,
`<p>A stream is an abstraction for a sequence of data that is not available all at once and does not have to fit in memory. Think of it like watching a movie on Netflix versus downloading the whole file first. Streaming means you start watching after a few seconds and only ever hold a few seconds of video in your buffer; downloading means you wait for the entire thing and store all of it. Streams are the &ldquo;start now, hold little&rdquo; model applied to data.</p>`,
`{{fig:ch6-stream-flow.svg|Diagram comparing buffering a whole 4 GB file in RAM against streaming it in small chunks|Buffering loads everything into memory before you start; streaming moves small chunks through a pipeline with constant, tiny memory use.}}`,
`<p>Two properties make streams powerful. First, <strong>constant memory</strong>: you process data in chunks and discard each one, so peak memory is bounded by the size of a chunk (plus a small buffer), not the size of the data. Second, <strong>time-to-first-byte</strong>: you can start producing output before you have consumed all the input. A gzip stream emits compressed bytes while it is still reading the source; an HTTP server can start sending a response body before the whole body exists. Buffering forfeits both benefits.</p>`,
`<p>Node models four kinds of stream, and every stream you meet is one of them:</p>`,
`<ul>
<li><strong>Readable</strong> &mdash; a source you read <em>from</em>. Examples: <code>fs.createReadStream()</code>, an incoming HTTP request (<code>req</code>), <code>process.stdin</code>, a child process's <code>stdout</code>.</li>
<li><strong>Writable</strong> &mdash; a sink you write <em>to</em>. Examples: <code>fs.createWriteStream()</code>, an HTTP response (<code>res</code>), <code>process.stdout</code>, a socket.</li>
<li><strong>Duplex</strong> &mdash; readable <em>and</em> writable, with the two sides independent. The classic example is a TCP socket: what you write out and what you read in are unrelated streams that happen to share one object.</li>
<li><strong>Transform</strong> &mdash; a special Duplex where the output is a function of the input. You write bytes in, transformed bytes come out. Examples: <code>zlib.createGzip()</code>, a crypto cipher, a CSV-to-JSON parser.</li>
</ul>`,
`{{fig:ch6-stream-types.svg|The four Node stream types: Readable, Writable, Duplex, and Transform with example use cases for each|Readable is a source, Writable is a sink, Duplex is both independently, and Transform is a Duplex whose output is computed from its input.}}`,

`<h2>How it works</h2>`,
`<p>Under every stream is an <strong>internal buffer</strong> and a threshold called the <code>highWaterMark</code>. When a Readable source produces data faster than you consume it, the extra bytes queue up in that internal buffer. The <code>highWaterMark</code> is the size (in bytes for binary streams, or number of objects in object mode) at which the stream considers its buffer &ldquo;full enough&rdquo; and stops asking the underlying source for more. The default is <strong>64&nbsp;KB for a file Readable</strong> and <strong>16&nbsp;KB for a generic Writable</strong>. It is a soft target, not a hard cap &mdash; a single <code>push</code> larger than the mark is still accepted &mdash; but it is the dial that governs how much memory a stream is willing to hold.</p>`,
`<p>This buffer is what makes <strong>backpressure</strong> possible. Backpressure is the mechanism by which a slow consumer tells a fast producer to slow down. On the Writable side, <code>stream.write(chunk)</code> returns a boolean: <code>true</code> means &ldquo;buffer has room, keep writing,&rdquo; <code>false</code> means &ldquo;buffer is at or over the highWaterMark, please stop.&rdquo; When it returns <code>false</code>, a well-behaved producer waits for the <code>'drain'</code> event before writing again. On the Readable side, in paused mode you only pull what you can handle. When you connect a Readable to a Writable with <code>.pipe()</code> or <code>pipeline()</code>, Node wires this entire dance up for you &mdash; it pauses the source when the destination is full and resumes it after a drain. Backpressure is the single most important thing streams do, and it is covered in depth in the last topic of this chapter.</p>`,
`<p>Streams communicate through <strong>events</strong> because they extend <code>EventEmitter</code>. The events you will actually use:</p>`,
`<ul>
<li><code>'data'</code> (Readable) &mdash; a chunk is available. Attaching this listener switches the stream into flowing mode and starts data pushing at you.</li>
<li><code>'readable'</code> (Readable) &mdash; data is buffered and ready to be pulled with <code>read()</code>; this is paused-mode consumption.</li>
<li><code>'end'</code> (Readable) &mdash; no more data will be produced; the source is exhausted.</li>
<li><code>'drain'</code> (Writable) &mdash; the buffer has emptied below the highWaterMark after a <code>write()</code> returned <code>false</code>; safe to resume writing.</li>
<li><code>'finish'</code> (Writable) &mdash; <code>end()</code> was called and all buffered data has been flushed to the underlying resource.</li>
<li><code>'close'</code> &mdash; the stream and its underlying resource (file descriptor, socket) have been closed.</li>
<li><code>'error'</code> &mdash; something failed. This is the event people forget, and forgetting it crashes the process, because an unhandled <code>'error'</code> on an EventEmitter throws.</li>
</ul>`,
`<p>One more foundational idea: a chunk is a <strong>Buffer</strong> by default (raw bytes), unless you set an encoding (then you get strings) or put the stream in <strong>object mode</strong> (then each chunk can be any JavaScript value &mdash; a parsed record, an object, a number). Object-mode streams are how you build data pipelines that pass structured records instead of raw bytes, and they use the highWaterMark as a <em>count of objects</em> rather than a byte size.</p>`,

`<h2>Code examples</h2>`,
`<p><strong>1. Copy a file with constant memory.</strong> The whole point of streams in one snippet &mdash; this copies a file of any size while holding only ~64&nbsp;KB at a time.</p>`,
`<pre><code class="language-javascript">import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

// pipeline() reads chunks from the source and writes them to the
// destination, handling backpressure and errors for you.
await pipeline(
  createReadStream('big-input.bin'),
  createWriteStream('copy-output.bin')
);
console.log('Copied without ever holding the whole file in RAM.');</code></pre>`,
`<p><strong>2. Consume a Readable and watch its events.</strong> Notice we never build a giant string &mdash; we count bytes chunk by chunk.</p>`,
`<pre><code class="language-javascript">import { createReadStream } from 'node:fs';

const stream = createReadStream('big-input.bin', { highWaterMark: 64 * 1024 });
let bytes = 0;
let chunks = 0;

stream.on('data', (chunk) =&gt; {   // Buffer of up to 64 KB
  bytes += chunk.length;
  chunks++;
});
stream.on('end', () =&gt; {
  console.log(\`Done: \${chunks} chunks, \${bytes} bytes total\`);
});
stream.on('error', (err) =&gt; {    // ALWAYS handle this
  console.error('Read failed:', err.message);
});</code></pre>`,
`<p><strong>3. An HTTP server is just streams.</strong> <code>req</code> is a Readable, <code>res</code> is a Writable. Streaming a file to the client never buffers it in the server.</p>`,
`<pre><code class="language-javascript">import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

createServer(async (req, res) =&gt; {
  // req: Readable (the request body)  |  res: Writable (the response)
  res.setHeader('Content-Type', 'video/mp4');
  try {
    await pipeline(createReadStream('./movie.mp4'), res);
  } catch (err) {
    if (!res.headersSent) res.statusCode = 500;
    res.end();               // client disconnect or read error
  }
}).listen(3000);</code></pre>`,

`<h2>Common mistakes &amp; gotchas</h2>`,
`<ul>
<li><strong>Reaching for <code>readFileSync</code> / <code>readFile</code> on large or unbounded data.</strong> It works on your 2&nbsp;KB fixture and detonates on a 2&nbsp;GB upload. If the size is user-controlled, stream it.</li>
<li><strong>Concatenating every chunk into one big Buffer or string.</strong> Doing <code>data += chunk</code> across a stream defeats the purpose &mdash; you have re-created the buffer-everything problem the stream was avoiding.</li>
<li><strong>Forgetting the <code>'error'</code> listener.</strong> An unhandled <code>'error'</code> event is thrown as an exception and takes the whole process down. Every stream in a chain can emit it.</li>
<li><strong>Assuming a chunk is a complete logical unit.</strong> A chunk is a byte boundary, not a line or a JSON record. One chunk may contain half a line and the start of the next; a multi-byte UTF-8 character can be split across two chunks. Never <code>JSON.parse</code> a raw chunk.</li>
<li><strong>Thinking the <code>highWaterMark</code> is a hard limit.</strong> It is a threshold that governs when the stream stops pulling; a single oversized <code>push</code> still goes through.</li>
</ul>`,

`<h2>Best practices</h2>`,
`<ul>
<li><strong>Default to streaming for any I/O whose size you do not control</strong> &mdash; file uploads, proxied responses, DB exports, log processing.</li>
<li><strong>Prefer <code>pipeline()</code> (ideally the promise version from <code>node:stream/promises</code>) over manual <code>.pipe()</code> and hand-wired events.</strong> It handles backpressure, propagates errors, and cleans up every stream on failure.</li>
<li><strong>Always attach an <code>'error'</code> handler</strong> to every stream you touch, or use <code>pipeline()</code> which funnels all errors to one place.</li>
<li><strong>Set an explicit <code>highWaterMark</code></strong> when you have a reason to (larger for high-throughput file copies, smaller to cap memory under many concurrent streams). Otherwise trust the defaults.</li>
<li><strong>Use object mode</strong> when your pipeline passes records rather than bytes &mdash; it keeps the same backpressure guarantees for structured data.</li>
</ul>`,

`<h2>⭐ Interview lens</h2>`,
`<blockquote><p><strong>Q: What problem do streams solve that <code>fs.readFile</code> does not?</strong><br>Streams process data in chunks with bounded memory and start producing output before all input is read. <code>readFile</code> loads the entire payload into one Buffer first, so peak memory scales with data size and you cannot begin work until the whole thing is in RAM. For large or unbounded data, streaming keeps memory flat and improves time-to-first-byte.</p></blockquote>`,
`<blockquote><p><strong>Q: Name the four stream types and give a real example of each.</strong><br>Readable (fs read stream, HTTP request), Writable (fs write stream, HTTP response), Duplex (TCP socket &mdash; independent read and write sides), Transform (gzip, crypto cipher &mdash; a Duplex whose output is computed from its input).</p></blockquote>`,
`<blockquote><p><strong>Q: Is a Transform stream a Readable or a Writable?</strong> (Trap.)<br>Both &mdash; it is a Duplex. You write input to its writable side and read transformed output from its readable side. The distinguishing feature versus a plain Duplex is that the output is derived from the input rather than being an unrelated channel.</p></blockquote>`,
`<blockquote><p><strong>Q: What is the <code>highWaterMark</code>?</strong><br>The threshold size of a stream's internal buffer (default 64&nbsp;KB for file Readables, 16&nbsp;KB for Writables; a count of objects in object mode). It controls when a Readable stops pulling from its source and when <code>write()</code> starts returning <code>false</code> &mdash; i.e., it is the knob that drives backpressure. It is a soft target, not a hard ceiling.</p></blockquote>`,
`<blockquote><p><strong>Q: Why can a chunk not be treated as a complete line or JSON object?</strong><br>Chunks are split on byte boundaries determined by the buffer, not on logical boundaries in your data. A record can span multiple chunks, a chunk can contain multiple partial records, and even a single UTF-8 character can be split across two chunks. You must reassemble logical units yourself, typically with a Transform stream or a line-splitter.</p></blockquote>`,
`<blockquote><p><strong>Q: Which event, if unhandled, will crash your process, and why?</strong><br><code>'error'</code>. Streams are EventEmitters, and an <code>'error'</code> emitted with no listener is re-thrown as an uncaught exception. This is why <code>pipeline()</code> is preferred &mdash; it guarantees a single error path.</p></blockquote>`,

`<h2>Cheat-card</h2>`,
`<ul>
<li><strong>Stream</strong> = process data in chunks, bounded memory, start early.</li>
<li><strong>Types</strong>: Readable (from), Writable (to), Duplex (both, independent), Transform (out = f(in)).</li>
<li><strong>Buffer + highWaterMark</strong>: internal queue; default 64&nbsp;KB file read / 16&nbsp;KB write; drives backpressure.</li>
<li><strong>Key events</strong>: <code>data</code>, <code>readable</code>, <code>end</code> (Readable); <code>drain</code>, <code>finish</code> (Writable); <code>close</code>, <code>error</code> (both).</li>
<li><strong>Chunk</strong> = Buffer by default; string with encoding; any value in object mode. Not a logical record.</li>
<li><strong>Always</strong>: handle <code>'error'</code>; prefer <code>pipeline()</code>; stream anything size-unbounded.</li>
</ul>`
      ].join('\n')
    },

    // ────────────────────────────────────────────────────────────────
    // Topic 1 — readable-writable
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Readable & Writable Streams',
      slug: 'readable-writable',
      order: 1,
      content: [
`<h2>Why it matters</h2>`,
`<p>Readable and Writable are the two halves of every data movement in Node. The request coming into your server is a Readable; the response going out is a Writable. The file you read is a Readable; the file you write is a Writable. Duplex and Transform &mdash; the subjects of the next topic &mdash; are literally built by combining these two. If you are shaky on how a Readable delivers data and how a Writable accepts it, everything above them (piping, compression, HTTP bodies) is guesswork.</p>`,
`<p>The part that trips people up, and the part interviewers probe, is that a Readable can operate in two completely different <strong>modes</strong> &mdash; paused and flowing &mdash; and choosing the wrong one, or accidentally switching between them, causes two of the most common stream bugs in production: silently lost data, and memory blowups from ignored backpressure. Getting this right is the difference between a service that streams a million-row export cleanly and one that OOMs at row 200,000.</p>`,

`<h2>The concept, simply</h2>`,
`<p>A <strong>Readable</strong> is a faucet. A <strong>Writable</strong> is a drain. Your job is to get water from the faucet to the drain without overflowing the sink in between &mdash; that sink is the internal buffer, and not overflowing it is backpressure.</p>`,
`<p>The subtlety is entirely on the Readable side, because a faucet can deliver water two ways. In <strong>paused mode</strong> (also called pull mode), the data sits in the stream's buffer and nothing happens until <em>you</em> call <code>read()</code> to pull a chunk. You are in control of the pace. In <strong>flowing mode</strong> (push mode), the stream fires <code>'data'</code> events at you as fast as the source can produce, and you must keep up or handle backpressure yourself.</p>`,
`{{fig:ch6-flowing-paused.svg|Two Readable modes side by side: paused mode where you pull with read on the readable event, and flowing mode where data is pushed to you via data events|In paused mode you pull chunks by calling read(); in flowing mode chunks are pushed to you through data events until you pause or the source ends.}}`,
`<p>A brand-new Readable starts <strong>paused</strong>. It switches to <strong>flowing</strong> the moment you do any of three things: attach a <code>'data'</code> listener, call <code>.pipe()</code>, or call <code>.resume()</code>. It switches back to paused if you call <code>.pause()</code> (and, when piped, whenever the destination signals backpressure). The single most important practical rule follows from this: <strong>attaching a <code>'data'</code> listener starts the flow immediately.</strong> If you attach it and then do async setup before you are ready to handle chunks, the chunks that arrive in the meantime are gone.</p>`,

`<h2>How it works</h2>`,
`<p><strong>Reading, in detail.</strong> A Readable pulls from its underlying source (a file descriptor, a socket) into its internal buffer via an internal <code>_read()</code> method. It keeps pulling until the buffered amount reaches the <code>highWaterMark</code> (default 64&nbsp;KB for files), then stops asking for more. In paused mode, each <code>read(n)</code> you call removes up to <code>n</code> bytes from that buffer and returns them (or <code>null</code> if not enough is buffered yet); as the buffer drains below the mark, the stream resumes pulling from the source. In flowing mode the same buffering happens, but the stream automatically drains its buffer by emitting <code>'data'</code> events &mdash; which is exactly why flowing mode without piping is dangerous: there is no automatic pause if your <code>'data'</code> handler is slower than the source.</p>`,
`<p><strong>Writing, in detail.</strong> A Writable exposes <code>write(chunk)</code>, which appends to its own internal buffer and asks the underlying resource to consume it via <code>_write()</code>. The return value is the backpressure signal: <code>true</code> means the buffered bytes are below the <code>highWaterMark</code> (default 16&nbsp;KB) &mdash; keep going; <code>false</code> means you are at or over it &mdash; stop, and wait for the <code>'drain'</code> event before writing more. Ignoring a <code>false</code> return does not error; it just keeps piling data into the buffer, and memory grows without bound. That is the classic slow-disk / fast-source memory leak.</p>`,
`{{fig:ch6-highwatermark.svg|A Writable stream's internal buffer shown as a tank with a highWaterMark line: write returns true below the line and false at or above it, requiring a wait for the drain event|write() returns true while buffered bytes are below the highWaterMark and false once they reach it; on false you must wait for drain before writing again.}}`,
`<p><strong>Ending.</strong> You signal a Writable is done with <code>end([finalChunk])</code>. Once all buffered data is flushed to the underlying resource, it emits <code>'finish'</code>. After the resource itself is released it emits <code>'close'</code>. On a Readable, exhaustion is signalled by <code>'end'</code>. These are distinct events for distinct streams, and confusing <code>'end'</code> (readable is done producing) with <code>'finish'</code> (writable is done consuming) is a common interview slip.</p>`,
`<p><strong>Async iteration.</strong> Modern Node lets you consume a Readable with <code>for await...of</code>. This is paused-mode consumption in disguise &mdash; the loop pulls one chunk, awaits your body, then pulls the next &mdash; so backpressure is automatic and you get clean <code>try/catch</code> error handling. It is the most readable way to consume a stream when you need per-chunk logic.</p>`,

`<h2>Code examples</h2>`,
`<p><strong>1. Consume with <code>for await</code> (recommended default).</strong> Backpressure and errors are handled by the language, not by hand.</p>`,
`<pre><code class="language-javascript">import { createReadStream } from 'node:fs';

async function countLines(path) {
  let count = 0, tail = '';
  const stream = createReadStream(path, { encoding: 'utf8' });
  for await (const chunk of stream) {   // pulls one chunk at a time
    const parts = (tail + chunk).split('\\n');
    tail = parts.pop();                 // last piece may be incomplete
    count += parts.length;
  }
  if (tail) count++;                     // final line with no newline
  return count;
}
console.log(await countLines('access.log'));</code></pre>`,
`<p><strong>2. Respecting Writable backpressure by hand.</strong> The pattern <code>pipeline()</code> automates &mdash; worth writing once so you understand what it does.</p>`,
`<pre><code class="language-javascript">import { createWriteStream } from 'node:fs';
import { once } from 'node:events';

async function writeLots(path, n) {
  const out = createWriteStream(path);
  for (let i = 0; i &lt; n; i++) {
    const ok = out.write(\`row \${i}\\n\`);
    if (!ok) {
      // Buffer is full — pause until it drains below highWaterMark.
      await once(out, 'drain');
    }
  }
  out.end();
  await once(out, 'finish');   // all data flushed to disk
}
await writeLots('rows.txt', 1_000_000);</code></pre>`,
`<p><strong>3. Creating your own Readable.</strong> Push data with <code>push(chunk)</code>; signal the end with <code>push(null)</code>.</p>`,
`<pre><code class="language-javascript">import { Readable } from 'node:stream';

// Simplest: from an iterable / generator.
const numbers = Readable.from((function* () {
  for (let i = 1; i &lt;= 5; i++) yield \`\${i}\\n\`;
})());

// Explicit form: implement _read and push chunks yourself.
class Counter extends Readable {
  #n = 0;
  constructor(max) { super(); this.max = max; }
  _read() {
    this.#n++;
    if (this.#n &gt; this.max) this.push(null);        // end of stream
    else this.push(Buffer.from(\`\${this.#n}\\n\`));   // emit a chunk
  }
}
new Counter(3).pipe(process.stdout);   // prints 1\\n2\\n3\\n</code></pre>`,
`<p><strong>4. Creating your own Writable.</strong> Implement <code>_write</code>; call the callback when the chunk is handled (this is how backpressure is reported upstream).</p>`,
`<pre><code class="language-javascript">import { Writable } from 'node:stream';

class JsonlLogger extends Writable {
  constructor() { super({ objectMode: true }); }   // accept objects, not bytes
  _write(record, _enc, cb) {
    process.stdout.write(JSON.stringify(record) + '\\n');
    cb();   // MUST call cb — err first if it failed. Until then, backpressure holds.
  }
}
const log = new JsonlLogger();
log.write({ level: 'info', msg: 'up' });
log.write({ level: 'warn', msg: 'slow query' });
log.end();</code></pre>`,

`<h2>Common mistakes &amp; gotchas</h2>`,
`<ul>
<li><strong>Attaching <code>'data'</code> too early.</strong> It flips the stream to flowing immediately. If you then <code>await</code> something before processing, chunks emitted during the await are lost. Attach the listener only when you are ready to handle chunks, or use <code>for await</code>.</li>
<li><strong>Ignoring the return value of <code>write()</code>.</strong> If it returns <code>false</code> and you keep writing, the Writable's buffer grows without bound &mdash; unbounded memory, not an error. Wait for <code>'drain'</code>.</li>
<li><strong>Mixing paused and flowing consumption.</strong> Calling <code>read()</code> while also having a <code>'data'</code> listener, or piping a stream you are also manually reading, leads to data going to one consumer and not the other.</li>
<li><strong>Confusing <code>'end'</code> with <code>'finish'</code>.</strong> <code>'end'</code> = a Readable has no more data to give. <code>'finish'</code> = a Writable has flushed everything you gave it. Different streams, different meanings.</li>
<li><strong>Forgetting to call the <code>_write</code> callback</strong> in a custom Writable. Until you call <code>cb()</code>, the stream thinks the chunk is still being processed and applies backpressure forever &mdash; the pipeline silently stalls.</li>
<li><strong>Calling <code>push()</code> after <code>push(null)</code></strong> in a custom Readable, or pushing faster than <code>_read</code> is called &mdash; both throw or leak.</li>
</ul>`,

`<h2>Best practices</h2>`,
`<ul>
<li><strong>Prefer <code>for await...of</code></strong> for consuming a Readable when you need custom per-chunk logic &mdash; it gives you automatic backpressure and normal <code>try/catch</code>.</li>
<li><strong>Prefer <code>pipeline()</code></strong> when you are just moving data from a Readable to a Writable (or through Transforms) &mdash; do not hand-roll the drain loop unless you are learning or have a special case.</li>
<li><strong>When building a custom stream, use the constructor options</strong> (<code>read</code>, <code>write</code>, <code>transform</code> functions) or subclass and implement the <code>_</code>-prefixed methods &mdash; and always call the provided callback.</li>
<li><strong>Set <code>objectMode: true</code></strong> when your stream carries JS values rather than bytes, and remember the highWaterMark then counts objects, not bytes.</li>
<li><strong>Use <code>Readable.from(iterable)</code></strong> to turn an array, generator, or async iterator into a stream instead of implementing <code>_read</code> by hand.</li>
</ul>`,

`<h2>⭐ Interview lens</h2>`,
`<blockquote><p><strong>Q: What are the two modes of a Readable stream, and what triggers each?</strong><br>Paused (pull) and flowing (push). A new stream starts paused. It goes flowing when you add a <code>'data'</code> listener, call <code>.pipe()</code>, or call <code>.resume()</code>; it returns to paused on <code>.pause()</code> or, when piped, when the destination applies backpressure. In paused mode you pull with <code>read()</code>; in flowing mode chunks arrive via <code>'data'</code> events.</p></blockquote>`,
`<blockquote><p><strong>Q: You attach a <code>'data'</code> handler but some chunks seem to vanish. Why?</strong> (Trap.)<br>Attaching <code>'data'</code> switches the stream to flowing mode <em>immediately</em>. If there is any asynchronous gap between attaching the listener and actually being ready &mdash; or if a second consumer is added later &mdash; chunks emitted in that window are dropped because flowing mode does not wait. Fix: use <code>for await</code>, or don't start the flow until ready.</p></blockquote>`,
`<blockquote><p><strong>Q: What does <code>stream.write()</code> returning <code>false</code> mean, and what should you do?</strong><br>The Writable's internal buffer has reached the highWaterMark &mdash; backpressure. Stop calling <code>write()</code> and wait for the <code>'drain'</code> event before resuming. Ignoring it doesn't throw; it just grows memory unboundedly.</p></blockquote>`,
`<blockquote><p><strong>Q: Difference between the <code>'end'</code> and <code>'finish'</code> events?</strong><br><code>'end'</code> fires on a Readable when there is no more data to read. <code>'finish'</code> fires on a Writable after <code>end()</code> is called and all buffered data has been flushed to the underlying resource. <code>'close'</code> then fires when the underlying descriptor/socket is released.</p></blockquote>`,
`<blockquote><p><strong>Q: In a custom Writable's <code>_write(chunk, enc, cb)</code>, what happens if you never call <code>cb</code>?</strong><br>The stream believes the chunk is still being processed, so it never requests the next one and applies backpressure indefinitely &mdash; the pipeline stalls silently with no error. You must call <code>cb()</code> on success or <code>cb(err)</code> on failure.</p></blockquote>`,
`<blockquote><p><strong>Q: How do you signal the end of data from inside a custom Readable?</strong><br>Call <code>this.push(null)</code>. Every earlier <code>push(chunk)</code> emits data; <code>push(null)</code> marks EOF and eventually triggers the <code>'end'</code> event downstream.</p></blockquote>`,

`<h2>Cheat-card</h2>`,
`<ul>
<li><strong>Readable</strong> = source (faucet). Starts <strong>paused</strong>; goes <strong>flowing</strong> on <code>data</code> listener / <code>pipe()</code> / <code>resume()</code>.</li>
<li><strong>Paused</strong>: pull with <code>read()</code> on <code>'readable'</code>. <strong>Flowing</strong>: pushed via <code>'data'</code>.</li>
<li><strong>Writable</strong> = sink (drain). <code>write()</code> → <code>false</code> means buffer ≥ highWaterMark; wait for <code>'drain'</code>.</li>
<li><strong>End signals</strong>: Readable emits <code>'end'</code>; Writable <code>end()</code> → <code>'finish'</code> → <code>'close'</code>.</li>
<li><strong>Build</strong>: custom Readable <code>push(chunk)</code> / <code>push(null)</code>; custom Writable <code>_write(chunk,enc,cb)</code> &mdash; <em>always call cb</em>.</li>
<li><strong>Consume</strong>: <code>for await...of</code> for logic; <code>pipeline()</code> to just move bytes. <code>objectMode</code> for records.</li>
</ul>`
      ].join('\n')
    },

    // ────────────────────────────────────────────────────────────────
    // Topic 2 — transform-duplex
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Transform & Duplex Streams',
      slug: 'transform-duplex',
      order: 2,
      content: [
`<h2>Why it matters</h2>`,
`<p>Readable and Writable move data. Transform and Duplex are how you <em>do work to data while it moves</em> &mdash; without ever holding the whole thing in memory. Every time you gzip a response, encrypt a file, parse a multi-gigabyte CSV, or hash an upload as it arrives, you are using a Transform stream. They are the workhorses of real Node pipelines, and they are what let you build a processing chain &mdash; read → decompress → parse → filter → serialize → write &mdash; that runs in constant memory over an input larger than RAM.</p>`,
`<p>Interviewers care about Transform for two reasons. First, it is the natural place to test whether you understand that stream processing is chunk-by-chunk, not record-by-record &mdash; the &ldquo;a line can span two chunks&rdquo; problem lives here. Second, writing a correct Transform (buffering partial data, flushing the tail, propagating errors) demonstrates real stream fluency in a way that piping two file streams together does not.</p>`,

`<h2>The concept, simply</h2>`,
`<p>A <strong>Duplex</strong> stream is both Readable and Writable in one object, but the two sides are <em>independent</em> &mdash; what you write has no defined relationship to what you read. A TCP socket is the canonical example: you write bytes out to the peer and read bytes in from the peer, and those are two separate conversations that just happen to share a connection object.</p>`,
`<p>A <strong>Transform</strong> is a special Duplex where the two sides <em>are</em> related: the readable output is computed from the writable input. You write data in, the stream transforms each chunk, and the result comes out the readable side. Gzip is a Transform: bytes in, smaller bytes out. A cipher is a Transform: plaintext in, ciphertext out. Because a Transform is a Readable, you can pipe from it; because it is a Writable, you can pipe into it &mdash; which is exactly what lets you chain many of them into a pipeline.</p>`,
`{{fig:ch6-transform-pipeline.svg|A processing chain: a Readable file feeds a gzip Transform, then an encrypt Transform, then a Writable output file, with backpressure flowing back up the chain|A Transform reads a chunk, transforms it, and writes the result to the next stage; chaining Transforms builds a constant-memory processing pipeline.}}`,
`<p>The mental model: a Transform sits in the <em>middle</em> of a pipe. Data flows in one end, gets reshaped, flows out the other. Because it participates in the same backpressure protocol as any stream, a slow stage automatically throttles the fast stages before it &mdash; the whole chain self-regulates.</p>`,

`<h2>How it works</h2>`,
`<p>To build a Transform you implement two methods. <code>_transform(chunk, encoding, callback)</code> is called for every chunk written to the stream. Inside it you do your work and emit output by calling <code>this.push(outputChunk)</code> zero or more times, then call <code>callback()</code> to signal you are ready for the next chunk. You can also pass the transformed value straight to the callback: <code>callback(null, outputChunk)</code> is shorthand for one push. Crucially, the number of chunks out does not have to match the number in &mdash; you might buffer several input chunks and emit one output, or receive one and emit many.</p>`,
`<p>The second method, <code>_flush(callback)</code>, is called <strong>once</strong>, after the last chunk has been written and before the stream ends. This is where you emit anything you were holding back &mdash; the final line of a file that had no trailing newline, the last block of a cipher, buffered state that only makes sense at the end. Forgetting <code>_flush</code> is the classic source of &ldquo;my parser drops the last record&rdquo; bugs.</p>`,
`<p><strong>Backpressure through a Transform.</strong> A Transform has <em>two</em> internal buffers &mdash; one on its writable side and one on its readable side, each with its own highWaterMark. When the downstream consumer is slow, the Transform's readable buffer fills, which causes it to stop calling your <code>_transform</code> callback promptly, which causes its writable buffer to fill, which makes <code>write()</code> return <code>false</code> to whatever is feeding it &mdash; and so backpressure propagates all the way back up the chain to the original source. You get this for free as long as you honor the callback contract and do not call <code>push</code> unboundedly while ignoring its return value.</p>`,
`<p><strong>Object mode</strong> matters a lot for Transforms. A byte-mode Transform reshapes Buffers; an object-mode Transform can turn bytes into structured records (parse a CSV row into an object) or objects into bytes (serialize a record to a JSON line). A common pattern is a pipeline where the first Transform is <code>{ writableObjectMode: false, readableObjectMode: true }</code> &mdash; bytes in, objects out &mdash; because the two sides of a Duplex can have different modes.</p>`,

`<h2>Code examples</h2>`,
`<p><strong>1. Use the built-in Transforms &mdash; gzip a file.</strong> <code>zlib</code> ciphers and compressors are all Transform streams; you rarely need to write compression yourself.</p>`,
`<pre><code class="language-javascript">import { createReadStream, createWriteStream } from 'node:fs';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';

await pipeline(
  createReadStream('report.csv'),
  createGzip(),                       // Transform: bytes -&gt; compressed bytes
  createWriteStream('report.csv.gz')
);
console.log('Compressed in constant memory.');</code></pre>`,
`<p><strong>2. A byte-mode Transform: uppercase every chunk.</strong> The simplest possible custom Transform &mdash; note the constructor-function form.</p>`,
`<pre><code class="language-javascript">import { Transform } from 'node:stream';

const upper = new Transform({
  transform(chunk, _enc, cb) {
    // chunk is a Buffer; reshape and push the result.
    cb(null, chunk.toString('utf8').toUpperCase());
  }
});

process.stdin.pipe(upper).pipe(process.stdout);   // type text, see it uppercased</code></pre>`,
`<p><strong>3. A line splitter &mdash; the &ldquo;chunk boundary&rdquo; problem solved.</strong> This is the pattern interviewers love: buffer partial input, emit complete lines, flush the tail.</p>`,
`<pre><code class="language-javascript">import { Transform } from 'node:stream';

class SplitLines extends Transform {
  #tail = '';
  constructor() { super({ readableObjectMode: true }); }  // emit strings as objects
  _transform(chunk, _enc, cb) {
    const lines = (this.#tail + chunk).split('\\n');
    this.#tail = lines.pop();          // keep the possibly-incomplete last piece
    for (const line of lines) this.push(line);
    cb();
  }
  _flush(cb) {
    if (this.#tail) this.push(this.#tail);   // emit the final line (no newline)
    cb();
  }
}

import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
await pipeline(
  createReadStream('access.log'),
  new SplitLines(),
  new Transform({                       // object-mode: count only errors
    objectMode: true,
    transform(line, _e, cb) {
      if (line.includes(' 500 ')) this.push(line + '\\n');
      cb();
    }
  }),
  process.stdout
);</code></pre>`,
`<p><strong>4. A full processing pipeline: parse → filter → serialize.</strong> Object-mode Transforms chained end to end, in constant memory over any file size.</p>`,
`<pre><code class="language-javascript">import { Transform } from 'node:stream';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

const parseCsvRow = new Transform({
  readableObjectMode: true,
  transform(buf, _e, cb) {
    for (const line of buf.toString().split('\\n')) {
      if (!line.trim()) continue;
      const [id, name, amount] = line.split(',');
      this.push({ id, name, amount: Number(amount) });
    }
    cb();
  }
});

const keepBigSpenders = new Transform({
  objectMode: true,
  transform(row, _e, cb) {
    if (row.amount &gt;= 1000) this.push(row);
    cb();
  }
});

const toJsonl = new Transform({
  writableObjectMode: true,          // objects in, bytes out
  transform(row, _e, cb) { cb(null, JSON.stringify(row) + '\\n'); }
});

await pipeline(
  createReadStream('transactions.csv'),
  parseCsvRow,
  keepBigSpenders,
  toJsonl,
  createWriteStream('big-spenders.jsonl')
);</code></pre>`,

`<h2>Common mistakes &amp; gotchas</h2>`,
`<ul>
<li><strong>Assuming one input chunk equals one logical record.</strong> A chunk can split a line, a CSV row, or even a multi-byte character. You must buffer partial data across <code>_transform</code> calls and reassemble it &mdash; that is what the <code>#tail</code> field in the splitter does.</li>
<li><strong>Forgetting <code>_flush</code>.</strong> Anything you were holding at the end &mdash; the last line, a final cipher block &mdash; is silently lost if you don't emit it in <code>_flush</code>. This is the number-one Transform bug.</li>
<li><strong>Not calling the <code>_transform</code> callback</strong> (or calling it twice). One call per invocation: the stream stalls forever if you skip it, and throws if you call it twice.</li>
<li><strong>Doing heavy synchronous CPU work inside <code>_transform</code>.</strong> It runs on the event loop; a slow synchronous transform blocks everything. For CPU-bound transforms, offload to a worker thread.</li>
<li><strong>Mismatched object modes.</strong> Piping an object-mode Readable into a byte-mode Writable (or vice versa) throws or produces <code>[object Object]</code> garbage. Set <code>readableObjectMode</code> / <code>writableObjectMode</code> deliberately.</li>
<li><strong>Treating a Duplex like a Transform.</strong> A plain Duplex's read and write sides are independent; do not assume writing to it produces related output on its readable side.</li>
</ul>`,

`<h2>Best practices</h2>`,
`<ul>
<li><strong>Reach for built-ins first</strong> &mdash; <code>zlib</code> (gzip/brotli/deflate), <code>crypto</code> ciphers and hashes, and libraries like <code>csv-parse</code> are battle-tested Transforms. Write your own only for custom logic.</li>
<li><strong>Always implement <code>_flush</code></strong> if your Transform buffers any state, and test the &ldquo;last record has no trailing delimiter&rdquo; case explicitly.</li>
<li><strong>Keep <code>_transform</code> non-blocking.</strong> If work is CPU-heavy, push it to a <code>worker_threads</code> pool; if it is async I/O, call the callback when the async work completes so backpressure is respected.</li>
<li><strong>Choose object modes explicitly per side</strong> using <code>readableObjectMode</code> and <code>writableObjectMode</code> for parsers (bytes in, objects out) and serializers (objects in, bytes out).</li>
<li><strong>Compose small, single-purpose Transforms</strong> (parse, filter, map, serialize) and wire them with <code>pipeline()</code> rather than building one giant do-everything stream.</li>
</ul>`,

`<h2>⭐ Interview lens</h2>`,
`<blockquote><p><strong>Q: What is the difference between a Duplex and a Transform stream?</strong><br>Both are readable and writable. In a Duplex the two sides are independent (e.g., a TCP socket &mdash; incoming and outgoing data are unrelated). A Transform is a Duplex where the readable output is derived from the writable input (e.g., gzip, a cipher, a parser). Transform is effectively Duplex plus the constraint &ldquo;out = f(in).&rdquo;</p></blockquote>`,
`<blockquote><p><strong>Q: What are <code>_transform</code> and <code>_flush</code> for?</strong><br><code>_transform(chunk, enc, cb)</code> runs per input chunk: do the work, <code>push()</code> output (or pass it to <code>cb</code>), then call <code>cb</code> to accept the next chunk. <code>_flush(cb)</code> runs once at the very end, before <code>'end'</code>, and is where you emit any buffered leftover &mdash; the final partial line, the last cipher block.</p></blockquote>`,
`<blockquote><p><strong>Q: You write a newline-delimited parser and it always loses the last line. Why?</strong> (Classic trap.)<br>Two likely causes: you only emit a line when you see a <code>\\n</code>, so a final line without a trailing newline is never emitted &mdash; fix by flushing the buffered tail in <code>_flush</code>. And you must buffer partial content across chunks, because the last line may straddle a chunk boundary or arrive in the very last chunk.</p></blockquote>`,
`<blockquote><p><strong>Q: How does backpressure work through a Transform stream?</strong><br>A Transform has two internal buffers, one per side. When downstream is slow, its readable buffer fills, so it delays calling your <code>_transform</code> callback, so its writable buffer fills, so <code>write()</code> to it returns <code>false</code> &mdash; and the pressure propagates back up the whole chain. It works automatically as long as you honor the callback contract.</p></blockquote>`,
`<blockquote><p><strong>Q: Your CPU-bound Transform makes the whole server unresponsive under load. Why, and how do you fix it?</strong><br><code>_transform</code> runs on the single event-loop thread; a heavy synchronous computation blocks all other requests. Move the CPU work to a <code>worker_threads</code> pool and have <code>_transform</code> await the worker's result before calling its callback, so the loop stays free.</p></blockquote>`,
`<blockquote><p><strong>Q: Can the number of output chunks differ from the number of input chunks in a Transform?</strong><br>Yes. You can call <code>push</code> zero, one, or many times per <code>_transform</code> call, and you can buffer several input chunks and emit a single output later (or the reverse). A line splitter and a compressor both change the chunk count.</p></blockquote>`,

`<h2>Cheat-card</h2>`,
`<ul>
<li><strong>Duplex</strong> = readable + writable, sides <em>independent</em> (TCP socket).</li>
<li><strong>Transform</strong> = Duplex where <em>out = f(in)</em> (gzip, cipher, parser). Pipe into it <em>and</em> out of it.</li>
<li><strong><code>_transform(chunk, enc, cb)</code></strong>: do work, <code>push()</code> or <code>cb(null, out)</code>, then call <code>cb</code>. Chunks in ≠ chunks out.</li>
<li><strong><code>_flush(cb)</code></strong>: runs once at end &mdash; emit buffered tail (last line / final block). Skipping it drops the last record.</li>
<li><strong>Chunk ≠ record</strong>: buffer partial data across calls; reassemble logical units yourself.</li>
<li><strong>Modes</strong>: set <code>readableObjectMode</code> / <code>writableObjectMode</code> per side. CPU-heavy work → worker thread.</li>
</ul>`
      ].join('\n')
    },

    // ────────────────────────────────────────────────────────────────
    // Topic 3 — backpressure-piping
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Backpressure, pipe & pipeline',
      slug: 'backpressure-piping',
      order: 3,
      content: [
`<h2>Why it matters</h2>`,
`<p>Backpressure is the single most important concept in the entire chapter, and the one most likely to be the deciding question in a senior Node interview. It is the reason streams stay memory-safe. Get it wrong and your service works flawlessly in testing, then silently accumulates gigabytes of buffered data under real load and gets OOM-killed &mdash; the most expensive category of production bug because it only shows up when the source is faster than the sink, which is exactly when traffic is high.</p>`,
`<p>The connective tissue that manages backpressure for you is <code>pipe()</code> and its safer successor <code>pipeline()</code>. Knowing not just how to wire streams together but <em>why <code>pipeline()</code> exists and what <code>pipe()</code> gets wrong</em> is a hallmark of someone who has debugged real stream failures. This topic ties the whole chapter together: modes, buffers, highWaterMark, and events all exist to serve backpressure.</p>`,

`<h2>The concept, simply</h2>`,
`<p>Backpressure is what happens when a fast producer is connected to a slow consumer. Picture pouring water from a wide jug into a narrow funnel. If you pour faster than the funnel drains, water backs up and overflows. Backpressure is the funnel telling the jug &ldquo;stop pouring until I catch up.&rdquo; In Node terms: a fast Readable (an SSD at 500&nbsp;MB/s) feeding a slow Writable (a network socket at 5&nbsp;MB/s) must be throttled, or the difference &mdash; 495&nbsp;MB every second &mdash; piles up in memory.</p>`,
`{{fig:ch6-backpressure.svg|A fast Readable feeding a slow Writable: when write returns false the source is paused, and when the buffer drains a drain event resumes it, keeping memory bounded|Backpressure: the slow Writable signals write() false to pause the fast source, then emits drain when its buffer empties so the source resumes — memory stays bounded to the highWaterMark.}}`,
`<p>The signal is the Writable's <code>write()</code> return value. <code>false</code> means &ldquo;my buffer is full, pause.&rdquo; The all-clear is the <code>'drain'</code> event: &ldquo;my buffer emptied below the highWaterMark, resume.&rdquo; The whole protocol is: write until you get <code>false</code>, pause the source, wait for <code>'drain'</code>, resume. When you use <code>pipe()</code> or <code>pipeline()</code>, Node runs this loop for you automatically &mdash; you should almost never write it by hand.</p>`,

`<h2>How it works</h2>`,
`<p><strong>The full signalling loop.</strong> When a Readable is piped to a Writable, each chunk it produces is passed to <code>dest.write(chunk)</code>. If that returns <code>false</code>, <code>pipe()</code> calls <code>source.pause()</code>, halting the flow of <code>'data'</code> events at the source (which in turn stops the source pulling from its underlying resource once its own buffer fills). The Writable keeps draining its buffer to the underlying resource in the background. When the buffered amount falls below the Writable's <code>highWaterMark</code>, it emits <code>'drain'</code>, and <code>pipe()</code> calls <code>source.resume()</code>. The net effect is that total buffered memory across the two streams is bounded to roughly the sum of their highWaterMarks &mdash; a few tens of kilobytes &mdash; no matter how large the data or how big the speed mismatch.</p>`,
`<p><strong>Why <code>pipe()</code> is not enough.</strong> <code>pipe()</code> handles backpressure correctly, but it handles <em>errors</em> badly. If a stream in the chain emits <code>'error'</code>, <code>pipe()</code> does <strong>not</strong> automatically destroy the other streams. Consider <code>a.pipe(b).pipe(c)</code>: if <code>b</code> errors, <code>a</code> and <code>c</code> are left open &mdash; their file descriptors or sockets leak, and under load those leaks exhaust the process. Worse, an unhandled <code>'error'</code> on any of them crashes the process. To use <code>pipe()</code> safely you must attach an <code>'error'</code> handler to every single stream and manually destroy the others, which is verbose and easy to get wrong.</p>`,
`{{fig:ch6-pipe-vs-pipeline.svg|pipe versus pipeline on error: with pipe a middle stream erroring leaves the others open and leaking, while pipeline destroys every stream and reports the error to one callback|On error, pipe() leaves the other streams open (leaking descriptors); pipeline() destroys every stream in the chain and funnels the error to a single callback.}}`,
`<p><strong>What <code>pipeline()</code> fixes.</strong> <code>stream.pipeline(...streams, callback)</code> (and the promise form <code>pipeline</code> from <code>node:stream/promises</code>) wires up backpressure exactly like <code>pipe()</code>, but additionally: if any stream errors or closes early, it <strong>destroys all the others</strong> so nothing leaks; it forwards the error to a single callback (or rejects the promise); and it only reports success when the last stream has genuinely finished. It is the correct default for connecting three-plus streams, and even for two. Since Node 15+ the promise version lets you simply <code>await pipeline(...)</code> inside a <code>try/catch</code>.</p>`,
`<p><strong>Client disconnects are backpressure too.</strong> When you stream a response and the client hangs up, the Writable (<code>res</code>) errors or closes. With <code>pipeline()</code>, the source file stream is destroyed automatically, so you stop reading a file nobody is listening to. With bare <code>pipe()</code>, that read continues, wasting I/O &mdash; another reason to prefer <code>pipeline()</code>.</p>`,

`<h2>Code examples</h2>`,
`<p><strong>1. The wrong way &mdash; ignoring backpressure.</strong> This is the code that passes tests and OOMs in production.</p>`,
`<pre><code class="language-javascript">import { createReadStream, createWriteStream } from 'node:fs';

const src = createReadStream('huge.bin');
const dst = createWriteStream('/dev/slow-disk/out.bin');

// BAD: pushes every chunk into dst regardless of its buffer state.
src.on('data', (chunk) =&gt; {
  dst.write(chunk);          // return value ignored — backpressure lost
});
src.on('end', () =&gt; dst.end());
// If dst is slower than src, dst's buffer grows without bound → memory blows up.</code></pre>`,
`<p><strong>2. The right way &mdash; <code>pipeline()</code> from <code>node:stream/promises</code>.</strong> Backpressure, error propagation, and cleanup all handled.</p>`,
`<pre><code class="language-javascript">import { createReadStream, createWriteStream } from 'node:fs';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';

try {
  await pipeline(
    createReadStream('huge.bin'),
    createGzip(),
    createWriteStream('huge.bin.gz')
  );
  console.log('Done — memory stayed flat, all streams cleaned up.');
} catch (err) {
  // ANY stream erroring lands here; every stream was already destroyed.
  console.error('Pipeline failed:', err.message);
}</code></pre>`,
`<p><strong>3. Streaming an HTTP response safely, handling client disconnect.</strong></p>`,
`<pre><code class="language-javascript">import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

createServer(async (req, res) =&gt; {
  try {
    await pipeline(createReadStream('./big.mp4'), res);
  } catch (err) {
    // Client disconnect (ERR_STREAM_PREMATURE_CLOSE) or read error.
    // pipeline already destroyed the file stream — nothing leaks.
    if (!res.headersSent) { res.statusCode = 500; res.end(); }
  }
}).listen(3000);</code></pre>`,
`<p><strong>4. The manual drain loop &mdash; what <code>pipeline()</code> does for you.</strong> Write this once to understand it, then never again in real code.</p>`,
`<pre><code class="language-javascript">import { once } from 'node:events';
import { createReadStream, createWriteStream } from 'node:fs';

async function copyRespectingBackpressure(from, to) {
  const src = createReadStream(from);
  const dst = createWriteStream(to);
  for await (const chunk of src) {          // paused-mode: one chunk at a time
    if (!dst.write(chunk)) {                // buffer full?
      await once(dst, 'drain');             // wait for it to empty
    }
  }
  dst.end();
  await once(dst, 'finish');
}
// pipeline() also handles errors and destroys both streams — this version does not.</code></pre>`,

`<h2>Common mistakes &amp; gotchas</h2>`,
`<ul>
<li><strong>Ignoring the return value of <code>write()</code> in a manual loop.</strong> The archetypal backpressure bug &mdash; memory grows unbounded, no error is thrown, and it only manifests when the sink is slower than the source.</li>
<li><strong>Using bare <code>pipe()</code> and assuming errors are handled.</strong> They are not. A mid-chain error leaves the other streams open and leaking, and an unhandled <code>'error'</code> crashes the process.</li>
<li><strong>Forgetting to clean up on error even with <code>pipe()</code>.</strong> You must attach <code>'error'</code> to every stream and destroy the rest by hand &mdash; which is precisely why <code>pipeline()</code> exists.</li>
<li><strong>Mixing <code>await pipeline()</code> with the callback form.</strong> Import the promise version from <code>node:stream/promises</code> to <code>await</code>; the one from <code>node:stream</code> takes a callback and returns the last stream, not a promise.</li>
<li><strong>Not handling client disconnects</strong> when streaming responses &mdash; without <code>pipeline()</code>, the source keeps reading a file no one will receive.</li>
<li><strong>Cranking the <code>highWaterMark</code> way up to &ldquo;go faster.&rdquo;</strong> It just raises the memory ceiling and delays backpressure; it does not increase real throughput past the sink's actual rate.</li>
</ul>`,

`<h2>Best practices</h2>`,
`<ul>
<li><strong>Default to <code>pipeline()</code></strong> &mdash; specifically the promise version from <code>node:stream/promises</code> with <code>await</code> inside <code>try/catch</code> &mdash; for essentially all stream wiring, even two streams.</li>
<li><strong>Never ignore the <code>write()</code> return value</strong> in any hand-written loop; pause on <code>false</code>, resume on <code>'drain'</code>.</li>
<li><strong>Let backpressure do its job</strong> &mdash; don't defeat it by buffering chunks in an array or by raising the highWaterMark to hide a slow sink.</li>
<li><strong>Handle errors in one place.</strong> With <code>pipeline()</code> that is the catch/callback; avoid scattering <code>'error'</code> handlers across a bare <code>pipe()</code> chain.</li>
<li><strong>For streaming responses, always account for client disconnect</strong> &mdash; <code>pipeline()</code> tears down the source automatically so you stop doing useless I/O.</li>
<li><strong>Reach for <code>stream/promises</code> helpers</strong> (<code>pipeline</code>, <code>finished</code>) rather than manually listening for <code>'end'</code>/<code>'finish'</code>/<code>'close'</code>.</li>
</ul>`,

`<h2>⭐ Interview lens</h2>`,
`<blockquote><p><strong>Q: What is backpressure and what mechanism implements it?</strong><br>Backpressure is a slow consumer throttling a fast producer so buffered data stays bounded. The mechanism: <code>writable.write()</code> returns <code>false</code> when the internal buffer reaches the highWaterMark; the producer pauses and waits for the <code>'drain'</code> event before resuming. <code>pipe()</code>/<code>pipeline()</code> run this loop automatically.</p></blockquote>`,
`<blockquote><p><strong>Q: Why prefer <code>pipeline()</code> over <code>pipe()</code>?</strong> (The signature question.)<br>Both handle backpressure, but <code>pipe()</code> does not propagate errors or clean up: if one stream errors, the others stay open and leak descriptors, and an unhandled <code>'error'</code> crashes the process. <code>pipeline()</code> destroys every stream in the chain on any error or early close and reports the error to a single callback or rejected promise. It is safer and less code.</p></blockquote>`,
`<blockquote><p><strong>Q: In <code>a.pipe(b).pipe(c)</code>, <code>b</code> throws an error. What happens to <code>a</code> and <code>c</code>?</strong> (Trap.)<br>They are <em>not</em> automatically closed. <code>a</code> keeps reading and <code>c</code> stays open &mdash; leaking their underlying resources &mdash; and if <code>b</code>'s <code>'error'</code> has no listener the process crashes. This is the core reason to use <code>pipeline(a, b, c)</code>, which destroys all three.</p></blockquote>`,
`<blockquote><p><strong>Q: You ignore the boolean from <code>write()</code> and just keep writing. What breaks and when?</strong><br>Nothing throws; the Writable's buffer grows past its highWaterMark without limit. Memory climbs and the process is eventually OOM-killed &mdash; but only when the sink is slower than the source, i.e., under real load, not in tests. It is a latent memory leak, not an immediate error.</p></blockquote>`,
`<blockquote><p><strong>Q: Does raising the <code>highWaterMark</code> increase throughput?</strong><br>Generally no. It raises how much data can buffer before backpressure kicks in &mdash; a bigger memory ceiling, not a faster sink. Real throughput is capped by the slowest stage. A larger mark can slightly reduce syscall overhead in some cases, but it mainly trades memory for delayed backpressure.</p></blockquote>`,
`<blockquote><p><strong>Q: How do you correctly handle a client disconnecting mid-stream while you serve a large file?</strong><br>Use <code>await pipeline(fileStream, res)</code> in a <code>try/catch</code>. On disconnect the response Writable closes/errors, <code>pipeline</code> rejects (often <code>ERR_STREAM_PREMATURE_CLOSE</code>) and automatically destroys the file Readable, so you immediately stop reading a file no one will receive. Bare <code>pipe()</code> would keep reading.</p></blockquote>`,

`<h2>Cheat-card</h2>`,
`<ul>
<li><strong>Backpressure</strong> = slow sink throttles fast source so memory stays bounded.</li>
<li><strong>Signal</strong>: <code>write()</code> → <code>false</code> (buffer ≥ highWaterMark) → pause; <code>'drain'</code> → resume.</li>
<li><strong><code>pipe()</code></strong>: handles backpressure, <em>not</em> errors/cleanup — a mid-chain error leaks the other streams and can crash the process.</li>
<li><strong><code>pipeline()</code></strong>: backpressure <em>plus</em> destroys all streams on error and reports to one place. The correct default.</li>
<li><strong>Use</strong> <code>import { pipeline } from 'node:stream/promises'</code> → <code>await pipeline(a, b, c)</code> in <code>try/catch</code>.</li>
<li><strong>Don't</strong> ignore <code>write()</code>'s return, buffer chunks to defeat backpressure, or raise highWaterMark to &ldquo;go faster.&rdquo;</li>
</ul>`
      ].join('\n')
    }
  ]
};
