// lib/dsa/approaches/two-pointers.ts
//
// "Our approach" pages for the Two Pointers section.
//
// Same four beats as every other approach file (brute force → why it is too
// slow → the observation → the trap); see approaches/arrays-hashing.ts for the
// house style in full.
//
// ONE THEME RUNS THROUGH ALL EIGHT and is worth naming here rather than
// repeating in each: a two-pointer solution is only correct if you can argue
// that moving a pointer never discards an answer. On sorted input that argument
// comes from the ordering; on Container With Most Water it comes from a
// dominance argument; on Trapping Rain Water it comes from knowing one side's
// maximum bounds the other. Where a page spends its words, that is why.

import type { DsaApproach } from '../types';

export const twoPointersApproaches: Record<string, DsaApproach> = {
    'valid-palindrome': {
        restate:
            'Ignoring case and everything that is not a letter or digit, does the string read the same backwards?',
        body: `The easy version is to build a cleaned copy of the string, reverse it and compare. That is correct, and it is \`O(n)\` extra space for something you can do in \`O(1)\`.

**The observation:** a palindrome check is a comparison between position \`i\` from the front and position \`i\` from the back. You do not need the cleaned string to exist — you only need to be able to *walk* to the next meaningful character from each end.

So put one pointer at each end. Advance the left one while it is on a character that does not count; retreat the right one likewise. When both land on something meaningful, compare them case-insensitively. Match → step both inward. Mismatch → return false immediately.

**The trap, and it is the one people hit:** the inner skip loops need \`left < right\` in their own conditions, not just the outer loop. A string with no alphanumerics at all (\`",.\`) will otherwise walk the left pointer straight off the end of the string looking for a character that is not there.

An empty string is a palindrome, and this falls out for free: the loop never runs and you return true.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    bool isPalindrome(string s) {
        int l = 0, r = s.size() - 1;
        while (l < r) {
            // The l < r guard belongs on the skip loops too, or an
            // all-punctuation string walks off the end.
            while (l < r && !isalnum(s[l])) l++;
            while (l < r && !isalnum(s[r])) r--;
            if (tolower(s[l]) != tolower(s[r])) return false;
            l++; r--;
        }
        return true;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public boolean isPalindrome(String s) {
        int l = 0, r = s.length() - 1;
        while (l < r) {
            while (l < r && !Character.isLetterOrDigit(s.charAt(l))) l++;
            while (l < r && !Character.isLetterOrDigit(s.charAt(r))) r--;
            if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r))) {
                return false;
            }
            l++; r--;
        }
        return true;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function isPalindrome(s) {
    const ok = (c) => /[a-z0-9]/i.test(c);
    let l = 0, r = s.length - 1;
    while (l < r) {
        while (l < r && !ok(s[l])) l++;
        while (l < r && !ok(s[r])) r--;
        if (s[l].toLowerCase() !== s[r].toLowerCase()) return false;
        l++; r--;
    }
    return true;
}`,
            },
        ],
        followUps: [
            'Allow at most one character to be deleted (Leetcode 680). Where does the two-pointer scan branch?',
            'What changes if "alphanumeric" means Unicode letters rather than ASCII?',
        ],
    },

    'two-sum-ii': {
        restate:
            'Find the two 1-indexed positions in a SORTED array whose values add to the target.',
        body: `You already know the hash-map answer from Two Sum: \`O(n)\` time, \`O(n)\` space. This version adds one word to the problem statement — *sorted* — and that word is worth the whole space budget.

**The observation:** with the array sorted, the sum of the outermost pair tells you which direction to move. Put \`l\` at the start and \`r\` at the end:

- \`sum > target\` → every pair using \`r\` is at least this large, because everything to the left of \`r\` is smaller. So \`r\` cannot be in the answer. Drop it: \`r--\`.
- \`sum < target\` → symmetric. \`l\` is too small to pair with anything. \`l++\`.
- equal → done.

That is the correctness argument, and it is what the interviewer wants to hear. Each step eliminates an entire index rather than a single pair, which is why \`O(n²)\` pairs get checked in \`O(n)\` steps.

**The trap:** the answer is **1-indexed**. Return \`[l + 1, r + 1]\`. It is the single most common wrong submission on this problem, and it is not a logic error — the algorithm was right.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    vector<int> twoSum(vector<int>& numbers, int target) {
        int l = 0, r = numbers.size() - 1;
        while (l < r) {
            int sum = numbers[l] + numbers[r];
            if (sum == target) return {l + 1, r + 1};  // 1-INDEXED
            if (sum < target) l++;
            else r--;
        }
        return {};
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int[] twoSum(int[] numbers, int target) {
        int l = 0, r = numbers.length - 1;
        while (l < r) {
            int sum = numbers[l] + numbers[r];
            if (sum == target) return new int[]{l + 1, r + 1};
            if (sum < target) l++;
            else r--;
        }
        return new int[]{};
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function twoSum(numbers, target) {
    let l = 0, r = numbers.length - 1;
    while (l < r) {
        const sum = numbers[l] + numbers[r];
        if (sum === target) return [l + 1, r + 1];
        if (sum < target) l++;
        else r--;
    }
    return [];
}`,
            },
        ],
        followUps: [
            'Why does this fail on an unsorted array? Would sorting first still be worth it?',
            'Solve it with binary search instead of a second pointer. What is the complexity then?',
        ],
    },

    'three-sum': {
        restate:
            'Find every unique triplet that sums to zero. Unique by VALUE, not by index.',
        body: `Three nested loops is \`O(n³)\` and, with \`n = 3000\`, hopeless.

**The observation:** fix one number and the problem collapses into one you can already solve. If the first element is \`nums[i]\`, you need two more summing to \`-nums[i]\` — and if the array is sorted, that is exactly Two Sum II, in \`O(n)\` with two pointers. One outer loop over \`i\`, an \`O(n)\` scan inside: \`O(n²)\`.

Sorting costs \`O(n log n)\`, which is free next to \`O(n²)\`, and it buys two things — the two-pointer scan, and a cheap way to handle duplicates.

**Duplicates are the whole difficulty.** The answer must not contain the same triplet twice, and de-duplicating at the end with a set is both slower and the answer interviewers are looking to improve. Because the array is sorted, equal values are adjacent, so:

- **Skip a repeated first element.** If \`nums[i] == nums[i-1]\`, every triplet starting here was already produced when \`i-1\` was the anchor. Note it is \`i-1\`, not \`i+1\` — comparing forwards would skip the *first* occurrence and lose valid triplets.
- **After recording a hit, advance \`l\` past its duplicates.** Otherwise \`[-2,0,0,2,2]\` emits \`[-2,0,2]\` twice.

\`r\` needs no explicit skip: once \`l\` has moved past its duplicates, a repeated \`r\` can no longer produce the same sum.

**One early exit worth knowing:** once \`nums[i] > 0\`, the smallest possible triplet from here is already positive, so you can break out entirely.`,
        complexity: { time: 'O(n²)', space: 'O(1) beyond the sort' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> out;
        int n = nums.size();

        for (int i = 0; i < n - 2; i++) {
            if (nums[i] > 0) break;                    // smallest triplet already > 0
            if (i > 0 && nums[i] == nums[i - 1]) continue;  // i-1, not i+1

            int l = i + 1, r = n - 1;
            while (l < r) {
                int sum = nums[i] + nums[l] + nums[r];
                if (sum < 0) l++;
                else if (sum > 0) r--;
                else {
                    out.push_back({nums[i], nums[l], nums[r]});
                    l++;
                    while (l < r && nums[l] == nums[l - 1]) l++;  // skip dup l
                }
            }
        }
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> out = new ArrayList<>();
        int n = nums.length;

        for (int i = 0; i < n - 2; i++) {
            if (nums[i] > 0) break;
            if (i > 0 && nums[i] == nums[i - 1]) continue;

            int l = i + 1, r = n - 1;
            while (l < r) {
                int sum = nums[i] + nums[l] + nums[r];
                if (sum < 0) l++;
                else if (sum > 0) r--;
                else {
                    out.add(Arrays.asList(nums[i], nums[l], nums[r]));
                    l++;
                    while (l < r && nums[l] == nums[l - 1]) l++;
                }
            }
        }
        return out;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function threeSum(nums) {
    nums.sort((a, b) => a - b);   // numeric sort — the default is lexicographic
    const out = [];
    const n = nums.length;

    for (let i = 0; i < n - 2; i++) {
        if (nums[i] > 0) break;
        if (i > 0 && nums[i] === nums[i - 1]) continue;

        let l = i + 1, r = n - 1;
        while (l < r) {
            const sum = nums[i] + nums[l] + nums[r];
            if (sum < 0) l++;
            else if (sum > 0) r--;
            else {
                out.push([nums[i], nums[l], nums[r]]);
                l++;
                while (l < r && nums[l] === nums[l - 1]) l++;
            }
        }
    }
    return out;
}`,
            },
        ],
        followUps: [
            'Why skip on nums[i] === nums[i-1] rather than nums[i+1]?',
            'Find the triplet whose sum is CLOSEST to a target (Leetcode 16).',
            'Generalise to kSum. What is the complexity?',
        ],
    },

    'container-with-most-water': {
        restate:
            'Pick two lines so the rectangle between them holds the most water. Area is the shorter line times the distance between them.',
        body: `Every pair is \`O(n²)\`. The two-pointer solution is five lines — the reason it works is the interesting part, and it is what you will be asked to justify.

Start with the widest possible container: \`l\` at 0, \`r\` at the end. Compute its area, then **move whichever pointer is on the shorter line** inward.

**Why that is safe.** Consider the shorter line — say the left one. Any container using it is capped at its height, and moving the *other* pointer inward only reduces the width. So every remaining container that still uses this short line is strictly worse than the one you just measured. Nothing is lost by discarding it. That is the exchange argument, and it is the answer to "how do you know you are not skipping the optimum?"

Moving the taller one instead is what makes this wrong: it might have been half of the best pair.

**Two details:**

Area uses \`min(height[l], height[r])\`, not the line you are about to move — the shorter one is the constraint, which is the whole reason it is the one you drop.

When the two heights are equal, moving either is fine. Both are capped at the same height, so both are eliminated by the same argument.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int maxArea(vector<int>& height) {
        int l = 0, r = height.size() - 1, best = 0;
        while (l < r) {
            int h = min(height[l], height[r]);
            best = max(best, h * (r - l));
            // Move the SHORTER side — every other container using it is
            // narrower and no taller, so nothing is lost.
            if (height[l] < height[r]) l++;
            else r--;
        }
        return best;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int maxArea(int[] height) {
        int l = 0, r = height.length - 1, best = 0;
        while (l < r) {
            int h = Math.min(height[l], height[r]);
            best = Math.max(best, h * (r - l));
            if (height[l] < height[r]) l++;
            else r--;
        }
        return best;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function maxArea(height) {
    let l = 0, r = height.length - 1, best = 0;
    while (l < r) {
        const h = Math.min(height[l], height[r]);
        best = Math.max(best, h * (r - l));
        if (height[l] < height[r]) l++;
        else r--;
    }
    return best;
}`,
            },
        ],
        followUps: [
            'Prove that moving the shorter line cannot skip the optimal container.',
            'What if the lines had width — how does the area formula change?',
        ],
    },

    'trapping-rain-water': {
        restate:
            'Given a height map, how much water sits in the dips after it rains?',
        body: `The key reframing, and everything follows from it: **solve it one column at a time.** The water sitting above column \`i\` is

\`\`\`
min(tallest wall to its left, tallest wall to its right) - height[i]
\`\`\`

clamped at zero. Water is held in by the lower of the two walls — that is the \`min\` — and the column's own bar displaces some of it.

The direct implementation scans left and right for each \`i\`: \`O(n²)\`. Precomputing \`leftMax[]\` and \`rightMax[]\` in two passes makes it \`O(n)\` time and \`O(n)\` space, and that is a perfectly good answer to give first.

**The observation that removes the arrays:** you never need both maxima exactly — you need the *smaller* of the two. So keep a running \`leftMax\` and \`rightMax\` with a pointer at each end, and always process the side whose running max is smaller.

Say \`leftMax < rightMax\`. There is definitely a wall of height \`rightMax\` somewhere to the right of \`l\`, so the true right maximum for column \`l\` is at least \`rightMax\`, which is already bigger than \`leftMax\`. The \`min\` is therefore \`leftMax\` — you can settle column \`l\` right now without knowing anything else about the right side. That is the whole trick.

**The trap:** update the running max *before* adding water, so a bar taller than everything seen so far contributes zero rather than a negative amount. Doing it in that order removes the need for a \`max(0, …)\` clamp entirely.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int trap(vector<int>& height) {
        if (height.empty()) return 0;
        int l = 0, r = height.size() - 1;
        int leftMax = height[l], rightMax = height[r];
        int water = 0;

        while (l < r) {
            if (leftMax < rightMax) {
                l++;
                leftMax = max(leftMax, height[l]);  // update BEFORE adding
                water += leftMax - height[l];
            } else {
                r--;
                rightMax = max(rightMax, height[r]);
                water += rightMax - height[r];
            }
        }
        return water;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int trap(int[] height) {
        if (height.length == 0) return 0;
        int l = 0, r = height.length - 1;
        int leftMax = height[l], rightMax = height[r], water = 0;

        while (l < r) {
            if (leftMax < rightMax) {
                l++;
                leftMax = Math.max(leftMax, height[l]);
                water += leftMax - height[l];
            } else {
                r--;
                rightMax = Math.max(rightMax, height[r]);
                water += rightMax - height[r];
            }
        }
        return water;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function trap(height) {
    if (height.length === 0) return 0;
    let l = 0, r = height.length - 1;
    let leftMax = height[l], rightMax = height[r], water = 0;

    while (l < r) {
        if (leftMax < rightMax) {
            l++;
            leftMax = Math.max(leftMax, height[l]);
            water += leftMax - height[l];
        } else {
            r--;
            rightMax = Math.max(rightMax, height[r]);
            water += rightMax - height[r];
        }
    }
    return water;
}`,
            },
        ],
        followUps: [
            'Write the O(n) space version with leftMax[] and rightMax[] arrays first — can you derive the two-pointer one from it?',
            'Solve it with a monotonic stack instead. Which is easier to explain under pressure?',
            'Trapping Rain Water II — the 2D version (Leetcode 407). Why do two pointers stop working?',
        ],
    },

    'remove-duplicates-sorted-array': {
        restate:
            'Compact a sorted array in place so each value appears once, and return the new length.',
        body: `Because the array is sorted, duplicates are adjacent — which means you never have to search for them, only notice them as you pass.

**The observation:** this is a read/write split, not really a "two pointers converging" problem. One pointer reads every element; a second, slower one marks where the next unique value should be *written*. Since the write pointer never overtakes the read pointer, you can overwrite in place with no risk of clobbering something you have not read.

Keep \`k\` as the count of uniques written so far (and therefore the index to write at next). Walk \`i\` from 1. Whenever \`nums[i]\` differs from the last value you kept — \`nums[k - 1]\` — it is new, so write it at \`k\` and increment.

Comparing against \`nums[k - 1]\` rather than \`nums[i - 1]\` is the habit worth forming: it is the last value you actually *kept*, which is what generalises. In the "allow each value twice" variant you compare against \`nums[k - 2]\` and nothing else changes.

**Two things about the contract:** the array beyond the returned length is explicitly allowed to be anything, so there is no cleanup to do. And \`k\` starts at 1 because a non-empty sorted array always has at least one unique element — guard the empty case separately.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int removeDuplicates(vector<int>& nums) {
        if (nums.empty()) return 0;
        int k = 1;                       // uniques written so far
        for (int i = 1; i < nums.size(); i++) {
            if (nums[i] != nums[k - 1]) {   // last KEPT value, not nums[i-1]
                nums[k++] = nums[i];
            }
        }
        return k;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int removeDuplicates(int[] nums) {
        if (nums.length == 0) return 0;
        int k = 1;
        for (int i = 1; i < nums.length; i++) {
            if (nums[i] != nums[k - 1]) {
                nums[k++] = nums[i];
            }
        }
        return k;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function removeDuplicates(nums) {
    if (nums.length === 0) return 0;
    let k = 1;
    for (let i = 1; i < nums.length; i++) {
        if (nums[i] !== nums[k - 1]) {
            nums[k++] = nums[i];
        }
    }
    return k;
}`,
            },
        ],
        followUps: [
            'Allow each value to appear at most twice (Leetcode 80). Only one character changes.',
            'Why is comparing against nums[k-1] better practice than nums[i-1]?',
        ],
    },

    'move-zeroes': {
        restate:
            'Push every zero to the end, in place, without disturbing the order of the non-zero values.',
        body: `The stable-order requirement is what makes this more than a counting exercise — you cannot just count zeroes and rebuild, or rather you can, but the interviewer is watching for the in-place swap.

**The observation:** same read/write split as Remove Duplicates. A read pointer visits everything; a write pointer marks the next slot a non-zero value belongs in. Every time you read a non-zero, swap it down to the write slot and advance.

Order is preserved because both pointers only ever move forward, and non-zeroes are written in exactly the order they were read.

**Why swap rather than assign?** You could write non-zeroes forward and then fill the tail with zeroes — two passes, equally correct. The swap version does it in one, because the value being displaced at the write slot is always either a zero (which belongs later) or the same element (when the pointers coincide, early in a zero-free prefix). Swapping puts it exactly where it should go for free.

**The trap:** advance the write pointer *only* on a non-zero. Advancing it every iteration turns the algorithm into a no-op that swaps every element with itself.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    void moveZeroes(vector<int>& nums) {
        int write = 0;
        for (int read = 0; read < nums.size(); read++) {
            if (nums[read] != 0) {
                swap(nums[write], nums[read]);
                write++;              // ONLY on a non-zero
            }
        }
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public void moveZeroes(int[] nums) {
        int write = 0;
        for (int read = 0; read < nums.length; read++) {
            if (nums[read] != 0) {
                int t = nums[write];
                nums[write] = nums[read];
                nums[read] = t;
                write++;
            }
        }
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function moveZeroes(nums) {
    let write = 0;
    for (let read = 0; read < nums.length; read++) {
        if (nums[read] !== 0) {
            [nums[write], nums[read]] = [nums[read], nums[write]];
            write++;
        }
    }
}`,
            },
        ],
        followUps: [
            'Minimise the number of writes. When is a swap wasteful here?',
            'Move all instances of an arbitrary value instead (Leetcode 27) — does order still need preserving?',
        ],
    },

    'four-sum': {
        restate:
            'Find every unique quadruplet summing to a target. Unique by value, and the target is no longer fixed at zero.',
        body: `This is 3Sum with one more loop wrapped around it, and it is on the sheet mainly to make the *pattern* explicit: kSum is "fix an element, solve (k-1)Sum on the rest", bottoming out at 2Sum with two pointers.

Sort, then two nested loops fix \`i\` and \`j\`, and two pointers scan for the remaining pair. \`O(n³)\`.

**Duplicate handling is the same rule applied twice**, and the second one is where people slip. Skip a repeated \`i\` when \`nums[i] == nums[i-1]\`; skip a repeated \`j\` when \`nums[j] == nums[j-1]\` **and \`j > i + 1\`**. Without that second condition you skip the first valid \`j\` whenever it happens to equal \`nums[i]\` — which quietly loses every quadruplet with a repeated leading pair, like \`[2,2,2,2]\` with target 8.

**Overflow is real here, unlike in 3Sum.** Values go up to \`10⁹\` and you are adding four of them: about \`4 × 10⁹\`, past the \`2.1 × 10⁹\` ceiling of a 32-bit signed int. In C++ and Java the sum must be a \`long long\` / \`long\`, or it wraps to a negative number and the pointer comparison sends the scan the wrong way. JavaScript numbers are doubles, so this particular bug cannot happen there — which is exactly why it is worth knowing it exists in the other two.`,
        complexity: { time: 'O(n³)', space: 'O(1) beyond the sort' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    vector<vector<int>> fourSum(vector<int>& nums, int target) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> out;
        int n = nums.size();

        for (int i = 0; i < n - 3; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            for (int j = i + 1; j < n - 2; j++) {
                // j > i + 1 matters: without it the first valid j is skipped
                // whenever nums[j] == nums[i].
                if (j > i + 1 && nums[j] == nums[j - 1]) continue;

                int l = j + 1, r = n - 1;
                while (l < r) {
                    // long long: four values near 1e9 overflow a 32-bit int.
                    long long sum = (long long)nums[i] + nums[j] + nums[l] + nums[r];
                    if (sum < target) l++;
                    else if (sum > target) r--;
                    else {
                        out.push_back({nums[i], nums[j], nums[l], nums[r]});
                        l++;
                        while (l < r && nums[l] == nums[l - 1]) l++;
                    }
                }
            }
        }
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public List<List<Integer>> fourSum(int[] nums, int target) {
        Arrays.sort(nums);
        List<List<Integer>> out = new ArrayList<>();
        int n = nums.length;

        for (int i = 0; i < n - 3; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            for (int j = i + 1; j < n - 2; j++) {
                if (j > i + 1 && nums[j] == nums[j - 1]) continue;

                int l = j + 1, r = n - 1;
                while (l < r) {
                    long sum = (long) nums[i] + nums[j] + nums[l] + nums[r];
                    if (sum < target) l++;
                    else if (sum > target) r--;
                    else {
                        out.add(Arrays.asList(nums[i], nums[j], nums[l], nums[r]));
                        l++;
                        while (l < r && nums[l] == nums[l - 1]) l++;
                    }
                }
            }
        }
        return out;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function fourSum(nums, target) {
    nums.sort((a, b) => a - b);
    const out = [];
    const n = nums.length;

    for (let i = 0; i < n - 3; i++) {
        if (i > 0 && nums[i] === nums[i - 1]) continue;
        for (let j = i + 1; j < n - 2; j++) {
            if (j > i + 1 && nums[j] === nums[j - 1]) continue;

            let l = j + 1, r = n - 1;
            while (l < r) {
                // Doubles hold this exactly — no overflow to guard against,
                // unlike the C++ and Java versions.
                const sum = nums[i] + nums[j] + nums[l] + nums[r];
                if (sum < target) l++;
                else if (sum > target) r--;
                else {
                    out.push([nums[i], nums[j], nums[l], nums[r]]);
                    l++;
                    while (l < r && nums[l] === nums[l - 1]) l++;
                }
            }
        }
    }
    return out;
}`,
            },
        ],
        followUps: [
            'Write a general kSum that recurses down to the two-pointer base case.',
            'Why does the j-loop need `j > i + 1` in its duplicate check when the i-loop needs only `i > 0`?',
            '4Sum II (Leetcode 454) gives you four separate arrays. Why is that O(n²) instead?',
        ],
    },
};
