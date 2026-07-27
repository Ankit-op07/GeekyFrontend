/**
 * Java Interview Kit — Chapter 1: Java Fundamentals.
 *
 * Pure data module (no runtime deps). Diagrams are referenced via
 * {{fig:filename.svg|ALT|CAPTION}} markers and resolved by seed-java-kit.js,
 * which INLINES the SVG from ./diagrams (see that script's header for why).
 *
 * This is the FREE PREVIEW chapter — the only one a non-buyer can read — so it
 * carries the heaviest visual load and sets the quality bar for the kit.
 *
 * Depth target: every topic ~1,800-2,200 words, accurate against Java 17 LTS
 * with Java 21 noted where it differs. Section order is fixed (PRD-009 §5).
 */
module.exports = {
  title: 'Java Fundamentals',
  slug: 'java-fundamentals',
  order: 0,
  topics: [
    // ────────────────────────────────────────────────────────────────
    // TOPIC 0 — JDK, JRE and JVM
    // ────────────────────────────────────────────────────────────────
    {
      title: 'JDK, JRE and JVM',
      slug: 'jdk-jre-jvm',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>This is the question that opens a startling number of Java interviews, and it is not really a warm-up. It is a filter. Almost every candidate can recite "JDK is for development, JRE is for running, JVM runs the bytecode" — that sentence is on the first page of every tutorial ever written. What separates a strong answer is understanding <em>what kind of thing</em> each of the three actually is: one is a specification, one is a bundle of libraries, one is a toolchain. Candidates who see them as three sizes of the same product get quietly marked down.</p>`,
        `<p>It matters practically too. "It compiles on my machine but the server says <code>UnsupportedClassVersionError</code>", "the Docker image is 400 MB and I only need to run a jar", "which JDK do I actually install — Oracle, Temurin, Corretto?" — every one of those is the same knowledge in working clothes. Getting this topic right makes the next thirteen chapters make sense, because everything from garbage collection to Spring's classpath scanning happens <em>inside</em> the boundary this topic draws.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Plainly: they are three nested things, each containing the one below it.</p>`,
        `<ul>` +
        `<li><strong>JVM</strong> — the machine that executes your compiled code. It is the innermost layer, and it is the reason Java is portable.</li>` +
        `<li><strong>JRE</strong> — the JVM <em>plus</em> the standard library your code calls (<code>java.lang</code>, <code>java.util</code>, and the rest). Enough to <em>run</em> a Java program, and nothing more.</li>` +
        `<li><strong>JDK</strong> — the JRE <em>plus</em> the tools that turn source code into something runnable: the compiler <code>javac</code>, the packager <code>jar</code>, the debugger <code>jdb</code>, and friends.</li>` +
        `</ul>`,
        `{{fig:ch1-jdk-jre-jvm.svg|Nested boxes showing the JDK containing development tools and the JRE which in turn contains the JVM and the core class libraries|Strict containment: the JDK is a superset of the JRE, which is a superset of the JVM. Install the JDK and you already have all three.}}`,
        `<p>More precisely — and this is the sentence that earns marks — <strong>the JVM is a <em>specification</em></strong>. Oracle publishes a document, the <em>Java Virtual Machine Specification</em>, that defines an abstract computing machine: its instruction set, its memory areas, the class file format it accepts. Anyone may implement it. HotSpot (the one you almost certainly run) is Oracle's implementation; Eclipse OpenJ9 is IBM's; there have been many others. When you say "the JVM", you are usually naming the spec but running one particular implementation of it.</p>`,
        `<h2>How it works</h2>`,
        `<p>Work outward from the middle.</p>`,
        `<p><strong>The JVM</strong> is handed a <code>.class</code> file full of bytecode and is responsible for four jobs: <em>loading</em> classes into memory, <em>verifying</em> that the bytecode is safe and well-formed, <em>executing</em> it, and <em>managing memory</em> — including garbage collection. It is a stack-based machine: its instructions push and pop from an operand stack rather than naming CPU registers, which is precisely what makes the same bytecode work on x86 and ARM without change. Chapter 9 opens this box up properly.</p>`,
        `<p><strong>The JRE</strong> adds what the JVM alone cannot supply: the class libraries. Your <code>String</code>, your <code>ArrayList</code>, your <code>HashMap</code> — none of that is built into the JVM instruction set. They are ordinary Java classes shipped with the runtime. The JRE is therefore "the JVM plus everything <code>java.*</code>", packaged so that a machine that will only ever <em>run</em> Java programs needs nothing else.</p>`,
        `<p><strong>The JDK</strong> adds the toolchain. The important members:</p>`,
        `<table><thead><tr><th>Tool</th><th>What it does</th></tr></thead><tbody>` +
        `<tr><td><code>javac</code></td><td>Compiles <code>.java</code> source into <code>.class</code> bytecode</td></tr>` +
        `<tr><td><code>java</code></td><td>Launches the JVM and runs a class or jar</td></tr>` +
        `<tr><td><code>jar</code></td><td>Packages many <code>.class</code> files into one archive</td></tr>` +
        `<tr><td><code>javadoc</code></td><td>Generates API documentation from comments</td></tr>` +
        `<tr><td><code>jdb</code></td><td>Command-line debugger</td></tr>` +
        `<tr><td><code>jshell</code></td><td>Interactive REPL (Java 9+) — excellent for testing a snippet</td></tr>` +
        `<tr><td><code>jlink</code></td><td>Builds a trimmed custom runtime containing only the modules you use (Java 9+)</td></tr>` +
        `<tr><td><code>jcmd</code>, <code>jstack</code>, <code>jmap</code></td><td>Diagnostics — thread dumps, heap dumps, live JVM inspection</td></tr>` +
        `</tbody></table>`,
        `<p>One modern wrinkle worth knowing, because it catches people out: <strong>since Java 11, Oracle no longer ships a standalone JRE download</strong>. The recommended way to produce a runtime-only distribution is now <code>jlink</code>, which assembles a custom image containing just the modules your application actually needs — often far smaller than the old JRE. So the JDK/JRE distinction is still conceptually exact, but "download the JRE" is dated advice. If an interviewer asks how you would ship a small runtime today, <code>jlink</code> is the answer they are hoping for.</p>`,
        `<p>The second thing people conflate is <strong>the JDK versus the vendor</strong>. OpenJDK is the open-source reference codebase. Oracle JDK, Eclipse Temurin, Amazon Corretto, Azul Zulu and Red Hat's build are all builds of essentially that same source, differing in licensing, support window and a few extras — not in the language. "Which JDK should we use?" is a licensing and support question, not a technical one, and saying so demonstrates real-world experience.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The distinction is easiest to <em>feel</em> on the command line. Compilation needs the JDK; execution needs only the runtime.</p>`,
        `<pre><code class="language-bash"># javac ships with the JDK. A runtime-only install does not have it.
javac Hello.java        # Hello.java  →  Hello.class   (source → bytecode)

# java is the JVM launcher — present in every runtime.
java Hello              # loads Hello.class and executes it

# Since Java 11 you can run a SINGLE source file directly. It is still
# compiled first — just in memory, with no .class file left on disk.
java Hello.java</code></pre>`,
        `<p>Ask the runtime what it is, which is the fastest way to diagnose a version mismatch on a server:</p>`,
        `<pre><code class="language-bash">java -version
# openjdk version "17.0.9" 2023-10-17
# OpenJDK Runtime Environment Temurin-17.0.9+9   ← the JRE layer
# OpenJDK 64-Bit Server VM Temurin-17.0.9+9      ← the JVM implementation

javac -version    # if this fails, you have a runtime, not a JDK
# javac 17.0.9</code></pre>`,
        `<p>A program can inspect its own runtime, which is occasionally useful in diagnostics endpoints:</p>`,
        `<pre><code class="language-java">public class RuntimeInfo {
    public static void main(String[] args) {
        System.out.println(System.getProperty("java.version"));      // 17.0.9
        System.out.println(System.getProperty("java.vm.name"));      // OpenJDK 64-Bit Server VM
        System.out.println(System.getProperty("java.vendor"));       // Eclipse Adoptium
        System.out.println(Runtime.version().feature());             // 17  (Java 9+ API)

        // The JVM's view of the machine and of its own memory budget.
        Runtime rt = Runtime.getRuntime();
        System.out.println(rt.availableProcessors() + " cores");
        System.out.println(rt.maxMemory() / 1024 / 1024 + " MB max heap");
    }
}</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p>The most common runtime error in this area is <code>UnsupportedClassVersionError</code>, and it is worth understanding rather than memorising, because it explains what "compatibility" means in Java.</p>`,
        `<p>Every <code>.class</code> file begins with the magic number <code>0xCAFEBABE</code> followed by a <strong>major version</strong> — 61 for Java 17, 65 for Java 21. A JVM refuses to load a class whose major version is higher than it supports. Java is therefore <strong>backward compatible but not forward compatible</strong>: a Java 17 runtime happily runs classes compiled for Java 8, but a Java 8 runtime cannot run classes compiled for 17. Compile with a newer JDK than your server runs and you get exactly that error, usually at the worst moment.</p>`,
        `<p>The fix is not "downgrade the JDK". It is <code>--release</code>, which compiles against the older platform's API as well as emitting the older class format:</p>`,
        `<pre><code class="language-bash"># Right: compiles for 11 AND checks you used no API newer than 11.
javac --release 11 Hello.java

# Historic and subtly broken: emits v11 bytecode but still compiles
# against the CURRENT JDK's libraries, so a Java 17-only method call
# compiles fine and then throws NoSuchMethodError at run time on Java 11.
javac -source 11 -target 11 Hello.java</code></pre>`,
        `<p>The other mechanism worth naming is <strong>bytecode verification</strong>. Before executing a loaded class, the JVM proves properties about it: the operand stack never underflows, every local variable is read with the type it was written with, control flow never jumps outside the method. This is a genuine security boundary — it is what historically allowed a browser to run untrusted applets — and it is why you cannot hand-craft a malicious <code>.class</code> file that reads arbitrary memory. Verification is also why a corrupt jar fails loudly at load time rather than corrupting the heap silently.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>"The JDK is a bigger JVM."</strong> They are different kinds of thing. The JVM is a specification (and its implementations); the JDK is a distribution of software you install.</li>` +
        `<li><strong>Installing a JRE and wondering why <code>javac</code> is missing.</strong> Compilation lives only in the JDK. On any dev machine, install the JDK.</li>` +
        `<li><strong>Thinking every JVM is HotSpot.</strong> HotSpot is the common implementation, not the definition. OpenJ9 has genuinely different GC and startup characteristics.</li>` +
        `<li><strong>Confusing JDK <em>version</em> with JDK <em>vendor</em>.</strong> "Java 17" is a version; Temurin and Corretto are vendors of it.</li>` +
        `<li><strong>Using <code>-source</code>/<code>-target</code> instead of <code>--release</code>.</strong> The former lets you compile calls to APIs that do not exist on the target runtime — a failure that survives compilation and appears in production.</li>` +
        `<li><strong>Saying the JRE is deprecated.</strong> The standalone Oracle <em>download</em> is gone; the runtime layer is not. Say "you build one with <code>jlink</code> now" and you sound current instead of confused.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is the difference between JDK, JRE and JVM?"</strong><br>A: They are nested. The JVM is the abstract machine that loads, verifies and executes bytecode and manages memory — it is a specification, with implementations like HotSpot and OpenJ9. The JRE is the JVM plus the standard class libraries: enough to run a Java program. The JDK is the JRE plus the development toolchain — <code>javac</code>, <code>jar</code>, <code>javadoc</code>, <code>jshell</code>, diagnostics. You compile with a JDK; you can run with just a runtime.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Is the JVM part of the JDK, or separate software?"</strong><br>A: Part of it, by containment — installing a JDK gives you a JVM. But the JVM is defined by a public specification, so it is not <em>owned</em> by any one JDK: several vendors implement it, and that is exactly why the same bytecode runs everywhere.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Can I run Java without a JDK?"</strong><br>A: Yes — you need a runtime, not a compiler. Historically that was a JRE download; since Java 11 the modern route is a custom image built with <code>jlink</code>, or a vendor's runtime-only distribution. What you cannot do is <em>compile</em> without a JDK.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why does Java need a virtual machine at all?"</strong><br>A: It is what buys portability and safety. Compiling to bytecode rather than native code means one artefact runs on any platform with a conforming JVM. And because a JVM sits between the code and the hardware, it can verify bytecode before running it, manage memory automatically, and optimise at run time using information a static compiler never has — like which branch is actually hot.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is <code>UnsupportedClassVersionError</code> and how do you fix it?"</strong><br>A: The class file's major version is newer than the running JVM supports — compiled on a newer JDK than the server runs. Fix it by compiling with <code>--release &lt;target&gt;</code>, which emits the older class format <em>and</em> restricts you to that release's API. Avoid the old <code>-source</code>/<code>-target</code> pair, which lets newer API calls slip through and fail at run time with <code>NoSuchMethodError</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Which JDK distribution would you choose for a production service?"</strong><br>A: That is a support and licensing decision, not a language one. Eclipse Temurin or Amazon Corretto are common free, long-supported builds of OpenJDK; Oracle JDK matters when a client requires Oracle support. What I would insist on is pinning an LTS version — 17 or 21 — and using the same build in CI and production so class-version and GC behaviour match.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Is Java platform independent? Fully?"</strong><br>A: The <em>bytecode</em> is platform independent; the JVM is not, and cannot be — it is a native binary compiled for each OS and architecture. The usual phrasing is that Java is platform independent but the JVM is platform dependent. And "write once, run anywhere" holds for the language and libraries, not for anything you do outside them: native code via JNI, file path separators or OS-specific commands break it just fine.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><strong>JVM ⊂ JRE ⊂ JDK</strong> — strict containment. Install the JDK, get all three.</li>` +
        `<li><strong>JVM</strong> = specification + implementations (HotSpot, OpenJ9). Loads, verifies, executes, manages memory.</li>` +
        `<li><strong>JRE</strong> = JVM + core class libraries. Run only.</li>` +
        `<li><strong>JDK</strong> = JRE + <code>javac</code>, <code>jar</code>, <code>javadoc</code>, <code>jdb</code>, <code>jshell</code>, <code>jlink</code>, diagnostics.</li>` +
        `<li>No standalone Oracle JRE since <strong>Java 11</strong> — build runtimes with <code>jlink</code>.</li>` +
        `<li>Bytecode is portable; <strong>the JVM is platform-specific</strong> by necessity.</li>` +
        `<li><strong>Backward compatible, not forward</strong>: newer JVM runs older classes, never the reverse → <code>UnsupportedClassVersionError</code>.</li>` +
        `<li>Cross-compile with <code>--release</code>, never <code>-source</code>/<code>-target</code>.</li>` +
        `<li>Version (17, 21) ≠ vendor (Temurin, Corretto, Oracle).</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // TOPIC 1 — How Java runs: compilation, bytecode and the JIT
    // ────────────────────────────────────────────────────────────────
    {
      title: 'How Java Runs: Compilation, Bytecode and the JIT',
      slug: 'how-java-runs',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>"Is Java compiled or interpreted?" is asked constantly, and the confident one-word answers are both wrong. Java is compiled <em>and</em> interpreted <em>and</em> compiled again — and the reason it works that way is the single most interesting engineering decision in the platform. Understanding it explains a long list of things that otherwise look like folklore: why a Java service is slow for its first thirty seconds and fast afterwards, why benchmarks need warm-up, why the same code can be faster than equivalent C++ in a long-running server and slower in a command-line script.</p>`,
        `<p>It also underpins every performance conversation you will have. When Chapter 9 discusses tiered compilation and Chapter 8 discusses why a <code>volatile</code> read cannot be optimised away, both are talking about the machinery introduced here.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Java takes a middle path between the two classic models. A traditional compiled language (C) turns source into native machine code once, ahead of time — fast, but the binary only runs on the platform it was built for. A traditional interpreted language (classic Python) reads and executes source line by line every run — portable, but slow.</p>`,
        `<p>Java splits the difference in two steps:</p>`,
        `<ol>` +
        `<li><strong>Ahead of time, <code>javac</code> compiles your source into <em>bytecode</em></strong> — instructions for the abstract JVM, not for any real CPU. This step does the type checking and most of the syntactic heavy lifting, once.</li>` +
        `<li><strong>At run time, the JVM interprets that bytecode</strong> — and watches. Methods and loops that run often are handed to the <strong>JIT (Just-In-Time) compiler</strong>, which compiles them into real native machine code, which then runs directly on the CPU.</li>` +
        `</ol>`,
        `{{fig:ch1-compilation-pipeline.svg|Pipeline showing Main.java compiled by javac into Main.class bytecode then loaded by the JVM which interprets it and JIT-compiles hot methods to native code|Two compilations, not one. javac makes portable bytecode ahead of time; the JIT makes native code at run time, for the methods that actually matter.}}`,
        `<p>So the honest answer to the interview question is: <strong>both</strong>. Compiled to bytecode ahead of time, then interpreted and selectively compiled to native code at run time.</p>`,
        `<p>Splitting it this way is also what buys portability. Because step 1 targets the abstract JVM rather than a real CPU, the artefact it produces is the same everywhere; only step 2 has to know what machine it is on.</p>`,
        `{{fig:ch1-wora.svg|One Main.class file feeding three different platform-specific JVMs for Windows Linux and macOS|"Write once, run anywhere" is not magic — it is a specification. The bytecode is identical everywhere; the JVM that consumes it is a different native binary on every platform.}}`,
        `<h2>How it works</h2>`,
        `<p><strong>Step 1 — <code>javac</code>.</strong> The compiler parses your source, checks types, resolves names, applies syntactic sugar (generics erasure, autoboxing, enhanced <code>for</code> loops, lambda desugaring) and emits one <code>.class</code> file per class or nested class. Notably, <code>javac</code> optimises very little. It is not trying to be clever — it deliberately leaves optimisation to the JIT, which will know things <code>javac</code> cannot possibly know, like which branch is taken 99% of the time in production.</p>`,
        `<p><strong>Step 2 — class loading.</strong> When you run <code>java Hello</code>, the JVM starts, and the class loader finds <code>Hello.class</code>, loads it, links it (verify, prepare, resolve) and initialises it. Chapter 9 covers this in detail; for now the point is that loading is <em>lazy</em> — a class is loaded the first time it is actually needed, not up front.</p>`,
        `<p><strong>Step 3 — interpretation.</strong> The JVM begins executing bytecode with an interpreter. Starting this way is a deliberate choice: interpretation begins <em>instantly</em>, whereas compiling everything to native code first would delay startup enormously for code that may run once.</p>`,
        `<p><strong>Step 4 — profiling and JIT compilation.</strong> While interpreting, the JVM counts. How many times has this method been invoked? How many times has this loop iterated? Once a counter crosses a threshold the method is deemed <em>hot</em> and queued for compilation on a background thread. HotSpot uses <strong>tiered compilation</strong>: a fast, lightly-optimising compiler (<strong>C1</strong>) kicks in early to get code running natively soon, while a slower, aggressively-optimising compiler (<strong>C2</strong>) recompiles the hottest methods later with far better output. Compilation happens on background threads, so the application keeps running while it waits.</p>`,
        `<p>What makes the JIT genuinely powerful is that it optimises using <em>runtime facts</em> that no ahead-of-time compiler can have:</p>`,
        `<table><thead><tr><th>Optimisation</th><th>What it does</th></tr></thead><tbody>` +
        `<tr><td>Inlining</td><td>Replaces a call to a small hot method with its body — the single highest-value optimisation, because it exposes everything else</td></tr>` +
        `<tr><td>Monomorphic dispatch</td><td>Observes that a virtual call site has only ever seen one implementing class, and compiles a direct call with a cheap guard</td></tr>` +
        `<tr><td>Dead code elimination</td><td>Removes branches that profiling shows are never taken</td></tr>` +
        `<tr><td>Loop unrolling / hoisting</td><td>Reduces per-iteration overhead; lifts invariant work out of loops</td></tr>` +
        `<tr><td>Escape analysis</td><td>Proves an object never leaves a method, then removes the allocation entirely (scalar replacement)</td></tr>` +
        `</tbody></table>`,
        `<p>Because these decisions rest on observed behaviour, they can turn out to be wrong — a call site that saw one class for a million calls suddenly sees a second. The JVM handles this with <strong>deoptimisation</strong>: the compiled code contains guards, and when a guard fails, execution falls back to the interpreter and the method is recompiled with the new information. This is why Java can perform speculative optimisations that a static compiler would never dare attempt.</p>`,
        `<h2>Code examples</h2>`,
        `<p>Bytecode is not a mystery; you can read it. <code>javap</code> ships with the JDK.</p>`,
        `<pre><code class="language-java">public class Add {
    public static int sum(int a, int b) {
        return a + b;
    }
}</code></pre>`,
        `<pre><code class="language-bash">javac Add.java
javap -c Add.class</code></pre>`,
        `<pre><code class="language-text">public static int sum(int, int);
  Code:
     0: iload_0        // push local variable 0 (a) onto the operand stack
     1: iload_1        // push local variable 1 (b)
     2: iadd           // pop two ints, add, push the result
     3: ireturn        // pop the int and return it</code></pre>`,
        `<p>Notice there are no registers — only pushes and pops against an operand stack. That is what makes bytecode portable: it assumes nothing about the CPU it will eventually run on.</p>`,
        `<p>You can also watch the JIT work. This prints every method as it is compiled:</p>`,
        `<pre><code class="language-bash"># Which methods got compiled, at which tier, and when.
java -XX:+PrintCompilation Main

# Disable the JIT entirely — everything stays interpreted. A dramatic way to
# see how much of Java's speed comes from the JIT rather than from javac.
java -Xint Main

# Force everything through the fast-but-shallow C1 compiler only.
java -XX:TieredStopAtLevel=1 Main   # what Spring Boot devtools uses for quick restarts</code></pre>`,
        `<p>The warm-up effect is easy to observe, and explains why naive benchmarks lie:</p>`,
        `<pre><code class="language-java">public class Warmup {
    static long work() {
        long total = 0;
        for (int i = 0; i &lt; 10_000_000; i++) total += i % 7;
        return total;
    }

    public static void main(String[] args) {
        for (int run = 1; run &lt;= 5; run++) {
            long start = System.nanoTime();
            work();
            System.out.printf("run %d: %d ms%n", run, (System.nanoTime() - start) / 1_000_000);
        }
    }
}
// Typical shape: run 1 is several times slower than run 5. Nothing changed in
// the code — the JIT compiled work() to native somewhere around run 2.
// This is exactly why real measurement uses JMH, which warms up first.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p>Two nuances separate a good answer from a great one.</p>`,
        `<p><strong>AOT compilation exists too.</strong> The interpret-then-JIT model is optimised for long-running server processes, where a few seconds of warm-up buys hours of peak performance. It is a poor fit for short-lived processes — a CLI tool, or a serverless function that starts, handles one request and dies, never getting warm. <strong>GraalVM Native Image</strong> addresses this by compiling Java ahead of time into a standalone native executable: startup drops from hundreds of milliseconds to a few, and memory use falls sharply. The trade-offs are real — no JIT means no profile-guided peak performance, and reflection or dynamic proxies must be declared at build time, which is why frameworks needed explicit support (Spring Boot 3's AOT processing, Quarkus, Micronaut). Knowing when the JIT model is <em>wrong</em> is a genuinely senior signal.</p>`,
        `<p><strong>Escape analysis undermines a rule you were taught.</strong> "Objects always live on the heap" is the model, and it is what you should say. But if the JIT can prove an object never escapes its method — never stored in a field, never returned, never passed somewhere that keeps it — it may eliminate the allocation altogether and keep the fields in registers or on the stack. This is <em>scalar replacement</em>. It does not change how you write code, and you cannot rely on it, but it is why "allocation is expensive, avoid objects in loops" is much weaker advice on the JVM than it sounds.</p>`,
        `<p>One more practical note: <strong>the code cache</strong>. JIT-compiled native code lives in a fixed-size region of native memory. On very large applications it can fill, at which point the JVM logs a warning and stops compiling — and the application quietly degrades toward interpreted speed. It is an unusual production problem, but the sort that is impossible to diagnose without knowing the JIT exists.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Answering "compiled" or "interpreted" flatly.</strong> Both are wrong on their own. Say both, and explain the two stages.</li>` +
        `<li><strong>Thinking <code>javac</code> optimises heavily.</strong> It barely optimises at all — by design. The JIT does that work with better information.</li>` +
        `<li><strong>Benchmarking without warm-up.</strong> Timing the first iteration measures the interpreter, not your code. Use JMH.</li>` +
        `<li><strong>Believing bytecode is machine code.</strong> Bytecode targets the abstract JVM. Machine code targets a real CPU. The JIT is the bridge.</li>` +
        `<li><strong>Assuming the JIT compiles everything.</strong> It compiles what is <em>hot</em>. Cold code stays interpreted forever, and that is the correct behaviour.</li>` +
        `<li><strong>Expecting GraalVM Native Image to be strictly faster.</strong> It starts far faster and uses less memory, but peak throughput is often <em>lower</em> — there is no profile-guided JIT.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Is Java compiled or interpreted?"</strong><br>A: Both. <code>javac</code> compiles source to platform-independent bytecode ahead of time. At run time the JVM interprets that bytecode and profiles it, then the JIT compiles the hot methods to native machine code. So it is compiled twice, with an interpreter in between.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is the JIT compiler, and why is it worth the complexity?"</strong><br>A: It compiles frequently-executed bytecode to native code at run time. It is worth it because it optimises with information a static compiler cannot have — actual branch frequencies, actual receiver types at a call site. That enables aggressive inlining and speculative optimisations, guarded so that if the assumption breaks the JVM deoptimises back to the interpreter and recompiles.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why is my Java application slow for the first few seconds?"</strong><br>A: Warm-up. Classes are being loaded lazily, and the code is still interpreted while the JVM gathers profiling data. Once methods cross their compilation thresholds the JIT produces native code and throughput climbs. It is also why load tests must warm up before measuring, and why short-lived processes get none of the benefit.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is tiered compilation?"</strong><br>A: HotSpot's strategy of using two JIT compilers. C1 compiles early with light optimisation so code goes native quickly; C2 recompiles the hottest methods later with heavy optimisation. It gets you most of the responsiveness of C1 and most of the peak throughput of C2. <code>-XX:TieredStopAtLevel=1</code> restricts to C1, which is a common trick for fast developer restarts.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is deoptimisation?"</strong><br>A: The JIT makes speculative optimisations based on observed behaviour — for example, compiling a virtual call as a direct call because only one type has ever been seen. The compiled code keeps a guard. If the guard fails, the JVM discards that compiled version, resumes in the interpreter, and recompiles with the corrected profile. It is what makes speculation safe.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How would you make a Java service start faster?"</strong><br>A: Depends what dominates. If it is JIT warm-up and the process is short-lived, GraalVM Native Image is the structural answer — AOT-compile to a native binary, trading peak throughput for startup and memory. Short of that: <code>-XX:TieredStopAtLevel=1</code> to skip C2, class-data sharing (CDS) to cut class-loading cost, trimming the classpath, and deferring eager initialisation so less work happens before the first request.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What does <code>javap</code> tell you?"</strong><br>A: It disassembles a <code>.class</code> file. <code>javap -c</code> prints the bytecode, which is how you settle arguments about what the compiler actually generated — string concatenation in a loop, whether a lambda became an <code>invokedynamic</code>, where autoboxing was inserted. It is the fastest way to prove what the compiler did rather than guess.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><code>javac</code> → <strong>bytecode</strong> (portable, ahead of time). JVM → <strong>interpret + JIT</strong> → native.</li>` +
        `<li>Answer to "compiled or interpreted?" is <strong>both</strong>.</li>` +
        `<li>Bytecode is <strong>stack-based</strong>, no registers — that is what makes it portable. Read it with <code>javap -c</code>.</li>` +
        `<li><strong>Tiered compilation</strong>: C1 fast/shallow early, C2 slow/deep for the hottest code.</li>` +
        `<li>JIT wins come from <strong>runtime profile data</strong>: inlining, monomorphic dispatch, dead-code elimination, escape analysis.</li>` +
        `<li><strong>Deoptimisation</strong> = guard fails → back to interpreter → recompile. Makes speculation safe.</li>` +
        `<li><strong>Warm-up is real</strong> — benchmark with JMH, never with a stopwatch on run 1.</li>` +
        `<li><strong>GraalVM Native Image</strong> = AOT: fast start, low memory, lower peak throughput, reflection must be declared.</li>` +
        `<li><code>-Xint</code> disables the JIT; <code>-XX:+PrintCompilation</code> shows it working.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // TOPIC 2 — Primitives vs references
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Primitives vs References',
      slug: 'primitives-vs-references',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Java has exactly two kinds of value, and almost every confusing thing a beginner hits comes from not knowing which one they are holding. Why does <code>==</code> work on <code>int</code> but betray you on <code>String</code>? Why can a variable be <code>null</code> here but not there? Why does modifying an object inside a method change the caller's object, while assigning to it does not? All of it — including the whole of the next two topics — is downstream of this single distinction.</p>`,
        `<p>Interviewers use it as a depth probe precisely because it is easy to answer shallowly. "Primitives store values, objects store references" is table stakes. What they are listening for is whether you can predict behaviour you have not memorised.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A <strong>primitive</strong> variable holds the actual value, in its own slot. There are exactly eight primitive types, they are built into the language, and they are not objects.</p>`,
        `<p>A <strong>reference</strong> variable holds a handle that lets the JVM find an object elsewhere in memory. Everything that is not one of the eight primitives — every class, every array, every interface, every enum, every <code>String</code> — is a reference type.</p>`,
        `{{fig:ch1-primitive-vs-reference.svg|Side by side comparison showing int age holding the value 30 directly in a stack slot versus User u holding an arrow that points to a User object on the heap|The whole distinction in one picture: a primitive slot contains the value; a reference slot contains a way to reach the value.}}`,
        `<p>The eight primitives, with the numbers interviewers actually ask for:</p>`,
        `<table><thead><tr><th>Type</th><th>Size</th><th>Range / values</th><th>Default</th><th>Wrapper</th></tr></thead><tbody>` +
        `<tr><td><code>byte</code></td><td>8 bits</td><td>−128 … 127</td><td><code>0</code></td><td><code>Byte</code></td></tr>` +
        `<tr><td><code>short</code></td><td>16 bits</td><td>−32,768 … 32,767</td><td><code>0</code></td><td><code>Short</code></td></tr>` +
        `<tr><td><code>int</code></td><td>32 bits</td><td>≈ −2.1 bn … 2.1 bn</td><td><code>0</code></td><td><code>Integer</code></td></tr>` +
        `<tr><td><code>long</code></td><td>64 bits</td><td>≈ −9.2 × 10¹⁸ … 9.2 × 10¹⁸</td><td><code>0L</code></td><td><code>Long</code></td></tr>` +
        `<tr><td><code>float</code></td><td>32 bits</td><td>IEEE 754 single precision</td><td><code>0.0f</code></td><td><code>Float</code></td></tr>` +
        `<tr><td><code>double</code></td><td>64 bits</td><td>IEEE 754 double precision</td><td><code>0.0d</code></td><td><code>Double</code></td></tr>` +
        `<tr><td><code>char</code></td><td>16 bits</td><td><code>0</code> … <code>65,535</code> (unsigned UTF-16 unit)</td><td><code>'\\u0000'</code></td><td><code>Character</code></td></tr>` +
        `<tr><td><code>boolean</code></td><td>not specified</td><td><code>true</code> / <code>false</code></td><td><code>false</code></td><td><code>Boolean</code></td></tr>` +
        `</tbody></table>`,
        `<p>Two of those rows are interview bait. <strong><code>char</code> is unsigned</strong> — it is the only unsigned primitive in Java, holding a UTF-16 code unit. And <strong><code>boolean</code>'s size is deliberately unspecified</strong> by the JVM specification; in practice HotSpot uses a full byte in arrays and typically an int-sized slot elsewhere. Anyone who confidently says "a boolean is 1 bit" has learned it from a bad source.</p>`,
        `<h2>How it works</h2>`,
        `<p>The behavioural consequences are what actually matter, and they all follow mechanically from the picture above.</p>`,
        `<p><strong>Nullability.</strong> A reference can point at nothing — that is <code>null</code>. A primitive slot always contains a valid bit pattern, so it can never be <code>null</code>. <code>int x = null;</code> does not compile.</p>`,
        `<p><strong>Equality.</strong> <code>==</code> compares the contents of the two slots. For primitives that is the values, which is exactly what you want. For references it compares the <em>addresses</em> — so it asks "are these the same object?", not "do these objects mean the same thing?". That second question is what <code>equals()</code> is for, and it is the source of the single most common Java bug (Chapter 2 and Chapter 3 return to it repeatedly).</p>`,
        `<p><strong>Default values.</strong> <em>Fields</em> are initialised automatically — numeric primitives to zero, <code>boolean</code> to <code>false</code>, references to <code>null</code>. <em>Local variables</em> are not: the compiler requires definite assignment before use, so reading an uninitialised local is a compile error, not a garbage value. That difference trips people up constantly.</p>`,
        `<p><strong>Memory.</strong> A primitive local lives directly in the stack frame. A reference local lives in the stack frame, but the object it points at lives on the heap. A primitive <em>field</em> lives inside its object on the heap, alongside the object's other fields.</p>`,
        `<p><strong>Generics.</strong> Java generics only work over reference types. <code>List&lt;int&gt;</code> does not compile; you need <code>List&lt;Integer&gt;</code>. This is a direct consequence of type erasure (Chapter 5) and is the main reason the wrapper classes exist at all.</p>`,
        `<h2>Code examples</h2>`,
        `<p>Assignment behaves completely differently for each kind, and this is the whole topic in eight lines:</p>`,
        `<pre><code class="language-java">// Primitive: the VALUE is copied. Two independent slots.
int a = 10;
int b = a;      // b gets its own copy of 10
b = 20;
System.out.println(a);   // 10  — a never moved

// Reference: the ARROW is copied. One object, two names.
int[] x = {1, 2, 3};
int[] y = x;    // y gets a copy of the reference — NOT a copy of the array
y[0] = 99;
System.out.println(x[0]);  // 99  — same array, seen through two variables

y = new int[]{7, 8, 9};    // reassigning y just re-points y
System.out.println(x[0]);  // 99  — x still points at the original</code></pre>`,
        `<p>Equality, and the classic trap:</p>`,
        `<pre><code class="language-java">int p = 127, q = 127;
System.out.println(p == q);            // true — comparing numbers

String s1 = new String("hi");
String s2 = new String("hi");
System.out.println(s1 == s2);          // false — two distinct objects
System.out.println(s1.equals(s2));     // true  — same characters

// And the one that gets everyone (Chapter 3 explains the cache):
Integer i1 = 127, i2 = 127;
Integer i3 = 128, i4 = 128;
System.out.println(i1 == i2);          // true  — both from the Integer cache
System.out.println(i3 == i4);          // false — 128 is outside the cache
System.out.println(i3.equals(i4));     // true  — always use equals()</code></pre>`,
        `<p>Fields versus locals:</p>`,
        `<pre><code class="language-java">public class Defaults {
    int count;          // field   → 0
    boolean active;     // field   → false
    String name;        // field   → null

    void demo() {
        int local;
        // System.out.println(local);  // ✘ does not compile:
        //                                "variable local might not have been initialized"
        local = 5;
        System.out.println(local);     // ✔ 5
    }
}</code></pre>`,
        `<p>And the arithmetic edge that comes from fixed sizes:</p>`,
        `<pre><code class="language-java">int max = Integer.MAX_VALUE;      // 2_147_483_647
System.out.println(max + 1);      // -2147483648  — silently wraps around

// Java 8+ gives you the loud version when wrapping would be a bug:
try {
    Math.addExact(max, 1);
} catch (ArithmeticException e) {
    System.out.println(e.getMessage());   // "integer overflow"
}

// The classic long-overflow bug: the RIGHT-hand side is computed as int
// arithmetic and overflows BEFORE the widening to long ever happens.
long wrong = 1000 * 60 * 60 * 24 * 30;    // -1702967296  ✘
long right = 1000L * 60 * 60 * 24 * 30;   // 2592000000   ✔ one L fixes it</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Why keep primitives at all?</strong> Purity would say make everything an object, as Smalltalk and Ruby do. Java kept primitives for performance, and the gap is not small. An <code>int[]</code> of a million elements is a single contiguous four-megabyte block. An <code>Integer[]</code> of a million elements is a million pointers <em>plus</em> a million separate heap objects, each carrying a 12–16 byte header — roughly four to five times the memory, spread across the heap so that every access risks a cache miss, and every element is extra work for the garbage collector. For numeric work the difference is order-of-magnitude, not marginal.</p>`,
        `<p><strong>What is a reference, physically?</strong> The specification deliberately does not say — it is a "handle", and implementations vary. In practice HotSpot uses a direct pointer. On 64-bit JVMs with heaps under about 32 GB it applies <strong>compressed oops</strong>, storing 32-bit offsets instead of 64-bit addresses to halve reference size and improve cache behaviour. This is also why heap sizing has a cliff: raising <code>-Xmx</code> from 31 GB to 33 GB can <em>reduce</em> the number of objects you can hold, because compressed oops switch off and every reference doubles in width. It is a great piece of trivia to have ready, because it sounds like a paradox and has a crisp explanation.</p>`,
        `<p><strong>Where this is going.</strong> The primitive/reference split is a known wart — it is why we have both <code>int</code> and <code>Integer</code>, why generics cannot hold primitives, and why <code>IntStream</code> exists separately from <code>Stream&lt;Integer&gt;</code>. <strong>Project Valhalla</strong> is the long-running OpenJDK effort to heal it with value classes that behave like objects but are laid out flat like primitives ("codes like a class, works like an int"). It is not in a release yet. Mentioning it signals that you follow the platform, as long as you are clear it is not something you can use today.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Using <code>==</code> on wrappers or strings.</strong> It compares identity. Use <code>equals()</code> — and let the <code>Integer</code> cache stop surprising you by never relying on <code>==</code> in the first place.</li>` +
        `<li><strong>Thinking <code>String</code> is a primitive.</strong> It is a class. It feels primitive because of literals and immutability, but it is a reference type and can be <code>null</code>.</li>` +
        `<li><strong>Expecting locals to default to zero.</strong> Fields do; locals must be definitely assigned or it will not compile.</li>` +
        `<li><strong>Unboxing a <code>null</code> wrapper.</strong> <code>Integer x = map.get("missing"); int y = x;</code> throws <code>NullPointerException</code> — the unboxing call happens on <code>null</code>. Extremely common in production.</li>` +
        `<li><strong>Overflowing an <code>int</code> before widening.</strong> Write the <code>L</code> suffix on the first operand, not on the variable's type.</li>` +
        `<li><strong>Using <code>float</code>/<code>double</code> for money.</strong> Binary floating point cannot represent 0.1 exactly; <code>0.1 + 0.2 != 0.3</code>. Use <code>BigDecimal</code>, constructed from a <code>String</code>.</li>` +
        `<li><strong>Boxing in hot numeric loops.</strong> <code>Long sum = 0L;</code> inside a million-iteration loop allocates a million <code>Long</code> objects. Declare it <code>long</code>.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is the difference between a primitive and a reference type?"</strong><br>A: A primitive variable holds the value itself in its own slot; there are exactly eight, they cannot be <code>null</code>, and <code>==</code> compares their values. A reference variable holds a handle to an object that lives on the heap; it can be <code>null</code>, and <code>==</code> compares identity rather than contents, which is why value comparison needs <code>equals()</code>. Everything that is not one of the eight primitives is a reference type.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How many primitive types are there, and what are their sizes?"</strong><br>A: Eight. <code>byte</code> 8 bits, <code>short</code> 16, <code>int</code> 32, <code>long</code> 64, <code>float</code> 32, <code>double</code> 64, <code>char</code> 16 — and <code>boolean</code>, whose size the JVM spec deliberately leaves unspecified. Worth adding: <code>char</code> is the only unsigned type in Java.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why does Java have primitives when everything else is an object?"</strong><br>A: Performance and memory. A million <code>int</code>s is one contiguous 4 MB array; a million <code>Integer</code>s is a million pointers plus a million heap objects with headers — several times the memory, worse cache locality, and far more GC pressure. Project Valhalla is the long-term effort to give us object-like value types with primitive-like layout, but it has not shipped.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Is <code>String</code> a primitive?"</strong><br>A: No. It is a final class in <code>java.lang</code>. It has literal syntax and is immutable, which makes it <em>feel</em> primitive, but it is a reference type — it can be <code>null</code>, and comparing two strings with <code>==</code> compares identity, not characters.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is autoboxing, and where does it bite?"</strong><br>A: Automatic conversion between a primitive and its wrapper — <code>Integer x = 5;</code> compiles to <code>Integer.valueOf(5)</code>. Two places it bites. First, unboxing a <code>null</code> wrapper throws <code>NullPointerException</code> at a line that looks like a plain assignment. Second, boxing in a hot loop allocates an object per iteration, which is a silent performance problem. Chapter 3 covers the <code>Integer</code> cache that makes <code>==</code> behave inconsistently on top of it.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What do uninitialised variables contain?"</strong><br>A: Depends where they live. Fields get default values automatically — <code>0</code>, <code>false</code>, <code>null</code>. Local variables get nothing: the compiler enforces definite assignment, so reading one before assigning is a compile error. Java never gives you the uninitialised-garbage behaviour C does.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why is <code>0.1 + 0.2 != 0.3</code>?"</strong><br>A: <code>float</code> and <code>double</code> are binary IEEE 754. One tenth has no exact finite binary representation, exactly as one third has none in decimal, so the stored value is slightly off and the errors accumulate. For anything where exactness is required — money above all — use <code>BigDecimal</code>, and construct it from a <code>String</code>, because <code>new BigDecimal(0.1)</code> just captures the same inexact double.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><strong>8 primitives</strong>: <code>byte short int long float double char boolean</code>. Everything else is a reference type.</li>` +
        `<li>Primitive slot = <strong>the value</strong>. Reference slot = <strong>a handle to a heap object</strong>.</li>` +
        `<li>Primitives are <strong>never null</strong>; references can be.</li>` +
        `<li><code>==</code> on references = <strong>identity</strong>. Use <code>equals()</code> for value.</li>` +
        `<li><strong>Fields</strong> default to 0/false/null. <strong>Locals</strong> must be definitely assigned — else compile error.</li>` +
        `<li><code>char</code> is <strong>unsigned</strong>, 16-bit UTF-16. <code>boolean</code> size is <strong>unspecified</strong>.</li>` +
        `<li>Generics need reference types → <code>List&lt;Integer&gt;</code>, never <code>List&lt;int&gt;</code>.</li>` +
        `<li>Unboxing <code>null</code> → <strong>NPE</strong>. Boxing in loops → allocation storm.</li>` +
        `<li><code>1000L * 60 * 60 * 24 * 30</code> — put the <code>L</code> on the <strong>operand</strong>, not just the variable.</li>` +
        `<li>Money → <strong><code>BigDecimal</code> from a String</strong>, never <code>double</code>.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // TOPIC 3 — Stack vs heap
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Stack vs Heap: How Java Organises Memory',
      slug: 'stack-vs-heap',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Ask any Java interviewer for their favourite diagnostic question and "stack versus heap" will be near the top, because the answer predicts so much else. A candidate who holds this model correctly can reason about why one thread cannot corrupt another's locals, why a recursive method blows up with a different error than a memory leak does, what a thread dump is showing them, and why <code>-Xmx</code> and <code>-Xss</code> are separate knobs. A candidate who does not is reduced to memorising each of those facts separately.</p>`,
        `<p>It is also the model you will actually use in production. Every <code>OutOfMemoryError</code> and <code>StackOverflowError</code> you ever debug starts with knowing which region ran out and why.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>The JVM divides memory into regions with very different rules. Two matter most:</p>`,
        `<ul>` +
        `<li>The <strong>stack</strong> is per-thread and private. Each thread gets its own, and it holds one <em>frame</em> per method call in progress: that method's local variables, its parameters, and where to return to. Frames are pushed on call and popped on return, strictly last-in-first-out. Memory management is therefore free — returning from a method reclaims its frame instantly, with no garbage collector involved.</li>` +
        `<li>The <strong>heap</strong> is shared by every thread and holds <em>every object</em>. It is not ordered, objects live as long as something still references them, and reclaiming them is the garbage collector's job.</li>` +
        `</ul>`,
        `{{fig:ch1-stack-vs-heap.svg|Two thread stacks with method frames on the left pointing via arrows to shared objects in the heap on the right plus a metaspace region|Stacks are private and orderly; the heap is shared and unordered. The arrows are the whole point — a local variable is a reference in a frame, and several frames across several threads can point at one object.}}`,
        `<p>A third region completes the picture: <strong>Metaspace</strong>, which holds class metadata — the loaded classes themselves, their method bytecode, and their static fields. It lives in <em>native</em> memory, outside the heap, and since Java 8 it replaced the old fixed-size PermGen. That change is why <code>java.lang.OutOfMemoryError: PermGen space</code> is a message you will only see in legacy systems.</p>`,
        `<h2>How it works</h2>`,
        `<p><strong>The stack, precisely.</strong> Each thread receives its own stack when it starts, with a size fixed by <code>-Xss</code> (commonly around 512 KB to 1 MB). Every method invocation pushes a frame holding the local variable array, the operand stack the bytecode manipulates, and a reference to the constant pool. When the method returns, the frame pops and everything in it disappears. Because the stack is private to one thread, <strong>locals are automatically thread-safe</strong> — no other thread can even name them. That is a fact worth carrying into Chapter 8, where it becomes the cheapest concurrency strategy there is.</p>`,
        `<p><strong>The heap, precisely.</strong> Every object created with <code>new</code> — and every array, and every boxed value — is allocated here. Its size is bounded by <code>-Xms</code> (initial) and <code>-Xmx</code> (maximum). Objects survive as long as they are <em>reachable</em> from a GC root; when they are not, they become eligible for collection. The heap is further divided into generations (young, old) because most objects die young — Chapter 9 covers why that observation shapes the entire GC design.</p>`,
        `<p><strong>What lives where</strong> is the part people get wrong, so be precise:</p>`,
        `<table><thead><tr><th>Thing</th><th>Lives in</th></tr></thead><tbody>` +
        `<tr><td>A primitive <em>local</em> variable (<code>int i</code> in a method)</td><td>Stack — inside the frame</td></tr>` +
        `<tr><td>A reference <em>local</em> variable (<code>User u</code> in a method)</td><td>Stack — the reference. The object is on the heap.</td></tr>` +
        `<tr><td>A primitive <em>field</em> (<code>int age</code> in a class)</td><td>Heap — inside the object</td></tr>` +
        `<tr><td>Any object, any array</td><td>Heap</td></tr>` +
        `<tr><td><code>static</code> fields</td><td>Metaspace (the objects they point at are on the heap)</td></tr>` +
        `<tr><td>Class metadata, method bytecode</td><td>Metaspace</td></tr>` +
        `<tr><td>The string pool</td><td>Heap (moved out of PermGen in Java 7)</td></tr>` +
        `</tbody></table>`,
        `<p>The row people miss is the third: a primitive field is <em>not</em> on the stack. <code>int age</code> declared inside a class lives inside that object, on the heap, for the object's whole life. Only <em>locals</em> live on the stack. The rule is not "primitives on the stack, objects on the heap" — it is "<strong>locals on the stack, objects (and their fields) on the heap</strong>".</p>`,
        `<h2>Code examples</h2>`,
        `<p>Trace one method and say exactly where each piece lives:</p>`,
        `<pre><code class="language-java">public class Memory {
    static int counter = 0;              // METASPACE (static field)
    int instanceField = 7;               // HEAP — inside each Memory object

    public static void main(String[] args) {
        int localPrimitive = 42;         // STACK — main's frame
        Memory m = new Memory();         // reference on STACK, object on HEAP
        int[] numbers = new int[1000];   // reference on STACK, array on HEAP
        String s = "hello";              // reference on STACK, String in the HEAP pool

        m.doWork(localPrimitive);        // pushes a new frame
    }                                    // main returns → its frame pops

    void doWork(int input) {             // input: STACK — doWork's own frame
        int doubled = input * 2;         // STACK
        instanceField = doubled;         // writes into the HEAP object
    }                                    // frame pops; input and doubled vanish
}</code></pre>`,
        `<p>The two errors, and why they are genuinely different:</p>`,
        `<pre><code class="language-java">// StackOverflowError — the STACK ran out. Too many frames, usually
// runaway recursion. Nothing to do with how much heap you have.
static int depth(int n) {
    return depth(n + 1);        // no base case
}
// Exception in thread "main" java.lang.StackOverflowError

// OutOfMemoryError: Java heap space — the HEAP ran out. Too many live
// objects. Raising -Xss would not help by a single byte.
List&lt;byte[]&gt; leak = new ArrayList&lt;&gt;();
while (true) {
    leak.add(new byte[10 * 1024 * 1024]);   // 10 MB, and kept reachable
}
// Exception in thread "main" java.lang.OutOfMemoryError: Java heap space</code></pre>`,
        `<p>Stack privacy is what makes local state thread-safe for free:</p>`,
        `<pre><code class="language-java">public class Counting implements Runnable {
    public void run() {
        int local = 0;                 // one INDEPENDENT copy per thread
        for (int i = 0; i &lt; 1000; i++) local++;
        System.out.println(local);     // always 1000, from every thread
    }
}
// Each thread has its own stack, so each has its own "local" and its own "i".
// No synchronisation needed — the variables are physically unshareable.
// Change "local" to a shared field and you have a race condition (Chapter 8).</code></pre>`,
        `<p>The knobs, for completeness:</p>`,
        `<pre><code class="language-bash">java -Xms512m -Xmx2g -Xss1m Main
#      │        │       └─ stack size PER THREAD (more threads = more total)
#      │        └────────── max heap
#      └─────────────────── initial heap (set == -Xmx in servers to avoid resize pauses)

# Dump the heap automatically when it blows up — the single most useful
# production flag in this area.
java -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/var/log/app.hprof Main</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Allocation on the heap is faster than people assume.</strong> The intuitive model — search a free list for a gap big enough — is not what a modern JVM does. Generational collectors keep the young generation compacted, so allocation is usually a <em>pointer bump</em>: take the current top-of-space pointer, add the object's size, done. On top of that each thread gets a <strong>TLAB</strong> (Thread-Local Allocation Buffer), its own private slice of Eden, so the bump needs no synchronisation at all. Allocation is therefore a handful of instructions, and "object creation is expensive in Java" is folklore inherited from the 1990s.</p>`,
        `<p><strong>Stack size interacts with thread count.</strong> <code>-Xss</code> is per thread, so a server running 2,000 threads at 1 MB each has reserved 2 GB of stack — entirely outside the heap, and invisible to <code>-Xmx</code>. This is a classic cause of "the container is OOM-killed but the heap looks fine": the kernel counts stack memory, and your heap graph never showed it. It is also part of the motivation for virtual threads in Java 21 (Chapter 10), whose stacks live on the heap and grow on demand rather than reserving a fixed slab up front.</p>`,
        `<p><strong>The escape-analysis caveat, again.</strong> "All objects live on the heap" is the model to state, and it is right for reasoning about your program. Physically, the JIT may prove an object never escapes its method and eliminate the allocation entirely via scalar replacement. Say the rule first, then the nuance — in that order — and you sound precise rather than pedantic.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>"Primitives live on the stack."</strong> Only primitive <em>locals</em> do. A primitive field lives inside its object, on the heap.</li>` +
        `<li><strong>Confusing the two errors.</strong> <code>StackOverflowError</code> = too deep, tune <code>-Xss</code> or fix the recursion. <code>OutOfMemoryError: Java heap space</code> = too many live objects, tune <code>-Xmx</code> or fix the leak. Neither flag helps the other problem.</li>` +
        `<li><strong>Thinking a memory leak is impossible with a GC.</strong> The GC frees <em>unreachable</em> objects. An object you forgot to remove from a static <code>Map</code> is perfectly reachable, and will never be freed. That is a leak.</li>` +
        `<li><strong>Believing static fields are on the stack.</strong> They live in Metaspace, and outlive every method call.</li>` +
        `<li><strong>Sizing only the heap in a container.</strong> Stacks, Metaspace, code cache and direct buffers are all outside <code>-Xmx</code>. Container limits must account for them or the process gets killed.</li>` +
        `<li><strong>Reaching for <code>-Xss</code> to fix deep recursion.</strong> It buys a constant factor. If the recursion is unbounded, no stack size is enough — restructure it iteratively.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Explain stack versus heap in Java."</strong><br>A: The stack is per-thread and private; it holds a frame per in-progress method call containing that method's locals and parameters, pushed and popped LIFO, so memory is reclaimed automatically on return with no GC involvement. The heap is shared across all threads and holds every object; objects live while they remain reachable and are reclaimed by the garbage collector. A local reference variable sits on the stack, but the object it points at is on the heap.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Where does an <code>int</code> field live?"</strong><br>A: On the heap, inside the object that declares it. Only <em>local</em> variables live on the stack. The rule is locals-on-the-stack, objects-and-their-fields-on-the-heap — not primitives-versus-objects.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Difference between <code>StackOverflowError</code> and <code>OutOfMemoryError</code>?"</strong><br>A: Different regions. <code>StackOverflowError</code> means one thread pushed more frames than its stack can hold — almost always unbounded recursion. <code>OutOfMemoryError: Java heap space</code> means the heap cannot satisfy an allocation because too much is still reachable — either a genuine leak or an undersized heap. Both are <code>Error</code>s rather than exceptions, so you do not catch them in normal code.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why are local variables thread-safe?"</strong><br>A: Because each thread has its own stack. A local variable exists only inside one thread's frame, so no other thread can reach it — there is nothing to synchronise. The caveat is that the local is only safe if it is a primitive or a reference to an object no one else shares; if it points at a shared object, that object still needs protecting.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Where do static variables live?"</strong><br>A: In Metaspace, with the class metadata — native memory, outside the heap, since Java 8 replaced PermGen. If a static field holds a reference, the referenced object is still on the heap; the static field is a GC root, which is exactly why a static collection that is never cleared is such a reliable memory leak.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Can Java have a memory leak?"</strong><br>A: Yes. The GC collects unreachable objects, not useless ones. Objects added to a long-lived static collection and never removed, listeners never unregistered, <code>ThreadLocal</code>s never cleaned up in a pooled thread — all stay reachable, so all stay alive. That is a leak by any practical definition, and it is diagnosed with a heap dump rather than by reading code.</p></blockquote>`,
        `<blockquote><p><strong>Q: "You get an OOM in production. What do you do?"</strong><br>A: First read which OOM it is — heap space, Metaspace, GC overhead limit, and "unable to create native thread" have completely different causes. Assuming heap space: run with <code>-XX:+HeapDumpOnOutOfMemoryError</code> so I have a dump, then open it in Eclipse MAT and look at the dominator tree for what is retaining the most memory and which GC root holds it. That usually names the leak in minutes. Raising <code>-Xmx</code> is a stopgap that only buys time if the growth is unbounded.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><strong>Stack</strong> = per thread, private, frames, LIFO, auto-reclaimed. <code>-Xss</code>.</li>` +
        `<li><strong>Heap</strong> = shared, all objects, GC-managed. <code>-Xms</code> / <code>-Xmx</code>.</li>` +
        `<li><strong>Metaspace</strong> = class metadata + statics, native memory, replaced PermGen in Java 8.</li>` +
        `<li>Rule: <strong>locals on the stack; objects and their fields on the heap</strong>.</li>` +
        `<li>Local reference on the stack → object on the heap. The arrow crosses regions.</li>` +
        `<li><code>StackOverflowError</code> = too deep. <code>OutOfMemoryError</code> = too much live data. Different knobs.</li>` +
        `<li>Locals are <strong>thread-safe for free</strong> — nothing else can reach them.</li>` +
        `<li>Allocation is a <strong>pointer bump in a TLAB</strong>, not a free-list search. Cheap.</li>` +
        `<li>Leaks happen: reachable ≠ useful. Static maps, listeners, <code>ThreadLocal</code>s.</li>` +
        `<li>Container sizing must count stacks + Metaspace + code cache, all <strong>outside</strong> <code>-Xmx</code>.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // TOPIC 4 — Pass-by-value
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Pass-by-Value: Java\'s Most Misunderstood Rule',
      slug: 'pass-by-value',
      order: 4,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>This is the topic where confident candidates fail. Ask "is Java pass-by-value or pass-by-reference?" and a large fraction will answer "pass-by-value for primitives, pass-by-reference for objects" — which sounds sophisticated, is widely repeated, and is <strong>wrong</strong>. Java is pass-by-value. Always. Without exception. The confusion arises because when you pass an object, the value being copied is a <em>reference</em>, and that produces behaviour which superficially resembles pass-by-reference until you test the one case that distinguishes them.</p>`,
        `<p>Interviewers love it because the wrong answer is so common that getting it right is a genuine signal — and because the correct explanation requires the previous two topics to be solid. It matters in practice too: it is why you cannot write <code>swap(a, b)</code> in Java, and why a method that "clears" the list you passed it sometimes works and sometimes does nothing.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>The rule, stated once, exactly:</p>`,
        `<blockquote><p><strong>Java always passes arguments by value. When the argument is an object, the value copied is the reference — not the object.</strong></p></blockquote>`,
        `<p>Unpack that. Passing an <code>int</code> copies the number into the callee's frame; two independent slots exist. Passing a <code>User</code> copies the <em>arrow</em> into the callee's frame; two independent slots exist, and both happen to point at the same heap object.</p>`,
        `{{fig:ch1-pass-by-value-primitive.svg|A caller frame holding count equals 3 with an arrow to a callee frame holding a separate slot n equals 4 showing the caller is unaffected|Primitives: the callee gets its own copy of the number. Whatever it does to that copy dies with the frame.}}`,
        `<p>That shared object is where the illusion comes from. Because both arrows point at one object, <em>mutating</em> through either one is visible to both. But <em>reassigning</em> the callee's arrow only moves the callee's arrow. If Java were genuinely pass-by-reference, reassignment inside the method would change the caller's variable too — and it does not.</p>`,
        `{{fig:ch1-pass-by-value-object.svg|Top half shows caller and callee references both pointing at one object whose field was mutated; bottom half shows the callee reference re-pointed to a new object while the caller reference is unchanged|The decisive test. Mutation through the copied arrow is visible to the caller (top). Reassigning the copied arrow is not (bottom) — which is precisely what proves Java is not pass-by-reference.}}`,
        `<h2>How it works</h2>`,
        `<p>Mechanically it is simple once you picture stack frames. When a method is invoked, the JVM pushes a new frame and copies each argument's bits into that frame's local-variable slots. Copying <code>int 3</code> copies the number. Copying a reference copies the handle. In both cases the callee is working with <em>its own slot</em>, and assigning to that slot rebinds only the callee's name.</p>`,
        `<p>So there are exactly two behaviours to keep straight:</p>`,
        `<table><thead><tr><th>Inside the method you…</th><th>Caller sees the change?</th><th>Why</th></tr></thead><tbody>` +
        `<tr><td><code>p.setName("Bob")</code> — mutate the object</td><td><strong>Yes</strong></td><td>One object, reached through both arrows</td></tr>` +
        `<tr><td><code>p = new User("Bob")</code> — reassign the parameter</td><td><strong>No</strong></td><td>Only the callee's own slot was rebound</td></tr>` +
        `<tr><td><code>n = n + 1</code> on an <code>int</code></td><td><strong>No</strong></td><td>The callee's slot holds a copy of the number</td></tr>` +
        `<tr><td><code>arr[0] = 99</code> on an array</td><td><strong>Yes</strong></td><td>Arrays are objects; this mutates the shared array</td></tr>` +
        `<tr><td><code>s = s + "!"</code> on a <code>String</code></td><td><strong>No</strong></td><td><code>String</code> is immutable, so <code>+</code> creates a new object and rebinds the local slot</td></tr>` +
        `</tbody></table>`,
        `<p>The <code>String</code> row is the one that convinces people Java must be pass-by-value, because it is the most familiar case where "I changed it in the method and nothing happened".</p>`,
        `<h2>Code examples</h2>`,
        `<p>The two object cases, side by side — this is the whole topic:</p>`,
        `<pre><code class="language-java">class User {
    String name;
    User(String name) { this.name = name; }
}

public class PassByValue {

    // MUTATION — reaches through the copied arrow to the shared object.
    static void rename(User p) {
        p.name = "Bob";          // caller sees this
    }

    // REASSIGNMENT — rebinds only this frame's slot.
    static void replace(User p) {
        p = new User("Bob");     // caller sees NOTHING
        p.name = "Carol";        // and this touches only the new, doomed object
    }

    public static void main(String[] args) {
        User u = new User("Asha");

        rename(u);
        System.out.println(u.name);   // Bob    ← mutation was visible

        User v = new User("Asha");
        replace(v);
        System.out.println(v.name);   // Asha   ← reassignment was NOT visible
    }
}</code></pre>`,
        `<p>If Java were pass-by-reference, the second print would say <code>Carol</code>. It says <code>Asha</code>. That single line is the proof, and it is the fastest way to win the argument in an interview.</p>`,
        `<p>The famous consequence — you cannot write <code>swap</code>:</p>`,
        `<pre><code class="language-java">// Does nothing. Both parameters are copies; swapping them
// rearranges only this frame's two slots.
static void swap(int a, int b) {
    int t = a; a = b; b = t;
}

// Also does nothing to the caller's variables — same reason, one level up.
static void swap(User a, User b) {
    User t = a; a = b; b = t;
}

// The workarounds all amount to "return the result" or "mutate a shared
// container", because rebinding a caller's variable is simply not available.
static int[] swapped(int a, int b) { return new int[]{ b, a }; }</code></pre>`,
        `<p>Collections behave exactly as the rule predicts, and this catches people in real code:</p>`,
        `<pre><code class="language-java">static void addItem(List&lt;String&gt; list) {
    list.add("added");         // ✔ mutates the shared list — caller sees it
}

static void replaceList(List&lt;String&gt; list) {
    list = new ArrayList&lt;&gt;();  // ✘ rebinds the local slot only
    list.add("invisible");     // caller's list is untouched
}

static void clearList(List&lt;String&gt; list) {
    list.clear();              // ✔ mutation again — caller's list IS emptied
}

List&lt;String&gt; items = new ArrayList&lt;&gt;(List.of("one"));
addItem(items);      System.out.println(items);  // [one, added]
replaceList(items);  System.out.println(items);  // [one, added]  ← unchanged
clearList(items);    System.out.println(items);  // []</code></pre>`,
        `<p>And the <code>String</code> case, which surprises people precisely because it looks like mutation:</p>`,
        `<pre><code class="language-java">static void shout(String s) {
    s = s + "!";               // creates a NEW String, rebinds the local slot
}

static void shout(StringBuilder sb) {
    sb.append("!");            // MUTATES the shared object
}

String s = "hi";
shout(s);
System.out.println(s);         // hi   ← String is immutable; nothing changed

StringBuilder sb = new StringBuilder("hi");
shout(sb);
System.out.println(sb);        // hi!  ← mutable object, mutation visible</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>What would pass-by-reference actually look like?</strong> The cleanest way to be sure of the distinction is to see the other model. In C++ you can declare a reference parameter with <code>&amp;</code>, and then assignment inside the function rebinds the caller's variable:</p>`,
        `<pre><code class="language-cpp">// C++ — genuine pass-by-reference
void replace(User*&amp; p) {
    p = new User("Bob");   // the CALLER's pointer now points at the new object
}
// Java has no syntax for this. There is no way to make a method
// rebind a variable belonging to its caller.</code></pre>`,
        `<p>That absence is the point: pass-by-reference means the callee can rebind the caller's <em>variable</em>. Java offers no mechanism to do that, which is why the answer is unconditional.</p>`,
        `<p><strong>Why did Java choose this?</strong> It removes an entire class of surprise. When you call <code>process(order)</code>, you know your variable <code>order</code> will still point at the same object afterwards — the method cannot swap it out from under you. It can change the object's contents, but the binding is yours. This makes local reasoning far easier, and it is the same instinct behind <code>final</code> parameters and the general modern preference for immutability.</p>`,
        `<p><strong>The practical takeaway</strong> is a design one. If you do not want a method mutating what you hand it, do not rely on the calling convention to protect you — it will not. Pass an immutable object, or a defensive copy, or an unmodifiable view (<code>List.copyOf(list)</code>). Chapter 3's discussion of immutability and Chapter 10's records are both, in part, answers to this problem.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>"Objects are passed by reference."</strong> The single most common wrong answer in Java interviews. The <em>reference</em> is passed by value.</li>` +
        `<li><strong>Expecting a reassignment inside a method to be visible.</strong> It never is. If the method needs to give you a different object, it has to return it.</li>` +
        `<li><strong>Trying to write <code>swap</code>.</strong> It cannot work. Return a new value, or mutate a shared holder.</li>` +
        `<li><strong>Assuming <code>final</code> on a parameter changes anything for the caller.</strong> It only stops the callee rebinding its own slot — which the caller could not see anyway. It does not make the object immutable.</li>` +
        `<li><strong>Thinking <code>String</code> proves objects are copied.</strong> The <code>String</code> object is not copied; the reference is. Nothing changes because <code>String</code> is immutable, so <code>+</code> can only make a new one.</li>` +
        `<li><strong>Handing out an internal collection and assuming it is safe.</strong> The caller receives a reference to your live list and can clear it. Return an unmodifiable view or a copy.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Is Java pass-by-value or pass-by-reference?"</strong><br>A: Strictly pass-by-value, with no exceptions. For a primitive, the value copied is the number. For an object, the value copied is the reference — so the callee gets its own arrow pointing at the same heap object. That is why mutating the object inside the method is visible to the caller, but reassigning the parameter is not. Pass-by-reference would allow the callee to rebind the caller's variable, and Java has no way to express that.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Then why does modifying an object inside a method affect the caller?"</strong><br>A: Because both variables reference the same object. Copying the reference does not copy the object. Mutation goes through the arrow to the one shared object; the caller sees it because there is only one object. Nothing about that requires pass-by-reference.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Prove Java is not pass-by-reference."</strong><br>A: One method. Take <code>void replace(User p) { p = new User("Bob"); }</code>, call it with a <code>User</code> named "Asha", and print the caller's name afterwards. It still says "Asha". Under pass-by-reference the caller's variable would have been rebound to the new object. It was not, because the method only rebound its own copy of the arrow.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Can you write a <code>swap</code> method in Java?"</strong><br>A: Not one that swaps the caller's two variables — there is no way to rebind a caller's variable. The workarounds are to return the pair (an array, a record, a small holder), to swap elements inside a shared mutable container such as <code>Collections.swap(list, i, j)</code>, or to pass a mutable holder object and mutate its fields.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What happens if I pass a <code>String</code> and modify it inside the method?"</strong><br>A: Nothing observable to the caller. <code>String</code> is immutable, so <code>s = s + "!"</code> creates a new <code>String</code> and rebinds the method's own parameter slot. The caller's variable still points at the original. Use a <code>StringBuilder</code> if you genuinely need the callee to modify shared text — and then the mutation <em>is</em> visible, because <code>StringBuilder</code> is mutable.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Does making a parameter <code>final</code> protect the caller's object?"</strong><br>A: No. <code>final</code> on a parameter only prevents the method rebinding that parameter slot — something the caller could never observe anyway. The object stays fully mutable through it. If you want protection, pass an immutable type, a defensive copy, or an unmodifiable view.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you stop a method mutating the collection you pass it?"</strong><br>A: Do not depend on the calling convention — it gives you nothing. Pass <code>List.copyOf(list)</code> for an immutable snapshot, or <code>Collections.unmodifiableList(list)</code> for a read-only view (which still reflects later changes to the backing list, so a copy is safer). The same reasoning applies to returning internal state: hand back a copy or an unmodifiable view rather than the live collection.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><strong>Java is pass-by-value. Always.</strong> No exceptions, no "except for objects".</li>` +
        `<li>For objects, the <strong>reference</strong> is what gets copied — not the object.</li>` +
        `<li><strong>Mutate</strong> through the parameter → caller sees it. <strong>Reassign</strong> the parameter → caller does not.</li>` +
        `<li>The proof: <code>p = new User(...)</code> inside a method leaves the caller's variable untouched.</li>` +
        `<li><strong>No <code>swap</code></strong> is possible — return a value or mutate a shared container.</li>` +
        `<li><code>String</code> looks like a counter-example but is just immutability: <code>+</code> makes a new object.</li>` +
        `<li>Arrays and collections ARE objects — <code>arr[0] = 9</code> and <code>list.clear()</code> are visible to the caller.</li>` +
        `<li><code>final</code> parameter ≠ immutable object. It only blocks rebinding the local slot.</li>` +
        `<li>Want safety? <strong>Immutable type, defensive copy, or unmodifiable view.</strong></li>` +
        `</ul>`,
      ].join('\n'),
    },
  ],
};
