import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ProfileState {
  id: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  image: string | null;
}

const initialState: ProfileState = {
  id: null,
  email: null,
  firstName: null,
  lastName: null,
  image: null,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<ProfileState>) => {
      state.id = action.payload.id;
      state.email = action.payload.email;
      state.firstName = action.payload.firstName;
      state.lastName = action.payload.lastName;
      state.image = action.payload.image;
    },
    clearProfile: (state) => {
      state.id = null;
      state.email = null;
      state.firstName = null;
      state.lastName = null;
      state.image = null;
    },
  },
});

export const { setProfile, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
