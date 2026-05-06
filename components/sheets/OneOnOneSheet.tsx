"use client";

import { useEffect, useState } from "react";
import { Plus, Save, ChevronDown, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { OneOnOneEntry, OneOnOneSheet } from "@/types";
import { useSheet } from "@/lib/sheet-storage";
import { SHEET_META } from "@/lib/curriculum-data";
import { useAuthedUser } from "@/lib/session";
import { Field, ReadOnlyBanner } from "./primitives";

interface Props {
  userId: string;
  /** owner 以外（manager/admin）が開いたとき true — 本人入力欄は readonly、managerCommentのみ編集可 */
  readonly?: boolean;
  /** readonly=true でも managerComment 編集を許可するか（manager/admin trainerMode） */
  commenterMode?: boolean;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function uid(): string {
  return `1on1-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function OneOnOneSheetPanel({ userId, readonly, commenterMode }: Props) {
  const [stored, save] = useSheet(userId, "oneonone");
  const [draft, setDraft] = useState<OneOnOneSheet>(stored);
  const [openId, setOpenId] = useState<string | null>(null);
  const { session } = useAuthedUser();
  const meta = SHEET_META.oneonone;
  const accent = "rgba(183,148,244,0.2)";

  useEffect(() => {
    setDraft(stored);
  }, [stored]);

  useEffect(() => {
    if (draft.entries.length > 0 && openId === null) {
      setOpenId(draft.entries[0].id);
    }
  }, [draft.entries, openId]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(stored);

  const handleSave = async () => {
    try {
      await save(draft);
      toast.success("1on1シートを保存しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    }
  };

  const canAddEntry = !readonly;
  const canEditSelfFields = !readonly;
  // マネージャーコメントは manager/admin（commenterMode）のみ編集可。本人は閲覧のみ。
  const canEditComment = !!commenterMode;

  const addEntry = () => {
    const entry: OneOnOneEntry = {
      id: uid(),
      date: today(),
      health: "",
      personal: "",
      career: "",
      workAnxiety: "",
      monthlyReflection: "",
      other: "",
    };
    setDraft((d) => ({ entries: [entry, ...d.entries] }));
    setOpenId(entry.id);
  };

  const updateEntry = (id: string, patch: Partial<OneOnOneEntry>) =>
    setDraft((d) => ({
      entries: d.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));

  const deleteEntry = (id: string) => {
    setDraft((d) => ({ entries: d.entries.filter((e) => e.id !== id) }));
  };

  const sorted = [...draft.entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      {readonly && !commenterMode && <ReadOnlyBanner note="マネージャー/管理者は本人フィールドを編集できません。" />}
      {commenterMode && (
        <div className="mb-4 rounded-xl border border-purple/20 bg-purple/[0.08] px-3.5 py-2 text-[11px] text-white/70">
          💬 コメント編集モード — 各エントリの「マネージャーコメント」のみ編集できます。
        </div>
      )}

      <div
        className="mb-4 rounded-2xl border p-5"
        style={{ background: meta.tint, borderColor: accent }}
      >
        <div className="mb-1 text-[11px] uppercase tracking-[0.15em]" style={{ color: meta.color }}>
          {meta.emoji} {meta.label}
        </div>
        <div className="flex items-start justify-between gap-5">
          <div>
            <div className="text-[18px] font-bold text-white">月次の1on1・振り返り</div>
            <div className="mt-1 text-[11px] text-white/50">
              体調・プライベート・業務への不安を含め、月次で自分の状態を言語化します。マネージャーがコメントで返信します。
            </div>
          </div>
          {canAddEntry && (
            <button
              onClick={addEntry}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-bold text-white transition"
              style={{
                background: `linear-gradient(135deg, ${meta.color} 0%, #7B5EA7 100%)`,
              }}
            >
              <Plus size={13} />
              新しい1on1
            </button>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-white/7 bg-white/[0.02] p-10 text-center text-[12px] text-white/40">
          まだ1on1の記録がありません。
          {canAddEntry && (
            <div className="mt-2 text-white/55">
              「＋ 新しい1on1」で今月分を書きましょう。
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((entry) => {
            const isOpen = openId === entry.id;
            return (
              <div
                key={entry.id}
                className="overflow-hidden rounded-2xl border border-white/7 bg-white/[0.03]"
              >
                <div
                  className="flex cursor-pointer items-center gap-3 px-4 py-3"
                  onClick={() => setOpenId(isOpen ? null : entry.id)}
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[12px] font-bold"
                    style={{ background: meta.tint, color: meta.color }}
                  >
                    <MessageCircle size={14} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-white">
                      {entry.date || "日付未入力"}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-white/40">
                      {entry.monthlyReflection || "PDCA未記入"}
                    </div>
                  </div>
                  {entry.managerComment && (
                    <span className="rounded-full bg-purple/15 px-2 py-0.5 text-[10px] text-purple">
                      💬 コメント済
                    </span>
                  )}
                  <ChevronDown
                    size={16}
                    className="text-white/30 transition-transform"
                    style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
                  />
                </div>

                {isOpen && (
                  <div className="border-t border-white/7 bg-white/[0.02] p-4">
                    <div className="mb-3 grid grid-cols-2 gap-3">
                      <Field
                        label="日付"
                        value={entry.date}
                        onChange={(v) => updateEntry(entry.id, { date: v })}
                        readonly={!canEditSelfFields}
                        placeholder="2026-04-15"
                        accent={accent}
                      />
                      <Field
                        label="体調面"
                        value={entry.health}
                        onChange={(v) => updateEntry(entry.id, { health: v })}
                        readonly={!canEditSelfFields}
                        placeholder="良好／疲労／…"
                        accent={accent}
                      />
                    </div>
                    <div className="mb-3 grid grid-cols-2 gap-3">
                      <Field
                        label="プライベートトピック"
                        value={entry.personal}
                        onChange={(v) => updateEntry(entry.id, { personal: v })}
                        readonly={!canEditSelfFields}
                        multiline
                        rows={2}
                        placeholder="最近プライベートで起きたこと"
                        accent={accent}
                      />
                      <Field
                        label="キャリア"
                        value={entry.career}
                        onChange={(v) => updateEntry(entry.id, { career: v })}
                        readonly={!canEditSelfFields}
                        multiline
                        rows={2}
                        accent={accent}
                      />
                    </div>
                    <div className="mb-3">
                      <Field
                        label="業務の課題"
                        value={entry.workAnxiety}
                        onChange={(v) => updateEntry(entry.id, { workAnxiety: v })}
                        readonly={!canEditSelfFields}
                        multiline
                        rows={2}
                        placeholder="現在抱えている業務上の課題・不安"
                        accent={accent}
                      />
                    </div>
                    <div className="mb-3">
                      <Field
                        label="PDCA（結果・成長・タスク）"
                        value={entry.monthlyReflection}
                        onChange={(v) => updateEntry(entry.id, { monthlyReflection: v })}
                        readonly={!canEditSelfFields}
                        multiline
                        rows={3}
                        placeholder="今月の Plan / Do / Check / Action — 結果・成長・次のタスク"
                        accent={accent}
                      />
                    </div>
                    <div className="mb-3">
                      <Field
                        label="その他"
                        value={entry.other}
                        onChange={(v) => updateEntry(entry.id, { other: v })}
                        readonly={!canEditSelfFields}
                        multiline
                        rows={2}
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
                          updateEntry(entry.id, {
                            managerComment: value,
                            managerId: value ? session?.userId : undefined,
                            reviewedAt: value ? today() : undefined,
                          });
                        }}
                        readOnly={!canEditComment}
                        placeholder={canEditComment ? "マネージャーからのフィードバックを書きましょう" : "未記入"}
                        rows={3}
                        className="w-full resize-none rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-[12px] text-white placeholder-white/25 outline-none focus:border-purple/30"
                      />
                      {entry.reviewedAt && (
                        <div className="mt-1.5 text-[10px] text-white/40">
                          レビュー日: {entry.reviewedAt}
                        </div>
                      )}
                    </div>

                    {!readonly && (
                      <div className="mt-4 flex justify-between">
                        <button
                          onClick={() => {
                            if (confirm("この1on1エントリを削除しますか？")) {
                              deleteEntry(entry.id);
                            }
                          }}
                          className="flex items-center gap-1.5 rounded-lg border border-coral/20 bg-coral/5 px-3 py-1.5 text-[11px] text-coral hover:bg-coral/10"
                        >
                          <Trash2 size={11} />
                          削除
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {(canEditSelfFields || canEditComment) && (
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
