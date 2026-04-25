import { handleApproveCommand } from "@/lib/bounty/handlers/pr-approve";

export async function handlePrComment(eventPayload: unknown) {
  return handleApproveCommand(eventPayload);
}