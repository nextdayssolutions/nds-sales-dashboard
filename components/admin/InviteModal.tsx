"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

const FIELDS: { key: string; label: string; placeholder: string; type: string }[] = [
  { key: "email", label: "メールアドレス", placeholder: "tanaka@example.co.jp", type: "email" },
  { key: "name", label: "氏名", placeholder: "田中 誠司", type: "text" },
  { key: "dept", label: "部署", placeholder: "営業1部", type: "text" },
];

export function InviteModal({ open, onClose }: Props) {
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("招待メールを送信しました（モック）");
      onClose();
    }, 600);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-5"
      style={{
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="w-full max-w-[440px] animate-fade-up rounded-3xl border border-cyan/20 bg-bg-panel p-7 shadow-2xl"
      >
        <div className="mb-1.5 text-[11px] uppercase tracking-[0.15em] text-cyan/70">
          Invite New Employee
        </div>
        <h2 className="mb-5 text-xl font-extrabold">従業員を招待</h2>

        <div className="flex flex-col gap-3.5">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="mb-1.5 block text-[11px] text-white/50">{f.label}</label>
              <input
                name={f.key}
                type={f.type}
                placeholder={f.placeholder}
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-[13px] text-white outline-none focus:border-cyan/40"
              />
            </div>
          ))}
          <div>
            <label className="mb-1.5 block text-[11px] text-white/50">ロール</label>
            <select
              name="role"
              defaultValue="member"
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-[13px] text-white outline-none"
            >
              <option value="member" className="bg-bg-panel">従業員</option>
              <option value="manager" className="bg-bg-panel">マネージャー</option>
              <option value="admin" className="bg-bg-panel">管理者</option>
            </select>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-cyan/15 bg-cyan/[0.06] px-3.5 py-2.5 text-[11px] text-white/60">
          💡 Google Workspace SSO が有効です。本人は Google アカウントでログインします（パスワード設定不要）。
        </div>

        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/15 bg-transparent py-3 text-[13px] text-white/70 transition hover:bg-white/[0.05]"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-[2] rounded-xl py-3 text-[13px] font-bold text-white shadow-[0_4px_20px_rgba(0,212,255,0.3)] transition disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #00D4FF 0%, #7B5EA7 100%)",
            }}
          >
            {submitting ? "送信中..." : "招待メールを送信"}
          </button>
        </div>
      </form>
    </div>
  );
}
