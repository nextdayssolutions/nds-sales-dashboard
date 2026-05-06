"use client";

import { FormEvent, useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Customer, CustomerStatus } from "@/types";
import { useCustomers } from "@/lib/customer-store";
import { useProducts } from "@/lib/products-store";
import { RelationDots } from "@/components/common/RelationDots";
import { ModalPortal } from "@/components/common/ModalPortal";

interface Props {
  open: boolean;
  ownerId: string;
  editing: Customer | null;
  onClose: () => void;
}

const STATUSES: CustomerStatus[] = ["見込み", "商談中", "既存"];

const STATUS_META: Record<CustomerStatus, { color: string; desc: string }> = {
  見込み: { color: "#B794F4", desc: "名刺交換後、未提案／未導入" },
  商談中: { color: "#FFB830", desc: "提案中・見積提出済み・稟議待ち" },
  既存: { color: "#00E5A0", desc: "サービス契約済み" },
};

const empty = (ownerId: string): Omit<Customer, "id"> => ({
  ownerId,
  name: "",
  industry: "",
  contact: "",
  contactEmail: "",
  contactPhone: "",
  products: [],
  relation: 5,
  lastContact: new Date().toISOString().slice(0, 10),
  revenue: 0,
  status: "見込み",
  nextAppointment: "",
  memo: "",
});

/** YYYY-MM-DD 文字列が「今日 or 未来」かどうか判定。空文字なら false */
function isFutureOrToday(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(target.getTime())) return false;
  return target.getTime() >= today.getTime();
}

export function CustomerFormModal({ open, ownerId, editing, onClose }: Props) {
  const { addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { products } = useProducts();
  const [draft, setDraft] = useState<Omit<Customer, "id">>(() => empty(ownerId));

  useEffect(() => {
    if (editing) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...rest } = editing;
      setDraft(rest);
    } else {
      setDraft(empty(ownerId));
    }
  }, [editing, ownerId, open]);

  if (!open) return null;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      toast.error("会社名は必須です");
      return;
    }
    try {
      if (editing) {
        await updateCustomer(editing.id, draft);
        toast.success(`「${draft.name}」を更新しました`);
      } else {
        await addCustomer(draft);
        toast.success(`「${draft.name}」を登録しました`);
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    }
  };

  const toggleProduct = (p: string) => {
    setDraft((d) => ({
      ...d,
      products: d.products.includes(p)
        ? d.products.filter((x) => x !== p)
        : [...d.products, p],
    }));
  };

  const onDelete = async () => {
    if (!editing) return;
    if (!confirm(`「${editing.name}」を削除します。よろしいですか？`)) return;
    try {
      await deleteCustomer(editing.id);
      toast.success(`「${editing.name}」を削除しました`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  return (
    <ModalPortal>
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)" }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="flex max-h-[92vh] w-full max-w-xl animate-fade-up flex-col overflow-hidden rounded-3xl border border-cyan/20 bg-bg-panel shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.15em] text-cyan/70">
              {editing ? "Edit Customer" : "New Customer"}
            </div>
            <h2 className="text-lg font-extrabold">
              {editing ? "顧客情報を編集" : "新規顧客を登録"}
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
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">会社名 *</div>
              <input
                type="text"
                required
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="株式会社◯◯"
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none focus:border-cyan/40"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">業界</div>
              <input
                type="text"
                value={draft.industry}
                onChange={(e) => setDraft({ ...draft, industry: e.target.value })}
                placeholder="IT / 製造 / 小売..."
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none focus:border-cyan/40"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">担当者名</div>
              <input
                type="text"
                value={draft.contact}
                onChange={(e) => setDraft({ ...draft, contact: e.target.value })}
                placeholder="山田 太郎"
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none focus:border-cyan/40"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">メール</div>
              <input
                type="email"
                value={draft.contactEmail ?? ""}
                onChange={(e) => setDraft({ ...draft, contactEmail: e.target.value })}
                placeholder="contact@example.co.jp"
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none focus:border-cyan/40"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">電話</div>
              <input
                type="tel"
                value={draft.contactPhone ?? ""}
                onChange={(e) => setDraft({ ...draft, contactPhone: e.target.value })}
                placeholder="03-0000-0000"
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none focus:border-cyan/40"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">最終接触日</div>
              <input
                type="date"
                value={draft.lastContact}
                onChange={(e) => setDraft({ ...draft, lastContact: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none focus:border-cyan/40"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">年間売上 (円)</div>
              <input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={draft.revenue === 0 ? "" : draft.revenue}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    revenue: e.target.value === "" ? 0 : Number(e.target.value),
                  })
                }
                placeholder="0"
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none focus:border-cyan/40"
              />
            </label>
            <label className="col-span-2 block">
              <div className="mb-1 flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-wider text-amber/80">
                  次回アポ日
                </div>
                <div className="text-[10px] text-amber/60">
                  未来日を入れるとステータスが自動で「商談中」に変わります
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={draft.nextAppointment ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraft((d) => ({
                      ...d,
                      nextAppointment: v,
                      status:
                        isFutureOrToday(v) && d.status !== "商談中"
                          ? "商談中"
                          : d.status,
                    }));
                  }}
                  className="flex-1 rounded-lg border border-amber/25 bg-amber/[0.04] px-3 py-2 text-[13px] text-white outline-none focus:border-amber/50"
                />
                {draft.nextAppointment && (
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({ ...d, nextAppointment: "" }))
                    }
                    className="rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-2 text-[11px] text-white/60 hover:text-white"
                    title="次回アポ日をクリア"
                  >
                    クリア
                  </button>
                )}
              </div>
            </label>
          </div>

          <div className="mt-5">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-white/40">
              ステータス *
            </div>
            <div className="grid grid-cols-3 gap-2">
              {STATUSES.map((s) => {
                const meta = STATUS_META[s];
                const active = draft.status === s;
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setDraft({ ...draft, status: s })}
                    className="rounded-xl border px-3 py-2.5 text-left transition"
                    style={{
                      background: active ? `${meta.color}15` : "rgba(255,255,255,0.02)",
                      borderColor: active ? `${meta.color}60` : "rgba(255,255,255,0.1)",
                    }}
                  >
                    <div
                      className="text-[13px] font-bold"
                      style={{ color: active ? meta.color : "rgba(255,255,255,0.7)" }}
                    >
                      {s}
                    </div>
                    <div className="mt-1 text-[10px] text-white/40">{meta.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wider text-white/40">
                関係値スコア
              </div>
              <div className="text-[11px] text-white/50">{draft.relation} / 10</div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={10}
                value={draft.relation}
                onChange={(e) => setDraft({ ...draft, relation: Number(e.target.value) })}
                className="flex-1 accent-cyan"
              />
              <RelationDots value={draft.relation} showLabel={false} />
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-white/40">
              導入商材（複数選択可）
            </div>
            {products.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] text-white/40">
                商材が登録されていません。管理者画面の「商材管理」から追加してください。
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {products.map((p) => {
                  const selected = draft.products.includes(p.name);
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => toggleProduct(p.name)}
                      className="rounded-lg border px-2.5 py-1 text-[12px] transition"
                      style={{
                        background: selected ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.02)",
                        borderColor: selected ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.1)",
                        color: selected ? "#00D4FF" : "rgba(255,255,255,0.55)",
                      }}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-5">
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">メモ</div>
              <textarea
                value={draft.memo ?? ""}
                onChange={(e) => setDraft({ ...draft, memo: e.target.value })}
                rows={3}
                placeholder="商談の経緯、キーパーソン、留意事項など"
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
    </ModalPortal>
  );
}
