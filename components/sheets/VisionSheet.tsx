"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import type { VisionSheet } from "@/types";
import { useSheet } from "@/lib/sheet-storage";
import { SHEET_META } from "@/lib/curriculum-data";
import { Field, ReadOnlyBanner } from "./primitives";

interface Props {
  userId: string;
  readonly?: boolean;
}

export function VisionSheetPanel({ userId, readonly }: Props) {
  const [stored, save] = useSheet(userId, "vision");
  const [draft, setDraft] = useState<VisionSheet>(stored);
  const dirty = JSON.stringify(draft) !== JSON.stringify(stored);
  const meta = SHEET_META.vision;

  useEffect(() => {
    setDraft(stored);
  }, [stored]);

  const handleSave = async () => {
    try {
      await save(draft);
      toast.success("理念・ビジョンを保存しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    }
  };

  const update = (patch: Partial<VisionSheet>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const accent = "rgba(255,176,122,0.2)";

  return (
    <div>
      {readonly && <ReadOnlyBanner />}

      <div
        className="mb-4 rounded-2xl border p-5"
        style={{
          background: meta.tint,
          borderColor: accent,
        }}
      >
        <div className="mb-1 text-[11px] uppercase tracking-[0.15em]" style={{ color: meta.color }}>
          {meta.emoji} {meta.label}
        </div>
        <div className="text-[18px] font-bold text-white">人生の土台を言語化する</div>
        <div className="mt-1 text-[11px] text-white/50">
          基本情報と3つの人生理念を記入します。入社時に1度、年1回見直し推奨。
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="作成日" value={draft.createdAt} onChange={(v) => update({ createdAt: v })} readonly={readonly} placeholder="2026-01-15" accent={accent} />
        <Field label="入社日" value={draft.joinedAt} onChange={(v) => update({ joinedAt: v })} readonly={readonly} placeholder="2026-01-10" accent={accent} />
        <Field label="年齢" value={draft.age} onChange={(v) => update({ age: v })} readonly={readonly} placeholder="28" accent={accent} />
        <Field label="出身" value={draft.birthplace} onChange={(v) => update({ birthplace: v })} readonly={readonly} placeholder="東京都" accent={accent} />
        <div className="col-span-2">
          <Field label="キャリア" value={draft.careerHistory} onChange={(v) => update({ careerHistory: v })} readonly={readonly} placeholder="前職・経験など" multiline rows={2} accent={accent} />
        </div>
        <div className="col-span-2">
          <Field label="その他" value={draft.other} onChange={(v) => update({ other: v })} readonly={readonly} placeholder="趣味・特技など" multiline rows={2} accent={accent} />
        </div>
      </div>

      <div className="mt-6 mb-2 text-[12px] font-bold text-white/80">人生理念</div>
      <div className="flex flex-col gap-3">
        {([1, 2, 3] as const).map((n) => (
          <div key={n} className="flex items-start gap-3">
            <div
              className="mt-1.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
              style={{ background: meta.tint, color: meta.color }}
            >
              {n}
            </div>
            <div className="flex-1">
              <Field
                label={`理念 ${n}`}
                value={draft[`principle${n}` as const]}
                onChange={(v) => update({ [`principle${n}`]: v } as Partial<VisionSheet>)}
                readonly={readonly}
                placeholder="自分が大切にしている価値観"
                multiline
                rows={2}
                accent={accent}
              />
            </div>
          </div>
        ))}
      </div>

      {!readonly && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={!dirty}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold text-white transition disabled:opacity-40"
            style={{
              background: dirty
                ? `linear-gradient(135deg, ${meta.color} 0%, #7B5EA7 100%)`
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
