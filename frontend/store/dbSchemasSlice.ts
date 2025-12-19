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
}

// ----------------------------------
// Initial State
// ----------------------------------
const initialState: DbSchemaState = {
  schemas: {},
  loading: false,
  error: null,
};

// ----------------------------------
// Async Thunk
// ----------------------------------
export const fetchDbSchemas = createAsyncThunk<
  DbSchemas,
  void,
  { rejectValue: string }
>("dbSchemas/fetch", async (_, { rejectWithValue }) => {
  try {
    const res = await axios.get("http://localhost:3000/db/schemas");

    if (!res.data?.schemas) {
      return rejectWithValue("Invalid schema response");
    }

    return res.data.schemas;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.error || "Failed to fetch DB schemas"
    );
  }
});

// ----------------------------------
// Slice
// ----------------------------------
export const dbSchemasSlice = createSlice({
  name: "dbSchemas",
  initialState,
  reducers: {
    // Optional: allow local updates (future schema editor)
    setDbSchemas(state, action: PayloadAction<DbSchemas>) {
      state.schemas = action.payload;
    },
    clearDbSchemas(state) {
      state.schemas = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDbSchemas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDbSchemas.fulfilled, (state, action) => {
        state.loading = false;
        state.schemas = action.payload;
      })
      .addCase(fetchDbSchemas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export const { setDbSchemas, clearDbSchemas } = dbSchemasSlice.actions;
export default dbSchemasSlice.reducer;
