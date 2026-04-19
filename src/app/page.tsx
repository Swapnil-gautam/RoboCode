"use client";

import Link from "next/link";
import { problems } from "@/data/problems";
import ProblemList from "@/components/problems/ProblemList";
import ProgressSidebar from "@/components/layout/ProgressSidebar";
import DifficultyBadge from "@/components/problems/DifficultyBadge";

function ProblemOfTheDay() {
  const dayIndex =
    Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % problems.length;
  const potd = problems[dayIndex];

  return (
    <Link
      href={`/problems/${potd.slug}`}
      className="block rounded-xl border border-border-default bg-gradient-to-r from-bg-secondary via-bg-tertiary to-bg-secondary p-5 transition-all hover:border-accent-green/40"
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="mb-1 inline-block text-[10px] font-bold uppercase tracking-widest text-accent-gold">
            Problem of the Day
          </span>
          <h2 className="text-lg font-semibold text-text-primary">
            {potd.title}
          </h2>
          <div className="mt-2 flex items-center gap-3">
            {potd.topics.map((t) => (
              <span key={t} className="text-xs text-text-secondary">
                {t}
              </span>
            ))}
            <DifficultyBadge difficulty={potd.difficulty} />
          </div>
        </div>
        <span className="text-sm text-accent-green hover:underline">
          Give it a try &rarr;
        </span>
      </div>
    </Link>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-screen-xl px-6 py-8">
      <div className="flex gap-8">
        <ProgressSidebar />
        <div className="min-w-0 flex-1 space-y-6">
          <ProblemOfTheDay />
          <ProblemList />
        </div>
      </div>
    </div>
  );
}
