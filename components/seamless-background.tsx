"use client";

import React from "react";

export function SeamlessBackground() {
  // Render enough tiles to cover even large screens (e.g., 24 * 600px = 14,400px width)
  const tiles = Array.from({ length: 24 });

  return (
    <div className="absolute inset-0 flex overflow-hidden opacity-50 pointer-events-none select-none">
      {tiles.map((_, i) => (
        <div
          key={i}
          className={`h-full w-[600px] shrink-0 bg-[url('/lounge-bar.jpeg')] bg-cover bg-center ${
            i % 2 === 1 ? "-scale-x-100" : ""
          }`}
        />
      ))}
    </div>
  );
}
