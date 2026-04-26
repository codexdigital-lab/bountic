import "server-only";

import { callLocusPayout } from "@/lib/bounty/services/payout";
import { resolveWalletAddress } from "@/lib/bounty/services/wallet";
import { syncGithubBountyArtifacts } from "@/lib/bounty/services/github-sync";
import { getSupabaseServiceClient } from "@/lib/clients/supabase/server";
import { buildIssueId } from "@/lib/bounty/issue-id";

export async function approveBountyPayout(params: {
  owner: string;
  repo: string;
  issueNumber: number;
  approvedBy: string;
}) {
  const issueId = buildIssueId(params.owner, params.repo, params.issueNumber);
  const supabase = getSupabaseServiceClient();

  const { data: bounty, error: bountyError } = await supabase
    .from("bounties")
    .select("issue_id, status, total_amount, winning_pr_author")
    .eq("issue_id", issueId)
    .maybeSingle();

  if (bountyError) {
    throw new Error(`Failed to load bounty: ${bountyError.message}`);
  }

  if (!bounty) {
    throw new Error("Bounty not found");
  }

  if (bounty.status !== "LOCKED") {
    throw new Error("Bounty must be LOCKED before payout approval");
  }

  if (!bounty.winning_pr_author) {
    throw new Error("No winning PR author found for payout");
  }

  const walletAddress = await resolveWalletAddress({
    prDescription: null,
    prAuthorUsername: bounty.winning_pr_author,
  });

  if (!walletAddress) {
    throw new Error("Could not resolve payout wallet for winning PR author");
  }

  const payoutResult = await callLocusPayout({
    toAddress: walletAddress,
    amount: bounty.total_amount,
    memo: `Bountic payout for ${issueId}`,
  });

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("bounties")
    .update({
      status: "PAID",
      payout_tx_hash: payoutResult.txHash,
      paid_at: now,
      approved_by: params.approvedBy,
    })
    .eq("issue_id", issueId);

  if (updateError) {
    throw new Error(`Failed to update bounty status to PAID: ${updateError.message}`);
  }

  const { error: payoutEventError } = await supabase.from("payout_events").insert({
    issue_id: issueId,
    recipient_username: bounty.winning_pr_author,
    amount: bounty.total_amount,
    locus_transaction_id: payoutResult.transactionId,
    transaction_hash: payoutResult.txHash,
    status: "SUCCESS",
    metadata: {
      approved_by: params.approvedBy,
      payout_source: "web",
    },
  });

  if (payoutEventError) {
    throw new Error(`Failed to persist payout event: ${payoutEventError.message}`);
  }

  const { error: activityError } = await supabase.from("activity_events").insert({
    issue_id: issueId,
    event_type: "PAYOUT_SENT",
    actor_username: bounty.winning_pr_author,
    amount: bounty.total_amount,
    tx_hash: payoutResult.txHash,
    metadata: {
      approved_by: params.approvedBy,
      payout_source: "web",
    },
  });

  if (activityError) {
    throw new Error(`Failed to persist payout activity: ${activityError.message}`);
  }

  await syncGithubBountyArtifacts(issueId);

  return {
    issueId,
    amount: bounty.total_amount,
    recipient: bounty.winning_pr_author,
    walletAddress,
    txHash: payoutResult.txHash,
    transactionId: payoutResult.transactionId,
    approvedBy: params.approvedBy,
  };
}
