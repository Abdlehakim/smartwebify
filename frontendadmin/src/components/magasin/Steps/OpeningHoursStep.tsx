// src/components/magasin/Steps/OpeningHoursStep.tsx
"use client";

import React from "react";
import Link from "next/link";
import { MdAdd, MdDelete } from "react-icons/md";
import {
  FormState,
} from "@/app/dashboard/manage-stock/magasins/update/[magasinId]/page";
import { days, MAX_RANGES } from "@/lib/openingHours";

/* ---------- types ---------- */
interface Props {
  form: FormState;
  toggleDay: (day: string, enabled: boolean) => void;
  setTime: (
    day: string,
    idx: number,
    field: "open" | "close",
    value: string
  ) => void;
  addRange: (day: string) => void;
  removeRange: (day: string, idx: number) => void;
  onBack: () => void;
  onNext: () => void;
}

/* ---------- helpers ---------- */
// Converts “hh:mm AM/PM” ➜ “HH:MM” (keeps 24-hour strings unchanged)
const to24h = (time: string): string => {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time.trim();

  const [, hh, mm, period] = match;
  let h = parseInt(hh, 10);

  if (period.toUpperCase() === "AM") {
    if (h === 12) h = 0;
  } else if (h !== 12) {
    h += 12;
  }

  return `${h.toString().padStart(2, "0")}:${mm}`;
};

/* ---------- component ---------- */
const OpeningHoursStep: React.FC<Props> = ({
  form,
  toggleDay,
  setTime,
  addRange,
  removeRange,
  onBack,
  onNext,
}) => (
  <>
    {/* OPENING HOURS */}
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Opening Hours</h2>

      {days.map((day) => {
        const { enabled, ranges } = form.openingHours[day];
        return (
          <div key={day} className="flex gap-8 items-center">
            {/* toggle */}
            <label className="relative inline-flex cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={enabled}
                onChange={(e) => toggleDay(day, e.target.checked)}
              />
              <div className="w-9 h-5 bg-gray-200 rounded-full peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all" />
            </label>

            <span className="w-24">{day}</span>

            {enabled && ranges.length < MAX_RANGES && (
              <button
                type="button"
                className="ButtonSquare text-gray-700"
                onClick={() => addRange(day)}
                aria-label="Add range"
              >
                <MdAdd size={18} />
              </button>
            )}

            {enabled &&
              ranges.map((r, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {/* open */}
                  <input
                    type="time"
                    className="time24 border border-gray-300 bg-inputcolor rounded px-2 h-8"
                    lang="fr-FR"      
                    step="60"
                    value={to24h(r.open)}
                    onChange={(e) =>
                      setTime(day, idx, "open", e.target.value)
                    }
                  />

                  <span>-</span>

                  {/* close */}
                  <input
                    type="time"
                    className="time24 border border-gray-300 bg-inputcolor rounded px-3 h-8"
                    lang="fr-FR"
                    step="60"
                    value={to24h(r.close)}
                    onChange={(e) =>
                      setTime(day, idx, "close", e.target.value)
                    }
                  />

                  {ranges.length > 1 && (
                    <button
                      type="button"
                      className="ButtonSquare"
                      onClick={() => removeRange(day, idx)}
                      aria-label="Delete range"
                    >
                      <MdDelete size={18} />
                    </button>
                  )}
                </div>
              ))}
          </div>
        );
      })}
    </section>

    {/* NAVIGATION */}
    <div className="flex justify-center gap-8 mt-6">
      <button
        type="button"
        className="px-6 py-2 bg-quaternary text-white rounded"
        onClick={onBack}
      >
        Back
      </button>

      <Link href="/dashboard/manage-stock/magasins">
        <button type="button" className="px-6 py-2 bg-quaternary text-white rounded">
          Cancel
        </button>
      </Link>

      <button
        type="button"
        className="px-6 py-2 bg-tertiary text-white rounded"
        onClick={onNext}
      >
        Next
      </button>
    </div>
  </>
);

export default OpeningHoursStep;
