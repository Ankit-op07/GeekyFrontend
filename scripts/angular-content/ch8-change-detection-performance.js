module.exports = {
  title: 'Change Detection, Performance & Advanced',
  slug: 'change-detection-performance',
  order: 7,
  topics: [
    {
      title: 'Change Detection: Default vs OnPush',
      slug: 'change-detection-strategies',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Change detection (CD) is the engine that keeps the DOM in sync with your component state. When a value in your class changes, something has to notice and re-render the affected bindings. That "something" is Angular's change detector. In small apps you never think about it — Angular just works. But as component trees grow to hundreds of nodes, the <em>Default</em> strategy re-checks every component on every async event, and that becomes the single biggest source of jank. <code>OnPush</code> is the primary lever a senior engineer pulls to fix it, which is exactly why interviewers open with "explain change detection" and then push on "how would you make this list scroll smoothly?"</p>`,
        `<p>Getting CD wrong produces two opposite bugs that both look mysterious: the view <strong>won't update</strong> when you expect it to (you mutated an object under OnPush), or the view updates <strong>far too often</strong> (Default, thrashing on every mousemove). Understanding what triggers CD and what OnPush actually skips is what separates people who "use Angular" from people who can reason about it. This is also the foundation for everything else in this chapter: zoneless, signals, <code>trackBy</code>, and performance profiling all build on the mental model you form here.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>Angular arranges components into a <strong>tree</strong>. Each component has its own change detector (a <code>LView</code> in Ivy terms). A CD "tick" walks the tree top-to-bottom, and for each component it compares the current value of every template binding against the previous value — a reference/identity check via <code>Object.is</code>. If a value differs, it updates the DOM for that binding. It never diffs the whole DOM; it only re-evaluates the expressions you bound in templates.</p>`,
        `<p>A tick is triggered by an <strong>async event</strong> that Zone.js has patched: a DOM event (click, input), a timer (<code>setTimeout</code>, <code>setInterval</code>), an XHR/fetch completing, or a resolved Promise. After any of these, Angular runs CD from the root by default. The two strategies differ in <em>which</em> components get checked during that walk.</p>`,
        `{{fig:ch8-change-detection.svg|Default vs OnPush change detection|OnPush skips a component's subtree unless an input reference changes, an event fires inside it, or an async/signal value emits.}}`,
        `<table>`,
        `<thead><tr><th></th><th>Default</th><th>OnPush</th></tr></thead>`,
        `<tbody>`,
        `<tr><td>When checked</td><td>Every component, every tick</td><td>Only when marked dirty</td></tr>`,
        `<tr><td>Triggers</td><td>Any async event, anywhere</td><td>Input ref change, event in it, async pipe/signal, markForCheck()</td></tr>`,
        `<tr><td>Cost</td><td>O(all components)</td><td>O(dirty subtrees)</td></tr>`,
        `<tr><td>Data model</td><td>Tolerates mutation</td><td>Requires immutability</td></tr>`,
        `<tr><td>Best for</td><td>Small apps, quick prototypes</td><td>Large trees, lists, dashboards</td></tr>`,
        `</tbody></table>`,
        `<p><strong>Default</strong> is safe but blunt: it re-checks the entire tree on every event, so a mousemove handler somewhere can re-evaluate thousands of bindings. <strong>OnPush</strong> is a contract: "only re-check me when one of my inputs is a new reference, an event fires inside me, an async pipe or signal I read emits, or I explicitly call <code>markForCheck()</code>." If you honour immutability, OnPush lets Angular prune whole branches of the tree it knows can't have changed.</p>`,

        `<h2>How it works</h2>`,
        `<p>Under the hood every view carries a set of flags. The two that matter are <code>Dirty</code> (this view needs checking) and <code>CheckAlways</code> (Default components — always checked). When something schedules a tick, <code>ApplicationRef.tick()</code> calls <code>detectChanges()</code> on the root and recurses into children.</p>`,
        `{{fig:ch8-cd-tree.svg|Change-detection tree traversal and dirty marking|A tick walks top-down; OnPush subtrees are pruned unless marked dirty, and markForCheck marks the node plus all its ancestors.}}`,
        `<p><strong>Tree traversal.</strong> The walk is depth-first, parent before child. For a Default component the detector always runs its template expressions and updates any changed bindings, then descends. For an OnPush component the detector first checks the dirty flag. If the component is <em>not</em> dirty, the entire subtree is skipped — Angular never even looks at its children. That pruning is where the performance win comes from.</p>`,
        `<p><strong>Dirty marking.</strong> How does an OnPush component become dirty? Angular sets the flag automatically in four cases: (1) an <code>@Input()</code> receives a new reference (compared with <code>Object.is</code> against the previous value); (2) a DOM event bound in that component's template fires (a click handler, for example); (3) the <code>async</code> pipe receives a new emission and calls <code>markForCheck()</code> internally; (4) you inject <code>ChangeDetectorRef</code> and call <code>markForCheck()</code> yourself. Signals add a fifth: reading a signal in the template registers the view as a consumer, so setting the signal marks the view dirty.</p>`,
        `<p><strong>Why ancestors get marked.</strong> Here is the subtlety interviewers love. If a deeply nested OnPush leaf becomes dirty but its OnPush parents are clean, the top-down walk would prune the parent and never reach the leaf. So <code>markForCheck()</code> doesn't just mark the current view — it walks <em>up</em> the tree marking every ancestor as dirty too, guaranteeing the next tick has an unbroken path down to the dirty leaf. The marks are consumed on the next tick; after the leaf is checked, the flags are cleared.</p>`,
        `<p><strong>detectChanges vs markForCheck.</strong> These are different tools. <code>markForCheck()</code> is asynchronous in spirit: it flags views dirty and lets the <em>next</em> scheduled tick do the work. <code>detectChanges()</code> is synchronous: it runs CD on this view and its children <em>right now</em>, outside the normal cycle. <code>detach()</code> removes a view from the tree entirely so it is never checked until you <code>reattach()</code> — useful for a component that manages its own rendering (e.g. an animation loop or a stock ticker you throttle by hand).</p>`,
        `<p><strong>The OnPush skip rules, precisely.</strong> An OnPush view is skipped on a tick when all of the following hold: no bound input changed reference, no event fired within it since the last check, no async/signal dependency emitted, and no code called <code>markForCheck()</code> on it. Mutating an object <em>in place</em> (<code>this.user.name = 'X'</code>) changes no reference, so OnPush will not notice — this is the number-one OnPush bug. Reassigning (<code>this.user = { ...this.user, name: 'X' }</code>) creates a new reference and the input check fires.</p>`,
        `<p><strong>ExpressionChangedAfterItHasBeenCheckedError.</strong> In dev mode Angular runs CD twice per tick and compares. If a binding's value changed between the two passes, it throws this error — a signal that a parent's rendered value depends on something a child mutated during CD. The fix is usually to move the mutation out of the CD cycle (into <code>ngOnInit</code> with proper sequencing, or a microtask) rather than to suppress the check.</p>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. OnPush with immutable updates.</strong> The component only re-renders when it receives a genuinely new <code>user</code> reference.</p>`,
        `<pre><code class="language-typescript">import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-user-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`&lt;h3&gt;{{ user.name }}&lt;/h3&gt;&lt;p&gt;{{ user.email }}&lt;/p&gt;\`,
})
export class UserCardComponent {
  @Input({ required: true }) user!: { name: string; email: string };
}

// Parent — this UPDATES the card (new reference):
this.user = { ...this.user, name: 'Ada' };
// This does NOT update an OnPush card (same reference, mutated in place):
this.user.name = 'Ada';</code></pre>`,
        `<p><strong>2. Signals with OnPush — the modern default.</strong> Signals notify the view directly, so you rarely touch <code>ChangeDetectorRef</code> anymore.</p>`,
        `<pre><code class="language-typescript">import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    &lt;p&gt;Count: {{ count() }} — Doubled: {{ doubled() }}&lt;/p&gt;
    &lt;button (click)="inc()"&gt;+1&lt;/button&gt;
  \`,
})
export class CounterComponent {
  count = signal(0);
  doubled = computed(() =&gt; this.count() * 2);
  inc() { this.count.update(n =&gt; n + 1); } // marks the view dirty automatically
}</code></pre>`,
        `<p><strong>3. Manual control with ChangeDetectorRef.</strong> When data arrives from a non-Angular source (a WebSocket, a third-party SDK callback) you may need to nudge CD by hand.</p>`,
        `<pre><code class="language-typescript">import { Component, ChangeDetectionStrategy, ChangeDetectorRef, NgZone } from '@angular/core';

@Component({ /* ... */ changeDetection: ChangeDetectionStrategy.OnPush })
export class TickerComponent {
  price = 0;
  constructor(private cdr: ChangeDetectorRef, private zone: NgZone) {}

  connect(socket: WebSocket) {
    socket.onmessage = (e) =&gt; {
      // Runs outside Angular's knowledge → re-enter and mark dirty:
      this.zone.run(() =&gt; {
        this.price = JSON.parse(e.data).price;
        this.cdr.markForCheck();
      });
    };
  }
}</code></pre>`,
        `<p><strong>4. Detaching for a self-managed view.</strong> A component that renders on its own schedule can detach from the global tick and detect changes on its own timer.</p>`,
        `<pre><code class="language-typescript">constructor(private cdr: ChangeDetectorRef) {
  this.cdr.detach();                       // never checked by app-wide ticks
  setInterval(() =&gt; this.cdr.detectChanges(), 500); // render at 2fps by choice
}</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Mutating objects/arrays in place under OnPush.</strong> <code>this.items.push(x)</code> or <code>this.user.name = 'X'</code> keeps the same reference, so the input check never fires and the view goes stale. Always create a new reference (<code>[...this.items, x]</code>, <code>{ ...this.user }</code>).</li>`,
        `<li><strong>Assuming OnPush means "check on data change".</strong> It means "check on <em>reference</em> change / event / signal". Reference identity, not deep equality, is the rule.</li>`,
        `<li><strong>Confusing markForCheck with detectChanges.</strong> <code>markForCheck()</code> schedules; <code>detectChanges()</code> runs now. Calling <code>detectChanges()</code> in a tight loop re-runs CD synchronously each time and can be slower than one scheduled tick.</li>`,
        `<li><strong>Doing heavy work in template expressions or getters.</strong> Every binding is re-evaluated on each check. A <code>{{ expensiveCompute() }}</code> in the template runs on every tick. Move it to a <code>computed()</code> signal or a pure pipe.</li>`,
        `<li><strong>Reading form state or child values during CD.</strong> Triggers <code>ExpressionChangedAfterItHasBeenCheckedError</code> in dev. Sequence the mutation outside the current cycle.</li>`,
        `<li><strong>Leaving everything Default and blaming Angular for jank.</strong> The default is correctness-first, not performance-first. Large trees need OnPush (or zoneless) applied deliberately.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Make OnPush your default for leaf and list-item components.</strong> Treat inputs as immutable and the strategy becomes free correctness plus speed.</li>`,
        `<li><strong>Reach for signals over manual <code>ChangeDetectorRef</code>.</strong> Signals give fine-grained, automatic dirty marking and are the direction the framework is heading (zoneless).</li>`,
        `<li><strong>Push expensive derivations into <code>computed()</code> or pure pipes</strong> so they only recompute when their inputs change, not on every tick.</li>`,
        `<li><strong>Keep component state immutable</strong> — spread updates, <code>readonly</code> where possible. This makes OnPush, memoized selectors, and debugging all easier.</li>`,
        `<li><strong>Profile before optimising.</strong> Use Angular DevTools' profiler to see which components are being checked and how long each tick takes; optimise the hot ones, not everything.</li>`,
        `<li><strong>Use <code>runOutsideAngular</code> for high-frequency non-UI work</strong> (scroll/mousemove analytics, animation frames) so it doesn't trigger ticks.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: What exactly triggers a change-detection cycle?</strong> An async event that Zone.js has patched — DOM events, timers, XHR/fetch, resolved Promises — causes <code>ApplicationRef.tick()</code> to run CD from the root. CD itself doesn't "detect" data changes; it re-evaluates template bindings and compares each with its previous value via <code>Object.is</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: With OnPush, when is a component re-checked?</strong> When a bound input receives a new reference, an event fires inside its template, an async pipe or signal it reads emits, or <code>markForCheck()</code> is called on it. Otherwise its whole subtree is skipped.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): My OnPush view isn't updating after I change the data. Why?</strong> You almost certainly mutated the object/array in place, so the reference is unchanged and the input check doesn't fire. Create a new reference, use a signal, or call <code>markForCheck()</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: Difference between markForCheck() and detectChanges()?</strong> <code>markForCheck()</code> marks the view and all ancestors dirty and defers the actual work to the next scheduled tick. <code>detectChanges()</code> synchronously runs CD on this view and its children immediately, outside the normal cycle.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): Does OnPush make the app faster automatically?</strong> No — it only helps if you honour immutability. If you keep mutating in place you'll fight stale views, and if half the tree is still Default the tick still checks all of it. It's a contract, not a switch.</p></blockquote>`,
        `<blockquote><p><strong>Q: What causes ExpressionChangedAfterItHasBeenCheckedError?</strong> In dev mode Angular runs CD twice and a bound value changed between passes — usually a parent binding depends on state a child mutated during CD. Fix the data flow so the value is stable within a cycle.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>CD tick:</strong> async event → <code>tick()</code> → walk tree top-down → compare bindings via <code>Object.is</code> → update DOM.</li>`,
        `<li><strong>Default:</strong> checks every component every tick (<code>CheckAlways</code>).</li>`,
        `<li><strong>OnPush triggers:</strong> new input ref · event inside · async pipe/signal emit · <code>markForCheck()</code>.</li>`,
        `<li><strong>markForCheck</strong> marks node + ancestors dirty (defers work); <strong>detectChanges</strong> runs CD now; <strong>detach/reattach</strong> opts a view out/in.</li>`,
        `<li><strong>Golden rule:</strong> OnPush wants immutable data — spread updates or use signals.</li>`,
        `<li><strong>Perf:</strong> OnPush on leaves + signals + <code>computed()</code> + profile with Angular DevTools.</li>`,
        `</ul>`,
      ].join('\n')
    },

    {
      title: 'Zone.js & the Zoneless Future',
      slug: 'zonejs-zoneless',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>For a decade, the magic that made Angular "just re-render when data changes" was a library most developers never opened: <strong>Zone.js</strong>. It monkey-patches the browser's async APIs so Angular knows when <em>anything</em> asynchronous finished and can run change detection. That magic is also the source of Angular's oldest performance complaints: because Zone.js only knows that <em>some</em> task ran — not what changed — Angular has to check the whole app afterwards. Angular v18 shipped experimental <strong>zoneless</strong> change detection, and v20 is pushing it toward default. This is one of the most active areas in modern Angular, and interviewers use it to tell who has kept up.</p>`,
        `<p>Understanding Zone.js explains a dozen mysterious behaviours: why <code>setTimeout</code> triggers a re-render, why a third-party callback sometimes <em>doesn't</em>, why <code>runOutsideAngular</code> exists, and why signals are the bridge to a zoneless world. If you can explain what Zone.js patches and why the team wants to remove it, you demonstrate a genuine mental model of the framework rather than surface familiarity.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>A "zone" is an execution context that persists across async operations — think of it as a wrapper around a call stack that survives <code>setTimeout</code> and Promise boundaries. Zone.js creates one zone for Angular (<code>NgZone</code>) and <strong>monkey-patches</strong> every async browser API (<code>addEventListener</code>, <code>setTimeout</code>, <code>setInterval</code>, <code>Promise</code>, <code>XMLHttpRequest</code>, <code>fetch</code>, <code>requestAnimationFrame</code>) so that when a task scheduled inside the zone completes, Zone.js can emit a signal. Angular listens for that signal and runs a change-detection tick.</p>`,
        `{{fig:ch8-zonejs-patching.svg|How Zone.js triggers change detection|Zone.js patches async APIs so NgZone knows when tasks finish and can call ApplicationRef.tick.}}`,
        `<p>The crucial limitation: Zone.js is a <em>coarse</em> signal. It reports "an async task finished," not "this value changed." So Angular's response is to check <em>everything</em> (with Default) or every dirty view (with OnPush). Zoneless removes Zone.js entirely and instead relies on <strong>explicit notifications</strong> — signals, <code>markForCheck()</code>, and the async pipe — to tell Angular precisely which views need checking.</p>`,
        `{{fig:ch8-zoneless-flow.svg|Zoned versus zoneless change detection|Zoned checks broadly after any async task; zoneless schedules targeted CD only when a signal or notification fires.}}`,

        `<h2>How it works</h2>`,
        `<p><strong>Monkey-patching, step by step.</strong> At startup, <code>zone.js</code> replaces the global async functions with wrappers. When your code calls <code>setTimeout(fn, 100)</code>, the patched version records that a "macrotask" is pending in the current zone, then schedules the real timer. When the timer fires, the wrapper runs <code>fn</code> <em>inside the Angular zone</em> and, once the microtask queue drains, <code>NgZone</code> emits <code>onMicrotaskEmpty</code>. Angular's <code>ApplicationRef</code> is subscribed to that event and calls <code>tick()</code>, running CD from the root.</p>`,
        `<p><strong>NgZone events.</strong> <code>NgZone</code> exposes observables: <code>onUnstable</code> (a task started), <code>onMicrotaskEmpty</code> (microtasks drained — the CD trigger), <code>onStable</code> (no more pending work), and <code>onError</code>. The <code>isStable</code> flag and <code>whenStable()</code> promise (used heavily in tests and SSR) build on these. Server-side rendering waits for <code>onStable</code> before serialising the page — a big reason Zone.js has been load-bearing for so long.</p>`,
        `<p><strong>runOutsideAngular.</strong> Sometimes you want async work that should <em>not</em> trigger CD — a scroll listener firing 60 times a second, a game loop, analytics batching. <code>ngZone.runOutsideAngular(fn)</code> executes <code>fn</code> in the parent (non-Angular) zone, so completing tasks inside it never emit <code>onMicrotaskEmpty</code> and never trigger a tick. When you finally have a change worth rendering, you re-enter with <code>ngZone.run(fn)</code> or call <code>markForCheck()</code>. This is the classic fix for "my whole app re-renders on every mousemove."</p>`,
        `<p><strong>Why zoneless.</strong> Zone.js costs roughly 13KB gzipped, patches globals (which can conflict with other libraries and confuse debuggers), and forces coarse-grained CD. The modern alternative: make state changes <em>self-announcing</em>. Signals notify their consuming views directly; the async pipe calls <code>markForCheck()</code>; event bindings mark their view dirty. If every source of change announces itself, Angular doesn't need Zone.js to guess — it schedules a targeted CD only for the views that actually changed.</p>`,
        `<p><strong>provideZonelessChangeDetection.</strong> Enabling it (<code>provideZonelessChangeDetection()</code> in <code>bootstrapApplication</code>) removes the Zone.js dependency and installs a scheduler that coalesces notifications and runs CD via <code>requestAnimationFrame</code>/microtask. In zoneless mode, a bare <code>setTimeout(() =&gt; this.value = 1)</code> will <em>not</em> update the view unless <code>value</code> is a signal or you call <code>markForCheck()</code> — the framework no longer patches the timer. This is the behavioural shift teams must plan for when migrating.</p>`,
        `<p><strong>The migration bridge.</strong> You don't have to jump straight to zoneless. Angular v18 added <code>provideExperimentalZonelessChangeDetection</code>, and the recommended path is: adopt OnPush everywhere, move state to signals and the async pipe, remove reliance on Zone.js side-effects, then flip the provider. Components already written with signals + OnPush usually work zoneless with no changes — that is the whole design intent.</p>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. runOutsideAngular for a high-frequency listener.</strong></p>`,
        `<pre><code class="language-typescript">import { Component, NgZone, ChangeDetectorRef, ElementRef } from '@angular/core';

@Component({ /* ... */ })
export class ScrollTrackerComponent {
  progress = 0;
  constructor(private zone: NgZone, private cdr: ChangeDetectorRef, private el: ElementRef) {}

  ngOnInit() {
    this.zone.runOutsideAngular(() =&gt; {
      window.addEventListener('scroll', () =&gt; {
        const p = Math.round(window.scrollY / 10);
        if (p !== this.progress) {
          this.progress = p;
          this.zone.run(() =&gt; this.cdr.markForCheck()); // re-enter only when it matters
        }
      });
    });
  }
}</code></pre>`,
        `<p><strong>2. Enabling zoneless bootstrap (v18+).</strong> Remove <code>zone.js</code> from <code>polyfills</code> in <code>angular.json</code> and provide the zoneless CD.</p>`,
        `<pre><code class="language-typescript">import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    // ...other providers
  ],
});</code></pre>`,
        `<p><strong>3. Zoneless-safe component — signals announce their own changes.</strong> No Zone.js needed; setting the signal schedules a targeted CD.</p>`,
        `<pre><code class="language-typescript">import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`&lt;p&gt;Elapsed: {{ seconds() }}s&lt;/p&gt;\`,
})
export class TimerComponent {
  seconds = signal(0);
  ngOnInit() {
    // Works zoneless: the signal notifies its view directly.
    setInterval(() =&gt; this.seconds.update(s =&gt; s + 1), 1000);
  }
}</code></pre>`,
        `<p><strong>4. What breaks under zoneless (and the fix).</strong></p>`,
        `<pre><code class="language-typescript">// BEFORE (relies on Zone.js patching setTimeout):
label = 'idle';
run() { setTimeout(() =&gt; this.label = 'done', 500); } // zoneless: view stays 'idle'

// AFTER (self-announcing state):
label = signal('idle');
run() { setTimeout(() =&gt; this.label.set('done'), 500); } // updates in both modes</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Assuming plain property assignments update the view in zoneless mode.</strong> Without Zone.js, a mutated field inside <code>setTimeout</code>/<code>fetch</code> won't trigger CD unless it's a signal or you call <code>markForCheck()</code>.</li>`,
        `<li><strong>Forgetting to re-enter the zone after runOutsideAngular.</strong> Work done outside the zone won't render; you must <code>zone.run()</code> or <code>markForCheck()</code> when a change is worth showing.</li>`,
        `<li><strong>Third-party callbacks that patch or bypass globals.</strong> Some SDKs schedule work in a way Zone.js can't see (native <code>MutationObserver</code>, workers), so the view silently doesn't update — a classic "works in one browser" bug.</li>`,
        `<li><strong>Leaving <code>zone.js</code> in polyfills while providing zoneless CD.</strong> You pay the bundle cost of Zone.js and still ship zoneless behaviour — pick one.</li>`,
        `<li><strong>Relying on <code>NgZone.isStable</code> in app code.</strong> It's a testing/SSR concern; using it for UI logic couples you to Zone.js and blocks a zoneless migration.</li>`,
        `<li><strong>Excessive ticks from libraries.</strong> Charting or map libraries with rAF loops inside the zone can trigger a tick every frame; wrap them in <code>runOutsideAngular</code>.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Write components as if Zone.js didn't exist:</strong> OnPush + signals + async pipe. Such code is automatically zoneless-ready.</li>`,
        `<li><strong>Wrap high-frequency, non-UI async work in <code>runOutsideAngular</code></strong> and re-enter deliberately, so you control exactly when CD runs.</li>`,
        `<li><strong>Prefer signals over manual <code>markForCheck()</code></strong> — they announce changes precisely and survive the zoneless transition unchanged.</li>`,
        `<li><strong>Plan the migration in stages:</strong> OnPush everywhere → signals/async pipe for state → remove Zone.js side-effects → flip <code>provideZonelessChangeDetection()</code>.</li>`,
        `<li><strong>Audit third-party libraries</strong> for Zone.js reliance before going zoneless; test their callbacks update the view.</li>`,
        `<li><strong>Measure bundle and CD cost</strong> before and after; the ~13KB and reduced tick frequency are the concrete wins to report.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: What is Zone.js and what does it actually do?</strong> A library that monkey-patches the browser's async APIs (events, timers, Promises, XHR/fetch) so Angular is notified when async tasks complete. On that signal (<code>onMicrotaskEmpty</code>), <code>ApplicationRef.tick()</code> runs change detection.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why does the team want to remove it?</strong> It's ~13KB, patches globals (conflicts, harder debugging), and only tells Angular that <em>something</em> async ran — not what changed — forcing coarse, whole-tree checks. Zoneless replaces guesswork with explicit notifications.</p></blockquote>`,
        `<blockquote><p><strong>Q: What is runOutsideAngular for?</strong> To run async work in the parent zone so it never triggers a tick — ideal for scroll/mousemove/animation loops. You re-enter with <code>zone.run()</code> or <code>markForCheck()</code> when a real UI change occurs.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): In zoneless mode, does <code>setTimeout(() =&gt; this.x = 1)</code> update the view?</strong> No. Without Zone.js patching the timer, a plain assignment won't schedule CD. Make <code>x</code> a signal (<code>this.x.set(1)</code>) or call <code>markForCheck()</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do signals enable zoneless?</strong> A signal read in a template registers the view as a consumer; setting the signal notifies exactly those views to be checked. That fine-grained, self-announcing model is precisely what removes the need for Zone.js.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): Is Angular fully zoneless today?</strong> Not by default yet. It's opt-in via <code>provideZonelessChangeDetection()</code> (stabilising across v18–v20), and the recommended migration is OnPush + signals first, then flip the provider.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Zone.js:</strong> monkey-patches async APIs → <code>NgZone.onMicrotaskEmpty</code> → <code>tick()</code>.</li>`,
        `<li><strong>Limitation:</strong> knows a task ran, not what changed → broad CD.</li>`,
        `<li><strong>runOutsideAngular(fn):</strong> async work with no tick; re-enter via <code>zone.run()</code>/<code>markForCheck()</code>.</li>`,
        `<li><strong>Zoneless:</strong> <code>provideZonelessChangeDetection()</code>, drop <code>zone.js</code> polyfill; CD scheduled by signals/notifications.</li>`,
        `<li><strong>Zoneless-ready code:</strong> OnPush + signals + async pipe.</li>`,
        `<li><strong>Gotcha:</strong> plain field mutation in a timer won't render zoneless — use a signal.</li>`,
        `</ul>`,
      ].join('\n')
    },

    {
      title: 'trackBy, @for track & ChangeDetectorRef',
      slug: 'trackby-cdref',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Lists are everywhere — tables, feeds, chat messages, search results — and they are where naive Angular apps fall apart under load. Without a stable identity function, re-rendering a list forces Angular to destroy every DOM node and rebuild it from scratch on each update, even if only one item changed. That means lost input focus, reset scroll position, flickering images, and wasted layout work. <code>trackBy</code> (in the old <code>*ngFor</code>) and the mandatory <code>track</code> expression (in the new <code>@for</code>) tell Angular how to match old items to new ones so it can reuse DOM instead of rebuilding it. This is one of the highest-leverage, most commonly-asked performance topics in Angular interviews.</p>`,
        `<p>Paired with this is precise control over change detection via <code>ChangeDetectorRef</code>. Together they answer the practical question interviewers really care about: "you have a list of 10,000 rows updating in real time — how do you keep it at 60fps?" The answer is stable identity plus OnPush plus targeted CD.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>When a bound array changes, Angular's differ (<code>IterableDiffer</code>) walks the new list and, for each item, asks "have I seen this before?" By default it identifies items <strong>by object reference</strong>. So if your API call returns a fresh array of fresh objects — which is normal — every item looks brand new, and Angular tears down all existing rows and creates new ones. A <code>track</code>/<code>trackBy</code> function overrides this: you return a stable primitive key (usually <code>item.id</code>), and Angular matches items by that key instead of by reference. Same key → reuse the existing DOM node and just update its bindings.</p>`,
        `{{fig:ch8-trackby.svg|trackBy reuses DOM instead of rebuilding it|A stable key lets Angular match old and new items by identity, so only genuinely new items create DOM and existing rows are updated in place.}}`,
        `<p><code>ChangeDetectorRef</code> is the second half: it's the handle to a component's own change detector. It lets you mark a view dirty (<code>markForCheck()</code>), run CD synchronously (<code>detectChanges()</code>), or opt a view out of the tree entirely (<code>detach()</code>/<code>reattach()</code>). In OnPush components it's how you bridge changes that Angular can't detect on its own.</p>`,

        `<h2>How it works</h2>`,
        `<p><strong>The differ algorithm.</strong> On each CD pass where the array reference changed, Angular's <code>DefaultIterableDiffer</code> compares the previous and current collections. For each new item it computes the track key and looks it up in a map of previously-seen keys. Three outcomes: the key existed at the same position (no-op — just re-check bindings), the key existed at a different position (move the existing DOM node), or the key is new (create a node). Items whose keys vanished are removed. Without <code>track</code>, the "key" is object identity, so a new array yields all-new keys and a full teardown/rebuild.</p>`,
        `<p><strong>Why DOM reuse matters beyond speed.</strong> Reusing a node preserves its <em>ephemeral state</em>: the caret position and text in an <code>&lt;input&gt;</code>, the scroll offset of a nested container, an in-progress CSS animation, the loaded state of an <code>&lt;img&gt;</code>. Rebuilding wipes all of it. So "my input loses focus every time the list refreshes" is almost always a missing <code>track</code>.</p>`,
        `<p><strong>@for's mandatory track.</strong> The new control-flow block <code>@for (item of items; track item.id)</code> makes the track expression <em>required</em> — the compiler errors if you omit it. This is a deliberate correction: <code>*ngFor</code> made <code>trackBy</code> optional and most developers never added it, so Angular baked the best practice into the syntax. <code>@for</code> is also faster internally (a reworked diffing algorithm) and adds <code>@empty</code> and contextual variables (<code>$index</code>, <code>$first</code>, <code>$last</code>, <code>$even</code>, <code>$odd</code>, <code>$count</code>).</p>`,
        `<p><strong>Choosing the key.</strong> Use a stable, unique identifier: a database <code>id</code>, a UUID, a natural key. Do <em>not</em> use <code>$index</code> unless the list is append-only and never reordered — index-based tracking defeats the purpose because positions shift on insert/remove/sort, causing the wrong DOM to be reused (and subtle bugs where row A shows row B's animation). Never use the whole object or <code>JSON.stringify(item)</code>: that changes whenever any field changes, so it's no better than reference identity.</p>`,
        `<p><strong>ChangeDetectorRef mechanics.</strong> <code>markForCheck()</code> flags this view and its ancestors dirty so the next tick reaches it — the standard OnPush tool. <code>detectChanges()</code> runs CD on this view and its children immediately; use it sparingly (e.g. inside a <code>runOutsideAngular</code> block where no tick will come). <code>detach()</code> removes the view from the CD tree so app-wide ticks skip it entirely; you then render on your own schedule with <code>detectChanges()</code> and <code>reattach()</code> when you want back in. This is the pattern for a high-frequency widget (a live chart) that would otherwise drag the whole app's tick time up.</p>`,
        `<p><strong>How they combine.</strong> The performant real-time list is: OnPush component + immutable array updates (new reference so the differ runs) + <code>track</code> by stable id (so only changed rows touch the DOM) + optionally <code>detach</code>/manual CD for the hottest widgets. Each layer removes a different class of wasted work.</p>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. @for with mandatory track (v17+).</strong></p>`,
        `<pre><code class="language-typescript">@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    &lt;ul&gt;
      @for (user of users(); track user.id) {
        &lt;li&gt;{{ $index + 1 }}. {{ user.name }}&lt;/li&gt;
      } @empty {
        &lt;li&gt;No users found&lt;/li&gt;
      }
    &lt;/ul&gt;
  \`,
})
export class UserListComponent {
  users = signal&lt;User[]&gt;([]);
}</code></pre>`,
        `<p><strong>2. Legacy *ngFor with a trackBy function.</strong> Still valid; the function returns the stable key.</p>`,
        `<pre><code class="language-typescript">@Component({
  template: \`
    &lt;li *ngFor="let user of users; trackBy: trackById"&gt;{{ user.name }}&lt;/li&gt;
  \`,
})
export class LegacyListComponent {
  users: User[] = [];
  trackById(index: number, user: User) { return user.id; } // stable key, not index
}</code></pre>`,
        `<p><strong>3. Immutable update that plays well with track + OnPush.</strong> New array reference triggers the differ; stable ids mean only the edited row re-renders.</p>`,
        `<pre><code class="language-typescript">rename(id: string, name: string) {
  this.users.update(list =&gt;
    list.map(u =&gt; (u.id === id ? { ...u, name } : u)) // new array, new object for one row
  );
}</code></pre>`,
        `<p><strong>4. detach() + manual detectChanges() for a hot widget.</strong> Keeps a 60Hz ticker from inflating every app-wide tick.</p>`,
        `<pre><code class="language-typescript">@Component({ /* ... */ changeDetection: ChangeDetectionStrategy.OnPush })
export class LiveChartComponent {
  constructor(private cdr: ChangeDetectorRef, private zone: NgZone) {}

  ngOnInit() {
    this.cdr.detach(); // opt out of app-wide ticks
    this.zone.runOutsideAngular(() =&gt; {
      const loop = () =&gt; {
        this.updateSeries();
        this.cdr.detectChanges(); // render just this view
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
  }
  updateSeries() { /* ... */ }
}</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Omitting track/trackBy entirely.</strong> Every list refresh destroys and rebuilds all rows — lost focus, reset scroll, image flicker, and O(n) DOM churn. <code>@for</code> now forces you to provide it; <code>*ngFor</code> silently let you skip it.</li>`,
        `<li><strong>Tracking by <code>$index</code> on a reorderable list.</strong> Positions shift on insert/remove/sort, so Angular reuses the wrong DOM node for each item — subtle, hard-to-spot state bleed between rows.</li>`,
        `<li><strong>Tracking by the whole object or a stringified copy.</strong> The key changes whenever any field changes, so it's no better than reference identity — no reuse.</li>`,
        `<li><strong>Mutating the array in place under OnPush.</strong> <code>push</code>/<code>splice</code> keep the same reference, so the differ never runs and the list doesn't update at all. Create a new array.</li>`,
        `<li><strong>Overusing <code>detectChanges()</code>.</strong> Calling it in loops or handlers runs full synchronous CD each time and can be slower than one scheduled tick; prefer <code>markForCheck()</code>.</li>`,
        `<li><strong>Forgetting to <code>reattach()</code> a detached view.</strong> A view left detached never updates again from ticks — easy to leave a component permanently frozen.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Always provide a stable, unique <code>track</code> key</strong> — a database id or UUID — for every list. Treat it as mandatory even in legacy <code>*ngFor</code>.</li>`,
        `<li><strong>Migrate lists to <code>@for</code></strong>: it enforces track, is faster internally, and gives <code>@empty</code> plus contextual variables.</li>`,
        `<li><strong>Keep list data immutable</strong> (map to new arrays/objects) so OnPush and the differ both fire on genuine changes.</li>`,
        `<li><strong>Prefer signals + <code>markForCheck()</code></strong> over manual <code>detectChanges()</code> for routine updates; reserve <code>detach()</code>/<code>detectChanges()</code> for genuinely hot, self-managed widgets.</li>`,
        `<li><strong>Combine with virtual scrolling</strong> (<code>cdk-virtual-scroll-viewport</code>) for very long lists so only visible rows exist in the DOM at all.</li>`,
        `<li><strong>Profile list re-renders</strong> in Angular DevTools to confirm rows are being reused, not rebuilt.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: What problem does trackBy / track solve?</strong> By default Angular identifies list items by object reference, so a new array (typical from an API) makes every item look new and forces a full DOM teardown/rebuild. A stable track key matches old and new items by identity so existing DOM is reused and only changed rows update.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why is <code>track</code> mandatory in <code>@for</code> but optional in <code>*ngFor</code>?</strong> Because it's the single most impactful list optimisation and most developers forgot it. Angular baked the best practice into the new control-flow syntax so it can't be skipped.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): Can I just track by <code>$index</code>?</strong> Only for append-only lists that never reorder. On a sortable/insertable list, indices shift, so Angular reuses the wrong DOM node per item — you get state bleeding between rows.</p></blockquote>`,
        `<blockquote><p><strong>Q: markForCheck vs detectChanges vs detach?</strong> <code>markForCheck()</code> flags the view (and ancestors) dirty for the next tick; <code>detectChanges()</code> runs CD on this view now; <code>detach()</code> removes it from the tree so ticks skip it until <code>reattach()</code>. Use markForCheck for routine OnPush updates, detach for self-managed hot widgets.</p></blockquote>`,
        `<blockquote><p><strong>Q: My OnPush list won't update after I add an item. Why?</strong> You probably <code>push</code>ed into the same array — no new reference, so neither OnPush nor the differ fires. Reassign a new array (<code>[...list, item]</code>).</p></blockquote>`,
        `<blockquote><p><strong>Q: How would you render a 10k-row live-updating table at 60fps?</strong> OnPush + immutable array updates + <code>track</code> by stable id + CDK virtual scroll for the viewport, and optionally <code>detach</code> with manual CD for the hottest cells. Then profile to confirm rows are reused.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Default id:</strong> object reference → new array rebuilds all rows.</li>`,
        `<li><strong>track/trackBy:</strong> return a stable unique key (usually <code>item.id</code>) → reuse DOM.</li>`,
        `<li><strong>@for:</strong> <code>track</code> is mandatory; adds <code>@empty</code>, <code>$index/$first/$last/$even/$odd</code>.</li>`,
        `<li><strong>Never</strong> track by <code>$index</code> (reorderable) or whole object / stringified value.</li>`,
        `<li><strong>CdRef:</strong> <code>markForCheck()</code> = defer dirty; <code>detectChanges()</code> = run now; <code>detach()/reattach()</code> = opt out/in.</li>`,
        `<li><strong>60fps list:</strong> OnPush + immutable arrays + track by id + virtual scroll.</li>`,
        `</ul>`,
      ].join('\n')
    },

    {
      title: 'AOT vs JIT Compilation',
      slug: 'aot-jit',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Angular templates are not plain HTML the browser can render directly — they contain bindings, directives, and control-flow that must be <em>compiled</em> into JavaScript instructions. The question is <em>when</em> that compilation happens: <strong>Ahead-of-Time (AOT)</strong> compiles your templates during the build, so the browser downloads ready-to-run code; <strong>Just-in-Time (JIT)</strong> ships the raw templates plus the Angular compiler and compiles them in the browser at page load. The choice affects bundle size, startup speed, security, and when template errors surface. Since Angular 9 (Ivy), AOT has been the default for production, and interviewers ask this to check whether you understand the build pipeline rather than treating <code>ng build</code> as a black box.</p>`,
        `<p>This topic also connects to real production concerns: why the compiler isn't in your prod bundle, why a typo in a template fails your CI build instead of a user's browser, and how Ivy's tree-shakable output keeps bundles small. Getting it right is the difference between a 2-second and a 5-second first paint on a cold load.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>Think of your Angular templates as a small domain-specific language. Something has to translate <code>{{ user.name }}</code>, <code>@if</code>, <code>[disabled]="..."</code>, and directive usages into imperative DOM instructions. That translator is the Angular compiler. AOT runs it once, on your machine, as part of <code>ng build</code>: the output is plain JavaScript component definitions, and the compiler itself is <em>not shipped</em>. JIT ships your templates as strings alongside the compiler and runs the translation in every user's browser, every time the app loads.</p>`,
        `{{fig:ch8-aot-jit.svg|AOT versus JIT compilation pipeline|AOT compiles templates at build time and ships pre-compiled JS with no compiler; JIT ships raw templates plus the compiler and compiles in the browser at load.}}`,
        `<p>The practical upshot: AOT gives smaller bundles (no compiler), faster startup (nothing to compile at runtime), earlier error detection (template mistakes fail the build), and better security (no runtime template evaluation, shrinking the template-injection surface). JIT's only real advantage is a slightly faster incremental dev rebuild historically — but with Ivy, AOT is fast enough that it's the default even for <code>ng serve</code> in modern versions.</p>`,

        `<h2>How it works</h2>`,
        `<p><strong>The AOT pipeline.</strong> During <code>ng build</code>, the Angular compiler (<code>ngc</code>, invoked through the build system) does several things: it parses each component's template into an AST, type-checks the bindings against the component class (this is where "Property 'x' does not exist" template errors come from), and emits a compiled <em>component definition</em> — with Ivy, a static <code>ɵɵdefineComponent</code> call attached to the class containing template instructions. It also compiles metadata for modules, directives, and pipes. The result is ordinary JavaScript; the <code>@angular/compiler</code> package is then dropped from the production bundle because nothing at runtime needs it.</p>`,
        `<p><strong>Ivy's role.</strong> Ivy (default since v9) is the compilation and rendering engine that made modern AOT practical. Its key property is <strong>locality</strong>: each component compiles independently, referencing its dependencies directly, which makes the output <strong>tree-shakable</strong> — unused Angular features and unused components are eliminated by the bundler. Pre-Ivy (View Engine) required whole-program compilation and a metadata format that was harder to optimise. Ivy is also what enables standalone components, incremental compilation, and the fast rebuilds that let AOT be the default in dev.</p>`,
        `<p><strong>Template type checking.</strong> AOT can run in <em>strict templates</em> mode (<code>strictTemplates: true</code> in <code>tsconfig</code>), which type-checks every binding, input, output, and template variable as rigorously as your TypeScript. This catches a whole class of bugs — passing a <code>string</code> where a component expects a <code>number</code>, referencing a property that doesn't exist, misusing a pipe's return type — at build time. Under JIT these would only blow up (or silently misbehave) at runtime in the browser.</p>`,
        `<p><strong>The JIT pipeline.</strong> With JIT, the build ships your component classes with their templates still as metadata strings, plus the <code>@angular/compiler</code>. At bootstrap, <code>platformBrowserDynamic().bootstrapModule(AppModule)</code> invokes the compiler in the browser to turn those templates into the same kind of instructions AOT would have produced — but now on the user's device, costing download bytes for the compiler and CPU time at startup. That's why JIT is confined to development, tests, or niche scenarios (like runtime-generated templates, which are rare and discouraged).</p>`,
        `<p><strong>What ends up in the bundle.</strong> AOT: pre-compiled component definitions, no <code>@angular/compiler</code>, smaller and faster. JIT: raw templates + the compiler (~hundreds of KB), larger and slower to start. You can see the difference by inspecting a production build — there's no compiler chunk. The build command is the same (<code>ng build</code> defaults to AOT + production optimisations); <code>aot: false</code> in the builder options is what forces JIT, and it's almost never the right choice for shipping.</p>`,
        `<p><strong>Where the time goes.</strong> With JIT, the browser must download the compiler, parse it, and then compile every template before the first meaningful paint — work that repeats on each cold load and scales with the number of components. With AOT that entire cost is paid once, on your build machine, and cached in your CI pipeline. On a large app this can shave seconds off Time-to-Interactive on low-end devices, which is exactly the population most sensitive to a heavy startup. AOT also composes with other build wins — differential loading, route-level lazy chunks, and Ivy tree-shaking — because the compiled output is ordinary, analysable JavaScript the bundler can split and prune freely.</p>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. AOT bootstrap (standalone, v17+).</strong> The template is already compiled; <code>bootstrapApplication</code> just wires up the app.</p>`,
        `<pre><code class="language-typescript">import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent); // no compiler shipped — templates already JS</code></pre>`,
        `<p><strong>2. JIT bootstrap (legacy / dynamic).</strong> Note the "dynamic" platform — that word is the tell that the compiler runs in the browser.</p>`,
        `<pre><code class="language-typescript">import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule); // compiles templates at runtime</code></pre>`,
        `<p><strong>3. Enabling strict template type-checking (tsconfig.json).</strong> AOT then catches template bugs at build time.</p>`,
        `<pre><code class="language-json">{
  "angularCompilerOptions": {
    "strictTemplates": true,
    "strictInjectionParameters": true,
    "enableI18nLegacyMessageIdFormat": false
  }
}</code></pre>`,
        `<p><strong>4. A template error AOT catches at build time, but JIT would not until runtime.</strong></p>`,
        `<pre><code class="language-typescript">@Component({
  standalone: true,
  // AOT with strictTemplates: BUILD ERROR — Property 'usrName' does not exist.
  // JIT: compiles fine, renders blank, fails silently in the browser.
  template: \`&lt;h1&gt;{{ usrName }}&lt;/h1&gt;\`,
})
export class ProfileComponent {
  userName = 'Ada'; // note the typo in the template above
}</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Assuming <code>ng serve</code> uses JIT.</strong> Since Ivy, dev serve is AOT by default too; the old "dev is JIT, prod is AOT" split no longer holds.</li>`,
        `<li><strong>Shipping JIT to production.</strong> It bloats the bundle with the compiler and slows first paint — almost never justified. If you set <code>aot: false</code>, know exactly why.</li>`,
        `<li><strong>Being surprised by AOT-only errors.</strong> AOT is stricter: it type-checks templates and can't evaluate arbitrary runtime expressions in decorators. Code that "worked in JIT" may fail AOT — that's AOT catching a real bug.</li>`,
        `<li><strong>Using non-exported or arrow-function values in decorator metadata.</strong> AOT statically analyses metadata; some dynamic constructs it can't evaluate. Keep provider/token metadata statically analysable.</li>`,
        `<li><strong>Expecting runtime template strings to work.</strong> Generating templates at runtime needs the JIT compiler; under AOT there's no compiler to interpret them.</li>`,
        `<li><strong>Ignoring <code>strictTemplates</code>.</strong> Leaving it off forfeits AOT's biggest safety benefit — compile-time template type checking.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Always ship AOT to production</strong> (the default). Never override to JIT without a concrete, documented reason.</li>`,
        `<li><strong>Turn on <code>strictTemplates</code></strong> to catch binding and type bugs at build time instead of in users' browsers.</li>`,
        `<li><strong>Keep decorator metadata statically analysable</strong> — exported constants, no runtime-computed provider values — so AOT can compile it.</li>`,
        `<li><strong>Rely on Ivy's tree-shaking:</strong> import only what you use, prefer standalone components, and let the bundler drop unused code.</li>`,
        `<li><strong>Run AOT in CI</strong> so template errors fail the pipeline early, not after deploy.</li>`,
        `<li><strong>Measure bundle size and startup</strong> (source-map-explorer, Lighthouse) to confirm the compiler isn't shipped and first paint is fast.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: What's the difference between AOT and JIT?</strong> AOT compiles templates to JavaScript at build time and doesn't ship the compiler; JIT ships raw templates plus the compiler and compiles them in the browser at load. AOT means smaller bundles, faster startup, earlier errors, and better security.</p></blockquote>`,
        `<blockquote><p><strong>Q: Which is the default, and since when?</strong> AOT, for production since Angular 9 (Ivy), and for dev serve too in modern versions. The old "dev JIT / prod AOT" distinction is gone.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why is AOT more secure?</strong> There's no runtime template compilation, so the template-injection attack surface shrinks — templates are already compiled JS, not strings evaluated on the client.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): Code works in JIT but fails the AOT build. Bug in Angular?</strong> Almost never. AOT is stricter — it type-checks templates and requires statically analysable metadata. The failure is usually a real issue JIT tolerated silently.</p></blockquote>`,
        `<blockquote><p><strong>Q: What does Ivy contribute here?</strong> Ivy compiles components locally and emits tree-shakable instructions, which made fast, incremental AOT the default and enabled standalone components. It replaced View Engine's whole-program model.</p></blockquote>`,
        `<blockquote><p><strong>Q: When would you ever use JIT?</strong> Essentially only when you must compile templates generated at runtime, or in certain test setups — rare and discouraged. For shipping apps, AOT always.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>AOT:</strong> compile templates at build → ship JS, no compiler → smaller, faster, safer, build-time errors. Default for prod.</li>`,
        `<li><strong>JIT:</strong> ship templates + compiler → compile in browser at load → bigger, slower, runtime errors. Dev/legacy only.</li>`,
        `<li><strong>Tell:</strong> <code>bootstrapApplication</code>/<code>platformBrowser</code> = AOT; <code>platformBrowserDynamic</code> = JIT.</li>`,
        `<li><strong>Ivy</strong> (v9+) = locality + tree-shaking → made AOT the default.</li>`,
        `<li><strong>strictTemplates:</strong> type-check bindings at build time — turn it on.</li>`,
        `<li><strong>Rule:</strong> always AOT to production; JIT only for runtime-generated templates.</li>`,
        `</ul>`,
      ].join('\n')
    },

    {
      title: 'NgRx: Redux State Management for Angular',
      slug: 'ngrx-overview',
      order: 4,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>As Angular apps grow, state stops being a component's private concern. The same data — the logged-in user, a shopping cart, a list of notifications — is needed by many components across many routes, and passing it up and down via inputs/outputs becomes a tangle. <strong>NgRx</strong> is Angular's most popular Redux-style state management library: it centralises application state in a single immutable <strong>store</strong>, and enforces that all changes flow through a strict, one-directional pipeline. Interviewers ask about it because it reveals whether you understand <em>predictable state</em> — and, just as importantly, whether you know when <em>not</em> to reach for it.</p>`,
        `<p>NgRx brings real benefits — time-travel debugging, testability, a single source of truth, decoupling of components from data sources — but at the cost of significant boilerplate and a learning curve. A senior answer weighs both: "here's the action→reducer→selector→effect cycle, and here's why for a small app I'd use signals or a simple service instead." Getting the data-flow model precise is the core of the question.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>NgRx is built on three Redux principles: (1) a <strong>single source of truth</strong> — all shared state lives in one store object; (2) state is <strong>read-only</strong> — you never mutate it, you dispatch an <strong>action</strong> describing what happened; (3) changes are made by <strong>pure functions</strong> called <strong>reducers</strong> that take the current state and an action and return a brand-new state. Components read state through <strong>selectors</strong> (memoized query functions) and never touch the store directly. Asynchronous work (HTTP, WebSockets) lives in <strong>effects</strong>, which listen for actions, do the side effect, and dispatch a result action.</p>`,
        `{{fig:ch8-ngrx-dataflow.svg|NgRx one-way data flow|Component dispatches an Action, the Reducer produces new state in the Store, Selectors push derived state back to the Component, and Effects handle async side effects by dispatching further actions.}}`,
        `<p>The mental model is a loop that only turns one way. A component dispatches an action ("Load Users clicked"). A reducer (for synchronous state changes) and/or an effect (for async work) responds. The store holds the new immutable state. Selectors derive exactly the slice each component needs and stream it back through the async pipe. Nothing reaches into the store to mutate it — every change is an explicit, logged, replayable action.</p>`,

        `<h2>How it works</h2>`,
        `<p><strong>Actions.</strong> An action is a plain object with a <code>type</code> (a unique string like <code>'[User Page] Load Users'</code>) and an optional payload. Actions are <em>events</em>, not commands — they describe something that happened, not what to do about it. The bracketed source convention (<code>[User Page]</code>, <code>[User API]</code>) makes the DevTools log readable. <code>createAction</code> gives you a typed action creator.</p>`,
        `<p><strong>Reducers.</strong> A reducer is a pure function <code>(state, action) =&gt; newState</code>. Given the same inputs it always returns the same output, performs no side effects, and never mutates the existing state — it returns a new object (spread/immutable update). <code>createReducer</code> pairs the state with <code>on(action, handler)</code> clauses. Purity is what enables time-travel debugging: you can replay the action log to reconstruct any past state exactly.</p>`,
        `<p><strong>Selectors.</strong> A selector is a function that reads a slice of state. <code>createSelector</code> composes selectors and <strong>memoizes</strong> the result: if the inputs it depends on haven't changed, it returns the cached value without recomputing. This is critical for performance — a selector feeding an OnPush component only emits a new value when the underlying state actually changed, so the component re-renders only when needed. Selectors also decouple components from state shape: refactor the store and only the selector changes.</p>`,
        `<p><strong>Effects.</strong> Reducers must be pure, so asynchronous side effects can't live in them. <strong>Effects</strong> (from <code>@ngrx/effects</code>) are injectable services that subscribe to the action stream, filter for actions of interest with <code>ofType</code>, perform the side effect (an HTTP call via a service), and map the result to a <em>new</em> action — typically a success or failure action. That result action flows back through reducers to update the store. This keeps the reducer pure while still handling real-world async.</p>`,
        `{{fig:ch8-ngrx-effect.svg|NgRx effects async side-effect loop|An effect listens for an action, performs async work like an HTTP call, and dispatches a success or failure action that the reducer folds back into the store.}}`,
        `<p><strong>The full cycle, concretely.</strong> User clicks "Load". Component dispatches <code>loadUsers()</code>. An effect's <code>ofType(loadUsers)</code> matches, calls <code>userService.getAll()</code> with <code>switchMap</code>, and on success maps to <code>loadUsersSuccess({ users })</code> (or <code>loadUsersFailure({ error })</code> on error, via <code>catchError</code>). The reducer's <code>on(loadUsersSuccess, ...)</code> clause returns new state with the users. A selector <code>selectAllUsers</code> emits the new list, the async pipe pushes it into the OnPush template, and the view updates. Every step is logged and replayable.</p>`,
        `<p><strong>RxJS flattening operators matter in effects.</strong> The choice of <code>switchMap</code> vs <code>concatMap</code> vs <code>mergeMap</code> vs <code>exhaustMap</code> encodes concurrency policy: <code>switchMap</code> cancels the previous request (good for type-ahead search), <code>concatMap</code> queues in order (good for writes that must not reorder), <code>exhaustMap</code> ignores new triggers while one is in flight (good for login buttons), <code>mergeMap</code> runs all in parallel. Interviewers probe this because it's where subtle bugs (race conditions, duplicate submissions) hide.</p>`,
        `<p><strong>Modern NgRx.</strong> Newer NgRx offers <code>createFeature</code> (bundles reducer + selectors), functional effects, the <code>@ngrx/store</code> standalone providers (<code>provideStore</code>, <code>provideEffects</code>), and the lightweight <strong>SignalStore</strong> (<code>@ngrx/signals</code>) for signal-based state without the full Redux ceremony. The Redux data-flow model, though, is unchanged and is what interviews test.</p>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. Actions.</strong></p>`,
        `<pre><code class="language-typescript">import { createAction, props } from '@ngrx/store';
import { User } from './user.model';

export const loadUsers = createAction('[User Page] Load Users');
export const loadUsersSuccess = createAction(
  '[User API] Load Users Success', props&lt;{ users: User[] }&gt;()
);
export const loadUsersFailure = createAction(
  '[User API] Load Users Failure', props&lt;{ error: string }&gt;()
);</code></pre>`,
        `<p><strong>2. Reducer with createReducer.</strong> Pure, immutable updates only.</p>`,
        `<pre><code class="language-typescript">import { createReducer, on } from '@ngrx/store';
import * as UserActions from './user.actions';

export interface UserState { users: User[]; loading: boolean; error: string | null; }
const initial: UserState = { users: [], loading: false, error: null };

export const userReducer = createReducer(
  initial,
  on(UserActions.loadUsers, (state) =&gt; ({ ...state, loading: true, error: null })),
  on(UserActions.loadUsersSuccess, (state, { users }) =&gt; ({ ...state, users, loading: false })),
  on(UserActions.loadUsersFailure, (state, { error }) =&gt; ({ ...state, error, loading: false })),
);</code></pre>`,
        `<p><strong>3. Selectors with memoization.</strong></p>`,
        `<pre><code class="language-typescript">import { createFeatureSelector, createSelector } from '@ngrx/store';

const selectUserState = createFeatureSelector&lt;UserState&gt;('users');
export const selectAllUsers = createSelector(selectUserState, (s) =&gt; s.users);
export const selectLoading  = createSelector(selectUserState, (s) =&gt; s.loading);
// Derived + memoized: only recomputes when users change:
export const selectActiveUsers = createSelector(
  selectAllUsers, (users) =&gt; users.filter(u =&gt; u.active)
);</code></pre>`,
        `<p><strong>4. Effect with createEffect + switchMap.</strong></p>`,
        `<pre><code class="language-typescript">import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { switchMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import * as UserActions from './user.actions';

@Injectable()
export class UserEffects {
  private actions$ = inject(Actions);
  private api = inject(UserService);

  loadUsers$ = createEffect(() =&gt;
    this.actions$.pipe(
      ofType(UserActions.loadUsers),
      switchMap(() =&gt;
        this.api.getAll().pipe(
          map((users) =&gt; UserActions.loadUsersSuccess({ users })),
          catchError((err) =&gt; of(UserActions.loadUsersFailure({ error: err.message }))),
        )
      )
    )
  );
}</code></pre>`,
        `<p><strong>5. Wiring it up + consuming in a component (standalone, v17+).</strong></p>`,
        `<pre><code class="language-typescript">// main.ts
bootstrapApplication(AppComponent, {
  providers: [ provideStore({ users: userReducer }), provideEffects(UserEffects) ],
});

// component
@Component({
  standalone: true, imports: [AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    @if (loading$ | async) { &lt;p&gt;Loading…&lt;/p&gt; }
    &lt;ul&gt;@for (u of users$ | async; track u.id) { &lt;li&gt;{{ u.name }}&lt;/li&gt; }&lt;/ul&gt;
  \`,
})
export class UsersComponent {
  private store = inject(Store);
  users$ = this.store.select(selectAllUsers);
  loading$ = this.store.select(selectLoading);
  ngOnInit() { this.store.dispatch(loadUsers()); }
}</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Reaching for NgRx on a small app.</strong> The boilerplate rarely pays off until state is genuinely shared, complex, and long-lived. For local or simple state, signals or a plain service with a <code>BehaviorSubject</code> are lighter and clearer.</li>`,
        `<li><strong>Mutating state in a reducer.</strong> <code>state.users.push(u)</code> breaks purity, memoized selectors, and time-travel. Always return a new object (<code>{ ...state, users: [...] }</code>).</li>`,
        `<li><strong>Putting async work in reducers.</strong> Reducers must be pure and synchronous. HTTP and other side effects belong in effects.</li>`,
        `<li><strong>Wrong flattening operator in effects.</strong> Using <code>mergeMap</code> for a type-ahead search causes race conditions (stale results win); use <code>switchMap</code>. Using <code>switchMap</code> for order-sensitive writes can drop requests; use <code>concatMap</code>.</li>`,
        `<li><strong>Forgetting <code>catchError</code> inside the inner pipe.</strong> If the error escapes to the outer stream, the effect completes and stops listening to future actions permanently.</li>`,
        `<li><strong>Overusing the store for everything.</strong> Transient UI state (a dropdown's open flag, form draft values) usually belongs in the component, not the global store.</li>`,
        `<li><strong>Selecting raw state instead of using memoized selectors.</strong> Loses caching and couples components to the state shape.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Adopt NgRx only when justified:</strong> state shared across many features, complex async orchestration, or a need for auditability/time-travel. Otherwise prefer signals or a service.</li>`,
        `<li><strong>Keep reducers pure and immutable</strong> — no mutation, no side effects, always return new state.</li>`,
        `<li><strong>Do all async in effects</strong> and pick the flattening operator deliberately (<code>switchMap</code> cancel, <code>concatMap</code> queue, <code>exhaustMap</code> ignore-while-busy, <code>mergeMap</code> parallel).</li>`,
        `<li><strong>Always <code>catchError</code> in the inner observable</strong> so a failure dispatches a failure action instead of killing the effect stream.</li>`,
        `<li><strong>Access state only through memoized selectors</strong> and compose derived selectors with <code>createSelector</code>.</li>`,
        `<li><strong>Name actions as events</strong> (<code>'[Source] Thing happened'</code>) and consider <code>createFeature</code>/SignalStore to cut boilerplate in modern apps.</li>`,
        `<li><strong>Consume state via the async pipe in OnPush components</strong> so subscriptions and CD are handled for you.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: Walk me through NgRx's data flow.</strong> A component dispatches an <em>action</em> (an event). A pure <em>reducer</em> folds it into new immutable <em>store</em> state; async work runs in <em>effects</em> that listen for the action, do the side effect, and dispatch a result action. Components read state via memoized <em>selectors</em>. Data flows one way; nothing mutates the store directly.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why must reducers be pure?</strong> Purity makes state changes deterministic and replayable — that's what powers time-travel debugging and makes reducers trivially unit-testable. Side effects or mutation would break memoized selectors and reproducibility.</p></blockquote>`,
        `<blockquote><p><strong>Q: What are effects for?</strong> Handling side effects (HTTP, WebSockets, storage) outside reducers. An effect uses <code>ofType</code> to match an action, performs the async work, and dispatches a success/failure action back into the store.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): switchMap vs mergeMap vs concatMap vs exhaustMap in an effect?</strong> <code>switchMap</code> cancels the previous (type-ahead search), <code>concatMap</code> queues in order (sequential writes), <code>exhaustMap</code> ignores new while busy (login), <code>mergeMap</code> runs all in parallel. Choosing wrong causes race conditions or dropped requests.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why selectors instead of reading state directly?</strong> Selectors are memoized (recompute only when their inputs change) and decouple components from state shape, so OnPush views re-render only on real changes and refactors touch one place.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): Should every app use NgRx?</strong> No. It adds real boilerplate and only pays off for large, shared, complex, long-lived state. For most apps, signals or a service with observables are simpler — and modern NgRx SignalStore narrows the gap.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Flow:</strong> Component → dispatch(Action) → Reducer (pure) → Store → Selector (memoized) → Component. Async → Effect → new Action.</li>`,
        `<li><strong>Action:</strong> <code>{ type, payload }</code>, an event; <code>createAction</code>.</li>`,
        `<li><strong>Reducer:</strong> pure <code>(state, action) =&gt; newState</code>, immutable; <code>createReducer</code>/<code>on</code>.</li>`,
        `<li><strong>Selector:</strong> memoized query; <code>createSelector</code>.</li>`,
        `<li><strong>Effect:</strong> <code>ofType</code> → async → dispatch result; pick <code>switchMap</code>/<code>concatMap</code>/<code>exhaustMap</code>/<code>mergeMap</code> deliberately; always <code>catchError</code>.</li>`,
        `<li><strong>When:</strong> big/shared/complex state → NgRx; small/local → signals or a service.</li>`,
        `</ul>`,
      ].join('\n')
    },

    {
      title: 'Testing Angular: TestBed, Components & HTTP',
      slug: 'testing',
      order: 5,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Tests are how you ship changes to a large Angular app without fear. Angular ships a first-class testing toolkit built around <strong>TestBed</strong> — a way to spin up a real Angular environment (dependency injection, change detection, template rendering) inside a unit test, so you can verify components, services, pipes, and HTTP interactions in isolation and at speed. Interviewers ask about testing because it separates people who write code that "works on my machine" from those who write code others can safely maintain. It also probes your understanding of DI, change detection, and RxJS — because good tests require all three.</p>`,
        `<p>The specific skills that come up: configuring TestBed with mocked dependencies, driving change detection through a <code>ComponentFixture</code>, querying and interacting with the rendered DOM, and — the perennial favourite — testing HTTP with <code>HttpTestingController</code> so no real network call is made. Get these right and you can test almost anything Angular throws at you.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p><strong>TestBed</strong> is a testing module builder. Just as your app has an <code>NgModule</code> or standalone providers, TestBed lets you assemble a miniature module for a single test: declare the component under test, provide real or mocked dependencies, and compile it. You then create the component through TestBed, which gives you a <strong>ComponentFixture</strong> — a wrapper exposing the component <em>instance</em> (to set inputs and call methods) and the rendered <em>DOM</em> (to assert what the user sees). Calling <code>fixture.detectChanges()</code> runs change detection so the template reflects the current state.</p>`,
        `{{fig:ch8-testbed.svg|TestBed configure, compile, assert flow|TestBed builds an isolated DI tree, the ComponentFixture renders and drives change detection, and assertions verify both component state and the DOM, with HttpTestingController flushing fake responses.}}`,
        `<p>For HTTP, you never hit the real server in a unit test. <code>provideHttpClientTesting()</code> swaps the real backend for a controllable mock, and <strong>HttpTestingController</strong> lets you assert exactly which request was made, respond with a fake body via <code>flush()</code>, and verify no unexpected requests are left open. This makes HTTP-dependent code deterministic and fast.</p>`,

        `<h2>How it works</h2>`,
        `<p><strong>Configure → compile → create.</strong> A test's <code>beforeEach</code> typically calls <code>TestBed.configureTestingModule({ imports: [...], providers: [...] })</code> to describe the environment, then (historically) <code>compileComponents()</code> to compile templates and styles — usually unnecessary now that AOT compiles ahead of time, but still valid. <code>TestBed.createComponent(MyComponent)</code> instantiates the component in that environment and returns a <code>ComponentFixture</code>. Under the hood TestBed builds a real injector tree, so <code>inject()</code> and constructor injection resolve exactly as they would in the app — which is why you can override any provider with a mock.</p>`,
        `<p><strong>The fixture and change detection.</strong> <code>fixture.componentInstance</code> is the actual component object; set its inputs or call its methods to arrange a scenario. Nothing renders until you call <code>fixture.detectChanges()</code>, which runs a CD cycle and also fires lifecycle hooks like <code>ngOnInit</code> on the first call. <code>fixture.nativeElement</code> (or <code>fixture.debugElement.query(By.css('...'))</code>) reads the rendered DOM to assert text, attributes, and classes. For user interaction you dispatch DOM events (a click, an input) and call <code>detectChanges()</code> again to see the result.</p>`,
        `<p><strong>Mocking dependencies.</strong> The whole point of a unit test is isolation. In <code>providers</code> you replace real services with test doubles: <code>{ provide: UserService, useValue: mockUserService }</code> for a hand-rolled stub, a spy object (<code>jasmine.createSpyObj</code>) for verifying calls, or <code>useClass</code> for a fake implementation. Because TestBed uses the real DI system, the component receives your mock exactly where it would receive the real service.</p>`,
        `<p><strong>Async: fakeAsync vs waitForAsync.</strong> Angular gives you two tools for asynchronous tests. <code>fakeAsync</code> runs the test body in a synthetic zone where time is virtual: you call <code>tick(1000)</code> to advance timers or <code>flush()</code> to drain the microtask/macrotask queue, making async code testable synchronously and deterministically. <code>waitForAsync</code> (formerly <code>async</code>) waits for all pending async work to settle, often paired with <code>fixture.whenStable()</code>. <code>fakeAsync</code> is preferred when you control the timing; <code>waitForAsync</code> when you can't (e.g. real promises you must let resolve).</p>`,
        `<p><strong>HttpTestingController mechanics.</strong> Provide <code>provideHttpClient()</code> and <code>provideHttpClientTesting()</code> and inject <code>HttpTestingController</code>. When code under test makes a request, the controller intercepts it. You assert the request with <code>httpMock.expectOne('/api/users')</code> (which fails if zero or more than one matched), inspect <code>req.request.method</code>/<code>body</code>/<code>headers</code>, then supply the response with <code>req.flush(fakeData)</code> (or <code>req.flush(null, { status: 500, statusText: 'Error' })</code> to test error paths). Finally, <code>httpMock.verify()</code> in <code>afterEach</code> asserts there are no unmatched outstanding requests — catching accidental extra calls.</p>`,
        `<p><strong>What to test where.</strong> Services and pipes are pure logic — test them directly, often without TestBed (just <code>new MyPipe()</code> or instantiate the service with mocked deps). Components that render state or handle interaction warrant TestBed + fixture. Reserve full end-to-end tests (Cypress/Playwright) for critical user journeys; the fast, numerous tests should be TestBed unit tests. The <strong>testing pyramid</strong> — many unit, fewer integration, few e2e — keeps the suite fast and reliable.</p>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. Component test with a mocked service and DOM assertion.</strong></p>`,
        `<pre><code class="language-typescript">import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { UsersComponent } from './users.component';
import { UserService } from './user.service';

describe('UsersComponent', () =&gt; {
  let fixture: ComponentFixture&lt;UsersComponent&gt;;
  const mockService = { getAll: jasmine.createSpy().and.returnValue(of([{ id: 1, name: 'Ada' }])) };

  beforeEach(() =&gt; {
    TestBed.configureTestingModule({
      imports: [UsersComponent], // standalone component
      providers: [{ provide: UserService, useValue: mockService }],
    });
    fixture = TestBed.createComponent(UsersComponent);
    fixture.detectChanges(); // triggers ngOnInit + first render
  });

  it('renders the user list', () =&gt; {
    const items = fixture.debugElement.queryAll(By.css('li'));
    expect(items.length).toBe(1);
    expect(items[0].nativeElement.textContent).toContain('Ada');
    expect(mockService.getAll).toHaveBeenCalled();
  });
});</code></pre>`,
        `<p><strong>2. HTTP test with HttpTestingController.</strong></p>`,
        `<pre><code class="language-typescript">import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';

describe('UserService', () =&gt; {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() =&gt; {
    TestBed.configureTestingModule({
      providers: [UserService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() =&gt; httpMock.verify()); // no unexpected outstanding requests

  it('GETs users and maps the response', () =&gt; {
    service.getAll().subscribe((users) =&gt; expect(users.length).toBe(2));

    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1 }, { id: 2 }]); // supply fake response
  });

  it('surfaces a 500 error', () =&gt; {
    let error: unknown;
    service.getAll().subscribe({ error: (e) =&gt; (error = e) });
    httpMock.expectOne('/api/users').flush(null, { status: 500, statusText: 'Server Error' });
    expect(error).toBeTruthy();
  });
});</code></pre>`,
        `<p><strong>3. Async logic with fakeAsync + tick.</strong></p>`,
        `<pre><code class="language-typescript">import { fakeAsync, tick } from '@angular/core/testing';

it('debounces search', fakeAsync(() =&gt; {
  component.onSearch('an');
  expect(component.results.length).toBe(0); // nothing yet — debounced
  tick(300);                                 // advance virtual time
  expect(component.results.length).toBeGreaterThan(0);
}));</code></pre>`,
        `<p><strong>4. Testing a signal-based component.</strong></p>`,
        `<pre><code class="language-typescript">it('increments the count signal', () =&gt; {
  const fixture = TestBed.createComponent(CounterComponent);
  const cmp = fixture.componentInstance;
  cmp.inc();
  fixture.detectChanges();
  expect(cmp.count()).toBe(1);
  expect(fixture.nativeElement.textContent).toContain('Count: 1');
});</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Forgetting <code>fixture.detectChanges()</code>.</strong> Without it the template never renders and <code>ngOnInit</code> never fires, so DOM assertions fail mysteriously with empty output.</li>`,
        `<li><strong>Making real HTTP calls in unit tests.</strong> Slow, flaky, and network-dependent. Always use <code>provideHttpClientTesting()</code> + <code>HttpTestingController</code> and <code>flush()</code> fake responses.</li>`,
        `<li><strong>Omitting <code>httpMock.verify()</code>.</strong> You miss accidental extra requests and unhandled calls that indicate real bugs.</li>`,
        `<li><strong>Testing implementation details instead of behaviour.</strong> Asserting private method calls makes tests brittle; assert observable outputs — rendered DOM, emitted events, returned values.</li>`,
        `<li><strong>Mixing up <code>fakeAsync</code> and <code>waitForAsync</code>.</strong> Calling <code>tick()</code> outside <code>fakeAsync</code>, or expecting <code>fakeAsync</code> to handle real (non-zone) async, leads to timeouts. Match the tool to the timing model.</li>`,
        `<li><strong>Not mocking dependencies.</strong> Pulling in real services makes a "unit" test an integration test — slower and coupled to unrelated code.</li>`,
        `<li><strong>Over-relying on e2e for logic that a unit test covers faster.</strong> Inverts the testing pyramid and yields a slow, flaky suite.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Follow the testing pyramid:</strong> many fast TestBed unit tests, fewer integration tests, few e2e tests for critical journeys.</li>`,
        `<li><strong>Mock every external dependency</strong> with <code>useValue</code>/spies so each test isolates one unit.</li>`,
        `<li><strong>Always mock HTTP</strong> with <code>HttpTestingController</code>, assert the request shape, flush a fake body, and <code>verify()</code> in <code>afterEach</code>.</li>`,
        `<li><strong>Test behaviour, not internals:</strong> assert rendered output, emitted events, and public return values so refactors don't break tests.</li>`,
        `<li><strong>Prefer <code>fakeAsync</code> + <code>tick</code></strong> for deterministic control of timers/debounces; reserve <code>waitForAsync</code>/<code>whenStable</code> for genuinely uncontrollable async.</li>`,
        `<li><strong>Test services and pipes without TestBed when possible</strong> — plain instantiation is faster and clearer.</li>`,
        `<li><strong>Keep tests independent</strong>: fresh TestBed per test (via <code>beforeEach</code>), no shared mutable state, deterministic data.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: What is TestBed and why use it?</strong> It builds a real Angular testing environment — DI, change detection, template rendering — for a unit test. You configure a mini-module with mocked dependencies, create the component, and get a <code>ComponentFixture</code> to drive CD and assert the DOM.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you test an HTTP call without a server?</strong> Provide <code>provideHttpClientTesting()</code>, inject <code>HttpTestingController</code>, call <code>expectOne(url)</code> to assert the request, <code>flush(fakeData)</code> to respond, and <code>verify()</code> to ensure no outstanding requests. No real network is touched.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): My DOM assertion sees empty content. Why?</strong> You almost certainly didn't call <code>fixture.detectChanges()</code> — without it the template never renders and <code>ngOnInit</code> never runs.</p></blockquote>`,
        `<blockquote><p><strong>Q: fakeAsync vs waitForAsync?</strong> <code>fakeAsync</code> gives virtual time — use <code>tick()</code>/<code>flush()</code> to advance timers and microtasks deterministically. <code>waitForAsync</code> waits for real pending async to settle, often with <code>whenStable()</code>. Prefer fakeAsync when you control timing.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you supply a mock dependency?</strong> In TestBed <code>providers</code>, override the token: <code>{ provide: UserService, useValue: mock }</code> (or a spy/<code>useClass</code>). TestBed's real injector then hands your mock to the component exactly where the real service would go.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): Should you unit-test private methods?</strong> No — test observable behaviour (DOM, outputs, return values). Asserting internals makes tests brittle and blocks refactoring; if a private method needs direct testing, it probably wants to be its own unit.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>TestBed:</strong> <code>configureTestingModule</code> → (<code>compileComponents</code>) → <code>createComponent</code> → <code>ComponentFixture</code>.</li>`,
        `<li><strong>Fixture:</strong> <code>componentInstance</code> (state) · <code>nativeElement</code>/<code>debugElement.query</code> (DOM) · <code>detectChanges()</code> (run CD + first <code>ngOnInit</code>).</li>`,
        `<li><strong>Mock deps:</strong> <code>{ provide: X, useValue: mock }</code> · <code>jasmine.createSpyObj</code>.</li>`,
        `<li><strong>HTTP:</strong> <code>provideHttpClientTesting()</code> + <code>HttpTestingController</code> → <code>expectOne</code> → <code>flush</code> → <code>verify()</code>.</li>`,
        `<li><strong>Async:</strong> <code>fakeAsync</code> + <code>tick()/flush()</code> (virtual time) vs <code>waitForAsync</code> + <code>whenStable()</code>.</li>`,
        `<li><strong>Pyramid:</strong> many unit → fewer integration → few e2e; test behaviour, not internals.</li>`,
        `</ul>`,
      ].join('\n')
    },
  ]
};
