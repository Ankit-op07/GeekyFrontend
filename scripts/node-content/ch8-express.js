/**
 * Node.js Backend Kit — Chapter 8: Express.js.
 * Pure data module (no runtime deps). Diagrams are referenced via
 * {{fig:filename.svg|ALT|CAPTION}} markers, resolved by the seed script.
 *
 * Depth target: every topic 1800-2500+ words of accurate, current Express
 * (4.x with 5.x notes). Sections are fixed and ordered.
 */
module.exports = {
  title: 'Express.js',
  slug: 'express',
  order: 7,
  topics: [
    // ────────────────────────────────────────────────────────────────
    // TOPIC 0 — Express basics
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Express basics: what it is and why a framework',
      slug: 'express-basics',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Express is the framework the Node.js server world grew up on. For more than a decade it has been the default answer to "how do I build an HTTP API in Node?", and even now — with newer entrants like Fastify, Koa, NestJS and Hono around — a huge share of production Node services either <em>are</em> Express apps or are built on tools that copied its shape. NestJS runs on Express by default. Serverless handlers are often thin Express apps. If you interview for a backend Node role, "build me a small Express endpoint" is close to a certainty, and "why Express and not raw <code>http</code>?" is the conceptual question hiding right behind it.</p>`,
        `<p>Understanding Express well is really about understanding one idea deeply: a web framework is a machine for turning an incoming HTTP request into an outgoing response through an ordered pipeline of small functions. Once that model clicks, routing, middleware, error handling, and the <code>req</code>/<code>res</code> objects all stop being separate topics you memorise and become one coherent system. This first topic builds that mental model and shows exactly what Express adds on top of Node's built-in server so that everything after it has a foundation.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Express is a <strong>minimal, unopinionated web framework for Node.js</strong>. "Minimal" is not marketing: the core does only a few things — it gives you a <em>router</em> (match an HTTP method plus a URL path to a function), a <em>middleware pipeline</em> (run an ordered list of functions on every request), and a set of <em>convenience helpers</em> on the request and response objects (<code>req.params</code>, <code>res.json()</code>, and friends). Everything else — database access, authentication, validation, templating — you add yourself as libraries. That is what "unopinionated" means: Express hands you a spine and lets you choose the organs.</p>`,
        `<p>Compare that to the alternative. Node ships a built-in <code>http</code> module that can already run a server. But with raw <code>http</code> you personally write the code that inspects <code>req.method</code> and <code>req.url</code>, splits the path, matches it against your routes, buffers the request body chunk by chunk, parses JSON, sets headers, and stringifies responses. It works, but every app re-implements the same plumbing, and the plumbing is where bugs live. Express is that plumbing, written once, tested by millions of apps.</p>`,
        `{{fig:ch8-express-vs-http.svg|Side by side comparison showing raw http requires you to parse URLs match routes buffer bodies and set headers by hand while Express provides routing body parsing and response helpers|With raw http you own every step of turning bytes into a response; Express provides the routing, parsing and helpers so you write only your logic.}}`,
        `<p>The mental picture to hold: an Express app is a <strong>stack of functions a request falls through</strong>. Each function gets the request, gets the response, and gets a <code>next</code> handle to pass control onward. Some functions do a little work and step aside (logging, parsing, auth checks); one of them finally writes a response. That is the whole framework in one sentence.</p>`,
        `<h2>How it works</h2>`,
        `<p>When you call <code>express()</code> you get back an <em>application object</em> — conventionally named <code>app</code>. That object is itself a request handler function: internally, <code>app</code> is compatible with the callback that Node's <code>http.createServer()</code> expects. When you call <code>app.listen(3000)</code>, Express is essentially doing <code>http.createServer(app).listen(3000)</code> for you. So Express does not replace Node's HTTP server — it <em>is</em> the request-handler you hand to that server. This is why an Express <code>req</code> is still a Node <code>IncomingMessage</code> and <code>res</code> is still a <code>ServerResponse</code> underneath; Express just decorates them with extra methods.</p>`,
        `<p>Inside <code>app</code> lives a <strong>middleware stack</strong>: an ordered array of entries, each with an optional path pattern, an optional HTTP method, and a handler function. Every time a request arrives, Express walks this array from top to bottom. For each entry it asks: does the request's method and path match this entry? If yes, it calls the handler with <code>(req, res, next)</code>. The handler either <em>responds</em> (ending the journey) or <em>calls <code>next()</code></em> (telling Express to keep walking). If it calls <code>next(err)</code> with an argument, Express jumps to the special error-handling handlers instead. That loop — match, run, wait for next — is the engine.</p>`,
        `{{fig:ch8-request-lifecycle.svg|Flow diagram of a request passing through client then middleware then router then handler then reply back to client with each layer receiving req res and next|Every layer receives (req, res, next) and either responds or calls next(); an error jumps straight to the error handler.}}`,
        `<p>Route handlers like <code>app.get('/users', fn)</code> are just middleware with a method and path attached. There is no separate "route system" bolted onto a "middleware system" — routes <em>are</em> middleware that only match a specific method and path. This unification is the single most important thing to internalise about Express, because it explains why order matters, why <code>next()</code> behaves the same everywhere, and why a stray middleware registered too late silently never runs.</p>`,
        `<p>Express 5 (which reached a stable release in 2024–2025 after years as <code>5.0-beta</code>) keeps this exact model. The differences are refinements: it drops some deprecated 4.x method names, updates the underlying path-matching library (so exotic regex-in-path syntax changed), requires a modern Node version, and — most usefully — auto-forwards rejected promises from async handlers to the error pipeline. The mental model does not change between 4 and 5; the examples in this chapter run on both unless noted.</p>`,
        `<h2>Code examples</h2>`,
        `<p><strong>1. The smallest useful Express app.</strong> Four lines to a running JSON API.</p>`,
        `<pre><code class="language-javascript">const express = require('express');
const app = express();

app.get('/', (req, res) =&gt; {
  res.json({ message: 'Hello from Express' });
});

app.listen(3000, () =&gt; console.log('Listening on http://localhost:3000'));</code></pre>`,
        `<p><strong>2. The same endpoint with raw <code>http</code></strong> — to feel exactly what Express saves you from.</p>`,
        `<pre><code class="language-javascript">const http = require('http');

const server = http.createServer((req, res) =&gt; {
  if (req.method === 'GET' &amp;&amp; req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Hello from raw http' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(3000);</code></pre>`,
        `<p>Notice what you had to do by hand: check the method, check the URL, set the status and <code>Content-Type</code> header, and stringify the body — and you already need a manual 404 branch. Add a second route with a URL parameter and the raw version balloons; the Express version just gains one line.</p>`,
        `<p><strong>3. A slightly fuller app</strong> showing an application-wide middleware, two routes, and a start-up log.</p>`,
        `<pre><code class="language-javascript">const express = require('express');
const app = express();

// runs on EVERY request, before any route
app.use(express.json());               // parse JSON bodies into req.body
app.use((req, res, next) =&gt; {          // a tiny logger
  console.log(\`\${req.method} \${req.url}\`);
  next();                              // hand control to the next layer
});

app.get('/health', (req, res) =&gt; res.json({ ok: true }));

app.post('/echo', (req, res) =&gt; {
  res.status(201).json({ youSent: req.body });
});

app.listen(3000);</code></pre>`,
        `<p><strong>4. ESM instead of CommonJS.</strong> Modern projects with <code>"type": "module"</code> import Express the same way conceptually.</p>`,
        `<pre><code class="language-javascript">import express from 'express';

const app = express();
app.get('/', (req, res) =&gt; res.send('ok'));
app.listen(3000);</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Thinking Express replaces the <code>http</code> module.</strong> It sits on top of it. <code>req</code> and <code>res</code> are still the Node objects, extended with helpers — which is why you can always drop down to <code>res.end()</code> or <code>req.headers</code>.</li>`,
        `<li><strong>Forgetting body parsing.</strong> Out of the box <code>req.body</code> is <code>undefined</code>. You must register <code>express.json()</code> (or <code>express.urlencoded()</code>) before routes that read a body. This trips up nearly every beginner exactly once.</li>`,
        `<li><strong>Registering middleware after the route that needs it.</strong> Express walks top to bottom; a middleware added below a handler never runs for that handler. Order is code order.</li>`,
        `<li><strong>Confusing "minimal" with "incomplete".</strong> Express omitting a database or auth layer is a design choice, not a gap. Reaching for those as separate packages is the intended workflow.</li>`,
        `<li><strong>Assuming Express is asynchronous magic.</strong> It is plain Node. If you block the event loop inside a handler (a big synchronous loop, sync crypto), every other request stalls — Express does nothing to save you there.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Keep <code>app</code> creation and <code>app.listen()</code> separate.</strong> Export the configured <code>app</code> from one file and call <code>listen</code> in another; it makes the app importable in tests (e.g. with <code>supertest</code>) without opening a port.</li>`,
        `<li><strong>Register parsers and shared middleware first</strong>, then routes, then the 404 handler, then the error handler — in that fixed order.</li>`,
        `<li><strong>Pin your Express major version</strong> in <code>package.json</code> and read the migration notes before jumping 4 → 5, chiefly for the path-matching and async-error changes.</li>`,
        `<li><strong>Reach for Express when you want control and a huge ecosystem;</strong> consider Fastify for raw throughput or NestJS for an opinionated, structured architecture — but know they share this same request-pipeline model.</li>`,
        `<li><strong>Do not hand-roll what Express or a well-known middleware already provides</strong> (CORS, security headers, compression) — use <code>cors</code>, <code>helmet</code>, <code>compression</code>.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is Express and what does it actually add over Node's <code>http</code> module?"</strong><br>A: Express is a minimal web framework that layers a routing system, an ordered middleware pipeline, and request/response helper methods on top of Node's built-in HTTP server. It does not replace <code>http</code> — <code>app</code> is the handler you pass to <code>http.createServer</code>. The value is that you stop hand-writing URL matching, body buffering, and header/serialisation plumbing on every project.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Is Express opinionated?"</strong><br>A: Deliberately not. It gives you routing and middleware and leaves database, auth, validation, and structure to you. That flexibility is its selling point and its cost — small apps are trivial, but large teams often add their own conventions (or pick NestJS) to regain structure.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How does a request flow through an Express app?"</strong><br>A: Express keeps an ordered stack of middleware and route handlers. On each request it walks the stack top to bottom, running every entry whose method and path match, passing <code>(req, res, next)</code>. A handler either responds and ends the chain, or calls <code>next()</code> to continue, or <code>next(err)</code> to jump to error handlers.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Are routes and middleware different things?"</strong><br>A: No — that is the trap. A route handler is just middleware that additionally matches a specific HTTP method and path. Internally they live in the same stack, which is why order and <code>next()</code> behave identically for both.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What changed in Express 5?"</strong><br>A: The core model is identical. Express 5 removed deprecated 4.x method names, upgraded the path-to-regexp matcher (so some wildcard/regex path syntax changed), requires newer Node, and — the practical win — automatically forwards rejected promises from async handlers to the error middleware, so you no longer need to wrap every async route in try/catch just to surface errors.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): "Express handles concurrency for you, right?"</strong><br>A: No. Express is single-threaded Node like everything else. It handles many requests concurrently only because I/O is async; a CPU-bound or synchronous blocking handler still freezes the whole event loop. Express gives you no thread-level parallelism — that is on you (worker threads, clustering, or offloading).</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><code>const app = express()</code> → an app object that is also an HTTP request handler.</li>`,
        `<li><code>app.listen(port)</code> ≈ <code>http.createServer(app).listen(port)</code>.</li>`,
        `<li>Express = <strong>router</strong> + <strong>middleware pipeline</strong> + <strong>req/res helpers</strong>. Minimal &amp; unopinionated.</li>`,
        `<li>Routes ARE middleware (with a method + path). Same stack, same <code>next()</code>.</li>`,
        `<li><code>req</code> = Node <code>IncomingMessage</code>, <code>res</code> = <code>ServerResponse</code>, both extended.</li>`,
        `<li>No body parsing until you add <code>express.json()</code> / <code>express.urlencoded()</code>.</li>`,
        `<li>Order = code order. Register shared middleware before routes.</li>`,
        `<li>Express 5: same model, auto-forwards async rejections, new path matcher.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // TOPIC 1 — Routing
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Routing: params, query, and Routers',
      slug: 'express-routing',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Routing is how a server decides <em>which piece of your code answers a given URL</em>. Every REST API is, at bottom, a routing table: <code>GET /users</code> lists users, <code>POST /users</code> creates one, <code>GET /users/:id</code> fetches one, <code>DELETE /users/:id</code> removes it. Get routing right and your API reads like a map of your domain; get it wrong and you end up with a tangle of conflicting paths, parameters that read the wrong value, and a <code>server.js</code> that is two thousand lines long. Interviewers lean on routing because it reveals whether you can structure an application, not just make one endpoint respond.</p>`,
        `<p>This topic covers the four things you will use constantly: defining routes for HTTP methods, reading dynamic <em>route parameters</em> (<code>:id</code>), reading the <em>query string</em> (<code>?sort=asc</code>), and — the part that separates toy apps from real ones — splitting routes into modular <strong>Routers</strong> so a growing codebase stays navigable. Mastering these turns "I can write an endpoint" into "I can architect an API."</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A route in Express is a triple: an <strong>HTTP method</strong>, a <strong>path pattern</strong>, and one or more <strong>handler functions</strong>. You register one with <code>app.get(path, handler)</code>, <code>app.post(...)</code>, <code>app.put</code>, <code>app.patch</code>, <code>app.delete</code>, and so on — one method per verb, plus <code>app.all()</code> for every method. The path pattern can be a literal string (<code>'/health'</code>) or contain named parameters marked with a colon (<code>'/users/:id'</code>). When a request matches, Express calls the handler.</p>`,
        `<p>Two sources of variable data ride along with a request. <strong>Route parameters</strong> are parts of the path itself: in <code>/users/:id</code>, the <code>:id</code> segment captures whatever is in that position, so <code>/users/42</code> gives you <code>req.params.id === '42'</code>. The <strong>query string</strong> is the part after the <code>?</code>: in <code>/users?sort=asc&amp;page=2</code>, Express parses it into <code>req.query</code> as <code>{ sort: 'asc', page: '2' }</code>. Params identify <em>which</em> resource; query usually <em>filters, sorts, or paginates</em> a collection.</p>`,
        `{{fig:ch8-route-anatomy.svg|Diagram breaking a route into method path and handler and showing that colon id becomes req.params.id while question-mark sort becomes req.query.sort|A route is method + path + handler; the :id segment lands in req.params, the ?sort part lands in req.query.}}`,
        `<p>As an app grows you do not want every route in one file. A <strong>Router</strong> is a mini, mountable Express app: you create it with <code>express.Router()</code>, attach routes to it, and mount it under a base path with <code>app.use('/api/users', usersRouter)</code>. Inside the router, paths are written relative to that base, so <code>router.get('/:id')</code> answers <code>GET /api/users/:id</code>. This is how real projects keep a hundred endpoints organised.</p>`,
        `<h2>How it works</h2>`,
        `<p>Under the hood the router is an ordered list, and Express matches routes <strong>top to bottom, first match wins for that step</strong>. When a request arrives, Express compares its method and path against each route in registration order. The <em>first</em> route whose handler responds (without calling <code>next()</code>) ends processing. This ordering has a concrete consequence: a more specific route must be registered <em>before</em> a more general one that would also match, or the general one shadows it. <code>/users/new</code> must come before <code>/users/:id</code>, otherwise <code>:id</code> greedily captures the string <code>"new"</code>.</p>`,
        `<p>Path patterns are compiled into regular expressions by a library (<code>path-to-regexp</code>). A segment like <code>:id</code> becomes a capture group; its matched text is stored under that name in <code>req.params</code>. Note two important facts: <strong>route params are always strings</strong> (<code>'42'</code>, never <code>42</code> — you convert with <code>Number()</code> yourself), and they are captured per-segment, so <code>:id</code> matches one path segment and stops at the next <code>/</code>. Express 5 upgraded this matcher, changing some advanced syntax — notably how optional segments and unnamed wildcards are written — but named <code>:param</code> routing is unchanged.</p>`,
        `<p>The query string is parsed separately from the path. Express reads everything after the <code>?</code>, decodes it, and builds <code>req.query</code>. Repeated keys and bracket syntax can produce arrays and nested objects (<code>?tag=a&amp;tag=b</code> → <code>{ tag: ['a', 'b'] }</code>), which is powerful but also a source of surprises — a value you expect to be a string can arrive as an array if a client sends the key twice. Everything in <code>req.query</code> is also a string (or array/object of strings); there is no type coercion.</p>`,
        `{{fig:ch8-router-mounting.svg|Diagram showing a main app mounting a usersRouter at slash api slash users and an ordersRouter at slash api slash orders with relative paths inside each router resolving to full URLs|A Router is a mini-app mounted at a base path; routes inside it are written relative to that base and Express joins them.}}`,
        `<p>When you mount a router with <code>app.use('/api/users', usersRouter)</code>, Express treats the router itself as one middleware entry keyed to that base path. A request to <code>/api/users/42</code> matches the mount, Express strips the base (<code>/api/users</code>) and passes the remainder (<code>/42</code>) into the router, which then does its own top-to-bottom matching against <code>/:id</code>. Routers can be nested and can carry their own middleware (<code>router.use(...)</code>), so cross-cutting concerns like "authenticate every admin route" attach cleanly to a subtree instead of the whole app.</p>`,
        `<h2>Code examples</h2>`,
        `<p><strong>1. Methods, a route param, and a query.</strong></p>`,
        `<pre><code class="language-javascript">// GET /users/42?fields=name
app.get('/users/:id', (req, res) =&gt; {
  const id = Number(req.params.id);        // '42' (string) -&gt; 42
  const fields = req.query.fields;         // 'name'
  res.json({ id, fields });
});

app.post('/users', (req, res) =&gt; {
  res.status(201).json({ created: req.body });
});

app.delete('/users/:id', (req, res) =&gt; {
  res.status(204).end();
});</code></pre>`,
        `<p><strong>2. Ordering matters — specific before generic.</strong></p>`,
        `<pre><code class="language-javascript">// CORRECT: the literal route is registered first
app.get('/users/me', (req, res) =&gt; res.json({ self: true }));
app.get('/users/:id', (req, res) =&gt; res.json({ id: req.params.id }));

// If reversed, GET /users/me would match /users/:id
// and req.params.id would be the string "me".</code></pre>`,
        `<p><strong>3. A Router in its own module</strong> — the real-world pattern.</p>`,
        `<pre><code class="language-javascript">// routes/users.js
const express = require('express');
const router = express.Router();

// middleware for THIS router only
router.use((req, res, next) =&gt; { req.scope = 'users'; next(); });

router.get('/', (req, res) =&gt; res.json({ list: [] }));       // GET /api/users
router.get('/:id', (req, res) =&gt; res.json({ id: req.params.id })); // GET /api/users/:id
router.post('/', (req, res) =&gt; res.status(201).json(req.body));

module.exports = router;</code></pre>`,
        `<pre><code class="language-javascript">// app.js
const express = require('express');
const app = express();
const usersRouter = require('./routes/users');

app.use(express.json());
app.use('/api/users', usersRouter);   // mount the router at a base path
app.listen(3000);</code></pre>`,
        `<p><strong>4. Chaining methods on one path with <code>app.route()</code></strong> to avoid repeating the path string.</p>`,
        `<pre><code class="language-javascript">app.route('/books/:id')
  .get((req, res) =&gt; res.json({ read: req.params.id }))
  .put((req, res) =&gt; res.json({ updated: req.params.id }))
  .delete((req, res) =&gt; res.status(204).end());</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Registering <code>:id</code> before a literal sibling.</strong> <code>/users/:id</code> placed above <code>/users/me</code> swallows <code>/users/me</code> — <code>req.params.id</code> becomes <code>"me"</code>. Specific routes first.</li>`,
        `<li><strong>Treating params as numbers.</strong> <code>req.params.id</code> is always a string. <code>req.params.id === 42</code> is <code>false</code>; convert with <code>Number()</code> and validate.</li>`,
        `<li><strong>Assuming a query value is a string.</strong> A duplicated key (<code>?tag=a&amp;tag=b</code>) yields an array, and bracket syntax yields objects. Defensive code checks the type before using it.</li>`,
        `<li><strong>Confusing <code>req.params</code> with <code>req.query</code>.</strong> Params come from the path pattern; query comes from after the <code>?</code>. Reaching into the wrong one returns <code>undefined</code>.</li>`,
        `<li><strong>Duplicate route definitions.</strong> Defining the same method+path twice: the first that responds wins, the second is dead code — no error is thrown, so it hides quietly.</li>`,
        `<li><strong>Porting Express 4 wildcard/regex paths to 5 unchanged.</strong> The matcher changed; unnamed wildcards and optional markers were rewritten. Named <code>:param</code> routes are safe, but exotic patterns need review.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>One Router per resource</strong> (<code>users</code>, <code>orders</code>, <code>products</code>) in its own file under a <code>routes/</code> folder, each mounted at <code>/api/&lt;resource&gt;</code>.</li>`,
        `<li><strong>Order routes specific → generic</strong> within a file, and keep the mount base path in <code>app.use</code> so the router's internal paths stay short and relative.</li>`,
        `<li><strong>Validate and coerce params and query at the boundary</strong> (a small middleware or a schema library like <code>zod</code>/<code>joi</code>) so handlers receive clean, typed data.</li>`,
        `<li><strong>Use <code>app.route()</code> or method chaining</strong> when several verbs share one path, to keep the path defined once.</li>`,
        `<li><strong>Keep handlers thin</strong> — parse the request, call a service/controller function, send the response. Business logic does not belong inside the route callback.</li>`,
        `<li><strong>Use <code>express.Router({ mergeParams: true })</code></strong> when a nested router needs params from its parent's mount path.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is the difference between <code>req.params</code> and <code>req.query</code>?"</strong><br>A: <code>req.params</code> holds named segments from the path pattern (<code>/users/:id</code> → <code>req.params.id</code>) and identifies a specific resource. <code>req.query</code> holds the parsed query string after the <code>?</code> and typically filters, sorts, or paginates. Both arrive as strings — Express does no type coercion.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why does route order matter?"</strong><br>A: Express matches top to bottom and the first matching handler that responds wins. A dynamic route like <code>/users/:id</code> will also match <code>/users/me</code>, so if it is registered first it shadows the literal route. You register specific paths before generic ones.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is <code>express.Router()</code> and why use it?"</strong><br>A: A Router is a standalone, mountable middleware/route group — a mini Express app. You attach routes and router-level middleware to it and mount it under a base path with <code>app.use('/api/users', router)</code>. It keeps large apps modular: one router per resource, each in its own file.</p></blockquote>`,
        `<blockquote><p><strong>Q: "A user hits <code>GET /users/me</code> but your handler returns the wrong record. Why?"</strong><br>A: Almost certainly a route-ordering bug — <code>/users/:id</code> was registered before <code>/users/me</code>, so <code>:id</code> captured the literal string <code>"me"</code>. Move the specific route above the dynamic one.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): "<code>req.params.id</code> for <code>/users/42</code> — is it the number 42?"</strong><br>A: No, it is the string <code>"42"</code>. Route params (and query values) are always strings; comparing with <code>=== 42</code> fails. Convert and validate explicitly.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How would you attach authentication to only the admin routes?"</strong><br>A: Put those routes in their own Router and register the auth middleware on that router with <code>router.use(authMiddleware)</code> (or as the second argument on the mount). It applies to the whole subtree without touching unrelated routes.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li>Route = <strong>method</strong> + <strong>path</strong> + <strong>handler(s)</strong>: <code>app.get('/users/:id', fn)</code>.</li>`,
        `<li><code>req.params</code> = path segments (<code>:id</code>); <code>req.query</code> = after <code>?</code>. Both are <strong>strings</strong>.</li>`,
        `<li>Matching is <strong>top-to-bottom, first responder wins</strong> → specific before generic.</li>`,
        `<li><code>express.Router()</code> = mountable mini-app; <code>app.use('/base', router)</code> joins paths.</li>`,
        `<li>Router paths are <strong>relative</strong> to the mount base.</li>`,
        `<li><code>app.route('/path')</code> chains <code>.get().put().delete()</code> on one path.</li>`,
        `<li><code>mergeParams: true</code> to read parent params in a nested router.</li>`,
        `<li>Express 5 changed the path matcher — audit wildcard/regex paths on upgrade.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // TOPIC 2 — Middleware
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Middleware: the pipeline, next(), and order',
      slug: 'middleware',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Middleware is the single most important concept in Express — more than routing, more than the helpers. Everything Express does is expressed as middleware: parsing bodies, logging, authenticating, setting CORS headers, handling errors, and running your route logic are all just functions in one ordered pipeline. If routing answers "which code runs?", middleware answers "what happens before, during, and after it runs?". Interviewers probe middleware because a candidate who truly understands it understands the whole framework; someone who has only copy-pasted <code>app.use(cors())</code> usually stumbles the moment you ask <em>why</em> order matters or <em>what <code>next()</code> actually does</em>.</p>`,
        `<p>Practically, middleware is how you avoid repeating yourself. Instead of adding an auth check, a request log, and a body parse to every one of forty handlers, you write each once and register it in the pipeline. This topic explains the pipeline model precisely — the "onion", the role of <code>next()</code>, why registration order is behaviour, and the difference between application-level and router-level middleware — so that the error-handling topic that follows (which is also just middleware) feels like a natural extension rather than a new rule.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A middleware is <strong>a function with the signature <code>(req, res, next)</code></strong>. Express calls it with the request object, the response object, and a <code>next</code> function. Inside, the middleware can do three kinds of thing: <em>read or modify</em> <code>req</code>/<code>res</code> (attach a user, set a header, log a line), <em>end the request</em> by sending a response, or <em>pass control onward</em> by calling <code>next()</code>. A middleware that neither responds nor calls <code>next()</code> hangs the request forever — the client just waits. That is the number-one bug beginners create, and it comes straight from not respecting this contract.</p>`,
        `<p>You register middleware with <code>app.use(fn)</code> to run it on every request, or <code>app.use('/path', fn)</code> to scope it to paths starting with <code>/path</code>, or as extra arguments on a route (<code>app.get('/x', authCheck, handler)</code>) to run it only for that route. Express keeps all of these in one ordered stack, in the order you register them. When a request comes in, it enters the top of the stack and flows down, function by function, each one deciding whether to pass control along.</p>`,
        `{{fig:ch8-middleware-onion.svg|Nested boxes like an onion showing logger wrapping json body parser wrapping authenticate wrapping the route handler with the request travelling inward via next and the response unwinding outward|Middleware nests like an onion: each next() steps one layer inward toward the handler, and the response unwinds back out.}}`,
        `<p>The classic image is an <strong>onion</strong>. The request enters through the outer layers (logger, then body parser, then auth), each calling <code>next()</code> to reach the next layer in, until it hits the route handler at the core. The response then travels back out through any code the middleware placed <em>after</em> its <code>next()</code> call. This "in through the layers, out through the layers" shape is why some middleware can measure request duration: it records a timestamp before <code>next()</code> and computes the elapsed time after control returns.</p>`,
        `<h2>How it works</h2>`,
        `<p>Express stores middleware in an ordered array. Processing a request means walking that array with an internal cursor. Express calls the first matching entry; that entry receives a <code>next</code> function which, when invoked, advances the cursor and calls the next matching entry — and so on. <strong>Calling <code>next()</code> is literally "run the next middleware".</strong> If a middleware never calls <code>next()</code> and never responds, the cursor never advances and the request stalls. If it calls <code>next()</code> more than once, later middleware may run twice and you can hit "headers already sent" errors when two of them try to respond.</p>`,
        `{{fig:ch8-next-flow.svg|Decision diagram from middleware runs branching to res dot send which ends the chain to next which passes to the next middleware and to next of err which skips to the error handler|next() is a control decision: respond and stop, call next() to continue, or call next(err) to jump to the error handler.}}`,
        `<p>The <code>next</code> function has a special overload: if you call it <strong>with an argument</strong> — <code>next(err)</code> — Express treats that as an error and skips every remaining <em>normal</em> middleware, jumping straight to the <em>error-handling</em> middleware (the ones with four parameters, covered next topic). There is one reserved string, <code>next('route')</code>, which skips the rest of the handlers for the <em>current</em> route and moves to the next matching route — a niche tool. Everything else you pass to <code>next</code> is an error.</p>`,
        `<p>Because the stack is ordered and Express walks it linearly, <strong>registration order is behaviour, not style</strong>. Body parsers must be registered before routes that read <code>req.body</code>, or the body is unparsed when the handler runs. Auth middleware must come before the protected routes. A logger placed at the very top sees every request; placed at the bottom it sees only requests that fell through everything else. There is no dependency graph or priority system — just position in the array.</p>`,
        `<p>Middleware comes in scopes. <strong>Application-level</strong> middleware is registered on <code>app</code> (<code>app.use(fn)</code>) and applies to the whole app. <strong>Router-level</strong> middleware is registered on a Router (<code>router.use(fn)</code>) and applies only to requests that reach that router — ideal for concerns tied to one resource subtree, like admin auth. <strong>Route-level</strong> middleware is passed inline to a single route. <strong>Built-in</strong> middleware ships with Express (<code>express.json()</code>, <code>express.urlencoded()</code>, <code>express.static()</code>). <strong>Third-party</strong> middleware is installed from npm (<code>cors</code>, <code>helmet</code>, <code>morgan</code>, <code>express-rate-limit</code>). All of them are the same shape of function in the same kind of stack.</p>`,
        `<h2>Code examples</h2>`,
        `<p><strong>1. A custom logging middleware</strong> that times the request using the onion shape.</p>`,
        `<pre><code class="language-javascript">app.use((req, res, next) =&gt; {
  const start = Date.now();
  console.log(\`-&gt; \${req.method} \${req.url}\`);
  res.on('finish', () =&gt; {             // runs when the response is sent
    console.log(\`&lt;- \${res.statusCode} (\${Date.now() - start}ms)\`);
  });
  next();                              // must call next, or the request hangs
});</code></pre>`,
        `<p><strong>2. Authentication as middleware</strong>, attaching data to <code>req</code> for later handlers.</p>`,
        `<pre><code class="language-javascript">function requireAuth(req, res, next) {
  const token = req.get('Authorization');
  if (!token) {
    return res.status(401).json({ error: 'No token' }); // ends the chain
  }
  req.user = decode(token);            // pass data downstream via req
  next();                              // continue to the handler
}

app.get('/profile', requireAuth, (req, res) =&gt; {
  res.json({ user: req.user });        // req.user was set by the middleware
});</code></pre>`,
        `<p><strong>3. Application-level vs router-level scope.</strong></p>`,
        `<pre><code class="language-javascript">// app-level: every request
app.use(express.json());

// router-level: only requests under /admin
const admin = express.Router();
admin.use(requireAuth);               // guards the whole admin subtree
admin.get('/stats', (req, res) =&gt; res.json({ ok: true }));
app.use('/admin', admin);</code></pre>`,
        `<p><strong>4. Common third-party stack</strong>, in the order they should run.</p>`,
        `<pre><code class="language-javascript">const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

app.use(helmet());                    // security headers first
app.use(cors());                      // CORS headers
app.use(morgan('dev'));               // request logging
app.use(express.json());              // body parsing
// ... routes registered AFTER the shared middleware ...</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Forgetting <code>next()</code>.</strong> A middleware that neither responds nor calls <code>next()</code> hangs the request silently — no error, the client just times out. The most common Express bug.</li>`,
        `<li><strong>Calling <code>next()</code> AND responding.</strong> If you <code>res.send()</code> and then call <code>next()</code>, downstream code may try to respond again → "Cannot set headers after they are sent". Return after responding: <code>return res.status(401).json(...)</code>.</li>`,
        `<li><strong>Wrong order.</strong> Registering <code>express.json()</code> after a route means that route sees <code>req.body === undefined</code>. Shared middleware goes first.</li>`,
        `<li><strong>Doing heavy sync work in middleware.</strong> It runs on every matching request; a blocking operation there throttles the whole server.</li>`,
        `<li><strong>Assuming <code>app.use('/api', fn)</code> matches only <code>/api</code>.</strong> It matches every path that <em>starts with</em> <code>/api</code> (<code>/api/users</code>, <code>/api/x/y</code>), which is usually what you want but occasionally surprises.</li>`,
        `<li><strong>Mutating <code>req</code>/<code>res</code> unpredictably.</strong> Attaching data is fine (<code>req.user</code>), but overwriting core properties or relying on a property another middleware may not have set leads to brittle chains.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Fix a registration order and stick to it:</strong> security headers → CORS → logging → body parsing → app routes → 404 → error handler.</li>`,
        `<li><strong>Always <code>return</code> after sending a response</strong> inside middleware, so control cannot accidentally fall through to <code>next()</code>.</li>`,
        `<li><strong>Scope middleware as narrowly as it needs to be</strong> — route-level for one endpoint, router-level for a subtree, app-level only for truly global concerns.</li>`,
        `<li><strong>Keep each middleware single-purpose</strong> (log, or parse, or authenticate — not all three), so the pipeline is readable and reusable.</li>`,
        `<li><strong>Pass data downstream via <code>req</code></strong> (e.g. <code>req.user</code>, <code>req.requestId</code>) rather than globals; it stays request-scoped and safe under concurrency.</li>`,
        `<li><strong>Prefer battle-tested third-party middleware</strong> (<code>helmet</code>, <code>cors</code>, <code>express-rate-limit</code>, <code>morgan</code>) over hand-rolled versions of the same concern.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is middleware in Express?"</strong><br>A: A function of the form <code>(req, res, next)</code> that runs during the request pipeline. It can read/modify the request and response, end the request by responding, or pass control to the next function with <code>next()</code>. Every part of Express — parsing, auth, logging, even route handlers and error handlers — is middleware.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What does <code>next()</code> do, and what happens if I don't call it?"</strong><br>A: <code>next()</code> advances Express to the next matching middleware in the stack. If a middleware neither responds nor calls <code>next()</code>, the request hangs indefinitely — Express never moves the cursor forward, so the client just waits and times out.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why does middleware order matter?"</strong><br>A: Express walks the middleware stack in registration order, so position <em>is</em> behaviour. Body parsers must precede routes that read <code>req.body</code>; auth must precede protected routes; a top-level logger sees every request. There is no priority system — only array order.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is the difference between <code>next()</code> and <code>next(err)</code>?"</strong><br>A: <code>next()</code> continues to the next normal middleware. <code>next(err)</code> — with any argument — signals an error: Express skips all remaining normal middleware and jumps to the error-handling middleware (the four-argument ones). <code>next('route')</code> is a special case that skips to the next matching route.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Application-level vs router-level middleware?"</strong><br>A: App-level is registered on <code>app</code> and runs for the whole app; router-level is registered on an <code>express.Router()</code> and runs only for requests that reach that router. Router-level is how you guard one resource subtree — e.g. <code>adminRouter.use(requireAuth)</code> — without affecting unrelated routes.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): "You call <code>res.json(data)</code> and then <code>next()</code> in the same middleware. What happens?"</strong><br>A: You have already sent the response, so when a downstream handler also tries to write, Express throws "Cannot set headers after they are sent to the client". Always <code>return</code> after responding; do not fall through to <code>next()</code>.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li>Middleware = <code>(req, res, next) =&gt; { ... }</code>. Read/modify, respond, or <code>next()</code>.</li>`,
        `<li>No <code>next()</code> and no response = <strong>request hangs</strong>. Respond and then don't <code>next()</code>.</li>`,
        `<li><code>next()</code> = next middleware; <code>next(err)</code> = jump to error handler; <code>next('route')</code> = next matching route.</li>`,
        `<li><strong>Order = behaviour.</strong> Shared middleware before routes.</li>`,
        `<li>Scopes: app (<code>app.use</code>), router (<code>router.use</code>), route (inline arg), built-in, third-party.</li>`,
        `<li>Onion model: request flows in via <code>next()</code>, response unwinds out.</li>`,
        `<li>Pass data downstream on <code>req</code> (e.g. <code>req.user</code>), never on globals.</li>`,
        `<li>Recommended order: helmet → cors → logger → <code>express.json()</code> → routes → 404 → error handler.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // TOPIC 3 — Error handling
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Error handling: the 4-arg handler and async errors',
      slug: 'express-error-handling',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>How an app handles errors is what separates a demo from a production service. Errors are not exceptional — a database is momentarily down, a client sends malformed JSON, a record is missing, a token is expired — these happen constantly. If your Express app leaks stack traces to clients, hangs on a rejected promise, or returns HTML error pages from a JSON API, it will fail review and frustrate every consumer. Interviewers love error handling because it is subtle: Express has a <em>specific mechanism</em> (a special four-argument middleware), and Express 4's most notorious footgun — async errors silently not being caught — has burned nearly every Node developer at least once.</p>`,
        `<p>This topic covers the whole error story: the special error-handling middleware and why it has four parameters, how errors <em>propagate</em> through the pipeline, the crucial difference between synchronous and asynchronous error handling (and how Express 5 fixes it), catching unmatched routes with a 404 handler, and centralising all of it into one place so every error in your app is formatted consistently. Get this right and your API becomes predictable under failure — which is most of what "production-ready" means.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Express recognises one special kind of middleware: an <strong>error-handling middleware has four parameters</strong> — <code>(err, req, res, next)</code> — instead of three. That extra first parameter, <code>err</code>, is how Express identifies it. You do not call these functions directly; Express routes an error to them automatically. The rule is simple: whenever a normal middleware throws (synchronously) or calls <code>next(err)</code>, Express stops running normal middleware and looks for the next four-argument handler in the stack, then calls it with the error.</p>`,
        `<p>To send an error into that system you have two moves. In synchronous code you can just <code>throw</code> — Express wraps route handlers in a try/catch and turns a thrown error into <code>next(err)</code> for you. In asynchronous code (a rejected promise, an error inside a callback) you must call <code>next(err)</code> yourself in Express 4, because Express 4's try/catch cannot catch an error that happens later, after the function has already returned. Express 5 closes this gap: it awaits async handlers and forwards rejections to <code>next(err)</code> automatically.</p>`,
        `{{fig:ch8-error-propagation.svg|Diagram of middleware A then handler which throws with the normal middleware after it skipped and an arrow jumping straight to the four-argument error handler with a note that Express 4 does not catch async throws but Express 5 does|A thrown or forwarded error skips all remaining normal middleware and jumps straight to the four-argument error handler.}}`,
        `<p>Two more pieces complete the picture. A <strong>404 handler</strong> is a normal middleware placed <em>after all routes</em> — if a request reaches it, nothing matched, so it responds with "Not Found". And a <strong>centralized error handler</strong> is a single four-argument middleware placed <em>last</em>, after everything, that catches every error the app produces and turns it into one consistent response shape (status + JSON message), logging the details server-side instead of leaking them to the client.</p>`,
        `<h2>How it works</h2>`,
        `<p>Express identifies error middleware purely by <strong>arity — the function's parameter count</strong>. A function declared with four parameters is an error handler; with three (or fewer) it is normal middleware. This has a sharp consequence: you must declare all four parameters, <em>including <code>next</code></em>, even if you do not use it, or Express treats the function as normal middleware and never sends errors to it. Omitting the fourth parameter is a classic silent bug — the handler simply never fires.</p>`,
        `<p>When an error enters the system (via <code>throw</code> in sync code or an explicit <code>next(err)</code>), Express advances its cursor past every remaining <em>normal</em> middleware and route — they are skipped entirely — and calls the next <em>error</em> middleware it finds. Inside that handler you can inspect the error, choose a status code, log it, and respond. If you call <code>next(err)</code> again from within an error handler, Express passes it to the <em>next</em> error handler down the stack; if there is none, it falls back to Express's built-in default error handler, which sends the status and, in development, the stack trace.</p>`,
        `<p>The synchronous-versus-asynchronous distinction is the heart of the topic. In Express 4, a route like <code>(req, res) =&gt; { throw new Error() }</code> is caught because Express wrapped the call in try/catch. But <code>async (req, res) =&gt; { await thatRejects() }</code> is <em>not</em> caught in Express 4: by the time the promise rejects, the synchronous part of the function has returned and the try/catch has already exited. The rejection becomes an unhandled promise rejection, the request hangs (no response is ever sent), and eventually the client times out. The fixes are: wrap async handlers in try/catch and call <code>next(err)</code>, use a small wrapper that attaches <code>.catch(next)</code> to the returned promise, or upgrade to Express 5 where this is handled for you.</p>`,
        `<p>The <strong>default error handler</strong> is always present at the very end of the stack, even if you write none. It sets the response status from <code>err.status</code>/<code>err.statusCode</code> (or 500), and in non-production it includes the stack. Because it runs last, your own centralized handler — placed after all routes but before Express's default takes over — is where you impose your own JSON shape and logging. Order still rules: the 404 middleware and the error handler are the last two things you register, in that order.</p>`,
        `<h2>Code examples</h2>`,
        `<p><strong>1. Synchronous errors — <code>throw</code> just works.</strong></p>`,
        `<pre><code class="language-javascript">app.get('/sync', (req, res) =&gt; {
  throw new Error('boom');   // Express 4 &amp; 5 catch sync throws automatically
});                          // -&gt; jumps to the error handler below</code></pre>`,
        `<p><strong>2. Async errors — the Express 4 trap and the two fixes.</strong></p>`,
        `<pre><code class="language-javascript">// BROKEN in Express 4: the rejection is NOT caught, request hangs
app.get('/bad', async (req, res) =&gt; {
  const user = await db.find(req.params.id); // if this rejects...
  res.json(user);                            // ...this never runs, no response
});

// FIX A: try/catch and forward with next(err)
app.get('/good', async (req, res, next) =&gt; {
  try {
    const user = await db.find(req.params.id);
    res.json(user);
  } catch (err) {
    next(err);              // hand the error to the error middleware
  }
});</code></pre>`,
        `<p><strong>3. A reusable async wrapper</strong> so you never write try/catch in every route.</p>`,
        `<pre><code class="language-javascript">// wrap an async handler so any rejection goes to next(err)
const asyncHandler = (fn) =&gt; (req, res, next) =&gt;
  Promise.resolve(fn(req, res, next)).catch(next);

app.get('/users/:id', asyncHandler(async (req, res) =&gt; {
  const user = await db.find(req.params.id);  // rejection -&gt; next(err) automatically
  if (!user) throw new AppError('User not found', 404);
  res.json(user);
}));
// In Express 5 the wrapper is unnecessary — rejections auto-forward.</code></pre>`,
        `<p><strong>4. A 404 handler plus a centralized error handler</strong>, registered last.</p>`,
        `<pre><code class="language-javascript">// custom error type carrying a status code
class AppError extends Error {
  constructor(message, status = 500) { super(message); this.status = status; }
}

// 404: reached only if no route matched (place AFTER all routes)
app.use((req, res, next) =&gt; {
  next(new AppError(\`Not Found: \${req.method} \${req.originalUrl}\`, 404));
});

// centralized error handler: MUST have 4 params, place LAST
app.use((err, req, res, next) =&gt; {
  const status = err.status || 500;
  if (status &gt;= 500) console.error(err);        // log server-side only
  res.status(status).json({
    error: { message: status &gt;= 500 ? 'Internal Server Error' : err.message },
  });
});</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Writing an error handler with three parameters.</strong> Express identifies error middleware by its four-parameter arity; drop <code>next</code> and it is treated as normal middleware and never receives errors. Declare all four even if unused.</li>`,
        `<li><strong>Relying on <code>throw</code> inside an async handler on Express 4.</strong> The rejection is not caught, no response is sent, the request hangs. Use try/catch + <code>next(err)</code>, an <code>asyncHandler</code> wrapper, or Express 5.</li>`,
        `<li><strong>Placing the error handler before the routes.</strong> It must be registered last, after all routes and the 404 handler, or the errors never reach it.</li>`,
        `<li><strong>Leaking internals to clients.</strong> Returning <code>err.message</code> and stack traces for 500s exposes implementation details. Log them server-side; send a generic message for 5xx.</li>`,
        `<li><strong>Responding twice.</strong> Handling an error and then also calling <code>next(err)</code>, or responding in both the handler and the error middleware → "headers already sent". Respond once.</li>`,
        `<li><strong>Forgetting a 404 handler.</strong> Without one, unmatched routes fall to Express's default, which returns a bare HTML "Cannot GET /x" — jarring for a JSON API.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Use one centralized error handler</strong> at the end of the stack that maps errors to a consistent JSON shape and status, and logs 5xx server-side.</li>`,
        `<li><strong>Create a custom error class</strong> (e.g. <code>AppError</code> with a <code>status</code>) so handlers can <code>throw new AppError('...', 404)</code> and the central handler reads the status.</li>`,
        `<li><strong>Wrap async handlers</strong> with an <code>asyncHandler</code> helper (or use <code>express-async-errors</code>, or Express 5) so no rejection ever slips past.</li>`,
        `<li><strong>Register a 404 handler after all routes</strong>, forwarding a 404 error into the same central handler for one uniform response shape.</li>`,
        `<li><strong>Distinguish operational from programmer errors</strong> — expected failures (bad input, missing record) get clean 4xx responses; unexpected bugs get a logged 500 and a generic message.</li>`,
        `<li><strong>Never send stack traces in production;</strong> gate verbose details behind <code>NODE_ENV !== 'production'</code>.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "How does Express know a middleware is an error handler?"</strong><br>A: By its arity — it has four parameters, <code>(err, req, res, next)</code>, instead of three. Express inspects the function's parameter count. If you write only three, it is treated as normal middleware and never receives errors, even if you name the first parameter <code>err</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why doesn't Express 4 catch errors thrown in an async route handler?"</strong><br>A: Express 4 wraps handler calls in a synchronous try/catch. An async function returns a promise immediately, so by the time the promise rejects the try/catch has already exited — the rejection escapes as an unhandled rejection and no response is sent. You must call <code>next(err)</code> yourself, or use a wrapper, or Express 5 which awaits and forwards rejections automatically.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you handle async errors cleanly across many routes?"</strong><br>A: A tiny wrapper: <code>const asyncHandler = fn =&gt; (req, res, next) =&gt; Promise.resolve(fn(req,res,next)).catch(next);</code>. Wrap each async handler with it so any rejection is forwarded to the error middleware. Alternatives are the <code>express-async-errors</code> package or upgrading to Express 5.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Where do the 404 handler and the error handler go?"</strong><br>A: Both go last. The 404 handler is normal middleware after all routes — if a request reaches it, nothing matched. The error handler (four params) goes after that, dead last, so it catches everything, including the 404 you forward into it.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What does <code>next(err)</code> do differently from <code>next()</code>?"</strong><br>A: <code>next()</code> continues to the next normal middleware. <code>next(err)</code> — any argument makes it an error — causes Express to skip all remaining normal middleware and route handlers and jump straight to the next four-argument error handler.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): "Your async route occasionally hangs with no response and no error logged. Cause?"</strong><br>A: Classic Express 4 async-error leak: an <code>await</code> rejected, nothing caught it, so <code>next(err)</code> was never called and no response was sent. The request hangs until timeout. Wrap the handler (try/catch or asyncHandler) or move to Express 5.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li>Error handler = <strong>four params</strong> <code>(err, req, res, next)</code>. Fewer = normal middleware.</li>`,
        `<li>Sync <code>throw</code> is caught automatically (Express 4 &amp; 5).</li>`,
        `<li>Async rejection is <strong>NOT</strong> caught in Express 4 → request hangs. Use <code>next(err)</code>, an <code>asyncHandler</code>, or Express 5.</li>`,
        `<li><code>asyncHandler</code>: <code>fn =&gt; (req,res,next) =&gt; Promise.resolve(fn(req,res,next)).catch(next)</code>.</li>`,
        `<li><code>next(err)</code> skips all normal middleware → jumps to error handler.</li>`,
        `<li>Order: routes → <strong>404 handler</strong> → <strong>error handler</strong> (both last).</li>`,
        `<li>Centralize: one handler, consistent JSON shape, log 5xx, no stack traces in prod.</li>`,
        `<li>Custom <code>AppError</code> with a <code>status</code> field → central handler reads it.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // TOPIC 4 — req & res
    // ────────────────────────────────────────────────────────────────
    {
      title: 'The req and res objects: reading and responding',
      slug: 'req-res',
      order: 4,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Every Express handler you will ever write does two things: it <em>reads</em> the incoming request and it <em>writes</em> a response. The <code>req</code> and <code>res</code> objects are the interface for both, and knowing them fluently is the difference between fumbling through docs on every endpoint and writing handlers on autopilot. Interviewers use these objects as a fast competence check: "where does the request body come from?", "how do you set a 201 with JSON?", "what does <code>res.json()</code> do that <code>res.send()</code> doesn't?" — quick questions that instantly reveal whether you have actually built APIs or just skimmed a tutorial.</p>`,
        `<p>Beyond the individual methods, these objects teach an important truth about Express: they are Node's own <code>IncomingMessage</code> and <code>ServerResponse</code>, <em>extended</em> with conveniences. That means everything you know about Node HTTP still applies, and the Express helpers are sugar on top. This topic maps the request side (<code>params</code>, <code>query</code>, <code>body</code>, <code>headers</code> and how body parsing actually works) and the response side (<code>json</code>, <code>status</code>, <code>send</code>, <code>redirect</code>, headers), plus the gotchas — the string-typing, the one-response rule, the parsing prerequisites — that turn into production bugs when ignored.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p><strong><code>req</code> is the request: everything the client sent.</strong> It bundles four sources of input. <code>req.params</code> holds path parameters (<code>/users/:id</code> → <code>req.params.id</code>). <code>req.query</code> holds the parsed query string (<code>?page=2</code> → <code>req.query.page</code>). <code>req.body</code> holds the parsed request body (the JSON a client POSTs) — but only if a body-parsing middleware ran first. <code>req.headers</code> (and the helper <code>req.get('Header-Name')</code>) holds the request headers. Plus useful extras: <code>req.method</code>, <code>req.path</code>, <code>req.originalUrl</code>, <code>req.cookies</code> (with a cookie parser), and <code>req.ip</code>.</p>`,
        `<p><strong><code>res</code> is the response: everything you send back.</strong> Its key methods are <code>res.status(code)</code> to set the HTTP status (chainable), <code>res.json(obj)</code> to send a JSON body (it serialises and sets <code>Content-Type: application/json</code>), <code>res.send(body)</code> to send a string, Buffer, or object (it guesses the type), and <code>res.redirect(url)</code> to send a redirect. You also set headers with <code>res.set()</code>/<code>res.header()</code>, cookies with <code>res.cookie()</code>, and end a bodiless response with <code>res.status(204).end()</code>. The golden rule: <strong>you send exactly one response per request.</strong></p>`,
        `{{fig:ch8-req-res-map.svg|Two panels one labelled req incoming listing params query body and headers the other labelled res outgoing listing status json send and redirect|req is the read side (params, query, body, headers); res is the write side (status, json, send, redirect). One response per request.}}`,
        `<p>The one concept that trips everyone: <strong>body parsing is not automatic</strong>. When a client POSTs JSON, the body arrives as a raw stream of bytes. Express does not decode it into <code>req.body</code> unless you registered <code>express.json()</code> (for JSON) or <code>express.urlencoded()</code> (for HTML-form encoding) earlier in the pipeline. Without that, <code>req.body</code> is <code>undefined</code>. Params and query are parsed for free; the body is opt-in because parsing strategy depends on content type.</p>`,
        `<h2>How it works</h2>`,
        `<p><code>req</code> and <code>res</code> are the same objects Node's HTTP server creates — <code>http.IncomingMessage</code> and <code>http.ServerResponse</code> — with Express's prototype methods mixed in. So <code>res.json()</code> ultimately calls <code>res.end()</code> underneath, and <code>req.headers</code> is Node's raw headers map. This layering is why you can always escape to the lower level: <code>res.setHeader()</code>, <code>res.writeHead()</code>, and <code>res.end()</code> all still work. Express helpers exist to remove repetitive steps, not to hide the machine.</p>`,
        `<p>Body parsing works because a parser is a middleware that reads the request stream to completion, decodes it according to the <code>Content-Type</code> header, and assigns the result to <code>req.body</code> before calling <code>next()</code>. <code>express.json()</code> only acts on requests whose <code>Content-Type</code> is <code>application/json</code>; <code>express.urlencoded()</code> handles <code>application/x-www-form-urlencoded</code>. If the incoming type does not match, the parser passes through and <code>req.body</code> stays as the default (an empty object in recent Express, historically <code>undefined</code>). Both parsers accept a <code>limit</code> option to cap body size — an important guard against memory-exhaustion attacks. File uploads (<code>multipart/form-data</code>) need a dedicated library like <code>multer</code>, not the built-in parsers.</p>`,
        `<p>On the response side, <code>res.json(value)</code> runs <code>JSON.stringify</code> on the value, sets the <code>Content-Type</code> to <code>application/json</code>, and sends it. <code>res.send(value)</code> is more flexible and infers the type: a string is sent as HTML/text, a Buffer as binary, and — importantly — an object or array is sent as JSON (it delegates to <code>res.json</code>). For a JSON API, prefer <code>res.json()</code> explicitly; it is unambiguous. <code>res.status(code)</code> only <em>sets</em> the status and returns <code>res</code> so you can chain (<code>res.status(201).json(...)</code>); it does not send anything on its own. <code>res.redirect(url)</code> defaults to a 302 and sets the <code>Location</code> header; pass a status first for a permanent redirect (<code>res.redirect(301, url)</code>).</p>`,
        `<p>The strict rule underneath all of this is that <strong>an HTTP response can be sent only once</strong>. Methods like <code>res.json</code>, <code>res.send</code>, <code>res.redirect</code>, and <code>res.end</code> <em>finish</em> the response. Calling any of them a second time — or calling one after the headers have been flushed — throws <code>ERR_HTTP_HEADERS_SENT</code> ("Cannot set headers after they are sent"). This is why you <code>return</code> after responding, and why a handler that responds must not also fall through to <code>next()</code> into code that responds again. Types are the other recurring gotcha: values in <code>req.params</code> and <code>req.query</code> are always strings, and <code>req.body</code> reflects exactly what the client sent — never trust it without validation.</p>`,
        `<h2>Code examples</h2>`,
        `<p><strong>1. Reading all four request inputs in one handler.</strong></p>`,
        `<pre><code class="language-javascript">// POST /users/42/notes?draft=true  with a JSON body
app.post('/users/:id/notes', (req, res) =&gt; {
  const userId = req.params.id;            // '42' (string, from the path)
  const isDraft = req.query.draft;         // 'true' (string, from ?draft=)
  const note = req.body;                   // { text: '...' } (needs express.json)
  const auth = req.get('Authorization');   // header value or undefined
  res.status(201).json({ userId, isDraft, note });
});</code></pre>`,
        `<p><strong>2. Enabling body parsing</strong> — the prerequisite for <code>req.body</code>.</p>`,
        `<pre><code class="language-javascript">app.use(express.json({ limit: '1mb' }));            // JSON bodies -&gt; req.body
app.use(express.urlencoded({ extended: true }));   // HTML form bodies -&gt; req.body

app.post('/login', (req, res) =&gt; {
  const { email, password } = req.body;   // undefined without the parsers above
  res.json({ email });
});</code></pre>`,
        `<p><strong>3. Response helpers — status, json, send, redirect, headers.</strong></p>`,
        `<pre><code class="language-javascript">app.get('/created', (req, res) =&gt; res.status(201).json({ id: 1 }));   // JSON + 201

app.get('/text', (req, res) =&gt; res.send('plain string'));            // text/html

app.get('/nothing', (req, res) =&gt; res.status(204).end());            // no body

app.get('/old', (req, res) =&gt; res.redirect('/new'));                 // 302 -&gt; /new
app.get('/moved', (req, res) =&gt; res.redirect(301, '/permanent'));    // 301

app.get('/download', (req, res) =&gt; {
  res.set('Cache-Control', 'no-store');   // custom header
  res.json({ ok: true });
});</code></pre>`,
        `<p><strong>4. The one-response rule in action</strong> — and how to obey it.</p>`,
        `<pre><code class="language-javascript">app.get('/guard/:id', (req, res) =&gt; {
  if (!req.params.id) {
    return res.status(400).json({ error: 'id required' }); // return = stop here
  }
  // without the return above, execution would continue and try to respond again
  res.json({ id: req.params.id });
});</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong><code>req.body</code> is <code>undefined</code>.</strong> You forgot <code>express.json()</code> / <code>express.urlencoded()</code>, or registered it after the route, or the client didn't send a matching <code>Content-Type</code>.</li>`,
        `<li><strong>Sending two responses.</strong> Calling <code>res.json()</code> then <code>res.send()</code> (or responding without <code>return</code> and falling through) throws "Cannot set headers after they are sent". Respond once; <code>return</code> after.</li>`,
        `<li><strong>Assuming numbers.</strong> <code>req.params.id</code> and <code>req.query.page</code> are strings; do <code>Number(...)</code> and validate. <code>?flag=false</code> is the truthy string <code>"false"</code>, not a boolean.</li>`,
        `<li><strong>Trusting <code>req.body</code>.</strong> It is whatever the client sent, including missing or malicious fields. Validate/whitelist before using it (schema library or manual checks).</li>`,
        `<li><strong>Using <code>express.json()</code> for file uploads.</strong> Multipart uploads need <code>multer</code>; the JSON parser won't touch <code>multipart/form-data</code>.</li>`,
        `<li><strong>Forgetting a body-size <code>limit</code>.</strong> An unbounded parser lets a client send a huge body and exhaust memory; set <code>limit</code>.</li>`,
        `<li><strong>Confusing <code>req.path</code>, <code>req.url</code>, and <code>req.originalUrl</code>.</strong> Inside a mounted router <code>req.url</code> is relative to the mount; <code>req.originalUrl</code> is the full path the client requested.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Register body parsers once, near the top</strong>, with an explicit <code>limit</code>, before any route that reads <code>req.body</code>.</li>`,
        `<li><strong>Prefer <code>res.json()</code> for APIs</strong> over <code>res.send()</code> — it is explicit about content type and intent, even though <code>send</code> would also JSON-encode an object.</li>`,
        `<li><strong>Always set an intentional status</strong> — 201 for creates, 204 for empty successes, 4xx for client errors — instead of letting everything default to 200.</li>`,
        `<li><strong>Validate and coerce request inputs at the boundary</strong> (params, query, body) with a schema library, so handlers work with clean, typed data.</li>`,
        `<li><strong>Always <code>return</code> after sending a response</strong> to guarantee the one-response rule and avoid header-already-sent errors.</li>`,
        `<li><strong>Read headers via <code>req.get('Name')</code></strong> (case-insensitive) rather than indexing <code>req.headers</code> with a guessed casing.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Where do <code>req.params</code>, <code>req.query</code>, and <code>req.body</code> each come from?"</strong><br>A: <code>req.params</code> from named segments in the route path (<code>/users/:id</code>); <code>req.query</code> from the query string after the <code>?</code>; <code>req.body</code> from the parsed request body — but only after a body-parsing middleware like <code>express.json()</code> runs. Params and query are parsed automatically; the body is opt-in.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why is <code>req.body</code> undefined even though the client sent JSON?"</strong><br>A: No body parser ran before the handler. You need <code>app.use(express.json())</code> registered above the route, and the client must send <code>Content-Type: application/json</code> so the parser activates.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Difference between <code>res.send()</code> and <code>res.json()</code>?"</strong><br>A: <code>res.json()</code> always serialises the argument with <code>JSON.stringify</code> and sets <code>Content-Type: application/json</code>. <code>res.send()</code> infers the type — string as text/HTML, Buffer as binary, object/array delegated to <code>res.json()</code>. For a JSON API, use <code>res.json()</code> for clarity.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you send a 201 with a JSON body?"</strong><br>A: <code>res.status(201).json(data)</code>. <code>res.status()</code> only sets the code and returns <code>res</code> for chaining; <code>res.json()</code> serialises and sends. It does not send by itself.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): "What throws 'Cannot set headers after they are sent'?"</strong><br>A: Sending the response more than once — e.g. calling <code>res.json()</code> and then another <code>res.send()</code>/<code>res.redirect()</code>, or responding and then falling through into <code>next()</code> to code that also responds. An HTTP response can be finished only once; <code>return</code> after you respond.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Are <code>req.params</code> and <code>req.query</code> values typed?"</strong><br>A: No — always strings (query values can also be arrays/objects from repeated or bracketed keys, but never numbers or booleans). <code>?active=false</code> gives the truthy string <code>"false"</code>. You must coerce and validate.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><code>req</code> reads: <code>req.params</code> (path), <code>req.query</code> (<code>?</code>), <code>req.body</code> (needs parser), <code>req.get('H')</code> (headers).</li>`,
        `<li><code>res</code> writes: <code>res.status(n)</code> (chainable), <code>res.json(obj)</code>, <code>res.send(x)</code>, <code>res.redirect([code,] url)</code>.</li>`,
        `<li><code>req.body</code> needs <code>express.json()</code> / <code>express.urlencoded()</code> <strong>before</strong> the route.</li>`,
        `<li>Params &amp; query are <strong>always strings</strong>. Coerce &amp; validate.</li>`,
        `<li><strong>One response per request.</strong> <code>return</code> after responding.</li>`,
        `<li><code>res.json</code> = explicit JSON; <code>res.send</code> = infers type (object → JSON).</li>`,
        `<li>Set a body-size <code>limit</code>; use <code>multer</code> for file uploads.</li>`,
        `<li><code>req</code>/<code>res</code> extend Node's <code>IncomingMessage</code>/<code>ServerResponse</code> — <code>res.end()</code>/<code>res.setHeader()</code> still work.</li>`,
        `</ul>`,
      ].join('\n'),
    },
  ],
};
