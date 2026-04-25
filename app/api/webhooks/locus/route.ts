import { NextResponse, type NextRequest } from "next/server";

import { getLocusServerClient } from "@/lib/clients/locus/server";
import { handleLocusFundingWebhook } from "@/lib/bounty/funding-flow";

export async function POST(request: NextRequest) {
  const payload = await request.text();

  const signature = request.headers.get("x-signature-256");

  if (!signature) {
    return NextResponse.json(
      { error: "missing-signature" },
      { status: 400 }
    );
  }

  const locus = getLocusServerClient();

  if (!locus.verifyWebhookSignature(payload, signature)) {
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