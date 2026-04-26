import { Problem } from "../types";

export const inverseKinematics: Problem = {
  id: 2,
  slug: "inverse-kinematics",
  title: "Inverse Kinematics (2-Link Arm)",
  difficulty: "Medium",
  topics: ["Kinematics"],
  description: `### The Problem

This is the reverse of Forward Kinematics: You have a **target position (x, y)** where you want the arm to reach. You need to find **which joint angles will get you there**.

---

### Real-World Use

This is how real robots actually plan motion:
- A **pick-and-place robot** gets a target coordinate for a part and must compute the angles to reach it
- A **welding robot** needs to position its torch at a specific point in space
- A **surgical arm** must angle its joints to reach the operating site

---

### The Challenge

Unlike Forward Kinematics, Inverse Kinematics can have:
- **No solution**: The target is too far away (unreachable)
- **One solution**: Some rare configurations
- **Multiple solutions**: The arm can bend different ways to reach the same spot (elbow-up vs. elbow-down)

For this problem, you always return the **elbow-up solution** (the configuration where the elbow angle is positive).

---


### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| \`l1\` | float | Length of the first link (stick) |
| \`l2\` | float | Length of the second link (stick) |
| \`x\` | float | Target x-position of the end-effector |
| \`y\` | float | Target y-position of the end-effector |

**Returns:** A tuple \`(theta1, theta2)\` in radians, rounded to 4 decimal places. Use the **elbow-up** configuration (where $\\theta_2 > 0$). If the target is unreachable, return \`(None, None)\`.

---

### Constraints

- $0 < l_1, l_2 \\leq 10$
- A target is **reachable** if: minimum distance ($|l_1 - l_2|$) ≤ distance to target ≤ maximum distance ($l_1 + l_2$)
- Always return the **elbow-up** (positive $\\theta_2$) solution
- Output angles rounded to exactly **4 decimal places**

---

### Examples

**Example 1 — Fully extended**

\`\`\`
Input:  l1 = 1, l2 = 1, x = 2, y = 0
Output: (0.0, 0.0)
\`\`\`

The target is 2 units away. Since $1 + 1 = 2$, the arm must be fully stretched. Both angles are 0.

**Example 2 — Target forms a triangle**

\`\`\`
Input:  l1 = 1, l2 = 1, x = 1, y = 1
Output: (0.7854, 1.5708)
\`\`\`

The target at (1, 1) is about 1.414 units away. The arm can reach it, and the elbow-up solution places the joints at approximately 0.785 and 1.571 radians (about 45° and 90°).

---

### Hint

Use the **law of cosines** from geometry. The two links and the target form a triangle — you can solve for the angles using triangle properties!
`,
  theory: `## Theory: Inverse Kinematics

### What is Inverse Kinematics?

**Inverse kinematics (IK)** answers: *"To reach this position (x, y), what angles should I use?"*

It's "inverse" because you work **backwards** from the goal to the joint angles. In practice, you almost always use IK — you tell a robot "grab that object at (1.5, 2.3)" and the robot computes IK to find the angles.

### Why It's Harder Than FK

| Forward Kinematics | Inverse Kinematics |
|--------------------|-------------------|
| One input → One output | One input → Multiple outputs (or none) |
| Always solvable | May have no solution (unreachable) |
| Fast to compute | Computationally harder |

### Multiple Solutions

For a 2-link arm reaching a reachable target, there are **two possible arm configurations**:

1. **Elbow-up**: The elbow bulges upward (positive angle)
2. **Elbow-down**: The elbow bulges downward (negative angle)

Both arm shapes reach the same endpoint! Most robots prefer one or the other. In this problem, you always return elbow-up.

### Reachability

The arm cannot reach everywhere. The **workspace** is a ring:
- **Outer radius**: $l_1 + l_2$ (fully extended)
- **Inner radius**: $|l_1 - l_2|$ (arm folded as tightly as possible)

If a target is outside this ring, it's **unreachable**.

### The Mathematics

For a 2-link arm, we can solve IK analytically using the **law of cosines**:

$$\\cos(\\theta_2) = \\frac{x^2 + y^2 - l_1^2 - l_2^2}{2 l_1 l_2}$$

If $|\\cos(\\theta_2)| > 1$, the target is unreachable.

Then:
$$\\theta_2 = \\text{atan2}(\\sqrt{1 - \\cos^2(\\theta_2)}, \\cos(\\theta_2))$$

$$\\theta_1 = \\text{atan2}(y, x) - \\text{atan2}(l_2 \\sin(\\theta_2), l_1 + l_2 \\cos(\\theta_2))$$

The square root term gives us the two solutions; we take the positive one (elbow-up).

### Real Applications
- **Robotic arms** in factories compute IK 50+ times per second
- **Motion planners** use IK to find collision-free paths
- **VR avatars** use IK to position arms realistically when you move your hands
- **Surgical robots** use IK to reach delicate targets precisely

### Beyond 2D
For arms with 6+ joints (like industrial robots), IK becomes much harder. Solutions typically use iterative numerical methods (Jacobian transpose, FABRIK algorithm).
`,
  starterCode: `import numpy as np

def inverse_kinematics(l1: float, l2: float, x: float, y: float) -> tuple:
    """
    Compute joint angles for a 2-link planar arm to reach (x, y).
    
    Args:
        l1: Length of first link
        l2: Length of second link
        x: Target x position
        y: Target y position
    
    Returns:
        Tuple (theta1, theta2) in radians rounded to 4 decimal places.
        Return the elbow-up solution (positive theta2).
        Return (None, None) if unreachable.
    """
    # Write code here
    pass
`,
  solutionCode: `import numpy as np

def inverse_kinematics(l1: float, l2: float, x: float, y: float) -> tuple:
    dist = x**2 + y**2
    cos_theta2 = (dist - l1**2 - l2**2) / (2 * l1 * l2)
    if abs(cos_theta2) > 1:
        return (None, None)
    theta2 = np.arctan2(np.sqrt(1 - cos_theta2**2), cos_theta2)
    theta1 = np.arctan2(y, x) - np.arctan2(l2 * np.sin(theta2), l1 + l2 * np.cos(theta2))
    return (round(theta1, 4), round(theta2, 4))
`,
  testCases: [
    {
      id: 1,
      input: { l1: 1, l2: 1, x: 2, y: 0 },
      expected: [0.0, 0.0],
      description: "Fully extended along x-axis",
    },
    {
      id: 2,
      input: { l1: 1, l2: 1, x: 0, y: 2 },
      expected: [1.5708, 0.0],
      description: "Fully extended along y-axis",
    },
    {
      id: 3,
      input: { l1: 1, l2: 1, x: 1, y: 1 },
      expected: [0.7854, 0.0],
      description: "Diagonal reach — note the specific elbow-up solution",
    },
  ],
  testRunnerCode: `
import json, math
results = []
test_cases = __TEST_CASES__
for tc in test_cases:
    inp = tc["input"]
    try:
        result = inverse_kinematics(inp["l1"], inp["l2"], inp["x"], inp["y"])
        if result[0] is None:
            passed = tc["expected"][0] is None
            results.append({"id": tc["id"], "passed": bool(passed), "output": [None, None], "expected": tc["expected"]})
        else:
            result = (round(result[0], 4), round(result[1], 4))
            expected = tuple(tc["expected"])
            # Verify via FK: the angles should produce the target position
            x_check = inp["l1"] * math.cos(result[0]) + inp["l2"] * math.cos(result[0] + result[1])
            y_check = inp["l1"] * math.sin(result[0]) + inp["l2"] * math.sin(result[0] + result[1])
            passed = bool(abs(x_check - inp["x"]) < 0.05 and abs(y_check - inp["y"]) < 0.05)
            results.append({"id": tc["id"], "passed": passed, "output": list(result), "expected": [round(x_check,4), round(y_check,4)]})
    except Exception as e:
        results.append({"id": tc["id"], "passed": False, "error": str(e)})
json.dumps(results)
`,
  vizType: "inverse-kinematics",
};