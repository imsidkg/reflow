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
  Palette,
  Type,
  Image as ImageIcon,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function StyleGuidePage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const dispatch = useAppDispatch();
  const { images, isLoading, isUploading, error } = useAppSelector(
    (state) => state.moodBoard
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "colours" | "typography" | "moodboard"
  >("colours");

  useEffect(() => {
    if (projectId) {
      dispatch(fetchMoodBoardImages(projectId));
    }
  }, [projectId, dispatch]);

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
        {/* Header with title on left, tabs on right */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-1">
              Style Guide
            </h1>
            <p className="text-sm text-zinc-500">
              Manage your style guide for your project
            </p>
          </div>

          {/* Tabs styled like the uploaded image */}
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
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Palette className="h-8 w-8 text-zinc-600" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  No colors generated yet
                </h3>
                <p className="text-sm text-zinc-500 max-w-md">
                  Upload images to your mood board and generate an AI-powered
                  <br />
                  style guide with colors and typography.
                </p>
              </div>
            </div>
          )}

          {activeTab === "typography" && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Type className="h-8 w-8 text-zinc-600" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  No typography set yet
                </h3>
                <p className="text-sm text-zinc-500 max-w-md">
                  Upload images to your mood board and generate an AI-powered
                  <br />
                  style guide with colors and typography.
                </p>
              </div>
            </div>
          )}

          {activeTab === "moodboard" && (
            <div className="flex items-center justify-center h-full">
              {isLoading ? (
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
                  <div className="flex items-center justify-center gap-8">
                    {images.slice(0, 3).map((image, index) => (
                      <div
                        key={image.id}
                        className="group relative"
                        style={{
                          transform: `perspective(1000px) rotateY(${
                            index === 0
                              ? "15deg"
                              : index === 2
                              ? "-15deg"
                              : "0deg"
                          })`,
                          zIndex: index === 1 ? 10 : 1,
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
                    ))}
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium border border-white/20 transition-all disabled:opacity-50 backdrop-blur-sm"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Add More
                      </>
                    )}
                  </button>
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
