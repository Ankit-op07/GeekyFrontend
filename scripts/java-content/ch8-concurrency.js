/**
 * Java Interview Kit — Chapter 8: Multithreading and Concurrency.
 *
 * The largest chapter in the kit. Concurrency is the single biggest
 * differentiator between mid and senior Java interviews.
 *
 * NOTE: concurrent COLLECTIONS (ConcurrentHashMap, CopyOnWriteArrayList,
 * BlockingQueue) are covered in Chapter 4 alongside the rest of the
 * collections framework. The last topic here covers atomics and CAS, which
 * complements that rather than repeating it.
 *
 * ⚠️ Content strings are TEMPLATE LITERALS — never use a backtick inside them,
 * and always escape ${...} as \${...} or it will be interpolated.
 */
module.exports = {
  title: 'Multithreading & Concurrency',
  slug: 'concurrency',
  order: 7,
  topics: [
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Threads: Creation and Lifecycle',
      slug: 'thread-lifecycle',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>The lifecycle is the vocabulary for every other concurrency conversation. When you read a thread dump at 3am, every line is a thread state — and knowing that <code>BLOCKED</code> means "waiting for a monitor" while <code>WAITING</code> means "someone must wake me" tells you immediately whether you are looking at lock contention or a missing <code>notify</code>. Interviewers also use the <code>sleep</code>-versus-<code>wait</code> question as a quick filter, because the answer hinges on one fact that separates people who have read about threads from people who have debugged them.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A thread is an independent path of execution with its own stack (Chapter 1) sharing the heap with every other thread. <code>Thread.State</code> has exactly six values:</p>`,
        `{{fig:ch8-thread-lifecycle.svg|A state machine from NEW to RUNNABLE to TERMINATED with BLOCKED WAITING and TIMED_WAITING branching off RUNNABLE plus a panel of three facts|Note what is missing: there is no RUNNING state. RUNNABLE covers both actually executing and merely eligible to execute — the JVM does not distinguish, because that is the OS scheduler's business.}}`,
        `<h2>How it works</h2>`,
        `<p><strong>Two ways to define the work</strong>, and one is clearly better:</p>`,
        `<pre><code class="language-java">// ✘ Extending Thread — burns your single inheritance slot on plumbing,
//   and conflates "what to do" with "how to run it".
class Worker extends Thread {
    public void run() { doWork(); }
}
new Worker().start();

// ✔ Implementing Runnable — the task is separate from the execution
//   mechanism, so the same object can go to a thread pool instead.
class Task implements Runnable {
    public void run() { doWork(); }
}
new Thread(new Task()).start();

// ✔ In practice, a lambda and an executor:
executor.submit(() -&gt; doWork());</code></pre>`,
        `<p><strong><code>start()</code> versus <code>run()</code></strong> is the most-asked question here and has a crisp answer: <code>start()</code> asks the JVM to create a new OS thread which then calls <code>run()</code>. Calling <code>run()</code> directly is an ordinary method call on the current thread — no concurrency at all, and no error to tell you so.</p>`,
        `<p><strong><code>sleep()</code> versus <code>wait()</code></strong> is the other. Both pause a thread, and they differ in one decisive way: <strong><code>sleep()</code> keeps every lock it holds; <code>wait()</code> releases the monitor it was called on.</strong> That is why <code>wait()</code> must be called inside a <code>synchronized</code> block — it has to own the monitor in order to release it — and why sleeping while holding a lock is such an effective way to stall an application.</p>`,
        `<table><thead><tr><th></th><th><code>sleep(n)</code></th><th><code>wait()</code></th></tr></thead><tbody>` +
        `<tr><td>Declared on</td><td><code>Thread</code> (static)</td><td><code>Object</code></td></tr>` +
        `<tr><td>Releases the lock</td><td><strong>No</strong></td><td><strong>Yes</strong></td></tr>` +
        `<tr><td>Needs <code>synchronized</code></td><td>No</td><td><strong>Yes</strong> — else <code>IllegalMonitorStateException</code></td></tr>` +
        `<tr><td>Wakes on</td><td>Timeout</td><td><code>notify()</code>/<code>notifyAll()</code>, or timeout</td></tr>` +
        `<tr><td>State</td><td><code>TIMED_WAITING</code></td><td><code>WAITING</code> or <code>TIMED_WAITING</code></td></tr>` +
        `</tbody></table>`,
        `<h2>Code examples</h2>`,
        `<p>Cooperative cancellation — the only correct way to stop a thread:</p>`,
        `<pre><code class="language-java">class Worker implements Runnable {
    public void run() {
        // ✔ Check the interrupt flag; it is the standard cancellation signal.
        while (!Thread.currentThread().isInterrupted()) {
            try {
                doUnitOfWork();
                Thread.sleep(100);
            } catch (InterruptedException e) {
                // ⚠ Catching it CLEARS the flag. Restore it, or the loop
                //   condition above will never see the cancellation.
                Thread.currentThread().interrupt();
                break;
            }
        }
        cleanup();
    }
}

Thread t = new Thread(new Worker());
t.start();
t.interrupt();      // ✔ polite request — the thread decides how to stop
t.join();           // wait for it to finish

// t.stop() is DEPRECATED and removed. It killed a thread mid-operation,
// releasing its locks while shared state was half-updated — corruption
// with no way to detect it.</code></pre>`,
        `<p>Daemon threads, and the trap:</p>`,
        `<pre><code class="language-java">Thread t = new Thread(this::backgroundPoll);
t.setDaemon(true);          // must be set BEFORE start()
t.start();
// The JVM exits when only daemon threads remain — they do NOT keep it alive,
// and they get no chance to finish. Never use a daemon thread for work that
// must complete, such as flushing a buffer or committing a transaction.</code></pre>`,
        `<p>Reading a thread dump, which is what the states are actually for:</p>`,
        `<pre><code class="language-bash">jcmd &lt;pid&gt; Thread.print       # or jstack &lt;pid&gt;</code></pre>`,
        `<pre><code class="language-text">"http-nio-8080-exec-3" #34 waiting for monitor entry [0x00007f...]
   java.lang.Thread.State: BLOCKED (on object monitor)
        at com.app.Cache.get(Cache.java:42)
        - waiting to lock &lt;0x000000076b2f1234&gt; (a com.app.Cache)
        - locked &lt;0x000000076b2f9999&gt; (a com.app.Registry)

// BLOCKED + "waiting to lock" = lock contention. Many threads BLOCKED on
// the same monitor address is a bottleneck; two threads each holding what
// the other wants is a deadlock (later in this chapter).</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>A Java thread is an OS thread.</strong> HotSpot maps each <code>java.lang.Thread</code> one-to-one onto a native thread, which is why they are expensive: roughly 1 MB of reserved stack each (<code>-Xss</code>, Chapter 1) plus kernel bookkeeping, and every context switch goes through the scheduler. That cost is the entire reason thread pools exist, and the reason a server cannot simply run ten thousand threads.</p>`,
        `<p><strong>Virtual threads (Java 21)</strong> change this and are worth naming. A virtual thread is scheduled by the JVM onto a small pool of carrier threads, with its stack on the heap and grown on demand, so millions are feasible and blocking one is cheap. Crucially the API is unchanged — it is still <code>Thread</code>, still <code>Runnable</code> — so the whole "avoid blocking, go reactive" contortion becomes unnecessary for I/O-bound work. Chapter 10 covers it properly; here it is enough to know that the expensive-thread assumption behind pools is what it removes.</p>`,
        `<p><strong>Thread priorities are close to meaningless.</strong> <code>setPriority</code> is a hint the OS may ignore entirely, and behaviour differs across platforms. Any design that depends on priority for correctness is broken. The same applies to <code>Thread.yield()</code>, which is a suggestion with no guarantee.</p>`,
        `<p><strong>Uncaught exceptions kill only their own thread</strong>, silently by default — the stack trace goes to stderr and the application carries on with one fewer worker. Set an <code>UncaughtExceptionHandler</code>, or use an executor and inspect the returned <code>Future</code>, which captures the exception instead of losing it.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Calling <code>run()</code> instead of <code>start()</code>.</strong> No new thread, no error, no concurrency.</li>` +
        `<li><strong>Swallowing <code>InterruptedException</code>.</strong> Catching it clears the flag; restore it or rethrow, or cancellation stops working everywhere above you.</li>` +
        `<li><strong>Using <code>Thread.stop()</code>.</strong> Deprecated and removed — it corrupted state by design.</li>` +
        `<li><strong>Extending <code>Thread</code>.</strong> Wastes the inheritance slot and couples the task to its execution.</li>` +
        `<li><strong><code>sleep()</code> while holding a lock.</strong> Every other thread waits for the whole duration.</li>` +
        `<li><strong>Calling <code>wait()</code> outside <code>synchronized</code>.</strong> <code>IllegalMonitorStateException</code>.</li>` +
        `<li><strong>Restarting a terminated thread.</strong> <code>IllegalThreadStateException</code> — threads are single-use.</li>` +
        `<li><strong>Relying on priorities.</strong> A hint the OS is free to ignore.</li>` +
        `<li><strong>Creating threads per request.</strong> Roughly 1 MB each — use a pool, or virtual threads.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Difference between <code>start()</code> and <code>run()</code>?"</strong><br>A: <code>start()</code> asks the JVM to create a new OS thread, which then invokes <code>run()</code>. Calling <code>run()</code> yourself is a plain method call on the current thread — the code executes, but sequentially, with no concurrency and no warning that you got it wrong. Calling <code>start()</code> twice throws <code>IllegalThreadStateException</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "<code>sleep()</code> vs <code>wait()</code>?"</strong><br>A: The decisive difference is locks: <code>sleep()</code> holds every lock it has, <code>wait()</code> releases the monitor it was called on. That is also why <code>wait()</code> must be inside <code>synchronized</code> — it must own the monitor to release it — and why it needs <code>notify()</code> to resume, whereas <code>sleep()</code> wakes on its own. <code>sleep</code> is static on <code>Thread</code>; <code>wait</code> is on <code>Object</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What are the thread states?"</strong><br>A: <code>NEW</code>, <code>RUNNABLE</code>, <code>BLOCKED</code>, <code>WAITING</code>, <code>TIMED_WAITING</code>, <code>TERMINATED</code>. The notable detail is that there is no <code>RUNNING</code> — <code>RUNNABLE</code> covers both executing and ready-to-execute, because scheduling is the OS's job. And <code>BLOCKED</code> specifically means waiting to enter a <code>synchronized</code> block; waiting on a <code>Lock</code> shows as <code>WAITING</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you stop a thread?"</strong><br>A: Cooperatively. Call <code>interrupt()</code>, and have the thread check <code>isInterrupted()</code> in its loop and handle <code>InterruptedException</code> from blocking calls by cleaning up and exiting. The critical detail is that catching <code>InterruptedException</code> clears the flag, so you must restore it with <code>Thread.currentThread().interrupt()</code> or rethrow. <code>Thread.stop()</code> was removed because it released locks mid-update and left shared state corrupted.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is a daemon thread?"</strong><br>A: One that does not keep the JVM alive — when only daemon threads remain, the JVM exits and they are abandoned wherever they are. It must be marked with <code>setDaemon(true)</code> before <code>start()</code>. Good for background housekeeping like metrics polling; wrong for anything that must complete, since it gets no chance to finish.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What happens to an uncaught exception in a thread?"</strong><br>A: It terminates that thread only; the rest of the application continues, and by default the trace just goes to stderr — so a worker can quietly disappear. Install an <code>UncaughtExceptionHandler</code>, or submit tasks to an executor, where the exception is captured in the <code>Future</code> and surfaces when you call <code>get()</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why are threads expensive?"</strong><br>A: Each maps one-to-one onto an OS thread, reserving around a megabyte of stack plus kernel structures, and every switch involves the scheduler. That is why pools exist and why servers cap concurrency well below the number of connections. Java 21's virtual threads change the calculus — they are JVM-scheduled with heap-allocated stacks, so millions are practical and blocking is cheap.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Six states: <code>NEW</code> · <code>RUNNABLE</code> · <code>BLOCKED</code> · <code>WAITING</code> · <code>TIMED_WAITING</code> · <code>TERMINATED</code>. <strong>No RUNNING.</strong></li>` +
        `<li><code>start()</code> = new thread. <code>run()</code> = ordinary method call.</li>` +
        `<li><strong><code>sleep</code> keeps locks · <code>wait</code> releases the monitor</strong> (and needs <code>synchronized</code>).</li>` +
        `<li><code>BLOCKED</code> = waiting for a <strong>monitor</strong>; <code>Lock</code> waiting shows as <code>WAITING</code>.</li>` +
        `<li>Stop threads <strong>cooperatively</strong> via <code>interrupt()</code>; catching <code>InterruptedException</code> <strong>clears the flag</strong> — restore it.</li>` +
        `<li><code>Thread.stop()</code> removed; <code>setDaemon</code> before <code>start()</code>; threads are single-use.</li>` +
        `<li>Prefer <strong><code>Runnable</code> + executor</strong> over extending <code>Thread</code>.</li>` +
        `<li>~1 MB stack per thread → pools. Java 21 <strong>virtual threads</strong> remove that constraint.</li>` +
        `<li>Uncaught exception kills one thread <strong>silently</strong> — set a handler or use a <code>Future</code>.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Race Conditions and synchronized',
      slug: 'synchronized-and-races',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>A race condition is the defining concurrency bug: it passes every test, works in staging, and corrupts data in production under load. Understanding why <code>count++</code> is unsafe — and why the fix is not what most people first reach for — is the foundation for everything else in this chapter.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A <strong>race condition</strong> is when the result depends on the unpredictable timing of threads. The canonical example is an increment, which looks atomic and is not:</p>`,
        `{{fig:ch8-race-condition.svg|A timeline showing thread A reading 5 then thread B reading 5 then both computing 6 and writing 6 so one increment is lost|count++ is read, add, write. Interleave two threads across those three steps and one update silently disappears — a lost update. Nothing throws.}}`,
        `<p><code>synchronized</code> fixes it by giving exactly one thread at a time access to the critical section. Every Java object has a <strong>monitor</strong> (an intrinsic lock); entering a <code>synchronized</code> block acquires it and leaving releases it — including when an exception unwinds.</p>`,
        `<h2>How it works</h2>`,
        `<p><code>synchronized</code> provides <strong>two</strong> guarantees, and forgetting the second one causes subtle bugs:</p>`,
        `<ul>` +
        `<li><strong>Mutual exclusion</strong> — one thread in the critical section at a time.</li>` +
        `<li><strong>Visibility</strong> — releasing a monitor flushes changes to main memory, and acquiring it invalidates the cached copy, so the next thread sees everything the previous one did. This is the <em>happens-before</em> relationship of the next topic.</li>` +
        `</ul>`,
        `<p><strong>What object is locked</strong> matters more than people expect:</p>`,
        `<table><thead><tr><th>Form</th><th>Locks</th></tr></thead><tbody>` +
        `<tr><td><code>synchronized void m()</code></td><td><code>this</code> — the instance</td></tr>` +
        `<tr><td><code>static synchronized void m()</code></td><td>The <code>Class</code> object — <strong>a different lock</strong></td></tr>` +
        `<tr><td><code>synchronized (obj) { }</code></td><td>Whatever <code>obj</code> is</td></tr>` +
        `</tbody></table>`,
        `<p>That third row is why an instance method and a static method on the same class can run <em>simultaneously</em>: they hold different monitors. It is a favourite interview question and a real source of bugs.</p>`,
        `<p><strong>Intrinsic locks are reentrant</strong>: a thread already holding a monitor can acquire it again without deadlocking itself. Without that, a <code>synchronized</code> method calling another <code>synchronized</code> method on the same object would hang instantly.</p>`,
        `<h2>Code examples</h2>`,
        `<pre><code class="language-java">// ✘ Race — count++ is three operations.
class Counter {
    private int count;
    public void increment() { count++; }
    public int get() { return count; }
}
// Two threads × 10,000 increments → typically ~13,000, never reliably 20,000.

// ✔ Correct, and note get() must be synchronized too — otherwise a reader
//   may see a stale cached value even though writes are exclusive.
class SafeCounter {
    private int count;
    public synchronized void increment() { count++; }
    public synchronized int get() { return count; }
}

// ✔ Better for this specific case — no lock at all (last topic).
class AtomicCounter {
    private final AtomicInteger count = new AtomicInteger();
    public void increment() { count.incrementAndGet(); }
    public int get() { return count.get(); }
}</code></pre>`,
        `<p>Lock scope, which is where most of the performance is won or lost:</p>`,
        `<pre><code class="language-java">// ✘ Locks for the whole method, including the expensive part that needs
//   no protection at all. Every other thread waits on the network call.
public synchronized void process(Order order) {
    Result r = callExternalService(order);   // 200ms, no shared state
    this.total += r.amount();                // the only line that races
}

// ✔ Lock only the critical section.
public void process(Order order) {
    Result r = callExternalService(order);   // outside the lock
    synchronized (this) {
        this.total += r.amount();
    }
}
// Never do I/O or call unknown code while holding a lock — that is how a
// slow dependency turns into an application-wide stall.</code></pre>`,
        `<p>The private lock object, which is a genuine design improvement:</p>`,
        `<pre><code class="language-java">// ✘ synchronized methods lock "this", which is PUBLIC. Any external code
//   can do synchronized(yourObject) and interfere with your locking —
//   including deadlocking you — and you cannot prevent it.
public class Registry {
    public synchronized void add(String k) { … }
}

// ✔ A private lock nobody outside can acquire.
public class Registry {
    private final Object lock = new Object();     // final: never reassigned
    public void add(String k) {
        synchronized (lock) { … }
    }
}</code></pre>`,
        `<p>And the two locks that are not one lock:</p>`,
        `<pre><code class="language-java">class Mixed {
    private static int staticCount;
    private int instanceCount;

    public synchronized void incInstance() { instanceCount++; }      // locks this
    public static synchronized void incStatic() { staticCount++; }   // locks Mixed.class
}
// These two methods do NOT exclude each other — different monitors. If both
// touched the same shared state, that would be a race despite both being
// synchronized. A classic "spot the bug" question.

// Also: never synchronize on a boxed value or a String literal — they are
// pooled and SHARED across your whole application:
// synchronized ("lock") { }              ✘ every class using "lock" shares it
// synchronized (Integer.valueOf(1)) { }  ✘ the Integer cache is global</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p>In bytecode, a <code>synchronized</code> block compiles to <code>monitorenter</code> and <code>monitorexit</code>, with a synthetic exception handler guaranteeing the exit even when the block throws. A <code>synchronized</code> method instead sets an <code>ACC_SYNCHRONIZED</code> flag and the JVM does the locking on entry and exit.</p>`,
        `<p><strong>HotSpot optimises locks aggressively</strong>, which is why the old "always use <code>ReentrantLock</code>, <code>synchronized</code> is slow" advice is obsolete. An uncontended monitor uses a lightweight CAS on the object header rather than an OS mutex; escape analysis can remove locking on an object that never escapes a method (<em>lock elision</em>); and adjacent synchronized blocks on the same object may be merged (<em>lock coarsening</em>). An uncontended <code>synchronized</code> block costs very little. <em>Biased locking</em>, which optimised the repeatedly-same-thread case, was deprecated in Java 15 and removed later — worth knowing, because older material still describes it as current.</p>`,
        `<p><strong>Contention is what costs</strong>, not synchronisation itself. When a thread cannot get the monitor it parks, which means a context switch and a trip through the scheduler. The fix is almost never a faster lock — it is a smaller critical section, a different data structure, or no sharing at all.</p>`,
        `<p><strong>The cheapest concurrency strategy is confinement.</strong> A local variable cannot be shared (Chapter 1), so it needs no synchronisation. Immutable objects likewise. Reaching for a lock should be the third option, after "does this need to be shared?" and "can this be immutable?".</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Synchronising the writer but not the reader.</strong> Readers can see stale values; visibility needs both sides.</li>` +
        `<li><strong>Assuming <code>count++</code> is atomic.</strong> It is read-modify-write.</li>` +
        `<li><strong>Locking too much.</strong> Holding a lock across I/O serialises the whole application.</li>` +
        `<li><strong>Synchronising on <code>this</code> in a public class.</strong> External code can acquire the same lock. Use a private final lock object.</li>` +
        `<li><strong>Synchronising on a String literal or boxed value.</strong> Pooled and shared JVM-wide.</li>` +
        `<li><strong>Synchronising on a non-final field.</strong> Reassigning it means threads lock different objects.</li>` +
        `<li><strong>Confusing instance and static locks.</strong> They are separate monitors.</li>` +
        `<li><strong>Believing <code>synchronized</code> is slow.</strong> Uncontended locking is cheap; contention is the cost.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Why is <code>count++</code> not thread-safe?"</strong><br>A: It is three operations — read the field, add one, write it back — and another thread can run between any of them. Two threads can both read 5, both compute 6, and both write 6, so one increment is lost. Nothing throws; the count is just quietly wrong, and only under load.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What does <code>synchronized</code> guarantee?"</strong><br>A: Two things. Mutual exclusion — one thread at a time in the critical section. And visibility — releasing the monitor flushes writes to main memory and acquiring it invalidates cached values, so the next thread sees everything the previous one did. People remember the first and forget the second, which is why they synchronise the writer and leave the reader unsynchronised.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What object does a <code>synchronized</code> method lock?"</strong><br>A: An instance method locks <code>this</code>; a static method locks the <code>Class</code> object. They are different monitors, so an instance method and a static method on the same class can run at the same time — which is a real bug if they touch the same state.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why prefer a private lock object over <code>synchronized</code> methods?"</strong><br>A: Because <code>this</code> is public. Any code holding a reference to your object can write <code>synchronized(obj)</code> and interfere with your locking — hold it too long, or deadlock you — and you have no way to prevent it. A <code>private final Object lock</code> is unreachable from outside, so the locking protocol is genuinely yours.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Are intrinsic locks reentrant?"</strong><br>A: Yes. The JVM tracks the owning thread and a hold count, so a thread already holding a monitor can acquire it again. Without that, one <code>synchronized</code> method calling another on the same object would deadlock immediately — reentrancy is what makes composition possible.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Is <code>synchronized</code> slow?"</strong><br>A: Uncontended, barely — HotSpot uses a lightweight CAS on the object header, and can elide locking entirely when escape analysis proves the object never escapes, or coarsen adjacent blocks. The cost is contention: a thread that cannot acquire the monitor parks, which means a context switch. So the fix for slow synchronised code is a smaller critical section or less sharing, not a different lock implementation.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Race = result depends on timing. <code>count++</code> is <strong>read-modify-write</strong>.</li>` +
        `<li><code>synchronized</code> gives <strong>mutual exclusion + visibility</strong>. Synchronise <strong>readers too</strong>.</li>` +
        `<li>Instance method → locks <code>this</code>; static → locks <strong><code>Class</code></strong>. Different monitors.</li>` +
        `<li>Prefer a <strong><code>private final Object lock</code></strong> over locking <code>this</code>.</li>` +
        `<li>Never lock a String literal, a boxed value, or a non-final field.</li>` +
        `<li>Intrinsic locks are <strong>reentrant</strong>. <code>monitorenter</code>/<code>monitorexit</code> in bytecode.</li>` +
        `<li><strong>Never do I/O while holding a lock.</strong> Keep critical sections tiny.</li>` +
        `<li>Uncontended locks are cheap (CAS, elision, coarsening). <strong>Biased locking removed in Java 15+.</strong></li>` +
        `<li>Cheapest strategy: <strong>don't share</strong> — confinement, then immutability, then locks.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'volatile and the Java Memory Model',
      slug: 'volatile-and-jmm',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Visibility bugs are the worst class of concurrency bug because they are invisible: no exception, no corrupted output, just a thread that never notices a flag changed and loops forever. They also cannot be reproduced reliably — the same code works in a debugger and hangs in production, because the JIT optimises differently once the method gets hot. The Java Memory Model is what makes reasoning about this possible, and <code>volatile</code> is its simplest tool.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Each CPU core has its own cache. A write by one thread may sit in that core's cache indefinitely, so another thread reading the same field can see a stale value — potentially forever. On top of that, both the compiler and the CPU may <strong>reorder</strong> instructions, as long as single-threaded behaviour is unchanged.</p>`,
        `{{fig:ch8-jmm-visibility.svg|Left shows two cores with divergent cached values of a running flag so the reader loops forever; right shows a volatile field read and written straight through main memory plus a panel on what volatile does not provide|The flag never reaches the other core. And the JIT, seeing nothing in the loop that could change the value, is entitled to hoist the read out entirely — turning it into a genuinely infinite loop.}}`,
        `<p><strong><code>volatile</code></strong> declares that a field must always be read from and written to main memory, and that reads and writes may not be reordered across it. It gives you <strong>visibility and ordering — but not atomicity</strong>.</p>`,
        `<h2>How it works</h2>`,
        `<p>The JMM is defined in terms of <strong>happens-before</strong>: if action A happens-before action B, then everything A did is visible to B. The relationships worth memorising:</p>`,
        `<table><thead><tr><th>Rule</th><th>Meaning</th></tr></thead><tbody>` +
        `<tr><td>Program order</td><td>Within one thread, statements happen-before later ones</td></tr>` +
        `<tr><td>Monitor lock</td><td>Unlocking happens-before any later lock of the same monitor</td></tr>` +
        `<tr><td><code>volatile</code></td><td>A write happens-before every later read of that field</td></tr>` +
        `<tr><td>Thread start</td><td><code>start()</code> happens-before anything in the new thread</td></tr>` +
        `<tr><td>Thread join</td><td>Everything in a thread happens-before <code>join()</code> returns</td></tr>` +
        `<tr><td><code>final</code> fields</td><td>Correct construction makes them visible without synchronisation</td></tr>` +
        `<tr><td>Transitivity</td><td>A → B and B → C implies A → C</td></tr>` +
        `</tbody></table>`,
        `<p>The <code>volatile</code> rule is stronger than "flush the cache". A volatile <em>write</em> publishes <strong>everything the thread wrote before it</strong>, and a volatile <em>read</em> makes all of it visible. That is what makes the double-checked locking idiom work, and why <code>volatile</code> on one field can safely publish an entire object graph.</p>`,
        `<p><strong>What <code>volatile</code> does not do:</strong> it does not make compound operations atomic. <code>volatile int count; count++</code> is still read-modify-write and still races. Use <code>volatile</code> for a value one thread writes and others read; use an atomic or a lock when readers also write.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The infinite loop:</p>`,
        `<pre><code class="language-java">class Worker implements Runnable {
    private boolean running = true;          // ✘ not volatile

    public void run() {
        while (running) { }                  // may NEVER exit
        System.out.println("stopped");
    }
    public void stop() { running = false; }
}
// The JIT sees nothing inside the loop that could modify "running", so it is
// entitled to hoist the read out — compiling it to "if (running) while(true){}".
// The fix is one keyword:
private volatile boolean running = true;     // ✔ always re-read, no hoisting</code></pre>`,
        `<p>Visibility versus atomicity, the distinction that matters most:</p>`,
        `<pre><code class="language-java">volatile int count = 0;
count++;            // ✘ STILL A RACE — read, add, write are three steps.
                    //   volatile makes each read and write visible, not the
                    //   sequence atomic.

// ✔ For a counter:
AtomicInteger count = new AtomicInteger();
count.incrementAndGet();

// ✔ volatile IS the right tool here — single writer, many readers, and the
//   new value does not depend on the old one:
private volatile Config config;
public void reload(Config c) { this.config = c; }   // one writer
public Config current() { return config; }          // many readers</code></pre>`,
        `<p>Double-checked locking, the classic example of why <code>volatile</code> is more than a cache flush:</p>`,
        `<pre><code class="language-java">// ✘ Broken without volatile. "instance = new Singleton()" is three steps:
//    allocate memory, run the constructor, assign the reference — and the
//    JIT may REORDER the last two. Another thread can then see a non-null
//    reference to a half-constructed object.
private static Singleton instance;

// ✔ volatile forbids that reordering.
private static volatile Singleton instance;

public static Singleton getInstance() {
    if (instance == null) {                    // fast path, no lock
        synchronized (Singleton.class) {
            if (instance == null) {            // re-check under the lock
                instance = new Singleton();
            }
        }
    }
    return instance;
}

// ✔ Honestly, prefer the holder idiom (Chapter 2) — no volatile, no
//   double-check, and the JVM guarantees the laziness and the thread safety:
private static class Holder { static final Singleton INSTANCE = new Singleton(); }
public static Singleton getInstance() { return Holder.INSTANCE; }</code></pre>`,
        `<p>Safe publication, which is the practical form of all this:</p>`,
        `<pre><code class="language-java">// An immutable object with final fields can be shared across threads with
// NO synchronisation — the JMM guarantees any thread seeing a properly
// constructed object sees its final fields fully initialised.
public final class Config {
    private final String host;
    private final int port;
    public Config(String host, int port) { this.host = host; this.port = port; }
}
// ⚠ The guarantee is void if "this" escapes during construction (Chapter 2) —
//   registering a listener or starting a thread from the constructor breaks it.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><code>volatile</code> compiles to <strong>memory barriers</strong> (fences) that constrain both the compiler and the CPU. On x86, whose hardware memory model is already strong, a volatile read is nearly free and a volatile write costs roughly a locked instruction; on weaker architectures such as ARM the barriers are more expensive. So "volatile is cheap" is platform-dependent, though far cheaper than a contended lock either way.</p>`,
        `<p><strong>Why the JMM exists at all:</strong> without a specification, "what can a thread see?" would depend on the CPU architecture and the JIT's mood, and portable concurrent code would be impossible. JSR-133 (Java 5) rewrote the original broken model and gave us the happens-before framework, the <code>final</code>-field guarantees, and the volatile semantics that make double-checked locking work. Before Java 5, DCL was broken <em>even with</em> <code>volatile</code> — a good piece of history to have ready.</p>`,
        `<p><strong>The practical hierarchy</strong> is worth stating as a closing answer: don't share state; if you must share, make it immutable; if it must be mutable and is a single value, use <code>volatile</code> or an atomic; only if you need to update several things together should you reach for a lock. Most concurrency bugs come from skipping straight to the last option and then getting the critical section wrong.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Expecting <code>volatile</code> to make <code>++</code> atomic.</strong> It gives visibility, not mutual exclusion.</li>` +
        `<li><strong>Omitting <code>volatile</code> on a stop flag.</strong> The loop may never see the change.</li>` +
        `<li><strong><code>volatile</code> on a mutable object reference.</strong> It publishes the <em>reference</em> safely, not the object's contents.</li>` +
        `<li><strong>Double-checked locking without <code>volatile</code>.</strong> Reordering can publish a half-built object.</li>` +
        `<li><strong>Assuming a debugger reproduces it.</strong> Debugging inhibits the optimisations that cause the bug.</li>` +
        `<li><strong>Synchronising writes but not reads.</strong> Both sides are needed for a happens-before edge.</li>` +
        `<li><strong>Letting <code>this</code> escape a constructor.</strong> Voids the <code>final</code>-field guarantee.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What does <code>volatile</code> do?"</strong><br>A: Two things. Visibility — reads and writes go to main memory rather than a core's cache, so a write by one thread is immediately visible to others. And ordering — it inserts memory barriers that stop the compiler and CPU reordering operations across the access. What it does not give is atomicity: <code>volatile int count; count++</code> still races.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is happens-before?"</strong><br>A: The JMM's ordering relation. If A happens-before B, everything A did is guaranteed visible to B. It is established by program order within a thread, by unlocking-then-locking the same monitor, by a volatile write then read, by <code>Thread.start()</code> and <code>join()</code>, and by correct construction for <code>final</code> fields — and it is transitive. Without such an edge between two threads, there is no guarantee about what one sees of the other.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why can a loop on a non-volatile boolean never terminate?"</strong><br>A: Two reasons that compound. The write may sit in the writing core's cache and never reach the reader. And the JIT, seeing nothing in the loop that could change the field, is entitled to hoist the read out — compiling it into a genuinely infinite loop. Marking the field <code>volatile</code> forbids both.</p></blockquote>`,
        `<blockquote><p><strong>Q: "When is <code>volatile</code> enough, and when do you need a lock?"</strong><br>A: <code>volatile</code> is enough when a single thread writes and others read, and the new value does not depend on the old — a status flag, a swapped-in config object. You need an atomic or a lock as soon as the operation is read-modify-write, or when several fields must change together consistently.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why does double-checked locking need <code>volatile</code>?"</strong><br>A: Because <code>instance = new Singleton()</code> is allocate, construct, assign — and the last two can be reordered. Without <code>volatile</code>, another thread taking the fast path can see a non-null reference to a half-constructed object. <code>volatile</code> forbids that reordering. In practice I would use the initialisation-on-demand holder idiom instead, which gets laziness and thread safety from the JVM's class-initialisation guarantee with no volatile at all.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why are immutable objects thread-safe?"</strong><br>A: There is no mutable state to race on, and the memory model's <code>final</code>-field rule guarantees that any thread seeing a properly constructed object sees its final fields fully initialised — without synchronisation. The caveat is that "properly constructed" means <code>this</code> did not escape during construction; publishing a reference from the constructor forfeits the guarantee.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><code>volatile</code> = <strong>visibility + ordering</strong>. <strong>Not atomicity.</strong></li>` +
        `<li>A volatile write publishes <strong>everything written before it</strong>; a volatile read makes it all visible.</li>` +
        `<li>happens-before edges: program order · monitor unlock→lock · volatile write→read · <code>start()</code> · <code>join()</code> · <code>final</code> fields · transitive.</li>` +
        `<li>Non-volatile flag → the JIT may <strong>hoist the read</strong> → infinite loop.</li>` +
        `<li>Use <code>volatile</code> for <strong>single writer, many readers</strong>, value independent of the old one.</li>` +
        `<li>DCL <strong>requires</strong> <code>volatile</code> — better still, use the <strong>holder idiom</strong>.</li>` +
        `<li>Immutable + <code>final</code> fields = safe publication, no synchronisation — unless <code>this</code> escaped.</li>` +
        `<li>Hierarchy: <strong>don't share → immutable → volatile/atomic → lock</strong>.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Locks: ReentrantLock, ReadWriteLock and Conditions',
      slug: 'locks-and-conditions',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p><code>synchronized</code> handles most cases, so the interesting question is what the explicit <code>Lock</code> API buys you — and the honest answer is not "speed". It is capabilities <code>synchronized</code> cannot express: giving up if the lock is unavailable, waiting with a timeout, being interruptible, and having several wait-sets on one lock. Knowing <em>which</em> capability you need is what makes this a design question rather than a syntax one.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p><code>java.util.concurrent.locks.Lock</code> is an interface whose main implementation, <code>ReentrantLock</code>, does everything <code>synchronized</code> does and more — at the cost of manual unlocking.</p>`,
        `<table><thead><tr><th></th><th><code>synchronized</code></th><th><code>ReentrantLock</code></th></tr></thead><tbody>` +
        `<tr><td>Release</td><td>Automatic, even on exception</td><td><strong>Manual</strong> — must be in <code>finally</code></td></tr>` +
        `<tr><td>Try without blocking</td><td>No</td><td><code>tryLock()</code></td></tr>` +
        `<tr><td>Timeout</td><td>No</td><td><code>tryLock(t, unit)</code></td></tr>` +
        `<tr><td>Interruptible</td><td>No</td><td><code>lockInterruptibly()</code></td></tr>` +
        `<tr><td>Fairness</td><td>No</td><td>Optional FIFO</td></tr>` +
        `<tr><td>Wait sets</td><td>One per object</td><td>Many via <code>newCondition()</code></td></tr>` +
        `<tr><td>Lock across methods</td><td>No</td><td>Yes</td></tr>` +
        `</tbody></table>`,
        `<p>The rule of thumb: <strong>use <code>synchronized</code> unless you need one of the rows above.</strong> It is shorter, impossible to leak, and the JVM optimises it well.</p>`,
        `<h2>How it works</h2>`,
        `<p><strong>The <code>finally</code> is not optional.</strong> A <code>Lock</code> not released in a <code>finally</code> block will leak on any exception, and every thread that touches it afterwards hangs forever. This is the one real disadvantage against <code>synchronized</code>.</p>`,
        `<p><strong><code>ReadWriteLock</code></strong> allows many concurrent readers <em>or</em> one writer. It only pays off when reads massively outnumber writes and the critical sections are long enough to matter — otherwise its bookkeeping costs more than a plain lock. <code>StampedLock</code> (Java 8) goes further with an optimistic read mode that takes no lock at all and validates afterwards, but it is not reentrant and is easy to misuse.</p>`,
        `<p><strong><code>Condition</code></strong> replaces <code>wait</code>/<code>notify</code> and fixes their biggest weakness: one object has a single wait-set, so <code>notifyAll</code> wakes everyone including threads waiting for a different reason. A lock can have several conditions, so you can wake exactly the right group.</p>`,
        `<h2>Code examples</h2>`,
        `<pre><code class="language-java">private final ReentrantLock lock = new ReentrantLock();

public void update() {
    lock.lock();
    try {                       // ✔ the try must be the FIRST thing after lock()
        mutateState();
    } finally {
        lock.unlock();          // ✔ non-negotiable
    }
}

// tryLock — do something else rather than block. Impossible with synchronized.
public boolean updateIfFree() {
    if (!lock.tryLock()) return false;
    try { mutateState(); return true; }
    finally { lock.unlock(); }
}

// Timeout — bounded waiting, so a stuck lock does not stall a request thread.
public boolean updateWithin(Duration d) throws InterruptedException {
    if (!lock.tryLock(d.toMillis(), TimeUnit.MILLISECONDS)) return false;
    try { mutateState(); return true; }
    finally { lock.unlock(); }
}</code></pre>`,
        `<p>The bounded buffer, which is the textbook <code>Condition</code> example and shows why two conditions beat one:</p>`,
        `<pre><code class="language-java">public class BoundedBuffer&lt;T&gt; {
    private final Queue&lt;T&gt; queue = new ArrayDeque&lt;&gt;();
    private final int capacity;
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull  = lock.newCondition();   // two separate
    private final Condition notEmpty = lock.newCondition();   // wait-sets

    public void put(T item) throws InterruptedException {
        lock.lock();
        try {
            while (queue.size() == capacity) notFull.await();   // ✔ WHILE, not if
            queue.add(item);
            notEmpty.signal();          // wake ONLY a consumer
        } finally { lock.unlock(); }
    }

    public T take() throws InterruptedException {
        lock.lock();
        try {
            while (queue.isEmpty()) notEmpty.await();
            T item = queue.poll();
            notFull.signal();           // wake ONLY a producer
        return item;
        } finally { lock.unlock(); }
    }
}
// With wait/notify there is ONE wait-set, so notifyAll wakes producers and
// consumers alike and most of them immediately go back to sleep. Worse,
// notify() can wake the wrong kind and deadlock the buffer.
//
// In real code: just use ArrayBlockingQueue, which is exactly this, tested.</code></pre>`,
        `<p>Why the loop must be <code>while</code>, never <code>if</code>:</p>`,
        `<pre><code class="language-java">// ✘ if (queue.isEmpty()) notEmpty.await();
// Two reasons it is wrong:
//  1. SPURIOUS WAKEUPS — await() may return without any signal. The JLS
//     permits it, and real JVMs do it.
//  2. Another thread may consume the item between the signal and this
//     thread reacquiring the lock.
// Always re-check the condition in a loop after waking.</code></pre>`,
        `<p><code>ReadWriteLock</code>, and the honest caveat:</p>`,
        `<pre><code class="language-java">private final ReadWriteLock rw = new ReentrantReadWriteLock();

public String get(String key) {
    rw.readLock().lock();               // many readers concurrently
    try { return map.get(key); }
    finally { rw.readLock().unlock(); }
}

public void put(String key, String value) {
    rw.writeLock().lock();              // exclusive
    try { map.put(key, value); }
    finally { rw.writeLock().unlock(); }
}
// ⚠ For a map specifically, ConcurrentHashMap beats this comfortably —
//   it locks per bin and never locks reads at all (Chapter 4). ReadWriteLock
//   earns its keep for longer read sections over a structure with no
//   concurrent equivalent.
// ⚠ You cannot upgrade a read lock to a write lock — it deadlocks. Release
//   and reacquire, then re-check the state.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p>Nearly everything in <code>java.util.concurrent.locks</code> is built on <strong><code>AbstractQueuedSynchronizer</code></strong> (AQS) — Doug Lea's framework holding an atomic <code>int</code> state plus a FIFO queue of waiting threads. <code>ReentrantLock</code> uses the state as a hold count, <code>Semaphore</code> as permits, <code>CountDownLatch</code> as the count. Naming AQS is a strong senior signal because it explains why these classes behave so consistently.</p>`,
        `<p><strong>Fairness is expensive.</strong> A fair lock hands ownership to the longest-waiting thread, which prevents starvation but forces a context switch on nearly every handoff — throughput can drop by an order of magnitude. The default is unfair, and unfair is almost always right: barging threads keep the CPU busy.</p>`,
        `<p><strong>The other AQS-based tools</strong> are worth knowing by name, because reaching for the right one beats hand-rolling with locks: <code>CountDownLatch</code> (wait for N events, single-use), <code>CyclicBarrier</code> (N threads meet, reusable), <code>Semaphore</code> (limit concurrent access to N), <code>Phaser</code> (flexible multi-phase). "Wait until all workers finish" is a <code>CountDownLatch</code>, not a <code>wait</code>/<code>notify</code> puzzle.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>No <code>finally</code> around <code>unlock()</code>.</strong> One exception leaks the lock and hangs every later thread.</li>` +
        `<li><strong>Code between <code>lock()</code> and <code>try</code>.</strong> If it throws, <code>finally</code> unlocks a lock you never acquired — <code>IllegalMonitorStateException</code>.</li>` +
        `<li><strong><code>if</code> instead of <code>while</code> around <code>await()</code>.</strong> Spurious wakeups are real.</li>` +
        `<li><strong>Using a lock where <code>synchronized</code> would do.</strong> More code, more failure modes, no benefit.</li>` +
        `<li><strong>Fair locks by default.</strong> Large throughput cost for a guarantee you rarely need.</li>` +
        `<li><strong>Upgrading a read lock to a write lock.</strong> Deadlocks — release first.</li>` +
        `<li><strong><code>ReadWriteLock</code> for short critical sections.</strong> Its bookkeeping outweighs the benefit.</li>` +
        `<li><strong>Hand-rolling a latch or semaphore.</strong> Use <code>java.util.concurrent</code>.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "<code>synchronized</code> or <code>ReentrantLock</code>?"</strong><br>A: <code>synchronized</code> by default — it is shorter, releases automatically even on exception, and the JVM optimises it well. I reach for <code>ReentrantLock</code> when I need something it cannot express: <code>tryLock</code> to avoid blocking, a timeout, interruptible acquisition, fairness, multiple condition wait-sets, or locking that spans methods. Performance is not the reason; modern <code>synchronized</code> is competitive.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is the danger of <code>ReentrantLock</code>?"</strong><br>A: Manual release. If <code>unlock()</code> is not in a <code>finally</code>, any exception leaks the lock and every thread that needs it afterwards blocks forever — a hung application with no exception in the logs. The idiom is <code>lock()</code>, then <code>try</code> immediately, with <code>unlock()</code> in <code>finally</code>; putting anything between <code>lock()</code> and <code>try</code> creates a second bug.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why <code>while</code> rather than <code>if</code> around <code>await()</code>?"</strong><br>A: Two reasons. Spurious wakeups — <code>await()</code> is permitted to return without any signal, and real JVMs do it. And even after a genuine signal, another thread may change the state before this one reacquires the lock. So the condition must be re-checked in a loop; the same applies to <code>Object.wait()</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What does <code>Condition</code> give you over <code>wait</code>/<code>notify</code>?"</strong><br>A: Multiple wait-sets on one lock. With intrinsic monitors there is a single wait-set, so <code>notifyAll</code> wakes every waiter regardless of what they were waiting for, and <code>notify</code> can wake the wrong one and stall the system. With conditions, a bounded buffer can have <code>notFull</code> and <code>notEmpty</code> and signal exactly the right group.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is AQS?"</strong><br>A: <code>AbstractQueuedSynchronizer</code>, the framework underneath most of <code>java.util.concurrent</code>. It holds an atomic int state and a FIFO queue of blocked threads, and each synchroniser interprets the state differently — a hold count for <code>ReentrantLock</code>, permits for <code>Semaphore</code>, a countdown for <code>CountDownLatch</code>. It is why those classes share such consistent behaviour around fairness and interruption.</p></blockquote>`,
        `<blockquote><p><strong>Q: "When would you use a <code>ReadWriteLock</code>?"</strong><br>A: When reads vastly outnumber writes and the read sections are long enough that concurrency among readers actually pays. For a map I would use <code>ConcurrentHashMap</code> instead, which locks per bin and never locks reads. And you cannot upgrade a read lock to a write lock — attempting it deadlocks, so you must release and reacquire, then re-check the state you read.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Default to <code>synchronized</code>. Use <code>Lock</code> for <strong>tryLock · timeout · interruptible · fairness · multiple conditions · cross-method</strong>.</li>` +
        `<li><strong><code>lock(); try { … } finally { unlock(); }</code></strong> — nothing between <code>lock()</code> and <code>try</code>.</li>` +
        `<li><code>await()</code> always inside a <strong><code>while</code></strong> — spurious wakeups are real.</li>` +
        `<li><code>Condition</code> = <strong>multiple wait-sets</strong> per lock (<code>notFull</code>/<code>notEmpty</code>).</li>` +
        `<li>Fair locks: no starvation, <strong>much lower throughput</strong>. Default unfair.</li>` +
        `<li><code>ReadWriteLock</code>: many readers OR one writer; <strong>no upgrade</strong>. Prefer <code>ConcurrentHashMap</code> for maps.</li>` +
        `<li>All built on <strong>AQS</strong> — also <code>Semaphore</code>, <code>CountDownLatch</code>, <code>CyclicBarrier</code>, <code>Phaser</code>.</li>` +
        `<li>"Wait for N tasks" = <strong><code>CountDownLatch</code></strong>, not hand-rolled <code>wait</code>/<code>notify</code>.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Deadlock, Livelock and Starvation',
      slug: 'deadlock-and-liveness',
      order: 4,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>A deadlock is the most dramatic concurrency failure: the application does not crash, does not log anything, and simply stops. There is no stack trace to search for, because nothing threw. Interviewers ask because the fix is a design discipline rather than a code change, and because diagnosing one requires knowing how to read a thread dump — a genuinely practical skill.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p><strong>Deadlock</strong> is two or more threads each holding a lock the other needs, so none can proceed. It requires four conditions to hold simultaneously — the <em>Coffman conditions</em> — and breaking any one makes deadlock impossible:</p>`,
        `{{fig:ch8-deadlock.svg|Left shows thread A holding lock 1 wanting lock 2 while thread B holds lock 2 and wants lock 1 forming a cycle; right shows both threads acquiring lock 1 first so no cycle can form|The cycle is the whole problem. Enforce one global order in which locks are acquired and a cycle becomes structurally impossible.}}`,
        `<ul>` +
        `<li><strong>Mutual exclusion</strong> — a resource is held exclusively.</li>` +
        `<li><strong>Hold and wait</strong> — a thread holds one lock while requesting another.</li>` +
        `<li><strong>No preemption</strong> — locks cannot be forcibly taken away.</li>` +
        `<li><strong>Circular wait</strong> — a cycle in the wait-for graph. <em>This is the one you break in practice.</em></li>` +
        `</ul>`,
        `<h2>How it works</h2>`,
        `<p>Two related failures share the "nothing is progressing" symptom and are worth distinguishing:</p>`,
        `<ul>` +
        `<li><strong>Livelock</strong> — threads are running, responding to each other, and making no progress. Two people stepping aside in a corridor, repeatedly. Common with naive retry-on-conflict logic where everyone backs off in lockstep.</li>` +
        `<li><strong>Starvation</strong> — a thread never gets the resource because others keep taking it. Caused by unfair locks under heavy load, or by low-priority threads that never get scheduled.</li>` +
        `</ul>`,
        `<p>The <strong>primary prevention technique</strong> is a global lock ordering: define a total order over your locks and always acquire them in that order. If every thread takes Lock1 before Lock2, no cycle can form. When the objects have no natural order, use their identity hash codes as a tiebreak.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The classic bank transfer deadlock:</p>`,
        `<pre><code class="language-java">// ✘ Deadlocks when two transfers run in opposite directions simultaneously:
//    transfer(A, B) locks A then wants B
//    transfer(B, A) locks B then wants A
public void transfer(Account from, Account to, BigDecimal amount) {
    synchronized (from) {
        synchronized (to) {
            from.debit(amount);
            to.credit(amount);
        }
    }
}

// ✔ Impose a consistent order using a unique, stable id.
public void transfer(Account from, Account to, BigDecimal amount) {
    Account first  = from.id().compareTo(to.id()) &lt; 0 ? from : to;
    Account second = (first == from) ? to : from;
    synchronized (first) {
        synchronized (second) {
            from.debit(amount);
            to.credit(amount);
        }
    }
}
// Now every thread locks the lower id first, so no cycle can form.
// ⚠ Guard against from == to, which would otherwise self-deadlock on a
//   non-reentrant lock (intrinsic locks are reentrant, so this one survives).</code></pre>`,
        `<p>The timeout approach, when ordering is impractical:</p>`,
        `<pre><code class="language-java">// tryLock with a timeout breaks "hold and wait" — a thread that cannot get
// everything gives up what it has and retries, so no cycle persists.
public boolean transfer(Account from, Account to, BigDecimal amount)
        throws InterruptedException {
    long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(1);
    while (System.nanoTime() &lt; deadline) {
        if (from.lock().tryLock(50, TimeUnit.MILLISECONDS)) {
            try {
                if (to.lock().tryLock(50, TimeUnit.MILLISECONDS)) {
                    try {
                        from.debit(amount);
                        to.credit(amount);
                        return true;
                    } finally { to.lock().unlock(); }
                }
            } finally { from.lock().unlock(); }   // ✔ release before retrying
        }
        // ⚠ Randomised backoff — without it, two threads can retry in
        //   lockstep forever, which is LIVELOCK rather than deadlock.
        Thread.sleep(ThreadLocalRandom.current().nextInt(10, 50));
    }
    return false;
}</code></pre>`,
        `<p>Diagnosing one — this is what the interviewer wants to hear:</p>`,
        `<pre><code class="language-bash">jcmd &lt;pid&gt; Thread.print    # the JVM DETECTS monitor deadlocks and names them</code></pre>`,
        `<pre><code class="language-text">Found one Java-level deadlock:
=============================
"thread-1":
  waiting to lock monitor 0x00007f8 (object 0x76b2f1234, a com.app.Account),
  which is held by "thread-2"
"thread-2":
  waiting to lock monitor 0x00007f9 (object 0x76b2f9999, a com.app.Account),
  which is held by "thread-1"

// The JVM finds cycles of INTRINSIC locks automatically. It does NOT detect
// deadlocks involving ReentrantLock in the same way — for those, read the
// stack traces for threads parked in AQS. ThreadMXBean.findDeadlockedThreads()
// covers both and can be wired into a health check.</code></pre>`,
        `<p>The subtler deadlock, which is far more common in real systems:</p>`,
        `<pre><code class="language-java">// ✘ Calling unknown code while holding a lock. The listener might acquire
//   another lock — or call back into this class — and you have no idea.
synchronized (this) {
    for (Listener l : listeners) l.onChange(value);   // ALIEN METHOD
}

// ✔ Copy inside the lock, invoke outside it.
List&lt;Listener&gt; snapshot;
synchronized (this) {
    snapshot = new ArrayList&lt;&gt;(listeners);
}
for (Listener l : snapshot) l.onChange(value);        // no lock held</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>The JVM detects but never resolves.</strong> Thread dumps identify cycles of intrinsic monitors, and <code>ThreadMXBean.findDeadlockedThreads()</code> covers <code>Lock</code>-based ones too — but nothing breaks the cycle. Java has no lock preemption and no transaction rollback, so a deadlocked application stays deadlocked until it is restarted. Prevention is the only real strategy.</p>`,
        `<p><strong>Database deadlocks are different</strong>, and the contrast is worth drawing because it comes up in Spring interviews (Chapter 12). A database <em>detects</em> deadlock and kills one transaction as the victim, which then rolls back and can be retried. That is why <code>DeadlockLoserDataAccessException</code> is retryable while a JVM deadlock is fatal. The same lock-ordering discipline prevents both — updating rows in a consistent order is the database equivalent.</p>`,
        `<p><strong>Deadlocks are almost impossible to test for</strong>, because they require a specific interleaving that may occur once in millions of runs. That is precisely why the discipline matters: consistent lock ordering, never calling alien code under a lock, keeping critical sections small, and preferring higher-level constructs — a <code>BlockingQueue</code> or a <code>ConcurrentHashMap</code> — over hand-written multi-lock protocols. Most deadlocks are prevented by not writing the lock at all.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Acquiring locks in different orders in different methods.</strong> The direct cause of nearly every deadlock.</li>` +
        `<li><strong>Calling alien code while holding a lock.</strong> Listeners and callbacks can acquire anything.</li>` +
        `<li><strong>Holding a lock across I/O.</strong> Turns contention into an outage.</li>` +
        `<li><strong>Retrying without randomised backoff.</strong> Converts deadlock into livelock.</li>` +
        `<li><strong>Assuming testing will find it.</strong> Deadlocks need a rare interleaving.</li>` +
        `<li><strong>Catching and continuing on <code>tryLock</code> failure without releasing.</strong> You keep what you hold and nothing improves.</li>` +
        `<li><strong>Nested synchronised blocks by reflex.</strong> Every added lock multiplies the ordering constraints.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is a deadlock and how do you prevent it?"</strong><br>A: Two or more threads each holding a lock the other needs, so none can proceed. It needs all four Coffman conditions — mutual exclusion, hold and wait, no preemption, circular wait — and breaking any one prevents it. In practice I break circular wait with a global lock ordering: define a total order, usually by a stable id, and always acquire in that order. Where ordering is impractical, <code>tryLock</code> with a timeout and randomised backoff breaks hold-and-wait instead.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you diagnose one in production?"</strong><br>A: Take a thread dump with <code>jcmd &lt;pid&gt; Thread.print</code> or <code>jstack</code>. The JVM detects cycles of intrinsic monitors and prints a "Found one Java-level deadlock" section naming the threads and the objects. For <code>ReentrantLock</code>-based deadlocks it does not report that way, so I read the stacks for threads parked in AQS, or call <code>ThreadMXBean.findDeadlockedThreads()</code>, which covers both and can be exposed as a health check.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Deadlock vs livelock vs starvation?"</strong><br>A: Deadlock — threads are blocked and nothing runs. Livelock — threads are running and responding to each other but making no progress, typically retry logic backing off in lockstep. Starvation — a thread runs but never gets the resource because others keep winning it, usually from unfair locks under load. Deadlock is the only one where the threads are genuinely stopped, so it is the one a thread dump identifies immediately.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Can the JVM recover from a deadlock?"</strong><br>A: No. It can detect and report one, but there is no lock preemption and no rollback, so the threads stay stuck until the process is restarted. That is the contrast with a database, which detects deadlock, picks a victim transaction and rolls it back — which is why a database deadlock is retryable and a JVM deadlock is fatal.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Two threads transfer money between the same two accounts in opposite directions. What happens?"</strong><br>A: Classic deadlock — each locks its source and waits for the other's. The fix is to order the locks by something stable and unique, such as account id, so both threads always lock the lower id first and no cycle can form. I would also guard the same-account case, and in a real system prefer a single database transaction with consistent row ordering over application-level locks.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why is calling a listener while holding a lock dangerous?"</strong><br>A: Because it is code you do not control. The listener may acquire another lock, call back into your class, or block on I/O — all while your lock is held, and you cannot reason about the ordering it introduces. The fix is to copy the listener list inside the lock and invoke them outside it, so no alien code ever runs under your lock.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Deadlock = <strong>cycle in the wait-for graph</strong>. Four Coffman conditions; break any one.</li>` +
        `<li>Primary fix: <strong>global lock ordering</strong> by a stable id.</li>` +
        `<li>Alternative: <code>tryLock</code> + timeout + <strong>randomised backoff</strong> (without it → livelock).</li>` +
        `<li><strong>Livelock</strong> = running, no progress. <strong>Starvation</strong> = never gets the resource.</li>` +
        `<li>Diagnose: <code>jcmd &lt;pid&gt; Thread.print</code> — the JVM names <strong>monitor</strong> deadlocks; <code>ThreadMXBean.findDeadlockedThreads()</code> covers <code>Lock</code>s too.</li>` +
        `<li><strong>The JVM never recovers</strong> — no preemption, no rollback. Databases do (retryable).</li>` +
        `<li><strong>Never call alien code under a lock</strong> — copy the list, invoke outside.</li>` +
        `<li>Never hold a lock across I/O. Prefer <code>BlockingQueue</code>/<code>ConcurrentHashMap</code> over hand-rolled multi-lock protocols.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Executors and Thread Pools',
      slug: 'executors-and-thread-pools',
      order: 5,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Nobody creates threads by hand in production code — they submit tasks to a pool. And the pool's configuration is where real outages come from: the two most convenient factory methods in the JDK both create pools that can take a server down under load, in ways the method names give no hint of. This is one of the most directly practical topics in the kit.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>An <code>ExecutorService</code> separates <em>what work to do</em> from <em>which thread does it</em>. You submit tasks; the pool reuses a bounded set of threads, so you pay the ~1 MB-per-thread creation cost once rather than per task.</p>`,
        `<p>The part almost everyone gets wrong is the order in which <code>ThreadPoolExecutor</code> makes decisions:</p>`,
        `{{fig:ch8-thread-pool.svg|A flow showing submit checking core pool size then queueing then growing to max pool size then rejecting with a panel explaining why the Executors factory methods are dangerous|The queue fills BEFORE the pool grows past corePoolSize. With an unbounded queue — which newFixedThreadPool uses — steps 3 and 4 can never happen, so the queue simply grows until the heap is exhausted.}}`,
        `<h2>How it works</h2>`,
        `<p>The six constructor parameters, and what each actually controls:</p>`,
        `<table><thead><tr><th>Parameter</th><th>Meaning</th></tr></thead><tbody>` +
        `<tr><td><code>corePoolSize</code></td><td>Threads kept alive even when idle</td></tr>` +
        `<tr><td><code>maximumPoolSize</code></td><td>Upper bound — <strong>only reached when the queue is full</strong></td></tr>` +
        `<tr><td><code>keepAliveTime</code></td><td>How long above-core threads survive idle</td></tr>` +
        `<tr><td><code>workQueue</code></td><td>Where tasks wait. <strong>Bound it.</strong></td></tr>` +
        `<tr><td><code>threadFactory</code></td><td>Names threads — invaluable in dumps</td></tr>` +
        `<tr><td><code>handler</code></td><td>What happens when full: Abort, CallerRuns, Discard, DiscardOldest</td></tr>` +
        `</tbody></table>`,
        `<p><strong>Sizing:</strong> for CPU-bound work, roughly the number of cores. For I/O-bound work, threads spend most of their time waiting, so the pool can be much larger — the standard formula is <code>cores × (1 + waitTime/serviceTime)</code>. Measure rather than guess; a pool sized for CPU work will leave a service massively under-utilised when the real bottleneck is a database.</p>`,
        `<h2>Code examples</h2>`,
        `<p>What not to use, and why:</p>`,
        `<pre><code class="language-java">// ✘ Unbounded QUEUE. Under a burst, tasks pile up until OutOfMemoryError.
//   The name suggests the danger is bounded. It is not.
ExecutorService a = Executors.newFixedThreadPool(10);

// ✘ Unbounded THREADS — maximumPoolSize is Integer.MAX_VALUE. A traffic
//   spike creates thousands of OS threads and the machine dies.
ExecutorService b = Executors.newCachedThreadPool();

// ✔ Explicit and bounded in both dimensions, with a rejection policy.
ExecutorService pool = new ThreadPoolExecutor(
    10, 20,                                  // core, max
    60L, TimeUnit.SECONDS,                   // keep-alive for extra threads
    new ArrayBlockingQueue&lt;&gt;(500),           // BOUNDED queue
    new ThreadFactoryBuilder().setNameFormat("order-worker-%d").build(),
    new ThreadPoolExecutor.CallerRunsPolicy() // backpressure: the submitting
);                                            // thread runs the task itself,
                                              // which naturally slows intake</code></pre>`,
        `<p>Shutdown, which is routinely done wrong:</p>`,
        `<pre><code class="language-java">// ✘ shutdown() only stops NEW submissions — it returns immediately and does
//   not wait. Code after it runs while tasks are still executing.
pool.shutdown();

// ✔ The correct sequence, from the ExecutorService javadoc:
pool.shutdown();                                     // no new tasks
try {
    if (!pool.awaitTermination(30, TimeUnit.SECONDS)) {
        pool.shutdownNow();                          // interrupt running tasks
        if (!pool.awaitTermination(30, TimeUnit.SECONDS)) {
            log.error("pool did not terminate");
        }
    }
} catch (InterruptedException e) {
    pool.shutdownNow();
    Thread.currentThread().interrupt();              // restore the flag
}
// ⚠ shutdownNow() interrupts tasks — it cannot stop one that ignores
//   interruption. A task with an uninterruptible loop will run forever.</code></pre>`,
        `<p>The silent-failure trap, which is the most common executor bug:</p>`,
        `<pre><code class="language-java">// ✘ The exception is captured in the Future and NEVER surfaces, because
//   nobody calls get(). The task fails silently, forever.
executor.submit(() -&gt; { throw new RuntimeException("boom"); });

// ✔ Either inspect the Future…
Future&lt;?&gt; f = executor.submit(task);
try { f.get(); } catch (ExecutionException e) { log.error("task failed", e.getCause()); }

// ✔ …or use execute(), where an uncaught exception reaches the thread's
//   UncaughtExceptionHandler instead of being swallowed.
executor.execute(() -&gt; { throw new RuntimeException("boom"); });

// ✔ Best: never let it escape the task.
executor.submit(() -&gt; {
    try { doWork(); }
    catch (Exception e) { log.error("work failed", e); }
});</code></pre>`,
        `<p>Scheduling, and the pitfall in it:</p>`,
        `<pre><code class="language-java">ScheduledExecutorService s = Executors.newScheduledThreadPool(2);
s.scheduleAtFixedRate(this::poll, 0, 10, TimeUnit.SECONDS);   // every 10s
s.scheduleWithFixedDelay(this::poll, 0, 10, TimeUnit.SECONDS); // 10s AFTER each

// ⚠ If a scheduled task throws, it is silently CANCELLED and never runs
//   again — the single most common "why did my scheduler stop?" bug.
//   Always wrap the body in try/catch.
s.scheduleAtFixedRate(() -&gt; {
    try { poll(); } catch (Exception e) { log.error("poll failed", e); }
}, 0, 10, TimeUnit.SECONDS);</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Why the queue fills before the pool grows</strong> is the design decision that surprises people, and it is deliberate: growing threads is expensive, so the executor prefers to queue. The consequence is that <code>maximumPoolSize</code> is meaningless with an unbounded queue — the pool never exceeds <code>corePoolSize</code>. If you want elasticity, you must bound the queue.</p>`,
        `<p><strong><code>CallerRunsPolicy</code> is the most useful rejection handler</strong> because it provides backpressure rather than failure: when the pool and queue are full, the submitting thread executes the task itself. That thread is then not submitting more work, so intake naturally slows to match capacity. For a request-handling service that is usually better than dropping work or throwing.</p>`,
        `<p><strong>Name your threads.</strong> The default names are <code>pool-1-thread-3</code>, which tells you nothing in a dump with four pools. A <code>ThreadFactory</code> that names them after their purpose turns thread-dump analysis from guesswork into reading.</p>`,
        `<p><strong>Virtual threads (Java 21) change the advice for I/O-bound work.</strong> <code>Executors.newVirtualThreadPerTaskExecutor()</code> creates a new virtual thread per task — no pooling, because they are cheap — so the whole exercise of sizing a pool for blocking I/O disappears. Pools remain the right model for CPU-bound work, where the limit is cores rather than thread cost. Knowing which of those two situations you are in is the modern version of this question.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong><code>newFixedThreadPool</code> in production.</strong> Unbounded queue → <code>OutOfMemoryError</code> under load.</li>` +
        `<li><strong><code>newCachedThreadPool</code> in production.</strong> Unbounded threads → the machine dies.</li>` +
        `<li><strong>Expecting <code>maximumPoolSize</code> to matter with an unbounded queue.</strong> It never triggers.</li>` +
        `<li><strong>Assuming <code>shutdown()</code> waits.</strong> It does not — use <code>awaitTermination</code>.</li>` +
        `<li><strong>Ignoring the <code>Future</code>.</strong> Exceptions from <code>submit</code> vanish silently.</li>` +
        `<li><strong>Unguarded scheduled tasks.</strong> One exception cancels the schedule permanently.</li>` +
        `<li><strong>Unnamed threads.</strong> Makes production dumps far harder to read.</li>` +
        `<li><strong>Blocking calls in the common ForkJoinPool.</strong> Chapter 7's parallel-stream problem.</li>` +
        `<li><strong>One pool for everything.</strong> Slow tasks starve fast ones; isolate by workload.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "How does <code>ThreadPoolExecutor</code> decide what to do with a task?"</strong><br>A: In order: if fewer than <code>corePoolSize</code> threads exist it starts a new one even if others are idle; otherwise it queues the task; only if the queue is full does it grow toward <code>maximumPoolSize</code>; and if that also fails, the rejection handler runs. The counter-intuitive part is that queueing comes before growing, which means <code>maximumPoolSize</code> never takes effect with an unbounded queue.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is wrong with <code>Executors.newFixedThreadPool</code>?"</strong><br>A: It uses an unbounded <code>LinkedBlockingQueue</code>. Under a burst the queue grows without limit until the heap is exhausted, and because the queue never fills, the rejection policy never runs — so there is no backpressure signal at all. <code>newCachedThreadPool</code> has the mirror problem: <code>maximumPoolSize</code> is <code>Integer.MAX_VALUE</code>, so it creates unbounded threads. I construct <code>ThreadPoolExecutor</code> directly with a bounded queue and an explicit rejection policy.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you size a thread pool?"</strong><br>A: By what the tasks do. CPU-bound work wants roughly the number of cores, since more threads just add context switching. I/O-bound work can use many more, because threads are mostly waiting — the usual formula is cores × (1 + wait time / service time). I measure rather than guess. And on Java 21, for I/O-bound work I would use virtual threads and stop sizing a pool at all.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you shut an executor down properly?"</strong><br>A: <code>shutdown()</code> to stop new submissions, then <code>awaitTermination</code> with a timeout, then <code>shutdownNow()</code> if it has not finished, then await again. <code>shutdown()</code> alone returns immediately and does not wait, which is the usual mistake. And <code>shutdownNow()</code> only interrupts — a task that ignores interruption will keep running.</p></blockquote>`,
        `<blockquote><p><strong>Q: "A task submitted to an executor throws. What happens?"</strong><br>A: With <code>submit()</code>, the exception is captured in the <code>Future</code> and surfaces only when someone calls <code>get()</code>, wrapped in <code>ExecutionException</code> — so if nobody checks, it disappears entirely. With <code>execute()</code>, it propagates to the thread's uncaught-exception handler. The safest pattern is to catch inside the task so failures are always logged.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Which rejection policy would you choose?"</strong><br>A: <code>CallerRunsPolicy</code> for most server workloads, because it gives backpressure rather than failure — the submitting thread runs the task, so it stops submitting and intake slows to match capacity. <code>AbortPolicy</code>, the default, is right when the caller can handle rejection meaningfully. The discard policies are rarely acceptable, since they lose work silently.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Order: <strong>core threads → queue → grow to max → reject</strong>. Queue fills <em>before</em> the pool grows.</li>` +
        `<li><strong>Unbounded queue ⇒ <code>maximumPoolSize</code> is dead code.</strong></li>` +
        `<li>Avoid <code>newFixedThreadPool</code> (unbounded queue) and <code>newCachedThreadPool</code> (unbounded threads).</li>` +
        `<li>Construct <code>ThreadPoolExecutor</code> with a <strong>bounded queue</strong> + <strong><code>CallerRunsPolicy</code></strong> for backpressure.</li>` +
        `<li>Size: CPU-bound ≈ cores; I/O-bound ≈ cores × (1 + wait/service). <strong>Measure.</strong></li>` +
        `<li>Shutdown: <code>shutdown()</code> → <code>awaitTermination</code> → <code>shutdownNow()</code> → await. <code>shutdown()</code> does <strong>not</strong> wait.</li>` +
        `<li><code>submit()</code> hides exceptions in the <code>Future</code>; <code>execute()</code> surfaces them.</li>` +
        `<li>A scheduled task that throws is <strong>cancelled forever</strong> — always try/catch inside.</li>` +
        `<li><strong>Name your threads.</strong> Isolate pools by workload.</li>` +
        `<li>Java 21 I/O-bound → <code>newVirtualThreadPerTaskExecutor()</code>, no sizing needed.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'CompletableFuture and Asynchronous Composition',
      slug: 'completablefuture',
      order: 6,
      content: [
        `<h2>Why it matters</h2>`,
        `<p><code>Future</code> was Java 5's answer to asynchronous work, and it is barely usable: the only way to get the result is <code>get()</code>, which blocks. You cannot chain, combine, or handle failure without blocking first. <code>CompletableFuture</code> fixes all of it, and it is the standard way modern Java composes asynchronous calls — which makes "call three services and combine the results" a very common interview exercise.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A <code>CompletableFuture&lt;T&gt;</code> is a promise of a value that will exist later, with methods to describe what should happen when it does — without blocking.</p>`,
        `{{fig:ch8-completablefuture.svg|Top compares a blocked Future.get with a chained CompletableFuture pipeline; bottom shows three groups of methods for transform combine and failure handling|The API divides cleanly into three groups: transform one result, combine several, and handle failure. Learning which group you need is most of the battle.}}`,
        `<h2>How it works</h2>`,
        `<p><strong>Starting async work:</strong> <code>supplyAsync(supplier)</code> when it returns a value, <code>runAsync(runnable)</code> when it does not. Both take an optional <code>Executor</code> — <strong>and you should almost always pass one</strong>, because the default is the shared <code>ForkJoinPool.commonPool()</code> with all the problems from Chapter 7.</p>`,
        `<p><strong>The naming convention is regular</strong>, which makes the large API learnable:</p>`,
        `<ul>` +
        `<li><code>thenApply</code> — transform the value (like <code>map</code>).</li>` +
        `<li><code>thenCompose</code> — the function returns another future (like <code>flatMap</code>). Prevents <code>CompletableFuture&lt;CompletableFuture&lt;T&gt;&gt;</code>.</li>` +
        `<li><code>thenAccept</code> — consume the value, return nothing.</li>` +
        `<li><code>thenRun</code> — run something, ignoring the value.</li>` +
        `<li><code>thenCombine</code> — merge two independent futures.</li>` +
        `<li>The <strong><code>Async</code> suffix</strong> on any of these runs the callback on a different thread rather than the one that completed the previous stage.</li>` +
        `</ul>`,
        `<p><strong>Failure handling</strong> is where <code>CompletableFuture</code> differs most from synchronous code: an exception does not propagate — it completes the future <em>exceptionally</em>, and every downstream stage is skipped until something handles it. If nothing does and nobody calls <code>join()</code>, the failure is completely silent.</p>`,
        `<h2>Code examples</h2>`,
        `<pre><code class="language-java">// ⚠ Always pass an executor — the default is the shared common pool.
ExecutorService io = Executors.newFixedThreadPool(20);

CompletableFuture&lt;String&gt; f = CompletableFuture
    .supplyAsync(() -&gt; fetchUser(id), io)
    .thenApply(User::email)                       // transform
    .thenApply(String::toLowerCase);

// thenCompose when the function returns ANOTHER future — the flatMap case:
CompletableFuture&lt;Order&gt; order = CompletableFuture
    .supplyAsync(() -&gt; fetchUser(id), io)
    .thenCompose(user -&gt; fetchLatestOrder(user, io));   // not thenApply!
// thenApply here would give CompletableFuture&lt;CompletableFuture&lt;Order&gt;&gt;.</code></pre>`,
        `<p>Combining, which is the classic interview task — three calls in parallel:</p>`,
        `<pre><code class="language-java">CompletableFuture&lt;Profile&gt; profile = supplyAsync(() -&gt; fetchProfile(id), io);
CompletableFuture&lt;List&lt;Order&gt;&gt; orders = supplyAsync(() -&gt; fetchOrders(id), io);
CompletableFuture&lt;Prefs&gt; prefs = supplyAsync(() -&gt; fetchPrefs(id), io);

// All three run concurrently; total latency ≈ the SLOWEST, not the sum.
CompletableFuture&lt;Dashboard&gt; dashboard =
    CompletableFuture.allOf(profile, orders, prefs)
        .thenApply(v -&gt; new Dashboard(
            profile.join(),      // ✔ safe — allOf guarantees completion
            orders.join(),
            prefs.join()));

// ⚠ allOf returns CompletableFuture&lt;Void&gt; — it does NOT collect results.
//   You still join() each one, which is safe only after allOf completes.

// Two futures with a combining function:
CompletableFuture&lt;String&gt; both = profile.thenCombine(prefs,
        (p, pr) -&gt; p.name() + " likes " + pr.theme());

// First one to finish wins — useful for hedged requests:
CompletableFuture&lt;Object&gt; fastest = CompletableFuture.anyOf(replicaA, replicaB);</code></pre>`,
        `<p>Failure handling, including the timeout everyone forgets:</p>`,
        `<pre><code class="language-java">CompletableFuture&lt;String&gt; safe = supplyAsync(this::riskyCall, io)
    .orTimeout(2, TimeUnit.SECONDS)               // Java 9+ — fail if slow
    .exceptionally(ex -&gt; {                        // recover with a fallback
        log.warn("call failed, using cache", ex);
        return cache.get(id);
    });

// handle() sees BOTH outcomes in one place:
CompletableFuture&lt;String&gt; h = supplyAsync(this::riskyCall, io)
    .handle((value, ex) -&gt; ex != null ? "fallback" : value.toUpperCase());

// whenComplete() observes without changing the result — good for logging:
future.whenComplete((v, ex) -&gt; {
    if (ex != null) log.error("failed", ex); else log.info("ok: {}", v);
});

// ⚠ The exception you catch is wrapped in CompletionException:
future.exceptionally(ex -&gt; {
    Throwable cause = ex instanceof CompletionException ? ex.getCause() : ex;
    return handleByType(cause);
});

// ⚠ SILENT FAILURE: with no exceptionally/handle and no join(), a failed
//   future is simply discarded. Nothing is logged. Always terminate a chain
//   with failure handling.
supplyAsync(this::riskyCall, io).thenAccept(this::use);   // ✘ swallows errors</code></pre>`,
        `<p><code>join()</code> versus <code>get()</code>:</p>`,
        `<pre><code class="language-java">future.get();     // throws CHECKED InterruptedException + ExecutionException
future.join();    // throws UNCHECKED CompletionException — usable in lambdas
// join() is the one you want inside stream pipelines and callbacks.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>The default executor is a real hazard.</strong> Without an explicit <code>Executor</code>, async stages run on <code>ForkJoinPool.commonPool()</code> — shared JVM-wide, sized to cores minus one, and designed for short CPU-bound work. Blocking HTTP calls there starve every other user of that pool, including parallel streams in library code. Passing your own executor is not a refinement; it is the correct default.</p>`,
        `<p><strong>Which thread runs a callback</strong> is subtler than it looks. A non-<code>Async</code> method such as <code>thenApply</code> may run on the thread that completed the previous stage — or on the calling thread, if the future was already complete when you attached it. So the same code can execute on different threads run to run. Use the <code>Async</code> variants with an explicit executor when it matters, and never assume a callback is on a particular thread.</p>`,
        `<p><strong>Ordering pitfall:</strong> <code>supplyAsync(a).thenApply(b)</code> runs a and b <em>sequentially</em>. Only independent futures created up front run concurrently. A very common mistake is chaining three service calls with <code>thenCompose</code> and expecting parallelism — they are a pipeline, and the latency is the sum.</p>`,
        `<p><strong>Java 21 alternative:</strong> with virtual threads, plain blocking code inside a structured-concurrency scope achieves the same fan-out with far less ceremony, because blocking is cheap. <code>CompletableFuture</code> remains the standard for now and for pre-21 codebases, but "how would you write this on Java 21?" is an increasingly common follow-up.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Not passing an executor.</strong> Blocking work lands on the shared common pool.</li>` +
        `<li><strong><code>thenApply</code> where <code>thenCompose</code> is needed.</strong> Produces a nested future.</li>` +
        `<li><strong>No failure handling.</strong> A failed future with no <code>join()</code> fails completely silently.</li>` +
        `<li><strong>Expecting <code>allOf</code> to return results.</strong> It returns <code>Void</code>; join each future afterwards.</li>` +
        `<li><strong>Calling <code>join()</code> too early.</strong> That blocks and discards the point of the API.</li>` +
        `<li><strong>Chaining and expecting parallelism.</strong> A chain is sequential; create futures up front to run concurrently.</li>` +
        `<li><strong>Forgetting the <code>CompletionException</code> wrapper.</strong> Unwrap with <code>getCause()</code>.</li>` +
        `<li><strong>No timeout.</strong> A hanging dependency hangs the chain forever — use <code>orTimeout</code>.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "<code>Future</code> vs <code>CompletableFuture</code>?"</strong><br>A: <code>Future</code> only lets you poll or block on <code>get()</code> — no chaining, no combining, no callbacks, no failure handling without blocking first. <code>CompletableFuture</code> implements <code>CompletionStage</code>, so you can describe what happens when the value arrives: transform it, compose further async calls, combine several futures, handle exceptions, and apply timeouts — all without blocking a thread.</p></blockquote>`,
        `<blockquote><p><strong>Q: "<code>thenApply</code> or <code>thenCompose</code>?"</strong><br>A: <code>thenApply</code> when the function returns a plain value; <code>thenCompose</code> when it returns another <code>CompletableFuture</code>. It is exactly <code>map</code> versus <code>flatMap</code> — using <code>thenApply</code> for an async call gives you a <code>CompletableFuture&lt;CompletableFuture&lt;T&gt;&gt;</code> that you then have to unwrap.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Call three services in parallel and combine the results."</strong><br>A: Create all three futures with <code>supplyAsync</code> and an explicit executor so they start immediately, then <code>allOf(a, b, c).thenApply(v -&gt; combine(a.join(), b.join(), c.join()))</code>. Total latency is the slowest call rather than the sum. The detail people miss is that <code>allOf</code> returns <code>CompletableFuture&lt;Void&gt;</code> — it signals completion but does not collect results, so you still join each one, which is safe at that point.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Which thread runs the callbacks?"</strong><br>A: Without an explicit executor, the common <code>ForkJoinPool</code> — shared across the JVM and sized for CPU work, so blocking calls there starve everything else. Non-<code>Async</code> methods may also run on whichever thread completed the previous stage, or even the caller if the future was already complete. So I always pass my own executor for anything blocking and never assume which thread a callback is on.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you handle failures?"</strong><br>A: <code>exceptionally</code> to recover with a fallback, <code>handle</code> to deal with success and failure in one place, or <code>whenComplete</code> to observe without altering the result. The critical thing is that an exception completes the future exceptionally rather than propagating — downstream stages are skipped, and if nothing handles it and nobody joins, the failure is completely silent. I also add <code>orTimeout</code>, because otherwise a hung dependency hangs the chain forever.</p></blockquote>`,
        `<blockquote><p><strong>Q: "<code>get()</code> or <code>join()</code>?"</strong><br>A: Both block; the difference is the exceptions. <code>get()</code> throws checked <code>InterruptedException</code> and <code>ExecutionException</code>; <code>join()</code> throws unchecked <code>CompletionException</code>, which makes it usable inside lambdas and streams where checked exceptions are not allowed. Either way, calling one early defeats the purpose — the value of the API is not blocking.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><code>supplyAsync</code>/<code>runAsync</code> to start — <strong>always pass an <code>Executor</code></strong> (default is the shared common pool).</li>` +
        `<li><code>thenApply</code> = map · <strong><code>thenCompose</code> = flatMap</strong> · <code>thenAccept</code>/<code>thenRun</code> = consume.</li>` +
        `<li><code>thenCombine</code> (two) · <code>allOf</code> (all, returns <strong><code>Void</code></strong>) · <code>anyOf</code> (first).</li>` +
        `<li><code>exceptionally</code> · <code>handle</code> · <code>whenComplete</code> · <strong><code>orTimeout</code></strong>.</li>` +
        `<li><strong>Unhandled failure with no join = completely silent.</strong></li>` +
        `<li>Exceptions arrive wrapped in <code>CompletionException</code> — unwrap with <code>getCause()</code>.</li>` +
        `<li><strong>A chain is sequential</strong>; create futures up front for parallelism.</li>` +
        `<li><code>join()</code> = unchecked (lambda-friendly) · <code>get()</code> = checked.</li>` +
        `<li>Java 21: virtual threads + structured concurrency do this with plain blocking code.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Atomics, CAS and Lock-Free Concurrency',
      slug: 'atomics-and-cas',
      order: 7,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Atomics are the layer between "no synchronisation" and "a lock", and they are how the fastest concurrent code in Java is written — <code>ConcurrentHashMap</code>, the executors, <code>AQS</code> itself are all built on them. Interviewers ask about compare-and-swap because it explains how lock-free code is possible at all, and because knowing when CAS is <em>worse</em> than a lock shows judgement rather than enthusiasm.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>An atomic class wraps a value and offers operations that are indivisible without any lock. <code>AtomicInteger.incrementAndGet()</code> fixes the <code>count++</code> race from earlier in this chapter with no blocking at all.</p>`,
        `<p>It works with <strong>compare-and-swap</strong>, a single CPU instruction meaning "if this location still holds the value I expect, replace it; otherwise tell me you failed":</p>`,
        `{{fig:ch8-cas.svg|A three step loop reading the current value computing the next and attempting compareAndSet with success ending and failure looping back plus panels on low and high contention|The retry loop is the whole idea. Nobody blocks — a thread that loses the race simply re-reads and tries again, which is fast when contention is low and wasteful when it is high.}}`,
        `<h2>How it works</h2>`,
        `<p>The classes worth knowing:</p>`,
        `<table><thead><tr><th>Class</th><th>Use</th></tr></thead><tbody>` +
        `<tr><td><code>AtomicInteger</code> / <code>AtomicLong</code></td><td>Counters, sequence numbers</td></tr>` +
        `<tr><td><code>AtomicBoolean</code></td><td>One-shot flags — "has this run?"</td></tr>` +
        `<tr><td><code>AtomicReference&lt;T&gt;</code></td><td>Lock-free swapping of an object</td></tr>` +
        `<tr><td><code>LongAdder</code> / <code>DoubleAdder</code></td><td><strong>High-contention counters</strong> — much faster than <code>AtomicLong</code></td></tr>` +
        `<tr><td><code>AtomicStampedReference</code></td><td>Adds a version stamp to defeat the ABA problem</td></tr>` +
        `</tbody></table>`,
        `<p><strong>CAS beats locking at low contention</strong> because nothing blocks: no context switch, no scheduler involvement, no parked threads. <strong>It loses at high contention</strong>, because many threads spin and retry, burning CPU on work that is thrown away. That is exactly the trade-off <code>LongAdder</code> addresses.</p>`,
        `<h2>Code examples</h2>`,
        `<pre><code class="language-java">// The race from earlier, fixed without a lock:
private final AtomicInteger count = new AtomicInteger();
count.incrementAndGet();          // atomic read-modify-write

// Atomic compute — the retry loop, written for you:
AtomicInteger max = new AtomicInteger();
max.updateAndGet(current -&gt; Math.max(current, newValue));
max.accumulateAndGet(newValue, Math::max);      // equivalent

// ⚠ The function may run MORE THAN ONCE if the CAS fails and retries,
//   so it must be pure — no side effects, no logging, no I/O.

// Lock-free object swap:
AtomicReference&lt;Config&gt; config = new AtomicReference&lt;&gt;(initial);
config.updateAndGet(c -&gt; c.withTimeout(5000));

// One-shot initialisation, without synchronized:
private final AtomicBoolean started = new AtomicBoolean();
public void start() {
    if (started.compareAndSet(false, true)) {   // ✔ exactly one winner
        doStart();
    }
}</code></pre>`,
        `<p><code>LongAdder</code>, the answer to "our counter is a bottleneck":</p>`,
        `<pre><code class="language-java">// ✘ Under heavy contention every thread CASes the SAME memory location.
//   They also fight over the same cache line, so the cores spend their time
//   invalidating each other — false sharing.
private final AtomicLong requests = new AtomicLong();
requests.incrementAndGet();

// ✔ LongAdder keeps several internal cells and lets threads hit different
//   ones, summing only when read. Dramatically faster under contention.
private final LongAdder requests = new LongAdder();
requests.increment();
long total = requests.sum();      // ⚠ approximate if writes are in flight

// Rule of thumb: metrics and counters you write constantly and read rarely
// → LongAdder. A value you need exactly and immediately → AtomicLong.</code></pre>`,
        `<p>The ABA problem, which is the classic follow-up:</p>`,
        `<pre><code class="language-java">// CAS only asks "is the value still what I expect?" — not "has it changed
// and changed back?". Thread 1 reads A; thread 2 changes A→B→A; thread 1's
// CAS succeeds, even though the world moved underneath it. For a counter
// that is harmless; for a stack popping nodes it can corrupt the structure.

// ✔ AtomicStampedReference pairs the value with a version that always
//   increments, so A→B→A is detectable.
AtomicStampedReference&lt;Node&gt; top = new AtomicStampedReference&lt;&gt;(head, 0);

int[] stamp = new int[1];
Node current = top.get(stamp);
top.compareAndSet(current, current.next, stamp[0], stamp[0] + 1);</code></pre>`,
        `<p>And the limit of atomics — when you need a lock instead:</p>`,
        `<pre><code class="language-java">// ✘ Two atomics are individually atomic and NOT atomic together.
private final AtomicInteger low = new AtomicInteger();
private final AtomicInteger high = new AtomicInteger();
// Another thread can observe low > high between the two updates.

// ✔ One atomic reference to an immutable object holding BOTH values —
//   the whole state changes in a single CAS.
private record Range(int low, int high) { }
private final AtomicReference&lt;Range&gt; range = new AtomicReference&lt;&gt;(new Range(0, 0));
range.updateAndGet(r -&gt; new Range(r.low(), r.high() + 1));

// This is the general technique: make the state immutable, then swap the
// whole thing atomically. If it does not fit that shape, use a lock.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p>Atomics compile down to <code>VarHandle</code> operations (Java 9+, previously <code>sun.misc.Unsafe</code>) which map onto the CPU's native CAS instruction — <code>lock cmpxchg</code> on x86, load-linked/store-conditional on ARM. There is no lock and no kernel involvement, which is the source of the performance.</p>`,
        `<p><strong>Atomics also give volatile semantics.</strong> Every atomic read and write carries the same visibility and ordering guarantees as a <code>volatile</code> field, so <code>AtomicInteger</code> is <em>both</em> atomic and visible — a strict upgrade over <code>volatile int</code> when the value is ever incremented.</p>`,
        `<p><strong>False sharing</strong> explains why <code>LongAdder</code> is so much faster, and is a good detail to have ready. Cores exchange memory in 64-byte cache lines, so two unrelated variables on the same line cause the cores to invalidate each other's caches on every write. <code>LongAdder</code>'s cells are padded onto separate lines (the <code>@Contended</code> annotation), which is why it scales where a single <code>AtomicLong</code> does not.</p>`,
        `<p><strong>Lock-free is not wait-free.</strong> "Lock-free" guarantees the <em>system</em> makes progress — some thread always succeeds. It does not guarantee any <em>individual</em> thread does: an unlucky thread can retry indefinitely while others keep winning. That is a real distinction, and a good precise answer to a question people usually answer loosely.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Assuming several atomics are collectively atomic.</strong> Each operation is; the sequence is not. Use one <code>AtomicReference</code> to an immutable object, or a lock.</li>` +
        `<li><strong>Side effects inside <code>updateAndGet</code>.</strong> The function can run several times on retry.</li>` +
        `<li><strong><code>AtomicLong</code> for a hot metric.</strong> Use <code>LongAdder</code> under contention.</li>` +
        `<li><strong>Ignoring ABA</strong> in structures where identity matters. Use <code>AtomicStampedReference</code>.</li>` +
        `<li><strong>Reading <code>get()</code> then writing <code>set()</code>.</strong> That is a race again — use <code>compareAndSet</code> or <code>updateAndGet</code>.</li>` +
        `<li><strong>Treating <code>LongAdder.sum()</code> as exact.</strong> It is approximate while writes are in flight.</li>` +
        `<li><strong>Reaching for atomics when a lock is clearer.</strong> Complex invariants belong under a lock.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is compare-and-swap?"</strong><br>A: A single CPU instruction that atomically checks whether a memory location still holds an expected value and, if so, replaces it — reporting success or failure. Atomic classes wrap it in a retry loop: read the current value, compute the new one, attempt the swap, and start over if another thread got there first. No thread ever blocks.</p></blockquote>`,
        `<blockquote><p><strong>Q: "When is CAS better than a lock, and when is it worse?"</strong><br>A: Better at low to moderate contention, because nothing blocks — no context switch, no scheduler. Worse at high contention, because many threads spin and retry, burning CPU on work that gets discarded, whereas a lock would park them. It is also worse whenever the invariant spans several fields, since CAS is inherently single-location.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why does <code>LongAdder</code> beat <code>AtomicLong</code>?"</strong><br>A: <code>AtomicLong</code> has every thread CASing one memory location, so under contention they retry constantly and, because they share a cache line, invalidate each other's caches — false sharing. <code>LongAdder</code> keeps multiple padded cells and lets threads increment different ones, summing on read. So it is much faster to write and slightly more expensive to read, which suits metrics: written constantly, read occasionally.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is the ABA problem?"</strong><br>A: CAS only asks whether the value is still what you expected, not whether it changed and changed back. If a thread reads A, another changes it to B and back to A, the first thread's CAS succeeds even though the state moved underneath it. Harmless for a counter; genuinely dangerous for something like a lock-free stack, where a node may have been recycled. <code>AtomicStampedReference</code> solves it by pairing the value with a version that always increments.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Do atomics give you visibility as well?"</strong><br>A: Yes — every atomic read and write has the same memory-model semantics as a <code>volatile</code> access. So <code>AtomicInteger</code> gives you visibility and atomicity, which makes it a strict improvement over <code>volatile int</code> whenever the value is updated based on its previous value.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you make two related values change atomically without a lock?"</strong><br>A: Put them in one immutable object and hold a single <code>AtomicReference</code> to it, then swap the whole object with <code>updateAndGet</code>. Two separate atomics are individually atomic but not collectively, so another thread can observe an inconsistent pair between the updates. If the state does not fit that shape, that is the signal to use a lock instead.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><strong>CAS</strong> = "if still X, set to Y" in one CPU instruction, wrapped in a <strong>retry loop</strong>.</li>` +
        `<li>Atomics give <strong>atomicity AND volatile visibility</strong>.</li>` +
        `<li>Better than a lock at <strong>low contention</strong>; worse at high (spinning burns CPU).</li>` +
        `<li><strong><code>LongAdder</code> for hot counters</strong> — padded cells beat one contended location; <code>sum()</code> is approximate.</li>` +
        `<li><code>updateAndGet</code>/<code>accumulateAndGet</code> functions must be <strong>pure</strong> — they can re-run.</li>` +
        `<li><strong>ABA</strong>: value returned to its old state undetected → <code>AtomicStampedReference</code>.</li>` +
        `<li>Several atomics ≠ one atomic operation → <strong>one <code>AtomicReference</code> to an immutable object</strong>, or a lock.</li>` +
        `<li><strong>Lock-free ≠ wait-free</strong>: the system progresses; an individual thread may starve.</li>` +
        `<li>False sharing: 64-byte cache lines, fixed with padding (<code>@Contended</code>).</li>` +
        `</ul>`,
      ].join('\n'),
    },
  ],
};
