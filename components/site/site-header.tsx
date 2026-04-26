import Image from "next/image";
import Link from "next/link";

import { getSupabaseServerClient } from "@/lib/clients/supabase/server";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const githubUsername = user?.user_metadata?.user_name ?? user?.user_metadata?.preferred_username ?? null;
  const email = user?.email ?? null;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-900/80 bg-[#06090b]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-zinc-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/90">
            <Image src="/logo.png" alt="Bountic" width={28} height={28} className="h-7 w-7 contrast-125" />
          </div>
          <span className="text-base font-semibold tracking-tight">Bountic</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
          <Link href="/" className="transition-colors hover:text-white">
            Home
          </Link>
          <Link href="/explore" className="transition-colors hover:text-white">
            Explore
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="group relative">
              <button className="flex h-9 items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 transition-colors hover:bg-zinc-800">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/20 text-xs font-medium text-emerald-300">
                  {githubUsername?.[0]?.toUpperCase() ?? "?"}
                </div>
                <span className="max-w-[100px] truncate">{githubUsername ?? "Connected"}</span>
              </button>
              <div className="absolute right-0 top-full hidden w-48 flex-col rounded-lg border border-zinc-800 bg-zinc-900 p-1 shadow-xl group-hover:flex z-50">
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
              <Button className="h-9 border border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800">
                Connect GitHub
              </Button>
            </Link>
          )}
          <Link href="/explore">
            <Button className="h-9 bg-emerald-400 text-black hover:bg-emerald-300">Browse Bounties</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}