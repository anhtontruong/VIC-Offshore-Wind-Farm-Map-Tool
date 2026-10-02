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

// # Landing Points ([lng, lat])
export const LANDING_POINTS: { name: string; lngLat: [number, number] }[] = [
  { name: "Loy Yang Power Station", lngLat: [146.577, -38.254] }
];
