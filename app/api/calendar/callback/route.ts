import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/google-oauth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * /api/calendar/callback?code=...&state=<user_id>
 * Google からの redirect を受け、refresh_token を public.users に保存。
 */
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "Supabase 未設定（Phase B 待ち）" },
      { status: 503 }
    );
  }
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${APP_URL}/dashboard?calendar=denied`);
  }
  if (!code || !state) {
    return NextResponse.json({ error: "code or state missing" }, { status: 400 });
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      // refresh_token が来ないのは「prompt=consent を付け忘れ」or「再連携時」
      // → ユーザーには「カレンダーを再連携してください」を出す
      return NextResponse.redirect(`${APP_URL}/dashboard?calendar=no_refresh`);
    }
    const admin = createAdminClient();
    const { error: updErr } = await admin
      .from("users")
      .update({ google_refresh_token: tokens.refresh_token })
      .eq("id", state);
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
    return NextResponse.redirect(`${APP_URL}/dashboard?calendar=connected`);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown error" },
      { status: 500 }
    );
  }
}
