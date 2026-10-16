import { useEffect } from "react";
import rangeJSON from "../../../../../heatmap_creation_script/range.json";
import { useScenarioContext, Viewing } from "../../../hooks/useScenarioContext";
import { ScreenMode, useAppContext } from "../../../hooks/useAppContext";
import {
  BIRD_COLORS,
  DEPTH_COLORS,
  WIND_COLORS
} from "../../../constants/constants";
import {
  AGGREGATE_FILL_COLOR,
  buildAggregate2FillColor,
  buildOldGridFillColor,
  rampStops,
  type MapRef
} from "../mapHelpers";

/**
 * Map Slider + Data + Base Layer Update: repaints the base heatmap when the
 * parameter sliders move, a different Data is selected or the Base Layer card
 * changes (opacity, fill, solution outline).
 */
export function useHeatmapPaint(
  mapRef: MapRef,
  mapLoaded: boolean,
  gridFillColor: mapboxgl.Expression,
  paramKey: string,
  paramKeyB: string
) {
  const { params, paramsB, viewing, baseLayer } = useScenarioContext();
  const { screenMode } = useAppContext();
  const isAggregate2 = screenMode === ScreenMode.One_Screen_Aggregate_2;

  // ===================
  //  Map Slider Update
  // ===================
  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;
    if (!map.getLayer("heatmap-fill")) return;

    if (viewing === Viewing.Heatmap) {
      map.setPaintProperty("heatmap-fill", "fill-color", gridFillColor);
    } else if (viewing === Viewing.Heatmap_Old) {
      map.setPaintProperty(
        "heatmap-fill",
        "fill-color",
        buildOldGridFillColor(paramKey)
      );
    } else if (viewing === Viewing.Aggregate_Heatmap_2) {
      map.setPaintProperty(
        "heatmap-fill",
        "fill-color",
        buildAggregate2FillColor(paramKey, paramKeyB)
      );
    }
  }, [params, paramsB]);

  // =============
  //  Data Update
  // =============
  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;
    if (!map.getLayer("heatmap-fill")) return;

    // CASE: Viewing Heatmap
    if (viewing === Viewing.Heatmap) {
      map.setPaintProperty("heatmap-fill", "fill-color", gridFillColor);
    }

    // CASE: Viewing Heatmap (Old Colour)
    else if (viewing === Viewing.Heatmap_Old) {
      map.setPaintProperty(
        "heatmap-fill",
        "fill-color",
        buildOldGridFillColor(paramKey)
      );
    }

    // CASE: Viewing Aggregate Heatmap
    else if (viewing === Viewing.Aggregate_Heatmap) {
      map.setPaintProperty("heatmap-fill", "fill-color", AGGREGATE_FILL_COLOR);
    }

    // CASE: Viewing Aggregate Heatmap (2)
    else if (viewing === Viewing.Aggregate_Heatmap_2) {
      map.setPaintProperty(
        "heatmap-fill",
        "fill-color",
        buildAggregate2FillColor(paramKey, paramKeyB)
      );
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
        ...rampStops(rangeJSON.wind_speed_m_s, WIND_COLORS.ramp)
      ]);
    }

    // CASE: Viewing Bird Risk
    else if (viewing === Viewing.Bird_Risk) {
      map.setPaintProperty("heatmap-fill", "fill-color", [
        "interpolate",
        ["linear"],
        ["get", "e_w"],
        ...rampStops(rangeJSON.e_w, BIRD_COLORS.ramp)
      ]);
    }
  }, [viewing]);

  // =====================
  //  Base Opacity Update
  // =====================
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapLoaded) return;

    // fill off = transparent (not hidden, so hover/click on cells still work)
    const opacity = baseLayer.fill ? baseLayer.opacity : 0;

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
      prop
        ? ["case", ["==", ["to-number", ["get", prop], 0], 0], 0, opacity]
        : opacity
    );
  }, [viewing, baseLayer.opacity, baseLayer.fill, mapLoaded]);

  // ==========================
  //  Solution Outline Update
  // ==========================
  // cells with a solution (> 0 MW) for this screen's weighting, on every Data
  // (in A or B, in aggregate mode)
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapLoaded) return;

    const hasSolution = (key: string): mapboxgl.Expression => [
      ">",
      ["to-number", ["get", key], 0],
      0
    ];
    map.setFilter(
      "heatmap-solution-line",
      isAggregate2
        ? ["any", hasSolution(paramKey), hasSolution(paramKeyB)]
        : hasSolution(paramKey)
    );
    map.setLayoutProperty(
      "heatmap-solution-line",
      "visibility",
      baseLayer.solutionOutline ? "visible" : "none"
    );
  }, [paramKey, paramKeyB, isAggregate2, baseLayer.solutionOutline, mapLoaded]);
}
