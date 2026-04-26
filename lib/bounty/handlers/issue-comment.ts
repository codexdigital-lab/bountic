import "server-only";

import { getGithubInstallationClient, getGithubRepoInstallationId } from "@/lib/clients/github/server";
import { buildIssueId } from "@/lib/bounty/issue-id";
import { approveBountyPayout } from "@/lib/bounty/services/approve-payout";
import { issueCommentPayloadSchema } from "@/lib/bounty/schemas/payloads";
import { getSupabaseServiceClient } from "@/lib/clients/supabase/server";

const APPROVE_COMMAND_REGEX = /^\s*\/approve\s*$/i;

async function checkUserPermission(owner: string, repo: string, username: string): Promise<boolean> {
  const installationId = await getGithubRepoInstallationId(owner, repo);
  const github = await getGithubInstallationClient(installationId);

  try {
    const { data: collab } = await github.rest.repos.getCollaboratorPermissionLevel({
      owner,
      repo,
      username,
    });

    const permission = collab.permission;
    return permission === "admin" || permission === "maintain" || permission === "write";
  } catch {
    return false;
  }
}

export async function handleIssueComment(eventPayload: unknown) {
  const payload = issueCommentPayloadSchema.parse(eventPayload);

  if (payload.sender?.type === "Bot") {
    return { handled: false, reason: "ignored-bot" };
  }

  if (!APPROVE_COMMAND_REGEX.test(payload.comment.body)) {
    return { handled: false, reason: "not-approve-command" };
  }

  const isPullRequest = !!payload.issue.pull_request;
  if (isPullRequest) {
    return { handled: false, reason: "ignore-pr-comments" };
  }

  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const issueNumber = payload.issue.number;
  const issueId = buildIssueId(owner, repo, issueNumber);
  const commenter = payload.comment.user.login;

  const hasPermission = await checkUserPermission(owner, repo, commenter);

  if (!hasPermission) {
    return { handled: false, reason: "insufficient-permissions" };
  }

  const supabase = getSupabaseServiceClient();
  const { data: bounty, error: bountyError } = await supabase
    .from("bounties")
    .select("issue_id, status, total_amount, winning_pr_author, winning_pr_number")
    .eq("issue_id", issueId)
    .maybeSingle();

  if (bountyError) {
    throw new Error(`Failed to load bounty: ${bountyError.message}`);
  }

  if (!bounty) {
    return { handled: false, reason: "bounty-not-found" };
  }

  if (bounty.status !== "LOCKED") {
    return { handled: false, reason: "bounty-not-locked" };
  }

  try {
    const result = await approveBountyPayout({
      owner,
      repo,
      issueNumber,
      approvedBy: commenter,
    });

    return {
      handled: true,
      reason: "payout-approved-via-comment",
      issueId,
      payout: result,
    };
  } catch (error) {
    return {
      handled: false,
      reason: "payout-failed",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}