import { Problem } from "../types";

export const forwardKinematics: Problem = {
  id: 1,
  slug: "forward-kinematics",
  title: "Forward Kinematics (2-Link Arm)",
  difficulty: "Easy",
  topics: ["Kinematics"],
  description: `### The Problem

A robot arm has **two sticks** (called **links**) connected by **two joints** (like elbows — they rotate). You command each joint to rotate by a certain angle, and you want to know: **Where is the tip of the arm now?**

---

### Real-World Use

This is how robots actually work:
- A **manufacturing robot** rotates its joints to position a tool at a specific spot
- An **assembly robot** needs to know where its gripper will be before it grabs a part
- A **warehouse robot arm** must know where it can reach to pick items

---

### What You'll Compute

You have:
- Two sticks of fixed lengths: $l_1$ and $l_2$
- Two rotation angles (one for each joint): $\\theta_1$ and $\\theta_2$ (in radians)

You must find the **(x, y)** position of the **end-effector** (the tip of the arm).

---


### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| \`l1\` | float | Length of the first link (stick) |
| \`l2\` | float | Length of the second link (stick) |
| \`theta1\` | float | Angle of the first joint in radians |
| \`theta2\` | float | Angle of the second joint in radians (relative to the first link) |

**Returns:** A tuple \`(x, y)\` — the end-effector position, each rounded to 4 decimal places.

---

### Constraints

- $0 < l_1, l_2 \\leq 10$
- $-\\pi \\leq \\theta_1, \\theta_2 \\leq \\pi$ (1 radian ≈ 57°)
- Output values must be rounded to exactly **4 decimal places**

---

### Examples

**Example 1 — Arm fully straight**

\`\`\`
Input:  l1 = 1, l2 = 1, theta1 = 0, theta2 = 0
Output: (2.0, 0.0)
\`\`\`

Both joints are at 0 radians. The arm points straight to the right. The tip is at distance $1 + 1 = 2$ from the origin.

**Example 2 — Arm makes an L-shape**

\`\`\`
Input:  l1 = 1, l2 = 1, theta1 = 0, theta2 = π/2
Output: (1.0, 1.0)
\`\`\`

The first joint is still at 0 (pointing right), but the second joint rotates 90° (π/2 radians). Now the second stick points upward, forming an L-shape. The tip ends up at (1, 1).

---

### Hint

Try using trigonometry: think about breaking each link into horizontal (x) and vertical (y) components.
`,
  theory: `## Theory: Forward Kinematics

### What is Forward Kinematics?

**Forward kinematics (FK)** answers this question: *"If I rotate my joints by these angles, where will my hand end up?"*

It's "forward" because you **move forward** from joint angles → end-effector position. This is the **natural direction** of motion for a robot: you command the joints, and the arm responds.

### Key Terms

- **Link**: A rigid stick or rod (like your forearm or upper arm)
- **Joint**: A rotating connection between two links (like your elbow or shoulder) — it has an angle
- **End-effector**: The tip of the arm, where the tool is (your hand, a gripper, a welding torch, etc.)
- **Angle (θ)**: Measured in radians. $\\pi$ radians = 180°, so $\\pi/2$ = 90°

### The 2-Link Arm Geometry

Think of it like this:

1. **First link** starts at the origin (0, 0) and rotates by $\\theta_1$
   - It extends a distance $l_1$ at this angle
   - So the elbow (joint 2) ends up at: $(l_1 \\cos(\\theta_1), l_1 \\sin(\\theta_1))$

2. **Second link** starts at the elbow and rotates by $\\theta_2$ *relative to the first link*
   - So its absolute angle is $\\theta_1 + \\theta_2$
   - It extends a distance $l_2$ at this angle
   - So the end-effector is at the elbow position PLUS the second link's contribution

**The formulas:**

$$x = l_1 \\cos(\\theta_1) + l_2 \\cos(\\theta_1 + \\theta_2)$$
$$y = l_1 \\sin(\\theta_1) + l_2 \\sin(\\theta_1 + \\theta_2)$$

### Why Does This Matter?

Every robot needs FK. Without it:
- You can't visualize where the arm will go
- You can't check if a grasp will cause a collision
- Motion planning becomes impossible

### Real Examples
- **Robotic surgery**: The surgeon needs to know exactly where the surgical tool will be
- **CNC machining**: The spindle needs precise positioning
- **Humanoid robots**: To mimic human arm motion, we compute FK for every frame

### What Comes Next?
Once you master FK, you'll learn **Inverse Kinematics (IK)**: the reverse problem — given a desired position, find the joint angles.
`,
  starterCode: `import numpy as np

def forward_kinematics(l1: float, l2: float, theta1: float, theta2: float) -> tuple:
    """
    Compute the end-effector (x, y) position for a 2-link planar arm.
    
    Args:
        l1: Length of first link
        l2: Length of second link
        theta1: First joint angle in radians
        theta2: Second joint angle in radians (relative to first link)
    
    Returns:
        Tuple (x, y) rounded to 4 decimal places
    """
    # Write code here
    pass
`,
  solutionCode: `import numpy as np

def forward_kinematics(l1: float, l2: float, theta1: float, theta2: float) -> tuple:
    x = l1 * np.cos(theta1) + l2 * np.cos(theta1 + theta2)
    y = l1 * np.sin(theta1) + l2 * np.sin(theta1 + theta2)
    return (round(x, 4), round(y, 4))
`,
  testCases: [
    {
      id: 1,
      input: { l1: 1, l2: 1, theta1: 0, theta2: 0 },
      expected: [2.0, 0.0],
      description: "Both joints at 0° — arm fully extended along x-axis",
    },
    {
      id: 2,
      input: {
        l1: 1,
        l2: 1,
        theta1: Math.PI / 2,
        theta2: 0,
      },
      expected: [0.0, 2.0],
      description: "First joint at 90° — arm points up",
    },
    {
      id: 3,
      input: {
        l1: 1,
        l2: 1,
        theta1: 0,
        theta2: Math.PI / 2,
      },
      expected: [1.0, 1.0],
      description: "Second joint at 90° — L-shaped arm",
    },
  ],
  testRunnerCode: `
import json, math
results = []
test_cases = __TEST_CASES__
for tc in test_cases:
    inp = tc["input"]
    try:
        result = forward_kinematics(inp["l1"], inp["l2"], inp["theta1"], inp["theta2"])
        result = (round(result[0], 4), round(result[1], 4))
        expected = tuple(tc["expected"])
        passed = bool(abs(result[0] - expected[0]) < 1e-3 and abs(result[1] - expected[1]) < 1e-3)
        results.append({"id": tc["id"], "passed": passed, "output": list(result), "expected": list(expected)})
    except Exception as e:
        results.append({"id": tc["id"], "passed": False, "error": str(e)})
json.dumps(results)
`,
  vizType: "forward-kinematics",
};