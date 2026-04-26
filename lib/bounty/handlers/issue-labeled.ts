import "server-only";

import { getSupabaseServiceClient } from "@/lib/clients/supabase/server";
import { buildIssueId } from "@/lib/bounty/issue-id";
import { syncGithubBountyArtifacts } from "@/lib/bounty/services/github-sync";
import { githubIssueLabeledPayloadSchema } from "@/lib/bounty/schemas/payloads";
import { BOUNTY_LABELS } from "@/lib/constants/bounty";

function toLabelName(label: string | { name: string }): string {
  if (typeof label === "string") {
    return label;
  }

  return label.name;
}

export async function handleIssueLabeled(eventPayload: unknown) {
  const payload = githubIssueLabeledPayloadSchema.parse(eventPayload);

  if (payload.issue.pull_request) {
    return { handled: false, reason: "ignored-pull-request" };
  }

  const labelName = toLabelName(payload.label).toLowerCase();

  if (labelName !== BOUNTY_LABELS.trigger.toLowerCase()) {
    return { handled: false, reason: "ignored-label" };
  }

  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const issueNumber = payload.issue.number;
  const issueId = buildIssueId(owner, repo, issueNumber);

  const supabase = getSupabaseServiceClient();
  const { error: upsertError } = await supabase.from("bounties").upsert(
    {
      issue_id: issueId,
      status: "OPEN",
      issue_title: payload.issue.title,
      issue_body: payload.issue.body,
      issue_state: payload.issue.state,
      issue_url: payload.issue.html_url,
    },
    {
      onConflict: "issue_id",
      ignoreDuplicates: false,
    },
  );

  if (upsertError) {
    throw new Error(`Failed to upsert bounty from label event: ${upsertError.message}`);
  }

  await syncGithubBountyArtifacts(issueId);

  return {
    handled: true,
    reason: "bounty-initialized-from-label",
    issueId,
  };
}
