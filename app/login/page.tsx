"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error || !data.user) {
        const msg =
          error?.message === "Invalid login credentials"
            ? "メールアドレスまたはパスワードが正しくありません"
            : error?.message ?? "ログインに失敗しました";
        toast.error(msg);
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("full_name, role")
        .eq("id", data.user.id)
        .maybeSingle<{ full_name: string; role: UserRole }>();

      const role: UserRole = profile?.role ?? "member";
      toast.success(`${profile?.full_name ?? email} としてログインしました`);
      router.push(role === "admin" ? "/admin" : "/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ログインエラー");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="flex min-h-[85vh] items-center justify-center">
        <div className="w-full max-w-md animate-fade-up rounded-3xl border border-white/10 bg-white/[0.03] p-10">
          <div className="mb-6 text-center">
            <div className="mb-2 text-[11px] uppercase tracking-[0.15em] text-cyan/70">
              Sales Dashboard
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              営業ダッシュボード
            </h1>
            <p className="mt-3 text-sm text-white/50">
              メールアドレスとパスワードを入力してログイン
            </p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">
                メールアドレス
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-name@example.co.jp"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-white outline-none focus:border-cyan/40"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">
                パスワード
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-white outline-none focus:border-cyan/40"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold text-white shadow-[0_4px_20px_rgba(0,212,255,0.3)] transition disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #00D4FF 0%, #7B5EA7 100%)",
              }}
            >
              <LogIn size={14} />
              {submitting ? "確認中..." : "ログイン"}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-cyan/20 bg-cyan/[0.06] p-4 text-[11px] leading-relaxed text-white/60">
            💡 アカウントは管理者が発行します。初期パスワードを受け取ったら、設定画面でいつでも変更できます。
          </div>
        </div>
      </div>
    </AppShell>
  );
}
