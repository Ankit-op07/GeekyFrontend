module.exports = {
  title: 'RxJS & Reactive Programming',
  slug: 'rxjs-reactive',
  order: 4,
  topics: [
    {
      title: 'Observables vs Promises',
      slug: 'observables-vs-promises',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Angular is built <em>on top of</em> RxJS, not merely shipped with it. <code>HttpClient</code> returns Observables, the router exposes Observables (<code>params</code>, <code>queryParams</code>, <code>data</code>), reactive forms expose <code>valueChanges</code> and <code>statusChanges</code>, and the classic <code>EventEmitter</code> is a thin wrapper over a <code>Subject</code>. If your mental model is "an Observable is just a Promise you have to subscribe to," you will fight the framework on every route change and every keystroke of a typeahead. This is the single most common "does this candidate actually understand Angular?" filter in interviews.</p>`,
        `<p>The trap is subtle. Both look async, both can carry a value, both have error paths. But they differ on four axes that decide real behaviour: <strong>laziness</strong>, <strong>cardinality</strong>, <strong>cancellation</strong>, and <strong>multiplicity of execution</strong>. Getting any of these wrong produces bugs that are hard to spot in review and embarrassing to explain in an interview.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>A <strong>Promise</strong> represents a single future value that is <em>already being computed</em>. The moment you construct it, the work starts; the result is cached and delivered once. An <strong>Observable</strong> represents a stream of zero-to-many values over time, and it is a <em>blueprint</em> that does nothing until someone subscribes — and it re-runs that blueprint for every subscriber.</p>`,
        `{{fig:ch5-observable-vs-promise.svg|Timeline comparing an eager one-shot Promise with a lazy multi-value Observable|A Promise fires on creation and resolves once; an Observable runs on subscribe and can emit many values before completing.}}`,
        `<table>`,
        `<thead><tr><th>Aspect</th><th>Promise</th><th>Observable</th></tr></thead>`,
        `<tbody>`,
        `<tr><td>Eager vs lazy</td><td><strong>Eager</strong> — runs when created</td><td><strong>Lazy</strong> — runs on <code>.subscribe()</code></td></tr>`,
        `<tr><td>Values</td><td>Exactly <strong>one</strong> (or one error)</td><td><strong>Zero to many</strong> over time</td></tr>`,
        `<tr><td>Cancellation</td><td>Not cancellable</td><td>Cancellable via <code>unsubscribe()</code></td></tr>`,
        `<tr><td>Execution per consumer</td><td>Shared — one run, cached</td><td>Re-runs producer per subscriber (if cold)</td></tr>`,
        `<tr><td>Operators</td><td><code>.then</code>/<code>.catch</code>/<code>.finally</code></td><td>100+ pipeable operators</td></tr>`,
        `<tr><td>Sync or async</td><td>Always async (microtask)</td><td>Can emit synchronously or asynchronously</td></tr>`,
        `<tr><td>Interop</td><td><code>await</code>, <code>.then</code></td><td><code>firstValueFrom()</code>/<code>lastValueFrom()</code> to bridge</td></tr>`,
        `</tbody>`,
        `</table>`,
        `<p>The two most interview-relevant rows are <strong>laziness</strong> and <strong>cancellation</strong>. A Promise's producer has already started; there is no way to un-fire it. An Observable is inert until subscribed, and unsubscribing tears the producer down.</p>`,
        `<p>A useful one-liner to keep in your head: a Promise is a <em>value</em> that will exist, while an Observable is a <em>function</em> that describes how to produce values when asked. That is why you can pass an Observable around, compose it with operators, and subscribe to it many times, but you can only <code>await</code> a Promise's single settled result. Everything else — cancellation, multi-value, cold re-execution — follows from "function you invoke" versus "value already in flight."</p>`,

        `<h2>How it works</h2>`,
        `<p><strong>Laziness and the subscribe contract.</strong> An Observable is essentially a function wrapping a producer. Calling <code>subscribe()</code> invokes that function with an <em>observer</em> — an object with <code>next</code>, <code>error</code>, and <code>complete</code> callbacks. The producer pushes values by calling <code>subscriber.next(v)</code>. It signals success once with <code>complete()</code> or failure once with <code>error(e)</code>. After either terminal event, no further notifications are allowed and teardown runs. This is the <strong>Observable contract</strong>: <code>next*(error|complete)?</code> — zero or more <code>next</code>, optionally followed by exactly one terminal.</p>`,
        `<p><strong>Cold vs hot.</strong> A <em>cold</em> Observable creates its producer <em>inside</em> the subscribe function, so each subscriber gets an independent execution. <code>HttpClient.get()</code> is cold: two subscriptions fire two HTTP requests. A <em>hot</em> Observable shares a single producer that exists independently of subscribers — <code>fromEvent(window, 'click')</code>, or any <code>Subject</code>. Late subscribers to a hot source miss values emitted before they joined. This distinction explains a huge share of "why did my API get called twice?" bugs.</p>`,
        `{{fig:ch5-cold-vs-hot.svg|Cold observable gives each subscriber its own producer while a hot observable shares one|Cold sources re-run per subscriber (two HTTP calls); hot sources share one producer, so late subscribers miss earlier emissions.}}`,
        `<p><strong>Cancellation and teardown.</strong> <code>subscribe()</code> returns a <code>Subscription</code>. Calling <code>unsubscribe()</code> runs the teardown function the producer returned (clear a timer, close a socket, abort a request). This is real cancellation — the in-flight work stops. A Promise has no equivalent; even <code>AbortController</code> only signals <code>fetch</code>, it does not un-resolve the Promise object. In Angular this is why <code>switchMap</code> can genuinely cancel a stale HTTP request while a Promise-based approach cannot.</p>`,
        `<p><strong>Synchronous emission.</strong> Observables are not required to be async. <code>of(1, 2, 3)</code> emits all three <em>synchronously</em> during the subscribe call, before the next line runs. Promises always defer to the microtask queue, so <code>.then</code> never runs synchronously. This trips people who assume "reactive = async."</p>`,
        `<p><strong>Error semantics.</strong> A Promise has exactly one rejection path, consumed with <code>.catch</code>/<code>try-await</code>. An Observable's <code>error</code> notification is <em>terminal</em>: once it fires, no more values arrive and the subscription is torn down. Recovery is done <em>inside the pipeline</em> with <code>catchError</code> (return a fallback stream) or <code>retry</code>/<code>retryWhen</code> (resubscribe to the source). Because a cold Observable re-runs its producer on resubscribe, <code>retry(3)</code> genuinely re-issues the HTTP request — something a Promise cannot do without wrapping the whole call in a new function. This is why resilient HTTP retry logic is trivial in RxJS and awkward with Promises.</p>`,
        `<p><strong>Backpressure and scheduling.</strong> Because an Observable can emit faster than a consumer handles, RxJS ships operators to manage the rate — <code>throttleTime</code>, <code>debounceTime</code>, <code>auditTime</code>, <code>sampleTime</code>, <code>bufferCount</code>. Promises have no equivalent because they carry a single value. Observables can also be scheduled onto different execution contexts with <code>observeOn</code>/<code>subscribeOn</code> (e.g. <code>asyncScheduler</code>, <code>animationFrameScheduler</code>), controlling <em>when and where</em> emissions are delivered — another capability Promises simply do not have.</p>`,
        `<p><strong>Interop is one-directional in spirit.</strong> Any Promise can become an Observable with <code>from(promise)</code> (it emits the resolved value then completes, or errors on rejection), and any single-value Observable can become a Promise with <code>firstValueFrom</code>/<code>lastValueFrom</code>. But converting an infinite Observable to a Promise throws away everything except one value, so the conversion only makes sense at the edges of your app — a route resolver, a one-off imperative call — never inside a reactive chain.</p>`,
        `<p>ASCII marble notation is the standard way RxJS docs describe this. Frames are dashes, letters are values, <code>|</code> is complete, <code>#</code> is error:</p>`,
        `<pre><code>Promise:     ----------42|        (one value, then done)
Observable:  --1--2--3--|         (many values, then complete)
of(1,2,3):   (123|)               (all synchronous, then complete)
error path:  --1--2--#            (error is terminal, like complete)</code></pre>`,

        `<h2>Code examples</h2>`,
        `<p>Eager vs lazy, and true cancellation:</p>`,
        `<pre><code class="language-typescript">import { Observable } from 'rxjs';

// EAGER: producer runs the instant this line executes,
// even if nobody ever reads the result.
const p = new Promise&lt;number&gt;((resolve) =&gt; {
  console.log('promise producer runs NOW');
  resolve(42);
});

// LAZY: nothing runs here. This is just a recipe.
const obs$ = new Observable&lt;number&gt;((subscriber) =&gt; {
  console.log('observable producer runs only on subscribe');
  subscriber.next(1);
  subscriber.next(2);          // multiple values — impossible with a Promise
  subscriber.next(3);
  subscriber.complete();
  return () =&gt; console.log('teardown / cancellation runs here');
});

const sub = obs$.subscribe({
  next: (v) =&gt; console.log('got', v),
  complete: () =&gt; console.log('done'),
});
sub.unsubscribe();             // cancellation — impossible with a Promise</code></pre>`,
        `<p>Bridging to a Promise when you genuinely want one value (RxJS 7+; <code>toPromise()</code> is deprecated and removed in RxJS 8):</p>`,
        `<pre><code class="language-typescript">import { firstValueFrom, lastValueFrom } from 'rxjs';

// firstValueFrom: resolves with the FIRST emission, then unsubscribes.
const user = await firstValueFrom(this.http.get&lt;User&gt;('/api/me'));

// lastValueFrom: waits for COMPLETE, resolves with the last value.
const total = await lastValueFrom(this.count$);

// Empty stream? Both REJECT with EmptyError unless you pass a default:
const v = await firstValueFrom(maybeEmpty$, { defaultValue: null });</code></pre>`,
        `<p>Resilient retry — trivial with Observables, awkward with Promises:</p>`,
        `<pre><code class="language-typescript">import { retry, timer, catchError, of } from 'rxjs';

this.http.get&lt;User&gt;('/api/me').pipe(
  // Re-issues the request (cold source re-runs) with backoff, up to 3 times:
  retry({ count: 3, delay: (_, n) =&gt; timer(n * 500) }),
  catchError(() =&gt; of(null)),   // give up gracefully after retries exhausted
).subscribe((user) =&gt; this.user.set(user));</code></pre>`,
        `<p>Idiomatic Angular consumption — let the template subscribe:</p>`,
        `<pre><code class="language-typescript">@Component({
  template: \`
    &lt;div *ngIf="user$ | async as user"&gt;{{'{{'}} user.name {{'}}'}}&lt;/div&gt;
  \`,
})
export class ProfileComponent {
  // Cold: the HTTP call fires when the async pipe subscribes,
  // and is torn down automatically when the component is destroyed.
  user$ = inject(HttpClient).get&lt;User&gt;('/api/me');
}</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>"An Observable is a Promise you subscribe to."</strong> No — it is lazy, multi-value, cancellable, and re-runs per subscriber. All four differ.</li>`,
        `<li><strong>Expecting one HTTP call, getting several.</strong> Cold Observables re-execute per subscriber. Two <code>| async</code> pipes on the same <code>http.get()</code> = two requests. Use <code>shareReplay(1)</code> to multicast.</li>`,
        `<li><strong>Assuming async.</strong> <code>of()</code> and <code>from([...])</code> emit synchronously; code after <code>subscribe()</code> may run <em>after</em> your <code>next</code> handlers, not before.</li>`,
        `<li><strong>Using <code>toPromise()</code>.</strong> Deprecated in RxJS 7, gone in RxJS 8. It also silently resolves <code>undefined</code> on an empty stream. Use <code>firstValueFrom</code>/<code>lastValueFrom</code>.</li>`,
        `<li><strong>Forgetting <code>EmptyError</code>.</strong> <code>firstValueFrom</code> on a stream that completes without emitting <em>rejects</em>. Pass <code>{ defaultValue }</code> if that is possible.</li>`,
        `<li><strong>Creating an Observable and never subscribing,</strong> then wondering why the HTTP call never fired. No subscription, no work.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Prefer the <code>async</code> pipe over manual <code>subscribe()</code> in components — it subscribes and unsubscribes for you.</li>`,
        `<li>Reach for <code>firstValueFrom</code>/<code>lastValueFrom</code> only at boundaries (a resolver, an <code>await</code>-based service method), not inside a reactive pipeline.</li>`,
        `<li>Know whether each source is cold or hot before you add subscribers; add <code>shareReplay(1)</code> to share an expensive cold source.</li>`,
        `<li>Model "one value" APIs as Observables anyway so they compose with operators and cancel with <code>switchMap</code>.</li>`,
        `<li>Name Observable variables with a <code>$</code> suffix (<code>user$</code>) so readers know a subscription is required.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: Give the four concrete differences between a Promise and an Observable.</strong> Lazy vs eager execution; zero-to-many vs exactly-one value; cancellable vs not; re-runs per subscriber (cold) vs single cached result. Bonus: Observables can emit synchronously; Promises always defer to a microtask.</p></blockquote>`,
        `<blockquote><p><strong>Q: Is an Observable always asynchronous?</strong> No. <code>of(1,2,3)</code> emits synchronously inside the subscribe call. Async-ness comes from the producer (a timer, HTTP, an event), not from being an Observable.</p></blockquote>`,
        `<blockquote><p><strong>Q: I put two <code>| async</code> pipes on one <code>http.get()</code>. What happens?</strong> Two subscriptions to a cold source = two HTTP requests. Fix with <code>shareReplay(1)</code> (or resolve once and pass the value down).</p></blockquote>`,
        `<blockquote><p><strong>Q: Why is <code>toPromise()</code> gone and what replaces it?</strong> It was ambiguous (it returned the <em>last</em> value before complete) and resolved <code>undefined</code> on empty. Replaced by <code>firstValueFrom</code>/<code>lastValueFrom</code>, which are explicit and reject with <code>EmptyError</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: Can you cancel a Promise?</strong> Not the Promise itself. You can abort the underlying <code>fetch</code> with <code>AbortController</code>, but the Promise still settles. Observables cancel for real via <code>unsubscribe()</code>, which runs teardown.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): What logs first?</strong> <code>console.log('A'); of(1).subscribe(() =&gt; console.log('B')); console.log('C');</code> → A, B, C. <code>of</code> is synchronous. Swap to <code>Promise.resolve(1).then(...)</code> and it becomes A, C, B.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Promise:</strong> eager, one value, no cancel, shared result, always async.</li>`,
        `<li><strong>Observable:</strong> lazy, 0..N values, cancellable, re-runs per subscriber (cold), may be sync.</li>`,
        `<li><strong>Cold</strong> = producer inside subscribe (HTTP, of, interval). <strong>Hot</strong> = shared producer (Subject, fromEvent).</li>`,
        `<li><strong>Contract:</strong> <code>next*(error|complete)?</code> — terminal event is once and final.</li>`,
        `<li><strong>Bridge:</strong> <code>firstValueFrom</code> / <code>lastValueFrom</code>; both reject on empty unless <code>defaultValue</code> given.</li>`,
        `<li><strong>Share a cold source:</strong> <code>shareReplay(1)</code>.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    {
      title: 'Flattening Operators',
      slug: 'flattening-operators',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>The moment you need "for each value from stream A, start stream B (a request, a socket, another observable) and use its results," you need a <strong>higher-order mapping (flattening) operator</strong>. The four canonical ones — <code>switchMap</code>, <code>mergeMap</code>, <code>concatMap</code>, <code>exhaustMap</code> — look interchangeable and are absolutely not. Picking the wrong one gives you a typeahead that shows results for a query the user already erased, duplicate form submissions, out-of-order writes, or a memory leak. "Which flattening operator and why?" is one of the most reliable senior-vs-junior discriminators in an Angular interview.</p>`,
        `<p>They differ on exactly one question: <strong>when a new outer value arrives while a previous inner Observable is still running, what happens to the old one and the new one?</strong> Cancel the old? Run both? Queue the new? Ignore the new? That single choice is the whole topic. Answer it correctly and every reactive data-fetching problem in Angular becomes a one-liner; answer it wrong and you introduce race conditions that only appear under a slow network.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>A higher-order Observable is an Observable that emits Observables. Think of a stream of search queries where each query, when mapped, produces <em>another</em> stream (the HTTP response). Without help you would have a stream-of-streams and be forced to subscribe inside a subscribe. A flattening operator subscribes to each inner Observable <em>for you</em> and "flattens" its values into a single output stream, so consumers see one flat sequence of results. The four canonical operators differ only in their <em>concurrency and cancellation policy</em> — how they juggle overlapping inners.</p>`,
        `{{fig:ch5-flattening-operators.svg|Four flattening operators and how each handles a new value while an inner stream runs|switchMap cancels the previous inner, mergeMap runs all concurrently, concatMap queues them in order, exhaustMap ignores new values until the current one finishes.}}`,
        `<ul>`,
        `<li><strong>switchMap</strong> — cancel the previous inner, switch to the newest. "Only the latest matters."</li>`,
        `<li><strong>mergeMap</strong> (aka <code>flatMap</code>) — run all inners concurrently, merge results as they arrive. "Do them all in parallel."</li>`,
        `<li><strong>concatMap</strong> — queue; wait for each inner to complete before starting the next. "Preserve order, one at a time."</li>`,
        `<li><strong>exhaustMap</strong> — ignore new outer values while an inner is still running. "Ignore spam until done."</li>`,
        `</ul>`,
        `<p>There is also a <code>*All</code> family — <code>mergeAll</code>, <code>concatAll</code>, <code>switchAll</code>, <code>exhaustAll</code> — which flatten a higher-order Observable you already have (a stream of streams), whereas the <code>*Map</code> operators combine the mapping step and the flattening step. In practice you almost always want the <code>*Map</code> form; <code>xxxMap(fn)</code> is exactly <code>map(fn)</code> followed by <code>xxxAll()</code>. Recognising this equivalence is a small but common interview follow-up.</p>`,

        `<h2>How it works</h2>`,
        `<p><strong>switchMap.</strong> On each outer emission it <em>unsubscribes</em> from the current inner (real cancellation — a pending HTTP request is aborted) and subscribes to the new one. Only the most recent inner can contribute to the output. This is why it is the correct operator for typeahead search: keystroke 5 cancels the request for keystroke 4, so you never render stale results, and you never leak in-flight requests.</p>`,
        `{{fig:ch5-switchmap-marble.svg|Marble diagram showing switchMap cancelling inner(a) when b arrives|When source emits b, the still-running inner(a) is unsubscribed; only b's inner values reach the output.}}`,
        `<p><strong>mergeMap.</strong> It keeps <em>every</em> inner subscription alive concurrently and merges emissions in arrival order, which may interleave. Order is not guaranteed. It accepts an optional <code>concurrent</code> argument to cap parallelism (e.g. <code>mergeMap(fn, 3)</code> runs at most three inners at once). Because nothing is cancelled, an unbounded stream of outer values mapped to long-lived inners is a classic leak.</p>`,
        `<p><strong>concatMap.</strong> It is <code>mergeMap</code> with concurrency 1: it subscribes to the next inner only after the current one <em>completes</em>. Output order exactly matches input order. If an inner never completes, everything behind it is blocked forever — a subtle stall. Use it for ordered writes where sequence matters (save operations, sequential animations).</p>`,
        `{{fig:ch5-concatmap-mergemap-marble.svg|Marble diagram contrasting interleaved mergeMap output with ordered concatMap output|mergeMap can emit b1 before a1 when inners overlap; concatMap always finishes a before starting b.}}`,
        `<p><strong>exhaustMap.</strong> While an inner is active it <em>drops</em> new outer values entirely (they are not queued, not run). When the inner completes, it becomes receptive again. Perfect for a login/submit button: it runs the first click's request and ignores rage-clicks until that request finishes.</p>`,
        `<p><strong>The mental model that unifies all four.</strong> Every flattening operator is really "map to an inner Observable, then a specific merge strategy." <code>concatMap</code> is <code>mergeMap</code> with concurrency 1. <code>switchMap</code> is "concurrency 1, but cancel the current inner instead of waiting." <code>exhaustMap</code> is "concurrency 1, but drop new inners instead of queueing." So the real spectrum is: how many inners may run at once, and when full, do you <em>cancel</em> (switch), <em>queue</em> (concat), or <em>ignore</em> (exhaust)? Holding that in your head means you never have to memorise four separate behaviours.</p>`,
        `<p><strong>Cancellation is real, not cosmetic.</strong> When <code>switchMap</code> unsubscribes from a pending <code>HttpClient</code> request, Angular's HTTP layer aborts the underlying XHR/fetch — the request is cancelled on the wire, not merely ignored on arrival. That both saves bandwidth and prevents server-side side effects from a request the user no longer cares about. This is the concrete reason <code>switchMap</code> beats "just take the latest response and discard the rest": the discarded ones never complete.</p>`,
        `<p><strong>Error and completion propagation.</strong> If any inner Observable errors, the error propagates to the output stream and (unless caught) terminates the whole subscription — including sibling inners in <code>mergeMap</code>. The outer completes only after the source completes <em>and</em> all outstanding inners complete (for merge/concat), which is why a never-completing inner can leave the pipeline permanently "open." Wrap the inner in <code>catchError</code> so one failed request does not kill the entire stream: <code>switchMap(q =&gt; this.api.search(q).pipe(catchError(() =&gt; of([]))))</code>.</p>`,
        `<p><strong>concurrent, the hidden second argument.</strong> Both <code>mergeMap</code> and <code>concatMap</code> are the same operator with a different concurrency cap — <code>concatMap(fn)</code> is literally <code>mergeMap(fn, 1)</code>. Reading the RxJS source this way collapses two operators into one idea and makes the queueing behaviour of <code>concatMap</code> obvious: with only one slot, the second inner cannot start until the first frees the slot by completing. Tuning <code>mergeMap</code>'s cap (2, 3, 6…) lets you throttle load — critical when fanning out hundreds of uploads to an API with a rate limit.</p>`,
        `<p>ASCII summary (outer emits a then b close together, each inner takes time):</p>`,
        `<pre><code>outer:      --a--b--------
switchMap:  ----X-b1-b2|     (a's inner X cancelled by b)
mergeMap:   ----a1-b1-a2-b2  (both run, interleave)
concatMap:  ----a1-a2-b1-b2  (b waits for a to complete)
exhaustMap: ----a1-a2------  (b dropped while a runs)</code></pre>`,

        `<h2>Code examples</h2>`,
        `<p>Typeahead search — the textbook <code>switchMap</code>:</p>`,
        `<pre><code class="language-typescript">this.searchControl.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap((q) =&gt; this.api.search(q)),   // cancels the previous request
  takeUntilDestroyed(),
).subscribe((results) =&gt; this.results.set(results));</code></pre>`,
        `<p>Ordered saves with <code>concatMap</code> — writes must land in sequence:</p>`,
        `<pre><code class="language-typescript">this.saveQueue$.pipe(
  concatMap((change) =&gt; this.api.persist(change)),  // one at a time, in order
  takeUntilDestroyed(),
).subscribe();</code></pre>`,
        `<p>Fan-out with bounded concurrency using <code>mergeMap</code>:</p>`,
        `<pre><code class="language-typescript">from(fileIds).pipe(
  mergeMap((id) =&gt; this.api.upload(id), 3),  // at most 3 uploads in flight
).subscribe();</code></pre>`,
        `<p>Debounce-proof submit with <code>exhaustMap</code> — ignore repeat clicks:</p>`,
        `<pre><code class="language-typescript">this.submitClicks$.pipe(
  exhaustMap(() =&gt; this.api.login(this.form.value)),  // ignores clicks mid-flight
  takeUntilDestroyed(),
).subscribe((res) =&gt; this.router.navigate(['/home']));</code></pre>`,
        `<p>Dependent requests (chaining) — one <code>switchMap</code> per hop, never a nested subscribe:</p>`,
        `<pre><code class="language-typescript">// Get the user, then their orders, then the latest order's items:
this.userId$.pipe(
  switchMap((id) =&gt; this.api.getUser(id)),
  switchMap((user) =&gt; this.api.getOrders(user.id)),
  map((orders) =&gt; orders.at(-1)),
  switchMap((order) =&gt; order ? this.api.getItems(order.id) : of([])),
  catchError(() =&gt; of([])),          // one failed hop yields [] instead of killing the stream
  takeUntilDestroyed(),
).subscribe((items) =&gt; this.items.set(items));</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Nested subscribes instead of a flattening operator.</strong> <code>a$.subscribe(x =&gt; b$(x).subscribe(...))</code> loses cancellation, leaks, and breaks error propagation. Flatten with an operator instead.</li>`,
        `<li><strong>Using <code>mergeMap</code> for a typeahead.</strong> Old requests are not cancelled, so a slow earlier response can overwrite the latest results (race condition). Use <code>switchMap</code>.</li>`,
        `<li><strong>Using <code>switchMap</code> for writes.</strong> A second save cancels the first mid-flight — you can lose data. Use <code>concatMap</code> (order) or <code>mergeMap</code> (independent).</li>`,
        `<li><strong>Unbounded <code>mergeMap</code>.</strong> Mapping a fast infinite source to long-lived inners with no <code>concurrent</code> cap leaks subscriptions and hammers the server.</li>`,
        `<li><strong>concatMap with a non-completing inner.</strong> Everything queued behind it stalls forever; the queue silently grows.</li>`,
        `<li><strong>Assuming exhaustMap queues.</strong> It <em>drops</em> values, it does not buffer them. If you need every value, it is the wrong operator.</li>`,
        `<li><strong>Forgetting <code>catchError</code> inside the inner.</strong> Put it on the outer pipe and a single failed request completes the whole stream — the typeahead stops working after the first network blip. Put it on the <em>inner</em> Observable so only that emission fails and the source keeps flowing.</li>`,
        `<li><strong>Debouncing after <code>switchMap</code> instead of before.</strong> <code>debounceTime</code> belongs upstream so you never even start a request for intermediate keystrokes; downstream it only delays results you already paid to fetch.</li>`,
        `<li><strong>Reaching for <code>switchMap</code> reflexively.</strong> It is the safe default for reads, but for writes it silently cancels in-flight saves. Ask "is losing the previous operation acceptable?" — if not, it is the wrong choice.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Default heuristic: <strong>latest-wins → switchMap</strong>, <strong>ordered → concatMap</strong>, <strong>parallel/independent → mergeMap</strong>, <strong>ignore-while-busy → exhaustMap</strong>.</li>`,
        `<li>Put <code>catchError</code> on the <em>inner</em> Observable so one failure never terminates the source stream.</li>`,
        `<li>Always precede a search <code>switchMap</code> with <code>debounceTime</code> + <code>distinctUntilChanged</code> to cut noise.</li>`,
        `<li>Cap <code>mergeMap</code> concurrency explicitly when the outer source is fast or unbounded.</li>`,
        `<li>Never nest subscribes — a flattening operator does it with cancellation and clean error propagation.</li>`,
        `<li>Make sure inner Observables complete (HTTP does; a raw Subject does not) so <code>concatMap</code>/<code>exhaustMap</code> can advance.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: Typeahead search — which operator and why?</strong> <code>switchMap</code>. Each new query cancels the previous request, so stale responses can never overwrite fresh results and in-flight requests do not leak.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why is <code>mergeMap</code> dangerous for search?</strong> It does not cancel. A slow response to "ab" can arrive after "abc" and clobber the correct results — a classic race. It can also leak with fast/unbounded sources.</p></blockquote>`,
        `<blockquote><p><strong>Q: You must persist edits in the exact order the user made them. Which operator?</strong> <code>concatMap</code> — concurrency 1, waits for each write to complete, preserves order. <code>mergeMap</code> could reorder; <code>switchMap</code> could cancel a half-written save.</p></blockquote>`,
        `<blockquote><p><strong>Q: Prevent double form submission from rage-clicks?</strong> <code>exhaustMap</code> — it ignores clicks while the request is in flight, then re-arms on completion. No disabled-button bookkeeping needed.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): Difference between <code>exhaustMap</code> and <code>concatMap</code> when values arrive during an active inner?</strong> <code>concatMap</code> <em>queues</em> them and runs each later; <code>exhaustMap</code> <em>discards</em> them entirely. One buffers, one drops.</p></blockquote>`,
        `<blockquote><p><strong>Q: Is <code>flatMap</code> different from <code>mergeMap</code>?</strong> No — <code>flatMap</code> is the old alias for <code>mergeMap</code>. Same operator.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>switchMap</strong> — cancel previous, keep newest. Typeahead, latest-route-param, autosave-latest.</li>`,
        `<li><strong>mergeMap</strong> — all concurrent, order not guaranteed. Independent parallel work; cap with <code>mergeMap(fn, n)</code>.</li>`,
        `<li><strong>concatMap</strong> — queue, one-at-a-time, order preserved. Sequential writes/animations.</li>`,
        `<li><strong>exhaustMap</strong> — ignore new while busy. Login/submit, refresh buttons.</li>`,
        `<li><strong>Never</strong> nest subscribes; <strong>always</strong> ensure inners complete for concat/exhaust.</li>`,
        `<li>Marble memory hook: switch=X-out-old, merge=interleave, concat=in-order, exhaust=drop-new.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    {
      title: 'Subjects',
      slug: 'subjects',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>A <code>Subject</code> is the bridge between imperative code ("something just happened, push it into the stream") and reactive code ("react to the stream"). It is how you build an event bus, a lightweight state store, cross-component communication, and how you turn a callback-based API into an Observable. Before signals, a <code>BehaviorSubject</code> wrapped in a service was <em>the</em> standard Angular state primitive, and it still underpins most NgRx-free apps and every version of NgRx's internals. Interviewers probe Subjects because the differences between the four variants map directly onto real bugs (missed initial values, memory retention, replayed stale data).</p>`,
        `<p>The headline fact: a <code>Subject</code> is <strong>both an Observable and an Observer</strong>. You can <code>subscribe()</code> to it <em>and</em> call <code>next()</code>, <code>error()</code>, <code>complete()</code> on it. That dual nature makes it <em>multicast</em> and <em>hot</em> — the exact opposite of a plain cold Observable.</p>`,
        `<p>Because a Subject is an Observer, you can also <em>pipe another Observable into it</em>: <code>source$.subscribe(mySubject)</code>. That single line is the seed of every multicasting operator in RxJS, and it is why Subjects are simultaneously the most powerful and the most misused primitive in the library. Interviewers use "when would you actually reach for a raw Subject?" as a maturity check — the mature answer is "rarely; usually a declarative operator or a signal is cleaner, and a Subject is for genuine imperative event sources or bridging non-reactive callbacks."</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>A plain Observable is unicast: every subscriber triggers its own producer run. A <code>Subject</code> is <strong>multicast</strong>: it maintains a list of subscribers and pushes each <code>next(value)</code> to all of them at once, from a single shared producer (you, calling <code>next</code>). It is hot, so subscribers see only what is emitted <em>after</em> they subscribe — unless you use a variant that remembers.</p>`,
        `{{fig:ch5-subject-behaviorsubject.svg|Timeline showing a late subscriber missing values on a Subject but receiving the current value on a BehaviorSubject|A late subscriber to a plain Subject misses prior emissions; on a BehaviorSubject it immediately receives the latest value, then continues.}}`,
        `<p>The key intuition for the variants is a single question: <em>does the Subject remember, and if so, how much?</em> A plain Subject remembers nothing; a BehaviorSubject remembers exactly one (the latest); a ReplaySubject remembers the last n; an AsyncSubject remembers one but only reveals it at the end. Every practical difference between them falls out of that memory model. There are four variants, differing only in <em>what a new subscriber receives at the moment it subscribes</em>:</p>`,
        `{{fig:ch5-subject-variants.svg|Comparison of Subject BehaviorSubject ReplaySubject and AsyncSubject|Subject replays nothing, BehaviorSubject replays the latest value, ReplaySubject replays the last n, AsyncSubject emits only the final value after complete.}}`,

        `<h2>How it works</h2>`,
        `<p><strong>Subject.</strong> No memory. A subscriber that joins after value <code>2</code> was emitted receives only <code>3</code> onward. Calling <code>complete()</code> or <code>error()</code> notifies all current subscribers and then the Subject is terminated — any <em>future</em> subscriber to a completed Subject immediately gets <code>complete</code>, and an errored Subject re-delivers the error to late subscribers.</p>`,
        `<p><strong>BehaviorSubject.</strong> Requires an initial value and always stores the "current" value. On subscribe it <em>synchronously</em> replays that current value, then continues live. It exposes <code>getValue()</code> (or <code>.value</code>) for a synchronous read — handy but a smell if overused. This is the go-to for state: "the current filter," "the logged-in user." Because it always has a value, templates never flash empty.</p>`,
        `<p><strong>ReplaySubject(bufferSize, windowTime?).</strong> Buffers the last <code>bufferSize</code> emissions (optionally only those within <code>windowTime</code> ms) and replays all of them to every new subscriber. Unlike <code>BehaviorSubject</code> it needs no seed and can replay more than one value. <code>ReplaySubject(1)</code> is nearly a <code>BehaviorSubject</code> but with no initial value and no <code>getValue()</code>. Watch the buffer — a large one holds references and leaks memory.</p>`,
        `<p><strong>AsyncSubject.</strong> Emits <em>only the last value</em>, and <em>only when <code>complete()</code> is called</em>. Before completion, subscribers get nothing. It models "a single result computed once" — rarely used directly; it is the semantics behind the old <code>publishLast()</code>.</p>`,
        `<p><strong>Void subjects as pure signals-of-occurrence.</strong> A very common idiom is <code>new Subject&lt;void&gt;()</code> whose emissions carry no payload — you only care <em>that</em> something happened (a click, a "refresh now," a destroy notification). <code>this.destroy$ = new Subject&lt;void&gt;()</code> in the legacy unsubscribe pattern is exactly this. It is a reminder that a Subject's value type can be anything, including nothing.</p>`,
        `<p><strong>The subscription order guarantee.</strong> When you call <code>subject.next(v)</code>, subscribers are notified <em>synchronously</em>, in subscription order, before <code>next</code> returns. A <code>BehaviorSubject</code> delivers its current value to a new subscriber synchronously during <code>subscribe()</code> too. This synchronous delivery is why <code>bs.subscribe(x =&gt; this.value = x)</code> has <code>this.value</code> set immediately on the next line — a subtle but frequently-relied-upon property that distinguishes Subjects from async sources.</p>`,
        `<p><strong>Multicasting internals.</strong> A Subject is what turns a cold Observable hot. Operators like <code>share()</code>, <code>shareReplay()</code>, and (historically) <code>multicast()</code>/<code>publish()</code> work by piping the cold source through a Subject: the source is subscribed <em>once</em>, and the Subject fans emissions out to N subscribers. That is the entire mechanism behind "subscribe once, share to many." <code>shareReplay(1)</code> uses a <code>ReplaySubject(1)</code> under the hood, which is why late subscribers still get the last value.</p>`,
        `<p><strong>Encapsulation.</strong> Never hand a raw Subject to consumers — they could call <code>next()</code> on your private stream. Expose <code>subject.asObservable()</code> (read-only) and keep <code>next()</code> private to the owning service.</p>`,
        `<p><strong>Why a Subject is "hot" and what that costs you.</strong> A plain Observable runs its producer per subscriber (cold/unicast); a Subject has no producer of its own — it just relays whatever you push. Because the emissions exist independently of any subscriber, a Subject is hot: values pushed while nobody is listening are simply gone. This is the root cause of the classic "my component subscribed but never received the value" bug — the value was emitted during the navigation, before the component's <code>ngOnInit</code> ran. <code>BehaviorSubject</code>/<code>ReplaySubject</code> fix it precisely because they remember.</p>`,
        `<p><strong>Subjects and change detection.</strong> Driving UI state through a <code>BehaviorSubject</code> plus the <code>async</code> pipe is the pre-signals way to get automatic, leak-free updates: the pipe subscribes, receives the seeded value immediately (no empty flash thanks to the seed), and re-renders on every <code>next</code>. This is why <code>BehaviorSubject</code> + <code>async</code> pipe was the de-facto Angular state pattern for years, and why so much production code still uses it. Signals now cover the same ground for synchronous state, but Subjects remain the right tool whenever the state is genuinely a stream of asynchronous events.</p>`,
        `<p><strong>Building your own multicast.</strong> If you ever need custom sharing semantics you can wire a Subject manually: subscribe the Subject to the cold source once, then hand <code>subject.asObservable()</code> to consumers. In practice the pipeable operators <code>share()</code> and <code>shareReplay()</code> do this for you with the correct reference-counting, so hand-rolling is rarely justified — but understanding that they are "a Subject in a trench coat" demystifies a lot of RxJS.</p>`,
        `<pre><code>Subject:          --1--2--[sub]--3--|      sub sees: 3
BehaviorSubject:  0-1--2--[sub]--3--|      sub sees: 2 (replayed), 3
ReplaySubject(2): --1--2--[sub]--3--|      sub sees: 1, 2 (replayed), 3
AsyncSubject:     --1--2--[sub]--3--|(end) sub sees: 3 (only on complete)</code></pre>`,

        `<h2>Code examples</h2>`,
        `<p>A tiny state service built on <code>BehaviorSubject</code> (pre-signals canonical pattern):</p>`,
        `<pre><code class="language-typescript">@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly items$$ = new BehaviorSubject&lt;Item[]&gt;([]);
  // Public read-only stream — consumers cannot push into it:
  readonly items$ = this.items$$.asObservable();

  add(item: Item) {
    this.items$$.next([...this.items$$.value, item]);  // synchronous read + push
  }
  get count() { return this.items$$.value.length; }
}</code></pre>`,
        `<p>An event bus with a plain <code>Subject</code>:</p>`,
        `<pre><code class="language-typescript">@Injectable({ providedIn: 'root' })
export class NotificationBus {
  private readonly channel = new Subject&lt;Toast&gt;();
  readonly toasts$ = this.channel.asObservable();
  emit(toast: Toast) { this.channel.next(toast); }   // fire-and-forget, no replay
}</code></pre>`,
        `<p>Turning a cold source hot with <code>shareReplay</code> (Subject-powered multicasting):</p>`,
        `<pre><code class="language-typescript">// One HTTP call, shared by every subscriber; late subscribers get the cached result.
readonly config$ = this.http.get&lt;Config&gt;('/api/config').pipe(
  shareReplay({ bufferSize: 1, refCount: true }),
);</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Exposing the Subject directly.</strong> Any consumer can call <code>next()</code>/<code>complete()</code> on it. Always publish <code>asObservable()</code> and keep writes in the owner.</li>`,
        `<li><strong>Using a plain <code>Subject</code> for state.</strong> A component created after the value changed gets nothing and renders empty. Use <code>BehaviorSubject</code>.</li>`,
        `<li><strong>Completing a shared/root Subject.</strong> Once <code>complete()</code> fires it is dead forever; all future <code>next()</code> calls are ignored silently. Root buses usually should never complete.</li>`,
        `<li><strong>Leaking via <code>ReplaySubject</code> with a big buffer.</strong> It holds references to every buffered value — an unbounded replay is a memory leak.</li>`,
        `<li><strong>Overusing <code>getValue()</code>.</strong> Reaching for <code>.value</code> everywhere turns reactive code back into imperative polling; prefer piping.</li>`,
        `<li><strong>Assuming an errored Subject is harmless to late subscribers.</strong> A Subject that has errored re-throws that error to every new subscriber.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Default to <code>BehaviorSubject</code> for state, plain <code>Subject</code> for events, <code>ReplaySubject(n)</code> for "last n," <code>AsyncSubject</code> almost never.</li>`,
        `<li>Encapsulate: private writable Subject (name it <code>x$$</code>), public <code>x$ = x$$.asObservable()</code>.</li>`,
        `<li>Prefer <code>shareReplay</code> over manually wiring a Subject when all you want is multicast-with-cache.</li>`,
        `<li>For new component/UI state, consider a <strong>signal</strong> instead — synchronous, glitch-free, and no teardown (see the Signals topic).</li>`,
        `<li>Keep buffers small; <code>ReplaySubject(1)</code> is usually enough.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: What makes a Subject different from an Observable?</strong> It is both Observer and Observable, therefore multicast and hot: one <code>next()</code> pushes to all current subscribers, and you can imperatively drive it. A plain Observable is unicast and cold.</p></blockquote>`,
        `<blockquote><p><strong>Q: Subject vs BehaviorSubject — when does it bite?</strong> A component that subscribes <em>after</em> a value was emitted gets nothing from a Subject but the current value from a BehaviorSubject. For state (needs a "current" value) always use BehaviorSubject.</p></blockquote>`,
        `<blockquote><p><strong>Q: Difference between <code>BehaviorSubject</code> and <code>ReplaySubject(1)</code>?</strong> BehaviorSubject requires an initial value, always has a current value, and exposes <code>getValue()</code>. ReplaySubject(1) needs no seed, has no synchronous getter, and replays the last emission only if one has occurred.</p></blockquote>`,
        `<blockquote><p><strong>Q: How does <code>shareReplay(1)</code> work internally?</strong> It multicasts the cold source through a <code>ReplaySubject(1)</code>: subscribes to the source once, fans emissions to all subscribers, and replays the last value to late joiners. <code>refCount: true</code> unsubscribes from the source when subscribers hit zero.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): You call <code>complete()</code> on your root notification Subject. What breaks?</strong> The bus is permanently dead — every later <code>next()</code> is silently ignored, and every new subscriber immediately gets <code>complete</code>. Root buses should not complete.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why hand out <code>asObservable()</code>?</strong> Encapsulation. It hides <code>next</code>/<code>error</code>/<code>complete</code> so consumers can only read the stream, not corrupt it.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Subject</strong> — multicast, hot, no memory. Event bus. Late subscriber gets nothing.</li>`,
        `<li><strong>BehaviorSubject(seed)</strong> — holds current value, replays it, has <code>getValue()</code>. State.</li>`,
        `<li><strong>ReplaySubject(n, time?)</strong> — replays last n (in window). Buffers/caching.</li>`,
        `<li><strong>AsyncSubject</strong> — only the final value, only on <code>complete()</code>. Rare.</li>`,
        `<li>Subject = Observable + Observer → multicasts cold sources hot (<code>share</code>/<code>shareReplay</code>).</li>`,
        `<li>Encapsulate with <code>asObservable()</code>; don't <code>complete()</code> root buses.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    {
      title: 'Subscription Management',
      slug: 'subscription-management',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Every manual <code>subscribe()</code> to a source that does not complete on its own — <code>interval</code>, <code>fromEvent</code>, a router or form <code>valueChanges</code>, any <code>Subject</code> — keeps running after the component is destroyed unless you tear it down. That is a genuine <strong>memory leak</strong>: the callback holds a reference to the (dead) component, the component cannot be garbage-collected, its change-detection work keeps firing, and in a long-lived SPA you accumulate zombie subscriptions until the tab crawls. Interviewers ask about subscription management because it separates people who <em>use</em> RxJS from people who <em>ship</em> it. "How do you avoid leaks?" and "why does the async pipe make this a non-issue?" are near-universal.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p><code>subscribe()</code> returns a <code>Subscription</code>. When the source terminates (<code>complete</code> or <code>error</code>) the subscription tears down automatically. When the source is <em>infinite</em>, it never terminates, so <em>you</em> must call <code>unsubscribe()</code> (or use a declarative equivalent) at the right time — normally when the owning component is destroyed.</p>`,
        `{{fig:ch5-subscription-lifecycle.svg|Diagram showing finite sources self-cleaning and infinite sources needing manual teardown|A finite source completes and runs teardown by itself; an infinite source keeps emitting until you cut it with takeUntilDestroyed or the async pipe.}}`,
        `<p>The goal is to make teardown <strong>declarative</strong> — tied to the component's lifetime automatically — so you never rely on remembering to unsubscribe. The failure mode of the imperative approach (store a <code>Subscription</code>, unsubscribe in <code>ngOnDestroy</code>) is not that it doesn't work but that it relies on a human remembering to do it for <em>every</em> subscription, forever, across every future edit — a guarantee no codebase can keep. Declarative teardown removes the human from the loop. Modern Angular gives you three great options and one legacy one.</p>`,
        `{{fig:ch5-teardown-strategies.svg|Four strategies to avoid subscription leaks ranked from best default to last resort|async pipe, takeUntilDestroyed, and toSignal handle teardown declaratively; manual unsubscribe in ngOnDestroy is the error-prone last resort.}}`,

        `<h2>How it works</h2>`,
        `<p><strong>The async pipe.</strong> <code>value$ | async</code> subscribes when the view is created and unsubscribes when it is destroyed — the framework owns the whole lifecycle. Nothing leaks, and you never write teardown code. It also triggers change detection on each emission. This is the best default: keep the stream in the template, not the class.</p>`,
        `<p><strong>takeUntilDestroyed() (v16+).</strong> The modern idiom for manual subscriptions. It reads the current <code>DestroyRef</code> from the injection context and completes the stream when the component/directive is destroyed. Called in a field initializer or constructor it needs no arguments; called later you pass a <code>DestroyRef</code> explicitly. Put it <em>last</em> in the pipe so it wraps everything above it.</p>`,
        `<p><strong>toSignal() (v16+).</strong> Converting an Observable to a signal with <code>toSignal(obs$)</code> registers teardown against the injection context automatically — when the component is destroyed, the underlying subscription is cleaned up. You get a synchronous, template-friendly value and zero leak risk.</p>`,
        `<p><strong>The legacy <code>takeUntil(destroy$)</code> pattern.</strong> Before v16 the standard was a private <code>destroy$ = new Subject&lt;void&gt;()</code>, <code>takeUntil(this.destroy$)</code> in every pipe, and <code>this.destroy$.next(); this.destroy$.complete();</code> in <code>ngOnDestroy</code>. It works but is boilerplate-heavy and easy to get subtly wrong (operator ordering matters — <code>takeUntil</code> must be last, or a later operator can resubscribe after teardown). <code>takeUntilDestroyed()</code> exists to delete this boilerplate.</p>`,
        `<p><strong>Subscription composition.</strong> A single <code>Subscription</code> can adopt children via <code>sub.add(child)</code>; unsubscribing the parent unsubscribes all children. This is how you tear down several manual subscriptions with one call, though <code>takeUntilDestroyed</code> usually removes the need.</p>`,
        `<p><strong>Why nested subscribes are the worst offender.</strong> <code>a$.subscribe(x =&gt; b$.subscribe(...))</code> creates an inner subscription per outer emission with no handle to any of them — you cannot unsubscribe what you cannot reference, and cancellation/error propagation is broken. Flatten with <code>switchMap</code>/<code>mergeMap</code> so there is one subscription and teardown is automatic.</p>`,
        `<p><strong>What "leak" concretely means here.</strong> A leaked subscription is not just wasted memory. The observer closure keeps the destroyed component instance reachable, so its fields, its injected services' references, and any DOM it captured cannot be collected. Worse, the stream keeps <em>emitting</em>: an <code>interval</code> callback still runs every second, still executes your handler, still calls <code>this.someSignal.set()</code> or triggers change detection on a component that is no longer on screen. Ten navigations to the same page can leave ten timers firing forever. In a dashboard that lives for hours, this is how "the app gets slower the longer you use it" bugs are born.</p>`,
        `<p><strong>DestroyRef, the primitive underneath.</strong> Since v16 every component/directive can inject <code>DestroyRef</code> and register cleanup with <code>destroyRef.onDestroy(cb)</code>. <code>takeUntilDestroyed()</code>, <code>toSignal()</code>, and the async pipe are all built on this. Knowing it exists lets you write your own lifecycle-bound cleanup for non-RxJS resources (a WebSocket, an <code>IntersectionObserver</code>) using the same mechanism, instead of implementing <code>OnDestroy</code> by hand. It also explains <em>why</em> <code>takeUntilDestroyed()</code> must run where an injection context is available: it needs to reach the current <code>DestroyRef</code>.</p>`,
        `<p><strong>Operator ordering, precisely.</strong> <code>takeUntil</code> completes the stream when its notifier emits. If you place another operator <em>after</em> it that can re-subscribe or delay — e.g. <code>repeat()</code>, <code>delay()</code>, or a second <code>takeUntil</code> — the completion can be swallowed or the source re-established, and the "unsubscribe" never actually happens. The rule "<code>takeUntil</code>/<code>takeUntilDestroyed</code> is the last operator in the pipe" is not style; it is correctness. The RxJS lint rule <code>no-unsafe-takeuntil</code> exists specifically to enforce it.</p>`,
        `<p><strong>Flattening operators are teardown too.</strong> It is easy to forget that <code>switchMap</code>, <code>exhaustMap</code>, and friends manage subscriptions internally: <code>switchMap</code> unsubscribes the previous inner on every outer emission, and the whole chain unsubscribes when the outer subscription is torn down. So a single well-formed pipe — <code>source$.pipe(switchMap(...), takeUntilDestroyed())</code> — has <em>exactly one</em> subscription you must account for, no matter how many inner requests fire over its lifetime. This is the deepest reason to flatten rather than nest: nesting multiplies the number of things you have to remember to clean up; flattening keeps it at one.</p>`,
        `<p><strong>Zoneless changes nothing about leaks.</strong> A common misconception is that moving to signals or zoneless change detection removes the need to unsubscribe. It does not: an infinite Observable you manually subscribed still runs its callback forever after destroy regardless of the change-detection strategy. What signals change is how often you <em>need</em> a manual subscription in the first place — if the value only feeds the template, <code>toSignal()</code> or the async pipe removes the subscription (and the leak risk) entirely.</p>`,

        `<h2>Code examples</h2>`,
        `<p>Preferred: no subscription at all — the async pipe:</p>`,
        `<pre><code class="language-typescript">@Component({
  template: \`&lt;p&gt;{{'{{'}} clock$ | async {{'}}'}}&lt;/p&gt;\`,
})
export class ClockComponent {
  clock$ = interval(1000).pipe(map(() =&gt; new Date().toLocaleTimeString()));
  // No ngOnDestroy, no unsubscribe — the pipe owns the lifecycle.
}</code></pre>`,
        `<p>Manual subscribe done right — <code>takeUntilDestroyed()</code>:</p>`,
        `<pre><code class="language-typescript">export class SearchComponent {
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.route.queryParams.pipe(
      map((p) =&gt; p['q'] ?? ''),
      switchMap((q) =&gt; this.api.search(q)),
      takeUntilDestroyed(),          // MUST be last; completes on destroy
    ).subscribe((r) =&gt; this.results.set(r));
  }

  // Called OUTSIDE an injection context? Pass the ref explicitly:
  later() {
    this.stream$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}</code></pre>`,
        `<p>Convert to a signal and forget about teardown:</p>`,
        `<pre><code class="language-typescript">export class UserComponent {
  // Auto-unsubscribes on destroy; synchronous read in the template.
  user = toSignal(this.http.get&lt;User&gt;('/api/me'), { initialValue: null });
}</code></pre>`,
        `<p>Legacy pattern (know it — you will see it in older codebases):</p>`,
        `<pre><code class="language-typescript">export class OldComponent implements OnDestroy {
  private destroy$ = new Subject&lt;void&gt;();
  ngOnInit() {
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(/* ... */);
  }
  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
}</code></pre>`,
        `<p>Binding a non-RxJS resource to the component lifetime via <code>DestroyRef</code>:</p>`,
        `<pre><code class="language-typescript">export class LiveComponent {
  constructor() {
    const socket = new WebSocket('wss://example/feed');
    // Same primitive the RxJS helpers use — clean up on destroy:
    inject(DestroyRef).onDestroy(() =&gt; socket.close());
  }
}</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Forgetting to unsubscribe from an infinite source.</strong> <code>interval</code>, <code>valueChanges</code>, <code>fromEvent</code>, Subjects never complete — the callback (and the component) leaks.</li>`,
        `<li><strong>Manually unsubscribing from HTTP.</strong> Harmless but unnecessary — <code>http.get()</code> completes after one emission and self-cleans. It signals a shaky mental model.</li>`,
        `<li><strong>Nested subscribes.</strong> No handle to inner subscriptions, broken cancellation. Flatten instead.</li>`,
        `<li><strong><code>takeUntil</code> not last.</strong> If an operator that resubscribes sits after it, teardown can be bypassed. <code>takeUntil</code>/<code>takeUntilDestroyed</code> must be the final operator.</li>`,
        `<li><strong>Subscribing in <code>ngOnInit</code> but the class has no destroy handling.</strong> Every navigation to the component adds another live subscription.</li>`,
        `<li><strong>Calling <code>takeUntilDestroyed()</code> with no <code>DestroyRef</code> outside an injection context.</strong> It throws — pass the ref explicitly there.</li>`,
        `<li><strong>Subscribing inside <code>ngOnChanges</code> or an event handler without teardown.</strong> These run many times; each call adds a fresh subscription. Either move to a stream + <code>switchMap</code>, or store and replace the subscription.</li>`,
        `<li><strong>Trusting a shared <code>shareReplay</code> to never leak.</strong> Without <code>refCount: true</code> (or <code>{ refCount: true }</code>) it keeps the source subscription alive forever after the first subscriber, even when all consumers leave.</li>`,
        `<li><strong>Manually managing an array of subscriptions and forgetting one.</strong> A single one missed still leaks. Prefer <code>takeUntilDestroyed()</code> per stream or one composite <code>Subscription</code>.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Default to the <strong>async pipe</strong>; it is the leak-proof, least-code option.</li>`,
        `<li>When you must subscribe in the class, use <code>takeUntilDestroyed()</code> as the last operator.</li>`,
        `<li>Use <code>toSignal()</code> when the value ends up in the template — synchronous and self-cleaning.</li>`,
        `<li>Never nest subscribes; flatten with the right higher-order operator.</li>`,
        `<li>Do not bother unsubscribing from sources that complete (HTTP, <code>of</code>, single-shot <code>timer</code>).</li>`,
        `<li>Enable lint rules (e.g. <code>rxjs-angular</code>) that flag unmanaged subscriptions.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: Which subscriptions must you clean up, and which clean themselves?</strong> Sources that <em>complete</em> (HTTP, <code>of</code>, single <code>timer</code>) self-tear-down. Infinite sources (<code>interval</code>, <code>fromEvent</code>, <code>valueChanges</code>, Subjects) must be torn down manually.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why is the async pipe the recommended approach?</strong> It ties the subscription to the view lifecycle — subscribes on create, unsubscribes on destroy — so leaks are impossible and no class code is needed. It also marks the component for change detection on each emission.</p></blockquote>`,
        `<blockquote><p><strong>Q: What is <code>takeUntilDestroyed()</code> and why is operator order critical?</strong> It completes the stream when the injection context's <code>DestroyRef</code> fires. It must be the last operator, otherwise an operator after it could resubscribe or emit past teardown.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why are nested subscribes a code smell?</strong> They leak (no reference to inner subscriptions), break cancellation and error propagation, and re-create inner subscriptions on every outer emission. Flatten with <code>switchMap</code>/<code>mergeMap</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): Do you need to unsubscribe from <code>this.http.get()</code> in <code>ngOnDestroy</code>?</strong> No. It completes after one value and cleans itself up. Doing so is harmless but reveals you don't distinguish finite from infinite sources.</p></blockquote>`,
        `<blockquote><p><strong>Q: Component destroyed mid-request with <code>switchMap</code> + <code>takeUntilDestroyed</code> — what happens to the in-flight HTTP call?</strong> Teardown unsubscribes, which cancels the pending request (aborts it), and the response handler never runs. Real cancellation, not just ignoring the result.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Finite source</strong> (HTTP, of, single timer) → self-cleans, no action.</li>`,
        `<li><strong>Infinite source</strong> (interval, fromEvent, valueChanges, Subject) → must tear down.</li>`,
        `<li><strong>Best:</strong> <code>| async</code> in the template. <strong>Manual:</strong> <code>takeUntilDestroyed()</code> (last operator). <strong>To template value:</strong> <code>toSignal()</code>.</li>`,
        `<li><strong>Legacy:</strong> <code>takeUntil(destroy$)</code> + <code>ngOnDestroy</code> — <code>takeUntil</code> must be last.</li>`,
        `<li>Never nest subscribes; flatten instead.</li>`,
        `<li><code>sub.add(child)</code> composes subscriptions for one-call teardown.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    {
      title: 'Signals',
      slug: 'signals',
      order: 4,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Signals (stable since Angular v17, refined through v18/v19) are the biggest shift in Angular's reactivity model since RxJS. They are a fine-grained reactive primitive that lets the framework know <em>exactly</em> which parts of the UI depend on which state, which enables surgical, zoneless change detection instead of the classic "check everything" pass. Interviewers care because signals change how you write state, how change detection works, and how RxJS fits going forward. "Signals vs Observables — when do you use each?" is now a standard senior question, and getting <code>effect()</code> or <code>computed()</code> semantics wrong is an easy way to look shallow.</p>`,
        `<p>Signals do <em>not</em> replace RxJS. RxJS owns asynchronous streams over time (events, HTTP, websockets, debouncing); signals own synchronous state that the UI reads. The two interoperate through <code>toSignal</code> and <code>toObservable</code>.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>A <strong>signal</strong> is a wrapper around a value that notifies interested consumers when the value changes. You read it by <em>calling</em> it (<code>count()</code>) and write it with <code>set()</code>/<code>update()</code>. There are three pieces:</p>`,
        `<ul>`,
        `<li><strong><code>signal(x)</code></strong> — a writable source of truth. <code>set(v)</code> replaces, <code>update(fn)</code> derives from the current value.</li>`,
        `<li><strong><code>computed(fn)</code></strong> — a read-only derived signal. Lazy and memoized: it recomputes only when a signal it read has changed, and only when something actually reads it.</li>`,
        `<li><strong><code>effect(fn)</code></strong> — a side effect that re-runs when any signal it reads changes. For syncing to the outside world (logging, localStorage, imperative DOM), <em>not</em> for deriving state.</li>`,
        `</ul>`,
        `{{fig:ch5-signal-graph.svg|Dependency graph of writable signals feeding a computed which feeds an effect updated glitch-free|price and qty feed a memoized subtotal computed which feeds an effect; a batched update recomputes subtotal once and runs the effect once with no stale intermediate.}}`,
        `<p>Dependencies are tracked <strong>automatically</strong> — whichever signals you happen to read inside a <code>computed</code>/<code>effect</code> become its dependencies, with no manual subscription and no teardown.</p>`,
        `{{fig:ch5-signals-vs-observables.svg|Side-by-side comparison of signals and observables and when to use each|Signals are synchronous pull-based state with no teardown; observables are asynchronous push-based streams with operators and teardown; bridge with toSignal and toObservable.}}`,

        `<h2>How it works</h2>`,
        `<p><strong>Pull-based, not push-based.</strong> Unlike an Observable that pushes each value, a signal is pulled: reading it returns the current value and, if you are inside a reactive context (a <code>computed</code> or <code>effect</code>), registers a dependency edge. When you write a new value, dependents are marked <em>dirty</em> but not recomputed immediately — they recompute lazily on the next read. This laziness is why a <code>computed</code> that nobody reads costs nothing.</p>`,
        `<p><strong>Memoization and equality.</strong> A <code>computed</code> caches its last result and only recomputes when a dependency actually changed value. Signals use <code>Object.is</code> by default to decide "changed" — setting a signal to an equal value notifies nobody. You can supply a custom <code>equal</code> function. This means mutating an object in place (<code>arr.push(x)</code> then <code>set(arr)</code> with the same reference) will <em>not</em> notify — you must set a new reference.</p>`,
        `<p><strong>Glitch-free / topological updates.</strong> Consider <code>subtotal = computed(() =&gt; price() * qty())</code> and an <code>effect</code> reading <code>subtotal</code>. If you update <code>price</code> and <code>qty</code> in the same synchronous tick, the signal graph guarantees the effect runs <em>once</em> with the final consistent values — never once with the new price and the stale qty. RxJS with <code>combineLatest</code> famously emits that intermediate "glitch." The signal graph resolves updates in dependency (topological) order and batches, so consumers never observe an inconsistent intermediate state. This is a favourite interview follow-up.</p>`,
        `<p><strong>Effects run in the scheduler, not synchronously.</strong> After you set a signal, the effect does not run inline on that line; it is scheduled and runs after the current synchronous work, coalescing multiple writes into a single run. Effects must be created in an injection context (constructor/field), where they register teardown against the component automatically — they clean up on destroy with no manual code. An effect can also register its own cleanup via the <code>onCleanup</code> callback it receives.</p>`,
        `<p><strong>Change detection.</strong> When a signal read in a template changes, Angular knows precisely which views to refresh, enabling zoneless operation and, with the modern setup, updating only the affected DOM rather than dirty-checking the whole component tree. This is the performance payoff.</p>`,
        `<p><strong>Interop.</strong> <code>toSignal(obs$)</code> subscribes to an Observable and exposes its latest value as a signal (auto-unsubscribing on destroy); it needs an <code>initialValue</code> or emits <code>undefined</code> until the first value. <code>toObservable(sig)</code> creates an Observable that emits when the signal changes (implemented with an effect under the hood). Use these at the boundary between the async (RxJS) and synchronous (signal) worlds.</p>`,
        `<p><strong>Why pull-based avoids a whole class of bugs.</strong> In a push model like <code>combineLatest</code>, each source pushes independently, so a downstream consumer can momentarily see a combination that never logically existed (new price, old quantity). Signals invert control: nothing is pushed eagerly; instead, when you <em>read</em> a computed, it pulls the current values of its dependencies on demand and, because the graph is resolved top-down in topological order, it can only ever return a fully consistent snapshot. The framework marks nodes dirty on write and defers the actual recomputation until a read forces it, collapsing any number of intermediate writes in the same tick into one consistent result. That is the entire mechanism behind "glitch-free," and it is why signal-derived state is often easier to reason about than an equivalent RxJS combination.</p>`,
        `<p><strong>linkedSignal and resource (v19+).</strong> Newer APIs extend the model: <code>linkedSignal</code> is a writable signal whose value is derived from other signals but can also be locally overridden (useful for "selected item resets when the list changes, but the user can still pick"), and <code>resource</code>/<code>rxResource</code> model asynchronous data loading as a signal with built-in <code>value</code>, <code>status</code>, and <code>error</code>, reloading when its request signal changes. These show the direction of travel: more of what used to require an RxJS pipeline is becoming expressible as signals, while RxJS stays the tool for true event streams. Mentioning them signals (pun intended) that you track the framework's evolution.</p>`,
        `<p><strong>Effects and the injection context, precisely.</strong> An <code>effect</code> must be created where an injector is available so it can bind its teardown to the component's <code>DestroyRef</code>; created in a field initializer or constructor this is automatic. If you must create one later, pass <code>{ injector }</code> explicitly. Angular also guards against writing signals during change detection from an effect by default (the <code>allowSignalWrites</code> escape hatch existed and has been tightened across versions) precisely to keep the graph acyclic and glitch-free — a cycle where an effect writes a signal it reads would loop forever.</p>`,

        `<h2>Code examples</h2>`,
        `<p>Signals, computed, and effect together:</p>`,
        `<pre><code class="language-typescript">import { signal, computed, effect } from '@angular/core';

export class CartComponent {
  price = signal(100);
  qty = signal(2);

  // Derived, lazy, memoized — recomputes only when price or qty changes:
  subtotal = computed(() =&gt; this.price() * this.qty());
  tax = computed(() =&gt; this.subtotal() * 0.1);
  total = computed(() =&gt; this.subtotal() + this.tax());

  constructor() {
    // Side effect: runs once now, then whenever total() changes.
    effect(() =&gt; localStorage.setItem('total', String(this.total())));
  }

  addOne() { this.qty.update((q) =&gt; q + 1); }   // set() replaces, update() derives
}</code></pre>`,
        `<p>Glitch-free batching in action:</p>`,
        `<pre><code class="language-typescript">// Both writes happen in the same tick.
this.price.set(200);
this.qty.set(5);
// subtotal recomputes ONCE, and the effect runs ONCE with 200 * 5 = 1000.
// It never runs with the transient (200 * 2) or (100 * 5) combination.</code></pre>`,
        `<p>RxJS interop — the async world meets the synchronous world:</p>`,
        `<pre><code class="language-typescript">import { toSignal, toObservable } from '@angular/core/rxjs-interop';

export class SearchComponent {
  query = signal('');

  // Signal -> Observable so we can debounce + switchMap, then back to a signal:
  results = toSignal(
    toObservable(this.query).pipe(
      debounceTime(300),
      switchMap((q) =&gt; this.api.search(q)),
    ),
    { initialValue: [] as Result[] },   // no undefined flash, auto-unsubscribes
  );
}</code></pre>`,
        `<p>Modern component I/O built on signals (v17.1+ / v17.3+):</p>`,
        `<pre><code class="language-typescript">export class UserCard {
  name = input.required&lt;string&gt;();          // signal input
  fullName = computed(() =&gt; this.name().toUpperCase());
  saved = output&lt;void&gt;();                    // event output
  editable = model(false);                  // two-way signal binding
}</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Using <code>effect()</code> to compute derived state.</strong> Writing another signal from an effect is an anti-pattern (and writes are disallowed by default) — use <code>computed()</code>. Effects are for side effects only.</li>`,
        `<li><strong>Forgetting to call the signal.</strong> <code>count</code> is the signal object; <code>count()</code> is its value. In a template <code>{{'{{'}} count {{'}}'}}</code> prints the function, not the number.</li>`,
        `<li><strong>Mutating instead of replacing.</strong> <code>arr.push(x); this.items.set(arr)</code> keeps the same reference, so <code>Object.is</code> sees no change and nobody updates. Set a new array/object.</li>`,
        `<li><strong>Expecting effects to run synchronously.</strong> They are scheduled; the effect does not fire on the line where you called <code>set()</code>.</li>`,
        `<li><strong>Assuming a fixed dependency set.</strong> A <code>computed</code>/<code>effect</code>'s dependencies are whatever it read on its <em>latest</em> run; a branch that didn't execute is not a dependency.</li>`,
        `<li><strong>Creating effects outside an injection context</strong> without passing an injector — it throws, and manual effects need manual cleanup.</li>`,
        `<li><strong>Ping-ponging between models</strong> with <code>toObservable</code>/<code>toSignal</code> to avoid learning one. Use RxJS for async time, signals for state.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Model UI/component state as signals; derive with <code>computed</code>; reserve <code>effect</code> for genuine side effects (DOM, storage, logging).</li>`,
        `<li>Keep signals immutable-style: replace references with <code>set</code>/<code>update</code> rather than mutating.</li>`,
        `<li>Use RxJS for streams over time (HTTP, events, debounce, retries); bridge with <code>toSignal</code> at the component boundary and give it an <code>initialValue</code>.</li>`,
        `<li>Prefer <code>computed</code> over storing derived values — it stays consistent automatically and is glitch-free.</li>`,
        `<li>Adopt signal <code>input()</code>/<code>output()</code>/<code>model()</code> for new components to get reactive, typed I/O.</li>`,
        `<li>Provide a custom <code>equal</code> when signal values are objects you compare structurally.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: Signals vs Observables — when each?</strong> Signals for synchronous state the UI reads (pull-based, always has a value, no teardown). Observables for asynchronous streams over time (push-based, rich operators, need teardown). They complement, not replace, each other.</p></blockquote>`,
        `<blockquote><p><strong>Q: What does "glitch-free" mean?</strong> When multiple dependencies update in one tick, a computed recomputes once and effects run once with final consistent values — no transient intermediate emission. Contrast <code>combineLatest</code>, which emits on each input and can produce inconsistent pairs.</p></blockquote>`,
        `<blockquote><p><strong>Q: <code>computed</code> vs <code>effect</code>?</strong> <code>computed</code> returns a value, is lazy and memoized, and must be pure (no side effects, no writing signals). <code>effect</code> returns nothing, runs for its side effects, and is scheduled after writes. Deriving state in an effect is the classic anti-pattern.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why does setting a signal to an "equal" value do nothing?</strong> Signals use <code>Object.is</code> by default; an equal value is treated as no change, so dependents are not notified. This is also why in-place mutation without a new reference silently fails to update.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do signals enable zoneless change detection?</strong> Reading a signal in a template creates a precise dependency, so Angular knows exactly which views to refresh without Zone.js patching async APIs and without dirty-checking the whole tree.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): Does an effect run synchronously right after <code>set()</code>?</strong> No — it is scheduled and runs after the current synchronous work, coalescing multiple writes into one run. Code on the next line still sees the old effect state.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>signal(x)</strong> — writable state; read <code>x()</code>, write <code>set</code>/<code>update</code>.</li>`,
        `<li><strong>computed(fn)</strong> — derived, lazy, memoized, pure. Prefer over stored derivatives.</li>`,
        `<li><strong>effect(fn)</strong> — side effects only, scheduled (not sync), auto-cleans on destroy.</li>`,
        `<li><strong>Glitch-free:</strong> batched, topological updates → one recompute, one effect run, no stale mix.</li>`,
        `<li><strong>Equality:</strong> <code>Object.is</code> by default; replace references, don't mutate.</li>`,
        `<li><strong>Interop:</strong> <code>toSignal(obs$, {initialValue})</code>, <code>toObservable(sig)</code>. Signals = state, RxJS = async time.</li>`,
        `<li><strong>Signal I/O:</strong> <code>input()</code>, <code>output()</code>, <code>model()</code> for modern components.</li>`,
        `</ul>`,
      ].join('\n'),
    },
  ],
};
