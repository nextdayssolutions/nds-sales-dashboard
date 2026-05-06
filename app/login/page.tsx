"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  LogIn,
  ShieldCheck,
  Crown,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types";

// ─── DEV ONLY: ロール別クイックログイン ─────────────────────
// .env.local で各ロールのメール / パスワードを設定すると、
// dev 環境（npm run dev）でのみログイン画面下部にショートカットが出る。
// production ビルド (NODE_ENV === "production") では一切レンダリングされない。
const isDevEnv = process.env.NODE_ENV !== "production";

interface DevRole {
  role: UserRole;
  label: string;
  color: string;
  icon: LucideIcon;
  email?: string;
  password?: string;
}

const DEV_ROLES: DevRole[] = isDevEnv
  ? [
      {
        role: "admin",
        label: "管理者",
        color: "#FF6B6B",
        icon: ShieldCheck,
        email: process.env.NEXT_PUBLIC_DEV_QUICK_LOGIN_ADMIN_EMAIL,
        password: process.env.NEXT_PUBLIC_DEV_QUICK_LOGIN_ADMIN_PASSWORD,
      },
      {
        role: "manager",
        label: "マネージャー",
        color: "#FFB830",
        icon: Crown,
        email: process.env.NEXT_PUBLIC_DEV_QUICK_LOGIN_MANAGER_EMAIL,
        password: process.env.NEXT_PUBLIC_DEV_QUICK_LOGIN_MANAGER_PASSWORD,
      },
      {
        role: "member",
        label: "従業員",
        color: "#00D4FF",
        icon: Users,
        email: process.env.NEXT_PUBLIC_DEV_QUICK_LOGIN_MEMBER_EMAIL,
        password: process.env.NEXT_PUBLIC_DEV_QUICK_LOGIN_MEMBER_PASSWORD,
      },
    ]
  : [];

const hasAnyDevRole = DEV_ROLES.some((r) => r.email);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const performSignIn = async (rawEmail: string, rawPassword: string) => {
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: rawEmail.trim().toLowerCase(),
        password: rawPassword,
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
      toast.success(`${profile?.full_name ?? rawEmail} としてログインしました`);
      router.push(role === "admin" ? "/admin" : "/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ログインエラー");
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await performSignIn(email, password);
  };

  const onQuickLogin = async (devRole: DevRole) => {
    if (!devRole.email) return;
    if (!devRole.password) {
      // パスワード未設定の場合はメールだけ自動入力
      setEmail(devRole.email);
      toast.info(`${devRole.email} を入力しました。パスワードを手動入力してください。`);
      return;
    }
    setEmail(devRole.email);
    setPassword(devRole.password);
    await performSignIn(devRole.email, devRole.password);
  };

  return (
    <AppShell>
      <div className="flex min-h-[85vh] items-center justify-center">
        <div className="relative w-full max-w-md">
          {/* ── 背面グロー ───────────────────────────── */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-12 -z-10 opacity-70 blur-3xl"
            style={{
              background:
                "radial-gradient(60% 40% at 50% 20%, rgba(255,184,48,0.18), transparent 70%), radial-gradient(50% 50% at 50% 80%, rgba(0,212,255,0.18), transparent 70%)",
            }}
          />

          <div
            className="animate-fade-up overflow-hidden rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* ── ロゴエリア（透かしロゴ × 浮き上がる演出） ─────── */}
            <div className="relative overflow-hidden">
              {/* 下から立ち上る amber/cyan の柔らかい光柱 */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-full"
                style={{
                  background:
                    "radial-gradient(70% 60% at 50% 100%, rgba(255,184,48,0.18), transparent 65%), radial-gradient(50% 50% at 50% 110%, rgba(0,212,255,0.15), transparent 60%)",
                }}
              />
              {/* バナー下端のグラデ区切り */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,184,48,0.35), rgba(0,212,255,0.35), transparent)",
                }}
              />

              <div className="relative px-6 pt-12 pb-9">
                {/* ロゴ直下の集中グロー（浮上の地点）*/}
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-64 -translate-x-1/2 -translate-y-1/4 opacity-90 blur-2xl"
                  style={{
                    background:
                      "radial-gradient(closest-side, rgba(255,184,48,0.35), transparent)",
                  }}
                />

                <div className="relative animate-rise-glow">
                  <Image
                    src="/nds-logo-white.png"
                    alt="Next Days Solutions"
                    width={800}
                    height={600}
                    priority
                    className="mx-auto h-auto w-full max-w-[220px] object-contain opacity-90 drop-shadow-[0_0_28px_rgba(255,184,48,0.35)]"
                  />
                </div>

                <div className="relative mt-5 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber/80">
                    Sales Dashboard
                  </div>
                </div>
              </div>
            </div>

            {/* ── フォームエリア（下半分） ──────────── */}
            <div className="px-10 py-8">
              <p className="mb-5 text-center text-[12px] text-white/55">
                メールアドレスとパスワードを入力してログイン
              </p>

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
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-white outline-none transition focus:border-cyan/40 focus:bg-white/[0.05]"
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
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-white outline-none transition focus:border-cyan/40 focus:bg-white/[0.05]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-bold text-white shadow-[0_8px_24px_rgba(0,212,255,0.35)] transition hover:shadow-[0_12px_28px_rgba(0,212,255,0.45)] disabled:opacity-60"
                  style={{
                    background:
                      "linear-gradient(135deg, #00D4FF 0%, #7B5EA7 50%, #FFB830 100%)",
                  }}
                >
                  <LogIn size={14} />
                  {submitting ? "確認中..." : "ログイン"}
                </button>
              </form>

              <div className="mt-6 rounded-xl border border-amber/15 bg-amber/[0.04] p-3.5 text-[11px] leading-relaxed text-white/60">
                💡 アカウントは管理者が発行します。初期パスワードを受け取ったら、設定画面でいつでも変更できます。
              </div>

              {/* ── DEV ONLY: ロール別クイックログイン ──────────── */}
              {isDevEnv && hasAnyDevRole && (
                <div
                  className="mt-5 rounded-xl border p-3.5"
                  style={{
                    background: "rgba(123,94,167,0.08)",
                    borderColor: "rgba(123,94,167,0.3)",
                  }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple">
                      <Zap size={11} />
                      DEV — ロール別クイックログイン
                    </div>
                    <span className="rounded-full border border-purple/30 bg-purple/10 px-1.5 py-0.5 text-[9px] font-bold text-purple">
                      開発環境のみ
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {DEV_ROLES.map((r) => {
                      const Icon = r.icon;
                      const configured = !!r.email;
                      const fullCreds = !!(r.email && r.password);
                      return (
                        <button
                          key={r.role}
                          type="button"
                          onClick={() => onQuickLogin(r)}
                          disabled={!configured || submitting}
                          className="flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-30"
                          style={{
                            background: configured
                              ? `${r.color}10`
                              : "rgba(255,255,255,0.02)",
                            borderColor: configured
                              ? `${r.color}40`
                              : "rgba(255,255,255,0.08)",
                            color: configured ? r.color : "rgba(255,255,255,0.4)",
                          }}
                          title={
                            !configured
                              ? `${r.label} の email を NEXT_PUBLIC_DEV_QUICK_LOGIN_${r.role.toUpperCase()}_EMAIL に設定してください`
                              : fullCreds
                                ? `${r.email} で即ログイン`
                                : `${r.email} を自動入力（パスワードは手動）`
                          }
                        >
                          <Icon size={14} />
                          <span>{r.label}</span>
                          {configured && !fullCreds && (
                            <span className="text-[8px] font-medium opacity-70">
                              (email のみ)
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-[9px] leading-relaxed text-white/40">
                    `.env.local` の `NEXT_PUBLIC_DEV_QUICK_LOGIN_*_EMAIL` /
                    `_PASSWORD` を設定するとボタンが有効化されます。本番ビルドには露出しません。
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* フッター（コピーライト） */}
          <div className="mt-5 text-center text-[10px] tracking-wider text-white/30">
            © {new Date().getFullYear()} Next Days Solutions Inc.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
