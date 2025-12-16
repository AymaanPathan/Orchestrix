import { configureStore } from "@reduxjs/toolkit";
import dbSchemasReducer from "./dbSchemasSlice";

export const store = configureStore({
  reducer: {
    dbSchemas: dbSchemasReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type RootDispatch = typeof store.dispatch;
