import type { Database } from "@/lib/types/database";

type FundingEventRow = Database["public"]["Tables"]["funding_events"]["Row"];
type BountyRow = Database["public"]["Tables"]["bounties"]["Row"];

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

export function buildLedgerCommentBody(
  issueId: string,
  bounty: Pick<BountyRow, "total_amount" | "status" | "payout_tx_hash">,
  fundingEvents: Array<Pick<FundingEventRow, "funder_username" | "amount" | "payment_status">>,
): string {
  const successfulEvents = fundingEvents.filter((event) => event.payment_status === "SUCCESS");

  const lines = [
    `## Bountic Ledger`,
    `Issue: \`${issueId}\``,
    `Status: **${bounty.status}**`,
    ``,
    `| Funder | Amount (USDC) |`,
    `| --- | ---: |`,
  ];

  for (const event of successfulEvents) {
    lines.push(`| @${event.funder_username} | ${formatAmount(event.amount)} |`);
  }

  if (successfulEvents.length === 0) {
    lines.push(`| _No funding confirmed yet_ | 0.00 |`);
  }

  lines.push(``, `**Total:** ${formatAmount(bounty.total_amount)} USDC`);

  if (bounty.payout_tx_hash) {
    lines.push(`**Payout Tx:** \`${bounty.payout_tx_hash}\``);
  }

  return lines.join("\n");
}

export function buildBountyActiveBody(
  issueId: string,
  prAuthor: string,
  amount: number,
  prUrl?: string,
): string {
  const lines = [
    "⚡️ **Bounty Activated!**",
    "",
    `A pull request has been opened for this bountied issue.`,
    "",
    `**Bounty:** ${formatAmount(amount)} USDC`,
    `**PR Author:** @${prAuthor}`,
    "",
  ];

  if (prUrl) {
    lines.push(`**PR:** [View Pull Request](${prUrl})`);
    lines.push("");
  }

  lines.push(
    "When the PR is merged, the bounty will be locked and ready for payout.",
    "",
    "---",
    "_Bountic: Autonomous USDC bounties for open source_",
  );

  return lines.join("\n");
}

export function buildLockedCommentBody(issueId: string, amount: number): string {
  const lines = [
    "🔒 **Bounty Locked**",
    "",
    `This bounty has been locked after a successful PR merge.`,
    "",
    `**Amount:** ${formatAmount(amount)} USDC`,
    "",
    "The bounty is now ready for payout. Use `/approve` to release the funds.",
    "",
    "---",
    "_Bountic: Autonomous USDC bounties for open source_",
  ];

  return lines.join("\n");
}
