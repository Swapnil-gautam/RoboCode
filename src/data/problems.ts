import { Problem } from "./types";
import { forwardKinematics } from "./problems/forward-kinematics";
import { inverseKinematics } from "./problems/inverse-kinematics";
import { pidController } from "./problems/pid-controller";
import { kalmanFilter1D } from "./problems/kalman-filter-1d";
import { purePursuit } from "./problems/pure-pursuit";
import { coordinateFrames } from "./problems/kinematics/coordinate-frames";
import { differentialDrive } from "./problems/kinematics/differential-drive";
import { differentialDriveOdometry } from "./problems/localization/differential-drive-ii";
import { aStarGridPathPlanning } from "./problems/path-planning/a-star-grid-path-planning";
import { finiteStateMachine } from "./problems/decision-making/finite-state-machine";

export const problems: Problem[] = [
  forwardKinematics,
  inverseKinematics,
  pidController,
  kalmanFilter1D,
  purePursuit,
  coordinateFrames,
  differentialDrive,
  differentialDriveOdometry,
  aStarGridPathPlanning,
  finiteStateMachine,
];

const problemMap = new Map<string, Problem>(
  problems.map((problem) => [problem.slug, problem])
);

export function getProblemBySlug(slug: string) {
  return problemMap.get(slug);
}
