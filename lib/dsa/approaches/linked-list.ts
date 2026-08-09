// lib/dsa/approaches/linked-list.ts
//
// "Our approach" pages for the Linked List section.
//
// Same four beats as every other approach file (brute force → why it is too
// slow → the observation → the trap); see approaches/arrays-hashing.ts for the
// house style in full.
//
// THREE TECHNIQUES COVER NEARLY THE WHOLE SECTION, stated once here so the
// pages can point at them rather than re-deriving:
//
//   1. DUMMY HEAD — a throwaway node in front of the list. Removes every
//      "what if the answer is the first node?" special case, because the first
//      real node now has a predecessor like everyone else. Merge Two Lists,
//      Remove Nth, Add Two Numbers.
//   2. FAST/SLOW POINTERS — one moves two steps per one. Finds the middle in a
//      single pass, and detects a cycle without any extra memory. Cycle,
//      Middle, Reorder, Find the Duplicate.
//   3. IN-PLACE REVERSAL — the prev/cur/next dance. Reverse, Reorder.
//
// Almost every problem here is one of those three, or two of them composed.
// Where a page spends its words is on which technique the first sentence of the
// problem is asking for — that recognition is the actual skill, and it is what
// makes the code feel obvious afterwards.
//
// ONE HABIT WORTH MORE THAN ANY OF THEM: draw three nodes on paper and move the
// pointers by hand before writing a line. Every bug in this section is a
// pointer assigned in the wrong order, and no amount of staring at code finds
// those as fast as a diagram does.

import type { DsaApproach } from '../types';

export const linkedListApproaches: Record<string, DsaApproach> = {
    'reverse-linked-list': {
        restate: 'Reverse the list and return the new head.',
        body: `The foundation of the section. Reorder List, Palindrome Linked List and half the follow-ups all call this as a subroutine, so it needs to be automatic.

**The observation:** reversing means flipping every \`next\` pointer to face backwards. Walk the list once carrying \`prev\` — the part already reversed — and point each node at it.

The order of the four lines is the entire problem:

\`\`\`
next = cur.next     // save it FIRST, you are about to destroy it
cur.next = prev     // flip
prev = cur          // advance prev
cur = next          // advance cur
\`\`\`

**Save \`cur.next\` before overwriting it.** The moment you write \`cur.next = prev\`, the rest of the list is unreachable from \`cur\`. Skip the save and you have severed the list at the first node and are holding a two-element loop.

\`prev\` starts at \`null\`, which is what makes the old head correctly become the new tail. When the loop ends, \`cur\` is \`null\` and \`prev\` is the new head — **return \`prev\`, not \`cur\`**.

**The recursive version** reads as: reverse everything after me, then make my successor point back at me. \`head.next.next = head\` is the flip, and \`head.next = null\` is what stops the old forward pointer from creating a cycle — the line people forget. It is elegant but \`O(n)\` stack, so mention that the iterative version is \`O(1)\` space and preferred.`,
        complexity: { time: 'O(n)', space: 'O(1) iterative — O(n) recursive' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* cur = head;
        while (cur) {
            ListNode* next = cur->next;  // SAVE before destroying
            cur->next = prev;            // flip
            prev = cur;                  // advance
            cur = next;
        }
        return prev;                     // prev, not cur — cur is null here
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null, cur = head;
        while (cur != null) {
            ListNode next = cur.next;
            cur.next = prev;
            prev = cur;
            cur = next;
        }
        return prev;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function reverseList(head) {
    let prev = null, cur = head;
    while (cur) {
        const next = cur.next;  // save before the flip destroys it
        cur.next = prev;
        prev = cur;
        cur = next;
    }
    return prev;
}`,
            },
        ],
        followUps: [
            'Write it recursively. Why is head.next = null essential?',
            'Reverse only between positions m and n (Leetcode 92).',
            'Reverse in groups of k (Leetcode 25).',
        ],
    },

    'merge-two-sorted-lists': {
        restate: 'Splice two sorted lists into one sorted list, reusing the existing nodes.',
        body: `The merge step of merge sort, on pointers instead of arrays. The logic is obvious — take the smaller head, advance — and the awkwardness is entirely in the bookkeeping.

**The technique: a dummy head.** Allocate one throwaway node and build the result after it. Without it, the first append is a special case (\`if the result is empty, set head, else set tail.next\`), and you have to carry both a \`head\` and a \`tail\`. With it, there is always a node to append to, and the real head is \`dummy.next\` at the end.

That is the whole trick, and it is worth internalising because it reappears in Remove Nth Node, Add Two Numbers and Partition List. Any time a list's *first* node might need special handling, put a fake node in front of it.

Walk while both lists have nodes, appending the smaller. **Then append the remainder in one line** — whichever list still has nodes is already sorted and already linked, so \`tail.next = l1 ? l1 : l2\` finishes it. No second loop.

**The trap:** advance the tail after every append. Forgetting it overwrites the same \`next\` pointer each time and you end up with a two-node list.

**Stability, if asked:** take from \`l1\` when the values are equal (\`<=\`), so ties keep their original relative order.`,
        complexity: { time: 'O(m + n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    ListNode* mergeTwoLists(ListNode* l1, ListNode* l2) {
        ListNode dummy(0);          // removes the "is this the first node?" case
        ListNode* tail = &dummy;

        while (l1 && l2) {
            if (l1->val <= l2->val) { tail->next = l1; l1 = l1->next; }
            else                    { tail->next = l2; l2 = l2->next; }
            tail = tail->next;      // advance, or you overwrite the same link
        }
        tail->next = l1 ? l1 : l2;  // the rest is already sorted and linked
        return dummy.next;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public ListNode mergeTwoLists(ListNode l1, ListNode l2) {
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;

        while (l1 != null && l2 != null) {
            if (l1.val <= l2.val) { tail.next = l1; l1 = l1.next; }
            else                  { tail.next = l2; l2 = l2.next; }
            tail = tail.next;
        }
        tail.next = (l1 != null) ? l1 : l2;
        return dummy.next;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function mergeTwoLists(l1, l2) {
    const dummy = { val: 0, next: null };
    let tail = dummy;

    while (l1 && l2) {
        if (l1.val <= l2.val) { tail.next = l1; l1 = l1.next; }
        else                  { tail.next = l2; l2 = l2.next; }
        tail = tail.next;
    }
    tail.next = l1 || l2;
    return dummy.next;
}`,
            },
        ],
        followUps: [
            'Write it recursively — it is four lines.',
            'Merge k lists instead of two. That is the last problem in this section.',
            'Why does taking from l1 on ties make the merge stable?',
        ],
    },

    'linked-list-cycle': {
        restate: 'Does the list loop back on itself?',
        body: `A hash set of visited nodes answers it in \`O(n)\` time and \`O(n)\` space, and is a perfectly good first answer. The follow-up always asks for \`O(1)\` space.

**The observation (Floyd's tortoise and hare):** run two pointers, \`slow\` one step at a time and \`fast\` two. If the list ends, \`fast\` falls off and there is no cycle. If there *is* a cycle, both pointers end up inside it, and \`fast\` gains exactly one position on \`slow\` per step — so the gap closes by one each time and they must eventually land on the same node. No skipping past, because the gap shrinks by exactly one.

That "gains one per step" argument is the proof, and it is what an interviewer is listening for. Guessing that they meet is not the same as knowing why.

**The trap:** check \`fast && fast->next\` before advancing. \`fast\` takes two steps, so both the node it is on and the one after must exist; testing only \`fast\` dereferences null on any even-length list without a cycle.

**Two details worth having ready.** Starting both at \`head\` and checking after moving is cleaner than starting them apart. And returning the cycle's *entry point* (Leetcode 142) needs one more insight: after they meet, reset one pointer to the head and advance both one step at a time — they meet again exactly at the entry. That is worth deriving on paper once.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    bool hasCycle(ListNode *head) {
        ListNode *slow = head, *fast = head;
        // fast takes TWO steps — both nodes must exist.
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
            if (slow == fast) return true;   // gap shrinks by 1 per step
        }
        return false;
    }
};`,
            },
            {
                lang: 'java',
                source: `public class Solution {
    public boolean hasCycle(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) return true;
        }
        return false;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function hasCycle(head) {
    let slow = head, fast = head;
    while (fast && fast.next) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow === fast) return true;
    }
    return false;
}`,
            },
        ],
        followUps: [
            'Why must they meet? Give the one-sentence gap argument.',
            'Return the node where the cycle begins (Leetcode 142).',
            'Return the LENGTH of the cycle.',
        ],
    },

    'middle-of-the-linked-list': {
        restate:
            'Return the middle node. With an even count, return the SECOND of the two middles.',
        body: `Counting the length and then walking half of it works and takes two passes. One pass is barely more code.

**The observation:** if \`fast\` moves twice as fast as \`slow\`, then when \`fast\` reaches the end, \`slow\` has covered exactly half the distance — it is standing on the middle. No length needed.

**The whole difficulty is which middle you land on**, and it is decided by the loop condition:

- \`while (fast && fast->next)\` → **second** middle for even lengths. This is what the problem asks for.
- \`while (fast->next && fast->next->next)\` → **first** middle.

That difference matters far beyond this problem. Reorder List and Palindrome Linked List both split the list at the middle, and they need the *first* middle so the front half is never shorter than the back. Getting this wrong there produces an off-by-one that is genuinely hard to see. Know that both variants exist and pick deliberately.

**The trap:** the same null-safety rule as cycle detection — check \`fast\` *and* \`fast->next\` before taking two steps, or an even-length list dereferences null on the final iteration.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    ListNode* middleNode(ListNode* head) {
        ListNode *slow = head, *fast = head;
        // This condition lands on the SECOND middle when the length is even.
        // Use (fast->next && fast->next->next) if you want the first.
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
        }
        return slow;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public ListNode middleNode(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        return slow;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function middleNode(head) {
    let slow = head, fast = head;
    while (fast && fast.next) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;
}`,
            },
        ],
        followUps: [
            'Change one condition to return the FIRST middle. Which problems need that version?',
            'Delete the middle node (Leetcode 2095) — what extra pointer do you need?',
        ],
    },

    'remove-nth-node-from-end': {
        restate: 'Delete the nth node counting from the end, in one pass.',
        body: `Two passes — count the length, then walk to \`length - n\` — is obvious and allowed. The stated follow-up is one pass.

**The observation:** you cannot know where the end is until you reach it, but you can maintain a **fixed gap** and let the end come to you. Advance \`fast\` by \`n\` nodes first, then move \`fast\` and \`slow\` together. When \`fast\` hits the end, \`slow\` is exactly \`n\` from it.

**The dummy head is what makes this work at all**, and it is why the problem is in this section rather than Two Pointers. Deleting a node needs its *predecessor*, and the node to delete might be the head itself — which has none. Start \`slow\` at a dummy in front of the list and the head gets a predecessor like every other node. Then \`return dummy.next\`, which correctly reports the new head even when the old one was deleted.

Without the dummy you need a separate \`if (n == length) return head->next;\` branch, and that branch is where the bug lives.

**Getting the gap right:** advance \`fast\` \`n\` times from the dummy, then move both until \`fast->next\` is null. That leaves \`slow\` on the *predecessor* of the target, which is exactly what \`slow->next = slow->next->next\` needs. Advancing \`n + 1\` times and looping to \`fast == null\` is the same thing written differently — pick one and be consistent, because mixing them is a reliable off-by-one.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    ListNode* removeNthFromEnd(ListNode* head, int n) {
        ListNode dummy(0);
        dummy.next = head;
        ListNode *slow = &dummy, *fast = &dummy;

        for (int i = 0; i < n; i++) fast = fast->next;   // open the gap

        // Stop when fast is the LAST node: slow is then the predecessor.
        while (fast->next) { slow = slow->next; fast = fast->next; }

        slow->next = slow->next->next;
        return dummy.next;      // correct even if the head was removed
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public ListNode removeNthFromEnd(ListNode head, int n) {
        ListNode dummy = new ListNode(0);
        dummy.next = head;
        ListNode slow = dummy, fast = dummy;

        for (int i = 0; i < n; i++) fast = fast.next;
        while (fast.next != null) { slow = slow.next; fast = fast.next; }

        slow.next = slow.next.next;
        return dummy.next;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function removeNthFromEnd(head, n) {
    const dummy = { val: 0, next: head };
    let slow = dummy, fast = dummy;

    for (let i = 0; i < n; i++) fast = fast.next;
    while (fast.next) { slow = slow.next; fast = fast.next; }

    slow.next = slow.next.next;
    return dummy.next;
}`,
            },
        ],
        followUps: [
            'What breaks without the dummy when n equals the list length?',
            'Return the nth node from the end instead of deleting it.',
            'What if n could exceed the length — how would you validate?',
        ],
    },

    'reorder-list': {
        restate:
            'Rearrange L0 → L1 → … → Ln into L0 → Ln → L1 → Ln-1 → …, in place.',
        body: `The first composition problem in the section: no new technique, but three of them in sequence. Recognising that is the solution.

**The decomposition:**

1. **Find the middle** with fast/slow — and here you want the **first** middle, so the front half is never shorter than the back.
2. **Reverse the second half**, using the loop from Reverse Linked List.
3. **Interleave** the two halves, alternating one node from each.

Each step you have already written. The value of the problem is seeing that "L0, Ln, L1, Ln-1…" *is* "front half interleaved with reversed back half" — once you say that sentence, there is nothing left to invent.

**The trap that produces an infinite loop: cut the list in two.** After finding the middle, set \`slow->next = nullptr\` before reversing. Skip it and the front half still points into the back half, which now points backwards — the interleave walks in circles and never terminates.

**The second trap: stop on the right pointer.** The halves can differ in length by one, so the interleave loop must end when the *second* list runs out. Guard on \`second\` (and save both \`next\` pointers before rewiring, the same discipline as reversal).

An interviewer who sees you name the three steps before writing anything has already got the signal they wanted.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    void reorderList(ListNode* head) {
        if (!head || !head->next) return;

        // 1. FIRST middle: front half must not be shorter than the back.
        ListNode *slow = head, *fast = head;
        while (fast->next && fast->next->next) {
            slow = slow->next;
            fast = fast->next->next;
        }

        // 2. Reverse the second half, after CUTTING the list.
        ListNode* second = slow->next;
        slow->next = nullptr;             // without this: infinite loop
        ListNode* prev = nullptr;
        while (second) {
            ListNode* next = second->next;
            second->next = prev;
            prev = second;
            second = next;
        }

        // 3. Interleave. Stop when the SECOND list runs out.
        ListNode* first = head;
        second = prev;
        while (second) {
            ListNode* n1 = first->next;
            ListNode* n2 = second->next;
            first->next = second;
            second->next = n1;
            first = n1;
            second = n2;
        }
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public void reorderList(ListNode head) {
        if (head == null || head.next == null) return;

        ListNode slow = head, fast = head;
        while (fast.next != null && fast.next.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }

        ListNode second = slow.next;
        slow.next = null;
        ListNode prev = null;
        while (second != null) {
            ListNode next = second.next;
            second.next = prev;
            prev = second;
            second = next;
        }

        ListNode first = head;
        second = prev;
        while (second != null) {
            ListNode n1 = first.next, n2 = second.next;
            first.next = second;
            second.next = n1;
            first = n1;
            second = n2;
        }
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function reorderList(head) {
    if (!head || !head.next) return;

    // 1. first middle
    let slow = head, fast = head;
    while (fast.next && fast.next.next) {
        slow = slow.next;
        fast = fast.next.next;
    }

    // 2. cut, then reverse the back half
    let second = slow.next;
    slow.next = null;
    let prev = null;
    while (second) {
        const next = second.next;
        second.next = prev;
        prev = second;
        second = next;
    }

    // 3. interleave
    let first = head;
    second = prev;
    while (second) {
        const n1 = first.next, n2 = second.next;
        first.next = second;
        second.next = n1;
        first = n1;
        second = n2;
    }
}`,
            },
        ],
        followUps: [
            'What happens if you forget slow.next = null? Trace it.',
            'Why the FIRST middle here rather than the second?',
            'Palindrome Linked List (Leetcode 234) — the same three steps, different final compare.',
        ],
    },

    'add-two-numbers': {
        restate:
            'Two numbers stored as linked lists with the LEAST significant digit first. Return their sum in the same form.',
        body: `Converting each list to an integer, adding, and rebuilding fails: the lists can hold 100 digits, which overflows every fixed-width type. You must add digit by digit.

**The reverse storage is a gift, not an obstacle.** Long addition starts from the least significant digit and carries left — which is exactly the direction the lists already run. No reversal needed anywhere.

Walk both lists together carrying \`carry\`. At each step \`sum = v1 + v2 + carry\`, append \`sum % 10\`, and set \`carry = sum / 10\`. A dummy head keeps the append loop free of first-node special cases.

**The condition that removes three special cases:**

\`\`\`
while (l1 || l2 || carry)
\`\`\`

Treat an exhausted list as contributing 0. That one loop handles unequal lengths *and* the final carry (\`[5] + [5]\` → \`[0,1]\`) without any code after it. Looping on \`l1 && l2\` and then patching up the remainder and the carry afterwards is three times the code and where the bugs are.

**The trap:** \`carry\` must be part of the loop condition. Dropping it silently loses the leading 1 on every input that overflows the last digit — and the obvious test cases do not.`,
        complexity: { time: 'O(max(m, n))', space: 'O(max(m, n)) for the output' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
        ListNode dummy(0);
        ListNode* tail = &dummy;
        int carry = 0;

        // The "|| carry" is what handles [5]+[5] -> [0,1] with no trailing fixup.
        while (l1 || l2 || carry) {
            int sum = carry;
            if (l1) { sum += l1->val; l1 = l1->next; }
            if (l2) { sum += l2->val; l2 = l2->next; }

            carry = sum / 10;
            tail->next = new ListNode(sum % 10);
            tail = tail->next;
        }
        return dummy.next;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;
        int carry = 0;

        while (l1 != null || l2 != null || carry != 0) {
            int sum = carry;
            if (l1 != null) { sum += l1.val; l1 = l1.next; }
            if (l2 != null) { sum += l2.val; l2 = l2.next; }

            carry = sum / 10;
            tail.next = new ListNode(sum % 10);
            tail = tail.next;
        }
        return dummy.next;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function addTwoNumbers(l1, l2) {
    const dummy = { val: 0, next: null };
    let tail = dummy, carry = 0;

    while (l1 || l2 || carry) {
        let sum = carry;
        if (l1) { sum += l1.val; l1 = l1.next; }
        if (l2) { sum += l2.val; l2 = l2.next; }

        carry = Math.floor(sum / 10);
        tail.next = { val: sum % 10, next: null };
        tail = tail.next;
    }
    return dummy.next;
}`,
            },
        ],
        followUps: [
            'What does [5] + [5] return if carry is left out of the loop condition?',
            'Add Two Numbers II (Leetcode 445): most significant digit first. Two options — reverse, or use stacks.',
            'Subtract instead of add. What new case appears?',
        ],
    },

    'copy-list-with-random-pointer': {
        restate:
            'Deep-copy a list where each node also has a `random` pointer to any node, or null.',
        body: `Copying \`next\` is easy. \`random\` is the problem: it can point *forward* to a node you have not created yet, so you cannot resolve it on a single naive pass.

**The observation:** the difficulty is a mapping problem. You need "given an original node, what is its copy?" — so build that mapping explicitly.

**Pass 1:** create a copy of every node and store \`original → copy\` in a hash map. Wire nothing.
**Pass 2:** walk again and wire both pointers through the map: \`copy[node].next = map[node.next]\` and \`copy[node].random = map[node.random]\`.

By pass two every copy exists, so forward references are no longer a problem. Null falls out for free if the map returns null for a null key — in C++ and Java, seed \`map[nullptr] = nullptr\` or check explicitly, rather than accidentally default-constructing an entry.

That is \`O(n)\` time, \`O(n)\` space, and it is the answer to give.

**The \`O(1)\`-space follow-up**, worth knowing exists: interleave the copies into the original list (\`A → A' → B → B' → …\`). Then each copy sits directly after its original, so \`A'->random = A->random->next\` — the map is replaced by the list's own structure. Finally unweave the two lists. Three passes, no extra memory, and considerably easier to get wrong; mention it, implement the map version unless asked.

**The trap in the unweave:** restore the original list's \`next\` pointers as you separate them. Returning a correct copy while leaving the input mangled fails the hidden tests.`,
        complexity: { time: 'O(n)', space: 'O(n) — O(1) with the interleaving trick' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    Node* copyRandomList(Node* head) {
        unordered_map<Node*, Node*> copies;

        // Pass 1: create every node, wire nothing.
        for (Node* cur = head; cur; cur = cur->next) {
            copies[cur] = new Node(cur->val);
        }
        // Pass 2: every copy now exists, so forward randoms resolve.
        for (Node* cur = head; cur; cur = cur->next) {
            copies[cur]->next   = cur->next   ? copies[cur->next]   : nullptr;
            copies[cur]->random = cur->random ? copies[cur->random] : nullptr;
        }
        return head ? copies[head] : nullptr;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public Node copyRandomList(Node head) {
        Map<Node, Node> copies = new HashMap<>();

        for (Node cur = head; cur != null; cur = cur.next) {
            copies.put(cur, new Node(cur.val));
        }
        for (Node cur = head; cur != null; cur = cur.next) {
            copies.get(cur).next   = copies.get(cur.next);    // null -> null
            copies.get(cur).random = copies.get(cur.random);
        }
        return copies.get(head);
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function copyRandomList(head) {
    const copies = new Map();
    copies.set(null, null);   // makes null pointers resolve for free

    for (let cur = head; cur; cur = cur.next) {
        copies.set(cur, new Node(cur.val));
    }
    for (let cur = head; cur; cur = cur.next) {
        copies.get(cur).next = copies.get(cur.next) ?? null;
        copies.get(cur).random = copies.get(cur.random) ?? null;
    }
    return copies.get(head) ?? null;
}`,
            },
        ],
        followUps: [
            'Do it in O(1) extra space with the interleaving trick.',
            'Why can this not be done correctly in a single naive pass?',
            'What must the unweave step restore, and why do the tests care?',
        ],
    },

    'find-the-duplicate-number': {
        restate:
            'n + 1 numbers in the range [1, n], exactly one value repeated. Find it without modifying the array and in O(1) space.',
        body: `In this section, not Arrays, because the intended solution is a **linked-list algorithm applied to an array** — and that reframing is the entire problem.

Sorting modifies the input. A hash set is \`O(n)\` space. Both constraints exist to force the real answer.

**The observation:** read the array as a function. From index \`i\`, "follow" \`nums[i]\` to the next index. Because every value is in \`[1, n]\`, every step lands on a valid index — you can walk forever, so the walk must eventually repeat and form a **cycle**. And because two different indices hold the same duplicated value, two arrows point at the same node: that convergence is the cycle's entrance, and the duplicate value is the index it points to.

So this is Linked List Cycle II with \`next = nums[cur]\`, and Floyd's algorithm applies unchanged:

**Phase 1** — advance \`slow = nums[slow]\` and \`fast = nums[nums[fast]]\` until they meet. That finds *a* node in the cycle, not the entrance.

**Phase 2** — reset \`slow\` to the start, then advance both one step at a time. They meet exactly at the entrance, which is the duplicate. The reason is a short distance argument worth doing once on paper: the gap from the start to the entrance equals the gap from the meeting point to the entrance, going round.

**The trap:** phase 1 must run at least once, so use a do-while (or prime the loop). Both pointers start at index 0, so a \`while (slow != fast)\` loop exits immediately having done nothing.

Start at index 0, which is guaranteed not to be inside the cycle because no value equals 0.`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int findDuplicate(vector<int>& nums) {
        int slow = 0, fast = 0;

        // Phase 1: find a meeting point INSIDE the cycle.
        // do-while: both start at 0, so a plain while would exit immediately.
        do {
            slow = nums[slow];
            fast = nums[nums[fast]];
        } while (slow != fast);

        // Phase 2: reset one pointer; they meet at the cycle's entrance.
        slow = 0;
        while (slow != fast) {
            slow = nums[slow];
            fast = nums[fast];
        }
        return slow;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int findDuplicate(int[] nums) {
        int slow = 0, fast = 0;
        do {
            slow = nums[slow];
            fast = nums[nums[fast]];
        } while (slow != fast);

        slow = 0;
        while (slow != fast) {
            slow = nums[slow];
            fast = nums[fast];
        }
        return slow;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function findDuplicate(nums) {
    let slow = 0, fast = 0;
    do {
        slow = nums[slow];
        fast = nums[nums[fast]];
    } while (slow !== fast);

    slow = 0;
    while (slow !== fast) {
        slow = nums[slow];
        fast = nums[fast];
    }
    return slow;
}`,
            },
        ],
        followUps: [
            'Why is index 0 guaranteed to be outside the cycle?',
            'Prove phase 2 lands on the entrance. Draw the distances.',
            'Solve it with binary search on the VALUE range instead — O(n log n), no cycle needed.',
        ],
    },

    'lru-cache': {
        restate:
            'A fixed-capacity cache with O(1) get and put, evicting the least recently used entry when full.',
        body: `The most-asked design problem in the industry, and the reason a linked list is in the answer at all.

**The requirement forces the structure.** You need two things in \`O(1)\`: look up a key, and know which entry is least recently used. A hash map gives the first and cannot give the second. A list gives the second and cannot give the first. So use **both**, pointing at each other.

- A **hash map** from key → the node holding it.
- A **doubly** linked list in recency order: most recent at one end, least recent at the other.

**Why doubly, specifically:** eviction and re-ordering both require *removing a node you already have a pointer to*. Unlinking a node needs its predecessor, and in a singly linked list finding that is \`O(n)\` — which destroys the whole point. The \`prev\` pointer is the entire reason for the extra memory.

\`get\` → find via the map, unlink, re-insert at the front, return the value.
\`put\` → if the key exists, update and move to front. Otherwise insert at the front, and if over capacity remove the node at the back and **delete its key from the map** as well.

**The trap that produces a slow memory leak:** forgetting to erase the evicted key from the map. The list shrinks correctly, so capacity looks right, but the map grows forever and holds a dangling node — in C++ that is a use-after-free waiting to happen.

**Use two sentinel nodes**, a permanent \`head\` and \`tail\` that hold no data. Then every insert and remove has real neighbours on both sides, and there is not a single null check in the pointer code. Without them, the empty-list and single-element cases are four extra branches, and that is where this gets written wrong under time pressure.`,
        complexity: { time: 'O(1) for get and put', space: 'O(capacity)' },
        code: [
            {
                lang: 'cpp',
                source: `class LRUCache {
    struct Node {
        int key, val;
        Node *prev = nullptr, *next = nullptr;
        Node(int k, int v) : key(k), val(v) {}
    };
    int cap;
    unordered_map<int, Node*> map;
    Node *head, *tail;               // SENTINELS: no null checks anywhere

    void remove(Node* n) {
        n->prev->next = n->next;
        n->next->prev = n->prev;
    }
    void addFront(Node* n) {
        n->next = head->next;
        n->prev = head;
        head->next->prev = n;
        head->next = n;
    }
public:
    LRUCache(int capacity) : cap(capacity) {
        head = new Node(0, 0);
        tail = new Node(0, 0);
        head->next = tail;
        tail->prev = head;
    }

    int get(int key) {
        if (!map.count(key)) return -1;
        Node* n = map[key];
        remove(n);
        addFront(n);                 // touching it makes it most recent
        return n->val;
    }

    void put(int key, int value) {
        if (map.count(key)) {
            Node* n = map[key];
            n->val = value;
            remove(n);
            addFront(n);
            return;
        }
        if ((int)map.size() == cap) {
            Node* lru = tail->prev;
            remove(lru);
            map.erase(lru->key);     // ERASE THE KEY, or the map leaks
            delete lru;
        }
        Node* n = new Node(key, value);
        map[key] = n;
        addFront(n);
    }
};`,
            },
            {
                lang: 'java',
                source: `class LRUCache {
    private static class Node {
        int key, val;
        Node prev, next;
        Node(int k, int v) { key = k; val = v; }
    }

    private final int cap;
    private final Map<Integer, Node> map = new HashMap<>();
    private final Node head = new Node(0, 0), tail = new Node(0, 0);

    public LRUCache(int capacity) {
        cap = capacity;
        head.next = tail;
        tail.prev = head;
    }

    private void remove(Node n) {
        n.prev.next = n.next;
        n.next.prev = n.prev;
    }
    private void addFront(Node n) {
        n.next = head.next;
        n.prev = head;
        head.next.prev = n;
        head.next = n;
    }

    public int get(int key) {
        Node n = map.get(key);
        if (n == null) return -1;
        remove(n);
        addFront(n);
        return n.val;
    }

    public void put(int key, int value) {
        Node n = map.get(key);
        if (n != null) {
            n.val = value;
            remove(n);
            addFront(n);
            return;
        }
        if (map.size() == cap) {
            Node lru = tail.prev;
            remove(lru);
            map.remove(lru.key);
        }
        Node fresh = new Node(key, value);
        map.put(key, fresh);
        addFront(fresh);
    }
}`,
            },
            {
                lang: 'javascript',
                source: `class LRUCache {
    /**
     * A JS Map already preserves insertion order, so this can be done without a
     * linked list at all — delete-then-set moves a key to the most-recent end,
     * and map.keys().next().value is the least recent. Worth knowing, but say
     * the hash-map + doubly-linked-list design in an interview: that is what is
     * being asked about, and it is what the other two languages need.
     */
    constructor(capacity) {
        this.cap = capacity;
        this.map = new Map();
    }

    get(key) {
        if (!this.map.has(key)) return -1;
        const val = this.map.get(key);
        this.map.delete(key);
        this.map.set(key, val);      // re-insert at the most-recent end
        return val;
    }

    put(key, value) {
        if (this.map.has(key)) this.map.delete(key);
        else if (this.map.size === this.cap) {
            this.map.delete(this.map.keys().next().value);  // evict oldest
        }
        this.map.set(key, value);
    }
}`,
            },
        ],
        followUps: [
            'Why DOUBLY linked? What is O(n) without the prev pointer?',
            'What leaks if you forget to erase the evicted key from the map?',
            'LFU Cache (Leetcode 460) — least FREQUENTLY used. What changes?',
            'Make it thread-safe. Where do the locks go?',
        ],
    },

    'merge-k-sorted-lists': {
        restate: 'Merge k sorted linked lists into one sorted list.',
        body: `Merging them one at a time into an accumulator is the obvious approach and it is quadratic in \`k\`: the accumulated list is re-walked on every merge, giving \`O(kN)\` where \`N\` is the total node count. With \`k = 10⁴\` that is far too slow.

Two good answers, and you should be able to give both.

**Divide and conquer** — merge lists in pairs, then merge the pairs, and so on. Each round halves the number of lists, so there are \`log k\` rounds, and each round touches every node once: \`O(N log k)\`. It reuses Merge Two Sorted Lists unchanged, needs no extra data structure, and is \`O(1)\` extra space. This is usually the answer to write.

**Min-heap** — push the head of each list, then repeatedly pop the smallest and push its successor. Same \`O(N log k)\`, because the heap never exceeds \`k\` entries. It is the better answer when the lists arrive as a *stream* rather than an array, and it generalises to merging k sorted files.

**Why the improvement is real:** the naive version keeps re-scanning nodes that are already in place. Both good solutions ensure each node is compared \`O(log k)\` times instead of \`O(k)\`.

**Traps.** Filter out empty lists before starting, or the heap gets a null head and the pairwise merge dereferences it. With a heap, compare on \`val\` — in C++ a raw \`ListNode*\` comparator compares *addresses*, which compiles fine and produces nonsense; in Java, ties on equal values throw unless the comparator is total. And the merge must **splice existing nodes**, not allocate new ones, or the space claim is wrong.`,
        complexity: { time: 'O(N log k)', space: 'O(1) divide-and-conquer — O(k) heap' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    ListNode* merge2(ListNode* a, ListNode* b) {
        ListNode dummy(0);
        ListNode* tail = &dummy;
        while (a && b) {
            if (a->val <= b->val) { tail->next = a; a = a->next; }
            else                  { tail->next = b; b = b->next; }
            tail = tail->next;
        }
        tail->next = a ? a : b;
        return dummy.next;
    }
public:
    ListNode* mergeKLists(vector<ListNode*>& lists) {
        if (lists.empty()) return nullptr;
        // Pair up and halve each round: log k rounds, O(N) work per round.
        while (lists.size() > 1) {
            vector<ListNode*> merged;
            for (size_t i = 0; i < lists.size(); i += 2) {
                ListNode* b = (i + 1 < lists.size()) ? lists[i + 1] : nullptr;
                merged.push_back(merge2(lists[i], b));
            }
            lists = merged;
        }
        return lists[0];
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public ListNode mergeKLists(ListNode[] lists) {
        if (lists == null || lists.length == 0) return null;

        // Min-heap on VALUE — a default comparator would not compile / would
        // compare references.
        PriorityQueue<ListNode> pq =
            new PriorityQueue<>((a, b) -> Integer.compare(a.val, b.val));
        for (ListNode l : lists) if (l != null) pq.add(l);   // skip empties

        ListNode dummy = new ListNode(0), tail = dummy;
        while (!pq.isEmpty()) {
            ListNode node = pq.poll();
            tail.next = node;                 // splice, do not allocate
            tail = node;
            if (node.next != null) pq.add(node.next);
        }
        tail.next = null;
        return dummy.next;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function mergeKLists(lists) {
    const live = lists.filter(Boolean);   // drop empty lists first
    if (live.length === 0) return null;

    const merge2 = (a, b) => {
        const dummy = { val: 0, next: null };
        let tail = dummy;
        while (a && b) {
            if (a.val <= b.val) { tail.next = a; a = a.next; }
            else                { tail.next = b; b = b.next; }
            tail = tail.next;
        }
        tail.next = a || b;
        return dummy.next;
    };

    let cur = live;
    while (cur.length > 1) {
        const next = [];
        for (let i = 0; i < cur.length; i += 2) {
            next.push(merge2(cur[i], cur[i + 1] ?? null));
        }
        cur = next;
    }
    return cur[0];
}`,
            },
        ],
        followUps: [
            'Why is merging one at a time O(kN) rather than O(N log k)?',
            'When would you prefer the heap over divide and conquer?',
            'Merge k sorted ARRAYS instead. Does the same reasoning hold?',
        ],
    },
};
