"use client";

import React, { useState, useRef, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FaSpinner } from "react-icons/fa6";
import { MdArrowForwardIos, MdDelete } from "react-icons/md";
import { PiImage } from "react-icons/pi";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

interface FormFields {
  name: string;
  description: string;
  email: string;
  phone: string;
  vat: string;
  address: string;
  city: string;
  zipcode: string;
  governorate: string;
  facebook: string;
  linkedin: string;
  instagram: string;
}

export default function UpdateCompanyDataPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const companyId = params.id;

  const logoInput = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<FormFields>({
    name: "",
    description: "",
    email: "",
    phone: "",
    vat: "",
    address: "",
    city: "",
    zipcode: "",
    governorate: "",
    facebook: "",
    linkedin: "",
    instagram: "",
  });

  const [logoPreview, setLogoPreview] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      try {
        const { companyInfo } = await fetchFromAPI<{
          companyInfo: {
            name: string;
            description: string;
            email: string;
            phone: string | number;
            vat?: string;
            address: string;
            city: string;
            zipcode: string;
            governorate: string;
            facebook?: string;
            linkedin?: string;
            instagram?: string;
            logoImageUrl?: string;
          };
        }>("/dashboardadmin/website/company-info/getCompanyInfo");

        if (companyInfo) {
          setForm({
            name: companyInfo.name,
            description: companyInfo.description,
            email: companyInfo.email,
            phone: companyInfo.phone?.toString?.() ?? String(companyInfo.phone ?? ""),
            vat: companyInfo.vat ?? "",
            address: companyInfo.address,
            city: companyInfo.city,
            zipcode: companyInfo.zipcode,
            governorate: companyInfo.governorate,
            facebook: companyInfo.facebook ?? "",
            linkedin: companyInfo.linkedin ?? "",
            instagram: companyInfo.instagram ?? "",
          });
          setLogoPreview(companyInfo.logoImageUrl);
        }
      } catch {
        setErrorMsg("Échec du chargement des données de l’entreprise.");
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    setPreview: React.Dispatch<React.SetStateAction<string | undefined>>
  ) => {
    const file = e.target.files?.[0] ?? null;
    if (file) setPreview(URL.createObjectURL(file));
  };

  const clearFile = (
    inputRef: React.RefObject<HTMLInputElement | null>,
    setPreview: React.Dispatch<React.SetStateAction<string | undefined>>
  ) => {
    setPreview(undefined);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setErrorMsg(undefined);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (logoInput.current?.files?.[0]) data.append("logo", logoInput.current.files[0]);
      await fetchFromAPI<{ success: boolean }>(
        `/dashboardadmin/website/company-info/updateCompanyInfo/${companyId}`,
        { method: "PUT", body: data }
      );
      router.push("/dashboard/manage-website/company-data");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Une erreur inattendue s’est produite lors de la mise à jour.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const containerMinH = loading ? "min-h-[100svh]" : "";

  return (
    <div className={`mx-auto px-2 py-4 w-[95%] flex flex-col gap-4 bg-green-50 rounded-xl mb-6 ${containerMinH}`} aria-busy={loading}>
      <div className="flex h-16 items-start justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold uppercase">Mettre à jour les données</h1>
          <nav className="text-sm underline flex items-center gap-2">
            <Link href="/dashboard/manage-website/company-data" className="text-gray-500 hover:underline">
              Données de l’entreprise
            </Link>
            <MdArrowForwardIos className="text-gray-400" size={14} />
            <span className="text-gray-700 font-medium">Mise à jour</span>
          </nav>
        </div>
        <div className="flex items-start gap-2">
          <Link href="/dashboard/manage-website/company-data">
            <button type="button" className="btn-fit-white-outline disabled:opacity-50" disabled={submitLoading}>
              Annuler
            </button>
          </Link>
          <button
            type="submit"
            form="company-update-form"
            className="btn-fit-white-outline disabled:opacity-50 flex items-center gap-2"
            disabled={submitLoading}
          >
            {submitLoading && <FaSpinner className="animate-spin" />}
            Mettre à jour les informations
          </button>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-green-50">
          <FaSpinner className="animate-spin text-3xl" />
        </div>
      )}

      {errorMsg && <ErrorPopup message={errorMsg} onClose={() => setErrorMsg(undefined)} />}

      <form id="company-update-form" onSubmit={handleSubmit} className="flex flex-col gap-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="relative h-64 rounded-md border border-primary/20 bg-white overflow-hidden cursor-pointer"
            onClick={() => logoInput.current?.click()}
          >
            <div className="absolute top-2 left-2 z-10 text-gray-500 hover:text-gray-700">
              <PiImage size={22} />
            </div>
            <input
              ref={logoInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, setLogoPreview)}
            />
            {logoPreview ? (
              <div className="relative w-full h-full">
                <Image src={logoPreview} alt="Logo de l’entreprise" fill unoptimized className="object-contain p-4" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile(logoInput, setLogoPreview);
                  }}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-100 transition"
                >
                  <MdDelete size={16} className="text-red-600" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Cliquez pour importer<br />Logo
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-md border border-primary/20 p-4">
          <h2 className="text-lg font-semibold mb-3">Informations générales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["name", "email", "phone", "vat"] as const).map((field) => (
              <div key={field} className="flex flex-col gap-2">
                <label htmlFor={field} className="text-sm font-medium">
                  {field === "name" && "Nom"}
                  {field === "email" && "E-mail"}
                  {field === "phone" && "Téléphone"}
                  {field === "vat" && "Matricule fiscale / TVA"}
                </label>
                <input
                  id={field}
                  type={field === "email" ? "email" : "text"}
                  value={form[field]}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-3 py-2 bg-white border-primary/20"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2 bg-white border-primary/20"
            />
          </div>
        </div>

        <div className="bg-white rounded-md border border-primary/20 p-4">
          <h2 className="text-lg font-semibold mb-3">Adresse</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["address", "city", "zipcode", "governorate"] as const).map((field) => (
              <div key={field} className="flex flex-col gap-2">
                <label htmlFor={field} className="text-sm font-medium">
                  {field === "address" && "Adresse"}
                  {field === "city" && "Ville"}
                  {field === "zipcode" && "Code postal"}
                  {field === "governorate" && "Gouvernorat"}
                </label>
                <input
                  id={field}
                  type="text"
                  value={form[field]}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-3 py-2 bg-white border-primary/20"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-md border border-primary/20 p-4 mb-2">
          <h2 className="text-lg font-semibold mb-3">Réseaux sociaux</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["facebook", "linkedin", "instagram"] as const).map((field) => (
              <div key={field} className="flex flex-col gap-2">
                <label htmlFor={field} className="text-sm font-medium">
                  {field === "facebook" && "Facebook"}
                  {field === "linkedin" && "LinkedIn"}
                  {field === "instagram" && "Instagram"}
                </label>
                <input
                  id={field}
                  type="text"
                  value={form[field]}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 bg-white border-primary/20"
                />
              </div>
            ))}
          </div>
        </div>
      </form>

      <Overlay show={submitLoading} message="Mise à jour des données de l’entreprise en cours…" />

    </div>
  );
}
