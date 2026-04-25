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
      <div className="text-center py-16">
        <p className="text-zinc-500 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {bounties.map((bounty) => (
        <BountyCard key={bounty.issue_id} bounty={bounty} />
      ))}
    </div>
  );
}