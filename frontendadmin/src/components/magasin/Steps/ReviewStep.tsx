"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FormState } from "@/app/dashboard/manage-stock/magasins/update/[magasinId]/page"; // ← adjust if path differs
import { days } from "@/lib/openingHours";

interface Props {
  form: FormState;
  initialImageUrl: string;
  onBack: () => void;
  submitting: boolean;
}

const ReviewStep: React.FC<Props> = ({
  form,
  initialImageUrl,
  onBack,
  submitting,
}) => {
  return (
    <>
      {/* review */}
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Review Details</h2>

        {/* details */}
        <div className="flex gap-8 justify-between w-[60%]">
          <div className="space-y-2">
            <div>
              <strong>Name:</strong> {form.name}
            </div>
            <div>
              <strong>Phone:</strong> {form.phoneNumber}
            </div>
            <div>
              <strong>Address:</strong> {form.address}
            </div>
            <div>
              <strong>City:</strong> {form.city}
            </div>
            <div>
              <strong>Localisation:</strong> {form.localisation}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <strong>Image:</strong>
            {(form.image || initialImageUrl) && (
              <Image
                src={
                  form.image ? URL.createObjectURL(form.image) : initialImageUrl
                }
                alt="Preview"
                width={100}
                height={150}
                className="object-cover rounded"
              />
            )}
          </div>
        </div>

        {/* opening hours */}
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold">Opening Hours:</h3>
          <ul className="list-disc pl-6">
            {days.map((day) => {
              const { enabled, ranges } = form.openingHours[day];
              return enabled ? (
                <li key={day}>
                  <strong>{day}:</strong>{" "}
                  {ranges.map((r) => `${r.open}-${r.close}`).join(", ")}
                </li>
              ) : null;
            })}
          </ul>
        </div>
      </section>

      {/* navigation */}
      <div className="flex justify-center gap-8">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 bg-quaternary text-white rounded"
        >
          Back
        </button>
        <Link href="/dashboard/manage-stock/magasins">
          <button
            type="button"
            className="px-6 py-2 bg-quaternary text-white rounded"
          >
            Cancel
          </button>
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-tertiary text-white rounded"
        >
          {submitting ? "Updating..." : "Update Magasin"}
        </button>
      </div>
    </>
  );
};

export default ReviewStep;
