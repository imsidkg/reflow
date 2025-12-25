import { configureStore } from "@reduxjs/toolkit";
import profileReducer from "./slices/profile";
import projectReducer from "./slices/project";
import shapesReducer from "./slices/shapes";
import viewportReducer from "./slices/viewport";
import historyReducer from "./slices/history";

export const store = configureStore({
  reducer: {
    profile: profileReducer,
    project: projectReducer,
    shapes: shapesReducer,
    viewport: viewportReducer,
    history: historyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
