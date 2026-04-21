"use client";

import { SCHEDULE_EVENTS, TODAY, MOCK_USERS } from "@/lib/mock-data";
import type { ScheduleType } from "@/types";

interface Props {
  userId: number;
}

const typeColors: Record<ScheduleType, { bg: string; text: string; label: string }> = {
  meeting: { bg: "rgba(0,212,255,0.12)", text: "#00D4FF", label: "商談" },
  presentation: { bg: "rgba(123,94,167,0.2)", text: "#B794F4", label: "提案" },
  training: { bg: "rgba(0,229,160,0.12)", text: "#00E5A0", label: "研修" },
  internal: { bg: "rgba(255,184,48,0.12)", text: "#FFB830", label: "社内" },
};

export function SchedulePanel({ userId }: Props) {
  const user = MOCK_USERS.find((u) => u.id === userId);
  const byDate: Record<string, typeof SCHEDULE_EVENTS> = {};
  SCHEDULE_EVENTS.forEach((e) => {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  });
  const dates = Array.from(new Set(SCHEDULE_EVENTS.map((e) => e.date))).sort();

  return (
    <div>
      <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-amber/20 bg-amber/[0.08] px-3.5 py-2.5">
        <div className="h-2 w-2 flex-shrink-0 rounded-full bg-amber" />
        <div className="text-xs text-white/60">
          {user ? `${user.name} の予定 — ` : ""}
          Googleカレンダー連携は本番で{" "}
          <span className="text-amber">Google Calendar API</span> と接続します。現在はモックデータ表示です。
        </div>
      </div>

      {dates.map((date) => (
        <div key={date} className="mb-6">
          <div className="mb-3 flex items-center gap-3">
            <div
              className={`text-xs font-bold ${
                date === TODAY ? "text-cyan" : "text-white/50"
              }`}
            >
              {date === TODAY ? "▶ 今日" : ""} {date}
            </div>
            <div className="h-px flex-1 bg-white/7" />
          </div>
          <div className="flex flex-col gap-2">
            {byDate[date].map((ev) => {
              const tc = typeColors[ev.type];
              return (
                <div
                  key={ev.id}
                  className="flex items-center gap-3.5 rounded-xl border border-white/7 bg-white/[0.03] px-4 py-3"
                >
                  <div className="min-w-[44px] text-[13px] font-bold text-white/50">
                    {ev.time}
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-white">
                      {ev.title}
                    </div>
                    {ev.customer && (
                      <div className="mt-0.5 text-[11px] text-white/35">
                        {ev.customer}
                      </div>
                    )}
                  </div>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px]"
                    style={{ background: tc.bg, color: tc.text }}
                  >
                    {tc.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
