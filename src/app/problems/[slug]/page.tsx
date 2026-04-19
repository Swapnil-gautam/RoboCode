"use client";

import { useState, useCallback, useRef, use } from "react";
import Link from "next/link";
import { problems, getProblemBySlug } from "@/data/problems";
import { usePyodide } from "@/hooks/usePyodide";
import { useProgress } from "@/hooks/useProgress";
import CodeEditor from "@/components/editor/CodeEditor";
import TestCasePanel from "@/components/editor/TestCasePanel";
import MarkdownContent from "@/components/problems/MarkdownContent";
import DifficultyBadge from "@/components/problems/DifficultyBadge";
import dynamic from "next/dynamic";

const ForwardKinematicsViz = dynamic(
  () => import("@/components/visualizations/ForwardKinematicsViz"),
  {
    ssr: false,
    loading: () => <VizLoadingFallback />,
  }
);
const InverseKinematicsViz = dynamic(
  () => import("@/components/visualizations/InverseKinematicsViz"),
  {
    ssr: false,
    loading: () => <VizLoadingFallback />,
  }
);
const PIDControllerViz = dynamic(
  () => import("@/components/visualizations/PIDControllerViz"),
  {
    ssr: false,
    loading: () => <VizLoadingFallback />,
  }
);
const KalmanFilterViz = dynamic(
  () => import("@/components/visualizations/KalmanFilterViz"),
  {
    ssr: false,
    loading: () => <VizLoadingFallback />,
  }
);
const PurePursuitViz = dynamic(
  () => import("@/components/visualizations/PurePursuitViz"),
  {
    ssr: false,
    loading: () => <VizLoadingFallback />,
  }
);

function VizLoadingFallback() {
  return (
    <div className="flex h-[280px] items-center justify-center bg-bg-primary">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
          <circle
            cx={12}
            cy={12}
            r={10}
            stroke="currentColor"
            strokeWidth={3}
            fill="none"
            strokeDasharray="32"
            strokeDashoffset="12"
          />
        </svg>
        Loading visualization...
      </div>
    </div>
  );
}

const vizMap: Record<string, React.ComponentType> = {
  "forward-kinematics": ForwardKinematicsViz,
  "inverse-kinematics": InverseKinematicsViz,
  "pid-controller": PIDControllerViz,
  "kalman-filter": KalmanFilterViz,
  "pure-pursuit": PurePursuitViz,
};

export function generateStaticParams() {
  return problems.map((p) => ({ slug: p.slug }));
}

type ActiveTab = "description" | "theory" | "solution";

export default function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const problem = getProblemBySlug(slug);
  const { loading: pyLoading, runCode } = usePyodide();
  const { markSolved, isSolved } = useProgress();

  const [activeTab, setActiveTab] = useState<ActiveTab>("description");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<
    Array<{
      id: number;
      passed: boolean;
      output?: unknown;
      expected?: unknown;
      error?: string;
    }>
  >([]);
  const [stdout, setStdout] = useState("");
  const [runError, setRunError] = useState<string | undefined>();
  const codeRef = useRef(problem?.starterCode ?? "");

  const handleCodeChange = useCallback((code: string) => {
    codeRef.current = code;
  }, []);

  const handleRun = useCallback(async () => {
    if (!problem || running) return;
    setRunning(true);
    setResults([]);
    setStdout("");
    setRunError(undefined);

    const { results: res, stdout: out, error: err } = await runCode(
      codeRef.current,
      problem.testRunnerCode,
      problem.testCases
    );

    setResults(res);
    setStdout(out);
    setRunError(err);
    setRunning(false);

    if (res.length > 0 && res.every((r) => r.passed)) {
      markSolved(problem.slug);
    }
  }, [problem, running, runCode, markSolved]);

  if (!problem) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">
            Problem not found
          </h1>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-accent-green hover:underline"
          >
            &larr; Back to problems
          </Link>
        </div>
      </div>
    );
  }

  const VizComponent = vizMap[problem.vizType];
  const solved = isSolved(problem.slug);

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: "description", label: "Description" },
    { key: "theory", label: "Theory" },
    { key: "solution", label: "Solution" },
  ];

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Left Panel */}
      <div className="flex w-1/2 flex-col border-r border-border-default">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border-default bg-bg-secondary/60 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-accent-green text-accent-green"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
          {solved && (
            <span className="ml-auto flex items-center gap-1 text-xs text-success">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
              Solved
            </span>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === "description" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-text-primary">
                  {problem.title}
                </h1>
                <DifficultyBadge difficulty={problem.difficulty} />
              </div>
              <div className="flex gap-2">
                {problem.topics.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-bg-tertiary px-2.5 py-1 text-xs text-text-secondary"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {VizComponent && (
                <div className="rounded-xl border border-border-default bg-bg-secondary overflow-hidden">
                  <VizComponent />
                </div>
              )}

              <MarkdownContent content={problem.description} />
            </div>
          )}

          {activeTab === "theory" && (
            <MarkdownContent content={problem.theory} />
          )}

          {activeTab === "solution" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-text-primary">
                Reference Solution
              </h2>
              <pre className="rounded-xl border border-border-default bg-bg-tertiary p-4 text-sm text-text-secondary font-mono overflow-auto">
                {problem.solutionCode}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex w-1/2 flex-col">
        {/* Code Editor */}
        <div className="relative flex-1 border-b border-border-default">
          {pyLoading && (
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-2 bg-bg-secondary/90 py-1.5 text-xs text-accent-gold">
              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24">
                <circle
                  cx={12}
                  cy={12}
                  r={10}
                  stroke="currentColor"
                  strokeWidth={3}
                  fill="none"
                  strokeDasharray="32"
                  strokeDashoffset="12"
                />
              </svg>
              Loading Python runtime (NumPy included)...
            </div>
          )}
          <CodeEditor
            slug={problem.slug}
            starterCode={problem.starterCode}
            onChange={handleCodeChange}
          />
        </div>

        {/* Test Cases */}
        <div className="h-[40%] min-h-[200px]">
          <TestCasePanel
            testCases={problem.testCases}
            results={results}
            running={running}
            stdout={stdout}
            error={runError}
            onRun={handleRun}
          />
        </div>
      </div>
    </div>
  );
}
