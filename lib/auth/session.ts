import "server-only";

import { getSupabaseServiceClient } from "@/lib/clients/supabase/server";

export async function getCurrentUser() {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}
