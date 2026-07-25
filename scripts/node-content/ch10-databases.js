module.exports = {
  title: 'Databases',
  slug: 'databases',
  order: 9,
  topics: [
    {
      title: 'MongoDB &amp; Mongoose',
      slug: 'mongodb-mongoose',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Almost every Node.js service you will ever write needs to remember things between requests: users, orders, sessions, posts. That memory lives in a database, and for a huge slice of the Node ecosystem that database is <strong>MongoDB</strong>. MongoDB is a <em>document database</em> &#8212; instead of rows and columns it stores JSON-like documents, which map naturally onto the objects you already pass around in JavaScript. There is no impedance mismatch between a <code>user</code> object in your code and a <code>user</code> document in the database; they look almost identical.</p>`,
        `<p><strong>Mongoose</strong> is the library that sits between your Node code and MongoDB. It gives you schemas (so your "schema-less" database actually has enforced structure), type casting, validation, middleware hooks, and a fluent query API. Understanding how these two pieces relate &#8212; where MongoDB ends and Mongoose begins &#8212; is the single most important mental model in this whole chapter, and it is a question interviewers love because it separates people who copy tutorials from people who understand their stack.</p>`,
        `<p>If you cannot confidently model data, run CRUD, and explain why <code>findByIdAndUpdate</code> skips your validators, you will struggle in both real backends and interviews. This topic builds that foundation.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>MongoDB organises data into <strong>databases &#8594; collections &#8594; documents</strong>. A collection is loosely like a SQL table, and a document is loosely like a row &#8212; except a document is a flexible BSON object (Binary JSON) that can nest arrays and sub-objects to any depth. Two documents in the same collection do not have to have the same fields. That flexibility is the whole selling point, and also the whole footgun.</p>`,
        `<p>Mongoose adds a disciplined layer on top. You declare a <strong>Schema</strong> (the shape and rules), compile it into a <strong>Model</strong> (a constructor bound to one collection), and then create <strong>documents</strong> (instances of that model). The model is your gateway for every query; the document is a single record with methods like <code>.save()</code>.</p>`,
        `{{fig:ch10-mongoose-layers.svg|Stacked layers from application code through the Mongoose model and MongoDB driver down to the mongod server|Mongoose is a modeling layer on top of the official driver &#8212; it validates and casts, but the driver still speaks to the server.}}`,
        `<p>The key insight the diagram encodes: <strong>Mongoose is not the database</strong>. It is a convenience and safety layer. Underneath, the official <code>mongodb</code> driver serialises your data to BSON, manages the connection pool, and sends it over the wire. When Mongoose behaves surprisingly (a validator not running, a field silently dropped), the answer is almost always "because at that moment Mongoose handed off to the raw driver".</p>`,
        `<h2>How it works (deep)</h2>`,
        `<p>Let us trace a full round trip. When your process starts you call <code>mongoose.connect(uri)</code>. Mongoose opens a <strong>connection pool</strong> (by default up to 100 sockets) to <code>mongod</code> and buffers any queries you fire before the connection is ready &#8212; this is why <code>User.find()</code> at module load time does not immediately crash. Once connected, queries flush from the buffer.</p>`,
        `<p>A <strong>Schema</strong> is a plain description: field names, their types (<code>String</code>, <code>Number</code>, <code>Date</code>, <code>ObjectId</code>, <code>Buffer</code>, arrays, nested objects), and rules (<code>required</code>, <code>unique</code>, <code>default</code>, <code>min</code>, <code>enum</code>, custom <code>validate</code>). Compiling it with <code>mongoose.model('User', schema)</code> produces a <strong>Model</strong>. The string <code>'User'</code> is pluralised and lower-cased to derive the collection name <code>users</code> &#8212; a detail that trips people up when the collection "doesn't exist".</p>`,
        `<p>When you build a query like <code>User.find({ age: { $gt: 18 } })</code>, Mongoose does <strong>not</strong> execute immediately. It returns a <strong>Query</strong> object &#8212; a thenable builder. Execution happens when you <code>await</code> it, call <code>.then()</code>, or call <code>.exec()</code>. Before sending, Mongoose <em>casts</em> your filter values to the schema types (so the string <code>"18"</code> becomes the number <code>18</code>), which is a subtle safety net the raw driver does not give you.</p>`,
        `<p>On the way back, BSON documents are hydrated into full Mongoose documents with getters, virtuals, and instance methods &#8212; unless you called <code>.lean()</code>, which returns plain JS objects and skips hydration entirely. <code>.lean()</code> is dramatically faster and lighter for read-only endpoints because it avoids constructing the document wrapper for every result.</p>`,
        `<p>Two families of write operations exist, and the split is the source of the most common Mongoose bug. <strong>Document-based writes</strong> (<code>new User(...).save()</code>, <code>doc.save()</code>) run the full pipeline: casting, validators, <code>pre('save')</code> hooks. <strong>Query-based writes</strong> (<code>updateOne</code>, <code>updateMany</code>, <code>findOneAndUpdate</code>, <code>findByIdAndUpdate</code>) go closer to the driver: by default they <strong>skip validators and skip the <code>save</code> middleware</strong>. You must pass <code>{ runValidators: true }</code> to get validation, and even then <code>save</code> hooks never fire &#8212; only <code>update</code> hooks do. Interviewers probe this constantly.</p>`,
        `<h2>Code examples</h2>`,
        `<p>Defining a schema, compiling a model, and doing full CRUD:</p>`,
        `<pre><code class="language-javascript">const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  age:   { type: Number, min: 0, max: 130 },
  role:  { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema); // collection: "users"

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  // CREATE
  const ada = await User.create({ name: 'Ada', email: 'ada@x.com', age: 36 });

  // READ
  const adults = await User.find({ age: { $gte: 18 } })
    .select('name email')     // projection
    .sort({ name: 1 })
    .limit(20)
    .lean();                  // plain objects, faster

  // UPDATE (query-based: pass runValidators!)
  await User.updateOne(
    { _id: ada._id },
    { $set: { age: 37 } },
    { runValidators: true }
  );

  // DELETE
  await User.findByIdAndDelete(ada._id);
}
</code></pre>`,
        `<p>The document-based path, which is what you want when you need hooks and full validation:</p>`,
        `<pre><code class="language-javascript">const doc = new User({ name: 'Lin', email: 'LIN@X.COM' });
// schema lowercases email -> "lin@x.com" during validation
doc.age = 29;
await doc.save();        // runs validators + pre('save') hooks

// pre-save hook example: hash a password before writing
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return; // only when changed
  this.password = await hash(this.password);
});
</code></pre>`,
        `<p>The <code>Query</code> object is lazy &#8212; a frequent gotcha worth seeing directly:</p>`,
        `<pre><code class="language-javascript">const q = User.find({ role: 'admin' }); // NOT executed yet
q.where('age').gt(21);                  // still building
const admins = await q;                 // executes here (awaited)

// Same query, explicit execution:
User.find({ role: 'admin' }).exec()
  .then(docs =&gt; console.log(docs.length))
  .catch(err =&gt; console.error(err));
</code></pre>`,
        `<p>Reading a single record and handling "not found" cleanly:</p>`,
        `<pre><code class="language-javascript">const user = await User.findById(id);
if (!user) {
  // findById returns null (not an error) when nothing matches
  throw new Error('User not found');
}
</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Expecting <code>updateOne</code> / <code>findByIdAndUpdate</code> to validate.</strong> By default they do not run validators or <code>pre('save')</code> hooks. Pass <code>{ runValidators: true }</code>, and remember hooks still will not fire &#8212; use <code>save()</code> when you need them.</li>`,
        `<li><strong>Thinking <code>findByIdAndUpdate</code> returns the updated document.</strong> By default it returns the document <em>before</em> the change. Pass <code>{ new: true }</code> to get the updated version back.</li>`,
        `<li><strong>Treating a query as already-resolved data.</strong> <code>const u = User.findOne(...)</code> without <code>await</code> gives you a Query object, not a user. <code>u.name</code> is <code>undefined</code>, not an error.</li>`,
        `<li><strong>Relying on <code>unique: true</code> as validation.</strong> It is not a validator &#8212; it is an <em>index</em> instruction. Duplicates throw a driver error (code <code>11000</code>) at write time, not a nice validation error, and only if the index actually built.</li>`,
        `<li><strong>Forgetting <code>.lean()</code> on hot read paths.</strong> Hydrating thousands of full documents per request wastes CPU and memory when you only serialise them to JSON anyway.</li>`,
        `<li><strong>Calling <code>connect()</code> on every request.</strong> In serverless especially, this exhausts connections. Connect once and reuse; cache the connection across invocations.</li>`,
        `<li><strong>Assuming the collection name.</strong> <code>model('Person')</code> writes to <code>people</code>, not <code>Persons</code>. Override with the third argument if you need a specific name.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Connect <strong>once</strong> at startup (or with a cached promise in serverless) and let Mongoose manage the pool; never open a connection per query.</li>`,
        `<li>Prefer <code>.lean()</code> for read-only endpoints that just return JSON; keep full documents for paths that mutate and save.</li>`,
        `<li>Always pass <code>{ new: true, runValidators: true }</code> to <code>findByIdAndUpdate</code> when you want the updated doc validated &#8212; make it a team habit.</li>`,
        `<li>Define indexes in the schema (<code>schema.index(...)</code>) and understand they build in the background; in production, build them deliberately rather than relying on <code>autoIndex</code>.</li>`,
        `<li>Catch the duplicate-key error (<code>err.code === 11000</code>) explicitly and translate it into a friendly 409 response.</li>`,
        `<li>Keep business rules in schema validators and <code>pre</code>/<code>post</code> hooks so they cannot be bypassed by a forgetful controller.</li>`,
        `<li>Use <code>select: false</code> on sensitive fields (password hashes) so they are never returned unless explicitly requested.</li>`,
        `</ul>`,
        `<h2>&#11088; Interview lens</h2>`,
        `<blockquote><p><strong>Q: What is the difference between MongoDB and Mongoose?</strong><br/>MongoDB is the database and its official driver; Mongoose is an ODM (Object Data Modeling) library layered on the driver. Mongoose adds schemas, type casting, validation, middleware, virtuals, and a query builder. MongoDB itself is schema-flexible &#8212; Mongoose is what enforces structure from your Node app. The trap: candidates say Mongoose "is" the database. It is not; the driver still does the wire communication.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why does my validator not run on <code>findByIdAndUpdate</code>?</strong><br/>Because query-based updates bypass the document pipeline by default. Validators and <code>save</code> hooks only run on document methods like <code>save()</code>. You must pass <code>{ runValidators: true }</code>, and even then <code>pre('save')</code> hooks will not fire &#8212; only <code>pre('findOneAndUpdate')</code>-style update hooks do.</p></blockquote>`,
        `<blockquote><p><strong>Q: What does <code>.lean()</code> do and when would you use it?</strong><br/>It returns plain JavaScript objects instead of full Mongoose documents, skipping hydration (getters, virtuals, instance methods, change tracking). Use it on read-only endpoints for a large performance and memory win. Do not use it when you need to call <code>.save()</code> or rely on virtuals.</p></blockquote>`,
        `<blockquote><p><strong>Q: When is a Mongoose query actually executed?</strong><br/>Not at build time. <code>User.find(...)</code> returns a lazy Query (a thenable). Execution happens when you <code>await</code> it, call <code>.then()</code>, or call <code>.exec()</code>. This laziness lets you chain <code>.where()</code>, <code>.sort()</code>, <code>.limit()</code> before the round trip.</p></blockquote>`,
        `<blockquote><p><strong>Q: Is <code>unique: true</code> a validator?</strong><br/>No &#8212; it is a shortcut for creating a unique index. It does not produce a Mongoose validation error; a duplicate insert throws a MongoServerError with code 11000 at the driver level, and only enforces once the index has finished building. For a friendly error you catch code 11000 yourself.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you avoid connection exhaustion in a serverless function?</strong><br/>Cache the connection (or the connect promise) on the module/global scope so warm invocations reuse it instead of opening a new pool each time. Keep <code>maxPoolSize</code> small per instance, and never call <code>mongoose.connect()</code> inside the request handler.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Hierarchy:</strong> database &#8594; collection &#8594; document (BSON).</li>`,
        `<li><strong>Mongoose trio:</strong> Schema (shape) &#8594; Model (bound to collection) &#8594; Document (instance).</li>`,
        `<li><strong>Collection name:</strong> <code>model('User')</code> &#8594; <code>users</code> (pluralised, lower-cased).</li>`,
        `<li><strong>Queries are lazy</strong> until <code>await</code> / <code>.then()</code> / <code>.exec()</code>.</li>`,
        `<li><strong>save()</strong> = full pipeline (validators + hooks). <strong>updateOne / findByIdAndUpdate</strong> = skip both by default.</li>`,
        `<li><strong>Updated doc back:</strong> <code>{ new: true }</code>. <strong>Validate on update:</strong> <code>{ runValidators: true }</code>.</li>`,
        `<li><strong>Read-only speed:</strong> <code>.lean()</code>. <strong>Duplicate error:</strong> code <code>11000</code>.</li>`,
        `</ul>`
      ].join('\n')
    },
    {
      title: 'Schema Design &amp; Data Modeling',
      slug: 'schema-design',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>You can learn every query operator in an afternoon, but <strong>data modeling</strong> is the skill that decides whether your app is fast or falls over at scale. The shape of your documents determines how many round trips a page load costs, how big your working set is, whether writes contend, and whether a "simple" feature request later becomes a migration nightmare. In MongoDB there is a famous saying: <em>data that is accessed together should be stored together</em>. Getting that right is worth more than any index.</p>`,
        `<p>This is also where SQL habits actively hurt you. Relational modeling teaches you to normalise everything &#8212; split data into many tables and join. Document modeling often rewards the opposite: <strong>embed</strong> related data so one read returns a whole screen's worth. Knowing when to embed and when to reference, and being able to justify the tradeoff out loud, is a senior-level signal in interviews and the difference between a snappy API and a slow one in production.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>You have exactly two tools for relating data in MongoDB: <strong>embedding</strong> (nest the related data inside the parent document) and <strong>referencing</strong> (store an <code>ObjectId</code> that points to a document in another collection, then fetch it separately). Everything in schema design is choosing between these two, per relationship, based on how the data is read and written.</p>`,
        `{{fig:ch10-embed-vs-reference.svg|Side by side comparison of an order with items embedded versus an order referencing a separate user by id|Embed when data is owned, read together, and bounded; reference when it is shared, large, or updated on its own.}}`,
        `<p>The rule of thumb: <strong>embed for "contains" / one-to-few relationships that are read together</strong> (an order and its line items, a blog post and its tags), and <strong>reference for "relates to" / one-to-many or many-to-many relationships where the child is large, shared, or unbounded</strong> (a user and their thousands of orders, products shared across many carts).</p>`,
        `<h2>How it works (deep)</h2>`,
        `<p>Embedding is fast to read because a single document fetch (<code>findOne</code>) returns the parent and all its nested data in one round trip &#8212; no join, no second query. The cost is that the parent document grows, and MongoDB imposes a hard <strong>16&#160;MB limit per document</strong>. If a nested array can grow without bound (comments on a viral post, events in an append-only log), embedding will eventually blow the limit and every update rewrites the whole large document. This is the classic <em>unbounded array</em> anti-pattern.</p>`,
        `<p>Referencing keeps documents small and lets children grow independently, but reading now costs a second lookup. You resolve references either with Mongoose's <code>populate()</code> (which issues extra queries under the hood) or the aggregation <code>$lookup</code> stage (a server-side join). Both add latency and load. The tradeoff is fundamentally: <strong>embedding optimises reads at the cost of write amplification and size; referencing optimises writes and flexibility at the cost of read-time joins.</strong></p>`,
        `<p><strong>Indexes</strong> are the other half of design. An index is a sorted B-tree of a field's values that lets MongoDB jump straight to matching documents instead of scanning the whole collection.</p>`,
        `{{fig:ch10-index-scan.svg|A collection scan reading every document on the left versus a B-tree index lookup examining a handful on the right|Without an index a query is O(n) &#8212; it examines every document; with the right index it is O(log n).}}`,
        `<p>Every collection has a default unique index on <code>_id</code>. You add others for fields you filter or sort on. The critical concept for interviews is the <strong>ESR rule</strong> for compound indexes: order the fields <em>Equality, then Sort, then Range</em>. A compound index on <code>{ status: 1, createdAt: -1 }</code> serves a query that filters <code>status</code> by equality and sorts by <code>createdAt</code> without a separate in-memory sort. Indexes are not free: they consume RAM and disk, and they slow writes because every insert/update must also update every affected index. Over-indexing is as real a problem as under-indexing.</p>`,
        `<p>MongoDB modeling deliberately accepts controlled <strong>denormalization</strong> &#8212; storing the same value in two places (e.g. copying an author's display name onto each post) to avoid a join on read. The price is that when the source changes you must update the copies, so you only denormalize fields that rarely change and are read constantly.</p>`,
        `<h2>Code examples</h2>`,
        `<p>Embedding &#8212; line items live inside the order because they are owned by it and always read with it:</p>`,
        `<pre><code class="language-javascript">const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  total:  Number,
  status: { type: String, enum: ['pending', 'paid', 'shipped'], index: true },
  items: [{                       // embedded sub-documents
    sku:   String,
    name:  String,
    qty:   { type: Number, min: 1 },
    price: Number
  }],
  createdAt: { type: Date, default: Date.now }
});

// One read returns the order AND all its items:
const order = await Order.findById(id); // order.items is right there
</code></pre>`,
        `<p>Referencing &#8212; a user has many orders, an unbounded relationship, so we link by id and resolve on demand:</p>`,
        `<pre><code class="language-javascript">const userSchema = new mongoose.Schema({
  name:  String,
  email: { type: String, unique: true }
  // NOTE: we do NOT embed orders here - they are unbounded
});

// Resolve the reference with populate (extra query under the hood):
const enriched = await Order.findById(id)
  .populate('userId', 'name email') // fetch only these user fields
  .lean();

// Or a server-side join with aggregation:
const rows = await Order.aggregate([
  { $match: { status: 'paid' } },
  { $lookup: {
      from: 'users', localField: 'userId',
      foreignField: '_id', as: 'user'
  }},
  { $unwind: '$user' }
]);
</code></pre>`,
        `<p>Compound index following the ESR rule (Equality &#8594; Sort &#8594; Range):</p>`,
        `<pre><code class="language-javascript">// Query: find paid orders, newest first, above a price floor
// Order.find({ status: 'paid', total: { $gt: 50 } }).sort({ createdAt: -1 })
orderSchema.index({ status: 1, createdAt: -1, total: 1 });
//                  ^equality   ^sort          ^range

// Verify the index is actually used:
const plan = await Order.find({ status: 'paid' })
  .sort({ createdAt: -1 })
  .explain('executionStats');
// Look for stage IXSCAN (good) vs COLLSCAN (bad)
</code></pre>`,
        `<p>Controlled denormalization &#8212; copy a rarely-changing field to skip a join:</p>`,
        `<pre><code class="language-javascript">const postSchema = new mongoose.Schema({
  title: String,
  body:  String,
  author: {                    // denormalized snapshot
    _id:  mongoose.Schema.Types.ObjectId,
    name: String               // duplicated from the users collection
  }
});
// Feed page renders author name with zero joins.
// Trade-off: if a user renames, you must update their posts.
</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Unbounded embedded arrays.</strong> Embedding comments/events/logs that grow forever eventually hits the 16&#160;MB document cap and makes every update rewrite a huge document. Reference or bucket instead.</li>`,
        `<li><strong>Modeling like SQL.</strong> Blindly normalising every entity into its own collection produces join-heavy read paths that a document store handles poorly. Model around access patterns, not entities.</li>`,
        `<li><strong>Over-indexing.</strong> Every index costs RAM and slows writes. Ten indexes on a write-heavy collection can cripple throughput. Index what you actually query.</li>`,
        `<li><strong>Wrong compound-index order.</strong> An index on <code>{ createdAt: -1, status: 1 }</code> will not efficiently serve an equality filter on <code>status</code>. Follow ESR: Equality, Sort, Range.</li>`,
        `<li><strong>Forgetting the sort still uses memory.</strong> If a query sorts on an unindexed field, MongoDB does an in-memory sort and aborts if it exceeds the sort memory limit. Index sort fields.</li>`,
        `<li><strong>Denormalizing volatile data.</strong> Copying a value that changes often means constant fan-out updates and drift. Only denormalize stable, read-hot fields.</li>`,
        `<li><strong>N+1 with populate.</strong> Populating inside a loop over many parents fires a query per parent. Batch with a single <code>$in</code> query or <code>$lookup</code>.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Start from your <strong>access patterns</strong> ("what does the app read on this screen?") and design documents to answer them in as few reads as possible.</li>`,
        `<li>Embed one-to-few, owned, read-together data; reference one-to-many, shared, or unbounded data.</li>`,
        `<li>Apply the <strong>ESR rule</strong> to compound indexes and confirm with <code>explain('executionStats')</code> that you get an <code>IXSCAN</code>, not a <code>COLLSCAN</code>.</li>`,
        `<li>Cap growth: if an embedded array could ever be large, switch to referencing or the <em>bucket pattern</em> (fixed-size chunks per document).</li>`,
        `<li>Add a unique index for natural keys (email) and let it enforce integrity at the storage layer.</li>`,
        `<li>Denormalize deliberately and document which field is the source of truth so updates stay consistent.</li>`,
        `<li>Index foreign-key-style reference fields (<code>userId</code>) so joins and lookups are fast.</li>`,
        `</ul>`,
        `<h2>&#11088; Interview lens</h2>`,
        `<blockquote><p><strong>Q: Embedding vs referencing &#8212; how do you decide?</strong><br/>Decide per relationship from read/write patterns. Embed when the child is owned by the parent, read together with it, and bounded in size (order + line items). Reference when the child is shared across parents, updated independently, or can grow without bound (user + their orders). The one-liner interviewers want: "data accessed together is stored together, unless it grows without bound."</p></blockquote>`,
        `<blockquote><p><strong>Q: What is the document size limit and why does it matter for design?</strong><br/>16&#160;MB per BSON document. It matters because it caps how much you can embed &#8212; an unbounded embedded array (comments, logs) will eventually exceed it, and long before that, every update rewrites the entire large document. This is why unbounded arrays are an anti-pattern and you reference or bucket instead.</p></blockquote>`,
        `<blockquote><p><strong>Q: Explain the ESR rule for compound indexes.</strong><br/>Order index fields as Equality, then Sort, then Range. Equality fields narrow the scan to a contiguous range, the sort field then returns results already ordered (no in-memory sort), and range fields come last. Getting the order wrong forces a collection scan or an expensive in-memory sort even though an index "exists".</p></blockquote>`,
        `<blockquote><p><strong>Q: Is denormalization good or bad in MongoDB?</strong><br/>It is a deliberate tool, not a sin. Document databases embrace controlled denormalization to make reads cheap &#8212; you duplicate stable, frequently-read fields to avoid joins. The cost is update fan-out and potential drift, so you only do it for values that rarely change. The mistake is denormalizing volatile data.</p></blockquote>`,
        `<blockquote><p><strong>Q: What are the downsides of adding many indexes?</strong><br/>Each index consumes RAM (ideally the working set fits in memory) and disk, and every write must update every affected index, so write throughput drops. Over-indexing a write-heavy collection is a real performance bug. Index for the queries you actually run and drop unused ones.</p></blockquote>`,
        `<blockquote><p><strong>Q: How would you model a one-to-many like a user and their orders?</strong><br/>Reference: store <code>userId</code> on each order rather than embedding orders in the user, because orders are unbounded and updated on their own. Index <code>userId</code> so "orders for this user" is fast, and resolve the user with a single batched lookup when you need it &#8212; not populate-in-a-loop.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Two tools:</strong> embed (nest) vs reference (ObjectId + populate/$lookup).</li>`,
        `<li><strong>Embed:</strong> owned, read-together, bounded, one-to-few.</li>`,
        `<li><strong>Reference:</strong> shared, unbounded, updated-alone, one-to-many / many-to-many.</li>`,
        `<li><strong>Hard limit:</strong> 16&#160;MB per document &#8594; never embed unbounded arrays.</li>`,
        `<li><strong>Compound index order:</strong> ESR &#8212; Equality, Sort, Range.</li>`,
        `<li><strong>Verify:</strong> <code>explain()</code> &#8594; want <code>IXSCAN</code>, not <code>COLLSCAN</code>.</li>`,
        `<li><strong>Denormalize</strong> stable, read-hot fields only; index reference keys.</li>`,
        `</ul>`
      ].join('\n')
    },
    {
      title: 'SQL Basics from Node',
      slug: 'sql-basics',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Not every backend should use MongoDB. A huge share of the industry &#8212; banking, e-commerce, anything with money, reporting, or strict relationships &#8212; runs on <strong>relational (SQL) databases</strong> like PostgreSQL and MySQL. As a Node developer you will absolutely be asked to talk to one, usually through the <code>pg</code> (node-postgres) or <code>mysql2</code> driver. And in interviews, "SQL vs NoSQL &#8212; which would you pick and why?" is one of the most common system-design openers there is. A weak answer ("Mongo is faster") tanks the conversation; a strong one shows you understand tradeoffs.</p>`,
        `<p>SQL also forces you to confront things a document store lets you gloss over: schemas as contracts, JOINs across tables, foreign keys, and real ACID transactions. Even if your day job is Mongo, understanding the relational model makes you a sharper data modeler everywhere. This topic gives you the working knowledge to query Postgres from Node safely and to reason about which database fits a problem.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A relational database stores data in <strong>tables</strong> made of <strong>rows</strong> and fixed <strong>columns</strong>, each column with a declared type. Tables relate to each other through <strong>keys</strong>: a <em>primary key</em> uniquely identifies a row, and a <em>foreign key</em> in one table points at the primary key of another. You retrieve and combine data with <strong>SQL</strong> (Structured Query Language) &#8212; a declarative language where you describe <em>what</em> you want and the database's query planner figures out <em>how</em>.</p>`,
        `{{fig:ch10-sql-vs-nosql.svg|Relational tables with users and orders joined by a foreign key on the left versus a nested MongoDB document on the right|SQL splits data into typed tables joined by keys; document stores nest related data into one flexible aggregate.}}`,
        `<p>The essential contrast with NoSQL: SQL enforces a <strong>fixed schema</strong> and pushes relationships into <strong>JOINs</strong> resolved at query time, giving you strong consistency and integrity. Document stores keep related data together and stay flexible, trading some integrity for scale and developer speed.</p>`,
        `<h2>How it works (deep)</h2>`,
        `<p>SQL has a handful of core statement types. <code>SELECT</code> reads (with <code>WHERE</code> to filter, <code>ORDER BY</code> to sort, <code>LIMIT</code>/<code>OFFSET</code> to page, <code>GROUP BY</code> plus aggregates like <code>COUNT</code>/<code>SUM</code> to summarise). <code>INSERT</code>, <code>UPDATE</code>, and <code>DELETE</code> write. <code>CREATE TABLE</code> and <code>ALTER TABLE</code> define structure. The declarative nature matters: you never write loops; you state a set-based condition and the planner picks indexes and join strategies.</p>`,
        `<p>A <strong>JOIN</strong> combines rows from two tables on a matching condition. <code>INNER JOIN</code> keeps only rows with a match on both sides. <code>LEFT JOIN</code> keeps every row from the left table and fills <code>NULL</code> where the right side has no match (essential for "users and their orders, including users with zero orders"). <code>RIGHT</code> and <code>FULL OUTER</code> joins mirror that. Understanding INNER vs LEFT is a near-guaranteed interview question because the wrong one silently drops rows.</p>`,
        `<p>From Node, you connect with a driver. <code>pg</code> gives you a <code>Pool</code> (recommended) whose <code>pool.query()</code> borrows a connection, runs your SQL, and returns it automatically. The single most important safety rule is <strong>parameterised queries</strong>: never build SQL by string concatenation. You pass placeholders (<code>$1</code>, <code>$2</code> in Postgres; <code>?</code> in mysql2) and an array of values; the driver sends the query text and the data <em>separately</em>, so a value like <code>' OR 1=1 --</code> is treated as data, not code. This is how you prevent <strong>SQL injection</strong>, the most classic and dangerous web vulnerability.</p>`,
        `<p><strong>When to use which?</strong> Reach for SQL when you have well-structured data with clear relationships, need strong consistency and multi-row ACID transactions (money, inventory, bookings), do a lot of ad-hoc reporting/aggregation, or must guarantee referential integrity. Reach for a document store when your data is self-contained aggregates, the schema evolves fast, you need to scale writes horizontally across shards, or the shape is naturally hierarchical (a product with wildly varying attributes). Modern reality: many systems use <strong>both</strong> (polyglot persistence), and Postgres even has a strong <code>jsonb</code> type that blurs the line.</p>`,
        `<h2>Code examples</h2>`,
        `<p>Setting up a pool and running a safe, parameterised query with node-postgres:</p>`,
        `<pre><code class="language-javascript">const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST,
  database: 'shop',
  max: 10,                 // pool size
  idleTimeoutMillis: 30000
});

// PARAMETERISED - safe from SQL injection.
async function findUser(email) {
  const { rows } = await pool.query(
    'SELECT id, name, email FROM users WHERE email = $1',
    [email]                // values passed separately from SQL text
  );
  return rows[0] ?? null;  // rows is an array
}
</code></pre>`,
        `<p>The SQL itself &#8212; schema, insert, and a JOIN across two tables:</p>`,
        `<pre><code class="language-sql">CREATE TABLE users (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL
);

CREATE TABLE orders (
  id      SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),  -- foreign key
  total   NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Every user with their order count (LEFT JOIN keeps users with 0 orders)
SELECT u.id, u.name, COUNT(o.id) AS order_count, COALESCE(SUM(o.total), 0) AS spent
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.name
ORDER BY spent DESC
LIMIT 20;
</code></pre>`,
        `<p>INSERT returning the new row, plus UPDATE and DELETE from Node:</p>`,
        `<pre><code class="language-javascript">// INSERT ... RETURNING gives you the generated id back in one round trip
const { rows } = await pool.query(
  'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, created_at',
  ['Ada', 'ada@x.com']
);
const newId = rows[0].id;

await pool.query(
  'UPDATE orders SET total = total * 1.1 WHERE user_id = $1',
  [newId]
);

const res = await pool.query('DELETE FROM users WHERE id = $1', [newId]);
console.log(res.rowCount);   // how many rows were affected
</code></pre>`,
        `<p>The wrong way &#8212; string concatenation &#8212; and why it is dangerous:</p>`,
        `<pre><code class="language-javascript">// NEVER DO THIS - open to SQL injection:
const email = req.query.email; // e.g. "x' OR '1'='1"
const bad = await pool.query(
  \`SELECT * FROM users WHERE email = '\${email}'\` // injectable!
);
// The attacker's input becomes part of the SQL and can dump the table.
// Always use $1 placeholders instead (see findUser above).
</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>String-concatenating user input into SQL.</strong> This is the #1 web vulnerability (SQL injection). Always use <code>$1</code>/<code>?</code> parameterised placeholders.</li>`,
        `<li><strong>Using <code>INNER JOIN</code> when you meant <code>LEFT JOIN</code>.</strong> Inner join silently drops parent rows that have no children (users with zero orders vanish from the report).</li>`,
        `<li><strong>Forgetting <code>WHERE</code> on <code>UPDATE</code>/<code>DELETE</code>.</strong> <code>DELETE FROM users;</code> wipes the whole table. There is no undo without a backup.</li>`,
        `<li><strong>Assuming <code>rows</code> is a single object.</strong> <code>pg</code> returns <code>{ rows: [...] }</code> &#8212; an array. Read <code>rows[0]</code> for a single record.</li>`,
        `<li><strong>Mishandling <code>NULL</code>.</strong> <code>column = NULL</code> is never true; use <code>IS NULL</code>/<code>IS NOT NULL</code>. Aggregates like <code>SUM</code> ignore NULLs, so wrap with <code>COALESCE</code>.</li>`,
        `<li><strong>Selecting <code>*</code> everywhere.</strong> It fetches columns you do not need, breaks when the schema changes, and prevents covering indexes. Name your columns.</li>`,
        `<li><strong>N+1 queries.</strong> Looping over users and querying orders per user is slow; do one JOIN or an <code>IN (...)</code> query.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Always use parameterised queries; treat any concatenated SQL as a security bug in review.</li>`,
        `<li>Use a <code>Pool</code>, not one-off <code>Client</code> connections per request, and let it manage reuse (covered in the next topic).</li>`,
        `<li>Prefer explicit column lists over <code>SELECT *</code>; it is faster, clearer, and index-friendly.</li>`,
        `<li>Add indexes on foreign keys and columns you filter/sort on; check plans with <code>EXPLAIN ANALYZE</code>.</li>`,
        `<li>Use <code>INSERT ... RETURNING</code> to get generated ids in one round trip instead of a follow-up SELECT.</li>`,
        `<li>Push filtering, sorting, and aggregation into SQL rather than pulling rows into Node and processing them &#8212; the database is far better at it.</li>`,
        `<li>Pick the database from the problem: relational integrity and transactions &#8594; SQL; flexible self-contained aggregates and horizontal scale &#8594; document store; often both.</li>`,
        `</ul>`,
        `<h2>&#11088; Interview lens</h2>`,
        `<blockquote><p><strong>Q: SQL vs NoSQL &#8212; when would you choose each?</strong><br/>SQL for structured, related data needing strong consistency, multi-row ACID transactions, and rich ad-hoc queries/joins (finance, inventory, bookings). Document/NoSQL for self-contained aggregates, rapidly evolving schemas, hierarchical data, and horizontal write scale. The mature answer notes it is not either/or &#8212; polyglot persistence is common, and Postgres <code>jsonb</code> gives document-style flexibility inside a relational engine.</p></blockquote>`,
        `<blockquote><p><strong>Q: What is SQL injection and how do you prevent it?</strong><br/>An attack where user input is concatenated into SQL and executed as code, letting an attacker read or destroy data. Prevention is parameterised queries: send the SQL text and the values separately (<code>$1</code> in pg, <code>?</code> in mysql2) so values are always treated as data. ORMs/query builders do this for you; never build SQL with template strings around user input.</p></blockquote>`,
        `<blockquote><p><strong>Q: INNER JOIN vs LEFT JOIN?</strong><br/>INNER JOIN returns only rows with a match in both tables. LEFT JOIN returns every row from the left table and NULLs where the right has no match. The classic trap: "list all users and their order totals" &#8212; INNER JOIN silently omits users with zero orders, so you need LEFT JOIN (plus <code>COALESCE</code> to turn NULL sums into 0).</p></blockquote>`,
        `<blockquote><p><strong>Q: What is a foreign key and what does it give you?</strong><br/>A column that references another table's primary key, declaring a relationship the database enforces &#8212; you cannot insert an order for a non-existent user, and (with cascade rules) deletes can propagate. It provides <em>referential integrity</em>, a guarantee document stores generally leave to application code.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why prefer a Pool over creating a Client per request?</strong><br/>Opening a TCP connection and authenticating to Postgres is expensive (tens of milliseconds). A pool keeps a set of connections open and hands them out, so requests reuse warm connections instead of paying setup cost each time, and it caps total connections so you do not overwhelm the database. Per-request clients exhaust connection limits under load.</p></blockquote>`,
        `<blockquote><p><strong>Q: How does NULL behave in SQL comparisons and aggregates?</strong><br/>NULL means "unknown", so any comparison with it (<code>= NULL</code>, <code>&lt;&gt; NULL</code>) yields NULL (not true) &#8212; you must use <code>IS NULL</code>/<code>IS NOT NULL</code>. Aggregates like <code>COUNT(col)</code>, <code>SUM</code>, and <code>AVG</code> skip NULLs, which is why a sum over no rows returns NULL and you wrap it in <code>COALESCE(..., 0)</code>.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Model:</strong> tables &#8594; rows &#8594; typed columns; primary key + foreign key relate tables.</li>`,
        `<li><strong>Drivers:</strong> <code>pg</code> (Postgres, <code>$1</code> params), <code>mysql2</code> (<code>?</code> params).</li>`,
        `<li><strong>Safety:</strong> parameterised queries always &#8212; never concatenate user input.</li>`,
        `<li><strong>Joins:</strong> INNER = matches only; LEFT = keep all left rows, NULL the rest.</li>`,
        `<li><strong>pg result:</strong> <code>{ rows: [...], rowCount }</code>; use <code>RETURNING</code> for new ids.</li>`,
        `<li><strong>NULL:</strong> use <code>IS NULL</code>; wrap aggregates in <code>COALESCE</code>.</li>`,
        `<li><strong>Choose SQL</strong> for integrity + transactions; <strong>document</strong> for flexible aggregates + scale.</li>`,
        `</ul>`
      ].join('\n')
    },
    {
      title: 'Connection Pooling',
      slug: 'connection-pooling',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Opening a database connection is expensive. It means a TCP handshake, often a TLS negotiation, and an authentication exchange &#8212; frequently 20&#8211;100&#160;ms of round trips before you can run a single query. If your Node server opened a fresh connection for every incoming HTTP request, two disasters would follow: latency would balloon (every request pays the setup tax), and under load you would open thousands of connections and hit the database's hard connection limit, at which point new requests are refused and the whole system falls over. <strong>Connection pooling</strong> is the answer, and it is one of the highest-leverage performance topics in backend engineering.</p>`,
        `<p>It is also a favourite interview area because it reveals whether you understand what actually happens between your process and the database. "Why do you need a pool?", "what happens when the pool is exhausted?", and "how do connection leaks occur?" are questions that quickly separate people who have run production systems from those who have not. And leaks &#8212; borrowing a connection and never returning it &#8212; are among the most common real-world outages, so this knowledge is directly practical.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A <strong>connection pool</strong> is a fixed-size set of already-open, authenticated database connections that your app keeps alive and reuses. When a request needs to run a query, it <em>borrows</em> (acquires) a connection from the pool, uses it, and <em>returns</em> (releases) it &#8212; the connection stays open for the next borrower. Nobody pays the setup cost per query; they pay it once, at startup, for the whole pool.</p>`,
        `{{fig:ch10-connection-pool.svg|Requests borrowing from a small fixed pool of reusable connections to the database, with overflow requests queuing|A pool lends a fixed set of open connections; borrowers return them for reuse, and extra requests queue until one frees.}}`,
        `<p>If every connection is currently in use, additional requests <strong>queue</strong> and wait until one is returned (or time out). This is the crucial behaviour: the pool intentionally caps concurrency at the database, protecting it from overload, and turning "too many requests" into "some requests wait a little" instead of "the database dies".</p>`,
        `<h2>How it works (deep)</h2>`,
        `<p>A pool is configured with a maximum size (<code>max</code> in <code>pg</code>, <code>maxPoolSize</code> in the MongoDB driver / Mongoose). At startup or on first use, it opens connections up to that cap. Each connection has a <strong>lifecycle</strong>: created &#8594; idle (in the pool, ready) &#8594; acquired (borrowed by a request) &#8594; released back to idle &#8594; eventually closed if it sits idle past <code>idleTimeoutMillis</code> or errors out. Good pools also validate connections and transparently replace dead ones (e.g. after a database restart or network blip).</p>`,
        `<p>When a request calls <code>pool.query()</code>, the pool hands over an idle connection, or if none is free and the pool is below <code>max</code>, opens a new one, or if at <code>max</code>, puts the request in a <strong>wait queue</strong>. A <code>connectionTimeoutMillis</code> bounds how long a request waits before failing rather than hanging forever. This queue-with-timeout is what keeps a traffic spike from becoming an unbounded pile-up.</p>`,
        `<p>Sizing the pool is a real skill. Bigger is <em>not</em> better. Each connection consumes memory and a backend process/thread on the database server, and Postgres in particular handles a modest number of active connections best &#8212; a common guideline is a pool in the low tens per app instance, not hundreds. The total connections across all your app instances must stay under the database's <code>max_connections</code>. If you run 10 instances each with a pool of 20, that is 200 connections; the database must be sized for that. This multiplication is why people reach for external poolers like <strong>PgBouncer</strong> in front of Postgres.</p>`,
        `<p>The most dangerous failure mode is a <strong>connection leak</strong>. This happens when you manually check out a client (for a transaction, say) and forget to release it &#8212; typically because an error was thrown between <code>connect()</code> and <code>release()</code> and there was no <code>finally</code> block. That connection is now borrowed forever. Do it a few times and the pool is fully "in use" with nothing actually running; every new request queues and eventually times out. The symptom &#8212; the app hangs on all database calls while the database itself looks idle &#8212; is a classic production incident. The cure is always releasing in a <code>finally</code>, or using the auto-managed <code>pool.query()</code> which never leaks. Note that <code>pool.query()</code> acquires and releases for you; you only manage a client manually when you need several statements on the <em>same</em> connection, such as a transaction.</p>`,
        `<h2>Code examples</h2>`,
        `<p>A properly configured Postgres pool, and the safe auto-managed query path:</p>`,
        `<pre><code class="language-javascript">const { Pool } = require('pg');

const pool = new Pool({
  max: 20,                       // cap connections per instance
  idleTimeoutMillis: 30000,      // close a connection idle 30s
  connectionTimeoutMillis: 5000  // fail a waiting request after 5s
});

// pool.query() acquires AND releases automatically - cannot leak.
async function getOrders(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM orders WHERE user_id = $1', [userId]
  );
  return rows;
}
</code></pre>`,
        `<p>Manual checkout for a multi-statement transaction &#8212; the <code>finally</code> is non-negotiable:</p>`,
        `<pre><code class="language-javascript">async function transfer(fromId, toId, amount) {
  const client = await pool.connect();   // borrow ONE connection
  try {
    await client.query('BEGIN');
    await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, fromId]);
    await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, toId]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();   // ALWAYS return it - this prevents the leak
  }
}
</code></pre>`,
        `<p>The leak, shown explicitly so you recognise it in code review:</p>`,
        `<pre><code class="language-javascript">// BUG: if the query throws, release() never runs -> connection leaked
async function leaky(id) {
  const client = await pool.connect();
  const res = await client.query('SELECT * FROM users WHERE id = $1', [id]);
  client.release();   // unreachable when the query above throws!
  return res.rows[0];
}
// Fix: wrap in try/finally, or just use pool.query() which self-manages.
</code></pre>`,
        `<p>Mongoose/MongoDB pooling &#8212; the pool is built in; you tune its size:</p>`,
        `<pre><code class="language-javascript">await mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 20,   // default is 100; size per instance deliberately
  minPoolSize: 2,    // keep a couple warm
  maxIdleTimeMS: 30000
});
// The driver manages borrow/return for every query internally -
// there is no manual release for ordinary queries, so no leak risk.
// Connect ONCE at startup and reuse this connection everywhere.
</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Opening a connection per request.</strong> Pays the handshake tax every time and exhausts the database's connection limit under load. Use a pool created once at startup.</li>`,
        `<li><strong>Leaking manual clients.</strong> Forgetting <code>client.release()</code> &#8212; especially when an error skips past it &#8212; permanently borrows a connection. Always release in a <code>finally</code>.</li>`,
        `<li><strong>Oversizing the pool.</strong> A pool of 500 does not make things faster; it overwhelms the database and can lower throughput. Size in the low tens per instance and multiply by instance count against <code>max_connections</code>.</li>`,
        `<li><strong>Ignoring instance multiplication.</strong> 10 app instances &#215; a pool of 50 = 500 connections. Teams forget to account for horizontal scaling and blow past the DB limit.</li>`,
        `<li><strong>Creating a new pool per request/module reload.</strong> Especially in serverless, this spawns pools that never drain. Cache the pool/connection across invocations.</li>`,
        `<li><strong>No acquire timeout.</strong> Without <code>connectionTimeoutMillis</code>, a request waits forever on an exhausted pool, turning a leak into an indefinite hang instead of a clear error.</li>`,
        `<li><strong>Holding a connection during slow non-DB work.</strong> Borrowing a client, then doing a slow HTTP call before releasing, starves the pool. Do external work outside the checkout.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Create <strong>one</strong> pool (or one Mongoose connection) at process startup and share it everywhere; never per request.</li>`,
        `<li>Prefer the auto-managing call (<code>pool.query()</code>) and only check out a client manually for transactions &#8212; then release in <code>finally</code>.</li>`,
        `<li>Set an explicit <code>max</code>/<code>maxPoolSize</code>, <code>idleTimeoutMillis</code>, and an acquire timeout so exhaustion fails fast instead of hanging.</li>`,
        `<li>Size the pool from the database's limit and your instance count, not by guessing bigger; consider PgBouncer for Postgres at scale.</li>`,
        `<li>In serverless, cache the connection/pool on global scope so warm invocations reuse it, and keep per-instance pools small.</li>`,
        `<li>Monitor pool metrics (in-use vs idle, wait-queue length, acquire timeouts) &#8212; a climbing wait queue is the early warning of a leak or undersized pool.</li>`,
        `<li>Do slow, non-database work outside the borrowed-connection window to maximise connection reuse.</li>`,
        `</ul>`,
        `<h2>&#11088; Interview lens</h2>`,
        `<blockquote><p><strong>Q: Why do we need connection pooling at all?</strong><br/>Because opening a DB connection is expensive (TCP + TLS + auth, tens of ms) and the database caps how many connections it accepts. A pool opens a fixed set once and reuses them, so queries avoid per-request setup cost and total connections stay bounded. Without it you both add latency to every request and risk exhausting the database's connection limit under load.</p></blockquote>`,
        `<blockquote><p><strong>Q: What happens when the pool is exhausted?</strong><br/>New requests do not open unlimited connections &#8212; they queue and wait for one to be released. With an acquire timeout configured, a request that waits too long fails with a clear error instead of hanging forever. This is a feature: the pool caps concurrency at the database and converts overload into brief waits rather than a database crash.</p></blockquote>`,
        `<blockquote><p><strong>Q: What is a connection leak and how does it happen?</strong><br/>Borrowing a connection and never returning it. It typically happens when you manually check out a client for a transaction and an error is thrown before <code>release()</code>, with no <code>finally</code> block. Each leak permanently removes a connection from the pool; enough leaks and every query hangs while the database itself looks idle. The fix is releasing in <code>finally</code>, or using self-managing <code>pool.query()</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: Is a bigger pool always better?</strong><br/>No. Each connection costs memory and a backend process on the DB, and databases (Postgres especially) perform best with a moderate number of active connections. An oversized pool can reduce throughput and exhaust the server's <code>max_connections</code>, particularly once you multiply by many app instances. Size in the low tens per instance and use an external pooler like PgBouncer when you need many clients.</p></blockquote>`,
        `<blockquote><p><strong>Q: Walk through a connection's lifecycle in the pool.</strong><br/>Created (handshake + auth) &#8594; idle in the pool &#8594; acquired by a request &#8594; released back to idle after the query/transaction &#8594; closed if idle past the idle timeout or on error, then replaced. A healthy pool validates and transparently replaces dead connections after a DB restart or network blip.</p></blockquote>`,
        `<blockquote><p><strong>Q: How should pooling change in a serverless environment?</strong><br/>Each function instance is short-lived and there can be many concurrent instances, so a naive pool-per-invocation explodes connection count. Cache the connection/pool on global scope so warm invocations reuse it, keep per-instance pool size very small, and front the database with a pooler (PgBouncer, or a serverless driver) to multiplex many instances onto few real connections.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Why:</strong> connections are expensive (TCP+TLS+auth) and capped &#8594; reuse them.</li>`,
        `<li><strong>Borrow &#8594; use &#8594; release;</strong> extra requests queue, then time out.</li>`,
        `<li><strong>Config:</strong> <code>max</code>/<code>maxPoolSize</code>, <code>idleTimeoutMillis</code>, acquire timeout.</li>`,
        `<li><strong>Leak = forgot release;</strong> always <code>client.release()</code> in <code>finally</code>.</li>`,
        `<li><strong>pool.query()</strong> self-manages (no leak); manual checkout only for transactions.</li>`,
        `<li><strong>Size:</strong> low tens per instance; watch instances &#215; pool vs DB <code>max_connections</code>.</li>`,
        `<li><strong>Serverless:</strong> cache the pool globally, keep it tiny, consider PgBouncer.</li>`,
        `</ul>`
      ].join('\n')
    },
    {
      title: 'Transactions &amp; ACID',
      slug: 'transactions',
      order: 4,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Some operations must happen all-or-nothing. Transfer money between two accounts: debit one, credit the other. If the process crashes after the debit but before the credit, money has vanished into thin air and your users (and regulators) will not forgive you. Place an order: decrement inventory, create the order, charge the card &#8212; if any step fails, none should stick. The mechanism that makes "all-or-nothing" real is a <strong>transaction</strong>, and the guarantees it provides are summarised by the acronym <strong>ACID</strong>. This is bedrock backend knowledge and one of the most reliably asked interview topics, because getting it wrong causes the most damaging class of bugs: silent data corruption.</p>`,
        `<p>What makes this topic sharp for interviews is the modern twist: transactions are not just a SQL thing anymore. MongoDB has supported <strong>multi-document ACID transactions</strong> since 4.0 (via sessions), so "does NoSQL have transactions?" is a live question with a nuanced answer. Knowing when you actually need a transaction &#8212; and, just as importantly, when a good document model means you do not &#8212; is what distinguishes solid engineers.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A <strong>transaction</strong> groups several database operations into a single unit that either <em>fully commits</em> or <em>fully rolls back</em>. You mark a beginning, do your writes, and then either <code>COMMIT</code> (make them all permanent together) or, if anything goes wrong, <code>ROLLBACK</code> (undo everything as if none of it happened). The database guarantees no in-between state is ever visible or persisted.</p>`,
        `{{fig:ch10-acid.svg|Four panels defining Atomicity, Consistency, Isolation, and Durability|ACID is the four-part promise a transaction upholds: all-or-nothing, valid state, isolated from other transactions, and durable once committed.}}`,
        `<p><strong>ACID</strong> names the four guarantees. <em>Atomicity</em>: all steps or none. <em>Consistency</em>: the database moves from one valid state to another, never breaking its rules. <em>Isolation</em>: concurrent transactions do not see each other's half-finished work. <em>Durability</em>: once committed, the data survives a crash or power loss.</p>`,
        `<h2>How it works (deep)</h2>`,
        `<p>Under the hood, a relational database implements atomicity and durability with a <strong>write-ahead log (WAL)</strong>: changes are recorded to a durable log before being applied, so on crash recovery the database can replay committed transactions and discard uncommitted ones. A <code>COMMIT</code> is not acknowledged until the log is safely on disk &#8212; that is durability. A <code>ROLLBACK</code> (or a crash) discards the pending changes &#8212; that is atomicity.</p>`,
        `{{fig:ch10-transaction-flow.svg|A vertical flow from BEGIN through two writes to COMMIT, with a branch to ROLLBACK when an error occurs before commit|Either both writes commit together, or an error before commit triggers a rollback that undoes everything.}}`,
        `<p><strong>Isolation</strong> is the subtle one, because letting transactions run concurrently invites anomalies: a <em>dirty read</em> (seeing another transaction's uncommitted change), a <em>non-repeatable read</em> (a row changes value between two reads in the same transaction), and a <em>phantom read</em> (new rows appear matching your <code>WHERE</code> between reads). SQL defines <strong>isolation levels</strong> &#8212; Read Uncommitted, Read Committed, Repeatable Read, Serializable &#8212; that trade performance for stronger guarantees, each ruling out more anomalies. Most databases default to Read Committed (Postgres) or Repeatable Read (MySQL InnoDB); Serializable is the strictest, behaving as if transactions ran one at a time. Naming an anomaly and the level that prevents it is a strong interview answer.</p>`,
        `<p>In <strong>MongoDB</strong>, a single-document write is <em>already atomic</em> &#8212; an update to one document, including its nested arrays and sub-documents, either fully applies or not at all. This is a big deal: if you model well and keep data that changes together in one document, <strong>you often do not need a multi-document transaction at all</strong>. When you genuinely must update several documents atomically (money moving between two separate account documents), Mongo provides multi-document transactions through a <strong>session</strong>: you <code>startSession()</code>, <code>startTransaction()</code>, do your writes passing the session, then <code>commitTransaction()</code> or <code>abortTransaction()</code>. These require a replica set or sharded cluster (not a standalone <code>mongod</code>), and they carry more overhead than single-document writes, so you reach for them deliberately.</p>`,
        `<p><strong>When do you actually need a transaction?</strong> When a single logical operation spans multiple rows/documents and a partial result would be invalid or unsafe: financial transfers, inventory-plus-order, anything with an invariant across records ("total debits equal total credits"). When it is a single-document or single-row change, the database already gives you atomicity for free. Over-using transactions adds locking and contention; under-using them corrupts data. Knowing the line is the skill.</p>`,
        `<h2>Code examples</h2>`,
        `<p>A SQL transaction in node-postgres &#8212; the canonical money transfer:</p>`,
        `<pre><code class="language-javascript">async function transfer(fromId, toId, amount) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'SELECT balance FROM accounts WHERE id = $1 FOR UPDATE', [fromId]
    );                                   // FOR UPDATE locks the row
    if (rows[0].balance &lt; amount) throw new Error('Insufficient funds');

    await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, fromId]);
    await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, toId]);

    await client.query('COMMIT');        // both updates land together
  } catch (err) {
    await client.query('ROLLBACK');      // any failure undoes everything
    throw err;
  } finally {
    client.release();
  }
}
</code></pre>`,
        `<p>The same all-or-nothing guarantee in MongoDB via a session:</p>`,
        `<pre><code class="language-javascript">async function transfer(fromId, toId, amount) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const from = await Account.findById(fromId).session(session);
    if (from.balance &lt; amount) throw new Error('Insufficient funds');

    await Account.updateOne({ _id: fromId }, { $inc: { balance: -amount } }, { session });
    await Account.updateOne({ _id: toId },   { $inc: { balance:  amount } }, { session });

    await session.commitTransaction();   // atomic across both documents
  } catch (err) {
    await session.abortTransaction();    // rollback
    throw err;
  } finally {
    session.endSession();                // always end the session
  }
}
// Requires a replica set / cluster - transactions do not work on standalone mongod.
</code></pre>`,
        `<p>Often you do <em>not</em> need a transaction &#8212; single-document atomicity is enough:</p>`,
        `<pre><code class="language-javascript">// Atomic decrement guarded by a condition, in ONE document operation.
// No transaction needed: the whole update applies or it does not.
const res = await Inventory.updateOne(
  { _id: productId, stock: { $gte: qty } }, // only if enough stock
  { $inc: { stock: -qty } }
);
if (res.modifiedCount === 0) throw new Error('Out of stock');
// This also avoids a race: the condition and the decrement are one atomic step.
</code></pre>`,
        `<p>Postgres offers the same conditional-atomic trick without an explicit transaction for a single statement:</p>`,
        `<pre><code class="language-sql">-- Single-statement atomicity: the WHERE guard and the update are one unit.
UPDATE inventory
SET stock = stock - 3
WHERE id = 42 AND stock &gt;= 3;
-- rowCount = 0 means the guard failed (not enough stock); no partial write possible.
</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Assuming multiple separate writes are atomic.</strong> Two back-to-back <code>updateOne</code>/<code>UPDATE</code> calls without a transaction can partially fail, leaving inconsistent data. Wrap them or model them into one document/row.</li>`,
        `<li><strong>Forgetting to pass the session/transaction handle.</strong> In Mongo, a write without <code>{ session }</code> runs <em>outside</em> the transaction and is not rolled back. In pg, running on <code>pool</code> instead of the checked-out <code>client</code> escapes the BEGIN.</li>`,
        `<li><strong>Running Mongo transactions on a standalone server.</strong> Multi-document transactions require a replica set or sharded cluster; on a standalone <code>mongod</code> they error.</li>`,
        `<li><strong>Check-then-act race conditions.</strong> Reading a balance, then updating in a separate step, lets two concurrent requests both pass the check. Use a single conditional update or lock the row with <code>SELECT ... FOR UPDATE</code>.</li>`,
        `<li><strong>Long-running transactions.</strong> Holding a transaction open across slow work (HTTP calls, user think-time) holds locks and starves the database. Keep transactions short.</li>`,
        `<li><strong>Not handling transient/write-conflict errors.</strong> Under Serializable/high contention, transactions can be aborted by the database and must be <em>retried</em>. Not retrying surfaces spurious failures.</li>`,
        `<li><strong>Using a transaction when one document/row would do.</strong> Adds locking and overhead for no benefit; single-document/row writes are already atomic.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li>Reach for a transaction only when a single logical operation spans multiple rows/documents with an invariant between them; otherwise rely on built-in single-record atomicity.</li>`,
        `<li>Keep transactions <strong>short</strong> &#8212; acquire, write, commit &#8212; and never do slow external I/O while one is open.</li>`,
        `<li>Always pass the session/client to every operation inside the transaction, and clean up in <code>finally</code> (<code>release()</code> / <code>endSession()</code>).</li>`,
        `<li>Prefer a single conditional atomic update (<code>$inc</code> with a guard, <code>UPDATE ... WHERE</code>) over read-then-write to avoid races cheaply.</li>`,
        `<li>For genuine contention, lock explicitly (<code>SELECT ... FOR UPDATE</code>) or pick the right isolation level, and implement <strong>retry</strong> on transient conflicts.</li>`,
        `<li>Choose the isolation level consciously: stronger levels prevent more anomalies at the cost of throughput.</li>`,
        `<li>In MongoDB, model so that data changing together lives together &#8212; the best transaction is the one you did not need.</li>`,
        `</ul>`,
        `<h2>&#11088; Interview lens</h2>`,
        `<blockquote><p><strong>Q: What does ACID stand for, concretely?</strong><br/>Atomicity (all operations commit or none do), Consistency (the DB moves between valid states honouring its constraints), Isolation (concurrent transactions do not see each other's uncommitted work), Durability (once committed, data survives crashes). The bank-transfer example ties them together: the debit and credit are atomic, the "sum stays constant" invariant is consistency, other transactions do not see a half-done transfer (isolation), and once committed it is on disk forever (durability).</p></blockquote>`,
        `<blockquote><p><strong>Q: Does MongoDB support transactions?</strong><br/>Yes &#8212; single-document writes have always been atomic, and since 4.0 MongoDB supports multi-document ACID transactions via sessions (4.2 extended them to sharded clusters). The nuanced point: they require a replica set/cluster and carry overhead, and good document modeling often removes the need for them because related data lives in one atomically-updated document.</p></blockquote>`,
        `<blockquote><p><strong>Q: What are isolation levels and what anomalies do they prevent?</strong><br/>They control how much concurrent transactions are shielded from each other. Read Uncommitted allows dirty reads; Read Committed prevents dirty reads; Repeatable Read also prevents non-repeatable reads; Serializable prevents phantom reads too and behaves as if transactions ran sequentially. Higher levels cost throughput. Naming an anomaly (dirty/non-repeatable/phantom read) and the level that stops it is the strong answer.</p></blockquote>`,
        `<blockquote><p><strong>Q: When do you actually need a transaction?</strong><br/>When one logical operation spans multiple rows/documents and a partial result would be invalid &#8212; money transfers, order-plus-inventory, any cross-record invariant. When the change touches a single row/document, the database already guarantees atomicity, so a transaction is unnecessary overhead. The skill is recognising which case you are in.</p></blockquote>`,
        `<blockquote><p><strong>Q: How do you avoid a race condition like overselling inventory?</strong><br/>Do not read-then-write in two steps &#8212; that lets two requests both pass the check. Use a single atomic conditional update: in Mongo <code>updateOne({ _id, stock: { $gte: qty } }, { $inc: { stock: -qty } })</code>, in SQL <code>UPDATE ... SET stock = stock - $1 WHERE id = $2 AND stock &gt;= $1</code>, or lock the row with <code>SELECT ... FOR UPDATE</code> inside a transaction. The guard and the mutation must be one atomic operation.</p></blockquote>`,
        `<blockquote><p><strong>Q: Why keep transactions short, and what is a write conflict?</strong><br/>An open transaction holds locks (or an MVCC snapshot) and blocks other work, so long transactions cause contention, lock waits, and blocked connections. Under high contention or Serializable isolation, the database may abort a transaction with a write-conflict/serialization error rather than allow an inconsistency &#8212; the correct response is to catch it and retry the whole transaction, which is why transaction code is often wrapped in a bounded retry loop.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Transaction:</strong> group of writes that all commit or all rollback.</li>`,
        `<li><strong>ACID:</strong> Atomicity, Consistency, Isolation, Durability.</li>`,
        `<li><strong>SQL:</strong> <code>BEGIN</code> &#8594; writes on the checked-out client &#8594; <code>COMMIT</code>/<code>ROLLBACK</code>.</li>`,
        `<li><strong>Mongo:</strong> <code>startSession</code> &#8594; <code>startTransaction</code> &#8594; pass <code>{ session }</code> &#8594; commit/abort; needs a replica set.</li>`,
        `<li><strong>Single doc/row writes are already atomic</strong> &#8212; often no transaction needed.</li>`,
        `<li><strong>Avoid races</strong> with one conditional atomic update or <code>SELECT ... FOR UPDATE</code>.</li>`,
        `<li><strong>Isolation levels</strong> trade throughput for fewer anomalies; retry on write conflicts; keep transactions short.</li>`,
        `</ul>`
      ].join('\n')
    }
  ]
};
