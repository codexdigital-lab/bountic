import { fetchBounties, type Bounty } from "@/lib/api/client";
import { BountyGrid } from "@/components/bounty/bounty-grid";
import { FilterBar } from "@/components/bounty/filter-bar";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    status?: string;
    sort?: string;
    limit?: string;
    offset?: string;
  }>;
};

export default async function ExplorePage(props: Props) {
  const searchParams = await props.searchParams;
  const status = searchParams.status;
  const sort = searchParams.sort || "newest";
  const limit = Number(searchParams.limit) || 20;
  const offset = Number(searchParams.offset) || 0;

  let bounties: Bounty[] = [];
  let pagination = { limit, offset, count: 0 };

  try {
    const data = await fetchBounties({ status, sort, limit, offset });
    bounties = data.bounties;
    pagination = data.pagination;
  } catch (error) {
    console.error("Failed to fetch bounties:", error);
  }

  return (
    <section className="px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/90">Bounty Explorer</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">Explore Active Issues</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Discover open-source issues with funding, filter by lifecycle stage, and jump straight into each issue
            page to fund or track payout activity.
          </p>
          <div className="mt-6">
            <FilterBar />
          </div>
        </div>

        <BountyGrid bounties={bounties} />

        {pagination.count > 0 ? (
          <div className="mt-8 flex justify-center gap-4">
            {offset > 0 ? (
              <Link
                href={`/explore?${new URLSearchParams({
                  ...(status && status !== "all" ? { status } : {}),
                  sort,
                  offset: String(Math.max(0, offset - limit)),
                }).toString()}`}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                Previous
              </Link>
            ) : null}
            {pagination.count === limit ? (
              <Link
                href={`/explore?${new URLSearchParams({
                  ...(status && status !== "all" ? { status } : {}),
                  sort,
                  offset: String(offset + limit),
                }).toString()}`}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                Next
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
