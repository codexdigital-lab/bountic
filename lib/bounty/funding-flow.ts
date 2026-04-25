import "server-only";

import { z } from "zod";

import {
  getGithubInstallationClient,
  getGithubRepoInstallationId,
} from "@/lib/clients/github/server";
import { getLocusServerClient } from "@/lib/clients/locus/server";
import { getSupabaseServiceClient } from "@/lib/clients/supabase/server";
import { BOUNTY_LABELS } from "@/lib/constants/bounty";
import { getSupabaseServerEnv } from "@/lib/env/server";
import { buildIssueId, parseIssueId } from "@/lib/bounty/issue-id";
import { buildLedgerCommentBody } from "@/lib/bounty/ledger";
import { parseBountyFundCommand } from "@/lib/bounty/commands";

const githubIssueCommentPayloadSchema = z.object({
  action: z.literal("created"),
  installation: z
    .object({
      id: z.number().int().positive(),
    })
    .optional(),
  repository: z.object({
    name: z.string().min(1),
    owner: z.object({
      login: z.string().min(1),
    }),
  }),
  issue: z.object({
    number: z.number().int().positive(),
    pull_request: z.unknown().optional(),
    html_url: z.string().url().optional(),
  }),
  comment: z.object({
    id: z.number().int().positive(),
    body: z.string(),
    user: z.object({
      login: z.string().min(1),
    }),
  }),
});

const locusWebhookSchema = z.object({
  event: z.string(),
  data: z.record(z.string(), z.unknown()),
});

type CheckoutSession = {
  id: string;
  checkoutUrl: string;
  webhookSecret: string | null;
};

function toCurrencyAmount(amount: number): string {
  return amount.toFixed(2);
}

function extractCheckoutSession(payload: unknown): CheckoutSession {
  const candidate = z
    .object({
      id: z.string().optional(),
      sessionId: z.string().optional(),
      checkoutUrl: z.string().url().optional(),
      url: z.string().url().optional(),
      checkout_url: z.string().url().optional(),
      webhookSecret: z.string().optional(),
      webhook_secret: z.string().optional(),
      session: z
        .object({
          id: z.string().optional(),
          checkoutUrl: z.string().url().optional(),
          url: z.string().url().optional(),
          checkout_url: z.string().url().optional(),
          webhookSecret: z.string().optional(),
          webhook_secret: z.string().optional(),
        })
        .optional(),
    })
    .passthrough()
    .parse(payload);

  const id =
    candidate.id ??
    candidate.sessionId ??
    candidate.session?.id;

  if (!id) {
    throw new Error("Locus checkout response did not include a session id");
  }

  const env = getSupabaseServerEnv();
  const checkoutUrl =
    candidate.checkoutUrl ??
    candidate.checkout_url ??
    candidate.url ??
    candidate.session?.checkoutUrl ??
    candidate.session?.checkout_url ??
    candidate.session?.url ??
    `${env.NEXT_PUBLIC_APP_URL}/checkout/${id}`;

  const webhookSecret =
    candidate.webhookSecret ??
    candidate.webhook_secret ??
    candidate.session?.webhookSecret ??
    candidate.session?.webhook_secret ??
    null;

  return { id, checkoutUrl, webhookSecret };
}

async function getIssueInstallationClient(
  owner: string,
  repo: string,
  installationId?: number,
) {
  if (installationId) {
    return getGithubInstallationClient(installationId);
  }

  const resolvedInstallationId = await getGithubRepoInstallationId(owner, repo);
  return getGithubInstallationClient(resolvedInstallationId);
}

async function ensureBountyRow(issueId: string): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("bounties").upsert(
    {
      issue_id: issueId,
      status: "OPEN",
    },
    {
      onConflict: "issue_id",
      ignoreDuplicates: true,
    },
  );

  if (error) {
    throw new Error(`Failed to ensure bounty row: ${error.message}`);
  }
}

async function createCheckoutSession(params: {
  issueId: string;
  amount: number;
  funderUsername: string;
  sourceCommentId: number;
  issueUrl?: string;
}) {
  const env = getSupabaseServerEnv();
  const locus = getLocusServerClient();

  const payload = await locus.request<unknown>("/checkout/sessions", {
    method: "POST",
    body: {
      amount: toCurrencyAmount(params.amount),
      description: `Bountic funding for ${params.issueId}`,
      successUrl: params.issueUrl ?? `${env.NEXT_PUBLIC_APP_URL}/explore`,
      cancelUrl: params.issueUrl ?? `${env.NEXT_PUBLIC_APP_URL}/explore`,
      webhookUrl: `${env.NEXT_PUBLIC_APP_URL}/api/webhooks/locus`,
      metadata: {
        source: "bountic",
        issueId: params.issueId,
        funderUsername: params.funderUsername,
        sourceCommentId: String(params.sourceCommentId),
      },
    },
  });

  return extractCheckoutSession(payload);
}

async function recomputeBountyTotals(issueId: string): Promise<void> {
  const supabase = getSupabaseServiceClient();

  await ensureBountyRow(issueId);

  const { data: fundingEvents, error: eventsError } = await supabase
    .from("funding_events")
    .select("amount")
    .eq("issue_id", issueId)
    .eq("payment_status", "SUCCESS");

  if (eventsError) {
    throw new Error(`Failed to load funding events: ${eventsError.message}`);
  }

  const totalAmount = (fundingEvents ?? []).reduce((sum, event) => sum + event.amount, 0);

  const { error: updateError } = await supabase
    .from("bounties")
    .update({ total_amount: totalAmount, status: "OPEN" })
    .eq("issue_id", issueId);

  if (updateError) {
    throw new Error(`Failed to update bounty total: ${updateError.message}`);
  }
}

async function syncGithubBountyArtifacts(issueId: string): Promise<void> {
  const parsedIssue = parseIssueId(issueId);

  if (!parsedIssue) {
    throw new Error(`Invalid issue id format: ${issueId}`);
  }

  const github = await getIssueInstallationClient(parsedIssue.owner, parsedIssue.repo);
  const supabase = getSupabaseServiceClient();

  const { data: bounty, error: bountyError } = await supabase
    .from("bounties")
    .select("issue_id, status, total_amount, ledger_comment_id, payout_tx_hash")
    .eq("issue_id", issueId)
    .maybeSingle();

  if (bountyError || !bounty) {
    throw new Error(`Failed to load bounty before GitHub sync: ${bountyError?.message ?? "missing bounty"}`);
  }

  const { data: fundingEvents, error: eventsError } = await supabase
    .from("funding_events")
    .select("funder_username, amount, payment_status")
    .eq("issue_id", issueId)
    .eq("payment_status", "SUCCESS")
    .order("created_at", { ascending: true });

  if (eventsError) {
    throw new Error(`Failed to load funding events for ledger: ${eventsError.message}`);
  }

  await github.rest.issues.addLabels({
    owner: parsedIssue.owner,
    repo: parsedIssue.repo,
    issue_number: parsedIssue.issueNumber,
    labels: [BOUNTY_LABELS.active],
  });

  const ledgerBody = buildLedgerCommentBody(issueId, bounty, fundingEvents ?? []);

  if (!bounty.ledger_comment_id) {
    const created = await github.rest.issues.createComment({
      owner: parsedIssue.owner,
      repo: parsedIssue.repo,
      issue_number: parsedIssue.issueNumber,
      body: ledgerBody,
    });

    const { error } = await supabase
      .from("bounties")
      .update({ ledger_comment_id: String(created.data.id) })
      .eq("issue_id", issueId);

    if (error) {
      throw new Error(`Failed to save ledger comment id: ${error.message}`);
    }

    return;
  }

  const commentId = Number.parseInt(bounty.ledger_comment_id, 10);

  if (!Number.isInteger(commentId)) {
    const created = await github.rest.issues.createComment({
      owner: parsedIssue.owner,
      repo: parsedIssue.repo,
      issue_number: parsedIssue.issueNumber,
      body: ledgerBody,
    });

    const { error } = await supabase
      .from("bounties")
      .update({ ledger_comment_id: String(created.data.id) })
      .eq("issue_id", issueId);

    if (error) {
      throw new Error(`Failed to replace invalid ledger comment id: ${error.message}`);
    }

    return;
  }

  await github.rest.issues.updateComment({
    owner: parsedIssue.owner,
    repo: parsedIssue.repo,
    comment_id: commentId,
    body: ledgerBody,
  });
}

export async function handleGithubFundingCommand(eventPayload: unknown) {
  const payload = githubIssueCommentPayloadSchema.parse(eventPayload);

  if (payload.issue.pull_request) {
    return { handled: false, reason: "ignored-pull-request-comment" };
  }

  const command = parseBountyFundCommand(payload.comment.body);

  if (!command) {
    return { handled: false, reason: "no-bounty-command" };
  }

  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const issueNumber = payload.issue.number;
  const issueId = buildIssueId(owner, repo, issueNumber);
  const github = await getIssueInstallationClient(owner, repo, payload.installation?.id);

  const progressComment = await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: "⏳ Generating secure Locus checkout...",
  });

  try {
    const checkoutSession = await createCheckoutSession({
      issueId,
      amount: command.amount,
      funderUsername: payload.comment.user.login,
      sourceCommentId: payload.comment.id,
      issueUrl: payload.issue.html_url,
    });

    await ensureBountyRow(issueId);

    const supabase = getSupabaseServiceClient();
    const { error: fundingError } = await supabase.from("funding_events").insert({
      issue_id: issueId,
      funder_username: payload.comment.user.login,
      amount: command.amount,
      locus_checkout_id: checkoutSession.id,
      locus_webhook_secret: checkoutSession.webhookSecret,
      payment_status: "PENDING",
    });

    if (fundingError) {
      throw new Error(`Failed to persist funding event: ${fundingError.message}`);
    }

    const amountText = toCurrencyAmount(command.amount);
    await github.rest.issues.updateComment({
      owner,
      repo,
      comment_id: progressComment.data.id,
      body: `⚡️ Lock in your $${amountText} USDC bounty here: [Checkout Link](${checkoutSession.checkoutUrl})`,
    });

    return {
      handled: true,
      reason: "checkout-created",
      issueId,
      checkoutSessionId: checkoutSession.id,
    };
  } catch (error) {
    await github.rest.issues.updateComment({
      owner,
      repo,
      comment_id: progressComment.data.id,
      body: "❌ Unable to create the checkout session right now. Please retry in a few moments.",
    });

    throw error;
  }
}

function extractLocusSessionId(data: Record<string, unknown>): string | null {
  const directCandidates = [
    data.sessionId,
    data.session_id,
    data.checkoutSessionId,
    data.checkout_session_id,
    data.locusCheckoutId,
    data.locus_checkout_id,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }

  return null;
}

export async function handleLocusFundingWebhook(eventPayload: unknown) {
  const payload = locusWebhookSchema.parse(eventPayload);

  if (
    payload.event !== "checkout.session.paid" &&
    payload.event !== "checkout.success"
  ) {
    return { handled: false, reason: "ignored-event" };
  }

  const sessionId = extractLocusSessionId(payload.data);

  if (!sessionId) {
    throw new Error("Locus paid webhook missing session id");
  }

  const supabase = getSupabaseServiceClient();
  const { data: fundingEvent, error: fundingError } = await supabase
    .from("funding_events")
    .select("id, issue_id, payment_status")
    .eq("locus_checkout_id", sessionId)
    .maybeSingle();

  if (fundingError) {
    throw new Error(`Failed to look up funding event: ${fundingError.message}`);
  }

  if (!fundingEvent) {
    return { handled: false, reason: "unknown-session" };
  }

  if (fundingEvent.payment_status !== "SUCCESS") {
    const { error: updateError } = await supabase
      .from("funding_events")
      .update({ payment_status: "SUCCESS" })
      .eq("id", fundingEvent.id);

    if (updateError) {
      throw new Error(`Failed to mark funding event successful: ${updateError.message}`);
    }
  }

  await recomputeBountyTotals(fundingEvent.issue_id);
  await syncGithubBountyArtifacts(fundingEvent.issue_id);

  return {
    handled: true,
    reason: "funding-activated",
    issueId: fundingEvent.issue_id,
    checkoutSessionId: sessionId,
  };
}
