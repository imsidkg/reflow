import { GeneratedUIShape } from "@/redux/slices/shapes";
import DOMPurify from "isomorphic-dompurify";
import { useEffect, useRef, useState } from "react";

export const GeneratedUI = ({ shape }: { shape: GeneratedUIShape }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(
    null,
  );

  // Listen for inspection mode toggle from the selection overlay
  useEffect(() => {
    const handleToggle = (e: CustomEvent) => {
      setIsInspecting(e.detail.isInspecting);
      if (!e.detail.isInspecting) {
        setHoveredElement(null);
      }
    };

    window.addEventListener(
      `set-inspection-mode-${shape.id}`,
      handleToggle as EventListener,
    );
    return () => {
      window.removeEventListener(
        `set-inspection-mode-${shape.id}`,
        handleToggle as EventListener,
      );
    };
  }, [shape.id]);

  // Handle interaction with the generated content
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isInspecting) return;

    const handleMouseOver = (e: MouseEvent) => {
      e.stopPropagation();
      const target = e.target as HTMLElement;
      // Don't highlight the container itself
      if (target === container || container.contains(target)) {
        setHoveredElement(target);
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      e.stopPropagation();
      setHoveredElement(null);
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target as HTMLElement;

      // Create a simplified representation of the element
      const selectedData = {
        tagName: target.tagName,
        text: target.innerText.slice(0, 50),
        html: target.outerHTML,
        className: target.className,
        // Calculate a simple path if possible, or just rely on context
        xpath: getXPath(target, container),
      };

      // Dispatch event to parent
      const event = new CustomEvent(`generated-ui-selected-${shape.id}`, {
        detail: selectedData,
      });
      window.dispatchEvent(event);

      setIsInspecting(false);
      setHoveredElement(null);
    };

    container.addEventListener("mouseover", handleMouseOver);
    container.addEventListener("mouseout", handleMouseOut);
    container.addEventListener("click", handleClick, true); // Capture phase to prevent links

    return () => {
      container.removeEventListener("mouseover", handleMouseOver);
      container.removeEventListener("mouseout", handleMouseOut);
      container.removeEventListener("click", handleClick, true);
    };
  }, [isInspecting, shape.id]);

  if (!shape.uiSpecData) return null;

  return (
    <>
      <div
        ref={containerRef}
        className="absolute overflow-hidden bg-white shadow-xl isolate"
        style={{
          left: shape.x,
          top: shape.y,
          width: shape.w,
          height: shape.h,
          borderRadius: "12px",
          pointerEvents: isInspecting ? "auto" : undefined, // Ensure clicks pass through when not inspecting? Actually usually we want interaction.
          // But when inspecting, we definitely capture everything.
        }}
      >
        <div
          className="w-full h-full overflow-auto"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(shape.uiSpecData),
          }}
        />

        {/* Highlight Overlay */}
        {isInspecting && hoveredElement && containerRef.current && (
          <HighlightOverlay
            target={hoveredElement}
            container={containerRef.current}
          />
        )}

        {/* Inspection Mode Indicator */}
        {isInspecting && (
          <div className="absolute inset-0 pointer-events-none ring-2 ring-blue-500 ring-inset z-50 rounded-[12px] bg-blue-500/10" />
        )}

        {/* Helper overlay to indicate it's generated */}
        {!isInspecting && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] text-white font-medium z-10 pointer-events-none">
            AI Generated
          </div>
        )}
      </div>
    </>
  );
};

// Simple XPath generator relative to container
function getXPath(element: HTMLElement, container: HTMLElement): string {
  if (element === container) return "";
  let path = "";
  let current: HTMLElement | null = element;

  while (current && current !== container) {
    let index = 1;
    let sibling = current.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === current.tagName) index++;
      sibling = sibling.previousElementSibling;
    }
    const tagName = current.tagName.toLowerCase();
    path = `/${tagName}[${index}]${path}`;
    current = current.parentElement;
  }
  return path;
}

function HighlightOverlay({
  target,
  container,
}: {
  target: HTMLElement;
  container: HTMLElement;
}) {
  // We need to calculate position relative to the container
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  if (target === container) return null;

  return (
    <div
      className="absolute pointer-events-none border-2 border-blue-500 bg-blue-500/20 z-[60]"
      style={{
        top: targetRect.top - containerRect.top + container.scrollTop,
        left: targetRect.left - containerRect.left + container.scrollLeft,
        width: targetRect.width,
        height: targetRect.height,
      }}
    />
  );
}
