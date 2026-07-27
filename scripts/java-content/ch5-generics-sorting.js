/**
 * Java Interview Kit — Chapter 5: Generics, Wildcards and Sorting.
 *
 * ⚠️ Content strings are TEMPLATE LITERALS — never use a backtick inside them,
 * and always escape ${...} as \${...} or it will be interpolated.
 */
module.exports = {
  title: 'Generics & Sorting',
  slug: 'generics-sorting',
  order: 4,
  topics: [
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Generics and Type Erasure',
      slug: 'generics-and-type-erasure',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Generics look like a syntax feature and are really a compile-time contract that vanishes before the program runs. Almost every "why can't I do this?" question about generics — no <code>new T()</code>, no generic arrays, no overloading on type arguments — has the same one-word answer: <strong>erasure</strong>. Knowing that single mechanism lets you derive the whole list of restrictions instead of memorising it, which is exactly what interviewers are testing.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Generics let a class or method be written once and used with many types while keeping full type checking. <code>List&lt;String&gt;</code> means the compiler will reject anything but a <code>String</code> going in, and will hand you a <code>String</code> coming out with no cast.</p>`,
        `<p><strong>Type erasure</strong> is how it is implemented: <code>javac</code> checks all the types, then <em>deletes</em> the type arguments and inserts casts where needed. The bytecode contains a raw <code>List</code>.</p>`,
        `{{fig:ch5-type-erasure.svg|Left panel shows source code using List of String with no casts; right panel shows the erased bytecode using a raw List with an inserted String cast; a lower panel lists the operations erasure makes impossible|Erasure in one picture. The safety is entirely in the compiler; by run time the type argument is gone, which is why the operations at the bottom cannot work.}}`,
        `<p><strong>Why implement it this way?</strong> Backward compatibility. Generics arrived in Java 5, ten years into the language's life, and billions of lines of existing code used raw collections. Erasure meant generic code and pre-generic code could interoperate and share the same <code>.class</code> format — a <code>List&lt;String&gt;</code> could be passed to a Java 1.4 library expecting a <code>List</code>. The price is everything below.</p>`,
        `<h2>How it works</h2>`,
        `<p>Erasure replaces each type parameter with its <strong>leftmost bound</strong>, or <code>Object</code> if it is unbounded:</p>`,
        `<table><thead><tr><th>You write</th><th>The JVM sees</th></tr></thead><tbody>` +
        `<tr><td><code>class Box&lt;T&gt;</code></td><td><code>class Box</code> with <code>T</code> → <code>Object</code></td></tr>` +
        `<tr><td><code>class Box&lt;T extends Number&gt;</code></td><td><code>class Box</code> with <code>T</code> → <code>Number</code></td></tr>` +
        `<tr><td><code>List&lt;String&gt;</code>, <code>List&lt;Integer&gt;</code></td><td>both just <code>List</code></td></tr>` +
        `<tr><td><code>&lt;T&gt; void f(T t)</code></td><td><code>void f(Object t)</code></td></tr>` +
        `</tbody></table>`,
        `<p>Everything that is impossible follows mechanically. You cannot write <code>new T()</code> because there is no <code>T</code> at run time to instantiate. You cannot write <code>x instanceof List&lt;String&gt;</code> because only <code>List</code> survives to be tested. You cannot overload <code>f(List&lt;String&gt;)</code> and <code>f(List&lt;Integer&gt;)</code> because after erasure both are <code>f(List)</code> — the same signature. You cannot have a static field of type <code>T</code>, because statics belong to the class and the class has no type argument. And <code>List&lt;String&gt;.class == List&lt;Integer&gt;.class</code> is <code>true</code>, because there is only one <code>Class</code> object.</p>`,
        `<p><strong>Generic arrays</strong> deserve their own note because the reason is subtler. Arrays are <em>covariant</em> and <em>reified</em> — they know their component type at run time and check every store, throwing <code>ArrayStoreException</code>. Generics are <em>invariant</em> and erased. Mixing them would let a compile-time-checked write corrupt an array without any run-time check catching it, so <code>new T[10]</code> is banned outright.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The core payoff — a bug moved from run time to compile time:</p>`,
        `<pre><code class="language-java">// Pre-generics: fails at RUN time, and only when that line executes.
List raw = new ArrayList();
raw.add("hello");
raw.add(42);                              // compiles happily
String s = (String) raw.get(1);           // ✘ ClassCastException

// With generics: fails at COMPILE time, at the point of the mistake.
List&lt;String&gt; typed = new ArrayList&lt;&gt;();
typed.add("hello");
// typed.add(42);                         // ✘ will not compile
String s = typed.get(0);                  // no cast needed</code></pre>`,
        `<p>What erasure forbids, with the reason for each:</p>`,
        `<pre><code class="language-java">class Broken&lt;T&gt; {
    // T value = new T();              ✘ no T at run time to instantiate
    // T[] array = new T[10];          ✘ arrays are reified, generics are not
    // static T shared;                ✘ statics belong to the class, not an instance
    // void f(Object o) {
    //     if (o instanceof T) { }     ✘ nothing to test — T is gone
    // }
}

// The overload that looks fine and is not:
// void process(List&lt;String&gt; l) { }
// void process(List&lt;Integer&gt; l) { }
// ✘ "both methods have same erasure process(List)"

System.out.println(new ArrayList&lt;String&gt;().getClass()
        == new ArrayList&lt;Integer&gt;().getClass());   // true — one Class object</code></pre>`,
        `<p>The standard workarounds, which are what a follow-up question is really after:</p>`,
        `<pre><code class="language-java">// 1. Pass the Class object — the "type token" pattern. This is exactly what
//    the JDK does in Collections.checkedList and Jackson's readValue.
class Factory&lt;T&gt; {
    private final Class&lt;T&gt; type;
    Factory(Class&lt;T&gt; type) { this.type = type; }
    T create() throws Exception {
        return type.getDeclaredConstructor().newInstance();   // ✔ real type, at run time
    }
}
Factory&lt;User&gt; f = new Factory&lt;&gt;(User.class);

// 2. Pass a supplier — cleaner in modern Java, and no reflection.
class Factory2&lt;T&gt; {
    private final Supplier&lt;T&gt; maker;
    Factory2(Supplier&lt;T&gt; maker) { this.maker = maker; }
    T create() { return maker.get(); }
}
Factory2&lt;User&gt; f2 = new Factory2&lt;&gt;(User::new);

// 3. For arrays: use a List, or Array.newInstance with a Class token.
@SuppressWarnings("unchecked")
T[] array = (T[]) Array.newInstance(type, 10);</code></pre>`,
        `<p>Generic methods, where the type parameter is inferred per call:</p>`,
        `<pre><code class="language-java">// The &lt;T&gt; before the return type declares the method's OWN parameter.
public static &lt;T&gt; List&lt;T&gt; firstN(List&lt;T&gt; source, int n) {
    return new ArrayList&lt;&gt;(source.subList(0, Math.min(n, source.size())));
}
List&lt;String&gt; top = firstN(names, 3);        // T inferred as String

// Multiple bounds — class first, then interfaces:
public static &lt;T extends Comparable&lt;T&gt; &amp; Serializable&gt; T max(List&lt;T&gt; list) {
    return list.stream().max(Comparator.naturalOrder()).orElseThrow();
}</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Bridge methods</strong> are erasure's cleverest patch, and a strong senior answer. When a class implements <code>Comparable&lt;Employee&gt;</code>, it defines <code>compareTo(Employee)</code>. But the erased interface declares <code>compareTo(Object)</code> — a different signature, so polymorphism would break. The compiler silently generates a synthetic <strong>bridge method</strong> <code>compareTo(Object)</code> that casts and delegates to your real one. You can see it with <code>javap -c</code>, and it is why an unexpected <code>ClassCastException</code> can surface from a line you never wrote.</p>`,
        `<p><strong>Not everything is erased.</strong> Type arguments that appear in a class or method <em>signature</em> are retained as metadata and readable by reflection — which is how Jackson and Hibernate figure out that a field is a <code>List&lt;User&gt;</code> and deserialise it correctly. What is erased is the type of an <em>instance</em>: a <code>List&lt;String&gt;</code> object cannot tell you it is a list of strings. The distinction is worth stating precisely, because "generics are erased" over-simplifies it.</p>`,
        `<p><strong>Heap pollution and <code>@SafeVarargs</code>.</strong> A generic varargs parameter is compiled as an array of the erased type, which reopens the array/generic hole — the method can be handed an array whose actual element type is wrong. That is <em>heap pollution</em>, and it is why such methods produce an "unchecked generic array creation" warning. <code>@SafeVarargs</code> suppresses it, and you should only apply it when the method merely reads the varargs array and never stores anything into it or lets it escape.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Using raw types.</strong> <code>List list = new ArrayList();</code> turns off generic checking for every operation on that reference — including ones that would otherwise be safe.</li>` +
        `<li><strong>Expecting <code>List&lt;String&gt;</code> to be a <code>List&lt;Object&gt;</code>.</strong> Generics are invariant. A <code>List&lt;Object&gt;</code> would accept an <code>Integer</code>, which would corrupt the list.</li>` +
        `<li><strong>Blanket <code>@SuppressWarnings("unchecked")</code>.</strong> Put it on the narrowest possible declaration, with a comment saying why the cast is safe.</li>` +
        `<li><strong>Trying to overload on type arguments.</strong> Identical after erasure — it will not compile.</li>` +
        `<li><strong>Creating generic arrays.</strong> Use a <code>List</code>, or <code>Array.newInstance</code> with a class token.</li>` +
        `<li><strong>Assuming reflection can see an instance's type argument.</strong> Field and method signatures keep it; objects do not.</li>` +
        `<li><strong><code>@SafeVarargs</code> on a method that stores into the array.</strong> That is exactly the unsafe case the warning exists for.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is type erasure?"</strong><br>A: The compiler checks all generic types and then removes the type arguments, replacing each type parameter with its leftmost bound — or <code>Object</code> if unbounded — and inserting casts where needed. So <code>List&lt;String&gt;</code> and <code>List&lt;Integer&gt;</code> are both plain <code>List</code> in bytecode and share one <code>Class</code> object. It was done for backward compatibility, so generic and pre-generic code could interoperate when generics arrived in Java 5.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why can't you write <code>new T()</code>?"</strong><br>A: Because <code>T</code> does not exist at run time — erasure removed it, so there is no class to instantiate. The workarounds are to pass a <code>Class&lt;T&gt;</code> token and use reflection, or, more cleanly, to pass a <code>Supplier&lt;T&gt;</code> such as <code>User::new</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why are generic arrays not allowed?"</strong><br>A: Arrays and generics have incompatible type systems. Arrays are reified and covariant — they carry their component type at run time and throw <code>ArrayStoreException</code> on a bad store. Generics are erased and invariant. Allowing <code>new T[10]</code> would let a compile-time-checked write corrupt an array with no run-time check to catch it, so the language bans it and you use a <code>List</code> instead.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is a bridge method?"</strong><br>A: A synthetic method the compiler generates to make erasure work with polymorphism. If you implement <code>Comparable&lt;Employee&gt;</code> you write <code>compareTo(Employee)</code>, but the erased interface declares <code>compareTo(Object)</code>. The compiler adds a bridge <code>compareTo(Object)</code> that casts and delegates to yours, so dynamic dispatch still finds the right method. It shows up in <code>javap -c</code> output and in occasional stack traces.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Is <code>List&lt;String&gt;</code> a subtype of <code>List&lt;Object&gt;</code>?"</strong><br>A: No — generics are invariant, deliberately. If it were allowed you could assign a <code>List&lt;String&gt;</code> to a <code>List&lt;Object&gt;</code> reference and then add an <code>Integer</code>, breaking the original list with no error. Wildcards exist to recover the flexibility safely: <code>List&lt;? extends Object&gt;</code> can read, <code>List&lt;? super String&gt;</code> can write.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Can reflection see generic types?"</strong><br>A: Partly, and the distinction matters. Type arguments in a field, method or class <em>signature</em> are kept as metadata — that is how Jackson knows a field is <code>List&lt;User&gt;</code>. What is not available is the type argument of an <em>instance</em>: given a <code>List</code> object, you cannot ask what it contains. So "generics are erased" is true of objects, not of declarations.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is heap pollution?"</strong><br>A: When a variable of a parameterised type refers to an object that is not of that type — most commonly through generic varargs, which compile to an array of the erased type and so reopen the array/generics hole. It usually surfaces as a <code>ClassCastException</code> far from the cause. <code>@SafeVarargs</code> silences the warning and should only be used when the method just reads the varargs array and never writes to it or lets it escape.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><strong>Erasure</strong>: type args checked, then deleted; <code>T</code> → leftmost bound or <code>Object</code>; casts inserted.</li>` +
        `<li>Reason: <strong>backward compatibility</strong> with pre-Java-5 code.</li>` +
        `<li>Forbidden by erasure: <code>new T()</code> · <code>new T[]</code> · <code>instanceof T</code> · static <code>T</code> · overload on type args · generic <code>catch</code>.</li>` +
        `<li><code>List&lt;String&gt;.class == List&lt;Integer&gt;.class</code> → <strong>true</strong>.</li>` +
        `<li>Workarounds: <strong><code>Class&lt;T&gt;</code> token</strong> or <strong><code>Supplier&lt;T&gt;</code></strong>.</li>` +
        `<li><strong>Bridge methods</strong> keep polymorphism working after erasure.</li>` +
        `<li>Generics are <strong>invariant</strong>; arrays are covariant and reified.</li>` +
        `<li>Signatures keep type args (reflection works); <strong>instances do not</strong>.</li>` +
        `<li>Never use <strong>raw types</strong> — they disable checking wholesale.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Bounded Types and Wildcards (PECS)',
      slug: 'wildcards-and-pecs',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Wildcards are where generics stop being obvious. <code>? extends</code> and <code>? super</code> feel arbitrary until you see the rule behind them, and then they become mechanical. Interviewers ask because PECS is a genuine "do you understand the type system or did you copy a signature from Stack Overflow?" test — and because you cannot read the JDK's own APIs (<code>Collections.copy</code>, <code>Stream.map</code>, <code>Comparator.comparing</code>) without it.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Generics are <strong>invariant</strong>: <code>List&lt;String&gt;</code> is not a <code>List&lt;Object&gt;</code>, even though <code>String</code> is an <code>Object</code>. That is deliberate — if it were allowed, you could add an <code>Integer</code> through the <code>List&lt;Object&gt;</code> reference and corrupt the list.</p>`,
        `<p>Wildcards restore the flexibility without the hole, in one of two directions:</p>`,
        `<ul>` +
        `<li><code>? extends T</code> — "some unknown subtype of T". You can <strong>read</strong> T out of it. You cannot write into it.</li>` +
        `<li><code>? super T</code> — "some unknown supertype of T". You can <strong>write</strong> T into it. Reading gives only <code>Object</code>.</li>` +
        `</ul>`,
        `<p>The mnemonic is <strong>PECS — Producer Extends, Consumer Super</strong>. If the parameter <em>produces</em> values for you to consume, use <code>extends</code>. If it <em>consumes</em> values you supply, use <code>super</code>.</p>`,
        `{{fig:ch5-pecs.svg|Left panel shows a producer list declared with question mark extends Number allowing reads but rejecting writes; right panel shows a consumer list declared with question mark super Integer allowing writes but reading only Object|Both restrictions come from the same reasoning: the compiler knows only one end of the type range, so it permits exactly the operation that is safe for every type the wildcard could stand for.}}`,
        `<h2>How it works</h2>`,
        `<p>Work through <em>why</em> each restriction exists and you will never need the mnemonic again.</p>`,
        `<p>Given <code>List&lt;? extends Number&gt; src</code>, the actual object might be a <code>List&lt;Integer&gt;</code>, a <code>List&lt;Double&gt;</code>, or a <code>List&lt;Number&gt;</code>. <strong>Reading</strong> is safe: whichever it is, every element is a <code>Number</code>. <strong>Writing</strong> is not: if you add an <code>Integer</code> and the list is really a <code>List&lt;Double&gt;</code>, you have corrupted it. The compiler cannot tell which, so it forbids all writes except <code>null</code>.</p>`,
        `<p>Given <code>List&lt;? super Integer&gt; dst</code>, the object might be a <code>List&lt;Integer&gt;</code>, <code>List&lt;Number&gt;</code>, or <code>List&lt;Object&gt;</code>. <strong>Writing</strong> an <code>Integer</code> is safe in all three. <strong>Reading</strong> is not useful: the only type all three share is <code>Object</code>.</p>`,
        `<p><strong>Bounded type parameters</strong> are the related, different tool. <code>&lt;T extends Number&gt;</code> on a method or class constrains what <code>T</code> may be <em>and</em> keeps the type available, so you can use <code>T</code> in several positions and the compiler ties them together. The rule of thumb: use a <strong>wildcard</strong> when the type appears once and you do not need to name it; use a <strong>type parameter</strong> when you need to refer to the same type twice.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The problem wildcards solve:</p>`,
        `<pre><code class="language-java">// Too rigid: accepts ONLY List&lt;Number&gt;, not List&lt;Integer&gt;.
double sumBad(List&lt;Number&gt; nums) { … }
// sumBad(List.of(1, 2, 3));      ✘ List&lt;Integer&gt; is not a List&lt;Number&gt;

// ✔ Producer — we only read, so extends.
double sum(List&lt;? extends Number&gt; nums) {
    double total = 0;
    for (Number n : nums) total += n.doubleValue();   // ✔ read as Number
    // nums.add(1);                                    ✘ cannot write
    return total;
}
sum(List.of(1, 2, 3));           // ✔ List&lt;Integer&gt;
sum(List.of(1.5, 2.5));          // ✔ List&lt;Double&gt;

// ✔ Consumer — we only write, so super.
void addNumbers(List&lt;? super Integer&gt; dst) {
    for (int i = 0; i &lt; 5; i++) dst.add(i);           // ✔ write
    // Integer first = dst.get(0);                     ✘ only Object comes out
}
addNumbers(new ArrayList&lt;Integer&gt;());   // ✔
addNumbers(new ArrayList&lt;Number&gt;());    // ✔
addNumbers(new ArrayList&lt;Object&gt;());    // ✔</code></pre>`,
        `<p>Both at once — the canonical signature, and the one to remember:</p>`,
        `<pre><code class="language-java">// Copies from a producer into a consumer. This is essentially
// Collections.copy, and it is the clearest example of PECS.
public static &lt;T&gt; void copy(List&lt;? super T&gt; dst, List&lt;? extends T&gt; src) {
    for (T item : src) dst.add(item);
    //     ↑ src PRODUCES T (extends)   dst CONSUMES T (super) ↑
}

List&lt;Integer&gt; ints = List.of(1, 2, 3);
List&lt;Number&gt; nums = new ArrayList&lt;&gt;();
copy(nums, ints);              // ✔ works across the hierarchy</code></pre>`,
        `<p>Where you have already been using PECS without noticing:</p>`,
        `<pre><code class="language-java">// Stream.map — the mapper PRODUCES R and CONSUMES T:
&lt;R&gt; Stream&lt;R&gt; map(Function&lt;? super T, ? extends R&gt; mapper);

// forEach CONSUMES elements:
void forEach(Consumer&lt;? super T&gt; action);

// Comparator.comparing — the extractor consumes T, produces the sort key:
static &lt;T, U extends Comparable&lt;? super U&gt;&gt; Comparator&lt;T&gt; comparing(
        Function&lt;? super T, ? extends U&gt; keyExtractor);

// The practical payoff of "? super T" on a Comparator:
class Animal { }
class Dog extends Animal { }
Comparator&lt;Animal&gt; byName = …;
List&lt;Dog&gt; dogs = …;
dogs.sort(byName);   // ✔ because sort takes Comparator&lt;? super Dog&gt;
                     //   — a comparator of Animals can order Dogs.</code></pre>`,
        `<p>Unbounded wildcards and the raw-type trap:</p>`,
        `<pre><code class="language-java">// &lt;?&gt; means "some specific unknown type" — you can read as Object and
// call methods that do not involve the type parameter.
void printAll(List&lt;?&gt; list) {
    System.out.println(list.size());       // ✔
    for (Object o : list) System.out.println(o);   // ✔
    // list.add("x");                       ✘ unknown type — no writes but null
}

// ✘ A raw List is NOT the same thing. It disables generic checking entirely,
//   so this compiles and is unsafe:
void broken(List list) { list.add("anything"); }
// Always prefer List&lt;?&gt; when you do not care about the element type.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Wildcard capture</strong> explains an error message that otherwise looks like nonsense. When the compiler needs to name the unknown type it invents one — <code>capture#1 of ? extends Number</code> — and errors mention it. The standard fix is a private <em>capture helper</em>: a generic method whose type parameter binds the captured type so it can be used consistently.</p>`,
        `<pre><code class="language-java">// ✘ "capture#1 of ?" errors — the compiler cannot prove both ends match.
public static void swap(List&lt;?&gt; list, int i, int j) {
    // list.set(i, list.get(j));
}

// ✔ Capture helper: the type parameter T gives the unknown type a name.
public static void swap(List&lt;?&gt; list, int i, int j) { swapHelper(list, i, j); }

private static &lt;T&gt; void swapHelper(List&lt;T&gt; list, int i, int j) {
    T tmp = list.get(i);
    list.set(i, list.get(j));
    list.set(j, tmp);
}</code></pre>`,
        `<p><strong>Why <code>Comparable&lt;? super T&gt;</code> is everywhere in the JDK</strong> is worth understanding, because it looks like noise. If <code>Employee implements Comparable&lt;Person&gt;</code> — comparing on a field inherited from <code>Person</code> — then <code>Employee</code> is not a <code>Comparable&lt;Employee&gt;</code>, and a signature demanding that would reject it. <code>Comparable&lt;? super T&gt;</code> accepts a comparison defined anywhere up the hierarchy, which is exactly the flexible-and-safe form.</p>`,
        `<p><strong>Wildcards never appear in a return type</strong> in well-designed APIs. Returning <code>List&lt;? extends Number&gt;</code> forces every caller to deal with the wildcard, which spreads the constraint outward for no benefit. Effective Java's guidance is blunt: use wildcards on parameters to make an API flexible, never on returns.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Trying to add to a <code>? extends</code> collection.</strong> Only <code>null</code> is accepted, and the reason is that the actual element type is unknown.</li>` +
        `<li><strong>Expecting a useful type from a <code>? super</code> read.</strong> You get <code>Object</code>.</li>` +
        `<li><strong>Using a raw type instead of <code>&lt;?&gt;</code>.</strong> <code>List&lt;?&gt;</code> is safe and checked; a raw <code>List</code> disables checking.</li>` +
        `<li><strong>Wildcards in return types.</strong> Pushes the constraint onto every caller.</li>` +
        `<li><strong>Reaching for a wildcard when a type parameter is needed.</strong> If the same type appears twice, name it with <code>&lt;T&gt;</code>.</li>` +
        `<li><strong>Being surprised by "capture#1" errors.</strong> Use a private generic helper to bind the captured type.</li>` +
        `<li><strong>Over-wildcarding.</strong> A signature nobody can read is worse than one that is slightly less flexible.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is PECS?"</strong><br>A: Producer Extends, Consumer Super. If a parameter produces values you will read, declare it <code>? extends T</code>; if it consumes values you will write, declare it <code>? super T</code>. It comes from the compiler knowing only one end of the type range — with <code>extends</code> it knows everything coming out is at least a T, so reads are safe; with <code>super</code> it knows a T is a legal element for every possible actual type, so writes are safe.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why can't you add to a <code>List&lt;? extends Number&gt;</code>?"</strong><br>A: Because the compiler does not know what it really is. It could be a <code>List&lt;Double&gt;</code>, in which case adding an <code>Integer</code> would corrupt it. Since it cannot prove the write is safe for every type the wildcard could stand for, it forbids all writes except <code>null</code>, which is a valid value of every reference type.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why are generics invariant when arrays are covariant?"</strong><br>A: Array covariance was a Java 1.0 decision made before generics existed, and it is unsound — it is only patched at run time by <code>ArrayStoreException</code>. Generics are erased, so there is no run-time check available to patch it. Invariance plus wildcards gives the same flexibility with compile-time safety instead.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Wildcard or type parameter?"</strong><br>A: A wildcard when the type appears once in the signature and I never need to name it — it makes the API accept more callers. A type parameter when the same type appears in more than one place and the compiler must tie them together, for example returning the same type it took in.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What does <code>List&lt;?&gt;</code> mean, and how is it different from a raw <code>List</code>?"</strong><br>A: <code>List&lt;?&gt;</code> is a list of some specific but unknown type — fully checked, so you can read elements as <code>Object</code> and call methods that do not involve the type parameter, but you cannot add anything except <code>null</code>. A raw <code>List</code> opts out of generic checking altogether, so unsafe adds compile silently. Always prefer <code>List&lt;?&gt;</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why does <code>Collections.sort</code> take <code>Comparable&lt;? super T&gt;</code>?"</strong><br>A: So a comparison defined on a supertype still works. If <code>Employee implements Comparable&lt;Person&gt;</code>, then <code>Employee</code> is not a <code>Comparable&lt;Employee&gt;</code> and a stricter signature would reject it — even though ordering employees by a <code>Person</code> field is perfectly sensible. It is PECS applied to the comparison itself.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><strong>PECS</strong>: Producer <code>extends</code> (read), Consumer <code>super</code> (write).</li>` +
        `<li><code>? extends T</code> → read as T, <strong>no writes</strong> (except null).</li>` +
        `<li><code>? super T</code> → write T, <strong>reads give Object</strong>.</li>` +
        `<li>Canonical signature: <code>copy(List&lt;? super T&gt; dst, List&lt;? extends T&gt; src)</code>.</li>` +
        `<li>Generics are <strong>invariant</strong> — that is why wildcards exist.</li>` +
        `<li><code>List&lt;?&gt;</code> = unknown but checked. Raw <code>List</code> = unchecked. Never raw.</li>` +
        `<li>Wildcard when the type appears <strong>once</strong>; type parameter when it appears <strong>twice</strong>.</li>` +
        `<li><strong>No wildcards in return types.</strong></li>` +
        `<li>"capture#1" error → extract a private generic <strong>capture helper</strong>.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Comparable vs Comparator',
      slug: 'comparable-vs-comparator',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Sorting comes up in almost every interview, usually as "sort these employees by department, then salary descending". The answer separates people who write a fifteen-line anonymous class from people who write one composed line — and the composed version is not just shorter, it is harder to get wrong. This topic also closes a loop from Chapter 4: <code>TreeMap</code> and <code>TreeSet</code> decide equality with <code>compareTo</code>, so a broken comparator silently loses data.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Both define an ordering; the difference is <em>where the ordering lives</em>.</p>`,
        `{{fig:ch5-comparable-vs-comparator.svg|Left panel shows Comparable implemented inside the Employee class defining one natural order; right panel shows Comparator built at the call site with comparing thenComparing and reversed|Comparable is a property of the class — one natural order, baked in. Comparator is a separate object, so a class can be sorted many different ways without being modified.}}`,
        `<ul>` +
        `<li><strong><code>Comparable&lt;T&gt;</code></strong> — implemented <em>by</em> the class, defining its single <em>natural order</em>. One method: <code>int compareTo(T other)</code>.</li>` +
        `<li><strong><code>Comparator&lt;T&gt;</code></strong> — a separate object defining <em>an</em> order. One abstract method: <code>int compare(T a, T b)</code>. You can have as many as you like, and you need no access to the class.</li>` +
        `</ul>`,
        `<p>Both return a negative number, zero, or a positive number for "less than", "equal", "greater than". Nothing requires −1 and 1 specifically.</p>`,
        `<h2>How it works</h2>`,
        `<table><thead><tr><th></th><th><code>Comparable</code></th><th><code>Comparator</code></th></tr></thead><tbody>` +
        `<tr><td>Package</td><td><code>java.lang</code></td><td><code>java.util</code></td></tr>` +
        `<tr><td>Method</td><td><code>compareTo(T o)</code></td><td><code>compare(T a, T b)</code></td></tr>` +
        `<tr><td>Where</td><td>Inside the class</td><td>Outside, at the call site</td></tr>` +
        `<tr><td>How many</td><td>One per class</td><td>Unlimited</td></tr>` +
        `<tr><td>Needs the source?</td><td>Yes</td><td>No</td></tr>` +
        `<tr><td>Lambda-able</td><td>No</td><td>Yes — a functional interface</td></tr>` +
        `<tr><td>Used by</td><td><code>sort()</code> with no argument, <code>TreeMap</code>/<code>TreeSet</code> by default</td><td><code>sort(cmp)</code>, <code>new TreeMap&lt;&gt;(cmp)</code>, <code>max</code>/<code>min</code></td></tr>` +
        `</tbody></table>`,
        `<p><strong>The contract</strong> is what interviewers probe, because breaking it causes bugs that are hard to trace. An ordering must be:</p>`,
        `<ul>` +
        `<li><strong>Antisymmetric</strong> — <code>sgn(compare(a,b)) == -sgn(compare(b,a))</code>.</li>` +
        `<li><strong>Transitive</strong> — if a &gt; b and b &gt; c then a &gt; c.</li>` +
        `<li><strong>Consistent</strong> — equal elements compare equally against everything else.</li>` +
        `<li><em>Recommended</em>: <strong>consistent with <code>equals</code></strong> — <code>compare(a,b) == 0</code> exactly when <code>a.equals(b)</code>. Not required, but a sorted collection misbehaves without it (Chapter 4's <code>TreeMap</code> merge).</li>` +
        `</ul>`,
        `<p>Break the contract and <code>Collections.sort</code> may throw <code>IllegalArgumentException: Comparison method violates its general contract!</code> — a real error from the TimSort implementation detecting inconsistency mid-sort. It usually appears only on large inputs, which is why it tends to surface in production rather than in tests.</p>`,
        `<h2>Code examples</h2>`,
        `<p>Modern <code>Comparator</code> composition, which is the answer to "sort by X then Y":</p>`,
        `<pre><code class="language-java">record Employee(String name, String dept, int salary) { }

List&lt;Employee&gt; staff = new ArrayList&lt;&gt;(…);

// Department ascending, then salary DESCENDING within each department.
staff.sort(Comparator.comparing(Employee::dept)
                     .thenComparing(Employee::salary, Comparator.reverseOrder()));

// Careful — .reversed() at the END reverses the WHOLE chain, not the last key:
staff.sort(Comparator.comparing(Employee::dept)
                     .thenComparing(Employee::salary)
                     .reversed());     // dept DESC and salary DESC

// Primitive-specialised versions avoid boxing on every comparison:
staff.sort(Comparator.comparingInt(Employee::salary));

// Null-safe, which hand-written comparators almost always forget:
staff.sort(Comparator.comparing(Employee::name,
        Comparator.nullsFirst(Comparator.naturalOrder())));</code></pre>`,
        `<p><code>Comparable</code> for a genuine natural order:</p>`,
        `<pre><code class="language-java">public class Version implements Comparable&lt;Version&gt; {
    private final int major, minor, patch;

    @Override
    public int compareTo(Version o) {
        // ✔ Integer.compare — no overflow, and it reads clearly.
        int c = Integer.compare(major, o.major);
        if (c != 0) return c;
        c = Integer.compare(minor, o.minor);
        if (c != 0) return c;
        return Integer.compare(patch, o.patch);
    }
}
// Now sorting needs no argument, and TreeSet&lt;Version&gt; just works:
Collections.sort(versions);
Set&lt;Version&gt; sorted = new TreeSet&lt;&gt;(versions);</code></pre>`,
        `<p>The subtraction bug — the single most common comparator mistake:</p>`,
        `<pre><code class="language-java">// ✘ Overflows. Looks fine, passes every small test, fails on real data.
Comparator&lt;Employee&gt; broken = (a, b) -&gt; a.salary() - b.salary();

int a = Integer.MAX_VALUE, b = -1;
System.out.println(a - b);                    // -2147483648  → says a &lt; b ✘
System.out.println(Integer.compare(a, b));    // 1            → correct ✔

// ✔ Always Integer.compare / Long.compare / Double.compare.
Comparator&lt;Employee&gt; fixed = Comparator.comparingInt(Employee::salary);

// Double has a second reason: Double.compare handles NaN and ±0.0 correctly,
// which naive subtraction and even &lt; / &gt; do not.</code></pre>`,
        `<p>And the inconsistency that throws mid-sort:</p>`,
        `<pre><code class="language-java">// ✘ Not antisymmetric — compare(a,a) returns 1, and TimSort will detect it.
Comparator&lt;Task&gt; bad = (x, y) -&gt; x.priority() &gt;= y.priority() ? 1 : -1;
// java.lang.IllegalArgumentException: Comparison method violates its general contract!

// ✔ Three-way, so equal really means 0.
Comparator&lt;Task&gt; good = Comparator.comparingInt(Task::priority);</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>What actually sorts.</strong> <code>Collections.sort</code> and <code>List.sort</code> delegate to <code>Arrays.sort</code>, which for objects uses <strong>TimSort</strong> — a stable, adaptive merge sort that exploits runs already in order, giving O(n) on nearly-sorted input and O(n log n) worst case. <em>Stable</em> means equal elements keep their relative order, which is exactly what makes "sort by salary, then re-sort by department" work as a two-pass approach. For primitives, <code>Arrays.sort</code> uses a dual-pivot quicksort instead — faster, but not stable, which does not matter because primitives are indistinguishable when equal.</p>`,
        `<p><strong>Why TimSort detects contract violations</strong> rather than producing a wrong answer: it merges runs assuming a consistent ordering, and an inconsistent comparator can drive its internal invariants into an impossible state. Rather than corrupt the array silently, it throws. The check only fires on inputs large enough to trigger merging — typically 32 or more elements — which is precisely why these bugs skip past unit tests.</p>`,
        `<p><strong><code>Comparator</code> is a functional interface</strong> with one abstract method, which is why a lambda works and why the whole <code>comparing</code>/<code>thenComparing</code>/<code>reversed</code> family exists as default and static methods on it. That family is the reason to prefer <code>Comparator</code> for anything beyond a single obvious ordering: it composes, it is null-safe on request, and it reads like the requirement it implements.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Subtraction in a comparator.</strong> <code>a - b</code> overflows. Use <code>Integer.compare</code>.</li>` +
        `<li><strong>A comparator that never returns 0.</strong> Breaks antisymmetry and throws mid-sort on large inputs.</li>` +
        `<li><strong><code>.reversed()</code> at the end of a chain.</strong> It reverses everything before it. Pass <code>Comparator.reverseOrder()</code> to the specific key instead.</li>` +
        `<li><strong>Ignoring nulls.</strong> A null field throws <code>NullPointerException</code> inside the sort. Use <code>nullsFirst</code>/<code>nullsLast</code>.</li>` +
        `<li><strong>Ordering inconsistent with <code>equals</code>.</strong> A <code>TreeSet</code> will silently treat unequal elements as duplicates (Chapter 4).</li>` +
        `<li><strong>Implementing <code>Comparable</code> when there is no natural order.</strong> If "which order?" has more than one sensible answer, it belongs in a <code>Comparator</code>.</li>` +
        `<li><strong>Sorting an immutable list.</strong> <code>List.of(...)</code> and <code>Arrays.asList</code> results throw on <code>sort</code>. Copy first.</li>` +
        `<li><strong>Boxing in hot comparisons.</strong> Use <code>comparingInt</code>/<code>comparingLong</code>/<code>comparingDouble</code>.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "<code>Comparable</code> vs <code>Comparator</code>?"</strong><br>A: <code>Comparable</code> is implemented by the class itself and defines its one natural ordering via <code>compareTo</code> — it is what <code>Collections.sort(list)</code> and <code>TreeSet</code> use by default. <code>Comparator</code> is a separate object defining any ordering via <code>compare(a, b)</code>; you can have many, you do not need the class's source, and because it is a functional interface you can write it as a lambda and compose it.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Sort employees by department, then by salary descending."</strong><br>A: <code>list.sort(Comparator.comparing(Employee::dept).thenComparing(Employee::salary, Comparator.reverseOrder()))</code>. The important detail is passing <code>reverseOrder()</code> to that specific key — putting <code>.reversed()</code> at the end of the chain would reverse the department ordering too.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is wrong with <code>(a, b) -&gt; a.getAge() - b.getAge()</code>?"</strong><br>A: Integer overflow. If the values straddle the int range the subtraction wraps and the sign flips, so the comparator reports the opposite order. <code>Integer.compare(a.getAge(), b.getAge())</code> is correct and just as readable. With doubles there is a second reason to use <code>Double.compare</code> — it handles NaN and ±0.0 properly.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What causes 'Comparison method violates its general contract'?"</strong><br>A: An inconsistent comparator — usually one that never returns 0, or is not antisymmetric or transitive. TimSort merges assuming a consistent ordering, and when the invariants become impossible it throws rather than silently corrupting the array. It only fires on inputs large enough to trigger merging, which is why it typically escapes unit tests and appears in production.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What algorithm does Java use to sort?"</strong><br>A: TimSort for objects — a stable, adaptive merge sort, O(n log n) worst case and close to O(n) on nearly-sorted data. Dual-pivot quicksort for primitive arrays, which is faster but unstable; that is fine because equal primitives are indistinguishable. Stability is why you can sort by one key and then another and keep the first as a tie-break.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Should a comparator be consistent with <code>equals</code>?"</strong><br>A: It is strongly recommended, not required. Sorted collections use only the comparison, so an ordering that returns 0 for objects <code>equals</code> considers different will make a <code>TreeSet</code> drop them as duplicates and a <code>TreeMap</code> overwrite entries. That is sometimes deliberate — a case-insensitive map — but it must be a decision, not an accident.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><code>Comparable</code> = inside the class, ONE natural order, <code>compareTo(o)</code>, <code>java.lang</code>.</li>` +
        `<li><code>Comparator</code> = outside, MANY orders, <code>compare(a,b)</code>, <code>java.util</code>, lambda-able.</li>` +
        `<li>Compose: <code>comparing().thenComparing().reversed()</code> — <strong><code>reversed()</code> flips the whole chain</strong>.</li>` +
        `<li><strong>Never subtract.</strong> <code>Integer.compare</code> / <code>Double.compare</code> — overflow and NaN.</li>` +
        `<li>Contract: antisymmetric, transitive, consistent; <strong>ideally consistent with <code>equals</code></strong>.</li>` +
        `<li>Violations throw <em>"Comparison method violates its general contract"</em> — only on big inputs.</li>` +
        `<li>Objects sort with <strong>stable TimSort</strong>; primitives with dual-pivot quicksort (unstable).</li>` +
        `<li>Nulls → <code>nullsFirst</code>/<code>nullsLast</code>. Hot paths → <code>comparingInt</code>/<code>Long</code>/<code>Double</code>.</li>` +
        `</ul>`,
      ].join('\n'),
    },
  ],
};
