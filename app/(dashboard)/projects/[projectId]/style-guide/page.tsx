"use client";

import { useState } from "react";
import { Upload, Palette, Type, Image as ImageIcon } from "lucide-react";

export default function StyleGuidePage() {
  const [activeTab, setActiveTab] = useState<
    "colours" | "typography" | "moodboard"
  >("colours");

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
                <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium border border-white/20 transition-all">
                  Upload Images
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
