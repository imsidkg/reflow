import { configureStore } from "@reduxjs/toolkit";
import profileReducer from "./slices/profile";
import projectReducer from "./slices/project";

export const store = configureStore({
  reducer: {
    profile: profileReducer,
    project: projectReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
