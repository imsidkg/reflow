import {
  Shape,
  FrameShape,
  RectShape,
  updateShape,
  addGeneratedUI,
  setGeneratingWorkflow,
} from "@/redux/slices/shapes";
import { Sparkles, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
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

      {shape.type === "generatedui" && (
        <DesignChatWrapper shape={shape} bounds={bounds} />
      )}
    </>
  );
};

// Separate wrapper to manage chat state without re-rendering the main overlay too often
import { DesignChat } from "./design-chat";
import { MessageSquare } from "lucide-react";

function DesignChatWrapper({ shape, bounds }: { shape: any; bounds: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [isRefining, setIsRefining] = useState(false);
  const { projectId } = useParams();

  // Listen for inspection events from the generated UI
  useEffect(() => {
    if (!isInspecting) return;

    const handleElementSelected = (e: CustomEvent) => {
      setSelectedElement(e.detail);
      setIsOpen(true); // Open chat when element is clicked
      setIsInspecting(false); // Turn off inspection mode
    };

    window.addEventListener(
      `generated-ui-selected-${shape.id}`,
      handleElementSelected as EventListener,
    );

    // Also trigger the inspection mode on the shape itself
    const event = new CustomEvent(`set-inspection-mode-${shape.id}`, {
      detail: { isInspecting },
    });
    window.dispatchEvent(event);

    return () => {
      window.removeEventListener(
        `generated-ui-selected-${shape.id}`,
        handleElementSelected as EventListener,
      );
    };
  }, [isInspecting, shape.id]);

  // Sync inspection mode changes when toggled from chat
  useEffect(() => {
    const event = new CustomEvent(`set-inspection-mode-${shape.id}`, {
      detail: { isInspecting },
    });
    window.dispatchEvent(event);
  }, [isInspecting, shape.id]);

  const handleRefine = async (prompt: string) => {
    setIsRefining(true);
    try {
      const res = await fetch(`/api/project/${projectId}/refine-ui`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shapeId: shape.id,
          prompt,
          selectedElement,
        }),
      });

      if (!res.ok) {
        console.error("Refinement failed");
      }
    } catch (e) {
      console.error("Refinement error", e);
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <div
        className="absolute flex items-center justify-end pointer-events-auto"
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          left: bounds.x,
          top: bounds.y - 36,
          width: bounds.w,
        }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 text-xs transition-colors px-2 py-1.5 rounded-lg border backdrop-blur-md shadow-sm ${
            isOpen
              ? "bg-indigo-500 text-white border-indigo-400"
              : "bg-black/40 text-white hover:bg-black/60 border-white/10"
          }`}
        >
          <MessageSquare className="w-3 h-3" />
          Design Chat
        </button>
      </div>

      {/* Chat Interface */}
      {isOpen && (
        <div
          className="absolute pointer-events-auto"
          style={{
            left: bounds.x + bounds.w + 10,
            top: bounds.y,
            zIndex: 100,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <DesignChat
            shape={shape}
            onClose={() => setIsOpen(false)}
            isInspecting={isInspecting}
            setIsInspecting={setIsInspecting}
            selectedElement={selectedElement}
            onRefine={handleRefine}
            isGenerating={isRefining}
          />
        </div>
      )}
    </>
  );
}
