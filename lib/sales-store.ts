"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RevenueTargets, RevenueType, SalesRecord } from "@/types";
import { createClient } from "@/lib/supabase/client";

// ─── 売上レコード ──────────────────────────────

interface SalesRecordRow {
  id: string;
  owner_id: string;
  customer_id: string | null;
  product_name: string;
  revenue_type: RevenueType;
  amount: number;
  commission_amount: number;
  year: number;
  month: number;
  memo: string | null;
  recorded_at: string;
}

function rowToRecord(row: SalesRecordRow): SalesRecord {
  return {
    id: row.id,
    ownerId: row.owner_id,
    customerId: row.customer_id ?? undefined,
    productName: row.product_name,
    revenueType: row.revenue_type,
    amount: row.amount,
    commissionAmount: row.commission_amount ?? 0,
    year: row.year,
    month: row.month,
    memo: row.memo ?? undefined,
    recordedAt: row.recorded_at,
  };
}

function recordToInsert(r: Omit<SalesRecord, "id" | "recordedAt">) {
  return {
    owner_id: r.ownerId,
    customer_id: r.customerId ?? null,
    product_name: r.productName,
    revenue_type: r.revenueType,
    amount: r.amount,
    commission_amount: r.commissionAmount ?? 0,
    year: r.year,
    month: r.month,
    memo: r.memo ?? null,
  };
}

function recordToUpdate(patch: Partial<SalesRecord>) {
  const out: Record<string, unknown> = {};
  if (patch.ownerId !== undefined) out.owner_id = patch.ownerId;
  if (patch.customerId !== undefined) out.customer_id = patch.customerId ?? null;
  if (patch.productName !== undefined) out.product_name = patch.productName;
  if (patch.revenueType !== undefined) out.revenue_type = patch.revenueType;
  if (patch.amount !== undefined) out.amount = patch.amount;
  if (patch.commissionAmount !== undefined)
    out.commission_amount = patch.commissionAmount;
  if (patch.year !== undefined) out.year = patch.year;
  if (patch.month !== undefined) out.month = patch.month;
  if (patch.memo !== undefined) out.memo = patch.memo ?? null;
  return out;
}

const RECORDS_EVENT = "sales-updated";
const TARGETS_EVENT = "targets-updated";

function emit(name: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(name));
  }
}

async function fetchRecords(): Promise<SalesRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sales_records")
    .select(
      "id, owner_id, customer_id, product_name, revenue_type, amount, commission_amount, year, month, memo, recorded_at",
    )
    .order("recorded_at", { ascending: false });
  if (error) {
    console.error("sales_records fetch failed", error);
    return [];
  }
  return (data ?? []).map((r) => rowToRecord(r as SalesRecordRow));
}

export function useSalesRecords(ownerId?: string, year?: number) {
  const [all, setAll] = useState<SalesRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const data = await fetchRecords();
      if (!cancelled) setAll(data);
    };
    load();
    const handler = () => load();
    window.addEventListener(RECORDS_EVENT, handler);
    return () => {
      cancelled = true;
      window.removeEventListener(RECORDS_EVENT, handler);
    };
  }, []);

  const records = useMemo(() => {
    return all.filter((r) => {
      if (ownerId !== undefined && r.ownerId !== ownerId) return false;
      if (year !== undefined && r.year !== year) return false;
      return true;
    });
  }, [all, ownerId, year]);

  const addRecord = useCallback(
    async (data: Omit<SalesRecord, "id" | "recordedAt">) => {
      const supabase = createClient();
      const { data: inserted, error } = await supabase
        .from("sales_records")
        .insert(recordToInsert(data))
        .select(
          "id, owner_id, customer_id, product_name, revenue_type, amount, commission_amount, year, month, memo, recorded_at",
        )
        .single();
      if (error) {
        console.error("sales insert failed", error);
        throw error;
      }
      emit(RECORDS_EVENT);
      return inserted ? rowToRecord(inserted as SalesRecordRow) : null;
    },
    [],
  );

  const updateRecord = useCallback(
    async (id: string, patch: Partial<SalesRecord>) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("sales_records")
        .update(recordToUpdate(patch))
        .eq("id", id);
      if (error) {
        console.error("sales update failed", error);
        throw error;
      }
      emit(RECORDS_EVENT);
    },
    [],
  );

  const deleteRecord = useCallback(async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("sales_records").delete().eq("id", id);
    if (error) {
      console.error("sales delete failed", error);
      throw error;
    }
    emit(RECORDS_EVENT);
  }, []);

  return { records, addRecord, updateRecord, deleteRecord };
}

// ─── 月次目標 ──────────────────────────────────

interface TargetRow {
  owner_id: string;
  year: number;
  month: number;
  amount: number;
}

function rowsToTargets(
  rows: TargetRow[],
  ownerId: string,
  year: number,
): RevenueTargets {
  const monthly: Record<number, number> = {};
  for (let m = 1; m <= 12; m++) monthly[m] = 0;
  for (const r of rows) {
    if (r.owner_id === ownerId && r.year === year) {
      monthly[r.month] = r.amount;
    }
  }
  return { ownerId, year, monthly };
}

async function fetchTargets(year?: number): Promise<TargetRow[]> {
  const supabase = createClient();
  let q = supabase.from("revenue_targets").select("owner_id, year, month, amount");
  if (year !== undefined) q = q.eq("year", year);
  const { data, error } = await q;
  if (error) {
    console.error("revenue_targets fetch failed", error);
    return [];
  }
  return (data ?? []) as TargetRow[];
}

const defaultTargets = (ownerId: string, year: number): RevenueTargets => ({
  ownerId,
  year,
  monthly: Object.fromEntries(
    Array.from({ length: 12 }, (_, i) => [i + 1, 0]),
  ) as Record<number, number>,
});

export function useRevenueTargets(ownerId: string | undefined, year: number) {
  const [rows, setRows] = useState<TargetRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const data = await fetchTargets(year);
      if (!cancelled) setRows(data);
    };
    load();
    const handler = () => load();
    window.addEventListener(TARGETS_EVENT, handler);
    return () => {
      cancelled = true;
      window.removeEventListener(TARGETS_EVENT, handler);
    };
  }, [year]);

  const targets = useMemo(
    () =>
      ownerId
        ? rowsToTargets(rows, ownerId, year)
        : defaultTargets("", year),
    [rows, ownerId, year],
  );

  const saveTargets = useCallback(
    async (next: RevenueTargets) => {
      const supabase = createClient();
      const upserts: TargetRow[] = [];
      for (let m = 1; m <= 12; m++) {
        upserts.push({
          owner_id: next.ownerId,
          year: next.year,
          month: m,
          amount: next.monthly[m] ?? 0,
        });
      }
      const { error } = await supabase
        .from("revenue_targets")
        .upsert(upserts, { onConflict: "owner_id,year,month" });
      if (error) {
        console.error("targets upsert failed", error);
        throw error;
      }
      emit(TARGETS_EVENT);
    },
    [],
  );

  return { targets, saveTargets };
}

/**
 * 全ユーザーの目標を year で絞って ownerId キーで引ける Map として返す。
 * admin / team の集計用。
 */
export function useAllRevenueTargets(year: number) {
  const [rows, setRows] = useState<TargetRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const data = await fetchTargets(year);
      if (!cancelled) setRows(data);
    };
    load();
    const handler = () => load();
    window.addEventListener(TARGETS_EVENT, handler);
    return () => {
      cancelled = true;
      window.removeEventListener(TARGETS_EVENT, handler);
    };
  }, [year]);

  const targetsByOwner = useMemo(() => {
    const map: Record<string, RevenueTargets> = {};
    for (const r of rows) {
      if (!map[r.owner_id]) {
        map[r.owner_id] = defaultTargets(r.owner_id, year);
      }
      map[r.owner_id].monthly[r.month] = r.amount;
    }
    return map;
  }, [rows, year]);

  return { targetsByOwner };
}
