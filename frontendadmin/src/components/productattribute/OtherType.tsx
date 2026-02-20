// src/components/productattribute/OtherType.tsx
"use client";

import React from "react";
import Image from "next/image";
import { FiPlus, FiX, FiImage } from "react-icons/fi";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
export interface OtherPair {
  name: string;
  value: string;
  image?: string;          // preview URL
}

const makeKey = (attrIdx: number, rowIdx: number) =>
  `attributeImages-${attrIdx}-${rowIdx}`;

/* ------------------------------------------------------------------ */
/* Props                                                              */
/* ------------------------------------------------------------------ */
interface Props {
  pairs: OtherPair[];
  onChange: (next: OtherPair[]) => void;

  /* image plumbing */
  onFileSelect: (file: File, fieldName: string) => void;
  onRowDelete: (fieldName: string) => void;
  attributeIndex: number;
}

/* =================================================================== */
export default function OtherType({
  pairs,
  onChange,
  onFileSelect,
  onRowDelete,
  attributeIndex,
}: Props) {
  /* ------------ helpers ------------ */
  const update = (i: number, field: keyof OtherPair, val: string) => {
    const next = [...pairs];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };

  const addRow = () =>
    onChange([...pairs, { name: "", value: "", image: "" }]);

  const removeRow = (i: number) => {
    if (pairs.length <= 1) return;
    onRowDelete(makeKey(attributeIndex, i));
    onChange(pairs.filter((_, idx) => idx !== i));
  };

  /* ------------ image handlers ------------ */
  const selectImage = (rowIdx: number, file: File) => {
    const key = makeKey(attributeIndex, rowIdx);
    onFileSelect(file, key);
    update(rowIdx, "image", URL.createObjectURL(file));
  };

  const clearImage = (rowIdx: number) => {
    const key = makeKey(attributeIndex, rowIdx);
    onRowDelete(key);
    update(rowIdx, "image", "");
  };

  /* ------------------------------------------------------------------ */
  /* render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div className="flex flex-col border rounded p-2">
      {/* header */}
      <div className="flex gap-2 text-xs font-semibold text-gray-600 bg-white px-2 py-1 sticky top-0 z-10">
        <div className="flex-1">Name</div>
        <div className="flex-1">Value</div>
        <div className="w-20 text-center">Image</div>
        <div className="w-6" />
      </div>

      {/* rows */}
      <div className="flex flex-col">
        {pairs.map((row, i) => (
          <div
            key={i}
            className={`flex gap-2 items-center px-2 py-2 ${
              i % 2 === 0 ? "bg-gray-50" : ""
            } hover:bg-gray-100`}
          >
            {/* name */}
            <input
              className="flex-1 border px-2 py-1 rounded"
              placeholder="e.g. Material"
              value={row.name}
              onChange={(e) => update(i, "name", e.target.value)}
            />

            {/* value */}
            <input
              className="flex-1 border px-2 py-1 rounded"
              placeholder="e.g. Cotton"
              value={row.value}
              onChange={(e) => update(i, "value", e.target.value)}
            />

            {/* image */}
            <div className="w-20 flex justify-center items-center relative">
              {!row.image && (
                <label
                  className="text-gray-600 cursor-pointer hover:text-blue-600"
                  title="Upload image"
                >
                  <FiImage className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/*"
                    name={makeKey(attributeIndex, i)}
                    onChange={(e) =>
                      e.target.files?.[0] &&
                      selectImage(i, e.target.files[0])
                    }
                    className="hidden"
                  />
                </label>
              )}

              {row.image && (
                <div className="relative w-10 h-10 group rounded overflow-hidden border">
                  <Image
                    src={row.image}
                    alt="Preview"
                    width={40}
                    height={40}
                    className="object-cover w-10 h-10"
                  />
                  <button
                    type="button"
                    onClick={() => clearImage(i)}
                    title="Remove image"
                    className="absolute inset-0 bg-white/80 text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* delete row */}
            <button
              type="button"
              onClick={() => removeRow(i)}
              disabled={pairs.length <= 1}
              title={
                pairs.length <= 1
                  ? "At least one value is required"
                  : "Remove row"
              }
              className={
                pairs.length <= 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-red-600"
              }
            >
              <FiX />
            </button>
          </div>
        ))}
      </div>

      {/* add row */}
      <button
        type="button"
        onClick={addRow}
        className="mt-2 text-blue-600 flex items-center gap-1 text-sm hover:underline"
      >
        <FiPlus /> add row
      </button>
    </div>
  );
}
