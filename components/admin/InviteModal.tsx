"use client";

import { FormEvent, useState } from "react";
import { Copy, RefreshCw, UserPlus, Check, Eye, EyeOff, X } from "lucide-react";
import { toast } from "sonner";
import type { UserRole } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

function generatePassword(length = 16): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
  const bytes =
    typeof window !== "undefined" && window.crypto
      ? window.crypto.getRandomValues(new Uint32Array(length))
      : Array.from({ length }, () => Math.floor(Math.random() * 0xffffffff));
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

export function InviteModal({ open, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const regenerate = () => {
    setPassword(generatePassword(16));
    setCopied(false);
  };

  const copyPassword = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast.success("パスワードをコピーしました");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("コピーに失敗しました");
    }
  };

  const resetForm = () => {
    setEmail("");
    setName("");
    setDept("");
    setRole("member");
    setPassword("");
    setCopied(false);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !name.trim() || !password) {
      toast.error("メール・氏名・パスワードを入力してください");
      return;
    }
    if (password.length < 8) {
      toast.error("パスワードは8文字以上にしてください");
      return;
    }
    setSubmitting(true);
    // Phase B: auth.admin.createUser + public.users insert に差し替え
    setTimeout(() => {
      setSubmitting(false);
      toast.success(
        `${name} のアカウントを作成しました（メール・初期パスワードを本人に伝えてください）`
      );
      resetForm();
      onClose();
    }, 500);
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
        className="flex max-h-[92vh] w-full max-w-[480px] animate-fade-up flex-col overflow-hidden rounded-3xl border border-cyan/20 bg-bg-panel shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-white/10 px-7 py-5">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.15em] text-cyan/70">
              Register New Employee
            </div>
            <h2 className="text-xl font-extrabold">従業員を登録</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-5">
          <div className="flex flex-col gap-3">
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">
                メールアドレス *
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tanaka@example.co.jp"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-[13px] text-white outline-none focus:border-cyan/40"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">
                氏名 *
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="田中 誠司"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-[13px] text-white outline-none focus:border-cyan/40"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">
                部署
              </div>
              <input
                type="text"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                placeholder="営業1部"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-[13px] text-white outline-none focus:border-cyan/40"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">
                ロール
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-[13px] text-white outline-none focus:border-cyan/40"
              >
                <option value="member" className="bg-bg-panel">従業員</option>
                <option value="manager" className="bg-bg-panel">マネージャー</option>
                <option value="admin" className="bg-bg-panel">管理者</option>
              </select>
            </label>

            <div className="mt-2">
              <div className="mb-1.5 flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-wider text-white/40">
                  初期パスワード *
                </div>
                <button
                  type="button"
                  onClick={regenerate}
                  className="flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/60 hover:border-cyan/30 hover:text-cyan"
                >
                  <RefreshCw size={10} />
                  自動生成
                </button>
              </div>
              <div className="flex gap-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setCopied(false);
                  }}
                  placeholder="手入力 or 「自動生成」ボタン"
                  minLength={8}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-[13px] font-mono text-white outline-none focus:border-cyan/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="flex-shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 text-white/60 hover:bg-white/[0.06]"
                  title={showPassword ? "隠す" : "表示"}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  type="button"
                  onClick={copyPassword}
                  disabled={!password}
                  className="flex-shrink-0 rounded-xl border border-cyan/30 bg-cyan/10 px-2.5 text-cyan hover:bg-cyan/15 disabled:opacity-40"
                  title="コピー"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <div className="mt-1 text-[10px] text-white/35">
                8文字以上。本人に伝達後、ログイン後に変更を促してください
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-cyan/15 bg-cyan/[0.06] px-3.5 py-2.5 text-[11px] leading-relaxed text-white/60">
            💡 招待メールは送りません。作成後、メアドと初期パスワードを Slack 等で本人に直接伝達してください。
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-7 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 px-4 py-2 text-[12px] text-white/70 hover:bg-white/[0.05]"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-[12px] font-bold text-white shadow-[0_4px_20px_rgba(0,212,255,0.3)] transition disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #00D4FF 0%, #7B5EA7 100%)",
            }}
          >
            <UserPlus size={13} />
            {submitting ? "作成中..." : "アカウントを作成"}
          </button>
        </div>
      </form>
    </div>
  );
}
