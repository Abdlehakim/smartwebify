/* ------------------------------------------------------------------
   src/app/dashboard/delivery-options/create/page.tsx
------------------------------------------------------------------ */
"use client";

import React, { useState, FormEvent, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { FaSpinner } from "react-icons/fa6";

/* ---------- form state ---------- */
interface FormData {
  name: string;
  description: string;
  price: string;          // hold as string for controlled input
  estimatedDays: string;
  isActive: boolean;
  isPickup: boolean;      // ⇦ NEW
}

export default function CreateDeliveryOptionPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    name: "",
    description: "",
    price: "",
    estimatedDays: "",
    isActive: true,
    isPickup: false,      // ⇦ NEW
  });
  const [submitting, setSubmitting] = useState(false);

  /* ---------- handlers ---------- */
  const handleInput = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name } = e.target;
    const value =
      e.target instanceof HTMLInputElement && e.target.type === "checkbox"
        ? e.target.checked
        : e.target.value;

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSubmitting(true);
    try {
      await fetchFromAPI("/dashboardadmin/delivery-options/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          estimatedDays: form.isPickup ? 0 : Number(form.estimatedDays), // ⇦ NEW
        }),
      });
      router.push("/dashboard/delivery-options");
    } catch (err) {
      console.error("Create delivery option failed:", err);
      alert("Failed to create delivery option.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- render ---------- */
  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-6">
      {/* Header */}
      <header className="flex h-16 items-start">
        <h1 className="text-3xl font-bold uppercase">Add Delivery Option</h1>
      </header>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-8 max-w-4xl mx-auto"
      >
        {/* Row 1 */}
        <div className="flex flex-wrap gap-8">
          <div className="flex flex-col gap-1 w-72">
            <label htmlFor="name" className="font-medium">
              Name*
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleInput}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div className="flex flex-col gap-1 w-72">
            <label htmlFor="price" className="font-medium">
              Price (e.g. 9.99)*
            </label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              value={form.price}
              onChange={handleInput}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div className="flex flex-col gap-1 w-72">
            <label htmlFor="estimatedDays" className="font-medium">
              Estimated Days*
            </label>
            <input
              id="estimatedDays"
              name="estimatedDays"
              type="number"
              min="0"
              required={!form.isPickup}             // ⇦ NEW
              disabled={form.isPickup}             // ⇦ NEW
              value={form.estimatedDays}
              onChange={handleInput}
              className="border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100"
            />
          </div>
        </div>

        {/* Row 2: Description */}
        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={250}
            value={form.description}
            onChange={handleInput}
            className="border border-gray-300 rounded px-3 py-2 resize-none"
          />
        </div>

        {/* Flags */}
        <div className="flex flex-wrap gap-8">
          {/* isActive */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleInput}
              className="accent-primary h-4 w-4"
            />
            <span className="font-medium">Active</span>
          </label>

          {/* isPickup  ⇦ NEW */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isPickup"
              checked={form.isPickup}
              onChange={handleInput}
              className="accent-primary h-4 w-4"
            />
            <span className="font-medium">Pickup (customer collects in store)</span>
          </label>
        </div>

        {/* CTA */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-40 h-10 bg-tertiary text-white rounded hover:opacity-90 flex items-center justify-center gap-2"
          >
            {submitting && <FaSpinner className="animate-spin" />} Create
          </button>
          <Link href="/dashboard/delivery-options" className="w-40">
            <button
              type="button"
              className="w-full h-10 bg-quaternary text-white rounded hover:opacity-90"
            >
              Cancel
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}
