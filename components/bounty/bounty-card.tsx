"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatAmount, formatDate, getStatusColor } from "./utils";

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

export function BountyCard({ bounty }: { bounty: Bounty }) {
  const bountyHref = `/b/${bounty.owner}/${bounty.repo}/issues/${bounty.issue_number}`;
  const isUnfunded = bounty.status === "OPEN" && bounty.total_amount === 0;

  return (
    <Link href={bountyHref} className="group">
      <Card className="border-zinc-800/80 bg-linear-to-b from-zinc-900 to-zinc-950 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-mono text-sm text-zinc-400">
              {bounty.owner}/{bounty.repo}/{bounty.issue_number}
            </p>
            <Badge variant="outline" className={getStatusColor(bounty.status)}>
              {bounty.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Total Bounty</p>
          {isUnfunded ? (
            <p className="text-2xl font-semibold text-zinc-100">No funds yet</p>
          ) : (
            <div className="font-mono text-2xl font-bold text-emerald-300">
              ${formatAmount(bounty.total_amount)}
              <span className="ml-1 text-sm font-normal text-zinc-500">USDC</span>
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md border border-zinc-800 bg-zinc-900/70 px-2.5 py-2">
              <p className="text-zinc-500">Issue</p>
              <p className="mt-1 font-mono text-zinc-200">#{bounty.issue_number}</p>
            </div>
            <div className="rounded-md border border-zinc-800 bg-zinc-900/70 px-2.5 py-2">
              <p className="text-zinc-500">Updated</p>
              <p className="mt-1 text-zinc-200">{formatDate(bounty.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
