"use client";

import { FormEvent, useEffect, useState } from "react";
import { X, Wand2 } from "lucide-react";
import { toast } from "sonner";
import type { RevenueTargets } from "@/types";
import { useRevenueTargets } from "@/lib/sales-store";
import { fmtFull } from "@/lib/utils";
import { ModalPortal } from "@/components/common/ModalPortal";

interface Props {
  open: boolean;
  ownerId: string;
  year: number;
  onClose: () => void;
}

export function TargetEditModal({ open, ownerId, year, onClose }: Props) {
  const { targets, saveTargets } = useRevenueTargets(ownerId, year);
  const [draft, setDraft] = useState<RevenueTargets>(targets);

  useEffect(() => {
    if (open) setDraft(targets);
  }, [open, targets]);

  if (!open) return null;

  const yearTotal = Object.values(draft.monthly).reduce((a, b) => a + b, 0);

  const setMonth = (m: number, value: number) => {
    setDraft({ ...draft, monthly: { ...draft.monthly, [m]: value } });
  };

  // 月次入力の step (1万円単位) に合わせて丸めたい
  const ROUND_UNIT = 10000;
  const roundToUnit = (n: number) =>
    Math.max(0, Math.round(n / ROUND_UNIT) * ROUND_UNIT);

  const distributeEvenly = (annualTotal: number) => {
    if (annualTotal <= 0) return;
    // ランプアップ（Q1 24%, Q2 25%, Q3 25%, Q4 26%）で分散
    const quarterShare = [0.24, 0.25, 0.25, 0.26];
    const monthly: Record<number, number> = {};
    let accumulated = 0;
    // 1〜11月はそれぞれ四半期の 1/3 を 1万円単位に丸めて配分
    for (let m = 1; m <= 11; m++) {
      const q = Math.floor((m - 1) / 3);
      const rounded = roundToUnit((annualTotal * quarterShare[q]) / 3);
      monthly[m] = rounded;
      accumulated += rounded;
    }
    // 12月で端数を吸収して年間目標ちょうどに寄せる
    monthly[12] = roundToUnit(Math.max(0, annualTotal - accumulated));
    setDraft({ ...draft, monthly });
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await saveTargets(draft);
      toast.success(`${year}年の目標を保存しました`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    }
  };

  return (
    <ModalPortal>
    <div
      onClick={onClose}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)" }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="flex max-h-[92vh] w-full max-w-2xl animate-fade-up flex-col overflow-hidden rounded-3xl border border-amber/20 bg-bg-panel shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.15em] text-amber/70">
              Edit Revenue Targets · {year}
            </div>
            <h2 className="text-lg font-extrabold">月次目標を編集</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-5 rounded-2xl border border-amber/15 bg-amber/[0.06] p-4">
            <div className="mb-2 text-[11px] text-white/60">
              年間目標を一括入力すると、四半期の重みで自動分配されます（Q1:24% / Q2:25% / Q3:25% / Q4:26%）
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                placeholder="例: 72000000"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const v = Number((e.target as HTMLInputElement).value);
                    if (v > 0) distributeEvenly(v);
                  }
                }}
                id="annual-target-input"
                className="flex-1 rounded-lg border border-amber/30 bg-white/[0.03] px-3 py-2 text-[13px] font-bold text-white outline-none focus:border-amber/60"
              />
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("annual-target-input") as HTMLInputElement | null;
                  const v = Number(el?.value ?? 0);
                  if (v > 0) distributeEvenly(v);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-amber/30 bg-amber/10 px-3 py-2 text-[12px] font-bold text-amber hover:bg-amber/15"
              >
                <Wand2 size={13} />
                自動分配
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <label key={m} className="block">
                <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">
                  {m}月
                </div>
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={draft.monthly[m] ? draft.monthly[m] : ""}
                  onChange={(e) =>
                    setMonth(m, e.target.value === "" ? 0 : Number(e.target.value))
                  }
                  placeholder="0"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[12px] font-semibold text-white outline-none focus:border-amber/40"
                />
              </label>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] text-white/50">年間目標合計</div>
              <div className="text-lg font-extrabold text-amber">{fmtFull(yearTotal)}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 px-4 py-2 text-[12px] text-white/70 hover:bg-white/[0.05]"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="rounded-xl px-5 py-2 text-[12px] font-bold text-white shadow-[0_4px_20px_rgba(255,184,48,0.3)]"
            style={{ background: "linear-gradient(135deg, #FFB830 0%, #FF6B6B 100%)" }}
          >
            目標を保存
          </button>
        </div>
      </form>
    </div>
    </ModalPortal>
  );
}
