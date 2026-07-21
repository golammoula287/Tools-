// Vercel Serverless Functions cap both request and response bodies at 4.5MB.
// We stay well under that per request so any dataset size works across multiple calls.
export const REQUEST_BYTE_BUDGET = 3.5 * 1024 * 1024;
export const RESPONSE_BYTE_BUDGET = 3.5 * 1024 * 1024;
// Base64 adds ~33% overhead, and re-encoding (e.g. to PNG) can grow the file further.
export const OUTPUT_SIZE_MULTIPLIER = 1.6;

export interface BatchPlan {
  batches: File[][];
  skipped: File[];
}

export function buildBatches(files: File[], variantsPerImage: number): BatchPlan {
  const batches: File[][] = [];
  const skipped: File[] = [];

  let current: File[] = [];
  let currentInputBytes = 0;
  let currentEstResponseBytes = 0;

  for (const file of files) {
    const estResponse = file.size * variantsPerImage * OUTPUT_SIZE_MULTIPLIER;

    if (file.size > REQUEST_BYTE_BUDGET || estResponse > RESPONSE_BYTE_BUDGET) {
      skipped.push(file);
      continue;
    }

    const wouldExceed =
      currentInputBytes + file.size > REQUEST_BYTE_BUDGET ||
      currentEstResponseBytes + estResponse > RESPONSE_BYTE_BUDGET;

    if (current.length > 0 && wouldExceed) {
      batches.push(current);
      current = [];
      currentInputBytes = 0;
      currentEstResponseBytes = 0;
    }

    current.push(file);
    currentInputBytes += file.size;
    currentEstResponseBytes += estResponse;
  }

  if (current.length > 0) batches.push(current);

  return { batches, skipped };
}
