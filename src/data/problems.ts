import { Problem } from "./types";

export const problems: Problem[] = [
  {
    id: 1,
    slug: "forward-kinematics",
    title: "Forward Kinematics (2-Link Arm)",
    difficulty: "Easy",
    topics: ["Kinematics"],
    description: `## Forward Kinematics (2-Link Arm)

Given a 2-link planar robot arm with link lengths $l_1$ and $l_2$, and joint angles $\\theta_1$ and $\\theta_2$, compute the **(x, y)** position of the end-effector.

### Formulas

The end-effector position is calculated as:

$$x = l_1 \\cos(\\theta_1) + l_2 \\cos(\\theta_1 + \\theta_2)$$

$$y = l_1 \\sin(\\theta_1) + l_2 \\sin(\\theta_1 + \\theta_2)$$

### Function Signature

\`\`\`python
def forward_kinematics(l1: float, l2: float, theta1: float, theta2: float) -> tuple[float, float]:
\`\`\`

**Parameters:**
- \`l1\`: Length of the first link
- \`l2\`: Length of the second link  
- \`theta1\`: Angle of the first joint (radians)
- \`theta2\`: Angle of the second joint (radians, relative to first link)

**Returns:** A tuple \`(x, y)\` — the end-effector position, each rounded to 4 decimal places.
`,
    theory: `## Theory: Forward Kinematics

**Forward kinematics** is the problem of determining the position and orientation of the end-effector given the joint parameters (angles or displacements).

### Why It Matters
In robotics, knowing where the tool tip or gripper ends up based on joint commands is fundamental to controlling a robot arm. Every motion planning algorithm depends on FK.

### 2-Link Planar Arm

Consider a robot arm in the 2D plane with two revolute joints:

- **Joint 1** is at the origin, rotates by $\\theta_1$
- **Joint 2** is at the end of link 1, rotates by $\\theta_2$ relative to link 1

The position of the elbow (joint 2):

$$x_1 = l_1 \\cos(\\theta_1), \\quad y_1 = l_1 \\sin(\\theta_1)$$

The position of the end-effector:

$$x = l_1 \\cos(\\theta_1) + l_2 \\cos(\\theta_1 + \\theta_2)$$
$$y = l_1 \\sin(\\theta_1) + l_2 \\sin(\\theta_1 + \\theta_2)$$

### Generalization
For N-link arms, this extends using **Denavit-Hartenberg (DH) parameters** and homogeneous transformation matrices.
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
        passed = abs(result[0] - expected[0]) < 1e-3 and abs(result[1] - expected[1]) < 1e-3
        results.append({"id": tc["id"], "passed": passed, "output": list(result), "expected": list(expected)})
    except Exception as e:
        results.append({"id": tc["id"], "passed": False, "error": str(e)})
json.dumps(results)
`,
    vizType: "forward-kinematics",
  },
  {
    id: 2,
    slug: "inverse-kinematics",
    title: "Inverse Kinematics (2-Link Arm)",
    difficulty: "Medium",
    topics: ["Kinematics"],
    description: `## Inverse Kinematics (2-Link Arm)

Given a 2-link planar robot arm with link lengths $l_1$ and $l_2$, compute the joint angles $\\theta_1$ and $\\theta_2$ needed to reach a target position $(x, y)$.

### Approach

Using the **law of cosines**, we can solve for $\\theta_2$ first:

$$\\cos(\\theta_2) = \\frac{x^2 + y^2 - l_1^2 - l_2^2}{2 \\cdot l_1 \\cdot l_2}$$

Then $\\theta_1$ is found using:

$$\\theta_1 = \\text{atan2}(y, x) - \\text{atan2}(l_2 \\sin(\\theta_2),\\ l_1 + l_2 \\cos(\\theta_2))$$

### Function Signature

\`\`\`python
def inverse_kinematics(l1: float, l2: float, x: float, y: float) -> tuple[float, float]:
\`\`\`

**Parameters:**
- \`l1\`, \`l2\`: Link lengths
- \`x\`, \`y\`: Target end-effector position

**Returns:** A tuple \`(theta1, theta2)\` in radians, rounded to 4 decimal places. Return the **elbow-up** solution (positive $\\theta_2$).

If the target is unreachable, return \`(None, None)\`.
`,
    theory: `## Theory: Inverse Kinematics

**Inverse kinematics (IK)** is the reverse of FK: given a desired end-effector position, find the joint angles that achieve it.

### Why It's Harder Than FK
- FK has a **unique** solution (one set of angles → one position)
- IK can have **multiple solutions** (elbow-up vs elbow-down), **no solutions** (unreachable), or **infinite solutions** (redundant robots)

### 2-Link Analytical Solution

For a 2-link planar arm reaching target $(x, y)$:

1. **Check reachability**: The target must satisfy $|l_1 - l_2| \\leq \\sqrt{x^2 + y^2} \\leq l_1 + l_2$

2. **Solve for $\\theta_2$** using the law of cosines:
$$c_2 = \\frac{x^2 + y^2 - l_1^2 - l_2^2}{2 l_1 l_2}$$
$$\\theta_2 = \\text{atan2}(\\pm\\sqrt{1 - c_2^2},\\ c_2)$$

3. **Solve for $\\theta_1$**:
$$\\theta_1 = \\text{atan2}(y, x) - \\text{atan2}(l_2 s_2,\\ l_1 + l_2 c_2)$$

The $\\pm$ gives two solutions: elbow-up and elbow-down.

### Beyond 2D
For 3D robots with 6+ DOF, numerical methods (Jacobian inverse, gradient descent) are typically used.
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
            results.append({"id": tc["id"], "passed": passed, "output": [None, None], "expected": tc["expected"]})
        else:
            result = (round(result[0], 4), round(result[1], 4))
            expected = tuple(tc["expected"])
            # Verify via FK: the angles should produce the target position
            x_check = inp["l1"] * math.cos(result[0]) + inp["l2"] * math.cos(result[0] + result[1])
            y_check = inp["l1"] * math.sin(result[0]) + inp["l2"] * math.sin(result[0] + result[1])
            passed = abs(x_check - inp["x"]) < 0.05 and abs(y_check - inp["y"]) < 0.05
            results.append({"id": tc["id"], "passed": passed, "output": list(result), "expected": [round(x_check,4), round(y_check,4)]})
    except Exception as e:
        results.append({"id": tc["id"], "passed": False, "error": str(e)})
json.dumps(results)
`,
    vizType: "inverse-kinematics",
  },
  {
    id: 3,
    slug: "pid-controller",
    title: "PID Controller",
    difficulty: "Easy",
    topics: ["Controls"],
    description: `## PID Controller

Implement a **PID (Proportional-Integral-Derivative) controller** that computes a control signal to drive a system to a desired setpoint.

### PID Formula

$$u(t) = K_p \\cdot e(t) + K_i \\cdot \\int_0^t e(\\tau)\\,d\\tau + K_d \\cdot \\frac{de(t)}{dt}$$

where $e(t) = \\text{setpoint} - \\text{current\\_value}$ is the error.

In discrete form:

$$u[k] = K_p \\cdot e[k] + K_i \\cdot \\sum_{i=0}^{k} e[i] \\cdot dt + K_d \\cdot \\frac{e[k] - e[k-1]}{dt}$$

### Function Signature

\`\`\`python
def pid_step(kp: float, ki: float, kd: float, setpoint: float, 
             current: float, integral: float, prev_error: float, 
             dt: float) -> tuple[float, float, float]:
\`\`\`

**Parameters:**
- \`kp\`, \`ki\`, \`kd\`: PID gains
- \`setpoint\`: Target value
- \`current\`: Current measured value
- \`integral\`: Accumulated integral term from previous steps
- \`prev_error\`: Error from the previous time step
- \`dt\`: Time step size

**Returns:** A tuple \`(control_signal, new_integral, current_error)\`
`,
    theory: `## Theory: PID Control

**PID control** is the most widely used control strategy in industry and robotics. It computes a corrective action based on three terms:

### The Three Terms

1. **Proportional (P)**: Reacts to the *current* error
   - $u_P = K_p \\cdot e(t)$
   - Larger error → larger correction
   - Too high → oscillation

2. **Integral (I)**: Reacts to *accumulated* error over time
   - $u_I = K_i \\cdot \\int e(t)\\,dt$
   - Eliminates steady-state error
   - Too high → overshoot and instability

3. **Derivative (D)**: Reacts to the *rate of change* of error
   - $u_D = K_d \\cdot \\frac{de}{dt}$
   - Dampens oscillations, predicts future error
   - Too high → noise amplification

### Tuning
Finding good $K_p$, $K_i$, $K_d$ values is called **PID tuning**. Common methods include Ziegler-Nichols and manual tuning.

### Applications in Robotics
- Motor speed/position control
- Drone altitude and attitude hold
- Line-following robots
- Temperature regulation
`,
    starterCode: `import numpy as np

def pid_step(kp: float, ki: float, kd: float, setpoint: float,
             current: float, integral: float, prev_error: float,
             dt: float) -> tuple:
    """
    Compute one step of a PID controller.
    
    Args:
        kp, ki, kd: PID gains
        setpoint: Desired target value
        current: Current measured value
        integral: Accumulated integral from previous steps
        prev_error: Error from the previous step
        dt: Time step
    
    Returns:
        Tuple (control_signal, new_integral, current_error)
    """
    # Write code here
    pass
`,
    solutionCode: `import numpy as np

def pid_step(kp: float, ki: float, kd: float, setpoint: float,
             current: float, integral: float, prev_error: float,
             dt: float) -> tuple:
    error = setpoint - current
    new_integral = integral + error * dt
    derivative = (error - prev_error) / dt
    control = kp * error + ki * new_integral + kd * derivative
    return (round(control, 4), round(new_integral, 4), round(error, 4))
`,
    testCases: [
      {
        id: 1,
        input: {
          kp: 1.0, ki: 0.0, kd: 0.0, setpoint: 10.0,
          current: 0.0, integral: 0.0, prev_error: 0.0, dt: 0.1,
        },
        expected: [10.0, 0.0, 10.0],
        description: "Pure P control — error of 10 with Kp=1",
      },
      {
        id: 2,
        input: {
          kp: 1.0, ki: 0.5, kd: 0.0, setpoint: 10.0,
          current: 8.0, integral: 5.0, prev_error: 3.0, dt: 0.1,
        },
        expected: [4.6, 5.2, 2.0],
        description: "PI control with accumulated integral",
      },
      {
        id: 3,
        input: {
          kp: 1.0, ki: 0.1, kd: 0.5, setpoint: 10.0,
          current: 9.0, integral: 2.0, prev_error: 2.0, dt: 0.1,
        },
        expected: ["-4.79", 2.1, 1.0],
        description: "Full PID with derivative damping",
      },
    ],
    testRunnerCode: `
import json
results = []
test_cases = __TEST_CASES__
for tc in test_cases:
    inp = tc["input"]
    try:
        result = pid_step(inp["kp"], inp["ki"], inp["kd"], inp["setpoint"],
                         inp["current"], inp["integral"], inp["prev_error"], inp["dt"])
        result = (round(result[0], 4), round(result[1], 4), round(result[2], 4))
        expected = tc["expected"]
        passed = all(abs(float(r) - float(e)) < 0.01 for r, e in zip(result, expected))
        results.append({"id": tc["id"], "passed": passed, "output": list(result), "expected": expected})
    except Exception as e:
        results.append({"id": tc["id"], "passed": False, "error": str(e)})
json.dumps(results)
`,
    vizType: "pid-controller",
  },
  {
    id: 4,
    slug: "kalman-filter-1d",
    title: "1D Kalman Filter",
    difficulty: "Medium",
    topics: ["Localization"],
    description: `## 1D Kalman Filter

Implement a single **predict-update** step of a 1D Kalman filter.

### Predict Step

$$\\hat{x}^- = \\hat{x} + u$$
$$P^- = P + Q$$

### Update Step

$$K = \\frac{P^-}{P^- + R}$$
$$\\hat{x} = \\hat{x}^- + K \\cdot (z - \\hat{x}^-)$$
$$P = (1 - K) \\cdot P^-$$

### Function Signature

\`\`\`python
def kalman_1d(x: float, P: float, z: float, u: float, 
              Q: float, R: float) -> tuple[float, float]:
\`\`\`

**Parameters:**
- \`x\`: Current state estimate
- \`P\`: Current estimate uncertainty (variance)
- \`z\`: Measurement
- \`u\`: Control input (motion)
- \`Q\`: Process noise variance
- \`R\`: Measurement noise variance

**Returns:** A tuple \`(new_x, new_P)\` — the updated state estimate and uncertainty, rounded to 4 decimal places.
`,
    theory: `## Theory: Kalman Filter

The **Kalman filter** is an optimal estimator for linear systems with Gaussian noise. It's the foundation of robot localization and sensor fusion.

### The Big Idea
We have two sources of information, both noisy:
1. **Prediction** from a motion model (where we think we are)
2. **Measurement** from a sensor (what we observe)

The Kalman filter **optimally fuses** these using their uncertainties.

### 1D Case

**State**: position $x$ with uncertainty $P$

**Predict** (move):
- $\\hat{x}^- = \\hat{x} + u$ (update position with control)
- $P^- = P + Q$ (uncertainty grows)

**Update** (measure):
- $K = P^- / (P^- + R)$ — Kalman gain (how much to trust measurement)
- $\\hat{x} = \\hat{x}^- + K(z - \\hat{x}^-)$ — fuse prediction and measurement
- $P = (1-K) P^-$ — uncertainty shrinks

### Key Insight
- If sensor is very accurate ($R$ small) → $K \\approx 1$ → trust measurement
- If model is very accurate ($Q$ small) → $K \\approx 0$ → trust prediction

### Applications
- GPS + IMU fusion for self-driving cars
- Robot localization (SLAM)
- Tracking objects in computer vision
`,
    starterCode: `import numpy as np

def kalman_1d(x: float, P: float, z: float, u: float,
              Q: float, R: float) -> tuple:
    """
    Perform one predict-update cycle of a 1D Kalman filter.
    
    Args:
        x: Current state estimate
        P: Current uncertainty (variance)
        z: Measurement value
        u: Control input (motion)
        Q: Process noise variance
        R: Measurement noise variance
    
    Returns:
        Tuple (new_x, new_P) rounded to 4 decimal places
    """
    # Write code here
    pass
`,
    solutionCode: `import numpy as np

def kalman_1d(x: float, P: float, z: float, u: float,
              Q: float, R: float) -> tuple:
    # Predict
    x_pred = x + u
    P_pred = P + Q
    # Update
    K = P_pred / (P_pred + R)
    x_new = x_pred + K * (z - x_pred)
    P_new = (1 - K) * P_pred
    return (round(x_new, 4), round(P_new, 4))
`,
    testCases: [
      {
        id: 1,
        input: { x: 0, P: 1, z: 1, u: 0, Q: 0.1, R: 1 },
        expected: [0.5238, 0.5238],
        description: "Equal-ish trust in prediction and measurement",
      },
      {
        id: 2,
        input: { x: 5, P: 0.1, z: 6, u: 1, Q: 0.1, R: 10 },
        expected: [6.0194, 0.1942],
        description: "Very noisy sensor — trust the prediction more",
      },
      {
        id: 3,
        input: { x: 10, P: 100, z: 5, u: 0, Q: 1, R: 1 },
        expected: [5.0099, 0.9901],
        description: "Very uncertain state — trust the sensor more",
      },
    ],
    testRunnerCode: `
import json
results = []
test_cases = __TEST_CASES__
for tc in test_cases:
    inp = tc["input"]
    try:
        result = kalman_1d(inp["x"], inp["P"], inp["z"], inp["u"], inp["Q"], inp["R"])
        result = (round(result[0], 4), round(result[1], 4))
        expected = tuple(tc["expected"])
        passed = abs(result[0] - expected[0]) < 0.01 and abs(result[1] - expected[1]) < 0.01
        results.append({"id": tc["id"], "passed": passed, "output": list(result), "expected": list(expected)})
    except Exception as e:
        results.append({"id": tc["id"], "passed": False, "error": str(e)})
json.dumps(results)
`,
    vizType: "kalman-filter",
  },
  {
    id: 5,
    slug: "pure-pursuit",
    title: "Pure Pursuit Path Tracking",
    difficulty: "Medium",
    topics: ["Controls"],
    description: `## Pure Pursuit Path Tracking

Implement the **Pure Pursuit** algorithm to compute the steering angle for a robot following a path.

### Algorithm

Given the robot's position $(x_r, y_r)$ with heading $\\theta$, and a lookahead point $(x_g, y_g)$ on the path at distance $L_d$:

1. Transform the goal to the robot's local frame:
$$x_{local} = \\cos(\\theta)(x_g - x_r) + \\sin(\\theta)(y_g - y_r)$$
$$y_{local} = -\\sin(\\theta)(x_g - x_r) + \\cos(\\theta)(y_g - y_r)$$

2. Compute the curvature:
$$\\kappa = \\frac{2 \\cdot y_{local}}{L_d^2}$$

3. Compute the steering angle (for a robot with wheelbase $L$):
$$\\delta = \\arctan(\\kappa \\cdot L)$$

### Function Signature

\`\`\`python
def pure_pursuit(robot_x: float, robot_y: float, robot_theta: float,
                 goal_x: float, goal_y: float, 
                 lookahead: float, wheelbase: float) -> float:
\`\`\`

**Returns:** The steering angle $\\delta$ in radians, rounded to 4 decimal places.
`,
    theory: `## Theory: Pure Pursuit

**Pure Pursuit** is a geometric path-tracking algorithm widely used in autonomous vehicles and mobile robots.

### Core Idea
The robot always steers toward a **lookahead point** on the path that is a fixed distance ahead. This creates smooth, stable tracking behavior.

### How It Works
1. Find the point on the path that is exactly $L_d$ (lookahead distance) away
2. Compute the arc that connects the robot to that point  
3. Steer along that arc

### Lookahead Distance
- **Short lookahead** → tight tracking, but oscillation near the path
- **Long lookahead** → smooth tracking, but cuts corners

### Why "Pure Pursuit"?
The robot purely pursues the lookahead point — like a dog chasing a ball that keeps moving along the path.

### The Math
The key insight is that the curvature $\\kappa = 2y_{local}/L_d^2$ comes from fitting a circular arc through the robot's position and the lookahead point. The $y_{local}$ component tells us how far off to the side the goal is.

### Applications
- Self-driving car lane following
- Warehouse robot navigation
- Agricultural robot path tracking
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
        passed = abs(result - expected) < 0.01
        results.append({"id": tc["id"], "passed": passed, "output": result, "expected": expected})
    except Exception as e:
        results.append({"id": tc["id"], "passed": False, "error": str(e)})
json.dumps(results)
`,
    vizType: "pure-pursuit",
  },
];

export function getProblemBySlug(slug: string): Problem | undefined {
  return problems.find((p) => p.slug === slug);
}
