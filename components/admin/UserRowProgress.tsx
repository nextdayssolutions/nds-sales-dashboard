"use client";

import { useUserMetrics } from "@/lib/metrics";
import { fmt } from "@/lib/utils";

interface Props {
  userId: string;
}

/**
 * admin UserTable の 1 行に対し、動的計算される列（今月達成率 / 担当顧客 / 育成計画進捗 / 最終1on1）を
 * 単一の useUserMetrics() から派生させて表示する。
 */
export function UserRowProgress({ userId }: Props) {
  const m = useUserMetrics(userId);

  const monthAchColor =
    m.monthAchievement === null
      ? "#555"
      : m.monthAchievement >= 100
        ? "#00E5A0"
        : m.monthAchievement >= 70
          ? "#00D4FF"
          : "#FFB830";

  const trainingColor =
    m.trainingProgress >= 100
      ? "#00E5A0"
      : m.trainingProgress >= 60
        ? "#00D4FF"
        : "#FFB830";

  return (
    <>
      {/* 今月達成率 */}
      <td className="px-3 py-3.5">
        {m.monthAchievement !== null ? (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-[60px] overflow-hidden rounded-sm bg-white/[0.08]">
              <div
                className="h-full"
                style={{
                  width: `${Math.min(m.monthAchievement, 100)}%`,
                  background: monthAchColor,
                }}
              />
            </div>
            <span className="text-xs font-semibold text-white">
              {m.monthAchievement}%
            </span>
          </div>
        ) : (
          <span className="text-xs text-white/30">—</span>
        )}
      </td>

      {/* 担当顧客数 */}
      <td className="px-3 py-3.5 text-xs text-white/70">
        {m.customerCount > 0 ? `${m.customerCount}社` : "—"}
      </td>

      {/* 今月売上 */}
      <td className="px-3 py-3.5 text-xs text-white/70">
        {m.monthRevenue > 0 ? fmt(m.monthRevenue) : "—"}
      </td>

      {/* 育成計画進捗 */}
      <td className="px-3 py-3.5">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-[60px] overflow-hidden rounded-sm bg-white/[0.08]">
            <div
              className="h-full"
              style={{
                width: `${m.trainingProgress}%`,
                background: trainingColor,
              }}
            />
          </div>
          <span className="text-xs font-semibold text-white">
            {m.trainingProgress}%
          </span>
        </div>
      </td>

      {/* 最終1on1 */}
      <td className="px-3 py-3.5 text-[11px] text-white/50">
        {m.latest1on1 ?? <span className="text-white/25">—</span>}
      </td>
    </>
  );
}
