// Chapter 9 — REST API Design (Node.js Backend Kit)
// Format: module.exports = { title, slug, order, topics:[{title,slug,order,content}] }
// content is an ARRAY of backtick strings joined with '\n'. Figures via {{fig:...}}.

module.exports = {
  title: 'REST API Design',
  slug: 'rest-api',
  order: 8,
  topics: [
    {
      title: 'REST Principles: Constraints, Resources & Statelessness',
      slug: 'rest-principles',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Almost every backend job description asks you to "build and consume REST APIs," and almost every system-design interview eventually reaches the words "expose an endpoint." REST is the default vocabulary of the web: it is how browsers talk to servers, how mobile apps talk to backends, and how microservices talk to each other. If you understand REST deeply, you can design an interface that a stranger can use without reading your source code &mdash; and that is the entire point of an API.</p>`,
        `<p>But REST is also one of the most <em>misunderstood</em> topics in interviews. Most developers think "REST" means "JSON over HTTP with some URLs." That is not REST; that is just HTTP. REST is a specific <strong>architectural style</strong> defined by Roy Fielding in his year-2000 dissertation, and it is a set of <strong>constraints</strong> that, when you accept them, buy you real properties: scalability, cacheability, and the ability to evolve a server and its clients independently. Interviewers probe this gap constantly. The candidate who can name the constraints and explain <em>what each one buys you</em> stands out immediately from the one who just says "REST is stateless, I think."</p>`,
        `<p>Getting REST right early also saves you from expensive rewrites. A stateful API that stores per-user data in server memory cannot be load-balanced across many machines. An API that ignores the uniform interface forces every client to be hand-coded against your quirks. These are not academic concerns &mdash; they are the difference between an API that scales to millions of users and one that falls over at ten thousand.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>REST stands for <strong>REpresentational State Transfer</strong>. Unpack the name and the whole idea falls out: a client transfers <em>representations</em> (usually JSON or HTML documents) of <em>resource state</em> back and forth with a server. A <strong>resource</strong> is any thing worth naming &mdash; a user, an order, a photo, a collection of comments. The resource itself lives on the server; what crosses the wire is a <em>representation</em> of it at a moment in time.</p>`,
        `<p>REST is defined by six constraints. Five are mandatory and one is optional. Accepting them is what makes an API "RESTful."</p>`,
        `<ul>
          <li><strong>Client&ndash;Server:</strong> separate the user interface from data storage. They evolve independently.</li>
          <li><strong>Stateless:</strong> each request carries everything the server needs. The server keeps no memory of previous requests.</li>
          <li><strong>Cacheable:</strong> responses must declare whether they can be cached, so clients and intermediaries can reuse them.</li>
          <li><strong>Uniform Interface:</strong> the one big idea &mdash; resources are identified by URIs, manipulated through representations, messages are self-descriptive, and hypermedia drives state (HATEOAS).</li>
          <li><strong>Layered System:</strong> a client cannot tell whether it is talking to the real server or a proxy, gateway, or cache in between.</li>
          <li><strong>Code on Demand (optional):</strong> the server may ship executable code (e.g. JavaScript) to extend the client.</li>
        </ul>`,
        `{{fig:ch9-rest-constraints.svg|Grid of the six REST constraints with Uniform Interface highlighted|The six REST constraints. Five are mandatory; only Code on Demand is optional, and Uniform Interface is the one that most APIs get wrong.}}`,
        `<p>The mental shortcut: <strong>REST is about nouns, not verbs</strong>. You do not have a <code>/getUser</code> function and a <code>/deleteUser</code> function. You have one noun &mdash; <code>/users/42</code> &mdash; and you use HTTP <em>verbs</em> (GET, DELETE) to act on it. The URL names the thing; the method names the action.</p>`,

        `<h2>How it works (deep)</h2>`,
        `<p>Let us take the constraints that carry the most interview weight and go deeper.</p>`,
        `<p><strong>Statelessness</strong> is the constraint people quote but rarely explain correctly. It means the <em>server</em> stores no client <em>session context</em> between requests. Every request must contain all information needed to understand and process it &mdash; typically an auth token, not a server-side session pointer. This does <em>not</em> mean the application has no state; your database is full of state. It means the <em>conversation</em> is stateless. Why does this matter? Because if request N does not depend on the server remembering request N&minus;1, then any of your ten identical servers can handle it. You can add servers behind a load balancer freely, restart one without losing sessions, and route each request anywhere. Statelessness is what makes horizontal scaling trivial.</p>`,
        `<p>The classic confusion: "But I use JWTs / cookies for auth &mdash; isn't that state?" No. The <em>token</em> is state that lives on the <em>client</em> and is sent with every request. The server validates it fresh each time and forgets it. Contrast that with an old-style server-side session where the cookie is just an ID pointing at memory <em>on the server</em> &mdash; that version is stateful and does not scale without sticky sessions or a shared session store.</p>`,
        `<p><strong>The Uniform Interface</strong> is the constraint that actually makes REST feel like REST, and it has four sub-parts. (1) <em>Identification of resources</em>: each resource has a stable URI, e.g. <code>/orders/9</code>. (2) <em>Manipulation through representations</em>: the client never edits the resource directly; it sends a representation (a JSON body) describing the desired new state. (3) <em>Self-descriptive messages</em>: each message carries enough metadata &mdash; the method, <code>Content-Type</code>, status code &mdash; to be understood on its own. (4) <em>HATEOAS</em> (Hypermedia As The Engine Of Application State): responses include links telling the client what it can do next, so the client discovers actions rather than hard-coding URLs.</p>`,
        `<p><strong>HATEOAS</strong> is the most theoretical and least implemented part of REST, and interviewers love it because knowing it signals depth. The idea: instead of a client memorizing that "to pay an order, POST to <code>/orders/9/pay</code>," the order response itself contains a link like <code>{ "rel": "pay", "href": "/orders/9/pay" }</code>. The client follows links the way a human follows hyperlinks on a web page &mdash; the server can move or rename endpoints and the client keeps working. In practice, very few JSON APIs are fully HATEOAS-driven (it adds complexity clients rarely exploit), but you should be able to explain it, because Fielding considered it the part <em>without which an API is not truly REST</em>. Be honest in interviews: "Full HATEOAS is rare in real JSON APIs; most teams ship 'REST-ish' APIs and that's a pragmatic, accepted trade-off."</p>`,
        `<p><strong>Cacheability</strong> and the <strong>layered system</strong> work together. Because responses are self-descriptive and can be labeled cacheable (via <code>Cache-Control</code>, <code>ETag</code>, <code>Last-Modified</code>), a proxy sitting between client and server can serve a cached copy without the origin ever seeing the request. The client cannot tell &mdash; and does not need to &mdash; whether it hit the origin or a CDN edge. That invisibility is the layered-system constraint, and it is why CDNs and reverse proxies can accelerate a well-designed REST API for free.</p>`,

        `<h2>Code examples</h2>`,
        `<p>A minimal resource-oriented Express router. Notice the URL names a noun and the HTTP method carries the intent &mdash; there is no verb in the path.</p>`,
        `<pre><code class="language-javascript">const express = require('express');
const router = express.Router();

// Resource: the "users" collection and its members
router.get('/users', listUsers);        // read the collection
router.post('/users', createUser);       // create a member
router.get('/users/:id', getUser);       // read one member
router.put('/users/:id', replaceUser);   // replace one member
router.delete('/users/:id', deleteUser); // remove one member

module.exports = router;</code></pre>`,
        `<p>Statelessness in practice: the server reads the identity from the token on <em>every</em> request and holds nothing between calls. No <code>req.session</code>, no in-memory user map.</p>`,
        `<pre><code class="language-javascript">const jwt = require('jsonwebtoken');

// Auth middleware — stateless: the token IS the context
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    // Verified fresh each request; server keeps no memory of it afterwards
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}</code></pre>`,
        `<p>A HATEOAS-flavored response &mdash; the resource tells the client what it can do next, instead of the client hard-coding paths.</p>`,
        `<pre><code class="language-javascript">function getOrder(req, res) {
  const order = { id: 9, status: 'pending', total: 4200 };

  res.json({
    ...order,
    _links: {
      self:   { href: \`/orders/\${order.id}\` },
      pay:    { href: \`/orders/\${order.id}/pay\`,    method: 'POST' },
      cancel: { href: \`/orders/\${order.id}/cancel\`, method: 'POST' },
    },
  });
}</code></pre>`,
        `<p>And a self-descriptive, cacheable response using an <code>ETag</code> so a proxy or the browser can revalidate cheaply:</p>`,
        `<pre><code class="language-javascript">function getProduct(req, res) {
  const product = { id: 7, name: 'Keyboard', version: 3 };
  const etag = \`"prod-\${product.id}-v\${product.version}"\`;

  res.set('Cache-Control', 'public, max-age=60');
  res.set('ETag', etag);

  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end(); // Not Modified — client reuses its copy
  }
  res.json(product);
}</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>
          <li><strong>Putting verbs in URLs:</strong> <code>/getUser</code>, <code>/createOrder</code>, <code>/api/deleteUser?id=3</code>. The method already carries the verb; the path is a noun. Verbs in paths are the #1 sign of an RPC-shaped API wearing a REST costume.</li>
          <li><strong>Confusing "stateless" with "no database."</strong> Statelessness is about <em>per-client session</em> state on the server, not about persistence. Your DB is fine.</li>
          <li><strong>Server-side sessions in memory:</strong> storing login state in a module-level object breaks the moment you run two instances &mdash; requests hit the wrong server. This is a statelessness violation, not a "bug."</li>
          <li><strong>Pluralization chaos:</strong> mixing <code>/user/42</code> and <code>/orders/9</code>. Pick plural collection nouns and stay consistent.</li>
          <li><strong>Claiming full REST while hard-coding every URL client-side:</strong> that is fine and common, but do not call it HATEOAS. Know the difference so you can answer honestly.</li>
          <li><strong>Nesting resources infinitely:</strong> <code>/users/1/orders/9/items/3/reviews/2</code> is unusable. Nest one level for ownership, then link.</li>
        </ul>`,

        `<h2>Best practices</h2>`,
        `<ul>
          <li>Model <strong>nouns as resources</strong> and use HTTP methods as the verbs; keep paths free of action words.</li>
          <li>Use <strong>plural collection names</strong> (<code>/users</code>, <code>/orders</code>) consistently, and identify members by ID (<code>/users/42</code>).</li>
          <li>Keep the server <strong>stateless</strong>: carry auth in a token, and if you need shared session data, put it in Redis or the DB &mdash; never in process memory.</li>
          <li><strong>Declare cacheability</strong> explicitly with <code>Cache-Control</code> and <code>ETag</code>; a self-descriptive response is a scalable one.</li>
          <li><strong>Nest shallowly.</strong> One level of nesting to express ownership; beyond that, return links or use query filters.</li>
          <li>Be pragmatic about HATEOAS: add <code>_links</code> where they genuinely help clients discover actions, but do not over-engineer.</li>
          <li>Pick REST when your resources map cleanly to CRUD and you want HTTP caching; reach for gRPC or GraphQL when the fit is poor (see below).</li>
        </ul>`,

        `<h2>REST vs RPC vs GraphQL</h2>`,
        `<p>Interviewers often ask you to compare REST with its alternatives, because the comparison reveals whether you understand <em>why</em> REST is shaped the way it is.</p>`,
        `{{fig:ch9-rest-vs-rpc.svg|Three-column comparison of REST resource-oriented RPC action-oriented and GraphQL query-oriented|REST names resources, RPC names actions, GraphQL lets the client shape the response. Each optimizes for a different pain.}}`,
        `<p><strong>RPC</strong> (Remote Procedure Call, e.g. gRPC) is <em>action-oriented</em>: you call remote functions like <code>getUser(42)</code> or <code>chargeCard(...)</code>, usually POSTing to a single endpoint per procedure. It is great for internal service-to-service traffic where you control both ends, want a typed contract (Protobuf), and do not care about HTTP caching. <strong>GraphQL</strong> exposes one endpoint and lets the client ask for exactly the fields it needs, solving REST's over-fetching (getting more data than you use) and under-fetching (needing several round-trips). Its cost: HTTP caching and simple status-code semantics are harder because everything is a POST that returns 200. <strong>REST</strong> sits in the middle: resource-oriented, cache-friendly, universally tooled, and dead simple to consume with <code>curl</code> or a browser. A strong interview answer: "REST for public, cacheable, CRUD-shaped resources; gRPC for high-throughput internal RPC; GraphQL when many clients need flexible, differently-shaped reads from one graph."</p>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: What does "stateless" really mean in REST, and why do we want it?</strong><br/>It means the server keeps no client session context between requests &mdash; every request carries everything needed to process it (typically an auth token). The trap is thinking it means "no database"; application state in the DB is fine. We want it because it enables horizontal scaling: any server can handle any request, so you can load-balance freely and restart instances without losing sessions.</p></blockquote>`,
        `<blockquote><p><strong>Q: Name the REST constraints. Which is optional?</strong><br/>Client&ndash;Server, Stateless, Cacheable, Uniform Interface, Layered System, and Code on Demand. Code on Demand is the only optional one. Bonus points for naming the four sub-constraints of the Uniform Interface, especially HATEOAS.</p></blockquote>`,
        `<blockquote><p><strong>Q: What is HATEOAS and do real APIs use it?</strong><br/>Hypermedia As The Engine Of Application State: responses include links telling the client what it can do next, so it discovers actions instead of hard-coding URLs. Honestly, full HATEOAS is rare in JSON APIs; most ship "REST-ish" APIs with hard-coded routes. The trap is claiming your API is HATEOAS when it just returns data &mdash; interviewers respect the honest, nuanced answer.</p></blockquote>`,
        `<blockquote><p><strong>Q: Is a JWT-based auth API stateful?</strong><br/>No. The token is state held by the <em>client</em> and sent each request; the server validates it fresh and forgets it. That is stateless. A server-side session where the cookie is an ID pointing at server memory <em>is</em> stateful &mdash; that's the distinction they're testing.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you decide between REST and GraphQL?</strong><br/>REST when resources map cleanly to CRUD and you want HTTP caching and simple tooling. GraphQL when many diverse clients need to fetch differently-shaped data and REST forces over- or under-fetching. Trap: saying "GraphQL is just better" &mdash; it trades away easy caching and clear status semantics.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why is <code>POST /users/deleteAll</code> not RESTful?</strong><br/>It puts a verb in the URL and uses POST for a destructive bulk action instead of modeling resources. The RESTful shape is <code>DELETE</code> on specific resources; a bulk operation is better expressed as an operation resource or a filtered <code>DELETE</code>, not an RPC-style verb path.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>
          <li><strong>REST</strong> = REpresentational State Transfer; an architectural <em>style</em>, not "JSON over HTTP."</li>
          <li><strong>6 constraints:</strong> Client&ndash;Server, Stateless, Cacheable, Uniform Interface, Layered System, Code-on-Demand (optional).</li>
          <li><strong>Resources are nouns</strong>; HTTP methods are the verbs. No verbs in paths.</li>
          <li><strong>Stateless</strong> = no server-side session between requests &ne; no database.</li>
          <li><strong>Uniform Interface</strong> sub-parts: identify resources, manipulate via representations, self-descriptive messages, HATEOAS.</li>
          <li><strong>HATEOAS</strong> = responses link to next actions; rare in real JSON APIs &mdash; be honest.</li>
          <li><strong>REST vs RPC vs GraphQL:</strong> nouns vs actions vs client-shaped queries.</li>
          <li>Use <strong>plural collection names</strong>, shallow nesting, and explicit cache headers.</li>
        </ul>`,
      ].join('\n'),
    },

    {
      title: 'CRUD, HTTP Verbs, Status Codes & Idempotency',
      slug: 'crud-status-codes',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>The difference between an API that feels professional and one that feels amateur is almost entirely in the details of this topic: choosing the right HTTP method, returning the right status code, and understanding idempotency. These are not pedantic niceties. A wrong status code silently breaks clients: a browser will happily <em>cache</em> a response you returned as 200 when it should have been an error, a monitoring dashboard counting "5xx" will miss your outage because you returned 200 with <code>{"error": true}</code>, and a payment client that retries a non-idempotent request can charge a customer twice.</p>`,
        `<p>Interviewers lean on this topic heavily because it is a fast, reliable filter. "What status code do you return when a user tries to create a resource that already exists?" separates people who have shipped real APIs from people who have only followed tutorials. "Is PUT idempotent? Is POST? Why?" is one of the most common backend questions in existence, and getting it right &mdash; with the <em>reasoning</em>, not just the answer &mdash; signals seniority. Idempotency in particular is the backbone of reliable distributed systems: networks fail, clients retry, and only idempotent operations survive retries without corruption.</p>`,
        `<p>Master this and you will write APIs that integrate cleanly with HTTP's built-in machinery &mdash; caching, conditional requests, retries, load balancers &mdash; instead of fighting it.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>CRUD &mdash; Create, Read, Update, Delete &mdash; is the set of four operations most resources support. HTTP gives you methods that map naturally onto them, and each operation has a conventional <em>success</em> status code.</p>`,
        `{{fig:ch9-crud-verbs.svg|Table mapping CRUD to HTTP verbs success codes and idempotency|Each CRUD operation maps to an HTTP verb with a conventional success code. Note which verbs are safe and which are idempotent.}}`,
        `<ul>
          <li><strong>Create</strong> &rarr; <code>POST /users</code> &rarr; <strong>201 Created</strong> (plus a <code>Location</code> header pointing at the new resource).</li>
          <li><strong>Read</strong> &rarr; <code>GET /users/42</code> &rarr; <strong>200 OK</strong> (or 404 if it doesn't exist).</li>
          <li><strong>Update</strong> &rarr; <code>PUT /users/42</code> (full replace) or <code>PATCH /users/42</code> (partial) &rarr; <strong>200 OK</strong> with the body, or <strong>204 No Content</strong> if you return nothing.</li>
          <li><strong>Delete</strong> &rarr; <code>DELETE /users/42</code> &rarr; <strong>204 No Content</strong> (or 200 with a body).</li>
        </ul>`,
        `<p>Two properties classify these verbs. A method is <strong>safe</strong> if it does not change server state &mdash; GET is safe. A method is <strong>idempotent</strong> if making the same call once or many times leaves the server in the same final state. GET, PUT, and DELETE are idempotent; POST is not. That single distinction drives an enormous amount of correct API design.</p>`,

        `<h2>How it works (deep)</h2>`,
        `<p><strong>Idempotency, precisely.</strong> Idempotent means <em>the effect on server state</em> of N identical requests equals the effect of one. It is <em>not</em> about the response being byte-identical. Consider <code>DELETE /users/42</code>: the first call deletes the user and returns 204; the second call finds nothing to delete and returns 404. The <em>responses differ</em>, but the <em>server state is identical</em> after either the first or the second call &mdash; user 42 is gone. That still counts as idempotent. This nuance trips up almost everyone; interviewers specifically probe it.</p>`,
        `<p><strong>Why POST is not idempotent.</strong> <code>POST /orders</code> means "create a new order." Send it twice and you get two orders. The server assigns a new identity each time, so repeating the call changes state each time. That is exactly why forms warn "do not click submit twice" and why retrying a failed POST is dangerous &mdash; you cannot know whether the first one actually succeeded before the network dropped.</p>`,
        `<p><strong>Why PUT is idempotent but POST is not, even though both "write."</strong> PUT means "make the resource at this URL equal to this representation." <code>PUT /users/42</code> with a body sets user 42 to that exact state; do it ten times and user 42 still holds that same state. The client chooses the URL/identity, so repetition converges. POST lets the <em>server</em> choose the identity, so repetition diverges. This is the crux.</p>`,
        `<p><strong>PATCH is usually not idempotent.</strong> <code>PATCH</code> applies a partial change. <code>{ "op": "increment", "field": "views" }</code> is clearly not idempotent &mdash; each call adds one. Even a "set field X to Y" PATCH is only idempotent by convention, and JSON Patch operations like "add to array" are not. Treat PATCH as non-idempotent unless you have specifically designed it to be.</p>`,
        `<p><strong>Idempotency keys.</strong> Since POST is not idempotent but networks retry, robust APIs (Stripe is the canonical example) accept an <code>Idempotency-Key</code> header. The client generates a unique key per logical operation; the server stores "I already processed key K and here is the result." A retry with the same key returns the stored result instead of creating a second order or charge. This turns an unsafe POST into a safely-retriable one &mdash; a favorite senior-level design question.</p>`,
        `<p><strong>Choosing the right status code</strong> matters as much as the verb.</p>`,
        `{{fig:ch9-status-families.svg|Five status code families 1xx through 5xx with example codes|The five families. 4xx means the caller must fix the request; 5xx means the server failed a valid request. Never blur the two.}}`,
        `<p>The families: <strong>2xx</strong> success, <strong>3xx</strong> redirection/caching, <strong>4xx</strong> client error, <strong>5xx</strong> server error. The single most important line is between 4xx and 5xx: <em>4xx is the caller's fault</em> (bad input, missing auth), <em>5xx is your fault</em> (an exception, a downstream failure). Getting this wrong wrecks monitoring and on-call. The high-value 4xx codes to know cold: <strong>400</strong> malformed request, <strong>401</strong> not authenticated, <strong>403</strong> authenticated but not allowed, <strong>404</strong> not found, <strong>409</strong> conflict (e.g. duplicate/edit collision), <strong>422</strong> well-formed but semantically invalid (validation failed), <strong>429</strong> too many requests. On the success side: <strong>200</strong> OK, <strong>201</strong> Created, <strong>204</strong> No Content, <strong>304</strong> Not Modified.</p>`,
        `<p><strong>401 vs 403</strong> is a classic trap. 401 = "I don't know who you are" (no or bad credentials) &mdash; log in. 403 = "I know who you are and you still can't do this" &mdash; logging in again won't help. <strong>400 vs 422</strong> is another: 400 for a request that is syntactically broken (unparseable JSON), 422 for one that parses fine but fails business validation (email already taken, age negative). And <strong>409 Conflict</strong> is the right code when the request collides with current state &mdash; creating a user whose email already exists, or editing a record someone else changed.</p>`,

        `<h2>Code examples</h2>`,
        `<p>A full CRUD controller with correct verbs and status codes. Note <code>201</code> plus <code>Location</code> on create, and <code>204</code> on delete.</p>`,
        `<pre><code class="language-javascript">const express = require('express');
const router = express.Router();

// CREATE — 201 + Location header, body is the new resource
router.post('/users', async (req, res) => {
  const user = await User.create(req.body);
  res.status(201)
     .location(\`/users/\${user.id}\`)
     .json(user);
});

// READ one — 200 or 404
router.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.status(200).json(user);
});

// REPLACE — PUT is idempotent: set the resource to this exact state
router.put('/users/:id', async (req, res) => {
  const user = await User.replace(req.params.id, req.body);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.status(200).json(user);
});

// DELETE — idempotent; 204 with empty body
router.delete('/users/:id', async (req, res) => {
  await User.remove(req.params.id); // no-op if already gone
  res.status(204).end();
});

module.exports = router;</code></pre>`,
        `<p>Returning the right 4xx for the right reason &mdash; distinguishing 401, 403, 409, and 422:</p>`,
        `<pre><code class="language-javascript">router.post('/orders', authenticate, async (req, res) => {
  // 403: authenticated but not permitted
  if (!req.user.canOrder) {
    return res.status(403).json({ error: 'Not allowed to place orders' });
  }
  // 422: well-formed but semantically invalid
  if (req.body.quantity <= 0) {
    return res.status(422).json({ error: 'Quantity must be positive' });
  }
  // 409: conflicts with current state
  const existing = await Order.findByIdempotencyRef(req.body.ref);
  if (existing) {
    return res.status(409).json({ error: 'Order already exists', id: existing.id });
  }
  const order = await Order.create(req.body);
  res.status(201).location(\`/orders/\${order.id}\`).json(order);
});</code></pre>`,
        `<p>Making an unsafe POST safely retriable with an idempotency key &mdash; the pattern Stripe uses:</p>`,
        `<pre><code class="language-javascript">router.post('/charges', async (req, res) => {
  const key = req.headers['idempotency-key'];
  if (!key) return res.status(400).json({ error: 'Idempotency-Key required' });

  // Already processed this key? Return the SAME result — no double charge.
  const prior = await IdempotencyStore.get(key);
  if (prior) return res.status(prior.status).json(prior.body);

  const charge = await paymentGateway.charge(req.body);
  const result = { status: 201, body: charge };

  await IdempotencyStore.save(key, result); // persist keyed on the client's key
  res.status(result.status).json(result.body);
});</code></pre>`,
        `<p>A PATCH that is deliberately <em>non-idempotent</em> &mdash; incrementing a counter &mdash; to make the property concrete:</p>`,
        `<pre><code class="language-javascript">// Each call adds 1: calling it 3 times != calling it once. NOT idempotent.
router.patch('/posts/:id/views', async (req, res) => {
  const post = await Post.increment(req.params.id, 'views', 1);
  res.status(200).json({ views: post.views });
});</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>
          <li><strong>Returning 200 for everything</strong>, including errors, with an <code>{ "error": ... }</code> body. This breaks HTTP-aware clients, caches, and monitoring. Use real status codes.</li>
          <li><strong>Confusing 401 and 403:</strong> 401 = not authenticated (who are you?); 403 = authenticated but forbidden (you can't do this). Logging in fixes 401, never 403.</li>
          <li><strong>Using 400 for validation failures</strong> when 422 is more precise: 400 = unparseable; 422 = parsed but invalid.</li>
          <li><strong>Thinking "idempotent" means "same response."</strong> It means same <em>server state</em>. DELETE returning 404 on the second call is still idempotent.</li>
          <li><strong>Retrying POST blindly:</strong> without an idempotency key, a retried create can duplicate orders/charges.</li>
          <li><strong>Using PUT for partial updates:</strong> PUT replaces the whole resource, so omitted fields get wiped. Use PATCH for partial changes.</li>
          <li><strong>201 without a <code>Location</code> header:</strong> clients can't discover where the new resource lives.</li>
          <li><strong>Using GET with side effects:</strong> GET must be safe; prefetchers and crawlers will trigger those side effects.</li>
        </ul>`,

        `<h2>Best practices</h2>`,
        `<ul>
          <li>Map CRUD to verbs faithfully: POST create, GET read, PUT/PATCH update, DELETE delete.</li>
          <li>Return <strong>201 + Location</strong> on create, <strong>204</strong> when there's genuinely no body to return, and <strong>200</strong> when you return the resource.</li>
          <li>Keep the <strong>4xx/5xx boundary honest</strong> &mdash; it is the contract your monitoring and on-call rely on.</li>
          <li>Prefer <strong>422</strong> for validation errors, <strong>409</strong> for state conflicts, and distinguish <strong>401</strong> from <strong>403</strong> precisely.</li>
          <li>Make writes <strong>retry-safe</strong>: PUT/DELETE are naturally idempotent; wrap POST create/charge flows with an <code>Idempotency-Key</code>.</li>
          <li>Keep GET <strong>safe</strong> &mdash; never mutate state on a GET.</li>
          <li>Return a consistent, machine-readable error body alongside the status code (covered in the versioning topic).</li>
        </ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: Is PUT idempotent? Is POST? Why?</strong><br/>PUT is idempotent: it sets the resource at a client-chosen URL to an exact state, so repeating converges. POST is not: it creates a new resource with a server-chosen identity each time, so repeating diverges (two orders). The reasoning &mdash; who chooses the identity &mdash; is what they want, not just the yes/no.</p></blockquote>`,
        `<blockquote><p><strong>Q: DELETE returns 204 the first time and 404 the second. Is it still idempotent?</strong><br/>Yes. Idempotency is about final <em>server state</em>, not identical responses. After either call, the resource is gone &mdash; same state. The differing status codes are fine. This is the classic trap.</p></blockquote>`,
        `<blockquote><p><strong>Q: 401 vs 403?</strong><br/>401 = not authenticated ("I don't know who you are") &mdash; provide/refresh credentials. 403 = authenticated but not authorized ("I know you, you still can't") &mdash; re-auth won't help. Returning 403 when you mean 401 misleads clients into not retrying login.</p></blockquote>`,
        `<blockquote><p><strong>Q: Which status code for "email already registered" on signup?</strong><br/>409 Conflict &mdash; the request conflicts with current server state. Some teams use 422 (validation). Either is defensible if consistent; 200 or 400 are not. Explaining the 409-vs-422 nuance scores well.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you make a "create payment" endpoint safe to retry?</strong><br/>Accept an <code>Idempotency-Key</code> header. Store the result keyed by that key; a retry with the same key returns the stored result instead of charging again. This makes a non-idempotent POST effectively idempotent &mdash; the Stripe pattern.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why not just return 200 with <code>{ "success": false }</code> for errors?</strong><br/>Because HTTP status codes are the machine-readable contract for caches, load balancers, retry logic, and monitoring. A 200 error is invisible to all of them &mdash; your dashboards show green during an outage, and clients cache failures. Use the status line; put detail in the body.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>
          <li><strong>Create</strong> POST &rarr; 201 + Location &middot; <strong>Read</strong> GET &rarr; 200/404 &middot; <strong>Update</strong> PUT/PATCH &rarr; 200/204 &middot; <strong>Delete</strong> DELETE &rarr; 204.</li>
          <li><strong>Safe:</strong> GET (no state change). <strong>Idempotent:</strong> GET, PUT, DELETE. <strong>Not idempotent:</strong> POST, (usually) PATCH.</li>
          <li>Idempotent = same <em>server state</em> after N calls, not same response.</li>
          <li><strong>401</strong> = who are you? &middot; <strong>403</strong> = you can't &middot; <strong>404</strong> = not here &middot; <strong>409</strong> = conflict &middot; <strong>422</strong> = invalid &middot; <strong>429</strong> = rate limited.</li>
          <li><strong>4xx</strong> = caller's fault &middot; <strong>5xx</strong> = server's fault. Keep the line honest.</li>
          <li>Retry-safe POST = <code>Idempotency-Key</code> header + server-side result store.</li>
          <li>PUT replaces the whole resource; PATCH changes part of it.</li>
        </ul>`,
      ].join('\n'),
    },

    {
      title: 'Validation, Pagination, Filtering & Sorting',
      slug: 'validation-pagination',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Every input to your API is a potential attack, a potential crash, and a potential data-corruption bug. "Never trust the client" is the first law of backend engineering, and <strong>validation</strong> is how you enforce it. An endpoint that reads <code>req.body.age</code> and stores it without checking will happily accept <code>"age": "banana"</code>, <code>"age": -5</code>, or a 10-megabyte string designed to exhaust your memory. Validation at the edge is what turns a fragile endpoint into a robust one, and it is the single highest-leverage habit separating hobby code from production code.</p>`,
        `<p><strong>Pagination</strong> is equally load-bearing but for a different reason: scale. An endpoint that returns <em>all</em> users works fine with 100 rows and takes your database down with 10 million. <code>GET /users</code> without pagination is one of the most common causes of production incidents, because it passes every test on a small dev database and detonates in production. Interviewers ask "how would you paginate this?" precisely because the naive answer (offset/limit) has a subtle scaling flaw that only shows up at volume, and knowing the cursor-based alternative signals real experience.</p>`,
        `<p>Filtering and sorting round out the read story: real clients need <code>?status=active&amp;sort=-createdAt</code>, and doing this cleanly &mdash; without opening a SQL-injection hole or letting clients sort by an unindexed column &mdash; is a craft worth knowing.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p><strong>Validation</strong> means checking, at the boundary of your system, that incoming data has the right shape, types, and constraints <em>before</em> any business logic touches it. You declare a <em>schema</em> &mdash; "email must be a valid email, age must be an integer 0&ndash;150, role must be one of admin/user" &mdash; and a validation library checks the request against it, rejecting bad input with a clear error.</p>`,
        `{{fig:ch9-validation-pipeline.svg|Request flowing through validate step into controller with a fail branch to 422|Validate at the edge. Clean, typed data reaches your controller; invalid input is rejected early with 422.}}`,
        `<p>Three libraries dominate the Node ecosystem: <strong>Joi</strong> (mature, chainable, framework-agnostic), <strong>Zod</strong> (TypeScript-first, infers static types from the schema &mdash; currently the most popular in new code), and <strong>express-validator</strong> (middleware built around express and the validator.js rules). They differ in ergonomics but share the idea: define the schema once, validate against it, get typed and coerced data out.</p>`,
        `<p><strong>Pagination</strong> means returning results in bounded chunks instead of all at once. There are two families: <em>offset-based</em> (<code>?page=3&amp;limit=20</code>) and <em>cursor-based</em> (<code>?after=&lt;opaque-cursor&gt;</code>). <strong>Filtering</strong> narrows results by field values (<code>?status=active</code>); <strong>sorting</strong> orders them (<code>?sort=-createdAt</code> for newest first).</p>`,

        `<h2>How it works (deep)</h2>`,
        `<p><strong>Validation as a gate.</strong> The correct architecture is a validation <em>middleware</em> that runs before the controller. It parses the request against the schema; on success it replaces <code>req.body</code> with the <em>coerced, stripped</em> value (unknown keys removed, <code>"25"</code> turned into <code>25</code>); on failure it short-circuits with a 422 and a list of what was wrong. The controller then trusts its input completely &mdash; no defensive <code>if (typeof x !== 'number')</code> scattered through business logic. This separation is the whole win: validation lives in one declarative place, not smeared across every handler.</p>`,
        `<p>A subtle but important point: <strong>validate query and params too, not just the body</strong>. <code>?limit=999999</code> or <code>?limit=abc</code> must be caught. A common bug is validating the JSON body carefully while blindly trusting <code>req.query.limit</code>, then passing it straight to the database as a <code>LIMIT</code>. Always coerce and clamp pagination params.</p>`,
        `<p><strong>Offset pagination</strong> is the intuitive one: <code>LIMIT 20 OFFSET 40</code> skips 40 rows and returns the next 20. It lets clients jump to any page and is trivial to implement. It has two real flaws at scale.</p>`,
        `{{fig:ch9-pagination-strategies.svg|Side by side of offset pagination and cursor pagination with pros and cons|Offset is simple but slows down and drifts at scale; cursor pagination is fast and stable but can't jump to arbitrary pages.}}`,
        `<p>Flaw one: <em>performance</em>. <code>OFFSET 1000000</code> forces the database to walk and discard a million rows before returning your twenty &mdash; it gets linearly slower the deeper you page. Flaw two: <em>drift</em>. If a new row is inserted while a user pages through results, the offsets shift, so they can see a row twice or skip one entirely. For a stable, high-volume feed this is unacceptable.</p>`,
        `<p><strong>Cursor (keyset) pagination</strong> fixes both. Instead of "skip N rows," you say "give me rows <em>after</em> this specific point," where the point is encoded in an opaque cursor (often a base64 of the last row's sort key + id). The query becomes <code>WHERE (created_at, id) &lt; (:cursor_ts, :cursor_id) ORDER BY created_at DESC, id DESC LIMIT 20</code>. Because it uses an index seek rather than a scan-and-discard, it stays fast no matter how deep you go, and because it anchors to a real row rather than a numeric offset, inserts don't cause skips or repeats. The trade-off: you cannot jump to "page 47" &mdash; only forward/backward from where you are. That is fine for infinite-scroll feeds and the reason Twitter, Slack, and the GitHub API all use cursors.</p>`,
        `<p><strong>Filtering and sorting safely.</strong> The danger is letting arbitrary client strings reach your query. Never interpolate <code>req.query.sort</code> into raw SQL &mdash; that is an injection hole. Instead, maintain an <em>allow-list</em>: map the client's <code>?sort=-createdAt</code> to a known column and direction, and reject anything not on the list. Same for filters &mdash; validate field names against a whitelist and use parameterized queries or your ORM's query builder for the values. Also restrict sorting to <em>indexed</em> columns; letting a client sort a ten-million-row table by an unindexed field is a self-inflicted denial of service.</p>`,

        `<h2>Code examples</h2>`,
        `<p>A reusable Zod validation middleware &mdash; declare the schema once, get clean data or a 422.</p>`,
        `<pre><code class="language-javascript">const { z } = require('zod');

// Generic middleware: validate a chosen part of the request
function validate(schema, source = 'body') {
  return (req, res, next) =&gt; {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(422).json({
        error: 'Validation failed',
        details: result.error.issues.map(i =&gt; ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }
    req[source] = result.data; // coerced + stripped — controller trusts this
    next();
  };
}

const createUserSchema = z.object({
  email: z.string().email(),
  age: z.coerce.number().int().min(0).max(150),
  role: z.enum(['admin', 'user']).default('user'),
}).strict(); // reject unknown keys

router.post('/users', validate(createUserSchema), createUser);</code></pre>`,
        `<p>Validating and clamping pagination query params so a client can never demand a million rows:</p>`,
        `<pre><code class="language-javascript">const pageQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20), // hard ceiling
  sort:  z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

router.get('/users', validate(pageQuerySchema, 'query'), listUsers);</code></pre>`,
        `<p>Offset pagination with a metadata envelope so clients know how to navigate:</p>`,
        `<pre><code class="language-javascript">async function listUsers(req, res) {
  const { page, limit, status } = req.query;
  const filter = status ? { status } : {};

  const [items, total] = await Promise.all([
    User.find(filter).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    data: items,
    pagination: {
      page, limit, total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit &lt; total,
    },
  });
}</code></pre>`,
        `<p>Cursor pagination with safe, allow-listed sorting &mdash; the version you reach for at scale:</p>`,
        `<pre><code class="language-javascript">// Allow-list maps client tokens to real, indexed columns + direction
const SORTABLE = { createdAt: 'created_at', name: 'name' };

async function feed(req, res) {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const cursor = req.query.after
    ? JSON.parse(Buffer.from(req.query.after, 'base64').toString())
    : null;

  // Keyset: fetch rows strictly "after" the cursor's (createdAt, id)
  const rows = await Post.findAfter(cursor, limit + 1); // +1 to detect more
  const hasMore = rows.length &gt; limit;
  const page = rows.slice(0, limit);

  const last = page[page.length - 1];
  const nextCursor = hasMore
    ? Buffer.from(JSON.stringify({ createdAt: last.createdAt, id: last.id })).toString('base64')
    : null;

  res.json({ data: page, nextCursor });
}</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>
          <li><strong>Only validating the body:</strong> query and path params are input too. <code>?limit=99999999</code> and <code>/users/'; DROP TABLE</code> must be checked.</li>
          <li><strong>No upper bound on <code>limit</code>:</strong> a client sending <code>?limit=1000000</code> can exhaust memory and stall the DB. Always clamp with a hard max.</li>
          <li><strong>Deep offset pagination:</strong> <code>OFFSET 500000</code> is slow and drifts under concurrent inserts. Use cursors for large/real-time datasets.</li>
          <li><strong>Interpolating sort/filter fields into SQL:</strong> a direct injection vulnerability. Allow-list field names; parameterize values.</li>
          <li><strong>Sorting on unindexed columns:</strong> lets a client trigger full-table sorts &mdash; effectively a DoS.</li>
          <li><strong>Trusting client-coerced types:</strong> <code>req.query.limit</code> is a <em>string</em>; <code>"20" - 1</code> works but <code>"20" + 1</code> is <code>"201"</code>. Coerce explicitly.</li>
          <li><strong>Leaking internal error detail:</strong> return which fields failed, not stack traces or DB messages.</li>
          <li><strong>Validating in the controller by hand:</strong> scatters rules and drifts. Centralize in schema middleware.</li>
        </ul>`,

        `<h2>Best practices</h2>`,
        `<ul>
          <li>Validate <strong>every</strong> input surface &mdash; body, query, params &mdash; with a declarative schema (Zod/Joi/express-validator) in middleware, before the controller.</li>
          <li><strong>Coerce and strip</strong>: turn strings into the right types and remove unknown keys so the controller trusts its input.</li>
          <li>Return <strong>422</strong> with a structured list of field-level errors, never a stack trace.</li>
          <li><strong>Clamp pagination</strong>: default and maximum <code>limit</code>, minimum <code>page</code>/positive cursor.</li>
          <li>Prefer <strong>cursor pagination</strong> for large or frequently-changing datasets; offset is fine for small, stable admin tables.</li>
          <li><strong>Allow-list</strong> sortable and filterable fields, map them to indexed columns, and parameterize all values.</li>
          <li>Return a <strong>consistent envelope</strong> (<code>{ data, pagination }</code> or <code>{ data, nextCursor }</code>) so clients paginate uniformly.</li>
        </ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: Where should validation happen, and why there?</strong><br/>At the edge, in middleware before the controller, so invalid input never reaches business logic or the database. Centralizing it in a schema keeps rules in one declarative place and lets the controller trust coerced, stripped data. Validating inside handlers scatters and drifts.</p></blockquote>`,
        `<blockquote><p><strong>Q: Offset vs cursor pagination &mdash; when and why?</strong><br/>Offset (<code>page/limit</code>) is simple and allows jumping to any page but slows down at deep offsets (scan-and-discard) and drifts when rows are inserted mid-scroll. Cursor/keyset anchors to the last row's sort key, uses an index seek so it stays fast at any depth, and doesn't skip/repeat under inserts &mdash; but can't jump to arbitrary pages. Use cursors for large or real-time feeds.</p></blockquote>`,
        `<blockquote><p><strong>Q: A client sends <code>?sort=passwordHash</code>. What's the risk and the fix?</strong><br/>If you interpolate it into a query you get injection and you may expose or sort by sensitive/unindexed columns. Fix: an allow-list mapping client tokens to known indexed columns and directions, rejecting anything else, with parameterized queries for values.</p></blockquote>`,
        `<blockquote><p><strong>Q: Which status code for a validation failure &mdash; 400 or 422?</strong><br/>422 Unprocessable Entity is more precise: the request parsed fine but failed semantic rules. 400 is for syntactically broken requests (unparseable JSON). Either is defensible if consistent, but 422 shows you know the distinction.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why cap <code>limit</code>, and what happens if you don't?</strong><br/>Without a ceiling, a client can request millions of rows, exhausting server memory and stalling the DB &mdash; a trivial DoS. Always clamp with a sane default (e.g. 20) and hard max (e.g. 100).</p></blockquote>`,
        `<blockquote><p><strong>Q: Zod vs Joi vs express-validator?</strong><br/>All validate at the edge. Zod is TypeScript-first and infers static types from the schema (great for TS codebases). Joi is mature and framework-agnostic with a rich chainable API. express-validator integrates as express middleware around validator.js. Pick by ecosystem fit; the pattern &mdash; schema in middleware, 422 on failure &mdash; is identical.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>
          <li><strong>Never trust the client.</strong> Validate body + query + params with a schema in middleware, before the controller.</li>
          <li><strong>Coerce, strip, clamp:</strong> types fixed, unknown keys removed, <code>limit</code> bounded.</li>
          <li>Validation fail &rarr; <strong>422</strong> with field-level details (no stack traces).</li>
          <li><strong>Offset</strong> = <code>page/limit</code>: simple, jumps pages, but slow + drifts at scale.</li>
          <li><strong>Cursor/keyset</strong> = "rows after X": fast at any depth, stable under inserts, no random jumps.</li>
          <li><strong>Allow-list</strong> sort/filter fields &rarr; indexed columns; parameterize values (no SQL injection).</li>
          <li>Return a consistent envelope: <code>{ data, pagination }</code> or <code>{ data, nextCursor }</code>.</li>
          <li>Libraries: <strong>Zod</strong> (TS-first), <strong>Joi</strong> (mature), <strong>express-validator</strong> (middleware).</li>
        </ul>`,
      ].join('\n'),
    },

    {
      title: 'API Versioning, Error Shape, Rate Limiting & Docs',
      slug: 'api-versioning',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>The moment your API has a single external consumer you cannot control, you have lost the freedom to change it freely. Rename a field, tighten a validation rule, or change a response shape, and somewhere a mobile app in a user's pocket &mdash; running a build from six months ago &mdash; breaks. <strong>Versioning</strong> is the discipline that lets a server evolve while old clients keep working. Interviewers ask about it because it reveals whether you have maintained a real API over time or only built greenfield toys.</p>`,
        `<p>The other three topics here &mdash; error shape, rate limiting, and documentation &mdash; are the difference between an API developers <em>enjoy</em> using and one they curse. A <strong>consistent error shape</strong> means every client can write one error handler instead of guessing which of five formats today's endpoint uses. <strong>Rate limiting</strong> protects you from abuse, runaway clients, and cost blowups &mdash; and is a near-guaranteed system-design question ("how would you stop one user from hammering this endpoint?"). And <strong>documentation</strong>, specifically OpenAPI, is what makes an API discoverable and testable without reading your source; "have you used OpenAPI/Swagger?" is a common screening question because it signals you've worked on APIs meant for others.</p>`,
        `<p>Together these four turn a working endpoint into a <em>product</em>: stable, safe, self-describing, and pleasant to integrate against.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p><strong>Versioning</strong> lets multiple contract versions coexist so a breaking change ships as "v2" without forcing every client to upgrade at once. There are three mainstream strategies.</p>`,
        `{{fig:ch9-versioning-strategies.svg|Three versioning strategies URI path custom header and media type with trade-offs|Three ways to version. URI-path versioning wins in practice for its visibility and simple routing.}}`,
        `<ul>
          <li><strong>URI path:</strong> <code>/v1/users</code> vs <code>/v2/users</code>. Visible, cache-friendly, trivial to route. The most common choice.</li>
          <li><strong>Custom header:</strong> <code>API-Version: 2</code>. Keeps URLs clean but is invisible and harder to test in a browser.</li>
          <li><strong>Media type (content negotiation):</strong> <code>Accept: application/vnd.myapp.v2+json</code>. The most "RESTful," the least tooled and understood.</li>
        </ul>`,
        `<p>A <strong>breaking change</strong> is one that could break an existing client: removing/renaming a field, changing a type, adding a required input, or changing status-code semantics. <em>Additive</em> changes &mdash; adding an optional field or a new endpoint &mdash; are backward-compatible and do <em>not</em> need a new version. The golden rule: version only on breaking changes; add fields freely.</p>`,
        `<p>A <strong>consistent error shape</strong> is a single JSON structure every error returns &mdash; e.g. <code>{ error: { code, message, details } }</code> &mdash; so clients parse errors uniformly. <strong>Rate limiting</strong> caps how many requests a client may make in a window, returning <strong>429 Too Many Requests</strong> when exceeded. <strong>OpenAPI</strong> (formerly Swagger) is a machine-readable YAML/JSON spec describing your endpoints, from which docs, client SDKs, and test tools are generated.</p>`,

        `<h2>How it works (deep)</h2>`,
        `<p><strong>Versioning strategy trade-offs.</strong> URI-path versioning wins in practice despite purists objecting that <code>/v1/</code> means the "same" resource has two URIs (technically un-RESTful). It wins because it is <em>visible</em> (you can see the version in logs and browsers), <em>routable</em> (mount <code>v1Router</code> and <code>v2Router</code> separately), and <em>cacheable</em> (different URLs cache independently). Header and media-type versioning keep URLs "pure" but pay for it in tooling: you cannot paste a versioned URL into a browser, CDNs need to vary on the header, and debugging is harder. A senior answer names URI-path as the pragmatic default while acknowledging the REST-purity critique.</p>`,
        `<p>The deeper skill is <em>minimizing</em> versions. Each live version is maintenance forever. So: design responses to be extensible from day one (return objects, not bare arrays, so you can add fields), treat new fields as additive, and only cut a new version for genuinely breaking changes. When you do, run old and new side by side, announce a <em>deprecation</em> timeline (often via a <code>Deprecation</code> / <code>Sunset</code> header), and give clients months to migrate.</p>`,
        `<p><strong>Error shape.</strong> The failure mode to avoid is every endpoint inventing its own error format &mdash; one returns <code>{ error: "..." }</code>, another <code>{ message: "..." }</code>, a third a bare string. Standardize on one envelope with a <em>machine-readable</em> <code>code</code> (so clients branch on <code>code === 'EMAIL_TAKEN'</code> rather than string-matching human text), a human <code>message</code>, and optional <code>details</code> for field-level validation errors. Centralize it in a single Express <strong>error-handling middleware</strong> (the four-argument <code>(err, req, res, next)</code> signature) so no handler formats errors ad hoc, and so you can map error <em>types</em> to status codes in one place. Critically, never leak stack traces or raw DB errors to clients &mdash; log those server-side, return a clean generic message for 5xx.</p>`,
        `<p><strong>Rate limiting algorithms.</strong> The common ones: <em>fixed window</em> (count requests per clock minute &mdash; simple but allows bursts at window edges, up to 2&times; the limit across a boundary); <em>sliding window</em> (smooths that edge burst); <em>token bucket</em> (a bucket refills at a steady rate and each request spends a token &mdash; allows controlled bursts, the most popular); and <em>leaky bucket</em> (processes at a fixed rate, smoothing output). For a single Node process an in-memory counter works, but the moment you run multiple instances you need a <em>shared store</em> &mdash; typically Redis &mdash; because each instance otherwise keeps its own count and the real limit becomes N&times; your intended value. Always return <strong>429</strong> plus <code>Retry-After</code> and the <code>RateLimit-*</code> headers so well-behaved clients back off.</p>`,
        `<p><strong>OpenAPI.</strong> The spec is a contract written in YAML/JSON describing paths, methods, request/response schemas, and auth. Its value is that it is machine-readable: Swagger UI renders interactive docs from it, code generators produce typed client SDKs and server stubs, and contract-testing tools verify your implementation matches the spec. You can hand-write it or generate it from code annotations. The interview-relevant point is <em>why</em> it matters: a single source of truth that keeps docs, clients, and tests in sync, so the documentation cannot silently drift from the real API.</p>`,

        `<h2>Code examples</h2>`,
        `<p>URI-path versioning by mounting separate routers &mdash; v1 and v2 evolve independently.</p>`,
        `<pre><code class="language-javascript">const express = require('express');
const app = express();

const v1 = require('./routes/v1');
const v2 = require('./routes/v2');

app.use('/v1', v1); // legacy clients keep working
app.use('/v2', v2); // new shape, breaking changes live here

// Signal deprecation so clients know to migrate
app.use('/v1', (req, res, next) =&gt; {
  res.set('Deprecation', 'true');
  res.set('Sunset', 'Wed, 31 Dec 2026 23:59:59 GMT');
  next();
});</code></pre>`,
        `<p>A single, consistent error shape via centralized error-handling middleware &mdash; note the four arguments and the 4xx/5xx split:</p>`,
        `<pre><code class="language-javascript">// Throw typed errors anywhere in the app
class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status; this.code = code; this.details = details;
  }
}

// One place formats EVERY error (must have 4 args to be an error handler)
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  // Never leak internals on 5xx
  const body = status &gt;= 500
    ? { error: { code: 'INTERNAL', message: 'Something went wrong' } }
    : { error: { code: err.code, message: err.message, details: err.details } };

  if (status &gt;= 500) console.error(err); // log real cause server-side
  res.status(status).json(body);
}

app.use(errorHandler); // mounted LAST, after all routes</code></pre>`,
        `<p>Rate limiting with a Redis-backed store so the limit is correct across many instances:</p>`,
        `<pre><code class="language-javascript">const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('./redisClient');

const limiter = rateLimit({
  windowMs: 60 * 1000,          // 1-minute window
  max: 100,                     // 100 requests per key per window
  standardHeaders: true,        // RateLimit-* headers
  legacyHeaders: false,
  store: new RedisStore({ sendCommand: (...args) =&gt; redis.call(...args) }),
  keyGenerator: (req) =&gt; req.user?.id || req.ip, // per user, fallback per IP
  handler: (req, res) =&gt; {
    res.set('Retry-After', '60');
    res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests' } });
  },
});

app.use('/api', limiter);</code></pre>`,
        `<p>A minimal OpenAPI fragment documenting one endpoint, plus serving interactive docs with Swagger UI:</p>`,
        `<pre><code class="language-javascript">// openapi.yaml (excerpt)
// paths:
//   /v2/users/{id}:
//     get:
//       summary: Get a user by id
//       parameters:
//         - name: id
//           in: path
//           required: true
//           schema: { type: string }
//       responses:
//         '200': { description: OK }
//         '404': { description: Not found }

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const spec = YAML.load('./openapi.yaml');

app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec)); // interactive docs</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>
          <li><strong>Versioning for additive changes:</strong> adding an optional field doesn't need v2. Over-versioning multiplies maintenance for nothing.</li>
          <li><strong>Never deprecating old versions:</strong> without a sunset date, v1 lives forever. Announce timelines and use <code>Deprecation</code>/<code>Sunset</code> headers.</li>
          <li><strong>Inconsistent error shapes:</strong> different formats per endpoint force clients to write N error handlers. Standardize one envelope.</li>
          <li><strong>Leaking stack traces / DB errors</strong> to clients on 5xx: an information-disclosure risk. Log server-side, return a generic message.</li>
          <li><strong>Error middleware with three args:</strong> Express only treats a middleware as an error handler if it has <em>four</em> parameters. Drop <code>next</code> and errors silently bypass it.</li>
          <li><strong>In-memory rate limiting across multiple instances:</strong> each process counts separately, so the real limit becomes N&times; intended. Use Redis.</li>
          <li><strong>Rate limiting by IP only:</strong> corporate NAT/mobile networks share IPs; prefer per-user (with IP fallback) where you have identity.</li>
          <li><strong>Docs that drift from code:</strong> hand-maintained docs rot. Generate from or contract-test against the OpenAPI spec.</li>
          <li><strong>Returning a bare array</strong> as the top-level response: you can't later add pagination/metadata without breaking clients. Wrap in an object.</li>
        </ul>`,

        `<h2>Best practices</h2>`,
        `<ul>
          <li>Default to <strong>URI-path versioning</strong> (<code>/v1</code>, <code>/v2</code>); version only on <strong>breaking</strong> changes, add fields freely.</li>
          <li>Design responses as <strong>extensible objects</strong> (never bare arrays) so additive changes stay backward-compatible.</li>
          <li>Publish a <strong>deprecation policy</strong>: overlap versions, send <code>Deprecation</code>/<code>Sunset</code> headers, give clients months.</li>
          <li>Standardize <strong>one error envelope</strong> with a machine-readable <code>code</code>, human <code>message</code>, and optional <code>details</code>; format it in one central error-handling middleware.</li>
          <li>On 5xx, <strong>log the real cause, return a generic message</strong> &mdash; never leak internals.</li>
          <li><strong>Rate-limit</strong> with a shared store (Redis) across instances, key by user then IP, and return <strong>429</strong> + <code>Retry-After</code> + <code>RateLimit-*</code> headers.</li>
          <li>Maintain an <strong>OpenAPI</strong> spec as the single source of truth; serve Swagger UI and generate clients/tests from it so docs can't drift.</li>
        </ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: Which API versioning strategy would you choose and why?</strong><br/>URI-path (<code>/v1</code>) in practice: visible in logs/browsers, trivial to route (mount separate routers), and cacheable per-URL. Purists note it's technically un-RESTful (same resource, two URIs) and prefer media-type versioning &mdash; but that's poorly tooled. Naming the trade-off, not just the choice, is what scores.</p></blockquote>`,
        `<blockquote><p><strong>Q: What counts as a breaking change requiring a new version?</strong><br/>Removing/renaming a field, changing a field's type, adding a required request param, or changing status-code semantics. Adding an <em>optional</em> field or a new endpoint is additive and backward-compatible &mdash; no new version needed. Version only on breaking changes.</p></blockquote>`,
        `<blockquote><p><strong>Q: How would you rate-limit an endpoint across a horizontally-scaled service?</strong><br/>A shared counter in Redis (token bucket or sliding window), keyed by user id (IP fallback), returning 429 with <code>Retry-After</code>. The trap is in-memory counters: with N instances each keeps its own count, so the effective limit becomes N&times; the intended value.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why must your Express error handler take four arguments?</strong><br/>Express identifies error-handling middleware by arity &mdash; only a function with exactly <code>(err, req, res, next)</code> is treated as one. Write three params and Express treats it as normal middleware, so thrown errors skip it and fall through to the default handler.</p></blockquote>`,
        `<blockquote><p><strong>Q: What does a good error response look like?</strong><br/>A single consistent envelope: a machine-readable <code>code</code> (clients branch on it, not on message text), a human <code>message</code>, and optional <code>details</code> for validation. Formatted in one central middleware; on 5xx it hides internals and logs the real cause server-side. Consistency lets clients write one handler.</p></blockquote>`,
        `<blockquote><p><strong>Q: What is OpenAPI and why use it?</strong><br/>A machine-readable spec (YAML/JSON) describing paths, schemas, and auth. From it you generate interactive docs (Swagger UI), typed client SDKs, and contract tests &mdash; one source of truth so docs can't drift from the implementation. Saying "Swagger" and OpenAPI are the same lineage (Swagger was renamed OpenAPI) shows familiarity.</p></blockquote>`,
        `<blockquote><p><strong>Q: Fixed window vs token bucket &mdash; what's the difference?</strong><br/>Fixed window counts per clock interval; it's simple but permits a burst of up to 2&times; the limit straddling a boundary. Token bucket refills tokens at a steady rate and each request spends one, allowing controlled bursts up to the bucket size while enforcing an average rate &mdash; smoother, and the common production choice.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>
          <li><strong>Version on breaking changes only</strong>; add optional fields freely. Default: URI-path <code>/v1</code>, <code>/v2</code>.</li>
          <li><strong>Breaking</strong> = remove/rename field, change type, new required input, changed status semantics.</li>
          <li>Deprecate with overlap + <code>Deprecation</code>/<code>Sunset</code> headers and a migration window.</li>
          <li><strong>One error envelope:</strong> <code>{ error: { code, message, details } }</code>; central 4-arg middleware; hide internals on 5xx.</li>
          <li>Express error handler needs <strong>4 args</strong> <code>(err, req, res, next)</code> or it's skipped.</li>
          <li><strong>Rate limit:</strong> Redis-shared across instances, key by user/IP, return <strong>429</strong> + <code>Retry-After</code>. Token bucket = smooth bursts.</li>
          <li><strong>OpenAPI/Swagger:</strong> one spec &rarr; docs + SDKs + contract tests; keeps docs from drifting.</li>
          <li>Return <strong>objects, not bare arrays</strong>, so responses stay extensible.</li>
        </ul>`,
      ].join('\n'),
    },
  ],
};
