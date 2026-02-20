// src/app/dashboard/blog/articles/update/[PostId]/page.tsx
"use client";

import React, {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { MdAdd, MdClose, MdDelete } from "react-icons/md";
import { PiImage } from "react-icons/pi";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { RichEditor } from "@/components/blog/articles/lexical/Editor";

/* ──────────────────────────────────────────────────────────── */
/* Types & helpers                                            */
/* ──────────────────────────────────────────────────────────── */
interface IPostCategorie { _id: string; name: string }
interface IPostSubCategorie { _id: string; name: string; parent: string }

interface RawSubsection {
  title: string
  description: string
  imageUrl?: string
  children: RawSubsection[]
}

export interface Subsection {
  title: string
  description: string
  imageUrl?: string
  imageFile: File | null
  children: Subsection[]
}

interface PostDetail {
  _id: string
  title: string
  description: string
  imageUrl: string
  postCategorie: IPostCategorie | string
  postSubCategorie?: IPostSubCategorie | string | null
  vadmin: "approve" | "not-approve"
  subsections: RawSubsection[]
}

const MAX_DEPTH = 3;
const newSub = (): Subsection => ({
  title: "",
  description: "",
  imageFile: null,
  imageUrl: undefined,
  children: [],
});
const blobLoader = ({ src }: { src: string }) => src;

const toRoman = (n: number): string => {
  const map: [string, number][] = [
    ["M",1000],["CM",900],["D",500],["CD",400],["C",100],
    ["XC",90],["L",50],["XL",40],["X",10],
    ["IX",9],["V",5],["IV",4],["I",1],
  ];
  let out = "";
  for (const [s,v] of map) while (n >= v) { out += s; n -= v }
  return out;
};
const prefix = (d: number, i: number) =>
  d === 0 ? toRoman(i+1) : d === 1 ? `${i+1}` : String.fromCharCode(97 + i);
const formatLinks = (html: string) =>
  html.replace(/<a\s+([^>]*?)href=(['"])(.*?)\2(.*?)>/gi, (_m,b,q,url,a) => {
    const u = /^https?:\/\//i.test(url) ? url : `http://${url}`;
    return `<a ${b}href=${q}${u}${q}${a} target="_blank" rel="noopener noreferrer">`;
  });
const isEmptyDesc = (h: string) => h.replace(/<[^>]+>/g,"").trim().length === 0;

const updateAt = (t: Subsection[], p: number[], fn: (n: Subsection)=>Subsection): Subsection[] =>
  p.length
    ? t.map((n,i)=>
        i===p[0]
          ? p.length===1
            ? fn(n)
            : { ...n, children: updateAt(n.children,p.slice(1),fn) }
          : n
      )
    : t;
const removeAt = (t: Subsection[], p: number[]): Subsection[] =>
  p.length===1
    ? t.filter((_,i)=>i!==p[0])
    : t.map((n,i)=> i===p[0] ? { ...n, children: removeAt(n.children,p.slice(1)) } : n);

/** Convert raw JSON → Subsection type */
function toSubsection(r: RawSubsection): Subsection {
  return {
    title:     r.title,
    description: r.description,
    imageFile: null,
    imageUrl:  r.imageUrl,
    children:  r.children.map(toSubsection),
  };
}

/* ──────────────────────────────────────────────────────────── */
/* SectionEditor                                              */
/* ──────────────────────────────────────────────────────────── */
function SectionEditor({
  node, path, onChange
}: {
  node: Subsection
  path: number[]
  onChange: (fn:(t:Subsection[])=>Subsection[])=>void
}) {
  const imgRef = useRef<HTMLInputElement>(null);
  const d = path.length - 1;

  const setField = (k:"title"|"description", v:string) =>
    onChange(t=>updateAt(t,path,n=>({...n,[k]:v})));

  const setImageFile = (f: File|null) =>
    onChange(t=>updateAt(t,path,n=>({
      ...n,
      imageFile: f,
      imageUrl:  f ? undefined : n.imageUrl
    })));

  const previewSrc = node.imageFile
    ? URL.createObjectURL(node.imageFile)
    : node.imageUrl;

  return (
    <div className={`mt-3 space-y-2 rounded border border-gray-300 p-3 ${["","ml-8","ml-8","ml-12"][d]}`}>
      <div className="flex gap-4">
        <label className="flex w-1/2 flex-col gap-1 text-xs font-bold">
          Title {prefix(d,path[d])}*
          <input
            value={node.title}
            onChange={e=>setField("title", e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>

        <input
          ref={imgRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e=>setImageFile(e.target.files?.[0] ?? null)}
        />
        <div
          onClick={()=>imgRef.current?.click()}
          className="relative flex h-20 flex-1 cursor-pointer items-center justify-center overflow-hidden rounded border-2 border-gray-300 hover:border-gray-400"
        >
          {previewSrc ? (
            <>
              <Image
                src={previewSrc}
                loader={blobLoader}
                alt=""
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={e=>{e.stopPropagation(); setImageFile(null)}}
                className="absolute right-0.5 top-0.5 h-6 w-6 rounded-full bg-white text-red-500"
              >
                <MdDelete size={18} className="mx-auto"/>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <PiImage size={16}/>
              <span>Add image</span>
            </div>
          )}
        </div>
      </div>

      <span className="text-sm font-medium">Description*</span>
      <RichEditor
        value={node.description}
        onChange={html=>setField("description", html)}
        minHeight={120}
      />

      {node.children.map((c,i)=>(
        <SectionEditor key={i} node={c} path={[...path,i]} onChange={onChange}/>
      ))}

      <div className="flex justify-end gap-3">
        {d+1<MAX_DEPTH && (
          <button
            type="button"
            onClick={()=>onChange(t=>updateAt(t,path,n=>({...n,children:[...n.children,newSub()]})))}
            className="flex items-center gap-1 rounded border-2 bg-blue-100 px-2 text-xs text-indigo-600 hover:bg-indigo-600 hover:text-white"
          >
            <MdAdd size={14}/> Add
          </button>
        )}
        <button
          type="button"
          onClick={()=>onChange(t=>removeAt(t,path))}
          className="h-6 w-6 rounded-full bg-red-700 text-white hover:border hover:bg-white hover:text-red-800"
        >
          <MdDelete size={18} className="mx-auto"/>
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* UpdatePostPage                                             */
/* ──────────────────────────────────────────────────────────── */
export default function UpdatePostPage() {
  const router = useRouter();
  const { PostId } = useParams() as { PostId: string };
  const imgInput = useRef<HTMLInputElement>(null);

  const [cats, setCats] = useState<IPostCategorie[]>([]);
  const [subs, setSubs] = useState<IPostSubCategorie[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [postCat, setPostCat] = useState("");
  const [postSub, setPostSub] = useState("");
  const [status, setStatus] = useState<"approve"|"not-approve">("not-approve");
  const [imgUrl, setImgUrl] = useState("");
  const [imgFile, setImgFile] = useState<File|null>(null);
  const [subsections, setSubsections] = useState<Subsection[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  const close = () => router.push("/dashboard/blog/articles");

  // load categories + post
  useEffect(()=>{
    (async()=>{
      try {
        const { PostCategories } = await fetchFromAPI<{ PostCategories: IPostCategorie[] }>(
          "/dashboardadmin/blog/postCategorie"
        );
        setCats(PostCategories);

        const { post } = await fetchFromAPI<{ post: PostDetail }>(
          `/dashboardadmin/blog/post/${PostId}`
        );
        setTitle(post.title);
        setDescription(post.description);
        setImgUrl(post.imageUrl);
        setStatus(post.vadmin);
        setPostCat(
          typeof post.postCategorie === "string"
            ? post.postCategorie
            : post.postCategorie._id
        );
        if(post.postSubCategorie)
          setPostSub(
            typeof post.postSubCategorie === "string"
              ? post.postSubCategorie
              : post.postSubCategorie._id
          );

        // convert raw subsections recursively
        setSubsections(post.subsections.map(toSubsection));
      } catch {
        setErr("Failed to load post.");
      } finally {
        setLoading(false);
      }
    })();
  },[PostId]);

  // load sub-categories
  useEffect(()=>{
    if(!postCat){ setSubs([]); setPostSub(""); return; }
    fetchFromAPI<{ PostSubCategories: IPostSubCategorie[] }>(
      `/dashboardadmin/blog/postsubcategorie/byParent/${postCat}`
    ).then(d=>setSubs(d.PostSubCategories)).catch(console.error);
  },[postCat]);

  const onImg = (e:ChangeEvent<HTMLInputElement>)=> setImgFile(e.target.files?.[0] ?? null);
  const clearImg = ()=>{
    setImgFile(null);
    if(imgInput.current) imgInput.current.value = "";
  };
  const updateTree = (fn:(t:Subsection[])=>Subsection[])=> setSubsections(fn(subsections));

  const handleSubmit = async(e:FormEvent)=>{
    e.preventDefault();
    setBusy(true);
    try {
      // build rawSubs for JSON
      const rawSubs: RawSubsection[] = subsections.map(s => ({
        title: s.title,
        description: s.description,
        imageUrl: s.imageUrl,
        children: s.children.map(c=>({
          title: c.title,
          description: c.description,
          imageUrl: c.imageUrl,
          children: c.children.map(grand=>({
            title: grand.title,
            description: grand.description,
            imageUrl: grand.imageUrl,
            children: [],
          }))
        }))
      }));

      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      fd.append("vadmin", status);
      fd.append("postCategorie", postCat);
      if(postSub) fd.append("postSubCategorie", postSub);
      if(imgFile) fd.append("image", imgFile);
      fd.append("subsections", JSON.stringify(rawSubs));

      subsections.forEach((sub,idx)=>{
        if(sub.imageFile) fd.append(`subImg-${idx}`, sub.imageFile);
      });

      await fetchFromAPI(`/dashboardadmin/blog/post/update/${PostId}`,{
        method:"PUT",
        body:fd
      });

      setDone(true);
      setTimeout(()=>{ setDone(false); close() },1500);
    } catch {
      setErr("Server error");
    } finally {
      setBusy(false);
    }
  };

  const renderSec = (s: Subsection, d=0, i=0) => {
    const src = s.imageFile
      ? URL.createObjectURL(s.imageFile)
      : s.imageUrl;
    return (
      <div key={`${d}-${i}`} className="flex flex-col gap-4">
        {src && (
          <Image
            src={src}
            loader={blobLoader}
            width={1000}
            height={600}
            alt=""
            className="h-[300px] w-full object-cover"
          />
        )}
        <p className={`${d===0?"pl-8 text-xl":"pl-16 text-lg"} font-bold flex items-baseline gap-2`}>
          <span>{prefix(d,i)}.</span>
          <span className={s.title?"":"text-gray-500"}>{s.title||`Title ${prefix(d,i)}`}</span>
        </p>
        {!isEmptyDesc(s.description) ? (
          <div className="prose" dangerouslySetInnerHTML={{__html:formatLinks(s.description)}}/>
        ) : (
          <p className="text-gray-500">Section description</p>
        )}
        {s.children.map((c,idx)=>renderSec(c,d+1,idx))}
      </div>
    );
  };

  if(loading) return ;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="relative flex h-full w-full flex-col rounded-xl bg-white shadow-xl">
        <button onClick={close} className="absolute right-3 top-3 p-1 text-gray-600 hover:text-gray-800">
          <MdClose size={22}/>
        </button>
        <header className="border-b border-gray-200 px-8 pt-6 pb-4">
          <h2 className="text-2xl font-semibold">Update Blog Post</h2>
        </header>
        <form onSubmit={handleSubmit} encType="multipart/form-data" className="grid flex-1 gap-8 overflow-y-auto p-8 md:grid-cols-[2fr_2fr]">
          {/* Left column */}
          <div className="flex flex-col justify-between">
            <div className="space-y-6">
              {/* Category/Sub/Status */}
              <div className="flex gap-4 pb-8 border-b border-gray-200">
                <label className="flex w-1/3 flex-col gap-1">
                  <span className="text-sm font-medium">Category*</span>
                  <select value={postCat} onChange={e=>setPostCat(e.target.value)} className="rounded border border-gray-300 px-3 py-2">
                    <option value="" disabled>Select category</option>
                    {cats.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </label>
                <label className="flex w-1/3 flex-col gap-1">
                  <span className="text-sm font-medium">Sub-Category</span>
                  <select value={postSub} onChange={e=>setPostSub(e.target.value)} className="rounded border border-gray-300 px-3 py-2">
                    <option value="">No sub-category</option>
                    {subs.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </label>
                <label className="flex w-1/4 flex-col gap-1">
                  <span className="text-sm font-medium">Status*</span>
                  <select value={status} onChange={e=>setStatus(e.target.value as "approve"|"not-approve")} className="rounded border border-gray-300 px-3 py-2">
                    <option value="approve">approve</option>
                    <option value="not-approve">not-approve</option>
                  </select>
                </label>
              </div>
              {/* Title & Main Image */}
              <div className="flex gap-4 pt-6">
                <label className="flex w-1/2 flex-col gap-1">
                  <span className="text-sm font-medium">Title*</span>
                  <input value={title} onChange={e=>setTitle(e.target.value)} className="rounded border border-gray-300 px-3 py-2"/>
                </label>
                <input ref={imgInput} type="file" accept="image/*" className="hidden" onChange={onImg}/>
                <div onClick={()=>imgInput.current?.click()} className="relative flex h-20 flex-1 cursor-pointer items-center justify-center overflow-hidden rounded border-2 border-gray-300 hover:border-gray-400">
                  {imgFile ? (
                    <>
                      <Image src={URL.createObjectURL(imgFile)} loader={blobLoader} fill alt="" className="object-cover"/>
                      <button type="button" onClick={e=>{e.stopPropagation(); clearImg()}} className="absolute right-0.5 top-0.5 h-6 w-6 rounded-full bg-white text-red-500">
                        <MdDelete size={18} className="mx-auto"/>
                      </button>
                    </>
                  ) : (
                    <Image src={imgUrl} fill alt="" className="object-cover"/>
                  )}
                  {!imgFile && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 hover:opacity-100">
                      <PiImage size={26}/><span className="ml-2 text-sm">Replace</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Description */}
              <span className="text-sm font-medium">Description*</span>
              <RichEditor value={description} onChange={setDescription} minHeight={160}/>
              {/* Subsections */}
              <div className="space-y-4">
                <h3 className="font-medium">Subsections</h3>
                {subsections.map((s,i)=><SectionEditor key={i} node={s} path={[i]} onChange={updateTree}/>)}
                <button type="button" onClick={()=>setSubsections(t=>[...t,newSub()])} className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800">
                  <MdAdd size={16}/> Add subsection
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-4 pt-6">
              <button onClick={close} type="button" className="rounded bg-quaternary px-5 py-2 text-white">Cancel</button>
              <button type="submit" disabled={busy} className="rounded bg-tertiary px-5 py-2 text-white disabled:opacity-50">
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
          {/* Preview */}
          <aside className="border-l border-gray-200 pl-2">
            <h3 className="mb-4 border-b text-lg font-semibold">Live Preview</h3>
            <div className="flex flex-col gap-4">
              {(imgFile||imgUrl) && <Image src={imgFile?URL.createObjectURL(imgFile):imgUrl} loader={imgFile?blobLoader:undefined} width={1000} height={600} alt="" className="h-[300px] w-full object-cover"/>}
              <div className="flex flex-col gap-4">
                <p className="text-2xl font-bold">{title||"Post title"}</p>
                {!isEmptyDesc(description) ? <div className="prose" dangerouslySetInnerHTML={{__html:formatLinks(description)}}/> : <p className="text-gray-500">Post description</p>}
              </div>
              {subsections.map((s,i)=>renderSec(s,0,i))}
            </div>
          </aside>
        </form>
        <Overlay show={busy||done} message={done?"Post updated":undefined}/>
        {err && <ErrorPopup message={err} onClose={()=>setErr(null)}/>}
      </div>
    </div>
  );
}
