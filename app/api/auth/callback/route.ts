import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseServerClient } from "@/lib/clients/supabase/server";
import { getSupabaseServerEnv } from "@/lib/env/server";
import { sanitizeRelativeRedirectPath } from "@/lib/auth/redirect";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = sanitizeRelativeRedirectPath(requestUrl.searchParams.get("next"));
  const env = getSupabaseServerEnv();

  if (!code) {
    return NextResponse.redirect(new URL(`/dashboard?auth_error=missing_code`, env.NEXT_PUBLIC_APP_URL));
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/dashboard?auth_error=exchange_failed`, env.NEXT_PUBLIC_APP_URL));
  }

  return NextResponse.redirect(new URL(nextPath, env.NEXT_PUBLIC_APP_URL));
}
