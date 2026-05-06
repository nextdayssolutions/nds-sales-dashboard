"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  Customer,
  DevelopmentSheet,
  OneOnOneSheet,
  RevenueTargets,
  SalesRecord,
  SheetKind,
  SheetSet,
} from "@/types";
import { useCustomers } from "@/lib/customer-store";
import {
  useAllRevenueTargets,
  useRevenueTargets,
  useSalesRecords,
} from "@/lib/sales-store";
import { useSheet } from "@/lib/sheet-storage";
import { createClient } from "@/lib/supabase/client";
import { emptyDevelopment } from "@/lib/curriculum-data";
import {
  sumActiveAmount,
  sumActiveCommission,
  sumYearAmount,
  sumYearCommission,
} from "@/lib/sales-recurrence";

// ───────── 定数 ─────────
/** 現在の年度。実時計ベース — 毎年自動で切り替わる */
export const CURRENT_YEAR = new Date().getFullYear();

/** 今月 (1-12) */
export function getCurrentMonth(): number {
  return new Date().getMonth() + 1;
}

// ───────── 指標の型 ─────────

export interface UserMetrics {
  customerCount: number;
  existingCount: number;
  prospectCount: number;
  leadCount: number;

  monthRevenue: number;
  monthTarget: number;
  monthAchievement: number | null;

  yearRevenue: number;
  yearTarget: number;
  yearAchievement: number | null;

  /** 今月の歩合合計（スナップショット値の合算） */
  monthCommission: number;
  /** 年間累計の歩合合計 */
  yearCommission: number;

  trainingDone: number;
  trainingTotal: number;
  trainingProgress: number;

  latest1on1: string | null;
  oneOnOneCount: number;
}

export const EMPTY_METRICS: UserMetrics = {
  customerCount: 0,
  existingCount: 0,
  prospectCount: 0,
  leadCount: 0,
  monthRevenue: 0,
  monthTarget: 0,
  monthAchievement: null,
  yearRevenue: 0,
  yearTarget: 0,
  yearAchievement: null,
  monthCommission: 0,
  yearCommission: 0,
  trainingDone: 0,
  trainingTotal: 0,
  trainingProgress: 0,
  latest1on1: null,
  oneOnOneCount: 0,
};

// ───────── 純粋関数（Server Component からも使用可） ─────────

export function calculateUserMetrics(args: {
  customers: Customer[];
  records: SalesRecord[];
  targets: RevenueTargets;
  development: DevelopmentSheet;
  oneonone: OneOnOneSheet;
  /** 集計対象の年（既定: 現在年） */
  year?: number;
  month?: number;
}): UserMetrics {
  const year = args.year ?? CURRENT_YEAR;
  const month = args.month ?? getCurrentMonth();

  const existingCount = args.customers.filter((c) => c.status === "既存").length;
  const prospectCount = args.customers.filter((c) => c.status === "商談中").length;
  const leadCount = args.customers.filter((c) => c.status === "見込み").length;

  // 売上・歩合は stock の自動継続を unfold しながら集計
  const monthRevenue = sumActiveAmount(args.records, year, month);
  const yearRevenue = sumYearAmount(args.records, year);
  const monthCommission = sumActiveCommission(args.records, year, month);
  const yearCommission = sumYearCommission(args.records, year);
  const monthTarget = args.targets.monthly[month] ?? 0;
  const yearTarget = Object.values(args.targets.monthly).reduce(
    (a, b) => a + b,
    0,
  );

  const monthAchievement =
    monthTarget > 0 ? Math.round((monthRevenue / monthTarget) * 100) : null;
  const yearAchievement =
    yearTarget > 0
      ? Math.round((yearRevenue / yearTarget) * 1000) / 10
      : null;

  const trainingTotal = args.development.curriculum.length;
  const trainingDone = args.development.curriculum.filter(
    (c) => c.selfUnderstood && c.selfCanDo,
  ).length;
  const trainingProgress =
    trainingTotal === 0
      ? 0
      : Math.round((trainingDone / trainingTotal) * 100);

  const latest1on1 =
    args.oneonone.entries.length > 0
      ? [...args.oneonone.entries].sort((a, b) =>
          b.date.localeCompare(a.date),
        )[0].date
      : null;

  return {
    customerCount: args.customers.length,
    existingCount,
    prospectCount,
    leadCount,
    monthRevenue,
    monthTarget,
    monthAchievement,
    yearRevenue,
    yearTarget,
    yearAchievement,
    monthCommission,
    yearCommission,
    trainingDone,
    trainingTotal,
    trainingProgress,
    latest1on1,
    oneOnOneCount: args.oneonone.entries.length,
  };
}

// ───────── per-user hook ─────────

/**
 * 単一ユーザーの全指標を 1 本の hook で返す。
 * 内部で customer / sales / targets / 育成シート / 1on1 を Supabase から取得。
 */
export function useUserMetrics(userId: string | undefined): UserMetrics {
  const { customers } = useCustomers(userId);
  const { records } = useSalesRecords(userId, CURRENT_YEAR);
  const { targets } = useRevenueTargets(userId, CURRENT_YEAR);
  const [development] = useSheet(userId, "development");
  const [oneonone] = useSheet(userId, "oneonone");

  return useMemo(() => {
    if (!userId) return EMPTY_METRICS;
    return calculateUserMetrics({
      customers,
      records,
      targets,
      development,
      oneonone,
    });
  }, [userId, customers, records, targets, development, oneonone]);
}

// ───────── 複数ユーザーの集計 hook（admin / team 用） ─────────

export interface AggregatedMetrics {
  userCount: number;
  totalCustomers: number;
  totalMonthRevenue: number;
  totalYearRevenue: number;
  totalMonthTarget: number;
  totalYearTarget: number;
  totalMonthCommission: number;
  totalYearCommission: number;
  avgMonthAchievement: number | null;
  avgYearAchievement: number | null;
  avgTrainingProgress: number;
}

export function useAggregatedMetrics(userIds: string[]): AggregatedMetrics {
  const { allCustomers } = useCustomers();
  const { records: allRecords } = useSalesRecords(undefined, CURRENT_YEAR);
  const { targetsByOwner } = useAllRevenueTargets(CURRENT_YEAR);
  const developmentByOwner = useDevelopmentSheetsByUser(userIds);

  return useMemo(() => {
    const month = getCurrentMonth();
    let totalCustomers = 0;
    let totalMonthRevenue = 0;
    let totalYearRevenue = 0;
    let totalMonthTarget = 0;
    let totalYearTarget = 0;
    let totalMonthCommission = 0;
    let totalYearCommission = 0;
    const monthAchievements: number[] = [];
    const yearAchievements: number[] = [];
    const trainingPcts: number[] = [];

    for (const uid of userIds) {
      const uCustomers = allCustomers.filter((c) => c.ownerId === uid);
      totalCustomers += uCustomers.length;

      const uRecords = allRecords.filter((r) => r.ownerId === uid);
      const uMonthRev = sumActiveAmount(uRecords, CURRENT_YEAR, month);
      const uYearRev = sumYearAmount(uRecords, CURRENT_YEAR);
      totalMonthRevenue += uMonthRev;
      totalYearRevenue += uYearRev;
      totalMonthCommission += sumActiveCommission(uRecords, CURRENT_YEAR, month);
      totalYearCommission += sumYearCommission(uRecords, CURRENT_YEAR);

      const uTarget = targetsByOwner[uid];
      const uMonthTarget = uTarget?.monthly[month] ?? 0;
      const uYearTarget = uTarget
        ? Object.values(uTarget.monthly).reduce((a, b) => a + b, 0)
        : 0;
      totalMonthTarget += uMonthTarget;
      totalYearTarget += uYearTarget;

      if (uMonthTarget > 0) {
        monthAchievements.push(Math.round((uMonthRev / uMonthTarget) * 100));
      }
      if (uYearTarget > 0) {
        yearAchievements.push(
          Math.round((uYearRev / uYearTarget) * 1000) / 10,
        );
      }

      const dev = developmentByOwner[uid];
      if (dev) {
        const total = dev.curriculum.length;
        const done = dev.curriculum.filter(
          (c) => c.selfUnderstood && c.selfCanDo,
        ).length;
        trainingPcts.push(total === 0 ? 0 : Math.round((done / total) * 100));
      }
    }

    const avg = (arr: number[]) =>
      arr.length === 0
        ? null
        : Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;

    return {
      userCount: userIds.length,
      totalCustomers,
      totalMonthRevenue,
      totalYearRevenue,
      totalMonthTarget,
      totalYearTarget,
      totalMonthCommission,
      totalYearCommission,
      avgMonthAchievement: avg(monthAchievements),
      avgYearAchievement: avg(yearAchievements),
      avgTrainingProgress:
        trainingPcts.length === 0
          ? 0
          : Math.round(
              trainingPcts.reduce((a, b) => a + b, 0) / trainingPcts.length,
            ),
    };
  }, [userIds, allCustomers, allRecords, targetsByOwner, developmentByOwner]);
}

// ───────── 内部ヘルパー: 複数ユーザーの development シート一括取得 ─────────

function useDevelopmentSheetsByUser(
  userIds: string[],
): Record<string, DevelopmentSheet> {
  const userKey = userIds.join(",");
  const [sheets, setSheets] = useState<Record<string, DevelopmentSheet>>({});

  useEffect(() => {
    let cancelled = false;
    const reload = async () => {
      if (userIds.length === 0) {
        if (!cancelled) setSheets({});
        return;
      }
      const supabase = createClient();
      const { data } = await supabase
        .from("personal_sheets")
        .select("user_id, content")
        .in("user_id", userIds)
        .eq("sheet_kind", "development");
      if (cancelled) return;
      const next: Record<string, DevelopmentSheet> = {};
      for (const id of userIds) next[id] = emptyDevelopment();
      for (const row of data ?? []) {
        next[row.user_id as string] = row.content as DevelopmentSheet;
      }
      setSheets(next);
    };
    reload();
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { userId: string; kind: SheetKind }
        | undefined;
      if (!detail || detail.kind === "development") reload();
    };
    window.addEventListener("sheet-updated", handler);
    return () => {
      cancelled = true;
      window.removeEventListener("sheet-updated", handler);
    };
    // userIds 配列の内容が変わったときだけ再評価したいので join した文字列を依存に使う
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userKey]);

  return sheets;
}

// ───────── 型再エクスポート ─────────
export type { SheetSet };
