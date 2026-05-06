"use client";

import { useState } from "react";
import { Plus, Pencil, X } from "lucide-react";
import type { Customer, CustomerStatus } from "@/types";
import { RelationDots } from "@/components/common/RelationDots";
import { fmt } from "@/lib/utils";
import { useCustomers } from "@/lib/customer-store";
import { CustomerFormModal } from "./CustomerFormModal";

interface Props {
  userId: string;
  readonly?: boolean;
}

const STATUSES: (CustomerStatus | "全て")[] = ["全て", "既存", "商談中", "見込み"];

const statusStyle = (s: CustomerStatus) => {
  if (s === "既存") return { bg: "rgba(0,229,160,0.15)", color: "#00E5A0" };
  if (s === "商談中") return { bg: "rgba(255,184,48,0.15)", color: "#FFB830" };
  return { bg: "rgba(183,148,244,0.15)", color: "#B794F4" };
};

export function CRMPanel({ userId, readonly }: Props) {
  const { customers } = useCustomers(userId);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [filter, setFilter] = useState<(typeof STATUSES)[number]>("全て");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const filtered =
    filter === "全て" ? customers : customers.filter((c) => c.status === filter);

  const counts = {
    全て: customers.length,
    既存: customers.filter((c) => c.status === "既存").length,
    商談中: customers.filter((c) => c.status === "商談中").length,
    見込み: customers.filter((c) => c.status === "見込み").length,
  };

  // Keep selected in sync with both list mutations (edit/delete) and filter changes:
  // 選択中の顧客が現在のフィルタに含まれない場合は詳細パネルを閉じる
  const syncedSelected = selected
    ? filtered.find((c) => c.id === selected.id) ?? null
    : null;

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setFormOpen(true);
  };

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => {
            const active = filter === s;
            const count = counts[s];
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs transition-colors ${
                  active
                    ? "border-cyan bg-cyan/12 text-cyan"
                    : "border-white/15 bg-transparent text-white/50 hover:text-white/80"
                }`}
              >
                <span>{s}</span>
                <span
                  className="rounded-full px-1.5 text-[10px]"
                  style={{
                    background: active ? "rgba(0,212,255,0.2)" : "rgba(255,255,255,0.08)",
                    color: active ? "#00D4FF" : "rgba(255,255,255,0.6)",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        {!readonly && (
          <button
            onClick={openNew}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[12px] font-bold text-white shadow-[0_4px_16px_rgba(0,212,255,0.25)]"
            style={{ background: "linear-gradient(135deg, #00D4FF 0%, #7B5EA7 100%)" }}
          >
            <Plus size={13} />
            新規顧客
          </button>
        )}
      </div>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: syncedSelected ? "1fr 1fr" : "1fr" }}
      >
        <div>
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/7 bg-white/[0.02] py-12 text-center">
              <div className="mb-2 text-3xl">📇</div>
              <div className="text-[13px] text-white/50">
                {customers.length === 0
                  ? "まだ顧客が登録されていません"
                  : `「${filter}」のステータスの顧客はありません`}
              </div>
              {!readonly && customers.length === 0 && (
                <button
                  onClick={openNew}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-cyan/30 bg-cyan/10 px-3.5 py-1.5 text-[12px] font-bold text-cyan hover:bg-cyan/15"
                >
                  <Plus size={12} />
                  最初の顧客を登録
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((c) => {
                const isSel = syncedSelected?.id === c.id;
                const st = statusStyle(c.status);
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelected(isSel ? null : c)}
                    className={`cursor-pointer rounded-xl border px-4 py-3.5 transition-all ${
                      isSel
                        ? "border-cyan/30 bg-cyan/[0.08]"
                        : "border-white/7 bg-white/[0.04] hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold text-white">
                          {c.name}
                        </div>
                        <div className="mt-0.5 truncate text-[11px] text-white/40">
                          {c.contact || "—"} · {c.industry || "—"}
                        </div>
                      </div>
                      <span
                        className="flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px]"
                        style={{ background: st.bg, color: st.color }}
                      >
                        {c.status}
                      </span>
                    </div>
                    <RelationDots value={c.relation} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {syncedSelected && (
          <div
            className="rounded-2xl border p-5"
            style={{
              background: "rgba(0,212,255,0.04)",
              borderColor: "rgba(0,212,255,0.2)",
            }}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[15px] font-bold text-white">{syncedSelected.name}</div>
                <div className="mt-1 text-xs text-white/40">
                  担当: {syncedSelected.contact || "—"}
                </div>
                {syncedSelected.contactEmail && (
                  <div className="mt-0.5 text-[11px] text-white/40">
                    {syncedSelected.contactEmail}
                  </div>
                )}
                {syncedSelected.contactPhone && (
                  <div className="mt-0.5 text-[11px] text-white/40">
                    {syncedSelected.contactPhone}
                  </div>
                )}
              </div>
              <div className="flex gap-1.5">
                {!readonly && (
                  <button
                    onClick={() => openEdit(syncedSelected)}
                    className="flex items-center gap-1 rounded-lg border border-cyan/30 bg-cyan/10 px-2.5 py-1 text-[11px] text-cyan hover:bg-cyan/15"
                  >
                    <Pencil size={11} />
                    編集
                  </button>
                )}
                <button
                  onClick={() => setSelected(null)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3">
              {[
                { label: "業界", value: syncedSelected.industry || "—" },
                { label: "ステータス", value: syncedSelected.status },
                { label: "最終接触", value: syncedSelected.lastContact || "—" },
                { label: "年間売上", value: fmt(syncedSelected.revenue) },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-white/[0.05] p-3">
                  <div className="mb-1 text-[10px] text-white/40">{item.label}</div>
                  <div className="text-[13px] font-semibold text-white">{item.value}</div>
                </div>
              ))}
              <div
                className="col-span-2 rounded-xl border p-3"
                style={{
                  background: syncedSelected.nextAppointment
                    ? "rgba(255,184,48,0.08)"
                    : "rgba(255,255,255,0.03)",
                  borderColor: syncedSelected.nextAppointment
                    ? "rgba(255,184,48,0.3)"
                    : "rgba(255,255,255,0.07)",
                }}
              >
                <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-amber/80">
                  📅 次回アポ日
                </div>
                <div
                  className="text-[14px] font-bold"
                  style={{
                    color: syncedSelected.nextAppointment
                      ? "#FFB830"
                      : "rgba(255,255,255,0.3)",
                  }}
                >
                  {syncedSelected.nextAppointment || "未設定"}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="mb-2 text-[11px] text-white/40">関係値スコア</div>
              <RelationDots value={syncedSelected.relation} />
            </div>

            <div className="mb-4">
              <div className="mb-2 text-[11px] text-white/40">導入済み商材</div>
              {syncedSelected.products.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {syncedSelected.products.map((p) => (
                    <span
                      key={p}
                      className="rounded-lg border border-cyan/25 bg-cyan/12 px-2.5 py-1 text-xs text-cyan"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-white/30">未導入</div>
              )}
            </div>

            {syncedSelected.memo && (
              <div>
                <div className="mb-2 text-[11px] text-white/40">メモ</div>
                <div className="rounded-lg border border-white/7 bg-white/[0.02] px-3 py-2 text-[12px] leading-relaxed text-white/70 whitespace-pre-wrap">
                  {syncedSelected.memo}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <CustomerFormModal
        open={formOpen}
        ownerId={userId}
        editing={editing}
        onClose={() => setFormOpen(false)}
      />
    </div>
  );
}
