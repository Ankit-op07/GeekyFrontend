// lib/dsa/approaches/intervals.ts
//
// "Our approach" pages for the Intervals section.
//
// Same four beats as every other approach file (brute force → why it is too
// slow → the observation → the trap); see approaches/arrays-hashing.ts for the
// house style in full.
//
// THIS SECTION IS ONE DECISION, MADE SIX TIMES. Nearly every interval problem
// is "sort, then sweep once". The sweep is mechanical. The decision is:
//
//   SORT BY START  — when you are MERGING or INSERTING. Processing intervals in
//                    the order they begin is what makes "does this one touch
//                    the previous one?" a single comparison.
//                    → Merge Intervals, Insert Interval, My Calendar
//
//   SORT BY END    — when you are FITTING AS MANY AS POSSIBLE. The interval
//                    that finishes earliest leaves the most room for
//                    everything after it, so it is always safe to keep.
//                    → Non-overlapping Intervals, Minimum Arrows
//
// Getting that backwards produces a solution that is correct on most inputs and
// wrong on the ones that matter, so each page states which it uses and why.
//
// THE OTHER RECURRING QUESTION: does TOUCHING count as overlapping? [1,2] and
// [2,3] share exactly one point. Merge Intervals says yes (merge them), Minimum
// Arrows says yes (one arrow), Non-overlapping Intervals says no (both can
// stay). It is decided per problem by the statement, never by intuition — read
// it every time, and it is the difference between < and <= in one comparison.
//
// A THIRD SHAPE appears twice: when two lists are each already sorted, do not
// merge and re-sort — walk them with two pointers. Interval List Intersections
// is that, and it is O(m + n) instead of O((m+n) log(m+n)).

import type { DsaApproach } from '../types';

export const intervalsApproaches: Record<string, DsaApproach> = {
    'insert-interval': {
        restate:
            'Insert a new interval into a sorted, non-overlapping list, merging anything it touches.',
        body: `The input is **already sorted and already non-overlapping** — that is a gift, and re-sorting throws it away for no reason. One pass, three phases.

**Phase 1 — everything strictly before.** While an interval ends before the new one starts (\`interval.end < newInterval.start\`), it cannot overlap. Copy it and move on.

**Phase 2 — everything that touches.** While an interval starts at or before the new one ends, they overlap. Do not append them; instead **absorb** them into the new interval by widening it:

\`\`\`
newInterval.start = min(newInterval.start, interval.start)
newInterval.end   = max(newInterval.end,   interval.end)
\`\`\`

Once the loop ends, append the widened interval — **once**, after absorbing everything.

**Phase 3 — everything strictly after.** Copy the remainder unchanged.

**The trap: append the merged interval after phase 2, not inside it.** Appending on each overlap emits a partially-merged interval for every one it swallowed. The output then contains overlapping intervals, which is exactly what the function is supposed to prevent.

**The comparisons are \`<\` and \`<=\` deliberately.** \`[1,2]\` and \`[2,3]\` share the point 2 and must merge here, so phase 2's condition uses \`<=\`. Getting this wrong leaves two adjacent intervals that should have been one.

**The new interval may go at either end**, and this structure handles both without special cases: an early insert leaves phase 1 empty, a late one leaves phase 3 empty.`,
        complexity: { time: 'O(n)', space: 'O(n) for the output' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    vector<vector<int>> insert(vector<vector<int>>& intervals, vector<int> newInterval) {
        vector<vector<int>> out;
        int i = 0, n = intervals.size();

        // 1. Strictly before — ends before the new one starts.
        while (i < n && intervals[i][1] < newInterval[0]) out.push_back(intervals[i++]);

        // 2. Overlapping — absorb, do NOT append yet. <= : touching counts.
        while (i < n && intervals[i][0] <= newInterval[1]) {
            newInterval[0] = min(newInterval[0], intervals[i][0]);
            newInterval[1] = max(newInterval[1], intervals[i][1]);
            i++;
        }
        out.push_back(newInterval);      // once, after absorbing everything

        // 3. Strictly after.
        while (i < n) out.push_back(intervals[i++]);
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int[][] insert(int[][] intervals, int[] newInterval) {
        List<int[]> out = new ArrayList<>();
        int i = 0, n = intervals.length;

        while (i < n && intervals[i][1] < newInterval[0]) out.add(intervals[i++]);

        while (i < n && intervals[i][0] <= newInterval[1]) {
            newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
            newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
            i++;
        }
        out.add(newInterval);

        while (i < n) out.add(intervals[i++]);
        return out.toArray(new int[0][]);
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function insert(intervals, newInterval) {
    const out = [];
    let i = 0;
    const n = intervals.length;
    let [start, end] = newInterval;

    while (i < n && intervals[i][1] < start) out.push(intervals[i++]);

    while (i < n && intervals[i][0] <= end) {     // touching counts as overlap
        start = Math.min(start, intervals[i][0]);
        end = Math.max(end, intervals[i][1]);
        i++;
    }
    out.push([start, end]);                        // append ONCE

    while (i < n) out.push(intervals[i++]);
    return out;
}`,
            },
        ],
        followUps: [
            'What does the output look like if you append inside the overlap loop?',
            'Why is no sorting needed here?',
            'Handle a new interval that goes before everything, and after everything.',
        ],
    },

    'merge-intervals': {
        restate: 'Merge all overlapping intervals in an unsorted list.',
        body: `**Sort by start.** That is the whole algorithm; everything after is bookkeeping.

**Why sorting by start is the right choice:** once intervals are in order of when they begin, any interval that overlaps the current merged block must begin before that block ends — so a single comparison against the *last* thing in the output settles it. Without sorting you would have to compare every interval against every other.

Then sweep: for each interval, if it starts at or before the last output interval's end, extend that end; otherwise push it as a new block.

**The trap: extend with \`max(last.end, current.end)\`, not \`current.end\`.** A fully-contained interval like \`[2,3]\` inside \`[1,10]\` would otherwise shrink the block to \`[1,3]\` and lose everything after. This is the bug that survives casual testing, because most examples have intervals that extend rather than nest.

**Touching counts as overlapping here** — \`[1,4]\` and \`[4,5]\` become \`[1,5]\` — so the comparison is \`<=\`. Contrast Non-overlapping Intervals, where touching is explicitly allowed and the comparison flips. Read the statement, do not assume.

**Compare against the output's last element**, not against the previous input interval. After merging, the block's end may be further right than any single interval that formed it, and comparing to the raw previous input misses that.

\`O(n log n)\`, dominated by the sort. The sweep is linear and the space is just the output.`,
        complexity: { time: 'O(n log n)', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end());   // by START
        vector<vector<int>> out;

        for (auto& in : intervals) {
            // <= : touching intervals merge. Compare to the OUTPUT's last.
            if (!out.empty() && in[0] <= out.back()[1]) {
                out.back()[1] = max(out.back()[1], in[1]);   // max, not in[1]
            } else {
                out.push_back(in);
            }
        }
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int[][] merge(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> out = new ArrayList<>();

        for (int[] in : intervals) {
            if (!out.isEmpty() && in[0] <= out.get(out.size() - 1)[1]) {
                int[] last = out.get(out.size() - 1);
                last[1] = Math.max(last[1], in[1]);
            } else {
                out.add(new int[]{in[0], in[1]});
            }
        }
        return out.toArray(new int[0][]);
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function merge(intervals) {
    const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
    const out = [];

    for (const [start, end] of sorted) {
        const last = out[out.length - 1];
        if (last && start <= last[1]) {
            last[1] = Math.max(last[1], end);   // a nested interval must not shrink it
        } else {
            out.push([start, end]);
        }
    }
    return out;
}`,
            },
        ],
        followUps: [
            'What does [[1,10],[2,3]] return if you assign last.end = current.end?',
            'Why sort by start rather than by end?',
            'Return the total length COVERED by the union of intervals.',
        ],
    },

    'non-overlapping-intervals': {
        restate: 'The minimum number of intervals to remove so that none overlap.',
        body: `Flip the question. "Remove the fewest" is the same as **"keep the most"**, and the second phrasing is a classic greedy problem — activity selection.

**Sort by END, and this is the decision the problem is testing.** The interval that finishes earliest leaves the most room for everything after it, so keeping it is always at least as good as keeping any other.

**The exchange argument:** take any optimal set that does not include the earliest-finishing interval. Swap that interval in for whichever one the optimal set kept first. The swap-in ends no later, so nothing else in the set conflicts — the count is unchanged and still optimal. Therefore keeping the earliest finisher is safe. Say this; it is the whole assessment.

**Why sorting by start fails:** a very long interval starting first would be kept and would block many short ones. Sorting by start is right for *merging*, wrong for *fitting*.

Then sweep: keep a running \`prevEnd\`. If an interval starts at or after it, keep it and advance \`prevEnd\`. Otherwise it overlaps — count a removal and leave \`prevEnd\` alone, since the interval you already kept ends earlier and is the better one to hold.

**The trap: touching does NOT count as overlapping here.** \`[1,2]\` and \`[2,3]\` can both stay, so the condition is \`start >= prevEnd\`. Using \`>\` removes intervals unnecessarily and inflates the answer. This is the opposite convention to Merge Intervals two problems earlier — the deliberate contrast is the point.

**The answer is \`n - kept\`**, or count removals directly.`,
        complexity: { time: 'O(n log n)', space: 'O(1) beyond the sort' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int eraseOverlapIntervals(vector<vector<int>>& intervals) {
        // Sort by END: earliest finisher leaves the most room.
        sort(intervals.begin(), intervals.end(),
             [](const vector<int>& a, const vector<int>& b) { return a[1] < b[1]; });

        int removals = 0;
        int prevEnd = INT_MIN;
        for (auto& in : intervals) {
            // >= : touching is ALLOWED here (unlike Merge Intervals).
            if (in[0] >= prevEnd) prevEnd = in[1];   // keep it
            else removals++;                          // drop it, prevEnd stands
        }
        return removals;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int eraseOverlapIntervals(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));

        int removals = 0;
        int prevEnd = Integer.MIN_VALUE;
        for (int[] in : intervals) {
            if (in[0] >= prevEnd) prevEnd = in[1];
            else removals++;
        }
        return removals;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function eraseOverlapIntervals(intervals) {
    const sorted = [...intervals].sort((a, b) => a[1] - b[1]);   // by END

    let removals = 0;
    let prevEnd = -Infinity;
    for (const [start, end] of sorted) {
        if (start >= prevEnd) prevEnd = end;   // touching is fine
        else removals++;
    }
    return removals;
}`,
            },
        ],
        followUps: [
            'Give the exchange argument for keeping the earliest finisher.',
            'Construct an input where sorting by start gives the wrong answer.',
            'Why is touching allowed here but not in Merge Intervals?',
        ],
    },

    'minimum-arrows-to-burst-balloons': {
        restate:
            'Balloons are horizontal intervals. Each vertical arrow bursts every balloon it passes through. How few arrows suffice?',
        body: `Non-overlapping Intervals in different clothing — and seeing that is the point of the pair.

**The reframing:** an arrow bursts a set of balloons that all share a common point, which means their intervals mutually overlap. So the question is *"how few groups of mutually-overlapping intervals are there?"* — the complement of "how many can I keep disjoint".

**Sort by END**, same reason as before: the earliest-ending balloon is the tightest constraint, and firing at exactly its right edge is the greedy choice that bursts the most while still guaranteeing that balloon dies.

**The algorithm:** fire an arrow at the first balloon's end. Skip every balloon that starts at or before that position — the arrow already got them. When one starts after, fire a new arrow at its end and continue.

**The exchange argument:** firing at the earliest end can never be worse. Any arrow that bursts this balloon must be at or before its end, and moving it *to* the end can only add balloons, never lose them.

**The trap: touching DOES count here.** A balloon at \`[2,3]\` is burst by an arrow at \`x = 2\`, so the skip condition is \`start <= arrowPos\`. Using \`<\` fires an extra arrow for every exactly-touching balloon. Note this is the opposite of Non-overlapping Intervals, which used \`>=\` for the same geometry — because there the question was whether two intervals *conflict*, and here it is whether one point *hits* an interval.

**The overflow trap, and it is real:** coordinates go to ±2³¹−1, so \`(a[0] + b[0]) / 2\` or a comparator returning \`a[1] - b[1]\` overflows a 32-bit int and the sort order becomes nonsense. Use \`Integer.compare\` in Java and a \`<\` comparator in C++, never subtraction.`,
        complexity: { time: 'O(n log n)', space: 'O(1) beyond the sort' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int findMinArrowShots(vector<vector<int>>& points) {
        if (points.empty()) return 0;
        // Sort by END. Use < , not subtraction: coordinates reach INT_MAX.
        sort(points.begin(), points.end(),
             [](const vector<int>& a, const vector<int>& b) { return a[1] < b[1]; });

        int arrows = 1;
        long long arrowPos = points[0][1];
        for (auto& p : points) {
            if (p[0] <= arrowPos) continue;   // <= : touching IS burst
            arrows++;
            arrowPos = p[1];
        }
        return arrows;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int findMinArrowShots(int[][] points) {
        if (points.length == 0) return 0;
        // Integer.compare, NOT a[1] - b[1] — that overflows.
        Arrays.sort(points, (a, b) -> Integer.compare(a[1], b[1]));

        int arrows = 1;
        long arrowPos = points[0][1];
        for (int[] p : points) {
            if (p[0] <= arrowPos) continue;
            arrows++;
            arrowPos = p[1];
        }
        return arrows;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function findMinArrowShots(points) {
    if (!points.length) return 0;
    const sorted = [...points].sort((a, b) => a[1] - b[1]);   // JS: no overflow

    let arrows = 1;
    let arrowPos = sorted[0][1];
    for (const [start, end] of sorted) {
        if (start <= arrowPos) continue;   // already burst by the current arrow
        arrows++;
        arrowPos = end;
    }
    return arrows;
}`,
            },
        ],
        followUps: [
            'Why does touching count here but not in Non-overlapping Intervals?',
            'What does a[1] - b[1] do when the coordinates are near INT_MAX?',
            'Relate the answer to the number of intervals you could keep disjoint.',
        ],
    },

    'interval-list-intersections': {
        restate: 'Given two sorted lists of disjoint intervals, return every intersection.',
        body: `The temptation is to merge both lists and re-sort. Do not — **both inputs are already sorted**, and throwing that away costs an unnecessary \`log\` factor.

**The observation: two pointers, one per list.** At each step you have one interval from each. Their intersection, if any, is:

\`\`\`
start = max(a.start, b.start)
end   = min(a.end,   b.end)
\`\`\`

If \`start <= end\` that is a real intersection — record it. Otherwise the two do not touch.

**Then advance the pointer whose interval ends first.** That is the only decision in the algorithm, and the reason is exact: the interval that ends earlier cannot intersect anything further along in the *other* list, because everything remaining there starts at or after the current one. It is finished; the other may still meet what comes next.

**The trap: \`max\` for the start and \`min\` for the end.** They feel backwards and they are correct — the overlap begins at the later start and finishes at the earlier end. Swapping them produces a wider, invalid range that often still passes \`start <= end\`, so it yields wrong output rather than no output.

**\`<=\`, not \`<\`.** The intervals are closed, so \`[1,2]\` and \`[2,3]\` intersect at the single point \`[2,2]\` and that is a valid answer.

**Advance on the ends, not the starts.** Comparing starts to decide which pointer moves skips intervals that could still intersect.

\`O(m + n)\` and \`O(1)\` beyond the output.`,
        complexity: { time: 'O(m + n)', space: 'O(1) beyond the output' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    vector<vector<int>> intervalIntersection(vector<vector<int>>& A,
                                             vector<vector<int>>& B) {
        vector<vector<int>> out;
        int i = 0, j = 0;

        while (i < (int)A.size() && j < (int)B.size()) {
            // MAX of starts, MIN of ends — the overlap is the tighter range.
            int start = max(A[i][0], B[j][0]);
            int end   = min(A[i][1], B[j][1]);
            if (start <= end) out.push_back({start, end});   // closed intervals

            // Advance whichever ENDS first — it can meet nothing else.
            if (A[i][1] < B[j][1]) i++;
            else j++;
        }
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int[][] intervalIntersection(int[][] A, int[][] B) {
        List<int[]> out = new ArrayList<>();
        int i = 0, j = 0;

        while (i < A.length && j < B.length) {
            int start = Math.max(A[i][0], B[j][0]);
            int end = Math.min(A[i][1], B[j][1]);
            if (start <= end) out.add(new int[]{start, end});

            if (A[i][1] < B[j][1]) i++;
            else j++;
        }
        return out.toArray(new int[0][]);
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function intervalIntersection(A, B) {
    const out = [];
    let i = 0, j = 0;

    while (i < A.length && j < B.length) {
        const start = Math.max(A[i][0], B[j][0]);
        const end = Math.min(A[i][1], B[j][1]);
        if (start <= end) out.push([start, end]);

        if (A[i][1] < B[j][1]) i++;   // this one is done
        else j++;
    }
    return out;
}`,
            },
        ],
        followUps: [
            'Why max for the start and min for the end?',
            'Why advance on ends rather than starts?',
            'Return the UNION of the two lists instead of the intersection.',
        ],
    },

    'my-calendar-i': {
        restate:
            'Book events one at a time. Reject any booking that overlaps an existing one.',
        body: `A design problem, and the interesting part is what "overlap" means precisely.

**Two intervals \`[s1,e1)\` and \`[s2,e2)\` overlap exactly when \`s1 < e2 && s2 < e1\`.** That single expression is worth memorising — it is shorter and far more reliable than enumerating the four ways two intervals can sit relative to each other, which is where people lose time and make mistakes.

**Note the intervals are half-open.** The problem states the event occupies \`[start, end)\`, so a booking ending exactly where another begins is *fine* — \`[10,20)\` and \`[20,30)\` do not conflict. The strict \`<\` in both halves of the condition is what encodes that; using \`<=\` rejects legitimate back-to-back bookings.

**The simple solution:** keep a list, scan it on every \`book\`, reject on any overlap. \`O(n)\` per call, \`O(n²)\` overall — perfectly acceptable at the stated constraints, and the right thing to write first.

**The improvement, which is what the problem is really for:** keep the bookings in a **sorted structure** and binary search for the insertion point. Only the neighbour immediately before and the one immediately after can possibly conflict — everything else is too far away. That gives \`O(log n)\` lookup.

In C++ a \`std::map\` from start to end plus \`upper_bound\` does it; in Java a \`TreeMap\` with \`floorKey\`/\`ceilingKey\`. JavaScript has no ordered map, so a sorted array with a hand-written binary search is the honest equivalent — insertion is still \`O(n)\` from the shift, which is worth saying rather than glossing over.

**My Calendar II and III** extend this to allowing double bookings and tracking the maximum overlap, and those need a sweep-line or an interval tree.`,
        complexity: { time: 'O(log n) lookup, O(n) insert', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class MyCalendar {
    map<int, int> booked;   // start -> end, kept sorted
public:
    bool book(int start, int end) {
        // First booking starting at or after "start".
        auto next = booked.lower_bound(start);
        // Overlap test: s1 < e2 && s2 < e1, with HALF-OPEN intervals.
        if (next != booked.end() && next->first < end) return false;
        if (next != booked.begin()) {
            auto prev = prev_iterator(next);
            if (start < prev->second) return false;
        }
        booked[start] = end;
        return true;
    }
private:
    map<int, int>::iterator prev_iterator(map<int, int>::iterator it) {
        return --it;
    }
};`,
            },
            {
                lang: 'java',
                source: `class MyCalendar {
    private final TreeMap<Integer, Integer> booked = new TreeMap<>();

    public boolean book(int start, int end) {
        Integer prev = booked.floorKey(start);     // latest start <= start
        Integer next = booked.ceilingKey(start);   // earliest start >= start

        // Half-open: [10,20) and [20,30) do NOT conflict, so strict <.
        if (prev != null && booked.get(prev) > start) return false;
        if (next != null && next < end) return false;

        booked.put(start, end);
        return true;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `class MyCalendar {
    constructor() {
        this.booked = [];   // sorted by start; JS has no ordered map
    }

    book(start, end) {
        // Binary search for the insertion point.
        let lo = 0, hi = this.booked.length;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (this.booked[mid][0] < start) lo = mid + 1;
            else hi = mid;
        }

        // Only the immediate neighbours can conflict.
        const prev = this.booked[lo - 1];
        const next = this.booked[lo];
        if (prev && start < prev[1]) return false;
        if (next && next[0] < end) return false;

        this.booked.splice(lo, 0, [start, end]);   // O(n) shift
        return true;
    }
}`,
            },
        ],
        followUps: [
            'Write the overlap condition from memory. Why is it better than four cases?',
            'Why do [10,20) and [20,30) not conflict?',
            'My Calendar II allows double booking. What changes?',
        ],
    },
};
