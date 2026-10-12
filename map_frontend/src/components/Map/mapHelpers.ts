import type { RefObject } from "react";
import rangeJSON from "../../../../heatmap_creation_script/range.json";
import type { Layer } from "../../hooks/useScenarioContext";
import { HEATMAP_COLORS, HEATMAP_RANGE_MW } from "../../constants/constants";

// a screen's map instance, passed to every map hook
export type MapRef = RefObject<mapboxgl.Map | null>;

// ================ //
//     CONSTANTS
// ================ //
// # Aggregate Heatmap (number of scenarios each cell has a solution in)
export const AGGREGATE_RANGE = [0, rangeJSON.n_solutions[1]];
export const AGGREGATE_FILL_COLOR = [
  "case",
  ["==", ["get", "n_solutions"], null],
  "rgba(0, 0, 0, 0)",
  [
    "interpolate",
    ["linear"],
    ["get", "n_solutions"],
    ...rampStops(AGGREGATE_RANGE)
  ]
] satisfies mapboxgl.Expression;

// # Landing Point Star (shared by marker + legend, 24x24 viewBox)
export const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

// base heatmap layers that get cut out by layer stack masks
export const BASE_LAYER_IDS = [
  "heatmap-fill",
  "heatmap-outline",
  "heatmap-hover-fill",
  "heatmap-hover-line",
  "heatmap-selected-line"
];

// Map Bounds
export const MAP_BOUNDS: mapboxgl.LngLatBoundsLike = [
  [140.9, -44.0], // Southwest
  [150.5, -33.9] // Northeast
];

// =================
//  Helper Function
// =================
// FILL COLOR (paramKey = property holding the capacity for the current weighting)
export function buildGridFillColor(paramKey: string) {
  return [
    "case",
    ["==", ["get", paramKey], null],
    "rgba(0, 0, 0, 0)",
    [
      "interpolate",
      ["linear"],
      ["get", paramKey],
      ...rampStops(HEATMAP_RANGE_MW)
    ]
  ] satisfies mapboxgl.Expression;
}

// heatmap ramp colours spread evenly over [min, max], as interpolate stops
function rampStops([min, max]: number[]) {
  const ramp = HEATMAP_COLORS.ramp;
  return ramp.flatMap((color, i) => [
    min + ((max - min) * i) / (ramp.length - 1),
    color
  ]);
}

export function ldGeoJSONToGeoJSON(ldgeojson: string) {
  const features = ldgeojson
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  return {
    type: "FeatureCollection" as const,
    features
  };
}

// cells within a layer's range (or outside it, if inverted)
export function selectedFilter(layer: Layer): mapboxgl.Expression {
  const value = ["get", layer.key];
  const inRange = [
    "all",
    [">=", value, layer.range[0]],
    ["<=", value, layer.range[1]]
  ];

  return ["all", ["has", layer.key], layer.inverted ? ["!", inRange] : inRange];
}
