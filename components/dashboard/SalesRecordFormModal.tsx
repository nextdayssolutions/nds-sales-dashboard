"use client";

import { FormEvent, useEffect, useState } from "react";
import { X, Trash2, Package, Zap, Repeat, Calendar } from "lucide-react";
import { toast } from "sonner";
import type { RevenueType, SalesRecord } from "@/types";
import { useSalesRecords } from "@/lib/sales-store";
import { useProducts, computeCommission } from "@/lib/products-store";
import { fmtFull } from "@/lib/utils";
import { ModalPortal } from "@/components/common/ModalPortal";

interface Props {
  open: boolean;
  ownerId: string;
  year: number;
  editing: SalesRecord | null;
  prefill?: { productName?: string; month?: number; revenueType?: RevenueType };
  onClose: () => void;
}

type DraftRecord = Omit<SalesRecord, "id" | "recordedAt">;

const REVENUE_TYPES: {
  key: RevenueType;
  label: string;
  desc: string;
  color: string;
  icon: typeof Zap;
}[] = [
  {
    key: "stock",
    label: "ストック",
    desc: "1度登録すると毎月自動継続（解約月を設定するまで）",
    color: "#00E5A0",
    icon: Repeat,
  },
  {
    key: "shot",
    label: "ショット",
    desc: "一時的売上・初期費用などの単月計上",
    color: "#FFB830",
    icon: Package,
  },
];

const emptyDraft = (
  ownerId: string,
  year: number,
  firstProduct: string,
): DraftRecord => ({
  ownerId,
  productName: firstProduct,
  revenueType: "stock",
  amount: 0,
  quantity: 1,
  commissionAmount: 0,
  year,
  month: new Date().getMonth() + 1,
  endYear: undefined,
  endMonth: undefined,
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
  const { products } = useProducts();
  const firstProduct = products[0]?.name ?? "";
  const [draft, setDraft] = useState<DraftRecord>(() =>
    emptyDraft(ownerId, year, firstProduct),
  );
  // 歩合額・売上金額を手動編集したか
  const [commissionTouched, setCommissionTouched] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);
  // ストックの解約月を設定するか（false = 継続中、true = 解約月を入力）
  const [endEnabled, setEndEnabled] = useState(false);

  const selectedProduct = products.find((p) => p.name === draft.productName);
  const autoAmount =
    selectedProduct?.unitPrice && draft.quantity > 0
      ? selectedProduct.unitPrice * draft.quantity
      : 0;
  const autoCommission = computeCommission(
    selectedProduct,
    draft.amount,
    draft.quantity,
  );

  const commissionLabel = selectedProduct
    ? selectedProduct.commissionType === "fixed"
      ? selectedProduct.commissionFixed > 0
        ? `${draft.productName} の歩合: ${fmtFull(selectedProduct.commissionFixed)}/件 × ${draft.quantity}個`
        : `${draft.productName} は歩合未設定`
      : selectedProduct.commissionRate > 0
        ? `${draft.productName} の歩合率: ${selectedProduct.commissionRate}%`
        : `${draft.productName} は歩合 0%`
    : "商材未選択";

  useEffect(() => {
    if (editing) {
      const { id: _id, recordedAt: _r, ...rest } = editing;
      void _id;
      void _r;
      setDraft(rest);
      setCommissionTouched(true); // 既存はスナップショット値を尊重
      setAmountTouched(true);
      setEndEnabled(rest.revenueType === "stock" && rest.endYear != null);
    } else if (prefill) {
      setDraft({
        ...emptyDraft(ownerId, year, firstProduct),
        ...(prefill.productName ? { productName: prefill.productName } : {}),
        ...(prefill.month ? { month: prefill.month } : {}),
        ...(prefill.revenueType ? { revenueType: prefill.revenueType } : {}),
      });
      setCommissionTouched(false);
      setAmountTouched(false);
      setEndEnabled(false);
    } else {
      setDraft(emptyDraft(ownerId, year, firstProduct));
      setCommissionTouched(false);
      setAmountTouched(false);
      setEndEnabled(false);
    }
  }, [editing, prefill, ownerId, year, open, firstProduct]);

  // 単価×個数で売上を自動計算（手動編集されていない時）
  useEffect(() => {
    if (!amountTouched && autoAmount > 0) {
      setDraft((d) => ({ ...d, amount: autoAmount }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAmount, amountTouched]);

  // 歩合自動計算
  useEffect(() => {
    if (!commissionTouched) {
      setDraft((d) => ({ ...d, commissionAmount: autoCommission }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.amount, draft.productName, draft.quantity, commissionTouched]);

  // shot に切替えたら end を消す。stock に戻ったら endEnabled に従って復元される
  useEffect(() => {
    if (draft.revenueType === "shot") {
      setDraft((d) => ({ ...d, endYear: undefined, endMonth: undefined }));
      setEndEnabled(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.revenueType]);

  // endEnabled が false に切り替わったら値もクリア
  useEffect(() => {
    if (!endEnabled) {
      setDraft((d) => ({ ...d, endYear: undefined, endMonth: undefined }));
    } else if (draft.endYear == null) {
      // 初期値: 開始月と同じ
      setDraft((d) => ({ ...d, endYear: d.year, endMonth: d.month }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endEnabled]);

  if (!open) return null;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (draft.amount <= 0) {
      toast.error("金額を入力してください");
      return;
    }
    if (draft.quantity <= 0) {
      toast.error("個数は 1 以上にしてください");
      return;
    }
    if (
      draft.revenueType === "stock" &&
      endEnabled &&
      draft.endYear != null &&
      draft.endMonth != null
    ) {
      const start = draft.year * 12 + draft.month;
      const end = draft.endYear * 12 + draft.endMonth;
      if (end < start) {
        toast.error("解約月は開始月以降にしてください");
        return;
      }
    }
    try {
      if (editing) {
        await updateRecord(editing.id, draft);
        toast.success("売上レコードを更新しました");
      } else {
        await addRecord(draft);
        const note =
          draft.revenueType === "stock" && !endEnabled
            ? "（毎月自動継続）"
            : "";
        toast.success(
          `${draft.year}/${draft.month} の ${draft.productName} を登録${note}`,
        );
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    }
  };

  const onDelete = async () => {
    if (!editing) return;
    if (!confirm("この売上レコードを削除します。よろしいですか？")) return;
    try {
      await deleteRecord(editing.id);
      toast.success("削除しました");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  // 年セレクタの選択肢: 現在年 ±2
  const nowYear = new Date().getFullYear();
  const yearOptions = [nowYear - 1, nowYear, nowYear + 1, nowYear + 2];

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
            {/* 商材 */}
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
                        onClick={() =>
                          setDraft({ ...draft, productName: p.name })
                        }
                        className="rounded-lg border px-2.5 py-2 text-[12px] transition"
                        style={{
                          background: active
                            ? "rgba(0,212,255,0.15)"
                            : "rgba(255,255,255,0.03)",
                          borderColor: active
                            ? "rgba(0,212,255,0.4)"
                            : "rgba(255,255,255,0.1)",
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

            {/* 売上区分 */}
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
                      onClick={() =>
                        setDraft({ ...draft, revenueType: t.key })
                      }
                      className="flex items-start gap-2.5 rounded-xl border p-3 text-left transition"
                      style={{
                        background: active
                          ? `${t.color}12`
                          : "rgba(255,255,255,0.02)",
                        borderColor: active
                          ? `${t.color}60`
                          : "rgba(255,255,255,0.1)",
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
                          style={{
                            color: active ? t.color : "rgba(255,255,255,0.7)",
                          }}
                        >
                          {t.label}
                        </div>
                        <div className="mt-0.5 text-[10px] text-white/40">
                          {t.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 個数 + 月 */}
            <div className="mb-5 grid grid-cols-2 gap-3">
              <label className="block">
                <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">
                  個数
                </div>
                <input
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={draft.quantity === 0 ? "" : draft.quantity}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      quantity:
                        e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                  placeholder="1"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] font-bold text-white outline-none focus:border-cyan/40"
                  required
                />
                {selectedProduct?.unitPrice && draft.quantity > 0 && (
                  <div className="mt-1 text-[10px] text-white/40">
                    単価 {fmtFull(selectedProduct.unitPrice)} × {draft.quantity}
                    個 = {fmtFull(autoAmount)}
                  </div>
                )}
              </label>
              <label className="block">
                <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">
                  {draft.revenueType === "stock" ? "開始月" : "計上月"}
                </div>
                <select
                  value={draft.month}
                  onChange={(e) =>
                    setDraft({ ...draft, month: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none focus:border-cyan/40"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m} className="bg-bg-panel">
                      {year}年 {m}月
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* 金額 */}
            <div className="mb-5">
              <label className="block">
                <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-white/40">
                  <span>
                    {draft.revenueType === "stock" ? "月額売上" : "売上金額"}
                    （円）
                  </span>
                  {amountTouched && autoAmount > 0 && autoAmount !== draft.amount && (
                    <button
                      type="button"
                      onClick={() => {
                        setAmountTouched(false);
                        setDraft({ ...draft, amount: autoAmount });
                      }}
                      className="rounded border border-cyan/30 bg-cyan/10 px-2 py-0.5 text-[10px] normal-case text-cyan"
                    >
                      単価 × 個数で自動計算
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={draft.amount === 0 ? "" : draft.amount}
                  onChange={(e) => {
                    setAmountTouched(true);
                    setDraft({
                      ...draft,
                      amount: e.target.value === "" ? 0 : Number(e.target.value),
                    });
                  }}
                  placeholder={autoAmount > 0 ? String(autoAmount) : "例: 300000"}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] font-bold text-white outline-none focus:border-cyan/40"
                  required
                />
                {draft.amount > 0 && (
                  <div className="mt-1 text-[10px] text-white/40">
                    {fmtFull(draft.amount)}
                    {draft.revenueType === "stock" && " / 月"}
                  </div>
                )}
              </label>
            </div>

            {/* ストックの解約月 */}
            {draft.revenueType === "stock" && (
              <div
                className="mb-5 rounded-xl border p-3.5"
                style={{
                  background: endEnabled
                    ? "rgba(255,107,107,0.04)"
                    : "rgba(0,229,160,0.05)",
                  borderColor: endEnabled
                    ? "rgba(255,107,107,0.25)"
                    : "rgba(0,229,160,0.25)",
                }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold">
                    {endEnabled ? (
                      <Calendar size={12} className="text-coral" />
                    ) : (
                      <Repeat size={12} className="text-mint" />
                    )}
                    <span
                      style={{
                        color: endEnabled ? "#FF6B6B" : "#00E5A0",
                      }}
                    >
                      {endEnabled ? "解約月を設定" : "毎月自動継続中"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEndEnabled((v) => !v)}
                    className="rounded-md border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[10px] font-bold text-white/70 hover:bg-white/[0.1]"
                  >
                    {endEnabled ? "継続中に戻す" : "解約月を入力"}
                  </button>
                </div>
                <div className="text-[10px] text-white/50">
                  {endEnabled
                    ? "指定した月までで売上計上が止まります（含む）"
                    : "解約月を設定するまで、毎月この金額が自動的に計上されます"}
                </div>
                {endEnabled && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <select
                      value={draft.endYear ?? draft.year}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          endYear: Number(e.target.value),
                        })
                      }
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[12px] text-white outline-none focus:border-coral/40"
                    >
                      {yearOptions.map((y) => (
                        <option key={y} value={y} className="bg-bg-panel">
                          {y}年
                        </option>
                      ))}
                    </select>
                    <select
                      value={draft.endMonth ?? draft.month}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          endMonth: Number(e.target.value),
                        })
                      }
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[12px] text-white outline-none focus:border-coral/40"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m} className="bg-bg-panel">
                          {m}月
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* 歩合 */}
            <div className="mb-5 rounded-xl border border-mint/20 bg-mint/[0.05] p-3.5">
              <div className="mb-2 flex items-center justify-between text-[10px]">
                <div className="uppercase tracking-wider text-mint/90">
                  💰 来月の支給歩合（{draft.revenueType === "stock" ? "1ヶ月あたり" : "単月"}）
                </div>
                <div className="text-white/40">{commissionLabel}</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={
                    draft.commissionAmount === 0 ? "" : draft.commissionAmount
                  }
                  onChange={(e) => {
                    setCommissionTouched(true);
                    setDraft({
                      ...draft,
                      commissionAmount:
                        e.target.value === "" ? 0 : Number(e.target.value),
                    });
                  }}
                  placeholder={autoCommission > 0 ? String(autoCommission) : "0"}
                  className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] font-bold text-mint outline-none focus:border-mint/40"
                />
                {commissionTouched &&
                  autoCommission !== draft.commissionAmount &&
                  autoCommission > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setCommissionTouched(false);
                        setDraft({
                          ...draft,
                          commissionAmount: autoCommission,
                        });
                      }}
                      className="rounded-lg border border-mint/30 bg-mint/10 px-2.5 py-2 text-[11px] text-mint hover:bg-mint/15"
                    >
                      自動計算
                    </button>
                  )}
              </div>
              {draft.commissionAmount > 0 && (
                <div className="mt-1 text-[10px] text-white/40">
                  {fmtFull(draft.commissionAmount)}
                  {draft.revenueType === "stock" && " / 月（継続中は毎月支給）"}
                  {commissionTouched && autoCommission !== draft.commissionAmount && (
                    <span className="ml-2 text-amber/80">
                      ⚠ 手動編集中（自動計算値: {fmtFull(autoCommission)}）
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* メモ */}
            <div className="mb-2">
              <label className="block">
                <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">
                  メモ
                </div>
                <textarea
                  value={draft.memo ?? ""}
                  onChange={(e) => setDraft({ ...draft, memo: e.target.value })}
                  rows={2}
                  placeholder="契約内容、顧客名、備考など"
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
                style={{
                  background: "linear-gradient(135deg, #00D4FF 0%, #7B5EA7 100%)",
                }}
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
