"use client";

import { Check } from "lucide-react";

interface FieldProps {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readonly?: boolean;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  accent?: string;
}

export function Field({
  label,
  value,
  onChange,
  readonly,
  placeholder,
  multiline,
  rows = 3,
  accent = "rgba(255,255,255,0.1)",
}: FieldProps) {
  return (
    <label className="block">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">
        {label}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readonly}
          placeholder={placeholder}
          rows={rows}
          className="w-full resize-none rounded-lg border px-3 py-2 text-[13px] text-white placeholder-white/25 outline-none focus:border-white/30"
          style={{
            background: "rgba(255,255,255,0.03)",
            borderColor: accent,
          }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readonly}
          placeholder={placeholder}
          className="w-full rounded-lg border px-3 py-2 text-[13px] text-white placeholder-white/25 outline-none focus:border-white/30"
          style={{
            background: "rgba(255,255,255,0.03)",
            borderColor: accent,
          }}
        />
      )}
    </label>
  );
}

interface CheckProps {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
  color?: string;
}

export function EvalCheck({
  checked,
  onChange,
  disabled,
  label,
  color = "#00E5A0",
}: CheckProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange?.(!checked)}
      disabled={disabled}
      className="flex items-center gap-1.5 text-[11px] transition disabled:cursor-not-allowed"
      style={{
        color: checked ? color : "rgba(255,255,255,0.4)",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <span
        className="flex h-4 w-4 items-center justify-center rounded border-[1.5px] transition-colors"
        style={{
          borderColor: checked ? color : "rgba(255,255,255,0.2)",
          background: checked ? color : "transparent",
        }}
      >
        {checked && <Check size={10} color="#0a0e1a" strokeWidth={3} />}
      </span>
      {label && <span>{label}</span>}
    </button>
  );
}

export function ReadOnlyBanner({ note }: { note?: string }) {
  return (
    <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[11px] text-white/55">
      🔒 閲覧専用モード — {note ?? "このシートはメンバー本人のみ編集できます。"}
    </div>
  );
}
