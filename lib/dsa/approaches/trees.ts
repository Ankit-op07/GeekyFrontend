// lib/dsa/approaches/trees.ts
//
// "Our approach" pages for the Trees section — the largest on the sheet.
//
// Same four beats as every other approach file (brute force → why it is too
// slow → the observation → the trap); see approaches/arrays-hashing.ts for the
// house style in full.
//
// THE ONE QUESTION THAT DECIDES EVERY TREE PROBLEM, stated once here:
//
//   *What should each recursive call RETURN?*
//
// Get that right and the solution is five lines. Get it wrong and you end up
// with a tangle of globals and special cases. Three shapes cover the section:
//
//   1. RETURN THE ANSWER. The value you want at a node is computable from the
//      same value at its children. Max Depth, Invert, Same Tree.
//   2. RETURN ONE THING, TRACK ANOTHER. The answer is not composable, but some
//      *other* quantity is. Return the composable one (usually height or
//      "best path ending here") and record the real answer in an outer
//      variable as you go. Diameter, Balanced, Max Path Sum — and this is the
//      single most valuable idea in the section.
//   3. PASS INFORMATION DOWN. The child cannot decide alone; it needs context
//      from its ancestors, so the recursion carries parameters downward.
//      Validate BST (min/max bounds), Count Good Nodes (max on the path).
//
// Before writing code, say out loud which of the three it is. That sentence is
// what an interviewer is listening for, and it is what makes the code obvious.
//
// A note on BFS: Level Order and Right Side View are the two that want a queue
// rather than recursion, because "level" is not something a single DFS call can
// see. Recognising that is the same skill in a different direction.

import type { DsaApproach } from '../types';

export const treesApproaches: Record<string, DsaApproach> = {
    'invert-binary-tree': {
        restate: 'Mirror the tree: every left child becomes the right child and vice versa.',
        body: `Shape 1 — the answer at a node is built directly from the answer at its children.

**The observation:** to mirror a tree, swap the two children of the root, then mirror each subtree. That is the whole algorithm; the recursion carries all the bookkeeping.

The base case is \`null\`, returned unchanged. A leaf works without a special case, because both its children are \`null\` and swapping them does nothing.

**The trap in the iterative-minded version:** if you write \`root.left = invert(root.right)\` first, you have already overwritten \`root.left\` before reading it on the next line, and the tree ends up with the right subtree duplicated. Either recurse into both children into temporaries first, or swap the pointers before recursing. The version below swaps first, which sidesteps it entirely.

Both orders — swap-then-recurse and recurse-then-swap — are correct as long as nothing is read after being overwritten. Say which you are doing.

This is famously the problem behind the Homebrew author's rejection tweet, so it turns up in interviews partly as a joke. It is still a fair check that you can write a base case.`,
        complexity: { time: 'O(n)', space: 'O(h) recursion — O(n) worst case' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        if (!root) return nullptr;
        swap(root->left, root->right);   // swap BEFORE recursing
        invertTree(root->left);
        invertTree(root->right);
        return root;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public TreeNode invertTree(TreeNode root) {
        if (root == null) return null;
        TreeNode tmp = root.left;
        root.left = root.right;
        root.right = tmp;
        invertTree(root.left);
        invertTree(root.right);
        return root;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function invertTree(root) {
    if (!root) return null;
    [root.left, root.right] = [root.right, root.left];
    invertTree(root.left);
    invertTree(root.right);
    return root;
}`,
            },
        ],
        followUps: [
            'Write it iteratively with a queue or stack.',
            'Check whether a tree is a mirror of ITSELF (Symmetric Tree, Leetcode 101).',
        ],
    },

    'maximum-depth-of-binary-tree': {
        restate: 'How many nodes are on the longest root-to-leaf path?',
        body: `Shape 1 again, and the cleanest example of it on the sheet.

**The observation:** the depth of a tree is one more than the deeper of its two subtrees. Written down, that sentence *is* the code:

\`\`\`
depth(node) = 1 + max(depth(left), depth(right))
\`\`\`

The base case \`depth(null) = 0\` makes a leaf come out as 1, which is what the problem wants.

**Worth knowing all three versions**, because interviewers often ask for a different one after you give the first:

- **Recursive DFS** — the three lines above. Cleanest.
- **Iterative BFS** — count levels as you drain the queue. This is the one to reach for if the tree could be deep enough to blow the stack.
- **Iterative DFS** — a stack of (node, depth) pairs.

**The trap:** \`max\`, not \`min\` or \`+\`. It reads obvious here, and then Balanced Binary Tree and Diameter both build on this exact helper — so an error here propagates into two harder problems where it is much less visible.

**Depth vs height, since interviewers use both:** depth is measured from the root down, height from a node down to its deepest leaf. For the whole tree they coincide, which is why this problem can be phrased either way.`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int maxDepth(TreeNode* root) {
        if (!root) return 0;
        return 1 + max(maxDepth(root->left), maxDepth(root->right));
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int maxDepth(TreeNode root) {
        if (root == null) return 0;
        return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function maxDepth(root) {
    if (!root) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}`,
            },
        ],
        followUps: [
            'Write the BFS version. When would you prefer it?',
            'Minimum depth (Leetcode 111) — why is it NOT just min() instead of max()?',
        ],
    },

    'same-tree': {
        restate: 'Are two trees identical in both structure and values?',
        body: `Shape 1, on two trees at once.

**The observation:** two trees match when their roots match *and* their left subtrees match *and* their right subtrees match. Three conditions, all recursive.

The base cases are where the care is needed, and there are exactly two:

- **Both null** → identical (two empty trees are the same). Return true.
- **Exactly one null** → different shapes. Return false.

Handling them in that order means the value comparison below can dereference both nodes safely, because you have already established that neither is null.

**The trap:** collapsing them into \`if (!p || !q) return false;\`. That reports two empty trees as different, which then makes every leaf comparison fail, and the whole function returns false for identical trees. The two-null case must be checked *first*.

**Why this matters beyond the problem:** the next problem, Subtree of Another Tree, calls this as its inner check. A subtly wrong \`isSameTree\` gives wrong answers there in a way that is much harder to debug, so get it exactly right here.

Comparing serialised strings also works and is worth mentioning — but it is \`O(n)\` extra space and needs null markers to avoid ambiguity.`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    bool isSameTree(TreeNode* p, TreeNode* q) {
        if (!p && !q) return true;    // BOTH null first — two empty trees match
        if (!p || !q) return false;   // exactly one null: different shapes
        return p->val == q->val
            && isSameTree(p->left, q->left)
            && isSameTree(p->right, q->right);
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public boolean isSameTree(TreeNode p, TreeNode q) {
        if (p == null && q == null) return true;
        if (p == null || q == null) return false;
        return p.val == q.val
            && isSameTree(p.left, q.left)
            && isSameTree(p.right, q.right);
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function isSameTree(p, q) {
    if (!p && !q) return true;
    if (!p || !q) return false;
    return p.val === q.val
        && isSameTree(p.left, q.left)
        && isSameTree(p.right, q.right);
}`,
            },
        ],
        followUps: [
            'What does the function return for two empty trees if you check the || case first?',
            'Symmetric Tree (Leetcode 101) — compare a tree against its own mirror.',
        ],
    },

    'subtree-of-another-tree': {
        restate: 'Does `subRoot` appear somewhere inside `root` as a complete subtree?',
        body: `The first composition in the section: it calls the previous problem as a subroutine.

**The observation:** \`subRoot\` is a subtree of \`root\` if the trees are identical starting *at the root*, or if it is a subtree of the left child, or of the right child. Try to match at every node.

That is two recursions layered: an outer walk over every node of \`root\`, and an inner \`isSameTree\` at each one.

**Complexity, and be precise about it:** \`O(m · n)\` in the worst case — for each of \`m\` nodes you may compare \`n\`. That looks bad and is the expected answer. The \`O(m + n)\` solution serialises both trees and runs a substring search (KMP), which is worth naming as an improvement even if you do not write it.

**Two traps:**

**"Complete subtree" means everything below the match must agree too.** A partial match is not enough — which is exactly why \`isSameTree\` and not a looser check.

**An empty \`subRoot\` is a subtree of anything**, including an empty tree. Handle it before dereferencing \`root\`, or a null \`root\` with a non-null \`subRoot\` crashes.

**The serialisation gotcha, if you go that way:** you must include null markers and a delimiter, or \`[12]\` matches inside \`[1,2]\` and you report a subtree that is not there.`,
        complexity: { time: 'O(m · n) — O(m + n) with serialisation + KMP', space: 'O(h)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    bool isSame(TreeNode* p, TreeNode* q) {
        if (!p && !q) return true;
        if (!p || !q) return false;
        return p->val == q->val && isSame(p->left, q->left) && isSame(p->right, q->right);
    }
public:
    bool isSubtree(TreeNode* root, TreeNode* subRoot) {
        if (!subRoot) return true;    // empty matches anything — check first
        if (!root) return false;
        if (isSame(root, subRoot)) return true;
        return isSubtree(root->left, subRoot) || isSubtree(root->right, subRoot);
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private boolean isSame(TreeNode p, TreeNode q) {
        if (p == null && q == null) return true;
        if (p == null || q == null) return false;
        return p.val == q.val && isSame(p.left, q.left) && isSame(p.right, q.right);
    }

    public boolean isSubtree(TreeNode root, TreeNode subRoot) {
        if (subRoot == null) return true;
        if (root == null) return false;
        if (isSame(root, subRoot)) return true;
        return isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function isSubtree(root, subRoot) {
    const isSame = (p, q) => {
        if (!p && !q) return true;
        if (!p || !q) return false;
        return p.val === q.val && isSame(p.left, q.left) && isSame(p.right, q.right);
    };

    if (!subRoot) return true;
    if (!root) return false;
    if (isSame(root, subRoot)) return true;
    return isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
}`,
            },
        ],
        followUps: [
            'Get it to O(m + n) by serialising both trees and running KMP.',
            'Why do the serialised strings need null markers AND a delimiter?',
        ],
    },

    'diameter-of-binary-tree': {
        restate:
            'The number of EDGES on the longest path between any two nodes. The path need not pass through the root.',
        body: `The problem that teaches shape 2, and the single most useful idea in the section. Every Hard tree problem later reuses it.

**Why the obvious recursion fails:** you want \`diameter(node)\` to be built from \`diameter(left)\` and \`diameter(right)\`, and it cannot be. The longest path in a subtree tells you nothing about how that subtree connects upward — a path through the current node is built from *heights*, not from diameters.

**The observation:** two different quantities are in play.

- The **height** of a subtree is composable, and it is what a parent needs.
- The **diameter** is the answer, and it is *not* composable — but at each node the best path *through that node* is \`leftHeight + rightHeight\`, which you can compute the moment you have both heights.

So: **return the height, and record the answer in an outer variable.** One post-order pass, \`O(n)\`.

Once you have seen this, Balanced Binary Tree and Binary Tree Maximum Path Sum are the same manoeuvre with a different quantity.

**Two traps.**

**Edges, not nodes.** \`leftHeight + rightHeight\` already counts edges if \`height(null) = 0\` and \`height(leaf) = 1\`... careful: with that convention a leaf's two null children give \`0 + 0 = 0\` edges, which is right, and the height returned is 1. Do not add 1 to the diameter.

**Update the answer at every node, not just the root.** The longest path frequently does not pass through the root — that is the whole point of the problem statement's warning.`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    int best = 0;
    // RETURNS height; TRACKS the diameter in "best".
    int height(TreeNode* node) {
        if (!node) return 0;
        int l = height(node->left);
        int r = height(node->right);
        best = max(best, l + r);      // path THROUGH this node, in edges
        return 1 + max(l, r);
    }
public:
    int diameterOfBinaryTree(TreeNode* root) {
        best = 0;
        height(root);
        return best;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private int best = 0;

    private int height(TreeNode node) {
        if (node == null) return 0;
        int l = height(node.left);
        int r = height(node.right);
        best = Math.max(best, l + r);
        return 1 + Math.max(l, r);
    }

    public int diameterOfBinaryTree(TreeNode root) {
        best = 0;
        height(root);
        return best;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function diameterOfBinaryTree(root) {
    let best = 0;

    const height = (node) => {
        if (!node) return 0;
        const l = height(node.left);
        const r = height(node.right);
        best = Math.max(best, l + r);   // the answer is tracked, not returned
        return 1 + Math.max(l, r);
    };

    height(root);
    return best;
}`,
            },
        ],
        followUps: [
            'Why can the recursion not simply return the diameter?',
            'Return the path itself, not just its length.',
            'Diameter of an N-ary tree — what changes?',
        ],
    },

    'balanced-binary-tree': {
        restate:
            'Is every node\'s two subtrees within 1 of each other in height?',
        body: `Shape 2 again, and the reason it is worth learning as a pattern rather than a trick.

**The naive version:** at every node, compute both subtree heights and compare. That is \`O(n)\` per node and \`O(n²)\` overall, because every height computation re-walks the whole subtree. It passes on small inputs and times out on a skewed tree.

**The observation:** the height computation already visits every node — so compute the height and check the balance condition *in the same pass*. Post-order: get both child heights, compare them, and return the height upward.

**Signalling failure.** Two clean ways:

- **Sentinel** — return \`-1\` to mean "unbalanced below here", and propagate it immediately. One value, no extra type.
- **Outer flag** — a boolean the recursion sets, exactly like Diameter's \`best\`.

The sentinel version below has the nicer property of **short-circuiting**: once a subtree reports \`-1\`, the parent returns \`-1\` without computing anything else.

**The trap:** check the child's sentinel *before* using its value in arithmetic. Doing \`abs(l - r) > 1\` when \`l\` is \`-1\` produces a difference that can look balanced, and an unbalanced tree passes.

**Height, not depth.** Return \`1 + max(l, r)\` so a leaf is 1 and null is 0 — the same convention as Max Depth, which is why that problem comes first.`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    // Returns the height, or -1 meaning "unbalanced somewhere below".
    int check(TreeNode* node) {
        if (!node) return 0;
        int l = check(node->left);
        if (l == -1) return -1;          // short-circuit BEFORE using l
        int r = check(node->right);
        if (r == -1) return -1;
        if (abs(l - r) > 1) return -1;
        return 1 + max(l, r);
    }
public:
    bool isBalanced(TreeNode* root) {
        return check(root) != -1;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private int check(TreeNode node) {
        if (node == null) return 0;
        int l = check(node.left);
        if (l == -1) return -1;
        int r = check(node.right);
        if (r == -1) return -1;
        if (Math.abs(l - r) > 1) return -1;
        return 1 + Math.max(l, r);
    }

    public boolean isBalanced(TreeNode root) {
        return check(root) != -1;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function isBalanced(root) {
    const check = (node) => {
        if (!node) return 0;
        const l = check(node.left);
        if (l === -1) return -1;
        const r = check(node.right);
        if (r === -1) return -1;
        if (Math.abs(l - r) > 1) return -1;
        return 1 + Math.max(l, r);
    };
    return check(root) !== -1;
}`,
            },
        ],
        followUps: [
            'Why is the naive height-at-every-node version O(n^2)? Which tree shape is worst?',
            'Rewrite it with an outer boolean flag instead of the -1 sentinel.',
        ],
    },

    'binary-tree-level-order-traversal': {
        restate: 'Return the node values level by level, each level as its own list.',
        body: `The first problem here that wants **BFS**, and the reason is worth naming: a single DFS call cannot see what level it is on relative to its siblings. Levels are a breadth concept.

**The observation:** a queue naturally visits nodes in level order — but a plain BFS gives you one flat stream with no idea where one level ends. The fix is one line:

**Capture the queue's size before draining it.** At the top of each outer iteration, \`size = queue.size()\` is exactly the number of nodes on the current level, because every node from the previous level has already been popped and all their children pushed. Process exactly that many, collecting them into one list, and whatever was pushed meanwhile is the next level.

That level-size snapshot is the whole technique, and it reappears in Right Side View, Zigzag, and Minimum Depth.

**The trap:** read the size into a variable *before* the inner loop. Writing \`for (int i = 0; i < queue.size(); i++)\` re-evaluates the size after every push, so the loop runs over nodes from the next level too and every level after the first is wrong.

**Two smaller ones:** handle an empty root before the loop, and only push non-null children — pushing nulls means checking for them on pop and produces phantom entries.`,
        complexity: { time: 'O(n)', space: 'O(n) — the widest level' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    vector<vector<int>> levelOrder(TreeNode* root) {
        vector<vector<int>> out;
        if (!root) return out;

        queue<TreeNode*> q;
        q.push(root);
        while (!q.empty()) {
            int size = q.size();      // SNAPSHOT before draining
            vector<int> level;
            for (int i = 0; i < size; i++) {
                TreeNode* node = q.front(); q.pop();
                level.push_back(node->val);
                if (node->left) q.push(node->left);
                if (node->right) q.push(node->right);
            }
            out.push_back(level);
        }
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> out = new ArrayList<>();
        if (root == null) return out;

        Queue<TreeNode> q = new LinkedList<>();
        q.add(root);
        while (!q.isEmpty()) {
            int size = q.size();
            List<Integer> level = new ArrayList<>();
            for (int i = 0; i < size; i++) {
                TreeNode node = q.poll();
                level.add(node.val);
                if (node.left != null) q.add(node.left);
                if (node.right != null) q.add(node.right);
            }
            out.add(level);
        }
        return out;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function levelOrder(root) {
    const out = [];
    if (!root) return out;

    let queue = [root];
    while (queue.length) {
        const level = [];
        const next = [];
        for (const node of queue) {      // the whole current level
            level.push(node.val);
            if (node.left) next.push(node.left);
            if (node.right) next.push(node.right);
        }
        out.push(level);
        queue = next;                    // swap in the next level wholesale
    }
    return out;
}`,
            },
        ],
        followUps: [
            'What goes wrong if you call queue.size() inside the loop condition?',
            'Zigzag level order (Leetcode 103) — reverse alternate levels.',
            'Do it with DFS by passing the depth down. Which reads better?',
        ],
    },

    'binary-tree-right-side-view': {
        restate:
            'Standing to the right of the tree, which nodes can you see? One per level.',
        body: `Level order with one change, which is why it comes straight after it.

**The observation:** the node you see from the right is the **last node of each level**. So run the same BFS with the same size snapshot, and take the final node of each level instead of collecting them all.

Equivalently, take the first node of each level and you have Left Side View — the problem is symmetric, and saying so shows you understand the structure rather than the phrasing.

**The DFS alternative, which is the neater answer:** traverse **root → right → left**, carrying the depth. The first node you reach at any depth is by construction the rightmost one, so record a value whenever \`depth == result.size()\`. That single condition replaces all the level bookkeeping.

Both are \`O(n)\`. The DFS version is shorter and uses \`O(h)\` space instead of \`O(width)\`; the BFS version is easier to explain. Have both.

**The trap that produces a plausible wrong answer:** "rightmost" is not "follow the right child all the way down". If the right subtree is shorter than the left, the visible node at the deeper levels comes from the *left* subtree. A tree like root → left → left with no right child at all still has a right-side view of three nodes. Testing only on balanced trees hides this completely.`,
        complexity: { time: 'O(n)', space: 'O(h) DFS — O(width) BFS' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    vector<int> out;
    // root -> RIGHT -> left: the first node seen at a depth is the rightmost.
    void dfs(TreeNode* node, int depth) {
        if (!node) return;
        if (depth == (int)out.size()) out.push_back(node->val);
        dfs(node->right, depth + 1);
        dfs(node->left, depth + 1);   // still needed: it may go deeper
    }
public:
    vector<int> rightSideView(TreeNode* root) {
        out.clear();
        dfs(root, 0);
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private final List<Integer> out = new ArrayList<>();

    private void dfs(TreeNode node, int depth) {
        if (node == null) return;
        if (depth == out.size()) out.add(node.val);
        dfs(node.right, depth + 1);
        dfs(node.left, depth + 1);
    }

    public List<Integer> rightSideView(TreeNode root) {
        out.clear();
        dfs(root, 0);
        return out;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function rightSideView(root) {
    const out = [];

    const dfs = (node, depth) => {
        if (!node) return;
        if (depth === out.length) out.push(node.val);
        dfs(node.right, depth + 1);
        dfs(node.left, depth + 1);
    };

    dfs(root, 0);
    return out;
}`,
            },
        ],
        followUps: [
            'Why is the left subtree still visited? Give a tree where it supplies the answer.',
            'Write the BFS version, taking the last node of each level.',
            'Left side view — what changes?',
        ],
    },

    'count-good-nodes-in-binary-tree': {
        restate:
            'A node is good if nothing on the path from the root to it is strictly larger. Count them.',
        body: `Shape 3: information flows **down**, not up.

**The observation:** whether a node is good depends entirely on its ancestors, and a node cannot see its ancestors. But the recursion can *carry* what it needs — so pass the maximum seen so far on the path down as a parameter.

At each node: it is good if \`node.val >= maxSoFar\`. Then recurse into both children with \`max(maxSoFar, node.val)\`.

Contrast that with Diameter, where the useful information flowed *upward* as a return value. Recognising which direction a problem needs is exactly the skill this section is drilling, and this is the cleanest downward example.

**Two traps.**

**Use \`>=\`, not \`>\`.** "No node with a **greater** value" means equal values are still good. With \`>\`, a tree of identical values counts only the root, and that is a single-character bug with no visible symptom on varied inputs.

**Seed with the root's value**, or with negative infinity — not zero. Values go down to \`-10⁴\`, so a zero seed marks every negative node bad. The root is always good by definition, which makes seeding with \`root.val\` both correct and self-documenting.

The path maximum is passed by value, so each branch gets its own copy automatically — there is nothing to undo on the way back up, unlike a backtracking problem.`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    int dfs(TreeNode* node, int maxSoFar) {
        if (!node) return 0;
        // >= : equal values are still good.
        int count = (node->val >= maxSoFar) ? 1 : 0;
        int nextMax = max(maxSoFar, node->val);
        count += dfs(node->left, nextMax);
        count += dfs(node->right, nextMax);
        return count;
    }
public:
    int goodNodes(TreeNode* root) {
        return dfs(root, root->val);   // the root is always good
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private int dfs(TreeNode node, int maxSoFar) {
        if (node == null) return 0;
        int count = (node.val >= maxSoFar) ? 1 : 0;
        int nextMax = Math.max(maxSoFar, node.val);
        return count + dfs(node.left, nextMax) + dfs(node.right, nextMax);
    }

    public int goodNodes(TreeNode root) {
        return dfs(root, root.val);
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function goodNodes(root) {
    const dfs = (node, maxSoFar) => {
        if (!node) return 0;
        const count = node.val >= maxSoFar ? 1 : 0;
        const nextMax = Math.max(maxSoFar, node.val);
        return count + dfs(node.left, nextMax) + dfs(node.right, nextMax);
    };
    return dfs(root, root.val);
}`,
            },
        ],
        followUps: [
            'What does a tree of all-equal values return if you use > instead of >=?',
            'Why seed with root.val rather than 0?',
            'Count nodes that are the MINIMUM on their root path instead.',
        ],
    },

    'lowest-common-ancestor-bst': {
        restate:
            'The deepest node that has both p and q as descendants. The tree is a BST.',
        body: `The general LCA (Leetcode 236) needs a full traversal. This is a **BST**, and that one word makes it far easier — recognising why is the point.

**The observation:** BST ordering tells you which way both targets lie without looking at them.

- Both values **less** than the current node → both are in the left subtree. Go left.
- Both values **greater** → go right.
- Otherwise they **split** — one on each side, or one *is* the current node — and this node is the lowest common ancestor. Return it.

That split is the answer, and it needs no comparison of subtree contents at all: the first node where the paths to \`p\` and \`q\` diverge is by definition their lowest common ancestor.

Because you only ever descend, this is **iterative in three lines and \`O(1)\` space** — no recursion, no stack. Give that version.

**The trap:** the "one of them IS this node" case. If \`p\` equals the current node and \`q\` is below it, the answer is the current node — a node counts as a descendant of itself, per the problem. Using strict \`<\` and \`>\` for the two descend branches gets this right automatically, because equality falls through to the return. Writing \`<=\` sends you past the answer.

Complexity is \`O(h)\` — \`O(log n)\` on a balanced tree, \`O(n)\` on a degenerate one.`,
        complexity: { time: 'O(h)', space: 'O(1) iterative' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
        TreeNode* cur = root;
        while (cur) {
            if (p->val < cur->val && q->val < cur->val)      cur = cur->left;
            else if (p->val > cur->val && q->val > cur->val) cur = cur->right;
            else return cur;    // they split here — or one IS cur
        }
        return nullptr;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        TreeNode cur = root;
        while (cur != null) {
            if (p.val < cur.val && q.val < cur.val)      cur = cur.left;
            else if (p.val > cur.val && q.val > cur.val) cur = cur.right;
            else return cur;
        }
        return null;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function lowestCommonAncestor(root, p, q) {
    let cur = root;
    while (cur) {
        if (p.val < cur.val && q.val < cur.val) cur = cur.left;
        else if (p.val > cur.val && q.val > cur.val) cur = cur.right;
        else return cur;
    }
    return null;
}`,
            },
        ],
        followUps: [
            'Solve LCA for a GENERAL binary tree (Leetcode 236). Why is it harder?',
            'What happens with <= instead of < in the descend conditions?',
        ],
    },

    'validate-binary-search-tree': {
        restate:
            'Is every node greater than everything in its left subtree and less than everything in its right?',
        body: `The classic wrong answer is worth writing out, because most people give it first: check \`left.val < node.val < right.val\` at every node.

**Why that fails:** it is a *local* check for a *global* property. Consider root 5, left child 1, and that node's right child 6. Every parent–child pair looks fine, but 6 sits in the left subtree of 5 and must be less than 5. The tree is invalid and the local check passes.

**The observation:** every node is constrained by a **range**, not by its parent. Descending left tightens the upper bound to the current value; descending right tightens the lower bound. So pass \`(min, max)\` down — shape 3 — and check \`min < node.val < max\`.

The root starts with an unbounded range, which is what \`±∞\` is for.

**Two traps.**

**Use long/±infinity for the bounds**, not \`INT_MIN\`/\`INT_MAX\`. Node values can be exactly \`INT_MIN\`, and comparing it against a bound of \`INT_MIN\` with strict \`<\` rejects a perfectly valid tree. In C++/Java use \`long\`; in JS \`±Infinity\` is free.

**Strict inequalities.** LeetCode's definition disallows duplicates entirely, so \`<=\` accepts invalid trees.

**The alternative worth knowing:** an in-order traversal of a BST is strictly increasing. So walk in-order tracking only the previous value and check it always increases. Same \`O(n)\`, no bounds to thread — and it is the idea the next problem is built on.`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    // long, not int: a node value can BE INT_MIN.
    bool valid(TreeNode* node, long low, long high) {
        if (!node) return true;
        if (node->val <= low || node->val >= high) return false;   // strict
        return valid(node->left, low, node->val)
            && valid(node->right, node->val, high);
    }
public:
    bool isValidBST(TreeNode* root) {
        return valid(root, LONG_MIN, LONG_MAX);
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private boolean valid(TreeNode node, long low, long high) {
        if (node == null) return true;
        if (node.val <= low || node.val >= high) return false;
        return valid(node.left, low, node.val)
            && valid(node.right, node.val, high);
    }

    public boolean isValidBST(TreeNode root) {
        return valid(root, Long.MIN_VALUE, Long.MAX_VALUE);
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function isValidBST(root) {
    const valid = (node, low, high) => {
        if (!node) return true;
        if (node.val <= low || node.val >= high) return false;
        return valid(node.left, low, node.val)
            && valid(node.right, node.val, high);
    };
    return valid(root, -Infinity, Infinity);
}`,
            },
        ],
        followUps: [
            'Draw the 5 / 1 / 6 counter-example that defeats the parent-child check.',
            'Solve it with an in-order traversal instead, tracking only the previous value.',
            'Why must the bounds be long rather than int?',
        ],
    },

    'kth-smallest-element-in-a-bst': {
        restate: 'The kth smallest value in a BST, 1-indexed.',
        body: `**The observation, and it is the only one you need:** an in-order traversal of a BST visits values in sorted order. So the kth smallest is simply the kth node in-order.

That reduces the problem to "stop an in-order traversal after k nodes".

**Do not collect the whole list.** Traversing everything into an array and indexing works and is \`O(n)\` time and space, but it does more work than asked. Count as you go and stop at \`k\` — best case you touch only the leftmost \`k\` nodes.

**The iterative version is the one to write**, because early exit is natural: push all the way down the left spine, pop, count, then move to the right child and repeat. When the counter reaches \`k\`, return immediately. Recursive early exit needs an exception or a sentinel and reads worse.

**Two traps.**

**k is 1-indexed.** Return when the counter reaches \`k\` *after* incrementing, not when it equals \`k - 1\`.

**Order matters: left, node, right.** Pre-order or post-order are not sorted, and on small test trees they can accidentally agree with in-order — so a wrong traversal order can pass your first two examples.

**The follow-up interviewers actually ask:** if the BST is modified often and you need kth-smallest frequently, augment each node with its subtree size. Then the query is \`O(h)\` instead of \`O(k)\`, at the cost of maintaining the counts on insert and delete. Naming that trade is usually the real point of the question.`,
        complexity: { time: 'O(h + k)', space: 'O(h)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int kthSmallest(TreeNode* root, int k) {
        vector<TreeNode*> stack;
        TreeNode* cur = root;

        while (cur || !stack.empty()) {
            while (cur) { stack.push_back(cur); cur = cur->left; }  // left spine
            cur = stack.back(); stack.pop_back();
            if (--k == 0) return cur->val;    // k is 1-indexed
            cur = cur->right;
        }
        return -1;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int kthSmallest(TreeNode root, int k) {
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode cur = root;

        while (cur != null || !stack.isEmpty()) {
            while (cur != null) { stack.push(cur); cur = cur.left; }
            cur = stack.pop();
            if (--k == 0) return cur.val;
            cur = cur.right;
        }
        return -1;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function kthSmallest(root, k) {
    const stack = [];
    let cur = root;

    while (cur || stack.length) {
        while (cur) { stack.push(cur); cur = cur.left; }
        cur = stack.pop();
        if (--k === 0) return cur.val;
        cur = cur.right;
    }
    return -1;
}`,
            },
        ],
        followUps: [
            'How would you support frequent modifications? (Augment nodes with subtree sizes.)',
            'kth LARGEST — what is the one change?',
            'Why does the early exit matter if the complexity is still O(n) in the worst case?',
        ],
    },

    'construct-tree-preorder-inorder': {
        restate: 'Rebuild the tree from its preorder and inorder traversals. Values are unique.',
        body: `Two traversals, and neither alone determines a tree. Together they do, and seeing *why* is the solution.

**The observation, in two halves:**

- **Preorder** visits root first. So \`preorder[0]\` is the root — always, at every level.
- **Inorder** visits left subtree, root, right subtree. So once you know the root's value, finding it in the inorder array splits that array into exactly the left subtree's nodes and the right subtree's nodes.

That split gives you the **sizes** of both subtrees, which is what lets you slice the preorder array too: after the root, the next \`leftSize\` entries are the left subtree, and the rest are the right.

Recurse on the two halves. Base case: an empty range means a null child.

**The trap that makes it \`O(n²)\`:** searching the inorder array linearly for the root at every call. Build a **value → index hash map once** up front and the lookup is \`O(1)\`, taking the whole thing to \`O(n)\`. This is the entire difference between a good and a mediocre answer here, and it is why the problem says values are unique — that guarantee is what makes the map well-defined.

**The other trap is index arithmetic.** Pass explicit ranges rather than slicing arrays: slicing is \`O(n)\` per call and quietly restores the quadratic behaviour you just removed. Work out \`leftSize = rootIndex - inStart\` once, on paper, and derive every other bound from it.

**Preorder + postorder does NOT determine a tree** — say so if asked. Inorder is the one that identifies where the root splits the sequence.`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    unordered_map<int, int> pos;   // value -> index in inorder: O(1) lookup
    int preIdx = 0;

    TreeNode* build(vector<int>& preorder, int inStart, int inEnd) {
        if (inStart > inEnd) return nullptr;

        int rootVal = preorder[preIdx++];
        TreeNode* root = new TreeNode(rootVal);
        int mid = pos[rootVal];

        // LEFT first: preorder consumes the entire left subtree before the right.
        root->left  = build(preorder, inStart, mid - 1);
        root->right = build(preorder, mid + 1, inEnd);
        return root;
    }
public:
    TreeNode* buildTree(vector<int>& preorder, vector<int>& inorder) {
        for (int i = 0; i < (int)inorder.size(); i++) pos[inorder[i]] = i;
        preIdx = 0;
        return build(preorder, 0, inorder.size() - 1);
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private final Map<Integer, Integer> pos = new HashMap<>();
    private int preIdx = 0;

    private TreeNode build(int[] preorder, int inStart, int inEnd) {
        if (inStart > inEnd) return null;

        int rootVal = preorder[preIdx++];
        TreeNode root = new TreeNode(rootVal);
        int mid = pos.get(rootVal);

        root.left  = build(preorder, inStart, mid - 1);
        root.right = build(preorder, mid + 1, inEnd);
        return root;
    }

    public TreeNode buildTree(int[] preorder, int[] inorder) {
        for (int i = 0; i < inorder.length; i++) pos.put(inorder[i], i);
        preIdx = 0;
        return build(preorder, 0, inorder.length - 1);
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function buildTree(preorder, inorder) {
    const pos = new Map();
    inorder.forEach((v, i) => pos.set(v, i));

    let preIdx = 0;
    const build = (inStart, inEnd) => {
        if (inStart > inEnd) return null;

        const rootVal = preorder[preIdx++];
        const root = new TreeNode(rootVal);
        const mid = pos.get(rootVal);

        root.left = build(inStart, mid - 1);   // left BEFORE right
        root.right = build(mid + 1, inEnd);
        return root;
    };

    return build(0, inorder.length - 1);
}`,
            },
        ],
        followUps: [
            'Why must the left subtree be built before the right?',
            'Build from INORDER + POSTORDER instead (Leetcode 106).',
            'Why can preorder + postorder NOT determine a unique tree?',
        ],
    },

    'binary-tree-maximum-path-sum': {
        restate:
            'The largest sum along any path. A path is any connected sequence of nodes, need not touch the root, and bends at most once.',
        body: `Shape 2 at its hardest, and the pay-off for Diameter. Same manoeuvre, harder quantity.

**The two different values, and confusing them is the whole difficulty:**

- **What you RETURN to the parent:** the best sum of a path that starts at this node and goes *down one side only*. A parent can extend such a path — it cannot extend a path that has already bent.
- **What you TRACK as the answer:** the best path *through* this node, which may use both children: \`node.val + leftGain + rightGain\`. That path has bent here, so it can never be extended upward — which is exactly why it is recorded rather than returned.

Diameter was this with lengths. Here it is sums, and sums can be negative, which adds the second idea.

**Clamp negative gains to zero.** If a subtree's best downward path is negative, including it makes things worse — so treat its contribution as 0, meaning "do not extend into that subtree at all". \`max(0, gain)\` does it in one call and removes every special case about which children to include.

**Two traps.**

**Initialise the answer to negative infinity, not 0.** An all-negative tree has a negative answer (the least-bad single node), and a 0 seed reports 0 — a path must contain at least one node, so empty is not an option.

**Return one side only.** \`return node.val + max(left, right)\`, never \`left + right\`. Returning both is the bug that lets a parent build a path that visits the same node twice, and it produces answers that are too large on exactly the inputs where the bend matters.`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    int best;
    // RETURNS the best one-sided downward path; TRACKS the bent path in "best".
    int gain(TreeNode* node) {
        if (!node) return 0;
        int l = max(0, gain(node->left));    // negative gain: do not extend
        int r = max(0, gain(node->right));
        best = max(best, node->val + l + r); // path bends HERE — record it
        return node->val + max(l, r);        // ONE side only
    }
public:
    int maxPathSum(TreeNode* root) {
        best = INT_MIN;                      // an all-negative tree is negative
        gain(root);
        return best;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private int best;

    private int gain(TreeNode node) {
        if (node == null) return 0;
        int l = Math.max(0, gain(node.left));
        int r = Math.max(0, gain(node.right));
        best = Math.max(best, node.val + l + r);
        return node.val + Math.max(l, r);
    }

    public int maxPathSum(TreeNode root) {
        best = Integer.MIN_VALUE;
        gain(root);
        return best;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function maxPathSum(root) {
    let best = -Infinity;

    const gain = (node) => {
        if (!node) return 0;
        const l = Math.max(0, gain(node.left));
        const r = Math.max(0, gain(node.right));
        best = Math.max(best, node.val + l + r);
        return node.val + Math.max(l, r);
    };

    gain(root);
    return best;
}`,
            },
        ],
        followUps: [
            'Why return one side but record both?',
            'What does an all-negative tree return if best starts at 0?',
            'Return the path itself, not just its sum.',
        ],
    },

    'serialize-and-deserialize-binary-tree': {
        restate:
            'Encode a tree as a string and decode it back. Values may be negative and the tree is not a BST.',
        body: `A design problem: any encoding works as long as your own decoder can read it. The question is which one is easiest to get right.

**The observation:** the reason a plain preorder list is not enough is that it loses **shape** — several different trees share the same preorder. Record the nulls and the shape comes back for free, because now every node has exactly two children in the encoding and there is no ambiguity about where a subtree ends.

So: **preorder with null markers.** Serialise \`root, left, right\`, writing a sentinel such as \`#\` for null. Deserialise by reading tokens in the same order — the first token is the root, then recursively build left, then right. The decoder needs no lookahead and no index arithmetic; it consumes exactly what the encoder produced.

That symmetry is the point. Preorder is the natural choice precisely because the root comes first, which is the one thing the decoder needs before it can do anything else.

**Three traps, all of which produce a decoder that works on your examples and fails on the hidden tests:**

**Use a delimiter.** Without commas, \`1\` and \`2\` are indistinguishable from \`12\`. Multi-digit values are guaranteed by the constraints.

**Handle negatives.** Do not pick \`-\` as your null marker, and do not parse by "is this character a digit".

**Advance the read cursor by reference.** The decoder must share one position across all recursive calls; a per-call copy silently rebuilds the same subtree repeatedly.

**BFS with level markers is equally valid** and is what LeetCode's own display format uses. Mention it — then write the preorder version, which is about half the code.`,
        complexity: { time: 'O(n) both ways', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Codec {
    void build(TreeNode* node, string& out) {
        if (!node) { out += "#,"; return; }       // marker + delimiter
        out += to_string(node->val) + ",";
        build(node->left, out);
        build(node->right, out);
    }
    // pos is a REFERENCE: one cursor shared by every recursive call.
    TreeNode* parse(const vector<string>& tokens, int& pos) {
        if (tokens[pos] == "#") { pos++; return nullptr; }
        TreeNode* node = new TreeNode(stoi(tokens[pos++]));   // stoi handles "-5"
        node->left = parse(tokens, pos);
        node->right = parse(tokens, pos);
        return node;
    }
public:
    string serialize(TreeNode* root) {
        string out;
        build(root, out);
        return out;
    }

    TreeNode* deserialize(string data) {
        vector<string> tokens;
        string cur;
        for (char c : data) {
            if (c == ',') { tokens.push_back(cur); cur.clear(); }
            else cur += c;
        }
        int pos = 0;
        return parse(tokens, pos);
    }
};`,
            },
            {
                lang: 'java',
                source: `public class Codec {
    private void build(TreeNode node, StringBuilder out) {
        if (node == null) { out.append("#,"); return; }
        out.append(node.val).append(',');
        build(node.left, out);
        build(node.right, out);
    }

    // A Queue is the cleanest shared cursor in Java.
    private TreeNode parse(Queue<String> tokens) {
        String t = tokens.poll();
        if ("#".equals(t)) return null;
        TreeNode node = new TreeNode(Integer.parseInt(t));
        node.left = parse(tokens);
        node.right = parse(tokens);
        return node;
    }

    public String serialize(TreeNode root) {
        StringBuilder out = new StringBuilder();
        build(root, out);
        return out.toString();
    }

    public TreeNode deserialize(String data) {
        return parse(new LinkedList<>(Arrays.asList(data.split(","))));
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function serialize(root) {
    const out = [];
    const build = (node) => {
        if (!node) { out.push('#'); return; }
        out.push(String(node.val));
        build(node.left);
        build(node.right);
    };
    build(root);
    return out.join(',');
}

function deserialize(data) {
    const tokens = data.split(',');
    let pos = 0;                       // one cursor in the closure

    const parse = () => {
        const t = tokens[pos++];
        if (t === '#') return null;
        const node = new TreeNode(Number(t));   // Number handles "-5"
        node.left = parse();
        node.right = parse();
        return node;
    };

    return parse();
}`,
            },
        ],
        followUps: [
            'Why is preorder WITHOUT null markers not enough? Give two trees with the same preorder.',
            'What breaks if the read cursor is passed by value?',
            'Serialise a BST more compactly (Leetcode 449) — what does the BST property buy you?',
        ],
    },
};
