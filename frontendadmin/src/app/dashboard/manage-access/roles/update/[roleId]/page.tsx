"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { MdArrowForwardIos } from "react-icons/md";

interface FormData {
  name: string;
  description: string;
  permissions: string[];
}

export default function UpdateRolePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    name: "",
    description: "",
    permissions: [],
  });
  const [allPermissions, setAllPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPerms() {
      try {
        const res = await fetchFromAPI<{ permissions: string[] }>(
          "/dashboardadmin/getAllPermission"
        );
        setAllPermissions(res.permissions);
      } catch (err) {
        console.error(err);
        setError("Failed to load permissions.");
      } finally {
        setLoading(false);
      }
    }
    loadPerms();
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const togglePermission = (perm: string) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await fetchFromAPI("/dashboardadmin/roles/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      router.push("/dashboard/manage-access/roles");
    } catch (err) {
      console.error(err);
      setError("Failed to update role.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-[80%] flex flex-col gap-y-4 p-4">
      <h1 className="text-3xl font-bold flex flex-col justify-center">Update Role</h1>
      <nav className="text-sm  underline-offset-1 underline flex items-center  gap-2">
        <Link
          href="/dashboard/manage-access/roles"
          className="text-gray-500 hover:underline"
        >
          All Roles
        </Link>
                <span className="text-gray-400"> <MdArrowForwardIos/> </span>
        <span className="text-gray-700 font-medium">Update Role</span>
      </nav>

     

      {error && <div className="text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col mx-auto  w-4/5 gap-[100px]">
        {/* Left column: name & description */}
        <div className="flex flex-col  gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Role Name*</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
          <label className="block text-sm font-medium mb-2">Permissions</label>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {loading ? (
              <div>Loading permissions...</div>
            ) : (
              allPermissions.map(perm => (
                <label key={perm} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(perm)}
                    onChange={() => togglePermission(perm)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{perm}</span>
                </label>
              ))
            )}
          </div>
        </div>
        </div>

        {/* Right column: permissions */}
        

        {/* Action buttons span both columns */}
        <div className="col-span-2 flex justify-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-tertiary text-white rounded hover:opacity-90 transition w-1/6"
          >
            {submitting ? "Adding..." : "Add"}
          </button>
          <Link href="/dashboard/manage-access/roles" className="w-1/6">
            <button
              type="button"
              className="px-6 py-2 bg-quaternary text-white rounded hover:opacity-90 transition w-full"
            >
              Cancel
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}