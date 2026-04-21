"use client";

import { BookOpen, X } from "lucide-react";
import type { UserRecord, UserStatus } from "@/types";
import { fmt, fmtFull } from "@/lib/utils";
import { useSheet } from "@/lib/sheet-storage";

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

interface RowProps {
  member: UserRecord;
  onClick: () => void;
  selected: boolean;
}

export function TeamMemberRow({ member, onClick, selected }: RowProps) {
  const ach = member.achievement ?? 0;
  const achColor = ach >= 100 ? "#00E5A0" : ach >= 70 ? "#00D4FF" : "#FFB830";

  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer transition-colors ${
        selected ? "bg-amber/[0.08]" : "bg-white/[0.03] hover:bg-white/[0.05]"
      }`}
    >
      <td className="rounded-l-xl px-3 py-3.5">
        <div className="text-[13px] font-semibold text-white">{member.name}</div>
        <div className="mt-0.5 text-[11px] text-white/35">{member.email}</div>
      </td>
      <td className="px-3 py-3.5">
        <div className="text-xs text-white/70">{member.dept}</div>
        <div className="mt-0.5 text-[11px] text-white/35">{member.title}</div>
      </td>
      <td className="px-3 py-3.5">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px]"
          style={{
            background: `${statusColor[member.status]}15`,
            color: statusColor[member.status],
          }}
        >
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: statusColor[member.status] }}
          />
          {statusLabel[member.status]}
        </span>
      </td>
      <td className="px-3 py-3.5">
        {member.achievement !== null ? (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-[60px] overflow-hidden rounded-sm bg-white/[0.08]">
              <div
                className="h-full"
                style={{ width: `${Math.min(ach, 100)}%`, background: achColor }}
              />
            </div>
            <span className="text-xs font-semibold text-white">{ach}%</span>
          </div>
        ) : (
          <span className="text-xs text-white/30">—</span>
        )}
      </td>
      <td className="px-3 py-3.5 text-xs text-white/70">
        {member.customers !== null ? `${member.customers}社` : "—"}
      </td>
      <td className="px-3 py-3.5 text-xs text-white/70">
        {member.monthRevenue ? fmt(member.monthRevenue) : "—"}
      </td>
      <td className="rounded-r-xl px-3 py-3.5 text-[11px] text-white/40">
        {member.lastLogin}
      </td>
    </tr>
  );
}

interface DetailProps {
  member: UserRecord;
  onClose: () => void;
  onOpenSheets?: () => void;
}

export function TeamMemberDetail({ member, onClose, onOpenSheets }: DetailProps) {
  const ach = member.achievement ?? 0;
  const achColor = ach >= 100 ? "#00E5A0" : ach >= 70 ? "#00D4FF" : "#FFB830";
  const [development] = useSheet(member.id, "development");
  const [oneonone] = useSheet(member.id, "oneonone");
  const curriculumDone = development.curriculum.filter((c) => c.selfUnderstood && c.selfCanDo).length;
  const curriculumTotal = development.curriculum.length;
  const curriculumPct = curriculumTotal === 0 ? 0 : Math.round((curriculumDone / curriculumTotal) * 100);
  const latest1on1 =
    oneonone.entries.length > 0
      ? [...oneonone.entries].sort((a, b) => b.date.localeCompare(a.date))[0].date
      : null;

  return (
    <div
      className="sticky top-4 rounded-3xl border p-5"
      style={{
        background: "rgba(255,184,48,0.04)",
        borderColor: "rgba(255,184,48,0.2)",
      }}
    >
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-wider text-amber/70">
            Team Member Detail
          </div>
          <div className="text-[17px] font-bold text-white">{member.name}</div>
          <div className="mt-1 text-xs text-white/40">
            {member.dept} · {member.title}
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
        >
          <X size={14} />
        </button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        {[
          {
            label: "達成率",
            value: `${ach}%`,
            color: achColor,
          },
          {
            label: "担当顧客",
            value: `${member.customers ?? 0}社`,
            color: "#00D4FF",
          },
          {
            label: "今月売上",
            value: fmt(member.monthRevenue ?? 0),
            color: "#FFB830",
          },
          {
            label: "年間累計",
            value: fmtFull(member.yearRevenue ?? 0),
            color: "#B794F4",
          },
        ].map((k) => (
          <div key={k.label} className="rounded-xl bg-white/[0.05] p-3">
            <div className="mb-1 text-[10px] text-white/40">{k.label}</div>
            <div className="text-[15px] font-bold" style={{ color: k.color }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-[11px]">
          <span className="text-white/40">育成計画進捗</span>
          <span className="text-white/55">
            {curriculumDone} / {curriculumTotal} 完了
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded bg-white/[0.08]">
          <div
            className="h-full transition-[width] duration-700"
            style={{
              width: `${curriculumPct}%`,
              background: curriculumPct >= 80 ? "#00E5A0" : "#00D4FF",
            }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-white/50">
          <span>{curriculumPct}%</span>
          <span>最終1on1: {latest1on1 ?? "—"}</span>
        </div>
      </div>

      {onOpenSheets && (
        <button
          onClick={onOpenSheets}
          className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber/25 bg-amber/10 px-3 py-2.5 text-[12px] font-bold text-amber transition hover:bg-amber/15"
        >
          <BookOpen size={13} />
          ダッシュボード全体を見る
        </button>
      )}

      <div className="rounded-xl border border-amber/15 bg-amber/[0.06] px-3.5 py-2.5 text-[11px] leading-relaxed text-white/60">
        🔒 CRM / スケジュール / 売上 / 自己管理 を閲覧できます。育成計画の「教育担当」列と 1on1 コメントのみマネージャーが記入可。
      </div>
    </div>
  );
}
