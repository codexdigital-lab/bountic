import "server-only";

import { getLocusServerClient } from "@/lib/clients/locus/server";

export type PayoutResult = {
  transactionId: string;
  txHash: string | null;
};

export async function callLocusPayout(params: {
  toAddress: string;
  amount: number;
  memo: string;
}): Promise<PayoutResult> {
  const locus = getLocusServerClient();

  const payload = await locus.request<{
    transaction_id: string;
    tx_hash?: string;
  }>("/pay/send", {
    method: "POST",
    body: {
      to_address: params.toAddress,
      amount: params.amount.toFixed(2),
      memo: params.memo,
    },
  });

  return {
    transactionId: payload.transaction_id,
    txHash: payload.tx_hash ?? null,
  };
}