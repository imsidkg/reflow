"use client";

import { Ellipse } from "@/components/(dashboard)/canvas/shapes/elipse";
import { Frame } from "@/components/(dashboard)/canvas/shapes/frame";
import { Rectangle } from "@/components/(dashboard)/canvas/shapes/rectangle";
import { Stroke } from "@/components/(dashboard)/canvas/shapes/stroke";
import { Arrow } from "@/components/(dashboard)/canvas/shapes/arrow";
import { Line } from "@/components/(dashboard)/canvas/shapes/line";
import { Text } from "@/components/(dashboard)/canvas/shapes/text";
import { SelectionOverlay } from "@/components/(dashboard)/canvas/selection";
import Toolbar from "@/components/(dashboard)/canvas/toolbar";
import UndoRedoControls from "@/components/(dashboard)/canvas/undo-redo";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  addRect,
  addEllipse,
  addFrame,
  addArrow,
  addLine,
  addText,
  addFreeDrawShape,
  selectShape,
  clearSelection,
  updateShape,
  deleteSelected,
  selectAll,
  removeShape,
  loadShapes,
} from "@/redux/slices/shapes";
import {
  saveSnapshot,
  undoSnapshot,
  redoSnapshot,
} from "@/redux/slices/history";
import type { Point } from "@/redux/slices/viewport";
import {
  screenToWorld,
  wheelZoom,
  wheelPan,
  panStart,
  panMove,
  panEnd,
} from "@/redux/slices/viewport";
import { useRef, useState, useEffect, useCallback } from "react";

export default function CanvasPage() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();

  // Redux state
  const shapesState = useAppSelector((state) => state.shapes);
  const shapes = shapesState.shapes;
  const currentTool = shapesState.tool;
  const selected = shapesState.selected;
  const { scale, translate, mode } = useAppSelector((state) => state.viewport);
  const history = useAppSelector((state) => state.history);

  const handleUndo = useCallback(() => {
    if (history.past.length === 0) return;
    dispatch(undoSnapshot(shapes));
    const previousState = history.past[history.past.length - 1];
    if (previousState) {
      dispatch(loadShapes(previousState));
    }
  }, [dispatch, history.past, shapes]);

  const handleRedo = useCallback(() => {
    if (history.future.length === 0) return;
    dispatch(redoSnapshot(shapes));
    const nextState = history.future[history.future.length - 1];
    if (nextState) {
      dispatch(loadShapes(nextState));
    }
  }, [dispatch, history.future, shapes]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentPoint, setCurrentPoint] = useState({ x: 0, y: 0 });
  const [freeDrawPoints, setFreeDrawPoints] = useState<Point[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const allShapes = Object.values(shapes.entities).filter(Boolean);
  const selectedIds = Object.keys(selected);

  const getWorldPoint = (e: React.PointerEvent | React.MouseEvent) => {
    return screenToWorld({ x: e.clientX, y: e.clientY }, translate, scale);
  };

  const getPreviewDimensions = () => {
    const x = Math.min(startPoint.x, currentPoint.x);
    const y = Math.min(startPoint.y, currentPoint.y);
    const w = Math.abs(currentPoint.x - startPoint.x);
    const h = Math.abs(currentPoint.y - startPoint.y);
    return { x, y, w, h };
  };

  const hitTest = (worldPoint: Point) => {
    for (let i = allShapes.length - 1; i >= 0; i--) {
      const shape = allShapes[i];
      if (!shape) continue;

      if (
        shape.type === "rect" ||
        shape.type === "ellipse" ||
        shape.type === "frame"
      ) {
        if (
          worldPoint.x >= shape.x &&
          worldPoint.x <= shape.x + shape.w &&
          worldPoint.y >= shape.y &&
          worldPoint.y <= shape.y + shape.h
        ) {
          return shape.id;
        }
      }
    }
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;

    const worldPoint = getWorldPoint(e);

    if (isSpacePressed) {
      dispatch(panStart({ screen: { x: e.clientX, y: e.clientY } }));
      return;
    }

    if (currentTool === "select") {
      const hitId = hitTest(worldPoint);
      if (hitId) {
        if (!selected[hitId]) {
          dispatch(clearSelection());
          dispatch(selectShape(hitId));
        }
        setIsDragging(true);
        setDragStart(worldPoint);
      } else {
        dispatch(clearSelection());
      }
      return;
    }

    if (currentTool === "eraser") {
      const hitId = hitTest(worldPoint);
      if (hitId) {
        dispatch(saveSnapshot(shapes)); 
        dispatch(removeShape(hitId));
      }
      return;
    }

    setIsDrawing(true);
    setStartPoint(worldPoint);
    setCurrentPoint(worldPoint);

    if (currentTool === "freedraw") {
      setFreeDrawPoints([worldPoint]);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (mode === "panning" || mode === "shiftPanning") {
      dispatch(panMove({ x: e.clientX, y: e.clientY }));
      return;
    }

    if (isDragging && selectedIds.length > 0) {
      const worldPoint = getWorldPoint(e);
      const dx = worldPoint.x - dragStart.x;
      const dy = worldPoint.y - dragStart.y;

      selectedIds.forEach((id) => {
        const shape = shapes.entities[id];
        if (
          shape &&
          (shape.type === "rect" ||
            shape.type === "ellipse" ||
            shape.type === "frame")
        ) {
          dispatch(
            updateShape({ id, patch: { x: shape.x + dx, y: shape.y + dy } })
          );
        }
      });
      setDragStart(worldPoint);
      return;
    }

    if (!isDrawing) return;
    const worldPoint = getWorldPoint(e);
    setCurrentPoint(worldPoint);

    if (currentTool === "freedraw") {
      setFreeDrawPoints((prev) => [...prev, worldPoint]);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (mode === "panning" || mode === "shiftPanning") {
      dispatch(panEnd());
      return;
    }

    if (isDragging) {
      setIsDragging(false);
      return;
    }

    if (!isDrawing) return;

    const endPoint = getWorldPoint(e);
    const { x, y, w, h } = getPreviewDimensions();

    if (w > 5 || h > 5) {
      switch (currentTool) {
        case "frame":
          dispatch(addFrame({ x, y, w, h }));
          break;
        case "rect":
          dispatch(addRect({ x, y, w, h }));
          break;
        case "ellipse":
          dispatch(addEllipse({ x, y, w, h }));
          break;
        case "arrow":
          dispatch(
            addArrow({
              startX: startPoint.x,
              startY: startPoint.y,
              endX: endPoint.x,
              endY: endPoint.y,
            })
          );
          break;
        case "line":
          dispatch(
            addLine({
              startX: startPoint.x,
              startY: startPoint.y,
              endX: endPoint.x,
              endY: endPoint.y,
            })
          );
          break;
        case "text":
          dispatch(addText({ x: startPoint.x, y: startPoint.y }));
          break;
        case "freedraw":
          if (freeDrawPoints.length > 2) {
            dispatch(addFreeDrawShape({ points: freeDrawPoints }));
          }
          break;
      }
    }

    setIsDrawing(false);
  };

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      if (e.shiftKey) {
        dispatch(wheelPan({ dx: -e.deltaY, dy: -e.deltaX }));
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        dispatch(
          wheelZoom({
            deltaY: e.deltaY,
            originScreen: { x: e.clientX, y: e.clientY },
          })
        );
        return;
      }

      dispatch(wheelPan({ dx: -e.deltaX, dy: -e.deltaY }));
    },
    [dispatch]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
      if (e.code === "Delete" || e.code === "Backspace") {
        if (selectedIds.length > 0) {
          dispatch(saveSnapshot(shapes)); 
          dispatch(deleteSelected());
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyA") {
        e.preventDefault();
        dispatch(selectAll());
      }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.code === "KeyZ") {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === "KeyZ") {
        e.preventDefault();
        handleRedo();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
        dispatch(panEnd());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSpacePressed, selectedIds, dispatch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const renderPreview = () => {
    if (!isDrawing) return null;

    const { x, y, w, h } = getPreviewDimensions();

    switch (currentTool) {
      case "frame":
      case "rect":
        return (
          <div
            className="absolute border-2 border-dashed border-blue-400 bg-blue-400/10 pointer-events-none"
            style={{ left: x, top: y, width: w, height: h, borderRadius: 8 }}
          />
        );
      case "ellipse":
        return (
          <div
            className="absolute border-2 border-dashed border-blue-400 bg-blue-400/10 pointer-events-none rounded-full"
            style={{ left: x, top: y, width: w, height: h }}
          />
        );
      case "arrow":
      case "line":
        return (
          <svg className="absolute inset-0 pointer-events-none overflow-visible">
            <line
              x1={startPoint.x}
              y1={startPoint.y}
              x2={currentPoint.x}
              y2={currentPoint.y}
              stroke="#60a5fa"
              strokeWidth={2}
              strokeDasharray="5,5"
            />
          </svg>
        );
      case "freedraw":
        if (freeDrawPoints.length < 2) return null;
        const pathData = freeDrawPoints
          .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
          .join(" ");
        return (
          <svg className="absolute inset-0 pointer-events-none overflow-visible">
            <path
              d={pathData}
              fill="none"
              stroke="#60a5fa"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`fixed inset-0 pt-20 overflow-hidden bg-zinc-950 ${
        isSpacePressed ? "cursor-grab" : ""
      } ${mode === "panning" ? "cursor-grabbing" : ""}`}
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        {allShapes.map((shape) => {
          if (!shape) return null;
          const isSelected = !!selected[shape.id];

          const shapeElement = (() => {
            switch (shape.type) {
              case "frame":
                return <Frame key={shape.id} shape={shape} />;
              case "rect":
                return <Rectangle key={shape.id} shape={shape} />;
              case "ellipse":
                return <Ellipse key={shape.id} shape={shape} />;
              case "freedraw":
                return <Stroke key={shape.id} shape={shape} />;
              case "arrow":
                return <Arrow key={shape.id} shape={shape} />;
              case "line":
                return <Line key={shape.id} shape={shape} />;
              case "text":
                return <Text key={shape.id} shape={shape} />;
              default:
                return null;
            }
          })();

          return (
            <div key={shape.id}>
              {shapeElement}
              <SelectionOverlay shape={shape} isSelected={isSelected} />
            </div>
          );
        })}

        {renderPreview()}
      </div>

      <Toolbar />

      <UndoRedoControls />

      <div className="fixed bottom-6 right-6 px-3 py-1 rounded-full bg-white/10 text-zinc-400 text-sm backdrop-blur-sm">
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
}
