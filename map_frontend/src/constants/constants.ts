import rangeJSON from "../../../heatmap_creation_script/range.json";

// ================ //
//     CONSTANTS
// ================ //
export const INITIAL_CENTER: [number, number] = [146.8406, -39.0943];
export const INITIAL_ZOOM: number = 9;

// # Layer Stack
// round outward to the slider step so every data cell sits inside the slider domain
const floorTo = (value: number, decimals: number) =>
  Math.floor(value * 10 ** decimals) / 10 ** decimals;
const ceilTo = (value: number, decimals: number) =>
  Math.ceil(value * 10 ** decimals) / 10 ** decimals;

function layerInfo(
  name: string,
  unit: string,
  decimals: number,
  range: number[]
) {
  return {
    name,
    unit,
    decimals,
    step: 10 ** -decimals,
    min: floorTo(range[0], decimals),
    max: ceilTo(range[1], decimals)
  };
}

// keyed by heatmap data property, order = default stack order (top -> bottom)
export const LAYER_INFO = {
  depth_m: layerInfo("Water Depth", "m", 1, rangeJSON.depth_m),
  wind_speed_m_s: layerInfo("Wind Speed", "m/s", 2, rangeJSON.wind_speed_m_s),
  export_cable_km: layerInfo("Export Cable Length", "km", 1, rangeJSON.export_cable_km),
  e_w: layerInfo("Sea Bird Exposure", "", 3, rangeJSON.e_w)
};

export type LayerKey = keyof typeof LAYER_INFO;

export const LAYER_KEYS = Object.keys(LAYER_INFO) as LayerKey[];

// default opacities (each card's slider starts here)
export const BASE_LAYER_OPACITY = 0.75;
export const LAYER_OPACITY = 0.3;

// # Heatmap Colours (shared by map paint expressions + legends)
export const HEATMAP_COLORS = {
  // Phosphor "hot", OKLab, concave up, 32 steps (low -> high)
  // also used by the aggregate heatmap (number of scenarios each cell has a solution in)
  ramp: [
    "#000000", "#000000", "#030000", "#090000", "#130000", "#1e0000", "#290000", "#340000",
    "#410000", "#4d0000", "#5a0000", "#670000", "#740000", "#820200", "#8d0f00", "#981a00",
    "#a42400", "#ae2f00", "#b93900", "#c34300", "#cd4d00", "#d75800", "#e26200", "#eb6c00",
    "#f57601", "#ff8102", "#ff9317", "#ffa426", "#ffb436", "#ffc344", "#ffd253", "#ffe061"
  ]
};
export const HEATMAP_RANGE_MW = [0, 15]; // gradient runs low -> high
// thick outline on cells with a solution (Base Layer card toggle)
export const SOLUTION_OUTLINE_COLOR = "#fff200";

// # Layer Colours (shared by map paint expressions, legends + layer cards)
export const DEPTH_COLORS = { min: "#96fcff", max: "#020f5b" };
export const WIND_COLORS = { min: "#b8007a" , max: "#ff6f00"};
export const BIRD_COLORS = { min: "#f5dd9a", max: "#ff3939" };
const SHORE_COLORS = { min: "#d9f99d", max: "#145e00" };
export const LAYER_COLORS: Record<LayerKey, { min: string; max: string }> = {
  depth_m: DEPTH_COLORS,
  wind_speed_m_s: WIND_COLORS,
  export_cable_km: SHORE_COLORS,
  e_w: BIRD_COLORS
};

// # Landing Points ([lng, lat])
export const LANDING_POINT_COLOR = "#facc15";
export const LANDING_POINTS: { name: string; lngLat: [number, number] }[] = [
  { name: "Loy Yang Power Station", lngLat: [146.577, -38.254] }
];
