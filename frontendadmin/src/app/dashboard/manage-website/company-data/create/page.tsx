// src/app/dashboard/manage-website/company-data/create/page.tsx
"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaSpinner } from "react-icons/fa6";
import { MdArrowForwardIos } from "react-icons/md";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";

interface FormFields {
  name: string;
  description: string;
  email: string;
  phone: string;
  vat: string;          // ← NEW: Matricule fiscale
  address: string;
  city: string;
  zipcode: string;
  governorate: string;
  facebook: string;
  linkedin: string;
  instagram: string;
}

export default function CreateCompanyDataPage() {
  const [form, setForm] = useState<FormFields>({
    name: "",
    description: "",
    email: "",
    phone: "",
    vat: "",            // ← NEW
    address: "",
    city: "",
    zipcode: "",
    governorate: "",
    facebook: "",
    linkedin: "",
    instagram: "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [contactBannerFile, setContactBannerFile] = useState<File | null>(null);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [contactBannerPreview, setContactBannerPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // include "vat" in the basic fields
  const basicFields: Array<keyof Pick<FormFields, "name" | "email" | "phone" | "vat">> = [
    "name",
    "email",
    "phone",
    "vat", // ← NEW
  ];
  const addressFields: Array<
    keyof Pick<FormFields, "address" | "city" | "zipcode" | "governorate">
  > = ["address", "city", "zipcode", "governorate"];
  const socialFields: Array<keyof Pick<FormFields, "facebook" | "linkedin" | "instagram">> = [
    "facebook",
    "linkedin",
    "instagram",
  ];

  // nice label for vat
  const labelFor = (field: string) =>
    field === "vat"
      ? "Matricule fiscale"
      : field.charAt(0).toUpperCase() + field.slice(1);

  /* ----------------- handlers ----------------- */
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>,
    previewSetter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0] ?? null;
    setter(file);
    previewSetter(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, val]) => data.append(key, val));
      if (bannerFile) data.append("banner", bannerFile);
      if (logoFile) data.append("logo", logoFile);
      if (contactBannerFile) data.append("contactBanner", contactBannerFile);

      const res = await fetchFromAPI<{ success: boolean; message: string }>(
        "/dashboardadmin/website/company-info/createCompanyInfo",
        { method: "POST", body: data }
      );

      if (res.success) {
        window.location.href = "/dashboard/manage-website/company-data";
      } else {
        setErrorMsg(res.message || "Failed to create company data.");
      }
    } catch (err: unknown) {
      console.error("Create Company Data Error:", err);
      setErrorMsg(err instanceof Error ? err.message : "Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  /* ----------------- UI ----------------- */
  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      {/* Header + Breadcrumb */}
      <div className="flex justify-start gap-2 flex-col h-16">
        <h1 className="text-3xl font-bold">Create Company Data</h1>
        <nav className="text-sm underline flex items-center gap-2">
          <Link
            href="/dashboard/manage-website/company-data"
            className="text-gray-500 hover:underline"
          >
            Company Data
          </Link>
          <MdArrowForwardIos className="text-gray-400" size={14} />
          <span className="text-gray-700 font-medium">Create Entry</span>
        </nav>
      </div>

      {/* Loading / Form */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <FaSpinner className="animate-spin text-3xl text-gray-600" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-6">
          {/* Logo, Banner & Contact Banner */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Logo */}
            <div className="relative border-2 border-gray-300 rounded-lg h-64 md:w-1/5 overflow-hidden">
              {logoPreview ? (
                <Image src={logoPreview} alt="Logo Preview" fill className="object-contain p-4" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No logo selected
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, setLogoFile, setLogoPreview)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            {/* Main Banner */}
            <div className="relative border-2 border-gray-300 rounded-lg h-64 md:w-2/5 overflow-hidden">
              {bannerPreview ? (
                <Image src={bannerPreview} alt="Banner Preview" fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No banner selected
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, setBannerFile, setBannerPreview)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            {/* Contact Banner */}
            <div className="relative border-2 border-gray-300 rounded-lg h-64 md:w-2/5 overflow-hidden">
              {contactBannerPreview ? (
                <Image
                  src={contactBannerPreview}
                  alt="Contact Banner Preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No contact banner selected
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleFileChange(e, setContactBannerFile, setContactBannerPreview)
                }
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {basicFields.map((field) => (
              <div key={field} className="flex flex-col gap-2">
                <label htmlFor={field} className="text-sm font-medium">
                  {labelFor(field)}
                </label>
                <input
                  id={field}
                  type={field === "email" ? "email" : "text"}
                  value={form[field]}
                  onChange={handleInputChange}
                  required
                  className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-100"
                />
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={handleInputChange}
              required
              className="border-2 border-gray-300 rounded p-2 bg-gray-100 w-full"
            />
          </div>

          <hr className="border-t border-gray-300 mb-4" />

          {/* Address Info */}
          <h2 className="text-xl font-semibold uppercase">Address Info</h2>
          <hr className="border-t border-gray-300 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addressFields.map((field) => (
              <div key={field} className="flex flex-col gap-2">
                <label htmlFor={field} className="text-sm font-medium">
                  {labelFor(field)}
                </label>
                <input
                  id={field}
                  type="text"
                  value={form[field]}
                  onChange={handleInputChange}
                  required
                  className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-100"
                />
              </div>
            ))}
          </div>

          <hr className="border-t border-gray-300 mb-4" />

          {/* Social Media */}
          <h2 className="text-xl font-semibold uppercase">Social Media</h2>
          <hr className="border-t border-gray-300 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-8">
            {socialFields.map((field) => (
              <div key={field} className="flex flex-col gap-2">
                <label htmlFor={field} className="text-sm font-medium">
                  {labelFor(field)}
                </label>
                <input
                  id={field}
                  type="text"
                  value={form[field]}
                  onChange={handleInputChange}
                  className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-100"
                />
              </div>
            ))}
          </div>

          {/* Submit + Cancel */}
          <div className="flex justify-center gap-8">
            <Link href="/dashboard/manage-website/company-data">
              <button
                type="button"
                disabled={loading}
                className="px-6 py-2 bg-quaternary text-white rounded disabled:opacity-50"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-tertiary text-white rounded disabled:opacity-50"
            >
              {loading ? "Creating…" : "Create Company Data"}
            </button>
          </div>
        </form>
      )}

      {/* Overlays */}
      <Overlay show={loading} />
      {errorMsg && <ErrorPopup message={errorMsg} onClose={() => setErrorMsg(null)} />}
    </div>
  );
}
