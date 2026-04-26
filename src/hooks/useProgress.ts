"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getProgress, markSolved as markSolvedStorage } from "@/lib/storage";
import { problems } from "@/data/problems";

export function useProgress() {
  const [solvedSlugs, setSolvedSlugs] = useState<string[]>([]);

  useEffect(() => {
    setSolvedSlugs(getProgress().solvedSlugs);
  }, []);

  const markSolved = useCallback((slug: string) => {
    markSolvedStorage(slug);
    setSolvedSlugs((prev) =>
      prev.includes(slug) ? prev : [...prev, slug]
    );
  }, []);

  const stats = useMemo(() => {
    const easySolved = problems.filter(
      (p) => p.difficulty === "Easy" && solvedSlugs.includes(p.slug)
    ).length;
    const mediumSolved = problems.filter(
      (p) => p.difficulty === "Medium" && solvedSlugs.includes(p.slug)
    ).length;
    const hardSolved = problems.filter(
      (p) => p.difficulty === "Hard" && solvedSlugs.includes(p.slug)
    ).length;
    const easyTotal = problems.filter((p) => p.difficulty === "Easy").length;
    const mediumTotal = problems.filter((p) => p.difficulty === "Medium").length;
    const hardTotal = problems.filter((p) => p.difficulty === "Hard").length;
    return { easySolved, mediumSolved, hardSolved, easyTotal, mediumTotal, hardTotal };
  }, [solvedSlugs]);

  return {
    solvedSlugs,
    isSolved: (slug: string) => solvedSlugs.includes(slug),
    markSolved,
    totalSolved: solvedSlugs.length,
    ...stats,
  };
}
