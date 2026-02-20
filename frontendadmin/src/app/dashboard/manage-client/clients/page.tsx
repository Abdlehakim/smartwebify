// ───────────────────────────────────────────────────────────────
// src/app/dashboard/manage-access/clients/page.tsx
// ───────────────────────────────────────────────────────────────
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { FaTrashAlt } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import PaginationAdmin from "@/components/PaginationAdmin";
import Popup from "@/components/Popup/DeletePopup";

interface Client {
  _id: string;
  username?: string;
  phone?: string;
  email: string;
  isGoogleAccount?: boolean;
}

const pageSize = 12;

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [deleteName, setDeleteName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = useMemo(
    () =>
      clients.filter((c) =>
        (c.username || c.email).toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [clients, searchTerm]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const displayed = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  useEffect(() => {
    async function load() {
      try {
        const { clients }: { clients: Client[] } =
          await fetchFromAPI("/dashboardadmin/client");
        setClients(clients);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const deleteClient = async (id: string) => {
    await fetchFromAPI(`/dashboardadmin/client/delete/${id}`, {
      method: "DELETE",
    });
    setClients((prev) => prev.filter((c) => c._id !== id));
  };

  const openDelete = (id: string, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setIsDeleteOpen(true);
  };
  const closeDelete = () => setIsDeleteOpen(false);

  const confirmDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      await deleteClient(id);
    } catch {
      alert("Échec de la suppression.");
    }
    setDeleteLoading(false);
    closeDelete();
  };

  return (
    <div className="mx-auto px-2 py-4 w-[95%] flex flex-col gap-4 h-full bg-green-50 rounded-xl">
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Tous les clients sur Site Web</h1>
      </div>

      <div className="flex flex-wrap justify-between items-end gap-6">
        <div className="flex items-center gap-2">
          <label htmlFor="searchClient" className="font-medium">
            Rechercher par nom :
          </label>
          <input
            id="searchClient"
            className="FilterInput"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Entrez le nom du client"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white relative z-10">
            <tr className="text-sm">
              <th className="px-4 py-2 text-center border-r-4">Client</th>
              <th className="px-4 py-2 text-center border-r-4">Téléphone</th>
              <th className="px-4 py-2 text-center border-r-4">Courriel</th>
              <th className="px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
        </table>

        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {displayed.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-600">
                    Aucun client trouvé.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayed.map((c) => (
                  <tr key={c._id} className="even:bg-gray-100 odd:bg-white">
                    <td className="px-4 text-center">{c.username || "-"}</td>
                    <td className="px-4 text-center">{c.phone || "-"}</td>
                    <td className="px-4 text-center">{c.email}</td>
                    <td className="px-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => openDelete(c._id, c.username || c.email)}
                          className="ButtonSquareDelete"
                          aria-label="Supprimer le client"
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

          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-green-50">
              <FaSpinner className="animate-spin text-3xl" />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center mt-4">
        <PaginationAdmin
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

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
