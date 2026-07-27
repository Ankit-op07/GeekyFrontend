/**
 * Java Interview Kit — Chapter 11: Spring Core & Spring Boot.
 *
 * The differentiator half of the kit. Java interviews go here, and most free
 * material stops before it.
 *
 * ⚠️ Content strings are TEMPLATE LITERALS — never use a backtick inside them,
 * and always escape ${...} as \${...} or it will be interpolated.
 */
module.exports = {
  title: 'Spring Core & Spring Boot',
  slug: 'spring-core-boot',
  order: 10,
  topics: [
    // ────────────────────────────────────────────────────────────────
    {
      title: 'IoC and Dependency Injection',
      slug: 'ioc-and-dependency-injection',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Every Spring question eventually reduces to this one. If you can explain what inversion of control actually inverts — and why constructor injection is not merely a style preference — the rest of the framework follows. It is also the question where a memorised definition is most obvious: "IoC means Spring creates your objects" is true and explains nothing.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p><strong>Inversion of control</strong> means the framework, not your code, decides when objects are created and wired together. <strong>Dependency injection</strong> is the specific technique Spring uses to achieve it: a class declares what it needs, and something else supplies it.</p>`,
        `{{fig:ch11-ioc-di.svg|Left shows a class calling new on its own dependency and being untestable; right shows the same class taking the dependency as a constructor parameter with an ApplicationContext below wiring three beans together|The inversion is that the class stops calling new. It declares a need; the container satisfies it. That single change is what makes the class testable, swappable and shareable.}}`,
        `<p>The three injection styles, in the order you should prefer them:</p>`,
        `<table><thead><tr><th>Style</th><th>Verdict</th></tr></thead><tbody>` +
        `<tr><td><strong>Constructor</strong></td><td><strong>Use this.</strong> Dependencies can be <code>final</code>, the object is never half-built, and it works without Spring in tests</td></tr>` +
        `<tr><td>Setter</td><td>Only for genuinely optional dependencies</td></tr>` +
        `<tr><td>Field (<code>@Autowired</code> on a field)</td><td>Avoid — cannot be <code>final</code>, hides dependencies, needs reflection to test</td></tr>` +
        `</tbody></table>`,
        `<h2>How it works</h2>`,
        `<p>Spring scans for stereotype annotations, builds a graph of bean definitions, then instantiates them in dependency order and injects each constructor argument. <strong>Since Spring 4.3, a class with a single constructor needs no <code>@Autowired</code> at all</strong> — which is why modern Spring code has almost no injection annotations in it.</p>`,
        `<p>The stereotypes are all <code>@Component</code> underneath; the distinctions are for readability and for one real behaviour:</p>`,
        `<ul>` +
        `<li><code>@Component</code> — generic bean.</li>` +
        `<li><code>@Service</code> — business logic. Semantic only.</li>` +
        `<li><code>@Repository</code> — data access. <strong>Not</strong> semantic only: it enables exception translation, converting vendor-specific <code>SQLException</code>s into Spring's <code>DataAccessException</code> hierarchy.</li>` +
        `<li><code>@Controller</code> / <code>@RestController</code> — web layer.</li>` +
        `</ul>`,
        `<h2>Code examples</h2>`,
        `<pre><code class="language-java">// ✔ Constructor injection — no annotation needed with one constructor.
@Service
public class OrderService {
    private final OrderRepository repository;      // final: guaranteed set
    private final PaymentGateway gateway;

    public OrderService(OrderRepository repository, PaymentGateway gateway) {
        this.repository = repository;
        this.gateway = gateway;
    }
}

// The test needs no Spring at all:
var service = new OrderService(new InMemoryOrderRepository(), new FakeGateway());

// ✘ Field injection — the constructor tells you nothing, the fields cannot
//   be final, and constructing it in a plain unit test is impossible without
//   reflection or a Spring context.
@Service
public class OrderService {
    @Autowired private OrderRepository repository;
}</code></pre>`,
        `<p>Resolving ambiguity, which is the most common wiring failure:</p>`,
        `<pre><code class="language-java">// Two implementations of one interface → NoUniqueBeanDefinitionException.
public interface PaymentGateway { }
@Component class StripeGateway implements PaymentGateway { }
@Component class PaypalGateway implements PaymentGateway { }

// ✔ Option 1 — mark a default.
@Component @Primary class StripeGateway implements PaymentGateway { }

// ✔ Option 2 — name the one you want at the injection point.
public OrderService(@Qualifier("paypalGateway") PaymentGateway gateway) { … }

// ✔ Option 3 — inject them all and choose at run time. Often the best
//   design, because it removes the branching from configuration.
public OrderService(List&lt;PaymentGateway&gt; gateways) { … }
public OrderService(Map&lt;String, PaymentGateway&gt; byBeanName) { … }</code></pre>`,
        `<p>Circular dependencies, and why the fix is design rather than configuration:</p>`,
        `<pre><code class="language-java">// A needs B, B needs A. Constructor injection makes this a STARTUP FAILURE,
// which is correct — the cycle is a design problem.
// Since Spring Boot 2.6 it is rejected by default rather than silently allowed.

// ✘ The usual "fixes" hide the problem:
//   spring.main.allow-circular-references=true
//   @Lazy on one of the constructor parameters
//   switching to field injection so the cycle is resolved after construction

// ✔ Real fixes: extract the shared behaviour into a third bean that both
//   depend on, or publish an event instead of calling back. If A and B need
//   each other, they are usually one concept split in the wrong place.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Why constructor injection matters beyond style</strong> comes down to three concrete properties. Fields can be <code>final</code>, so the object is immutable and safely publishable across threads (Chapter 8's memory-model guarantee). The object can never exist in a half-initialised state, because it is not constructed until every dependency is available. And a constructor with eight parameters is a visible, uncomfortable signal that the class does too much — field injection hides exactly that smell behind a tidy-looking class.</p>`,
        `<p><strong>Spring beans are singletons by default, and that is a threading contract.</strong> One instance serves every request thread concurrently, so any mutable field on a <code>@Service</code> is shared mutable state. This is the single most common Spring concurrency bug: an instance field used to pass data between methods works perfectly under manual testing and corrupts data under load. Keep beans stateless; pass state as parameters.</p>`,
        `<p><strong>Spring's singleton is not the singleton pattern.</strong> It means "one instance per <code>ApplicationContext</code>", not one per JVM — two contexts have two instances, and the class has no private constructor or static accessor.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Field injection.</strong> Hides dependencies, prevents <code>final</code>, and makes plain unit tests impossible.</li>` +
        `<li><strong>Mutable state on a singleton bean.</strong> Shared across every request thread.</li>` +
        `<li><strong>Working around circular dependencies.</strong> The cycle is the bug; <code>@Lazy</code> just delays it.</li>` +
        `<li><strong>Injecting the container.</strong> <code>ApplicationContextAware</code> or <code>getBean()</code> is service-locator, not injection.</li>` +
        `<li><strong>Adding <code>@Autowired</code> to a single constructor.</strong> Unnecessary since Spring 4.3.</li>` +
        `<li><strong>Assuming <code>@Service</code> and <code>@Repository</code> are interchangeable.</strong> <code>@Repository</code> enables exception translation.</li>` +
        `<li><strong>Injecting a prototype into a singleton.</strong> It is resolved once, so you get the same instance forever.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is inversion of control?"</strong><br>A: Normally an object decides which concrete collaborators it uses by calling <code>new</code>. IoC inverts that: the object declares what it needs and the container supplies it, so control over creation and wiring moves out of the class. Dependency injection is Spring's mechanism for doing it — the two are related but not synonyms, since IoC is the principle and DI one implementation.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Which injection type do you use and why?"</strong><br>A: Constructor, essentially always. It lets dependencies be <code>final</code>, so the bean is immutable and safe to share across threads; the object cannot exist half-built; and it is constructible in a plain unit test with no Spring at all. It also makes an over-large dependency list visible, which field injection conveniently hides. Since Spring 4.3 a single constructor needs no <code>@Autowired</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Are Spring beans thread-safe?"</strong><br>A: The container is, but your beans are not automatically. The default scope is singleton — one instance per context, serving every request thread concurrently — so any mutable instance field is shared mutable state and races under load. The rule is to keep beans stateless and pass state through method parameters. Note also that Spring's "singleton" means one per <code>ApplicationContext</code>, not the Gang of Four singleton pattern.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Two beans implement the same interface. What happens?"</strong><br>A: <code>NoUniqueBeanDefinitionException</code> at startup. I resolve it with <code>@Primary</code> for a sensible default, <code>@Qualifier</code> at the injection point when I need a specific one, or — often best — by injecting <code>List&lt;T&gt;</code> or <code>Map&lt;String, T&gt;</code> and selecting at run time, which turns a configuration decision into ordinary code.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you handle a circular dependency?"</strong><br>A: By removing it. With constructor injection Spring fails at startup, and since Boot 2.6 that is the default — which is the right behaviour, because a cycle means two beans are mutually responsible for each other. The real fixes are extracting the shared logic into a third bean, or replacing a direct call with an event. Using <code>@Lazy</code> or enabling circular references hides a design problem.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Difference between <code>@Component</code>, <code>@Service</code> and <code>@Repository</code>?"</strong><br>A: All are <code>@Component</code> underneath and are all picked up by scanning. <code>@Service</code> is purely semantic. <code>@Repository</code> is the one with real behaviour — it enables persistence exception translation, wrapping vendor-specific <code>SQLException</code>s in Spring's <code>DataAccessException</code> hierarchy so callers are not coupled to the database.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>IoC = the container controls creation and wiring. <strong>DI is how Spring does it.</strong></li>` +
        `<li><strong>Constructor injection</strong>: <code>final</code> fields · never half-built · testable without Spring · exposes bloat.</li>` +
        `<li>Single constructor ⇒ <strong>no <code>@Autowired</code> needed</strong> (Spring 4.3+).</li>` +
        `<li>Default scope <strong>singleton = one per context</strong>, shared by all request threads → <strong>keep beans stateless</strong>.</li>` +
        `<li>Ambiguity: <code>@Primary</code> · <code>@Qualifier</code> · inject <code>List</code>/<code>Map</code>.</li>` +
        `<li>Circular deps fail at startup since Boot 2.6 — <strong>fix the design</strong>, don't enable them.</li>` +
        `<li><code>@Repository</code> adds <strong>exception translation</strong>; <code>@Service</code> is semantic only.</li>` +
        `<li>Spring singleton ≠ singleton pattern.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Bean Lifecycle, Scopes and Proxies',
      slug: 'bean-lifecycle-and-scopes',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>The lifecycle looks like trivia until you meet the bug it explains: <code>@Transactional</code> silently doing nothing when a method calls another method on the same class. That behaviour is not a Spring quirk — it falls directly out of <em>when</em> and <em>how</em> Spring creates its proxies, and understanding it is what turns a memorised list of callbacks into working knowledge.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A bean goes through instantiation, dependency injection, callbacks, and — critically — a post-processing step where Spring may <strong>replace it with a proxy</strong>.</p>`,
        `{{fig:ch11-bean-lifecycle.svg|A seven step lifecycle from instantiate through populate aware callbacks BeanPostProcessor before init the init callbacks then the after-init post processor creating a proxy and finally ready plus scope and destruction panels|Step 6 is the one that matters. Anything annotated @Transactional, @Async or @Cacheable is wrapped, so what other beans receive is the proxy — not your object.}}`,
        `<h2>How it works</h2>`,
        `<p><strong>The scopes:</strong> <code>singleton</code> (default, one per container), <code>prototype</code> (a new instance on every injection or lookup), plus the web scopes <code>request</code>, <code>session</code> and <code>application</code>.</p>`,
        `<p>Two scope facts that catch people out. <strong>Spring does not manage prototype destruction</strong> — it creates the bean, hands it over, and forgets it, so <code>@PreDestroy</code> never runs and any resource it holds must be closed by you. And <strong>injecting a prototype into a singleton gives you one instance forever</strong>, because injection happens once when the singleton is built. If you genuinely need a fresh instance per call, inject an <code>ObjectProvider</code> and ask it each time.</p>`,
        `<p><strong>Proxies come in two flavours.</strong> If the bean implements an interface, Spring uses a JDK dynamic proxy that implements the same interface. Otherwise it uses CGLIB to generate a subclass. Spring Boot defaults to CGLIB for everything, which is why <code>final</code> classes and <code>final</code> methods cannot be proxied — the subclass cannot override them, so the annotation silently does nothing.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The self-invocation problem, which is the single most-reported Spring "bug":</p>`,
        `<pre><code class="language-java">@Service
public class OrderService {

    public void processAll(List&lt;Order&gt; orders) {
        for (Order o : orders) {
            process(o);        // ✘ INTERNAL call — goes straight to "this",
        }                      //   bypassing the proxy entirely.
    }

    @Transactional
    public void process(Order o) {
        // NO TRANSACTION when called from processAll above.
        // Called from another bean, it works perfectly — which is exactly
        // what makes this so confusing to debug.
    }
}

// Why: callers hold the PROXY. The proxy intercepts the call, starts a
// transaction, then delegates to the target. But "this" inside the target
// is the target, not the proxy — so an internal call never passes through
// the interception layer.

// ✔ Fix 1 (best): move the annotated method to a separate bean, so the
//   call crosses a bean boundary and goes through the proxy.
// ✔ Fix 2: inject self via ObjectProvider and call through it.
// ✘ Non-fix: adding @Transactional to processAll as well — it changes the
//   transaction boundary but does not make the inner annotation apply.</code></pre>`,
        `<p>Lifecycle callbacks:</p>`,
        `<pre><code class="language-java">@Component
public class ConnectionPool {

    @PostConstruct                       // after injection, before use
    public void init() { openConnections(); }

    @PreDestroy                          // on context shutdown (singletons only)
    public void shutdown() { closeConnections(); }
}
// @PostConstruct/@PreDestroy are the portable JSR-250 annotations and the
// idiomatic choice. InitializingBean/DisposableBean couple you to Spring;
// @Bean(initMethod, destroyMethod) suits third-party classes you cannot annotate.

// ⚠ Constructor vs @PostConstruct: dependencies are NOT injected when the
//   constructor runs (with field injection), so initialisation that uses
//   them must go in @PostConstruct. With constructor injection this is a
//   non-issue — another point in its favour.</code></pre>`,
        `<p>Prototype in a singleton:</p>`,
        `<pre><code class="language-java">// ✘ Injected once → the SAME "prototype" forever.
@Service
public class Handler {
    private final Task task;                  // prototype-scoped
    public Handler(Task task) { this.task = task; }
}

// ✔ Ask for a new one per call.
@Service
public class Handler {
    private final ObjectProvider&lt;Task&gt; tasks;
    public Handler(ObjectProvider&lt;Task&gt; tasks) { this.tasks = tasks; }
    public void handle() { Task t = tasks.getObject(); … }   // fresh each time
}</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p>Proxy creation happens in a <code>BeanPostProcessor</code> — specifically <code>AbstractAutoProxyCreator</code> — running <em>after</em> initialisation. That ordering is exactly why <code>@PostConstruct</code> runs on the raw target and why the proxy is what everyone else receives. It also explains a subtler trap: calling an annotated method from inside <code>@PostConstruct</code> does not go through the proxy either, because the proxy does not exist yet.</p>`,
        `<p><strong>Interface versus class proxies</strong> has a visible consequence. A JDK proxy only implements the interface, so injecting the concrete class fails with a confusing type error; CGLIB subclasses the class, so it cannot handle <code>final</code>. Spring Boot standardised on CGLIB to avoid the first problem, which is why the practical rule is simply: <strong>do not make proxied classes or their annotated methods <code>final</code>, and do not annotate <code>private</code> methods</strong> — none of them can be intercepted, and all fail silently.</p>`,
        `<p>The same reasoning applies to <code>@Async</code> and <code>@Cacheable</code>. They are all proxy-based, so they all share the self-invocation limitation, the <code>final</code> limitation, and the private-method limitation. Recognising that one mechanism explains all three is a strong answer.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Self-invocation of an annotated method.</strong> Bypasses the proxy — no transaction, no async, no caching.</li>` +
        `<li><strong><code>final</code> or <code>private</code> annotated methods.</strong> Cannot be proxied; the annotation is silently ignored.</li>` +
        `<li><strong>Expecting <code>@PreDestroy</code> on a prototype.</strong> Spring does not manage prototype destruction.</li>` +
        `<li><strong>Injecting a prototype into a singleton.</strong> Resolved once — use <code>ObjectProvider</code>.</li>` +
        `<li><strong>Initialisation logic in the constructor with field injection.</strong> Dependencies are not set yet.</li>` +
        `<li><strong>Calling annotated methods from <code>@PostConstruct</code>.</strong> The proxy does not exist yet.</li>` +
        `<li><strong>Mutable state on a singleton.</strong> Shared across request threads.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Walk me through the bean lifecycle."</strong><br>A: Instantiate, populate dependencies, run the aware callbacks, then <code>BeanPostProcessor</code> before-init — which is where <code>@PostConstruct</code> is invoked — then the init callbacks, then <code>BeanPostProcessor</code> after-init, which is where AOP proxies are created. Then the bean is ready. On shutdown, <code>@PreDestroy</code> runs for singletons. The proxy step is the one worth remembering, because it explains most Spring surprises.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why does <code>@Transactional</code> not work when a method calls another method in the same class?"</strong><br>A: Because the annotation is implemented by a proxy. Other beans hold the proxy, so calls from outside are intercepted and a transaction starts. An internal call goes through <code>this</code>, which is the target object, not the proxy — so nothing intercepts it. The fix is to move the annotated method into a separate bean so the call crosses a bean boundary; injecting self is possible but usually a smell.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What are the bean scopes?"</strong><br>A: Singleton by default — one per <code>ApplicationContext</code>; prototype — a new instance per injection or lookup; and the web scopes request, session and application. Two catches: Spring does not destroy prototype beans, so <code>@PreDestroy</code> never runs on them, and injecting a prototype into a singleton resolves once, giving you the same instance forever unless you use <code>ObjectProvider</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "JDK proxy or CGLIB?"</strong><br>A: JDK dynamic proxies implement the bean's interface and require one; CGLIB generates a subclass and works without interfaces. Spring Boot defaults to CGLIB, which avoids the confusing failure where injecting a concrete class fails because the proxy only implements the interface. The consequence of CGLIB is that <code>final</code> classes and <code>final</code> or <code>private</code> methods cannot be proxied, and the annotation is silently ignored.</p></blockquote>`,
        `<blockquote><p><strong>Q: "<code>@PostConstruct</code> or the constructor?"</strong><br>A: The constructor is the right place with constructor injection, since everything is available. <code>@PostConstruct</code> matters when using field or setter injection, because dependencies are not set when the constructor runs. One caveat: the AOP proxy does not exist yet during <code>@PostConstruct</code>, so calling an annotated method from there does not go through interception.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Order: instantiate → populate → aware → <strong>BPP before</strong> (<code>@PostConstruct</code>) → init → <strong>BPP after (PROXY)</strong> → ready → <code>@PreDestroy</code>.</li>` +
        `<li>Callers hold the <strong>proxy</strong>; <code>this</code> is the target → <strong>self-invocation bypasses AOP</strong>.</li>` +
        `<li>Same limitation for <code>@Transactional</code>, <code>@Async</code>, <code>@Cacheable</code> — one mechanism.</li>` +
        `<li><strong>No <code>final</code> or <code>private</code></strong> on proxied classes/methods — silently ignored.</li>` +
        `<li>Scopes: singleton (default) · prototype · request · session · application.</li>` +
        `<li><strong>Prototypes are never destroyed</strong> by Spring; injecting one into a singleton resolves <strong>once</strong> → <code>ObjectProvider</code>.</li>` +
        `<li>Boot defaults to <strong>CGLIB</strong> proxies.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Spring Boot Auto-Configuration',
      slug: 'spring-boot-autoconfiguration',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>"How does Spring Boot know to configure a <code>DataSource</code>?" is the question that separates people who use Boot from people who understand it. The answer is not magic — it is conditional configuration plus classpath inspection, and knowing the mechanism is what lets you debug a starter that did not activate, or override one that did the wrong thing.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Auto-configuration is a large set of <code>@Configuration</code> classes shipped inside Boot, each guarded by conditions. On startup, Boot evaluates every one and applies those whose conditions match. The dominant condition is <strong>what is on the classpath</strong>: add the JDBC starter and a <code>DataSource</code> configuration becomes eligible; add H2 and a URL is inferred.</p>`,
        `<p><code>@SpringBootApplication</code> is three annotations:</p>`,
        `<ul>` +
        `<li><code>@SpringBootConfiguration</code> — this class is a configuration source.</li>` +
        `<li><code>@EnableAutoConfiguration</code> — evaluate the auto-configurations.</li>` +
        `<li><code>@ComponentScan</code> — scan this package and below.</li>` +
        `</ul>`,
        `<h2>How it works</h2>`,
        `<p>Boot reads candidate configuration classes from <code>META-INF/spring/…AutoConfiguration.imports</code> in every jar on the classpath (before Boot 2.7 this was <code>spring.factories</code>). Each candidate is then filtered by its conditions:</p>`,
        `<table><thead><tr><th>Condition</th><th>Applies when</th></tr></thead><tbody>` +
        `<tr><td><code>@ConditionalOnClass</code></td><td>A class is present on the classpath</td></tr>` +
        `<tr><td><code>@ConditionalOnMissingBean</code></td><td>You have <strong>not</strong> defined that bean — the override hook</td></tr>` +
        `<tr><td><code>@ConditionalOnProperty</code></td><td>A property has a given value</td></tr>` +
        `<tr><td><code>@ConditionalOnWebApplication</code></td><td>It is a web app</td></tr>` +
        `</tbody></table>`,
        `<p><strong><code>@ConditionalOnMissingBean</code> is the key to the whole design.</strong> It is why defining your own <code>DataSource</code> bean silently replaces Boot's: the auto-configuration checks whether one already exists and backs off. You override by <em>declaring</em>, not by disabling.</p>`,
        `<h2>Code examples</h2>`,
        `<p>Seeing what Boot decided, which is the actual debugging technique:</p>`,
        `<pre><code class="language-bash"># The condition evaluation report — every auto-config, matched or not, WITH
# the reason. This is the answer to "why is my bean not there?".
java -jar app.jar --debug

# Positive matches:  DataSourceAutoConfiguration matched:
#   - @ConditionalOnClass found 'javax.sql.DataSource'
# Negative matches:  RedisAutoConfiguration:
#   - @ConditionalOnClass did not find required class 'RedisOperations'</code></pre>`,
        `<pre><code class="language-java">// Overriding: just define the bean. @ConditionalOnMissingBean backs off.
@Configuration
public class DataConfig {
    @Bean
    public DataSource dataSource() { return buildCustomPool(); }
}

// Excluding an auto-configuration entirely:
@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)

// Writing your own — this is what every starter is:
@AutoConfiguration
@ConditionalOnClass(PaymentClient.class)
@EnableConfigurationProperties(PaymentProperties.class)
public class PaymentAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean            // ✔ always, so users can override
    public PaymentClient paymentClient(PaymentProperties props) {
        return new PaymentClient(props.url(), props.timeout());
    }
}
// Registered in:
// META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports</code></pre>`,
        `<p>Type-safe configuration, which is better than scattered <code>@Value</code>:</p>`,
        `<pre><code class="language-java">@ConfigurationProperties(prefix = "payment")
@Validated
public record PaymentProperties(
        @NotBlank String url,
        @DefaultValue("5s") Duration timeout,
        @Min(1) int retries) { }

// application.yml
// payment:
//   url: https://api.example.com
//   timeout: 10s
//   retries: 3

// ✔ Validated at STARTUP — a bad value fails the build-out immediately
//   rather than at the first request. Records work as of Boot 3.
// ✘ @Value("\${payment.url}") scatters configuration across the codebase
//   with no validation, no defaults and no IDE completion.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Ordering matters and is explicit.</strong> Auto-configurations run <em>after</em> user configuration — which is what makes <code>@ConditionalOnMissingBean</code> reliable — and can order among themselves with <code>@AutoConfigureBefore</code> and <code>@AutoConfigureAfter</code>. Getting this wrong in a custom starter produces the classic intermittent bug where the override works sometimes.</p>`,
        `<p><strong>The cost is startup time.</strong> Boot evaluates every candidate auto-configuration on every start, which is a measurable part of the "why is Spring Boot slow to start?" complaint. Boot 3's AOT processing addresses this by doing the evaluation at <em>build</em> time and generating the resulting configuration — which is also what makes GraalVM native images feasible for Spring applications (Chapter 1's AOT discussion).</p>`,
        `<p><strong>Property precedence</strong> is worth knowing because it explains "my config is being ignored". Roughly, from highest to lowest: command-line arguments, then <code>SPRING_APPLICATION_JSON</code>, then OS environment variables, then <code>application-{profile}.yml</code>, then <code>application.yml</code>, then defaults. Environment variables beating the YAML file is the one that surprises people, and it is deliberate — it is what makes twelve-factor deployment work.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Treating it as magic.</strong> It is conditions plus classpath — and <code>--debug</code> prints the entire decision.</li>` +
        `<li><strong>Excluding an auto-configuration to override it.</strong> Usually just define the bean; the default backs off.</li>` +
        `<li><strong>Omitting <code>@ConditionalOnMissingBean</code> in a custom starter.</strong> Users cannot override you.</li>` +
        `<li><strong>Components outside the scanned package.</strong> Scanning starts at the main class's package — a bean in a sibling package is invisible.</li>` +
        `<li><strong><code>@Value</code> everywhere.</strong> Use <code>@ConfigurationProperties</code> for validation, defaults and grouping.</li>` +
        `<li><strong>Not knowing property precedence.</strong> Environment variables beat <code>application.yml</code>.</li>` +
        `<li><strong>Using <code>spring.factories</code> on Boot 3.</strong> Replaced by the <code>AutoConfiguration.imports</code> file.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "How does Spring Boot auto-configuration work?"</strong><br>A: Boot ships many <code>@Configuration</code> classes, each guarded by conditions, and registers them in an <code>AutoConfiguration.imports</code> file in each jar. At startup it evaluates the conditions — most commonly <code>@ConditionalOnClass</code>, so behaviour follows the classpath — and applies those that match. Adding a starter puts classes on the classpath, which activates the matching configuration. Nothing is magic; <code>--debug</code> prints the full report with reasons.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you override an auto-configured bean?"</strong><br>A: Usually just define your own. Auto-configurations are annotated <code>@ConditionalOnMissingBean</code> and run after user configuration, so they detect yours and back off. Excluding the auto-configuration outright is a bigger hammer and normally only needed when you want to remove a whole feature.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What does <code>@SpringBootApplication</code> do?"</strong><br>A: It combines three: <code>@SpringBootConfiguration</code>, marking the class as a configuration source; <code>@EnableAutoConfiguration</code>, which triggers the conditional evaluation; and <code>@ComponentScan</code>, which scans the annotated class's package and everything beneath it. That last one is why placing the main class in the root package matters — a component in a sibling package is never found.</p></blockquote>`,
        `<blockquote><p><strong>Q: "<code>@Value</code> or <code>@ConfigurationProperties</code>?"</strong><br>A: <code>@ConfigurationProperties</code> for anything beyond a one-off. It groups related settings into a type, supports validation with <code>@Validated</code> so bad configuration fails at startup rather than at first use, gives defaults and relaxed binding, and works with records in Boot 3. <code>@Value</code> scatters configuration keys through the codebase with no validation and no discoverability.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why is my bean not being picked up?"</strong><br>A: Nine times out of ten it is outside the component-scan root — scanning starts at the main class's package, so anything in a sibling package needs an explicit <code>@ComponentScan</code> or a move. Otherwise: a condition did not match, which <code>--debug</code> will tell you, or a profile excluded it, or the class has no stereotype annotation at all.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What order do configuration sources take?"</strong><br>A: Command-line arguments beat <code>SPRING_APPLICATION_JSON</code>, which beats OS environment variables, which beat profile-specific <code>application-{profile}.yml</code>, which beats <code>application.yml</code>, which beats defaults. The one that surprises people is environment variables outranking the YAML file — which is deliberate, since it is what lets the same artefact be configured per environment.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Auto-config = <strong>conditional <code>@Configuration</code> classes</strong> listed in <code>AutoConfiguration.imports</code> (was <code>spring.factories</code>).</li>` +
        `<li>Driven mostly by <strong><code>@ConditionalOnClass</code></strong> → behaviour follows the classpath.</li>` +
        `<li><strong><code>@ConditionalOnMissingBean</code></strong> = the override hook. Define your bean; the default backs off.</li>` +
        `<li><code>@SpringBootApplication</code> = <code>@SpringBootConfiguration</code> + <code>@EnableAutoConfiguration</code> + <code>@ComponentScan</code>.</li>` +
        `<li><strong>Scanning starts at the main class's package</strong> — the usual "bean not found" cause.</li>` +
        `<li>Debug with <strong><code>--debug</code></strong> — the condition evaluation report gives reasons.</li>` +
        `<li><strong><code>@ConfigurationProperties</code> + <code>@Validated</code></strong> over <code>@Value</code> — fails at startup.</li>` +
        `<li>Precedence: <strong>args &gt; env vars &gt; profile yml &gt; application.yml</strong>.</li>` +
        `<li>Boot 3 <strong>AOT</strong> moves the evaluation to build time — faster start, native images.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Spring MVC: The Request Flow',
      slug: 'spring-mvc-request-flow',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Tracing one HTTP request end to end explains a surprising number of otherwise-baffling behaviours: why a security failure never reaches your <code>@ControllerAdvice</code>, why a validation error produces a 400 you did not write, and why returning a <code>String</code> from <code>@Controller</code> and <code>@RestController</code> does completely different things.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Spring MVC is a <strong>front controller</strong>: every request enters through one servlet, the <code>DispatcherServlet</code>, which orchestrates the rest.</p>`,
        `{{fig:ch11-request-flow.svg|A request passing through the servlet filter chain into the DispatcherServlet then handler mapping then the controller then message converters back out as a response with ControllerAdvice branching off|The filter chain sits BEFORE the DispatcherServlet. That is why Spring Security — which is a filter — rejects a request without any of your exception handling ever running.}}`,
        `<h2>How it works</h2>`,
        `<p>The path: servlet <strong>filters</strong> run first (security, CORS, logging, request wrapping). Then the <code>DispatcherServlet</code> consults <strong>handler mappings</strong> to find the controller method for the URL and verb. <strong>Argument resolvers</strong> then bind the request to the method's parameters — path variables, query parameters, and <code>@RequestBody</code> via an <code>HttpMessageConverter</code>, which is Jackson for JSON. The method runs, and the return value goes back out through a converter. If anything throws, <code>@ControllerAdvice</code> handlers get a chance to translate it.</p>`,
        `<p><strong><code>@RestController</code> is <code>@Controller</code> + <code>@ResponseBody</code></strong>. Without <code>@ResponseBody</code>, a returned <code>String</code> is interpreted as a <em>view name</em> and Spring tries to resolve a template — the source of a great many confusing 404s in code converted from MVC to REST.</p>`,
        `<h2>Code examples</h2>`,
        `<pre><code class="language-java">@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService service;
    public OrderController(OrderService service) { this.service = service; }

    @GetMapping("/{id}")
    public OrderResponse get(@PathVariable String id) {
        return service.find(id)                     // Optional (Chapter 7)
                      .map(OrderResponse::from)
                      .orElseThrow(() -&gt; new OrderNotFoundException(id));
    }

    @GetMapping
    public Page&lt;OrderResponse&gt; list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) String status,
            Pageable pageable) { … }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse create(@Valid @RequestBody CreateOrderRequest req) {
        return OrderResponse.from(service.create(req));
    }
}
// @Valid triggers Bean Validation on the body. A violation throws
// MethodArgumentNotValidException, which Boot already maps to a 400 with a
// structured body — you rarely need to handle it yourself.</code></pre>`,
        `<p>Centralised error handling:</p>`,
        `<pre><code class="language-java">@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(OrderNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorBody notFound(OrderNotFoundException e) {
        return new ErrorBody("ORDER_NOT_FOUND", e.orderId());   // Chapter 6
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity&lt;ErrorBody&gt; invalid(MethodArgumentNotValidException e) {
        var fields = e.getBindingResult().getFieldErrors().stream()
                .collect(toMap(FieldError::getField, FieldError::getDefaultMessage));
        return ResponseEntity.badRequest().body(new ErrorBody("VALIDATION", fields));
    }

    @ExceptionHandler(Exception.class)          // last-resort boundary
    public ResponseEntity&lt;ErrorBody&gt; unexpected(Exception e) {
        log.error("unhandled", e);              // ✔ log with the exception
        return ResponseEntity.internalServerError()
                             .body(new ErrorBody("INTERNAL", null));
        // ✔ never leak the exception message to the client — it can expose
        //   SQL, file paths or internal hostnames.
    }
}

// ⚠ This never sees a Spring Security 401/403 raised in the filter chain,
//   because filters run before the DispatcherServlet. Those are configured
//   with an AuthenticationEntryPoint / AccessDeniedHandler instead.</code></pre>`,
        `<p>Modern Boot 3 note worth knowing:</p>`,
        `<pre><code class="language-java">// Boot 3 defaults error responses to RFC 7807 "problem detail" format,
// and ResponseEntityExceptionHandler produces ProblemDetail objects:
@ExceptionHandler(OrderNotFoundException.class)
public ProblemDetail handle(OrderNotFoundException e) {
    var pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
    pd.setType(URI.create("https://api.example.com/errors/order-not-found"));
    pd.setProperty("orderId", e.orderId());
    return pd;
}</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>The thread model</strong> matters for everything in Chapter 8. Traditional Spring MVC is one thread per request from the servlet container's pool, and that thread is occupied for the whole request — including while it waits on a database or an HTTP call. This is why a slow dependency exhausts the pool and the whole application stops responding, and why pool sizing is a capacity decision rather than a detail. On Java 21, Boot can run those requests on virtual threads (<code>spring.threads.virtual.enabled=true</code>), which removes the constraint entirely — the modern answer to "how do you handle a slow downstream?".</p>`,
        `<p><strong>Filters versus interceptors</strong> is a standard follow-up. Filters are Servlet API, run outside Spring MVC, and see the raw request and response — right for security, CORS and logging. Interceptors are Spring MVC, run inside the <code>DispatcherServlet</code>, and know which handler method was selected — right for anything needing that context, like per-endpoint auditing. If you need the handler, use an interceptor; if you need to sit in front of everything, use a filter.</p>`,
        `<p><strong>Never let exception details reach the client.</strong> A default error page or a leaked <code>getMessage()</code> can expose SQL fragments, file paths, library versions and internal hostnames — all useful to an attacker. Log the detail server-side with the exception object, return a stable error code and a generic message.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Using <code>@Controller</code> for a REST API.</strong> Return values become view names.</li>` +
        `<li><strong>Expecting <code>@ControllerAdvice</code> to catch security errors.</strong> Filters run before the dispatcher.</li>` +
        `<li><strong>Returning entities directly.</strong> Leaks the schema and lazy associations — use a DTO.</li>` +
        `<li><strong>Forgetting <code>@Valid</code>.</strong> The constraints on the DTO are then decorative.</li>` +
        `<li><strong>Leaking exception messages.</strong> Log detail, return a code.</li>` +
        `<li><strong>Business logic in controllers.</strong> Keep them thin — bind, delegate, map.</li>` +
        `<li><strong>Blocking calls without considering the thread pool.</strong> One slow dependency stalls everything.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Walk me through a request in Spring MVC."</strong><br>A: It passes the servlet filter chain first — that is where Spring Security sits. Then the <code>DispatcherServlet</code> takes over: handler mapping selects the controller method from URL and verb, argument resolvers bind path variables, query parameters and the body via an <code>HttpMessageConverter</code>, the method runs, and the return value is serialised back through a converter. If it throws, <code>@ControllerAdvice</code> translates the exception into a status and body.</p></blockquote>`,
        `<blockquote><p><strong>Q: "<code>@Controller</code> vs <code>@RestController</code>?"</strong><br>A: <code>@RestController</code> is <code>@Controller</code> plus <code>@ResponseBody</code> on every method, so return values are serialised into the response body. With plain <code>@Controller</code>, a returned <code>String</code> is treated as a view name and Spring tries to resolve a template — which is the cause of a lot of unexplained 404s when someone converts an MVC controller to REST.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why doesn't my <code>@ControllerAdvice</code> catch authentication failures?"</strong><br>A: Because Spring Security is a servlet filter and filters run before the <code>DispatcherServlet</code>. The request is rejected before any controller or exception handler is involved. Those responses are customised with an <code>AuthenticationEntryPoint</code> for 401s and an <code>AccessDeniedHandler</code> for 403s, in the security configuration rather than in MVC.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Filter or interceptor?"</strong><br>A: A filter when I need to sit in front of everything and work with the raw request and response — security, CORS, request logging, wrapping the body. An interceptor when I need to know which handler method was selected, since it runs inside the <code>DispatcherServlet</code> and has that context — per-endpoint auditing or metrics, for example.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you handle validation?"</strong><br>A: Bean Validation constraints on the request DTO plus <code>@Valid</code> on the parameter. A violation throws <code>MethodArgumentNotValidException</code>, which Boot already maps to a 400 with a structured body, so I usually only add a handler to reshape the response into our error format. Boot 3 makes that easier with RFC 7807 problem details.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is the thread model, and what happens with a slow dependency?"</strong><br>A: One thread per request from the container pool, held for the entire request including all blocking I/O. So a slow downstream call ties up threads until the pool is exhausted and the whole application stops accepting work. Traditionally you would bound it with timeouts and a circuit breaker. On Java 21 with <code>spring.threads.virtual.enabled=true</code>, requests run on virtual threads and the constraint largely disappears.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Path: <strong>filters → DispatcherServlet → handler mapping → argument resolvers → controller → message converter</strong>.</li>` +
        `<li><strong>Security is a filter</strong> → runs before MVC → <code>@ControllerAdvice</code> never sees 401/403.</li>` +
        `<li><code>@RestController</code> = <code>@Controller</code> + <code>@ResponseBody</code>.</li>` +
        `<li><code>@Valid</code> + Bean Validation → <code>MethodArgumentNotValidException</code> → 400 by default.</li>` +
        `<li><strong>Return DTOs, never entities.</strong> Never leak exception messages to clients.</li>` +
        `<li>Filter = raw request, no handler context. Interceptor = inside MVC, knows the handler.</li>` +
        `<li><strong>One thread per request, held across blocking I/O</strong> → Java 21: <code>spring.threads.virtual.enabled=true</code>.</li>` +
        `<li>Boot 3 error format: <strong>RFC 7807 <code>ProblemDetail</code></strong>.</li>` +
        `</ul>`,
      ].join('\n'),
    },
  ],
};
