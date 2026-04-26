import "server-only";

import { recomputeBountyTotals, syncGithubBountyArtifacts } from "@/lib/bounty/services/github-sync";
import { locusWebhookSchema } from "@/lib/bounty/schemas/payloads";
import { getSupabaseServiceClient } from "@/lib/clients/supabase/server";

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
    .select("id, issue_id, funder_username, funder_display_name, amount, funding_source, payment_status")
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

    const { error: activityError } = await supabase.from("activity_events").insert({
      issue_id: fundingEvent.issue_id,
      event_type: "FUNDING_ADDED",
      actor_username: fundingEvent.funder_username ?? null,
      amount: fundingEvent.amount,
      funding_event_id: fundingEvent.id,
      metadata: {
        source: "locus.webhook",
        event: payload.event,
        funding_source: fundingEvent.funding_source,
        funder_display_name: fundingEvent.funder_display_name ?? null,
        funder_username: fundingEvent.funder_username ?? null,
      },
    });

    if (activityError) {
      throw new Error(`Failed to insert funding activity: ${activityError.message}`);
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
