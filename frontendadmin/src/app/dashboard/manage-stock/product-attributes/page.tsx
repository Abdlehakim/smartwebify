// ───────────────────────────────────────────────────────────────
// src/app/manage-stock/product-attribute/page.tsx
// ───────────────────────────────────────────────────────────────
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FaRegEdit, FaTrashAlt } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import PaginationAdmin from "@/components/PaginationAdmin";
import Popup from "@/components/Popup/DeletePopup";

/* ───────── types ───────── */
interface ProductAttribute {
  _id: string;
  name: string;
  type: string | string[];
  createdBy?: { username: string };
  updatedBy?: { username: string };
  createdAt: string;
  updatedAt: string;
}

const PAGE_SIZE = 12;

export default function ProductAttributesClientPage() {
  /* data */
  const [productAttributes, setProductAttributes] = useState<ProductAttribute[]>([]);
  const [loading, setLoading] = useState(true);

  /* ui */
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  /* delete-popup */
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [deleteName, setDeleteName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* fetch once */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { productAttributes } =
          await fetchFromAPI<{ productAttributes: ProductAttribute[] }>(
            "/dashboardadmin/stock/productattribute"
          );
        setProductAttributes(productAttributes ?? []);
      } catch (err) {
        console.error("Failed to load product attributes:", err);
        setProductAttributes([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* filter + paging */
  const filtered = useMemo(
    () =>
      productAttributes.filter((pa) =>
        pa.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [productAttributes, searchTerm]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const displayed = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  /* server delete */
  const deleteAttribute = async (id: string) => {
    await fetchFromAPI(`/dashboardadmin/stock/productattribute/delete/${id}`, {
      method: "DELETE",
    });
    setProductAttributes((prev) => prev.filter((pa) => pa._id !== id));
  };

  /* popup helpers */
  const openDelete = (id: string, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setIsDeleteOpen(true);
  };
  const closeDelete = () => setIsDeleteOpen(false);

  const confirmDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      await deleteAttribute(id);
    } catch {
      alert("Échec de la suppression.");
    }
    setDeleteLoading(false);
    closeDelete();
  };

  /* ───────── render ───────── */
  return (
    <div className="mx-auto px-2 py-4 w-[95%] flex flex-col gap-4 h-full bg-green-50 rounded-xl">
      {/* Header */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Attributs Produits</h1>
        <Link href="/dashboard/manage-stock/product-attributes/create">
          <button className="btn-fit-white-outline">Créer un attribut</button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex flex-wrap justify-between items-end gap-6">
        <div className="flex items-center gap-2">
          <label className="font-medium">Recherche :</label>
          <input
            className="FilterInput"
            placeholder="Nom de l'attribut"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sticky header (same pattern as Orders) */}
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white relative z-10">
            <tr className="text-sm">
              <th className="px-4 py-2 text-center border-r-4">Nom</th>
              <th className="px-4 py-2 text-center border-r-4">Type</th>
              <th className="px-4 py-2 text-center border-r-4">Créé le</th>
              <th className="px-4 py-2 text-center border-r-4">Créé par</th>
              <th className="px-4 py-2 text-center border-r-4">MàJ le</th>
              <th className="px-4 py-2 text-center border-r-4">MàJ par</th>
              <th className="px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
        </table>

        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {displayed.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-600">
                    Aucun attribut trouvé.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayed.map((pa, i) => (
                  <tr
                    key={pa._id}
                    className={i % 2 ? "bg-green-50" : "bg-white"}
                  >
                    <td className="px-4 text-center font-semibold">{pa.name}</td>
                    <td className="px-4 text-center">
                      {Array.isArray(pa.type) ? pa.type.join(", ") : pa.type}
                    </td>
                    <td className="px-4 text-center">
                      {new Date(pa.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 text-center">
                      {pa.createdBy?.username ?? "—"}
                    </td>
                    <td className="px-4 text-center">
                      {new Date(pa.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 text-center">
                      {pa.updatedBy?.username ?? "—"}
                    </td>
                    <td className="px-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <Link href={`/dashboard/manage-stock/product-attributes/update/${pa._id}`}>
                          <button className="ButtonSquare" aria-label="Modifier">
                            <FaRegEdit size={14} />
                          </button>
                        </Link>
                        <button
                          onClick={() => openDelete(pa._id, pa.name)}
                          className="ButtonSquareDelete"
                          aria-label="Supprimer"
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
      {!loading && (
        <div className="flex justify-center mt-4">
          <PaginationAdmin
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Delete Popup */}
      {isDeleteOpen && (
        <Popup
          id={deleteId}
          name={deleteName}
          isLoading={deleteLoading}
          handleClosePopup={closeDelete}
          Delete={confirmDelete}
        />
      )}
    </div>
  );
}
