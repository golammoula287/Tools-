"use client";

import { useMemo, useState } from "react";
import UploadPanel from "./components/UploadPanel";
import PresetSelector from "./components/PresetSelector";
import ModeToggle from "./components/ModeToggle";
import FilterPanel from "./components/FilterPanel";
import OutputPanel from "./components/OutputPanel";
import ResultsGrid from "./components/ResultsGrid";
import { buildPresets } from "@/lib/presets";
import { OUTPUT_SIZE_MULTIPLIER, REQUEST_BYTE_BUDGET, RESPONSE_BYTE_BUDGET, buildBatches } from "@/lib/batching";
import { compressFilesToBudget } from "@/lib/client-image-prep";
import {
  AugmentMode,
  AugmentRequestConfig,
  FilterKey,
  FilterState,
  FiltersConfig,
  OutputConfig,
  PresetName,
  RenameConfig,
  ResultImage,
} from "@/lib/types";

export default function Home() {
  const presets = useMemo(() => buildPresets(), []);

  const [files, setFiles] = useState<File[]>([]);
  const [preset, setPreset] = useState<PresetName>("coin");
  const [mode, setMode] = useState<AugmentMode>("manual");
  const [variantsPerImage, setVariantsPerImage] = useState(presets.coin.variantsPerImage);
  const [filters, setFilters] = useState<FiltersConfig>(presets.coin.filters);

  const [output, setOutput] = useState<OutputConfig>({ format: "original", quality: 85 });
  const [rename, setRename] = useState<RenameConfig>({
    enabled: false,
    baseName: "dataset",
    startIndex: 1,
    padding: 3,
  });
  const [zipName, setZipName] = useState("augmented_dataset");

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [results, setResults] = useState<ResultImage[]>([]);

  const handlePresetChange = (id: PresetName) => {
    setPreset(id);
    setFilters(presets[id].filters);
    setVariantsPerImage(presets[id].variantsPerImage);
  };

  const handleFilterChange = (key: FilterKey, patch: Partial<FilterState>) => {
    setFilters((prev) => {
      const current = prev[key];
      if (!current) return prev;
      return { ...prev, [key]: { ...current, ...patch } };
    });
  };

  const handleAddFiles = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setError(null);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (files.length === 0) {
      setError("Select at least one image first.");
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);
    setProgress(null);

    // Vercel caps request/response bodies at 4.5MB, so large or numerous images are
    // split into multiple requests that each stay safely under that limit. Any single
    // image too big for its share of that budget is shrunk client-side first.
    const effectiveVariants = mode === "random" ? variantsPerImage : 1;
    const perFileCap =
      Math.min(REQUEST_BYTE_BUDGET, RESPONSE_BYTE_BUDGET / (effectiveVariants * OUTPUT_SIZE_MULTIPLIER)) * 0.85;

    setProgress("Optimizing large images for upload...");
    const { prepared, compressedCount } = await compressFilesToBudget(files, perFileCap);
    if (compressedCount > 0) {
      setNotice(
        `${compressedCount} large image(s) were auto-compressed before upload to fit within Vercel's request size limits.`
      );
    }

    const { batches, skipped } = buildBatches(prepared, effectiveVariants);

    if (batches.length === 0) {
      setLoading(false);
      setError(
        "Every selected file is too large to process — try smaller images or fewer variants per image."
      );
      return;
    }

    const allResults: ResultImage[] = [];
    const batchErrors: string[] = [];

    for (let i = 0; i < batches.length; i++) {
      if (batches.length > 1) {
        setProgress(`Processing batch ${i + 1} of ${batches.length}...`);
      }

      try {
        const config: AugmentRequestConfig = {
          mode,
          variantsPerImage,
          filters,
          output,
          rename: rename.enabled
            ? { ...rename, startIndex: rename.startIndex + allResults.length }
            : rename,
        };

        const formData = new FormData();
        batches[i].forEach((file) => formData.append("images", file));
        formData.append("config", JSON.stringify(config));

        const res = await fetch("/api/augment", { method: "POST", body: formData });
        const data = await res.json();

        if (!res.ok) {
          batchErrors.push(data.error || `Batch ${i + 1} failed.`);
          continue;
        }

        allResults.push(...(data.results || []));
      } catch {
        batchErrors.push(`Batch ${i + 1}: could not reach the server.`);
      }
    }

    if (skipped.length > 0) {
      batchErrors.unshift(
        `${skipped.length} file(s) skipped (too large for a single request): ${skipped
          .map((f) => f.name)
          .join(", ")}`
      );
    }

    setResults(allResults);
    setProgress(null);
    setLoading(false);
    if (batchErrors.length > 0) setError(batchErrors.join(" "));
  };

  const cardClass =
    "bg-white/[0.06] backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl border border-white/10";

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 w-[26rem] h-[26rem] rounded-full bg-fuchsia-600/25 blur-[110px]" />
        <div className="absolute top-1/3 -right-28 w-[26rem] h-[26rem] rounded-full bg-violet-600/25 blur-[110px]" />
        <div className="absolute bottom-0 left-1/4 w-[22rem] h-[22rem] rounded-full bg-cyan-500/10 blur-[110px]" />
      </div>

      <div className="relative max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-6 sm:mb-8 flex items-center justify-center lg:justify-start gap-3 text-center lg:text-left">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center shadow-lg shadow-fuchsia-900/30 flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 sm:w-6 sm:h-6">
              <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" fill="white" />
              <path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" fill="white" fillOpacity={0.9} />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Dataset Augmentation Studio
            </h1>
            <p className="text-xs sm:text-base text-white/55 mt-0.5">
              Generate realistic augmented variants for any image dataset — coins, objects,
              documents and more.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5 sm:gap-6">
          {/* Sidebar */}
          <aside className="space-y-4 sm:space-y-5 lg:sticky lg:top-6 lg:self-start">
            <section className={`${cardClass} space-y-4`}>
              <UploadPanel
                files={files}
                onAddFiles={handleAddFiles}
                onRemoveFile={handleRemoveFile}
                onClear={() => setFiles([])}
              />
            </section>

            <section className={`${cardClass} space-y-4`}>
              <PresetSelector presets={presets} value={preset} onChange={handlePresetChange} />
              <div className="h-px bg-white/10" />
              <ModeToggle
                mode={mode}
                onModeChange={setMode}
                variantsPerImage={variantsPerImage}
                onVariantsChange={setVariantsPerImage}
              />
            </section>

            <section className={cardClass}>
              <OutputPanel
                output={output}
                onOutputChange={(patch) => setOutput((prev) => ({ ...prev, ...patch }))}
                rename={rename}
                onRenameChange={(patch) => setRename((prev) => ({ ...prev, ...patch }))}
                zipName={zipName}
                onZipNameChange={setZipName}
              />
            </section>

            {notice && (
              <div className="rounded-xl bg-cyan-400/10 border border-cyan-300/25 px-4 py-3 text-sm text-cyan-100">
                {notice}
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-500/15 border border-red-400/30 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-white text-violet-700 font-semibold shadow-lg shadow-fuchsia-900/20 hover:bg-white/90 active:scale-[0.99] transition disabled:opacity-60 disabled:active:scale-100"
            >
              {loading
                ? "Processing..."
                : `Generate ${mode === "random" ? "augmented variants" : "images"}`}
            </button>
            {loading && progress && (
              <p className="text-center text-xs text-white/60 -mt-2">{progress}</p>
            )}
          </aside>

          {/* Main content */}
          <main className="space-y-5 sm:space-y-6 min-w-0">
            <section className={cardClass}>
              <h2 className="text-lg font-semibold mb-3">Filters</h2>
              <FilterPanel filters={filters} mode={mode} onChange={handleFilterChange} />
            </section>

            {results.length > 0 && (
              <section className={cardClass}>
                <h2 className="text-lg font-semibold mb-3">Results</h2>
                <ResultsGrid
                  results={results}
                  zipName={zipName}
                  onReset={() => setResults([])}
                />
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
