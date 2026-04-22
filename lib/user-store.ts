"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { UserRecord, UserRole, UserStatus } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface UserProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department: string | null;
  title: string | null;
  manager_id: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

const USERS_EVENT = "users-updated";

function emitUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(USERS_EVENT));
  }
}

function rowToRecord(row: UserProfileRow): UserRecord {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    role: row.role,
    status: (row.is_active ? "active" : "suspended") as UserStatus,
    dept: row.department ?? "",
    title: row.title ?? undefined,
    managerId: row.manager_id ?? undefined,
    lastLogin: row.last_login_at
      ? new Date(row.last_login_at).toLocaleString("ja-JP", { hour12: false })
      : "—",
  };
}

async function fetchAll(): Promise<UserRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, email, full_name, role, department, title, manager_id, is_active, last_login_at, created_at",
    )
    .order("created_at", { ascending: true });
  if (error) {
    console.error("users fetch failed", error);
    return [];
  }
  return (data ?? []).map((r) => rowToRecord(r as UserProfileRow));
}

/** 全ユーザーを取得。admin ページ用 */
export function useAllUsers() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    const data = await fetchAll();
    setUsers(data);
    setLoaded(true);
  }, []);

  useEffect(() => {
    reload();
    const handler = () => reload();
    window.addEventListener(USERS_EVENT, handler);
    return () => window.removeEventListener(USERS_EVENT, handler);
  }, [reload]);

  return { users, loaded, reload };
}

/** 指定マネージャー配下のユーザー */
export function useTeamMembers(managerId: string | undefined) {
  const { users } = useAllUsers();
  return useMemo(
    () =>
      managerId
        ? users.filter((u) => u.managerId === managerId && u.status !== "retired")
        : [],
    [users, managerId],
  );
}

/** 単一ユーザー取得 */
export function useUser(userId: string | undefined) {
  const { users } = useAllUsers();
  return useMemo(
    () => (userId ? users.find((u) => u.id === userId) ?? null : null),
    [users, userId],
  );
}

/** ユーザーリスト更新のブロードキャスト（招待モーダル等から） */
export function broadcastUsersUpdated() {
  emitUpdate();
}
