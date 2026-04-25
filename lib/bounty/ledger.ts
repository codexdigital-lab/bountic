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
