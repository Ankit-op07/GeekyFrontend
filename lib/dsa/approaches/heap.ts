// lib/dsa/approaches/heap.ts
//
// "Our approach" pages for the Heap / Priority Queue section.
//
// Same four beats as every other approach file (brute force → why it is too
// slow → the observation → the trap); see approaches/arrays-hashing.ts for the
// house style in full.
//
// THE ONE COUNTERINTUITIVE RULE, stated once here because four of the seven
// problems depend on it:
//
//   To keep the k LARGEST items, use a MIN-heap.
//
// It reads backwards and it is not. The heap holds the k best-so-far, and the
// only element you ever want to throw away is the WEAKEST of them — so the
// thing that must be instantly accessible is the minimum. Push everything;
// whenever the size exceeds k, pop the min. What survives is the k largest, and
// the root is the kth largest. Symmetrically: k smallest → max-heap.
//
// WHY A HEAP AND NOT SORTING. Sorting is O(n log n) and gives a total order you
// then throw away. A size-k heap is O(n log k) — better whenever k is small —
// and, more importantly, it works on a STREAM, where sorting is not available
// because the data has not finished arriving. Kth Largest in a Stream and Find
// Median are stream problems; that is the whole reason they are Design.
//
// LANGUAGE NOTE, since it bites in every problem here: C++ priority_queue is a
// MAX-heap by default, Java PriorityQueue is a MIN-heap by default, and
// JavaScript has no heap at all. Each page says which way it is inverting and
// the JS solutions use whichever O(n log n) or O(n) technique is honest for
// that problem rather than pretending a heap exists.

import type { DsaApproach } from '../types';

export const heapApproaches: Record<string, DsaApproach> = {
    'kth-largest-element-in-a-stream': {
        restate:
            'A class that, after each new number arrives, reports the kth largest seen so far.',
        body: `Re-sorting after every \`add\` is \`O(n log n)\` per call. The point of the problem is that you do not need the full order — only the kth largest.

**The observation, and it is the section's whole rule:** keep a **min-heap of exactly the k largest values seen**. Its root is the smallest of those k, which is by definition the kth largest overall.

On each \`add\`: push, then if the size exceeds k, pop the minimum. Whatever falls out was too small to be in the top k, and can never matter again — a later number cannot make a discarded one larger.

Return the root. \`O(log k)\` per add, \`O(k)\` space, and it never stores more than k numbers no matter how long the stream runs.

**Why min-heap and not max-heap:** with a max-heap you would have easy access to the *largest*, which is exactly the element you never want to remove. The eviction decision is what picks the heap direction, not the question being asked.

**The trap:** pop *after* pushing, not before, and compare against \`k\` rather than \`k - 1\`. Trimming first can evict the value you just added when it belongs in the top k.

**The constructor matters too:** seed the heap with the initial array using the same push-then-trim loop rather than sorting it. It reuses the code and keeps the memory bound at \`k\` even if the seed array is huge.`,
        complexity: { time: 'O(log k) per add', space: 'O(k)' },
        code: [
            {
                lang: 'cpp',
                source: `class KthLargest {
    // MIN-heap of the k largest: the root is the kth largest.
    priority_queue<int, vector<int>, greater<int>> pq;
    int k;
public:
    KthLargest(int k, vector<int>& nums) : k(k) {
        for (int n : nums) add(n);
    }

    int add(int val) {
        pq.push(val);
        if ((int)pq.size() > k) pq.pop();   // push THEN trim
        return pq.top();
    }
};`,
            },
            {
                lang: 'java',
                source: `class KthLargest {
    private final PriorityQueue<Integer> pq = new PriorityQueue<>();  // min by default
    private final int k;

    public KthLargest(int k, int[] nums) {
        this.k = k;
        for (int n : nums) add(n);
    }

    public int add(int val) {
        pq.add(val);
        if (pq.size() > k) pq.poll();
        return pq.peek();
    }
}`,
            },
            {
                lang: 'javascript',
                source: `/**
 * JS has no built-in heap, so this is a hand-rolled min-heap. Writing one is
 * worth doing once — sift-up on push, sift-down on pop is the whole thing.
 */
class KthLargest {
    constructor(k, nums) {
        this.k = k;
        this.h = [];
        for (const n of nums) this.add(n);
    }

    #up(i) {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (this.h[p] <= this.h[i]) break;
            [this.h[p], this.h[i]] = [this.h[i], this.h[p]];
            i = p;
        }
    }

    #down(i) {
        const n = this.h.length;
        for (;;) {
            const l = 2 * i + 1, r = l + 1;
            let small = i;
            if (l < n && this.h[l] < this.h[small]) small = l;
            if (r < n && this.h[r] < this.h[small]) small = r;
            if (small === i) break;
            [this.h[small], this.h[i]] = [this.h[i], this.h[small]];
            i = small;
        }
    }

    add(val) {
        this.h.push(val);
        this.#up(this.h.length - 1);
        if (this.h.length > this.k) {
            this.h[0] = this.h[this.h.length - 1];
            this.h.pop();
            this.#down(0);
        }
        return this.h[0];
    }
}`,
            },
        ],
        followUps: [
            'Why a min-heap for the k LARGEST? Answer in terms of what gets evicted.',
            'What if k could change between calls?',
            'kth SMALLEST in a stream — what flips?',
        ],
    },

    'last-stone-weight': {
        restate:
            'Repeatedly smash the two heaviest stones together; the difference goes back in. What is left at the end?',
        body: `A simulation problem, and the only real question is how you keep finding the two heaviest.

Re-sorting after every smash is \`O(n log n)\` per round and \`O(n² log n)\` overall. A max-heap gives both extremes in \`O(log n)\` and puts the residue back in \`O(log n)\`.

**The observation:** you never need the full order, only the top two, and the collection changes after every step. That is precisely what a priority queue is for — cheap access to the extreme of a *mutating* set.

Each round: pop twice, and if the two differ, push the difference. If they are equal both are destroyed and nothing goes back. Loop while more than one stone remains; the answer is the last stone or 0 for an empty heap.

**This is the one problem in the section that genuinely wants a MAX-heap**, because you want the largest and it is never evicted — there is no "keep only k" trade here. Note how that differs from the surrounding problems, where the min-heap rule applies.

**Language traps.** C++ \`priority_queue\` is already max — no comparator needed. Java's is min, so pass \`Collections.reverseOrder()\`; forgetting it compiles fine and smashes the two *lightest* stones, producing plausible wrong answers.

**Two edge cases:** an empty input returns 0, and a single stone returns itself without ever entering the loop. Guard the loop on \`size > 1\`, and read the result with a size check rather than assuming something is there.`,
        complexity: { time: 'O(n log n)', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int lastStoneWeight(vector<int>& stones) {
        // C++ priority_queue is a MAX-heap already.
        priority_queue<int> pq(stones.begin(), stones.end());

        while (pq.size() > 1) {
            int a = pq.top(); pq.pop();
            int b = pq.top(); pq.pop();
            if (a != b) pq.push(a - b);     // equal stones destroy each other
        }
        return pq.empty() ? 0 : pq.top();
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int lastStoneWeight(int[] stones) {
        // Java's PriorityQueue is a MIN-heap — reverseOrder is REQUIRED here.
        PriorityQueue<Integer> pq = new PriorityQueue<>(Collections.reverseOrder());
        for (int s : stones) pq.add(s);

        while (pq.size() > 1) {
            int a = pq.poll();
            int b = pq.poll();
            if (a != b) pq.add(a - b);
        }
        return pq.isEmpty() ? 0 : pq.peek();
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function lastStoneWeight(stones) {
    /**
     * n <= 30 here, so a sorted array is genuinely the right call: the whole
     * input is smaller than the constant factor of a hand-rolled heap. Say the
     * heap solution in an interview, then note that the constraints make this
     * simpler version equally fast in practice.
     */
    const s = [...stones].sort((a, b) => a - b);

    while (s.length > 1) {
        const a = s.pop();          // largest
        const b = s.pop();          // second largest
        if (a !== b) {
            const d = a - b;
            // Insert d back in sorted position.
            let i = s.length;
            while (i > 0 && s[i - 1] > d) i--;
            s.splice(i, 0, d);
        }
    }
    return s.length ? s[0] : 0;
}`,
            },
        ],
        followUps: [
            'What does the Java version return if you forget reverseOrder()?',
            'Last Stone Weight II (Leetcode 1049) — why is that a DP problem, not a heap one?',
        ],
    },

    'k-closest-points-to-origin': {
        restate: 'Return the k points nearest the origin.',
        body: `Sorting every point by distance is \`O(n log n)\` and is a fine opening answer. Two better ones exist and the interviewer usually wants one of them.

**First, the simplification that costs nothing:** compare **squared** distances, \`x² + y²\`. The square root is monotonic, so it never changes the ordering — computing it is wasted work and introduces floating-point comparison into what should be exact integer arithmetic. Say this out loud; it is a small thing that signals care.

**Heap solution:** keep a **max-heap of size k** holding the closest points so far. When it overflows, pop the *farthest* — the one you want to discard. \`O(n log k)\`. Note this is the mirror of the section's rule: k smallest → max-heap.

**Quickselect:** partition around a pivot until the kth boundary lands in place, then take everything left of it. \`O(n)\` average, \`O(n²)\` worst case, and it does not preserve order among the k — which the problem explicitly allows.

**Which to give:** the heap, unless asked for better. It is easier to write correctly under pressure, it streams, and \`O(n log k)\` is close to \`O(n)\` for small k. Mention quickselect as the asymptotic improvement and be honest about its worst case.

**The language trap again:** Java's PriorityQueue is a min-heap, so a max-heap needs the comparator reversed — \`(a, b) -> distB - distA\`. Getting it backwards returns the k *farthest* points, which passes any test where k equals n.`,
        complexity: { time: 'O(n log k) heap — O(n) average quickselect', space: 'O(k)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    vector<vector<int>> kClosest(vector<vector<int>>& points, int k) {
        // MAX-heap of size k: pop the FARTHEST when it overflows.
        // Squared distance — sqrt is monotonic, so it cannot change the order.
        priority_queue<pair<int, int>> pq;   // (distance, index), max by default

        for (int i = 0; i < (int)points.size(); i++) {
            int d = points[i][0] * points[i][0] + points[i][1] * points[i][1];
            pq.push({d, i});
            if ((int)pq.size() > k) pq.pop();
        }

        vector<vector<int>> out;
        while (!pq.empty()) {
            out.push_back(points[pq.top().second]);
            pq.pop();
        }
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int[][] kClosest(int[][] points, int k) {
        // Java is min by default — REVERSE it for a max-heap.
        PriorityQueue<int[]> pq = new PriorityQueue<>(
            (a, b) -> (b[0] * b[0] + b[1] * b[1]) - (a[0] * a[0] + a[1] * a[1])
        );

        for (int[] p : points) {
            pq.add(p);
            if (pq.size() > k) pq.poll();   // drop the farthest
        }

        int[][] out = new int[k][2];
        for (int i = 0; i < k; i++) out[i] = pq.poll();
        return out;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function kClosest(points, k) {
    // Sorting by squared distance: O(n log n), and the clearest thing to write
    // without a built-in heap. Mention the O(n log k) heap and O(n) quickselect.
    return [...points]
        .sort((a, b) => (a[0] ** 2 + a[1] ** 2) - (b[0] ** 2 + b[1] ** 2))
        .slice(0, k);
}`,
            },
        ],
        followUps: [
            'Why compare squared distances rather than actual ones?',
            'Write the quickselect version. What is its worst case, and how do you mitigate it?',
            'What if the points arrive as a stream and n is unknown?',
        ],
    },

    'kth-largest-element-in-an-array': {
        restate: 'The kth largest element in an unsorted array — by value, not by distinct rank.',
        body: `Sorting and indexing is one line and \`O(n log n)\`. The problem exists to push you past it, so have both improvements ready.

**Min-heap of size k** — the section's rule applied directly. Push everything; trim to k; the root is the answer. \`O(n log k)\` time, \`O(k)\` space. This is the answer to give first: short, safe, and it streams.

**Quickselect** — the asymptotic winner. Partition around a pivot; after partitioning, the pivot sits at its final sorted index. If that index is the one you want, you are done. Otherwise recurse into *only* the side containing the target — that is the difference from quicksort, and it is what turns \`O(n log n)\` into \`O(n)\` on average, since the work halves each time instead of doubling.

**The worst case is real and you should say it:** an adversarial or already-sorted input with naive pivot choice degrades quickselect to \`O(n²)\`. Random pivot selection makes that vanishingly unlikely, and mentioning it unprompted is usually what the question is checking.

**Two traps.**

**"kth largest" is by position in sorted order, not by distinct value.** In \`[3,3,3]\` with \`k = 2\` the answer is 3. Do not deduplicate.

**Convert the index carefully.** The kth largest is index \`n - k\` in ascending order. Off-by-one here is the most common wrong submission, and it survives symmetric test cases where \`k\` and \`n - k\` coincide.`,
        complexity: { time: 'O(n) average quickselect — O(n log k) heap', space: 'O(1) / O(k)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int findKthLargest(vector<int>& nums, int k) {
        // MIN-heap of the k largest; the root is the answer.
        priority_queue<int, vector<int>, greater<int>> pq;
        for (int n : nums) {
            pq.push(n);
            if ((int)pq.size() > k) pq.pop();
        }
        return pq.top();
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> pq = new PriorityQueue<>();   // min by default
        for (int n : nums) {
            pq.add(n);
            if (pq.size() > k) pq.poll();
        }
        return pq.peek();
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function findKthLargest(nums, k) {
    // Quickselect with a RANDOM pivot — the random choice is what keeps the
    // O(n^2) worst case away on sorted or adversarial input.
    const target = nums.length - k;    // kth largest = index n-k ascending
    let lo = 0, hi = nums.length - 1;

    while (true) {
        const p = lo + Math.floor(Math.random() * (hi - lo + 1));
        [nums[p], nums[hi]] = [nums[hi], nums[p]];

        let store = lo;
        for (let i = lo; i < hi; i++) {
            if (nums[i] < nums[hi]) {
                [nums[store], nums[i]] = [nums[i], nums[store]];
                store++;
            }
        }
        [nums[store], nums[hi]] = [nums[hi], nums[store]];

        if (store === target) return nums[store];
        if (store < target) lo = store + 1;   // recurse into ONE side only
        else hi = store - 1;
    }
}`,
            },
        ],
        followUps: [
            'What is the kth largest of [3,3,3] with k = 2? Why does that rule out deduplication?',
            'Why does quickselect average O(n) when quicksort is O(n log n)?',
            'How does a random pivot help, and what does it not guarantee?',
        ],
    },

    'task-scheduler': {
        restate:
            'Identical tasks must be at least n intervals apart. What is the minimum total time, counting idles?',
        body: `A heap simulation works and is the answer most people build. There is also a formula, and knowing both is the point.

**The simulation:** always run the task with the most remaining copies — running a rarer task first wastes the scarce slot. Pop the largest count, decrement it, and put it in a cooldown queue holding \`(count, readyTime)\`. Each tick, move anything whose cooldown expired back into the heap. If the heap is empty but the cooldown queue is not, the CPU idles.

**The greedy justification, which is the real question:** the most frequent task is the bottleneck. Scheduling anything else ahead of it can only push its remaining copies later, so the total cannot improve — the classic exchange argument.

**The formula, from the same insight:** let \`maxCount\` be the largest frequency and \`numMax\` how many tasks share it. Lay the most frequent task out as \`maxCount - 1\` blocks of width \`n + 1\`, then append the \`numMax\` finishers:

\`\`\`
(maxCount - 1) * (n + 1) + numMax
\`\`\`

**The clamp is essential:** take \`max(that, totalTasks)\`. When there are many distinct tasks, the gaps fill themselves and no idling occurs — the formula would then *under*-count, reporting fewer slots than there are tasks to run.

**The trap in the simulation:** the cooldown must be a FIFO queue, not a second heap. Tasks become ready in the order they were dispatched, and re-prioritising them there is both wrong and slower.

Only 26 distinct tasks are possible, so the heap is \`O(1)\`-sized and the simulation is linear in the answer.`,
        complexity: { time: 'O(n) with the formula', space: 'O(1) — 26 counters' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int leastInterval(vector<char>& tasks, int n) {
        int count[26] = {0};
        for (char t : tasks) count[t - 'A']++;

        int maxCount = 0, numMax = 0;
        for (int c : count) maxCount = max(maxCount, c);
        for (int c : count) if (c == maxCount) numMax++;

        int slots = (maxCount - 1) * (n + 1) + numMax;
        // Clamp: with many distinct tasks the gaps fill and nothing idles.
        return max(slots, (int)tasks.size());
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int leastInterval(char[] tasks, int n) {
        int[] count = new int[26];
        for (char t : tasks) count[t - 'A']++;

        int maxCount = 0, numMax = 0;
        for (int c : count) maxCount = Math.max(maxCount, c);
        for (int c : count) if (c == maxCount) numMax++;

        int slots = (maxCount - 1) * (n + 1) + numMax;
        return Math.max(slots, tasks.length);
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function leastInterval(tasks, n) {
    const count = new Map();
    for (const t of tasks) count.set(t, (count.get(t) || 0) + 1);

    const counts = [...count.values()];
    const maxCount = Math.max(...counts);
    const numMax = counts.filter((c) => c === maxCount).length;

    const slots = (maxCount - 1) * (n + 1) + numMax;
    return Math.max(slots, tasks.length);   // clamp, or many-distinct undercounts
}`,
            },
        ],
        followUps: [
            'Why is max(formula, tasks.length) needed? Give an input where the formula alone is too small.',
            'Write the heap simulation. Why must the cooldown structure be a QUEUE?',
            'Return an actual valid schedule, not just its length.',
        ],
    },

    'design-twitter': {
        restate:
            'Post tweets, follow and unfollow users, and return the 10 most recent tweets from a user and everyone they follow.',
        body: `A design problem where the data structures follow directly from which operation must be fast.

**The shape:**
- \`tweets\`: userId → list of \`(timestamp, tweetId)\`, appended to. Naturally ordered newest-last.
- \`following\`: userId → set of followees. A set, because unfollow must be \`O(1)\` and duplicate follows must be idempotent.
- A global monotonically increasing counter for ordering. **Not a wall clock** — two tweets in the same millisecond would tie and the order would be undefined.

**The observation for \`getNewsFeed\`:** each followee's tweet list is already sorted, so this is *merge k sorted lists, take the first 10*. Push each followee's most recent tweet into a max-heap keyed by timestamp; pop the newest, then push that user's next-most-recent. Ten pops and you are done.

That is \`O(k log k)\` for k followees rather than gathering and sorting everything, and it is the same idea as Merge k Sorted Lists in the Linked List section — worth naming the connection.

**Three traps.**

**A user sees their own tweets** even if they do not follow themselves. Include \`userId\` in the set you iterate, or self-follow at construction.

**Cap what you push.** Only the last 10 tweets of any user can matter, so slice before pushing rather than heaping thousands of old ones.

**Unfollowing yourself must be a no-op**, or a user's own tweets vanish from their feed — a bug that only appears if a test happens to call it.

**The scaling follow-up**, which is the actual interview: this is fan-out-on-read. Fan-out-on-write pushes each tweet into followers' precomputed feeds — much faster reads, but a celebrity with millions of followers makes a single post enormously expensive. Real systems do both, choosing per user.`,
        complexity: { time: 'O(k log k) per feed, k = followees', space: 'O(users + tweets)' },
        code: [
            {
                lang: 'cpp',
                source: `class Twitter {
    int clock = 0;                                  // monotonic, NOT a wall clock
    unordered_map<int, vector<pair<int, int>>> tweets;   // user -> (time, tweetId)
    unordered_map<int, unordered_set<int>> following;
public:
    void postTweet(int userId, int tweetId) {
        tweets[userId].push_back({clock++, tweetId});
    }

    vector<int> getNewsFeed(int userId) {
        priority_queue<pair<int, int>> pq;           // max-heap by timestamp
        auto consider = [&](int uid) {
            auto it = tweets.find(uid);
            if (it == tweets.end()) return;
            // Only the last 10 of any user can matter.
            int start = max(0, (int)it->second.size() - 10);
            for (int i = start; i < (int)it->second.size(); i++) pq.push(it->second[i]);
        };

        consider(userId);                            // your own tweets always count
        for (int f : following[userId]) if (f != userId) consider(f);

        vector<int> out;
        while (!pq.empty() && out.size() < 10) {
            out.push_back(pq.top().second);
            pq.pop();
        }
        return out;
    }

    void follow(int followerId, int followeeId) {
        following[followerId].insert(followeeId);
    }

    void unfollow(int followerId, int followeeId) {
        if (followerId == followeeId) return;        // never unfollow yourself
        following[followerId].erase(followeeId);
    }
};`,
            },
            {
                lang: 'java',
                source: `class Twitter {
    private int clock = 0;
    private final Map<Integer, List<int[]>> tweets = new HashMap<>();
    private final Map<Integer, Set<Integer>> following = new HashMap<>();

    public void postTweet(int userId, int tweetId) {
        tweets.computeIfAbsent(userId, k -> new ArrayList<>())
              .add(new int[]{clock++, tweetId});
    }

    public List<Integer> getNewsFeed(int userId) {
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> b[0] - a[0]);

        Set<Integer> sources = new HashSet<>(following.getOrDefault(userId, Set.of()));
        sources.add(userId);

        for (int uid : sources) {
            List<int[]> list = tweets.get(uid);
            if (list == null) continue;
            for (int i = Math.max(0, list.size() - 10); i < list.size(); i++) {
                pq.add(list.get(i));
            }
        }

        List<Integer> out = new ArrayList<>();
        while (!pq.isEmpty() && out.size() < 10) out.add(pq.poll()[1]);
        return out;
    }

    public void follow(int followerId, int followeeId) {
        following.computeIfAbsent(followerId, k -> new HashSet<>()).add(followeeId);
    }

    public void unfollow(int followerId, int followeeId) {
        if (followerId == followeeId) return;
        Set<Integer> s = following.get(followerId);
        if (s != null) s.remove(followeeId);
    }
}`,
            },
            {
                lang: 'javascript',
                source: `class Twitter {
    constructor() {
        this.clock = 0;
        this.tweets = new Map();      // user -> [[time, tweetId], ...]
        this.following = new Map();   // user -> Set(followees)
    }

    postTweet(userId, tweetId) {
        if (!this.tweets.has(userId)) this.tweets.set(userId, []);
        this.tweets.get(userId).push([this.clock++, tweetId]);
    }

    getNewsFeed(userId) {
        const sources = new Set(this.following.get(userId) || []);
        sources.add(userId);          // you always see your own tweets

        const pool = [];
        for (const uid of sources) {
            const list = this.tweets.get(uid);
            if (!list) continue;
            pool.push(...list.slice(-10));   // only the last 10 can matter
        }

        return pool
            .sort((a, b) => b[0] - a[0])
            .slice(0, 10)
            .map(([, id]) => id);
    }

    follow(followerId, followeeId) {
        if (!this.following.has(followerId)) this.following.set(followerId, new Set());
        this.following.get(followerId).add(followeeId);
    }

    unfollow(followerId, followeeId) {
        if (followerId === followeeId) return;
        this.following.get(followerId)?.delete(followeeId);
    }
}`,
            },
        ],
        followUps: [
            'Fan-out on read vs fan-out on write. Where does each break?',
            'Why a monotonic counter rather than a timestamp?',
            'What happens to a feed if unfollowing yourself is allowed?',
        ],
    },

    'find-median-from-data-stream': {
        restate: 'Support adding numbers to a stream and reading the running median in O(1).',
        body: `The best design problem on the sheet, and the one where two heaps beat everything else.

Keeping a sorted array gives \`O(1)\` median but \`O(n)\` insertion. A single heap gives fast insertion but no access to the middle — a heap knows its extreme, not its centre.

**The observation:** the median sits between the largest of the small half and the smallest of the large half. Both of those are *extremes* of their halves — and extremes are exactly what heaps are good at. So split the data:

- a **max-heap** holding the smaller half, and
- a **min-heap** holding the larger half.

Then the median is the max-heap's root (odd total) or the average of the two roots (even). \`O(1)\` to read, \`O(log n)\` to insert.

**Keeping them balanced, robustly:** push onto the max-heap, immediately move its root to the min-heap, then if the min-heap has grown larger, move its root back. That push-then-rebalance dance is *unconditional* — no comparisons against the current median, no branching on which half a value belongs to. It is longer by a line and eliminates the whole class of "which heap does this go in" bugs.

The invariant is that the max-heap has the same size as the min-heap or exactly one more, so the odd case always resolves to the max-heap's root.

**The trap:** dividing by 2 with integer arithmetic. \`(a + b) / 2\` on ints truncates and returns 2 for a median of 2.5. Use \`/ 2.0\`. In C++ and Java the sum can also overflow int when both roots are near the maximum — cast before adding.

**The follow-ups are the real interview:** if all values are in \`[0, 100]\`, a 101-bucket counting array gives \`O(1)\` insert. If 99% fall in that range, keep buckets for the common case and heaps for the outliers.`,
        complexity: { time: 'O(log n) add, O(1) findMedian', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class MedianFinder {
    priority_queue<int> small;                                   // max-heap, lower half
    priority_queue<int, vector<int>, greater<int>> large;        // min-heap, upper half
public:
    void addNum(int num) {
        // Unconditional dance: no branching on which half it belongs to.
        small.push(num);
        large.push(small.top()); small.pop();
        if (large.size() > small.size()) {
            small.push(large.top()); large.pop();
        }
    }

    double findMedian() {
        if (small.size() > large.size()) return small.top();
        return (small.top() + (double)large.top()) / 2.0;   // 2.0, not 2
    }
};`,
            },
            {
                lang: 'java',
                source: `class MedianFinder {
    private final PriorityQueue<Integer> small =
        new PriorityQueue<>(Collections.reverseOrder());   // max-heap
    private final PriorityQueue<Integer> large = new PriorityQueue<>();  // min-heap

    public void addNum(int num) {
        small.add(num);
        large.add(small.poll());
        if (large.size() > small.size()) small.add(large.poll());
    }

    public double findMedian() {
        if (small.size() > large.size()) return small.peek();
        return (small.peek() + (double) large.peek()) / 2.0;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `class MedianFinder {
    constructor() {
        this.small = [];   // max-heap (lower half)
        this.large = [];   // min-heap (upper half)
    }

    #push(h, v, cmp) {
        h.push(v);
        let i = h.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (cmp(h[p], h[i]) <= 0) break;
            [h[p], h[i]] = [h[i], h[p]];
            i = p;
        }
    }

    #pop(h, cmp) {
        const top = h[0];
        const last = h.pop();
        if (h.length) {
            h[0] = last;
            let i = 0;
            for (;;) {
                const l = 2 * i + 1, r = l + 1;
                let best = i;
                if (l < h.length && cmp(h[l], h[best]) < 0) best = l;
                if (r < h.length && cmp(h[r], h[best]) < 0) best = r;
                if (best === i) break;
                [h[best], h[i]] = [h[i], h[best]];
                i = best;
            }
        }
        return top;
    }

    addNum(num) {
        const maxCmp = (a, b) => b - a;   // max-heap ordering
        const minCmp = (a, b) => a - b;   // min-heap ordering

        this.#push(this.small, num, maxCmp);
        this.#push(this.large, this.#pop(this.small, maxCmp), minCmp);
        if (this.large.length > this.small.length) {
            this.#push(this.small, this.#pop(this.large, minCmp), maxCmp);
        }
    }

    findMedian() {
        if (this.small.length > this.large.length) return this.small[0];
        return (this.small[0] + this.large[0]) / 2;
    }
}`,
            },
        ],
        followUps: [
            'All numbers are in [0, 100]. What is better than heaps? (Counting buckets — O(1) insert.)',
            '99% are in [0, 100] but the rest are arbitrary. Combine both.',
            'Why does the unconditional push-then-rebalance avoid a whole class of bugs?',
        ],
    },
};
