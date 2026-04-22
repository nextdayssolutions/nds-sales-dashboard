"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Link2, ExternalLink, RefreshCw, Unplug } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/lib/user-store";
import { useAuthedUser } from "@/lib/session";
import {
  fetchCalendarEventsAction,
  disconnectCalendarAction,
  type CalendarEvent,
} from "@/app/actions/calendar";

interface Props {
  userId: string;
}

function formatTime(iso: string, allDay: boolean): string {
  if (!iso) return "—";
  if (allDay) return "終日";
  const d = new Date(iso);
  return d.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function dateKey(iso: string): string {
  if (!iso) return "";
  if (iso.length === 10) return iso;
  return new Date(iso).toISOString().slice(0, 10);
}

function formatDateHeader(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = tomorrow.toISOString().slice(0, 10);
  const label = iso === todayKey ? "今日" : iso === tomorrowKey ? "明日" : "";
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${label ? `▶ ${label} · ` : ""}${month}/${day} (${weekday})`;
}

export function SchedulePanel({ userId }: Props) {
  const user = useUser(userId);
  const { session } = useAuthedUser();
  const isOwn = session?.userId === userId;

  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchCalendarEventsAction(userId, 30);
    setLoading(false);
    if (res.needsReconnect) {
      setNeedsReconnect(true);
      setEvents(null);
      return;
    }
    if (!res.ok) {
      setError(res.error ?? "予定を取得できませんでした");
      return;
    }
    setNeedsReconnect(false);
    setEvents(res.events ?? []);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  // URL クエリから連携結果のトーストを出す
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("calendar");
    if (!status) return;
    if (status === "connected") {
      toast.success("Googleカレンダーを連携しました");
      load();
    } else if (status === "denied") {
      toast.error("連携がキャンセルされました");
    } else if (status === "no_refresh") {
      toast.error("再連携が必要です（refresh_token 未取得）");
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("calendar");
    window.history.replaceState({}, "", url.toString());
  }, [load]);

  const disconnect = async () => {
    if (!confirm("カレンダー連携を解除しますか？（再連携可能）")) return;
    const res = await disconnectCalendarAction(userId);
    if (!res.ok) {
      toast.error(res.error ?? "解除に失敗しました");
      return;
    }
    toast.success("カレンダー連携を解除しました");
    setEvents(null);
    setNeedsReconnect(true);
  };

  const grouped = useMemo<Array<[string, CalendarEvent[]]>>(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events ?? []) {
      const key = dateKey(e.start);
      if (!key) continue;
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  if (needsReconnect) {
    return (
      <div>
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-amber/20 bg-amber/[0.08] px-3.5 py-2.5">
          <div className="h-2 w-2 flex-shrink-0 rounded-full bg-amber" />
          <div className="text-xs text-white/60">
            {user ? `${user.name} の予定 — ` : ""}Googleカレンダー未連携
          </div>
        </div>

        <div className="rounded-2xl border border-white/7 bg-white/[0.02] py-14 text-center">
          <Calendar size={32} className="mx-auto mb-3 text-white/20" />
          <div className="mb-1 text-[13px] font-semibold text-white/80">
            Googleカレンダー連携
          </div>
          <div className="mb-5 text-[11px] text-white/45">
            連携すると、商談・提案・社内MTG 等の予定がここに表示されます（閲覧のみ）
          </div>

          {isOwn ? (
            <a
              href="/api/calendar/connect"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_4px_20px_rgba(0,212,255,0.3)] transition"
              style={{
                background: "linear-gradient(135deg, #00D4FF 0%, #7B5EA7 100%)",
              }}
            >
              <Link2 size={14} />
              Googleカレンダーを連携
            </a>
          ) : (
            <div className="text-[11px] text-white/40">
              本人が連携するまで予定は表示されません
            </div>
          )}
          <div className="mx-auto mt-5 max-w-md rounded-xl border border-cyan/15 bg-cyan/[0.05] px-3.5 py-2 text-[11px] leading-relaxed text-white/55">
            🔒 読み取り専用スコープ（<code className="font-mono">calendar.readonly</code>）。
            予定の作成・変更・削除はできません。いつでも解除可能です。
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-[12px] text-white/40">
        <RefreshCw size={20} className="mx-auto mb-3 animate-spin text-white/25" />
        カレンダーを読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-coral/20 bg-coral/[0.06] px-4 py-3 text-[12px] text-white/70">
        ⚠️ {error}
        <button
          onClick={load}
          className="ml-3 inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-white/60 hover:border-cyan/30 hover:text-cyan"
        >
          <RefreshCw size={10} />
          再試行
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-mint/20 bg-mint/[0.06] px-3.5 py-2">
          <div className="h-2 w-2 flex-shrink-0 rounded-full bg-mint" />
          <div className="text-[11px] text-white/60">
            {user ? `${user.name} の予定` : "予定"} · 今後 30 日分
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={load}
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-white/60 hover:border-cyan/30 hover:text-cyan"
          >
            <RefreshCw size={11} />
            更新
          </button>
          {isOwn && (
            <button
              onClick={disconnect}
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-white/50 hover:border-coral/30 hover:text-coral"
            >
              <Unplug size={11} />
              連携解除
            </button>
          )}
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-2xl border border-white/7 bg-white/[0.02] py-14 text-center">
          <Calendar size={28} className="mx-auto mb-3 text-white/20" />
          <div className="text-[12px] text-white/50">
            今後 30 日に予定はありません
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={`text-xs font-bold ${
                    date === new Date().toISOString().slice(0, 10)
                      ? "text-cyan"
                      : "text-white/55"
                  }`}
                >
                  {formatDateHeader(date)}
                </div>
                <div className="h-px flex-1 bg-white/7" />
                <div className="text-[10px] text-white/30">{items.length}件</div>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((ev) => (
                  <a
                    key={ev.id}
                    href={ev.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3.5 rounded-xl border border-white/7 bg-white/[0.03] px-4 py-3 transition hover:border-cyan/25 hover:bg-white/[0.05]"
                  >
                    <div className="min-w-[58px] flex-shrink-0 pt-0.5 text-[11px] font-bold text-white/55">
                      {formatTime(ev.start, ev.allDay)}
                      {!ev.allDay && (
                        <div className="mt-0.5 text-[10px] font-normal text-white/30">
                          〜 {formatTime(ev.end, false)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-white">
                        {ev.title}
                      </div>
                      {ev.location && (
                        <div className="mt-0.5 truncate text-[11px] text-white/40">
                          📍 {ev.location}
                        </div>
                      )}
                      {ev.attendees && ev.attendees.length > 0 && (
                        <div className="mt-0.5 truncate text-[11px] text-white/35">
                          👥 {ev.attendees.length}名
                        </div>
                      )}
                    </div>
                    {ev.htmlLink && (
                      <ExternalLink
                        size={12}
                        className="mt-1 flex-shrink-0 text-white/30"
                      />
                    )}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
