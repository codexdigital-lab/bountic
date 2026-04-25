import "server-only";

import { getGithubInstallationClient, getGithubRepoInstallationId } from "@/lib/clients/github/server";
import { buildIssueId } from "@/lib/bounty/issue-id";
import { buildLockedCommentBody } from "@/lib/bounty/ledger";
import { prClosedPayloadSchema } from "@/lib/bounty/schemas/payloads";
import { getSupabaseServiceClient } from "@/lib/clients/supabase/server";

async function getIssueInstallationClient(owner: string, repo: string, installationId?: number) {
  if (installationId) {
    return getGithubInstallationClient(installationId);
  }

  const resolvedInstallationId = await getGithubRepoInstallationId(owner, repo);
  return getGithubInstallationClient(resolvedInstallationId);
}

export async function handlePrClosed(eventPayload: unknown) {
  const payload = prClosedPayloadSchema.parse(eventPayload);

  if (!payload.pull_request.merged) {
    return { handled: false, reason: "pr-not-merged" };
  }

  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const issueId = buildIssueId(owner, repo, payload.pull_request.number);

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

  await supabase
    .from("bounties")
    .update({ status: "LOCKED" })
    .eq("issue_id", issueId);

  const github = await getIssueInstallationClient(owner, repo, payload.installation?.id);

  const body = buildLockedCommentBody(issueId, bounty.total_amount);

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: payload.pull_request.number,
    body,
  });

  return {
    handled: true,
    reason: "bounty-locked",
    issueId,
    amount: bounty.total_amount,
  };
}