import Link from "next/link";

import { SiteShell } from "@/components/site/site-shell";
import { Button } from "@/components/ui/button";
import { fetchBounties } from "@/lib/api/client";

export const dynamic = "force-dynamic";

async function getStats() {
  try {
    const data = await fetchBounties({ limit: 100 });
    const totalBounties = data.bounties.length;
    const totalFunded = data.bounties.reduce((sum, bounty) => sum + bounty.total_amount, 0);
    const paidBounties = data.bounties.filter((bounty) => bounty.status === "PAID").length;
    return { totalBounties, totalFunded, paidBounties };
  } catch {
    return { totalBounties: 0, totalFunded: 0, paidBounties: 0 };
  }
}

async function getFeaturedBounties() {
  try {
    const data = await fetchBounties({ status: "OPEN", limit: 6, sort: "amount_desc" });
    return data.bounties;
  } catch {
    return [];
  }
}

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

export default async function HomePage() {
  const { totalBounties, totalFunded, paidBounties } = await getStats();
  const featuredBounties = await getFeaturedBounties();

  return (
    <SiteShell>
      <section className="relative overflow-hidden px-5 pb-16 pt-12 sm:px-8 sm:pt-16">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Label-first funding workflow
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-zinc-100 sm:text-6xl">
            The bounty issue page GitHub never built
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Maintainers label an issue with <span className="text-emerald-300">Bounty</span>, contributors fund directly on
            the Bountic page, and maintainers approve payouts on the web once linked PRs are merged.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/explore">
              <Button className="h-11 bg-emerald-400 px-8 text-base text-black hover:bg-emerald-300">Explore Bounties</Button>
            </Link>
            <a
              href="https://github.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-700 px-8 text-base text-zinc-200 transition-colors hover:bg-zinc-900"
            >
              Install GitHub App
            </a>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-6 text-center">
              <p className="text-3xl font-semibold text-zinc-100">{totalBounties}</p>
              <p className="mt-1 text-sm text-zinc-500">Bounties Created</p>
            </div>
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-6 text-center">
              <p className="text-3xl font-semibold text-emerald-300">${formatAmount(totalFunded)}</p>
              <p className="mt-1 text-sm text-zinc-500">Total Funded</p>
            </div>
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-6 text-center">
              <p className="text-3xl font-semibold text-zinc-100">{paidBounties}</p>
              <p className="mt-1 text-sm text-zinc-500">Payouts Made</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-zinc-100">See How It Works</h2>
          <p className="mt-2 text-sm text-zinc-500">Watch a quick demo of funding an issue and receiving payout</p>
          <div className="mx-auto mt-6 flex aspect-video w-full max-w-3xl items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
                <svg className="h-8 w-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-zinc-500">Loom video placeholder</p>
            </div>
          </div>
        </div>
      </section>

      {featuredBounties.length > 0 ? (
        <section className="border-y border-zinc-900/80 bg-zinc-950/40 px-5 py-16 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-zinc-100">Featured Bounties</h2>
                <p className="mt-1 text-sm text-zinc-500">Top open bounties worth funding right now</p>
              </div>
              <Link href="/explore" className="text-sm text-emerald-300 hover:text-emerald-200">
                View all
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featuredBounties.slice(0, 3).map((bounty) => (
                <Link key={bounty.issue_id} href={`/bounty/${bounty.owner}/${bounty.repo}/${bounty.issue_number}`}>
                  <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900 to-zinc-950 p-5 transition-colors hover:border-emerald-400/50">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-zinc-500">{bounty.owner}/{bounty.repo}</span>
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-300">
                        {bounty.status}
                      </span>
                    </div>
                    <p className="mt-4 font-mono text-2xl font-bold text-emerald-300">${formatAmount(bounty.total_amount)}</p>
                    <p className="mt-1 text-xs text-zinc-500">Issue #{bounty.issue_number}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold text-zinc-100 sm:text-3xl">How it works</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/70 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Step 1</p>
              <h3 className="mt-2 text-lg font-semibold text-zinc-100">Maintainer adds Bounty label</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                The webhook creates and updates a pinned ledger comment with status, total amount, and issue page link.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/70 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Step 2</p>
              <h3 className="mt-2 text-lg font-semibold text-zinc-100">Fund on the issue page</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Contributors use inline checkout to add USDC. Activity feed and leaderboard update automatically.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/70 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Step 3</p>
              <h3 className="mt-2 text-lg font-semibold text-zinc-100">Approve payout on web</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Once a PR with <span className="text-zinc-200">Fixes #123</span> is merged, maintainers approve payment in UI.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-900/80 bg-zinc-950/50 px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold text-zinc-100 sm:text-3xl">Why Bountic?</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/70 p-6">
              <h3 className="text-lg font-semibold text-zinc-100">Issue-native funding</h3>
              <p className="mt-2 text-sm text-zinc-400">No extra repo noise. Maintainers only add one label and keep working in GitHub.</p>
            </div>
            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/70 p-6">
              <h3 className="text-lg font-semibold text-zinc-100">Agent-friendly APIs</h3>
              <p className="mt-2 text-sm text-zinc-400">Structured explore, bounty, and funding APIs for autonomous contributors and funders.</p>
            </div>
            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/70 p-6">
              <h3 className="text-lg font-semibold text-zinc-100">Transparent activity</h3>
              <p className="mt-2 text-sm text-zinc-400">Every action from funding to payout appears in one timeline for maintainers and contributors.</p>
            </div>
            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/70 p-6">
              <h3 className="text-lg font-semibold text-zinc-100">Fast payout execution</h3>
              <p className="mt-2 text-sm text-zinc-400">Merged winning PRs can be paid quickly from the Bountic page once maintainer permissions are verified.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-zinc-800/80 bg-zinc-900/70 p-10 text-center">
          <h2 className="text-3xl font-semibold text-zinc-100">Ready to fund and ship faster?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-zinc-400">
            Explore active bounties, support important issues, and reward merged contributors in one place.
          </p>
          <Link href="/explore" className="mt-7 inline-flex">
            <Button className="h-11 bg-emerald-400 px-8 text-base text-black hover:bg-emerald-300">Browse All Bounties</Button>
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
