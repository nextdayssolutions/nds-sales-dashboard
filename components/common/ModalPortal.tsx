"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * モーダルを document.body に差し込むポータル。
 * 祖先に `transform` / `filter` / `perspective` がついていると
 * `position: fixed` がそれを基準にしてしまうので、ビューポート基準で
 * 配置したいオーバーレイはこの Portal で包む。
 */
export function ModalPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
