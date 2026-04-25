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