"use client";

import { useState } from "react";
import {
  X,
  User,
  Users,
  Calendar,
  TrendingUp,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import type { UserRecord, UserRole, UserStatus } from "@/types";
import { CRMPanel } from "@/components/dashboard/CRMPanel";
import { SchedulePanel } from "@/components/dashboard/SchedulePanel";
import { RevenuePanel } from "@/components/dashboard/RevenuePanel";
import { SheetPanel } from "@/components/sheets/SheetPanel";
import { fmt, fmtFull } from "@/lib/utils";
import { MOCK_USERS } from "@/lib/mock-data";

interface Props {
  target: UserRecord | null;
  onClose: () => void;
}

type Tab = "info" | "crm" | "schedule" | "revenue" | "sheets";

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "info", label: "基本情報", icon: User },
  { id: "crm", label: "CRM", icon: Users },
  { id: "schedule", label: "スケジュール", icon: Calendar },
  { id: "revenue", label: "売上", icon: TrendingUp },
  { id: "sheets", label: "自己管理", icon: BookOpen },
];

const roleLabel: Record<UserRole, string> = {
  admin: "管理者",
  manager: "マネージャー",
  member: "従業員",
};
const roleColor: Record<UserRole, string> = {
  admin: "#FF6B6B",
  manager: "#FFB830",
  member: "#00D4FF",
};
const statusLabel: Record<UserStatus, string> = {
  active: "アクティブ",
  invited: "招待中",
  suspended: "停止中",
  retired: "退職",
};
const statusColor: Record<UserStatus, string> = {
  active: "#00E5A0",
  invited: "#FFB830",
  suspended: "#FF6B6B",
  retired: "rgba(255,255,255,0.3)",
};

export function UserDetailModal({ target, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("info");
  if (!target) return null;

  const manager = target.managerId
    ? MOCK_USERS.find((u) => u.id === target.managerId)
    : null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-6xl animate-fade-up flex-col overflow-hidden rounded-3xl border border-white/15 bg-bg-panel shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold"
              style={{
                background: `${roleColor[target.role]}15`,
                color: roleColor[target.role],
                border: `1px solid ${roleColor[target.role]}30`,
              }}
            >
              {target.name.charAt(0)}
            </div>
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-[0.15em] text-coral/70">
                Admin View — 閲覧・教育担当コメントのみ編集可
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[17px] font-bold text-white">{target.name}</div>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{
                    background: `${roleColor[target.role]}15`,
                    color: roleColor[target.role],
                  }}
                >
                  {roleLabel[target.role]}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] text-white/40">
                {target.email}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
          >
            <X size={15} />
          </button>
        </div>

        <div className="border-b border-white/10 px-6 pt-4">
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex items-center gap-1.5 rounded-t-xl px-4 py-2.5 text-[12px] font-medium transition"
                  style={{
                    background: active ? "rgba(255,107,107,0.10)" : "transparent",
                    color: active ? "#FF6B6B" : "rgba(255,255,255,0.45)",
                    borderBottom: active
                      ? "2px solid #FF6B6B"
                      : "2px solid transparent",
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  <Icon size={13} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {tab === "info" && (
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { label: "氏名", value: target.name },
                { label: "メール", value: target.email },
                {
                  label: "ロール",
                  value: roleLabel[target.role],
                  color: roleColor[target.role],
                },
                {
                  label: "ステータス",
                  value: statusLabel[target.status],
                  color: statusColor[target.status],
                },
                { label: "部署", value: target.dept },
                { label: "役職", value: target.title ?? "—" },
                { label: "マネージャー", value: manager ? manager.name : "—" },
                { label: "最終ログイン", value: target.lastLogin },
                {
                  label: "達成率",
                  value: target.achievement !== null ? `${target.achievement}%` : "—",
                },
                {
                  label: "担当顧客",
                  value: target.customers !== null ? `${target.customers}社` : "—",
                },
                {
                  label: "今月売上",
                  value: target.monthRevenue ? fmt(target.monthRevenue) : "—",
                },
                {
                  label: "年間累計",
                  value: target.yearRevenue ? fmtFull(target.yearRevenue) : "—",
                },
              ].map((f) => (
                <div
                  key={f.label}
                  className="rounded-xl border border-white/7 bg-white/[0.03] px-4 py-3"
                >
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">
                    {f.label}
                  </div>
                  <div
                    className="text-[13px] font-semibold"
                    style={{ color: f.color ?? "#fff" }}
                  >
                    {f.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "crm" && <CRMPanel userId={target.id} readonly />}
          {tab === "schedule" && <SchedulePanel userId={target.id} />}
          {tab === "revenue" && <RevenuePanel userId={target.id} />}
          {tab === "sheets" && (
            <SheetPanel userId={target.id} readonly trainerMode />
          )}
        </div>
      </div>
    </div>
  );
}
