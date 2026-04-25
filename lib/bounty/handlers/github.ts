import "server-only";

import { getGithubInstallationClient, getGithubRepoInstallationId } from "@/lib/clients/github/server";
import { createCheckoutSession } from "@/lib/bounty/services/checkout";
import { ensureBountyRow } from "@/lib/bounty/services/github-sync";
import { buildIssueId } from "@/lib/bounty/issue-id";
import { parseBountyFundCommand } from "@/lib/bounty/commands";
import { githubIssueCommentPayloadSchema } from "@/lib/bounty/schemas/payloads";
import { getSupabaseServiceClient } from "@/lib/clients/supabase/server";
import { toCurrencyAmount } from "@/lib/bounty/services/checkout";

async function getIssueInstallationClient(owner: string, repo: string, installationId?: number) {
  if (installationId) {
    return getGithubInstallationClient(installationId);
  }

  const resolvedInstallationId = await getGithubRepoInstallationId(owner, repo);
  return getGithubInstallationClient(resolvedInstallationId);
}

export async function handleGithubFundingCommand(eventPayload: unknown) {
  const payload = githubIssueCommentPayloadSchema.parse(eventPayload);

  if (payload.issue.pull_request) {
    return { handled: false, reason: "ignored-pull-request-comment" };
  }

  const command = parseBountyFundCommand(payload.comment.body);

  if (!command) {
    return { handled: false, reason: "no-bounty-command" };
  }

  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const issueNumber = payload.issue.number;
  const issueId = buildIssueId(owner, repo, issueNumber);
  const github = await getIssueInstallationClient(owner, repo, payload.installation?.id);

  const progressComment = await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: "⏳ Generating secure Locus checkout...",
  });

  try {
    const checkoutSession = await createCheckoutSession({
      issueId,
      amount: command.amount,
      funderUsername: payload.comment.user.login,
      sourceCommentId: payload.comment.id,
      issueUrl: payload.issue.html_url,
    });

    await ensureBountyRow(issueId);

    const supabase = getSupabaseServiceClient();
    const { error: fundingError } = await supabase.from("funding_events").insert({
      issue_id: issueId,
      funder_username: payload.comment.user.login,
      amount: command.amount,
      locus_checkout_id: checkoutSession.id,
      locus_webhook_secret: checkoutSession.webhookSecret,
      payment_status: "PENDING",
    });

    if (fundingError) {
      throw new Error(`Failed to persist funding event: ${fundingError.message}`);
    }

    const amountText = toCurrencyAmount(command.amount);
    await github.rest.issues.updateComment({
      owner,
      repo,
      comment_id: progressComment.data.id,
      body: `⚡️ Lock in your $${amountText} USDC bounty here: [Checkout Link](${checkoutSession.checkoutUrl})`,
    });

    return {
      handled: true,
      reason: "checkout-created",
      issueId,
      checkoutSessionId: checkoutSession.id,
    };
  } catch (error) {
    await github.rest.issues.updateComment({
      owner,
      repo,
      comment_id: progressComment.data.id,
      body: "❌ Unable to create the checkout session right now. Please retry in a few moments.",
    });

    throw error;
  }
}