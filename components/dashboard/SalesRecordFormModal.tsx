"use client";

import { FormEvent, useEffect, useState } from "react";
import { X, Trash2, Package, Zap } from "lucide-react";
import { toast } from "sonner";
import type { RevenueType, SalesRecord } from "@/types";
import { useSalesRecords } from "@/lib/sales-store";
import { useCustomers } from "@/lib/customer-store";
import { useProducts } from "@/lib/products-store";
import { fmtFull } from "@/lib/utils";

interface Props {
  open: boolean;
  ownerId: number;
  year: number;
  editing: SalesRecord | null;
  prefill?: { productName?: string; month?: number; revenueType?: RevenueType };
  onClose: () => void;
}

type DraftRecord = Omit<SalesRecord, "id" | "recordedAt">;

const REVENUE_TYPES: { key: RevenueType; label: string; desc: string; color: string; icon: typeof Zap }[] = [
  { key: "stock", label: "ストック", desc: "継続課金・月額契約 (MRR)", color: "#00E5A0", icon: Zap },
  { key: "shot", label: "ショット", desc: "一時的売上・初期費用など", color: "#FFB830", icon: Package },
];

const emptyDraft = (ownerId: number, year: number, firstProduct: string): DraftRecord => ({
  ownerId,
  productName: firstProduct,
  revenueType: "stock",
  amount: 0,
  year,
  month: new Date().getMonth() + 1,
  customerId: undefined,
  memo: "",
});

export function SalesRecordFormModal({
  open,
  ownerId,
  year,
  editing,
  prefill,
  onClose,
}: Props) {
  const { addRecord, updateRecord, deleteRecord } = useSalesRecords();
  const { customers } = useCustomers(ownerId);
  const { products } = useProducts();
  const firstProduct = products[0]?.name ?? "";
  const [draft, setDraft] = useState<DraftRecord>(() => emptyDraft(ownerId, year, firstProduct));

  useEffect(() => {
    if (editing) {
      const { id: _id, recordedAt: _r, ...rest } = editing;
      void _id;
      void _r;
      setDraft(rest);
    } else if (prefill) {
      setDraft({
        ...emptyDraft(ownerId, year, firstProduct),
        ...(prefill.productName ? { productName: prefill.productName } : {}),
        ...(prefill.month ? { month: prefill.month } : {}),
        ...(prefill.revenueType ? { revenueType: prefill.revenueType } : {}),
      });
    } else {
      setDraft(emptyDraft(ownerId, year, firstProduct));
    }
  }, [editing, prefill, ownerId, year, open, firstProduct]);

  if (!open) return null;

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (draft.amount <= 0) {
      toast.error("金額を入力してください");
      return;
    }
    if (editing) {
      updateRecord(editing.id, draft);
      toast.success("売上レコードを更新しました");
    } else {
      addRecord(draft);
      toast.success(`${draft.month}月の ${draft.productName} を登録しました`);
    }
    onClose();
  };

  const onDelete = () => {
    if (!editing) return;
    if (!confirm("この売上レコードを削除します。よろしいですか？")) return;
    deleteRecord(editing.id);
    toast.success("削除しました");
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)" }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="flex max-h-[92vh] w-full max-w-lg animate-fade-up flex-col overflow-hidden rounded-3xl border border-cyan/20 bg-bg-panel shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.15em] text-cyan/70">
              {editing ? "Edit Sales Record" : "Log Sales"}
            </div>
            <h2 className="text-lg font-extrabold">
              {editing ? "売上レコードを編集" : "売上を記録"}
            </h2>
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
          <div className="mb-5">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-white/40">
              商材
            </div>
            {products.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] text-white/40">
                商材が登録されていません。管理者画面の「商材管理」から追加してください。
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {products.map((p) => {
                  const active = draft.productName === p.name;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setDraft({ ...draft, productName: p.name })}
                      className="rounded-lg border px-2.5 py-2 text-[12px] transition"
                      style={{
                        background: active ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.03)",
                        borderColor: active ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.1)",
                        color: active ? "#00D4FF" : "rgba(255,255,255,0.55)",
                        fontWeight: active ? 700 : 500,
                      }}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mb-5">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-white/40">
              売上区分
            </div>
            <div className="grid grid-cols-2 gap-2">
              {REVENUE_TYPES.map((t) => {
                const active = draft.revenueType === t.key;
                const Icon = t.icon;
                return (
                  <button
                    type="button"
                    key={t.key}
                    onClick={() => setDraft({ ...draft, revenueType: t.key })}
                    className="flex items-start gap-2.5 rounded-xl border p-3 text-left transition"
                    style={{
                      background: active ? `${t.color}12` : "rgba(255,255,255,0.02)",
                      borderColor: active ? `${t.color}60` : "rgba(255,255,255,0.1)",
                    }}
                  >
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${t.color}20`, color: t.color }}
                    >
                      <Icon size={14} />
                    </div>
                    <div>
                      <div
                        className="text-[13px] font-bold"
                        style={{ color: active ? t.color : "rgba(255,255,255,0.7)" }}
                      >
                        {t.label}
                      </div>
                      <div className="mt-0.5 text-[10px] text-white/40">{t.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3">
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">
                計上月
              </div>
              <select
                value={draft.month}
                onChange={(e) => setDraft({ ...draft, month: Number(e.target.value) })}
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none focus:border-cyan/40"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m} className="bg-bg-panel">
                    {year}年 {m}月
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">
                金額（円）
              </div>
              <input
                type="number"
                min={0}
                step={1000}
                value={draft.amount}
                onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })}
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] font-bold text-white outline-none focus:border-cyan/40"
                required
              />
              {draft.amount > 0 && (
                <div className="mt-1 text-[10px] text-white/40">
                  {fmtFull(draft.amount)}
                </div>
              )}
            </label>
          </div>

          <div className="mb-5">
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">
                顧客（任意）
              </div>
              <select
                value={draft.customerId ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    customerId: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none focus:border-cyan/40"
              >
                <option value="" className="bg-bg-panel">
                  — 選択しない —
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id} className="bg-bg-panel">
                    {c.name}
                  </option>
                ))}
              </select>
              {customers.length === 0 && (
                <div className="mt-1 text-[10px] text-white/35">
                  CRM に登録した顧客とこの売上を紐付けられます（未登録のときはスキップ可）
                </div>
              )}
            </label>
          </div>

          <div className="mb-2">
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">
                メモ
              </div>
              <textarea
                value={draft.memo ?? ""}
                onChange={(e) => setDraft({ ...draft, memo: e.target.value })}
                rows={2}
                placeholder="契約期間、備考など"
                className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none focus:border-cyan/40"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
          {editing ? (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1.5 rounded-lg border border-coral/25 bg-coral/5 px-3 py-1.5 text-[11px] text-coral hover:bg-coral/10"
            >
              <Trash2 size={12} />
              削除
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/15 px-4 py-2 text-[12px] text-white/70 hover:bg-white/[0.05]"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="rounded-xl px-5 py-2 text-[12px] font-bold text-white shadow-[0_4px_20px_rgba(0,212,255,0.3)]"
              style={{ background: "linear-gradient(135deg, #00D4FF 0%, #7B5EA7 100%)" }}
            >
              {editing ? "更新する" : "登録する"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
