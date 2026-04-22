"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogIn, Users, Crown, ShieldCheck, type LucideIcon } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DEFAULT_SESSIONS, setMockSession } from "@/lib/session";
import { MOCK_USERS } from "@/lib/mock-data";
import type { UserRole } from "@/types";

const ROLES: {
  role: UserRole;
  label: string;
  path: string;
  color: string;
  tint: string;
  icon: LucideIcon;
  desc: string;
}[] = [
  {
    role: "member",
    label: "従業員として開く",
    path: "/dashboard",
    color: "#00D4FF",
    tint: "rgba(0,212,255,0.12)",
    icon: Users,
    desc: "個人ダッシュボード（田中 誠司）",
  },
  {
    role: "manager",
    label: "マネージャーとして開く",
    path: "/dashboard",
    color: "#FFB830",
    tint: "rgba(255,184,48,0.12)",
    icon: Crown,
    desc: "個人 + チーム管理（山田 優子）",
  },
  {
    role: "admin",
    label: "管理者として開く",
    path: "/admin",
    color: "#FF6B6B",
    tint: "rgba(255,107,107,0.12)",
    icon: ShieldCheck,
    desc: "全従業員管理（椎葉 光太）",
  },
];

const isDev = process.env.NODE_ENV !== "production";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    // Phase B で Supabase Auth に差し替え。現状は mock で email 一致ユーザーとしてログイン
    const user = MOCK_USERS.find((u) => u.email === email.trim().toLowerCase());
    setTimeout(() => {
      setSubmitting(false);
      if (!user) {
        toast.error("そのメールアドレスのアカウントが見つかりません");
        return;
      }
      if (!password) {
        toast.error("パスワードを入力してください");
        return;
      }
      setMockSession({ userId: user.id, role: user.role });
      toast.success(`${user.name} としてログインしました`);
      router.push(user.role === "admin" ? "/admin" : "/dashboard");
    }, 400);
  };

  const signInAs = (role: UserRole, path: string) => {
    const session = DEFAULT_SESSIONS[role];
    const user = MOCK_USERS.find((u) => u.id === session.userId);
    setMockSession(session);
    toast.success(`${user?.name ?? ""} としてログイン（モック）`);
    router.push(path);
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
                placeholder="tanaka@example.co.jp"
                required
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

          {isDev && (
            <div className="mt-6 border-t border-white/10 pt-5">
              <div className="mb-3 text-[10px] uppercase tracking-wider text-white/30">
                🧪 開発用クイック切替
              </div>
              <div className="flex flex-col gap-2">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.role}
                      onClick={() => signInAs(r.role, r.path)}
                      className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-left transition hover:bg-white/[0.05]"
                    >
                      <div
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                        style={{ background: r.tint, color: r.color }}
                      >
                        <Icon size={14} />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold" style={{ color: r.color }}>
                          {r.label}
                        </div>
                        <div className="mt-0.5 text-[10px] text-white/40">
                          {r.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
