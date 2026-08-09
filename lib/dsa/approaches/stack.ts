// lib/dsa/approaches/stack.ts
//
// "Our approach" pages for the Stack section.
//
// Same four beats as every other approach file (brute force → why it is too
// slow → the observation → the trap); see approaches/arrays-hashing.ts for the
// house style in full.
//
// THE SPLIT THIS SECTION TEACHES, stated once here rather than on each page:
//
//   • A PLAIN stack is for nesting. The most recent unresolved thing is the
//     next thing to resolve — brackets, operands, recursion. Valid Parentheses,
//     RPN and Min Stack are all this.
//   • A MONOTONIC stack is for "next greater / next smaller". You keep it
//     sorted as you push, and popping is not cleanup — the POP IS THE ANSWER.
//     The element being popped has just met the thing it was waiting for.
//
// Recognising which one a problem wants is the entire skill, and the tell is
// simple: if the question is about matching or evaluating, it is a plain stack;
// if it is about "the first element to the right that is bigger/smaller", it is
// monotonic. Daily Temperatures, Next Greater Element, Car Fleet and Largest
// Rectangle are the second kind, ordered so each makes the next readable.

import type { DsaApproach } from '../types';

export const stackApproaches: Record<string, DsaApproach> = {
    'valid-parentheses': {
        restate:
            'Are the brackets balanced — every opener closed by the right type, in the right order?',
        body: `Repeatedly deleting \`()\`, \`[]\` and \`{}\` until nothing changes works, and is \`O(n²)\`.

**The observation:** when you meet a closing bracket, only one opener can possibly match it — **the most recent unclosed one**. Not any earlier one, because brackets nest rather than overlap. "Most recent unresolved thing" is the definition of a stack.

Push every opener. On a closer, pop and check the pair matches. If the stack is empty when you pop, or the pair is wrong, it is invalid. At the end the stack must be **empty** — anything left is an opener that was never closed.

Keep the pairs in a map from closer to opener, so the check is one lookup rather than a chain of \`||\`.

**Two traps, and both produce a wrong answer rather than a crash only if you are lucky:**

Check for an empty stack *before* popping. \`")"\` pops from nothing — in C++ that is undefined behaviour, not an exception.

Do not forget the final emptiness check. Without it \`"(("\` returns true: the loop never sees a mismatch because it never sees a closer at all.`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    bool isValid(string s) {
        unordered_map<char, char> pairs{{')', '('}, {']', '['}, {'}', '{'}};
        vector<char> st;

        for (char c : s) {
            if (!pairs.count(c)) {          // an opener
                st.push_back(c);
            } else {
                // Check empty BEFORE popping — ")" would pop from nothing.
                if (st.empty() || st.back() != pairs[c]) return false;
                st.pop_back();
            }
        }
        return st.empty();                  // "((" must not pass
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public boolean isValid(String s) {
        Map<Character, Character> pairs = Map.of(')', '(', ']', '[', '}', '{');
        Deque<Character> st = new ArrayDeque<>();

        for (char c : s.toCharArray()) {
            if (!pairs.containsKey(c)) {
                st.push(c);
            } else {
                if (st.isEmpty() || st.pop() != pairs.get(c)) return false;
            }
        }
        return st.isEmpty();
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function isValid(s) {
    const pairs = { ')': '(', ']': '[', '}': '{' };
    const st = [];

    for (const c of s) {
        if (!(c in pairs)) {
            st.push(c);
        } else {
            if (st.length === 0 || st.pop() !== pairs[c]) return false;
        }
    }
    return st.length === 0;
}`,
            },
        ],
        followUps: [
            'Return the minimum number of insertions needed to balance the string (Leetcode 921).',
            'What if there were only one bracket type? Could you drop the stack entirely?',
            'Handle a wildcard "*" that can be either bracket or empty — that is Valid Parenthesis String, in the Greedy section.',
        ],
    },

    'min-stack': {
        restate:
            'A stack where push, pop, top AND retrieving the minimum are all O(1).',
        body: `Scanning for the minimum is \`O(n)\` per call. Caching a single \`min\` value breaks immediately: pop the minimum and you have no idea what the new one is.

**The observation:** the minimum is not one value, it is a *history*. When you pop, the minimum must revert to whatever it was before that element was pushed — which is exactly the "undo to the previous state" behaviour a stack already gives you. So store the minimum the same way you store the values: a second stack, pushed and popped in lockstep with the first.

On push, record \`min(newValue, currentMin)\`. On pop, discard both. \`getMin()\` reads the top of the min stack. Because they move together, the min stack's top always describes exactly the elements currently in the main stack.

The redundancy is the point — yes, you store the same number many times for a descending sequence. That is the price of \`O(1)\` pops.

**The trap:** on the first push the min stack is empty, so \`min(val, top)\` has nothing to read. Guard it, or seed with \`INT_MAX\`.

**The optimisation worth mentioning:** push onto the min stack only when \`val <= currentMin\`, and pop it only when the value leaving equals its top. Use \`<=\`, not \`<\` — with \`<\`, pushing the minimum twice records it once, and the first pop removes it while an equal value is still in the stack.`,
        complexity: { time: 'O(1) for every operation', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class MinStack {
    vector<int> st, mins;   // mins[i] = minimum of st[0..i]
public:
    void push(int val) {
        st.push_back(val);
        mins.push_back(mins.empty() ? val : min(val, mins.back()));
    }
    void pop() {
        st.pop_back();
        mins.pop_back();    // lockstep — that is what makes pop O(1)
    }
    int top() { return st.back(); }
    int getMin() { return mins.back(); }
};`,
            },
            {
                lang: 'java',
                source: `class MinStack {
    private final Deque<Integer> st = new ArrayDeque<>();
    private final Deque<Integer> mins = new ArrayDeque<>();

    public void push(int val) {
        st.push(val);
        mins.push(mins.isEmpty() ? val : Math.min(val, mins.peek()));
    }
    public void pop() {
        st.pop();
        mins.pop();
    }
    public int top() { return st.peek(); }
    public int getMin() { return mins.peek(); }
}`,
            },
            {
                lang: 'javascript',
                source: `class MinStack {
    constructor() {
        this.st = [];
        this.mins = [];
    }
    push(val) {
        this.st.push(val);
        const m = this.mins.length ? Math.min(val, this.mins[this.mins.length - 1]) : val;
        this.mins.push(m);
    }
    pop() {
        this.st.pop();
        this.mins.pop();
    }
    top() { return this.st[this.st.length - 1]; }
    getMin() { return this.mins[this.mins.length - 1]; }
}`,
            },
        ],
        followUps: [
            'Store only the improvements. Why must the comparison be <= and not <?',
            'Do it with ONE stack, by storing an encoded value when the minimum changes.',
            'Design a queue with O(1) minimum. Why is that much harder?',
        ],
    },

    'evaluate-reverse-polish-notation': {
        restate:
            'Evaluate postfix notation — operators come after their two operands, so there are no brackets and no precedence.',
        body: `The reason RPN exists is that it removes ambiguity entirely: there is exactly one way to read it, so no precedence rules and no parentheses.

**The observation:** an operator always applies to the two most recently produced values. "Most recent, and consume it" is a stack.

Walk the tokens. A number gets pushed. An operator pops **two** values, combines them, and pushes the single result back — that push is what lets results feed into later operators, which is how nesting works without any nesting syntax. At the end exactly one value remains: the answer.

**The trap that catches nearly everyone: operand order.** The first value you pop is the *right*-hand operand. So it is \`a - b\` and \`a / b\` where \`b\` popped first and \`a\` second. Addition and multiplication hide the bug because they commute; subtraction and division do not, and the test that exposes it is often not the first one.

Two smaller ones. Detecting numbers with "is it one of \`+-*/\`?" is safer than "does it start with a digit" — \`-3\` is a valid negative operand, and a length check alone misreads it as an operator. And division must **truncate toward zero**, which is what C++ and Java already do for ints, but JavaScript's \`/\` yields a float and \`Math.floor\` rounds \`-3.5\` to \`-4\` instead of \`-3\`; use \`Math.trunc\`.`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int evalRPN(vector<string>& tokens) {
        vector<int> st;
        for (const string& t : tokens) {
            if (t == "+" || t == "-" || t == "*" || t == "/") {
                int b = st.back(); st.pop_back();   // RIGHT operand pops first
                int a = st.back(); st.pop_back();
                if (t == "+") st.push_back(a + b);
                else if (t == "-") st.push_back(a - b);
                else if (t == "*") st.push_back(a * b);
                else st.push_back(a / b);           // C++ truncates toward zero
            } else {
                st.push_back(stoi(t));              // handles "-3" correctly
            }
        }
        return st.back();
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int evalRPN(String[] tokens) {
        Deque<Integer> st = new ArrayDeque<>();
        for (String t : tokens) {
            switch (t) {
                case "+": case "-": case "*": case "/": {
                    int b = st.pop();               // right operand
                    int a = st.pop();
                    st.push(switch (t) {
                        case "+" -> a + b;
                        case "-" -> a - b;
                        case "*" -> a * b;
                        default  -> a / b;          // truncates toward zero
                    });
                    break;
                }
                default:
                    st.push(Integer.parseInt(t));
            }
        }
        return st.pop();
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function evalRPN(tokens) {
    const st = [];
    const ops = new Set(['+', '-', '*', '/']);

    for (const t of tokens) {
        if (ops.has(t)) {
            const b = st.pop();   // right operand pops first
            const a = st.pop();
            if (t === '+') st.push(a + b);
            else if (t === '-') st.push(a - b);
            else if (t === '*') st.push(a * b);
            // trunc, NOT floor: -3.5 must become -3, not -4.
            else st.push(Math.trunc(a / b));
        } else {
            st.push(Number(t));
        }
    }
    return st.pop();
}`,
            },
        ],
        followUps: [
            'Which test case exposes a swapped operand order? Construct one.',
            'Evaluate INFIX notation with precedence (Basic Calculator II, Leetcode 227).',
            'Convert infix to postfix — the shunting-yard algorithm.',
        ],
    },

    'generate-parentheses': {
        restate: 'Produce every well-formed string of n pairs of parentheses.',
        body: `Generating all \`2^(2n)\` strings and filtering the valid ones is correct and enormously wasteful — for \`n = 8\` that is 65,536 candidates for 1,430 answers.

**The observation:** you can enforce validity *while building*, so no invalid string is ever produced. Two rules cover it completely:

- You may add \`(\` while \`open < n\`.
- You may add \`)\` while \`close < open\`.

The second is the whole problem. A string is well-formed exactly when no prefix ever has more closers than openers — and that is precisely what \`close < open\` maintains at every step. There is no separate validity check anywhere in the solution; the constraint *is* the check.

When \`open == close == n\` the string is complete. Record it and return.

It sits in the Stack section rather than Backtracking because the invariant it maintains — closers can never outnumber openers — is exactly the invariant Valid Parentheses verifies with a stack. One problem checks it, the other constructs to it. The counter \`open - close\` is the stack's height.

**The trap:** undo your choice after recursing. Append, recurse, then remove the last character. Forget the removal and the shared buffer accumulates every branch's characters.

The count of results is the nth Catalan number, so complexity is \`O(4ⁿ / √n)\` — worth saying you know it is exponential in the *output size*, which no algorithm can avoid.`,
        complexity: { time: 'O(4ⁿ / √n) — the number of results', space: 'O(n) recursion depth' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    vector<string> generateParenthesis(int n) {
        vector<string> out;
        string cur;
        build(0, 0, n, cur, out);
        return out;
    }
private:
    void build(int open, int close, int n, string& cur, vector<string>& out) {
        if (cur.size() == 2 * n) { out.push_back(cur); return; }

        if (open < n) {
            cur.push_back('(');
            build(open + 1, close, n, cur, out);
            cur.pop_back();                 // un-choose
        }
        if (close < open) {                 // the entire validity rule
            cur.push_back(')');
            build(open, close + 1, n, cur, out);
            cur.pop_back();
        }
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public List<String> generateParenthesis(int n) {
        List<String> out = new ArrayList<>();
        build(0, 0, n, new StringBuilder(), out);
        return out;
    }

    private void build(int open, int close, int n, StringBuilder cur, List<String> out) {
        if (cur.length() == 2 * n) { out.add(cur.toString()); return; }

        if (open < n) {
            cur.append('(');
            build(open + 1, close, n, cur, out);
            cur.deleteCharAt(cur.length() - 1);
        }
        if (close < open) {
            cur.append(')');
            build(open, close + 1, n, cur, out);
            cur.deleteCharAt(cur.length() - 1);
        }
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function generateParenthesis(n) {
    const out = [];
    const cur = [];

    function build(open, close) {
        if (cur.length === 2 * n) { out.push(cur.join('')); return; }

        if (open < n) {
            cur.push('(');
            build(open + 1, close);
            cur.pop();
        }
        if (close < open) {
            cur.push(')');
            build(open, close + 1);
            cur.pop();
        }
    }

    build(0, 0);
    return out;
}`,
            },
        ],
        followUps: [
            'Why is the rule close < open rather than close < n?',
            'Count the results without generating them — the nth Catalan number.',
            'Generate with two bracket types. Why is the counter no longer enough?',
        ],
    },

    'next-greater-element-i': {
        restate:
            'For each value in nums1, find the first larger value to its right in nums2. nums1 is a subset of nums2.',
        body: `The two-array wrapper makes this look harder than it is. Strip it: solve "next greater element" for **all** of \`nums2\` once, store the answers in a map, then read off the ones \`nums1\` asks for. Values are unique, so a value is a safe key.

**The core, and the first monotonic stack on the sheet:** walk \`nums2\` left to right keeping a stack of values that are *still waiting* for something bigger. Naturally that stack is decreasing — a value smaller than the one below it would have already resolved it.

When a new value arrives, it is the next greater element for **every** stacked value smaller than it. So pop them and record the answer for each. Then push the new value, which now waits its turn.

**The mental shift this section is built around:** the pop is not cleanup. *The pop is the answer.* Each element is popped exactly once, at the moment its answer is found — which is why the whole thing is \`O(n)\` despite the inner loop.

Anything still on the stack at the end never found a bigger value, so it gets \`-1\`. Initialising the result to \`-1\` handles that without a drain loop.

Get comfortable here. Daily Temperatures is this with indices instead of values, and Largest Rectangle is this in both directions at once.`,
        complexity: { time: 'O(n + m)', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    vector<int> nextGreaterElement(vector<int>& nums1, vector<int>& nums2) {
        unordered_map<int, int> nextGreater;   // value -> its answer
        vector<int> st;                        // values still waiting, decreasing

        for (int n : nums2) {
            // n resolves everything smaller that is still waiting.
            while (!st.empty() && st.back() < n) {
                nextGreater[st.back()] = n;
                st.pop_back();
            }
            st.push_back(n);
        }

        vector<int> out;
        for (int n : nums1) {
            auto it = nextGreater.find(n);
            out.push_back(it == nextGreater.end() ? -1 : it->second);
        }
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int[] nextGreaterElement(int[] nums1, int[] nums2) {
        Map<Integer, Integer> nextGreater = new HashMap<>();
        Deque<Integer> st = new ArrayDeque<>();

        for (int n : nums2) {
            while (!st.isEmpty() && st.peek() < n) {
                nextGreater.put(st.pop(), n);
            }
            st.push(n);
        }

        int[] out = new int[nums1.length];
        for (int i = 0; i < nums1.length; i++) {
            out[i] = nextGreater.getOrDefault(nums1[i], -1);
        }
        return out;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function nextGreaterElement(nums1, nums2) {
    const nextGreater = new Map();
    const st = [];

    for (const n of nums2) {
        while (st.length && st[st.length - 1] < n) {
            nextGreater.set(st.pop(), n);   // the pop IS the answer
        }
        st.push(n);
    }

    return nums1.map((n) => nextGreater.get(n) ?? -1);
}`,
            },
        ],
        followUps: [
            'Next Greater Element II — the array is circular (Leetcode 503). Hint: two passes.',
            'Why does storing values rather than indices work here but not in Daily Temperatures?',
            'What breaks if nums2 contains duplicates?',
        ],
    },

    'daily-temperatures': {
        restate:
            'For each day, how many days until a warmer one? Zero if it never gets warmer.',
        body: `Scanning forward from every day is \`O(n²)\`, and with \`n = 10⁵\` that is too slow.

This is Next Greater Element with one change: the answer is a **distance**, not a value. So the stack holds **indices** rather than temperatures — you cannot subtract positions you did not keep.

Walk left to right with a stack of indices whose temperatures are decreasing. When today is warmer than the temperature at the top index, that day's wait is over: its answer is \`i - poppedIndex\`. Pop and record, repeatedly, because one warm day can resolve many colder ones behind it. Then push today.

Days still on the stack at the end never warmed up, and stay 0 — which is why the result array is initialised to zero and needs no cleanup pass.

**The trap:** \`i - poppedIndex\`, not \`i - i_previous\` and not \`stack.size()\`. The wait is measured from the day being *resolved*, and several days can be resolved by the same \`i\` with different answers.

**The complexity argument, since it is the one thing an interviewer will push on:** the inner while loop does not make this quadratic. Every index is pushed exactly once and popped at most once, so the total pop work across the whole run is \`O(n)\`. Amortised, not per-iteration — say it that way.`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    vector<int> dailyTemperatures(vector<int>& temperatures) {
        int n = temperatures.size();
        vector<int> out(n, 0);      // never-warmer days stay 0
        vector<int> st;             // INDICES, temps decreasing

        for (int i = 0; i < n; i++) {
            while (!st.empty() && temperatures[st.back()] < temperatures[i]) {
                int j = st.back(); st.pop_back();
                out[j] = i - j;     // distance from the day being resolved
            }
            st.push_back(i);
        }
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int n = temperatures.length;
        int[] out = new int[n];
        Deque<Integer> st = new ArrayDeque<>();

        for (int i = 0; i < n; i++) {
            while (!st.isEmpty() && temperatures[st.peek()] < temperatures[i]) {
                int j = st.pop();
                out[j] = i - j;
            }
            st.push(i);
        }
        return out;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function dailyTemperatures(temperatures) {
    const out = new Array(temperatures.length).fill(0);
    const st = []; // indices, temperatures decreasing

    for (let i = 0; i < temperatures.length; i++) {
        while (st.length && temperatures[st[st.length - 1]] < temperatures[i]) {
            const j = st.pop();
            out[j] = i - j;
        }
        st.push(i);
    }
    return out;
}`,
            },
        ],
        followUps: [
            'Why indices here when Next Greater Element I could store values?',
            'Prove the O(n) bound given the inner while loop.',
            'Solve it right-to-left instead. Which direction is easier to explain?',
        ],
    },

    'car-fleet': {
        restate:
            'Cars drive toward the same target and cannot overtake — a faster car stuck behind a slower one joins its fleet. How many fleets reach the target?',
        body: `The trick is to stop thinking about positions over time and think about **arrival times**.

For each car, \`time = (target - position) / speed\` — how long it would take if nothing were in the way. Sort the cars by position, **closest to the target first**, and walk backwards down the road.

**The observation:** a car catches the one ahead exactly when its own free-running arrival time is \`<=\` that car's. If it does, it never arrives separately — it is absorbed, and the fleet keeps the *slower* (larger) arrival time, because the car in front sets the pace. If its time is strictly greater, it can never catch up, and it starts a new fleet.

So keep the current fleet's arrival time. Each car either merges (time \`<=\` current) or becomes a new fleet (time \`>\` current, and it becomes the new benchmark). Count the new fleets.

That is a monotonic stack in disguise: the arrival times you keep are strictly increasing, and the "stack" only ever needs its top — so a single variable does the job. Worth saying out loud, because the stack framing is what makes it recognisable as one of these problems.

**Two traps.** Sort **descending by position** — ascending and the comparison inverts. And use floating point (or compare cross-multiplied) for the times: integer division rounds two genuinely different arrival times into equality and merges fleets that should be separate.`,
        complexity: { time: 'O(n log n) — the sort dominates', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int carFleet(int target, vector<int>& position, vector<int>& speed) {
        int n = position.size();
        vector<pair<int, double>> cars(n);
        for (int i = 0; i < n; i++) {
            cars[i] = {position[i], (double)(target - position[i]) / speed[i]};
        }
        // Closest to the target FIRST.
        sort(cars.begin(), cars.end(), [](auto& a, auto& b) { return a.first > b.first; });

        int fleets = 0;
        double slowest = 0;
        for (auto& [pos, time] : cars) {
            if (time > slowest) {   // cannot catch up — a new fleet
                fleets++;
                slowest = time;
            }                       // else absorbed into the fleet ahead
        }
        return fleets;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int carFleet(int target, int[] position, int[] speed) {
        int n = position.length;
        double[][] cars = new double[n][2];
        for (int i = 0; i < n; i++) {
            cars[i][0] = position[i];
            cars[i][1] = (double) (target - position[i]) / speed[i];
        }
        Arrays.sort(cars, (a, b) -> Double.compare(b[0], a[0]));

        int fleets = 0;
        double slowest = 0;
        for (double[] car : cars) {
            if (car[1] > slowest) {
                fleets++;
                slowest = car[1];
            }
        }
        return fleets;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function carFleet(target, position, speed) {
    const cars = position
        .map((p, i) => [p, (target - p) / speed[i]])
        .sort((a, b) => b[0] - a[0]);   // closest to target first

    let fleets = 0, slowest = 0;
    for (const [, time] of cars) {
        if (time > slowest) {
            fleets++;
            slowest = time;
        }
    }
    return fleets;
}`,
            },
        ],
        followUps: [
            'Where is the stack? Explain why one variable is enough.',
            'What if cars could overtake — does the answer become trivial?',
            'Car Fleet II (Leetcode 1776): when does each car collide? Now you really do need the stack.',
        ],
    },

    'largest-rectangle-in-histogram': {
        restate:
            'The largest axis-aligned rectangle that fits inside a histogram of bars.',
        body: `The hardest problem in the section, and the pay-off for the four before it.

**The reframing:** every candidate rectangle is limited by its shortest bar. So instead of enumerating rectangles, ask for each bar: *if this bar is the shortest one, how wide can the rectangle be?* It extends left until a shorter bar blocks it, and right likewise. So the width is bounded by the **previous smaller** and the **next smaller** bar — two monotonic-stack queries at once.

Doing them as separate passes works and is easy to explain. The single-pass version fuses them: keep a stack of indices with **increasing** heights. When bar \`i\` is shorter than the top, bar \`i\` *is* the top's next-smaller — so pop it and settle its rectangle. Its left bound is whatever is beneath it on the stack, because the stack is increasing and everything between them was already popped for being taller.

That gives the width \`i - stack.top() - 1\` after popping, or \`i\` if the stack is now empty (nothing shorter to the left, so it reaches the start).

**Two traps.** After popping, the left bound is the *new* top, not the popped index — an off-by-one here silently under-measures every rectangle.

And bars left on the stack at the end never met a shorter bar to their right, so they extend to \`n\`. Either drain the stack afterwards or append a sentinel bar of height 0, which forces everything to pop through the normal path. The sentinel is fewer lines and fewer places to get the bound wrong.

Same amortisation as Daily Temperatures: each index pushed once, popped once, \`O(n)\`.`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int largestRectangleArea(vector<int>& heights) {
        heights.push_back(0);      // sentinel: forces every bar to pop
        vector<int> st;            // INDICES, heights increasing
        int best = 0;

        for (int i = 0; i < heights.size(); i++) {
            while (!st.empty() && heights[st.back()] > heights[i]) {
                int h = heights[st.back()]; st.pop_back();
                // Left bound is the NEW top; empty means it reaches index 0.
                int width = st.empty() ? i : i - st.back() - 1;
                best = max(best, h * width);
            }
            st.push_back(i);
        }
        heights.pop_back();
        return best;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int largestRectangleArea(int[] heights) {
        int n = heights.length;
        Deque<Integer> st = new ArrayDeque<>();
        int best = 0;

        for (int i = 0; i <= n; i++) {
            int cur = (i == n) ? 0 : heights[i];   // virtual sentinel
            while (!st.isEmpty() && heights[st.peek()] > cur) {
                int h = heights[st.pop()];
                int width = st.isEmpty() ? i : i - st.peek() - 1;
                best = Math.max(best, h * width);
            }
            st.push(i);
        }
        return best;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function largestRectangleArea(heights) {
    const n = heights.length;
    const st = []; // indices, heights increasing
    let best = 0;

    for (let i = 0; i <= n; i++) {
        const cur = i === n ? 0 : heights[i]; // sentinel forces the drain
        while (st.length && heights[st[st.length - 1]] > cur) {
            const h = heights[st.pop()];
            const width = st.length ? i - st[st.length - 1] - 1 : i;
            best = Math.max(best, h * width);
        }
        st.push(i);
    }
    return best;
}`,
            },
        ],
        followUps: [
            'Write the two-pass version with previousSmaller[] and nextSmaller[] arrays first — is it easier to defend?',
            'Why is the width i - stack.top() - 1 rather than i - poppedIndex?',
            'Maximal Rectangle (Leetcode 85): a binary matrix. Hint: run this once per row.',
        ],
    },
};
