import { NextResponse, type NextRequest } from "next/server";

import { createGithubOAuthSignInUrl } from "@/lib/auth/oauth";
import { sanitizeRelativeRedirectPath } from "@/lib/auth/redirect";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const nextPath = sanitizeRelativeRedirectPath(requestUrl.searchParams.get("next"));

  try {
    const { url } = await createGithubOAuthSignInUrl(nextPath);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(new URL(`/connect?auth_error=oauth_init_failed`, requestUrl.origin));
  }
}
