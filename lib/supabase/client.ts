"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

/**
 * Client Component で使うブラウザ向けクライアント。
 */
export function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase 環境変数が未設定です（.env.local を確認）");
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
