const ISSUE_REFERENCE_REGEX = /(?:fix|fixes|closes?|resolves?)\s+#(\d+)/i;

export function extractIssueNumberFromPrBody(body: string | null): number | null {
  if (!body) {
    return null;
  }

  const match = ISSUE_REFERENCE_REGEX.exec(body);

  if (!match) {
    return null;
  }

  const issueNumber = Number.parseInt(match[1], 10);

  if (!Number.isInteger(issueNumber)) {
    return null;
  }

  return issueNumber;
}
