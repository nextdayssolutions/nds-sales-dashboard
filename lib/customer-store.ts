"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Customer } from "@/types";
import { CUSTOMERS as DEFAULT_CUSTOMERS } from "@/lib/mock-data";

const KEY = "customers-v1";
const SEED_FLAG = "customers-seed-v1";

function readAll(): Customer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Customer[]) : [];
  } catch {
    return [];
  }
}

function writeAll(customers: Customer[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(customers));
  window.dispatchEvent(new CustomEvent("customers-updated"));
}

export function seedCustomersIfEmpty() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_FLAG)) return;
  writeAll(DEFAULT_CUSTOMERS);
  localStorage.setItem(SEED_FLAG, "1");
}

export function useCustomers(ownerId?: number) {
  const [all, setAll] = useState<Customer[]>([]);

  useEffect(() => {
    setAll(readAll());
    const handler = () => setAll(readAll());
    window.addEventListener("customers-updated", handler);
    return () => window.removeEventListener("customers-updated", handler);
  }, []);

  const customers = useMemo(
    () => (ownerId !== undefined ? all.filter((c) => c.ownerId === ownerId) : all),
    [all, ownerId]
  );

  const addCustomer = useCallback(
    (data: Omit<Customer, "id">) => {
      const maxId = all.reduce((m, c) => (c.id > m ? c.id : m), 0);
      const next = [...all, { ...data, id: maxId + 1, createdAt: new Date().toISOString() }];
      writeAll(next);
      setAll(next);
    },
    [all]
  );

  const updateCustomer = useCallback(
    (id: number, patch: Partial<Customer>) => {
      const next = all.map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c
      );
      writeAll(next);
      setAll(next);
    },
    [all]
  );

  const deleteCustomer = useCallback(
    (id: number) => {
      const next = all.filter((c) => c.id !== id);
      writeAll(next);
      setAll(next);
    },
    [all]
  );

  return { customers, allCustomers: all, addCustomer, updateCustomer, deleteCustomer };
}
