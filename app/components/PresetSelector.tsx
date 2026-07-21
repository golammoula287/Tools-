"use client";

import { PresetDefinition } from "@/lib/presets";
import { PresetName } from "@/lib/types";

interface PresetSelectorProps {
  presets: Record<PresetName, PresetDefinition>;
  value: PresetName;
  onChange: (preset: PresetName) => void;
}

const ORDER: PresetName[] = ["coin", "general", "document", "custom"];

export default function PresetSelector({ presets, value, onChange }: PresetSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
        Dataset preset
      </p>
      <div className="grid grid-cols-2 gap-2">
        {ORDER.map((id) => {
          const preset = presets[id];
          const active = value === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                active
                  ? "border-fuchsia-300/50 bg-gradient-to-br from-fuchsia-500/25 to-violet-500/25 text-white shadow-[0_0_0_1px_rgba(232,121,249,0.15)]"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:border-white/20"
              }`}
            >
              <span className="block font-medium">{preset.label}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-white/50">{presets[value].description}</p>
    </div>
  );
}
