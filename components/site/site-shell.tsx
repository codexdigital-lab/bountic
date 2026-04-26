import type { ReactNode } from "react";

import { SiteHeader } from "@/components/site/site-header";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#06090b] text-zinc-100">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(20,184,166,0.08),transparent_30%)]" />
      <SiteHeader />
      <main>{children}</main>
      <footer className="border-t border-zinc-900/90 bg-[#05080a]/90">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>Bountic - Label-triggered USDC bounties on GitHub</p>
          <div className="flex items-center gap-5">
            <a href="https://github.com" className="transition-colors hover:text-zinc-300">
              GitHub
            </a>
            <a href="/explore" className="transition-colors hover:text-zinc-300">
              Explore
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
