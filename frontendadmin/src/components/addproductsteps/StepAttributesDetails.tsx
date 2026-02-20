// ───────────────────────────────────────────────────────────────
// src/components/addproductsteps/StepAttributesDetails.tsx
// ───────────────────────────────────────────────────────────────
"use client";

import React, {
  useEffect,
  useLayoutEffect,      // ← add
  useState,
  useRef,
  useCallback,
  ChangeEvent,
  useMemo,
} from "react";
import Image from "next/image";
import { FiImage } from "react-icons/fi";
import { MdDelete } from "react-icons/md";
import Dimension, { DimPair } from "@/components/productattribute/Dimension";
import Color, { ColorPair } from "@/components/productattribute/Color";
import OtherType, { OtherPair } from "@/components/productattribute/OtherType";
import {FaTrashAlt } from "react-icons/fa";

export type BaseType = "dimension" | "color" | "other type";

export interface AttributeDef {
  _id: string;
  name: string;
  type: BaseType | BaseType[];
}

export interface AttributePayload {
  attributeSelected: string;
  attributeName: string;
  value: string | DimPair[] | ColorPair[] | OtherPair[];
}

export interface ProductDetailPair {
  name: string;
  description?: string;
  image?: string | null;
}

interface Props {
  defs: AttributeDef[];
  initialAttrs?: AttributePayload[];
  initialDetails?: ProductDetailPair[];
  ready?: boolean;
  onChange: (
    attrs: AttributePayload[],
    productDetails: ProductDetailPair[],
    fileMap: Map<string, File>
  ) => void;
}

const hasType = (d: AttributeDef, t: BaseType) =>
  Array.isArray(d.type) ? d.type.includes(t) : d.type === t;

export default function StepAttributesDetails({
  defs,
  initialAttrs = [],
  initialDetails = [],
  ready = true,
  onChange,
}: Props) {
  const initialised = useRef(false);
  const [hydrated, setHydrated] = useState(false); // ← gate first onChange

  // Local UI state
  const [fileMap, setFileMap] = useState<Map<string, File>>(new Map());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [text, setText] = useState<Record<string, string>>({});
  const [dims, setDims] = useState<Record<string, DimPair[]>>({});
  const [colors, setColors] = useState<Record<string, ColorPair[]>>({});
  const [others, setOthers] = useState<Record<string, OtherPair[]>>({});
  const [details, setDetails] = useState<ProductDetailPair[]>([]);
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const btn =
    "w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer";

  /* ----------------------- Hydrate from props (before paint) ----------------------- */
  useLayoutEffect(() => {
    if (!initialised.current && ready && defs.length) {
      const txt: Record<string, string> = {};
      const dms: Record<string, DimPair[]> = {};
      const cls: Record<string, ColorPair[]> = {};
      const oth: Record<string, OtherPair[]> = {};

      defs.forEach((def) => {
        txt[def._id] = "";
        if (hasType(def, "dimension")) dms[def._id] = [{ name: "", value: "" }];
        if (hasType(def, "color")) cls[def._id] = [{ name: "", hex: "#000000" }];
        if (hasType(def, "other type")) oth[def._id] = [{ name: "", value: "" }];
      });

      if (initialAttrs.length) {
        setSelectedIds(initialAttrs.map((a) => a.attributeSelected));
        initialAttrs.forEach((a) => {
          const id = a.attributeSelected;
          const def = defs.find((d) => d._id === id);
          if (!def) return;
          if (typeof a.value === "string") txt[id] = a.value;
          else if (hasType(def, "dimension")) dms[id] = a.value as DimPair[];
          else if (hasType(def, "color")) cls[id] = a.value as ColorPair[];
          else if (hasType(def, "other type")) oth[id] = a.value as OtherPair[];
        });
      }

      setText(txt);
      setDims(dms);
      setColors(cls);
      setOthers(oth);
      setDetails(initialDetails);

      initialised.current = true;
      setHydrated(true); // ← now it’s safe to propagate up
    }
  }, [ready, defs, initialAttrs, initialDetails]);

  /* ----------------------- File map helpers ----------------------- */
  const putFile = useCallback(
    (field: string, file: File) =>
      setFileMap((prev) => {
        const m = new Map(prev);
        m.set(field, file);
        return m;
      }),
    []
  );

  const shiftAttrRowKeys = useCallback((attrIdx: number, removedRowIdx: number) => {
    setFileMap((prev) => {
      const m = new Map<string, File>();
      prev.forEach((file, key) => {
        const mat = key.match(/^attributeImages-(\d+)-(\d+)$/);
        if (!mat) return m.set(key, file);
        const aIdx = Number(mat[1]);
        const rIdx = Number(mat[2]);
        if (aIdx !== attrIdx) return m.set(key, file);
        if (rIdx === removedRowIdx) return;
        if (rIdx > removedRowIdx) m.set(`attributeImages-${aIdx}-${rIdx - 1}`, file);
        else m.set(key, file);
      });
      return m;
    });
  }, []);

  const shiftAttrKeys = useCallback((removedAttrIdx: number) => {
    setFileMap((prev) => {
      const m = new Map<string, File>();
      prev.forEach((file, key) => {
        const mat = key.match(/^attributeImages-(\d+)-(\d+)$/);
        if (!mat) return m.set(key, file);
        const aIdx = Number(mat[1]);
        const rowIdx = Number(mat[2]);
        if (aIdx === removedAttrIdx) return;
        if (aIdx > removedAttrIdx) m.set(`attributeImages-${aIdx - 1}-${rowIdx}`, file);
        else m.set(key, file);
      });
      return m;
    });
  }, []);

  const removeFilesForDetail = useCallback((idx: number) => {
    setFileMap((prev) => {
      const m = new Map<string, File>();
      prev.forEach((file, key) => {
        const mat = key.match(/^detailsImages-(\d+)$/);
        if (!mat || Number(mat[1]) !== idx) m.set(key, file);
      });
      return m;
    });
  }, []);

  const shiftDetailKeys = useCallback((removed: number) => {
    setFileMap((prev) => {
      const m = new Map<string, File>();
      prev.forEach((file, key) => {
        const mat = key.match(/^detailsImages-(\d+)$/);
        if (!mat) return m.set(key, file);
        const dIdx = Number(mat[1]);
        if (dIdx === removed) return;
        if (dIdx > removed) m.set(`detailsImages-${dIdx - 1}`, file);
        else m.set(key, file);
      });
      return m;
    });
  }, []);

  /* ----------------------- Textarea helpers ----------------------- */
  const wrapSelection = (idx: number, before: string, after: string) => {
    const el = textareaRefs.current[idx];
    if (!el) return;
    const { selectionStart, selectionEnd, value } = el;
    const selected = value.slice(selectionStart, selectionEnd);
    const newVal =
      value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd);

    setDetails((prev) => {
      const copy = [...prev];
      copy[idx].description = newVal;
      return copy;
    });

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(selectionStart + before.length, selectionEnd + before.length);
    }, 0);
  };

  const prependLines = (idx: number, prefix: string) => {
    const el = textareaRefs.current[idx];
    if (!el) return;
    const { selectionStart, selectionEnd, value } = el;
    const segment = value.slice(selectionStart, selectionEnd);
    const modified = segment
      .split("\n")
      .map((l) => (l.startsWith(prefix) ? l : prefix + l))
      .join("\n");

    const newVal = value.slice(0, selectionStart) + modified + value.slice(selectionEnd);

    setDetails((prev) => {
      const copy = [...prev];
      copy[idx].description = newVal;
      return copy;
    });

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(selectionStart, selectionStart + modified.length);
    }, 0);
  };

  /* ----------------------- Details handlers ----------------------- */
  const addDetail = () =>
    setDetails((p) => [...p, { name: "", description: "", image: null }]);

  const removeDetail = (i: number) => {
    setDetails((p) => p.filter((_, idx) => idx !== i));
    removeFilesForDetail(i);
    shiftDetailKeys(i);
  };

  /* ----------------------- Build attrs for parent ----------------------- */
  const attrs: AttributePayload[] = useMemo(() => {
    if (!defs.length) return [];
    return selectedIds.map((id) => {
      const def = defs.find((d) => d._id === id)!;
      let value: string | DimPair[] | ColorPair[] | OtherPair[] = "";

      if (hasType(def, "dimension")) value = dims[id] ?? [];
      else if (hasType(def, "color")) value = colors[id] ?? [];
      else if (hasType(def, "other type")) value = others[id] ?? [];
      else value = text[id] ?? "";

      return { attributeSelected: id, attributeName: def.name, value };
    });
  }, [defs, selectedIds, text, dims, colors, others]);

  // Propagate ONLY after hydration to avoid sending attrs=[]
  useEffect(() => {
    if (!hydrated) return;
    onChange(attrs, details, fileMap);
  }, [attrs, details, fileMap, hydrated, onChange]);

  /* ----------------------- UI ----------------------- */
  return (
    <div className="flex flex-col md:flex-row gap-8 w-full">
      <div className="flex flex-col gap-2 w-full md:w-1/2 px-4">
        <legend className="text-2xl font-bold">Attributs</legend>

        <select
          className="w-full border px-2 py-1 rounded mb-4"
          defaultValue=""
          onChange={(e) => {
            const id = e.target.value;
            if (!id) return;
            if (!selectedIds.includes(id)) {
              setSelectedIds((p) => [...p, id]);
              const def = defs.find((d) => d._id === id);
              if (def) {
                if (hasType(def, "dimension") && !dims[id])
                  setDims((d) => ({ ...d, [id]: [{ name: "", value: "" }] }));
                if (hasType(def, "color") && !colors[id])
                  setColors((c) => ({ ...c, [id]: [{ name: "", hex: "#000000" }] }));
                if (hasType(def, "other type") && !others[id])
                  setOthers((o) => ({ ...o, [id]: [{ name: "", value: "" }] }));
                if (
                  !hasType(def, "dimension") &&
                  !hasType(def, "color") &&
                  !hasType(def, "other type") &&
                  text[id] === undefined
                ) {
                  setText((t) => ({ ...t, [id]: "" }));
                }
              }
            }
            e.target.value = "";
          }}
        >
          <option value="">-- choisir un attribut --</option>
          {defs
            .filter((d) => !selectedIds.includes(d._id))
            .map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
        </select>

        <div className="space-y-6">
          {selectedIds.length === 0 && (
            <p className="text-sm text-gray-500">Aucun attribut sélectionné.</p>
          )}

          {selectedIds.map((id, attrIdx) => {
            const def = defs.find((d) => d._id === id)!;

            return (
              <div key={id} className="border rounded p-4 space-y-2">
                <div className="flex h-16 justify-between items-start">
                  <h4 className="font-semibold">{def.name}</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
                      setText((t) => {
                        const c = { ...t };
                        delete c[id];
                        return c;
                      });
                      setDims((d) => {
                        const c = { ...d };
                        delete c[id];
                        return c;
                      });
                      setColors((c0) => {
                        const c = { ...c0 };
                        delete c[id];
                        return c;
                      });
                      setOthers((o0) => {
                        const o = { ...o0 };
                        delete o[id];
                        return o;
                      });
                      shiftAttrKeys(attrIdx);
                    }}
                    className={btn}
                  >
                    Supprimer
                  </button>
                </div>

                {hasType(def, "dimension") && (
                  <Dimension
                    pairs={dims[id] ?? []}
                    attributeIndex={attrIdx}
                    onChange={(list) => setDims((d) => ({ ...d, [id]: list }))}
                    onFileSelect={(file, field) => putFile(field, file)}
                    onRowDelete={(field) => {
                      setFileMap((prev) => {
                        const m = new Map(prev);
                        m.delete(field);
                        return m;
                      });
                      const m = field.match(/^attributeImages-(\d+)-(\d+)$/);
                      if (m) shiftAttrRowKeys(Number(m[1]), Number(m[2]));
                    }}
                  />
                )}

                {hasType(def, "color") && (
                  <Color
                    colors={colors[id] ?? []}
                    attributeIndex={attrIdx}
                    onChange={(list) => setColors((c) => ({ ...c, [id]: list }))}
                    onFileSelect={(file, field) => putFile(field, file)}
                    onRowDelete={(field) => {
                      setFileMap((prev) => {
                        const m = new Map(prev);
                        m.delete(field);
                        return m;
                      });
                      const m = field.match(/^attributeImages-(\d+)-(\d+)$/);
                      if (m) shiftAttrRowKeys(Number(m[1]), Number(m[2]));
                    }}
                  />
                )}

                {hasType(def, "other type") && (
                  <OtherType
                    pairs={others[id] ?? []}
                    attributeIndex={attrIdx}
                    onChange={(list) => setOthers((o) => ({ ...o, [id]: list }))}
                    onFileSelect={(file, field) => putFile(field, file)}
                    onRowDelete={(field) => {
                      setFileMap((prev) => {
                        const m = new Map(prev);
                        m.delete(field);
                        return m;
                      });
                      const m = field.match(/^attributeImages-(\d+)-(\d+)$/);
                      if (m) shiftAttrRowKeys(Number(m[1]), Number(m[2]));
                    }}
                  />
                )}

                {!hasType(def, "dimension") &&
                  !hasType(def, "color") &&
                  !hasType(def, "other type") && (
                    <input
                      className="w-full border px-2 py-1 rounded"
                      placeholder={`Saisir ${def.name}`}
                      value={text[id] || ""}
                      onChange={(e) => setText((t) => ({ ...t, [id]: e.target.value }))}
                    />
                  )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full  md:w-1/2 px-4">
        <legend className="text-2xl font-bold">Détails du produit</legend>

        <div className="space-y-4">
          {details.map((d, i) => (
            <div key={i} className="border rounded p-4 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 border px-2 py-1 rounded"
                  placeholder="Nom du détail"
                  value={d.name}
                  onChange={(e) =>
                    setDetails((prev) => {
                      const c = [...prev];
                      c[i].name = e.target.value;
                      return c;
                    })
                  }
                />
                <button type="button" onClick={() => removeDetail(i)} className="ButtonSquare">
          <FaTrashAlt size={14} />
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => wrapSelection(i, "**", "**")}
                    className={btn}
                    title="Gras"
                  >
                    Gras
                  </button>
                  <button
                    type="button"
                    onClick={() => prependLines(i, "- ")}
                    className={btn}
                    title="Liste à puces"
                  >
                    • Liste
                  </button>
                </div>

                <textarea
                  ref={(el: HTMLTextAreaElement | null) => {
                    textareaRefs.current[i] = el;
                  }}
                  rows={5}
                  className="border px-2 py-1 rounded w-full font-mono text-sm resize-y"
                  placeholder="Description du détail (Markdown pris en charge)"
                  value={d.description ?? ""}
                  onChange={(e) =>
                    setDetails((prev) => {
                      const c = [...prev];
                      c[i].description = e.target.value;
                      return c;
                    })
                  }
                />
              </div>

              <div className="w-fit flex justify-center items-center gap-2">
                {!d.image && (
                  <label
                    className="flex items-center gap-1 text-gray-600 cursor-pointer hover:text-blue-600"
                    title="Téléverser une image"
                  >
                    <FiImage className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        putFile(`detailsImages-${i}`, file);
                        const url = URL.createObjectURL(file);
                        setDetails((prev) => {
                          const c = [...prev];
                          c[i].image = url;
                          return c;
                        });
                      }}
                    />
                  </label>
                )}

                {d.image && (
                  <div className="relative w-16 h-16 group rounded overflow-hidden border">
                    <Image src={d.image} alt="Aperçu" fill className="object-cover" />
                    <button
                      type="button"
                      title="Supprimer l'image"
                      onClick={() => {
                        setFileMap((prev) => {
                          const m = new Map(prev);
                          m.delete(`detailsImages-${i}`);
                          return m;
                        });
                        setDetails((prev) => {
                          const c = [...prev];
                          c[i].image = null;
                          return c;
                        });
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <MdDelete size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={addDetail} className={`${btn} mt-2 self-end`}>
          + Ajouter
        </button>
      </div>
    </div>
  );
}
