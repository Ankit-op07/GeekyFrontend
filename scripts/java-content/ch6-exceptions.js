/**
 * Java Interview Kit — Chapter 6: Exceptions and Error Handling.
 *
 * ⚠️ Content strings are TEMPLATE LITERALS — never use a backtick inside them,
 * and always escape ${...} as \${...} or it will be interpolated.
 */
module.exports = {
  title: 'Exceptions',
  slug: 'exceptions',
  order: 5,
  topics: [
    // ────────────────────────────────────────────────────────────────
    {
      title: 'The Throwable Hierarchy',
      slug: 'throwable-hierarchy',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Almost every exception question reduces to "where does this sit in the hierarchy, and what does that imply?". Knowing that <code>Error</code> and <code>RuntimeException</code> are unchecked while everything else under <code>Exception</code> is checked tells you what the compiler will demand, what you should catch, and — most importantly — what you should never catch. It also explains why <code>catch (Exception e)</code> is usually wrong and <code>catch (Throwable t)</code> is almost always a bug.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Only objects descending from <code>java.lang.Throwable</code> can be thrown. Below it, two branches with completely different intentions:</p>`,
        `{{fig:ch6-exception-hierarchy.svg|Throwable branching into Error on the left with OutOfMemoryError and StackOverflowError and Exception on the right splitting into checked exceptions like IOException and unchecked RuntimeException like NullPointerException|The checked/unchecked line is not the Error/Exception line. Unchecked means Error OR RuntimeException; everything else under Exception is checked.}}`,
        `<ul>` +
        `<li><strong><code>Error</code></strong> — the JVM or the environment is broken. <code>OutOfMemoryError</code>, <code>StackOverflowError</code>, <code>NoClassDefFoundError</code>. Unchecked, and you should not catch them: there is nothing sensible your code can do.</li>` +
        `<li><strong><code>RuntimeException</code></strong> — a programming mistake. <code>NullPointerException</code>, <code>IllegalArgumentException</code>, <code>IndexOutOfBoundsException</code>. Unchecked, because the fix is to correct the code, not to handle the symptom.</li>` +
        `<li><strong>Everything else under <code>Exception</code></strong> — recoverable conditions outside your control. <code>IOException</code>, <code>SQLException</code>, <code>InterruptedException</code>. Checked: the compiler forces you to declare or handle them.</li>` +
        `</ul>`,
        `<h2>How it works</h2>`,
        `<p>The <strong>handle-or-declare rule</strong> applies only to checked exceptions: a method that can throw one must either catch it or list it in a <code>throws</code> clause. Unchecked exceptions may propagate freely with no declaration.</p>`,
        `<p>When something is thrown, the JVM unwinds the call stack looking for the first <code>catch</code> whose type is compatible. Catch blocks are tried <strong>in source order</strong>, which is why a more general type must come after a more specific one — the reverse does not compile ("alternative has already been caught").</p>`,
        `<p>Every <code>Throwable</code> carries a <strong>stack trace</strong> captured at construction — not at throw. That distinction matters: creating an exception and throwing it later records where it was <em>created</em>. It is also why exception creation is expensive, since capturing a trace walks the stack.</p>`,
        `<p><strong>Chaining</strong> is the mechanism that keeps a root cause alive across abstraction layers. <code>new ServiceException("could not load user", e)</code> stores <code>e</code> as the cause, and the printed trace shows both with a "Caused by:" section. Losing the cause is one of the most common and most costly logging mistakes.</p>`,
        `<h2>Code examples</h2>`,
        `<p>Ordering and multi-catch:</p>`,
        `<pre><code class="language-java">try {
    process(file);
} catch (FileNotFoundException e) {      // ✔ most specific first
    log.warn("missing file {}", file, e);
} catch (IOException e) {                // ✔ broader afterwards
    log.error("I/O failure", e);
}

// ✘ Reversed, this does not compile:
// catch (IOException e) { }
// catch (FileNotFoundException e) { }   → "has already been caught"

// Multi-catch (Java 7+) when the handling is identical. The variable is
// implicitly final, and its static type is the common supertype.
try {
    parseAndSend(payload);
} catch (ParseException | IllegalStateException e) {
    throw new ProcessingException("bad payload", e);
}</code></pre>`,
        `<p>Chaining, and the mistake that destroys it:</p>`,
        `<pre><code class="language-java">// ✘ The original cause is gone. The trace points at your wrapper and the
//   real failure — a connection timeout, say — is unrecoverable.
try {
    repository.load(id);
} catch (SQLException e) {
    throw new ServiceException("could not load user " + id);
}

// ✔ Pass the cause. The trace shows "Caused by: java.sql.SQLException: ..."
try {
    repository.load(id);
} catch (SQLException e) {
    throw new ServiceException("could not load user " + id, e);
}

// ✘ Also destroys it — logging only the message, not the exception:
log.error("failed: " + e.getMessage());       // no stack trace at all
log.error("failed", e);                        // ✔ pass e as the last argument</code></pre>`,
        `<p>What not to catch:</p>`,
        `<pre><code class="language-java">// ✘ Catches Errors too — including OutOfMemoryError and StackOverflowError.
//   The JVM is in an unknown state and you have just decided to continue.
try { work(); } catch (Throwable t) { log.error("oops", t); }

// ✘ Catches every RuntimeException, so genuine bugs are swallowed and
//   the application limps on in a broken state.
try { work(); } catch (Exception e) { /* ignored */ }

// ✔ Catch what you can actually handle, and let the rest propagate.
try { work(); } catch (IOException e) { retryLater(); }

// The one legitimate broad catch: a top-level boundary that must not die —
// a request handler or a worker loop — where you log and return an error.
try {
    handle(request);
} catch (Exception e) {                 // Exception, NOT Throwable
    log.error("request {} failed", request.id(), e);
    return Response.serverError();
}</code></pre>`,
        `<p>The one <code>Error</code> people do catch, and why it is still a bad idea:</p>`,
        `<pre><code class="language-java">// StackOverflowError is "recoverable" in the sense that the stack unwinds —
// but you cannot know how much work was half-completed. Treat it as a bug in
// the recursion, not a condition to handle.
//
// InterruptedException, by contrast, is checked and MUST be handled properly:
try {
    Thread.sleep(1000);
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();   // ✔ restore the interrupt flag
    throw new CancellationException("interrupted while waiting");
}
// Swallowing InterruptedException silently breaks every cancellation
// mechanism above you. Chapter 8 covers why.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Exceptions are expensive, and the cost is the stack trace.</strong> <code>fillInStackTrace()</code> walks the entire call stack at construction. Throwing and catching itself is cheap; capturing the trace is not. This is why exceptions must never be used for control flow in a hot path. If you genuinely need a lightweight signalling exception — a common trick in parsers and stream short-circuits — you can override <code>fillInStackTrace()</code> to do nothing, or use the four-argument <code>Throwable</code> constructor with <code>writableStackTrace = false</code>.</p>`,
        `<p><strong>The stack trace is captured at construction, not at throw.</strong> A pre-allocated or cached exception rethrown from many places will show the original creation site every time — deeply confusing during debugging, and a real hazard with the JIT optimisation below.</p>`,
        `<p><strong>Stack traces can disappear entirely.</strong> HotSpot has an optimisation where a frequently-thrown implicit exception (an NPE or array-index exception from the same site, thrown thousands of times) is recompiled to throw a pre-allocated instance with an <em>empty</em> stack trace. The symptom is a production log full of <code>java.lang.NullPointerException</code> with no trace at all. The fix is <code>-XX:-OmitStackTraceInFastThrow</code>, and knowing this is a strong senior signal because the alternative explanation — "the logging framework is broken" — sends people down a long wrong path.</p>`,
        `<p><strong>Helpful NullPointerExceptions</strong> (Java 14+, on by default since 15) are worth naming as the modern counterweight: instead of "NullPointerException" the JVM now says <em>"Cannot invoke String.length() because the return value of Map.get(Object) is null"</em>, naming the exact expression. It removes most of the guesswork from the commonest exception in Java.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Catching <code>Throwable</code>.</strong> That includes <code>Error</code>. The JVM is broken; continuing is worse than failing.</li>` +
        `<li><strong>Empty catch blocks.</strong> The single worst thing in Java code — the failure happened and nobody will ever know.</li>` +
        `<li><strong>Losing the cause.</strong> Always pass the original exception into the wrapper's constructor.</li>` +
        `<li><strong><code>log.error(e.getMessage())</code>.</strong> Drops the stack trace. Pass the exception itself.</li>` +
        `<li><strong>Log and rethrow.</strong> The same failure gets logged at every layer. Log once, at the boundary that handles it.</li>` +
        `<li><strong>Exceptions for control flow.</strong> Constructing them walks the stack — expensive, and it misuses the mechanism.</li>` +
        `<li><strong><code>e.printStackTrace()</code> in production.</strong> Goes to stderr, unstructured, invisible to your log aggregation.</li>` +
        `<li><strong>Swallowing <code>InterruptedException</code>.</strong> Restore the flag or rethrow; otherwise cancellation silently stops working.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Describe the exception hierarchy."</strong><br>A: <code>Throwable</code> at the root, with two branches. <code>Error</code> means the JVM or environment has failed — <code>OutOfMemoryError</code>, <code>StackOverflowError</code> — and should not be caught. <code>Exception</code> covers application-level problems and splits again: <code>RuntimeException</code> and its subclasses are unchecked and usually indicate bugs, while everything else under <code>Exception</code> is checked and must be declared or handled. So "unchecked" means <code>Error</code> or <code>RuntimeException</code>, which is not the same as the <code>Error</code>/<code>Exception</code> split.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Should you ever catch <code>Error</code>?"</strong><br>A: Essentially never. An <code>Error</code> means something the application cannot fix — memory exhausted, a class missing, the stack blown. Catching it lets a process continue in an unknown state, which usually converts a clean crash into corrupted data. The only defensible case is a top-level handler that logs and then terminates deliberately.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why is catching <code>Exception</code> discouraged?"</strong><br>A: Because it catches every <code>RuntimeException</code> too, so real bugs — an NPE, an illegal argument — get treated as expected conditions and the application continues in a broken state. I catch the specific types I can actually handle. The exception is a genuine boundary, like a request handler or a worker loop, where the process must not die; there I catch <code>Exception</code>, log with the exception object, and return an error — but never <code>Throwable</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is exception chaining and why does it matter?"</strong><br>A: Passing the original exception as the <code>cause</code> when you wrap it, so the printed trace includes a "Caused by:" section with the root failure. Without it you get a wrapper exception pointing at your own code and no indication that the real problem was, say, a connection timeout. It is the difference between a five-minute diagnosis and an afternoon.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Are exceptions expensive?"</strong><br>A: Constructing them is, because <code>fillInStackTrace</code> walks the whole call stack. Throwing and catching is comparatively cheap. So they are fine for exceptional conditions and wrong for control flow in a hot loop. If you truly need a fast signalling exception you can suppress the trace by overriding <code>fillInStackTrace</code> or using the constructor with <code>writableStackTrace = false</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "You see NullPointerExceptions in production with no stack trace. Why?"</strong><br>A: Almost certainly HotSpot's fast-throw optimisation. After the same implicit exception is thrown from one site many times, the JIT recompiles it to throw a pre-allocated instance with an empty trace. Disable it with <code>-XX:-OmitStackTraceInFastThrow</code> to get traces back. It is worth checking before assuming the logging configuration is at fault.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What should you do with <code>InterruptedException</code>?"</strong><br>A: Never swallow it. Either propagate it, or catch it and immediately call <code>Thread.currentThread().interrupt()</code> to restore the flag the catch cleared. If you do neither, code higher up that relies on the interrupt to stop work will never see it, and cancellation and shutdown quietly stop functioning.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><code>Throwable</code> → <code>Error</code> (do not catch) + <code>Exception</code> → <code>RuntimeException</code> (unchecked) and the rest (checked).</li>` +
        `<li><strong>Unchecked = <code>Error</code> or <code>RuntimeException</code></strong>. Everything else is checked.</li>` +
        `<li>Handle-or-declare applies to <strong>checked only</strong>.</li>` +
        `<li>Catch blocks are tried in <strong>source order</strong> — specific before general, or it will not compile.</li>` +
        `<li>Always <strong>chain the cause</strong>; always <code>log.error("msg", e)</code>, never <code>e.getMessage()</code>.</li>` +
        `<li>Never catch <code>Throwable</code>. Never write an empty catch. Never log-and-rethrow.</li>` +
        `<li>Cost is <code>fillInStackTrace</code> — captured at <strong>construction</strong>, not at throw.</li>` +
        `<li>Missing traces in production → <code>-XX:-OmitStackTraceInFastThrow</code>.</li>` +
        `<li><code>InterruptedException</code> → rethrow or <strong>restore the interrupt flag</strong>.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Checked vs Unchecked Exceptions',
      slug: 'checked-vs-unchecked',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>This is a design question disguised as a language question. The mechanical answer — "checked must be declared, unchecked need not" — takes ten seconds. What interviewers actually want is your opinion on <em>when to use which</em>, because that reveals whether you have maintained a large codebase. It is also one of the few places where the wider Java community openly disagrees with the language designers, and knowing that debate is a genuine signal.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p><strong>Checked</strong> exceptions are part of a method's signature. The compiler enforces that every caller either catches them or declares them. The intent was: "this can fail for reasons outside your control, and a caller could plausibly recover."</p>`,
        `<p><strong>Unchecked</strong> exceptions — <code>RuntimeException</code> and <code>Error</code> and their subclasses — need no declaration and propagate silently until something catches them. The intent was: "this is a bug, or the JVM is broken."</p>`,
        `<table><thead><tr><th></th><th>Checked</th><th>Unchecked</th></tr></thead><tbody>` +
        `<tr><td>Extends</td><td><code>Exception</code> (not <code>RuntimeException</code>)</td><td><code>RuntimeException</code> or <code>Error</code></td></tr>` +
        `<tr><td>Compiler</td><td>Must handle or declare</td><td>No requirement</td></tr>` +
        `<tr><td>Intent</td><td>Recoverable, external</td><td>Programming error</td></tr>` +
        `<tr><td>Examples</td><td><code>IOException</code>, <code>SQLException</code></td><td><code>NullPointerException</code>, <code>IllegalArgumentException</code></td></tr>` +
        `<tr><td>In lambdas</td><td>Painful — most functional interfaces forbid them</td><td>Fine</td></tr>` +
        `</tbody></table>`,
        `<h2>How it works</h2>`,
        `<p>The rule is enforced at compile time and interacts with inheritance in a way worth knowing: <strong>an override may throw fewer or narrower checked exceptions, never new or broader ones</strong>. That is Liskov substitution again from Chapter 2 — code written against the parent must keep compiling with a child.</p>`,
        `<pre><code class="language-java">class Parent { void read() throws IOException { } }

class Child extends Parent {
    @Override void read() throws FileNotFoundException { }   // ✔ narrower
}
class Child2 extends Parent {
    @Override void read() { }                                 // ✔ none at all
}
// class Child3 extends Parent {
//     @Override void read() throws Exception { }             ✘ broader — no
// }</code></pre>`,
        `<p><strong>The argument against checked exceptions</strong> is worth being able to state, because most modern Java has quietly taken this side. Three complaints:</p>`,
        `<ol>` +
        `<li><strong>They do not scale.</strong> A checked exception thrown deep in a call chain must be declared by every method between there and the handler, so a low-level change ripples through dozens of signatures.</li>` +
        `<li><strong>They encourage swallowing.</strong> Faced with a forced <code>try/catch</code>, the path of least resistance is an empty block — which is strictly worse than the exception propagating.</li>` +
        `<li><strong>They do not compose with lambdas.</strong> None of the standard functional interfaces declare checked exceptions, so a checked exception inside a stream forces a wrapper.</li>` +
        `</ol>`,
        `<p>The evidence is in the ecosystem: Spring wraps every <code>SQLException</code> in an unchecked <code>DataAccessException</code>, Hibernate throws unchecked, and no language designed after Java has adopted checked exceptions — including Kotlin, which runs on the same JVM and deliberately dropped them.</p>`,
        `<p><strong>The argument for</strong> is real too: a checked exception is documentation the compiler enforces. <code>InterruptedException</code> is a good example — making it checked forces every author to at least consider cancellation, and the alternative would be silent breakage everywhere.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The rippling problem:</p>`,
        `<pre><code class="language-java">// One low-level method starts throwing a checked exception…
String readConfig() throws IOException { … }

// …and every caller up the chain must now declare or handle it.
Config parseConfig() throws IOException { return parse(readConfig()); }
Service buildService() throws IOException { return new Service(parseConfig()); }
void startup() throws IOException { buildService().start(); }
// Four signatures changed because of one implementation detail nobody
// in the middle can do anything about.</code></pre>`,
        `<p>The lambda problem, and the two honest answers:</p>`,
        `<pre><code class="language-java">List&lt;Path&gt; paths = …;

// ✘ Does not compile: Function.apply cannot throw a checked exception.
// paths.stream().map(p -&gt; Files.readString(p)).toList();

// ✔ Option 1 — wrap at the call site. Verbose, but explicit.
paths.stream().map(p -&gt; {
    try {
        return Files.readString(p);
    } catch (IOException e) {
        throw new UncheckedIOException(e);   // the JDK's own answer
    }
}).toList();

// ✔ Option 2 — a small helper, when this happens more than twice.
@FunctionalInterface
interface ThrowingFunction&lt;T, R&gt; { R apply(T t) throws Exception; }

static &lt;T, R&gt; Function&lt;T, R&gt; unchecked(ThrowingFunction&lt;T, R&gt; f) {
    return t -&gt; {
        try { return f.apply(t); }
        catch (Exception e) { throw new RuntimeException(e); }
    };
}
paths.stream().map(unchecked(Files::readString)).toList();

// Note that the JDK shipping UncheckedIOException is a tacit admission that
// checked exceptions do not fit the functional style.</code></pre>`,
        `<p>Designing your own, which is what a follow-up question usually becomes:</p>`,
        `<pre><code class="language-java">// ✔ Unchecked — the caller passed nonsense. This is a bug, not a condition.
public class InvalidOrderException extends RuntimeException {
    public InvalidOrderException(String message) { super(message); }
}

// ✔ Checked — the caller genuinely can and should react, e.g. by offering
//   the customer a different payment method.
public class PaymentDeclinedException extends Exception {
    private final String declineCode;
    public PaymentDeclinedException(String declineCode, Throwable cause) {
        super("payment declined: " + declineCode, cause);
        this.declineCode = declineCode;
    }
    public String declineCode() { return declineCode; }
}

// The test: "is there a realistic action the caller takes on catching this,
// other than logging and giving up?" Yes → consider checked. No → unchecked.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>The JVM does not know about checked exceptions.</strong> It is purely a <code>javac</code> rule. The <code>throws</code> clause is recorded in the class file as an attribute for the compiler's benefit, but the JVM will happily let any exception propagate from anywhere. That is why <strong>sneaky throws</strong> works — a generics trick that throws a checked exception without declaring it, exploited by Lombok's <code>@SneakyThrows</code>:</p>`,
        `<pre><code class="language-java">@SuppressWarnings("unchecked")
static &lt;E extends Throwable&gt; void sneakyThrow(Throwable e) throws E {
    throw (E) e;                 // erasure means E is unchecked at run time
}
// Callable without any throws clause. It works because the cast disappears
// at compile time and the JVM never verifies exception declarations.
// Legal, occasionally useful, and it makes callers unable to see what can fail.</code></pre>`,
        `<p><strong>The practical modern consensus</strong>, which is a good closing line in an interview: default to unchecked for anything the caller cannot meaningfully act on, use checked sparingly for genuine recoverable branches in your own API, and never let a checked exception from a lower layer leak upward unwrapped — translate it at the boundary into something meaningful for that layer, always preserving the cause.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Making every custom exception checked.</strong> Most represent bugs or unrecoverable conditions and should be unchecked.</li>` +
        `<li><strong><code>throws Exception</code> on a signature.</strong> Tells callers nothing and forces them to catch everything.</li>` +
        `<li><strong>Catching a checked exception just to satisfy the compiler.</strong> If you cannot handle it, wrap it with the cause and rethrow.</li>` +
        `<li><strong>Letting <code>SQLException</code> reach the controller.</strong> Translate at the boundary — that is what Spring's <code>DataAccessException</code> does for you.</li>` +
        `<li><strong>Widening <code>throws</code> in an override.</strong> Will not compile, and rightly so.</li>` +
        `<li><strong>Wrapping without the cause.</strong> The most expensive small mistake in the chapter.</li>` +
        `<li><strong>Reaching for sneaky-throws to dodge design.</strong> It hides what can fail from every caller.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Checked vs unchecked exceptions?"</strong><br>A: Checked extend <code>Exception</code> but not <code>RuntimeException</code>, and the compiler forces every caller to catch or declare them — they were meant for recoverable conditions outside the program's control, like I/O failing. Unchecked are <code>RuntimeException</code> and <code>Error</code> subclasses, need no declaration, and signal programming errors or JVM failures. Only <code>javac</code> enforces the distinction; the JVM has no notion of it.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Which would you use for a new exception in your own code?"</strong><br>A: Unchecked by default. The test I apply is whether a caller has a realistic action on catching it beyond logging and giving up. If not — bad argument, invalid state, a downstream service being unreachable — unchecked, because forcing a <code>try/catch</code> just produces empty blocks. If there genuinely is a branch, like a declined payment where the caller offers another method, a checked exception documents that and the compiler enforces it.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Are checked exceptions a good idea?"</strong><br>A: The industry has largely voted no. They do not scale — one low-level change ripples through every signature in the chain; they encourage swallowing, because an empty catch is the easiest way to satisfy the compiler; and they do not work with lambdas, since no standard functional interface declares them. Spring wraps JDBC's <code>SQLException</code> in unchecked <code>DataAccessException</code> for exactly this reason, and Kotlin dropped them entirely. The counter-argument is that they are compiler-enforced documentation, and something like <code>InterruptedException</code> genuinely benefits from that.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you throw a checked exception from a lambda?"</strong><br>A: You cannot directly — the standard functional interfaces do not declare them. Either catch inside the lambda and wrap in an unchecked exception, which is what the JDK's own <code>UncheckedIOException</code> exists for, or define a throwing functional interface and a small adapter that wraps for you. Whichever way, keep the original as the cause.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Can an override change the <code>throws</code> clause?"</strong><br>A: It can narrow it or drop it entirely, but never broaden it — a subclass cannot declare a new or wider checked exception. Otherwise code written against the parent would suddenly fail to compile when handed a child, which is Liskov substitution being enforced by the language. Unchecked exceptions are unrestricted.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is sneaky throws?"</strong><br>A: A trick that throws a checked exception without declaring it, using generics and erasure so the cast disappears at compile time. It works because checked exceptions are a <code>javac</code> rule and the JVM never verifies them — Lombok's <code>@SneakyThrows</code> does exactly this. It is legal, and I would avoid it in shared code because callers can no longer see what a method can fail with.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Checked = extends <code>Exception</code>, not <code>RuntimeException</code> → <strong>handle or declare</strong>.</li>` +
        `<li>Unchecked = <code>RuntimeException</code> / <code>Error</code> → no declaration needed.</li>` +
        `<li><strong>Only <code>javac</code> enforces it</strong> — the JVM has no idea (hence sneaky throws).</li>` +
        `<li>Override may <strong>narrow or drop</strong> <code>throws</code>, never broaden.</li>` +
        `<li>Default to <strong>unchecked</strong>; checked only where the caller has a real branch.</li>` +
        `<li>Lambdas cannot throw checked → wrap (<code>UncheckedIOException</code>) or use a throwing-interface adapter.</li>` +
        `<li>Translate at layer boundaries (Spring's <code>DataAccessException</code>) — <strong>always keep the cause</strong>.</li>` +
        `<li>Never <code>throws Exception</code>. Never an empty catch.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'try, catch, finally and Control Flow',
      slug: 'finally-and-control-flow',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>"What does this print?" questions built on <code>finally</code> are an interview staple, and they are not gotchas for their own sake — the rules they test explain two genuine production bugs: a value modified in <code>finally</code> that mysteriously does not change, and an exception that vanishes without trace. Both have caused real outages.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p><code>finally</code> runs on <strong>every</strong> path out of the <code>try</code> block: normal completion, a caught exception, an uncaught exception on its way up, and <code>return</code>, <code>break</code> or <code>continue</code>. That is its entire purpose — guaranteed cleanup.</p>`,
        `{{fig:ch6-finally-flow.svg|Three columns showing the normal path where catch is skipped the exception path where catch handles it and the return path where the return value is evaluated before finally runs with a warning panel below|The third column is the one that produces interview questions: the return value is computed and saved BEFORE finally runs, so mutating the variable afterwards changes nothing.}}`,
        `<h2>How it works</h2>`,
        `<p>The rule that explains most puzzles: <strong>a <code>return</code> inside <code>try</code> evaluates its expression first, stores the result, then runs <code>finally</code>, then returns the stored result.</strong> Modifying the variable in <code>finally</code> is too late — the value has already been captured.</p>`,
        `<p>The two ways <code>finally</code> genuinely goes wrong:</p>`,
        `<ul>` +
        `<li><strong>A <code>return</code> in <code>finally</code> discards whatever the <code>try</code> was doing</strong> — including an exception in flight. The exception simply disappears.</li>` +
        `<li><strong>A <code>throw</code> in <code>finally</code> replaces the original exception</strong>, so you debug the cleanup failure instead of the real one.</li>` +
        `</ul>`,
        `<p>The only times <code>finally</code> does not run: <code>System.exit()</code>, the JVM crashing, or the thread being killed — all cases where the process is going away regardless.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The classic puzzle:</p>`,
        `<pre><code class="language-java">static int f() {
    int x = 1;
    try {
        return x;          // evaluates x → 1, SAVES it
    } finally {
        x = 2;             // too late — the return value is already 1
    }
}
System.out.println(f());   // 1

// With an object it looks different, and the rule is the same:
static List&lt;String&gt; g() {
    List&lt;String&gt; list = new ArrayList&lt;&gt;();
    try {
        return list;       // saves the REFERENCE
    } finally {
        list.add("x");     // mutating the object the saved reference points at
    }
}
System.out.println(g());   // [x]  — Chapter 1's pass-by-value, again</code></pre>`,
        `<p>The exception-swallowing bug — this one is worth recognising instantly:</p>`,
        `<pre><code class="language-java">static int broken() {
    try {
        throw new RuntimeException("the real failure");
    } finally {
        return 42;         // ✘ DISCARDS the exception entirely
    }
}
System.out.println(broken());   // 42 — the exception vanished without a trace

// Same class of bug, via a throw:
static void alsoBroken() throws IOException {
    try {
        throw new IOException("the real failure");
    } finally {
        cleanup();         // if cleanup() throws, IT propagates and the
    }                      // IOException is lost
}
// Rule: never return or throw from finally. Most linters flag it.</code></pre>`,
        `<p>What <code>finally</code> is actually for, and the modern replacement:</p>`,
        `<pre><code class="language-java">// Legitimate use — releasing something that must be released.
lock.lock();
try {
    doWork();
} finally {
    lock.unlock();        // ✔ runs even if doWork() throws
}

// For anything AutoCloseable, prefer try-with-resources (next topic),
// which generates the finally correctly and handles suppressed exceptions.</code></pre>`,
        `<p>And <code>try</code>/<code>finally</code> with no <code>catch</code>, which is often the right shape:</p>`,
        `<pre><code class="language-java">// "I cannot handle this, but I must clean up." The exception propagates
// untouched, which is exactly right — no catch block needed.
void process() throws IOException {
    startTransaction();
    try {
        doWork();
    } finally {
        endTransaction();
    }
}</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><code>finally</code> has no dedicated bytecode instruction. The compiler <strong>duplicates the <code>finally</code> block</strong> onto every exit path — after the try body, inside each catch, and in a synthetic catch-all handler that rethrows. That is why a large <code>finally</code> block genuinely increases method size, and it explains the semantics exactly: since the block is copied after the return value has been computed, mutating the variable cannot affect it.</p>`,
        `<p>The historical footnote worth knowing is <code>jsr</code>/<code>ret</code> — the original bytecode instructions for subroutines, used for <code>finally</code> in early Java. They were so difficult for the verifier to reason about that they became a source of security bugs, and they were deprecated; modern <code>javac</code> uses duplication instead.</p>`,
        `<p><strong><code>return</code> versus <code>break</code>/<code>continue</code></strong> follows the same rule: any control transfer out of the <code>try</code> triggers <code>finally</code> first. And nesting behaves as you would expect — an inner <code>finally</code> runs before an outer one as the exception unwinds outward.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong><code>return</code> inside <code>finally</code>.</strong> Silently discards exceptions. Never do it.</li>` +
        `<li><strong>Throwing from <code>finally</code>.</strong> Replaces the real exception with the cleanup failure.</li>` +
        `<li><strong>Expecting a mutation in <code>finally</code> to change a returned primitive.</strong> The value was captured first.</li>` +
        `<li><strong>Closing resources by hand in <code>finally</code>.</strong> Use try-with-resources — it gets the nesting and suppression right.</li>` +
        `<li><strong>Assuming <code>finally</code> always runs.</strong> <code>System.exit()</code> and a JVM crash skip it.</li>` +
        `<li><strong>Heavy logic in <code>finally</code>.</strong> It is duplicated onto every exit path and runs during exception unwinding. Keep it to cleanup.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "When does <code>finally</code> not run?"</strong><br>A: When the JVM stops — <code>System.exit()</code>, a hard crash, or the thread being killed. Otherwise it runs on every path: normal completion, a caught exception, an exception propagating out, and <code>return</code>, <code>break</code> or <code>continue</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "<code>int x = 1; try { return x; } finally { x = 2; }</code> — what is returned?"</strong><br>A: 1. The <code>return</code> expression is evaluated and the value stored before <code>finally</code> executes, so assigning to <code>x</code> afterwards has no effect on what was already captured. If the return were an object reference, mutating the object <em>would</em> be visible — because the saved reference still points at it — but reassigning the variable would not.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What happens if you return from <code>finally</code>?"</strong><br>A: It overrides everything the <code>try</code> was doing, including an exception in flight — the exception is discarded entirely and the caller sees a normal return. It is one of the few genuinely silent failure modes in Java, and it is why linters flag any <code>return</code> or <code>throw</code> inside a <code>finally</code> block.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Can you have <code>try</code> without <code>catch</code>?"</strong><br>A: Yes — <code>try</code>/<code>finally</code> with no <code>catch</code> is perfectly valid and often the right shape: it says "I cannot handle this failure, but I must clean up", and the exception propagates untouched. You need at least one of <code>catch</code> or <code>finally</code>, or, since Java 7, a resource specification.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How is <code>finally</code> implemented?"</strong><br>A: There is no bytecode instruction for it. The compiler duplicates the block onto every exit path — after the try body, inside each catch, and in a synthetic catch-all that rethrows. That duplication is exactly why the return value is fixed before the block runs. Early Java used <code>jsr</code>/<code>ret</code> subroutines instead, but they were hard to verify and were dropped.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><code>finally</code> runs on <strong>every</strong> exit: normal, caught, uncaught, <code>return</code>/<code>break</code>/<code>continue</code>.</li>` +
        `<li>Skipped only by <code>System.exit()</code>, JVM crash, thread kill.</li>` +
        `<li><strong>Return value is evaluated and saved BEFORE <code>finally</code> runs.</strong></li>` +
        `<li>Mutating the returned <em>object</em> is visible; reassigning the <em>variable</em> is not.</li>` +
        `<li><strong>Never <code>return</code> or <code>throw</code> from <code>finally</code></strong> — it discards the real exception.</li>` +
        `<li><code>try</code>/<code>finally</code> with no <code>catch</code> is valid and often correct.</li>` +
        `<li>Implemented by <strong>duplicating the block</strong> onto each exit path — keep it small.</li>` +
        `<li>For closeable things, use <strong>try-with-resources</strong> instead.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'try-with-resources and Suppressed Exceptions',
      slug: 'try-with-resources',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Before Java 7, closing resources correctly took about nine lines of nested <code>try</code>/<code>finally</code> that almost nobody wrote properly — and getting it wrong either leaked file handles and connections or destroyed the exception that told you what really failed. try-with-resources reduces it to one line and fixes a problem most people did not know they had. The suppressed-exception mechanism it introduced is the part interviewers use to separate people who use the syntax from people who understand it.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Declare resources in parentheses after <code>try</code>, and the compiler generates the <code>close()</code> calls for you — in a hidden <code>finally</code>, in reverse order of declaration, and without losing the original exception.</p>`,
        `{{fig:ch6-try-with-resources.svg|Left panel shows manual finally where close throws and replaces the original IOException; right panel shows try-with-resources where the body exception propagates and the close exception is attached as suppressed|The bug on the left is easy to miss and expensive: when both the body and close() fail, the manual version reports the cleanup failure and silently loses the real cause.}}`,
        `<p>Any resource must implement <code>AutoCloseable</code> — a single-method interface added in Java 7. <code>Closeable</code> (from <code>java.io</code>) extends it and narrows <code>close()</code> to throw only <code>IOException</code>.</p>`,
        `<h2>How it works</h2>`,
        `<p>Three guarantees, and all three matter:</p>`,
        `<ol>` +
        `<li><strong><code>close()</code> is always called</strong>, on every exit path, exactly as a <code>finally</code> would.</li>` +
        `<li><strong>Resources close in reverse order of declaration</strong> — the last opened is the first closed. That is the correct order when later resources wrap earlier ones, as a <code>BufferedReader</code> wraps a <code>FileReader</code>.</li>` +
        `<li><strong>The body's exception wins.</strong> If the body throws <em>and</em> <code>close()</code> throws, the body's exception propagates and <code>close()</code>'s is attached to it as a <em>suppressed</em> exception, retrievable with <code>getSuppressed()</code>. Nothing is silently lost.</li>` +
        `</ol>`,
        `<p>That third point is the reason the feature exists. In a hand-written <code>finally</code>, an exception from <code>close()</code> <em>replaces</em> the one from the body — so a failure to flush a buffer masks the real error that caused it.</p>`,
        `<h2>Code examples</h2>`,
        `<p>Before and after:</p>`,
        `<pre><code class="language-java">// ✘ Java 6 style — and this is the version that is actually correct.
// Most hand-written code was simpler than this, and wrong.
InputStream in = null;
OutputStream out = null;
try {
    in = new FileInputStream(src);
    out = new FileOutputStream(dst);
    copy(in, out);
} finally {
    try {
        if (in != null) in.close();
    } finally {
        if (out != null) out.close();     // must still run if in.close() threw
    }
}

// ✔ Java 7+ — same guarantees, plus suppression, in three lines.
try (InputStream in = new FileInputStream(src);
     OutputStream out = new FileOutputStream(dst)) {
    copy(in, out);
}   // out.close() then in.close(), automatically</code></pre>`,
        `<p>Suppressed exceptions, made visible:</p>`,
        `<pre><code class="language-java">class Failing implements AutoCloseable {
    public void close() { throw new IllegalStateException("close failed"); }
}

try {
    try (Failing f = new Failing()) {
        throw new RuntimeException("body failed");
    }
} catch (Exception e) {
    System.out.println(e.getMessage());                    // body failed
    System.out.println(e.getSuppressed()[0].getMessage()); // close failed
}
// Both survive. With a manual finally, "body failed" would be gone and you
// would spend the afternoon investigating the close() failure.</code></pre>`,
        `<p>The Java 9 improvement people often miss:</p>`,
        `<pre><code class="language-java">// Java 7/8 — a resource created elsewhere had to be reassigned to a
// new local just to be managed:
Connection conn = pool.get();
try (Connection c = conn) { … }         // clumsy

// Java 9+ — an effectively final variable can be used directly:
Connection conn = pool.get();
try (conn) {
    conn.commit();
}   // conn.close() still generated</code></pre>`,
        `<p>Real-world shape, and a caveat worth knowing:</p>`,
        `<pre><code class="language-java">try (Connection conn = dataSource.getConnection();
     PreparedStatement ps = conn.prepareStatement(SQL);
     ResultSet rs = ps.executeQuery()) {
    while (rs.next()) process(rs);
}   // rs, then ps, then conn — exactly the right order

// ⚠ Files.lines() returns a Stream that HOLDS AN OPEN FILE HANDLE. It is
// AutoCloseable and must be closed, which is easy to forget because most
// streams need no closing:
try (Stream&lt;String&gt; lines = Files.lines(path)) {
    lines.filter(l -&gt; !l.isBlank()).forEach(this::handle);
}
// Without the try-with-resources, the descriptor leaks until GC.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p>The compiler expands the construct into nested <code>try</code>/<code>finally</code> blocks with a temporary variable holding the primary exception. Roughly: if the body throws, remember that exception; then call <code>close()</code> inside its own <code>try</code>, and if <em>that</em> throws, call <code>addSuppressed</code> on the remembered exception rather than letting the new one escape. You can see the generated shape with <code>javap -c</code>, and it is the code nobody wrote by hand correctly.</p>`,
        `<p><strong><code>AutoCloseable</code> versus <code>Closeable</code></strong> is a small but real interview question. <code>AutoCloseable.close()</code> declares <code>throws Exception</code>, so it can be implemented by anything. <code>Closeable</code> predates it, extends it, narrows the declaration to <code>IOException</code>, and is documented as idempotent — calling <code>close()</code> twice is harmless. <code>AutoCloseable</code> makes no such promise, though the javadoc strongly recommends implementations be idempotent.</p>`,
        `<p><strong>Design guidance for your own resources:</strong> make <code>close()</code> idempotent, and do not let it throw if you can avoid it — an exception from <code>close()</code> is nearly always less interesting than whatever the body was doing, and although suppression preserves it, most logging setups only print the primary exception's message. Where <code>close()</code> genuinely can fail in a way that matters — flushing a buffered write, committing a transaction — that is a reason to make the flush or commit an explicit call in the body rather than a side effect of closing.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Still writing manual <code>finally</code> blocks.</strong> Use try-with-resources for anything <code>AutoCloseable</code>.</li>` +
        `<li><strong>Forgetting <code>Files.lines()</code> and <code>Files.walk()</code> hold file handles.</strong> They are <code>AutoCloseable</code> streams and must be closed.</li>` +
        `<li><strong>Closing manually inside the block.</strong> The generated <code>close()</code> still runs — hence the idempotency requirement.</li>` +
        `<li><strong>Assuming declaration order is close order.</strong> It is the reverse, deliberately.</li>` +
        `<li><strong>Ignoring suppressed exceptions when logging.</strong> Most frameworks print them, but a hand-rolled handler that only logs <code>getMessage()</code> loses them.</li>` +
        `<li><strong>A <code>close()</code> that throws routinely.</strong> It buries the real failure behind a cleanup error.</li>` +
        `<li><strong>Declaring an unused resource just to close it (pre-Java 9).</strong> On Java 9+ use <code>try (existingVar)</code>.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is try-with-resources and what problem does it solve?"</strong><br>A: It declares resources in parentheses after <code>try</code>, and the compiler generates the <code>close()</code> calls in a hidden <code>finally</code>. It solves two problems: the boilerplate of correct nested cleanup, which almost nobody wrote properly, and exception masking — in a hand-written <code>finally</code>, an exception from <code>close()</code> replaces the body's exception and destroys the real diagnosis.</p></blockquote>`,
        `<blockquote><p><strong>Q: "In what order are resources closed?"</strong><br>A: Reverse order of declaration — last opened, first closed. That is correct for wrapping, where a <code>BufferedReader</code> declared after a <code>FileReader</code> must be closed before it, and for JDBC, where the <code>ResultSet</code> must close before the <code>Statement</code> and the <code>Connection</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is a suppressed exception?"</strong><br>A: If the try body throws and <code>close()</code> also throws, the body's exception propagates and <code>close()</code>'s is attached to it via <code>addSuppressed</code>. You read them with <code>getSuppressed()</code>, and stack traces print them under a "Suppressed:" heading. It exists so that neither exception is lost, which is exactly what the old manual pattern got wrong.</p></blockquote>`,
        `<blockquote><p><strong>Q: "<code>AutoCloseable</code> or <code>Closeable</code>?"</strong><br>A: <code>AutoCloseable</code> is the Java 7 interface try-with-resources works with, and its <code>close()</code> declares <code>throws Exception</code> so anything can implement it. <code>Closeable</code> is the older <code>java.io</code> interface, now extending <code>AutoCloseable</code>, narrowing the declaration to <code>IOException</code> and documenting <code>close()</code> as idempotent. Implement <code>AutoCloseable</code> for a general resource; you get <code>Closeable</code> for free with I/O types.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is a resource you might forget to close?"</strong><br>A: <code>Files.lines()</code> and <code>Files.walk()</code> — they return streams backed by an open file handle. Because almost no other stream needs closing, people use them like an ordinary stream and leak descriptors until GC runs, which on a busy server shows up as "too many open files". Both must be used inside try-with-resources.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Can you use a variable declared outside the try?"</strong><br>A: Since Java 9, yes — <code>try (existingResource) { … }</code> works as long as the variable is final or effectively final. Before that you had to reassign it to a fresh local inside the parentheses, which was pure ceremony.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><code>try (Resource r = …) { }</code> → <code>close()</code> generated in a hidden <code>finally</code>.</li>` +
        `<li>Closed in <strong>reverse declaration order</strong>.</li>` +
        `<li>Body exception <strong>wins</strong>; <code>close()</code>'s is attached via <code>addSuppressed()</code>.</li>` +
        `<li>Resource must implement <strong><code>AutoCloseable</code></strong> (<code>Closeable</code> = I/O, <code>IOException</code>, idempotent).</li>` +
        `<li>Java 9+: <code>try (effectivelyFinalVar) { }</code> — no re-declaration.</li>` +
        `<li>Make your <code>close()</code> <strong>idempotent</strong> and non-throwing where possible.</li>` +
        `<li>⚠ <code>Files.lines()</code> / <code>Files.walk()</code> hold file handles — always close them.</li>` +
        `<li>Never hand-write the <code>finally</code> version again.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Designing Custom Exceptions',
      slug: 'custom-exceptions',
      order: 4,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Exception design is one of the clearest windows into how someone writes production code. Anyone can subclass <code>RuntimeException</code>; what interviewers listen for is whether you know when <em>not</em> to, what belongs in an exception besides a message, and how exceptions should change shape as they cross layers. It is also directly practical: a well-designed exception turns a support ticket into a two-minute fix.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A custom exception is worth creating when callers need to <strong>distinguish</strong> this failure from others — to catch it specifically, to map it to a particular HTTP status, or to retry only this case. If nobody will ever catch it by type, a standard exception with a good message is better.</p>`,
        `<p>The JDK already covers most situations, and reaching for the standard type is usually the right call:</p>`,
        `<table><thead><tr><th>Situation</th><th>Use</th></tr></thead><tbody>` +
        `<tr><td>Bad argument value</td><td><code>IllegalArgumentException</code></td></tr>` +
        `<tr><td>Wrong object state for the call</td><td><code>IllegalStateException</code></td></tr>` +
        `<tr><td>Null where it is not allowed</td><td><code>NullPointerException</code> (via <code>Objects.requireNonNull</code>)</td></tr>` +
        `<tr><td>Index out of range</td><td><code>IndexOutOfBoundsException</code></td></tr>` +
        `<tr><td>Operation not supported</td><td><code>UnsupportedOperationException</code></td></tr>` +
        `<tr><td>A domain concept callers act on</td><td><strong>Your own exception</strong></td></tr>` +
        `</tbody></table>`,
        `<h2>How it works</h2>`,
        `<p>A well-formed exception has four properties:</p>`,
        `<ol>` +
        `<li><strong>The right supertype.</strong> Unchecked unless the caller has a real branch (previous topic).</li>` +
        `<li><strong>A cause constructor.</strong> Always provide <code>(String message, Throwable cause)</code>, or the root cause will be lost the first time someone wraps something.</li>` +
        `<li><strong>Structured data, not just a message.</strong> If a handler needs the order id or the decline code, expose it as a field with an accessor — parsing it back out of a message string is a bug waiting to happen.</li>` +
        `<li><strong>A message that identifies the instance.</strong> "Order not found" is useless; "Order 88421 not found for customer 3310" is a diagnosis.</li>` +
        `</ol>`,
        `<p><strong>Exception hierarchies</strong> are how you let callers choose their granularity: a base <code>OrderException</code> with <code>OrderNotFoundException</code> and <code>OrderAlreadyShippedException</code> beneath it means a caller can catch the specific case it handles or the base type for everything else.</p>`,
        `<h2>Code examples</h2>`,
        `<p>A well-designed exception:</p>`,
        `<pre><code class="language-java">public class InsufficientFundsException extends RuntimeException {
    private final String accountId;
    private final BigDecimal balance;
    private final BigDecimal requested;

    public InsufficientFundsException(String accountId, BigDecimal balance, BigDecimal requested) {
        // ✔ A message that identifies the exact instance of the problem.
        super("Account %s has %s but %s was requested".formatted(accountId, balance, requested));
        this.accountId = accountId;
        this.balance = balance;
        this.requested = requested;
    }

    // ✔ Structured accessors — a handler can build a response without
    //   parsing the message string.
    public String accountId() { return accountId; }
    public BigDecimal shortfall() { return requested.subtract(balance); }
}

// The caller can now do something genuinely useful:
catch (InsufficientFundsException e) {
    return Response.status(402)
        .body(Map.of("shortfall", e.shortfall(), "account", e.accountId()));
}</code></pre>`,
        `<p>A hierarchy, so callers pick their own granularity:</p>`,
        `<pre><code class="language-java">public abstract class OrderException extends RuntimeException {
    private final String orderId;
    protected OrderException(String orderId, String message, Throwable cause) {
        super(message, cause);            // ✔ cause always available
        this.orderId = orderId;
    }
    public String orderId() { return orderId; }
}

public class OrderNotFoundException extends OrderException { … }
public class OrderAlreadyShippedException extends OrderException { … }

// Specific handling where it matters, blanket handling where it does not:
try {
    orders.cancel(id);
} catch (OrderAlreadyShippedException e) {
    return refundInstead(e.orderId());        // a real, different action
} catch (OrderException e) {
    return Response.badRequest(e.getMessage());
}</code></pre>`,
        `<p>Translating at layer boundaries — the pattern that keeps a codebase clean:</p>`,
        `<pre><code class="language-java">// Repository: a database concern becomes a domain concern. Callers above
// this line should never see SQLException — they cannot do anything with it.
public Order findById(String id) {
    try {
        return jdbc.queryForObject(SQL, mapper, id);
    } catch (EmptyResultDataAccessException e) {
        throw new OrderNotFoundException(id, "no order " + id, e);   // ✔ cause kept
    }
}

// Controller: a domain concern becomes an HTTP concern.
@ExceptionHandler(OrderNotFoundException.class)
public ResponseEntity&lt;?&gt; handle(OrderNotFoundException e) {
    return ResponseEntity.status(404).body(new ErrorBody("ORDER_NOT_FOUND", e.orderId()));
}
// Each layer speaks its own vocabulary, and the cause chain preserves the
// whole story for the logs.</code></pre>`,
        `<p>Validation, where the standard types are better than custom ones:</p>`,
        `<pre><code class="language-java">public Order(String id, BigDecimal total, Customer customer) {
    // ✔ Objects.requireNonNull throws NPE with a useful message and reads well.
    this.customer = Objects.requireNonNull(customer, "customer");
    if (id == null || id.isBlank())
        throw new IllegalArgumentException("id must not be blank");
    if (total.signum() &lt; 0)
        throw new IllegalArgumentException("total must not be negative: " + total);
    this.id = id;
    this.total = total;
}
// No custom exception needed — nobody catches "the caller passed rubbish"
// by type. It is a bug, and the standard types say so clearly.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Exceptions are serialisable</strong>, because <code>Throwable</code> implements <code>Serializable</code>. If your exception has fields, they must be serialisable too or serialising it will fail — which matters for anything crossing a remote boundary, and is a reason to keep fields to simple values.</p>`,
        `<p><strong>The four-argument <code>Throwable</code> constructor</strong> (Java 7) lets you disable suppression and stack-trace writability. That is the supported way to build a cheap control-flow exception where profiling shows construction cost matters — for instance a parser that throws to unwind. Reach for it rarely, and never for exceptions a human will read in a log.</p>`,
        `<p><strong>Do not put secrets in messages.</strong> Exception messages end up in logs, in error responses, and sometimes in front of users. An exception that helpfully includes the connection string or the token that failed has just written a credential to disk. Include identifiers, not payloads.</p>`,
        `<p><strong>A note on the modern alternative:</strong> for expected, non-exceptional outcomes — "user not found" during a lookup that routinely misses — returning <code>Optional</code> or a sealed result type is often better than throwing. Exceptions are for the exceptional; a miss that happens on half of all calls is a normal outcome, and modelling it as a return value makes it impossible for a caller to forget.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Creating an exception nobody catches by type.</strong> If it is never distinguished, a standard exception with a good message is better.</li>` +
        `<li><strong>Omitting the cause constructor.</strong> Guarantees a lost root cause eventually.</li>` +
        `<li><strong>Data only in the message.</strong> Handlers end up parsing strings. Expose fields.</li>` +
        `<li><strong>Vague messages.</strong> "Operation failed" tells nobody anything. Name the entity and the values.</li>` +
        `<li><strong>Leaking layer-specific exceptions upward.</strong> A controller should never catch <code>SQLException</code>.</li>` +
        `<li><strong>Secrets or PII in messages.</strong> They go straight into logs.</li>` +
        `<li><strong>Exceptions for ordinary outcomes.</strong> Use <code>Optional</code> or a result type for the common "not found".</li>` +
        `<li><strong>A deep hierarchy for its own sake.</strong> Two levels is usually plenty.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "When would you create a custom exception?"</strong><br>A: When callers need to distinguish this failure from others — to catch it specifically, map it to a status code, or retry only this case. If nobody will catch it by type, I use a standard exception with a precise message instead. Creating a class per failure mode adds vocabulary the codebase has to carry with no benefit.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What makes a good exception class?"</strong><br>A: The right supertype — unchecked unless the caller has a real branch; a constructor that accepts a cause, so wrapping never loses the root; structured fields with accessors rather than data buried in the message; and a message that identifies the specific instance, with ids and values rather than "operation failed".</p></blockquote>`,
        `<blockquote><p><strong>Q: "Should exceptions cross layer boundaries?"</strong><br>A: No — they should be translated. A repository turns <code>SQLException</code> into a domain exception like <code>OrderNotFoundException</code>; a controller turns that into an HTTP status. Each layer speaks its own vocabulary, and chaining the cause keeps the full story for the logs. Spring's <code>DataAccessException</code> hierarchy exists to do exactly this for persistence.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Exception or <code>Optional</code> for 'not found'?"</strong><br>A: Depends whether it is exceptional. If a lookup routinely misses — checking whether a user exists — <code>Optional</code> is better, because the caller cannot ignore it and there is no stack-trace cost on a normal path. If the absence genuinely indicates a broken invariant, such as a foreign key pointing at nothing, an exception is right. The smell is throwing an exception on a path that executes half the time.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Should a custom exception be checked or unchecked?"</strong><br>A: Unchecked unless the caller has a concrete alternative action. My test is: can I write the catch block that does something other than log and give up? For a declined payment where the caller offers another method, checked is defensible. For "the order is invalid", unchecked — forcing a <code>try/catch</code> there produces empty blocks, not better handling.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Any risks in exception messages?"</strong><br>A: Yes — they end up in logs and sometimes in API responses. Including a connection string, a token or personal data writes it somewhere it should not be, and log aggregation spreads it further. I include identifiers and values needed to diagnose, never credentials or payloads. Exceptions are also serialisable, so any field you add must be serialisable too.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Create one only when callers <strong>catch it by type</strong>. Otherwise use a standard exception.</li>` +
        `<li>Standard first: <code>IllegalArgumentException</code>, <code>IllegalStateException</code>, <code>Objects.requireNonNull</code>, <code>UnsupportedOperationException</code>.</li>` +
        `<li>Always provide a <strong>(message, cause)</strong> constructor.</li>` +
        `<li><strong>Structured fields + accessors</strong>, not data parsed out of the message.</li>` +
        `<li>Messages name the <strong>entity and values</strong>; never secrets or PII.</li>` +
        `<li><strong>Translate at layer boundaries</strong>, keeping the cause chain.</li>` +
        `<li>Two levels of hierarchy is usually enough.</li>` +
        `<li>Routine "not found"? Prefer <strong><code>Optional</code></strong> over an exception.</li>` +
        `</ul>`,
      ].join('\n'),
    },
  ],
};
