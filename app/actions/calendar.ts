"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { refreshAccessToken } from "@/lib/google-oauth";

export interface CalendarEvent {
  id: string;
  title: string;
  /** ISO8601 日時。終日予定の場合は YYYY-MM-DD 形式 */
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  description?: string;
  attendees?: string[];
  /** 自分が招待されているかの簡易判定用。 */
  status?: string;
  htmlLink?: string;
}

export interface FetchResult {
  ok: boolean;
  events?: CalendarEvent[];
  error?: string;
  /** 連携が無い/失効している場合 true（UI で「再連携してください」を出す） */
  needsReconnect?: boolean;
}

interface GoogleEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
  description?: string;
  attendees?: { email: string }[];
  status?: string;
  htmlLink?: string;
}

const CALENDAR_API =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

/**
 * 指定ユーザーの Google カレンダー予定を取得。
 * RLS で権限チェック（自分 / 配下 / admin）した上で、service_role で refresh_token を引き、
 * Google Calendar API を叩く。
 */
export async function fetchCalendarEventsAction(
  userId: string,
  daysAhead = 30,
): Promise<FetchResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user: caller },
    } = await supabase.auth.getUser();
    if (!caller) return { ok: false, error: "未ログイン" };

    if (caller.id !== userId) {
      const { data: callerProfile } = await supabase
        .from("users")
        .select("role")
        .eq("id", caller.id)
        .maybeSingle();
      if (callerProfile?.role !== "admin") {
        const { data: target } = await supabase
          .from("users")
          .select("manager_id")
          .eq("id", userId)
          .maybeSingle();
        if (target?.manager_id !== caller.id) {
          return { ok: false, error: "閲覧権限がありません" };
        }
      }
    }

    const admin = createAdminClient();
    const { data: targetUser, error: loadErr } = await admin
      .from("users")
      .select("google_refresh_token")
      .eq("id", userId)
      .maybeSingle();
    if (loadErr) return { ok: false, error: loadErr.message };
    if (!targetUser?.google_refresh_token) {
      return { ok: false, needsReconnect: true };
    }

    let accessToken: string;
    try {
      accessToken = await refreshAccessToken(targetUser.google_refresh_token);
    } catch (e) {
      // refresh_token 失効（権限剥奪など）
      console.error("google token refresh failed", e);
      return {
        ok: false,
        needsReconnect: true,
        error: e instanceof Error ? e.message : "トークン更新失敗",
      };
    }

    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + daysAhead);

    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "100",
    });

    const res = await fetch(`${CALENDAR_API}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 401 || res.status === 403) {
        return { ok: false, needsReconnect: true, error: text };
      }
      return { ok: false, error: `Google API エラー: ${res.status}` };
    }

    const data = (await res.json()) as { items?: GoogleEvent[] };
    const events: CalendarEvent[] = (data.items ?? []).map((e) => {
      const startRaw = e.start?.dateTime ?? e.start?.date ?? "";
      const endRaw = e.end?.dateTime ?? e.end?.date ?? "";
      const allDay = !e.start?.dateTime;
      return {
        id: e.id,
        title: e.summary ?? "(無題)",
        start: startRaw,
        end: endRaw,
        allDay,
        location: e.location,
        description: e.description,
        attendees: e.attendees?.map((a) => a.email),
        status: e.status,
        htmlLink: e.htmlLink,
      };
    });

    return { ok: true, events };
  } catch (err) {
    console.error("fetchCalendarEventsAction failed", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}

/**
 * 自分のカレンダー連携を解除（refresh_token を NULL に）。
 * 他人のは解除できない（admin であってもプライベートなので NG）
 */
export async function disconnectCalendarAction(
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user: caller },
    } = await supabase.auth.getUser();
    if (!caller) return { ok: false, error: "未ログイン" };
    if (caller.id !== userId) {
      return { ok: false, error: "自分のカレンダーのみ解除できます" };
    }
    const admin = createAdminClient();
    const { error } = await admin
      .from("users")
      .update({ google_refresh_token: null })
      .eq("id", userId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}
