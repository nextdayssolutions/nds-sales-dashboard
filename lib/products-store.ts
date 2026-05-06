"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type CommissionType = "rate" | "fixed";

export interface Product {
  id: string;
  name: string;
  category?: string;
  unitPrice?: number;
  /** 歩合タイプ: "rate" (売上%) or "fixed" (1件あたり固定円) */
  commissionType: CommissionType;
  /** 歩合率 (%). commissionType=rate のとき使用。0〜100 の小数 */
  commissionRate: number;
  /** 定額歩合 (円/件). commissionType=fixed のとき使用 */
  commissionFixed: number;
  isActive: boolean;
}

type DbCategory = "stock" | "shot" | "both" | "other";

const CATEGORY_TO_DB: Record<string, DbCategory | null> = {
  ストック: "stock",
  ショット: "shot",
  両方: "both",
  その他: "other",
};

const CATEGORY_FROM_DB: Record<DbCategory, string> = {
  stock: "ストック",
  shot: "ショット",
  both: "両方",
  other: "その他",
};

interface ProductRow {
  id: string;
  name: string;
  category: DbCategory | null;
  unit_price: number | null;
  commission_type: CommissionType;
  commission_rate: number;
  commission_fixed: number;
  is_active: boolean;
}

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category ? CATEGORY_FROM_DB[row.category] : undefined,
    unitPrice: row.unit_price ?? undefined,
    commissionType: row.commission_type ?? "rate",
    commissionRate: Number(row.commission_rate) || 0,
    commissionFixed: row.commission_fixed || 0,
    isActive: row.is_active,
  };
}

/**
 * 商材の歩合定義から、1 ヶ月あたりの歩合額を算出。
 *
 * - rate (%): 売上金額 (amount) × 歩合率
 * - fixed (円/件): quantity × 固定歩合（個数倍され）
 *
 * stock の場合 amount は月額・quantity も「アクティブな間ずっと」適用される個数。
 * shot の場合は単月の売上に対して 1 度だけ計上される。
 */
export function computeCommission(
  product: Product | undefined,
  saleAmount: number,
  quantity: number = 1,
): number {
  if (!product) return 0;
  if (product.commissionType === "fixed") {
    return product.commissionFixed * Math.max(1, quantity);
  }
  return Math.round((saleAmount * product.commissionRate) / 100);
}

const EVENT = "products-updated";

function emitUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT));
  }
}

async function fetchAll(): Promise<Product[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, category, unit_price, commission_type, commission_rate, commission_fixed, is_active",
    )
    .order("created_at", { ascending: true });
  if (error) {
    console.error("products fetch failed", error);
    return [];
  }
  return (data ?? []).map((r) => rowToProduct(r as ProductRow));
}

export function useProducts(activeOnly = true) {
  const [all, setAll] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const data = await fetchAll();
      if (!cancelled) setAll(data);
    };
    load();
    const handler = () => load();
    window.addEventListener(EVENT, handler);
    return () => {
      cancelled = true;
      window.removeEventListener(EVENT, handler);
    };
  }, []);

  const products = useMemo(
    () => (activeOnly ? all.filter((p) => p.isActive) : all),
    [all, activeOnly],
  );

  const addProduct = useCallback(
    async (input: {
      name: string;
      category?: string;
      unitPrice?: number;
      commissionType?: CommissionType;
      commissionRate?: number;
      commissionFixed?: number;
    }) => {
      const supabase = createClient();
      const { error } = await supabase.from("products").insert({
        name: input.name,
        category: input.category ? CATEGORY_TO_DB[input.category] ?? null : null,
        unit_price: input.unitPrice ?? null,
        commission_type: input.commissionType ?? "rate",
        commission_rate: input.commissionRate ?? 0,
        commission_fixed: input.commissionFixed ?? 0,
        is_active: true,
      });
      if (error) {
        console.error("product insert failed", error);
        throw error;
      }
      emitUpdate();
    },
    [],
  );

  const updateProduct = useCallback(
    async (id: string, patch: Partial<Product>) => {
      const supabase = createClient();
      const payload: Record<string, unknown> = {};
      if (patch.name !== undefined) payload.name = patch.name;
      if (patch.category !== undefined) {
        payload.category = patch.category
          ? CATEGORY_TO_DB[patch.category] ?? null
          : null;
      }
      if (patch.unitPrice !== undefined) payload.unit_price = patch.unitPrice ?? null;
      if (patch.commissionType !== undefined)
        payload.commission_type = patch.commissionType;
      if (patch.commissionRate !== undefined)
        payload.commission_rate = patch.commissionRate;
      if (patch.commissionFixed !== undefined)
        payload.commission_fixed = patch.commissionFixed;
      if (patch.isActive !== undefined) payload.is_active = patch.isActive;
      const { error } = await supabase.from("products").update(payload).eq("id", id);
      if (error) {
        console.error("product update failed", error);
        throw error;
      }
      emitUpdate();
    },
    [],
  );

  const deleteProduct = useCallback(async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      console.error("product delete failed", error);
      throw error;
    }
    emitUpdate();
  }, []);

  return { products, allProducts: all, addProduct, updateProduct, deleteProduct };
}
