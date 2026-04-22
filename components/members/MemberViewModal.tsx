"use client";

import { X } from "lucide-react";
import type { UserRecord, UserRole } from "@/types";
import { fmt } from "@/lib/utils";
import { useUserMetrics } from "@/lib/metrics";
import { MemberDashboardTabs } from "./MemberDashboardTabs";
import { ModalPortal } from "@/components/common/ModalPortal";

interface Props {
  target: UserRecord | null;
  viewerRole: "manager" | "admin";
  onClose: () => void;
}

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

export function MemberViewModal({ target, viewerRole, onClose }: Props) {
  const metrics = useUserMetrics(target?.id);
  if (!target) return null;

  const viewerAccent = viewerRole === "admin" ? "#FF6B6B" : "#FFB830";
  const viewerTint =
    viewerRole === "admin" ? "rgba(255,107,107,0.12)" : "rgba(255,184,48,0.12)";

  return (
    <ModalPortal>
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
              <div
                className="mb-1 text-[10px] uppercase tracking-[0.15em]"
                style={{ color: `${viewerAccent}B0` }}
              >
                {viewerRole === "admin" ? "Admin View" : "Manager View"} — 閲覧専用
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
                {target.dept}
                {target.title && ` · ${target.title}`}
                {metrics.monthAchievement !== null &&
                  ` · 今月達成率 ${metrics.monthAchievement}%`}
                {metrics.customerCount > 0 &&
                  ` · 担当 ${metrics.customerCount}社`}
                {metrics.monthRevenue > 0 &&
                  ` · 今月 ${fmt(metrics.monthRevenue)}`}
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

        <div className="overflow-y-auto px-6 py-5">
          <MemberDashboardTabs
            userId={target.id}
            readonly
            trainerMode
            activeColor={viewerAccent}
            activeTint={viewerTint}
          />
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
