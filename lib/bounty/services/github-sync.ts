import "server-only";

import { getSupabaseServiceClient } from "@/lib/clients/supabase/server";
import { getGithubInstallationClient, getGithubRepoInstallationId } from "@/lib/clients/github/server";
import { parseIssueId } from "@/lib/bounty/issue-id";
import { buildLedgerCommentBody } from "@/lib/bounty/ledger";
import { getSupabaseServerEnv } from "@/lib/env/server";

async function getIssueInstallationClient(owner: string, repo: string, installationId?: number) {
  if (installationId) {
    return getGithubInstallationClient(installationId);
  }

  const resolvedInstallationId = await getGithubRepoInstallationId(owner, repo);
  return getGithubInstallationClient(resolvedInstallationId);
}

async function pinIssueComment(params: {
  owner: string;
  repo: string;
  commentId: number;
  github: Awaited<ReturnType<typeof getIssueInstallationClient>>;
}): Promise<void> {
  try {
    await params.github.request("PUT /repos/{owner}/{repo}/issues/comments/{comment_id}/pin", {
      owner: params.owner,
      repo: params.repo,
      comment_id: params.commentId,
    });
  } catch (pinError) {
    console.warn("Failed to pin ledger comment:", pinError);
  }
}

export async function ensureBountyRow(issueId: string): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("bounties").upsert(
    {
      issue_id: issueId,
      status: "OPEN",
    },
    {
      onConflict: "issue_id",
      ignoreDuplicates: true,
    },
  );

  if (error) {
    throw new Error(`Failed to ensure bounty row: ${error.message}`);
  }
}

export async function recomputeBountyTotals(issueId: string): Promise<void> {
  const supabase = getSupabaseServiceClient();

  await ensureBountyRow(issueId);

  const { data: fundingEvents, error: eventsError } = await supabase
    .from("funding_events")
    .select("amount")
    .eq("issue_id", issueId)
    .eq("payment_status", "SUCCESS");

  if (eventsError) {
    throw new Error(`Failed to load funding events: ${eventsError.message}`);
  }

  const totalAmount = (fundingEvents ?? []).reduce((sum, event) => sum + event.amount, 0);

  const { error: updateError } = await supabase
    .from("bounties")
    .update({ total_amount: totalAmount })
    .eq("issue_id", issueId);

  if (updateError) {
    throw new Error(`Failed to update bounty total: ${updateError.message}`);
  }
}

export async function syncGithubBountyArtifacts(issueId: string): Promise<void> {
  const parsedIssue = parseIssueId(issueId);

  if (!parsedIssue) {
    throw new Error(`Invalid issue id format: ${issueId}`);
  }

  const github = await getIssueInstallationClient(parsedIssue.owner, parsedIssue.repo);
  const supabase = getSupabaseServiceClient();
  const env = getSupabaseServerEnv();
  const issuePageUrl = new URL(
    `/b/${parsedIssue.owner}/${parsedIssue.repo}/issues/${parsedIssue.issueNumber}`,
    env.NEXT_PUBLIC_APP_URL,
  ).toString();

  const { data: bounty, error: bountyError } = await supabase
    .from("bounties")
    .select("issue_id, status, total_amount, ledger_comment_id, payout_tx_hash")
    .eq("issue_id", issueId)
    .maybeSingle();

  if (bountyError || !bounty) {
    throw new Error(`Failed to load bounty before GitHub sync: ${bountyError?.message ?? "missing bounty"}`);
  }

  const { data: fundingEvents, error: eventsError } = await supabase
    .from("funding_events")
    .select("funder_username, funder_display_name, amount, payment_status")
    .eq("issue_id", issueId)
    .eq("payment_status", "SUCCESS")
    .order("created_at", { ascending: true });

  if (eventsError) {
    throw new Error(`Failed to load funding events for ledger: ${eventsError.message}`);
  }

  const ledgerBody = buildLedgerCommentBody(issueId, bounty, fundingEvents ?? [], issuePageUrl);

  if (!bounty.ledger_comment_id) {
    const created = await github.rest.issues.createComment({
      owner: parsedIssue.owner,
      repo: parsedIssue.repo,
      issue_number: parsedIssue.issueNumber,
      body: ledgerBody,
    });

    await pinIssueComment({
      owner: parsedIssue.owner,
      repo: parsedIssue.repo,
      commentId: created.data.id,
      github,
    });

    const { error } = await supabase
      .from("bounties")
      .update({ ledger_comment_id: String(created.data.id) })
      .eq("issue_id", issueId);

    if (error) {
      throw new Error(`Failed to save ledger comment id: ${error.message}`);
    }

    return;
  }

  const commentId = Number.parseInt(bounty.ledger_comment_id, 10);

  if (!Number.isInteger(commentId)) {
    const created = await github.rest.issues.createComment({
      owner: parsedIssue.owner,
      repo: parsedIssue.repo,
      issue_number: parsedIssue.issueNumber,
      body: ledgerBody,
    });

    await pinIssueComment({
      owner: parsedIssue.owner,
      repo: parsedIssue.repo,
      commentId: created.data.id,
      github,
    });

    const { error } = await supabase
      .from("bounties")
      .update({ ledger_comment_id: String(created.data.id) })
      .eq("issue_id", issueId);

    if (error) {
      throw new Error(`Failed to replace invalid ledger comment id: ${error.message}`);
    }

    return;
  }

  await github.rest.issues.updateComment({
    owner: parsedIssue.owner,
    repo: parsedIssue.repo,
    comment_id: commentId,
    body: ledgerBody,
  });

  await pinIssueComment({
    owner: parsedIssue.owner,
    repo: parsedIssue.repo,
    commentId: commentId,
    github,
  });
}

export async function updateBountyStatus(issueId: string, status: "OPEN" | "LOCKED" | "PAID", extras?: {
  payoutTxHash?: string | null;
}): Promise<void> {
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from("bounties")
    .update({
      status,
      payout_tx_hash: extras?.payoutTxHash ?? null,
    })
    .eq("issue_id", issueId);

  if (error) {
    throw new Error(`Failed to update bounty status: ${error.message}`);
  }
}
