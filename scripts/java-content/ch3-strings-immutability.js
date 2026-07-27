/**
 * Java Interview Kit — Chapter 3: Strings, Immutability and Wrappers.
 *
 * ⚠️ Content strings are TEMPLATE LITERALS — never use a backtick inside them,
 * and always escape ${...} as \${...} or it will be interpolated.
 */
module.exports = {
  title: 'Strings & Immutability',
  slug: 'strings-immutability',
  order: 2,
  topics: [
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Why String Is Immutable',
      slug: 'why-string-is-immutable',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>"Why is <code>String</code> immutable?" is one of the few interview questions where a complete answer requires four different areas of knowledge — security, hashing, concurrency and memory — and where a weak answer ("so it can be shared") is obviously incomplete. It is asked constantly for exactly that reason. It is also load-bearing: immutability is why strings can be pooled, why they are safe map keys, and why the entire <code>StringBuilder</code> class exists.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A <code>String</code> object's characters can never change after construction. Every method that appears to modify a string — <code>concat</code>, <code>replace</code>, <code>toUpperCase</code>, <code>trim</code>, <code>substring</code> — returns a <em>new</em> <code>String</code> and leaves the original untouched. The class is <code>final</code>, its internal array is <code>private final</code>, and it is never handed out.</p>`,
        `<pre><code class="language-java">String s = "hello";
s.toUpperCase();               // creates "HELLO" — and throws it away
System.out.println(s);         // hello

s = s.toUpperCase();           // reassignment is what actually changed s
System.out.println(s);         // HELLO
// The STRING did not change. The VARIABLE was pointed at a different string.</code></pre>`,
        `<h2>How it works</h2>`,
        `<p>There are four distinct reasons, and a strong answer names all four.</p>`,
        `<p><strong>1. Security.</strong> Strings carry the arguments of nearly every sensitive API in the JDK — file paths, class names, database URLs, socket hosts, permission names. If strings were mutable, a caller could pass a permitted value, wait for the security check to pass, then mutate the same object before it was used. That is a textbook <em>time-of-check-to-time-of-use</em> attack, and immutability eliminates it categorically: the value checked is the value used, because nothing can alter it in between.</p>`,
        `<p><strong>2. Hash caching.</strong> Because the characters cannot change, a <code>String</code>'s hash code cannot change, so it is computed once and cached in a field. Strings are the most common map key in every Java program on Earth, and this makes every lookup after the first almost free. It also makes strings <em>safe</em> keys — Chapter 2's mutable-key trap can never happen with a <code>String</code>.</p>`,
        `<p><strong>3. Thread safety.</strong> An immutable object has no state to race on, so a <code>String</code> can be shared across any number of threads with no synchronisation whatsoever. This is not merely convention: the memory model's <code>final</code>-field guarantee ensures every thread that sees a constructed <code>String</code> sees its contents fully initialised.</p>`,
        `<p><strong>4. Pooling.</strong> Sharing one object between many references is only safe if nobody can modify it. Immutability is what makes the string pool possible — and the pool is what makes the enormous number of duplicate string literals in a typical program cost almost nothing.</p>`,
        `<p>Mechanically, immutability is enforced by three things together, and missing any one would break it: the field holding the characters is <code>private final</code>; no method ever exposes that array; and the class is <code>final</code>, so no subclass can add mutating behaviour or override methods to lie about the contents.</p>`,
        `<h2>Code examples</h2>`,
        `<p>What "returns a new String" costs, and why it matters:</p>`,
        `<pre><code class="language-java">String a = "hello";
String b = a.concat(" world");     // new object
String c = b.replace('l', 'L');    // another new object
String d = c.substring(0, 5);      // another

System.out.println(a);             // hello   — untouched throughout
// Three intermediate objects were created for one logical transformation.
// Harmless once; a real problem inside a loop (next topic).</code></pre>`,
        `<p>The security argument, made concrete:</p>`,
        `<pre><code class="language-java">// Suppose String were mutable. This method could be defeated:
void loadConfig(String path) {
    if (!isAllowed(path)) throw new SecurityException(path);   // check
    // ── another thread mutates the caller's String object here ──
    readFile(path);                                            // use
}
// With real (immutable) Strings the value validated and the value read are
// necessarily the same characters — there is no window to exploit.
//
// This is also why char[] is still recommended for PASSWORDS: you WANT to be
// able to wipe it. Arrays.fill(pw, '\\0') is possible; erasing a String is not,
// and it may linger in the pool and in heap dumps until GC.</code></pre>`,
        `<p>Immutability as a design pattern you can copy — the same technique in your own classes:</p>`,
        `<pre><code class="language-java">public final class Money {                       // final: no subclass can break it
    private final long amountMinor;              // final fields
    private final Currency currency;             // (and Currency is immutable)

    public Money(long amountMinor, Currency currency) {
        this.amountMinor = amountMinor;
        this.currency = Objects.requireNonNull(currency);
    }

    // "Mutators" return a new instance — exactly like String does.
    public Money plus(Money other) {
        if (!currency.equals(other.currency)) throw new IllegalArgumentException("currency mismatch");
        return new Money(amountMinor + other.amountMinor, currency);
    }

    public long amountMinor() { return amountMinor; }
}
// Free consequences: thread-safe, safe as a map key, safe to hand out,
// and impossible to leave in an inconsistent state.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Compact strings (Java 9+)</strong> are worth knowing because they contradict a fact people memorised. Before Java 9, <code>String</code> stored a <code>char[]</code> — two bytes per character, always. Since Java 9 it stores a <code>byte[]</code> plus a one-byte coder flag: strings whose characters all fit in Latin-1 use one byte each, and only strings needing wider characters use UTF-16. Since the overwhelming majority of strings in a typical application are ASCII, this roughly halved their memory footprint — one of the largest free wins in JVM history. So "a Java String uses 2 bytes per character" has been wrong since Java 9.</p>`,
        `<p><strong><code>substring</code> used to share memory, and does not any more.</strong> Before Java 7u6, <code>substring</code> returned a new <code>String</code> that <em>shared</em> the original character array with an offset and length. Taking a 10-character substring of a 10 MB string therefore retained all 10 MB — a notorious memory leak. Modern <code>substring</code> copies. It is a good answer to "has immutability ever caused problems?", because it shows you know the implementation changed and why.</p>`,
        `<p><strong>Immutability is not free.</strong> Every transformation allocates. The JVM makes this cheap — young-generation allocation is a pointer bump and short-lived garbage is collected almost for free — but in a loop it becomes quadratic, which is the entire subject of the <code>StringBuilder</code> topic later in this chapter.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Calling a String method and discarding the result.</strong> <code>s.trim();</code> on its own does nothing. It must be <code>s = s.trim();</code>.</li>` +
        `<li><strong>Believing reassignment is mutation.</strong> <code>s = s + "!"</code> creates a new object; the original is unchanged and simply abandoned.</li>` +
        `<li><strong>Storing passwords in a <code>String</code>.</strong> You cannot erase it. Use <code>char[]</code> and wipe it, which is why <code>JPasswordField.getPassword()</code> returns one.</li>` +
        `<li><strong>Assuming <code>final class</code> alone gives immutability.</strong> A final class with a mutable field is not immutable. You need final fields, no exposed mutable internals, and defensive copies.</li>` +
        `<li><strong>Answering only "so it can be shared".</strong> True but partial. Security, hash caching and thread safety are the other three.</li>` +
        `<li><strong>Saying a Java String is 2 bytes per char.</strong> Outdated since Java 9's compact strings.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Why is <code>String</code> immutable in Java?"</strong><br>A: Four reasons. Security — strings carry file paths, class names and connection URLs into sensitive APIs, and immutability removes any time-of-check-to-time-of-use window. Hash caching — the hash cannot change, so it is computed once and cached, which matters because strings are the most common map key. Thread safety — no mutable state means no synchronisation is ever needed. And pooling — sharing one object between many references is only safe if nobody can modify it.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How is that immutability actually enforced?"</strong><br>A: Three things together. The character storage is a <code>private final</code> field, no method ever hands that array out, and the class itself is <code>final</code> so no subclass can add mutating behaviour or override methods to misreport the contents. Remove any one and the guarantee collapses.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What are the downsides?"</strong><br>A: Every transformation allocates a new object, so concatenating in a loop is O(n²) in copying — which is what <code>StringBuilder</code> exists to solve. And you cannot erase a string's contents from memory, which is why passwords should be held in a <code>char[]</code> you can overwrite.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Is <code>StringBuilder</code> immutable? Is <code>String</code> thread-safe?"</strong><br>A: <code>StringBuilder</code> is mutable and deliberately not synchronised. <code>String</code> is thread-safe precisely because it is immutable — there is no state to race on. Note the two are different claims: immutable implies thread-safe, but thread-safe does not imply immutable, as <code>StringBuffer</code> shows.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you make your own class immutable?"</strong><br>A: Make the class <code>final</code>; make every field <code>private final</code>; take no setters; copy any mutable object on the way in and on the way out; and return new instances from operations rather than mutating. In modern Java a <code>record</code> gives most of that by construction, though it still needs care if a component is itself mutable.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How many objects does <code>String s = new String(\"hi\");</code> create?"</strong><br>A: Potentially two: the literal <code>"hi"</code> goes into the pool when the class is loaded, and <code>new String(...)</code> allocates a separate object on the heap that copies it. If the literal is already pooled from elsewhere, only the new object is created at that line. Which is the whole reason <code>new String(...)</code> is a code smell — it exists to defeat pooling, and you almost never want that.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Immutable = characters never change. Every "mutator" <strong>returns a new String</strong>.</li>` +
        `<li>Four reasons: <strong>security · hash caching · thread safety · pooling</strong>.</li>` +
        `<li>Enforced by: <code>private final</code> storage + never exposed + <code>final</code> class.</li>` +
        `<li>Hash is <strong>cached</strong> → strings are the ideal map key, and can never go stale.</li>` +
        `<li>Cost: allocation per transformation → O(n²) in loops → use <code>StringBuilder</code>.</li>` +
        `<li>Passwords → <code>char[]</code>, so they can be wiped.</li>` +
        `<li>Java 9 <strong>compact strings</strong>: <code>byte[]</code> + coder, 1 byte per char for Latin-1.</li>` +
        `<li>Pre-7u6 <code>substring</code> shared the array and leaked; it copies now.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'The String Pool and intern()',
      slug: 'string-pool-and-interning',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>The string pool is the reason <code>==</code> sometimes appears to work on strings — which makes it the single most effective trap in Java interviews. A candidate who has only ever compared literals may believe <code>==</code> is fine, and the code works right up until a string arrives from a database or a request body. Understanding the pool turns a memorised rule ("always use <code>equals</code>") into knowledge you can reason from.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>The <strong>string pool</strong> (or string constant pool) is a table of unique <code>String</code> objects the JVM maintains. Every string <em>literal</em> in your source is automatically placed there, and every occurrence of the same literal anywhere in the program refers to that one object. <code>new String("hi")</code> deliberately bypasses the pool and allocates a fresh object.</p>`,
        `{{fig:ch3-string-pool.svg|Four variables where two literals point to a single pooled "hi" object while new String creates a separate heap object and intern returns the pooled one, with a results panel showing which == comparisons are true|Two literals share one pooled object, so == is true. new String() allocates separately, so == is false — even though the characters are identical.}}`,
        `<h2>How it works</h2>`,
        `<p>Literals are pooled at class load time: the constant pool of the <code>.class</code> file contains the text, and on first use the JVM either finds an existing pooled <code>String</code> with those characters or creates one and adds it. Every later use of that same literal — in any class, anywhere in the program — resolves to the identical object.</p>`,
        `<p><strong>Compile-time constant folding</strong> is the part that surprises people. If the compiler can evaluate a concatenation entirely at compile time, the result is a literal and therefore pooled:</p>`,
        `<pre><code class="language-java">String a = "hello";
String b = "hel" + "lo";              // folded by javac into the literal "hello"
System.out.println(a == b);           // true

final String part = "hel";            // final and initialised with a constant
String c = part + "lo";               // still a compile-time constant
System.out.println(a == c);           // true

String prefix = "hel";                // NOT final → not a compile-time constant
String d = prefix + "lo";             // built at RUN time, on the heap
System.out.println(a == d);           // false
System.out.println(a.equals(d));      // true  ← the only comparison that matters</code></pre>`,
        `<p>That is the whole trap in four lines: whether <code>==</code> is true depends on whether <code>javac</code> could fold the expression, which depends on a <code>final</code> keyword somewhere else entirely. It is a superb illustration of why <code>==</code> on strings is never a design you should rely on.</p>`,
        `<p><strong><code>intern()</code></strong> is the manual entry point: <code>s.intern()</code> returns the pooled instance with the same characters, adding <code>s</code> to the pool if no such entry exists. It is occasionally useful for deduplicating a very large number of repeated strings read from input, but it is rarely the right tool — it is not free, and the JVM has a better mechanism (see below).</p>`,
        `<h2>Code examples</h2>`,
        `<p>The four comparisons every interviewer draws from:</p>`,
        `<pre><code class="language-java">String a = "hi";
String b = "hi";
String c = new String("hi");
String d = c.intern();

a == b        // true  — both are the pooled literal
a == c        // false — c is a distinct heap object
a == d        // true  — intern() returned the pooled instance
c == d        // false — c is still its own object
a.equals(c)   // true  — the ONLY comparison that reflects meaning</code></pre>`,
        `<p>Where this becomes a real production bug:</p>`,
        `<pre><code class="language-java">// Works in the unit test, fails against the database.
String status = resultSet.getString("status");   // built at run time
if (status == "ACTIVE") {                        // ✘ always false
    // never reached
}
if ("ACTIVE".equals(status)) {                   // ✔ and null-safe, in this order
    // correct
}
// Note the ordering: literal.equals(variable) cannot throw if the variable
// is null. Or use Objects.equals(a, b), which is null-safe either way.</code></pre>`,
        `<p><code>switch</code> on strings, for completeness, does the right thing automatically:</p>`,
        `<pre><code class="language-java">switch (status) {                 // uses hashCode() then equals() internally
    case "ACTIVE"   -> activate();
    case "INACTIVE" -> deactivate();
    default         -> log(status);
}
// Safe — but it throws NullPointerException on a null selector in classic
// switch. Java 21 pattern-matching switch can handle "case null" explicitly.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>The pool moved, and it matters.</strong> Before Java 7 the string pool lived in PermGen, which was small and fixed — so interning many strings caused <code>OutOfMemoryError: PermGen space</code>. In Java 7 it moved to the main heap, which means pooled strings are now ordinary garbage-collectible objects subject to the normal heap limits. It is implemented as a fixed-bucket hash table whose size is tunable with <code>-XX:StringTableSize</code>; a program that interns millions of strings can degrade badly if that table is too small for the load.</p>`,
        `<p><strong>The modern alternative to <code>intern()</code></strong> is worth knowing, because it is the answer to "how would you reduce memory from duplicate strings?". The G1 collector offers <strong>string deduplication</strong> (<code>-XX:+UseStringDeduplication</code>), which detects <code>String</code> objects with identical contents during GC and makes them share one backing byte array. It gets most of the memory benefit of interning with none of the application-code changes and none of the pool-contention risk. Naming it distinguishes someone who has tuned a real JVM from someone who has read about <code>intern()</code>.</p>`,
        `<p>One last mechanism: at run time, <code>+</code> on non-constant strings does not literally allocate intermediate strings the way older answers claim. Since Java 9, <code>javac</code> compiles string concatenation to an <code>invokedynamic</code> call, and the JDK's <code>StringConcatFactory</code> generates an optimised method at first execution — typically sizing the result exactly and filling it in one pass. This makes a single concatenation expression genuinely efficient. It does <em>not</em> rescue concatenation in a <em>loop</em>, because each iteration is a separate expression that must produce a complete new string.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Comparing strings with <code>==</code>.</strong> It works for literals and fails for anything computed, parsed or read from I/O — the worst possible failure mode.</li>` +
        `<li><strong>Using <code>new String("literal")</code>.</strong> It has no purpose except to defeat pooling. Always write the literal.</li>` +
        `<li><strong>Calling <code>intern()</code> defensively.</strong> It adds pool pressure and lock contention for a benefit you probably do not need. Prefer G1 string deduplication.</li>` +
        `<li><strong>Assuming the pool is in PermGen.</strong> It moved to the heap in Java 7.</li>` +
        `<li><strong>Writing <code>variable.equals("LITERAL")</code>.</strong> Reverse it — <code>"LITERAL".equals(variable)</code> — and the NPE disappears.</li>` +
        `<li><strong>Believing every <code>+</code> creates garbage.</strong> A single expression is optimised via <code>invokedynamic</code>; it is the loop that is the problem.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is the string pool?"</strong><br>A: A JVM-maintained table of unique <code>String</code> objects. Every literal is placed there automatically, so all occurrences of the same literal across the whole program share one object. It exists because strings are immutable, which makes sharing safe, and it saves a great deal of memory given how many duplicate literals a typical program contains.</p></blockquote>`,
        `<blockquote><p><strong>Q: "<code>String a = \"hi\"; String b = new String(\"hi\");</code> — is <code>a == b</code>?"</strong><br>A: No. <code>a</code> refers to the pooled literal; <code>new String</code> explicitly allocates a separate object. <code>a.equals(b)</code> is true because the characters match. <code>b.intern()</code> would return the pooled instance, and that <em>would</em> be <code>==</code> to <code>a</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why is <code>\"hel\" + \"lo\" == \"hello\"</code> true, but not when a variable is involved?"</strong><br>A: Constant folding. If <code>javac</code> can evaluate the expression at compile time — both operands are literals, or a <code>final</code> variable initialised with a constant — the result becomes a literal and is pooled, so <code>==</code> holds. With a non-final variable the concatenation happens at run time and produces a new heap object. That the answer depends on a <code>final</code> keyword elsewhere is the best argument there is for never using <code>==</code> on strings.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What does <code>intern()</code> do, and when would you use it?"</strong><br>A: It returns the pooled instance for those characters, adding the string to the pool if absent. Legitimately useful when a program holds an enormous number of duplicate strings from input and memory matters. But it costs pool insertion and contention, so I would normally reach for G1's <code>-XX:+UseStringDeduplication</code> instead — the GC merges identical strings' backing arrays with no code changes.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Where does the pool live?"</strong><br>A: On the heap since Java 7. Before that it was in PermGen, which was fixed-size and could be exhausted by heavy interning. Moving it to the heap made pooled strings ordinary collectible objects. The table itself is a fixed-bucket hash table sized by <code>-XX:StringTableSize</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How does <code>switch</code> on a String work?"</strong><br>A: The compiler generates a two-step lookup: switch on <code>hashCode()</code> to narrow the candidates, then <code>equals()</code> to confirm — so it is correct regardless of pooling. It throws <code>NullPointerException</code> on a null selector in classic switch; Java 21's pattern-matching switch lets you write <code>case null</code>.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Literals are <strong>pooled automatically</strong>; <code>new String(...)</code> deliberately is not.</li>` +
        `<li><code>==</code> compares identity → true for literals, <strong>false for anything computed at run time</strong>.</li>` +
        `<li><strong>Constant folding</strong>: <code>"hel" + "lo"</code> is a literal; with a non-final variable it is not.</li>` +
        `<li><code>intern()</code> returns the pooled instance. Rarely the right tool.</li>` +
        `<li>Pool moved <strong>PermGen → heap in Java 7</strong>. Table size: <code>-XX:StringTableSize</code>.</li>` +
        `<li>Better memory fix: <strong>G1 <code>-XX:+UseStringDeduplication</code></strong>.</li>` +
        `<li>Always <code>"LITERAL".equals(var)</code> or <code>Objects.equals(a, b)</code> — null-safe.</li>` +
        `<li>Java 9+: a single <code>+</code> expression compiles to <code>invokedynamic</code> and is efficient.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'String vs StringBuilder vs StringBuffer',
      slug: 'stringbuilder-vs-stringbuffer',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>This is asked in almost every Java interview and it has an easy answer everyone gives ("StringBuilder is faster, StringBuffer is synchronised") and a harder one that shows you understand <em>why</em>. It also has a genuinely important practical consequence: string concatenation in a loop is one of the most common real performance bugs in enterprise Java, and it turns a linear job into a quadratic one.</p>`,
        `<h2>The concept, simply</h2>`,
        `<table><thead><tr><th></th><th><code>String</code></th><th><code>StringBuilder</code></th><th><code>StringBuffer</code></th></tr></thead><tbody>` +
        `<tr><td>Mutable</td><td>No</td><td>Yes</td><td>Yes</td></tr>` +
        `<tr><td>Thread-safe</td><td>Yes (immutable)</td><td><strong>No</strong></td><td>Yes (synchronised)</td></tr>` +
        `<tr><td>Speed</td><td>Slow for repeated edits</td><td><strong>Fastest</strong></td><td>Slower than Builder</td></tr>` +
        `<tr><td>Since</td><td>1.0</td><td>Java 5</td><td>1.0</td></tr>` +
        `<tr><td>Use when</td><td>Fixed text, keys, sharing</td><td><strong>Almost always</strong></td><td>Practically never</td></tr>` +
        `</tbody></table>`,
        `<p>The honest summary: use <code>String</code> for values, <code>StringBuilder</code> when you are building text, and <code>StringBuffer</code> essentially never.</p>`,
        `<h2>How it works</h2>`,
        `<p>The performance difference is not a constant factor — it is a change in complexity class:</p>`,
        `{{fig:ch3-string-concat-garbage.svg|Left panel shows four successively longer immutable strings each a new allocation labelled O(n squared); right panel shows one StringBuilder buffer being filled in place with spare capacity labelled O(n)|Concatenation in a loop copies every character accumulated so far, on every iteration. A StringBuilder writes into one buffer that doubles only when full.}}`,
        `<p>With <code>String</code>, iteration <em>i</em> must allocate a new object and copy all <em>i</em> characters accumulated so far. Summing over <em>n</em> iterations gives O(n²) copying, plus <em>n</em> objects of garbage. With <code>StringBuilder</code>, each append writes into an existing <code>byte[]</code>; when it fills, the array doubles, so the total copying across all growth is amortised O(n).</p>`,
        `<p><strong>Why <code>StringBuffer</code> is obsolete</strong> is the part worth articulating. It synchronises every method — <code>append</code>, <code>insert</code>, <code>length</code>, all of them. That costs something even uncontended, but the deeper problem is that per-method synchronisation is almost never the synchronisation you actually need. A builder used by one thread does not need it; a builder genuinely shared across threads needs the whole <em>sequence</em> of appends to be atomic, which locking each call individually does not provide. So <code>StringBuffer</code> pays for safety in the case where it is unnecessary and fails to deliver it in the case where it would matter. <code>StringBuilder</code> was added in Java 5 as the unsynchronised version, and in practice a builder is a local variable — the textbook case for needing no synchronisation at all.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The bug, and its fix:</p>`,
        `<pre><code class="language-java">// ✘ O(n²). At 100,000 items this can take minutes.
String result = "";
for (String item : items) {
    result += item + ",";        // new String allocated and fully copied, every time
}

// ✔ O(n). Milliseconds for the same input.
StringBuilder sb = new StringBuilder();
for (String item : items) {
    sb.append(item).append(',');
}
String result = sb.toString();

// ✔ Cleaner still when you are joining — no manual trailing-comma handling:
String result = String.join(",", items);
String result = items.stream().collect(Collectors.joining(", ", "[", "]"));</code></pre>`,
        `<p>Where <code>+</code> is perfectly fine — and the distinction matters, because "never use +" is wrong advice:</p>`,
        `<pre><code class="language-java">// ✔ Fine. A single expression: javac compiles it to an invokedynamic call
//   that sizes the result and fills it in one pass (Java 9+).
String message = "User " + name + " logged in at " + timestamp;

// ✔ Fine. Compile-time constant — folded by javac into a single literal.
String url = "https://" + HOST + "/api";     // when HOST is a static final constant

// ✘ Not fine. A LOOP: each iteration is a separate expression that must
//   produce a complete new String, so the optimisation cannot help.
for (...) { s += x; }</code></pre>`,
        `<p>Presizing, the small optimisation worth knowing when the length is predictable:</p>`,
        `<pre><code class="language-java">StringBuilder sb = new StringBuilder(1024);   // avoids repeated array growth
// Default capacity is 16 characters; each overflow allocates a new array of
// roughly double the size and copies. Presizing skips that entirely when you
// have a reasonable estimate.

// Reusing one builder across iterations, when that is the shape of the work:
StringBuilder line = new StringBuilder(256);
for (Record r : records) {
    line.setLength(0);                        // clear, keep the capacity
    line.append(r.id()).append('\\t').append(r.name());
    writer.write(line.toString());
}</code></pre>`,
        `<p>And the reason <code>StringBuilder</code> should stay local:</p>`,
        `<pre><code class="language-java">// StringBuilder is NOT thread-safe. Shared across threads, appends interleave
// and can corrupt the internal length/array pair — you can even get
// ArrayIndexOutOfBoundsException from inside append().
//
// The fix is not StringBuffer. It is: give each thread its own builder,
// or collect the pieces and join once.
String result = items.parallelStream().collect(Collectors.joining(","));</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p>Both builders extend the package-private <code>AbstractStringBuilder</code> and share their implementation entirely; <code>StringBuffer</code> simply overrides each method with a <code>synchronized</code> version that calls <code>super</code>. That is the whole difference — same algorithm, one lock.</p>`,
        `<p>Both also got <strong>compact strings</strong> in Java 9, storing a <code>byte[]</code> with a coder flag rather than a <code>char[]</code>. There is a subtlety here worth knowing: if a builder holding Latin-1 content receives a character that does not fit, it must <em>inflate</em> — reallocate as UTF-16 and copy everything. Appending one emoji to a large ASCII builder is therefore unexpectedly expensive. Rarely decisive, but a genuinely modern detail.</p>`,
        `<p>The <strong>Java 9 <code>invokedynamic</code> change</strong> to string concatenation is the piece that dates most interview answers. Older material says every <code>+</code> compiles into a <code>StringBuilder</code> — true up to Java 8. Since Java 9, <code>javac</code> emits an <code>invokedynamic</code> bound to <code>StringConcatFactory</code>, which generates a specialised method at run time that computes the exact length and fills the result in a single pass. It is faster than the old builder-based expansion, and it is why "the compiler turns + into StringBuilder anyway" is no longer accurate. The loop case is unaffected, because the problem there is the repeated production of complete intermediate strings, not the code generated for any one expression.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Concatenating with <code>+=</code> in a loop.</strong> The headline bug. O(n²).</li>` +
        `<li><strong>Concluding that <code>+</code> is always bad.</strong> A single expression is fine and more readable than a builder.</li>` +
        `<li><strong>Reaching for <code>StringBuffer</code> "to be safe".</strong> It pays for a lock you do not need and does not give atomicity across a sequence anyway.</li>` +
        `<li><strong>Sharing one <code>StringBuilder</code> across threads.</strong> It is not thread-safe; give each thread its own or join at the end.</li>` +
        `<li><strong>Building a string just to log it.</strong> <code>log.debug("x=" + x)</code> concatenates even when debug is off. Use the parameterised form <code>log.debug("x={}", x)</code>.</li>` +
        `<li><strong>Hand-rolling a join.</strong> <code>String.join</code> or <code>Collectors.joining</code> handle separators and edge cases for you.</li>` +
        `<li><strong>Ignoring initial capacity for large builds.</strong> The default is 16 characters.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Difference between <code>String</code>, <code>StringBuilder</code> and <code>StringBuffer</code>?"</strong><br>A: <code>String</code> is immutable, so every edit allocates a new object. <code>StringBuilder</code> is a mutable buffer and is not synchronised — the default choice. <code>StringBuffer</code> is the same thing with every method synchronised; it predates <code>StringBuilder</code> and is effectively legacy, because a builder is almost always a local variable that no other thread can see.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why is concatenation in a loop bad?"</strong><br>A: Because strings are immutable, iteration <em>i</em> allocates a new object and copies all the characters accumulated so far, making the whole loop O(n²) in copying and producing <em>n</em> objects of garbage. A <code>StringBuilder</code> appends into one buffer that doubles when full, so the total work is amortised O(n).</p></blockquote>`,
        `<blockquote><p><strong>Q: "Does the compiler not optimise <code>+</code> into a <code>StringBuilder</code> anyway?"</strong><br>A: It did up to Java 8. Since Java 9 it compiles to an <code>invokedynamic</code> call into <code>StringConcatFactory</code>, which generates a method that sizes the result exactly and fills it in one pass — better than the old expansion. Either way it only helps a single expression. In a loop each iteration is its own expression producing a complete new string, so no code generation can rescue it.</p></blockquote>`,
        `<blockquote><p><strong>Q: "When would you actually use <code>StringBuffer</code>?"</strong><br>A: Realistically, only when maintaining old code that already uses it. If I genuinely had a buffer shared across threads I would not want per-method locking anyway — I would need the whole append sequence to be atomic, which <code>StringBuffer</code> does not give me. Far better to give each thread its own builder and join the results.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How would you join a list into a comma-separated string?"</strong><br>A: <code>String.join(",", list)</code> for the simple case, or <code>Collectors.joining(", ", "[", "]")</code> in a stream when I need a prefix and suffix. Both use a builder internally and handle the trailing-separator problem that hand-rolled loops always get wrong.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is <code>StringBuilder</code>'s default capacity?"</strong><br>A: 16 characters, or the initial string's length plus 16. When it fills, the array grows to roughly double and everything is copied — so for a large known build, passing an initial capacity avoids several rounds of that.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><code>String</code> immutable · <code>StringBuilder</code> mutable, <strong>not</strong> synchronised · <code>StringBuffer</code> mutable, synchronised, legacy.</li>` +
        `<li><strong>Default to <code>StringBuilder</code></strong>; a builder is almost always a local variable.</li>` +
        `<li>Loop with <code>+=</code> → <strong>O(n²)</strong>. Builder → amortised O(n).</li>` +
        `<li>A <strong>single</strong> <code>+</code> expression is fine — Java 9+ compiles it via <code>invokedynamic</code>.</li>` +
        `<li>Joining? <code>String.join</code> / <code>Collectors.joining</code>.</li>` +
        `<li>Default capacity <strong>16</strong> — presize for large builds; <code>setLength(0)</code> to reuse.</li>` +
        `<li>Logging: <code>log.debug("x={}", x)</code>, never <code>"x=" + x</code>.</li>` +
        `<li>Both builders share <code>AbstractStringBuilder</code>; <code>StringBuffer</code> only adds <code>synchronized</code>.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Wrapper Classes, Autoboxing and the Integer Cache',
      slug: 'wrappers-and-integer-cache',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>The <code>Integer</code> cache produces the most notorious "what does this print?" question in Java: the same comparison is <code>true</code> at 127 and <code>false</code> at 128. It looks like a language defect, has a precise explanation, and reveals whether a candidate understands the difference between identity and equality. Autoboxing also causes two entirely real production problems — <code>NullPointerException</code> from an innocuous-looking assignment, and allocation storms in numeric loops.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Each primitive has a corresponding <strong>wrapper class</strong> — <code>int</code>/<code>Integer</code>, <code>double</code>/<code>Double</code>, <code>boolean</code>/<code>Boolean</code>, and so on. Wrappers exist because generics and collections work only with reference types: you cannot write <code>List&lt;int&gt;</code>.</p>`,
        `<p><strong>Autoboxing</strong> is the compiler automatically converting between the two. <code>Integer x = 5;</code> becomes <code>Integer.valueOf(5)</code>; <code>int y = x;</code> becomes <code>x.intValue()</code>. Both are silent, and both matter.</p>`,
        `<p>The cache is the twist. <code>Integer.valueOf</code> does not allocate for small values — it returns a shared object from a preallocated table:</p>`,
        `{{fig:ch3-integer-cache.svg|A green cache block containing preallocated Integer objects from minus 128 to 127 with a separate red block showing two distinct objects for 128 and comparison results below|Boxing calls Integer.valueOf, which returns a cached shared instance for −128…127 and a brand-new object above that. Identity changes; equality never does.}}`,
        `<h2>How it works</h2>`,
        `<p>The <strong>cached ranges</strong> are specified, not incidental. The JLS requires boxing to return identical objects for: <code>Boolean</code> <code>true</code>/<code>false</code>, all <code>Byte</code> values, <code>Character</code> 0–127, and <code>Short</code>, <code>Integer</code> and <code>Long</code> from −128 to 127. Above that range, behaviour is implementation-defined, and HotSpot allocates a new object. <code>Float</code> and <code>Double</code> are never cached at all.</p>`,
        `<p>The <code>Integer</code> upper bound is tunable with <code>-XX:AutoBoxCacheMax=&lt;n&gt;</code>, which is a delightful interview fact and a terrible thing to depend on: it means <code>==</code> behaviour on boxed integers can differ between two JVMs running the same code.</p>`,
        `<p><strong>Mixed-type comparison</strong> is the rule that makes it all navigable: if either operand of <code>==</code> is a primitive, the other is unboxed and the values are compared numerically. Only when <em>both</em> sides are wrappers does <code>==</code> compare references.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The famous puzzle:</p>`,
        `<pre><code class="language-java">Integer a = 127, b = 127;
Integer c = 128, d = 128;

System.out.println(a == b);        // true   — same cached object
System.out.println(c == d);        // false  — two separate objects
System.out.println(c.equals(d));   // true   — always correct

int e = 128;
System.out.println(c == e);        // true   — e is a primitive, so c is
                                   //          UNBOXED and 128 == 128</code></pre>`,
        `<p>The production NPE, which is the reason this topic is more than trivia:</p>`,
        `<pre><code class="language-java">Map&lt;String, Integer&gt; counts = new HashMap&lt;&gt;();
int n = counts.get("missing");     // ✘ NullPointerException
// get() returns null; assigning to int inserts null.intValue().
// The line looks like a plain assignment — nothing hints at a method call.

// Fixes, in order of preference:
int n = counts.getOrDefault("missing", 0);        // ✔ clearest
Integer boxed = counts.get("missing");            // ✔ keep it nullable
int n = boxed != null ? boxed : 0;

// The same trap in a ternary — this throws when the map misses, because the
// two branches have types Integer and int, forcing an unboxing of null:
int value = flag ? counts.get(key) : 0;</code></pre>`,
        `<p>The performance trap:</p>`,
        `<pre><code class="language-java">// ✘ Allocates ~2 million Integer objects. Long is worse — every += boxes.
Long sum = 0L;
for (long i = 0; i &lt; 1_000_000; i++) {
    sum += i;                      // unbox, add, box — every iteration
}

// ✔ No allocation at all.
long sum = 0L;
for (long i = 0; i &lt; 1_000_000; i++) sum += i;

// Same reasoning in streams — the primitive specialisations exist for this:
int total = list.stream().mapToInt(Integer::intValue).sum();   // ✔ IntStream
// rather than Stream&lt;Integer&gt;, which boxes at every step.</code></pre>`,
        `<p>And a nastier one, because it is silently wrong rather than slow:</p>`,
        `<pre><code class="language-java">List&lt;Integer&gt; list = new ArrayList&lt;&gt;(List.of(10, 20, 30));
list.remove(1);                    // removes the ELEMENT AT INDEX 1 → 20
list.remove(Integer.valueOf(10));  // removes the OBJECT 10

// remove(int) and remove(Object) are overloads. An int argument picks the
// index version — Chapter 2's overload resolution, biting in the standard
// library. Boxing explicitly is the only way to say what you mean.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Why cache at all?</strong> Small integers are overwhelmingly the common case — loop counters, sizes, status codes, map values. Preallocating 256 objects at class-initialisation time removes an enormous number of allocations from typical programs. The cache is a genuine optimisation; the <code>==</code> weirdness is a side effect of it, not its purpose.</p>`,
        `<p><strong>The memory cost of wrappers</strong> justifies the whole primitive/wrapper split from Chapter 1. An <code>Integer</code> is a heap object: roughly 16 bytes with its header, plus a reference of 4 or 8 bytes to reach it — about 20 bytes to hold a value that fits in 4. A <code>List&lt;Integer&gt;</code> of a million elements costs on the order of 20 MB against 4 MB for an <code>int[]</code>, spread across the heap so that iteration misses cache constantly, and every element adds GC work. This is why <code>IntStream</code>, <code>LongStream</code> and <code>DoubleStream</code> exist as separate types, and why Project Valhalla is trying to erase the distinction.</p>`,
        `<p>One more genuinely useful modern note: <code>Integer</code> and friends carry static helpers that are the right way to do several common things — <code>Integer.parseInt</code> (returns a primitive) versus <code>Integer.valueOf</code> (returns a boxed, possibly cached instance), <code>Integer.compare(a, b)</code> for safe comparison without overflow, and <code>Integer.MAX_VALUE</code>/<code>MIN_VALUE</code>. Since Java 9 the <code>new Integer(5)</code> constructor is deprecated, and removed in later releases — it always allocated, which is exactly what you do not want.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Comparing wrappers with <code>==</code>.</strong> Works below 128 and fails above it, so it survives testing and breaks in production.</li>` +
        `<li><strong>Unboxing a possibly-null wrapper.</strong> The most common NPE in enterprise Java. Use <code>getOrDefault</code> or keep the variable boxed.</li>` +
        `<li><strong>Boxing in hot loops.</strong> Declare the accumulator as a primitive; use <code>IntStream</code>/<code>LongStream</code>.</li>` +
        `<li><strong><code>list.remove(someInt)</code>.</strong> Picks <code>remove(int index)</code>. Wrap with <code>Integer.valueOf(...)</code> when you mean the value.</li>` +
        `<li><strong>Using <code>new Integer(...)</code>.</strong> Deprecated and removed; always allocates. Use <code>Integer.valueOf</code> or just autobox.</li>` +
        `<li><strong>Depending on the cache range.</strong> It is tunable with <code>-XX:AutoBoxCacheMax</code>, so identical code can behave differently on two JVMs.</li>` +
        `<li><strong>Assuming <code>Double</code> is cached.</strong> Floating-point wrappers never are — <code>Double.valueOf(1.0) == Double.valueOf(1.0)</code> is false.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Why is <code>Integer a = 127, b = 127; a == b</code> true but false at 128?"</strong><br>A: Autoboxing calls <code>Integer.valueOf</code>, which returns a shared cached object for −128 to 127 and allocates a new one above that. So at 127 both variables reference the same object and <code>==</code> is true; at 128 they are distinct objects. <code>equals</code> is true in both cases, which is why it is the only correct way to compare wrappers.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Which values are cached?"</strong><br>A: The JLS mandates caching for <code>Boolean</code>, all <code>Byte</code> values, <code>Character</code> 0–127, and <code>Short</code>/<code>Integer</code>/<code>Long</code> from −128 to 127. <code>Float</code> and <code>Double</code> are never cached. The <code>Integer</code> upper bound can be raised with <code>-XX:AutoBoxCacheMax</code>, which is exactly why relying on <code>==</code> is unsafe — the same code can behave differently on two JVMs.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is autoboxing and what does it cost?"</strong><br>A: The compiler inserting conversions between primitives and wrappers — <code>Integer.valueOf</code> one way, <code>intValue()</code> the other. Two costs. Unboxing a null throws <code>NullPointerException</code> at a line that looks like a plain assignment. And boxing in a loop allocates an object per iteration, which is silent GC pressure — declare accumulators as primitives and use the primitive stream types.</p></blockquote>`,
        `<blockquote><p><strong>Q: "<code>Integer x = null; int y = x;</code> — what happens?"</strong><br>A: <code>NullPointerException</code>, because the assignment compiles to <code>x.intValue()</code> and <code>x</code> is null. It is worth stressing that no cast or method call is visible in the source, which is why this bug hides so well in code that reads database results or map lookups.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why do wrapper classes exist?"</strong><br>A: Generics and collections only work with reference types, so there is no <code>List&lt;int&gt;</code>. Wrappers also give primitives a place to hang useful statics — <code>parseInt</code>, <code>MAX_VALUE</code>, <code>compare</code> — and allow null to represent "absent", which a primitive cannot.</p></blockquote>`,
        `<blockquote><p><strong>Q: "<code>list.remove(1)</code> on a <code>List&lt;Integer&gt;</code> — what is removed?"</strong><br>A: The element at index 1, not the value 1. <code>remove(int)</code> and <code>remove(Object)</code> are overloads, and overload resolution happens at compile time on the declared argument type, so an <code>int</code> literal selects the index version. To remove by value you must box explicitly: <code>list.remove(Integer.valueOf(1))</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "<code>parseInt</code> or <code>valueOf</code>?"</strong><br>A: <code>Integer.parseInt</code> returns a primitive <code>int</code>; <code>Integer.valueOf</code> returns an <code>Integer</code>, using the cache where it applies. Use <code>parseInt</code> when you want a number and <code>valueOf</code> when you need an object. Never <code>new Integer(...)</code> — it is deprecated and removed, and it always allocates.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Boxing calls <code>Integer.valueOf</code> → <strong>cached −128…127</strong>, new object above.</li>` +
        `<li>Cached: <code>Boolean</code>, all <code>Byte</code>, <code>Character</code> 0–127, <code>Short</code>/<code>Integer</code>/<code>Long</code> −128…127. <strong>Never <code>Float</code>/<code>Double</code></strong>.</li>` +
        `<li><code>==</code> on two wrappers = identity. <strong>Always <code>equals</code>.</strong></li>` +
        `<li>Wrapper vs primitive in <code>==</code> → the wrapper is <strong>unboxed</strong>, values compared.</li>` +
        `<li>Unboxing null → <strong>NPE</strong>. <code>getOrDefault</code> is the fix.</li>` +
        `<li>Boxing in loops → allocation storm. Use primitives and <code>IntStream</code>/<code>LongStream</code>.</li>` +
        `<li><code>list.remove(1)</code> = <strong>by index</strong>; <code>list.remove(Integer.valueOf(1))</code> = by value.</li>` +
        `<li><code>new Integer(...)</code> is <strong>deprecated and removed</strong>.</li>` +
        `<li>Cache max is tunable (<code>-XX:AutoBoxCacheMax</code>) → never depend on <code>==</code>.</li>` +
        `</ul>`,
      ].join('\n'),
    },
  ],
};
