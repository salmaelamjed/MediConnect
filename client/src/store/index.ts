import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import auth from "./auth/authSlice";
import forgotPassword from "./auth/forgotPasswordSlice "; 
import specialities from './specialities/specialitiesSlice'
import cabinets from './cabinets/cabinetsSlice'
import reservations from './reservations/reservationsSlice'
import notifications from './notifications/notificationsSlice';
import search from "./search/searchSlice"
import patients from './patients/patientsSlice'
import plannings from './planning/PlanningSlice'
const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: ["user", "accessToken"],
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, auth),
  forgotPassword,
  specialities,
  cabinets,
  reservations,
  notifications,
  search,
  patients,
  plannings,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

const persistor = persistStore(store);

export { store, persistor };
