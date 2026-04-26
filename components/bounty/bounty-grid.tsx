"use client";

import { BountyCard } from "./bounty-card";

type Bounty = {
  issue_id: string;
  owner: string;
  repo: string;
  issue_number: number;
  status: "OPEN" | "LOCKED" | "PAID";
  total_amount: number;
  created_at: string;
  updated_at: string;
};

export function BountyGrid({
  bounties,
  emptyMessage = "No bounties found",
}: {
  bounties: Bounty[];
  emptyMessage?: string;
}) {
  if (bounties.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 py-16 text-center">
        <p className="text-lg text-zinc-400">{emptyMessage}</p>
        <p className="mt-2 text-sm text-zinc-500">Try changing filters or check back after more issues are labeled.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {bounties.map((bounty) => (
        <BountyCard key={bounty.issue_id} bounty={bounty} />
      ))}
    </div>
  );
}
