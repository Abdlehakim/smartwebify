// src/components/Popup/ErrorPopup.tsx
import React from "react";

interface ErrorPopupProps {
  message: string;
  onClose: () => void;
}

export default function ErrorPopup({ message, onClose }: ErrorPopupProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-no-repeat bg-center bg-cover
                 backdrop-filter backdrop-brightness-75"
    >
      <div className="w-full max-w-md p-6 mx-auto bg-white rounded-xl shadow-lg flex flex-col gap-4">
        <h2 className="text-xl font-bold text-center text-red-600">Notification !</h2>
        <p className="text-center text-gray-800">{message}</p>
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-tertiary text-white rounded hover:bg-hoverButton transition"
          >
            fermer
          </button>
        </div>
      </div>
    </div>
  );
}
