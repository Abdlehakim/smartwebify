// src/app/dashboard/manage-stock/magasins/update/[magasinId]/page.tsx
"use client";

import React, {
  useEffect,
  useRef,
  useState,
  ChangeEvent,
  FormEvent,
} from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import Stepper from "@/components/Stepper";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";

/* ---------- helper types ---------- */
export interface TimeRange {
  open: string;
  close: string;
}
export interface DayState {
  enabled: boolean;
  ranges: TimeRange[];
}
export interface FormState {
  name: string;
  phoneNumber: string;
  address: string;
  city: string;
  localisation: string;
  image: File | null;
  openingHours: Record<string, DayState>;
}
export type TextFieldKey =
  | "name"
  | "phoneNumber"
  | "address"
  | "city"
  | "localisation";

/* ---------- constants ---------- */
const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const MAX_RANGES = 3;

/* ---------- steps ---------- */
import DetailsStep from "@/components/magasin/Steps/DetailsStep";
import OpeningHoursStep from "@/components/magasin/Steps/OpeningHoursStep";
import ReviewStep from "@/components/magasin/Steps/ReviewStep";

export default function UpdateMagasinPage() {
  const router = useRouter();
  const params = useParams<{ magasinId: string }>();
  const magasinId = params.magasinId;
  const fileInput = useRef<HTMLInputElement | null>(null);

  /* ---------- ui state ---------- */
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  /* ---------- data state ---------- */
  const [initialImageUrl, setInitialImageUrl] = useState("");
  const [form, setForm] = useState<FormState>({
    name: "",
    phoneNumber: "",
    address: "",
    city: "",
    localisation: "",
    image: null,
    openingHours: Object.fromEntries(
      days.map((d) => [
        d,
        { enabled: false, ranges: [{ open: "09:00", close: "17:00" }] },
      ])
    ) as Record<string, DayState>,
  });

  /* ---------- load magasin ---------- */
  useEffect(() => {
    async function load() {
      try {
        const b = await fetchFromAPI<{
          name: string;
          phoneNumber?: string;
          address?: string;
          city?: string;
          localisation?: string;
          image: string;
          openingHours: Record<string, TimeRange[]>;
        }>(`/dashboardadmin/stock/magasins/${magasinId}`);

        setInitialImageUrl(b.image);

        /* openingHours → DayState */
        const oh: Record<string, DayState> = {};
        for (const d of days) {
          const ranges = b.openingHours[d] ?? [];
          oh[d] = {
            enabled: ranges.length > 0,
            ranges:
              ranges.length > 0
                ? ranges
                : [{ open: "09:00", close: "17:00" }],
          };
        }

        setForm((prev) => ({
          ...prev,
          name: b.name,
          phoneNumber: b.phoneNumber ?? "",
          address: b.address ?? "",
          city: b.city ?? "",
          localisation: b.localisation ?? "",
          openingHours: oh,
        }));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load magasin."
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [magasinId]);

  /* ---------- generic setters ---------- */
  const onText = (e: ChangeEvent<HTMLInputElement>) => {
    const key = e.target.name as TextFieldKey;
    setForm((p) => ({ ...p, [key]: e.target.value }));
  };
  const onFile = (e: ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, image: e.target.files?.[0] ?? null }));
  const clearImage = () => {
    setForm((p) => ({ ...p, image: null }));
    if (fileInput.current) fileInput.current.value = "";
  };
  const toggleDay = (day: string, enabled: boolean) =>
    setForm((p) => ({
      ...p,
      openingHours: { ...p.openingHours, [day]: { ...p.openingHours[day], enabled } },
    }));
  const setTime = (
    day: string,
    idx: number,
    field: "open" | "close",
    value: string
  ) =>
    setForm((p) => {
      const next = { ...p.openingHours[day] };
      next.ranges[idx] = { ...next.ranges[idx], [field]: value };
      return { ...p, openingHours: { ...p.openingHours, [day]: next } };
    });
  const addRange = (day: string) =>
    setForm((p) => {
      const next = { ...p.openingHours[day] };
      if (next.ranges.length < MAX_RANGES)
        next.ranges = [...next.ranges, { open: "09:00", close: "17:00" }];
      return { ...p, openingHours: { ...p.openingHours, [day]: next } };
    });
  const removeRange = (day: string, idx: number) =>
    setForm((p) => {
      const next = { ...p.openingHours[day] };
      next.ranges = next.ranges.filter((_, i) => i !== idx);
      return { ...p, openingHours: { ...p.openingHours, [day]: next } };
    });

  /* ---------- submit ---------- */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("phoneNumber", form.phoneNumber.trim());
      fd.append("address", form.address.trim());
      fd.append("city", form.city.trim());
      fd.append("localisation", form.localisation.trim());
      if (form.image) fd.append("image", form.image);

      const oh: Record<string, TimeRange[]> = {};
      for (const d of days) {
        if (form.openingHours[d].enabled) {
          oh[d] = form.openingHours[d].ranges;
        }
      }
      fd.append("openingHours", JSON.stringify(oh));

      await fetchFromAPI(`/dashboardadmin/stock/magasins/update/${magasinId}`, {
        method: "PUT",
        body: fd,
      });

      setShowSuccess(true);
      setSubmitting(false);
      setTimeout(() => router.push("/dashboard/manage-stock/magasins"), 2000);
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Failed to update magasin.");
    }
  };

  if (loading) return ;

  return (
    <div className="w-[80%] mx-auto flex flex-col gap-6 p-4 relative h-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Update Magasin</h1>
        <nav className="text-sm underline flex items-center gap-2">
          <Link
            href="/dashboard/manage-stock/magasins"
            className="text-gray-500 hover:underline"
          >
            All Magasins
          </Link>
          <span className="text-gray-700 font-medium">/ Update</span>
        </nav>
      </div>

      <Stepper
        steps={["Details", "Opening Hours", "Review"]}
        currentStep={step}
        onStepClick={(s) => setStep(s as 1 | 2 | 3)}
      />

      {/* ---------- FORM & STEPS ---------- */}
      <form
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="flex flex-col gap-8 h-full"
      >
        {step === 1 && (
          <DetailsStep
            form={form}
            initialImageUrl={initialImageUrl}
            onText={onText}
            onFile={onFile}
            clearImage={clearImage}
            fileInput={fileInput}
            submitting={submitting}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <OpeningHoursStep
            form={form}
            toggleDay={toggleDay}
            setTime={setTime}
            addRange={addRange}
            removeRange={removeRange}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <ReviewStep
            form={form}
            initialImageUrl={initialImageUrl}
            onBack={() => setStep(2)}
            submitting={submitting}
          />
        )}
      </form>

      {/* ---------- overlays & errors ---------- */}
      <Overlay
        show={submitting || showSuccess}
        message={showSuccess ? "Magasin updated successfully" : undefined}
      />
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </div>
  );
}
