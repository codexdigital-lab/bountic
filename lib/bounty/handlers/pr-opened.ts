import "server-only";

import { getGithubInstallationClient, getGithubRepoInstallationId } from "@/lib/clients/github/server";
import { buildIssueId } from "@/lib/bounty/issue-id";
import { buildBountyActiveBody } from "@/lib/bounty/ledger";
import { prOpenedPayloadSchema } from "@/lib/bounty/schemas/payloads";
import { getSupabaseServiceClient } from "@/lib/clients/supabase/server";
import { extractIssueNumberFromPrBody } from "@/lib/bounty/commands";

async function getIssueInstallationClient(owner: string, repo: string, installationId?: number) {
  if (installationId) {
    return getGithubInstallationClient(installationId);
  }

  const resolvedInstallationId = await getGithubRepoInstallationId(owner, repo);
  return getGithubInstallationClient(resolvedInstallationId);
}

export async function handlePrOpened(eventPayload: unknown) {
  const payload = prOpenedPayloadSchema.parse(eventPayload);

  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const linkedIssueNumber = extractIssueNumberFromPrBody(payload.pull_request.body);

  if (!linkedIssueNumber) {
    return { handled: false, reason: "no-linked-issue-in-pr-body" };
  }

  const issueId = buildIssueId(owner, repo, linkedIssueNumber);

  const supabase = getSupabaseServiceClient();
  const { data: bounty, error: bountyError } = await supabase
    .from("bounties")
    .select("issue_id, status, total_amount")
    .eq("issue_id", issueId)
    .maybeSingle();

  if (bountyError) {
    throw new Error(`Failed to load bounty: ${bountyError.message}`);
  }

  if (!bounty || bounty.status === "PAID") {
    return { handled: false, reason: "no-bounty-or-already-paid" };
  }

  const github = await getIssueInstallationClient(owner, repo, payload.installation?.id);

  const linkedIssueId = buildIssueId(owner, repo, linkedIssueNumber);

  const body = buildBountyActiveBody(
    linkedIssueId,
    payload.pull_request.user.login,
    bounty.total_amount,
    payload.pull_request.html_url,
  );

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: payload.pull_request.number,
    body,
  });

  const { error: activityError } = await supabase.from("activity_events").insert({
    issue_id: issueId,
    event_type: "PR_COMPETING",
    actor_username: payload.pull_request.user.login,
    pr_number: payload.pull_request.number,
    pr_url: payload.pull_request.html_url ?? null,
    metadata: {
      source: "pull_request.opened",
    },
  });

  if (activityError) {
    throw new Error(`Failed to record PR competing activity: ${activityError.message}`);
  }

  return {
    handled: true,
    reason: "bounty-notified",
    issueId: linkedIssueId,
    linkedIssueNumber,
    prNumber: payload.pull_request.number,
    prAuthor: payload.pull_request.user.login,
    amount: bounty.total_amount,
  };
}
