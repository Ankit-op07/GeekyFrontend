module.exports = {
  title: 'Directives & Pipes',
  slug: 'directives-pipes',
  order: 2,
  topics: [
    {
      title: 'Structural vs Attribute Directives',
      slug: 'structural-vs-attribute',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Directives are the oldest and most fundamental idea in Angular: a directive is a class that attaches behaviour to an element in the DOM. Components are, in fact, just directives with a template — the <code>@Component</code> decorator extends <code>@Directive</code>. So the moment you understand directives you understand the substrate the whole framework is built on. Interviewers ask about the structural-versus-attribute split constantly because it is a quick, ruthless test of whether you know <em>what actually happens</em> when you type <code>*ngIf</code>, or whether you have only ever copy-pasted it.</p>`,
        `<p>The distinction is not academic. Get it wrong and you write two structural directives on one element (which throws a compile error you cannot debug without this knowledge), or you reach for <code>ngStyle</code> when you should have written <code>*ngIf</code>, and end up with hidden-but-present DOM nodes that still run change detection, still fire lifecycle hooks, and still leak subscriptions. Knowing which category a directive belongs to tells you instantly whether it changes the <em>shape</em> of the DOM or merely the <em>look</em> of an element that is already there.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>There are three kinds of directive in Angular, and it is worth naming all three so the two in this topic have context. <strong>Components</strong> are directives with a template. <strong>Attribute directives</strong> change the appearance or behaviour of an existing element — they keep the element in place and edit it. <strong>Structural directives</strong> change the DOM layout by adding and removing elements — they alter the very structure of the page.</p>`,
        `<p>The visual cue is the leading asterisk. Anything with a <code>*</code> in front of it — <code>*ngIf</code>, <code>*ngFor</code>, <code>*ngSwitchCase</code> — is structural. Anything written as a plain attribute or property binding — <code>ngClass</code>, <code>ngStyle</code>, <code>[appHighlight]</code>, <code>ngModel</code> — is an attribute directive. The asterisk is not decorative; it is a signal to the compiler that the element and its contents should be wrapped in a template and conditionally rendered.</p>`,
        `{{fig:ch3-structural-vs-attribute.svg|Comparison of structural and attribute directives|Structural directives change the DOM shape via an ng-template while attribute directives edit an element that is already present.}}`,
        `<p>A useful one-line rule for interviews: <em>structural directives change whether an element exists; attribute directives change what an existing element looks like or does.</em></p>`,
        `<h2>How it works</h2>`,
        `<p>The most important thing to internalise is that <strong>the asterisk is pure syntactic sugar</strong>. When the Angular compiler sees <code>*ngIf</code>, it desugars the element into an <code>&lt;ng-template&gt;</code> that hosts the original element as its content, and moves the directive onto that template. These two snippets are exactly equivalent after compilation:</p>`,
        `<pre><code class="language-html">&lt;!-- what you write --&gt;
&lt;div *ngIf="isLoggedIn"&gt;Welcome&lt;/div&gt;

&lt;!-- what the compiler produces --&gt;
&lt;ng-template [ngIf]="isLoggedIn"&gt;
  &lt;div&gt;Welcome&lt;/div&gt;
&lt;/ng-template&gt;</code></pre>`,
        `{{fig:ch3-desugar-template.svg|Desugaring of the asterisk into an ng-template|The compiler rewrites a starred element into an ng-template that binds the directive and wraps the host element as its content.}}`,
        `<p>An <code>&lt;ng-template&gt;</code> renders nothing by itself — it is an inert blueprint. The structural directive receives a <code>TemplateRef</code> (a handle to that blueprint) and a <code>ViewContainerRef</code> (a handle to the location in the DOM where views can be inserted). When the condition becomes true, the directive calls <code>viewContainer.createEmbeddedView(templateRef)</code> to stamp the content into the DOM; when it becomes false, it calls <code>viewContainer.clear()</code> to rip it back out. This is why <code>*ngIf</code> genuinely removes the element — the node, its component instance, its bindings, and its subscriptions are all destroyed, and <code>ngOnDestroy</code> fires.</p>`,
        `<p>Attribute directives take a completely different path. They never touch a template. Instead they inject a reference to their host element — historically <code>ElementRef</code>, and Angular's DOM abstraction <code>Renderer2</code> — and mutate its properties, classes, styles, or attributes. Modern attribute directives lean on <code>@HostBinding</code> and <code>@HostListener</code> to declaratively bind host properties and listen for host events without imperative DOM code. Because the element is already present, there is no create/destroy dance; the directive simply reads and writes onto a live node.</p>`,
        `<p>This mechanical difference explains the famous constraint: <strong>you can put only one structural directive on a single element.</strong> Two asterisks would each want to wrap the element in their own <code>&lt;ng-template&gt;</code>, and there is no unambiguous way to nest those wrappers — so Angular forbids it at compile time. Attribute directives have no such limit; you can stack <code>ngClass</code>, <code>ngStyle</code>, and three custom directives on one element because they all just edit the same live node.</p>`,
        `<h2>Code examples</h2>`,
        `<p><strong>1. The two categories side by side.</strong> Notice the single asterisk on the structural directive and the bracketed property bindings on the attribute ones.</p>`,
        `<pre><code class="language-html">&lt;!-- structural: the &lt;li&gt; only exists when the array has items --&gt;
&lt;li *ngIf="users.length"&gt;{{ users.length }} online&lt;/li&gt;

&lt;!-- attribute: the &lt;p&gt; always exists; we just edit its class + style --&gt;
&lt;p [ngClass]="{ active: isActive }" [ngStyle]="{ color: themeColor }"&gt;
  Always in the DOM, only its look changes.
&lt;/p&gt;</code></pre>`,
        `<p><strong>2. Solving the "two structural directives" problem.</strong> You cannot write <code>*ngFor</code> and <code>*ngIf</code> on the same element. The idiomatic fix used to be an <code>&lt;ng-container&gt;</code> — a grouping element that produces no DOM node — to host the second directive:</p>`,
        `<pre><code class="language-html">&lt;!-- illegal: two structural directives on one host --&gt;
&lt;!-- &lt;li *ngFor="let u of users" *ngIf="u.active"&gt;...&lt;/li&gt; --&gt;

&lt;!-- fix with ng-container, which renders no element of its own --&gt;
&lt;ng-container *ngFor="let u of users"&gt;
  &lt;li *ngIf="u.active"&gt;{{ u.name }}&lt;/li&gt;
&lt;/ng-container&gt;</code></pre>`,
        `<p><strong>3. Writing a minimal attribute directive (v17+ standalone).</strong> This is the shape every attribute directive follows — inject the host, react to it, write back to it.</p>`,
        `<pre><code class="language-typescript">import { Directive, ElementRef, HostListener, inject } from '@angular/core';

@Directive({
  selector: '[appUnderlineOnHover]',
  standalone: true,
})
export class UnderlineOnHoverDirective {
  private el = inject(ElementRef&lt;HTMLElement&gt;);

  @HostListener('mouseenter') onEnter() {
    this.el.nativeElement.style.textDecoration = 'underline';
  }
  @HostListener('mouseleave') onLeave() {
    this.el.nativeElement.style.textDecoration = 'none';
  }
}
// usage: &lt;a appUnderlineOnHover&gt;Hover me&lt;/a&gt;</code></pre>`,
        `<p><strong>4. Consuming an ng-template directly.</strong> Because structural directives are just sugar over templates, you can drive one manually to see the machinery. Here a tiny structural directive stamps its template when a boolean is set:</p>`,
        `<pre><code class="language-typescript">import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';

@Directive({ selector: '[appUnless]', standalone: true })
export class UnlessDirective {
  private tpl = inject(TemplateRef&lt;unknown&gt;);
  private vcr = inject(ViewContainerRef);
  private shown = false;

  @Input() set appUnless(hide: boolean) {
    if (!hide &amp;&amp; !this.shown) {
      this.vcr.createEmbeddedView(this.tpl); // stamp into DOM
      this.shown = true;
    } else if (hide &amp;&amp; this.shown) {
      this.vcr.clear();                       // remove from DOM
      this.shown = false;
    }
  }
}
// usage: &lt;p *appUnless="isHidden"&gt;Visible unless hidden&lt;/p&gt;</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Thinking <code>*ngIf</code> hides the element.</strong> It does not hide — it destroys and recreates. If you need to preserve state, scroll position, or an expensive child component, use <code>[hidden]</code> or CSS <code>display:none</code>, which keep the node alive.</li>`,
        `<li><strong>Two structural directives on one element.</strong> This is a compile error. Reach for <code>&lt;ng-container&gt;</code> to host the second one without adding a wrapper node.</li>`,
        `<li><strong>Forgetting the asterisk.</strong> Writing <code>ngIf="cond"</code> (no <code>*</code>, no brackets) sets a literal attribute and silently does nothing — the element is always rendered.</li>`,
        `<li><strong>Reaching into the DOM with <code>ElementRef.nativeElement</code> carelessly.</strong> It breaks server-side rendering and web workers, and opens XSS holes if you set <code>innerHTML</code>. Prefer <code>Renderer2</code>, <code>@HostBinding</code>, and Angular's sanitisation.</li>`,
        `<li><strong>Assuming <code>&lt;ng-template&gt;</code> renders something.</strong> On its own it renders nothing — it is only a blueprint. Beginners wrap markup in it expecting output and see a blank screen.</li>`,
        `<li><strong>Confusing <code>ng-container</code> and <code>ng-template</code>.</strong> <code>ng-container</code> renders its children immediately with no wrapper element; <code>ng-template</code> renders nothing until something stamps it.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Use a structural directive (or the new <code>@if</code>/<code>@for</code>) when an element should genuinely not exist; use an attribute directive or CSS when it should merely be styled or toggled visually.</li>`,
        `<li>Prefer <code>@HostBinding</code>/<code>@HostListener</code> over imperative <code>Renderer2</code> calls — they are declarative, testable, and SSR-safe.</li>`,
        `<li>Use <code>&lt;ng-container&gt;</code> to attach structural directives without polluting the DOM with wrapper <code>&lt;div&gt;</code>s.</li>`,
        `<li>Keep custom directive selectors in the <code>[bracketed]</code> attribute form and prefix them (e.g. <code>appTooltip</code>) so they read as attributes and never clash with future native ones.</li>`,
        `<li>When a directive must read or write the DOM, inject <code>ElementRef</code> for reading geometry and <code>Renderer2</code> for writing — never assemble HTML strings.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is the difference between a structural and an attribute directive?"</strong><br>A: A structural directive changes the DOM layout by adding or removing elements — it is backed by an <code>&lt;ng-template&gt;</code> and carries the leading <code>*</code> (e.g. <code>*ngIf</code>, <code>*ngFor</code>). An attribute directive changes the appearance or behaviour of an element that already exists, mutating its properties/classes/styles via host bindings (e.g. <code>ngClass</code>, <code>ngStyle</code>). Structural = whether the element exists; attribute = what it looks like.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What does the asterisk in <code>*ngIf</code> actually do?"</strong><br>A: It is syntactic sugar. The compiler desugars <code>&lt;div *ngIf="x"&gt;</code> into <code>&lt;ng-template [ngIf]="x"&gt;&lt;div&gt;...&lt;/div&gt;&lt;/ng-template&gt;</code>. The directive then uses <code>TemplateRef</code> and <code>ViewContainerRef</code> to stamp or clear the view. Follow-up trap — "so is the asterisk required?" No, you can write the expanded <code>ng-template</code> form yourself; the asterisk just saves typing.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why can't you put two structural directives on one element?"</strong><br>A: Each one wants to wrap the element in its own <code>&lt;ng-template&gt;</code>, and there is no unambiguous nesting order, so Angular forbids it at compile time. The fix is <code>&lt;ng-container&gt;</code> to host the second directive, or nesting the elements.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Is a component a directive?"</strong><br>A: Yes — a component is a directive with a template. <code>@Component</code> extends <code>@Directive</code> with a <code>template</code>/<code>templateUrl</code> and its own change-detection strategy. This is why components and directives share lifecycle hooks and host bindings.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you access and modify the host element from an attribute directive safely?"</strong><br>A: Inject <code>ElementRef</code> to read it and <code>Renderer2</code> to write to it, or better, use <code>@HostBinding</code> for properties and <code>@HostListener</code> for events. Avoid touching <code>nativeElement</code> directly for writes because it breaks SSR and can introduce XSS.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Difference between <code>*ngIf</code> and <code>[hidden]</code>?"</strong><br>A: <code>*ngIf</code> removes the element from the DOM entirely — its component is destroyed, subscriptions cleaned up, and it must be recreated. <code>[hidden]</code> sets <code>display:none</code> but keeps the element, its state, and its running change detection alive. Use <code>*ngIf</code> to save resources, <code>[hidden]</code> to preserve state or avoid re-render cost.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Three kinds:</strong> component (directive + template), attribute directive (edits element), structural directive (adds/removes element).</li>`,
        `<li><strong>Asterisk = structural</strong> and is sugar for <code>&lt;ng-template&gt;</code> + <code>[directive]</code>.</li>`,
        `<li><strong>Structural tools:</strong> <code>TemplateRef</code> (blueprint) + <code>ViewContainerRef</code> (insert point) → <code>createEmbeddedView</code>/<code>clear</code>.</li>`,
        `<li><strong>Attribute tools:</strong> <code>ElementRef</code>, <code>Renderer2</code>, <code>@HostBinding</code>, <code>@HostListener</code>.</li>`,
        `<li><strong>One structural directive per element;</strong> unlimited attribute directives.</li>`,
        `<li><strong><code>ng-container</code></strong> renders no node; <strong><code>ng-template</code></strong> renders nothing until stamped.</li>`,
        `<li><strong><code>*ngIf</code> destroys; <code>[hidden]</code> keeps alive.</strong></li>`,
        `</ul>`,
      ].join('\n'),
    },
    {
      title: 'Built-in Control Flow (@if, @for, @switch)',
      slug: 'control-flow',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Angular 17 introduced a brand-new, block-based control flow syntax — <code>@if</code>, <code>@for</code>, and <code>@switch</code> — that replaces the <code>*ngIf</code>, <code>*ngFor</code>, and <code>*ngSwitch</code> structural directives for everyday conditionals and loops. This is not a cosmetic rename. It is a compiler-level feature that ships less JavaScript, renders measurably faster, and closes some long-standing footguns. In Angular 20 it became the recommended default, and the schematics can migrate existing templates automatically. For interviews from 2024 onward, knowing the new syntax — and being able to explain <em>why</em> it is faster than the directives — is a strong signal that you keep current with the framework.</p>`,
        `<p>The practical payoff is real: teams that migrate see smaller bundles because the <code>NgIf</code>/<code>NgForOf</code>/<code>NgSwitch</code> runtime code is no longer imported, and they hit fewer performance cliffs because <code>@for</code> makes the <code>track</code> expression mandatory rather than optional. If you have ever debugged a list that re-rendered every row on every keystroke, control flow is the built-in fix.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>Instead of putting a structural directive on an element, you wrap markup in a block that starts with <code>@</code>. The three blocks map one-to-one onto the old directives: <code>@if</code> replaces <code>*ngIf</code>, <code>@for</code> replaces <code>*ngFor</code>, and <code>@switch</code> replaces <code>*ngSwitch</code>. They read like the control flow of a normal programming language, and they need no imports — they are part of the template language itself.</p>`,
        `{{fig:ch3-control-flow.svg|Mapping of old structural directives to new control flow blocks|Each legacy structural directive maps to a built-in block where @for requires a track expression and offers an @empty block.}}`,
        `<p>Two blocks bring extras the old directives lacked. <code>@if</code> supports <code>@else if</code> and <code>@else</code> as first-class chained blocks, so you no longer juggle <code>ng-template</code> references. <code>@for</code> requires a <code>track</code> expression, offers a built-in <code>@empty</code> block for the zero-item case, and exposes contextual variables like <code>$index</code>, <code>$first</code>, <code>$last</code>, <code>$even</code>, and <code>$odd</code> without the awkward <code>let i = index</code> destructuring.</p>`,
        `<h2>How it works</h2>`,
        `<p>The key architectural difference is <em>where</em> the logic lives. The old <code>*ngIf</code> was a real directive: a class in <code>@angular/common</code> that had to be imported, instantiated, and driven through <code>TemplateRef</code>/<code>ViewContainerRef</code> at runtime. The new <code>@if</code> is understood <strong>directly by the compiler</strong>. There is no directive class to import and no directive instance created at runtime; the compiler emits specialised instructions that create and destroy views inline. That is why bundles shrink — you stop shipping the directive code — and why rendering is faster — there is one less layer of indirection.</p>`,
        `<p>The most consequential detail is <code>@for</code>'s mandatory <code>track</code>. When a list changes, Angular must reconcile the old set of DOM rows with the new array. <code>track</code> tells Angular how to identify "the same item" across renders. If you track a stable identity like <code>item.id</code>, Angular moves and reuses existing DOM nodes for items that persisted and only creates/destroys nodes for genuine additions or removals. Without a stable key — for instance tracking <code>$index</code> on a reorderable list — Angular can tear down and rebuild rows unnecessarily, destroying focus, animations, and child component state. The old <code>*ngFor</code> made <code>trackBy</code> optional, so most codebases silently defaulted to identity tracking and paid the cost; the new syntax forces the decision, which is the single biggest performance improvement in practice.</p>`,
        `<p>Under the hood <code>@for</code> uses an optimised diffing algorithm that the Angular team benchmarked as substantially faster than the old <code>ngFor</code> for many operations, precisely because <code>track</code> is guaranteed to be present and the reconciliation can assume a key. <code>@switch</code>, similarly, compiles to a direct branch rather than instantiating <code>NgSwitch</code>, <code>NgSwitchCase</code>, and <code>NgSwitchDefault</code> directives and matching them at runtime.</p>`,
        `<p>One subtle behaviour: <code>@if</code> lets you alias the evaluated condition with <code>as</code>, which is invaluable for unwrapping an observable exactly once — <code>@if (user$ | async; as user)</code> — so the async pipe subscribes a single time and you get a non-null, typed <code>user</code> inside the block.</p>`,
        `<h2>Code examples</h2>`,
        `<p><strong>1. <code>@if</code> with <code>@else if</code> and <code>@else</code>.</strong> No template references, reads top to bottom.</p>`,
        `<pre><code class="language-html">@if (user.role === 'admin') {
  &lt;app-admin-panel /&gt;
} @else if (user.role === 'editor') {
  &lt;app-editor-panel /&gt;
} @else {
  &lt;p&gt;Read-only access&lt;/p&gt;
}</code></pre>`,
        `<p><strong>2. <code>@for</code> with mandatory <code>track</code>, contextual variables, and <code>@empty</code>.</strong></p>`,
        `<pre><code class="language-html">@for (todo of todos; track todo.id) {
  &lt;li [class.done]="todo.done"&gt;
    {{ $index + 1 }}. {{ todo.title }}
    @if ($first) { &lt;span&gt;(top)&lt;/span&gt; }
  &lt;/li&gt;
} @empty {
  &lt;li&gt;No todos yet — add one!&lt;/li&gt;
}</code></pre>`,
        `<p><strong>3. Standalone component using control flow (v17+).</strong> Note there is no <code>CommonModule</code> import needed for the blocks themselves.</p>`,
        `<pre><code class="language-typescript">import { Component } from '@angular/core';

@Component({
  selector: 'app-status',
  standalone: true,
  template: \`
    @switch (status) {
      @case ('loading') { &lt;app-spinner /&gt; }
      @case ('error')   { &lt;p class="err"&gt;Something went wrong&lt;/p&gt; }
      @default          { &lt;app-content [data]="data" /&gt; }
    }
  \`,
})
export class StatusComponent {
  status: 'loading' | 'error' | 'ready' = 'loading';
  data: unknown;
}</code></pre>`,
        `<p><strong>4. Unwrapping an observable once with <code>@if ... as</code>.</strong> The async pipe subscribes a single time and <code>vm</code> is typed and non-null inside the block.</p>`,
        `<pre><code class="language-html">@if (vm$ | async; as vm) {
  &lt;h1&gt;{{ vm.title }}&lt;/h1&gt;
  &lt;p&gt;{{ vm.subtitle }}&lt;/p&gt;
} @else {
  &lt;app-skeleton /&gt;
}</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Forgetting <code>track</code>.</strong> It is a compile error in <code>@for</code>, which is intentional — but developers reflexively track <code>$index</code> to silence it, reintroducing the exact re-render bug the feature was meant to prevent. Track a stable business key (<code>item.id</code>) whenever one exists.</li>`,
        `<li><strong>Tracking a mutable or derived value.</strong> Tracking something that changes when the item's data changes (like the whole object without a stable id, or a computed string) defeats reuse and can thrash the DOM.</li>`,
        `<li><strong>Mixing old and new needlessly.</strong> You can run <code>*ngIf</code> and <code>@if</code> in the same app, but mixing them in one template is confusing. Migrate a template wholesale with <code>ng generate @angular/core:control-flow</code>.</li>`,
        `<li><strong>Expecting <code>@if</code> to preserve state on toggle.</strong> Like <code>*ngIf</code>, it destroys and recreates the content — it is not <code>display:none</code>.</li>`,
        `<li><strong>Referencing <code>index</code> instead of <code>$index</code>.</strong> The new blocks use the <code>$</code>-prefixed contextual variables (<code>$index</code>, <code>$first</code>, <code>$count</code>); the old <code>let i = index</code> aliasing syntax does not apply.</li>`,
        `<li><strong>Assuming <code>@empty</code> shows during loading.</strong> <code>@empty</code> renders only when the collection is empty, not while data is pending — use <code>@if</code> or a loading flag for the pending state.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Prefer built-in control flow over the structural directives for all new code — smaller bundle, faster render, cleaner syntax.</li>`,
        `<li>Always <code>track</code> a stable, unique identity (a database id or natural key); fall back to <code>$index</code> only for static, never-reordered lists.</li>`,
        `<li>Use the <code>@empty</code> block instead of a separate <code>@if (items.length === 0)</code> for the zero-item case.</li>`,
        `<li>Use <code>@if (obs$ | async; as value)</code> to subscribe an observable exactly once and get a typed, non-null value in the block.</li>`,
        `<li>Migrate existing templates with the official schematic rather than by hand to avoid subtle behavioural differences.</li>`,
        `<li>Keep template logic thin — heavy conditions belong in a component getter or a computed signal, not inline in an <code>@if</code>.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Why is the new <code>@for</code> faster than <code>*ngFor</code>?"</strong><br>A: Two reasons. First, <code>@for</code> is a compiler feature — no <code>NgForOf</code> directive is imported or instantiated at runtime, so there is less code and one less layer of indirection. Second, <code>track</code> is mandatory, so Angular always has a stable key to reconcile the list and can reuse DOM nodes instead of rebuilding them.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why is <code>track</code> required now when <code>trackBy</code> was optional before?"</strong><br>A: Because most codebases never provided <code>trackBy</code> and silently defaulted to identity tracking, paying a hidden performance cost — lists re-rendered rows on every change. Making <code>track</code> mandatory forces the developer to make the reconciliation decision explicitly, which is the single biggest real-world speedup of the new syntax.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What should you pass to <code>track</code>?"</strong><br>A: A stable unique identifier for the item — usually <code>item.id</code>. Trap: tracking <code>$index</code> on a reorderable or filterable list is almost always wrong because indices shift, causing Angular to tear down and recreate rows, losing focus, animation, and child state. <code>$index</code> is fine only for static lists that never reorder.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Do you need to import anything to use <code>@if</code>?"</strong><br>A: No. The control flow blocks are part of the template compiler, so unlike <code>*ngIf</code> (which needs <code>CommonModule</code> or the standalone <code>NgIf</code>) they require no import.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What does the <code>as</code> keyword do in <code>@if (data$ | async; as data)</code>?"</strong><br>A: It aliases the evaluated condition to a local variable, letting you subscribe the async pipe once and reference a typed, non-null <code>data</code> inside the block instead of piping through <code>async</code> repeatedly.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Does <code>@if</code> preserve component state when it toggles false then true?"</strong><br>A: No. Like <code>*ngIf</code>, it destroys the content and its components when the condition is false and rebuilds them when true. For state preservation you need <code>[hidden]</code> or CSS.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Since v17, default in v20:</strong> <code>@if</code> / <code>@for</code> / <code>@switch</code> replace <code>*ngIf</code> / <code>*ngFor</code> / <code>*ngSwitch</code>.</li>`,
        `<li><strong>No imports needed</strong> — compiler feature, not directives; smaller bundle, faster render.</li>`,
        `<li><strong><code>@for</code> requires <code>track</code></strong> — use a stable id, not <code>$index</code>, on dynamic lists.</li>`,
        `<li><strong>Extras:</strong> <code>@else if</code>/<code>@else</code>, <code>@empty</code>, contextual <code>$index $first $last $even $odd $count</code>.</li>`,
        `<li><strong><code>@if (x$ | async; as x)</code></strong> subscribes once and gives a typed value.</li>`,
        `<li><strong>Migrate</strong> with <code>ng generate @angular/core:control-flow</code>.</li>`,
        `<li><strong>Still destroys on toggle</strong> — not <code>display:none</code>.</li>`,
        `</ul>`,
      ].join('\n'),
    },
    {
      title: 'Custom Directives',
      slug: 'custom-directives',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Custom directives are how you package reusable DOM behaviour without wrapping everything in a component. Need a tooltip on any element, a "highlight on hover" effect, a click-outside detector, an auto-focus, a permission-gated visibility rule, or a lazy-load-on-scroll — these are directives, not components. They attach cross-cutting behaviour to elements you do not own, keep your templates declarative, and are one of the clearest demonstrations in an interview that you understand Angular beyond gluing components together.</p>`,
        `<p>Interviewers love custom directives because writing one exercises the whole surface area at once: dependency injection (<code>ElementRef</code>, <code>Renderer2</code>), host interaction (<code>@HostBinding</code>, <code>@HostListener</code>), inputs, and — for structural ones — <code>TemplateRef</code> and <code>ViewContainerRef</code>. If you can build a highlight directive and a custom structural directive from scratch, you have proven you understand how Angular touches the DOM.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A directive is a TypeScript class decorated with <code>@Directive</code> and given a CSS <code>selector</code>. When Angular finds an element matching that selector, it instantiates the class and runs its logic against that host element. There are two flavours you will build: <strong>attribute directives</strong>, which read and modify the element they sit on, and <strong>structural directives</strong>, which add or remove the element (and carry the <code>*</code>).</p>`,
        `{{fig:ch3-directive-anatomy.svg|Anatomy of a custom attribute directive|A directive class uses Input to receive data, HostBinding to write host properties, and HostListener to react to host events.}}`,
        `<p>The three decorators that make attribute directives ergonomic are: <code>@Input()</code> to receive configuration from the template, <code>@HostBinding()</code> to declaratively bind a property/class/style/attribute on the host element, and <code>@HostListener()</code> to declaratively subscribe to a DOM event on the host. Together they let you write directives with no imperative DOM code at all.</p>`,
        `<h2>How it works</h2>`,
        `<p>When Angular compiles a template and matches a directive selector, it creates the directive instance through the same dependency-injection machinery it uses for components. The directive's element-level injector can hand it <code>ElementRef</code> (a reference to the host DOM node), <code>Renderer2</code> (Angular's platform-agnostic DOM writer), <code>ViewContainerRef</code>, and any services you ask for.</p>`,
        `<p><code>@HostBinding('style.backgroundColor')</code> tells Angular: whenever change detection runs on this directive, take the value of the decorated class property and write it to <code>host.style.backgroundColor</code>. It is declarative and change-detection-aware, so you never call <code>Renderer2.setStyle</code> yourself. <code>@HostListener('click', ['$event'])</code> registers a DOM event listener on the host that calls your method and passes the event; Angular also tears the listener down automatically when the directive is destroyed, avoiding leaks. This is why host decorators are preferred over injecting <code>ElementRef</code> and mutating <code>nativeElement</code> by hand — they are SSR-safe, testable, and self-cleaning.</p>`,
        `<p><strong>Structural directives</strong> work differently, as covered in the first topic: they inject a <code>TemplateRef</code> (the blueprint of the element they are attached to, because the <code>*</code> desugars the host into an <code>&lt;ng-template&gt;</code>) and a <code>ViewContainerRef</code> (the anchor where views get inserted). You call <code>viewContainer.createEmbeddedView(templateRef)</code> to render and <code>viewContainer.clear()</code> to remove. To pass data into the stamped template you provide a context object as the second argument, and expose typed variables via a <code>*directive="expr; let x = someKey"</code> microsyntax. Angular's own <code>NgFor</code> is exactly this pattern, providing <code>$implicit</code>, <code>index</code>, <code>first</code>, and so on through its context.</p>`,
        `<p>A modern refinement: directives can now use the <code>inject()</code> function instead of constructor parameters, and can even use a host directive composition pattern (<code>hostDirectives</code> in a component's metadata) to apply a directive to a component's own host automatically. Directives also participate fully in change detection and lifecycle — they get <code>ngOnInit</code>, <code>ngOnChanges</code>, <code>ngOnDestroy</code>, etc., just like components.</p>`,
        `<h2>Code examples</h2>`,
        `<p><strong>1. A configurable highlight directive using all three decorators (v17+ standalone).</strong></p>`,
        `<pre><code class="language-typescript">import { Directive, HostBinding, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  standalone: true,
})
export class HighlightDirective {
  @Input('appHighlight') color = 'yellow';   // alias input to the selector name
  @HostBinding('style.backgroundColor') bg = '';

  @HostListener('mouseenter') onEnter() { this.bg = this.color; }
  @HostListener('mouseleave') onLeave() { this.bg = ''; }
}
// usage: &lt;p appHighlight="#fde68a"&gt;Hover to highlight&lt;/p&gt;</code></pre>`,
        `<p><strong>2. A click-outside directive that emits an output.</strong> Directives can have <code>@Output</code> events just like components.</p>`,
        `<pre><code class="language-typescript">import { Directive, ElementRef, EventEmitter, HostListener, Output, inject } from '@angular/core';

@Directive({ selector: '[appClickOutside]', standalone: true })
export class ClickOutsideDirective {
  private el = inject(ElementRef&lt;HTMLElement&gt;);
  @Output() appClickOutside = new EventEmitter&lt;void&gt;();

  @HostListener('document:click', ['$event.target'])
  onClick(target: HTMLElement) {
    if (!this.el.nativeElement.contains(target)) {
      this.appClickOutside.emit();
    }
  }
}
// usage: &lt;div appClickOutside (appClickOutside)="close()"&gt;...&lt;/div&gt;</code></pre>`,
        `<p><strong>3. A custom structural directive with a typed context.</strong> This re-implements a "repeat N times" loop and exposes the current index.</p>`,
        `<pre><code class="language-typescript">import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';

interface RepeatContext { $implicit: number; index: number; }

@Directive({ selector: '[appRepeat]', standalone: true })
export class RepeatDirective {
  private tpl = inject(TemplateRef&lt;RepeatContext&gt;);
  private vcr = inject(ViewContainerRef);

  @Input() set appRepeat(count: number) {
    this.vcr.clear();
    for (let i = 0; i &lt; count; i++) {
      this.vcr.createEmbeddedView(this.tpl, { $implicit: i, index: i });
    }
  }
}
// usage: &lt;span *appRepeat="3; let i"&gt;Item {{ i }} &lt;/span&gt;</code></pre>`,
        `<p><strong>4. Composing directives onto a component with <code>hostDirectives</code>.</strong> This applies the highlight behaviour to every instance of the component without touching its template.</p>`,
        `<pre><code class="language-typescript">import { Component } from '@angular/core';
import { HighlightDirective } from './highlight.directive';

@Component({
  selector: 'app-card',
  standalone: true,
  hostDirectives: [{ directive: HighlightDirective, inputs: ['appHighlight: color'] }],
  template: \`&lt;ng-content /&gt;\`,
})
export class CardComponent {}
// &lt;app-card color="#e0f2fe"&gt;...&lt;/app-card&gt; now highlights on hover</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Mutating <code>nativeElement</code> directly for writes.</strong> It breaks SSR/web-worker rendering and bypasses Angular's sanitisation. Use <code>@HostBinding</code> or <code>Renderer2</code> instead; reserve <code>nativeElement</code> for reads like measuring size.</li>`,
        `<li><strong>Forgetting the directive is destroyed with its host.</strong> If you subscribe to something inside a directive, unsubscribe in <code>ngOnDestroy</code> (or use <code>takeUntilDestroyed</code>) — directives leak just like components.</li>`,
        `<li><strong>Not aliasing the input for attribute directives.</strong> To write <code>appHighlight="red"</code> you must alias the input to the selector: <code>@Input('appHighlight')</code>. Otherwise you need a separate attribute for the value.</li>`,
        `<li><strong>Injecting <code>TemplateRef</code> in an attribute directive.</strong> Only structural directives (used with <code>*</code>) get a <code>TemplateRef</code>; asking for one on a plain attribute directive fails because there is no template.</li>`,
        `<li><strong>Heavy work in <code>@HostListener</code> for high-frequency events.</strong> Listening to <code>scroll</code>, <code>mousemove</code>, or <code>resize</code> and doing work on every fire will jank the UI and trigger change detection constantly — debounce, throttle, or run outside Angular with <code>NgZone.runOutsideAngular</code>.</li>`,
        `<li><strong>Registering global listeners without cleanup.</strong> <code>@HostListener('document:click')</code> is cleaned up automatically, but a manual <code>addEventListener</code> in the constructor is not — always pair it with a matching removal.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Prefer <code>@HostBinding</code>/<code>@HostListener</code> over imperative DOM code — declarative, SSR-safe, and auto-cleaned.</li>`,
        `<li>Prefix directive selectors (e.g. <code>appTooltip</code>) and use the <code>[attribute]</code> selector form so they never collide with native or future attributes.</li>`,
        `<li>Keep a directive focused on one behaviour; compose several small directives rather than one god-directive.</li>`,
        `<li>Expose configuration through <code>@Input</code> and results through <code>@Output</code> so the directive stays declarative from the template's side.</li>`,
        `<li>For high-frequency DOM events, throttle/debounce or run outside Angular's zone, then re-enter only when you must update the view.</li>`,
        `<li>Use <code>hostDirectives</code> to compose reusable behaviour onto components instead of copy-pasting host bindings.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "How do you build a custom attribute directive?"</strong><br>A: Create a class with <code>@Directive({ selector: '[appX]' })</code>, inject <code>ElementRef</code>/<code>Renderer2</code> if you need the host, and use <code>@Input</code> for config, <code>@HostBinding</code> to write host properties, and <code>@HostListener</code> to react to host events. Register it via standalone imports or a module.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is the difference between <code>@HostBinding</code> and <code>@HostListener</code>?"</strong><br>A: <code>@HostBinding</code> binds a class property to a property/class/style/attribute on the host element (data flows out to the DOM). <code>@HostListener</code> binds a method to a DOM event on the host (events flow in from the DOM). One writes to the host, the other reads events from it.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How would you write a custom structural directive?"</strong><br>A: Inject <code>TemplateRef</code> and <code>ViewContainerRef</code>. Use an <code>@Input</code> setter that, based on its value, calls <code>viewContainer.createEmbeddedView(templateRef)</code> to render or <code>viewContainer.clear()</code> to remove. Pass a context object to expose variables via the microsyntax. That is exactly how <code>*ngIf</code> and <code>*ngFor</code> work internally.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why prefer <code>Renderer2</code> over <code>ElementRef.nativeElement</code>?"</strong><br>A: <code>Renderer2</code> abstracts the platform, so your directive works in server-side rendering and web workers where there is no real DOM, and it goes through Angular's sanitisation. Direct <code>nativeElement</code> access couples you to the browser and can open XSS holes. Trap: use <code>nativeElement</code> only for reads like measuring geometry.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Can a directive have inputs and outputs?"</strong><br>A: Yes — directives support <code>@Input</code> and <code>@Output</code> exactly like components, and full lifecycle hooks. A click-outside directive, for example, takes no input and emits an output event.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you attach a directive's behaviour to a component automatically?"</strong><br>A: Use the <code>hostDirectives</code> field in the component's metadata to compose one or more directives onto the component's host, optionally exposing their inputs/outputs. This is directive composition, added in Angular 15.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>@Directive + selector</strong> → class runs against every matching element.</li>`,
        `<li><strong>Attribute directive tools:</strong> <code>@Input</code>, <code>@HostBinding</code> (write host), <code>@HostListener</code> (read events), <code>ElementRef</code>/<code>Renderer2</code>.</li>`,
        `<li><strong>Structural directive tools:</strong> <code>TemplateRef</code> + <code>ViewContainerRef</code> → <code>createEmbeddedView</code>/<code>clear</code> + context object.</li>`,
        `<li><strong>Alias the input</strong> to the selector (<code>@Input('appHighlight')</code>) for the one-attribute form.</li>`,
        `<li><strong>Directives leak too</strong> — clean up subscriptions in <code>ngOnDestroy</code>/<code>takeUntilDestroyed</code>.</li>`,
        `<li><strong>High-frequency events</strong> → throttle or <code>runOutsideAngular</code>.</li>`,
        `<li><strong><code>hostDirectives</code></strong> composes behaviour onto components.</li>`,
        `</ul>`,
      ].join('\n'),
    },
    {
      title: 'Pure vs Impure Pipes',
      slug: 'pure-impure-pipes',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Pipes transform data for display — <code>{{ price | currency }}</code>, <code>{{ date | date:'short' }}</code>, <code>{{ name | uppercase }}</code>. They are one of Angular's most-used features, and the single most misunderstood detail about them — the difference between a <em>pure</em> and an <em>impure</em> pipe — is where real performance bugs are born. An impure pipe re-runs on <em>every single change-detection cycle</em>, which in a busy app can be hundreds of times per second. Put an expensive computation in an impure pipe and you have a UI that stutters for reasons that are invisible in the template.</p>`,
        `<p>Interviewers ask about pure versus impure because it reveals whether you understand Angular's change-detection model, not just the pipe API. It also connects to a classic trap — "why doesn't my filter pipe update when I push to the array?" — whose correct answer requires knowing exactly when a pure pipe re-evaluates. Getting this right marks you as someone who writes performant Angular.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A pipe is a class decorated with <code>@Pipe</code> that implements a single <code>transform(value, ...args)</code> method. The template's <code>|</code> operator calls that method with the piped value and any arguments after the colons. <code>{{ amount | currency:'INR':'symbol':'1.2-2' }}</code> becomes <code>transform(amount, 'INR', 'symbol', '1.2-2')</code>.</p>`,
        `{{fig:ch3-pipe-pipeline.svg|The pipe transform pipeline|The template pipe operator forwards the value and arguments into the pipe's transform method and renders whatever it returns.}}`,
        `<p>Every pipe is <strong>pure by default</strong>. A pure pipe re-runs its <code>transform</code> only when Angular detects a change to the input's <em>reference</em> (for objects/arrays) or <em>value</em> (for primitives). An <strong>impure</strong> pipe — declared with <code>pure: false</code> — re-runs on every change-detection cycle regardless of whether the input changed. That one flag is the entire distinction, and it has enormous performance consequences.</p>`,
        `{{fig:ch3-pure-vs-impure.svg|Pure versus impure pipe re-evaluation|A pure pipe re-runs only when the input reference changes while an impure pipe re-runs on every change-detection cycle.}}`,
        `<h2>How it works</h2>`,
        `<p>When Angular compiles a template containing a pipe, it creates a single instance of the pipe class (per usage) and caches it. On each change-detection pass, Angular decides whether to call <code>transform</code> again. For a <strong>pure</strong> pipe, it performs a cheap reference/identity check on the input and every argument: if the input is a primitive and its value is unchanged, or an object and its reference is unchanged, Angular <em>skips the call entirely</em> and reuses the previously computed output. This is effectively automatic memoisation, and it is why pure pipes are so cheap — a pipe over an unchanging value costs nothing after the first render.</p>`,
        `<p>The consequence is the classic gotcha: because the check is by reference, <strong>mutating</strong> an object or array in place does not trigger a pure pipe. If you write <code>this.items.push(newItem)</code>, the array reference is identical, so a pure filter pipe over <code>items</code> never re-runs and the view looks stale. The fix is to produce a new reference — <code>this.items = [...this.items, newItem]</code> — which the identity check detects. This is the same reasoning behind <code>OnPush</code> change detection and immutability, and interviewers love to connect the two.</p>`,
        `<p>An <strong>impure</strong> pipe (<code>pure: false</code>) skips the identity check and runs <code>transform</code> on every change-detection cycle. That means it <em>will</em> react to in-place mutations — but at a steep price. Change detection can run extremely frequently (every event, timer, XHR, and more), so an impure pipe's <code>transform</code> may execute hundreds of times per second. If that method does anything expensive — filtering a large array, sorting, formatting — you are re-doing that work constantly, and worse, you cannot easily tell from the template that it is happening. This is precisely why the Angular team recommends against filter/sort pipes and suggests doing such work in the component instead.</p>`,
        `<p>The most important impure pipe in the framework is <code>AsyncPipe</code> (covered in the next topic): it must be impure because it needs to re-render whenever its observable emits, which is unrelated to input reference changes. Other built-in impure pipes include <code>slice</code> and <code>keyvalue</code>. The lesson: impurity is a deliberate, rare choice for pipes that must react to internal state changes, not the default.</p>`,
        `<h2>Code examples</h2>`,
        `<p><strong>1. A pure pipe (the default).</strong> Note <code>standalone: true</code> and the single <code>transform</code> method.</p>`,
        `<pre><code class="language-typescript">import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truncate', standalone: true }) // pure by default
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 20, trail = '…'): string {
    if (!value) return '';
    return value.length &gt; limit ? value.slice(0, limit) + trail : value;
  }
}
// usage: {{ description | truncate:50 }}</code></pre>`,
        `<p><strong>2. The mutation trap.</strong> A pure filter pipe will not react to <code>push</code>; you must replace the reference.</p>`,
        `<pre><code class="language-typescript">// pipe (pure)
@Pipe({ name: 'activeOnly', standalone: true })
export class ActiveOnlyPipe implements PipeTransform {
  transform(users: User[]): User[] {
    return users.filter(u =&gt; u.active);
  }
}

// component
addUser(u: User) {
  this.users.push(u);               // same reference — pipe does NOT re-run
  this.users = [...this.users, u];  // new reference — pure pipe re-runs
}</code></pre>`,
        `<p><strong>3. An impure pipe — and why you rarely want one.</strong> This filters on every CD cycle so it sees mutations, but it is expensive.</p>`,
        `<pre><code class="language-typescript">@Pipe({ name: 'liveFilter', standalone: true, pure: false }) // impure!
export class LiveFilterPipe implements PipeTransform {
  transform(items: string[], term: string): string[] {
    // runs on EVERY change-detection cycle — keep it trivially cheap
    return term ? items.filter(i =&gt; i.includes(term)) : items;
  }
}</code></pre>`,
        `<p><strong>4. The recommended alternative — compute in the component.</strong> Instead of an impure filter pipe, derive the list once when inputs change (here with a signal), so the work is not repeated on every CD cycle.</p>`,
        `<pre><code class="language-typescript">import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-user-list',
  standalone: true,
  template: \`
    @for (u of activeUsers(); track u.id) { &lt;li&gt;{{ u.name }}&lt;/li&gt; }
  \`,
})
export class UserListComponent {
  users = signal&lt;User[]&gt;([]);
  // recomputes only when users() changes — no impure pipe needed
  activeUsers = computed(() =&gt; this.users().filter(u =&gt; u.active));
}</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Expecting a pure pipe to react to in-place mutation.</strong> <code>array.push()</code>, <code>obj.prop = x</code>, and <code>Map.set()</code> keep the same reference, so pure pipes ignore them. Produce a new reference instead.</li>`,
        `<li><strong>Reaching for an impure pipe to "fix" the mutation problem.</strong> It works but re-runs on every CD cycle; the real fix is immutability or computing in the component.</li>`,
        `<li><strong>Putting expensive logic in an impure pipe.</strong> Sorting/filtering large collections in a <code>pure: false</code> pipe runs constantly and is a classic performance killer — the Angular team explicitly advises against filter/sort pipes.</li>`,
        `<li><strong>Side effects in <code>transform</code>.</strong> A pipe must be a pure function of its inputs — no HTTP calls, no mutating state, no logging that matters. Impure pipes especially will fire your side effect hundreds of times.</li>`,
        `<li><strong>Assuming pipes are singletons across the app.</strong> Each template usage gets its own instance; pipe state is not shared unless you inject a shared service.</li>`,
        `<li><strong>Forgetting to declare/import the pipe.</strong> A standalone pipe must be added to the component's <code>imports</code>; a module pipe to <code>declarations</code>. Otherwise the template throws "no pipe found".</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Keep pipes pure (the default) and write them as pure functions of their inputs with no side effects.</li>`,
        `<li>Treat data as immutable — return new arrays/objects so pure pipes and <code>OnPush</code> both detect changes.</li>`,
        `<li>Do not build filter or sort pipes; filter/sort in the component (a getter, a <code>computed</code> signal, or an RxJS stream) so the work runs only when inputs change.</li>`,
        `<li>Reserve <code>pure: false</code> for pipes that genuinely depend on internal or time-based state (like <code>async</code>) and keep their <code>transform</code> trivially cheap.</li>`,
        `<li>Prefer pipes over method calls in templates for formatting — a method in <code>{{ format(x) }}</code> runs on every CD cycle, whereas a pure pipe is memoised.</li>`,
        `<li>Give pipes descriptive names and single responsibilities so they compose (<code>{{ x | a | b }}</code>).</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is the difference between a pure and an impure pipe?"</strong><br>A: A pure pipe (the default) re-runs <code>transform</code> only when Angular detects a change to the input's reference (objects/arrays) or value (primitives) — it is effectively memoised. An impure pipe (<code>pure: false</code>) re-runs on every change-detection cycle regardless of whether the input changed. Impure pipes see in-place mutations but are far more expensive.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why doesn't my pure filter pipe update when I push to the array?"</strong><br>A: Because <code>push</code> mutates the array in place, keeping the same reference, and a pure pipe only re-runs on a reference change. Replace the array with a new one — <code>this.items = [...this.items, item]</code> — and the pipe re-runs. This is the same immutability principle as <code>OnPush</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why does Angular recommend against filter and sort pipes?"</strong><br>A: To react to mutations they would need to be impure, and an impure pipe re-runs on every change-detection cycle — filtering/sorting a large list hundreds of times per second. It also hides the cost. The guidance is to filter/sort in the component instead.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Name a built-in impure pipe and explain why it must be impure."</strong><br>A: <code>AsyncPipe</code>. It has to re-render whenever its observable or promise emits a new value, and those emissions are unrelated to the input reference changing, so it cannot rely on the pure identity check — it must be evaluated every cycle to push the latest value.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Is using a pure pipe better than calling a method in the template?"</strong><br>A: Yes for formatting. A method call in an interpolation runs on every change-detection cycle, but a pure pipe is memoised and only recomputes when its input changes — so it is generally more performant. Trap: this only holds if the pipe is genuinely pure and cheap.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How many instances of a pipe exist?"</strong><br>A: One per usage location in a template, created and cached by Angular. Pipes are not global singletons, and their internal state is not shared across usages unless backed by an injected service.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Pipe = <code>@Pipe</code> + <code>transform(value, ...args)</code></strong>; <code>|</code> calls transform.</li>`,
        `<li><strong>Pure (default):</strong> re-runs only on reference/value change → memoised, cheap.</li>`,
        `<li><strong>Impure (<code>pure:false</code>):</strong> re-runs every CD cycle → sees mutations, expensive.</li>`,
        `<li><strong>Mutation trap:</strong> <code>push</code>/in-place edits keep the reference → pure pipe ignores. Use new references.</li>`,
        `<li><strong>Avoid filter/sort pipes</strong> — compute in component (<code>computed</code> signal / getter).</li>`,
        `<li><strong><code>async</code> is impure</strong> because it must react to emissions, not input identity.</li>`,
        `<li><strong>No side effects</strong> in <code>transform</code>; one instance per usage.</li>`,
        `</ul>`,
      ].join('\n'),
    },
    {
      title: 'The async Pipe',
      slug: 'async-pipe',
      order: 4,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>The <code>async</code> pipe is the single most valuable pipe in Angular and one of the framework's best answers to a whole category of bugs: memory leaks from forgotten subscriptions. It subscribes to an Observable or Promise, renders the latest value, marks the view for change detection on each emission, and — crucially — <strong>unsubscribes automatically when the component is destroyed</strong>. That last part means you write reactive templates without a single manual <code>subscribe()</code>, <code>ngOnDestroy</code>, or <code>takeUntil</code> in sight.</p>`,
        `<p>Interviewers ask about it because it sits at the intersection of RxJS, change detection, and lifecycle management. Being able to explain what the async pipe does under the hood — and why it works so well with <code>OnPush</code> — demonstrates that you understand Angular's reactive story end to end. It is also the canonical example of a deliberately impure pipe, tying directly into the previous topic.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>You have an Observable (say a stream of user data from an HTTP call) and you want to show its value in the template. Without the async pipe you would subscribe in the component, store the value in a field, and unsubscribe in <code>ngOnDestroy</code>. With the async pipe you write <code>{{ user$ | async }}</code> and Angular does all of that for you — subscribe, render, update, and clean up.</p>`,
        `{{fig:ch3-async-pipe.svg|What the async pipe does|The async pipe subscribes to the source, renders each emission, marks the view dirty for OnPush, and unsubscribes on destroy.}}`,
        `<p>The convention of naming observable variables with a trailing <code>$</code> (like <code>user$</code>) is a community signal that "this is a stream, pipe it through async." The async pipe unwraps that stream into its latest emitted value for the template.</p>`,
        `<h2>How it works</h2>`,
        `<p>The async pipe is declared <code>pure: false</code> — it is an <strong>impure pipe</strong>, and it must be. A pure pipe only re-runs when its input reference changes, but the async pipe's job is to react to <em>emissions from</em> the observable, which happen without the reference to the observable ever changing. So Angular evaluates it on every change-detection cycle; on each evaluation the pipe checks whether the source has emitted a new value and, if so, returns it.</p>`,
        `<p>Internally the pipe keeps a subscription. The first time <code>transform(source)</code> is called it subscribes to the source and stores the latest emitted value. On subsequent evaluations, if the source reference is the same, it simply returns the stored latest value (no re-subscription). If you pass a <em>different</em> observable, the pipe unsubscribes from the old one and subscribes to the new one — this is why swapping the stream in the component works seamlessly. When the host component is destroyed, Angular calls the pipe's <code>ngOnDestroy</code>, and the pipe unsubscribes from the source. That automatic teardown is the leak-prevention guarantee.</p>`,
        `<p>The change-detection integration is the other half. Each time the observable emits, the async pipe calls <code>ChangeDetectorRef.markForCheck()</code> to flag the component's view as needing to be re-checked. This is what makes it work perfectly with <strong>OnPush</strong> change detection: an OnPush component only re-renders on input changes, events, or an explicit <code>markForCheck</code> — and the async pipe supplies exactly that signal when data arrives. Manual subscriptions with OnPush require you to call <code>markForCheck</code> yourself; the async pipe removes that whole class of "my OnPush component won't update" bugs.</p>`,
        `<p>A subtle but important gotcha is that each <code>| async</code> in a template creates its own subscription. If you write <code>{{ user$ | async }}</code> in three places, the observable is subscribed three times — and for a cold observable like an <code>HttpClient</code> call, that is <em>three HTTP requests</em>. The standard fixes are: unwrap once with <code>@if (user$ | async; as user)</code> (or the older <code>*ngIf ... as</code>), or add <code>shareReplay(1)</code> to the stream so subscribers share a single execution. When the source completes the async pipe keeps rendering the last value; if it errors, the async pipe surfaces the error rather than swallowing it.</p>`,
        `<h2>Code examples</h2>`,
        `<p><strong>1. The leak-free reactive pattern.</strong> No manual subscribe, no <code>ngOnDestroy</code>.</p>`,
        `<pre><code class="language-typescript">import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [AsyncPipe],
  template: \`
    @if (user$ | async; as user) {
      &lt;h1&gt;{{ user.name }}&lt;/h1&gt;
      &lt;p&gt;{{ user.email }}&lt;/p&gt;
    } @else {
      &lt;app-spinner /&gt;
    }
  \`,
})
export class ProfileComponent {
  private http = inject(HttpClient);
  user$: Observable&lt;User&gt; = this.http.get&lt;User&gt;('/api/me');
}</code></pre>`,
        `<p><strong>2. The multiple-subscription trap and its fix.</strong> Each <code>| async</code> subscribes independently.</p>`,
        `<pre><code class="language-html">&lt;!-- three subscriptions -&gt; three HTTP calls for a cold observable --&gt;
&lt;h1&gt;{{ (user$ | async)?.name }}&lt;/h1&gt;
&lt;img [src]="(user$ | async)?.avatar" /&gt;
&lt;p&gt;{{ (user$ | async)?.bio }}&lt;/p&gt;

&lt;!-- fix: one subscription, unwrapped once --&gt;
@if (user$ | async; as user) {
  &lt;h1&gt;{{ user.name }}&lt;/h1&gt;
  &lt;img [src]="user.avatar" /&gt;
  &lt;p&gt;{{ user.bio }}&lt;/p&gt;
}</code></pre>`,
        `<p><strong>3. Sharing a cold stream with <code>shareReplay</code>.</strong> When you truly need multiple subscribers, share one execution.</p>`,
        `<pre><code class="language-typescript">import { shareReplay } from 'rxjs';

user$ = this.http.get&lt;User&gt;('/api/me').pipe(
  shareReplay({ bufferSize: 1, refCount: true }) // one HTTP call, replayed to all
);</code></pre>`,
        `<p><strong>4. Async pipe with OnPush — why it "just works".</strong> The pipe calls <code>markForCheck</code> on each emission, so the OnPush view updates without any manual code.</p>`,
        `<pre><code class="language-typescript">import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { interval, map } from 'rxjs';

@Component({
  selector: 'app-clock',
  standalone: true,
  imports: [AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`&lt;p&gt;Ticks: {{ ticks$ | async }}&lt;/p&gt;\`,
})
export class ClockComponent {
  // emits every second; async pipe marks the OnPush view for check each tick
  ticks$ = interval(1000).pipe(map(n =&gt; n + 1));
}</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Multiple <code>| async</code> on the same stream.</strong> Each one subscribes separately; for a cold HTTP observable that means duplicate requests. Unwrap once with <code>@if (x$ | async; as x)</code> or share with <code>shareReplay(1)</code>.</li>`,
        `<li><strong>Mixing manual <code>subscribe()</code> with async pipe.</strong> Subscribing in the component and also piping through async double-subscribes and reintroduces the leak you were avoiding. Pick one.</li>`,
        `<li><strong>Forgetting to import <code>AsyncPipe</code>.</strong> In a standalone component you must add <code>AsyncPipe</code> (or <code>CommonModule</code>) to <code>imports</code>, or the template errors.</li>`,
        `<li><strong>Assuming the value is ready synchronously.</strong> Before the first emission the async pipe yields <code>null</code>; guard with <code>@if</code>/<code>?.</code> and show a loading state.</li>`,
        `<li><strong>Piping a hot observable expecting replay.</strong> A late-subscribing async pipe on a hot subject misses earlier values; use <code>BehaviorSubject</code>/<code>shareReplay</code> if you need the latest on subscribe.</li>`,
        `<li><strong>Ignoring errors in the stream.</strong> If the observable errors, the async pipe propagates it and the view breaks; add <code>catchError</code> to the stream to render a fallback.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Prefer the async pipe over manual <code>subscribe()</code> in components — it auto-unsubscribes and eliminates a whole class of leaks.</li>`,
        `<li>Unwrap a stream once with <code>@if (data$ | async; as data)</code> to avoid multiple subscriptions and null-checking noise.</li>`,
        `<li>Add <code>shareReplay(1)</code> to cold streams that must be consumed in several places so they execute once.</li>`,
        `<li>Combine with <code>OnPush</code> change detection — the async pipe supplies the <code>markForCheck</code> signal, giving you fast, predictable rendering.</li>`,
        `<li>Handle errors and empty states in the stream (<code>catchError</code>, <code>startWith</code>) and in the template (<code>@else</code>/loading), not with try/catch around the pipe.</li>`,
        `<li>Name observable fields with a trailing <code>$</code> so readers know to pipe them through async.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What does the async pipe do?"</strong><br>A: It subscribes to an Observable or Promise, returns the latest emitted value to the template, marks the view for change detection on each emission, and unsubscribes automatically when the component is destroyed — so you get reactive templates with no manual subscription management and no leak.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Is the async pipe pure or impure, and why?"</strong><br>A: Impure (<code>pure: false</code>). It must re-evaluate on every change-detection cycle because it reacts to emissions from the source, which occur without the observable's reference ever changing. A pure pipe's identity check would never fire, so it could never pick up new values.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why does the async pipe work so well with OnPush?"</strong><br>A: OnPush components only re-render on input changes, events, or an explicit <code>markForCheck</code>. The async pipe calls <code>ChangeDetectorRef.markForCheck()</code> on every emission, supplying exactly that signal — so the view updates when data arrives without any manual change-detection code.</p></blockquote>`,
        `<blockquote><p><strong>Q: "You have <code>{{ user$ | async }}</code> three times in a template and see three HTTP calls — why, and how do you fix it?"</strong><br>A: Each <code>| async</code> creates its own subscription, and a cold HTTP observable re-executes per subscription. Fix by unwrapping once with <code>@if (user$ | async; as user)</code>, or by adding <code>shareReplay(1)</code> so the single execution is shared and replayed.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How does the async pipe prevent memory leaks?"</strong><br>A: It holds the subscription internally and implements <code>ngOnDestroy</code>; when Angular destroys the component, it destroys the pipe, which unsubscribes from the source. There is no forgotten subscription to leak, so you do not need <code>takeUntil</code> or a manual <code>ngOnDestroy</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What does the async pipe return before the first emission?"</strong><br>A: <code>null</code>. That is why you guard with <code>@if</code>, use the <code>?.</code> safe-navigation operator, or provide a <code>startWith</code> value — otherwise you bind to <code>null</code> until the stream produces its first value.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Subscribe → render latest → markForCheck → auto-unsubscribe on destroy.</strong></li>`,
        `<li><strong>Impure by necessity</strong> — reacts to emissions, not input identity.</li>`,
        `<li><strong>Pairs with OnPush</strong> — supplies the <code>markForCheck</code> signal automatically.</li>`,
        `<li><strong>Each <code>| async</code> = one subscription</strong> → unwrap once with <code>@if (x$ | async; as x)</code> or <code>shareReplay(1)</code>.</li>`,
        `<li><strong>Returns <code>null</code></strong> before first emit — guard with <code>@if</code>/<code>?.</code>.</li>`,
        `<li><strong>No manual <code>subscribe()</code></strong> — mixing them double-subscribes.</li>`,
        `<li><strong>Import <code>AsyncPipe</code></strong> in standalone components; handle errors with <code>catchError</code>.</li>`,
        `</ul>`,
      ].join('\n'),
    },
  ],
};
