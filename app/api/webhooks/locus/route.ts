import { NextResponse, type NextRequest } from "next/server";

import { getLocusServerClient } from "@/lib/clients/locus/server";
import { getSupabaseServiceClient } from "@/lib/clients/supabase/server";
import { handleLocusFundingWebhook } from "@/lib/bounty/funding-flow";

async function verifyLocusWebhook(request: NextRequest): Promise<boolean> {
  const payload = await request.text();
  const signature = request.headers.get("x-signature-256");

  if (!signature) {
    return false;
  }

  const parsedPayload = JSON.parse(payload);
  const sessionId = extractSessionId(parsedPayload);

  if (!sessionId) {
    return false;
  }

  const supabase = getSupabaseServiceClient();
  const { data: fundingEvent } = await supabase
    .from("funding_events")
    .select("locus_webhook_secret")
    .eq("locus_checkout_id", sessionId)
    .maybeSingle();

  const locus = getLocusServerClient();

  if (fundingEvent?.locus_webhook_secret) {
    return locus.verifyWebhookSignatureWithSecret(payload, signature, fundingEvent.locus_webhook_secret);
  }

  return locus.verifyWebhookSignature(payload, signature);
}

function extractSessionId(data: Record<string, unknown>): string | null {
  const directCandidates = [
    data.sessionId,
    data.session_id,
    data.checkoutSessionId,
    data.checkout_session_id,
    data.id,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  const payload = await request.text();

  const signature = request.headers.get("x-signature-256");

  if (!signature) {
    return NextResponse.json(
      { error: "missing-signature" },
      { status: 400 }
    );
  }

  const isValid = await verifyLocusWebhook(request);

  if (!isValid) {
    return NextResponse.json(
      { error: "webhook-signature-invalid" },
      { status: 401 }
    );
  }

  const parsedPayload = JSON.parse(payload);

  try {
    const result = await handleLocusFundingWebhook(parsedPayload);

    return NextResponse.json(result);
  } catch (handlerError) {
    console.error("Error handling Locus webhook:", handlerError);

    return NextResponse.json(
      { error: "handler-failed", message: String(handlerError) },
      { status: 500 }
    );
  }
}