"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Image as ImageIcon,
  X,
  Upload,
  Trash2,
  Plus,
  Loader2,
  Sparkles,
  LayoutPanelTop,
} from "lucide-react";

type MoodBoardImage = {
  id: string;
  url: string;
  filename: string;
};

export function InspirationBoard() {
  const { projectId } = useParams();
  const [images, setImages] = useState<MoodBoardImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll for generation status or just use optimistic UI?
  // For now, simple state.

  useEffect(() => {
    if (projectId) {
      fetchImages();
    }
  }, [projectId]);

  const fetchImages = async () => {
    try {
      const res = await fetch(`/api/project/${projectId}/mood-board`);
      if (res.ok) {
        const data = await res.json();
        setImages(data.moodBoards || []);
      }
    } catch (e) {
      console.error("Failed to fetch images", e);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement> | React.DragEvent,
  ) => {
    let files: FileList | null = null;
    if ((e as React.DragEvent).dataTransfer) {
      e.preventDefault();
      files = (e as React.DragEvent).dataTransfer.files;
    } else if ((e as React.ChangeEvent<HTMLInputElement>).target) {
      files = (e as React.ChangeEvent<HTMLInputElement>).target.files;
    }

    if (!files || files.length === 0) return;
    const file = files[0];

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/project/${projectId}/mood-board`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        await fetchImages();
      }
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {

    try {
      const res = await fetch(`/api/project/${projectId}/mood-board`, {
        method: "DELETE",
      });
      if (res.ok) {
        setImages([]);
      }
    } catch (error) {
      console.error("Failed to clear images", error);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Trigger the existing generate-ui endpoint which triggers the inngest function
      // which uses the mood board images we just uploaded.
      const res = await fetch(`/api/project/${projectId}/generate-ui`, {
        method: "POST",
      });

      if (res.ok) {
        // Maybe poll or just wait a bit?
        // Inngest is async, so it returns "Started".
        // Real UI generation might appear on canvas later.
        // We'll show a "Started" state for a few seconds.
        setTimeout(() => setIsGenerating(false), 2000);
      } else {
        setIsGenerating(false);
      }
    } catch (e) {
      console.error("Generation failed", e);
      setIsGenerating(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-1/2 -translate-y-1/2 left-5 p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-all z-50 shadow-lg cursor-pointer"
        title="Open Inspiration Board"
      >
        <LayoutPanelTop className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="absolute top-1/2 -translate-y-1/2 left-5 w-80 rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden z-50 flex flex-col transition-all duration-300 animate-in slide-in-from-left-10 fade-in">
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-medium text-white">Inspiration Board</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div
        className="m-4 mt-2 p-6 rounded-xl border border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-3 transition-colors hover:bg-white/10 hover:border-white/20"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileUpload}
      >
        <Upload className="w-6 h-6 text-zinc-500" />
        <div className="text-center">
          <p className="text-sm text-zinc-300 font-medium">
            Drop images here or{" "}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-400 hover:underline"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            {images.length}/6 images uploaded
          </p>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*"
        />
      </div>

      <div className="px-4 pb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Uploaded Images ({images.length})
        </h4>
        <button
          onClick={handleRemove}
          className="text-xs text-zinc-600 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer opacity-50"
        >
          <Trash2 className="w-3 h-3" /> Clear All
        </button>
      </div>

      <div className="p-4 pt-0 grid grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar">
        {images.map((img) => (
          <div
            key={img.id}
            className="aspect-square rounded-xl bg-zinc-900 border border-white/10 overflow-hidden relative group"
          >
            <img
              src={img.url}
              alt={img.filename}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"></div>
          </div>
        ))}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square rounded-xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
          ) : (
            <Plus className="w-5 h-5 text-zinc-500" />
          )}
        </button>
      </div>

      <div className="p-2"></div>
    </div>
  );
}
