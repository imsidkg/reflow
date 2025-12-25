"use client";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { updateShape } from "@/redux/slices/shapes";
import { screenToWorld } from "@/redux/slices/viewport";
import { useState, useCallback } from "react";

type HandlePosition = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

interface ResizeHandlesProps {
  shapeId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const HANDLE_SIZE = 8;

export default function ResizeHandles({
  shapeId,
  x,
  y,
  w,
  h,
}: ResizeHandlesProps) {
  const dispatch = useAppDispatch();
  const { scale, translate } = useAppSelector((state) => state.viewport);
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<HandlePosition | null>(null);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [startBounds, setStartBounds] = useState({ x, y, w, h });

  const handles: {
    position: HandlePosition;
    cursor: string;
    cx: number;
    cy: number;
  }[] = [
    { position: "nw", cursor: "nwse-resize", cx: x, cy: y },
    { position: "n", cursor: "ns-resize", cx: x + w / 2, cy: y },
    { position: "ne", cursor: "nesw-resize", cx: x + w, cy: y },
    { position: "e", cursor: "ew-resize", cx: x + w, cy: y + h / 2 },
    { position: "se", cursor: "nwse-resize", cx: x + w, cy: y + h },
    { position: "s", cursor: "ns-resize", cx: x + w / 2, cy: y + h },
    { position: "sw", cursor: "nesw-resize", cx: x, cy: y + h },
    { position: "w", cursor: "ew-resize", cx: x, cy: y + h / 2 },
  ];

  const handlePointerDown = (
    e: React.PointerEvent,
    position: HandlePosition
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const worldPoint = screenToWorld(
      { x: e.clientX, y: e.clientY },
      translate,
      scale
    );
    setIsResizing(true);
    setActiveHandle(position);
    setStartPoint(worldPoint);
    setStartBounds({ x, y, w, h });

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isResizing || !activeHandle) return;

      const worldPoint = screenToWorld(
        { x: e.clientX, y: e.clientY },
        translate,
        scale
      );
      const dx = worldPoint.x - startPoint.x;
      const dy = worldPoint.y - startPoint.y;

      let newX = startBounds.x;
      let newY = startBounds.y;
      let newW = startBounds.w;
      let newH = startBounds.h;

      switch (activeHandle) {
        case "nw":
          newX = startBounds.x + dx;
          newY = startBounds.y + dy;
          newW = startBounds.w - dx;
          newH = startBounds.h - dy;
          break;
        case "n":
          newY = startBounds.y + dy;
          newH = startBounds.h - dy;
          break;
        case "ne":
          newY = startBounds.y + dy;
          newW = startBounds.w + dx;
          newH = startBounds.h - dy;
          break;
        case "e":
          newW = startBounds.w + dx;
          break;
        case "se":
          newW = startBounds.w + dx;
          newH = startBounds.h + dy;
          break;
        case "s":
          newH = startBounds.h + dy;
          break;
        case "sw":
          newX = startBounds.x + dx;
          newW = startBounds.w - dx;
          newH = startBounds.h + dy;
          break;
        case "w":
          newX = startBounds.x + dx;
          newW = startBounds.w - dx;
          break;
      }

      const minSize = 10;
      if (newW < minSize) {
        if (activeHandle.includes("w")) {
          newX = startBounds.x + startBounds.w - minSize;
        }
        newW = minSize;
      }
      if (newH < minSize) {
        if (activeHandle.includes("n")) {
          newY = startBounds.y + startBounds.h - minSize;
        }
        newH = minSize;
      }

      dispatch(
        updateShape({
          id: shapeId,
          patch: { x: newX, y: newY, w: newW, h: newH },
        })
      );
    },
    [
      isResizing,
      activeHandle,
      startPoint,
      startBounds,
      translate,
      scale,
      dispatch,
      shapeId,
    ]
  );

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsResizing(false);
    setActiveHandle(null);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <>
      {handles.map((handle) => (
        <div
          key={handle.position}
          className="absolute bg-white border-2 border-blue-500 rounded-sm pointer-events-auto"
          style={{
            left: handle.cx - HANDLE_SIZE / 2,
            top: handle.cy - HANDLE_SIZE / 2,
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
            cursor: handle.cursor,
          }}
          onPointerDown={(e) => handlePointerDown(e, handle.position)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      ))}
    </>
  );
}
