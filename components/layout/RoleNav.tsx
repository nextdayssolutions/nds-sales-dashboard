"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, LayoutDashboard, LogOut, ShieldCheck, type LucideIcon } from "lucide-react";
import type { UserRole } from "@/types";
import { clearMockSession } from "@/lib/session";

interface Props {
  role: UserRole;
  current: "dashboard" | "team" | "admin";
}

export function RoleNav({ role, current }: Props) {
  const router = useRouter();

  const logout = () => {
    clearMockSession();
    router.push("/login");
  };

  const links: {
    id: "dashboard" | "team" | "admin";
    label: string;
    href: string;
    icon: LucideIcon;
    colorClass: string;
  }[] = [];

  if (current !== "dashboard") {
    links.push({
      id: "dashboard",
      label: "個人ビュー",
      href: "/dashboard",
      icon: LayoutDashboard,
      colorClass: "hover:border-cyan/30 hover:text-cyan",
    });
  }
  if (role === "manager" && current !== "team") {
    links.push({
      id: "team",
      label: "チーム",
      href: "/team",
      icon: Crown,
      colorClass: "hover:border-amber/30 hover:text-amber",
    });
  }
  if (role === "admin" && current !== "admin") {
    links.push({
      id: "admin",
      label: "Admin",
      href: "/admin",
      icon: ShieldCheck,
      colorClass: "hover:border-coral/30 hover:text-coral",
    });
  }

  return (
    <div className="flex items-center gap-2">
      {links.map((l) => {
        const Icon = l.icon;
        return (
          <Link
            key={l.id}
            href={l.href}
            className={`flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/60 transition ${l.colorClass}`}
          >
            <Icon size={12} />
            {l.label}
          </Link>
        );
      })}
      <button
        onClick={logout}
        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/50 transition hover:border-white/20 hover:text-white/80"
        title="ログアウト"
      >
        <LogOut size={12} />
        ログアウト
      </button>
    </div>
  );
}
