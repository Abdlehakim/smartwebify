"use client";

import React, { ChangeEvent, RefObject } from "react";
import Link from "next/link";
import Image from "next/image";
import { MdDelete } from "react-icons/md";
import { PiImage } from "react-icons/pi";
import {
  FormState,
} from "@/app/dashboard/manage-stock/magasins/update/[magasinId]/page";
import { textFieldIds } from "@/lib/magasinFields";

interface Props {
  form: FormState;
  initialImageUrl: string;
  onText: (e: ChangeEvent<HTMLInputElement>) => void;
  onFile: (e: ChangeEvent<HTMLInputElement>) => void;
  clearImage: () => void;
  fileInput: RefObject<HTMLInputElement | null>;
  submitting: boolean;
  onNext: () => void;
}

const DetailsStep: React.FC<Props> = ({
  form,
  initialImageUrl,
  onText,
  onFile,
  clearImage,
  fileInput,
  submitting,
  onNext,
}) => {
  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* details (nouvelle mise en page)                                   */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex gap-4 max-xl:flex-col">
        {/* ---------------- zone textes ---------------- */}
        <div className="flex flex-col gap-4 w-1/2 max-xl:w-full h-full px-6">
          {textFieldIds.map((id) => (
            <label key={id} className="flex flex-col gap-1">
              <span className="text-sm font-medium capitalize">
                {id === "name" ? "Name*" : id}
              </span>
              <input
                name={id}
                value={form[id] as string}
                onChange={onText}
                required={id === "name"}
                className="border-2 border-gray-300 rounded px-3 py-2 bg-inputcolor"
              />
            </label>
          ))}
        </div>

        {/* ---------------- zone image ---------------- */}
        <div className="flex flex-col gap-4 w-1/2 max-xl:w-full">
          {/* input caché */}
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            onChange={onFile}
            className="hidden"
          />

          {/* conteneur clicable */}
          <div
            onClick={() => fileInput.current?.click()}
            className="relative border-2 border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition h-full min-h-[400px]"
          >
            {/* icône en haut à droite */}
            <div className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
              <PiImage size={24} />
            </div>

            {/* contenu */}
            {form.image ? (
              <div className="relative w-full h-full rounded overflow-hidden">
                {/* preview */}
                <Image
                  src={URL.createObjectURL(form.image)}
                  alt="Main Preview"
                  fill
                  className="object-cover"
                />

                {/* bouton suppression */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearImage();
                  }}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-100 transition"
                >
                  <MdDelete size={16} className="text-red-600" />
                </button>
              </div>
            ) : initialImageUrl ? (
              <div className="relative w-full h-full rounded overflow-hidden">
                <Image
                  src={initialImageUrl}
                  alt="Current"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-center px-4">
                Click to upload
                <br />
                Main Image
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* navigation                                                       */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex justify-center gap-8 mt-6">
        <Link href="/dashboard/manage-stock/magasins">
          <button
            type="button"
            className="px-6 py-2 bg-quaternary text-white rounded"
          >
            Cancel
          </button>
        </Link>
        <button
          type="button"
          onClick={onNext}
          disabled={submitting}
          className="px-6 py-2 bg-tertiary text-white rounded"
        >
          Next
        </button>
      </div>
    </>
  );
};

export default DetailsStep;
