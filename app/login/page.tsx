"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users, Crown, ShieldCheck, type LucideIcon } from "lucide-react";
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
    desc: "全従業員管理（伊藤 由紀）",
  },
];

export default function LoginPage() {
  const router = useRouter();

  const signInAs = (role: UserRole, path: string) => {
    const session = DEFAULT_SESSIONS[role];
    const user = MOCK_USERS.find((u) => u.id === session.userId);
    setMockSession(session);
    toast.success(`${user?.name ?? ""}（${role}）としてログインしました`);
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
              Google Workspace アカウントでログインしてください
            </p>
          </div>

          <button
            onClick={() => signInAs("member", "/dashboard")}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
          >
            <GoogleIcon />
            Google でログイン
          </button>

          <div className="mt-6 rounded-xl border border-cyan/20 bg-cyan/[0.06] p-4 text-[11px] leading-relaxed text-white/60">
            💡 パスワード認証は無効化されています。管理者から招待メールを受け取った後、同じ Google アカウントでログインしてください。
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="mb-3 text-[10px] uppercase tracking-wider text-white/30">
              🧪 モック用クイック切替（開発中）
            </div>
            <div className="flex flex-col gap-2">
              {ROLES.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.role}
                    onClick={() => signInAs(r.role, r.path)}
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-left transition hover:bg-white/[0.05]"
                    style={{ borderColor: "rgba(255,255,255,0.1)" }}
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
        </div>
      </div>
    </AppShell>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.99.66-2.25 1.05-3.71 1.05-2.86 0-5.29-1.93-6.15-4.53H2.17v2.84A10.98 10.98 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.85 14.1c-.22-.66-.34-1.36-.34-2.1s.12-1.44.34-2.1V7.06H2.17A10.98 10.98 0 0 0 1 12c0 1.77.42 3.45 1.17 4.94l3.68-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.07.56 4.22 1.65l3.16-3.16C17.45 2.1 14.97 1 12 1 7.7 1 3.99 3.47 2.17 7.06l3.68 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
