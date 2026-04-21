"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RevenueTargets, SalesRecord } from "@/types";

const RECORDS_KEY = "sales-records-v1";
const TARGETS_KEY = "sales-targets-v1";

// ─── 売上レコード ──────────────────────────────

function readRecords(): SalesRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    return raw ? (JSON.parse(raw) as SalesRecord[]) : [];
  } catch {
    return [];
  }
}

function writeRecords(records: SalesRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent("sales-updated"));
}

function uid(): string {
  return `sr-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function useSalesRecords(ownerId?: number, year?: number) {
  const [all, setAll] = useState<SalesRecord[]>([]);

  useEffect(() => {
    setAll(readRecords());
    const handler = () => setAll(readRecords());
    window.addEventListener("sales-updated", handler);
    return () => window.removeEventListener("sales-updated", handler);
  }, []);

  const records = useMemo(() => {
    return all.filter((r) => {
      if (ownerId !== undefined && r.ownerId !== ownerId) return false;
      if (year !== undefined && r.year !== year) return false;
      return true;
    });
  }, [all, ownerId, year]);

  const addRecord = useCallback(
    (data: Omit<SalesRecord, "id" | "recordedAt">) => {
      const record: SalesRecord = {
        ...data,
        id: uid(),
        recordedAt: new Date().toISOString(),
      };
      const next = [...all, record];
      writeRecords(next);
      setAll(next);
      return record;
    },
    [all]
  );

  const updateRecord = useCallback(
    (id: string, patch: Partial<SalesRecord>) => {
      const next = all.map((r) => (r.id === id ? { ...r, ...patch } : r));
      writeRecords(next);
      setAll(next);
    },
    [all]
  );

  const deleteRecord = useCallback(
    (id: string) => {
      const next = all.filter((r) => r.id !== id);
      writeRecords(next);
      setAll(next);
    },
    [all]
  );

  return { records, addRecord, updateRecord, deleteRecord };
}

// ─── 月次目標 ──────────────────────────────────

type AllTargets = Record<string, RevenueTargets>; // key: `${ownerId}-${year}`

function readTargets(): AllTargets {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(TARGETS_KEY);
    return raw ? (JSON.parse(raw) as AllTargets) : {};
  } catch {
    return {};
  }
}

function writeTargets(all: AllTargets) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TARGETS_KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent("targets-updated"));
}

const defaultTargets = (ownerId: number, year: number): RevenueTargets => ({
  ownerId,
  year,
  monthly: Object.fromEntries(
    Array.from({ length: 12 }, (_, i) => [i + 1, 0])
  ) as Record<number, number>,
});

export function useRevenueTargets(ownerId: number, year: number) {
  const [all, setAll] = useState<AllTargets>({});

  useEffect(() => {
    setAll(readTargets());
    const handler = () => setAll(readTargets());
    window.addEventListener("targets-updated", handler);
    return () => window.removeEventListener("targets-updated", handler);
  }, []);

  const key = `${ownerId}-${year}`;
  const targets = all[key] ?? defaultTargets(ownerId, year);

  const saveTargets = useCallback(
    (next: RevenueTargets) => {
      const merged = { ...all, [`${next.ownerId}-${next.year}`]: next };
      writeTargets(merged);
      setAll(merged);
    },
    [all]
  );

  return { targets, saveTargets };
}
