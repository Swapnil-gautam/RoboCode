import { Problem } from "../types";

export const pidController: Problem = {
  id: 3,
  slug: "pid-controller",
  title: "PID Controller",
  difficulty: "Easy",
  topics: ["Controls"],
  description: `### The Problem

When heating water to 80°C, you adjust the stove based on how hot it currently is, how long it's been off-target, and how quickly the temperature is changing. **A PID Controller** does exactly this automatically for any system. It takes three measurements and combines them into one control signal.

---

### Real-World Examples

- **Drone altitude**: Stays at a fixed height even with wind
- **Robot arm position**: Holds position despite load changes
- **Shower temperature**: Water temperature stays constant
- **Car cruise control**: Maintains constant speed
- **Oven temperature**: Maintains baking temperature

---

### The Three Terms Explained Simply

You want to reach a **setpoint** (target). The **error** is how far you are from it.

1. **Proportional (P)**: React to how far you are now
   - Error is 10? Apply strong correction
   - Error is 1? Apply weak correction
   - Think: "The further away, the harder you push"

2. **Integral (I)**: React to the history of errors
   - If you've been slightly off for a long time, cumulative small errors add up
   - This term helps eliminate stubborn steady-state errors
   - Think: "Have I been off-target? Then push harder over time"

3. **Derivative (D)**: React to how fast the error is changing
   - If error is shrinking fast, back off to avoid overshooting
   - If error is growing, increase the correction
   - Think: "Am I getting better or worse? Adjust accordingly"

---


### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| \`kp\` | float | Proportional gain (how hard to react to current error) |
| \`ki\` | float | Integral gain (how hard to react to accumulated error) |
| \`kd\` | float | Derivative gain (how hard to react to error change) |
| \`setpoint\` | float | Target value |
| \`current\` | float | Current measured value |
| \`integral\` | float | Accumulated integral from all previous steps |
| \`prev_error\` | float | Error from the previous time step |
| \`dt\` | float | Time elapsed since the previous step (seconds) |

**Returns:** A tuple \`(control_signal, new_integral, current_error)\`, each rounded to 4 decimal places.

---

### Constraints

- $K_p, K_i, K_d \\geq 0$ (gains are non-negative)
- $dt > 0$ (time step must be positive)
- Output values must be rounded to exactly **4 decimal places**

---

### Examples

**Example 1 — Just proportional (no I or D)**

\`\`\`
Input:  kp=1.0, ki=0.0, kd=0.0, setpoint=10.0, current=0.0, integral=0.0, prev_error=0.0, dt=0.1
Output: (10.0, 0.0, 10.0)
\`\`\`

Error is 10. With $K_p = 1$, control is $1.0 \\times 10 = 10$. No integral yet, no derivative. Apply full correction.

**Example 2 — The system is converging**

\`\`\`
Input:  kp=1.0, ki=0.5, kd=0.0, setpoint=10.0, current=8.0, integral=5.0, prev_error=3.0, dt=0.1
Output: (4.6, 5.2, 2.0)
\`\`\`

Error is now 2 (improving from 3). Control signal is smaller because we're closer. Integral grows slightly: $5.0 + 2.0 \\times 0.1 = 5.2$.

---

### Hint

The output is a sum of three terms — one per gain. Each term uses a different view of the error: current, accumulated, and changing.
`,
  theory: `## Theory: PID Control

### The Problem PID Solves

You have a system (drone, oven, robot) at some value. You want it at a target value. You have one dial (the **control signal**) to turn. How much should you turn it?

Too much → overshoots and oscillates. Too little → creeps slowly. PID automatically finds the right balance.

### The Three Terms in Detail

**1. Proportional (P)**

$$u_P = K_p \\times e(t)$$

- The larger the error, the larger the correction
- Simple, but has problems:
  - If $K_p$ is too small, it converges slowly
  - If $K_p$ is too large, it overshoots and oscillates
  - It never perfectly reaches the target (some steady-state error)

**2. Integral (I)**

$$u_I = K_i \\times \\int_0^t e(\\tau)\\,d\\tau$$

In discrete time:
$$\\text{integral}[k] = \\text{integral}[k-1] + e[k] \\times dt$$

- Watches accumulated error over time
- If you've been slightly off for a while, I term pushes harder
- Eliminates steady-state error
- Risk: Too high $K_i$ causes overshoot and instability (**integral windup**)

**3. Derivative (D)**

$$u_D = K_d \\times \\frac{de}{dt}$$

In discrete time:
$$\\frac{de}{dt} \\approx \\frac{e[k] - e[k-1]}{dt}$$

- Predicts future error by looking at the rate of change
- If error is shrinking fast, D term reduces control to prevent overshoot
- If error is growing, D term increases control
- Acts like a "damper" — stabilizes the response
- Risk: Amplifies measurement noise if not tuned carefully

### Combined Equation

$$u[k] = K_p \\times e[k] + K_i \\times \\sum_{i=0}^{k} e[i] \\times dt + K_d \\times \\frac{e[k] - e[k-1]}{dt}$$

### Typical Behaviors

- **Only P**: Converges slowly, has steady-state error, stable
- **P + I**: Reaches target (no steady-state error), but may oscillate
- **P + D**: Smooth response, reduces overshoot, but steady-state error remains
- **P + I + D**: Fast, smooth, accurate — the "Goldilocks" solution

### PID Tuning

Finding good $K_p$, $K_i$, $K_d$ is an art and science:

- **Manual tuning**: Start with P, then add I and D
- **Ziegler-Nichols method**: Systematic procedure to find tuning parameters
- **Auto-tuning**: Modern systems adjust gains automatically

A common starting point: Set $K_i$ and $K_d$ to 0, increase $K_p$ until the system oscillates, then back off. Then add I and D gradually.

### Real-World Applications in Robotics

- **Motor control**: Speed or position feedback loop
- **Drone flight**: Altitude, pitch, roll controllers all use PID
- **Robotic arm**: Joint angle control
- **Line-following robot**: Error is deviation from the line
- **Temperature control**: In manufacturing or 3D printers

### Advanced Topics

- **Anti-windup**: Clamp the integral term to prevent excessive buildup
- **Feed-forward**: Add a predictive term based on system model
- **Cascaded PID**: Multiple PID loops working together (outer loop sets target for inner loop)
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
      expected: [-3.79, 2.1, 1.0],
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
        passed = bool(all(abs(float(r) - float(e)) < 0.01 for r, e in zip(result, expected)))
        results.append({"id": tc["id"], "passed": passed, "output": list(result), "expected": expected})
    except Exception as e:
        results.append({"id": tc["id"], "passed": False, "error": str(e)})
json.dumps(results)
`,
  vizType: "pid-controller",
};