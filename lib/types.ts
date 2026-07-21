// Shared types used by both the client UI and the server API route.

export type FilterKey =
  | "rotate"
  | "flipH"
  | "flipV"
  | "zoom"
  | "shear"
  | "brightness"
  | "contrast"
  | "saturation"
  | "hue"
  | "grayscale"
  | "sepia"
  | "invert"
  | "sharpen"
  | "blur"
  | "gaussianNoise"
  | "saltPepperNoise"
  | "vignette"
  | "glare";

export type FilterGroup = "geometric" | "color" | "texture" | "creative";

export type FilterKind = "range" | "boolean";

export type AugmentMode = "manual" | "random";

/**
 * A single filter's configured state.
 * - range filters use `value` in manual mode, `min`/`max` in random mode.
 * - boolean filters use `value` (on/off) in manual mode, `chance` (0-100%) in random mode.
 */
export interface FilterState {
  enabled: boolean;
  value: number;
  min: number;
  max: number;
  chance: number;
}

export type FiltersConfig = Partial<Record<FilterKey, FilterState>>;

export type OutputFormat = "original" | "png" | "jpeg" | "webp";

export interface OutputConfig {
  format: OutputFormat;
  quality: number; // 1-100, used for jpeg/webp
}

export interface RenameConfig {
  enabled: boolean;
  baseName: string;
  startIndex: number;
  padding: number;
}

export type PresetName = "coin" | "general" | "document" | "custom";

export interface AugmentRequestConfig {
  mode: AugmentMode;
  variantsPerImage: number;
  filters: FiltersConfig;
  output: OutputConfig;
  rename: RenameConfig;
}

export interface ResultImage {
  name: string;
  mimeType: string;
  dataBase64: string;
  originalName: string;
  variantIndex: number;
}

export interface AugmentResponse {
  results: ResultImage[];
}
