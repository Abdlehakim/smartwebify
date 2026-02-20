// src/components/blog/articles/create/page.tsx
"use client";

import React, {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MdAdd, MdDelete } from "react-icons/md";
import { PiImage } from "react-icons/pi";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { RichEditor } from "@/components/blog/articles/lexical/Editor";

/* ----------------------------------------------------------------------- */
/* Types & helpers                                                         */
/* ----------------------------------------------------------------------- */
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

/** blob-loader for next/image preview */
const blobLoader = ({ src }: { src: string }) => src;

/* — tree update helpers — */
const updateAt = (
  tree: Subsection[],
  path: number[],
  fn: (node: Subsection) => Subsection
): Subsection[] =>
  path.length
    ? tree.map((node, idx) =>
        idx === path[0]
          ? path.length === 1
            ? fn(node)
            : { ...node, children: updateAt(node.children, path.slice(1), fn) }
          : node
      )
    : tree;

const removeAt = (tree: Subsection[], path: number[]): Subsection[] =>
  path.length === 1
    ? tree.filter((_, idx) => idx !== path[0])
    : tree.map((node, idx) =>
        idx === path[0]
          ? { ...node, children: removeAt(node.children, path.slice(1)) }
          : node
      );

/* — numbering helpers — */
const toRoman = (n: number): string => {
  const map: [string, number][] = [
    ["M", 1000], ["CM", 900], ["D", 500], ["CD", 400],
    ["C", 100], ["XC", 90], ["L", 50], ["XL", 40],
    ["X", 10], ["IX", 9], ["V", 5], ["IV", 4], ["I", 1],
  ];
  let res = "";
  for (const [sym, val] of map) {
    while (n >= val) {
      res += sym;
      n -= val;
    }
  }
  return res;
};
const prefix = (depth: number, idx: number) =>
  depth === 0 ? toRoman(idx + 1)
    : depth === 1 ? `${idx + 1}`
    : String.fromCharCode(97 + idx);

/* — HTML link formatter & empty-check — */
const formatLinks = (html: string) =>
  html.replace(
    /<a\s+([^>]*?)href=(['"])(.*?)\2(.*?)>/gi,
    (_m, before, q, url, after) => {
      const full = /^https?:\/\//i.test(url) ? url : `http://${url}`;
      return `<a ${before}href=${q}${full}${q}${after} target="_blank" rel="noopener noreferrer">`;
    }
  );
const isEmptyDesc = (html: string) =>
  html.replace(/<[^>]+>/g, "").trim().length === 0;

/* ----------------------------------------------------------------------- */
/* Recursive Subsection Editor                                             */
/* ----------------------------------------------------------------------- */
function SectionEditor({
  node,
  path,
  onChange,
}: {
  node: Subsection;
  path: number[];
  onChange: (updater: (tree: Subsection[]) => Subsection[]) => void;
}) {
  const imgRef = useRef<HTMLInputElement>(null);
  const depth = path.length - 1;
  const label = prefix(depth, path[depth]);
  const indentClass = ["", "ml-8", "ml-8", "ml-12"][depth] || "";
  const borderClass = depth === 0 ? "" : "border-indigo-200 border-dashed mx-6";
  const bgClass = depth === 0 ? "bg-gray-50" : depth === 1 ? "bg-blue-50" : "bg-gray-50";

  const setField = (field: "title" | "description", value: string) =>
    onChange((tree) =>
      updateAt(tree, path, (n) => ({ ...n, [field]: value }))
    );
  const setImage = (file: File | null) =>
    onChange((tree) =>
      updateAt(tree, path, (n) => ({ ...n, image: file }))
    );

  return (
    <div className={`mt-3 space-y-2 rounded border border-gray-300 p-3 ${indentClass} ${borderClass} ${bgClass}`}>
      <div className="flex gap-4">
        <label className="flex w-1/2 flex-col gap-1 text-xs font-bold">
          Title {label}*
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
          onChange={(e) => setImage(e.target.files?.[0] ?? null)}
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
                alt="subsection"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setImage(null);
                }}
                className="absolute right-0.5 top-0.5 h-6 w-6 rounded-full bg-white text-red-500 hover:text-red-800"
              >
                <MdDelete size={18} className="mx-auto" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <PiImage size={16} />
              <span>Add image</span>
            </div>
          )}
        </div>
      </div>

      <span className="text-xs font-bold">Description*</span>
      <RichEditor
        value={node.description}
        onChange={(html) => setField("description", html)}
        minHeight={120}
      />

      {node.children.map((child, i) => (
        <SectionEditor key={i} node={child} path={[...path, i]} onChange={onChange} />
      ))}

      <div className="flex justify-end gap-3">
        {depth + 1 < MAX_DEPTH && (
          <button
            type="button"
            onClick={() =>
              onChange((tree) =>
                updateAt(tree, path, (n) => ({
                  ...n,
                  children: [...n.children, newSub()],
                }))
              )
            }
            className="flex items-center gap-1 rounded border-2 bg-blue-100 px-2 text-xs text-indigo-600 hover:bg-indigo-600 hover:text-white"
          >
            <MdAdd size={14} /> Add
          </button>
        )}
        <button
          type="button"
          onClick={() => onChange((tree) => removeAt(tree, path))}
          className="h-6 w-6 rounded-full bg-red-700 text-white hover:bg-white hover:text-red-800"
        >
          <MdDelete size={18} className="mx-auto" />
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Page Component                                                          */
/* ----------------------------------------------------------------------- */
export default function CreateArticlePage() {
  const router = useRouter();
  const mainRef = useRef<HTMLInputElement>(null);

  const [cats, setCats] = useState<IPostCategorie[]>([]);
  const [subs, setSubs] = useState<IPostSubCategorie[]>([]);
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    postCategorie: "",
    postSubCategorie: "",
    image: null,
    subsections: [],
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /* Load categories */
  useEffect(() => {
    fetchFromAPI<{ PostCategories: IPostCategorie[] }>("/dashboardadmin/blog/postCategorie")
      .then((res) => setCats(res.PostCategories))
      .catch(console.error);
  }, []);

  /* Load sub-categories when category changes */
  useEffect(() => {
    if (!form.postCategorie) {
      setSubs([]);
      setForm((f) => ({ ...f, postSubCategorie: "" }));
      return;
    }
    fetchFromAPI<{ PostSubCategories: IPostSubCategorie[] }>(
      `/dashboardadmin/blog/postsubcategorie/byParent/${form.postCategorie}`
    )
      .then((res) => {
        setSubs(res.PostSubCategories);
        setForm((f) => ({ ...f, postSubCategorie: "" }));
      })
      .catch(console.error);
  }, [form.postCategorie]);

  /* Handlers */
  const onText = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const onMain = (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, image: e.target.files?.[0] ?? null }));
  const clearMain = () => {
    setForm((f) => ({ ...f, image: null }));
    if (mainRef.current) mainRef.current.value = "";
  };
  const updateTree = (updater: (tree: Subsection[]) => Subsection[]) =>
    setForm((f) => ({ ...f, subsections: updater(f.subsections) }));
  const addRoot = () => updateTree((tree) => [...tree, newSub()]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (!form.image) throw new Error("Main image is required");

      // prepare formdata
      const rawSubs = form.subsections.map(({ title, description, children }) => ({
        title,
        description,
        children,
      }));
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("description", form.description.trim());
      fd.append("postCategorie", form.postCategorie);
      if (form.postSubCategorie) fd.append("postSubCategorie", form.postSubCategorie);
      fd.append("image", form.image);
      fd.append("subsections", JSON.stringify(rawSubs));
      form.subsections.forEach((sub, idx) => {
        if (sub.image) fd.append(`subImg-${idx}`, sub.image);
      });

      await fetchFromAPI("/dashboardadmin/blog/post/create", { method: "POST", body: fd });
      setDone(true);
      setTimeout(() => router.push("/dashboard/blog/articles"), 1500);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Server error");
    } finally {
      setBusy(false);
    }
  };

  /* Section preview renderer */
  const renderPreview = (s: Subsection, depth = 0, idx = 0) => (
    <div key={`${depth}-${idx}`} className="flex flex-col gap-4">
      {s.image && (
        <Image
          src={URL.createObjectURL(s.image)}
          loader={blobLoader}
          width={1000}
          height={600}
          alt="section"
          className="h-[300px] w-full object-cover"
        />
      )}
      <p className={`${depth === 0 ? "pl-8 text-xl" : "pl-16 text-lg"} font-bold`}>
        <span className="mr-2">{prefix(depth, idx)}.</span>
        <span className={!s.title ? "text-gray-500" : ""}>{s.title || `Title ${prefix(depth, idx)}`}</span>
      </p>
      {!isEmptyDesc(s.description) ? (
        <div className="prose" dangerouslySetInnerHTML={{ __html: formatLinks(s.description) }} />
      ) : (
        <p className="text-gray-500">Section description</p>
      )}
      {s.children.map((c, i) => renderPreview(c, depth + 1, i))}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Create New Blog Post</h1>
      <form
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="grid w-[90%] gap-8 rounded bg-white p-8 shadow-md md:grid-cols-[2fr_1.5fr]"
      >
        {/* left form */}
        <div className="flex flex-col gap-6">
          {/* category & subcategory */}
          <div className="flex gap-4 border-b pb-4">
            <div className="flex flex-1 flex-col gap-1">
              <label className="font-medium">Category*</label>
              <select
                name="postCategorie"
                value={form.postCategorie}
                onChange={onText}
                className="rounded border border-gray-300 px-3 py-2"
              >
                <option value="" disabled>Select category</option>
                {cats.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="font-medium">Sub-Category</label>
              <select
                name="postSubCategorie"
                value={form.postSubCategorie}
                onChange={onText}
                className="rounded border border-gray-300 px-3 py-2"
              >
                <option value="">None</option>
                {subs.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* title & image */}
          <div className="flex gap-4">
            <div className="flex w-1/2 flex-col gap-1">
              <label className="font-medium">Title*</label>
              <input
                name="title"
                value={form.title}
                onChange={onText}
                className="rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <div className="relative flex h-24 flex-1 cursor-pointer items-center justify-center overflow-hidden rounded border-2 border-gray-300"
                 onClick={() => mainRef.current?.click()}>
              <input
                ref={mainRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onMain}
              />
              {form.image ? (
                <>
                  <Image
                    src={URL.createObjectURL(form.image)}
                    loader={blobLoader}
                    fill
                    alt="main"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); clearMain(); }}
                    className="absolute right-1 top-1 h-6 w-6 rounded-full bg-white text-red-500"
                  >
                    <MdDelete size={16} />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <PiImage size={24} />
                  <span className="mt-1 text-sm">Upload main image</span>
                </div>
              )}
            </div>
          </div>

          {/* description */}
          <div>
            <label className="mb-1 block font-medium">Description*</label>
            <RichEditor
              value={form.description}
              onChange={(html) => setForm((f) => ({ ...f, description: html }))}
              minHeight={160}
            />
          </div>

          {/* subsections */}
          <div className="space-y-4">
            <h3 className="font-medium">Subsections</h3>
            {form.subsections.map((s, i) => (
              <SectionEditor key={i} node={s} path={[i]} onChange={updateTree} />
            ))}
            <button
              type="button"
              onClick={addRoot}
              className="flex items-center gap-1 text-sm text-indigo-600"
            >
              <MdAdd size={16} /> Add subsection
            </button>
          </div>

          {/* form actions */}
          <div className="mt-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded bg-gray-500 px-5 py-2 text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded bg-indigo-600 px-5 py-2 text-white disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save Post"}
            </button>
          </div>
        </div>

        {/* right preview */}
        <aside className="overflow-y-auto border-l border-gray-200 pl-6">
          <h3 className="mb-4 border-b pb-2 text-lg font-semibold">Live Preview</h3>
          <div className="space-y-6">
            {form.image && (
              <Image
                src={URL.createObjectURL(form.image)}
                loader={blobLoader}
                width={1000}
                height={600}
                alt="preview"
                className="h-64 w-full object-cover"
              />
            )}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{form.title || "Post Title"}</h2>
              {!isEmptyDesc(form.description) ? (
                <div className="prose" dangerouslySetInnerHTML={{ __html: formatLinks(form.description) }} />
              ) : (
                <p className="text-gray-500">Write your post description here...</p>
              )}
            </div>
            {form.subsections.map((s, i) => renderPreview(s, 0, i))}
          </div>
        </aside>
      </form>

      <Overlay show={busy || done} message={done ? "Post created!" : undefined}/>
      {err && <ErrorPopup message={err} onClose={() => setErr(null)} />}
    </div>
  );
}
