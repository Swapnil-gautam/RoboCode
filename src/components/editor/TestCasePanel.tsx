"use client";

import { useState } from "react";
import { TestCase } from "@/data/types";

interface TestResult {
  id: number;
  passed: boolean;
  output?: unknown;
  expected?: unknown;
  error?: string;
}

interface TestCasePanelProps {
  testCases: TestCase[];
  results: TestResult[];
  running: boolean;
  stdout: string;
  error?: string;
  onRun: () => void;
}

export default function TestCasePanel({
  testCases,
  results,
  running,
  stdout,
  error,
  onRun,
}: TestCasePanelProps) {
  const [activeTab, setActiveTab] = useState<"testcase" | "result">(
    "testcase"
  );
  const [activeCase, setActiveCase] = useState(0);

  const allPassed = results.length > 0 && results.every((r) => r.passed);

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-border-default bg-bg-secondary/60 px-4">
        <div className="flex">
          <button
            onClick={() => setActiveTab("testcase")}
            className={`border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeTab === "testcase"
                ? "border-accent-green text-accent-green"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            Testcase
          </button>
          <button
            onClick={() => setActiveTab("result")}
            className={`border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeTab === "result"
                ? "border-accent-green text-accent-green"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            Test Result
          </button>
        </div>
        <button
          onClick={onRun}
          disabled={running}
          className="flex items-center gap-1.5 rounded-md bg-accent-green px-3 py-1.5 text-xs font-semibold text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {running ? (
            <>
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
              Running...
            </>
          ) : (
            <>
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Run
            </>
          )}
        </button>
      </div>

      {/* Case tabs */}
      <div className="flex items-center gap-1 border-b border-border-default bg-bg-secondary/30 px-4 py-1.5">
        {testCases.map((tc, i) => {
          const result = results.find((r) => r.id === tc.id);
          return (
            <button
              key={tc.id}
              onClick={() => setActiveCase(i)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                activeCase === i
                  ? "bg-bg-hover text-text-primary"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {result && (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    result.passed ? "bg-success" : "bg-error"
                  }`}
                />
              )}
              Case {i + 1}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === "testcase" ? (
          <div className="space-y-3">
            {testCases[activeCase] && (
              <>
                {testCases[activeCase].description && (
                  <p className="text-xs text-text-muted italic">
                    {testCases[activeCase].description}
                  </p>
                )}
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">
                    Input
                  </label>
                  <pre className="rounded-lg bg-bg-tertiary p-3 text-xs text-text-secondary font-mono">
                    {JSON.stringify(testCases[activeCase].input, null, 2)}
                  </pre>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">
                    Expected
                  </label>
                  <pre className="rounded-lg bg-bg-tertiary p-3 text-xs text-text-secondary font-mono">
                    {JSON.stringify(testCases[activeCase].expected, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {error && (
              <div className="rounded-lg bg-error/10 border border-error/30 p-3">
                <pre className="text-xs text-error font-mono whitespace-pre-wrap">
                  {error}
                </pre>
              </div>
            )}

            {allPassed && (
              <div className="rounded-lg bg-success/10 border border-success/30 p-3 text-sm text-success font-medium">
                All test cases passed!
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-2">
                {results.map((r) => (
                  <div
                    key={r.id}
                    className={`rounded-lg border p-3 ${
                      r.passed
                        ? "border-success/30 bg-success/5"
                        : "border-error/30 bg-error/5"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs font-semibold ${
                          r.passed ? "text-success" : "text-error"
                        }`}
                      >
                        Case {r.id}: {r.passed ? "Passed" : "Failed"}
                      </span>
                    </div>
                    {r.error ? (
                      <pre className="text-xs text-error font-mono">
                        {r.error}
                      </pre>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div>
                          <span className="text-text-muted">Output: </span>
                          <span className="text-text-secondary">
                            {JSON.stringify(r.output)}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-muted">Expected: </span>
                          <span className="text-text-secondary">
                            {JSON.stringify(r.expected)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {stdout && (
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">
                  Stdout
                </label>
                <pre className="rounded-lg bg-bg-tertiary p-3 text-xs text-text-secondary font-mono whitespace-pre-wrap">
                  {stdout}
                </pre>
              </div>
            )}

            {results.length === 0 && !error && (
              <p className="text-xs text-text-muted">
                Run your code to see results.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
