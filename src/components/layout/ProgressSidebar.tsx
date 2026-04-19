"use client";

import { useProgress } from "@/hooks/useProgress";

function StatCircle({
  label,
  solved,
  total,
  color,
}: {
  label: string;
  solved: number;
  total: number;
  color: string;
}) {
  const pct = total === 0 ? 0 : (solved / total) * 100;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative h-16 w-16">
        <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
          <circle
            cx={32}
            cy={32}
            r={r}
            fill="none"
            stroke="currentColor"
            className="text-bg-tertiary"
            strokeWidth={4}
          />
          <circle
            cx={32}
            cy={32}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={4}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-text-primary">
          {solved}
        </span>
      </div>
      <span className="text-xs text-text-secondary">{label}</span>
    </div>
  );
}

export default function ProgressSidebar() {
  const {
    totalSolved,
    easySolved,
    mediumSolved,
    hardSolved,
    easyTotal,
    mediumTotal,
    hardTotal,
  } = useProgress();

  return (
    <div className="w-56 shrink-0 space-y-6">
      <div className="rounded-xl border border-border-default bg-bg-secondary p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-accent-green/20 flex items-center justify-center">
            <svg
              className="h-3.5 w-3.5 text-accent-green"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-text-primary">
            Your Progress
          </h3>
        </div>

        <div className="flex justify-between">
          <StatCircle
            label="Easy"
            solved={easySolved}
            total={easyTotal}
            color="var(--color-easy)"
          />
          <StatCircle
            label="Medium"
            solved={mediumSolved}
            total={mediumTotal}
            color="var(--color-medium)"
          />
          <StatCircle
            label="Hard"
            solved={hardSolved}
            total={hardTotal}
            color="var(--color-hard)"
          />
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-border-default pt-4">
          <span className="text-sm text-text-secondary">Total Solved</span>
          <span className="text-xl font-bold text-accent-green">
            {totalSolved}
          </span>
        </div>
      </div>
    </div>
  );
}
