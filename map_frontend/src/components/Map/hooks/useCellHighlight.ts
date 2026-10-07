import { useEffect, useRef } from "react";
import { useAppContext } from "../../../hooks/useAppContext";
import type { MapRef } from "../mapHelpers";

/**
 * Shared Cell Hover + Selection: applies the hovered and selected cell (shared
 * by every screen) to this map's feature-state, which drives the highlights.
 */
export function useCellHighlight(mapRef: MapRef, mapLoaded: boolean) {
  // # Refs
  const prevHoverRef = useRef<number | null>(null); // last hover id this screen applied to feature-state
  const prevSelectedRef = useRef<number | null>(null); // last selected id this screen applied to feature-state

  const { hoveredCellId, selectedCellId } = useAppContext();

  // =====================
  //   Shared Cell Hover
  // =====================
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const prev = prevHoverRef.current;
    if (prev != null) {
      map.setFeatureState({ source: "heatmap", id: prev }, { hover: false });
    }
    if (hoveredCellId != null) {
      map.setFeatureState(
        { source: "heatmap", id: hoveredCellId },
        { hover: true }
      );
    }
    prevHoverRef.current = hoveredCellId;
  }, [hoveredCellId, mapLoaded]);

  // ========================
  //   Shared Cell Selection
  // ========================
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const prev = prevSelectedRef.current;
    if (prev != null) {
      map.setFeatureState({ source: "heatmap", id: prev }, { selected: false });
    }
    if (selectedCellId != null) {
      map.setFeatureState(
        { source: "heatmap", id: selectedCellId },
        { selected: true }
      );
    }
    prevSelectedRef.current = selectedCellId;
  }, [selectedCellId, mapLoaded]);
}
