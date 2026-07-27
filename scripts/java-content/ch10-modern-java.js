/**
 * Java Interview Kit — Chapter 10: Modern Java (11 → 21).
 *
 * The differentiator chapter: almost no free material covers this properly,
 * and it is what separates "I know Java 8" from "I know Java".
 *
 * Baseline is Java 17 LTS; Java 21 features are flagged explicitly.
 *
 * ⚠️ Content strings are TEMPLATE LITERALS — never use a backtick inside them,
 * and always escape ${...} as \${...} or it will be interpolated.
 */
module.exports = {
  title: 'Modern Java (11 → 21)',
  slug: 'modern-java',
  order: 9,
  topics: [
    // ────────────────────────────────────────────────────────────────
    {
      title: 'var, Text Blocks and Small Language Wins',
      slug: 'var-and-text-blocks',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>These are the features you will use every day, and the ones where a bad answer reveals a stale mental model. "Does <code>var</code> make Java dynamically typed?" is asked precisely because the wrong answer is common — and the right answer, that inference happens entirely at compile time, connects to the type erasure and static typing themes from earlier chapters.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p><strong><code>var</code></strong> (Java 10) lets the compiler infer a local variable's type from its initialiser. The variable still has one fixed static type — nothing about the type system changed, only how much you have to type.</p>`,
        `<pre><code class="language-java">var names = new ArrayList&lt;String&gt;();     // ArrayList&lt;String&gt;, inferred
var count = 10;                          // int
// names = new LinkedList&lt;String&gt;();     ✘ still statically typed
// var x;                                ✘ no initialiser, nothing to infer
// var y = null;                         ✘ null has no useful type</code></pre>`,
        `<p><strong>Text blocks</strong> (Java 15) are multi-line string literals delimited by triple quotes, with incidental indentation stripped automatically.</p>`,
        `<h2>How it works</h2>`,
        `<p><strong><code>var</code> is restricted to local variables</strong> — locals, <code>for</code> loop variables, and try-with-resources. It cannot be used for fields, method parameters, return types, or anything else that forms an API, because those types are contracts that should be written down.</p>`,
        `<p>The style guidance that matters: use <code>var</code> when the initialiser makes the type obvious, and write the type when it does not.</p>`,
        `<pre><code class="language-java">var users = new HashMap&lt;String, List&lt;Order&gt;&gt;();   // ✔ obvious, and saves a lot
var order = orderService.find(id);                // ✘ what does find() return?
Optional&lt;Order&gt; order = orderService.find(id);    // ✔ worth spelling out</code></pre>`,
        `<p><strong>Text blocks</strong> compute the common indentation across all lines — including the closing delimiter — and strip it. Moving the closing <code>"""</code> changes the result, which is the one surprising rule.</p>`,
        `<h2>Code examples</h2>`,
        `<pre><code class="language-java">// ✘ Before: escaping, concatenation and manual newlines.
String json = "{\\n" +
              "  \\"name\\": \\"Asha\\",\\n" +
              "  \\"role\\": \\"admin\\"\\n" +
              "}";

// ✔ Text block — no escaping, and the shape is visible in the source.
String json = """
        {
          "name": "Asha",
          "role": "admin"
        }
        """;

// The closing delimiter sets the indentation baseline. Put it further left
// and every line keeps that much leading whitespace.

// \\ escapes the line break (no newline emitted); \\s keeps a trailing space:
String sql = """
        SELECT id, name \\
        FROM users \\
        WHERE active = true""";        // one line, no trailing newline</code></pre>`,
        `<p>The other small wins that come up:</p>`,
        `<pre><code class="language-java">// String methods (Java 11)
"  hi  ".strip();              // Unicode-aware — trim() only handles ASCII
"".isBlank();                  // true — whitespace-only counts
"ab".repeat(3);                // "ababab"
text.lines().filter(...);      // Stream&lt;String&gt;, no split("\\n")

// Files (Java 11) — one line instead of a reader
String content = Files.readString(path);
Files.writeString(path, content);

// Collection factories (Java 9) — immutable, reject nulls
var list = List.of("a", "b");
var map = Map.of("k", 1, "j", 2);
var copy = List.copyOf(mutable);

// Formatted (Java 15) — reads better than String.format when chaining
"Hello %s, you are %d".formatted(name, age);

// Records + var + text blocks together is where modern Java starts to feel
// like a different language from Java 8.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong><code>var</code> is erased entirely at compile time.</strong> The bytecode is identical to writing the type by hand — there is no runtime cost, no reflection difference, and no change to the type system. This is why "Java is now dynamically typed" is wrong: the compiler infers one specific type and enforces it exactly as before.</p>`,
        `<p>One genuinely interesting consequence: <code>var</code> can infer types you <em>cannot write</em>. Assigning an anonymous class to a <code>var</code> gives the variable that anonymous type, so you can call methods declared in it — impossible with a named type. It is a curiosity rather than a technique, but it demonstrates that inference is doing real work.</p>`,
        `<p><strong>Text blocks are ordinary strings</strong> after compilation — the compiler applies indentation stripping and escape processing and emits a normal string constant, which is interned like any other literal. There is no runtime component at all.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Thinking <code>var</code> is dynamic typing.</strong> It is compile-time inference; the type is fixed.</li>` +
        `<li><strong>Using <code>var</code> when the type is not obvious.</strong> It hurts readability at exactly the point where readers need help.</li>` +
        `<li><strong>Trying <code>var</code> on fields or parameters.</strong> Locals only, by design.</li>` +
        `<li><strong><code>var x = new ArrayList&lt;&gt;();</code></strong> — infers <code>ArrayList&lt;Object&gt;</code>, which is almost never intended.</li>` +
        `<li><strong>Misplacing the closing <code>"""</code>.</strong> It sets the indentation baseline.</li>` +
        `<li><strong>Using <code>trim()</code> instead of <code>strip()</code>.</strong> <code>trim()</code> predates Unicode and misses several whitespace characters.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Does <code>var</code> make Java dynamically typed?"</strong><br>A: No. The compiler infers one specific static type from the initialiser and enforces it exactly as if you had written it — you cannot later assign an incompatible value. It is erased at compile time, so the bytecode is identical. It only reduces what you type, not what the type system does.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Where can <code>var</code> be used, and when should it be?"</strong><br>A: Local variables, loop variables and try-with-resources — never fields, parameters or return types, because those are API contracts that deserve explicit types. I use it when the initialiser makes the type obvious, like <code>new HashMap&lt;String, List&lt;Order&gt;&gt;()</code>, and write the type when the right-hand side is a method call whose return type is not evident.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How does indentation work in a text block?"</strong><br>A: The compiler finds the minimum indentation across all lines, including the closing delimiter, and strips it. So moving the closing <code>"""</code> to the left preserves leading whitespace on every line. There is also <code>\\</code> to suppress a line break and <code>\\s</code> to keep a trailing space — both useful for wrapping long SQL without emitting newlines.</p></blockquote>`,
        `<blockquote><p><strong>Q: "<code>strip()</code> or <code>trim()</code>?"</strong><br>A: <code>strip()</code>. <code>trim()</code> dates from Java 1.0 and removes only characters up to U+0020, so it misses several Unicode whitespace characters. <code>strip()</code> is Unicode-aware, and there are <code>stripLeading</code>/<code>stripTrailing</code> variants plus <code>isBlank()</code>, which is the readable way to test for whitespace-only.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><code>var</code> = <strong>compile-time inference</strong>, locals only, erased in bytecode. <strong>Not dynamic typing.</strong></li>` +
        `<li>Use it when the initialiser makes the type obvious; write the type otherwise.</li>` +
        `<li><code>var x = new ArrayList&lt;&gt;()</code> → <code>ArrayList&lt;Object&gt;</code>. Watch the diamond.</li>` +
        `<li>Text blocks: <code>"""</code>, incidental indentation stripped, <strong>closing delimiter sets the baseline</strong>.</li>` +
        `<li><code>\\</code> suppresses the line break; <code>\\s</code> keeps a trailing space.</li>` +
        `<li>Java 11 strings: <code>strip</code> (Unicode) · <code>isBlank</code> · <code>repeat</code> · <code>lines()</code>.</li>` +
        `<li><code>Files.readString</code> / <code>writeString</code>; <code>List.of</code>/<code>Map.of</code>/<code>copyOf</code>; <code>"…".formatted(...)</code>.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Records and Sealed Types',
      slug: 'records-and-sealed-types',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Records eliminate the single most tedious thing in Java — the data class with its constructor, accessors, <code>equals</code>, <code>hashCode</code> and <code>toString</code>. Sealed types are less famous and more interesting: they let the compiler know a hierarchy is complete, which turns a runtime "unhandled case" bug into a compile error. Together they give Java algebraic data types, and they are the modern answer to several questions from earlier chapters.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A <strong>record</strong> (Java 16) is a transparent carrier of immutable data. A <strong>sealed</strong> type (Java 17) declares exactly which types may extend or implement it.</p>`,
        `{{fig:ch10-records-sealed.svg|Left shows a one-line record generating fields accessors equals hashCode and toString; right shows a sealed interface permitting three implementations and rejecting anything else; below an exhaustive switch with no default|The combination is the point. A sealed hierarchy of records gives the compiler both the shape of the data and the complete set of cases, so a switch can be verified exhaustive.}}`,
        `<h2>How it works</h2>`,
        `<p><strong>What a record generates:</strong> private final fields, a canonical constructor, accessor methods named after the components (<code>x()</code> not <code>getX()</code>), plus <code>equals</code>, <code>hashCode</code> and <code>toString</code> derived from all components. Records are implicitly <code>final</code> and cannot extend a class — which neatly sidesteps the <code>equals</code> symmetry problem from Chapter 2.</p>`,
        `<p><strong>Sealed types</strong> require every permitted subtype to be <code>final</code>, <code>sealed</code>, or explicitly <code>non-sealed</code> — so the hierarchy is closed at every level. Permitted subtypes must be in the same package or module.</p>`,
        `<h2>Code examples</h2>`,
        `<pre><code class="language-java">// The whole class:
public record Point(int x, int y) { }

// Compact constructor — validation and normalisation, no field assignment
public record Range(int low, int high) {
    public Range {                                    // no parameter list
        if (low &gt; high) throw new IllegalArgumentException("low &gt; high");
    }
}

// Records can have static factories, extra methods and implement interfaces:
public record Money(long minor, Currency currency) implements Comparable&lt;Money&gt; {
    public static Money ofMajor(long major, Currency c) {
        return new Money(major * 100, c);
    }
    public Money plus(Money other) { return new Money(minor + other.minor, currency); }
    public int compareTo(Money o) { return Long.compare(minor, o.minor); }
}

// ⚠ Shallow immutability: a record component that is a mutable object is
//   still mutable. Copy defensively if it matters.
public record Team(String name, List&lt;String&gt; members) {
    public Team {
        members = List.copyOf(members);      // ✔ reassigning the PARAMETER
    }                                        //   in the compact constructor
}</code></pre>`,
        `<p>Sealed hierarchies, and what they buy:</p>`,
        `<pre><code class="language-java">public sealed interface PaymentResult
        permits Approved, Declined, Pending { }

public record Approved(String txId, Money amount) implements PaymentResult { }
public record Declined(String reason, String code) implements PaymentResult { }
public record Pending(Instant retryAfter) implements PaymentResult { }

// The compiler knows the set is complete, so no default branch is needed —
// and adding a fourth case breaks this switch at COMPILE time, which is
// exactly where you want to find out.
String describe(PaymentResult r) {
    return switch (r) {
        case Approved a -&gt; "approved " + a.txId();
        case Declined d -&gt; "declined: " + d.reason();
        case Pending p  -&gt; "retry after " + p.retryAfter();
    };
}

// Compare with an enum + fields, the old way of modelling this: an enum
// cannot carry different data per case, so you end up with nullable fields
// that are only meaningful for some values.</code></pre>`,
        `<p>Where records are the wrong tool:</p>`,
        `<pre><code class="language-java">// ✘ Not for JPA entities. They need a no-arg constructor, mutable fields and
//   non-final classes for proxying. Records give none of those.
// ✘ Not when you need inheritance — records are implicitly final.
// ✘ Not when fields must change after construction.
// ✔ Ideal for: DTOs, API responses, value objects, method return tuples,
//   map keys (correct equals/hashCode by construction), and the leaves of
//   a sealed hierarchy.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p>A record compiles to a normal <code>final</code> class extending <code>java.lang.Record</code>, with the accessors and the three <code>Object</code> methods generated. <code>equals</code> and <code>hashCode</code> are implemented via <code>invokedynamic</code> into <code>ObjectMethods.bootstrap</code> rather than being spelled out in bytecode, which keeps class files small and lets the implementation improve without recompilation.</p>`,
        `<p><strong>Records are shallowly immutable</strong>, and this is the caveat that matters in review. The <em>reference</em> in each component is final; the object it points at may be perfectly mutable. A record holding an <code>ArrayList</code> hands out that list to every caller. The fix is a defensive copy in the compact constructor — which works because the compact constructor assigns the parameters to the fields <em>after</em> your code runs, so reassigning the parameter is the idiom.</p>`,
        `<p><strong>Sealed types exist to make exhaustiveness checkable.</strong> Without them the compiler must assume any type could implement an interface, so it demands a <code>default</code> branch — and a <code>default</code> silently absorbs the new case you forgot to handle. Sealing turns "I hope I updated every switch" into a build failure, which is the entire value proposition.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Expecting deep immutability.</strong> Mutable components stay mutable — copy in the compact constructor.</li>` +
        `<li><strong>Using records as JPA entities.</strong> No no-arg constructor, no mutability, final class — incompatible.</li>` +
        `<li><strong>Assigning fields in a compact constructor.</strong> Reassign the <em>parameter</em>; the field assignment is generated.</li>` +
        `<li><strong>Expecting <code>getX()</code>.</strong> Accessors are named <code>x()</code>, which some older frameworks do not recognise.</li>` +
        `<li><strong>Forgetting permitted subtypes must be <code>final</code>, <code>sealed</code> or <code>non-sealed</code>.</strong></li>` +
        `<li><strong>Adding a <code>default</code> branch to a sealed switch.</strong> It defeats exhaustiveness checking — the whole point.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is a record and what does it generate?"</strong><br>A: A transparent carrier for immutable data. From the component list the compiler generates private final fields, a canonical constructor, accessors named after the components, and <code>equals</code>, <code>hashCode</code> and <code>toString</code> derived from all of them. Records are implicitly final and cannot extend a class, which is what makes their <code>equals</code> contract safe — the subclass symmetry problem cannot arise.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Are records immutable?"</strong><br>A: Shallowly. The component fields are final, but if a component is a mutable object — a <code>List</code>, a <code>Date</code> — that object can still be modified by anyone holding it. For real immutability you copy defensively in the compact constructor, reassigning the parameter, since the field assignment is generated after your code runs.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What problem do sealed types solve?"</strong><br>A: They tell the compiler the complete set of subtypes, which makes exhaustiveness checkable. Without sealing, a switch over an interface needs a <code>default</code> branch, and that branch silently swallows any new implementation you forgot to handle. With a sealed hierarchy, adding a case breaks every switch that does not handle it — at compile time, which is where you want to discover it.</p></blockquote>`,
        `<blockquote><p><strong>Q: "When would you not use a record?"</strong><br>A: JPA entities, because they need a no-arg constructor, mutable fields and a non-final class for proxying. Anything requiring inheritance, since records are final. And anything whose state must change after construction. For DTOs, API responses, value objects and map keys they are close to ideal.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Records and sealed interfaces together — why?"</strong><br>A: They give Java algebraic data types. The sealed interface defines the closed set of alternatives, and each record defines the data that case carries — which an enum cannot do, since every enum constant shares one shape. Combined with pattern-matching switch you get a total function over the type, verified by the compiler.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Record generates: <strong>final fields · canonical constructor · <code>x()</code> accessors · equals/hashCode/toString</strong>.</li>` +
        `<li>Implicitly <strong>final</strong>, extends <code>java.lang.Record</code>, cannot extend a class.</li>` +
        `<li><strong>Shallowly immutable</strong> — defensive-copy mutable components in the <strong>compact constructor</strong> (reassign the parameter).</li>` +
        `<li>Not for <strong>JPA entities</strong>; ideal for DTOs, value objects, map keys, sealed leaves.</li>` +
        `<li><code>sealed … permits</code>; subtypes must be <code>final</code>, <code>sealed</code> or <code>non-sealed</code>, same package/module.</li>` +
        `<li>Sealed ⇒ <strong>exhaustive switch, no <code>default</code></strong> ⇒ adding a case is a compile error.</li>` +
        `<li>Sealed interface + records = <strong>algebraic data types</strong>, which enums cannot express.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Pattern Matching and Switch Expressions',
      slug: 'pattern-matching',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Pattern matching is the feature that most changes how modern Java <em>reads</em>. The instanceof-cast-use dance, which appears in essentially every Java codebase written before 2021, collapses into one line — and combined with sealed types it turns a category of runtime bug into a compile error. It is also the clearest signal in an interview that you have followed the language past Java 8.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Three related features that arrived together:</p>`,
        `<ul>` +
        `<li><strong>Pattern matching for <code>instanceof</code></strong> (Java 16) — test and bind in one step.</li>` +
        `<li><strong>Switch expressions</strong> (Java 14) — <code>switch</code> that produces a value, with arrow labels and no fall-through.</li>` +
        `<li><strong>Pattern matching for <code>switch</code></strong> (Java 21) — switch on <em>types</em>, with guards and record deconstruction.</li>` +
        `</ul>`,
        `<h2>Code examples</h2>`,
        `<pre><code class="language-java">// ✘ The old dance — the type is written three times.
if (obj instanceof String) {
    String s = (String) obj;
    if (s.length() &gt; 5) return s.toUpperCase();
}

// ✔ Pattern matching: test, cast and bind in one, and "s" is in scope
//   exactly where the compiler knows it is a String.
if (obj instanceof String s &amp;&amp; s.length() &gt; 5) return s.toUpperCase();

// The scoping is genuinely clever — this works too:
if (!(obj instanceof String s)) return "not a string";
return s.toUpperCase();          // ✔ s IS in scope here — the compiler
                                 //   knows the negated branch returned</code></pre>`,
        `<p>Switch expressions, which fix three long-standing problems at once:</p>`,
        `<pre><code class="language-java">// ✘ Old: fall-through by default, mutation, easy to forget a break.
String label;
switch (day) {
    case SATURDAY:
    case SUNDAY: label = "weekend"; break;
    default: label = "weekday";
}

// ✔ New: an expression, no fall-through, exhaustive over an enum so no
//   default is needed — and adding an enum constant breaks the build.
String label = switch (day) {
    case SATURDAY, SUNDAY -&gt; "weekend";
    case MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY -&gt; "weekday";
};

// yield for a multi-statement branch:
int size = switch (kind) {
    case SMALL -&gt; 1;
    case LARGE -&gt; {
        log.info("large requested");
        yield computeLarge();
    }
};</code></pre>`,
        `<p>Pattern matching for switch (Java 21) — the payoff:</p>`,
        `<pre><code class="language-java">sealed interface Shape permits Circle, Square, Rectangle { }
record Circle(double r) implements Shape { }
record Square(double side) implements Shape { }
record Rectangle(double w, double h) implements Shape { }

// Type patterns, no default needed because Shape is sealed:
double area(Shape s) {
    return switch (s) {
        case Circle c    -&gt; Math.PI * c.r() * c.r();
        case Square q    -&gt; q.side() * q.side();
        case Rectangle r -&gt; r.w() * r.h();
    };
}

// Guards with "when", and record DECONSTRUCTION patterns:
String describe(Shape s) {
    return switch (s) {
        case Circle c when c.r() &gt; 100    -&gt; "huge circle";
        case Circle c                     -&gt; "circle of radius " + c.r();
        case Rectangle(double w, double h) when w == h -&gt; "square-ish " + w;
        case Rectangle(double w, double h) -&gt; w + " by " + h;
        case Square q                     -&gt; "square " + q.side();
    };
}
// The Rectangle case destructures the record straight into w and h — no
// accessor calls at all. Order matters: guarded cases must come first,
// and the compiler rejects a case that is unreachable.

// Null is now handleable explicitly instead of throwing:
switch (obj) {
    case null      -&gt; "nothing";
    case String s  -&gt; "string " + s;
    default        -&gt; "other";
}</code></pre>`,
        `<p>Where this replaces a real pattern — the visitor:</p>`,
        `<pre><code class="language-java">// The visitor pattern existed because Java could not switch on type safely.
// A sealed hierarchy plus pattern-matching switch does the same job with
// none of the ceremony, and adding a case still fails at compile time:
//   no accept() method, no Visitor interface, no double dispatch.
// Chapter 14 revisits this when discussing patterns that modern Java retires.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Flow scoping</strong> is what makes <code>instanceof</code> patterns pleasant. The bound variable is in scope precisely where the compiler can prove the test succeeded — including after an early return in the negated branch. It is not a simple block scope; it follows the control flow, which is why the "return if not a String, then use <code>s</code>" example compiles.</p>`,
        `<p><strong>Pattern switches compile to <code>invokedynamic</code></strong> against a bootstrap that performs the type tests, rather than to a chain of <code>instanceof</code> checks. That leaves room for the JIT to optimise dispatch and for the implementation to improve without recompiling your code — the same strategy used for lambdas and for record <code>equals</code>.</p>`,
        `<p><strong>Exhaustiveness is a compile-time proof, with a runtime guard.</strong> When a switch over a sealed type covers every permitted subtype, no <code>default</code> is required. The compiler still emits a synthetic fallback that throws <code>MatchException</code>, to cover the case where the hierarchy was recompiled separately after the switch — a genuinely subtle detail worth knowing.</p>`,
        `<p>One caution: <strong>adding a <code>default</code> branch to a sealed switch silently disables exhaustiveness checking.</strong> The compiler will no longer tell you about a new case, because you claimed to handle everything. Omitting <code>default</code> on a sealed type is not a stylistic choice — it is what buys you the safety.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Adding <code>default</code> to a sealed switch.</strong> Disables the exhaustiveness check that is the whole point.</li>` +
        `<li><strong>Ordering guarded cases after unguarded ones.</strong> The unguarded case matches first; the compiler rejects the unreachable one.</li>` +
        `<li><strong>Mixing <code>:</code> and <code>-&gt;</code> in one switch.</strong> Not allowed — pick one form.</li>` +
        `<li><strong>Forgetting <code>yield</code> in a block branch.</strong> An arrow branch with braces must yield a value.</li>` +
        `<li><strong>Assuming old switches handle null.</strong> Classic switch throws <code>NullPointerException</code>; only a pattern switch can <code>case null</code>.</li>` +
        `<li><strong>Still writing the visitor pattern.</strong> Sealed types plus pattern switch do it with far less code.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is pattern matching for <code>instanceof</code>?"</strong><br>A: It combines the type test, the cast and the variable binding into one expression — <code>if (obj instanceof String s)</code> — so the type is written once instead of three times. The binding uses flow scoping: <code>s</code> is in scope wherever the compiler can prove the test succeeded, which includes the code after an early return in the negated branch.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What do switch expressions improve?"</strong><br>A: Three things. They produce a value, so you stop declaring a variable and mutating it. Arrow labels remove fall-through, which eliminates the forgotten-<code>break</code> bug. And a switch expression over an enum must be exhaustive, so adding a constant breaks the build rather than silently falling to <code>default</code>. <code>yield</code> returns a value from a multi-statement branch.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What does pattern matching for switch add in Java 21?"</strong><br>A: Switching on types rather than constants, with <code>when</code> guards for conditions and record deconstruction patterns that destructure components straight into variables. Combined with sealed types the switch is exhaustive with no <code>default</code>, so adding a new subtype is a compile error in every switch that does not handle it. It also lets you write <code>case null</code> instead of the classic switch's NPE.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why should you avoid <code>default</code> with sealed types?"</strong><br>A: Because it turns off exhaustiveness checking. Once you claim to handle everything, the compiler stops telling you about new subtypes, and the new case silently falls into <code>default</code> — usually doing the wrong thing at run time. Omitting <code>default</code> is what converts "I hope I updated every switch" into a build failure.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Does this replace the visitor pattern?"</strong><br>A: For most uses, yes. Visitor existed because Java had no safe way to switch on type and no way to force handling of every case. A sealed hierarchy with a pattern-matching switch gives both, without the accept methods, the visitor interface or the double dispatch. Visitor still has a place when the operations must be extensible by third parties without touching the hierarchy.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><code>obj instanceof String s</code> — test, cast, bind in one. <strong>Flow scoping</strong>, so it works after an early return.</li>` +
        `<li>Switch <strong>expressions</strong>: arrow labels, <strong>no fall-through</strong>, produce a value, <code>yield</code> in blocks.</li>` +
        `<li>Java 21 pattern switch: <strong>type patterns · <code>when</code> guards · record deconstruction · <code>case null</code></strong>.</li>` +
        `<li>Sealed + patterns ⇒ <strong>exhaustive, no <code>default</code></strong>. Adding a case = compile error.</li>` +
        `<li><strong>Adding <code>default</code> disables exhaustiveness</strong> — do not.</li>` +
        `<li>Guarded cases must precede unguarded ones; unreachable cases are rejected.</li>` +
        `<li>Compiles to <code>invokedynamic</code>; a synthetic <code>MatchException</code> guards separate recompilation.</li>` +
        `<li>Largely <strong>retires the visitor pattern</strong>.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Virtual Threads and Structured Concurrency',
      slug: 'virtual-threads',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Virtual threads (Java 21) are the most consequential change to Java concurrency since Java 5. They invalidate the assumption behind thread pools, reactive programming and much of Chapter 8's advice — not by making that advice wrong, but by removing the constraint it was working around. "How would you write this on Java 21?" is now a standard senior follow-up, and the answer is usually "the simple blocking way, which finally scales".</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A platform thread maps one-to-one onto an OS thread: roughly a megabyte of stack, kernel scheduling, a ceiling of a few thousand. A <strong>virtual thread</strong> is scheduled by the JVM onto a small pool of <em>carrier</em> platform threads, with its stack on the heap and grown on demand.</p>`,
        `{{fig:ch10-virtual-threads.svg|Left shows three platform threads each mapped to an OS kernel thread with a 1MB stack; right shows a million virtual threads multiplexed onto a couple of carrier threads plus a panel of three caveats|The decisive property: when a virtual thread blocks, it unmounts from its carrier and the carrier runs someone else. Blocking stops being expensive, so the whole "never block" discipline becomes unnecessary for I/O.}}`,
        `<p>The API is deliberately unchanged — they are still <code>Thread</code>, still <code>Runnable</code>, still work with <code>try</code>/<code>finally</code>, thread dumps and debuggers. That is the point: existing blocking code scales without being rewritten.</p>`,
        `<h2>Code examples</h2>`,
        `<pre><code class="language-java">// Creating them
Thread.ofVirtual().start(() -&gt; handle(request));
Thread.startVirtualThread(() -&gt; handle(request));

// The executor you will actually use — a NEW virtual thread per task.
// Do not pool them; pooling exists because threads were expensive.
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (var request : requests) {
        executor.submit(() -&gt; handle(request));    // blocking code is fine
    }
}   // close() waits for all tasks — ExecutorService is AutoCloseable in 19+

// A million concurrent tasks, each blocking for a second:
try (var e = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 1_000_000).forEach(i -&gt;
        e.submit(() -&gt; { Thread.sleep(1000); return i; }));
}
// Completes in about a second. With platform threads this is impossible.</code></pre>`,
        `<p>What changes in ordinary code — and what does not:</p>`,
        `<pre><code class="language-java">// ✔ Plain blocking code is now the RIGHT answer for I/O fan-out:
try (var scope = Executors.newVirtualThreadPerTaskExecutor()) {
    Future&lt;Profile&gt; p = scope.submit(() -&gt; fetchProfile(id));   // blocking
    Future&lt;List&lt;Order&gt;&gt; o = scope.submit(() -&gt; fetchOrders(id)); // blocking
    return new Dashboard(p.get(), o.get());
}
// Compare with the CompletableFuture version in Chapter 8 — same concurrency,
// far less machinery, and stack traces that actually mean something.

// ⚠ ThreadLocal still works but is now a memory concern: a million virtual
//   threads means a million copies. Scoped values (preview) address this.

// ⚠ Do NOT pool virtual threads, and do not size anything:
// ✘ Executors.newFixedThreadPool(200, Thread.ofVirtual().factory());</code></pre>`,
        `<p>Structured concurrency (preview in 21, still evolving) — the companion feature:</p>`,
        `<pre><code class="language-java">// The problem it solves: with an executor, if one subtask fails the others
// keep running, and there is no relationship between the tasks and the
// method that started them.
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    Supplier&lt;Profile&gt; profile = scope.fork(() -&gt; fetchProfile(id));
    Supplier&lt;List&lt;Order&gt;&gt; orders = scope.fork(() -&gt; fetchOrders(id));

    scope.join();                  // wait for all
    scope.throwIfFailed();         // propagate the first failure

    return new Dashboard(profile.get(), orders.get());
}   // ✔ If EITHER fails, the other is cancelled automatically. If the caller
    //   is interrupted, both are cancelled. The task tree matches the code.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Mounting and unmounting</strong> is the mechanism. A virtual thread runs on a carrier; when it hits a blocking call the JVM copies its stack to the heap, unmounts it, and gives the carrier to another virtual thread. When the operation completes it is remounted, possibly on a different carrier. The JDK's I/O, locks, and <code>Thread.sleep</code> were all reworked to cooperate with this.</p>`,
        `<p><strong>Pinning</strong> is the caveat to know. In Java 21 a virtual thread inside a <code>synchronized</code> block cannot unmount — it <em>pins</em> its carrier, so a blocking call there ties up a platform thread and can starve the scheduler. The guidance for Java 21 is to prefer <code>ReentrantLock</code> over <code>synchronized</code> in code that blocks. This was substantially fixed in Java 24, so the advice is version-specific — saying so precisely is a good signal.</p>`,
        `<p><strong>They do not help CPU-bound work.</strong> You still have N cores; virtual threads solve <em>waiting</em>, not <em>computing</em>. A CPU-bound workload still wants a pool sized to the cores. Knowing which of the two situations you are in is the whole skill.</p>`,
        `<p><strong>What they make obsolete:</strong> much of the reason for reactive frameworks. Project Reactor and RxJava exist largely to avoid blocking a scarce thread; when blocking is cheap, the reactive style's cost — inverted control flow, unreadable stack traces, difficult debugging — stops being worth paying for most applications. Reactive still wins where you genuinely need backpressure and stream composition. That nuance is a much better answer than "virtual threads killed reactive".</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Pooling virtual threads.</strong> Pools exist because threads were expensive. One per task is the model.</li>` +
        `<li><strong>Expecting CPU-bound speedups.</strong> They solve waiting, not computing.</li>` +
        `<li><strong>Blocking inside <code>synchronized</code> on Java 21.</strong> Pins the carrier — use <code>ReentrantLock</code>.</li>` +
        `<li><strong>Heavy <code>ThreadLocal</code> use.</strong> A million threads means a million copies.</li>` +
        `<li><strong>Assuming the whole stack cooperates.</strong> Some native and JNI calls still pin.</li>` +
        `<li><strong>Removing all bounds.</strong> Cheap threads do not make a downstream database able to take a million connections — you still need a limit, now usually a <code>Semaphore</code>.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What are virtual threads?"</strong><br>A: Lightweight threads scheduled by the JVM rather than the OS. Their stacks live on the heap and grow on demand, so millions are practical, and when one blocks it unmounts from its carrier platform thread, freeing it for other work. The API is unchanged — they are still <code>Thread</code> — so ordinary blocking code scales without being rewritten.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What do they change about how you write concurrent code?"</strong><br>A: Blocking stops being expensive, so the "never block a thread" discipline behind thread pools and reactive programming becomes unnecessary for I/O-bound work. I would use <code>newVirtualThreadPerTaskExecutor</code>, write straightforward blocking calls, and get readable stack traces and debuggable code. Pools remain right for CPU-bound work, where the constraint is cores rather than thread cost.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Should you pool virtual threads?"</strong><br>A: No — pooling exists precisely because platform threads are expensive to create. A virtual thread is cheap, so the model is one per task. If you need to limit concurrency against a downstream resource, use a <code>Semaphore</code> to bound the work rather than a pool to bound the threads; those are different concerns that pooling used to conflate.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is pinning?"</strong><br>A: A virtual thread that cannot unmount from its carrier. In Java 21 that happens inside a <code>synchronized</code> block, so blocking there ties up a platform thread and can starve the scheduler — the guidance was to prefer <code>ReentrantLock</code> in blocking code. It was substantially fixed in Java 24, so the answer depends on the version you are targeting. Some native and JNI frames still pin.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Do virtual threads make reactive programming obsolete?"</strong><br>A: For a large share of its use cases, yes — most reactive code exists to avoid blocking a scarce thread, and it pays for that with inverted control flow, poor stack traces and hard debugging. When blocking is cheap that trade stops making sense. Reactive still wins where you genuinely need backpressure, stream composition or event-driven pipelines; it just stops being the default for "call three services concurrently".</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is structured concurrency?"</strong><br>A: Tying the lifetime of concurrent subtasks to a syntactic scope, so the task tree matches the code structure. With <code>StructuredTaskScope</code>, forked tasks are cancelled automatically if one fails or the caller is interrupted, and the scope cannot be exited until all are complete. It removes the class of bug where a failed request leaves orphaned subtasks running. It is still a preview feature and the API has been evolving.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Virtual thread = <strong>JVM-scheduled, heap stack, M:N onto carriers</strong>. Same <code>Thread</code> API.</li>` +
        `<li>Blocking <strong>unmounts</strong> the virtual thread and frees the carrier → blocking is cheap.</li>` +
        `<li><code>Executors.newVirtualThreadPerTaskExecutor()</code>. <strong>Never pool them.</strong></li>` +
        `<li><strong>No help for CPU-bound work</strong> — still N cores.</li>` +
        `<li><strong>Pinning</strong>: <code>synchronized</code> blocks unmounting in Java 21 → prefer <code>ReentrantLock</code>. Fixed in 24.</li>` +
        `<li><code>ThreadLocal</code> × millions = memory; scoped values are the answer.</li>` +
        `<li>Still bound concurrency against downstreams — use a <code>Semaphore</code>, not a pool.</li>` +
        `<li><strong>Structured concurrency</strong>: <code>StructuredTaskScope</code> ties subtask lifetime to a scope; auto-cancellation.</li>` +
        `<li>Reduces the case for reactive; does not eliminate it (backpressure, stream composition).</li>` +
        `</ul>`,
      ].join('\n'),
    },
  ],
};
