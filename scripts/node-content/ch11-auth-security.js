// Chapter 11 — Authentication & Security (Node.js Backend Kit)
// Content module: 5 topics, deep learner + interview material.

module.exports = {
  title: 'Authentication & Security',
  slug: 'auth-security',
  order: 10,
  topics: [
    // ------------------------------------------------------------------
    // Topic 0 — authentication-basics
    // ------------------------------------------------------------------
    {
      title: 'Authentication Basics',
      slug: 'authentication-basics',
      order: 0,
      content: [
`<h2>Why it matters</h2>`,
`<p>Almost every backend you will ever write has to answer two questions on every request: <em>who is this?</em> and <em>are they allowed to do this?</em> Get the first one wrong and strangers walk in as your users. Get the second wrong and a logged-in user reads someone else's bank statement. Authentication and authorization are the load-bearing walls of an application — everything else (business logic, payments, data) sits on top of them, and a crack here compromises the whole building.</p>`,
`<p>This topic is also where a huge share of real-world breaches originate. "Broken access control" and "identification and authentication failures" both sit near the top of the OWASP Top 10 year after year. And in interviews, auth is a favourite because it forces you to reason about state, trust boundaries, and trade-offs rather than recite syntax. A candidate who can crisply explain the difference between authentication and authorization, and when to use sessions versus tokens, signals real backend maturity.</p>`,
`<p>The goal of this topic is to build the vocabulary and mental model that the rest of the chapter depends on. Once you can name the pieces precisely — credential, identity, session, token, claim, scope — the specific tools (JWT, express-session, bcrypt, helmet) become easy to slot into place.</p>`,

`<h2>The concept, simply</h2>`,
`<p><strong>Authentication (authN)</strong> answers "who are you?". The user presents a <em>credential</em> — a password, a one-time code, a Google login, a passkey — and the server verifies it against something it trusts. The output of successful authentication is a <em>proven identity</em>: "this request belongs to user 42".</p>`,
`<p><strong>Authorization (authZ)</strong> answers "what are you allowed to do?". Given a proven identity, the server checks whether that user may perform this specific action on this specific resource — read this document, delete that order, access the admin panel. The output is a yes/no decision.</p>`,
`<p>The two are sequential and distinct: you authenticate <em>once</em> (at login) and authorize <em>every time</em> (on each protected request). Confusing them is the classic beginner mistake — for example checking "is the user logged in?" and assuming that means "the user may edit this post", when they may only edit posts they own.</p>`,
`{{fig:ch11-authn-vs-authz.svg|Two side-by-side panels contrasting authentication and authorization|AuthN proves identity at login; authZ checks permissions on every request. 401 means not authenticated, 403 means authenticated but forbidden.}}`,
`<p>A useful HTTP mnemonic: <code>401 Unauthorized</code> actually means <em>unauthenticated</em> ("I don't know who you are — log in"), while <code>403 Forbidden</code> means <em>authenticated but not authorized</em> ("I know who you are, and you may not do this"). The status code names are historically confusing, but the distinction they encode is exactly authN vs authZ.</p>`,

`<h2>How it works</h2>`,
`<p>Every authentication scheme boils down to three phases. First, <strong>identification</strong>: the user claims an identity (a username or email). Second, <strong>verification</strong>: they prove it by presenting a credential the server can check — something they know (password), have (a phone receiving an OTP, a hardware key), or are (biometric). Third, <strong>session establishment</strong>: because HTTP is stateless, the server issues a portable proof of the successful login so the user does not re-enter their password on every click.</p>`,
`<p>That third phase is where the two dominant architectures diverge, and understanding the split is the heart of this topic:</p>`,
`<p><strong>Stateful sessions.</strong> The server generates a random, unguessable <em>session id</em>, stores the real session data (user id, roles, cart) in a server-side store (memory, Redis, a database), and sends only the opaque id to the browser inside a cookie. On each subsequent request the browser returns the cookie, the server looks up the id in the store, and re-hydrates who the user is. The token the client holds is meaningless on its own — it is just a pointer.</p>`,
`<p><strong>Stateless tokens.</strong> The server packages the identity and its claims into a self-contained, cryptographically <em>signed</em> token (typically a JWT) and hands the whole thing to the client. On each request the client sends the token back, and the server verifies the signature with a secret or public key. Nothing is stored server-side; the token itself is the proof. The server trusts it because tampering would break the signature.</p>`,
`{{fig:ch11-sessions-vs-tokens.svg|Comparison of server-side sessions versus self-contained JWT tokens|Sessions keep state on the server behind an opaque cookie id and revoke instantly; tokens carry signed claims and scale statelessly but are hard to revoke early.}}`,
`<p>The trade-off is fundamentally about <em>where the state lives</em> and therefore <em>who controls revocation</em>. With sessions, the server is the single source of truth: to log a user out or ban them, you delete one row and the next request fails instantly. With tokens, the proof lives on the client and is valid until it expires, so revoking a token before its expiry requires extra machinery (a denylist, or short-lived access tokens plus refresh tokens — covered in the JWT topic). Sessions cost a store lookup per request and are slightly harder to scale horizontally; tokens are trivially horizontal but pay for it in revocation complexity and token size.</p>`,
`<p>A third pattern worth naming is <strong>federated / delegated auth</strong> — OAuth 2.0 and OpenID Connect. Instead of your app verifying a password, it delegates identity to a provider (Google, GitHub, an enterprise SSO). The provider authenticates the user and hands your app a token asserting "this is user X". You never see the password. OIDC layers an identity token on top of OAuth's authorization framework. This is why "Sign in with Google" exists, and it is increasingly the default for consumer and enterprise apps because it removes password handling from your responsibility.</p>`,

`<h2>Code examples</h2>`,
`<p>A minimal login route that verifies a credential and establishes a session. Note that we never store or compare plaintext passwords — hashing is covered in its own topic, but the shape of the flow is what matters here.</p>`,
`<pre><code class="language-javascript">const express = require('express');
const bcrypt = require('bcrypt');
const app = express();
app.use(express.json());

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // 1. Identification: find the claimed user
  const user = await User.findOne({ email });

  // 2. Verification: compare credential against stored hash.
  //    Always run the compare even if user is missing, to avoid
  //    leaking which emails exist via response timing.
  const hash = user ? user.passwordHash : '$2b$12$invalidinvalidinvalidinvalidinv';
  const ok = await bcrypt.compare(password, hash);

  if (!user || !ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // 3. Session establishment (stateful example)
  req.session.userId = user.id;
  req.session.role = user.role;
  res.json({ ok: true });
});</code></pre>`,
`<p>Authorization middleware is separate from authentication. Here <code>requireAuth</code> only checks identity; <code>requireRole</code> checks permission. Keeping them as distinct middlewares is what stops the "logged in therefore allowed" bug.</p>`,
`<pre><code class="language-javascript">function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

function requireRole(role) {
  return (req, res, next) =&gt; {
    if (req.session.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// authN first, then authZ
app.get('/admin/stats', requireAuth, requireRole('admin'), (req, res) =&gt; {
  res.json({ users: 1234 });
});</code></pre>`,
`<p>Ownership checks are the subtlest form of authorization and cannot be a static role check — they depend on the specific resource. This is the pattern that prevents IDOR (insecure direct object reference), where user A guesses user B's order id.</p>`,
`<pre><code class="language-javascript">app.get('/orders/:id', requireAuth, async (req, res) =&gt; {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });

  // AuthZ: the user must OWN this resource (or be admin).
  // Never trust the id in the URL to belong to the caller.
  if (order.userId !== req.session.userId &amp;&amp; req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(order);
});</code></pre>`,

`<h2>Common mistakes &amp; gotchas</h2>`,
`<ul>
<li><strong>Treating "logged in" as "allowed".</strong> Authentication does not imply authorization. Every protected resource needs its own permission check, and ownership-based resources need per-object checks, not just a role check.</li>
<li><strong>Trusting client-supplied identity.</strong> A field like <code>userId</code> in the request body or a hidden form input is attacker-controlled. Identity must come from the verified session or a verified token, never from the request payload.</li>
<li><strong>Leaking which accounts exist.</strong> Returning "no such user" vs "wrong password", or responding faster when the email is unknown, lets attackers enumerate valid emails. Use one generic message and constant-ish work for both cases.</li>
<li><strong>Rolling your own crypto or session ids.</strong> Home-grown token formats and <code>Math.random()</code> session ids are almost always breakable. Use vetted libraries and a CSPRNG (<code>crypto.randomBytes</code>).</li>
<li><strong>Confusing 401 and 403.</strong> Sending 401 when the user is authenticated but forbidden, or 403 when they simply need to log in, confuses clients and sometimes leaks information about resource existence.</li>
<li><strong>Doing authorization only on the frontend.</strong> Hiding an admin button in the UI is UX, not security. Every check must be enforced server-side because the client is fully under the attacker's control.</li>
</ul>`,

`<h2>Best practices</h2>`,
`<ul>
<li><strong>Separate authN and authZ into distinct layers.</strong> One middleware proves identity; another (or the handler) checks permission. This keeps the two concerns testable and prevents accidental conflation.</li>
<li><strong>Centralize the access rule.</strong> Put "who can do what" in one place (a policy function, a middleware factory) rather than scattering ad-hoc <code>if</code> checks that drift out of sync.</li>
<li><strong>Prefer proven building blocks.</strong> Passport strategies, express-session, jsonwebtoken, and OAuth/OIDC providers exist so you do not reinvent security-critical code.</li>
<li><strong>Choose sessions vs tokens deliberately.</strong> Server-rendered app or a single backend? Sessions are simpler and revocable. Public API, mobile client, or many services? Tokens (short-lived) fit better. Decide based on revocation needs and topology, not fashion.</li>
<li><strong>Fail closed.</strong> If a check cannot be evaluated (store down, token unparseable), deny access rather than default to allow.</li>
<li><strong>Log auth events.</strong> Record logins, failures, and permission denials so you can detect brute force and abuse — without logging the credentials themselves.</li>
</ul>`,

`<h2>⭐ Interview lens</h2>`,
`<blockquote><p><strong>Q: What is the difference between authentication and authorization?</strong><br/>Authentication verifies <em>who</em> a user is by checking a credential; its output is a proven identity. Authorization decides <em>what</em> that identity may do on a given resource; its output is allow/deny. You authenticate once at login and authorize on every protected request. The HTTP codes encode the split: 401 = unauthenticated, 403 = authenticated-but-forbidden.</p></blockquote>`,
`<blockquote><p><strong>Q: Sessions or tokens — how do you choose? (trap)</strong><br/>The trap is answering "tokens, because stateless is modern". The real answer is a trade-off: sessions keep state server-side, so revocation is instant and cookies stay tiny, at the cost of a per-request store lookup and stickier scaling. Tokens are self-contained and scale trivially across services, but are hard to revoke before expiry and can leak more if mishandled. For a monolith or server-rendered app, sessions are often simpler and safer; for public/multi-service APIs, short-lived tokens plus refresh tokens fit better.</p></blockquote>`,
`<blockquote><p><strong>Q: A user reports they can view another user's invoice by changing the id in the URL. What went wrong?</strong><br/>Broken access control — specifically an IDOR. The endpoint authenticated the user but did not authorize <em>this</em> user against <em>this</em> resource. The fix is an ownership check: load the invoice, confirm its owner matches the session identity (or the caller is admin), else return 403/404. Never assume the id in the URL belongs to the caller.</p></blockquote>`,
`<blockquote><p><strong>Q: Why is 401 called "Unauthorized" if it means unauthenticated?</strong><br/>Historical naming in the HTTP spec. Semantically, 401 means "you have not proven who you are — authenticate", and it typically comes with a <code>WWW-Authenticate</code> header. 403 is the true authorization failure: identity is known but the action is not permitted. Interviewers ask this to see if you understand the concepts beneath the confusing labels.</p></blockquote>`,
`<blockquote><p><strong>Q: What does OAuth 2.0 actually give you, and is it authentication?</strong><br/>OAuth 2.0 is an <em>authorization</em> framework for delegated access — it lets your app obtain a token to act on a resource on the user's behalf. It is not, by itself, authentication. OpenID Connect (OIDC) is the thin identity layer on top of OAuth that adds an ID token asserting who the user is. "Sign in with Google" is OIDC. Conflating raw OAuth with authentication is a classic mistake.</p></blockquote>`,
`<blockquote><p><strong>Q: Why is client-side authorization insufficient?</strong><br/>Because the client is fully controlled by the user/attacker — they can edit JavaScript, replay requests with curl, and remove any UI gate. Frontend checks are UX (don't show buttons that will fail); the authoritative decision must be enforced on the server for every request.</p></blockquote>`,

`<h2>Cheat-card</h2>`,
`<ul>
<li><strong>AuthN</strong> = who are you (verify credential → proven identity), once at login.</li>
<li><strong>AuthZ</strong> = what may you do (check permission on resource), every request.</li>
<li><strong>401</strong> = unauthenticated (log in). <strong>403</strong> = authenticated but forbidden.</li>
<li><strong>Sessions</strong>: state on server, opaque cookie id, instant revoke, per-req lookup.</li>
<li><strong>Tokens (JWT)</strong>: signed claims on client, stateless/scalable, hard to revoke early.</li>
<li><strong>OAuth</strong> = delegated authorization; <strong>OIDC</strong> = identity layer on top (real login).</li>
<li>Identity comes from the verified session/token — <strong>never</strong> from the request body.</li>
<li>Ownership checks (IDOR defense) must be per-object, not just per-role.</li>
</ul>`
      ].join('\n')
    },

    // ------------------------------------------------------------------
    // Topic 1 — jwt
    // ------------------------------------------------------------------
    {
      title: 'JSON Web Tokens (JWT)',
      slug: 'jwt',
      order: 1,
      content: [
`<h2>Why it matters</h2>`,
`<p>JWTs are everywhere in modern backends: API gateways, mobile app auth, microservice-to-microservice calls, single sign-on. If you build APIs, you will issue, verify, and debug JWTs, and interviewers know it — "explain how a JWT works" and "how do refresh tokens fit in?" are near-guaranteed questions for any backend or full-stack role.</p>`,
`<p>They matter beyond checkbox familiarity because JWTs are deceptively easy to <em>use</em> and dangerously easy to <em>misuse</em>. The library call is one line, so people ship them without understanding that the payload is readable by anyone, that <code>none</code>-algorithm attacks exist, that a token cannot be un-issued, or that storing it in <code>localStorage</code> exposes it to XSS. A large fraction of token-related breaches come from these exact misunderstandings. Knowing what a JWT guarantees (integrity) and what it does not (confidentiality, revocability) is what separates someone who "uses JWT" from someone who can secure a system with them.</p>`,
`<p>This topic covers the structure, the verify flow in detail, where to store tokens, the access + refresh token pattern that makes stateless auth practical, and the well-known pitfalls interviewers probe.</p>`,

`<h2>The concept, simply</h2>`,
`<p>A JWT is a <strong>signed, self-contained</strong> statement. Instead of the server storing "user 42 is logged in" and handing the client a lookup id, the server writes the fact directly into a token, signs it so it cannot be tampered with, and gives the whole thing to the client. When the client sends it back, the server re-checks the signature and trusts the contents — no database lookup required.</p>`,
`<p>A JWT has three parts, joined by dots: <code>header.payload.signature</code>. Each part is Base64URL-encoded JSON (except the signature, which is bytes).</p>`,
`{{fig:ch11-jwt-structure.svg|The three dot-separated parts of a JWT: header, payload, and signature|Header names the algorithm, payload carries claims like sub and exp, and the signature is an HMAC or RSA signature over the first two parts. Base64URL is encoding, not encryption.}}`,
`<p>The single most important thing to internalize: <strong>Base64URL is encoding, not encryption.</strong> Anyone who holds the token can decode and read the payload — paste it into jwt.io and it's all there. The signature does not hide the contents; it only proves they were not altered and were issued by someone holding the secret. Therefore: never put secrets, passwords, or sensitive PII in a JWT payload.</p>`,

`<h2>How it works</h2>`,
`<p><strong>The three parts.</strong> The <em>header</em> is JSON like <code>{"alg":"HS256","typ":"JWT"}</code> — it names the signing algorithm. The <em>payload</em> holds <em>claims</em>: standard registered claims like <code>sub</code> (subject/user id), <code>iat</code> (issued-at), <code>exp</code> (expiry), <code>iss</code> (issuer), <code>aud</code> (audience), plus any custom claims you add (<code>role</code>, <code>plan</code>). The <em>signature</em> is computed over the encoded header and payload.</p>`,
`<p><strong>Signing.</strong> For the common HMAC family (<code>HS256</code>), the signature is <code>HMAC-SHA256(base64url(header) + "." + base64url(payload), secret)</code>. The same secret both signs and verifies (symmetric). For the RSA/ECDSA families (<code>RS256</code>, <code>ES256</code>), a <em>private</em> key signs and the corresponding <em>public</em> key verifies (asymmetric) — this lets many services verify tokens without being able to mint them, which is ideal for distributed systems and third-party verifiers.</p>`,
`<p><strong>The verify flow, step by step.</strong> This is the part interviewers love to hear in detail:</p>`,
`<ol>
<li>Split the token on dots into header, payload, signature.</li>
<li>Base64URL-decode the header and read <code>alg</code>. Critically, the verifier must <em>enforce an expected algorithm</em> — it must not blindly trust the token's own <code>alg</code> field (see the alg-confusion pitfall).</li>
<li>Recompute the signature over <code>header.payload</code> using the server's key and the expected algorithm.</li>
<li>Compare the recomputed signature to the token's signature using a <strong>constant-time</strong> comparison. If they differ, reject — the token was tampered with or signed by the wrong key.</li>
<li>Only after the signature passes, validate the claims: is <code>exp</code> in the future? Is <code>nbf</code> (not-before) satisfied? Do <code>iss</code> and <code>aud</code> match what this service expects?</li>
<li>If everything passes, the payload is trusted and the request proceeds as that user.</li>
</ol>`,
`<p>Notice the ordering: <em>signature first, claims second</em>. If you read the payload before verifying the signature you are trusting attacker-controlled data. Good libraries enforce this ordering for you, which is exactly why you should not hand-roll verification.</p>`,
`<p><strong>Where to store the token on the client.</strong> Two mainstream options, each with a distinct threat model. <code>localStorage</code> is convenient and works for cross-domain APIs, but it is readable by any JavaScript on the page — so a single XSS flaw leaks every user's token. An <code>HttpOnly</code> cookie is invisible to JavaScript (mitigating XSS token theft) but is automatically attached to requests, which opens CSRF risk unless you add <code>SameSite</code> and/or CSRF tokens. The modern default for web apps is an <code>HttpOnly</code>, <code>Secure</code>, <code>SameSite</code> cookie; pure token-in-header suits native mobile clients where there is no cookie jar or CSRF surface.</p>`,
`<p><strong>The revocation problem and refresh tokens.</strong> Because a JWT is valid until <code>exp</code> and the server keeps no per-token state, you cannot instantly revoke one. The standard resolution is a two-token system: a short-lived <em>access token</em> (minutes) that is used on every API call and simply expires, and a long-lived <em>refresh token</em> (days/weeks) that is stored server-side (or in a store you control) and used only to mint new access tokens. Logging out or detecting theft deletes the refresh token, so the user is locked out within one short access-token lifetime.</p>`,
`{{fig:ch11-refresh-token-flow.svg|Sequence of login, using a short access token, expiry, and refreshing with a rotated refresh token|Login returns a short access token and a long refresh token; API calls use the access token until it expires, then the refresh token is exchanged (and rotated) for a new one. Refresh tokens are revocable server-side.}}`,
`<p><strong>Refresh token rotation</strong> hardens this further: every refresh issues a <em>new</em> refresh token and invalidates the old one. If a stolen refresh token is used after the legitimate client already rotated it, the server sees a reused (already-invalidated) token and can revoke the entire token family — turning theft into a detectable event.</p>`,

`<h2>Code examples</h2>`,
`<p>Issuing an access token on login with the <code>jsonwebtoken</code> library. Keep the payload minimal and always set an expiry.</p>`,
`<pre><code class="language-javascript">const jwt = require('jsonwebtoken');
const ACCESS_SECRET = process.env.ACCESS_SECRET; // long random string from env

function issueAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },   // claims — no secrets, no PII
    ACCESS_SECRET,
    { algorithm: 'HS256', expiresIn: '15m', issuer: 'api.myapp.com' }
  );
}

app.post('/login', async (req, res) =&gt; {
  const user = await authenticate(req.body); // verifies password hash
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ accessToken: issueAccessToken(user) });
});</code></pre>`,
`<p>Verifying the token in middleware. Note the explicit <code>algorithms</code> allow-list and issuer check — these close the alg-confusion and audience pitfalls. <code>jwt.verify</code> throws on an invalid signature or expired token, so it goes in a try/catch.</p>`,
`<pre><code class="language-javascript">function requireJwt(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const payload = jwt.verify(token, ACCESS_SECRET, {
      algorithms: ['HS256'],        // pin the algorithm — never trust token's alg
      issuer: 'api.myapp.com',      // reject tokens minted for another service
    });
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    // TokenExpiredError vs JsonWebTokenError — both mean "reject"
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}</code></pre>`,
`<p>The refresh endpoint. The refresh token is stored server-side so it can be revoked and rotated; presenting a valid one mints a fresh access token.</p>`,
`<pre><code class="language-javascript">app.post('/refresh', async (req, res) =&gt; {
  const token = req.cookies.refreshToken; // HttpOnly cookie
  if (!token) return res.status(401).json({ error: 'No refresh token' });

  // Look it up in our store — this is what makes it revocable
  const stored = await RefreshToken.findOne({ token, revoked: false });
  if (!stored || stored.expiresAt &lt; new Date()) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  // Rotate: invalidate the old one, issue a new pair
  stored.revoked = true;
  await stored.save();
  const user = await User.findById(stored.userId);
  const newRefresh = await RefreshToken.create({
    userId: user.id, token: crypto.randomBytes(40).toString('hex'),
    expiresAt: new Date(Date.now() + 7 * 864e5),
  });
  res
    .cookie('refreshToken', newRefresh.token, { httpOnly: true, secure: true, sameSite: 'strict' })
    .json({ accessToken: issueAccessToken(user) });
});</code></pre>`,
`<p>A denylist for the rare case where you must kill an <em>access</em> token before it expires (e.g. account compromise). Because access tokens are short-lived, the denylist stays small and entries expire quickly.</p>`,
`<pre><code class="language-javascript">// On logout / compromise, store the token's jti until its exp passes.
async function isRevoked(jti) {
  return Boolean(await redis.get('revoked:' + jti));
}
// In requireJwt, after verify: if (await isRevoked(payload.jti)) reject.</code></pre>`,

`<h2>Common mistakes &amp; gotchas</h2>`,
`<ul>
<li><strong>Putting secrets or PII in the payload.</strong> The payload is only Base64URL-encoded, not encrypted. Passwords, card numbers, and sensitive data are readable by anyone holding the token.</li>
<li><strong>Trusting the token's own <code>alg</code> header.</strong> The classic attacks are (a) <code>alg: "none"</code>, where a token claims to need no signature, and (b) RS256→HS256 confusion, where an attacker signs with the <em>public</em> key as if it were an HMAC secret. Always pass an explicit <code>algorithms</code> allow-list to <code>verify</code>.</li>
<li><strong>No expiry, or absurdly long expiry.</strong> A token without <code>exp</code> (or valid for months) is a permanent credential that cannot be revoked. Keep access tokens to minutes.</li>
<li><strong>Assuming you can revoke a JWT.</strong> A stateless token is valid until it expires. If you need instant logout/ban, you need short lifetimes plus a refresh/denylist mechanism — the token alone cannot do it.</li>
<li><strong>Storing tokens in <code>localStorage</code> without weighing XSS.</strong> Any script on the page can read it. Prefer <code>HttpOnly</code> cookies for browser apps, and treat any XSS as a full token compromise.</li>
<li><strong>Weak or committed signing secrets.</strong> A short or source-controlled HMAC secret lets attackers forge tokens. Use a long random secret from the environment/secret manager, and rotate it.</li>
<li><strong>Skipping <code>iss</code>/<code>aud</code> checks in multi-service setups.</strong> Without them, a token minted for service A may be replayed against service B.</li>
</ul>`,

`<h2>Best practices</h2>`,
`<ul>
<li><strong>Short-lived access + revocable refresh.</strong> Access tokens in minutes, refresh tokens server-side and rotated on each use, with reuse detection to catch theft.</li>
<li><strong>Always pin the algorithm.</strong> Pass <code>algorithms: ['HS256']</code> (or your chosen alg) to <code>verify</code> so a forged <code>alg</code> cannot downgrade the check.</li>
<li><strong>Always set and check <code>exp</code>, plus <code>iss</code> and <code>aud</code> when relevant.</strong> Reject expired, wrong-issuer, and wrong-audience tokens.</li>
<li><strong>Keep the payload lean.</strong> Only the id, role/scopes, and standard claims — no secrets, no large blobs (tokens ride on every request).</li>
<li><strong>Store browser tokens in <code>HttpOnly</code>, <code>Secure</code>, <code>SameSite</code> cookies</strong> and pair with CSRF defenses; use header-based tokens for native mobile.</li>
<li><strong>Prefer asymmetric signing (RS256/ES256) across services</strong> so verifiers hold only the public key and cannot mint tokens.</li>
<li><strong>Use a maintained library</strong> (<code>jsonwebtoken</code>, <code>jose</code>) and never hand-roll signing or verification.</li>
</ul>`,

`<h2>⭐ Interview lens</h2>`,
`<blockquote><p><strong>Q: Walk me through how a server verifies a JWT.</strong><br/>Split into header/payload/signature; read the expected algorithm (pinned by the server, not blindly from the token); recompute the signature over <code>header.payload</code> with the server's key; compare in constant time; if it matches, validate claims — <code>exp</code> not passed, <code>nbf</code> satisfied, <code>iss</code>/<code>aud</code> as expected. Signature is checked <em>before</em> trusting any claim.</p></blockquote>`,
`<blockquote><p><strong>Q: Is a JWT encrypted? Can I store the user's role in it? (trap)</strong><br/>It is signed, not encrypted — the payload is Base64URL and fully readable, so never store secrets or sensitive PII. Storing a non-sensitive role/scope is fine and normal; that's what claims are for. The trap is thinking the signature hides the contents; it only guarantees integrity and authenticity.</p></blockquote>`,
`<blockquote><p><strong>Q: How do you log a user out or revoke a JWT immediately?</strong><br/>You can't revoke a pure stateless JWT before it expires — that's its fundamental limitation. The practical answer: keep access tokens short-lived (minutes) and back them with a server-side refresh token you can delete, and optionally a short-lived denylist keyed by <code>jti</code> for emergency revocation of in-flight access tokens. Deleting the refresh token locks the user out within one access-token lifetime.</p></blockquote>`,
`<blockquote><p><strong>Q: What is the <code>alg: none</code> / algorithm-confusion attack?</strong><br/><code>alg: none</code> is a token claiming no signature is needed; a naive verifier that trusts the header accepts it unsigned. Algorithm confusion is signing an <code>HS256</code> token using the server's <em>public</em> RSA key as the HMAC secret when the server expected <code>RS256</code>. Both are defeated by pinning an explicit <code>algorithms</code> allow-list at verify time and never deriving the algorithm from the token.</p></blockquote>`,
`<blockquote><p><strong>Q: Access token vs refresh token — why have both?</strong><br/>The access token is used on every request and is stateless, so it must be short-lived to limit the damage if leaked. The refresh token is used rarely (only to mint access tokens), can be stored securely and server-side, and is therefore revocable. Together they give you the scalability of stateless verification plus the control of revocation. Rotation on each refresh adds theft detection.</p></blockquote>`,
`<blockquote><p><strong>Q: localStorage vs cookie for the token?</strong><br/><code>localStorage</code> is XSS-exposed (any script reads it) but immune to CSRF and easy cross-domain — okay for native/mobile or when you fully control XSS. <code>HttpOnly</code> cookies are hidden from JavaScript (XSS-resistant) but auto-sent, so they need <code>SameSite</code> and/or CSRF tokens. For browser web apps the recommended default is an <code>HttpOnly</code>, <code>Secure</code>, <code>SameSite</code> cookie.</p></blockquote>`,

`<h2>Cheat-card</h2>`,
`<ul>
<li><strong>Structure</strong>: <code>header.payload.signature</code>, each Base64URL JSON; signature = HMAC/RSA over first two parts.</li>
<li><strong>Base64URL ≠ encryption</strong> — payload is public. No secrets/PII inside.</li>
<li><strong>Verify order</strong>: signature (constant-time, pinned alg) → then claims (<code>exp</code>, <code>nbf</code>, <code>iss</code>, <code>aud</code>).</li>
<li><strong>HS256</strong> = symmetric (one secret). <strong>RS256/ES256</strong> = private signs, public verifies.</li>
<li><strong>Can't revoke</strong> a stateless JWT early → short access token + revocable/rotated refresh token.</li>
<li><strong>Pitfalls</strong>: <code>alg:none</code>, RS256→HS256 confusion, no <code>exp</code>, weak/committed secret.</li>
<li><strong>Browser storage</strong>: HttpOnly+Secure+SameSite cookie (+CSRF). Mobile: header token.</li>
<li>Always pass <code>algorithms: [...]</code> to <code>verify</code>; use a maintained lib.</li>
</ul>`
      ].join('\n')
    },

    // ------------------------------------------------------------------
    // Topic 2 — sessions-cookies
    // ------------------------------------------------------------------
    {
      title: 'Sessions & Cookies',
      slug: 'sessions-cookies',
      order: 2,
      content: [
`<h2>Why it matters</h2>`,
`<p>Cookies are the oldest and still the most widely used way to keep a user logged in across the stateless HTTP protocol. Every server-rendered app, most admin panels, and a large share of APIs rely on cookie-backed sessions. If you have ever wondered how a website "remembers" you after login without asking for your password on every page, the answer is almost always a session cookie.</p>`,
`<p>Sessions and cookies matter for security precisely because they carry the user's logged-in state. A stolen or forgeable session cookie is a complete account takeover — no password needed. That is why the cookie <em>flags</em> (<code>HttpOnly</code>, <code>Secure</code>, <code>SameSite</code>) are among the highest-leverage security controls you can set, and why interviewers ask about them constantly. They are one line of configuration that either closes or opens entire attack classes (XSS token theft, CSRF, cookie interception).</p>`,
`<p>This topic covers what a cookie actually is at the HTTP level, how server-side sessions work with a store, how <code>express-session</code> wires it together, and — most importantly — exactly what each cookie flag does and why the secure defaults are what they are.</p>`,

`<h2>The concept, simply</h2>`,
`<p>A <strong>cookie</strong> is a small key/value string the server asks the browser to store and send back on every subsequent request to that site. The server sets it with a <code>Set-Cookie</code> response header; the browser returns it in the <code>Cookie</code> request header automatically. That automatic round-trip is what makes cookies useful for sessions — and also what makes them vulnerable to CSRF.</p>`,
`<p>A <strong>session</strong> is server-side state associated with one user across requests. The dominant pattern is: store the real data (user id, roles, cart) on the server, and put only a random, unguessable <em>session id</em> in the cookie. The cookie is a claim ticket; the server holds the actual belongings.</p>`,
`{{fig:ch11-session-store-flow.svg|A request carrying a session cookie being looked up in a server-side store to rehydrate the user|The browser sends an opaque session id in a cookie; express-session looks it up in Redis or Mongo, rehydrates req.session, and the route runs knowing the user. Real data never leaves the server.}}`,
`<p>The key insight: the cookie holds a <em>pointer</em>, not the data. This keeps the cookie tiny, keeps sensitive data off the client, and — crucially — makes logout instant, because the server can simply delete the session from its store and the id becomes worthless.</p>`,

`<h2>How it works</h2>`,
`<p><strong>The cookie lifecycle.</strong> On login the server responds with <code>Set-Cookie: connect.sid=s%3Aabc123...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400</code>. The browser stores it and, on every future request to the same site, sends <code>Cookie: connect.sid=s%3Aabc123...</code>. The attributes after the value are directives to the browser, not sent back to the server — they govern <em>when</em> and <em>how</em> the browser is willing to send the cookie.</p>`,
`<p><strong>The session store.</strong> The session id in the cookie is looked up in a store to find the actual session data. The store is pluggable: the default in-memory store is convenient but only for development (it leaks memory, is wiped on restart, and cannot be shared across multiple server instances). Production uses Redis, MongoDB, or a SQL table so sessions survive restarts and are shared across a horizontally scaled cluster. This is the operational cost of stateful sessions — you need a shared store — and the reason some teams reach for stateless JWTs instead.</p>`,
`<p><strong>Signing vs storing.</strong> There are two flavours. In the <em>server-side session</em> model (the common one), the cookie holds only a random id and all data lives in the store; the id is HMAC-<em>signed</em> so the server can detect tampering. In the <em>client-side / cookie-session</em> model, the entire session payload is serialized into the cookie itself and signed (and possibly encrypted). The latter avoids a store but bloats the cookie, exposes data to the client, and — like a JWT — becomes hard to revoke. The signature in both cases prevents a user from editing their own cookie to, say, escalate their role.</p>`,
`<p><strong>The cookie flags — the security core.</strong> Each flag defends a specific attack:</p>`,
`<ul>
<li><strong><code>HttpOnly</code></strong> — the cookie is invisible to JavaScript (<code>document.cookie</code> cannot read it). This means an XSS payload cannot steal the session cookie. Every session/auth cookie should be <code>HttpOnly</code>.</li>
<li><strong><code>Secure</code></strong> — the browser only sends the cookie over HTTPS. Without it, a cookie can leak in plaintext over an insecure network. Mandatory in production.</li>
<li><strong><code>SameSite</code></strong> — controls whether the cookie is sent on cross-site requests, the primary CSRF defense. <code>Strict</code> never sends it cross-site (safest, but breaks inbound links that expect you logged in); <code>Lax</code> (the modern browser default) sends it on top-level GET navigations but not on cross-site POSTs/subresource requests — a good balance; <code>None</code> sends it always but <em>requires</em> <code>Secure</code> and is only for legitimate cross-site use (e.g. third-party embeds).</li>
<li><strong><code>Domain</code> / <code>Path</code></strong> — scope which hosts and URL paths receive the cookie. Keep them as narrow as possible; a cookie scoped to a parent domain is shared with every subdomain.</li>
<li><strong><code>Max-Age</code> / <code>Expires</code></strong> — control lifetime. No expiry means a session cookie that dies when the browser closes; an explicit value makes it persistent. Shorter is safer.</li>
</ul>`,
`<p><strong>Session fixation.</strong> A subtle attack: if the server keeps the same session id before and after login, an attacker who plants a known id in the victim's browser (via a link) can wait for the victim to log in and then use that same id — now authenticated. The defense is to <em>regenerate</em> the session id at the moment of privilege change (login), which <code>req.session.regenerate()</code> does. This is a favourite interview follow-up.</p>`,

`<h2>Code examples</h2>`,
`<p>Configuring <code>express-session</code> with a Redis store and hardened cookie flags. These options are the difference between a toy setup and a production-safe one.</p>`,
`<pre><code class="language-javascript">const session = require('express-session');
const { RedisStore } = require('connect-redis');
const { createClient } = require('redis');

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect();

app.set('trust proxy', 1); // trust the reverse proxy so Secure cookies work behind it

app.use(session({
  store: new RedisStore({ client: redisClient }), // NOT the default MemoryStore
  secret: process.env.SESSION_SECRET,             // signs the session id cookie
  name: 'sid',                                    // don't advertise the framework
  resave: false,                                  // don't rewrite unchanged sessions
  saveUninitialized: false,                       // don't create sessions for anon visitors
  cookie: {
    httpOnly: true,        // JS can't read it -&gt; XSS can't steal it
    secure: true,          // HTTPS only
    sameSite: 'lax',       // CSRF defense for top-level navigation
    maxAge: 1000 * 60 * 60 * 8, // 8 hours
  },
}));</code></pre>`,
`<p>Login writes to the session, and — critically — regenerates the id first to prevent session fixation.</p>`,
`<pre><code class="language-javascript">app.post('/login', async (req, res, next) =&gt; {
  const user = await authenticate(req.body);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  // Regenerate the session id on privilege change to defeat fixation
  req.session.regenerate((err) =&gt; {
    if (err) return next(err);
    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.save((err2) =&gt; {   // ensure it's persisted before responding
      if (err2) return next(err2);
      res.json({ ok: true });
    });
  });
});</code></pre>`,
`<p>Reading the session in protected routes, and logging out by destroying the server-side session (not just clearing the cookie).</p>`,
`<pre><code class="language-javascript">function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

app.post('/logout', (req, res) =&gt; {
  req.session.destroy((err) =&gt; {          // deletes the record from the store
    res.clearCookie('sid');               // and drop the cookie client-side
    res.json({ ok: true });
  });
});</code></pre>`,
`<p>Setting a raw cookie without the session library, to see the flags directly — for example a non-sensitive preference cookie.</p>`,
`<pre><code class="language-javascript">app.get('/set-theme', (req, res) =&gt; {
  res.cookie('theme', 'dark', {
    httpOnly: false,      // this one is fine for JS to read; it's not a credential
    secure: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 365,
    path: '/',
  });
  res.json({ ok: true });
});</code></pre>`,

`<h2>Common mistakes &amp; gotchas</h2>`,
`<ul>
<li><strong>Shipping the default MemoryStore to production.</strong> It leaks memory, resets on every restart (logging everyone out), and is not shared across instances, so sessions break the moment you scale beyond one process. Always configure a real store.</li>
<li><strong>Forgetting <code>HttpOnly</code> on the session cookie.</strong> Without it, any XSS reads <code>document.cookie</code> and steals the session — full account takeover. Auth cookies must be <code>HttpOnly</code>.</li>
<li><strong>Missing <code>Secure</code> (or misconfigured proxy).</strong> The cookie can traverse HTTP in plaintext. Behind a load balancer you also need <code>app.set('trust proxy', 1)</code> or the framework thinks the connection is insecure and drops the <code>Secure</code> cookie.</li>
<li><strong>No <code>SameSite</code>, leaving CSRF wide open.</strong> Relying on the browser default is fragile across clients; set it explicitly (<code>Lax</code> for most apps).</li>
<li><strong>Not regenerating the session id at login.</strong> Opens session fixation. Call <code>req.session.regenerate()</code> on any privilege change.</li>
<li><strong>Clearing the cookie but not destroying the session.</strong> If you only <code>clearCookie</code>, the server-side record lives on; a copied cookie still works. Logout must <code>destroy()</code> the store record.</li>
<li><strong>Overly broad <code>Domain</code>.</strong> Scoping a session cookie to <code>.example.com</code> shares it with every subdomain, including less-trusted ones.</li>
</ul>`,

`<h2>Best practices</h2>`,
`<ul>
<li><strong>Set the trinity of flags on every auth cookie:</strong> <code>HttpOnly</code>, <code>Secure</code>, and an explicit <code>SameSite</code> (Lax or Strict).</li>
<li><strong>Use a production session store</strong> (Redis is the common choice) so sessions survive restarts and scale across instances.</li>
<li><strong>Regenerate the session id on login</strong> and destroy it fully on logout.</li>
<li><strong>Keep the cookie to just the id</strong>; store real data server-side. Rename the cookie so it doesn't advertise the framework, and set <code>saveUninitialized: false</code> so you don't mint sessions for anonymous visitors.</li>
<li><strong>Set sensible lifetimes and consider idle/absolute timeouts</strong> — a shorter session window limits the value of a stolen cookie.</li>
<li><strong>Behind a proxy, set <code>trust proxy</code></strong> so <code>Secure</code> cookies and correct client IPs work.</li>
<li><strong>Pair cookie sessions with CSRF protection</strong> (SameSite plus a token for state-changing requests) since cookies are auto-sent.</li>
</ul>`,

`<h2>⭐ Interview lens</h2>`,
`<blockquote><p><strong>Q: What do HttpOnly, Secure, and SameSite each protect against?</strong><br/><code>HttpOnly</code> stops JavaScript (hence XSS) from reading the cookie — defends against session theft via XSS. <code>Secure</code> restricts the cookie to HTTPS — defends against plaintext interception. <code>SameSite</code> controls cross-site sending — the primary defense against CSRF. They address three different attack classes, which is why you set all three on an auth cookie.</p></blockquote>`,
`<blockquote><p><strong>Q: Why not store the session data directly in the cookie? (trap)</strong><br/>You can (signed cookie-session), but it has real downsides: the cookie grows and rides on every request; the data is exposed to (though not editable by) the client; and it becomes hard to revoke because the state lives on the client, not the server. The server-side model keeps the cookie tiny (just an id), keeps data private, and makes logout instant by deleting the store record. The trap is assuming "cookie = where the data lives"; normally the cookie is just a pointer.</p></blockquote>`,
`<blockquote><p><strong>Q: What is session fixation and how do you prevent it?</strong><br/>An attacker fixes a known session id in the victim's browser before login; if the server keeps that same id after authentication, the attacker now shares an authenticated session. Prevent it by regenerating the session id at the moment of privilege elevation (<code>req.session.regenerate()</code> on login), so the pre-login id becomes useless.</p></blockquote>`,
`<blockquote><p><strong>Q: Why is the default express-session MemoryStore unsafe for production?</strong><br/>It stores sessions in the Node process's memory: it leaks (never fully frees old sessions), it is wiped on restart or crash (logging everyone out), and it is not shared, so with more than one instance a user's session exists on only one server and breaks under load balancing. Production needs an external store like Redis.</p></blockquote>`,
`<blockquote><p><strong>Q: SameSite=Strict vs Lax vs None — when do you use each?</strong><br/><code>Strict</code> never sends the cookie cross-site — most secure, but a user following a link from another site arrives logged-out, which can hurt UX. <code>Lax</code> (the modern default) sends it on top-level GET navigations but not cross-site POSTs or subresource loads — the usual sweet spot. <code>None</code> sends it on all cross-site requests and is required for legitimate third-party contexts, but must be paired with <code>Secure</code>.</p></blockquote>`,
`<blockquote><p><strong>Q: A user logs out but their old cookie still works. Why?</strong><br/>Almost certainly logout only cleared the cookie client-side without destroying the server-side session. Because the real state lives in the store, a copy of the cookie still resolves to a valid session. Logout must call <code>req.session.destroy()</code> to remove the store record (and then clear the cookie).</p></blockquote>`,

`<h2>Cheat-card</h2>`,
`<ul>
<li><strong>Cookie</strong>: server sets via <code>Set-Cookie</code>, browser auto-returns via <code>Cookie</code> header.</li>
<li><strong>Session</strong>: opaque id in cookie → real data in server store (Redis in prod, not MemoryStore).</li>
<li><strong>HttpOnly</strong> → blocks XSS cookie theft. <strong>Secure</strong> → HTTPS only. <strong>SameSite</strong> → CSRF defense.</li>
<li><strong>SameSite</strong>: Strict (no cross-site), Lax (top-level GET, default), None (all, needs Secure).</li>
<li><strong>Fixation</strong> → regenerate session id on login (<code>req.session.regenerate()</code>).</li>
<li><strong>Logout</strong> → <code>req.session.destroy()</code>, not just <code>clearCookie</code>.</li>
<li>Behind a proxy: <code>app.set('trust proxy', 1)</code> for Secure cookies to stick.</li>
<li><code>saveUninitialized:false</code>, rename cookie, keep it to the id only.</li>
</ul>`
      ].join('\n')
    },

    // ------------------------------------------------------------------
    // Topic 3 — password-hashing
    // ------------------------------------------------------------------
    {
      title: 'Password Hashing',
      slug: 'password-hashing',
      order: 3,
      content: [
`<h2>Why it matters</h2>`,
`<p>Storing passwords is one of the few pieces of code where a single wrong decision can harm millions of people. Data breaches are routine; the question is not whether your database might leak, but what an attacker can do when it does. If you stored passwords as plaintext, the answer is "log in as every user, everywhere" — because people reuse passwords across sites. If you hashed them correctly, the answer is "spend years and fail". Password storage is the clearest example of designing for the assumption that the perimeter <em>will</em> be breached.</p>`,
`<p>It is also a frequent interview topic because it exposes whether a candidate understands the difference between a general-purpose hash (fast, for integrity) and a password hash (deliberately slow, for resistance to guessing), plus salting, timing attacks, and cost tuning. These are conceptual, not syntactic — you cannot bluff them. "Why not just SHA-256 the password?" is a question that instantly separates people who have thought about security from those who have not.</p>`,
`<p>This topic covers why plaintext and fast hashes are unacceptable, how salting defeats precomputation, how bcrypt and argon2 make guessing expensive, and how timing-safe comparison prevents a subtler leak.</p>`,

`<h2>The concept, simply</h2>`,
`<p>You should never be able to recover a user's password from what you store — not even you, the operator. So you do not store the password; you store a <strong>one-way hash</strong> of it. At login you hash the submitted password the same way and compare. A hash is one-way: easy to compute forwards, infeasible to reverse.</p>`,
`<p>But a plain hash is not enough, for two reasons. First, identical passwords produce identical hashes, so an attacker can precompute hashes of common passwords (a <em>rainbow table</em>) and match them in bulk. The fix is a <strong>salt</strong>: a unique random value mixed into each password before hashing, so the same password yields a different hash for every user, and precomputed tables become useless. Second, general-purpose hashes like SHA-256 are <em>fast</em> — modern GPUs compute billions per second — so an attacker can brute-force guesses quickly. The fix is a <strong>slow, tunable</strong> hash: a password KDF (key derivation function) like bcrypt or argon2 that is deliberately expensive to compute.</p>`,
`{{fig:ch11-password-hashing.svg|Password combined with a random salt then run through a slow KDF to produce a stored hash, contrasted with fast unsalted hashes|A password plus a unique salt is fed through a slow, cost-tuned KDF (bcrypt/argon2) to produce the stored hash. Fast unsalted hashes like MD5 or SHA-256 fall to rainbow tables and GPU brute force.}}`,
`<p>Put together: <strong>salted + slow</strong>. Salting kills precomputation; slowness kills mass guessing. bcrypt and argon2 do both, and they embed the salt and cost parameters right inside the output string so you do not manage them separately.</p>`,

`<h2>How it works</h2>`,
`<p><strong>Why plaintext is indefensible.</strong> If the database leaks, every credential is instantly usable — and because users reuse passwords, your breach becomes a breach of their email, bank, and everything else. There is no scenario where storing plaintext (or reversible/encrypted-with-a-key passwords) is acceptable for authentication.</p>`,
`<p><strong>Why fast hashes (MD5, SHA-1, SHA-256) fail.</strong> These are designed to be fast for verifying file integrity. That speed is a liability for passwords: an attacker with the hash dump runs a wordlist or brute force at billions of guesses per second on commodity GPUs. Unsalted, they also fall to rainbow tables — giant precomputed hash→password lookups. SHA-256 is a fine hash; it is simply the wrong <em>tool</em> for passwords because it is not slow and has no salting built in.</p>`,
`<p><strong>How salting defeats precomputation.</strong> A salt is a random value (16 bytes is typical) generated per user and stored alongside the hash. The KDF hashes <code>salt + password</code>. Because every user's salt differs, two users with password "hunter2" get completely different stored hashes — so an attacker cannot recognise shared passwords, and any rainbow table would have to be rebuilt per salt, which is infeasible. The salt is not secret; it can be public. Its job is uniqueness, not secrecy. (A <em>pepper</em> — a secret value added on top, stored separately from the DB — is an optional extra layer.)</p>`,
`<p><strong>How bcrypt works.</strong> bcrypt is a password hashing function built on the Blowfish cipher with a tunable <em>cost factor</em> (also called work factor or rounds). The cost is logarithmic: cost 12 means 2^12 = 4096 iterations of key setup. Each increment <em>doubles</em> the work, so as hardware gets faster you simply raise the cost to keep hashing expensive for attackers while it stays a fraction of a second for your one legitimate login. bcrypt also generates and embeds the salt automatically. Its output string encodes everything: <code>$2b$12$&lt;22-char salt&gt;&lt;31-char hash&gt;</code> — the algorithm, the cost, the salt, and the digest, all in one field. That is why you store a single column and never a separate salt.</p>`,
`<p><strong>How argon2 improves on it.</strong> argon2 (specifically argon2id) won the 2015 Password Hashing Competition and is the current recommendation for new systems. Beyond being slow (time cost), it is <em>memory-hard</em>: it requires a configurable amount of RAM to compute, which specifically defeats attackers using GPUs and ASICs that have massive parallel compute but limited memory per core. Its parameters are time cost, memory cost, and parallelism. bcrypt remains perfectly acceptable and battle-tested; argon2id is preferred for new designs where the memory-hardness matters. (scrypt is a third memory-hard option; PBKDF2 is an older, non-memory-hard KDF still used where FIPS compliance is required.)</p>`,
`<p><strong>Timing attacks and constant-time comparison.</strong> When you verify a password, the KDF's own <code>compare</code> function does a timing-safe comparison of the digests. This matters because a naive byte-by-byte string comparison returns faster when the first differing byte is early, leaking information about how much of a guess is correct. bcrypt's <code>compare</code> and argon2's <code>verify</code> are constant-time, so they do not leak. The same principle applies anywhere you compare secrets (tokens, HMAC signatures): use <code>crypto.timingSafeEqual</code>, never <code>===</code>. A related timing leak is at the <em>account</em> level — responding faster when the email doesn't exist reveals which emails are registered; the mitigation is to always run a hash comparison (against a dummy hash if the user is missing) so the response time is uniform.</p>`,

`<h2>Code examples</h2>`,
`<p>Hashing a password on registration with bcrypt. You pass a cost factor; the library generates the salt and embeds it in the output.</p>`,
`<pre><code class="language-javascript">const bcrypt = require('bcrypt');
const COST = 12; // work factor — tune so one hash takes ~200-300ms on your hardware

app.post('/register', async (req, res) =&gt; {
  const { email, password } = req.body;
  if (password.length &lt; 8) return res.status(400).json({ error: 'Too short' });

  // Salt is generated automatically and stored inside the hash string
  const passwordHash = await bcrypt.hash(password, COST);

  await User.create({ email, passwordHash });
  res.status(201).json({ ok: true });
});</code></pre>`,
`<p>Verifying at login with <code>bcrypt.compare</code>, which extracts the salt and cost from the stored hash and does a timing-safe comparison. Note the anti-enumeration trick of always comparing.</p>`,
`<pre><code class="language-javascript">// A fixed dummy hash so we do equal work whether or not the user exists
const DUMMY = '$2b$12$C6UzMDM.H6dfI/f/IKcEeOjHVQz.iC1p1w1z8m3M0nJ0oQ8qKx8Iu';

app.post('/login', async (req, res) =&gt; {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  // Always run compare (against DUMMY if no user) to keep timing uniform
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY);

  if (!user || !ok) {
    return res.status(401).json({ error: 'Invalid credentials' }); // one generic message
  }
  req.session.regenerate((err) =&gt; {
    if (err) return res.status(500).json({ error: 'Server error' });
    req.session.userId = user.id;
    res.json({ ok: true });
  });
});</code></pre>`,
`<p>argon2id for a new system — the recommended modern default, with explicit memory/time parameters.</p>`,
`<pre><code class="language-javascript">const argon2 = require('argon2');

async function hashPassword(password) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,  // ~19 MiB — memory-hardness defeats GPU/ASIC attackers
    timeCost: 2,        // iterations
    parallelism: 1,
  });
}

async function verifyPassword(hash, password) {
  return argon2.verify(hash, password); // timing-safe; reads params from the hash
}</code></pre>`,
`<p>Constant-time comparison for other secrets (e.g. an API key or HMAC), showing the general principle behind why <code>compare</code> is timing-safe.</p>`,
`<pre><code class="language-javascript">const crypto = require('crypto');

function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Length must match first; timingSafeEqual throws on unequal lengths
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB); // does NOT short-circuit on first diff
}</code></pre>`,
`<p>Upgrading cost/algorithm transparently on login — because the stored hash records its own parameters, you can detect outdated hashes and re-hash with stronger settings the next time the user authenticates.</p>`,
`<pre><code class="language-javascript">async function loginAndMaybeUpgrade(user, password) {
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return false;

  // If the stored cost is below our current target, re-hash now (we have the plaintext)
  const currentCost = Number(user.passwordHash.split('$')[2]);
  if (currentCost &lt; COST) {
    user.passwordHash = await bcrypt.hash(password, COST);
    await user.save();
  }
  return true;
}</code></pre>`,

`<h2>Common mistakes &amp; gotchas</h2>`,
`<ul>
<li><strong>Storing plaintext or reversible (encrypted) passwords.</strong> Any scheme where you can recover the original is a full compromise on breach. Passwords must be one-way hashed.</li>
<li><strong>Using a fast/general hash (MD5, SHA-1, SHA-256) for passwords.</strong> Fast means brute-forceable at billions/sec; unsalted means rainbow-table-able. Wrong tool entirely — use bcrypt/argon2/scrypt.</li>
<li><strong>Reusing one global salt, or no salt.</strong> A shared or missing salt lets precomputation and cross-user matching succeed. Salts must be unique per user (bcrypt/argon2 do this for you).</li>
<li><strong>Comparing hashes with <code>===</code>.</strong> Naive comparison leaks timing. Use the library's <code>compare</code>/<code>verify</code> or <code>crypto.timingSafeEqual</code>.</li>
<li><strong>Cost factor too low (or never revisited).</strong> A cost tuned for 2013 hardware is cheap to crack today. Pick a cost that takes a few hundred milliseconds now and raise it over time.</li>
<li><strong>Leaking account existence via timing or messages.</strong> Skipping the hash when the user is missing makes "no such user" faster to detect. Always compare against a dummy hash and return one generic error.</li>
<li><strong>bcrypt's 72-byte input limit.</strong> bcrypt silently truncates input beyond 72 bytes, which matters for very long passwords or pre-hashing schemes — a known gotcha; argon2 has no such limit.</li>
<li><strong>Hashing on the client and sending the hash.</strong> That just makes the hash <em>be</em> the password. Hash server-side over TLS.</li>
</ul>`,

`<h2>Best practices</h2>`,
`<ul>
<li><strong>Use argon2id for new systems, bcrypt where already established</strong> — both are salted, slow, and vetted. Avoid MD5/SHA for passwords entirely.</li>
<li><strong>Let the library handle the salt</strong> (unique per user, embedded in the output). Never invent your own salting scheme.</li>
<li><strong>Tune the cost to your hardware</strong> so a single hash takes roughly 200-300ms, and increase it as hardware improves; re-hash on login to upgrade legacy hashes.</li>
<li><strong>Always use timing-safe comparison</strong> — the library's <code>compare</code>/<code>verify</code>, and <code>crypto.timingSafeEqual</code> for other secrets.</li>
<li><strong>Prevent account enumeration</strong>: uniform response for unknown-user and wrong-password, and always run a hash comparison.</li>
<li><strong>Hash server-side over HTTPS</strong>; enforce a sensible minimum length and check against breached-password lists rather than complex composition rules.</li>
<li><strong>Consider a pepper</strong> (a secret added on top, stored outside the DB) for defense in depth, and rate-limit login attempts to slow online guessing.</li>
</ul>`,

`<h2>⭐ Interview lens</h2>`,
`<blockquote><p><strong>Q: Why not just hash passwords with SHA-256? (trap)</strong><br/>Two reasons. SHA-256 is <em>fast</em> — attackers compute billions of guesses per second on GPUs — whereas password storage needs a deliberately <em>slow</em>, tunable function so guessing is expensive. And SHA-256 has no salting, so identical passwords hash identically and fall to precomputed rainbow tables. Password KDFs like bcrypt and argon2 are slow, salted, and cost-tunable. SHA-256 isn't "broken"; it's the wrong tool for this job.</p></blockquote>`,
`<blockquote><p><strong>Q: What is a salt and what problem does it solve?</strong><br/>A salt is a unique random value mixed into each password before hashing. It ensures two users with the same password get different stored hashes, which (a) defeats precomputed rainbow tables — an attacker would have to rebuild them per salt — and (b) hides the fact that users share a password. The salt is not secret; its purpose is uniqueness, and bcrypt/argon2 generate and embed it automatically.</p></blockquote>`,
`<blockquote><p><strong>Q: What does the bcrypt cost factor do, and how do you pick it?</strong><br/>It sets the work: cost N means 2^N iterations, so each increment doubles the time. You pick the highest cost your servers can tolerate for a single login — commonly targeting ~200-300ms — which stays trivial for one real user but multiplies the attacker's brute-force cost enormously. Because it's tunable, you raise it as hardware improves.</p></blockquote>`,
`<blockquote><p><strong>Q: bcrypt vs argon2 — which and why?</strong><br/>Both are salted, slow, and battle-tested. bcrypt is older, extremely well-vetted, and fine to keep. argon2id (the PHC winner) is the modern recommendation for new systems because it's additionally <em>memory-hard</em> — it forces attackers to spend RAM, neutralising the parallel-compute advantage of GPUs and ASICs. Also note bcrypt truncates input at 72 bytes; argon2 has no such limit.</p></blockquote>`,
`<blockquote><p><strong>Q: What is a timing attack in the context of password/token comparison?</strong><br/>A naive comparison (<code>===</code> / byte-by-byte) returns as soon as it finds a mismatched byte, so the response time reveals how many leading bytes were correct — enough to reconstruct a secret over many attempts. Constant-time comparison (bcrypt's <code>compare</code>, <code>crypto.timingSafeEqual</code>) always examines the full value, leaking no positional information.</p></blockquote>`,
`<blockquote><p><strong>Q: Where do you store the salt, and should it be encrypted?</strong><br/>The salt is stored right alongside the hash — in fact bcrypt/argon2 embed it inside the single hash string. It does not need to be secret or encrypted because its only role is to be unique per user and defeat precomputation. If you want an additional secret component, that's a <em>pepper</em>, stored separately from the database (e.g. in a secret manager), not the salt.</p></blockquote>`,

`<h2>Cheat-card</h2>`,
`<ul>
<li><strong>Never</strong> store plaintext or reversible passwords; hash one-way.</li>
<li><strong>Not</strong> MD5/SHA (fast + unsalted → GPU brute force + rainbow tables).</li>
<li><strong>Salted + slow</strong>: salt kills precomputation, slowness kills mass guessing.</li>
<li><strong>bcrypt</strong>: cost factor 2^N, embeds salt; output <code>$2b$12$salt+hash</code>; 72-byte input cap.</li>
<li><strong>argon2id</strong>: modern default, memory-hard (defeats GPU/ASIC); tune memory+time.</li>
<li>Salt = unique, public, per-user. <strong>Pepper</strong> = optional secret stored outside DB.</li>
<li><strong>Timing-safe compare</strong>: <code>bcrypt.compare</code>/<code>argon2.verify</code>, <code>crypto.timingSafeEqual</code>.</li>
<li>Tune cost to ~200-300ms, raise over time, re-hash on login; block user enumeration.</li>
</ul>`
      ].join('\n')
    },

    // ------------------------------------------------------------------
    // Topic 4 — web-security-owasp
    // ------------------------------------------------------------------
    {
      title: 'Web Security & OWASP',
      slug: 'web-security-owasp',
      order: 4,
      content: [
`<h2>Why it matters</h2>`,
`<p>Authentication and password hashing protect the front door, but a real application has dozens of other surfaces an attacker can push on: the query it runs, the HTML it renders, the requests it accepts from other sites, the dependencies it pulls from npm, the secrets it ships. Web security is the discipline of hardening all of them together. The OWASP Top 10 is the industry's shared checklist of the risks that actually cause breaches, and knowing it is effectively table stakes for a backend engineer.</p>`,
`<p>For Node specifically, several of these risks have a distinctive flavour: NoSQL (MongoDB) injection via unvalidated objects, prototype pollution through unsafe merges, and a very large dependency tree where a single transitive package can introduce a vulnerability. Interviewers ask about OWASP not to hear you recite ten items, but to see whether you can look at a route and spot the injection, the missing escape, the absent authorization, or the leaked secret — and then name the concrete Express-level mitigation.</p>`,
`<p>This topic surveys the highest-frequency risks (injection, XSS, CSRF, broken access control, secrets, vulnerable dependencies) and the practical defenses in a Node/Express app: parameterized queries, output escaping and CSP, SameSite/CSRF tokens, helmet, rate limiting, input validation, and secret management. The theme throughout is <strong>defense in depth</strong> — no single control is sufficient.</p>`,

`<h2>The concept, simply</h2>`,
`<p>Almost every web vulnerability is a variation of one root cause: <strong>untrusted input crossing a trust boundary without being neutralized</strong>. User input becomes part of a database query (injection), part of an HTML page (XSS), part of a shell command (command injection), or part of an object you merge into your config (prototype pollution). The defense is always to treat data as data — parameterize, escape, validate, and separate it from code or commands.</p>`,
`<p>CSRF is slightly different: it abuses the browser's automatic sending of cookies to make a logged-in user perform actions they didn't intend. And a second class of problems is about <em>configuration and hygiene</em> rather than input: leaked secrets, missing security headers, unpatched dependencies, and absent rate limiting.</p>`,
`{{fig:ch11-owasp-threats.svg|A grid of six common web risks — injection, XSS, CSRF, broken access control, secrets exposure, vulnerable dependencies — each with its one-line fix|Injection, XSS, CSRF, broken access control, secrets exposure and vulnerable dependencies are recurring Node risks; each has a concrete mitigation, and real security layers them together.}}`,
`<p>The practical mindset is <strong>defense in depth</strong>: assume any one layer can fail and stack independent controls so an attacker must defeat all of them. A request should pass through secure headers, rate limiting, authentication, authorization, and input validation before it ever touches your business logic — and the business logic itself should still use parameterized queries and escape its output.</p>`,
`{{fig:ch11-defense-layers.svg|A request passing left-to-right through helmet, rate limiting, CORS, auth, validation, and the handler before producing a safe response|Layered middleware — secure headers, rate limiting, CORS, authN/authZ, input validation — filters a request before it reaches the handler, which still parameterizes queries and escapes output. Each layer assumes the others may fail.}}`,

`<h2>How it works</h2>`,
`<p><strong>Injection (SQL, NoSQL, command).</strong> Injection happens when input is concatenated into a query or command so that the attacker's data is interpreted as code. In SQL, <code>"SELECT * FROM users WHERE email = '" + input + "'"</code> lets input like <code>' OR '1'='1</code> change the query's meaning. The fix is <em>parameterized queries / prepared statements</em>, where the driver sends the query structure and the values separately, so values can never become code. In MongoDB, the analogue is passing a user-supplied <em>object</em> straight into a query: <code>{ email: req.body.email }</code> where <code>email</code> is actually <code>{ "$ne": null }</code> becomes an operator injection. The fix is to validate types (coerce to string) and cast/sanitize input. Command injection (<code>child_process.exec</code> with user input) is defeated by avoiding the shell — use <code>execFile</code>/<code>spawn</code> with an argument array so input is never parsed by a shell.</p>`,
`<p><strong>XSS (cross-site scripting).</strong> XSS is injection into the HTML/JS context: attacker-supplied text is rendered into a page and executed as script in other users' browsers, letting it steal cookies (unless <code>HttpOnly</code>), tokens, or perform actions as the victim. <em>Stored</em> XSS persists the payload (e.g. a comment); <em>reflected</em> XSS bounces it back from a request; <em>DOM-based</em> XSS happens entirely client-side. The defenses are: <em>escape output</em> for the context it lands in (template engines that auto-escape, or explicit HTML-entity encoding), never build DOM with <code>innerHTML</code> from untrusted data, sanitize any HTML you must allow (DOMPurify), and set a <strong>Content-Security-Policy</strong> header that restricts which scripts can run — a strong second line so that even an injected script is blocked from executing.</p>`,
`<p><strong>CSRF (cross-site request forgery).</strong> Because browsers automatically attach cookies to requests, a malicious site can cause the victim's browser to send a state-changing request to your app (e.g. a hidden form that POSTs to <code>/transfer</code>) using the victim's session cookie. The server sees a validly-authenticated request and performs the action. Defenses: <code>SameSite</code> cookies (Lax/Strict) so the cookie isn't sent on cross-site POSTs; a <strong>CSRF token</strong> — an unpredictable value the server issues and requires echoed back in a header/field that a cross-site attacker cannot read; and checking <code>Origin</code>/<code>Referer</code>. Note CSRF primarily affects cookie-based auth; a token sent in an <code>Authorization</code> header (not auto-attached by the browser) is inherently less exposed.</p>`,
`<p><strong>Security headers via helmet.</strong> <code>helmet</code> is Express middleware that sets a bundle of protective HTTP response headers: <code>Content-Security-Policy</code>, <code>Strict-Transport-Security</code> (force HTTPS), <code>X-Content-Type-Options: nosniff</code> (stop MIME sniffing), <code>X-Frame-Options</code>/frame-ancestors (clickjacking), <code>Referrer-Policy</code>, and it removes the <code>X-Powered-By: Express</code> fingerprint. One line raises your baseline substantially, though CSP usually needs tuning for your app's real script sources.</p>`,
`<p><strong>Rate limiting.</strong> Limiting how many requests an IP/user can make in a window protects against brute-force login attempts, credential stuffing, scraping, and denial-of-service. In Node, <code>express-rate-limit</code> (backed by Redis for multi-instance deployments) caps requests; stricter limits go on sensitive endpoints like login and password reset. Rate limiting is also a key mitigation for the online-guessing side of the password topic.</p>`,
`<p><strong>Secrets management.</strong> API keys, DB passwords, and signing secrets must never be hard-coded or committed to git — a leaked secret in a public repo is scraped within minutes. Load secrets from environment variables (via a secret manager in production: AWS Secrets Manager, Vault, etc.), keep <code>.env</code> out of version control (<code>.gitignore</code>), never send them to the client bundle, rotate them regularly, and treat any exposure as a rotate-now incident. Front-end code is fully visible, so anything shipped to the browser is not a secret.</p>`,
`<p><strong>Vulnerable and outdated dependencies.</strong> A Node app's real attack surface includes its entire <code>node_modules</code> tree, most of which you didn't write. Known CVEs in dependencies are a top-10 risk. Defenses: <code>npm audit</code> (and fixing/upgrading), automated tools like Dependabot/Snyk, pinning versions with a committed lockfile, minimizing dependencies, and reviewing new packages before adding them (supply-chain attacks ship malware in popular-looking packages).</p>`,

`<h2>Code examples</h2>`,
`<p>Parameterized queries defeat SQL injection; NoSQL needs type validation to defeat operator injection.</p>`,
`<pre><code class="language-javascript">// SQL — VULNERABLE: input becomes part of the query
db.query(\`SELECT * FROM users WHERE email = '\${req.body.email}'\`);

// SQL — SAFE: driver sends structure and values separately
db.query('SELECT * FROM users WHERE email = $1', [req.body.email]);

// MongoDB — VULNERABLE: an object like { $ne: null } injects an operator
await User.findOne({ email: req.body.email, password: req.body.password });

// MongoDB — SAFE: coerce to the expected type so operators can't sneak in
await User.findOne({ email: String(req.body.email) }); // then verify hash separately</code></pre>`,
`<p>A hardened Express app: helmet for headers, a global and a strict login rate limiter, body-size limits, and CORS restricted to an allow-list.</p>`,
`<pre><code class="language-javascript">const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const app = express();

app.use(helmet());                         // secure headers + removes X-Powered-By
app.use(express.json({ limit: '10kb' }));  // cap body size to blunt DoS
app.use(cors({ origin: ['https://myapp.com'], credentials: true })); // allow-list only

// Global limiter
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// Strict limiter on auth endpoints to stop brute force / credential stuffing
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });
app.post('/login', loginLimiter, handleLogin);</code></pre>`,
`<p>Escaping output prevents XSS; a Content-Security-Policy is the backstop. Auto-escaping template engines handle most of this, but explicit encoding shows the principle.</p>`,
`<pre><code class="language-javascript">// Auto-escaping via a template engine (EJS/Pug/Handlebars escape by default):
// res.render('profile', { name: user.name });  // {{name}} is HTML-escaped

// If you must build HTML manually, escape untrusted text:
function escapeHtml(s) {
  return String(s)
    .replace(/&amp;/g, '&amp;amp;').replace(/&lt;/g, '&amp;lt;').replace(/&gt;/g, '&amp;gt;')
    .replace(/&quot;/g, '&amp;quot;').replace(/'/g, '&amp;#39;');
}

// Backstop: a CSP header so even an injected script won't run inline
app.use(helmet.contentSecurityPolicy({
  directives: { defaultSrc: [&quot;'self'&quot;], scriptSrc: [&quot;'self'&quot;], objectSrc: [&quot;'none'&quot;] },
}));</code></pre>`,
`<p>Input validation with a schema library (zod/joi) is a single choke point that neutralizes malformed and malicious input before it reaches your logic.</p>`,
`<pre><code class="language-javascript">const { z } = require('zod');

const RegisterSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(200),
  age: z.number().int().min(13).max(120).optional(),
});

app.post('/register', (req, res) =&gt; {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  // parsed.data is now typed, trimmed of unknown keys, and correctly typed
  createUser(parsed.data);
  res.status(201).json({ ok: true });
});</code></pre>`,
`<p>Command injection is avoided by never invoking a shell with user input — pass arguments as an array to <code>execFile</code>/<code>spawn</code>.</p>`,
`<pre><code class="language-javascript">const { execFile } = require('child_process');

// VULNERABLE: exec runs a shell, so input like "; rm -rf /" is interpreted
// exec(\`convert \${req.body.file} out.png\`);

// SAFE: no shell; the filename is a single, un-parsed argument
execFile('convert', [req.body.file, 'out.png'], (err, stdout) =&gt; { /* ... */ });</code></pre>`,

`<h2>Common mistakes &amp; gotchas</h2>`,
`<ul>
<li><strong>String-building queries.</strong> Any query assembled by concatenating input is an injection waiting to happen. Always parameterize (SQL) and type-validate (NoSQL).</li>
<li><strong>Passing raw request objects into Mongo queries.</strong> <code>{ field: req.body.field }</code> where the value is an object enables operator injection (<code>$ne</code>, <code>$gt</code>). Coerce to the expected primitive.</li>
<li><strong>Rendering untrusted data as HTML.</strong> Using <code>innerHTML</code>, disabling template escaping, or dangerouslySetInnerHTML with user content is XSS. Escape, or sanitize with DOMPurify.</li>
<li><strong>Assuming an API is CSRF-immune.</strong> Any cookie-authenticated state-changing endpoint is exposed. Set <code>SameSite</code> and use CSRF tokens for cookie-based flows.</li>
<li><strong>Committing secrets.</strong> API keys in the repo, in the client bundle, or logged in plaintext. Once pushed, treat them as leaked and rotate — deleting the commit is not enough.</li>
<li><strong>Trusting client-side validation.</strong> It's UX only; attackers bypass it with curl. Validate on the server, always.</li>
<li><strong>Ignoring <code>npm audit</code>.</strong> Unpatched transitive dependencies are a top breach vector; a vulnerability you didn't write is still yours to fix.</li>
<li><strong>Verbose error responses.</strong> Leaking stack traces, SQL errors, or library versions helps attackers map your system. Return generic errors; log details server-side.</li>
<li><strong>No rate limiting on auth.</strong> Unlimited login attempts enable brute force and credential stuffing regardless of how well you hash.</li>
</ul>`,

`<h2>Best practices</h2>`,
`<ul>
<li><strong>Parameterize every query and validate every input</strong> at a single choke point (zod/joi), coercing types so operator/HTML/command injection is structurally impossible.</li>
<li><strong>Escape output by context and add a Content-Security-Policy</strong> so XSS is defended twice — at render and at execution.</li>
<li><strong>Default to <code>SameSite</code> cookies plus CSRF tokens</strong> for any cookie-authenticated, state-changing endpoint.</li>
<li><strong>Add <code>helmet</code> and a body-size limit</strong> as a baseline on every app, and tune CSP to your real script sources.</li>
<li><strong>Rate-limit globally and more strictly on auth endpoints</strong>, backed by a shared store when running multiple instances.</li>
<li><strong>Keep secrets in the environment / a secret manager</strong>, never in git or the client bundle; rotate regularly and on any suspected exposure.</li>
<li><strong>Run <code>npm audit</code> and automated dependency scanning</strong>, commit a lockfile, and minimize/vet dependencies.</li>
<li><strong>Apply least privilege everywhere</strong> (DB users, tokens, service accounts), return generic errors, run over HTTPS, and log security events for detection.</li>
</ul>`,

`<h2>⭐ Interview lens</h2>`,
`<blockquote><p><strong>Q: How do you prevent SQL/NoSQL injection in Node?</strong><br/>For SQL, use parameterized queries / prepared statements so the driver transmits the query structure and the values separately — user data can never be parsed as SQL. For MongoDB, the analogous risk is passing a user-supplied <em>object</em> that contains operators like <code>$ne</code>; prevent it by validating and coercing inputs to their expected primitive types (and by using schema validation). The underlying rule is: never let untrusted input become part of the query's structure.</p></blockquote>`,
`<blockquote><p><strong>Q: XSS vs CSRF — what's the difference? (trap)</strong><br/>They're often confused. XSS is injecting <em>script into your page</em> that runs in victims' browsers — an input/output-encoding problem, defended by escaping output and CSP. CSRF is tricking a victim's browser into <em>sending an authenticated request</em> to your app from another site — a problem of cookies being auto-attached, defended by SameSite cookies and CSRF tokens. XSS is about what runs on your page; CSRF is about forged requests to your server. Note that XSS can defeat many CSRF defenses, so fixing XSS is foundational.</p></blockquote>`,
`<blockquote><p><strong>Q: What does helmet actually do, and is it enough on its own?</strong><br/>helmet sets protective HTTP response headers — CSP, HSTS, X-Content-Type-Options nosniff, frame protections, Referrer-Policy — and removes the X-Powered-By fingerprint. It raises your baseline in one line, but it's not sufficient alone: it doesn't parameterize queries, validate input, authorize requests, or rate-limit. It's one layer in defense in depth, and its CSP typically needs tuning to your app.</p></blockquote>`,
`<blockquote><p><strong>Q: Why is a fast password hash relevant to OWASP, and how does rate limiting relate?</strong><br/>Weak hashing (identification/authentication failures) is itself a Top 10 category, and it interacts with rate limiting: strong hashing raises the cost of <em>offline</em> guessing after a DB leak, while rate limiting (and account lockout) raises the cost of <em>online</em> guessing against your live login. You need both — one protects the stolen hashes, the other protects the live endpoint.</p></blockquote>`,
`<blockquote><p><strong>Q: A secret key was committed to a public repo. What do you do?</strong><br/>Treat it as compromised immediately — bots scrape public repos within minutes, so it's likely already harvested. Rotate/revoke the secret now; removing the commit or force-pushing is not enough because it lives in history and clones. Then audit for misuse, move the secret to a secret manager/env var, add it to <code>.gitignore</code>, and consider secret-scanning in CI to prevent recurrence.</p></blockquote>`,
`<blockquote><p><strong>Q: What is defense in depth, concretely, for an Express endpoint?</strong><br/>Layering independent controls so no single failure is fatal: helmet for headers, rate limiting, CORS allow-list and body-size caps, then authentication, then authorization (including ownership checks), then input validation — and the handler still uses parameterized queries and escapes output. Each layer assumes the others might fail, so an attacker has to beat all of them.</p></blockquote>`,

`<h2>Cheat-card</h2>`,
`<ul>
<li><strong>Root cause</strong>: untrusted input crossing a boundary as code — parameterize, escape, validate.</li>
<li><strong>Injection</strong>: SQL → prepared statements; NoSQL → type-coerce (block <code>$ne</code>/<code>$gt</code>); command → <code>execFile</code>/<code>spawn</code>, no shell.</li>
<li><strong>XSS</strong>: escape output by context + CSP; sanitize HTML (DOMPurify); never <code>innerHTML</code> untrusted data.</li>
<li><strong>CSRF</strong>: SameSite cookies + CSRF token; affects cookie auth, not header-token auth.</li>
<li><strong>helmet</strong>: CSP, HSTS, nosniff, frame protection, removes X-Powered-By — baseline, not complete.</li>
<li><strong>Rate limit</strong> globally + strict on login (brute force / credential stuffing).</li>
<li><strong>Secrets</strong>: env/secret manager, never git or client bundle; leaked = rotate now.</li>
<li><strong>Deps</strong>: <code>npm audit</code> + Dependabot/Snyk + lockfile. Validate server-side. Defense in depth.</li>
</ul>`
      ].join('\n')
    }
  ]
};
