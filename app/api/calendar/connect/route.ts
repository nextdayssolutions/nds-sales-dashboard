import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAuthUrl } from "@/lib/google-oauth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * /api/calendar/connect
 * ログイン中ユーザーを Google OAuth に飛ばす。
 * state にユーザー ID を埋めて callback で復元。
 */
export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "Supabase 未設定（Phase B 待ち）" },
      { status: 503 }
    );
  }
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
    }
    const url = buildAuthUrl(user.id);
    return NextResponse.redirect(url);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown error" },
      { status: 500 }
    );
  }
}
