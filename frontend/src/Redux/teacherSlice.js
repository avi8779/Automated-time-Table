import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../Helper/axiosInstance";
import { toast } from "react-toastify";

const initialState = {
  teacherData: [],
  loading: false,
  error: null,
};



// 🔵 GET ALL TEACHERS
export const getAllTeachers = createAsyncThunk(
  "teacher/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = axiosInstance.get("/teachers");

      toast.promise(res, {
        loading: "Loading teacher data...",
        success: "Teachers loaded successfully",
        error: "Failed to load teachers",
      });

      const response = await res;
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);



// 🟢 CREATE TEACHER
export const createTeacher = createAsyncThunk(
  "teacher/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = axiosInstance.post("/teachers", data);

      toast.promise(res, {
        loading: "Creating teacher...",
        success: "Teacher created successfully",
        error: "Failed to create teacher",
      });

      const response = await res;
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);



// 🟡 UPDATE TEACHER
export const updateTeacher = createAsyncThunk(
  "teacher/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/teachers/${id}`, data);
      toast.success("Teacher updated successfully");
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);



// 🔴 DELETE TEACHER
export const deleteTeacher = createAsyncThunk(
  "teacher/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/teachers/${id}`);
      toast.success("Teacher deleted successfully");
      return id; // id return kar rahe
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);




// 🏗 SLICE
const teacherSlice = createSlice({
  name: "teacher",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
  builder

    // GET
    .addCase(getAllTeachers.pending, (state) => {
      state.loading = true;
    })
    .addCase(getAllTeachers.fulfilled, (state, action) => {
      state.loading = false;
      state.teacherData = action.payload;
    })
    .addCase(getAllTeachers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })

    // CREATE
    .addCase(createTeacher.fulfilled, (state, action) => {
      state.teacherData.push(action.payload);
    })

    // UPDATE
    .addCase(updateTeacher.fulfilled, (state, action) => {
      const index = state.teacherData.findIndex(
        (teacher) => teacher._id === action.payload._id
      );
      if (index !== -1) {
        state.teacherData[index] = action.payload;
      }
    })

    // DELETE
    .addCase(deleteTeacher.fulfilled, (state, action) => {
      state.teacherData = state.teacherData.filter(
        (teacher) => teacher._id !== action.payload
      );
    });
    }
});

export default teacherSlice.reducer;
