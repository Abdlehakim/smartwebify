/* ------------------------------------------------------------------
   src/components/product/categorie/ProductCard.tsx
------------------------------------------------------------------ */
"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaRegHeart, FaHeart } from "react-icons/fa6";
import { FaSpinner } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { addItem, type CartItem } from "@/store/cartSlice";
import { addToWishlist, removeFromWishlist } from "@/store/wishlistSlice";
import ReviewClient from "@/components/product/reviews/ReviewClient";
import { RootState } from "@/store";
import { Product } from "@/types/Product";
import { useCurrency } from "@/contexts/CurrencyContext";
import { fetchData } from "@/lib/fetchData";

/* ---------- attribute types ---------- */
type AttrColor = { name: string; hex: string; image?: string };
type AttrOther = { name: string; value?: string; image?: string };
type AttrVal = string | AttrColor | AttrOther;

type AttrSelectedObj = { _id: string; name: string; type: string | string[] };
type AttrSelected = AttrSelectedObj | string;
type AttrRow = { attributeSelected: AttrSelected; value?: AttrVal | AttrVal[] };

type ProductWithAttrs = Product & {
  attributes?: AttrRow[];
  /** Optional LQIP provided by API (Base64 tiny JPEG preferred) */
  mainImageBlur?: string;
};

function isAttrSelectedObj(x: AttrSelected): x is AttrSelectedObj {
  return typeof x === "object" && x !== null && "_id" in x && "name" in x;
}
function isAttrColor(x: AttrVal): x is AttrColor {
  return typeof x === "object" && x !== null && "hex" in x;
}
function isAttrOther(x: AttrVal): x is AttrOther {
  return typeof x === "object" && x !== null && !("hex" in x);
}

type Selections = {
  selected?: Record<string, string>;
  selectedNames?: Record<string, string>;
};

function pickFirstsFromRows(rows?: AttrRow[]): Selections {
  if (!rows || rows.length === 0) return {};
  const selected: Record<string, string> = {};
  const selectedNames: Record<string, string> = {};
  for (const row of rows) {
    const sel = row.attributeSelected;
    const id = isAttrSelectedObj(sel) ? String(sel._id) : String(sel ?? "");
    const label = isAttrSelectedObj(sel) ? String(sel.name) : String(sel ?? "");
    if (!id || !label) continue;

    const v = row.value;
    let firstLabel: string | undefined;

    if (typeof v === "string") {
      firstLabel = v;
    } else if (Array.isArray(v) && v.length > 0) {
      const first = v[0];
      if (typeof first === "string") firstLabel = first;
      else if (isAttrColor(first)) firstLabel = String(first.name ?? "");
      else if (isAttrOther(first)) {
        const nm = String(first.name ?? "");
        const vv = typeof first.value === "string" ? first.value.trim() : "";
        firstLabel = vv ? `${nm} ${vv}`.trim() : nm;
      }
    }

    if (firstLabel) {
      selected[id] = firstLabel;
      selectedNames[label] = firstLabel;
    }
  }
  return {
    selected: Object.keys(selected).length ? selected : undefined,
    selectedNames: Object.keys(selectedNames).length ? selectedNames : undefined,
  };
}

async function getSelections(product: Product): Promise<Selections> {
  const withAttrs = product as ProductWithAttrs;
  if (withAttrs.attributes && withAttrs.attributes.length > 0) {
    return pickFirstsFromRows(withAttrs.attributes);
  }
  try {
    const rows = await fetchData<AttrRow[]>(
      `products/MainProductSection/attributes/${product._id}`
    );
    return pickFirstsFromRows(rows ?? []);
  } catch {
    return {};
  }
}

/* -------- number coercion helper (no any) -------- */
const toNumber = (v: unknown, fallback = 0): number => {
  const n =
    typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
};

interface ProductCardProps {
  products: (Product & { mainImageBlur?: string })[];
}

type BtnState = "loading" | "success";

/** px-based sizes so Next selects ~280–320 px (not 640) */
const cardSizes =
  "(max-width: 640px) 45vw, (max-width: 1024px) 33vw, 280px";

const ProductCard: React.FC<ProductCardProps> = ({ products }) => {
  const { fmt } = useCurrency();
  const dispatch = useDispatch();
  const wishlist = useSelector((s: RootState) => s.wishlist.items);
  const isInWishlist = (slug: string) => wishlist.some((w) => w.slug === slug);

  const [btnStates, setBtnStates] = useState<
    Record<string, BtnState | undefined>
  >({});

  const handleWishlistClick = (product: Product) => {
    if (!product.categorie) return;
    dispatch(
      isInWishlist(product.slug)
        ? removeFromWishlist(product.slug)
        : addToWishlist({
            name: product.name,
            mainImageUrl: product.mainImageUrl,
            price: toNumber(product.price),
            categorie: {
              name: product.categorie.name,
              slug: product.categorie.slug,
            },
            slug: product.slug,
          })
    );
  };

  const handleAddToCart = async (product: Product, isOutOfStock: boolean) => {
    if (isOutOfStock || btnStates[product._id] === "loading") return;

    setBtnStates((p) => ({ ...p, [product._id]: "loading" }));

    const { selected, selectedNames } = await getSelections(product);

    type TvaLike = { tva?: number | string | null | undefined };
    const priceNum = toNumber(product.price);
    const tvaNum = toNumber((product as Product & TvaLike).tva);
    const discountNum = toNumber(product.discount);

    const base: Omit<CartItem, "quantity"> = {
      _id: product._id,
      name: product.name,
      reference: product.reference,
      price: priceNum,
      tva: tvaNum,
      mainImageUrl: product.mainImageUrl,
      discount: discountNum,
      slug: product.slug,
      categorie: product.categorie
        ? { name: product.categorie.name, slug: product.categorie.slug }
        : { name: "inconnue", slug: "categorie" },
      ...(product.subcategorie && {
        subcategorie: {
          name: product.subcategorie.name,
          slug: product.subcategorie.slug,
        },
      }),
      ...(selected && { selected }),
      ...(selectedNames && { selectedNames }),
    };

    dispatch(addItem({ item: base, quantity: 1 }));

    setTimeout(() => {
      setBtnStates((p) => ({ ...p, [product._id]: "success" }));
      setTimeout(() => {
        setBtnStates((p) => {
          const clone = { ...p };
          delete clone[product._id];
          return clone;
        });
      }, 500);
    }, 1000);
  };

  return (
    <div className="group w-fit h-fit grid grid-cols-4 max-2xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-[40px]">
      {products.map((product, idx) => {
        const priceNum = toNumber(product.price);
        const discountNum = toNumber(product.discount);

        const discountedPrice = discountNum
          ? priceNum - priceNum * (discountNum / 100)
          : priceNum;

        const isOutOfStock =
          product.stockStatus === "out of stock" || product.stock === 0;

        const parentSlug =
          product.subcategorie?.slug ?? product.categorie?.slug ?? "categorie";
        const productUrl = `/${parentSlug}/${product.slug}`;

        const state = btnStates[product._id];
        const isLoading = state === "loading";
        const isSuccess = state === "success";

        // Only the first card is the likely LCP
        const isLCP = idx === 0;

        // Ignore SVG shimmer placeholders (cause the 2.2 KiB "Unattributable")
        const blur =
          product.mainImageBlur &&
          !product.mainImageBlur.startsWith("data:image/svg")
            ? product.mainImageBlur
            : undefined;

        return (
          <div
            key={product._id}
            className="h-fit w-[280px] flex flex-col gap-[10px] transform duration-200 ease-in-out group-hover:scale-[0.9] hover:!scale-[1.1] max-md:group-hover:scale-[1] max-md:hover:!scale-[1]"
          >
            <Link href={productUrl}>
              {/* match the CDN transform: square thumbnail */}
              <div
                className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden"
                style={{
                  contentVisibility: "auto",
                  containIntrinsicSize: "280px 280px",
                }}
              >
                <Image
                  src={product.mainImageUrl ?? ""}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes={cardSizes}                 // px-based sizes → ~280 px source
                  quality={70}
                  // LCP only: eager + high, others: lazy
                  priority={isLCP}
                  fetchPriority={isLCP ? "high" : "auto"}
                  loading={isLCP ? "eager" : "lazy"}
                  decoding="async"
                  // Show blur only for LCP and only if it's NOT an SVG shimmer
                  placeholder={isLCP && blur ? "blur" : "empty"}
                  blurDataURL={isLCP ? blur : undefined}
                  draggable={false}
                />
              </div>
            </Link>

            <div className="flex flex-col w-full h-[80px]">
              <Link href={productUrl}>
                <div className="flex justify-between h-[65px] max-sm:h-16 max-md:h-20">
                  <div className="flex flex-col gap-[4px]">
                    <p className="text-lg font-bold capitalize">
                      {product.name?.length > 24
                        ? product.name.slice(0, 24) + "..."
                        : product.name}
                    </p>
                    <ReviewClient productId={product._id} summary />
                  </div>

                  <div className="flex flex-col gap-[4px] text-right truncate">
                    {discountNum ? (
                      <>
                        <p className="text-base max-md:text-lg font-bold text-primary">
                          {fmt(discountedPrice)}
                        </p>
                        <p className="text-sm max-md:text-sm font-bold text-gray-500 line-through">
                          {fmt(priceNum)}
                        </p>
                      </>
                    ) : (
                      <p className="text-base max-md:text-lg font-bold text-primary">
                        {fmt(priceNum)}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </div>

            <div className="flex justify-between h-[45px] text-lg max-md:text-sm">
              <button
                disabled={isOutOfStock || isLoading}
                onClick={() => handleAddToCart(product, isOutOfStock)}
                className={`AddtoCart relative w-[50%] max-lg:w-[60%] max-md:rounded-[3px] hover:bg-secondary hover:text-white ${
                  isOutOfStock || isLoading || isSuccess
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-[#15335D]"
                }`}
              >
                {isOutOfStock ? (
                  <p className="flex items-center justify-center transition-transform duration-300 text-sm">
                    Rupture de stock
                  </p>
                ) : isLoading ? (
                  <div className="flex items-center justify-center">
                    <FaSpinner className="w-5 h-5 animate-spin" />
                  </div>
                ) : isSuccess ? (
                  <p className="flex items-center justify-center text-sm">
                    Produit ajouté
                  </p>
                ) : (
                  <p className="flex items-center justify-center text-sm">
                    A. au panier
                  </p>
                )}
              </button>

              <Link href={productUrl} className="w-[25%] max-lg:w-[30%]">
                <button className="AddtoCart relative h-full w-full bg-white text-primary border border-primary max-md:rounded-[3px] group/box hover:bg-primary hover:text-white">
                  <span className="flex items-center justify-center">Voir</span>
                </button>
              </Link>

              <button
                aria-label="wishlist"
                onClick={() => handleWishlistClick(product)}
                className={`AddtoCart relative w-[15%] bg-white border max-lg:hidden max-md:rounded-[3px] group/box border-primary ${
                  isInWishlist(product.slug)
                    ? " text-red-500 hover:bg-red-500 hover:text-white"
                    : " text-primary hover:bg-primary hover:text-white"
                }`}
              >
                {isInWishlist(product.slug) ? (
                  <FaHeart className="w-5 h-5" />
                ) : (
                  <FaRegHeart className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductCard;
