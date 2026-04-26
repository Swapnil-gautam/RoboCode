import { Problem } from "../../types";

export const differentialDriveOdometry: Problem = {
  id: 8,
  slug: "differential-drive-ii",
  title: "Differential Drive II: Odometry Pose Update",
  difficulty: "Medium",
  topics: ["Localization"],
  description: `### The Problem

Once you know how wheel motion creates robot velocity, the next question is:

**"Where am I now after the wheels moved?"**

This is called **odometry**. You estimate the new robot pose $(x, y, \\theta)$ using how far the left and right wheels traveled during one time step.

---

### Real-World Use

- **Indoor robots** estimate pose between sensor updates
- **Autonomous carts** dead-reckon when GPS is unavailable
- **SLAM systems** use odometry as their motion guess

---


### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| \`x\` | float | Previous x-position |
| \`y\` | float | Previous y-position |
| \`theta\` | float | Previous heading in radians |
| \`left_distance\` | float | Distance traveled by the left wheel |
| \`right_distance\` | float | Distance traveled by the right wheel |
| \`wheelbase\` | float | Distance between the wheels |

**Returns:** A tuple \`(new_x, new_y, new_theta)\`, rounded to 4 decimal places.

---

### Core Idea

The average wheel travel gives the robot's forward movement, and the difference between the two wheels changes the heading. Use the midpoint heading to update position more accurately.

---

### Examples

**Example 1 - Straight move**

\`\`\`
Input:  x=0, y=0, theta=0, left_distance=1, right_distance=1, wheelbase=0.5
Output: (1.0, 0.0, 0.0)
\`\`\`

**Example 2 - Curved motion**

\`\`\`
Input:  x=0, y=0, theta=0, left_distance=0.5, right_distance=1.0, wheelbase=0.5
Output: (0.6582, 0.3596, 1.0)
\`\`\`
`,
  theory: `## Theory: Differential Drive Odometry

### What Odometry Does

Odometry estimates robot motion from wheel movement alone. It is one of the first localization tools every roboticist learns.

### The Two Pieces

**Translation** — average the wheel distances:

$$d = \\frac{d_r + d_l}{2}$$

**Rotation** — compare the difference:

$$\\Delta\\theta = \\frac{d_r - d_l}{L}$$

### Midpoint Integration

If the robot turns during the step, using the old heading alone is slightly inaccurate.

So we use:

$$\\theta_{mid} = \\theta + \\frac{\\Delta\\theta}{2}$$

Then:

$$x_{new} = x + d \\cos(\\theta_{mid})$$
$$y_{new} = y + d \\sin(\\theta_{mid})$$
$$\\theta_{new} = \\theta + \\Delta\\theta$$

### Why This Matters

Odometry is:
- fast
- always available if wheel encoders exist
- useful as a prediction step

But it also drifts over time because wheel slip and modeling errors accumulate. That is why later systems combine odometry with Kalman filters, particle filters, and SLAM.
`,
  starterCode: `import numpy as np

def differential_drive_odometry(x: float, y: float, theta: float,
                                left_distance: float, right_distance: float,
                                wheelbase: float) -> tuple:
    """
    Estimate the new robot pose after one odometry step.

    Returns:
        Tuple (new_x, new_y, new_theta) rounded to 4 decimal places
    """
    # Write code here
    pass
`,
  solutionCode: `import numpy as np

def differential_drive_odometry(x: float, y: float, theta: float,
                                left_distance: float, right_distance: float,
                                wheelbase: float) -> tuple:
    distance = (left_distance + right_distance) / 2
    delta_theta = (right_distance - left_distance) / wheelbase
    theta_mid = theta + delta_theta / 2

    new_x = x + distance * np.cos(theta_mid)
    new_y = y + distance * np.sin(theta_mid)
    new_theta = theta + delta_theta

    return (round(new_x, 4), round(new_y, 4), round(new_theta, 4))
`,
  testCases: [
    {
      id: 1,
      input: {
        x: 0,
        y: 0,
        theta: 0,
        left_distance: 1,
        right_distance: 1,
        wheelbase: 0.5,
      },
      expected: [1.0, 0.0, 0.0],
      description: "Equal wheel travel keeps heading unchanged",
    },
    {
      id: 2,
      input: {
        x: 0,
        y: 0,
        theta: 0,
        left_distance: 0.5,
        right_distance: 1.0,
        wheelbase: 0.5,
      },
      expected: [0.6582, 0.3596, 1.0],
      description: "Longer right wheel travel produces a left arc",
    },
    {
      id: 3,
      input: {
        x: 1,
        y: 1,
        theta: Math.PI / 2,
        left_distance: 0.2,
        right_distance: 0.2,
        wheelbase: 0.4,
      },
      expected: [1.0, 1.2, 1.5708],
      description: "Straight motion while facing upward increases y",
    },
  ],
  testRunnerCode: `
import json
results = []
test_cases = __TEST_CASES__
for tc in test_cases:
    inp = tc["input"]
    try:
        result = differential_drive_odometry(inp["x"], inp["y"], inp["theta"],
                                             inp["left_distance"], inp["right_distance"],
                                             inp["wheelbase"])
        result = tuple(round(v, 4) for v in result)
        expected = tuple(tc["expected"])
        passed = bool(
            abs(result[0] - expected[0]) < 0.001 and
            abs(result[1] - expected[1]) < 0.001 and
            abs(result[2] - expected[2]) < 0.001
        )
        results.append({"id": tc["id"], "passed": passed, "output": list(result), "expected": list(expected)})
    except Exception as e:
        results.append({"id": tc["id"], "passed": False, "error": str(e)})
json.dumps(results)
`,
  vizType: "differential-drive-ii",
};
