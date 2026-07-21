import sharp from "sharp";
import { FILTER_MAP, clampFilterState } from "./filters";
import {
  AugmentMode,
  FilterKey,
  FilterState,
  FiltersConfig,
  OutputConfig,
  OutputFormat,
} from "./types";

export type ResolvedValues = Partial<Record<FilterKey, number>>;

const WHITE_BG = { r: 255, g: 255, b: 255, alpha: 1 };

function randBetween(min: number, max: number): number {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return lo + Math.random() * (hi - lo);
}

/** Turn each enabled filter's manual value / random range / chance into one concrete value for this variant. */
export function resolveVariantValues(
  filters: FiltersConfig,
  mode: AugmentMode
): ResolvedValues {
  const resolved: ResolvedValues = {};

  for (const key of Object.keys(filters) as FilterKey[]) {
    const meta = FILTER_MAP[key];
    const raw = filters[key];
    if (!meta || !raw) continue;

    const state = clampFilterState(meta, raw as FilterState);
    if (!state.enabled) continue;

    if (meta.kind === "boolean") {
      if (mode === "manual") {
        if (state.value) resolved[key] = 1;
      } else if (Math.random() * 100 < state.chance) {
        resolved[key] = 1;
      }
      continue;
    }

    resolved[key] = mode === "manual" ? state.value : randBetween(state.min, state.max);
  }

  return resolved;
}

function addGaussianNoise(data: Buffer, intensity: number): Buffer {
  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i++) {
    const delta = (Math.random() - 0.5) * 2 * intensity;
    out[i] = Math.min(255, Math.max(0, Math.round(out[i] + delta)));
  }
  return out;
}

function addSaltPepperNoise(data: Buffer, channels: number, densityPercent: number): Buffer {
  const out = Buffer.from(data);
  const pixelCount = Math.floor(out.length / channels);
  const affected = Math.floor(pixelCount * (densityPercent / 100));

  for (let i = 0; i < affected; i++) {
    const pixelIndex = Math.floor(Math.random() * pixelCount);
    const value = Math.random() < 0.5 ? 255 : 0;
    const colorChannels = channels === 4 ? 3 : channels; // preserve alpha if present
    for (let c = 0; c < colorChannels; c++) {
      out[pixelIndex * channels + c] = value;
    }
  }
  return out;
}

function vignetteSvg(width: number, height: number, strengthPercent: number): Buffer {
  const opacity = Math.min(1, Math.max(0, strengthPercent / 100));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <radialGradient id="v" cx="50%" cy="50%" r="72%">
        <stop offset="40%" stop-color="#ffffff" stop-opacity="0" />
        <stop offset="100%" stop-color="#000000" stop-opacity="${opacity}" />
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#v)" />
  </svg>`;
  return Buffer.from(svg);
}

function glareSvg(width: number, height: number, strengthPercent: number): Buffer {
  const opacity = Math.min(1, Math.max(0, strengthPercent / 100));
  const cx = 20 + Math.random() * 60;
  const cy = 20 + Math.random() * 60;
  const r = 25 + Math.random() * 25;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <radialGradient id="g" cx="${cx}%" cy="${cy}%" r="${r}%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="${opacity}" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)" />
  </svg>`;
  return Buffer.from(svg);
}

export function extensionForFormat(format: OutputFormat, fallback: string): string {
  switch (format) {
    case "png":
      return "png";
    case "jpeg":
      return "jpg";
    case "webp":
      return "webp";
    case "tiff":
      return "tiff";
    default:
      return fallback || "png";
  }
}

export function mimeTypeForFormat(format: OutputFormat, fallback: string): string {
  switch (format) {
    case "png":
      return "image/png";
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "tiff":
      return "image/tiff";
    default:
      return fallback || "image/png";
  }
}

export async function applyFilters(
  inputBuffer: Buffer,
  resolved: ResolvedValues,
  output: OutputConfig
): Promise<{ buffer: Buffer; extension: string; mimeType: string }> {
  const meta = await sharp(inputBuffer).metadata();
  const originalWidth = meta.width || 0;
  const originalHeight = meta.height || 0;
  const originalFormat = meta.format || "png";

  let image = sharp(inputBuffer, { failOn: "none" });

  // --- Geometric ---
  if (resolved.zoom && originalWidth && originalHeight) {
    const cropFraction = Math.min(0.9, Math.max(0, resolved.zoom / 100));
    const cropW = Math.max(1, Math.round(originalWidth * (1 - cropFraction)));
    const cropH = Math.max(1, Math.round(originalHeight * (1 - cropFraction)));
    const left = Math.floor((originalWidth - cropW) / 2);
    const top = Math.floor((originalHeight - cropH) / 2);
    image = image
      .extract({ left, top, width: cropW, height: cropH })
      .resize(originalWidth, originalHeight);
  }

  if (resolved.rotate) {
    image = image.rotate(resolved.rotate, { background: WHITE_BG });
  }

  if (resolved.shear) {
    const rad = (resolved.shear * Math.PI) / 180;
    image = image.affine([1, Math.tan(rad), 0, 1], { background: WHITE_BG });
  }

  if (resolved.rotate || resolved.shear) {
    // rotate/shear can expand the canvas; normalize back to the original size
    // so every output in a batch stays consistent.
    if (originalWidth && originalHeight) {
      image = image.resize(originalWidth, originalHeight, { fit: "cover" });
    }
  }

  if (resolved.flipH) image = image.flop();
  if (resolved.flipV) image = image.flip();

  // --- Color / tone ---
  const modulate: { brightness?: number; saturation?: number; hue?: number } = {};
  if (resolved.brightness) modulate.brightness = resolved.brightness;
  if (resolved.saturation !== undefined) modulate.saturation = resolved.saturation;
  if (resolved.hue) modulate.hue = resolved.hue;
  if (Object.keys(modulate).length > 0) image = image.modulate(modulate);

  if (resolved.contrast !== undefined && resolved.contrast !== 1) {
    const a = resolved.contrast;
    const b = 128 * (1 - a);
    image = image.linear(a, b);
  }

  if (resolved.sepia) {
    image = image.grayscale().tint({ r: 112, g: 66, b: 20 });
  } else if (resolved.grayscale) {
    image = image.grayscale();
  }

  if (resolved.invert) image = image.negate({ alpha: false });

  // --- Texture ---
  if (resolved.sharpen && resolved.sharpen > 0) {
    image = image.sharpen({ sigma: resolved.sharpen });
  }
  if (resolved.blur && resolved.blur >= 0.3) {
    image = image.blur(resolved.blur);
  }

  // --- Pixel-level noise (requires a raw round-trip) ---
  const needsNoise = !!(resolved.gaussianNoise || resolved.saltPepperNoise);
  let workingBuffer: Buffer;
  let width = originalWidth;
  let height = originalHeight;
  let channels = meta.channels || 3;

  if (needsNoise) {
    const raw = await image.raw().toBuffer({ resolveWithObject: true });
    width = raw.info.width;
    height = raw.info.height;
    channels = raw.info.channels;
    let data = raw.data;

    if (resolved.gaussianNoise) {
      data = addGaussianNoise(data, resolved.gaussianNoise);
    }
    if (resolved.saltPepperNoise) {
      data = addSaltPepperNoise(data, channels, resolved.saltPepperNoise);
    }

    image = sharp(data, { raw: { width, height, channels } });
    workingBuffer = data;
  } else {
    workingBuffer = await image.toBuffer();
    image = sharp(workingBuffer);
    const dims = await image.metadata();
    width = dims.width || width;
    height = dims.height || height;
  }

  // --- Creative overlays ---
  const composites: sharp.OverlayOptions[] = [];
  if (resolved.vignette) {
    composites.push({ input: vignetteSvg(width, height, resolved.vignette), blend: "multiply" });
  }
  if (resolved.glare) {
    composites.push({ input: glareSvg(width, height, resolved.glare), blend: "screen" });
  }
  if (composites.length > 0) {
    image = image.composite(composites);
  }

  // --- Encode ---
  const format: OutputFormat = output.format;
  const quality = Math.min(100, Math.max(1, output.quality || 85));

  if (format === "png") {
    image = image.png();
  } else if (format === "jpeg") {
    image = image.jpeg({ quality });
  } else if (format === "webp") {
    image = image.webp({ quality });
  } else if (format === "tiff") {
    image = image.tiff({ quality });
  } else {
    try {
      image = image.toFormat(originalFormat as keyof sharp.FormatEnum);
    } catch {
      image = image.png();
    }
  }

  const buffer = await image.toBuffer();
  const extension = extensionForFormat(format, originalFormat);
  const mimeType = mimeTypeForFormat(format, `image/${originalFormat}`);

  return { buffer, extension, mimeType };
}
