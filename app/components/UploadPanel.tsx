"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface UploadPanelProps {
  files: File[];
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onClear: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPanel({ files, onAddFiles, onRemoveFile, onClear }: UploadPanelProps) {
  const [dragActive, setDragActive] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  useEffect(() => {
    return () => {
      previews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previews]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (dropped.length) onAddFiles(dropped);
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-5 sm:p-6 text-center transition-colors ${
          dragActive
            ? "border-pink-400 bg-pink-400/10"
            : "border-white/25 hover:border-white/40 hover:bg-white/5"
        }`}
      >
        <p className="text-sm sm:text-base text-white/80 mb-3">
          Drag &amp; drop images here, or choose below
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
          <input
            ref={imageInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => {
              if (e.target.files) onAddFiles(Array.from(e.target.files));
              e.target.value = "";
            }}
            className="hidden"
            id="imageUpload"
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 text-sm font-medium transition-colors"
          >
            Select image(s)
          </button>

          <input
            ref={folderInputRef}
            type="file"
            multiple
            accept="image/*"
            {...({ webkitdirectory: "true", directory: "true" } as Record<string, string>)}
            onChange={(e) => {
              if (e.target.files) onAddFiles(Array.from(e.target.files));
              e.target.value = "";
            }}
            className="hidden"
            id="folderUpload"
          />
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 text-sm font-medium transition-colors"
          >
            Select whole folder
          </button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="rounded-xl bg-black/20 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white/70">
              {files.length} image{files.length !== 1 ? "s" : ""} selected · {formatBytes(totalSize)}
            </p>
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-white/60 hover:text-pink-300 underline"
            >
              Clear all
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-black/30 group"
                title={file.name}
              >
                {previews[i] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previews[i]}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => onRemoveFile(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white text-xs leading-5 opacity-80 group-hover:opacity-100"
                  aria-label={`Remove ${file.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
