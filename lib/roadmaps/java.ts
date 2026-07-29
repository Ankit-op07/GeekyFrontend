// lib/roadmaps/java.ts
//
// Java backend interview roadmap. Slugs in `topics` are real Topics in
// `java-interview-kit`.

import type { Roadmap } from './types';

export const javaRoadmap: Roadmap = {
    id: 'java',
    kitSlug: 'java-interview-kit',
    title: 'Java Interview Roadmap',
    tagline: 'Core Java, the JVM, concurrency and Spring — in the order interviews ask for them.',
    audience: 'Java backend candidates, service-based to product-company transitions, and campus placements.',
    weeks: 12,
    accent: { from: 'from-orange-500', to: 'to-red-600' },
    stages: [
        {
            id: 'fundamentals',
            title: 'Language Fundamentals',
            goal: 'Answer the memory and semantics questions that every Java round opens with.',
            nodes: [
                {
                    id: 'jvm-jdk-jre',
                    title: 'JDK, JRE, JVM & how Java runs',
                    summary:
                        'Source → bytecode → interpreter → JIT. The "write once run anywhere" claim and what actually delivers it.',
                    tier: 'beginner',
                    est: '3h',
                    topics: ['jdk-jre-jvm', 'how-java-runs'],
                    external: [
                        { title: 'dev.java — Getting Started', url: 'https://dev.java/learn/' },
                    ],
                    interview: [
                        'Difference between JDK, JRE and JVM.',
                        'What does the JIT compiler do that the interpreter does not, and when does it kick in?',
                        'Is Java compiled or interpreted?',
                    ],
                },
                {
                    id: 'memory-model-basics',
                    title: 'Stack vs heap, primitives vs references',
                    summary:
                        'Where each value lives and what a variable actually holds. Every later question about mutation, equality and GC assumes this.',
                    tier: 'beginner',
                    est: '3h',
                    topics: ['primitives-vs-references', 'stack-vs-heap'],
                    interview: [
                        'Where does a local variable live? Where does the object it points to live?',
                        'What is on the stack for a method call?',
                    ],
                },
                {
                    id: 'pass-by-value',
                    title: 'Pass-by-value',
                    summary:
                        'Java is pass-by-value, always — including for objects, where the value passed is the reference. The most commonly mis-answered question in the language.',
                    tier: 'beginner',
                    est: '2h',
                    topics: ['pass-by-value'],
                    interview: [
                        'Is Java pass-by-value or pass-by-reference? Prove your answer with a swap method.',
                        'Why can a method mutate the object you passed but not reassign your variable?',
                    ],
                },
            ],
        },
        {
            id: 'oop',
            title: 'OOP & Object Contracts',
            goal: 'Design a class an interviewer cannot poke holes in.',
            nodes: [
                {
                    id: 'oop-core',
                    title: 'Classes, inheritance & polymorphism',
                    summary:
                        'Constructors, overriding vs overloading, dynamic dispatch. Overloading is resolved at compile time and overriding at run time — that one sentence answers a lot of questions.',
                    tier: 'beginner',
                    est: '4h',
                    topics: [
                        'classes-objects-constructors',
                        'inheritance-and-overriding',
                        'encapsulation-access-modifiers',
                    ],
                    interview: [
                        'Overloading vs overriding — which is resolved when?',
                        'Can you override a static method? What actually happens if you try?',
                        'What are the four access modifiers, in order of visibility?',
                    ],
                },
                {
                    id: 'abstract-vs-interface',
                    title: 'Abstract classes vs interfaces',
                    summary:
                        'A design question wearing a syntax question\'s clothes — especially now that interfaces have default and static methods.',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['abstract-class-vs-interface'],
                    interview: [
                        'When do you choose an abstract class over an interface?',
                        'Default methods gave interfaces implementation. Did that bring back the diamond problem?',
                    ],
                },
                {
                    id: 'equals-hashcode',
                    title: 'equals() & hashCode(): the contract',
                    summary:
                        'Break this contract and your object silently vanishes from a HashSet. A near-certain interview question and a real production bug class.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['equals-and-hashcode'],
                    external: [
                        {
                            title: 'Object.hashCode() — Javadoc',
                            url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#hashCode()',
                        },
                    ],
                    interview: [
                        'You override equals but not hashCode. What breaks, and when?',
                        'Must two equal objects have the same hash code? Must two objects with the same hash code be equal?',
                        'What happens if you mutate a key after putting it in a HashMap?',
                    ],
                },
                {
                    id: 'static-final-init',
                    title: 'static, final & initialisation order',
                    summary:
                        'Static blocks, instance blocks, constructors — and the exact order they run in. Comes up as a "what does this print" puzzle.',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['static-final-initialization-order'],
                    interview: [
                        'Order the execution: static block, instance block, constructor, superclass versions of each.',
                        'Does `final` on a reference make the object immutable?',
                    ],
                },
            ],
        },
        {
            id: 'strings',
            title: 'Strings & Immutability',
            goal: 'Explain the string pool and why immutability was worth its cost.',
            nodes: [
                {
                    id: 'string-immutable',
                    title: 'Why String is immutable',
                    summary:
                        'Security, caching, thread safety and hash-code caching. Four reasons — interviewers usually want at least three.',
                    tier: 'beginner',
                    est: '2h',
                    topics: ['why-string-is-immutable'],
                    interview: ['Give three reasons String is immutable. Which one is the security one?'],
                },
                {
                    id: 'string-pool',
                    title: 'The string pool & intern()',
                    summary:
                        'Why `"a" == "a"` is true but `new String("a") == "a"` is false. The classic == vs equals trap lives here.',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['string-pool-and-interning'],
                    interview: [
                        'How many objects does `String s = new String("hello")` create?',
                        'What does intern() do?',
                    ],
                },
                {
                    id: 'stringbuilder',
                    title: 'String vs StringBuilder vs StringBuffer',
                    summary:
                        'Concatenating in a loop is the canonical performance question, and the answer involves knowing what the compiler already does for you.',
                    tier: 'beginner',
                    est: '2h',
                    topics: ['stringbuilder-vs-stringbuffer'],
                    interview: [
                        'Which do you use in a loop, and which in a single-threaded vs shared context?',
                        'What does `a + b + c` compile to?',
                    ],
                },
                {
                    id: 'wrappers',
                    title: 'Wrappers, autoboxing & the Integer cache',
                    summary:
                        'Why `Integer a = 127, b = 127; a == b` is true but the same with 128 is false. A guaranteed trick question.',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['wrappers-and-integer-cache'],
                    interview: [
                        'Explain the 127/128 Integer comparison result.',
                        'Where does autoboxing hurt performance?',
                    ],
                },
            ],
        },
        {
            id: 'collections',
            title: 'Collections Framework',
            goal: 'Pick the right collection and explain its internals under the hood.',
            nodes: [
                {
                    id: 'collection-hierarchy',
                    title: 'The hierarchy & choosing a collection',
                    summary:
                        'List, Set, Queue, Map and what each guarantees. Interviews start here and drill down.',
                    tier: 'beginner',
                    est: '3h',
                    topics: ['collection-hierarchy', 'sets-and-uniqueness'],
                    external: [
                        {
                            title: 'Collections Framework overview — Javadoc',
                            url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/package-summary.html',
                        },
                    ],
                    interview: [
                        'Why is Map not a Collection?',
                        'HashSet, LinkedHashSet, TreeSet — ordering and complexity for each.',
                    ],
                },
                {
                    id: 'list-internals',
                    title: 'ArrayList vs LinkedList',
                    summary:
                        'Growth factor, amortised cost, and the answer interviewers actually want: LinkedList is almost never the right choice on modern hardware.',
                    tier: 'beginner',
                    est: '2h',
                    topics: ['arraylist-vs-linkedlist'],
                    interview: [
                        'What happens when an ArrayList fills up?',
                        'LinkedList has O(1) insert. Why is it still usually slower in practice?',
                    ],
                },
                {
                    id: 'hashmap-internals',
                    title: 'HashMap internals',
                    summary:
                        'Buckets, hashing, collision chains, treeification at 8, load factor 0.75, resize. The single most-asked Java data-structure question.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['hashmap-internals', 'linkedhashmap-and-treemap'],
                    external: [
                        {
                            title: 'HashMap — Javadoc',
                            url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html',
                        },
                    ],
                    interview: [
                        'Walk through what happens inside `put` on a collision.',
                        'What changed in HashMap in Java 8, and what attack did it mitigate?',
                        'Why is the default load factor 0.75?',
                    ],
                    build: 'Implement a HashMap with separate chaining, resize, and get/put/remove. It makes every follow-up easy.',
                },
                {
                    id: 'concurrent-collections',
                    title: 'ConcurrentHashMap & fail-fast iterators',
                    summary:
                        'Why Hashtable is dead, what replaced synchronizedMap, and why modifying a collection while iterating throws.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['concurrent-collections', 'fail-fast-vs-fail-safe'],
                    interview: [
                        'ConcurrentHashMap vs Collections.synchronizedMap — what is different about the locking?',
                        'What is ConcurrentModificationException and how do you avoid it correctly?',
                    ],
                },
                {
                    id: 'generics',
                    title: 'Generics, type erasure & PECS',
                    summary:
                        'Erasure explains every "why can I not do that" generics question. PECS explains every wildcard signature in the standard library.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['generics-and-type-erasure', 'wildcards-and-pecs'],
                    interview: [
                        'Why can you not create `new T[10]`?',
                        'What does PECS stand for and when do you use each side?',
                        'Is `List<String>` a subtype of `List<Object>`? Why not?',
                    ],
                },
                {
                    id: 'sorting',
                    title: 'Comparable vs Comparator',
                    summary:
                        'Natural order vs supplied order, and the consistency-with-equals rule that quietly breaks TreeSet when you ignore it.',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['comparable-vs-comparator'],
                    interview: [
                        'Sort a list of employees by department, then by salary descending.',
                        'Why should compareTo be consistent with equals?',
                    ],
                },
            ],
        },
        {
            id: 'exceptions',
            title: 'Exceptions',
            goal: 'Design error handling that a reviewer would approve.',
            nodes: [
                {
                    id: 'throwable',
                    title: 'The Throwable hierarchy',
                    summary:
                        'Error vs Exception vs RuntimeException, and which of them you should never catch.',
                    tier: 'beginner',
                    est: '2h',
                    topics: ['throwable-hierarchy', 'checked-vs-unchecked'],
                    interview: [
                        'Checked vs unchecked — which do you throw for a bad user input, and which for a bug?',
                        'Should you catch Throwable? Ever?',
                    ],
                },
                {
                    id: 'finally-resources',
                    title: 'finally, control flow & try-with-resources',
                    summary:
                        'The "what does this return" puzzle, plus the modern way to close things and what a suppressed exception is.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['finally-and-control-flow', 'try-with-resources'],
                    interview: [
                        'A method returns in try and also in finally. What is returned?',
                        'Can finally be skipped?',
                        'What is a suppressed exception?',
                    ],
                },
                {
                    id: 'custom-exceptions',
                    title: 'Designing custom exceptions',
                    summary:
                        'When a new exception type earns its place, and why swallowing one in a catch block is the code-review red flag interviewers look for.',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['custom-exceptions'],
                    interview: ['When do you create a custom exception rather than reuse an existing one?'],
                },
            ],
        },
        {
            id: 'functional',
            title: 'Functional Java (8+)',
            goal: 'Write stream pipelines fluently and know when not to.',
            nodes: [
                {
                    id: 'lambdas',
                    title: 'Lambdas & functional interfaces',
                    summary:
                        'Function, Predicate, Consumer, Supplier — plus method references and effectively-final capture.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['lambdas-and-functional-interfaces'],
                    interview: [
                        'What makes an interface functional?',
                        'Why must a captured local variable be effectively final?',
                    ],
                },
                {
                    id: 'streams',
                    title: 'Streams & laziness',
                    summary:
                        'Intermediate vs terminal operations, and the fact that nothing runs until the terminal operation does. That laziness is the interview question.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['streams-and-laziness'],
                    external: [
                        {
                            title: 'java.util.stream — package Javadoc',
                            url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/package-summary.html',
                        },
                    ],
                    interview: [
                        'Which operations are lazy and which are eager?',
                        'Can you reuse a stream? What happens if you try?',
                        'Difference between map and flatMap.',
                    ],
                },
                {
                    id: 'collectors',
                    title: 'Collectors, groupingBy & reduction',
                    summary:
                        'Where stream questions actually get asked: "group these orders by customer and sum the totals".',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['collectors-and-grouping'],
                    interview: [
                        'Group a list of employees by department into a Map<String, List<Employee>>, then into a Map<String, Double> of average salary.',
                        'What is the difference between reduce and collect?',
                    ],
                    build: 'Solve five grouping/partitioning problems without looking up the Collectors API.',
                },
                {
                    id: 'parallel-optional',
                    title: 'Parallel streams & Optional',
                    summary:
                        'Two features people misuse. Parallel streams share a common ForkJoinPool; Optional is a return type, not a field type.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['parallel-streams', 'optional'],
                    interview: [
                        'When does a parallel stream actually help, and when does it hurt?',
                        'Why should you not use Optional as a method parameter or a field?',
                    ],
                },
            ],
        },
        {
            id: 'concurrency',
            title: 'Multithreading & Concurrency',
            goal: 'Reason about shared state without hand-waving.',
            nodes: [
                {
                    id: 'threads',
                    title: 'Threads: creation & lifecycle',
                    summary:
                        'The states, `start` vs `run`, and why you almost never manage threads by hand any more.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['thread-lifecycle'],
                    interview: [
                        'What happens if you call run() instead of start()?',
                        'Name the thread states and what moves a thread between them.',
                    ],
                },
                {
                    id: 'synchronized',
                    title: 'Race conditions & synchronized',
                    summary:
                        'Mutual exclusion, intrinsic locks, and why `count++` is three operations rather than one.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['synchronized-and-races'],
                    interview: [
                        'Why is `count++` not atomic?',
                        'What object does a synchronized method lock on — instance and static versions?',
                    ],
                },
                {
                    id: 'volatile-jmm',
                    title: 'volatile & the Java Memory Model',
                    summary:
                        'Visibility versus atomicity — the distinction that separates people who have read about concurrency from people who understand it.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['volatile-and-jmm'],
                    interview: [
                        'Does volatile make `i++` thread-safe? Why not?',
                        'What is a happens-before relationship?',
                        'When is volatile enough on its own?',
                    ],
                },
                {
                    id: 'locks',
                    title: 'Locks & conditions',
                    summary:
                        'ReentrantLock, ReadWriteLock and what they give you over `synchronized`: tryLock, fairness, interruptibility.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['locks-and-conditions'],
                    interview: ['Name three things ReentrantLock can do that synchronized cannot.'],
                },
                {
                    id: 'deadlock',
                    title: 'Deadlock, livelock & starvation',
                    summary:
                        'The four Coffman conditions and the practical fix: consistent lock ordering. Expect to be asked to write a deadlock, then remove it.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['deadlock-and-liveness'],
                    interview: [
                        'Write code that deadlocks, then fix it without removing either lock.',
                        'How do you detect a deadlock in a running JVM?',
                    ],
                },
                {
                    id: 'executors',
                    title: 'Executors & thread pools',
                    summary:
                        'How real applications do concurrency. Pool sizing, queue choice and rejection policy are the follow-ups.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['executors-and-thread-pools'],
                    interview: [
                        'Why is `Executors.newFixedThreadPool` with an unbounded queue dangerous?',
                        'How do you size a pool for CPU-bound versus I/O-bound work?',
                    ],
                },
                {
                    id: 'completablefuture',
                    title: 'CompletableFuture & atomics',
                    summary:
                        'Composing async work, and the lock-free path — CAS, ABA, and why AtomicInteger beats a synchronized counter.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['completablefuture', 'atomics-and-cas'],
                    interview: [
                        'Call three services in parallel and combine the results. Now handle one of them failing.',
                        'What is compare-and-swap and what is the ABA problem?',
                    ],
                },
            ],
        },
        {
            id: 'jvm',
            title: 'JVM Internals',
            goal: 'Diagnose a memory problem instead of restarting the server.',
            nodes: [
                {
                    id: 'classloading',
                    title: 'Class loading & delegation',
                    summary:
                        'Bootstrap → platform → application, and the parent-delegation model that stops you from replacing java.lang.String.',
                    tier: 'advanced',
                    est: '2h',
                    topics: ['classloading'],
                    interview: [
                        'Why does the parent-delegation model exist?',
                        'What is ClassNotFoundException vs NoClassDefFoundError?',
                    ],
                },
                {
                    id: 'jvm-memory',
                    title: 'JVM memory areas',
                    summary:
                        'Heap, stack, metaspace, code cache. Knowing where an OutOfMemoryError came from starts here.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['jvm-memory-areas'],
                    interview: [
                        'What replaced PermGen and why?',
                        'Which memory area does StackOverflowError come from?',
                    ],
                },
                {
                    id: 'gc',
                    title: 'Garbage collection',
                    summary:
                        'Generational collection, the common collectors, and stop-the-world pauses. A senior-round staple.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['garbage-collection'],
                    interview: [
                        'Why generational GC? What assumption is it built on?',
                        'Can you force garbage collection? What does System.gc() actually do?',
                        'What is a memory leak in a garbage-collected language?',
                    ],
                },
                {
                    id: 'troubleshooting',
                    title: 'Diagnosing memory & performance problems',
                    summary:
                        'Heap dumps, thread dumps, jstack, jmap. This is the "production is on fire" question.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['jvm-troubleshooting'],
                    interview: [
                        'A service OOMs every six hours. Walk me through your investigation.',
                        'CPU is pinned at 100%. What do you capture first?',
                    ],
                },
            ],
        },
        {
            id: 'modern-java',
            title: 'Modern Java (11 → 21)',
            goal: 'Sound current, not like you stopped at Java 8.',
            nodes: [
                {
                    id: 'records-sealed',
                    title: 'Records, sealed types & pattern matching',
                    summary:
                        'The features that changed how you model data. Records also give you equals/hashCode/toString for free — tie that back to the contract.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['var-and-text-blocks', 'records-and-sealed-types', 'pattern-matching'],
                    external: [
                        {
                            title: 'Record classes — Javadoc guide',
                            url: 'https://docs.oracle.com/en/java/javase/21/language/records.html',
                        },
                    ],
                    interview: [
                        'When is a record the right choice, and when is it not?',
                        'What do sealed types let the compiler do for you in a switch?',
                    ],
                },
                {
                    id: 'virtual-threads',
                    title: 'Virtual threads',
                    summary:
                        'Java 21\'s headline feature: cheap threads that unblock the thread-per-request model. Increasingly asked, and a good differentiator.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['virtual-threads'],
                    external: [
                        { title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
                    ],
                    interview: [
                        'What problem do virtual threads solve that thread pools do not?',
                        'What is pinning, and what still causes it?',
                    ],
                },
            ],
        },
        {
            id: 'spring',
            title: 'Spring & Data',
            goal: 'Explain the framework instead of just configuring it.',
            nodes: [
                {
                    id: 'ioc-di',
                    title: 'IoC & dependency injection',
                    summary:
                        'The idea the whole framework rests on. Constructor injection versus field injection is a strong-opinion question — have one.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['ioc-and-dependency-injection'],
                    external: [
                        { title: 'Spring Framework — Core', url: 'https://spring.io/projects/spring-framework' },
                    ],
                    interview: [
                        'Why is constructor injection preferred over @Autowired on a field?',
                        'What is inversion of control, in one sentence?',
                    ],
                },
                {
                    id: 'beans',
                    title: 'Bean lifecycle, scopes & proxies',
                    summary:
                        'Singleton by default, and the proxy mechanism that explains why a self-invoked @Transactional method silently does nothing.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['bean-lifecycle-and-scopes'],
                    interview: [
                        'Are singleton beans thread-safe?',
                        'Why does calling an annotated method from inside the same class skip the annotation?',
                    ],
                },
                {
                    id: 'boot-mvc',
                    title: 'Spring Boot auto-configuration & MVC',
                    summary:
                        'What @SpringBootApplication actually turns on, and the DispatcherServlet request flow end to end.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['spring-boot-autoconfiguration', 'spring-mvc-request-flow'],
                    external: [
                        { title: 'Spring Boot', url: 'https://spring.io/projects/spring-boot' },
                    ],
                    interview: [
                        'Trace a request from the servlet container to your controller method and back.',
                        'How does auto-configuration decide what to configure?',
                    ],
                },
                {
                    id: 'jpa',
                    title: 'JPA, the persistence context & N+1',
                    summary:
                        'Entity states, the first-level cache, lazy loading — and N+1, which is both an interview question and the most common real Spring performance bug.',
                    tier: 'advanced',
                    est: '4h',
                    topics: [
                        'jpa-entities-and-repositories',
                        'persistence-context',
                        'lazy-loading-and-n-plus-one',
                    ],
                    interview: [
                        'What is the N+1 problem and give two ways to fix it.',
                        'What is LazyInitializationException and why do you get it in a controller?',
                        'Name the four entity states.',
                    ],
                },
                {
                    id: 'transactional',
                    title: '@Transactional: propagation & isolation',
                    summary:
                        'Propagation levels, isolation levels, and the traps: private methods, self-invocation, and rollback only on unchecked exceptions by default.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['transactional'],
                    interview: [
                        'Does @Transactional roll back on a checked exception by default?',
                        'What does REQUIRES_NEW do differently from REQUIRED?',
                    ],
                },
                {
                    id: 'rest-security-testing',
                    title: 'REST, Spring Security & testing',
                    summary:
                        'API design in Spring, the security filter chain, JWT, and the slice tests that keep a suite fast.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['rest-api-design', 'spring-security-and-jwt', 'testing-junit-mockito'],
                    interview: [
                        'Where does authentication happen in the Spring Security filter chain?',
                        'What is @WebMvcTest and when do you use it over @SpringBootTest?',
                    ],
                },
            ],
        },
        {
            id: 'design',
            title: 'Design & LLD Round',
            goal: 'Turn a vague problem statement into classes on a whiteboard.',
            nodes: [
                {
                    id: 'solid-java',
                    title: 'SOLID in practice',
                    summary:
                        'Not the definitions — the Java examples. Be ready to point at a violation in code you are shown and name it.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['solid-in-java'],
                    interview: [
                        'Give a Java example of the Liskov substitution principle being violated.',
                        'What does dependency inversion look like in a Spring app?',
                    ],
                },
                {
                    id: 'patterns-java',
                    title: 'Design patterns that still earn their keep',
                    summary:
                        'Strategy, factory, builder, singleton, observer, decorator — with the Java standard library examples of each.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['design-patterns'],
                    interview: [
                        'Implement a thread-safe singleton. Now do it without synchronization on every access.',
                        'Where is the decorator pattern in java.io?',
                    ],
                },
                {
                    id: 'lld',
                    title: 'Low-level design walkthrough',
                    summary:
                        'The 45-minute round: clarify, identify entities, define interfaces, handle concurrency, then talk about what you would change at scale.',
                    tier: 'advanced',
                    kind: 'practice',
                    est: '6h',
                    topics: ['lld-walkthrough'],
                    interview: [
                        'Design a parking lot.',
                        'Design an elevator system for a 20-floor building.',
                        'Design a rate limiter.',
                    ],
                    build: 'Do three LLD problems on paper end to end, with class diagrams, before you look at any solution.',
                },
            ],
        },
    ],
};
