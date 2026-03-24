/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

// ----------------------------------
// Types
// ----------------------------------
export interface DbSchemas {
  [collectionName: string]: string[];
}

interface DbSchemaState {
  schemas: DbSchemas;
  loading: boolean;
  error: string | null;
  // NEW: track whether the user has a DB connected at all
  isUserDbConnected: boolean;
  userDbLabel: string | null;
  userDbUriMasked: string | null;
  ownerId: string;
}

// ----------------------------------
// Initial State
// ----------------------------------
const initialState: DbSchemaState = {
  schemas: {},
  loading: false,
  error: null,
  isUserDbConnected: false,
  userDbLabel: null,
  userDbUriMasked: null,
  // In a real app this comes from your auth system (JWT, session, etc.)
  // For now we derive it from localStorage or a default.
  ownerId:
    typeof window !== "undefined"
      ? (localStorage.getItem("ownerId") ?? "default-owner")
      : "default-owner",
};

// ----------------------------------
// Thunks
// ----------------------------------

/**
 * Check if the user has a DB connected, and if so fetch its schemas.
 * Falls back gracefully if not connected.
 */
export const fetchDbSchemas = createAsyncThunk<
  {
    schemas: DbSchemas;
    connected: boolean;
    label?: string;
    uriMasked?: string;
  },
  void,
  { rejectValue: string; state: { dbSchemas: DbSchemaState } }
>("dbSchemas/fetch", async (_, { getState, rejectWithValue }) => {
  const { ownerId } = getState().dbSchemas;

  try {
    // 1. Check connection status
    const statusRes = await axios.get(
      `http://localhost:3000/user/db/status?ownerId=${ownerId}`,
    );

    if (!statusRes.data?.connected) {
      return { schemas: {}, connected: false };
    }

    // 2. Fetch schemas from user's DB
    const schemaRes = await axios.get(
      `http://localhost:3000/user/db/schemas?ownerId=${ownerId}`,
    );

    if (!schemaRes.data?.schemas) {
      return rejectWithValue("Invalid schema response");
    }

    return {
      schemas: schemaRes.data.schemas,
      connected: true,
      label: statusRes.data.label,
      uriMasked: statusRes.data.uriMasked,
    };
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.error || "Failed to fetch DB schemas",
    );
  }
});

/**
 * Called after DatabaseConnect.onConnected fires — schemas are already
 * available from that call, so we just inject them directly.
 */
export const setUserDbConnected = createAsyncThunk<
  { schemas: DbSchemas; label: string; uriMasked?: string },
  { schemas: DbSchemas; label: string; uriMasked?: string }
>("dbSchemas/setConnected", async (payload) => payload);

// ----------------------------------
// Slice
// ----------------------------------
export const dbSchemasSlice = createSlice({
  name: "dbSchemas",
  initialState,
  reducers: {
    setDbSchemas(state, action: PayloadAction<DbSchemas>) {
      state.schemas = action.payload;
    },
    clearDbSchemas(state) {
      state.schemas = {};
      state.isUserDbConnected = false;
      state.userDbLabel = null;
      state.userDbUriMasked = null;
    },
    setOwnerId(state, action: PayloadAction<string>) {
      state.ownerId = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("ownerId", action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    // fetchDbSchemas
    builder
      .addCase(fetchDbSchemas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDbSchemas.fulfilled, (state, action) => {
        state.loading = false;
        state.schemas = action.payload.schemas;
        state.isUserDbConnected = action.payload.connected;
        if (action.payload.label) state.userDbLabel = action.payload.label;
        if (action.payload.uriMasked)
          state.userDbUriMasked = action.payload.uriMasked;
      })
      .addCase(fetchDbSchemas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });

    // setUserDbConnected (instant, no loading)
    builder.addCase(setUserDbConnected.fulfilled, (state, action) => {
      state.schemas = action.payload.schemas;
      state.isUserDbConnected = true;
      state.userDbLabel = action.payload.label;
      state.userDbUriMasked = action.payload.uriMasked ?? null;
      state.error = null;
    });
  },
});

export const { setDbSchemas, clearDbSchemas, setOwnerId } =
  dbSchemasSlice.actions;
export default dbSchemasSlice.reducer;
