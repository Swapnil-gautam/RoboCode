"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <nav className="sticky top-0 z-50 border-b border-border-default bg-bg-primary/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-green/20">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5 text-accent-green"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-lg font-bold text-text-primary">
            Robo<span className="text-accent-green">Code</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${
              isHome
                ? "text-accent-green"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Problems
          </Link>
          <span className="text-sm text-text-muted cursor-default">
            Study Plans
          </span>
          <span className="text-sm text-text-muted cursor-default">
            Explore
          </span>
        </div>
      </div>
    </nav>
  );
}
