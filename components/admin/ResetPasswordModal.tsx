"use client";

import { FormEvent, useState } from "react";
import { Copy, RefreshCw, X, Eye, EyeOff, KeyRound, Check } from "lucide-react";
import { toast } from "sonner";
import { resetEmployeePasswordAction } from "@/app/actions/users";
import { ModalPortal } from "@/components/common/ModalPortal";

interface Props {
  open: boolean;
  userId: string | null;
  userName?: string;
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

export function ResetPasswordModal({ open, userId, userName, onClose }: Props) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(true);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!open || !userId) return null;

  const regenerate = () => {
    setPw(generatePassword(16));
    setCopied(false);
  };

  const copyPw = async () => {
    if (!pw) return;
    try {
      await navigator.clipboard.writeText(pw);
      setCopied(true);
      toast.success("コピーしました");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("コピーに失敗しました");
    }
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pw.length < 8) {
      toast.error("パスワードは 8 文字以上にしてください");
      return;
    }
    setSubmitting(true);
    const res = await resetEmployeePasswordAction(userId, pw);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error ?? "リセットに失敗しました");
      return;
    }
    toast.success(
      `${userName ?? "ユーザー"} のパスワードをリセットしました。本人に新しいパスワードを伝えてください`,
    );
    setPw("");
    setCopied(false);
    onClose();
  };

  return (
    <ModalPortal>
    <div
      onClick={onClose}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md animate-fade-up rounded-3xl border border-coral/30 bg-bg-panel p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.15em] text-coral/80">
              Reset Password (admin)
            </div>
            <h2 className="text-lg font-extrabold">パスワードをリセット</h2>
            {userName && (
              <div className="mt-1 text-[12px] text-white/50">
                対象: <span className="text-white">{userName}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
          >
            <X size={13} />
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-coral/20 bg-coral/[0.08] px-3.5 py-2.5 text-[11px] leading-relaxed text-white/70">
          ⚠️ このユーザーの既存ログインセッションは自動で失効しません。対象本人に新しいパスワードを伝え、再ログインを促してください。
        </div>

        <div className="mb-5">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider text-white/40">
              新しいパスワード *
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
              type={show ? "text" : "password"}
              required
              minLength={8}
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setCopied(false);
              }}
              placeholder="手入力 or 「自動生成」"
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] font-mono text-white outline-none focus:border-coral/40"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="flex-shrink-0 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 text-white/60 hover:bg-white/[0.06]"
              title={show ? "隠す" : "表示"}
            >
              {show ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <button
              type="button"
              onClick={copyPw}
              disabled={!pw}
              className="flex-shrink-0 rounded-lg border border-cyan/30 bg-cyan/10 px-2.5 text-cyan hover:bg-cyan/15 disabled:opacity-40"
              title="コピー"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
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
            className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-[12px] font-bold text-white shadow-[0_4px_20px_rgba(255,107,107,0.3)] disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #FF6B6B 0%, #7B5EA7 100%)" }}
          >
            <KeyRound size={13} />
            {submitting ? "リセット中..." : "リセット実行"}
          </button>
        </div>
      </form>
    </div>
    </ModalPortal>
  );
}
