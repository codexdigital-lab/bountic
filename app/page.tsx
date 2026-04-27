import Link from "next/link";

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
    <>
      <section className="relative overflow-hidden px-5 pb-16 pt-12 sm:px-8 sm:pt-16">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-sm text-zinc-400">
            ⚡️ Powered by Locus Smart Escrow
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-zinc-100 sm:text-5xl">
            Turn GitHub Issues into
            <br/>
            Instant <span className="text-emerald-300">USDC</span> Bounties
          </h1>
          
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            The zero-friction escrow protocol for the open-source economy. Fund issues with USDC and settle payouts the second code is merged. Built for humans and AI agents alike— no invoices, no PayPal, no waiting.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/explore">
              <Button className="h-11 bg-emerald-400 px-8 text-base font-semibold text-black hover:bg-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all hover:shadow-[0_0_30px_rgba(52,211,153,0.5)]">Explore Bounties</Button>
            </Link>
            <Link
              href="https://github.com/skndash96/bountic"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-700 px-8 text-base text-zinc-200 transition-colors hover:bg-zinc-900"
            >
              Install GitHub App
            </Link>
          </div>

          {/* The URL Swap Visualizer */}
          <div className="mx-auto mt-16 max-w-2xl rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 shadow-2xl">
            <p className="mb-3 text-sm font-medium text-zinc-400">From Issue to Escrow in One Keystroke:</p>
            <div className="flex items-center overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 font-mono text-sm sm:text-base">
              <div className="flex items-center gap-1 bg-zinc-800 px-3 py-3">
                <span className="h-3 w-3 rounded-full bg-red-500/80"></span>
                <span className="h-3 w-3 rounded-full bg-yellow-500/80"></span>
                <span className="h-3 w-3 rounded-full bg-green-500/80"></span>
              </div>
              <div className="flex-1 px-4 py-3 text-zinc-300 overflow-x-auto whitespace-nowrap">
                <span className="text-zinc-500 line-through decoration-red-500/50">github.com</span>
                <span className="text-emerald-400 font-bold">bountic.com/b</span>
                <span>/owner/repo/issues/42</span>
              </div>
            </div>
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
          <div className="mx-auto max-w-5xl">
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
                <Link key={bounty.issue_id} href={`/b/${bounty.owner}/${bounty.repo}/issues/${bounty.issue_number}`}>
                  <div className="rounded-2xl border border-zinc-800/80 bg-linear-to-b from-zinc-900 to-zinc-950 p-5 transition-colors hover:border-emerald-400/50">
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
              <h3 className="mt-2 text-lg font-semibold text-zinc-100">The Escrow Lock</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Fund instantly via Locus. Back an issue with USDC. The funds are locked in a smart wallet, and a live ledger is pinned to the GitHub thread.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/70 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Step 2</p>
              <h3 className="mt-2 text-lg font-semibold text-zinc-100">Human & Machines</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Machines and humans compete. Our llms.txt API allows autonomous agents to find open bounties, submit PRs, and include their hidden payout wallets.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/70 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Step 3</p>
              <h3 className="mt-2 text-lg font-semibold text-zinc-100">AI Payout Split</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                When the PR is merged, our AI analyzes the commits and proposes a fair payout split. Maintainers click 'Approve' to instantly route the USDC.
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
              <h3 className="text-lg font-semibold text-zinc-100">Zero Timeline Pollution</h3>
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
    </>
  );
}
