import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../Helper/axiosInstance";
import { toast } from "react-toastify";

export const createCrudSlice = (name, endpoint, idKey = "_id") => {

  // 🔵 GET ALL
  const getAll = createAsyncThunk(
    `${name}/getAll`,
    async (_, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.get(`/${endpoint}`);
        return response.data?.data ?? response.data;
      } catch (error) {
        const msg = error.response?.data?.message ?? `Failed to load ${name}s`;
        toast.error(msg);
        return rejectWithValue(msg);
      }
    }
  );

  // 🟢 CREATE
  const createItem = createAsyncThunk(
    `${name}/create`,
    async (data, { rejectWithValue }) => {
      const toastId = toast.loading(`Creating ${name}...`);
      try {
        const response = await axiosInstance.post(`/${endpoint}`, data);
        toast.update(toastId, {
          render:    `${name} created successfully`,
          type:      "success",
          isLoading: false,
          autoClose: 3000,
        });
        return response.data?.data ?? null;
      } catch (error) {
        const msg = error.response?.data?.message ?? `Failed to create ${name}`;
        toast.update(toastId, {
          render:    msg,
          type:      "error",
          isLoading: false,
          autoClose: 4000,
        });
        return rejectWithValue(msg);
      }
    }
  );

  // 🟡 UPDATE
  const updateItem = createAsyncThunk(
    `${name}/update`,
    async ({ id, data }, { rejectWithValue }) => {
      const toastId = toast.loading(`Updating ${name}...`);
      try {
        const response = await axiosInstance.put(`/${endpoint}/${id}`, data);
        toast.update(toastId, {
          render:    `${name} updated successfully`,
          type:      "success",
          isLoading: false,
          autoClose: 3000,
        });
        return response.data?.data ?? null;
      } catch (error) {
        const msg = error.response?.data?.message ?? `Failed to update ${name}`;
        toast.update(toastId, {
          render:    msg,
          type:      "error",
          isLoading: false,
          autoClose: 4000,
        });
        return rejectWithValue(msg);
      }
    }
  );

  // 🔴 DELETE
  const deleteItem = createAsyncThunk(
    `${name}/delete`,
    async (id, { rejectWithValue }) => {
      try {
        await axiosInstance.delete(`/${endpoint}/${id}`);
        toast.success(`${name} deleted successfully`);
        return id;
      } catch (error) {
        const msg = error.response?.data?.message ?? `Failed to delete ${name}`;
        toast.error(msg);
        return rejectWithValue(msg);
      }
    }
  );

  const slice = createSlice({
    name,
    initialState: {
      data:    [],
      loading: false,
      error:   null,
    },
    reducers: {},
    extraReducers: (builder) => {
      builder
        // GET ALL
        .addCase(getAll.pending, (state) => {
          state.loading = true;
          state.error   = null;
        })
        .addCase(getAll.fulfilled, (state, action) => {
          state.loading = false;
          state.data    = action.payload ?? [];
        })
        .addCase(getAll.rejected, (state, action) => {
          state.loading = false;
          state.error   = action.payload;
        })

        // CREATE
        .addCase(createItem.pending, (state) => {
          state.error = null;
        })
        .addCase(createItem.fulfilled, (state, action) => {
          if (action.payload) state.data.push(action.payload);
        })
        .addCase(createItem.rejected, (state, action) => {
          state.error = action.payload;
        })

        // UPDATE
        .addCase(updateItem.fulfilled, (state, action) => {
          if (!action.payload) return;
          const index = state.data.findIndex((item) => item[idKey] === action.payload[idKey]);
          if (index !== -1) state.data[index] = action.payload;
        })
        .addCase(updateItem.rejected, (state, action) => {
          state.error = action.payload;
        })

        // DELETE
        .addCase(deleteItem.fulfilled, (state, action) => {
          state.data = state.data.filter((item) => item[idKey] !== action.payload);
        })
        .addCase(deleteItem.rejected, (state, action) => {
          state.error = action.payload;
        });
    },
  });

  return {
    reducer: slice.reducer,
    actions: { getAll, createItem, updateItem, deleteItem },
  };
};