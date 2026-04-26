import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseServerClient } from "@/lib/clients/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  
  await supabase.auth.signOut();
  
  const requestUrl = new URL(request.url);
  const referer = request.headers.get("referer");
  const redirectTo = referer ? new URL(referer).pathname : "/";
  
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}

export async function GET() {
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}