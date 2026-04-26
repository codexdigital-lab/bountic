import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/clients/supabase/server";
import { getSupabaseServerEnv } from "@/lib/env/server";
import { sanitizeRelativeRedirectPath } from "@/lib/auth/redirect";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = sanitizeRelativeRedirectPath(requestUrl.searchParams.get("next"));
  const env = getSupabaseServerEnv();

  if (!code) {
    return NextResponse.redirect(new URL(`/connect?auth_error=missing_code`, env.NEXT_PUBLIC_APP_URL));
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/connect?auth_error=exchange_failed`, env.NEXT_PUBLIC_APP_URL));
  }

  const authed = await getSupabaseServerClient();
  const { data: userResponse } = await authed.auth.getUser();
  const user = userResponse.user;

  if (user?.email) {
    const providerUsername =
      user.user_metadata?.user_name ??
      user.user_metadata?.preferred_username ??
      user.user_metadata?.name ??
      null;

    if (providerUsername) {
      const service = getSupabaseServiceClient();
      await service.from("users").upsert({
        email: user.email,
        github_username: providerUsername,
      });
    }
  }

  return NextResponse.redirect(new URL(nextPath, env.NEXT_PUBLIC_APP_URL));
}
