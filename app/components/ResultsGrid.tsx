"use client";

import { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { ResultImage } from "@/lib/types";

interface ResultsGridProps {
  results: ResultImage[];
  zipName: string;
  onReset: () => void;
}

function dataUrl(result: ResultImage): string {
  return `data:${result.mimeType};base64,${result.dataBase64}`;
}

function downloadSingle(result: ResultImage) {
  const a = document.createElement("a");
  a.href = dataUrl(result);
  a.download = result.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function ResultsGrid({ results, zipName, onReset }: ResultsGridProps) {
  const [zipping, setZipping] = useState(false);

  if (results.length === 0) return null;

  const handleDownloadAll = async () => {
    if (results.length === 1) {
      downloadSingle(results[0]);
      return;
    }

    setZipping(true);
    try {
      const zip = new JSZip();
      const usedNames = new Set<string>();

      for (const result of results) {
        let name = result.name;
        if (usedNames.has(name)) {
          const dot = name.lastIndexOf(".");
          const stem = dot > 0 ? name.slice(0, dot) : name;
          const ext = dot > 0 ? name.slice(dot) : "";
          let n = 2;
          while (usedNames.has(`${stem}_dup${n}${ext}`)) n++;
          name = `${stem}_dup${n}${ext}`;
        }
        usedNames.add(name);
        zip.file(name, result.dataBase64, { base64: true });
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const fileName = (zipName || "augmented_dataset").replace(/\.zip$/i, "");
      saveAs(blob, `${fileName}.zip`);
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-white/70">
          {results.length} output{results.length !== 1 ? "s" : ""} generated
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-medium transition-colors"
          >
            Clear results
          </button>
          <button
            type="button"
            onClick={handleDownloadAll}
            disabled={zipping}
            className="px-4 py-2 rounded-xl bg-white text-purple-700 hover:bg-white/90 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {zipping
              ? "Zipping..."
              : results.length === 1
              ? "Download image"
              : "Download all (.zip)"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {results.map((result, i) => (
          <div
            key={`${result.name}-${i}`}
            className="rounded-xl bg-black/20 overflow-hidden flex flex-col"
          >
            <div className="aspect-square bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dataUrl(result)}
                alt={result.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-2 flex flex-col gap-1.5">
              <p className="text-[11px] text-white/60 truncate" title={result.name}>
                {result.name}
              </p>
              <button
                type="button"
                onClick={() => downloadSingle(result)}
                className="w-full py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors"
              >
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
