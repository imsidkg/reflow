import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EntityState } from "@reduxjs/toolkit";
import { Shape } from "./shapes";

const cloneEntityState = (
  state: EntityState<Shape, string>
): EntityState<Shape, string> => {
  return {
    ids: [...state.ids],
    entities: { ...state.entities },
  };
};

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
    pushToHistory(state, action: PayloadAction<EntityState<Shape, string>>) {
      const cloned = cloneEntityState(action.payload);
      state.past.push(cloned);
      if (state.past.length > state.maxHistory) {
        state.past.shift();
      }
      state.future = [];
    },

    undo(state) {
      if (state.past.length === 0) return;
    },

    redo(state) {
      if (state.future.length === 0) return;
    },

    popFromPast(state, action: PayloadAction<EntityState<Shape, string>>) {
      if (state.past.length === 0) return;
      const cloned = cloneEntityState(action.payload);
      state.future.push(cloned);
      state.past.pop();
    },

    popFromFuture(state, action: PayloadAction<EntityState<Shape, string>>) {
      if (state.future.length === 0) return;
      const cloned = cloneEntityState(action.payload);
      state.past.push(cloned);
      state.future.pop();
    },

    clearHistory(state) {
      state.past = [];
      state.future = [];
    },
  },
});

export const { pushToHistory, popFromPast, popFromFuture, clearHistory } =
  historySlice.actions;
export default historySlice.reducer;
