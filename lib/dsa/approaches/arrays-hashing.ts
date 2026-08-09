// lib/dsa/approaches/arrays-hashing.ts
//
// "Our approach" pages for the Arrays & Hashing section.
//
// HOUSE STYLE — every `body` follows the same four beats:
//   1. the brute force, and the specific reason it is too slow
//   2. the one observation that unlocks the better solution
//   3. the algorithm that falls out of that observation
//   4. the trap (the off-by-one, the duplicate case, the overflow)
// A learner who reads only beat 2 should still leave with the idea. That is
// what a solution page is FOR — the code is available on LeetCode already; the
// reason anyone comes here is the sentence that makes the code obvious.
//
// Code is verified by hand against the problem's constraints, not executed —
// see scripts/validate-dsa.ts for what IS mechanically checked.

import type { DsaApproach } from '../types';

export const arraysHashingApproaches: Record<string, DsaApproach> = {
    'contains-duplicate': {
        restate: 'Does any value appear twice in the array?',
        body: `The brute force compares every pair — \`O(n²)\`, and for \`n = 10⁵\` that is 5 billion comparisons.

**The observation:** you do not need to compare pairs at all. You only need to answer "have I seen this value before?", and that is what a hash set answers in \`O(1)\`.

Walk the array once. Before adding each value, check whether it is already in the set; if it is, you are done. If you reach the end, every value was unique.

A common alternative is to sort first and check adjacent pairs — that is \`O(n log n)\` time but \`O(1)\` extra space, so it is the better answer if the interviewer forbids extra memory. Mention both; the trade is the point of the question.

**The trap:** add to the set *after* checking, not before. Check-then-add on the same element reports every array as having a duplicate.`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        unordered_set<int> seen;
        for (int n : nums) {
            if (seen.count(n)) return true;
            seen.insert(n);
        }
        return false;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public boolean containsDuplicate(int[] nums) {
        Set<Integer> seen = new HashSet<>();
        for (int n : nums) {
            if (!seen.add(n)) return true; // add() returns false if already present
        }
        return false;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function containsDuplicate(nums) {
    const seen = new Set();
    for (const n of nums) {
        if (seen.has(n)) return true;
        seen.add(n);
    }
    return false;
}`,
            },
        ],
        followUps: [
            'Solve it in O(1) extra space. (Sort in place, then scan adjacent pairs.)',
            'What if the array is too large to fit in memory?',
            'Return the first duplicated value instead of a boolean.',
        ],
    },

    'valid-anagram': {
        restate: 'Do two strings contain exactly the same characters with exactly the same counts?',
        body: `Sorting both strings and comparing works and is two lines — \`O(n log n)\`. It is a perfectly good answer to open with.

**The observation:** an anagram is defined by *counts*, and sorting computes far more than counts — it computes an order you then throw away. Counting directly is \`O(n)\`.

Build a frequency map from the first string, then walk the second decrementing. If a count ever goes negative, or a character is missing entirely, they are not anagrams. Length inequality is an instant \`false\`, and checking it first saves the whole scan.

For lowercase-English-only inputs, use a fixed \`int[26]\` instead of a hash map: same complexity, but no hashing overhead and no allocation. Interviewers notice.

**The trap:** decrementing without the length check passes \`"aa"\` against \`"a"\` if you only test for negatives — the second string simply runs out early and every count you checked was fine.`,
        complexity: { time: 'O(n)', space: 'O(1) — 26 fixed counters' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    bool isAnagram(string s, string t) {
        if (s.size() != t.size()) return false;
        int count[26] = {0};
        for (char c : s) count[c - 'a']++;
        for (char c : t) {
            if (--count[c - 'a'] < 0) return false;
        }
        return true;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        int[] count = new int[26];
        for (char c : s.toCharArray()) count[c - 'a']++;
        for (char c : t.toCharArray()) {
            if (--count[c - 'a'] < 0) return false;
        }
        return true;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function isAnagram(s, t) {
    if (s.length !== t.length) return false;
    const count = new Map();
    for (const c of s) count.set(c, (count.get(c) || 0) + 1);
    for (const c of t) {
        const left = count.get(c);
        if (!left) return false;      // absent or already exhausted
        count.set(c, left - 1);
    }
    return true;
}`,
            },
        ],
        followUps: [
            'What changes for Unicode input? (The int[26] trick dies; use a hash map.)',
            'Group all anagrams in a list together — that is the next problem in this section.',
        ],
    },

    'two-sum': {
        restate: 'Find the two indices whose values add up to the target.',
        body: `The brute force fixes \`i\` and scans the rest of the array for \`target - nums[i]\`. That is \`O(n²)\`.

**The observation:** look at what that inner scan is doing. For each \`i\`, it searches for a specific value — the *complement*. And every element it could possibly find is one you have already walked past. So instead of re-scanning, remember what you have seen.

One pass. For each element, first ask the map "have I already seen \`target - nums[i]\`?" If yes, that earlier index and the current one are the answer. If no, record \`nums[i] → i\` and move on.

**Why check before inserting:** if you insert first, an element whose value is exactly half the target pairs with *itself* and you return \`[i, i]\`. Checking first means the map only ever holds strictly-earlier indices, which is also why the returned pair is automatically in order.

This check-before-insert ordering is the single most reusable idea in the section — it reappears in Subarray Sum Equals K, and in most "find a pair with property X" problems.`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen; // value -> index
        for (int i = 0; i < nums.size(); i++) {
            int need = target - nums[i];
            auto it = seen.find(need);
            if (it != seen.end()) return {it->second, i};
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>(); // value -> index
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            if (seen.containsKey(need)) return new int[]{seen.get(need), i};
            seen.put(nums[i], i);
        }
        return new int[]{};
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function twoSum(nums, target) {
    const seen = new Map(); // value -> index
    for (let i = 0; i < nums.length; i++) {
        const need = target - nums[i];
        if (seen.has(need)) return [seen.get(need), i];
        seen.set(nums[i], i);
    }
    return [];
}`,
            },
        ],
        followUps: [
            'What if the array is already sorted? (Two pointers, O(1) space — see Two Sum II.)',
            'What if there can be more than one valid pair and you must return all of them?',
            'What if the same element may be used twice?',
        ],
    },

    'group-anagrams': {
        restate: 'Bucket the strings so that all anagrams of each other land in the same list.',
        body: `Comparing every string against every other is \`O(n² · k)\`. The fix is to stop comparing strings to each other at all.

**The observation:** anagrams need a *canonical form* — one value that is identical for every anagram of a group and different for every other group. Then grouping is just a hash map keyed by that form, filled in one pass.

The obvious canonical form is the sorted string: \`"eat"\`, \`"tea"\` and \`"ate"\` all sort to \`"aet"\`. That gives \`O(n · k log k)\`.

You can do better. Since the constraint is lowercase English, the 26-length count array *is* a canonical form, and building it is \`O(k)\` rather than \`O(k log k)\`. Serialise it into a string key like \`"1#0#0#..."\` and you get \`O(n · k)\`.

**The trap:** join the counts with a separator. Without one, \`[1, 11]\` and \`[11, 1]\` both serialise to \`"111"\` and two different groups silently merge.`,
        complexity: { time: 'O(n · k)', space: 'O(n · k)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    vector<vector<string>> groupAnagrams(vector<string>& strs) {
        unordered_map<string, vector<string>> groups;
        for (const string& s : strs) {
            int count[26] = {0};
            for (char c : s) count[c - 'a']++;
            string key;
            for (int i = 0; i < 26; i++) {
                key += '#';               // separator: [1,11] must not equal [11,1]
                key += to_string(count[i]);
            }
            groups[key].push_back(s);
        }
        vector<vector<string>> out;
        for (auto& [_, group] : groups) out.push_back(group);
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> groups = new HashMap<>();
        for (String s : strs) {
            int[] count = new int[26];
            for (char c : s.toCharArray()) count[c - 'a']++;
            StringBuilder key = new StringBuilder();
            for (int n : count) key.append('#').append(n);
            groups.computeIfAbsent(key.toString(), k -> new ArrayList<>()).add(s);
        }
        return new ArrayList<>(groups.values());
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function groupAnagrams(strs) {
    const groups = new Map();
    for (const s of strs) {
        const count = new Array(26).fill(0);
        for (const c of s) count[c.charCodeAt(0) - 97]++;
        const key = count.join('#'); // separator, not a bare join
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(s);
    }
    return [...groups.values()];
}`,
            },
        ],
        followUps: [
            'What if the strings can contain any Unicode character?',
            'Why not use the product of primes as the key? (Overflow — and it is worth being able to say so.)',
        ],
    },

    'top-k-frequent-elements': {
        restate: 'Return the k values that appear most often.',
        body: `Count with a hash map, then take the top k. The question is how you take the top k.

Sorting the counts is \`O(n log n)\`. A size-k min-heap is \`O(n log k)\`, which is better whenever k is small — and it is the answer the interviewer usually wants, because it generalises to a stream.

**The observation that beats both:** a frequency is bounded. No value can appear more than \`n\` times, so frequency is an integer in \`[1, n]\` — and when your keys are small bounded integers you can use them as array indices instead of sorting them.

Build \`buckets\`, an array of length \`n + 1\`, where \`buckets[f]\` is the list of values appearing exactly \`f\` times. Then walk it from the high end collecting until you have k. That is \`O(n)\` overall.

**The trap:** the bucket array needs \`n + 1\` slots, not \`n\` — a value can appear \`n\` times, and \`buckets[n]\` has to exist.`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    vector<int> topKFrequent(vector<int>& nums, int k) {
        unordered_map<int, int> freq;
        for (int n : nums) freq[n]++;

        // buckets[f] = values seen exactly f times. f can be n, so size n + 1.
        vector<vector<int>> buckets(nums.size() + 1);
        for (auto& [val, f] : freq) buckets[f].push_back(val);

        vector<int> out;
        for (int f = buckets.size() - 1; f >= 1 && out.size() < k; f--) {
            for (int val : buckets[f]) {
                out.push_back(val);
                if (out.size() == k) break;
            }
        }
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> freq = new HashMap<>();
        for (int n : nums) freq.merge(n, 1, Integer::sum);

        List<Integer>[] buckets = new List[nums.length + 1];
        for (Map.Entry<Integer, Integer> e : freq.entrySet()) {
            int f = e.getValue();
            if (buckets[f] == null) buckets[f] = new ArrayList<>();
            buckets[f].add(e.getKey());
        }

        int[] out = new int[k];
        int idx = 0;
        for (int f = buckets.length - 1; f >= 1 && idx < k; f--) {
            if (buckets[f] == null) continue;
            for (int val : buckets[f]) {
                out[idx++] = val;
                if (idx == k) break;
            }
        }
        return out;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function topKFrequent(nums, k) {
    const freq = new Map();
    for (const n of nums) freq.set(n, (freq.get(n) || 0) + 1);

    const buckets = Array.from({ length: nums.length + 1 }, () => []);
    for (const [val, f] of freq) buckets[f].push(val);

    const out = [];
    for (let f = buckets.length - 1; f >= 1 && out.length < k; f--) {
        for (const val of buckets[f]) {
            out.push(val);
            if (out.length === k) break;
        }
    }
    return out;
}`,
            },
        ],
        followUps: [
            'Do it for a stream where n is unknown. (Bucket sort needs n; the heap does not.)',
            'What if k can be as large as n?',
        ],
    },

    'product-of-array-except-self': {
        restate: 'For each index, the product of everything else — without division, in O(n).',
        body: `The tempting solution is total product ÷ nums[i]. It is banned, and for good reason: a single zero makes it wrong, and two zeroes make it wrong differently.

**The observation:** everything except index \`i\` is exactly *everything to its left* × *everything to its right*. Two independent quantities, each of which is a running product you can build in one pass.

So: one left-to-right pass writing the product of all elements strictly before \`i\`, then one right-to-left pass multiplying in the product of all elements strictly after \`i\`. Two passes, no division.

To hit \`O(1)\` extra space, use the output array itself for the left products, then carry the right product in a single scalar as you sweep back. The output array does not count against space by the problem's own definition.

**Why this handles zeroes for free:** a zero simply makes some prefixes and suffixes zero. There is no special case, which is the tell that this decomposition is the right one.`,
        complexity: { time: 'O(n)', space: 'O(1) excluding the output' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {
        int n = nums.size();
        vector<int> out(n);

        int prefix = 1;
        for (int i = 0; i < n; i++) {
            out[i] = prefix;        // product of everything strictly LEFT of i
            prefix *= nums[i];
        }

        int suffix = 1;
        for (int i = n - 1; i >= 0; i--) {
            out[i] *= suffix;       // ...times everything strictly RIGHT of i
            suffix *= nums[i];
        }
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int[] productExceptSelf(int[] nums) {
        int n = nums.length;
        int[] out = new int[n];

        int prefix = 1;
        for (int i = 0; i < n; i++) {
            out[i] = prefix;
            prefix *= nums[i];
        }

        int suffix = 1;
        for (int i = n - 1; i >= 0; i--) {
            out[i] *= suffix;
            suffix *= nums[i];
        }
        return out;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function productExceptSelf(nums) {
    const n = nums.length;
    const out = new Array(n);

    let prefix = 1;
    for (let i = 0; i < n; i++) {
        out[i] = prefix;
        prefix *= nums[i];
    }

    let suffix = 1;
    for (let i = n - 1; i >= 0; i--) {
        out[i] *= suffix;
        suffix *= nums[i];
    }
    return out;
}`,
            },
        ],
        followUps: [
            'Now solve it WITH division, handling zero correctly. (Count the zeroes: 0 → divide; 1 → only that index is non-zero; 2+ → all zero.)',
            'Why is the product guaranteed to fit in a 32-bit int here?',
        ],
    },

    'valid-sudoku': {
        restate: 'Check that no digit repeats in any row, any column, or any 3×3 box. Solvability is not asked.',
        body: `There is no algorithmic insight to find here — it is a bookkeeping problem, and the interviewer is watching your indexing.

Nine rows, nine columns, nine boxes, each needing "have I seen this digit?" That is 27 hash sets, and one pass over the 81 cells updating three of them per filled cell.

**The only real question is the box index.** For cell \`(r, c)\`, the box is \`(r / 3) * 3 + c / 3\` with integer division. Derive it rather than memorise it: \`r / 3\` is which band of rows you are in (0, 1 or 2), \`c / 3\` is which stack of columns, and \`× 3\` lays the grid of bands out into a flat 0–8.

**The trap:** skip \`'.'\` before doing anything else. Empty cells are not violations, and adding \`'.'\` to the sets makes the second empty cell in any row report a duplicate.

The grid is fixed at 9×9, so this is \`O(1)\` by the strictest reading. Say "O(n²) for an n×n board" instead — it shows you know which part is the constant.`,
        complexity: { time: 'O(1) — the board is fixed at 81 cells', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    bool isValidSudoku(vector<vector<char>>& board) {
        bool rows[9][9] = {}, cols[9][9] = {}, boxes[9][9] = {};
        for (int r = 0; r < 9; r++) {
            for (int c = 0; c < 9; c++) {
                if (board[r][c] == '.') continue;
                int d = board[r][c] - '1';        // 0..8
                int b = (r / 3) * 3 + c / 3;
                if (rows[r][d] || cols[c][d] || boxes[b][d]) return false;
                rows[r][d] = cols[c][d] = boxes[b][d] = true;
            }
        }
        return true;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public boolean isValidSudoku(char[][] board) {
        boolean[][] rows = new boolean[9][9], cols = new boolean[9][9], boxes = new boolean[9][9];
        for (int r = 0; r < 9; r++) {
            for (int c = 0; c < 9; c++) {
                if (board[r][c] == '.') continue;
                int d = board[r][c] - '1';
                int b = (r / 3) * 3 + c / 3;
                if (rows[r][d] || cols[c][d] || boxes[b][d]) return false;
                rows[r][d] = cols[c][d] = boxes[b][d] = true;
            }
        }
        return true;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function isValidSudoku(board) {
    const rows = Array.from({ length: 9 }, () => new Set());
    const cols = Array.from({ length: 9 }, () => new Set());
    const boxes = Array.from({ length: 9 }, () => new Set());

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const v = board[r][c];
            if (v === '.') continue;
            const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
            if (rows[r].has(v) || cols[c].has(v) || boxes[b].has(v)) return false;
            rows[r].add(v);
            cols[c].add(v);
            boxes[b].add(v);
        }
    }
    return true;
}`,
            },
        ],
        followUps: [
            'Now actually solve the board. (Backtracking — and this validity check is the pruning step.)',
            'Generalise the box index to an n²×n² board.',
        ],
    },

    'longest-consecutive-sequence': {
        restate: 'Length of the longest run of consecutive integers present in the array — in O(n), so sorting is out.',
        body: `Sorting makes this trivial and costs \`O(n log n)\`. The problem explicitly wants \`O(n)\`, so the interesting question is how you get there.

Put everything in a hash set, so "is \`x\` present?" is \`O(1)\`. Now you could, for each value, walk upward counting — but that re-walks the same run once per element and degrades to \`O(n²)\`.

**The observation that fixes it:** only walk a run from its *start*. And \`x\` starts a run exactly when \`x - 1\` is absent from the set. That one check is the whole solution.

Every element is now visited at most twice — once by the outer loop, once by the inner walk of the single run it belongs to. That is what makes the total \`O(n)\` despite the nested loop, and being able to say *that* out loud is the point of the question.

**The trap:** duplicates. The set collapses them for free, which is why this must be a set and not the raw array.`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int longestConsecutive(vector<int>& nums) {
        unordered_set<int> s(nums.begin(), nums.end());
        int best = 0;
        for (int n : s) {
            if (s.count(n - 1)) continue;   // not the start of a run — skip
            int len = 1;
            while (s.count(n + len)) len++;
            best = max(best, len);
        }
        return best;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int longestConsecutive(int[] nums) {
        Set<Integer> s = new HashSet<>();
        for (int n : nums) s.add(n);

        int best = 0;
        for (int n : s) {
            if (s.contains(n - 1)) continue;
            int len = 1;
            while (s.contains(n + len)) len++;
            best = Math.max(best, len);
        }
        return best;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function longestConsecutive(nums) {
    const s = new Set(nums);
    let best = 0;
    for (const n of s) {
        if (s.has(n - 1)) continue; // only start counting from a run's head
        let len = 1;
        while (s.has(n + len)) len++;
        best = Math.max(best, len);
    }
    return best;
}`,
            },
        ],
        followUps: [
            'Return the sequence itself, not just its length.',
            'Why is this O(n) and not O(n²)? Be precise about how often each element is touched.',
        ],
    },

    'majority-element': {
        restate: 'Find the value appearing more than ⌊n/2⌋ times. It is guaranteed to exist.',
        body: `Counting in a hash map and taking the max is \`O(n)\` time and \`O(n)\` space, and is a completely acceptable first answer. Say it, then improve the space.

**The observation (Boyer–Moore):** the majority element occurs more than all other values *combined*. So if you pair up each occurrence of the majority with one occurrence of something else, you run out of non-majority elements first — something must be left over, and it must be the majority.

Implement that pairing with a candidate and a counter. When the counter hits zero, adopt the current element as the new candidate. Increment when the current element matches the candidate, decrement when it does not. The survivor is the answer.

It reads like a magic trick, and the reason it works is worth stating plainly: the counter is the *lead* the current candidate holds over everything else in the stretch you have scanned. A value with a strict majority overall can never end at a deficit.

**The trap:** the guarantee matters. Without "a majority element always exists", the survivor is only a *candidate* and needs a second pass to verify.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int majorityElement(vector<int>& nums) {
        int candidate = 0, count = 0;
        for (int n : nums) {
            if (count == 0) candidate = n;
            count += (n == candidate) ? 1 : -1;
        }
        return candidate;   // guaranteed to exist; otherwise verify in a 2nd pass
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int majorityElement(int[] nums) {
        int candidate = 0, count = 0;
        for (int n : nums) {
            if (count == 0) candidate = n;
            count += (n == candidate) ? 1 : -1;
        }
        return candidate;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function majorityElement(nums) {
    let candidate = 0, count = 0;
    for (const n of nums) {
        if (count === 0) candidate = n;
        count += n === candidate ? 1 : -1;
    }
    return candidate;
}`,
            },
        ],
        followUps: [
            'Find all elements appearing more than ⌊n/3⌋ times. (At most two — generalise to two candidates and two counters.)',
            'Drop the existence guarantee. What has to change?',
        ],
    },

    'subarray-sum-equals-k': {
        restate: 'How many contiguous subarrays sum to exactly k?',
        body: `Every subarray is \`O(n²)\` of them, and summing each is another \`O(n)\` — so brute force is \`O(n³)\`, or \`O(n²)\` if you keep a running sum. With \`n = 2·10⁴\` that is too slow.

**The observation:** let \`prefix[i]\` be the sum of everything up to \`i\`. Then the sum of the subarray \`(j, i]\` is \`prefix[i] - prefix[j]\`. Asking for a subarray ending at \`i\` with sum \`k\` is therefore asking: *how many earlier prefixes equal \`prefix[i] - k\`?*

That is a counting question about things you have already seen — a hash map, in one pass. Exactly the Two Sum move, applied to prefix sums instead of values.

**Two traps, both classic:**

Seed the map with \`{0: 1}\`. A subarray starting at index 0 has no earlier prefix to subtract, and the empty prefix — sum zero, seen once — is what stands in for it. Without the seed you silently miss every subarray anchored at the start.

Count occurrences, not presence. Several different prefixes can share a value, and each one is a distinct subarray. A set here undercounts.

**Why sliding window does not work:** the array can contain negatives, so growing the window does not monotonically grow the sum, and there is no rule for when to shrink.`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int subarraySum(vector<int>& nums, int k) {
        unordered_map<long long, int> seen{{0, 1}}; // empty prefix, seen once
        long long sum = 0;
        int count = 0;
        for (int n : nums) {
            sum += n;
            auto it = seen.find(sum - k);
            if (it != seen.end()) count += it->second;
            seen[sum]++;
        }
        return count;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int subarraySum(int[] nums, int k) {
        Map<Long, Integer> seen = new HashMap<>();
        seen.put(0L, 1);
        long sum = 0;
        int count = 0;
        for (int n : nums) {
            sum += n;
            count += seen.getOrDefault(sum - k, 0);
            seen.merge(sum, 1, Integer::sum);
        }
        return count;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function subarraySum(nums, k) {
    const seen = new Map([[0, 1]]); // empty prefix, seen once
    let sum = 0, count = 0;
    for (const n of nums) {
        sum += n;
        count += seen.get(sum - k) || 0;
        seen.set(sum, (seen.get(sum) || 0) + 1);
    }
    return count;
}`,
            },
        ],
        followUps: [
            'Return the longest such subarray instead of the count. (Store the FIRST index per prefix, not the count.)',
            'Why can this not be done with a sliding window?',
            'Count subarrays whose sum is divisible by k.',
        ],
    },

    'sort-colors': {
        restate: 'Sort an array of 0s, 1s and 2s in place, in one pass.',
        body: `Counting each value and overwriting works and is genuinely fine — but it is two passes, and the problem is asking for one.

**The observation (Dutch National Flag):** with only three distinct values, you can maintain three regions at once and let the middle one shrink as you scan. Keep \`low\` (end of the 0s), \`mid\` (the cursor) and \`high\` (start of the 2s). Everything before \`low\` is 0, everything after \`high\` is 2, and \`[low, mid)\` is 1.

At each step: a 0 swaps down to \`low\` and both pointers advance; a 1 is already home so \`mid\` advances; a 2 swaps up to \`high\` and \`high\` retreats.

**The trap, and it is the entire problem:** do **not** advance \`mid\` after swapping with \`high\`. The value you just pulled in from the right is unexamined — it could be another 2, or a 0 that still needs to travel left. Advancing past it is the bug that makes this look correct on \`[2,0,1]\` and fail on \`[2,0,2,1,1,0]\`.

You advance after a 0-swap because the value coming from \`low\` has already been classified — it is a 1 by the invariant.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    void sortColors(vector<int>& nums) {
        int low = 0, mid = 0, high = nums.size() - 1;
        while (mid <= high) {
            if (nums[mid] == 0) {
                swap(nums[low++], nums[mid++]);
            } else if (nums[mid] == 1) {
                mid++;
            } else {
                swap(nums[mid], nums[high--]);  // NOTE: mid does not advance
            }
        }
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public void sortColors(int[] nums) {
        int low = 0, mid = 0, high = nums.length - 1;
        while (mid <= high) {
            if (nums[mid] == 0) {
                int t = nums[low]; nums[low] = nums[mid]; nums[mid] = t;
                low++; mid++;
            } else if (nums[mid] == 1) {
                mid++;
            } else {
                int t = nums[mid]; nums[mid] = nums[high]; nums[high] = t;
                high--;                          // mid stays put
            }
        }
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function sortColors(nums) {
    let low = 0, mid = 0, high = nums.length - 1;
    while (mid <= high) {
        if (nums[mid] === 0) {
            [nums[low], nums[mid]] = [nums[mid], nums[low]];
            low++; mid++;
        } else if (nums[mid] === 1) {
            mid++;
        } else {
            [nums[mid], nums[high]] = [nums[high], nums[mid]];
            high--; // deliberately not advancing mid
        }
    }
}`,
            },
        ],
        followUps: [
            'Generalise to k distinct values.',
            'Why is the loop condition mid <= high rather than mid < high?',
        ],
    },

    'merge-sorted-array': {
        restate: 'Merge nums2 into nums1 in place. nums1 has exactly enough trailing space.',
        body: `The standard merge walks both arrays from the front — but here the destination *is* one of the sources, and writing at the front would overwrite \`nums1\` elements you have not read yet.

**The observation:** fill from the back. The trailing slots of \`nums1\` are the free space, so writing right-to-left always writes into a cell that is either empty or already consumed. The overwrite problem disappears entirely.

Three pointers: \`i\` at the last real element of \`nums1\`, \`j\` at the last of \`nums2\`, and \`k\` at the last slot overall. Take the larger of the two, place it at \`k\`, step that pointer back.

**Why the leftover check is one-sided:** when \`nums1\` runs out, whatever remains in \`nums2\` must still be copied. When \`nums2\` runs out, the remaining \`nums1\` elements are *already in place* — they are sorted and sitting exactly where they belong. Only the \`j >= 0\` drain loop is needed.

**The trap:** \`m\` is the count of real elements, not an index. \`i\` starts at \`m - 1\`, and \`nums1.length\` is \`m + n\`, never \`m\`.`,
        complexity: { time: 'O(m + n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    void merge(vector<int>& nums1, int m, vector<int>& nums2, int n) {
        int i = m - 1, j = n - 1, k = m + n - 1;
        while (j >= 0) {
            if (i >= 0 && nums1[i] > nums2[j]) {
                nums1[k--] = nums1[i--];
            } else {
                nums1[k--] = nums2[j--];
            }
        }
        // No drain loop for i: those elements are already in place.
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public void merge(int[] nums1, int m, int[] nums2, int n) {
        int i = m - 1, j = n - 1, k = m + n - 1;
        while (j >= 0) {
            if (i >= 0 && nums1[i] > nums2[j]) {
                nums1[k--] = nums1[i--];
            } else {
                nums1[k--] = nums2[j--];
            }
        }
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function merge(nums1, m, nums2, n) {
    let i = m - 1, j = n - 1, k = m + n - 1;
    while (j >= 0) {
        if (i >= 0 && nums1[i] > nums2[j]) {
            nums1[k--] = nums1[i--];
        } else {
            nums1[k--] = nums2[j--];
        }
    }
}`,
            },
        ],
        followUps: [
            'Why is there no drain loop for the remaining nums1 elements?',
            'Merge k sorted arrays instead of two.',
        ],
    },
};
