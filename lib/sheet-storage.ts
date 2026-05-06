"use client";

import { useCallback, useEffect, useState } from "react";
import type { SheetKind, SheetSet } from "@/types";
import {
  emptyDaily,
  emptyDevelopment,
  emptyGoal,
  emptyOneOnOne,
  emptyVision,
} from "@/lib/curriculum-data";
import { createClient } from "@/lib/supabase/client";

function defaults(): SheetSet {
  return {
    daily: emptyDaily(),
    vision: emptyVision(),
    goal: emptyGoal(),
    development: emptyDevelopment(),
    oneonone: emptyOneOnOne(),
  };
}

const EVENT = "sheet-updated";

function emitUpdate(userId: string, kind: SheetKind) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { userId, kind } }));
  }
}

async function fetchOne<K extends SheetKind>(
  userId: string,
  kind: K,
): Promise<SheetSet[K]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("personal_sheets")
    .select("content")
    .eq("user_id", userId)
    .eq("sheet_kind", kind)
    .maybeSingle();
  if (error) {
    console.error("sheet fetch failed", error);
    return defaults()[kind];
  }
  if (!data) return defaults()[kind];
  return data.content as SheetSet[K];
}

async function saveOne<K extends SheetKind>(
  userId: string,
  kind: K,
  value: SheetSet[K],
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("personal_sheets")
    .upsert(
      {
        user_id: userId,
        sheet_kind: kind,
        content: value as unknown as Record<string, unknown>,
      },
      { onConflict: "user_id,sheet_kind" },
    );
  if (error) {
    console.error("sheet upsert failed", error);
    throw error;
  }
  emitUpdate(userId, kind);
}

export async function getAllSheetsAsync(userId: string): Promise<SheetSet> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("personal_sheets")
    .select("sheet_kind, content")
    .eq("user_id", userId);
  const base = defaults();
  if (error) {
    console.error("sheets fetch failed", error);
    return base;
  }
  for (const row of data ?? []) {
    const kind = row.sheet_kind as SheetKind;
    (base as Record<SheetKind, unknown>)[kind] = row.content;
  }
  return base;
}

export function useSheet<K extends SheetKind>(
  userId: string | undefined,
  kind: K,
): [SheetSet[K], (next: SheetSet[K]) => Promise<void>] {
  const [value, setValue] = useState<SheetSet[K]>(() => defaults()[kind]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!userId) {
        setValue(defaults()[kind]);
        return;
      }
      const data = await fetchOne(userId, kind);
      if (!cancelled) setValue(data);
    };
    load();
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { userId: string; kind: SheetKind }
        | undefined;
      if (!detail) return;
      if (detail.userId === userId && detail.kind === kind) {
        load();
      }
    };
    window.addEventListener(EVENT, handler);
    return () => {
      cancelled = true;
      window.removeEventListener(EVENT, handler);
    };
  }, [userId, kind]);

  const save = useCallback(
    async (next: SheetSet[K]) => {
      if (!userId) return;
      await saveOne(userId, kind, next);
      setValue(next);
    },
    [userId, kind],
  );

  return [value, save];
}
