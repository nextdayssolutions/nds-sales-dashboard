import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  variant?: "member" | "admin" | "manager";
  maxWidth?: "default" | "wide";
}

const variantStyles = {
  member: {
    grid: "rgba(0,212,255,0.03)",
    orb: "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)",
  },
  manager: {
    grid: "rgba(255,184,48,0.025)",
    orb: "radial-gradient(circle, rgba(255,184,48,0.055) 0%, transparent 70%)",
  },
  admin: {
    grid: "rgba(255,107,107,0.02)",
    orb: "radial-gradient(circle, rgba(255,107,107,0.05) 0%, transparent 70%)",
  },
};

export function AppShell({ children, variant = "member", maxWidth = "default" }: Props) {
  const { grid: gridColor, orb: orbTopRight } = variantStyles[variant];
  const orbBottomLeft =
    "radial-gradient(circle, rgba(123,94,167,0.07) 0%, transparent 70%)";

  return (
    <div className="relative min-h-screen bg-bg text-white">
      {/* Background grid */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />
      {/* Glow orbs */}
      <div
        aria-hidden
        className="pointer-events-none fixed -right-48 -top-48 z-0 h-[600px] w-[600px] rounded-full"
        style={{ background: orbTopRight }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -bottom-48 -left-48 z-0 h-[500px] w-[500px] rounded-full"
        style={{ background: orbBottomLeft }}
      />

      <div
        className={cn(
          "relative z-10 mx-auto px-5 py-6",
          maxWidth === "wide" ? "max-w-[1200px]" : "max-w-[1100px]"
        )}
      >
        {children}
      </div>
    </div>
  );
}
