"use client";

import { useState } from "react";
import { Search, Users as UsersIcon } from "lucide-react";
import type { UserRecord, UserRole } from "@/types";
import { useAllUsers } from "@/lib/user-store";
import { UserDetailModal } from "./UserDetailModal";
import { UserRowProgress } from "./UserRowProgress";

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

export function UserTable() {
  const { users, loaded } = useAllUsers();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [detailTarget, setDetailTarget] = useState<UserRecord | null>(null);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.includes(search) || u.email.includes(search);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="rounded-3xl border border-white/7 bg-white/[0.03] p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            type="text"
            placeholder="名前・メールで検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.05] py-2.5 pl-9 pr-4 text-[13px] text-white outline-none focus:border-cyan/40"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          className="rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-[13px] text-white outline-none"
        >
          <option value="all" className="bg-bg">全ロール</option>
          <option value="admin" className="bg-bg">管理者</option>
          <option value="manager" className="bg-bg">マネージャー</option>
          <option value="member" className="bg-bg">従業員</option>
        </select>
      </div>

      {loaded && users.length === 0 ? (
        <div className="rounded-2xl border border-white/7 bg-white/[0.02] py-16 text-center">
          <UsersIcon size={32} className="mx-auto mb-3 text-white/20" />
          <div className="text-[13px] text-white/50">
            まだ従業員が登録されていません
          </div>
          <div className="mt-1.5 text-[11px] text-white/35">
            「従業員を招待」ボタンから追加してください
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate" style={{ borderSpacing: "0 6px" }}>
            <thead>
              <tr className="text-left text-[11px] text-white/40">
                <th className="px-3 pb-2">従業員</th>
                <th className="px-3 pb-2">部署 / ロール</th>
                <th className="px-3 pb-2">今月達成率</th>
                <th className="px-3 pb-2">担当</th>
                <th className="px-3 pb-2">今月売上</th>
                <th className="px-3 pb-2">育成計画進捗</th>
                <th className="px-3 pb-2">最終1on1</th>
                <th className="px-3 pb-2">最終ログイン</th>
                <th className="px-3 pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="bg-white/[0.03]">
                  <td className="rounded-l-xl px-3 py-3.5">
                    <div className="text-[13px] font-semibold text-white">{u.name}</div>
                    <div className="mt-0.5 text-[11px] text-white/35">{u.email}</div>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="text-xs text-white/70">{u.dept}</div>
                    <span
                      className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px]"
                      style={{
                        background: `${roleColor[u.role]}15`,
                        color: roleColor[u.role],
                        border: `1px solid ${roleColor[u.role]}30`,
                      }}
                    >
                      {roleLabel[u.role]}
                    </span>
                  </td>
                  <UserRowProgress userId={u.id} />
                  <td className="px-3 py-3.5 text-[11px] text-white/40">
                    {u.lastLogin}
                  </td>
                  <td className="rounded-r-xl px-3 py-3.5">
                    <button
                      onClick={() => setDetailTarget(u)}
                      className="rounded-lg border border-white/15 bg-transparent px-2.5 py-1.5 text-[11px] text-white/60 transition hover:border-coral/30 hover:bg-coral/5 hover:text-coral"
                    >
                      詳細
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-right text-[11px] text-white/40">
        {filtered.length} / {users.length} 件表示
      </div>

      <UserDetailModal target={detailTarget} onClose={() => setDetailTarget(null)} />
    </div>
  );
}
