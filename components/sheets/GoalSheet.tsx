"use client";

import { useEffect, useState } from "react";
import { Save, Link2 } from "lucide-react";
import { toast } from "sonner";
import type { CareerStage, GoalSheet, WishPeriod } from "@/types";
import { useSheet } from "@/lib/sheet-storage";
import { CAREER_STAGES, SHEET_META, WISH_PERIODS } from "@/lib/curriculum-data";
import { Field, ReadOnlyBanner } from "./primitives";

interface Props {
  userId: string;
  readonly?: boolean;
}

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

  const updateWish = (period: WishPeriod, patch: Partial<{ content: string; url: string }>) =>
    setDraft((d) => ({
      ...d,
      wishes: { ...d.wishes, [period]: { ...d.wishes[period], ...patch } },
    }));

  const updateCareer = (
    stage: CareerStage,
    patch: Partial<{ income: string; requiredSkills: string }>
  ) =>
    setDraft((d) => ({
      ...d,
      career: { ...d.career, [stage]: { ...d.career[stage], ...patch } },
    }));

  const accent = "rgba(0,212,255,0.2)";

  return (
    <div>
      {readonly && <ReadOnlyBanner />}

      <div
        className="mb-4 rounded-2xl border p-5"
        style={{ background: meta.tint, borderColor: accent }}
      >
        <div className="mb-1 text-[11px] uppercase tracking-[0.15em]" style={{ color: meta.color }}>
          {meta.emoji} {meta.label}
        </div>
        <div className="text-[18px] font-bold text-white">時間軸で叶えたいこと + キャリアマップ</div>
        <div className="mt-1 text-[11px] text-white/50">
          「いつまでに・何を」を時間軸で、「役職ごとの年収と必要スキル」を階段で言語化します。
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="作成日" value={draft.createdAt} onChange={(v) => setDraft({ ...draft, createdAt: v })} readonly={readonly} placeholder="2026-01-20" accent={accent} />
        <Field label="期日" value={draft.dueDate} onChange={(v) => setDraft({ ...draft, dueDate: v })} readonly={readonly} placeholder="2026-04-10" accent={accent} />
        <Field label="年齢" value={draft.age} onChange={(v) => setDraft({ ...draft, age: v })} readonly={readonly} placeholder="28" accent={accent} />
      </div>

      <div className="mt-6 mb-2 text-[12px] font-bold text-white/80">叶えたいこと（時間軸）</div>
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-white/40">
              <th className="px-3 py-2 text-left font-normal">期間</th>
              <th className="px-3 py-2 text-left font-normal">叶えたいこと（具体的に）</th>
              <th className="px-3 py-2 text-left font-normal w-[160px]">URL / 補足</th>
            </tr>
          </thead>
          <tbody>
            {WISH_PERIODS.map((p) => (
              <tr key={p} className="border-t border-white/5">
                <td className="px-3 py-2">
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                    style={{ background: meta.tint, color: meta.color }}
                  >
                    {p}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={draft.wishes[p].content}
                    onChange={(e) => updateWish(p, { content: e.target.value })}
                    readOnly={readonly}
                    placeholder="具体的な達成目標"
                    className="w-full rounded-md border border-white/5 bg-white/[0.03] px-2 py-1.5 text-[13px] text-white outline-none focus:border-cyan/30"
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="relative">
                    <Link2 size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="url"
                      value={draft.wishes[p].url}
                      onChange={(e) => updateWish(p, { url: e.target.value })}
                      readOnly={readonly}
                      placeholder="https://..."
                      className="w-full rounded-md border border-white/5 bg-white/[0.03] py-1.5 pl-7 pr-2 text-[12px] text-white outline-none focus:border-cyan/30"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 mb-2 text-[12px] font-bold text-white/80">キャリアマップ</div>
      <div className="grid gap-2">
        {CAREER_STAGES.map((stage, i) => {
          const stageColor = ["#7B8794", "#00D4FF", "#00E5A0", "#B794F4", "#FFB830"][i];
          return (
            <div
              key={stage}
              className="flex items-center gap-3 rounded-xl border border-white/7 bg-white/[0.03] px-4 py-3"
            >
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                style={{ background: `${stageColor}15`, color: stageColor, border: `1px solid ${stageColor}30` }}
              >
                {stage}
              </div>
              <div className="grid flex-1 grid-cols-2 gap-3">
                <input
                  type="text"
                  value={draft.career[stage].income}
                  onChange={(e) => updateCareer(stage, { income: e.target.value })}
                  readOnly={readonly}
                  placeholder="年収（月収）例: 600万 / 月50万"
                  className="w-full rounded-md border border-white/5 bg-white/[0.03] px-2.5 py-1.5 text-[12px] text-white outline-none focus:border-cyan/30"
                />
                <input
                  type="text"
                  value={draft.career[stage].requiredSkills}
                  onChange={(e) => updateCareer(stage, { requiredSkills: e.target.value })}
                  readOnly={readonly}
                  placeholder="必要スキル・達成目標数値"
                  className="w-full rounded-md border border-white/5 bg-white/[0.03] px-2.5 py-1.5 text-[12px] text-white outline-none focus:border-cyan/30"
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
