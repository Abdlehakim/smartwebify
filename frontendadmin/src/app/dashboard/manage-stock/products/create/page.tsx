// ───────────────────────────────────────────────────────────────
// src/app/dashboard/manage-stock/products/create/page.tsx
// ───────────────────────────────────────────────────────────────
"use client";

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  ChangeEvent,
  FormEvent,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";

import { fetchFromAPI } from "@/lib/fetchFromAPI";
import Stepper from "@/components/Stepper";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import ProductBreadcrumb from "@/components/addproductsteps/ProductBreadcrumb";
import WizardNav from "@/components/addproductsteps/WizardNav";
import StepDetails from "@/components/addproductsteps/StepDetails";
import StepData from "@/components/addproductsteps/StepData";
import StepAttributesDetails, {
  AttributePayload,
  AttributeDef,
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

function cleanAttributeValue(
  value: string | AttributeRow[] | undefined
): string | AttributeRow[] {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value
      .filter((r) => r.name.trim())
      .map((r) => {
        const row: AttributeRow = { name: r.name.trim() };
        if (r.value?.trim()) row.value = r.value.trim();
        if (r.hex?.trim()) {
          row.hex = r.hex.trim();
          if (!row.value) row.value = row.hex;
        }
        if (r.image?.trim()) row.image = r.image.trim();
        if (r.imageId?.trim()) row.imageId = r.imageId.trim();
        return row;
      });
  }
  return "";
}

export interface ProductForm {
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

type Category = { _id: string; name: string };
type SubCategory = { _id: string; name: string };
type Magasin = { _id: string; name: string };
type Brand = { _id: string; name: string };

export default function CreateProductPage() {
  const router = useRouter();

  const mainRef = useRef<HTMLInputElement>(null);
  const extraRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ProductForm>(blankForm);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [extraImages, setExtraImages] = useState<File[]>([]);

  const [defs, setDefs] = useState<AttributeDef[]>([]);
  const [attrPayload, setAttrPayload] = useState<AttributePayload[]>([]);
  const [detailsPayload, setDetailsPayload] = useState<ProductDetailPair[]>([]);
  const [fileMap, setFileMap] = useState<Map<string, File>>(new Map());
  const [subByCat, setSubByCat] = useState<Record<string, SubCategory[]>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    fetchFromAPI<{ productAttributes: AttributeDef[] }>(
      "/dashboardadmin/stock/productattribute"
    )
      .then(({ productAttributes }) => setDefs(productAttributes))
      .catch((e) => console.error(e));
  }, []);

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

        // categories
        setCategories(list.map(({ _id, name }) => ({ _id, name })));

        // build mapping + flat list
        const byCat: Record<string, SubCategory[]> = {};
        const flatSubs: SubCategory[] = [];
        for (const c of list) {
          const subs = (c.subcategories ?? []).map((s) => ({
            _id: s._id,
            name: s.name,
          }));
          byCat[c._id] = subs;
          flatSubs.push(...subs);
        }
        setSubByCat(byCat);
        setSubcategories(flatSubs);

        const shopsRes = await fetchFromAPI<{ magasins?: Magasin[] }>(
          "/dashboardadmin/stock/magasins"
        );
        setMagasins(shopsRes.magasins ?? []);

        const brandsRes = await fetchFromAPI<{ brands?: Brand[] }>(
          "/dashboardadmin/stock/brands"
        );
        setBrands(brandsRes.brands ?? []);
      } catch (e) {
        console.error("Échec du chargement des listes d’options :", e);
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

  const handleAttrsAndDetails = useCallback(
    (
      attrs: AttributePayload[],
      dets: ProductDetailPair[],
      fmap: Map<string, File>
    ) => {
      setAttrPayload(attrs);
      setDetailsPayload(dets);
      setFileMap(new Map(fmap));
    },
    []
  );

  const removeExtra = (idx: number) =>
    setExtraImages((prev) => prev.filter((_, i) => i !== idx));

  const onFixed = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) =>
    setForm((f) => {
      const { name, value } = e.target;
      const next = { ...f, [name]: value } as ProductForm;

      if (name === "categorie") {
        const allowed = (subByCat[value] ?? []).some(
          (s) => s._id === next.subcategorie
        );
        if (!allowed) next.subcategorie = ""; // reset if not in the selected category
      }
      return next;
    });

  const next = () => {
    setError(null);
    if (step === 3) {
      const invalid = attrPayload.some((a) =>
        Array.isArray(a.value) ? a.value.some((r) => !r.name.trim()) : false
      );
      if (invalid) {
        setError(
          "Chaque ligne d’attribut doit avoir un nom (les autres champs sont facultatifs)."
        );
        return;
      }
    }
    setStep((s) => (s < 4 ? ((s + 1) as 2 | 3 | 4) : s));
  };
  const back = () => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!mainImage) {
      setError("L’image principale est requise.");
      setStep(1);
      return;
    }
    setSaving(true);

    try {
      const fd = new FormData();

      Object.entries(form).forEach(([k, v]) => {
        fd.append(k, v);
      });

      fd.append("mainImage", mainImage);
      extraImages.forEach((f) => fd.append("extraImages", f));

type ServerAttr =
  | { attributeSelected: string; value: AttributeRow[] }
  | { attributeSelected: string; value: string };

const serverAttrs = attrPayload
  .map<ServerAttr | null>(({ attributeSelected, value }) => {
    const id = (attributeSelected ?? "").trim();
    if (!id) return null; // drop rows without a selected attribute

    const cleaned = cleanAttributeValue(value);

    if (typeof cleaned === "string") {
      const s = cleaned.trim();
      if (!s) return null;
      return { attributeSelected: id, value: s };
    }

    if (Array.isArray(cleaned) && cleaned.length > 0) {
      return { attributeSelected: id, value: cleaned };
    }

    return null;
  })
  .filter((x): x is ServerAttr => x !== null);

fd.append("attributes", JSON.stringify(serverAttrs));


      const serverDetails = detailsPayload
        .filter((d) => d.name.trim())
        .map(({ name, description, image }) => ({
          name: name.trim(),
          description: description?.trim() ?? "",
          image,
        }));
      fd.append("productDetails", JSON.stringify(serverDetails));

      const attrEntries = [...fileMap.entries()].filter(([k]) =>
        k.startsWith("attributeImages-")
      );
      const detailEntries = [...fileMap.entries()]
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

      await fetchFromAPI("/dashboardadmin/stock/products/create", {
        method: "POST",
        body: fd,
      });

      setSuccess(true);
      setTimeout(() => router.push("/dashboard/manage-stock/products"), 2000);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : String(err) || "Échec de création du produit";
      setError(message);
      setSaving(false);
    }
  };

  const chooseMain = () => mainRef.current?.click();
  const chooseExtra = () => extraRef.current?.click();

  return (
    <div className="relative mx-auto pt-4 w-[95%] flex flex-col gap-4 h-full">
      <ProductBreadcrumb
        baseHref="/dashboard/manage-stock/products"
        baseLabel="Tous les produits"
        currentLabel="Créer un produit"
      />

      <Stepper
        steps={["Détails", "Données", "Attributs", "Aperçu"]}
        currentStep={step}
        onStepClick={(s) => setStep(s as 1 | 2 | 3 | 4)}
      />

      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col justify-between gap-8 h-fit "
      >
        {step === 1 && (
          <StepDetails
            form={form}
            onFixed={onFixed}
            mainImage={mainImage}
            extraImages={extraImages}
            chooseMain={chooseMain}
            chooseExtra={chooseExtra}
            clearMain={() => setMainImage(null)}
            removeExtra={removeExtra}
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
            ready={true}
            onChange={handleAttrsAndDetails}
          />
        )}

        {step === 4 && (
          <StepReview
            form={form}
            mainImage={mainImage}
            extraImages={extraImages}
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
          submitLabel="Créer le produit"
          submittingLabel="Création…"
        />

        <input
          ref={mainRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setMainImage(e.target.files?.[0] || null)}
        />
        <input
          ref={extraRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const files = e.target.files ? Array.from(e.target.files) : [];
            setExtraImages((prev) => [...prev, ...files]);
          }}
        />
      </form>

      <Overlay
        show={saving || success}
        message={
          success
            ? "Produit créé avec succès"
            : "Le produit est en cours de création…"
        }
      />
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </div>
  );
}
