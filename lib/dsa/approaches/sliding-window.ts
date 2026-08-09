// lib/dsa/approaches/sliding-window.ts
//
// "Our approach" pages for the Sliding Window section.
//
// Same four beats as every other approach file (brute force → why it is too
// slow → the observation → the trap); see approaches/arrays-hashing.ts for the
// house style in full.
//
// THE ONE DECISION THAT MATTERS, stated here so the pages do not each re-derive
// it: a window problem is defined by its SHRINK CONDITION, and there are only
// two shapes.
//
//   • Variable window — grow right always, shrink left WHILE the window is
//     invalid, and record the answer after shrinking. Used when the question is
//     "longest/shortest subarray such that X".
//   • Fixed window — grow right, and shrink left the moment the width exceeds
//     k. Used when the question names a size.
//
// Where a page spends its words is on which of those it is and why, because
// once that is settled the code is mechanical. Sliding Window Maximum is the
// deliberate odd one out: a fixed window whose difficulty is not the window at
// all but the structure inside it.

import type { DsaApproach } from '../types';

export const slidingWindowApproaches: Record<string, DsaApproach> = {
    'best-time-to-buy-and-sell-stock': {
        restate:
            'One buy and one sell, buy first. What is the biggest profit — or zero if every trade loses money?',
        body: `Trying every (buy, sell) pair is \`O(n²)\`. With \`n = 10⁵\` that is 5 billion pairs.

**The observation:** you are selling on day \`i\`, so the only thing you want to know about the past is the *cheapest day so far*. Not which days, not in what order — one number. And that number is trivially maintained as you walk forward.

So: one pass, carrying \`minPrice\`. At each day, first ask "what if I sold today?" — that is \`price - minPrice\` — then update \`minPrice\` for the days ahead.

You can also read it as a window whose left edge jumps to the current day whenever a new low appears, which is why it sits in this section. Both readings are the same code; the "cheapest so far" one is easier to say out loud.

**The trap is the order of the two lines.** Compute the profit *before* updating \`minPrice\`. Update first and a new low lets you sell on the same day you bought, for a profit of zero — harmless here, but the same slip in the cooldown and transaction-fee variants produces real wrong answers.

Profit starts at 0, not at \`-infinity\`: a strictly falling array means you simply do not trade.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int minPrice = INT_MAX, best = 0;
        for (int p : prices) {
            best = max(best, p - minPrice);  // sell today, BEFORE updating
            minPrice = min(minPrice, p);
        }
        return best;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int maxProfit(int[] prices) {
        int minPrice = Integer.MAX_VALUE, best = 0;
        for (int p : prices) {
            best = Math.max(best, p - minPrice);
            minPrice = Math.min(minPrice, p);
        }
        return best;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function maxProfit(prices) {
    let minPrice = Infinity, best = 0;
    for (const p of prices) {
        best = Math.max(best, p - minPrice);
        minPrice = Math.min(minPrice, p);
    }
    return best;
}`,
            },
        ],
        followUps: [
            'Unlimited transactions (Leetcode 122). Why does greedy suddenly work?',
            'At most two transactions (Leetcode 123) — this is where it stops being a one-liner.',
            'Return the buy and sell days, not just the profit.',
        ],
    },

    'longest-substring-without-repeating': {
        restate: 'The longest stretch of the string in which no character repeats.',
        body: `Checking every substring for uniqueness is \`O(n³)\`, or \`O(n²)\` if you extend one character at a time.

**The observation:** if \`s[l..r]\` has a duplicate, then *every* window starting at \`l\` and ending past \`r\` also has it. So there is never a reason to move \`l\` back — which is exactly the condition that makes a sliding window legal.

Grow \`r\` one character at a time, keeping a set of what is inside. When the incoming character is already present, shrink from the left — removing characters until the duplicate is gone — then record the length. Each character enters and leaves the set at most once, so this is \`O(n)\` despite the nested loop.

**The faster variant, and the trap inside it:** instead of a set, store each character's *last index* and jump \`l\` straight past it. That turns the shrink loop into one assignment — but only if you write

\`\`\`
l = max(l, lastIndex[c] + 1)
\`\`\`

The \`max\` is not optional. Without it, a repeat that lies *behind* the current left edge drags \`l\` backwards, the window silently re-admits characters it had already dropped, and \`"abba"\` returns 3 instead of 2. It is the single most common bug in this problem, and it passes the obvious test cases.`,
        complexity: { time: 'O(n)', space: 'O(min(n, alphabet))' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        vector<int> last(128, -1);   // char -> last index seen
        int best = 0, l = 0;
        for (int r = 0; r < s.size(); r++) {
            // max() is essential: a repeat BEHIND l must not pull l backwards.
            l = max(l, last[s[r]] + 1);
            last[s[r]] = r;
            best = max(best, r - l + 1);
        }
        return best;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        int[] last = new int[128];
        Arrays.fill(last, -1);
        int best = 0, l = 0;
        for (int r = 0; r < s.length(); r++) {
            char c = s.charAt(r);
            l = Math.max(l, last[c] + 1);
            last[c] = r;
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function lengthOfLongestSubstring(s) {
    const last = new Map(); // char -> last index seen
    let best = 0, l = 0;
    for (let r = 0; r < s.length; r++) {
        const c = s[r];
        if (last.has(c)) l = Math.max(l, last.get(c) + 1);
        last.set(c, r);
        best = Math.max(best, r - l + 1);
    }
    return best;
}`,
            },
        ],
        followUps: [
            'Walk through "abba" without the max(). Where exactly does it go wrong?',
            'At most K distinct characters instead of zero repeats.',
            'Return the substring itself rather than its length.',
        ],
    },

    'longest-repeating-character-replacement': {
        restate:
            'The longest window you can make all-one-character by replacing at most k of its characters.',
        body: `A window is usable when the characters you would have to replace fit in the budget:

\`\`\`
windowLength - countOfMostCommonCharacter <= k
\`\`\`

Keep the character counts as the window grows. If that condition breaks, shrink from the left until it holds again. Record the best length. That is the whole algorithm — the interesting part is one line you can leave out.

**The observation that makes it O(n):** you never need to recompute the most-common count when shrinking. It only matters when it *grows*, because a window is only ever recorded as an improvement when it gets longer, and getting longer requires a higher max count. Letting \`maxCount\` drift stale is not a bug — it can make the condition too strict for a moment, which shrinks a window that might have been valid, but that window could never have beaten the best already recorded.

If that argument does not sit right, recompute the max from the 26 counts on every step. It is \`O(26n)\` — still linear, still fast enough, and much easier to defend under pressure. Say which one you are doing and why.

**The trap:** the answer is the window *length*, not the count of any character, and it is recorded after shrinking, not before.`,
        complexity: { time: 'O(n)', space: 'O(1) — 26 counters' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int characterReplacement(string s, int k) {
        int count[26] = {0};
        int l = 0, maxCount = 0, best = 0;

        for (int r = 0; r < s.size(); r++) {
            maxCount = max(maxCount, ++count[s[r] - 'A']);
            // Replacements needed = width - most common. Shrink while over budget.
            while ((r - l + 1) - maxCount > k) {
                count[s[l] - 'A']--;
                l++;
            }
            best = max(best, r - l + 1);
        }
        return best;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int characterReplacement(String s, int k) {
        int[] count = new int[26];
        int l = 0, maxCount = 0, best = 0;

        for (int r = 0; r < s.length(); r++) {
            maxCount = Math.max(maxCount, ++count[s.charAt(r) - 'A']);
            while ((r - l + 1) - maxCount > k) {
                count[s.charAt(l) - 'A']--;
                l++;
            }
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function characterReplacement(s, k) {
    const count = new Array(26).fill(0);
    let l = 0, maxCount = 0, best = 0;

    for (let r = 0; r < s.length; r++) {
        const i = s.charCodeAt(r) - 65;
        count[i]++;
        maxCount = Math.max(maxCount, count[i]);
        while (r - l + 1 - maxCount > k) {
            count[s.charCodeAt(l) - 65]--;
            l++;
        }
        best = Math.max(best, r - l + 1);
    }
    return best;
}`,
            },
        ],
        followUps: [
            'Why is it safe never to decrease maxCount? Argue it, do not just assert it.',
            'What if the string could contain any Unicode character?',
            'Longest subarray of 1s after flipping at most k zeroes — that is Max Consecutive Ones III, next but one in this section.',
        ],
    },

    'permutation-in-string': {
        restate: 'Does s2 contain a contiguous block that is some rearrangement of s1?',
        body: `A permutation of \`s1\` is exactly: a substring of length \`s1.length\` whose character counts match \`s1\`'s. Order inside the block is irrelevant, which is what makes this a counting problem rather than a matching one.

Because the length is **fixed**, this is the fixed-window shape, not the grow-and-shrink one. Slide a window of exactly \`n1\` characters across \`s2\`: add the entering character, remove the leaving one, compare counts.

**The observation that removes the comparison:** re-comparing 26 counters at every position is \`O(26n)\` — fine, but there is a neater invariant. Track a single number, \`matches\`, counting how many of the 26 letters currently have *equal* counts in the window and in \`s1\`. When \`matches == 26\`, you have a permutation. Each character added or removed changes exactly one letter's count, so it can only push that letter into or out of agreement — an \`O(1)\` update.

**The trap in that update:** check the transition, not the state. After changing a count, the letter either just *became* equal (\`matches++\`) or just *stopped being* equal (\`matches--\`). Comparing before and after is what gets this right; recomputing "is it equal now?" alone loses the decrement.

If \`s1\` is longer than \`s2\`, return false immediately — otherwise the first window never fills and the counts are nonsense.`,
        complexity: { time: 'O(n1 + n2)', space: 'O(1) — 26 counters' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    bool checkInclusion(string s1, string s2) {
        if (s1.size() > s2.size()) return false;

        int need[26] = {0}, window[26] = {0};
        for (char c : s1) need[c - 'a']++;
        for (int i = 0; i < s1.size(); i++) window[s2[i] - 'a']++;

        int matches = 0;
        for (int i = 0; i < 26; i++) if (need[i] == window[i]) matches++;

        for (int r = s1.size(); r < s2.size(); r++) {
            if (matches == 26) return true;

            int in = s2[r] - 'a';
            window[in]++;
            // Check the TRANSITION, not just the new state.
            if (window[in] == need[in]) matches++;
            else if (window[in] == need[in] + 1) matches--;

            int out = s2[r - s1.size()] - 'a';
            window[out]--;
            if (window[out] == need[out]) matches++;
            else if (window[out] == need[out] - 1) matches--;
        }
        return matches == 26;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public boolean checkInclusion(String s1, String s2) {
        int n1 = s1.length(), n2 = s2.length();
        if (n1 > n2) return false;

        int[] need = new int[26], window = new int[26];
        for (char c : s1.toCharArray()) need[c - 'a']++;
        for (int i = 0; i < n1; i++) window[s2.charAt(i) - 'a']++;

        int matches = 0;
        for (int i = 0; i < 26; i++) if (need[i] == window[i]) matches++;

        for (int r = n1; r < n2; r++) {
            if (matches == 26) return true;

            int in = s2.charAt(r) - 'a';
            window[in]++;
            if (window[in] == need[in]) matches++;
            else if (window[in] == need[in] + 1) matches--;

            int out = s2.charAt(r - n1) - 'a';
            window[out]--;
            if (window[out] == need[out]) matches++;
            else if (window[out] == need[out] - 1) matches--;
        }
        return matches == 26;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function checkInclusion(s1, s2) {
    const n1 = s1.length, n2 = s2.length;
    if (n1 > n2) return false;

    const need = new Array(26).fill(0);
    const window = new Array(26).fill(0);
    const idx = (c) => c.charCodeAt(0) - 97;

    for (const c of s1) need[idx(c)]++;
    for (let i = 0; i < n1; i++) window[idx(s2[i])]++;

    let matches = 0;
    for (let i = 0; i < 26; i++) if (need[i] === window[i]) matches++;

    for (let r = n1; r < n2; r++) {
        if (matches === 26) return true;

        const inC = idx(s2[r]);
        window[inC]++;
        if (window[inC] === need[inC]) matches++;
        else if (window[inC] === need[inC] + 1) matches--;

        const outC = idx(s2[r - n1]);
        window[outC]--;
        if (window[outC] === need[outC]) matches++;
        else if (window[outC] === need[outC] - 1) matches--;
    }
    return matches === 26;
}`,
            },
        ],
        followUps: [
            'Return every starting index instead of a boolean (Leetcode 438, Find All Anagrams).',
            'Why is this a FIXED window while Longest Substring is a variable one?',
        ],
    },

    'minimum-window-substring': {
        restate:
            'The shortest substring of s containing every character of t, counting duplicates.',
        body: `The hardest problem in the section, and the one where the generic window template earns its keep.

Two maps: what you \`need\` (from \`t\`), and what the window currently \`has\`. Grow \`r\`. Whenever a character reaches the count \`t\` requires, one more requirement is satisfied — track that as \`formed\`, against a target of \`required\` (the number of **distinct** characters in \`t\`).

Once \`formed == required\` the window is valid, and here the direction flips: because you want the *shortest* valid window rather than the longest, you record the answer **and then shrink** while it stays valid. That inversion is the whole difference from every other problem in this section, and it is worth saying explicitly in an interview — the same skeleton, run in the other direction.

**Three traps, all of which produce a plausible wrong answer:**

\`required\` counts **distinct** characters in \`t\`, not \`t.length\`. For \`t = "AABC"\` it is 3. Using the length means the window never validates.

Increment \`formed\` only on the exact transition \`has[c] == need[c]\`. Using \`>=\` counts a character several times and validates early.

When shrinking, decrement \`formed\` only when the count drops *below* what is needed. A window holding three \`A\`s where two are required can lose one and still be valid.

Each pointer moves forward at most \`n\` times, so despite the nested loop this is \`O(n)\`.`,
        complexity: { time: 'O(n + m)', space: 'O(alphabet)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    string minWindow(string s, string t) {
        if (t.empty() || s.size() < t.size()) return "";

        unordered_map<char, int> need, have;
        for (char c : t) need[c]++;

        int required = need.size();   // DISTINCT chars, not t.size()
        int formed = 0, l = 0;
        int bestLen = INT_MAX, bestStart = 0;

        for (int r = 0; r < s.size(); r++) {
            char c = s[r];
            if (need.count(c) && ++have[c] == need[c]) formed++;  // exact ==

            // Valid: record, then shrink. Shortest, so the loop runs INSIDE.
            while (formed == required) {
                if (r - l + 1 < bestLen) {
                    bestLen = r - l + 1;
                    bestStart = l;
                }
                char out = s[l++];
                if (need.count(out) && --have[out] < need[out]) formed--;
            }
        }
        return bestLen == INT_MAX ? "" : s.substr(bestStart, bestLen);
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public String minWindow(String s, String t) {
        if (t.isEmpty() || s.length() < t.length()) return "";

        Map<Character, Integer> need = new HashMap<>(), have = new HashMap<>();
        for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);

        int required = need.size();
        int formed = 0, l = 0, bestLen = Integer.MAX_VALUE, bestStart = 0;

        for (int r = 0; r < s.length(); r++) {
            char c = s.charAt(r);
            if (need.containsKey(c)) {
                have.merge(c, 1, Integer::sum);
                if (have.get(c).intValue() == need.get(c).intValue()) formed++;
            }

            while (formed == required) {
                if (r - l + 1 < bestLen) {
                    bestLen = r - l + 1;
                    bestStart = l;
                }
                char out = s.charAt(l++);
                if (need.containsKey(out)) {
                    have.merge(out, -1, Integer::sum);
                    if (have.get(out) < need.get(out)) formed--;
                }
            }
        }
        return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestStart, bestStart + bestLen);
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function minWindow(s, t) {
    if (!t || s.length < t.length) return "";

    const need = new Map(), have = new Map();
    for (const c of t) need.set(c, (need.get(c) || 0) + 1);

    const required = need.size;
    let formed = 0, l = 0, bestLen = Infinity, bestStart = 0;

    for (let r = 0; r < s.length; r++) {
        const c = s[r];
        if (need.has(c)) {
            have.set(c, (have.get(c) || 0) + 1);
            if (have.get(c) === need.get(c)) formed++;
        }

        while (formed === required) {
            if (r - l + 1 < bestLen) {
                bestLen = r - l + 1;
                bestStart = l;
            }
            const out = s[l++];
            if (need.has(out)) {
                have.set(out, have.get(out) - 1);
                if (have.get(out) < need.get(out)) formed--;
            }
        }
    }
    return bestLen === Infinity ? "" : s.slice(bestStart, bestStart + bestLen);
}`,
            },
        ],
        followUps: [
            'Why does the shrink loop sit inside the outer loop here, but the record step come after shrinking in the "longest" problems?',
            'Prove this is O(n) even though there is a while loop inside a for loop.',
            'What if t may contain characters outside the ASCII range?',
        ],
    },

    'sliding-window-maximum': {
        restate: 'For every window of width k, report the largest value inside it.',
        body: `Rescanning each window is \`O(nk)\`. A max-heap gets it to \`O(n log n)\` but needs lazy deletion, because you cannot remove an arbitrary element that has fallen out of the window.

**The observation:** if \`nums[i] <= nums[j]\` and \`i < j\`, then \`nums[i]\` can never be the answer again. Any future window containing \`i\` also contains \`j\` — \`j\` is nearer the right edge — and \`j\` is at least as large. So \`i\` is permanently dominated and can be discarded the moment \`j\` arrives.

Keep a **deque of indices** whose values are strictly decreasing. For each new index:

1. Pop from the **back** while the value there is \`<=\` the incoming one. Those are the dominated ones.
2. Push the new index.
3. Pop from the **front** if it has scrolled out of the window (\`front <= r - k\`).
4. Once the first full window exists, the front is the maximum.

Every index is pushed once and popped once, so it is \`O(n)\` overall — despite the inner while loop, which is the same amortisation argument as Longest Consecutive Sequence.

**Two traps.** Store **indices, not values** — you cannot tell whether a value has left the window without knowing where it came from. And start emitting only once \`r >= k - 1\`; before that the window is not yet full and the front is the max of a partial window.`,
        complexity: { time: 'O(n)', space: 'O(k)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    vector<int> maxSlidingWindow(vector<int>& nums, int k) {
        deque<int> dq;              // INDICES, values strictly decreasing
        vector<int> out;

        for (int r = 0; r < nums.size(); r++) {
            // Anything smaller than the incoming value is permanently dominated.
            while (!dq.empty() && nums[dq.back()] <= nums[r]) dq.pop_back();
            dq.push_back(r);

            if (dq.front() <= r - k) dq.pop_front();   // scrolled out
            if (r >= k - 1) out.push_back(nums[dq.front()]);
        }
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) {
        Deque<Integer> dq = new ArrayDeque<>();
        int[] out = new int[nums.length - k + 1];
        int idx = 0;

        for (int r = 0; r < nums.length; r++) {
            while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[r]) dq.pollLast();
            dq.addLast(r);

            if (dq.peekFirst() <= r - k) dq.pollFirst();
            if (r >= k - 1) out[idx++] = nums[dq.peekFirst()];
        }
        return out;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function maxSlidingWindow(nums, k) {
    const dq = [];   // indices; nums[dq[0]] is the window max
    const out = [];

    for (let r = 0; r < nums.length; r++) {
        while (dq.length && nums[dq[dq.length - 1]] <= nums[r]) dq.pop();
        dq.push(r);

        if (dq[0] <= r - k) dq.shift();
        if (r >= k - 1) out.push(nums[dq[0]]);
    }
    return out;
}`,
            },
        ],
        followUps: [
            'Why store indices rather than values?',
            'Prove the O(n) bound given the inner while loop.',
            'Report the window MINIMUM instead — what single character changes?',
            'Sliding Window Median. Why does the deque trick stop working?',
        ],
    },

    'max-consecutive-ones-iii': {
        restate:
            'The longest run of 1s you can get in a binary array by flipping at most k zeroes.',
        body: `This is Longest Repeating Character Replacement with an alphabet of two, and it is the cleanest statement of the variable-window pattern on the sheet.

**The reframing that does all the work:** stop thinking about flipping. A window is usable when it contains **at most k zeroes** — the flips are implied. So the only state you need is a count of zeroes inside the window.

Grow \`r\`, incrementing \`zeroes\` when the incoming value is 0. While \`zeroes > k\`, shrink from the left, decrementing as zeroes leave. The window is always valid after shrinking, so the answer is the largest width you ever see.

**A detail worth knowing for interviews:** you can replace the inner \`while\` with an \`if\` and the answer is still correct. The window then never shrinks — it only slides — and since you only ever report the maximum, a window that is one too wide for a moment can never beat a genuine best. That version is branch-free and slightly faster, but the \`while\` says what you mean. Use \`while\` unless asked.

**The trap:** report \`r - l + 1\`, not \`zeroes\` or \`ones\`. And no \`max\` bookkeeping over "ones seen" is needed at all — the width already accounts for the flipped zeroes.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int longestOnes(vector<int>& nums, int k) {
        int l = 0, zeroes = 0, best = 0;
        for (int r = 0; r < nums.size(); r++) {
            if (nums[r] == 0) zeroes++;
            while (zeroes > k) {          // window invalid — shrink
                if (nums[l] == 0) zeroes--;
                l++;
            }
            best = max(best, r - l + 1);
        }
        return best;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int longestOnes(int[] nums, int k) {
        int l = 0, zeroes = 0, best = 0;
        for (int r = 0; r < nums.length; r++) {
            if (nums[r] == 0) zeroes++;
            while (zeroes > k) {
                if (nums[l] == 0) zeroes--;
                l++;
            }
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function longestOnes(nums, k) {
    let l = 0, zeroes = 0, best = 0;
    for (let r = 0; r < nums.length; r++) {
        if (nums[r] === 0) zeroes++;
        while (zeroes > k) {
            if (nums[l] === 0) zeroes--;
            l++;
        }
        best = Math.max(best, r - l + 1);
    }
    return best;
}`,
            },
        ],
        followUps: [
            'Swap the while for an if. Why is the answer still correct?',
            'Longest subarray of 1s after deleting exactly one element (Leetcode 1493).',
            'What if you could flip k zeroes OR k ones, whichever helps more?',
        ],
    },

    'fruit-into-baskets': {
        restate:
            'Two baskets, one fruit type each, picking from a contiguous run of trees. What is the longest run you can pick?',
        body: `Strip the story: **the longest subarray containing at most two distinct values.** That translation is most of the work, and it is what the problem is really testing — the baskets and trees exist to stop you pattern-matching.

Variable window again. Grow \`r\`, counting each fruit type in a map. While the map holds more than two distinct types, shrink from the left, decrementing as you go. The one thing you must not forget: **erase a key when its count hits zero**, or \`map.size()\` keeps counting types that have already left the window and the loop never terminates properly.

That single line is the whole trap. It is easy to write \`counts[x]--\` and move on, and the bug shows up only on inputs where a type is fully consumed mid-array.

**Generalising it is the point.** Change \`2\` to \`k\` and you have "longest substring with at most k distinct characters" — a strictly more common interview question. Solve it that way from the start and mention that the \`2\` is a parameter; it costs nothing and shows you saw the shape.

With the alphabet bounded at 3 distinct keys (two valid plus the one that broke it), the map operations are effectively \`O(1)\`.`,
        complexity: { time: 'O(n)', space: 'O(1) — at most 3 keys' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int totalFruit(vector<int>& fruits) {
        unordered_map<int, int> count;
        int l = 0, best = 0;

        for (int r = 0; r < fruits.size(); r++) {
            count[fruits[r]]++;
            while (count.size() > 2) {
                if (--count[fruits[l]] == 0) count.erase(fruits[l]);  // ERASE
                l++;
            }
            best = max(best, r - l + 1);
        }
        return best;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int totalFruit(int[] fruits) {
        Map<Integer, Integer> count = new HashMap<>();
        int l = 0, best = 0;

        for (int r = 0; r < fruits.length; r++) {
            count.merge(fruits[r], 1, Integer::sum);
            while (count.size() > 2) {
                if (count.merge(fruits[l], -1, Integer::sum) == 0) {
                    count.remove(fruits[l]);
                }
                l++;
            }
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function totalFruit(fruits) {
    const count = new Map();
    let l = 0, best = 0;

    for (let r = 0; r < fruits.length; r++) {
        count.set(fruits[r], (count.get(fruits[r]) || 0) + 1);
        while (count.size > 2) {
            const left = fruits[l];
            count.set(left, count.get(left) - 1);
            if (count.get(left) === 0) count.delete(left); // or size never drops
            l++;
        }
        best = Math.max(best, r - l + 1);
    }
    return best;
}`,
            },
        ],
        followUps: [
            'Generalise to at most k distinct values — the version you are more likely to be asked.',
            'What breaks if you never delete a zero-count key?',
            'Return the starting index of the best run as well as its length.',
        ],
    },
};
