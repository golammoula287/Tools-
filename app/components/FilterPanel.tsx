"use client";

import { FILTER_GROUP_LABELS, FILTER_REGISTRY, FilterMeta } from "@/lib/filters";
import { AugmentMode, FilterGroup, FilterKey, FiltersConfig, FilterState } from "@/lib/types";

interface FilterPanelProps {
  filters: FiltersConfig;
  mode: AugmentMode;
  onChange: (key: FilterKey, patch: Partial<FilterState>) => void;
}

const GROUP_ORDER: FilterGroup[] = ["geometric", "color", "texture", "creative"];

function FilterRow({
  meta,
  state,
  mode,
  onChange,
}: {
  meta: FilterMeta;
  state: FilterState;
  mode: AugmentMode;
  onChange: (patch: Partial<FilterState>) => void;
}) {
  const isBoolean = meta.kind === "boolean";

  return (
    <div className="py-3 border-b border-white/10 last:border-b-0">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={state.enabled}
          onChange={(e) => {
            const enabled = e.target.checked;
            if (isBoolean) {
              onChange({ enabled, value: enabled ? 1 : 0 });
            } else {
              onChange({ enabled });
            }
          }}
          className="mt-1 accent-pink-400 w-4 h-4 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{meta.label}</span>
            {!isBoolean && mode === "manual" && (
              <span className="text-xs text-white/60 flex-shrink-0">
                {state.value}
                {meta.unit || ""}
              </span>
            )}
          </div>
          <p className="text-xs text-white/45 mt-0.5">{meta.description}</p>

          {state.enabled && (
            <div className="mt-2">
              {isBoolean ? (
                mode === "random" && (
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={state.chance}
                      onChange={(e) => onChange({ chance: Number(e.target.value) })}
                      className="w-full accent-pink-400"
                    />
                    <span className="text-xs text-white/60 w-10 text-right">{state.chance}%</span>
                  </div>
                )
              ) : mode === "manual" ? (
                <input
                  type="range"
                  min={meta.min}
                  max={meta.max}
                  step={meta.step}
                  value={state.value}
                  onChange={(e) => onChange({ value: Number(e.target.value) })}
                  className="w-full accent-pink-400"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={meta.min}
                    max={meta.max}
                    step={meta.step}
                    value={state.min}
                    onChange={(e) => onChange({ min: Number(e.target.value) })}
                    className="w-full min-w-0 p-1.5 rounded-lg text-black text-xs text-center"
                    aria-label={`${meta.label} minimum`}
                  />
                  <span className="text-white/40 text-xs flex-shrink-0">to</span>
                  <input
                    type="number"
                    min={meta.min}
                    max={meta.max}
                    step={meta.step}
                    value={state.max}
                    onChange={(e) => onChange({ max: Number(e.target.value) })}
                    className="w-full min-w-0 p-1.5 rounded-lg text-black text-xs text-center"
                    aria-label={`${meta.label} maximum`}
                  />
                  <span className="text-white/40 text-xs flex-shrink-0">{meta.unit || ""}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FilterPanel({ filters, mode, onChange }: FilterPanelProps) {
  return (
    <div className="space-y-3">
      {GROUP_ORDER.map((group) => {
        const groupFilters = FILTER_REGISTRY.filter((m) => m.group === group);
        const enabledCount = groupFilters.filter((m) => filters[m.key]?.enabled).length;
        return (
          <details
            key={group}
            open={group === "geometric" || group === "color"}
            className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden"
          >
            <summary className="cursor-pointer select-none px-4 py-3 flex items-center justify-between text-sm font-semibold">
              <span>{FILTER_GROUP_LABELS[group]}</span>
              <span className="text-xs font-normal text-white/50">
                {enabledCount > 0 ? `${enabledCount} enabled` : ""}
              </span>
            </summary>
            <div className="px-4 pb-2">
              {groupFilters.map((meta) => {
                const state = filters[meta.key];
                if (!state) return null;
                return (
                  <FilterRow
                    key={meta.key}
                    meta={meta}
                    state={state}
                    mode={mode}
                    onChange={(patch) => onChange(meta.key, patch)}
                  />
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}
