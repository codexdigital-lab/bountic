import "server-only";

import { getGithubInstallationClient, getGithubRepoInstallationId } from "@/lib/clients/github/server";
import { resolveWalletAddress } from "@/lib/bounty/services/wallet";
import { callLocusPayout } from "@/lib/bounty/services/payout";
import { updateBountyStatus } from "@/lib/bounty/services/github-sync";
import { buildIssueId } from "@/lib/bounty/issue-id";
import { parseApproveCommand } from "@/lib/bounty/commands";
import { prCommentPayloadSchema } from "@/lib/bounty/schemas/payloads";
import { getSupabaseServiceClient } from "@/lib/clients/supabase/server";

async function getIssueInstallationClient(owner: string, repo: string, installationId?: number) {
  if (installationId) {
    return getGithubInstallationClient(installationId);
  }

  const resolvedInstallationId = await getGithubRepoInstallationId(owner, repo);
  return getGithubInstallationClient(resolvedInstallationId);
}

export async function handleApproveCommand(eventPayload: unknown) {
  const payload = prCommentPayloadSchema.parse(eventPayload);

  const command = parseApproveCommand(payload.comment.body);

  if (!command) {
    return { handled: false, reason: "no-approve-command" };
  }

  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;

  const issueNumber = payload.issue?.pull_request?.url
    ? parseInt(payload.issue.pull_request.url.split("/").pop()!, 10)
    : null;

  if (!issueNumber) {
    return { handled: false, reason: "could-not-extract-issue-number" };
  }

  const issueId = buildIssueId(owner, repo, issueNumber);
  const github = await getIssueInstallationClient(owner, repo, payload.installation?.id);

  const supabase = getSupabaseServiceClient();
  const { data: bounty, error: bountyError } = await supabase
    .from("bounties")
    .select("issue_id, status, total_amount, payout_tx_hash")
    .eq("issue_id", issueId)
    .maybeSingle();

  if (bountyError) {
    throw new Error(`Failed to load bounty: ${bountyError.message}`);
  }

  if (!bounty) {
    return { handled: false, reason: "no-bounty" };
  }

  if (bounty.status !== "LOCKED") {
    return { handled: false, reason: "bounty-not-locked" };
  }

  const prAuthorUsername = payload.issue?.pull_request?.user?.login;

  if (!prAuthorUsername) {
    return { handled: false, reason: "no-pr-author" };
  }

  const walletAddress = await resolveWalletAddress({
    prDescription: null,
    prAuthorUsername,
  });

  if (!walletAddress) {
    const progressComment = await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: "⚠️ Could not find a payout wallet. Please add a comment with your Locus wallet address in the format: `<!-- locus-wallet: 0x... -->`",
    });

    return {
      handled: true,
      reason: "no-wallet-found",
      issueId,
      progressCommentId: progressComment.data.id,
    };
  }

  const progressComment = await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: "⏳ Initiating USDC payout...",
  });

  try {
    const payoutResult = await callLocusPayout({
      toAddress: walletAddress,
      amount: bounty.total_amount,
      memo: `Bountic payout for ${issueId}`,
    });

    await updateBountyStatus(issueId, "PAID", {
      payoutTxHash: payoutResult.txHash,
    });

    await github.rest.issues.updateComment({
      owner,
      repo,
      comment_id: progressComment.data.id,
      body: `✅ Payout complete! 🎉\n\n- **Amount**: $${bounty.total_amount.toFixed(2)} USDC\n- **Recipient**: ${walletAddress}\n- **Tx Hash**: ${payoutResult.txHash ?? "pending"}`,
    });

    return {
      handled: true,
      reason: "payout-complete",
      issueId,
      amount: bounty.total_amount,
      txHash: payoutResult.txHash,
    };
  } catch (error) {
    await github.rest.issues.updateComment({
      owner,
      repo,
      comment_id: progressComment.data.id,
      body: "❌ Payout failed. Please retry or contact support.",
    });

    throw error;
  }
}