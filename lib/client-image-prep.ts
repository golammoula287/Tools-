"use client";

// Shrinks an image in the browser (before upload) so it fits Vercel's 4.5MB
// request/response body limit even when generating several augmented variants.
// Only runs on files that actually exceed the target — small files pass through untouched.
export async function compressImageToTarget(file: File, targetBytes: number): Promise<File> {
  if (file.size <= targetBytes || typeof createImageBitmap === "undefined") {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // unsupported/corrupt image — let the server report the real error
  }

  let width = bitmap.width;
  let height = bitmap.height;
  const maxDim = 2000;
  if (Math.max(width, height) > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }

  let quality = 0.85;
  let blob: Blob | null = null;

  for (let attempt = 0; attempt < 7; attempt++) {
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
    );

    if (!blob || blob.size <= targetBytes) break;

    if (quality > 0.5) {
      quality -= 0.15;
    } else {
      width = Math.round(width * 0.8);
      height = Math.round(height * 0.8);
    }
  }

  bitmap.close();

  if (!blob) return file;

  const newName = file.name.replace(/\.[^./]+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg", lastModified: file.lastModified });
}

export async function compressFilesToBudget(
  files: File[],
  targetBytes: number
): Promise<{ prepared: File[]; compressedCount: number }> {
  let compressedCount = 0;

  const prepared = await Promise.all(
    files.map(async (file) => {
      if (file.size <= targetBytes) return file;
      const result = await compressImageToTarget(file, targetBytes);
      if (result !== file) compressedCount++;
      return result;
    })
  );

  return { prepared, compressedCount };
}
