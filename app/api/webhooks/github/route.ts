import { NextResponse, type NextRequest } from "next/server";

import { getGithubAppClient } from "@/lib/clients/github/server";
import { handleGithubFundingCommand } from "@/lib/bounty/funding-flow";

export async function POST(request: NextRequest) {
  const app = getGithubAppClient();

  const signature = request.headers.get("x-hub-signature-256");
  const delivery = request.headers.get("x-github-delivery");

  if (!signature || !delivery) {
    return NextResponse.json(
      { error: "missing-signature-or-delivery" },
      { status: 400 }
    );
  }

  const payload = await request.text();

  try {
    await app.webhooks.verifyAndReceive({
      id: delivery,
      name: "issue_comment",
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
  const event = parsedPayload;

  if (event.sender?.type === "Bot") {
    return NextResponse.json({ handled: false, reason: "ignored-bot" });
  }

  try {
    const result = await handleGithubFundingCommand(parsedPayload);

    return NextResponse.json(result);
  } catch (handlerError) {
    console.error("Error handling GitHub funding command:", handlerError);

    return NextResponse.json(
      { error: "handler-failed", message: String(handlerError) },
      { status: 500 }
    );
  }
}