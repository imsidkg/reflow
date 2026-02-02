import {
  Shape,
  FrameShape,
  RectShape,
  updateShape,
  addGeneratedUI,
  setGeneratingWorkflow,
} from "@/redux/slices/shapes";
import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

interface SelectionOverlayProps {
  shape: Shape;
  isSelected: boolean;
}

export const SelectionOverlay = ({
  shape,
  isSelected,
}: SelectionOverlayProps) => {
  if (!isSelected) return null;

  const getBounds = () => {
    switch (shape.type) {
      case "frame":
      case "rect":
      case "generatedui":
        return {
          x: shape.x,
          y: shape.y,
          w: (shape as any).w,
          h: (shape as any).h,
        };
      case "ellipse":
        return {
          x: shape.x,
          y: shape.y,
          w: (shape as any).rx * 2,
          h: (shape as any).ry * 2,
        };
      case "freedraw":
        if ((shape as any).points.length === 0)
          return { x: 0, y: 0, w: 0, h: 0 };
        const xs = (shape as any).points.map((p: any) => p.x);
        const ys = (shape as any).points.map((p: any) => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        return {
          x: minX - 5,
          y: minY - 5,
          w: maxX - minX + 10,
          h: maxY - minY + 10,
        };
      case "arrow":
      case "line":
        const lineMinX = Math.min(shape.startX, shape.endX);
        const lineMaxX = Math.max(shape.startX, shape.endX);
        const lineMinY = Math.min(shape.startY, shape.endY);
        const lineMaxY = Math.max(shape.startY, shape.endY);
        return {
          x: lineMinX - 5,
          y: lineMinY - 5,
          w: lineMaxX - lineMinX + 10,
          h: lineMaxY - lineMinY + 10,
        };
      case "text":
        const textWidth = Math.max(
          shape.text.length * (shape.fontSize * 0.6),
          100,
        );
        const textHeight = shape.fontSize * 1.5;
        return {
          x: shape.x,
          y: shape.y,
          w: textWidth + 16,
          h: textHeight + 8,
        };
      default:
        return { x: 0, y: 0, w: 0, h: 0 };
    }
  };

  const bounds = getBounds();

  const { projectId } = useParams();
  const dispatch = useAppDispatch();
  const isGenerating = useAppSelector(
    (state) => state.shapes.isGeneratingWorkflow,
  );

  const handleGenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Generate UI clicked for shape:", shape.id);

    // Set global loading state
    dispatch(setGeneratingWorkflow(true));

    try {
      console.log("Sending POST request to generate-ui...");
      const res = await fetch(`/api/project/${projectId}/generate-ui`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shapeId: shape.id }),
      });
      console.log("Response status:", res.status);
      if (res.ok) {
        // Optimistic UI or toast
        console.log("Request successful");
      } else {
        console.error("Request failed with status", res.status);
      }
    } catch (e) {
      console.error("Generate UI Error:", e);
      dispatch(setGeneratingWorkflow(false)); // Reset if API call fails immediately
    }
  };

  const showGenerate = shape.type === "frame" || shape.type === "rect";

  return (
    <>
      <div
        className="absolute pointer-events-none border-2 border-blue-500"
        style={{
          left: bounds.x - 2,
          top: bounds.y - 2,
          width: bounds.w + 4,
          height: bounds.h + 4,
          borderRadius: shape.type === "frame" ? "10px" : "4px",
        }}
      />
      {showGenerate && (
        <div
          className="absolute flex items-center justify-end pointer-events-auto"
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            left: bounds.x,
            top: bounds.y - 30, // Position above the shape
            width: bounds.w,
          }}
        >
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1.5 text-xs text-white hover:text-blue-400 transition-colors bg-transparent px-2 py-1 rounded"
          >
            {isGenerating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3 text-white" />
            )}
            Generate UI
          </button>
        </div>
      )}
    </>
  );
};
