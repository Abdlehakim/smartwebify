// src/components/menu/FooterVisibilityController.tsx
"use client";

import { useEffect } from "react";
import { useFooterLock } from "@/contexts/FooterLockContext";

export default function FooterVisibilityController() {
  const { locked } = useFooterLock();

  useEffect(() => {
    const el = document.getElementById("footer-container");
    if (!el) return;
    el.style.display = locked ? "none" : "";
  }, [locked]);

  return null;
}
