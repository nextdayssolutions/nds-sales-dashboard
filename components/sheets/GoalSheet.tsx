"use client";

import { useEffect, useState } from "react";
import { Save, Sparkles, Coins, Repeat } from "lucide-react";
import { toast } from "sonner";
import type { GoalSheet, GoalWish, WishPeriod } from "@/types";
import { useSheet } from "@/lib/sheet-storage";
import { SHEET_META, WISH_PERIODS } from "@/lib/curriculum-data";
import { Field, ReadOnlyBanner } from "./primitives";

interface Props {
  userId: string;
  readonly?: boolean;
}

const PERIOD_COLORS: Record<WishPeriod, string> = {
  "1ヶ月後": "#00D4FF",
  "2ヶ月後": "#00E5A0",
  "3ヶ月後": "#FFB830",
  "6ヶ月後": "#B794F4",
  "1年後": "#FF6B6B",
  "2年後": "#7B5EA7",
  "3年後": "#4BD1A0",
  "5年後": "#FFB07A",
  "未来": "#E5E5E5",
};

export function GoalSheetPanel({ userId, readonly }: Props) {
  const [stored, save] = useSheet(userId, "goal");
  const [draft, setDraft] = useState<GoalSheet>(stored);
  const dirty = JSON.stringify(draft) !== JSON.stringify(stored);
  const meta = SHEET_META.goal;

  useEffect(() => {
    setDraft(stored);
  }, [stored]);

  const handleSave = async () => {
    try {
      await save(draft);
      toast.success("目標設定を保存しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    }
  };

  // 古いデータに新フィールドが無い場合のフォールバック付きで取得
  const wishOf = (period: WishPeriod, source: GoalSheet): GoalWish => {
    const w = source.wishes[period] as Partial<GoalWish> | undefined;
    return {
      content: w?.content ?? "",
      monthlyIncome: w?.monthlyIncome ?? "",
      pdca: w?.pdca ?? "",
    };
  };

  const updateWish = (period: WishPeriod, patch: Partial<GoalWish>) =>
    setDraft((d) => ({
      ...d,
      wishes: {
        ...d.wishes,
        [period]: { ...wishOf(period, d), ...patch },
      },
    }));

  const accent = "rgba(0,212,255,0.2)";

  return (
    <div>
      {readonly && <ReadOnlyBanner />}

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
        <div className="text-[18px] font-bold text-white">
          時間軸 × PDCA で目標を設計
        </div>
        <div className="mt-1 text-[11px] text-white/50">
          1ヶ月後から未来までの各時点で、叶えたい生活水準・必要な月収/キャリア・達成のためのアクションプラン（PDCA）を具体的に記述します。
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field
          label="作成日"
          value={draft.createdAt}
          onChange={(v) => setDraft({ ...draft, createdAt: v })}
          readonly={readonly}
          placeholder="2026-01-20"
          accent={accent}
        />
        <Field
          label="期日"
          value={draft.dueDate}
          onChange={(v) => setDraft({ ...draft, dueDate: v })}
          readonly={readonly}
          placeholder="2026-04-10"
          accent={accent}
        />
        <Field
          label="年齢"
          value={draft.age}
          onChange={(v) => setDraft({ ...draft, age: v })}
          readonly={readonly}
          placeholder="28"
          accent={accent}
        />
      </div>

      <div className="mt-6 mb-3 flex items-center justify-between">
        <div className="text-[12px] font-bold text-white/80">
          目標と PDCA — 1ヶ月後から未来まで
        </div>
        <div className="hidden gap-3 text-[10px] text-white/40 md:flex">
          <span className="flex items-center gap-1">
            <Sparkles size={10} className="text-cyan" />
            叶えたいこと（生活水準）
          </span>
          <span className="flex items-center gap-1">
            <Coins size={10} className="text-amber" />
            必要月収・キャリア
          </span>
          <span className="flex items-center gap-1">
            <Repeat size={10} className="text-mint" />
            アクションプラン (PDCA)
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {WISH_PERIODS.map((period) => {
          const color = PERIOD_COLORS[period];
          const wish = wishOf(period, draft);
          return (
            <div
              key={period}
              className="rounded-2xl border p-5"
              style={{
                background: `${color}08`,
                borderColor: `${color}30`,
              }}
            >
              <div className="mb-4 flex items-center gap-2">
                <span
                  className="rounded-full px-3.5 py-1.5 text-[13px] font-extrabold"
                  style={{ background: `${color}1F`, color }}
                >
                  {period}
                </span>
                <div className="h-px flex-1" style={{ background: `${color}25` }} />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <WishField
                  icon={<Sparkles size={12} className="text-cyan" />}
                  label="叶えたいこと（生活水準）"
                  value={wish.content}
                  onChange={(v) => updateWish(period, { content: v })}
                  readonly={readonly}
                  placeholder="例：家族と週1で外食できる。年に1回海外旅行。住居◯◯。趣味に月3万..."
                  accentBorder="rgba(0,212,255,0.25)"
                  rows={7}
                />
                <WishField
                  icon={<Coins size={12} className="text-amber" />}
                  label="必要月収・キャリア"
                  value={wish.monthlyIncome}
                  onChange={(v) => updateWish(period, { monthlyIncome: v })}
                  readonly={readonly}
                  placeholder="例：月収50万 / 主任クラス / 年収700万 など"
                  accentBorder="rgba(255,184,48,0.25)"
                  rows={7}
                />
                <WishField
                  icon={<Repeat size={12} className="text-mint" />}
                  label="アクションプラン (PDCA)"
                  value={wish.pdca}
                  onChange={(v) => updateWish(period, { pdca: v })}
                  readonly={readonly}
                  placeholder={
                    "Plan: 月◯件アポ獲得\nDo: 毎週△回テレアポ\nCheck: 週次で振返り\nAction: 改善点を翌週に反映"
                  }
                  accentBorder="rgba(0,229,160,0.25)"
                  rows={7}
                />
              </div>
            </div>
          );
        })}
      </div>

      {!readonly && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={!dirty}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold text-white transition disabled:opacity-40"
            style={{
              background: dirty
                ? "linear-gradient(135deg, #00D4FF 0%, #7B5EA7 100%)"
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

// ─────────── 1 セル分（アイコン付きラベル + textarea） ─────

interface WishFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  readonly?: boolean;
  placeholder?: string;
  rows?: number;
  accentBorder: string;
}

function WishField({
  icon,
  label,
  value,
  onChange,
  readonly,
  placeholder,
  rows = 3,
  accentBorder,
}: WishFieldProps) {
  return (
    <label className="flex flex-col">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-white/65">
        {icon}
        {label}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readonly}
        placeholder={placeholder}
        rows={rows}
        className="w-full flex-1 resize-y rounded-lg border bg-white/[0.04] px-3.5 py-2.5 text-[13px] leading-relaxed text-white placeholder-white/25 outline-none transition focus:border-white/40"
        style={{ borderColor: accentBorder, minHeight: "9rem" }}
      />
    </label>
  );
}
