"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getSavedCode, saveCode } from "@/lib/storage";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-bg-secondary text-text-muted text-sm">
      Loading editor...
    </div>
  ),
});

interface CodeEditorProps {
  slug: string;
  starterCode: string;
  onChange?: (code: string) => void;
}

export default function CodeEditor({
  slug,
  starterCode,
  onChange,
}: CodeEditorProps) {
  const [code, setCode] = useState(starterCode);

  useEffect(() => {
    const saved = getSavedCode(slug);
    if (saved) {
      setCode(saved);
      onChange?.(saved);
    }
  }, [slug]);

  const handleChange = useCallback(
    (value: string | undefined) => {
      const v = value ?? "";
      setCode(v);
      saveCode(slug, v);
      onChange?.(v);
    },
    [slug, onChange]
  );

  const handleReset = useCallback(() => {
    setCode(starterCode);
    saveCode(slug, starterCode);
    onChange?.(starterCode);
  }, [slug, starterCode, onChange]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border-default bg-bg-secondary/60 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-secondary">
            Python 3
          </span>
        </div>
        <button
          onClick={handleReset}
          className="rounded-md px-2.5 py-1 text-xs text-text-muted hover:bg-bg-hover hover:text-text-secondary transition-colors"
        >
          Reset
        </button>
      </div>
      <div className="flex-1">
        <MonacoEditor
          height="100%"
          language="python"
          theme="vs-dark"
          value={code}
          onChange={handleChange}
          options={{
            fontSize: 14,
            fontFamily: "var(--font-geist-mono), monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            lineNumbers: "on",
            renderLineHighlight: "line",
            automaticLayout: true,
            tabSize: 4,
          }}
        />
      </div>
    </div>
  );
}
