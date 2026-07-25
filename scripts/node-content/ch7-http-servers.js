// Chapter 7 — HTTP & Web Servers (Node.js Backend Kit)
// Authored content module. Node v20+ examples, no framework.

module.exports = {
  title: 'HTTP & Web Servers',
  slug: 'http-servers',
  order: 6,
  topics: [
    // ────────────────────────────────────────────────────────────────
    // Topic 0 — the http module
    // ────────────────────────────────────────────────────────────────
    {
      title: 'The http module & createServer',
      slug: 'http-module',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Every web framework you have ever used in Node &mdash; Express, Fastify, Koa, Next.js, NestJS &mdash; is, at the bottom, a thin wrapper around one built-in module: <code>node:http</code>. When a request lands on your server, it is <code>http.Server</code> that accepted the TCP connection, parsed the bytes, and handed your code a <code>req</code> and a <code>res</code>. Frameworks add routing, middleware, and ergonomics, but they never replace this layer; they sit on top of it.</p>`,
        `<p>Understanding the raw module pays off in three concrete ways. First, <strong>debugging</strong>: when a request hangs, a socket leaks, or a response never flushes, the symptoms surface at the <code>http</code> layer, and you cannot reason about them if it is a black box. Second, <strong>performance</strong>: keep-alive, header size limits, and streaming all live here, and the defaults matter under load. Third, <strong>interviews</strong>: &ldquo;build an HTTP server without Express&rdquo; is one of the most common Node screening questions precisely because it reveals whether you understand the platform or just an abstraction over it.</p>`,
        `<p>This topic strips everything away. No <code>npm install</code>, no framework &mdash; just the module that ships with Node, the <code>createServer</code> factory, and the lifecycle of a single request from socket to response.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>An HTTP server is a long-running process that listens on a TCP port. When a client opens a connection and sends an HTTP request, the server runs a function you supplied, giving it two objects: a <em>request</em> (what the client sent) and a <em>response</em> (a handle you write the reply into). You never poll or block waiting for requests &mdash; Node's event loop calls your function each time one arrives.</p>`,
        `<p>Two ideas make this click. The server is an <strong>EventEmitter</strong>: the callback you pass to <code>createServer</code> is registered as a listener for the <code>'request'</code> event. And <code>req</code> / <code>res</code> are <strong>streams</strong> &mdash; <code>req</code> is readable (the incoming body arrives in chunks) and <code>res</code> is writable (you push bytes back out). Once you see the request/response pair as &ldquo;an event carrying two streams,&rdquo; the rest of the module stops being magic.</p>`,
        `{{fig:ch7-http-lifecycle.svg|Diagram of a request travelling from client to http.Server to your handler and a response travelling back|The request/response lifecycle: one TCP socket, req is readable, res is writable.}}`,

        `<h2>How it works</h2>`,
        `<p><code>http.createServer([options][, requestListener])</code> returns an <code>http.Server</code> instance. Calling <code>server.listen(port)</code> binds a listening socket and, from then on, the OS hands new TCP connections to Node. For each connection Node reads bytes off the socket and feeds them into an internal C++ HTTP parser (llhttp). The parser recognises the request line and headers, and the moment it has a complete header block it constructs an <code>http.IncomingMessage</code> (your <code>req</code>) and an <code>http.ServerResponse</code> (your <code>res</code>) and emits <code>'request'</code>.</p>`,
        `<p>Crucially, the <code>'request'</code> event fires <strong>after headers are parsed but before the body is read</strong>. The body may still be arriving. That is why <code>req</code> is a readable stream: you subscribe to its <code>'data'</code> and <code>'end'</code> events (or pipe it) to consume the payload. For a <code>GET</code> with no body, <code>'end'</code> fires almost immediately.</p>`,
        `<p>The <code>res</code> object is a writable stream with HTTP semantics layered on. Writing works in three logical phases: (1) the <strong>status line and headers</strong> &mdash; set with <code>res.statusCode</code>, <code>res.setHeader()</code>, or all at once with <code>res.writeHead()</code>; (2) the <strong>body</strong> &mdash; <code>res.write(chunk)</code>, callable many times to stream; (3) <strong>termination</strong> &mdash; <code>res.end([chunk])</code>, which flushes and closes the response. Headers can only be set before the first byte of body is written; after that they are &ldquo;sent&rdquo; and mutating them throws <code>ERR_HTTP_HEADERS_SENT</code>.</p>`,
        `<p>The server itself emits more than <code>'request'</code>. It emits <code>'connection'</code> for each new TCP socket, <code>'close'</code> when it stops, <code>'clientError'</code> when a malformed request cannot be parsed, and <code>'listening'</code> once the port is bound. Because it is an EventEmitter, <code>createServer(fn)</code> is literally sugar for <code>new http.Server().on('request', fn)</code>.</p>`,
        `{{fig:ch7-createserver-events.svg|Diagram showing createServer emitting request, connection, close and error events|The server is an EventEmitter; your callback is just a 'request' listener.}}`,
        `<p>One more mental model that avoids bugs: the callback runs <strong>once per request</strong>, and there is no global &ldquo;current request&rdquo; &mdash; every request has its own <code>req</code>/<code>res</code> closure. State you want to share across requests lives in module scope; state for a single request lives in that invocation.</p>`,
        `<p>It also helps to know that one TCP socket can carry <strong>many</strong> requests. Because HTTP/1.1 keep-alive is on by default, after you call <code>res.end()</code> Node keeps the connection open and the llhttp parser simply resets to await the next request line on the same socket, emitting <code>'request'</code> again with a brand-new <code>req</code>/<code>res</code> pair. So the <code>'connection'</code> event fires once per socket, but <code>'request'</code> can fire repeatedly on that same socket. This is why you attach per-request logic in the <code>'request'</code> listener and per-connection logic (rate-limiting by IP, socket timeouts) in <code>'connection'</code>. The pairing between a request and its response is positional: HTTP/1.1 has no request IDs, so responses must be written back in the exact order the requests arrived, which is precisely the head-of-line constraint that HTTP/2 later removed.</p>`,
        `<p>Finally, the server exposes a set of timeouts that are your first line of defence against slow or abusive clients. Node v18+ ships with safe defaults, but you should still set them deliberately for a production service. The table below summarises the ones that matter most:</p>`,
        `<table>`,
        `<thead><tr><th>Property</th><th>Default (v20/22)</th><th>What it guards</th></tr></thead>`,
        `<tbody>`,
        `<tr><td><code>server.headersTimeout</code></td><td>60000&nbsp;ms</td><td>Max time to receive the complete header block &mdash; stops slow-loris header dribbling.</td></tr>`,
        `<tr><td><code>server.requestTimeout</code></td><td>300000&nbsp;ms</td><td>Max time to receive the entire request (headers + body).</td></tr>`,
        `<tr><td><code>server.keepAliveTimeout</code></td><td>5000&nbsp;ms</td><td>How long an idle keep-alive socket waits for the next request before closing.</td></tr>`,
        `<tr><td><code>server.timeout</code></td><td>0 (off)</td><td>Inactivity timeout on the socket once a request is in flight.</td></tr>`,
        `<tr><td><code>server.maxHeadersCount</code></td><td>2000</td><td>Caps the number of headers to bound parser memory.</td></tr>`,
        `</tbody>`,
        `</table>`,

        `<h2>Code examples</h2>`,
        `<p>The smallest complete server. It answers every request with plain text.</p>`,
        `<pre><code class="language-javascript">const http = require('node:http');

const server = http.createServer((req, res) =&gt; {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Hello from raw Node\\n');
});

server.listen(3000, () =&gt; {
  console.log('Listening on http://localhost:3000');
});</code></pre>`,
        `<p>The same server written to show that the callback is just an event listener, plus lifecycle hooks you will use in production (graceful logging, error handling):</p>`,
        `<pre><code class="language-javascript">const http = require('node:http');

const server = http.createServer();

server.on('request', (req, res) =&gt; {
  console.log(req.method, req.url);
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});

server.on('clientError', (err, socket) =&gt; {
  // Malformed request line/headers — parser could not build a req.
  socket.end('HTTP/1.1 400 Bad Request\\r\\n\\r\\n');
});

server.on('listening', () =&gt; console.log('up'));
server.listen(3000);</code></pre>`,
        `<p>Streaming a response instead of buffering it &mdash; this is where <code>res</code> being a writable stream earns its keep. We send a large body in chunks without ever holding it all in memory:</p>`,
        `<pre><code class="language-javascript">const http = require('node:http');

http.createServer((req, res) =&gt; {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  let n = 0;
  const timer = setInterval(() =&gt; {
    res.write(\`line \${++n}\\n\`);
    if (n === 5) {
      clearInterval(timer);
      res.end('done\\n'); // flush + close
    }
  }, 200);

  // If the client disconnects mid-stream, stop working.
  res.on('close', () =&gt; clearInterval(timer));
}).listen(3000);</code></pre>`,
        `<p>Graceful shutdown &mdash; a real service must stop accepting new connections but let in-flight requests finish. <code>server.close()</code> does exactly that:</p>`,
        `<pre><code class="language-javascript">const server = http.createServer(handler).listen(3000);

process.on('SIGTERM', () =&gt; {
  server.close(() =&gt; {
    console.log('drained, exiting');
    process.exit(0);
  });
  // Force-exit if connections don't drain in time.
  setTimeout(() =&gt; process.exit(1), 10_000).unref();
});</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Forgetting <code>res.end()</code>.</strong> If you never call <code>end()</code>, the response never finishes, the client hangs until timeout, and the socket is held open. Every code path &mdash; including error branches &mdash; must terminate the response exactly once.</li>`,
        `<li><strong>Setting headers after the body.</strong> <code>res.setHeader()</code> or <code>writeHead()</code> after the first <code>res.write()</code> throws <code>ERR_HTTP_HEADERS_SENT</code>. Decide status and headers first.</li>`,
        `<li><strong>Assuming the body is available in the callback.</strong> The <code>'request'</code> event fires before the body arrives. Reading <code>req.body</code> gives <code>undefined</code> &mdash; there is no such property on the raw object; you must consume the stream.</li>`,
        `<li><strong>Blocking the event loop.</strong> A synchronous CPU-heavy loop or <code>fs.readFileSync</code> inside the handler stalls <em>every</em> concurrent request, because one thread services them all.</li>`,
        `<li><strong>Ignoring backpressure.</strong> <code>res.write()</code> returns <code>false</code> when the kernel buffer is full; ignoring it while pumping a fast source balloons memory. Use <code>pipe()</code> or honour the return value.</li>`,
        `<li><strong>Leaking the port in tests.</strong> Forgetting <code>server.close()</code> keeps the process alive and the port bound, causing <code>EADDRINUSE</code> on the next run.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Import with the <code>node:</code> prefix</strong> (<code>require('node:http')</code>) so it is unambiguous that you mean the builtin, not an npm package.</li>`,
        `<li><strong>Always attach a <code>'clientError'</code> handler</strong> and an <code>'error'</code> handler on the server &mdash; unhandled server errors crash the process.</li>`,
        `<li><strong>Set explicit timeouts</strong> (<code>server.requestTimeout</code>, <code>server.headersTimeout</code>, <code>server.keepAliveTimeout</code>) to defend against slow-loris style attacks; the defaults are safer in v20 but still worth setting deliberately.</li>`,
        `<li><strong>Terminate the response in a <code>finally</code>-style single exit</strong> so no branch forgets <code>res.end()</code>.</li>`,
        `<li><strong>Implement graceful shutdown</strong> with <code>server.close()</code> on <code>SIGTERM</code> for zero-downtime deploys.</li>`,
        `<li><strong>Never trust request input</strong> at this layer &mdash; size-limit the body and validate headers before acting on them.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: What does <code>http.createServer(fn)</code> actually do with <code>fn</code>?</strong><br>It constructs an <code>http.Server</code> (an EventEmitter) and registers <code>fn</code> as a listener for the <code>'request'</code> event. It is equivalent to <code>new http.Server().on('request', fn)</code>. The function is invoked once per incoming HTTP request with a fresh <code>req</code>/<code>res</code> pair.</p></blockquote>`,
        `<blockquote><p><strong>Q: When exactly does the request callback fire &mdash; before or after the body arrives?</strong><br>After the request line and headers are parsed, but generally <em>before</em> the body is fully received. That is why <code>req</code> is a readable stream and you must listen for <code>'data'</code>/<code>'end'</code> (or pipe it) to get the body. A common trap answer is &ldquo;when the whole request is in&rdquo; &mdash; wrong.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why can't you call <code>res.setHeader()</code> after <code>res.write()</code>?</strong><br>Because <code>write()</code> flushes the status line and headers to the socket first; once sent, they are immutable on the wire. Node enforces this by throwing <code>ERR_HTTP_HEADERS_SENT</code>. Headers must be finalised before any body byte.</p></blockquote>`,
        `<blockquote><p><strong>Q: Is <code>req</code> a stream? What kind?</strong><br>Yes &mdash; <code>req</code> (an <code>IncomingMessage</code>) is a <em>readable</em> stream; <code>res</code> (a <code>ServerResponse</code>) is a <em>writable</em> stream. This is the single most important fact about the module and unlocks streaming uploads/downloads.</p></blockquote>`,
        `<blockquote><p><strong>Q: Trap &mdash; if a request handler runs a 2-second synchronous loop, what happens to other clients?</strong><br>They all wait. Node handles requests on one event-loop thread; a synchronous block freezes the entire process, so every concurrent request is delayed by 2 seconds. The fix is to make the work async or offload it (worker thread / child process).</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you shut a server down without dropping in-flight requests?</strong><br>Call <code>server.close(callback)</code>: it stops accepting new connections and invokes the callback once existing ones drain. Pair it with a forced-exit timeout so a stuck keep-alive connection cannot block shutdown forever.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><code>const http = require('node:http')</code> &mdash; builtin, no install.</li>`,
        `<li><code>http.createServer(fn)</code> = <code>new http.Server().on('request', fn)</code>.</li>`,
        `<li><code>server.listen(port[, cb])</code> binds the port; <code>'listening'</code> fires when ready.</li>`,
        `<li><code>req</code> = <code>IncomingMessage</code> (readable); <code>res</code> = <code>ServerResponse</code> (writable).</li>`,
        `<li>Callback fires after headers, before body. Body via <code>'data'</code>/<code>'end'</code>.</li>`,
        `<li>Order: status + headers &rarr; <code>res.write()</code> &rarr; <code>res.end()</code>. End exactly once.</li>`,
        `<li>Headers are immutable after first body byte (<code>ERR_HTTP_HEADERS_SENT</code>).</li>`,
        `<li>Graceful stop: <code>server.close()</code> on <code>SIGTERM</code>.</li>`,
        `<li>One thread services all requests &mdash; never block it.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // Topic 1 — request / response
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Parsing requests & writing responses',
      slug: 'request-response',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>The <code>req</code> and <code>res</code> objects are where your server meets the network. Everything a client tells you &mdash; which resource, which verb, what content type, the auth token, the JSON payload &mdash; arrives on <code>req</code>. Everything you tell the client back &mdash; success or failure, the shape of the data, caching rules, cookies &mdash; you encode into <code>res</code>. Get these two objects right and your endpoints are correct, cacheable, and secure; get them wrong and you leak memory on large uploads, corrupt UTF-8 text, or silently accept malformed input.</p>`,
        `<p>This is also the layer frameworks hide, which means when something misbehaves &mdash; a body that never parses, a response that arrives with the wrong charset, a header the browser rejects &mdash; the fix lives here. And in interviews, &ldquo;how do you read a POST body without Express?&rdquo; separates people who understand streams from people who have only memorised <code>app.use(express.json())</code>.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>An HTTP request has four parts: a <strong>method</strong> (GET, POST&hellip;), a <strong>target</strong> (the URL path plus query string), a set of <strong>headers</strong> (key/value metadata), and an optional <strong>body</strong> (the payload). Node parses the first three for you and exposes them synchronously as <code>req.method</code>, <code>req.url</code>, and <code>req.headers</code>. The body it does <em>not</em> parse &mdash; it hands you a stream, because a body can be gigabytes and Node will not silently buffer that into memory for you.</p>`,
        `<p>A response mirrors this: a <strong>status code</strong> (200, 404, 500&hellip;), <strong>headers</strong>, and a <strong>body</strong>. You set the status and headers, then write the body. That is the whole contract.</p>`,
        `{{fig:ch7-request-anatomy.svg|Diagram mapping raw HTTP request bytes to Node's req.method, req.url, req.headers and the streamed body|Node parses the start line and headers into properties; the body stays a raw stream.}}`,

        `<h2>How it works</h2>`,
        `<p><strong>Method and URL.</strong> <code>req.method</code> is the uppercase verb string. <code>req.url</code> is only the <em>path and query</em> &mdash; e.g. <code>'/users?active=1'</code> &mdash; not the full URL; the host lives in <code>req.headers.host</code>. To parse it safely, use the WHATWG <code>URL</code> class with a base: <code>new URL(req.url, \`http://\${req.headers.host}\`)</code>, which gives you <code>.pathname</code> and a <code>.searchParams</code> object. The legacy <code>url.parse()</code> is deprecated and has security footguns.</p>`,
        `<p><strong>Headers.</strong> <code>req.headers</code> is a plain object with <strong>lowercased</strong> keys (HTTP header names are case-insensitive, so Node normalises them). Most headers are strings; <code>set-cookie</code> is special and is always an array. Duplicate headers other than a few are joined with <code>', '</code>. There is also <code>req.rawHeaders</code>, a flat array preserving original case and order, if you need the wire form.</p>`,
        `<p><strong>The body.</strong> Because <code>req</code> is a readable stream, you assemble the body by collecting chunks. Chunks are <code>Buffer</code>s, not strings &mdash; concatenate the buffers and decode <em>once</em> at the end, otherwise a multi-byte UTF-8 character split across two chunks gets corrupted. You must also <strong>size-limit</strong> the body: an attacker (or a bug) can stream forever, so abort past a threshold. In modern Node you can skip the manual loop entirely with <code>req.text()</code> / <code>req.json()</code>-style helpers via <code>node:stream/consumers</code>, but knowing the manual version is expected.</p>`,
        `<p><strong>Writing the response.</strong> <code>res.statusCode</code> defaults to 200. Set it, or pass it to <code>res.writeHead(status, headers)</code> which sets status and multiple headers in one call. <code>res.setHeader(name, value)</code> sets one header (and can be called repeatedly before the body). The body is written with <code>res.write()</code> (0+ times) and finished with <code>res.end()</code>. Always send a <code>Content-Type</code> &mdash; without it browsers guess (&ldquo;MIME sniffing&rdquo;), which is both a correctness and a security problem. For text, include the charset: <code>text/plain; charset=utf-8</code>.</p>`,
        `<p><strong>Content-Length vs chunked.</strong> If you know the full body size, set <code>Content-Length</code> and the response is sent with that length. If you stream with multiple <code>write()</code>s and no length, Node uses <em>chunked transfer-encoding</em> automatically. Both are valid; you rarely set the encoding by hand.</p>`,
        `<p><strong>Backpressure on the response.</strong> <code>res.write(chunk)</code> returns a boolean: <code>true</code> means the chunk fit in the kernel/socket buffer, <code>false</code> means the buffer is full and the data is being queued in memory. If you are copying from a fast source (a file, a database cursor) to a slow client and you ignore that <code>false</code>, Node keeps buffering and memory climbs unbounded. The correct pattern is to stop writing, wait for the writable stream's <code>'drain'</code> event, then resume &mdash; or simply <code>pipeline(source, res)</code> and let Node manage the flow control for you. This is the single most important reason to prefer <code>pipe</code>/<code>pipeline</code> over a hand-rolled read-and-write loop when relaying a stream to a response.</p>`,
        `<p><strong>What ends a response, and what a 1xx or HEAD changes.</strong> A response is complete when Node has sent everything the framing promises: a full <code>Content-Length</code> worth of bytes, or the terminating zero-length chunk for chunked encoding. <code>res.end()</code> writes that terminator. Two edge cases surprise people. For a <code>HEAD</code> request you must send the exact same headers (including <code>Content-Length</code>) as the equivalent <code>GET</code>, but no body &mdash; so call <code>res.end()</code> with no data. And informational <code>1xx</code> responses (like <code>100 Continue</code> or <code>103 Early Hints</code>) are sent with <code>res.writeProcessing()</code> / <code>res.writeEarlyHints()</code> <em>before</em> the final status; they do not count as &ldquo;the&rdquo; response and do not lock your headers, so you can still send a normal <code>200</code> afterwards.</p>`,
        `<p><strong>Trailers.</strong> Occasionally you need to send a header whose value you only know <em>after</em> the body (a checksum, a computed length). HTTP supports <em>trailers</em> for exactly this: declare them up front with <code>res.setHeader('Trailer', 'Content-MD5')</code> (only valid with chunked encoding), stream the body, then supply the values with <code>res.addTrailers({ 'Content-MD5': digest })</code> immediately before <code>res.end()</code>. They are rarely needed but come up in streaming and gRPC-over-HTTP contexts.</p>`,

        `<h2>Code examples</h2>`,
        `<p>Reading a JSON body safely, with a size cap and correct decoding:</p>`,
        `<pre><code class="language-javascript">const http = require('node:http');

const MAX_BODY = 1_000_000; // 1 MB

function readJson(req) {
  return new Promise((resolve, reject) =&gt; {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) =&gt; {
      size += chunk.length;
      if (size &gt; MAX_BODY) {
        reject(Object.assign(new Error('Payload too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () =&gt; {
      if (chunks.length === 0) return resolve(undefined);
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('Invalid JSON'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

http.createServer(async (req, res) =&gt; {
  if (req.method === 'POST') {
    try {
      const body = await readJson(req);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: body }));
    } catch (err) {
      res.writeHead(err.status || 500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  } else {
    res.writeHead(405, { Allow: 'POST' }).end();
  }
}).listen(3000);</code></pre>`,
        `<p>The same body read using the modern stream-consumers helper (Node 16.7+), which handles the loop for you:</p>`,
        `<pre><code class="language-javascript">const { json } = require('node:stream/consumers');

http.createServer(async (req, res) =&gt; {
  const body = await json(req); // reads + JSON.parses the stream
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ received: body }));
}).listen(3000);</code></pre>`,
        `<p>Inspecting the request &mdash; method, path, query, and a header &mdash; and echoing them back:</p>`,
        `<pre><code class="language-javascript">http.createServer((req, res) =&gt; {
  const url = new URL(req.url, \`http://\${req.headers.host}\`);
  const info = {
    method: req.method,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    userAgent: req.headers['user-agent'] ?? null,
    httpVersion: req.httpVersion,
  };
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(info, null, 2));
}).listen(3000);</code></pre>`,
        `<p>Setting several response headers, including a cookie, and choosing an explicit status:</p>`,
        `<pre><code class="language-javascript">http.createServer((req, res) =&gt; {
  res.statusCode = 201;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Set-Cookie', 'sid=abc123; HttpOnly; Path=/; SameSite=Lax');
  res.end(JSON.stringify({ id: 42 }));
}).listen(3000);</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Treating <code>req.url</code> as the full URL.</strong> It is only the path + query. Building a <code>URL</code> without a base throws; supply <code>http://\${req.headers.host}</code>.</li>`,
        `<li><strong>Decoding each chunk separately.</strong> <code>chunk.toString()</code> per chunk corrupts multi-byte characters that straddle a chunk boundary. Concatenate buffers, then decode once.</li>`,
        `<li><strong>No body size limit.</strong> Buffering an unbounded stream into an array is a denial-of-service vector. Always cap and abort.</li>`,
        `<li><strong>Assuming header values are strings.</strong> <code>set-cookie</code> is always an array; some proxies send repeated headers. Handle both.</li>`,
        `<li><strong>Omitting <code>Content-Type</code>.</strong> Leads to MIME sniffing and broken clients; for JSON always send <code>application/json</code>.</li>`,
        `<li><strong>Wrong status semantics.</strong> Returning <code>200</code> with an error body, or <code>500</code> for user input errors. Use <code>4xx</code> for client faults, <code>5xx</code> for server faults.</li>`,
        `<li><strong>Trusting header case.</strong> Reading <code>req.headers['Content-Type']</code> returns <code>undefined</code> &mdash; keys are lowercased. Use <code>'content-type'</code>.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Parse URLs with the WHATWG <code>URL</code> class</strong>, never the deprecated <code>url.parse()</code>.</li>`,
        `<li><strong>Cap body size</strong> and reject with <code>413 Payload Too Large</code> before buffering the rest.</li>`,
        `<li><strong>Always set an explicit <code>Content-Type</code> with charset</strong> for text.</li>`,
        `<li><strong>Validate <code>Content-Type</code> before parsing</strong> &mdash; do not <code>JSON.parse</code> a body a client claimed was <code>text/html</code>.</li>`,
        `<li><strong>Return the right status code</strong>: <code>400</code> invalid, <code>401</code> unauth, <code>404</code> missing, <code>405</code> wrong method (with an <code>Allow</code> header), <code>413</code> too big, <code>500</code> server error.</li>`,
        `<li><strong>Set security headers</strong> (<code>X-Content-Type-Options: nosniff</code>, <code>Cache-Control</code>) deliberately rather than relying on defaults.</li>`,
        `<li><strong>Prefer <code>node:stream/consumers</code></strong> (<code>json()</code>, <code>text()</code>, <code>buffer()</code>) for concise, correct body reading.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: How do you read a POST body in raw Node?</strong><br>Listen on the <code>req</code> stream: collect <code>Buffer</code> chunks in <code>'data'</code>, concatenate them in <code>'end'</code> with <code>Buffer.concat</code>, then decode with <code>.toString('utf8')</code> and parse. Enforce a max size and handle <code>'error'</code>. Modern shortcut: <code>await require('node:stream/consumers').json(req)</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why concatenate buffers instead of building a string chunk by chunk?</strong><br>A UTF-8 character can span two chunks; calling <code>toString()</code> on each chunk decodes a partial byte sequence and produces replacement characters (&#65533;). Concatenating the raw buffers first and decoding once preserves the bytes.</p></blockquote>`,
        `<blockquote><p><strong>Q: What is in <code>req.url</code> exactly?</strong><br>Only the request target: the path and query string (e.g. <code>/search?q=node</code>). Not the scheme, not the host. The host is in <code>req.headers.host</code>. To parse, use <code>new URL(req.url, \`http://\${req.headers.host}\`)</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: Trap &mdash; why does <code>req.headers['Content-Type']</code> come back <code>undefined</code>?</strong><br>Node lowercases all header keys, so the correct access is <code>req.headers['content-type']</code>. Header names are case-insensitive on the wire; Node normalises them to lowercase in the parsed object.</p></blockquote>`,
        `<blockquote><p><strong>Q: What's the difference between <code>writeHead</code> and <code>setHeader</code>?</strong><br><code>setHeader(name, value)</code> sets one header and can be called repeatedly before the body; the header can still be read back or overwritten. <code>writeHead(status, headers)</code> sets the status and a batch of headers and marks them as sent &mdash; after it, headers are effectively flushed. You cannot <code>setHeader</code> after <code>writeHead</code>/first <code>write</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: Which status for &ldquo;the client used the wrong HTTP method&rdquo;?</strong><br><code>405 Method Not Allowed</code>, and you must include an <code>Allow</code> header listing the accepted methods. Returning <code>404</code> or <code>400</code> is a common wrong answer.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><code>req.method</code> &mdash; uppercase verb; <code>req.url</code> &mdash; path + query only.</li>`,
        `<li><code>req.headers</code> &mdash; lowercased keys; <code>set-cookie</code> is an array.</li>`,
        `<li>Body = stream: <code>'data'</code> (Buffers) &rarr; <code>Buffer.concat</code> &rarr; <code>.toString('utf8')</code>.</li>`,
        `<li>Parse URL: <code>new URL(req.url, \`http://\${req.headers.host}\`)</code>.</li>`,
        `<li>Shortcut: <code>stream/consumers</code> &rarr; <code>json()</code> / <code>text()</code> / <code>buffer()</code>.</li>`,
        `<li>Response: set status + headers &rarr; <code>write</code> &rarr; <code>end</code>.</li>`,
        `<li>Always send <code>Content-Type</code>; cap body size (413).</li>`,
        `<li>Status map: 400 / 401 / 404 / 405+Allow / 413 / 500.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // Topic 2 — routing basics
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Manual routing & serving JSON',
      slug: 'routing-basics',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>A real API answers <em>different requests differently</em>: <code>GET /users</code> lists, <code>POST /users</code> creates, <code>GET /users/42</code> fetches one, and anything else returns 404. That dispatch &mdash; deciding which handler runs based on method and path &mdash; is <strong>routing</strong>. Frameworks give you <code>app.get('/users', ...)</code>, but under the hood they are doing exactly what you will build by hand here: reading <code>req.method</code> and the URL pathname and choosing a function.</p>`,
        `<p>Writing routing yourself once is worth a dozen framework tutorials. It shows you where path parameters come from, why route order matters, how query strings are parsed, and why a missing default case leaves requests hanging. It is also a staple interview exercise &mdash; &ldquo;implement a tiny router&rdquo; &mdash; because it exercises string handling, HTTP semantics, and clean control flow all at once.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>Routing is a two-key lookup: <strong>method + path &rarr; handler</strong>. You take the incoming <code>req.method</code> and the URL's <code>pathname</code>, compare them against the routes you know about, and call the matching handler. If nothing matches, you send a <code>404</code>. If the path matches but the method does not, you send a <code>405</code>. Everything else &mdash; parsing the query string, extracting an id from <code>/users/42</code>, serving JSON &mdash; is detail layered on top of that core decision.</p>`,
        `{{fig:ch7-routing-flow.svg|Diagram of a request being matched by method and path to one of several handlers, with a 404 fallthrough|Manual routing matches method plus path; an unmatched request must still get a default 404.}}`,

        `<h2>How it works</h2>`,
        `<p><strong>Separating path from query.</strong> <code>req.url</code> bundles both (<code>/users?active=1</code>). Build a <code>URL</code> object &mdash; <code>const u = new URL(req.url, \`http://\${req.headers.host}\`)</code> &mdash; and route on <code>u.pathname</code> (<code>/users</code>), reading filters from <code>u.searchParams</code>. Never route on the raw <code>req.url</code>, or a query string would break every equality check.</p>`,
        `<p><strong>Static vs dynamic paths.</strong> A static route is a literal string compare: <code>pathname === '/users'</code>. A dynamic route has a parameter, like <code>/users/:id</code>. Two common techniques: split the pathname on <code>/</code> and inspect segments (<code>parts[1] === 'users' &amp;&amp; parts[2]</code>), or match a <code>RegExp</code> with a capture group (<code>/^\\/users\\/([^/]+)$/</code>) and read the captured id. Real routers precompile a set of such patterns.</p>`,
        `<p><strong>Method matters.</strong> The same path serves different verbs. Structure the dispatch so that a matched path checks the method and returns <code>405</code> (with an <code>Allow</code> header) when the verb is unsupported, rather than falling through to <code>404</code> &mdash; that distinction is semantically correct and helps clients.</p>`,
        `<p><strong>Query parsing.</strong> <code>u.searchParams</code> is a <code>URLSearchParams</code> instance: <code>.get('q')</code> for a single value, <code>.getAll('tag')</code> for repeats, <code>Object.fromEntries(u.searchParams)</code> for a plain object (note: that collapses repeated keys to the last). Values are already percent-decoded.</p>`,
        `<p><strong>Serving JSON.</strong> Set <code>Content-Type: application/json</code>, then <code>res.end(JSON.stringify(data))</code>. A small <code>sendJson(res, status, data)</code> helper removes repetition and guarantees every response has the right header and a single <code>end()</code>. The key discipline: <em>every branch must terminate the response exactly once</em>, and there must be a catch-all 404 so no request escapes unanswered.</p>`,
        `<p><strong>Order and fallthrough.</strong> Routes are evaluated in order; the first match wins. Put specific routes before general ones. After all checks, an explicit <code>else</code> sends the 404 &mdash; this is the single most common bug when hand-rolling routing: forgetting the default leaves unmatched requests to hang until the client times out.</p>`,
        `<p><strong>Normalising the path before you match.</strong> Two URLs that look the same to a human can be different strings to a naive router. <code>/Users</code> and <code>/users</code> differ in case; <code>/users/</code> has a trailing slash; <code>/users/%34%32</code> is a percent-encoded <code>/users/42</code>. The <code>URL</code> class already percent-decodes <code>pathname</code> for you, but it does <em>not</em> lower-case or strip trailing slashes &mdash; those are policy decisions you make. A common approach is to canonicalise once at the top of the handler: lower-case the pathname if your routes are case-insensitive, and strip a single trailing slash (except for the root <code>/</code>) so <code>/users</code> and <code>/users/</code> hit the same handler. Do this <em>before</em> any comparison so every route benefits, and be deliberate about it &mdash; some APIs treat a trailing slash as a distinct &ldquo;collection&rdquo; resource on purpose.</p>`,
        `<p><strong>Matching strategies at a glance.</strong> The three techniques you will reach for scale differently:</p>`,
        `<table>`,
        `<thead><tr><th>Strategy</th><th>Good for</th><th>Cost</th></tr></thead>`,
        `<tbody>`,
        `<tr><td><code>if</code>/<code>else</code> ladder</td><td>A handful of routes; learning</td><td>O(n) string compares; unwieldy past ~10 routes.</td></tr>`,
        `<tr><td>Object/<code>Map</code> lookup by <code>&quot;METHOD path&quot;</code></td><td>Many <em>static</em> routes</td><td>O(1) lookup, but cannot express <code>:param</code> segments.</td></tr>`,
        `<tr><td>Compiled <code>RegExp</code> list</td><td>Dynamic routes with params</td><td>O(n) regex tests; what Express/Fastify do under the hood (Fastify uses a radix tree for O(k)).</td></tr>`,
        `</tbody>`,
        `</table>`,
        `<p>Most real frameworks combine these: a fast structure (hash map or radix/trie tree) keyed on static segments, with regex only for the dynamic pieces. Understanding the trade-off is exactly what &ldquo;how would this scale to 500 routes?&rdquo; is probing for in an interview.</p>`,

        `<h2>Code examples</h2>`,
        `<p>A compact JSON API with static and dynamic routes, method handling, and a 404 fallback:</p>`,
        `<pre><code class="language-javascript">const http = require('node:http');

const users = new Map([[1, { id: 1, name: 'Ada' }]]);
let nextId = 2;

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}

const server = http.createServer(async (req, res) =&gt; {
  const url = new URL(req.url, \`http://\${req.headers.host}\`);
  const path = url.pathname;

  // GET /users?limit=n  → list
  if (path === '/users' &amp;&amp; req.method === 'GET') {
    const limit = Number(url.searchParams.get('limit')) || 100;
    return sendJson(res, 200, [...users.values()].slice(0, limit));
  }

  // POST /users → create
  if (path === '/users' &amp;&amp; req.method === 'POST') {
    const body = await readJson(req);
    if (!body.name) return sendJson(res, 400, { error: 'name required' });
    const user = { id: nextId++, name: body.name };
    users.set(user.id, user);
    return sendJson(res, 201, user);
  }

  // GET /users/:id → fetch one
  const match = path.match(/^\\/users\\/(\\d+)$/);
  if (match &amp;&amp; req.method === 'GET') {
    const user = users.get(Number(match[1]));
    return user
      ? sendJson(res, 200, user)
      : sendJson(res, 404, { error: 'not found' });
  }

  // Path matched but wrong method → 405
  if (path === '/users') {
    res.writeHead(405, { Allow: 'GET, POST' }).end();
    return;
  }

  // Nothing matched → 404
  sendJson(res, 404, { error: 'route not found' });
});

server.listen(3000);</code></pre>`,
        `<p>A slightly more scalable pattern &mdash; a route table keyed by <code>METHOD path</code>, which is closer to how minimal routers work:</p>`,
        `<pre><code class="language-javascript">const routes = {
  'GET /health': (req, res) =&gt; sendJson(res, 200, { ok: true }),
  'GET /users': (req, res, url) =&gt;
    sendJson(res, 200, [...users.values()]),
};

http.createServer((req, res) =&gt; {
  const url = new URL(req.url, \`http://\${req.headers.host}\`);
  const key = \`\${req.method} \${url.pathname}\`;
  const handler = routes[key];
  if (handler) return handler(req, res, url);
  sendJson(res, 404, { error: 'not found' });
}).listen(3000);</code></pre>`,
        `<p>Parsing query parameters, including repeated keys:</p>`,
        `<pre><code class="language-javascript">// GET /search?q=node&amp;tag=http&amp;tag=tls
const url = new URL(req.url, \`http://\${req.headers.host}\`);
const q = url.searchParams.get('q');        // 'node'
const tags = url.searchParams.getAll('tag'); // ['http', 'tls']
const all = Object.fromEntries(url.searchParams); // { q, tag: 'tls' } — last wins</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Routing on <code>req.url</code> directly.</strong> The query string makes <code>req.url === '/users'</code> false for <code>/users?x=1</code>. Route on <code>url.pathname</code>.</li>`,
        `<li><strong>No default 404.</strong> Forgetting the catch-all means unmatched requests never get a response and the client hangs.</li>`,
        `<li><strong>Not distinguishing 404 from 405.</strong> A known path with an unsupported method should be <code>405</code> with an <code>Allow</code> header, not <code>404</code>.</li>`,
        `<li><strong>Falling through after responding.</strong> Without <code>return</code> after <code>res.end()</code>, later branches may also write and throw <code>ERR_HTTP_HEADERS_SENT</code>.</li>`,
        `<li><strong>Trailing-slash and case surprises.</strong> <code>/users</code> and <code>/users/</code> are different strings; decide whether to normalise.</li>`,
        `<li><strong>Trusting path segments as safe.</strong> Using a path segment as a filename enables path-traversal (<code>../</code>); validate/normalise before touching the filesystem.</li>`,
        `<li><strong>Assuming <code>Object.fromEntries(searchParams)</code> keeps duplicates.</strong> It keeps only the last value; use <code>getAll()</code> for multi-value params.</li>`,
        `<li><strong>Comparing against a percent-encoded pathname.</strong> The <code>URL</code> class decodes <code>%2F</code> and friends in <code>pathname</code>, but a literal encoded slash inside a segment can still smuggle a <code>/</code> past a naive <code>split('/')</code>; validate decoded segments rather than trusting them as one token.</li>`,
        `<li><strong>Awaiting the body on a route that has none.</strong> Reading the stream on a <code>GET</code> just resolves empty, but forgetting to consume (or <code>req.resume()</code>) a body on a route that ignores it can, with some clients, hold the keep-alive socket until timeout.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Always route on <code>url.pathname</code></strong>, parsed via the <code>URL</code> class.</li>`,
        `<li><strong>Centralise response-sending</strong> in a <code>sendJson</code> helper so headers and <code>end()</code> are consistent.</li>`,
        `<li><strong>Return after responding</strong> in every branch to prevent double-writes.</li>`,
        `<li><strong>Emit <code>405</code> with <code>Allow</code></strong> for known paths hit with the wrong verb.</li>`,
        `<li><strong>Set <code>Content-Length</code></strong> with <code>Buffer.byteLength(body)</code> for fixed JSON responses &mdash; it avoids chunked encoding overhead.</li>`,
        `<li><strong>Validate input</strong> before mutating state; reject with <code>400</code> and a clear message.</li>`,
        `<li><strong>Keep a route table</strong> once you have more than a handful of routes; it scales better than an <code>if/else</code> ladder.</li>`,
        `<li><strong>Reach for a framework</strong> (Express/Fastify) once you need middleware, param matching, and nested routers &mdash; hand-rolling is for learning and tiny services.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: Implement a minimal router without a framework.</strong><br>Parse <code>req.url</code> with <code>new URL(req.url, base)</code>, then branch on <code>req.method</code> and <code>url.pathname</code>. Each branch responds and <code>return</code>s. End with a default <code>404</code>. Show a dynamic route via regex/segment split for <code>/users/:id</code>, and a <code>405</code> for a known path with the wrong method.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why route on <code>pathname</code> and not <code>req.url</code>?</strong><br>Because <code>req.url</code> includes the query string, so <code>req.url === '/users'</code> fails for <code>/users?active=1</code>. <code>url.pathname</code> strips the query, giving a stable key to match on.</p></blockquote>`,
        `<blockquote><p><strong>Q: What's the difference between a 404 and a 405?</strong><br><code>404</code> means the resource/route does not exist at all. <code>405</code> means the path exists but the HTTP method is not supported for it &mdash; and the response must include an <code>Allow</code> header listing the valid methods.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you extract a path parameter like the <code>42</code> in <code>/users/42</code>?</strong><br>Either split <code>pathname</code> on <code>/</code> and read the segment, or match a regex with a capture group such as <code>/^\\/users\\/(\\d+)$/</code> and take <code>match[1]</code>. Real routers compile <code>:param</code> patterns into exactly this kind of regex.</p></blockquote>`,
        `<blockquote><p><strong>Q: Trap &mdash; you respond in one branch but the request still errors with &ldquo;headers already sent.&rdquo; Why?</strong><br>You forgot to <code>return</code> after <code>res.end()</code>, so control fell through to a later branch that wrote to <code>res</code> again. Each responding branch must <code>return</code> (or the logic must be mutually exclusive).</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you read a query parameter that can appear multiple times, like <code>?tag=a&amp;tag=b</code>?</strong><br>Use <code>url.searchParams.getAll('tag')</code>, which returns <code>['a','b']</code>. <code>get('tag')</code> returns only the first, and <code>Object.fromEntries</code> keeps only the last &mdash; both lose data for repeated keys.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li>Routing = match <code>req.method</code> + <code>url.pathname</code> &rarr; handler.</li>`,
        `<li><code>const url = new URL(req.url, \`http://\${req.headers.host}\`)</code>.</li>`,
        `<li>Static: <code>pathname === '/users'</code>. Dynamic: regex <code>/^\\/users\\/(\\d+)$/</code>.</li>`,
        `<li>Query: <code>searchParams.get</code> / <code>.getAll</code> / <code>Object.fromEntries</code>.</li>`,
        `<li>JSON: <code>Content-Type: application/json</code> + <code>JSON.stringify</code>.</li>`,
        `<li><code>return</code> after every response; end with a default <code>404</code>.</li>`,
        `<li>Known path, wrong verb &rarr; <code>405</code> + <code>Allow</code> header.</li>`,
        `<li>Scale up: route table, then a real framework.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // Topic 3 — HTTP vs HTTPS / TLS
    // ────────────────────────────────────────────────────────────────
    {
      title: 'HTTP vs HTTPS, TLS, HTTP/2 & CORS',
      slug: 'http-vs-https-tls',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Everything so far assumed a plain, unencrypted connection. In production that is unacceptable: an unencrypted HTTP request travels in clear text, so anyone on the network path &mdash; a coffee-shop router, an ISP, a compromised switch &mdash; can read passwords and tokens or silently tamper with responses. <strong>HTTPS</strong> is HTTP wrapped in <strong>TLS</strong>, and it is the default for the entire modern web. Browsers now mark plain HTTP as &ldquo;Not Secure,&rdquo; refuse powerful APIs over it, and increasingly auto-upgrade to HTTPS.</p>`,
        `<p>As a backend engineer you need to know what TLS actually guarantees (and what it does not), how Node serves HTTPS and HTTP/2, why keep-alive matters for throughput, and how CORS &mdash; a browser rule that trips up nearly every developer &mdash; interacts with your headers. These topics come up constantly in interviews as &ldquo;what happens when you type a URL and press enter&rdquo; and &ldquo;why is my fetch blocked by CORS.&rdquo;</p>`,

        `<h2>The concept, simply</h2>`,
        `<p><strong>HTTP</strong> is the request/response protocol. <strong>HTTPS</strong> is the exact same protocol running <em>inside</em> an encrypted TLS tunnel. TLS gives you three things: <strong>confidentiality</strong> (eavesdroppers see only ciphertext), <strong>integrity</strong> (tampering is detected), and <strong>authentication</strong> (a certificate proves you are really talking to <code>example.com</code>, not an impostor). The application code barely changes &mdash; you still write <code>req</code>/<code>res</code> &mdash; but the bytes on the wire are now encrypted.</p>`,
        `<p>The one-time cost is a <strong>handshake</strong> at the start of the connection, where client and server agree on encryption keys. After that, data flows over a fast symmetric cipher. Reusing the connection for many requests (<strong>keep-alive</strong>) amortises that handshake, which is why it matters for performance.</p>`,
        `{{fig:ch7-tls-handshake.svg|Diagram of the TLS handshake: ClientHello, ServerHello with certificate, key agreement, Finished, then encrypted data|The handshake bootstraps trust with asymmetric keys, then bulk data uses a fast shared symmetric key.}}`,

        `<h2>How it works</h2>`,
        `<p><strong>The TLS handshake.</strong> The client sends a <em>ClientHello</em> advertising the TLS versions and cipher suites it supports. The server replies with a <em>ServerHello</em> choosing a cipher and presenting its <strong>certificate</strong> &mdash; a document containing the server's public key, signed by a Certificate Authority (CA) the client trusts. The client verifies the signature chain up to a trusted root, then both sides run a key-agreement algorithm (modern TLS 1.3 uses ephemeral Diffie-Hellman, ECDHE) to derive a shared <strong>session key</strong> without ever transmitting it. From the <em>Finished</em> messages onward, all HTTP data is encrypted with that symmetric key. TLS 1.3 (the current standard) trimmed this to a single round-trip and removed legacy insecure ciphers.</p>`,
        `<p><strong>Asymmetric vs symmetric.</strong> A frequent point of confusion: the certificate's public/private key pair (asymmetric, slow) is used only to <em>authenticate</em> and to safely agree on keys. The actual request/response bytes are encrypted with a <em>symmetric</em> key (fast) derived during the handshake. Asymmetric bootstraps trust; symmetric does the heavy lifting.</p>`,
        `<p><strong>Serving TLS in Node.</strong> Use <code>node:https</code> (or <code>node:http2</code>) instead of <code>node:http</code>. You pass a <code>key</code> (private key) and <code>cert</code> (certificate) in the options. In real deployments you rarely terminate TLS in Node itself &mdash; a reverse proxy or load balancer (Nginx, a cloud LB, Caddy) usually terminates TLS and forwards plain HTTP to your Node process on a private network. Either way the certificate typically comes from Let's Encrypt or a commercial CA.</p>`,
        `<p><strong>Keep-alive.</strong> HTTP/1.1 defaults to persistent connections: after a response, the TCP (and TLS) connection stays open for the next request, avoiding a fresh handshake each time. This is controlled by the <code>Connection</code> header and Node's <code>server.keepAliveTimeout</code>. Without keep-alive, every request pays a full TCP + TLS setup cost.</p>`,
        `<p><strong>HTTP/2.</strong> Same HTTP semantics (methods, status codes, headers) but a different wire format: binary framing, header compression (HPACK), and <strong>multiplexing</strong> &mdash; many concurrent requests interleaved over a single TCP connection, eliminating the head-of-line blocking of HTTP/1.1 where one slow response stalls the queue behind it. It is served in Node via <code>node:http2</code> and almost always runs over TLS (<code>h2</code> is negotiated during the handshake via ALPN).</p>`,
        `{{fig:ch7-http-versions.svg|Diagram comparing HTTP/1.1 serial keep-alive requests with HTTP/2 multiplexed streams on one connection|HTTP/1.1 serialises requests on the socket; HTTP/2 interleaves independent streams, removing head-of-line blocking.}}`,
        `<p><strong>CORS.</strong> The Cross-Origin Resource Sharing rules are enforced by the <em>browser</em>, not your server. By default a page at <code>https://app.com</code> cannot read a <code>fetch</code> response from <code>https://api.other.com</code> unless the server opts in with <code>Access-Control-Allow-Origin</code>. For &ldquo;non-simple&rdquo; requests the browser first sends a <em>preflight</em> <code>OPTIONS</code> request; your server must answer it with the appropriate <code>Access-Control-Allow-*</code> headers or the real request is blocked. Crucially, CORS is a browser security policy &mdash; <code>curl</code> and server-to-server calls ignore it entirely.</p>`,
        `<p><strong>Simple vs preflighted requests.</strong> It is worth being precise about when the browser fires that extra <code>OPTIONS</code> round-trip, because it is the part developers get wrong most often. A request is &ldquo;simple&rdquo; (no preflight) only if it uses <code>GET</code>, <code>HEAD</code>, or <code>POST</code>; carries no custom headers beyond a short CORS-safelisted set; and, if it has a body, uses one of three content types: <code>text/plain</code>, <code>application/x-www-form-urlencoded</code>, or <code>multipart/form-data</code>. The moment you send <code>Content-Type: application/json</code>, add an <code>Authorization</code> header, or use <code>PUT</code>/<code>DELETE</code>/<code>PATCH</code>, the request becomes &ldquo;preflighted&rdquo; and the browser first sends an <code>OPTIONS</code> with <code>Access-Control-Request-Method</code> and <code>Access-Control-Request-Headers</code>, expecting your server to echo permission back. You can cut the cost of repeated preflights by sending <code>Access-Control-Max-Age</code>, which tells the browser how many seconds it may cache the preflight result. And if the request needs cookies, the client must set <code>credentials: 'include'</code> <em>and</em> your server must reply with both a specific (non-wildcard) origin and <code>Access-Control-Allow-Credentials: true</code>.</p>`,
        `<p><strong>SNI, ALPN, and what the handshake negotiates.</strong> Two extensions ride along in the ClientHello and are worth naming. <em>SNI</em> (Server Name Indication) is the hostname the client wants, sent in the clear so that a single IP hosting many sites can present the right certificate &mdash; it is also why the hostname is one of the few things TLS does not hide. <em>ALPN</em> (Application-Layer Protocol Negotiation) is how client and server agree, during the same handshake, on whether to speak HTTP/1.1 or HTTP/2 (<code>h2</code>); this is why HTTP/2 in practice needs no extra round-trip and why <code>allowHTTP1: true</code> lets one <code>http2.createSecureServer</code> serve both kinds of client. TLS 1.3 also enables <em>session resumption</em> and <em>0-RTT</em>, letting a returning client skip most of the handshake, which further amplifies the keep-alive and connection-reuse benefits described above.</p>`,

        `<h2>Code examples</h2>`,
        `<p>An HTTPS server with a key and certificate (here self-signed for local dev):</p>`,
        `<pre><code class="language-javascript">const https = require('node:https');
const fs = require('node:fs');

// Generate a dev cert:
//   openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 365
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
};

https.createServer(options, (req, res) =&gt; {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Served over TLS\\n');
}).listen(8443, () =&gt; console.log('https://localhost:8443'));</code></pre>`,
        `<p>Redirecting all plain HTTP traffic to HTTPS &mdash; a standard production pattern:</p>`,
        `<pre><code class="language-javascript">const http = require('node:http');

// Runs on port 80, bounces everyone to https.
http.createServer((req, res) =&gt; {
  const host = req.headers.host?.split(':')[0] ?? 'localhost';
  res.writeHead(301, { Location: \`https://\${host}\${req.url}\` });
  res.end();
}).listen(80);</code></pre>`,
        `<p>An HTTP/2 server (over TLS, with HTTP/1.1 fallback via ALPN):</p>`,
        `<pre><code class="language-javascript">const http2 = require('node:http2');
const fs = require('node:fs');

const server = http2.createSecureServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
  allowHTTP1: true, // fall back for older clients
});

server.on('stream', (stream, headers) =&gt; {
  // http2 uses pseudo-headers: :method, :path, :authority
  stream.respond({ ':status': 200, 'content-type': 'text/plain' });
  stream.end(\`hello over \${headers[':method']} \${headers[':path']}\\n\`);
});

server.listen(8443);</code></pre>`,
        `<p>Handling CORS, including the preflight <code>OPTIONS</code> request:</p>`,
        `<pre><code class="language-javascript">const http = require('node:http');

const ALLOWED = 'https://app.example.com';

http.createServer((req, res) =&gt; {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Preflight: browser asks permission before the real request.
  if (req.method === 'OPTIONS') {
    res.writeHead(204).end();
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true }));
}).listen(3000);</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Thinking TLS hides everything.</strong> The destination IP, the SNI hostname, and traffic size/timing are still observable; TLS encrypts the HTTP payload, not the fact that you connected.</li>`,
        `<li><strong>Confusing which key encrypts the data.</strong> The certificate's asymmetric key only authenticates and negotiates; bulk data uses the derived symmetric key.</li>`,
        `<li><strong>Committing private keys.</strong> A leaked <code>key.pem</code> compromises the whole site; keep keys out of source control and images.</li>`,
        `<li><strong>Expecting the server to &ldquo;fix&rdquo; CORS for curl.</strong> CORS is browser-enforced; a blocked <code>fetch</code> is not a server error, and <code>curl</code> succeeding proves nothing about it.</li>`,
        `<li><strong>Using <code>Access-Control-Allow-Origin: *</code> with credentials.</strong> The wildcard is rejected when <code>credentials: 'include'</code> is set; you must echo a specific origin and add <code>Access-Control-Allow-Credentials: true</code>.</li>`,
        `<li><strong>Forgetting the preflight.</strong> Custom headers or non-simple methods trigger an <code>OPTIONS</code> preflight; not answering it blocks the real request.</li>`,
        `<li><strong>Disabling certificate validation</strong> (<code>rejectUnauthorized: false</code>) to &ldquo;make it work,&rdquo; which silently removes TLS's authentication guarantee.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Serve everything over HTTPS</strong> and 301-redirect plain HTTP; add <code>Strict-Transport-Security</code> (HSTS) to force it.</li>`,
        `<li><strong>Use TLS 1.2+ (prefer 1.3)</strong> and let Node's defaults pick strong cipher suites; do not hand-configure weak ones.</li>`,
        `<li><strong>Terminate TLS at a proxy/load balancer</strong> in production, and get certificates from an automated CA (Let's Encrypt) with auto-renewal.</li>`,
        `<li><strong>Keep keep-alive on</strong> and tune <code>keepAliveTimeout</code> to reuse connections and cut handshake cost.</li>`,
        `<li><strong>Adopt HTTP/2</strong> for many small concurrent assets to benefit from multiplexing and header compression.</li>`,
        `<li><strong>Scope CORS narrowly</strong>: an explicit allow-list of origins, only the methods/headers you need, and never <code>*</code> alongside credentials.</li>`,
        `<li><strong>Set security headers</strong> (<code>HSTS</code>, <code>X-Content-Type-Options</code>) and never disable certificate verification in clients.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: What does HTTPS add over HTTP, precisely?</strong><br>It wraps HTTP in TLS, providing confidentiality (encryption), integrity (tamper detection), and authentication (a CA-signed certificate proves the server's identity). The HTTP semantics are unchanged; only the transport is now encrypted and authenticated.</p></blockquote>`,
        `<blockquote><p><strong>Q: Walk through the TLS handshake at a high level.</strong><br>ClientHello (offered versions/ciphers) &rarr; ServerHello + certificate (server's public key) &rarr; client verifies the cert chain and both derive a shared session key via ephemeral Diffie-Hellman &rarr; Finished messages &rarr; encrypted application data flows over the symmetric session key. TLS 1.3 does this in one round-trip.</p></blockquote>`,
        `<blockquote><p><strong>Q: Trap &mdash; is the request body encrypted with the server's public key?</strong><br>No. The public/private (asymmetric) key pair is used only to authenticate the server and to agree on a shared secret. The actual data is encrypted with a fast <em>symmetric</em> session key derived during the handshake. Symmetric ciphers are far faster for bulk data.</p></blockquote>`,
        `<blockquote><p><strong>Q: What problem does HTTP/2 multiplexing solve?</strong><br>HTTP/1.1 head-of-line blocking: on a single connection, request B must wait for A's response. HTTP/2 interleaves multiple independent streams over one TCP connection using binary framing, so responses can arrive out of order and no single slow response stalls the rest. It also compresses headers (HPACK).</p></blockquote>`,
        `<blockquote><p><strong>Q: A browser <code>fetch</code> is blocked by CORS but <code>curl</code> works. Whose fault, and how do you fix it?</strong><br>Neither is &ldquo;broken&rdquo; &mdash; CORS is a browser-enforced policy that <code>curl</code> ignores. The fix is on the server: respond with <code>Access-Control-Allow-Origin</code> (a specific origin, or <code>*</code> for public non-credentialed APIs) and, for non-simple requests, answer the <code>OPTIONS</code> preflight with the matching <code>Allow-Methods</code>/<code>Allow-Headers</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why does keep-alive improve performance, especially over HTTPS?</strong><br>It reuses one TCP + TLS connection for many requests, so you pay the connection setup and TLS handshake cost once instead of per request. Over HTTPS the handshake is the expensive part, so keep-alive (and connection pooling on the client side) is a major latency win.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li>HTTPS = HTTP inside TLS &rarr; confidentiality + integrity + authentication.</li>`,
        `<li>Handshake: ClientHello &rarr; cert &rarr; key agreement &rarr; encrypted data. TLS 1.3 = 1-RTT.</li>`,
        `<li>Asymmetric keys authenticate + agree; symmetric session key encrypts the data.</li>`,
        `<li>Node: <code>node:https</code> / <code>node:http2</code> with <code>{ key, cert }</code>.</li>`,
        `<li>Keep-alive reuses the connection &rarr; skips repeat handshakes.</li>`,
        `<li>HTTP/2: binary framing + HPACK + multiplexing (no head-of-line blocking).</li>`,
        `<li>CORS is browser-enforced; server sends <code>Access-Control-Allow-*</code>; answer <code>OPTIONS</code> preflight.</li>`,
        `<li>No <code>*</code> origin with credentials; never disable cert validation.</li>`,
        `</ul>`,
      ].join('\n'),
    },
  ],
};
