"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Customer, CustomerStatus } from "@/types";
import { createClient } from "@/lib/supabase/client";

type DbStatus = "prospect" | "lead" | "existing";

const STATUS_TO_DB: Record<CustomerStatus, DbStatus> = {
  既存: "existing",
  商談中: "lead",
  見込み: "prospect",
};

const STATUS_FROM_DB: Record<DbStatus, CustomerStatus> = {
  existing: "既存",
  lead: "商談中",
  prospect: "見込み",
};

interface CustomerRow {
  id: string;
  owner_id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  industry: string | null;
  status: DbStatus;
  relation_score: number | null;
  last_contact_at: string | null;
  next_appointment_at: string | null;
  product_names: string[];
  annual_revenue: number;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

function rowToCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.company_name,
    industry: row.industry ?? "",
    contact: row.contact_name ?? "",
    contactEmail: row.contact_email ?? undefined,
    contactPhone: row.contact_phone ?? undefined,
    products: row.product_names ?? [],
    relation: row.relation_score ?? 5,
    lastContact: row.last_contact_at ?? "",
    revenue: row.annual_revenue,
    status: STATUS_FROM_DB[row.status],
    nextAppointment: row.next_appointment_at ?? undefined,
    memo: row.memo ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function customerToInsert(c: Omit<Customer, "id">) {
  return {
    owner_id: c.ownerId,
    company_name: c.name,
    contact_name: c.contact || null,
    contact_email: c.contactEmail || null,
    contact_phone: c.contactPhone || null,
    industry: c.industry || null,
    status: STATUS_TO_DB[c.status],
    relation_score: c.relation,
    last_contact_at: c.lastContact || null,
    next_appointment_at: c.nextAppointment || null,
    product_names: c.products ?? [],
    annual_revenue: c.revenue ?? 0,
    memo: c.memo || null,
  };
}

function customerToUpdate(patch: Partial<Customer>) {
  const out: Record<string, unknown> = {};
  if (patch.ownerId !== undefined) out.owner_id = patch.ownerId;
  if (patch.name !== undefined) out.company_name = patch.name;
  if (patch.contact !== undefined) out.contact_name = patch.contact || null;
  if (patch.contactEmail !== undefined) out.contact_email = patch.contactEmail || null;
  if (patch.contactPhone !== undefined) out.contact_phone = patch.contactPhone || null;
  if (patch.industry !== undefined) out.industry = patch.industry || null;
  if (patch.status !== undefined) out.status = STATUS_TO_DB[patch.status];
  if (patch.relation !== undefined) out.relation_score = patch.relation;
  if (patch.lastContact !== undefined) out.last_contact_at = patch.lastContact || null;
  if (patch.nextAppointment !== undefined)
    out.next_appointment_at = patch.nextAppointment || null;
  if (patch.products !== undefined) out.product_names = patch.products;
  if (patch.revenue !== undefined) out.annual_revenue = patch.revenue;
  if (patch.memo !== undefined) out.memo = patch.memo || null;
  return out;
}

const EVENT = "customers-updated";

function emitUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT));
  }
}

async function fetchAll(): Promise<Customer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, owner_id, company_name, contact_name, contact_email, contact_phone, industry, status, relation_score, last_contact_at, next_appointment_at, product_names, annual_revenue, memo, created_at, updated_at",
    )
    .order("created_at", { ascending: false });
  if (error) {
    console.error("customers fetch failed", error);
    return [];
  }
  return (data ?? []).map((r) => rowToCustomer(r as CustomerRow));
}

export function useCustomers(ownerId?: string) {
  const [all, setAll] = useState<Customer[]>([]);

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

  const customers = useMemo(
    () => (ownerId !== undefined ? all.filter((c) => c.ownerId === ownerId) : all),
    [all, ownerId],
  );

  const addCustomer = useCallback(async (data: Omit<Customer, "id">) => {
    const supabase = createClient();
    const { error } = await supabase.from("customers").insert(customerToInsert(data));
    if (error) {
      console.error("customer insert failed", error);
      throw error;
    }
    emitUpdate();
  }, []);

  const updateCustomer = useCallback(
    async (id: string, patch: Partial<Customer>) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("customers")
        .update(customerToUpdate(patch))
        .eq("id", id);
      if (error) {
        console.error("customer update failed", error);
        throw error;
      }
      emitUpdate();
    },
    [],
  );

  const deleteCustomer = useCallback(async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) {
      console.error("customer delete failed", error);
      throw error;
    }
    emitUpdate();
  }, []);

  return { customers, allCustomers: all, addCustomer, updateCustomer, deleteCustomer };
}
