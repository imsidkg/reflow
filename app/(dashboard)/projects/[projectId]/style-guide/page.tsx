"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchMoodBoardImages,
  uploadMoodBoardImage,
  deleteMoodBoardImage,
  clearError,
} from "@/redux/slices/mood-board";
import {
  Upload,
  Palette as PaletteIcon,
  Type,
  Image as ImageIcon,
  X,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useStyleGuide } from "@/hooks/use-style-guide";
import { ColorPalette } from "@/components/style-guide/color-palette";
import { TypographyPreview } from "@/components/style-guide/typography-preview";

export default function StyleGuidePage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const dispatch = useAppDispatch();
  const {
    images,
    isLoading: isImagesLoading,
    isUploading,
    error,
  } = useAppSelector((state) => state.moodBoard);

  // Custom hook for AI generation
  const {
    styleGuide,
    isGenerating,
    fetching: isStyleLoading,
    fetchStyleGuide,
    generateStyleGuide,
  } = useStyleGuide({ projectId });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "colours" | "typography" | "moodboard"
  >("colours");
  const [slideIndex, setSlideIndex] = useState(0);

  // Fetch initial data
  useEffect(() => {
    if (projectId) {
      dispatch(fetchMoodBoardImages(projectId));
      fetchStyleGuide();
    }
  }, [projectId, dispatch, fetchStyleGuide]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    try {
      await dispatch(uploadMoodBoardImage({ projectId, file })).unwrap();
      toast.success("Image uploaded successfully!");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      toast.error(err || "Failed to upload image");
    }
  };

  const handleDelete = async (imageId: string) => {
    try {
      await dispatch(deleteMoodBoardImage({ projectId, imageId })).unwrap();
      toast.success("Image deleted successfully!");
    } catch (err: any) {
      toast.error(err || "Failed to delete image");
    }
  };

  return (
    <div className="fixed inset-0 pt-20 overflow-hidden bg-zinc-950">
      <div className="w-full h-full flex flex-col px-8 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-1">
              Style Guide
            </h1>
            <p className="text-sm text-zinc-500">
              Manage your style guide for your project
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-white/[0.12] bg-white/[0.08] p-1 backdrop-blur-xl">
            <button
              onClick={() => setActiveTab("colours")}
              className={[
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                activeTab === "colours"
                  ? "bg-white/[0.15] text-white"
                  : "text-zinc-400 hover:text-zinc-200",
              ].join(" ")}
            >
              <span>#</span>
              Colours
            </button>
            <button
              onClick={() => setActiveTab("typography")}
              className={[
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                activeTab === "typography"
                  ? "bg-white/[0.15] text-white"
                  : "text-zinc-400 hover:text-zinc-200",
              ].join(" ")}
            >
              <Type className="h-4 w-4" />
              Typography
            </button>
            <button
              onClick={() => setActiveTab("moodboard")}
              className={[
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                activeTab === "moodboard"
                  ? "bg-white/[0.15] text-white"
                  : "text-zinc-400 hover:text-zinc-200",
              ].join(" ")}
            >
              <ImageIcon className="h-4 w-4" />
              Moodboard
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {activeTab === "colours" && (
            <div className="h-full">
              {isStyleLoading || isGenerating ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 blur-xl bg-purple-500/20 rounded-full" />
                    <Loader2 className="h-8 w-8 text-purple-400 animate-spin relative z-10" />
                  </div>
                  <p className="text-zinc-400 animate-pulse">
                    {isGenerating
                      ? "AI is analyzing your mood board..."
                      : "Loading style guide..."}
                  </p>
                </div>
              ) : styleGuide?.colors && styleGuide.colors.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between px-6 mb-4">
                    <h2 className="text-xl font-medium text-white">
                      {styleGuide.themeName || "Generated Palette"}
                    </h2>
                    {styleGuide.themeDesc && (
                      <p className="text-sm text-zinc-500 italic">
                        "{styleGuide.themeDesc}"
                      </p>
                    )}
                  </div>
                  <ColorPalette colors={styleGuide.colors} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <PaletteIcon className="h-8 w-8 text-zinc-600" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      No colors generated yet
                    </h3>
                    <p className="text-sm text-zinc-500 max-w-md mb-6">
                      Upload images to your mood board and generate an
                      AI-powered
                      <br />
                      style guide with colors and typography.
                    </p>
                    <button
                      onClick={() => setActiveTab("moodboard")}
                      className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
                    >
                      Go to Moodboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "typography" && (
            <div className="h-full">
              {isStyleLoading || isGenerating ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 blur-xl bg-blue-500/20 rounded-full" />
                    <Loader2 className="h-8 w-8 text-blue-400 animate-spin relative z-10" />
                  </div>
                  <p className="text-zinc-400 animate-pulse">
                    {isGenerating
                      ? "AI is selecting fonts..."
                      : "Loading typography..."}
                  </p>
                </div>
              ) : styleGuide?.typography && styleGuide.typography.length > 0 ? (
                <TypographyPreview typography={styleGuide.typography} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <Type className="h-8 w-8 text-zinc-600" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      No typography set yet
                    </h3>
                    <p className="text-sm text-zinc-500 max-w-md mb-6">
                      Upload images to your mood board and generate an
                      AI-powered
                      <br />
                      style guide with colors and typography.
                    </p>
                    <button
                      onClick={() => setActiveTab("moodboard")}
                      className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
                    >
                      Go to Moodboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "moodboard" && (
            <div className="flex items-center justify-center h-full">
              {isImagesLoading ? (
                <div className="flex items-center gap-3 text-zinc-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Loading images...</span>
                </div>
              ) : images.length === 0 ? (
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-zinc-600" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    No images uploaded yet
                  </h3>
                  <p className="text-sm text-zinc-500 mb-6 max-w-md">
                    Upload images to your mood board and generate an AI-powered
                    <br />
                    style guide with colors and typography.
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium border border-white/20 transition-all disabled:opacity-50"
                  >
                    {isUploading ? "Uploading..." : "Upload Images"}
                  </button>
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="flex flex-col items-end">
                    <div className="relative flex items-center gap-6">
                      <button
                        onClick={() => setSlideIndex(slideIndex - 1)}
                        disabled={slideIndex === 0}
                        className={`p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all ${
                          slideIndex === 0
                            ? "opacity-0 pointer-events-none"
                            : "opacity-100"
                        }`}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>

                      <div
                        className="overflow-hidden"
                        style={{ width: "864px" }}
                      >
                        <div
                          className="flex items-center gap-8 transition-transform duration-500 ease-out"
                          style={{
                            transform: `translateX(${-slideIndex * 288}px)`,
                          }}
                        >
                          {images.map((image, index) => {
                            const isVisible =
                              index >= slideIndex && index < slideIndex + 3;
                            const relativeIndex = index - slideIndex;
                            return (
                              <div
                                key={image.id}
                                className="group relative flex-shrink-0 transition-all duration-500"
                                style={{
                                  transform: isVisible
                                    ? `perspective(1000px) rotateY(${
                                        relativeIndex === 0
                                          ? "15deg"
                                          : relativeIndex === 2
                                            ? "-15deg"
                                            : "0deg"
                                      })`
                                    : "perspective(1000px) rotateY(0deg)",
                                  zIndex: relativeIndex === 1 ? 10 : 1,
                                }}
                              >
                                <div className="relative w-64 h-64 rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-transform hover:scale-105">
                                  <img
                                    src={image.url}
                                    alt={image.filename}
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => setPreviewImage(image.url)}
                                  />
                                  <button
                                    onClick={() => handleDelete(image.id)}
                                    className="absolute top-2 right-2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        onClick={() => setSlideIndex(slideIndex + 1)}
                        disabled={slideIndex + 3 >= images.length}
                        className={`p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all ${
                          slideIndex + 3 >= images.length
                            ? "opacity-0 pointer-events-none"
                            : "opacity-100"
                        }`}
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || isGenerating}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-sans font-medium border border-white/20 transition-all disabled:opacity-50 backdrop-blur-sm whitespace-nowrap"
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        Add More
                      </button>
                      <button
                        onClick={() =>
                          generateStyleGuide(() => setActiveTab("colours"))
                        }
                        disabled={images.length === 0 || isGenerating}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-white hover:bg-zinc-100 text-zinc-900 text-sm font-sans font-medium transition-all disabled:opacity-50 whitespace-nowrap"
                      >
                        {isGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        {isGenerating ? "Generating..." : "Generate with AI"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {previewImage && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                  onClick={() => setPreviewImage(null)}
                >
                  <button
                    onClick={() => setPreviewImage(null)}
                    className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
