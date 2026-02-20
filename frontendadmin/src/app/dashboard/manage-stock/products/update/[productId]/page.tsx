// ───────────────────────────────────────────────────────────────
// src/app/dashboard/manage-stock/products/update/[productId]/page.tsx
// ───────────────────────────────────────────────────────────────
"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  ChangeEvent,
  FormEvent,
  useMemo,
} from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import ProductBreadcrumb from "@/components/addproductsteps/ProductBreadcrumb";
import WizardNav from "@/components/addproductsteps/WizardNav";
import Stepper from "@/components/Stepper";
import StepDetails from "@/components/addproductsteps/StepDetails";
import StepData from "@/components/addproductsteps/StepData";
import StepAttributesDetails, {
  AttributeDef,
  AttributePayload,
  ProductDetailPair,
} from "@/components/addproductsteps/StepAttributesDetails";
import StepReview from "@/components/addproductsteps/StepReview";
import {
  STOCK_OPTIONS,
  PAGE_OPTIONS,
  ADMIN_OPTIONS,
  StockStatus,
  StatusPage,
  Vadmin,
} from "@/constants/product-options";

export interface AttributeRow {
  name: string;
  value?: string;
  hex?: string;
  image?: string;
  imageId?: string;
}

type ServerAttr =
  | { attributeSelected: string; value: AttributeRow[] }
  | { attributeSelected: string; value: string };

type ServerDetail = {
  name: string;
  description: string;
  image?: string | null;
};

interface ProductForm {
  name: string;
  info: string;
  description: string;
  categorie: string;
  subcategorie: string;
  magasin: string;
  brand: string;
  stock: string;
  price: string;
  tva: string;
  discount: string;
  stockStatus: StockStatus;
  statuspage: StatusPage;
  vadmin: Vadmin;
}

interface FetchedProduct {
  name: string;
  info: string;
  description: string;
  categorie: string;
  subcategorie?: string | null;
  magasin?: string | null;
  brand?: string | null;
  stock: number;
  price: number;
  tva: number;
  discount: number;
  stockStatus: StockStatus;
  statuspage: StatusPage;
  vadmin: Vadmin;
  attributes: AttributePayload[];
  productDetails: ProductDetailPair[];
  mainImageUrl?: string;
  extraImagesUrl?: string[];
}

/* List types (for options) */
type Category = { _id: string; name: string };
type SubCategory = { _id: string; name: string };
type Magasin = { _id: string; name: string };
type Brand = { _id: string; name: string };

function cleanAttributeValue(
  value: string | AttributeRow[] | undefined
): string | AttributeRow[] {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value
      .filter((r) => r.name.trim())
      .map((r) => {
        const clean: AttributeRow = { name: r.name.trim() };
        if (r.value?.trim()) clean.value = r.value.trim();
        if (r.hex?.trim()) {
          clean.hex = r.hex.trim();
          if (!clean.value) clean.value = r.hex;
        }
        if (r.image?.trim()) clean.image = r.image.trim();
        if (r.imageId?.trim()) clean.imageId = r.imageId.trim();
        return clean;
      });
  }
  return "";
}

export default function UpdateProductPage() {
  const router = useRouter();
  const { productId } = useParams();

  const mainRef = useRef<HTMLInputElement>(null);
  const extraRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subByCat, setSubByCat] = useState<Record<string, SubCategory[]>>({});

  const blankForm: ProductForm = {
    name: "",
    info: "",
    description: "",
    categorie: "",
    subcategorie: "",
    magasin: "",
    brand: "",
    stock: "0",
    price: "0",
    tva: "0",
    discount: "0",
    stockStatus: "in stock",
    statuspage: "none",
    vadmin: "not-approve",
  };
  const [form, setForm] = useState<ProductForm>(blankForm);

  const [existingMainImageUrl, setExistingMainImageUrl] = useState<string | null>(null);
  const [existingExtraImagesUrls, setExistingExtraImagesUrls] = useState<string[]>([]);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [extraImages, setExtraImages] = useState<File[]>([]);

  const [defs, setDefs] = useState<AttributeDef[]>([]);
  const [attrPayload, setAttrPayload] = useState<AttributePayload[]>([]);
  const [detailsPayload, setDetailsPayload] = useState<ProductDetailPair[]>([]);
  const [attributeFiles, setAttributeFiles] = useState<Map<string, File>>(new Map());

  /* Options lists */
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  /* Attribute definitions */
  useEffect(() => {
    fetchFromAPI<{ productAttributes: AttributeDef[] }>(
      "/dashboardadmin/stock/productattribute"
    )
      .then(({ productAttributes }) => setDefs(productAttributes))
      .catch((err) => console.error("Échec du chargement des attributs:", err));
  }, []);

  /* Product data */
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchFromAPI<FetchedProduct>(
          `/dashboardadmin/stock/products/${productId}`
        );

        setForm({
          name: data.name,
          info: data.info,
          description: data.description,
          categorie: data.categorie,
          subcategorie: data.subcategorie ?? "",
          magasin: data.magasin ?? "",
          brand: data.brand ?? "",
          stock: String(data.stock),
          price: String(data.price),
          tva: String(data.tva),
          discount: String(data.discount),
          stockStatus: data.stockStatus,
          statuspage: data.statuspage,
          vadmin: data.vadmin,
        });
        setAttrPayload(data.attributes || []);
        setDetailsPayload(data.productDetails || []);
        setExistingMainImageUrl(data.mainImageUrl ?? null);
        setExistingExtraImagesUrls(data.extraImagesUrl || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Échec du chargement du produit.");
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  useEffect(() => {
    (async () => {
      try {
        type CateSubcate = {
          _id: string;
          name: string;
          subcategories?: Array<{ _id: string; name: string }>;
        };

        const catsRes = await fetchFromAPI<{ categories?: CateSubcate[] }>(
          "/dashboardadmin/stock/categories/cateSubcate"
        );
        const list = catsRes.categories ?? [];

        setCategories(list.map(({ _id, name }) => ({ _id, name })));

        const byCat: Record<string, SubCategory[]> = {};
        const flatSubs: SubCategory[] = [];
        for (const c of list) {
          const subs = (c.subcategories ?? []).map((s) => ({ _id: s._id, name: s.name }));
          byCat[c._id] = subs;
          flatSubs.push(...subs);
        }
        setSubByCat(byCat);
        setSubcategories(flatSubs);

        const boutsRes = await fetchFromAPI<{ magasins?: Magasin[] }>(
          "/dashboardadmin/stock/magasins"
        );
        setMagasins(boutsRes.magasins ?? []);

        const brandsRes = await fetchFromAPI<{ brands?: Brand[] }>(
          "/dashboardadmin/stock/brands"
        );
        setBrands(brandsRes.brands ?? []);
      } catch (err) {
        console.error("Échec du chargement des listes d’options :", err);
      }
    })();
  }, []);

  const catMap = useMemo(
    () =>
      categories.reduce<Record<string, string>>((acc, cur) => {
        acc[cur._id] = cur.name;
        return acc;
      }, {}),
    [categories]
  );
  const subMap = useMemo(
    () =>
      subcategories.reduce<Record<string, string>>((acc, cur) => {
        acc[cur._id] = cur.name;
        return acc;
      }, {}),
    [subcategories]
  );
  const shopMap = useMemo(
    () =>
      magasins.reduce<Record<string, string>>((acc, cur) => {
        acc[cur._id] = cur.name;
        return acc;
      }, {}),
    [magasins]
  );
  const brandMap = useMemo(
    () =>
      brands.reduce<Record<string, string>>((acc, cur) => {
        acc[cur._id] = cur.name;
        return acc;
      }, {}),
    [brands]
  );

  const onFixed = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => {
      const next = { ...f, [name]: value } as ProductForm;
      if (name === "categorie") {
        const allowed = (subByCat[value] ?? []).some((s) => s._id === next.subcategorie);
        if (!allowed) next.subcategorie = "";
      }
      return next;
    });
  };

  const handleAttrsAndDetails = useCallback(
    (attrs: AttributePayload[], details: ProductDetailPair[], fileMap: Map<string, File>) => {
      setAttrPayload(attrs);
      setDetailsPayload(details);
      setAttributeFiles(fileMap);
    },
    []
  );

  const handleMainChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setMainImage(file);
    if (file) setExistingMainImageUrl(null);
  };

  const clearMain = () => {
    setMainImage(null);
    setExistingMainImageUrl(null);
    if (mainRef.current) mainRef.current.value = "";
  };

  const syncExtraInput = (files: File[]) => {
    if (!extraRef.current) return;
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    extraRef.current.files = dt.files;
  };

  const handleExtraChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setExtraImages((prev) => {
      const updated = [...prev, ...files];
      syncExtraInput(updated);
      return updated;
    });
  };

  const removeExtra = (idx: number) => {
    if (idx < existingExtraImagesUrls.length) {
      setExistingExtraImagesUrls((prev) => prev.filter((_, i) => i !== idx));
      return;
    }
    const fileIdx = idx - existingExtraImagesUrls.length;
    setExtraImages((prev) => {
      const newArr = prev.filter((_, i) => i !== fileIdx);
      syncExtraInput(newArr);
      return newArr;
    });
  };

  const next = () => {
    setError(null);
    if (step === 3) {
      const invalid = attrPayload.some((a) =>
        Array.isArray(a.value) ? a.value.some((row) => !row.name?.trim()) : false
      );
      if (invalid) {
        setError("Chaque ligne d’attribut doit avoir un nom (les autres champs sont facultatifs).");
        return;
      }
    }
    setStep((s) => (s < 4 ? ((s + 1) as 2 | 3 | 4) : s));
  };

  const back = () => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const fd = new FormData();

      Object.entries(form).forEach(([k, v]) => fd.append(k, v));

      if (mainImage) fd.append("mainImage", mainImage);
      else if (existingMainImageUrl === null) fd.append("removeMain", "1");

      extraImages.forEach((f) => fd.append("extraImages", f));
      fd.append("remainingExtraUrls", JSON.stringify(existingExtraImagesUrls));

      const serverAttrs = attrPayload
        .map<ServerAttr | null>(({ attributeSelected, value }) => {
          const cleaned = cleanAttributeValue(value);
          if (typeof cleaned === "string" && cleaned.trim())
            return { attributeSelected, value: cleaned };
          if (Array.isArray(cleaned) && cleaned.length > 0)
            return { attributeSelected, value: cleaned };
          return null;
        })
        .filter((e): e is ServerAttr => e !== null);

      fd.append("attributes", JSON.stringify(serverAttrs));

      const serverDetails: ServerDetail[] = detailsPayload
        .filter((d) => d.name.trim())
        .map(({ name, description, image }) => ({
          name: name.trim(),
          description: description?.trim() ?? "",
          image: image ?? "",
        }));
      fd.append("productDetails", JSON.stringify(serverDetails));

      const entries = [...attributeFiles.entries()];

      const attrEntries = entries.filter(([k]) => k.startsWith("attributeImages-"));
      const detailEntries = entries
        .filter(([k]) => k.startsWith("detailsImages-"))
        .sort((a, b) => {
          const ia = +a[0].split("-")[1]!;
          const ib = +b[0].split("-")[1]!;
          return ia - ib;
        });

      attrEntries.forEach(([key, file]) => {
        fd.append("attributeImages", file, key);
      });
      detailEntries.forEach(([key, file]) => {
        fd.append("detailsImages", file, key);
      });

      await fetchFromAPI(`/dashboardadmin/stock/products/update/${productId}`, {
        method: "PUT",
        body: fd,
      });

      setSuccess(true);
      setTimeout(() => router.push("/dashboard/manage-stock/products"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la mise à jour du produit.");
      setSaving(false);
    }
  };

  return (
    <div className="relative mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      <ProductBreadcrumb
        baseHref="/dashboard/manage-stock/products"
        baseLabel="Tous les produits"
        currentLabel="Mettre à jour le produit"
      />

      <Stepper
        steps={["Détails", "Données", "Attributs", "Aperçu"]}
        currentStep={step}
        onStepClick={(s) => setStep(s as 1 | 2 | 3 | 4)}
      />

      <form onSubmit={handleSubmit} className="flex flex-col justify-between gap-8 h-full">
        {step === 1 && (
          <StepDetails
            loading={loading}
            form={form}
            onFixed={onFixed}
            mainImage={mainImage}
            extraImages={extraImages}
            chooseMain={() => mainRef.current?.click()}
            chooseExtra={() => extraRef.current?.click()}
            clearMain={clearMain}
            removeExtra={removeExtra}
            existingMainImageUrl={existingMainImageUrl}
            existingExtraImagesUrls={existingExtraImagesUrls}
          />
        )}

        {step === 2 && (
          <StepData
            form={form}
            onFixed={onFixed}
            STOCK_OPTIONS={STOCK_OPTIONS}
            PAGE_OPTIONS={PAGE_OPTIONS}
            ADMIN_OPTIONS={ADMIN_OPTIONS}
            categories={categories}
            subcategories={subByCat[form.categorie] ?? []}
            magasins={magasins}
            brands={brands}
          />
        )}

        {step === 3 && (
          <StepAttributesDetails
            defs={defs}
            initialAttrs={attrPayload}
            initialDetails={detailsPayload}
            ready={!loading}
            onChange={handleAttrsAndDetails}
          />
        )}

        {step === 4 && (
          <StepReview
            form={form}
            mainImage={mainImage}
            existingMainImageUrl={existingMainImageUrl}
            extraImages={extraImages}
            existingExtraImagesUrls={existingExtraImagesUrls}
            attrPayload={attrPayload}
            detailsPayload={detailsPayload}
            lookupMaps={{
              categories: catMap,
              subcategories: subMap,
              magasins: shopMap,
              brands: brandMap,
            }}
          />
        )}

        <WizardNav
          step={step}
          saving={saving}
          onBack={back}
          onNext={next}
          onCancel={() => router.push("/dashboard/manage-stock/products")}
          submitLabel="Mettre à jour le produit"
          submittingLabel="Mise à jour..."
        />

        <input
          ref={mainRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleMainChange}
        />
        <input
          ref={extraRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*"
          onChange={handleExtraChange}
        />
      </form>

      <Overlay
        show={saving || success}
        message={success ? "Produit mis à jour avec succès" : "Le produit est en cours de création…"}
      />
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </div>
  );
}
