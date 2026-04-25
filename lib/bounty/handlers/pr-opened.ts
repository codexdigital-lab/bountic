import "server-only";

import { getGithubInstallationClient, getGithubRepoInstallationId } from "@/lib/clients/github/server";
import { buildIssueId } from "@/lib/bounty/issue-id";
import { buildBountyActiveBody } from "@/lib/bounty/ledger";
import { prOpenedPayloadSchema } from "@/lib/bounty/schemas/payloads";
import { getSupabaseServiceClient } from "@/lib/clients/supabase/server";

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

  const github = await getIssueInstallationClient(owner, repo, payload.installation?.id);

  const body = buildBountyActiveBody(
    issueId,
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

  return {
    handled: true,
    reason: "bounty-notified",
    issueId,
    prAuthor: payload.pull_request.user.login,
    amount: bounty.total_amount,
  };
}