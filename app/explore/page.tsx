import { fetchBounties, type Bounty } from "@/lib/api/client";
import { BountyGrid } from "@/components/bounty/bounty-grid";
import { FilterBar } from "@/components/bounty/filter-bar";

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
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Explore Bounties</h1>
          <p className="text-zinc-400 text-lg">
            Find open-source issues with active bounties to fund
          </p>
        </div>

        <FilterBar />

        <BountyGrid bounties={bounties} />

        {pagination.count > 0 && (
          <div className="mt-8 flex justify-center gap-4">
            {offset > 0 && (
              <a
                href={`/explore?${new URLSearchParams({
                  ...(status && status !== "all" ? { status } : {}),
                  sort,
                  offset: String(Math.max(0, offset - limit)),
                }).toString()}`}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 hover:border-zinc-700"
              >
                Previous
              </a>
            )}
            {pagination.count === limit && (
              <a
                href={`/explore?${new URLSearchParams({
                  ...(status && status !== "all" ? { status } : {}),
                  sort,
                  offset: String(offset + limit),
                }).toString()}`}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 hover:border-zinc-700"
              >
                Next
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}