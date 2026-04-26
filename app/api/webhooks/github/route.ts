import { NextResponse, type NextRequest } from "next/server";

import { getGithubAppClient } from "@/lib/clients/github/server";
import {
  handleIssueLabeled,
  handlePrOpened,
  handlePrClosed,
} from "@/lib/bounty/handlers";

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
      return NextResponse.json({ handled: false, reason: "issue-comments-disabled" });
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

    return NextResponse.json(result);
  } catch (handlerError) {
    console.error("Error handling GitHub webhook:", handlerError);

    return NextResponse.json(
      { error: "handler-failed", message: String(handlerError) },
      { status: 500 }
    );
  }
}
