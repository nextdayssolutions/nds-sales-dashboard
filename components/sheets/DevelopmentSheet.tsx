"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, Milestone } from "lucide-react";
import { toast } from "sonner";
import type {
  DevelopmentSheet,
  DevelopmentCategoryKey,
  CategoryItem,
  CurriculumStep,
} from "@/types";
import { useSheet } from "@/lib/sheet-storage";
import {
  CATEGORY_LABELS,
  CURRICULUM_PERIODS,
  SHEET_META,
} from "@/lib/curriculum-data";
import { Field, EvalCheck, ReadOnlyBanner } from "./primitives";

interface Props {
  userId: string;
  readonly?: boolean;
  /** trainer（マネージャー・管理者）モードでは教育担当列のみ編集可 */
  trainerMode?: boolean;
}

export function DevelopmentSheetPanel({ userId, readonly, trainerMode }: Props) {
  const [stored, save] = useSheet(userId, "development");
  const [draft, setDraft] = useState<DevelopmentSheet>(stored);
  const dirty = JSON.stringify(draft) !== JSON.stringify(stored);
  const meta = SHEET_META.development;
  const accent = "rgba(255,255,255,0.15)";

  useEffect(() => {
    setDraft(stored);
  }, [stored]);

  const handleSave = async () => {
    try {
      await save(draft);
      toast.success("育成計画を保存しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    }
  };

  const { totalSteps, completedSteps, curriculumByPeriod } = useMemo(() => {
    const total = draft.curriculum.length;
    const completed = draft.curriculum.filter((c) => c.selfUnderstood && c.selfCanDo).length;
    const grouped: Record<string, CurriculumStep[]> = {};
    for (const c of draft.curriculum) {
      if (!grouped[c.period]) grouped[c.period] = [];
      grouped[c.period].push(c);
    }
    return { totalSteps: total, completedSteps: completed, curriculumByPeriod: grouped };
  }, [draft.curriculum]);

  const progress = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const updateCategoryItem = (
    key: DevelopmentCategoryKey,
    id: string,
    patch: Partial<CategoryItem>
  ) =>
    setDraft((d) => ({
      ...d,
      categoryItems: {
        ...d.categoryItems,
        [key]: d.categoryItems[key].map((it) => (it.id === id ? { ...it, ...patch } : it)),
      },
    }));

  const updateCurriculum = (id: string, patch: Partial<CurriculumStep>) =>
    setDraft((d) => ({
      ...d,
      curriculum: d.curriculum.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));

  // 全域 readonly（trainerMode でない外部閲覧）
  const fullyReadOnly = readonly && !trainerMode;
  // 本人入力欄は trainerMode では編集不可
  const selfDisabled = readonly || trainerMode;
  // 教育担当欄は fullyReadOnly なら不可、trainerMode または 本人モードなら可
  const trainerDisabled = fullyReadOnly ? true : false;

  return (
    <div>
      {fullyReadOnly && <ReadOnlyBanner />}
      {trainerMode && (
        <div className="mb-4 rounded-xl border border-amber/20 bg-amber/[0.08] px-3.5 py-2 text-[11px] text-white/70">
          👩‍🏫 教育担当モード — 右側の「教育担当」列のみ編集できます。
        </div>
      )}

      <div
        className="mb-4 rounded-2xl border border-white/10 p-5"
        style={{ background: meta.tint }}
      >
        <div className="mb-1 text-[11px] uppercase tracking-[0.15em]" style={{ color: meta.color }}>
          {meta.emoji} {meta.label}
        </div>
        <div className="flex items-center justify-between gap-5">
          <div>
            <div className="text-[18px] font-bold text-white">6ヶ月オンボーディングカリキュラム</div>
            <div className="mt-1 text-[11px] text-white/50">
              本人 × 教育担当 それぞれが「理解」「できている」を付けて進捗を可視化します。
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-[22px] font-extrabold" style={{ color: meta.color }}>
              {progress}%
            </div>
            <div className="text-[11px] text-white/50">
              {completedSteps} / {totalSteps} 完了
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Field label="所属" value={draft.department} onChange={(v) => setDraft({ ...draft, department: v })} readonly={selfDisabled} placeholder="営業1部" accent={accent} />
        <Field label="期間" value={draft.period} onChange={(v) => setDraft({ ...draft, period: v })} readonly={selfDisabled} placeholder="2026-01-10 〜 2026-07-10" accent={accent} />
        <Field label="3ヶ月で目指すべき姿" value={draft.goal3Months} onChange={(v) => setDraft({ ...draft, goal3Months: v })} readonly={selfDisabled} placeholder="..." accent={accent} />
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {(Object.keys(CATEGORY_LABELS) as DevelopmentCategoryKey[]).map((key) => (
          <div
            key={key}
            className="rounded-2xl border border-white/7 bg-white/[0.03] p-4"
          >
            <div className="mb-3 text-[12px] font-bold text-white/80">
              {CATEGORY_LABELS[key]}
            </div>
            <div className="flex flex-col gap-2.5">
              {draft.categoryItems[key].map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5"
                >
                  <div className="mb-1.5 text-[12px] text-white">{item.label}</div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px]">
                    <span className="text-white/40">本人:</span>
                    <EvalCheck
                      checked={item.selfUnderstood}
                      onChange={(v) => updateCategoryItem(key, item.id, { selfUnderstood: v })}
                      disabled={selfDisabled}
                      label="理解"
                      color="#00D4FF"
                    />
                    <EvalCheck
                      checked={item.selfCanDo}
                      onChange={(v) => updateCategoryItem(key, item.id, { selfCanDo: v })}
                      disabled={selfDisabled}
                      label="できている"
                      color="#00E5A0"
                    />
                    <span className="text-white/40">担当:</span>
                    <EvalCheck
                      checked={item.trainerUnderstood}
                      onChange={(v) => updateCategoryItem(key, item.id, { trainerUnderstood: v })}
                      disabled={trainerDisabled}
                      label="理解"
                      color="#FFB830"
                    />
                    <EvalCheck
                      checked={item.trainerCanDo}
                      onChange={(v) => updateCategoryItem(key, item.id, { trainerCanDo: v })}
                      disabled={trainerDisabled}
                      label="できている"
                      color="#FF6B6B"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-3 text-[12px] font-bold text-white/80">カリキュラム進捗</div>
      <div className="flex flex-col gap-3">
        {CURRICULUM_PERIODS.map((period) => {
          const items = curriculumByPeriod[period] ?? [];
          if (items.length === 0) return null;
          const done = items.filter((i) => i.selfUnderstood && i.selfCanDo).length;
          return (
            <div key={period} className="rounded-2xl border border-white/7 bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[13px] font-bold text-white">{period}</div>
                <div className="text-[11px] text-white/40">
                  {done} / {items.length} 完了
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((step) => (
                  <div
                    key={step.id}
                    className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-[11px] text-white/45">{step.group}</div>
                        <div className="mt-0.5 text-[12px] text-white">{step.goal}</div>
                        {step.milestone && (
                          <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-amber/10 px-2 py-0.5 text-[10px] text-amber">
                            <Milestone size={10} /> {step.milestone}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white/40">本人</span>
                          <EvalCheck checked={step.selfUnderstood} onChange={(v) => updateCurriculum(step.id, { selfUnderstood: v })} disabled={selfDisabled} label="理解" color="#00D4FF" />
                          <EvalCheck checked={step.selfCanDo} onChange={(v) => updateCurriculum(step.id, { selfCanDo: v })} disabled={selfDisabled} label="できてる" color="#00E5A0" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white/40">担当</span>
                          <EvalCheck checked={step.trainerUnderstood} onChange={(v) => updateCurriculum(step.id, { trainerUnderstood: v })} disabled={trainerDisabled} label="理解" color="#FFB830" />
                          <EvalCheck checked={step.trainerCanDo} onChange={(v) => updateCurriculum(step.id, { trainerCanDo: v })} disabled={trainerDisabled} label="できてる" color="#FF6B6B" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {!fullyReadOnly && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={!dirty}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold text-white transition disabled:opacity-40"
            style={{
              background: dirty
                ? "linear-gradient(135deg, #00E5A0 0%, #7B5EA7 100%)"
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
