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
      console.log(
        "GeneratedUI received inspection toggle:",
        e.detail.isInspecting,
      );
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

  // Force pointer-events on all elements when inspecting to ensure selection works
  useEffect(() => {
    if (!isInspecting || !containerRef.current) return;

    try {
      const allElements = containerRef.current.querySelectorAll("*");
      allElements.forEach((el) => {
        (el as HTMLElement).style.setProperty(
          "pointer-events",
          "auto",
          "important",
        );
        (el as HTMLElement).style.setProperty(
          "cursor",
          "crosshair",
          "important",
        );
      });
      console.log(`Enforced pointer-events on ${allElements.length} elements`);
    } catch (e) {
      console.error("Failed to enforce pointer events:", e);
    }
  }, [isInspecting, shape.uiSpecData]);

  // Handle interaction with the generated content
  useEffect(() => {
    console.log(
      "GeneratedUI Interaction Effect Running. isInspecting:",
      isInspecting,
    );
    const container = containerRef.current;
    if (!container || !isInspecting) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.stopPropagation();

      const x = e.clientX;
      const y = e.clientY;

      const elements = document.elementsFromPoint(x, y);

      const candidates = elements
        .filter((el) => {
          return (
            container.contains(el) &&
            el !== container &&
            !el.classList.contains("generated-content-wrapper")
          );
        })
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            el: el as HTMLElement,
            area: rect.width * rect.height,
          };
        });

      if (candidates.length === 0) {
        setHoveredElement(null);
        return;
      }

      candidates.sort((a, b) => a.area - b.area);
      const bestCandidate = candidates[0].el;

      if (bestCandidate !== hoveredElement) {
        setHoveredElement(bestCandidate);
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      e.stopPropagation();
      setHoveredElement(null);
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const x = e.clientX;
      const y = e.clientY;

      // Get all elements at the click position
      const elements = document.elementsFromPoint(x, y);

      // Filter elements that belong to this generated UI container
      // and exclude the container/wrapper themselves to find specific targets
      const candidates = elements
        .filter((el) => {
          return (
            container.contains(el) &&
            el !== container &&
            !el.classList.contains("generated-content-wrapper")
          );
        })
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            el: el as HTMLElement,
            area: rect.width * rect.height,
            rect,
          };
        });

      if (candidates.length === 0) return;

      // Sort by area (smallest first) to prioritize specific elements (buttons, inputs)
      // over their containers or overlays.
      candidates.sort((a, b) => a.area - b.area);

      // Select the smallest element
      const bestCandidate = candidates[0].el;

      // Create a simplified representation of the element
      const selectedData = {
        tagName: bestCandidate.tagName,
        text: bestCandidate.innerText?.slice(0, 50) || "",
        html: bestCandidate.outerHTML,
        className: bestCandidate.className,
        xpath: getXPath(bestCandidate, container),
      };

      const event = new CustomEvent(`generated-ui-selected-${shape.id}`, {
        detail: selectedData,
      });
      window.dispatchEvent(event);

      setIsInspecting(false);
      setHoveredElement(null);
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Capture pointer down to stop canvas drag
      e.stopPropagation();
      console.log("GeneratedUI PointerDown (Bubble)", e.target);
    };

    // Use interaction events
    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);
    container.addEventListener("click", handleClick, true);

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      container.removeEventListener("click", handleClick, true);
    };
  }, [isInspecting, shape.id]);

  if (!shape.uiSpecData) return null;

  return (
    <>
      <div
        ref={containerRef}
        className={`absolute overflow-hidden bg-white shadow-xl ${isInspecting ? "cursor-crosshair z-[100]" : "z-[1]"}`}
        style={{
          left: shape.x,
          top: shape.y,
          width: shape.w,
          height: shape.h,
          borderRadius: "12px",
          pointerEvents: "auto",
        }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
            .generated-content-wrapper * {
              pointer-events: ${isInspecting ? "auto !important" : "auto"};
              cursor: ${isInspecting ? "crosshair !important" : "auto"};
            }
          `,
          }}
        />
        <div
          className="w-full h-full overflow-auto generated-content-wrapper"
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
