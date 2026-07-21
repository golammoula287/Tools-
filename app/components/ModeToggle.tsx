"use client";

import { AugmentMode } from "@/lib/types";

interface ModeToggleProps {
  mode: AugmentMode;
  onModeChange: (mode: AugmentMode) => void;
  variantsPerImage: number;
  onVariantsChange: (n: number) => void;
}

export default function ModeToggle({
  mode,
  onModeChange,
  variantsPerImage,
  onVariantsChange,
}: ModeToggleProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
        Augmentation mode
      </p>
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/20">
        <button
          type="button"
          onClick={() => onModeChange("manual")}
          className={`py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "manual" ? "bg-white text-purple-700" : "text-white/70 hover:text-white"
          }`}
        >
          Manual
        </button>
        <button
          type="button"
          onClick={() => onModeChange("random")}
          className={`py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "random" ? "bg-white text-purple-700" : "text-white/70 hover:text-white"
          }`}
        >
          Random Augment
        </button>
      </div>

      {mode === "manual" ? (
        <p className="text-xs text-white/50">
          Each image gets exactly one output using the exact values you set below.
        </p>
      ) : (
        <div className="flex items-center justify-between gap-3 pt-1">
          <label htmlFor="variantsPerImage" className="text-sm text-white/70">
            Variants per image
          </label>
          <input
            id="variantsPerImage"
            type="number"
            min={1}
            max={20}
            value={variantsPerImage}
            onChange={(e) => onVariantsChange(Number(e.target.value))}
            className="w-20 p-2 rounded-lg text-black text-sm text-center"
          />
        </div>
      )}
    </div>
  );
}
