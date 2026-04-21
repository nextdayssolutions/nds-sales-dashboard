import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fmt = (n: number) => (n === 0 ? "—" : `¥${(n / 10000).toFixed(0)}万`);

export const fmtFull = (n: number) => `¥${n.toLocaleString()}`;

export const fmtDate = (date: Date = new Date()) => {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const wd = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
  return `${y}年${m}月${d}日 (${wd})`;
};
