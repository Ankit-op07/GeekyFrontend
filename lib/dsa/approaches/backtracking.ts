// lib/dsa/approaches/backtracking.ts
//
// "Our approach" pages for the Backtracking section.
//
// Same four beats as every other approach file (brute force → why it is too
// slow → the observation → the trap); see approaches/arrays-hashing.ts for the
// house style in full.
//
// EVERY PROBLEM HERE IS THE SAME THREE LINES, stated once so the pages do not
// each re-derive it:
//
//     choose      — add a candidate to the current partial answer
//     recurse     — solve the rest with that choice made
//     un-choose   — remove it and try the next candidate
//
// The skeleton is never the difficulty. Only two things vary, and they are
// where every page spends its words:
//
//   1. THE DUPLICATE RULE. Sort first, then skip a candidate when it equals its
//      predecessor AND the predecessor was not taken on this branch. Subsets II
//      and Combination Sum II are that rule; the condition "i > start" is what
//      encodes it.
//   2. THE PRUNE. What lets you abandon a branch before exploring it. Sorting
//      plus an early break in Combination Sum; the column/diagonal sets in
//      N-Queens; the board mutation in Word Search.
//
// ON COMPLEXITY: the output is usually exponential, so the algorithm must be
// too — you cannot beat O(2^n) when there are 2^n subsets to print. Say the
// bound in terms of the OUTPUT SIZE, which is what makes it a fair bound rather
// than an admission of defeat.
//
// ONE HABIT: the un-choose must exactly undo the choose. If you appended, pop.
// If you mutated the board, restore it. A missing un-choose is the single most
// common bug in this section, and it shows up as answers that accumulate junk
// from sibling branches rather than as a crash.

import type { DsaApproach } from '../types';

export const backtrackingApproaches: Record<string, DsaApproach> = {
    subsets: {
        restate: 'Return every subset of a set of distinct numbers — the power set.',
        body: `The skeleton in its purest form, and the right place to learn it.

**The observation:** for each element you make one binary decision — take it or skip it. Two choices at each of \`n\` elements gives \`2ⁿ\` subsets, which is exactly the answer size, so this is optimal.

The recursion carries an index and the current partial subset:

- **Take** \`nums[i]\`: push it, recurse on \`i + 1\`, then **pop** — that pop is the un-choose.
- **Skip** it: recurse on \`i + 1\` with nothing added.

When \`i\` reaches the end, record a copy of the current subset. **A copy, not a reference** — the same array keeps being mutated as the recursion continues, so storing a reference means every entry in the result ends up pointing at the same (eventually empty) array. This is the trap, and it produces a result of the right *length* full of wrong values, which is much harder to spot than a crash.

**The loop form is worth knowing too.** Instead of take/skip, loop \`i\` from \`start\` to the end, recursing with \`i + 1\`, and record at *every* node rather than only at the leaves. It generalises directly to Subsets II and Combination Sum, so it is the shape the rest of the section uses.

**The bitmask alternative:** count from \`0\` to \`2ⁿ - 1\` and read each number's bits as a take/skip mask. No recursion at all, and worth mentioning — it is how you would generate subsets iteratively.`,
        complexity: { time: 'O(n · 2^n) — 2^n subsets, each O(n) to copy', space: 'O(n) recursion' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    void build(vector<int>& nums, int i, vector<int>& cur, vector<vector<int>>& out) {
        if (i == (int)nums.size()) {
            out.push_back(cur);      // a COPY — cur keeps mutating below
            return;
        }
        cur.push_back(nums[i]);      // choose
        build(nums, i + 1, cur, out);
        cur.pop_back();              // un-choose
        build(nums, i + 1, cur, out);   // skip
    }
public:
    vector<vector<int>> subsets(vector<int>& nums) {
        vector<vector<int>> out;
        vector<int> cur;
        build(nums, 0, cur, out);
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private void build(int[] nums, int i, List<Integer> cur, List<List<Integer>> out) {
        if (i == nums.length) {
            out.add(new ArrayList<>(cur));   // copy, not the live list
            return;
        }
        cur.add(nums[i]);
        build(nums, i + 1, cur, out);
        cur.remove(cur.size() - 1);
        build(nums, i + 1, cur, out);
    }

    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> out = new ArrayList<>();
        build(nums, 0, new ArrayList<>(), out);
        return out;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function subsets(nums) {
    const out = [];
    const cur = [];

    const build = (i) => {
        if (i === nums.length) {
            out.push([...cur]);     // spread = copy; pushing cur itself breaks it
            return;
        }
        cur.push(nums[i]);          // choose
        build(i + 1);
        cur.pop();                  // un-choose
        build(i + 1);               // skip
    };

    build(0);
    return out;
}`,
            },
        ],
        followUps: [
            'What does the result look like if you push cur without copying it?',
            'Generate the subsets with a bitmask instead of recursion.',
            'Rewrite it in the loop form (start index, record at every node).',
        ],
    },

    'combination-sum': {
        restate:
            'All unique combinations of candidates summing to a target. Each candidate may be reused unlimited times.',
        body: `Distinct candidates, but unlimited reuse — so the shape differs from Subsets in exactly one index.

**The observation:** recurse with \`i\`, not \`i + 1\`. Passing the same index back means the current candidate stays available, which is what "unlimited reuse" means. Passing \`i + 1\` would consume it, giving you Combination Sum II's semantics instead.

**Why the answers are still unique:** the loop starts at \`start\` rather than 0, so a combination is only ever built in non-decreasing index order. \`[2,3]\` gets generated; \`[3,2]\` never does, because once you have moved past index of 2 you cannot go back. Ordering the search is what removes the duplicates — no set required.

Two base cases: \`remaining == 0\` records a copy; \`remaining < 0\` abandons the branch.

**The prune that matters:** sort the candidates first, then \`break\` (not \`continue\`) the moment \`candidates[i] > remaining\`. Because the array is sorted, every later candidate is also too large, so the whole rest of the loop is dead. \`continue\` would test each one individually and do the same amount of work as no prune at all.

That single \`break\` is the difference between comfortably passing and timing out on adversarial inputs, and it is the thing to mention unprompted.

**The trap:** subtracting from \`remaining\` and forgetting to add it back is not needed here — \`remaining - candidates[i]\` is passed as an argument, so each branch gets its own copy. Only the *list* needs undoing.`,
        complexity: { time: 'O(n^(target/min))', space: 'O(target/min) recursion depth' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    void build(vector<int>& c, int start, int remain, vector<int>& cur,
               vector<vector<int>>& out) {
        if (remain == 0) { out.push_back(cur); return; }

        for (int i = start; i < (int)c.size(); i++) {
            // Sorted, so everything after this is also too big: BREAK, not continue.
            if (c[i] > remain) break;
            cur.push_back(c[i]);
            build(c, i, remain - c[i], cur, out);   // i, not i+1: reuse allowed
            cur.pop_back();
        }
    }
public:
    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {
        sort(candidates.begin(), candidates.end());   // enables the break
        vector<vector<int>> out;
        vector<int> cur;
        build(candidates, 0, target, cur, out);
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private void build(int[] c, int start, int remain, List<Integer> cur,
                       List<List<Integer>> out) {
        if (remain == 0) { out.add(new ArrayList<>(cur)); return; }

        for (int i = start; i < c.length; i++) {
            if (c[i] > remain) break;
            cur.add(c[i]);
            build(c, i, remain - c[i], cur, out);
            cur.remove(cur.size() - 1);
        }
    }

    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        Arrays.sort(candidates);
        List<List<Integer>> out = new ArrayList<>();
        build(candidates, 0, target, new ArrayList<>(), out);
        return out;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function combinationSum(candidates, target) {
    const c = [...candidates].sort((a, b) => a - b);
    const out = [];
    const cur = [];

    const build = (start, remain) => {
        if (remain === 0) { out.push([...cur]); return; }

        for (let i = start; i < c.length; i++) {
            if (c[i] > remain) break;      // sorted: the rest are too big too
            cur.push(c[i]);
            build(i, remain - c[i]);       // i keeps this candidate available
            cur.pop();
        }
    };

    build(0, target);
    return out;
}`,
            },
        ],
        followUps: [
            'Why does the loop starting at "start" make the answers unique without a set?',
            'What changes if each candidate may be used only once?',
            'Why break rather than continue, and what does sorting buy you?',
        ],
    },

    permutations: {
        restate: 'Every ordering of a list of distinct numbers.',
        body: `The first problem where **order matters**, which changes the shape: subsets and combinations only ever move forward through the array, permutations must be able to reach back.

**The observation:** at each position, any *unused* element may go next. So instead of a start index, you need a way to know what has already been placed.

Two standard implementations:

**Used array** — a boolean per index. Skip anything already used; mark on choose, unmark on un-choose. Clear, and it extends directly to the duplicates variant (Leetcode 47).

**In-place swapping** — swap element \`i\` into position \`start\`, recurse on \`start + 1\`, swap back. No extra memory, and the un-choose is the reverse swap. Elegant but harder to adapt when duplicates appear, because the swaps destroy the sorted order the duplicate rule relies on.

Give the used-array version unless asked for \`O(1)\` extra space.

**The trap:** unmark on the way out. Leaving \`used[i] = true\` after returning means later branches at the same level believe that element is still taken, and you silently emit fewer permutations than exist — a wrong answer with no error.

**Complexity:** \`n!\` permutations, each \`O(n)\` to copy, so \`O(n · n!)\`. That is the output size; no algorithm does better.

**One subtlety worth knowing:** the swapping version does not produce permutations in lexicographic order, and the used-array version does when the input is sorted. If a problem asks for sorted output, that choice is not cosmetic.`,
        complexity: { time: 'O(n · n!)', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    void build(vector<int>& nums, vector<bool>& used, vector<int>& cur,
               vector<vector<int>>& out) {
        if (cur.size() == nums.size()) { out.push_back(cur); return; }

        for (int i = 0; i < (int)nums.size(); i++) {
            if (used[i]) continue;
            used[i] = true;                 // choose
            cur.push_back(nums[i]);
            build(nums, used, cur, out);
            cur.pop_back();                 // un-choose — BOTH lines
            used[i] = false;
        }
    }
public:
    vector<vector<int>> permute(vector<int>& nums) {
        vector<vector<int>> out;
        vector<int> cur;
        vector<bool> used(nums.size(), false);
        build(nums, used, cur, out);
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private void build(int[] nums, boolean[] used, List<Integer> cur,
                       List<List<Integer>> out) {
        if (cur.size() == nums.length) { out.add(new ArrayList<>(cur)); return; }

        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            cur.add(nums[i]);
            build(nums, used, cur, out);
            cur.remove(cur.size() - 1);
            used[i] = false;
        }
    }

    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> out = new ArrayList<>();
        build(nums, new boolean[nums.length], new ArrayList<>(), out);
        return out;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function permute(nums) {
    const out = [];
    const cur = [];
    const used = new Array(nums.length).fill(false);

    const build = () => {
        if (cur.length === nums.length) { out.push([...cur]); return; }

        for (let i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            cur.push(nums[i]);
            build();
            cur.pop();
            used[i] = false;    // unmark, or later branches see it as taken
        }
    };

    build();
    return out;
}`,
            },
        ],
        followUps: [
            'What happens if you forget used[i] = false?',
            'Write the in-place swapping version. Why is it harder to extend to duplicates?',
            'Permutations II (Leetcode 47) — the input has duplicates.',
        ],
    },

    'subsets-ii': {
        restate: 'Every unique subset, where the input may contain duplicates.',
        body: `Subsets with the duplicate rule — the rule the section header names, and the one worth learning properly because Combination Sum II is the same line.

**Why a set does not do:** collecting every subset and deduplicating works but is wasteful (you generate the duplicates then throw them away) and needs a canonical form to hash, since \`[1,2]\` and \`[2,1]\` are the same subset. Prevent them instead.

**The observation:** equal values are interchangeable, so choosing the *first* 2 at a level and choosing the *second* 2 at the same level produce the same subset. Sort so equal values are adjacent, then at each level skip a value equal to its predecessor.

The condition is:

\`\`\`
if (i > start && nums[i] == nums[i - 1]) continue;
\`\`\`

**The \`i > start\` half is the whole rule and is where people go wrong.** It means "skip only when this is not the first candidate *at this level*". The first occurrence must still be usable, otherwise \`[2,2]\` never gets built at all. Dropping it removes legitimate subsets; keeping only the equality test removes too much.

Read it as: *duplicates may be used consecutively going deeper, never as alternatives at the same level.*

**The trap:** forgetting to sort. The rule relies entirely on equal values being adjacent, and on unsorted input it silently skips nothing and duplicates reappear.

Record at **every** node, not just the leaves — every prefix is itself a valid subset.`,
        complexity: { time: 'O(n · 2^n)', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    void build(vector<int>& nums, int start, vector<int>& cur,
               vector<vector<int>>& out) {
        out.push_back(cur);          // every prefix is a subset

        for (int i = start; i < (int)nums.size(); i++) {
            // i > start: the FIRST occurrence at this level is still allowed.
            if (i > start && nums[i] == nums[i - 1]) continue;
            cur.push_back(nums[i]);
            build(nums, i + 1, cur, out);
            cur.pop_back();
        }
    }
public:
    vector<vector<int>> subsetsWithDup(vector<int>& nums) {
        sort(nums.begin(), nums.end());   // REQUIRED: the rule needs adjacency
        vector<vector<int>> out;
        vector<int> cur;
        build(nums, 0, cur, out);
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private void build(int[] nums, int start, List<Integer> cur,
                       List<List<Integer>> out) {
        out.add(new ArrayList<>(cur));

        for (int i = start; i < nums.length; i++) {
            if (i > start && nums[i] == nums[i - 1]) continue;
            cur.add(nums[i]);
            build(nums, i + 1, cur, out);
            cur.remove(cur.size() - 1);
        }
    }

    public List<List<Integer>> subsetsWithDup(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> out = new ArrayList<>();
        build(nums, 0, new ArrayList<>(), out);
        return out;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function subsetsWithDup(nums) {
    const a = [...nums].sort((x, y) => x - y);
    const out = [];
    const cur = [];

    const build = (start) => {
        out.push([...cur]);

        for (let i = start; i < a.length; i++) {
            if (i > start && a[i] === a[i - 1]) continue;   // same level only
            cur.push(a[i]);
            build(i + 1);
            cur.pop();
        }
    };

    build(0);
    return out;
}`,
            },
        ],
        followUps: [
            'What is missing from the output if the condition is just nums[i] === nums[i-1]?',
            'Why must the input be sorted?',
            'Permutations II uses a similar but subtly different rule. What is the difference?',
        ],
    },

    'combination-sum-ii': {
        restate:
            'Unique combinations summing to a target, where the input has duplicates and each element may be used at most once.',
        body: `Two changes from Combination Sum, and both are one character.

**Each element used once** → recurse with \`i + 1\` instead of \`i\`.

**Duplicates in the input** → the Subsets II rule, unchanged:

\`\`\`
if (i > start && candidates[i] == candidates[i - 1]) continue;
\`\`\`

That is the whole problem. Its value is showing that the two rules are independent and compose: "reuse or not" is the recursion index, "duplicates or not" is the skip condition, and you pick each separately.

**The distinction that confuses people:** \`[1,1,6]\` is a *valid* combination when the input contains two 1s — using both is legitimate, because they are different elements. What must not happen is producing \`[1,6]\` twice, once for each 1. The \`i > start\` guard draws exactly that line: consecutive uses going deeper are fine, alternatives at the same level are not.

**Both prunes still apply.** Sort (needed for the duplicate rule anyway), then \`break\` when \`candidates[i] > remaining\`. You get the prune for free from the sort you already needed.

**The trap:** using \`i + 1\` in the recursion but forgetting the duplicate skip. The output is then correct in *content* but contains repeats, which passes small hand-written tests and fails the real ones.`,
        complexity: { time: 'O(2^n)', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    void build(vector<int>& c, int start, int remain, vector<int>& cur,
               vector<vector<int>>& out) {
        if (remain == 0) { out.push_back(cur); return; }

        for (int i = start; i < (int)c.size(); i++) {
            if (i > start && c[i] == c[i - 1]) continue;   // duplicate rule
            if (c[i] > remain) break;                      // sorted prune
            cur.push_back(c[i]);
            build(c, i + 1, remain - c[i], cur, out);      // i+1: use once
            cur.pop_back();
        }
    }
public:
    vector<vector<int>> combinationSum2(vector<int>& candidates, int target) {
        sort(candidates.begin(), candidates.end());
        vector<vector<int>> out;
        vector<int> cur;
        build(candidates, 0, target, cur, out);
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private void build(int[] c, int start, int remain, List<Integer> cur,
                       List<List<Integer>> out) {
        if (remain == 0) { out.add(new ArrayList<>(cur)); return; }

        for (int i = start; i < c.length; i++) {
            if (i > start && c[i] == c[i - 1]) continue;
            if (c[i] > remain) break;
            cur.add(c[i]);
            build(c, i + 1, remain - c[i], cur, out);
            cur.remove(cur.size() - 1);
        }
    }

    public List<List<Integer>> combinationSum2(int[] candidates, int target) {
        Arrays.sort(candidates);
        List<List<Integer>> out = new ArrayList<>();
        build(candidates, 0, target, new ArrayList<>(), out);
        return out;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function combinationSum2(candidates, target) {
    const c = [...candidates].sort((a, b) => a - b);
    const out = [];
    const cur = [];

    const build = (start, remain) => {
        if (remain === 0) { out.push([...cur]); return; }

        for (let i = start; i < c.length; i++) {
            if (i > start && c[i] === c[i - 1]) continue;
            if (c[i] > remain) break;
            cur.push(c[i]);
            build(i + 1, remain - c[i]);
            cur.pop();
        }
    };

    build(0, target);
    return out;
}`,
            },
        ],
        followUps: [
            'Why is [1,1,6] valid but [1,6] appearing twice not?',
            'Which single character separates this from Combination Sum I?',
            'What if elements could be reused AND duplicates existed in the input?',
        ],
    },

    'letter-combinations-of-a-phone-number': {
        restate: 'Every string you can type on a phone keypad from a sequence of digits.',
        body: `The simplest backtracking problem on the sheet, and useful precisely because there is nothing to prune — the skeleton alone is the answer.

**The observation:** each digit contributes one character, chosen from its 3 or 4 letters. That is a **cartesian product**: the recursion depth is fixed at the number of digits, and the branching factor at each level is that digit's letter count.

Recurse on the digit index. At each level, loop the letters for that digit, append, recurse on the next index, pop. When the index reaches the end, record the string.

Unlike the combination problems there is no \`start\` index — every digit gets its own level and there is nothing to skip.

**The trap that catches people:** an empty input must return an **empty list**, not a list containing an empty string. Guard \`digits.length == 0\` before recursing, because the base case would otherwise record \`""\` as a valid combination. Nearly every wrong submission here is that one case.

**Two details:** map digits to letters with a lookup table rather than arithmetic — 7 and 9 have four letters, so \`(digit - 2) * 3\` is wrong past 6. And there is no 0 or 1 on the keypad; the constraints exclude them, so no handling is needed, but say you noticed.

**Complexity:** \`O(4ⁿ · n)\` — at most 4 letters per digit, and each finished string costs \`O(n)\` to build. Exponential in the output size, which is unavoidable.`,
        complexity: { time: 'O(4^n · n)', space: 'O(n) recursion' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    const vector<string> pad = {"", "", "abc", "def", "ghi", "jkl",
                               "mno", "pqrs", "tuv", "wxyz"};

    void build(const string& digits, int i, string& cur, vector<string>& out) {
        if (i == (int)digits.size()) { out.push_back(cur); return; }

        for (char c : pad[digits[i] - '0']) {
            cur.push_back(c);
            build(digits, i + 1, cur, out);
            cur.pop_back();
        }
    }
public:
    vector<string> letterCombinations(string digits) {
        if (digits.empty()) return {};    // NOT {""} — the classic wrong answer
        vector<string> out;
        string cur;
        build(digits, 0, cur, out);
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private static final String[] PAD = {"", "", "abc", "def", "ghi", "jkl",
                                         "mno", "pqrs", "tuv", "wxyz"};

    private void build(String digits, int i, StringBuilder cur, List<String> out) {
        if (i == digits.length()) { out.add(cur.toString()); return; }

        for (char c : PAD[digits.charAt(i) - '0'].toCharArray()) {
            cur.append(c);
            build(digits, i + 1, cur, out);
            cur.deleteCharAt(cur.length() - 1);
        }
    }

    public List<String> letterCombinations(String digits) {
        if (digits.isEmpty()) return new ArrayList<>();
        List<String> out = new ArrayList<>();
        build(digits, 0, new StringBuilder(), out);
        return out;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function letterCombinations(digits) {
    if (!digits.length) return [];   // empty list, not ['']

    const pad = ['', '', 'abc', 'def', 'ghi', 'jkl', 'mno', 'pqrs', 'tuv', 'wxyz'];
    const out = [];
    const cur = [];

    const build = (i) => {
        if (i === digits.length) { out.push(cur.join('')); return; }

        for (const c of pad[Number(digits[i])]) {
            cur.push(c);
            build(i + 1);
            cur.pop();
        }
    };

    build(0);
    return out;
}`,
            },
        ],
        followUps: [
            'What does the empty input return without the guard, and why is that wrong?',
            'Why is a lookup table better than computing the letters arithmetically?',
            'Solve it iteratively by building the product level by level.',
        ],
    },

    'word-search': {
        restate:
            'Can a word be spelled by walking adjacent cells on a board, without reusing a cell?',
        body: `Backtracking on a grid rather than on a list, and the "un-choose" becomes physical.

**The observation:** from a starting cell, try all four neighbours for the next character. If a path dies, back out and try another. The only extra requirement is "no cell reused *within this path*" — and that is where the backtracking lives.

**Mark by mutating the board, restore on the way out.** Write a sentinel such as \`#\` into the cell before recursing and put the original character back afterwards. That gives you the visited check for free and \`O(1)\` extra space, and it is the classic move for grid backtracking.

**Why not a persistent visited set:** the constraint is per-path, not global. A cell used in one failed attempt must be available to a different path. A visited set that is never cleared reports false on boards where the answer is true — and the restore *is* the clearing.

**The order of the guards matters.** Check bounds, then check the character matches, then check the sentinel. Checking the character before bounds reads out of the array.

**The base case:** \`i == word.length()\` returns true *before* any bounds check — the word is complete and there is nothing left to match.

**Complexity:** \`O(m · n · 4^L)\` — every cell as a start, four directions at each of \`L\` steps. The character check prunes almost all of it in practice.

**The natural follow-up is Word Search II**, in the Tries section: this per-word search run 30,000 times is hopeless, which is exactly what the trie fixes.`,
        complexity: { time: 'O(m · n · 4^L)', space: 'O(L) recursion' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    bool dfs(vector<vector<char>>& b, const string& word, int r, int c, int i) {
        if (i == (int)word.size()) return true;              // complete
        if (r < 0 || c < 0 || r >= (int)b.size() || c >= (int)b[0].size()) return false;
        if (b[r][c] != word[i]) return false;                // bounds BEFORE this

        char saved = b[r][c];
        b[r][c] = '#';                                       // mark
        bool found = dfs(b, word, r + 1, c, i + 1)
                  || dfs(b, word, r - 1, c, i + 1)
                  || dfs(b, word, r, c + 1, i + 1)
                  || dfs(b, word, r, c - 1, i + 1);
        b[r][c] = saved;                                     // restore = un-choose
        return found;
    }
public:
    bool exist(vector<vector<char>>& board, string word) {
        for (int r = 0; r < (int)board.size(); r++)
            for (int c = 0; c < (int)board[0].size(); c++)
                if (dfs(board, word, r, c, 0)) return true;
        return false;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private boolean dfs(char[][] b, String word, int r, int c, int i) {
        if (i == word.length()) return true;
        if (r < 0 || c < 0 || r >= b.length || c >= b[0].length) return false;
        if (b[r][c] != word.charAt(i)) return false;

        char saved = b[r][c];
        b[r][c] = '#';
        boolean found = dfs(b, word, r + 1, c, i + 1)
                     || dfs(b, word, r - 1, c, i + 1)
                     || dfs(b, word, r, c + 1, i + 1)
                     || dfs(b, word, r, c - 1, i + 1);
        b[r][c] = saved;
        return found;
    }

    public boolean exist(char[][] board, String word) {
        for (int r = 0; r < board.length; r++)
            for (int c = 0; c < board[0].length; c++)
                if (dfs(board, word, r, c, 0)) return true;
        return false;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function exist(board, word) {
    const rows = board.length, cols = board[0].length;

    const dfs = (r, c, i) => {
        if (i === word.length) return true;
        if (r < 0 || c < 0 || r >= rows || c >= cols) return false;
        if (board[r][c] !== word[i]) return false;

        const saved = board[r][c];
        board[r][c] = '#';                 // mark: no reuse within THIS path
        const found = dfs(r + 1, c, i + 1) || dfs(r - 1, c, i + 1)
                   || dfs(r, c + 1, i + 1) || dfs(r, c - 1, i + 1);
        board[r][c] = saved;               // restore for other paths
        return found;
    };

    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
            if (dfs(r, c, 0)) return true;
    return false;
}`,
            },
        ],
        followUps: [
            'Why a per-path mark rather than a global visited set?',
            'What breaks if you check the character before the bounds?',
            'Word Search II — 30,000 words at once. Why does this approach collapse?',
        ],
    },

    'palindrome-partitioning': {
        restate: 'Every way of cutting a string so that each piece is a palindrome.',
        body: `Backtracking where the choice is **where to cut**, not which element to take.

**The observation:** at each position, try every possible next cut. If the prefix from here to the cut is a palindrome, take it and recurse on the remainder; otherwise skip that cut. The palindrome test *is* the pruning rule — an invalid prefix kills the entire branch, so no work is wasted on partitions that could never be valid.

The loop runs \`end\` from \`start\` to the end of the string, and recursion continues at \`end + 1\`. When \`start\` passes the last index, the current list of pieces is a complete partition — record a copy.

**The trap:** recurse from \`end + 1\`, not from \`start + 1\`. Using \`start + 1\` advances by one character regardless of how long the piece you just took was, so pieces overlap and the output is nonsense that still looks structurally plausible.

**The optimisation worth naming:** the naive palindrome check is \`O(n)\` per candidate, making the whole thing \`O(n · 2ⁿ)\`. Precompute a table \`isPal[i][j]\` with the DP recurrence \`s[i] == s[j] && isPal[i+1][j-1]\` and each check becomes \`O(1)\`. That is why this problem carries a \`dp\` tag despite living in Backtracking — and mentioning it is usually what separates a good answer from a complete one.

For the constraint here (\`n <= 16\`) the naive check is fine. Say that you know the table exists and why you are not bothering.`,
        complexity: { time: 'O(n · 2^n)', space: 'O(n) — O(n²) with the DP table' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    bool isPal(const string& s, int l, int r) {
        while (l < r) if (s[l++] != s[r--]) return false;
        return true;
    }
    void build(const string& s, int start, vector<string>& cur,
               vector<vector<string>>& out) {
        if (start == (int)s.size()) { out.push_back(cur); return; }

        for (int end = start; end < (int)s.size(); end++) {
            if (!isPal(s, start, end)) continue;      // the prune
            cur.push_back(s.substr(start, end - start + 1));
            build(s, end + 1, cur, out);              // end+1, NOT start+1
            cur.pop_back();
        }
    }
public:
    vector<vector<string>> partition(string s) {
        vector<vector<string>> out;
        vector<string> cur;
        build(s, 0, cur, out);
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private boolean isPal(String s, int l, int r) {
        while (l < r) if (s.charAt(l++) != s.charAt(r--)) return false;
        return true;
    }

    private void build(String s, int start, List<String> cur,
                       List<List<String>> out) {
        if (start == s.length()) { out.add(new ArrayList<>(cur)); return; }

        for (int end = start; end < s.length(); end++) {
            if (!isPal(s, start, end)) continue;
            cur.add(s.substring(start, end + 1));
            build(s, end + 1, cur, out);
            cur.remove(cur.size() - 1);
        }
    }

    public List<List<String>> partition(String s) {
        List<List<String>> out = new ArrayList<>();
        build(s, 0, new ArrayList<>(), out);
        return out;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function partition(s) {
    const out = [];
    const cur = [];

    const isPal = (l, r) => {
        while (l < r) if (s[l++] !== s[r--]) return false;
        return true;
    };

    const build = (start) => {
        if (start === s.length) { out.push([...cur]); return; }

        for (let end = start; end < s.length; end++) {
            if (!isPal(start, end)) continue;
            cur.push(s.slice(start, end + 1));
            build(end + 1);          // continue AFTER the piece just taken
            cur.pop();
        }
    };

    build(0);
    return out;
}`,
            },
        ],
        followUps: [
            'What does recursing from start + 1 produce? Trace "aab".',
            'Precompute the isPal table. What is the recurrence?',
            'Palindrome Partitioning II — the MINIMUM number of cuts. Why is backtracking the wrong tool there?',
        ],
    },

    'n-queens': {
        restate:
            'Place n queens on an n×n board so that none attack each other, and return every arrangement.',
        body: `The hardest problem in the section, and the one where **the prune is the whole solution**.

**The first reduction:** exactly one queen per row, or two would share a row. So the search is one decision per row — which column — and the depth is fixed at \`n\`. That alone takes the search space from \`C(n², n)\` to \`nⁿ\`.

**The prune:** track which **columns** and which **diagonals** are already occupied, so a conflicting square is rejected in \`O(1)\` rather than by scanning the board.

**Diagonals get identified by an arithmetic identity**, and this is the trick worth remembering:

- Cells on a **↘ diagonal** share \`row - col\` (offset by \`n - 1\` to keep the index non-negative).
- Cells on a **↙ diagonal** share \`row + col\`.

Three sets — columns, both diagonal families — turn the safety check into three lookups. Without them you scan up to \`O(n)\` squares per placement and the whole thing crawls.

**The skeleton is unchanged:** for each column in this row, if safe → mark the three sets, place, recurse to the next row, then **unmark all three**. Reaching row \`n\` means every queen is placed; render the board and record it.

**Two traps.**

**Unmark everything you marked.** Three sets, three removals. Missing one leaves phantom attacks that silently suppress valid solutions — you get *fewer* answers, not wrong ones, which is much harder to notice.

**Do not check rows.** One queen per row is structural, not something to verify. Checking it wastes time and suggests you have not seen the reduction.

**Complexity** is roughly \`O(n!)\` — the first row has \`n\` choices, the next at most \`n - 1\`, and so on. Exponential is unavoidable; the pruning is what makes \`n = 9\` finish instantly.`,
        complexity: { time: 'O(n!)', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    int n;
    vector<bool> cols, diag, anti;   // anti = r+c, diag = r-c+n-1
    vector<int> pos;                 // pos[row] = column
    vector<vector<string>> out;

    void place(int row) {
        if (row == n) {
            vector<string> board;
            for (int r = 0; r < n; r++) {
                string line(n, '.');
                line[pos[r]] = 'Q';
                board.push_back(line);
            }
            out.push_back(board);
            return;
        }
        for (int c = 0; c < n; c++) {
            int d = row - c + n - 1, a = row + c;
            if (cols[c] || diag[d] || anti[a]) continue;   // O(1) safety check
            cols[c] = diag[d] = anti[a] = true;
            pos[row] = c;
            place(row + 1);
            cols[c] = diag[d] = anti[a] = false;           // unmark ALL THREE
        }
    }
public:
    vector<vector<string>> solveNQueens(int nn) {
        n = nn;
        cols.assign(n, false);
        diag.assign(2 * n, false);
        anti.assign(2 * n, false);
        pos.assign(n, 0);
        out.clear();
        place(0);
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private int n;
    private boolean[] cols, diag, anti;
    private int[] pos;
    private List<List<String>> out;

    private void place(int row) {
        if (row == n) {
            List<String> board = new ArrayList<>();
            for (int r = 0; r < n; r++) {
                char[] line = new char[n];
                Arrays.fill(line, '.');
                line[pos[r]] = 'Q';
                board.add(new String(line));
            }
            out.add(board);
            return;
        }
        for (int c = 0; c < n; c++) {
            int d = row - c + n - 1, a = row + c;
            if (cols[c] || diag[d] || anti[a]) continue;
            cols[c] = diag[d] = anti[a] = true;
            pos[row] = c;
            place(row + 1);
            cols[c] = diag[d] = anti[a] = false;
        }
    }

    public List<List<String>> solveNQueens(int n) {
        this.n = n;
        cols = new boolean[n];
        diag = new boolean[2 * n];
        anti = new boolean[2 * n];
        pos = new int[n];
        out = new ArrayList<>();
        place(0);
        return out;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function solveNQueens(n) {
    const cols = new Set(), diag = new Set(), anti = new Set();
    const pos = new Array(n).fill(0);
    const out = [];

    const place = (row) => {
        if (row === n) {
            out.push(pos.map((c) => '.'.repeat(c) + 'Q' + '.'.repeat(n - c - 1)));
            return;
        }
        for (let c = 0; c < n; c++) {
            const d = row - c, a = row + c;    // the two diagonal identities
            if (cols.has(c) || diag.has(d) || anti.has(a)) continue;

            cols.add(c); diag.add(d); anti.add(a);
            pos[row] = c;
            place(row + 1);
            cols.delete(c); diag.delete(d); anti.delete(a);   // undo all three
        }
    };

    place(0);
    return out;
}`,
            },
        ],
        followUps: [
            'Derive the two diagonal identities. Why does row - col need the +n-1 offset in an array?',
            'N-Queens II (Leetcode 52) — count solutions only. What can you drop?',
            'What is the symptom of forgetting to unmark just ONE of the three sets?',
        ],
    },
};
