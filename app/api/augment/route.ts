import { NextResponse } from "next/server";
import { applyFilters, resolveVariantValues } from "@/lib/augment-engine";
import { AugmentRequestConfig, ResultImage } from "@/lib/types";

export const runtime = "nodejs";
// Give large-folder batches (chunked client-side into many requests) headroom to finish
// well within Vercel's function duration ceiling instead of the 10s default.
export const maxDuration = 60;

// The client already splits a whole dataset (into the GBs) into many small requests that
// each stay under Vercel's 4.5MB body limit, so this is just a generous per-request safety net.
const MAX_FILES = 5000;
const MAX_FILE_BYTES = 30 * 1024 * 1024; // 30MB per file
const MAX_VARIANTS = 20;

function sanitizeBaseName(name: string): string {
  const cleaned = name.trim().replace(/[^a-zA-Z0-9_-]+/g, "_");
  return cleaned || "image";
}

function stripExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx > 0 ? name.slice(0, idx) : name;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const rawFiles = formData.getAll("images");
    const files: File[] = rawFiles.filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "No images were provided." }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Too many files. Please upload ${MAX_FILES} or fewer at a time.` },
        { status: 400 }
      );
    }
    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: `"${file.name}" is larger than the 30MB per-file limit.` },
          { status: 400 }
        );
      }
    }

    const configRaw = formData.get("config");
    if (typeof configRaw !== "string") {
      return NextResponse.json({ error: "Missing augmentation config." }, { status: 400 });
    }

    let config: AugmentRequestConfig;
    try {
      config = JSON.parse(configRaw);
    } catch {
      return NextResponse.json({ error: "Invalid augmentation config." }, { status: 400 });
    }

    const mode = config.mode === "random" ? "random" : "manual";
    const variantsPerImage =
      mode === "random"
        ? Math.min(MAX_VARIANTS, Math.max(1, Math.round(config.variantsPerImage || 1)))
        : 1;

    const rename = config.rename || {
      enabled: false,
      baseName: "image",
      startIndex: 1,
      padding: 3,
    };
    const baseName = sanitizeBaseName(rename.baseName || "image");
    const padding = Math.min(6, Math.max(1, Math.round(rename.padding ?? 3)));
    let counter = Math.max(0, Math.round(rename.startIndex ?? 1));

    const output = config.output || { format: "original", quality: 85 };

    const results: ResultImage[] = [];

    for (const file of files) {
      const inputBuffer = Buffer.from(await file.arrayBuffer());
      const originalStem = stripExtension(file.name);

      for (let variantIndex = 0; variantIndex < variantsPerImage; variantIndex++) {
        const resolved = resolveVariantValues(config.filters || {}, mode);

        let processed;
        try {
          processed = await applyFilters(inputBuffer, resolved, output);
        } catch (err) {
          console.error(`Failed to process ${file.name}:`, err);
          continue;
        }

        let outName: string;
        if (rename.enabled) {
          const padded = String(counter).padStart(padding, "0");
          outName = `${baseName}_${padded}.${processed.extension}`;
          counter++;
        } else {
          const suffix = variantsPerImage > 1 ? `_aug${variantIndex + 1}` : "";
          outName = `${sanitizeBaseName(originalStem)}${suffix}.${processed.extension}`;
        }

        results.push({
          name: outName,
          mimeType: processed.mimeType,
          dataBase64: processed.buffer.toString("base64"),
          originalName: file.name,
          variantIndex,
        });
      }
    }

    if (results.length === 0) {
      return NextResponse.json(
        { error: "None of the images could be processed." },
        { status: 500 }
      );
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Image augmentation failed." }, { status: 500 });
  }
}
