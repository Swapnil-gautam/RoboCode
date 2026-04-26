import { Problem } from "../../types";

export const coordinateFrames: Problem = {
  id: 6,
  slug: "coordinate-frames",
  title: "Coordinate Frames",
  difficulty: "Easy",
  topics: ["Kinematics"],
  description: `### The Problem

A robot sees the world from **its own point of view**.

If a sensor says "the object is 2 meters in front of me and 1 meter to my left," that measurement is usually expressed in a **local frame**, not the world frame.

For **this problem**, we will make one simplifying assumption:

- the sensor frame is **aligned with the robot frame**

So if the camera or lidar reports a point, you may treat it as a point in the **robot frame**.

Later, in more advanced problems, you can handle the harder case where:
- sensor frame != robot frame
- robot frame != world frame

But here we only solve: **robot frame → world frame**.

---

### Real-World Use

- **Mobile robots** convert sensor detections into map coordinates
- **Robot arms** convert tool offsets into workspace positions
- **Self-driving cars** convert radar and camera points into world space

---

### What You'll Compute

You are given:
- The robot's world pose: $(x, y, \\theta)$
- A point in the robot's local frame: $(x_{local}, y_{local})$

You must compute the point's **world coordinates** $(x_{world}, y_{world})$.

---


### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| \`robot_x\` | float | Robot x-position in the world frame |
| \`robot_y\` | float | Robot y-position in the world frame |
| \`robot_theta\` | float | Robot heading in radians |
| \`local_x\` | float | Point x-coordinate in the robot frame |
| \`local_y\` | float | Point y-coordinate in the robot frame |

**Returns:** A tuple \`(world_x, world_y)\`, rounded to 4 decimal places.

---

### Examples

**Example 1 - Robot facing right**

\`\`\`
Input:  robot_x=0, robot_y=0, robot_theta=0, local_x=2, local_y=1
Output: (2.0, 1.0)
\`\`\`

The robot frame matches the world frame, so the point stays the same.

**Example 2 - Robot facing upward**

\`\`\`
Input:  robot_x=1, robot_y=2, robot_theta=pi/2, local_x=1, local_y=0
Output: (1.0, 3.0)
\`\`\`

The local "forward" direction points upward in the world frame.

---

### Step-by-Step Intuition

Think of the local point as an arrow drawn on the robot:

1. Start with the point in the **robot frame**
2. Rotate that arrow by the robot heading $\\theta$
3. Shift it by the robot's world position $(x, y)$

That gives the point in the **world frame**.

---

### Hint

Rotate the local point by the robot heading, then add the robot's world position.
`,
  theory: `## Theory: Coordinate Frames

### Why Frames Matter

Robots almost never work in just one coordinate system.

- The **world frame** is fixed to the map
- The **robot frame** moves with the robot
- A **sensor frame** moves with the sensor

If you cannot transform points between frames, you cannot build maps, track objects, or navigate reliably.

### Important Assumption In This Problem

Real robots often have:

$$\\text{sensor frame} \\rightarrow \\text{robot frame} \\rightarrow \\text{world frame}$$

But in this beginner problem, we assume the sensor is already aligned with the robot frame.

So the input point is:

$$
\\mathbf{p}_{local} =
\\begin{bmatrix}
x_{local} \\\\
y_{local}
\\end{bmatrix}
$$

and we want:

$$
\\mathbf{p}_{world} =
\\begin{bmatrix}
x_{world} \\\\
y_{world}
\\end{bmatrix}
$$

### Rotation + Translation

To move a point from the robot frame into the world frame:

1. **Rotate** it by the robot heading $\\theta$
2. **Translate** it by the robot position $(x, y)$

Written with matrices:

$$
\\mathbf{p}_{world}
=
\\begin{bmatrix}
x_{robot} \\\\
y_{robot}
\\end{bmatrix}
+
\\begin{bmatrix}
\\cos(\\theta) & -\\sin(\\theta) \\\\
\\sin(\\theta) & \\cos(\\theta)
\\end{bmatrix}
\\begin{bmatrix}
x_{local} \\\\
y_{local}
\\end{bmatrix}
$$

This says:

- the matrix rotates the local point into the world orientation
- then the robot position shifts that rotated point into the correct world location

### Where Do The Two Scalar Formulas Come From?

Multiply the matrix by the local point:

$$
\\begin{bmatrix}
\\cos(\\theta) & -\\sin(\\theta) \\\\
\\sin(\\theta) & \\cos(\\theta)
\\end{bmatrix}
\\begin{bmatrix}
x_{local} \\\\
y_{local}
\\end{bmatrix}
=
\\begin{bmatrix}
\\cos(\\theta)x_{local} - \\sin(\\theta)y_{local} \\\\
\\sin(\\theta)x_{local} + \\cos(\\theta)y_{local}
\\end{bmatrix}
$$

Then add the robot position:

$$
x_{world}
=
x_{robot}
+
\\cos(\\theta)x_{local}
- \\sin(\\theta)y_{local}
$$

$$
y_{world}
=
y_{robot}
+
\\sin(\\theta)x_{local}
+ \\cos(\\theta)y_{local}
$$

### Intuition

- If $\\theta = 0$, the robot frame and world frame point the same way, so only translation matters
- If $\\theta = \\pi/2$, the robot's forward direction points upward in the world
- The local x-axis contribution rotates into the world
- The local y-axis contribution also rotates into the world
- The translation shifts the rotated point so it is anchored at the robot's actual world pose

### A Useful Mental Model

Imagine holding an arrow drawn on a small piece of paper:

1. First, **rotate the paper**
2. Then **move the paper** somewhere else on the table

The arrow itself did not change in the local frame.
Only its orientation and position in the world changed.

### Why This Shows Up Everywhere

- **Localization**: converting observations into map coordinates
- **SLAM**: connecting local scans to global maps
- **Manipulation**: moving between base frame, wrist frame, and tool frame
`,
  starterCode: `import numpy as np

def transform_point(robot_x: float, robot_y: float, robot_theta: float,
                    local_x: float, local_y: float) -> tuple:
    """
    Transform a point from the robot frame into the world frame.

    Returns:
        Tuple (world_x, world_y) rounded to 4 decimal places
    """
    # Write code here
    pass
`,
  solutionCode: `import numpy as np

def transform_point(robot_x: float, robot_y: float, robot_theta: float,
                    local_x: float, local_y: float) -> tuple:
    world_x = robot_x + np.cos(robot_theta) * local_x - np.sin(robot_theta) * local_y
    world_y = robot_y + np.sin(robot_theta) * local_x + np.cos(robot_theta) * local_y
    return (round(world_x, 4), round(world_y, 4))
`,
  testCases: [
    {
      id: 1,
      input: { robot_x: 0, robot_y: 0, robot_theta: 0, local_x: 2, local_y: 1 },
      expected: [2.0, 1.0],
      description: "No rotation - local and world frames align",
    },
    {
      id: 2,
      input: {
        robot_x: 1,
        robot_y: 2,
        robot_theta: Math.PI / 2,
        local_x: 1,
        local_y: 0,
      },
      expected: [1.0, 3.0],
      description: "Robot facing upward - forward local motion becomes world +y",
    },
    {
      id: 3,
      input: {
        robot_x: -2,
        robot_y: 1,
        robot_theta: Math.PI,
        local_x: 1,
        local_y: -1,
      },
      expected: [-3.0, 2.0],
      description: "180-degree rotation flips the local axes",
    },
  ],
  testRunnerCode: `
import json
results = []
test_cases = __TEST_CASES__
for tc in test_cases:
    inp = tc["input"]
    try:
        result = transform_point(inp["robot_x"], inp["robot_y"], inp["robot_theta"],
                                 inp["local_x"], inp["local_y"])
        result = (round(result[0], 4), round(result[1], 4))
        expected = tuple(tc["expected"])
        passed = bool(abs(result[0] - expected[0]) < 0.001 and abs(result[1] - expected[1]) < 0.001)
        results.append({"id": tc["id"], "passed": passed, "output": list(result), "expected": list(expected)})
    except Exception as e:
        results.append({"id": tc["id"], "passed": False, "error": str(e)})
json.dumps(results)
`,
  vizType: "coordinate-frames",
};
