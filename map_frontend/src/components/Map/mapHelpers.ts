import type { RefObject } from "react";
import rangeJSON from "../../../../heatmap_creation_script/range.json";
import type { Layer } from "../../hooks/useScenarioContext";
import {
  AGGREGATE_2_COLORS,
  HEATMAP_COLORS,
  HEATMAP_OLD_COLORS,
  HEATMAP_OLD_RANGE_MW,
  HEATMAP_RANGE_MW,
  type LayerColors
} from "../../constants/constants";

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

// OLD FILL COLOR ("Heatmap (Old Colour)" Data: discrete zero + low -> high gradient)
export function buildOldGridFillColor(paramKey: string) {
  return [
    "case",
    ["==", ["get", paramKey], null],
    "rgba(0, 0, 0, 0)",
    [
      "step",
      ["get", paramKey],
      HEATMAP_OLD_COLORS.zero,
      0.0000001,
      [
        "interpolate",
        ["linear"],
        ["get", paramKey],
        HEATMAP_OLD_RANGE_MW[0],
        HEATMAP_OLD_COLORS.low,
        HEATMAP_OLD_RANGE_MW[1],
        HEATMAP_OLD_COLORS.high
      ]
    ]
  ] satisfies mapboxgl.Expression;
}

// AGGREGATE (2) FILL COLOR ("Aggregate Heatmap (2)" Data: solution in A, B, both or neither)
export function buildAggregate2FillColor(paramKeyA: string, paramKeyB: string) {
  const hasSolution = (paramKey: string) => [
    ">",
    ["to-number", ["get", paramKey], 0],
    0
  ];

  return [
    "case",
    // no data, or A / B doesn't sum to 1 (no such property)
    [
      "any",
      ["==", ["get", paramKeyA], null],
      ["==", ["get", paramKeyB], null]
    ],
    "rgba(0, 0, 0, 0)",
    ["all", hasSolution(paramKeyA), hasSolution(paramKeyB)],
    AGGREGATE_2_COLORS.both,
    hasSolution(paramKeyA),
    AGGREGATE_2_COLORS.aOnly,
    hasSolution(paramKeyB),
    AGGREGATE_2_COLORS.bOnly,
    AGGREGATE_2_COLORS.neither
  ] satisfies mapboxgl.Expression;
}

// ramp colours (heatmap's by default) spread evenly over [min, max], as interpolate stops
export function rampStops([min, max]: number[], ramp = HEATMAP_COLORS.ramp) {
  return ramp.flatMap((color, i) => [
    min + ((max - min) * i) / (ramp.length - 1),
    color
  ]);
}

// a layer's colours as a ramp (its Phosphor steps, else just min -> max)
export function layerRamp(colors: LayerColors) {
  return "ramp" in colors ? colors.ramp : [colors.min, colors.max];
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
