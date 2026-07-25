/**
 * Chapter 4 — Dependency Injection & Services
 *
 * Figures are referenced with {{fig:filename.svg|ALT|CAPTION}} markers on their
 * own line, resolved at seed time by seed-angular-kit.js. Content is authored as
 * an array of backtick strings joined with '\n'. All content is accurate to
 * Angular v17+ (standalone APIs, inject()).
 */

module.exports = {
  title: 'Dependency Injection & Services',
  slug: 'di-services',
  order: 3,
  topics: [
    {
      title: 'What is Dependency Injection',
      slug: 'what-is-di',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Dependency Injection (DI) is not a side feature of Angular — it is the framework's spine. Every service, every <code>HttpClient</code>, every <code>Router</code>, every reactive form builder reaches your code through DI. If you understand DI, you understand how Angular wires an application together; if you do not, you will fight mysterious "No provider for X" errors and duplicate-instance bugs for years without knowing why.</p>`,
        `<p>Interviewers open with DI because the answer instantly separates people who <em>use</em> Angular from people who <em>understand</em> it. Anyone can type <code>constructor(private http: HttpClient)</code>. The signal an interviewer listens for is whether you can explain <em>who</em> creates that <code>HttpClient</code>, <em>when</em>, and <em>why the same instance shows up in ten different components</em>. That is DI, and it is also the foundation for testing, lazy loading, and clean architecture.</p>`,
        `<p>Practically, DI is what makes Angular code testable. Because a component never says <code>new HttpService()</code>, a test can hand it a fake instead. Because the framework owns object creation, it can share one instance across the whole app, or scope one per component, without your code changing. Inversion of control — "don't call us, we'll call you" — is the whole game.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>Dependency Injection means: <strong>a class declares what it needs, and something else is responsible for supplying it.</strong> The class does not build its own collaborators; it asks for them and receives them ready to use. The "something else" in Angular is called the <em>injector</em>.</p>`,
        `<p>Compare the two worlds. Without DI, a component hard-wires its dependencies by calling <code>new</code>. That couples the component to one concrete class, makes it impossible to swap in a mock during testing, and quietly creates a fresh copy of the dependency every time. With DI, the component simply declares "I need an <code>HttpService</code>", and Angular's injector locates or creates one and passes it in. The component neither knows nor cares how the instance was built.</p>`,
        `{{fig:ch4-di-concept.svg|Comparison of hard-wired construction versus dependency injection|Without DI a component calls new and is tightly coupled to one class; with DI the injector supplies a shared, swappable instance the component merely asks for.}}`,
        `<p>There are three moving parts, and the whole chapter turns on keeping them separate in your head:</p>`,
        `<ul>`,
        `<li><strong>Token</strong> — the <em>key</em> you ask for. Usually a class (<code>HttpService</code>), sometimes an <code>InjectionToken</code> for non-class values like config.</li>`,
        `<li><strong>Provider</strong> — the <em>recipe</em> that tells the injector how to make the value for a token.</li>`,
        `<li><strong>Injector</strong> — the <em>runtime container</em> that holds the recipes, builds instances on demand, and caches them.</li>`,
        `</ul>`,
        `<p>A one-sentence definition worth memorising: <em>DI is a design pattern where a class receives its dependencies from an external injector rather than constructing them itself.</em></p>`,

        `<h2>How it works</h2>`,
        `<p>When your code asks for a dependency — via <code>inject(HttpService)</code> or a constructor parameter — Angular runs a precise resolution algorithm. First it identifies the <strong>token</strong> (<code>HttpService</code>). Then it asks the current <strong>injector</strong>: "do you have a provider registered for this token?" If yes, and no instance has been built yet, the injector runs the <strong>provider</strong> recipe once, caches the resulting instance, and returns it. On every later request for the same token in the same injector, the cached instance is returned — this is why <code>providedIn: 'root'</code> services behave as singletons.</p>`,
        `<p>If the current injector has no provider for the token, it delegates to its <strong>parent injector</strong>, walking up the hierarchy. The first injector that has a matching provider wins. If the search reaches the top and still finds nothing, Angular hits the special <code>NullInjector</code>, which throws the famous <code>NG0201: No provider for X</code> error. That error is not random — it means "I walked the entire injector chain and no one registered a recipe for this token."</p>`,
        `<p>Angular actually maintains <strong>two</strong> parallel injector hierarchies. The <em>EnvironmentInjector</em> tree is created by bootstrapping, route configuration, and lazy loading; it holds application-wide services like <code>providedIn: 'root'</code> registrations. The <em>ElementInjector</em> tree is created by the component/directive structure of your template; it holds anything you list in a component's <code>providers</code> array. An element lookup searches its ElementInjector chain first, and only if that misses does it fall through to the EnvironmentInjector chain. Most beginners never notice the split — but it explains subtle scope behaviour later in this chapter.</p>`,
        `<p>The recipe itself has several shapes. <code>useClass</code> instantiates a class with <code>new</code> (and injects <em>its</em> dependencies too). <code>useValue</code> supplies a ready-made object or constant as-is. <code>useFactory</code> runs a function to compute the value, optionally with its own injected <code>deps</code>. <code>useExisting</code> aliases one token to another already-provided token, returning the same instance rather than creating a new one. When you write <code>providedIn: 'root'</code> on a service class, Angular generates an implicit <code>useClass</code> provider for you — which is why the simplest service needs no explicit provider at all.</p>`,
        `<p>Finally, resolution can be steered with modifiers. <code>@Optional()</code> (or <code>inject(X, { optional: true })</code>) turns a missing provider into <code>null</code> instead of an error. <code>@Self()</code> restricts the search to the current injector only. <code>@SkipSelf()</code> starts the search at the parent. <code>@Host()</code> walks up but stops at the host component boundary. These exist because DI is fundamentally a tree walk, and sometimes you need to control exactly how far the walk is allowed to go.</p>`,

        `<h2>Code examples</h2>`,
        `<p>A service that depends on another service. Notice nobody ever writes <code>new</code>:</p>`,
        `<pre><code class="language-typescript">import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  log(msg: string) { console.log('[app]', msg); }
}

@Injectable({ providedIn: 'root' })
export class UserService {
  // inject() is the modern (v14+) way to grab dependencies.
  private http = inject(HttpClient);
  private logger = inject(LoggerService);

  getUsers() {
    this.logger.log('fetching users');
    return this.http.get('/api/users');
  }
}</code></pre>`,
        `<p>A component consuming that service. It only <em>asks</em> for <code>UserService</code>; Angular supplies the same singleton the rest of the app uses:</p>`,
        `<pre><code class="language-typescript">import { Component, inject } from '@angular/core';
import { UserService } from './user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  template: \`&lt;p&gt;{{ count }} users loaded&lt;/p&gt;\`,
})
export class UsersComponent {
  private users = inject(UserService);
  count = 0;

  constructor() {
    this.users.getUsers().subscribe((list: any[]) =&gt; (this.count = list.length));
  }
}</code></pre>`,
        `<p>Why DI makes testing trivial — swap the real service for a fake with a single provider override:</p>`,
        `<pre><code class="language-typescript">import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UserService } from './user.service';

it('shows the loaded count', () =&gt; {
  const fake = { getUsers: () =&gt; of([{ id: 1 }, { id: 2 }]) };

  TestBed.configureTestingModule({
    providers: [{ provide: UserService, useValue: fake }],
  });

  const svc = TestBed.inject(UserService);
  expect(svc).toBe(fake); // the component would receive the fake, not the real one
});</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Calling <code>new MyService()</code> manually.</strong> This bypasses DI entirely: the service's own dependencies are never injected, and you get a second, disconnected instance. Always let the injector build it.</li>`,
        `<li><strong>Thinking DI is Angular-specific magic.</strong> It is a general OOP pattern (inversion of control). Angular just provides a hierarchical injector to implement it.</li>`,
        `<li><strong>Assuming every service is a singleton.</strong> It is a singleton only within the injector that provided it. Provide the same service in two component <code>providers</code> arrays and you get two instances.</li>`,
        `<li><strong>Forgetting <code>@Injectable()</code>.</strong> A class that itself injects dependencies must carry the decorator so Angular can read its dependency metadata; without it you get a runtime resolution error.</li>`,
        `<li><strong>Reading "No provider for X" as a typo.</strong> It almost always means the token was never registered in any reachable injector — a scope problem, not a spelling problem.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Depend on abstractions where it helps testing or swapping — but do not over-engineer with interfaces for every service.</li>`,
        `<li>Default new services to <code>providedIn: 'root'</code>; it is tree-shakable and gives you an app-wide singleton for free.</li>`,
        `<li>Prefer <code>inject()</code> in new code — it is cleaner and composes into reusable helper functions.</li>`,
        `<li>Never construct injectable classes by hand; if you need a value in DI, register a provider for it.</li>`,
        `<li>Keep services stateless where possible so sharing a singleton across the app is safe.</li>`,
        `<li>Treat "No provider" errors as a signal to check <em>where</em> the token is provided relative to <em>where</em> it is requested.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: What is Dependency Injection in one sentence?</strong><br>A design pattern where a class receives its dependencies from an external injector instead of creating them itself, inverting control of object construction to the framework.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why does Angular use DI at all — what would break without it?</strong><br>Testability and sharing. Without DI, components would <code>new</code> their dependencies, making them impossible to mock and creating duplicate instances. DI lets Angular share singletons, swap implementations, and control lifetimes without your code changing.</p></blockquote>`,
        `<blockquote><p><strong>Q: What are the three core pieces of Angular DI?</strong><br>Token (the key you ask for), provider (the recipe for building the value), and injector (the container that holds recipes and caches instances). Trap: candidates often merge "provider" and "injector" — keep them distinct.</p></blockquote>`,
        `<blockquote><p><strong>Q: What exactly does "No provider for X" mean?</strong><br>Angular walked the entire injector chain from the requesting element up to the NullInjector and found no registered provider for that token. It is a scoping/registration problem, not a syntax one.</p></blockquote>`,
        `<blockquote><p><strong>Q: Is a service always a singleton?</strong><br>No. It is a singleton only within the injector that provides it. <code>providedIn: 'root'</code> is app-wide; a service in a component's <code>providers</code> array gets a new instance per component. (Trap answer: "yes, always" is wrong.)</p></blockquote>`,
        `<blockquote><p><strong>Q: What is the difference between a dependency and a provider?</strong><br>A dependency is <em>what a class needs</em>; a provider is <em>the instruction telling the injector how to supply it</em>. One dependency can be satisfied by different providers in different scopes.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>DI</strong> = class asks for deps; injector supplies them (inversion of control).</li>`,
        `<li><strong>3 pieces</strong>: Token (key) → Provider (recipe) → Injector (container + cache).</li>`,
        `<li><strong>Resolution</strong>: current injector → walk up parents → NullInjector → "No provider" error.</li>`,
        `<li><strong>Singleton scope</strong> = per injector, not global. <code>providedIn: 'root'</code> = app-wide.</li>`,
        `<li><strong>Two trees</strong>: ElementInjector (template/providers) falls through to EnvironmentInjector (root/routes).</li>`,
        `<li><strong>Never</strong> call <code>new</code> on an injectable — you lose its own DI and share nothing.</li>`,
        `<li><strong>Payoff</strong>: testability (swap with one provider), sharing, and controlled lifetimes.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    {
      title: 'Providers, Injectors & Injection Tokens',
      slug: 'providers-injectors',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>"Providers" is where DI stops being a vague idea and becomes a set of concrete choices you make on every non-trivial Angular app. The moment you need to inject a config object, swap a real API for a fake, alias an old service name, or build a value at runtime, you are choosing a provider shape. Get the shape wrong and you get duplicate instances, silent nulls, or a class that cannot be injected at all.</p>`,
        `<p>Interviewers lean on this topic because it is impossible to bluff. You either know that <code>useValue</code> and <code>useFactory</code> solve different problems, or you do not. You either know why you cannot inject a plain TypeScript interface, or you have never hit the wall that <code>InjectionToken</code> exists to solve. The depth of your answer here is a direct proxy for how much real Angular you have shipped.</p>`,
        `<p>This is also the topic that makes libraries configurable. Every <code>provideRouter()</code>, <code>provideHttpClient()</code>, and <code>forRoot()</code> pattern you have ever called is, under the hood, returning provider definitions. Understanding providers is understanding how Angular's own building blocks are assembled.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>A <strong>provider</strong> is a recipe that tells an injector how to create the value for a given token. The token is the lookup key; the provider is the "how". The shorthand <code>providers: [MyService]</code> is sugar for the full form <code>{ provide: MyService, useClass: MyService }</code> — the token and the recipe happen to be the same class.</p>`,
        `{{fig:ch4-token-provider-injector.svg|Flow from token to provider to cached instance|inject(Token) asks the injector, which looks up the provider recipe, runs it once, caches the instance, and returns the same instance on later calls.}}`,
        `<p>There are four recipe shapes, and knowing which to reach for is the core skill:</p>`,
        `{{fig:ch4-provider-recipes.svg|The four provider recipes useClass useValue useFactory useExisting|useClass instantiates a class, useValue supplies a ready object, useFactory runs a function with deps, useExisting aliases an existing token.}}`,
        `<p>An <strong>injector</strong> is the container that stores these recipes and hands back instances. An <strong>injection token</strong> is what you use when the thing you want to inject is <em>not</em> a class — a config object, a string, a feature flag, a function — because at runtime TypeScript interfaces and types do not exist, so they cannot be DI keys.</p>`,

        `<h2>How it works</h2>`,
        `<p>Every provider is an object with a <code>provide</code> property (the token) and exactly one recipe property. The resolution mechanics are the same regardless of shape: the injector maps the token to the recipe, runs the recipe the first time the token is requested, caches the result, and returns the cache thereafter. What differs is the recipe.</p>`,
        `<p><strong><code>useClass</code></strong> — instantiate a class with <code>new</code>. The class's own constructor/field dependencies are resolved recursively through the same injector. This is the default and covers "I want a fresh implementation of this service." You can point a token at a <em>different</em> class: <code>{ provide: PaymentApi, useClass: FakePaymentApi }</code> makes every request for <code>PaymentApi</code> return a <code>FakePaymentApi</code>.</p>`,
        `<p><strong><code>useValue</code></strong> — supply a value exactly as given, no construction. Perfect for configuration objects, constants, and mocks. The injector never calls <code>new</code>; it just hands back the reference you provided. Because it is a shared reference, mutating it mutates it for everyone.</p>`,
        `<p><strong><code>useFactory</code></strong> — run a function and use its return value. Use this when the value must be <em>computed</em> — chosen conditionally, read from the environment, or assembled from other injected services listed in <code>deps</code>. The factory runs once (per injector) and its result is cached like any other instance.</p>`,
        `<p><strong><code>useExisting</code></strong> — alias one token to another. No new instance is created; the injector resolves the target token and returns <em>that same instance</em>. This is how you expose a narrow interface over a wider service: <code>{ provide: ReadOnlyStore, useExisting: Store }</code> hands both tokens the identical object. Contrast with <code>useClass</code>, which would create a second, independent instance.</p>`,
        `<p><strong>Injectors</strong> come in two families. The <em>EnvironmentInjector</em> is created by bootstrapping (<code>bootstrapApplication</code>'s <code>providers</code>), route <code>providers</code>, and lazy-loaded chunks; it holds app- and route-level services. The <em>ElementInjector</em> is created by each component and directive that declares a <code>providers</code> array; it is tied to the template's DOM structure. A lookup starts in the element's ElementInjector, walks up the element tree, and if it never matches, falls through to the EnvironmentInjector tree. That fall-through is why a component can inject a <code>root</code> service without providing it locally.</p>`,
        `<p><strong>Injection tokens</strong> exist because DI keys must survive to runtime. A TypeScript <code>interface AppConfig</code> is erased during compilation, so <code>inject(AppConfig)</code> would have no key. <code>const APP_CONFIG = new InjectionToken&lt;AppConfig&gt;('app.config')</code> creates a real runtime object you can both provide and inject, while the generic keeps full type safety. Tokens can also carry a <code>factory</code> so they have a default value even when nobody provides them explicitly. And <code>multi: true</code> lets many providers contribute to the <em>same</em> token, collecting an array — the mechanism behind HTTP interceptors and validators.</p>`,
        `<p>Resolution modifiers apply here too: <code>@Optional()</code> makes a missing token resolve to <code>null</code>, <code>@Self()</code> forbids walking to parents, <code>@SkipSelf()</code> forces the search to start at the parent, and <code>@Host()</code> caps the walk at the host component. With <code>inject()</code>, these are options: <code>inject(APP_CONFIG, { optional: true })</code>.</p>`,

        `<h2>Code examples</h2>`,
        `<p>All four recipes side by side:</p>`,
        `<pre><code class="language-typescript">import { InjectionToken } from '@angular/core';

export interface ApiConfig { baseUrl: string; retries: number; }
export const API_CONFIG = new InjectionToken&lt;ApiConfig&gt;('api.config');

export const providers = [
  // useClass: swap the concrete implementation
  { provide: PaymentApi, useClass: StripePaymentApi },

  // useValue: a ready-made config object
  { provide: API_CONFIG, useValue: { baseUrl: '/api', retries: 3 } },

  // useFactory: compute the value, pulling in other deps
  {
    provide: LoggerService,
    useFactory: (cfg: ApiConfig) =&gt; cfg.retries &gt; 0 ? new RetryLogger() : new PlainLogger(),
    deps: [API_CONFIG],
  },

  // useExisting: alias — both tokens share ONE instance
  { provide: ReadonlyStore, useExisting: Store },
];</code></pre>`,
        `<p>Defining and injecting a typed token — the only clean way to inject non-class config:</p>`,
        `<pre><code class="language-typescript">import { InjectionToken, inject, Injectable } from '@angular/core';

export const FEATURE_FLAGS = new InjectionToken&lt;Record&lt;string, boolean&gt;&gt;('flags', {
  providedIn: 'root',          // tree-shakable token with a built-in default
  factory: () =&gt; ({ darkMode: false }),
});

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private flags = inject(FEATURE_FLAGS);
  get isDark() { return this.flags.darkMode; }
}</code></pre>`,
        `<p>A <code>multi</code> token that collects contributions — how interceptor-style extension points work:</p>`,
        `<pre><code class="language-typescript">import { InjectionToken, inject, Injectable } from '@angular/core';

export const VALIDATORS = new InjectionToken&lt;Array&lt;(v: string) =&gt; boolean&gt;&gt;('validators');

export const providers = [
  { provide: VALIDATORS, useValue: (v: string) =&gt; v.length &gt; 0, multi: true },
  { provide: VALIDATORS, useValue: (v: string) =&gt; v.length &lt; 100, multi: true },
];

@Injectable({ providedIn: 'root' })
export class FormService {
  private rules = inject(VALIDATORS); // an ARRAY of both functions
  isValid(v: string) { return this.rules.every((r) =&gt; r(v)); }
}</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Trying to inject a TypeScript interface.</strong> Interfaces are erased at compile time and cannot be DI tokens. Use an <code>InjectionToken</code> instead.</li>`,
        `<li><strong>Confusing <code>useExisting</code> with <code>useClass</code>.</strong> <code>useExisting</code> aliases and shares one instance; <code>useClass</code> creates a second, independent one. Aliasing a service with <code>useClass</code> silently doubles your state.</li>`,
        `<li><strong>Forgetting <code>deps</code> on a <code>useFactory</code>.</strong> The factory's arguments come only from <code>deps</code>; omit it and your injected services arrive as <code>undefined</code>.</li>`,
        `<li><strong>Forgetting <code>multi: true</code> on both providers.</strong> Mixing multi and non-multi for the same token throws; a lone provider without <code>multi</code> replaces rather than appends.</li>`,
        `<li><strong>Mutating a <code>useValue</code> object.</strong> It is a shared reference — a change in one consumer leaks to all of them.</li>`,
        `<li><strong>Re-providing a <code>root</code> service in a component's <code>providers</code> by accident.</strong> That creates a second instance scoped to the component, breaking the "single source of truth" you assumed.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Reach for the simplest recipe that fits: <code>useValue</code> for constants, <code>useClass</code> for swaps, <code>useFactory</code> only when a value must be computed, <code>useExisting</code> for aliases.</li>`,
        `<li>Always type your <code>InjectionToken&lt;T&gt;</code> and give it a descriptive debug string.</li>`,
        `<li>Give tokens a <code>factory</code> default via <code>providedIn: 'root'</code> so they are tree-shakable and never "No provider".</li>`,
        `<li>Use <code>multi: true</code> deliberately for extension points (interceptors, validators, initializers) and document it.</li>`,
        `<li>Keep <code>useValue</code> objects immutable (freeze them, or type them <code>readonly</code>) to avoid shared-mutation bugs.</li>`,
        `<li>Prefer a factory function over subclassing when you only need conditional construction.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: What is the difference between a token and a provider?</strong><br>The token is the key you look up; the provider is the recipe that tells the injector how to produce the value for that key. <code>providers: [Svc]</code> is shorthand for a token and recipe that are the same class.</p></blockquote>`,
        `<blockquote><p><strong>Q: When would you use <code>useFactory</code> over <code>useClass</code>?</strong><br>When the value must be computed — chosen conditionally, read from the environment, or assembled from other injected services via <code>deps</code>. <code>useClass</code> only ever news up a fixed class.</p></blockquote>`,
        `<blockquote><p><strong>Q: <code>useExisting</code> vs <code>useClass</code> — what's the trap?</strong><br><code>useExisting</code> aliases to an already-created instance (shared); <code>useClass</code> creates a brand-new independent instance. Using <code>useClass</code> where you meant to alias silently duplicates state.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why can't you inject a TypeScript interface, and what's the fix?</strong><br>Interfaces and types are erased at compile time, so there is no runtime object to use as a DI key. Create an <code>InjectionToken&lt;T&gt;</code>, which is a real runtime value that still carries the type via its generic.</p></blockquote>`,
        `<blockquote><p><strong>Q: What does <code>multi: true</code> do?</strong><br>It lets multiple providers contribute to one token; <code>inject()</code> then returns an array of all contributions. It powers HTTP interceptors, <code>APP_INITIALIZER</code>, and validator collections.</p></blockquote>`,
        `<blockquote><p><strong>Q: What are the two injector families and how do they relate?</strong><br>EnvironmentInjector (bootstrap/routes/lazy — app-level services) and ElementInjector (component/directive <code>providers</code> — tied to the template). Element lookups walk the element tree and fall through to the environment tree if unmatched.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Provider</strong> = <code>{ provide: TOKEN, useX: ... }</code>. <code>[Svc]</code> = <code>{ provide: Svc, useClass: Svc }</code>.</li>`,
        `<li><strong>useClass</strong> new class · <strong>useValue</strong> ready object · <strong>useFactory</strong> run fn(+deps) · <strong>useExisting</strong> alias (shared instance).</li>`,
        `<li><strong>InjectionToken&lt;T&gt;</strong> for non-class deps (config, flags, functions) — interfaces can't be tokens.</li>`,
        `<li><strong>multi: true</strong> → inject returns an array (interceptors, initializers).</li>`,
        `<li><strong>Token default</strong>: <code>new InjectionToken(x, { providedIn: 'root', factory })</code>.</li>`,
        `<li><strong>Injectors</strong>: EnvironmentInjector (root/routes) + ElementInjector (component providers), element falls through to environment.</li>`,
        `<li><strong>useExisting ≠ useClass</strong>: alias shares one instance; useClass makes two.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    {
      title: 'Provider Scope: providedIn root vs module vs component',
      slug: 'provider-scope',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Scope is the single most common source of real-world DI bugs: two components that should share state but don't, or a service that should be per-widget but leaks state between them. Both are scope mistakes. Deciding <em>where</em> a provider lives is deciding <em>how many instances exist</em> and <em>how long they live</em> — and that decision quietly shapes your entire app's behaviour.</p>`,
        `<p>Interviewers probe scope because it reveals whether you think about lifetimes at all. A junior answer is "services are singletons." A strong answer is "a service is a singleton <em>within its injector</em>, and I choose the injector to control instance count and lifetime." That framing — instances follow injectors — is the whole topic.</p>`,
        `<p>Scope also intersects with bundle size. <code>providedIn: 'root'</code> is tree-shakable: if nothing injects the service, the compiler drops it. The older module-registration style is not. So scope is not just runtime behaviour; it affects what ships to the browser.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>The rule to burn in: <strong>you get one instance per injector that provides the token.</strong> Choosing scope is choosing which injector holds the provider. Three placements cover almost everything.</p>`,
        `{{fig:ch4-provider-scope.svg|Comparison of providedIn root versus component-level providers|providedIn root gives one tree-shakable app-wide singleton; a component providers array gives a fresh instance per component that dies with it.}}`,
        `<ul>`,
        `<li><strong><code>providedIn: 'root'</code></strong> — one instance for the entire application. The default and correct choice for the vast majority of services. Tree-shakable.</li>`,
        `<li><strong>Component <code>providers: [Svc]</code></strong> — a new instance for that component and its descendants, destroyed when the component is destroyed. Use for per-widget local state.</li>`,
        `<li><strong>Route / lazy <code>providers</code></strong> — one instance shared within a routed feature (and its lazy chunk), created when the route activates.</li>`,
        `</ul>`,
        `<p>The legacy <strong>NgModule <code>providers</code></strong> placement still exists but behaves surprisingly: a service provided in an <em>eagerly</em> loaded module is effectively app-wide (root), while one in a <em>lazy</em> module gets its own child injector instance. This ambiguity is exactly why <code>providedIn: 'root'</code> was introduced.</p>`,

        `<h2>How it works</h2>`,
        `<p>Under the hood, scope is entirely about which injector's recipe map holds the token. When you write <code>@Injectable({ providedIn: 'root' })</code>, Angular registers the provider on the root <em>EnvironmentInjector</em>. Every request for that token, from anywhere in the app, walks up to root, finds the single cached instance, and returns it. One injector, one cache slot, one instance — an app-wide singleton. Because the registration is attached to the class and only materialises when injected, unused services are tree-shaken out of the bundle.</p>`,
        `<p>When you list a service in a component's <code>providers</code> array, Angular attaches the provider to that component's <em>ElementInjector</em>. A fresh injector (and therefore a fresh cache) is created for each instance of the component. The service is constructed lazily on first injection within that subtree and destroyed when the component is destroyed — if it implements <code>OnDestroy</code>, its hook fires. Two sibling instances of the component get two independent service instances; a child component that injects the token receives its ancestor's instance because ElementInjector lookups walk <em>up</em> the element tree first.</p>`,
        `<p>Route-level providers sit on an EnvironmentInjector created for that route. This is the sweet spot for feature-scoped state: all components under <code>/orders</code> share one <code>OrderState</code>, created when you navigate in and — importantly — <em>not</em> automatically destroyed when you navigate away unless the route's injector is torn down (lazy routes create and can dispose their own environment injector). For lazy-loaded features, the lazy chunk gets its own child EnvironmentInjector, so a service provided there is a singleton <em>within that feature</em>, distinct from any root instance of the same token.</p>`,
        `<p>The two-tree model explains the resolution order precisely. A component asking for a token searches its ElementInjector chain (itself → parent elements → host component), and only when that misses does it fall through to the EnvironmentInjector chain (route injectors → root → platform → NullInjector). So a component-level provider <em>shadows</em> a root provider for that subtree: inside the component, <code>inject(Svc)</code> returns the local instance, while the rest of the app keeps the root one. This shadowing is a feature — it is how you give one branch of the UI its own copy — but it is also the classic "why do I have two instances?" trap.</p>`,
        `{{fig:ch4-injector-tree.svg|The hierarchical injector tree with resolution walking upward|A child element that lacks a local provider walks up to its parent component injector and then to the root injector; the first provider found wins.}}`,
        `<p>The recipe shapes (<code>useClass</code>, <code>useValue</code>, <code>useFactory</code>, <code>useExisting</code>) work identically at any scope — scope decides <em>which injector</em> holds the recipe, not how the value is built. And modifiers still apply: <code>@SkipSelf()</code> is the standard trick to <em>re-provide</em> a token locally while still reaching the shared ancestor instance, and <code>@Self()</code> asserts "this must be provided right here or fail."</p>`,

        `<h2>Code examples</h2>`,
        `<p>App-wide singleton — the default 90% case:</p>`,
        `<pre><code class="language-typescript">import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private token: string | null = null;   // one copy, shared by the whole app
  setToken(t: string) { this.token = t; }
  get isLoggedIn() { return this.token !== null; }
}</code></pre>`,
        `<p>Per-component instance — each widget gets its own isolated state that dies with it:</p>`,
        `<pre><code class="language-typescript">import { Component, Injectable, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Injectable() // NOT providedIn: 'root' — scoped by whoever provides it
export class DraftStore implements OnDestroy {
  draft = '';
  ngOnDestroy() { console.log('draft store torn down with its component'); }
}

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [FormsModule],
  providers: [DraftStore],           // new DraftStore per &lt;app-editor&gt;
  template: \`&lt;textarea [(ngModel)]="store.draft"&gt;&lt;/textarea&gt;\`,
})
export class EditorComponent {
  store = inject(DraftStore);         // two editors → two independent drafts
}</code></pre>`,
        `<p>Route-scoped state shared across a feature, using standalone route providers:</p>`,
        `<pre><code class="language-typescript">import { Routes } from '@angular/router';
import { OrderState } from './order-state';

export const orderRoutes: Routes = [
  {
    path: 'orders',
    providers: [OrderState],          // one OrderState shared by all children
    children: [
      { path: '', loadComponent: () =&gt; import('./order-list').then(m =&gt; m.OrderListComponent) },
      { path: ':id', loadComponent: () =&gt; import('./order-detail').then(m =&gt; m.OrderDetailComponent) },
    ],
  },
];</code></pre>`,
        `<p>Re-providing while still reaching the parent instance with <code>@SkipSelf()</code>:</p>`,
        `<pre><code class="language-typescript">import { Component, inject } from '@angular/core';
import { OrderState } from './order-state';

@Component({
  selector: 'app-panel',
  standalone: true,
  providers: [{ provide: OrderState, useClass: OrderState }], // local copy for this panel
  template: '',
})
export class PanelComponent {
  private local = inject(OrderState);                      // the panel's own instance
  private shared = inject(OrderState, { skipSelf: true }); // the ancestor's instance
}</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Accidentally re-providing a <code>root</code> service in a component.</strong> Adding it to a component's <code>providers</code> creates a second instance that shadows the singleton — state stops syncing and you chase a ghost bug.</li>`,
        `<li><strong>Expecting component-provided services to be shared app-wide.</strong> They are shared only within that component's subtree; siblings get separate instances.</li>`,
        `<li><strong>Assuming route-provided services are destroyed on navigation.</strong> They live for the lifetime of the route's injector; only lazy-route environment injectors dispose their services when torn down.</li>`,
        `<li><strong>Relying on eager-vs-lazy NgModule scope.</strong> An eager module's provider is app-wide; the same code in a lazy module makes a separate instance. This inconsistency is why <code>providedIn</code> exists.</li>`,
        `<li><strong>Putting stateful singletons at root when you meant per-instance.</strong> Shared mutable state across the app is a leak waiting to happen — scope it down or keep it stateless.</li>`,
        `<li><strong>Forgetting that <code>OnDestroy</code> only fires for scoped services.</strong> A root singleton never gets destroyed while the app runs.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Default to <code>providedIn: 'root'</code> — tree-shakable, app-wide, correct for stateless and shared-state services alike.</li>`,
        `<li>Use component <code>providers</code> deliberately when you want isolated, disposable per-instance state, and document why.</li>`,
        `<li>Use route <code>providers</code> for feature-scoped state that should not pollute the root injector.</li>`,
        `<li>Prefer standalone route/component providers over NgModule providers in new code to avoid eager-vs-lazy ambiguity.</li>`,
        `<li>Keep root singletons stateless or carefully manage their mutable state, since they live for the whole session.</li>`,
        `<li>When you must both re-provide and reach a parent, reach for <code>@SkipSelf()</code> rather than restructuring the tree.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: What does <code>providedIn: 'root'</code> actually give you?</strong><br>One tree-shakable, app-wide singleton registered on the root EnvironmentInjector. Every injection anywhere resolves to the same cached instance.</p></blockquote>`,
        `<blockquote><p><strong>Q: How many instances does a component-provided service have?</strong><br>One per component instance, scoped to that component and its descendants, destroyed with the component. Two siblings → two instances. (Trap: "one, it's a singleton" is wrong.)</p></blockquote>`,
        `<blockquote><p><strong>Q: Why was <code>providedIn: 'root'</code> introduced over NgModule providers?</strong><br>Tree-shakability plus consistent scope. Module providers behave differently for eager (app-wide) vs lazy (own instance) modules; <code>providedIn</code> removes that ambiguity and drops unused services from the bundle.</p></blockquote>`,
        `<blockquote><p><strong>Q: You have two instances of a service you expected to be shared — why?</strong><br>Almost certainly it is re-provided in a component's (or lazy feature's) <code>providers</code> array, creating a shadowing child instance that hides the root singleton for that subtree.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you scope state to a routed feature without touching root?</strong><br>Put the service in the route's <code>providers</code> array. All components under that route share one instance, and a lazy route gets its own disposable environment injector.</p></blockquote>`,
        `<blockquote><p><strong>Q: When does a service's <code>ngOnDestroy</code> run?</strong><br>Only for scoped services (component/lazy-route), when their injector is torn down. Root singletons are never destroyed during the app's lifetime.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Rule</strong>: one instance per injector that provides the token.</li>`,
        `<li><strong>root</strong> → app-wide singleton, tree-shakable, default.</li>`,
        `<li><strong>component providers</strong> → new instance per component, dies with it (OnDestroy fires).</li>`,
        `<li><strong>route providers</strong> → shared across a feature; lazy route = own disposable injector.</li>`,
        `<li><strong>NgModule</strong> → eager = app-wide, lazy = own instance (ambiguous — avoid in new code).</li>`,
        `<li><strong>Shadowing</strong>: local provider hides the root one for that subtree = classic "two instances" bug.</li>`,
        `<li><strong>@SkipSelf()</strong> to re-provide locally yet still reach the ancestor instance.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    {
      title: 'The Hierarchical Injector Tree',
      slug: 'hierarchical-injectors',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Angular's DI is not a flat lookup table — it is a <em>tree</em> of injectors that mirrors your application's structure, and resolution is a walk up that tree. Almost every advanced DI behaviour you will ever debug — shadowing, "No provider" despite a registration existing, why a directive sees a different instance than its host — comes down to how the hierarchy is walked. This is the mental model that turns DI from magic into mechanics.</p>`,
        `<p>Interviewers love this topic because it is deep enough to have layers. The surface answer ("injectors have parents") is easy; the payoff is explaining the <em>two</em> parallel trees, the exact resolution order across them, and how <code>@Self</code>/<code>@SkipSelf</code>/<code>@Host</code>/<code>@Optional</code> steer the walk. Command of the hierarchy is what distinguishes an Angular architect from an Angular user.</p>`,
        `<p>It also matters for architecture. Feature isolation, plugin systems, per-dialog state, and overridable defaults are all built by placing providers at the right level of the tree. You cannot design these intentionally without understanding the tree.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>Every component and directive can have its own injector, and each injector has a <strong>parent</strong>. When you ask for a dependency, Angular looks in the current injector; if it is not there, it asks the parent, then the grandparent, all the way up. The <strong>first injector that has a provider wins</strong>, and the search stops. If it reaches the top with nothing, it hits the <code>NullInjector</code> and throws "No provider."</p>`,
        `{{fig:ch4-injector-tree.svg|The hierarchical injector tree with upward resolution|A child element without a local provider walks up to its parent component injector and then to the root injector; the first provider found wins the lookup.}}`,
        `<p>The twist that most explanations skip: there are actually <strong>two</strong> trees. The <em>ElementInjector</em> tree follows your template/DOM structure (components and directives). The <em>EnvironmentInjector</em> tree follows your app's bootstrap and route structure (root, routes, lazy chunks). A lookup walks the ElementInjector chain first, and only if that fails does it fall through into the EnvironmentInjector chain.</p>`,
        `{{fig:ch4-two-injector-trees.svg|The Element and Environment injector trees running in parallel|Element lookups search the ElementInjector chain first and fall through to the EnvironmentInjector chain (route, root, platform) if unmatched.}}`,

        `<h2>How it works</h2>`,
        `<p>Resolution proceeds in a strict order, and knowing it lets you predict any DI outcome. When an element requests a token, Angular starts at that element's <strong>ElementInjector</strong> and walks up the <em>element</em> hierarchy: the element's own directives/providers, then its parent element, and so on up to the host component's element. This chain is defined by DOM nesting, not by JavaScript class relationships. If any injector in that chain has a provider for the token, its (cached) instance is returned immediately.</p>`,
        `<p>If the ElementInjector chain is exhausted without a match, resolution <strong>falls through</strong> to the <strong>EnvironmentInjector</strong> chain: the nearest route injector, up through parent routes, to the root injector created at bootstrap, then the platform injector, and finally the <code>NullInjector</code>, whose only job is to throw <code>NG0201</code>. This two-phase order is why a component can inject a <code>providedIn: 'root'</code> service without any local provider — the element chain misses and the environment chain supplies it.</p>`,
        `<p>Because the first match wins, a provider lower in the tree <strong>shadows</strong> the same token higher up. Provide <code>Store</code> at a component and, for that component's subtree, <code>inject(Store)</code> returns the local instance while the rest of the app still sees the root instance. This is the mechanism behind per-feature and per-dialog state — and the cause of accidental "duplicate instance" bugs when you re-provide unintentionally.</p>`,
        `<p>Four modifiers steer the walk, and interviewers test them precisely:</p>`,
        `{{fig:ch4-resolution-modifiers.svg|The four resolution modifiers Self SkipSelf Optional and Host|Self restricts to the current injector, SkipSelf starts at the parent, Optional returns null instead of throwing, and Host stops the walk at the host component boundary.}}`,
        `<ul>`,
        `<li><strong><code>@Self()</code></strong> — search <em>only</em> the current injector; do not walk up. Throws if not found locally (unless combined with <code>@Optional</code>). Use to assert a provider must exist right here.</li>`,
        `<li><strong><code>@SkipSelf()</code></strong> — skip the current injector and start at the parent. The standard way to re-provide a token locally yet still reach the shared ancestor instance.</li>`,
        `<li><strong><code>@Optional()</code></strong> — if no provider is found anywhere on the walk, return <code>null</code> instead of throwing. Use for genuinely optional collaborators.</li>`,
        `<li><strong><code>@Host()</code></strong> — walk up but stop at the host component's boundary; do not cross into the parent component. Essential for content-projection scenarios where a directive should only see providers within its host.</li>`,
        `</ul>`,
        `<p>With the <code>inject()</code> function these become an options object: <code>inject(Token, { self: true, optional: true })</code>, <code>{ skipSelf: true }</code>, <code>{ host: true }</code>. The semantics are identical to the decorators; only the syntax differs. Modifiers can combine — <code>@Self() @Optional()</code> means "only look locally, and give me null if it's not there."</p>`,
        `<p>One subtlety about the two trees: the ElementInjector tree's <em>root</em> logically connects to the EnvironmentInjector tree, which is why the fall-through works seamlessly. The EnvironmentInjector chain itself is created by structural events — <code>bootstrapApplication</code> makes the root environment injector, each lazy route can make a child environment injector, and <code>createEnvironmentInjector</code> lets you make one manually. So the tree you walk is assembled from both your template nesting <em>and</em> your routing/bootstrap structure at once.</p>`,

        `<h2>Code examples</h2>`,
        `<p>Shadowing in action — a child re-provides and diverges from the root instance:</p>`,
        `<pre><code class="language-typescript">import { Component, Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Counter { value = 0; }

@Component({
  selector: 'app-child',
  standalone: true,
  providers: [Counter],                 // shadows the root Counter for this subtree
  template: \`child: {{ c.value }}\`,
})
export class ChildComponent {
  c = inject(Counter);                  // a fresh Counter, independent of root
  constructor() { this.c.value = 99; }  // does NOT affect the root instance
}</code></pre>`,
        `<p><code>@Optional()</code> for a dependency that may or may not be provided:</p>`,
        `<pre><code class="language-typescript">import { Component, inject } from '@angular/core';
import { AnalyticsService } from './analytics.service';

@Component({ selector: 'app-cta', standalone: true, template: '' })
export class CtaComponent {
  // null when no AnalyticsService is provided anywhere up the tree
  private analytics = inject(AnalyticsService, { optional: true });

  track() { this.analytics?.event('cta_click'); } // safe no-op if absent
}</code></pre>`,
        `<p><code>@Self()</code> — asserting a dependency lives on this very element:</p>`,
        `<pre><code class="language-typescript">import { Directive, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({ selector: '[appHighlightInvalid]', standalone: true })
export class HighlightInvalidDirective {
  // self: the control MUST be on this same element, not a parent
  private control = inject(NgControl, { self: true, optional: true });

  get invalid() { return this.control?.invalid ?? false; }
}</code></pre>`,
        `<p><code>@SkipSelf()</code> — deliberately reaching the enclosing form's instance:</p>`,
        `<pre><code class="language-typescript">import { Component, inject } from '@angular/core';
import { FormRoot } from './form-root';

@Component({
  selector: 'app-field',
  standalone: true,
  providers: [{ provide: FormRoot, useClass: FormRoot }], // local re-provide
  template: '',
})
export class FieldComponent {
  private local = inject(FormRoot);                     // this field's own
  private parent = inject(FormRoot, { skipSelf: true }); // the enclosing form's
}</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Thinking DI is a flat map.</strong> It is a hierarchy walked bottom-up; the nearest provider wins, so placement matters as much as registration.</li>`,
        `<li><strong>Forgetting the two-tree fall-through.</strong> Element lookups only reach root services because the ElementInjector chain falls through to the EnvironmentInjector chain — miss that and root injection looks like magic.</li>`,
        `<li><strong>Confusing template nesting with class inheritance.</strong> The ElementInjector chain follows DOM nesting, not TypeScript <code>extends</code>. A child class does not inherit its parent's providers.</li>`,
        `<li><strong>Using <code>@Self()</code> where you meant <code>@Host()</code> (or vice versa).</strong> <code>@Self</code> is the single injector; <code>@Host</code> allows walking up to the host boundary. They behave differently across content projection.</li>`,
        `<li><strong>Expecting <code>@SkipSelf()</code> without a local provider to be useful.</strong> If nothing is provided locally, <code>@SkipSelf</code> just resolves to the same ancestor a normal lookup would — its point is pairing with a local re-provide.</li>`,
        `<li><strong>Assuming "No provider" means a bug in Angular.</strong> It means the walk reached NullInjector — the token was never provided in any injector on the path from the requesting element to root.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Place providers at the lowest level that still covers everyone who needs the instance — root for app-wide, component/route for scoped.</li>`,
        `<li>Use shadowing intentionally for per-feature or per-dialog state; never let it happen by accident.</li>`,
        `<li>Reach for <code>@Optional()</code> on genuinely optional collaborators so absence degrades gracefully instead of throwing.</li>`,
        `<li>Use <code>@Self()</code> to enforce co-location (e.g. a directive that must sit on a form control), and <code>@Host()</code> for content-projection boundaries.</li>`,
        `<li>Prefer the <code>inject()</code> options object over stacked decorators in new code for readability.</li>`,
        `<li>When debugging DI, trace the path from the requesting element up both trees — the bug is almost always a provider at the wrong level.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: How does Angular resolve a dependency in the injector tree?</strong><br>It starts at the requesting element's ElementInjector and walks up the element chain; if unmatched it falls through to the EnvironmentInjector chain (route → root → platform); the first provider found wins, and reaching NullInjector throws "No provider."</p></blockquote>`,
        `<blockquote><p><strong>Q: What are the two injector hierarchies and why two?</strong><br>ElementInjector (template/DOM structure — component & directive providers) and EnvironmentInjector (bootstrap/route structure — root and lazy services). Splitting them lets template scope and app/route scope coexist, with element lookups falling through to environment ones.</p></blockquote>`,
        `<blockquote><p><strong>Q: Difference between <code>@Self()</code> and <code>@SkipSelf()</code>?</strong><br><code>@Self</code> searches only the current injector and fails if it's not there; <code>@SkipSelf</code> ignores the current injector and starts at the parent. They are opposites, and pairing <code>@SkipSelf</code> with a local re-provide is how you reach an ancestor instance.</p></blockquote>`,
        `<blockquote><p><strong>Q: What does <code>@Host()</code> do that <code>@Self()</code> doesn't?</strong><br><code>@Host</code> allows walking <em>up</em> to the host component's boundary and stops there; <code>@Self</code> never walks at all. <code>@Host</code> is used with content projection so a directive sees its host's providers but not the outer component's.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why does a child component sometimes see a different service instance than its parent?</strong><br>Because the child (or something between it and the parent) re-provides the token, creating a shadowing instance lower in the tree; the child's lookup finds the nearer one first.</p></blockquote>`,
        `<blockquote><p><strong>Q: What is the NullInjector and when do you meet it?</strong><br>The sentinel at the very top of the environment chain. When resolution reaches it, no provider was found on the entire path, so it throws NG0201 "No provider for X." (Trap: use <code>@Optional()</code> to get <code>null</code> instead.)</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Resolution</strong>: element chain (up DOM) → fall through to environment chain (route → root → platform) → NullInjector throws.</li>`,
        `<li><strong>First provider wins</strong>; a lower provider <em>shadows</em> a higher one for that subtree.</li>`,
        `<li><strong>Two trees</strong>: ElementInjector (providers array, template) + EnvironmentInjector (root, routes, lazy).</li>`,
        `<li><strong>@Self</strong> here only · <strong>@SkipSelf</strong> start at parent · <strong>@Optional</strong> null not throw · <strong>@Host</strong> stop at host.</li>`,
        `<li><strong>inject() form</strong>: <code>inject(T, { self, skipSelf, optional, host })</code>.</li>`,
        `<li><strong>DOM nesting ≠ class inheritance</strong>: providers follow the template, not <code>extends</code>.</li>`,
        `<li><strong>"No provider"</strong> = walk reached NullInjector = token provided at wrong level (or not at all).</li>`,
        `</ul>`,
      ].join('\n'),
    },

    {
      title: 'The inject() Function',
      slug: 'inject-function',
      order: 4,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>The <code>inject()</code> function (stable since v14, now the idiomatic default in v17+) changed how Angular code is written. It replaced verbose constructor parameter lists with concise field initialisers and — more importantly — unlocked <em>reusable DI logic</em> in plain functions. Modern Angular guides, the official style, and virtually every new library assume <code>inject()</code>. If your code still leads with constructor injection everywhere, you are writing pre-2022 Angular.</p>`,
        `<p>Interviewers ask about <code>inject()</code> not just to check syntax, but to test whether you understand the concept it depends on: the <strong>injection context</strong>. The single most common <code>inject()</code> bug — calling it too late and getting <code>NG0203</code> — is impossible to debug without that concept. Explaining <em>when</em> <code>inject()</code> is allowed to run is the real test.</p>`,
        `<p>It also matters for composition. Because <code>inject()</code> is a function call rather than a constructor parameter, you can factor DI into helper functions (<code>injectParams()</code>, <code>injectDestroy()</code>) that any component reuses. That pattern — DI functions — is one of the biggest ergonomic wins in modern Angular, and it only exists because of <code>inject()</code>.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p><code>inject(Token)</code> asks the current injector for the value of a token and returns it — the same resolution you would get from a constructor parameter, but written as a function call. You typically use it as a class field initialiser, which is cleaner than threading everything through the constructor.</p>`,
        `{{fig:ch4-inject-vs-constructor.svg|Comparison of inject function and constructor injection|inject works in field initializers with an options object and composes into reusable functions; constructor injection needs parameter decorators and is harder to reuse.}}`,
        `<p>The one rule that governs everything: <strong><code>inject()</code> may only be called within an <em>injection context</em>.</strong> That means during construction — in a constructor, a field initialiser, or a factory function (like a provider's <code>useFactory</code> or an <code>InjectionToken</code> factory). Call it later, from a random method, a subscription callback, or a <code>setTimeout</code>, and Angular throws <code>NG0203: inject() must be called from an injection context</code>.</p>`,

        `<h2>How it works</h2>`,
        `<p>Angular maintains, during certain operations, a notion of "the current injector" — the injection context. When a component or service is being constructed, Angular sets the current injector to that instance's injector and then runs the class body. Field initialisers and the constructor execute <em>inside</em> this window, so any <code>inject()</code> call there can see the current injector and resolve tokens against it. Once construction finishes, the window closes: the current injector is unset, and later <code>inject()</code> calls have nothing to resolve against — hence <code>NG0203</code>.</p>`,
        `<p>Mechanically, <code>inject(Token)</code> performs the exact same resolution as constructor injection: it identifies the token, walks the injector hierarchy (ElementInjector chain, then fall-through to the EnvironmentInjector chain), returns the first cached-or-constructed instance, and throws "No provider" at the NullInjector if nothing matches. It accepts the same resolution modifiers as an options object: <code>inject(Token, { optional: true })</code> returns <code>null</code> instead of throwing, and <code>{ self, skipSelf, host }</code> steer the walk exactly like the <code>@Self</code>/<code>@SkipSelf</code>/<code>@Host</code> decorators. The recipe shapes (<code>useClass</code>/<code>useValue</code>/<code>useFactory</code>/<code>useExisting</code>) are irrelevant to the caller — <code>inject()</code> just returns whatever the resolved provider produces.</p>`,
        `<p>Because it is a plain function, <code>inject()</code> composes. You can write a helper like <code>function injectId() { return inject(ActivatedRoute).snapshot.params['id']; }</code> and call it from any component's field initialiser; the helper runs inside the caller's injection context and resolves against the caller's injector. This is the "DI function" pattern, and it is why modern utilities (e.g. <code>takeUntilDestroyed()</code>, <code>toSignal()</code>) can grab their own dependencies without you passing anything in.</p>`,
        `<p>When you genuinely need to inject <em>after</em> construction — say inside an event handler — you have two escape hatches. Capture an <code>Injector</code> during construction (<code>private injector = inject(Injector)</code>) and later call <code>runInInjectionContext(this.injector, () =&gt; inject(Token))</code>, which temporarily re-opens an injection context. Or simply resolve the dependency up front as a field and reference it later; usually that is the right answer, and <code>runInInjectionContext</code> is reserved for dynamic cases.</p>`,
        `<p>Constructor injection still works and is not deprecated. It remains necessary in a few spots: some third-party base classes require constructor parameters, and abstract-class inheritance patterns can need it. But for new application code, <code>inject()</code> is preferred because it removes decorator noise, avoids <code>super()</code> plumbing in subclasses, and enables the reusable-function pattern that constructor parameters cannot express. The two are fully interoperable — you can mix them in the same class if you must, though it is cleaner not to.</p>`,

        `<h2>Code examples</h2>`,
        `<p>Field-initialiser injection — the everyday form, no constructor needed:</p>`,
        `<pre><code class="language-typescript">import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

@Component({ selector: 'app-user', standalone: true, template: '' })
export class UserComponent {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  user$ = this.http.get(\`/api/users/\${this.route.snapshot.params['id']}\`);
}</code></pre>`,
        `<p>Options object for optional and scoped resolution — the <code>inject()</code> equivalent of the decorators:</p>`,
        `<pre><code class="language-typescript">import { Component, inject } from '@angular/core';
import { TOOLTIP_CONFIG, EventBus } from './tokens';

@Component({ selector: 'app-widget', standalone: true, template: '' })
export class WidgetComponent {
  // null if no config is provided anywhere up the tree
  private config = inject(TOOLTIP_CONFIG, { optional: true });
  // only the parent's instance, never this element's own
  private parentBus = inject(EventBus, { skipSelf: true, optional: true });
}</code></pre>`,
        `<p>The reusable DI-function pattern — factor injection into a shared helper:</p>`,
        `<pre><code class="language-typescript">import { Component, inject, DestroyRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// Runs inside the CALLER's injection context when used as a field initialiser.
export function injectRouteParam(name: string): string | null {
  return inject(ActivatedRoute).snapshot.paramMap.get(name);
}

@Component({ selector: 'app-order', standalone: true, template: '' })
export class OrderComponent {
  id = injectRouteParam('id');          // clean, reusable, no constructor
  private destroyRef = inject(DestroyRef);
}</code></pre>`,
        `<p>Injecting after construction with <code>runInInjectionContext</code> — the escape hatch:</p>`,
        `<pre><code class="language-typescript">import { Component, inject, Injector, runInInjectionContext } from '@angular/core';
import { HeavyService } from './heavy.service';

@Component({ selector: 'app-lazy', standalone: true, template: '' })
export class LazyComponent {
  private injector = inject(Injector);  // captured during construction

  async onDemand() {
    // Re-open an injection context to inject a dependency later.
    const svc = runInInjectionContext(this.injector, () =&gt; inject(HeavyService));
    svc.run();
  }
}</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Calling <code>inject()</code> outside an injection context.</strong> In a method, a subscribe callback, a <code>setTimeout</code>, or a lifecycle hook like <code>ngOnInit</code>, it throws <code>NG0203</code>. Resolve dependencies during construction instead.</li>`,
        `<li><strong>Assuming <code>ngOnInit</code> is an injection context.</strong> It is not — only the constructor, field initialisers, and factories are. Move <code>inject()</code> calls to fields.</li>`,
        `<li><strong>Overusing <code>runInInjectionContext</code>.</strong> It is an escape hatch for genuinely dynamic cases; if you find yourself reaching for it often, you probably should have injected the dependency up front.</li>`,
        `<li><strong>Mixing constructor and field injection carelessly.</strong> It works but reads inconsistently; pick one style per class.</li>`,
        `<li><strong>Thinking <code>inject()</code> is a different DI system.</strong> It resolves through the exact same hierarchy and modifiers as constructor injection — only the call site differs.</li>`,
        `<li><strong>Forgetting the options object for optional deps.</strong> Plain <code>inject(MaybeMissing)</code> throws; you need <code>{ optional: true }</code> to get <code>null</code>.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Prefer <code>inject()</code> as field initialisers in new components, services, and directives for concise, decorator-free DI.</li>`,
        `<li>Extract repeated injection logic into small DI helper functions to reuse across classes.</li>`,
        `<li>Resolve all dependencies during construction; reference the stored fields later rather than injecting on demand.</li>`,
        `<li>Use the options object (<code>{ optional, self, skipSelf, host }</code>) instead of parameter decorators when using <code>inject()</code>.</li>`,
        `<li>Reserve <code>runInInjectionContext</code> for truly dynamic, post-construction injection, and capture the <code>Injector</code> up front.</li>`,
        `<li>Keep constructor injection for the rare cases that require it (certain base classes) and be consistent within a class.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: What is an injection context and why does <code>inject()</code> require one?</strong><br>It is the window during construction (constructor, field initialisers, factory functions) when Angular has a "current injector" set. <code>inject()</code> resolves against that current injector, so calling it outside the window (a method, callback, timeout) has nothing to resolve against and throws NG0203.</p></blockquote>`,
        `<blockquote><p><strong>Q: Is <code>inject()</code> a replacement for constructor injection, and is the constructor deprecated?</strong><br><code>inject()</code> is the preferred style for new code, but constructor injection is not deprecated and is still required by some base classes. They use the same resolution mechanism and are interoperable.</p></blockquote>`,
        `<blockquote><p><strong>Q: You call <code>inject()</code> in <code>ngOnInit</code> and get NG0203 — why?</strong><br>Lifecycle hooks run after construction, outside the injection context. Move the call to a field initialiser or the constructor. (Trap: many assume <code>ngOnInit</code> is "early enough" — it isn't.)</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you inject a dependency after construction, e.g. in a click handler?</strong><br>Capture an <code>Injector</code> during construction and wrap the later call in <code>runInInjectionContext(injector, () =&gt; inject(Token))</code> — or, better, inject it up front as a field and just use it later.</p></blockquote>`,
        `<blockquote><p><strong>Q: What is a "DI function" and why is it only possible with <code>inject()</code>?</strong><br>A plain function that calls <code>inject()</code> internally and runs in the caller's injection context, letting you reuse DI logic across classes. Constructor parameters can't be factored out like this because they're tied to the class signature.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you make an <code>inject()</code> dependency optional or scoped?</strong><br>Pass an options object: <code>inject(Token, { optional: true })</code> returns null instead of throwing; <code>{ self }</code>, <code>{ skipSelf }</code>, and <code>{ host }</code> mirror the <code>@Self</code>/<code>@SkipSelf</code>/<code>@Host</code> decorators.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>inject(Token)</strong> = constructor injection as a function call; use in field initialisers.</li>`,
        `<li><strong>Rule</strong>: only inside an injection context — constructor, field initialiser, factory. Else <code>NG0203</code>.</li>`,
        `<li><strong>ngOnInit / methods / callbacks are NOT injection contexts.</strong></li>`,
        `<li><strong>Options</strong>: <code>inject(T, { optional, self, skipSelf, host })</code> mirror the decorators.</li>`,
        `<li><strong>Same resolution</strong> as constructor DI: walks the hierarchy, "No provider" at NullInjector.</li>`,
        `<li><strong>DI functions</strong>: factor <code>inject()</code> into reusable helpers (run in caller's context).</li>`,
        `<li><strong>Late injection</strong>: capture <code>Injector</code>, use <code>runInInjectionContext()</code> — escape hatch only.</li>`,
        `</ul>`,
      ].join('\n'),
    },
  ],
};
