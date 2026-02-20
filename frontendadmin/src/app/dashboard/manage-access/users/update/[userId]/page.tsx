// ───────────────────────────────────────────────────────────────
//  UpdateUserPage  —  lets an admin change a user’s data safely
// ───────────────────────────────────────────────────────────────
"use client";

import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
} from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { MdArrowForwardIos } from "react-icons/md";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai"; // 👁️ toggle

/* ───────── types ───────── */
interface Role {
  _id: string;
  name: string;
}
interface DashboardUser {
  _id: string;
  username: string;
  phone: string;
  email: string;
  role: Role;
}
interface FormData {
  username: string;
  phone: string;
  email: string;
  password: string;   // blank = keep current hash
  role: string;
}

export default function UpdateUserPage() {
  const router = useRouter();
  const { userId } = useParams<{ userId: string }>();

  const [roles, setRoles] = useState<Role[]>([]);
  const [form, setForm] = useState<FormData>({
    username: "",
    phone:    "",
    email:    "",
    password: "",
    role:     "",
  });
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const toggleShowPassword = () => setShowPassword(p => !p);

  /* ───────── fetch user on mount ───────── */
  useEffect(() => {
    (async () => {
      try {
        const { user }: { user: DashboardUser } =
          await fetchFromAPI(`/dashboardadmin/users/${userId}`);

        setRoles([user.role]);      // ↓ pre-fill – leave password blank
        setForm({
          username: user.username ?? "",
          phone:    user.phone    ?? "",
          email:    user.email    ?? "",
          password: "",
          role:     user.role?._id ?? "",
        });
      } catch (err) {
        console.error("Init error:", err);
        alert("Failed to load user.");
        router.push("/dashboard/manage-access/users");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, router]);

  /* ───────── input helpers ───────── */
  const handleInput = (e: ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSelect = (e: ChangeEvent<HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, role: e.target.value }));

  /* ───────── submit ───────── */
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const payload: Partial<FormData> = { ...form };
    if (!payload.password?.trim()) delete payload.password; // keep old hash

    try {
      await fetchFromAPI(`/dashboardadmin/users/update/${userId}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      router.push("/dashboard/manage-access/users");
    } catch (err) {
      console.error("Update failed:", err);
      alert("Could not update user.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ───────── render ───────── */
  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <span className="animate-pulse">Loading user…</span>
      </div>
    );

  return (
    <div className="w-[80%] flex flex-col gap-4 p-4">
      <h1 className="text-3xl font-bold">Update User</h1>

      {/* breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm">
        <Link className="text-gray-500 hover:underline"
              href="/dashboard/manage-access/users">All Users</Link>
        <span className="text-gray-400"><MdArrowForwardIos /></span>
        <span className="font-medium text-gray-700">Update User</span>
      </nav>

      <form onSubmit={handleSubmit} className="flex flex-col gap-12">
        {/* row 1 */}
        <div className="flex flex-wrap gap-12 justify-center">
          <Input
            id="username" label="Username*" value={form.username}
            onChange={handleInput} required
          />
          <Input
            id="email" type="email" label="Email*" value={form.email}
            onChange={handleInput} required
          />
        </div>

        {/* row 2 */}
        <div className="flex flex-wrap gap-12 justify-center">
          {/* password with eye-toggle */}
          <div className="w-60 flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium">New Password</label>
            <div className="relative">
              <input
                id="password" name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={handleInput}
                className="border bg-inputcolor rounded px-3 py-2 w-full pr-10"
                autoComplete="new-password"
              />
              <button
                type="button" aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 inset-y-0 flex items-center text-gray-500"
                onClick={toggleShowPassword}
              >
                {showPassword ? <AiFillEyeInvisible size={20}/> : <AiFillEye size={20}/>}
              </button>
            </div>
            <small className="text-gray-500">
              Leave blank to keep the current password.
            </small>
          </div>

          <Input
            id="phone" label="Phone*" value={form.phone}
            onChange={handleInput} required
          />

          {/* role select */}
          <div className="w-60 flex flex-col gap-1">
            <label htmlFor="role" className="text-sm font-medium">Role*</label>
            <select
              id="role" name="role" required value={form.role}
              onChange={handleSelect}
              className="border bg-inputcolor rounded px-3 py-2 w-full"
            >
              <option value="">Select Role</option>
              {roles.map(r => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-center gap-4">
          <button
            type="submit" disabled={submitting}
            className="w-40 bg-tertiary text-white px-6 py-2 rounded hover:opacity-90"
          >
            {submitting ? "Updating…" : "Update"}
          </button>
          <Link href="/dashboard/manage-access/users" className="w-40">
            <button type="button"
                    className="w-full bg-quaternary text-white px-6 py-2 rounded hover:opacity-90">
              Cancel
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}

/* ---------- tiny reusable text input ---------- */
function Input({
  id, label, value, onChange, type = "text", required = false,
}: {
  id: string; label: string; value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: "text" | "email";
  required?: boolean;
}) {
  return (
    <div className="w-72 flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <input
        id={id} name={id} type={type} required={required}
        value={value} onChange={onChange}
        className="border bg-inputcolor rounded px-3 py-2 w-full"
      />
    </div>
  );
}
