"use client";

import { OutputConfig, OutputFormat, RenameConfig } from "@/lib/types";

interface OutputPanelProps {
  output: OutputConfig;
  onOutputChange: (patch: Partial<OutputConfig>) => void;
  rename: RenameConfig;
  onRenameChange: (patch: Partial<RenameConfig>) => void;
  zipName: string;
  onZipNameChange: (name: string) => void;
}

const FORMATS: { id: OutputFormat; label: string }[] = [
  { id: "original", label: "Keep original format" },
  { id: "png", label: "PNG" },
  { id: "jpeg", label: "JPEG" },
  { id: "webp", label: "WEBP" },
  { id: "tiff", label: "TIFF" },
];

const EXT_FALLBACK: Record<OutputFormat, string> = {
  original: "jpg",
  png: "png",
  jpeg: "jpg",
  webp: "webp",
  tiff: "tiff",
};

export default function OutputPanel({
  output,
  onOutputChange,
  rename,
  onRenameChange,
  zipName,
  onZipNameChange,
}: OutputPanelProps) {
  const ext = EXT_FALLBACK[output.format];
  const previewName = rename.enabled
    ? `${rename.baseName || "image"}_${String(rename.startIndex ?? 1).padStart(
        Math.min(6, Math.max(1, rename.padding || 3)),
        "0"
      )}.${ext}`
    : `original-name.${ext}`;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
          Output format
        </p>
        <select
          value={output.format}
          onChange={(e) => onOutputChange({ format: e.target.value as OutputFormat })}
          className="w-full p-2.5 rounded-xl bg-white text-slate-900 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
        >
          {FORMATS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>

        {(output.format === "jpeg" || output.format === "webp") && (
          <div className="flex items-center gap-3 pt-1">
            <label className="text-sm text-white/70 flex-shrink-0">Quality</label>
            <input
              type="range"
              min={10}
              max={100}
              value={output.quality}
              onChange={(e) => onOutputChange({ quality: Number(e.target.value) })}
              className="w-full accent-fuchsia-400"
            />
            <span className="text-xs text-white/60 w-10 text-right">{output.quality}%</span>
          </div>
        )}
      </div>

      <div className="space-y-2 rounded-xl bg-black/25 border border-white/10 p-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rename.enabled}
            onChange={(e) => onRenameChange({ enabled: e.target.checked })}
            className="accent-fuchsia-400 w-4 h-4"
          />
          <span className="text-sm font-medium">
            Rename files (serial numbering)
          </span>
        </label>
        <p className="text-xs text-white/45">
          Off keeps each file&apos;s original name (with a suffix if multiple variants are made).
        </p>

        {rename.enabled && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="col-span-2">
              <label className="text-xs text-white/60">Base name</label>
              <input
                type="text"
                value={rename.baseName}
                onChange={(e) => onRenameChange({ baseName: e.target.value })}
                placeholder="e.g. coin"
                className="w-full mt-1 p-2 rounded-lg bg-white text-slate-900 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
              />
            </div>
            <div>
              <label className="text-xs text-white/60">Start number</label>
              <input
                type="number"
                min={0}
                value={rename.startIndex}
                onChange={(e) => onRenameChange({ startIndex: Number(e.target.value) })}
                className="w-full mt-1 p-2 rounded-lg bg-white text-slate-900 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
              />
            </div>
            <div>
              <label className="text-xs text-white/60">Digits (padding)</label>
              <input
                type="number"
                min={1}
                max={6}
                value={rename.padding}
                onChange={(e) => onRenameChange({ padding: Number(e.target.value) })}
                className="w-full mt-1 p-2 rounded-lg bg-white text-slate-900 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
              />
            </div>
          </div>
        )}

        <p className="text-xs text-white/50 pt-1 break-all">
          Preview: <span className="font-mono text-white/80">{previewName}</span>
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
          ZIP / download folder name
        </label>
        <input
          type="text"
          value={zipName}
          onChange={(e) => onZipNameChange(e.target.value)}
          placeholder="augmented_dataset"
          className="w-full p-2.5 rounded-xl bg-white text-slate-900 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
        />
      </div>
    </div>
  );
}
