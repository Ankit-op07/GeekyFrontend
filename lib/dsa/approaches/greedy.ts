// lib/dsa/approaches/greedy.ts
//
// "Our approach" pages for the Greedy section.
//
// Same four beats as every other approach file (brute force → why it is too
// slow → the observation → the trap); see approaches/arrays-hashing.ts for the
// house style in full.
//
// THE CODE IS NEVER THE POINT HERE. Every solution in this section is a single
// loop with one or two variables. What is being assessed is whether you can
// ARGUE THE LOOP IS CORRECT — because a greedy algorithm that looks reasonable
// and is wrong produces plausible answers on small inputs, and there is no
// stack trace to tell you.
//
// THE ARGUMENT HAS A STANDARD SHAPE — the exchange argument:
//
//   Take any optimal solution that does NOT make the greedy choice. Show you
//   can swap in the greedy choice without making the answer worse. Therefore
//   some optimal solution DOES make it, and taking it is safe.
//
// Every page below states its version of that sentence explicitly. If you
// cannot produce one for a problem, that is strong evidence greedy is the wrong
// tool and you want DP — Coin Change in the DP-1D section is exactly that
// counterexample, and it is worth having ready.
//
// WHY THESE EIGHT ARE TOGETHER: they look unrelated and share one skeleton —
// walk forward once, keep a running "best so far" or "furthest reachable", and
// never look back. Maximum Subarray and Jump Game are the same loop with a
// different quantity.

import type { DsaApproach } from '../types';

export const greedyApproaches: Record<string, DsaApproach> = {
    'maximum-subarray': {
        restate: 'The largest sum of any contiguous subarray. At least one element must be taken.',
        body: `Every subarray is \`O(n²)\`, and summing each is another factor. **Kadane's algorithm** does it in one pass.

**The observation:** walk forward carrying the best sum of a subarray *ending here*. At each element you have exactly two choices — extend the previous run, or start fresh at this element:

\`\`\`
cur = max(nums[i], cur + nums[i])
\`\`\`

**The greedy argument:** if the running sum ever goes negative, it can only hurt whatever follows — dropping it and starting fresh is never worse. That is the exchange argument in one line, and it is what makes "never look back" safe here.

Equivalently: \`if (cur < 0) cur = 0\` before adding. Both forms are the same algorithm; the \`max\` version handles the all-negative case without a special branch, which is why it is the one to write.

**The trap: initialise \`best\` to \`nums[0]\`, not 0.** An all-negative array has a negative answer — the least-bad single element — and a 0 seed reports 0, which is not a valid subarray at all. This is the single most common wrong submission here, and it passes every test with a positive number in it.

**Track \`best\` separately from \`cur\`.** The maximum can occur mid-array and then be destroyed by later negatives; returning the final \`cur\` gives the sum of the last run.

**The follow-up interviewers ask:** return the subarray's bounds. Record the start whenever you restart, and capture start/end whenever \`best\` improves.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int best = nums[0], cur = nums[0];   // NOT 0: all-negative is valid
        for (int i = 1; i < (int)nums.size(); i++) {
            // Extend the run, or abandon it and start here.
            cur = max(nums[i], cur + nums[i]);
            best = max(best, cur);           // the peak may be mid-array
        }
        return best;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int maxSubArray(int[] nums) {
        int best = nums[0], cur = nums[0];
        for (int i = 1; i < nums.length; i++) {
            cur = Math.max(nums[i], cur + nums[i]);
            best = Math.max(best, cur);
        }
        return best;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function maxSubArray(nums) {
    let best = nums[0], cur = nums[0];
    for (let i = 1; i < nums.length; i++) {
        cur = Math.max(nums[i], cur + nums[i]);
        best = Math.max(best, cur);
    }
    return best;
}`,
            },
        ],
        followUps: [
            'What does an all-negative array return if best starts at 0?',
            'Return the subarray bounds, not just the sum.',
            'Maximum Sum Circular Subarray (Leetcode 918).',
        ],
    },

    'jump-game': {
        restate: 'Each value is the maximum jump length from that index. Can you reach the last index?',
        body: `DP works — \`dp[i]\` = "is index i reachable" — and is \`O(n²)\` because each index scans everything before it. Greedy makes it \`O(n)\` and one variable.

**The observation:** you do not need to know *how* you reach an index, only whether you can. So track a single number: the **furthest index reachable so far**.

Walk forward. If the current index is beyond \`furthest\`, there is a gap you can never cross — return false. Otherwise extend: \`furthest = max(furthest, i + nums[i])\`. Reaching the end means success.

**The greedy argument:** reachability is monotone — if you can reach index \`i\`, you can reach everything up to it too, because you can always jump *shorter* than the maximum. So one number captures the entire reachable set, and there is nothing to reconsider.

**The neat variant, worth knowing:** walk *backwards* tracking the leftmost index from which the end is reachable. Start with \`goal = n-1\`; whenever \`i + nums[i] >= goal\`, set \`goal = i\`. The answer is \`goal == 0\`. Some find this easier to justify, since it is literally "can I get to a place that gets to the end".

**The trap:** check reachability *before* extending. Testing \`i > furthest\` after updating means the current index extends the reach it was supposed to be blocked by, and \`[0, 1]\` wrongly returns true.

A single-element array is trivially true — you are already at the end.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    bool canJump(vector<int>& nums) {
        int furthest = 0;
        for (int i = 0; i < (int)nums.size(); i++) {
            if (i > furthest) return false;      // CHECK before extending
            furthest = max(furthest, i + nums[i]);
        }
        return true;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public boolean canJump(int[] nums) {
        int furthest = 0;
        for (int i = 0; i < nums.length; i++) {
            if (i > furthest) return false;
            furthest = Math.max(furthest, i + nums[i]);
        }
        return true;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function canJump(nums) {
    let furthest = 0;
    for (let i = 0; i < nums.length; i++) {
        if (i > furthest) return false;   // an uncrossable gap
        furthest = Math.max(furthest, i + nums[i]);
    }
    return true;
}`,
            },
        ],
        followUps: [
            'Why is one number enough to represent everything reachable?',
            'Write the backwards version. Which argument is easier to state?',
            'What does [0, 1] return if you check after extending?',
        ],
    },

    'jump-game-ii': {
        restate: 'The same array, but return the MINIMUM number of jumps to reach the end. It is always reachable.',
        body: `"Fewest steps" is a shortest-path question, and reading it that way is what makes the greedy solution obvious rather than magical.

**The observation: this is BFS by levels, on an array.** Level 0 is index 0. Level 1 is everything reachable in one jump. Level 2 is everything reachable from *any* of those, and so on. The answer is the level containing the last index — exactly what BFS computes — and you never need a queue, because each level is a contiguous range of indices.

So track the current level's boundary and the furthest index the current level can reach:

- Extend \`farthest\` with \`i + nums[i]\` as you scan.
- When \`i\` hits \`currentEnd\`, the level is exhausted: increment the jump count and set \`currentEnd = farthest\`.

**The greedy argument:** within a level, which specific index you jump from does not matter — only how far the level collectively reaches. Taking the maximum is therefore safe, and that is why no backtracking is needed.

**The trap: loop to \`n - 2\`, not \`n - 1\`.** If the loop reaches the final index and it happens to equal \`currentEnd\`, you increment the counter once more for a jump you never take, and every answer is one too high. The last index is the destination, not a departure point.

**No reachability check** — the problem guarantees the end is reachable, so the \`i > furthest\` test from Jump Game is unnecessary here. Say you noticed the guarantee rather than silently dropping the check.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int jump(vector<int>& nums) {
        int jumps = 0, currentEnd = 0, farthest = 0;
        // n-1, NOT n: the last index is the destination, never a departure.
        for (int i = 0; i < (int)nums.size() - 1; i++) {
            farthest = max(farthest, i + nums[i]);
            if (i == currentEnd) {        // this BFS level is exhausted
                jumps++;
                currentEnd = farthest;
            }
        }
        return jumps;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int jump(int[] nums) {
        int jumps = 0, currentEnd = 0, farthest = 0;
        for (int i = 0; i < nums.length - 1; i++) {
            farthest = Math.max(farthest, i + nums[i]);
            if (i == currentEnd) {
                jumps++;
                currentEnd = farthest;
            }
        }
        return jumps;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function jump(nums) {
    let jumps = 0, currentEnd = 0, farthest = 0;
    for (let i = 0; i < nums.length - 1; i++) {
        farthest = Math.max(farthest, i + nums[i]);
        if (i === currentEnd) {   // level boundary: one more jump
            jumps++;
            currentEnd = farthest;
        }
    }
    return jumps;
}`,
            },
        ],
        followUps: [
            'Why does the loop stop at n-2? What is the off-by-one symptom?',
            'Explain the BFS-level framing. Where is the queue?',
            'Return the actual sequence of indices jumped to.',
        ],
    },

    'gas-station': {
        restate:
            'Circular route of stations. Can you complete a lap, and from which station? Return -1 if impossible.',
        body: `Trying every start is \`O(n²)\`. Two observations reduce it to one pass.

**First — feasibility is a total.** If \`sum(gas) < sum(cost)\`, no start works: you cannot manufacture fuel. If \`sum(gas) >= sum(cost)\`, a valid start is **guaranteed to exist**. So the question is not *whether* but *where*, and you can answer the first part before searching at all.

**Second — the greedy argument, and this is the real content.** Suppose you start at \`A\` and run dry arriving at \`B\`. Then **no station between A and B works either.** Any such station \`C\` was reached from \`A\` with a non-negative tank, so starting at \`C\` gives you *less* fuel at every point than the run from \`A\` did — and that run already failed. So skip past \`B\` entirely and restart there.

That is what collapses \`O(n²)\` to \`O(n)\`: a failure eliminates a whole range of candidates, not just one.

**The implementation:** carry a running tank. When it goes negative, reset it to 0 and set the candidate start to \`i + 1\`. After one pass, if the totals allowed a solution, the surviving candidate is it.

**The trap: keep the total and the running tank as separate variables.** The total decides feasibility over the whole array; the running tank decides where to restart. Merging them means a reset destroys the feasibility information and you return -1 on solvable inputs.

**Why one pass suffices** despite the route being circular: the guarantee from step one means the surviving candidate must work, so there is no need to wrap around and verify.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int canCompleteCircuit(vector<int>& gas, vector<int>& cost) {
        int total = 0, tank = 0, start = 0;

        for (int i = 0; i < (int)gas.size(); i++) {
            int diff = gas[i] - cost[i];
            total += diff;      // feasibility over the WHOLE loop
            tank += diff;       // separate: decides where to restart
            if (tank < 0) {
                // Nothing from "start" through i can work — skip past all of it.
                start = i + 1;
                tank = 0;
            }
        }
        return total < 0 ? -1 : start;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int canCompleteCircuit(int[] gas, int[] cost) {
        int total = 0, tank = 0, start = 0;

        for (int i = 0; i < gas.length; i++) {
            int diff = gas[i] - cost[i];
            total += diff;
            tank += diff;
            if (tank < 0) {
                start = i + 1;
                tank = 0;
            }
        }
        return total < 0 ? -1 : start;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function canCompleteCircuit(gas, cost) {
    let total = 0, tank = 0, start = 0;

    for (let i = 0; i < gas.length; i++) {
        const diff = gas[i] - cost[i];
        total += diff;
        tank += diff;
        if (tank < 0) {      // every start in [start, i] fails too
            start = i + 1;
            tank = 0;
        }
    }
    return total < 0 ? -1 : start;
}`,
            },
        ],
        followUps: [
            'Prove that no station between A and B can work if A runs dry at B.',
            'Why does a non-negative total guarantee a solution exists?',
            'What breaks if total and tank are the same variable?',
        ],
    },

    'hand-of-straights': {
        restate:
            'Can the hand be split entirely into groups of exactly groupSize consecutive cards?',
        body: `**The observation: the smallest remaining card has no choice.** It cannot be the middle or end of a group — nothing smaller exists to sit before it — so it must be the *start* of one. That forces the group entirely: \`x, x+1, …, x+groupSize-1\`.

Take that group, remove those cards, and repeat with the new smallest. There is never a decision to make, which is why greedy is not merely safe here but the only possible strategy.

**The implementation:** count the cards, then repeatedly take the smallest remaining and remove one of each of the next \`groupSize-1\` values. If any is missing or exhausted, return false. A sorted map or a min-heap over the distinct values keeps "the smallest remaining" cheap.

**Two instant rejections.** If \`n % groupSize != 0\` the cards cannot divide evenly — check it first and skip everything else. And a \`groupSize\` of 1 always succeeds.

**Two traps.**

**Decrement counts and erase keys that hit zero**, or the "smallest remaining" lookup keeps returning a value with nothing left, and the loop never terminates. Same discipline as Fruit Into Baskets.

**Iterate over distinct values, not over the raw array.** Duplicates are handled by the counts; re-processing them makes the work quadratic.

Sorting first and using an ordered map is \`O(n log n)\`, dominated by the sort. That is the expected complexity — the greedy is not the bottleneck.`,
        complexity: { time: 'O(n log n)', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    bool isNStraightHand(vector<int>& hand, int groupSize) {
        if (hand.size() % groupSize != 0) return false;   // cannot divide evenly

        map<int, int> count;                 // ordered: begin() is the smallest
        for (int c : hand) count[c]++;

        while (!count.empty()) {
            int start = count.begin()->first;   // smallest card MUST start a group
            for (int c = start; c < start + groupSize; c++) {
                auto it = count.find(c);
                if (it == count.end()) return false;
                if (--it->second == 0) count.erase(it);    // ERASE at zero
            }
        }
        return true;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public boolean isNStraightHand(int[] hand, int groupSize) {
        if (hand.length % groupSize != 0) return false;

        TreeMap<Integer, Integer> count = new TreeMap<>();
        for (int c : hand) count.merge(c, 1, Integer::sum);

        while (!count.isEmpty()) {
            int start = count.firstKey();
            for (int c = start; c < start + groupSize; c++) {
                Integer have = count.get(c);
                if (have == null) return false;
                if (have == 1) count.remove(c);
                else count.put(c, have - 1);
            }
        }
        return true;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function isNStraightHand(hand, groupSize) {
    if (hand.length % groupSize !== 0) return false;

    const count = new Map();
    for (const c of hand) count.set(c, (count.get(c) || 0) + 1);

    // Sorted distinct values; each is only ever a group start once.
    const keys = [...count.keys()].sort((a, b) => a - b);

    for (const start of keys) {
        const need = count.get(start);
        if (!need) continue;                       // already consumed
        for (let c = start; c < start + groupSize; c++) {
            const have = count.get(c);
            if (!have || have < need) return false;
            count.set(c, have - need);
        }
    }
    return true;
}`,
            },
        ],
        followUps: [
            'Why must the smallest remaining card start a group?',
            'What happens if you do not remove zero-count keys?',
            'Divide Array in Sets of K Consecutive Numbers (Leetcode 1296) — identical problem.',
        ],
    },

    'partition-labels': {
        restate:
            'Split the string into the most parts possible, such that each letter appears in only one part.',
        body: `**The observation:** if a letter appears in a part, that part must extend at least to that letter's **last occurrence**. So precompute the final index of every character, then sweep.

Walk the string carrying \`end\` — the furthest last-occurrence seen so far in the current part. When the cursor reaches \`end\`, nothing inside can appear later, so the part closes there.

Two passes: one to record last occurrences (26 entries), one to sweep.

**The greedy argument:** closing a part as early as legally possible can never reduce the total number of parts. Extending a part further would only merge it with what follows, and merging cannot increase a count. That is the exchange argument, and it is why "close at the first legal moment" maximises the number of parts.

**The trap:** \`end\` is a running **maximum**, not just the current character's last index. Setting \`end = last[c]\` rather than taking the max lets a later character with an *earlier* last occurrence shrink the part, splitting in the middle of a letter's range. This is the bug, and it produces output that still sums to the string length — so the totals check passes.

**Compute the part length as \`i - start + 1\`**, and reset \`start = i + 1\` after closing.

Alphabet is fixed at 26 lowercase letters, so the last-occurrence table is \`O(1)\` space.`,
        complexity: { time: 'O(n)', space: 'O(1) — 26 entries' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    vector<int> partitionLabels(string s) {
        int last[26];
        for (int i = 0; i < (int)s.size(); i++) last[s[i] - 'a'] = i;

        vector<int> out;
        int start = 0, end = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            end = max(end, last[s[i] - 'a']);   // running MAX, not assignment
            if (i == end) {                      // nothing inside reaches further
                out.push_back(i - start + 1);
                start = i + 1;
            }
        }
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public List<Integer> partitionLabels(String s) {
        int[] last = new int[26];
        for (int i = 0; i < s.length(); i++) last[s.charAt(i) - 'a'] = i;

        List<Integer> out = new ArrayList<>();
        int start = 0, end = 0;
        for (int i = 0; i < s.length(); i++) {
            end = Math.max(end, last[s.charAt(i) - 'a']);
            if (i == end) {
                out.add(i - start + 1);
                start = i + 1;
            }
        }
        return out;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function partitionLabels(s) {
    const last = new Map();
    for (let i = 0; i < s.length; i++) last.set(s[i], i);

    const out = [];
    let start = 0, end = 0;
    for (let i = 0; i < s.length; i++) {
        end = Math.max(end, last.get(s[i]));
        if (i === end) {          // close at the earliest legal moment
            out.push(i - start + 1);
            start = i + 1;
        }
    }
    return out;
}`,
            },
        ],
        followUps: [
            'Why does closing early MAXIMISE the number of parts?',
            'What breaks if end is assigned rather than maxed?',
            'Return the substrings themselves rather than their lengths.',
        ],
    },

    'merge-triplets-to-form-target': {
        restate:
            'Merging two triplets takes the element-wise maximum. Can repeated merges produce the target exactly?',
        body: `The merge operation only ever takes maxima, which means **a value can never decrease**. Two consequences follow, and together they are the whole solution.

**First — some triplets are poison.** If a triplet has *any* component exceeding the target's, merging it in permanently overshoots there, and nothing later can bring it back down. Discard those triplets entirely; they can never appear in a valid sequence of merges.

**Second — among the survivors, merging is free.** Every remaining triplet has all three components \`<=\` the target, so merging any of them can only move values *toward* the target and never past it. There is no trade-off to reason about, so merge all of them.

That reduces the problem to a checklist: after discarding the poison triplets, does some survivor supply the exact target value in position 0? Position 1? Position 2? If all three are covered, the answer is yes.

**The trap: the three positions may come from three different triplets**, and usually do. Looking for one triplet matching two or three components at once is far too strict and rejects valid inputs — this is the misreading that makes the problem look harder than it is. Track three independent booleans.

**Order is irrelevant.** Max is commutative and associative, so no sequencing decision exists and there is nothing to search over.

One pass, three flags, \`O(1)\` space.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    bool mergeTriplets(vector<vector<int>>& triplets, vector<int>& target) {
        bool got0 = false, got1 = false, got2 = false;

        for (auto& t : triplets) {
            // Any component over target is poison — max can never come back down.
            if (t[0] > target[0] || t[1] > target[1] || t[2] > target[2]) continue;

            // The three matches may come from three DIFFERENT triplets.
            if (t[0] == target[0]) got0 = true;
            if (t[1] == target[1]) got1 = true;
            if (t[2] == target[2]) got2 = true;
        }
        return got0 && got1 && got2;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public boolean mergeTriplets(int[][] triplets, int[] target) {
        boolean got0 = false, got1 = false, got2 = false;

        for (int[] t : triplets) {
            if (t[0] > target[0] || t[1] > target[1] || t[2] > target[2]) continue;
            if (t[0] == target[0]) got0 = true;
            if (t[1] == target[1]) got1 = true;
            if (t[2] == target[2]) got2 = true;
        }
        return got0 && got1 && got2;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function mergeTriplets(triplets, target) {
    let got0 = false, got1 = false, got2 = false;

    for (const t of triplets) {
        if (t[0] > target[0] || t[1] > target[1] || t[2] > target[2]) continue;
        if (t[0] === target[0]) got0 = true;
        if (t[1] === target[1]) got1 = true;
        if (t[2] === target[2]) got2 = true;
    }
    return got0 && got1 && got2;
}`,
            },
        ],
        followUps: [
            'Why can a triplet with any oversized component never be used?',
            'Why is it safe to merge every surviving triplet?',
            'Construct an input where the three matches come from three different triplets.',
        ],
    },

    'valid-parenthesis-string': {
        restate:
            'A string of `(`, `)` and `*`, where `*` may be `(`, `)` or empty. Can it be a valid parenthesis string?',
        body: `Backtracking over the three meanings of every \`*\` is \`O(3ⁿ)\`. DP is \`O(n²)\`. Greedy is one pass and two integers, and it is genuinely elegant.

**The observation: track a RANGE of possible open-bracket counts**, not a single value. Because \`*\` is ambiguous, after each character the count is not one number but an interval — \`[lo, hi]\`, the minimum and maximum number of unclosed brackets consistent with the string so far.

The updates are direct:

- \`(\` → both bounds rise.
- \`)\` → both bounds fall.
- \`*\` → \`lo\` falls (treat it as \`)\`) and \`hi\` rises (treat it as \`(\`), because both readings are available.

**Two rules make it correct.**

**If \`hi < 0\`, fail immediately.** Even reading every \`*\` as \`(\`, there are more closers than openers — no interpretation can recover.

**Clamp \`lo\` at 0.** A negative minimum is meaningless: you cannot have fewer than zero unclosed brackets, and the interpretation that would produce one is simply invalid rather than fatal. Forgetting the clamp lets \`lo\` drift negative and \`"(*)"\`-style inputs are wrongly rejected.

**The answer is \`lo == 0\`** at the end — some valid interpretation closed everything.

**Why greedy beats DP here:** the range collapses the entire space of interpretations into two numbers, and every interpretation between the bounds is achievable. That density is what makes it safe to discard the individuals.

**The two-pass alternative** — left-to-right treating \`*\` as \`(\`, then right-to-left treating it as \`)\` — is equivalent and some find it easier to justify.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    bool checkValidString(string s) {
        int lo = 0, hi = 0;   // range of possible unclosed '(' counts

        for (char c : s) {
            if (c == '(')      { lo++; hi++; }
            else if (c == ')') { lo--; hi--; }
            else               { lo--; hi++; }   // '*' can be ')' or '('

            if (hi < 0) return false;   // too many closers under ANY reading
            lo = max(lo, 0);            // cannot have negative open brackets
        }
        return lo == 0;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public boolean checkValidString(String s) {
        int lo = 0, hi = 0;

        for (char c : s.toCharArray()) {
            if (c == '(')      { lo++; hi++; }
            else if (c == ')') { lo--; hi--; }
            else               { lo--; hi++; }

            if (hi < 0) return false;
            lo = Math.max(lo, 0);
        }
        return lo == 0;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function checkValidString(s) {
    let lo = 0, hi = 0;

    for (const c of s) {
        if (c === '(') { lo++; hi++; }
        else if (c === ')') { lo--; hi--; }
        else { lo--; hi++; }        // '*' widens the range both ways

        if (hi < 0) return false;
        lo = Math.max(lo, 0);       // clamp: negative open count is meaningless
    }
    return lo === 0;
}`,
            },
        ],
        followUps: [
            'Why clamp lo at 0 but fail immediately on hi < 0?',
            'Is every count between lo and hi actually achievable? Why does that matter?',
            'Write the two-pass version and compare.',
        ],
    },
};
