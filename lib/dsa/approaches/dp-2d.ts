// lib/dsa/approaches/dp-2d.ts
//
// "Our approach" pages for Dynamic Programming — 2D.
//
// Same four beats as every other approach file (brute force → why it is too
// slow → the observation → the trap); see approaches/arrays-hashing.ts for the
// house style in full.
//
// THE RULE THAT MAKES THIS SECTION TRACTABLE, stated once:
//
//   Write one English sentence saying what dp[i][j] MEANS, before any code.
//
// In 1-D you can often stumble into the recurrence by writing three examples.
// In 2-D you cannot — the table has too many plausible readings, and picking
// the wrong one produces code that passes example 1 and fails everything else.
// Every page below opens with that sentence, and it is the single most useful
// habit the section teaches.
//
// THREE FAMILIES cover all eleven problems:
//
//   TWO SEQUENCES — dp[i][j] = the answer for the first i of A and first j of B.
//     Match the characters or skip one. LCS, Edit Distance, Distinct
//     Subsequences, Interleaving String, Regular Expression Matching.
//
//   KNAPSACK — dp[i][c] = the answer using the first i items with capacity c.
//     The whole family is take-or-skip; only two things vary, and the pair is
//     what tells you which problem you actually have:
//       * 0/1 vs unbounded  → iterate capacity DOWNWARD vs UPWARD
//       * count vs feasible → dp is a sum vs an OR
//     Partition Equal Subset Sum, Coin Change II, Target Sum.
//
//   INTERVAL / STATE MACHINE — the odd ones out. Burst Balloons indexes by
//     range and asks which element is LAST rather than first; the stock problem
//     indexes by (day, state) instead of by two sequences.
//
// ON SPACE: nearly every two-sequence table only reads the previous row, so
// O(m·n) collapses to O(min(m,n)). Say it; write the full table unless asked,
// because a rolling array is much easier to get subtly wrong under time
// pressure and the interviewer is buying the recurrence, not the memory.

import type { DsaApproach } from '../types';

export const dp2dApproaches: Record<string, DsaApproach> = {
    'unique-paths': {
        restate:
            'How many paths from the top-left to the bottom-right of an m×n grid, moving only right or down?',
        body: `The gentlest 2-D table, and a good place to establish the habit.

**\`dp[i][j]\` means: the number of distinct paths from the start to cell (i, j).**

You can only arrive at a cell from above or from the left, so:

\`\`\`
dp[i][j] = dp[i-1][j] + dp[i][j-1]
\`\`\`

**The base row and column are all 1s.** There is exactly one way to walk along the top edge (keep going right) and one along the left edge (keep going down). Getting this wrong — seeding zeros — makes the entire table zero, which at least fails loudly.

**The collapse to \`O(n)\`:** each row only reads the row above and the cell to its left. Keep one row and update it in place: \`row[j] += row[j-1]\`, where \`row[j]\` on the right is still the value from the previous row and \`row[j-1]\` is already the current row. Two meanings of the same array in one line — worth stating explicitly rather than letting the reader work it out.

**The combinatorial answer:** every path is \`m-1\` downs and \`n-1\` rights in some order, so the count is \`C(m+n-2, m-1)\` — computable in \`O(min(m,n))\` with no table at all. Mention it; it shows you saw past the DP framing.

**The trap:** \`m\` is rows and \`n\` is columns. Swapping them still returns a correct-looking number because the binomial is symmetric, so this bug hides completely on square grids.`,
        complexity: { time: 'O(m · n)', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int uniquePaths(int m, int n) {
        // dp[j] = paths to the current row's column j. Seeded as the top row:
        // exactly one way to reach any cell along it.
        vector<int> row(n, 1);
        for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) {
                // row[j] is still the row ABOVE; row[j-1] is already this row.
                row[j] += row[j - 1];
            }
        }
        return row[n - 1];
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int uniquePaths(int m, int n) {
        int[] row = new int[n];
        Arrays.fill(row, 1);
        for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) {
                row[j] += row[j - 1];
            }
        }
        return row[n - 1];
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function uniquePaths(m, n) {
    const row = new Array(n).fill(1);   // the top row: one path to each cell
    for (let i = 1; i < m; i++) {
        for (let j = 1; j < n; j++) {
            row[j] += row[j - 1];
        }
    }
    return row[n - 1];
}`,
            },
        ],
        followUps: [
            'Solve it with the binomial coefficient. Why is that O(min(m,n))?',
            'Unique Paths II — some cells are blocked. What changes in the base row?',
            'Why does swapping m and n hide the bug?',
        ],
    },

    'longest-common-subsequence': {
        restate:
            'The length of the longest subsequence present in both strings. Characters need not be adjacent.',
        body: `The **two-sequences** template. Edit Distance, Distinct Subsequences and Interleaving String are all this table with a different rule in the cells.

**\`dp[i][j]\` means: the LCS length of the first i characters of text1 and the first j characters of text2.**

Note "first i characters", not "ending at i". That choice is what makes the base row and column meaningful — \`dp[0][j] = 0\` says an empty prefix shares nothing — and it is why the table is \`(m+1) × (n+1)\` rather than \`m × n\`.

**The recurrence is two cases, and the split is the whole idea:**

\`\`\`
if text1[i-1] == text2[j-1]:  dp[i][j] = 1 + dp[i-1][j-1]     // use both
else:                         dp[i][j] = max(dp[i-1][j],       // drop from text1
                                             dp[i][j-1])       // drop from text2
\`\`\`

Matching characters can always be taken — there is never a reason to skip a match — so that branch has no \`max\`. When they differ, one of them has to go and you try both.

**The trap: the off-by-one between table and string.** \`dp[i][j]\` concerns \`text1[i-1]\` and \`text2[j-1]\`, because row \`i\` means "the first \`i\` characters" and the last of those sits at index \`i-1\`. Indexing with \`text1[i]\` reads one character ahead and produces answers that are right on some inputs. Write the shift down before starting.

**Space collapses to \`O(min(m,n))\`** — only the previous row is ever read.

**Subsequence, not substring.** \`"abc"\` and \`"aXbXc"\` share an LCS of 3.`,
        complexity: { time: 'O(m · n)', space: 'O(min(m, n))' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int longestCommonSubsequence(string text1, string text2) {
        int m = text1.size(), n = text2.size();
        // (m+1) x (n+1): row 0 / column 0 mean "an empty prefix".
        vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                // i-1 / j-1: row i means the first i characters.
                if (text1[i - 1] == text2[j - 1]) dp[i][j] = 1 + dp[i - 1][j - 1];
                else dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
        return dp[m][n];
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int longestCommonSubsequence(String text1, String text2) {
        int m = text1.length(), n = text2.length();
        int[][] dp = new int[m + 1][n + 1];

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (text1.charAt(i - 1) == text2.charAt(j - 1)) {
                    dp[i][j] = 1 + dp[i - 1][j - 1];
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }
        return dp[m][n];
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function longestCommonSubsequence(text1, text2) {
    const m = text1.length, n = text2.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (text1[i - 1] === text2[j - 1]) dp[i][j] = 1 + dp[i - 1][j - 1];
            else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
    }
    return dp[m][n];
}`,
            },
        ],
        followUps: [
            'Why is there no max() in the matching branch?',
            'Reconstruct the actual subsequence by walking the table backwards.',
            'Collapse to two rows, then to one. What has to be saved before overwriting?',
        ],
    },

    'partition-equal-subset-sum': {
        restate: 'Can the array be split into two subsets with equal sums?',
        body: `**0/1 knapsack** wearing a disguise, and the reframing is most of the work.

**The observation:** if the two halves are equal, each is \`total / 2\`. So the question is not "how do I split this" but *"is there a subset summing to \`total / 2\`?"* — a feasibility knapsack with capacity \`total / 2\` and each number as an item of that weight.

**Two instant rejections before any DP:** an odd total can never be halved, and any single element exceeding the half-sum makes it impossible.

**\`dp[c]\` means: can some subset sum to exactly c?** Boolean, not a count — the question is feasibility. Seed \`dp[0] = true\` (the empty subset sums to zero).

**The critical detail — iterate the capacity DOWNWARD:**

\`\`\`
for each num:
    for c from target down to num:
        dp[c] = dp[c] || dp[c - num]
\`\`\`

Going **downward** means \`dp[c - num]\` is still the value from *before* this number was considered, so each number is used at most once. Going **upward** lets \`dp[c - num]\` already include the current number, and you silently allow reuse — turning this into Coin Change II. That direction is the entire difference between 0/1 and unbounded knapsack, and it is one keyword in the loop.

The 2-D table \`dp[i][c]\` makes it obvious why: the 1-D version is that table with the row index collapsed away, and the downward sweep is what preserves "previous row".

**The trap:** \`dp[c] = dp[c] || dp[c - num]\`, not \`=\`. Overwriting loses subsets found via earlier numbers.`,
        complexity: { time: 'O(n · sum)', space: 'O(sum)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    bool canPartition(vector<int>& nums) {
        int total = accumulate(nums.begin(), nums.end(), 0);
        if (total % 2) return false;          // odd can never halve
        int target = total / 2;

        vector<bool> dp(target + 1, false);
        dp[0] = true;                          // empty subset sums to 0

        for (int num : nums) {
            // DOWNWARD: dp[c-num] must still be the pre-num value (0/1 use).
            for (int c = target; c >= num; c--) {
                dp[c] = dp[c] || dp[c - num];
            }
        }
        return dp[target];
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public boolean canPartition(int[] nums) {
        int total = 0;
        for (int n : nums) total += n;
        if (total % 2 != 0) return false;
        int target = total / 2;

        boolean[] dp = new boolean[target + 1];
        dp[0] = true;

        for (int num : nums) {
            for (int c = target; c >= num; c--) {
                dp[c] = dp[c] || dp[c - num];
            }
        }
        return dp[target];
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function canPartition(nums) {
    const total = nums.reduce((a, b) => a + b, 0);
    if (total % 2 !== 0) return false;
    const target = total / 2;

    const dp = new Array(target + 1).fill(false);
    dp[0] = true;

    for (const num of nums) {
        for (let c = target; c >= num; c--) {   // downward = each item once
            dp[c] = dp[c] || dp[c - num];
        }
    }
    return dp[target];
}`,
            },
        ],
        followUps: [
            'What problem do you get if the capacity loop runs upward instead?',
            'Return the actual subset, not just whether one exists.',
            'Minimise the DIFFERENCE between the two subsets (Leetcode 1049).',
        ],
    },

    'coin-change-ii': {
        restate:
            'How many distinct combinations of coins sum to the amount? Order does not matter.',
        body: `The **unbounded knapsack, counting** variant — and the one where loop *order* rather than loop *direction* is the trap.

**\`dp[a]\` means: the number of combinations summing to exactly a.** Seed \`dp[0] = 1\` — there is exactly one way to make zero: take nothing. That base case is the whole engine; \`dp[0] = 0\` makes the entire table zero.

**The trap, and it is the reason this problem exists: put the COIN loop on the outside.**

\`\`\`
for each coin:            // outer
    for a from coin to amount:   // inner, upward
        dp[a] += dp[a - coin]
\`\`\`

Swap the loops — amount outside, coin inside — and you count **permutations** instead of combinations. \`1+2\` and \`2+1\` become two answers, and for amount 3 with coins \`[1,2]\` you get 2 rather than the correct... well, that example gives the same number, which is exactly why the bug survives casual testing. Try amount 4 with \`[1,2,3]\`: combinations = 4, permutations = 7.

**Why coin-outside gives combinations:** processing coins one at a time means every combination is built in a fixed coin order, so \`{1,2}\` is only ever reached as "some 1s, then some 2s". There is no path that produces the same multiset a second time.

**Upward, unlike Partition Equal Subset Sum**, because coins are unlimited — \`dp[a - coin]\` *should* already include the current coin. Set these two problems side by side: outer loop and direction together tell you which of the four knapsack variants you are writing.

**Use \`long\` if the count could overflow** — here the constraints guarantee it fits in a signed 32-bit int, but say you checked.`,
        complexity: { time: 'O(amount · coins)', space: 'O(amount)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int change(int amount, vector<int>& coins) {
        vector<int> dp(amount + 1, 0);
        dp[0] = 1;                         // one way to make zero: take nothing

        // COIN LOOP OUTSIDE = combinations. Swap them and you count permutations.
        for (int coin : coins) {
            for (int a = coin; a <= amount; a++) {
                dp[a] += dp[a - coin];     // upward: coins are unlimited
            }
        }
        return dp[amount];
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int change(int amount, int[] coins) {
        int[] dp = new int[amount + 1];
        dp[0] = 1;

        for (int coin : coins) {
            for (int a = coin; a <= amount; a++) {
                dp[a] += dp[a - coin];
            }
        }
        return dp[amount];
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function change(amount, coins) {
    const dp = new Array(amount + 1).fill(0);
    dp[0] = 1;

    for (const coin of coins) {         // outer = coins => combinations
        for (let a = coin; a <= amount; a++) {
            dp[a] += dp[a - coin];
        }
    }
    return dp[amount];
}`,
            },
        ],
        followUps: [
            'Swap the loops and run amount 4 with coins [1,2,3]. Why 7 instead of 4?',
            'Why upward here but downward in Partition Equal Subset Sum?',
            'Count permutations deliberately (Combination Sum IV, Leetcode 377).',
        ],
    },

    'target-sum': {
        restate:
            'Assign + or − to every number so the expression equals the target. How many assignments work?',
        body: `Brute force tries \`2ⁿ\` sign assignments. The DP requires an algebraic step first, and that step is the problem.

**The reframing:** let \`P\` be the numbers you make positive and \`N\` the ones you make negative. Then:

\`\`\`
P - N = target          and          P + N = total
\`\`\`

Add them: \`2P = target + total\`, so **\`P = (target + total) / 2\`**. The question collapses to *"how many subsets sum to P?"* — a 0/1 knapsack counting problem, exactly like Partition Equal Subset Sum but counting instead of testing feasibility.

**Two impossibility checks fall straight out of that formula**, and skipping them is the common failure:

- \`(target + total)\` must be **even**, or \`P\` is not an integer → 0 ways.
- \`|target|\` must not exceed \`total\`, or \`P\` is negative or beyond reach → 0 ways.

Without the parity check you compute a fractional capacity, and integer division silently rounds it into a plausible wrong answer.

**Then it is the familiar loop:** \`dp[s] += dp[s - num]\`, capacity **downward** because each number is used exactly once.

**Seed \`dp[0] = 1\`.** And note that zeros in the input are meaningful here — \`+0\` and \`−0\` are different assignments, so each zero doubles the count. The subset-sum formulation handles this correctly on its own; it is worth checking rather than assuming.

**The takeaway:** the hard part was never the DP. It was recognising that a signs problem is a subset-sum problem after one line of algebra.`,
        complexity: { time: 'O(n · sum)', space: 'O(sum)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int findTargetSumWays(vector<int>& nums, int target) {
        int total = accumulate(nums.begin(), nums.end(), 0);
        // P - N = target, P + N = total  =>  P = (target + total) / 2
        if (abs(target) > total) return 0;
        if ((target + total) % 2) return 0;      // P must be a whole number
        int P = (target + total) / 2;

        vector<int> dp(P + 1, 0);
        dp[0] = 1;
        for (int num : nums) {
            for (int s = P; s >= num; s--) {     // downward: each number once
                dp[s] += dp[s - num];
            }
        }
        return dp[P];
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int findTargetSumWays(int[] nums, int target) {
        int total = 0;
        for (int n : nums) total += n;
        if (Math.abs(target) > total) return 0;
        if ((target + total) % 2 != 0) return 0;
        int P = (target + total) / 2;

        int[] dp = new int[P + 1];
        dp[0] = 1;
        for (int num : nums) {
            for (int s = P; s >= num; s--) {
                dp[s] += dp[s - num];
            }
        }
        return dp[P];
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function findTargetSumWays(nums, target) {
    const total = nums.reduce((a, b) => a + b, 0);
    if (Math.abs(target) > total) return 0;
    if ((target + total) % 2 !== 0) return 0;    // parity check is essential
    const P = (target + total) / 2;

    const dp = new Array(P + 1).fill(0);
    dp[0] = 1;
    for (const num of nums) {
        for (let s = P; s >= num; s--) {
            dp[s] += dp[s - num];
        }
    }
    return dp[P];
}`,
            },
        ],
        followUps: [
            'Derive P = (target + total) / 2 on paper.',
            'What does integer division silently do without the parity check?',
            'How do zeros in the input affect the count?',
        ],
    },

    'best-time-to-buy-sell-stock-with-cooldown': {
        restate:
            'Unlimited transactions, but you must skip one day after every sale. Maximise profit.',
        body: `Not a two-sequence problem — a **state machine**, and that is the family to recognise.

**The observation:** on any day you are in exactly one of three states, and the answer is the best value of each:

- **holding** — you own a share
- **sold** — you sold *today*, so tomorrow is a forced cooldown
- **rest** — you own nothing and are free to buy

**The transitions are then mechanical:**

\`\`\`
holding = max(holding,        rest - price)    // keep, or buy from rest
sold    = holding + price                       // must have been holding
rest    = max(rest,           sold)             // stay free, or the cooldown expires
\`\`\`

The cooldown is enforced entirely by the shape: you can only buy from **rest**, and **sold** only ever flows into **rest** — never directly into a purchase. There is no counter and no special case; the graph *is* the rule. That is why the state-machine framing beats trying to bolt a "days since sale" dimension onto a normal DP.

**The trap, and it decides correctness: compute all three from YESTERDAY's values.** Update them in place and today's \`holding\` feeds into today's \`sold\`, letting you buy and sell on the same day — which quietly permits more transactions than the rules allow. Stash the previous triple first.

**Initialisation:** \`holding = -infinity\` (you cannot start owning a share), \`sold = -infinity\` (you cannot have sold before day one), \`rest = 0\`. Using 0 for \`holding\` claims a free share and inflates every answer.

**The answer is \`max(sold, rest)\`** — ending while still holding is never optimal, but taking the max costs nothing and avoids the argument.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int maxProfit(vector<int>& prices) {
        const int NEG = INT_MIN / 2;      // /2 so adding a price cannot overflow
        int holding = NEG, sold = NEG, rest = 0;

        for (int price : prices) {
            // All three read YESTERDAY's values.
            int prevHolding = holding, prevSold = sold, prevRest = rest;
            holding = max(prevHolding, prevRest - price);   // buy only from rest
            sold    = prevHolding + price;
            rest    = max(prevRest, prevSold);              // cooldown expires
        }
        return max(sold, rest);
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int maxProfit(int[] prices) {
        final int NEG = Integer.MIN_VALUE / 2;
        int holding = NEG, sold = NEG, rest = 0;

        for (int price : prices) {
            int prevHolding = holding, prevSold = sold, prevRest = rest;
            holding = Math.max(prevHolding, prevRest - price);
            sold = prevHolding + price;
            rest = Math.max(prevRest, prevSold);
        }
        return Math.max(sold, rest);
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function maxProfit(prices) {
    let holding = -Infinity, sold = -Infinity, rest = 0;

    for (const price of prices) {
        const [pH, pS, pR] = [holding, sold, rest];   // snapshot yesterday
        holding = Math.max(pH, pR - price);            // can only buy from rest
        sold = pH + price;
        rest = Math.max(pR, pS);
    }
    return Math.max(sold, rest);
}`,
            },
        ],
        followUps: [
            'Where exactly is the cooldown enforced? Point at the transition.',
            'What goes wrong if the three are updated in place?',
            'Add a transaction FEE instead of a cooldown (Leetcode 714).',
        ],
    },

    'interleaving-string': {
        restate:
            'Can s3 be formed by interleaving s1 and s2, keeping the relative order of each?',
        body: `Two sequences again, but the table means something slightly different — and the difference is worth naming.

**\`dp[i][j]\` means: can the first i characters of s1 and the first j of s2 interleave to form the first (i + j) characters of s3?**

Note there is no third index. **\`i + j\` fully determines the position in s3**, because every character of s3 comes from exactly one of the two sources. Realising that is what keeps this a 2-D problem instead of a 3-D one, and it is the observation the problem is testing.

**The recurrence — the last character of s3 came from one of the two:**

\`\`\`
dp[i][j] = (i > 0 && s1[i-1] == s3[i+j-1] && dp[i-1][j])
        || (j > 0 && s2[j-1] == s3[i+j-1] && dp[i][j-1])
\`\`\`

**The instant rejection:** if \`s1.length + s2.length != s3.length\`, return false before touching the table. Without it the indexing runs off the end of s3.

**The trap: greedy fails.** When the next character of s3 matches *both* s1 and s2, you cannot pick one — either choice may dead-end later. That ambiguity is exactly why this needs DP rather than two pointers, and it is the thing to say out loud when asked why the obvious approach does not work.

**Base cases:** \`dp[0][0] = true\`, and the first row and column check whether one string alone is a prefix of s3.

**Space** collapses to one row, since only \`dp[i-1][j]\` and \`dp[i][j-1]\` are read.`,
        complexity: { time: 'O(m · n)', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    bool isInterleave(string s1, string s2, string s3) {
        int m = s1.size(), n = s2.size();
        if (m + n != (int)s3.size()) return false;   // reject before indexing

        vector<vector<bool>> dp(m + 1, vector<bool>(n + 1, false));
        dp[0][0] = true;

        for (int i = 0; i <= m; i++) {
            for (int j = 0; j <= n; j++) {
                // i + j alone fixes the position in s3 — no third index needed.
                if (i > 0 && s1[i - 1] == s3[i + j - 1] && dp[i - 1][j]) dp[i][j] = true;
                if (j > 0 && s2[j - 1] == s3[i + j - 1] && dp[i][j - 1]) dp[i][j] = true;
            }
        }
        return dp[m][n];
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public boolean isInterleave(String s1, String s2, String s3) {
        int m = s1.length(), n = s2.length();
        if (m + n != s3.length()) return false;

        boolean[][] dp = new boolean[m + 1][n + 1];
        dp[0][0] = true;

        for (int i = 0; i <= m; i++) {
            for (int j = 0; j <= n; j++) {
                if (i > 0 && s1.charAt(i - 1) == s3.charAt(i + j - 1) && dp[i - 1][j]) {
                    dp[i][j] = true;
                }
                if (j > 0 && s2.charAt(j - 1) == s3.charAt(i + j - 1) && dp[i][j - 1]) {
                    dp[i][j] = true;
                }
            }
        }
        return dp[m][n];
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function isInterleave(s1, s2, s3) {
    const m = s1.length, n = s2.length;
    if (m + n !== s3.length) return false;

    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
    dp[0][0] = true;

    for (let i = 0; i <= m; i++) {
        for (let j = 0; j <= n; j++) {
            if (i > 0 && s1[i - 1] === s3[i + j - 1] && dp[i - 1][j]) dp[i][j] = true;
            if (j > 0 && s2[j - 1] === s3[i + j - 1] && dp[i][j - 1]) dp[i][j] = true;
        }
    }
    return dp[m][n];
}`,
            },
        ],
        followUps: [
            'Why is no third index needed for the position in s3?',
            'Construct an input where a greedy two-pointer approach fails.',
            'Interleave THREE strings — what is the table now?',
        ],
    },

    'edit-distance': {
        restate:
            'Fewest insertions, deletions or replacements to turn word1 into word2 (Levenshtein distance).',
        body: `The two-sequence table at its most useful — this algorithm is in spell checkers, diff tools and DNA alignment.

**\`dp[i][j]\` means: the minimum operations to turn the first i characters of word1 into the first j characters of word2.**

**The base row and column are not zeros**, unlike LCS. \`dp[i][0] = i\` (delete every character) and \`dp[0][j] = j\` (insert every character). Seeding them to 0 is the most common bug here, and it produces answers that are too small in a way that looks plausible.

**The recurrence — characters match, or you pay for one of three moves:**

\`\`\`
if word1[i-1] == word2[j-1]:  dp[i][j] = dp[i-1][j-1]              // free
else: dp[i][j] = 1 + min(dp[i-1][j],      // DELETE from word1
                         dp[i][j-1],      // INSERT into word1
                         dp[i-1][j-1])    // REPLACE
\`\`\`

**Which neighbour is which operation** is worth memorising as a picture, because mixing them up still compiles and still returns a number:

- **up** (\`i-1, j\`) — one fewer character of word1 → you deleted it
- **left** (\`i, j-1\`) — one fewer of word2 → you inserted it
- **diagonal** (\`i-1, j-1\`) — one fewer of each → you replaced

The matching case takes the diagonal *without* the +1: equal characters need no operation.

**The trap:** the \`min\` is over three neighbours, not two. Dropping the diagonal turns replacement into delete-then-insert and doubles the cost of every substitution.

**Space** collapses to two rows, and then to one plus a saved diagonal.`,
        complexity: { time: 'O(m · n)', space: 'O(min(m, n))' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int minDistance(string word1, string word2) {
        int m = word1.size(), n = word2.size();
        vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));

        // NOT zeros: turning a prefix into "" costs one delete per character.
        for (int i = 0; i <= m; i++) dp[i][0] = i;
        for (int j = 0; j <= n; j++) dp[0][j] = j;

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (word1[i - 1] == word2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];          // free
                } else {
                    dp[i][j] = 1 + min({dp[i - 1][j],     // delete
                                        dp[i][j - 1],     // insert
                                        dp[i - 1][j - 1]});// replace
                }
            }
        }
        return dp[m][n];
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int minDistance(String word1, String word2) {
        int m = word1.length(), n = word2.length();
        int[][] dp = new int[m + 1][n + 1];

        for (int i = 0; i <= m; i++) dp[i][0] = i;
        for (int j = 0; j <= n; j++) dp[0][j] = j;

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (word1.charAt(i - 1) == word2.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(dp[i - 1][j - 1],
                                   Math.min(dp[i - 1][j], dp[i][j - 1]));
                }
            }
        }
        return dp[m][n];
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function minDistance(word1, word2) {
    const m = word1.length, n = word2.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;   // delete every character
    for (let j = 0; j <= n; j++) dp[0][j] = j;   // insert every character

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (word1[i - 1] === word2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j],       // delete
                    dp[i][j - 1],       // insert
                    dp[i - 1][j - 1]    // replace
                );
            }
        }
    }
    return dp[m][n];
}`,
            },
        ],
        followUps: [
            'Which neighbour is which operation? Draw it.',
            'What does dropping the diagonal from the min() compute instead?',
            'Return the actual sequence of edits.',
        ],
    },

    'distinct-subsequences': {
        restate:
            'How many distinct subsequences of s equal t? Different index sets count separately.',
        body: `Two sequences, **counting** rather than measuring — and the asymmetry of the recurrence is what makes it tricky.

**\`dp[i][j]\` means: the number of subsequences of the first i characters of s that equal the first j characters of t.**

**The base cases carry the whole idea.** \`dp[i][0] = 1\` for every \`i\`: there is exactly one way to form the empty string — delete everything. And \`dp[0][j] = 0\` for \`j > 0\`: an empty source cannot produce a non-empty target. Getting the first one wrong (seeding 0) makes the entire table zero.

**The recurrence, and note it is not symmetric:**

\`\`\`
if s[i-1] == t[j-1]:  dp[i][j] = dp[i-1][j-1]   // use this character
                               + dp[i-1][j]      // OR skip it
else:                 dp[i][j] = dp[i-1][j]      // can only skip
\`\`\`

**The \`+ dp[i-1][j]\` in the matching branch is the whole problem.** Even when the characters match, you may *choose not to use* this occurrence and match \`t[j-1]\` against an earlier one instead. Both are valid distinct subsequences and both must be counted. Writing only \`dp[i-1][j-1]\` — the natural instinct from LCS — undercounts every input with repeated characters, and \`"rabbbit"\`/\`"rabbit"\` is the canonical example that exposes it: the answer is 3, one per choice of which \`b\` to skip.

Contrast with LCS, where a match is always taken because there is never a reason not to. Here there is.

**Space** collapses to one row, but it must be iterated **right to left** so \`dp[j-1]\` still holds the previous row's value.

**Use \`long\` for the counts** — the problem guarantees the answer fits in a 32-bit int, but intermediate cells can be larger.`,
        complexity: { time: 'O(m · n)', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int numDistinct(string s, string t) {
        int m = s.size(), n = t.size();
        vector<vector<unsigned long long>> dp(m + 1, vector<unsigned long long>(n + 1, 0));

        // One way to make the empty target: delete everything.
        for (int i = 0; i <= m; i++) dp[i][0] = 1;

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                dp[i][j] = dp[i - 1][j];                    // skip s[i-1]
                if (s[i - 1] == t[j - 1]) {
                    dp[i][j] += dp[i - 1][j - 1];           // OR use it
                }
            }
        }
        return (int)dp[m][n];
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int numDistinct(String s, String t) {
        int m = s.length(), n = t.length();
        long[][] dp = new long[m + 1][n + 1];

        for (int i = 0; i <= m; i++) dp[i][0] = 1;

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                dp[i][j] = dp[i - 1][j];
                if (s.charAt(i - 1) == t.charAt(j - 1)) {
                    dp[i][j] += dp[i - 1][j - 1];
                }
            }
        }
        return (int) dp[m][n];
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function numDistinct(s, t) {
    const m = s.length, n = t.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = 1;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = dp[i - 1][j];              // always allowed to skip
            if (s[i - 1] === t[j - 1]) {
                dp[i][j] += dp[i - 1][j - 1];     // and ALSO allowed to use
            }
        }
    }
    return dp[m][n];
}`,
            },
        ],
        followUps: [
            'Trace "rabbbit" / "rabbit". Why is the answer 3?',
            'Why does a match here allow skipping, when in LCS it never does?',
            'Collapse to one row. Why must it iterate right to left?',
        ],
    },

    'regular-expression-matching': {
        restate:
            'Does the pattern match the whole string? `.` matches any character, `*` matches zero or more of the PRECEDING element.',
        body: `The hardest two-sequence problem here, and almost all the difficulty is in \`*\`.

**\`dp[i][j]\` means: does the first i characters of s match the first j characters of p?**

**\`*\` is never alone.** It always binds to the character before it, so \`p[j-1] == '*'\` is really about the pair \`p[j-2..j-1]\`. Treating \`*\` as a standalone token is the misreading that makes this unsolvable.

**Two cases for that pair:**

\`\`\`
// 1. Use it ZERO times — drop both pattern characters:
dp[i][j] = dp[i][j-2]

// 2. Use it once more — only if the preceding element matches s[i-1]:
if p[j-2] == s[i-1] || p[j-2] == '.':
    dp[i][j] = dp[i][j] || dp[i-1][j]
\`\`\`

Case 2 keeps \`j\` fixed and steps \`i\` back: the pattern is unchanged (the \`*\` can fire again) while one more character of the string is consumed. That \`dp[i-1][j]\` is the line people get wrong; \`dp[i-1][j-2]\` would allow the star exactly once.

**The base row is where most wrong submissions come from.** \`dp[0][j]\` — can a pattern match the *empty* string? Only patterns like \`"a*b*c*"\` can, so fill it with \`dp[0][j] = dp[0][j-2]\` when \`p[j-1] == '*'\`. Skipping this fails \`s = ""\`, \`p = "a*"\`, which returns false instead of true.

**The trap in ordering:** check \`p[j-1] == '*'\` **before** the single-character case, or the star branch never runs.

**Say the memoised top-down version if the table is intimidating** — it is the same recurrence with the base cases falling out naturally, and it is easier to write correctly under pressure.`,
        complexity: { time: 'O(m · n)', space: 'O(m · n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    bool isMatch(string s, string p) {
        int m = s.size(), n = p.size();
        vector<vector<bool>> dp(m + 1, vector<bool>(n + 1, false));
        dp[0][0] = true;

        // Can the pattern match ""? Only via "x*" pairs.
        for (int j = 2; j <= n; j++) {
            if (p[j - 1] == '*') dp[0][j] = dp[0][j - 2];
        }

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (p[j - 1] == '*') {                     // check '*' FIRST
                    dp[i][j] = dp[i][j - 2];               // zero occurrences
                    if (p[j - 2] == s[i - 1] || p[j - 2] == '.') {
                        dp[i][j] = dp[i][j] || dp[i - 1][j];  // one more
                    }
                } else if (p[j - 1] == s[i - 1] || p[j - 1] == '.') {
                    dp[i][j] = dp[i - 1][j - 1];
                }
            }
        }
        return dp[m][n];
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public boolean isMatch(String s, String p) {
        int m = s.length(), n = p.length();
        boolean[][] dp = new boolean[m + 1][n + 1];
        dp[0][0] = true;

        for (int j = 2; j <= n; j++) {
            if (p.charAt(j - 1) == '*') dp[0][j] = dp[0][j - 2];
        }

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (p.charAt(j - 1) == '*') {
                    dp[i][j] = dp[i][j - 2];
                    if (p.charAt(j - 2) == s.charAt(i - 1) || p.charAt(j - 2) == '.') {
                        dp[i][j] = dp[i][j] || dp[i - 1][j];
                    }
                } else if (p.charAt(j - 1) == s.charAt(i - 1) || p.charAt(j - 1) == '.') {
                    dp[i][j] = dp[i - 1][j - 1];
                }
            }
        }
        return dp[m][n];
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function isMatch(s, p) {
    const m = s.length, n = p.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
    dp[0][0] = true;

    for (let j = 2; j <= n; j++) {
        if (p[j - 1] === '*') dp[0][j] = dp[0][j - 2];   // "a*" matches ""
    }

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (p[j - 1] === '*') {
                dp[i][j] = dp[i][j - 2];                  // zero of p[j-2]
                if (p[j - 2] === s[i - 1] || p[j - 2] === '.') {
                    dp[i][j] = dp[i][j] || dp[i - 1][j];  // one more of it
                }
            } else if (p[j - 1] === s[i - 1] || p[j - 1] === '.') {
                dp[i][j] = dp[i - 1][j - 1];
            }
        }
    }
    return dp[m][n];
}`,
            },
        ],
        followUps: [
            'Why dp[i-1][j] and not dp[i-1][j-2] in the "one more" branch?',
            'Test s = "" with p = "a*". What does skipping the base row return?',
            'Wildcard Matching (Leetcode 44) — "*" matches any sequence. Simpler or harder?',
        ],
    },

    'burst-balloons': {
        restate:
            'Bursting balloon i earns `left * i * right` using its CURRENT neighbours. Maximise the total.',
        body: `The hardest problem on the sheet, and the one where the standard DP instinct is actively wrong.

**Why the obvious framing fails:** if you ask "which balloon do I burst *first*", the array splits into two halves whose neighbours now depend on what happened in the other half. The subproblems are not independent, so there is nothing to memoise.

**The observation — ask which balloon is burst LAST.** If balloon \`k\` is last in the range \`(left, right)\`, then by the time it pops everything else in that range is gone, so its neighbours are exactly \`left\` and \`right\` — the range boundaries, which are *fixed*. That single change makes the two sides independent, and only then does DP apply.

**\`dp[left][right]\` means: the best coins obtainable from bursting every balloon strictly between left and right.**

\`\`\`
dp[left][right] = max over k in (left, right) of
    nums[left] * nums[k] * nums[right] + dp[left][k] + dp[k][right]
\`\`\`

**Pad the array with 1s at both ends.** A balloon at the edge behaves as if its missing neighbour were 1, and padding makes that automatic instead of a special case in the inner loop.

**Fill by increasing range width**, not by row — \`dp[left][right]\` reads strictly smaller ranges, so they must already exist. Iterating rows top-to-bottom reads cells that have not been computed and silently uses zeros.

**The trap:** \`dp[left][k]\` and \`dp[k][right]\`, **not** \`dp[left][k-1]\` and \`dp[k+1][right]\`. The bounds are exclusive, so \`k\` itself is already outside both subranges. Using the inclusive form drops the balloons adjacent to \`k\`.

Be honest in an interview: state the failed first-burst framing, then the reversal. That reasoning is the whole answer.`,
        complexity: { time: 'O(n³)', space: 'O(n²)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int maxCoins(vector<int>& nums) {
        vector<int> a;
        a.push_back(1);                            // pad: edge neighbour = 1
        for (int x : nums) a.push_back(x);
        a.push_back(1);
        int n = a.size();

        vector<vector<int>> dp(n, vector<int>(n, 0));

        // BY INCREASING WIDTH — smaller ranges must already be solved.
        for (int width = 2; width < n; width++) {
            for (int left = 0; left + width < n; left++) {
                int right = left + width;
                for (int k = left + 1; k < right; k++) {
                    // k is LAST, so its neighbours are the fixed boundaries.
                    int coins = a[left] * a[k] * a[right]
                              + dp[left][k] + dp[k][right];  // exclusive bounds
                    dp[left][right] = max(dp[left][right], coins);
                }
            }
        }
        return dp[0][n - 1];
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int maxCoins(int[] nums) {
        int n = nums.length + 2;
        int[] a = new int[n];
        a[0] = 1; a[n - 1] = 1;
        for (int i = 0; i < nums.length; i++) a[i + 1] = nums[i];

        int[][] dp = new int[n][n];

        for (int width = 2; width < n; width++) {
            for (int left = 0; left + width < n; left++) {
                int right = left + width;
                for (int k = left + 1; k < right; k++) {
                    int coins = a[left] * a[k] * a[right] + dp[left][k] + dp[k][right];
                    dp[left][right] = Math.max(dp[left][right], coins);
                }
            }
        }
        return dp[0][n - 1];
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function maxCoins(nums) {
    const a = [1, ...nums, 1];      // padding removes the edge special case
    const n = a.length;
    const dp = Array.from({ length: n }, () => new Array(n).fill(0));

    for (let width = 2; width < n; width++) {        // increasing range width
        for (let left = 0; left + width < n; left++) {
            const right = left + width;
            for (let k = left + 1; k < right; k++) {
                // Burst k LAST: its neighbours are left and right, which are fixed.
                const coins = a[left] * a[k] * a[right] + dp[left][k] + dp[k][right];
                dp[left][right] = Math.max(dp[left][right], coins);
            }
        }
    }
    return dp[0][n - 1];
}`,
            },
        ],
        followUps: [
            'Why does "which balloon first" fail but "which balloon last" work?',
            'Why dp[left][k] rather than dp[left][k-1]?',
            'What breaks if you fill the table row by row instead of by width?',
        ],
    },
};
