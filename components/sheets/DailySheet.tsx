"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { DailyEntry, DailySheet } from "@/types";
import { useSheet } from "@/lib/sheet-storage";
import { SHEET_META } from "@/lib/curriculum-data";
import { useAuthedUser } from "@/lib/session";
import { Field, ReadOnlyBanner } from "./primitives";

interface Props {
  userId: string;
  /** owner 以外（manager/admin）が開いたとき true */
  readonly?: boolean;
  /** readonly=true でも managerComment 編集を許可するか */
  commenterMode?: boolean;
}

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function todayDate(): Date {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

function uid(): string {
  return `daily-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function emptyEntry(date: string): DailyEntry {
  return {
    id: uid(),
    date,
    attendance: "",
    activities: "",
    results: "",
    improvement: "",
    nextDay: "",
  };
}

/** その月の日付セル配列を返す（前後に余白セル null を含む） */
function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startWeekday = first.getDay();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function DailySheetPanel({ userId, readonly, commenterMode }: Props) {
  const [stored, save] = useSheet(userId, "daily");
  const [draft, setDraft] = useState<DailySheet>(stored);
  const { session } = useAuthedUser();
  const meta = SHEET_META.daily;
  const accent = "rgba(0,229,160,0.25)";

  // カレンダー表示月（年月のみ）
  const today = todayDate();
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth());

  // 選択中の日付（YYYY-MM-DD）。null ならカレンダー表示
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    setDraft(stored);
  }, [stored]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(stored);

  const entriesByDate = useMemo(() => {
    const map: Record<string, DailyEntry> = {};
    for (const e of draft.entries) {
      if (!map[e.date]) map[e.date] = e;
    }
    return map;
  }, [draft.entries]);

  const monthGrid = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const handleSave = async () => {
    try {
      await save(draft);
      toast.success("日報を保存しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    }
  };

  const canEditSelf = !readonly;
  // マネージャーコメントは manager/admin（commenterMode）のみ編集可。本人は閲覧のみ。
  const canEditComment = !!commenterMode;

  /** 指定日付のエントリを取得 or 新規作成しつつ draft に追加 */
  const ensureEntry = (date: string): DailyEntry => {
    const existing = draft.entries.find((e) => e.date === date);
    if (existing) return existing;
    const fresh = emptyEntry(date);
    setDraft((d) => ({ entries: [fresh, ...d.entries] }));
    return fresh;
  };

  const updateEntryByDate = (date: string, patch: Partial<DailyEntry>) => {
    setDraft((d) => ({
      entries: d.entries.map((e) => (e.date === date ? { ...e, ...patch } : e)),
    }));
  };

  const deleteEntryByDate = (date: string) => {
    setDraft((d) => ({ entries: d.entries.filter((e) => e.date !== date) }));
  };

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };
  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };
  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  // ──── エントリ表示モード ──────────────────────────
  if (selectedDate) {
    const entry = entriesByDate[selectedDate];
    const dateObj = new Date(`${selectedDate}T00:00:00`);
    const wd = WEEKDAY_LABELS[dateObj.getDay()];

    const closeAndMaybeCleanup = () => {
      // 中身が完全に空なら自動的に消す（誤って開いただけのケース）
      if (entry) {
        const isEmpty =
          !entry.attendance &&
          !entry.activities &&
          !entry.results &&
          !entry.improvement &&
          !entry.nextDay &&
          !entry.managerComment;
        if (isEmpty) {
          deleteEntryByDate(selectedDate);
        }
      }
      setSelectedDate(null);
    };

    return (
      <div>
        {readonly && !commenterMode && (
          <ReadOnlyBanner note="マネージャー/管理者は本人フィールドを編集できません。" />
        )}
        {commenterMode && (
          <div className="mb-4 rounded-xl border border-purple/20 bg-purple/[0.08] px-3.5 py-2 text-[11px] text-white/70">
            💬 コメント編集モード — 「マネージャーコメント」のみ編集できます。
          </div>
        )}

        <div
          className="mb-4 flex items-center justify-between rounded-2xl border p-4"
          style={{ background: meta.tint, borderColor: accent }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={closeAndMaybeCleanup}
              className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.05] px-3 py-1.5 text-[11px] text-white/75 hover:bg-white/[0.08]"
            >
              <ArrowLeft size={12} />
              カレンダーに戻る
            </button>
            <div>
              <div
                className="text-[11px] uppercase tracking-[0.15em]"
                style={{ color: meta.color }}
              >
                {meta.emoji} 日報
              </div>
              <div className="mt-0.5 text-[16px] font-bold text-white">
                {selectedDate}（{wd}）
              </div>
            </div>
          </div>
          {canEditSelf && entry && (
            <button
              onClick={() => {
                if (
                  confirm(
                    `${selectedDate} の日報を削除します。よろしいですか？`,
                  )
                ) {
                  deleteEntryByDate(selectedDate);
                  setSelectedDate(null);
                }
              }}
              className="flex items-center gap-1.5 rounded-lg border border-coral/25 bg-coral/5 px-3 py-1.5 text-[11px] text-coral hover:bg-coral/10"
            >
              <Trash2 size={11} />
              削除
            </button>
          )}
        </div>

        <DailyEntryForm
          date={selectedDate}
          entry={entry}
          accent={accent}
          ensureEntry={ensureEntry}
          updateEntry={updateEntryByDate}
          canEditSelf={canEditSelf}
          canEditComment={canEditComment}
          sessionUserId={session?.userId}
        />

        {(canEditSelf || canEditComment) && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={!dirty}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold text-white transition disabled:opacity-40"
              style={{
                background: dirty
                  ? `linear-gradient(135deg, ${meta.color} 0%, #00D4FF 100%)`
                  : "rgba(255,255,255,0.08)",
              }}
            >
              <Save size={14} />
              {dirty ? "保存する" : "保存済み"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ──── カレンダー表示モード ────────────────────────
  const monthLabel = `${viewYear}年 ${viewMonth + 1}月`;
  const todayStr = fmtDate(today);

  return (
    <div>
      {readonly && !commenterMode && (
        <ReadOnlyBanner note="マネージャー/管理者は本人の日報を編集できません。" />
      )}
      {commenterMode && (
        <div className="mb-4 rounded-xl border border-purple/20 bg-purple/[0.08] px-3.5 py-2 text-[11px] text-white/70">
          💬 コメント編集モード — 日付をクリックすると、その日の日報にマネージャーコメントを残せます。
        </div>
      )}

      <div
        className="mb-4 rounded-2xl border p-5"
        style={{ background: meta.tint, borderColor: accent }}
      >
        <div
          className="mb-1 text-[11px] uppercase tracking-[0.15em]"
          style={{ color: meta.color }}
        >
          {meta.emoji} {meta.label}
        </div>
        <div className="flex items-start justify-between gap-5">
          <div>
            <div className="text-[18px] font-bold text-white">出社日の日報</div>
            <div className="mt-1 text-[11px] text-white/50">
              カレンダーから日付を選び、当日の活動・成果・気付きを記入します。マネージャーがコメントを返します。
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/55">
            <CalendarDays size={14} className="text-white/40" />
            記入済み {draft.entries.length} 件
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl border border-white/15 p-4"
        style={{ background: "rgba(15,20,36,0.85)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={goPrevMonth}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/[0.08] text-white hover:bg-white/[0.14]"
          >
            <ChevronLeft size={15} />
          </button>
          <div className="flex items-center gap-2">
            <div className="text-[16px] font-bold text-white">{monthLabel}</div>
            <button
              onClick={goToday}
              className="rounded-md border border-cyan/30 bg-cyan/10 px-2.5 py-1 text-[10px] font-bold text-cyan hover:bg-cyan/15"
            >
              今日
            </button>
          </div>
          <button
            onClick={goNextMonth}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/[0.08] text-white hover:bg-white/[0.14]"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1.5">
          {WEEKDAY_LABELS.map((wd, i) => (
            <div
              key={wd}
              className="py-1.5 text-center text-[11px] font-bold"
              style={{
                color:
                  i === 0
                    ? "#FF6B6B"
                    : i === 6
                    ? "#00D4FF"
                    : "rgba(255,255,255,0.6)",
              }}
            >
              {wd}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {monthGrid.map((d, idx) => {
            if (!d) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="aspect-square rounded-lg"
                  style={{ background: "rgba(255,255,255,0.015)" }}
                />
              );
            }
            const dateStr = fmtDate(d);
            const isToday = dateStr === todayStr;
            const isFuture = dateStr > todayStr;
            const hasEntry = !!entriesByDate[dateStr];
            const hasComment = !!entriesByDate[dateStr]?.managerComment;
            const wd = d.getDay();
            const baseColor =
              wd === 0
                ? "#FF6B6B"
                : wd === 6
                ? "#00D4FF"
                : "#FFFFFF";

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                disabled={isFuture && !hasEntry}
                className={`group relative aspect-square rounded-lg border-2 p-1.5 text-left transition-all ${
                  isFuture && !hasEntry
                    ? "cursor-not-allowed opacity-25"
                    : "cursor-pointer hover:scale-[1.04] hover:shadow-lg"
                }`}
                style={{
                  background: hasEntry
                    ? "rgba(0,229,160,0.22)"
                    : isToday
                    ? "rgba(0,212,255,0.18)"
                    : "rgba(255,255,255,0.07)",
                  borderColor: hasEntry
                    ? "rgba(0,229,160,0.7)"
                    : isToday
                    ? "rgba(0,212,255,0.7)"
                    : "rgba(255,255,255,0.18)",
                }}
              >
                <div
                  className="text-[13px] font-extrabold"
                  style={{ color: hasEntry ? meta.color : baseColor }}
                >
                  {d.getDate()}
                </div>
                {hasEntry && (
                  <div className="absolute bottom-1 right-1 flex items-center gap-1">
                    {hasComment && (
                      <span className="h-2 w-2 rounded-full bg-purple shadow-[0_0_6px_rgba(183,148,244,0.8)]" />
                    )}
                    <span
                      className="h-2 w-2 rounded-full shadow-[0_0_6px_rgba(0,229,160,0.6)]"
                      style={{ background: meta.color }}
                    />
                  </div>
                )}
                {isToday && !hasEntry && (
                  <div className="absolute bottom-1 right-1 text-[8px] font-bold text-cyan">
                    今日
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-4 border-t border-white/10 pt-3 text-[10px] text-white/55">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: meta.color }}
            />
            記入済み
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple" />
            コメント有り
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full border-2 border-cyan" />
            今日
          </div>
        </div>
      </div>

      {dirty && (canEditSelf || canEditComment) && (
        <div className="mt-4 flex items-center justify-end gap-2 rounded-xl border border-amber/20 bg-amber/[0.06] px-4 py-2.5 text-[11px] text-amber">
          未保存の変更があります
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-white"
            style={{
              background: `linear-gradient(135deg, ${meta.color} 0%, #00D4FF 100%)`,
            }}
          >
            <Save size={11} />
            保存する
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────── エントリ編集フォーム ───────────────────────

interface FormProps {
  date: string;
  entry: DailyEntry | undefined;
  accent: string;
  ensureEntry: (date: string) => DailyEntry;
  updateEntry: (date: string, patch: Partial<DailyEntry>) => void;
  canEditSelf: boolean;
  canEditComment: boolean;
  sessionUserId: string | undefined;
}

function DailyEntryForm({
  date,
  entry,
  accent,
  ensureEntry,
  updateEntry,
  canEditSelf,
  canEditComment,
  sessionUserId,
}: FormProps) {
  // 表示時にエントリがなければ空作成
  useEffect(() => {
    if (!entry && canEditSelf) {
      ensureEntry(date);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  if (!entry) {
    return (
      <div className="rounded-2xl border border-white/7 bg-white/[0.02] p-8 text-center text-[12px] text-white/45">
        この日の日報はまだ書かれていません。
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/7 bg-white/[0.02] p-5">
      <div className="mb-3 grid grid-cols-2 gap-3">
        <Field
          label="勤務形態"
          value={entry.attendance}
          onChange={(v) => updateEntry(date, { attendance: v })}
          readonly={!canEditSelf}
          placeholder="出社 / リモート / 外勤..."
          accent={accent}
        />
        <div />
      </div>
      <div className="mb-3">
        <Field
          label="本日の活動・商談"
          value={entry.activities}
          onChange={(v) => updateEntry(date, { activities: v })}
          readonly={!canEditSelf}
          multiline
          rows={3}
          placeholder="訪問先・打合せ・架電・その他活動内容"
          accent={accent}
        />
      </div>
      <div className="mb-3 grid grid-cols-2 gap-3">
        <Field
          label="結果・成果"
          value={entry.results}
          onChange={(v) => updateEntry(date, { results: v })}
          readonly={!canEditSelf}
          multiline
          rows={3}
          placeholder="獲得した成果・進捗"
          accent={accent}
        />
        <Field
          label="反省・気付き"
          value={entry.improvement}
          onChange={(v) => updateEntry(date, { improvement: v })}
          readonly={!canEditSelf}
          multiline
          rows={3}
          placeholder="うまくいかなかった点・学び"
          accent={accent}
        />
      </div>
      <div className="mb-3">
        <Field
          label="翌日のタスク・計画"
          value={entry.nextDay}
          onChange={(v) => updateEntry(date, { nextDay: v })}
          readonly={!canEditSelf}
          multiline
          rows={2}
          placeholder="優先タスク・アポイント"
          accent={accent}
        />
      </div>

      <div
        className="mt-4 rounded-xl border p-3"
        style={{
          background: "rgba(183,148,244,0.04)",
          borderColor: "rgba(183,148,244,0.2)",
        }}
      >
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-purple">
          <MessageCircle size={12} />
          マネージャーコメント
        </div>
        <textarea
          value={entry.managerComment ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            updateEntry(date, {
              managerComment: value,
              managerId: value ? sessionUserId : undefined,
              reviewedAt: value
                ? new Date().toISOString().slice(0, 10)
                : undefined,
            });
          }}
          readOnly={!canEditComment}
          placeholder={
            canEditComment
              ? "マネージャーからのフィードバック"
              : "未記入"
          }
          rows={3}
          className="w-full resize-none rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-[12px] text-white placeholder-white/25 outline-none focus:border-purple/30"
        />
        {entry.reviewedAt && (
          <div className="mt-1.5 text-[10px] text-white/40">
            レビュー日: {entry.reviewedAt}
          </div>
        )}
      </div>
    </div>
  );
}
