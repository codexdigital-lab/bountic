import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServiceClient } from "@/lib/clients/supabase/server";
import { buildIssueId } from "@/lib/bounty/issue-id";

const routeParamsSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  issueNumber: z.coerce.number().int().positive(),
});

type FundingEventResponse = {
  id: string;
  funder_username: string;
  amount: number;
  payment_status: "PENDING" | "SUCCESS";
  created_at: string;
};

type BountyResponse = {
  issue_id: string;
  owner: string;
  repo: string;
  issue_number: number;
  status: "OPEN" | "LOCKED" | "PAID";
  total_amount: number;
  ledger_comment_id: string | null;
  payout_tx_hash: string | null;
  created_at: string;
  updated_at: string;
  funding_events: FundingEventResponse[];
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string; issueNumber: string }> }
) {
  const resolvedParams = await params;
  const routeParams = routeParamsSchema.parse(resolvedParams);

  const issueId = buildIssueId(routeParams.owner, routeParams.repo, routeParams.issueNumber);

  const supabase = getSupabaseServiceClient();

  const { data: bounty, error: bountyError } = await supabase
    .from("bounties")
    .select("issue_id, status, total_amount, ledger_comment_id, payout_tx_hash, created_at, updated_at")
    .eq("issue_id", issueId)
    .maybeSingle();

  if (bountyError) {
    return NextResponse.json(
      { error: "failed-to-fetch-bounty", message: bountyError.message },
      { status: 500 }
    );
  }

  if (!bounty) {
    return NextResponse.json(
      { error: "bounty-not-found" },
      { status: 404 }
    );
  }

  const { data: fundingEvents, error: eventsError } = await supabase
    .from("funding_events")
    .select("id, funder_username, amount, payment_status, created_at")
    .eq("issue_id", issueId)
    .order("created_at", { ascending: true });

  if (eventsError) {
    return NextResponse.json(
      { error: "failed-to-fetch-funding-events", message: eventsError.message },
      { status: 500 }
    );
  }

  const response: BountyResponse = {
    issue_id: bounty.issue_id,
    owner: routeParams.owner,
    repo: routeParams.repo,
    issue_number: routeParams.issueNumber,
    status: bounty.status,
    total_amount: bounty.total_amount,
    ledger_comment_id: bounty.ledger_comment_id,
    payout_tx_hash: bounty.payout_tx_hash,
    created_at: bounty.created_at,
    updated_at: bounty.updated_at,
    funding_events: (fundingEvents ?? []) as FundingEventResponse[],
  };

  return NextResponse.json({ bounty: response });
}