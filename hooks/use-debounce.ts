"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface CanvasData {
  shapes: unknown;
  selected: unknown;
  tool: string;
  frameCounter: number;
  viewport: {
    scale: number;
    translate: { x: number; y: number };
  };
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useDebouncedSave(
  data: CanvasData,
  projectId: string,
  delay: number = 1500,
  shouldSave: boolean = true,
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const isFirstRender = useRef(true);
  const lastSavedData = useRef<string>("");

  const saveToDatabase = useCallback(
    async (canvasData: CanvasData) => {
      try {
        setStatus("saving");

        const response = await fetch(`/api/project/${projectId}/canvas`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(canvasData),
        });

        if (!response.ok) {
          throw new Error("Failed to save canvas");
        }

        lastSavedData.current = JSON.stringify(canvasData);
        setStatus("saved");

        setTimeout(() => setStatus("idle"), 2000);
      } catch (error) {
        console.error("Auto-save error:", error);
        setStatus("error");
      }
    },
    [projectId],
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      lastSavedData.current = JSON.stringify(data);
      return;
    }

    if (!shouldSave) {
      lastSavedData.current = JSON.stringify(data);
      return;
    }

    const currentDataString = JSON.stringify(data);
    if (currentDataString === lastSavedData.current) {
      return;
    }

    const timer = setTimeout(() => {
      saveToDatabase(data);
    }, delay);

    return () => clearTimeout(timer);
  }, [data, delay, saveToDatabase, shouldSave]);

  return { status };
}
