import Link from "next/link";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/clients/supabase/server";
import { SiteShell } from "@/components/site/site-shell";
import { Button } from "@/components/ui/button";

export default async function ConnectPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/explore");
  }

  return (
    <SiteShell>
      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-zinc-800/80 bg-zinc-900/70 p-10 text-center">
          <p className="text-xs uppercase tracking-[0.32em] text-emerald-300/80">Connect GitHub</p>
          <h1 className="mt-4 text-3xl font-semibold text-zinc-100">One-time setup to receive bounty payouts</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Contributors only need to do this once. We link your GitHub username to your email so maintainers can
            approve payouts without extra back-and-forth.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/api/auth/github?next=/explore">
              <Button className="h-11 bg-emerald-400 px-6 text-base text-black hover:bg-emerald-300">
                Connect GitHub
              </Button>
            </Link>
            <Link
              href="/explore"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-700 px-6 text-base text-zinc-200 transition-colors hover:bg-zinc-900"
            >
              Browse bounties
            </Link>
          </div>

          <p className="mt-6 text-xs text-zinc-500">
            If you are a maintainer, you can also sign in from any bounty page to approve payouts.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}