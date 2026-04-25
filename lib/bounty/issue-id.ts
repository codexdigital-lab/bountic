import { BOUNTY_ISSUE_ID_REGEX } from "@/lib/constants/bounty";

export type ParsedIssueId = {
  owner: string;
  repo: string;
  issueNumber: number;
};

export function buildIssueId(owner: string, repo: string, issueNumber: number): string {
  return `${owner}/${repo}#${issueNumber}`;
}

export function parseIssueId(issueId: string): ParsedIssueId | null {
  const match = BOUNTY_ISSUE_ID_REGEX.exec(issueId);

  if (!match) {
    return null;
  }

  const owner = match[1];
  const repo = match[2];
  const issueNumber = Number.parseInt(match[3], 10);

  if (!Number.isInteger(issueNumber)) {
    return null;
  }

  return { owner, repo, issueNumber };
}
