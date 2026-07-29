// lib/roadmaps/angular.ts
//
// Angular interview roadmap. Slugs in `topics` are real Topics in
// `angular-interview-kit`.

import type { Roadmap } from './types';

export const angularRoadmap: Roadmap = {
    id: 'angular',
    kitSlug: 'angular-interview-kit',
    title: 'Angular Interview Roadmap',
    tagline: 'Modern Angular — standalone, signals, and the questions panels still ask.',
    audience: 'Angular developers interviewing at product and service companies, 0 to 8 years.',
    weeks: 9,
    accent: { from: 'from-red-500', to: 'to-rose-600' },
    stages: [
        {
            id: 'foundations',
            title: 'Foundations',
            goal: 'Explain what Angular does to your code before the browser sees it.',
            nodes: [
                {
                    id: 'intro-architecture',
                    title: 'What Angular is & its architecture',
                    summary:
                        'A framework, not a library — modules, components, services, DI and a compiler, shipped as one opinionated whole. Framework-vs-library is a genuine opening question.',
                    tier: 'beginner',
                    est: '3h',
                    topics: ['introduction-to-angular', 'angular-architecture'],
                    external: [{ title: 'Angular docs', url: 'https://angular.dev/' }],
                    interview: [
                        'How is Angular different from React — beyond "one is a framework"?',
                        'Name the building blocks of an Angular application.',
                    ],
                },
                {
                    id: 'cli-bootstrap',
                    title: 'CLI, project structure & bootstrap flow',
                    summary:
                        'From `main.ts` to the first rendered component. Knowing this makes SSR, testing and lazy loading much less mysterious later.',
                    tier: 'beginner',
                    est: '3h',
                    topics: ['cli-project-structure', 'bootstrap-flow'],
                    interview: [
                        'What happens between `ng serve` and your AppComponent appearing?',
                        'What is in angular.json that matters at build time?',
                    ],
                },
                {
                    id: 'standalone',
                    title: 'Standalone vs NgModule',
                    summary:
                        'The biggest shift in modern Angular. Interviewers use this to find out whether you have kept up or stopped at Angular 8.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['standalone-vs-ngmodule'],
                    interview: [
                        'What problem do standalone components solve?',
                        'How do you provide something app-wide without an NgModule?',
                    ],
                },
                {
                    id: 'ts-prereq',
                    title: 'TypeScript you need first',
                    summary:
                        'Angular is TypeScript-first: decorators, interfaces, generics and strict null checks are not optional here the way they are in a React codebase.',
                    tier: 'beginner',
                    est: '4h',
                    crossKit: [
                        {
                            kitSlug: 'complete-frontend-kit',
                            topics: ['typescript-fundamentals', 'generics-advanced-types'],
                        },
                    ],
                    external: [
                        { title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html' },
                    ],
                    interview: ['What is a decorator, and what does @Component actually do at build time?'],
                },
            ],
        },
        {
            id: 'components',
            title: 'Components & Templates',
            goal: 'Build a component API and know exactly when each lifecycle hook fires.',
            nodes: [
                {
                    id: 'lifecycle',
                    title: 'Lifecycle hooks',
                    summary:
                        'All of them, in order, with what is safe to do in each. ngOnInit vs constructor is asked in nearly every Angular interview.',
                    tier: 'beginner',
                    est: '3h',
                    topics: ['lifecycle-hooks'],
                    external: [{ title: 'Angular — Components', url: 'https://angular.dev/guide/components' }],
                    interview: [
                        'Why put initialisation in ngOnInit rather than the constructor?',
                        'When does ngOnChanges fire, and when does it NOT fire for an object input?',
                        'Which hook do you use to clean up a subscription?',
                    ],
                },
                {
                    id: 'binding',
                    title: 'Data binding',
                    summary:
                        'Interpolation, property, event and two-way binding — and the fact that `[(ngModel)]` is just sugar over the other two.',
                    tier: 'beginner',
                    est: '2h',
                    topics: ['data-binding'],
                    interview: ['Desugar `[(ngModel)]="name"`. What are the two bindings underneath?'],
                },
                {
                    id: 'component-comms',
                    title: '@Input, @Output & view queries',
                    summary:
                        'Parent-child communication plus ViewChild/ContentChild — and the timing rule that says a ViewChild is not available until after the view initialises.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['input-output', 'viewchild-contentchild'],
                    interview: [
                        'ViewChild vs ContentChild — what is the difference and when is each available?',
                        'How do two sibling components talk to each other?',
                    ],
                },
                {
                    id: 'encapsulation',
                    title: 'View encapsulation',
                    summary:
                        'How Angular scopes your CSS, and why a style that "does not apply" is almost always this. ::ng-deep and its deprecation come up here.',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['view-encapsulation'],
                    interview: [
                        'What are the encapsulation modes and what does Emulated actually do to your CSS?',
                        'Why is ::ng-deep discouraged, and what do you do instead?',
                    ],
                },
                {
                    id: 'directives-pipes',
                    title: 'Directives & pipes',
                    summary:
                        'Structural vs attribute, the new @if/@for control flow, and the pure-vs-impure pipe distinction that has real performance consequences.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: [
                        'structural-vs-attribute',
                        'control-flow',
                        'custom-directives',
                        'pure-impure-pipes',
                        'async-pipe',
                    ],
                    interview: [
                        'Why did Angular add @if/@for when *ngIf/*ngFor already worked?',
                        'What makes a pipe impure and why is that expensive?',
                        'What does the async pipe do about unsubscribing?',
                    ],
                    build: 'Write a custom structural directive (e.g. `*appIfRole`) and a custom pipe. Both are common live-coding asks.',
                },
            ],
        },
        {
            id: 'di',
            title: 'Dependency Injection',
            goal: 'Explain where an injected instance came from and how many of it exist.',
            nodes: [
                {
                    id: 'di-basics',
                    title: 'What DI is & why Angular has it',
                    summary:
                        'Inversion of control at the framework level. The testing benefit is the answer interviewers are listening for.',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['what-is-di'],
                    external: [{ title: 'Angular — Dependency injection', url: 'https://angular.dev/guide/di' }],
                    interview: ['What does DI buy you that `new Service()` does not?'],
                },
                {
                    id: 'providers',
                    title: 'Providers, injectors & tokens',
                    summary:
                        'useClass, useValue, useFactory, useExisting, and InjectionToken for the things that are not classes.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['providers-injectors'],
                    interview: [
                        'How do you inject a plain configuration object?',
                        'What is useFactory for, and how do you give it dependencies?',
                    ],
                },
                {
                    id: 'provider-scope',
                    title: 'Provider scope & the injector tree',
                    summary:
                        'providedIn: root vs a component provider decides whether you get one instance or one per component. A guaranteed question, and a real source of bugs.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['provider-scope', 'hierarchical-injectors'],
                    interview: [
                        'A service is provided in a component. How many instances exist?',
                        'How does Angular resolve a token up the injector tree?',
                        'What does providedIn: "root" do for tree shaking?',
                    ],
                },
                {
                    id: 'inject-fn',
                    title: 'The inject() function',
                    summary:
                        'The modern alternative to constructor injection, and what makes functional guards and interceptors possible.',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['inject-function'],
                    interview: ['Where can you legally call inject(), and what happens if you call it too late?'],
                },
            ],
        },
        {
            id: 'rxjs',
            title: 'RxJS & Reactivity',
            goal: 'Pick the right operator on instinct and never leak a subscription.',
            nodes: [
                {
                    id: 'observables',
                    title: 'Observables vs promises',
                    summary:
                        'Lazy vs eager, multiple values vs one, cancellable vs not. Foundational, and the framing for every RxJS question that follows.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['observables-vs-promises'],
                    external: [{ title: 'RxJS — Overview', url: 'https://rxjs.dev/guide/overview' }],
                    interview: [
                        'Give three concrete differences between an Observable and a Promise.',
                        'Is an Observable hot or cold? What does that mean for an HTTP call?',
                    ],
                },
                {
                    id: 'operators',
                    title: 'Flattening operators',
                    summary:
                        'switchMap, mergeMap, concatMap, exhaustMap. Choosing between them for typeahead, uploads and a double-clicked submit button is a classic interview scenario.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['flattening-operators'],
                    interview: [
                        'Typeahead search: which operator, and why not the others?',
                        'A user double-clicks Save. Which operator prevents the second request?',
                    ],
                    build: 'Build a typeahead with debounceTime + distinctUntilChanged + switchMap, then deliberately swap in mergeMap and watch it break.',
                },
                {
                    id: 'subjects',
                    title: 'Subjects',
                    summary:
                        'Subject, BehaviorSubject, ReplaySubject, AsyncSubject — and the service-with-a-BehaviorSubject pattern that predates every Angular state library.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['subjects'],
                    interview: [
                        'When do you need a BehaviorSubject rather than a Subject?',
                        'Why expose `asObservable()` instead of the Subject itself?',
                    ],
                },
                {
                    id: 'subscriptions',
                    title: 'Subscription management',
                    summary:
                        'takeUntil, takeUntilDestroyed, the async pipe. Leaking subscriptions is the number-one Angular memory-leak question.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['subscription-management'],
                    interview: [
                        'Name three ways to unsubscribe, and rank them.',
                        'Do you need to unsubscribe from HttpClient? Explain your answer.',
                    ],
                },
                {
                    id: 'signals',
                    title: 'Signals',
                    summary:
                        'Angular\'s new reactive primitive and the road to zoneless. Increasingly the first thing a modern Angular interview asks about.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['signals'],
                    external: [{ title: 'Angular — Signals', url: 'https://angular.dev/guide/signals' }],
                    interview: [
                        'Signals vs RxJS — when do you use each, and do they compete?',
                        'What is a computed signal and when does it recompute?',
                        'What does an effect do, and what should it not do?',
                    ],
                },
            ],
        },
        {
            id: 'routing-forms',
            title: 'Routing, Forms & HTTP',
            goal: 'Wire a real feature: navigate, guard, submit, and handle the failure.',
            nodes: [
                {
                    id: 'router',
                    title: 'Router, params & child routes',
                    summary:
                        'Route params vs query params, snapshot vs observable — and the bug where the component does not reload because only the parameter changed.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['router-params', 'child-routes'],
                    external: [{ title: 'Angular — Routing', url: 'https://angular.dev/guide/routing' }],
                    interview: [
                        'Why does navigating from /user/1 to /user/2 not re-run ngOnInit, and how do you handle it?',
                        'snapshot vs paramMap observable — when is snapshot wrong?',
                    ],
                },
                {
                    id: 'lazy-guards',
                    title: 'Lazy loading & route guards',
                    summary:
                        'Splitting the bundle by route, and the functional guards that replaced the class-based ones.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['lazy-loading', 'route-guards'],
                    interview: [
                        'How do you lazy-load a standalone component route?',
                        'Name the guard types and give a real use for each.',
                    ],
                },
                {
                    id: 'forms',
                    title: 'Template-driven vs reactive forms',
                    summary:
                        'A design decision with a clear default: reactive for anything non-trivial. Then FormArray, custom and async validators.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['template-vs-reactive-forms', 'reactive-forms-api'],
                    external: [{ title: 'Angular — Forms', url: 'https://angular.dev/guide/forms' }],
                    interview: [
                        'When would you still use a template-driven form?',
                        'Write a custom validator, then an async one that checks a username against the server.',
                        'How do you build a dynamic list of form fields?',
                    ],
                    build: 'Build a form with a FormArray of line items, cross-field validation and an async uniqueness check.',
                },
                {
                    id: 'http',
                    title: 'HttpClient & interceptors',
                    summary:
                        'The interceptor chain is Angular\'s middleware. Auth headers, refresh-on-401 and retry all live there, and it is a favourite whiteboard task.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['httpclient', 'http-interceptors', 'auth-interceptor'],
                    external: [{ title: 'Angular — HTTP client', url: 'https://angular.dev/guide/http' }],
                    interview: [
                        'Write an interceptor that attaches a token and refreshes it on a 401 — without firing ten refreshes for ten parallel requests.',
                        'In what order do multiple interceptors run for the request and for the response?',
                    ],
                },
            ],
        },
        {
            id: 'change-detection',
            title: 'Change Detection & Performance',
            goal: 'Explain why the view updated — or did not.',
            nodes: [
                {
                    id: 'cd-strategies',
                    title: 'Default vs OnPush',
                    summary:
                        'The central Angular performance topic. OnPush changes the rules for when a component is checked, and knowing those rules exactly is the interview.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['change-detection-strategies'],
                    interview: [
                        'What exactly triggers a check in an OnPush component?',
                        'Your OnPush component shows stale data after mutating an input object. Why, and what are two fixes?',
                    ],
                },
                {
                    id: 'zone',
                    title: 'Zone.js & the zoneless future',
                    summary:
                        'How Angular knew something happened — monkey-patched async APIs — and why the framework is moving away from that.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['zonejs-zoneless'],
                    interview: [
                        'How does Angular know to run change detection after a setTimeout?',
                        'What does runOutsideAngular do and when do you reach for it?',
                    ],
                },
                {
                    id: 'trackby',
                    title: 'trackBy, @for track & ChangeDetectorRef',
                    summary:
                        'The list-rendering performance fix, plus manual control via markForCheck and detectChanges.',
                    tier: 'advanced',
                    est: '2h',
                    topics: ['trackby-cdref'],
                    interview: [
                        'What does trackBy prevent, and why is `track` now mandatory in @for?',
                        'markForCheck vs detectChanges — which does what?',
                    ],
                },
                {
                    id: 'aot',
                    title: 'AOT vs JIT',
                    summary:
                        'Compile at build time, ship less, catch template errors early. Short topic, common question.',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['aot-jit'],
                    interview: ['Name three advantages of AOT compilation.'],
                },
                {
                    id: 'virtual-scroll',
                    title: 'CDK virtual scrolling',
                    summary:
                        'Angular\'s built-in answer to the huge-list question, and worth knowing so you can say "the CDK already does this".',
                    tier: 'advanced',
                    est: '2h',
                    topics: ['virtual-scrolling'],
                    interview: ['How would you render 50,000 rows in an Angular table?'],
                },
            ],
        },
        {
            id: 'state',
            title: 'State Management',
            goal: 'Justify a state choice instead of defaulting to NgRx.',
            nodes: [
                {
                    id: 'state-options',
                    title: 'Local vs service vs store',
                    summary:
                        'The ladder. A service with a BehaviorSubject handles far more applications than the NgRx-by-default habit suggests.',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['state-options-overview'],
                    interview: ['When is a service with a BehaviorSubject enough, and what forces you past it?'],
                },
                {
                    id: 'ngrx',
                    title: 'NgRx: store, effects & selectors',
                    summary:
                        'Redux for Angular. Actions, reducers, selectors, effects — and the memoisation that makes selectors worth using.',
                    tier: 'advanced',
                    est: '5h',
                    topics: ['ngrx-overview', 'ngrx-store', 'ngrx-effects-selectors'],
                    external: [{ title: 'NgRx docs', url: 'https://ngrx.io/' }],
                    interview: [
                        'Where does an HTTP call go in NgRx, and why not in the reducer?',
                        'What does createSelector memoise, and when does it recompute?',
                        'What is @ngrx/entity for?',
                    ],
                },
                {
                    id: 'signal-store',
                    title: 'SignalStore & services with signals',
                    summary:
                        'The signal-native successor. Knowing this is a strong "keeps up with the framework" signal in 2026 interviews.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['signalstore', 'services-with-signals'],
                    interview: ['What does SignalStore simplify compared to the classic NgRx store?'],
                },
            ],
        },
        {
            id: 'ssr-security',
            title: 'SSR, Security & UI',
            goal: 'Cover the topics that separate an Angular developer from an Angular engineer.',
            nodes: [
                {
                    id: 'ssr',
                    title: 'SSR, hydration & deferrable views',
                    summary:
                        'Why SSR, what hydration is, and @defer — the feature that makes lazy loading work at the template level.',
                    tier: 'advanced',
                    est: '4h',
                    topics: [
                        'why-ssr',
                        'angular-universal-setup',
                        'hydration',
                        'deferrable-views',
                        'seo-transferstate',
                    ],
                    external: [{ title: 'Angular — SSR', url: 'https://angular.dev/guide/ssr' }],
                    interview: [
                        'CSR vs SSR vs SSG — pick one for an e-commerce product page and defend it.',
                        'What problem does TransferState solve?',
                        'What is event replay in hydration?',
                    ],
                },
                {
                    id: 'security',
                    title: 'XSS, sanitisation & CSRF',
                    summary:
                        'Angular sanitises by default, which is exactly why DomSanitizer misuse is dangerous. Expect to be asked when bypassing is acceptable.',
                    tier: 'advanced',
                    est: '4h',
                    topics: [
                        'xss-sanitization',
                        'domsanitizer',
                        'xsrf-protection',
                        'auth-patterns',
                        'csp-trusted-types',
                    ],
                    external: [
                        {
                            title: 'Content Security Policy — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP',
                        },
                    ],
                    interview: [
                        'What does Angular do automatically about XSS, and where does that protection stop?',
                        'When is bypassSecurityTrustHtml acceptable?',
                        'How does Angular\'s built-in XSRF protection work?',
                    ],
                },
                {
                    id: 'material-cdk',
                    title: 'Material, CDK & accessibility',
                    summary:
                        'Theming, overlays, portals, drag-drop and the a11y utilities. The CDK is the answer to a surprising number of "how would you build X" questions.',
                    tier: 'intermediate',
                    kind: 'optional',
                    est: '4h',
                    topics: [
                        'angular-material-basics',
                        'material-theming',
                        'cdk-overlay-portal',
                        'cdk-a11y-dragdrop',
                    ],
                    interview: [
                        'How would you build a custom tooltip that escapes an overflow:hidden parent?',
                        'What does the a11y FocusTrap give you for free?',
                    ],
                },
                {
                    id: 'testing-angular',
                    title: 'Testing Angular',
                    summary:
                        'TestBed, component fixtures, HttpTestingController and spies. Angular interviews ask about testing more often than React ones do.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['testing'],
                    interview: [
                        'How do you test a component that depends on a service?',
                        'How do you assert that a request was made with the right headers?',
                        'What does fixture.detectChanges() actually do?',
                    ],
                },
            ],
        },
    ],
};
