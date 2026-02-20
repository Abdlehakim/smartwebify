// ───────────────────────────────────────────────────────────────
// dashboard/manage-access/users/page.tsx
// ───────────────────────────────────────────────────────────────
"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
} from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { FaRegEdit, FaTrashAlt } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import PaginationAdmin from "@/components/PaginationAdmin";
import Popup from "@/components/Popup/DeletePopup";
import UpdatePopup from "@/components/Popup/UpdatePopup";

/* ───────── types ───────── */
interface Role {
  _id: string;
  name: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
  role: Role;
}

const PAGE_SIZE = 12;

/* ===================== NiceSelect (portal dropdown) ===================== */
type StringUnion = string;
interface NiceSelectProps<T extends StringUnion> {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  display?: (v: T) => string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}
function NiceSelect<T extends StringUnion>({
  value,
  options,
  onChange,
  display,
  className = "",
  disabled = false,
  loading = false,
}: NiceSelectProps<T>) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const updatePos = () => {
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    setPos({ top: b.bottom + 4, left: b.left, width: b.width });
  };

  useLayoutEffect(() => {
    if (open) updatePos();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (evt: MouseEvent) => {
      const t = evt.target as Node;
      if (btnRef.current?.contains(t)) return;
      if ((t as HTMLElement).closest("[data-nice-select-root]")) return;
      setOpen(false);
    };
    const onMove = () => updatePos();
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  useEffect(() => {
    if (disabled || loading) setOpen(false);
  }, [disabled, loading]);

  const label = display ? display(value) : String(value);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          if (disabled || loading) return;
          setOpen((s) => !s);
        }}
        className={`min-w-[160px] inline-flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-medium
                    ${disabled || loading ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
                    ${disabled || loading ? "bg-emerald-50 text-emerald-800" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"}
                    border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${className}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled || loading}
        disabled={disabled || loading}
      >
        <span className="truncate">{label}</span>
        {loading ? <FaSpinner className="animate-spin shrink-0" /> : <FiChevronDown className="shrink-0" />}
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            data-nice-select-root
            className="fixed z-[1000]"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            <div
              className="rounded-md border bg-white shadow-lg max-h-60 overflow-auto border-emerald-200"
              role="listbox"
            >
              {options.map((opt) => {
                const isActive = opt === value;
                const text = display ? display(opt) : String(opt);
                return (
                  <button
                    key={String(opt)}
                    type="button"
                    className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2
                      ${isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-700"}
                      hover:bg-emerald-100 hover:text-emerald-800`}
                    onClick={() => {
                      setOpen(false);
                      onChange(opt);
                    }}
                    role="option"
                    aria-selected={isActive}
                  >
                    <span
                      className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border
                        ${isActive ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent"}`}
                    >
                      <FiCheck size={12} />
                    </span>
                    <span className="truncate">{text}</span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

/* ===================== Page ===================== */
export default function UsersClientPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [filterRole, setFilterRole] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  /* delete-popup state */
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState("");
  const [deleteUserName, setDeleteUserName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* update-popup state */
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updateUserId, setUpdateUserId] = useState("");
  const [updateRoleId, setUpdateRoleId] = useState("");
  const [updateUserName, setUpdateUserName] = useState("");

  /* filters + paging */
  const filteredUsers = useMemo(
    () =>
      users
        .filter((u) => !filterRole || u.role._id === filterRole)
        .filter((u) =>
          u.username.toLowerCase().includes(searchTerm.toLowerCase())
        ),
    [users, filterRole, searchTerm]
  );

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));

  const displayedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  /* fetch data */
  useEffect(() => {
    async function fetchData() {
      try {
        const [{ users }, { roles }] = await Promise.all([
          fetchFromAPI<{ users: User[] }>("/dashboardadmin/getAllUsersWithRole"),
          fetchFromAPI<{ roles: Role[] }>("/dashboardadmin/roles"),
        ]);
        setUsers(users ?? []);
        setRoles(roles ?? []);
      } catch (err) {
        console.error(err);
        setUsers([]);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  /* server actions */
  const deleteUser = async (id: string) => {
    await fetchFromAPI(`/dashboardadmin/users/${id}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u._id !== id));
  };

  const updateUserRole = async (userId: string, roleId: string) => {
    await fetchFromAPI(`/dashboardadmin/roles/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleId }),
    });
    setUsers((prev) =>
      prev.map((u) =>
        u._id === userId ? { ...u, role: roles.find((r) => r._id === roleId)! } : u
      )
    );
  };

  /* popup helpers */
  const openDelete = (id: string, name: string) => {
    setDeleteUserId(id);
    setDeleteUserName(name);
    setIsDeleteOpen(true);
  };
  const closeDelete = () => setIsDeleteOpen(false);

  const confirmDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      await deleteUser(id);
    } catch {
      alert("Échec de la suppression.");
    }
    setDeleteLoading(false);
    closeDelete();
  };

  const openUpdate = (id: string, roleId: string, userName: string) => {
    setUpdateUserId(id);
    setUpdateRoleId(roleId);
    setUpdateUserName(userName);
    setIsUpdateOpen(true);
  };
  const closeUpdate = () => setIsUpdateOpen(false);

  const confirmUpdate = async () => {
    try {
      await updateUserRole(updateUserId, updateRoleId);
    } catch {
      alert("Échec de la mise à jour du rôle.");
    }
    closeUpdate();
  };

  /* values for UpdatePopup */
  const currentRoleName =
    users.find((u) => u._id === updateUserId)?.role.name || "";
  const newRoleName = roles.find((r) => r._id === updateRoleId)?.name || "";

  /* ───────── render ───────── */
  return (
    <div className="mx-auto px-2 py-4 w-[95%] flex flex-col gap-4 h-full bg-green-50 rounded-xl">
      {/* Header */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Utilisateurs</h1>
        <Link href="/dashboard/manage-access/users/create">
          <button className="btn-fit-white-outline">Créer un utilisateur</button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-between items-end gap-6">
        <div className="flex items-center gap-2">
          <label htmlFor="searchUser" className="font-medium">
            Recherche :
          </label>
          <input
            id="searchUser"
            className="FilterInput"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Nom d'utilisateur"
          />
        </div>

        {/* Role filter as NiceSelect */}
        <div className="flex items-center gap-2">
          <span className="font-medium">Rôle :</span>
          <NiceSelect<string>
            value={filterRole}
            options={["", ...roles.map((r) => r._id)] as const}
            onChange={(v) => {
              setFilterRole(v);
              setCurrentPage(1);
            }}
            display={(v) =>
              v === "" ? "Tous les rôles" : roles.find((r) => r._id === v)?.name || ""
            }
            loading={loading}
          />
        </div>
      </div>

      {/* Table header */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white relative z-10">
            <tr className="text-sm">
              <th className="px-4 py-2 text-center border-r-4">
                Nom d&apos;utilisateur
              </th>
              <th className="px-4 py-2 text-center border-r-4">Rôle</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
        </table>

        {/* Table body */}
        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {displayedUsers.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-600">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayedUsers.map((u, i) => (
                  <tr key={u._id} className={i % 2 ? "bg-green-50" : "bg-white"}>
                    <td className="px-4 text-center font-semibold text-gray-800">
                      {u.username}
                    </td>
                    <td className="px-4 text-center">
                      {/* ⬇️ Per-row role select replaced by NiceSelect */}
                      <NiceSelect<string>
                        value={u.role?._id ?? ""}
                        options={["", ...roles.map((r) => r._id)] as const}
                        onChange={(v) => openUpdate(u._id, v, u.username)}
                        display={(v) =>
                          v === "" ? "Aucun rôle" : roles.find((r) => r._id === v)?.name || ""
                        }
                        loading={loading}
                      />
                    </td>
                    <td className="px-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <Link href={`/dashboard/manage-access/users/update/${u._id}`}>
                          <button className="ButtonSquare">
                            <FaRegEdit size={14} />
                          </button>
                        </Link>
                        <button
                          onClick={() => openDelete(u._id, u.username)}
                          className="ButtonSquareDelete"
                          aria-label="Supprimer l'utilisateur"
                        >
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-green-50">
              <FaSpinner className="animate-spin text-3xl" />
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4">
        <PaginationAdmin
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Delete Popup */}
      {isDeleteOpen && (
        <Popup
          id={deleteUserId}
          name={deleteUserName}
          isLoading={deleteLoading}
          handleClosePopup={closeDelete}
          Delete={confirmDelete}
        />
      )}

      {/* Role-update Popup */}
      {isUpdateOpen && (
        <UpdatePopup
          id={updateUserId}
          userName={updateUserName}
          fieldName="Rôle"
          currentValue={currentRoleName}
          newValue={newRoleName}
          handleClosePopup={closeUpdate}
          onConfirm={confirmUpdate}
        />
      )}
    </div>
  );
}
