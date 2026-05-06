"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, Milestone, Plus, Trash2 } from "lucide-react";
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
  isCustomPeriod,
} from "@/lib/curriculum-data";
import { useAuthedUser } from "@/lib/session";
import { Field, EvalCheck, ReadOnlyBanner } from "./primitives";

interface Props {
  userId: string;
  readonly?: boolean;
  /** trainer（マネージャー・管理者）モードでは教育担当列のみ編集可 */
  trainerMode?: boolean;
}

function uid(): string {
  return `custom-${Date.now()}-${Math.floor(Math.random() * 10000)
    .toString(36)
    .padStart(4, "0")}`;
}

export function DevelopmentSheetPanel({ userId, readonly, trainerMode }: Props) {
  const [stored, save] = useSheet(userId, "development");
  const [draft, setDraft] = useState<DevelopmentSheet>(stored);
  const dirty = JSON.stringify(draft) !== JSON.stringify(stored);
  const meta = SHEET_META.development;
  const accent = "rgba(255,255,255,0.15)";

  // 管理者のみ、2ヶ月目以降のカスタム期間で項目編集・追加・削除が可能
  const { user: currentUser } = useAuthedUser();
  const isAdmin = currentUser?.role === "admin";

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
    const completed = draft.curriculum.filter(
      (c) => c.selfUnderstood && c.selfCanDo,
    ).length;
    const grouped: Record<string, CurriculumStep[]> = {};
    for (const c of draft.curriculum) {
      if (!grouped[c.period]) grouped[c.period] = [];
      grouped[c.period].push(c);
    }
    return {
      totalSteps: total,
      completedSteps: completed,
      curriculumByPeriod: grouped,
    };
  }, [draft.curriculum]);

  const progress = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const updateCategoryItem = (
    key: DevelopmentCategoryKey,
    id: string,
    patch: Partial<CategoryItem>,
  ) =>
    setDraft((d) => ({
      ...d,
      categoryItems: {
        ...d.categoryItems,
        [key]: d.categoryItems[key].map((it) =>
          it.id === id ? { ...it, ...patch } : it,
        ),
      },
    }));

  const updateCurriculum = (id: string, patch: Partial<CurriculumStep>) =>
    setDraft((d) => ({
      ...d,
      curriculum: d.curriculum.map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      ),
    }));

  const addCurriculumItem = (period: string) => {
    const newItem: CurriculumStep = {
      id: uid(),
      period,
      group: "",
      goal: "",
      milestone: undefined,
      selfUnderstood: false,
      selfCanDo: false,
      trainerUnderstood: false,
      trainerCanDo: false,
      custom: true,
    };
    setDraft((d) => ({ ...d, curriculum: [...d.curriculum, newItem] }));
  };

  const removeCurriculumItem = (id: string) => {
    setDraft((d) => ({
      ...d,
      curriculum: d.curriculum.filter((c) => c.id !== id),
    }));
  };

  // 全域 readonly（trainerMode でない外部閲覧）
  const fullyReadOnly = readonly && !trainerMode;
  // 本人列: 本人だけが編集可（readonly や trainerMode では編集不可）
  const selfDisabled = readonly || !!trainerMode;
  // 教育担当列: trainer/admin (trainerMode) のみ編集可。本人や readonly では編集不可
  const trainerDisabled = !trainerMode;

  return (
    <div>
      {fullyReadOnly && <ReadOnlyBanner />}
      {trainerMode && !isAdmin && (
        <div className="mb-4 rounded-xl border border-amber/20 bg-amber/[0.08] px-3.5 py-2 text-[11px] text-white/70">
          👩‍🏫 教育担当モード — 右側の「教育担当」列のみ編集できます。
        </div>
      )}
      {isAdmin && (
        <div className="mb-4 rounded-xl border border-coral/25 bg-coral/[0.06] px-3.5 py-2 text-[11px] text-white/75">
          🛡️ 管理者モード — 2ヶ月目以降のセクションは項目を編集・追加・削除できます（共通レール部分は固定）。
        </div>
      )}

      <div
        className="mb-4 rounded-2xl border border-white/10 p-5"
        style={{ background: meta.tint }}
      >
        <div
          className="mb-1 text-[11px] uppercase tracking-[0.15em]"
          style={{ color: meta.color }}
        >
          {meta.emoji} {meta.label}
        </div>
        <div className="flex items-center justify-between gap-5">
          <div>
            <div className="text-[18px] font-bold text-white">
              6ヶ月オンボーディングカリキュラム
            </div>
            <div className="mt-1 text-[11px] text-white/50">
              本人 × 教育担当 それぞれが「理解」「実行」を付けて進捗を可視化します。
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div
              className="text-[22px] font-extrabold"
              style={{ color: meta.color }}
            >
              {progress}%
            </div>
            <div className="text-[11px] text-white/50">
              {completedSteps} / {totalSteps} 完了
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Field
          label="所属"
          value={draft.department}
          onChange={(v) => setDraft({ ...draft, department: v })}
          readonly={selfDisabled}
          placeholder="営業1部"
          accent={accent}
        />
        <Field
          label="期間"
          value={draft.period}
          onChange={(v) => setDraft({ ...draft, period: v })}
          readonly={selfDisabled}
          placeholder="2026-01-10 〜 2026-07-10"
          accent={accent}
        />
        <Field
          label="3ヶ月で目指すべき姿"
          value={draft.goal3Months}
          onChange={(v) => setDraft({ ...draft, goal3Months: v })}
          readonly={selfDisabled}
          placeholder="..."
          accent={accent}
        />
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
                  <div className="mb-2 text-[12px] text-white">{item.label}</div>
                  <EvalGroup
                    selfUnderstood={item.selfUnderstood}
                    selfCanDo={item.selfCanDo}
                    trainerUnderstood={item.trainerUnderstood}
                    trainerCanDo={item.trainerCanDo}
                    selfDisabled={!!selfDisabled}
                    trainerDisabled={trainerDisabled}
                    onChange={(patch) => updateCategoryItem(key, item.id, patch)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-3 text-[12px] font-bold text-white/80">
        カリキュラム進捗
      </div>
      <div className="flex flex-col gap-3">
        {CURRICULUM_PERIODS.map((period) => {
          const items = curriculumByPeriod[period] ?? [];
          const isCustom = isCustomPeriod(period);
          // カスタム期間は項目が空でも管理者が追加できるよう常に表示
          if (items.length === 0 && !isCustom) return null;
          const done = items.filter(
            (i) => i.selfUnderstood && i.selfCanDo,
          ).length;
          const canCustomize = isAdmin && isCustom;
          return (
            <div
              key={period}
              className="rounded-2xl border p-4"
              style={{
                background: isCustom
                  ? "rgba(255,107,107,0.04)"
                  : "rgba(255,255,255,0.02)",
                borderColor: isCustom
                  ? "rgba(255,107,107,0.18)"
                  : "rgba(255,255,255,0.07)",
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-[13px] font-bold text-white">
                    {period}
                  </div>
                  {isCustom && (
                    <span className="rounded-full border border-coral/30 bg-coral/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-coral">
                      カスタム
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-[11px] text-white/40">
                    {done} / {items.length} 完了
                  </div>
                  {canCustomize && (
                    <button
                      onClick={() => addCurriculumItem(period)}
                      className="flex items-center gap-1 rounded-lg border border-coral/30 bg-coral/10 px-2 py-1 text-[10px] font-bold text-coral hover:bg-coral/15"
                    >
                      <Plus size={10} />
                      項目を追加
                    </button>
                  )}
                </div>
              </div>

              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-[11px] text-white/35">
                  この期間にはまだ項目がありません。
                  {canCustomize && "「項目を追加」から作成できます。"}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {items.map((step) => (
                    <CurriculumRow
                      key={step.id}
                      step={step}
                      canCustomize={canCustomize}
                      selfDisabled={!!selfDisabled}
                      trainerDisabled={trainerDisabled}
                      onUpdate={(patch) => updateCurriculum(step.id, patch)}
                      onDelete={() => removeCurriculumItem(step.id)}
                    />
                  ))}
                </div>
              )}
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

// ─────────── 評価グループ（本人 / 担当 を 2 ボックスに分離） ───

interface EvalGroupProps {
  selfUnderstood: boolean;
  selfCanDo: boolean;
  trainerUnderstood: boolean;
  trainerCanDo: boolean;
  selfDisabled: boolean;
  trainerDisabled: boolean;
  onChange: (patch: {
    selfUnderstood?: boolean;
    selfCanDo?: boolean;
    trainerUnderstood?: boolean;
    trainerCanDo?: boolean;
  }) => void;
}

function EvalGroup({
  selfUnderstood,
  selfCanDo,
  trainerUnderstood,
  trainerCanDo,
  selfDisabled,
  trainerDisabled,
  onChange,
}: EvalGroupProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <div
        className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5"
        style={{
          background: "rgba(0,212,255,0.05)",
          borderColor: "rgba(0,212,255,0.22)",
        }}
      >
        <span className="text-[9px] font-bold uppercase tracking-wider text-cyan/85">
          本人
        </span>
        <div className="h-3 w-px bg-cyan/20" />
        <EvalCheck
          checked={selfUnderstood}
          onChange={(v) => onChange({ selfUnderstood: v })}
          disabled={selfDisabled}
          label="理解"
          color="#00D4FF"
        />
        <EvalCheck
          checked={selfCanDo}
          onChange={(v) => onChange({ selfCanDo: v })}
          disabled={selfDisabled}
          label="実行"
          color="#00E5A0"
        />
      </div>
      <div
        className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5"
        style={{
          background: "rgba(255,184,48,0.05)",
          borderColor: "rgba(255,184,48,0.22)",
        }}
      >
        <span className="text-[9px] font-bold uppercase tracking-wider text-amber/85">
          担当
        </span>
        <div className="h-3 w-px bg-amber/20" />
        <EvalCheck
          checked={trainerUnderstood}
          onChange={(v) => onChange({ trainerUnderstood: v })}
          disabled={trainerDisabled}
          label="理解"
          color="#FFB830"
        />
        <EvalCheck
          checked={trainerCanDo}
          onChange={(v) => onChange({ trainerCanDo: v })}
          disabled={trainerDisabled}
          label="実行"
          color="#FF6B6B"
        />
      </div>
    </div>
  );
}

// ─────────── 1 行分の表示 ───────────────────────────

interface RowProps {
  step: CurriculumStep;
  canCustomize: boolean;
  selfDisabled: boolean;
  trainerDisabled: boolean;
  onUpdate: (patch: Partial<CurriculumStep>) => void;
  onDelete: () => void;
}

function CurriculumRow({
  step,
  canCustomize,
  selfDisabled,
  trainerDisabled,
  onUpdate,
  onDelete,
}: RowProps) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {canCustomize ? (
            <div className="flex flex-col gap-1.5">
              <input
                type="text"
                value={step.group}
                onChange={(e) => onUpdate({ group: e.target.value })}
                placeholder="グループ / 研修名"
                className="w-full rounded border border-white/15 bg-white/[0.04] px-2 py-1 text-[11px] text-white/85 outline-none placeholder-white/25 focus:border-coral/50"
              />
              <input
                type="text"
                value={step.goal}
                onChange={(e) => onUpdate({ goal: e.target.value })}
                placeholder="達成目標 / 内容"
                className="w-full rounded border border-white/15 bg-white/[0.04] px-2 py-1 text-[12px] font-medium text-white outline-none placeholder-white/25 focus:border-coral/50"
              />
              <input
                type="text"
                value={step.milestone ?? ""}
                onChange={(e) =>
                  onUpdate({ milestone: e.target.value || undefined })
                }
                placeholder="マイルストーン（任意）"
                className="w-full rounded border border-amber/15 bg-amber/[0.03] px-2 py-1 text-[10px] text-amber/90 outline-none placeholder-amber/30 focus:border-amber/50"
              />
            </div>
          ) : (
            <>
              <div className="text-[11px] text-white/45">{step.group}</div>
              <div className="mt-0.5 text-[12px] text-white">{step.goal}</div>
              {step.milestone && (
                <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-amber/10 px-2 py-0.5 text-[10px] text-amber">
                  <Milestone size={10} /> {step.milestone}
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <EvalGroup
            selfUnderstood={step.selfUnderstood}
            selfCanDo={step.selfCanDo}
            trainerUnderstood={step.trainerUnderstood}
            trainerCanDo={step.trainerCanDo}
            selfDisabled={selfDisabled}
            trainerDisabled={trainerDisabled}
            onChange={(patch) => onUpdate(patch)}
          />
          {canCustomize && (
            <button
              onClick={() => {
                if (
                  confirm(
                    `「${step.goal || "(無題)"}」を削除しますか？`,
                  )
                ) {
                  onDelete();
                }
              }}
              className="flex items-center gap-1 rounded border border-coral/20 bg-coral/5 px-1.5 py-0.5 text-[10px] text-coral hover:bg-coral/10"
              title="この項目を削除"
            >
              <Trash2 size={9} />
              削除
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
