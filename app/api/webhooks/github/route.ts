import { NextResponse, type NextRequest } from "next/server";

import { getGithubAppClient } from "@/lib/clients/github/server";
import { getSupabaseServiceClient } from "@/lib/clients/supabase/server";
import {
  handleIssueLabeled,
  handlePrOpened,
  handlePrClosed,
  handleIssueComment,
} from "@/lib/bounty/handlers";

async function isDeliveryProcessed(deliveryId: string): Promise<boolean> {
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase
    .from("webhook_deliveries")
    .select("id")
    .eq("delivery_id", deliveryId)
    .maybeSingle();
  return !!data;
}

async function markDeliveryProcessed(deliveryId: string, source: string): Promise<void> {
  const supabase = getSupabaseServiceClient();
  await supabase.from("webhook_deliveries").insert({
    delivery_id: deliveryId,
    source,
  });
}

export async function POST(request: NextRequest) {
  const app = getGithubAppClient();

  const signature = request.headers.get("x-hub-signature-256");
  const delivery = request.headers.get("x-github-delivery");
  const eventName = request.headers.get("x-github-event");

  if (!signature || !delivery || !eventName) {
    return NextResponse.json(
      { error: "missing-headers" },
      { status: 400 }
    );
  }

  const alreadyProcessed = await isDeliveryProcessed(delivery);
  if (alreadyProcessed) {
    return NextResponse.json({ handled: false, reason: "duplicate-delivery" });
  }

  const payload = await request.text();

  try {
    await app.webhooks.verifyAndReceive({
      id: delivery,
      name: eventName as "issues" | "issue_comment" | "pull_request",
      payload,
      signature,
    });
  } catch (webhookError) {
    console.error("GitHub webhook verification failed:", webhookError);
    return NextResponse.json(
      { error: "webhook-signature-invalid" },
      { status: 401 }
    );
  }

  const parsedPayload = JSON.parse(payload);

  if (parsedPayload.sender?.type === "Bot") {
    await markDeliveryProcessed(delivery, "github");
    return NextResponse.json({ handled: false, reason: "ignored-bot" });
  }

  try {
    let result: { handled: boolean; reason: string };

    if (eventName === "issues") {
      if (parsedPayload.action === "labeled") {
        result = await handleIssueLabeled(parsedPayload);
      } else {
        return NextResponse.json({ handled: false, reason: "ignored-action" });
      }
    } else if (eventName === "issue_comment") {
      if (parsedPayload.action === "created") {
        result = await handleIssueComment(parsedPayload);
      } else {
        return NextResponse.json({ handled: false, reason: "ignored-action" });
      }
    } else if (eventName === "pull_request") {
      if (parsedPayload.action === "opened") {
        result = await handlePrOpened(parsedPayload);
      } else if (parsedPayload.action === "closed") {
        result = await handlePrClosed(parsedPayload);
      } else {
        return NextResponse.json({ handled: false, reason: "ignored-action" });
      }
    } else {
      return NextResponse.json({ handled: false, reason: "ignored-event" });
    }

    await markDeliveryProcessed(delivery, "github");

    console.log(`Handled GitHub webhook event: ${eventName}, action: ${parsedPayload.action}, result:`, result);
    return NextResponse.json(result);
  } catch (handlerError) {
    console.error("Error handling GitHub webhook:", handlerError);

    return NextResponse.json(
      { error: "handler-failed", message: String(handlerError) },
      { status: 500 }
    );
  }
}