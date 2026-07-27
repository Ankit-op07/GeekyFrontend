/**
 * Java Interview Kit — Chapter 2: OOP Deep Dive.
 *
 * Pure data module. Diagrams via {{fig:...}} markers, inlined by seed-java-kit.js.
 *
 * ⚠️ Content strings are TEMPLATE LITERALS — never use a backtick inside them,
 * and always escape ${...} as \${...} or it will be interpolated.
 * including inside code comments. Use double quotes instead.
 */
module.exports = {
  title: 'OOP Deep Dive',
  slug: 'oop-deep-dive',
  order: 1,
  topics: [
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Classes, Objects and Constructors',
      slug: 'classes-objects-constructors',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Every Java program you will ever write is classes and objects, so it is tempting to skip this as revision. Do not. The specific things interviewers probe here — what a constructor is <em>not</em>, why constructor chaining exists, why calling an overridable method from a constructor is a bug — are the ones that separate someone who has typed <code>new</code> ten thousand times from someone who knows what it does. They also underpin Chapter 11: Spring's whole dependency-injection model is an argument about how objects should be constructed.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A <strong>class</strong> is a type: a description of what a thing has and what it can do. An <strong>object</strong> is one concrete instance of that description, living on the heap. The class is written once; objects are created as often as you like, and each gets its own copy of the instance fields while sharing one copy of the method code.</p>`,
        `{{fig:ch2-class-vs-object.svg|A class User containing field and method declarations with an arrow labelled new pointing to three separate User objects on the heap each with their own field values|The class is the blueprint and lives in Metaspace. Each object is a separate allocation on the heap with its own field values — but the method bytecode is stored once, with the class.}}`,
        `<p>A <strong>constructor</strong> is the code that runs to bring a new object into a valid state. It looks like a method but is not one: it has no return type, its name must exactly match the class, and it cannot be called on an existing object. Its single job is to establish the invariants the rest of the class then relies on.</p>`,
        `<h2>How it works</h2>`,
        `<p><code>new User("Asha", 30)</code> is four steps, in order:</p>`,
        `<ol>` +
        `<li><strong>Allocate</strong> — the JVM reserves heap space for the object's fields plus its header, and zeroes it. Every field is now <code>0</code>, <code>false</code> or <code>null</code>.</li>` +
        `<li><strong>Chain upward</strong> — the constructor's first act is to call a superclass constructor, all the way to <code>Object</code>.</li>` +
        `<li><strong>Initialise</strong> — instance field initialisers and instance blocks run, then the constructor body.</li>` +
        `<li><strong>Return the reference</strong> — <code>new</code> evaluates to the address of the finished object.</li>` +
        `</ol>`,
        `<p>Step 2 is the one worth internalising. <strong>Every constructor's first statement is a call to another constructor</strong> — either <code>this(...)</code> for a sibling in the same class, or <code>super(...)</code> for the parent. If you write neither, the compiler silently inserts <code>super()</code>. This is why an entire chain of constructors runs on a single <code>new</code>.</p>`,
        `{{fig:ch2-constructor-chaining.svg|Three stacked boxes for Object Employee and Manager with red arrows going up labelled calls go up and green arrows coming down labelled bodies run down|Calls travel up the hierarchy first; bodies then execute downward. By the time Manager's body runs, every ancestor has finished initialising — which is exactly the guarantee it depends on.}}`,
        `<p>Two consequences follow immediately. First, if a parent has no no-argument constructor, the child <em>must</em> call <code>super(...)</code> explicitly — otherwise the implicit <code>super()</code> does not compile. Second, the parent's body runs <em>before</em> the child's, which is why calling an overridable method from a constructor is dangerous: the override executes against a half-built child.</p>`,
        `<p>The <strong>default constructor</strong> has a rule people get wrong: the compiler generates a no-argument constructor <em>only if you declare no constructor at all</em>. Write any constructor and the free one disappears — which is why adding <code>User(String name)</code> to a class can break code that called <code>new User()</code>.</p>`,
        `<h2>Code examples</h2>`,
        `<pre><code class="language-java">public class User {
    private final String name;     // final → must be assigned exactly once
    private int age;
    private final List&lt;String&gt; roles = new ArrayList&lt;&gt;();   // field initialiser

    // Primary constructor — establishes every invariant in one place.
    public User(String name, int age) {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("name required");
        if (age &lt; 0) throw new IllegalArgumentException("age must be >= 0");
        this.name = name;          // "this." disambiguates field from parameter
        this.age = age;
    }

    // Convenience constructor — delegates rather than duplicating validation.
    public User(String name) {
        this(name, 0);             // must be the FIRST statement
    }
}</code></pre>`,
        `<p>Delegating with <code>this(...)</code> rather than copy-pasting validation is the habit interviewers look for: it means the invariants are enforced in exactly one place, no matter which constructor is used.</p>`,
        `<p>The classic constructor bug, which is worth being able to recognise on sight:</p>`,
        `<pre><code class="language-java">class Parent {
    Parent() {
        init();                    // ✘ calls the OVERRIDE, on a half-built child
    }
    void init() { System.out.println("Parent.init"); }
}

class Child extends Parent {
    private String value = "ready";

    @Override
    void init() {
        System.out.println("Child.init, value = " + value);
    }
}

new Child();
// Parent.init  is never printed — Child.init runs instead
// Child.init, value = null
//
// Why: the parent constructor runs BEFORE Child's field initialisers, so
// "value" is still null when the override executes. Never call an
// overridable method from a constructor.</code></pre>`,
        `<p>And the disappearing default constructor:</p>`,
        `<pre><code class="language-java">class A { }                        // compiler adds A() for you
new A();                           // ✔ compiles

class B { B(String s) { } }        // you declared one → no free A()
// new B();                        // ✘ "constructor B in class B cannot be
//                                       applied to given types"</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p>In bytecode a constructor is a method named <code>&lt;init&gt;</code>, and <code>new</code> compiles into two separate instructions — <code>new</code> (allocate and zero) followed by <code>invokespecial &lt;init&gt;</code> (run the constructor). Those being separate is the reason a partially-constructed object can be observed at all: between them, the object exists with every field at its default value. It is also why <code>this</code> escaping a constructor — registering a listener, starting a thread, publishing to a static registry — is a genuine concurrency hazard. Another thread can reach an object whose <code>final</code> fields are not yet visible to it. Chapter 8 returns to this as <em>unsafe publication</em>.</p>`,
        `<p>The <strong>object header</strong> is worth knowing for memory questions: every object carries roughly 12–16 bytes of header (a mark word for hash code, GC age and lock state, plus a class pointer), padded to an 8-byte boundary. So an object with a single <code>int</code> field costs about 16 bytes, not 4. That overhead is exactly the argument for primitives in Chapter 1 and for records in Chapter 10.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Giving a constructor a return type.</strong> <code>void User() { }</code> compiles — as an ordinary method that is never called. A silent, maddening bug.</li>` +
        `<li><strong>Calling an overridable method from a constructor.</strong> The override runs against uninitialised subclass state. Make such methods <code>private</code>, <code>static</code> or <code>final</code>.</li>` +
        `<li><strong>Duplicating validation across constructors.</strong> Delegate with <code>this(...)</code> so the rules live once.</li>` +
        `<li><strong>Assuming the default constructor is always there.</strong> Declaring any constructor removes it.</li>` +
        `<li><strong>Letting <code>this</code> escape.</strong> Publishing a reference before the constructor finishes exposes a half-built object.</li>` +
        `<li><strong>Telescoping constructors.</strong> Six overloads differing by argument count is a smell — use a builder (Chapter 14) or a record (Chapter 10).</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is a constructor, and how does it differ from a method?"</strong><br>A: It is the code that initialises a newly allocated object. It has no return type, its name must match the class exactly, it cannot be called on an existing object, and it is not inherited. The compiler represents it as a special method named <code>&lt;init&gt;</code>, but at the language level it is a distinct construct.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Can a constructor be private?"</strong><br>A: Yes, and it is a deliberate design tool. A private constructor prevents outside instantiation — used by singletons, by static utility classes so nobody can instantiate them, and by classes that expose static factory methods like <code>Integer.valueOf</code> so the class controls its own creation.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is constructor chaining?"</strong><br>A: Every constructor begins by invoking another one — <code>this(...)</code> to delegate within the class, or <code>super(...)</code> to the parent — and the compiler inserts <code>super()</code> if you write neither. So one <code>new</code> runs a chain of constructors from <code>Object</code> downward, guaranteeing that by the time a class's body executes, all its inherited state is already initialised.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why must <code>this()</code> or <code>super()</code> be the first statement?"</strong><br>A: Because otherwise you could observe or use inherited state before the superclass had initialised it — the exact bug the chaining rule exists to prevent. (Java 22 relaxes this slightly to allow statements that do not reference the instance, but the guarantee is unchanged.)</p></blockquote>`,
        `<blockquote><p><strong>Q: "Are constructors inherited?"</strong><br>A: No. A subclass does not inherit its parent's constructors — it must declare its own and call <code>super(...)</code>. This is why adding a required argument to a parent constructor breaks every subclass at compile time, which is usually what you want.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What happens if a constructor throws an exception?"</strong><br>A: The object is never successfully constructed and the reference is never assigned; the partially built object becomes garbage. That is exactly why validation belongs in the constructor — failing there means an invalid instance cannot exist. The caveat is that if <code>this</code> escaped before the throw, something may still hold a reference to a broken object.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Class = type (Metaspace). Object = instance (heap). Fields per object; method code shared.</li>` +
        `<li>Constructor: <strong>no return type</strong>, name = class, <strong>not inherited</strong>, compiled as <code>&lt;init&gt;</code>.</li>` +
        `<li>First statement is always <code>this(...)</code> or <code>super(...)</code> — inserted implicitly if absent.</li>` +
        `<li>Order: allocate/zero → chain up → field initialisers → constructor body.</li>` +
        `<li><strong>Default constructor disappears</strong> the moment you declare any constructor.</li>` +
        `<li>Never call an <strong>overridable</strong> method from a constructor — the override sees uninitialised child fields.</li>` +
        `<li>Never let <code>this</code> escape a constructor — unsafe publication.</li>` +
        `<li>Object header ≈ 12–16 bytes; an object with one <code>int</code> costs ~16, not 4.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Inheritance, Overriding and Polymorphism',
      slug: 'inheritance-and-overriding',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Polymorphism is the mechanism that makes every framework you use possible. Spring can call your controller, JUnit can call your test, a <code>List</code> can be an <code>ArrayList</code> or a <code>LinkedList</code> without the calling code caring — all of it is one JVM feature: the method that runs is chosen by the object, not by the variable that names it.</p>`,
        `<p>It is also the richest source of trick questions in a Java interview, because overloading and overriding look similar and behave completely differently. Get the distinction crisp and a whole family of "what does this print?" questions becomes trivial.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p><strong>Inheritance</strong> lets a class extend another, acquiring its non-private members and adding or replacing behaviour. Java allows single inheritance of classes — one <code>extends</code> — and multiple inheritance of interfaces.</p>`,
        `<p><strong>Overriding</strong> is a subclass supplying its own version of an inherited method with the same signature. <strong>Overloading</strong> is several methods in the same class sharing a name but differing in parameters. They are unrelated ideas with confusingly similar names.</p>`,
        `{{fig:ch2-overload-vs-override.svg|Left panel shows three print methods with different parameter lists resolved by the compiler; right panel shows Animal Dog and Cat speak methods resolved at run time|The one-line summary: overloading is a compile-time decision based on the declared types; overriding is a run-time decision based on the actual object.}}`,
        `<p>The distinction has a precise name. Overloading is <strong>static binding</strong> — <code>javac</code> picks the target method and burns it into the bytecode. Overriding is <strong>dynamic binding</strong> — the bytecode names a method, and the JVM decides at the call which implementation to run by looking at the object.</p>`,
        `<h2>How it works</h2>`,
        `<p>Two types are in play at every call, and keeping them apart solves most puzzles:</p>`,
        `<ul>` +
        `<li>The <strong>static (declared) type</strong> — what the variable is declared as. It decides <em>what you are allowed to call</em>.</li>` +
        `<li>The <strong>runtime type</strong> — what the object actually is. It decides <em>which implementation runs</em>.</li>` +
        `</ul>`,
        `{{fig:ch2-dynamic-dispatch.svg|A reference variable a of static type Animal pointing to a Dog object which has a method table where speak resolves to Dog.speak; a.speak compiles and dispatches to Dog while a.fetch is a compile error|Both types matter, at different moments. The compiler checks the call against Animal; the JVM dispatches through the Dog object's method table.}}`,
        `<p>The rules for a valid override are worth knowing exactly, because interviewers test the edges:</p>`,
        `<table><thead><tr><th>Aspect</th><th>Rule</th></tr></thead><tbody>` +
        `<tr><td>Signature</td><td>Must match exactly — name and parameter types. Different parameters = overload, not override.</td></tr>` +
        `<tr><td>Return type</td><td>Same, or a <strong>covariant</strong> subtype (an override may return <code>Dog</code> where the parent returned <code>Animal</code>).</td></tr>` +
        `<tr><td>Access</td><td>May widen, never narrow. <code>protected</code> → <code>public</code> is fine; <code>public</code> → <code>protected</code> will not compile.</td></tr>` +
        `<tr><td>Checked exceptions</td><td>May throw fewer or narrower ones, never new or broader ones. Unchecked exceptions are unrestricted.</td></tr>` +
        `<tr><td>Cannot override</td><td><code>final</code>, <code>static</code> and <code>private</code> methods, and constructors.</td></tr>` +
        `</tbody></table>`,
        `<p>Every one of those restrictions serves the same principle — the <strong>Liskov substitution principle</strong>. Code written against the parent must keep working when handed a child. Narrowing access or throwing a new checked exception would break a caller that compiled fine against the parent, so the language forbids it.</p>`,
        `<h2>Code examples</h2>`,
        `<p>Polymorphism doing its job — one loop, three behaviours, no <code>if</code>:</p>`,
        `<pre><code class="language-java">abstract class Animal {
    abstract String speak();
    void describe() { System.out.println(getClass().getSimpleName() + " says " + speak()); }
}
class Dog extends Animal { String speak() { return "Woof"; } }
class Cat extends Animal { String speak() { return "Meow"; } }
class Cow extends Animal { String speak() { return "Moo";  } }

List&lt;Animal&gt; animals = List.of(new Dog(), new Cat(), new Cow());
for (Animal a : animals) a.describe();
// Dog says Woof / Cat says Meow / Cow says Moo
//
// describe() was compiled once against Animal and has never heard of Cow.
// Adding a fourth animal requires no change here at all — that is the payoff.</code></pre>`,
        `<p>The trick question this topic exists for. Fields and static methods are <em>not</em> polymorphic:</p>`,
        `<pre><code class="language-java">class Parent {
    String label = "parent-field";
    String instanceMethod() { return "parent-instance"; }
    static String staticMethod() { return "parent-static"; }
}
class Child extends Parent {
    String label = "child-field";                       // HIDES, does not override
    @Override String instanceMethod() { return "child-instance"; }
    static String staticMethod() { return "child-static"; }   // HIDES
}

Parent p = new Child();
System.out.println(p.label);            // parent-field    ← static type wins
System.out.println(p.instanceMethod()); // child-instance  ← runtime type wins
System.out.println(p.staticMethod());   // parent-static   ← static type wins

// Only INSTANCE METHODS are dynamically dispatched. Fields and static
// methods are resolved from the declared type at compile time. This is
// called hiding, and it is a reason to avoid re-declaring either.</code></pre>`,
        `<p>Overload resolution surprises, all decided before the program runs:</p>`,
        `<pre><code class="language-java">static void f(Object o) { System.out.println("Object"); }
static void f(String s) { System.out.println("String"); }

f("hi");            // String — most specific applicable overload
f((Object) "hi");   // Object — the CAST changed the static type
f(null);            // String — null matches both, so the most specific wins

// Add a third overload and the last line stops compiling:
// static void f(Integer i) { }
// f(null);  → "reference to f is ambiguous" — String and Integer are
//             equally specific and neither is a subtype of the other.</code></pre>`,
        `<p>And <code>@Override</code> earning its keep:</p>`,
        `<pre><code class="language-java">class Base { boolean equals(Base other) { return true; } }   // ✘ silent bug:
// this OVERLOADS Object.equals(Object) instead of overriding it, so HashMap
// and every library that calls equals(Object) ignores it entirely.

class Fixed {
    @Override                      // ✔ compiler now checks the claim
    public boolean equals(Object o) { … }
}
// @Override is optional to the JVM and close to mandatory in practice:
// it turns a silent behavioural bug into a compile error.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p>Dynamic dispatch is implemented with a <strong>virtual method table</strong>. Each class has a table mapping method slots to implementations; a subclass inherits its parent's table and overwrites the slots it overrides. A virtual call compiles to <code>invokevirtual</code>, which at run time reads the object's class pointer, finds the table, and jumps to whatever is in the slot. That is one indirection — cheap, but not free.</p>`,
        `<p>Except the JIT usually removes even that. If profiling shows a call site has only ever seen one receiver type — the <strong>monomorphic</strong> case, which is the overwhelming majority in real code — the JIT compiles a direct call guarded by a class check, and then inlines it. This is why "virtual calls are slow, mark everything <code>final</code> for performance" is obsolete advice: the JIT already devirtualises, and deoptimises safely if a second type ever shows up. Use <code>final</code> to express design intent, not to chase speed.</p>`,
        `<p>The four <code>invoke</code> instructions are worth being able to name: <code>invokevirtual</code> for ordinary instance methods, <code>invokeinterface</code> for interface calls, <code>invokestatic</code> for statics, and <code>invokespecial</code> for constructors, <code>private</code> methods and explicit <code>super</code> calls — the three cases where dispatch must <em>not</em> be virtual.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Confusing overloading with overriding.</strong> Different parameters means a new method, and the compiler will happily let you think you overrode something.</li>` +
        `<li><strong>Omitting <code>@Override</code>.</strong> It is the cheapest bug prevention in Java. Always write it.</li>` +
        `<li><strong>Expecting fields to be polymorphic.</strong> They are resolved from the declared type. Re-declaring a field in a subclass hides it and is almost always a mistake.</li>` +
        `<li><strong>Thinking static methods can be overridden.</strong> They are hidden, and dispatched from the declared type. Calling a static through an instance reference is legal and misleading — do not.</li>` +
        `<li><strong>Extending for code reuse.</strong> Inheritance is an "is-a" claim that also inherits every future change to the parent. Favour composition unless substitutability is genuinely true.</li>` +
        `<li><strong>Overriding <code>equals</code> with the wrong parameter type.</strong> <code>equals(MyType)</code> overloads rather than overrides — the exact bug <code>@Override</code> catches.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Difference between overloading and overriding?"</strong><br>A: Overloading is several methods in one class with the same name and different parameter lists; the compiler picks one from the arguments' declared types, so it is static binding. Overriding is a subclass replacing an inherited method with the identical signature; the JVM picks the implementation from the actual object at run time, so it is dynamic binding. Only overriding is polymorphism.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Can you override a static method?"</strong><br>A: No. Redeclaring a static method in a subclass <em>hides</em> it. Static methods belong to the class and are resolved from the declared type at compile time, so there is no dispatch on the object. <code>Parent p = new Child(); p.staticMethod();</code> calls the parent's version.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Are fields polymorphic?"</strong><br>A: No. Field access is resolved from the static type. If a subclass declares a field with the same name it hides the parent's, and which one you see depends on the declared type of the reference, not the object. It is a strong argument for keeping fields private.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What are the rules for a valid override?"</strong><br>A: Same name and parameter types; return type identical or covariant; access may widen but never narrow; checked exceptions may be narrowed or dropped but never broadened; and <code>final</code>, <code>static</code> and <code>private</code> methods cannot be overridden. All of it follows from Liskov substitution — code compiled against the parent must still work with a child.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why does Java not support multiple inheritance of classes?"</strong><br>A: To avoid the diamond problem for <em>state</em>. If a class inherited from two parents that both defined a field, the object would have two copies and no rule about which to use. Java allows multiple interface inheritance because interfaces carry no instance state — and where default methods create an ambiguity, the compiler forces you to resolve it explicitly.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How is dynamic dispatch implemented, and is it slow?"</strong><br>A: Each class has a virtual method table; a subclass inherits its parent's and overwrites overridden slots. <code>invokevirtual</code> reads the object's class pointer and jumps through the table — one indirection. In practice it is usually free, because most call sites are monomorphic and the JIT devirtualises and inlines them behind a guard, deoptimising if a second type appears.</p></blockquote>`,
        `<blockquote><p><strong>Q: "When would you choose composition over inheritance?"</strong><br>A: Almost by default. Inheritance couples you to the parent's implementation forever and is only honest when the subclass genuinely is substitutable. If I only want to reuse code, composition — hold an instance and delegate — gives the same reuse without the coupling, works with <code>final</code> classes, and can be changed at run time. The classic counter-example is <code>java.util.Stack</code> extending <code>Vector</code>, which leaks methods that let you break the stack invariant.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><strong>Overload</strong> = same name, different parameters, <strong>compile-time</strong>, static type.</li>` +
        `<li><strong>Override</strong> = same signature in a subclass, <strong>run-time</strong>, actual object.</li>` +
        `<li>Static type = what you may call. Runtime type = which code runs.</li>` +
        `<li><strong>Not polymorphic</strong>: fields, <code>static</code> methods, <code>private</code> methods → hidden, not overridden.</li>` +
        `<li>Override rules: covariant return, <strong>widen access only</strong>, no broader checked exceptions.</li>` +
        `<li>Always write <code>@Override</code> — turns a silent overload into a compile error.</li>` +
        `<li>Single class inheritance, multiple interface inheritance — the split exists because interfaces have no state.</li>` +
        `<li>vtable + <code>invokevirtual</code>; JIT devirtualises monomorphic sites, so <code>final</code>-for-speed is obsolete.</li>` +
        `<li>Prefer <strong>composition</strong> unless "is-a" is genuinely true.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Abstract Classes vs Interfaces',
      slug: 'abstract-class-vs-interface',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>This is the most-asked design question in Java interviews, and since Java 8 gave interfaces <code>default</code> methods the old answer — "interfaces cannot have implementations" — is simply wrong. Candidates still recite it constantly, which makes an accurate answer a strong differentiator. The real distinction moved from <em>what they can contain</em> to <em>what they mean</em>: an abstract class models identity and shared state, an interface models capability.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>An <strong>abstract class</strong> is a partially built class. It can have constructors, mutable instance fields, any access modifier, and a mix of implemented and abstract methods. A class <code>extends</code> exactly one.</p>`,
        `<p>An <strong>interface</strong> is a contract. It can declare abstract methods, provide <code>default</code> implementations, and hold <code>static</code> and <code>private</code> helpers — but it has <strong>no instance state</strong> and no constructor. A class <code>implements</code> as many as it likes.</p>`,
        `{{fig:ch2-abstract-vs-interface.svg|Side by side comparison of an abstract class Animal with protected fields a constructor and a mix of abstract and concrete methods versus an interface Swimmer with abstract default static methods and a constant|The line that still holds after Java 8: an abstract class can carry per-object state; an interface cannot. Its "fields" are implicitly public static final constants.}}`,
        `<p>The decision rule that fits real code: ask whether the shared thing is <strong>what the object is</strong> or <strong>what it can do</strong>. A <code>Dog</code> <em>is an</em> <code>Animal</code> — one identity, shared state, abstract class. A <code>Dog</code> and a <code>Submarine</code> can both <em>swim</em> — a capability shared by otherwise unrelated types, interface.</p>`,
        `<h2>How it works</h2>`,
        `<table><thead><tr><th></th><th>Abstract class</th><th>Interface</th></tr></thead><tbody>` +
        `<tr><td>How many</td><td>extends <strong>one</strong></td><td>implements <strong>many</strong></td></tr>` +
        `<tr><td>Instance fields</td><td>Yes, any modifier, mutable</td><td><strong>No</strong> — fields are implicitly <code>public static final</code></td></tr>` +
        `<tr><td>Constructor</td><td>Yes (called via <code>super()</code>)</td><td>No</td></tr>` +
        `<tr><td>Method bodies</td><td>Yes</td><td>Yes — <code>default</code> and <code>static</code> since Java 8, <code>private</code> since Java 9</td></tr>` +
        `<tr><td>Method access</td><td>Any, including <code>protected</code></td><td>Implicitly <code>public</code> (or <code>private</code> for helpers)</td></tr>` +
        `<tr><td>Instantiable</td><td>No</td><td>No</td></tr>` +
        `<tr><td>Models</td><td>"is-a" — identity</td><td>"can-do" — capability</td></tr>` +
        `</tbody></table>`,
        `<p><strong>Why <code>default</code> methods were added</strong> is a genuinely good answer to give, because it explains a design constraint rather than a syntax rule. Java 8 needed to add <code>stream()</code>, <code>forEach()</code> and others to <code>Collection</code>. Adding an abstract method to an interface breaks every existing implementation — every <code>List</code> in every library on Earth would have failed to compile. <code>default</code> methods let an interface be extended with a working implementation, so old code keeps compiling. They exist for <strong>backward-compatible interface evolution</strong>, not to turn interfaces into abstract classes.</p>`,
        `<p>Multiple interfaces with the same default method create an ambiguity, and Java refuses to guess:</p>`,
        `<pre><code class="language-java">interface A { default String hello() { return "A"; } }
interface B { default String hello() { return "B"; } }

// class C implements A, B { }
// ✘ "class C inherits unrelated defaults for hello() from types A and B"

class C implements A, B {
    @Override public String hello() {
        return A.super.hello();     // explicit, unambiguous resolution
    }
}</code></pre>`,
        `<p>That <code>A.super.hello()</code> syntax is the diamond problem being solved by <em>forcing a decision</em> — which is exactly why default methods did not reintroduce the problem multiple class inheritance would have. And when a class inherits both a superclass method and an interface default with the same signature, <strong>the class wins</strong>: real implementations beat defaults.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The classic combination — an abstract class for identity, interfaces for capability:</p>`,
        `<pre><code class="language-java">abstract class Animal {
    protected final String name;                 // shared STATE
    protected Animal(String name) { this.name = name; }

    abstract String speak();                     // every animal must answer
    void sleep() { System.out.println(name + " sleeps"); }   // shared behaviour
}

interface Swimmer { void swim(); }
interface Trainable {
    void learn(String trick);
    default void praise() { System.out.println("Good!"); }   // opt-in default
}

// Dog IS an Animal, and CAN swim and be trained.
class Dog extends Animal implements Swimmer, Trainable {
    Dog(String name) { super(name); }
    String speak() { return "Woof"; }
    public void swim() { System.out.println(name + " paddles"); }
    public void learn(String trick) { System.out.println(name + " learns " + trick); }
}

// Submarine is not an Animal at all — but it can swim.
class Submarine implements Swimmer {
    public void swim() { System.out.println("Dive!"); }
}

// And now one method serves both, with no common ancestor:
static void race(List&lt;Swimmer&gt; competitors) { competitors.forEach(Swimmer::swim); }</code></pre>`,
        `<p>That last line is the payoff. <code>Dog</code> and <code>Submarine</code> share no class hierarchy, and an abstract class could never have united them.</p>`,
        `<p>What an interface cannot do — and the trap it creates:</p>`,
        `<pre><code class="language-java">interface Counter {
    int MAX = 100;          // implicitly public static final — a CONSTANT
    // int current;         // ✘ will not compile: no instance fields

    void increment();
    default void reset() { /* cannot touch per-object state — there is none */ }
}
// This is the real limit of default methods: they can only call other
// interface methods. They cannot read or write per-instance state, which
// is exactly why they did not make abstract classes redundant.</code></pre>`,
        `<p>Functional interfaces, the bridge to Chapter 7:</p>`,
        `<pre><code class="language-java">@FunctionalInterface               // compiler enforces exactly one abstract method
interface Validator {
    boolean test(String input);    // the single abstract method
    default Validator and(Validator other) {     // defaults do not break the count
        return s -&gt; this.test(s) &amp;&amp; other.test(s);
    }
}

Validator notBlank = s -&gt; !s.isBlank();
Validator shortEnough = s -&gt; s.length() &lt;= 20;
Validator both = notBlank.and(shortEnough);
// A lambda can implement an interface with one abstract method. It can never
// implement an abstract class — another reason the two are not interchangeable.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p>Interface calls compile to <code>invokeinterface</code> rather than <code>invokevirtual</code>, and historically that was slower: a class's position in a vtable is fixed by its hierarchy, but a class can implement many interfaces, so the JVM cannot use a simple fixed offset and must search or consult a cache. In modern HotSpot the gap is negligible for monomorphic call sites, which the JIT devirtualises and inlines exactly as it does virtual calls. It is not a reason to prefer abstract classes.</p>`,
        `<p><strong>Java 17's sealed types</strong> add a third option that is worth naming, because it changes when each choice is right. A <code>sealed interface</code> declares exactly which types may implement it, which gives you an interface's flexibility <em>and</em> a closed set the compiler can reason about — so a <code>switch</code> over its implementations can be checked for exhaustiveness. For modelling a fixed set of alternatives (a payment result that is <code>Approved</code>, <code>Declined</code> or <code>Pending</code>), a sealed interface plus records is now often better than either classic option. Chapter 10 covers it properly.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Saying "interfaces cannot have method bodies".</strong> Outdated since Java 8. The accurate line is that interfaces cannot have <em>instance state</em>.</li>` +
        `<li><strong>Treating a field in an interface as per-object state.</strong> It is <code>public static final</code> — a shared constant.</li>` +
        `<li><strong>Using an abstract class purely to share a helper method.</strong> That burns the single inheritance slot. A <code>static</code> utility or composition is usually better.</li>` +
        `<li><strong>Using default methods as a dumping ground.</strong> They exist for compatible evolution. Piling logic into them creates behaviour with nowhere to keep state and no clean way to test.</li>` +
        `<li><strong>Forgetting <code>public</code> when implementing an interface method.</strong> Interface methods are implicitly public and access cannot narrow, so omitting it will not compile.</li>` +
        `<li><strong>Interface-per-class by reflex.</strong> An interface with exactly one implementation and no test seam is indirection without benefit.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Abstract class vs interface — when do you use each?"</strong><br>A: An abstract class when the implementations genuinely share identity and state — it can hold instance fields and a constructor, and a class gets only one. An interface when I am describing a capability that unrelated types can offer, or when I need a type to have several of them. Since Java 8 both can carry method bodies, so the deciding line is state: interfaces have none.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why were default methods added?"</strong><br>A: To evolve interfaces without breaking implementations. Java 8 needed to add <code>stream()</code> and <code>forEach()</code> to <code>Collection</code>; as abstract methods, that would have broken every existing implementation on the planet. A <code>default</code> gives a working body so old code keeps compiling. Backward-compatible evolution, not a redesign of interfaces.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Do default methods bring back the diamond problem?"</strong><br>A: No, because there is still no inherited <em>state</em> — that was the real problem with multiple class inheritance. If two interfaces supply the same default signature, the class simply will not compile until you override it, and you can delegate explicitly with <code>A.super.method()</code>. And a concrete method inherited from a superclass always beats an interface default.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Can an interface have a constructor or instance variables?"</strong><br>A: Neither. No constructor, because there is no instance state to initialise and interfaces are never instantiated directly. Any field you declare is implicitly <code>public static final</code> — a constant shared by everyone, not per-object state.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Can an abstract class have no abstract methods?"</strong><br>A: Yes. <code>abstract</code> on the class only means "cannot be instantiated". A class with all methods implemented can still be abstract, which is a reasonable way to say "this is a base to extend, never to use directly".</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is a functional interface?"</strong><br>A: One with exactly one abstract method, so a lambda or method reference can implement it. Default and static methods do not count toward that one. <code>@FunctionalInterface</code> makes the compiler enforce it. Note that this is something an abstract class can never be — lambdas only target interfaces.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Would a sealed interface change your answer?"</strong><br>A: Often, yes. If I am modelling a closed set of alternatives, a <code>sealed interface</code> with record implementations gives me interface flexibility plus a set the compiler knows is complete — so a switch over it is checked for exhaustiveness and adding a case breaks the build in the right place. That is now my default for sum types, with abstract classes reserved for genuine shared state.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>The line since Java 8 is <strong>state</strong>, not method bodies: interfaces have <strong>no instance fields</strong>.</li>` +
        `<li>Abstract class = <strong>is-a</strong>, one only, constructor + mutable fields. Interface = <strong>can-do</strong>, many.</li>` +
        `<li>Interface fields are <code>public static final</code> constants. Methods implicitly <code>public</code>.</li>` +
        `<li><code>default</code> exists for <strong>backward-compatible evolution</strong> (Java 8 added <code>stream()</code> to <code>Collection</code>).</li>` +
        `<li><code>static</code> in interfaces (8), <code>private</code> helpers (9).</li>` +
        `<li>Conflicting defaults → compile error → resolve with <code>A.super.m()</code>. <strong>Class beats interface.</strong></li>` +
        `<li>Lambdas target <strong>functional interfaces only</strong> — never abstract classes.</li>` +
        `<li>Closed set of alternatives? Reach for a <strong>sealed interface + records</strong> (Java 17).</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'Encapsulation and Access Modifiers',
      slug: 'encapsulation-access-modifiers',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Encapsulation is the OOP pillar most often reduced to a slogan — "make fields private and add getters and setters" — which is not encapsulation at all. A class with a private field, a getter and a setter has exactly the same exposure as a public field, with more typing. Interviewers who care about design ask this question specifically to find out whether you know the difference between hiding a <em>field</em> and hiding a <em>decision</em>.</p>`,
        `<p>The access modifiers themselves also carry two edge cases that come up constantly: what <code>protected</code> actually permits, and the fact that the default is not <code>public</code>.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p><strong>Encapsulation</strong> is keeping an object's internal representation private and exposing only operations that maintain its invariants. The point is that the class controls its own state — nobody outside can put it in an invalid condition, and the internals can change without breaking callers.</p>`,
        `<p>Java's four access levels are the mechanism:</p>`,
        `{{fig:ch2-access-modifiers.svg|Four nested rectangles from private innermost through package-private and protected out to public with a visibility table on the right|Widening rings. The default when you write no modifier is package-private — the second-narrowest, not public.}}`,
        `<p>The rule of thumb: <strong>start at <code>private</code> and widen only when something outside genuinely needs access</strong>. Every widening is a promise you may have to keep for years.</p>`,
        `<h2>How it works</h2>`,
        `<table><thead><tr><th>Modifier</th><th>Same class</th><th>Same package</th><th>Subclass (other package)</th><th>Anywhere</th></tr></thead><tbody>` +
        `<tr><td><code>private</code></td><td>✔</td><td>✘</td><td>✘</td><td>✘</td></tr>` +
        `<tr><td><em>(none)</em> — package-private</td><td>✔</td><td>✔</td><td>✘</td><td>✘</td></tr>` +
        `<tr><td><code>protected</code></td><td>✔</td><td>✔</td><td>✔ *</td><td>✘</td></tr>` +
        `<tr><td><code>public</code></td><td>✔</td><td>✔</td><td>✔</td><td>✔</td></tr>` +
        `</tbody></table>`,
        `<p>The asterisk hides the detail interviewers probe. <strong><code>protected</code> access from another package works only through a reference of the subclass's own type</strong> — a subclass may touch <em>its own</em> inherited member, not the same member on an arbitrary instance of the parent. This restriction stops a subclass being used as a back door into unrelated instances.</p>`,
        `<pre><code class="language-java">// package com.app.base
public class Base { protected int value; }

// package com.app.other
public class Sub extends Base {
    void demo(Base otherBase, Sub otherSub) {
        this.value = 1;         // ✔ my own inherited member
        otherSub.value = 2;     // ✔ through a Sub reference
        // otherBase.value = 3; // ✘ compile error — Base reference, other package
    }
}</code></pre>`,
        `<p>Note also that <strong><code>protected</code> is wider than package-private</strong>, not narrower — it adds subclasses <em>on top of</em> package access. And <code>private</code> is per-<em>class</em>, not per-object: one instance can freely read another instance's private fields, which is exactly what makes <code>equals</code> and <code>compareTo</code> writable.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The distinction between real encapsulation and getter/setter theatre:</p>`,
        `<pre><code class="language-java">// ✘ Encapsulation in name only. The setter lets anyone reach an invalid state,
//    exactly as a public field would — and the getter hands out the live list.
public class BadAccount {
    private double balance;
    private List&lt;String&gt; transactions = new ArrayList&lt;&gt;();

    public double getBalance() { return balance; }
    public void setBalance(double b) { this.balance = b; }        // balance = -5000?
    public List&lt;String&gt; getTransactions() { return transactions; } // caller can clear()
}

// ✔ Real encapsulation: operations, not accessors. The invariant
//    "balance is never negative" is enforced in one place and cannot be dodged.
public class Account {
    private double balance;
    private final List&lt;String&gt; transactions = new ArrayList&lt;&gt;();

    public void deposit(double amount) {
        if (amount &lt;= 0) throw new IllegalArgumentException("deposit must be positive");
        balance += amount;
        transactions.add("DEP " + amount);
    }

    public void withdraw(double amount) {
        if (amount &lt;= 0) throw new IllegalArgumentException("withdrawal must be positive");
        if (amount &gt; balance) throw new InsufficientFundsException(balance, amount);
        balance -= amount;
        transactions.add("WDR " + amount);
    }

    public double getBalance() { return balance; }

    public List&lt;String&gt; getTransactions() {
        return List.copyOf(transactions);       // defensive copy — caller cannot mutate
    }
}</code></pre>`,
        `<p>The leaky-getter bug is worth showing on its own, because it is so common in real code:</p>`,
        `<pre><code class="language-java">Account acc = new Account();
acc.deposit(100);

// With BadAccount, this compiles and silently destroys the audit trail:
// acc.getTransactions().clear();

// With Account it throws UnsupportedOperationException — the copy is immutable.
// Same lesson as Chapter 1's pass-by-value: handing out a reference to your
// internal object hands out control of it.</code></pre>`,
        `<p>And mutable fields need protecting on the way <em>in</em> too:</p>`,
        `<pre><code class="language-java">public final class DateRange {
    private final Date start;      // Date is mutable — a classic API mistake

    public DateRange(Date start) {
        this.start = new Date(start.getTime());   // copy IN, or the caller
    }                                             // can mutate our state later

    public Date getStart() {
        return new Date(start.getTime());         // copy OUT
    }
}
// Modern answer: use java.time.LocalDate/Instant, which are immutable, and
// the whole defensive-copying dance disappears.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p>Access modifiers are enforced twice: by <code>javac</code>, and again by the JVM at link time — the verifier rejects a class file that accesses a member it should not see. So they are a genuine boundary, not a compile-time convention. What they are <em>not</em> is a security barrier against a determined caller in the same JVM: reflection can historically bypass them with <code>setAccessible(true)</code>, which is how frameworks like Jackson and Hibernate populate private fields.</p>`,
        `<p>That loophole narrowed considerably. <strong>Java 9's module system</strong> added a second, stronger layer: a package is only visible outside its module if the module <code>exports</code> it, and reflective access needs <code>opens</code>. Since <strong>Java 16 strong encapsulation is the default</strong> for JDK internals, which is why <code>sun.misc.Unsafe</code>-style access and some older libraries broke on newer Java. "Public" now means public <em>and</em> exported.</p>`,
        `<p>Records (Chapter 10) are worth mentioning here as the modern answer to the data-carrier case: <code>record Point(int x, int y) { }</code> gives you final fields, accessors, <code>equals</code>, <code>hashCode</code> and <code>toString</code>, with no setters by construction. When someone asks about getters and setters, saying "for immutable data carriers I would reach for a record" is a good, current answer.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Equating encapsulation with getters and setters.</strong> A public setter for every private field is a public field with ceremony.</li>` +
        `<li><strong>Returning the live internal collection.</strong> Callers can mutate your state. Return <code>List.copyOf(...)</code> or an unmodifiable view.</li>` +
        `<li><strong>Storing a mutable argument directly.</strong> Copy on the way in as well as out — or use immutable types and skip both.</li>` +
        `<li><strong>Assuming no modifier means public.</strong> It means package-private. This surprises people coming from C#.</li>` +
        `<li><strong>Thinking <code>protected</code> is narrower than package-private.</strong> It is wider — package access plus subclasses.</li>` +
        `<li><strong>Making fields <code>protected</code> for subclasses.</strong> That freezes your representation into the subclass contract forever. Expose a <code>protected</code> method instead.</li>` +
        `<li><strong>Believing <code>private</code> is per-object.</strong> It is per-class; two instances of the same class see each other's privates.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is encapsulation?"</strong><br>A: Keeping an object's representation private and exposing only operations that preserve its invariants, so the class is the sole authority on its own state and the internals can change without breaking callers. Private fields are the mechanism, not the goal — a class with a setter for every field is not encapsulated, because any caller can still drive it into an invalid state.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is the default access modifier?"</strong><br>A: Package-private — visible within the same package only. It is the second-narrowest level, not <code>public</code>, and it is genuinely useful: it lets classes that collaborate closely inside a package cooperate without exposing anything to the outside world.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Explain <code>protected</code> precisely."</strong><br>A: Same package, plus subclasses in any package. The subtlety is that cross-package subclass access only works through a reference of the subclass's own type — a subclass can touch its own inherited member, not that member on an arbitrary parent instance. That stops subclassing being used as a back door into unrelated objects.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Can a class be private?"</strong><br>A: A top-level class can only be <code>public</code> or package-private. Nested classes can be any of the four — a <code>private static</code> nested class is a common way to keep an implementation detail genuinely invisible.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do frameworks set private fields?"</strong><br>A: Reflection with <code>setAccessible(true)</code> — which is how Hibernate and Jackson populate entities without demanding setters. Access modifiers are checked by the compiler and the JVM verifier, but they were never a security boundary within a JVM. Since Java 9's module system, and strong encapsulation by default from Java 16, that access needs the package to be <code>opens</code>-ed, which is why some older libraries broke on newer Java.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Is returning a getter for a list a problem?"</strong><br>A: Yes, if it returns the live collection — the caller receives a reference to your internal object and can clear or reorder it, bypassing every invariant you enforce. Return <code>List.copyOf(...)</code> for a snapshot, or an unmodifiable view if the cost of copying matters and the caller understanding it is live is acceptable.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li>Encapsulation = <strong>hide the representation, expose operations that keep invariants</strong>. Not getters/setters.</li>` +
        `<li>Four levels: <code>private</code> ⊂ <strong>package-private (the default)</strong> ⊂ <code>protected</code> ⊂ <code>public</code>.</li>` +
        `<li><code>protected</code> = package + subclasses; cross-package only via a <strong>subclass-typed reference</strong>.</li>` +
        `<li><code>private</code> is <strong>per class, not per object</strong> — that is why <code>equals</code> can read the other instance.</li>` +
        `<li>Return <code>List.copyOf(...)</code>, never the live collection. Copy mutable arguments <strong>in and out</strong>.</li>` +
        `<li>Prefer immutable types (<code>java.time</code>, records) and the copying problem disappears.</li>` +
        `<li>Reflection bypasses modifiers; <strong>modules</strong> (9) and strong encapsulation (16) narrowed that.</li>` +
        `<li>Top-level classes: only <code>public</code> or package-private.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'equals() and hashCode(): The Contract',
      slug: 'equals-and-hashcode',
      order: 4,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>This is the single highest-yield topic in a Java interview. It is asked at every level, it has a precise correct answer, and getting it wrong causes one of the most baffling bugs in the language: an object you definitely put into a <code>HashMap</code> cannot be found again. Every collection in Chapter 4 depends on this contract, and so does every JPA entity in Chapter 12.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p><code>Object</code> gives every class two methods with default implementations that are almost always wrong for your class:</p>`,
        `<ul>` +
        `<li><code>equals(Object)</code> — defaults to <code>==</code>, i.e. "is this the same object?"</li>` +
        `<li><code>hashCode()</code> — defaults to a value derived from the object's identity, so two equal-in-meaning objects get different numbers.</li>` +
        `</ul>`,
        `<p>The contract binding them is short and absolute: <strong>if two objects are <code>equals</code>, they must have the same <code>hashCode</code></strong>. The converse is not required — two unequal objects may share a hash code, which is an ordinary collision.</p>`,
        `<p>Override one without the other and you break it. Overriding <code>equals</code> alone is the disaster case:</p>`,
        `{{fig:ch2-equals-hashcode.svg|Top half shows a put and a get producing different hash codes landing in different buckets so the lookup returns null; bottom half shows matching hash codes landing in the same bucket where equals confirms the match|A hash lookup is two steps: hashCode picks the bucket, equals confirms the key. If hashCode disagrees, the map never reaches step two — your entry is in the table and unreachable.}}`,
        `<h2>How it works</h2>`,
        `<p>The full <code>equals</code> contract — five properties, all testable:</p>`,
        `<table><thead><tr><th>Property</th><th>Meaning</th></tr></thead><tbody>` +
        `<tr><td>Reflexive</td><td><code>x.equals(x)</code> is true</td></tr>` +
        `<tr><td>Symmetric</td><td><code>x.equals(y)</code> ⟺ <code>y.equals(x)</code></td></tr>` +
        `<tr><td>Transitive</td><td>x=y and y=z ⟹ x=z</td></tr>` +
        `<tr><td>Consistent</td><td>Repeated calls give the same answer while the objects are unchanged</td></tr>` +
        `<tr><td>Non-null</td><td><code>x.equals(null)</code> is false, never an exception</td></tr>` +
        `</tbody></table>`,
        `<p>And the <code>hashCode</code> contract:</p>`,
        `<ul>` +
        `<li>Equal objects <strong>must</strong> have equal hash codes.</li>` +
        `<li>Unequal objects <em>should</em> ideally differ, for performance — but need not.</li>` +
        `<li>The value must be stable while the object's <code>equals</code>-relevant fields are unchanged.</li>` +
        `</ul>`,
        `<p>The lookup path makes the reason concrete. <code>map.get(key)</code> computes <code>key.hashCode()</code>, derives a bucket index from it, and <em>only then</em> walks that one bucket calling <code>equals</code>. If <code>hashCode</code> is inconsistent with <code>equals</code>, the search happens in the wrong bucket and <code>equals</code> is never consulted.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The bug, reproduced in six lines:</p>`,
        `<pre><code class="language-java">class Key {
    final String id;
    Key(String id) { this.id = id; }

    @Override public boolean equals(Object o) {
        return o instanceof Key k &amp;&amp; id.equals(k.id);
    }
    // hashCode() NOT overridden — inherited identity hash
}

Map&lt;Key, String&gt; map = new HashMap&lt;&gt;();
map.put(new Key("A"), "value");
System.out.println(map.get(new Key("A")));            // null   ✘
System.out.println(new Key("A").equals(new Key("A"))); // true  — yet unfindable
System.out.println(map.size());                        // 1     — it IS in there

Set&lt;Key&gt; set = new HashSet&lt;&gt;();
set.add(new Key("A"));
set.add(new Key("A"));
System.out.println(set.size());                        // 2     ✘ duplicates!</code></pre>`,
        `<p>The correct implementation, in the form worth memorising:</p>`,
        `<pre><code class="language-java">public final class Point {
    private final int x;
    private final int y;

    public Point(int x, int y) { this.x = x; this.y = y; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;                  // cheap identity fast path
        if (!(o instanceof Point)) return false;     // handles null AND wrong type
        Point p = (Point) o;
        return x == p.x &amp;&amp; y == p.y;                 // compare the same fields
    }                                                // hashCode uses (see below)

    @Override
    public int hashCode() {
        return Objects.hash(x, y);                   // same fields, same order
    }
}</code></pre>`,
        `<p>Note that <code>instanceof</code> already returns <code>false</code> for <code>null</code>, so it handles the non-nullity requirement for free — one reason it is preferred over <code>getClass() != o.getClass()</code> in most code. Java 16's pattern matching collapses the test and cast into one line:</p>`,
        `<pre><code class="language-java">@Override
public boolean equals(Object o) {
    return this == o || (o instanceof Point p &amp;&amp; x == p.x &amp;&amp; y == p.y);
}

// For most classes, stop hand-writing this entirely — a record generates
// a correct, consistent pair for you:
public record Point(int x, int y) { }</code></pre>`,
        `<p>The mutable-key trap, which is the second classic failure:</p>`,
        `<pre><code class="language-java">class MutableKey {
    String id;                                  // NOT final — the problem
    MutableKey(String id) { this.id = id; }
    @Override public boolean equals(Object o) {
        return o instanceof MutableKey k &amp;&amp; Objects.equals(id, k.id);
    }
    @Override public int hashCode() { return Objects.hash(id); }
}

MutableKey key = new MutableKey("A");
Map&lt;MutableKey, String&gt; map = new HashMap&lt;&gt;();
map.put(key, "value");

key.id = "B";                    // mutate a field equals/hashCode depends on

System.out.println(map.get(key));   // null — new hash, wrong bucket
System.out.println(map.containsKey(key)); // false
// The entry is still in the table, in the bucket for the OLD hash, and is now
// unreachable by any key. Hash keys must be effectively immutable.</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Why <code>Objects.hash</code> is not always the right answer.</strong> It is varargs, so it allocates an <code>Object[]</code> on every call and boxes primitives. In a hot path — a key used in millions of map lookups — that is measurable, and the hand-rolled form avoids it:</p>`,
        `<pre><code class="language-java">@Override
public int hashCode() {
    int result = 17;
    result = 31 * result + x;
    result = 31 * result + y;
    return result;
}
// 31 is the traditional multiplier: odd (so no information is lost to
// shifting), prime, and 31 * i compiles to (i &lt;&lt; 5) - i. Use Objects.hash
// for clarity by default, and this form only where profiling says it matters.</code></pre>`,
        `<p><strong>The symmetry trap with inheritance</strong> is the hardest part of this topic and a favourite senior question. If <code>Point</code> uses <code>instanceof</code> and <code>ColorPoint extends Point</code> adds a colour to its <code>equals</code>, then <code>point.equals(colorPoint)</code> is true while <code>colorPoint.equals(point)</code> is false — symmetry is broken, and collections behave unpredictably. There is no fully satisfying fix: <code>getClass()</code> comparison restores symmetry but breaks Liskov substitution (a subclass instance is never equal to a base instance, which also breaks Hibernate proxies). The honest answer is Joshua Bloch's — <strong>favour composition over inheritance for value classes</strong>, or make them <code>final</code>, which is precisely what records do.</p>`,
        `<p><strong>Never use a hash code as an identifier.</strong> It is 32 bits, not unique, and not stable across JVM runs for the default implementation. It is a bucket hint, nothing more.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>Overriding <code>equals</code> without <code>hashCode</code>.</strong> The headline bug: objects vanish inside hash collections.</li>` +
        `<li><strong>Writing <code>equals(MyType o)</code>.</strong> That overloads rather than overrides. <code>@Override</code> catches it instantly.</li>` +
        `<li><strong>Using different fields in each method.</strong> They must be derived from the same state, or the contract breaks.</li>` +
        `<li><strong>Mutating a field used by <code>hashCode</code> after inserting into a map.</strong> The entry becomes unreachable. Keys must be effectively immutable.</li>` +
        `<li><strong>Returning a constant from <code>hashCode</code>.</strong> Technically legal, and it degrades every hash map to a linked list.</li>` +
        `<li><strong>Using <code>==</code> to compare fields that are objects.</strong> Use <code>Objects.equals(a, b)</code>, which is also null-safe.</li>` +
        `<li><strong>Including derived or transient fields.</strong> A cached total or a timestamp makes equality unstable.</li>` +
        `<li><strong>Treating a hash code as an id.</strong> Collisions are normal and expected.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is the contract between <code>equals</code> and <code>hashCode</code>?"</strong><br>A: If two objects are equal by <code>equals</code>, they must return the same <code>hashCode</code>. The reverse is not required — unequal objects may collide. Both must be computed from the same fields, and <code>equals</code> must additionally be reflexive, symmetric, transitive, consistent, and false for null.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What happens if I override <code>equals</code> but not <code>hashCode</code>?"</strong><br>A: Hash-based collections break. Two objects that are equal get different identity hash codes, so they map to different buckets. <code>map.get(equalKey)</code> returns null even though the entry is there, and a <code>HashSet</code> will happily store duplicates. It is a silent bug — nothing throws.</p></blockquote>`,
        `<blockquote><p><strong>Q: "And the reverse — <code>hashCode</code> without <code>equals</code>?"</strong><br>A: Less catastrophic but still broken. Equal-in-meaning objects land in the same bucket, then <code>equals</code> falls back to identity comparison and says they are different — so lookups still fail and sets still hold duplicates. You need both.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why 31 in hash code implementations?"</strong><br>A: It is odd and prime, so multiplying does not throw away information the way an even factor's shifting would, and it spreads values reasonably. It also optimises well — <code>31 * i</code> becomes <code>(i &lt;&lt; 5) - i</code>. It is convention with sound reasons, not a magic number.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Can two unequal objects have the same hash code?"</strong><br>A: Yes, and it is expected — a hash code is 32 bits and the space of objects is unbounded, so collisions are inevitable. That is why the contract only runs one way, and why a hash map always calls <code>equals</code> after finding the bucket. Frequent collisions are only a performance problem, not a correctness one.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What if a key is mutated after being put in a map?"</strong><br>A: If the mutation touches a field <code>hashCode</code> depends on, the entry becomes unreachable — it sits in the bucket for the old hash while lookups compute the new one. It will not even be found by the very same key object. This is why map keys should be immutable, and why <code>String</code> is such a good key.</p></blockquote>`,
        `<blockquote><p><strong>Q: "<code>instanceof</code> or <code>getClass()</code> in <code>equals</code>?"</strong><br>A: <code>instanceof</code> for most code — it is null-safe and keeps subclass instances comparable, which matters for things like Hibernate proxies. Its weakness is that a subclass adding fields to <code>equals</code> breaks symmetry. <code>getClass()</code> restores symmetry but violates Liskov substitution. The real fix is to avoid inheritance for value types — make them <code>final</code>, or use a record.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you implement these today?"</strong><br>A: Usually I do not — a record generates a correct, consistent <code>equals</code>, <code>hashCode</code> and <code>toString</code> from its components. Where I need a class, I use pattern-matching <code>instanceof</code> plus <code>Objects.hash</code>, and I make the class final and its fields final so the key can never drift.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><strong>Equal ⟹ same hashCode.</strong> Same hashCode does NOT imply equal.</li>` +
        `<li>Override <strong>both, from the same fields</strong>, or hash collections break silently.</li>` +
        `<li><code>equals</code> must be reflexive, symmetric, transitive, consistent, false-for-null.</li>` +
        `<li>Lookup = <strong>hashCode picks the bucket, equals confirms the key</strong>.</li>` +
        `<li>Keys must be <strong>effectively immutable</strong> — mutating one strands the entry forever.</li>` +
        `<li><code>@Override</code> always: <code>equals(MyType)</code> is an overload, not an override.</li>` +
        `<li><code>Objects.hash(...)</code> for clarity; hand-rolled <code>31 *</code> form only in hot paths.</li>` +
        `<li><code>instanceof</code> over <code>getClass()</code>; symmetry breaks with subclass fields either way → make value classes <code>final</code>.</li>` +
        `<li>Best answer in modern Java: <strong>use a record</strong>.</li>` +
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    {
      title: 'static, final and Initialisation Order',
      slug: 'static-final-initialization-order',
      order: 5,
      content: [
        `<h2>Why it matters</h2>`,
        `<p><code>static</code> and <code>final</code> are two of the most-used keywords in Java and two of the most loosely understood. "Final means constant" and "static means global" are both close enough to be dangerous. The initialisation-order question that follows from them — what runs when — is a staple "what does this print?" puzzle, and the answer explains real problems: why a singleton can deadlock, why <code>final</code> does not make an object immutable, and why a static field is such a reliable memory leak.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p><strong><code>static</code></strong> means "belongs to the class, not to any instance". One copy exists, shared by every object, and it exists whether or not any object has been created.</p>`,
        `<p><strong><code>final</code></strong> means "assign exactly once". What it forbids depends on where it is:</p>`,
        `<table><thead><tr><th>Applied to</th><th>Means</th></tr></thead><tbody>` +
        `<tr><td>A variable or field</td><td>May be assigned once; the <em>binding</em> cannot change (the object it points at still can)</td></tr>` +
        `<tr><td>A method</td><td>Cannot be overridden</td></tr>` +
        `<tr><td>A class</td><td>Cannot be extended</td></tr>` +
        `<tr><td>A parameter</td><td>Cannot be reassigned inside the method</td></tr>` +
        `</tbody></table>`,
        `<p>The critical line, and the one interviewers push on: <strong><code>final</code> makes the reference immutable, not the object</strong>. <code>final List&lt;String&gt; list = new ArrayList&lt;&gt;();</code> forbids <code>list = somethingElse</code> and permits <code>list.add("x")</code> all day.</p>`,
        `<h2>How it works</h2>`,
        `<p>Initialisation happens in two phases with a strict order:</p>`,
        `{{fig:ch2-initialization-order.svg|Left column shows static field initialisers then static blocks running once followed by instance initialisers then constructor body running per object; right panel lists the full six step order with inheritance|Statics run once, when the class is first initialised. Instance parts run on every <code>new</code>. With inheritance, all statics precede all instance work, and the parent's instance phase precedes the child's.}}`,
        `<p>Within each phase, <strong>field initialisers and initialiser blocks run in source order</strong> — a static block placed above a static field runs before it, which is occasionally surprising and a reason to keep them near each other.</p>`,
        `<p><strong>When is a class initialised?</strong> Lazily, on first active use: instantiating it, calling a static method, or reading a non-constant static field. Notably it is <em>not</em> triggered by reading a <code>static final</code> compile-time constant — those are inlined into the caller's bytecode, so the class may never load at all. That inlining has a real consequence: change a public <code>static final int</code> in a library and every class that used it keeps the old value until it is recompiled.</p>`,
        `<p><strong><code>static</code> methods</strong> cannot use <code>this</code> or access instance members, cannot be overridden (only hidden — Chapter 2's earlier topic), and are dispatched from the declared type. <strong>Static nested classes</strong> matter more than they look: a non-static inner class holds an implicit reference to its enclosing instance, which is a classic leak — the outer object cannot be collected while the inner one lives. Make nested classes <code>static</code> unless they genuinely need the outer instance.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The order question, in the form it is usually asked:</p>`,
        `<pre><code class="language-java">class Parent {
    static { System.out.println("1 parent static block"); }
    { System.out.println("3 parent instance block"); }
    Parent() { System.out.println("4 parent constructor"); }
}

class Child extends Parent {
    static { System.out.println("2 child static block"); }
    { System.out.println("5 child instance block"); }
    Child() { System.out.println("6 child constructor"); }
}

new Child();
new Child();
// 1 parent static block      ← once
// 2 child static block       ← once
// 3 parent instance block
// 4 parent constructor
// 5 child instance block
// 6 child constructor
// 3 / 4 / 5 / 6 again        ← statics do NOT repeat</code></pre>`,
        `<p><code>final</code> not meaning immutable:</p>`,
        `<pre><code class="language-java">final List&lt;String&gt; names = new ArrayList&lt;&gt;();
names.add("Asha");          // ✔ the OBJECT is mutable
names.add("Ben");           // ✔
// names = new ArrayList&lt;&gt;(); // ✘ the BINDING is fixed

// Actual immutability is a property of the object, not the variable:
final List&lt;String&gt; frozen = List.of("Asha", "Ben");
// frozen.add("Chen");      // throws UnsupportedOperationException</code></pre>`,
        `<p>The three flavours of <code>final</code> field, which behave quite differently:</p>`,
        `<pre><code class="language-java">public class Config {
    // 1. Compile-time constant — INLINED into every caller's bytecode.
    public static final int MAX_RETRIES = 3;

    // 2. Static final, computed at class init — NOT inlined, so changing
    //    it takes effect for existing callers without recompiling them.
    public static final String HOST = System.getenv("APP_HOST");

    // 3. Instance final — one per object, assigned in the constructor.
    private final Instant createdAt;

    public Config() {
        this.createdAt = Instant.now();     // ✔ blank final, assigned once
    }
}</code></pre>`,
        `<p>And the static-field leak, which is the practical consequence people meet in production:</p>`,
        `<pre><code class="language-java">public class Cache {
    // A static field is a GC ROOT. Anything reachable from it lives as long
    // as the class does — which is usually as long as the application.
    private static final Map&lt;String, byte[]&gt; CACHE = new HashMap&lt;&gt;();

    public static void put(String k, byte[] v) { CACHE.put(k, v); }
    // No eviction, no bound, no removal → an OutOfMemoryError with a
    // perfectly healthy-looking code path. Chapter 1's "reachable is not
    // useful" in its most common real form.
}</code></pre>`,
        `<h2>Under the hood</h2>`,
        `<p><strong>Class initialisation is thread-safe, and the JVM guarantees it.</strong> The static initialiser runs exactly once, under a lock the JVM holds internally. That guarantee is what makes the holder idiom the cleanest lazy singleton in Java — no <code>synchronized</code>, no double-checked locking, no <code>volatile</code>:</p>`,
        `<pre><code class="language-java">public class Singleton {
    private Singleton() { }

    private static class Holder {                 // not initialised until…
        static final Singleton INSTANCE = new Singleton();
    }

    public static Singleton getInstance() {
        return Holder.INSTANCE;                   // …this line first runs
    }
}
// Holder is only initialised on first access to getInstance(), and the JVM
// serialises that initialisation. Lazy AND thread-safe, for free.</code></pre>`,
        `<p>The same lock is also a hazard: if a static initialiser blocks — waiting on another class that is itself waiting on this one — you get a <strong>class initialisation deadlock</strong>, which is genuinely hard to diagnose because the stack traces look idle. Keep static blocks trivial.</p>`,
        `<p><strong><code>final</code> fields have memory-model meaning</strong>, which is the senior-level answer here. The Java Memory Model guarantees that any thread which sees a properly constructed object also sees its correctly initialised <code>final</code> fields — <em>without</em> synchronisation. This is why immutable objects are safely publishable across threads, and it is one of the strongest arguments for making fields <code>final</code> by default. The guarantee is void if <code>this</code> escaped during construction. Chapter 8 develops this.</p>`,
        `<h2>Common mistakes</h2>`,
        `<ul>` +
        `<li><strong>"<code>final</code> means immutable."</strong> It fixes the binding only. Use immutable types for immutable objects.</li>` +
        `<li><strong>Using <code>static</code> as a global variable.</strong> Shared mutable state with no owner — untestable and a race waiting to happen.</li>` +
        `<li><strong>Unbounded static collections.</strong> Static fields are GC roots. This is the archetypal Java memory leak.</li>` +
        `<li><strong>Assuming a public <code>static final</code> constant can be changed without recompiling callers.</strong> Compile-time constants are inlined.</li>` +
        `<li><strong>Non-static inner classes by default.</strong> They pin the enclosing instance in memory. Make them <code>static</code> unless they need the outer object.</li>` +
        `<li><strong>Heavy work in a static block.</strong> Slows first use, can deadlock, and failures surface as a confusing <code>ExceptionInInitializerError</code> (and <code>NoClassDefFoundError</code> on every later attempt).</li>` +
        `<li><strong>Thinking <code>static</code> methods are overridable.</strong> They are hidden and dispatched from the declared type.</li>` +
        `</ul>`,
        `<h2>Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What does <code>static</code> mean?"</strong><br>A: The member belongs to the class rather than to any instance — one copy, shared, available without creating an object. Static methods cannot use <code>this</code> or touch instance state, and they are hidden rather than overridden in subclasses. Static fields live with the class metadata and act as GC roots.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Does <code>final</code> make an object immutable?"</strong><br>A: No. It makes the <em>reference</em> unchangeable. <code>final List&lt;String&gt; l = new ArrayList&lt;&gt;()</code> forbids reassigning <code>l</code> and permits <code>l.add(...)</code>. Immutability is a property of the object's design — no mutable state and no setters — which is what <code>List.of(...)</code> or a record gives you.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is the initialisation order?"</strong><br>A: All statics first and once: parent static fields and blocks, then child's, in source order. Then per instance: parent instance initialisers, parent constructor body, child instance initialisers, child constructor body. The parent's constructor running before the child's initialisers is exactly why calling an overridable method from a constructor sees null fields.</p></blockquote>`,
        `<blockquote><p><strong>Q: "When is a class initialised?"</strong><br>A: Lazily, on first active use — instantiation, a static method call, or reading a non-constant static field. Reading a <code>static final</code> compile-time constant does not trigger it, because the value was inlined into the caller at compile time.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Is static initialisation thread-safe?"</strong><br>A: Yes — the JVM guarantees a class's static initialiser runs exactly once, serialised under an internal lock. That is what makes the initialisation-on-demand holder idiom a correct lazy singleton with no explicit synchronisation. The same lock means a static initialiser that blocks on another class can deadlock.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why prefer <code>final</code> fields?"</strong><br>A: Two reasons. Design: the object cannot drift into an inconsistent state after construction. Concurrency: the memory model guarantees that any thread seeing a properly constructed object also sees its <code>final</code> fields fully initialised, with no synchronisation — which is what makes immutable objects safe to share. That guarantee is forfeited if <code>this</code> escapes during construction.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Can a static method be overridden?"</strong><br>A: No — redeclaring it in a subclass hides it. Statics are resolved from the declared type at compile time, so <code>Parent p = new Child(); p.staticMethod();</code> runs the parent's. Calling a static through an instance reference is legal but misleading; call it on the class.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>` +
        `<li><code>static</code> = per class, one copy, no <code>this</code>, hidden not overridden, <strong>GC root</strong>.</li>` +
        `<li><code>final</code> = assign once. Field → binding fixed. Method → no override. Class → no extend.</li>` +
        `<li><strong><code>final</code> ≠ immutable.</strong> The object stays mutable.</li>` +
        `<li>Order: parent statics → child statics (once) → parent instance init → parent ctor → child instance init → child ctor.</li>` +
        `<li>Within a phase, <strong>source order</strong> decides.</li>` +
        `<li>Class init is <strong>lazy and thread-safe</strong> → holder idiom = the clean lazy singleton.</li>` +
        `<li><code>static final</code> compile-time constants are <strong>inlined</strong> into callers.</li>` +
        `<li><code>final</code> fields carry a <strong>JMM safe-publication guarantee</strong> — void if <code>this</code> escapes.</li>` +
        `<li>Make nested classes <code>static</code> — non-static inner classes pin the outer instance.</li>` +
        `</ul>`,
      ].join('\n'),
    },
  ],
};
