"use client";

import { useEffect, useState } from "react";
import type { MockSession, UserRecord } from "@/types";
import { MOCK_USERS } from "@/lib/mock-data";

const KEY = "mock-session-v1";

export const DEFAULT_SESSIONS: Record<string, MockSession> = {
  member: { userId: 1, role: "member" },
  manager: { userId: 2, role: "manager" },
  admin: { userId: 6, role: "admin" },
};

export function setMockSession(session: MockSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function getMockSession(): MockSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MockSession) : null;
  } catch {
    return null;
  }
}

export function clearMockSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function useMockSession(): {
  session: MockSession | null;
  user: UserRecord | null;
  loaded: boolean;
} {
  const [session, setSession] = useState<MockSession | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSession(getMockSession());
    setLoaded(true);
  }, []);

  const user = session ? MOCK_USERS.find((u) => u.id === session.userId) ?? null : null;
  return { session, user, loaded };
}

export function getTeamMembers(managerId: number): UserRecord[] {
  return MOCK_USERS.filter((u) => u.managerId === managerId);
}
