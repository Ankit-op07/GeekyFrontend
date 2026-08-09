// lib/dsa/approaches/graphs.ts
//
// "Our approach" pages for the Graphs section.
//
// Same four beats as every other approach file (brute force → why it is too
// slow → the observation → the trap); see approaches/arrays-hashing.ts for the
// house style in full.
//
// PICKING THE TRAVERSAL IS THE WHOLE SKILL, and there are only six answers.
// Stated once here so the pages can point at the table instead of rebuilding it:
//
//   DFS               — connectivity, "how many components", "how big is this
//                       blob". Islands, Max Area, Surrounded Regions.
//   BFS               — FEWEST STEPS on an unweighted graph. Never use DFS for a
//                       shortest path; DFS finds *a* path, BFS finds the short
//                       one. Rotting Oranges, Word Ladder.
//   Multi-source BFS  — many starting points at once. Push them all before the
//                       loop begins; the frontier expands from all of them
//                       simultaneously. Rotting Oranges.
//   Topological sort  — ordering with prerequisites, and cycle detection falls
//                       out for free. Course Schedule I and II.
//   Union-Find        — merging sets, "were these already connected?".
//                       Redundant Connection, and Kruskal for MSTs.
//   Dijkstra          — cheapest path with WEIGHTS. Network Delay Time.
//                       Bellman-Ford when there is also a hop limit.
//
// TWO THINGS THAT ARE TRUE OF ALMOST EVERY PROBLEM HERE:
//
//   1. HALF OF THEM ARE GRIDS PRETENDING NOT TO BE GRAPHS. A cell is a node,
//      its four neighbours are its edges. Once you see that, "number of
//      islands" is a traversal that counts how many times it had to start over.
//   2. MARK VISITED WHEN YOU ENQUEUE, NOT WHEN YOU DEQUEUE. This is the single
//      most common graph bug. Marking on dequeue lets the same node get pushed
//      by several neighbours before any of them is processed, and the queue
//      blows up — quadratically on a dense grid.

import type { DsaApproach } from '../types';

export const graphsApproaches: Record<string, DsaApproach> = {
    'number-of-islands': {
        restate: 'Count the connected groups of land cells in a grid. Diagonals do not connect.',
        body: `The grid-is-a-graph problem, and the template for the four that follow.

**The observation:** an island is a *connected component*. Walk every cell; when you find unvisited land, that is a new island — increment the count, then flood the entire component so it is never counted again.

The flood is DFS or BFS; either works, because you are not looking for a shortest path, only for reachability.

**The trap that decides how this is graded: mark cells visited as you enqueue them, not as you dequeue them.** In BFS, a cell can be reached by up to four neighbours. If it is only marked when popped, all four push it first and the queue holds duplicates — on a large all-land grid the queue grows quadratically and the solution times out. Mark on push.

**Mutating vs a visited set.** Overwriting land with \`'0'\` as you flood is \`O(1)\` space and the shortest code. A separate visited grid keeps the input intact, which matters if the caller reuses it — say which you are doing and why.

**DFS depth is a real concern here.** A 300×300 all-land grid gives a recursion 90,000 frames deep, which overflows the stack in most languages. On large grids prefer iterative BFS. This is one of the few places where "recursive is cleaner" is genuinely the wrong call.

Every cell is visited once, so it is \`O(rows · cols)\`.`,
        complexity: { time: 'O(m · n)', space: 'O(min(m, n)) BFS queue — O(m · n) DFS stack' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        int rows = grid.size(), cols = grid[0].size(), count = 0;
        int dirs[5] = {0, 1, 0, -1, 0};   // pairs: (0,1) (1,0) (0,-1) (-1,0)

        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] != '1') continue;
                count++;

                queue<pair<int, int>> q;
                q.push({r, c});
                grid[r][c] = '0';          // mark ON PUSH, not on pop
                while (!q.empty()) {
                    auto [cr, cc] = q.front(); q.pop();
                    for (int d = 0; d < 4; d++) {
                        int nr = cr + dirs[d], nc = cc + dirs[d + 1];
                        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
                        if (grid[nr][nc] != '1') continue;
                        grid[nr][nc] = '0';
                        q.push({nr, nc});
                    }
                }
            }
        }
        return count;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int numIslands(char[][] grid) {
        int rows = grid.length, cols = grid[0].length, count = 0;
        int[] dirs = {0, 1, 0, -1, 0};

        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] != '1') continue;
                count++;

                Deque<int[]> q = new ArrayDeque<>();
                q.add(new int[]{r, c});
                grid[r][c] = '0';
                while (!q.isEmpty()) {
                    int[] cell = q.poll();
                    for (int d = 0; d < 4; d++) {
                        int nr = cell[0] + dirs[d], nc = cell[1] + dirs[d + 1];
                        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
                        if (grid[nr][nc] != '1') continue;
                        grid[nr][nc] = '0';
                        q.add(new int[]{nr, nc});
                    }
                }
            }
        }
        return count;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function numIslands(grid) {
    const rows = grid.length, cols = grid[0].length;
    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    let count = 0;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] !== '1') continue;
            count++;

            const q = [[r, c]];
            grid[r][c] = '0';           // mark on push
            for (let i = 0; i < q.length; i++) {
                const [cr, cc] = q[i];  // index instead of shift: shift is O(n)
                for (const [dr, dc] of dirs) {
                    const nr = cr + dr, nc = cc + dc;
                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
                    if (grid[nr][nc] !== '1') continue;
                    grid[nr][nc] = '0';
                    q.push([nr, nc]);
                }
            }
        }
    }
    return count;
}`,
            },
        ],
        followUps: [
            'What goes wrong if you mark visited on dequeue instead of on enqueue?',
            'A 300x300 all-land grid — why might recursive DFS fail?',
            'Number of Islands II: land is added one cell at a time. (Union-Find.)',
        ],
    },

    'max-area-of-island': {
        restate: 'The size of the largest connected group of land cells.',
        body: `Number of Islands with the flood **returning a count** instead of just marking.

**The observation:** the traversal already visits every cell of the component — so have it report how many it visited. In DFS that is naturally recursive:

\`\`\`
area(cell) = 1 + area(up) + area(down) + area(left) + area(right)
\`\`\`

with out-of-bounds and water returning 0. Take the max over every starting cell.

That base case doing double duty — bounds check *and* water check *and* visited check, all returning 0 — is what keeps this to a handful of lines. Handle all three at the top of the recursive call rather than before each of the four calls, or you write the same guard four times and get one of them wrong.

**The trap:** mark the cell visited **before** recursing into the neighbours. Otherwise the neighbour immediately recurses back into the cell you came from, and the two bounce until the stack overflows. In this problem the mark is setting the cell to 0, which is also why the returned area is not double-counted.

**Why DFS here when Islands suggested BFS:** the recursive sum is genuinely clearer than threading a counter through a BFS loop, and the constraint here is 50×50 — small enough that stack depth is not a risk. Choose per constraints, not per habit.

Every cell is still visited once: \`O(m · n)\`.`,
        complexity: { time: 'O(m · n)', space: 'O(m · n) worst-case recursion' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    int area(vector<vector<int>>& g, int r, int c) {
        // One guard doing all three jobs: bounds, water, already-visited.
        if (r < 0 || c < 0 || r >= (int)g.size() || c >= (int)g[0].size()) return 0;
        if (g[r][c] == 0) return 0;

        g[r][c] = 0;                 // mark BEFORE recursing, or it bounces back
        return 1 + area(g, r + 1, c) + area(g, r - 1, c)
                 + area(g, r, c + 1) + area(g, r, c - 1);
    }
public:
    int maxAreaOfIsland(vector<vector<int>>& grid) {
        int best = 0;
        for (int r = 0; r < (int)grid.size(); r++)
            for (int c = 0; c < (int)grid[0].size(); c++)
                best = max(best, area(grid, r, c));
        return best;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private int area(int[][] g, int r, int c) {
        if (r < 0 || c < 0 || r >= g.length || c >= g[0].length) return 0;
        if (g[r][c] == 0) return 0;

        g[r][c] = 0;
        return 1 + area(g, r + 1, c) + area(g, r - 1, c)
                 + area(g, r, c + 1) + area(g, r, c - 1);
    }

    public int maxAreaOfIsland(int[][] grid) {
        int best = 0;
        for (int r = 0; r < grid.length; r++)
            for (int c = 0; c < grid[0].length; c++)
                best = Math.max(best, area(grid, r, c));
        return best;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function maxAreaOfIsland(grid) {
    const rows = grid.length, cols = grid[0].length;

    const area = (r, c) => {
        if (r < 0 || c < 0 || r >= rows || c >= cols) return 0;
        if (grid[r][c] === 0) return 0;

        grid[r][c] = 0;
        return 1 + area(r + 1, c) + area(r - 1, c)
                 + area(r, c + 1) + area(r, c - 1);
    };

    let best = 0;
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
            best = Math.max(best, area(r, c));
    return best;
}`,
            },
        ],
        followUps: [
            'What happens if you mark the cell AFTER the recursive calls?',
            'Return the shape of the island, not just its size (Leetcode 694, distinct islands).',
            'Count islands and find the max area in one pass.',
        ],
    },

    'clone-graph': {
        restate: 'Deep-copy a connected undirected graph given one node.',
        body: `Copy List with Random Pointer, on a graph. The difficulty is the same and so is the fix.

**Why a naive DFS fails:** you copy a node, then recurse into its neighbours to copy them — but the graph has cycles, so a neighbour points back at a node you are still in the middle of copying. Recurse blindly and you loop forever, creating a new copy on each pass.

**The observation:** keep a map from **original node → its copy**, and check it *before* recursing. If a node is already in the map, return the existing copy instead of making another. That map is simultaneously the visited set and the identity mapping, which is why one structure solves both problems.

The order inside the recursion is what makes it correct:

1. If \`node\` is in the map, return \`map[node]\`.
2. Create the copy and **put it in the map immediately** — before touching any neighbour.
3. Then recurse into the neighbours, appending each returned copy.

**Step 2 is the whole solution.** Registering the copy before recursing means that when a cycle leads back here, step 1 finds it and returns rather than recursing again. Creating the copy, recursing, and *then* storing it is the version that hangs.

**Two edge cases:** a null input returns null, and a single node with no neighbours must still be copied. Both fall out if the null check comes first.

BFS with a queue works identically and avoids deep recursion; the map logic is unchanged.`,
        complexity: { time: 'O(V + E)', space: 'O(V)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    unordered_map<Node*, Node*> copies;
public:
    Node* cloneGraph(Node* node) {
        if (!node) return nullptr;

        auto it = copies.find(node);
        if (it != copies.end()) return it->second;   // 1. already copied

        Node* clone = new Node(node->val);
        copies[node] = clone;                        // 2. register BEFORE recursing

        for (Node* nb : node->neighbors) {           // 3. now safe against cycles
            clone->neighbors.push_back(cloneGraph(nb));
        }
        return clone;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private final Map<Node, Node> copies = new HashMap<>();

    public Node cloneGraph(Node node) {
        if (node == null) return null;
        if (copies.containsKey(node)) return copies.get(node);

        Node clone = new Node(node.val);
        copies.put(node, clone);

        for (Node nb : node.neighbors) {
            clone.neighbors.add(cloneGraph(nb));
        }
        return clone;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function cloneGraph(node) {
    const copies = new Map();

    const clone = (n) => {
        if (!n) return null;
        if (copies.has(n)) return copies.get(n);      // cycle guard

        const copy = new Node(n.val);
        copies.set(n, copy);                          // register FIRST

        for (const nb of n.neighbors) copy.neighbors.push(clone(nb));
        return copy;
    };

    return clone(node);
}`,
            },
        ],
        followUps: [
            'What happens if you register the copy after recursing instead of before?',
            'Write the BFS version. When would you prefer it?',
            'How does this differ from Copy List with Random Pointer?',
        ],
    },

    'rotting-oranges': {
        restate:
            'Rot spreads to adjacent fresh oranges each minute. How many minutes until none are fresh, or -1 if impossible?',
        body: `The **multi-source BFS** problem, and the technique is worth learning by name.

**The observation:** every rotten orange starts spreading at minute 0, simultaneously. So do not BFS from each one separately and combine — **push all of them into the queue before the loop starts**. The frontier then expands from all sources at once, and the number of levels processed is the answer.

That is the entire trick, and it generalises: any "shortest distance from the nearest of several sources" problem is one queue seeded with all the sources.

**Count the fresh oranges up front.** Decrement as each becomes rotten, and at the end \`fresh > 0\` means some were unreachable — return -1. That is far cleaner than re-scanning the grid afterwards, and it is how the impossible case gets detected.

**Process level by level**, using the queue-size snapshot from Binary Tree Level Order Traversal. Each level is one minute.

**The trap: a grid with no fresh oranges returns 0, not the number of levels.** If you increment the minute counter unconditionally per level, a grid that is already fully rotten reports 1. Guard by only counting a minute when the level actually rots something — or, equivalently, return 0 immediately when \`fresh == 0\`.

**The other trap:** mark on enqueue. Set the cell to rotten when you push it, not when you pop it, or the same orange is queued by several rotten neighbours.`,
        complexity: { time: 'O(m · n)', space: 'O(m · n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int orangesRotting(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size(), fresh = 0;
        queue<pair<int, int>> q;

        // Seed the queue with EVERY rotten orange: multi-source BFS.
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 2) q.push({r, c});
                else if (grid[r][c] == 1) fresh++;
            }

        if (fresh == 0) return 0;          // nothing to rot: 0, not 1

        int minutes = 0, dirs[5] = {0, 1, 0, -1, 0};
        while (!q.empty() && fresh > 0) {
            int size = q.size();           // one level = one minute
            minutes++;
            for (int i = 0; i < size; i++) {
                auto [r, c] = q.front(); q.pop();
                for (int d = 0; d < 4; d++) {
                    int nr = r + dirs[d], nc = c + dirs[d + 1];
                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
                    if (grid[nr][nc] != 1) continue;
                    grid[nr][nc] = 2;      // mark on ENQUEUE
                    fresh--;
                    q.push({nr, nc});
                }
            }
        }
        return fresh == 0 ? minutes : -1;  // leftovers were unreachable
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int orangesRotting(int[][] grid) {
        int rows = grid.length, cols = grid[0].length, fresh = 0;
        Deque<int[]> q = new ArrayDeque<>();

        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 2) q.add(new int[]{r, c});
                else if (grid[r][c] == 1) fresh++;
            }

        if (fresh == 0) return 0;

        int minutes = 0;
        int[] dirs = {0, 1, 0, -1, 0};
        while (!q.isEmpty() && fresh > 0) {
            int size = q.size();
            minutes++;
            for (int i = 0; i < size; i++) {
                int[] cell = q.poll();
                for (int d = 0; d < 4; d++) {
                    int nr = cell[0] + dirs[d], nc = cell[1] + dirs[d + 1];
                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
                    if (grid[nr][nc] != 1) continue;
                    grid[nr][nc] = 2;
                    fresh--;
                    q.add(new int[]{nr, nc});
                }
            }
        }
        return fresh == 0 ? minutes : -1;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function orangesRotting(grid) {
    const rows = grid.length, cols = grid[0].length;
    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    let q = [], fresh = 0;

    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 2) q.push([r, c]);
            else if (grid[r][c] === 1) fresh++;
        }

    if (fresh === 0) return 0;

    let minutes = 0;
    while (q.length && fresh > 0) {
        const next = [];
        minutes++;
        for (const [r, c] of q) {
            for (const [dr, dc] of dirs) {
                const nr = r + dr, nc = c + dc;
                if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
                if (grid[nr][nc] !== 1) continue;
                grid[nr][nc] = 2;
                fresh--;
                next.push([nr, nc]);
            }
        }
        q = next;
    }
    return fresh === 0 ? minutes : -1;
}`,
            },
        ],
        followUps: [
            'What does an already-fully-rotten grid return without the fresh === 0 guard?',
            'Why seed the queue with all sources rather than BFS from each separately?',
            'Walls and Gates — the same multi-source technique.',
        ],
    },

    'surrounded-regions': {
        restate:
            'Flip every region of `O` that is fully enclosed by `X`. Regions touching the border survive.',
        body: `The first **reverse-thinking** problem, and the idea generalises well beyond this puzzle.

**Why the direct approach is painful:** to decide whether a region is enclosed you must explore all of it and prove no cell touches the border — then go back and flip it. That is two passes per region with bookkeeping about which cells belonged to which region.

**The observation: solve the complement.** A region survives exactly when it touches the border. Border-connected regions are trivially easy to find — start from the border. So:

1. DFS/BFS from every \`O\` **on the border**, marking everything reachable with a temporary sentinel such as \`#\`.
2. Sweep the whole grid: every remaining \`O\` was unreachable from the border, so flip it to \`X\`. Every \`#\` was safe, so restore it to \`O\`.

No region tracking, no second thought about enclosure. You never ask "is this region enclosed?" — you ask the easy question instead and let the sweep handle the rest.

**The trap:** the temporary marker must be a *third* value. Marking safe cells as \`X\` loses the ability to distinguish them in the sweep, and marking them \`O\` does nothing. The two-value grid genuinely needs a third state during the algorithm.

**The other trap:** start from *all four* borders, and remember corners belong to two of them. Iterating only the first and last row misses vertical edges entirely — and the resulting bug only shows up on grids where a surviving region touches only a side.

This same "start from the outside" move solves Pacific Atlantic Water Flow, next.`,
        complexity: { time: 'O(m · n)', space: 'O(m · n) worst case' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    void mark(vector<vector<char>>& b, int r, int c) {
        if (r < 0 || c < 0 || r >= (int)b.size() || c >= (int)b[0].size()) return;
        if (b[r][c] != 'O') return;
        b[r][c] = '#';                     // a THIRD state, not 'X'
        mark(b, r + 1, c); mark(b, r - 1, c);
        mark(b, r, c + 1); mark(b, r, c - 1);
    }
public:
    void solve(vector<vector<char>>& board) {
        int rows = board.size(), cols = board[0].size();

        // 1. Everything reachable from ANY border cell is safe.
        for (int r = 0; r < rows; r++) { mark(board, r, 0); mark(board, r, cols - 1); }
        for (int c = 0; c < cols; c++) { mark(board, 0, c); mark(board, rows - 1, c); }

        // 2. Remaining O was enclosed; # was safe.
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++) {
                if (board[r][c] == 'O') board[r][c] = 'X';
                else if (board[r][c] == '#') board[r][c] = 'O';
            }
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private void mark(char[][] b, int r, int c) {
        if (r < 0 || c < 0 || r >= b.length || c >= b[0].length) return;
        if (b[r][c] != 'O') return;
        b[r][c] = '#';
        mark(b, r + 1, c); mark(b, r - 1, c);
        mark(b, r, c + 1); mark(b, r, c - 1);
    }

    public void solve(char[][] board) {
        int rows = board.length, cols = board[0].length;

        for (int r = 0; r < rows; r++) { mark(board, r, 0); mark(board, r, cols - 1); }
        for (int c = 0; c < cols; c++) { mark(board, 0, c); mark(board, rows - 1, c); }

        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++) {
                if (board[r][c] == 'O') board[r][c] = 'X';
                else if (board[r][c] == '#') board[r][c] = 'O';
            }
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function solve(board) {
    const rows = board.length, cols = board[0].length;

    const mark = (r, c) => {
        if (r < 0 || c < 0 || r >= rows || c >= cols) return;
        if (board[r][c] !== 'O') return;
        board[r][c] = '#';
        mark(r + 1, c); mark(r - 1, c); mark(r, c + 1); mark(r, c - 1);
    };

    // All FOUR borders — sides matter as much as top and bottom.
    for (let r = 0; r < rows; r++) { mark(r, 0); mark(r, cols - 1); }
    for (let c = 0; c < cols; c++) { mark(0, c); mark(rows - 1, c); }

    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
            if (board[r][c] === 'O') board[r][c] = 'X';
            else if (board[r][c] === '#') board[r][c] = 'O';
        }
}`,
            },
        ],
        followUps: [
            'Why is a third marker value necessary?',
            'What breaks if you only start from the top and bottom rows?',
            'Where else does "solve the complement" apply?',
        ],
    },

    'pacific-atlantic-water-flow': {
        restate:
            'Water flows to cells of equal or lower height. Find cells from which it can reach BOTH oceans.',
        body: `Reverse thinking again, and the reason Surrounded Regions comes first.

**The direct approach:** from every cell, search downhill and see whether both oceans are reached. That is a fresh search per cell — \`O((m·n)²)\` — and each one re-walks the same terrain.

**The observation: run the water backwards.** Start at each ocean's border and climb *uphill*, marking everything the ocean can reach in reverse. Do it twice, once per ocean, then intersect the two sets. Two traversals total instead of \`m·n\` of them.

The condition flips with the direction: going forwards you may move to a cell with height \`<=\` yours; going backwards you may move to a cell with height \`>=\` yours. Getting that comparison backwards is the most common bug, and it produces a plausible-looking but wrong answer rather than a crash.

**Seeding the two oceans:**
- **Pacific** — the top row and the left column.
- **Atlantic** — the bottom row and the right column.

Corners belong to both; that falls out naturally and needs no special case.

**The trap:** two separate visited sets, one per ocean. A single shared set means the second traversal skips everything the first already marked, and the intersection comes out as whatever the first ocean reached.

The answer is the cells present in both sets, which is one final sweep of the grid.`,
        complexity: { time: 'O(m · n)', space: 'O(m · n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    void climb(vector<vector<int>>& h, vector<vector<bool>>& seen, int r, int c, int prev) {
        if (r < 0 || c < 0 || r >= (int)h.size() || c >= (int)h[0].size()) return;
        if (seen[r][c]) return;
        if (h[r][c] < prev) return;      // REVERSED: climbing, so >= only

        seen[r][c] = true;
        climb(h, seen, r + 1, c, h[r][c]); climb(h, seen, r - 1, c, h[r][c]);
        climb(h, seen, r, c + 1, h[r][c]); climb(h, seen, r, c - 1, h[r][c]);
    }
public:
    vector<vector<int>> pacificAtlantic(vector<vector<int>>& heights) {
        int rows = heights.size(), cols = heights[0].size();
        // TWO separate visited grids — a shared one breaks the intersection.
        vector<vector<bool>> pac(rows, vector<bool>(cols, false));
        vector<vector<bool>> atl(rows, vector<bool>(cols, false));

        for (int c = 0; c < cols; c++) {
            climb(heights, pac, 0, c, INT_MIN);
            climb(heights, atl, rows - 1, c, INT_MIN);
        }
        for (int r = 0; r < rows; r++) {
            climb(heights, pac, r, 0, INT_MIN);
            climb(heights, atl, r, cols - 1, INT_MIN);
        }

        vector<vector<int>> out;
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                if (pac[r][c] && atl[r][c]) out.push_back({r, c});
        return out;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private void climb(int[][] h, boolean[][] seen, int r, int c, int prev) {
        if (r < 0 || c < 0 || r >= h.length || c >= h[0].length) return;
        if (seen[r][c] || h[r][c] < prev) return;

        seen[r][c] = true;
        climb(h, seen, r + 1, c, h[r][c]); climb(h, seen, r - 1, c, h[r][c]);
        climb(h, seen, r, c + 1, h[r][c]); climb(h, seen, r, c - 1, h[r][c]);
    }

    public List<List<Integer>> pacificAtlantic(int[][] heights) {
        int rows = heights.length, cols = heights[0].length;
        boolean[][] pac = new boolean[rows][cols], atl = new boolean[rows][cols];

        for (int c = 0; c < cols; c++) {
            climb(heights, pac, 0, c, Integer.MIN_VALUE);
            climb(heights, atl, rows - 1, c, Integer.MIN_VALUE);
        }
        for (int r = 0; r < rows; r++) {
            climb(heights, pac, r, 0, Integer.MIN_VALUE);
            climb(heights, atl, r, cols - 1, Integer.MIN_VALUE);
        }

        List<List<Integer>> out = new ArrayList<>();
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                if (pac[r][c] && atl[r][c]) out.add(List.of(r, c));
        return out;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function pacificAtlantic(heights) {
    const rows = heights.length, cols = heights[0].length;
    const pac = Array.from({ length: rows }, () => new Array(cols).fill(false));
    const atl = Array.from({ length: rows }, () => new Array(cols).fill(false));

    const climb = (seen, r, c, prev) => {
        if (r < 0 || c < 0 || r >= rows || c >= cols) return;
        if (seen[r][c] || heights[r][c] < prev) return;   // >= going backwards

        seen[r][c] = true;
        const h = heights[r][c];
        climb(seen, r + 1, c, h); climb(seen, r - 1, c, h);
        climb(seen, r, c + 1, h); climb(seen, r, c - 1, h);
    };

    for (let c = 0; c < cols; c++) {
        climb(pac, 0, c, -Infinity);
        climb(atl, rows - 1, c, -Infinity);
    }
    for (let r = 0; r < rows; r++) {
        climb(pac, r, 0, -Infinity);
        climb(atl, r, cols - 1, -Infinity);
    }

    const out = [];
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
            if (pac[r][c] && atl[r][c]) out.push([r, c]);
    return out;
}`,
            },
        ],
        followUps: [
            'Why does the height comparison flip when you run the search backwards?',
            'What is the answer if both oceans share one visited grid?',
            'What if water could also flow diagonally?',
        ],
    },

    'course-schedule': {
        restate: 'Given prerequisites, can every course be finished? (Is the directed graph acyclic?)',
        body: `Prerequisites are directed edges, and "can I finish everything" is exactly "**is there a cycle?**" — a cycle means two courses each require the other, directly or through a chain.

Two standard solutions, and you should know both because the follow-up asks for the order.

**DFS with three states.** A node is unvisited, *in the current path*, or fully done. Meeting a node that is in the current path means you have looped back to something you are still exploring — a cycle. Meeting a fully-done node is fine: it was already cleared.

**That three-state distinction is the whole problem.** A plain visited/unvisited boolean reports a cycle on any diamond — two different courses depending on a common prerequisite — which is a perfectly valid DAG. Mark on entry, unmark on exit, and keep a separate "done" flag.

**Kahn's algorithm (BFS).** Compute in-degrees, queue everything with in-degree 0, and repeatedly remove a node and decrement its neighbours. If you process fewer than \`n\` nodes, the leftovers are in a cycle. This one gives the ordering for free, which is why it is the better answer for Course Schedule II.

**Two traps.**

**Edge direction.** \`[a, b]\` means "to take \`a\` you must first take \`b\`", so the edge runs \`b → a\`. Reversing it still detects cycles (a directed graph has a cycle iff its reverse does), so this bug hides here and only surfaces in part II where the output order is wrong.

**Disconnected components.** Start a DFS from *every* unvisited node, not just node 0 — the graph need not be connected.`,
        complexity: { time: 'O(V + E)', space: 'O(V + E)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {
        vector<vector<int>> adj(numCourses);
        vector<int> indeg(numCourses, 0);
        for (auto& p : prerequisites) {
            adj[p[1]].push_back(p[0]);   // [a,b] means b -> a
            indeg[p[0]]++;
        }

        queue<int> q;
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.push(i);

        int done = 0;
        while (!q.empty()) {
            int cur = q.front(); q.pop();
            done++;
            for (int nxt : adj[cur]) if (--indeg[nxt] == 0) q.push(nxt);
        }
        return done == numCourses;   // leftovers are stuck in a cycle
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
        int[] indeg = new int[numCourses];

        for (int[] p : prerequisites) {
            adj.get(p[1]).add(p[0]);
            indeg[p[0]]++;
        }

        Deque<Integer> q = new ArrayDeque<>();
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.add(i);

        int done = 0;
        while (!q.isEmpty()) {
            int cur = q.poll();
            done++;
            for (int nxt : adj.get(cur)) if (--indeg[nxt] == 0) q.add(nxt);
        }
        return done == numCourses;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function canFinish(numCourses, prerequisites) {
    const adj = Array.from({ length: numCourses }, () => []);
    const indeg = new Array(numCourses).fill(0);

    for (const [a, b] of prerequisites) {
        adj[b].push(a);      // to take a you need b first: b -> a
        indeg[a]++;
    }

    const q = [];
    for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) q.push(i);

    let done = 0;
    for (let i = 0; i < q.length; i++) {
        done++;
        for (const nxt of adj[q[i]]) if (--indeg[nxt] === 0) q.push(nxt);
    }
    return done === numCourses;
}`,
            },
        ],
        followUps: [
            'Why does a two-state visited flag report a false cycle on a diamond?',
            'Write the DFS version with the three states.',
            'Why does reversing the edge direction still detect cycles correctly?',
        ],
    },

    'course-schedule-ii': {
        restate: 'Return a valid order to take all courses, or an empty array if impossible.',
        body: `Course Schedule with the **order** returned rather than a boolean — and this is why Kahn's algorithm was worth learning.

**The observation:** the order in which Kahn's algorithm removes nodes *is* a topological order. A node is only queued once its in-degree reaches zero, meaning every prerequisite has already been emitted. So record nodes as you pop them and the answer builds itself; no extra work over part I.

The cycle check is unchanged: if the result has fewer than \`numCourses\` entries, the remainder are in a cycle and you return an empty array.

**Now the edge direction genuinely matters.** In part I, reversing the edges still detected cycles, so the bug was invisible. Here a reversed graph produces an order that is exactly backwards — every test with a linear chain fails, and it fails in a way that looks like an off-by-one rather than a modelling error. \`[a, b]\` means *b before a*, so the edge is \`b → a\` and \`a\`'s in-degree increases.

**With DFS instead:** push each node onto a list *after* all its descendants are done (post-order), then **reverse** the list. The reversal is not cosmetic — post-order emits dependencies last, and a topological order needs them first.

**A detail worth mentioning:** several valid orders usually exist and any is accepted. Which one Kahn's produces depends on the queue order, so do not be surprised when your output differs from the sample.`,
        complexity: { time: 'O(V + E)', space: 'O(V + E)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    vector<int> findOrder(int numCourses, vector<vector<int>>& prerequisites) {
        vector<vector<int>> adj(numCourses);
        vector<int> indeg(numCourses, 0);
        for (auto& p : prerequisites) {
            adj[p[1]].push_back(p[0]);   // direction MATTERS here
            indeg[p[0]]++;
        }

        queue<int> q;
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.push(i);

        vector<int> order;
        while (!q.empty()) {
            int cur = q.front(); q.pop();
            order.push_back(cur);        // pop order IS a topological order
            for (int nxt : adj[cur]) if (--indeg[nxt] == 0) q.push(nxt);
        }
        if ((int)order.size() != numCourses) return {};   // cycle
        return order;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int[] findOrder(int numCourses, int[][] prerequisites) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
        int[] indeg = new int[numCourses];

        for (int[] p : prerequisites) {
            adj.get(p[1]).add(p[0]);
            indeg[p[0]]++;
        }

        Deque<Integer> q = new ArrayDeque<>();
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.add(i);

        int[] order = new int[numCourses];
        int idx = 0;
        while (!q.isEmpty()) {
            int cur = q.poll();
            order[idx++] = cur;
            for (int nxt : adj.get(cur)) if (--indeg[nxt] == 0) q.add(nxt);
        }
        return idx == numCourses ? order : new int[0];
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function findOrder(numCourses, prerequisites) {
    const adj = Array.from({ length: numCourses }, () => []);
    const indeg = new Array(numCourses).fill(0);

    for (const [a, b] of prerequisites) {
        adj[b].push(a);
        indeg[a]++;
    }

    const order = [];
    for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) order.push(i);

    for (let i = 0; i < order.length; i++) {
        for (const nxt of adj[order[i]]) if (--indeg[nxt] === 0) order.push(nxt);
    }
    return order.length === numCourses ? order : [];
}`,
            },
        ],
        followUps: [
            'Why does the edge direction matter here when it did not in part I?',
            'Write the DFS version. Why must the post-order list be reversed?',
            'Are multiple valid orders possible? What decides which one you get?',
        ],
    },

    'redundant-connection': {
        restate:
            'A tree had one extra edge added. Find the edge to remove — the last one in the input that creates a cycle.',
        body: `The **Union-Find** problem, and the cleanest introduction to the structure on the sheet.

**The observation:** a tree with \`n\` nodes has exactly \`n - 1\` edges and no cycles. Adding one more must close a cycle. Process edges in order and ask, for each: *were these two nodes already connected?* If yes, this edge closes the cycle and is the answer.

"Already connected?" with incremental merging is precisely what Union-Find (disjoint set union) is for. Two operations:

- **find(x)** — the representative of x's set, following parent pointers up.
- **union(a, b)** — merge two sets; return false if they were already the same.

Walk the edges; the first union that returns false is the answer. Because the problem asks for the *last* edge that could be removed and you are scanning left to right, the first failure is also the correct one.

**Two optimisations, both one line, and both worth writing:**

**Path compression** — in \`find\`, point each node directly at the root as you walk back. Subsequent finds are almost \`O(1)\`.

**Union by rank/size** — attach the smaller tree under the larger. Without it a chain of unions builds a linked list and \`find\` degrades to \`O(n)\`.

Together they give effectively \`O(α(n))\` per operation, which is constant for any real input.

**The trap:** nodes are **1-indexed**. Size the parent array \`n + 1\` and ignore index 0, or every access is off by one — and on the sample inputs it can still produce an answer, just the wrong edge.

**The DFS alternative:** for each edge, check whether a path already exists between its endpoints. Correct, but \`O(n²)\`, and it does not generalise the way Union-Find does.`,
        complexity: { time: 'O(n · α(n)) — effectively O(n)', space: 'O(n)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
    vector<int> parent, rnk;

    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);   // path compression
        return parent[x];
    }
    bool unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;             // already connected: a cycle
        if (rnk[ra] < rnk[rb]) swap(ra, rb);    // union by rank
        parent[rb] = ra;
        if (rnk[ra] == rnk[rb]) rnk[ra]++;
        return true;
    }
public:
    vector<int> findRedundantConnection(vector<vector<int>>& edges) {
        int n = edges.size();
        parent.resize(n + 1);                   // nodes are 1-INDEXED
        rnk.assign(n + 1, 0);
        for (int i = 0; i <= n; i++) parent[i] = i;

        for (auto& e : edges) {
            if (!unite(e[0], e[1])) return e;
        }
        return {};
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    private int[] parent, rank;

    private int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);
        return parent[x];
    }

    private boolean unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (rank[ra] < rank[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        if (rank[ra] == rank[rb]) rank[ra]++;
        return true;
    }

    public int[] findRedundantConnection(int[][] edges) {
        int n = edges.length;
        parent = new int[n + 1];
        rank = new int[n + 1];
        for (int i = 0; i <= n; i++) parent[i] = i;

        for (int[] e : edges) {
            if (!unite(e[0], e[1])) return e;
        }
        return new int[0];
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function findRedundantConnection(edges) {
    const n = edges.length;
    const parent = Array.from({ length: n + 1 }, (_, i) => i);   // 1-indexed
    const rank = new Array(n + 1).fill(0);

    const find = (x) => {
        while (parent[x] !== x) {
            parent[x] = parent[parent[x]];   // path halving
            x = parent[x];
        }
        return x;
    };

    for (const e of edges) {
        let ra = find(e[0]), rb = find(e[1]);
        if (ra === rb) return e;             // this edge closes the cycle
        if (rank[ra] < rank[rb]) [ra, rb] = [rb, ra];
        parent[rb] = ra;
        if (rank[ra] === rank[rb]) rank[ra]++;
    }
    return [];
}`,
            },
        ],
        followUps: [
            'What does find degrade to without union by rank?',
            'Why does the FIRST union failure give the LAST removable edge?',
            'Redundant Connection II — the graph is directed. Why is that much harder?',
        ],
    },

    'min-cost-to-connect-all-points': {
        restate:
            'Connect all points at minimum total cost, where an edge costs the Manhattan distance.',
        body: `A **minimum spanning tree** problem, and recognising that is the whole battle — the phrasing hides it completely.

**The recognition:** you need every point connected (spanning), at minimum total cost, and any cycle would mean a removable edge, so the answer has no cycles (tree). Spanning + minimum + tree = MST.

**Prim's algorithm** fits this graph best. Start anywhere; repeatedly take the cheapest edge from the visited set to an unvisited point, using a min-heap of candidate edges. Add the point, push its edges, repeat until all \`n\` points are in.

**Why Prim's and not Kruskal's here:** the graph is **complete** — every pair of points is an edge, so there are \`n²/2\` of them. Kruskal's sorts all edges: \`O(n² log n²)\`. Prim's only ever pushes edges from the visited frontier, so it works with the heap rather than the full edge list. With \`n <= 1000\` that is 500,000 edges; the difference is real.

**The trap: check "already visited" when you POP, not only when you push.** The same point can be pushed many times with different costs, since a new frontier point offers a new edge to it. Skipping visited points at pop time is what makes the algorithm correct — and it is why you cannot simply mark on push here, unlike in an unweighted BFS. That contrast with the section's usual rule is worth noticing.

**Manhattan distance**, not Euclidean: \`|x1-x2| + |y1-y2|\`. No square root, all integer arithmetic.

Stop when \`n\` points are connected, and note the answer needs \`n - 1\` edges.`,
        complexity: { time: 'O(n² log n)', space: 'O(n²)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int minCostConnectPoints(vector<vector<int>>& points) {
        int n = points.size();
        vector<bool> inMst(n, false);
        // (cost, point index), min-heap
        priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> pq;
        pq.push({0, 0});

        int total = 0, used = 0;
        while (used < n) {
            auto [cost, i] = pq.top(); pq.pop();
            if (inMst[i]) continue;        // stale entry — check at POP time
            inMst[i] = true;
            total += cost;
            used++;

            for (int j = 0; j < n; j++) {
                if (inMst[j]) continue;
                int d = abs(points[i][0] - points[j][0])
                      + abs(points[i][1] - points[j][1]);   // Manhattan
                pq.push({d, j});
            }
        }
        return total;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int minCostConnectPoints(int[][] points) {
        int n = points.length;
        boolean[] inMst = new boolean[n];
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        pq.add(new int[]{0, 0});

        int total = 0, used = 0;
        while (used < n) {
            int[] top = pq.poll();
            int cost = top[0], i = top[1];
            if (inMst[i]) continue;
            inMst[i] = true;
            total += cost;
            used++;

            for (int j = 0; j < n; j++) {
                if (inMst[j]) continue;
                int d = Math.abs(points[i][0] - points[j][0])
                      + Math.abs(points[i][1] - points[j][1]);
                pq.add(new int[]{d, j});
            }
        }
        return total;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function minCostConnectPoints(points) {
    const n = points.length;
    const inMst = new Array(n).fill(false);
    const minEdge = new Array(n).fill(Infinity);
    minEdge[0] = 0;

    /**
     * O(n^2) Prim without a heap: with a COMPLETE graph this is asymptotically
     * as good as the heap version and needs no priority queue, which JS lacks.
     */
    let total = 0;
    for (let step = 0; step < n; step++) {
        let best = -1;
        for (let i = 0; i < n; i++) {
            if (!inMst[i] && (best === -1 || minEdge[i] < minEdge[best])) best = i;
        }
        inMst[best] = true;
        total += minEdge[best];

        for (let j = 0; j < n; j++) {
            if (inMst[j]) continue;
            const d = Math.abs(points[best][0] - points[j][0])
                    + Math.abs(points[best][1] - points[j][1]);
            if (d < minEdge[j]) minEdge[j] = d;
        }
    }
    return total;
}`,
            },
        ],
        followUps: [
            'Why check "already in MST" at pop time rather than push time?',
            'Why Prim over Kruskal on a complete graph?',
            'Would the answer change with Euclidean distance?',
        ],
    },

    'network-delay-time': {
        restate:
            'Signals travel along weighted directed edges. How long until every node receives one, or -1 if some cannot?',
        body: `**Dijkstra's algorithm**, and the problem is a clean statement of it: shortest path from one source to all nodes, with non-negative weights.

**Why BFS is not enough:** BFS finds the fewest *edges*, not the smallest *total weight*. A two-hop path costing 2 beats a one-hop path costing 10, and BFS would take the one-hop. The moment edges have weights, the frontier must be ordered by accumulated cost — which is a priority queue, not a plain queue.

**The algorithm:** a min-heap keyed by distance, seeded with \`(0, source)\`. Pop the closest unfinalised node; if already visited, skip. Otherwise finalise it and push each neighbour with \`dist + edgeWeight\`.

**Why popping the minimum finalises it:** every alternative route to that node goes through some other unfinalised node, which is at least as far away, and weights are non-negative — so no later path can be shorter. That argument is the correctness proof, and it is exactly where the non-negativity requirement lives. Say it out loud.

**The answer is the maximum of all the finalised distances** — the signal has arrived everywhere once the *last* node receives it. If fewer than \`n\` nodes were reached, some are unreachable: return -1.

**Two traps.**

**Check visited at pop, not push.** A node can be pushed several times with different costs; the first pop is the best one and the rest are stale.

**Nodes are 1-indexed**, so size arrays \`n + 1\`.

**Negative weights break this entirely** — that is Bellman-Ford, which is the next problem.`,
        complexity: { time: 'O(E log V)', space: 'O(V + E)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int networkDelayTime(vector<vector<int>>& times, int n, int k) {
        vector<vector<pair<int, int>>> adj(n + 1);   // 1-INDEXED
        for (auto& t : times) adj[t[0]].push_back({t[1], t[2]});

        priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> pq;
        vector<bool> done(n + 1, false);
        pq.push({0, k});

        int reached = 0, latest = 0;
        while (!pq.empty()) {
            auto [d, node] = pq.top(); pq.pop();
            if (done[node]) continue;     // stale — check at POP
            done[node] = true;
            reached++;
            latest = d;                   // popped in increasing order

            for (auto& [nxt, w] : adj[node]) {
                if (!done[nxt]) pq.push({d + w, nxt});
            }
        }
        return reached == n ? latest : -1;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int networkDelayTime(int[][] times, int n, int k) {
        List<List<int[]>> adj = new ArrayList<>();
        for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());
        for (int[] t : times) adj.get(t[0]).add(new int[]{t[1], t[2]});

        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        boolean[] done = new boolean[n + 1];
        pq.add(new int[]{0, k});

        int reached = 0, latest = 0;
        while (!pq.isEmpty()) {
            int[] top = pq.poll();
            int d = top[0], node = top[1];
            if (done[node]) continue;
            done[node] = true;
            reached++;
            latest = d;

            for (int[] e : adj.get(node)) {
                if (!done[e[0]]) pq.add(new int[]{d + e[1], e[0]});
            }
        }
        return reached == n ? latest : -1;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function networkDelayTime(times, n, k) {
    const adj = Array.from({ length: n + 1 }, () => []);
    for (const [u, v, w] of times) adj[u].push([v, w]);

    const dist = new Array(n + 1).fill(Infinity);
    dist[k] = 0;
    const done = new Array(n + 1).fill(false);

    // O(V^2) Dijkstra without a heap: pick the nearest unfinalised node each round.
    for (let step = 0; step < n; step++) {
        let best = -1;
        for (let i = 1; i <= n; i++) {
            if (!done[i] && (best === -1 || dist[i] < dist[best])) best = i;
        }
        if (best === -1 || dist[best] === Infinity) break;
        done[best] = true;

        for (const [v, w] of adj[best]) {
            if (dist[best] + w < dist[v]) dist[v] = dist[best] + w;
        }
    }

    let latest = 0;
    for (let i = 1; i <= n; i++) {
        if (dist[i] === Infinity) return -1;
        latest = Math.max(latest, dist[i]);
    }
    return latest;
}`,
            },
        ],
        followUps: [
            'Why does popping the minimum finalise that node? Where is non-negativity used?',
            'Why is the answer the MAXIMUM distance rather than the sum?',
            'What breaks with a negative edge weight?',
        ],
    },

    'cheapest-flights-within-k-stops': {
        restate:
            'The cheapest route from src to dst using at most k intermediate stops.',
        body: `Dijkstra's, but with a **second constraint** — and that is exactly what breaks it.

**Why plain Dijkstra fails:** it finalises a node the first time it is popped, on the assumption that no better route exists. Here a *more expensive* route reaching a node in *fewer stops* may be the only one that can still reach the destination within budget. Cost alone no longer determines what is best; the pair (cost, stops) does, and neither dominates.

**The observation — Bellman-Ford:** relax **all edges, exactly k + 1 times**. After round \`i\`, \`dist[v]\` holds the cheapest cost to reach \`v\` using at most \`i\` edges. Since \`k\` stops means \`k + 1\` flights, \`k + 1\` rounds is precisely the answer. The hop limit stops being an awkward extra constraint and becomes the loop bound.

**The trap that makes or breaks this: relax from a SNAPSHOT of the previous round.** Copy \`dist\` at the start of each round, read the old values, and write into the new one. Reading and writing the same array lets a path use two edges within a single round, so results leak across rounds and the stop limit is silently exceeded — producing a cheaper answer than allowed, which looks like a better solution rather than a bug.

**Two details:** initialise \`dist[src] = 0\` and everything else to infinity, and skip relaxing from a node still at infinity — otherwise the arithmetic overflows in C++/Java.

**The BFS alternative** — walk level by level, one level per allowed flight, carrying the accumulated cost — is the same idea and some find it more natural. Either is fine; the snapshot discipline matters in both.`,
        complexity: { time: 'O(k · E)', space: 'O(V)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int findCheapestPrice(int n, vector<vector<int>>& flights, int src, int dst, int k) {
        const int INF = 1e9;
        vector<int> dist(n, INF);
        dist[src] = 0;

        // k stops = k+1 flights = k+1 relaxation rounds.
        for (int round = 0; round <= k; round++) {
            vector<int> snapshot = dist;      // READ from last round only
            for (auto& f : flights) {
                int u = f[0], v = f[1], w = f[2];
                if (snapshot[u] == INF) continue;
                dist[v] = min(dist[v], snapshot[u] + w);
            }
        }
        return dist[dst] == INF ? -1 : dist[dst];
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
        final int INF = 1_000_000_000;
        int[] dist = new int[n];
        Arrays.fill(dist, INF);
        dist[src] = 0;

        for (int round = 0; round <= k; round++) {
            int[] snapshot = dist.clone();
            for (int[] f : flights) {
                if (snapshot[f[0]] == INF) continue;
                dist[f[1]] = Math.min(dist[f[1]], snapshot[f[0]] + f[2]);
            }
        }
        return dist[dst] == INF ? -1 : dist[dst];
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function findCheapestPrice(n, flights, src, dst, k) {
    let dist = new Array(n).fill(Infinity);
    dist[src] = 0;

    for (let round = 0; round <= k; round++) {
        const snapshot = [...dist];      // without this, hops leak across rounds
        for (const [u, v, w] of flights) {
            if (snapshot[u] === Infinity) continue;
            if (snapshot[u] + w < dist[v]) dist[v] = snapshot[u] + w;
        }
    }
    return dist[dst] === Infinity ? -1 : dist[dst];
}`,
            },
        ],
        followUps: [
            'Why does plain Dijkstra give the wrong answer here?',
            'What happens without the snapshot copy? Construct a failing input.',
            'Why is the loop bound k + 1 rather than k?',
        ],
    },

    'word-ladder': {
        restate:
            'Transform beginWord into endWord one letter at a time, every intermediate being in the word list. Return the shortest chain length.',
        body: `An unweighted **shortest path**, which means BFS — and the interesting part is that the graph is never built.

**The observation:** each word is a node, and two words are adjacent when they differ by exactly one letter. Comparing every pair to build the edges is \`O(n² · L)\`, which is the naive and too-slow approach.

**Generate neighbours instead of storing them.** For a word of length \`L\`, try all 26 letters at each of the \`L\` positions — \`26L\` candidates — and keep the ones present in the word set. That is \`O(26 · L)\` per word regardless of how large the dictionary is, and it replaces the entire edge list.

**BFS, not DFS**, because the question is *shortest*. Level by level; the first time you reach \`endWord\` you have the shortest chain, and the level count is the answer.

**The traps.**

**Remove a word from the set as you enqueue it.** That is the visited marker; leaving words in means the same word is queued from many predecessors and the queue explodes.

**\`endWord\` must be in the word list**, or no transformation is valid. Check up front and return 0 — a surprising number of wrong submissions are this case alone.

**The count is words, not steps.** Start the level counter at 1 for \`beginWord\` itself, so a one-letter change returns 2.

**The optimisation worth naming:** bidirectional BFS, searching from both ends and meeting in the middle. Each frontier grows roughly \`b^(d/2)\` instead of one growing \`b^d\` — a large constant-factor win on this problem, and a strong thing to mention even if you write the plain version.`,
        complexity: { time: 'O(N · L · 26)', space: 'O(N · L)' },
        code: [
            {
                lang: 'cpp',
                source: `class Solution {
public:
    int ladderLength(string beginWord, string endWord, vector<string>& wordList) {
        unordered_set<string> words(wordList.begin(), wordList.end());
        if (!words.count(endWord)) return 0;   // no valid target

        queue<string> q;
        q.push(beginWord);
        words.erase(beginWord);

        int level = 1;                          // beginWord counts as word 1
        while (!q.empty()) {
            int size = q.size();
            for (int i = 0; i < size; i++) {
                string word = q.front(); q.pop();
                if (word == endWord) return level;

                for (int p = 0; p < (int)word.size(); p++) {
                    char original = word[p];
                    for (char ch = 'a'; ch <= 'z'; ch++) {
                        word[p] = ch;
                        if (words.count(word)) {
                            words.erase(word);  // erase = mark visited on enqueue
                            q.push(word);
                        }
                    }
                    word[p] = original;
                }
            }
            level++;
        }
        return 0;
    }
};`,
            },
            {
                lang: 'java',
                source: `class Solution {
    public int ladderLength(String beginWord, String endWord, List<String> wordList) {
        Set<String> words = new HashSet<>(wordList);
        if (!words.contains(endWord)) return 0;

        Deque<String> q = new ArrayDeque<>();
        q.add(beginWord);
        words.remove(beginWord);

        int level = 1;
        while (!q.isEmpty()) {
            int size = q.size();
            for (int i = 0; i < size; i++) {
                String word = q.poll();
                if (word.equals(endWord)) return level;

                char[] chars = word.toCharArray();
                for (int p = 0; p < chars.length; p++) {
                    char original = chars[p];
                    for (char ch = 'a'; ch <= 'z'; ch++) {
                        chars[p] = ch;
                        String next = new String(chars);
                        if (words.remove(next)) q.add(next);
                    }
                    chars[p] = original;
                }
            }
            level++;
        }
        return 0;
    }
}`,
            },
            {
                lang: 'javascript',
                source: `function ladderLength(beginWord, endWord, wordList) {
    const words = new Set(wordList);
    if (!words.has(endWord)) return 0;

    let q = [beginWord];
    words.delete(beginWord);
    let level = 1;

    while (q.length) {
        const next = [];
        for (const word of q) {
            if (word === endWord) return level;

            for (let p = 0; p < word.length; p++) {
                for (let c = 97; c < 123; c++) {
                    const candidate =
                        word.slice(0, p) + String.fromCharCode(c) + word.slice(p + 1);
                    if (words.has(candidate)) {
                        words.delete(candidate);   // visited, on enqueue
                        next.push(candidate);
                    }
                }
            }
        }
        q = next;
        level++;
    }
    return 0;
}`,
            },
        ],
        followUps: [
            'Why generate neighbours rather than precompute the adjacency list?',
            'Implement bidirectional BFS. Why is it so much faster?',
            'Word Ladder II — return every shortest path, not just the length.',
        ],
    },
};
