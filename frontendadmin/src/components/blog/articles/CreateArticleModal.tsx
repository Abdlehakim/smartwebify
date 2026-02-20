"use client";

import React, { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MdAdd, MdClose, MdDelete } from "react-icons/md";
import { PiImage } from "react-icons/pi";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { RichEditor } from "./lexical/Editor";

interface IPostCategorie {
  _id: string;
  name: string;
}
interface IPostSubCategorie {
  _id: string;
  name: string;
  postCategorie: string;
}

export interface Subsection {
  title: string;
  description: string;
  image: File | null;
  children: Subsection[];
}

interface FormState {
  title: string;
  description: string;
  postCategorie: string;
  postSubCategorie: string;
  image: File | null;
  subsections: Subsection[];
}

const MAX_DEPTH = 3;
const newSub = (): Subsection => ({
  title: "",
  description: "",
  image: null,
  children: [],
});

const blobLoader = ({ src }: { src: string }) => src;

const updateAt = (
  t: Subsection[],
  path: number[],
  fn: (n: Subsection) => Subsection
): Subsection[] =>
  path.length
    ? t.map((n, i) =>
        i === path[0]
          ? path.length === 1
            ? fn(n)
            : { ...n, children: updateAt(n.children, path.slice(1), fn) }
          : n
      )
    : t;

const removeAt = (t: Subsection[], path: number[]): Subsection[] =>
  path.length === 1
    ? t.filter((_, i) => i !== path[0])
    : t.map((n, i) =>
        i === path[0]
          ? { ...n, children: removeAt(n.children, path.slice(1)) }
          : n
      );

const toRoman = (n: number): string => {
  const map: [string, number][] = [
    ["M", 1000],
    ["CM", 900],
    ["D", 500],
    ["CD", 400],
    ["C", 100],
    ["XC", 90],
    ["L", 50],
    ["XL", 40],
    ["X", 10],
    ["IX", 9],
    ["V", 5],
    ["IV", 4],
    ["I", 1],
  ];
  let out = "";
  for (const [s, v] of map) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }
  return out;
};
const prefix = (d: number, i: number) =>
  d === 0 ? toRoman(i + 1) : d === 1 ? `${i + 1}` : String.fromCharCode(97 + i);

const formatLinks = (html: string) =>
  html.replace(
    /<a\s+([^>]*?)href=(['"])(.*?)\2(.*?)>/gi,
    (_m, b, q, url, a) => {
      const full = /^https?:\/\//i.test(url) ? url : `http://${url}`;
      return `<a ${b}href=${q}${full}${q}${a} target="_blank" rel="noopener noreferrer">`;
    }
  );

const isEmptyDesc = (html: string) =>
  html.replace(/<[^>]+>/g, "").trim().length === 0;

function SectionEditor({
  node,
  path,
  onChange,
}: {
  node: Subsection;
  path: number[];
  onChange: (u: (t: Subsection[]) => Subsection[]) => void;
}) {
  const imgRef = useRef<HTMLInputElement>(null);
  const d = path.length - 1;
  const pre = prefix(d, path[d]);
  const indent = ["", "ml-8", "ml-8", "ml-12"][d] || "";
  const bordered = d === 0 ? "" : "border-indigo-200 border-dashed mx-6";
  const bg = d === 0 ? "bg-gray-50" : d === 1 ? "bg-blue-50" : "bg-gray-50";

  const setField = (k: "title" | "description", v: string) =>
    onChange((t) => updateAt(t, path, (n) => ({ ...n, [k]: v })));
  const setImg = (f: File | null) =>
    onChange((t) => updateAt(t, path, (n) => ({ ...n, image: f })));

  return (
    <div className={`mt-3 space-y-2 rounded border border-gray-300 p-3 ${indent} ${bordered} ${bg}`}>
      <div className="flex gap-4">
        <label className="flex w-1/2 flex-col gap-1 text-xs font-bold">
          Titre {pre}*
          <input
            value={node.title}
            onChange={(e) => setField("title", e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>

        <input
          ref={imgRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setImg(e.target.files?.[0] ?? null)}
        />
        <div
          onClick={() => imgRef.current?.click()}
          className="relative flex h-20 flex-1 cursor-pointer items-center justify-center overflow-hidden rounded border-2 border-gray-300 text-[0.7rem] hover:border-gray-400"
        >
          {node.image ? (
            <>
              <Image
                src={URL.createObjectURL(node.image)}
                loader={blobLoader}
                alt="image sous-section"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setImg(null);
                }}
                className="absolute right-0.5 top-0.5 h-6 w-6 rounded-full bg-white text-red-500 hover:border hover:text-red-800"
              >
                <MdDelete size={18} className="mx-auto" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <PiImage size={16} />
              <span>Ajouter une image</span>
            </div>
          )}
        </div>
      </div>

      Description*
      <RichEditor
        value={node.description}
        onChange={(html) => setField("description", html)}
        minHeight={120}
      />

      {node.children.map((c, i) => (
        <SectionEditor key={i} node={c} path={[...path, i]} onChange={onChange} />
      ))}

      <div className="flex justify-end gap-3">
        {d + 1 < MAX_DEPTH && (
          <button
            type="button"
            onClick={() =>
              onChange((t) =>
                updateAt(t, path, (n) => ({
                  ...n,
                  children: [...n.children, newSub()],
                }))
              )
            }
            className="flex items-center gap-1 rounded border-2 bg-blue-100 px-2 text-xs text-indigo-600 hover:bg-indigo-600 hover:text-white"
          >
            <MdAdd size={14} /> Ajouter
          </button>
        )}
        <button
          type="button"
          onClick={() => onChange((t) => removeAt(t, path))}
          className="h-6 w-6 rounded-full bg-red-700 text-white hover:border hover:bg-white hover:text-red-800"
        >
          <MdDelete size={18} className="mx-auto" />
        </button>
      </div>
    </div>
  );
}

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateArticleModal({ onClose, onSuccess }: Props) {
  const mainRef = useRef<HTMLInputElement>(null);

  const [cats, setCats] = useState<IPostCategorie[]>([]);
  const [subs, setSubs] = useState<IPostSubCategorie[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    postCategorie: "",
    postSubCategorie: "",
    image: null,
    subsections: [],
  });

  useEffect(() => {
    fetchFromAPI<{ PostCategories: IPostCategorie[] }>("/dashboardadmin/blog/postCategorie")
      .then(({ PostCategories }) => setCats(PostCategories))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!form.postCategorie) {
      setSubs([]);
      setForm((p) => ({ ...p, postSubCategorie: "" }));
      return;
    }
    fetchFromAPI<{ PostSubCategories: IPostSubCategorie[] }>(
      `/dashboardadmin/blog/postsubcategorie/byParent/${form.postCategorie}`
    )
      .then(({ PostSubCategories }) => {
        setSubs(PostSubCategories);
        setForm((p) => ({ ...p, postSubCategorie: "" }));
      })
      .catch(console.error);
  }, [form.postCategorie]);

  const onText = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const onMain = (e: ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, image: e.target.files?.[0] ?? null }));
  const clearMain = () => {
    setForm((p) => ({ ...p, image: null }));
    if (mainRef.current) mainRef.current.value = "";
  };

  const updateTree = (u: (t: Subsection[]) => Subsection[]) =>
    setForm((p) => ({ ...p, subsections: u(p.subsections) }));
  const addRoot = () => updateTree((t) => [...t, newSub()]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (!form.image) throw new Error("L’image principale est requise");
      const rawSubs = form.subsections.map(({ title, description, children }) => ({
        title,
        description,
        children,
      }));
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("description", form.description.trim());
      fd.append("postCategorie", form.postCategorie);
      if (form.postSubCategorie) {
        fd.append("postSubCategorie", form.postSubCategorie);
      }
      fd.append("image", form.image);
      fd.append("subsections", JSON.stringify(rawSubs));
      form.subsections.forEach((sub, idx) => {
        if (sub.image) {
          fd.append(`subImg-${idx}`, sub.image);
        }
      });
      await fetchFromAPI("/dashboardadmin/blog/post/create", {
        method: "POST",
        body: fd,
      });
      setDone(true);
      onSuccess?.();
      setTimeout(onClose, 1800);
    } catch (err) {
      setErr(err instanceof Error ? err.message : "Erreur serveur");
    } finally {
      setBusy(false);
    }
  };

  const renderSec = (s: Subsection, d = 0, i = 0) => (
    <div key={`${d}-${i}`} className="flex flex-col gap-4">
      {s.image && (
        <Image
          src={URL.createObjectURL(s.image)}
          loader={blobLoader}
          width={1000}
          height={600}
          alt="visuel section"
          className="h-[300px] w-full object-cover"
        />
      )}
      <p className={`${d === 0 ? "pl-8 text-xl" : "pl-16 text-lg"} font-bold flex items-baseline gap-2`}>
        <span>{prefix(d, i)}.</span>
        <span className={s.title ? "" : "text-gray-500"}>
          {s.title || `Titre ${prefix(d, i)}`}
        </span>
      </p>
      {!isEmptyDesc(s.description) ? (
        <div
          className="prose"
          dangerouslySetInnerHTML={{
            __html: formatLinks(s.description),
          }}
        />
      ) : (
        <p className="text-gray-500">Description de la section</p>
      )}
      {s.children.map((c, idx) => renderSec(c, d + 1, idx))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="relative flex h-full w-full flex-col rounded-xl bg-white shadow-xl">
        <button onClick={onClose} className="absolute right-3 top-3 p-1 text-gray-600 hover:text-gray-800">
          <MdClose size={22} />
        </button>

        <header className="border-b border-gray-200 px-8 pt-6 pb-4">
          <h2 className="text-2xl font-semibold">Créer un article</h2>
        </header>

        <form
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          className="grid flex-1 gap-8 overflow-y-auto p-8 md:grid-cols-[2fr_2fr]"
        >
          <div className="flex flex-col justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex gap-2 justify-around pb-8 border-b border-gray-200 ">
                <label className="flex gap-2 justify-center items-center w-1/2">
                  <span className="text-sm font-medium">Catégorie*</span>
                  <select
                    name="postCategorie"
                    value={form.postCategorie}
                    onChange={onText}
                    className="rounded border border-gray-300 px-3 py-2"
                  >
                    <option value="" disabled>
                      Sélectionner une catégorie
                    </option>
                    {cats.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex gap-2 justify-center items-center w-1/2">
                  <span className="text-sm font-medium">Sous-catégorie</span>
                  <select
                    name="postSubCategorie"
                    value={form.postSubCategorie}
                    onChange={onText}
                    className="rounded border border-gray-300 px-3 py-2"
                  >
                    <option value="">Aucune sous-catégorie</option>
                    {subs.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex gap-4 pt-8">
                <label className="flex w-1/2 flex-col gap-1">
                  <span className="text-sm font-medium">Titre*</span>
                  <input
                    name="title"
                    value={form.title}
                    onChange={onText}
                    className="rounded border border-gray-300 px-3 py-2"
                  />
                </label>

                <input
                  ref={mainRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onMain}
                />
                <div
                  onClick={() => mainRef.current?.click()}
                  className="relative flex h-20 flex-1 cursor-pointer items-center justify-center overflow-hidden rounded border-2 border-gray-300 text-[0.7rem] hover:border-gray-400"
                >
                  {form.image ? (
                    <>
                      <Image
                        src={URL.createObjectURL(form.image)}
                        loader={blobLoader}
                        fill
                        alt="image principale"
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearMain();
                        }}
                        className="absolute right-0.5 top-0.5 h-6 w-6 rounded-full bg-white text-red-500 hover:border hover:text-red-800"
                      >
                        <MdDelete size={16} className="mx-auto" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <PiImage size={32} />
                      <span className="mt-1 text-sm">Cliquez pour importer l’image principale</span>
                    </div>
                  )}
                </div>
              </div>

              <span className="text-sm font-medium">Description*</span>
              <RichEditor
                value={form.description}
                onChange={(html) => setForm((p) => ({ ...p, description: html }))}
                minHeight={160}
              />

              <div className="space-y-4">
                <h3 className="font-medium">Sous-sections</h3>
                {form.subsections.map((s, idx) => (
                  <SectionEditor key={idx} node={s} path={[idx]} onChange={updateTree} />
                ))}
                <button
                  type="button"
                  onClick={addRoot}
                  className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
                >
                  <MdAdd size={16} /> Ajouter une sous-section
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="rounded bg-quaternary px-5 py-2 text-white"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded bg-tertiaire px-5 py-2 text-white disabled:opacity-50"
              >
                {busy ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>

          <aside className="border-l border-gray-200 pl-2">
            <h3 className="mb-4 border-b text-lg font-semibold">Aperçu en direct</h3>
            <div className="flex flex-col gap-4">
              {form.image && (
                <Image
                  src={URL.createObjectURL(form.image)}
                  loader={blobLoader}
                  width={1000}
                  height={600}
                  alt="bannière"
                  className="h-[300px] w-full object-cover"
                />
              )}

              <div className="flex flex-col gap-4">
                <p className="text-2xl font-bold">{form.title || "Titre de l’article"}</p>

                {!isEmptyDesc(form.description) ? (
                  <div
                    className="prose"
                    dangerouslySetInnerHTML={{
                      __html: formatLinks(form.description),
                    }}
                  />
                ) : (
                  <p className="text-gray-500">Description de l’article</p>
                )}
              </div>

              {form.subsections.map((s, idx) => renderSec(s, 0, idx))}
            </div>
          </aside>
        </form>

        <Overlay show={busy || done} message={done ? "Article créé avec succès" : undefined} />
        {err && <ErrorPopup message={err} onClose={() => setErr(null)} />}
      </div>
    </div>
  );
}
