"use client";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { popFromPast, popFromFuture } from "@/redux/slices/history";
import { loadShapes } from "@/redux/slices/shapes";
import { Undo2, Redo2 } from "lucide-react";

export default function UndoRedoControls() {
  const dispatch = useAppDispatch();
  const shapes = useAppSelector((state) => state.shapes.shapes);
  const history = useAppSelector((state) => state.history);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const handleUndo = () => {
    if (!canUndo) return;

    const previousState = history.past[history.past.length - 1];
    if (previousState) {
      dispatch(popFromPast(shapes));
      dispatch(loadShapes(previousState));
    }
  };

  const handleRedo = () => {
    if (!canRedo) return;

    const nextState = history.future[history.future.length - 1];
    if (nextState) {
      dispatch(popFromFuture(shapes));
      dispatch(loadShapes(nextState));
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex items-center gap-1 rounded-full border border-white/[0.12] bg-white/[0.08] p-1 backdrop-blur-xl">
      <button
        onClick={handleUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        className={[
          "p-2 rounded-full transition-all",
          canUndo
            ? "text-zinc-300 hover:bg-white/[0.1]"
            : "text-zinc-600 cursor-not-allowed",
        ].join(" ")}
      >
        <Undo2 className="h-4 w-4" />
      </button>
      <button
        onClick={handleRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Shift+Z)"
        className={[
          "p-2 rounded-full transition-all",
          canRedo
            ? "text-zinc-300 hover:bg-white/[0.1]"
            : "text-zinc-600 cursor-not-allowed",
        ].join(" ")}
      >
        <Redo2 className="h-4 w-4" />
      </button>
    </div>
  );
}
