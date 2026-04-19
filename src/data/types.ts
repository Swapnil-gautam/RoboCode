export type Difficulty = "Easy" | "Medium" | "Hard";

export type Topic =
  | "Kinematics"
  | "Controls"
  | "Localization"
  | "Path Planning"
  | "Dynamics";

export interface TestCase {
  id: number;
  input: Record<string, unknown>;
  expected: unknown;
  description?: string;
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
