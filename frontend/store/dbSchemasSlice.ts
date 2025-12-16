import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

interface DbSchemaState {
  schemas: Record<string, string[]>;
  loading: boolean;
  error: string | null;
}

const initialState: DbSchemaState = {
  schemas: {
    // Example:
    users: ["id", "name", "email"],
    orders: ["orderId", "userId", "amount"],
  },
  loading: false,
  error: null,
};

export const dbSchemasSlice = createSlice({
  name: "dbSchemas",
  initialState,
  reducers: {},
  extraReducers: (builder) => {},
});

export default dbSchemasSlice.reducer;
