import Link from "next/link";

import { fetchBountyDetail } from "@/lib/api/client";
import { formatAmount, formatDateTime, getStatusColor } from "@/components/bounty/utils";
import { IssueMarkdown } from "@/components/markdown/issue-markdown";
import { SiteShell } from "@/components/site/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { FundButton } from "./fund-button";
import { ApproveButton } from "./approve-button";
import { GithubLoginButton } from "./github-login-button";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    owner: string;
    repo: string;
    issueNumber: string;
  }>;
};

function renderActivityText(event: {
  event_type: "FUNDING_ADDED" | "PR_COMPETING" | "BOUNTY_LOCKED" | "PAYOUT_SENT";
  actor_username: string | null;
  amount: number | null;
  pr_number: number | null;
  tx_hash: string | null;
  metadata: unknown;
}) {
  if (event.event_type === "FUNDING_ADDED") {
    const displayName =
      typeof event.metadata === "object" &&
      event.metadata !== null &&
      "funder_display_name" in event.metadata &&
      (event.metadata as { funder_display_name?: string }).funder_display_name
        ? (event.metadata as { funder_display_name: string }).funder_display_name
        : null;
    const fundingSource =
      typeof event.metadata === "object" &&
      event.metadata !== null &&
      "funding_source" in event.metadata &&
      (event.metadata as { funding_source?: string }).funding_source
        ? ` via ${(event.metadata as { funding_source: string }).funding_source}`
        : "";
    const label = displayName ?? (event.actor_username ? `@${event.actor_username}` : "Anonymous");

    return `${label} added $${formatAmount(event.amount ?? 0)}${fundingSource}`;
  }

  if (event.event_type === "PR_COMPETING") {
    return `PR #${event.pr_number ?? "?"} by @${event.actor_username ?? "unknown"} is competing for this bounty`;
  }

  if (event.event_type === "BOUNTY_LOCKED") {
    return `Bounty locked after merge of PR #${event.pr_number ?? "?"}`;
  }

  return `Bounty paid to @${event.actor_username ?? "unknown"} - tx ${event.tx_hash ?? "pending"}`;
}

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
      <SiteShell>
        <div className="flex min-h-[70vh] items-center justify-center px-5 sm:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Bounty Not Found</h1>
            <p className="mt-2 text-sm text-zinc-500">{error || "This bounty does not exist"}</p>
          </div>
        </div>
      </SiteShell>
    );
  }

  const issueUrl = bounty.issue_url ?? `https://github.com/${owner}/${repo}/issues/${issueNumber}`;
  const nextPath = `/bounty/${owner}/${repo}/${issueNumber}`;

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <Link href="/explore" className="text-xs text-zinc-400 transition-colors hover:text-zinc-200">
          Back to Explore
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-zinc-800/70 bg-zinc-950/60 backdrop-blur-sm">
            <CardHeader>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
                {owner}/{repo} #{issueNumber}
              </p>
              <CardTitle className="text-2xl leading-tight text-zinc-100">
                {bounty.issue_title ?? `Issue #${issueNumber}`}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={getStatusColor(bounty.status)}>
                  {bounty.status}
                </Badge>
                {bounty.issue_labels.map((label) => (
                  <Badge
                    key={label}
                    variant="outline"
                    className="border-zinc-700 bg-zinc-900/80 text-zinc-300"
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {bounty.issue_body?.trim() ? (
                <IssueMarkdown content={bounty.issue_body} />
              ) : (
                <p className="text-sm leading-relaxed text-zinc-400">No issue description provided.</p>
              )}
              <a
                href={issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-block text-sm text-emerald-300 underline-offset-4 hover:underline"
              >
                View on GitHub
              </a>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card style={{ paddingTop: 0 }} className="overflow-hidden border-zinc-800 bg-zinc-950/70">
              <CardContent className="bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.22),transparent_55%)] p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Total Bounty</p>
                <p className="mt-3 text-4xl font-bold text-emerald-300 sm:text-5xl">
                  $ {formatAmount(bounty.total_amount)}
                </p>
                <p className="mt-1 text-sm text-zinc-400">USDC</p>

                <div className="mt-5 rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Funder Leaderboard</p>
                <div className="mt-3 space-y-2 text-sm">
                  {bounty.leaderboard.length === 0 ? (
                    <p className="text-zinc-500">No confirmed funders yet.</p>
                  ) : (
                    bounty.leaderboard.map((entry, idx) => (
                        <div
                          key={`${entry.display_label}-${idx}`}
                          className="flex items-center justify-between text-zinc-300"
                        >
                          <span>
                            #{idx + 1} {entry.display_label}
                          </span>
                          <span className="font-mono text-emerald-300">${formatAmount(entry.total_amount)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {bounty.status === "OPEN" ? (
                  <div className="mt-5">
                    <FundButton issueId={bounty.issue_id} issueUrl={issueUrl} />
                  </div>
                ) : null}

                {bounty.status === "LOCKED" && bounty.viewer.can_approve_payment ? (
                  <div className="mt-5">
                    <ApproveButton owner={owner} repo={repo} issueNumber={Number(issueNumber)} />
                  </div>
                ) : null}

                {bounty.status === "LOCKED" && !bounty.viewer.is_authenticated ? (
                  <div className="mt-5 rounded-2xl border border-zinc-700/70 bg-zinc-900/70 p-4">
                    <p className="text-sm text-zinc-300">Maintainers must login via GitHub to approve payout.</p>
                    <GithubLoginButton nextPath={nextPath} />
                  </div>
                ) : null}

                {bounty.status === "LOCKED" && bounty.viewer.is_authenticated && !bounty.viewer.can_approve_payment ? (
                  <div className="mt-5 rounded-2xl border border-zinc-700/70 bg-zinc-900/70 p-4">
                    <p className="text-sm text-zinc-300">
                      You are logged in as @{bounty.viewer.github_username ?? "unknown"} but do not have maintainer
                      permissions for this repo.
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-6 border-zinc-800/70 bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="text-lg">Activity Feed</CardTitle>
          </CardHeader>
          <CardContent>
            {bounty.activity.length === 0 ? (
              <p className="text-sm text-zinc-500">No activity yet.</p>
            ) : (
              <ul className="space-y-3">
                {bounty.activity
                  .slice()
                  .reverse()
                  .map((event) => (
                    <li key={event.id} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
                      <p className="text-sm text-zinc-200">{renderActivityText(event)}</p>
                      <p className="mt-1 text-xs text-zinc-500">{formatDateTime(event.created_at)}</p>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </SiteShell>
  );
}
