"use client";

import { useSheet } from "@/lib/sheet-storage";

interface Props {
  userId: number;
}

export function UserRowProgress({ userId }: Props) {
  const [development] = useSheet(userId, "development");
  const [oneonone] = useSheet(userId, "oneonone");

  const total = development.curriculum.length;
  const done = development.curriculum.filter(
    (c) => c.selfUnderstood && c.selfCanDo
  ).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const latest =
    oneonone.entries.length > 0
      ? [...oneonone.entries].sort((a, b) => b.date.localeCompare(a.date))[0].date
      : null;
  const color = pct >= 100 ? "#00E5A0" : pct >= 60 ? "#00D4FF" : "#FFB830";

  return (
    <>
      <td className="px-3 py-3.5">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-[60px] overflow-hidden rounded-sm bg-white/[0.08]">
            <div
              className="h-full"
              style={{ width: `${pct}%`, background: color }}
            />
          </div>
          <span className="text-xs font-semibold text-white">{pct}%</span>
        </div>
      </td>
      <td className="px-3 py-3.5 text-[11px] text-white/50">
        {latest ?? <span className="text-white/25">—</span>}
      </td>
    </>
  );
}
