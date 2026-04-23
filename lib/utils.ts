import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fmt = (n: number) => {
  if (n === 0) return "—";
  const man = n / 10000;
  // 整数の場合は小数点を省略、非整数なら小数第1位まで表示
  const s = Number.isInteger(man) ? man.toFixed(0) : man.toFixed(1);
  return `¥${s}万`;
};

export const fmtFull = (n: number) => `¥${n.toLocaleString()}`;

export const fmtDate = (date: Date = new Date()) => {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const wd = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
  return `${y}年${m}月${d}日 (${wd})`;
};
