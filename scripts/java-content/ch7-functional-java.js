/**
 * Java Interview Kit — Chapter 7: Java 8+ Functional Java.
 *
 * The second-heaviest interview chapter after collections. Streams, lambdas and
 * Optional appear in essentially every modern Java interview.
 *
 * ⚠️ Content strings are TEMPLATE LITERALS — never use a backtick inside them,
 * and always escape ${...} as \${...} or it will be interpolated.
 */
module.exports = {
  title: 'Java 8+ Functional Java',
  slug: 'functional-java',
  order: 6,
  topics: [
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Lambdas and Functional Interfaces',
      slug: 'lambdas-and-functional-interfaces',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Lambdas changed how Java is written, and the questions about them are rarely about syntax. Interviewers ask what a lambda compiles to (not an anonymous class), what <code>this</code> refers to inside one (not the lambda), and why a lambda cannot capture a mutable local. Each answer reveals whether you understand the feature or merely use it.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A <strong>functional interface</strong> is an interface with exactly one abstract method. A <strong>lambda</strong> is a compact way to supply an implementation of that one method.</p>`,
        `<pre><code class="language-java">// Before Java 8 — an anonymous class, six lines of ceremony for one expression.
Runnable r = new Runnable() {
    @Override public void run() { System.out.println("hi"); }
};

// Java 8+ — the same thing.
Runnable r = () -&gt; System.out.println("hi");</code></pre>`,
        `<p>The four shapes almost every lambda fits into come from <code>java.util.function</code>:</p>`,
        `{{fig:ch7-functional-interfaces.svg|Four cards showing Function taking one value and returning another Predicate returning boolean Consumer returning nothing and Supplier taking nothing plus a panel of variations|Learn these four and the rest of java.util.function is just variations on arity and primitive specialisation.}}`,
        `<p><code>@FunctionalInterface</code> is optional but worth applying: it makes the compiler verify that the interface really does have exactly one abstract method, so someone adding a second one gets a build error instead of silently breaking every lambda that targets it. Default and static methods do not count toward the total, which is why <code>Comparator</code> — with its dozen default methods — is still functional.</p>`,
        `<h2>How it works</h2>`,
        `<p><strong>Effectively final capture.</strong> A lambda may use local variables from its enclosing scope only if they are <code>final</code> or <em>effectively final</em> — never reassigned after initialisation. This is not arbitrary: locals live on the stack and the stack frame may be gone by the time the lambda runs, so the value is <em>copied</em> into the lambda. Allowing reassignment would mean two copies that silently disagree. Instance and static fields have no such restriction, because they live on the heap and are genuinely shared.</p>`,
        `<p><strong><code>this</code> means the enclosing instance.</strong> A lambda is not a new object with its own identity, so <code>this</code> inside it refers to the class that contains it. In an anonymous class, <code>this</code> refers to the anonymous instance. That difference bites when converting old code.</p>`,
        `<p><strong>Method references</strong> are lambdas whose body does nothing but call one existing method, in four forms:</p>`,
        `<table><thead><tr><th>Form</th><th>Example</th><th>Equivalent lambda</th></tr></thead><tbody>` +
        `<tr><td>Static</td><td><code>Integer::parseInt</code></td><td><code>s -&gt; Integer.parseInt(s)</code></td></tr>` +
        `<tr><td>Instance of a particular object</td><td><code>log::info</code></td><td><code>s -&gt; log.info(s)</code></td></tr>` +
        `<tr><td>Instance of an arbitrary object</td><td><code>String::length</code></td><td><code>s -&gt; s.length()</code></td></tr>` +
        `<tr><td>Constructor</td><td><code>ArrayList::new</code></td><td><code>() -&gt; new ArrayList&lt;&gt;()</code></td></tr>` +
        `</tbody></table>`,
        `<h2>Code examples</h2>`,
        `<pre><code class="language-java">// Syntax, from most explicit to most compact:
Comparator&lt;String&gt; c1 = (String a, String b) -&gt; { return a.compareTo(b); };
Comparator&lt;String&gt; c2 = (a, b) -&gt; a.compareTo(b);   // types inferred
Comparator&lt;String&gt; c3 = String::compareTo;          // method reference

Predicate&lt;String&gt; p = s -&gt; !s.isBlank();            // one arg needs no parens
Supplier&lt;List&lt;String&gt;&gt; s = ArrayList::new;
Runnable r = () -&gt; doWork();                        // zero args need them</code></pre>`,
        `<p>The capture rule, and the workaround people reach for that is wrong:</p>`,
        `<pre><code class="language-java">int count = 0;
List&lt;String&gt; items = List.of("a", "b");

// ✘ "local variables referenced from a lambda expression must be final
//    or effectively final"
// items.forEach(i -&gt; count++);

// ✘ Technically compiles — the ARRAY reference is effectively final, and
//   people use this trick constantly. It is a workaround, not a fix: it is
//   not thread-safe, and it hides that you wanted a fold, not a mutation.
int[] counter = {0};
items.forEach(i -&gt; counter[0]++);

// ✔ Say what you mean:
long count = items.stream().filter(this::matches).count();
int total = items.stream().mapToInt(String::length).sum();</code></pre>`,
        `<p>The <code>this</code> difference, which is a favourite question:</p>`,
        `<pre><code class="language-java">public class Widget {
    private String name = "widget";

    void withLambda() {
        Runnable r = () -&gt; System.out.println(this.name);   // ✔ "widget"
        r.run();                                            // this == the Widget
    }

    void withAnonymousClass() {
        Runnable r = new Runnable() {
            // private String name = "anon";
            @Override public void run() {
                // System.out.println(this.name);   → the ANONYMOUS instance
                System.out.println(Widget.this.name);  // must qualify to reach Widget
            }
        };
        r.run();
    }
}</code></pre>`,
        `<p>Method references and the one that surprises people:</p>`,
        `<pre><code class="language-java">list.forEach(System.out::println);            // instance of a particular object
names.stream().map(String::toUpperCase);      // instance of an ARBITRARY object —
                                              // the stream element becomes the receiver
names.stream().map(String::valueOf);          // static

// ⚠ String::length works as Function&lt;String,Integer&gt; because the receiver
//   becomes the argument. This is why the same syntax can mean two things,
//   and why an ambiguous case makes the compiler complain.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>A lambda is not an anonymous class</strong>, and this is the answer that separates candidates. <code>javac</code> compiles the lambda body into a private synthetic method in the enclosing class and emits an <code>invokedynamic</code> instruction at the use site. At first execution, <code>LambdaMetafactory</code> spins up the implementing class and links the call site; every later execution goes straight to the linked target.</p>`,
        `<p>Three practical consequences:</p>`,
        `<ul>` +
        `<li><strong>No class file per lambda.</strong> An anonymous class produces <code>Outer$1.class</code>; a lambda produces none. On a large codebase that is a real reduction in class count and load time.</li>` +
        `<li><strong>Non-capturing lambdas are cached.</strong> A lambda that captures nothing is instantiated once and reused, so it allocates nothing on repeated calls. A capturing lambda generally allocates per evaluation.</li>` +
        `<li><strong>The strategy can change without recompiling.</strong> Because the linkage is decided at run time, the JDK can improve lambda implementation and existing bytecode benefits — which was the actual motivation for using <code>invokedynamic</code> rather than generating classes at compile time.</li>` +
        `</ul>`,
        `<p><strong>Lambdas cannot throw checked exceptions</strong> unless the target interface declares them, and none of the standard ones do — Chapter 6's problem, and the reason <code>UncheckedIOException</code> exists.</p>`,
        `<p><strong>Debugging is genuinely worse</strong>, and it is fair to say so: stack traces contain synthetic frames like <code>lambda$process$0</code>, and you cannot set a breakpoint on a lambda as naturally as on a method body. That is a real argument for extracting anything non-trivial into a named method — which also makes it testable.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Trying to mutate a captured local.</strong> It must be effectively final. Use a reduction rather than an array-of-one hack.</li>` +
        `<li><strong>Expecting <code>this</code> to mean the lambda.</strong> It means the enclosing instance — unlike an anonymous class.</li>` +
        `<li><strong>Long lambda bodies.</strong> Anything beyond a couple of lines belongs in a named method: readable, testable, and it appears properly in stack traces.</li>` +
        `<li><strong>Side effects inside lambdas.</strong> Mutating shared state from a lambda — especially in a stream — is where parallel bugs come from.</li>` +
        `<li><strong>Omitting <code>@FunctionalInterface</code>.</strong> Without it, someone can add a second abstract method and break every caller with no warning.</li>` +
        `<li><strong>Expecting checked exceptions to work.</strong> They do not; wrap them.</li>` +
        `<li><strong>Assuming a lambda is an anonymous class.</strong> Different mechanism, different <code>this</code>, no generated class file.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is a functional interface?"</strong><br>A: An interface with exactly one abstract method, which is what makes it a valid target for a lambda or method reference. Default and static methods do not count, which is why <code>Comparator</code> qualifies despite having many. <code>@FunctionalInterface</code> asks the compiler to enforce the rule so nobody accidentally adds a second abstract method.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Is a lambda just an anonymous inner class?"</strong><br>A: No. The body compiles to a private synthetic method and the use site becomes an <code>invokedynamic</code> instruction linked at run time by <code>LambdaMetafactory</code>. So no extra class file is generated, non-capturing lambdas are cached and allocate nothing on reuse, and <code>this</code> refers to the enclosing instance rather than to a new object.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why must captured variables be effectively final?"</strong><br>A: Because the value is copied into the lambda. Locals live on the stack frame, which may be gone by the time the lambda runs — a lambda can outlive the method that created it. If the variable could be reassigned there would be two copies that silently disagree. Fields are exempt, because they live on the heap and really are shared.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What does <code>this</code> mean inside a lambda?"</strong><br>A: The enclosing instance — a lambda introduces no new scope for <code>this</code>. In an anonymous class it refers to the anonymous object, so you need <code>Outer.this</code> to reach the enclosing one. It is the most common surprise when converting anonymous classes to lambdas.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What kinds of method reference are there?"</strong><br>A: Four. Static (<code>Integer::parseInt</code>), bound to a particular instance (<code>log::info</code>), unbound on an arbitrary instance where the stream element becomes the receiver (<code>String::length</code>), and constructor (<code>ArrayList::new</code>). The unbound form is the one that surprises people, because the receiver appears as the argument.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Can a lambda throw a checked exception?"</strong><br>A: Only if the target functional interface declares it, and none of the standard ones do. So in practice you catch inside the lambda and wrap in an unchecked exception — the JDK's own <code>UncheckedIOException</code> exists for exactly this — or define your own throwing interface with an adapter.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Functional interface = <strong>exactly one abstract method</strong>; defaults/statics do not count.</li>` +
        `<li>Lambda → private synthetic method + <strong><code>invokedynamic</code></strong>, linked by <code>LambdaMetafactory</code>. <strong>Not</strong> an anonymous class.</li>` +
        `<li><strong>No class file</strong> per lambda; non-capturing lambdas are <strong>cached</strong>.</li>` +
        `<li>Captured locals must be <strong>effectively final</strong> — the value is copied.</li>` +
        `<li><code>this</code> = <strong>enclosing instance</strong> (anonymous class: the anonymous object).</li>` +
        `<li>Four shapes: <code>Function</code> · <code>Predicate</code> · <code>Consumer</code> · <code>Supplier</code>.</li>` +
        `<li>Method refs: static · bound · unbound · constructor.</li>` +
        `<li>No checked exceptions — wrap them.</li>` +
        `<li>Long body? <strong>Extract a named method</strong> — readable, testable, better traces.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Streams: Laziness and the Pipeline',
      slug: 'streams-and-laziness',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Streams are the most-used Java 8 feature and the most misunderstood. The mental model most people carry — "it's a loop with nicer syntax" — predicts the wrong answer for every interesting question: why nothing happens without a terminal operation, why <code>findFirst</code> on a million elements is instant, why a stream cannot be reused. All three follow from one property: <strong>streams are lazy</strong>.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A stream is not a collection. It holds no data — it is a <em>description of a computation</em> over a source. Nothing executes until a <strong>terminal operation</strong> asks for a result.</p>`,
        `<p>Operations come in two kinds:</p>`,
        `<ul>` +
        `<li><strong>Intermediate</strong> — <code>filter</code>, <code>map</code>, <code>sorted</code>, <code>distinct</code>, <code>limit</code>, <code>peek</code>. Return a new stream, and do <em>nothing</em> on their own.</li>` +
        `<li><strong>Terminal</strong> — <code>collect</code>, <code>forEach</code>, <code>reduce</code>, <code>count</code>, <code>findFirst</code>, <code>anyMatch</code>, <code>toList</code>. Trigger the whole pipeline and produce a result.</li>` +
        `</ul>`,
        `{{fig:ch7-stream-pipeline.svg|A source of four numbers feeding a filter then a map then findFirst where only elements one and two are read and three and four are never touched|Elements flow one at a time through the entire pipeline — not stage by stage over the whole collection. That is why findFirst never touched elements 3 and 4.}}`,
        `<h2>How it works</h2>`,
        `<p>The processing model is <strong>vertical, not horizontal</strong>. A loop-based mental model says "filter everything, then map everything". A stream instead pulls one element all the way through, then the next. That single difference explains the useful behaviour:</p>`,
        `<ul>` +
        `<li><strong>Short-circuiting.</strong> <code>findFirst</code>, <code>anyMatch</code>, <code>limit</code> stop as soon as they can answer, so an expensive <code>map</code> runs only on the elements actually needed.</li>` +
        `<li><strong>No intermediate collections.</strong> A chain of five operations allocates no five temporary lists.</li>` +
        `<li><strong>Infinite streams work.</strong> <code>Stream.iterate</code> with a <code>limit</code> terminates, because only the requested elements are ever produced.</li>` +
        `</ul>`,
        `<p><strong>A stream is single-use.</strong> After a terminal operation it is consumed; touching it again throws <code>IllegalStateException: stream has already been operated upon or closed</code>. If you need two results, either collect once and reuse the collection, or build the stream twice from the source.</p>`,
        `<p><strong>Stateful operations break the flow.</strong> <code>sorted</code> and <code>distinct</code> cannot emit anything until they have seen enough input — <code>sorted</code> must consume the entire stream before producing its first element. Put them as late in the pipeline as possible, after the filters that shrink the data.</p>`,
        `<h2>Code examples</h2>`,
        `<p>Laziness, made visible:</p>`,
        `<pre><code class="language-java">List&lt;String&gt; words = List.of("apple", "banana", "cherry", "date");

Optional&lt;String&gt; result = words.stream()
    .peek(w -&gt; System.out.println("filter sees: " + w))
    .filter(w -&gt; w.length() &gt; 5)
    .peek(w -&gt; System.out.println("  map sees: " + w))
    .map(String::toUpperCase)
    .findFirst();

// filter sees: apple
// filter sees: banana
//   map sees: banana
// → BANANA
//
// "cherry" and "date" are never read at all, and map ran exactly once.
// A loop-shaped mental model would predict four filters and three maps.</code></pre>`,
        `<p>The silent no-op — the bug this topic exists to prevent:</p>`,
        `<pre><code class="language-java">// ✘ Does absolutely nothing. No exception, no warning, no output.
list.stream().map(this::save);          // no terminal operation

// ✔ Terminal operation present.
list.stream().map(this::save).toList();
list.forEach(this::save);               // simpler still when you just want the side effect

// ✘ Single-use:
Stream&lt;String&gt; s = list.stream();
s.count();
// s.forEach(System.out::println);      → IllegalStateException

// ✔ Build it twice, or collect once:
List&lt;String&gt; filtered = list.stream().filter(this::keep).toList();
long n = filtered.size();
filtered.forEach(System.out::println);</code></pre>`,
        `<p>Ordering matters for performance, and sometimes for correctness:</p>`,
        `<pre><code class="language-java">// ✘ Sorts 1,000,000 elements, then throws almost all of them away.
list.stream().sorted().filter(this::isActive).limit(10).toList();

// ✔ Filter first — sorted() now handles far fewer elements.
list.stream().filter(this::isActive).sorted().limit(10).toList();

// ⚠ sorted() is STATEFUL: it must consume the entire stream before emitting
//   anything, so it defeats short-circuiting and never terminates on an
//   infinite stream. Same for distinct(), which must remember what it has seen.</code></pre>`,
        `<p>Creating streams, including the ones people forget:</p>`,
        `<pre><code class="language-java">Stream.of("a", "b", "c");
Arrays.stream(array);
list.stream();
IntStream.range(0, 10);                    // primitive — no boxing
IntStream.rangeClosed(1, 10);
Stream.iterate(1, n -&gt; n * 2).limit(10);   // infinite + limit
Stream.generate(Math::random).limit(5);
"a,b,c".chars();                            // IntStream of code points
Pattern.compile(",").splitAsStream("a,b,c");

// ⚠ Holds an open file handle — must be closed (Chapter 6):
try (Stream&lt;String&gt; lines = Files.lines(path)) {
    lines.filter(l -&gt; !l.isBlank()).forEach(this::handle);
}</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p>Internally a stream is a linked chain of stages, each wrapping a <code>Sink</code>. The terminal operation drives a <code>Spliterator</code> over the source and pushes each element into the head of the chain; each stage does its work and pushes downstream. Short-circuiting is implemented by a stage signalling that it has had enough, which propagates back up and stops the traversal.</p>`,
        `<p><strong><code>peek</code> is for debugging only</strong>, and there is a subtle reason beyond style. Because it is an intermediate operation, it only runs on elements the pipeline actually pulls — so a <code>peek</code> before a short-circuiting terminal will appear to "miss" elements. Worse, the JDK is explicitly allowed to elide it: in some cases <code>count()</code> can skip the entire pipeline if it can compute the size from the source, and your <code>peek</code> never runs at all. Never put logic in a <code>peek</code>.</p>`,
        `<p><strong>Primitive streams exist for a real reason.</strong> <code>Stream&lt;Integer&gt;</code> boxes at every stage; <code>IntStream</code> does not. On large numeric pipelines the difference is several times, not a few percent. Convert with <code>mapToInt</code>/<code>mapToObj</code>, and remember <code>IntStream</code> has <code>sum()</code>, <code>average()</code> and <code>summaryStatistics()</code> that the object stream lacks.</p>`,
        `<p><strong>Streams versus loops:</strong> the honest position is that a stream is usually clearer for a transformation pipeline and a loop is usually clearer — and marginally faster — for simple iteration with side effects. Streams have real startup overhead per pipeline, so for a three-element list in a hot loop, a <code>for</code> loop wins. Claiming streams are always better is a weaker answer than knowing when they are not.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Forgetting the terminal operation.</strong> The pipeline silently does nothing.</li>` +
        `<li><strong>Reusing a stream.</strong> Single-use — collect once instead.</li>` +
        `<li><strong>Putting <code>sorted</code> before <code>filter</code>.</strong> Sorts data you are about to discard.</li>` +
        `<li><strong>Logic inside <code>peek</code>.</strong> It may not run at all. Debugging only.</li>` +
        `<li><strong>Mutating shared state from a lambda.</strong> Breaks under parallelism and hides intent. Use a collector.</li>` +
        `<li><strong>Boxing in numeric pipelines.</strong> Use <code>IntStream</code>/<code>LongStream</code>/<code>DoubleStream</code>.</li>` +
        `<li><strong>Not closing <code>Files.lines()</code>.</strong> Leaks a file handle.</li>` +
        `<li><strong>Modifying the source during a stream.</strong> Undefined behaviour — sometimes silent, sometimes <code>ConcurrentModificationException</code>.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is the difference between an intermediate and a terminal operation?"</strong><br>A: Intermediate operations return a new stream and are lazy — they record what to do and execute nothing. Terminal operations produce a result and are what actually drive the pipeline. A chain with no terminal operation does nothing at all, silently, which is one of the most common stream bugs.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How does laziness actually help?"</strong><br>A: Three ways. Short-circuiting — <code>findFirst</code> or <code>anyMatch</code> stops as soon as it has an answer, so expensive mappings run only on the elements needed. No intermediate collections, because elements flow one at a time through the whole chain rather than stage by stage. And infinite streams become usable, since <code>Stream.iterate(...).limit(n)</code> only ever produces n elements.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Can you reuse a stream?"</strong><br>A: No. Once a terminal operation runs, the stream is consumed and any further use throws <code>IllegalStateException</code>. If you need several results, collect to a list once and work from that, or create a fresh stream from the source each time.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Does operation order matter?"</strong><br>A: A lot. Filtering before mapping or sorting means the expensive stages see fewer elements. <code>sorted</code> and <code>distinct</code> are stateful — <code>sorted</code> must consume the entire stream before it can emit anything — so they defeat short-circuiting and never terminate on an infinite stream. Put them as late as possible.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is <code>peek</code> for?"</strong><br>A: Debugging, and nothing else. It is intermediate, so it only sees elements the pipeline actually pulls, and the JDK is explicitly permitted to skip it — <code>count()</code> can bypass the pipeline entirely when it can get the size from the source, and your <code>peek</code> never runs. Any logic that must happen belongs in a <code>map</code> or the terminal operation.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Are streams faster than loops?"</strong><br>A: Usually not, for simple iteration — there is per-pipeline setup cost, so a plain <code>for</code> loop wins on small collections. What streams buy is clarity for transformation pipelines and the option of parallelism. For numeric work the primitive streams matter more than the stream-versus-loop question, because <code>Stream&lt;Integer&gt;</code> boxes at every stage.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Streams hold <strong>no data</strong> — they describe a computation. <strong>Lazy</strong> until a terminal op.</li>` +
        `<li>Intermediate (<code>filter</code>, <code>map</code>, <code>sorted</code>) return a stream; terminal (<code>collect</code>, <code>count</code>, <code>findFirst</code>) run it.</li>` +
        `<li><strong>No terminal = nothing happens</strong>, silently.</li>` +
        `<li>Elements flow <strong>one at a time through the whole chain</strong> — hence short-circuiting.</li>` +
        `<li><strong>Single-use</strong> — reuse throws <code>IllegalStateException</code>.</li>` +
        `<li><code>sorted</code>/<code>distinct</code> are <strong>stateful</strong>: put them last, never on an infinite stream.</li>` +
        `<li><code>peek</code> = <strong>debugging only</strong>; it may be elided entirely.</li>` +
        `<li>Numeric work → <code>IntStream</code>/<code>LongStream</code>/<code>DoubleStream</code>, no boxing.</li>` +
        `<li><code>Files.lines()</code> must be <strong>closed</strong>.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Collectors, groupingBy and Reduction',
      slug: 'collectors-and-grouping',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p><code>collect</code> is where streams stop being a nicer loop and start replacing whole methods. "Group these orders by customer and sum the totals" is fifteen lines of map-fiddling with <code>HashMap</code> and <code>computeIfAbsent</code>, or one line with <code>groupingBy</code>. Interviewers ask because knowing the collector vocabulary is the difference between using streams and being fluent in them.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A <code>Collector</code> is a recipe for accumulating stream elements into a result. <code>Collectors</code> is the factory class of ready-made ones, and they <strong>compose</strong> — most take a <em>downstream</em> collector that shapes the values.</p>`,
        `{{fig:ch7-groupingby.svg|A list of employees on the left feeding four groupingBy variants on the right showing toList counting averagingInt and mapping downstream collectors|The classifier picks the key; the downstream collector decides what the value looks like. Swap the downstream and the same grouping produces lists, counts, averages or projections.}}`,
        `<h2>How it works</h2>`,
        `<p>The collectors worth knowing by heart:</p>`,
        `<table><thead><tr><th>Collector</th><th>Produces</th></tr></thead><tbody>` +
        `<tr><td><code>toList()</code> / <code>toSet()</code></td><td>A <code>List</code> / <code>Set</code></td></tr>` +
        `<tr><td><code>toMap(k, v)</code></td><td>A <code>Map</code> — <strong>throws on duplicate keys</strong> without a merge function</td></tr>` +
        `<tr><td><code>groupingBy(classifier)</code></td><td><code>Map&lt;K, List&lt;T&gt;&gt;</code></td></tr>` +
        `<tr><td><code>groupingBy(classifier, downstream)</code></td><td><code>Map&lt;K, ?&gt;</code> — the downstream shapes the value</td></tr>` +
        `<tr><td><code>partitioningBy(predicate)</code></td><td><code>Map&lt;Boolean, List&lt;T&gt;&gt;</code> — always both keys</td></tr>` +
        `<tr><td><code>counting()</code>, <code>summingInt</code>, <code>averagingInt</code></td><td>Aggregates, as downstreams</td></tr>` +
        `<tr><td><code>mapping(fn, downstream)</code></td><td>Transforms before collecting</td></tr>` +
        `<tr><td><code>joining(sep, prefix, suffix)</code></td><td>A <code>String</code></td></tr>` +
        `<tr><td><code>teeing(c1, c2, merger)</code></td><td>Two collectors in one pass (Java 12+)</td></tr>` +
        `</tbody></table>`,
        `<p><strong><code>reduce</code> versus <code>collect</code></strong> is the conceptual split. <code>reduce</code> is for <em>immutable</em> folding — combining values into a single new value, like summing. <code>collect</code> is for <em>mutable</em> accumulation — filling a container. Using <code>reduce</code> with a mutable accumulator technically works and is wrong: it copies on every element, making it quadratic, and it breaks under parallelism.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The grouping vocabulary, which covers most real reporting needs:</p>`,
        `<pre><code class="language-java">record Employee(String name, String dept, int salary) { }
List&lt;Employee&gt; staff = …;

// Group into lists
Map&lt;String, List&lt;Employee&gt;&gt; byDept =
    staff.stream().collect(groupingBy(Employee::dept));

// Count per group
Map&lt;String, Long&gt; countByDept =
    staff.stream().collect(groupingBy(Employee::dept, counting()));

// Sum and average per group
Map&lt;String, Integer&gt; payrollByDept =
    staff.stream().collect(groupingBy(Employee::dept, summingInt(Employee::salary)));

// Project before collecting — names only, not whole objects
Map&lt;String, List&lt;String&gt;&gt; namesByDept =
    staff.stream().collect(groupingBy(Employee::dept,
                           mapping(Employee::name, toList())));

// Highest earner per department
Map&lt;String, Optional&lt;Employee&gt;&gt; topByDept =
    staff.stream().collect(groupingBy(Employee::dept,
                           maxBy(comparingInt(Employee::salary))));

// Nested grouping — two levels, one pass
Map&lt;String, Map&lt;Boolean, List&lt;Employee&gt;&gt;&gt; byDeptThenSenior =
    staff.stream().collect(groupingBy(Employee::dept,
                           partitioningBy(e -&gt; e.salary() &gt; 80)));

// Choose the map implementation when order matters
Map&lt;String, List&lt;Employee&gt;&gt; sorted =
    staff.stream().collect(groupingBy(Employee::dept, TreeMap::new, toList()));</code></pre>`,
        `<p>The <code>toMap</code> trap, which catches almost everyone once:</p>`,
        `<pre><code class="language-java">// ✘ IllegalStateException: Duplicate key ENG
Map&lt;String, String&gt; byDept =
    staff.stream().collect(toMap(Employee::dept, Employee::name));

// ✔ Supply a merge function saying what to do with collisions.
Map&lt;String, String&gt; merged =
    staff.stream().collect(toMap(Employee::dept, Employee::name,
                                 (a, b) -&gt; a + ", " + b));

// ⚠ A second trap: toMap uses HashMap.merge internally, which REMOVES the
//   entry if the merge function returns null — and it throws
//   NullPointerException if a VALUE is null. groupingBy has neither problem.
//   When values may be null, prefer groupingBy or handle it explicitly.</code></pre>`,
        `<p><code>reduce</code> used properly — and improperly:</p>`,
        `<pre><code class="language-java">// ✔ Immutable folding, which is what reduce is for.
int total = staff.stream().mapToInt(Employee::salary).sum();       // best
Optional&lt;Employee&gt; top = staff.stream().max(comparingInt(Employee::salary));
int product = nums.stream().reduce(1, (a, b) -&gt; a * b);

// ✘ Mutable accumulation via reduce — quadratic and parallel-unsafe.
List&lt;String&gt; names = staff.stream()
    .reduce(new ArrayList&lt;String&gt;(),
            (list, e) -&gt; { list.add(e.name()); return list; },     // mutates!
            (a, b) -&gt; { a.addAll(b); return a; });

// ✔ Use collect for mutable containers — that is the distinction.
List&lt;String&gt; names = staff.stream().map(Employee::name).toList();</code></pre>`,
        `<p>Statistics and the Java 12+ addition worth knowing:</p>`,
        `<pre><code class="language-java">// One pass, five numbers.
IntSummaryStatistics stats = staff.stream().mapToInt(Employee::salary)
                                  .summaryStatistics();
stats.getCount(); stats.getSum(); stats.getMin(); stats.getAverage(); stats.getMax();

// teeing — two collectors over one traversal (Java 12+).
record Report(long count, int total) { }
Report r = staff.stream().collect(
    teeing(counting(), summingInt(Employee::salary),
           (c, s) -&gt; new Report(c, s)));

// Java 16+: toList() directly on the stream — shorter, and it returns an
// UNMODIFIABLE list, unlike collect(Collectors.toList()).
List&lt;String&gt; names = staff.stream().map(Employee::name).toList();</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p>A <code>Collector</code> is four functions plus a set of characteristics: a <strong>supplier</strong> that creates a container, an <strong>accumulator</strong> that folds one element in, a <strong>combiner</strong> that merges two containers (used only in parallel), and a <strong>finisher</strong> that converts the container to the final result. Writing one by hand is rare, but naming the four parts is a common follow-up question.</p>`,
        `<p><strong><code>Collectors.toList()</code> versus <code>Stream.toList()</code></strong> is a small distinction with real consequences. The collector returns a mutable <code>ArrayList</code> and permits nulls; <code>Stream.toList()</code> (Java 16+) returns an <strong>unmodifiable</strong> list — though it does allow null elements, unlike <code>List.of</code>. Code that collected and then mutated will break when someone "modernises" it to <code>toList()</code>, which is worth knowing before you do the refactor.</p>`,
        `<p><strong><code>partitioningBy</code> versus <code>groupingBy(x -&gt; boolean)</code>:</strong> partitioning always returns both <code>true</code> and <code>false</code> keys even when one side is empty, and it uses a specialised two-slot map. Grouping on a boolean gives you a <code>HashMap</code> that may be missing a key entirely — a null-check waiting to happen.</p>`,
        `<p><strong>Grouping is single-pass.</strong> A common instinct is to filter three times to produce three groups; <code>groupingBy</code> does it in one traversal. On a large or expensive source that is the whole game.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong><code>toMap</code> without a merge function.</strong> Throws on the first duplicate key.</li>` +
        `<li><strong><code>toMap</code> with null values.</strong> Throws <code>NullPointerException</code>. Use <code>groupingBy</code> or filter first.</li>` +
        `<li><strong><code>reduce</code> with a mutable accumulator.</strong> Quadratic and parallel-unsafe — use <code>collect</code>.</li>` +
        `<li><strong>Mutating an external collection in <code>forEach</code>.</strong> Use a collector; it is correct in parallel too.</li>` +
        `<li><strong>Assuming <code>Stream.toList()</code> is mutable.</strong> It is not, unlike <code>Collectors.toList()</code>.</li>` +
        `<li><strong>Filtering repeatedly instead of grouping.</strong> One <code>groupingBy</code> beats three passes.</li>` +
        `<li><strong>Relying on the map type from <code>groupingBy</code>.</strong> It is a <code>HashMap</code> — pass <code>TreeMap::new</code> if you need order.</li>` +
        `<li><strong>Boxing before aggregating.</strong> <code>mapToInt(...).sum()</code> beats <code>collect(summingInt(...))</code> for a plain total.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Group employees by department and count them."</strong><br>A: <code>staff.stream().collect(groupingBy(Employee::dept, counting()))</code>, giving a <code>Map&lt;String, Long&gt;</code>. The general shape is that the first argument classifies into keys and the optional second — the downstream collector — decides what each value looks like: <code>toList()</code> by default, or <code>counting()</code>, <code>summingInt</code>, <code>mapping</code>, even another <code>groupingBy</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is the difference between <code>reduce</code> and <code>collect</code>?"</strong><br>A: <code>reduce</code> is immutable folding — combining values into a single new value, like a sum or a max. <code>collect</code> is mutable accumulation into a container. Using <code>reduce</code> with a mutable accumulator appears to work but copies on every element, which is quadratic, and it is unsafe in parallel because multiple threads would mutate the same container.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why does <code>toMap</code> throw <code>IllegalStateException</code>?"</strong><br>A: Duplicate keys. The two-argument form has no way to decide which value wins, so it refuses rather than silently dropping data. Pass a third merge-function argument to say what should happen — keep the first, keep the last, or combine them. It also throws <code>NullPointerException</code> on a null value, which <code>groupingBy</code> does not.</p></blockquote>`,
        `<blockquote><p><strong>Q: "<code>partitioningBy</code> or <code>groupingBy</code> on a boolean?"</strong><br>A: <code>partitioningBy</code>, because it guarantees both <code>true</code> and <code>false</code> keys exist even when one side is empty, and it uses a specialised two-entry map rather than a <code>HashMap</code>. Grouping on a boolean can return a map missing one key, which turns into a null check at every call site.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What are the parts of a <code>Collector</code>?"</strong><br>A: A supplier that creates the container, an accumulator that adds one element, a combiner that merges two containers — only used in parallel — and a finisher that produces the final result, plus characteristics like <code>UNORDERED</code> or <code>IDENTITY_FINISH</code>. You rarely implement one directly, since <code>Collectors.of</code> and the built-ins cover almost everything.</p></blockquote>`,
        `<blockquote><p><strong>Q: "<code>Collectors.toList()</code> or <code>Stream.toList()</code>?"</strong><br>A: <code>Stream.toList()</code> from Java 16 is shorter and returns an unmodifiable list, which is usually what you want. The difference matters when existing code collected and then mutated the result — that breaks on the newer method. It also permits null elements, unlike <code>List.of</code>, which occasionally surprises people going the other way.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><code>groupingBy(classifier[, downstream])</code> — downstream shapes the value; <strong>they nest</strong>.</li>` +
        `<li>Downstreams: <code>counting()</code> · <code>summingInt</code> · <code>averagingInt</code> · <code>mapping</code> · <code>maxBy</code> · <code>joining</code>.</li>` +
        `<li><strong><code>toMap</code> throws on duplicate keys</strong> — pass a merge function. Also NPEs on null values.</li>` +
        `<li><code>partitioningBy</code> always yields <strong>both</strong> boolean keys.</li>` +
        `<li><code>reduce</code> = immutable fold · <code>collect</code> = mutable accumulation. <strong>Never reduce into a container.</strong></li>` +
        `<li>Collector = supplier + accumulator + combiner + finisher.</li>` +
        `<li><code>Stream.toList()</code> (16+) is <strong>unmodifiable</strong>; <code>Collectors.toList()</code> is not.</li>` +
        `<li>Need order? <code>groupingBy(fn, TreeMap::new, toList())</code>.</li>` +
        `<li>One pass for many stats: <code>summaryStatistics()</code> or <code>teeing</code> (12+).</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Parallel Streams: When They Help and When They Hurt',
      slug: 'parallel-streams',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p><code>.parallelStream()</code> is the most dangerous easy win in Java. It is one word, it looks like free performance, and in a web application it is usually either slower or actively harmful — because every parallel stream in the JVM shares one thread pool. Interviewers ask precisely because the naive answer ("use it for big collections") misses the two things that actually matter: what the work is doing, and which pool it runs on.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A parallel stream splits the source into chunks, processes them on multiple threads, and combines the results.</p>`,
        `{{fig:ch7-parallel-stream.svg|A source splitting into three chunks processed by three workers then combined into a result with panels listing when parallelism helps and when it is harmful|Split, process, combine. Every step has a cost, and the whole thing only pays off when the per-element work is large enough to dwarf that overhead.}}`,
        `<p>The critical detail: unless you do something special, <strong>every parallel stream in the JVM runs on the same <code>ForkJoinPool.commonPool()</code></strong>, whose size defaults to the number of cores minus one. It is a shared resource, and one slow pipeline starves every other.</p>`,
        `<h2>How it works</h2>`,
        `<p>Parallelism pays only when several conditions hold together:</p>`,
        `<ul>` +
        `<li><strong>Enough elements and enough work per element.</strong> The rule of thumb is <em>N × Q</em> — element count times cost per element — needs to be large. Ten thousand trivial operations is not enough; a thousand expensive ones might be.</li>` +
        `<li><strong>A cheaply splittable source.</strong> Arrays, <code>ArrayList</code> and <code>IntStream.range</code> split in O(1) by index. <code>LinkedList</code>, <code>Stream.iterate</code> and I/O-backed streams split badly or not at all, and the overhead swamps any gain.</li>` +
        `<li><strong>Stateless, side-effect-free, associative operations.</strong> A reduction that is not associative gives a different answer depending on how the work was split.</li>` +
        `<li><strong>CPU-bound work.</strong> This is the big one.</li>` +
        `</ul>`,
        `<p><strong>Blocking I/O in a parallel stream is the classic production incident.</strong> The common pool has a handful of threads; making HTTP calls inside a parallel stream ties them all up waiting on the network. Every other parallel stream in the application — including ones in library code you did not write — stops. And parallelism buys nothing anyway, because the bottleneck is the network, not the CPU.</p>`,
        `<h2>Code examples</h2>`,
        `<p>Where it genuinely helps:</p>`,
        `<pre><code class="language-java">// ✔ Large N, CPU-bound work, array-backed source, associative reduction.
long primes = IntStream.rangeClosed(2, 10_000_000)
                       .parallel()
                       .filter(this::isPrime)     // expensive, pure
                       .count();

// ✔ Also fine — a big array and real computation per element.
double[] results = Arrays.stream(bigArray)
                         .parallel()
                         .map(this::expensiveTransform)
                         .toArray();</code></pre>`,
        `<p>Where it hurts, in the order people hit it:</p>`,
        `<pre><code class="language-java">// ✘ 1. Blocking I/O — starves the SHARED common pool for the whole JVM.
urls.parallelStream().map(this::httpGet).toList();
// Every other parallel stream in the application now waits behind these.
// Use a CompletableFuture with its own executor instead (Chapter 8).

// ✘ 2. Tiny collection — setup cost exceeds the work.
List.of("a", "b", "c").parallelStream().map(String::toUpperCase).toList();

// ✘ 3. Badly splittable source.
Stream.iterate(1, n -&gt; n + 1).limit(1_000_000).parallel()...
// iterate is inherently sequential — each element depends on the previous.

// ✘ 4. Shared mutable state — a race, and it will pass your tests.
List&lt;String&gt; results = new ArrayList&lt;&gt;();
list.parallelStream().forEach(results::add);      // ArrayList is not thread-safe
// Symptoms: missing elements, nulls, or ArrayIndexOutOfBoundsException.

// ✔ Collectors handle parallelism correctly — that is what they are for.
List&lt;String&gt; results = list.parallelStream().map(this::transform).toList();</code></pre>`,
        `<p>Ordering, which costs more than people expect:</p>`,
        `<pre><code class="language-java">// forEach gives NO order guarantee in parallel — that is the point of it.
list.parallelStream().forEach(System.out::println);       // interleaved

// forEachOrdered restores order, and serialises the terminal stage —
// often cancelling out the parallelism you just paid for.
list.parallelStream().forEachOrdered(System.out::println);

// findFirst must respect encounter order and is therefore more expensive
// in parallel than findAny, which may return any matching element.
Optional&lt;String&gt; any = list.parallelStream().filter(p).findAny();   // cheaper</code></pre>`,
        `<p>Escaping the common pool, which is the answer to "what if I must?":</p>`,
        `<pre><code class="language-java">// A parallel stream submitted INSIDE a custom ForkJoinPool runs on that pool.
// It is an undocumented-but-stable behaviour, and widely used.
ForkJoinPool pool = new ForkJoinPool(4);
try {
    List&lt;Result&gt; results = pool.submit(() -&gt;
        items.parallelStream().map(this::process).toList()
    ).get();
} finally {
    pool.shutdown();
}
// Honestly: if you need this level of control, CompletableFuture with an
// explicit executor expresses the intent better than a parallel stream.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p>Splitting is done by the source's <code>Spliterator</code>, which reports both an estimated size and characteristics like <code>SIZED</code> and <code>SUBSIZED</code>. A source that knows its size and can split by index — an array or <code>ArrayList</code> — produces balanced chunks cheaply. A <code>LinkedList</code> must traverse to split, and <code>Stream.iterate</code> cannot meaningfully split at all, which is why those sources perform so badly.</p>`,
        `<p>The pool uses <strong>work stealing</strong>: each worker has its own deque, and an idle worker steals from a busy one's tail. That handles uneven chunk sizes well, and it is also why a blocking task is so damaging — a blocked thread cannot be stolen from usefully, and the pool has no spare capacity by design.</p>`,
        `<p><strong>Associativity matters for correctness, not just speed.</strong> A reduction that is not associative produces a different result depending on how the work was split, so the same code can give different answers on different machines or runs. Subtraction is the classic example: <code>(a - b) - c</code> is not <code>a - (b - c)</code>. The identity value must also be a true identity, or it gets applied once per chunk and corrupts the result.</p>`,
        `<p><strong>The honest summary</strong> to give in an interview: default to sequential; reach for parallel only when profiling shows a CPU-bound bottleneck over a large, array-backed source; and measure, because the overhead frequently exceeds the gain. In a request-handling service, the right answer is usually not a parallel stream at all — it is an explicit executor sized for the workload.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Blocking I/O in a parallel stream.</strong> Starves the shared common pool for the whole JVM and gains nothing.</li>` +
        `<li><strong>Parallelising small collections.</strong> Setup cost exceeds the work.</li>` +
        `<li><strong>Mutating shared state in <code>forEach</code>.</strong> A race that passes tests and fails in production. Use a collector.</li>` +
        `<li><strong>Non-associative reductions.</strong> Different answers on different runs.</li>` +
        `<li><strong>Using <code>findFirst</code> where <code>findAny</code> would do.</strong> Order preservation costs real time in parallel.</li>` +
        `<li><strong>Assuming more threads means faster.</strong> The common pool is sized to the cores; contention and merging are not free.</li>` +
        `<li><strong>Parallelising a <code>LinkedList</code> or <code>Stream.iterate</code>.</strong> They split badly or not at all.</li>` +
        `<li><strong>Not measuring.</strong> This is the one area where intuition is reliably wrong.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "When would you use a parallel stream?"</strong><br>A: Rarely, and only when four things hold: the work is CPU-bound, there are enough elements that N times the per-element cost is large, the source splits cheaply — an array or <code>ArrayList</code>, not a <code>LinkedList</code> — and the operations are stateless and associative. Then I measure, because the split-and-merge overhead often exceeds the gain.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What thread pool do parallel streams use?"</strong><br>A: <code>ForkJoinPool.commonPool()</code> by default, sized to available cores minus one, and shared by the entire JVM. That is the single most important fact about them: one slow parallel stream starves every other, including ones inside libraries. You can run a pipeline on a different pool by submitting it to your own <code>ForkJoinPool</code>, but at that point an explicit executor with <code>CompletableFuture</code> is usually the clearer design.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why is blocking I/O in a parallel stream bad?"</strong><br>A: Two reasons. It ties up the shared common pool's small number of threads waiting on the network, so unrelated parallel work across the application stalls. And it buys nothing, because the bottleneck is I/O rather than CPU — the right tool is asynchronous calls on an executor sized for concurrency, not parallelism sized for cores.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Is <code>parallelStream().forEach()</code> safe?"</strong><br>A: Only if the action is thread-safe and you do not care about order. Adding to an <code>ArrayList</code> from it is a race — you get missing elements, nulls, or an index exception, and it will pass a small test. The correct approach is <code>collect</code> or <code>toList()</code>, because collectors are written to combine per-thread containers safely.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why must a reduction be associative?"</strong><br>A: Because the stream is split arbitrarily and the partial results are combined in an unspecified order. If the operation is not associative — subtraction, say — the answer depends on how the work happened to be divided, so the same code gives different results on different machines. The identity must be a genuine identity too, or it is applied once per chunk.</p></blockquote>`,
        `<blockquote><p><strong>Q: "<code>findFirst</code> or <code>findAny</code>?"</strong><br>A: <code>findAny</code> in parallel, whenever any match will do. <code>findFirst</code> must respect encounter order, which forces coordination between the workers and gives up much of the parallel benefit. Sequentially they behave the same.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>All parallel streams share <strong><code>ForkJoinPool.commonPool()</code></strong> — cores − 1, JVM-wide.</li>` +
        `<li>Needs: <strong>CPU-bound · large N × Q · splittable source · stateless, associative</strong>.</li>` +
        `<li><strong>Never do blocking I/O</strong> in one — it starves the whole application.</li>` +
        `<li>Bad sources: <code>LinkedList</code>, <code>Stream.iterate</code>, I/O-backed streams.</li>` +
        `<li>Shared mutable state in <code>forEach</code> = race. <strong>Use collectors.</strong></li>` +
        `<li><code>findAny</code> &gt; <code>findFirst</code>; <code>forEachOrdered</code> serialises the terminal stage.</li>` +
        `<li>Non-associative reduction → different answers per run.</li>` +
        `<li>Own pool: <code>new ForkJoinPool(n).submit(() -&gt; …parallelStream()…)</code>.</li>` +
        `<li><strong>Default to sequential. Measure before parallelising.</strong></li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Optional Done Right',
      slug: 'optional',
      order: 4,
      content: [
        `<h2>Why it matters</h2>`,
        `<p><code>Optional</code> is the most misused class Java 8 added. Most code that uses it gets no benefit — <code>if (opt.isPresent()) opt.get()</code> is a null check with more syntax — and a lot of code puts it where it actively causes harm, in fields and parameters. Interviewers ask because the correct answer requires knowing what it was designed for, which is narrower than most people assume.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p><code>Optional&lt;T&gt;</code> is a container that holds either a value or nothing. Its purpose is to make absence <strong>part of the type</strong>, so a caller cannot silently forget it.</p>`,
        `{{fig:ch7-optional.svg|Left comparison shows a method returning null where dereferencing compiles and throws at run time; right shows returning Optional where the compiler forces handling plus four cards for transform narrow unwrap and avoid|The value is entirely at the call site: with null, forgetting to check compiles fine. With Optional, it does not.}}`,
        `<p>Brian Goetz, who led the Java 8 language work, has stated the intent plainly: <code>Optional</code> was designed as a <strong>return type</strong> for methods that might not return a result. It was not designed to be a general-purpose Maybe type, and specifically not for fields or parameters.</p>`,
        `<h2>How it works</h2>`,
        `<p>Use it as a pipeline, not as a wrapper you immediately unwrap:</p>`,
        `<table><thead><tr><th>Method</th><th>Purpose</th></tr></thead><tbody>` +
        `<tr><td><code>map(fn)</code></td><td>Transform the value if present</td></tr>` +
        `<tr><td><code>flatMap(fn)</code></td><td>Transform when the function itself returns an <code>Optional</code> — avoids nesting</td></tr>` +
        `<tr><td><code>filter(pred)</code></td><td>Become empty if the predicate fails</td></tr>` +
        `<tr><td><code>orElse(v)</code></td><td>The value, or a default — <strong>always evaluated</strong></td></tr>` +
        `<tr><td><code>orElseGet(supplier)</code></td><td>The value, or a lazily-computed default</td></tr>` +
        `<tr><td><code>orElseThrow(supplier)</code></td><td>The value, or throw</td></tr>` +
        `<tr><td><code>ifPresentOrElse(a, b)</code></td><td>Two-branch action (Java 9+)</td></tr>` +
        `<tr><td><code>or(supplier)</code></td><td>Fall back to another <code>Optional</code> (Java 9+)</td></tr>` +
        `<tr><td><code>stream()</code></td><td>Zero-or-one stream, for flat-mapping (Java 9+)</td></tr>` +
        `</tbody></table>`,
        `<p>The distinction that catches people: <strong><code>orElse</code> always evaluates its argument</strong>, even when the value is present. If the default is expensive or has side effects, use <code>orElseGet</code>.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The anti-pattern and its replacement:</p>`,
        `<pre><code class="language-java">// ✘ A null check wearing a costume. No benefit whatsoever.
Optional&lt;User&gt; opt = findUser(id);
if (opt.isPresent()) {
    return opt.get().name();
} else {
    return "unknown";
}

// ✔ One expression, and .get() never appears.
return findUser(id).map(User::name).orElse("unknown");

// Chaining across several optional steps — flatMap avoids Optional&lt;Optional&lt;X&gt;&gt;:
return findUser(id)
        .flatMap(User::address)          // address() returns Optional&lt;Address&gt;
        .map(Address::city)
        .filter(c -&gt; !c.isBlank())
        .orElse("unknown");</code></pre>`,
        `<p>The eager-default trap:</p>`,
        `<pre><code class="language-java">// ✘ createExpensiveDefault() runs EVERY time, even when a value is present.
User u = findUser(id).orElse(createExpensiveDefault());

// ✔ Only runs when actually needed.
User u = findUser(id).orElseGet(this::createExpensiveDefault);

// Same reasoning for exceptions — orElseThrow takes a supplier so the
// exception (and its stack trace) is only constructed on the failure path:
User u = findUser(id).orElseThrow(() -&gt; new UserNotFoundException(id));
User u = findUser(id).orElseThrow();     // NoSuchElementException (Java 10+)</code></pre>`,
        `<p>Where <code>Optional</code> does not belong:</p>`,
        `<pre><code class="language-java">// ✘ As a FIELD. It is not Serializable, it adds an allocation per instance,
//   and it does not stop the field itself being null.
public class User {
    private Optional&lt;String&gt; middleName;   // don't
}

// ✔ Keep the field nullable and expose an Optional accessor.
public class User {
    private String middleName;                        // may be null
    public Optional&lt;String&gt; middleName() {
        return Optional.ofNullable(middleName);
    }
}

// ✘ As a PARAMETER. Callers must now wrap every argument, and you still
//   have to null-check the Optional itself.
void process(Optional&lt;String&gt; name) { }        // don't
process(Optional.of("x"));                     // noisy at every call site

// ✔ Overload, or accept nullable and document it.
void process(String name) { }
void process() { }

// ✘ In a collection. An empty list already means "nothing".
List&lt;Optional&lt;String&gt;&gt; names;                  // don't</code></pre>`,
        `<p>Genuinely good uses beyond the basic return:</p>`,
        `<pre><code class="language-java">// Two-branch handling without an if (Java 9+)
findUser(id).ifPresentOrElse(
    user -&gt; log.info("found {}", user.name()),
    ()   -&gt; log.warn("no user {}", id));

// Fallback chain (Java 9+)
Optional&lt;User&gt; user = findByEmail(e).or(() -&gt; findByPhone(p)).or(() -&gt; findByName(n));

// Flattening optionals inside a stream — drops the empties in one step (Java 9+)
List&lt;User&gt; found = ids.stream()
                      .map(this::findUser)      // Stream&lt;Optional&lt;User&gt;&gt;
                      .flatMap(Optional::stream) // Stream&lt;User&gt;
                      .toList();

// Primitive versions avoid boxing where it matters:
OptionalInt max = IntStream.of(1, 2, 3).max();</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong><code>Optional</code> is not <code>Serializable</code></strong>, which is the concrete reason it must not be a field on anything that gets serialised — a JPA entity, a session object, a DTO going over RMI. It will simply fail. It also costs an allocation per instance, which is why it does not appear in performance-critical JDK APIs.</p>`,
        `<p><strong><code>Optional.of</code> versus <code>ofNullable</code></strong> is a small but real distinction: <code>of</code> throws <code>NullPointerException</code> if handed null, which is correct when null would indicate a bug; <code>ofNullable</code> converts null into an empty <code>Optional</code>, which is what you want at a boundary with legacy code. Using <code>of</code> where the value may legitimately be null is a common mistake that turns a graceful absence into a crash.</p>`,
        `<p><strong>Never call <code>get()</code> without a check.</strong> It throws <code>NoSuchElementException</code>, and it defeats the point of the type. Java 10 added <code>orElseThrow()</code> with no arguments as a better-named equivalent, and modern style is to treat plain <code>get()</code> as deprecated in spirit even though it is not formally.</p>`,
        `<p><strong>Where the JDK itself uses it</strong> is instructive: <code>Stream.findFirst</code>, <code>Stream.max</code>, <code>Optional</code>-returning lookups. All of them are return values from operations that may legitimately produce nothing. That is the whole design space.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong><code>isPresent()</code> then <code>get()</code>.</strong> A null check with extra ceremony. Use <code>map</code>/<code>orElse</code>.</li>` +
        `<li><strong>Calling <code>get()</code> unguarded.</strong> Throws, and defeats the type.</li>` +
        `<li><strong><code>Optional</code> as a field.</strong> Not serialisable, an extra allocation, and the field can still be null.</li>` +
        `<li><strong><code>Optional</code> as a parameter.</strong> Forces every caller to wrap. Overload instead.</li>` +
        `<li><strong><code>orElse</code> with an expensive default.</strong> It is evaluated even when unnecessary — use <code>orElseGet</code>.</li>` +
        `<li><strong>Returning <code>null</code> from a method declared to return <code>Optional</code>.</strong> The worst of both worlds, and it happens.</li>` +
        `<li><strong><code>Optional</code> inside collections.</strong> An empty collection already expresses absence.</li>` +
        `<li><strong><code>Optional.of</code> on a possibly-null value.</strong> Throws. Use <code>ofNullable</code>.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is <code>Optional</code> for?"</strong><br>A: Making absence explicit in a method's return type, so callers cannot silently forget the empty case — the compiler makes them deal with it. Brian Goetz has said directly that it was designed as a return type for methods that might not have a result, not as a general Maybe type, which is why using it for fields and parameters goes against the design.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is wrong with <code>isPresent()</code> and <code>get()</code>?"</strong><br>A: It is a null check with more syntax and no added safety — you have wrapped the value only to immediately unwrap it. The point is to compose: <code>map</code>, <code>flatMap</code>, <code>filter</code>, then <code>orElse</code> or <code>orElseThrow</code> at the end. If <code>get()</code> appears in my code I treat it as a sign the pipeline was not finished.</p></blockquote>`,
        `<blockquote><p><strong>Q: "<code>orElse</code> or <code>orElseGet</code>?"</strong><br>A: <code>orElse</code> takes a value, so the argument is evaluated whether or not it is needed. <code>orElseGet</code> takes a supplier and only runs on the empty path. For a constant either is fine; for anything expensive or with side effects — a database lookup, object construction — <code>orElseGet</code> is required, and the same reasoning is why <code>orElseThrow</code> takes a supplier.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Should <code>Optional</code> be used for fields or parameters?"</strong><br>A: No to both. As a field it is not serialisable, costs an allocation per instance, and does not stop the field itself being null — better to keep the field nullable and return <code>Optional.ofNullable(...)</code> from the getter. As a parameter it forces every caller to wrap their argument and you still have to null-check the <code>Optional</code>; overloaded methods express optional arguments better.</p></blockquote>`,
        `<blockquote><p><strong>Q: "<code>map</code> or <code>flatMap</code>?"</strong><br>A: <code>map</code> when the function returns a plain value; <code>flatMap</code> when it already returns an <code>Optional</code>, so you get <code>Optional&lt;T&gt;</code> rather than <code>Optional&lt;Optional&lt;T&gt;&gt;</code>. It is the same relationship as in streams — chaining lookups that each may fail is exactly what <code>flatMap</code> is for.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Does <code>Optional</code> replace null?"</strong><br>A: No, and treating it that way is where the misuse comes from. It is a return-type idiom for "this might not produce a result". Nulls still exist in fields, in collections and across library boundaries, and wrapping everything in <code>Optional</code> adds allocation and noise without making those safer. For the rest, <code>Objects.requireNonNull</code> at boundaries and helpful NullPointerExceptions from Java 14 do more good.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Purpose: <strong>a return type</strong> for "might not produce a result". Not a general Maybe.</li>` +
        `<li><strong>Never</strong> a field (not <code>Serializable</code>), a parameter, or a collection element.</li>` +
        `<li>Compose: <code>map</code> → <code>flatMap</code> → <code>filter</code> → <code>orElse</code>/<code>orElseThrow</code>. <strong><code>get()</code> should never appear.</strong></li>` +
        `<li><code>orElse</code> is <strong>eager</strong>; <code>orElseGet</code>/<code>orElseThrow</code> are lazy.</li>` +
        `<li><code>of</code> throws on null; <strong><code>ofNullable</code></strong> converts it to empty.</li>` +
        `<li>Java 9+: <code>ifPresentOrElse</code> · <code>or</code> · <code>Optional::stream</code> for flat-mapping.</li>` +
        `<li>Primitives: <code>OptionalInt</code>/<code>OptionalLong</code>/<code>OptionalDouble</code>.</li>` +
        `<li>Never return <code>null</code> from a method declared <code>Optional</code>.</li>` +
        `</ul>`,
      ].join('\n'),
    },
  ],
};
