const API_BASE = process.env.NEXT_PUBLIC_APP_URL || "";

export type Bounty = {
  issue_id: string;
  owner: string;
  repo: string;
  issue_number: number;
  status: "OPEN" | "LOCKED" | "PAID";
  total_amount: number;
  created_at: string;
  updated_at: string;
};

export type BountyDetail = {
  issue_id: string;
  owner: string;
  repo: string;
  issue_number: number;
  status: "OPEN" | "LOCKED" | "PAID";
  total_amount: number;
  ledger_comment_id: string | null;
  payout_tx_hash: string | null;
  created_at: string;
  updated_at: string;
  funding_events: FundingEvent[];
};

export type FundingEvent = {
  id: string;
  funder_username: string;
  amount: number;
  payment_status: "PENDING" | "SUCCESS";
  created_at: string;
};

export type ExploreResponse = {
  bounties: Bounty[];
  pagination: {
    limit: number;
    offset: number;
    count: number;
  };
};

export type FundResponse = {
  success: boolean;
  checkout_session_id: string;
  checkout_url: string;
};

export async function fetchBounties(params: {
  status?: string;
  min_amount?: number;
  limit?: number;
  offset?: number;
  sort?: string;
}): Promise<ExploreResponse> {
  const searchParams = new URLSearchParams();
  if (params.status && params.status !== "all") searchParams.set("status", params.status);
  if (params.min_amount) searchParams.set("min_amount", String(params.min_amount));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.offset) searchParams.set("offset", String(params.offset));
  if (params.sort) searchParams.set("sort", params.sort);

  const res = await fetch(`${API_BASE}/api/explore?${searchParams.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch bounties");
  }
  return res.json();
}

export async function fetchBountyDetail(
  owner: string,
  repo: string,
  issueNumber: number
): Promise<{ bounty: BountyDetail }> {
  const res = await fetch(`${API_BASE}/api/bounty/${owner}/${repo}/${issueNumber}`);
  if (!res.ok) {
    throw new Error("Failed to fetch bounty");
  }
  return res.json();
}

export async function fundBounty(params: {
  issue_id: string;
  amount: number;
  funder_username: string;
  issue_url?: string;
}): Promise<FundResponse> {
  const res = await fetch(`${API_BASE}/api/bounty/fund`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error("Failed to create funding");
  }
  return res.json();
}