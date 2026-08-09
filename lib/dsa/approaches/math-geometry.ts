// lib/dsa/approaches/math-geometry.ts
//
// "Our approach" pages for the Math & Matrix section — the last on the sheet.
//
// Same four beats as every other approach file (brute force → why it is too
// slow → the observation → the trap); see approaches/arrays-hashing.ts for the
// house style in full.
//
// THIS SECTION IS DIFFERENT, AND IT IS WORTH SAYING SO PLAINLY: there is
// usually no clever insight to find. The optimal approach is often the obvious
// one. What an interviewer is checking is whether you can stay CORRECT AT THE
// BOUNDARIES under time pressure — whether the loop bounds, the index
// arithmetic and the edge cases survive contact with a whiteboard.
//
// THE HABIT THAT MAKES THE DIFFERENCE: write the loop bounds down, on paper,
// BEFORE the loop body. Then trace a 3x3 and a 3x4 by hand. Nearly every bug
// in this section is an off-by-one, and off-by-ones are invisible when you
// reason about them abstractly and obvious the moment you draw them.
//
// TWO IDEAS DO RECUR, and they are genuinely transferable:
//
//   IN-PLACE VIA DECOMPOSITION — a hard in-place transformation is often two
//     easy ones. Rotate Image is transpose + reverse; nobody derives the
//     four-way cycle live, and nobody needs to.
//
//   THE FIRST ROW/COLUMN AS STORAGE — when O(1) space is demanded on a matrix,
//     the matrix itself is the only place left to put your bookkeeping. Set
//     Matrix Zeroes is that idea, and the whole difficulty is the one cell
//     where the row and column markers collide.

import type { DsaApproach } from '../types';

export const mathGeometryApproaches: Record<string, DsaApproach> = {
    'plus-one': {
        restate: 'A number is stored as a digit array. Add one and return the new array.',
        body: `Converting to an integer, adding, and converting back fails: the array can hold 100 digits, which overflows every fixed-width type. You must do long addition.

**The observation:** work from the **last** digit backwards, which is where a carry originates.

- Digit is less than 9 → increment it and **return immediately**. No carry, nothing left to do.
- Digit is 9 → it becomes 0 and the carry moves left.

The early return is what keeps this to a few lines: the moment a digit absorbs the increment, every digit to its left is unchanged.

**The only case that survives the loop is all nines.** \`[9,9,9]\` becomes \`[0,0,0]\` and still owes a carry. The new number is one digit longer and always looks the same: a leading 1 followed by zeros. So after the loop, prepend a 1.

**The trap:** handling that case with a general "insert at front and propagate" is unnecessary — after the loop the array is already all zeros, so a single \`1\` at the front is the complete answer. Recognising that is what makes the code short.

**The other trap:** returning inside the loop is easy to forget when adapting this from a general adder. Without it, a carry keeps propagating through digits that never needed to change.

No overflow is possible anywhere, because you never form a number larger than a single digit.`,
        complexity: { time: 'O(n)', space: 'O(1) — O(n) only in the all-nines case' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    vector<int> plusOne(vector<int>& digits) {
        for (int i = digits.size() - 1; i >= 0; i--) {
            if (digits[i] < 9) {
                digits[i]++;
                return digits;         // no carry: everything left is unchanged
            }
            digits[i] = 0;             // 9 -> 0, carry continues
        }
        // Fell through: the input was all nines and is now all zeros.
        digits.insert(digits.begin(), 1);
        return digits;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int[] plusOne(int[] digits) {
        for (int i = digits.length - 1; i >= 0; i--) {
            if (digits[i] < 9) {
                digits[i]++;
                return digits;
            }
            digits[i] = 0;
        }
        int[] out = new int[digits.length + 1];
        out[0] = 1;                    // the rest are already 0
        return out;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function plusOne(digits) {
    for (let i = digits.length - 1; i >= 0; i--) {
        if (digits[i] < 9) {
            digits[i]++;
            return digits;
        }
        digits[i] = 0;
    }
    return [1, ...digits];   // all nines: [9,9] -> [1,0,0]
}`,
            },
        ],
        followUps: [
            'Why is the all-nines case always a 1 followed by zeros?',
            'Add two digit arrays together.',
            'Why can this not be done by converting to an integer?',
        ],
    },

    'happy-number': {
        restate:
            'Repeatedly replace a number with the sum of the squares of its digits. Does it reach 1?',
        body: `The process either reaches 1 or **cycles forever** — those are the only two outcomes, because the sum of squared digits of any number below 1000 is itself below 1000, so the sequence is trapped in a finite range and must eventually repeat.

That observation is what makes the problem tractable: you are detecting a cycle, and this is a **linked-list problem in disguise**.

**Two solutions:**

**Hash set** — record every value seen; if one repeats before you reach 1, it is not happy. \`O(log n)\` space, trivial to write, and the right first answer.

**Floyd's tortoise and hare** — treat "next number" as the pointer. Slow advances once, fast twice; they meet inside the cycle. \`O(1)\` space, and it is the same algorithm as Linked List Cycle with \`next = sumOfSquares(x)\` instead of \`node.next\`.

Giving the set version and then noticing the cycle-detection framing is a strong answer, because it shows you recognised the structure rather than recalling a trick.

**The trap in the Floyd version:** use a do-while, or prime the loop. Both pointers start at the same value, so a plain \`while (slow != fast)\` exits immediately having done nothing — exactly the same pitfall as Find the Duplicate Number in the Linked List section.

**The digit helper:** \`while (n) { d = n % 10; sum += d * d; n /= 10; }\`. No string conversion needed, and integer division is doing the work.

**Termination:** stop when \`fast == 1\`, not when they merely meet — 1 is a fixed point (\`1 → 1\`) so the pointers do converge there, but checking for 1 explicitly is clearer.`,
        complexity: { time: 'O(log n)', space: 'O(1) with Floyd' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    int next(int n) {
        int sum = 0;
        while (n) { int d = n % 10; sum += d * d; n /= 10; }
        return sum;
    }
public:
    bool isHappy(int n) {
        int slow = n, fast = n;
        do {                              // do-while: both start equal
            slow = next(slow);
            fast = next(next(fast));
        } while (slow != fast && fast != 1);
        return fast == 1;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private int next(int n) {
        int sum = 0;
        while (n != 0) { int d = n % 10; sum += d * d; n /= 10; }
        return sum;
    }

    public boolean isHappy(int n) {
        int slow = n, fast = n;
        do {
            slow = next(slow);
            fast = next(next(fast));
        } while (slow != fast && fast != 1);
        return fast == 1;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function isHappy(n) {
    const next = (x) => {
        let sum = 0;
        while (x > 0) {
            const d = x % 10;
            sum += d * d;
            x = Math.floor(x / 10);
        }
        return sum;
    };

    let slow = n, fast = n;
    do {
        slow = next(slow);
        fast = next(next(fast));
    } while (slow !== fast && fast !== 1);
    return fast === 1;
}`,
            },
        ],
        followUps: [
            'Why must the sequence either reach 1 or cycle?',
            'What does a plain while loop do when both pointers start equal?',
            'Which linked-list problem is this identical to?',
        ],
    },

    'rotate-image': {
        restate: 'Rotate an n×n matrix 90° clockwise, in place.',
        body: `Copying into a new matrix is easy and violates the in-place requirement. The four-way cyclic swap — moving four cells at a time around the ring — is the direct in-place solution and is genuinely hard to get right on a whiteboard.

**The observation that makes it easy: decompose the rotation into two simple operations.**

\`\`\`
transpose (mirror across the main diagonal)
then reverse each row
= 90 degrees clockwise
\`\`\`

Both halves are trivial to write and trivial to verify. Nobody derives the four-way index cycle live, and with this decomposition nobody needs to.

**Convince yourself on a 2×2** rather than trusting it: \`[[1,2],[3,4]]\` transposes to \`[[1,3],[2,4]]\`, and reversing each row gives \`[[3,1],[4,2]]\` — which is the clockwise rotation.

**The trap: transpose only the upper triangle.** The loop must be \`for i, for j = i+1\`, not \`j = 0\`. Iterating the full matrix swaps every pair *twice*, which returns it to exactly where it started — and the symptom is that your rotation does nothing at all, which is a confusing thing to debug.

**For counter-clockwise:** transpose, then reverse each **column** — or equivalently reverse the rows first and then transpose. Worth knowing which order gives which direction rather than guessing.

Both passes are \`O(n²)\` with \`O(1)\` extra space, which is optimal — every cell has to move.`,
        complexity: { time: 'O(n²)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    void rotate(vector<vector<int>>& matrix) {
        int n = matrix.size();

        // 1. Transpose — UPPER TRIANGLE ONLY (j starts at i+1).
        //    Full iteration swaps every pair twice and undoes itself.
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                swap(matrix[i][j], matrix[j][i]);
            }
        }
        // 2. Reverse each row.
        for (auto& row : matrix) reverse(row.begin(), row.end());
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public void rotate(int[][] matrix) {
        int n = matrix.length;

        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                int tmp = matrix[i][j];
                matrix[i][j] = matrix[j][i];
                matrix[j][i] = tmp;
            }
        }
        for (int[] row : matrix) {
            for (int l = 0, r = n - 1; l < r; l++, r--) {
                int tmp = row[l];
                row[l] = row[r];
                row[r] = tmp;
            }
        }
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function rotate(matrix) {
    const n = matrix.length;

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {          // upper triangle only
            [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
        }
    }
    for (const row of matrix) row.reverse();
}`,
            },
        ],
        followUps: [
            'Trace a 2x2 by hand. Why does transpose + reverse equal a rotation?',
            'What happens if the transpose loop starts j at 0?',
            'Rotate counter-clockwise. Which step changes?',
        ],
    },

    'spiral-matrix': {
        restate: 'Return every element of an m×n matrix in spiral order.',
        body: `Pure simulation — there is no insight to find, only bounds to keep straight. That is exactly why it is asked.

**The observation: track four boundaries** — \`top\`, \`bottom\`, \`left\`, \`right\` — and shrink them as each edge is consumed. Then walk the four directions in order:

1. left → right along \`top\`, then \`top++\`
2. top → bottom along \`right\`, then \`right--\`
3. right → left along \`bottom\`, then \`bottom--\`
4. bottom → top along \`left\`, then \`left++\`

Repeat while the boundaries have not crossed.

**The trap, and it is the whole problem: check the bounds again before the third and fourth passes.** After steps 1 and 2 the region may already be exhausted, and a matrix with a single remaining row or column would otherwise be traversed **twice** — once left-to-right by step 1, then again right-to-left by step 3.

So guard step 3 with \`if (top <= bottom)\` and step 4 with \`if (left <= right)\`. Steps 1 and 2 need no guard because the loop condition already covered them.

**This bug is invisible on square matrices** and appears on \`1×n\`, \`n×1\`, and any matrix that reduces to a single line — which is why tracing a 3×4 and a 1×5 by hand before submitting is worth more here than re-reading the code.

**Do not rely on the output length to terminate.** Counting to \`m*n\` works but hides the boundary logic; the four-boundary version makes the invariant explicit and generalises to spiral-fill (Leetcode 59).`,
        complexity: { time: 'O(m · n)', space: 'O(1) beyond the output' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    vector<int> spiralOrder(vector<vector<int>>& matrix) {
        vector<int> out;
        int top = 0, bottom = matrix.size() - 1;
        int left = 0, right = matrix[0].size() - 1;

        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) out.push_back(matrix[top][c]);
            top++;

            for (int r = top; r <= bottom; r++) out.push_back(matrix[r][right]);
            right--;

            // RE-CHECK: a single remaining row would be traversed twice.
            if (top <= bottom) {
                for (int c = right; c >= left; c--) out.push_back(matrix[bottom][c]);
                bottom--;
            }
            if (left <= right) {
                for (int r = bottom; r >= top; r--) out.push_back(matrix[r][left]);
                left++;
            }
        }
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public List<Integer> spiralOrder(int[][] matrix) {
        List<Integer> out = new ArrayList<>();
        int top = 0, bottom = matrix.length - 1;
        int left = 0, right = matrix[0].length - 1;

        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) out.add(matrix[top][c]);
            top++;

            for (int r = top; r <= bottom; r++) out.add(matrix[r][right]);
            right--;

            if (top <= bottom) {
                for (int c = right; c >= left; c--) out.add(matrix[bottom][c]);
                bottom--;
            }
            if (left <= right) {
                for (int r = bottom; r >= top; r--) out.add(matrix[r][left]);
                left++;
            }
        }
        return out;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function spiralOrder(matrix) {
    const out = [];
    let top = 0, bottom = matrix.length - 1;
    let left = 0, right = matrix[0].length - 1;

    while (top <= bottom && left <= right) {
        for (let c = left; c <= right; c++) out.push(matrix[top][c]);
        top++;

        for (let r = top; r <= bottom; r++) out.push(matrix[r][right]);
        right--;

        if (top <= bottom) {              // essential for a single leftover row
            for (let c = right; c >= left; c--) out.push(matrix[bottom][c]);
            bottom--;
        }
        if (left <= right) {              // and a single leftover column
            for (let r = bottom; r >= top; r--) out.push(matrix[r][left]);
            left++;
        }
    }
    return out;
}`,
            },
        ],
        followUps: [
            'Trace a 1x5 matrix without the re-checks. What goes wrong?',
            'Spiral Matrix II — FILL an n x n matrix in spiral order.',
            'Why do steps 1 and 2 not need their own guards?',
        ],
    },

    'set-matrix-zeroes': {
        restate:
            'If a cell is 0, set its entire row and column to 0. Do it in place with O(1) extra space.',
        body: `**The mistake that makes this a problem at all:** zeroing rows and columns as you find them. The zeros you write are indistinguishable from the original ones, so the next zero you meet triggers another wipe, and the whole matrix cascades to 0. You must **mark first, apply second**.

The easy fix is two sets of row and column indices — \`O(m + n)\` space, correct, and the right first answer.

**The observation for \`O(1)\`: use the first row and first column as the marker arrays.** If \`matrix[i][j] == 0\`, write a 0 into \`matrix[i][0]\` and \`matrix[0][j]\`. The bookkeeping now lives inside the matrix, which is the only storage left.

**The entire difficulty is one cell.** \`matrix[0][0]\` belongs to *both* the row-0 marker and the column-0 marker, so it cannot record both independently. Resolve it with **one extra boolean** — say \`firstColHasZero\` — and let \`matrix[0][0]\` speak only for row 0.

**The order of operations, and every step matters:**

1. Scan column 0 separately and record \`firstColHasZero\`.
2. Scan the rest, writing markers into row 0 and column 0.
3. Apply markers to the **interior** — from \`(1,1)\` outward.
4. Handle row 0 using \`matrix[0][0]\`.
5. Handle column 0 using the saved boolean.

**Steps 3 to 5 must be in that order.** Applying to the first row or column before the interior destroys the markers the interior still needs to read — and the symptom is a partially-zeroed matrix, which looks like a subtle logic bug rather than an ordering one.

Say the \`O(m+n)\` version first, then offer this. The trade is real: constant space for markedly more fragile code.`,
        complexity: { time: 'O(m · n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    void setZeroes(vector<vector<int>>& matrix) {
        int m = matrix.size(), n = matrix[0].size();
        bool firstColHasZero = false;     // matrix[0][0] can only mark ONE thing

        for (int i = 0; i < m; i++) {
            if (matrix[i][0] == 0) firstColHasZero = true;
            for (int j = 1; j < n; j++) {
                if (matrix[i][j] == 0) {
                    matrix[i][0] = 0;      // row marker
                    matrix[0][j] = 0;      // column marker
                }
            }
        }

        // INTERIOR FIRST — the markers must survive until it is done.
        for (int i = 1; i < m; i++)
            for (int j = 1; j < n; j++)
                if (matrix[i][0] == 0 || matrix[0][j] == 0) matrix[i][j] = 0;

        if (matrix[0][0] == 0) for (int j = 0; j < n; j++) matrix[0][j] = 0;
        if (firstColHasZero)   for (int i = 0; i < m; i++) matrix[i][0] = 0;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public void setZeroes(int[][] matrix) {
        int m = matrix.length, n = matrix[0].length;
        boolean firstColHasZero = false;

        for (int i = 0; i < m; i++) {
            if (matrix[i][0] == 0) firstColHasZero = true;
            for (int j = 1; j < n; j++) {
                if (matrix[i][j] == 0) {
                    matrix[i][0] = 0;
                    matrix[0][j] = 0;
                }
            }
        }

        for (int i = 1; i < m; i++)
            for (int j = 1; j < n; j++)
                if (matrix[i][0] == 0 || matrix[0][j] == 0) matrix[i][j] = 0;

        if (matrix[0][0] == 0) for (int j = 0; j < n; j++) matrix[0][j] = 0;
        if (firstColHasZero)   for (int i = 0; i < m; i++) matrix[i][0] = 0;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function setZeroes(matrix) {
    const m = matrix.length, n = matrix[0].length;
    let firstColHasZero = false;

    for (let i = 0; i < m; i++) {
        if (matrix[i][0] === 0) firstColHasZero = true;
        for (let j = 1; j < n; j++) {
            if (matrix[i][j] === 0) {
                matrix[i][0] = 0;
                matrix[0][j] = 0;
            }
        }
    }

    for (let i = 1; i < m; i++)             // interior BEFORE the edges
        for (let j = 1; j < n; j++)
            if (matrix[i][0] === 0 || matrix[0][j] === 0) matrix[i][j] = 0;

    if (matrix[0][0] === 0) for (let j = 0; j < n; j++) matrix[0][j] = 0;
    if (firstColHasZero)    for (let i = 0; i < m; i++) matrix[i][0] = 0;
}`,
            },
        ],
        followUps: [
            'Why does zeroing as you scan cascade? Give a 2x2 example.',
            'Why does matrix[0][0] need a companion boolean?',
            'What breaks if you apply the first row before the interior?',
        ],
    },

    'powx-n': {
        restate: 'Compute x raised to the power n, where n may be negative.',
        body: `Multiplying \`x\` by itself \`n\` times is \`O(n)\`, and with \`n\` up to \`2³¹−1\` that is far too slow.

**The observation — binary exponentiation.** Squaring doubles the exponent, so you can reach \`n\` in \`log n\` steps rather than \`n\`:

\`\`\`
x^n = (x^(n/2))^2           if n is even
x^n = x * (x^(n-1))         if n is odd
\`\`\`

Equivalently, iteratively: square \`x\` each round, and multiply it into the result whenever the current lowest bit of \`n\` is 1. That is the same algorithm read through the binary representation of the exponent, and it is why this problem carries a bit-manipulation flavour.

**Negative exponents:** \`x^(-n) == 1 / x^n\`. Handle it by inverting \`x\` and negating \`n\` up front.

**The trap, and it is a real one: \`n = INT_MIN\` cannot be negated.** \`-(-2³¹)\` overflows a 32-bit int and stays negative, so the loop never terminates. **Convert \`n\` to a 64-bit type before negating** — one cast, and it is the difference between passing and an infinite loop on a single hidden test. JavaScript is immune (numbers are doubles), which is worth noting rather than assuming it transfers.

**Two edge cases** that fall out for free with the right base case: \`n = 0\` returns 1 for any \`x\`, and \`x = 0\` with positive \`n\` returns 0. Start \`result = 1\` and both work without special handling.

**Precision:** repeated squaring accumulates floating-point error, which is why the problem accepts answers within a tolerance rather than exactly.`,
        complexity: { time: 'O(log n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    double myPow(double x, int n) {
        long long e = n;              // 64-bit BEFORE negating: INT_MIN overflows
        if (e < 0) { x = 1 / x; e = -e; }

        double result = 1.0;
        while (e > 0) {
            if (e & 1) result *= x;   // this bit of the exponent is set
            x *= x;                    // square: doubles the exponent
            e >>= 1;
        }
        return result;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public double myPow(double x, int n) {
        long e = n;                   // widen before negating
        if (e < 0) { x = 1 / x; e = -e; }

        double result = 1.0;
        while (e > 0) {
            if ((e & 1) == 1) result *= x;
            x *= x;
            e >>= 1;
        }
        return result;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function myPow(x, n) {
    // JS numbers are doubles, so negating INT_MIN is not a problem here.
    let e = n;
    if (e < 0) { x = 1 / x; e = -e; }

    let result = 1;
    while (e > 0) {
        if (e % 2 === 1) result *= x;
        x *= x;
        e = Math.floor(e / 2);
    }
    return result;
}`,
            },
        ],
        followUps: [
            'What happens with n = INT_MIN if you negate before widening?',
            'Write the recursive version. What is its space complexity?',
            'Compute (x^n) mod m for large n — modular exponentiation.',
        ],
    },

    'multiply-strings': {
        restate:
            'Multiply two non-negative integers given as strings, without converting them to integers.',
        body: `The numbers can be 200 digits long, so no built-in type holds them. This is long multiplication, done by hand.

**The observation that makes the indexing tractable:** the product of \`num1[i]\` and \`num2[j]\` lands at positions \`i + j\` and \`i + j + 1\` of the result — the carry position and the digit position respectively.

That single fact removes all the guesswork. Allocate a result array of length \`m + n\` (the maximum possible size), multiply every pair of digits, and add each product into those two slots, propagating the carry immediately:

\`\`\`
sum = digit1 * digit2 + result[i+j+1]
result[i+j+1] = sum % 10
result[i+j]  += sum / 10
\`\`\`

**Iterate both indices from the right**, because that is the direction carries flow.

**Three traps, and the first two are what most wrong submissions hit:**

**\`m + n\` is the right size.** The product of an \`m\`-digit and an \`n\`-digit number has at most \`m + n\` digits — never more. Sizing at \`max(m, n) + 1\` truncates on large inputs.

**Strip leading zeros at the end**, but not all of them: \`"0"\` must come back as \`"0"\`, not as an empty string. Skip zeros while there is more than one character left.

**Return early if either input is \`"0"\`** — otherwise the result array is all zeros and the stripping logic has to be exactly right to produce \`"0"\`. The guard is one line and removes the risk.

**No overflow anywhere:** the largest intermediate is \`9*9 + 9 = 90\`, which fits everywhere.`,
        complexity: { time: 'O(m · n)', space: 'O(m + n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    string multiply(string num1, string num2) {
        if (num1 == "0" || num2 == "0") return "0";   // avoids the strip edge case

        int m = num1.size(), n = num2.size();
        vector<int> result(m + n, 0);                  // m+n is the exact maximum

        for (int i = m - 1; i >= 0; i--) {
            for (int j = n - 1; j >= 0; j--) {
                int product = (num1[i] - '0') * (num2[j] - '0');
                // i+j+1 is the digit slot, i+j is its carry slot.
                int sum = product + result[i + j + 1];
                result[i + j + 1] = sum % 10;
                result[i + j] += sum / 10;
            }
        }

        string out;
        for (int d : result) {
            if (out.empty() && d == 0) continue;       // skip leading zeros
            out += char('0' + d);
        }
        return out.empty() ? "0" : out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public String multiply(String num1, String num2) {
        if (num1.equals("0") || num2.equals("0")) return "0";

        int m = num1.length(), n = num2.length();
        int[] result = new int[m + n];

        for (int i = m - 1; i >= 0; i--) {
            for (int j = n - 1; j >= 0; j--) {
                int product = (num1.charAt(i) - '0') * (num2.charAt(j) - '0');
                int sum = product + result[i + j + 1];
                result[i + j + 1] = sum % 10;
                result[i + j] += sum / 10;
            }
        }

        StringBuilder out = new StringBuilder();
        for (int d : result) {
            if (out.length() == 0 && d == 0) continue;
            out.append(d);
        }
        return out.length() == 0 ? "0" : out.toString();
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function multiply(num1, num2) {
    if (num1 === '0' || num2 === '0') return '0';

    const m = num1.length, n = num2.length;
    const result = new Array(m + n).fill(0);

    for (let i = m - 1; i >= 0; i--) {
        for (let j = n - 1; j >= 0; j--) {
            const product = (num1[i] - '0') * (num2[j] - '0');
            const sum = product + result[i + j + 1];
            result[i + j + 1] = sum % 10;
            result[i + j] += Math.floor(sum / 10);
        }
    }

    return result.join('').replace(/^0+/, '') || '0';
}`,
            },
        ],
        followUps: [
            'Why exactly m + n slots, never more?',
            'Derive the i+j and i+j+1 positions on a 2-digit example.',
            'Add two number strings (Leetcode 415). Simpler or harder?',
        ],
    },

    'detect-squares': {
        restate:
            'Add points to a data structure and count axis-aligned squares having a query point as one corner.',
        body: `The last problem on the sheet, and a design question rather than a puzzle.

**The observation that collapses the search: fix the DIAGONAL corner.** Given the query point \`(x, y)\`, iterate over the stored points and consider only those forming a valid diagonal with it — meaning \`|px - x| == |py - y|\` and neither difference is zero. That constraint alone determines the square: the other two corners must be \`(x, py)\` and \`(px, y)\`.

So for each diagonal candidate, multiply the three counts:

\`\`\`
count[diagonal] * count[(x, py)] * count[(px, y)]
\`\`\`

Multiplying is what handles duplicate points correctly — the same square can be formed several ways when points repeat, and the problem wants each counted.

**Two constraints do the filtering, and both matter:**

**Equal absolute differences** — otherwise it is a rectangle, not a square.

**Non-zero difference** — a "square" of side 0 is a degenerate point, not a square. Forgetting this is the most common bug and it silently inflates every count.

**The structure:** a hash map from point to its count, keyed by an encoding of the coordinates. Since coordinates are bounded by 1000, \`x * 1001 + y\` is a clean collision-free integer key — cleaner and faster than a string. In JavaScript a nested \`Map\` or a template-literal key is idiomatic; the arithmetic key is still the better habit.

**Complexity:** \`add\` is \`O(1)\`, \`count\` is \`O(number of distinct points)\` because you scan them all. That is expected — no better bound exists without indexing by coordinate.

**The optimisation worth naming:** keep a second map from \`x\` to the points sharing it, so \`count\` only scans candidates in the same column rather than everything.`,
        complexity: { time: 'O(1) add, O(n) count', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class DetectSquares {
    unordered_map<int, int> counts;   // encoded point -> multiplicity
    vector<pair<int, int>> pts;

    static int key(int x, int y) { return x * 1001 + y; }   // coords <= 1000
public:
    void add(vector<int> point) {
        counts[key(point[0], point[1])]++;
        pts.push_back({point[0], point[1]});
    }

    int count(vector<int> point) {
        int x = point[0], y = point[1];
        long long total = 0;

        for (auto& [px, py] : pts) {
            // Must be a true DIAGONAL: equal offsets, and non-zero.
            if (abs(px - x) != abs(py - y) || px == x || py == y) continue;
            total += (long long)counts[key(x, py)] * counts[key(px, y)];
        }
        return (int)total;
    }
};`,
            },
            {
                lang: 'java',
                source: `class DetectSquares {
    private final Map<Integer, Integer> counts = new HashMap<>();
    private final List<int[]> pts = new ArrayList<>();

    private int key(int x, int y) { return x * 1001 + y; }

    public void add(int[] point) {
        counts.merge(key(point[0], point[1]), 1, Integer::sum);
        pts.add(point);
    }

    public int count(int[] point) {
        int x = point[0], y = point[1];
        long total = 0;

        for (int[] p : pts) {
            int px = p[0], py = p[1];
            if (Math.abs(px - x) != Math.abs(py - y) || px == x || py == y) continue;
            total += (long) counts.getOrDefault(key(x, py), 0)
                          * counts.getOrDefault(key(px, y), 0);
        }
        return (int) total;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `class DetectSquares {
    constructor() {
        this.counts = new Map();   // encoded point -> multiplicity
        this.pts = [];
    }

    #key(x, y) { return x * 1001 + y; }

    add(point) {
        const k = this.#key(point[0], point[1]);
        this.counts.set(k, (this.counts.get(k) || 0) + 1);
        this.pts.push(point);
    }

    count(point) {
        const [x, y] = point;
        let total = 0;

        for (const [px, py] of this.pts) {
            // Equal offsets AND non-zero, or it is a rectangle / a point.
            if (Math.abs(px - x) !== Math.abs(py - y) || px === x || py === y) continue;
            total += (this.counts.get(this.#key(x, py)) || 0)
                   * (this.counts.get(this.#key(px, y)) || 0);
        }
        return total;
    }
}`,
            },
        ],
        followUps: [
            'Why multiply the three counts rather than add them?',
            'What does omitting the non-zero check do to the answer?',
            'Speed up count() by indexing points by their x coordinate.',
        ],
    },
};
