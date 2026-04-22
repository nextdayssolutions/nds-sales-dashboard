"use client";

import { useCallback, useEffect, useState } from "react";

export interface Product {
  id: string;
  name: string;
  category?: string;
  unitPrice?: number;
  isActive: boolean;
}

const KEY = "products-v1";
const SEED_FLAG = "products-seed-v1";

const DEFAULT_PRODUCTS: Product[] = [
  { id: "p-sfa", name: "N-Free", category: "ストック", unitPrice: 50000, isActive: true },
  { id: "p-erp", name: "DX研修", category: "ストック", unitPrice: 100000, isActive: true },
  { id: "p-ma", name: "はたらくAI", category: "ストック", unitPrice: 30000, isActive: true },
  { id: "p-pos", name: "claudeファイル", category: "ストック", unitPrice: 40000, isActive: true },
  { id: "p-crm", name: "トリドリ", category: "ストック", unitPrice: 20000, isActive: true },
];

function readAll(): Product[] {
  if (typeof window === "undefined") return DEFAULT_PRODUCTS;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Product[]) : DEFAULT_PRODUCTS;
  } catch {
    return DEFAULT_PRODUCTS;
  }
}

function writeAll(list: Product[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("products-updated"));
}

export function seedProductsIfEmpty() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_FLAG)) return;
  writeAll(DEFAULT_PRODUCTS);
  localStorage.setItem(SEED_FLAG, "1");
}

export function useProducts(activeOnly = true) {
  const [all, setAll] = useState<Product[]>([]);

  useEffect(() => {
    setAll(readAll());
    const handler = () => setAll(readAll());
    window.addEventListener("products-updated", handler);
    return () => window.removeEventListener("products-updated", handler);
  }, []);

  const products = activeOnly ? all.filter((p) => p.isActive) : all;

  const addProduct = useCallback(
    (name: string, category?: string, unitPrice?: number) => {
      const id = `p-${Date.now()}`;
      const next = [...all, { id, name, category, unitPrice, isActive: true }];
      writeAll(next);
      setAll(next);
    },
    [all]
  );

  const updateProduct = useCallback(
    (id: string, patch: Partial<Product>) => {
      const next = all.map((p) => (p.id === id ? { ...p, ...patch } : p));
      writeAll(next);
      setAll(next);
    },
    [all]
  );

  const deleteProduct = useCallback(
    (id: string) => {
      const next = all.filter((p) => p.id !== id);
      writeAll(next);
      setAll(next);
    },
    [all]
  );

  return { products, allProducts: all, addProduct, updateProduct, deleteProduct };
}
