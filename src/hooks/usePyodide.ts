"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface PyodideInstance {
  runPythonAsync: (code: string) => Promise<unknown>;
  loadPackage: (pkg: string | string[]) => Promise<void>;
  globals: { get: (key: string) => unknown };
}

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<PyodideInstance>;
  }
}

export function usePyodide() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pyodideRef = useRef<PyodideInstance | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function init() {
      try {
        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
        script.async = true;

        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Pyodide"));
          document.head.appendChild(script);
        });

        const pyodide = await window.loadPyodide!({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
        });

        await pyodide.loadPackage(["numpy"]);
        pyodideRef.current = pyodide;
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load Python");
        setLoading(false);
      }
    }

    init();
  }, []);

  const runCode = useCallback(
    async (
      userCode: string,
      testRunnerCode: string,
      testCases: unknown[]
    ): Promise<{
      results: Array<{
        id: number;
        passed: boolean;
        output?: unknown;
        expected?: unknown;
        error?: string;
      }>;
      stdout: string;
      error?: string;
    }> => {
      if (!pyodideRef.current) {
        return { results: [], stdout: "", error: "Python not loaded yet" };
      }

      const pyodide = pyodideRef.current;

      try {
        let stdout = "";
        await pyodide.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
`);

        const testCasesJson = JSON.stringify(testCases);
        const runnerWithTests = testRunnerCode.replace(
          "__TEST_CASES__",
          testCasesJson
        );

        const fullCode = `${userCode}\n${runnerWithTests}`;
        const result = await pyodide.runPythonAsync(fullCode);

        const capturedOutput = await pyodide.runPythonAsync(
          "sys.stdout.getvalue()"
        );
        stdout = String(capturedOutput || "");

        await pyodide.runPythonAsync("sys.stdout = sys.__stdout__");

        const parsed = JSON.parse(String(result));
        return { results: parsed, stdout };
      } catch (err) {
        try {
          await pyodide.runPythonAsync("sys.stdout = sys.__stdout__");
        } catch {
          // ignore
        }
        const msg = err instanceof Error ? err.message : String(err);
        return { results: [], stdout: "", error: msg };
      }
    },
    []
  );

  return { loading, error, runCode };
}
