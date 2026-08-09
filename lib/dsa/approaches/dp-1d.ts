// lib/dsa/approaches/dp-1d.ts
//
// "Our approach" pages for Dynamic Programming — 1D.
//
// Same four beats as every other approach file (brute force → why it is too
// slow → the observation → the trap); see approaches/arrays-hashing.ts for the
// house style in full.
//
// THE METHOD, stated once. DP is not a bag of recurrences to memorise — it is
// four steps, and doing them in order works on problems you have never seen:
//
//   1. WRITE THE BRUTE FORCE as recursion. Do not optimise anything.
//   2. NAME THE STATE. What arguments does that recursion actually vary? That
//      set of arguments IS the dp index. If it is one argument, this is a 1-D
//      problem.
//   3. ADD A CACHE. Exponential becomes linear, and you have not changed the
//      logic at all. This is the step that makes DP feel like bookkeeping
//      rather than invention.
//   4. TURN IT INSIDE OUT (optional). Replace recursion with a loop filling the
//      table bottom-up, then notice you only ever read the last one or two
//      entries and collapse the array to a couple of variables.
//
// Almost every page below runs those four steps explicitly, because the steps
// are the transferable part. An interviewer who sees you go brute force →
// state → cache has already got their signal; the O(1)-space version is a
// bonus, not the point.
//
// ON SAYING THE RECURRENCE OUT LOUD: if you cannot state what dp[i] MEANS in
// one plain English sentence, the code will not come. Every page here names it.

import type { DsaApproach } from '../types';

export const dp1dApproaches: Record<string, DsaApproach> = {
    'climbing-stairs': {
        restate: 'How many distinct ways to climb n stairs taking 1 or 2 steps at a time?',
        body: `The smallest possible DP, and the right place to run the four steps in full.

**Brute force:** to reach step \`n\` your last move came from \`n-1\` or \`n-2\`, so \`ways(n) = ways(n-1) + ways(n-2)\`. That recursion is \`O(2ⁿ)\` because it recomputes the same steps over and over.

**The state** is a single number — which step you are on. One argument, so 1-D.

**\`dp[i]\` means: the number of ways to reach step i.** Base cases \`dp[0] = 1\` (one way to stand still) and \`dp[1] = 1\`.

That is Fibonacci, shifted. Recognising it is a nice observation but not the point — the point is that you *derived* it rather than recalled it.

**The collapse:** \`dp[i]\` only ever reads \`dp[i-1]\` and \`dp[i-2]\`, so the array is unnecessary. Two variables, rolled forward, gives \`O(1)\` space.

**The trap:** get the base cases right by testing \`n = 1\` and \`n = 2\` by hand. \`dp[0] = 1\` looks arbitrary until you see it is what makes \`dp[2] = 2\` come out correct. Setting \`dp[0] = 0\` is the common slip and every answer is then one Fibonacci term off — a wrong answer that still looks like a plausible sequence.

Say the exponential brute force first in an interview, then memoise it, then collapse. Jumping straight to two variables hides the reasoning that is being assessed.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int climbStairs(int n) {
        // dp[i] = ways to reach step i. Only the last two are ever read.
        int prev = 1, cur = 1;          // dp[0] = 1, dp[1] = 1
        for (int i = 2; i <= n; i++) {
            int next = cur + prev;
            prev = cur;
            cur = next;
        }
        return cur;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int climbStairs(int n) {
        int prev = 1, cur = 1;
        for (int i = 2; i <= n; i++) {
            int next = cur + prev;
            prev = cur;
            cur = next;
        }
        return cur;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function climbStairs(n) {
    let prev = 1, cur = 1;      // dp[0], dp[1]
    for (let i = 2; i <= n; i++) {
        [prev, cur] = [cur, cur + prev];
    }
    return cur;
}`,
            },
        ],
        followUps: [
            'Why is dp[0] = 1 rather than 0? Test n = 2 by hand.',
            'Steps of 1, 2 or 3. What changes?',
            'Solve it in O(log n) with matrix exponentiation.',
        ],
    },

    'min-cost-climbing-stairs': {
        restate:
            'Each step has a cost paid on leaving it. Start from index 0 or 1, reach past the top for the least total.',
        body: `Climbing Stairs with weights, and the value is in getting the *definition* right rather than the recurrence.

**\`dp[i]\` means: the minimum cost to REACH step i.** Not the cost to leave it, not the cost of the best path through it. Say the sentence before writing anything, because two of the three readings produce off-by-one answers that pass the first example.

**The recurrence** follows directly: you arrive at \`i\` from \`i-1\` or \`i-2\`, paying that step's own cost on departure:

\`\`\`
dp[i] = min(dp[i-1] + cost[i-1], dp[i-2] + cost[i-2])
\`\`\`

**Base cases:** \`dp[0] = dp[1] = 0\` — you may start at either without paying to get there. That is what "start from index 0 or 1" means, and it is easy to misread as "pay cost[0] to start".

**The answer is \`dp[n]\`, not \`dp[n-1]\`.** The top is *past* the last step, so the array is conceptually one longer than the input. Returning \`dp[n-1]\` gives the cost to reach the final step rather than to finish, and it is the single most common wrong submission here.

**The collapse:** two variables again, same as Climbing Stairs.

**Why this problem is on the sheet:** it is the first one where a plausible alternative definition of \`dp[i]\` silently gives a wrong answer. That is the skill — defining the state precisely — and it matters far more in the 2-D section.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int minCostClimbingStairs(vector<int>& cost) {
        int n = cost.size();
        // dp[i] = minimum cost to REACH step i. Start free at 0 or 1.
        int a = 0, b = 0;               // dp[0], dp[1]
        for (int i = 2; i <= n; i++) {  // <= n: the top is PAST the last step
            int cur = min(b + cost[i - 1], a + cost[i - 2]);
            a = b;
            b = cur;
        }
        return b;                        // dp[n], not dp[n-1]
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int minCostClimbingStairs(int[] cost) {
        int n = cost.length;
        int a = 0, b = 0;
        for (int i = 2; i <= n; i++) {
            int cur = Math.min(b + cost[i - 1], a + cost[i - 2]);
            a = b;
            b = cur;
        }
        return b;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function minCostClimbingStairs(cost) {
    const n = cost.length;
    let a = 0, b = 0;               // free to start at step 0 or 1
    for (let i = 2; i <= n; i++) {
        [a, b] = [b, Math.min(b + cost[i - 1], a + cost[i - 2])];
    }
    return b;                        // the top is index n
}`,
            },
        ],
        followUps: [
            'What does returning dp[n-1] compute instead? Why is it wrong?',
            'State dp[i] three different ways. Which two give wrong answers?',
            'Return the actual sequence of steps taken.',
        ],
    },

    'house-robber': {
        restate:
            'Maximum sum from a row of houses, where you may not take two adjacent ones.',
        body: `The **take-or-skip** template. Once you have this, House Robber II, Delete and Earn, and the stock problems are all variations.

**Brute force:** at each house, take it (and skip the next) or skip it. \`O(2ⁿ)\`.

**The state** is one number — which house you are standing at — so this is 1-D.

**\`dp[i]\` means: the most money obtainable from the first i houses.** Then:

\`\`\`
dp[i] = max(dp[i-1],              // skip house i
            dp[i-2] + nums[i])    // rob it, so i-1 is off limits
\`\`\`

**Why \`dp[i-2]\` and not "the best that excludes \`i-1\`":** those are the same thing, and saying it the first way is what keeps the recurrence to one line. Robbing house \`i\` forbids \`i-1\`, which leaves exactly the first \`i-2\` houses free — and \`dp[i-2]\` is already their best.

**The collapse:** two variables, \`rob1\` and \`rob2\`, meaning \`dp[i-2]\` and \`dp[i-1]\`.

**The trap in the collapsed version: update in the right order.** Compute the new value first, *then* shift. Overwriting \`rob1\` before using it in the max destroys the \`dp[i-2]\` you still need, and the answer comes out as the simple maximum rather than the best non-adjacent sum.

Empty array returns 0 and a single house returns itself; both fall out of initialising both variables to 0.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int rob(vector<int>& nums) {
        int rob1 = 0, rob2 = 0;   // dp[i-2], dp[i-1]
        for (int n : nums) {
            // Compute BEFORE shifting, or rob1 is destroyed while still needed.
            int take = rob1 + n;
            int cur = max(take, rob2);
            rob1 = rob2;
            rob2 = cur;
        }
        return rob2;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int rob(int[] nums) {
        int rob1 = 0, rob2 = 0;
        for (int n : nums) {
            int cur = Math.max(rob1 + n, rob2);
            rob1 = rob2;
            rob2 = cur;
        }
        return rob2;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function rob(nums) {
    let rob1 = 0, rob2 = 0;     // best up to i-2, best up to i-1
    for (const n of nums) {
        const cur = Math.max(rob1 + n, rob2);
        [rob1, rob2] = [rob2, cur];
    }
    return rob2;
}`,
            },
        ],
        followUps: [
            'Why is dp[i-2] the right thing to add to nums[i]?',
            'Return WHICH houses were robbed, not just the total.',
            'Delete and Earn (Leetcode 740) — the same recurrence in disguise.',
        ],
    },

    'house-robber-ii': {
        restate: 'House Robber, but the houses are in a circle — the first and last are adjacent.',
        body: `The circularity looks like it needs a new recurrence. It does not.

**The observation:** the first and last house cannot both be robbed. So exactly one of these is true for the optimal answer:

- it does not use the last house → solve House Robber on \`nums[0 .. n-2]\`
- it does not use the first house → solve House Robber on \`nums[1 .. n-1]\`

Run the linear solver twice and take the larger. **Reduce to the solved problem instead of inventing a circular recurrence** — that move is the actual lesson, and it recurs constantly.

**Why the two cases are exhaustive rather than exclusive:** an answer that uses neither the first nor the last house appears in both ranges, so it is still considered — being counted twice is harmless when you are taking a maximum. You do not need the cases to be disjoint, only to cover everything.

**The trap:** a single-element array. Both ranges are empty, so the two runs return 0 and you report 0 instead of that house's value. Guard \`n == 1\` explicitly and return \`nums[0]\`.

Two houses works without a special case: the first range is \`[nums[0]]\`, the second is \`[nums[1]]\`, and the max is correct.

**On implementation:** factor the linear solver into a helper taking a start and end index. Copying the loop twice invites a typo in exactly one of the two bounds — and half the answer being right makes it hard to spot.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    int robLinear(vector<int>& nums, int lo, int hi) {
        int rob1 = 0, rob2 = 0;
        for (int i = lo; i <= hi; i++) {
            int cur = max(rob1 + nums[i], rob2);
            rob1 = rob2;
            rob2 = cur;
        }
        return rob2;
    }
public:
    int rob(vector<int>& nums) {
        int n = nums.size();
        if (n == 1) return nums[0];      // both ranges would be empty
        // Either the last house is excluded, or the first is.
        return max(robLinear(nums, 0, n - 2), robLinear(nums, 1, n - 1));
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private int robLinear(int[] nums, int lo, int hi) {
        int rob1 = 0, rob2 = 0;
        for (int i = lo; i <= hi; i++) {
            int cur = Math.max(rob1 + nums[i], rob2);
            rob1 = rob2;
            rob2 = cur;
        }
        return rob2;
    }

    public int rob(int[] nums) {
        int n = nums.length;
        if (n == 1) return nums[0];
        return Math.max(robLinear(nums, 0, n - 2), robLinear(nums, 1, n - 1));
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function rob(nums) {
    const n = nums.length;
    if (n === 1) return nums[0];

    const robLinear = (lo, hi) => {
        let rob1 = 0, rob2 = 0;
        for (let i = lo; i <= hi; i++) {
            [rob1, rob2] = [rob2, Math.max(rob1 + nums[i], rob2)];
        }
        return rob2;
    };

    return Math.max(robLinear(0, n - 2), robLinear(1, n - 1));
}`,
            },
        ],
        followUps: [
            'Why is it fine that the two ranges overlap?',
            'What does a single-house input return without the guard?',
            'House Robber III — the houses form a binary tree.',
        ],
    },

    'longest-palindromic-substring': {
        restate: 'The longest contiguous substring that reads the same both ways.',
        body: `Checking every substring is \`O(n³)\` — \`O(n²)\` substrings times \`O(n)\` to verify each.

**The observation: grow outward from centres.** Every palindrome has a centre, and expanding from it while the two sides match finds the longest palindrome centred there in \`O(n)\`. Do that for every centre: \`O(n²)\` time and, crucially, \`O(1)\` space.

**There are 2n-1 centres, not n.** Odd-length palindromes are centred on a character; even-length ones are centred *between* two characters. Handling only the first kind misses \`"abba"\` entirely — and since most test strings contain an odd-length answer too, this bug frequently passes the examples.

Run two expansions per index — one from \`(i, i)\` and one from \`(i, i+1)\` — and keep the longest seen.

**The DP alternative:** \`dp[i][j]\` means "is \`s[i..j]\` a palindrome", with \`dp[i][j] = s[i]==s[j] && dp[i+1][j-1]\`. Same \`O(n²)\` time but \`O(n²)\` space, and the fill order is fiddly (by increasing length, or bottom-up-right). Expand-around-centre is strictly better here; the table earns its keep in Palindrome Partitioning, where you query the same range repeatedly.

**The trap:** track the best by start index and length, not by copying substrings inside the loop. Slicing on every improvement is an extra \`O(n)\` each time and turns the constant factor bad for no reason.

**Manacher's algorithm** solves it in \`O(n)\`. Worth naming; nobody expects you to write it.`,
        complexity: { time: 'O(n²)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    string longestPalindrome(string s) {
        int bestStart = 0, bestLen = 0;

        auto expand = [&](int l, int r) {
            while (l >= 0 && r < (int)s.size() && s[l] == s[r]) { l--; r++; }
            // l and r have overshot by one on each side.
            int len = r - l - 1;
            if (len > bestLen) { bestLen = len; bestStart = l + 1; }
        };

        for (int i = 0; i < (int)s.size(); i++) {
            expand(i, i);        // odd-length centre
            expand(i, i + 1);    // EVEN-length centre — "abba" needs this
        }
        return s.substr(bestStart, bestLen);
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private int bestStart = 0, bestLen = 0;

    private void expand(String s, int l, int r) {
        while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { l--; r++; }
        int len = r - l - 1;
        if (len > bestLen) { bestLen = len; bestStart = l + 1; }
    }

    public String longestPalindrome(String s) {
        bestStart = 0; bestLen = 0;
        for (int i = 0; i < s.length(); i++) {
            expand(s, i, i);
            expand(s, i, i + 1);
        }
        return s.substring(bestStart, bestStart + bestLen);
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function longestPalindrome(s) {
    let bestStart = 0, bestLen = 0;

    const expand = (l, r) => {
        while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }
        const len = r - l - 1;          // both overshot by one
        if (len > bestLen) { bestLen = len; bestStart = l + 1; }
    };

    for (let i = 0; i < s.length; i++) {
        expand(i, i);
        expand(i, i + 1);
    }
    return s.slice(bestStart, bestStart + bestLen);
}`,
            },
        ],
        followUps: [
            'Why 2n-1 centres? Which palindromes does the odd-only version miss?',
            'Derive len = r - l - 1 after the loop exits.',
            'Write the DP table version. Why is the fill order awkward?',
        ],
    },

    'palindromic-substrings': {
        restate: 'Count all palindromic substrings, counting different positions separately.',
        body: `The previous problem with **counting** instead of tracking the longest — and that is genuinely the only change.

**The observation:** each successful expansion step *is* one palindrome. When you expand from a centre and the characters match, you have found a palindrome; increment and keep going. No comparison against a best, no length tracking.

Same 2n-1 centres, same two calls per index. If you wrote the previous problem well, this is a five-line edit.

**Why substrings at different positions count separately:** \`"aaa"\` has 6 — three single characters, two \`"aa"\`, one \`"aaa"\`. They are not distinct *strings*, they are distinct *substrings*. Deduplicating by content is the misreading that turns 6 into 3, and it is worth confirming against the examples before coding.

**The trap:** count *inside* the expansion loop, not after it. Counting once per centre gives you the number of centres, not the number of palindromes — and on \`"abc"\` both happen to be 3, so the first example does not catch it.

**The DP version** fills \`dp[i][j]\` and counts the true cells: same complexity, \`O(n²)\` space, and no clearer. Expand-around-centre remains the better answer.

Every single character is a palindrome, so the count is never below \`n\` — a useful sanity check on any implementation.`,
        complexity: { time: 'O(n²)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int countSubstrings(string s) {
        int count = 0;

        auto expand = [&](int l, int r) {
            while (l >= 0 && r < (int)s.size() && s[l] == s[r]) {
                count++;      // INSIDE the loop: every match is a palindrome
                l--; r++;
            }
        };

        for (int i = 0; i < (int)s.size(); i++) {
            expand(i, i);
            expand(i, i + 1);
        }
        return count;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private int count = 0;

    private void expand(String s, int l, int r) {
        while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) {
            count++;
            l--; r++;
        }
    }

    public int countSubstrings(String s) {
        count = 0;
        for (int i = 0; i < s.length(); i++) {
            expand(s, i, i);
            expand(s, i, i + 1);
        }
        return count;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function countSubstrings(s) {
    let count = 0;

    const expand = (l, r) => {
        while (l >= 0 && r < s.length && s[l] === s[r]) {
            count++;
            l--; r++;
        }
    };

    for (let i = 0; i < s.length; i++) {
        expand(i, i);
        expand(i, i + 1);
    }
    return count;
}`,
            },
        ],
        followUps: [
            'Why does "aaa" return 6 and not 3?',
            'What does counting once per centre compute instead?',
            'Count only the DISTINCT palindromic substrings.',
        ],
    },

    'decode-ways': {
        restate:
            'A digit string maps to letters via A=1…Z=26. How many ways can it be decoded?',
        body: `Climbing Stairs with validity rules — the recurrence is the same shape, and the entire difficulty is which moves are legal.

**\`dp[i]\` means: the number of ways to decode the first i characters.**

\`\`\`
dp[i] = dp[i-1]   if s[i-1] is a valid single digit  (1..9)
      + dp[i-2]   if s[i-2..i-1] is a valid pair     (10..26)
\`\`\`

Both terms are conditional, which is what separates this from Climbing Stairs.

**The two validity rules, exactly:**

**A single digit is valid unless it is \`'0'\`.** There is no letter 0, so a zero can never stand alone — it must be the second half of 10 or 20.

**A pair is valid only in 10–26.** So it must start with \`'1'\`, or start with \`'2'\` and have a second digit of 0–6. \`"27"\` is not a pair; \`"06"\` is not a pair either, because leading zeros are not valid encodings — \`"06"\` is not 6.

**The trap: zero.** Most wrong submissions handle \`"226"\` fine and fail on \`"06"\`, \`"100"\`, or \`"301"\`. Test those three by hand before submitting. \`"301"\` is 0 ways: the \`0\` cannot stand alone and \`30\` is out of range, so it is undecodable.

\`dp[0] = 1\` — the empty prefix has one decoding, which is what makes a valid two-digit start count correctly.

**The collapse:** two variables again. Same as every problem so far in the section, and by now that should feel automatic.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int numDecodings(string s) {
        if (s.empty() || s[0] == '0') return 0;

        int prev = 1, cur = 1;          // dp[0] = 1 (empty), dp[1] = 1
        for (int i = 1; i < (int)s.size(); i++) {
            int next = 0;
            if (s[i] != '0') next += cur;                    // single: not zero
            int pair = (s[i - 1] - '0') * 10 + (s[i] - '0');
            if (pair >= 10 && pair <= 26) next += prev;      // pair: 10..26
            if (next == 0) return 0;                          // undecodable
            prev = cur;
            cur = next;
        }
        return cur;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int numDecodings(String s) {
        if (s.isEmpty() || s.charAt(0) == '0') return 0;

        int prev = 1, cur = 1;
        for (int i = 1; i < s.length(); i++) {
            int next = 0;
            if (s.charAt(i) != '0') next += cur;
            int pair = (s.charAt(i - 1) - '0') * 10 + (s.charAt(i) - '0');
            if (pair >= 10 && pair <= 26) next += prev;
            if (next == 0) return 0;
            prev = cur;
            cur = next;
        }
        return cur;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function numDecodings(s) {
    if (!s.length || s[0] === '0') return 0;

    let prev = 1, cur = 1;
    for (let i = 1; i < s.length; i++) {
        let next = 0;
        if (s[i] !== '0') next += cur;                 // single digit, non-zero
        const pair = Number(s.slice(i - 1, i + 1));
        if (pair >= 10 && pair <= 26) next += prev;    // 10..26 only
        if (next === 0) return 0;
        [prev, cur] = [cur, next];
    }
    return cur;
}`,
            },
        ],
        followUps: [
            'Work through "06", "100" and "301" by hand. What does each return?',
            'Why is dp[0] = 1?',
            'Decode Ways II — the string may contain "*" matching any digit 1-9.',
        ],
    },

    'coin-change': {
        restate:
            'Fewest coins summing to an amount, with unlimited coins of each denomination, or -1 if impossible.',
        body: `The **unbounded knapsack** template, and the classic demonstration that greedy fails.

**Why greedy is wrong:** taking the largest coin that fits gives \`[1,3,4]\` with amount 6 → \`4+1+1\` = 3 coins, when \`3+3\` = 2 is optimal. Greedy works for real currencies because they are designed to make it work; it does not work in general. Say this — it is often the actual question being asked.

**\`dp[a]\` means: the fewest coins summing to exactly a.**

\`\`\`
dp[a] = 1 + min(dp[a - coin]) over every coin that fits
\`\`\`

Fill from 1 up to the target. \`dp[0] = 0\` — zero coins make zero — and that base case is what seeds everything.

**Representing "impossible":** initialise every other entry to \`amount + 1\`, a value no real answer can reach since the smallest coin is 1. That lets \`min\` work without null checks, and any cell still holding it at the end is unreachable → return -1.

Using \`INT_MAX\` instead is the trap: \`INT_MAX + 1\` overflows to negative, and the negative then wins every \`min\` and poisons the table. If you do use it, guard with \`if (dp[a - coin] != INT_MAX)\` before adding.

**Why unlimited coins is the easy direction:** the loop over \`a\` runs upward and reads \`dp[a - coin]\`, which may already include the same coin. That reuse is exactly what "unlimited" means. Coin Change II and the 0/1 knapsack problems in the 2-D section have to work harder to *prevent* it, and comparing the two loop orders is the clearest way to see it.`,
        complexity: { time: 'O(amount · coins)', space: 'O(amount)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        // amount+1 is an "impossible" sentinel: no real answer can reach it,
        // and unlike INT_MAX it cannot overflow when 1 is added.
        vector<int> dp(amount + 1, amount + 1);
        dp[0] = 0;

        for (int a = 1; a <= amount; a++) {
            for (int coin : coins) {
                if (coin > a) continue;
                dp[a] = min(dp[a], 1 + dp[a - coin]);
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);
        dp[0] = 0;

        for (int a = 1; a <= amount; a++) {
            for (int coin : coins) {
                if (coin > a) continue;
                dp[a] = Math.min(dp[a], 1 + dp[a - coin]);
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function coinChange(coins, amount) {
    const dp = new Array(amount + 1).fill(amount + 1);
    dp[0] = 0;                       // zero coins make zero

    for (let a = 1; a <= amount; a++) {
        for (const coin of coins) {
            if (coin > a) continue;
            dp[a] = Math.min(dp[a], 1 + dp[a - coin]);
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}`,
            },
        ],
        followUps: [
            'Show an input where greedy fails. Why does it work for real currency?',
            'What goes wrong with INT_MAX as the sentinel?',
            'Return WHICH coins were used.',
        ],
    },

    'maximum-product-subarray': {
        restate: 'The largest product of any contiguous subarray.',
        body: `Kadane's algorithm looks like it should transfer from Maximum Subarray. It does not, and understanding why is the whole problem.

**Why the sum version fails here:** with sums, a running total that goes negative is simply discarded — it can never help. With products, a **large negative can become the maximum the moment another negative arrives**. Discarding it loses the answer on \`[-2, 3, -4]\`, where the best is 24.

**The observation: track both extremes.** Carry the maximum *and* the minimum product ending at the current index. A negative number swaps their roles — multiplying by it turns the biggest into the smallest and vice versa — so the minimum is not dead weight, it is a candidate for tomorrow's maximum.

At each element the new maximum is the largest of three: the element alone (starting fresh), \`element × previousMax\`, or \`element × previousMin\`. The new minimum is the smallest of the same three.

**The trap that decides correctness: compute both from the OLD values.** Overwriting \`curMax\` and then using it to compute \`curMin\` feeds the new value into its own sibling's calculation. Stash the previous max in a temporary, or compute both before assigning either.

**Zero handles itself.** It makes both running values 0, which the "element alone" branch then resets on the next element — no special case needed. Trace \`[−2, 0, −1]\` if that is not obvious; the answer is 0.

The overall answer is the best \`curMax\` ever seen, not the final one — the maximum can occur mid-array and then be destroyed.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int maxProduct(vector<int>& nums) {
        int best = nums[0], curMax = nums[0], curMin = nums[0];

        for (int i = 1; i < (int)nums.size(); i++) {
            int n = nums[i];
            int prevMax = curMax;                 // stash: curMin needs the OLD max
            curMax = max({n, prevMax * n, curMin * n});
            curMin = min({n, prevMax * n, curMin * n});
            best = max(best, curMax);             // the peak may be mid-array
        }
        return best;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int maxProduct(int[] nums) {
        int best = nums[0], curMax = nums[0], curMin = nums[0];

        for (int i = 1; i < nums.length; i++) {
            int n = nums[i];
            int prevMax = curMax;
            curMax = Math.max(n, Math.max(prevMax * n, curMin * n));
            curMin = Math.min(n, Math.min(prevMax * n, curMin * n));
            best = Math.max(best, curMax);
        }
        return best;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function maxProduct(nums) {
    let best = nums[0], curMax = nums[0], curMin = nums[0];

    for (let i = 1; i < nums.length; i++) {
        const n = nums[i];
        const prevMax = curMax;      // both new values read the OLD pair
        curMax = Math.max(n, prevMax * n, curMin * n);
        curMin = Math.min(n, prevMax * n, curMin * n);
        best = Math.max(best, curMax);
    }
    return best;
}`,
            },
        ],
        followUps: [
            'Trace [-2, 3, -4]. Where does tracking only the max go wrong?',
            'Why is no special case needed for zero? Trace [-2, 0, -1].',
            'What if the array could be rotated?',
        ],
    },

    'word-break': {
        restate: 'Can the string be split into a sequence of dictionary words?',
        body: `The recursion is obvious: try every prefix that is a word, then solve the rest. Without memoisation it is exponential, because the same suffix gets re-solved through many different prefix paths.

**\`dp[i]\` means: can the first i characters be segmented?**

\`\`\`
dp[i] = true if there exists j < i with dp[j] == true AND s[j..i-1] in the dictionary
\`\`\`

Read it as: *some earlier position was reachable, and the piece from there to here is a word.* Fill left to right; the answer is \`dp[n]\`.

**\`dp[0] = true\`** — the empty prefix is trivially segmentable, and it is what allows the very first word to match. Forgetting it makes every input return false, which at least fails loudly.

**Put the dictionary in a hash set.** Scanning a list on every substring check turns an \`O(n²·L)\` solution into \`O(n²·L·W)\` for no reason.

**The trap: break as soon as \`dp[i]\` is true.** Continuing to test the remaining \`j\` values cannot change the answer and doubles the work in the common case.

**Two optimisations worth naming.** Cap the inner loop by the longest word in the dictionary — a piece longer than that can never match. And a trie makes the prefix checks incremental rather than re-hashing each substring.

**Why greedy fails:** taking the longest matching word at each step breaks on \`s = "aaaaaaa"\` with \`["aaa", "aaaa"]\` — the greedy first choice leaves a remainder that cannot be segmented, but a different split works. You must be able to reconsider, which is what the DP does.`,
        complexity: { time: 'O(n² · L)', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    bool wordBreak(string s, vector<string>& wordDict) {
        unordered_set<string> words(wordDict.begin(), wordDict.end());
        int n = s.size();
        vector<bool> dp(n + 1, false);
        dp[0] = true;                        // empty prefix is segmentable

        for (int i = 1; i <= n; i++) {
            for (int j = 0; j < i; j++) {
                if (dp[j] && words.count(s.substr(j, i - j))) {
                    dp[i] = true;
                    break;                    // no point testing more j
                }
            }
        }
        return dp[n];
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public boolean wordBreak(String s, List<String> wordDict) {
        Set<String> words = new HashSet<>(wordDict);
        int n = s.length();
        boolean[] dp = new boolean[n + 1];
        dp[0] = true;

        for (int i = 1; i <= n; i++) {
            for (int j = 0; j < i; j++) {
                if (dp[j] && words.contains(s.substring(j, i))) {
                    dp[i] = true;
                    break;
                }
            }
        }
        return dp[n];
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function wordBreak(s, wordDict) {
    const words = new Set(wordDict);
    const n = s.length;
    const dp = new Array(n + 1).fill(false);
    dp[0] = true;

    for (let i = 1; i <= n; i++) {
        for (let j = 0; j < i; j++) {
            if (dp[j] && words.has(s.slice(j, i))) {
                dp[i] = true;
                break;
            }
        }
    }
    return dp[n];
}`,
            },
        ],
        followUps: [
            'Why does greedy longest-match fail? Try "aaaaaaa" with ["aaa","aaaa"].',
            'Word Break II — return every possible sentence.',
            'How would a trie change the inner loop?',
        ],
    },

    'longest-increasing-subsequence': {
        restate:
            'The length of the longest strictly increasing subsequence. Elements need not be adjacent.',
        body: `Two solutions worth knowing, and the second is genuinely surprising.

**The \`O(n²)\` DP.** \`dp[i]\` means: the length of the longest increasing subsequence **ending at index i**. For each \`i\`, look at every earlier \`j\` with \`nums[j] < nums[i]\` and take the best. Every element alone is a subsequence, so initialise to 1.

**The answer is the maximum over the whole array, not \`dp[n-1]\`** — the longest subsequence rarely ends at the last element. That is the most common bug here, and "ending at i" in the definition is precisely what warns you about it.

**The \`O(n log n)\` version (patience sorting)**, and it repays the effort:

Keep an array \`tails\`, where \`tails[k]\` is **the smallest possible value that can end an increasing subsequence of length k+1**. For each number, binary search for the first tail \`>=\` it and overwrite that slot; if none exists, append. The answer is the length of \`tails\`.

**The crucial caveat: \`tails\` is not itself a valid subsequence.** It is a set of best-possible endings — its *length* is the answer, its *contents* are not the sequence. Believing otherwise is the standard misunderstanding of this algorithm, so do not try to reconstruct the answer from it directly.

The intuition for why overwriting is safe: a smaller ending value for the same length can only ever be extended by more future elements, so replacing is never worse.

**Strictly increasing means \`lower_bound\`** (first \`>=\`). For non-decreasing you want \`upper_bound\` (first \`>\`). One character, opposite problem.`,
        complexity: { time: 'O(n log n)', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int lengthOfLIS(vector<int>& nums) {
        // tails[k] = smallest value that can END an increasing subsequence
        // of length k+1. NOT itself a valid subsequence — only its size matters.
        vector<int> tails;
        for (int n : nums) {
            // lower_bound = first >= n, which enforces STRICTLY increasing.
            auto it = lower_bound(tails.begin(), tails.end(), n);
            if (it == tails.end()) tails.push_back(n);
            else *it = n;
        }
        return tails.size();
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int lengthOfLIS(int[] nums) {
        List<Integer> tails = new ArrayList<>();
        for (int n : nums) {
            int lo = 0, hi = tails.size();
            while (lo < hi) {                 // first index with tails[i] >= n
                int mid = lo + (hi - lo) / 2;
                if (tails.get(mid) < n) lo = mid + 1;
                else hi = mid;
            }
            if (lo == tails.size()) tails.add(n);
            else tails.set(lo, n);
        }
        return tails.size();
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function lengthOfLIS(nums) {
    const tails = [];

    for (const n of nums) {
        let lo = 0, hi = tails.length;
        while (lo < hi) {                 // lower_bound: first tail >= n
            const mid = (lo + hi) >> 1;
            if (tails[mid] < n) lo = mid + 1;
            else hi = mid;
        }
        if (lo === tails.length) tails.push(n);
        else tails[lo] = n;
    }
    return tails.length;                   // the LENGTH is the answer
}`,
            },
        ],
        followUps: [
            'Write the O(n^2) DP. Why is the answer max(dp) rather than dp[n-1]?',
            'Why is tails not a valid subsequence? Trace [10,9,2,5,3,7].',
            'Non-decreasing instead of strictly increasing — which bound changes?',
            'Reconstruct the actual subsequence.',
        ],
    },
};
