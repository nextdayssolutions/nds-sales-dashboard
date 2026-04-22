"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

export interface CreateEmployeeInput {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  department?: string;
  title?: string;
  managerId?: string;
}

export interface CreateEmployeeResult {
  ok: boolean;
  error?: string;
  userId?: string;
}

/**
 * 新規従業員を作成する。
 * - 呼び出し元が admin ロールかをまず検証
 * - service_role で auth.users に作成（email_confirm = true）
 * - handle_new_user トリガーが public.users を同期生成
 */
export async function createEmployeeAction(
  input: CreateEmployeeInput,
): Promise<CreateEmployeeResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user: caller },
    } = await supabase.auth.getUser();
    if (!caller) return { ok: false, error: "未ログイン" };

    const { data: callerProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", caller.id)
      .maybeSingle();
    if (callerProfile?.role !== "admin") {
      return { ok: false, error: "権限がありません（admin 専用）" };
    }

    const email = input.email.trim().toLowerCase();
    if (!email) return { ok: false, error: "メールアドレスが必要です" };
    if (!input.password || input.password.length < 8) {
      return { ok: false, error: "パスワードは 8 文字以上にしてください" };
    }
    if (!input.fullName.trim()) {
      return { ok: false, error: "氏名が必要です" };
    }

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName.trim(),
        role: input.role,
        department: input.department || null,
        title: input.title || null,
        manager_id: input.managerId || null,
      },
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    const newId = data.user?.id;
    if (!newId) {
      return { ok: false, error: "ユーザー作成に失敗しました" };
    }

    // 監査ログ
    await supabase.from("audit_logs").insert({
      actor_id: caller.id,
      action: "create_user",
      target_id: newId,
      details: {
        email,
        role: input.role,
        full_name: input.fullName.trim(),
      },
    });

    return { ok: true, userId: newId };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "作成中にエラーが発生しました",
    };
  }
}

export interface UpdateEmployeeInput {
  userId: string;
  fullName?: string;
  department?: string;
  title?: string;
  role?: UserRole;
  managerId?: string | null;
  isActive?: boolean;
}

/**
 * 管理者が既存ユーザーを更新する。
 * RLS の users_admin_all ポリシーで自動的に admin だけ成功する。
 */
export async function updateEmployeeAction(
  input: UpdateEmployeeInput,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user: caller },
    } = await supabase.auth.getUser();
    if (!caller) return { ok: false, error: "未ログイン" };

    const { data: callerProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", caller.id)
      .maybeSingle();
    if (callerProfile?.role !== "admin") {
      return { ok: false, error: "権限がありません" };
    }

    const patch: Record<string, unknown> = {};
    if (input.fullName !== undefined) patch.full_name = input.fullName;
    if (input.department !== undefined) patch.department = input.department || null;
    if (input.title !== undefined) patch.title = input.title || null;
    if (input.role !== undefined) patch.role = input.role;
    if (input.managerId !== undefined) patch.manager_id = input.managerId || null;
    if (input.isActive !== undefined) patch.is_active = input.isActive;

    const { error } = await supabase
      .from("users")
      .update(patch)
      .eq("id", input.userId);
    if (error) {
      return { ok: false, error: error.message };
    }

    await supabase.from("audit_logs").insert({
      actor_id: caller.id,
      action: "update_user",
      target_id: input.userId,
      details: patch,
    });

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "更新中にエラーが発生しました",
    };
  }
}

/**
 * admin が他ユーザーのパスワードをリセット。
 * service_role で auth.admin.updateUserById を叩く。
 */
export async function resetEmployeePasswordAction(
  userId: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!newPassword || newPassword.length < 8) {
      return { ok: false, error: "パスワードは 8 文字以上にしてください" };
    }
    const supabase = await createClient();
    const {
      data: { user: caller },
    } = await supabase.auth.getUser();
    if (!caller) return { ok: false, error: "未ログイン" };

    const { data: callerProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", caller.id)
      .maybeSingle();
    if (callerProfile?.role !== "admin") {
      return { ok: false, error: "権限がありません" };
    }

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (error) return { ok: false, error: error.message };

    await supabase.from("audit_logs").insert({
      actor_id: caller.id,
      action: "reset_password",
      target_id: userId,
    });

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "リセット中にエラーが発生しました",
    };
  }
}

/**
 * ユーザーを完全削除（auth.users → トリガーで public.users も CASCADE 削除）
 */
export async function deleteEmployeeAction(
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user: caller },
    } = await supabase.auth.getUser();
    if (!caller) return { ok: false, error: "未ログイン" };
    if (caller.id === userId) {
      return { ok: false, error: "自分自身は削除できません" };
    }

    const { data: callerProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", caller.id)
      .maybeSingle();
    if (callerProfile?.role !== "admin") {
      return { ok: false, error: "権限がありません" };
    }

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      return { ok: false, error: error.message };
    }

    await supabase.from("audit_logs").insert({
      actor_id: caller.id,
      action: "delete_user",
      target_id: userId,
    });

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "削除中にエラーが発生しました",
    };
  }
}
