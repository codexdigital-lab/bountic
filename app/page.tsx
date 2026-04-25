import Link from "next/link";
import { Button } from "@/components/ui/button";
import { fetchBounties } from "@/lib/api/client";

export const dynamic = "force-dynamic";

async function getStats() {
  try {
    const data = await fetchBounties({ limit: 1000 });
    const totalBounties = data.bounties.length;
    const totalFunded = data.bounties.reduce((sum, b) => sum + b.total_amount, 0);
    
    const paidBounties = data.bounties.filter((b) => b.status === "PAID").length;
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
    <div className="min-h-screen bg-black text-zinc-100">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-900/50 glass">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">B</span>
            </div>
            <span className="text-zinc-100">Bountic</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/explore" className="text-zinc-400 hover:text-zinc-100 transition-colors text-sm font-medium">
              Explore
            </Link>
            <Button 
              size="sm" 
              className="bg-green-500 hover:bg-green-600 text-black font-medium border-0"
            >
              Add to Your Repo
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative py-20 px-6 overflow-hidden">
          <div className="absolute inset-0 gradient-mesh" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/5 rounded-full blur-3xl" />
          
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400 mb-6">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live on Mainnet
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
                Autonomous USDC
                <br />
                <span className="text-gradient">bounties for open source</span>
              </h1>
              <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                Fund open-source issues with USDC, get automatically paid when PRs merge. 
                Zero friction, zero intermediaries, instant payouts.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/explore">
                  <Button size="lg" className="bg-green-500 hover:bg-green-600 text-black font-semibold px-8 h-12 text-base">
                    Explore Bounties
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-zinc-700 text-zinc-200 hover:bg-zinc-900 hover:text-white px-8 h-12 text-base bg-transparent"
                >
                  Add to Your Repo
                </Button>
              </div>
            </div>

            <div className="flex justify-center gap-12 mt-16 text-center">
              <div>
                <div className="text-3xl font-bold text-zinc-100">{totalBounties}</div>
                <div className="text-sm text-zinc-500">Bounties Created</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400">${formatAmount(totalFunded)}</div>
                <div className="text-sm text-zinc-500">Total Funded</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-zinc-100">{paidBounties}</div>
                <div className="text-sm text-zinc-500">Payouts Made</div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-2">See How It Works</h2>
            <p className="text-zinc-500 mb-6 text-sm">Watch a quick demo of funding an issue and receiving the payout</p>
            <div className="w-full aspect-video bg-zinc-900/50 rounded-xl border border-zinc-800 flex items-center justify-center max-w-xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-zinc-500 text-sm">Loom video placeholder</p>
              </div>
            </div>
          </div>
        </section>

        {featuredBounties.length > 0 && (
          <section className="py-20 px-6 border-y border-zinc-900/50">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Featured Bounties</h2>
                  <p className="text-zinc-500">Top open bounties worth funding</p>
                </div>
                <Link href="/explore" className="text-green-400 hover:text-green-300 text-sm font-medium">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredBounties.slice(0, 3).map((bounty) => (
                  <Link key={bounty.issue_id} href={`/bounty/${bounty.owner}/${bounty.repo}/${bounty.issue_number}`}>
                    <div className="glass rounded-xl p-5 hover:border-green-500/30 transition-all group cursor-pointer">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono text-zinc-500">{bounty.owner}/{bounty.repo}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                          {bounty.status}
                        </span>
                      </div>
                      <div className="text-xl font-bold text-green-400 font-mono mb-1">
                        ${formatAmount(bounty.total_amount)}
                        <span className="text-sm font-normal text-zinc-500 ml-1">USDC</span>
                      </div>
                      <div className="text-xs text-zinc-600 font-mono">#{bounty.issue_number}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="relative">
                <div className="absolute -left-4 top-0 bottom-0 w-px bg-gradient-to-b from-green-500/0 via-green-500/30 to-green-500/0 hidden md:block" />
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 border border-green-500/20">
                  <span className="text-green-400 font-bold">1</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-zinc-100">Fund an Issue</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Comment <code className="text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded text-xs">/bounty 50</code> on any GitHub issue. Lock in a USDC bounty instantly.
                </p>
              </div>
              <div className="relative">
                <div className="absolute -left-4 top-0 bottom-0 w-px bg-gradient-to-b from-green-500/0 via-green-500/30 to-green-500/0 hidden md:block" />
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 border border-green-500/20">
                  <span className="text-green-400 font-bold">2</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-zinc-100">PR Gets Merged</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  When a PR is merged, the bounty automatically locks. No manual intervention needed.
                </p>
              </div>
              <div className="relative">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 border border-green-500/20">
                  <span className="text-green-400 font-bold">3</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-zinc-100">Get Paid</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Run <code className="text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded text-xs">/approve</code> to trigger an instant USDC payout to your wallet.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 bg-zinc-950/50 border-y border-zinc-900/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Bountic?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass rounded-xl p-6">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Instant Payouts</h3>
                <p className="text-zinc-500 text-sm">
                  No waiting periods. Once approved, USDC is sent directly to your wallet via Locus.
                </p>
              </div>
              <div className="glass rounded-xl p-6">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Secure Escrow</h3>
                <p className="text-zinc-500 text-sm">
                  Funds are locked in smart contract escrow. Only released when conditions are met.
                </p>
              </div>
              <div className="glass rounded-xl p-6">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Permissionless</h3>
                <p className="text-zinc-500 text-sm">
                  No gatekeeping. Anyone can fund any issue. No approval needed from maintainers.
                </p>
              </div>
              <div className="glass rounded-xl p-6">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">GitHub Native</h3>
                <p className="text-zinc-500 text-sm">
                  Everything happens in GitHub. No separate app needed. Just use commands.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 bg-gradient-to-b from-zinc-900/50 to-black border-t border-zinc-900/50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to fund some bounties?</h2>
            <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
              Join the open-source funding revolution. Fund issues you care about, 
              get developers paid fairly.
            </p>
            <Link href="/explore">
              <Button size="lg" className="bg-green-500 hover:bg-green-600 text-black font-semibold px-8 h-12 text-base">
                Browse All Bounties
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-900 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">B</span>
              </div>
              <span className="text-zinc-400 text-sm">Bountic — Autonomous USDC bounties</span>
            </div>
            <div className="flex gap-8 text-sm text-zinc-500">
              <a href="https://github.com" className="hover:text-zinc-300 transition-colors">GitHub</a>
              <a href="#" className="hover:text-zinc-300 transition-colors">Twitter</a>
              <a href="#" className="hover:text-zinc-300 transition-colors">Discord</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-zinc-900 text-center text-zinc-600 text-sm">
            © 2026 Bountic. Built for the open-source community.
          </div>
        </div>
      </footer>
    </div>
  );
}