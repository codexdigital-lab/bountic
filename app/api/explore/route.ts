import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServiceClient } from "@/lib/clients/supabase/server";
import { parseIssueId } from "@/lib/bounty/issue-id";

const exploreQuerySchema = z.object({
  status: z.enum(["OPEN", "LOCKED", "PAID"]).optional(),
  min_amount: z.coerce.number().min(0).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sort: z.enum(["newest", "oldest", "amount_desc", "amount_asc"]).default("newest"),
});

type BountyResponse = {
  issue_id: string;
  owner: string;
  repo: string;
  issue_number: number;
  status: "OPEN" | "LOCKED" | "PAID";
  total_amount: number;
  created_at: string;
  updated_at: string;
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = exploreQuerySchema.parse(Object.fromEntries(searchParams));

  const supabase = getSupabaseServiceClient();

  let queryBuilder = supabase
    .from("bounties")
    .select("issue_id, status, total_amount, created_at, updated_at");

  if (query.status) {
    queryBuilder = queryBuilder.eq("status", query.status);
  }

  if (query.min_amount !== undefined) {
    queryBuilder = queryBuilder.gte("total_amount", query.min_amount);
  }

  switch (query.sort) {
    case "newest":
      queryBuilder = queryBuilder.order("created_at", { ascending: false });
      break;
    case "oldest":
      queryBuilder = queryBuilder.order("created_at", { ascending: true });
      break;
    case "amount_desc":
      queryBuilder = queryBuilder.order("total_amount", { ascending: false });
      break;
    case "amount_asc":
      queryBuilder = queryBuilder.order("total_amount", { ascending: true });
      break;
  }

  queryBuilder = queryBuilder.range(query.offset, query.offset + query.limit - 1);

  const { data: bounties, error } = await queryBuilder;

  if (error) {
    return NextResponse.json(
      { error: "failed-to-fetch-bounties", message: error.message },
      { status: 500 }
    );
  }

  const parsedBounties: BountyResponse[] = (bounties ?? [])
    .map((bounty) => {
      const parsed = parseIssueId(bounty.issue_id);
      if (!parsed) return null;

      return {
        issue_id: bounty.issue_id,
        owner: parsed.owner,
        repo: parsed.repo,
        issue_number: parsed.issueNumber,
        status: bounty.status,
        total_amount: bounty.total_amount,
        created_at: bounty.created_at,
        updated_at: bounty.updated_at,
      };
    })
    .filter((b): b is BountyResponse => b !== null);

  return NextResponse.json({
    bounties: parsedBounties,
    pagination: {
      limit: query.limit,
      offset: query.offset,
      count: parsedBounties.length,
    },
  });
}