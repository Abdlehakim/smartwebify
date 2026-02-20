// src/app/dashboard/blog/articles/voir/[PostId]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { MdClose } from "react-icons/md";

import ErrorPopup from "@/components/Popup/ErrorPopup";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

/* ─────────────────────────────── */
/* Types & helpers                 */
/* ─────────────────────────────── */
interface RawSubsection {
  title: string;
  description: string;
  imageUrl?: string;
  children: RawSubsection[];
}

interface Subsection {
  title: string;
  description: string;
  imageUrl?: string;
  children: Subsection[];
}

interface IPostCategorie { _id: string; name: string }
interface IPostSubCategorie { _id: string; name: string }
interface IAuthor { _id: string; username: string }

interface PostDetail {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  postCategorie: IPostCategorie | string;
  postSubCategorie?: IPostSubCategorie | string | null;
  author?: IAuthor | string | null;
  vadmin: "approve" | "not-approve";
  subsections: RawSubsection[];
  createdAt: string;
  updatedAt: string;
}

const toRoman = (n: number): string => {
  const map: [string, number][] = [
    ["M", 1000], ["CM", 900], ["D", 500], ["CD", 400],
    ["C", 100],  ["XC", 90],  ["L", 50],  ["XL", 40],
    ["X", 10],   ["IX", 9],   ["V", 5],   ["IV", 4], ["I", 1],
  ];
  let out = "";
  for (const [s, v] of map) while (n >= v) { out += s; n -= v; }
  return out;
};

const prefix = (d: number, i: number) =>
  d === 0 ? toRoman(i + 1)
  : d === 1 ? `${i + 1}`
  : String.fromCharCode(97 + i);

const formatLinks = (html: string) =>
  html.replace(
    /<a\s+([^>]*?)href=(['"])(.*?)\2(.*?)>/gi,
    (_m, b, q, url, a) => {
      const u = /^https?:\/\//i.test(url) ? url : `http://${url}`;
      return `<a ${b}href=${q}${u}${q}${a} target="_blank" rel="noopener noreferrer">`;
    },
  );

const isEmptyDesc = (h: string) => h.replace(/<[^>]+>/g, "").trim().length === 0;

function toSubsection(r: RawSubsection): Subsection {
  return {
    title: r.title,
    description: r.description,
    imageUrl: r.imageUrl,
    children: r.children.map(toSubsection),
  };
}

/* ─────────────────────────────── */
/* ViewPostPage                    */
/* ─────────────────────────────── */
export default function ViewPostPage() {
  const router = useRouter();
  const { PostId } = useParams() as { PostId: string };

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Close overlay
  const close = () => router.back();

  useEffect(() => {
    (async () => {
      try {
        const { post } = await fetchFromAPI<{ post: PostDetail }>(
          `/dashboardadmin/blog/post/${PostId}`,
        );
        setPost(post);
      } catch {
        setErr("Failed to load post.");
      } finally {
        setLoading(false);
      }
    })();
  }, [PostId]);

  // ——— no “: JSX.Element” annotation needed here
  const renderSec = (s: Subsection, d = 0, i = 0) => (
    <div key={`${d}-${i}`} className="flex flex-col gap-4">
      {s.imageUrl && (
        <Image
          src={s.imageUrl}
          width={1000}
          height={600}
          alt=""
          className="h-[300px] w-full object-cover"
        />
      )}
      <p
        className={`flex items-baseline gap-2 font-bold ${
          d === 0 ? "pl-8 text-xl" : "pl-16 text-lg"
        }`}
      >
        <span>{prefix(d, i)}.</span>
        <span>{s.title}</span>
      </p>
      {!isEmptyDesc(s.description) ? (
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: formatLinks(s.description) }}
        />
      ) : (
        <p className="text-gray-500">Section description</p>
      )}
      {s.children.map((c, idx) => renderSec(c, d + 1, idx))}
    </div>
  );

  if (loading) return;
  if (err || !post) return <ErrorPopup message={err ?? "Unknown error"} onClose={close} />;

  const {
    title,
    description,
    imageUrl,
    subsections,
    postCategorie,
    postSubCategorie,
    author,
    vadmin,
    createdAt,
    updatedAt,
  } = post;

  const subsTree = subsections.map(toSubsection);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="relative flex h-full w-full flex-col overflow-y-auto bg-white shadow-xl">
        <button
          onClick={close}
          className="absolute right-3 top-3 p-1 text-gray-600 hover:text-gray-800"
        >
          <MdClose size={22} />
        </button>

        {/* Header */}
        <header className="border-b border-gray-200 px-8 pt-6 pb-4">
          <h1 className="text-3xl font-semibold">{title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span>
              Category:&nbsp;
              {typeof postCategorie === "string"
                ? postCategorie
                : postCategorie?.name ?? "—"}
            </span>
            {postSubCategorie && (
              <span>
                Sub:&nbsp;
                {typeof postSubCategorie === "string"
                  ? postSubCategorie
                  : postSubCategorie?.name ?? "—"}
              </span>
            )}
            {author && (
              <span>
                Author:&nbsp;
                {typeof author === "string" ? author : author.username}
              </span>
            )}
            <span>Status: {vadmin}</span>
            <span>Created: {new Date(createdAt).toLocaleString()}</span>
            <span>Updated: {new Date(updatedAt).toLocaleString()}</span>
          </div>
        </header>

        {/* Content */}
        <main className="space-y-6 p-8">
          {imageUrl && (
            <Image
              src={imageUrl}
              width={1200}
              height={700}
              alt=""
              className="h-[350px] w-full rounded object-cover"
            />
          )}

          {!isEmptyDesc(description) ? (
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: formatLinks(description) }}
            />
          ) : (
            <p className="text-gray-500">No description provided.</p>
          )}

          {subsTree.length > 0 && (
            <section className="flex flex-col gap-8">
              {subsTree.map((s, i) => renderSec(s, 0, i))}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
