import { FILTER_REGISTRY, defaultFilterState } from "./filters";
import { FiltersConfig, PresetName } from "./types";

function baseFilters(): FiltersConfig {
  const config: FiltersConfig = {};
  for (const meta of FILTER_REGISTRY) {
    config[meta.key] = defaultFilterState(meta, false);
  }
  return config;
}

function enable(
  config: FiltersConfig,
  overrides: Partial<Record<string, Partial<{ min: number; max: number; value: number; chance: number }>>>
): FiltersConfig {
  for (const key of Object.keys(overrides)) {
    const k = key as keyof FiltersConfig;
    const current = config[k];
    if (!current) continue;
    config[k] = { ...current, ...overrides[key], enabled: true };
  }
  return config;
}

export interface PresetDefinition {
  id: PresetName;
  label: string;
  description: string;
  variantsPerImage: number;
  filters: FiltersConfig;
}

export function buildPresets(): Record<PresetName, PresetDefinition> {
  return {
    coin: {
      id: "coin",
      label: "Coin / Numismatics",
      description: "Tuned for macro coin photography: subtle rotation, metallic glare, relief-enhancing sharpen.",
      variantsPerImage: 6,
      filters: enable(baseFilters(), {
        rotate: { min: -12, max: 12 },
        zoom: { min: 0, max: 12 },
        brightness: { min: 0.9, max: 1.15 },
        contrast: { min: 0.9, max: 1.2 },
        sharpen: { min: 0.5, max: 2 },
        gaussianNoise: { min: 0, max: 8 },
        vignette: { min: 20, max: 50 },
        glare: { min: 10, max: 35 },
      }),
    },
    general: {
      id: "general",
      label: "General Objects",
      description: "Balanced, broadly-useful augmentation for everyday object/photo datasets.",
      variantsPerImage: 5,
      filters: enable(baseFilters(), {
        rotate: { min: -20, max: 20 },
        flipH: { chance: 50 },
        zoom: { min: 0, max: 15 },
        brightness: { min: 0.85, max: 1.2 },
        contrast: { min: 0.85, max: 1.2 },
        saturation: { min: 0.8, max: 1.2 },
        blur: { min: 0, max: 1 },
        gaussianNoise: { min: 0, max: 10 },
      }),
    },
    document: {
      id: "document",
      label: "Document / OCR",
      description: "Minimal geometric distortion and no color shifts, so text stays legible.",
      variantsPerImage: 4,
      filters: enable(baseFilters(), {
        rotate: { min: -3, max: 3 },
        contrast: { min: 0.95, max: 1.1 },
        blur: { min: 0, max: 0.6 },
        gaussianNoise: { min: 0, max: 5 },
      }),
    },
    custom: {
      id: "custom",
      label: "Custom",
      description: "Blank canvas — enable exactly the filters you want, manual mode by default.",
      variantsPerImage: 1,
      filters: baseFilters(),
    },
  };
}
