import { Problem } from "./types";
import { forwardKinematics } from "./problems/forward-kinematics";
import { inverseKinematics } from "./problems/inverse-kinematics";
import { pidController } from "./problems/pid-controller";
import { kalmanFilter1D } from "./problems/kalman-filter-1d";
import { purePursuit } from "./problems/pure-pursuit";

export const problems: Problem[] = [
  forwardKinematics,
  inverseKinematics,
  pidController,
  kalmanFilter1D,
  purePursuit,
];

const problemMap = new Map<string, Problem>(
  problems.map((problem) => [problem.slug, problem])
);

export function getProblemBySlug(slug: string) {
  return problemMap.get(slug);
}
