/**
 * Chapter 2 — Components & Templates
 * Deep, interview-grade Angular content (v17+, standalone, signal APIs).
 *
 * Figure markers use the form:
 *   {{fig:filename.svg|ALT|CAPTION}}
 * resolved by seed-angular-kit.js. SVGs live in /angular-diagrams.
 */
module.exports = {
  title: 'Components & Templates',
  slug: 'components-templates',
  order: 1,
  topics: [
    {
      title: 'Component Lifecycle Hooks',
      slug: 'lifecycle-hooks',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Every Angular component is born, updated, and destroyed, and Angular exposes named hooks to run your code at each of those moments. Knowing <em>which</em> hook fires <em>when</em> is the line between "my HTTP call runs before the inputs are set" bugs and clean, predictable code. It is one of the most heavily-asked Angular interview topics precisely because it is a proxy question: it tests whether you actually understand change detection and the render pipeline, not whether you memorised eight method names.</p>`,
        `<p>In real applications you reach for these hooks constantly. You fetch initial data in <code>ngOnInit</code>, measure or focus a real DOM element in <code>ngAfterViewInit</code>, react to changed inputs in <code>ngOnChanges</code>, and tear down subscriptions, timers and event listeners in <code>ngOnDestroy</code>. Get the timing wrong and you are rewarded with the infamous <code>ExpressionChangedAfterItHasBeenCheckedError</code>, silent memory leaks, or <code>undefined</code> view children that "work on my machine" but crash under production change detection.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A lifecycle hook is simply a method Angular agrees to call on your component or directive class at a well-defined point in its life. You opt in by implementing the matching interface (for example <code>OnInit</code>) and declaring the method (<code>ngOnInit</code>). At runtime Angular does not actually inspect the interface — TypeScript interfaces are erased during compilation — it just calls the method if the class has one. Implementing the interface is about compile-time safety and signalling intent to the next developer; the <code>ng</code>-prefixed method is what does the work.</p>`,
        `<p>The hooks fire in a fixed, documented order. On a component's very first change-detection pass Angular runs the full sequence; on every later pass it re-runs only the "check" family. Signals and the modern reactive APIs are changing how often you need these hooks, but the sequence itself is bedrock Angular knowledge.</p>`,
        `{{fig:ch2-lifecycle.svg|Component lifecycle hooks order|The fixed order Angular calls lifecycle hooks in, from constructor through to ngOnDestroy.}}`,
        `<h2>How it works</h2>`,
        `<p>The <code>constructor</code> is not a lifecycle hook — it is plain TypeScript. It runs when the class is instantiated, which is when dependency injection happens. Crucially, <strong>data-bound inputs are not set yet</strong> inside the constructor, so it is the wrong place to read <code>@Input</code> values or touch the DOM. Keep constructors limited to DI and trivial field initialisation.</p>`,
        `<p>After construction, Angular drives the component through the sequence below during change detection.</p>`,
        `<table>`,
        `<thead><tr><th>#</th><th>Hook</th><th>When it fires</th><th>Runs on every CD?</th></tr></thead>`,
        `<tbody>`,
        `<tr><td>1</td><td><code>ngOnChanges</code></td><td>Before the first <code>ngOnInit</code> and whenever a data-bound <code>@Input</code> reference changes. Receives a <code>SimpleChanges</code> map.</td><td>Only when an input changes</td></tr>`,
        `<tr><td>2</td><td><code>ngOnInit</code></td><td>Once, after the first <code>ngOnChanges</code>. Inputs are set — do initialisation and data fetching here.</td><td>No — once only</td></tr>`,
        `<tr><td>3</td><td><code>ngDoCheck</code></td><td>Every change-detection run, right after changes/init. Your custom dirty-checking hook.</td><td>Yes</td></tr>`,
        `<tr><td>4</td><td><code>ngAfterContentInit</code></td><td>Once, after projected content (<code>&lt;ng-content&gt;</code>) has been initialised.</td><td>No — once only</td></tr>`,
        `<tr><td>5</td><td><code>ngAfterContentChecked</code></td><td>After every check of projected content.</td><td>Yes</td></tr>`,
        `<tr><td>6</td><td><code>ngAfterViewInit</code></td><td>Once, after the component's own view and its child views are initialised. <code>@ViewChild</code> / <code>viewChild()</code> refs are available here.</td><td>No — once only</td></tr>`,
        `<tr><td>7</td><td><code>ngAfterViewChecked</code></td><td>After every check of the view and child views.</td><td>Yes</td></tr>`,
        `<tr><td>8</td><td><code>ngOnDestroy</code></td><td>Just before Angular destroys the component or directive. Unsubscribe, clear timers, detach listeners.</td><td>No — once only</td></tr>`,
        `</tbody>`,
        `</table>`,
        `<p>A mnemonic for the order: <strong>Changes &rarr; Init &rarr; DoCheck &rarr; Content(Init, Checked) &rarr; View(Init, Checked) &rarr; Destroy</strong>. Content hooks always precede View hooks, because projected content lives <em>inside</em> the host view: Angular must settle the content before it can finish the view that wraps it. For the same reason, a parent's <code>ngAfterViewInit</code> runs <em>after</em> all of its children's <code>ngAfterViewInit</code> hooks — children complete bottom-up.</p>`,
        `{{fig:ch2-lifecycle-cd.svg|First pass versus every change-detection pass|Init hooks fire once on the first pass; the DoCheck and Checked hooks re-run on every subsequent change-detection cycle.}}`,
        `<p>Two hooks deserve special respect because they run on <em>every</em> change-detection cycle: <code>ngDoCheck</code> and the two <code>...Checked</code> hooks. If you put expensive work in them you will pay that cost dozens of times per second during interactions. They exist for advanced custom change detection, not everyday logic.</p>`,
        `<p><code>ngOnChanges</code> only fires when a <em>data-bound input reference</em> changes. Angular compares inputs with <code>Object.is</code> (reference equality). Mutating an object or pushing into an array that is already bound does <strong>not</strong> trigger <code>ngOnChanges</code>, because the reference is unchanged — a classic source of "why didn't my child update?" bugs. With the new signal inputs, you side-step this entirely: read the input as a signal and derive from it with <code>computed()</code> instead of hand-writing <code>ngOnChanges</code>.</p>`,
        `<p>It also helps to understand <em>why</em> the order is what it is. Angular renders a tree of views, and change detection walks that tree from the root down. When it reaches a component it first processes its inputs (firing <code>ngOnChanges</code>), then — on the first visit — runs one-time init, then processes the component's <em>content</em> (the nodes projected into its <code>&lt;ng-content&gt;</code> from outside), and only then its own <em>view</em> (the template it declares) including any child components nested inside. Because a child's view is part of the parent's view, the child is fully initialised before the parent's view finishes; that is the mechanical reason the parent's <code>ngAfterViewInit</code> fires last. Holding this "tree walk" picture in your head lets you predict hook order for any nesting without memorising rules.</p>`,
        `<p>Directives share the very same hooks as components, minus the two view-related pairs: a plain attribute directive has no view or projected content of its own, so it only sees <code>ngOnChanges</code>, <code>ngOnInit</code>, <code>ngDoCheck</code> and <code>ngOnDestroy</code>. This is worth remembering because interviewers sometimes ask "do directives have lifecycle hooks?" — the answer is yes, the same ones that make sense for something without a template.</p>`,
        `<h2>Code examples</h2>`,
        `<p>A component that implements the main hooks, with comments on the guarantees each one gives you:</p>`,
        `<pre><code class="language-typescript">import { Component, Input, OnChanges, OnInit, DoCheck,
  AfterViewInit, OnDestroy, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-lifecycle-demo',
  standalone: true,
  template: \\\`&lt;p&gt;{{ label }}&lt;/p&gt;\\\`,
})
export class LifecycleDemoComponent
  implements OnChanges, OnInit, DoCheck, AfterViewInit, OnDestroy {

  @Input() label = '';
  private timerId?: ReturnType&lt;typeof setInterval&gt;;

  // Fires before the first ngOnInit and on every @Input reference change.
  ngOnChanges(changes: SimpleChanges) {
    const c = changes['label'];
    if (c) console.log(c.previousValue, '=&gt;', c.currentValue, c.firstChange);
  }

  // One-time setup. Inputs are ready — safe to fetch data.
  ngOnInit() {
    this.timerId = setInterval(() =&gt; {}, 1000);
  }

  // Runs on EVERY change-detection cycle — keep it cheap!
  ngDoCheck() { /* custom dirty checks only */ }

  // The view (and @ViewChild refs) now exist.
  ngAfterViewInit() { /* measure/focus DOM here */ }

  // Always clean up to avoid leaks.
  ngOnDestroy() {
    if (this.timerId) clearInterval(this.timerId);
  }
}</code></pre>`,
        `<p>The modern, hook-free way to run cleanup — <code>takeUntilDestroyed()</code> ties a subscription to the component's destruction without an <code>ngOnDestroy</code>:</p>`,
        `<pre><code class="language-typescript">import { Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

@Component({ selector: 'app-clock', standalone: true, template: '' })
export class ClockComponent {
  // Must run in an injection context (field initialiser or constructor).
  private ticks = interval(1000)
    .pipe(takeUntilDestroyed())
    .subscribe(t =&gt; console.log('tick', t));
}</code></pre>`,
        `<p>And the reactive replacement for <code>ngOnChanges</code> — a signal input feeding a <code>computed</code>, so derived state updates automatically when the parent changes the input:</p>`,
        `<pre><code class="language-typescript">import { Component, input, computed, effect } from '@angular/core';

@Component({
  selector: 'app-price',
  standalone: true,
  template: \\\`&lt;p&gt;Total: {{ total() }}&lt;/p&gt;\\\`,
})
export class PriceComponent {
  qty = input.required&lt;number&gt;();
  unitPrice = input(0);

  // No ngOnChanges needed — recomputes when either input changes.
  total = computed(() =&gt; this.qty() * this.unitPrice());

  constructor() {
    // effect() replaces "react to input change" side-effects.
    effect(() =&gt; console.log('total is now', this.total()));
  }
}</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Reading inputs or the DOM in the constructor.</strong> Inputs are unset and the view does not exist yet. Move that logic to <code>ngOnInit</code> (for inputs) or <code>ngAfterViewInit</code> (for DOM).</li>`,
        `<li><strong>Expecting <code>ngOnChanges</code> on a mutated object.</strong> Angular compares by reference; mutating a bound array or object leaves the reference unchanged, so the hook never fires. Pass a new reference, or use signal inputs.</li>`,
        `<li><strong>Mutating state in <code>ngAfterViewInit</code>/<code>...Checked</code> that the view already read.</strong> This throws <code>ExpressionChangedAfterItHasBeenCheckedError</code> in dev mode. Defer the change (e.g. a microtask, or restructure so the value is set earlier).</li>`,
        `<li><strong>Forgetting <code>ngOnDestroy</code> cleanup.</strong> Un-cleared <code>setInterval</code>, manual <code>addEventListener</code>, and un-unsubscribed observables leak. Prefer <code>takeUntilDestroyed()</code> or the <code>async</code> pipe so cleanup is automatic.</li>`,
        `<li><strong>Heavy work in <code>ngDoCheck</code>.</strong> It runs on every cycle; a slow implementation tanks performance across the whole app.</li>`,
        `<li><strong>Async work leaving the hook "unfinished".</strong> Returning a promise from <code>ngOnInit</code> does nothing special — Angular does not await it. Timing-sensitive setup must be synchronous or explicitly coordinated.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Do initialisation and data fetching in <code>ngOnInit</code>, not the constructor.</li>`,
        `<li>Use <code>ngAfterViewInit</code> for anything that needs real DOM nodes or view/content children.</li>`,
        `<li>Prefer signal inputs + <code>computed()</code> over hand-written <code>ngOnChanges</code> for derived state.</li>`,
        `<li>Prefer <code>takeUntilDestroyed()</code> or the <code>async</code> pipe over manual <code>ngOnDestroy</code> unsubscription.</li>`,
        `<li>Keep <code>ngDoCheck</code> and the <code>...Checked</code> hooks tiny; treat them as a last resort.</li>`,
        `<li>Always implement the interface for the hooks you use — it is free compile-time protection against typos.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is the exact order the lifecycle hooks fire in?"</strong><br>A: constructor, then ngOnChanges, ngOnInit, ngDoCheck, ngAfterContentInit, ngAfterContentChecked, ngAfterViewInit, ngAfterViewChecked, and finally ngOnDestroy. Follow-up trap they love: content hooks always precede view hooks, and a parent's ngAfterViewInit runs after its children's.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why can't you read an @Input in the constructor?"</strong><br>A: The constructor runs at instantiation/DI time, before Angular has processed the template bindings. Inputs are first available in ngOnChanges, and reliably in ngOnInit.</p></blockquote>`,
        `<blockquote><p><strong>Q: "ngOnChanges isn't firing when I update my array — why?"</strong><br>A: Angular compares inputs with Object.is (reference equality). Mutating the array keeps the same reference, so no change is detected. Emit a new array reference or use signal inputs, which track value changes reactively.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Which hooks run on every change-detection cycle, and why does that matter?"</strong><br>A: ngDoCheck, ngAfterContentChecked and ngAfterViewChecked. They can run many times per second, so expensive logic there degrades the whole app. The Init variants, by contrast, run once.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Where do you clean up subscriptions, and what is the modern approach?"</strong><br>A: Classically in ngOnDestroy. Modern Angular prefers takeUntilDestroyed() (from @angular/core/rxjs-interop) or the async pipe, both of which unsubscribe automatically when the component is destroyed.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What causes ExpressionChangedAfterItHasBeenCheckedError?"</strong><br>A: Changing a bound value after Angular has already checked it in the same cycle — often by mutating state in ngAfterViewInit or a Checked hook. It only throws in dev mode as a guard; fix it by setting the value earlier or deferring the update.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li>Order: OnChanges &rarr; OnInit &rarr; DoCheck &rarr; AfterContentInit/Checked &rarr; AfterViewInit/Checked &rarr; OnDestroy.</li>`,
        `<li>Constructor = DI only; inputs/DOM not ready.</li>`,
        `<li>Init/fetch data &rarr; ngOnInit. Touch DOM/@ViewChild &rarr; ngAfterViewInit.</li>`,
        `<li>ngOnChanges = reference change on @Input; mutation won't trigger it.</li>`,
        `<li>Every-cycle hooks (DoCheck, ...Checked) must stay cheap.</li>`,
        `<li>Cleanup in ngOnDestroy — or better, takeUntilDestroyed() / async pipe.</li>`,
        `<li>Signals: input() + computed() often removes the need for ngOnChanges entirely.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    {
      title: 'Data Binding',
      slug: 'data-binding',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Data binding is the beating heart of Angular templates. It is the mechanism that keeps your component class and the DOM the user sees in sync, so that changing a property in TypeScript updates the screen, and a user clicking a button runs your method. Nearly every line of an Angular template is some form of binding, so a shaky mental model here shows up as flickering UIs, stale data, and "why won't this update?" confusion everywhere else.</p>`,
        `<p>Interviewers probe data binding because the four binding syntaxes map cleanly onto <em>direction of data flow</em>, and being able to articulate that — data into the view versus events out to the class — demonstrates that you understand how Angular templates actually work rather than having pattern-matched some symbols. It is also the natural gateway into change detection, two-way binding, and the newer control-flow syntax.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Angular gives you four ways to bind, and each is defined by which direction the data moves between the component class and the template:</p>`,
        `<ul>`,
        `<li><strong>Interpolation</strong> <code>{{ value }}</code> — class &rarr; view, rendered as text.</li>`,
        `<li><strong>Property binding</strong> <code>[prop]="value"</code> — class &rarr; view, sets a DOM property (not just an attribute).</li>`,
        `<li><strong>Event binding</strong> <code>(event)="handler($event)"</code> — view &rarr; class, runs a method on a user action.</li>`,
        `<li><strong>Two-way binding</strong> <code>[(ngModel)]="value"</code> — both directions, which is just property binding plus event binding combined.</li>`,
        `</ul>`,
        `<p>The syntax is a memory aid in itself: <strong>square brackets point data <em>into</em> the view</strong>, <strong>parentheses send events <em>out</em> to the class</strong>, and the "banana in a box" <code>[()]</code> does both at once.</p>`,
        `{{fig:ch2-data-binding.svg|The four kinds of data binding and their direction|Interpolation and property binding flow from class to view; event binding flows from view to class; two-way binding does both.}}`,
        `<h2>How it works</h2>`,
        `<p>The single most important subtlety is that <strong>property binding targets DOM properties, not HTML attributes</strong>. Attributes are the initial values written in the markup; properties are the live state of the DOM object. <code>[value]="name"</code> sets the element's <code>value</code> property on every change-detection pass, which is why it stays in sync. When there is no matching DOM property — for ARIA, SVG, or custom <code>data-</code> hooks — you use attribute binding explicitly: <code>[attr.aria-label]="label"</code>.</p>`,
        `<table>`,
        `<thead><tr><th>Syntax</th><th>Binds to</th><th>Direction</th><th>Typical use</th></tr></thead>`,
        `<tbody>`,
        `<tr><td><code>{{ expr }}</code></td><td>Text content</td><td>Class &rarr; view</td><td>Displaying a value inline</td></tr>`,
        `<tr><td><code>[prop]="expr"</code></td><td>DOM property</td><td>Class &rarr; view</td><td><code>[disabled]</code>, <code>[src]</code>, <code>[value]</code></td></tr>`,
        `<tr><td><code>[attr.x]="expr"</code></td><td>HTML attribute</td><td>Class &rarr; view</td><td>ARIA, SVG, colspan</td></tr>`,
        `<tr><td><code>[class.x]</code> / <code>[style.x]</code></td><td>CSS class / style</td><td>Class &rarr; view</td><td>Conditional styling</td></tr>`,
        `<tr><td><code>(event)="fn()"</code></td><td>DOM/output event</td><td>View &rarr; class</td><td>Clicks, input, custom events</td></tr>`,
        `<tr><td><code>[(x)]="expr"</code></td><td>Property + event</td><td>Both</td><td>Form fields, custom two-way</td></tr>`,
        `</tbody>`,
        `</table>`,
        `<p>Every binding expression is evaluated during change detection. Angular re-runs each template expression on a checked component and updates the DOM only where the result differs. This is why template expressions must be cheap and side-effect free: a getter or method call in <code>{{ }}</code> runs on <em>every</em> cycle, and doing real work there is a common performance trap. It is also why interpolation is safe against injection — Angular treats interpolated values as text and escapes them, and it sanitises values bound to security-sensitive properties like <code>[innerHTML]</code>.</p>`,
        `<p>Two-way binding is not a special primitive. <code>[(x)]="prop"</code> is pure syntactic sugar that Angular expands to <code>[x]="prop" (xChange)="prop = $event"</code>. That is why any custom component can support it: expose an input <code>x</code> and an output named <code>xChange</code> (or, in modern Angular, a single <code>model()</code> signal that wires both automatically). <code>ngModel</code> is just this pattern implemented by the Forms module for native controls.</p>`,
        `<p>It is worth being precise about the different bracket flavours, because interviewers probe the edges. Beyond the four basics there are <strong>class and style bindings</strong> that Angular treats specially. <code>[class.active]="isActive"</code> toggles a single class; <code>[class]="classExpr"</code> and <code>ngClass</code> set many at once. <code>[style.width.px]="w"</code> even lets you attach a unit, so binding the number <code>200</code> renders <code>width: 200px</code>. These are still one-directional class-to-view bindings, just with sugar for the common DOM manipulations. And event bindings expose a special <code>$event</code> variable: for native DOM events it is the browser <code>Event</code> object, while for a custom component output it is whatever value the child passed to <code>emit()</code> — a subtle but frequently-tested distinction.</p>`,
        `<p>One more mechanism underpins how bindings stay live: <strong>change detection</strong>. By default Angular runs change detection in response to events, timers, and completed HTTP requests (historically via Zone.js patching browser APIs). On each run it re-evaluates the template expressions of the components it checks and diffs the results against the last rendered value, writing only the differences to the DOM. Bindings are therefore <em>pull-based snapshots</em>: Angular reads your expression, it never "watches" a variable. This is exactly why a mutation that does not change what an expression returns can leave the DOM stale, and why the modern signal-based model — where reading a signal in a template registers a precise dependency — is such a meaningful upgrade.</p>`,
        `<p>Two safety features are worth naming because interviewers use them to separate surface knowledge from depth. First, Angular template expressions run in a <strong>restricted context</strong>: you cannot use assignments (beyond event handlers), <code>new</code>, chained expressions, bitwise operators, or global references like <code>window</code>. The template can only see the component instance's members, which keeps templates declarative and analysable. Second, template expressions should be <strong>idempotent</strong> — calling them twice must produce the same result — because in development mode Angular runs change detection a second time to verify nothing changed, and a non-idempotent expression is exactly what trips <code>ExpressionChangedAfterItHasBeenCheckedError</code>. Both constraints exist to make the pull-based model predictable.</p>`,
        `<h2>Code examples</h2>`,
        `<p>All four binding types in one small standalone component:</p>`,
        `<pre><code class="language-typescript">import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bindings',
  standalone: true,
  imports: [FormsModule],
  template: \\\`
    &lt;!-- Interpolation: class -&gt; view --&gt;
    &lt;h3&gt;Hello, {{ name }}&lt;/h3&gt;

    &lt;!-- Property binding: sets the DOM .disabled property --&gt;
    &lt;button [disabled]="name.length === 0"&gt;Save&lt;/button&gt;

    &lt;!-- Event binding: view -&gt; class --&gt;
    &lt;button (click)="reset()"&gt;Reset&lt;/button&gt;

    &lt;!-- Two-way binding via ngModel --&gt;
    &lt;input [(ngModel)]="name" placeholder="Your name" /&gt;

    &lt;!-- Attribute + class + style binding --&gt;
    &lt;span [attr.aria-label]="name"
          [class.active]="name.length &gt; 0"
          [style.color]="name ? 'green' : 'gray'"&gt;status&lt;/span&gt;
  \\\`,
})
export class BindingsComponent {
  name = '';
  reset() { this.name = ''; }
}</code></pre>`,
        `<p>Building custom two-way binding the old way — an input paired with a <code>Change</code> output:</p>`,
        `<pre><code class="language-typescript">import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: \\\`
    &lt;button (click)="dec()"&gt;-&lt;/button&gt;
    {{ count }}
    &lt;button (click)="inc()"&gt;+&lt;/button&gt;
  \\\`,
})
export class CounterComponent {
  @Input() count = 0;
  @Output() countChange = new EventEmitter&lt;number&gt;();
  inc() { this.countChange.emit(this.count + 1); }
  dec() { this.countChange.emit(this.count - 1); }
}
// Parent uses it with: &lt;app-counter [(count)]="total" /&gt;</code></pre>`,
        `<p>The modern signal version collapses that to a single line with <code>model()</code>:</p>`,
        `<pre><code class="language-typescript">import { Component, model } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: \\\`
    &lt;button (click)="count.set(count() - 1)"&gt;-&lt;/button&gt;
    {{ count() }}
    &lt;button (click)="count.set(count() + 1)"&gt;+&lt;/button&gt;
  \\\`,
})
export class CounterComponent {
  count = model(0); // one signal = input + output, supports [(count)]
}</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Confusing attributes and properties.</strong> <code>disabled="{{isDisabled}}"</code> sets the string "false" (still disabled!). Use <code>[disabled]="isDisabled"</code> so the boolean property is set correctly.</li>`,
        `<li><strong>Calling methods/getters inside interpolation.</strong> <code>{{ computeTotal() }}</code> runs on every change-detection cycle. Precompute the value, use a signal/<code>computed</code>, or a pure pipe.</li>`,
        `<li><strong>Expecting <code>[(ngModel)]</code> to work without FormsModule.</strong> It lives in <code>@angular/forms</code>; you must import <code>FormsModule</code> in a standalone component's <code>imports</code>.</li>`,
        `<li><strong>Binding to a non-existent DOM property.</strong> ARIA/SVG/<code>colspan</code> have no matching JS property — use <code>[attr.x]</code>.</li>`,
        `<li><strong>Assuming <code>[(x)]</code> is magic.</strong> It expands to <code>[x]</code> + <code>(xChange)</code>; a custom two-way binding must expose an output whose name is exactly the input plus <code>Change</code> (or use <code>model()</code>).</li>`,
        `<li><strong>Trusting <code>[innerHTML]</code> with user data.</strong> Angular sanitises it, which can silently strip content; for text prefer interpolation, and never bypass sanitisation with untrusted input.</li>`,
        `<li><strong>Assigning inside a template expression.</strong> Expressions like <code>{{ count = count + 1 }}</code> are rejected — template expressions are meant to be read-only reads. Do the mutation in an event handler or a method.</li>`,
        `<li><strong>Forgetting the unit on style bindings.</strong> <code>[style.width]="200"</code> silently does nothing because it lacks a unit; write <code>[style.width.px]="200"</code> or <code>[style.width]="'200px'"</code>.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Reach for property binding <code>[prop]</code> over string interpolation for anything that is not literally text.</li>`,
        `<li>Keep template expressions cheap, pure, and free of side effects.</li>`,
        `<li>Prefer <code>[class.x]</code> and <code>[style.x]</code> (or <code>ngClass</code>/<code>ngStyle</code>) over string-concatenating class names.</li>`,
        `<li>Use signals or <code>computed()</code> for derived display values instead of methods in the template.</li>`,
        `<li>For custom two-way binding, use <code>model()</code> in new code; it is less boilerplate and type-safe.</li>`,
        `<li>Let Angular's sanitiser do its job — never bypass it for user-provided HTML.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What are the four types of data binding in Angular?"</strong><br>A: Interpolation and property binding (class to view), event binding (view to class), and two-way binding (both). The bracket/parenthesis syntax encodes the direction of data flow.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What's the difference between property binding and attribute binding?"</strong><br>A: Property binding sets a live DOM property; attribute binding sets the HTML attribute. Most bindings should be property bindings; use [attr.x] only when there is no corresponding DOM property, e.g. ARIA, SVG, or colspan.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How does two-way binding actually work under the hood?"</strong><br>A: [(x)]="p" desugars to [x]="p" (xChange)="p = $event". It is property binding plus event binding; there is no separate two-way primitive. model() gives you both from one signal.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Is it bad to call a function inside interpolation? Why?"</strong><br>A: Yes, generally — the expression re-evaluates on every change-detection cycle, so a costly function runs constantly. Use a precomputed field, a signal/computed, or a pure pipe instead.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why does binding disabled with interpolation not disable my button correctly?"</strong><br>A: Interpolation produces a string, and any non-empty string attribute value is truthy for disabled — even the text "false". You need the property binding [disabled]="flag" to set the boolean DOM property.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How does Angular protect against XSS in bindings?"</strong><br>A: Interpolation escapes values as text, and Angular sanitises values bound to sensitive sinks like [innerHTML], stripping dangerous markup unless you explicitly and deliberately mark a value as trusted.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is $event in an event binding?"</strong><br>A: For a native DOM event it's the browser Event object; for a custom component output it's whatever payload the child passed to emit(). Same syntax, different source — a detail interviewers use to check you understand outputs aren't DOM events.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li>{{ }} = text out to view; [prop] = DOM property; (event) = action to class; [( )] = both.</li>`,
        `<li>[ ] points data IN; ( ) sends events OUT; banana-in-a-box does both.</li>`,
        `<li>Property binding targets DOM properties, not attributes; use [attr.x] for the exceptions.</li>`,
        `<li>[(x)] = [x] + (xChange); custom two-way needs an xChange output or a model().</li>`,
        `<li>[(ngModel)] needs FormsModule imported.</li>`,
        `<li>Keep template expressions pure and cheap; no fat function calls in {{ }}.</li>`,
        `<li>Style bindings need units: [style.width.px]="200", not [style.width]="200".</li>`,
        `<li>$event = DOM Event for native events, emitted payload for component outputs.</li>`,
        `<li>Bindings are pull-based snapshots re-read on each change-detection pass — mutation without a new value can leave the DOM stale.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    {
      title: 'Input & Output (Component Communication)',
      slug: 'input-output',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Components are Angular's unit of composition, and <code>@Input</code>/<code>@Output</code> — now the signal-based <code>input()</code>/<code>output()</code> — are the contract by which a parent and child talk to each other. Get this contract right and your UI decomposes into small, reusable, testable pieces. Get it wrong and you end up with god components, prop-drilling nightmares, and tight coupling that makes every change risky.</p>`,
        `<p>This is one of the highest-frequency interview areas because it exposes whether a candidate understands Angular's core data-flow philosophy: <strong>data flows down through inputs, events flow up through outputs</strong>. It also happens to be where the framework changed the most recently — the shift from decorators to signal inputs is exactly the kind of "are you current?" signal interviewers look for.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>An <strong>input</strong> is data a parent passes down into a child. An <strong>output</strong> is an event a child emits up to its parent. The child never reaches into the parent; it just announces "something happened" and lets the parent decide what to do. This keeps children reusable — they know nothing about who is using them.</p>`,
        `<p>In modern Angular you declare these as signals. <code>input()</code> returns a read-only signal you call like <code>this.total()</code>. <code>output()</code> returns an emitter you call with <code>this.save.emit(value)</code>. And <code>model()</code> is a writable signal that acts as input <em>and</em> output at once, enabling two-way binding.</p>`,
        `{{fig:ch2-input-output.svg|Inputs flow down and outputs flow up|The parent passes data to the child via input bindings; the child notifies the parent via output events.}}`,
        `<h2>How it works</h2>`,
        `<p>The classic decorator API and the modern signal API express the same idea differently. The table shows the mapping:</p>`,
        `<table>`,
        `<thead><tr><th>Classic (decorator)</th><th>Modern (signal)</th><th>Notes</th></tr></thead>`,
        `<tbody>`,
        `<tr><td><code>@Input() name = ''</code></td><td><code>name = input('')</code></td><td>Signal input is read-only: <code>this.name()</code></td></tr>`,
        `<tr><td><code>@Input({ required: true })</code></td><td><code>input.required&lt;T&gt;()</code></td><td>Compile-time required check</td></tr>`,
        `<tr><td><code>@Input() set x(v) {...}</code></td><td><code>input()</code> + <code>computed()</code></td><td>Transform via <code>transform</code> option or derive</td></tr>`,
        `<tr><td><code>@Output() save = new EventEmitter()</code></td><td><code>save = output&lt;T&gt;()</code></td><td><code>output()</code> is not an EventEmitter subclass</td></tr>`,
        `<tr><td><code>@Input() + @Output() xChange</code></td><td><code>x = model()</code></td><td><code>model()</code> supports <code>[(x)]</code></td></tr>`,
        `</tbody>`,
        `</table>`,
        `<p>Signal inputs bring real advantages beyond syntax. They are <strong>reactive</strong>: you can feed them straight into <code>computed()</code> and <code>effect()</code>, so derived state and side effects update automatically without <code>ngOnChanges</code>. They support <strong>transforms</strong> — <code>input(0, { transform: numberAttribute })</code> coerces the bound value. And <code>input.required()</code> is enforced by the type system: the app will not compile if a required input is never bound, catching a whole class of runtime bugs at build time.</p>`,
        `<p>Inputs are set during the parent's change detection, before the child's <code>ngOnInit</code>. That is why a required input is guaranteed available in <code>ngOnInit</code> but not in the constructor. With signal inputs there is a further subtlety: reading <code>this.name()</code> in a field initialiser can throw because the value is not set that early — read them in the template, in <code>computed</code>, in <code>effect</code>, or in a lifecycle hook instead.</p>`,
        `<p>Outputs, meanwhile, are pure emitters. <code>output()</code> is deliberately <em>not</em> an <code>EventEmitter</code>; it exposes only <code>emit()</code> and <code>subscribe()</code>, which discourages the anti-pattern of components reaching into each other's emitters. You can also derive an output from an observable with <code>outputFromObservable()</code> when the event source is a stream.</p>`,
        `<p>A common follow-up is <em>how</em> inputs and outputs relate to change detection. Passing a new input value into a child marks that child as needing a check, so its bindings re-render — this is how "data down" stays in sync. Emitting an output, because it fires from an event handler, schedules a change-detection pass just like any other event. This tidy loop (parent updates state &rarr; input flows down &rarr; child renders; child emits &rarr; parent handler updates state &rarr; repeats) is the whole basis of predictable, unidirectional data flow in Angular, and being able to narrate it is what separates a memorised answer from an understood one.</p>`,
        `<p>It is important to know what inputs/outputs are <em>not</em> for. They connect a parent to its <em>direct</em> child. When two components are far apart in the tree, or unrelated siblings, threading data through every intermediate component ("prop drilling") becomes painful and couples the middle layers to data they do not care about. The idiomatic answer there is a shared <strong>service</strong> — often holding signals or a <code>BehaviorSubject</code> — that both components inject, or a state-management library. A good rule of thumb: inputs/outputs for local parent-child composition, services for cross-cutting or shared application state. Interviewers frequently escalate an input/output question into this "how would you scale it?" territory, so have the service answer ready.</p>`,
        `<p>Finally, note the aliasing and required semantics. You can rename a public binding with an alias (<code>input('', { alias: 'label' })</code> or <code>@Input('label')</code>), which changes only how templates bind to it, not the class field name. And <code>input.required()</code> shifts a whole class of bugs left: with the old <code>@Input()</code> a forgotten binding surfaced as an <code>undefined</code> at runtime deep inside the component, whereas a required signal input makes the Angular template type-checker fail the build if a consumer omits it. The same reasoning applies to transforms — coercing an attribute string to a boolean or number at the boundary means the rest of the component works with clean, correctly-typed values rather than defensively re-parsing them.</p>`,
        `{{fig:ch2-model-binding.svg|model combines input and output for two-way binding|A model() signal exposes both value and valueChange, so a parent can use two-way binding and the child can update the parent with value.set().}}`,
        `<h2>Code examples</h2>`,
        `<p>A modern child with a required input, an optional input, and an output:</p>`,
        `<pre><code class="language-typescript">import { Component, input, output, computed } from '@angular/core';

interface Product { id: string; name: string; price: number; }

@Component({
  selector: 'app-product-card',
  standalone: true,
  template: \\\`
    &lt;article&gt;
      &lt;h4&gt;{{ product().name }}&lt;/h4&gt;
      &lt;p&gt;{{ priceLabel() }}&lt;/p&gt;
      &lt;button (click)="addToCart.emit(product())"&gt;Add&lt;/button&gt;
    &lt;/article&gt;
  \\\`,
})
export class ProductCardComponent {
  product = input.required&lt;Product&gt;();      // must be bound
  currency = input('USD');                   // optional, defaulted
  addToCart = output&lt;Product&gt;();             // event up to parent

  // Derived, recomputes when product() or currency() changes.
  priceLabel = computed(
    () =&gt; this.currency() + ' ' + this.product().price.toFixed(2)
  );
}</code></pre>`,
        `<p>The parent binds the input and handles the output — data down, events up:</p>`,
        `<pre><code class="language-typescript">import { Component, signal } from '@angular/core';
import { ProductCardComponent } from './product-card.component';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [ProductCardComponent],
  template: \\\`
    &#64;for (p of products(); track p.id) {
      &lt;app-product-card [product]="p" currency="EUR"
                        (addToCart)="onAdd($event)" /&gt;
    }
    &lt;p&gt;Cart: {{ cart().length }} item(s)&lt;/p&gt;
  \\\`,
})
export class CatalogComponent {
  products = signal([{ id: '1', name: 'Book', price: 9.5 }]);
  cart = signal&lt;{ id: string }[]&gt;([]);
  onAdd(p: { id: string }) { this.cart.update(c =&gt; [...c, p]); }
}</code></pre>`,
        `<p>Input transforms and a two-way <code>model()</code> together:</p>`,
        `<pre><code class="language-typescript">import { Component, input, model, booleanAttribute } from '@angular/core';

@Component({
  selector: 'app-toggle',
  standalone: true,
  template: \\\`
    &lt;button [disabled]="disabled()" (click)="on.set(!on())"&gt;
      {{ on() ? 'ON' : 'OFF' }}
    &lt;/button&gt;
  \\\`,
})
export class ToggleComponent {
  // "&lt;app-toggle disabled&gt;" (empty string) coerces to true.
  disabled = input(false, { transform: booleanAttribute });
  // Parent can two-way bind the on state: &lt;app-toggle [(on)]="isActive" /&gt;
  on = model(false);
}</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Reading a signal input too early.</strong> Accessing <code>this.name()</code> in a field initialiser or the constructor can throw — inputs aren't set yet. Read them in the template, a <code>computed</code>, an <code>effect</code>, or <code>ngOnInit</code>.</li>`,
        `<li><strong>Mutating an input object in the child.</strong> The parent still owns that reference; mutating it creates spooky action at a distance. Emit an output and let the parent update its own state.</li>`,
        `<li><strong>Wrong two-way naming.</strong> With the classic API, two-way binding on <code>rating</code> requires an output named exactly <code>ratingChange</code>. A typo silently breaks the binding. <code>model()</code> removes this footgun.</li>`,
        `<li><strong>Expecting <code>ngOnChanges</code> with signal inputs.</strong> Signal inputs don't call <code>ngOnChanges</code>; react with <code>computed</code>/<code>effect</code> instead.</li>`,
        `<li><strong>Treating <code>output()</code> like an EventEmitter.</strong> It only has <code>emit</code>/<code>subscribe</code> — no <code>.complete()</code>, no RxJS operators. Use <code>outputFromObservable()</code> if you need a stream.</li>`,
        `<li><strong>Using @Input aliases needlessly.</strong> Aliasing (<code>input('', { alias: 'name' })</code>) obscures the public API; only alias when you truly must.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Enforce "data down, events up" — children never reach into parents.</li>`,
        `<li>Use <code>input.required()</code> for genuinely mandatory inputs to get compile-time safety.</li>`,
        `<li>Prefer signal inputs + <code>computed()</code> over setter-based inputs and <code>ngOnChanges</code>.</li>`,
        `<li>Use <code>model()</code> for two-way binding rather than the manual input + <code>xChange</code> pair.</li>`,
        `<li>Keep outputs semantic (name the event, e.g. <code>saved</code>, <code>selectionChanged</code>), not implementation-driven.</li>`,
        `<li>Use <code>transform</code> (e.g. <code>booleanAttribute</code>, <code>numberAttribute</code>) to coerce attribute values cleanly.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "How do a parent and child component communicate in Angular?"</strong><br>A: Data flows down via inputs (input()/@Input) and events flow up via outputs (output()/@Output). The child stays decoupled — it emits events without knowing who consumes them. For shared state across unrelated components you'd use a service instead.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What advantages do signal inputs have over @Input?"</strong><br>A: They're reactive (feed straight into computed/effect, no ngOnChanges), support required inputs enforced at compile time, and support value transforms. They also read as plain signals, unifying the reactive model.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is model() and when would you use it?"</strong><br>A: model() is a writable signal that acts as both input and output, enabling two-way binding with far less boilerplate than the classic input + xChange pair. Use it for components that own a value the parent also wants to bind, like a rating or toggle.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why does reading a signal input in the constructor throw?"</strong><br>A: Inputs aren't bound until the parent's change detection runs, which is after construction. Read them where they're guaranteed set — in the template, a computed, an effect, or ngOnInit.</p></blockquote>`,
        `<blockquote><p><strong>Q: "The classic two-way binding on size isn't working — what would you check?"</strong><br>A: The output must be named exactly sizeChange; two-way binding desugars to [size] + (sizeChange). A mismatched name is the usual culprit. model() avoids this entirely.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How would you pass data between two sibling components?"</strong><br>A: Not directly through inputs/outputs. Either lift the state up to the common parent and pass down/emit up, or share a service (often signal- or observable-backed) that both siblings inject.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do inputs and outputs relate to change detection?"</strong><br>A: A changed input marks the child for check so it re-renders; an emitted output runs from an event handler, which schedules a change-detection pass. Together they form the unidirectional loop: state down as inputs, events up as outputs, then the parent updates state again.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li>Inputs = data DOWN (input(), @Input). Outputs = events UP (output(), @Output).</li>`,
        `<li>Signal input is read-only: this.x(). output(): this.e.emit(v).</li>`,
        `<li>input.required&lt;T&gt;() = compile-time mandatory; input(def, { transform }) coerces.</li>`,
        `<li>model() = input + output, supports two-way binding.</li>`,
        `<li>Classic two-way needs an xChange output; name must match exactly.</li>`,
        `<li>Don't read signal inputs in constructor/field init; use computed/effect/ngOnInit.</li>`,
        `<li>Siblings talk via a shared service or a lifted-up parent, not directly.</li>`,
        `<li>Alias renames only the template binding, not the class field; use sparingly.</li>`,
        `<li>Data down + events up = Angular's unidirectional loop, driving change detection.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    {
      title: 'ViewChild & ContentChild',
      slug: 'viewchild-contentchild',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Most of the time Angular's declarative bindings are all you need, but occasionally you must grab a direct reference to a child element, component, or directive — to focus an input, measure an element, scroll to a position, or call a method on a child. <code>@ViewChild</code>/<code>@ContentChild</code> and their signal-based successors <code>viewChild()</code>/<code>contentChild()</code> are how you reach for those references safely, within Angular's timing rules.</p>`,
        `<p>Interviewers love this topic because it hinges on a distinction many developers get fuzzy on: <strong>the view versus projected content</strong>. Answering confidently about which query sees which, and in which lifecycle hook each becomes available, signals a real understanding of how Angular assembles a component from its own template plus whatever a parent projects into it.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A <strong>ViewChild</strong> query finds something in the component's <em>own template</em> — the HTML you wrote in that component's <code>template</code>. A <strong>ContentChild</strong> query finds something that a <em>parent projected in</em> through <code>&lt;ng-content&gt;</code>. Same idea, two different DOM regions: your view versus your content.</p>`,
        `<p>The plural variants — <code>viewChildren()</code> and <code>contentChildren()</code> — return all matches instead of the first. You can query by a template reference variable (<code>#box</code>), a component/directive type, or a <code>TemplateRef</code>.</p>`,
        `{{fig:ch2-view-vs-content.svg|ViewChild queries the view ContentChild queries projected content|viewChild finds elements in the component's own template and is ready in ngAfterViewInit; contentChild finds projected content and is ready in ngAfterContentInit.}}`,
        `<h2>How it works</h2>`,
        `<p>The critical rule is <strong>timing</strong>: view queries and content queries resolve at different points in the lifecycle, because Angular initialises projected content before it finishes the host view.</p>`,
        `<table>`,
        `<thead><tr><th>Query</th><th>Finds</th><th>Ready in (decorator API)</th><th>Signal API</th></tr></thead>`,
        `<tbody>`,
        `<tr><td><code>@ViewChild</code></td><td>Element/component in own template</td><td><code>ngAfterViewInit</code></td><td><code>viewChild()</code></td></tr>`,
        `<tr><td><code>@ViewChildren</code></td><td>All matches in own template</td><td><code>ngAfterViewInit</code></td><td><code>viewChildren()</code></td></tr>`,
        `<tr><td><code>@ContentChild</code></td><td>Projected element/component</td><td><code>ngAfterContentInit</code></td><td><code>contentChild()</code></td></tr>`,
        `<tr><td><code>@ContentChildren</code></td><td>All projected matches</td><td><code>ngAfterContentInit</code></td><td><code>contentChildren()</code></td></tr>`,
        `</tbody>`,
        `</table>`,
        `<p>With the classic decorator API there is a further wrinkle: the <code>{ static: true | false }</code> option. A <code>static: true</code> query resolves in <code>ngOnInit</code> (before change detection) but only works for elements that are <em>not</em> inside a structural directive like <code>&#64;if</code>/<code>*ngIf</code>. A <code>static: false</code> query (the default) resolves in <code>ngAfterViewInit</code> and correctly handles conditionally-rendered elements. Getting this wrong yields a maddening <code>undefined</code> reference.</p>`,
        `<p>The <strong>signal queries make all of this dramatically simpler</strong>, and they are the recommended approach in new code. <code>viewChild()</code> returns a signal you read like <code>this.box()</code>; it starts as <code>undefined</code> and updates reactively when the element appears or disappears — no <code>static</code> flag, no worrying about which hook. <code>viewChild.required()</code> throws if the element is never found, giving you a non-nullable type. Because they are signals, you can compose them with <code>computed()</code> and <code>effect()</code> instead of hand-writing lifecycle logic.</p>`,
        `<p>Queries also accept a <code>read</code> option to choose <em>what</em> to extract from a matched node. Querying an element gives you an <code>ElementRef</code> by default, but <code>{ read: SomeDirective }</code> pulls out a directive instance on that element, and <code>{ read: ViewContainerRef }</code> gives you an insertion point for dynamic components. Content queries default to direct children only; pass <code>{ descendants: true }</code> to reach into nested projected content.</p>`,
        `<p>There is a deeper reason the view/content split matters, and it is the same reason the hooks differ. A component's <em>view</em> is the DOM produced by its own <code>template</code> — Angular owns and creates those nodes, so it knows about them as it builds the view, which is why view queries settle by <code>ngAfterViewInit</code>. Its <em>content</em>, by contrast, is DOM that a <em>parent</em> authored and handed in through <code>&lt;ng-content&gt;</code>; those nodes are created by the parent's view and merely projected into a slot, so they are ready earlier, by <code>ngAfterContentInit</code>. When you build a reusable wrapper — a tabs group, an accordion, a form field — you almost always want <strong>content</strong> queries, because the interesting children (the tabs, the panels) are supplied by whoever uses your component, not written inside it. Reaching for <code>ViewChild</code> there is a classic mistake that returns nothing.</p>`,
        `<p>A subtlety that trips people up: what a query can and cannot see across component boundaries. Content queries do not pierce into a projected child component's <em>own</em> internal view — they see the projected nodes and their descendants (with <code>descendants: true</code>), but not the private template of a component nested inside. Likewise, view queries stop at the boundary of child components; you get the child component instance or its host element, not the elements inside <em>its</em> template. This encapsulation is deliberate: it keeps a component's internals private and prevents parents from coupling to a child's DOM structure. If you genuinely need to coordinate, expose a public method or output on the child rather than querying through it.</p>`,
        `<p>Finally, the plural queries return a live, reactive collection. With the signal API, <code>viewChildren()</code> and <code>contentChildren()</code> return a signal of an array that updates as items are added or removed — for example when an <code>&#64;for</code> loop grows. That lets you write derived state like a count or an aggregate with <code>computed()</code>, and it reacts automatically. The old <code>QueryList</code> exposed a <code>changes</code> observable you had to subscribe to manually; the signal versions fold that into the normal reactive graph, which is cleaner and leak-free.</p>`,
        `<p>A word on the imperative APIs you reach through these queries. An <code>ElementRef</code> exposes <code>nativeElement</code>, but touching it directly ties your code to the browser DOM, which breaks under server-side rendering and can open XSS holes if you write user data into it. The safer path is to inject <code>Renderer2</code> and call <code>setAttribute</code>, <code>addClass</code>, <code>listen</code> and friends, which stay platform-agnostic. For truly dynamic UIs, querying a marker element with <code>{ read: ViewContainerRef }</code> gives you an insertion point where <code>createComponent()</code> can instantiate components on the fly — the modern, NgModule-free replacement for the old <code>ComponentFactoryResolver</code>. Knowing that queries are the gateway to these container APIs, not just element grabbing, rounds out the topic.</p>`,
        `<h2>Code examples</h2>`,
        `<p>Signal view query — focus a real input once the view exists:</p>`,
        `<pre><code class="language-typescript">import { Component, viewChild, effect, ElementRef } from '@angular/core';

@Component({
  selector: 'app-search',
  standalone: true,
  template: \\\`&lt;input #box placeholder="Search..." /&gt;\\\`,
})
export class SearchComponent {
  // Reactive reference to the &lt;input&gt;; undefined until it renders.
  box = viewChild&lt;ElementRef&lt;HTMLInputElement&gt;&gt;('box');

  constructor() {
    // Runs whenever box() becomes available.
    effect(() =&gt; this.box()?.nativeElement.focus());
  }
}</code></pre>`,
        `<p>Querying a child <em>component</em> by type and calling its API — with a required query so the type is non-nullable:</p>`,
        `<pre><code class="language-typescript">import { Component, viewChild, AfterViewInit } from '@angular/core';
import { ChartComponent } from './chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ChartComponent],
  template: \\\`
    &lt;app-chart /&gt;
    &lt;button (click)="chart().redraw()"&gt;Redraw&lt;/button&gt;
  \\\`,
})
export class DashboardComponent implements AfterViewInit {
  chart = viewChild.required(ChartComponent);
  ngAfterViewInit() { this.chart().redraw(); }
}</code></pre>`,
        `<p>Content query — a tabs container that discovers the tabs a parent projected into it:</p>`,
        `<pre><code class="language-typescript">import { Component, contentChildren, computed } from '@angular/core';
import { TabComponent } from './tab.component';

@Component({
  selector: 'app-tabs',
  standalone: true,
  template: \\\`
    &lt;nav&gt;
      &#64;for (t of tabs(); track t.id) {
        &lt;button (click)="select(t)"&gt;{{ t.label() }}&lt;/button&gt;
      }
    &lt;/nav&gt;
    &lt;ng-content /&gt;   &lt;!-- projected app-tab children land here --&gt;
  \\\`,
})
export class TabsComponent {
  // All app-tab components the parent projected in.
  tabs = contentChildren(TabComponent);
  count = computed(() =&gt; this.tabs().length);
  select(t: TabComponent) { /* ... */ }
}
// Parent: &lt;app-tabs&gt;&lt;app-tab label="One"/&gt;&lt;app-tab label="Two"/&gt;&lt;/app-tabs&gt;</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Reading a ViewChild in <code>ngOnInit</code> (decorator API, default <code>static: false</code>).</strong> It is <code>undefined</code> there — it resolves in <code>ngAfterViewInit</code>. Signal <code>viewChild()</code> sidesteps this by being reactive.</li>`,
        `<li><strong>Confusing view and content.</strong> <code>@ViewChild</code> cannot see projected <code>&lt;ng-content&gt;</code> children, and <code>@ContentChild</code> cannot see your own template — using the wrong one returns nothing.</li>`,
        `<li><strong>Setting <code>static: true</code> on an element inside <code>&#64;if</code>/<code>*ngIf</code>.</strong> It won't be found because it doesn't exist at <code>ngOnInit</code> time. Use the default (<code>static: false</code>) or a signal query.</li>`,
        `<li><strong>Forgetting the <code>read</code> option.</strong> Querying an element gives an <code>ElementRef</code>; if you wanted a directive instance or a <code>ViewContainerRef</code>, you must pass <code>{ read: ... }</code>.</li>`,
        `<li><strong>Missing <code>{ descendants: true }</code>.</strong> Content queries default to direct children only; nested projected content needs the flag.</li>`,
        `<li><strong>Overusing queries.</strong> Reaching into a child to call methods often means the boundary is wrong; prefer inputs/outputs and let data flow declaratively.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Prefer signal queries (<code>viewChild()</code>/<code>contentChild()</code>) in new code — no <code>static</code> flag, reactive, composable.</li>`,
        `<li>Use <code>.required()</code> when the target must exist, to get a non-nullable type and a clear failure.</li>`,
        `<li>Access decorator-based ViewChild in <code>ngAfterViewInit</code>, ContentChild in <code>ngAfterContentInit</code>.</li>`,
        `<li>Reach for queries only when declarative bindings genuinely can't express it (focus, measure, imperative APIs).</li>`,
        `<li>Use the <code>read</code> option deliberately to extract exactly the token you need.</li>`,
        `<li>Prefer <code>Renderer2</code> or Angular APIs over raw <code>nativeElement</code> DOM manipulation for SSR/security safety.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What's the difference between ViewChild and ContentChild?"</strong><br>A: ViewChild queries the component's own template; ContentChild queries content projected in from a parent via ng-content. They also resolve in different hooks — ViewChild in ngAfterViewInit, ContentChild in ngAfterContentInit.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why is my @ViewChild undefined in ngOnInit?"</strong><br>A: With the default static:false, the view isn't built yet in ngOnInit; the reference is only guaranteed in ngAfterViewInit. Either move the access there, set static:true if the element is unconditional, or use the signal viewChild() which is reactive.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What does the static option do?"</strong><br>A: static:true resolves the query in ngOnInit but only works for elements not inside a structural directive; static:false (default) resolves in ngAfterViewInit and handles conditional elements. Signal queries remove the need for it.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What advantages do signal queries have?"</strong><br>A: They return signals, so they're reactive and composable with computed/effect, they update when the DOM changes, they need no static flag, and .required() gives a non-nullable type with an explicit error if not found.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is the read option for?"</strong><br>A: It selects what to extract from a matched node — an ElementRef, a specific directive instance, a TemplateRef, or a ViewContainerRef — rather than the default. It's essential for getting an insertion point for dynamic components.</p></blockquote>`,
        `<blockquote><p><strong>Q: "When should you NOT use ViewChild?"</strong><br>A: When inputs/outputs can express the interaction declaratively. Imperatively reaching into children couples components and bypasses Angular's data flow; reserve queries for DOM-level needs like focus, measurement, or wrapping third-party widgets.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Building a reusable tabs component, which query do you use for the tab children?"</strong><br>A: contentChildren(TabComponent) — the tabs are projected in by whoever uses the component through ng-content, so they're content, not view. ViewChild would find nothing because they aren't in the tabs component's own template.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Can a query reach into a child component's own template?"</strong><br>A: No. View queries stop at the child's boundary (you get the instance or host element), and content queries see projected nodes but not a nested component's private view. To coordinate, expose a public method or output on the child instead.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li>ViewChild = own template (ready ngAfterViewInit). ContentChild = projected via ng-content (ready ngAfterContentInit).</li>`,
        `<li>Signal queries: viewChild(), contentChild(), plural viewChildren()/contentChildren().</li>`,
        `<li>viewChild() returns a signal (undefined until rendered); viewChild.required() = non-nullable.</li>`,
        `<li>Decorator: static:false (default) &rarr; ngAfterViewInit; static:true &rarr; ngOnInit but no structural directives.</li>`,
        `<li>{ read: ... } picks ElementRef / directive / ViewContainerRef; { descendants: true } for nested content.</li>`,
        `<li>Prefer inputs/outputs; use queries only for real DOM/imperative needs.</li>`,
        `<li>Reusable wrapper (tabs/accordion)? The children are projected — use contentChildren, not viewChild.</li>`,
        `<li>Queries stop at component boundaries; coordinate via public methods/outputs, not by querying internals.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    {
      title: 'View Encapsulation',
      slug: 'view-encapsulation',
      order: 4,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>One of Angular's quiet superpowers is that the CSS you write in a component only styles <em>that</em> component by default. Two components can both define a <code>.card</code> class and never collide. That scoping is called <strong>view encapsulation</strong>, and understanding it is what separates developers who occasionally fight mysterious "my styles leaked / my styles won't apply" bugs from those who reason about them instantly.</p>`,
        `<p>It is a favourite interview topic because it touches browser fundamentals (the Shadow DOM), Angular internals (how it rewrites your selectors), and pragmatic trade-offs (when to break encapsulation and why it is dangerous). A candidate who can explain the three modes and their real DOM consequences demonstrates depth well beyond template syntax.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>View encapsulation is the strategy Angular uses to keep a component's styles scoped to its own template. There are three modes, set per component via the <code>encapsulation</code> metadata:</p>`,
        `<ul>`,
        `<li><strong>Emulated</strong> (the default) — Angular fakes scoping by adding unique attributes to your elements and rewriting your CSS selectors to match them. No real Shadow DOM.</li>`,
        `<li><strong>ShadowDom</strong> — Angular uses the browser's native Shadow DOM to give the component a genuinely isolated DOM subtree and style boundary.</li>`,
        `<li><strong>None</strong> — no scoping at all; the component's styles are injected globally and affect the entire application.</li>`,
        `</ul>`,
        `{{fig:ch2-encapsulation.svg|The three view encapsulation modes|Emulated rewrites selectors with generated attributes; ShadowDom uses a native shadow root; None injects styles globally.}}`,
        `<h2>How it works</h2>`,
        `<p>With <strong>Emulated</strong>, Angular does two things at build/render time. It stamps every element in the component's template with a generated attribute like <code>_ngcontent-abc-c12</code>, and it rewrites each of your CSS rules to include an attribute selector, so <code>.btn { color: red }</code> becomes roughly <code>.btn[_ngcontent-abc-c12] { color: red }</code>. The result is that your rule can only match elements belonging to this component — scoping without any browser Shadow DOM support. This is why it works everywhere and why it is the sensible default.</p>`,
        `<p>A key nuance: Emulated is <strong>one-directional</strong>. Your styles cannot leak <em>out</em>, but global styles (from <code>styles.css</code> or a design system) can still leak <em>in</em> and style your component. That is usually what you want.</p>`,
        `<table>`,
        `<thead><tr><th>Mode</th><th>Mechanism</th><th>Styles leak out?</th><th>Global styles reach in?</th></tr></thead>`,
        `<tbody>`,
        `<tr><td><code>Emulated</code> (default)</td><td>Attribute-rewritten selectors</td><td>No</td><td>Yes</td></tr>`,
        `<tr><td><code>ShadowDom</code></td><td>Native shadow root</td><td>No</td><td>No (mostly blocked)</td></tr>`,
        `<tr><td><code>None</code></td><td>Global style injection</td><td>Yes</td><td>Yes</td></tr>`,
        `</tbody>`,
        `</table>`,
        `<p><strong>ShadowDom</strong> attaches a real shadow root to the host element. Styles are now enforced by the browser: nothing you write escapes, and global styles are (mostly) blocked from entering. This gives the strongest isolation and is ideal when publishing a true custom element / web component. The cost is that it changes DOM semantics — some global CSS, certain third-party libraries, and <code>document</code>-level selectors stop working as expected, and it requires browser Shadow DOM support.</p>`,
        `<p><strong>None</strong> turns scoping off entirely: the component's styles are appended to the document head and apply globally, exactly like styles in <code>styles.css</code>. This is occasionally useful for genuinely global theming, but it is dangerous — a rule like <code>a { color: red }</code> in a <code>None</code> component recolours every link in the app. Because <code>None</code> components emit global styles, a <code>None</code> component's CSS can also leak into <em>Emulated</em> components, which is a frequent source of "where is this style coming from?" mysteries.</p>`,
        `<p>Two related tools matter here. The <code>:host</code> pseudo-class styles the component's own host element from inside its stylesheet, and <code>:host-context(selector)</code> styles the host based on an ancestor (useful for theming, e.g. a <code>.dark</code> class on <code>&lt;body&gt;</code>). The old <code>::ng-deep</code> combinator pierces encapsulation to style child components, but it is <strong>deprecated</strong> and global in effect — scope it under <code>:host</code> and treat it as a last resort.</p>`,
        `<p>To make Emulated concrete, it helps to picture the rendered output. If a component with selector <code>app-card</code> has a rule <code>.title { font-weight: bold }</code>, Angular emits DOM where the host carries a host attribute (<code>_nghost-abc-c1</code>) and each templated element carries a content attribute (<code>_ngcontent-abc-c1</code>), and it rewrites the rule to <code>.title[_ngcontent-abc-c1]</code>. The generated ids are stable per component type, not per instance, so a hundred cards on the page share the same attribute and the same one stylesheet — it is cheap. Crucially, the extra attribute selector only <em>raises specificity slightly</em> and does not build a wall against incoming global rules, which is exactly why global styles can still reach in. This mental model instantly explains most "why is my style behaving oddly?" questions.</p>`,
        `<p>A frequent real-world friction point is styling third-party components (a date picker, a UI library) whose internals sit in a different encapsulation scope than your component. Under Emulated your rewritten selectors will not match their elements, so nothing happens. The clean, future-proof solutions are, in order of preference: use the CSS custom properties or theming API the library exposes; put the override in <code>styles.css</code> as an intentional global; or, only if nothing else works, use <code>::ng-deep</code> tightly scoped under <code>:host</code> so the leak is bounded to your component's subtree. Understanding <em>why</em> the naive approach fails (scoped attribute selectors) is what turns this from trial-and-error into a decision.</p>`,
        `<p>It is also worth separating view encapsulation from a related concept people conflate with it: <strong>content projection</strong>. Encapsulation is about <em>styles</em> — how CSS is scoped. Projection (via <code>&lt;ng-content&gt;</code>) is about <em>DOM composition</em> — how a parent's markup is slotted into a child's template. They are orthogonal: a component can use Emulated encapsulation and still project content, and the projected content keeps the styling context of where it was <em>declared</em>, not where it lands. Being able to draw that line cleanly is a good signal of depth in an interview.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The default Emulated component, plus <code>:host</code> and <code>:host-context</code>:</p>`,
        `<pre><code class="language-typescript">import { Component } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  // encapsulation: ViewEncapsulation.Emulated is the default.
  template: \\\`&lt;div class="card"&gt;&lt;ng-content /&gt;&lt;/div&gt;\\\`,
  styles: [\\\`
    :host { display: block; margin: 8px; }         /* the app-card element */
    .card { border: 1px solid #ddd; padding: 12px; }
    :host-context(.dark) .card { background: #111; } /* themed by ancestor */
  \\\`],
})
export class CardComponent {}</code></pre>`,
        `<p>Opting into full isolation with ShadowDom — nothing in or out:</p>`,
        `<pre><code class="language-typescript">import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-widget',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: \\\`&lt;button class="btn"&gt;Buy&lt;/button&gt;\\\`,
  // These styles live inside a real shadow root — global CSS can't touch them.
  styles: [\\\`.btn { all: unset; background: #16a34a; color: #fff; padding: 8px; }\\\`],
})
export class WidgetComponent {}</code></pre>`,
        `<p>Turning encapsulation off — and why it is risky:</p>`,
        `<pre><code class="language-typescript">import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-legacy-theme',
  standalone: true,
  encapsulation: ViewEncapsulation.None, // styles below become GLOBAL
  template: \\\`&lt;p class="note"&gt;Global styling in effect&lt;/p&gt;\\\`,
  // WARNING: this ".note" rule now applies to EVERY .note in the whole app.
  styles: [\\\`.note { color: crimson; font-style: italic; }\\\`],
})
export class LegacyThemeComponent {}</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Using <code>ViewEncapsulation.None</code> to "make a style work".</strong> It leaks that rule into the whole app. Fix specificity or use <code>:host</code> instead.</li>`,
        `<li><strong>Expecting component styles to reach child components under Emulated.</strong> They don't — each component's styles are scoped to its own elements. Style the child via its own stylesheet, inputs, or CSS custom properties.</li>`,
        `<li><strong>Reaching for <code>::ng-deep</code>.</strong> It is deprecated and applies globally unless scoped under <code>:host</code>; prefer CSS variables or restructuring.</li>`,
        `<li><strong>Assuming ShadowDom is a drop-in.</strong> It blocks global CSS, breaks some third-party libraries, and changes <code>document</code>-level selector behaviour — adopt it deliberately.</li>`,
        `<li><strong>Confusing Emulated with real Shadow DOM.</strong> Emulated adds attributes; there is no shadow root and global styles still leak in.</li>`,
        `<li><strong>Mystery styles from a <code>None</code> component.</strong> A single <code>None</code> component can silently restyle Emulated ones because its CSS is global; audit for it when styles appear from nowhere.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Stick with the default Emulated for the vast majority of components.</li>`,
        `<li>Use <code>:host</code> to style the component's own element, and <code>:host-context()</code> for ancestor-based theming.</li>`,
        `<li>Reserve ShadowDom for true web components or where strict isolation is a hard requirement.</li>`,
        `<li>Avoid <code>None</code>; if you need global styles, put them in <code>styles.css</code> intentionally, not via a component.</li>`,
        `<li>Prefer CSS custom properties (variables) to cross component boundaries — they pierce encapsulation cleanly and predictably.</li>`,
        `<li>Treat <code>::ng-deep</code> as deprecated; scope it under <code>:host</code> if you truly must use it.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is view encapsulation and what are the modes?"</strong><br>A: It's how Angular scopes a component's CSS to its own template. Three modes: Emulated (default, attribute-based scoping, no Shadow DOM), ShadowDom (native shadow root, true isolation), and None (no scoping, styles go global).</p></blockquote>`,
        `<blockquote><p><strong>Q: "How does Emulated encapsulation actually achieve scoping?"</strong><br>A: Angular adds a generated attribute like _ngcontent-abc to the component's elements and rewrites its CSS selectors to include that attribute, so rules only match this component's DOM. It's pure attribute rewriting — there's no real shadow root.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Under Emulated, do global styles affect a component?"</strong><br>A: Yes. Emulated stops the component's styles from leaking out, but global styles from styles.css still reach in. That one-directional behaviour is usually desirable.</p></blockquote>`,
        `<blockquote><p><strong>Q: "When would you use ShadowDom, and what's the downside?"</strong><br>A: For true isolation — publishing web components or preventing any global CSS bleed. Downsides: it blocks helpful global styles, can break third-party libraries and document-level selectors, and needs browser Shadow DOM support.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why is ViewEncapsulation.None dangerous?"</strong><br>A: The component's styles become global, so a generic selector can restyle the entire app, and it can silently leak into Emulated components. It removes the safety that makes component CSS predictable.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you style a child component's internals correctly?"</strong><br>A: Prefer CSS custom properties the child consumes, or expose inputs/classes it applies itself. ::ng-deep works but is deprecated and global; if used, scope it under :host to limit the blast radius.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What's the difference between view encapsulation and content projection?"</strong><br>A: They're orthogonal. Encapsulation scopes a component's CSS; projection (ng-content) composes a parent's DOM into a child's template. Projected content keeps the style context of where it was declared, not where it's slotted.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why can global styles affect an Emulated component but its styles can't escape?"</strong><br>A: Emulated only appends an attribute selector to the component's own rules, which raises specificity slightly but builds no barrier. Global rules have no such attribute constraint, so they still match; the component's rules, constrained by the attribute, can't match anything outside.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li>Three modes: Emulated (default), ShadowDom, None.</li>`,
        `<li>Emulated = generated attributes + rewritten selectors; no real Shadow DOM; global CSS still leaks in.</li>`,
        `<li>ShadowDom = native shadow root; nothing in or out; for web components.</li>`,
        `<li>None = styles go global; risky; can leak into Emulated components.</li>`,
        `<li>:host styles the host element; :host-context() themes by ancestor.</li>`,
        `<li>Cross boundaries with CSS custom properties; avoid deprecated ::ng-deep.</li>`,
        `<li>Emulated adds an attribute selector (raises specificity, no barrier) — global CSS still matches.</li>`,
        `<li>Encapsulation scopes CSS; content projection composes DOM — orthogonal concepts.</li>`,
        `</ul>`,
      ].join('\n'),
    },
  ],
};
