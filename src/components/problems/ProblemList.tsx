"use client";

import { useState } from "react";
import Link from "next/link";
import { problems } from "@/data/problems";
import { Topic } from "@/data/types";
import { useProgress } from "@/hooks/useProgress";
import DifficultyBadge from "./DifficultyBadge";
import TopicTag from "./TopicTag";

const allTopics: (Topic | "All")[] = [
  "All",
  "Kinematics",
  "Controls",
  "Localization",
];

export default function ProblemList() {
  const [activeTopic, setActiveTopic] = useState<Topic | "All">("All");
  const [search, setSearch] = useState("");
  const { isSolved } = useProgress();

  const filtered = problems.filter((p) => {
    const topicMatch =
      activeTopic === "All" || p.topics.includes(activeTopic as Topic);
    const searchMatch = p.title.toLowerCase().includes(search.toLowerCase());
    return topicMatch && searchMatch;
  });

  return (
    <div className="space-y-4">
      {/* Topic filters */}
      <div className="flex flex-wrap items-center gap-2">
        {allTopics.map((t) => (
          <TopicTag
            key={t}
            topic={t}
            active={activeTopic === t}
            onClick={() => setActiveTopic(t)}
          />
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx={11} cy={11} r={8} />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search problems..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border-default bg-bg-secondary py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-green/50 focus:outline-none focus:ring-1 focus:ring-accent-green/30"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border-default">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-default bg-bg-secondary/60 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
              <th className="w-16 py-3 pl-4">Status</th>
              <th className="w-12 py-3">#</th>
              <th className="py-3">Problem</th>
              <th className="py-3">Topics</th>
              <th className="w-28 py-3 pr-4 text-right">Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((problem) => {
              const solved = isSolved(problem.slug);
              return (
                <tr
                  key={problem.id}
                  className="border-b border-border-default last:border-0 transition-colors hover:bg-bg-hover/50"
                >
                  <td className="py-3.5 pl-4">
                    {solved ? (
                      <svg
                        className="h-5 w-5 text-accent-green"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-border-bright" />
                    )}
                  </td>
                  <td className="py-3.5 text-sm text-text-muted">
                    {problem.id}.
                  </td>
                  <td className="py-3.5">
                    <Link
                      href={`/problems/${problem.slug}`}
                      className="text-sm font-medium text-text-primary hover:text-accent-green transition-colors"
                    >
                      {problem.title}
                    </Link>
                  </td>
                  <td className="py-3.5">
                    <div className="flex gap-1.5">
                      {problem.topics.map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-bg-tertiary px-2 py-0.5 text-xs text-text-secondary"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-right">
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
