// lib/dsa/approaches/tries.ts
//
// "Our approach" pages for the Tries section.
//
// Same four beats as every other approach file (brute force → why it is too
// slow → the observation → the trap); see approaches/arrays-hashing.ts for the
// house style in full.
//
// THREE PROBLEMS, ONE ARC. Build the structure, make it search with wildcards,
// then use it to prune a search that would otherwise be hopeless. The third
// problem is the reason the first two are on the sheet: a trie's real value is
// not lookup — a hash set does lookup — it is that a trie can answer
// "is ANY word still reachable down this path?" in O(1), which is what turns an
// exponential board search into a feasible one.
//
// THE ONE DESIGN DECISION worth stating up front: children as a fixed array of
// 26 or as a hash map. The array is faster and has no hashing overhead, but
// costs 26 pointers per node whether or not they are used. The map is compact
// for sparse alphabets and required the moment input is not lowercase a-z.
// These pages use the map form, because it generalises and because the code
// reads the same in all three languages — but say the trade in an interview.

import type { DsaApproach } from '../types';

export const triesApproaches: Record<string, DsaApproach> = {
    'implement-trie': {
        restate: 'Build a prefix tree supporting insert, exact search, and startsWith.',
        body: `A hash set of words answers \`search\` in \`O(1)\` and cannot answer \`startsWith\` without scanning every word. That gap is the reason tries exist.

**The observation:** store the words *by character*, one node per character, sharing prefixes. Then a prefix query is just a walk down from the root — it costs \`O(length of prefix)\` regardless of how many words are stored.

Each node needs two things: a map from character to child, and a boolean \`isEnd\`.

**\`isEnd\` is the entire difference between \`search\` and \`startsWith\`**, and it is what the problem is really testing. Both walk the same path; \`search\` additionally requires that the final node is marked as a word ending. Without the flag, inserting "apple" would make \`search("app")\` return true, because the path exists.

So:
- \`insert\` — walk, creating missing children, and mark the last node \`isEnd = true\`.
- \`search\` — walk; return \`node != null && node.isEnd\`.
- \`startsWith\` — walk; return \`node != null\`.

Factoring the walk into one private helper that returns the final node (or null) makes all three functions two lines each, and removes the duplication that is otherwise where a divergence bug hides.

**The trap:** a node that is \`isEnd\` may still have children ("app" and "apple" coexist), and a node that is *not* \`isEnd\` is still a valid prefix. The flag says nothing about the subtree either way.`,
        complexity: { time: 'O(L) per operation, L = word length', space: 'O(total characters)' },
        code: [
            {
                lang: 'cpp',
                source: `class Trie {
    struct Node {
        unordered_map<char, Node*> kids;
        bool isEnd = false;
    };
    Node* root;

    // One walk, shared by all three operations.
    Node* walk(const string& s) {
        Node* cur = root;
        for (char c : s) {
            auto it = cur->kids.find(c);
            if (it == cur->kids.end()) return nullptr;
            cur = it->second;
        }
        return cur;
    }
public:
    Trie() { root = new Node(); }

    void insert(string word) {
        Node* cur = root;
        for (char c : word) {
            if (!cur->kids.count(c)) cur->kids[c] = new Node();
            cur = cur->kids[c];
        }
        cur->isEnd = true;          // the ONLY thing separating search from startsWith
    }

    bool search(string word) {
        Node* n = walk(word);
        return n && n->isEnd;
    }

    bool startsWith(string prefix) {
        return walk(prefix) != nullptr;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Trie {
    private static class Node {
        Map<Character, Node> kids = new HashMap<>();
        boolean isEnd = false;
    }

    private final Node root = new Node();

    private Node walk(String s) {
        Node cur = root;
        for (char c : s.toCharArray()) {
            cur = cur.kids.get(c);
            if (cur == null) return null;
        }
        return cur;
    }

    public void insert(String word) {
        Node cur = root;
        for (char c : word.toCharArray()) {
            cur = cur.kids.computeIfAbsent(c, k -> new Node());
        }
        cur.isEnd = true;
    }

    public boolean search(String word) {
        Node n = walk(word);
        return n != null && n.isEnd;
    }

    public boolean startsWith(String prefix) {
        return walk(prefix) != null;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `class Trie {
    constructor() {
        this.root = { kids: new Map(), isEnd: false };
    }

    #walk(s) {
        let cur = this.root;
        for (const c of s) {
            if (!cur.kids.has(c)) return null;
            cur = cur.kids.get(c);
        }
        return cur;
    }

    insert(word) {
        let cur = this.root;
        for (const c of word) {
            if (!cur.kids.has(c)) cur.kids.set(c, { kids: new Map(), isEnd: false });
            cur = cur.kids.get(c);
        }
        cur.isEnd = true;
    }

    search(word) {
        const n = this.#walk(word);
        return n !== null && n.isEnd;
    }

    startsWith(prefix) {
        return this.#walk(prefix) !== null;
    }
}`,
            },
        ],
        followUps: [
            'Add delete. What makes it harder than insert? (You may only prune nodes with no other words below.)',
            'Switch children to a fixed int[26]. What do you gain and lose?',
            'Return every word with a given prefix — the autocomplete use case.',
        ],
    },

    'design-add-and-search-words': {
        restate:
            'Like a trie, but search may contain `.` which matches any single character.',
        body: `The previous problem with one addition, and the addition changes the shape of the search from a walk into a **search tree**.

**The observation:** without wildcards, every character has exactly one child to follow, so the walk is a loop. A \`.\` has *up to 26* children to follow, and you cannot know which is right without trying — so the search becomes recursive DFS with backtracking. Any branch succeeding means the whole search succeeds.

The recursion carries the current node and the index into the pattern:

- **Normal character** — follow that one child, or fail immediately if it is absent.
- **\`.\`** — try every child; return true if any recursive call succeeds.
- **End of pattern** — return \`node.isEnd\`, not \`true\`. Same distinction as before: reaching the end of a path is not the same as having stored a word there.

**The trap in the wildcard branch:** it must return true if *any* child succeeds, not the result of the first one tried. Writing \`return dfs(child, i + 1)\` inside the loop returns on the first child regardless of outcome, and the search silently gives up after one branch. Loop, test, and only return false after every child has failed.

**Complexity is worth stating honestly.** A pattern of all dots explores everything: \`O(26^L)\` in the worst case, though in practice the trie's shape prunes hard because most branches do not exist. Insert stays \`O(L)\`.

Recursion depth is bounded by the word length, which the constraints cap at 25 — so no stack concerns.`,
        complexity: { time: 'O(L) insert, O(26^L) worst-case search', space: 'O(total characters)' },
        code: [
            {
                lang: 'cpp',
                source: `class WordDictionary {
    struct Node {
        unordered_map<char, Node*> kids;
        bool isEnd = false;
    };
    Node* root;

    bool dfs(Node* node, const string& w, int i) {
        if (i == (int)w.size()) return node->isEnd;   // isEnd, not true

        if (w[i] != '.') {
            auto it = node->kids.find(w[i]);
            return it != node->kids.end() && dfs(it->second, w, i + 1);
        }
        // Wildcard: ANY child succeeding is enough. Do not return inside the loop.
        for (auto& [c, child] : node->kids) {
            if (dfs(child, w, i + 1)) return true;
        }
        return false;
    }
public:
    WordDictionary() { root = new Node(); }

    void addWord(string word) {
        Node* cur = root;
        for (char c : word) {
            if (!cur->kids.count(c)) cur->kids[c] = new Node();
            cur = cur->kids[c];
        }
        cur->isEnd = true;
    }

    bool search(string word) { return dfs(root, word, 0); }
};`,
            },
            {
                lang: 'java',
                source: `class WordDictionary {
    private static class Node {
        Map<Character, Node> kids = new HashMap<>();
        boolean isEnd = false;
    }

    private final Node root = new Node();

    private boolean dfs(Node node, String w, int i) {
        if (i == w.length()) return node.isEnd;

        char c = w.charAt(i);
        if (c != '.') {
            Node child = node.kids.get(c);
            return child != null && dfs(child, w, i + 1);
        }
        for (Node child : node.kids.values()) {
            if (dfs(child, w, i + 1)) return true;
        }
        return false;
    }

    public void addWord(String word) {
        Node cur = root;
        for (char c : word.toCharArray()) {
            cur = cur.kids.computeIfAbsent(c, k -> new Node());
        }
        cur.isEnd = true;
    }

    public boolean search(String word) { return dfs(root, word, 0); }
}`,
            },
            {
                lang: 'javascript',
                source: `class WordDictionary {
    constructor() {
        this.root = { kids: new Map(), isEnd: false };
    }

    addWord(word) {
        let cur = this.root;
        for (const c of word) {
            if (!cur.kids.has(c)) cur.kids.set(c, { kids: new Map(), isEnd: false });
            cur = cur.kids.get(c);
        }
        cur.isEnd = true;
    }

    search(word) {
        const dfs = (node, i) => {
            if (i === word.length) return node.isEnd;

            const c = word[i];
            if (c !== '.') {
                const child = node.kids.get(c);
                return child !== undefined && dfs(child, i + 1);
            }
            for (const child of node.kids.values()) {
                if (dfs(child, i + 1)) return true;   // any branch is enough
            }
            return false;
        };
        return dfs(this.root, 0);
    }
}`,
            },
        ],
        followUps: [
            'What happens if the wildcard branch returns inside the loop rather than only on success?',
            'Support "*" matching zero or more characters. Why is that much harder?',
            'Why is the worst case 26^L, and why is it rarely reached?',
        ],
    },

    'word-search-ii': {
        restate:
            'Find every word from a dictionary that can be spelled by walking adjacent cells on a board, without reusing a cell in one word.',
        body: `The problem the whole section exists for.

**Why the obvious approach dies:** run Word Search (Leetcode 79) once per word. With up to 3·10⁴ words and a 12×12 board, that is 30,000 independent exponential searches over the same grid — and almost all of them fail in the first two characters, having re-walked the same cells for each word.

**The observation:** the words share prefixes, so search for **all of them at once**. Put the dictionary in a trie, then DFS from each cell walking the board and the trie *in lockstep*. The trie answers, in \`O(1)\` at every step, the question that makes this tractable: *is any word still reachable down this path?* If the current character has no child in the trie, no word starts this way — abandon the branch immediately.

That is the difference between checking one word at a time and pruning every word at once.

**Three details that matter more than the DFS:**

**Store the word on the terminal node**, rather than a bare \`isEnd\`. When you reach it, you have the whole word for free with no string building on the way down.

**Deduplicate by null-ing the word after collecting it.** The same word may be reachable by several paths; clearing the terminal marker means it is collected exactly once, with no result set to check.

**Mark cells visited by mutating the board and restoring on the way out** — a classic backtracking swap. Write a sentinel like \`#\` into the cell before recursing and put the character back after. That enforces "no cell reused within one word" with no extra visited array.

**The optimisation worth naming:** prune the trie as you go. After a leaf's word is collected, if the node has no children it can be removed from its parent, shrinking the search for the rest of the board. On adversarial inputs this is the difference between passing and timing out.`,
        complexity: { time: 'O(cells · 4^L)', space: 'O(total dictionary characters)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    struct Node {
        unordered_map<char, Node*> kids;
        string word;              // the WORD itself, not a bool
    };

    void dfs(vector<vector<char>>& b, int r, int c, Node* node, vector<string>& out) {
        if (r < 0 || c < 0 || r >= (int)b.size() || c >= (int)b[0].size()) return;
        char ch = b[r][c];
        if (ch == '#') return;                       // already used in THIS word

        auto it = node->kids.find(ch);
        if (it == node->kids.end()) return;          // no word goes this way — prune
        Node* next = it->second;

        if (!next->word.empty()) {
            out.push_back(next->word);
            next->word.clear();                      // dedupe: collect once
        }

        b[r][c] = '#';                               // mark
        dfs(b, r + 1, c, next, out);
        dfs(b, r - 1, c, next, out);
        dfs(b, r, c + 1, next, out);
        dfs(b, r, c - 1, next, out);
        b[r][c] = ch;                                // restore
    }
public:
    vector<string> findWords(vector<vector<char>>& board, vector<string>& words) {
        Node* root = new Node();
        for (const string& w : words) {
            Node* cur = root;
            for (char c : w) {
                if (!cur->kids.count(c)) cur->kids[c] = new Node();
                cur = cur->kids[c];
            }
            cur->word = w;
        }

        vector<string> out;
        for (int r = 0; r < (int)board.size(); r++)
            for (int c = 0; c < (int)board[0].size(); c++)
                dfs(board, r, c, root, out);
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private static class Node {
        Map<Character, Node> kids = new HashMap<>();
        String word = null;
    }

    private void dfs(char[][] b, int r, int c, Node node, List<String> out) {
        if (r < 0 || c < 0 || r >= b.length || c >= b[0].length) return;
        char ch = b[r][c];
        if (ch == '#') return;

        Node next = node.kids.get(ch);
        if (next == null) return;

        if (next.word != null) {
            out.add(next.word);
            next.word = null;
        }

        b[r][c] = '#';
        dfs(b, r + 1, c, next, out);
        dfs(b, r - 1, c, next, out);
        dfs(b, r, c + 1, next, out);
        dfs(b, r, c - 1, next, out);
        b[r][c] = ch;
    }

    public List<String> findWords(char[][] board, String[] words) {
        Node root = new Node();
        for (String w : words) {
            Node cur = root;
            for (char c : w.toCharArray()) {
                cur = cur.kids.computeIfAbsent(c, k -> new Node());
            }
            cur.word = w;
        }

        List<String> out = new ArrayList<>();
        for (int r = 0; r < board.length; r++)
            for (int c = 0; c < board[0].length; c++)
                dfs(board, r, c, root, out);
        return out;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function findWords(board, words) {
    const root = { kids: new Map(), word: null };
    for (const w of words) {
        let cur = root;
        for (const c of w) {
            if (!cur.kids.has(c)) cur.kids.set(c, { kids: new Map(), word: null });
            cur = cur.kids.get(c);
        }
        cur.word = w;
    }

    const out = [];
    const rows = board.length, cols = board[0].length;

    const dfs = (r, c, node) => {
        if (r < 0 || c < 0 || r >= rows || c >= cols) return;
        const ch = board[r][c];
        if (ch === '#') return;

        const next = node.kids.get(ch);
        if (!next) return;              // prune: no word continues this way

        if (next.word !== null) {
            out.push(next.word);
            next.word = null;           // collect each word once
        }

        board[r][c] = '#';
        dfs(r + 1, c, next);
        dfs(r - 1, c, next);
        dfs(r, c + 1, next);
        dfs(r, c - 1, next);
        board[r][c] = ch;
    };

    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) dfs(r, c, root);
    return out;
}`,
            },
        ],
        followUps: [
            'Why is one Word Search per word too slow? Be specific about the repeated work.',
            'Implement the trie pruning optimisation. When does it matter most?',
            'What if a cell COULD be reused within a word — does the trie still help?',
        ],
    },
};
