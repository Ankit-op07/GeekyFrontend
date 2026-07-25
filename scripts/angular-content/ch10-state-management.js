module.exports = {
  title: 'State Management',
  slug: 'state-management',
  order: 9,
  topics: [
    {
      title: 'State Options: Local vs Service vs Store',
      slug: 'state-options-overview',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Every non-trivial Angular app has state — the cart, the logged-in user, a wizard's current step, whether a dropdown is open. The single most consequential architectural decision you make is <em>where each piece of state lives</em>. Put too much in a global store and a five-line feature turns into an action, a reducer, an effect, three selectors and a spec file. Put too little in a shared place and you end up prop-drilling the same value through eight components or, worse, keeping two copies that drift out of sync. Interviewers probe this constantly because it separates people who reach for NgRx reflexively from people who can justify a choice against the actual shape of the problem.</p>`,
        `<p>The modern Angular answer is not "always use a store." Since signals landed as a stable primitive in v17, the default has shifted: most state is local component state, a good deal of shared state fits comfortably in a service holding signals, and a global store like NgRx is reserved for genuinely app-wide, complex, side-effect-heavy state that benefits from a strict audit trail. Knowing the decision framework — and being able to defend it — is what this topic gives you. Getting it right keeps your codebase proportionate: cheap solutions for cheap problems, ceremony only where it earns its keep.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>Think of state as living at one of three <strong>scopes</strong>, each with a different cost and reach. <strong>Local state</strong> belongs to a single component: a <code>signal()</code> declared in the class, born when the component mounts and gone when it unmounts. <strong>Shared/feature state</strong> is needed by several components that don't have a parent-child relationship — a cart badge in the header and a cart page on a different route. That belongs in an injectable <strong>service</strong> (optionally a <code>@ngrx/signals</code> SignalStore), a singleton the DI system hands to everyone who asks. <strong>Global application state</strong> is app-wide, long-lived, and often mutated by many features and background processes — that is where a full <strong>store</strong> (NgRx Store) earns its complexity.</p>`,
        `{{fig:ch10-state-scope.svg|Three scopes of state from local to global|Local signals cost nothing and reach one view; a service reaches injectors; a global store reaches the whole app but demands the most ceremony.}}`,
        `<p>The rule of thumb: <strong>start at the smallest scope that works and only lift state up when a concrete need forces you.</strong> You lift from local to service the moment a second, unrelated component needs the same value. You lift from service to store when the flows become complex enough that you want the guarantees a store provides — a single immutable state tree, time-travel debugging, a serializable action log, and strict separation of pure state transitions from side effects.</p>`,
        `<p>A useful mental test: ask "if I mutate this value, who else must react, and how hard is it to trace why it changed?" Local answer: only this component. Service answer: a handful of injectors, easy to follow. Store answer: potentially the whole app, and you want every change stamped with an action so you can replay the history. Match the tool to that answer.</p>`,

        `<h2>How it works</h2>`,
        `<p>Understanding the trade-offs requires seeing what each option actually does at runtime.</p>`,
        `<p><strong>Local signals.</strong> A <code>signal()</code> is a reactive container. Reading it inside a template or a <code>computed()</code> registers that consumer as a dependency; setting it marks every dependent dirty. Under <code>OnPush</code> (and under the coming zoneless mode) a signal read in the template <em>is</em> the change-detection trigger — no <code>ChangeDetectorRef</code>, no Zone patching required. Local state has zero setup cost and perfect encapsulation, but it evaporates when the component is destroyed and cannot be seen by siblings.</p>`,
        `<p><strong>Service with signals.</strong> An <code>@Injectable({ providedIn: 'root' })</code> service is instantiated lazily the first time it is injected and then shared as a singleton for the app's lifetime. If that service holds signals, every component that injects it reads the <em>same</em> reactive state, and any component that calls a mutator method updates everyone at once. This is the DI system doing the "sharing" for you. Scope it to a lazy-loaded route (via route-level <code>providers</code>) and you get feature-scoped state that is created and destroyed with the feature. The reactivity is identical to local signals — it is only the <em>lifetime and reach</em> that change.</p>`,
        `<p><strong>Global store (NgRx).</strong> A store centralizes state into one immutable object tree. You never write to it directly. Instead a component <em>dispatches</em> an <strong>action</strong> (a plain object describing what happened); a <strong>reducer</strong> (a pure function) computes the next state from the current state plus that action; <strong>selectors</strong> read memoized slices back out; and <strong>effects</strong> handle anything asynchronous or impure. The payoff is traceability: every state change corresponds to a named, serializable action, so tooling can log, replay, and time-travel through them. The cost is indirection and boilerplate — the thing you are trading for that traceability.</p>`,
        `{{fig:ch10-state-decision.svg|Decision tree for choosing where state lives|Ask whether state is used outside the view and how complex its flows are; escalate from local signals to a service to NgRx only when forced.}}`,
        `<p><strong>The decision framework, concretely.</strong> Walk two questions. First: <em>is this state used outside the component that owns it?</em> If no, keep it local — full stop. If yes, second question: <em>are the flows complex</em> — many distinct actions, coordinated side effects, several teams touching it, a need to audit or replay changes? If no, a signal-based service (or SignalStore) is the sweet spot: shared and reactive without ceremony. If yes, reach for NgRx Store. The mistake juniors make is jumping straight to the last box; the mistake overcorrectors make is never leaving the first box even when the app clearly needs a store.</p>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. Local state — a component owning its own toggle.</strong> No service, no store, nothing to share.</p>`,
        `<pre><code class="language-typescript">import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-accordion',
  standalone: true,
  template: \`
    &lt;button (click)="toggle()"&gt;{{ open() ? 'Hide' : 'Show' }}&lt;/button&gt;
    @if (open()) { &lt;section&gt;&lt;ng-content /&gt;&lt;/section&gt; }
  \`,
})
export class AccordionComponent {
  open = signal(false);
  toggle() { this.open.update(v =&gt; !v); }
}</code></pre>`,
        `<p><strong>2. Shared feature state — a signal service.</strong> The header and the cart page both inject the same instance; neither owns the data.</p>`,
        `<pre><code class="language-typescript">import { Injectable, computed, signal } from '@angular/core';

interface Line { id: string; qty: number; price: number; }

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly _lines = signal&lt;Line[]&gt;([]);
  readonly lines = this._lines.asReadonly();
  readonly count = computed(() =&gt; this._lines().reduce((n, l) =&gt; n + l.qty, 0));
  readonly total = computed(() =&gt; this._lines().reduce((s, l) =&gt; s + l.qty * l.price, 0));

  add(line: Line) {
    this._lines.update(ls =&gt; [...ls, line]); // new reference — OnPush friendly
  }
}</code></pre>`,
        `<p><strong>3. Consuming that service from two unrelated components.</strong> DI guarantees they see one shared state.</p>`,
        `<pre><code class="language-typescript">import { Component, inject } from '@angular/core';
import { CartStore } from './cart.store';

@Component({
  selector: 'app-cart-badge',
  standalone: true,
  template: \`&lt;span class="badge"&gt;{{ cart.count() }}&lt;/span&gt;\`,
})
export class CartBadgeComponent {
  protected readonly cart = inject(CartStore); // same singleton everywhere
}</code></pre>`,
        `<p><strong>4. When you would escalate to NgRx.</strong> Once the cart must coordinate inventory checks, optimistic updates, retries, and an audit log across teams, the action-driven store starts to pay for itself:</p>`,
        `<pre><code class="language-typescript">// Now every change is a named, replayable event:
store.dispatch(CartActions.addItem({ productId, qty }));
// An effect verifies stock, dispatches addItemSuccess or addItemFailure,
// and DevTools shows the full timeline of what happened and why.</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Reaching for NgRx by default.</strong> Adding a global store to a small app buys ceremony you never cash in. If you cannot name the specific benefit (audit trail, coordinated effects, many teams) you are paying for nothing.</li>`,
        `<li><strong>Keeping duplicate copies of shared state.</strong> Two components each holding their own <code>signal</code> of "the current user" will drift. Shared state needs a single source of truth in a service, not a copy per consumer.</li>`,
        `<li><strong>Prop-drilling instead of injecting.</strong> Passing a value down through four <code>@Input()</code> layers to reach a leaf is a smell — that state wants to live in a service the leaf injects directly.</li>`,
        `<li><strong>Putting server cache in a store as if it were client state.</strong> Data fetched from an API is remote cache with its own concerns (staleness, refetching). Not everything from the network needs to sit in NgRx; sometimes a resource/query layer or a simple service is a better fit.</li>`,
        `<li><strong>Exposing writable signals from a service.</strong> Returning the raw <code>signal</code> lets any component mutate state from anywhere, destroying the "single mutation path" you wanted. Expose <code>asReadonly()</code> and mutate through methods.</li>`,
        `<li><strong>Confusing "global" with "important."</strong> The current theme is app-wide but trivially simple — a signal service is perfect. Complexity, not reach alone, is what justifies a store.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Default to local; lift only on demand.</strong> Start every piece of state inside the component. Move it to a service the instant a second, unrelated component needs it — not before.</li>`,
        `<li><strong>Make the signal service your workhorse.</strong> For the majority of shared state, a <code>providedIn: 'root'</code> service holding signals gives you reactivity, sharing, and OnPush compatibility with almost no boilerplate.</li>`,
        `<li><strong>Reserve NgRx for the three C's:</strong> Complexity (many coordinated actions), Cross-cutting effects (async orchestration, retries, optimistic updates), and Collaboration (multiple teams needing a shared, traceable contract).</li>`,
        `<li><strong>Scope feature state to its route.</strong> Provide a service at a lazy route's <code>providers</code> so its state is created and torn down with the feature rather than living forever in root.</li>`,
        `<li><strong>Keep one source of truth per fact.</strong> Derive everything else with <code>computed()</code> or selectors instead of storing it twice.</li>`,
        `<li><strong>Document the choice.</strong> A one-line comment ("service, not store — no async orchestration needed") saves the next engineer the debate you already had.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: When would you NOT use NgRx?</strong> Whenever you cannot articulate a concrete benefit it provides over a simpler option. If the state is local, use a signal. If it is shared but the flows are simple, use a signal service. NgRx earns its boilerplate only when you need a strict audit trail, coordinated side effects, or a shared contract across many teams. "We used NgRx because the app was big" is not a reason; "we needed replayable, traceable state changes with orchestrated effects" is.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do signals change the state-management story?</strong> They collapse the middle ground. Before signals, sharing reactive state often meant either RxJS <code>BehaviorSubject</code> services (verbose) or jumping to NgRx. Signals make a plain service a first-class reactive store: fine-grained, OnPush-friendly, no subscriptions to manage. That pushes the threshold for adopting a full store much higher.</p></blockquote>`,
        `<blockquote><p><strong>Q: Where does server data fit?</strong> Trap question. Remote data is a cache, not client state, and has different concerns: staleness, refetching, invalidation. You can keep it in a store, but recognize it as cache. Conflating "data from the API" with "application state" leads to bloated stores that reimplement caching badly.</p></blockquote>`,
        `<blockquote><p><strong>Q: A component needs a value three ancestors up. What do you do?</strong> Don't prop-drill it through three <code>@Input()</code> layers. If it is genuinely shared, put it in an injectable service both ends read. Prop-drilling is a signal that state is at the wrong scope.</p></blockquote>`,
        `<blockquote><p><strong>Q: What's the risk of putting everything in local component state?</strong> Duplication and drift. Two components independently tracking "is the user logged in" will disagree the moment one updates and the other doesn't. Shared facts need a single source of truth; local state is only safe when nothing else depends on it.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Three scopes:</strong> local signal (one view) → signal service (shared, simple) → NgRx store (app-wide, complex).</li>`,
        `<li><strong>Two questions:</strong> Used outside this component? Are the flows complex? Escalate only on "yes."</li>`,
        `<li><strong>Default:</strong> local. <strong>Workhorse:</strong> signal service. <strong>Last resort:</strong> global store.</li>`,
        `<li><strong>NgRx justifiers (the 3 C's):</strong> Complexity, Cross-cutting effects, Collaboration/audit trail.</li>`,
        `<li><strong>Single source of truth</strong> per fact; derive the rest with <code>computed()</code>/selectors.</li>`,
        `<li><strong>Expose <code>asReadonly()</code></strong>; mutate through methods, never raw signals.</li>`,
        `<li>Server data is <strong>cache</strong>, not client state — treat it accordingly.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    {
      title: 'NgRx Store: Actions, Reducers, Selectors',
      slug: 'ngrx-store',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>NgRx is Angular's canonical Redux implementation, and "walk me through the NgRx data flow" is one of the most common senior-Angular interview questions. It is popular not because it is always the right tool, but because it enforces a discipline — <strong>unidirectional data flow with pure, predictable state transitions</strong> — that makes large applications tractable. When state can only change through named actions processed by pure reducers, you get something rare: you can look at any bug and reconstruct exactly what sequence of events produced it, because that sequence is a serializable log of actions.</p>`,
        `<p>The reason interviewers push on this is that many candidates can wire up NgRx by copying boilerplate but cannot explain <em>why</em> reducers must be pure, <em>why</em> actions are events rather than commands, or <em>why</em> the flow is strictly one-directional. Those "why"s are the whole point. Get them right and NgRx is a superpower for complex apps; get them wrong and it is expensive ceremony that fights you. This topic builds the core mental model: the action → reducer → store → selector cycle, and the immutability and purity rules that make it work.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>NgRx has four moving parts. An <strong>action</strong> is a plain object with a <code>type</code> and optional payload that describes <em>something that happened</em> — "user clicked add to cart," "the API returned users." A <strong>reducer</strong> is a pure function <code>(state, action) =&gt; newState</code> that computes the next state from the current state and an action, never mutating and never doing side effects. The <strong>store</strong> is the single object holding the whole application state tree, an observable you can subscribe to. A <strong>selector</strong> is a pure, memoized query that reads a slice of state back out.</p>`,
        `{{fig:ch10-ngrx-flow.svg|Unidirectional NgRx data flow|A component dispatches an action, a pure reducer produces new state in the store, and selectors stream the updated slice back to the view.}}`,
        `<p>The critical property is that data flows in <strong>one direction only</strong>. A component dispatches an action → the store runs it through the reducers → the reducer returns new state → the store updates → selectors emit the new slice → the view re-renders. There is no back-channel: a component cannot reach into the store and set a value directly. The only way to change state is to dispatch an action. This constraint is what makes the whole system predictable — every mutation has a named cause you can inspect.</p>`,
        `<p>The best way to think about actions is as an <strong>event log</strong>, not a set of commands. You do not tell the store "set the cart to X"; you announce "an item was added" and let reducers decide how that event changes state. One action can be handled by many reducers, which is why events (past tense, describing what happened) scale better than commands (imperatives telling the store what to do).</p>`,

        `<h2>How it works</h2>`,
        `<p>Let's trace the full cycle at runtime.</p>`,
        `<p><strong>Dispatch.</strong> A component calls <code>store.dispatch(someAction())</code>. The action is a plain, serializable object like <code>{ type: '[Cart] Add Item', productId: 'p1', qty: 2 }</code>. Dispatching pushes it into the store's action stream, which every reducer and every effect is listening to.</p>`,
        `<p><strong>Reduction.</strong> The store passes the current state and the action to the root reducer, which delegates to the feature reducers. Each reducer is a pure function: given the same inputs it always returns the same output, it never mutates its <code>state</code> argument, and it performs no I/O. If a reducer has a handler registered for that action's type, it returns a <em>new</em> state object (typically via spread) reflecting the change; if not, it returns the existing state unchanged. Purity is non-negotiable because the store, DevTools, and undo/redo all rely on being able to re-run reducers deterministically.</p>`,
        `{{fig:ch10-store-parts.svg|Anatomy of an action and reducer handling|An action carries a type and payload; the reducer matches the type to a handler that returns a new immutable state object.}}`,
        `<p><strong>Immutability.</strong> Reducers must return new references for anything that changed. This is not stylistic — it is what makes both change detection and selector memoization fast. Because the previous and next state are different objects, a cheap reference check (<code>oldSlice === newSlice</code>) tells the framework whether a slice changed, without deep comparison. Mutating state in place (<code>state.items.push(x)</code>) breaks this: the reference stays the same, so selectors think nothing changed and views go stale.</p>`,
        `<p><strong>Store update &amp; notification.</strong> Once the root reducer returns the new state tree, the store replaces its held value and emits it to all subscribers. The store itself is an <code>Observable</code> of the entire state.</p>`,
        `<p><strong>Selection.</strong> Components rarely subscribe to the whole store — they use <strong>selectors</strong> via <code>store.select(selectFn)</code>. A selector is a pure function of state; <code>createSelector</code> wraps it with <strong>memoization</strong>, so it only recomputes when its input slices change by reference. The selector emits the derived value, the component reads it (increasingly via <code>store.selectSignal()</code> which returns a signal instead of an observable), and the view updates. Selectors are the read side of the CQRS-like split: actions/reducers are the write side, selectors the read side, and they never bleed into each other.</p>`,
        `<p><strong>createFeature.</strong> Modern NgRx (v17+) bundles a feature's reducer and auto-generates its selectors with <code>createFeature</code>, cutting the boilerplate dramatically. You declare the feature name, the reducer, and NgRx hands you <code>selectCartState</code> plus a selector for every top-level property for free.</p>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. Actions with <code>createActionGroup</code> (v17+).</strong> Grouping keeps related events together and names them as events, not commands.</p>`,
        `<pre><code class="language-typescript">import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const CartActions = createActionGroup({
  source: 'Cart',
  events: {
    'Add Item': props&lt;{ productId: string; qty: number }&gt;(),
    'Remove Item': props&lt;{ productId: string }&gt;(),
    'Clear': emptyProps(),
  },
});
// Produces CartActions.addItem({ productId, qty }), etc.
// action.type === '[Cart] Add Item'</code></pre>`,
        `<p><strong>2. A reducer with <code>createReducer</code> — pure and immutable.</strong></p>`,
        `<pre><code class="language-typescript">import { createReducer, on } from '@ngrx/store';
import { CartActions } from './cart.actions';

export interface CartState { items: { id: string; qty: number }[]; }
const initialState: CartState = { items: [] };

export const cartReducer = createReducer(
  initialState,
  on(CartActions.addItem, (state, { productId, qty }) =&gt; ({
    ...state,                                   // new top-level object
    items: [...state.items, { id: productId, qty }], // new array, no mutation
  })),
  on(CartActions.removeItem, (state, { productId }) =&gt; ({
    ...state,
    items: state.items.filter(i =&gt; i.id !== productId),
  })),
  on(CartActions.clear, (state) =&gt; ({ ...state, items: [] })),
);</code></pre>`,
        `<p><strong>3. Registering the feature and selecting from it (v17+ <code>createFeature</code>).</strong></p>`,
        `<pre><code class="language-typescript">import { createFeature, createReducer, on, createSelector } from '@ngrx/store';

export const cartFeature = createFeature({
  name: 'cart',
  reducer: cartReducer,
});
// Auto-generated: cartFeature.selectCartState, cartFeature.selectItems

// A derived selector, memoized on top of the generated one:
export const selectItemCount = createSelector(
  cartFeature.selectItems,
  (items) =&gt; items.reduce((n, i) =&gt; n + i.qty, 0),
);</code></pre>`,
        `<p><strong>4. Wiring it up standalone and consuming as a signal (v17+).</strong></p>`,
        `<pre><code class="language-typescript">// main.ts
import { provideStore } from '@ngrx/store';
import { cartFeature } from './cart.feature';

bootstrapApplication(AppComponent, {
  providers: [provideStore({ [cartFeature.name]: cartFeature.reducer })],
});

// component
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { CartActions } from './cart.actions';
import { selectItemCount } from './cart.feature';

@Component({
  selector: 'app-cart-badge',
  standalone: true,
  template: \`&lt;span&gt;{{ count() }}&lt;/span&gt;\`,
})
export class CartBadgeComponent {
  private store = inject(Store);
  count = this.store.selectSignal(selectItemCount); // Signal&lt;number&gt;
  add(id: string) { this.store.dispatch(CartActions.addItem({ productId: id, qty: 1 })); }
}</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Mutating state inside a reducer.</strong> <code>state.items.push(x)</code> or <code>state.user.name = 'X'</code> keeps the same reference, breaks change detection and selector memoization, and corrupts time-travel debugging. Always spread into new objects/arrays.</li>`,
        `<li><strong>Doing side effects in reducers.</strong> An HTTP call, a <code>console.log</code>, a <code>Date.now()</code>, a router navigation — none belong in a reducer. Reducers must be pure; impurity goes in effects.</li>`,
        `<li><strong>Naming actions as commands.</strong> <code>setCart</code> / <code>updateItems</code> treat the store like a setter. Prefer events: <code>'[Cart Page] Add Item Clicked'</code>. Events let multiple reducers react and read like an audit log.</li>`,
        `<li><strong>Reusing one action across many sources.</strong> A shared generic action hides <em>where</em> a change came from. Distinct, source-tagged actions keep the log meaningful (the "good action hygiene" rule).</li>`,
        `<li><strong>Subscribing to the whole store.</strong> <code>store.subscribe()</code> over the entire tree re-runs on every change. Use narrow, memoized selectors so components only react to their slice.</li>`,
        `<li><strong>Deriving state and storing it.</strong> Storing <code>itemCount</code> in state alongside <code>items</code> invites drift. Derive it in a selector instead — one source of truth.</li>`,
        `<li><strong>Selecting with an inline arrow.</strong> <code>store.select(s =&gt; s.cart.items.filter(...))</code> is not memoized and recomputes every emission. Wrap it in <code>createSelector</code>.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Model actions as events, one per source.</strong> Name them <code>'[Source] What Happened'</code>. This "good action hygiene" keeps the action log a readable history.</li>`,
        `<li><strong>Keep reducers pure and immutable.</strong> Spread for updates; never mutate the argument; never perform I/O. Purity is what all the tooling depends on.</li>`,
        `<li><strong>Adopt <code>createFeature</code> (v17+)</strong> to bundle the reducer and auto-generate slice selectors — far less boilerplate than hand-rolling each one.</li>`,
        `<li><strong>Always read through memoized selectors,</strong> composing derived selectors on top of feature selectors so recomputation only happens when inputs change.</li>`,
        `<li><strong>Prefer <code>selectSignal()</code> in components</strong> for a synchronous, OnPush-friendly value with no manual subscription management.</li>`,
        `<li><strong>Keep the state tree normalized and minimal;</strong> store facts, derive views. Flat, normalized shapes make reducers and selectors simpler.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: Walk me through the NgRx data flow.</strong> A component dispatches an action describing what happened. The store passes current state plus that action to the reducers. Each reducer is a pure function returning new, immutable state. The store updates and notifies subscribers. Selectors — pure, memoized queries — read the changed slice and emit it to the view. Data flows strictly one way; the only way to change state is to dispatch an action.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why must reducers be pure?</strong> Determinism. The store, Redux DevTools, time-travel, and undo/redo all re-run reducers and expect the same inputs to yield the same outputs. A side effect or mutation inside a reducer makes replay produce different results, so debugging tooling and change detection both break. Purity is the contract that makes everything else possible.</p></blockquote>`,
        `<blockquote><p><strong>Q: Actions as events or commands — and why does it matter?</strong> Events. An event ("Item Added") can be handled by any number of reducers and effects independently, and it documents what actually happened. A command ("setCart") couples the dispatcher to one handler and reads like a setter, losing the audit-trail benefit that justifies NgRx in the first place.</p></blockquote>`,
        `<blockquote><p><strong>Q: What does <code>createSelector</code> give you over a plain function?</strong> Memoization. It caches the last result and returns it unchanged when the input slices are reference-equal, so derived computations (filtering, totaling) don't re-run on unrelated state changes. This is why reducer immutability matters — reference-equal inputs are what let the memoization skip work.</p></blockquote>`,
        `<blockquote><p><strong>Q: A value in the store isn't updating the view. First suspicion?</strong> A mutation in the reducer — <code>push</code>/direct assignment kept the same reference, so the selector's memoization returned the cached value and the view never saw a change. Confirm the reducer returns new references for everything it touches.</p></blockquote>`,
        `<blockquote><p><strong>Q: Can a component change state without dispatching?</strong> No — and that's the point. The single, unidirectional path (dispatch → reduce → select) is the invariant that makes state changes traceable. Any back-channel would defeat the reason to use NgRx.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Four parts:</strong> Action (event) → Reducer (pure fn) → Store (state tree) → Selector (memoized read).</li>`,
        `<li><strong>One rule:</strong> the only way to change state is to <code>dispatch</code> an action. Flow is unidirectional.</li>`,
        `<li><strong>Reducers:</strong> pure, immutable, no side effects — spread, never mutate.</li>`,
        `<li><strong>Actions:</strong> events not commands, <code>'[Source] What Happened'</code>, one per source.</li>`,
        `<li><strong>Selectors:</strong> <code>createSelector</code> for memoization; compose derived on feature selectors.</li>`,
        `<li><strong>v17+:</strong> <code>createActionGroup</code>, <code>createFeature</code>, <code>provideStore</code>, <code>store.selectSignal()</code>.</li>`,
        `<li><strong>Immutability</strong> is what makes CD and memoization fast — reference equality is the signal.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    {
      title: 'Effects, Selectors & @ngrx/entity',
      slug: 'ngrx-effects-selectors',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Reducers are pure by law, which raises an obvious question: where does the messy real world go? Every app has to call APIs, read localStorage, navigate the router, show toasts, debounce searches. NgRx's answer is <strong>effects</strong> — the one place side effects are allowed to live. Understanding effects is where NgRx interviews get serious, because effects sit at the intersection of NgRx and RxJS: you cannot write a correct effect without choosing the right flattening operator, and choosing wrong produces race conditions, dropped requests, or memory leaks that only show up under load.</p>`,
        `<p>The other two pillars this topic covers — memoized <strong>selectors</strong> and <strong>@ngrx/entity</strong> — are what keep a growing store fast and maintainable. Selectors done well mean derived data is computed once and cached; done badly they recompute expensive filters on every keystroke. @ngrx/entity eliminates the tedious, error-prone hand-written reducer logic for collections (add, update, remove, upsert) and gives you a normalized, performant shape for free. Together, effects, selectors, and entity are what separate a toy NgRx setup from a production one, and interviewers know it.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>An <strong>effect</strong> is a service that listens to the action stream, reacts to specific actions by doing asynchronous or impure work, and (usually) dispatches a <em>new</em> action with the result. The pattern is always the same shape: an action comes in (<code>loadUsers</code>), the effect does the side effect (an HTTP call), and an action goes out (<code>loadUsersSuccess</code> or <code>loadUsersFailure</code>). Crucially, effects <em>do not touch state directly</em> — they translate one action into another, and the reducer handles the state change. This keeps the pure/impure boundary clean: reducers stay pure, effects own the impurity.</p>`,
        `{{fig:ch10-effects-flow.svg|Effect side-effect loop|An effect listens for a trigger action, performs async work via a flattening operator, and dispatches a success or failure action that a reducer folds into state.}}`,
        `<p>A <strong>memoized selector</strong> is a cached query over state. <code>createSelector</code> takes one or more input selectors plus a projector function; it remembers the last inputs and last result, and if the inputs are reference-equal next time, it returns the cached result without re-running the projector. Selectors <em>compose</em> — you build small selectors and combine them into bigger ones, and memoization applies at every level.</p>`,
        `<p><strong>@ngrx/entity</strong> is a helper for managing collections. Instead of storing an array and hand-writing add/update/remove logic, you store an <strong>entity state</strong> — a normalized <code>{ ids: [], entities: {} }</code> shape — and use an <code>EntityAdapter</code> whose methods (<code>addOne</code>, <code>updateOne</code>, <code>removeOne</code>, <code>setAll</code>, <code>upsertMany</code>) do the immutable updates for you, plus ready-made selectors (<code>selectAll</code>, <code>selectEntities</code>).</p>`,

        `<h2>How it works</h2>`,
        `<p><strong>The effect lifecycle.</strong> An effect is created with <code>createEffect</code> and typically injects <code>Actions</code> (the app-wide action stream) and whatever services it needs. Inside, you pipe the action stream through <code>ofType(SomeAction)</code> to filter for the actions you care about, then a <strong>flattening operator</strong> that maps each action to an inner observable (the HTTP call), then <code>map</code> to a success action and <code>catchError</code> to a failure action. Because the effect <em>returns</em> an observable of actions, NgRx automatically dispatches whatever it emits. If an effect should <em>not</em> dispatch (e.g. it only logs), you pass <code>{ dispatch: false }</code>.</p>`,
        `<p><strong>Why the flattening operator is the whole game.</strong> Each incoming action produces an inner observable, and you have to decide what happens when actions overlap. This is pure RxJS, and it is the single most common effects interview trap:</p>`,
        `<ul>`,
        `<li><strong><code>switchMap</code></strong> cancels the previous inner observable when a new action arrives. Perfect for <em>type-ahead search</em> and any "only the latest matters" load — an in-flight request for stale input is aborted.</li>`,
        `<li><strong><code>concatMap</code></strong> queues inner observables and runs them one at a time in order. Correct for <em>writes that must not reorder</em> — sequential saves, ordered mutations.</li>`,
        `<li><strong><code>mergeMap</code></strong> runs all inner observables concurrently with no ordering guarantee. Fine for independent, order-agnostic work, but dangerous for anything where order or cancellation matters.</li>`,
        `<li><strong><code>exhaustMap</code></strong> ignores new actions while an inner observable is still running. Ideal for <em>login/submit</em> — it swallows double-clicks so you don't fire the same request twice.</li>`,
        `</ul>`,
        `<p><strong>catchError placement.</strong> The classic bug: if you put <code>catchError</code> on the <em>outer</em> stream, one error completes the entire effect and it never runs again. You must place <code>catchError</code> on the <em>inner</em> observable (inside the flattening operator) so a single failed request is contained and the effect keeps listening for future actions.</p>`,
        `{{fig:ch10-selectors-memo.svg|Memoized selector recomputation|createSelector combines input selectors and returns a cached result unless one of its inputs changed by reference.}}`,
        `<p><strong>Selector memoization at runtime.</strong> When you call a selector, it compares its current input values to the ones from last call using reference equality. If all inputs are identical references, it skips the projector entirely and returns the memoized output — so an unrelated part of the store changing does <em>not</em> trigger a recompute. This is why immutable reducers matter: they keep unchanged slices reference-stable, which lets selectors cache aggressively. Note the default cache size is one, so a selector with arguments (a factory selector like <code>selectUserById(id)</code>) needs care to avoid cache thrashing.</p>`,
        `<p><strong>@ngrx/entity mechanics.</strong> <code>createEntityAdapter</code> gives you an adapter with an <code>getInitialState()</code> and a family of immutable update methods you call inside reducers. It also provides <code>getSelectors()</code>, which hands you <code>selectAll</code>, <code>selectEntities</code>, <code>selectIds</code>, and <code>selectTotal</code> over the normalized shape. Because lookups are by id in an object map, reading a single entity is O(1) instead of an O(n) array scan, and updates never rewrite the whole array.</p>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. A load effect with the right operators and inner <code>catchError</code> (v17+).</strong></p>`,
        `<pre><code class="language-typescript">import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { UserActions } from './user.actions';
import { UserApi } from './user.api';

export const loadUsers$ = createEffect(
  (actions$ = inject(Actions), api = inject(UserApi)) =&gt;
    actions$.pipe(
      ofType(UserActions.load),
      switchMap(() =&gt;                       // latest-only: cancels stale loads
        api.getAll().pipe(
          map((users) =&gt; UserActions.loadSuccess({ users })),
          catchError((err) =&gt; of(UserActions.loadFailure({ error: err.message }))),
        ),                                    // catchError INSIDE — effect survives
      ),
    ),
  { functional: true },
);</code></pre>`,
        `<p><strong>2. Choosing the operator by intent.</strong></p>`,
        `<pre><code class="language-typescript">// Type-ahead search — only the last query matters:
switchMap((action) =&gt; api.search(action.term)...)

// Ordered saves — must not reorder or drop:
concatMap((action) =&gt; api.save(action.payload)...)

// Login submit — ignore double-clicks while one is in flight:
exhaustMap((action) =&gt; api.login(action.creds)...)</code></pre>`,
        `<p><strong>3. @ngrx/entity — a normalized collection reducer.</strong></p>`,
        `<pre><code class="language-typescript">import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { UserActions } from './user.actions';

export interface User { id: string; name: string; }
export interface UsersState extends EntityState&lt;User&gt; { loading: boolean; }

export const adapter = createEntityAdapter&lt;User&gt;();
const initialState: UsersState = adapter.getInitialState({ loading: false });

export const usersReducer = createReducer(
  initialState,
  on(UserActions.load, (s) =&gt; ({ ...s, loading: true })),
  on(UserActions.loadSuccess, (s, { users }) =&gt;
    adapter.setAll(users, { ...s, loading: false })),   // immutable, normalized
  on(UserActions.updateOne, (s, { update }) =&gt;
    adapter.updateOne(update, s)),                       // { id, changes }
  on(UserActions.removeOne, (s, { id }) =&gt; adapter.removeOne(id, s)),
);</code></pre>`,
        `<p><strong>4. Entity selectors + a composed, memoized derived selector.</strong></p>`,
        `<pre><code class="language-typescript">import { createFeature, createSelector } from '@ngrx/store';
import { adapter, usersReducer } from './users.reducer';

export const usersFeature = createFeature({
  name: 'users',
  reducer: usersReducer,
  extraSelectors: ({ selectUsersState }) =&gt; ({
    ...adapter.getSelectors(selectUsersState), // selectAll, selectEntities, ...
  }),
});

export const selectActiveUserNames = createSelector(
  usersFeature.selectAll,
  (users) =&gt; users.map((u) =&gt; u.name).sort(), // recomputes only when list changes
);</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Putting <code>catchError</code> on the outer stream.</strong> One error then kills the effect forever — it completes and stops listening. Keep <code>catchError</code> inside the flattening operator so failures are per-request.</li>`,
        `<li><strong>Using <code>mergeMap</code> for search or ordered writes.</strong> No cancellation and no ordering means stale search results can arrive last and win, and saves can land out of order. Use <code>switchMap</code> for latest-only, <code>concatMap</code> for ordered.</li>`,
        `<li><strong>Forgetting effects can loop.</strong> An effect that listens for action A and dispatches A (directly or transitively) creates an infinite loop. Effects should dispatch <em>different</em> result actions.</li>`,
        `<li><strong>Doing state updates inside effects.</strong> Effects should dispatch actions, not reach into the store to mutate it. The reducer owns state; the effect owns the side effect.</li>`,
        `<li><strong>Selectors with arguments thrashing the cache.</strong> A factory selector called with many different ids blows the default cache size of one, recomputing every time. Use a parameterized/props selector pattern or memoize per-id deliberately.</li>`,
        `<li><strong>Doing heavy work in an inline <code>store.select(fn)</code>.</strong> That is unmemoized and re-runs on every emission. Move it into <code>createSelector</code>.</li>`,
        `<li><strong>Hand-rolling collection reducers.</strong> Manually writing add/update/remove array logic is verbose and easy to get wrong (accidental mutation, O(n) scans). @ngrx/entity does it correctly and fast.</li>`,
        `<li><strong>Forgetting <code>{ dispatch: false }</code> for non-dispatching effects.</strong> A logging or navigation-only effect that returns a non-action observable without this flag will try to dispatch garbage.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Pick the flattening operator by intent:</strong> <code>switchMap</code> for latest-only reads, <code>concatMap</code> for ordered writes, <code>exhaustMap</code> for submit/login, <code>mergeMap</code> only when order truly doesn't matter.</li>`,
        `<li><strong>Always nest <code>catchError</code> inside the inner observable</strong> so one failure doesn't tear down the effect, and map errors to explicit failure actions.</li>`,
        `<li><strong>Keep effects thin:</strong> action in → side effect → action out. No state mutation, no business logic that belongs in a service.</li>`,
        `<li><strong>Build small, composable selectors</strong> and derive larger ones from them so memoization caches at every layer.</li>`,
        `<li><strong>Use @ngrx/entity for every non-trivial collection</strong> — normalized shape, O(1) lookups, correct immutable updates, and free selectors.</li>`,
        `<li><strong>Mark non-dispatching effects with <code>{ dispatch: false }</code></strong> and prefer functional effects (v17+) for cleaner, tree-shakable code.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: What is an effect and why do we need it?</strong> Reducers must be pure, so side effects — HTTP, storage, navigation — have nowhere to go inside them. Effects are services that listen to the action stream, perform the impure/async work in response to specific actions, and dispatch a result action. They keep the pure/impure boundary clean: reducers stay deterministic, effects own the mess.</p></blockquote>`,
        `<blockquote><p><strong>Q: switchMap vs concatMap vs exhaustMap vs mergeMap in an effect?</strong> <code>switchMap</code> cancels the previous request — use it for type-ahead and latest-only loads. <code>concatMap</code> queues and preserves order — use it for sequential writes. <code>exhaustMap</code> ignores new triggers while one is running — use it for login/submit to swallow double-clicks. <code>mergeMap</code> runs everything concurrently with no ordering — only safe for independent work. Choosing wrong causes race conditions or duplicate requests.</p></blockquote>`,
        `<blockquote><p><strong>Q: Where does <code>catchError</code> go and why?</strong> Inside the flattening operator, on the inner observable. If it sits on the outer action stream, the first error completes the whole effect and it stops reacting to all future actions. Nesting it contains the failure to a single request and lets the effect keep running.</p></blockquote>`,
        `<blockquote><p><strong>Q: How does selector memoization work, and what breaks it?</strong> <code>createSelector</code> caches the last inputs and output; if inputs are reference-equal, it returns the cached result without recomputing. Reducer mutation breaks it — mutating in place keeps the reference the same so a changed slice looks unchanged, or conversely a needlessly new reference forces recompute. Immutable, minimal reducers are what make selectors efficient.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why use @ngrx/entity?</strong> It stores collections normalized as <code>{ ids, entities }</code>, gives O(1) lookups by id, and provides immutable CRUD methods (<code>addOne</code>, <code>updateOne</code>, <code>setAll</code>) plus selectors (<code>selectAll</code>, <code>selectEntities</code>). It removes the boilerplate and mutation bugs of hand-written array reducers.</p></blockquote>`,
        `<blockquote><p><strong>Q: Can an effect cause an infinite loop?</strong> Yes — if it reacts to an action and dispatches the same action (directly or through a chain). Effects should emit distinct result actions (success/failure), and you should be careful with effects that both listen to and dispatch overlapping action types.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Effect shape:</strong> <code>ofType</code> → flattening operator → <code>map</code> to success / <code>catchError</code> to failure.</li>`,
        `<li><strong>Operators:</strong> switchMap = latest-only (search); concatMap = ordered writes; exhaustMap = submit/login; mergeMap = concurrent/independent.</li>`,
        `<li><strong><code>catchError</code> goes INSIDE</strong> the inner observable or the effect dies on first error.</li>`,
        `<li><strong>Effects dispatch actions</strong>, never mutate state. Use <code>{ dispatch: false }</code> for side-only effects.</li>`,
        `<li><strong>Selectors:</strong> <code>createSelector</code> memoizes on reference-equal inputs; compose small → large.</li>`,
        `<li><strong>@ngrx/entity:</strong> <code>createEntityAdapter</code> → normalized <code>{ids, entities}</code>, CRUD methods, <code>getSelectors()</code>.</li>`,
        `<li>Immutable reducers = fast selectors + O(1) entity lookups.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    {
      title: 'SignalStore (@ngrx/signals)',
      slug: 'signalstore',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>SignalStore, from the <code>@ngrx/signals</code> package, is the most important recent development in Angular state management. It takes the good ideas from Redux/NgRx — a well-defined store, immutable updates through a single path, derived state — and rebuilds them on top of <strong>signals instead of RxJS and reducers</strong>, eliminating almost all the boilerplate. No actions, no reducer files, no manual subscriptions. A store becomes a few composable functions, and everything it exposes is a signal you read directly in templates. For interviews in 2025+, being able to compare SignalStore with classic NgRx Store — and knowing when each wins — signals that you are current with where the framework is going.</p>`,
        `<p>The reason this matters practically is that SignalStore hits the sweet spot the old ecosystem struggled with. Classic NgRx was powerful but heavy; a plain signal service was light but lacked structure and conventions. SignalStore gives you structure <em>and</em> low ceremony: a declarative, feature-based API that scales from a tiny component-scoped store to a full application store, with an extensible plugin system (<code>withEntities</code>, custom features) for when you need more. It is the default many teams now reach for, and understanding its reactivity model — how <code>patchState</code> updates flow to <code>withComputed</code> and templates — is core knowledge.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>A SignalStore is built by calling <code>signalStore(...features)</code>, which returns an injectable class. You assemble it from <strong>features</strong>, each contributing something to the store: <code>withState</code> declares the initial state (each property becomes a signal); <code>withComputed</code> adds derived signals memoized from state; <code>withMethods</code> adds functions that read state and update it; and <code>withHooks</code> adds lifecycle callbacks (<code>onInit</code>, <code>onDestroy</code>). The store is a service — you <code>inject()</code> it and read its signals directly.</p>`,
        `{{fig:ch10-signalstore.svg|SignalStore composed from features|signalStore assembles withState, withComputed, withMethods and withHooks into one reactive store whose only mutation path is patchState.}}`,
        `<p>The one and only way to change state is <code>patchState(store, partial)</code> (or an updater function). It performs an <strong>immutable merge</strong> — you never mutate state in place. When you patch, the affected state signals update, any <code>computed</code> that depends on them re-derives, and any template reading those signals re-renders. That is the entire reactivity story: signals in, signals out, one immutable update function in the middle.</p>`,
        `<p>Think of it as "Redux principles, signal mechanics." You keep a single source of truth, immutable updates, and derived state — but you drop actions, reducers, and the RxJS plumbing. Where a classic feature needed an actions file, a reducer file, a selectors file, and effects, a SignalStore is often a single, readable declaration.</p>`,

        `<h2>How it works</h2>`,
        `<p><strong>Feature composition.</strong> <code>signalStore</code> takes a list of features and merges their contributions into one store instance. Order matters: a feature can see what earlier features exposed. So <code>withComputed</code> and <code>withMethods</code> receive the <em>store so far</em> as an argument, letting a computed read state signals and a method read both state and computed values. This left-to-right composition is how the pieces wire together without a central schema.</p>`,
        `<p><strong>withState.</strong> You pass an object describing the initial state. SignalStore turns each top-level property into a <code>DeepSignal</code> — you read <code>store.count()</code> as a signal, and nested objects become nested signals too. The state is deeply readonly from the outside; the only writer is <code>patchState</code>.</p>`,
        `<p><strong>withComputed.</strong> You return an object of <code>computed()</code> signals derived from the store's state signals. These are memoized: a computed only recomputes when a signal it reads changes. This is the SignalStore analogue of NgRx selectors, but wired automatically through signal dependency tracking rather than manual input-selector lists.</p>`,
        `<p><strong>withMethods.</strong> You return an object of functions. Inside, you call <code>patchState(store, ...)</code> to update state, read <code>store.someSignal()</code> for current values, and use <code>inject()</code> for dependencies (an HTTP client, a router) because <code>withMethods</code> runs in an injection context. For async work, methods commonly use <code>rxMethod</code> (a bridge to RxJS that lets you use flattening operators like <code>switchMap</code> and still <code>patchState</code> on results) — so effects-style orchestration is available when you need it, without a separate effects layer.</p>`,
        `<p><strong>patchState flow.</strong> When a method calls <code>patchState(store, { count: 5 })</code> or <code>patchState(store, (s) =&gt; ({ count: s.count + 1 }))</code>, SignalStore computes the next state by immutable merge and sets the underlying state signals. Signal reactivity does the rest: dependent computeds re-derive lazily on next read, and any component template reading those signals is marked dirty and re-renders under OnPush — no <code>markForCheck</code>, no subscription. This is the same fine-grained reactivity you get from plain signals, just organized behind a store facade.</p>`,
        `<p><strong>Providing and scoping.</strong> By default a SignalStore is <code>providedIn: 'root'</code> (a singleton), but you can pass <code>{ providedIn: 'root' }</code> off and instead list it in a component's or route's <code>providers</code> to get a <strong>component-scoped</strong> store that is created and destroyed with that component — impossible with classic NgRx's single global store, and a major reason SignalStore fits local-but-structured state so well. <code>withHooks</code>' <code>onInit</code>/<code>onDestroy</code> then bracket that lifecycle.</p>`,
        `<p><strong>withEntities.</strong> The signals package ships an entity plugin: <code>withEntities</code> plus updaters like <code>setAllEntities</code>, <code>addEntity</code>, <code>updateEntity</code>, <code>removeEntity</code>, giving you the normalized collection management of @ngrx/entity inside a SignalStore.</p>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. A complete counter SignalStore.</strong> State, derived value, and methods in one declaration.</p>`,
        `<pre><code class="language-typescript">import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { computed } from '@angular/core';

export const CounterStore = signalStore(
  { providedIn: 'root' },
  withState({ count: 0, step: 1 }),
  withComputed(({ count }) =&gt; ({
    doubled: computed(() =&gt; count() * 2),
    isZero: computed(() =&gt; count() === 0),
  })),
  withMethods((store) =&gt; ({
    increment() { patchState(store, (s) =&gt; ({ count: s.count + s.step })); },
    reset() { patchState(store, { count: 0 }); },
    setStep(step: number) { patchState(store, { step }); },
  })),
);</code></pre>`,
        `<p><strong>2. Consuming it in a component — signals read directly, OnPush.</strong></p>`,
        `<pre><code class="language-typescript">import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CounterStore } from './counter.store';

@Component({
  selector: 'app-counter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    &lt;p&gt;Count {{ store.count() }} — doubled {{ store.doubled() }}&lt;/p&gt;
    &lt;button (click)="store.increment()"&gt;+&lt;/button&gt;
    &lt;button (click)="store.reset()" [disabled]="store.isZero()"&gt;reset&lt;/button&gt;
  \`,
})
export class CounterComponent {
  protected readonly store = inject(CounterStore);
}</code></pre>`,
        `<p><strong>3. Async loading with <code>rxMethod</code> — effects-style orchestration, no reducers.</strong></p>`,
        `<pre><code class="language-typescript">import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject } from '@angular/core';
import { switchMap, tap, pipe } from 'rxjs';
import { UserApi } from './user.api';

export const UsersStore = signalStore(
  withState({ users: [] as { id: string; name: string }[], loading: false }),
  withMethods((store, api = inject(UserApi)) =&gt; ({
    load: rxMethod&lt;void&gt;(
      pipe(
        tap(() =&gt; patchState(store, { loading: true })),
        switchMap(() =&gt;                       // latest-only, like an effect
          api.getAll().pipe(
            tap((users) =&gt; patchState(store, { users, loading: false })),
          ),
        ),
      ),
    ),
  })),
);</code></pre>`,
        `<p><strong>4. A component-scoped store with entities and a lifecycle hook.</strong></p>`,
        `<pre><code class="language-typescript">import { signalStore, withMethods, withHooks, patchState } from '@ngrx/signals';
import { withEntities, setAllEntities, addEntity } from '@ngrx/signals/entities';

interface Todo { id: string; title: string; done: boolean; }

export const TodosStore = signalStore(
  withEntities&lt;Todo&gt;(),                    // adds entities()/entityMap() signals
  withMethods((store) =&gt; ({
    seed(todos: Todo[]) { patchState(store, setAllEntities(todos)); },
    add(todo: Todo) { patchState(store, addEntity(todo)); },
  })),
  withHooks({ onInit(store) { /* e.g. store.seed(initial) */ } }),
);
// Provide it at a component/route so it lives and dies with that view:
// @Component({ providers: [TodosStore], ... })</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Trying to mutate state directly.</strong> Reaching into a signal and setting it, or mutating a nested object, bypasses the store contract. The only writer is <code>patchState</code> (or store methods that call it) — and it must produce a new, immutable state.</li>`,
        `<li><strong>Mutating inside a <code>patchState</code> updater.</strong> <code>patchState(store, s =&gt; { s.items.push(x); return s; })</code> mutates the existing array. Return new references: <code>{ items: [...s.items, x] }</code>.</li>`,
        `<li><strong>Expecting <code>withComputed</code> to see later features.</strong> Composition is left to right; a computed can only depend on state/features declared before it. Order your features accordingly.</li>`,
        `<li><strong>Calling <code>inject()</code> outside the injection context.</strong> <code>withMethods</code> and <code>withComputed</code> factories run in an injection context, so <code>inject()</code> works there — but not inside a nested callback that runs later. Capture dependencies at factory time.</li>`,
        `<li><strong>Making everything a root singleton.</strong> Some stores are inherently view-local (a form wizard). Provide them at the component/route level so they reset per instance instead of leaking state between visits.</li>`,
        `<li><strong>Reaching for <code>rxMethod</code> when a plain async method would do.</strong> If you don't need flattening/cancellation semantics, an async method calling <code>patchState</code> is simpler. Use <code>rxMethod</code> when you specifically want switchMap/concatMap-style behavior.</li>`,
        `<li><strong>Forgetting SignalStore state is deeply readonly outside.</strong> You cannot assign to <code>store.count</code>; you read <code>store.count()</code> and write via <code>patchState</code>.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Model each store as composed features:</strong> <code>withState</code> for the source of truth, <code>withComputed</code> for derived data, <code>withMethods</code> for behavior, <code>withHooks</code> for lifecycle. Keep state minimal and derive the rest.</li>`,
        `<li><strong>Update only through <code>patchState</code> with immutable partials/updaters,</strong> so the single-mutation-path guarantee holds and computeds/templates react correctly.</li>`,
        `<li><strong>Scope stores intentionally:</strong> <code>providedIn: 'root'</code> for app-wide state, component/route <code>providers</code> for view-local state that should reset per instance.</li>`,
        `<li><strong>Use <code>rxMethod</code> for async orchestration</strong> when you need flattening operators (search, ordered writes), and plain async methods otherwise.</li>`,
        `<li><strong>Use <code>withEntities</code> for collections</strong> to get normalized storage and CRUD updaters without hand-rolling array logic.</li>`,
        `<li><strong>Prefer SignalStore over classic NgRx</strong> for new features unless you specifically need the Redux action log, DevTools time-travel, or an established large NgRx codebase's conventions.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: How is SignalStore different from classic NgRx Store?</strong> SignalStore is built on signals, not RxJS + reducers. It drops actions, reducers, and selectors in favor of composable features (<code>withState</code>/<code>withComputed</code>/<code>withMethods</code>) and a single <code>patchState</code> mutation path. It has far less boilerplate, exposes signals you read directly (OnPush-friendly, no subscriptions), and can be component-scoped. Classic Store still wins when you need the serializable action log, DevTools time-travel, and strict event-sourcing across many teams.</p></blockquote>`,
        `<blockquote><p><strong>Q: What is <code>patchState</code> and why is it the only way to update?</strong> It performs an immutable merge into the store's state signals. Making it the sole writer preserves the single-source-of-truth and single-mutation-path guarantees, and immutability is what lets dependent computeds and templates reliably detect changes. Direct mutation would bypass reactivity and the store contract.</p></blockquote>`,
        `<blockquote><p><strong>Q: How does reactivity flow through a SignalStore?</strong> <code>patchState</code> updates state signals → any <code>withComputed</code> depending on them re-derives lazily → any template reading those signals is marked dirty and re-renders under OnPush. It's ordinary signal dependency tracking, just organized behind the store — no manual selectors or subscriptions.</p></blockquote>`,
        `<blockquote><p><strong>Q: Can a SignalStore handle side effects like NgRx effects?</strong> Yes, via <code>rxMethod</code> from the rxjs-interop, which lets a method pipe through flattening operators (<code>switchMap</code>, <code>concatMap</code>, <code>exhaustMap</code>) and <code>patchState</code> on results — the same operator-choice discipline as classic effects, but colocated in the store rather than a separate effects class.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why does feature order matter?</strong> Features compose left to right; each receives the store built so far. A <code>withComputed</code> or <code>withMethods</code> can only reference state and features declared before it. So <code>withState</code> comes first, then computeds/methods that build on it.</p></blockquote>`,
        `<blockquote><p><strong>Q: When would you scope a store to a component instead of root?</strong> When the state is inherently per-instance and should reset — a form wizard, a modal's draft, an editor tab. Listing the store in the component's <code>providers</code> ties its lifetime to that component, so each instance gets fresh state and it's torn down on destroy.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Build:</strong> <code>signalStore(withState, withComputed, withMethods, withHooks)</code> → injectable service.</li>`,
        `<li><strong>withState</strong> = initial state (each prop a signal); <strong>withComputed</strong> = derived memoized signals; <strong>withMethods</strong> = behavior; <strong>withHooks</strong> = onInit/onDestroy.</li>`,
        `<li><strong>patchState(store, partial | updater)</strong> — the ONLY mutation path, immutable merge.</li>`,
        `<li>Reactivity: patchState → computeds re-derive → templates re-render (OnPush, no subscriptions).</li>`,
        `<li><strong>Async:</strong> <code>rxMethod</code> for switchMap/concatMap orchestration inside a method.</li>`,
        `<li><strong>Collections:</strong> <code>withEntities</code> + <code>setAllEntities</code>/<code>addEntity</code>/<code>updateEntity</code>.</li>`,
        `<li><strong>Scope:</strong> <code>providedIn:'root'</code> (global) or component/route <code>providers</code> (per-instance).</li>`,
        `<li>vs NgRx: less boilerplate, signal-native; NgRx wins for action log + time-travel.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    {
      title: 'Services with Signals as a Store',
      slug: 'services-with-signals',
      order: 4,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Before you reach for any library, there is a pattern that handles the majority of real-world shared state with zero dependencies: an ordinary Angular service that holds signals and exposes them read-only, mutating through methods. This "service-with-signals store" is the pragmatic default the Angular team itself recommends for most apps, and it is a favorite interview topic precisely because it tests whether you understand that <em>state management is a pattern, not a package</em>. A candidate who can implement a clean, encapsulated store with nothing but <code>signal</code>, <code>computed</code>, and an injectable service demonstrates deeper understanding than one who can only wire up NgRx.</p>`,
        `<p>This pattern matters because it hits a genuine sweet spot: it is shared (via DI singletons), reactive and fine-grained (via signals), OnPush- and zoneless-ready, and free of subscriptions, boilerplate, and third-party APIs. For a huge class of apps — a cart, a user session, a theme, a feature's UI state — it is not a compromise; it is the <em>correct</em> choice, and adding NgRx would be over-engineering. Knowing exactly when this pattern beats NgRx, and how to build it well (encapsulation, readonly exposure, derived state), is essential senior-level knowledge.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>The pattern is small. You create an <code>@Injectable({ providedIn: 'root' })</code> service. Inside, you declare <strong>private writable signals</strong> for the state, expose them to the outside as <strong>read-only</strong> (via <code>.asReadonly()</code> or public <code>computed</code>s), add <strong>computed</strong> signals for anything derived, and provide <strong>public methods</strong> that are the only way to change the state. Any component injects the service and reads its signals directly in the template; when a method updates a signal, every consumer reactively re-renders.</p>`,
        `{{fig:ch10-service-signals.svg|A service-with-signals store shared across components|A root-provided service holds private signals, exposes read-only signals and computeds, and every injecting component shares the one instance.}}`,
        `<p>The three rules that make it a real store rather than a bag of loose signals: <strong>(1) encapsulate</strong> — writable signals are private, so no component can bypass the intended update path; <strong>(2) expose read-only</strong> — consumers get signals they can read but not set; <strong>(3) mutate through methods</strong> — all changes go through named methods that can enforce invariants. This gives you the single-source-of-truth and single-mutation-path guarantees that Redux is famous for, without any of Redux's machinery.</p>`,
        `<p>DI provides the "sharing." Because the service is a singleton (or scoped to a route), every component that injects it gets the <em>same</em> instance and therefore the same reactive state — the header badge and the cart page read one shared <code>count</code>. That is the whole "store" mechanism: a shared object of signals handed out by the injector.</p>`,

        `<h2>How it works</h2>`,
        `<p><strong>Signals as the reactive core.</strong> Each private <code>signal()</code> holds a piece of state. Reading it in a template registers that view as a consumer; calling <code>.set()</code> or <code>.update()</code> in a method notifies all consumers. Because signals are fine-grained, only components that actually read a changed signal re-render — a component reading only <code>total</code> won't re-render when an unrelated signal changes. This is strictly better than a <code>BehaviorSubject</code> service for change detection, and it needs no <code>async</code> pipe and no unsubscription.</p>`,
        `<p><strong>Encapsulation via readonly.</strong> The trick that turns signals into a store is hiding the writers. A public <code>readonly items = this._items.asReadonly()</code> hands out a signal whose <code>set</code>/<code>update</code> methods are not exposed — consumers can call <code>items()</code> to read but cannot mutate. All writes funnel through the service's own methods (<code>add</code>, <code>remove</code>, <code>clear</code>), which is where you validate input, enforce limits, or coordinate related signals. This is exactly the "single mutation path" NgRx enforces with actions, achieved with method encapsulation instead.</p>`,
        `<p><strong>Derived state with computed.</strong> Anything you can calculate from existing state should be a <code>computed()</code>, not a stored signal. <code>count</code> and <code>total</code> derive from <code>items</code>; they recompute automatically and memoize, so they only recalculate when <code>items</code> changes and only when someone reads them. This keeps a single source of truth (the raw <code>items</code>) and prevents the drift you get from storing derived values separately.</p>`,
        `<p><strong>Immutability still matters.</strong> Even without NgRx, you should update signals immutably — <code>this._items.update(xs =&gt; [...xs, item])</code> rather than <code>xs.push(item)</code>. Signals compare with <code>Object.is</code> by default, so a mutated-in-place array is the same reference and won't notify consumers. New references are what make the reactivity fire and keep OnPush children correct. (For value objects you can supply a custom <code>equal</code> function, but the default reference check is why immutable updates are the norm.)</p>`,
        `<p><strong>Async and lifetime.</strong> The service can inject <code>HttpClient</code> and do async work in its methods, setting a <code>loading</code> signal and patching results — no effects layer needed for simple cases. For lifetime control, <code>providedIn: 'root'</code> gives an app-long singleton; listing the service in a lazy route's <code>providers</code> scopes it to that feature so its state is created and destroyed with the feature. This is the same scoping flexibility SignalStore offers, done with plain DI.</p>`,
        `<p><strong>When it beats NgRx.</strong> This pattern wins whenever the state is shared but the flows are simple: no need for a serializable action log, no complex multi-step effect orchestration, no army of teams needing a rigid contract. That describes most application state. NgRx starts to pay off only when you genuinely need time-travel debugging, event sourcing, or heavy coordinated side effects — at which point the boilerplate buys something. Below that threshold, the signal service is less code, easier to read, and just as correct.</p>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. A well-encapsulated signal store service.</strong> Private writers, readonly + computed exposure, method-only mutation.</p>`,
        `<pre><code class="language-typescript">import { Injectable, computed, signal } from '@angular/core';

export interface CartLine { id: string; name: string; price: number; qty: number; }

@Injectable({ providedIn: 'root' })
export class CartStore {
  // 1) private writable state
  private readonly _lines = signal&lt;CartLine[]&gt;([]);

  // 2) public read-only views
  readonly lines = this._lines.asReadonly();
  readonly count = computed(() =&gt; this._lines().reduce((n, l) =&gt; n + l.qty, 0));
  readonly total = computed(() =&gt; this._lines().reduce((s, l) =&gt; s + l.qty * l.price, 0));
  readonly isEmpty = computed(() =&gt; this._lines().length === 0);

  // 3) mutations only through methods (immutable updates)
  add(line: CartLine) {
    this._lines.update((ls) =&gt; {
      const found = ls.find((l) =&gt; l.id === line.id);
      return found
        ? ls.map((l) =&gt; l.id === line.id ? { ...l, qty: l.qty + line.qty } : l)
        : [...ls, line];
    });
  }
  remove(id: string) { this._lines.update((ls) =&gt; ls.filter((l) =&gt; l.id !== id)); }
  clear() { this._lines.set([]); }
}</code></pre>`,
        `<p><strong>2. Two unrelated components sharing the one instance.</strong></p>`,
        `<pre><code class="language-typescript">import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CartStore } from './cart.store';

@Component({
  selector: 'app-cart-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`&lt;span class="badge"&gt;{{ cart.count() }}&lt;/span&gt;\`,
})
export class CartBadgeComponent {
  protected readonly cart = inject(CartStore); // same singleton as the cart page
}</code></pre>`,
        `<p><strong>3. Async loading inside the service — no separate effects layer.</strong></p>`,
        `<pre><code class="language-typescript">import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ProductsStore {
  private http = inject(HttpClient);
  private readonly _items = signal&lt;Product[]&gt;([]);
  private readonly _loading = signal(false);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly hasItems = computed(() =&gt; this._items().length &gt; 0);

  async load() {
    this._loading.set(true);
    try {
      const items = await firstValueFrom(this.http.get&lt;Product[]&gt;('/api/products'));
      this._items.set(items);              // new reference — consumers react
    } finally {
      this._loading.set(false);
    }
  }
}</code></pre>`,
        `<p><strong>4. Feature-scoped state via route providers.</strong> The store lives and dies with the lazy feature.</p>`,
        `<pre><code class="language-typescript">// wizard.routes.ts — NOT providedIn:'root'
import { Routes } from '@angular/router';
import { WizardStore } from './wizard.store';

export const wizardRoutes: Routes = [
  {
    path: '',
    providers: [WizardStore],   // fresh instance per navigation into the feature
    loadComponent: () =&gt; import('./wizard.component').then((m) =&gt; m.WizardComponent),
  },
];
// Inside WizardStore: @Injectable() with NO providedIn, so scope comes from the route.</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Exposing the writable signal.</strong> A public <code>items = signal([])</code> lets any component call <code>items.set(...)</code> from anywhere, destroying the single-mutation-path guarantee. Keep writers private; expose <code>asReadonly()</code>.</li>`,
        `<li><strong>Mutating signal values in place.</strong> <code>this._items().push(x)</code> mutates the existing array; the reference is unchanged so <code>Object.is</code> sees no change and nothing updates. Always set/return a new reference.</li>`,
        `<li><strong>Storing derived state.</strong> Keeping <code>count</code> as its own signal next to <code>items</code> invites drift — update one, forget the other. Derive it with <code>computed()</code> from the single source of truth.</li>`,
        `<li><strong>Assuming a non-root service is shared app-wide.</strong> Provide it at a component or route and each instance gets its own state. That's a feature, not a bug — but know which scope you chose.</li>`,
        `<li><strong>Reaching for NgRx out of habit.</strong> If the flows are simple and shared, this pattern is the right tool; adding a store library is over-engineering that buys nothing.</li>`,
        `<li><strong>Recreating RxJS subscription management needlessly.</strong> Signals don't need <code>async</code> pipe or unsubscription. Mixing in <code>BehaviorSubject</code> where a signal suffices adds ceremony and leak risk.</li>`,
        `<li><strong>Doing complex effect orchestration in ad-hoc methods.</strong> If you truly need cancellation/queuing across many async flows, that's the signal that either <code>rxMethod</code> in a SignalStore or full NgRx effects would serve you better.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Encapsulate:</strong> private writable signals, public read-only signals and computeds, mutation only through named methods. That is what makes it a store.</li>`,
        `<li><strong>Keep one source of truth</strong> and derive everything else with <code>computed()</code> — never store what you can compute.</li>`,
        `<li><strong>Update immutably</strong> (<code>update(xs =&gt; [...xs, item])</code>) so reference changes fire reactivity and keep OnPush children correct.</li>`,
        `<li><strong>Choose scope deliberately:</strong> <code>providedIn: 'root'</code> for app-wide state, route/component <code>providers</code> for feature-local state that should reset.</li>`,
        `<li><strong>Do simple async in the service</strong> with a <code>loading</code> signal; escalate to <code>rxMethod</code>/effects only when you need flattening/cancellation.</li>`,
        `<li><strong>Reach for this pattern first.</strong> Adopt SignalStore when you want its conventions/plugins, and NgRx only when you need the action log, time-travel, or heavy coordinated effects.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: How do you build a store without any library?</strong> An injectable service holding private writable signals, exposing them read-only via <code>asReadonly()</code> and <code>computed()</code>, with all mutations behind public methods. DI shares the singleton across components, signals provide fine-grained reactivity, and encapsulation gives you a single source of truth and single mutation path — the core guarantees of a store, no package required.</p></blockquote>`,
        `<blockquote><p><strong>Q: When does a signal service beat NgRx?</strong> Whenever state is shared but the flows are simple — no serializable action log needed, no complex coordinated side effects, no cross-team rigid contract. That covers most app state (cart, session, theme, feature UI). NgRx earns its boilerplate only for time-travel debugging, event sourcing, and heavy effect orchestration; below that, the service is less code and just as correct.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you prevent components from mutating state directly?</strong> Encapsulation. Writable signals are private; the public surface is <code>asReadonly()</code> signals and <code>computed</code>s that can be read but not set. Every change goes through a method where you enforce invariants. A component literally has no handle to call <code>set</code> on the state.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why still update immutably if there's no reducer?</strong> Signals compare with <code>Object.is</code>. Mutating an array/object in place keeps the same reference, so the signal sees no change and consumers (including OnPush children reading it as an input) don't update. New references are what make the reactivity fire.</p></blockquote>`,
        `<blockquote><p><strong>Q: How is this different from an RxJS <code>BehaviorSubject</code> service?</strong> Signals are synchronous, fine-grained, and need no subscription or <code>async</code> pipe — reading one in a template is itself the change-detection trigger under OnPush/zoneless. A <code>BehaviorSubject</code> service works but adds subscription management and leak risk, and re-renders more coarsely. Signals are the modern default for this pattern.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you scope this state to a single feature?</strong> Drop <code>providedIn: 'root'</code> and list the service in a lazy route's or component's <code>providers</code>. Then each entry into that feature gets a fresh instance, and the state is destroyed when the feature is torn down — feature-scoped state with plain DI.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Pattern:</strong> injectable service + private <code>signal</code> writers + public <code>asReadonly()</code>/<code>computed</code> + mutation methods.</li>`,
        `<li><strong>Three rules:</strong> encapsulate (private writers), expose read-only, mutate through methods.</li>`,
        `<li><strong>DI shares</strong> the singleton; signals give fine-grained, subscription-free reactivity.</li>`,
        `<li><strong>Derive</strong> with <code>computed()</code>; keep one source of truth; update <strong>immutably</strong>.</li>`,
        `<li><strong>Scope:</strong> <code>providedIn:'root'</code> (app) vs route/component <code>providers</code> (feature-local).</li>`,
        `<li><strong>Beats NgRx</strong> when state is shared but flows are simple — most app state.</li>`,
        `<li>Escalate to SignalStore (conventions/plugins) or NgRx (action log, time-travel, heavy effects) only when needed.</li>`,
        `</ul>`,
      ].join('\n'),
    },
  ],
};
