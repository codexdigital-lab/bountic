import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getGithubRepoInstallationId, getGithubInstallationClient } from "@/lib/clients/github/server";
import { getSupabaseServiceClient } from "@/lib/clients/supabase/server";
import { buildIssueId } from "@/lib/bounty/issue-id";
import { getViewerRepoPermission } from "@/lib/auth/github-permissions";

const routeParamsSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  issueNumber: z.coerce.number().int().positive(),
});

type FundingEventResponse = {
  id: string;
  funder_username: string;
  amount: number;
  funding_source: "WEB" | "API";
  payment_status: "PENDING" | "SUCCESS";
  created_at: string;
};

type LeaderboardEntry = {
  funder_username: string;
  total_amount: number;
  contribution_count: number;
};

type ActivityEventResponse = {
  id: string;
  event_type: "FUNDING_ADDED" | "PR_COMPETING" | "BOUNTY_LOCKED" | "PAYOUT_SENT";
  actor_username: string | null;
  amount: number | null;
  pr_number: number | null;
  pr_url: string | null;
  tx_hash: string | null;
  metadata: unknown;
  created_at: string;
};

type BountyResponse = {
  issue_id: string;
  owner: string;
  repo: string;
  issue_number: number;
  issue_title: string | null;
  issue_body: string | null;
  issue_state: string | null;
  issue_url: string | null;
  issue_labels: string[];
  status: "OPEN" | "LOCKED" | "PAID";
  total_amount: number;
  ledger_comment_id: string | null;
  payout_tx_hash: string | null;
  winning_pr_number: number | null;
  winning_pr_author: string | null;
  winning_pr_url: string | null;
  locked_at: string | null;
  paid_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  leaderboard: LeaderboardEntry[];
  activity: ActivityEventResponse[];
  funding_events: FundingEventResponse[];
  viewer: {
    is_authenticated: boolean;
    github_username: string | null;
    permission: "admin" | "maintain" | "write" | "triage" | "read" | "none" | null;
    can_approve_payment: boolean;
  };
};

async function fetchIssueLabels(params: { owner: string; repo: string; issueNumber: number }): Promise<string[]> {
  try {
    const installationId = await getGithubRepoInstallationId(params.owner, params.repo);
    const github = await getGithubInstallationClient(installationId);
    const issue = await github.rest.issues.get({
      owner: params.owner,
      repo: params.repo,
      issue_number: params.issueNumber,
    });

    return issue.data.labels
      .map((label) => (typeof label === "string" ? label : label.name))
      .filter((label): label is string => typeof label === "string" && label.length > 0);
  } catch {
    return [];
  }
}

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
    .select(
      "issue_id, status, total_amount, issue_title, issue_body, issue_state, issue_url, ledger_comment_id, payout_tx_hash, winning_pr_number, winning_pr_author, winning_pr_url, locked_at, paid_at, approved_by, created_at, updated_at",
    )
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
    .select("id, funder_username, amount, funding_source, payment_status, created_at")
    .eq("issue_id", issueId)
    .order("created_at", { ascending: true });

  if (eventsError) {
    return NextResponse.json(
      { error: "failed-to-fetch-funding-events", message: eventsError.message },
      { status: 500 }
    );
  }

  const { data: activityEvents, error: activityError } = await supabase
    .from("activity_events")
    .select("id, event_type, actor_username, amount, pr_number, pr_url, tx_hash, metadata, created_at")
    .eq("issue_id", issueId)
    .order("created_at", { ascending: true });

  if (activityError) {
    return NextResponse.json(
      { error: "failed-to-fetch-activity-events", message: activityError.message },
      { status: 500 }
    );
  }

  const successfulFundingEvents = (fundingEvents ?? []).filter((event) => event.payment_status === "SUCCESS");

  const leaderboardMap = new Map<string, { total: number; count: number }>();
  for (const event of successfulFundingEvents) {
    const existing = leaderboardMap.get(event.funder_username) ?? { total: 0, count: 0 };
    existing.total += event.amount;
    existing.count += 1;
    leaderboardMap.set(event.funder_username, existing);
  }

  const leaderboard: LeaderboardEntry[] = [...leaderboardMap.entries()]
    .map(([funder_username, stats]) => ({
      funder_username,
      total_amount: stats.total,
      contribution_count: stats.count,
    }))
    .sort((a, b) => b.total_amount - a.total_amount);

  const issueLabels = await fetchIssueLabels({
    owner: routeParams.owner,
    repo: routeParams.repo,
    issueNumber: routeParams.issueNumber,
  });

  const viewerPermission = await getViewerRepoPermission(routeParams.owner, routeParams.repo);

  const response: BountyResponse = {
    issue_id: bounty.issue_id,
    owner: routeParams.owner,
    repo: routeParams.repo,
    issue_number: routeParams.issueNumber,
    issue_title: bounty.issue_title,
    issue_body: bounty.issue_body,
    issue_state: bounty.issue_state,
    issue_url: bounty.issue_url,
    issue_labels: issueLabels,
    status: bounty.status,
    total_amount: bounty.total_amount,
    ledger_comment_id: bounty.ledger_comment_id,
    payout_tx_hash: bounty.payout_tx_hash,
    winning_pr_number: bounty.winning_pr_number,
    winning_pr_author: bounty.winning_pr_author,
    winning_pr_url: bounty.winning_pr_url,
    locked_at: bounty.locked_at,
    paid_at: bounty.paid_at,
    approved_by: bounty.approved_by,
    created_at: bounty.created_at,
    updated_at: bounty.updated_at,
    leaderboard,
    activity: (activityEvents ?? []) as ActivityEventResponse[],
    funding_events: (fundingEvents ?? []) as FundingEventResponse[],
    viewer: {
      is_authenticated: viewerPermission.isAuthenticated,
      github_username: viewerPermission.githubUsername,
      permission: viewerPermission.permission,
      can_approve_payment: viewerPermission.canApprovePayment,
    },
  };

  return NextResponse.json({ bounty: response });
}
