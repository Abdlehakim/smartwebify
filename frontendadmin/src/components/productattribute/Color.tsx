// src/components/productattribute/Color.tsx
"use client";

import React from "react";
import Image from "next/image";
import { FiPlus, FiImage } from "react-icons/fi";
import { MdDelete } from "react-icons/md";

/* ------------------------------------------------------------------ */
/* Types & helpers                                                    */
/* ------------------------------------------------------------------ */
export interface ColorPair {
  name: string;
  hex: string;
  image?: string;
}

interface Props {
  colors: ColorPair[];
  onChange: (next: ColorPair[]) => void;
  onFileSelect: (file: File, fieldName: string) => void;
  onRowDelete?: (fieldName: string) => void;
  attributeIndex: number;
}

const makeKey = (attrIdx: number, rowIdx: number) =>
  `attributeImages-${attrIdx}-${rowIdx}`;

const normalizeHex = (val: string): string => {
  let h = val.trim();
  if (!h) return "";
  if (!h.startsWith("#")) h = `#${h}`;
  const m3 = /^#([0-9a-fA-F]{3})$/.exec(h);
  if (m3) {
    const [r, g, b] = m3[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  const m6 = /^#([0-9a-fA-F]{6})$/.exec(h);
  return m6 ? `#${m6[1].toLowerCase()}` : h.toLowerCase();
};

const isValidHex6 = (h: string) => /^#[0-9a-f]{6}$/i.test(h);

export default function Color({
  colors,
  onChange,
  onFileSelect,
  onRowDelete = () => {},
  attributeIndex,
}: Props) {
  const update = (i: number, field: keyof ColorPair, val: string) => {
    const next = [...colors];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };

  const setHex = (i: number, val: string, doNormalize = false) => {
    const hex = doNormalize ? normalizeHex(val) : val;
    update(i, "hex", hex);
  };

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

  const addRow = () =>
    onChange([...colors, { name: "", hex: "#000000", image: "" }]);

  const removeRow = (i: number) => {
    if (colors.length <= 1) return;
    onRowDelete(makeKey(attributeIndex, i));
    onChange(colors.filter((_, idx) => idx !== i));
  };

  return (
    <div className="flex flex-col rounded p-2">
      <div className="grid grid-cols-8 gap-3 text-xs font-semibold text-gray-600 bg-white px-2 py-2 sticky top-0 z-10">
        <div className="col-span-4">Nom</div>
        <div className="col-span-2">Couleur</div>
        <div className="col-span-1">Image</div>
        <div className="col-span-1" />
      </div>

      <div className="flex flex-col">
        {colors.map((c, idx) => {
          const canDelete = colors.length > 1;
          const key = makeKey(attributeIndex, idx);
          const normalized = normalizeHex(c.hex);
          const valid = isValidHex6(normalized);
          const swatch = valid ? normalized : "#000000";

          return (
            <div
              key={idx}
              className={`grid grid-cols-8 gap-3 items-center px-2 py-2 rounded ${
                idx % 2 === 0 ? "bg-gray-50" : "bg-white"
              } hover:bg-gray-100`}
            >
              {/* Nom */}
              <input
                className="col-span-4 border px-2 py-1 rounded"
                placeholder="ex. Rouge"
                value={c.name}
                onChange={(e) => update(idx, "name", e.target.value)}
              />

              {/* Couleur: swatch that FILLS the entire box + hex field */}
              <div className="col-span-2 flex items-center gap-3">
                <div className="relative h-10 w-10 rounded-md border border-slate-300 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary">
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: swatch }}
                    aria-hidden="true"
                  />
                  <input
                    type="color"
                    value={swatch}
                    onChange={(e) => setHex(idx, e.target.value, true)}
                    aria-label="Choisir une couleur"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>

            
              </div>

              {/* Image */}
              <div className="col-span-1 flex items-center gap-2">
                {!c.image ? (
                  <label
                    className="flex items-center gap-1 text-gray-600 cursor-pointer hover:text-blue-600"
                    title="Téléverser une image"
                  >
                    <FiImage className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      name={key}
                      onChange={(e) =>
                        e.target.files?.[0] && selectImage(idx, e.target.files[0])
                      }
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative w-8 h-8 group rounded overflow-hidden border">
                    <Image
                      src={c.image}
                      alt="Aperçu"
                      width={32}
                      height={32}
                      className="object-cover w-8 h-8"
                    />
                    <button
                      type="button"
                      onClick={() => clearImage(idx)}
                      title="Supprimer l'image"
                      className="absolute inset-0 bg-white/80 text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                        <MdDelete size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Supprimer */}
              <div className="col-span-1 flex justify-end">
                <button
                  type="button"
                  title={
                    canDelete ? "Supprimer la couleur" : "Au moins une couleur requise"
                  }
                  disabled={!canDelete}
                  onClick={() => removeRow(idx)}
                  className={`w-fit border border-gray-300 p-1 text-sm flex items-center gap-4 hover:bg-red-600 hover:text-white cursor-pointer bg-white rounded-full ${
                    canDelete
                      ? "text-red-600 hover:bg-red-50"
                      : "text-gray-400 cursor-not-allowed"
                  }`}
                >
                <MdDelete size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
<div className="flex justify-end ">
      <button
        type="button"
        onClick={addRow}
        className="mt-2 w-fit rounded-md border border-gray-300 px-4 py-2.5 text-xs flex items-center gap-2 hover:bg-primary hover:text-white cursor-pointer"
      >
        <FiPlus /> Ajouter
      </button></div>
    </div>
  );
}
