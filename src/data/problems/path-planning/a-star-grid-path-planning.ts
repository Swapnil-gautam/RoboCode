import { Problem } from "../../types";

export const aStarGridPathPlanning: Problem = {
  id: 9,
  slug: "a-star-grid-path-planning",
  title: "A* Grid Path Planning",
  difficulty: "Medium",
  topics: ["Path Planning"],
  description: `### The Problem

A robot is moving on a 2D grid. Some cells are blocked by obstacles.

Your job is to find a **shortest collision-free path** from the start cell to the goal cell using the **A*** algorithm.

---

### Real-World Use

- **Warehouse robots** moving between shelves
- **Game AI** finding paths around walls
- **Autonomous mobile robots** planning through occupancy grids

---

### Grid Rules

- \`0\` means the cell is free
- \`1\` means the cell is blocked
- The robot may move **up, down, left, or right**
- Diagonal motion is not allowed

Return **any shortest valid path** from start to goal, including both the start and goal cells.

If no path exists, return an empty list.

---


### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| \`grid\` | list[list[int]] | 2D map of free and blocked cells |
| \`start\` | tuple[int, int] | Start cell as \`(row, col)\` |
| \`goal\` | tuple[int, int] | Goal cell as \`(row, col)\` |

---

### Examples

**Example 1**

\`\`\`
Input:
grid = [
  [0, 0, 0],
  [1, 1, 0],
  [0, 0, 0]
]
start = (0, 0)
goal = (2, 2)

One valid output:
[(0, 0), (0, 1), (0, 2), (1, 2), (2, 2)]
\`\`\`

---

### Hint

Use:
- a **priority queue** for open nodes
- **Manhattan distance** as the heuristic
- a parent map to reconstruct the final path
`,
  theory: `## Theory: A* Path Planning

### What A* Does

A* is one of the most famous path planning algorithms in robotics and computer science.

It combines:
- the true cost traveled so far: $g(n)$
- an estimate of remaining cost: $h(n)$

Then it chooses the node with the smallest:

$$f(n) = g(n) + h(n)$$

### Why the Heuristic Helps

Breadth-first search explores everywhere equally.

A* explores more intelligently because the heuristic nudges it toward the goal.

For a grid with 4-direction motion, a great heuristic is **Manhattan distance**:

$$h(n) = |r - r_g| + |c - c_g|$$

### Why Robotics Uses It

- It is simple and dependable
- It works well on occupancy grids
- It is often the first planner students implement

Later, robots may use variants like D*, hybrid A*, PRM, or RRT, but A* is still foundational.
`,
  starterCode: `import heapq

def a_star_grid(grid: list[list[int]], start: tuple, goal: tuple) -> list:
    """
    Return any shortest valid path from start to goal.
    If no path exists, return [].
    """
    # Write code here
    pass
`,
  solutionCode: `import heapq

def a_star_grid(grid: list[list[int]], start: tuple, goal: tuple) -> list:
    rows = len(grid)
    cols = len(grid[0]) if rows else 0

    def heuristic(cell):
        return abs(cell[0] - goal[0]) + abs(cell[1] - goal[1])

    if not rows or not cols:
        return []

    if grid[start[0]][start[1]] == 1 or grid[goal[0]][goal[1]] == 1:
        return []

    open_heap = [(heuristic(start), 0, start)]
    came_from = {}
    g_score = {start: 0}
    visited = set()

    while open_heap:
        _, cost, current = heapq.heappop(open_heap)

        if current in visited:
            continue
        visited.add(current)

        if current == goal:
            path = [current]
            while current in came_from:
                current = came_from[current]
                path.append(current)
            path.reverse()
            return path

        row, col = current
        for dr, dc in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
            nr = row + dr
            nc = col + dc
            neighbor = (nr, nc)

            if nr < 0 or nr >= rows or nc < 0 or nc >= cols:
                continue
            if grid[nr][nc] == 1:
                continue

            new_cost = cost + 1
            if new_cost < g_score.get(neighbor, float("inf")):
                g_score[neighbor] = new_cost
                came_from[neighbor] = current
                heapq.heappush(open_heap, (new_cost + heuristic(neighbor), new_cost, neighbor))

    return []
`,
  testCases: [
    {
      id: 1,
      input: {
        grid: [
          [0, 0, 0],
          [1, 1, 0],
          [0, 0, 0],
        ],
        start: [0, 0],
        goal: [2, 2],
      },
      expected: { optimalLength: 5 },
      description: "A simple map with one shortest corridor around the wall",
    },
    {
      id: 2,
      input: {
        grid: [
          [0, 1, 0],
          [0, 1, 0],
          [0, 0, 0],
        ],
        start: [0, 0],
        goal: [0, 2],
      },
      expected: { optimalLength: 7 },
      description: "Planner must route around a vertical obstacle column",
    },
    {
      id: 3,
      input: {
        grid: [
          [0, 1, 0],
          [1, 1, 0],
          [0, 1, 0],
        ],
        start: [0, 0],
        goal: [2, 2],
      },
      expected: { optimalLength: 0 },
      description: "No valid route exists",
    },
  ],
  testRunnerCode: `
import json
from collections import deque

results = []
test_cases = __TEST_CASES__

def normalize_path(path):
    normalized = []
    for cell in path:
        if isinstance(cell, (list, tuple)) and len(cell) == 2:
            normalized.append([int(cell[0]), int(cell[1])])
        else:
            return None
    return normalized

def shortest_length(grid, start, goal):
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    q = deque([(start[0], start[1], 1)])
    seen = {(start[0], start[1])}

    while q:
        r, c, dist = q.popleft()
        if [r, c] == goal:
            return dist
        for dr, dc in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
            nr, nc = r + dr, c + dc
            if nr < 0 or nr >= rows or nc < 0 or nc >= cols:
                continue
            if grid[nr][nc] == 1 or (nr, nc) in seen:
                continue
            seen.add((nr, nc))
            q.append((nr, nc, dist + 1))
    return 0

def valid_path(grid, path, start, goal):
    if not path:
        return False
    if path[0] != start or path[-1] != goal:
        return False

    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    for i, cell in enumerate(path):
        r, c = cell
        if r < 0 or r >= rows or c < 0 or c >= cols:
            return False
        if grid[r][c] == 1:
            return False
        if i > 0:
            pr, pc = path[i - 1]
            if abs(pr - r) + abs(pc - c) != 1:
                return False
    return True

for tc in test_cases:
    inp = tc["input"]
    start = tuple(inp["start"])
    goal = tuple(inp["goal"])
    try:
        result = a_star_grid(inp["grid"], start, goal)
        path = normalize_path(result)
        optimal = tc["expected"]["optimalLength"]

        if optimal == 0:
            passed = bool(path == [])
            output = [] if path == [] else result
        else:
            passed = bool(path is not None and valid_path(inp["grid"], path, list(start), list(goal)) and len(path) == shortest_length(inp["grid"], list(start), list(goal)))
            output = path if path is not None else result

        results.append({"id": tc["id"], "passed": passed, "output": output, "expected": tc["expected"]})
    except Exception as e:
        results.append({"id": tc["id"], "passed": False, "error": str(e)})

json.dumps(results)
`,
  vizType: "a-star-grid-path-planning",
};
