import { Problem } from "../../types";

export const finiteStateMachine: Problem = {
  id: 10,
  slug: "finite-state-machine",
  title: "Finite State Machine",
  difficulty: "Easy",
  topics: ["Decision Making"],
  description: `### The Problem

Robots do not just compute numbers. They also make **behavior decisions**.

A very common tool for this is a **finite state machine (FSM)**. The robot is always in one state, and events tell it when to switch to another state.

In this problem, you will implement the next-state logic for a small delivery robot.

---

### Robot States

- \`IDLE\`
- \`NAVIGATING\`
- \`AVOIDING_OBSTACLE\`
- \`DOCKING\`
- \`CHARGING\`

### Events

- \`start_mission\`
- \`obstacle_detected\`
- \`path_cleared\`
- \`battery_low\`
- \`dock_reached\`
- \`charged\`

Use these transitions:

| Current State | Event | Next State |
|---|---|---|
| \`IDLE\` | \`start_mission\` | \`NAVIGATING\` |
| \`NAVIGATING\` | \`obstacle_detected\` | \`AVOIDING_OBSTACLE\` |
| \`NAVIGATING\` | \`battery_low\` | \`DOCKING\` |
| \`AVOIDING_OBSTACLE\` | \`path_cleared\` | \`NAVIGATING\` |
| \`AVOIDING_OBSTACLE\` | \`battery_low\` | \`DOCKING\` |
| \`DOCKING\` | \`dock_reached\` | \`CHARGING\` |
| \`CHARGING\` | \`charged\` | \`IDLE\` |

If an event is not valid for the current state, return the same state unchanged.

---


### Examples

**Example 1**

\`\`\`
Input:  current_state="IDLE", event="start_mission"
Output: "NAVIGATING"
\`\`\`

**Example 2**

\`\`\`
Input:  current_state="DOCKING", event="charged"
Output: "DOCKING"
\`\`\`

That event is invalid while docking, so the robot stays in the same state.
`,
  theory: `## Theory: Finite State Machines

### Why FSMs Matter

A robot often has high-level modes like:

- searching
- navigating
- avoiding obstacles
- docking

An FSM keeps that logic organized and predictable.

### The Core Idea

At any moment:

1. the robot is in **one state**
2. it receives an **event**
3. it uses a transition rule to choose the **next state**

This is much easier to debug than scattering behavior logic all over the codebase.

### Where FSMs Are Used

- mobile robot autonomy
- industrial automation
- game AI
- mission sequencing

Later, more complex robots often graduate to **behavior trees**, but FSMs are the perfect starting point.
`,
  starterCode: `def next_state(current_state: str, event: str) -> str:
    """
    Return the robot's next state after the given event.
    If the event is invalid in the current state, return current_state.
    """
    # Write code here
    pass
`,
  solutionCode: `def next_state(current_state: str, event: str) -> str:
    transitions = {
        "IDLE": {
            "start_mission": "NAVIGATING",
        },
        "NAVIGATING": {
            "obstacle_detected": "AVOIDING_OBSTACLE",
            "battery_low": "DOCKING",
        },
        "AVOIDING_OBSTACLE": {
            "path_cleared": "NAVIGATING",
            "battery_low": "DOCKING",
        },
        "DOCKING": {
            "dock_reached": "CHARGING",
        },
        "CHARGING": {
            "charged": "IDLE",
        },
    }

    return transitions.get(current_state, {}).get(event, current_state)
`,
  testCases: [
    {
      id: 1,
      input: { current_state: "IDLE", event: "start_mission" },
      expected: "NAVIGATING",
      description: "Mission start wakes the robot from idle",
    },
    {
      id: 2,
      input: { current_state: "NAVIGATING", event: "obstacle_detected" },
      expected: "AVOIDING_OBSTACLE",
      description: "Obstacle event interrupts navigation",
    },
    {
      id: 3,
      input: { current_state: "AVOIDING_OBSTACLE", event: "battery_low" },
      expected: "DOCKING",
      description: "Low battery overrides obstacle handling and sends the robot to dock",
    },
    {
      id: 4,
      input: { current_state: "DOCKING", event: "charged" },
      expected: "DOCKING",
      description: "Invalid transition leaves the state unchanged",
    },
  ],
  testRunnerCode: `
import json
results = []
test_cases = __TEST_CASES__
for tc in test_cases:
    inp = tc["input"]
    try:
        result = next_state(inp["current_state"], inp["event"])
        expected = tc["expected"]
        passed = bool(result == expected)
        results.append({"id": tc["id"], "passed": passed, "output": result, "expected": expected})
    except Exception as e:
        results.append({"id": tc["id"], "passed": False, "error": str(e)})
json.dumps(results)
`,
  vizType: "finite-state-machine",
};
