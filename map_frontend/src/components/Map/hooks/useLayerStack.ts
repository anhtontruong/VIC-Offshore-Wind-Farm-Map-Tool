import { useEffect } from "react";
import { useScenarioContext, type Layer } from "../../../hooks/useScenarioContext";
import {
  SOLUTION_OUTLINE_COLOR,
  SOLUTION_OUTLINE_MASKED_COLOR
} from "../../../constants/constants";
import { BASE_LAYER_IDS, selectedFilter, type MapRef } from "../mapHelpers";

/**
 * Layer Stack Update: applies the Layer Stack to the map. Orders the overlays,
 * sets their filter/opacity/visibility, and cuts masks out of the overlays
 * below them and of the base heatmap.
 */
export function useLayerStack(mapRef: MapRef, mapLoaded: boolean) {
  const { layers } = useScenarioContext();

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const activeMasks = (stack: Layer[]) =>
      stack.filter((layer) => layer.visible && layer.masking);

    // hide cells selected by any of the given masks (null = no filter)
    const notMaskedFilter = (masks: Layer[]) =>
      masks.length
        ? (["!", ["any", ...masks.map(selectedFilter)]] as mapboxgl.Expression)
        : null;

    // order: walk bottom -> top, each moved to just under the grid outline
    for (const layer of [...layers].reverse()) {
      map.moveLayer(`layer-${layer.key}`, "heatmap-outline");
    }

    // overlays: own selection minus masks above them
    layers.forEach((layer, index) => {
      const id = `layer-${layer.key}`;
      const masked = notMaskedFilter(activeMasks(layers.slice(0, index)));

      map.setFilter(
        id,
        masked ? ["all", selectedFilter(layer), masked] : selectedFilter(layer)
      );
      map.setPaintProperty(id, "fill-opacity", layer.opacity);
      map.setLayoutProperty(
        id,
        "visibility",
        layer.visible && !layer.masking ? "visible" : "none"
      );
    });

    // base heatmap: minus every mask
    const baseFilter = notMaskedFilter(activeMasks(layers));
    for (const id of BASE_LAYER_IDS) {
      map.setFilter(id, baseFilter);
    }

    // solution outline: stays drawn on masked cells, in the masked colour
    const masks = activeMasks(layers);
    map.setPaintProperty(
      "heatmap-solution-line",
      "line-color",
      masks.length
        ? [
            "case",
            ["any", ...masks.map(selectedFilter)],
            SOLUTION_OUTLINE_MASKED_COLOR,
            SOLUTION_OUTLINE_COLOR
          ]
        : SOLUTION_OUTLINE_COLOR
    );
  }, [layers, mapLoaded]);
}
