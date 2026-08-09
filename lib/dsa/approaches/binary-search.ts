// lib/dsa/approaches/binary-search.ts
//
// "Our approach" pages for the Binary Search section.
//
// Same four beats as every other approach file (brute force → why it is too
// slow → the observation → the trap); see approaches/arrays-hashing.ts for the
// house style in full.
//
// THE GENERALISATION THIS SECTION IS BUILT AROUND, stated once here:
//
// Binary search is not "find a number in a sorted array". It is: you have a
// yes/no question whose answer flips EXACTLY ONCE across a range, and you are
// hunting for the flip. Sortedness is just the most common way to get that
// property.
//
//   is nums[i] >= target?          NO NO NO YES YES YES   ← classic search
//   is version i bad?              NO NO NO YES YES YES   ← First Bad Version
//   can Koko finish at speed k?    NO NO NO YES YES YES   ← binary search on ANSWER
//
// Once a problem is in that shape the code is the same four lines every time.
// The two hard parts are (a) noticing the shape when the array is not sorted at
// all — Koko, Ship Packages, Find Peak — and (b) the loop-boundary discipline
// that stops it looping forever. Both get called out on every page.
//
// ON BOUNDARIES: this file uses `while (l <= r)` with `r = n - 1` for "find an
// exact value", and `while (l < r)` with `r = n - 1` (never moving `l` past a
// candidate) for "find the boundary". Mixing the two is the single largest
// source of infinite loops in this section, so each page says which it is using
// and why.

import type { DsaApproach } from '../types';

export const binarySearchApproaches: Record<string, DsaApproach> = {
    'binary-search': {
        restate: 'Find the index of a target in a sorted array, or -1. Must be O(log n).',
        body: `The template every other problem in this section is a variation of. Worth writing from memory until it is automatic.

Maintain a range \`[l, r]\` that still *could* contain the target. Look at the middle. If it is the target, done. If it is too small, the answer cannot be at \`mid\` or to its left, so \`l = mid + 1\`. Too big, and \`r = mid - 1\`.

**Three details, and every one of them is a real bug:**

**\`while (l <= r)\`, not \`<\`.** With \`<\`, a range that has narrowed to a single element is never examined, and \`nums = [5], target = 5\` returns -1.

**\`mid = l + (r - l) / 2\`, not \`(l + r) / 2\`.** For large \`l\` and \`r\` the sum overflows a 32-bit int and goes negative. This is famously the bug that sat in Java's own \`Arrays.binarySearch\` for nine years. It cannot bite at LeetCode's constraints, but writing it the safe way costs nothing and interviewers notice.

**\`mid ± 1\`, never \`mid\`.** Assigning \`l = mid\` when \`mid == l\` makes no progress and the loop spins forever. Every branch must exclude the element it just tested.

The exit condition is worth understanding rather than memorising: the loop ends when \`l > r\`, which means the range is empty — every index has been ruled out.`,
        complexity: { time: 'O(log n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int search(vector<int>& nums, int target) {
        int l = 0, r = nums.size() - 1;
        while (l <= r) {                      // <=, so a 1-element range is checked
            int mid = l + (r - l) / 2;        // overflow-safe midpoint
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) l = mid + 1;   // mid ± 1, never mid
            else r = mid - 1;
        }
        return -1;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int search(int[] nums, int target) {
        int l = 0, r = nums.length - 1;
        while (l <= r) {
            int mid = l + (r - l) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) l = mid + 1;
            else r = mid - 1;
        }
        return -1;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function search(nums, target) {
    let l = 0, r = nums.length - 1;
    while (l <= r) {
        // Math.floor matters: JS division yields a float.
        const mid = l + Math.floor((r - l) / 2);
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) l = mid + 1;
        else r = mid - 1;
    }
    return -1;
}`,
            },
        ],
        followUps: [
            'Return the FIRST occurrence when duplicates exist. Which line changes?',
            'Write it recursively. What is the space complexity now?',
            'Why is (l + r) / 2 unsafe even though it passes every LeetCode test?',
        ],
    },

    'search-insert-position': {
        restate:
            'Return the index of the target, or the index where it would be inserted to keep the array sorted.',
        body: `Same search as before, with one change that turns out to be the more useful version: instead of returning -1 on a miss, return **where the value belongs**.

**The observation:** you do not need a special case for the miss. When the loop exits, \`l\` is already the answer. Every index below \`l\` holds something strictly smaller than the target — that is exactly what \`l = mid + 1\` established each time it ran — so \`l\` is the first position whose value is \`>= target\`, which is precisely the insertion point.

That makes the whole function the standard template with \`return l\` instead of \`return -1\`, and the early exact-match return becomes optional.

**Why this matters beyond the problem:** \`l\` after the loop is \`lower_bound\` — the first index not less than the target. It answers "how many elements are smaller?", "where does this go?" and "does it exist?" in one number, and it is the primitive that Find Minimum in Rotated Sorted Array and Koko are both really computing. Learn to trust the invariant rather than the return value.

**The trap:** returning \`mid\` or \`r\` after the loop. When the loop ends \`r == l - 1\`, so \`r\` is the last index strictly *below* the target — off by one, and on a target larger than everything it is out of range entirely.`,
        complexity: { time: 'O(log n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int searchInsert(vector<int>& nums, int target) {
        int l = 0, r = nums.size() - 1;
        while (l <= r) {
            int mid = l + (r - l) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) l = mid + 1;
            else r = mid - 1;
        }
        // l is the first index whose value is >= target: the insertion point.
        return l;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int searchInsert(int[] nums, int target) {
        int l = 0, r = nums.length - 1;
        while (l <= r) {
            int mid = l + (r - l) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) l = mid + 1;
            else r = mid - 1;
        }
        return l;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function searchInsert(nums, target) {
    let l = 0, r = nums.length - 1;
    while (l <= r) {
        const mid = l + Math.floor((r - l) / 2);
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) l = mid + 1;
        else r = mid - 1;
    }
    return l;
}`,
            },
        ],
        followUps: [
            'Why is l the answer and not r? State the invariant each branch maintains.',
            'Implement upper_bound — the first index STRICTLY greater than the target.',
            'Use it to count occurrences of a value in a sorted array in O(log n).',
        ],
    },

    'first-bad-version': {
        restate:
            'Versions are good then bad, with one flip. Find the first bad one using as few API calls as possible.',
        body: `The first problem here with **no array at all** — which is the point. There is nothing to sort and nothing to compare against a target; there is only a question you can ask about any index: *is version i bad?*

And the answers look like this:

\`\`\`
version:  1    2    3    4    5    6
isBad:   NO   NO   NO  YES  YES  YES
                        ↑ the flip
\`\`\`

Monotonic — once bad, always bad. That single property is all binary search ever needed. Sortedness in the other problems is just a way of producing it.

**This is the boundary shape, so the loop is different.** Use \`while (l < r)\` and never move \`l\` past a candidate:

- \`isBadVersion(mid)\` → \`mid\` might itself be the first bad one, so \`r = mid\` (**not** \`mid - 1\`).
- otherwise \`mid\` is good and everything up to it is ruled out, so \`l = mid + 1\`.

The loop ends when \`l == r\`, and that single surviving index is the answer. There is no in-loop return, because you can never confirm "first" from one probe alone — you only know it once the range has collapsed.

**The trap:** with \`r = mid\`, the condition must be \`l < r\`. Writing \`l <= r\` here loops forever the moment \`l == r == mid\`, because \`r = mid\` changes nothing.

Overflow genuinely matters on this one: \`n\` goes up to \`2³¹ - 1\`, so \`(l + r)\` really does overflow.`,
        complexity: { time: 'O(log n) API calls', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `// bool isBadVersion(int version);

class Solution {
public:
    int firstBadVersion(int n) {
        int l = 1, r = n;
        while (l < r) {                     // < , because r = mid below
            int mid = l + (r - l) / 2;      // n up to 2^31-1: overflow is REAL
            if (isBadVersion(mid)) r = mid;      // mid may BE the answer
            else l = mid + 1;                    // mid is good, discard it
        }
        return l;                            // l == r: the flip
    }
};`,
            },
            {
                lang: 'java',
                source: `public class Solution extends VersionControl {
    public int firstBadVersion(int n) {
        int l = 1, r = n;
        while (l < r) {
            int mid = l + (r - l) / 2;
            if (isBadVersion(mid)) r = mid;
            else l = mid + 1;
        }
        return l;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function solution(isBadVersion) {
    return function (n) {
        let l = 1, r = n;
        while (l < r) {
            const mid = l + Math.floor((r - l) / 2);
            if (isBadVersion(mid)) r = mid;
            else l = mid + 1;
        }
        return l;
    };
}`,
            },
        ],
        followUps: [
            'Why l < r here but l <= r in the classic template? Trace l == r == mid in both.',
            'What if versions could flip back and forth — does binary search still apply?',
        ],
    },

    'search-a-2d-matrix': {
        restate:
            'Search a matrix whose rows are sorted and where each row starts after the previous row ends. O(log(m·n)).',
        body: `Binary searching the first column to pick a row, then binary searching that row, works and is \`O(log m + log n)\`. It is a fine answer and it is two loops.

**The observation that makes it one loop:** read the two conditions together. Rows are sorted, *and* every value in a row exceeds every value in the row above. That means reading the matrix row by row gives one fully sorted sequence — the matrix is a **flattened sorted array wearing a 2D costume**.

So binary search over \`[0, m·n - 1]\` and convert the flat index on demand:

\`\`\`
row = mid / cols        col = mid % cols
\`\`\`

Integer division for the row, remainder for the column. Nothing else changes; it is the classic template with one line of arithmetic.

**Two traps.** Divide by the number of **columns**, not rows — dimensions are easy to swap and the result still indexes *something*, so it fails on a non-square matrix and passes on a square one.

And \`m·n\` can overflow \`int\` when both are large; not at LeetCode's limits here, but the habit belongs with the overflow-safe midpoint.

**What changes for Leetcode 240** (rows sorted, columns sorted, but rows do *not* continue from each other): the flattening is no longer valid, because the sequence is not globally sorted. That version is solved by starting at the top-right corner and stepping left or down — \`O(m + n)\`, not logarithmic. Knowing which problem you have been given is the actual test.`,
        complexity: { time: 'O(log(m·n))', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    bool searchMatrix(vector<vector<int>>& matrix, int target) {
        int rows = matrix.size(), cols = matrix[0].size();
        int l = 0, r = rows * cols - 1;

        while (l <= r) {
            int mid = l + (r - l) / 2;
            int val = matrix[mid / cols][mid % cols];   // divide by COLS
            if (val == target) return true;
            if (val < target) l = mid + 1;
            else r = mid - 1;
        }
        return false;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public boolean searchMatrix(int[][] matrix, int target) {
        int rows = matrix.length, cols = matrix[0].length;
        int l = 0, r = rows * cols - 1;

        while (l <= r) {
            int mid = l + (r - l) / 2;
            int val = matrix[mid / cols][mid % cols];
            if (val == target) return true;
            if (val < target) l = mid + 1;
            else r = mid - 1;
        }
        return false;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function searchMatrix(matrix, target) {
    const rows = matrix.length, cols = matrix[0].length;
    let l = 0, r = rows * cols - 1;

    while (l <= r) {
        const mid = l + Math.floor((r - l) / 2);
        const val = matrix[Math.floor(mid / cols)][mid % cols];
        if (val === target) return true;
        if (val < target) l = mid + 1;
        else r = mid - 1;
    }
    return false;
}`,
            },
        ],
        followUps: [
            'Leetcode 240: rows and columns sorted, but rows do not continue from each other. Why does flattening break?',
            'Write the two-binary-search version. Which reads better?',
        ],
    },

    'koko-eating-bananas': {
        restate:
            'Choose the smallest eating speed k such that all piles are finished within h hours.',
        body: `The problem the section exists for. There is no sorted array to search — **you binary search the answer itself.**

**The observation:** ask "can Koko finish at speed k?" for each k and the answers are monotonic. A speed that works means every faster speed also works; a speed that fails means every slower one fails too.

\`\`\`
speed k:   1    2    3    4    5    6
finishes? NO   NO   NO  YES  YES  YES
                        ↑ the smallest k that works
\`\`\`

That is the same picture as First Bad Version, so it is the same search. The range is \`[1, max(piles)]\` — speed 1 is the slowest that makes progress, and eating faster than the largest pile is wasted, since a pile takes a whole hour regardless.

The feasibility check is \`sum(ceil(pile / k))\`. **Compute the ceiling without floating point:** \`(pile + k - 1) / k\`. Using \`ceil(pile / (double)k)\` invites precision failures on large values, and it is slower.

**Three traps, all of which produce a wrong answer rather than a crash:**

Boundary shape again — \`while (l < r)\` with \`r = mid\` on success, because a workable speed might be the smallest one.

**The hour total needs 64 bits.** With \`10⁴\` piles of \`10⁹\` bananas at speed 1, the sum is \`10¹³\` — far past a 32-bit int, which wraps negative and makes every slow speed look feasible.

Start \`l\` at 1, never 0. Speed 0 is a division by zero.`,
        complexity: { time: 'O(n · log(max pile))', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int minEatingSpeed(vector<int>& piles, int h) {
        int l = 1, r = *max_element(piles.begin(), piles.end());

        while (l < r) {
            int k = l + (r - l) / 2;
            long long hours = 0;                  // 1e4 * 1e9 overflows int
            for (int p : piles) hours += (p + k - 1LL) / k;   // integer ceil

            if (hours <= h) r = k;                // k works; it might be minimal
            else l = k + 1;
        }
        return l;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int minEatingSpeed(int[] piles, int h) {
        int l = 1, r = 0;
        for (int p : piles) r = Math.max(r, p);

        while (l < r) {
            int k = l + (r - l) / 2;
            long hours = 0;
            for (int p : piles) hours += (p + (long) k - 1) / k;

            if (hours <= h) r = k;
            else l = k + 1;
        }
        return l;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function minEatingSpeed(piles, h) {
    let l = 1, r = Math.max(...piles);

    while (l < r) {
        const k = l + Math.floor((r - l) / 2);
        let hours = 0;
        for (const p of piles) hours += Math.ceil(p / k);

        if (hours <= h) r = k;   // works — but maybe a slower speed does too
        else l = k + 1;
    }
    return l;
}`,
            },
        ],
        followUps: [
            'Why is the upper bound max(piles) and not sum(piles)?',
            'Prove feasibility is monotonic in k. Without that, binary search is invalid.',
            'Minimum days to make m bouquets (Leetcode 1482) — the same shape again.',
        ],
    },

    'find-minimum-in-rotated-sorted-array': {
        restate:
            'A sorted array was rotated at an unknown pivot. Find its minimum in O(log n). Values are unique.',
        body: `Rotation breaks global sortedness, so there is no target to compare against. But the *structure* survives: the array is two sorted runs, and the minimum is exactly where the second begins.

**The observation:** compare \`nums[mid]\` with \`nums[r]\` — the right end, not the left, and not a target.

- \`nums[mid] > nums[r]\` → \`mid\` sits in the first (higher) run, so the drop is strictly to its right: \`l = mid + 1\`.
- \`nums[mid] < nums[r]\` → \`mid\` is in the second run, and it might itself be the minimum: \`r = mid\`.

Boundary shape, so \`while (l < r)\` and \`r = mid\`, and the answer is the single surviving index.

**Why compare against \`nums[r]\` rather than \`nums[l]\`.** With \`nums[l]\`, a *non-rotated* array (\`[1,2,3,4]\`) has \`nums[mid] > nums[l]\`, which looks identical to being in the first run, and the search walks right past the true minimum at index 0. Comparing against the right end has no such blind spot: an unrotated array always satisfies \`nums[mid] < nums[r]\`, which correctly moves left. No special case needed for zero rotation.

**The trap:** \`nums[mid] > nums[r]\` must use \`l = mid + 1\`, not \`l = mid\`. If \`mid\` is in the higher run it cannot be the minimum, so excluding it is both correct and necessary for termination.

**With duplicates** (Leetcode 154) this breaks: \`nums[mid] == nums[r]\` tells you nothing about which side the pivot is on, and the fallback \`r--\` degrades the worst case to \`O(n)\`.`,
        complexity: { time: 'O(log n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int findMin(vector<int>& nums) {
        int l = 0, r = nums.size() - 1;
        while (l < r) {
            int mid = l + (r - l) / 2;
            // Compare with the RIGHT end — nums[l] cannot tell a rotated array
            // from an unrotated one.
            if (nums[mid] > nums[r]) l = mid + 1;   // drop is to the right
            else r = mid;                            // mid may BE the minimum
        }
        return nums[l];
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int findMin(int[] nums) {
        int l = 0, r = nums.length - 1;
        while (l < r) {
            int mid = l + (r - l) / 2;
            if (nums[mid] > nums[r]) l = mid + 1;
            else r = mid;
        }
        return nums[l];
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function findMin(nums) {
    let l = 0, r = nums.length - 1;
    while (l < r) {
        const mid = l + Math.floor((r - l) / 2);
        if (nums[mid] > nums[r]) l = mid + 1;
        else r = mid;
    }
    return nums[l];
}`,
            },
        ],
        followUps: [
            'Trace [1,2,3,4] with a nums[l] comparison. Where does it go wrong?',
            'Leetcode 154 allows duplicates. Why does the worst case become O(n)?',
            'Return the rotation COUNT instead of the minimum value.',
        ],
    },

    'search-in-rotated-sorted-array': {
        restate: 'Find a target in a rotated sorted array of unique values, in O(log n).',
        body: `Finding the pivot first and then binary searching the correct run works, and is two passes. The one-pass version is the interview answer.

**The observation:** at any \`mid\`, the array splits into a left half \`[l, mid]\` and a right half \`[mid, r]\`, and **at least one of them is fully sorted** — a single rotation cannot break both. Compare \`nums[l]\` with \`nums[mid]\` to find out which:

- \`nums[l] <= nums[mid]\` → the left half is sorted.
- Otherwise → the right half is sorted.

Then, in whichever half *is* sorted, you can check membership with two comparisons, because a sorted range contains the target exactly when it lies between its endpoints. If the target is in there, discard the other half; if it is not, discard this one. Either way half the array goes, every iteration.

**The trap that costs the most submissions:** the range check must be **half-open in the right direction**. For a sorted left half it is \`nums[l] <= target < nums[mid]\`, and for a sorted right half \`nums[mid] < target <= nums[r]\`. \`mid\` was already tested for equality at the top of the loop, so including it in the range sends the search into the half that cannot contain the answer.

Use \`<=\` in \`nums[l] <= nums[mid]\`, not \`<\`. When the range narrows to two elements, \`mid == l\`, and \`<\` misclassifies that half as unsorted.

This is the classic \`l <= r\` template — you are looking for an exact value, not a boundary.`,
        complexity: { time: 'O(log n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int search(vector<int>& nums, int target) {
        int l = 0, r = nums.size() - 1;

        while (l <= r) {
            int mid = l + (r - l) / 2;
            if (nums[mid] == target) return mid;

            if (nums[l] <= nums[mid]) {           // <= : mid == l when width is 2
                // Left half sorted. Half-open: mid is already ruled out.
                if (nums[l] <= target && target < nums[mid]) r = mid - 1;
                else l = mid + 1;
            } else {
                // Right half sorted.
                if (nums[mid] < target && target <= nums[r]) l = mid + 1;
                else r = mid - 1;
            }
        }
        return -1;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int search(int[] nums, int target) {
        int l = 0, r = nums.length - 1;

        while (l <= r) {
            int mid = l + (r - l) / 2;
            if (nums[mid] == target) return mid;

            if (nums[l] <= nums[mid]) {
                if (nums[l] <= target && target < nums[mid]) r = mid - 1;
                else l = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[r]) l = mid + 1;
                else r = mid - 1;
            }
        }
        return -1;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function search(nums, target) {
    let l = 0, r = nums.length - 1;

    while (l <= r) {
        const mid = l + Math.floor((r - l) / 2);
        if (nums[mid] === target) return mid;

        if (nums[l] <= nums[mid]) {
            if (nums[l] <= target && target < nums[mid]) r = mid - 1;
            else l = mid + 1;
        } else {
            if (nums[mid] < target && target <= nums[r]) l = mid + 1;
            else r = mid - 1;
        }
    }
    return -1;
}`,
            },
        ],
        followUps: [
            'Why must the range checks exclude mid on one side?',
            'Solve it in two passes: find the pivot, then search one run. Which would you write under time pressure?',
            'Leetcode 81 allows duplicates. What is the worst case now?',
        ],
    },

    'find-peak-element': {
        restate:
            'Find any index larger than both its neighbours. Out-of-bounds counts as negative infinity, so a peak always exists.',
        body: `The most surprising problem in the section: **the array is not sorted at all**, and binary search still works.

**The observation:** compare \`nums[mid]\` with \`nums[mid + 1]\`.

- \`nums[mid] < nums[mid + 1]\` → you are on an ascending slope. Keep walking right and you must eventually stop rising — either you hit a peak or you run off the end, where the value is \`-∞\`. So a peak exists strictly to the right: \`l = mid + 1\`.
- \`nums[mid] > nums[mid + 1]\` → descending, so by the same argument a peak exists at \`mid\` or to its left: \`r = mid\`.

You are not searching for a value. You are following a slope uphill, discarding half the array each step because the guarantee "a peak exists on this side" is enough — you never need to know *which* peak.

That guarantee comes from the \`-∞\` boundary condition, which is why the problem states it. Without it an entirely increasing array would have no peak and the argument would collapse.

**The trap:** \`mid + 1\` must be in bounds. Boundary shape with \`while (l < r)\` gives this for free — when the loop runs, \`l < r\`, so \`mid < r\` and \`mid + 1 <= r\` is always valid. Writing \`l <= r\` here both reads out of bounds and never terminates.

Adjacent values are guaranteed unequal, so there is no third case to handle.`,
        complexity: { time: 'O(log n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int findPeakElement(vector<int>& nums) {
        int l = 0, r = nums.size() - 1;
        while (l < r) {                        // < : guarantees mid + 1 <= r
            int mid = l + (r - l) / 2;
            if (nums[mid] < nums[mid + 1]) l = mid + 1;  // uphill — peak to the right
            else r = mid;                                 // downhill — mid may be it
        }
        return l;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int findPeakElement(int[] nums) {
        int l = 0, r = nums.length - 1;
        while (l < r) {
            int mid = l + (r - l) / 2;
            if (nums[mid] < nums[mid + 1]) l = mid + 1;
            else r = mid;
        }
        return l;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function findPeakElement(nums) {
    let l = 0, r = nums.length - 1;
    while (l < r) {
        const mid = l + Math.floor((r - l) / 2);
        if (nums[mid] < nums[mid + 1]) l = mid + 1;
        else r = mid;
    }
    return l;
}`,
            },
        ],
        followUps: [
            'Why is it valid to binary search an unsorted array here?',
            'Where exactly is the -infinity boundary assumption used?',
            'Find a peak in a 2D grid (Leetcode 1901). Does the same argument extend?',
        ],
    },

    'capacity-to-ship-packages': {
        restate:
            'Ship packages in order within `days` days. What is the smallest ship capacity that suffices?',
        body: `Koko in different clothes, and putting them next to each other is the point of this section: once you can see the shape, two unrelated-sounding problems become the same four lines.

**The shape:** "can we finish with capacity c?" is monotonic — if a capacity works, every larger one does too. So binary search the capacity.

**The bounds are where this differs from Koko, and they need an argument, not a guess:**

- **Low = \`max(weights)\`.** Anything smaller can never load the heaviest package, at any number of days. It is not just a tight bound, it is the point below which the problem is unsolvable.
- **High = \`sum(weights)\`.** With that capacity everything ships in one day, which is the most any answer could need.

The feasibility check is a greedy simulation: walk the packages in order, adding to the current day's load; when the next one would exceed capacity, start a new day. Because the order is **fixed** (unlike a bin-packing problem, where you could rearrange), greedy is exactly optimal here — there is no choice to make.

**The trap:** start the day counter at 1, not 0. You are already loading day one before any overflow happens, and counting only the overflows reports one day fewer than reality — which quietly accepts capacities that are one day short.

Note the asymmetry with Koko: there the upper bound was \`max\`, here \`max\` is the *lower* bound. Deriving the bounds from the problem rather than copying them across is what stops that from becoming a bug.`,
        complexity: { time: 'O(n · log(sum of weights))', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int shipWithinDays(vector<int>& weights, int days) {
        int l = *max_element(weights.begin(), weights.end());  // must fit the heaviest
        int r = accumulate(weights.begin(), weights.end(), 0);  // all in one day

        while (l < r) {
            int cap = l + (r - l) / 2;
            int need = 1, load = 0;          // start at day 1, not 0
            for (int w : weights) {
                if (load + w > cap) { need++; load = 0; }
                load += w;
            }
            if (need <= days) r = cap;
            else l = cap + 1;
        }
        return l;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int shipWithinDays(int[] weights, int days) {
        int l = 0, r = 0;
        for (int w : weights) { l = Math.max(l, w); r += w; }

        while (l < r) {
            int cap = l + (r - l) / 2;
            int need = 1, load = 0;
            for (int w : weights) {
                if (load + w > cap) { need++; load = 0; }
                load += w;
            }
            if (need <= days) r = cap;
            else l = cap + 1;
        }
        return l;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function shipWithinDays(weights, days) {
    let l = Math.max(...weights);
    let r = weights.reduce((a, b) => a + b, 0);

    while (l < r) {
        const cap = l + Math.floor((r - l) / 2);
        let need = 1, load = 0;
        for (const w of weights) {
            if (load + w > cap) { need++; load = 0; }
            load += w;
        }
        if (need <= days) r = cap;
        else l = cap + 1;
    }
    return l;
}`,
            },
        ],
        followUps: [
            'Why is low = max(weights) here, when Koko used max(piles) as the HIGH bound?',
            'Why is the greedy feasibility check optimal? Where does the fixed order matter?',
            'Split Array Largest Sum (Leetcode 410) — the same problem again, phrased as maths.',
        ],
    },

    'median-of-two-sorted-arrays': {
        restate:
            'The median of two sorted arrays, without merging them. O(log(m + n)).',
        body: `The hardest problem on the sheet, and the one where the logarithmic requirement is doing all the work — merging is \`O(m + n)\` and takes four lines, so the constraint is the entire question.

**The reframing:** the median splits the combined data into a left half and a right half of (nearly) equal size, where every value on the left is \`<=\` every value on the right. You do not need to *build* those halves — you only need to know **how many elements each array contributes to the left half**.

Pick a number of elements \`i\` to take from \`A\`. Then the count from \`B\` is forced: \`j = (m + n + 1) / 2 - i\`. So there is only one free variable, and it ranges over \`[0, m]\` — binary search it.

A choice of \`i\` is correct when the partition holds across both arrays:

\`\`\`
A[i-1] <= B[j]   and   B[j-1] <= A[i]
\`\`\`

If \`A[i-1] > B[j]\`, you took too much from \`A\`, so search left. If \`B[j-1] > A[i]\`, too little, search right.

**Three things that make this survivable:**

**Binary search the SHORTER array.** Swap first if needed. Otherwise \`j\` can fall outside \`B\`'s bounds and the index maths breaks.

**Use ±∞ for the out-of-range edges** — \`i == 0\` means nothing from \`A\` is on the left, so treat \`A[i-1]\` as \`-∞\`; \`i == m\` makes \`A[i]\` \`+∞\`. That is what removes the four empty-array special cases; without it this becomes unwritable under pressure.

**\`(m + n + 1) / 2\`, with the \`+1\`.** It puts the extra element on the left for odd totals, so the odd case is just \`max(left)\` and the even case is the average of \`max(left)\` and \`min(right)\`.

Be honest in an interview: say the merge answer, state that it is \`O(m + n)\`, then build this. Nobody derives it cold.`,
        complexity: { time: 'O(log(min(m, n)))', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    double findMedianSortedArrays(vector<int>& A, vector<int>& B) {
        if (A.size() > B.size()) return findMedianSortedArrays(B, A);  // shorter first

        int m = A.size(), n = B.size();
        int half = (m + n + 1) / 2;          // +1 puts the extra on the LEFT
        int l = 0, r = m;

        while (l <= r) {
            int i = l + (r - l) / 2;         // taken from A
            int j = half - i;                // forced: taken from B

            // ±infinity at the edges removes every empty-side special case.
            long aLeft  = (i == 0) ? LONG_MIN : A[i - 1];
            long aRight = (i == m) ? LONG_MAX : A[i];
            long bLeft  = (j == 0) ? LONG_MIN : B[j - 1];
            long bRight = (j == n) ? LONG_MAX : B[j];

            if (aLeft <= bRight && bLeft <= aRight) {
                if ((m + n) % 2) return max(aLeft, bLeft);
                return (max(aLeft, bLeft) + min(aRight, bRight)) / 2.0;
            }
            if (aLeft > bRight) r = i - 1;   // took too much from A
            else l = i + 1;                  // took too little
        }
        return 0.0;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public double findMedianSortedArrays(int[] A, int[] B) {
        if (A.length > B.length) return findMedianSortedArrays(B, A);

        int m = A.length, n = B.length;
        int half = (m + n + 1) / 2;
        int l = 0, r = m;

        while (l <= r) {
            int i = l + (r - l) / 2;
            int j = half - i;

            long aLeft  = (i == 0) ? Long.MIN_VALUE : A[i - 1];
            long aRight = (i == m) ? Long.MAX_VALUE : A[i];
            long bLeft  = (j == 0) ? Long.MIN_VALUE : B[j - 1];
            long bRight = (j == n) ? Long.MAX_VALUE : B[j];

            if (aLeft <= bRight && bLeft <= aRight) {
                if ((m + n) % 2 == 1) return Math.max(aLeft, bLeft);
                return (Math.max(aLeft, bLeft) + Math.min(aRight, bRight)) / 2.0;
            }
            if (aLeft > bRight) r = i - 1;
            else l = i + 1;
        }
        return 0.0;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function findMedianSortedArrays(A, B) {
    if (A.length > B.length) return findMedianSortedArrays(B, A);

    const m = A.length, n = B.length;
    const half = Math.floor((m + n + 1) / 2);
    let l = 0, r = m;

    while (l <= r) {
        const i = l + Math.floor((r - l) / 2);
        const j = half - i;

        const aLeft  = i === 0 ? -Infinity : A[i - 1];
        const aRight = i === m ?  Infinity : A[i];
        const bLeft  = j === 0 ? -Infinity : B[j - 1];
        const bRight = j === n ?  Infinity : B[j];

        if (aLeft <= bRight && bLeft <= aRight) {
            if ((m + n) % 2 === 1) return Math.max(aLeft, bLeft);
            return (Math.max(aLeft, bLeft) + Math.min(aRight, bRight)) / 2;
        }
        if (aLeft > bRight) r = i - 1;
        else l = i + 1;
    }
    return 0;
}`,
            },
        ],
        followUps: [
            'Why binary search the SHORTER array? Construct an input where the other way breaks.',
            'Where is the +1 in (m + n + 1) / 2 actually used?',
            'Generalise to the kth smallest element of two sorted arrays.',
        ],
    },
};
