"use client";

import { AppShell } from "@/components/layout/AppShell";
import { RoleNav } from "@/components/layout/RoleNav";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { MemberDashboardTabs } from "@/components/members/MemberDashboardTabs";
import { useMockSession } from "@/lib/session";
import { useCustomers } from "@/lib/customer-store";
import { useSheet } from "@/lib/sheet-storage";
import { fmt, fmtDate } from "@/lib/utils";
import type { UserRole } from "@/types";

const roleBadge: Record<UserRole, { label: string; color: string; tint: string }> = {
  admin: { label: "管理者", color: "#FF6B6B", tint: "rgba(255,107,107,0.12)" },
  manager: { label: "マネージャー", color: "#FFB830", tint: "rgba(255,184,48,0.12)" },
  member: { label: "従業員", color: "#00D4FF", tint: "rgba(0,212,255,0.12)" },
};

export default function DashboardPage() {
  return (
    <RoleGuard allow={["member", "manager", "admin"]}>
      <DashboardBody />
    </RoleGuard>
  );
}

function DashboardBody() {
  const { session, user } = useMockSession();
  const { customers } = useCustomers(user?.id);
  const [development] = useSheet(user?.id ?? 0, "development");

  if (!session || !user) return null;

  const badge = roleBadge[user.role];
  const existingCount = customers.filter((c) => c.status === "既存").length;
  const leadCount = customers.filter((c) => c.status === "商談中").length;
  const trainingDone = development.curriculum.filter(
    (c) => c.selfUnderstood && c.selfCanDo
  ).length;
  const trainingPct =
    development.curriculum.length === 0
      ? 0
      : Math.round((trainingDone / development.curriculum.length) * 100);

  const monthRev = user.monthRevenue ?? 0;
  const ach = user.achievement ?? 0;

  const kpis = [
    {
      label: "担当顧客",
      value: customers.length > 0 ? `${customers.length}社` : "—",
      sub: `既存 ${existingCount} / 商談中 ${leadCount}`,
      color: "#00D4FF",
    },
    {
      label: "今月売上",
      value: monthRev > 0 ? fmt(monthRev) : "—",
      sub: ach > 0 ? `目標比 ${ach}%` : "—",
      color: ach >= 100 ? "#00E5A0" : "#FFB830",
    },
    {
      label: "今日の予定",
      value: "2件",
      sub: "商談・提案",
      color: "#B794F4",
    },
    {
      label: "育成計画進捗",
      value: `${trainingPct}%`,
      sub: `${trainingDone} / ${development.curriculum.length} 完了`,
      color: "#00E5A0",
    },
  ];

  return (
    <AppShell variant="member">
      <div className="mb-7 flex animate-fade-up items-center justify-between">
        <div>
          <div className="mb-1.5 text-[11px] uppercase tracking-[0.15em] text-cyan/70">
            Sales Personal Dashboard
          </div>
          <h1 className="flex flex-wrap items-center gap-2.5 text-[26px] font-extrabold tracking-tight">
            {user.name}
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
              style={{ background: badge.tint, color: badge.color }}
            >
              {badge.label}
            </span>
            {user.title && (
              <span className="text-sm font-medium text-white/40">{user.title}</span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <RoleNav role={user.role} current="dashboard" />
          <div className="text-right">
            <div className="text-xs text-white/40">
              {fmtDate(new Date("2026-04-19"))}
            </div>
            <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-mint/20 bg-mint/10 px-3 py-0.5 text-[11px] text-mint">
              <div className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-mint" />
              オンライン
            </div>
          </div>
        </div>
      </div>

      <div className="mb-7 grid animate-fade-up grid-cols-2 gap-3.5 md:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-white/7 bg-white/[0.04] px-5 py-4"
          >
            <div className="mb-2 text-[11px] text-white/40">{k.label}</div>
            <div
              className="text-2xl font-extrabold tracking-tight"
              style={{ color: k.color }}
            >
              {k.value}
            </div>
            <div className="mt-1 text-[11px] text-white/35">{k.sub}</div>
          </div>
        ))}
      </div>

      <MemberDashboardTabs userId={user.id} />

      <div className="mt-5 text-center text-[11px] text-white/20">
        Sales Dashboard v1.0 · 本番環境では Google Calendar / Sheets API と接続
      </div>
    </AppShell>
  );
}
