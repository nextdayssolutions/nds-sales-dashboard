"use client";

import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import type { UserRole } from "@/types";
import { useMockSession } from "@/lib/session";

interface Props {
  allow: UserRole[];
  children: ReactNode;
}

export function RoleGuard({ allow, children }: Props) {
  const router = useRouter();
  const { session, loaded } = useMockSession();

  useEffect(() => {
    if (!loaded) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (!allow.includes(session.role)) {
      router.replace("/dashboard");
    }
  }, [loaded, session, allow, router]);

  if (!loaded || !session || !allow.includes(session.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-white/40">
        <div className="animate-pulse text-sm">読み込み中...</div>
      </div>
    );
  }

  return <>{children}</>;
}
