import { useEffect } from "react";
import rangeJSON from "../../../../../heatmap_creation_script/range.json";
import { useScenarioContext, Viewing } from "../../../hooks/useScenarioContext";
import {
  BIRD_COLORS,
  DEPTH_COLORS,
  WIND_COLORS
} from "../../../constants/constants";
import { AGGREGATE_FILL_COLOR, type MapRef } from "../mapHelpers";

/**
 * Map Slider + Data Update: repaints the base heatmap when the parameter
 * sliders move or a different Data is selected.
 */
export function useHeatmapPaint(
  mapRef: MapRef,
  gridFillColor: mapboxgl.Expression
) {
  const { params, viewing } = useScenarioContext();

  // ===================
  //  Map Slider Update
  // ===================
  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;
    if (!map.getLayer("heatmap-fill")) return;
    if (viewing !== Viewing.Heatmap) return;

    map.setPaintProperty("heatmap-fill", "fill-color", gridFillColor);
  }, [params]);

  // =============
  //  Data Update
  // =============
  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;
    if (!map.getLayer("heatmap-fill")) return;

    // Base layers are fully transparent where the value is 0
    // (cells with no data have the property missing, which counts as 0)
    const zeroProp: Partial<Record<Viewing, string>> = {
      [Viewing.Water_Depth]: "depth_m",
      [Viewing.Wind_Speed]: "wind_speed_m_s",
      [Viewing.Bird_Risk]: "e_w"
    };
    const prop = zeroProp[viewing];
    map.setPaintProperty(
      "heatmap-fill",
      "fill-opacity",
      prop ? ["case", ["==", ["to-number", ["get", prop], 0], 0], 0, 0.3] : 0.3
    );

    // CASE: Viewing Heatmap
    if (viewing === Viewing.Heatmap) {
      map.setPaintProperty("heatmap-fill", "fill-color", gridFillColor);
    }

    // CASE: Viewing Aggregate Heatmap
    else if (viewing === Viewing.Aggregate_Heatmap) {
      map.setPaintProperty("heatmap-fill", "fill-color", AGGREGATE_FILL_COLOR);
    }

    // CASE: Viewing Water Depth
    else if (viewing === Viewing.Water_Depth) {
      map.setPaintProperty("heatmap-fill", "fill-color", [
        "interpolate",
        ["linear"],
        ["get", "depth_m"],
        rangeJSON.depth_m[0],
        DEPTH_COLORS.min,
        rangeJSON.depth_m[1],
        DEPTH_COLORS.max
      ]);
    }

    // CASE: Viewing Wind Speed
    else if (viewing === Viewing.Wind_Speed) {
      map.setPaintProperty("heatmap-fill", "fill-color", [
        "interpolate",
        ["linear"],
        ["get", "wind_speed_m_s"],
        rangeJSON.wind_speed_m_s[0],
        WIND_COLORS.min,
        rangeJSON.wind_speed_m_s[1],
        WIND_COLORS.max
      ]);
    }

    // CASE: Viewing Bird Risk
    else if (viewing === Viewing.Bird_Risk) {
      map.setPaintProperty("heatmap-fill", "fill-color", [
        "interpolate",
        ["linear"],
        ["get", "e_w"],
        rangeJSON.e_w[0],
        BIRD_COLORS.min,
        rangeJSON.e_w[1],
        BIRD_COLORS.max
      ]);
    }
  }, [viewing]);
}
