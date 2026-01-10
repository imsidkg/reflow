import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

export interface MoodBoardImage {
  id: string;
  url: string;
  filename: string;
  projectId: string;
  createdAt: string;
}

interface MoodBoardState {
  images: MoodBoardImage[];
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  uploadProgress: number;
}

const initialState: MoodBoardState = {
  images: [],
  isLoading: false,
  isUploading: false,
  error: null,
  uploadProgress: 0,
};

export const fetchMoodBoardImages = createAsyncThunk(
  "moodBoard/fetchImages",
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/project/${projectId}/mood-board`, {
        withCredentials: true,
      });
      return response.data.moodBoards as MoodBoardImage[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch images"
      );
    }
  }
);

export const uploadMoodBoardImage = createAsyncThunk(
  "moodBoard/uploadImage",
  async (
    { projectId, file }: { projectId: string; file: File },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `/api/project/${projectId}/mood-board`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data.moodBoard as MoodBoardImage;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to upload image"
      );
    }
  }
);

export const deleteMoodBoardImage = createAsyncThunk(
  "moodBoard/deleteImage",
  async (
    { projectId, imageId }: { projectId: string; imageId: string },
    { rejectWithValue }
  ) => {
    try {
      await axios.delete(`/api/project/${projectId}/mood-board/${imageId}`, {
        withCredentials: true,
      });
      return imageId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to delete image"
      );
    }
  }
);

const moodBoardSlice = createSlice({
  name: "moodBoard",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    clearImages: (state) => {
      state.images = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMoodBoardImages.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchMoodBoardImages.fulfilled, (state, action) => {
      state.isLoading = false;
      state.images = action.payload;
    });
    builder.addCase(fetchMoodBoardImages.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(uploadMoodBoardImage.pending, (state) => {
      state.isUploading = true;
      state.error = null;
      state.uploadProgress = 0;
    });
    builder.addCase(uploadMoodBoardImage.fulfilled, (state, action) => {
      state.isUploading = false;
      state.images.unshift(action.payload); 
      state.uploadProgress = 100;
    });
    builder.addCase(uploadMoodBoardImage.rejected, (state, action) => {
      state.isUploading = false;
      state.error = action.payload as string;
      state.uploadProgress = 0;
    });

    builder.addCase(deleteMoodBoardImage.fulfilled, (state, action) => {
      state.images = state.images.filter((img) => img.id !== action.payload);
    });
    builder.addCase(deleteMoodBoardImage.rejected, (state, action) => {
      state.error = action.payload as string;
    });
  },
});

export const { clearError, setUploadProgress, clearImages } =
  moodBoardSlice.actions;
export default moodBoardSlice.reducer;
