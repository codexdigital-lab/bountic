"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchMe, type DashboardData } from "@/lib/api/client";

export function SiteHeader() {
  const [user, setUser] = useState<{ email: string; github_username: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const githubUsername = user?.github_username;
  const email = user?.email;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-900/80 bg-[#06090b]/90 backdrop-blur-xl">
      <div className="mx-auto flex justify-between md:grid md:grid-cols-3 h-16 w-full max-w-6xl px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-zinc-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg">
            <Image src="/logo.png" alt="Bountic" width={28} height={28} className="h-7 w-7 contrast-125" />
          </div>
          <span className="text-base font-semibold tracking-tight">BOUNTIC</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
          <Link href="/" className="transition-colors hover:text-white">
            Home
          </Link>
          <Link href="/explore" className="transition-colors hover:text-white">
            Explore
          </Link>
          {user && (
            <Link href="/dashboard" className="transition-colors hover:text-white">
              Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center justify-end gap-2">
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-zinc-800" />
          ) : user ? (
            <div className="group relative">
              <button className="flex h-9 items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 transition-colors hover:bg-zinc-800">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/20 text-xs font-medium text-emerald-300">
                  {githubUsername?.[0]?.toUpperCase() ?? "?"}
                </div>
                <span className="max-w-25 truncate">{githubUsername ?? "Connected"}</span>
              </button>
              <div className="absolute right-0 top-full hidden w-48 flex-col rounded-lg border border-zinc-800 bg-zinc-900 p-1 shadow-xl group-hover:flex z-50">
                <Link
                  href="/dashboard"
                  className="rounded-md px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                >
                  Dashboard
                </Link>
                <div className="border-b border-zinc-800 px-3 py-2">
                  <p className="truncate text-xs text-zinc-400">{email}</p>
                </div>
                <form
                  action="/api/auth/signout"
                  method="post"
                  className="mt-1"
                >
                  <button
                    type="submit"
                    className="w-full rounded-md px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-800"
                  >
                    Log out
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <Link href="/connect">
              <button className="h-9 rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800">
                Connect GitHub
              </button>
            </Link>
          )}
          <Link href="/explore" className="max-md:hidden">
            <button className="h-9 rounded-lg bg-emerald-400 px-4 text-sm font-medium text-black transition-colors hover:bg-emerald-300">
              Browse Bounties
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}