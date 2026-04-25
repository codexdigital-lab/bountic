import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { getSupabaseServerEnv } from "@/lib/env/server";
import type { Database } from "@/lib/types/database";

export type SupabaseDbClient = SupabaseClient<Database>;

let serviceClient: SupabaseDbClient | undefined;

export function getSupabaseServiceClient(): SupabaseDbClient {
  if (serviceClient) {
    return serviceClient;
  }

  const env = getSupabaseServerEnv();

  serviceClient = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serviceClient;
}

export async function getSupabaseServerClient(): Promise<SupabaseDbClient> {
  const env = getSupabaseServerEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
}
