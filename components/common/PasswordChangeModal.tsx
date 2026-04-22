"use client";

import { FormEvent, useState } from "react";
import { KeyRound, X, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ModalPortal } from "./ModalPortal";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * ログイン中のユーザーが自分のパスワードを変更するモーダル。
 * Supabase の auth.updateUser を使用するため、メール/追加認証は不要。
 */
export function PasswordChangeModal({ open, onClose }: Props) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pw.length < 8) {
      toast.error("パスワードは 8 文字以上にしてください");
      return;
    }
    if (pw !== pw2) {
      toast.error("パスワードが一致しません");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("パスワードを変更しました");
    setPw("");
    setPw2("");
    onClose();
  };

  return (
    <ModalPortal>
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)" }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md animate-fade-up rounded-3xl border border-cyan/20 bg-bg-panel p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.15em] text-cyan/70">
              Change Password
            </div>
            <h2 className="text-lg font-extrabold">パスワードを変更</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
          >
            <X size={13} />
          </button>
        </div>

        <label className="mb-3 block">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">
            新しいパスワード *
          </div>
          <div className="flex gap-1.5">
            <input
              type={show ? "text" : "password"}
              required
              minLength={8}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="8文字以上"
              autoComplete="new-password"
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] font-mono text-white outline-none focus:border-cyan/40"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="flex-shrink-0 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 text-white/60 hover:bg-white/[0.06]"
              title={show ? "隠す" : "表示"}
            >
              {show ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
        </label>

        <label className="mb-5 block">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">
            確認のためもう一度 *
          </div>
          <input
            type={show ? "text" : "password"}
            required
            minLength={8}
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="もう一度入力"
            autoComplete="new-password"
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] font-mono text-white outline-none focus:border-cyan/40"
          />
        </label>

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
            className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-[12px] font-bold text-white shadow-[0_4px_20px_rgba(0,212,255,0.3)] disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #00D4FF 0%, #7B5EA7 100%)" }}
          >
            {submitting ? <KeyRound size={13} /> : <Check size={13} />}
            {submitting ? "変更中..." : "変更する"}
          </button>
        </div>
      </form>
    </div>
    </ModalPortal>
  );
}
