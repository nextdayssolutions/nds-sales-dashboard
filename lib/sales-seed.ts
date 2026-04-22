"use client";

import type { RevenueTargets, SalesRecord } from "@/types";
import { MOCK_USERS, PRODUCTS } from "@/lib/mock-data";

const RECORDS_KEY = "sales-records-v1";
const TARGETS_KEY = "sales-targets-v1";
const SEED_FLAG = "sales-seed-v1";

// ユーザーの年間実績（MOCK_USERS.yearRevenue）を月別×商材別に分解する
// 月の重み（過去4ヶ月分）と商材の重みは PRODUCT_REVENUE 由来の典型パターン
const MONTH_WEIGHTS = [0.26, 0.28, 0.32, 0.14, 0, 0, 0, 0, 0, 0, 0, 0]; // Jan-Apr のみ
const PRODUCT_WEIGHTS: Record<string, number> = {
  "N-Free": 0.3,
  "DX研修": 0.35,
  "はたらくAI": 0.15,
  "claudeファイル": 0.12,
  "トリドリ": 0.08,
};
const STOCK_RATIO = 0.7; // 70% がストック売上、30% がショット

function uid(seed: string): string {
  return `sr-seed-${seed}-${Math.floor(Math.random() * 100000)}`;
}

function buildRecordsFor(userId: number, yearRevenue: number, year: number): SalesRecord[] {
  if (!yearRevenue) return [];
  const records: SalesRecord[] = [];
  const now = new Date().toISOString();
  for (let m = 1; m <= 12; m++) {
    const monthTotal = Math.round(yearRevenue * (MONTH_WEIGHTS[m - 1] ?? 0));
    if (monthTotal === 0) continue;
    for (const product of PRODUCTS) {
      const productShare = Math.round(monthTotal * (PRODUCT_WEIGHTS[product] ?? 0));
      if (productShare === 0) continue;
      const stock = Math.round(productShare * STOCK_RATIO);
      const shot = productShare - stock;
      if (stock > 0) {
        records.push({
          id: uid(`${userId}-${year}-${m}-${product}-stock`),
          ownerId: userId,
          productName: product,
          revenueType: "stock",
          amount: stock,
          year,
          month: m,
          recordedAt: now,
        });
      }
      if (shot > 0) {
        records.push({
          id: uid(`${userId}-${year}-${m}-${product}-shot`),
          ownerId: userId,
          productName: product,
          revenueType: "shot",
          amount: shot,
          year,
          month: m,
          recordedAt: now,
        });
      }
    }
  }
  return records;
}

function buildTargetsFor(userId: number, year: number, yearTarget: number): RevenueTargets {
  const monthly: Record<number, number> = {};
  // ランプアップカーブで分散（Q1 24%, Q2 25%, Q3 25%, Q4 26%）
  const quarterShare = [0.24, 0.25, 0.25, 0.26];
  for (let m = 1; m <= 12; m++) {
    const q = Math.floor((m - 1) / 3);
    monthly[m] = Math.round((yearTarget * quarterShare[q]) / 3);
  }
  return { ownerId: userId, year, monthly };
}

export function seedSalesIfEmpty() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_FLAG)) return;
  const YEAR = 2026;
  const allRecords: SalesRecord[] = [];
  const allTargets: Record<string, RevenueTargets> = {};
  for (const u of MOCK_USERS) {
    if (u.yearRevenue && u.yearRevenue > 0) {
      allRecords.push(...buildRecordsFor(u.id, u.yearRevenue, YEAR));
      // 目標 = 実績達成率の逆算（達成率 % から年間目標を推測）
      const yearTarget =
        u.achievement && u.achievement > 0
          ? Math.round((u.yearRevenue / u.achievement) * 100)
          : u.yearRevenue * 1.5;
      allTargets[`${u.id}-${YEAR}`] = buildTargetsFor(u.id, YEAR, yearTarget);
    }
  }
  localStorage.setItem(RECORDS_KEY, JSON.stringify(allRecords));
  localStorage.setItem(TARGETS_KEY, JSON.stringify(allTargets));
  localStorage.setItem(SEED_FLAG, "1");
}
