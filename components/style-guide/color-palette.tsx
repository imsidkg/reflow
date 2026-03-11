"use client";

import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ColorSwatch {
  name: string;
  hexColor: string;
  description?: string;
}

interface ColorPaletteProps {
  colors: ColorSwatch[];
}

export function ColorPalette({ colors }: ColorPaletteProps) {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    toast.success(`Copied ${hex} to clipboard`);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8 p-6">
      {colors.map((color, index) => (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          key={index}
          className="group flex items-start gap-4"
        >
          <div
            className="h-14 w-14 rounded-2xl shadow-sm border border-white/5 shrink-0 group-hover:scale-110 transition-transform duration-300"
            style={{ backgroundColor: color.hexColor }}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-white truncate">
                {color.name}
              </h3>
            </div>

            <div className="flex items-center gap-2 mb-1.5">
              <p className="font-mono text-xs text-zinc-400 uppercase tracking-wide">
                {color.hexColor}
              </p>
              <button
                onClick={() => copyToClipboard(color.hexColor)}
                className="opacity-0 group-hover:opacity-100 p-1 -my-1 rounded-md hover:bg-white/10 text-zinc-500 hover:text-white transition-all scale-90"
                title="Copy Hex"
              >
                {copiedColor === color.hexColor ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>

            {color.description && (
              <p className="text-xs text-zinc-500 leading-relaxed">
                {color.description}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
