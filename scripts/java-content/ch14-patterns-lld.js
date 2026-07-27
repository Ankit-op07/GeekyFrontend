/**
 * Java Interview Kit — Chapter 14: Design Patterns, SOLID and Java LLD.
 *
 * The closing chapter: design judgement rather than language mechanics.
 *
 * ⚠️ Content strings are TEMPLATE LITERALS — never use a backtick inside them,
 * and always escape ${...} as \${...} or it will be interpolated.
 */
module.exports = {
  title: 'Design Patterns & Java LLD',
  slug: 'patterns-lld',
  order: 13,
  topics: [
    // ────────────────────────────────────────────────────────────────
    {
      title: 'SOLID in Practice',
      slug: 'solid-in-java',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>SOLID is the most-recited and least-understood acronym in software. Anyone can expand the letters; what interviewers listen for is whether you can point at code and say <em>which</em> principle it breaks and what the concrete cost is. Recited definitions are worth nothing; "this class has two reasons to change, and that is why the deployment broke when we altered the email template" is worth a great deal.</p>`,
        `<h2>The concept, simply</h2>`,
        `<table><thead><tr><th></th><th>Principle</th><th>The practical test</th></tr></thead><tbody>` +
        `<tr><td><strong>S</strong></td><td>Single responsibility</td><td>How many different reasons would make you edit this class?</td></tr>` +
        `<tr><td><strong>O</strong></td><td>Open/closed</td><td>Can you add a case without editing existing code?</td></tr>` +
        `<tr><td><strong>L</strong></td><td>Liskov substitution</td><td>Can a subclass replace its parent without surprising callers?</td></tr>` +
        `<tr><td><strong>I</strong></td><td>Interface segregation</td><td>Are implementers forced to stub methods they do not need?</td></tr>` +
        `<tr><td><strong>D</strong></td><td>Dependency inversion</td><td>Does the policy depend on an abstraction or on a detail?</td></tr>` +
        `</tbody></table>`,
        `<h2>How it works</h2>`,
        `<p><strong>Single responsibility</strong> is not "a class does one thing" — that is too vague to apply. It is "a class has one <em>reason to change</em>", one stakeholder. A class that formats a report and also saves it changes when finance wants a new column <em>and</em> when the platform team changes the database.</p>`,
        `<pre><code class="language-java">// ✘ Three reasons to change: business rules, persistence, and messaging.
class OrderService {
    void place(Order o) {
        if (o.total().signum() &lt;= 0) throw new IllegalArgumentException();
        jdbc.update("INSERT INTO orders …");
        mailer.send(o.customerEmail(), "Order confirmed", buildHtml(o));
    }
}

// ✔ Each collaborator changes for its own reason; the service coordinates.
class OrderService {
    private final OrderRepository repository;
    private final OrderNotifier notifier;
    void place(Order o) { o.validate(); repository.save(o); notifier.confirm(o); }
}</code></pre>`,
        `<p><strong>Open/closed</strong> in modern Java usually means replacing a growing <code>switch</code> over a type code with polymorphism — or, since Java 21, with a sealed hierarchy where the compiler <em>forces</em> you to handle each case (Chapter 10).</p>`,
        `<pre><code class="language-java">// ✘ Every new payment method edits this method — and every other switch
//   over the same enum elsewhere, which you have to go and find.
BigDecimal fee(Payment p) {
    switch (p.type()) {
        case CARD: return p.amount().multiply(new BigDecimal("0.029"));
        case UPI:  return BigDecimal.ZERO;
        default:   throw new IllegalArgumentException();   // ✘ runtime failure
    }
}

// ✔ Polymorphic: a new method is a new class, and nothing existing changes.
sealed interface Payment permits Card, Upi, BankTransfer {
    BigDecimal fee();
}
// ✔ Better still, a sealed hierarchy with an exhaustive switch — adding a
//   case becomes a COMPILE error in every switch that does not handle it.
//   Extensible AND checked, which classic polymorphism cannot give you.</code></pre>`,
        `<p><strong>Liskov</strong> is the one with real teeth, and Java's own library breaks it:</p>`,
        `<pre><code class="language-java">List&lt;String&gt; list = Arrays.asList("a", "b");
list.add("c");        // ✘ UnsupportedOperationException at run time

// It IS a List by type and does not honour List's contract. Any method
// written against List can be handed this and fail. Chapter 2's override
// rules — covariant returns, no narrowing of access, no broader checked
// exceptions — are the language enforcing Liskov where a compiler can.
// Weakening a postcondition at run time is the part it cannot catch.</code></pre>`,
        `<p><strong>Interface segregation</strong> and <strong>dependency inversion</strong> are the two Spring makes almost automatic — a fat interface hurts the moment you try to mock it, and constructor injection against an interface <em>is</em> dependency inversion.</p>`,
        `<pre><code class="language-java">// ✘ Fat interface: an in-memory implementation must stub half of it.
interface Repository { void save(); void delete(); void export(); void backup(); }

// ✔ Segregated: implementers take only what they can honour.
interface OrderReader { Optional&lt;Order&gt; findById(String id); }
interface OrderWriter { void save(Order o); }

// ✔ Dependency inversion: the policy depends on an abstraction, and so does
//   the implementation — both point at the middle rather than one at the other.
class OrderService {
    private final OrderRepository repository;      // interface
    OrderService(OrderRepository repository) { this.repository = repository; }
}</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>SOLID is a set of heuristics, not laws</strong> — and saying so is a better answer than reciting them, because over-application is a real and common failure. An interface for every class with one implementation, a factory for every construction, four layers of indirection to change a string: that is not clean, it is <em>speculative generality</em>, and it trades real readability for flexibility nobody asked for. The time to introduce an abstraction is when you have a second case or a genuine testing seam — not in anticipation of one.</p>`,
        `<p><strong>Modern Java changes how you satisfy them.</strong> Sealed interfaces plus exhaustive switches give open/closed <em>with</em> compile-time checking. Records give immutable value objects with no boilerplate, removing much of the state that single-responsibility violations accumulate around. Constructor injection makes dependency inversion the path of least resistance rather than an extra effort.</p>`,
        `<p><strong>The honest framing:</strong> every principle is a different angle on one question — when this requirement changes, how much has to change with it? A design that scores well on the acronym but makes the common change hard has missed the point.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Reciting definitions without examples.</strong> The example is the answer.</li>` +
        `<li><strong>Reading SRP as "one method".</strong> It is one reason to change.</li>` +
        `<li><strong>An interface per class by reflex.</strong> One implementation and no test seam is pure indirection.</li>` +
        `<li><strong>Inheriting to reuse code.</strong> Inheritance is an "is-a" claim; use composition (Chapter 2).</li>` +
        `<li><strong>A <code>switch</code> that grows forever.</strong> Polymorphism or a sealed hierarchy.</li>` +
        `<li><strong>Throwing <code>UnsupportedOperationException</code> from an override.</strong> A Liskov violation by definition.</li>` +
        `<li><strong>Applying all five up front.</strong> Speculative generality has its own cost.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Explain SOLID with real examples."</strong><br>A: Single responsibility — one reason to change; a service that also builds SQL and formats email changes for three different stakeholders. Open/closed — a growing <code>switch</code> over a type code means every new case edits existing code, so polymorphism or a sealed hierarchy is better. Liskov — a subclass must honour the parent's contract, and <code>Arrays.asList</code> returning a <code>List</code> that throws on <code>add</code> breaks it. Interface segregation — fat interfaces force implementers to stub methods. Dependency inversion — depend on an interface, which constructor injection makes natural.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Give an example of a Liskov violation."</strong><br>A: The JDK has a good one: <code>Arrays.asList</code> returns something typed <code>List</code> whose <code>add</code> throws <code>UnsupportedOperationException</code>, so any method written against <code>List</code> can be handed it and fail. The teaching example is <code>Square extends Rectangle</code> — setting the width changes the height, so code reasoning about a rectangle gets a surprise. Java enforces what it can through the override rules, but it cannot stop you weakening a postcondition.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Is SOLID always right?"</strong><br>A: They are heuristics for making change cheap, not laws. Over-applying them produces speculative generality — an interface for every class, a factory for every constructor, indirection that makes code harder to read for flexibility nobody needed. I add an abstraction when there is a second implementation or a real testing seam, not before.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How does modern Java change this?"</strong><br>A: Sealed interfaces with exhaustive switches give open/closed plus compile-time checking, which plain polymorphism cannot — adding a case breaks the build in every switch that ignores it. Records remove the boilerplate around immutable value objects, which is where a lot of single-responsibility drift begins. And constructor injection makes dependency inversion the easiest thing to write rather than an extra step.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><strong>S</strong> — one <em>reason to change</em>, not one method.</li>` +
        `<li><strong>O</strong> — add a case without editing existing code → polymorphism or <strong>sealed + exhaustive switch</strong>.</li>` +
        `<li><strong>L</strong> — honour the contract; <code>Arrays.asList().add()</code> is the JDK's own violation.</li>` +
        `<li><strong>I</strong> — no forced stub methods; small interfaces.</li>` +
        `<li><strong>D</strong> — depend on abstractions; constructor injection gives it for free.</li>` +
        `<li>Java's <strong>override rules enforce Liskov</strong> where a compiler can.</li>` +
        `<li>They are <strong>heuristics</strong> — over-application is speculative generality.</li>` +
        `<li>The question behind all five: <strong>when this changes, how much changes with it?</strong></li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Design Patterns That Still Earn Their Keep',
      slug: 'design-patterns',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Pattern questions are usually asked badly ("name the 23 patterns") and answered worse (a memorised UML diagram). What demonstrates seniority is knowing which patterns you use weekly, which the language has made obsolete, and where each already appears in the JDK — because that shows you recognise patterns rather than recite them.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A pattern is a named solution to a recurring design problem. Its real value is <strong>vocabulary</strong>: saying "make it a strategy" conveys a whole design in three words.</p>`,
        `<p>The ones worth genuinely knowing, with where you have already met them:</p>`,
        `<table><thead><tr><th>Pattern</th><th>Solves</th><th>In the JDK / Spring</th></tr></thead><tbody>` +
        `<tr><td><strong>Builder</strong></td><td>Many constructor parameters</td><td><code>StringBuilder</code>, <code>HttpRequest.newBuilder()</code></td></tr>` +
        `<tr><td><strong>Strategy</strong></td><td>Swappable algorithms</td><td><code>Comparator</code>, any injected interface</td></tr>` +
        `<tr><td><strong>Factory</strong></td><td>Creation logic in one place</td><td><code>List.of</code>, <code>Integer.valueOf</code></td></tr>` +
        `<tr><td><strong>Observer</strong></td><td>Publish/subscribe</td><td>Spring events, listeners</td></tr>` +
        `<tr><td><strong>Decorator</strong></td><td>Add behaviour without subclassing</td><td><code>BufferedReader</code>, Spring AOP</td></tr>` +
        `<tr><td><strong>Template method</strong></td><td>Fixed skeleton, varying steps</td><td><code>AbstractList</code>, <code>JdbcTemplate</code></td></tr>` +
        `<tr><td><strong>Adapter</strong></td><td>Incompatible interfaces</td><td><code>Arrays.asList</code></td></tr>` +
        `<tr><td><strong>Singleton</strong></td><td>One instance</td><td>Spring beans (a different mechanism)</td></tr>` +
        `</tbody></table>`,
        `<h2>Code examples</h2>`,
        `<p><strong>Builder</strong> — the answer to telescoping constructors from Chapter 2:</p>`,
        `<pre><code class="language-java">// ✘ Which boolean is which? And adding a field breaks every caller.
new Order(id, customer, items, true, false, null, 3);

// ✔ Named, validated once, immutable when built.
Order order = Order.builder()
        .customer(customer)
        .items(items)
        .expedited(true)
        .retries(3)
        .build();                    // validation belongs here

// In modern Java, check first whether a RECORD is enough — for a plain data
// carrier with a handful of components it usually is, and a builder is
// ceremony. Reach for one when there are many optional fields or real
// construction-time validation.</code></pre>`,
        `<p><strong>Strategy</strong> — the pattern you use most, usually without naming it:</p>`,
        `<pre><code class="language-java">public interface PricingStrategy { BigDecimal price(Order o); }

@Component class StandardPricing implements PricingStrategy { … }
@Component class BulkPricing implements PricingStrategy { … }

// Spring injects every implementation, and the "pattern" disappears into
// ordinary dependency injection (Chapter 11).
@Service
public class Checkout {
    private final Map&lt;String, PricingStrategy&gt; strategies;   // keyed by bean name
    public Checkout(Map&lt;String, PricingStrategy&gt; strategies) { … }
}
// Any lambda passed as a Comparator, Predicate or Function is also a
// strategy. Java 8 made the pattern so cheap it stopped needing a name.</code></pre>`,
        `<p><strong>Singleton</strong> — the one to be careful about:</p>`,
        `<pre><code class="language-java">// ✔ The best Java singleton is an enum: serialisation-safe, reflection-safe,
//   thread-safe via the class-initialisation guarantee (Chapter 2).
public enum Config {
    INSTANCE;
    public String host() { return host; }
}

// ✔ Or the holder idiom — lazy AND thread-safe with no synchronisation.
public class Config {
    private Config() { }
    private static class Holder { static final Config INSTANCE = new Config(); }
    public static Config getInstance() { return Holder.INSTANCE; }
}

// ⚠ In a Spring application you write neither — a singleton-scoped bean
//   gives one instance per context with none of the drawbacks. Classic
//   singletons are global mutable state: you cannot substitute one in a
//   test, they hide dependencies, and they are shared across all threads.</code></pre>`,
        `<p><strong>Patterns modern Java has retired</strong> — a strong point to make unprompted:</p>`,
        `<pre><code class="language-java">// ✘ Visitor — existed because Java could not switch on type safely. Java 21's
//   sealed interfaces plus pattern-matching switch do the same job with none
//   of the accept()/visit() double dispatch (Chapter 10).

// ✘ Command as a class — a lambda IS a command object:
//   executor.submit(() -&gt; doWork());

// ✘ Hand-written Iterator — for-each and Streams cover it.

// ✘ Strategy as a class hierarchy — often just a Function or Predicate now.

// The catalogue was written for Java 1.1. Several entries are workarounds
// for language limitations that no longer exist, and naming which ones is a
// far better answer than listing all 23.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Where patterns hide in frameworks</strong> is the most useful thing to be able to point at. Spring's <code>JdbcTemplate</code> is a template method: it owns connection handling, exception translation and cleanup, and calls your callback for the varying part. Spring AOP is decorator plus proxy — precisely the mechanism behind <code>@Transactional</code> in Chapter 11. <code>DispatcherServlet</code> is front controller. Recognising these makes frameworks legible instead of magical.</p>`,
        `<p><strong>The failure mode is pattern-driven design.</strong> Choosing a pattern first and shaping the problem to fit produces an <code>AbstractSingletonProxyFactoryBean</code> where a method would do. Patterns are a vocabulary for describing solutions you arrived at, not a menu to order from. If you cannot state the specific problem the pattern solves in your code, you do not need it yet.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Memorising all 23.</strong> Depth on the eight you use beats a list.</li>` +
        `<li><strong>Pattern-driven design.</strong> The problem chooses the pattern, never the reverse.</li>` +
        `<li><strong>Classic singletons in Spring.</strong> Global mutable state — use a singleton bean.</li>` +
        `<li><strong>A builder for a three-field class.</strong> A record is enough.</li>` +
        `<li><strong>Writing visitor on Java 21.</strong> Sealed types plus pattern matching replace it.</li>` +
        `<li><strong>A strategy class where a lambda would do.</strong> <code>Comparator</code> and <code>Function</code> are strategies.</li>` +
        `<li><strong>Not seeing them in the JDK.</strong> The best examples are already on your classpath.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Which design patterns do you actually use?"</strong><br>A: Builder for objects with many optional fields or real construction-time validation; strategy constantly, though usually as an injected interface or a lambda rather than anything I would call a pattern; factory methods for controlled creation; template method whenever I use <code>JdbcTemplate</code>; and decorator, which is what Spring AOP is. I would rather discuss those in depth than list the catalogue.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you implement a singleton in Java?"</strong><br>A: An enum with a single constant is safest — the JVM guarantees one instance, and it is immune to the reflection and serialisation attacks that break the classic form. The initialisation-on-demand holder idiom is the lazy equivalent, thread-safe through the class-initialisation guarantee with no synchronisation. In a Spring application I would use a singleton-scoped bean instead: same single instance, and it stays injectable and testable.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why is the singleton pattern criticised?"</strong><br>A: It is global mutable state with a nicer name. It cannot be substituted in a test, so anything depending on it becomes hard to test; it hides dependencies, because a class using it does not declare that in its constructor; and one instance shared across all threads is a frequent concurrency hazard. Dependency injection gives the single-instance property without any of that.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Which patterns has modern Java made unnecessary?"</strong><br>A: Visitor largely — it existed because Java could not switch on type safely, and Java 21's sealed interfaces with pattern-matching switch do the job with no double dispatch. Command as a class, since a lambda is a command object. Hand-written iterators, replaced by for-each and streams. And strategy as a class hierarchy, which is often just a <code>Function</code>. The catalogue was written for Java 1.1, and several entries are workarounds for limitations that are gone.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Where do you see patterns in Spring?"</strong><br>A: <code>JdbcTemplate</code> is template method — the framework owns connection handling and cleanup and calls your callback for the varying part. AOP proxies are decorator, which is exactly how <code>@Transactional</code> works. <code>DispatcherServlet</code> is front controller, and the <code>ApplicationContext</code> is a factory. Recognising them is what makes the framework readable rather than magical.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Patterns are <strong>vocabulary</strong>. Depth on eight beats a list of 23.</li>` +
        `<li>Builder · Strategy · Factory · Observer · Decorator · Template method · Adapter.</li>` +
        `<li>Singleton: <strong>enum</strong> (safest) or <strong>holder idiom</strong> — but in Spring, use a bean.</li>` +
        `<li>Singletons are <strong>global mutable state</strong>: untestable, hidden dependencies, thread-shared.</li>` +
        `<li><strong>Retired by modern Java</strong>: visitor (sealed + pattern switch), command (lambda), iterator (for-each), strategy-as-hierarchy (<code>Function</code>).</li>` +
        `<li>In the JDK: <code>StringBuilder</code>, <code>Comparator</code>, <code>List.of</code>, <code>BufferedReader</code>, <code>Arrays.asList</code>.</li>` +
        `<li>In Spring: <code>JdbcTemplate</code> (template method), AOP (decorator/proxy), <code>DispatcherServlet</code> (front controller).</li>` +
        `<li><strong>The problem picks the pattern</strong> — never the reverse.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Low-Level Design: Working Through a Problem',
      slug: 'lld-walkthrough',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>The LLD round asks you to design something concrete — a parking lot, a rate limiter, a ride matcher — in 45 minutes, out loud. It is not testing whether you know the "right" answer; it is testing whether you can decompose a vague problem, justify trade-offs, and produce something a team could build. Candidates fail it by jumping to classes before agreeing what the system does.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A repeatable structure that works for almost any prompt:</p>`,
        `<ol>` +
        `<li><strong>Clarify and scope</strong> (5 min) — ask questions, state what is in and out. Nobody can design "a parking lot" without knowing whether it handles payments.</li>` +
        `<li><strong>Identify entities and behaviours</strong> (5 min) — the nouns, and what they do.</li>` +
        `<li><strong>Define the seams</strong> (10 min) — the interfaces where behaviour will vary.</li>` +
        `<li><strong>Write the core classes</strong> (15 min) — real Java, not boxes and arrows.</li>` +
        `<li><strong>Discuss trade-offs</strong> (10 min) — concurrency, extension, what changes at scale.</li>` +
        `</ol>`,
        `<p>Step 1 is the one people skip and the one marked hardest. Designing the wrong system elegantly scores worse than designing the right one plainly.</p>`,
        `<h2>Code examples</h2>`,
        `<p>A worked parking lot — the canonical prompt:</p>`,
        `<pre><code class="language-java">// 1. SCOPE — say this out loud before writing anything:
//    In:  multiple levels, vehicle sizes, park/unpark, find a free spot,
//         hourly pricing. Out: payments, reservations, plate recognition.
//    Assume one JVM, concurrent access from several entry gates.

// 2. ENTITIES — records for the values (Chapter 10)
enum VehicleSize { MOTORCYCLE, CAR, VAN }
record Vehicle(String plate, VehicleSize size) { }
record Ticket(String id, String plate, String spotId, Instant entryTime) { }

// 3. SEAMS — the two things most likely to change
interface SpotAllocationStrategy { Optional&lt;Spot&gt; allocate(Deque&lt;Spot&gt; free, Vehicle v); }
interface PricingStrategy { BigDecimal price(Duration parked, VehicleSize size); }

// 4. CORE
public class ParkingLot {
    private final Map&lt;VehicleSize, Deque&lt;Spot&gt;&gt; freeBySize;   // O(1) allocation
    private final Map&lt;String, Ticket&gt; active = new ConcurrentHashMap&lt;&gt;();
    private final SpotAllocationStrategy allocation;
    private final PricingStrategy pricing;
    private final Lock lock = new ReentrantLock();

    public Ticket park(Vehicle vehicle) {
        lock.lock();                       // ✔ allocation must be atomic — two
        try {                              //   gates must not get the same spot
            Spot spot = allocation.allocate(freeBySize.get(vehicle.size()), vehicle)
                    .orElseThrow(() -&gt; new LotFullException(vehicle.size()));
            spot.occupy(vehicle);
            Ticket t = new Ticket(UUID.randomUUID().toString(), vehicle.plate(),
                                  spot.id(), Instant.now());
            active.put(t.id(), t);
            return t;
        } finally { lock.unlock(); }       // ✔ Chapter 8's rule
    }

    public BigDecimal unpark(String ticketId) {
        Ticket t = active.remove(ticketId);
        if (t == null) throw new UnknownTicketException(ticketId);
        release(t.spotId());
        return pricing.price(Duration.between(t.entryTime(), Instant.now()), sizeOf(t));
    }
}</code></pre>`,
        `<p>Then say the trade-offs out loud — this is where the marks actually are:</p>`,
        `<pre><code class="language-text">"A Deque of free spots per size makes allocation O(1) instead of scanning
 every spot. I hold one lock across allocation because two gates must never
 be handed the same spot; at higher scale I would lock per level, or use a
 compare-and-set on each spot to remove the global lock entirely.

 Allocation and pricing are interfaces because those are the two things a
 customer will want to change — nearest-to-lift versus first-available,
 flat rate versus tiered. Everything else is stable, so I have not
 abstracted it.

 Across multiple JVMs the in-memory maps stop working. Spot state moves to
 the database and allocation becomes a conditional UPDATE, which gives
 atomicity without a distributed lock."</code></pre>`,
        `<p>A second, smaller worked example — a rate limiter, which comes up constantly:</p>`,
        `<pre><code class="language-java">// Token bucket: N tokens, refilled at a fixed rate, one consumed per request.
// Chosen over a fixed window because a fixed window allows a burst of 2N
// across a boundary — the classic follow-up question.
public class TokenBucket {
    private final long capacity;
    private final double refillPerSecond;
    private double tokens;
    private long lastRefillNanos;

    public synchronized boolean tryConsume() {
        refill();
        if (tokens &lt; 1) return false;
        tokens -= 1;
        return true;
    }

    private void refill() {                       // lazy refill — no timer thread
        long now = System.nanoTime();
        double elapsed = (now - lastRefillNanos) / 1_000_000_000.0;
        tokens = Math.min(capacity, tokens + elapsed * refillPerSecond);
        lastRefillNanos = now;
    }
}
// Trade-offs to state: per-user buckets need a ConcurrentHashMap with
// eviction or it leaks (Chapter 9); distributed rate limiting needs Redis
// with an atomic script, because per-instance buckets multiply the limit by
// the number of instances.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>What is actually being assessed</strong> is rarely the final class diagram. It is whether you asked clarifying questions, whether your abstractions sit where change is likely, whether you noticed the concurrency, and whether you could explain a decision you did <em>not</em> take. Interviewers routinely say the strongest signal is a candidate saying "I would not abstract that yet, because I have only one case" — it demonstrates judgement rather than pattern application.</p>`,
        `<p><strong>Common prompts and the concept each is testing:</strong> parking lot (allocation and concurrency), elevator (state machines and scheduling), rate limiter (algorithms and distribution), cache with eviction (data structures — Chapter 4's <code>LinkedHashMap</code> LRU), ride matching (spatial indexing and concurrency), splitwise or a vending machine (state and money handling — <code>BigDecimal</code>, never <code>double</code>).</p>`,
        `<p><strong>The habits that carry across all of them:</strong> put money in <code>BigDecimal</code> or minor units, never <code>double</code> (Chapter 1); use immutable records for values and classes for things with a lifecycle; make illegal states unrepresentable rather than validating them everywhere; and say what you would change at ten times the scale, because that question is coming.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Coding before scoping.</strong> The first five minutes are questions, not classes.</li>` +
        `<li><strong>Abstracting everything.</strong> Two well-chosen interfaces beat eight speculative ones.</li>` +
        `<li><strong>Ignoring concurrency.</strong> Almost every prompt has concurrent actors; say how you handle it.</li>` +
        `<li><strong><code>double</code> for money.</strong> An immediate red flag (Chapter 1).</li>` +
        `<li><strong>Designing in silence.</strong> The reasoning is the answer; the diagram is a by-product.</li>` +
        `<li><strong>No trade-off discussion.</strong> Every choice excludes another — name it.</li>` +
        `<li><strong>Unbounded in-memory maps.</strong> A per-user map with no eviction is a leak (Chapter 9).</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Design a parking lot."</strong><br>A: I would scope first — multiple levels and vehicle sizes, park and unpark, hourly pricing; payments and reservations out. Entities: <code>Vehicle</code> and <code>Ticket</code> as records, <code>Spot</code> as a class because it has state. The two seams I would abstract are allocation and pricing, since those are what a customer changes. I would keep free spots in a deque per size for O(1) allocation, hold a lock across allocation so two gates cannot get the same spot, and note that at scale I would move that to per-level locking or a compare-and-set on each spot.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you decide what to abstract?"</strong><br>A: By asking what is likely to change. In a parking lot, allocation strategy and pricing will change; the fact that a ticket has an entry time will not. I would rather have two well-chosen interfaces than eight speculative ones, and I will say out loud when I am deliberately <em>not</em> abstracting something because there is only one case today.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Design a rate limiter."</strong><br>A: Token bucket — a capacity of N tokens refilled at a fixed rate, one consumed per request — refilled lazily on each call so there is no timer thread. I prefer it to a fixed window because a fixed window lets a client send 2N requests across a boundary. Per-user buckets go in a <code>ConcurrentHashMap</code> with eviction, since an unbounded one is a memory leak. For multiple instances, per-instance buckets multiply the limit by the instance count, so it moves to Redis with an atomic script.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What are they really assessing?"</strong><br>A: Not the class diagram. Whether I clarified the problem before solving it, whether my abstractions sit where change is likely, whether I noticed the concurrency, and whether I can justify a decision including the ones I rejected. Saying "I would not abstract that yet — I only have one case" is usually a stronger signal than adding another interface.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How would this change at ten times the scale?"</strong><br>A: For the parking lot, the in-memory maps stop working across instances, so spot state moves to the database and allocation becomes a conditional <code>UPDATE</code> — atomic without a distributed lock. Generally: identify the shared mutable state, decide whether it moves to a database or a cache, replace in-process locks with database-level atomicity or optimistic locking, and check that nothing unbounded grows per user.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Structure: <strong>scope → entities → seams → code → trade-offs</strong>. Never skip scoping.</li>` +
        `<li>Records for values, classes for things with a <strong>lifecycle</strong>.</li>` +
        `<li>Abstract only <strong>where change is likely</strong> — and say when you deliberately do not.</li>` +
        `<li><strong>Name the concurrency</strong>: what is shared, what lock, what you would do at scale.</li>` +
        `<li>Money = <strong><code>BigDecimal</code> or minor units</strong>, never <code>double</code>.</li>` +
        `<li>Per-user maps need <strong>eviction</strong> or they leak.</li>` +
        `<li>Common prompts: parking lot · elevator · rate limiter · LRU cache · vending machine.</li>` +
        `<li><strong>Think out loud</strong> — the reasoning is what is being marked.</li>` +
        `</ul>`,
      ].join('\n'),
    },
  ],
};
