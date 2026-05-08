"use client";

import { useEffect, useState } from "react";
import {
  X,
  User,
  Users,
  Calendar,
  TrendingUp,
  BookOpen,
  KeyRound,
  Trash2,
  Pencil,
  Save,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { UserRecord, UserRole } from "@/types";
import { CRMPanel } from "@/components/dashboard/CRMPanel";
import { SchedulePanel } from "@/components/dashboard/SchedulePanel";
import { RevenuePanel } from "@/components/dashboard/RevenuePanel";
import { SheetPanel } from "@/components/sheets/SheetPanel";
import { fmt, fmtFull } from "@/lib/utils";
import {
  useAllUsers,
  useUser,
  broadcastUsersUpdated,
} from "@/lib/user-store";
import { useUserMetrics } from "@/lib/metrics";
import { useAuthedUser } from "@/lib/session";
import {
  deleteEmployeeAction,
  updateEmployeeAction,
} from "@/app/actions/users";
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
  const [editing, setEditing] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDept, setFormDept] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("member");
  const [formManagerId, setFormManagerId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const metrics = useUserMetrics(target?.id);
  // 最新の target を user-store から取得（保存後の表示更新用）
  const liveTarget = useUser(target?.id) ?? target;
  const manager = useUser(liveTarget?.managerId);
  const { users: allUsers } = useAllUsers();
  const { session } = useAuthedUser();

  // 別ユーザーに切り替わったら編集モードを抜ける
  useEffect(() => {
    setEditing(false);
  }, [target?.id]);

  if (!target || !liveTarget) return null;

  const isSelf = session?.userId === liveTarget.id;
  const canDelete = !isSelf && liveTarget.role !== "admin";

  const managerCandidates = allUsers.filter(
    (u) =>
      (u.role === "manager" || u.role === "admin") && u.id !== liveTarget.id,
  );

  const startEdit = () => {
    setFormName(liveTarget.name);
    setFormDept(liveTarget.dept);
    setFormTitle(liveTarget.title ?? "");
    setFormRole(liveTarget.role);
    setFormManagerId(liveTarget.managerId ?? "");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const onSave = async () => {
    if (!formName.trim()) {
      toast.error("氏名を入力してください");
      return;
    }
    setSaving(true);
    try {
      const res = await updateEmployeeAction({
        userId: liveTarget.id,
        fullName: formName.trim(),
        department: formDept.trim(),
        title: formTitle.trim(),
        // 自分自身のロール変更は禁止（降格して操作不能になるのを防止）
        role: isSelf ? undefined : formRole,
        managerId: formManagerId || null,
      });
      if (!res.ok) {
        toast.error(res.error ?? "更新に失敗しました");
        setSaving(false);
        return;
      }
      toast.success("基本情報を更新しました");
      broadcastUsersUpdated();
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新中にエラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  const onConfirmDelete = async () => {
    if (deleteConfirmName.trim() !== liveTarget.name.trim()) {
      toast.error("氏名が一致しません");
      return;
    }
    setDeleting(true);
    try {
      const res = await deleteEmployeeAction(liveTarget.id);
      if (!res.ok) {
        toast.error(res.error ?? "削除に失敗しました");
        setDeleting(false);
        return;
      }
      toast.success(`「${liveTarget.name}」を削除しました`);
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
                background: `${roleColor[liveTarget.role]}15`,
                color: roleColor[liveTarget.role],
                border: `1px solid ${roleColor[liveTarget.role]}30`,
              }}
            >
              {liveTarget.name.charAt(0)}
            </div>
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-[0.15em] text-coral/70">
                Admin View — 基本情報・ロール編集可
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[17px] font-bold text-white">{liveTarget.name}</div>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{
                    background: `${roleColor[liveTarget.role]}15`,
                    color: roleColor[liveTarget.role],
                  }}
                >
                  {roleLabel[liveTarget.role]}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] text-white/40">
                {liveTarget.email}
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
                  {canDelete && !editing && (
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
                  {editing ? (
                    <>
                      <button
                        onClick={cancelEdit}
                        disabled={saving}
                        className="rounded-xl border border-white/15 px-3.5 py-1.5 text-[12px] text-white/70 hover:bg-white/[0.05] disabled:opacity-50"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={onSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 rounded-xl border border-cyan/30 bg-cyan/10 px-3.5 py-1.5 text-[12px] font-bold text-cyan hover:bg-cyan/15 disabled:opacity-50"
                      >
                        <Save size={13} />
                        {saving ? "保存中..." : "保存"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={startEdit}
                        className="flex items-center gap-1.5 rounded-xl border border-cyan/30 bg-cyan/10 px-3.5 py-1.5 text-[12px] font-bold text-cyan hover:bg-cyan/15"
                      >
                        <Pencil size={13} />
                        編集
                      </button>
                      <button
                        onClick={() => setPwReset(true)}
                        className="flex items-center gap-1.5 rounded-xl border border-coral/30 bg-coral/10 px-3.5 py-1.5 text-[12px] font-bold text-coral hover:bg-coral/15"
                      >
                        <KeyRound size={13} />
                        パスワードをリセット
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editing ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <FieldEdit label="氏名 *">
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      disabled={saving}
                      className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-[13px] text-white outline-none focus:border-cyan/40 disabled:opacity-50"
                    />
                  </FieldEdit>
                  <FieldEdit label="メール（変更不可）">
                    <div className="px-3 py-2 text-[13px] text-white/45">
                      {liveTarget.email}
                    </div>
                  </FieldEdit>
                  <FieldEdit label="部署">
                    <input
                      type="text"
                      value={formDept}
                      onChange={(e) => setFormDept(e.target.value)}
                      disabled={saving}
                      placeholder="営業1部"
                      className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-[13px] text-white outline-none focus:border-cyan/40 disabled:opacity-50"
                    />
                  </FieldEdit>
                  <FieldEdit label="役職">
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      disabled={saving}
                      placeholder="セールスエンジニア"
                      className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-[13px] text-white outline-none focus:border-cyan/40 disabled:opacity-50"
                    />
                  </FieldEdit>
                  <FieldEdit
                    label={
                      isSelf
                        ? "ロール（自分自身は変更不可）"
                        : "ロール"
                    }
                  >
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as UserRole)}
                      disabled={saving || isSelf}
                      className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-[13px] text-white outline-none focus:border-cyan/40 disabled:opacity-50"
                    >
                      <option value="member" className="bg-bg-panel">従業員</option>
                      <option value="manager" className="bg-bg-panel">マネージャー</option>
                      <option value="admin" className="bg-bg-panel">管理者</option>
                    </select>
                  </FieldEdit>
                  <FieldEdit label="マネージャー（上司）">
                    <select
                      value={formManagerId}
                      onChange={(e) => setFormManagerId(e.target.value)}
                      disabled={saving}
                      className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-[13px] text-white outline-none focus:border-cyan/40 disabled:opacity-50"
                    >
                      <option value="" className="bg-bg-panel">— 未設定 —</option>
                      {managerCandidates.map((m) => (
                        <option key={m.id} value={m.id} className="bg-bg-panel">
                          {m.name}（{roleLabel[m.role]}）
                        </option>
                      ))}
                    </select>
                  </FieldEdit>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    { label: "氏名", value: liveTarget.name },
                    { label: "メール", value: liveTarget.email },
                    {
                      label: "ロール",
                      value: roleLabel[liveTarget.role],
                      color: roleColor[liveTarget.role],
                    },
                    { label: "部署", value: liveTarget.dept || "—" },
                    { label: "役職", value: liveTarget.title ?? "—" },
                    { label: "マネージャー", value: manager ? manager.name : "—" },
                    { label: "最終ログイン", value: liveTarget.lastLogin },
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
              )}
            </>
          )}

          {tab === "crm" && <CRMPanel userId={liveTarget.id} readonly />}
          {tab === "schedule" && <SchedulePanel userId={liveTarget.id} />}
          {tab === "revenue" && <RevenuePanel userId={liveTarget.id} />}
          {tab === "sheets" && (
            <SheetPanel userId={liveTarget.id} readonly trainerMode />
          )}
        </div>
      </div>

      <ResetPasswordModal
        open={pwReset}
        userId={liveTarget.id}
        userName={liveTarget.name}
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
                <div className="mt-1 text-[14px] font-bold text-white">{liveTarget.name}</div>
                <div className="text-[11px] text-white/45">{liveTarget.email}</div>
                <div className="mt-1.5 text-[10px] text-white/45">
                  ロール: {roleLabel[liveTarget.role]} / 部署: {liveTarget.dept || "—"}
                </div>
              </div>

              <label className="block">
                <div className="mb-1.5 text-[11px] text-white/65">
                  確認のため、対象者の氏名を入力してください:{" "}
                  <span className="font-bold text-red-400">{liveTarget.name}</span>
                </div>
                <input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  disabled={deleting}
                  placeholder={liveTarget.name}
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
                  deleting || deleteConfirmName.trim() !== liveTarget.name.trim()
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

function FieldEdit({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/7 bg-white/[0.03] px-4 py-3">
      <div className="mb-1.5 text-[10px] uppercase tracking-wider text-white/40">
        {label}
      </div>
      {children}
    </div>
  );
}
