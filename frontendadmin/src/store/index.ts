import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

import orderCreationReducer from "@/features/orderCreation/orderCreationSlice";

/* ---------- root reducer ---------- */
const rootReducer = combineReducers({
  orderCreation: orderCreationReducer,
});

/* ---------- persist config ---------- */
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["orderCreation"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

/* ---------- store ---------- */
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

/* ---------- types ---------- */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
