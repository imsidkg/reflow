"use client";

import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { addRect, setTool, Tool } from "@/redux/slices/shapes";
import {
  MousePointer2,
  Grid3X3,
  Square,
  Circle,
  Pencil,
  MoveUpRight,
  Minus,
  Type,
  Search,
} from "lucide-react";
import { useEffect } from "react";

const tools: { name: string; icon: React.ReactNode; tool: Tool }[] = [
  {
    name: "Select",
    icon: <MousePointer2 className="h-4 w-4" />,
    tool: "select",
  },
  { name: "Frame", icon: <Grid3X3 className="h-4 w-4" />, tool: "frame" },
  { name: "Rectangle", icon: <Square className="h-4 w-4" />, tool: "rect" },
  { name: "Ellipse", icon: <Circle className="h-4 w-4" />, tool: "ellipse" },
  { name: "Draw", icon: <Pencil className="h-4 w-4" />, tool: "freedraw" },
  { name: "Arrow", icon: <MoveUpRight className="h-4 w-4" />, tool: "arrow" },
  { name: "Line", icon: <Minus className="h-4 w-4" />, tool: "line" },
  { name: "Text", icon: <Type className="h-4 w-4" />, tool: "text" },
];

export default function Toolbar() {
  const dispatch = useAppDispatch();

  const currentTool = useAppSelector((state) => state.shapes.tool);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 rounded-full border border-white/[0.12] bg-white/[0.08] p-2 backdrop-blur-xl">
        {tools.map((t) => (
          <button
            key={t.tool}
            onClick={() => dispatch(setTool(t.tool))}
            title={t.name}
            className={[
              "p-2 rounded-full transition-all",
              currentTool === t.tool
                ? "bg-white/[0.15] text-white"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]",
            ].join(" ")}
          >
            {t.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
