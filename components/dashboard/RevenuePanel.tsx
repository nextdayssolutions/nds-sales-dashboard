"use client";

import { Fragment, useMemo, useState } from "react";
import { Plus, Target, Zap, Package, Pencil, X, Repeat } from "lucide-react";
import type { RevenueType, SalesRecord } from "@/types";
import { useUser } from "@/lib/user-store";
import { useSalesRecords, useRevenueTargets } from "@/lib/sales-store";
import { useProducts } from "@/lib/products-store";
import { CURRENT_YEAR } from "@/lib/metrics";
import {
  isActiveInMonth,
  isOpenSubscription,
} from "@/lib/sales-recurrence";
import { fmt, fmtFull } from "@/lib/utils";
import { SalesRecordFormModal } from "./SalesRecordFormModal";
import { TargetEditModal } from "./TargetEditModal";

interface Props {
  userId: string;
  readonly?: boolean;
}

const PRODUCT_COLOR_PALETTE = [
  "#00D4FF",
  "#B794F4",
  "#00E5A0",
  "#FFB830",
  "#FF6B6B",
  "#7B5EA7",
  "#4BD1A0",
];
function productColor(index: number): string {
  return PRODUCT_COLOR_PALETTE[index % PRODUCT_COLOR_PALETTE.length];
}

const TYPE_META: Record<
  RevenueType,
  { label: string; color: string; icon: typeof Zap }
> = {
  stock: { label: "ストック", color: "#00E5A0", icon: Zap },
  shot: { label: "ショット", color: "#FFB830", icon: Package },
};

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

interface CellKey {
  productName: string;
  revenueType: RevenueType;
  month: number;
}

export function RevenuePanel({ userId, readonly }: Props) {
  const user = useUser(userId);
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  // 年全体の過去履歴（年セレクタの選択肢を作るため）。user のすべての売上を 1 度取得
  const { records: allRecords } = useSalesRecords(userId);
  const { records } = useSalesRecords(userId, selectedYear);
  const { targets } = useRevenueTargets(userId, selectedYear);
  const { products } = useProducts();
  const productNames = products.map((p) => p.name);

  const availableYears = useMemo(() => {
    const set = new Set<number>([CURRENT_YEAR]);
    for (const r of allRecords) set.add(r.year);
    return Array.from(set).sort((a, b) => b - a);
  }, [allRecords]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SalesRecord | null>(null);
  const [prefill, setPrefill] = useState<Partial<CellKey> | undefined>(undefined);
  const [targetOpen, setTargetOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<CellKey | null>(null);
  const isCurrentYear = selectedYear === CURRENT_YEAR;

  const aggregates = useMemo(() => {
    // 登録済商材 + レコードに出現する過去商材（削除された商材も表示するため）
    const historicalNames = Array.from(new Set(records.map((r) => r.productName)));
    const allNames = Array.from(new Set([...productNames, ...historicalNames]));
    const byCell: Record<string, Record<RevenueType, Record<number, number>>> = {};
    for (const p of allNames) {
      byCell[p] = { stock: {}, shot: {} };
      for (const m of MONTHS) {
        byCell[p].stock[m] = 0;
        byCell[p].shot[m] = 0;
      }
    }
    // ストック自動継続を unfold しながら集計
    for (const r of records) {
      if (!byCell[r.productName]) {
        byCell[r.productName] = { stock: {}, shot: {} };
        for (const m of MONTHS) {
          byCell[r.productName].stock[m] = 0;
          byCell[r.productName].shot[m] = 0;
        }
      }
      for (const m of MONTHS) {
        if (isActiveInMonth(r, selectedYear, m)) {
          byCell[r.productName][r.revenueType][m] =
            (byCell[r.productName][r.revenueType][m] ?? 0) + r.amount;
        }
      }
    }
    const monthTotals: Record<number, number> = {};
    const productTotals: Record<
      string,
      { stock: number; shot: number; total: number }
    > = {};
    let yearTotal = 0;
    let stockYear = 0;
    let shotYear = 0;
    for (const p of allNames) {
      productTotals[p] = { stock: 0, shot: 0, total: 0 };
      for (const m of MONTHS) {
        const s = byCell[p].stock[m];
        const sh = byCell[p].shot[m];
        monthTotals[m] = (monthTotals[m] ?? 0) + s + sh;
        productTotals[p].stock += s;
        productTotals[p].shot += sh;
        productTotals[p].total += s + sh;
        yearTotal += s + sh;
        stockYear += s;
        shotYear += sh;
      }
    }

    // 商材ごとに表示する区分を決定。
    // 商材マスタに category があればそれに従う（例: ストック → stock のみ）。
    // ただし過去レコードが反対区分に存在するときはそのデータを隠さないよう両方表示する。
    const typesByProduct: Record<string, RevenueType[]> = {};
    for (const p of allNames) {
      const product = products.find((prod) => prod.name === p);
      const hasStock = productTotals[p].stock > 0;
      const hasShot = productTotals[p].shot > 0;
      if (product?.category === "ストック" && !hasShot) {
        typesByProduct[p] = ["stock"];
      } else if (product?.category === "ショット" && !hasStock) {
        typesByProduct[p] = ["shot"];
      } else {
        typesByProduct[p] = ["stock", "shot"];
      }
    }

    return {
      byCell,
      monthTotals,
      productTotals,
      typesByProduct,
      yearTotal,
      stockYear,
      shotYear,
      allNames,
    };
  }, [records, productNames, products]);

  const yearTarget = Object.values(targets.monthly).reduce((a, b) => a + b, 0);
  const achievement =
    yearTarget > 0 ? (aggregates.yearTotal / yearTarget) * 100 : 0;
  const remaining = Math.max(0, yearTarget - aggregates.yearTotal);
  const currentMonth = new Date().getMonth() + 1;
  const remainingMonths = Math.max(1, 12 - currentMonth + 1);
  const pace = Math.round(remaining / remainingMonths);

  // 歩合合計 — ストックは active な月数 × 月額歩合、shot はそのままの値
  const monthCommission = records.reduce(
    (s, r) =>
      isActiveInMonth(r, selectedYear, currentMonth)
        ? s + (r.commissionAmount ?? 0)
        : s,
    0,
  );
  const yearCommission = records.reduce((s, r) => {
    const c = r.commissionAmount ?? 0;
    if (r.revenueType === "shot") {
      return r.year === selectedYear ? s + c : s;
    }
    let activeMonths = 0;
    for (const m of MONTHS) {
      if (isActiveInMonth(r, selectedYear, m)) activeMonths++;
    }
    return s + activeMonths * c;
  }, 0);

  const openNew = () => {
    setEditing(null);
    setPrefill(undefined);
    setFormOpen(true);
  };

  const openCellClick = (c: CellKey) => {
    if (readonly) return;
    setSelectedCell((prev) =>
      prev?.productName === c.productName &&
      prev.revenueType === c.revenueType &&
      prev.month === c.month
        ? null
        : c
    );
  };

  const openEdit = (r: SalesRecord) => {
    setEditing(r);
    setPrefill(undefined);
    setFormOpen(true);
  };

  const addToCell = (c: CellKey) => {
    setEditing(null);
    setPrefill(c);
    setFormOpen(true);
  };

  // セル詳細: その月にアクティブな全レコード（ストック自動継続を含む）を表示
  const cellRecords = selectedCell
    ? records.filter(
        (r) =>
          r.productName === selectedCell.productName &&
          r.revenueType === selectedCell.revenueType &&
          isActiveInMonth(r, selectedYear, selectedCell.month),
      )
    : [];

  return (
    <div>
      {/* ── サマリーヘッダー ─────────────────────────── */}
      <div
        className="mb-5 rounded-2xl border border-cyan/15 p-5"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,212,255,0.05), rgba(183,148,244,0.04))",
        }}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-[0.15em] text-cyan/70">
              Sales Management · {selectedYear}
              {!isCurrentYear && (
                <span className="ml-2 rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-white/60">
                  過去年閲覧中
                </span>
              )}
            </div>
            <div className="text-[18px] font-bold text-white">
              {user?.name ?? "—"} の売上
            </div>
            <div className="mt-0.5 text-[11px] text-white/50">
              商材 × 月 のマトリクスで管理（ストック / ショット）
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-[12px] font-bold text-white outline-none focus:border-cyan/40"
              title="年を切り替えて過去実績を閲覧"
            >
              {availableYears.map((y) => (
                <option key={y} value={y} className="bg-bg-panel">
                  {y}年
                </option>
              ))}
            </select>
            {!readonly && isCurrentYear && (
              <>
                <button
                  onClick={() => setTargetOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-amber/30 bg-amber/10 px-3.5 py-2 text-[12px] font-bold text-amber hover:bg-amber/15"
                >
                  <Target size={13} />
                  目標を編集
                </button>
                <button
                  onClick={openNew}
                  className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-bold text-white shadow-[0_4px_16px_rgba(0,212,255,0.3)]"
                  style={{
                    background: "linear-gradient(135deg, #00D4FF 0%, #7B5EA7 100%)",
                  }}
                >
                  <Plus size={13} />
                  売上を記録
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            {
              label: "年間目標",
              value: yearTarget > 0 ? fmtFull(yearTarget) : "未設定",
              color: "rgba(255,255,255,0.85)",
            },
            {
              label: "現在実績",
              value: fmtFull(aggregates.yearTotal),
              color: "#00D4FF",
            },
            {
              label: "年間達成率",
              value: yearTarget > 0 ? `${achievement.toFixed(1)}%` : "—",
              color:
                achievement >= 100
                  ? "#00E5A0"
                  : achievement >= 70
                  ? "#00D4FF"
                  : "#FFB830",
            },
            {
              label: remaining > 0 ? `残り（月平均）` : "達成済み",
              value:
                remaining > 0
                  ? `${fmtFull(remaining)} / ${fmt(pace)}`
                  : fmtFull(0),
              color: remaining > 0 ? "#FF6B6B" : "#00E5A0",
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl border border-white/7 bg-white/[0.04] px-3 py-2.5"
            >
              <div className="mb-1 text-[10px] text-white/40">{kpi.label}</div>
              <div
                className="text-[14px] font-extrabold tracking-tight"
                style={{ color: kpi.color }}
              >
                {kpi.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 歩合（コミッション）サマリー ──────────────── */}
      {(monthCommission > 0 || yearCommission > 0) && (
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div
            className="rounded-xl border p-3.5"
            style={{
              background: "rgba(0,229,160,0.06)",
              borderColor: "rgba(0,229,160,0.25)",
            }}
          >
            <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-mint/90">
              💰 {isCurrentYear ? "来月の支給歩合（今月分）" : `${selectedYear}年 ${currentMonth}月分の支給歩合`}
            </div>
            <div className="text-[18px] font-extrabold text-mint">
              {fmtFull(monthCommission)}
            </div>
            <div className="mt-0.5 text-[10px] text-white/40">
              商材の歩合率 × 売上から自動計算
            </div>
          </div>
          <div
            className="rounded-xl border p-3.5"
            style={{
              background: "rgba(0,229,160,0.04)",
              borderColor: "rgba(0,229,160,0.18)",
            }}
          >
            <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-mint/80">
              {selectedYear}年 累計歩合
            </div>
            <div className="text-[18px] font-extrabold text-mint">
              {fmtFull(yearCommission)}
            </div>
            <div className="mt-0.5 text-[10px] text-white/40">
              1月〜12月までの合算
            </div>
          </div>
        </div>
      )}

      {/* ── ストック vs ショット ──────────────────── */}
      {aggregates.yearTotal > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3">
          <RatioCard
            label="ストック売上"
            value={aggregates.stockYear}
            total={aggregates.yearTotal}
            type="stock"
          />
          <RatioCard
            label="ショット売上"
            value={aggregates.shotYear}
            total={aggregates.yearTotal}
            type="shot"
          />
        </div>
      )}

      {/* ── 商材 × 月 マトリクス ──────────────────── */}
      <div className="mb-5 overflow-x-auto rounded-2xl border border-white/7 bg-white/[0.02]">
        <table className="w-full text-[11px]" style={{ borderCollapse: "collapse" }}>
          <thead className="bg-white/[0.03]">
            <tr className="text-white/40">
              <th className="sticky left-0 z-10 bg-white/[0.03] px-3 py-2.5 text-left font-normal">
                商材
              </th>
              <th className="px-2 py-2.5 text-left font-normal">区分</th>
              {MONTHS.map((m) => (
                <th
                  key={m}
                  className={`min-w-[54px] px-1.5 py-2.5 text-right font-normal ${
                    m === currentMonth ? "text-cyan" : ""
                  }`}
                >
                  {m}月
                </th>
              ))}
              <th className="min-w-[70px] px-2.5 py-2.5 text-right font-bold text-white/70">
                年間
              </th>
            </tr>
          </thead>
          <tbody>
            {aggregates.allNames.map((p, i) => {
              const pColor = productColor(i);
              const pTotal = aggregates.productTotals[p];
              const typesToShow = aggregates.typesByProduct[p];
              return (
                <Fragment key={p}>
                  {typesToShow.map((type, idx) => {
                    const typeMeta = TYPE_META[type];
                    const Icon = typeMeta.icon;
                    const yearSub =
                      type === "stock" ? pTotal.stock : pTotal.shot;
                    return (
                      <tr
                        key={`${p}-${type}`}
                        className={`border-t ${
                          idx === 0 ? "border-white/7" : "border-white/[0.03]"
                        }`}
                      >
                        {idx === 0 && (
                          <td
                            rowSpan={typesToShow.length}
                            className="sticky left-0 z-[1] border-r border-white/7 bg-bg-panel/70 px-3 py-2 align-middle"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2 w-2 flex-shrink-0 rounded-full"
                                style={{ background: pColor }}
                              />
                              <div
                                className="text-[12px] font-semibold"
                                style={{ color: pColor }}
                              >
                                {p}
                              </div>
                            </div>
                            <div className="mt-1 text-[10px] text-white/40">
                              {fmt(pTotal.total)}
                            </div>
                          </td>
                        )}
                        <td className="border-r border-white/5 px-2 py-1.5 whitespace-nowrap">
                          <div
                            className="flex items-center gap-1 text-[10px]"
                            style={{ color: typeMeta.color }}
                          >
                            <Icon size={10} />
                            {typeMeta.label}
                          </div>
                        </td>
                        {MONTHS.map((m) => {
                          const cell: CellKey = {
                            productName: p,
                            revenueType: type,
                            month: m,
                          };
                          const amt = aggregates.byCell[p][type][m] ?? 0;
                          const isSel =
                            selectedCell?.productName === p &&
                            selectedCell.revenueType === type &&
                            selectedCell.month === m;
                          return (
                            <td
                              key={m}
                              onClick={() => openCellClick(cell)}
                              className={`px-1.5 py-1.5 text-right transition-colors ${
                                readonly
                                  ? ""
                                  : "cursor-pointer hover:bg-white/[0.04]"
                              } ${isSel ? "bg-cyan/10" : ""}`}
                              style={{
                                color: amt > 0 ? "#fff" : "rgba(255,255,255,0.2)",
                              }}
                            >
                              {amt > 0 ? (
                                <span className="text-[11px] font-semibold">
                                  {fmt(amt)}
                                </span>
                              ) : (
                                <span className="text-[10px]">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td
                          className="border-l border-white/5 bg-white/[0.03] px-2.5 py-1.5 text-right"
                          style={{ color: typeMeta.color, fontWeight: 700 }}
                        >
                          {yearSub > 0 ? fmt(yearSub) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-white/10 bg-white/[0.04]">
              <td
                className="sticky left-0 z-[1] bg-white/[0.04] px-3 py-2.5 text-[11px] font-bold text-white"
                colSpan={2}
              >
                月合計
              </td>
              {MONTHS.map((m) => (
                <td
                  key={m}
                  className="px-1.5 py-2 text-right text-[11px] font-bold text-white"
                >
                  {aggregates.monthTotals[m] > 0
                    ? fmt(aggregates.monthTotals[m])
                    : "—"}
                </td>
              ))}
              <td className="px-2.5 py-2 text-right text-[12px] font-extrabold text-cyan">
                {fmt(aggregates.yearTotal)}
              </td>
            </tr>
            <tr className="bg-white/[0.02]">
              <td
                className="sticky left-0 z-[1] bg-white/[0.02] px-3 py-1.5 text-[10px] text-amber"
                colSpan={2}
              >
                目標
              </td>
              {MONTHS.map((m) => (
                <td
                  key={m}
                  className="px-1.5 py-1.5 text-right text-[10px] text-amber/80"
                >
                  {targets.monthly[m] > 0 ? fmt(targets.monthly[m]) : "—"}
                </td>
              ))}
              <td className="px-2.5 py-1.5 text-right text-[11px] font-bold text-amber">
                {yearTarget > 0 ? fmt(yearTarget) : "—"}
              </td>
            </tr>
            <tr className="bg-white/[0.02]">
              <td
                className="sticky left-0 z-[1] bg-white/[0.02] px-3 py-1.5 text-[10px] text-white/50"
                colSpan={2}
              >
                達成率
              </td>
              {MONTHS.map((m) => {
                const tgt = targets.monthly[m] ?? 0;
                const act = aggregates.monthTotals[m] ?? 0;
                if (tgt === 0 && act === 0) {
                  return (
                    <td key={m} className="px-1.5 py-1.5 text-right text-[10px] text-white/20">
                      —
                    </td>
                  );
                }
                const pct = tgt > 0 ? Math.round((act / tgt) * 100) : 0;
                const color =
                  pct >= 100 ? "#00E5A0" : pct >= 70 ? "#00D4FF" : "#FFB830";
                return (
                  <td
                    key={m}
                    className="px-1.5 py-1.5 text-right text-[10px] font-bold"
                    style={{ color }}
                  >
                    {pct}%
                  </td>
                );
              })}
              <td
                className="px-2.5 py-1.5 text-right text-[11px] font-extrabold"
                style={{
                  color:
                    achievement >= 100
                      ? "#00E5A0"
                      : achievement >= 70
                      ? "#00D4FF"
                      : "#FFB830",
                }}
              >
                {yearTarget > 0 ? `${achievement.toFixed(1)}%` : "—"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── セル詳細 ─────────────────────────────── */}
      {selectedCell && (
        <div
          className="mb-5 rounded-2xl border border-cyan/20 bg-cyan/[0.04] p-4 animate-fade-up"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-wider text-cyan/70">
                {selectedCell.month}月 · {selectedCell.productName} ·{" "}
                {TYPE_META[selectedCell.revenueType].label}
              </div>
              <div className="text-[13px] font-bold text-white">
                明細 {cellRecords.length} 件 · 合計{" "}
                {fmt(cellRecords.reduce((s, r) => s + r.amount, 0))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!readonly && (
                <button
                  onClick={() => addToCell(selectedCell)}
                  className="flex items-center gap-1 rounded-lg border border-cyan/30 bg-cyan/10 px-2.5 py-1 text-[11px] text-cyan hover:bg-cyan/15"
                >
                  <Plus size={11} />
                  追加
                </button>
              )}
              <button
                onClick={() => setSelectedCell(null)}
                className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
              >
                <X size={12} />
              </button>
            </div>
          </div>
          {cellRecords.length === 0 ? (
            <div className="py-4 text-center text-[12px] text-white/40">
              このセルに明細はありません
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {cellRecords.map((r) => {
                const isStock = r.revenueType === "stock";
                const isOpen = isOpenSubscription(r);
                const startedAt = `${r.year}/${r.month}`;
                const endedAt =
                  r.endYear != null && r.endMonth != null
                    ? `${r.endYear}/${r.endMonth}`
                    : null;
                return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-lg border border-white/7 bg-white/[0.02] px-3 py-2"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-white">
                        {fmtFull(r.amount)}
                      </span>
                      {r.quantity > 1 && (
                        <span className="text-[10px] text-white/45">
                          × {r.quantity}個
                        </span>
                      )}
                      {isStock && isOpen && (
                        <span className="flex items-center gap-1 rounded-full border border-mint/30 bg-mint/10 px-1.5 py-0.5 text-[9px] font-bold text-mint">
                          <Repeat size={9} />
                          継続中（{startedAt}〜）
                        </span>
                      )}
                      {isStock && !isOpen && endedAt && (
                        <span className="rounded-full border border-coral/30 bg-coral/10 px-1.5 py-0.5 text-[9px] font-bold text-coral">
                          {startedAt}〜{endedAt}
                        </span>
                      )}
                    </div>
                    {r.memo && (
                      <div className="mt-0.5 text-[10px] text-white/40">
                        {r.memo}
                      </div>
                    )}
                  </div>
                  {!readonly && (
                    <button
                      onClick={() => openEdit(r)}
                      className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-white/60 hover:border-cyan/30 hover:text-cyan"
                    >
                      <Pencil size={10} />
                      編集
                    </button>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {records.length === 0 && !readonly && (
        <div className="rounded-2xl border border-white/7 bg-white/[0.02] py-10 text-center">
          <div className="mb-2 text-3xl">💰</div>
          <div className="text-[13px] text-white/60">
            まだ売上レコードがありません
          </div>
          <button
            onClick={openNew}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-cyan/30 bg-cyan/10 px-3.5 py-1.5 text-[12px] font-bold text-cyan hover:bg-cyan/15"
          >
            <Plus size={12} />
            最初の売上を記録
          </button>
        </div>
      )}

      <SalesRecordFormModal
        open={formOpen}
        ownerId={userId}
        year={selectedYear}
        editing={editing}
        prefill={prefill}
        onClose={() => setFormOpen(false)}
      />
      <TargetEditModal
        open={targetOpen}
        ownerId={userId}
        year={selectedYear}
        onClose={() => setTargetOpen(false)}
      />
    </div>
  );
}

function RatioCard({
  label,
  value,
  total,
  type,
}: {
  label: string;
  value: number;
  total: number;
  type: RevenueType;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  return (
    <div
      className="rounded-xl border p-3"
      style={{ background: `${meta.color}0D`, borderColor: `${meta.color}25` }}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5" style={{ color: meta.color }}>
          <Icon size={12} />
          <span className="text-[11px] font-bold">{label}</span>
        </div>
        <div className="text-[11px] font-bold" style={{ color: meta.color }}>
          {pct}%
        </div>
      </div>
      <div className="text-[15px] font-extrabold text-white">{fmtFull(value)}</div>
      <div className="mt-2 h-1.5 overflow-hidden rounded bg-white/[0.08]">
        <div
          className="h-full transition-all"
          style={{ width: `${pct}%`, background: meta.color }}
        />
      </div>
    </div>
  );
}
