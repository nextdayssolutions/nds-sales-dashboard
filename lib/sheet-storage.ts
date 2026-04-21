"use client";

import { useCallback, useEffect, useState } from "react";
import type { SheetKind, SheetSet } from "@/types";
import {
  emptyDevelopment,
  emptyGoal,
  emptyOneOnOne,
  emptyVision,
} from "@/lib/curriculum-data";

const PREFIX = "sheet-v1";
const key = (userId: number, kind: SheetKind) => `${PREFIX}:${userId}:${kind}`;

function defaults(): SheetSet {
  return {
    vision: emptyVision(),
    goal: emptyGoal(),
    development: emptyDevelopment(),
    oneonone: emptyOneOnOne(),
  };
}

function readOne<K extends SheetKind>(userId: number, kind: K): SheetSet[K] {
  if (typeof window === "undefined") return defaults()[kind];
  try {
    const raw = localStorage.getItem(key(userId, kind));
    if (!raw) return defaults()[kind];
    return JSON.parse(raw) as SheetSet[K];
  } catch {
    return defaults()[kind];
  }
}

function writeOne<K extends SheetKind>(userId: number, kind: K, value: SheetSet[K]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key(userId, kind), JSON.stringify(value));
  // fan-out a custom event so other components in the same tab react
  window.dispatchEvent(new CustomEvent("sheet-updated", { detail: { userId, kind } }));
}

export function getAllSheets(userId: number): SheetSet {
  return {
    vision: readOne(userId, "vision"),
    goal: readOne(userId, "goal"),
    development: readOne(userId, "development"),
    oneonone: readOne(userId, "oneonone"),
  };
}

export function useSheet<K extends SheetKind>(
  userId: number,
  kind: K
): [SheetSet[K], (next: SheetSet[K]) => void] {
  const [value, setValue] = useState<SheetSet[K]>(() => defaults()[kind]);

  useEffect(() => {
    setValue(readOne(userId, kind));
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { userId: number; kind: SheetKind };
      if (detail.userId === userId && detail.kind === kind) {
        setValue(readOne(userId, kind));
      }
    };
    window.addEventListener("sheet-updated", handler);
    return () => window.removeEventListener("sheet-updated", handler);
  }, [userId, kind]);

  const save = useCallback(
    (next: SheetSet[K]) => {
      writeOne(userId, kind, next);
      setValue(next);
    },
    [userId, kind]
  );

  return [value, save];
}

// ───────── 提出状況の判定（admin のシート配布タブ用） ─────────

export interface SheetSubmissionStatus {
  vision: "submitted" | "empty";
  goal: "submitted" | "empty";
  development: { progress: number; completed: number; total: number };
  oneonone: { count: number; latest: string | null };
}

export function evalSubmissionStatus(userId: number): SheetSubmissionStatus {
  const all = getAllSheets(userId);
  const visionFilled =
    !!all.vision.principle1.trim() ||
    !!all.vision.principle2.trim() ||
    !!all.vision.principle3.trim();
  const goalFilled = Object.values(all.goal.wishes).some((w) => w.content.trim().length > 0);
  const total = all.development.curriculum.length;
  const completed = all.development.curriculum.filter(
    (c) => c.selfUnderstood && c.selfCanDo
  ).length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
  const count = all.oneonone.entries.length;
  const latest =
    all.oneonone.entries.length > 0
      ? [...all.oneonone.entries].sort((a, b) => b.date.localeCompare(a.date))[0].date
      : null;
  return {
    vision: visionFilled ? "submitted" : "empty",
    goal: goalFilled ? "submitted" : "empty",
    development: { progress, completed, total },
    oneonone: { count, latest },
  };
}
