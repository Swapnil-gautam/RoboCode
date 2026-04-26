import { Problem } from "../types";

export const kalmanFilter1D: Problem = {
  id: 4,
  slug: "kalman-filter-1d",
  title: "1D Kalman Filter",
  difficulty: "Medium",
  topics: ["Localization"],
  description: `### The Problem

A robot tracks its position on a 1D line (left-right). It has **two sources of information**:

1. **Dead reckoning**: "I moved forward 1 meter, so I should be here now"
2. **Sensor reading**: "My GPS/encoder says I'm here"

But both are noisy! Dead reckoning drifts. Sensors have errors. Which should you trust?

**The Kalman Filter** is the optimal algorithm to fuse these two noisy measurements.

---

### Real-World Use

- **Self-driving cars**: Combine GPS, IMU, and wheel encoder data
- **Drone localization**: Fuse accelerometer predictions with visual/GPS measurements
- **Robot arm**: Combine motor commands with position sensors
- **Smartphone tracking**: GPS + accelerometer fusion
- **Medical devices**: Heart rate from multiple sensors

---

### The Two Steps

**Predict Step** (you think you moved):
- Update your position estimate based on your movement command
- Your uncertainty grows (you're less sure where you are)

**Update Step** (you get a sensor reading):
- Read the sensor
- Blend your prediction with the measurement (weighted by how much you trust each)
- Your uncertainty shrinks (now you're more sure)

---


### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| \`x\` | float | Current estimated position |
| \`P\` | float | Uncertainty in your estimate (variance — higher = more uncertain) |
| \`z\` | float | The sensor measurement |
| \`u\` | float | Control input / motion command (how far you commanded the robot to move) |
| \`Q\` | float | Process noise (how much uncertainty your motion adds) |
| \`R\` | float | Measurement noise (sensor accuracy — higher = noisier sensor) |

**Returns:** A tuple \`(new_x, new_P)\` — the updated position estimate and uncertainty.

---

### Constraints

- $P, Q, R > 0$ (variances must be positive)
- Output values must be rounded to exactly **4 decimal places**

---

### Examples

**Example 1 — Balanced trust**

\`\`\`
Input:  x=0, P=1, z=1, u=0, Q=0.1, R=1
Output: (0.5238, 0.5238)
\`\`\`

You think you're at 0 (uncertainty 1.0). Sensor says 1 (noise 1.0). They're equally trustworthy, so blend them: roughly 0.52. Uncertainty drops.

**Example 2 — Trust the sensor**

\`\`\`
Input:  x=10, P=100, z=5, u=0, Q=1, R=1
Output: (5.0099, 0.9901)
\`\`\`

You're very uncertain ($P = 100$). Sensor is accurate ($R = 1$). So heavily trust the sensor reading (5.0). Uncertainty drops dramatically.

**Example 3 — Trust the dead reckoning**

\`\`\`
Input:  x=5, P=0.1, z=6, u=1, Q=0.1, R=10
Output: (6.0194, 0.1942)
\`\`\`

You're confident ($P = 0.1$) and predicted well ($u = 1$). Sensor is noisy ($R = 10$). So trust your prediction more. Final estimate stays close to 6.0.

---

### Hint

The key insight: the **Kalman gain** $K$ is the blend factor. High $K$ → trust sensor. Low $K$ → trust prediction.
`,
  theory: `## Theory: The Kalman Filter

### The Core Idea

You're trying to estimate something (position, velocity, temperature) given two noisy signals:
- A **motion model** that predicts where you should be
- A **measurement** that tells you where you actually are

The **Kalman filter** is the mathematically optimal way to combine them. "Optimal" means it minimizes the expected error over time, given the noise characteristics.

### Key Insight: Uncertainty

Unlike simple averaging, the Kalman filter tracks **uncertainty (variance)** explicitly:
- If the sensor is very noisy ($R$ large) → trust it less → $K$ small
- If your motion model is accurate ($Q$ small) → trust prediction → $K$ small
- If your sensor is accurate ($R$ small) → trust it more → $K$ large
- If you're very uncertain about your current state ($P$ large) → trust sensor more → $K$ large

The beauty: this happens **automatically** through the math!

### The Algorithm: Two Steps

**Step 1: Predict** (you command motion)

$$\\hat{x}^- = \\hat{x} + u$$
$$P^- = P + Q$$

- Update position: where you think you moved to
- Grow uncertainty: because motion adds noise

**Step 2: Update** (you measure)

$$K = \\frac{P^-}{P^- + R}$$
$$\\hat{x} = \\hat{x}^- + K \\cdot (z - \\hat{x}^-)$$
$$P = (1 - K) \\cdot P^-$$

- Kalman gain: how much to trust the measurement
- Blend prediction and measurement weighted by $K$
- Shrink uncertainty: measurement gives us information

### Understanding the Kalman Gain

$$K = \\frac{P^-}{P^- + R} = \\frac{\\text{prediction uncertainty}}{\\text{total uncertainty}}$$

- If $P^-$ is very large (prediction very uncertain), $K \\approx 1$ → trust measurement
- If $R$ is very large (measurement very noisy), $K \\approx 0$ → trust prediction
- If $P^-$ and $R$ are similar, $K \\approx 0.5$ → blend equally

### Why It's Optimal

The Kalman filter **minimizes the mean squared error** (average error squared) among all linear estimators. For Gaussian noise, it's also the optimal nonlinear estimator!

### Assumptions

The Kalman filter assumes:
- **Linear system**: $x_{new} = x + u$ (works for this 1D case)
- **Gaussian noise**: Errors are normally distributed
- **Known noise**: You know $Q$ and $R$ (often from sensor specs or testing)

If these don't hold, use the **Extended Kalman Filter (EKF)** or **Unscented Kalman Filter (UKF)**.

### Real-World Noise Tuning

- **$Q$ (process noise)**: How much does your motion model drift? Higher if there's friction, wind, or model errors.
- **$R$ (measurement noise)**: How noisy is your sensor? Check the datasheet or measure empirically.

Tuning is often done experimentally — start with rough estimates and adjust until the filter behavior looks good.

### Applications in Robotics

1. **Self-driving cars**: Fuse GPS (slow, accurate) + IMU (fast, drifts) + wheel encoders
2. **Drones**: Fuse accelerometer (drifts) + gyro (noisy) + altimeter (slow)
3. **Robot localization (SLAM)**: Fuse odometry with loop closure constraints
4. **Kalman filter networks**: Multiple robots sharing sensor data
5. **Visual tracking**: Fuse predicted motion with detected object position

### Beyond 1D

For tracking in 2D or 3D (position and velocity), use the **multi-dimensional Kalman filter**, where $x$ and $P$ become vectors/matrices. The math is the same, just in higher dimensions!
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
        passed = bool(abs(result[0] - expected[0]) < 0.01 and abs(result[1] - expected[1]) < 0.01)
        results.append({"id": tc["id"], "passed": passed, "output": list(result), "expected": list(expected)})
    except Exception as e:
        results.append({"id": tc["id"], "passed": False, "error": str(e)})
json.dumps(results)
`,
  vizType: "kalman-filter",
};