import { Problem } from "../../types";

export const differentialDrive: Problem = {
  id: 7,
  slug: "differential-drive",
  title: "Differential Drive",
  difficulty: "Easy",
  topics: ["Kinematics"],
  description: `### The Problem

Many robots have **two powered wheels**: one on the left and one on the right. By spinning those wheels at different speeds, the robot can go straight, turn, or spin in place.

Your job is to compute the robot's:
- **linear velocity** $v$ - how fast it moves forward
- **angular velocity** $\\omega$ - how fast it rotates

---

### Real-World Use

- **Warehouse robots**
- **Line-following robots**
- **Educational robots** like TurtleBot-style platforms
- **Indoor delivery robots**

---


### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| \`left_w\` | float | Left wheel angular speed in rad/s |
| \`right_w\` | float | Right wheel angular speed in rad/s |
| \`wheel_radius\` | float | Wheel radius |
| \`wheelbase\` | float | Distance between the wheels |

**Returns:** A tuple \`(v, omega)\`, rounded to 4 decimal places.

---


### Examples

**Example 1 - Straight motion**

\`\`\`
Input:  left_w=1, right_w=1, wheel_radius=0.1, wheelbase=0.5
Output: (0.1, 0.0)
\`\`\`

Both wheels move at the same speed, so the robot goes straight.

**Example 2 - Spin in place**

\`\`\`
Input:  left_w=-1, right_w=1, wheel_radius=0.2, wheelbase=0.4
Output: (0.0, 1.0)
\`\`\`

The wheels move in opposite directions, so the robot rotates without translating.
`,
  theory: `## Theory: Differential Drive

### Why This Model Matters

Differential drive is one of the most important mobile robot models. It appears everywhere because it is:

- simple to build
- easy to control
- easy to reason about

### Motion Cases

- **Left wheel = right wheel**: move straight
- **Right wheel faster than left**: turn left
- **Left wheel faster than right**: turn right
- **Equal and opposite wheel speeds**: spin in place

### The Geometry

Each wheel contributes to the robot's motion.

First convert each wheel's angular speed to a linear speed:

$$v_l = r \\cdot \\omega_l$$
$$v_r = r \\cdot \\omega_r$$

Then combine:

$$v = \\frac{v_r + v_l}{2}$$
$$\\omega = \\frac{v_r - v_l}{L}$$

- The average wheel speed determines **forward motion**
- The wheel speed difference determines **rotation**

This is the foundation for:
- odometry
- path tracking
- wheel controller design
- mobile robot simulation
`,
  starterCode: `import numpy as np

def differential_drive_kinematics(left_w: float, right_w: float,
                                  wheel_radius: float, wheelbase: float) -> tuple:
    """
    Compute the robot's linear and angular velocity.

    Returns:
        Tuple (v, omega) rounded to 4 decimal places
    """
    # Write code here
    pass
`,
  solutionCode: `import numpy as np

def differential_drive_kinematics(left_w: float, right_w: float,
                                  wheel_radius: float, wheelbase: float) -> tuple:
    v_l = wheel_radius * left_w
    v_r = wheel_radius * right_w
    v = (v_l + v_r) / 2
    omega = (v_r - v_l) / wheelbase
    return (round(v, 4), round(omega, 4))
`,
  testCases: [
    {
      id: 1,
      input: { left_w: 1, right_w: 1, wheel_radius: 0.1, wheelbase: 0.5 },
      expected: [0.1, 0.0],
      description: "Equal wheel speeds produce straight motion",
    },
    {
      id: 2,
      input: { left_w: 0, right_w: 2, wheel_radius: 0.1, wheelbase: 0.5 },
      expected: [0.1, 0.4],
      description: "Right wheel faster than left produces a left turn",
    },
    {
      id: 3,
      input: { left_w: -1, right_w: 1, wheel_radius: 0.2, wheelbase: 0.4 },
      expected: [0.0, 1.0],
      description: "Opposite wheel speeds create a pure rotation",
    },
  ],
  testRunnerCode: `
import json
results = []
test_cases = __TEST_CASES__
for tc in test_cases:
    inp = tc["input"]
    try:
        result = differential_drive_kinematics(inp["left_w"], inp["right_w"],
                                               inp["wheel_radius"], inp["wheelbase"])
        result = (round(result[0], 4), round(result[1], 4))
        expected = tuple(tc["expected"])
        passed = bool(abs(result[0] - expected[0]) < 0.001 and abs(result[1] - expected[1]) < 0.001)
        results.append({"id": tc["id"], "passed": passed, "output": list(result), "expected": list(expected)})
    except Exception as e:
        results.append({"id": tc["id"], "passed": False, "error": str(e)})
json.dumps(results)
`,
  vizType: "differential-drive",
};
