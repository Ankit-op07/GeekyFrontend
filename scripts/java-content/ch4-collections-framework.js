/**
 * Java Interview Kit — Chapter 4: Collections Framework.
 *
 * The heaviest interview chapter in the kit. HashMap internals alone account
 * for a large share of Java interview questions at every level.
 *
 * ⚠️ Content strings are TEMPLATE LITERALS — never use a backtick inside them,
 * and always escape ${...} as \${...} or it will be interpolated.
 */
module.exports = {
  title: 'Collections Framework',
  slug: 'collections-framework',
  order: 3,
  topics: [
    // ────────────────────────────────────────────────────────────────
    {
      title: 'The Collection Hierarchy',
      slug: 'collection-hierarchy',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Choosing the wrong collection is one of the few design mistakes that is simultaneously a correctness bug, a performance bug and a readability problem. Interviewers open with the hierarchy because it reveals immediately whether you pick collections deliberately or reach for <code>ArrayList</code> and <code>HashMap</code> by reflex. It is also the map you need before the six topics that follow.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>The framework has <strong>two independent roots</strong>, and this is the single most commonly missed fact about it:</p>`,
        `<ul>` +
        `<li><code>Collection</code> — a group of individual elements. Its three main sub-interfaces are <code>List</code>, <code>Set</code> and <code>Queue</code>.</li>` +
        `<li><code>Map</code> — a group of key→value <em>pairs</em>. <strong><code>Map</code> does not extend <code>Collection</code></strong>, because its element is a pair rather than a value, so methods like <code>add(E)</code> would make no sense.</li>` +
        `</ul>`,
        `{{fig:ch4-collection-hierarchy.svg|Left side shows Iterable to Collection branching into List Set and Queue with their implementations; right side shows Map as a separate root with HashMap LinkedHashMap TreeMap ConcurrentHashMap and Hashtable|Two roots, not one. Map is deliberately outside the Collection hierarchy — you can get a Collection view of it with keySet(), values() or entrySet(), but a Map is not itself a Collection.}}`,
        `<h2>How it works</h2>`,
        `<p>Each interface is a contract about <em>semantics</em>; the implementations differ in the data structure that backs them.</p>`,
        `<table><thead><tr><th>Interface</th><th>Guarantees</th><th>Reach for</th></tr></thead><tbody>` +
        `<tr><td><code>List</code></td><td>Ordered by position, duplicates allowed, indexed access</td><td><code>ArrayList</code> — nearly always</td></tr>` +
        `<tr><td><code>Set</code></td><td>No duplicates (by <code>equals</code>)</td><td><code>HashSet</code>; <code>LinkedHashSet</code> for order; <code>TreeSet</code> for sorted</td></tr>` +
        `<tr><td><code>Queue</code> / <code>Deque</code></td><td>Ordered for removal — FIFO, LIFO or by priority</td><td><code>ArrayDeque</code>; <code>PriorityQueue</code> for a heap</td></tr>` +
        `<tr><td><code>Map</code></td><td>Unique keys, one value each</td><td><code>HashMap</code>; <code>LinkedHashMap</code> for order; <code>TreeMap</code> for sorted</td></tr>` +
        `</tbody></table>`,
        `<p>The naming convention is unusually consistent and worth stating out loud, because it lets you predict behaviour you have never looked up: the <strong>prefix names the data structure</strong> and therefore the guarantees. <code>Hash*</code> means a hash table — O(1) average, no order. <code>Linked*</code> means a linked list is threaded through it — insertion order preserved, slightly more memory. <code>Tree*</code> means a red-black tree — O(log n), sorted, and requires the elements to be comparable. So <code>LinkedHashSet</code> needs no separate explanation: a hash set with insertion order.</p>`,
        `<p><strong>Program to the interface.</strong> Declare variables and parameters as <code>List</code>, <code>Set</code>, <code>Map</code>; use the concrete type only at construction. This lets you change the implementation without touching callers, and it is what interviewers expect to see in your code samples.</p>`,
        `<h2>Code examples</h2>`,
        `<pre><code class="language-java">// ✔ Declare the interface, construct the implementation.
List&lt;String&gt; names = new ArrayList&lt;&gt;();
Set&lt;String&gt; unique = new HashSet&lt;&gt;();
Map&lt;String, Integer&gt; counts = new HashMap&lt;&gt;();
Deque&lt;Task&gt; stack = new ArrayDeque&lt;&gt;();

// ✘ Ties every caller to the implementation for no benefit.
ArrayList&lt;String&gt; names = new ArrayList&lt;&gt;();</code></pre>`,
        `<p>The Map-is-not-a-Collection point, and the three views that bridge the gap:</p>`,
        `<pre><code class="language-java">Map&lt;String, Integer&gt; scores = Map.of("asha", 90, "ben", 75);

Set&lt;String&gt; keys          = scores.keySet();     // Set view of the keys
Collection&lt;Integer&gt; vals  = scores.values();     // Collection (values may repeat)
Set&lt;Map.Entry&lt;String,Integer&gt;&gt; pairs = scores.entrySet();   // the pairs

// entrySet() is the right way to iterate — one pass, no repeated lookups:
for (Map.Entry&lt;String, Integer&gt; e : scores.entrySet()) {
    System.out.println(e.getKey() + " = " + e.getValue());
}

// ✘ This does a full get() for every key — twice the work:
for (String k : scores.keySet()) System.out.println(k + " = " + scores.get(k));</code></pre>`,
        `<p>Factory methods worth knowing, and the trap in one of them:</p>`,
        `<pre><code class="language-java">// Java 9+ — IMMUTABLE, and the clearest way to write a fixed collection.
List&lt;String&gt; a = List.of("x", "y");        // add() throws UnsupportedOperationException
Set&lt;String&gt; b  = Set.of("x", "y");         // duplicate arguments throw at construction
Map&lt;String,Integer&gt; c = Map.of("x", 1);    // rejects null keys AND null values

// Older, and NOT the same thing — a fixed-size view backed by the array:
List&lt;String&gt; d = Arrays.asList("x", "y");
d.set(0, "z");        // ✔ allowed — writes through to the array
// d.add("w");        // ✘ UnsupportedOperationException — size is fixed

// To get a mutable copy from either:
List&lt;String&gt; mutable = new ArrayList&lt;&gt;(List.of("x", "y"));</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>The legacy classes</strong> come up constantly, and knowing why they are legacy is a better answer than knowing that they are. <code>Vector</code> and <code>Hashtable</code> predate the framework (they are from Java 1.0) and synchronise every method. That is the wrong granularity: it costs on every call in the single-threaded case, and it still does not make a <em>sequence</em> of operations atomic, which is what concurrent code actually needs. <code>Stack</code> is worse — it extends <code>Vector</code>, so it inherits <code>get(int)</code> and <code>add(int, E)</code> and you can reach into the middle of a stack, which defeats the point. Use <code>ArrayDeque</code> for a stack and <code>ConcurrentHashMap</code> for a concurrent map.</p>`,
        `<p><strong><code>null</code> handling differs by implementation</strong> and it is a favourite question:</p>`,
        `<table><thead><tr><th>Type</th><th>null key</th><th>null value</th></tr></thead><tbody>` +
        `<tr><td><code>HashMap</code></td><td>One allowed</td><td>Allowed</td></tr>` +
        `<tr><td><code>TreeMap</code></td><td>No — must compare</td><td>Allowed</td></tr>` +
        `<tr><td><code>Hashtable</code></td><td>No</td><td>No</td></tr>` +
        `<tr><td><code>ConcurrentHashMap</code></td><td><strong>No</strong></td><td><strong>No</strong></td></tr>` +
        `<tr><td><code>List.of</code> / <code>Map.of</code></td><td>No</td><td>No</td></tr>` +
        `</tbody></table>`,
        `<p><code>ConcurrentHashMap</code>'s refusal has a good reason worth quoting: in a concurrent map, <code>get(k)</code> returning null would be ambiguous — absent, or present-with-a-null-value? In a single-threaded <code>HashMap</code> you can disambiguate with <code>containsKey</code>, but concurrently the answer could change between the two calls. Banning null removes the ambiguity entirely.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Saying <code>Map</code> extends <code>Collection</code>.</strong> It does not, and the reason (elements vs pairs) is the interesting half of the answer.</li>` +
        `<li><strong>Declaring concrete types.</strong> <code>ArrayList&lt;X&gt; list = ...</code> couples callers to an implementation choice.</li>` +
        `<li><strong>Iterating with <code>keySet()</code> then <code>get()</code>.</strong> Use <code>entrySet()</code> — half the lookups.</li>` +
        `<li><strong>Assuming <code>Arrays.asList</code> is immutable.</strong> It is fixed-size but writable, and writes through to the backing array.</li>` +
        `<li><strong>Calling <code>add</code> on a <code>List.of(...)</code>.</strong> Genuinely immutable — it throws.</li>` +
        `<li><strong>Using <code>Vector</code>, <code>Hashtable</code> or <code>Stack</code>.</strong> Legacy. Use <code>ArrayList</code>, <code>ConcurrentHashMap</code>, <code>ArrayDeque</code>.</li>` +
        `<li><strong>Putting null in a <code>ConcurrentHashMap</code>.</strong> Throws <code>NullPointerException</code> — by design.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Walk me through the collection hierarchy."</strong><br>A: Two roots. <code>Collection</code> extends <code>Iterable</code> and splits into <code>List</code> (ordered, duplicates, indexed), <code>Set</code> (no duplicates) and <code>Queue</code>/<code>Deque</code> (ordered for removal). <code>Map</code> is separate and does not extend <code>Collection</code>, because it holds key–value pairs rather than elements — though <code>keySet()</code>, <code>values()</code> and <code>entrySet()</code> give you collection views of it.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why is <code>Map</code> not a <code>Collection</code>?"</strong><br>A: Because the abstractions do not fit. <code>Collection</code>'s contract is built around a single element type — <code>add(E)</code>, <code>contains(E)</code>, <code>iterator()</code> over <code>E</code>. A map's unit is a pair, so those methods would either be meaningless or need an arbitrary choice between key and value. Keeping them separate and offering explicit views is cleaner than forcing the inheritance.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you choose between <code>List</code>, <code>Set</code> and <code>Map</code>?"</strong><br>A: By the question I need to answer. If I need order and duplicates, or index access — <code>List</code>. If I need "have I seen this?" with no duplicates — <code>Set</code>. If I need "what is associated with this key?" — <code>Map</code>. Then the prefix picks the implementation: <code>Hash</code> for speed with no order, <code>Linked</code> to keep insertion order, <code>Tree</code> when I need sorting or range queries.</p></blockquote>`,
        `<blockquote><p><strong>Q: "<code>Arrays.asList</code> vs <code>List.of</code>?"</strong><br>A: <code>Arrays.asList</code> returns a fixed-size, mutable view backed by the array — <code>set</code> works and writes through, <code>add</code> throws, and it permits nulls. <code>List.of</code> (Java 9+) returns a genuinely immutable list that rejects nulls and throws on any modification. I use <code>List.of</code> unless I specifically need the array view.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why can't <code>ConcurrentHashMap</code> hold nulls?"</strong><br>A: Ambiguity that cannot be resolved concurrently. If <code>get(k)</code> returned null, you could not tell "absent" from "mapped to null". In a <code>HashMap</code> you would call <code>containsKey</code> to disambiguate, but in a concurrent map the state can change between the two calls, so the check is worthless. Banning null makes null unambiguously mean absent.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is wrong with <code>Vector</code> and <code>Stack</code>?"</strong><br>A: Both are Java 1.0 classes that synchronise every method — overhead when you do not need it, and insufficient when you do, since locking each call does not make a sequence atomic. <code>Stack</code> additionally extends <code>Vector</code>, so it exposes indexed access and you can insert into the middle of a "stack". <code>ArrayDeque</code> is the modern replacement and is faster.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><strong>Two roots</strong>: <code>Collection</code> (List/Set/Queue) and <code>Map</code>. Map is <strong>not</strong> a Collection.</li>` +
        `<li>Prefix = structure: <strong>Hash</strong> (O(1), no order) · <strong>Linked</strong> (insertion order) · <strong>Tree</strong> (O(log n), sorted).</li>` +
        `<li>Declare the <strong>interface</strong>, construct the implementation.</li>` +
        `<li>Iterate maps with <strong><code>entrySet()</code></strong>, never keySet + get.</li>` +
        `<li><code>List.of</code> = immutable, no nulls. <code>Arrays.asList</code> = fixed-size, writable view.</li>` +
        `<li><code>HashMap</code>: 1 null key, null values OK. <strong><code>ConcurrentHashMap</code>: no nulls at all.</strong></li>` +
        `<li>Legacy: <code>Vector</code>, <code>Hashtable</code>, <code>Stack</code> → use <code>ArrayList</code>, <code>ConcurrentHashMap</code>, <code>ArrayDeque</code>.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'ArrayList vs LinkedList',
      slug: 'arraylist-vs-linkedlist',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Every candidate can recite the Big-O table for this comparison, and most draw the wrong practical conclusion from it. <code>LinkedList</code> has better asymptotic complexity for insertion, and is nevertheless slower than <code>ArrayList</code> for almost every real workload. Being able to explain <em>why</em> the theory misleads here — memory layout and cache behaviour — is one of the clearest ways to sound like an engineer rather than a textbook.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p><code>ArrayList</code> stores elements in a single <code>Object[]</code>, resized by copying when full. <code>LinkedList</code> stores each element in its own <code>Node</code> object holding <code>prev</code>, <code>item</code> and <code>next</code> pointers.</p>`,
        `{{fig:ch4-arraylist-vs-linkedlist.svg|Top shows an ArrayList as one contiguous array with spare capacity; bottom shows a LinkedList as separate node boxes joined by forward and backward pointer arrows|The picture explains the performance. Contiguous memory means index arithmetic and CPU prefetching; a pointer chain means a potential cache miss per element and ~24 bytes of overhead per node.}}`,
        `<h2>How it works</h2>`,
        `<table><thead><tr><th>Operation</th><th><code>ArrayList</code></th><th><code>LinkedList</code></th></tr></thead><tbody>` +
        `<tr><td><code>get(i)</code> / <code>set(i)</code></td><td><strong>O(1)</strong></td><td>O(n) — walks from the nearer end</td></tr>` +
        `<tr><td><code>add(e)</code> at the end</td><td>O(1) amortised</td><td>O(1)</td></tr>` +
        `<tr><td><code>add(0, e)</code> at the front</td><td>O(n) — shifts everything</td><td><strong>O(1)</strong></td></tr>` +
        `<tr><td><code>add(i, e)</code> in the middle</td><td>O(n) shift</td><td>O(n) to <em>find</em>, then O(1)</td></tr>` +
        `<tr><td><code>remove</code> via an iterator you hold</td><td>O(n) shift</td><td><strong>O(1)</strong></td></tr>` +
        `<tr><td><code>contains(e)</code></td><td>O(n)</td><td>O(n)</td></tr>` +
        `<tr><td>Memory per element</td><td>1 reference (+ spare capacity)</td><td><strong>~40 bytes</strong> — node object + 3 references</td></tr>` +
        `</tbody></table>`,
        `<p>The row that decides real cases is the last one. A <code>LinkedList</code> node is a separate heap object with its own header, so each element costs roughly 40 bytes against 4–8 for an <code>ArrayList</code> slot. Worse, those nodes are scattered wherever the allocator put them, so walking the list is a sequence of unpredictable memory jumps. An <code>ArrayList</code>'s elements sit adjacent, and modern CPUs prefetch the next cache line automatically — often making an O(n) array shift, which is a single fast <code>System.arraycopy</code>, beat an O(1) linked insertion that had to be located first.</p>`,
        `<p><strong>ArrayList growth:</strong> the default capacity is 10 (allocated lazily on first add). When full, it allocates a new array of about 1.5× the size and copies. That growth is amortised O(1) per add, but each individual resize is O(n) and allocates a fresh array — which is why presizing matters when you know the size.</p>`,
        `<h2>Code examples</h2>`,
        `<pre><code class="language-java">// Presize when you know roughly how many elements are coming.
List&lt;String&gt; list = new ArrayList&lt;&gt;(10_000);   // no intermediate resizes

// The O(n²) trap: removing by value in a loop shifts on every removal.
for (int i = 0; i &lt; list.size(); i++) {
    if (shouldRemove(list.get(i))) list.remove(i--);   // ✘ shifts + fiddly index
}

// ✔ Java 8+: one pass, handled correctly by the implementation.
list.removeIf(this::shouldRemove);</code></pre>`,
        `<p>The LinkedList trap that catches everyone — O(1) insertion is only O(1) if you are already there:</p>`,
        `<pre><code class="language-java">LinkedList&lt;Integer&gt; list = new LinkedList&lt;&gt;(/* 100k elements */);

// ✘ O(n²). "Insertion is O(1)" is true only once you HAVE the node — and
//   get(i)/add(i, e) must walk the chain to find it first.
for (int i = 0; i &lt; list.size(); i++) {
    list.add(i, compute(i));
}

// ✔ O(n). The iterator already holds the current node, so add/remove
//   through it really is O(1).
ListIterator&lt;Integer&gt; it = list.listIterator();
while (it.hasNext()) {
    int v = it.next();
    if (v &lt; 0) it.remove();       // genuinely O(1)
}</code></pre>`,
        `<p>And what to use instead when you thought you wanted a <code>LinkedList</code>:</p>`,
        `<pre><code class="language-java">// Queue or stack? ArrayDeque beats LinkedList on both speed and memory —
// a growable circular array, no per-element node objects.
Deque&lt;Task&gt; stack = new ArrayDeque&lt;&gt;();
stack.push(task);                 // LIFO
stack.pop();

Deque&lt;Task&gt; queue = new ArrayDeque&lt;&gt;();
queue.offer(task);                // FIFO
queue.poll();

// LinkedList's honest niche is narrow: you need List AND Deque in one type,
// or you are doing heavy iterator-based splicing in the middle of a big list.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong><code>ArrayList</code> removal is a single <code>System.arraycopy</code></strong>, which is an intrinsic — the JIT replaces it with a tight, vectorised memory move rather than a Java loop. Shifting 10,000 references is genuinely fast in absolute terms, which is the mechanical reason the Big-O comparison misleads. Complexity classes describe growth, not constants, and here the constants differ by an order of magnitude in <code>ArrayList</code>'s favour.</p>`,
        `<p><strong>Both are fail-fast and neither is thread-safe.</strong> Concurrent structural modification throws <code>ConcurrentModificationException</code> on the next iteration step (last topic in this chapter). For concurrent use, <code>CopyOnWriteArrayList</code> suits read-heavy workloads with rare writes; otherwise use explicit locking or a concurrent queue.</p>`,
        `<p><strong><code>subList</code> is a view, not a copy</strong>, which surprises people and is occasionally exploited deliberately. It writes through to the backing list, and structurally modifying the parent invalidates it. <code>list.subList(0, 5).clear()</code> is a legitimate idiom for removing a range in one call — and an accidental way to destroy data if you thought you had a copy.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Choosing <code>LinkedList</code> because "insertion is O(1)".</strong> It is O(1) only at the ends or through an iterator you already hold. Positional insertion still walks the chain.</li>` +
        `<li><strong>Calling <code>get(i)</code> on a <code>LinkedList</code> in a loop.</strong> That is O(n²). Iterate with the for-each loop or an iterator.</li>` +
        `<li><strong>Removing inside an index loop.</strong> Skips elements and shifts repeatedly. Use <code>removeIf</code> or an iterator's <code>remove()</code>.</li>` +
        `<li><strong>Not presizing a large <code>ArrayList</code>.</strong> Repeated 1.5× growth means several array allocations and copies.</li>` +
        `<li><strong>Using <code>LinkedList</code> as a queue.</strong> <code>ArrayDeque</code> is faster and uses far less memory.</li>` +
        `<li><strong>Treating <code>subList</code> as a copy.</strong> It is a live view.</li>` +
        `<li><strong>Ignoring the memory difference.</strong> A million-element <code>LinkedList</code> costs tens of megabytes more than the equivalent <code>ArrayList</code>.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "<code>ArrayList</code> vs <code>LinkedList</code> — when would you use each?"</strong><br>A: <code>ArrayList</code> for essentially everything. It is backed by a contiguous array, so indexed access is O(1) and iteration is cache-friendly. <code>LinkedList</code> only wins for O(1) insertion and removal at the ends or through an iterator you already hold — and even then, if I want a queue or stack I would use <code>ArrayDeque</code>, which beats it on both counts. In practice I reach for <code>LinkedList</code> almost never.</p></blockquote>`,
        `<blockquote><p><strong>Q: "But <code>LinkedList</code> has O(1) insertion — why is it slower?"</strong><br>A: Two reasons. First, that O(1) applies only once you are positioned at the node; <code>add(i, e)</code> must walk there, so positional insertion is O(n) anyway. Second, constants dominate at realistic sizes: <code>ArrayList</code>'s shift is one <code>System.arraycopy</code>, a JIT intrinsic on contiguous memory that the CPU prefetches, while <code>LinkedList</code> chases pointers to scattered objects and misses cache on each hop, with about 40 bytes of overhead per element.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How does <code>ArrayList</code> grow?"</strong><br>A: It starts at capacity 10, allocated lazily on the first add. When full it allocates a new array of roughly 1.5× the size, copies everything over with <code>System.arraycopy</code>, and drops the old one. That makes <code>add</code> amortised O(1), though any individual add can be O(n). Passing an initial capacity avoids the intermediate allocations entirely.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you remove elements while iterating?"</strong><br>A: <code>removeIf(predicate)</code> is the clearest. Otherwise use an explicit <code>Iterator</code> and call <code>it.remove()</code>, which updates the iterator's expected modification count. Never call <code>list.remove(...)</code> inside a for-each loop — that throws <code>ConcurrentModificationException</code>. And never use an index loop with <code>remove(i)</code>, which silently skips elements as everything shifts left.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Is <code>ArrayList</code> thread-safe? What are the alternatives?"</strong><br>A: No. <code>Collections.synchronizedList</code> wraps it with a lock per method, though you still need external synchronisation around iteration. <code>CopyOnWriteArrayList</code> is better when reads vastly outnumber writes — every write copies the whole array, so iteration is lock-free over an immutable snapshot and never throws. For a producer/consumer workload I would use a concurrent queue instead of a list.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What does <code>subList</code> return?"</strong><br>A: A view onto the original list, not a copy — writes go through to the backing list, and structurally modifying the parent invalidates the view. That makes <code>list.subList(a, b).clear()</code> a neat way to delete a range, and makes it a trap if you assumed you had an independent copy. Wrap it in <code>new ArrayList&lt;&gt;(...)</code> when you want one.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><strong>Default to <code>ArrayList</code>.</strong> Contiguous array, O(1) index, cache-friendly.</li>` +
        `<li><code>LinkedList</code>: O(1) only at the <strong>ends</strong> or via a held <strong>iterator</strong>. <code>get(i)</code> is O(n).</li>` +
        `<li>~40 bytes/element for LinkedList vs 4–8 — plus cache misses on every hop.</li>` +
        `<li>Growth: capacity 10 → <strong>×1.5</strong> with <code>System.arraycopy</code>. Presize when you can.</li>` +
        `<li>Queue or stack → <strong><code>ArrayDeque</code></strong>, not <code>LinkedList</code>, not <code>Stack</code>.</li>` +
        `<li>Removing while iterating → <strong><code>removeIf</code></strong> or <code>Iterator.remove()</code>.</li>` +
        `<li><code>subList</code> is a <strong>view</strong>. Both classes are fail-fast and not thread-safe.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'HashMap Internals',
      slug: 'hashmap-internals',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>If there is one topic that decides Java interviews, this is it. It is asked at every level, from "how does a <code>HashMap</code> work?" for a fresher to "walk me through resize under concurrent writes" for a senior. It rewards genuine understanding and punishes memorisation, because the follow-ups go one layer deeper each time. It is also the payoff for Chapter 2's <code>equals</code>/<code>hashCode</code> contract — everything here explains <em>why</em> that contract exists.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A <code>HashMap</code> is an array of <em>bins</em> (the <code>table</code>). To store a key it computes a number from the key, turns that into an array index, and puts the entry there. To look one up it repeats the calculation and goes straight to that index — which is why average lookup is O(1) rather than a scan.</p>`,
        `<p>When two different keys land on the same index — a <strong>collision</strong>, which is inevitable — the entries are chained in that bin and compared with <code>equals</code>.</p>`,
        `{{fig:ch4-hashmap-internals.svg|Three numbered steps showing hashCode then the spread function then the index mask feeding into a table where one bin holds a single entry and another holds a chain of three colliding entries with a note about treeification|The full put path. Note step 2: the spread function XORs the high 16 bits down, because step 3's mask would otherwise discard them entirely.}}`,
        `<h2>How it works</h2>`,
        `<p><strong>Step 1 — <code>hashCode()</code>.</strong> Your implementation, returning a 32-bit int.</p>`,
        `<p><strong>Step 2 — spreading.</strong> <code>HashMap</code> does not use your hash directly. It applies <code>h ^ (h &gt;&gt;&gt; 16)</code>, XOR-ing the top 16 bits into the bottom 16. The reason is step 3: because the table length is a power of two, the index is computed with a bitmask that keeps only the <em>low</em> bits. Without spreading, two keys differing only in their high bits would always collide. This one line rescues mediocre <code>hashCode</code> implementations.</p>`,
        `<p><strong>Step 3 — index.</strong> <code>index = hash &amp; (table.length - 1)</code>. Because the length is always a power of two, subtracting one gives a mask of low bits, and a bitwise AND is far cheaper than a modulo. That is the whole reason capacities are powers of two.</p>`,
        `<p><strong>Step 4 — walk the bin.</strong> If the bin is empty, store the node. Otherwise compare each existing entry: first by hash (a cheap int comparison), then by <code>equals</code>. A match replaces the value; no match appends a new node.</p>`,
        `<p><strong>Treeification (Java 8).</strong> Before Java 8, a heavily-collided bin was a linked list and lookup degraded to O(n) — which was a real denial-of-service vector, since an attacker who could choose keys could force every entry into one bin. Java 8 added a fix: when a bin reaches <strong>8</strong> nodes <em>and</em> the table is at least <strong>64</strong> long, the bin converts into a red-black tree, giving O(log n) worst case. It reverts to a list below 6 nodes. Below a table length of 64, the map resizes instead — spreading entries is cheaper than building a tree.</p>`,
        `<p><strong>Resize.</strong> When <code>size &gt; capacity × loadFactor</code> (default 0.75), the table doubles:</p>`,
        `{{fig:ch4-hashmap-resize.svg|Left panel shows a capacity-16 table with long bins reaching the threshold; right panel shows the capacity-32 table where entries either stayed at the same index or moved by exactly the old capacity|Doubling means one extra hash bit decides each entry's fate: it stays at index i, or moves to i + oldCapacity. Java 8 splits each bin into a "low" and "high" list in a single pass, with no rehashing.}}`,
        `<h2>Code examples</h2>`,
        `<p>Sizing, which is the practical takeaway:</p>`,
        `<pre><code class="language-java">// Default: capacity 16, load factor 0.75 → resizes at 13 entries.
Map&lt;String, Integer&gt; m = new HashMap&lt;&gt;();

// Storing ~1000 entries with the default means resizing at 13, 25, 49, 97,
// 193, 385, 769 — seven table allocations and seven full rehomings.
// Presize instead. Divide by the load factor so it never resizes:
Map&lt;String, Integer&gt; sized = new HashMap&lt;&gt;((int) (1000 / 0.75f) + 1);

// Java 19+ makes this readable and removes the arithmetic entirely:
Map&lt;String, Integer&gt; better = HashMap.newHashMap(1000);</code></pre>`,
        `<p>The modern API most people still do not use:</p>`,
        `<pre><code class="language-java">Map&lt;String, List&lt;String&gt;&gt; index = new HashMap&lt;&gt;();

// ✘ The old dance — two lookups and a null check.
List&lt;String&gt; list = index.get(key);
if (list == null) { list = new ArrayList&lt;&gt;(); index.put(key, list); }
list.add(value);

// ✔ One call, one lookup.
index.computeIfAbsent(key, k -&gt; new ArrayList&lt;&gt;()).add(value);

// Counting:
Map&lt;String, Integer&gt; counts = new HashMap&lt;&gt;();
counts.merge(word, 1, Integer::sum);            // ✔ the idiomatic word count
counts.put(word, counts.getOrDefault(word, 0) + 1);   // equivalent, two lookups

// Careful: computeIfAbsent removes the entry if the function returns null,
// and it is illegal to modify the same map inside the function — that throws
// ConcurrentModificationException in Java 9+.</code></pre>`,
        `<p>What a bad <code>hashCode</code> does to you:</p>`,
        `<pre><code class="language-java">class BadKey {
    final String id;
    BadKey(String id) { this.id = id; }
    @Override public int hashCode() { return 1; }        // ✘ legal, catastrophic
    @Override public boolean equals(Object o) {
        return o instanceof BadKey k &amp;&amp; id.equals(k.id);
    }
}
// Every key lands in bin 1. The map degrades to a single chain — and, past 8
// entries with a table of 64+, to a single red-black tree. Lookup becomes
// O(log n) at best instead of O(1). The contract is satisfied; the
// performance is destroyed. Correct is not the same as good.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Why 0.75?</strong> It is the documented trade-off point between space and time. Lower means more empty buckets and fewer collisions; higher means a denser table and longer chains. The javadoc notes that with a good hash function, entry counts per bin follow a Poisson distribution at this load factor, and the probability of a bin reaching 8 entries is on the order of one in ten million — which is exactly why the treeify threshold is 8. That number is not arbitrary; it was chosen so that treeification is a safety net for adversarial or pathological hashes, not a normal occurrence.</p>`,
        `<p><strong>The Java 7 infinite loop</strong> is the best-known <code>HashMap</code> war story, and worth being able to tell. In Java 7, resize re-inserted entries at the head of each new bin, which reversed each chain. Two threads resizing simultaneously could weave a <em>cycle</em> into a bin's linked list, and a later <code>get()</code> would spin forever at 100% CPU — a hung production server with no exception in any log. Java 8's split-in-place resize preserves relative order and does not reverse chains, so that specific failure is gone. But <code>HashMap</code> is still <strong>not thread-safe</strong>: concurrent writes can still lose updates and corrupt the size. Use <code>ConcurrentHashMap</code>.</p>`,
        `<p><strong>Hash-collision DoS</strong> was the security motivation for treeification. Before Java 8, an attacker who could control map keys — form parameters, JSON fields, HTTP headers — could submit thousands of keys engineered to collide, turning every insertion into a linear scan and pinning a CPU with a small request. Treeification caps that at O(log n). It is a good answer to "why did they add red-black trees?", because the honest answer is security rather than everyday performance.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Mutable keys.</strong> Change a field <code>hashCode</code> uses and the entry is stranded in the wrong bin — unreachable even by the same key object.</li>` +
        `<li><strong>Overriding <code>equals</code> without <code>hashCode</code>.</strong> Chapter 2's contract; here you can see the exact mechanism it breaks.</li>` +
        `<li><strong>Using <code>HashMap</code> from multiple threads.</strong> Not thread-safe. Lost updates, corrupt size, and historically an infinite loop.</li>` +
        `<li><strong>Not presizing.</strong> Loading 10,000 entries into a default map costs ten resizes and ten full rehomings.</li>` +
        `<li><strong>A constant or near-constant <code>hashCode</code>.</strong> Legal, and it destroys the data structure.</li>` +
        `<li><strong>Relying on iteration order.</strong> It is bucket order and can change on resize. Use <code>LinkedHashMap</code> if order matters.</li>` +
        `<li><strong>Modifying the map inside <code>computeIfAbsent</code>.</strong> Throws <code>ConcurrentModificationException</code> in Java 9+.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "How does <code>HashMap</code> work internally?"</strong><br>A: It is an array of bins. On <code>put</code>, it calls <code>hashCode()</code>, applies a spread function (<code>h ^ h &gt;&gt;&gt; 16</code>) to mix the high bits down, then masks with <code>length - 1</code> to get the index. If that bin is empty it stores a node; otherwise it walks the bin comparing hash first and then <code>equals</code>, replacing on a match and appending otherwise. <code>get</code> repeats the same calculation. Average O(1); worst case O(n) before Java 8, O(log n) after treeification.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is the spread function for?"</strong><br>A: The index only uses the low bits, because the mask is <code>length - 1</code> on a power-of-two table. So two hash codes that differ only in their high bits would always collide. XOR-ing the top 16 bits down means the high bits still influence the index. It is a cheap way to tolerate mediocre <code>hashCode</code> implementations.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why is capacity always a power of two?"</strong><br>A: So the index can be computed with <code>hash &amp; (length - 1)</code> instead of a modulo, which is much cheaper. It also makes resize elegant: doubling means exactly one more hash bit participates, so each entry either stays at index <em>i</em> or moves to <em>i</em> + oldCapacity — the bin can be split in one pass with no rehashing.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What changed in Java 8?"</strong><br>A: Treeification and a safer resize. A bin with 8 or more nodes, in a table of at least 64, converts from a linked list to a red-black tree, so worst-case lookup drops from O(n) to O(log n) — motivated by hash-collision denial-of-service attacks. And resize now splits each bin in place preserving order, instead of re-inserting at the head, which eliminated the Java 7 concurrent-resize infinite loop.</p></blockquote>`,
        `<blockquote><p><strong>Q: "When does it resize, and what does that cost?"</strong><br>A: When size exceeds capacity × load factor — 16 × 0.75 = 12 by default, so the 13th entry triggers it. The table doubles and every entry is rehomed. That is O(n) work, and repeatedly for a growing map, so I presize with <code>HashMap.newHashMap(n)</code> (Java 19+) or <code>new HashMap&lt;&gt;((int)(n / 0.75f) + 1)</code> when the size is known.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What happens with a bad <code>hashCode</code>?"</strong><br>A: Correctness survives; performance collapses. If every key returns the same value, all entries land in one bin and lookup becomes linear — or logarithmic after treeification. The map still returns the right answers, which is what makes it so insidious: the only symptom is that an O(1) structure is behaving like a list.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why is <code>HashMap</code> not thread-safe, and what would you use?"</strong><br>A: No synchronisation at all, so concurrent writes can lose entries, corrupt the size counter, and in Java 7 could weave a cycle into a bin during simultaneous resizes and hang a thread at 100% CPU forever. Java 8's resize fixed that specific loop but the class is still unsafe. Use <code>ConcurrentHashMap</code> — bin-level locking, lock-free reads, and it scales with cores.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Path: <code>hashCode()</code> → <strong>spread</strong> <code>h ^ (h&gt;&gt;&gt;16)</code> → <strong>index</strong> <code>h &amp; (n−1)</code> → walk bin (hash, then <code>equals</code>).</li>` +
        `<li>Capacity is a <strong>power of two</strong> → mask instead of modulo, and a clean resize split.</li>` +
        `<li>Defaults: <strong>capacity 16, load factor 0.75</strong> → resize at 13.</li>` +
        `<li>Resize doubles; an entry stays at <em>i</em> or moves to <em>i</em> + oldCapacity. No rehashing.</li>` +
        `<li><strong>Treeify at 8 nodes if table ≥ 64</strong>; untreeify at 6. O(n) → O(log n). Motivated by collision DoS.</li>` +
        `<li>Presize: <code>HashMap.newHashMap(n)</code> (19+) or <code>(int)(n/0.75f)+1</code>.</li>` +
        `<li>Use <code>computeIfAbsent</code> / <code>merge</code> / <code>getOrDefault</code>, not get-check-put.</li>` +
        `<li><strong>Keys must be effectively immutable.</strong> Not thread-safe — Java 7 could infinite-loop on resize.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'LinkedHashMap and TreeMap',
      slug: 'linkedhashmap-and-treemap',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p><code>HashMap</code>'s iteration order is arbitrary, and code that quietly depends on it is a bug waiting for a resize. Knowing the two ordered alternatives — and their costs — is what lets you answer "how would you build an LRU cache?" or "how do you find all entries between two keys?" without inventing something from scratch. Both questions are common, and both have a one-line answer if you know these classes.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Three maps, three orderings, three costs:</p>`,
        `{{fig:ch4-map-ordering.svg|Three panels showing the same three puts iterated in bucket order by HashMap insertion order by LinkedHashMap and alphabetical order by TreeMap|The same three puts, three different iteration orders. HashMap's is an artefact of hashing and may change on resize — never depend on it.}}`,
        `<ul>` +
        `<li><strong><code>LinkedHashMap</code></strong> extends <code>HashMap</code> and threads a doubly-linked list through the entries. Full O(1) hash performance, plus a predictable order — insertion order by default, or <em>access</em> order on request.</li>` +
        `<li><strong><code>TreeMap</code></strong> is a red-black tree, sorted by key. O(log n) instead of O(1), in exchange for sorting and range queries.</li>` +
        `</ul>`,
        `<h2>How it works</h2>`,
        `<table><thead><tr><th></th><th><code>HashMap</code></th><th><code>LinkedHashMap</code></th><th><code>TreeMap</code></th></tr></thead><tbody>` +
        `<tr><td>Order</td><td>None (bucket order)</td><td>Insertion, or access</td><td>Sorted by key</td></tr>` +
        `<tr><td>get / put</td><td>O(1) average</td><td>O(1) average</td><td>O(log n)</td></tr>` +
        `<tr><td>Memory</td><td>Baseline</td><td>+2 references per entry</td><td>Tree nodes</td></tr>` +
        `<tr><td>null key</td><td>One allowed</td><td>One allowed</td><td><strong>No</strong> — must be comparable</td></tr>` +
        `<tr><td>Extra API</td><td>—</td><td><code>removeEldestEntry</code></td><td><code>firstKey</code>, <code>floorKey</code>, <code>headMap</code>, <code>subMap</code>…</td></tr>` +
        `</tbody></table>`,
        `<p><strong><code>LinkedHashMap</code>'s access-order mode</strong> is the feature worth knowing by heart. Construct it with <code>accessOrder = true</code> and every <code>get</code> moves that entry to the end of the list. Combine that with the overridable <code>removeEldestEntry</code> hook and you have a complete LRU cache in about eight lines — which is a genuinely common interview exercise.</p>`,
        `<p><strong><code>TreeMap</code> requires ordering</strong>, either because the keys implement <code>Comparable</code> or because you supplied a <code>Comparator</code>. This has a consequence people miss: <strong><code>TreeMap</code> decides equality with <code>compareTo</code>, not <code>equals</code></strong>. If a comparator says two keys compare as 0, the map treats them as the same key regardless of what <code>equals</code> says. That is a powerful feature (case-insensitive maps) and a subtle bug source.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The LRU cache — a standard interview question with a standard answer:</p>`,
        `<pre><code class="language-java">public class LruCache&lt;K, V&gt; extends LinkedHashMap&lt;K, V&gt; {
    private final int capacity;

    public LruCache(int capacity) {
        super(16, 0.75f, true);          // ← true = ACCESS order, not insertion
        this.capacity = capacity;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry&lt;K, V&gt; eldest) {
        return size() &gt; capacity;        // evict the least recently used
    }
}

LruCache&lt;String, String&gt; cache = new LruCache&lt;&gt;(3);
cache.put("a", "1"); cache.put("b", "2"); cache.put("c", "3");
cache.get("a");                          // "a" is now the most recent
cache.put("d", "4");                     // evicts "b" — the least recently used
System.out.println(cache.keySet());      // [c, a, d]

// Note: this is NOT thread-safe, and get() structurally modifies the map in
// access-order mode — so even concurrent READS need synchronisation here.
// For a production cache, use Caffeine.</code></pre>`,
        `<p><code>TreeMap</code>'s navigation methods, which are the reason to choose it:</p>`,
        `<pre><code class="language-java">TreeMap&lt;Integer, String&gt; scores = new TreeMap&lt;&gt;();
scores.put(70, "C"); scores.put(85, "B"); scores.put(95, "A");

scores.firstKey();            // 70   — lowest
scores.lastKey();             // 95   — highest
scores.floorKey(90);          // 85   — greatest key ≤ 90
scores.ceilingKey(90);        // 95   — smallest key ≥ 90
scores.higherKey(85);         // 95   — strictly greater
scores.headMap(85);           // {70=C}          — strictly below
scores.tailMap(85);           // {85=B, 95=A}    — from 85 up
scores.subMap(70, 90);        // {70=C, 85=B}    — a RANGE QUERY

scores.descendingMap();       // reversed view
// These are views, not copies — cheap, and they write through.

// Grade lookup in one line, instead of a chain of if/else:
String grade = scores.floorEntry(88).getValue();   // "B"</code></pre>`,
        `<p>The <code>compareTo</code>-not-<code>equals</code> subtlety:</p>`,
        `<pre><code class="language-java">// A case-insensitive map, for free:
Map&lt;String, Integer&gt; ci = new TreeMap&lt;&gt;(String.CASE_INSENSITIVE_ORDER);
ci.put("Hello", 1);
ci.put("HELLO", 2);
System.out.println(ci.size());        // 1  — the comparator says they are equal
System.out.println(ci.get("hello"));  // 2

// The same mechanism as a bug — a comparator on ONE field silently
// deduplicates records that equals() considers different:
Map&lt;Person, String&gt; byAge = new TreeMap&lt;&gt;(Comparator.comparingInt(Person::age));
byAge.put(new Person("Asha", 30), "x");
byAge.put(new Person("Ben", 30), "y");
System.out.println(byAge.size());     // 1 — Ben overwrote Asha. Rarely intended.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong><code>LinkedHashMap</code> is genuinely cheap.</strong> It inherits the entire <code>HashMap</code> machinery and only adds <code>before</code>/<code>after</code> references to each node plus head and tail pointers on the map. Ordering costs two pointer writes per insertion, not a sort. That makes it a nearly free upgrade whenever deterministic iteration matters — for reproducible output, deterministic tests, or serialising configuration.</p>`,
        `<p><strong><code>TreeMap</code> is a red-black tree</strong>: a self-balancing binary search tree that guarantees the longest path is at most twice the shortest, so every operation is O(log n) worst case — no degenerate cases, unlike a plain BST fed sorted input. It is worth naming the structure and the guarantee; "it is sorted" is a much weaker answer.</p>`,
        `<p><strong>Where each actually gets used:</strong> <code>LinkedHashMap</code> shows up wherever output must be reproducible (JSON field order, deterministic tests) and in caches. <code>TreeMap</code> shows up wherever the question is a <em>range</em> rather than a point — pricing tiers, time-series buckets, rate limits by threshold, leaderboards. If you catch yourself sorting a <code>HashMap</code>'s keys on every request, a <code>TreeMap</code> was the right structure.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Depending on <code>HashMap</code> iteration order.</strong> It is arbitrary and can change on resize. Use <code>LinkedHashMap</code>.</li>` +
        `<li><strong>Sorting a <code>HashMap</code>'s keys repeatedly.</strong> If you need order every time, use a <code>TreeMap</code> and stop paying the sort.</li>` +
        `<li><strong>Forgetting <code>TreeMap</code> uses <code>compareTo</code> for equality.</strong> A comparator returning 0 merges entries <code>equals</code> would keep apart.</li>` +
        `<li><strong>Putting a null key in a <code>TreeMap</code>.</strong> Throws — there is nothing to compare.</li>` +
        `<li><strong>Using an <code>LruCache</code> like the one above concurrently.</strong> In access-order mode even <code>get</code> mutates the structure; it needs full synchronisation, or a real cache library.</li>` +
        `<li><strong>Mutating a <code>TreeMap</code> key's sort field after insertion.</strong> Same failure as a mutated hash key — the entry is stranded in the wrong position.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "<code>HashMap</code> vs <code>LinkedHashMap</code> vs <code>TreeMap</code>?"</strong><br>A: <code>HashMap</code> is O(1) average with no ordering guarantee. <code>LinkedHashMap</code> is a <code>HashMap</code> with a doubly-linked list threaded through the entries, so it keeps insertion order (or access order) at O(1) and roughly two extra references per entry. <code>TreeMap</code> is a red-black tree sorted by key: O(log n), no nulls, but it gives range queries and navigation methods nothing else offers.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How would you implement an LRU cache?"</strong><br>A: Extend <code>LinkedHashMap</code>, pass <code>accessOrder = true</code> to the three-argument constructor so every <code>get</code> moves the entry to the end, and override <code>removeEldestEntry</code> to return <code>size() &gt; capacity</code>. That is the whole implementation. If asked to do it from scratch, it is a <code>HashMap</code> plus a doubly-linked list — the map for O(1) lookup, the list for O(1) reordering and eviction, which is exactly what <code>LinkedHashMap</code> is.</p></blockquote>`,
        `<blockquote><p><strong>Q: "When would you use a <code>TreeMap</code>?"</strong><br>A: When the question is a range rather than a point. Pricing or grade tiers with <code>floorEntry</code>, time-series buckets with <code>subMap</code>, "the next event after time T" with <code>ceilingKey</code>. Also whenever I need to iterate in sorted order repeatedly — sorting a <code>HashMap</code>'s keys on every request is strictly worse.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Does <code>TreeMap</code> use <code>equals</code>?"</strong><br>A: No — it uses <code>compareTo</code> or the supplied <code>Comparator</code>, and treats a result of 0 as "same key". That is how <code>new TreeMap&lt;&gt;(String.CASE_INSENSITIVE_ORDER)</code> gives a case-insensitive map for free, and also how a comparator on a single field can silently overwrite entries that <code>equals</code> would have kept distinct. The javadoc recommends the ordering be <em>consistent with equals</em> for exactly this reason.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Can <code>TreeMap</code> hold a null key?"</strong><br>A: No — inserting one throws <code>NullPointerException</code>, because the map must compare the key and there is nothing to compare. Null <em>values</em> are fine. <code>HashMap</code> and <code>LinkedHashMap</code> each allow one null key.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What ordering does <code>LinkedHashMap</code> use?"</strong><br>A: Insertion order by default — reinserting an existing key does not move it. With the three-argument constructor and <code>accessOrder = true</code>, it switches to access order and every <code>get</code> or <code>put</code> moves that entry to the end, which is what makes LRU eviction possible.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><code>HashMap</code> O(1) no order · <code>LinkedHashMap</code> O(1) + order · <code>TreeMap</code> O(log n) + sorted.</li>` +
        `<li><code>LinkedHashMap</code> = <code>HashMap</code> + doubly-linked list. Cost: <strong>2 references per entry</strong>.</li>` +
        `<li><strong>LRU</strong> = <code>new LinkedHashMap&lt;&gt;(16, 0.75f, true)</code> + override <code>removeEldestEntry</code>.</li>` +
        `<li><code>TreeMap</code> = <strong>red-black tree</strong>, O(log n) worst case guaranteed.</li>` +
        `<li>Navigation: <code>floorKey</code> <code>ceilingKey</code> <code>headMap</code> <code>tailMap</code> <code>subMap</code> — <strong>views, not copies</strong>.</li>` +
        `<li><code>TreeMap</code> equality is <strong><code>compareTo</code>, not <code>equals</code></strong>. No null keys.</li>` +
        `<li>Never rely on <code>HashMap</code> order — it can change on resize.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Sets: HashSet, LinkedHashSet and TreeSet',
      slug: 'sets-and-uniqueness',
      order: 4,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Sets are the collection people under-use. A great deal of code does <code>if (!list.contains(x)) list.add(x)</code> — which is O(n) per check and turns a loop into an O(n²) one — when a <code>Set</code> would be O(1) and say what it means. Interviewers also like sets because "how does <code>HashSet</code> guarantee uniqueness?" has an answer that instantly reveals whether you understand the previous topics.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A <code>Set</code> holds no duplicates, where "duplicate" means <code>equals</code> returns true. The three implementations mirror the three maps exactly, because that is literally what they are: <strong><code>HashSet</code> is a <code>HashMap</code> whose values are all a single dummy object.</strong></p>`,
        `<pre><code class="language-java">// The actual implementation in the JDK, lightly paraphrased:
public class HashSet&lt;E&gt; implements Set&lt;E&gt; {
    private transient HashMap&lt;E, Object&gt; map;
    private static final Object PRESENT = new Object();   // one shared dummy

    public boolean add(E e) {
        return map.put(e, PRESENT) == null;   // put returns the OLD value;
    }                                         // null means it was not there
    public boolean contains(Object o) { return map.containsKey(o); }
}</code></pre>`,
        `<p>Everything true of <code>HashMap</code> keys is therefore true of <code>HashSet</code> elements: the <code>equals</code>/<code>hashCode</code> contract, mutable-element danger, arbitrary iteration order, resize behaviour. That single sentence answers most set questions.</p>`,
        `<h2>How it works</h2>`,
        `<table><thead><tr><th></th><th>Backed by</th><th>add/contains</th><th>Order</th><th>Nulls</th></tr></thead><tbody>` +
        `<tr><td><code>HashSet</code></td><td><code>HashMap</code></td><td>O(1) average</td><td>None</td><td>One null</td></tr>` +
        `<tr><td><code>LinkedHashSet</code></td><td><code>LinkedHashMap</code></td><td>O(1) average</td><td>Insertion</td><td>One null</td></tr>` +
        `<tr><td><code>TreeSet</code></td><td><code>TreeMap</code></td><td>O(log n)</td><td>Sorted</td><td><strong>None</strong></td></tr>` +
        `</tbody></table>`,
        `<p>The one genuinely distinct behaviour is <code>add</code>'s return value: it returns <code>true</code> if the element was added and <code>false</code> if it was already present. That makes it a <em>test-and-insert in one atomic-looking call</em>, which is the idiomatic way to detect duplicates in a single pass.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The pattern that replaces most duplicate-detection code:</p>`,
        `<pre><code class="language-java">// ✘ O(n²) — contains() scans the whole list every iteration.
List&lt;String&gt; seen = new ArrayList&lt;&gt;();
for (String s : input) if (!seen.contains(s)) seen.add(s);

// ✔ O(n), and add() tells you whether it was new.
Set&lt;String&gt; seen = new HashSet&lt;&gt;();
for (String s : input) {
    if (!seen.add(s)) System.out.println("duplicate: " + s);
}

// Deduplicate while KEEPING the original order — LinkedHashSet, one line:
List&lt;String&gt; deduped = new ArrayList&lt;&gt;(new LinkedHashSet&lt;&gt;(input));
// or, in a stream:
List&lt;String&gt; deduped = input.stream().distinct().toList();</code></pre>`,
        `<p>Set algebra, which is far more readable than the loops people write instead:</p>`,
        `<pre><code class="language-java">Set&lt;String&gt; a = new HashSet&lt;&gt;(Set.of("x", "y", "z"));
Set&lt;String&gt; b = Set.of("y", "z", "w");

Set&lt;String&gt; union = new HashSet&lt;&gt;(a);
union.addAll(b);                      // [x, y, z, w]

Set&lt;String&gt; intersection = new HashSet&lt;&gt;(a);
intersection.retainAll(b);            // [y, z]

Set&lt;String&gt; difference = new HashSet&lt;&gt;(a);
difference.removeAll(b);              // [x]

// ⚠ All three MUTATE the receiver — always copy first, as above. And
// removeAll has a performance cliff: if the argument is a List rather than
// a Set, it does a linear scan per element, making it O(n × m).</code></pre>`,
        `<p><code>TreeSet</code>'s navigation, mirroring <code>TreeMap</code>:</p>`,
        `<pre><code class="language-java">TreeSet&lt;Integer&gt; s = new TreeSet&lt;&gt;(List.of(10, 20, 30, 40));
s.first();          // 10
s.last();           // 40
s.floor(25);        // 20  — greatest ≤ 25
s.ceiling(25);      // 30  — smallest ≥ 25
s.headSet(30);      // [10, 20]
s.subSet(15, 35);   // [20, 30]
s.descendingSet();  // [40, 30, 20, 10]

// And the same compareTo-defines-equality rule as TreeMap:
Set&lt;String&gt; ci = new TreeSet&lt;&gt;(String.CASE_INSENSITIVE_ORDER);
ci.add("Hello"); ci.add("HELLO");
System.out.println(ci.size());   // 1</code></pre>`,
        `<p>The mutable-element trap, which is the same bug as a mutable map key:</p>`,
        `<pre><code class="language-java">Set&lt;List&lt;String&gt;&gt; set = new HashSet&lt;&gt;();
List&lt;String&gt; list = new ArrayList&lt;&gt;(List.of("a"));
set.add(list);
System.out.println(set.contains(list));   // true

list.add("b");                            // mutate AFTER insertion —
                                          // List.hashCode() depends on contents
System.out.println(set.contains(list));   // false ✘ — even for the same object!
System.out.println(set.size());           // 1 — it is in there, unreachable</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Why the dummy-value design?</strong> Reusing <code>HashMap</code> means <code>HashSet</code> inherits every optimisation the map ever receives — treeification, the improved resize, the spread function — with no duplicated code. The cost is one wasted reference per element, which is a good trade. It also means the JDK maintains one hard data structure instead of two, which is why <code>HashSet</code> has essentially never had a bug of its own.</p>`,
        `<p><strong><code>Set.of</code> is deliberately hostile to mistakes</strong> in two ways worth knowing. It <em>throws</em> on duplicate arguments at construction time rather than silently collapsing them — <code>Set.of("a", "a")</code> is an <code>IllegalArgumentException</code>, which catches copy-paste errors. And its iteration order is deliberately <em>randomised per JVM run</em>, specifically so that code cannot accidentally come to depend on it. That randomisation surprises people who see different output across runs and assume something is broken.</p>`,
        `<p><strong>The concurrent set</strong> is a small gap in the API that comes up: there is no <code>ConcurrentHashSet</code> class. The answer is <code>ConcurrentHashMap.newKeySet()</code>, which returns a set backed by a concurrent map — the same dummy-value trick, applied to the concurrent implementation. Knowing that method name is a small but real signal.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong><code>list.contains</code> in a loop.</strong> O(n²). Use a <code>Set</code>.</li>` +
        `<li><strong>Elements without <code>equals</code>/<code>hashCode</code>.</strong> A <code>HashSet</code> of such objects deduplicates nothing — every instance is unique.</li>` +
        `<li><strong>Mutating an element after adding it.</strong> Same bug as a mutable map key; the element becomes unreachable.</li>` +
        `<li><strong>Expecting <code>HashSet</code> to preserve order.</strong> Use <code>LinkedHashSet</code>.</li>` +
        `<li><strong>Forgetting <code>addAll</code>/<code>retainAll</code>/<code>removeAll</code> mutate the receiver.</strong> Copy first.</li>` +
        `<li><strong><code>removeAll</code> with a <code>List</code> argument.</strong> Degrades to O(n × m). Pass a <code>Set</code>.</li>` +
        `<li><strong>Duplicates in <code>Set.of(...)</code>.</strong> Throws at construction, by design.</li>` +
        `<li><strong>Null in a <code>TreeSet</code>.</strong> Throws — nothing to compare.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "How does <code>HashSet</code> guarantee uniqueness?"</strong><br>A: It does not implement anything itself — it wraps a <code>HashMap</code>, storing each element as a key with a single shared dummy object as the value. Uniqueness comes entirely from the map's key uniqueness, which means it comes from <code>hashCode</code> and <code>equals</code>. <code>add</code> returns <code>map.put(e, PRESENT) == null</code>, which is why it tells you whether the element was new.</p></blockquote>`,
        `<blockquote><p><strong>Q: "<code>HashSet</code> vs <code>TreeSet</code> vs <code>LinkedHashSet</code>?"</strong><br>A: They mirror the maps exactly. <code>HashSet</code> is O(1) with no order; <code>LinkedHashSet</code> is O(1) with insertion order for two extra references per element; <code>TreeSet</code> is O(log n), sorted, no nulls, and adds navigation methods like <code>floor</code>, <code>ceiling</code> and <code>subSet</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What happens if you add an object without <code>hashCode</code> to a <code>HashSet</code>?"</strong><br>A: Every instance gets a distinct identity hash, so no two objects are ever considered duplicates — the set silently accepts logical duplicates. Adding the same conceptual value twice gives you a set of size 2, which is exactly the <code>equals</code>/<code>hashCode</code> contract failing in its most visible form.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you deduplicate a list while keeping order?"</strong><br>A: <code>new ArrayList&lt;&gt;(new LinkedHashSet&lt;&gt;(list))</code>, or <code>list.stream().distinct().toList()</code>. Both are O(n). A plain <code>HashSet</code> would deduplicate but scramble the order.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Is there a <code>ConcurrentHashSet</code>?"</strong><br>A: No class by that name. Use <code>ConcurrentHashMap.newKeySet()</code>, which gives a set backed by a <code>ConcurrentHashMap</code> — the same dummy-value approach applied to the concurrent map. <code>Collections.newSetFromMap</code> is the general form if you need it over some other map.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why does <code>Set.of(\"a\", \"a\")</code> throw?"</strong><br>A: Deliberate design. The immutable factories reject duplicate arguments with <code>IllegalArgumentException</code> rather than silently collapsing them, because a duplicate in a literal is almost always a typo. Their iteration order is also randomised per JVM run, specifically so nobody can come to depend on it.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><strong><code>HashSet</code> IS a <code>HashMap</code></strong> with a shared dummy value. Everything about map keys applies.</li>` +
        `<li><code>add()</code> returns <strong>false if already present</strong> — test-and-insert in one call.</li>` +
        `<li><code>HashSet</code> O(1) · <code>LinkedHashSet</code> O(1) + insertion order · <code>TreeSet</code> O(log n) + sorted, no nulls.</li>` +
        `<li>Dedupe keeping order: <code>new ArrayList&lt;&gt;(new LinkedHashSet&lt;&gt;(list))</code>.</li>` +
        `<li>Set algebra: <code>addAll</code> / <code>retainAll</code> / <code>removeAll</code> — they <strong>mutate the receiver</strong>; pass Sets, not Lists.</li>` +
        `<li>Concurrent set → <strong><code>ConcurrentHashMap.newKeySet()</code></strong>.</li>` +
        `<li><code>Set.of</code> throws on duplicates; its order is <strong>randomised per JVM run</strong>.</li>` +
        `<li>Never mutate an element after adding it.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'ConcurrentHashMap and Concurrent Collections',
      slug: 'concurrent-collections',
      order: 5,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Every server application shares state between request threads, and the collection you pick decides whether that is correct and whether it scales. This topic is also where a lot of candidates reveal a dated mental model: describing <code>ConcurrentHashMap</code> in terms of "segments" is describing Java 7, and the implementation changed completely in Java 8. Getting that right is a strong, easily-verified signal.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>There are three ways to make a map usable from several threads, and they are not equivalent:</p>`,
        `{{fig:ch4-concurrent-locking.svg|Left panel shows Hashtable with one lock covering every bin so unrelated threads block each other; right panel shows ConcurrentHashMap with independent per-bin locks and lock-free reads|One lock for the whole table serialises threads that never touch the same data. Locking per bin lets unrelated writers proceed in parallel, and reads take no lock at all.}}`,
        `<ul>` +
        `<li><strong><code>Hashtable</code></strong> — legacy, every method <code>synchronized</code> on the whole object.</li>` +
        `<li><strong><code>Collections.synchronizedMap(map)</code></strong> — a wrapper that does the same thing to any map.</li>` +
        `<li><strong><code>ConcurrentHashMap</code></strong> — purpose-built: lock-free reads, and writes that lock only the bin they touch.</li>` +
        `</ul>`,
        `<h2>How it works</h2>`,
        `<p><strong>Reads take no lock.</strong> The <code>table</code> array and each node's <code>value</code> and <code>next</code> fields are <code>volatile</code>, so a reader sees a consistent, up-to-date view without acquiring anything. <code>get</code> is therefore lock-free and scales perfectly with cores — which matters enormously, because most real maps are read far more than they are written.</p>`,
        `<p><strong>Writes lock one bin.</strong> If the target bin is empty, the new node is installed with a single CAS (compare-and-swap) — no lock at all. If the bin is occupied, the thread synchronises on that bin's first node. Two threads writing to different bins never contend.</p>`,
        `<p><strong>What changed in Java 8.</strong> Java 7 used a fixed number of <em>segments</em> (16 by default), each with its own lock — so concurrency was capped at the segment count regardless of table size, and the extra indirection cost memory. Java 8 removed segments entirely in favour of per-bin locking plus CAS, so the effective concurrency scales with the table. It also brought treeification, matching <code>HashMap</code>. Saying "segments" describes an implementation that has not existed for a decade.</p>`,
        `<p><strong>What it does not give you.</strong> Each individual operation is atomic; a <em>sequence</em> is not. <code>if (!map.containsKey(k)) map.put(k, v)</code> is still a race, because another thread can act between the two calls. That is what the atomic compound methods are for — <code>putIfAbsent</code>, <code>computeIfAbsent</code>, <code>merge</code>, <code>compute</code> — and using them is the whole skill here.</p>`,
        `<h2>Code examples</h2>`,
        `<pre><code class="language-java">ConcurrentHashMap&lt;String, Integer&gt; counts = new ConcurrentHashMap&lt;&gt;();

// ✘ Race: two threads can both read 5 and both write 6. Updates are lost.
Integer c = counts.get(key);
counts.put(key, c == null ? 1 : c + 1);

// ✔ Atomic — the whole read-modify-write happens under the bin's lock.
counts.merge(key, 1, Integer::sum);
counts.compute(key, (k, v) -&gt; v == null ? 1 : v + 1);      // equivalent

// ✔ Atomic "create if missing" — the function runs at most once per key,
//   even under contention, so expensive initialisation is not duplicated.
Map&lt;String, List&lt;String&gt;&gt; index = new ConcurrentHashMap&lt;&gt;();
index.computeIfAbsent(key, k -&gt; new ArrayList&lt;&gt;()).add(value);
// ⚠ but the ArrayList itself is NOT thread-safe — two threads adding to the
//   SAME key's list still race. Use computeIfAbsent(k, x -&gt; new
//   CopyOnWriteArrayList&lt;&gt;()) or ConcurrentHashMap.newKeySet().

// ✔ A counter that scales better than merge under heavy contention:
ConcurrentHashMap&lt;String, LongAdder&gt; adders = new ConcurrentHashMap&lt;&gt;();
adders.computeIfAbsent(key, k -&gt; new LongAdder()).increment();</code></pre>`,
        `<p>Why <code>synchronizedMap</code> is not really a substitute:</p>`,
        `<pre><code class="language-java">Map&lt;String, Integer&gt; m = Collections.synchronizedMap(new HashMap&lt;&gt;());

m.put("a", 1);          // ✔ atomic
m.get("a");             // ✔ atomic

// ✘ Iteration is NOT synchronised — you must lock manually, and every
//   other thread blocks for the entire loop.
synchronized (m) {
    for (Map.Entry&lt;String, Integer&gt; e : m.entrySet()) process(e);
}
// Forget that block and you get ConcurrentModificationException at random.
// ConcurrentHashMap needs none of this: iteration is weakly consistent
// and never throws.</code></pre>`,
        `<p>The rest of the concurrent toolkit, and when each is right:</p>`,
        `<pre><code class="language-java">// Read-mostly list — every write copies the array, so iteration is a
// lock-free snapshot. Ideal for listener lists; terrible for frequent writes.
List&lt;Listener&gt; listeners = new CopyOnWriteArrayList&lt;&gt;();

// Producer/consumer — take() blocks until an element is available, which is
// the whole point. This is the backbone of a thread pool's work queue.
BlockingQueue&lt;Task&gt; queue = new LinkedBlockingQueue&lt;&gt;(1000);
queue.put(task);                       // blocks if full → natural backpressure
Task t = queue.take();                 // blocks if empty

// Non-blocking queue for high-throughput hand-off:
Queue&lt;Event&gt; events = new ConcurrentLinkedQueue&lt;&gt;();

// Concurrent set — there is no ConcurrentHashSet class:
Set&lt;String&gt; active = ConcurrentHashMap.newKeySet();

// Sorted + concurrent:
ConcurrentNavigableMap&lt;Long, Event&gt; timeline = new ConcurrentSkipListMap&lt;&gt;();</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Why no nulls</strong>, revisited with the real reason: in a concurrent map, <code>get(k)</code> returning null would be ambiguous between "absent" and "mapped to null", and unlike a <code>HashMap</code> you cannot resolve it with a follow-up <code>containsKey</code> — the state may have changed in between. Doug Lea's stated position is that allowing null would make correct concurrent code impossible to write, so the class rejects it outright.</p>`,
        `<p><strong><code>size()</code> is an estimate.</strong> Maintaining an exact count would require a single contended counter, which would become the bottleneck the whole design exists to avoid. Instead the map keeps a striped set of counters (the same technique as <code>LongAdder</code>) and <code>size()</code> sums them — so the answer can be stale the instant you read it. Use it for monitoring, never for control flow. <code>mappingCount()</code> is the preferred method, returning a <code>long</code> for maps above 2 billion entries.</p>`,
        `<p><strong>Iteration is weakly consistent</strong>, which is a guarantee rather than an absence of one: an iterator reflects the map at some point at or since its creation, never throws <code>ConcurrentModificationException</code>, and each element is returned at most once. It may or may not reflect updates made after it started. That is exactly what makes it safe to iterate a live map without locking anything.</p>`,
        `<p><strong>When <code>CopyOnWriteArrayList</code> is wrong</strong> is worth stating, because it is often reached for too eagerly: every single write allocates and copies the entire backing array. For a listener list written once at startup and read constantly, that is perfect. For a list receiving thousands of writes per second, it is a disaster.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Describing "segments".</strong> That is Java 7. Java 8 uses per-bin CAS and synchronisation.</li>` +
        `<li><strong>Check-then-act on a concurrent map.</strong> <code>containsKey</code> then <code>put</code> is a race. Use <code>putIfAbsent</code>, <code>merge</code> or <code>compute</code>.</li>` +
        `<li><strong>Thinking <code>ConcurrentHashMap</code> makes the VALUES thread-safe.</strong> A shared <code>ArrayList</code> stored as a value is still unsafe.</li>` +
        `<li><strong>Putting null in it.</strong> Throws by design.</li>` +
        `<li><strong>Trusting <code>size()</code> for control flow.</strong> It is an estimate.</li>` +
        `<li><strong>Iterating a <code>synchronizedMap</code> without an external lock.</strong> Throws <code>ConcurrentModificationException</code> at random.</li>` +
        `<li><strong><code>CopyOnWriteArrayList</code> for a write-heavy list.</strong> Every write copies the whole array.</li>` +
        `<li><strong>Long or blocking work inside <code>compute</code>.</strong> It runs while holding the bin's lock.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "How does <code>ConcurrentHashMap</code> achieve thread safety?"</strong><br>A: In Java 8 and later, reads take no lock at all — the table and node fields are <code>volatile</code>, so <code>get</code> is lock-free. Writes lock only the bin they touch: an empty bin is filled with a CAS, and an occupied one is synchronised on its first node. Threads writing to different bins never contend, so throughput scales with cores.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How is that different from Java 7?"</strong><br>A: Java 7 divided the table into a fixed number of segments — 16 by default — each with its own lock, so concurrency was capped at the segment count no matter how large the table grew, and the extra structure cost memory. Java 8 removed segments in favour of per-bin locking plus CAS, and added treeification for heavily collided bins.</p></blockquote>`,
        `<blockquote><p><strong>Q: "<code>ConcurrentHashMap</code> vs <code>Collections.synchronizedMap</code> vs <code>Hashtable</code>?"</strong><br>A: The latter two put one lock around the whole map, so unrelated threads serialise and reads block writes. They also require you to lock manually around iteration. <code>ConcurrentHashMap</code> locks per bin, never locks reads, iterates weakly-consistently without throwing, and offers atomic compound operations. There is no situation today where I would choose <code>Hashtable</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Is <code>map.get(k) == null ? map.put(k, v) : ...</code> safe on a <code>ConcurrentHashMap</code>?"</strong><br>A: No. Each individual call is atomic but the sequence is not — another thread can act between them, so you can lose an update or overwrite one. The compound atomic methods exist precisely for this: <code>putIfAbsent</code>, <code>computeIfAbsent</code>, <code>compute</code>, <code>merge</code>. Anything read-modify-write must go through one of those.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why is <code>size()</code> approximate?"</strong><br>A: An exact size needs a single shared counter, which every write would contend on — becoming the bottleneck the whole design avoids. Instead it stripes the count across several cells, like <code>LongAdder</code>, and sums them on demand. So the value can be stale as soon as it is returned. It is fine for metrics and wrong for control flow; <code>mappingCount()</code> is the preferred accessor.</p></blockquote>`,
        `<blockquote><p><strong>Q: "When would you use <code>CopyOnWriteArrayList</code>?"</strong><br>A: When reads massively outnumber writes and iteration must never throw — the classic case is a listener or subscriber list configured at startup. Every write copies the entire array, so iteration is a lock-free immutable snapshot. It is completely wrong for anything write-heavy.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Producer/consumer between threads — what do you reach for?"</strong><br>A: A <code>BlockingQueue</code>, usually <code>LinkedBlockingQueue</code> or <code>ArrayBlockingQueue</code> with a bounded capacity. <code>put</code> blocks when full and <code>take</code> blocks when empty, which gives correct hand-off and natural backpressure without any hand-written <code>wait</code>/<code>notify</code>. Bounding it is the important part — an unbounded queue turns a slow consumer into an <code>OutOfMemoryError</code>.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><strong>Java 8+: no segments.</strong> Lock-free reads (volatile), per-bin CAS/synchronized writes.</li>` +
        `<li>Individual ops atomic; <strong>sequences are not</strong> → <code>putIfAbsent</code> / <code>computeIfAbsent</code> / <code>compute</code> / <code>merge</code>.</li>` +
        `<li><strong>No null keys or values</strong> — absent vs mapped-to-null would be unresolvable.</li>` +
        `<li><code>size()</code> is an <strong>estimate</strong>; prefer <code>mappingCount()</code>. Iteration is <strong>weakly consistent</strong>, never throws.</li>` +
        `<li>Thread-safe map ≠ thread-safe values.</li>` +
        `<li><code>CopyOnWriteArrayList</code> → read-mostly only. <code>BlockingQueue</code> → producer/consumer, <strong>bounded</strong>.</li>` +
        `<li>Concurrent set → <code>ConcurrentHashMap.newKeySet()</code>. Sorted → <code>ConcurrentSkipListMap</code>.</li>` +
        `<li>Never do slow work inside <code>compute</code> — it holds the bin lock.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Fail-Fast vs Weakly Consistent Iterators',
      slug: 'fail-fast-vs-fail-safe',
      order: 6,
      content: [
        `<h2>Why it matters</h2>`,
        `<p><code>ConcurrentModificationException</code> is one of the first runtime exceptions every Java developer meets, and one of the most misunderstood — the name says "concurrent", so people assume threads, when the overwhelmingly common cause is a single thread modifying a collection inside its own loop. Understanding the actual mechanism tells you why it happens, why you must never catch it, and why the "fail-safe" alternative is not really safe in the way the name suggests.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p><strong>Fail-fast</strong> iterators detect that their collection was structurally modified while they were iterating, and throw immediately. The standard collections — <code>ArrayList</code>, <code>HashMap</code>, <code>HashSet</code> — all behave this way.</p>`,
        `<p><strong>Weakly consistent</strong> iterators (commonly called "fail-safe" in interviews) never throw. They iterate over whatever state they can see, and concurrent changes may or may not be reflected. The concurrent collections behave this way.</p>`,
        `{{fig:ch4-fail-fast.svg|Left panel steps through an iterator capturing expectedModCount of 4 then a removal bumping modCount to 5 then the next call throwing; right panel describes weakly consistent iteration over ConcurrentHashMap and snapshot iteration over CopyOnWriteArrayList|The mechanism is a single counter. Every structural change bumps modCount; every iterator step compares it against the snapshot it took at creation.}}`,
        `<h2>How it works</h2>`,
        `<p>The implementation is genuinely simple, and being able to describe it is the whole answer:</p>`,
        `<pre><code class="language-java">// Inside ArrayList, paraphrased:
protected transient int modCount = 0;    // bumped by every STRUCTURAL change

private class Itr implements Iterator&lt;E&gt; {
    int expectedModCount = modCount;     // snapshot taken at creation

    public E next() {
        checkForComodification();
        // … return the element …
    }

    final void checkForComodification() {
        if (modCount != expectedModCount) throw new ConcurrentModificationException();
    }
}</code></pre>`,
        `<p><strong>"Structural" is the key word.</strong> Adding or removing elements changes the structure and bumps <code>modCount</code>. Replacing an element's value does not — <code>list.set(i, x)</code> and <code>map.put(existingKey, newValue)</code> are both fine during iteration. Only insertion and removal are structural.</p>`,
        `<p><strong>It is explicitly best-effort.</strong> The javadoc is unusually blunt: the check is unsynchronised, so in a genuinely concurrent scenario the exception may or may not be thrown. <em>"Fail-fast iterators throw <code>ConcurrentModificationException</code> on a best-effort basis. Therefore, it would be wrong to write a program that depended on this exception for its correctness."</em> It exists to surface bugs during development, not to provide a guarantee.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The bug and its four fixes:</p>`,
        `<pre><code class="language-java">List&lt;String&gt; list = new ArrayList&lt;&gt;(List.of("a", "b", "c"));

// ✘ ConcurrentModificationException — the for-each loop is an iterator.
for (String s : list) {
    if (s.equals("b")) list.remove(s);
}

// ✔ 1. removeIf — clearest for a predicate.
list.removeIf(s -&gt; s.equals("b"));

// ✔ 2. Explicit iterator — it updates expectedModCount for you.
Iterator&lt;String&gt; it = list.iterator();
while (it.hasNext()) {
    if (it.next().equals("b")) it.remove();
}

// ✔ 3. Iterate a copy, modify the original.
for (String s : new ArrayList&lt;&gt;(list)) {
    if (s.equals("b")) list.remove(s);
}

// ✔ 4. Collect first, remove after the loop.
List&lt;String&gt; doomed = list.stream().filter(s -&gt; s.equals("b")).toList();
list.removeAll(doomed);</code></pre>`,
        `<p>The one that looks like it should work and does not:</p>`,
        `<pre><code class="language-java">List&lt;String&gt; list = new ArrayList&lt;&gt;(List.of("a", "b", "c"));

for (String s : list) {
    if (s.equals("b")) {
        list.remove(s);
        break;                  // ← seems safe, and usually IS…
    }
}
// …because hasNext() is size-based: after removing the second of three
// elements, cursor(2) == size(2), so hasNext() returns false and next() —
// which is where the check lives — is never called. Removing the
// SECOND-TO-LAST element silently skips the exception AND the last element.
// It is not a safe pattern; it is an accident of the implementation.</code></pre>`,
        `<p>Maps, where the fix is to iterate the right view:</p>`,
        `<pre><code class="language-java">Map&lt;String, Integer&gt; map = new HashMap&lt;&gt;(Map.of("a", 1, "b", 2, "c", 3));

// ✘ throws
for (String k : map.keySet()) if (map.get(k) &lt; 2) map.remove(k);

// ✔ entrySet iterator supports removal
Iterator&lt;Map.Entry&lt;String, Integer&gt;&gt; it = map.entrySet().iterator();
while (it.hasNext()) if (it.next().getValue() &lt; 2) it.remove();

// ✔ one-liner
map.entrySet().removeIf(e -&gt; e.getValue() &lt; 2);
map.values().removeIf(v -&gt; v &lt; 2);      // views write through to the map

// ✔ Replacing values during iteration is NOT structural — this is legal:
map.replaceAll((k, v) -&gt; v * 2);</code></pre>`,
        `<p>And the weakly-consistent contrast:</p>`,
        `<pre><code class="language-java">Map&lt;String, Integer&gt; safe = new ConcurrentHashMap&lt;&gt;(Map.of("a", 1, "b", 2));
for (String k : safe.keySet()) {
    safe.remove(k);              // ✔ no exception — ever
    safe.put("new-" + k, 0);     // may or may not appear in this iteration
}
// Guarantees: never throws, each element returned at most once, reflects the
// map at some point at or since the iterator was created. What it does NOT
// give you is a consistent snapshot.

// CopyOnWriteArrayList is the stronger case — a true immutable snapshot:
List&lt;String&gt; cow = new CopyOnWriteArrayList&lt;&gt;(List.of("a", "b"));
for (String s : cow) {
    cow.add("c");                // ✔ no exception, and NEVER seen by this loop
}                                // the iterator holds the old array
// Its iterator also does not support remove() — it would be meaningless
// against a snapshot. It throws UnsupportedOperationException.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Why not just make the iterator handle it?</strong> Because there is no sensible answer to "what should happen next" after the underlying array has shifted or the table has resized. If element 2 was removed, should the iterator return element 3 or skip it? Should an element inserted before the cursor be revisited? Rather than pick silently and produce quietly wrong results, the designers chose to fail loudly. That is a design principle worth naming in an interview: <strong>a clear exception beats a plausible wrong answer.</strong></p>`,
        `<p><strong>The single-threaded misnomer.</strong> The name mentions concurrency, but no threads are needed — one thread modifying a collection during its own loop is the common cause by a wide margin. Java 9 acknowledged this indirectly by improving the message on some collections, but the name is stuck.</p>`,
        `<p><strong>Streams have the same problem</strong>, with less obvious symptoms. Modifying the source collection during a stream pipeline gives undefined behaviour: it may throw <code>ConcurrentModificationException</code>, or silently produce wrong results. The <code>forEach</code> methods on collections carry the same restriction. It is the same rule wearing newer syntax.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Catching <code>ConcurrentModificationException</code>.</strong> It reports a bug in your loop. Fix the loop.</li>` +
        `<li><strong>Assuming it means threads.</strong> Usually it is one thread modifying inside its own iteration.</li>` +
        `<li><strong>Relying on the <code>break</code> trick.</strong> It works only for specific positions and silently skips elements otherwise.</li>` +
        `<li><strong>Thinking "fail-safe" means safe.</strong> It means "does not throw" — you may still read a mix of old and new state.</li>` +
        `<li><strong>Expecting the exception to be guaranteed.</strong> It is explicitly best-effort and unsynchronised.</li>` +
        `<li><strong>Calling <code>remove()</code> on a <code>CopyOnWriteArrayList</code> iterator.</strong> Unsupported — the snapshot is immutable.</li>` +
        `<li><strong>Modifying the source during a stream.</strong> Undefined behaviour, sometimes silent.</li>` +
        `<li><strong>Using a concurrent collection purely to silence the exception.</strong> That hides a design problem rather than fixing it.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is a fail-fast iterator?"</strong><br>A: One that detects structural modification of its collection during iteration and throws <code>ConcurrentModificationException</code> immediately. It works with a <code>modCount</code> field the collection bumps on every add or remove; the iterator snapshots it at creation and compares on every <code>next()</code>. <code>ArrayList</code>, <code>HashMap</code> and <code>HashSet</code> all behave this way.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Fail-fast vs fail-safe?"</strong><br>A: Fail-fast throws on detected modification — the standard collections. Fail-safe, which the javadoc actually calls <em>weakly consistent</em>, never throws: it iterates whatever state it can see, so concurrent changes may or may not appear. That is the concurrent collections. <code>CopyOnWriteArrayList</code> is the strongest form, iterating a genuine immutable snapshot because every write copies the array.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Does this require multiple threads?"</strong><br>A: No, and that is the common misconception. The usual cause is a single thread calling <code>list.remove(...)</code> inside a for-each loop over the same list. The name is misleading — the check is just a counter comparison and does not care where the modification came from.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you remove elements safely while iterating?"</strong><br>A: <code>removeIf</code> for a predicate; an explicit <code>Iterator</code> with <code>it.remove()</code>, which updates the expected count; iterate a copy and modify the original; or collect the doomed elements and remove them after the loop. For maps, <code>entrySet().removeIf(...)</code> or the <code>entrySet</code> iterator's <code>remove()</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Is a <code>set()</code> during iteration safe?"</strong><br>A: Yes — only <em>structural</em> modification bumps <code>modCount</code>. Replacing an element's value with <code>list.set(i, x)</code>, or a <code>map.put</code> on a key that already exists, does not change the structure and does not trigger the check. Adding or removing does.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Should you ever catch it?"</strong><br>A: No. It signals a bug in the iteration logic, not a recoverable condition, and the javadoc explicitly says it is thrown on a best-effort basis and must not be depended upon for correctness. Catching it papers over a loop that is already doing something undefined.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Mechanism: <strong><code>modCount</code></strong> vs the iterator's <code>expectedModCount</code>, checked on every <code>next()</code>.</li>` +
        `<li>Only <strong>structural</strong> changes count — add/remove yes, <code>set</code>/value-replace no.</li>` +
        `<li><strong>No threads required</strong> — usually one thread modifying inside its own loop.</li>` +
        `<li>Best-effort by design. <strong>Never catch it.</strong></li>` +
        `<li>Fixes: <code>removeIf</code> · <code>Iterator.remove()</code> · iterate a copy · collect then remove.</li>` +
        `<li>Maps: <code>entrySet().removeIf(...)</code>; <code>keySet</code>/<code>values</code> are write-through views.</li>` +
        `<li>Weakly consistent = never throws, at-most-once, no snapshot guarantee.</li>` +
        `<li><code>CopyOnWriteArrayList</code> = true snapshot; its iterator's <code>remove()</code> is <strong>unsupported</strong>.</li>` +
        `</ul>`,
      ].join('\n'),
    },
  ],
};
