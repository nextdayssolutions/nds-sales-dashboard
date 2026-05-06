import type { SalesRecord } from "@/types";

/**
 * ストック自動継続のロジックを 1 箇所に集約。
 *
 * shot レコード: (year, month) の単月のみアクティブ
 * stock レコード: (year, month) 〜 (endYear, endMonth) または無限大までアクティブ
 *
 * 全画面・集計でこのヘルパーを使うことで挙動を統一する。
 */

/** 年月を月数に正規化（年12 + 月で比較できる連続値） */
function ym(year: number, month: number): number {
  return year * 12 + month;
}

/** ストックレコードが「継続中」か (= 解約月が未設定) */
export function isOpenSubscription(r: SalesRecord): boolean {
  return r.revenueType === "stock" && r.endYear == null && r.endMonth == null;
}

/** レコードが指定 (year, month) で計上対象になるか */
export function isActiveInMonth(
  r: SalesRecord,
  year: number,
  month: number,
): boolean {
  const target = ym(year, month);
  const start = ym(r.year, r.month);
  if (target < start) return false;

  if (r.revenueType === "shot") {
    // shot は単月のみ
    return target === start;
  }

  // stock: end が無ければ無限延長、あればその月まで
  if (r.endYear != null && r.endMonth != null) {
    const end = ym(r.endYear, r.endMonth);
    return target <= end;
  }
  return true;
}

/** レコードが指定年内で active な月のリスト (1-12) を返す */
export function activeMonthsInYear(r: SalesRecord, year: number): number[] {
  const months: number[] = [];
  for (let m = 1; m <= 12; m++) {
    if (isActiveInMonth(r, year, m)) months.push(m);
  }
  return months;
}

/** 指定 (year, month) における該当ユーザーの売上合計 */
export function sumActiveAmount(
  records: SalesRecord[],
  year: number,
  month: number,
): number {
  return records.reduce(
    (s, r) => (isActiveInMonth(r, year, month) ? s + r.amount : s),
    0,
  );
}

/** 指定 (year, month) における該当ユーザーの歩合合計 */
export function sumActiveCommission(
  records: SalesRecord[],
  year: number,
  month: number,
): number {
  return records.reduce(
    (s, r) =>
      isActiveInMonth(r, year, month) ? s + (r.commissionAmount ?? 0) : s,
    0,
  );
}

/** 年内 12 ヶ月分の売上合計（stock の継続を unfold） */
export function sumYearAmount(records: SalesRecord[], year: number): number {
  let total = 0;
  for (const r of records) {
    if (r.revenueType === "shot") {
      if (r.year === year) total += r.amount;
    } else {
      total += activeMonthsInYear(r, year).length * r.amount;
    }
  }
  return total;
}

/** 年内 12 ヶ月分の歩合合計 */
export function sumYearCommission(
  records: SalesRecord[],
  year: number,
): number {
  let total = 0;
  for (const r of records) {
    const c = r.commissionAmount ?? 0;
    if (r.revenueType === "shot") {
      if (r.year === year) total += c;
    } else {
      total += activeMonthsInYear(r, year).length * c;
    }
  }
  return total;
}
