import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EntityState } from "@reduxjs/toolkit";
import { Shape } from "./shapes";

interface HistoryState {
  past: EntityState<Shape, string>[];
  future: EntityState<Shape, string>[];
  maxHistory: number;
}

const initialState: HistoryState = {
  past: [],
  future: [],
  maxHistory: 50,
};

const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    saveSnapshot(state, action: PayloadAction<EntityState<Shape, string>>) {
      state.past.push(action.payload);
      if (state.past.length > state.maxHistory) {
        state.past.shift();
      }
      state.future = [];
    },

    undoSnapshot(state, action: PayloadAction<EntityState<Shape, string>>) {
      if (state.past.length === 0) return;

      state.future.push(action.payload);
      state.past.pop();
    },

    redoSnapshot(state, action: PayloadAction<EntityState<Shape, string>>) {
      if (state.future.length === 0) return;

      state.past.push(action.payload);
      state.future.pop();
    },

    clearHistory(state) {
      state.past = [];
      state.future = [];
    },
  },
});

export const { saveSnapshot, undoSnapshot, redoSnapshot, clearHistory } =
  historySlice.actions;
export default historySlice.reducer;
