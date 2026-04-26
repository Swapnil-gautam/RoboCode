"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const PYODIDE_VERSION = "0.26.4";
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const LOAD_TIMEOUT_MS = 15_000;

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
      const timeout = (msg: string) =>
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(msg)), LOAD_TIMEOUT_MS)
        );

      try {
        const script = document.createElement("script");
        script.src = `${PYODIDE_CDN}pyodide.js`;
        script.async = true;

        await Promise.race([
          new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Pyodide script"));
            document.head.appendChild(script);
          }),
          timeout("Timed out loading Python runtime"),
        ]);

        const pyodide = await Promise.race([
          window.loadPyodide!({ indexURL: PYODIDE_CDN }),
          timeout("Timed out initializing Python runtime"),
        ]);

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
        // Use function form to prevent $ in JSON being treated as special replacement patterns
        const runnerWithTests = testRunnerCode.replace("__TEST_CASES__", () => testCasesJson);

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
