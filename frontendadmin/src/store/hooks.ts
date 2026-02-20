/* ------------------------------------------------------------------
   src/store/hooks.ts
   Hooks typés pour Redux Toolkit (useAppDispatch / useAppSelector)
------------------------------------------------------------------ */

import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./index";

/**
 * Dispatch typé – à utiliser partout dans l’app
 *   const dispatch = useAppDispatch();
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Selector typé – à utiliser partout dans l’app
 *   const myValue = useAppSelector(state => state.someSlice.value);
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
