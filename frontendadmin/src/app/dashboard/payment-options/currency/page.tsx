// ------------------------------------------------------------------
// src/app/dashboard/payment-options/currency/page.tsx
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
interface CurrencySettings {
  primary: string;
  secondaries: string[];
  updatedAt: string;
}

const CURRENCIES = ["TND", "EUR", "USD", "GBP", "CAD"] as const;

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
export default function CurrencySettingsPage() {
  const [settings, setSettings] = useState<CurrencySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ---------- initial fetch ---------- */
  useEffect(() => {
    (async () => {
      try {
        const { currencySettings } = await fetchFromAPI<{ currencySettings: CurrencySettings }>(
          "/dashboardadmin/payment/payment-currency"
        );
        setSettings(currencySettings);
      } catch (err) {
        console.error("Échec du chargement des paramètres de devise :", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---------- helpers ---------- */
  const setPrimary = (code: string) => {
    if (!settings) return;
    // Retirer la devise principale des secondaires si nécessaire
    const nextSecondaries = settings.secondaries.filter((c) => c !== code);
    setSettings({ ...settings, primary: code, secondaries: nextSecondaries });
  };

  const toggleSecondary = (code: string) => {
    if (!settings) return;
    const next = settings.secondaries.includes(code)
      ? settings.secondaries.filter((c) => c !== code)
      : [...settings.secondaries, code];
    setSettings({ ...settings, secondaries: next });
  };

  const saveChanges = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await fetchFromAPI("/dashboardadmin/payment/payment-currency/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primary: settings.primary,
          secondaries: settings.secondaries,
        }),
      });
    } catch {
      alert("Échec de l’enregistrement des paramètres de devise.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- UI ---------- */
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-green-50 rounded-xl">
        <FaSpinner className="animate-spin text-4xl text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex h-full items-center justify-center text-gray-600 bg-green-50 rounded-xl">
        Impossible de charger les paramètres de devise.
      </div>
    );
  }

  return (
    <div className="mx-auto px-2 py-4 w-[95%] flex flex-col gap-6 h-full bg-green-50 rounded-xl">
      {/* Titre */}
      <h1 className="text-3xl font-bold uppercase">Paramètres des devises</h1>

      {/* Devise principale */}
      <div className="flex flex-col gap-2">
        <label className="font-medium">Devise principale *</label>
        <NiceSelect<string>
          value={settings.primary}
          options={CURRENCIES}
          onChange={setPrimary}
          className="w-72"
        />
      </div>

      {/* Devises optionnelles */}
      <div className="flex flex-col gap-2">
        <label className="font-medium">Devises optionnelles</label>
        <div className="flex flex-wrap gap-2">
          {CURRENCIES.filter((c) => c !== settings.primary).map((c) => {
            const active = settings.secondaries.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleSecondary(c)}
                className={`inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm
                  ${active ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white text-slate-700"}
                  hover:bg-emerald-100 hover:text-emerald-900`}
                aria-pressed={active}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-gray-600">
        Dernière mise à jour : {new Date(settings.updatedAt).toLocaleString()}
      </p>

      {/* Bouton enregistrer */}
      <div>
        <button
          onClick={saveChanges}
          disabled={saving}
          className="btn-fit-white-outline"
        >
          {saving && <FaSpinner className="animate-spin" />}
          Mettre à jour
        </button>
      </div>
    </div>
  );
}
