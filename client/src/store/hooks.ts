import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from ".";

// Création d'un hook personnalisé pour dispatch (typé avec AppDispatch)
export const useAppDispatch: () => AppDispatch = useDispatch;

// Création d'un hook personnalisé pour selector (typé avec RootState)
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
