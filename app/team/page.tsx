"use client";

import { useMemo, useState } from "react";
import { Crown } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { RoleNav } from "@/components/layout/RoleNav";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { TeamMemberRow, TeamMemberDetail } from "@/components/team/TeamMemberRow";
import { MemberViewModal } from "@/components/members/MemberViewModal";
import { useAuthedUser } from "@/lib/session";
import { useTeamMembers } from "@/lib/user-store";
import { useAggregatedMetrics } from "@/lib/metrics";
import { fmt, fmtDate } from "@/lib/utils";
import type { UserRecord } from "@/types";

export default function TeamPage() {
  return (
    <RoleGuard allow={["manager"]}>
      <TeamBody />
    </RoleGuard>
  );
}

function TeamBody() {
  const [selected, setSelected] = useState<UserRecord | null>(null);
  const [viewTarget, setViewTarget] = useState<UserRecord | null>(null);
  const { session, user } = useAuthedUser();
  const team = useTeamMembers(user?.id);
  const active = useMemo(
    () => team.filter((m) => m.status === "active"),
    [team],
  );
  const teamIds = useMemo(() => team.map((m) => m.id), [team]);
  const agg = useAggregatedMetrics(teamIds);

  if (!session || !user) return null;

  const avgAchColor =
    agg.avgMonthAchievement === null
      ? "#B794F4"
      : agg.avgMonthAchievement >= 100
        ? "#00E5A0"
        : agg.avgMonthAchievement >= 70
          ? "#00D4FF"
          : "#FFB830";

  const stats = [
    {
      label: "チーム人数",
      value: `${team.length}名`,
      sub: `${active.length} アクティブ`,
      color: "#FFB830",
    },
    {
      label: "チーム今月売上",
      value: fmt(agg.totalMonthRevenue),
      sub: `目標 ${fmt(agg.totalMonthTarget)}`,
      color: "#00D4FF",
    },
    {
      label: "チーム平均今月達成率",
      value:
        agg.avgMonthAchievement !== null
          ? `${agg.avgMonthAchievement}%`
          : "—",
      sub: "目標設定メンバーの平均",
      color: avgAchColor,
    },
    {
      label: "チーム担当顧客",
      value: `${agg.totalCustomers}社`,
      sub: "合計",
      color: "#B794F4",
    },
  ];

  return (
    <AppShell variant="manager" maxWidth="wide">
      <div className="mb-7 flex items-center justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.15em] text-amber/70">
            <Crown size={12} />
            Team Manager Console
          </div>
          <h1 className="text-[26px] font-extrabold tracking-tight">
            {user.name} のチーム{" "}
            <span className="ml-2.5 text-sm font-medium text-white/40">
              {user.dept}
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <RoleNav role={user.role} current="team" />
          <div className="text-right">
            <div className="text-xs text-white/40">
              {fmtDate(new Date())}
            </div>
            <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-amber/20 bg-amber/10 px-3 py-0.5 text-[11px] text-amber">
              <Crown size={11} />
              Team Leader
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3.5 md:grid-cols-4">
        {stats.map((k) => (
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

      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: selected ? "1fr 360px" : "1fr" }}
      >
        <div className="rounded-3xl border border-white/7 bg-white/[0.03] p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white">配下メンバー</div>
              <div className="mt-0.5 text-[11px] text-white/40">
                行をクリックすると詳細を表示します（読み取り専用）
              </div>
            </div>
          </div>

          {team.length === 0 ? (
            <div className="py-12 text-center text-xs text-white/30">
              配下に登録されているメンバーはいません
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="w-full border-separate"
                style={{ borderSpacing: "0 6px" }}
              >
                <thead>
                  <tr className="text-left text-[11px] text-white/40">
                    <th className="px-3 pb-2">メンバー</th>
                    <th className="px-3 pb-2">部署 / 役職</th>
                    <th className="px-3 pb-2">今月達成率</th>
                    <th className="px-3 pb-2">担当</th>
                    <th className="px-3 pb-2">今月売上</th>
                    <th className="px-3 pb-2">最終ログイン</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((m) => (
                    <TeamMemberRow
                      key={m.id}
                      member={m}
                      selected={selected?.id === m.id}
                      onClick={() => setSelected(selected?.id === m.id ? null : m)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selected && (
          <div>
            <TeamMemberDetail
              member={selected}
              onClose={() => setSelected(null)}
              onOpenSheets={() => setViewTarget(selected)}
            />
          </div>
        )}
      </div>

      <MemberViewModal
        target={viewTarget}
        viewerRole="manager"
        onClose={() => setViewTarget(null)}
      />
    </AppShell>
  );
}
