/// src/app/dashboard/manage-access/users/create/page.tsx

"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { MdArrowForwardIos } from "react-icons/md";

interface Role {
  _id: string;
  name: string;
}

interface FormData {
  username: string;
  phone: string;
  email: string;
  password: string;
  role: string;
}

export default function CreateUserPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [form, setForm] = useState<FormData>({
    username: "",
    phone: "",
    email: "",
    password: "",
    role: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch roles on mount
  useEffect(() => {
    async function loadRoles() {
      try {
        const { roles }: { roles: Role[] } = await fetchFromAPI("/dashboardadmin/roles");
        setRoles(roles);
      } catch (err) {
        console.error("Error loading roles:", err);
      }
    }
    loadRoles();
  }, []);

  // Handle input change
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle select change
  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, role: e.target.value }));
  };

  // Submit form
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetchFromAPI<{ message: string }>("/dashboardadmin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      router.push("/dashboard/manage-access/users");
    } catch (err) {
      console.error("Creation failed:", err);
      alert("Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-[80%] flex flex-col gap-y-4 p-4">
      <h1 className="text-3xl font-bold flex flex-col justify-center">Create User</h1>
      <nav className="text-sm  underline-offset-1 underline flex items-center  gap-2">
        <Link
          href="/dashboard/manage-access/users"
          className="text-gray-500 hover:underline"
        >
          All Users
        </Link>
        <span className="text-gray-400"> <MdArrowForwardIos/> </span>
        <span className="text-gray-700 font-medium">Create User</span>
      </nav>

      

      <form onSubmit={handleSubmit} className=" flex flex-col gap-[50px] ">
        <div className="flex justify-center gap-[50px] ">
        <div className="w-[30%] flex items-center gap-[16px] ">
            <label className="block text-sm font-medium mb-1" htmlFor="username">
              Username*
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={form.username}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 bg-inputcolor rounded px-3 py-2"
            />
          </div>

          <div className="w-[30%] flex items-center gap-[16px] ">
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email*
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 bg-inputcolor"
            />
          </div>
        </div>

        <div className="flex justify-center gap-[50px] ">
        <div className="w-[20%] flex items-center gap-[16px] ">
          <label className="block text-sm font-medium mb-1" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded px-3 py-2 bg-inputcolor"
          />
        </div>

        <div className="w-[20%] flex items-center gap-[16px] ">
          <label className="block text-sm font-medium mb-1" htmlFor="phone">
            Phone*
          </label>
          <input
            id="phone"
            name="phone"
            type="text"
            value={form.phone}
            onChange={handleInputChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 bg-inputcolor"
          />
        </div>

        <div className="w-[20%] flex items-center gap-[16px] ">
          <label className="block text-sm font-medium mb-1" htmlFor="role">
            Role*
          </label>
          <select
            id="role"
            name="role"
            value={form.role}
            onChange={handleSelectChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 bg-inputcolor"
          >
            <option value="">Select Role</option>
            {roles.map(role => (
              <option key={role._id} value={role._id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        </div>

        <div className="col-span-2 flex justify-center gap-4 ">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-tertiary text-white rounded hover:opacity-90 transition w-1/6"
          >
            {submitting ? "Adding..." : "Add"}
          </button>
          <Link href="/dashboard/manage-access/users"
          className="w-1/6">
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
