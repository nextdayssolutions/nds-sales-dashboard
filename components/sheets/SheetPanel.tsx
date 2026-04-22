"use client";

import { useState } from "react";
import type { SheetKind } from "@/types";
import { SHEET_META } from "@/lib/curriculum-data";
import { VisionSheetPanel } from "./VisionSheet";
import { GoalSheetPanel } from "./GoalSheet";
import { DevelopmentSheetPanel } from "./DevelopmentSheet";
import { OneOnOneSheetPanel } from "./OneOnOneSheet";

interface Props {
  userId: string;
  /** owner 以外が開いたとき true */
  readonly?: boolean;
  /** 教育担当 (manager/admin) モードで育成シートの「教育担当」列、1on1の「コメント」欄を編集可 */
  trainerMode?: boolean;
  defaultKind?: SheetKind;
}

const KINDS: SheetKind[] = ["vision", "goal", "development", "oneonone"];

export function SheetPanel({ userId, readonly, trainerMode, defaultKind = "vision" }: Props) {
  const [active, setActive] = useState<SheetKind>(defaultKind);

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-white/7 bg-white/[0.02] p-1.5">
        {KINDS.map((k) => {
          const meta = SHEET_META[k];
          const isActive = active === k;
          return (
            <button
              key={k}
              onClick={() => setActive(k)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-medium transition"
              style={{
                background: isActive ? meta.tint : "transparent",
                color: isActive ? meta.color : "rgba(255,255,255,0.5)",
                fontWeight: isActive ? 700 : 500,
              }}
            >
              <span>{meta.emoji}</span>
              <span className="hidden sm:inline">{meta.label}</span>
              <span className="sm:hidden">{meta.label.slice(0, 4)}</span>
            </button>
          );
        })}
      </div>

      <div key={`${userId}-${active}`} className="animate-fade-up">
        {active === "vision" && (
          <VisionSheetPanel userId={userId} readonly={readonly} />
        )}
        {active === "goal" && (
          <GoalSheetPanel userId={userId} readonly={readonly} />
        )}
        {active === "development" && (
          <DevelopmentSheetPanel
            userId={userId}
            readonly={readonly && !trainerMode}
            trainerMode={readonly ? trainerMode : false}
          />
        )}
        {active === "oneonone" && (
          <OneOnOneSheetPanel
            userId={userId}
            readonly={readonly}
            commenterMode={trainerMode}
          />
        )}
      </div>
    </div>
  );
}
