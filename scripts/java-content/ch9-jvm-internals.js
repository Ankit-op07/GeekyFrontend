/**
 * Java Interview Kit — Chapter 9: JVM Internals.
 *
 * The senior filter. Classloading, memory areas, garbage collection and
 * diagnosing production memory problems.
 *
 * ⚠️ Content strings are TEMPLATE LITERALS — never use a backtick inside them,
 * and always escape ${...} as \${...} or it will be interpolated.
 */
module.exports = {
  title: 'JVM Internals',
  slug: 'jvm-internals',
  order: 8,
  topics: [
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Class Loading and the Delegation Model',
      slug: 'classloading',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Class loading is invisible until it breaks, and then it produces the most confusing errors in Java: <code>ClassNotFoundException</code> versus <code>NoClassDefFoundError</code>, and the notorious "class X cannot be cast to class X". Every application server, plugin system and hot-reload mechanism is built on custom class loaders, so this is also where "how does Tomcat isolate two applications?" is answered.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Classes are loaded <strong>lazily</strong> — on first active use, not at startup — by a hierarchy of loaders that follow <strong>parent delegation</strong>: before loading a class itself, a loader asks its parent, which asks its parent, all the way to the top.</p>`,
        `{{fig:ch9-classloader.svg|Three stacked loaders Bootstrap Platform and Application with red arrows delegating upward and green arrows loading downward plus panels on security and class identity|Requests travel up, loading happens on the way back down. The highest loader that can load a class wins — which is what makes it impossible to substitute your own java.lang.String.}}`,
        `<p>Loading has three phases: <strong>loading</strong> (find the bytes, create the <code>Class</code> object), <strong>linking</strong> (verify the bytecode, prepare static fields with default values, resolve symbolic references), and <strong>initialisation</strong> (run static initialisers — Chapter 2's order).</p>`,
        `<h2>How it works</h2>`,
        `<p><strong>The three built-in loaders</strong> (names changed in Java 9 with modules): <strong>Bootstrap</strong> loads the core JDK and is native code with no parent — <code>String.class.getClassLoader()</code> returns <code>null</code>, which is not a bug. <strong>Platform</strong> (formerly Extension) loads JDK modules outside the core. <strong>Application</strong> loads your classpath.</p>`,
        `<p><strong>Why delegation exists is security.</strong> Without it, an attacker could put a malicious <code>java.lang.String</code> on the classpath and have it loaded instead of the real one. Delegation guarantees the Bootstrap loader always wins for core classes.</p>`,
        `<p><strong>Class identity is name plus loader.</strong> Two loaders loading the same bytes produce two distinct types that are not assignable to each other. That is the source of the "<code>com.app.User</code> cannot be cast to <code>com.app.User</code>" error — the message looks absurd and is literally true.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The two errors that look similar and mean different things:</p>`,
        `<pre><code class="language-java">// ClassNotFoundException — CHECKED. Something asked for a class BY NAME and
// the loader could not find it. Usually a missing dependency or a typo.
Class.forName("com.app.Missing");        // → ClassNotFoundException

// NoClassDefFoundError — an ERROR. The class was present at COMPILE time but
// is missing (or failed to initialise) at run time. Two very different causes:
//   1. The jar is not on the runtime classpath.
//   2. ⚠ The class FAILED ITS STATIC INITIALISER earlier. The first attempt
//      throws ExceptionInInitializerError; every attempt after that throws
//      NoClassDefFoundError with no hint of the original cause.
// Always look for an earlier ExceptionInInitializerError in the log —
// that is where the real failure is.</code></pre>`,
        `<p>Lazy initialisation, and what does and does not trigger it:</p>`,
        `<pre><code class="language-java">class Config {
    static final int MAX = 100;                    // compile-time constant
    static final String HOST = System.getenv("H"); // computed at init
    static { System.out.println("Config initialised"); }
}

System.out.println(Config.MAX);    // does NOT initialise — the value was
                                   // INLINED into the caller at compile time
System.out.println(Config.HOST);   // DOES initialise → prints the message
new Config();                      // initialises
Config.class;                      // does NOT — a class literal is not active use</code></pre>`,
        `<p>A custom loader, which is what plugin and app-server isolation really is:</p>`,
        `<pre><code class="language-java">class PluginClassLoader extends ClassLoader {
    private final Path jar;
    PluginClassLoader(Path jar, ClassLoader parent) { super(parent); this.jar = jar; }

    @Override
    protected Class&lt;?&gt; findClass(String name) throws ClassNotFoundException {
        byte[] bytes = readClassBytes(jar, name);   // ← override findClass,
        return defineClass(name, bytes, 0, bytes.length);   // NOT loadClass,
    }                                    // so delegation still runs first
}

// Two plugins, two loaders → two isolated copies of the same library.
// This is how Tomcat runs two webapps with conflicting dependency versions,
// and how OSGi and hot-reload work.
// ⚠ Tomcat deliberately INVERTS delegation for webapp classes (child-first)
//   so an app's bundled library wins over the container's — a documented
//   exception to the rule, not a violation of it.</code></pre>`,
        `<p>The class-identity trap:</p>`,
        `<pre><code class="language-java">Class&lt;?&gt; a = loaderA.loadClass("com.app.User");
Class&lt;?&gt; b = loaderB.loadClass("com.app.User");
System.out.println(a == b);           // false — different types!
Object u = a.getDeclaredConstructor().newInstance();
// com.app.User user = (com.app.User) u;
// → ClassCastException: class com.app.User cannot be cast to class com.app.User
//   The message names the loaders in brackets — that is the clue.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Verification is a real security boundary.</strong> Before executing a loaded class the JVM proves properties about its bytecode: the operand stack never underflows, locals are read with the type they were written with, control flow never leaves the method. This is what historically made running untrusted applets possible, and it is why a corrupt jar fails loudly at load rather than corrupting the heap.</p>`,
        `<p><strong>Class initialisation is thread-safe and exactly-once</strong>, guaranteed by the JVM under an internal lock — the property that makes the holder idiom (Chapter 2) a correct lazy singleton. The same lock means a static initialiser that blocks waiting on another class which is itself waiting can deadlock, with stack traces that look idle.</p>`,
        `<p><strong>Class unloading barely happens.</strong> A class can only be collected when its <em>loader</em> becomes unreachable, so ordinary application classes live for the life of the JVM. This is why repeated hot redeploys leak Metaspace: each deploy creates a new loader, and if anything — a <code>ThreadLocal</code>, a JDBC driver registration, a running thread — still references the old one, none of its classes can be freed. That is the classic <code>OutOfMemoryError: Metaspace</code> in an app server.</p>`,
        `<p><strong>Java 9 modules</strong> added a second layer on top: readability between modules and strong encapsulation of internals. Since Java 16 that encapsulation is enforced by default, which is why libraries doing deep reflection into JDK internals broke on newer releases.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Confusing the two errors.</strong> <code>ClassNotFoundException</code> = asked by name, not found. <code>NoClassDefFoundError</code> = was there at compile time, missing or failed to initialise now.</li>` +
        `<li><strong>Missing the earlier <code>ExceptionInInitializerError</code>.</strong> The real cause is usually further up the log.</li>` +
        `<li><strong>Overriding <code>loadClass</code> instead of <code>findClass</code>.</strong> Breaks delegation and the security model.</li>` +
        `<li><strong>Expecting a class to load at startup.</strong> Loading is lazy — errors appear on first use, often mid-request.</li>` +
        `<li><strong>Assuming a constant read triggers initialisation.</strong> Compile-time constants are inlined.</li>` +
        `<li><strong>Ignoring loader leaks on redeploy.</strong> One lingering reference pins every class in that loader.</li>` +
        `<li><strong>Heavy work in static initialisers.</strong> Slow first use, and a possible class-init deadlock.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Explain the class loading process."</strong><br>A: Three phases. Loading finds the bytes and creates the <code>Class</code> object. Linking verifies the bytecode, prepares static fields with defaults, and resolves symbolic references. Initialisation runs static initialisers and static field assignments in source order. It is lazy — triggered by first active use such as instantiation, a static method call, or reading a non-constant static field.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is parent delegation and why does it exist?"</strong><br>A: A loader asks its parent to load a class before trying itself, so requests travel up to Bootstrap and loading happens on the way back down. It exists for security and consistency: you cannot substitute your own <code>java.lang.String</code>, because Bootstrap always gets asked first, and every loader in the chain sees the same core classes.</p></blockquote>`,
        `<blockquote><p><strong>Q: "<code>ClassNotFoundException</code> vs <code>NoClassDefFoundError</code>?"</strong><br>A: <code>ClassNotFoundException</code> is a checked exception from asking for a class by name — <code>Class.forName</code> or <code>loadClass</code> — and not finding it. <code>NoClassDefFoundError</code> is an <code>Error</code>: the class was present at compile time but is missing at run time, or, more subtly, it failed its static initialiser earlier. In that second case the first attempt threw <code>ExceptionInInitializerError</code> and every subsequent one throws <code>NoClassDefFoundError</code> with no cause — so I look further up the log for the original failure.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why would <code>User cannot be cast to User</code> happen?"</strong><br>A: Because class identity is the fully-qualified name <em>plus</em> the loader. Two loaders loading the same bytes produce two distinct, incompatible types. It usually means the same jar is on both the container's and the application's classpath, or an object crossed a plugin boundary. The exception message names the loaders in brackets, which is how you confirm it.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why do redeploys leak memory?"</strong><br>A: Classes can only be unloaded when their loader is unreachable. Each redeploy creates a new loader, and if anything still references the old one — a <code>ThreadLocal</code> on a pooled container thread, a registered JDBC driver, a running thread, a JVM-level cache — that loader and every class it defined stay alive. Repeat a few times and you get <code>OutOfMemoryError: Metaspace</code>. Diagnosing it means finding what still references the old loader, with a heap dump.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Would you ever write a custom class loader?"</strong><br>A: For plugin isolation, hot reload, or loading classes from a non-standard source such as a database or an encrypted archive. The rule is to override <code>findClass</code> rather than <code>loadClass</code>, so the delegation and security model stay intact. Tomcat is the well-known exception — it deliberately inverts delegation for webapp classes so an application's bundled library beats the container's.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Phases: <strong>load → link (verify, prepare, resolve) → initialise</strong>. Lazy, on first active use.</li>` +
        `<li>Loaders: <strong>Bootstrap → Platform → Application</strong>. Bootstrap is native; <code>getClassLoader()</code> returns <code>null</code>.</li>` +
        `<li><strong>Parent delegation</strong>: ask up, load down. Exists for security.</li>` +
        `<li><strong>Class identity = name + loader</strong> → "X cannot be cast to X".</li>` +
        `<li><code>ClassNotFoundException</code> = by-name lookup failed (checked). <code>NoClassDefFoundError</code> = missing at run time <strong>or a failed static init</strong>.</li>` +
        `<li>Look for an earlier <strong><code>ExceptionInInitializerError</code></strong> — that is the real cause.</li>` +
        `<li>Reading a <strong>compile-time constant does not initialise</strong> the class.</li>` +
        `<li>Class init is <strong>thread-safe and once</strong> → holder idiom; can deadlock if it blocks.</li>` +
        `<li>Unloading needs an unreachable <strong>loader</strong> → redeploy leaks → Metaspace OOM.</li>` +
        `<li>Custom loader: override <strong><code>findClass</code></strong>, not <code>loadClass</code>.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'JVM Memory Areas',
      slug: 'jvm-memory-areas',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Chapter 1 introduced stack and heap as a programming model. This topic is the operational version: which regions exist, which are bounded by which flag, and why a container can be killed for using too much memory while the heap graph looks perfectly healthy. That last question is one of the most common real production puzzles in Java, and it has a precise answer.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>The JVM divides memory into regions with different lifetimes and owners:</p>`,
        `{{fig:ch9-jvm-memory.svg|Heap split into young generation with Eden and survivor spaces and old generation on the left per-thread stacks and PC registers on the right and a native memory band across the bottom|The bottom band is the one that surprises people: Metaspace, the code cache, thread stacks and direct buffers all live outside the heap and are not bounded by -Xmx.}}`,
        `<h2>How it works</h2>`,
        `<table><thead><tr><th>Region</th><th>Shared?</th><th>Holds</th><th>Bounded by</th></tr></thead><tbody>` +
        `<tr><td>Heap</td><td>All threads</td><td>Every object and array</td><td><code>-Xms</code> / <code>-Xmx</code></td></tr>` +
        `<tr><td>JVM stack</td><td>Per thread</td><td>Frames, locals, operand stack</td><td><code>-Xss</code> × thread count</td></tr>` +
        `<tr><td>PC register</td><td>Per thread</td><td>Current instruction address</td><td>Negligible</td></tr>` +
        `<tr><td>Metaspace</td><td>All threads</td><td>Class metadata, statics</td><td><code>-XX:MaxMetaspaceSize</code> (unbounded by default)</td></tr>` +
        `<tr><td>Code cache</td><td>All threads</td><td>JIT-compiled native code</td><td><code>-XX:ReservedCodeCacheSize</code></td></tr>` +
        `<tr><td>Direct buffers</td><td>All threads</td><td>NIO off-heap buffers</td><td><code>-XX:MaxDirectMemorySize</code></td></tr>` +
        `</tbody></table>`,
        `<p><strong>The heap is generational</strong> — young (Eden plus two survivor spaces) and old — because most objects die young. Allocation in Eden is a pointer bump inside a thread-local buffer, which is why object creation is far cheaper than most people assume (Chapter 1).</p>`,
        `<p><strong>Metaspace replaced PermGen in Java 8.</strong> PermGen was a fixed-size region inside the heap; Metaspace is native memory that grows on demand. That removed the old <code>OutOfMemoryError: PermGen space</code> but introduced a new failure mode — unbounded growth from class-loader leaks that can consume all system memory unless you cap it.</p>`,
        `<h2>Code examples</h2>`,
        `<p>Sizing a JVM in a container, which is where this knowledge pays:</p>`,
        `<pre><code class="language-bash"># ✘ Naive: container limit 1 GB, so give the heap 1 GB. The process is
#   OOM-killed within hours — stacks, Metaspace, code cache and GC
#   structures all live OUTSIDE -Xmx and the kernel counts every byte.
java -Xmx1g -jar app.jar

# ✔ Leave headroom for the non-heap regions.
java -Xms700m -Xmx700m \
     -XX:MaxMetaspaceSize=256m \
     -XX:ReservedCodeCacheSize=128m \
     -Xss512k \
     -jar app.jar

# ✔ Better: let the JVM read the container limit itself (Java 10+, and
#   the default since 11). It sizes the heap as a PERCENTAGE of the limit.
java -XX:MaxRAMPercentage=70 -jar app.jar
# Older JVMs saw the HOST's memory, not the container's, and sized the heap
# far too large — the classic "works on my machine, OOM-killed in Kubernetes".</code></pre>`,
        `<p>Seeing where memory actually goes:</p>`,
        `<pre><code class="language-bash"># Native Memory Tracking — the only way to see non-heap usage properly.
java -XX:NativeMemoryTracking=summary -jar app.jar
jcmd &lt;pid&gt; VM.native_memory summary

# Output names each region — Java Heap, Class (Metaspace), Thread, Code,
# GC, Compiler, Internal — so you can see which one is actually growing.

jcmd &lt;pid&gt; GC.heap_info        # generation sizes and occupancy
jcmd &lt;pid&gt; VM.flags            # every flag in effect, including defaults
jstat -gcutil &lt;pid&gt; 1000       # live GC statistics, once per second</code></pre>`,
        `<p>The four <code>OutOfMemoryError</code> messages, which have different causes:</p>`,
        `<pre><code class="language-text">java.lang.OutOfMemoryError: Java heap space
  → too many live objects. A leak, or an undersized heap. Take a heap dump.

java.lang.OutOfMemoryError: Metaspace
  → too many classes. Usually a class-loader leak from repeated redeploys,
    or a framework generating proxies without bound.

java.lang.OutOfMemoryError: unable to create new native thread
  → the OS refused a thread. Thread leak, or the per-process limit.
    NOT a heap problem — raising -Xmx makes it WORSE (less room for stacks).

java.lang.OutOfMemoryError: GC overhead limit exceeded
  → more than 98% of time in GC recovering less than 2% of the heap.
    The heap is effectively full; the JVM gives up before thrashing forever.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>TLABs</strong> — Thread-Local Allocation Buffers — are why allocation needs no synchronisation. Each thread gets a private slice of Eden and bumps a pointer within it; only when the slice is exhausted does it take a slower shared path. This is the mechanism behind "allocation is a handful of instructions".</p>`,
        `<p><strong>Compressed oops</strong> is the detail with the counter-intuitive consequence. On 64-bit JVMs with a heap under about 32 GB, references are stored as 32-bit offsets rather than 64-bit addresses, halving reference size and improving cache behaviour. Cross that threshold and compressed oops switch off, every reference doubles, and <strong>raising <code>-Xmx</code> from 31 GB to 33 GB can reduce the number of objects you can hold</strong>. The practical advice is to stay under 32 GB, or jump well past it.</p>`,
        `<p><strong>The heap does not shrink readily.</strong> Traditionally the JVM returned memory to the OS reluctantly, which is why <code>-Xms</code> equal to <code>-Xmx</code> is common on servers — it avoids resize pauses and makes usage predictable. G1 and ZGC have improved at giving memory back, but on a container with a hard limit, fixed sizing remains the safer choice.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Setting <code>-Xmx</code> to the container limit.</strong> Ignores every non-heap region; the process gets OOM-killed.</li>` +
        `<li><strong>Assuming <code>-Xmx</code> bounds total memory.</strong> Metaspace, stacks, code cache and direct buffers are all outside it.</li>` +
        `<li><strong>Raising <code>-Xmx</code> for "unable to create new native thread".</strong> That takes memory away from stacks and makes it worse.</li>` +
        `<li><strong>Ignoring which OOM message you got.</strong> Four messages, four different causes and fixes.</li>` +
        `<li><strong>Leaving Metaspace unbounded.</strong> A loader leak can consume all system memory.</li>` +
        `<li><strong>Crossing the 32 GB compressed-oops threshold accidentally.</strong> Capacity can go <em>down</em>.</li>` +
        `<li><strong>Running an old JVM in a container.</strong> Before Java 10 it saw the host's memory and sized the heap far too large.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What are the JVM memory areas?"</strong><br>A: Shared across threads: the heap, which holds every object and is generational; Metaspace for class metadata and statics; the code cache for JIT output. Per thread: the JVM stack of frames, the PC register, and a native method stack. The important operational point is that only the heap is bounded by <code>-Xmx</code> — everything else is native memory outside it.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Your container has a 1 GB limit. What do you set <code>-Xmx</code> to?"</strong><br>A: Not 1 GB. Thread stacks, Metaspace, the code cache, GC structures and direct buffers all live outside the heap, and the kernel counts them, so the process would be OOM-killed. I would leave 25–30% headroom — around 700 MB of heap — and cap Metaspace and the code cache explicitly. On Java 10+ the cleaner approach is <code>-XX:MaxRAMPercentage</code>, letting the JVM read the container limit itself.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What replaced PermGen and why?"</strong><br>A: Metaspace, in Java 8. PermGen was a fixed-size region inside the heap that was hard to size — too small and you got <code>OutOfMemoryError: PermGen space</code> on class-heavy applications, too large and you wasted heap. Metaspace lives in native memory and grows on demand, which removed that failure at the cost of a new one: unbounded growth from class-loader leaks, so it is worth capping.</p></blockquote>`,
        `<blockquote><p><strong>Q: "You get <code>unable to create new native thread</code>. What is wrong?"</strong><br>A: The OS refused to create a thread — either a thread leak in the application or a per-process limit. It is not a heap problem, and raising <code>-Xmx</code> actively makes it worse by leaving less room for stacks. I would take a thread dump to count threads and find who is creating them, check <code>ulimit</code>, and if the count is legitimate, reduce <code>-Xss</code> or move to virtual threads.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why is a 31 GB heap sometimes better than a 33 GB one?"</strong><br>A: Compressed oops. Under roughly 32 GB the JVM stores references as 32-bit offsets; above it they become full 64-bit pointers. Every reference doubles in size, so the extra 2 GB of heap can hold fewer objects than the smaller heap did. Stay comfortably under 32 GB, or go well beyond it.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you see non-heap memory usage?"</strong><br>A: Native Memory Tracking — start with <code>-XX:NativeMemoryTracking=summary</code> and query it with <code>jcmd &lt;pid&gt; VM.native_memory summary</code>. It breaks usage down by category — heap, class, thread, code, GC, compiler — which is the only reliable way to answer "the heap is fine, so where is the memory going?".</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Shared: <strong>heap</strong> (<code>-Xmx</code>), <strong>Metaspace</strong>, <strong>code cache</strong>. Per thread: <strong>stack</strong> (<code>-Xss</code>), PC register.</li>` +
        `<li><strong><code>-Xmx</code> bounds the heap only.</strong> Container limits must allow ~25–30% headroom.</li>` +
        `<li>Java 10+: <strong><code>-XX:MaxRAMPercentage</code></strong> — the JVM reads the container limit.</li>` +
        `<li>Heap = young (Eden + S0/S1) + old. Allocation = <strong>pointer bump in a TLAB</strong>.</li>` +
        `<li><strong>Metaspace replaced PermGen</strong> in Java 8 — native, grows on demand, worth capping.</li>` +
        `<li>Four OOMs: <em>heap space</em> · <em>Metaspace</em> · <em>unable to create native thread</em> · <em>GC overhead limit</em>. Different causes.</li>` +
        `<li><strong>Compressed oops cliff at ~32 GB</strong> — bigger heap, fewer objects.</li>` +
        `<li>Diagnose non-heap with <strong>Native Memory Tracking</strong> + <code>jcmd VM.native_memory</code>.</li>` +
        `<li>Servers: set <code>-Xms</code> = <code>-Xmx</code> to avoid resize pauses.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Garbage Collection',
      slug: 'garbage-collection',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>GC is the JVM's headline feature and the source of its most-discussed weakness: pauses. Understanding generational collection explains why allocation is cheap, why "avoid creating objects" is largely obsolete advice, and why one application benefits from G1 while another needs ZGC. It is also the vocabulary for every latency investigation you will ever run on a JVM.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>The collector reclaims objects that are no longer <strong>reachable</strong> from a <em>GC root</em> — stack references, static fields, JNI references, active threads. Reachability, not usefulness, is the only criterion, which is why the leaks from Chapter 1 are possible.</p>`,
        `<p>The design rests on the <strong>weak generational hypothesis</strong>: most objects die very young.</p>`,
        `{{fig:ch9-gc-generational.svg|Objects flowing from Eden through survivor spaces to the old generation with a full GC at the end plus four cards comparing G1 ZGC Parallel and Serial collectors|Typically 90-98% of objects never leave Eden. A minor GC therefore copies only the few survivors and reclaims everything else for free — which is what makes allocation cheap.}}`,
        `<h2>How it works</h2>`,
        `<p><strong>Mark and sweep, then compact.</strong> The collector marks everything reachable from the roots, sweeps what is not, and compacts survivors so allocation stays a pointer bump. Because the young generation is collected by <em>copying</em> the few survivors out, the cost of a minor GC is proportional to what <em>lives</em>, not to what died — which is why creating many short-lived objects is nearly free.</p>`,
        `<p><strong>The collectors, and when each is right:</strong></p>`,
        `<table><thead><tr><th>Collector</th><th>Optimises for</th><th>Use when</th></tr></thead><tbody>` +
        `<tr><td><strong>G1</strong> (default since 9)</td><td>Balance, with a pause target</td><td>Almost everything — start here</td></tr>` +
        `<tr><td><strong>ZGC</strong> / <strong>Shenandoah</strong></td><td>Sub-millisecond pauses</td><td>Large heaps, latency-critical services</td></tr>` +
        `<tr><td><strong>Parallel</strong></td><td>Raw throughput</td><td>Batch jobs where pauses do not matter</td></tr>` +
        `<tr><td><strong>Serial</strong></td><td>Small footprint</td><td>Small containers, short-lived processes</td></tr>` +
        `</tbody></table>`,
        `<p><strong>G1</strong> divides the heap into equal regions rather than contiguous generations, collects the regions with the most garbage first — hence "garbage first" — and works toward a pause-time target you set. <strong>ZGC and Shenandoah</strong> do nearly all their work concurrently with the application, keeping pauses under a millisecond largely independent of heap size. <strong>CMS was removed in Java 14</strong>, which is worth knowing because a lot of older tuning advice still recommends it.</p>`,
        `<h2>Code examples</h2>`,
        `<pre><code class="language-bash"># Choosing a collector
java -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -jar app.jar   # default; set a target
java -XX:+UseZGC -jar app.jar                              # latency-critical
java -XX:+UseParallelGC -jar app.jar                       # batch throughput
java -XX:+UseSerialGC -jar app.jar                         # small container

# Logging — the first thing to enable when investigating pauses (Java 9+)
java -Xlog:gc*:file=gc.log:time,uptime,level,tags:filecount=5,filesize=10M -jar app.jar

# Dump the heap automatically when it blows up. The single most valuable
# production flag in this area — without it you get one line in a log and
# no way to find the cause.
java -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/var/log/heap.hprof -jar app.jar</code></pre>`,
        `<p>Reading a GC log, which is the actual skill:</p>`,
        `<pre><code class="language-text">[2.456s][info][gc] GC(12) Pause Young (Normal) (G1 Evacuation Pause)
                        512M-&gt;48M(1024M) 8.234ms

// Read it as: heap was 512M before, 48M after, out of a 1024M total, and it
// took 8ms. Healthy — nearly everything collected, short pause.

[45.2s][info][gc] GC(89) Pause Full (G1 Compaction Pause)
                        980M-&gt;940M(1024M) 2340.567ms

// Unhealthy: a FULL GC, 2.3 SECONDS of stop-the-world, and it only freed
// 40M of 980M. The heap is genuinely full of live objects — a leak or an
// undersized heap. Frequent full GCs that reclaim little are the classic
// signature of a memory leak.</code></pre>`,
        `<p>Reference types, which is a common follow-up:</p>`,
        `<pre><code class="language-java">Object strong = new Object();                    // never collected while reachable

SoftReference&lt;byte[]&gt; soft = new SoftReference&lt;&gt;(data);
// Collected only when memory is tight → plausible for caches, though in
// practice a bounded cache (Caffeine) is far more predictable.

WeakReference&lt;Key&gt; weak = new WeakReference&lt;&gt;(key);
// Collected at the next GC once no strong reference remains. This is what
// WeakHashMap uses for keys — the standard fix for listener-registry leaks.

PhantomReference&lt;Resource&gt; phantom = new PhantomReference&lt;&gt;(r, queue);
// For cleanup after collection. Replaces finalize(), which is deprecated
// for removal — finalizers were unpredictable, could resurrect objects, and
// delayed collection. Use Cleaner, or just try-with-resources.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Stop-the-world pauses are unavoidable in part.</strong> Even mostly-concurrent collectors must briefly pause all application threads to scan roots and finish marking. Pausing requires every thread to reach a <em>safepoint</em> — a known-good instruction boundary — so a thread in a long counted loop can delay the whole pause. That is why an occasional pause is far longer than the collector's target and shows as "time to safepoint" in the logs.</p>`,
        `<p><strong>Tuning advice, in the order that actually works:</strong> first fix allocation and leaks in the application, because no collector rescues code that allocates faster than it can collect. Then size the heap correctly. Then choose the right collector for the workload. Only then touch individual flags — hand-tuning generation sizes is rarely productive with G1, which adapts. Most "GC problems" are application problems.</p>`,
        `<p><strong>Never call <code>System.gc()</code>.</strong> It is a hint, it typically forces a full stop-the-world collection, and it usually makes things worse. Production JVMs frequently run with <code>-XX:+DisableExplicitGC</code> for exactly this reason.</p>`,
        `<p><strong><code>finalize()</code> is deprecated for removal</strong>, and it deserves the reputation: finalizers ran on an unpredictable schedule, could resurrect objects, delayed collection by an extra cycle, and silently swallowed exceptions. Use try-with-resources for deterministic cleanup, and <code>java.lang.ref.Cleaner</code> for the rare case where a safety net is genuinely needed.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Calling <code>System.gc()</code>.</strong> Forces a full pause and rarely helps.</li>` +
        `<li><strong>Believing a GC prevents leaks.</strong> It frees unreachable objects; a static map keeps things reachable forever.</li>` +
        `<li><strong>Tuning flags before fixing the application.</strong> Most GC problems are allocation or leak problems.</li>` +
        `<li><strong>Avoiding object creation for its own sake.</strong> Short-lived objects are nearly free; the cost is what survives.</li>` +
        `<li><strong>Using <code>finalize()</code>.</strong> Deprecated for removal — use try-with-resources or <code>Cleaner</code>.</li>` +
        `<li><strong><code>SoftReference</code> caches.</strong> Behaviour depends on memory pressure and is hard to reason about; use a bounded cache.</li>` +
        `<li><strong>Running without GC logs.</strong> They are cheap and are the first thing you will want.</li>` +
        `<li><strong>Copying tuning flags from a blog.</strong> Much of that advice targets CMS, removed in Java 14.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "How does garbage collection work?"</strong><br>A: The collector finds objects reachable from GC roots — stack references, statics, JNI handles, live threads — marks them, and reclaims the rest. The heap is generational because most objects die young: new objects go into Eden, survivors are copied between survivor spaces and aged, and long-lived ones are promoted to the old generation. Minor collections are frequent and cheap because their cost is proportional to what survives, not to what died.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Which collector would you choose?"</strong><br>A: G1 by default — it is the default since Java 9, region-based, and takes a pause-time target. For a latency-sensitive service with a large heap I would move to ZGC or Shenandoah, which do almost everything concurrently and hold pauses under a millisecond regardless of heap size. Parallel for batch work where throughput matters and pauses do not, and Serial for small containers. CMS is not an option — it was removed in Java 14.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you diagnose a memory leak?"</strong><br>A: Start from the GC log: frequent full collections that reclaim very little mean the heap is genuinely full of live objects. Then take a heap dump — ideally automatically, via <code>-XX:+HeapDumpOnOutOfMemoryError</code> — and open it in Eclipse MAT. The dominator tree shows what retains the most memory, and the path-to-GC-roots shows what is holding it. That usually names the offending collection or listener within minutes.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is a stop-the-world pause?"</strong><br>A: A period when all application threads are halted so the collector can work safely. Even mostly-concurrent collectors need brief ones for root scanning and mark termination. Threads must reach a safepoint to be paused, so one in a long counted loop can delay everyone — which is why an occasional pause is much longer than the target and shows up as time-to-safepoint in the logs.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Should you call <code>System.gc()</code>?"</strong><br>A: No. It is only a hint, it typically triggers a full stop-the-world collection, and it interferes with the collector's own scheduling. If memory is a problem the answer is to find what is retained, not to ask for a collection. Many production JVMs run with <code>-XX:+DisableExplicitGC</code> so that a library calling it cannot cause a pause.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What are soft, weak and phantom references?"</strong><br>A: Strong references keep objects alive. Soft references are cleared only when memory is tight, which sounds ideal for caches but is unpredictable in practice. Weak references are cleared at the next GC once no strong reference remains — that is what <code>WeakHashMap</code> uses for keys, and the standard fix for listener-registry leaks. Phantom references exist for post-collection cleanup and, with <code>Cleaner</code>, replace <code>finalize()</code>, which is deprecated for removal.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Reclaims what is <strong>unreachable from GC roots</strong> — reachable ≠ useful.</li>` +
        `<li><strong>Weak generational hypothesis</strong>: most objects die in Eden → minor GC copies only survivors.</li>` +
        `<li><strong>G1</strong> default (region-based, pause target) · <strong>ZGC/Shenandoah</strong> sub-ms · <strong>Parallel</strong> throughput · <strong>Serial</strong> small. <strong>CMS removed in 14.</strong></li>` +
        `<li>Healthy log line: big drop, short pause. <strong>Frequent full GCs reclaiming little = leak.</strong></li>` +
        `<li>Always run with <strong>GC logs</strong> + <code>-XX:+HeapDumpOnOutOfMemoryError</code>.</li>` +
        `<li>Diagnose with <strong>Eclipse MAT</strong>: dominator tree + path to GC roots.</li>` +
        `<li><strong>Never <code>System.gc()</code></strong>. Fix the application before touching flags.</li>` +
        `<li>Safepoints: a thread in a long loop can extend a pause for everyone.</li>` +
        `<li>References: strong · soft (memory-pressure) · weak (<code>WeakHashMap</code>) · phantom (<code>Cleaner</code>). <strong><code>finalize()</code> is dead.</strong></li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Diagnosing Memory and Performance Problems',
      slug: 'jvm-troubleshooting',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>This is the topic that most clearly separates someone who has run Java in production from someone who has only written it. "The service is slow and memory keeps climbing — what do you do?" has a methodical answer, and being able to give it in order, naming the tools, is worth more in a senior interview than any amount of syntax knowledge.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Every JVM investigation follows the same shape: <strong>observe, capture, analyse, verify</strong>. The mistake is jumping to a fix — raising <code>-Xmx</code>, adding threads — before knowing which of the handful of possible causes you actually have.</p>`,
        `<p>The tools ship with the JDK, which is worth saying because people reach for third-party agents unnecessarily:</p>`,
        `<table><thead><tr><th>Tool</th><th>Answers</th></tr></thead><tbody>` +
        `<tr><td><code>jcmd</code></td><td>Everything — the modern front end for all of it</td></tr>` +
        `<tr><td><code>jstat -gcutil</code></td><td>Is GC the problem? Live generation occupancy</td></tr>` +
        `<tr><td>Thread dump</td><td>What are threads doing? Deadlock? Contention?</td></tr>` +
        `<tr><td>Heap dump + Eclipse MAT</td><td>What is retaining memory, and who holds it?</td></tr>` +
        `<tr><td>JFR + JDK Mission Control</td><td>Low-overhead continuous profiling — the best default</td></tr>` +
        `<tr><td>Native Memory Tracking</td><td>Heap looks fine but the process is huge — where?</td></tr>` +
        `</tbody></table>`,
        `<h2>How it works</h2>`,
        `<p><strong>The decision tree</strong> for "memory keeps growing":</p>`,
        `<ol>` +
        `<li><strong>Which OOM message?</strong> Heap space, Metaspace, native thread and GC overhead have four different causes (previous topic).</li>` +
        `<li><strong>Is the heap actually full?</strong> <code>jstat -gcutil</code>. Old generation near 100% after a full GC means genuinely live data.</li>` +
        `<li><strong>Is it growing monotonically?</strong> A leak grows and never recovers; a busy application sawtooths and returns to a stable baseline.</li>` +
        `<li><strong>Heap dump and analyse.</strong> Eclipse MAT's dominator tree names the retainer; path-to-GC-roots names who holds it.</li>` +
        `<li><strong>If the heap is fine but the process is huge</strong>, it is off-heap — Native Memory Tracking, direct buffers, or a native library.</li>` +
        `</ol>`,
        `<p>For "the service is slow", the equivalent first question is whether threads are <em>blocked</em> or <em>busy</em>. A thread dump answers it in seconds: many threads <code>BLOCKED</code> on one monitor is lock contention; threads <code>RUNNABLE</code> in application code is CPU work; threads <code>TIMED_WAITING</code> on a socket is a slow dependency.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The commands, in the order you would actually run them:</p>`,
        `<pre><code class="language-bash">jcmd -l                              # find the pid

# 1. Is it GC?  S0 S1 E O M CCS YGC YGCT FGC FGCT GCT
jstat -gcutil &lt;pid&gt; 1000 10
#    O (old gen) pinned near 100 with FGC climbing = full and not recovering.

# 2. What are the threads doing?
jcmd &lt;pid&gt; Thread.print &gt; threads.txt
#    Take THREE dumps a few seconds apart — one is a snapshot, three show
#    whether a thread is stuck or merely busy.

# 3. Capture the heap. ⚠ This PAUSES the JVM for seconds to minutes and
#    writes a file the size of the heap. Do it on one instance, out of rotation.
jcmd &lt;pid&gt; GC.heap_dump /var/tmp/heap.hprof

# 4. Off-heap suspicion (needs -XX:NativeMemoryTracking=summary at startup)
jcmd &lt;pid&gt; VM.native_memory summary

# 5. Best default for ongoing work — JFR, ~1% overhead, safe in production
jcmd &lt;pid&gt; JFR.start name=diag settings=profile duration=120s filename=/tmp/rec.jfr
#    Open in JDK Mission Control: allocation by call site, lock contention,
#    GC pauses, hot methods, I/O — all in one recording.</code></pre>`,
        `<p>Two leak patterns you will meet, with their fixes:</p>`,
        `<pre><code class="language-java">// 1. The unbounded static cache. A static field is a GC ROOT, so nothing
//    in it is ever collected.
private static final Map&lt;String, byte[]&gt; CACHE = new HashMap&lt;&gt;();
// ✔ Use a bounded cache with eviction — Caffeine, or LinkedHashMap with
//   removeEldestEntry (Chapter 4).

// 2. The ThreadLocal on a pooled thread. Pool threads live for the life of
//    the application, so a value never removed is never collected — and it
//    also pins the class loader, which is the classic redeploy leak.
private static final ThreadLocal&lt;Context&gt; CTX = new ThreadLocal&lt;&gt;();
public void handle(Request r) {
    CTX.set(new Context(r));
    try { process(); }
    finally { CTX.remove(); }        // ✔ non-negotiable on a pooled thread
}</code></pre>`,
        `<p>What a thread dump tells you at a glance:</p>`,
        `<pre><code class="language-text">// Lock contention — 40 threads in this state, all on the same monitor:
"http-nio-8080-exec-7" java.lang.Thread.State: BLOCKED (on object monitor)
    at com.app.Cache.get(Cache.java:42)
    - waiting to lock &lt;0x76b2f1234&gt; (a com.app.Cache)

// Slow dependency — threads parked in socket reads, not blocked on locks:
"http-nio-8080-exec-9" java.lang.Thread.State: RUNNABLE
    at java.net.SocketInputStream.socketRead0(Native Method)

// Deadlock — the JVM detects and names it explicitly:
Found one Java-level deadlock: …</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>JFR is the tool worth adopting</strong> if you take one thing from this topic. Java Flight Recorder is built into the JVM, costs roughly 1% overhead, and records allocation by call site, lock contention, GC events, exceptions, I/O and method profiles into a single file. It has been free and open-source since Java 11. Running it continuously in production means that when something goes wrong you already have the data, instead of trying to reproduce the problem while it is happening.</p>`,
        `<p><strong>Heap dumps are expensive and safe.</strong> They pause the JVM and write a file as large as the live heap — on a 16 GB heap that is minutes of downtime and 16 GB of disk. Take one from an instance removed from the load balancer, and analyse it elsewhere. What makes them worth it is that a heap dump contains the answer: MAT's dominator tree ranks objects by <em>retained</em> size, which is the memory that would be freed if that object went away, so the leak is usually the first or second row.</p>`,
        `<p><strong>Beware the observer effect.</strong> Attaching a sampling profiler with a naive agent can distort exactly the timings you are measuring, and running a debugger disables the JIT optimisations that cause many concurrency bugs. Low-overhead tools built on safepoint-free sampling — JFR, async-profiler — give a truer picture.</p>`,
        `<p><strong>The methodical answer</strong> to give in an interview: reproduce or observe with metrics first, form a hypothesis about which region or resource is exhausted, capture the specific artefact that would confirm it, analyse, fix, and then <em>verify with the same measurement</em>. The last step is the one people skip, and it is how you find out that the fix worked rather than that the load happened to drop.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Raising <code>-Xmx</code> as a first response.</strong> It buys time and hides the cause; unbounded growth will exhaust any heap.</li>` +
        `<li><strong>Restarting without capturing anything.</strong> The evidence is destroyed and the problem returns.</li>` +
        `<li><strong>Taking one thread dump.</strong> Three, seconds apart, distinguish stuck from busy.</li>` +
        `<li><strong>Heap-dumping a live production instance.</strong> It pauses the JVM — take the instance out of rotation.</li>` +
        `<li><strong>Guessing instead of measuring.</strong> Intuition about performance is reliably wrong.</li>` +
        `<li><strong>Not running with GC logs and <code>HeapDumpOnOutOfMemoryError</code>.</strong> Free, and you will want both.</li>` +
        `<li><strong>Forgetting <code>ThreadLocal.remove()</code> on pooled threads.</strong> Leaks the value and pins the loader.</li>` +
        `<li><strong>Skipping verification.</strong> Confirm the fix with the same measurement that showed the problem.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Memory keeps growing in production. Walk me through it."</strong><br>A: First, which OOM or which metric — heap, Metaspace and native thread failures have different causes. Then <code>jstat -gcutil</code> to see whether the old generation stays near full after a full GC, and whether the trend is monotonic or a healthy sawtooth. If it is genuinely full, a heap dump from an instance out of rotation, analysed in Eclipse MAT: the dominator tree ranks by retained size and path-to-GC-roots names the holder. If the heap looks fine but the process is large, it is off-heap, and I use Native Memory Tracking.</p></blockquote>`,
        `<blockquote><p><strong>Q: "The service got slow. First step?"</strong><br>A: A thread dump, three of them a few seconds apart. That immediately distinguishes the three common cases: many threads <code>BLOCKED</code> on one monitor is lock contention, threads <code>RUNNABLE</code> in application code is CPU-bound work, and threads waiting in socket reads is a slow downstream dependency. It costs nothing and narrows the search enormously before I reach for a profiler.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What tools do you use?"</strong><br>A: Mostly what ships with the JDK. <code>jcmd</code> as the front end, <code>jstat</code> for live GC statistics, thread and heap dumps for the two dump-based investigations, Eclipse MAT for heap analysis, and Native Memory Tracking for off-heap. My default in production is JFR with JDK Mission Control — about 1% overhead and it records allocation by call site, lock contention, GC and hot methods, so the data already exists when something goes wrong.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What are the most common causes of a Java memory leak?"</strong><br>A: Unbounded static collections, since a static field is a GC root; <code>ThreadLocal</code>s never removed on pooled threads, which also pin the class loader and cause Metaspace leaks on redeploy; listeners and callbacks registered and never unregistered; and caches with no eviction policy. All of them are "still reachable, no longer useful", which is exactly what a garbage collector cannot help with.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Is taking a heap dump safe in production?"</strong><br>A: It works, but it pauses the JVM for the duration and writes a file the size of the live heap — minutes and many gigabytes on a large one. So I take it from an instance pulled out of the load balancer, or configure <code>-XX:+HeapDumpOnOutOfMemoryError</code> so one is captured automatically at the moment of failure, which is usually better evidence anyway.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you know the fix worked?"</strong><br>A: By re-running the same measurement that identified the problem, under comparable load, and confirming the metric changed — old-generation occupancy after full GC, pause times, the retained size of the suspect object. Skipping that step is how teams conclude a fix worked when traffic simply dropped.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Method: <strong>observe → capture → analyse → verify</strong>. Never raise <code>-Xmx</code> first.</li>` +
        `<li>Memory: which OOM → <code>jstat -gcutil</code> → monotonic or sawtooth? → <strong>heap dump + MAT</strong>.</li>` +
        `<li>Slow: <strong>three thread dumps</strong>. BLOCKED = contention · RUNNABLE = CPU · socket read = dependency.</li>` +
        `<li>MAT: <strong>dominator tree</strong> (retained size) + <strong>path to GC roots</strong> (who holds it).</li>` +
        `<li>Heap fine, process huge → <strong>Native Memory Tracking</strong>.</li>` +
        `<li><strong>JFR + Mission Control</strong> — ~1% overhead, run it continuously.</li>` +
        `<li>Leaks: static collections · <strong><code>ThreadLocal</code> without <code>remove()</code></strong> · unregistered listeners · unbounded caches.</li>` +
        `<li>Heap dumps <strong>pause the JVM</strong> — take the instance out of rotation.</li>` +
        `<li>Always ship with GC logs + <code>-XX:+HeapDumpOnOutOfMemoryError</code>.</li>` +
        `</ul>`,
      ].join('\n'),
    },
  ],
};
