module.exports = {
  title: 'SSR, Hydration & Deferrable Views',
  slug: 'ssr-hydration',
  order: 8,
  topics: [
    {
      title: 'Why SSR? CSR vs SSR vs SSG',
      slug: 'why-ssr',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>The single biggest performance and SEO decision you make in an Angular app is <em>where the first HTML comes from</em>. A client-side-rendered (CSR) app ships an almost-empty <code>&lt;body&gt;</code> and a bundle of JavaScript; nothing meaningful appears until the browser downloads, parses, and executes that bundle, then Angular builds the DOM. On a fast laptop that is invisible; on a mid-range phone over 4G it is a blank white screen for two or three seconds. That gap is where you lose users, lose Core Web Vitals, and lose search rankings.</p>`,
        `<p>Interviewers open SSR discussions here because the rendering strategy touches everything a senior engineer is expected to reason about: time-to-first-byte (TTFB), first contentful paint (FCP), time-to-interactive (TTI), crawlability, caching, and infrastructure cost. Answering "just turn on SSR" without understanding the tradeoffs is a red flag. The strong answer names the three strategies, explains what each optimises, and picks per-route based on whether the content is public, personalised, or static. This topic gives you that decision framework before we touch a single line of setup code.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>There are three ways to produce the HTML a browser paints, and they differ only in <strong>when</strong> and <strong>where</strong> that HTML is generated.</p>`,
        `<p><strong>CSR (Client-Side Rendering).</strong> The server sends a near-empty shell. The browser downloads the JS bundle, boots Angular, and renders the DOM in the client. Fast to deploy, cheap to host on a CDN, but the first paint waits on JavaScript and crawlers may see an empty page.</p>`,
        `<p><strong>SSR (Server-Side Rendering).</strong> For each request, a Node server runs your Angular app, renders the component tree to an HTML string, and sends a fully-formed page. The user sees real content almost immediately; then the JS arrives and <em>hydrates</em> the page to make it interactive. Best for dynamic, per-user, SEO-sensitive pages.</p>`,
        `<p><strong>SSG / Prerender (Static Site Generation).</strong> The HTML is rendered once at <em>build time</em> and served as static files from a CDN. Blazing TTFB, trivially cacheable, but the content is frozen until the next build — ideal for docs, blogs, and marketing pages that do not change per request.</p>`,
        `{{fig:ch9-rendering-strategies.svg|Three columns comparing CSR, SSR and SSG rendering|CSR renders in the browser, SSR renders per request on a server, SSG renders once at build time.}}`,
        `<p>The mental model: CSR pushes all rendering work to the client, SSG does it all ahead of time, and SSR does it on demand per request. Modern Angular lets you mix them per route, so the marketing home page can be prerendered while the logged-in dashboard is CSR and the product page is SSR.</p>`,

        `<h2>How it works</h2>`,
        `<p>The metrics that separate these strategies are worth naming precisely, because interviewers use them as vocabulary checks.</p>`,
        `<table>`,
        `<thead><tr><th>Metric</th><th>Meaning</th><th>Who wins</th></tr></thead>`,
        `<tbody>`,
        `<tr><td>TTFB</td><td>Time to first byte from the server</td><td>SSG (static file) &gt; CSR &gt; SSR (must render first)</td></tr>`,
        `<tr><td>FCP</td><td>First contentful paint (user sees content)</td><td>SSR/SSG (real HTML) &gt;&gt; CSR (waits on JS)</td></tr>`,
        `<tr><td>TTI</td><td>Time to interactive (events work)</td><td>Similar once hydrated; SSR/SSG feel faster earlier</td></tr>`,
        `<tr><td>SEO</td><td>Crawlers see full content</td><td>SSR/SSG &gt;&gt; CSR (empty shell risk)</td></tr>`,
        `<tr><td>Cost</td><td>Compute per request</td><td>SSG/CSR (static) &gt; SSR (Node per request)</td></tr>`,
        `</tbody></table>`,
        `<p>Notice the tension: SSR wins FCP and SEO but has the <em>worst</em> TTFB of the three, because the server must execute the app before the first byte can leave. That is the tradeoff you are hired to manage — caching SSR output, keeping server render fast, and choosing SSG where content permits.</p>`,
        `{{fig:ch9-ssr-timeline.svg|Timeline comparing when CSR and SSR reach first paint and interactivity|SSR paints meaningful content early after the server HTML arrives while CSR waits for JS download and bootstrap.}}`,
        `<p><strong>Why CSR hurts SEO.</strong> Googlebot can execute JavaScript, but on a two-wave, deferred, best-effort schedule; other crawlers (many social-preview bots, some regional search engines) do not run JS at all. A CSR page served to a non-executing crawler is a blank shell — no title, no description, no content. SSR and SSG sidestep this entirely because the HTML already contains the content.</p>`,
        `<p><strong>Why SSR helps Core Web Vitals.</strong> Largest Contentful Paint (LCP) is driven by how fast the largest element paints. With SSR the hero image and headline are in the initial HTML, so LCP fires early. With CSR, LCP cannot happen until Angular has rendered, which is gated on the whole bundle. Cumulative Layout Shift (CLS) also improves because the server HTML reserves the correct layout, and non-destructive hydration reuses it without re-rendering.</p>`,
        `<p><strong>The hidden cost of SSR.</strong> Every request runs your app on the server, so a spike in traffic is a spike in CPU. You mitigate this with a CDN in front (cache public SSR responses for a few seconds), with SSG for anything that can be static, and by keeping resolvers fast. This is why "SSR everything" is wrong — you pay server cost for pages that gain nothing from it.</p>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. Choosing a strategy per route.</strong> Angular 17+ lets you declare a render mode per route with a server routing config, so one app mixes all three.</p>`,
        `<pre><code class="language-typescript">import { ServerRoute, RenderMode } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Prerendered at build time (SSG) — static marketing page
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'about', renderMode: RenderMode.Prerender },

  // Server-rendered per request (SSR) — dynamic, SEO-sensitive
  { path: 'product/:id', renderMode: RenderMode.Server },

  // Client-only (CSR) — private, no SEO value
  { path: 'dashboard/**', renderMode: RenderMode.Client },
];</code></pre>`,
        `<p><strong>2. Prerendering dynamic routes.</strong> For SSG of parameterised URLs, supply the list of params to generate at build time.</p>`,
        `<pre><code class="language-typescript">import { ServerRoute, RenderMode } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      const posts = await fetchAllPostSlugs();
      return posts.map(slug =&gt; ({ slug }));
    },
  },
];</code></pre>`,
        `<p><strong>3. Guarding browser-only code.</strong> On the server there is no <code>window</code> or <code>document</code>. Use <code>isPlatformBrowser</code> so code that touches the DOM or <code>localStorage</code> runs only in the browser.</p>`,
        `<pre><code class="language-typescript">import { Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({ selector: 'app-theme', standalone: true, template: '' })
export class ThemeComponent {
  private platformId = inject(PLATFORM_ID);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Safe: only runs in the browser, never during server render
      const saved = localStorage.getItem('theme');
      document.documentElement.dataset['theme'] = saved ?? 'light';
    }
  }
}</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Assuming SSR is always faster.</strong> SSR has the worst TTFB; it wins FCP and SEO, not raw speed. A slow resolver blocks the entire response.</li>`,
        `<li><strong>Touching <code>window</code>/<code>document</code>/<code>localStorage</code> at module or constructor level.</strong> These do not exist on the server and crash the render. Guard with <code>isPlatformBrowser</code> or move into <code>afterNextRender</code>.</li>`,
        `<li><strong>SSR-ing a private dashboard.</strong> Content behind a login has no SEO value and no anonymous FCP benefit; you just pay server cost. Use CSR.</li>`,
        `<li><strong>Prerendering pages with per-user data.</strong> SSG bakes the HTML once; a personalised page prerendered at build time shows the wrong user's data to everyone.</li>`,
        `<li><strong>Forgetting caching in front of SSR.</strong> Without a CDN or edge cache, every hit re-renders. Public SSR pages should be cacheable for at least a few seconds.</li>`,
        `<li><strong>Using <code>setTimeout</code>/<code>setInterval</code> during render.</strong> Pending macrotasks can keep the server render from settling; prefer resolving data cleanly.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Decide per route, not per app.</strong> Prerender static pages, SSR dynamic public pages, CSR private ones.</li>`,
        `<li><strong>Default to SSG where content allows</strong> — it is the cheapest and fastest, served straight from a CDN.</li>`,
        `<li><strong>Keep server renders fast:</strong> parallelise data fetching, set timeouts on resolvers, and cache upstream responses.</li>`,
        `<li><strong>Put a CDN/edge cache in front of SSR</strong> and set sensible <code>Cache-Control</code> for public pages.</li>`,
        `<li><strong>Measure with real metrics</strong> (Lighthouse, WebPageTest, field CWV) rather than guessing; verify FCP/LCP actually improved.</li>`,
        `<li><strong>Isolate browser-only APIs</strong> behind platform checks or <code>afterNextRender</code> so the same code runs on both platforms.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What's the difference between CSR, SSR, and SSG?"</strong><br>A: CSR renders in the browser after JS loads; SSR renders per request on a Node server; SSG renders once at build time and serves static files. They trade TTFB, FCP, SEO, and server cost. Follow-up trap: they may ask which has the best TTFB — it's SSG, not SSR.</p></blockquote>`,
        `<blockquote><p><strong>Q: "SSR is faster than CSR — true or false?"</strong><br>A: Partially. SSR is faster to <em>meaningful content</em> (FCP/LCP) and better for SEO, but it has the <em>worst</em> TTFB because the server must render before sending. Raw speed depends on which metric you mean.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why does a CSR SPA hurt SEO?"</strong><br>A: The initial HTML is an empty shell; crawlers that don't execute JS see no content, and even Googlebot defers JS rendering. SSR/SSG put the content in the HTML directly.</p></blockquote>`,
        `<blockquote><p><strong>Q: "When would you NOT use SSR?"</strong><br>A: For private, authenticated pages with no SEO value (dashboards, admin panels) — you pay server compute for zero benefit. Use CSR. And for purely static content, prefer SSG over SSR.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you decide the strategy for a given route?"</strong><br>A: Ask three questions: Is it public (SEO matters)? Does the content change per request/user? Is it the same for everyone? Static-and-public → SSG; dynamic-and-public → SSR; private → CSR.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What breaks when you enable SSR on existing code?"</strong><br>A: Direct access to <code>window</code>, <code>document</code>, <code>localStorage</code>, or third-party libs that assume a browser. They must be guarded with <code>isPlatformBrowser</code> or deferred to <code>afterNextRender</code>.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>CSR:</strong> renders in browser · empty shell · cheap · weak SEO · slow FCP.</li>`,
        `<li><strong>SSR:</strong> renders per request on Node · strong SEO · fast FCP · worst TTFB · server cost.</li>`,
        `<li><strong>SSG/Prerender:</strong> renders at build · CDN-served · best TTFB · frozen content.</li>`,
        `<li><strong>Metrics:</strong> TTFB (byte) · FCP (paint) · TTI (interactive) · LCP/CLS (CWV).</li>`,
        `<li><strong>Decide per route:</strong> <code>RenderMode.Prerender</code> / <code>.Server</code> / <code>.Client</code>.</li>`,
        `<li><strong>Guard browser APIs:</strong> <code>isPlatformBrowser(PLATFORM_ID)</code> or <code>afterNextRender()</code>.</li>`,
        `</ul>`,
      ].join('\n')
    },

    {
      title: 'Angular SSR Setup & Server Rendering',
      slug: 'angular-universal-setup',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>"Angular Universal" was the old name for the SSR story: a separate package (<code>@nguniversal/express-engine</code>), an <code>app.server.module.ts</code>, and a hand-maintained <code>server.ts</code>. Modern Angular (v17+ with the <code>@angular/ssr</code> package and the application builder) folded all of this into the CLI. Running <code>ng new my-app --ssr</code> or <code>ng add @angular/ssr</code> scaffolds the entire server pipeline for you. Knowing how the modern setup works — and how it differs from the legacy Universal setup — is exactly the kind of "have you kept up with Angular" signal interviewers probe for.</p>`,
        `<p>Beyond the interview, understanding the render pipeline is what lets you debug the two most common SSR failures: a page that crashes on the server (because it touched a browser API) and a page that renders blank content (because the server didn't wait for async data). Both come down to understanding what actually happens between the request arriving at Node and the HTML string being sent back. This topic walks that pipeline end to end.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>SSR needs <strong>two entry points</strong> for the same app: one that boots in the browser and one that boots on the server. In modern standalone Angular these are two small files that share your root component and merge configs.</p>`,
        `<p><strong>Browser entry</strong> (<code>main.ts</code>) calls <code>bootstrapApplication(AppComponent, appConfig)</code> with providers including <code>provideClientHydration()</code>. <strong>Server entry</strong> (<code>main.server.ts</code>) calls <code>bootstrapApplication(AppComponent, serverConfig)</code>, where <code>serverConfig</code> merges the app config with <code>provideServerRendering()</code>. A tiny <code>server.ts</code> wires an Express handler that asks the <code>AngularNodeAppEngine</code> to render the requested URL to HTML.</p>`,
        `{{fig:ch9-ssr-request-flow.svg|Flow from browser request through the Node server rendering the app to HTML and back|The Node server bootstraps the app with server providers, renders the DOM to a string with embedded state, and returns full HTML the client then hydrates.}}`,
        `<p>The key insight: it is the <em>same application</em> executed in a different environment. Your components, services, and templates don't change. What changes is the platform (<code>platform-server</code> instead of <code>platform-browser</code>), which swaps in a server-side DOM implementation and a rendering function that serialises that DOM to a string instead of painting pixels.</p>`,

        `<h2>How it works</h2>`,
        `<p>Here is the request lifecycle in detail, from the moment a browser hits an SSR route.</p>`,
        `<table>`,
        `<thead><tr><th>Step</th><th>What happens</th></tr></thead>`,
        `<tbody>`,
        `<tr><td>1. Request arrives</td><td>Node/Express receives <code>GET /product/42</code>; the handler delegates to <code>AngularNodeAppEngine.handle(request)</code>.</td></tr>`,
        `<tr><td>2. App bootstraps</td><td>A fresh app instance boots via <code>bootstrapApplication</code> with server providers on <code>platform-server</code>.</td></tr>`,
        `<tr><td>3. Router matches</td><td>The router resolves the URL, runs guards and resolvers; the app fetches data via <code>HttpClient</code>.</td></tr>`,
        `<tr><td>4. App stabilises</td><td>Angular waits for the app to become stable (no pending zone tasks / pending tasks) before serialising.</td></tr>`,
        `<tr><td>5. DOM serialised</td><td><code>renderApplication</code> serialises the server DOM to an HTML string, adding hydration annotations and TransferState.</td></tr>`,
        `<tr><td>6. Response sent</td><td>The full HTML is returned; the browser paints it immediately (fast FCP).</td></tr>`,
        `<tr><td>7. Client hydrates</td><td>The JS bundle loads, boots with <code>provideClientHydration()</code>, and reuses the existing DOM.</td></tr>`,
        `</tbody></table>`,
        `<p><strong>Why the app must stabilise.</strong> Step 4 is the one people miss. The server render can only serialise once — there is no "wait, re-render." So Angular blocks until the application reports it is stable. Historically this meant "no pending Zone.js macrotasks." In modern Angular, the <code>PendingTasks</code> service (and <code>pendingUntilEvent</code>) lets async work register itself so the server knows to wait. <code>HttpClient</code> requests register automatically, which is why data fetched in a resolver or via <code>httpResource</code> is present in the server HTML. A raw <code>setTimeout</code>, by contrast, may either delay the render or be dropped — which is why data fetching belongs in HTTP/resolvers, not timers.</p>`,
        `<p><strong>The application builder.</strong> Modern SSR uses the esbuild-based <code>@angular-devkit/build-angular:application</code> builder. Its <code>outputMode</code>/<code>ssr</code> options produce both a browser bundle and a server bundle plus prerendered pages in one build. This replaced the old dual-builder setup (<code>browser</code> + <code>server</code>) and the separate Universal engine. The output is a <code>dist/</code> folder with <code>browser/</code>, <code>server/</code>, and any prerendered HTML.</p>`,
        `<p><strong>Legacy vs modern.</strong> If you inherit an app with <code>app.server.module.ts</code>, <code>ngExpressEngine</code>, and <code>@nguniversal/*</code> imports, that is the NgModule-era Universal setup. The modern equivalent is standalone: <code>main.server.ts</code> + <code>app.config.server.ts</code> + <code>@angular/ssr</code>. The concepts are identical; only the wiring changed.</p>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. The browser config</strong> (<code>app.config.ts</code>) — note <code>provideClientHydration()</code>, which is what makes hydration non-destructive.</p>`,
        `<pre><code class="language-typescript">import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideClientHydration(withEventReplay()),
  ],
};</code></pre>`,
        `<p><strong>2. The server config</strong> (<code>app.config.server.ts</code>) — merges the browser config with server-rendering providers.</p>`,
        `<pre><code class="language-typescript">import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/ssr';
import { appConfig } from './app.config';

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering()],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);</code></pre>`,
        `<p><strong>3. The server bootstrap</strong> (<code>main.server.ts</code>) and the Node handler (<code>server.ts</code>).</p>`,
        `<pre><code class="language-typescript">// main.server.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

export default () =&gt; bootstrapApplication(AppComponent, config);

// server.ts (simplified)
import { AngularNodeAppEngine, writeResponseToNodeResponse } from '@angular/ssr/node';
import express from 'express';

const app = express();
const angularApp = new AngularNodeAppEngine();

app.get('**', async (req, res, next) =&gt; {
  const response = await angularApp.handle(req);
  if (response) {
    writeResponseToNodeResponse(response, res);
  } else {
    next();
  }
});</code></pre>`,
        `<p><strong>4. Running code only after render.</strong> <code>afterNextRender</code> runs its callback exclusively in the browser, after the first render — the clean replacement for <code>isPlatformBrowser</code> checks around DOM work.</p>`,
        `<pre><code class="language-typescript">import { Component, ElementRef, afterNextRender, viewChild } from '@angular/core';

@Component({ selector: 'app-chart', standalone: true, template: '&lt;canvas #cv&gt;&lt;/canvas&gt;' })
export class ChartComponent {
  private cv = viewChild&lt;ElementRef&lt;HTMLCanvasElement&gt;&gt;('cv');

  constructor() {
    afterNextRender(() =&gt; {
      // Browser-only: canvas + charting lib never touched on the server
      const ctx = this.cv()!.nativeElement.getContext('2d');
      drawChart(ctx);
    });
  }
}</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Fetching data with <code>setTimeout</code> or outside <code>HttpClient</code>.</strong> The server may serialise before it resolves, producing blank content. Use <code>HttpClient</code>/resolvers/<code>httpResource</code> so the pending task is tracked.</li>`,
        `<li><strong>Global mutable state in services.</strong> On the server, one process may serve many users; a singleton holding request-specific data leaks between requests. Keep request state request-scoped.</li>`,
        `<li><strong>Importing browser-only libraries at the top level.</strong> A charting or map library that reads <code>window</code> on import crashes the server render. Import it inside <code>afterNextRender</code> or dynamically.</li>`,
        `<li><strong>Forgetting <code>withFetch()</code>.</strong> The fetch-based <code>HttpClient</code> backend is required for correct SSR behaviour and TransferState integration.</li>`,
        `<li><strong>Confusing legacy Universal with modern SSR.</strong> Copy-pasting <code>ngExpressEngine</code> setup into a standalone app won't work; use <code>@angular/ssr</code>.</li>`,
        `<li><strong>Long-running or never-resolving async work.</strong> If the app never stabilises, the render hangs or times out. Bound your resolvers.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Scaffold with the CLI:</strong> <code>ng add @angular/ssr</code> wires the browser/server entries and <code>server.ts</code> correctly.</li>`,
        `<li><strong>Fetch through <code>HttpClient</code>/resolvers</strong> so pending tasks are tracked and the render waits for real data.</li>`,
        `<li><strong>Prefer <code>afterNextRender</code>/<code>afterEveryRender</code></strong> over manual platform checks for DOM and third-party browser libs.</li>`,
        `<li><strong>Keep services stateless or request-scoped</strong> to avoid cross-request leakage on the shared server process.</li>`,
        `<li><strong>Enable <code>withFetch()</code></strong> on <code>provideHttpClient</code> for correct SSR + transfer-cache behaviour.</li>`,
        `<li><strong>Test the server build</strong> (<code>ng build && node dist/&lt;app&gt;/server/server.mjs</code>) — dev mode hides many SSR-only crashes.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "How does Angular render a component on the server?"</strong><br>A: A Node process boots the same app on <code>platform-server</code>, the router resolves the URL and data, Angular waits for the app to stabilise, then <code>renderApplication</code> serialises the DOM to an HTML string with hydration markers and TransferState. Follow-up trap: it renders once — there's no re-render, which is why it must wait for stability.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why doesn't my server-rendered page show the fetched data?"</strong><br>A: The app serialised before the async work finished. Data must be fetched via <code>HttpClient</code>/resolver so its pending task is tracked; a bare <code>setTimeout</code> isn't awaited.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What's the difference between old Angular Universal and modern SSR?"</strong><br>A: Universal was the NgModule-era setup (<code>@nguniversal/express-engine</code>, <code>app.server.module</code>, <code>ngExpressEngine</code>). Modern SSR is standalone + <code>@angular/ssr</code> + the application builder, scaffolded by the CLI. Same concept, new wiring.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What does <code>provideServerRendering()</code> do versus <code>provideClientHydration()</code>?"</strong><br>A: <code>provideServerRendering()</code> goes in the <em>server</em> config and enables rendering the app to HTML. <code>provideClientHydration()</code> goes in the <em>browser</em> config and makes the client reuse the server DOM instead of rebuilding it.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you run browser-only code safely under SSR?"</strong><br>A: Guard with <code>isPlatformBrowser(PLATFORM_ID)</code>, or better, use <code>afterNextRender</code>/<code>afterEveryRender</code>, which only fire in the browser after render — no platform branching needed.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why can a singleton service cause bugs under SSR?"</strong><br>A: The server process is shared across requests; a singleton caching per-user data can leak one user's data into another's response. Keep request-specific state out of app-level singletons.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Scaffold:</strong> <code>ng add @angular/ssr</code> or <code>ng new app --ssr</code>.</li>`,
        `<li><strong>Two entries:</strong> <code>main.ts</code> (browser) + <code>main.server.ts</code> (server).</li>`,
        `<li><strong>Configs:</strong> <code>provideClientHydration()</code> (browser) · <code>provideServerRendering()</code> (server) · <code>mergeApplicationConfig</code>.</li>`,
        `<li><strong>Handler:</strong> <code>AngularNodeAppEngine.handle(req)</code> in <code>server.ts</code>.</li>`,
        `<li><strong>Render:</strong> boot → route/resolve → stabilise → serialise DOM → send HTML.</li>`,
        `<li><strong>Browser-only:</strong> <code>afterNextRender()</code> &gt; <code>isPlatformBrowser()</code>; fetch via <code>HttpClient(withFetch())</code>.</li>`,
        `</ul>`,
      ].join('\n')
    },

    {
      title: 'Hydration, Event Replay & Incremental Hydration',
      slug: 'hydration',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Hydration is the bridge between "the user sees content" and "the user can interact with it." Server rendering gets pixels on screen fast, but that HTML is inert — no click handlers, no reactivity. Hydration is the process where the client-side Angular app "adopts" the existing server DOM and wires up interactivity <em>without throwing the DOM away</em>. Before Angular 16, hydration was destructive: Angular deleted the server-rendered DOM and re-rendered from scratch, causing a visible flicker and a layout shift. Non-destructive hydration (stable in v17) fixed this, and it is now the default for any SSR app.</p>`,
        `<p>This is prime interview territory because hydration is where subtle, hard-to-debug bugs live: mismatches between server and client HTML, lost clicks during the hydration window, and the newest feature — incremental hydration via <code>@defer</code>. An engineer who can explain event replay and why a mismatch warning appears is demonstrably operating at a level above someone who just enabled SSR and moved on. Getting hydration right is also directly responsible for good CLS scores.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p><strong>Destructive hydration (old):</strong> the browser paints the server HTML, then Angular boots, deletes that DOM, and re-renders its own — the user sees a flash as content disappears and reappears. Wasted work and a layout shift.</p>`,
        `<p><strong>Non-destructive hydration (v17+):</strong> Angular walks the existing server DOM, matches it against the component tree it would have created, and <em>reuses</em> the nodes — attaching event listeners and internal data structures rather than recreating elements. No flicker, no re-render, better CLS. You opt in with a single provider: <code>provideClientHydration()</code>.</p>`,
        `{{fig:ch9-hydration-flow.svg|Comparison of destructive hydration re-rendering the DOM versus non-destructive hydration reusing it|Destructive hydration deletes and rebuilds the server DOM causing flicker while non-destructive hydration walks and reuses the existing nodes.}}`,
        `<p><strong>Event replay</strong> closes the gap between paint and interactivity. There's a window where the user can see (and click) a button, but the JS hasn't hydrated it yet — that click would be lost. With <code>withEventReplay()</code>, Angular records those early events and re-dispatches them once hydration finishes, so nothing is dropped.</p>`,
        `<p><strong>Incremental hydration</strong> takes it further: instead of hydrating the whole page at once, you mark regions with <code>@defer (hydrate ...)</code> so they hydrate lazily — on viewport, on interaction, and so on. Less JavaScript runs up front, so the page becomes usable sooner.</p>`,

        `<h2>How it works</h2>`,
        `<p><strong>Server annotations.</strong> During server render, Angular embeds tiny hydration annotations into the HTML — comment nodes and a serialized structure describing where components begin and end. These let the client match its component tree to the exact DOM nodes without guessing. This is why you should not hand-edit or post-process the server HTML: it can break the matching.</p>`,
        `<p><strong>The matching walk.</strong> On the client, hydration walks the DOM and the component tree in lockstep. For each node it expects, it finds the corresponding server node and claims it — reusing the element, attaching listeners, and hooking it into change detection. If what it finds matches what it expected, hydration succeeds silently.</p>`,
        `<p><strong>Hydration mismatches.</strong> If the client would have rendered <em>different</em> DOM than the server produced, Angular cannot safely reuse the node and logs a hydration mismatch warning (in dev) — then falls back to re-rendering that portion. Common causes are summarised below.</p>`,
        `<table>`,
        `<thead><tr><th>Cause</th><th>Why it mismatches</th></tr></thead>`,
        `<tbody>`,
        `<tr><td>Non-deterministic data</td><td><code>Date.now()</code>, <code>Math.random()</code> differ between server and client render.</td></tr>`,
        `<tr><td>Browser-only branching</td><td>Template shows different content when <code>window</code> exists vs not.</td></tr>`,
        `<tr><td>Invalid HTML nesting</td><td>e.g. a <code>&lt;div&gt;</code> inside a <code>&lt;p&gt;</code>; the browser "fixes" it, so the DOM no longer matches.</td></tr>`,
        `<tr><td>Direct DOM manipulation</td><td>Code mutating the DOM outside Angular before hydration runs.</td></tr>`,
        `<tr><td>Third-party DOM changes</td><td>Browser extensions or scripts injecting nodes into the hydrated region.</td></tr>`,
        `</tbody></table>`,
        `<p><strong>Event replay mechanics.</strong> With <code>withEventReplay()</code>, a small always-loaded script attaches capturing listeners at the document root before hydration. Any event that fires on a not-yet-hydrated element is queued. When the relevant component hydrates, Angular replays the queued events against the now-live listeners in order. This is the same idea as Google's <code>jsaction</code> library, brought into the framework.</p>`,
        `<p><strong>Incremental hydration mechanics.</strong> A <code>@defer (hydrate on viewport)</code> block is server-rendered normally (its content is in the HTML), but its JavaScript is <em>not</em> hydrated until the trigger fires. So the region is visible immediately (SEO-friendly, no CLS) yet costs no hydration CPU until the user scrolls to it or interacts. Under the hood the deferred chunk is fetched and hydrated on demand, marked by the same annotations.</p>`,
        `{{fig:ch9-incremental-hydration.svg|A page where the header hydrates eagerly while comment and chat regions hydrate on viewport and interaction|Incremental hydration keeps most regions dormant, hydrating each only when its trigger fires so less JS runs up front.}}`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. Enabling hydration with event replay.</strong> One provider turns on non-destructive hydration; <code>withEventReplay()</code> preserves early clicks.</p>`,
        `<pre><code class="language-typescript">import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    // ...
  ],
};</code></pre>`,
        `<p><strong>2. Skipping hydration for an un-hydratable subtree.</strong> When a region is managed by a non-Angular library (a chart, a map) that mutates the DOM, tell Angular to leave it alone with the <code>ngSkipHydration</code> attribute.</p>`,
        `<pre><code class="language-html">&lt;!-- Angular will NOT try to hydrate this subtree;
     it re-renders it on the client instead --&gt;
&lt;div ngSkipHydration&gt;
  &lt;third-party-widget&gt;&lt;/third-party-widget&gt;
&lt;/div&gt;</code></pre>`,
        `<p><strong>3. Fixing a mismatch from non-deterministic values.</strong> Rendering a timestamp directly differs between server and client. Compute display values after render, or use stable data.</p>`,
        `<pre><code class="language-typescript">import { Component, signal, afterNextRender } from '@angular/core';

@Component({
  selector: 'app-clock',
  standalone: true,
  // Server renders a placeholder; the live time is set only in the browser,
  // AFTER hydration, so server and client HTML match at hydration time.
  template: '&lt;span&gt;{{ now() ?? "—" }}&lt;/span&gt;',
})
export class ClockComponent {
  now = signal&lt;string | null&gt;(null);
  constructor() {
    afterNextRender(() =&gt; this.now.set(new Date().toLocaleTimeString()));
  }
}</code></pre>`,
        `<p><strong>4. Incremental hydration.</strong> The comments render on the server (good for SEO) but only hydrate when scrolled into view, saving upfront JS.</p>`,
        `<pre><code class="language-html">@defer (hydrate on viewport) {
  &lt;app-comments [postId]="postId" /&gt;
} @placeholder {
  &lt;div class="comments-skeleton"&gt;Loading comments…&lt;/div&gt;
}</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Invalid HTML nesting.</strong> A block element inside a <code>&lt;p&gt;</code>, or a <code>&lt;div&gt;</code> inside a <code>&lt;table&gt;</code> without <code>&lt;tbody&gt;</code>, gets "corrected" by the browser — the DOM no longer matches and hydration warns.</li>`,
        `<li><strong>Non-deterministic template values.</strong> <code>Date.now()</code>, <code>Math.random()</code>, or locale-dependent formatting rendered directly cause mismatches. Compute them after render.</li>`,
        `<li><strong>Manipulating the DOM before hydration.</strong> jQuery-style DOM edits or direct <code>nativeElement</code> mutations in constructors race hydration. Use <code>afterNextRender</code>.</li>`,
        `<li><strong>Forgetting <code>withEventReplay()</code>.</strong> Without it, clicks during the hydration window are silently lost — a subtle "the button didn't work the first time" bug.</li>`,
        `<li><strong>Overusing <code>ngSkipHydration</code>.</strong> It disables the hydration benefit for that subtree (full client re-render). Use it only for genuinely un-hydratable third-party regions.</li>`,
        `<li><strong>Blaming Angular for extension-induced mismatches.</strong> Password managers and ad blockers inject DOM; those warnings are environmental, not app bugs.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Always pair SSR with <code>provideClientHydration()</code></strong> — destructive re-render is strictly worse.</li>`,
        `<li><strong>Add <code>withEventReplay()</code></strong> so no interaction in the pre-hydration window is dropped.</li>`,
        `<li><strong>Keep templates deterministic:</strong> defer time/random/locale-sensitive values to <code>afterNextRender</code>.</li>`,
        `<li><strong>Write valid, well-nested HTML</strong> so the browser doesn't reshape the DOM out from under hydration.</li>`,
        `<li><strong>Reserve <code>ngSkipHydration</code></strong> for third-party DOM-owning widgets only, and document why.</li>`,
        `<li><strong>Use incremental hydration (<code>@defer hydrate</code>)</strong> for below-the-fold or interaction-gated regions to cut upfront JS.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is hydration and what changed in Angular 16/17?"</strong><br>A: Hydration wires interactivity onto server-rendered HTML. Pre-16 it was destructive — Angular deleted and re-rendered the DOM (flicker, CLS). From 16 (dev preview) and stable in 17, non-destructive hydration reuses the existing DOM via <code>provideClientHydration()</code>. Follow-up: it's opt-in through that one provider.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is event replay and why is it needed?"</strong><br>A: There's a gap between paint and interactivity; a click in that window would be lost. <code>withEventReplay()</code> records early events at the document root and re-dispatches them after hydration, so no interaction is dropped.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What causes a hydration mismatch?"</strong><br>A: The client would render different DOM than the server did — from non-deterministic values (<code>Date.now</code>, <code>Math.random</code>), browser-only branching, invalid HTML nesting the browser corrects, or DOM manipulation before hydration. Angular warns and re-renders that region.</p></blockquote>`,
        `<blockquote><p><strong>Q: "When would you use <code>ngSkipHydration</code>?"</strong><br>A: For a subtree owned by a non-Angular library that mutates the DOM (charts, maps, some jQuery plugins). It tells Angular to skip hydration and client-render that region instead. Trap: it forfeits the hydration benefit, so use sparingly.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is incremental hydration?"</strong><br>A: Hydrating regions lazily via <code>@defer (hydrate on ...)</code> instead of the whole page at once. The content is server-rendered (SEO, no CLS) but its JS hydrates only when a trigger fires — viewport, interaction, idle — cutting upfront JS and improving TTI.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How does the client know which DOM nodes belong to which components?"</strong><br>A: The server embeds hydration annotations (comment markers and a serialized structure) into the HTML; the client walks the DOM and component tree in lockstep and claims the matching nodes. That's why the server HTML must not be hand-edited.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Enable:</strong> <code>provideClientHydration(withEventReplay())</code>.</li>`,
        `<li><strong>Non-destructive:</strong> reuse server DOM, no flicker, better CLS (v17+ default).</li>`,
        `<li><strong>Event replay:</strong> queue pre-hydration events, re-dispatch after hydrate.</li>`,
        `<li><strong>Mismatch causes:</strong> random/time values · invalid nesting · pre-hydration DOM edits · browser branching.</li>`,
        `<li><strong>Escape hatch:</strong> <code>ngSkipHydration</code> for third-party DOM-owning subtrees.</li>`,
        `<li><strong>Incremental:</strong> <code>@defer (hydrate on viewport / interaction / idle)</code>.</li>`,
        `</ul>`,
      ].join('\n')
    },

    {
      title: 'Deferrable Views (@defer)',
      slug: 'deferrable-views',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Deferrable views — the <code>@defer</code> block introduced in Angular 17 — are the framework's built-in, declarative answer to lazy loading <em>anything</em>, not just routes. Before <code>@defer</code>, deferring a heavy component meant manual dynamic imports, <code>ViewContainerRef</code> gymnastics, and hand-rolled loading states. Now you wrap a template region in <code>@defer</code>, choose a trigger, and Angular splits that region and its dependencies into a separate bundle, loads it on demand, and manages placeholder/loading/error states for you. This is one of the highest-leverage performance tools in modern Angular and a guaranteed interview topic.</p>`,
        `<p>The reason it matters so much: initial bundle size is the dominant factor in TTI. A dashboard with a heavy chart library, a rich text editor, and a comments widget forces every user to download all of it before the page is interactive — even if they never scroll to the comments. <code>@defer</code> lets you ship only what's needed for the first paint and stream the rest in based on real user behaviour. It composes with incremental hydration too, so the same block can be both lazily loaded <em>and</em> lazily hydrated.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p>A <code>@defer</code> block has up to four parts. Only <code>@defer</code> itself is required; the others are optional companions.</p>`,
        `<ul>`,
        `<li><strong><code>@defer</code></strong> — the main content, lazy-loaded and swapped in when the trigger fires.</li>`,
        `<li><strong><code>@placeholder</code></strong> — shown <em>before</em> the trigger fires (the default resting state).</li>`,
        `<li><strong><code>@loading</code></strong> — shown <em>while</em> the deferred chunk is downloading.</li>`,
        `<li><strong><code>@error</code></strong> — shown if the chunk fails to load.</li>`,
        `</ul>`,
        `{{fig:ch9-defer-blocks.svg|The placeholder loading defer and error sub-blocks and their render order|The placeholder shows first then loading during download then the main defer content or the error block on failure.}}`,
        `<p>The <em>trigger</em> decides when loading starts. You can trigger <code>on idle</code> (default), <code>on viewport</code>, <code>on interaction</code>, <code>on hover</code>, <code>on timer(…)</code>, or <code>on immediate</code>, and gate it with a boolean via <code>when</code>. Separately, <code>prefetch</code> lets you fetch the chunk <em>early</em> (e.g. <code>prefetch on idle</code>) while still rendering only when the main trigger fires — so the swap is instant.</p>`,
        `{{fig:ch9-defer-triggers.svg|The six defer triggers idle viewport interaction hover timer and when plus prefetch|Each trigger decides when the lazy chunk is fetched and swapped in while prefetch fetches it early on a separate axis.}}`,

        `<h2>How it works</h2>`,
        `<p><strong>Build-time splitting.</strong> When the compiler sees a <code>@defer</code> block, it identifies every component, directive, and pipe used <em>only</em> inside that block and moves them into a separate lazy chunk. Crucially, those dependencies must be <strong>standalone</strong> and must not be referenced eagerly elsewhere in the same component — if they are, the compiler can't defer them and the block loads eagerly. This is why <code>@defer</code> is a standalone-era feature.</p>`,
        `<p><strong>Trigger semantics.</strong> Each trigger maps to a browser primitive:</p>`,
        `<table>`,
        `<thead><tr><th>Trigger</th><th>Fires when</th><th>Backed by</th></tr></thead>`,
        `<tbody>`,
        `<tr><td><code>on idle</code></td><td>Browser is idle (default)</td><td><code>requestIdleCallback</code></td></tr>`,
        `<tr><td><code>on viewport</code></td><td>Element scrolls into view</td><td><code>IntersectionObserver</code></td></tr>`,
        `<tr><td><code>on interaction</code></td><td>Click / keydown on placeholder</td><td>Event listeners</td></tr>`,
        `<tr><td><code>on hover</code></td><td>Pointer enters / focus</td><td><code>mouseenter</code> / <code>focusin</code></td></tr>`,
        `<tr><td><code>on timer(t)</code></td><td>After duration <code>t</code></td><td><code>setTimeout</code></td></tr>`,
        `<tr><td><code>on immediate</code></td><td>ASAP after render</td><td>Microtask</td></tr>`,
        `<tr><td><code>when expr</code></td><td>Boolean expression turns true</td><td>Change detection</td></tr>`,
        `</tbody></table>`,
        `<p><code>on viewport</code>, <code>on interaction</code>, and <code>on hover</code> need an anchor element. If the block has a <code>@placeholder</code>, that is the anchor by default; otherwise you must reference a template element by name, e.g. <code>on viewport(trigger)</code>. This is a common source of "why won't my defer fire" confusion.</p>`,
        `<p><strong>Prefetch is orthogonal.</strong> A block can have both a main trigger and a prefetch trigger: <code>@defer (on interaction; prefetch on idle)</code>. The chunk downloads during idle time, but the content only renders when the user interacts — so there's no download delay at interaction time. Prefetch is the trick for making <code>@defer</code> feel instant without loading everything upfront.</p>`,
        `<p><strong>Timing guards.</strong> <code>@placeholder</code> accepts a <code>minimum</code> duration and <code>@loading</code> accepts <code>minimum</code> and <code>after</code>. These prevent ugly flicker: <code>@loading (minimum 1s)</code> means once the spinner shows it stays at least a second; <code>@loading (after 100ms)</code> means don't even show a spinner for loads faster than 100ms. On a fast connection this avoids a spinner flashing for a few milliseconds.</p>`,
        `<p><strong>SSR behaviour.</strong> Under SSR without incremental hydration, a <code>@defer</code> block renders its <code>@placeholder</code> on the server by default, and the main content loads on the client. With incremental hydration configured, the main content can be server-rendered and hydrated on its trigger instead — the best of both worlds.</p>`,
        `<p><strong>OR-combined triggers.</strong> A single block may list several triggers separated by semicolons — <code>@defer (on hover; on timer(5s))</code> — and they are OR-combined: the first one to fire loads the block, and the rest are ignored. This lets you express intent like "load when the user shows interest, but load anyway after a few seconds so it's ready" without any imperative code. Prefetch triggers are listed the same way but on their own <code>prefetch</code> clause, so a block can have one render trigger set and one prefetch trigger set running independently.</p>`,
        `<p><strong>What actually ships in the chunk.</strong> It is worth being precise about the split boundary because it drives real bundle wins. The lazy chunk contains the deferred component's class, its template and styles, and any standalone components/directives/pipes it pulls in that nothing eager references. If a shared button component is used both inside and outside the block, it stays in the eager bundle — only the genuinely block-exclusive code moves. This is why measuring with the bundle analyzer after adding <code>@defer</code> matters: an unexpectedly large eager bundle usually means a "deferred" dependency is still referenced eagerly somewhere and couldn't be split out.</p>`,
        `<p><strong>Change detection and the <code>when</code> trigger.</strong> The <code>when</code> trigger is evaluated during change detection, so it reacts to signals and bound state like any other template expression. Once it becomes true and the block loads, it does <em>not</em> unload if the expression later turns false — <code>@defer</code> is one-way; it loads and stays. If you need to conditionally show and hide already-loaded content, combine <code>@defer (when …)</code> to load it once with an inner <code>@if</code> to toggle visibility afterwards.</p>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. Full block with all four states.</strong> A heavy comments component that loads when scrolled into view.</p>`,
        `<pre><code class="language-html">@defer (on viewport) {
  &lt;app-comments [postId]="postId" /&gt;
} @placeholder (minimum 500ms) {
  &lt;div class="skeleton"&gt;Comments&lt;/div&gt;
} @loading (after 100ms; minimum 1s) {
  &lt;app-spinner /&gt;
} @error {
  &lt;p&gt;Couldn't load comments. &lt;button (click)="retry()"&gt;Retry&lt;/button&gt;&lt;/p&gt;
}</code></pre>`,
        `<p><strong>2. Prefetch on idle, render on interaction.</strong> The chat widget's code downloads during idle time so opening it is instant.</p>`,
        `<pre><code class="language-html">@defer (on interaction; prefetch on idle) {
  &lt;app-chat-widget /&gt;
} @placeholder {
  &lt;button&gt;Open chat&lt;/button&gt;
}</code></pre>`,
        `<p><strong>3. Multiple triggers and a named anchor.</strong> Triggers are OR-combined; the first to fire wins. Here a named element is the viewport/hover anchor.</p>`,
        `<pre><code class="language-html">&lt;button #loadBtn&gt;Show report&lt;/button&gt;

@defer (on hover(loadBtn); on timer(5s)) {
  &lt;app-heavy-report /&gt;
} @placeholder {
  &lt;p&gt;Hover the button or wait 5s to load the report.&lt;/p&gt;
}</code></pre>`,
        `<p><strong>4. Conditional loading with <code>when</code>.</strong> Gate the deferred content on component state (e.g. a feature flag or a tab selection).</p>`,
        `<pre><code class="language-typescript">import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-settings',
  standalone: true,
  template: \`
    &lt;button (click)="showAdvanced.set(true)"&gt;Advanced&lt;/button&gt;
    @defer (when showAdvanced()) {
      &lt;app-advanced-settings /&gt;
    } @placeholder {
      &lt;p&gt;Advanced settings hidden&lt;/p&gt;
    }
  \`,
})
export class SettingsComponent {
  showAdvanced = signal(false);
}</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Deferred dependencies referenced eagerly elsewhere.</strong> If a component used in <code>@defer</code> is also used outside it (or isn't standalone), the compiler can't split it and it loads eagerly — silently defeating the point.</li>`,
        `<li><strong>Missing anchor for <code>on viewport</code>/<code>hover</code>/<code>interaction</code>.</strong> Without a <code>@placeholder</code> or a named trigger element, there's nothing to observe; the block never fires.</li>`,
        `<li><strong>No <code>@error</code> block.</strong> Network flakiness or a failed chunk load leaves the user stuck on the placeholder with no recovery. Always handle errors for network-triggered defers.</li>`,
        `<li><strong>Spinner flicker.</strong> Omitting <code>@loading (after …)</code> flashes a spinner for fast loads. Use <code>after</code>/<code>minimum</code> guards.</li>`,
        `<li><strong>Deferring above-the-fold content.</strong> <code>@defer</code>-ing the hero the user sees immediately just delays it. Defer below-the-fold or interaction-gated regions.</li>`,
        `<li><strong>Expecting the placeholder to be server-rendered as the real content.</strong> Without incremental hydration, SSR renders the placeholder, not the deferred content — check your SEO expectations.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Defer heavy, below-the-fold, or interaction-gated components</strong> (charts, editors, comment threads, chat).</li>`,
        `<li><strong>Pair a network trigger with <code>prefetch</code></strong> (e.g. <code>on interaction; prefetch on idle</code>) so the swap feels instant.</li>`,
        `<li><strong>Always provide <code>@placeholder</code> and <code>@error</code></strong> for anything loaded over the network.</li>`,
        `<li><strong>Use timing guards</strong> (<code>after</code>/<code>minimum</code>) to eliminate spinner flicker on fast connections.</li>`,
        `<li><strong>Keep deferred components standalone and self-contained</strong> so the compiler can actually split them.</li>`,
        `<li><strong>Combine with incremental hydration</strong> (<code>@defer (hydrate on …)</code>) when you want the content server-rendered for SEO but hydrated lazily.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What are deferrable views and why use them?"</strong><br>A: <code>@defer</code> blocks (Angular 17+) declaratively lazy-load a template region and its dependencies into a separate chunk, loaded on a trigger. They cut initial bundle size and improve TTI without manual dynamic imports. Follow-up: dependencies must be standalone and not referenced eagerly elsewhere.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What triggers are available?"</strong><br>A: <code>on idle</code> (default), <code>on viewport</code>, <code>on interaction</code>, <code>on hover</code>, <code>on timer(t)</code>, <code>on immediate</code>, and <code>when expr</code>. Viewport/hover/interaction need an anchor — the placeholder or a named element.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What's the difference between a trigger and prefetch?"</strong><br>A: The trigger decides when content <em>renders</em>; prefetch decides when the chunk <em>downloads</em>. Combining them (<code>on interaction; prefetch on idle</code>) downloads early so rendering on trigger is instant.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What are the four @defer sub-blocks?"</strong><br>A: <code>@defer</code> (main), <code>@placeholder</code> (before trigger), <code>@loading</code> (during download), <code>@error</code> (on failure). Only <code>@defer</code> is required.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): "My deferred component still loads in the main bundle — why?"</strong><br>A: It's referenced eagerly outside the <code>@defer</code> block (or isn't standalone), so the compiler can't split it. Move it so it's used only inside the block.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why use <code>@loading (after 100ms; minimum 1s)</code>?"</strong><br>A: To prevent spinner flicker: don't show a spinner for loads under 100ms, and once shown keep it at least 1s so it doesn't flash. Improves perceived stability.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Blocks:</strong> <code>@defer</code> · <code>@placeholder</code> · <code>@loading</code> · <code>@error</code>.</li>`,
        `<li><strong>Triggers:</strong> <code>on idle</code> (default) · <code>viewport</code> · <code>interaction</code> · <code>hover</code> · <code>timer(t)</code> · <code>immediate</code> · <code>when expr</code>.</li>`,
        `<li><strong>Prefetch:</strong> <code>prefetch on idle/hover</code> — download early, render on trigger.</li>`,
        `<li><strong>Guards:</strong> <code>@placeholder (minimum …)</code> · <code>@loading (after …; minimum …)</code>.</li>`,
        `<li><strong>Requirement:</strong> deferred deps must be standalone and not eagerly referenced.</li>`,
        `<li><strong>Combine:</strong> <code>@defer (hydrate on …)</code> for incremental hydration under SSR.</li>`,
        `</ul>`,
      ].join('\n')
    },

    {
      title: 'SEO, Title/Meta & TransferState',
      slug: 'seo-transferstate',
      order: 4,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>SSR gets your content into the initial HTML, but SEO needs more than raw content: each route needs the right <code>&lt;title&gt;</code>, meta description, canonical URL, and Open Graph tags so search engines and social platforms render correct previews. Angular's <code>Title</code> and <code>Meta</code> services let you set these per route, and under SSR they end up in the server HTML where crawlers actually read them. An interview candidate who says "SSR fixes SEO" but can't set a per-route meta description is missing half the story.</p>`,
        `<p>The second half of this topic — <code>TransferState</code> — is the SSR feature that most directly affects perceived performance and server load. Without it, an SSR app fetches data on the server to render, then fetches the <em>same</em> data again on the client during hydration: a double request, wasted bandwidth, and often a visible content flicker. <code>TransferState</code> serialises the server's data into the HTML so the client reads it instead of refetching. Modern Angular automates this with the HTTP transfer cache, and the new <code>httpResource</code> primitive builds on it. This is exactly the kind of "do you understand the full SSR data story" question senior interviews probe.</p>`,

        `<h2>The concept, simply</h2>`,
        `<p><strong>Title and Meta services.</strong> <code>Title</code> sets <code>document.title</code>; <code>Meta</code> adds/updates <code>&lt;meta&gt;</code> tags. You inject them and call them in a route's component or resolver so each page ships correct SEO tags. Under SSR these run on the server, so the tags are in the delivered HTML.</p>`,
        `<p><strong>TransferState.</strong> A key/value store that Angular serialises on the server (into a <code>&lt;script&gt;</code> tag in the HTML) and rehydrates on the client. Anything you put in it on the server is available on the client without a refetch. Its headline use is caching HTTP responses so the client doesn't re-request data the server already fetched.</p>`,
        `{{fig:ch9-transferstate.svg|Comparison of double-fetching without TransferState versus reading serialized state with it|Without TransferState the client refetches the same data the server fetched while with it the server embeds state the client reads directly.}}`,
        `<p><strong>The HTTP transfer cache</strong> automates all of this. Enabling it (on by default with <code>provideClientHydration()</code>, tunable via <code>withHttpTransferCacheOptions</code>) means <code>HttpClient</code> GET requests made during server render are automatically stored in TransferState and replayed on the client — no manual keys. <strong><code>httpResource</code></strong> (v19+) is a signal-based way to fetch data that integrates with this cache, giving you reactive, SSR-aware data loading.</p>`,

        `<h2>How it works</h2>`,
        `<p><strong>Meta and Title under SSR.</strong> When set in a component's constructor, <code>ngOnInit</code>, or a resolver, these calls mutate the server-side document during render, so the serialized HTML includes them. For a data-driven title (e.g. a product name), set it once the data resolves. Because SSR renders once and waits for stability, resolving data first then setting the title guarantees crawlers see the final tags.</p>`,
        `<p><strong>Manual TransferState.</strong> You create a <code>makeStateKey&lt;T&gt;('name')</code>, and on the server call <code>transferState.set(key, value)</code>. On the client you check <code>transferState.get(key, defaultValue)</code>; if present, use it and skip the fetch. This is the explicit pattern, useful for non-HTTP data (computed values, third-party SDK results).</p>`,
        `<p><strong>Automatic HTTP transfer cache.</strong> The manual pattern is boilerplate, so Angular automates the common case. With hydration enabled, GET requests during SSR are cached by URL+params into TransferState. On the client, <code>HttpClient</code> checks the cache first and returns the stored response synchronously for the first matching request, then the cache entry is consumed. You tune it with options:</p>`,
        `<table>`,
        `<thead><tr><th>Option</th><th>Effect</th></tr></thead>`,
        `<tbody>`,
        `<tr><td><code>includePostRequests</code></td><td>Also cache POSTs (default: GET/HEAD only).</td></tr>`,
        `<tr><td><code>filter</code></td><td>Predicate to include/exclude specific requests.</td></tr>`,
        `<tr><td><code>includeHeaders</code></td><td>Which response headers to transfer.</td></tr>`,
        `</tbody></table>`,
        `<p><strong>Why the double fetch happens without it.</strong> The server render fetches <code>/api/product/42</code> to build the HTML. When the client boots to hydrate, its components run the same code, which issues the same request — the browser has no idea the server already did it. TransferState bridges that: the server's response rides along in the HTML, and the client's <code>HttpClient</code> serves it from the transfer cache instead of hitting the network. Result: one request instead of two, and no flicker from data arriving late on the client.</p>`,
        `<p><strong><code>httpResource</code>.</strong> This is a reactive resource primitive: you give it a signal-returning request, and it exposes <code>value()</code>, <code>status()</code>, <code>error()</code> signals that update as the request resolves. It runs on the server during SSR (its result serialises via the transfer cache) and re-evaluates reactively on the client. It's the signals-era successor to manually wiring <code>HttpClient</code> + <code>TransferState</code> for read-only data.</p>`,

        `<h2>Code examples</h2>`,
        `<p><strong>1. Per-route Title and Meta.</strong> Set SEO tags from resolved data so crawlers see the right page metadata.</p>`,
        `<pre><code class="language-typescript">import { Component, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

@Component({ selector: 'app-product', standalone: true, template: '…' })
export class ProductComponent {
  private title = inject(Title);
  private meta = inject(Meta);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    const product = this.route.snapshot.data['product'];
    this.title.setTitle(\`\${product.name} — MyShop\`);
    this.meta.updateTag({ name: 'description', content: product.summary });
    this.meta.updateTag({ property: 'og:title', content: product.name });
    this.meta.updateTag({ property: 'og:image', content: product.image });
  }
}</code></pre>`,
        `<p><strong>2. Manual TransferState</strong> to avoid a double fetch for custom data.</p>`,
        `<pre><code class="language-typescript">import { inject, makeStateKey, TransferState, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

const CONFIG_KEY = makeStateKey&lt;AppConfig&gt;('app-config');

export async function loadConfig(): Promise&lt;AppConfig&gt; {
  const state = inject(TransferState);
  const http = inject(HttpClient);
  const isServer = isPlatformServer(inject(PLATFORM_ID));

  // Client: reuse the value the server already fetched
  if (state.hasKey(CONFIG_KEY)) return state.get(CONFIG_KEY, null as any);

  const config = await firstValueFrom(http.get&lt;AppConfig&gt;('/api/config'));
  if (isServer) state.set(CONFIG_KEY, config); // serialise for the client
  return config;
}</code></pre>`,
        `<p><strong>3. Automatic HTTP transfer cache.</strong> Enabling hydration turns it on; tune it with options — usually you write no per-request code at all.</p>`,
        `<pre><code class="language-typescript">import { provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(
      withHttpTransferCacheOptions({
        includePostRequests: false,
        filter: (req) =&gt; !req.url.includes('/api/analytics'),
      }),
    ),
    // With this, GET requests during SSR are auto-cached and replayed
    // on the client — no double fetch, no manual TransferState keys.
  ],
};</code></pre>`,
        `<p><strong>4. Reactive data with <code>httpResource</code>.</strong> Signal-based, SSR-aware fetching for read-only data.</p>`,
        `<pre><code class="language-typescript">import { Component, input } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Component({
  selector: 'app-user-card',
  standalone: true,
  template: \`
    @if (user.isLoading()) { &lt;p&gt;Loading…&lt;/p&gt; }
    @else if (user.value(); as u) { &lt;h3&gt;{{ u.name }}&lt;/h3&gt; }
  \`,
})
export class UserCardComponent {
  id = input.required&lt;string&gt;();
  // Re-fetches when id() changes; result serialises via the transfer cache under SSR
  user = httpResource&lt;User&gt;(() =&gt; \`/api/users/\${this.id()}\`);
}</code></pre>`,

        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Setting meta tags after the app stabilises.</strong> Tags set in a late microtask or browser-only path may not be in the server HTML. Set them from resolved data during render.</li>`,
        `<li><strong>Assuming CSR meta updates help SEO.</strong> If SSR isn't enabled, updating <code>Meta</code> at runtime doesn't help non-JS crawlers — the initial HTML still lacks the tags.</li>`,
        `<li><strong>Reinventing TransferState when the HTTP cache already covers it.</strong> For plain GETs, enabling hydration handles the double fetch automatically; manual keys are only for non-HTTP data.</li>`,
        `<li><strong>Caching personalised or auth'd responses in the transfer cache.</strong> The serialized state is embedded in HTML sent to the browser; don't cache per-user secrets. Use <code>filter</code> to exclude them.</li>`,
        `<li><strong>Forgetting the cache is single-use.</strong> The transfer cache serves the first matching request, then subsequent identical requests hit the network as normal — don't rely on it as a long-lived cache.</li>`,
        `<li><strong>Duplicate/late titles causing flicker.</strong> Setting a generic title then overwriting it after data loads can flash the wrong title; resolve data first.</li>`,
        `</ul>`,

        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Set <code>Title</code>/<code>Meta</code> per route from resolved data</strong> so each page ships correct SEO and social tags in the server HTML.</li>`,
        `<li><strong>Include canonical + Open Graph/Twitter tags</strong> for share previews, not just the description.</li>`,
        `<li><strong>Rely on the automatic HTTP transfer cache</strong> for GETs; reach for manual <code>TransferState</code> only for non-HTTP data.</li>`,
        `<li><strong>Exclude sensitive/personalised requests</strong> from the transfer cache with <code>filter</code>.</li>`,
        `<li><strong>Prefer <code>httpResource</code></strong> for reactive, read-only data that must work under SSR.</li>`,
        `<li><strong>Verify with a raw fetch</strong> (<code>curl</code> the URL) that titles, meta, and content are present in the server HTML — not just after JS runs.</li>`,
        `</ul>`,

        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "How do you set per-route SEO tags in Angular?"</strong><br>A: Inject the <code>Title</code> and <code>Meta</code> services and call <code>setTitle</code>/<code>updateTag</code> per route (ideally from resolved data). Under SSR these run on the server so the tags are in the delivered HTML that crawlers read. Trap: without SSR, runtime meta updates don't help non-JS crawlers.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is TransferState and what problem does it solve?"</strong><br>A: A key/value store serialised from server to client in the HTML. It prevents the double fetch: the server's data is embedded so the client reuses it instead of refetching, avoiding wasted requests and content flicker.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Do you have to use TransferState manually?"</strong><br>A: Usually not — enabling <code>provideClientHydration()</code> turns on the HTTP transfer cache, which auto-caches SSR GET requests and replays them on the client. Manual <code>makeStateKey</code>/<code>set</code>/<code>get</code> is only for non-HTTP data.</p></blockquote>`,
        `<blockquote><p><strong>Q (trap): "Can you cache authenticated API responses in TransferState?"</strong><br>A: Be careful — the state is embedded in HTML sent to the browser, so per-user secrets would leak. Exclude them via the transfer cache <code>filter</code> option.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is <code>httpResource</code> and how does it relate to SSR?"</strong><br>A: A signal-based reactive fetching primitive (v19+) exposing <code>value()</code>/<code>isLoading()</code>/<code>error()</code>. It runs during SSR and integrates with the transfer cache, so it fetches once on the server and reuses the result on the client — a signals-era replacement for manual <code>HttpClient</code> + <code>TransferState</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "The client refetches data the server already loaded — why, and how do you fix it?"</strong><br>A: Without TransferState the client has no knowledge of the server's fetch, so hydration re-issues it. Fix by enabling hydration's HTTP transfer cache (automatic) or wiring TransferState manually for custom data.</p></blockquote>`,

        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>SEO tags:</strong> <code>Title.setTitle()</code> · <code>Meta.updateTag()</code> — set per route from resolved data.</li>`,
        `<li><strong>Include:</strong> title · description · canonical · <code>og:</code>/<code>twitter:</code> tags.</li>`,
        `<li><strong>TransferState:</strong> <code>makeStateKey</code> → server <code>set()</code> → client <code>get()</code>; serialised in HTML.</li>`,
        `<li><strong>Auto cache:</strong> <code>provideClientHydration()</code> caches SSR GETs; tune via <code>withHttpTransferCacheOptions</code>.</li>`,
        `<li><strong>Exclude secrets:</strong> transfer cache <code>filter</code> for auth'd/personalised requests.</li>`,
        `<li><strong>Reactive fetch:</strong> <code>httpResource(() =&gt; url)</code> — signals + SSR-aware.</li>`,
        `</ul>`,
      ].join('\n')
    },
  ]
};
