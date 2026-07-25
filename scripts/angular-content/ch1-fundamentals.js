/**
 * Angular Interview Kit — Chapter 1: Angular Fundamentals.
 * Pure data module (no runtime deps). Diagrams are referenced via
 * {{fig:filename.svg|ALT|CAPTION}} markers, resolved by seed-angular-kit.js.
 *
 * Depth target: every topic 1800-2500+ words of accurate, modern (v17+
 * standalone) Angular. Sections are fixed and ordered.
 */
module.exports = {
  title: 'Angular Fundamentals',
  slug: 'angular-fundamentals',
  order: 0,
  topics: [
    // ────────────────────────────────────────────────────────────────
    // TOPIC 0 — Introduction to Angular
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Introduction to Angular',
      slug: 'introduction-to-angular',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Angular is the framework that quietly runs a huge slice of the world's serious software: banking dashboards, airline booking engines, telecom back-offices, Google's own internal tools. It is a <strong>full, opinionated framework</strong> — not a view library — built and versioned by Google for applications that live for a decade and are touched by hundreds of engineers. Understanding what that sentence actually <em>means</em> is the difference between "I've used Angular" and "I understand why a team bet its product on it."</p>`,
        `<p>In an interview, "introduce Angular" is almost never a warm-up you can wave away. It is a probe. A strong answer signals that you know the <em>scope</em> of the framework (what ships in the box), the <em>trade-off</em> it makes (structure and consistency in exchange for flexibility), and the <em>history</em> that shapes today's API (the AngularJS rewrite, then the standalone shift). A weak answer — "it's like React but by Google" — tells the interviewer you have used Angular without ever stepping back to see it. This first topic gives you the vocabulary and the mental model that every later topic builds on.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Plainly: Angular is a <strong>TypeScript-first framework for building single-page applications</strong>. When you download it you get, as one coherent and jointly-versioned package, everything a real app needs — a component system, a template language, routing, forms, an HTTP client, a dependency-injection container, a testing setup, and a command-line tool that builds and optimizes all of it. You do not go shopping for a router or a data layer; the decisions are already made and the pieces are designed to fit together.</p>`,
        `<p>More precisely: Angular is a <strong>component-based, declarative</strong> framework. You describe your UI as a tree of components, each pairing a TypeScript class (the logic and state) with an HTML template (the view). Angular keeps the DOM in sync with your class fields through <em>data binding</em>, resolves the dependencies each class asks for through <em>dependency injection</em>, and compiles your templates ahead of time (AOT) into efficient JavaScript before the browser ever sees them.</p>`,
        `{{fig:ch1-framework-vs-library.svg|Comparison of a view library like React that ships only rendering versus Angular which ships router forms HTTP DI and testing|A library gives you the view layer and you assemble the rest; a framework ships the rest already integrated.}}`,
        `<p>The word that unlocks everything is <strong>opinionated</strong>. Angular has opinions about how you structure a project, how objects find their dependencies, how you build for production, and how you write tests. Those opinions are the <em>product</em>. On a five-person startup they can feel like overhead; on a two-hundred-person enterprise codebase they are the reason a new engineer can open any feature folder and immediately know where things live.</p>`,
        `<h2>How it works</h2>`,
        `<p>Angular is best understood as several tightly-integrated systems wearing one name. Knowing which system does what is what separates a fluent answer from a memorized one.</p>`,
        `<table><thead><tr><th>System</th><th>Responsibility</th><th>You'll meet it in</th></tr></thead><tbody>` +
        `<tr><td>Components + templates</td><td>Describe UI as a tree; bind class state to the DOM</td><td>Chapter 2</td></tr>` +
        `<tr><td>Directives + pipes</td><td>Reshape the DOM and transform values in templates</td><td>Chapter 3</td></tr>` +
        `<tr><td>Dependency injection</td><td>Create and share services via a hierarchical injector</td><td>Chapter 4</td></tr>` +
        `<tr><td>RxJS + signals</td><td>Model async streams and reactive state</td><td>Chapter 5</td></tr>` +
        `<tr><td>Router</td><td>Map URLs to component trees, guard and lazy-load them</td><td>Chapter 6</td></tr>` +
        `<tr><td>Forms + HttpClient</td><td>Capture/validate input; talk to servers</td><td>Chapter 7</td></tr>` +
        `<tr><td>Change detection</td><td>Decide what to re-render, and when</td><td>Chapter 8</td></tr>` +
        `</tbody></table>`,
        `<p>The most common history question hides a real technical point: <strong>Angular (2+) is a complete rewrite of AngularJS (1.x)</strong>. They share a marketing name and essentially nothing else. AngularJS used JavaScript, an MVC-with-<code>$scope</code> model, and two-way "dirty checking" that re-evaluated every watcher on every digest cycle — elegant for small apps, a performance cliff for big ones. Modern Angular is TypeScript-first, component-based, compiles templates ahead of time, and tracks changes far more surgically. Treating them as versions of one thing is a classic tell that you learned the name but not the timeline.</p>`,
        `<table><thead><tr><th></th><th>AngularJS (1.x)</th><th>Angular (2+, "Angular")</th></tr></thead><tbody>` +
        `<tr><td>Language</td><td>JavaScript</td><td>TypeScript</td></tr>` +
        `<tr><td>Architecture</td><td>MVC, <code>$scope</code></td><td>Component tree</td></tr>` +
        `<tr><td>Change tracking</td><td>Dirty checking (digest)</td><td>Zone.js / signals, targeted</td></tr>` +
        `<tr><td>Compilation</td><td>Runtime</td><td>AOT (ahead-of-time)</td></tr>` +
        `<tr><td>Mobile / bundle size</td><td>Weak</td><td>Tree-shaken, optimized</td></tr>` +
        `<tr><td>DI</td><td>Basic, string tokens</td><td>Hierarchical, typed, first-class</td></tr>` +
        `</tbody></table>`,
        `<p>The second piece of history is recent and matters even more for day-to-day code. Through Angular 14, every component, directive, and pipe had to be <em>declared</em> inside an <code>NgModule</code> — a boilerplate container that told the compiler what belonged together and what was visible where. Since Angular 14 (stable in 15, the default scaffold since 17), <strong>standalone components</strong> let a component declare its own template dependencies through an <code>imports</code> array and drop <code>NgModule</code> entirely. As of v17+ a fresh <code>ng new</code> app is standalone by default and boots with <code>bootstrapApplication()</code> instead of the old <code>platformBrowserDynamic().bootstrapModule()</code>. This kit teaches the modern way first and treats <code>NgModule</code> as legacy you must still be able to read.</p>`,
        `<p>Two more mechanics complete the picture of "how Angular works" at a high level. First, <strong>everything is compiled</strong>: the Angular CLI runs the compiler (backed by the Ivy engine) to turn your templates into JavaScript render instructions before shipping — this is why template typos can be caught at build time, not in production. Second, Angular is deeply <strong>reactive</strong>: historically it patched browser async APIs via <em>Zone.js</em> to know when to check for changes, and it is now moving toward <strong>signals</strong> — fine-grained reactive values that let the framework re-render exactly what depends on a change, with no zone at all. You will see both across this kit.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The smallest complete modern Angular app is startlingly short. There is no <code>NgModule</code> and no <code>AppModule</code> — a root component and a one-line bootstrap.</p>`,
        `<pre><code class="language-typescript">// main.ts — the entry point of a modern standalone app
import { bootstrapApplication } from '@angular/platform-browser';
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,          // v17+ scaffolds this by default
  template: \`&lt;h1&gt;Hello, {{ name }}&lt;/h1&gt;\`,
})
export class AppComponent {
  name = 'Angular';          // bound into the template above
}

bootstrapApplication(AppComponent);  // that's the whole startup</code></pre>`,
        `<p>Data binding is what makes it a framework and not a template string. Change a class field and the DOM follows; interact with the DOM and the class field follows.</p>`,
        `<pre><code class="language-typescript">import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: \`
    &lt;p&gt;Count: {{ count() }}&lt;/p&gt;        &lt;!-- interpolation reads a signal --&gt;
    &lt;button (click)="inc()"&gt;+1&lt;/button&gt;  &lt;!-- event binding --&gt;
  \`,
})
export class CounterComponent {
  count = signal(0);                     // reactive state (v16+)
  inc() { this.count.update(n =&gt; n + 1); }
}</code></pre>`,
        `<p>And the batteries-included promise in one snippet: asking for a shared HTTP-backed service via dependency injection — no wiring, no manual construction.</p>`,
        `<pre><code class="language-typescript">import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-users',
  standalone: true,
  template: \`&lt;p&gt;{{ (users$ | async)?.length }} users&lt;/p&gt;\`,
})
export class UsersComponent {
  private http = inject(HttpClient);              // DI hands you the client
  users$ = this.http.get&lt;unknown[]&gt;('/api/users'); // async pipe subscribes/cleans up
}</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>` +
        `<li><strong>Calling Angular "a library like React."</strong> React is a view library; Angular is a framework. Conflating them signals you have never reckoned with the framework's scope (router, forms, DI, HttpClient, CLI — all in the box).</li>` +
        `<li><strong>Confusing AngularJS and Angular.</strong> Saying "<code>$scope</code>" or "two-way dirty checking" when describing modern Angular instantly dates your knowledge to 2015.</li>` +
        `<li><strong>Assuming you still need <code>NgModule</code>.</strong> Since v17 the default app is standalone; leading with <code>NgModule</code> boilerplate suggests you stopped learning around v13.</li>` +
        `<li><strong>Thinking "opinionated" means "inflexible."</strong> It means defaults are chosen for you; you can still override providers, build config, and structure. The opinion is a starting point, not a cage.</li>` +
        `<li><strong>Believing Angular is slow because it is "heavy."</strong> The runtime is tree-shaken and AOT-compiled; bundle size for a real app is competitive. The old reputation belongs to AngularJS.</li>` +
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>` +
        `<li>Learn the modern surface first: <strong>standalone components</strong>, <code>bootstrapApplication()</code>, <code>inject()</code>, and signals. Read <code>NgModule</code> code, but do not write new <code>NgModule</code>s.</li>` +
        `<li>Keep the <strong>framework's systems mentally separated</strong> — components, DI, routing, change detection — so you can reason about (and debug) each independently.</li>` +
        `<li>Let TypeScript work for you: type your models and service returns so the compiler and template type-checker catch mistakes before runtime.</li>` +
        `<li>Reach for the built-in tool before an external one — the CLI, <code>HttpClient</code>, the Router, and reactive forms are integrated and versioned with the framework.</li>` +
        `<li>When you choose Angular for a project, choose it for the <strong>reason it exists</strong>: long-lived, multi-team apps that benefit from consistency and structure.</li>` +
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Is Angular a framework or a library, and how does that differ from React?"</strong><br>A: A framework. React ships the view layer and you assemble routing, state, and data-fetching yourself. Angular ships routing, forms, an HTTP client, dependency injection, and testing as one integrated, jointly-versioned package. The trade-off is less flexibility for far more consistency — which is why Angular thrives in large, long-lived, multi-team codebases.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What's the difference between Angular and AngularJS?"</strong><br>A: A complete rewrite, not a version bump. AngularJS is JavaScript, MVC with <code>$scope</code>, and runtime dirty-checking. Angular is TypeScript, component-based, AOT-compiled, and tracks changes surgically via Zone.js or signals. They share only a name.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What does 'opinionated' actually buy a team?"</strong><br>A: Consistency at scale. Structure, DI, and build are decided once, so any engineer can navigate any feature. On a big team, per-team flexibility becomes chaos; shared opinions become velocity. (Trap: don't equate opinionated with rigid — you can still override every default.)</p></blockquote>`,
        `<blockquote><p><strong>Q: "What changed with standalone components?"</strong><br>A: A component can now declare its own template dependencies through <code>imports</code> and boot with <code>bootstrapApplication()</code>, so <code>NgModule</code> is no longer required. Since v17 it's the default scaffold. Follow-up trap: "so NgModules are deleted?" — no, they still exist and much production code uses them; they're just optional now.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why is Angular considered good for enterprise apps?"</strong><br>A: Long-lived apps value predictability. Strong typing, a hierarchical DI system, an integrated router/forms/HTTP stack, and a single versioned upgrade path mean a codebase stays navigable and upgradable for years across many teams.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Where does TypeScript fit — is it optional?"</strong><br>A: Effectively mandatory and central. Angular's tooling, template type-checking, DI tokens, and decorators are all built around TypeScript. You <em>can</em> write JS, but you throw away most of what makes Angular safe.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Angular = full, opinionated, <strong>TypeScript-first framework</strong> by Google.</li>` +
        `<li>Batteries included: components, router, forms, HttpClient, DI, testing, CLI.</li>` +
        `<li>Angular (2+) ≠ AngularJS (1.x) — <strong>total rewrite</strong>, different everything.</li>` +
        `<li>Component-based + declarative; templates are <strong>AOT-compiled</strong>.</li>` +
        `<li>Modern default (v17+): <strong>standalone</strong> components, <code>bootstrapApplication()</code>, <code>inject()</code>, signals.</li>` +
        `<li>Reactive core: Zone.js historically, signals going forward.</li>` +
        `<li>Best fit: large, long-lived, multi-team enterprise apps.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // TOPIC 1 — Angular Architecture
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Angular Architecture',
      slug: 'angular-architecture',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Every non-trivial Angular question eventually reduces to one of a handful of building blocks — components, templates, directives, services, dependency injection, the router — and how they connect. If you hold a clear picture of the architecture, you can place any new concept instantly: "signals are how state flows into change detection," "guards are a router concern," "interceptors sit in the HttpClient pipeline." Without that map, every topic feels like an unrelated fact to memorize.</p>`,
        `<p>In interviews, "walk me through Angular's architecture" is a favorite opener precisely because it is hard to fake. A candidate who has only copied snippets will list nouns; a candidate who understands the framework will describe how data <em>flows</em> and how responsibilities are <em>separated</em>. This topic is the skeleton the rest of the kit hangs on.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Plainly: an Angular app is a <strong>tree of components</strong>, and each component leans on a few supporting cast members. The component owns a slice of the screen. Its <strong>template</strong> is the HTML for that slice, wired to the component's data through binding. <strong>Directives</strong> and <strong>pipes</strong> let the template reshape the DOM and format values. When a component needs logic or shared state, it does not build it — it asks the <strong>dependency injection</strong> system for a <strong>service</strong>. And the <strong>router</strong> decides which component tree is on screen for a given URL.</p>`,
        `{{fig:ch1-building-blocks.svg|Diagram showing a component at the center connected to template directives pipes services injector and router|The core building blocks: a component uses templates, directives and services; DI supplies the services; the router swaps components.}}`,
        `<p>More precisely: a component is a TypeScript class annotated with <code>@Component</code>, pairing <em>state and behavior</em> (the class) with a <em>view</em> (the template). Components form a parent-child tree rooted at <code>AppComponent</code>. Data flows <strong>down</strong> the tree through <code>@Input</code> properties and flows <strong>up</strong> through <code>@Output</code> events — a deliberately <em>unidirectional</em> shape that makes data flow predictable. Cross-cutting concerns (an auth service, a cart, an API client) live in <strong>injectable services</strong> that DI shares across the tree.</p>`,
        `<h2>How it works</h2>`,
        `<p>The architecture is easiest to hold in your head as layers of responsibility. Each block does one job and hands off cleanly to the next.</p>`,
        `{{fig:ch1-architecture.svg|Full Angular application architecture showing how components templates services directives and DI fit inside the app|How the building blocks fit together inside a running application.}}`,
        `<table><thead><tr><th>Block</th><th>What it is</th><th>Its one job</th></tr></thead><tbody>` +
        `<tr><td>Component</td><td>Class + <code>@Component</code> + template</td><td>Own a region of UI and its state</td></tr>` +
        `<tr><td>Template</td><td>HTML with Angular syntax</td><td>Render state; capture events</td></tr>` +
        `<tr><td>Data binding</td><td>{{ }}, [prop], (event), [(ngModel)]</td><td>Keep view and state in sync</td></tr>` +
        `<tr><td>Directive</td><td>Behavior attached to elements</td><td>Change structure (<code>*ngIf</code>) or appearance</td></tr>` +
        `<tr><td>Pipe</td><td>Pure transform function</td><td>Format a value for display</td></tr>` +
        `<tr><td>Service</td><td>Plain injectable class</td><td>Hold logic/state shared across components</td></tr>` +
        `<tr><td>Injector (DI)</td><td>Hierarchical container</td><td>Create and supply service instances</td></tr>` +
        `<tr><td>Router</td><td>URL-to-component mapper</td><td>Decide which tree is on screen</td></tr>` +
        `</tbody></table>`,
        `<p>The single most important architectural idea is the <strong>direction of data flow</strong>. Inputs push data from parent to child; outputs (events) bubble intent from child to parent. A child never reaches up and mutates its parent's state directly; it emits an event and lets the parent decide. This one-way discipline is what makes an Angular app debuggable at scale — when a value is wrong, you trace it <em>up</em> a known path rather than hunting for whoever mutated a shared object.</p>`,
        `<p>The four binding syntaxes are the wiring between class and view, and interviewers expect you to name them precisely:</p>`,
        `<table><thead><tr><th>Syntax</th><th>Name</th><th>Direction</th></tr></thead><tbody>` +
        `<tr><td><code>{{ value }}</code></td><td>Interpolation</td><td>class → view (text)</td></tr>` +
        `<tr><td><code>[prop]="value"</code></td><td>Property binding</td><td>class → view (DOM prop)</td></tr>` +
        `<tr><td><code>(event)="handler()"</code></td><td>Event binding</td><td>view → class</td></tr>` +
        `<tr><td><code>[(ngModel)]="value"</code></td><td>Two-way binding</td><td>both (sugar for the two above)</td></tr>` +
        `</tbody></table>`,
        `<p>The other pillar is <strong>separation of concerns via services and DI</strong>. Components should stay thin: render, capture events, delegate. Business logic, caching, and API calls belong in services. Because services are provided through a <em>hierarchical</em> injector (covered in depth in Chapter 4), the same instance can be shared app-wide or scoped to a single component subtree — a decision you make by choosing where to provide it. This is why an Angular component rarely uses <code>new</code>: construction is DI's job, which keeps components testable (swap a real service for a fake) and decoupled.</p>`,
        `<p>Finally, note how <strong>change detection</strong> ties the tree together. After any event, Angular walks the component tree and updates the DOM where bound values changed. With the default strategy it checks the whole tree; with <code>OnPush</code> (Chapter 8) it checks a branch only when its inputs change or it emits an event. Signals push this further, letting Angular update exactly the views that read a changed value. The architecture — a component tree with one-way data flow — is precisely what makes this efficient checking possible.</p>`,
        `<h2>Code examples</h2>`,
        `<p>Parent-to-child data (<code>@Input</code>) and child-to-parent events (<code>@Output</code>) — the core of the tree.</p>`,
        `<pre><code class="language-typescript">import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-product-card',
  standalone: true,
  template: \`
    &lt;h3&gt;{{ name }}&lt;/h3&gt;
    &lt;button (click)="add.emit()"&gt;Add to cart&lt;/button&gt;
  \`,
})
export class ProductCardComponent {
  @Input() name = '';                       // data flows DOWN from parent
  @Output() add = new EventEmitter&lt;void&gt;(); // intent flows UP to parent
}</code></pre>`,
        `<pre><code class="language-typescript">// Parent wires state down and reacts to the event coming up
@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [ProductCardComponent],
  template: \`
    &lt;app-product-card [name]="title" (add)="onAdd()" /&gt;
    &lt;p&gt;Items: {{ count }}&lt;/p&gt;
  \`,
})
export class ShopComponent {
  title = 'Angular T-shirt';
  count = 0;
  onAdd() { this.count++; }               // parent owns the state change
}</code></pre>`,
        `<p>A service holds shared logic; DI supplies it. Note there is no <code>new CartService()</code> anywhere.</p>`,
        `<pre><code class="language-typescript">import { Injectable, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })       // one shared instance app-wide
export class CartService {
  private items = signal&lt;string[]&gt;([]);
  readonly count = this.items;            // components read reactively
  add(name: string) { this.items.update(list =&gt; [...list, name]); }
}

@Component({ /* ... */ })
export class ShopComponent {
  private cart = inject(CartService);     // DI hands over the singleton
  onAdd() { this.cart.add('Angular T-shirt'); }
}</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>` +
        `<li><strong>Putting business logic in components.</strong> Fat components that fetch, cache, and transform become untestable and un-reusable. That logic belongs in services.</li>` +
        `<li><strong>Mutating a parent's state from a child directly.</strong> It breaks unidirectional flow and makes bugs untraceable. Emit an <code>@Output</code> and let the parent decide.</li>` +
        `<li><strong>Confusing <code>[prop]</code> and <code>(event)</code> directions.</strong> Square brackets push data <em>into</em> the view; parentheses listen for events coming <em>out</em>. Reversing them is a classic template bug.</li>` +
        `<li><strong>Treating two-way binding as magic.</strong> <code>[(ngModel)]</code> is just property binding plus event binding on the <code>ngModelChange</code> event — the "banana in a box." Not knowing that trips you on custom two-way bindings.</li>` +
        `<li><strong>Using <code>new</code> to create a service.</strong> You get a fresh, unshared instance outside DI, defeating singletons and making tests harder.</li>` +
        `<li><strong>Thinking directives and components are unrelated.</strong> A component <em>is</em> a directive with a template — same underlying machinery.</li>` +
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>` +
        `<li>Keep components <strong>thin</strong>: render and delegate. Push logic and state into services.</li>` +
        `<li>Respect <strong>one-way data flow</strong> — inputs down, events up. Never mutate upward.</li>` +
        `<li>Share cross-cutting state through <strong>injectable services</strong>, not through passing objects deep down the tree.</li>` +
        `<li>Prefer <code>inject()</code> over constructor parameters in modern code — it reads cleanly and composes in functions.</li>` +
        `<li>Design the <strong>component tree deliberately</strong>: small, focused components with clear inputs/outputs are easier to test and to move.</li>` +
        `<li>Reach for <strong>signals</strong> for local reactive state; they make the data-flow story explicit and change detection cheap.</li>` +
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Walk me through Angular's architecture."</strong><br>A: An app is a tree of components rooted at <code>AppComponent</code>. Each component pairs a class (state + behavior) with a template (view) via data binding. Data flows down through inputs and up through output events. Directives and pipes reshape and format the view. Shared logic lives in services, supplied by a hierarchical DI system. The router maps URLs to component trees. Change detection keeps the DOM in sync after events.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How does data flow between components?"</strong><br>A: Unidirectionally. Parents pass data to children via <code>@Input</code>; children notify parents via <code>@Output</code> events. A child never mutates the parent directly — it emits and the parent decides. For unrelated components, share a service.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What are the four types of data binding?"</strong><br>A: Interpolation <code>{{ }}</code> and property binding <code>[prop]</code> (class → view), event binding <code>(event)</code> (view → class), and two-way <code>[(ngModel)]</code> which is just property + event binding combined. Trap follow-up: "what is the banana-in-a-box?" — the <code>[( )]</code> two-way syntax.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Component vs directive — what's the relationship?"</strong><br>A: A component is a directive with a template. All three (components, structural, attribute directives) share the same directive machinery; only components render their own view.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Where should business logic live, and why?"</strong><br>A: In services, not components. It keeps components thin and reusable, centralizes logic, and — because services come through DI — makes them trivially mockable in tests.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why does Angular favor unidirectional data flow?"</strong><br>A: Predictability at scale. When a value is wrong you trace it up a single known path instead of hunting for whoever mutated shared state. It also enables efficient, targeted change detection.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>App = <strong>tree of components</strong> rooted at <code>AppComponent</code>.</li>` +
        `<li>Component = class (state/logic) + template (view), joined by <strong>data binding</strong>.</li>` +
        `<li>Data flow: <strong>inputs down, events up</strong> — unidirectional.</li>` +
        `<li>Four bindings: <code>{{ }}</code>, <code>[prop]</code>, <code>(event)</code>, <code>[(ngModel)]</code>.</li>` +
        `<li>Directives reshape DOM; pipes format values; both extend the template.</li>` +
        `<li>Shared logic → <strong>services</strong>, supplied by <strong>hierarchical DI</strong>.</li>` +
        `<li>Router maps URLs → component trees; change detection keeps the DOM in sync.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // TOPIC 2 — CLI & Project Structure
    // ────────────────────────────────────────────────────────────────
    {
      title: 'CLI &amp; Project Structure',
      slug: 'cli-project-structure',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>The Angular CLI is not a convenience bolted on top of the framework — it <em>is</em> how you use Angular. It scaffolds projects, generates components, runs the dev server with hot reload, executes tests, and produces optimized production builds. Because the CLI owns the build, Angular can evolve its compiler and bundler underneath you and hand you the improvements through a single <code>ng update</code>. Fluency with the CLI is what makes an Angular developer fast; unfamiliarity with it is immediately visible.</p>`,
        `<p>Project structure matters for the same reason opinions matter in Angular: <strong>every Angular app looks broadly the same</strong>. An engineer who understands where <code>main.ts</code>, <code>app.config.ts</code>, and <code>angular.json</code> live can drop into any Angular codebase and orient in minutes. Interviewers probe this to check that you have actually built and shipped apps, not just edited components someone else scaffolded.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Plainly: you install the CLI once (<code>npm install -g @angular/cli</code>), then drive your whole workflow with a handful of <code>ng</code> commands. <code>ng new</code> creates a project, <code>ng generate</code> (aliased <code>ng g</code>) scaffolds files, <code>ng serve</code> runs a live-reloading dev server, <code>ng test</code> runs unit tests, and <code>ng build</code> produces the optimized bundle you deploy. The CLI writes the boilerplate, wires the config, and enforces conventions so you don't reinvent them per project.</p>`,
        `{{fig:ch1-cli-workflow.svg|Flow of Angular CLI commands from ng new to ng generate to ng serve and ng test converging on ng build|One tool carries you from scaffolding to a production build.}}`,
        `<p>More precisely: the CLI is a thin, extensible orchestrator over <strong>schematics</strong> (code generators) and <strong>builders</strong> (task runners defined in <code>angular.json</code>). When you run <code>ng g component foo</code>, a schematic generates the files <em>and</em> updates surrounding code. When you run <code>ng build</code>, a builder invokes the Angular compiler and the bundler (esbuild-based in modern versions) with the settings from your project's build target. You rarely touch these internals, but knowing they exist explains why the CLI can do so much with so little typing.</p>`,
        `<h2>How it works</h2>`,
        `<p>A fresh <code>ng new my-app</code> generates a predictable layout. The split that matters is <strong>configuration at the repo root</strong> versus <strong>your application code under <code>src/app</code></strong>.</p>`,
        `{{fig:ch1-project-structure.svg|Two columns showing root config files like angular.json package.json tsconfig main.ts against the src app folder with components config routes and feature folders|What ng new scaffolds: config at the root, your code under src/app.}}`,
        `<table><thead><tr><th>File / folder</th><th>Purpose</th></tr></thead><tbody>` +
        `<tr><td><code>angular.json</code></td><td>Workspace config: build/serve/test <em>targets</em>, budgets, assets</td></tr>` +
        `<tr><td><code>package.json</code></td><td>Dependencies and npm scripts (<code>start</code>, <code>build</code>, <code>test</code>)</td></tr>` +
        `<tr><td><code>tsconfig.json</code></td><td>TypeScript compiler options for the workspace</td></tr>` +
        `<tr><td><code>src/index.html</code></td><td>The single HTML shell; hosts <code>&lt;app-root&gt;</code></td></tr>` +
        `<tr><td><code>src/main.ts</code></td><td>Entry point; calls <code>bootstrapApplication()</code></td></tr>` +
        `<tr><td><code>src/styles.css</code></td><td>Global styles</td></tr>` +
        `<tr><td><code>src/app/app.component.ts</code></td><td>Root component</td></tr>` +
        `<tr><td><code>src/app/app.config.ts</code></td><td>Application-level providers (router, HTTP, etc.)</td></tr>` +
        `<tr><td><code>src/app/app.routes.ts</code></td><td>Route definitions</td></tr>` +
        `<tr><td><code>src/assets/</code></td><td>Static files copied verbatim into the build</td></tr>` +
        `</tbody></table>`,
        `<p>Two things about this layout catch people out. First, <strong><code>main.ts</code> is the true entry point, not <code>index.html</code></strong>. The browser loads <code>index.html</code>, which contains an empty <code>&lt;app-root&gt;</code> and a script that runs <code>main.ts</code>; only then does Angular bootstrap and fill in the shell. Second, in a modern standalone app there is <strong>no <code>app.module.ts</code></strong> — application-wide configuration moved into <code>app.config.ts</code> (an <code>ApplicationConfig</code> object of providers) that <code>main.ts</code> passes to <code>bootstrapApplication()</code>.</p>`,
        `<p>The most useful command to understand deeply is <code>ng generate</code>, because it encodes conventions. The core schematics:</p>`,
        `<table><thead><tr><th>Command</th><th>Generates</th></tr></thead><tbody>` +
        `<tr><td><code>ng g component user-card</code></td><td>A standalone component (4 files) in its own folder</td></tr>` +
        `<tr><td><code>ng g service auth</code></td><td>An injectable service + spec</td></tr>` +
        `<tr><td><code>ng g directive highlight</code></td><td>An attribute directive</td></tr>` +
        `<tr><td><code>ng g pipe currencyFmt</code></td><td>A pipe</td></tr>` +
        `<tr><td><code>ng g guard auth</code></td><td>A functional route guard</td></tr>` +
        `<tr><td><code>ng g environments</code></td><td>Sets up <code>environment.ts</code> files</td></tr>` +
        `</tbody></table>`,
        `<p>The <code>angular.json</code> file deserves special mention because it is where "the build" actually lives. It defines named <strong>configurations</strong> — typically <code>production</code> and <code>development</code> — each turning knobs like optimization, source maps, output hashing, and <strong>budgets</strong> (build-fails-if-bundle-exceeds thresholds that protect you from bloat). <code>ng build</code> defaults to production; <code>ng serve</code> uses development. Understanding that these are just named presets in one JSON file demystifies a lot of "why is my prod build different?" confusion.</p>`,
        `<p>Finally, the CLI's superpower for long-lived apps is <strong><code>ng update</code></strong>. It doesn't just bump version numbers in <code>package.json</code>; it runs <em>migration schematics</em> that rewrite your code to match the new API — for example, migrating apps toward standalone or updating control-flow syntax. This is the concrete payoff of Angular being one versioned framework: upgrades are guided, not archaeological.</p>`,
        `<p>One more layer worth knowing is the difference between <code>ng serve</code> and <code>ng build</code>. <code>ng serve</code> compiles the app in memory and serves it from a dev server with hot module replacement — nothing is written to <code>dist/</code>, and it favors fast rebuilds over optimization. <code>ng build</code> writes real files to <code>dist/</code>, runs the AOT compiler, tree-shakes unused code, minifies, and fingerprints filenames for cache-busting. Conflating the two — for example, expecting <code>ng serve</code> output in <code>dist/</code>, or benchmarking bundle size against the dev server — is a frequent source of confusion. In short: <code>serve</code> is for the inner development loop, <code>build</code> is what you deploy.</p>`,
        `<h2>Code examples</h2>`,
        `<p>A typical first session with the CLI, start to finish.</p>`,
        `<pre><code class="language-bash"># Scaffold a new standalone app (v17+ default), with routing and CSS
ng new my-app --routing --style=css
cd my-app

# Generate a component into src/app/user-card/
ng g component user-card

# Generate a root-provided service
ng g service data/api

# Run the dev server with hot reload at http://localhost:4200
ng serve --open

# Produce the optimized production bundle in dist/
ng build</code></pre>`,
        `<p>What <code>main.ts</code> and <code>app.config.ts</code> look like — the modern replacement for <code>AppModule</code>.</p>`,
        `<pre><code class="language-typescript">// src/main.ts — the real entry point
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig)
  .catch(err =&gt; console.error(err));</code></pre>`,
        `<pre><code class="language-typescript">// src/app/app.config.ts — application-wide providers
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),     // wire the router
    provideHttpClient(),       // enable HttpClient app-wide
  ],
};</code></pre>`,
        `<p>Environment-specific config, resolved at build time via <code>angular.json</code> file replacements.</p>`,
        `<pre><code class="language-typescript">// src/environments/environment.ts (development)
export const environment = { production: false, apiUrl: '/api' };

// src/environments/environment.prod.ts (swapped in during ng build)
export const environment = { production: true, apiUrl: 'https://api.example.com' };</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>` +
        `<li><strong>Thinking <code>index.html</code> is the entry point.</strong> It's just the shell; <code>main.ts</code> bootstraps the app into <code>&lt;app-root&gt;</code>.</li>` +
        `<li><strong>Looking for <code>app.module.ts</code> in a modern app.</strong> Standalone apps don't have one — configuration lives in <code>app.config.ts</code>.</li>` +
        `<li><strong>Editing built files in <code>dist/</code>.</strong> They're generated; changes are wiped on the next build. Edit <code>src/</code>.</li>` +
        `<li><strong>Hardcoding API URLs in components.</strong> Use <code>environment</code> files so dev and prod resolve correctly at build time.</li>` +
        `<li><strong>Ignoring bundle budgets.</strong> A red build after adding a heavy library is the budget in <code>angular.json</code> doing its job — investigate, don't just raise the limit.</li>` +
        `<li><strong>Upgrading by editing <code>package.json</code> by hand.</strong> Use <code>ng update</code> so migration schematics fix your code, not just the version numbers.</li>` +
        `<li><strong>Committing <code>node_modules</code> or <code>dist</code>.</strong> The generated <code>.gitignore</code> excludes them for a reason.</li>` +
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>` +
        `<li>Do everything through the CLI: <strong>generate, don't hand-write</strong> boilerplate; it stays consistent and correct.</li>` +
        `<li>Organize <code>src/app</code> by <strong>feature</strong> (<code>features/</code>), with <code>core/</code> for singletons/guards and <code>shared/</code> for reusable UI.</li>` +
        `<li>Keep environment-specific values in <strong><code>environment</code> files</strong>, never inline in code.</li>` +
        `<li>Treat <strong>build budgets</strong> as a feature — tune them intentionally to catch bundle regressions early.</li>` +
        `<li>Upgrade with <strong><code>ng update</code></strong> and read the migration output; it does most of the work for you.</li>` +
        `<li>Learn the <code>--dry-run</code> flag to preview what a schematic will change before it writes.</li>` +
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What does the Angular CLI do for you?"</strong><br>A: It's the whole workflow: <code>ng new</code> scaffolds, <code>ng g</code> generates code with conventions baked in, <code>ng serve</code> runs a live-reload dev server, <code>ng test</code> runs unit tests, and <code>ng build</code> produces an AOT-compiled, optimized bundle. Under the hood it's schematics (generators) and builders (tasks in <code>angular.json</code>), and <code>ng update</code> runs migrations on upgrade.</p></blockquote>`,
        `<blockquote><p><strong>Q: "In a new Angular app, what is the entry point?"</strong><br>A: <code>main.ts</code>. The browser loads <code>index.html</code> (just a shell with <code>&lt;app-root&gt;</code>), which runs <code>main.ts</code>, which calls <code>bootstrapApplication(AppComponent, appConfig)</code>. Trap: candidates often say <code>index.html</code> — that's the host page, not the entry point.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Where did <code>app.module.ts</code> go?"</strong><br>A: In standalone apps (default since v17) there's no root module. App-wide providers moved to <code>app.config.ts</code> as an <code>ApplicationConfig</code>, passed to <code>bootstrapApplication()</code>. Components declare their own dependencies via <code>imports</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What lives in <code>angular.json</code>?"</strong><br>A: Workspace/build configuration: build, serve, and test targets; named configurations like production and development; assets, styles, and bundle budgets. It's where the build behavior — optimization, hashing, source maps — is defined.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you handle different API URLs for dev vs prod?"</strong><br>A: Environment files. <code>angular.json</code> swaps <code>environment.ts</code> for <code>environment.prod.ts</code> during a production build, so <code>environment.apiUrl</code> resolves correctly without touching component code.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you upgrade Angular safely?"</strong><br>A: <code>ng update @angular/core @angular/cli</code>. It bumps versions <em>and</em> runs migration schematics that rewrite code for breaking changes — far safer than editing <code>package.json</code> by hand.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>CLI commands: <code>ng new</code>, <code>ng g</code>, <code>ng serve</code>, <code>ng test</code>, <code>ng build</code>, <code>ng update</code>.</li>` +
        `<li>Entry point = <strong><code>main.ts</code></strong> → <code>bootstrapApplication(AppComponent, appConfig)</code>.</li>` +
        `<li><code>index.html</code> is just the shell hosting <code>&lt;app-root&gt;</code>.</li>` +
        `<li>No <code>app.module.ts</code> in standalone apps — config lives in <strong><code>app.config.ts</code></strong>.</li>` +
        `<li><code>angular.json</code> = build/serve/test targets, configurations, budgets.</li>` +
        `<li>Env-specific values → <strong><code>environment</code></strong> files (swapped at build time).</li>` +
        `<li>Structure <code>src/app</code> by feature: <code>features/</code>, <code>core/</code>, <code>shared/</code>.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // TOPIC 3 — Bootstrap Flow
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Bootstrap Flow',
      slug: 'bootstrap-flow',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>The bootstrap flow is the story of how a static <code>index.html</code> becomes a live, interactive application. Understanding it turns a whole class of bugs from mysterious to obvious: "why is my service a different instance here?", "why did my provider not apply?", "why does nothing render even though the component compiles?" Every one of those questions is answered by knowing what happens, in what order, from <code>main.ts</code> to first paint.</p>`,
        `<p>Interviewers love the bootstrap question because it separates people who <em>use</em> Angular from people who <em>understand</em> it. Anyone can write a component; explaining how the root injector is created before the root component, and why that ordering matters, demonstrates a mental model of the runtime. It's also the natural place to show you know the modern <code>bootstrapApplication()</code> path and how it differs from the legacy module bootstrap.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Plainly: when the browser loads your page it sees an almost-empty <code>index.html</code> with a single <code>&lt;app-root&gt;&lt;/app-root&gt;</code> tag and a script. That script runs <code>main.ts</code>, which calls <code>bootstrapApplication(AppComponent, appConfig)</code>. Angular then sets up its dependency-injection environment from your config, creates the root component, renders its template into <code>&lt;app-root&gt;</code>, and runs the first change-detection pass. After that, the app is alive and responding to events.</p>`,
        `{{fig:ch1-bootstrap-flow.svg|Sequence from index.html through main.ts to a rendered Angular view|From index.html to a rendered view: the bootstrap sequence.}}`,
        `<p>More precisely: <code>bootstrapApplication()</code> creates the <strong>root (environment) injector</strong> from the providers in your <code>ApplicationConfig</code>, together with Angular's own platform providers. Only once that injector exists does Angular instantiate the <strong>root component</strong> — because the component's constructor may inject services that must already be available. It then attaches the component's view to the DOM host element and triggers change detection. The ordering — <em>injector first, component second</em> — is the crux of the whole flow.</p>`,
        `<h2>How it works</h2>`,
        `<p>Here is the full sequence, step by step, for a modern standalone app.</p>`,
        `{{fig:ch1-render-pipeline.svg|Four-stage pipeline from main.ts running to root injector to root component to template rendered then first change detection|What bootstrapApplication triggers, from entry point to first paint.}}`,
        `<table><thead><tr><th>#</th><th>Step</th><th>What actually happens</th></tr></thead><tbody>` +
        `<tr><td>1</td><td>Browser loads <code>index.html</code></td><td>Sees empty <code>&lt;app-root&gt;</code> + the bundled script tag</td></tr>` +
        `<tr><td>2</td><td>Script runs <code>main.ts</code></td><td>Calls <code>bootstrapApplication(AppComponent, appConfig)</code></td></tr>` +
        `<tr><td>3</td><td>Platform + Zone init</td><td>Angular boots the browser platform; Zone.js patches async APIs (unless zoneless)</td></tr>` +
        `<tr><td>4</td><td>Root injector built</td><td>Providers from <code>appConfig</code> registered into the environment injector</td></tr>` +
        `<tr><td>5</td><td>Root component created</td><td><code>AppComponent</code> instantiated; its injected deps resolved from step 4</td></tr>` +
        `<tr><td>6</td><td>View attached to host</td><td>Template rendered into the <code>&lt;app-root&gt;</code> element</td></tr>` +
        `<tr><td>7</td><td>First change detection</td><td>Bindings evaluated, DOM populated; lifecycle hooks fire</td></tr>` +
        `<tr><td>8</td><td>App is live</td><td>Angular waits for events; each event triggers change detection</td></tr>` +
        `</tbody></table>`,
        `<p>The single most testable idea here is <strong>why the injector is built before the component</strong>. A component can inject services in its constructor or via <code>inject()</code> in a field initializer. If Angular created the component first, those dependencies wouldn't exist yet. So the root injector — populated from <code>provideRouter()</code>, <code>provideHttpClient()</code>, and every other provider in your config — must be fully assembled first. This is also why providers you add at bootstrap are available <em>everywhere</em>: they live in the root injector that sits above every component's own injector.</p>`,
        `<p>The second key idea is <strong>Zone.js and the first change detection</strong>. Historically Angular used Zone.js — a library that monkey-patches browser async APIs (<code>setTimeout</code>, event listeners, XHR) — so it knows when something <em>might</em> have changed and a re-render check is needed. The very first change-detection pass (step 7) is what turns your bound values into actual DOM text. In new zoneless apps (opt-in via <code>provideExperimentalZonelessChangeDetection()</code>), Zone.js is dropped and signals/explicit notifications drive change detection instead — but the shape of the flow is otherwise identical.</p>`,
        `<p>It's worth contrasting the modern path with the legacy one, because interviewers who learned Angular years ago will phrase the question around modules:</p>`,
        `<table><thead><tr><th></th><th>Modern (standalone)</th><th>Legacy (NgModule)</th></tr></thead><tbody>` +
        `<tr><td>Entry call</td><td><code>bootstrapApplication(AppComponent, appConfig)</code></td><td><code>platformBrowserDynamic().bootstrapModule(AppModule)</code></td></tr>` +
        `<tr><td>Config source</td><td><code>ApplicationConfig</code> providers</td><td><code>@NgModule</code> <code>providers</code> + <code>bootstrap</code></td></tr>` +
        `<tr><td>Root component named in</td><td>The bootstrap call</td><td><code>bootstrap: [AppComponent]</code></td></tr>` +
        `<tr><td>Boilerplate</td><td>Minimal</td><td><code>AppModule</code> with imports/declarations</td></tr>` +
        `</tbody></table>`,
        `<p>Both paths converge on the same runtime after step 4 — root injector, then root component, then render. Only the <em>configuration mechanism</em> differs. Being able to say that crisply ("standalone replaces the module as the config source; the render pipeline is the same") is exactly the level of understanding the question is testing for.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The modern bootstrap, with providers wired at the root.</p>`,
        `<pre><code class="language-typescript">// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),   // registered in the ROOT injector...
    provideHttpClient(),     // ...before AppComponent is created
  ],
}).catch(err =&gt; console.error(err));</code></pre>`,
        `<p>Proof of the ordering: a service injected at bootstrap already exists when the root component is built.</p>`,
        `<pre><code class="language-typescript">import { Component, inject } from '@angular/core';
import { AppConfigService } from './app-config.service';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`&lt;h1&gt;{{ title }}&lt;/h1&gt;\`,
})
export class AppComponent {
  // Resolved from the root injector that was built in step 4,
  // BEFORE this component was instantiated in step 5.
  private cfg = inject(AppConfigService);
  title = this.cfg.appName;
}</code></pre>`,
        `<p>The legacy module bootstrap, so you can recognize it in older codebases.</p>`,
        `<pre><code class="language-typescript">// main.ts (legacy) — same render pipeline, different config source
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic()
  .bootstrapModule(AppModule)   // AppModule names AppComponent in bootstrap: []
  .catch(err =&gt; console.error(err));</code></pre>`,
        `<p>Opting into zoneless change detection (v18+), which removes Zone.js from the flow.</p>`,
        `<pre><code class="language-typescript">import { bootstrapApplication } from '@angular/platform-browser';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [provideExperimentalZonelessChangeDetection()],
  // No Zone.js: change detection is driven by signals + explicit notifications.
});</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>` +
        `<li><strong>Believing the root component is created first.</strong> The root <em>injector</em> is built first; the component depends on it. Reversing this misses the whole reason providers work.</li>` +
        `<li><strong>Forgetting to register a provider at bootstrap.</strong> Calling <code>HttpClient</code> without <code>provideHttpClient()</code> throws a "no provider" error at runtime — the injector never learned about it.</li>` +
        `<li><strong>Expecting <code>&lt;app-root&gt;</code> content before bootstrap.</strong> Until change detection runs, the host element is empty. A blank page often means bootstrap threw — check the console.</li>` +
        `<li><strong>Doing heavy work in a constructor.</strong> Constructors run during bootstrap/creation, before the view exists. Side effects belong in <code>ngOnInit</code>, not the constructor.</li>` +
        `<li><strong>Assuming Zone.js is mandatory.</strong> Modern apps can bootstrap zoneless; equating "Angular" with "always Zone.js" is now outdated.</li>` +
        `<li><strong>Mixing bootstrap styles.</strong> A standalone app uses <code>bootstrapApplication()</code>; don't reach for <code>platformBrowserDynamic().bootstrapModule()</code> unless you actually have a root module.</li>` +
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>` +
        `<li>Keep <code>main.ts</code> thin: bootstrap and top-level providers only. Feature wiring belongs in feature code/routes.</li>` +
        `<li>Register app-wide services with <strong><code>provideX()</code> functions</strong> (or <code>providedIn: 'root'</code>) so they live in the root injector.</li>` +
        `<li>Always <code>.catch()</code> the bootstrap promise so startup failures surface instead of failing silently.</li>` +
        `<li>Prefer <code>ngOnInit</code> over the constructor for initialization that touches inputs or the view.</li>` +
        `<li>Understand the pipeline well enough to debug a blank screen: <em>injector built? component created? change detection ran?</em></li>` +
        `<li>Adopt zoneless only when your app is fully signal/OnPush-driven; treat it as a deliberate migration, not a flip.</li>` +
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Walk me through how an Angular app bootstraps."</strong><br>A: The browser loads <code>index.html</code> with an empty <code>&lt;app-root&gt;</code> and a script. The script runs <code>main.ts</code>, which calls <code>bootstrapApplication(AppComponent, appConfig)</code>. Angular boots the platform, builds the root injector from the config's providers, then creates the root component (resolving its injected dependencies from that injector), attaches its view to <code>&lt;app-root&gt;</code>, and runs the first change detection to populate the DOM. After that it's event-driven.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why is the injector created before the root component?"</strong><br>A: Because the component may inject services in its constructor or field initializers. Those services must already exist, so Angular fully assembles the root injector first. It's also why bootstrap-level providers are available everywhere — they sit in the root injector above all components.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is the entry point and what does it do?"</strong><br>A: <code>main.ts</code>. It calls <code>bootstrapApplication(AppComponent, appConfig)</code> (modern) or, in legacy apps, <code>platformBrowserDynamic().bootstrapModule(AppModule)</code>. It's the single line that kicks off the whole pipeline.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Where does Zone.js fit into bootstrap?"</strong><br>A: It patches browser async APIs during platform init so Angular knows when to run change detection. The first change-detection pass is what turns bound values into DOM. Follow-up trap: "is it required?" — no; zoneless apps drop it and drive change detection with signals.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Modern bootstrap vs the old module bootstrap — what's the difference?"</strong><br>A: Only the configuration source. Standalone uses <code>bootstrapApplication()</code> with an <code>ApplicationConfig</code>; legacy uses <code>bootstrapModule(AppModule)</code> where the module lists providers and the bootstrap component. After the injector is built, the render pipeline is identical.</p></blockquote>`,
        `<blockquote><p><strong>Q: "My component compiles but the page is blank — how do you debug?"</strong><br>A: Bootstrap probably threw. Check the console (that's why we <code>.catch()</code>). Then reason down the pipeline: did the injector build (a missing provider throws), was the root component created, did change detection run? A blank <code>&lt;app-root&gt;</code> means the flow stopped before render.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Order: <code>index.html</code> → <code>main.ts</code> → <strong>root injector</strong> → <strong>root component</strong> → render → <strong>first change detection</strong>.</li>` +
        `<li>Entry point: <code>main.ts</code> → <code>bootstrapApplication(AppComponent, appConfig)</code>.</li>` +
        `<li><strong>Injector before component</strong> — the component depends on it.</li>` +
        `<li>Bootstrap providers live in the <strong>root injector</strong> → available app-wide.</li>` +
        `<li>Zone.js patches async APIs to trigger change detection; zoneless is opt-in.</li>` +
        `<li>Legacy path: <code>platformBrowserDynamic().bootstrapModule(AppModule)</code> — same pipeline, module config.</li>` +
        `<li>Blank page = bootstrap threw; always <code>.catch()</code> and read the console.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // TOPIC 4 — Standalone vs NgModule
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Standalone vs NgModule',
      slug: 'standalone-vs-ngmodule',
      order: 4,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>The shift from <code>NgModule</code> to standalone components is the biggest change to Angular's authoring model since the framework's rewrite. It touches how you declare dependencies, how you lazy-load, how you configure an app, and how you bootstrap. Because the industry is mid-migration, real codebases mix both styles — so you must be fluent in the modern default <em>and</em> able to read and reason about the legacy one. This is arguably the highest-signal topic in the whole chapter for interviews right now.</p>`,
        `<p>Interviewers use it to date your knowledge and test your depth simultaneously. "What's a standalone component?" checks whether you're current. "Why did Angular introduce them?" checks whether you understand the pain <code>NgModule</code> caused. "How do you migrate?" checks whether you've done it. Getting all three right marks you as someone who has kept up with the framework's trajectory.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Plainly: an <code>NgModule</code> is a container that groups components, directives, and pipes and declares what they can see and what they expose. For years it was mandatory — every component had to be <em>declared</em> in exactly one module, and to use another component you imported its module. A <strong>standalone component</strong> removes that middle layer: it declares its own template dependencies directly via an <code>imports</code> array and needs no module at all.</p>`,
        `{{fig:ch1-standalone-vs-ngmodule.svg|Side by side comparison of the NgModule approach with declarations and imports versus a standalone component with its own imports array|The classic NgModule container versus the modern self-contained standalone component.}}`,
        `<p>More precisely: with <code>NgModule</code> you had two lists to keep in sync — <code>declarations</code> (what this module owns) and <code>imports</code> (what other modules it depends on) — plus <code>exports</code> to make things visible outward. A standalone component collapses all of that into one <code>standalone: true</code> flag and one <code>imports</code> array listing exactly the components, directives, and pipes <em>this component's template</em> uses. Dependencies become local and explicit instead of module-global and implicit.</p>`,
        `<h2>How it works</h2>`,
        `<p>The mental shift is from <strong>module-level</strong> declarations to <strong>component-level</strong> imports. Here is the same relationship expressed both ways.</p>`,
        `<table><thead><tr><th>Concern</th><th>NgModule world</th><th>Standalone world</th></tr></thead><tbody>` +
        `<tr><td>Declare a component</td><td>Add to a module's <code>declarations</code></td><td><code>standalone: true</code> on the component</td></tr>` +
        `<tr><td>Use another component</td><td>Import its module</td><td>Add it to the component's <code>imports</code></td></tr>` +
        `<tr><td>Use CommonModule pipes/dirs</td><td>Import <code>CommonModule</code> in the module</td><td>Import <code>NgIf</code>/<code>NgFor</code> (or nothing with new control flow)</td></tr>` +
        `<tr><td>App configuration</td><td><code>AppModule</code> <code>providers</code></td><td><code>ApplicationConfig</code> in <code>app.config.ts</code></td></tr>` +
        `<tr><td>Bootstrap</td><td><code>bootstrapModule(AppModule)</code></td><td><code>bootstrapApplication(AppComponent)</code></td></tr>` +
        `<tr><td>Lazy load</td><td><code>loadChildren</code> → a module</td><td><code>loadComponent</code> / <code>loadChildren</code> → routes</td></tr>` +
        `</tbody></table>`,
        `<p>Why did Angular make this change? <code>NgModule</code> solved a real problem — telling the compiler which components/directives/pipes are visible in which templates — but it did so with a layer of <strong>indirection and boilerplate</strong> that beginners found baffling and experts found tedious. The infamous "'app-foo' is not a known element" error is almost always a module wiring problem: the component exists, but the module that uses it didn't import the module that declares it. Standalone kills that class of error by making the dependency <em>local to the component that actually uses it</em>. What a template needs is listed on the component itself — no action-at-a-distance.</p>`,
        `<p>Two subtleties matter for interviews. First, <strong>standalone doesn't delete providers or DI</strong> — it changes <em>where</em> you register them. App-wide providers move from <code>AppModule.providers</code> to the <code>ApplicationConfig</code> passed at bootstrap (or stay on services via <code>providedIn: 'root'</code>). You can also provide services on a route or a component. Second, <strong>standalone and NgModule interoperate</strong>: a standalone component can be imported into an old <code>NgModule</code> (add it to that module's <code>imports</code>, not <code>declarations</code>), and a standalone component can import an existing <code>NgModule</code>. This two-way compatibility is what makes incremental migration possible.</p>`,
        `<p>Modern Angular pushes the standalone story further with the <strong>built-in control flow</strong> (<code>@if</code>, <code>@for</code>, <code>@switch</code>, v17+), which removes the need to even import <code>NgIf</code>/<code>NgFor</code> for the common cases — the control flow is part of the template compiler, not a directive you import. Combined with standalone components and <code>inject()</code>, a modern Angular file has dramatically less ceremony than its 2021 equivalent while doing exactly the same thing.</p>`,
        `<table><thead><tr><th>Aspect</th><th>NgModule</th><th>Standalone</th></tr></thead><tbody>` +
        `<tr><td>Boilerplate</td><td>High (a module per feature)</td><td>Low (none)</td></tr>` +
        `<tr><td>Dependency locality</td><td>Module-global, implicit</td><td>Component-local, explicit</td></tr>` +
        `<tr><td>"Not a known element" errors</td><td>Common</td><td>Rare (import is local)</td></tr>` +
        `<tr><td>Lazy loading unit</td><td>A module</td><td>A component or routes file</td></tr>` +
        `<tr><td>Default since</td><td>Angular 2–16</td><td>Angular 17+</td></tr>` +
        `</tbody></table>`,
        `<h2>Code examples</h2>`,
        `<p>The legacy pattern: a module declares a component and imports what it needs.</p>`,
        `<pre><code class="language-typescript">// legacy: user.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserCardComponent } from './user-card.component';

@NgModule({
  declarations: [UserCardComponent],   // this module OWNS the component
  imports: [CommonModule],             // to use *ngIf, *ngFor, etc.
  exports: [UserCardComponent],        // make it visible to other modules
})
export class UserModule {}</code></pre>`,
        `<p>The modern equivalent: the component is self-contained — no module, dependencies listed inline.</p>`,
        `<pre><code class="language-typescript">// modern: user-card.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-user-card',
  standalone: true,                    // no module needed
  imports: [],                         // list template deps here if any
  template: \`
    &#64;if (name) {                       &lt;!-- built-in control flow, no NgIf import --&gt;
      &lt;h3&gt;{{ name }}&lt;/h3&gt;
    }
  \`,
})
export class UserCardComponent {
  @Input() name = '';
}</code></pre>`,
        `<p>Composing standalone components: a parent imports exactly the children its template uses.</p>`,
        `<pre><code class="language-typescript">import { Component } from '@angular/core';
import { UserCardComponent } from './user-card.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [UserCardComponent],        // local, explicit dependency
  template: \`
    &#64;for (u of users; track u.id) {
      &lt;app-user-card [name]="u.name" /&gt;
    }
  \`,
})
export class UserListComponent {
  users = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Linus' }];
}</code></pre>`,
        `<p>Lazy-loading a standalone component directly from a route — no feature module required.</p>`,
        `<pre><code class="language-typescript">// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'users',
    // Load a single standalone component on demand...
    loadComponent: () =&gt;
      import('./user-list.component').then(m =&gt; m.UserListComponent),
  },
  {
    path: 'admin',
    // ...or a whole routes file for a feature area.
    loadChildren: () =&gt; import('./admin/admin.routes').then(m =&gt; m.ADMIN_ROUTES),
  },
];</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>` +
        `<li><strong>Forgetting to import a component you use in a standalone template.</strong> With standalone, the fix is local — add it to <em>this</em> component's <code>imports</code>, not some distant module.</li>` +
        `<li><strong>Adding a standalone component to a module's <code>declarations</code>.</strong> Standalone components go in <code>imports</code>, never <code>declarations</code> — doing the latter throws.</li>` +
        `<li><strong>Thinking standalone removed dependency injection.</strong> DI is unchanged; only the <em>place</em> you register app-wide providers moved (to <code>ApplicationConfig</code>).</li>` +
        `<li><strong>Still importing <code>NgIf</code>/<code>NgFor</code> when using <code>@if</code>/<code>@for</code>.</strong> The new control flow is built into the compiler; those imports are unnecessary for it.</li>` +
        `<li><strong>Believing NgModules are gone.</strong> They still exist and huge codebases use them; standalone is the default, not a removal. Interoperability is deliberate.</li>` +
        `<li><strong>Over-scoping <code>imports</code>.</strong> Only list what the template actually references; a bloated <code>imports</code> array hurts readability (though tree-shaking handles the bundle).</li>` +
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>` +
        `<li>Write <strong>new components standalone</strong>. Reserve <code>NgModule</code> for maintaining legacy code you haven't migrated yet.</li>` +
        `<li>Migrate incrementally using the official schematic: <code>ng generate @angular/core:standalone</code> converts declarations, then removes <code>NgModule</code>s.</li>` +
        `<li>Keep each component's <strong><code>imports</code> minimal and local</strong> — exactly what its template uses.</li>` +
        `<li>Prefer the <strong>built-in control flow</strong> (<code>@if</code>/<code>@for</code>/<code>@switch</code>) over the structural directives in new code.</li>` +
        `<li>Move app-wide providers into <strong><code>app.config.ts</code></strong>; scope narrower providers to a route or component.</li>` +
        `<li>Lazy-load with <strong><code>loadComponent</code></strong> for single views and <code>loadChildren</code> for feature route files.</li>` +
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is a standalone component?"</strong><br>A: A component marked <code>standalone: true</code> that declares its own template dependencies via an <code>imports</code> array and needs no <code>NgModule</code>. It's the default in Angular 17+. Dependencies become local and explicit instead of module-global.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why did Angular introduce standalone components?"</strong><br>A: To remove the boilerplate and indirection of <code>NgModule</code>. Modules forced you to keep <code>declarations</code>/<code>imports</code>/<code>exports</code> in sync and caused a whole class of "not a known element" errors from mis-wired modules. Standalone makes each component declare exactly what its template needs, right where it's used.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Did standalone remove NgModules and DI?"</strong><br>A: No. NgModules still exist and interoperate with standalone components — you can import one into the other. DI is unchanged; app-wide providers just moved from <code>AppModule.providers</code> to the <code>ApplicationConfig</code> at bootstrap. Standalone is the default, not a deletion. (Common trap answer: "modules are gone" — wrong.)</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you lazy-load with standalone components?"</strong><br>A: Use <code>loadComponent</code> in a route to load a single standalone component on demand, or <code>loadChildren</code> pointing at a routes file for a whole feature. No feature module required.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How would you migrate an NgModule app to standalone?"</strong><br>A: Incrementally, using the official schematic <code>ng g @angular/core:standalone</code>, which converts declarations to standalone, prunes modules, and can switch bootstrap. Because the two styles interoperate, you migrate feature by feature without a big-bang rewrite.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Where do template dependencies come from in a standalone component?"</strong><br>A: The component's own <code>imports</code> array. Built-in control flow (<code>@if</code>/<code>@for</code>) needs no import at all. That locality is the whole point — no module in between.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Standalone = <code>standalone: true</code> + local <code>imports</code>; <strong>no NgModule</strong>. Default since v17.</li>` +
        `<li>NgModule = container with <code>declarations</code>/<code>imports</code>/<code>exports</code>; now legacy.</li>` +
        `<li>Standalone moves dependencies from <strong>module-global</strong> to <strong>component-local</strong>.</li>` +
        `<li>DI unchanged; app providers moved to <code>ApplicationConfig</code> (<code>app.config.ts</code>).</li>` +
        `<li>The two <strong>interoperate</strong> — migrate incrementally, not all at once.</li>` +
        `<li>Lazy-load via <code>loadComponent</code> (one view) or <code>loadChildren</code> (routes file).</li>` +
        `<li>Prefer built-in <code>@if</code>/<code>@for</code>/<code>@switch</code> — no directive import needed.</li>` +
        `</ul>`,
      ].join('\n'),
    },
  ],
};
