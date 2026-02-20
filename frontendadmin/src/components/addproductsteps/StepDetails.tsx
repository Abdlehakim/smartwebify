// ───────────────────────────────────────────────────────────────
// src/components/addproductsteps/StepDetails.tsx
// ───────────────────────────────────────────────────────────────
"use client";

import React, { ChangeEvent } from "react";
import Image from "next/image";
import { MdDelete } from "react-icons/md";
import { PiImage } from "react-icons/pi";
import type { ProductForm } from "@/app/dashboard/manage-stock/products/create/page";

interface Props {
  form: ProductForm;
  onFixed: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  mainImage: File | null;
  extraImages: File[];
  chooseMain: () => void;
  chooseExtra: () => void;
  clearMain: () => void;
  removeExtra: (index: number) => void;
  existingMainImageUrl?: string | null;
  existingExtraImagesUrls?: string[];
  loading?: boolean;
}

const Skel = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export default function StepDetails({
  form,
  onFixed,
  mainImage,
  extraImages,
  chooseMain,
  chooseExtra,
  clearMain,
  removeExtra,
  existingMainImageUrl = null,
  existingExtraImagesUrls = [],
  loading = false,
}: Props) {
  const labels: Record<keyof Pick<ProductForm, "name" | "info" | "description">, string> = {
    name: "Nom",
    info: "Infos",
    description: "Description",
  };

  if (loading) {
    return (
      <section className="flex flex-col md:flex-row gap-6 h-full">
        <div className="flex flex-col gap-4 w-full md:w-1/2 h-full px-6">
          <Skel className="h-4 w-24" />
          <Skel className="h-10 w-full" />
          <Skel className="h-4 w-20" />
          <Skel className="h-10 w-3/4" />
          <Skel className="h-4 w-28" />
          <Skel className="h-full w-full" />
        </div>
        <div className="flex flex-col gap-4 w-1/2 h-full">
          <Skel className="h-full w-full" />
          <Skel className="h-full w-full" />
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col md:flex-row gap-6 h-full">
      <div className="flex flex-col gap-4 w-full md:w-1/2 h-full px-6">
        {(["name", "info", "description"] as const).map((k) => (
          <label key={k} className={"flex flex-col gap-1 " + (k === "description" ? "flex-1" : "")}>
            <span className="text-sm font-medium">{labels[k]}</span>
            {k === "description" ? (
              <textarea
                name={k}
                value={form[k]}
                onChange={onFixed}
                className="border-2 border-gray-300 rounded px-3 py-2 flex-1 h-full resize-none"
              />
            ) : (
              <input
                name={k}
                value={form[k]}
                onChange={onFixed}
                required={k === "name"}
                className="border-2 border-gray-300 rounded h-10 px-3"
              />
            )}
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-4 w-full md:w-1/2 h-full px-6">
        <div
          onClick={chooseMain}
          className="relative border-2 border-gray-300 rounded-lg h-full md:h-1/2 cursor-pointer hover:border-gray-400 transition"
        >
          <div className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
            <PiImage size={24} />
          </div>

          {mainImage ? (
            <div className="relative w-full h-full rounded overflow-hidden">
              <Image src={URL.createObjectURL(mainImage)} alt="Aperçu principal" fill className="object-cover" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearMain();
                }}
                className="w-fit border border-gray-300 p-1 text-sm flex items-center gap-4 hover:bg-red-600 hover:text-white cursor-pointer absolute top-1 right-1 bg-white rounded-full"
              >
                <MdDelete size={16} />
              </button>
            </div>
          ) : existingMainImageUrl ? (
            <div className="relative w-full h-full rounded overflow-hidden">
              <Image src={existingMainImageUrl} alt="Image principale actuelle" fill className="object-cover" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearMain();
                }}
                className="w-fit border border-gray-300 p-1 text-sm flex items-center gap-4 hover:bg-red-600 hover:text-white cursor-pointer absolute top-1 right-1 bg-white rounded-full"
              >
                <MdDelete size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-70 md:h-full text-gray-400 text-center">
              Cliquez pour importer
              <br />
              Image principale
            </div>
          )}
        </div>

        <div
          onClick={chooseExtra}
          className="relative border-2 border-gray-300 rounded-lg md:h-1/2 cursor-pointer hover:border-gray-400 transition h-full"
        >
          <div className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
            <PiImage size={24} />
          </div>

          <div className="flex flex-wrap items-start gap-2 p-2 overflow-auto h-70 md:h-full">
            {existingExtraImagesUrls.map((url, idx) => (
              <div key={idx} className="relative w-[80px] h-[100px] rounded overflow-hidden">
                <Image src={url} alt={`Supplémentaire ${idx + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeExtra(idx);
                  }}
                  className="w-fit border border-gray-300 p-1 text-sm flex items-center gap-4 hover:bg-red-600 hover:text-white cursor-pointer absolute top-1 right-1 bg-white rounded-full"
                >
                  <MdDelete size={16} />
                </button>
              </div>
            ))}

            {extraImages.map((file, i) => {
              const idx = i + existingExtraImagesUrls.length;
              return (
                <div key={idx} className="relative w-[80px] h-[100px] rounded overflow-hidden">
                  <Image src={URL.createObjectURL(file)} alt={`Nouvelle image supplémentaire ${i + 1}`} fill className="object-cover" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeExtra(idx);
                    }}
                    className="w-fit border border-gray-300 p-1 text-sm flex items-center gap-4 hover:bg-red-600 hover:text-white cursor-pointer absolute top-1 right-1 bg-white rounded-full"
                  >
                    <MdDelete size={16} />
                  </button>
                </div>
              );
            })}

            {existingExtraImagesUrls.length + extraImages.length === 0 && (
              <div className="flex items-center justify-center w-full h-full text-gray-400 text-center">
                Cliquez pour importer
                <br />
                Images supplémentaires
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
