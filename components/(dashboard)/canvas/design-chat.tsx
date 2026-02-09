"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  MousePointer2,
  X,
  Sparkles,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GeneratedUIShape } from "@/redux/slices/shapes";

interface DesignChatProps {
  shape: GeneratedUIShape;
  onClose: () => void;
  isInspecting: boolean;
  setIsInspecting: (v: boolean) => void;
  selectedElement: {
    tagName: string;
    text: string;
    html: string;
    xpath: string; // specialized selector for unique identification
  } | null;
  onRefine: (prompt: string) => Promise<void>;
  isGenerating?: boolean;
}

export function DesignChat({
  shape,
  onClose,
  isInspecting,
  setIsInspecting,
  selectedElement,
  onRefine,
  isGenerating = false,
}: DesignChatProps) {
  const [prompt, setPrompt] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    await onRefine(prompt);
    setPrompt("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const preventPropagation = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="absolute top-10 right-[-340px] w-80 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-left-5 fade-in duration-200 z-50">
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-white">
            Design Assistant
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col gap-4">
        {/* Inspection Toggle */}
        <button
          onClick={() => setIsInspecting(!isInspecting)}
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl border transition-all text-left group",
            isInspecting
              ? "bg-blue-500/20 border-blue-500/50 text-blue-200"
              : "bg-zinc-800 border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-300",
          )}
        >
          <div
            className={cn(
              "p-2 rounded-lg transition-colors",
              isInspecting
                ? "bg-blue-500 text-white"
                : "bg-zinc-700 text-zinc-500 group-hover:text-zinc-400",
            )}
          >
            <MousePointer2 className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {isInspecting ? "Select an element..." : "Select element to edit"}
            </span>
            <span className="text-xs opacity-70">
              {isInspecting
                ? "Click on any UI element"
                : "Target specific parts of the UI"}
            </span>
          </div>
        </button>

        {/* Selected Context */}
        {selectedElement && (
          <div className="p-3 rounded-lg bg-zinc-800 border border-white/10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold">
                Target Selected
              </span>
              <button
                onClick={() => setIsInspecting(true)}
                className="text-[10px] text-zinc-500 hover:text-white underline"
              >
                Change
              </button>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <span className="text-xs font-mono bg-zinc-700 px-1.5 py-0.5 rounded border border-white/5">
                {selectedElement.tagName.toLowerCase()}
              </span>
              <span className="text-sm truncate max-w-[180px]">
                {selectedElement.text || "Container"}
              </span>
            </div>
          </div>
        )}

        {/* Chat Input */}
        <div className="relative">
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={preventPropagation}
            onKeyPress={preventPropagation}
            placeholder={
              selectedElement
                ? "How should I change this element?"
                : "Describe changes for the whole design..."
            }
            className="w-full bg-zinc-800 border border-white/10 rounded-xl p-3 pb-12 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500/50 resize-none min-h-[100px]"
            disabled={isGenerating}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!prompt.trim() || isGenerating}
            className="absolute bottom-3 right-3 p-2 rounded-lg bg-zinc-700 text-white hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
