/**
 * Java Interview Kit — Chapter 12: Spring Data, JPA and Hibernate.
 *
 * ⚠️ Content strings are TEMPLATE LITERALS — never use a backtick inside them,
 * and always escape ${...} as \${...} or it will be interpolated.
 */
module.exports = {
  title: 'Spring Data, JPA & Hibernate',
  slug: 'spring-data-jpa',
  order: 11,
  topics: [
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Entities, Mapping and Repositories',
      slug: 'jpa-entities-and-repositories',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>JPA is where a lot of Java applications quietly go wrong, and the mistakes are made at mapping time — months before anyone notices. Interviewers ask about entity design because the answers reveal whether you have maintained a persistence layer or only generated one: what <code>equals</code> should do on an entity, why bidirectional relationships need care, and why a record cannot be an entity.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p><strong>JPA</strong> is a specification; <strong>Hibernate</strong> is the implementation Spring Boot uses; <strong>Spring Data JPA</strong> sits on top and generates repository implementations from interfaces. Keeping those three apart is worth a mark on its own.</p>`,
        `<pre><code class="language-java">@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 32)
    private String reference;

    @Enumerated(EnumType.STRING)          // ✔ never ORDINAL — see below
    private OrderStatus status;

    @ManyToOne(fetch = FetchType.LAZY)    // ✔ LAZY by default on to-one too
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List&lt;OrderLine&gt; lines = new ArrayList&lt;&gt;();

    protected Order() { }                 // required no-arg constructor
}</code></pre>`,
        `<p><strong>Why an entity cannot be a record:</strong> JPA requires a no-arg constructor, mutable fields for the provider to populate, and a non-final class so Hibernate can subclass it for lazy proxies. Records give none of those. Records are excellent for the DTOs you return <em>from</em> the repository layer — which is the right shape anyway.</p>`,
        `<h2>How it works</h2>`,
        `<p><strong>Spring Data derives queries from method names</strong>, parsing the name into a query at startup. Get the name wrong and the application fails to start — which is much better than failing at run time.</p>`,
        `<pre><code class="language-java">public interface OrderRepository extends JpaRepository&lt;Order, Long&gt; {

    // Derived — parsed from the name
    Optional&lt;Order&gt; findByReference(String reference);
    List&lt;Order&gt; findByStatusAndCreatedAtAfter(OrderStatus status, Instant after);
    long countByStatus(OrderStatus status);
    boolean existsByReference(String reference);

    // Explicit when the name would get silly
    @Query("SELECT o FROM Order o JOIN FETCH o.customer WHERE o.status = :status")
    List&lt;Order&gt; findByStatusWithCustomer(@Param("status") OrderStatus status);

    // Projections — fetch only the columns you need, mapped to a record
    interface OrderSummary { String getReference(); OrderStatus getStatus(); }
    List&lt;OrderSummary&gt; findSummaryByStatus(OrderStatus status);

    // ⚠ A modifying query bypasses the persistence context, so entities
    //   already loaded become stale. clearAutomatically fixes that.
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Order o SET o.status = :status WHERE o.id = :id")
    int updateStatus(@Param("id") Long id, @Param("status") OrderStatus status);
}</code></pre>`,
        `<p><strong>Bidirectional relationships need a helper.</strong> Setting only one side leaves the object graph inconsistent with what gets written, because the owning side — the one <em>without</em> <code>mappedBy</code> — is what JPA persists.</p>`,
        `<pre><code class="language-java">// ✔ Keep both sides in sync in one place.
public void addLine(OrderLine line) {
    lines.add(line);
    line.setOrder(this);        // the owning side — without this, order_id is null
}
public void removeLine(OrderLine line) {
    lines.remove(line);
    line.setOrder(null);
}</code></pre>`,
        `<h2>Code examples</h2>`,
        `<p>The two mapping decisions that cause production incidents:</p>`,
        `<pre><code class="language-java">// 1. ✘ @Enumerated defaults to ORDINAL — it stores the enum's POSITION.
//    Insert a new constant in the middle and every existing row silently
//    means something different. There is no error, just wrong data.
@Enumerated                                  // ✘ ORDINAL by default
private OrderStatus status;

@Enumerated(EnumType.STRING)                 // ✔ always
private OrderStatus status;

// 2. ✘ EAGER fetching cannot be turned off per query, so it taxes every
//    query that touches the entity — including ones that never use it.
//    @ManyToOne and @OneToOne are EAGER BY DEFAULT, which surprises people.
@ManyToOne                                   // ✘ eager
@ManyToOne(fetch = FetchType.LAZY)           // ✔ then fetch-join where needed</code></pre>`,
        `<p><code>equals</code> and <code>hashCode</code> on an entity — genuinely subtle, and Chapter 2 explains why:</p>`,
        `<pre><code class="language-java">// ✘ Using a generated id: it is null before persist, so an entity added to
//   a HashSet before saving becomes unreachable once the id is assigned —
//   Chapter 2's mutable-key trap, in the wild.
// ✘ Using all fields: they change, so the hash changes.
// ✔ Use a business key that is assigned at construction and never changes:
@Entity
public class Order {
    @Column(nullable = false, unique = true, updatable = false)
    private String reference = UUID.randomUUID().toString();

    @Override public boolean equals(Object o) {
        return o instanceof Order other &amp;&amp; reference.equals(other.reference);
    }
    @Override public int hashCode() { return reference.hashCode(); }
}
// ⚠ Use instanceof rather than getClass(): Hibernate hands you a PROXY
//   subclass for a lazy association, so getClass() comparison always fails.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Spring Data generates the implementation at runtime</strong> — a proxy backed by <code>SimpleJpaRepository</code>, with derived methods parsed from their names during context startup. That startup parsing is a feature: a typo in a property name breaks the build-out immediately with a clear message, rather than at the first call.</p>`,
        `<p><strong><code>save()</code> is not an insert.</strong> It calls <code>persist</code> for a new entity and <code>merge</code> for a detached one, deciding by whether the id is null (or via <code>Persistable</code>). And for an entity that is already <em>managed</em>, calling <code>save()</code> is redundant — dirty checking will write the change anyway. Understanding that is the difference between using JPA and fighting it.</p>`,
        `<p><strong><code>getReferenceById</code> versus <code>findById</code></strong> is a small but genuinely useful distinction: <code>findById</code> hits the database and returns an <code>Optional</code>; <code>getReferenceById</code> returns a lazy proxy without a query, which is ideal when you only need to set a foreign key. Touch any other property outside a transaction and you get <code>LazyInitializationException</code>.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong><code>@Enumerated</code> without <code>STRING</code>.</strong> Ordinal storage corrupts data when constants are reordered.</li>` +
        `<li><strong>Leaving <code>@ManyToOne</code> eager.</strong> It is the default, and it taxes every query.</li>` +
        `<li><strong><code>equals</code> on a generated id.</strong> Null before persist; breaks hash collections.</li>` +
        `<li><strong><code>getClass()</code> in an entity's <code>equals</code>.</strong> Fails against Hibernate proxies — use <code>instanceof</code>.</li>` +
        `<li><strong>Setting only one side of a bidirectional relationship.</strong> The owning side is what persists.</li>` +
        `<li><strong>Returning entities from controllers.</strong> Leaks the schema and triggers lazy loading during serialisation.</li>` +
        `<li><strong>Using a record as an entity.</strong> No no-arg constructor, no mutability, final class.</li>` +
        `<li><strong><code>@Modifying</code> without <code>clearAutomatically</code>.</strong> Loaded entities go stale.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "JPA, Hibernate and Spring Data JPA — how do they relate?"</strong><br>A: JPA is the specification defining the annotations and <code>EntityManager</code> API. Hibernate is the implementation, and Boot's default. Spring Data JPA is a layer above that generates repository implementations from interfaces, derives queries from method names, and adds paging and projections. You can use JPA without Spring Data and Hibernate without JPA.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How should <code>equals</code> and <code>hashCode</code> work on an entity?"</strong><br>A: Based on a business key assigned at construction and never changed — a UUID reference, say — not on the generated id and not on all fields. The generated id is null before persist, so an entity added to a <code>HashSet</code> before saving becomes unreachable once the id is assigned. And use <code>instanceof</code> rather than <code>getClass()</code>, because Hibernate hands you a proxy subclass for lazy associations and a class comparison would always fail.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why <code>EnumType.STRING</code>?"</strong><br>A: Because the default, <code>ORDINAL</code>, stores the enum constant's position. Insert or reorder a constant and every existing row silently changes meaning — no exception, just corrupted data discovered much later. <code>STRING</code> costs a little space and is safe against reordering.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What does <code>save()</code> actually do?"</strong><br>A: It calls <code>persist</code> for a new entity and <code>merge</code> for a detached one, choosing based on whether the id is null. For an entity that is already managed inside a transaction it is redundant — dirty checking issues the update at flush regardless. That surprises people who assume nothing is written without an explicit save.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Can a record be a JPA entity?"</strong><br>A: No. JPA needs a no-arg constructor, mutable fields to populate, and a non-final class so Hibernate can create lazy proxies — records provide none of those. They are ideal as DTOs and projections returned from the repository layer, which is a better boundary anyway than passing entities upward.</p></blockquote>`,
        `<blockquote><p><strong>Q: "<code>findById</code> or <code>getReferenceById</code>?"</strong><br>A: <code>findById</code> queries immediately and returns an <code>Optional</code>. <code>getReferenceById</code> returns a lazy proxy with no query, which is exactly right when you only need the reference to set a foreign key on another entity. The catch is that touching any other property outside an active transaction throws <code>LazyInitializationException</code>.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>JPA = spec · Hibernate = implementation · Spring Data JPA = repository generation.</li>` +
        `<li><strong>Always <code>@Enumerated(EnumType.STRING)</code></strong> — ordinal corrupts on reorder.</li>` +
        `<li><strong><code>@ManyToOne</code>/<code>@OneToOne</code> are EAGER by default</strong> → set <code>LAZY</code> and fetch-join per query.</li>` +
        `<li><code>equals</code>/<code>hashCode</code> on a <strong>business key</strong>, with <code>instanceof</code> (proxies!) — never the generated id.</li>` +
        `<li>Bidirectional: sync <strong>both sides</strong>; the owning side (no <code>mappedBy</code>) is what persists.</li>` +
        `<li><code>save()</code> = persist-or-merge; redundant on a <strong>managed</strong> entity (dirty checking).</li>` +
        `<li><code>getReferenceById</code> = lazy proxy, no query. <code>findById</code> = real query.</li>` +
        `<li><strong>Records cannot be entities</strong> — use them as DTOs/projections.</li>` +
        `<li>Derived queries are parsed <strong>at startup</strong> — typos fail fast.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'The Persistence Context and Entity States',
      slug: 'persistence-context',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>The persistence context is the thing that makes JPA feel magical and behave surprisingly. Updates happen without a save call; the same query returns the identical object twice; changes you did not intend get written. All three follow from one concept, and candidates who know it can predict JPA's behaviour instead of memorising its symptoms.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>The persistence context is a <strong>first-level cache</strong> scoped to a transaction. It tracks every entity it has loaded or persisted, guarantees one object per database row within its scope, and compares each tracked entity against a loaded snapshot at flush time — <strong>dirty checking</strong>.</p>`,
        `{{fig:ch12-entity-states.svg|Four states transient managed detached and removed with the transitions between them and a panel explaining dirty checking issuing an update with no save call|The managed state is where the surprises live: an entity in it is watched, so any mutation becomes an UPDATE at commit whether or not you asked for one.}}`,
        `<h2>How it works</h2>`,
        `<table><thead><tr><th>State</th><th>Meaning</th></tr></thead><tbody>` +
        `<tr><td><strong>Transient</strong></td><td><code>new Order()</code> — no id, unknown to JPA</td></tr>` +
        `<tr><td><strong>Managed</strong></td><td>Tracked; changes are written automatically at flush</td></tr>` +
        `<tr><td><strong>Detached</strong></td><td>Has an id but is no longer tracked — the transaction ended</td></tr>` +
        `<tr><td><strong>Removed</strong></td><td>Scheduled for deletion at flush</td></tr>` +
        `</tbody></table>`,
        `<p><strong>Dirty checking</strong> is the behaviour to internalise: inside a transaction, mutating a managed entity issues an <code>UPDATE</code> at commit with no <code>save()</code> anywhere. That is powerful, and it is also why an "innocent" setter call in a read path can write to the database.</p>`,
        `<p><strong>The first-level cache guarantees identity.</strong> Loading the same row twice in one transaction returns the <em>same object</em>, and the second load issues no query. This is not a performance cache you configure — it is a correctness guarantee, and it is always on.</p>`,
        `<h2>Code examples</h2>`,
        `<pre><code class="language-java">@Transactional
public void ship(Long orderId) {
    Order order = repository.findById(orderId).orElseThrow();
    order.setStatus(SHIPPED);
    // no save() — an UPDATE is issued at commit by dirty checking
}

// Identity within a transaction:
@Transactional
public void demo(Long id) {
    Order a = repository.findById(id).orElseThrow();
    Order b = repository.findById(id).orElseThrow();   // no second query
    System.out.println(a == b);                        // true — same object
}

// ✘ The accidental update. This method only means to read.
@Transactional
public OrderView view(Long id) {
    Order o = repository.findById(id).orElseThrow();
    o.setLastViewedAt(Instant.now());     // ✘ writes to the DB at commit
    return OrderView.from(o);
}
// ✔ Mark read paths explicitly — it also lets Hibernate skip the snapshot
//   and dirty-check entirely, which is a real performance win on big reads.
@Transactional(readOnly = true)</code></pre>`,
        `<p>The two errors everyone meets:</p>`,
        `<pre><code class="language-java">// 1. LazyInitializationException — the context closed with the transaction,
//    so the proxy has nothing to load from.
public OrderResponse get(Long id) {          // ✘ no @Transactional
    Order o = repository.findById(id).orElseThrow();
    return new OrderResponse(o.getCustomer().getName());   // ✘ throws
}
// ✔ Fixes, best first: fetch what you need in the query (JOIN FETCH or
//   @EntityGraph), or return a projection. Extending the transaction to the
//   web layer works and is worse — it holds a connection for the whole request.
// ✘ Never "fix" it with spring.jpa.open-in-view=true. Boot even warns about
//   it at startup: it keeps the context open for the entire request, hides
//   N+1 problems, and holds a database connection while rendering.

// 2. merge() returns a COPY.
@Transactional
public void update(Order detached) {
    repository.save(detached);         // returns a managed copy
    detached.setStatus(SHIPPED);       // ✘ mutating the DETACHED one — lost
}
@Transactional
public void update(Order detached) {
    Order managed = repository.save(detached);
    managed.setStatus(SHIPPED);        // ✔ mutate what save() returned
}</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Flush is not commit.</strong> Hibernate flushes — issues the SQL — before a query that might be affected by pending changes, and at commit. So <code>persist()</code> does not necessarily execute an <code>INSERT</code> immediately; statements are batched and ordered by Hibernate, which is why the SQL you see in the log can appear in an unexpected order.</p>`,
        `<p><strong>The second-level cache is a different thing entirely</strong> and a common confusion. The first-level cache is per transaction, mandatory and always on. The second-level cache is per <code>SessionFactory</code>, shared across transactions, optional, and needs a provider such as Ehcache or Hazelcast. Only the first is guaranteed by the specification.</p>`,
        `<p><strong><code>readOnly = true</code> earns its keep.</strong> Beyond preventing accidental writes, Hibernate skips taking the dirty-checking snapshot, which halves the memory footprint of a large read and removes the comparison at flush. On a query returning thousands of rows the difference is measurable, which makes it a genuine optimisation rather than documentation.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Mutating a managed entity in a read path.</strong> It writes at commit. Use <code>readOnly = true</code>.</li>` +
        `<li><strong>Touching a lazy association outside the transaction.</strong> <code>LazyInitializationException</code>.</li>` +
        `<li><strong>Enabling <code>open-in-view</code> to make it go away.</strong> Hides N+1 and holds a connection all request.</li>` +
        `<li><strong>Using the argument after <code>merge()</code>/<code>save()</code>.</strong> The managed instance is the returned one.</li>` +
        `<li><strong>Confusing first- and second-level caches.</strong> One is per transaction and mandatory; the other is shared and optional.</li>` +
        `<li><strong>Assuming <code>persist()</code> executes immediately.</strong> Statements are flushed later and reordered.</li>` +
        `<li><strong>Loading thousands of entities to update them.</strong> A bulk <code>@Modifying</code> query is orders of magnitude cheaper.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is the persistence context?"</strong><br>A: A transaction-scoped first-level cache that tracks every entity it has loaded or persisted. It guarantees one object per row within its scope, so loading the same row twice returns the identical instance with no second query, and it dirty-checks tracked entities at flush — comparing them to a loaded snapshot and issuing updates for anything that changed.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why does an entity update without calling <code>save()</code>?"</strong><br>A: Dirty checking. Inside a transaction the entity is managed, so at commit Hibernate compares it to the snapshot taken at load and issues an <code>UPDATE</code> for the changed columns. The flip side is that mutating an entity you only meant to read also writes — which is one reason to mark read paths <code>@Transactional(readOnly = true)</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What causes <code>LazyInitializationException</code>?"</strong><br>A: Touching a lazy association after the persistence context has closed — typically in the controller or during serialisation, once the transactional service method has returned. The right fix is to fetch what you need inside the transaction with a fetch join or an entity graph, or to return a projection. Turning on <code>open-in-view</code> makes the symptom disappear while holding a database connection for the whole request and hiding N+1 problems.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is the difference between <code>persist</code> and <code>merge</code>?"</strong><br>A: <code>persist</code> makes a transient entity managed and expects it to be new. <code>merge</code> takes a detached entity, copies its state onto a managed instance, and <strong>returns that instance</strong> — the argument stays detached. Forgetting the return value is a classic bug: you keep mutating the detached object and nothing is saved.</p></blockquote>`,
        `<blockquote><p><strong>Q: "First-level vs second-level cache?"</strong><br>A: The first-level cache is the persistence context: per transaction, mandatory, always on, and it guarantees object identity. The second-level cache is per <code>SessionFactory</code>, shared across transactions and sessions, optional, and requires a provider like Ehcache. Only the first is part of the guarantees you can rely on by default.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What does <code>readOnly = true</code> actually do?"</strong><br>A: It sets the flush mode to manual so nothing is written, and Hibernate skips taking the dirty-checking snapshot. That second part is a real optimisation — on a query loading thousands of entities it roughly halves the memory used and removes the comparison work at flush. It also documents intent, which prevents the accidental-write bug.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Persistence context = <strong>transaction-scoped first-level cache</strong> + identity guarantee + <strong>dirty checking</strong>.</li>` +
        `<li>States: <strong>transient → managed → detached / removed</strong>.</li>` +
        `<li>Managed entity mutated ⇒ <strong>UPDATE at commit, no save() needed</strong>.</li>` +
        `<li>Read paths: <strong><code>@Transactional(readOnly = true)</code></strong> — no accidental writes, no snapshot.</li>` +
        `<li><strong><code>merge()</code> returns the managed copy</strong> — use the return value.</li>` +
        `<li><code>LazyInitializationException</code> = context closed → fetch join / entity graph / projection. <strong>Not <code>open-in-view</code>.</strong></li>` +
        `<li>Flush ≠ commit; statements are batched and reordered.</li>` +
        `<li>L1 = per transaction, mandatory. L2 = shared, optional, needs a provider.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Lazy Loading and the N+1 Problem',
      slug: 'lazy-loading-and-n-plus-one',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>N+1 is the most common performance bug in Java applications, and the most invisible: the code is clean, the tests pass, and it is fast in development with five rows of test data. In production, a page that should issue one query issues four hundred. Every JPA interview covers it, and being able to name four different fixes — and say why <code>EAGER</code> is not one of them — is a strong answer.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p><strong>Lazy loading</strong> means an association is not fetched until touched; Hibernate hands you a proxy and issues a query when you use it. That is the right default — but touching a lazy association inside a loop issues one query <em>per iteration</em>.</p>`,
        `{{fig:ch12-n-plus-one.svg|Left shows one query for orders followed by one customer query per order; right lists four fixes join fetch entity graph batch size and DTO projection with a warning that EAGER is not a fix|One query for the list, then N more. The loop looks innocent — the cost is entirely in how the association was mapped and fetched.}}`,
        `<h2>How it works</h2>`,
        `<p>The defaults are worth memorising because they are inconsistent: <strong><code>@ManyToOne</code> and <code>@OneToOne</code> are EAGER by default; <code>@OneToMany</code> and <code>@ManyToMany</code> are LAZY.</strong> That surprises almost everyone, and the eager to-one default is a common hidden cause of over-fetching.</p>`,
        `<p>The four fixes, in order of preference:</p>`,
        `<table><thead><tr><th>Fix</th><th>When</th></tr></thead><tbody>` +
        `<tr><td><code>JOIN FETCH</code> in JPQL</td><td>You control the query and know what you need</td></tr>` +
        `<tr><td><code>@EntityGraph</code></td><td>Declarative, on a derived repository method</td></tr>` +
        `<tr><td><code>@BatchSize</code></td><td>Collections — turns N queries into N/size</td></tr>` +
        `<tr><td>DTO projection</td><td>You only need a few columns — best of all</td></tr>` +
        `</tbody></table>`,
        `<p><strong><code>EAGER</code> is not a fix.</strong> It moves the problem: the association is now fetched by <em>every</em> query touching the entity, whether or not that code path needs it. The correct approach is to keep everything <code>LAZY</code> and fetch eagerly per query.</p>`,
        `<h2>Code examples</h2>`,
        `<pre><code class="language-java">// ✘ N+1. One query for orders, then one per order for the customer.
List&lt;Order&gt; orders = repository.findByStatus(NEW);
for (Order o : orders) log.info(o.getCustomer().getName());

// ✔ 1. JOIN FETCH — one query, explicit
@Query("SELECT o FROM Order o JOIN FETCH o.customer WHERE o.status = :status")
List&lt;Order&gt; findByStatusWithCustomer(@Param("status") OrderStatus status);

// ✔ 2. @EntityGraph — same effect, declarative, works with derived methods
@EntityGraph(attributePaths = {"customer", "lines"})
List&lt;Order&gt; findByStatus(OrderStatus status);

// ✔ 3. @BatchSize on the association or entity — N queries become N/50
@OneToMany(mappedBy = "order")
@BatchSize(size = 50)
private List&lt;OrderLine&gt; lines;

// ✔ 4. A projection — fetch two columns instead of whole object graphs
@Query("SELECT new com.app.OrderSummary(o.reference, c.name) " +
       "FROM Order o JOIN o.customer c WHERE o.status = :status")
List&lt;OrderSummary&gt; findSummaries(@Param("status") OrderStatus status);</code></pre>`,
        `<p>The trap in fetch-joining more than one collection:</p>`,
        `<pre><code class="language-java">// ✘ MultipleBagFetchException — you cannot JOIN FETCH two List collections.
@Query("SELECT o FROM Order o JOIN FETCH o.lines JOIN FETCH o.payments")

// ✔ Option A: make them Sets rather than Lists.
// ✔ Option B: fetch one and use @BatchSize for the other.
// ✔ Option C: two queries — the persistence context stitches them together,
//   because the identity guarantee means the second query populates the
//   SAME objects the first returned.

// ⚠ Also: JOIN FETCH plus pagination silently loads EVERYTHING into memory
//   and paginates there. Hibernate logs
//   "firstResult/maxResults specified with collection fetch; applying in memory"
//   — treat that warning as an error. Use @BatchSize or two queries instead.</code></pre>`,
        `<p>Catching it before production, which is the answer interviewers want:</p>`,
        `<pre><code class="language-properties"># Development only — never in production, it is enormous and slow.
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
logging.level.org.hibernate.SQL=DEBUG

# Better: fail the build. Datasource-proxy or the Hypersistence utilities
# can assert a query COUNT in a test:
#   assertSelectCount(1);
# That turns "someone will notice eventually" into a failing test.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p>Hibernate implements lazy loading with <strong>proxies</strong> — a generated subclass for a to-one association, a lazy wrapper for a collection. This is why entity classes and their getters must not be <code>final</code>, and why <code>getClass()</code> in an entity's <code>equals</code> fails against a proxy.</p>`,
        `<p><strong>Why the problem is invisible in tests:</strong> with ten rows, 11 queries against an in-memory H2 take microseconds. With ten thousand rows against a database across a network, 10,001 round trips at even 1 ms each is over ten seconds. The bug does not scale linearly into visibility — it arrives all at once with real data volume. That is the argument for asserting query counts rather than relying on noticing.</p>`,
        `<p><strong>The wider lesson</strong> is worth stating in an interview: an ORM hides the database, and hiding it is exactly why these problems occur. The habit that prevents nearly all of them is simply to look at the generated SQL during development — most JPA performance bugs are visible in the log the first time the code runs.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Switching to <code>EAGER</code> to fix N+1.</strong> Moves the cost to every query instead.</li>` +
        `<li><strong>Not knowing <code>@ManyToOne</code> is eager by default.</strong> Silent over-fetching everywhere.</li>` +
        `<li><strong>Fetch-joining two collections.</strong> <code>MultipleBagFetchException</code>.</li>` +
        `<li><strong>Combining <code>JOIN FETCH</code> with pagination.</strong> Paginates in memory after loading everything.</li>` +
        `<li><strong>Never looking at the SQL.</strong> Nearly every JPA performance bug is visible in the log.</li>` +
        `<li><strong>Returning entities from controllers.</strong> Serialisation touches lazy associations and triggers N+1 in the web layer.</li>` +
        `<li><strong>Relying on tests with tiny datasets.</strong> Assert query counts instead.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is the N+1 problem?"</strong><br>A: One query loads a list of N entities, then touching a lazy association on each issues one more query per element — N+1 in total. The loop looks completely innocent; the cost comes from the mapping and the fetch strategy. It is invisible in development because ten rows against an in-memory database is fast, and catastrophic in production with real volume and network latency.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you fix it?"</strong><br>A: Four ways. <code>JOIN FETCH</code> in a JPQL query when I control the query. <code>@EntityGraph</code> for the same effect declaratively on a derived method. <code>@BatchSize</code>, which turns N queries into N divided by the batch size — good for collections. Or a DTO projection that selects only the columns needed, which is usually best because it avoids loading entities at all.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why not just make it EAGER?"</strong><br>A: Because eager fetching cannot be turned off per query. The association is then loaded by every query that touches the entity, including the many code paths that never use it — so you have replaced N+1 on one screen with permanent over-fetching everywhere. The right model is LAZY by default, fetched eagerly per query where needed.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What are the default fetch types?"</strong><br>A: <code>@ManyToOne</code> and <code>@OneToOne</code> are EAGER; <code>@OneToMany</code> and <code>@ManyToMany</code> are LAZY. The to-one default catches people out constantly — it means every load of an entity silently drags its parents along unless you set <code>fetch = FetchType.LAZY</code> explicitly.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How would you detect it?"</strong><br>A: Enable SQL logging in development and actually read it — most of these bugs are obvious the first time the code runs. Better, assert query counts in integration tests with something like datasource-proxy, so a regression fails the build rather than waiting to be noticed. In production, an APM tool showing queries per request surfaces it quickly.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What happens if you fetch-join a collection with pagination?"</strong><br>A: Hibernate cannot apply the limit in SQL without losing rows, so it loads the entire result set into memory and paginates there — and logs a warning saying exactly that. On a large table it is an <code>OutOfMemoryError</code> waiting to happen. Use <code>@BatchSize</code> or a two-query approach, where the second query populates the same objects thanks to the persistence context's identity guarantee.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>N+1 = 1 query for the list + <strong>1 per element</strong> for a lazy association.</li>` +
        `<li>Defaults: <strong><code>@ManyToOne</code>/<code>@OneToOne</code> EAGER</strong>, <code>@OneToMany</code>/<code>@ManyToMany</code> LAZY.</li>` +
        `<li>Fixes: <strong><code>JOIN FETCH</code> · <code>@EntityGraph</code> · <code>@BatchSize</code> · DTO projection</strong>.</li>` +
        `<li><strong><code>EAGER</code> is not a fix</strong> — it over-fetches on every query instead.</li>` +
        `<li>Two collection fetch-joins → <strong><code>MultipleBagFetchException</code></strong> (use Sets, or batch one).</li>` +
        `<li><strong><code>JOIN FETCH</code> + pagination = in-memory pagination.</strong> Treat the warning as an error.</li>` +
        `<li>Detect with <strong>SQL logging in dev + query-count assertions in tests</strong>.</li>` +
        `<li>Lazy loading uses <strong>proxies</strong> → entities and getters must not be <code>final</code>.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: '@Transactional: Propagation, Isolation and Traps',
      slug: 'transactional',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p><code>@Transactional</code> is one annotation with a remarkable number of ways to silently do nothing — self-invocation, private methods, checked exceptions, the wrong propagation. Every one of those has caused a production data-integrity bug somewhere, and interviewers ask precisely because the failures are silent: no exception, no log, just data that should have rolled back and did not.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p><code>@Transactional</code> wraps a method in a database transaction via the AOP proxy from Chapter 11: begin before, commit after, roll back on failure.</p>`,
        `<p><strong>The default rollback rule is the trap:</strong> Spring rolls back on <strong>unchecked</strong> exceptions and <code>Error</code>, and <strong>commits</strong> on checked exceptions. That surprises almost everyone — a method that throws <code>IOException</code> after half its work commits the half.</p>`,
        `<pre><code class="language-java">@Transactional
public void process() throws IOException {
    repository.save(order);
    throw new IOException("failed");     // ✘ COMMITS — checked exception
}

@Transactional(rollbackFor = Exception.class)   // ✔ roll back on anything
public void process() throws IOException { … }</code></pre>`,
        `<h2>How it works</h2>`,
        `<p><strong>Propagation</strong> decides what happens when a transactional method is called from within an existing transaction:</p>`,
        `<table><thead><tr><th>Propagation</th><th>Behaviour</th></tr></thead><tbody>` +
        `<tr><td><code>REQUIRED</code> (default)</td><td>Join the existing one, or start one</td></tr>` +
        `<tr><td><code>REQUIRES_NEW</code></td><td>Suspend the outer, run in a genuinely independent transaction</td></tr>` +
        `<tr><td><code>SUPPORTS</code></td><td>Join if present, otherwise run without</td></tr>` +
        `<tr><td><code>MANDATORY</code></td><td>Must already be in one, else throw</td></tr>` +
        `<tr><td><code>NEVER</code> / <code>NOT_SUPPORTED</code></td><td>Throw / suspend and run without</td></tr>` +
        `<tr><td><code>NESTED</code></td><td>Savepoint within the outer — rolls back to the savepoint</td></tr>` +
        `</tbody></table>`,
        `<p><strong><code>REQUIRES_NEW</code> is the one with a real use case:</strong> writing an audit record that must survive even when the business transaction rolls back. It is also the one that causes connection-pool exhaustion, because the outer transaction holds its connection while the inner one takes a second — nest that under load and the pool is gone.</p>`,
        `<p><strong>Isolation</strong> controls what a transaction can see of others' uncommitted or changing data — <code>READ_COMMITTED</code> is the usual default and prevents dirty reads; <code>REPEATABLE_READ</code> additionally prevents non-repeatable reads; <code>SERIALIZABLE</code> prevents phantoms at a significant concurrency cost. In practice the default is almost always right, and correctness problems are better solved with optimistic locking.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The four silent failures, together:</p>`,
        `<pre><code class="language-java">@Service
public class OrderService {

    // ✘ 1. SELF-INVOCATION — the internal call skips the proxy entirely.
    public void processAll(List&lt;Order&gt; os) { os.forEach(this::processOne); }
    @Transactional public void processOne(Order o) { … }   // NO transaction

    // ✘ 2. PRIVATE — proxies cannot intercept it. Silently ignored.
    @Transactional private void internal() { … }

    // ✘ 3. CHECKED EXCEPTION — commits instead of rolling back.
    @Transactional public void save() throws IOException { … }

    // ✘ 4. CATCHING THE EXCEPTION — no exception propagates, so Spring has
    //      no idea anything failed and commits happily.
    @Transactional
    public void process() {
        try { risky(); }
        catch (Exception e) { log.error("failed", e); }    // ✘ still commits
    }
    // ✔ Rethrow, or mark the transaction rollback-only:
    //   TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
}</code></pre>`,
        `<p>Optimistic locking, which is the answer to most concurrency questions here:</p>`,
        `<pre><code class="language-java">@Entity
public class Order {
    @Version
    private Long version;          // ✔ Hibernate manages it
}

// Every UPDATE includes "WHERE id = ? AND version = ?" and increments it.
// If another transaction updated the row first, zero rows match and
// Hibernate throws OptimisticLockException — no locks held, no deadlocks,
// and the loser can retry.

@Retryable(retryFor = OptimisticLockingFailureException.class, maxAttempts = 3)
@Transactional
public void updateStatus(Long id, OrderStatus status) { … }

// Pessimistic locking takes a real database lock and blocks other writers.
// Correct, and far more likely to deadlock — reserve it for genuine
// contention on a hot row, and always with a lock ordering (Chapter 8).
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT o FROM Order o WHERE o.id = :id")
Optional&lt;Order&gt; findByIdForUpdate(@Param("id") Long id);</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Why checked exceptions commit</strong> is a design decision, not an oversight: Spring inherited EJB's convention that checked exceptions are <em>business</em> outcomes the caller is expected to handle, while unchecked ones are failures. Whether or not you agree, knowing it is deliberate is a better answer than calling it a bug — and <code>rollbackFor = Exception.class</code> is the fix.</p>`,
        `<p><strong>The transaction spans the whole method, including slow work.</strong> An HTTP call inside a transactional method holds a database connection open for its entire duration. Under load that exhausts the pool while the database itself is idle. Keep transactions short and do external calls outside them — the same discipline as "never hold a lock across I/O" from Chapter 8.</p>`,
        `<p><strong>Transaction boundaries belong in the service layer</strong>, not the repository and not the controller. Repository-level transactions make a multi-step business operation non-atomic; controller-level ones hold connections while serialising responses. The service method is the unit of business work, which is exactly the unit that should be atomic.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Self-invocation.</strong> The most common cause of a silently missing transaction.</li>` +
        `<li><strong><code>@Transactional</code> on a private method.</strong> Cannot be proxied; ignored.</li>` +
        `<li><strong>Expecting a rollback on a checked exception.</strong> It commits — use <code>rollbackFor</code>.</li>` +
        `<li><strong>Catching the exception inside the method.</strong> Spring sees success and commits.</li>` +
        `<li><strong>External calls inside a transaction.</strong> Holds a connection for the whole round trip.</li>` +
        `<li><strong><code>REQUIRES_NEW</code> in a loop.</strong> Each takes another connection — pool exhaustion.</li>` +
        `<li><strong>Raising the isolation level to fix a race.</strong> Optimistic locking with <code>@Version</code> is usually better.</li>` +
        `<li><strong>Transactions on repositories or controllers.</strong> Boundaries belong in the service layer.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "How does <code>@Transactional</code> work?"</strong><br>A: Through the AOP proxy. Spring wraps the bean, and when an external caller invokes an annotated method the proxy begins a transaction, delegates, then commits or rolls back. Because it is proxy-based, it shares every proxy limitation: a self-invocation bypasses it, a <code>private</code> or <code>final</code> method cannot be intercepted, and in both cases it fails silently.</p></blockquote>`,
        `<blockquote><p><strong>Q: "When does Spring roll back by default?"</strong><br>A: On unchecked exceptions and <code>Error</code> only. A checked exception <em>commits</em>, which is a deliberate inheritance from EJB semantics — checked exceptions were treated as business outcomes rather than failures. If you want a checked exception to roll back, specify <code>rollbackFor = Exception.class</code>. And catching the exception inside the method means Spring sees no failure at all and commits.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Explain <code>REQUIRED</code> versus <code>REQUIRES_NEW</code>."</strong><br>A: <code>REQUIRED</code>, the default, joins an existing transaction or starts one — so an inner failure rolls back the whole thing. <code>REQUIRES_NEW</code> suspends the outer transaction and runs in a genuinely independent one, so it can commit even when the outer rolls back. That is exactly right for audit logging, and dangerous in a loop, because the outer transaction keeps its connection while each inner one takes another.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Two users update the same order concurrently. How do you handle it?"</strong><br>A: Optimistic locking. Add a <code>@Version</code> field; Hibernate then includes the version in the update's <code>WHERE</code> clause and increments it, so the second writer matches zero rows and gets an <code>OptimisticLockException</code> to retry. It holds no locks and cannot deadlock. Pessimistic locking with <code>PESSIMISTIC_WRITE</code> is the alternative when contention on a specific row is genuinely high, but it blocks writers and risks deadlock.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why did my transaction not roll back?"</strong><br>A: Four usual suspects, in order of likelihood. Self-invocation, so the proxy was never involved. A checked exception, which commits by default. The exception being caught inside the method, so Spring saw success. Or the method being <code>private</code> or <code>final</code> and therefore un-proxyable. All four are silent — nothing is logged, which is what makes them so hard to spot.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Where should transaction boundaries go?"</strong><br>A: The service layer, because that is where a unit of business work lives and that is what needs to be atomic. On repositories, a multi-step operation stops being atomic. On controllers, the connection is held while the response is serialised. I also keep transactions short and move any external HTTP call outside them, since a transactional method holds a database connection for its entire duration.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Proxy-based ⇒ <strong>self-invocation, <code>private</code> and <code>final</code> all silently skip it</strong>.</li>` +
        `<li><strong>Rolls back on unchecked only.</strong> Checked exceptions COMMIT → <code>rollbackFor = Exception.class</code>.</li>` +
        `<li>Catching the exception inside ⇒ Spring commits. Rethrow or <code>setRollbackOnly()</code>.</li>` +
        `<li>Propagation: <code>REQUIRED</code> (default) · <strong><code>REQUIRES_NEW</code></strong> (independent, audit) · <code>NESTED</code> (savepoint) · <code>MANDATORY</code> · <code>SUPPORTS</code> · <code>NEVER</code>.</li>` +
        `<li><code>REQUIRES_NEW</code> in a loop ⇒ <strong>connection-pool exhaustion</strong>.</li>` +
        `<li>Concurrency: <strong><code>@Version</code> optimistic locking</strong> first; pessimistic only for hot rows.</li>` +
        `<li><strong>No external calls inside a transaction</strong> — it holds a connection throughout.</li>` +
        `<li>Boundaries in the <strong>service layer</strong>. Read paths get <code>readOnly = true</code>.</li>` +
        `</ul>`,
      ].join('\n'),
    },
  ],
};
