import { useRef, useId } from "react";
import "mapbox-gl/dist/mapbox-gl.css"; // Associated CSS
import { useScenarioContext } from "../../hooks/useScenarioContext";
import MapLegend from "./Legend";
import { buildGridFillColor, type MapRef } from "./mapHelpers";
import { useMapInit } from "./hooks/useMapInit";
import { useCameraSync } from "./hooks/useCameraSync";
import { useMapResize } from "./hooks/useMapResize";
import { useCellHighlight } from "./hooks/useCellHighlight";
import { useCellPopups } from "./hooks/useCellPopups";
import { useHeatmapPaint } from "./hooks/useHeatmapPaint";
import { useLayerStack } from "./hooks/useLayerStack";

interface MapProps {
  mapRef: MapRef;
}

// ================ //
//     COMPONENT
// ================ //
/**
 * Mapbox map of a SINGLE scenario. Draws the selected Data, Layer Stack overlays and
 * masks, landing points and the legend. Keeps the camera, hovered cell,
 * selected cell and popups in sync with every other screen.
 */
export default function Map({ mapRef }: MapProps) {
  // # Refs (shared by more than one hook, the rest live in their own hook)
  const mapContainerRef = useRef<HTMLDivElement | null>(null); // exposes html
  const paramKeyRef = useRef("");
  const paramKeyBRef = useRef(""); // Parameters B (1 Screen Aggregate (2 Scenarios))
  const syncingRef = useRef(false); // true while this map moves itself programmatically
  const screenId = useId(); // identifies this screen as a camera owner
  const popupsRef = useRef<Record<number, mapboxgl.Popup>>({});

  const { getParam, getParamB, viewing, layers } = useScenarioContext();

  const toThirdsPercent = (value: number) => Math.round(value * 3) * (100 / 3);

  const indices = [0, 1, 2] as const;

  // property holding the capacity for a set of weights (e.g. "33_67_0")
  const toParamKey = (get: (index: 0 | 1 | 2) => number) =>
    indices.map((i) => Math.round(toThirdsPercent(get(i)))).join("_");

  paramKeyRef.current = toParamKey(getParam);
  paramKeyBRef.current = toParamKey(getParamB);

  // FILL COLOR
  const gridFillColor = buildGridFillColor(paramKeyRef.current);

  // # Map Behaviour
  // order matters: effects run in the order these hooks are called
  const mapLoaded = useMapInit({
    mapRef,
    mapContainerRef,
    paramKeyRef,
    syncingRef,
    popupsRef,
    screenId,
    gridFillColor
  });
  useCameraSync(mapRef, syncingRef, screenId);
  useMapResize(mapRef, mapContainerRef, syncingRef);
  useCellHighlight(mapRef, mapLoaded);
  useCellPopups(mapRef, popupsRef, paramKeyRef, paramKeyBRef, mapLoaded);
  useHeatmapPaint(
    mapRef,
    mapLoaded,
    gridFillColor,
    paramKeyRef.current,
    paramKeyBRef.current
  );
  useLayerStack(mapRef, mapLoaded);

  // # JSX
  return (
    <>
      {/* map, change CSS for position and size */}
      <div className="map-container" ref={mapContainerRef} />
      {mapLoaded && <MapLegend viewing={viewing} layers={layers} />}
    </>
  );
}
