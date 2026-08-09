// lib/dsa/approaches/bit-manipulation.ts
//
// "Our approach" pages for the Bit Manipulation section.
//
// Same four beats as every other approach file (brute force → why it is too
// slow → the observation → the trap); see approaches/arrays-hashing.ts for the
// house style in full.
//
// THE ENTIRE TOOLKIT IS FIVE IDENTITIES. Learn these and the section is a few
// evenings; skip them and every problem looks like a separate trick.
//
//   x ^ x  == 0        XOR cancels a pair
//   x ^ 0  == x        ...and leaves a lone value alone
//   n & (n - 1)        clears the LOWEST set bit
//   n & 1              reads the lowest bit; n >> 1 discards it
//   1 << k             a mask for bit k
//
// XOR is the star, and its power comes from being commutative and associative:
// the ORDER of a sequence of XORs does not matter. That is what lets you fold
// an entire array into one accumulator and have every duplicated value quietly
// annihilate itself, regardless of where the duplicates sat.
//
// ⚠️  THE LANGUAGE TRAP THAT RUNS THROUGH THIS WHOLE SECTION.
//
// C++ and Java: right-shifting a NEGATIVE signed int with >> copies the sign
// bit, so the loop never terminates. Use unsigned in C++ and >>> in Java.
//
// JavaScript: bitwise operators coerce to 32-bit SIGNED ints, so any result
// with bit 31 set comes back negative. Fix it with >>> 0 to reinterpret as
// unsigned. Every page that shifts says which of these applies.

import type { DsaApproach } from '../types';

export const bitManipulationApproaches: Record<string, DsaApproach> = {
    'single-number': {
        restate:
            'Every element appears twice except one. Find it in O(n) time and O(1) space.',
        body: `A hash set solves it in \`O(n)\` time but \`O(n)\` space. The constraints ask for constant space, which rules out storing anything per element — and that is the hint.

**The observation:** XOR every element together. Two identities do the work:

- \`x ^ x == 0\` — each pair annihilates itself
- \`x ^ 0 == x\` — the survivor passes through untouched

Since XOR is commutative and associative, the duplicates cancel **wherever they sit** in the array. They do not need to be adjacent, sorted, or paired up in any way. That order-independence is the whole reason this works on unsorted input, and it is the thing to say rather than just asserting that XOR "cancels".

One accumulator seeded at 0, one pass, done.

**Why not sum-based tricks:** subtracting \`2 * sum(set)\` from \`sum(array)\` also works but needs the set — back to \`O(n)\` space. XOR needs nothing.

**The trap:** seed the accumulator at **0**, not at \`nums[0]\`. Seeding with the first element and then XOR-ing the whole array includes it twice, cancelling the one value you were trying to find. If you do seed with \`nums[0]\`, the loop must start at index 1.

Worth knowing that the technique generalises: XOR-ing \`0..n\` against the array solves Missing Number later in this section, and the same cancellation idea appears in Find the Duplicate.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int singleNumber(vector<int>& nums) {
        int result = 0;              // seed 0, NOT nums[0]
        for (int n : nums) result ^= n;   // pairs cancel wherever they are
        return result;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int singleNumber(int[] nums) {
        int result = 0;
        for (int n : nums) result ^= n;
        return result;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function singleNumber(nums) {
    let result = 0;
    for (const n of nums) result ^= n;
    return result;
}`,
            },
        ],
        followUps: [
            'Why does XOR work on unsorted input? Name the property.',
            'Two numbers appear once, everything else twice (Leetcode 260).',
            'What happens if you seed with nums[0] and loop from index 0?',
        ],
    },

    'number-of-1-bits': {
        restate: 'Count the set bits in a 32-bit unsigned integer (the Hamming weight).',
        body: `The straightforward loop checks each of the 32 bits: \`n & 1\` reads the lowest, \`n >>= 1\` discards it. Always 32 iterations.

**The better observation — \`n & (n - 1)\` clears the lowest set bit.** Subtracting 1 flips that bit to 0 and turns every zero below it into a 1; AND-ing with the original keeps only the bits above, so exactly one 1 disappears per step.

So loop while \`n != 0\`, applying \`n &= n - 1\` and counting. The iteration count equals the **number of set bits**, not the width of the type — for a sparse number like 8 (\`1000\`) that is one iteration instead of 32.

Work through \`12 & 11\`: \`1100 & 1011 = 1000\`. The lowest set bit is gone and nothing else changed. That trace is the explanation; the identity is not obvious from the formula alone.

**The language traps, and they are the real content here:**

**C++ and Java:** if you use the shift loop, a negative signed value right-shifted with \`>>\` copies the sign bit and loops forever. Take the argument as \`uint32_t\` in C++, or use \`>>>\` in Java. The \`n & (n-1)\` version sidesteps this entirely, which is another reason to prefer it.

**JavaScript:** bitwise ops coerce to 32-bit *signed*, so an input with bit 31 set arrives negative. \`n >>> 0\` reinterprets it as unsigned before the loop.

**Built-ins exist** — \`__builtin_popcount\`, \`Integer.bitCount\` — and are what you would ship. Say so, then write the loop, because the loop is what is being asked for.`,
        complexity: { time: 'O(number of set bits)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int hammingWeight(uint32_t n) {     // UNSIGNED: >> on a negative loops forever
        int count = 0;
        while (n) {
            n &= (n - 1);                // clears the lowest set bit
            count++;
        }
        return count;                    // std::popcount(n) in C++20
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int hammingWeight(int n) {
        int count = 0;
        while (n != 0) {
            n &= (n - 1);   // no shifting, so no sign-extension problem
            count++;
        }
        return count;       // Integer.bitCount(n) in production
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function hammingWeight(n) {
    let x = n >>> 0;        // reinterpret as unsigned 32-bit
    let count = 0;
    while (x !== 0) {
        x &= (x - 1);
        count++;
    }
    return count;
}`,
            },
        ],
        followUps: [
            'Trace 12 & 11 in binary. Why does exactly one bit disappear?',
            'Count the differing bits between two numbers (Hamming distance).',
            'What does the shift version do on a negative int in Java?',
        ],
    },

    'counting-bits': {
        restate: 'For every number from 0 to n, return how many set bits it has.',
        body: `Calling the previous problem \`n\` times is \`O(n log n)\` and is the expected first answer. The follow-up asks for a single pass, and that makes this a **DP problem wearing a bit-manipulation hat**.

**The observation:** every number's bit count relates to a *smaller* number you have already computed. Two clean recurrences, and either is fine:

**Halving.** \`i >> 1\` is \`i\` with the last bit removed, so it has the same set bits minus whatever the last bit was:

\`\`\`
dp[i] = dp[i >> 1] + (i & 1)
\`\`\`

**Lowest-bit removal.** Reusing \`i & (i - 1)\` from the previous problem, that value is \`i\` with exactly one set bit gone:

\`\`\`
dp[i] = dp[i & (i - 1)] + 1
\`\`\`

Both are \`O(1)\` per entry, so the whole array is \`O(n)\`.

**Why the second is more satisfying:** it makes the connection to the previous problem explicit — the same identity that made the count fast now makes the recurrence obvious.

**The trap: \`i >> 1\` and \`i & (i - 1)\` are both strictly less than \`i\`**, which is exactly why filling upward from 0 works. If either could be \`>= i\` you would read an uncomputed cell. Say that when justifying the fill order; it is the same reasoning as any bottom-up DP.

**Base case:** \`dp[0] = 0\`. Zero has no set bits, and both recurrences bottom out there.

The result array must have \`n + 1\` entries — the range is inclusive.`,
        complexity: { time: 'O(n)', space: 'O(n) for the output' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    vector<int> countBits(int n) {
        vector<int> dp(n + 1, 0);        // n+1: the range is inclusive
        for (int i = 1; i <= n; i++) {
            // i & (i-1) is i with one set bit removed, and is always < i.
            dp[i] = dp[i & (i - 1)] + 1;
        }
        return dp;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int[] countBits(int n) {
        int[] dp = new int[n + 1];
        for (int i = 1; i <= n; i++) {
            dp[i] = dp[i & (i - 1)] + 1;
        }
        return dp;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function countBits(n) {
    const dp = new Array(n + 1).fill(0);
    for (let i = 1; i <= n; i++) {
        dp[i] = dp[i & (i - 1)] + 1;   // or dp[i >> 1] + (i & 1)
    }
    return dp;
}`,
            },
        ],
        followUps: [
            'Write the dp[i >> 1] + (i & 1) version. Which reads better?',
            'Why is filling upward from 0 valid for both recurrences?',
            'Why does the output array need n + 1 entries?',
        ],
    },

    'reverse-bits': {
        restate: 'Reverse the order of the 32 bits of an unsigned integer.',
        body: `**The observation:** bit \`i\` of the input becomes bit \`31 - i\` of the output. So walk all 32 positions, read one bit from the bottom of the input, and place it at the correct height in the result.

Two equivalent ways to say it, and both are fine:

- **Extract and place** — \`bit = (n >> i) & 1\`, then \`result |= bit << (31 - i)\`.
- **Shift-and-append** — shift the result left, OR in the input's lowest bit, shift the input right. The result assembles in reverse automatically.

Always exactly 32 iterations regardless of the value, so it is \`O(1)\`.

**The traps are almost entirely about signedness, and this problem is where they bite hardest of anything in the section.**

**JavaScript:** \`result |= bit << 31\` produces a *negative* number, because bitwise operations coerce to 32-bit signed. The final \`>>> 0\` is not cosmetic — without it a correct algorithm returns the wrong number for every input with the top bit set. Also use \`>>>\` when shifting the input right.

**Java:** take the input as \`int\` (the signature requires it) but shift with \`>>>\`, never \`>>\`. Sign extension fills with 1s and corrupts everything.

**C++:** use \`uint32_t\` throughout and the problem disappears.

**The follow-up interviewers ask:** *"if this is called many times, how would you optimise?"* Precompute a lookup table for all 256 byte values, then reverse a 32-bit number as four table lookups assembled in reverse order. That answer is really what the question is for.`,
        complexity: { time: 'O(1) — always 32 iterations', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    uint32_t reverseBits(uint32_t n) {
        uint32_t result = 0;
        for (int i = 0; i < 32; i++) {
            uint32_t bit = (n >> i) & 1;
            result |= bit << (31 - i);   // bit i lands at 31 - i
        }
        return result;
    }
};`,
            },
            {
                lang: 'java',
                source: `public class Solution {
    public int reverseBits(int n) {
        int result = 0;
        for (int i = 0; i < 32; i++) {
            int bit = (n >>> i) & 1;     // >>> , not >> : no sign extension
            result |= bit << (31 - i);
        }
        return result;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function reverseBits(n) {
    let result = 0;
    for (let i = 0; i < 32; i++) {
        const bit = (n >>> i) & 1;
        result |= bit << (31 - i);
    }
    // ESSENTIAL: bitwise ops yield a SIGNED 32-bit int, so anything with the
    // top bit set comes back negative. >>> 0 reinterprets it as unsigned.
    return result >>> 0;
}`,
            },
        ],
        followUps: [
            'What does the JS version return without the final >>> 0?',
            'Optimise for many repeated calls. (A 256-entry byte lookup table.)',
            'Reverse only the bits within each byte, keeping byte order.',
        ],
    },

    'missing-number': {
        restate:
            'An array holds n distinct numbers from the range [0, n]. One is missing — find it.',
        body: `Three good solutions, and being able to give all three with their trade-offs is what the problem is for.

**Sorting** is \`O(n log n)\` and modifies the input. **A hash set** is \`O(n)\` time but \`O(n)\` space. Both are worth naming before improving.

**The maths solution:** the numbers \`0..n\` sum to \`n(n+1)/2\` by Gauss's formula. Subtract the actual array sum and the difference is the missing value. One pass, \`O(1)\` space, and it reads as a one-liner.

**The XOR solution:** XOR every index \`0..n\` together with every array value. Each present number appears exactly twice — once as an index, once as a value — and cancels. The missing one appears only as an index and survives. Same idea as Single Number, applied across two sequences.

**Which to give:** XOR, because it **cannot overflow**. The Gauss formula computes \`n(n+1)/2\`, which for large \`n\` exceeds a 32-bit int before the subtraction happens — and that is a genuine bug in the naive version, not a theoretical one. Mention the formula, note the overflow risk, then write XOR.

**If you do use the sum:** accumulate in a 64-bit type, or subtract as you go (\`total += i - nums[i]\`) so the running value stays small. The second is neater and stays in \`int\`.

**The trap in the XOR version:** the loop must cover \`0..n\` inclusive for the indices — that is \`n + 1\` values against \`n\` array entries. Seeding the accumulator with \`n\` and then XOR-ing \`i ^ nums[i]\` for \`i\` in \`0..n-1\` is the compact way to get that right.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int missingNumber(vector<int>& nums) {
        int n = nums.size();
        int result = n;                  // seed with n: it has no index below
        for (int i = 0; i < n; i++) {
            result ^= i ^ nums[i];       // each present value cancels itself
        }
        return result;                    // XOR cannot overflow, unlike n(n+1)/2
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int missingNumber(int[] nums) {
        int n = nums.length;
        int result = n;
        for (int i = 0; i < n; i++) {
            result ^= i ^ nums[i];
        }
        return result;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function missingNumber(nums) {
    const n = nums.length;
    let result = n;
    for (let i = 0; i < n; i++) {
        result ^= i ^ nums[i];
    }
    return result;
}`,
            },
        ],
        followUps: [
            'At what n does n(n+1)/2 overflow a 32-bit int?',
            'Two numbers are missing instead of one. Does XOR still work?',
            'Write the sum version so it cannot overflow.',
        ],
    },

    'sum-of-two-integers': {
        restate: 'Add two integers without using + or −.',
        body: `Addition rebuilt from logic gates, and the two halves are worth naming separately.

**The observation, and it is the whole problem:**

- **\`a ^ b\`** is the sum **ignoring carries**. XOR is addition mod 2 per bit: \`1+1\` gives 0 with the carry dropped, which is exactly what XOR does.
- **\`(a & b) << 1\`** is the **carries alone**. A carry happens where both bits are 1, and it belongs one position to the left.

Add those two pieces and you have the true sum — but "add" is what you are not allowed to do, so **loop**: let \`a\` become the partial sum and \`b\` become the carries, and repeat until there are no carries left. Each round pushes the carries further left, so it terminates in at most 32 iterations.

**The trap that fails most submissions: negative numbers.** Left-shifting a negative signed value is undefined behaviour in C++ and overflow in Java. Do the arithmetic on **unsigned** types and cast back at the end — the bit pattern of two's-complement addition is identical either way, so the result is correct.

**JavaScript needs different care.** Bitwise operators already truncate to 32-bit signed, so the loop works as-is and no unsigned type is needed. Use \`b !== 0\` as the condition, not \`b > 0\` — a negative carry is still a carry, and \`> 0\` exits early and silently returns a wrong answer on mixed-sign input.

**Python needs its own workaround** entirely, because integers are arbitrary precision and the carry never terminates. Worth mentioning if asked, though it is not one of our three languages.`,
        complexity: { time: 'O(1) — at most 32 iterations', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int getSum(int a, int b) {
        // UNSIGNED: shifting a negative signed value left is UB.
        unsigned int x = a, y = b;
        while (y != 0) {
            unsigned int carry = (x & y) << 1;   // carries, one place left
            x = x ^ y;                            // sum without carries
            y = carry;
        }
        return (int)x;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int getSum(int a, int b) {
        while (b != 0) {
            int carry = (a & b) << 1;
            a = a ^ b;
            b = carry;
        }
        return a;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function getSum(a, b) {
    // JS bitwise ops already truncate to 32-bit signed, so this needs no casts.
    while (b !== 0) {                 // !== 0, NOT > 0: carries can be negative
        const carry = (a & b) << 1;
        a = a ^ b;
        b = carry;
    }
    return a;
}`,
            },
        ],
        followUps: [
            'Why is a ^ b the sum without carries, and (a & b) << 1 the carries?',
            'What does the JS version return for getSum(-1, 1) if the loop guards on b > 0?',
            'Implement subtraction the same way.',
        ],
    },

    'single-number-ii': {
        restate:
            'Every element appears three times except one. Find it in O(n) time and O(1) space.',
        body: `Single Number's XOR trick **does not transfer**, and understanding why is the point: XOR cancels *pairs*, and three of a kind leaves one copy behind. You need something that resets every three occurrences, not every two.

**The approach worth giving — count bits by position.** For each of the 32 bit positions, count how many array elements have that bit set. Every triple contributes 3, so \`count % 3\` is 1 exactly at the positions where the lone number has a bit. Rebuild it from those positions.

That is \`O(32n)\` — linear — with \`O(1)\` space, and it is far easier to explain and get right under pressure than the alternative.

**It generalises for free:** change the modulus and it solves "every element appears k times except one" for any k. Say that; it is what makes the approach worth more than a trick.

**The trap: negative numbers.** If \`count % 3\` is 1 at bit 31, the reconstructed value must be negative. In C++ and Java, OR-ing \`1 << 31\` into a signed int handles this correctly by the two's-complement bit pattern — but building the number by *addition* instead of OR overflows. In JavaScript the result must be run through \`| 0\` to reinterpret as signed, or it comes back as a large positive.

**The other solution — two-bit state machine.** Track \`ones\` and \`twos\` such that a bit seen three times gets cleared from both. It is \`O(n)\` with two variables and is genuinely elegant:

\`\`\`
ones = (ones ^ n) & ~twos
twos = (twos ^ n) & ~ones
\`\`\`

Correct, and almost impossible to derive live. Know it exists; write the counting version.`,
        complexity: { time: 'O(32n) = O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int singleNumber(vector<int>& nums) {
        int result = 0;
        for (int bit = 0; bit < 32; bit++) {
            int count = 0;
            for (int n : nums) count += (n >> bit) & 1;
            // Triples contribute 3, so a remainder of 1 marks the lone number.
            if (count % 3) result |= (1 << bit);   // OR, not +: bit 31 must not overflow
        }
        return result;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int singleNumber(int[] nums) {
        int result = 0;
        for (int bit = 0; bit < 32; bit++) {
            int count = 0;
            for (int n : nums) count += (n >>> bit) & 1;
            if (count % 3 != 0) result |= (1 << bit);
        }
        return result;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function singleNumber(nums) {
    let result = 0;
    for (let bit = 0; bit < 32; bit++) {
        let count = 0;
        for (const n of nums) count += (n >>> bit) & 1;
        if (count % 3 !== 0) result |= (1 << bit);
    }
    return result | 0;   // reinterpret as signed so bit 31 gives a negative
}`,
            },
        ],
        followUps: [
            'Why does plain XOR fail when elements appear three times?',
            'Change the modulus for "appears k times except one".',
            'Explain the ones/twos state machine. Could you derive it live?',
        ],
    },
};
