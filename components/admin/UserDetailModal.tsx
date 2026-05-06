"use client";

import { useState } from "react";
import {
  X,
  User,
  Users,
  Calendar,
  TrendingUp,
  BookOpen,
  KeyRound,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { UserRecord, UserRole } from "@/types";
import { CRMPanel } from "@/components/dashboard/CRMPanel";
import { SchedulePanel } from "@/components/dashboard/SchedulePanel";
import { RevenuePanel } from "@/components/dashboard/RevenuePanel";
import { SheetPanel } from "@/components/sheets/SheetPanel";
import { fmt, fmtFull } from "@/lib/utils";
import { useUser, broadcastUsersUpdated } from "@/lib/user-store";
import { useUserMetrics } from "@/lib/metrics";
import { useAuthedUser } from "@/lib/session";
import { deleteEmployeeAction } from "@/app/actions/users";
import { ResetPasswordModal } from "./ResetPasswordModal";
import { ModalPortal } from "@/components/common/ModalPortal";

interface Props {
  target: UserRecord | null;
  onClose: () => void;
}

type Tab = "info" | "crm" | "schedule" | "revenue" | "sheets";

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "info", label: "基本情報", icon: User },
  { id: "crm", label: "CRM", icon: Users },
  { id: "schedule", label: "スケジュール", icon: Calendar },
  { id: "revenue", label: "売上管理", icon: TrendingUp },
  { id: "sheets", label: "自己管理", icon: BookOpen },
];

const roleLabel: Record<UserRole, string> = {
  admin: "管理者",
  manager: "マネージャー",
  member: "従業員",
};
const roleColor: Record<UserRole, string> = {
  admin: "#FF6B6B",
  manager: "#FFB830",
  member: "#00D4FF",
};
export function UserDetailModal({ target, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("info");
  const [pwReset, setPwReset] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const metrics = useUserMetrics(target?.id);
  const manager = useUser(target?.managerId);
  const { session } = useAuthedUser();
  if (!target) return null;

  const isSelf = session?.userId === target.id;
  const canDelete = !isSelf && target.role !== "admin";

  const onConfirmDelete = async () => {
    if (deleteConfirmName.trim() !== target.name.trim()) {
      toast.error("氏名が一致しません");
      return;
    }
    setDeleting(true);
    try {
      const res = await deleteEmployeeAction(target.id);
      if (!res.ok) {
        toast.error(res.error ?? "削除に失敗しました");
        setDeleting(false);
        return;
      }
      toast.success(`「${target.name}」を削除しました`);
      broadcastUsersUpdated();
      setDeleteConfirmOpen(false);
      setDeleteConfirmName("");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "削除中にエラーが発生しました");
      setDeleting(false);
    }
  };

  return (
    <ModalPortal>
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-6xl animate-fade-up flex-col overflow-hidden rounded-3xl border border-white/15 bg-bg-panel shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold"
              style={{
                background: `${roleColor[target.role]}15`,
                color: roleColor[target.role],
                border: `1px solid ${roleColor[target.role]}30`,
              }}
            >
              {target.name.charAt(0)}
            </div>
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-[0.15em] text-coral/70">
                Admin View — 閲覧・教育担当コメントのみ編集可
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[17px] font-bold text-white">{target.name}</div>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{
                    background: `${roleColor[target.role]}15`,
                    color: roleColor[target.role],
                  }}
                >
                  {roleLabel[target.role]}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] text-white/40">
                {target.email}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
          >
            <X size={15} />
          </button>
        </div>

        <div className="border-b border-white/10 px-6 pt-4">
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex items-center gap-1.5 rounded-t-xl px-4 py-2.5 text-[12px] font-medium transition"
                  style={{
                    background: active ? "rgba(255,107,107,0.10)" : "transparent",
                    color: active ? "#FF6B6B" : "rgba(255,255,255,0.45)",
                    borderBottom: active
                      ? "2px solid #FF6B6B"
                      : "2px solid transparent",
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  <Icon size={13} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {tab === "info" && (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  {canDelete && (
                    <button
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-[12px] font-bold text-red-400 hover:bg-red-500/15"
                    >
                      <Trash2 size={13} />
                      従業員を削除
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPwReset(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-coral/30 bg-coral/10 px-3.5 py-1.5 text-[12px] font-bold text-coral hover:bg-coral/15"
                  >
                    <KeyRound size={13} />
                    パスワードをリセット
                  </button>
                </div>
              </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { label: "氏名", value: target.name },
                { label: "メール", value: target.email },
                {
                  label: "ロール",
                  value: roleLabel[target.role],
                  color: roleColor[target.role],
                },
                { label: "部署", value: target.dept },
                { label: "役職", value: target.title ?? "—" },
                { label: "マネージャー", value: manager ? manager.name : "—" },
                { label: "最終ログイン", value: target.lastLogin },
                {
                  label: "担当顧客",
                  value:
                    metrics.customerCount > 0
                      ? `${metrics.customerCount}社`
                      : "—",
                },
                {
                  label: "今月売上",
                  value:
                    metrics.monthRevenue > 0 ? fmt(metrics.monthRevenue) : "—",
                },
                {
                  label: "今月達成率",
                  value:
                    metrics.monthAchievement !== null
                      ? `${metrics.monthAchievement}%`
                      : "—",
                },
                {
                  label: "年間累計",
                  value:
                    metrics.yearRevenue > 0
                      ? fmtFull(metrics.yearRevenue)
                      : "—",
                },
                {
                  label: "年間達成率",
                  value:
                    metrics.yearAchievement !== null
                      ? `${metrics.yearAchievement}%`
                      : "—",
                },
                {
                  label: "育成計画進捗",
                  value: `${metrics.trainingProgress}% (${metrics.trainingDone}/${metrics.trainingTotal})`,
                },
              ].map((f) => (
                <div
                  key={f.label}
                  className="rounded-xl border border-white/7 bg-white/[0.03] px-4 py-3"
                >
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">
                    {f.label}
                  </div>
                  <div
                    className="text-[13px] font-semibold"
                    style={{ color: f.color ?? "#fff" }}
                  >
                    {f.value}
                  </div>
                </div>
              ))}
            </div>
            </>
          )}

          {tab === "crm" && <CRMPanel userId={target.id} readonly />}
          {tab === "schedule" && <SchedulePanel userId={target.id} />}
          {tab === "revenue" && <RevenuePanel userId={target.id} />}
          {tab === "sheets" && (
            <SheetPanel userId={target.id} readonly trainerMode />
          )}
        </div>
      </div>

      <ResetPasswordModal
        open={pwReset}
        userId={target.id}
        userName={target.name}
        onClose={() => setPwReset(false)}
      />

      {deleteConfirmOpen && (
        <div
          onClick={() => !deleting && setDeleteConfirmOpen(false)}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md animate-fade-up overflow-hidden rounded-3xl border border-red-500/30 bg-bg-panel shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-red-400">
                  <Trash2 size={11} />
                  Danger Zone
                </div>
                <h3 className="text-[16px] font-extrabold text-white">
                  従業員を完全削除
                </h3>
              </div>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-40"
              >
                <X size={14} />
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/[0.08] p-3.5 text-[12px] leading-relaxed text-white/80">
                <div className="mb-1 font-bold text-red-400">⚠️ この操作は元に戻せません</div>
                以下のデータが恒久的に削除されます:
                <ul className="mt-2 ml-4 list-disc space-y-0.5 text-white/65">
                  <li>ログインアカウント (auth.users)</li>
                  <li>プロフィール情報</li>
                  <li>担当顧客データ ({metrics.customerCount}社)</li>
                  <li>売上レコード</li>
                  <li>自己管理シート（理念・目標・育成・1on1・日報）</li>
                  <li>Google カレンダー連携情報</li>
                </ul>
              </div>

              <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[12px]">
                <div className="text-white/45">対象</div>
                <div className="mt-1 text-[14px] font-bold text-white">{target.name}</div>
                <div className="text-[11px] text-white/45">{target.email}</div>
                <div className="mt-1.5 text-[10px] text-white/45">
                  ロール: {roleLabel[target.role]} / 部署: {target.dept || "—"}
                </div>
              </div>

              <label className="block">
                <div className="mb-1.5 text-[11px] text-white/65">
                  確認のため、対象者の氏名を入力してください:{" "}
                  <span className="font-bold text-red-400">{target.name}</span>
                </div>
                <input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  disabled={deleting}
                  placeholder={target.name}
                  className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-white outline-none transition focus:border-red-500/50 disabled:opacity-50"
                  autoFocus
                />
              </label>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteConfirmOpen(false)}
                className="rounded-xl border border-white/15 px-4 py-2 text-[12px] text-white/70 hover:bg-white/[0.05] disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={
                  deleting || deleteConfirmName.trim() !== target.name.trim()
                }
                onClick={onConfirmDelete}
                className="flex items-center gap-1.5 rounded-xl bg-red-500 px-5 py-2 text-[12px] font-bold text-white shadow-[0_4px_16px_rgba(239,68,68,0.4)] transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-500/40 disabled:shadow-none"
              >
                <Trash2 size={13} />
                {deleting ? "削除中..." : "完全削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ModalPortal>
  );
}
