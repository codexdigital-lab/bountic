import { BOUNTY_COMMANDS } from "@/lib/constants/bounty";

export type ParsedBountyFundCommand = {
  amount: number;
};

const FUND_COMMAND_REGEX = new RegExp(
  `^${BOUNTY_COMMANDS.fund.replace("/", "\\/")}\\s+(\\d+(?:\\.\\d{1,2})?)\\s*$`,
  "i",
);

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
