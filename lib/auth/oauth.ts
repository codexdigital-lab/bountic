import "server-only";

import { getSupabaseServerClient } from "@/lib/clients/supabase/server";
import { getSupabaseServerEnv } from "@/lib/env/server";

type OAuthSignInResult = {
  url: string;
};

export async function createGithubOAuthSignInUrl(nextPath = "/dashboard"): Promise<OAuthSignInResult> {
  const supabase = await getSupabaseServerClient();
  const env = getSupabaseServerEnv();

  const callbackUrl = new URL("/api/auth/callback", env.NEXT_PUBLIC_APP_URL);
  callbackUrl.searchParams.set("next", nextPath);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: callbackUrl.toString(),
      scopes: "read:user user:email",
    },
  });

  if (error || !data.url) {
    throw new Error("Failed to create GitHub OAuth URL");
  }

  return { url: data.url };
}
