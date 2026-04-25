"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getClientEnv } from "@/lib/env/client";
import type { Database } from "@/lib/types/database";

export type SupabaseBrowserDbClient = SupabaseClient<Database>;

let browserClient: SupabaseBrowserDbClient | undefined;

export function getSupabaseBrowserClient(): SupabaseBrowserDbClient {
  if (browserClient) {
    return browserClient;
  }

  const env = getClientEnv();

  browserClient = createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return browserClient;
}
