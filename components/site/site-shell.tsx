"use client";

import type { ReactNode } from "react";

import { SiteHeader } from "@/components/site/site-header";
import Link from "next/link";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#06090b] text-zinc-100">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(20,184,166,0.08),transparent_30%)]" />
      <SiteHeader />
      <main>{children}</main>
      <footer className="p-8 w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-8 justify-between border-t border-zinc-900/90 bg-[#05080a]/90">
        <div className="border-zinc-900/70">
          <div>
            <p className="text-lg font-semibold text-zinc-100">BOUNTIC</p>
            <p className="mt-2 max-w-xl text-sm text-zinc-400">
              Limited-time storefront infrastructure for creators. Describe your drop. Launch instantly.
              Agents handle the rest.
            </p>
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-zinc-500">
            Built for the Locus hackathon.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Platform</p>
            <ul className="mt-3 space-y-2 text-zinc-400">
              <li>
                <Link href="https://docs.paywithlocus.com" className="transition-colors hover:text-zinc-200">
                  CheckoutWithLocus
                </Link>
              </li>
              <li>
                <Link href="https://beta.paywithlocus.com" className="transition-colors hover:text-zinc-200">
                  PayWithLocus
                </Link>
              </li>
              <li>
                <Link href="https://github.com/skndash96/bountic" className="transition-colors hover:text-zinc-200">
                  GitHub
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Support</p>
            <ul className="mt-3 space-y-2 text-zinc-400">
              <li>
                <Link href="#" className="transition-colors hover:text-zinc-200">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-zinc-200">
                  Report issue
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-zinc-200">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
