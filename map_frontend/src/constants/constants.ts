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
  export_cable_km: layerInfo(
    "Export Cable Length",
    "km",
    1,
    rangeJSON.export_cable_km
  ),
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
    "#000000",
    "#000000",
    "#030000",
    "#090000",
    "#130000",
    "#1e0000",
    "#290000",
    "#340000",
    "#410000",
    "#4d0000",
    "#5a0000",
    "#670000",
    "#740000",
    "#820200",
    "#8d0f00",
    "#981a00",
    "#a42400",
    "#ae2f00",
    "#b93900",
    "#c34300",
    "#cd4d00",
    "#d75800",
    "#e26200",
    "#eb6c00",
    "#f57601",
    "#ff8102",
    "#ff9317",
    "#ffa426",
    "#ffb436",
    "#ffc344",
    "#ffd253",
    "#ffe061"
  ]
};
export const HEATMAP_RANGE_MW = [0, 15]; // gradient runs low -> high
// old heatmap colours ("Heatmap (Old Colour)" Data): discrete zero + low -> high gradient
export const HEATMAP_OLD_COLORS = {
  zero: "rgba(114, 0, 0, 0.5)",
  low: "rgb(255, 227, 41)",
  high: "#44ff00"
};
export const HEATMAP_OLD_RANGE_MW = [10, 15];
// thick outline on cells with a solution (Base Layer card toggle)
export const SOLUTION_OUTLINE_COLOR = "#fff200";
// same outline, on cells cut out by a layer stack mask
export const SOLUTION_OUTLINE_MASKED_COLOR = "#c800ff";

// # Layer Colours (shared by map paint expressions, legends + layer cards)
export const DEPTH_COLORS = { min: "#96fcff", max: "#020f5b" };
// either a straight min -> max blend, or a ramp of Phosphor steps (min -> max)
export type LayerColors = { min: string; max: string } | { ramp: string[] };
export const WIND_COLORS = {
  ramp: [
    "#d5d6e9",
    "#cfd0e6",
    "#c9c9e2",
    "#c3c3df",
    "#bdbddc",
    "#b7b7d8",
    "#b1b1d5",
    "#acaad2",
    "#a6a4cf",
    "#a09ecb",
    "#9a98c8",
    "#9492c5",
    "#8f8cc2",
    "#8986be",
    "#8480bb",
    "#8079b8",
    "#7c73b4",
    "#796cb1",
    "#7565ad",
    "#715faa",
    "#6d58a7",
    "#6a51a4",
    "#664aa0",
    "#62429d",
    "#5f3b9a",
    "#5a3496",
    "#562e92",
    "#51278e",
    "#4c208a",
    "#481785",
    "#430d81",
    "#3f007d"
  ]
};
export const BIRD_COLORS = {
  ramp: [
    "#fcc6ae",
    "#ffc4ad",
    "#ffc3ad",
    "#ffc2ac",
    "#ffc0ab",
    "#ffbda8",
    "#ffbaa5",
    "#ffb6a2",
    "#ffb29e",
    "#ffad9a",
    "#ffa895",
    "#ffa18f",
    "#ff9a88",
    "#ff9280",
    "#ff8a78",
    "#ff806f",
    "#ff7565",
    "#ff685a",
    "#ff584e",
    "#f94f46",
    "#ee4b43",
    "#e3463f",
    "#d8413b",
    "#cc3c37",
    "#c03732",
    "#b4312d",
    "#a82a28",
    "#9b2323",
    "#8e1c1e",
    "#811319",
    "#740a13",
    "#67000d"
  ]
};
const SHORE_COLORS = {
  ramp: [
    "#bde5b5",
    "#aedba7",
    "#9fd299",
    "#91c98c",
    "#83c07f",
    "#75b873",
    "#67b067",
    "#5ba85f",
    "#4ea057",
    "#41994f",
    "#339247",
    "#238c40",
    "#0c8639",
    "#007f35",
    "#007832",
    "#007230",
    "#006c2d",
    "#00672b",
    "#006229",
    "#005d27",
    "#005925",
    "#005623",
    "#005220",
    "#004f1e",
    "#004d1d",
    "#004a1c",
    "#00481b",
    "#00471b",
    "#00461b",
    "#00451b",
    "#00441b",
    "#00441b"
  ]
};
export const LAYER_COLORS: Record<LayerKey, LayerColors> = {
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
