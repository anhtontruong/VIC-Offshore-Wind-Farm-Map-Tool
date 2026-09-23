import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css"; // Associated CSS
import { useScenarioContext, Viewing } from "../hooks/useScenarioContext";
import heatmapLdGeoJson from "../../../heatmap_creation_script/heatmap.ldgeojson?raw";
import rangeJSON from "../../../heatmap_creation_script/range.json";
import { useAppContext, type OpenCell } from "../hooks/useAppContext";

interface MapProps {
  mapRef: React.RefObject<mapboxgl.Map | null>;
}

// ================ //
//     COMPONENT
// ================ //
export default function Map({ mapRef }: MapProps) {
  // # Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null); // exposes html
  const paramKeyRef = useRef("");
  const syncingRef = useRef(false); // true while this map moves itself programmatically
  const interactingRef = useRef(false); // true while this map owns the camera
  const publishedRef = useRef<{
    center: [number, number];
    zoom: number;
  } | null>(null);
  const hoverPublishedRef = useRef<number | null>(null); // last hover id this screen published
  const prevHoverRef = useRef<number | null>(null); // last hover id this screen applied to feature-state
  const prevSelectedRef = useRef<number | null>(null); // last selected id this screen applied to feature-state
  const popupsRef = useRef<Record<number, mapboxgl.Popup>>({});

  // true once this screen's map has finished loading the heatmap source/layers
  const [mapLoaded, setMapLoaded] = useState(false);

  const {
    center,
    zoom,
    setCenter,
    setZoom,
    hoveredCellId,
    setHoveredCellId,
    selectedCellId,
    setSelectedCellId,
    openCells,
    openCell,
    closeCell
  } = useAppContext();

  const { params, getParam, viewing } = useScenarioContext();

  const toThirdsPercent = (value: number) => Math.round(value * 3) * (100 / 3);

  const indices = [0, 1, 2] as const;

  paramKeyRef.current = indices
    .map((i) => Math.round(toThirdsPercent(getParam(i))))
    .join("_");

  // FILL COLOR
  const GRID_FILL_COLOR = [
    "case",
    ["==", ["get", paramKeyRef.current], null],
    "rgba(0, 0, 0, 0)",
    [
      "step",
      ["get", paramKeyRef.current],
      "rgba(255, 0, 0, 0.5)",
      0.0000001,
      "#ffff3d",
      30,
      "#70ff3c"
    ]
  ] satisfies mapboxgl.Expression;

  // Map Bounds
  const mapBounds: mapboxgl.LngLatBoundsLike = [
    [140.9, -44.0], // Southwest
    [150.5, -33.9] // Northeast
  ];

  // ==============
  //    Map Load
  // ==============
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      accessToken:
        "pk.eyJ1IjoiYW5odG9udCIsImEiOiJjbXM2c2o4NDIwNWI4MzBvbzMzaGRzNjF5In0.q0dcFpdPMRLIoTuWtWQzKA",
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/standard-satellite",
      center: center,
      zoom: zoom,
      maxBounds: mapBounds,
      dragRotate: false,
      touchPitch: false,
      pitchWithRotate: false,
      touchZoomRotate: { around: "center" }
    });
    mapRef.current.touchZoomRotate.disableRotation();
    mapRef.current.keyboard.disableRotation();

    // # Listeners
    // HEATMAP
    mapRef.current.on("load", () => {
      if (!mapRef.current) return;

      const heatmap = ldGeoJSONToGeoJSON(heatmapLdGeoJson);

      mapRef.current.addSource("heatmap", {
        type: "geojson",
        data: heatmap,
        promoteId: "id" // required hover/selected highlight
      });

      // CELL COLOUR
      mapRef.current.addLayer({
        id: "heatmap-fill",
        type: "fill",
        source: "heatmap",
        paint: {
          "fill-color": GRID_FILL_COLOR,
          "fill-opacity": 0.3
        }
      });

      // OUTLINE
      mapRef.current.addLayer({
        id: "heatmap-outline",
        type: "line",
        source: "heatmap",
        paint: {
          "line-color": "#000000",
          "line-width": 0.5,
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0, 12, 1]
        }
      });

      // HOVER FILL
      mapRef.current.addLayer({
        id: "heatmap-hover-fill",
        type: "fill",
        source: "heatmap",
        paint: {
          "fill-color": "#ffffff",
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.3,
            0
          ]
        }
      });

      // HOVER OUTLINE
      mapRef.current.addLayer({
        id: "heatmap-hover-line",
        type: "line",
        source: "heatmap",
        paint: {
          "line-color": "#ffffff",
          "line-width": 2.5,
          "line-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            1,
            0
          ]
        }
      });

      // SELECTED OUTLINE
      mapRef.current.addLayer({
        id: "heatmap-selected-line",
        type: "line",
        source: "heatmap",
        paint: {
          "line-color": "#00e5ff",
          "line-width": 4,
          "line-opacity": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            1,
            0
          ]
        }
      });

      setMapLoaded(true);
    });

    // ===== HOVER =====
    mapRef.current.on("mousemove", "heatmap-fill", (e) => {
      const id = (e.features?.[0] as any)?.properties?.id;
      if (id == null || id === hoverPublishedRef.current) return; // same-cell guard
      hoverPublishedRef.current = id;
      setHoveredCellId(id);
    });

    mapRef.current.on("mouseleave", "heatmap-fill", () => {
      hoverPublishedRef.current = null;
      setHoveredCellId(null);
    });

    // ===== CAMERA OWNERSHIP =====
    mapRef.current.on("movestart", () => {
      if (syncingRef.current) return; // we're following, not driving
      interactingRef.current = true;
    });

    mapRef.current.on("moveend", () => {
      if (syncingRef.current) return;
      interactingRef.current = false;
    });

    mapRef.current.on("move", () => {
      if (!mapRef.current) return;
      if (syncingRef.current) return; // this move came from another screen

      // get the current center coords and zoom
      const mapCenter = mapRef.current.getCenter();
      const mapZoom = mapRef.current.getZoom();

      publishedRef.current = {
        center: [mapCenter.lng, mapCenter.lat],
        zoom: mapZoom
      };

      setCenter([mapCenter.lng, mapCenter.lat]);
      setZoom(mapZoom);
    });

    mapRef.current.addInteraction("places-click-interaction", {
      type: "click",
      target: { layerId: "heatmap-fill" },
      handler: (e) => {
        if (!e.feature || !mapRef.current || !e.lngLat) return;

        const props = e.feature.properties as Record<string, any>;

        // don't open a popup (anywhere) if this screen's weighting has no
        // capacity for the clicked cell — matches the previous behaviour
        if (props[paramKeyRef.current] === undefined) {
          return;
        }

        const id = props.id;

        openCell({
          id,
          lngLat: [e.lngLat.lng, e.lngLat.lat],
          props
        });
        setSelectedCellId(id);
      }
    });

    return () => {
      // remove any popups this screen created before the map itself goes away
      Object.values(popupsRef.current).forEach((popup) => popup.remove());
      popupsRef.current = {};
      mapRef.current?.remove();
    };
  }, []);

  // =====================
  //   Shared Camera Sync
  // =====================
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // this map is driving — never fight the gesture in progress
    if (interactingRef.current) return;

    // this is the value we published ourselves — nothing to follow
    const mine = publishedRef.current;
    if (
      mine &&
      mine.center[0] === center[0] &&
      mine.center[1] === center[1] &&
      mine.zoom === zoom
    )
      return;

    syncingRef.current = true;
    map.jumpTo({ center, zoom });
    syncingRef.current = false;
  }, [center, zoom]);

  // ==================
  //   Container Size
  // ==================
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      const map = mapRef.current;
      if (!map) return;

      // resize re-fires move — don't let it publish or claim the camera
      syncingRef.current = true;
      map.resize();
      syncingRef.current = false;
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

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
      map.setFeatureState(
        { source: "heatmap", id: prev },
        { selected: false }
      );
    }
    if (selectedCellId != null) {
      map.setFeatureState(
        { source: "heatmap", id: selectedCellId },
        { selected: true }
      );
    }
    prevSelectedRef.current = selectedCellId;
  }, [selectedCellId, mapLoaded]);

  // =====================
  //   Shared Cell Popups
  // =====================
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // add popups for cells opened elsewhere
    for (const cell of openCells) {
      if (popupsRef.current[cell.id]) continue;

      const popup = new mapboxgl.Popup({
        closeOnClick: false,
        maxWidth: "300px"
      })
        .setLngLat(cell.lngLat)
        .setHTML(buildPopupHTML(cell, paramKeyRef.current))
        .addTo(map);

      // x button: close this popup on every screen
      popup.on("close", () => closeCell(cell.id));

      // latest popup above previous
      const popupElement = popup.getElement();
      popupElement?.addEventListener("mousedown", () => {
        const parent = popupElement.parentElement;
        if (parent) {
          parent.appendChild(popupElement);
        }
      });

      popupsRef.current[cell.id] = popup;
    }

    // remove popups for cells that were closed elsewhere
    for (const key of Object.keys(popupsRef.current)) {
      const id = Number(key);
      if (!openCells.some((c) => c.id === id)) {
        popupsRef.current[id].remove();
        delete popupsRef.current[id];
      }
    }
  }, [openCells, mapLoaded]);

  // ===================
  //  Map Slider Update
  // ===================
  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;
    if (!map.getLayer("heatmap-fill")) return;
    if (viewing !== Viewing.Heatmap) return;

    map.setPaintProperty("heatmap-fill", "fill-color", GRID_FILL_COLOR);
  }, [params]);

  // =============
  //  Data Update
  // =============
  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;
    if (!map.getLayer("heatmap-fill")) return;

    // CASE: Viewing Heatmap
    if (viewing === Viewing.Heatmap) {
      map.setPaintProperty("heatmap-fill", "fill-color", GRID_FILL_COLOR);
    }

    // CASE: Viewing Water Depth
    else if (viewing === Viewing.Water_Depth) {
      map.setPaintProperty("heatmap-fill", "fill-color", [
        "interpolate",
        ["linear"],
        ["get", "depth_m"],
        rangeJSON.depth_m[0],
        "#96fcff",
        rangeJSON.depth_m[1],
        "#00106a"
      ]);
    }

    // CASE: Viewing Wind Speed
    else if (viewing === Viewing.Wind_Speed) {
      map.setPaintProperty("heatmap-fill", "fill-color", [
        "interpolate",
        ["linear"],
        ["get", "wind_speed_m_s"],
        rangeJSON.wind_speed_m_s[0],
        "#65006a",
        rangeJSON.wind_speed_m_s[1],
        "#ffa13d"
      ]);
    }

    // CASE: Viewing Bird Risk
    else if (viewing === Viewing.Bird_Risk) {
      map.setPaintProperty("heatmap-fill", "fill-color", [
        "interpolate",
        ["linear"],
        ["get", "e_w"],
        rangeJSON.e_w[0],
        "#ffecb7",
        rangeJSON.e_w[1],
        "#ff3939"
      ]);
    }
  }, [viewing]);

  // # JSX
  return (
    <>
      {/* map, change CSS for position and size */}
      <div className="map-container" ref={mapContainerRef} />
    </>
  );
}

// =================
//  Helper Function
// =================
function ldGeoJSONToGeoJSON(ldgeojson: string) {
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

// ============
//  Popup HTML
// ============
function buildPopupHTML(cell: OpenCell, paramKey: string) {
  const { lngLat, props } = cell;
  const capacity = props[paramKey];

  const depth_m = props.depth_m;
  const wind_speed_m_s = props.wind_speed_m_s;
  const shore_km = props.shore_km;
  const e_w = props.e_w;
  const n_surveys = props.n_surveys;

  return `<div class="cell-popup">
            <div class="cell-popup-header">
              Cell Details
            </div>

            <div class="cell-popup-row">
              <span class="cell-popup-label">Longitude</span>
              <span class="cell-popup-value">${lngLat[0].toFixed(6)}</span>
            </div>

            <div class="cell-popup-row">
              <span class="cell-popup-label">Latitude</span>
              <span class="cell-popup-value">${lngLat[1].toFixed(6)}</span>
            </div>

            <div class="cell-popup-row">
              <span class="cell-popup-label">Installed Capacity</span>
              <span class="cell-popup-value">${
                typeof capacity === "number"
                  ? `${capacity.toFixed(2)} MW`
                  : "No data"
              }</span>
            </div>

            <div class="cell-popup-section">
              <div class="cell-popup-section-title">Additional Information</div>

              <div class="cell-popup-row">
                <span class="cell-popup-label">Sea Depth</span>
                <span class="cell-popup-value">${
                  typeof depth_m === "number"
                    ? `${depth_m.toFixed(2)} m`
                    : "Error"
                }</span>
              </div>

              <div class="cell-popup-row">
                <span class="cell-popup-label">Average Wind Speed (150m AMSL)</span>
                <span class="cell-popup-value">${
                  typeof wind_speed_m_s === "number"
                    ? `${wind_speed_m_s.toFixed(2)} m/s`
                    : "Error"
                }</span>
              </div>

              <div class="cell-popup-row">
                <span class="cell-popup-label">Distance to Shore</span>
                <span class="cell-popup-value">${
                  typeof shore_km === "number"
                    ? `${shore_km.toFixed(2)} km`
                    : "Error"
                }</span>
              </div>

              <div class="cell-popup-row">
                <span class="cell-popup-label">Sea Bird Exposure Score for Cell</span>
                <span class="cell-popup-value">${
                  typeof e_w === "number" ? `${e_w.toFixed(2)}` : "Error"
                }</span>
              </div>

              <div class="cell-popup-row">
                <span class="cell-popup-label">Number of Bird Surveys</span>
                <span class="cell-popup-value">${
                  typeof n_surveys === "number"
                    ? `${n_surveys.toFixed(0)}`
                    : "Error"
                }</span>
              </div>

            </div>
          </div>`;
}
