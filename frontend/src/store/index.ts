import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer, PersistConfig } from "redux-persist";
import storage from "redux-persist/lib/storage"; // Defaults to localStorage for web
import cartReducer from "./cartSlice";
import wishlistReducer from "./wishlistSlice"; // Import your wishlist reducer

// Define the shape of the persist config
type PersistedStateType = ReturnType<typeof rootReducer>;

// Persist configuration
const persistConfig: PersistConfig<PersistedStateType> = {
  key: "root",
  storage,
  version: 1, // Optional: Helps in migrations
};

// Combine reducers
const rootReducer = combineReducers({
  cart: cartReducer,
  wishlist: wishlistReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure the store with persisted reducer
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);

// ✅ Export RootState and AppDispatch types
export type RootState = ReturnType<typeof rootReducer>; // Use `rootReducer` instead of `store.getState` for better inference
export type AppDispatch = typeof store.dispatch;

export default store;
