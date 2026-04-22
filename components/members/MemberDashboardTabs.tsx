"use client";

import { useState } from "react";
import {
  Users,
  Calendar,
  TrendingUp,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { CRMPanel } from "@/components/dashboard/CRMPanel";
import { SchedulePanel } from "@/components/dashboard/SchedulePanel";
import { RevenuePanel } from "@/components/dashboard/RevenuePanel";
import { SheetPanel } from "@/components/sheets/SheetPanel";

export type MemberTabId = "crm" | "schedule" | "revenue" | "sheets";

const TABS: { id: MemberTabId; label: string; icon: LucideIcon }[] = [
  { id: "crm", label: "CRM", icon: Users },
  { id: "schedule", label: "スケジュール", icon: Calendar },
  { id: "revenue", label: "売上管理", icon: TrendingUp },
  { id: "sheets", label: "自己管理", icon: BookOpen },
];

interface Props {
  userId: string;
  readonly?: boolean;
  trainerMode?: boolean;
  defaultTab?: MemberTabId;
  activeColor?: string;
  activeTint?: string;
}

export function MemberDashboardTabs({
  userId,
  readonly,
  trainerMode,
  defaultTab = "crm",
  activeColor = "#00D4FF",
  activeTint = "rgba(0,212,255,0.12)",
}: Props) {
  const [tab, setTab] = useState<MemberTabId>(defaultTab);

  return (
    <div>
      <div
        className="mb-5 flex gap-1.5 rounded-2xl border border-white/7 bg-white/[0.03] p-1.5"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[13px] transition-all"
              style={{
                background: active ? activeTint : "transparent",
                color: active ? activeColor : "rgba(255,255,255,0.45)",
                fontWeight: active ? 700 : 500,
              }}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div
        key={`${userId}-${tab}`}
        className="min-h-[500px] animate-fade-up rounded-3xl border border-white/7 bg-white/[0.03] p-6"
      >
        {tab === "crm" && <CRMPanel userId={userId} readonly={readonly} />}
        {tab === "schedule" && <SchedulePanel userId={userId} />}
        {tab === "revenue" && <RevenuePanel userId={userId} />}
        {tab === "sheets" && (
          <SheetPanel userId={userId} readonly={readonly} trainerMode={trainerMode} />
        )}
      </div>
    </div>
  );
}
