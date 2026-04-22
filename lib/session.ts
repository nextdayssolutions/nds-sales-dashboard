"use client";

import { useEffect, useState } from "react";
import type { AuthedSession, UserRecord, UserRole, UserStatus } from "@/types";
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

/**
 * 認証済みユーザー + プロフィールを一括取得。
 * Supabase auth session と public.users を結合し、既存画面の useMockSession と同じ shape を返す。
 */
export function useAuthedUser(): {
  session: AuthedSession | null;
  user: UserRecord | null;
  loaded: boolean;
} {
  const [session, setSession] = useState<AuthedSession | null>(null);
  const [user, setUser] = useState<UserRecord | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const load = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!authUser) {
        setSession(null);
        setUser(null);
        setLoaded(true);
        return;
      }
      const { data: profile } = await supabase
        .from("users")
        .select(
          "id, email, full_name, role, department, title, manager_id, is_active, last_login_at",
        )
        .eq("id", authUser.id)
        .maybeSingle<UserProfileRow>();
      if (cancelled) return;
      if (!profile) {
        setSession(null);
        setUser(null);
        setLoaded(true);
        return;
      }
      setSession({ userId: profile.id, role: profile.role });
      setUser(rowToRecord(profile));
      setLoaded(true);
    };

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return { session, user, loaded };
}

/** レガシー互換 alias — 既存 consumer が移行完了するまで残す */
export const useMockSession = useAuthedUser;

export async function signOutEverywhere() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
