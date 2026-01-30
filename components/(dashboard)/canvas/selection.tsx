import { Shape } from "@/redux/slices/shapes";
import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { useParams } from "next/navigation";

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
      case "ellipse":
      case "generatedui":
        return {
          x: shape.x,
          y: shape.y,
          w: shape.w,
          h: shape.h,
        };
      case "freedraw":
        if (shape.points.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
        const xs = shape.points.map((p) => p.x);
        const ys = shape.points.map((p) => p.y);
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
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/project/${projectId}/generate-ui`, {
        method: "POST",
      });
      if (res.ok) {
        // Optimistic UI or toast
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsGenerating(false), 2000);
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
