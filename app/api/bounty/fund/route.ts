import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServiceClient } from "@/lib/clients/supabase/server";
import { createCheckoutSession } from "@/lib/bounty/services/checkout";
import { ensureBountyRow } from "@/lib/bounty/services/github-sync";

const fundBodySchema = z.object({
  issue_id: z.string().min(1),
  amount: z.number().positive(),
  funder_username: z.string().min(1),
  issue_url: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid-json-body" },
      { status: 400 }
    );
  }

  const validated = fundBodySchema.parse(body);

  try {
    await ensureBountyRow(validated.issue_id);

    const checkoutSession = await createCheckoutSession({
      issueId: validated.issue_id,
      amount: validated.amount,
      funderUsername: validated.funder_username,
      sourceCommentId: 0,
      issueUrl: validated.issue_url,
    });

    const supabase = getSupabaseServiceClient();
    const { error: fundingError } = await supabase.from("funding_events").insert({
      issue_id: validated.issue_id,
      funder_username: validated.funder_username,
      amount: validated.amount,
      locus_checkout_id: checkoutSession.id,
      locus_webhook_secret: checkoutSession.webhookSecret,
      payment_status: "PENDING",
    });

    if (fundingError) {
      throw new Error(`Failed to persist funding event: ${fundingError.message}`);
    }

    return NextResponse.json({
      success: true,
      checkout_session_id: checkoutSession.id,
      checkout_url: checkoutSession.checkoutUrl,
    });
  } catch (error) {
    console.error("Error creating funding:", error);

    return NextResponse.json(
      {
        error: "funding-creation-failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}