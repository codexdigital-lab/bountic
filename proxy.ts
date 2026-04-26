import type { NextRequest } from "next/server";

import { updateSupabaseAuthSession } from "@/lib/clients/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSupabaseAuthSession(request);
}

export const config = {
  matcher: ["/connect/:path*", "/bounty/:path*"],
};
