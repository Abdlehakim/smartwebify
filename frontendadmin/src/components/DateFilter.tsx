"use client";

import React, { useState, useRef, useEffect } from "react";
import { DateRangePicker } from "react-date-range";
import type { Range, StaticRange } from "react-date-range";
import { FaCalendarAlt } from "react-icons/fa";
import fr from "date-fns/locale/fr";
import {
  subDays,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
  isSameDay,
} from "date-fns";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

export type DateRange = { start: Date; end: Date };

interface Props {
  onChange: (range: DateRange) => void;
  initialRange?: DateRange;
}

const frenchStaticRanges: StaticRange[] = [
  {
    label: "Aujourd’hui",
    range: () => ({ startDate: new Date(), endDate: new Date() }),
    isSelected: (range: Range) =>
      Boolean(range.startDate && range.endDate) &&
      isSameDay(range.startDate!, new Date()) &&
      isSameDay(range.endDate!, new Date()),
  },
  {
    label: "Hier",
    range: () => ({
      startDate: subDays(new Date(), 1),
      endDate: subDays(new Date(), 1),
    }),
    isSelected: (range: Range) =>
      Boolean(range.startDate && range.endDate) &&
      isSameDay(range.startDate!, subDays(new Date(), 1)) &&
      isSameDay(range.endDate!, subDays(new Date(), 1)),
  },
  {
    label: "Cette semaine",
    range: () => ({
      startDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
      endDate: endOfWeek(new Date(), { weekStartsOn: 1 }),
    }),
    isSelected: (range: Range) =>
      Boolean(range.startDate && range.endDate) &&
      isSameDay(range.startDate!, startOfWeek(new Date(), { weekStartsOn: 1 })) &&
      isSameDay(range.endDate!, endOfWeek(new Date(), { weekStartsOn: 1 })),
  },
  {
    label: "Semaine dernière",
    range: () => {
      const start = subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1);
      const end = subWeeks(endOfWeek(new Date(), { weekStartsOn: 1 }), 1);
      return { startDate: start, endDate: end };
    },
    isSelected: (range: Range) =>
      Boolean(range.startDate && range.endDate) &&
      isSameDay(
        range.startDate!,
        subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1)
      ) &&
      isSameDay(
        range.endDate!,
        subWeeks(endOfWeek(new Date(), { weekStartsOn: 1 }), 1)
      ),
  },
  {
    label: "Ce mois",
    range: () => ({
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
    }),
    isSelected: (range: Range) =>
      Boolean(range.startDate && range.endDate) &&
      isSameDay(range.startDate!, startOfMonth(new Date())) &&
      isSameDay(range.endDate!, endOfMonth(new Date())),
  },
  {
    label: "Mois dernier",
    range: () => ({
      startDate: subMonths(startOfMonth(new Date()), 1),
      endDate: subMonths(endOfMonth(new Date()), 1),
    }),
    isSelected: (range: Range) =>
      Boolean(range.startDate && range.endDate) &&
      isSameDay(range.startDate!, subMonths(startOfMonth(new Date()), 1)) &&
      isSameDay(range.endDate!, subMonths(endOfMonth(new Date()), 1)),
  },
];

export default function DateFilter({ onChange, initialRange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [rangeSel, setRangeSel] = useState<{
    key: "selection";
    startDate: Date;
    endDate: Date;
  }>({
    key: "selection",
    startDate: initialRange?.start ?? new Date(),
    endDate: initialRange?.end ?? new Date(),
  });

  // Ferme le picker au clic hors composant
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (open && ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const label = `${rangeSel.startDate.toLocaleDateString(
    "fr-FR"
  )} – ${rangeSel.endDate.toLocaleDateString("fr-FR")}`;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 border border-gray-300 rounded px-3 py-2 text-sm hover:bg-green-50 bg-white"
      >
        <FaCalendarAlt />
        <span>{label}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 border border-gray-300 shadow-lg bg-white">
          <DateRangePicker
            staticRanges={frenchStaticRanges}
            inputRanges={[]}
            ranges={[rangeSel]}
            onChange={(ranges) => {
              const { startDate, endDate } = ranges.selection;
              if (startDate && endDate) {
                setRangeSel({ key: "selection", startDate, endDate });
              }
            }}
            months={1}
            direction="horizontal"
            showDateDisplay={false}
            locale={fr}
          />

          <div className="flex justify-end gap-2 p-2">
            <button
              onClick={() => setOpen(false)}
              className="rounded border border-gray-300 px-4 py-2 text-xs hover:bg-primary hover:text-white"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                const end = new Date(rangeSel.endDate);
                end.setHours(23, 59, 59, 999);
                onChange({ start: rangeSel.startDate, end });
                setOpen(false);
              }}
              className="rounded border border-gray-300 px-4 py-2 text-xs hover:bg-primary hover:text-white "
            >
              Appliquer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
