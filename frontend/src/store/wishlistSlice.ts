import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Define Wishlist Product Type with categorie (simplified version)
interface WishlistProduct {
  name: string;
  mainImageUrl?: string;
  price: number;
  categorie: { name: string; slug: string };
  slug: string;
}

interface WishlistState {
  items: WishlistProduct[];
}

const initialState: WishlistState = {
  items: [],
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    addToWishlist: (state, action: PayloadAction<WishlistProduct>) => {
      const { slug, categorie } = action.payload;

      // Ensure categorie is always defined
      const newItem: WishlistProduct = {
        ...action.payload,
        categorie: {
          name: categorie?.name ?? "Unknown categorie",
          slug: categorie?.slug ?? "uncategorized",
        },
      };

      if (!state.items.some((item) => item.slug === slug)) {
        state.items.push(newItem);
      }
    },

    removeFromWishlist: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.slug !== action.payload);
    },
  },
});

export const { addToWishlist, removeFromWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
