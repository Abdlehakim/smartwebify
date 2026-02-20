// ------------------------------------------------------------------
// src/app/dashboard/payment-settings/page.tsx
// ------------------------------------------------------------------
"use client";

import React, {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import { FaSpinner } from "react-icons/fa6";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

/* ---------- types ---------- */
interface MethodCfg {
  _id: string;
  name: string;
  enabled: boolean;
  label: string;
  help: string;
}

interface PaymentMethodsResponse {
  paymentMethods: MethodCfg[]; // ✅ backend key
}

/* ===================== NiceSelect (style unifié) ===================== */
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
        {loading ? (
          <FaSpinner className="animate-spin shrink-0" />
        ) : (
          <FiChevronDown className="shrink-0" />
        )}
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
const BOOL_OPTS = ["true", "false"] as const;

export default function PaymentSettingsPage() {
  const [methods, setMethods] = useState<Record<string, MethodCfg> | null>(null);
  const [methodIds, setMethodIds] = useState<string[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ label: string; help: string }>({
    label: "",
    help: "",
  });

  // par-ligne : désactivation pendant sauvegarde
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchFromAPI<PaymentMethodsResponse>(
          "/dashboardadmin/payment/payment-settings"
        );

        if (!res || !Array.isArray(res.paymentMethods)) {
          throw new Error("Format de réponse invalide");
        }

        const mapped = Object.fromEntries(res.paymentMethods.map((m) => [m._id, m]));
        const ids = res.paymentMethods.map((m) => m._id);

        setMethods(mapped);
        setMethodIds(ids);
        setUpdatedAt(new Date().toISOString());
      } catch (err) {
        console.error("Échec du chargement des méthodes de paiement :", err);
        setMethods(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const patchMethod = async (id: string, patch: Partial<MethodCfg>) => {
    if (!methods) return;
    const prevMethods = methods;
    const prevUpdatedAt = updatedAt;

    setSaving((m) => ({ ...m, [id]: true }));
    const next = { ...methods, [id]: { ...methods[id], ...patch } };
    setMethods(next);

    try {
      await fetchFromAPI(`/dashboardadmin/payment/payment-settings/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [methods[id].name]: patch }),
      });
      setUpdatedAt(new Date().toISOString());
    } catch (err) {
      console.error(err);
      setMethods(prevMethods);
      setUpdatedAt(prevUpdatedAt);
      alert("Échec de la mise à jour des paramètres de paiement.");
    } finally {
      setSaving((m) => {
        const c = { ...m };
        delete c[id];
        return c;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-green-50 rounded-xl">
        <FaSpinner className="animate-spin text-4xl text-primary" />
      </div>
    );
  }

  if (!methods) {
    return (
      <div className="flex h-full items-center justify-center text-gray-600 bg-green-50 rounded-xl">
        Impossible de charger les méthodes de paiement.
      </div>
    );
  }

  const getMethodName = (key: string) => {
    const name = methods[key].name;
    if (name === "cashOnDelivery") return "Paiement à la livraison";
    if (name === "payInMagasin") return "Paiement en magasin";
    // Capitaliser
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  return (
    <div className="mx-auto px-2 py-4 w-[95%] flex flex-col gap-4 h-full bg-green-50 rounded-xl">
      {/* Titre */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Méthodes de paiement</h1>
      </div>

      {/* Tableau avec en-tête figé (même pattern que les autres pages) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white relative z-10">
            <tr className="text-sm">
              <th className="px-4 py-2 text-left border-r-4">Méthode</th>
              <th className="px-4 py-2 text-center border-r-4">Statut</th>
              <th className="px-4 py-2 text-center border-r-4">Libellé</th>
              <th className="px-4 py-2 text-center border-r-4">Aide</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
        </table>

        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
              {methodIds.map((id, i) => {
                const cfg = methods[id];
                const isEditing = editId === id;
                const disabled = !!saving[id];

                return (
                  <tr key={id} className={i % 2 ? "bg-green-50" : "bg-white"}>
                    {/* Méthode */}
                    <td className="px-4 py-3 font-semibold">{getMethodName(id)}</td>

                    {/* Statut (NiceSelect booléen) */}
                    <td className="px-4 text-center">
                      <NiceSelect<(typeof BOOL_OPTS)[number]>
                        value={cfg.enabled ? "true" : "false"}
                        options={BOOL_OPTS}
                        onChange={(v) => patchMethod(id, { enabled: v === "true" })}
                        display={(v) => (v === "true" ? "Activée" : "Désactivée")}
                        disabled={disabled || isEditing}
                        loading={disabled}
                        className="mx-auto"
                      />
                    </td>

                    {/* Libellé */}
                    <td className="px-4 text-center">
                      {isEditing ? (
                        <input
                          className="FilterInput w-11/12"
                          value={draft.label}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, label: e.target.value }))
                          }
                          placeholder="Libellé affiché au client"
                        />
                      ) : (
                        <span>{cfg.label || <em className="text-gray-400">(vide)</em>}</span>
                      )}
                    </td>

                    {/* Aide */}
                    <td className="px-4 text-center">
                      {isEditing ? (
                        <input
                          className="FilterInput w-11/12"
                          value={draft.help}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, help: e.target.value }))
                          }
                          placeholder="Texte d’aide (optionnel)"
                        />
                      ) : (
                        <span>{cfg.help || <em className="text-gray-400">(vide)</em>}</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => {
                                patchMethod(id, draft);
                                setEditId(null);
                              }}
                              className="inline-flex items-center gap-1 rounded-md border border-emerald-500 px-3 py-1 text-sm text-emerald-900 hover:bg-emerald-50 disabled:opacity-60"
                              disabled={disabled}
                            >
                              Enregistrer
                            </button>
                            <button
                              onClick={() => setEditId(null)}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-800 hover:bg-slate-50"
                            >
                              Annuler
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setEditId(id);
                              setDraft({ label: cfg.label, help: cfg.help });
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                            disabled={disabled}
                          >
                            Modifier
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {methodIds.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-600">
                    Aucune méthode disponible.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* voile de chargement si besoin (ex. lors d’un refetch global) */}
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-green-50">
              <FaSpinner className="animate-spin text-3xl" />
            </div>
          )}
        </div>
      </div>

      <p className="mt-1 text-sm text-gray-500">
        Dernière mise à jour : {new Date(updatedAt).toLocaleString()}
      </p>
    </div>
  );
}
