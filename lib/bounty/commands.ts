import { BOUNTY_COMMANDS } from "@/lib/constants/bounty";

export type ParsedBountyFundCommand = {
  amount: number;
};

const FUND_COMMAND_REGEX = new RegExp(
  `^${BOUNTY_COMMANDS.fund.replace("/", "\\/")}\\s+(\\d+(?:\\.\\d{1,2})?)\\s*$`,
  "i",
);

const APPROVE_COMMAND_REGEX = new RegExp(
  `^${BOUNTY_COMMANDS.approve.replace("/", "\\/")}\\s*$`,
  "i",
);

const ISSUE_REFERENCE_REGEX = /(?:fixes|closes|resolves)\s+#(\d+)/i;

export function parseBountyFundCommand(body: string): ParsedBountyFundCommand | null {
  const match = FUND_COMMAND_REGEX.exec(body.trim());

  if (!match) {
    return null;
  }

  const amount = Number.parseFloat(match[1]);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return { amount };
}

export function parseApproveCommand(body: string): boolean {
  return APPROVE_COMMAND_REGEX.test(body.trim());
}

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
