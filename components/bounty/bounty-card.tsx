"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatAmount, getStatusColor } from "./utils";

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
  return (
    <Link href={`/bounty/${bounty.owner}/${bounty.repo}/${bounty.issue_number}`}>
      <Card className="group hover:border-green-500/50 transition-all duration-200 cursor-pointer bg-zinc-900/50 border-zinc-800 hover:shadow-lg hover:shadow-green-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400 font-mono">
              {bounty.owner}/{bounty.repo}
            </span>
            <Badge variant="outline" className={getStatusColor(bounty.status)}>
              {bounty.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-2xl font-bold text-green-400 font-mono">
            ${formatAmount(bounty.total_amount)}
            <span className="text-sm font-normal text-zinc-500 ml-1">USDC</span>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <div className="text-xs text-zinc-500 font-mono">
            #{bounty.issue_number}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}