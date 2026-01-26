"use client";

import { motion } from "framer-motion";

interface TypographyStyle {
  name: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  description?: string;
}

interface TypographyPreviewProps {
  typography: TypographyStyle[];
}

export function TypographyPreview({ typography }: TypographyPreviewProps) {
  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      {typography.map((style, index) => (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          key={index}
          className="group border-b border-white/10 pb-8 last:border-0"
        >
          <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-12 mb-4">
            <div className="w-48 flex-shrink-0">
              <h3 className="text-sm font-medium text-zinc-400 mb-1">
                {style.name}
              </h3>
              <div className="flex flex-wrap gap-2 text-xs text-zinc-600 font-mono">
                <span>{style.fontFamily}</span>
                <span>•</span>
                <span>{style.fontWeight}</span>
                <span>•</span>
                <span>{style.fontSize}</span>
              </div>
            </div>

            <div className="flex-1">
              <p
                style={{
                  fontFamily: style.fontFamily,
                  fontSize: style.fontSize, // Ensure units are present (e.g. '24px')
                  fontWeight: style.fontWeight,
                  lineHeight: style.lineHeight,
                  color: "#FFFFFF",
                }}
              >
                The quick brown fox jumps over the lazy dog
              </p>
            </div>
          </div>

          {style.description && (
            <p className="text-xs text-zinc-600 pl-0 md:pl-60">
              {style.description}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}
