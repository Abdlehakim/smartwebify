// ───────────────────────────────────────────────────────────────
// app/dashboard/manage-access/roles/page.tsx
// ───────────────────────────────────────────────────────────────
"use client";

import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { FaRegEdit, FaTrashAlt } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import PaginationAdmin from "@/components/PaginationAdmin";
import Link from "next/link";
import Popup from "@/components/Popup/DeletePopup";
import UpdatePopup from "@/components/Popup/UpdatePopup";

/* ───────── types ───────── */
interface Role {
  _id: string;
  name: string;
  permissions: string[];
}

const pageSize = 12;

/* ===================== NiceSelect (sélecteur simple) ===================== */
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

/* ===================== MultiPermSelect (liste à cases à cocher) ===================== */
interface MultiPermSelectProps {
  selected: string[];
  options: string[];
  onToggle: (perm: string) => void; // confirmation via popup à l'extérieur
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}
function MultiPermSelect({
  selected,
  options,
  onToggle,
  className = "",
  disabled = false,
  loading = false,
}: MultiPermSelectProps) {
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
      if ((t as HTMLElement).closest("[data-multi-perm-root]")) return;
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

  // Libellé du bouton
  let label = "Aucune autorisation";
  if (selected.length === options.length && options.length > 0) label = "Toutes les autorisations";
  else if (selected.length > 0) label = `${selected.length} sélectionnée(s)`;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          if (disabled || loading) return;
          setOpen((s) => !s);
        }}
        className={`min-w-[200px] inline-flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-medium
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
            data-multi-perm-root
            className="fixed z-[1000]"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            <div
              className="rounded-md border bg-white shadow-lg max-h-72 overflow-auto border-emerald-200 p-1"
              role="listbox"
              aria-multiselectable
            >
              {options.map((perm) => {
                const isActive = selected.includes(perm);
                return (
                  <button
                    key={perm}
                    type="button"
                    className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2
                                ${isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-700"}
                                hover:bg-emerald-100 hover:text-emerald-800`}
                    onClick={() => onToggle(perm)}
                    role="option"
                    aria-selected={isActive}
                  >
                    <span
                      className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border
                                  ${isActive ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent"}`}
                    >
                      <FiCheck size={12} />
                    </span>
                    <span className="truncate">{perm}</span>
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
export default function RolesClientPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  /* recherche + filtre */
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");

  /* état popup suppression */
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState("");
  const [deleteUserName, setDeleteUserName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* état popup confirmation permission */
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updateRoleId, setUpdateRoleId] = useState("");
  const [updatePerm, setUpdatePerm] = useState("");

  /* ───────── chargement données ───────── */
  useEffect(() => {
    async function loadData() {
      try {
        const [rolesRes, permsRes] = await Promise.all([
          fetchFromAPI<{ roles: Role[] }>("/dashboardadmin/roles"),
          fetchFromAPI<{ permissions: string[] }>(
            "/dashboardadmin/getAllPermission"
          ),
        ]);
        setRoles(rolesRes.roles);
        setPermissions(permsRes.permissions);
      } catch (err) {
        console.error("Erreur lors du chargement :", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  /* ───────── listes mémoïsées ───────── */
  const rolesFiltres = useMemo(
    () =>
      roles
        .filter((r) => (!filterRole || r.name === filterRole))
        .filter((r) =>
          r.name.toLowerCase().includes(searchTerm.toLowerCase())
        ),
    [roles, filterRole, searchTerm]
  );

  const totalPages = Math.max(1, Math.ceil(rolesFiltres.length / pageSize));

  const rolesAffiches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rolesFiltres.slice(start, start + pageSize);
  }, [rolesFiltres, currentPage]);

  /* ───────── suppression ───────── */
  const openDelete = (id: string, name: string) => {
    setDeleteUserId(id);
    setDeleteUserName(name);
    setIsDeleteOpen(true);
  };
  const closeDelete = () => setIsDeleteOpen(false);

  const confirmDelete = async (id: string) => {
    setDeleteLoading(true);
    await handleDelete(id);
    setDeleteLoading(false);
    closeDelete();
  };

  const handleDelete = async (roleId: string) => {
    try {
      await fetchFromAPI(`/dashboardadmin/roles/delete/${roleId}`, {
        method: "DELETE",
      });
      setRoles((prev) => prev.filter((r) => r._id !== roleId));
    } catch (err) {
      console.error("Erreur de suppression :", err);
      alert("Échec de la suppression.");
    }
  };

  /* ───────── bascule permission ───────── */
  const handleToggle = async (roleId: string, perm: string) => {
    const role = roles.find((r) => r._id === roleId)!;
    const newPermissions = role.permissions.includes(perm)
      ? role.permissions.filter((p) => p !== perm)
      : [...role.permissions, perm];

    // UI optimiste
    setRoles((prev) =>
      prev.map((r) => (r._id === roleId ? { ...r, permissions: newPermissions } : r))
    );

    try {
      await fetchFromAPI(`/dashboardadmin/roles/updatePermission/${roleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: newPermissions }),
      });
    } catch (err) {
      console.error("Erreur de mise à jour des permissions :", err);
      alert("Échec de l’enregistrement. Rétablissement de l’état précédent.");
      // revert
      setRoles((prev) =>
        prev.map((r) =>
          r._id === roleId ? { ...r, permissions: role.permissions } : r
        )
      );
    }
  };

  /* popup de confirmation permission */
  const openUpdate = (roleId: string, perm: string) => {
    setUpdateRoleId(roleId);
    setUpdatePerm(perm);
    setIsUpdateOpen(true);
  };
  const closeUpdate = () => setIsUpdateOpen(false);
  const confirmUpdate = () => {
    handleToggle(updateRoleId, updatePerm);
    closeUpdate();
  };

  /* textes courant/nouveau pour la popup */
  const possedeActuellement = roles
    .find((r) => r._id === updateRoleId)
    ?.permissions.includes(updatePerm);
  const currentValue = possedeActuellement ? "Activée" : "Désactivée";
  const newValue = possedeActuellement ? "Désactivée" : "Activée";

  /* ───────── rendu ───────── */
  return (
    <div className="mx-auto px-2 py-4 w-[95%] flex flex-col gap-4 h-full bg-green-50 rounded-xl">
      {/* En-tête */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Rôles & Autorisations</h1>
        <Link href="/dashboard/manage-access/roles/create">
          <button className="btn-fit-white-outline">Créer un rôle</button>
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap justify-between items-end gap-6">
        <div className="flex items-center gap-2">
          <label htmlFor="searchRole" className="font-medium">
            Recherche :
          </label>
          <input
            id="searchRole"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Nom du rôle"
            className="FilterInput"
          />
        </div>

        {/* Filtre par rôle avec NiceSelect */}
        <div className="flex items-center gap-2">
          <span className="font-medium">Filtrer par rôle :</span>
          <NiceSelect<string>
            value={filterRole}
            options={["", ...roles.map((r) => r.name)] as const}
            onChange={(v) => {
              setFilterRole(v);
              setCurrentPage(1);
            }}
            display={(v) => (v === "" ? "Tous les rôles" : v)}
            loading={loading}
          />
        </div>
      </div>

      {/* En-tête du tableau */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white relative z-10">
            <tr>
              <th className="px-4 py-2 text-sm font-medium text-center border-r-4">
                Nom du rôle
              </th>
              {/* Une seule colonne "Autorisation" avec un menu déroulant dans chaque ligne */}
              <th className="px-4 py-2 text-sm font-medium text-center border-r-4">
                Autorisation
              </th>
              <th className="px-4 py-2 text-sm font-medium text-center">
                Action
              </th>
            </tr>
          </thead>
        </table>

        {/* Corps du tableau */}
        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {rolesAffiches.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-600">
                    Aucun rôle trouvé.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {rolesAffiches.map((role, i) => (
                  <tr key={role._id} className={i % 2 ? "bg-green-50" : "bg-white"}>
                    <td className="px-4 py-2 text-center font-semibold">
                      {role.name}
                    </td>

                    {/* Menu déroulant listant TOUTES les autorisations */}
                    <td className="px-4 py-2 text-center">
                      <MultiPermSelect
                        selected={role.permissions}
                        options={permissions}
                        onToggle={(perm) => openUpdate(role._id, perm)}
                      />
                    </td>

                    <td className="px-4 py-2">
                      <div className="flex justify-center items-center gap-2">
                        <Link href={`/dashboard/manage-access/roles/update/${role._id}`}>
                          <button className="ButtonSquare" aria-label="Modifier le rôle">
                            <FaRegEdit size={14} />
                          </button>
                        </Link>
                        <button
                          onClick={() => openDelete(role._id, role.name)}
                          className="ButtonSquareDelete"
                          aria-label="Supprimer le rôle"
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

          {/* Voile de chargement */}
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

      {/* Popup suppression */}
      {isDeleteOpen && (
        <Popup
          id={deleteUserId}
          name={deleteUserName}
          isLoading={deleteLoading}
          handleClosePopup={closeDelete}
          Delete={confirmDelete}
        />
      )}

      {/* Popup confirmation autorisation */}
      {isUpdateOpen && (
        <UpdatePopup
          id={updateRoleId}
          userName={updatePerm}
          fieldName="Autorisation"
          currentValue={currentValue}
          newValue={newValue}
          handleClosePopup={closeUpdate}
          onConfirm={confirmUpdate}
        />
      )}
    </div>
  );
}
