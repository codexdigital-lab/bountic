import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/clients/supabase/server";
import { createCheckoutSession } from "@/lib/bounty/services/checkout";
import { ensureBountyRow } from "@/lib/bounty/services/github-sync";

const fundBodySchema = z.object({
  issue_id: z.string().min(1),
  amount: z.number().positive(),
  funder_username: z.string().min(1).optional(),
  funder_display_name: z.string().min(1).optional(),
  issue_url: z.string().url().optional(),
  funding_source: z.enum(["WEB", "API"]).default("WEB"),
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
    const supabase = getSupabaseServiceClient();
    const { data: bounty, error: bountyError } = await supabase
      .from("bounties")
      .select("status")
      .eq("issue_id", validated.issue_id)
      .maybeSingle();

    if (bountyError) {
      throw new Error(`Failed to load bounty status: ${bountyError.message}`);
    }

    if (bounty?.status === "LOCKED" || bounty?.status === "PAID") {
      return NextResponse.json(
        { error: "bounty-not-fundable", message: "Bounty is no longer accepting funding" },
        { status: 400 },
      );
    }

    await ensureBountyRow(validated.issue_id);

    const checkoutSession = await createCheckoutSession({
      issueId: validated.issue_id,
      amount: validated.amount,
      funderUsername: validated.funder_username ?? "anonymous",
      funderDisplayName: validated.funder_display_name ?? null,
      sourceCommentId: 0,
      issueUrl: validated.issue_url,
    });

    let funderEmail: string | null = null;

    try {
      const authed = await getSupabaseServerClient();
      const { data: userSession } = await authed.auth.getUser();
      funderEmail = userSession.user?.email ?? null;
    } catch {
      funderEmail = null;
    }

    const { error: fundingError } = await supabase.from("funding_events").insert({
      issue_id: validated.issue_id,
      funder_username: validated.funder_username ?? null,
      funder_display_name: validated.funder_display_name ?? null,
      funder_email: funderEmail,
      amount: validated.amount,
      funding_source: validated.funding_source,
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
