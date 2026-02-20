// src/components/ui/Notification.tsx
"use client";

import React from "react";

export type NotificationType = "success" | "error" | "info";

export interface NotificationProps {
  message: React.ReactNode;          // ← accepte string **ou** JSX
  type?: NotificationType;
  onClose(): void;
  onOk?: () => void;
  okLabel?: string;
}

const HEADINGS: Record<NotificationType, { label: string; color: string }> = {
  success: { label: "Succès",      color: "text-green-600" },
  error:   { label: "Notification", color: "text-red-600"   },
  info:    { label: "Information", color: "text-blue-600"  },
};

export default function Notification({
  message,
  type = "info",
  onClose,
  onOk,
  okLabel = "OK",
}: NotificationProps) {
  const { label, color } = HEADINGS[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-filter backdrop-brightness-75">
      <div className="w-full max-md:w-[90%] p-6 mx-auto bg-white rounded-xl shadow-lg flex flex-col gap-4">
        <h2 className={`text-xl font-bold text-center ${color}`}>{label}</h2>

        {/* message peut contenir du JSX */}
        <div className="text-center text-gray-800 break-words">{message}</div>

        <div className="flex justify-center gap-4">
          {onOk && (
            <button
              onClick={onOk}
              className="mt-2 w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm hover:bg-primary hover:text-white"
            >
              {okLabel}
            </button>
          )}
          <button
            onClick={onClose}
            className="mt-2 w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm hover:bg-primary hover:text-white"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
