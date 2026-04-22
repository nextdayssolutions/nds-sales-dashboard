"use client";

import { useState } from "react";
import { Plus, ShieldCheck, Users, Package, BarChart3, Lock, type LucideIcon } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { RoleNav } from "@/components/layout/RoleNav";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { UserTable } from "@/components/admin/UserTable";
import { InviteModal } from "@/components/admin/InviteModal";
import { ProductsTable } from "@/components/admin/ProductsTable";
import { MOCK_USERS } from "@/lib/mock-data";
import { useMockSession } from "@/lib/session";
import { fmt } from "@/lib/utils";

type TabId = "users" | "products" | "analytics" | "audit";

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "users", label: "従業員管理", icon: Users },
  { id: "products", label: "商材管理", icon: Package },
  { id: "analytics", label: "全社分析", icon: BarChart3 },
  { id: "audit", label: "監査ログ", icon: Lock },
];

export default function AdminPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <AdminBody />
    </RoleGuard>
  );
}

function AdminBody() {
  const [tab, setTab] = useState<TabId>("users");
  const [showInvite, setShowInvite] = useState(false);
  const { session, user } = useMockSession();
  if (!session || !user) return null;

  const withAch = MOCK_USERS.filter((u) => u.achievement !== null);
  const stats = {
    total: MOCK_USERS.length,
    totalMonthRevenue: MOCK_USERS.reduce((s, u) => s + (u.monthRevenue ?? 0), 0),
    totalCustomers: MOCK_USERS.reduce((s, u) => s + (u.customers ?? 0), 0),
    avgAchievement:
      withAch.length > 0
        ? Math.round(
            withAch.reduce((s, u) => s + (u.achievement ?? 0), 0) / withAch.length
          )
        : 0,
  };

  return (
    <AppShell variant="admin" maxWidth="wide">
      <div className="mb-7 flex items-center justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.15em] text-coral/70">
            <ShieldCheck size={12} />
            Admin Console
          </div>
          <h1 className="text-[26px] font-extrabold tracking-tight">
            管理者ダッシュボード{" "}
            <span className="ml-2.5 text-sm font-medium text-white/40">
              {user.name}
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <RoleNav role={user.role} current="admin" />
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_4px_20px_rgba(0,212,255,0.3)] transition"
            style={{
              background: "linear-gradient(135deg, #00D4FF 0%, #7B5EA7 100%)",
            }}
          >
            <Plus size={14} />
            従業員を招待
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3.5 md:grid-cols-4">
        {[
          { label: "総従業員数", value: stats.total, sub: "全ロール合計", color: "#00D4FF" },
          { label: "合計月商", value: fmt(stats.totalMonthRevenue), sub: "全社今月売上", color: "#00E5A0" },
          { label: "合計担当顧客", value: `${stats.totalCustomers}社`, sub: "全社合算", color: "#FFB830" },
          {
            label: "平均達成率",
            value: `${stats.avgAchievement}%`,
            sub: "今月目標比",
            color: "#B794F4",
          },
        ].map((k) => (
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

      <div className="mb-5 flex gap-1.5 rounded-2xl border border-white/7 bg-white/[0.03] p-1.5">
        {TABS.map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[13px] transition-all ${
                active
                  ? "bg-coral/12 font-bold text-coral"
                  : "font-medium text-white/45 hover:text-white/70"
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "users" && <UserTable />}
      {tab === "products" && <ProductsTable />}
      {(tab === "analytics" || tab === "audit") && (
        <div className="rounded-3xl border border-white/7 bg-white/[0.03] p-16 text-center text-white/30">
          <div className="mb-3 text-4xl">🚧</div>
          <div className="text-[13px]">このタブは開発中です</div>
        </div>
      )}

      <InviteModal open={showInvite} onClose={() => setShowInvite(false)} />
    </AppShell>
  );
}
