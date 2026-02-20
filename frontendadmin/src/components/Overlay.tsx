// src/components/Overlay.tsx
"use client";

import React from "react";

interface OverlayProps {
  show: boolean;
  /** Shown text (FR by default) */
  message?: string;
}

/**
 * Covers ONLY the parent container (use on a relative parent).
 * White veil + centered message, no spinner.
 */
export default function Overlay({
  show,
  message = "Le produit est en cours de création…",
}: OverlayProps) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 bg-white/95 flex items-center justify-center">
      <div className="px-4 py-3 text-xl font-medium text-secondary">
        {message}
      </div>
    </div>
  );
}
