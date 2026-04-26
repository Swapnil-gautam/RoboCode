export type Difficulty = "Easy" | "Medium" | "Hard";

export type Topic =
  | "Kinematics"
  | "Controls"
  | "Localization"
  | "Path Planning"
  | "Decision Making"
  | "Dynamics";

export interface TestCase {
  id: number;
  input: Record<string, unknown>;
  expected: unknown;
  description?: string;
}

export interface TestResult {
  id: number;
  passed: boolean;
  output?: unknown;
  expected?: unknown;
  error?: string;
}

export interface Problem {
  id: number;
  slug: string;
  title: string;
  difficulty: Difficulty;
  topics: Topic[];
  description: string;
  theory: string;
  starterCode: string;
  solutionCode: string;
  testCases: TestCase[];
  testRunnerCode: string;
  vizType: string;
}
