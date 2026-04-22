import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, isSupabaseConfigured } from "./env";

/**
 * Server Component / Server Action で使うクライアント。
 * セッション cookie から認証情報を取り出す。
 */
export async function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase 環境変数が未設定です（.env.local を確認）");
  }
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component から呼ばれた場合は cookieStore.set が無効
          // middleware / Route Handler 経由で更新されるので無視
        }
      },
    },
  });
}

/**
 * Service Role を使う管理用クライアント（RLS バイパス）。
 * auth.admin.* など admin 操作のみで使用。**ブラウザに渡すな**。
 */
export function createAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase service role key が未設定です");
  }
  // 動的 import を避けるため supabase-js を直接使う
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require("@supabase/supabase-js");
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
