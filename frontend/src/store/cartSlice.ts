/* ------------------------------------------------------------------
   src/store/cartSlice.ts
   Variant-aware cart with localStorage persistence
   - Merges by (_id + selected attributes)
   - Supports human-readable selectedNames for display (e.g., "Couleur" -> "Blanc")
------------------------------------------------------------------ */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  _id: string;
  name: string;
  reference: string;
  price: number;
  tva: number;
  mainImageUrl: string;
  discount?: number;
  slug: string;
  categorie?: { name: string; slug: string };
  subcategorie?: { name: string; slug: string };
  selected?: Record<string, string>;
  selectedNames?: Record<string, string>;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

interface AddItemPayload {
  item: Omit<CartItem, "quantity">;
  quantity: number;
}

/* ---------- small type guards / coercers ---------- */
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const toStr = (v: unknown, fallback = ""): string => {
  if (typeof v === "string") return v;
  if (v === undefined || v === null) return fallback;
  return String(v);
};

const toNum = (v: unknown, fallback = 0): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const toDictStr = (v: unknown): Record<string, string> | undefined => {
  if (!isObj(v)) return undefined;
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v)) out[String(k)] = toStr(val);
  return out;
};

/* ---------- normalizer to avoid NaN / bad types from storage ---------- */
const normalizeItem = (raw: unknown): CartItem => {
  const i = isObj(raw) ? raw : {};

  const cat = isObj(i.categorie)
    ? { name: toStr(i.categorie.name), slug: toStr(i.categorie.slug) }
    : undefined;

  const subcat = isObj(i.subcategorie)
    ? { name: toStr(i.subcategorie.name), slug: toStr(i.subcategorie.slug) }
    : undefined;

  return {
    _id: toStr(i._id),
    name: toStr(i.name),
    reference: toStr(i.reference),
    price: toNum(i.price, 0),
    tva: toNum(i.tva, 0),
    mainImageUrl: toStr(i.mainImageUrl),
    discount:
      i.discount === undefined || i.discount === null ? 0 : toNum(i.discount, 0),
    slug: toStr(i.slug),
    categorie: cat,
    subcategorie: subcat,
    selected: toDictStr(i.selected),
    selectedNames: toDictStr(i.selectedNames),
    quantity: Math.max(1, toNum(i.quantity, 1)),
  };
};

/* ───────── helpers ───────── */
const loadCartState = (): CartState => {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("cart");
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<CartState>;
        const items = Array.isArray(parsed?.items)
          ? parsed!.items.map(normalizeItem)
          : [];
        return { items };
      }
    } catch {
      /* ignore corrupted storage */
    }
  }
  return { items: [] };
};

const saveCartState = (state: CartState) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("cart", JSON.stringify(state));
    } catch {
      /* storage may be full/blocked; fail silently */
    }
  }
};

/** shallow equality for attribute selections */
const sameSelection = (
  a?: Record<string, string>,
  b?: Record<string, string>
) => {
  const A = a ?? {};
  const B = b ?? {};
  const ak = Object.keys(A).sort();
  const bk = Object.keys(B).sort();
  if (ak.length !== bk.length) return false;
  for (let i = 0; i < ak.length; i++) {
    const k = ak[i];
    if (k !== bk[i] || A[k] !== B[k]) return false;
  }
  return true;
};

/* ───────── slice ───────── */
const initialState: CartState = loadCartState();

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    /* addItem (variant-aware with numeric coercion) */
    addItem: (state, action: PayloadAction<AddItemPayload>) => {
      const { item, quantity } = action.payload;

      const clean: Omit<CartItem, "quantity"> = {
        ...item,
        price: toNum(item.price, 0),
        tva: toNum(item.tva, 0),
        discount:
          item.discount === undefined || item.discount === null
            ? 0
            : toNum(item.discount, 0),
      };

      const existing = state.items.find(
        (i) => i._id === clean._id && sameSelection(i.selected, clean.selected)
      );

      if (existing) {
        existing.quantity += Math.max(1, toNum(quantity, 1));
      } else {
        state.items.push({ ...clean, quantity: Math.max(1, toNum(quantity, 1)) });
      }
      saveCartState(state);
    },

    /* removeItem: If `selected` provided → remove only that variant */
    removeItem: (
      state,
      action: PayloadAction<{ _id: string; selected?: Record<string, string> }>
    ) => {
      const { _id, selected } = action.payload;
      state.items = state.items.filter((i) =>
        selected
          ? !(i._id === _id && sameSelection(i.selected, selected))
          : i._id !== _id
      );
      saveCartState(state);
    },

    /* updateItemQuantity (variant-aware) */
    updateItemQuantity: (
      state,
      action: PayloadAction<{
        _id: string;
        quantity: number;
        selected?: Record<string, string>;
      }>
    ) => {
      const { _id, quantity, selected } = action.payload;

      const item = state.items.find((i) =>
        selected
          ? i._id === _id && sameSelection(i.selected, selected)
          : i._id === _id
      );

      if (item) {
        item.quantity = Math.max(0, toNum(quantity, 0));
        if (item.quantity <= 0) {
          state.items = state.items.filter((i) =>
            selected
              ? !(i._id === _id && sameSelection(i.selected, selected))
              : i._id !== _id
          );
        }
        saveCartState(state);
      }
    },

    /* clearCart */
    clearCart: (state) => {
      state.items = [];
      saveCartState(state);
    },
  },
});

export const { addItem, removeItem, updateItemQuantity, clearCart } =
  cartSlice.actions;

export default cartSlice.reducer;
