"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Package, X, Check } from "lucide-react";
import { toast } from "sonner";
import { useProducts } from "@/lib/products-store";
import type { Product } from "@/lib/products-store";
import { fmtFull } from "@/lib/utils";

export function ProductsTable() {
  const { allProducts, addProduct, updateProduct, deleteProduct } = useProducts(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const activeCount = allProducts.filter((p) => p.isActive).length;

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setFormOpen(true);
  };

  const toggleActive = (p: Product) => {
    updateProduct(p.id, { isActive: !p.isActive });
    toast.success(p.isActive ? `${p.name} を無効化` : `${p.name} を有効化`);
  };

  const onDelete = (p: Product) => {
    if (!confirm(`「${p.name}」を削除します。過去の売上・顧客紐付けは残りますが、ドロップダウンに表示されなくなります。`)) return;
    deleteProduct(p.id);
    toast.success(`${p.name} を削除しました`);
  };

  return (
    <div className="rounded-3xl border border-white/7 bg-white/[0.03] p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-white">商材マスタ</div>
          <div className="mt-0.5 text-[11px] text-white/40">
            CRM 登録 / 売上記録 / 売上マトリクスで選択できる商材を管理します
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="text-[11px] text-white/40">
            有効 {activeCount} / 全 {allProducts.length}
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-bold text-white shadow-[0_4px_16px_rgba(0,212,255,0.3)]"
            style={{ background: "linear-gradient(135deg, #00D4FF 0%, #7B5EA7 100%)" }}
          >
            <Plus size={13} />
            商材を追加
          </button>
        </div>
      </div>

      {allProducts.length === 0 ? (
        <div className="rounded-2xl border border-white/7 bg-white/[0.02] py-12 text-center">
          <Package size={32} className="mx-auto mb-3 text-white/20" />
          <div className="text-[13px] text-white/50">
            まだ商材が登録されていません
          </div>
          <button
            onClick={openNew}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-cyan/30 bg-cyan/10 px-3.5 py-1.5 text-[12px] font-bold text-cyan hover:bg-cyan/15"
          >
            <Plus size={12} />
            最初の商材を追加
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table
            className="w-full border-separate"
            style={{ borderSpacing: "0 6px" }}
          >
            <thead>
              <tr className="text-left text-[11px] text-white/40">
                <th className="px-3 pb-2">商材名</th>
                <th className="px-3 pb-2">区分</th>
                <th className="px-3 pb-2">標準単価</th>
                <th className="px-3 pb-2">状態</th>
                <th className="px-3 pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {allProducts.map((p) => (
                <tr key={p.id} className="bg-white/[0.03]">
                  <td className="rounded-l-xl px-3 py-3">
                    <div className="text-[13px] font-semibold text-white">
                      {p.name}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs text-white/60">{p.category || "—"}</span>
                  </td>
                  <td className="px-3 py-3 text-xs text-white/60">
                    {p.unitPrice ? fmtFull(p.unitPrice) : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => toggleActive(p)}
                      className="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] transition"
                      style={{
                        background: p.isActive ? "rgba(0,229,160,0.15)" : "rgba(255,255,255,0.05)",
                        borderColor: p.isActive ? "rgba(0,229,160,0.3)" : "rgba(255,255,255,0.1)",
                        color: p.isActive ? "#00E5A0" : "rgba(255,255,255,0.4)",
                      }}
                    >
                      <div
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: p.isActive ? "#00E5A0" : "rgba(255,255,255,0.3)" }}
                      />
                      {p.isActive ? "有効" : "無効"}
                    </button>
                  </td>
                  <td className="rounded-r-xl px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEdit(p)}
                        className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-white/60 hover:border-cyan/30 hover:text-cyan"
                      >
                        <Pencil size={10} />
                        編集
                      </button>
                      <button
                        onClick={() => onDelete(p)}
                        className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-white/60 hover:border-coral/30 hover:text-coral"
                      >
                        <Trash2 size={10} />
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProductFormModal
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={(data) => {
          if (editing) {
            updateProduct(editing.id, data);
            toast.success(`${data.name ?? editing.name} を更新`);
          } else {
            addProduct(data.name!, data.category, data.unitPrice);
            toast.success(`${data.name} を登録`);
          }
          setFormOpen(false);
        }}
      />
    </div>
  );
}

interface FormProps {
  open: boolean;
  editing: Product | null;
  onClose: () => void;
  onSubmit: (data: Partial<Product>) => void;
}

const CATEGORIES = ["ストック", "ショット", "両方", "その他"];

function ProductFormModal({ open, editing, onClose, onSubmit }: FormProps) {
  const [name, setName] = useState(editing?.name ?? "");
  const [category, setCategory] = useState(editing?.category ?? "");
  const [unitPrice, setUnitPrice] = useState(editing?.unitPrice ?? 0);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setCategory(editing.category ?? "");
      setUnitPrice(editing.unitPrice ?? 0);
    } else {
      setName("");
      setCategory("");
      setUnitPrice(0);
    }
  }, [open, editing]);

  if (!open) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), category: category || undefined, unitPrice: unitPrice || undefined });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)" }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md animate-fade-up rounded-3xl border border-cyan/20 bg-bg-panel p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.15em] text-cyan/70">
              {editing ? "Edit Product" : "New Product"}
            </div>
            <h2 className="text-lg font-extrabold">
              {editing ? "商材を編集" : "商材を追加"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
          >
            <X size={13} />
          </button>
        </div>

        <label className="mb-3 block">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">
            商材名 *
          </div>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 新商材X"
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none focus:border-cyan/40"
          />
        </label>

        <label className="mb-3 block">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">
            区分
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCategory(active ? "" : c)}
                  className="rounded-lg border px-2.5 py-1 text-[12px] transition"
                  style={{
                    background: active ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.02)",
                    borderColor: active ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.1)",
                    color: active ? "#00D4FF" : "rgba(255,255,255,0.55)",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </label>

        <label className="mb-5 block">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">
            標準単価（円・任意）
          </div>
          <input
            type="number"
            min={0}
            step={1000}
            value={unitPrice}
            onChange={(e) => setUnitPrice(Number(e.target.value))}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none focus:border-cyan/40"
          />
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 px-4 py-2 text-[12px] text-white/70 hover:bg-white/[0.05]"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-[12px] font-bold text-white shadow-[0_4px_20px_rgba(0,212,255,0.3)]"
            style={{ background: "linear-gradient(135deg, #00D4FF 0%, #7B5EA7 100%)" }}
          >
            <Check size={13} />
            {editing ? "更新" : "登録"}
          </button>
        </div>
      </form>
    </div>
  );
}
