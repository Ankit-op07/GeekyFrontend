/**
 * Java Interview Kit — Chapter 13: REST, Security and Testing.
 *
 * ⚠️ Content strings are TEMPLATE LITERALS — never use a backtick inside them,
 * and always escape ${...} as \${...} or it will be interpolated.
 */
module.exports = {
  title: 'REST, Security & Testing',
  slug: 'rest-security-testing',
  order: 12,
  topics: [
    // ────────────────────────────────────────────────────────────────
    {
      title: 'REST API Design in Spring',
      slug: 'rest-api-design',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Almost every Java backend role involves building HTTP APIs, and API design is where inexperience shows fastest — a 200 response containing an error, an endpoint named <code>/getUserById</code>, an entity returned straight from the controller. None of those break immediately, and all of them are expensive later, because a published API is a contract you cannot quietly change.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>REST models your system as <strong>resources</strong> identified by URLs, manipulated with the standard HTTP verbs. The nouns go in the path; the verb says what you are doing.</p>`,
        `<table><thead><tr><th>Verb</th><th>Purpose</th><th>Safe?</th><th>Idempotent?</th></tr></thead><tbody>` +
        `<tr><td><code>GET</code></td><td>Read</td><td>Yes</td><td>Yes</td></tr>` +
        `<tr><td><code>POST</code></td><td>Create, or a non-CRUD action</td><td>No</td><td><strong>No</strong></td></tr>` +
        `<tr><td><code>PUT</code></td><td>Replace the whole resource</td><td>No</td><td>Yes</td></tr>` +
        `<tr><td><code>PATCH</code></td><td>Partial update</td><td>No</td><td>Not necessarily</td></tr>` +
        `<tr><td><code>DELETE</code></td><td>Remove</td><td>No</td><td>Yes</td></tr>` +
        `</tbody></table>`,
        `<p><strong>Idempotent</strong> means repeating the request has the same effect as making it once — which matters practically, because it decides whether a client may safely retry after a timeout. <code>PUT</code> and <code>DELETE</code> can be retried; <code>POST</code> cannot, which is why creation endpoints need an idempotency key if duplicates would be harmful.</p>`,
        `<h2>How it works</h2>`,
        `<p><strong>Status codes carry meaning</strong> and should be used precisely:</p>`,
        `<ul>` +
        `<li><strong>200</strong> OK · <strong>201</strong> Created (with a <code>Location</code> header) · <strong>204</strong> No Content (a successful <code>DELETE</code>)</li>` +
        `<li><strong>400</strong> malformed or invalid · <strong>401</strong> not authenticated · <strong>403</strong> authenticated but not allowed · <strong>404</strong> not found · <strong>409</strong> conflict · <strong>422</strong> semantically invalid</li>` +
        `<li><strong>500</strong> our fault · <strong>503</strong> temporarily unavailable</li>` +
        `</ul>`,
        `<p>The 401-versus-403 distinction is asked constantly: <strong>401 means "I do not know who you are", 403 means "I know who you are and you may not do this"</strong>.</p>`,
        `<h2>Code examples</h2>`,
        `<pre><code class="language-java">@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    @GetMapping("/{id}")
    public OrderResponse get(@PathVariable String id) { … }        // 200

    @PostMapping
    public ResponseEntity&lt;OrderResponse&gt; create(@Valid @RequestBody CreateOrderRequest req) {
        OrderResponse created = service.create(req);
        return ResponseEntity
                .created(URI.create("/api/v1/orders/" + created.id()))   // 201 + Location
                .body(created);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)                          // 204
    public void delete(@PathVariable String id) { service.delete(id); }
}

// ✘ Verbs in the path, and a 200 that actually failed:
//   POST /api/getUserById        → { "status": "error", "code": 404 }
//   Clients cannot use HTTP semantics, caches cannot work, and every
//   consumer has to parse a body to discover whether the call succeeded.</code></pre>`,
        `<p>Never expose entities — the single most consequential rule here:</p>`,
        `<pre><code class="language-java">// ✘ Returning the entity leaks the schema, exposes fields you never meant to
//   publish (password hashes, internal flags), triggers lazy loading during
//   serialisation (Chapter 12's N+1 in the web layer), and welds your API
//   contract to your database design.
@GetMapping("/{id}") public Order get(@PathVariable Long id) { … }

// ✔ A record DTO: explicit, minimal, and free to evolve separately.
public record OrderResponse(String id, String reference, OrderStatus status,
                            BigDecimal total, Instant createdAt) {
    public static OrderResponse from(Order o) {
        return new OrderResponse(o.getId().toString(), o.getReference(),
                                 o.getStatus(), o.getTotal(), o.getCreatedAt());
    }
}</code></pre>`,
        `<p>Pagination and versioning, the two things people leave until it is too late:</p>`,
        `<pre><code class="language-java">// ✔ Always paginate a collection endpoint. An unbounded list works with 50
//   rows in development and takes the service down at 500,000.
@GetMapping
public Page&lt;OrderResponse&gt; list(@PageableDefault(size = 20) Pageable pageable) {
    return service.findAll(pageable).map(OrderResponse::from);
}
// ⚠ Cap the page size server-side — a client can otherwise request
//   ?size=1000000 and defeat the point entirely.

// ✔ Version from day one. Adding /v1 later means rewriting every client;
//   adding /v2 alongside /v1 costs nothing.
@RequestMapping("/api/v1/orders")

// Breaking vs non-breaking: ADDING a field is safe if clients ignore unknown
// fields. REMOVING or renaming one, or changing a type, breaks them — that
// needs a new version, or a deprecation window with both live.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Idempotency in practice</strong> is more than trivia. A client that times out on a <code>POST</code> genuinely does not know whether the order was created. The standard answer is an idempotency key: the client sends a unique header, the server records it with the result, and a repeat of the same key returns the original response instead of creating a second order. Every payment API works this way, and it is a strong thing to raise unprompted.</p>`,
        `<p><strong>The <code>Content-Type</code> and <code>Accept</code> headers</strong> drive Spring's message converters. A request whose type does not match produces 415 Unsupported Media Type, and an <code>Accept</code> the server cannot produce gives 406 — both frequently misdiagnosed as application bugs when they are content negotiation working as designed.</p>`,
        `<p><strong>Consistency beats theoretical purity.</strong> Strict REST — HATEOAS, hypermedia controls — is rarely implemented fully, and that is fine. What actually matters to the teams consuming your API is that resources are nouns, verbs mean what HTTP says they mean, status codes are honest, errors have a stable shape, and collections are paginated. An API that is predictable is more valuable than one that is doctrinaire.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Verbs in URLs.</strong> <code>/getUser</code>, <code>/createOrder</code> — the HTTP method is the verb.</li>` +
        `<li><strong>200 with an error body.</strong> Breaks every client, cache and monitor that reads status codes.</li>` +
        `<li><strong>Returning entities.</strong> Leaks the schema, triggers lazy loading, welds API to database.</li>` +
        `<li><strong>Unpaginated collections.</strong> Fine in development, fatal in production.</li>` +
        `<li><strong>No version in the path.</strong> Adding one later breaks every client at once.</li>` +
        `<li><strong>Confusing 401 and 403.</strong> Unknown identity versus insufficient permission.</li>` +
        `<li><strong>Leaking exception messages.</strong> Stack traces and SQL in responses are an information disclosure.</li>` +
        `<li><strong>Non-idempotent creation with no key.</strong> A retried timeout creates duplicates.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What makes an API RESTful?"</strong><br>A: Resources identified by URLs, manipulated with the standard HTTP methods, with the semantics of those methods respected — <code>GET</code> safe, <code>PUT</code> and <code>DELETE</code> idempotent — and honest status codes. In practice I care most about consistency: nouns in paths, correct verbs, accurate statuses, a stable error shape and paginated collections. Full HATEOAS is rarely worth it; predictability always is.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Which methods are idempotent, and why does it matter?"</strong><br>A: <code>GET</code>, <code>PUT</code> and <code>DELETE</code> are; <code>POST</code> and generally <code>PATCH</code> are not. It matters because it decides whether a client can safely retry after a timeout. Since a create is a <code>POST</code>, a timed-out client cannot know whether it succeeded — which is why creation endpoints that must not duplicate take an idempotency key, storing the result against it so a repeat returns the original response.</p></blockquote>`,
        `<blockquote><p><strong>Q: "401 or 403?"</strong><br>A: 401 Unauthorized means the request is not authenticated — no credentials, or invalid ones — and the client should authenticate and retry. 403 Forbidden means we know who you are and you are not permitted; retrying with the same identity will not help. The names are historically confusing: 401 is really "unauthenticated".</p></blockquote>`,
        `<blockquote><p><strong>Q: "Should you return entities from controllers?"</strong><br>A: No. It exposes your database schema as your public contract, so a column rename becomes a breaking API change; it can leak fields you never intended to publish; and serialisation walks lazy associations, producing N+1 queries or <code>LazyInitializationException</code> in the web layer. A record DTO built explicitly from the entity solves all three.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you version an API?"</strong><br>A: A version segment in the path, from the first release — <code>/api/v1/</code>. Header or media-type versioning is arguably purer but harder to test and debug. The important part is deciding what counts as breaking: adding a field is safe if clients ignore unknown ones, while removing, renaming or retyping is not, and needs a new version running alongside the old with a deprecation window.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How would you handle a client requesting a huge page size?"</strong><br>A: Cap it server-side. Pagination that a client can defeat with <code>?size=1000000</code> is not pagination — it is an easy denial of service and a slow query for the database. I set a default and a hard maximum in configuration and clamp anything above it, returning the capped page rather than an error.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><strong>Nouns in paths, verbs in the method.</strong> No <code>/getUser</code>.</li>` +
        `<li>Idempotent: <code>GET</code> <code>PUT</code> <code>DELETE</code>. <strong>Not <code>POST</code></strong> → idempotency key for retries.</li>` +
        `<li>201 + <code>Location</code> on create · 204 on delete · <strong>401 unauthenticated · 403 forbidden</strong> · 409 conflict.</li>` +
        `<li><strong>Never return entities</strong> — record DTOs. Never leak exception messages.</li>` +
        `<li><strong>Always paginate</strong>, and cap the page size server-side.</li>` +
        `<li><strong>Version from day one</strong> (<code>/api/v1</code>). Adding a field is safe; removing/renaming is not.</li>` +
        `<li>415 = wrong <code>Content-Type</code>, 406 = unsatisfiable <code>Accept</code> — content negotiation, not bugs.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Spring Security and JWT',
      slug: 'spring-security-and-jwt',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Security is where a plausible-sounding answer can be dangerously wrong. "We store the JWT in localStorage" and "we can revoke a token by deleting it" both sound fine and are both mistakes. Interviewers probe here because the consequences are real, and because knowing <em>why</em> stateless tokens are hard to revoke shows you understand the mechanism rather than the library.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Spring Security is a <strong>chain of servlet filters</strong> that runs before the <code>DispatcherServlet</code> (Chapter 11). Each filter has one job — read a token, authenticate, check authorisation — and the request only reaches your controller if it survives.</p>`,
        `<p>Two distinct steps, routinely conflated: <strong>authentication</strong> is "who are you?"; <strong>authorisation</strong> is "may you do this?".</p>`,
        `<p>A <strong>JWT</strong> is three base64url segments — header, payload, signature — joined by dots. The signature proves the token was issued by someone holding the key and has not been altered.</p>`,
        `<pre><code class="language-text">eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhc2hhIiwiZXhwIjoxNzM1Njg5NjAwfQ.k3f9...

// ⚠ The payload is base64, NOT encrypted. Anyone holding the token can read
//   it — paste it into jwt.io and every claim is visible. Never put anything
//   confidential in a JWT: no PII beyond an id, no internal flags, no secrets.</code></pre>`,
        `<h2>How it works</h2>`,
        `<p>A typical stateless flow: the client posts credentials, the server verifies them and returns a signed JWT, and the client sends it as <code>Authorization: Bearer &lt;token&gt;</code> on every subsequent request. A filter validates the signature and expiry and populates the <code>SecurityContext</code>. No session is stored — which is the selling point and the entire problem.</p>`,
        `<p><strong>The revocation problem</strong> is the crux. A stateless token is valid until it expires because the server holds no record of it. Log a user out, disable an account, or discover a stolen token, and the token keeps working. The three answers:</p>`,
        `<ul>` +
        `<li><strong>Short-lived access tokens</strong> (5–15 minutes) plus a long-lived refresh token that <em>is</em> stored server-side and can be revoked. The standard design.</li>` +
        `<li>A <strong>denylist</strong> of revoked token ids in Redis — which reintroduces server state, i.e. gives up the property you chose JWT for.</li>` +
        `<li><strong>Sessions instead</strong>, which are trivially revocable. For a single application with no cross-service needs, a plain session cookie is often the better engineering choice — a genuinely good answer, because it questions the premise.</li>` +
        `</ul>`,
        `<h2>Code examples</h2>`,
        `<pre><code class="language-java">@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain chain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -&gt; csrf.disable())          // ✔ ok for a stateless API
                                                   // ✘ NEVER for cookie sessions
            .sessionManagement(s -&gt; s.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -&gt; auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())     // ✔ deny by default, last
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();        // ✔ adaptive + salted
    }
}
// ⚠ Rule ORDER matters — the first match wins. Putting .anyRequest()
//   .permitAll() before a specific rule silently opens everything.</code></pre>`,
        `<p>Password storage, which is asked on its own:</p>`,
        `<pre><code class="language-java">// ✘ Never: plain text; MD5 or SHA-256 (fast, so brute-forceable); a shared salt.
// ✔ BCrypt, scrypt or Argon2 — deliberately SLOW and per-password salted.
String hash = encoder.encode(rawPassword);   // salt is embedded in the output
boolean ok = encoder.matches(rawPassword, hash);

// The point of an adaptive hash is that it can be made slower as hardware
// improves: BCrypt's strength parameter raises the cost, so a stolen
// database stays expensive to attack years later. A general-purpose hash
// like SHA-256 is fast BY DESIGN, which is exactly wrong here.</code></pre>`,
        `<p>Method-level authorisation, for rules the URL cannot express:</p>`,
        `<pre><code class="language-java">@PreAuthorize("hasRole('ADMIN')")
public void deleteAll() { … }

// Ownership checks — the URL alone cannot express "your own order":
@PreAuthorize("@orderSecurity.isOwner(#orderId, authentication.name)")
public Order get(@PathVariable Long orderId) { … }

// ⚠ These are AOP-based, so Chapter 11's proxy rules apply: a self-invocation
//   bypasses the check entirely. A security check that silently does not run
//   is considerably worse than a missing transaction.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Where to store a token on the client</strong> is the question with the sharpest trade-off. <code>localStorage</code> is readable by any JavaScript on the page, so a single XSS flaw hands over every user's token. An <code>HttpOnly</code>, <code>Secure</code>, <code>SameSite</code> cookie cannot be read by JavaScript at all — but cookies are sent automatically, which reintroduces CSRF. The usual recommendation is the cookie plus CSRF protection, because XSS is both more common and more catastrophic. Saying "localStorage, it is simpler" without naming the XSS exposure is a red flag.</p>`,
        `<p><strong>CSRF protection depends on the auth mechanism</strong>, which is why the blanket advice to disable it is wrong. If credentials travel in a cookie the browser attaches automatically, you need CSRF protection. If they travel in an <code>Authorization</code> header that the browser never adds by itself, CSRF does not apply and disabling it is correct. Disabling it "because the tutorial did" while using cookie sessions is a genuine vulnerability.</p>`,
        `<p><strong>Algorithm confusion</strong> is worth naming: a classic JWT attack sets <code>alg</code> to <code>none</code>, or swaps RS256 for HS256 so the public key is used as an HMAC secret. Any library configured to trust the token's own <code>alg</code> header is vulnerable. Always pin the expected algorithm server-side rather than reading it from the token you are validating.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Putting sensitive data in a JWT.</strong> The payload is base64, not encrypted.</li>` +
        `<li><strong>Long-lived access tokens.</strong> They cannot be revoked — keep them to minutes and use refresh tokens.</li>` +
        `<li><strong>Storing tokens in <code>localStorage</code>.</strong> One XSS flaw exposes every token.</li>` +
        `<li><strong>Disabling CSRF with cookie-based auth.</strong> A real vulnerability, not a formality.</li>` +
        `<li><strong>Fast hashes for passwords.</strong> SHA-256 is fast by design; use BCrypt, scrypt or Argon2.</li>` +
        `<li><strong>Trusting the token's <code>alg</code> header.</strong> Pin the algorithm server-side.</li>` +
        `<li><strong>Permissive rules before specific ones.</strong> First match wins.</li>` +
        `<li><strong>Self-invoking a <code>@PreAuthorize</code> method.</strong> The proxy is bypassed and the check never runs.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "How does Spring Security work?"</strong><br>A: As a chain of servlet filters registered ahead of the <code>DispatcherServlet</code>. Each filter has a narrow job — extract credentials, authenticate, populate the <code>SecurityContext</code>, enforce authorisation — and a request only reaches a controller if it passes. Because it is filter-based, security rejections happen before MVC, which is why <code>@ControllerAdvice</code> never sees a 401.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you revoke a JWT?"</strong><br>A: You largely cannot, and that is the fundamental trade-off — the server keeps no record, so the token is valid until it expires. The standard mitigation is short-lived access tokens, five to fifteen minutes, with a long-lived refresh token stored server-side that can be revoked. A denylist in Redis works but reintroduces the server state you chose JWT to avoid. For a single application with no cross-service requirement, ordinary sessions are often the better choice precisely because revocation is trivial.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Is a JWT encrypted?"</strong><br>A: No — signed, not encrypted. The payload is base64url and anyone holding the token can read every claim. The signature only proves integrity and origin. So a JWT may carry a user id and roles, but never passwords, personal data or internal secrets. JWE exists for encryption, but it is rarely what people mean by "JWT".</p></blockquote>`,
        `<blockquote><p><strong>Q: "Where should the client store the token?"</strong><br>A: Preferably an <code>HttpOnly</code>, <code>Secure</code>, <code>SameSite</code> cookie, which JavaScript cannot read, so an XSS flaw cannot steal it — with CSRF protection, since cookies are sent automatically. <code>localStorage</code> is simpler and means one XSS bug leaks every user's token. The trade is XSS exposure versus CSRF exposure, and XSS is the more damaging of the two.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you store passwords?"</strong><br>A: With an adaptive hash — BCrypt, scrypt or Argon2 — which is deliberately slow and salts each password individually. The salt is embedded in the output, so there is nothing separate to manage. General-purpose hashes like SHA-256 are wrong here because they are fast by design, which is exactly what an attacker with a stolen database wants. Adaptive hashes also have a cost parameter you can raise as hardware improves.</p></blockquote>`,
        `<blockquote><p><strong>Q: "When can you disable CSRF protection?"</strong><br>A: When authentication does not rely on anything the browser attaches automatically — a stateless API using an <code>Authorization</code> header, for instance, since an attacker's site cannot make the browser add that header. If credentials are in a cookie, CSRF protection is required. Disabling it by default because a tutorial did is one of the more common real vulnerabilities in Spring applications.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Security is a <strong>filter chain before MVC</strong> → <code>@ControllerAdvice</code> never sees 401/403.</li>` +
        `<li>Authentication = who; authorisation = may you.</li>` +
        `<li><strong>A JWT is signed, not encrypted</strong> — never put secrets or PII in it.</li>` +
        `<li><strong>Cannot be revoked</strong> → short-lived access + revocable refresh token (or just use sessions).</li>` +
        `<li>Store in an <strong><code>HttpOnly</code>/<code>Secure</code>/<code>SameSite</code> cookie + CSRF</strong>, not <code>localStorage</code>.</li>` +
        `<li>Disable CSRF <strong>only</strong> when credentials are not browser-attached.</li>` +
        `<li>Passwords: <strong>BCrypt / scrypt / Argon2</strong> — never MD5 or SHA.</li>` +
        `<li><strong>Pin the JWT algorithm</strong> server-side — never trust <code>alg</code>.</li>` +
        `<li>Rule order matters (first match wins); <code>anyRequest().authenticated()</code> last.</li>` +
        `<li><code>@PreAuthorize</code> is proxy-based — <strong>self-invocation skips the check</strong>.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Testing: JUnit 5, Mockito and Spring Slices',
      slug: 'testing-junit-mockito',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Testing questions reveal how someone actually works. "Do you write tests?" is answered yes by everyone; "what do you mock, and what do you not?" separates people who have maintained a slow, brittle suite from people who have only added to one. The Spring-specific part — knowing that <code>@SpringBootTest</code> is usually the wrong annotation — is a strong, concrete signal.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Three levels, each with a different cost and a different purpose:</p>`,
        `<ul>` +
        `<li><strong>Unit tests</strong> — one class, collaborators mocked, no Spring at all. Milliseconds.</li>` +
        `<li><strong>Slice tests</strong> — a thin Spring context for one layer: <code>@WebMvcTest</code>, <code>@DataJpaTest</code>. Fast.</li>` +
        `<li><strong>Integration tests</strong> — the whole application with <code>@SpringBootTest</code>, ideally against a real database via Testcontainers. Slow, and the ones that catch what the others cannot.</li>` +
        `</ul>`,
        `<p>The pyramid still holds: many unit tests, fewer slices, few end-to-end. The failure mode is inverting it — a suite of <code>@SpringBootTest</code> classes that takes fifteen minutes and gets skipped.</p>`,
        `<h2>Code examples</h2>`,
        `<pre><code class="language-java">// ✔ Unit test — no Spring, milliseconds. Possible ONLY because of
//   constructor injection (Chapter 11).
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock OrderRepository repository;
    @Mock PaymentGateway gateway;
    @InjectMocks OrderService service;

    @Test
    void rejectsOrderWhenPaymentDeclined() {
        when(gateway.charge(any())).thenReturn(Result.declined("insufficient"));

        assertThatThrownBy(() -&gt; service.place(anOrder()))
                .isInstanceOf(PaymentDeclinedException.class)
                .hasMessageContaining("insufficient");

        verify(repository, never()).save(any());     // ✔ assert what did NOT happen
    }
}</code></pre>`,
        `<p>Slice tests, which are what most people should be writing more of:</p>`,
        `<pre><code class="language-java">// ✔ Web slice — controllers, converters and validation only. No database,
//   no service beans; the service is mocked.
@WebMvcTest(OrderController.class)
class OrderControllerTest {

    @Autowired MockMvc mvc;
    @MockitoBean OrderService service;      // @MockBean before Boot 3.4

    @Test
    void returns404WhenMissing() throws Exception {
        when(service.find("x")).thenReturn(Optional.empty());

        mvc.perform(get("/api/v1/orders/x"))
           .andExpect(status().isNotFound())
           .andExpect(jsonPath("$.code").value("ORDER_NOT_FOUND"));
    }
}

// ✔ Persistence slice — JPA and an in-memory (or Testcontainers) database
//   only. Each test is rolled back automatically.
@DataJpaTest
class OrderRepositoryTest {

    @Autowired OrderRepository repository;
    @Autowired TestEntityManager em;

    @Test
    void findsByReference() {
        em.persistAndFlush(anOrder("REF-1"));
        assertThat(repository.findByReference("REF-1")).isPresent();
    }
}</code></pre>`,
        `<p>Integration tests against a real database — the modern default:</p>`,
        `<pre><code class="language-java">@SpringBootTest(webEnvironment = RANDOM_PORT)
@Testcontainers
class OrderIntegrationTest {

    @Container
    static PostgreSQLContainer&lt;?&gt; db = new PostgreSQLContainer&lt;&gt;("postgres:16");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", db::getJdbcUrl);
        registry.add("spring.datasource.username", db::getUsername);
        registry.add("spring.datasource.password", db::getPassword);
    }

    @Autowired TestRestTemplate rest;

    @Test
    void createsAnOrder() { … }
}
// Why Testcontainers rather than H2: H2 is a DIFFERENT database. Its SQL
// dialect, constraint behaviour, isolation semantics and type handling all
// differ from Postgres, so tests pass against H2 and fail in production —
// or, worse, pass in both while hiding a real dialect issue.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Spring caches application contexts between test classes</strong>, keyed by configuration. Two classes with identical configuration share one context and the second starts instantly. Change anything — a different <code>@MockitoBean</code>, an extra property, a different set of active profiles — and Spring builds a <em>new</em> context. This is why a suite gets slow: not the number of tests, but the number of distinct configurations. Keeping test configuration uniform is the single biggest lever on suite runtime.</p>`,
        `<p><strong>What to mock:</strong> things that are slow, non-deterministic or outside your control — HTTP clients, clocks, message brokers, third-party services. <strong>What not to mock:</strong> value objects, the classes you are testing, and — the common mistake — the database. Mocking a repository to return a fabricated entity tests your mocks, not your query, and every mapping and constraint bug slips straight through.</p>`,
        `<p><strong>Assert behaviour, not implementation.</strong> A test that verifies six specific method calls in order breaks whenever anyone refactors, even when the behaviour is unchanged — so it costs more than it protects. Assert the outcome: what was returned, what was persisted, what was <em>not</em> called when it should not have been.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong><code>@SpringBootTest</code> for everything.</strong> Loads the whole application for a test of one class.</li>` +
        `<li><strong>Mocking the database.</strong> Tests the mock, not the query — use <code>@DataJpaTest</code> or Testcontainers.</li>` +
        `<li><strong>H2 standing in for Postgres.</strong> A different database with different behaviour.</li>` +
        `<li><strong>Over-verifying.</strong> Asserting call sequences makes refactoring break tests that should not.</li>` +
        `<li><strong>Tests depending on order or shared state.</strong> Each must run alone and in any order.</li>` +
        `<li><strong>Fragmenting test configuration.</strong> Every distinct configuration is another context to build.</li>` +
        `<li><strong>Field injection in production code.</strong> Forces a Spring context just to construct the class under test.</li>` +
        `<li><strong><code>Thread.sleep</code> in async tests.</strong> Slow and flaky — use Awaitility.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "How do you structure tests in a Spring application?"</strong><br>A: Mostly plain unit tests with Mockito and no Spring context — possible because constructor injection lets me build the class directly. Then slice tests for layer-specific behaviour: <code>@WebMvcTest</code> for controllers, serialisation and validation, <code>@DataJpaTest</code> for queries. Then a small number of <code>@SpringBootTest</code> integration tests against a real database via Testcontainers, covering the critical paths end to end.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What do you mock and what do you not?"</strong><br>A: I mock what is slow, non-deterministic or outside my control — HTTP clients, clocks, brokers. I do not mock value objects, the class under test, or the database. Mocking a repository to return a fabricated entity means the test proves the mock behaves as configured; every mapping error, constraint violation and query mistake passes straight through. Those belong in a <code>@DataJpaTest</code> or an integration test.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why is our test suite slow?"</strong><br>A: Almost always too many distinct Spring contexts. Spring caches contexts across test classes keyed by configuration, so identical configurations are free — but any difference, an extra mock bean or a different property, forces a new one. Consolidating test configuration and replacing <code>@SpringBootTest</code> with slices where possible usually cuts runtime dramatically.</p></blockquote>`,
        `<blockquote><p><strong>Q: "H2 or Testcontainers?"</strong><br>A: Testcontainers, for anything touching real SQL. H2 is a different database — dialect, constraint enforcement, type coercion and isolation behaviour all differ — so tests can pass against H2 and fail against Postgres, which is the worst possible outcome for a test suite. Testcontainers runs the actual database in Docker, so the test exercises what production runs.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you test asynchronous code?"</strong><br>A: Never with <code>Thread.sleep</code> — that is slow when it passes and flaky when it fails. Awaitility polls a condition with a timeout, which is both faster and deterministic. Better still, inject the executor so the test can supply a same-thread one, making the async path synchronous and removing the timing question entirely.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What makes a good test?"</strong><br>A: It asserts behaviour rather than implementation, so refactoring does not break it; it is independent of other tests and of order; it fails with a message that tells you what is wrong; and it is fast enough that nobody is tempted to skip it. Verifying exact call sequences fails the first criterion — those tests break constantly while protecting almost nothing.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><strong>Unit (no Spring) → slice (<code>@WebMvcTest</code>, <code>@DataJpaTest</code>) → integration (<code>@SpringBootTest</code>)</strong>.</li>` +
        `<li>Constructor injection is what makes plain unit tests possible.</li>` +
        `<li>Mock: slow · non-deterministic · external. <strong>Never mock the database.</strong></li>` +
        `<li><strong>Testcontainers over H2</strong> — H2 is a different database.</li>` +
        `<li>Spring <strong>caches contexts by configuration</strong> → fewer distinct configs = faster suite.</li>` +
        `<li><code>@MockitoBean</code> (Boot 3.4+; was <code>@MockBean</code>) in slice tests.</li>` +
        `<li>Assert <strong>behaviour, not call sequences</strong>. <code>verify(x, never())</code> is often the useful one.</li>` +
        `<li>Async: <strong>Awaitility</strong> or an injectable executor — never <code>Thread.sleep</code>.</li>` +
        `</ul>`,
      ].join('\n'),
    },
  ],
};
