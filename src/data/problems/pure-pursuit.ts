import { Problem } from "../types";

export const purePursuit: Problem = {
  id: 5,
  slug: "pure-pursuit",
  title: "Pure Pursuit Path Tracking",
  difficulty: "Medium",
  topics: ["Controls"],
  description: `### The Problem

A robot drives on a path (a curve drawn on the ground). **How much should it turn the steering wheel** to stay on the path?

**Pure Pursuit** is a simple, elegant algorithm that every autonomous vehicle uses. The strategy: pick a point ahead on the path and **steer toward it**.

---

### Real-World Use

- **Autonomous vehicles**: Lane keeping, roundabout navigation
- **Warehouse robots**: Follow predetermined paths between shelves
- **Agricultural robots**: Plow straight rows
- **Lawn mowers**: Mow in parallel lines
- **Delivery drones**: Follow GPS waypoints (modified version)

---

### The Algorithm Intuition

1. Look ahead a fixed distance $L_d$ along the path
2. Find the point on the path at that distance
3. Calculate what steering angle would make a circular arc through that point
4. Steer with that angle

It's called "Pure Pursuit" because the robot purely pursues the lookahead point — nothing fancy, just chase!

---

### Function Signature

\`\`\`python
def pure_pursuit(robot_x: float, robot_y: float, robot_theta: float,
                 goal_x: float, goal_y: float,
                 lookahead: float, wheelbase: float) -> float:
\`\`\`

| Parameter | Type | Description |
|-----------|------|-------------|
| \`robot_x\` | float | Robot's current x-position |
| \`robot_y\` | float | Robot's current y-position |
| \`robot_theta\` | float | Robot's heading angle (radians, 0 = pointing right, π/2 = pointing up) |
| \`goal_x\` | float | Lookahead point x-position (on the path) |
| \`goal_y\` | float | Lookahead point y-position (on the path) |
| \`lookahead\` | float | How far ahead to look ($L_d$, in meters or same units as position) |
| \`wheelbase\` | float | Distance from front axle to rear axle ($L$, for steering model) |

**Returns:** The steering angle $\\delta$ in radians, rounded to 4 decimal places. Positive = left turn, negative = right turn.

---

### Constraints

- $L_d > 0$ (lookahead distance must be positive)
- $L > 0$ (wheelbase must be positive)
- $-\\pi \\leq \\theta \\leq \\pi$
- Output rounded to exactly **4 decimal places**

---

### Examples

**Example 1 — Goal straight ahead**

\`\`\`
Input:  robot_x=0, robot_y=0, robot_theta=0, goal_x=2, goal_y=0, lookahead=2, wheelbase=1
Output: 0.0
\`\`\`

The goal is directly ahead. No correction needed — steer straight.

**Example 2 — Goal to the left**

\`\`\`
Input:  robot_x=0, robot_y=0, robot_theta=0, goal_x=2, goal_y=1, lookahead=2.236, wheelbase=1
Output: 0.3805
\`\`\`

The goal is ahead and slightly to the left. Turn left (positive angle) to chase it. About 0.38 radians ≈ 22°.

**Example 3 — Already heading the right way**

\`\`\`
Input:  robot_x=1, robot_y=1, robot_theta=π/4, goal_x=3, goal_y=3, lookahead=2.828, wheelbase=1.5
Output: 0.0
\`\`\`

Robot's heading already points toward the goal. No steering correction needed.

---

### Hint

Transform the goal into the robot's local coordinate frame (relative position), then use geometry to compute curvature and steering angle.
`,
  theory: `## Theory: Pure Pursuit Path Tracking

### The Problem in Context

A robot drives on a 2D plane. It follows a path (which could be a road, a line, or a sequence of waypoints). At each moment, the robot must decide: **how much to turn the steering wheel?**

You could use a complex optimal control algorithm, but Pure Pursuit is simpler, more intuitive, and works remarkably well in practice.

### The Core Idea

**Pick a lookahead point** on the path at distance $L_d$ ahead, then compute the steering angle that steers toward it.

Why a lookahead point instead of the closest point?
- **Closest point**: Would steer sharply; oscillates near the path
- **Lookahead point**: Provides "preview"; smooth, stable steering

### The Geometry

The robot has a **wheelbase** $L$ (distance from rear axle to front axle). This determines the relationship between steering angle and turning radius.

For a robot at position $(x_r, y_r)$ with heading $\\theta$ and lookahead goal at $(x_g, y_g)$:

**Step 1: Transform to local frame**

Rotate the goal into the robot's coordinate frame:

$$x_{\\text{local}} = \\cos(\\theta)(x_g - x_r) + \\sin(\\theta)(y_g - y_r)$$
$$y_{\\text{local}} = -\\sin(\\theta)(x_g - x_r) + \\cos(\\theta)(y_g - y_r)$$

Now $(x_{\\text{local}}, y_{\\text{local}})$ is the goal relative to the robot.

**Step 2: Compute curvature**

The curvature of a circle through the robot and the goal:

$$\\kappa = \\frac{2 \\times y_{\\text{local}}}{L_d^2}$$

The $y_{\\text{local}}$ tells you how far off to the side the goal is. Larger value → tighter turn needed.

**Step 3: Steering angle**

The steering angle for a car-like robot with wheelbase $L$:

$$\\delta = \\arctan(\\kappa \\times L) = \\arctan\\left(\\frac{2L \\times y_{\\text{local}}}{L_d^2}\\right)$$

This is the front wheel angle.

### Lookahead Distance Tuning

- **Small $L_d$** (e.g., 0.5 m): Tracks the path closely but oscillates, jerky steering
- **Large $L_d$** (e.g., 10 m): Smooth steering but cuts corners
- **Optimal**: Usually 1–3 times the robot's width, tuned experimentally

### Why It Works

1. **Simple**: Just geometry and one parameter to tune
2. **Stable**: The lookahead provides natural damping
3. **Robust**: Works on curves, straight lines, and corners
4. **Predictive**: The lookahead gives preview information, reducing reactive overcorrection

### Limitations

- **Sharp turns**: If the path has sharp corners and $L_d$ is large, the robot cuts the corner
- **Backwards driving**: Pure Pursuit doesn't work well for reverse motion (need to modify)
- **High-speed dynamics**: Doesn't account for vehicle dynamics (tire slip, inertia)
- **Obstacle avoidance**: Doesn't plan around obstacles; just tracks the given path

### Variants and Improvements

- **Variable lookahead**: Increase $L_d$ at high speed for stability
- **Fuzzy Pure Pursuit**: Use fuzzy logic to adapt lookahead
- **Model Predictive Control (MPC)**: Optimizes trajectory over a horizon (more complex)
- **Adaptive Velocity Control**: Slow down at curves, speed up on straights

### Real Robot Example

A delivery robot navigates a warehouse:
- The path planner gives waypoints: $(0, 0) \\to (5, 0) \\to (5, 5) \\to (0, 5)$
- Pure Pursuit computes steering every 100 ms
- At each update, it picks the lookahead point 0.5 m ahead
- The robot smoothly curves around the corner from $(5, 0)$ to $(5, 5)$
- No jerky steering, no oscillation

### Connection to Kinematics

If you know the steering angle, you can predict how the robot will move using kinematics:

$$\\dot{x} = v \\cos(\\theta)$$
$$\\dot{y} = v \\sin(\\theta)$$
$$\\dot{\\theta} = \\frac{v}{L} \\tan(\\delta)$$

Where $v$ is forward speed and $\\delta$ is the steering angle computed by Pure Pursuit.
`,
  starterCode: `import numpy as np

def pure_pursuit(robot_x: float, robot_y: float, robot_theta: float,
                 goal_x: float, goal_y: float,
                 lookahead: float, wheelbase: float) -> float:
    """
    Compute the steering angle using Pure Pursuit.
    
    Args:
        robot_x, robot_y: Robot position
        robot_theta: Robot heading in radians
        goal_x, goal_y: Lookahead point on the path
        lookahead: Lookahead distance
        wheelbase: Robot wheelbase length
    
    Returns:
        Steering angle in radians, rounded to 4 decimal places
    """
    # Write code here
    pass
`,
  solutionCode: `import numpy as np

def pure_pursuit(robot_x: float, robot_y: float, robot_theta: float,
                 goal_x: float, goal_y: float,
                 lookahead: float, wheelbase: float) -> float:
    dx = goal_x - robot_x
    dy = goal_y - robot_y
    y_local = -np.sin(robot_theta) * dx + np.cos(robot_theta) * dy
    curvature = 2 * y_local / (lookahead ** 2)
    steering = np.arctan(curvature * wheelbase)
    return round(steering, 4)
`,
  testCases: [
    {
      id: 1,
      input: {
        robot_x: 0, robot_y: 0, robot_theta: 0,
        goal_x: 2, goal_y: 0, lookahead: 2, wheelbase: 1,
      },
      expected: 0.0,
      description: "Goal straight ahead — no steering needed",
    },
    {
      id: 2,
      input: {
        robot_x: 0, robot_y: 0, robot_theta: 0,
        goal_x: 2, goal_y: 1, lookahead: 2.236, wheelbase: 1,
      },
      expected: 0.3805,
      description: "Goal to the left — steer left",
    },
    {
      id: 3,
      input: {
        robot_x: 1, robot_y: 1, robot_theta: Math.PI / 4,
        goal_x: 3, goal_y: 3, lookahead: 2.828, wheelbase: 1.5,
      },
      expected: 0.0,
      description: "Already heading toward goal — no steering",
    },
  ],
  testRunnerCode: `
import json, math
results = []
test_cases = __TEST_CASES__
for tc in test_cases:
    inp = tc["input"]
    try:
        result = pure_pursuit(inp["robot_x"], inp["robot_y"], inp["robot_theta"],
                            inp["goal_x"], inp["goal_y"], inp["lookahead"], inp["wheelbase"])
        result = round(result, 4)
        expected = tc["expected"]
        passed = bool(abs(result - expected) < 0.01)
        results.append({"id": tc["id"], "passed": passed, "output": result, "expected": expected})
    except Exception as e:
        results.append({"id": tc["id"], "passed": False, "error": str(e)})
json.dumps(results)
`,
  vizType: "pure-pursuit",
};