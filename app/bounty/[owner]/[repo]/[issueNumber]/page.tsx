import { fetchBountyDetail } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAmount, formatDateTime, getStatusColor } from "@/components/bounty/utils";
import { FundButton } from "./fund-button";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    owner: string;
    repo: string;
    issueNumber: string;
  }>;
};

export default async function BountyDetailPage(props: Props) {
  const params = await props.params;
  const { owner, repo, issueNumber } = params;

  let bounty = null;
  let error = null;

  try {
    const data = await fetchBountyDetail(owner, repo, Number(issueNumber));
    bounty = data.bounty;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load bounty";
  }

  if (error || !bounty) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Bounty Not Found</h1>
          <p className="text-zinc-500">{error || "This bounty does not exist"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <a
            href="/explore"
            className="text-zinc-500 hover:text-zinc-300 text-sm mb-4 inline-block"
          >
            ← Back to Explore
          </a>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 font-mono text-sm mb-1">
                {owner}/{repo}
              </p>
              <h1 className="text-3xl font-bold">#{issueNumber}</h1>
            </div>
            <Badge variant="outline" className={`text-lg px-4 py-1 ${getStatusColor(bounty.status)}`}>
              {bounty.status}
            </Badge>
          </div>
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800 mb-8">
          <CardHeader>
            <CardTitle className="text-zinc-400 text-sm font-normal">Total Bounty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-green-400 font-mono">
              ${formatAmount(bounty.total_amount)}
              <span className="text-2xl font-normal text-zinc-500 ml-2">USDC</span>
            </div>
          </CardContent>
        </Card>

        {bounty.status === "OPEN" && (
          <div className="mb-8">
            <FundButton
              issueId={bounty.issue_id}
              issueUrl={`https://github.com/${owner}/${repo}/issues/${issueNumber}`}
            />
          </div>
        )}

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">Funding Events</CardTitle>
          </CardHeader>
          <CardContent>
            {bounty.funding_events.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">No funding events yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-500">Funder</TableHead>
                    <TableHead className="text-zinc-500">Amount</TableHead>
                    <TableHead className="text-zinc-500">Status</TableHead>
                    <TableHead className="text-zinc-500 text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bounty.funding_events.map((event) => (
                    <TableRow key={event.id} className="border-zinc-800">
                      <TableCell className="font-mono text-green-400">
                        @{event.funder_username}
                      </TableCell>
                      <TableCell className="font-mono">
                        ${formatAmount(event.amount)} USDC
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            event.payment_status === "SUCCESS"
                              ? "border-green-500/50 text-green-400 bg-green-500/10"
                              : "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
                          }
                        >
                          {event.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-zinc-500 font-mono text-sm">
                        {formatDateTime(event.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {bounty.payout_tx_hash && (
          <Card className="bg-zinc-900/50 border-zinc-800 mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Payout</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-sm">
                <span className="text-zinc-500">Transaction Hash: </span>
                <span className="text-zinc-300">{bounty.payout_tx_hash}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}