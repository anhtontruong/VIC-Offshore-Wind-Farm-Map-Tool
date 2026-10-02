import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css"; // Associated CSS
import {
  useScenarioContext,
  Viewing,
  type Layer
} from "../hooks/useScenarioContext";
import heatmapLdGeoJson from "../../../heatmap_creation_script/heatmap.ldgeojson?raw";
import rangeJSON from "../../../heatmap_creation_script/range.json";
import { useAppContext, type OpenCell } from "../hooks/useAppContext";
import { LAYER_INFO, LAYER_KEYS, type LayerKey } from "../constants/constants";

interface MapProps {
  mapRef: React.RefObject<mapboxgl.Map | null>;
}

// # Layer Colours (shared by paint expressions + legend)
const HEATMAP_COLORS = {
  zero: "rgba(255, 0, 0, 0.5)",
  low: "#ffff3d",
  high: "#70ff3c"
};
const HEATMAP_THRESHOLD_MW = 30;
const DEPTH_COLORS = { min: "#96fcff", max: "#00106a" };
const WIND_COLORS = { min: "#65006a", max: "#ffa13d" };
const BIRD_COLORS = { min: "#ffecb7", max: "#ff3939" };
const SHORE_COLORS = { min: "#d9f99d", max: "#0f5257" };
const LAYER_COLORS: Record<LayerKey, { min: string; max: string }> = {
  depth_m: DEPTH_COLORS,
  wind_speed_m_s: WIND_COLORS,
  export_cable_km: SHORE_COLORS,
  e_w: BIRD_COLORS
};

// base heatmap layers that get cut out by layer stack masks
const BASE_LAYER_IDS = [
  "heatmap-fill",
  "heatmap-outline",
  "heatmap-hover-fill",
  "heatmap-hover-line",
  "heatmap-selected-line"
];

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

  const { params, getParam, viewing, layers } = useScenarioContext();

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
      HEATMAP_COLORS.zero,
      0.0000001,
      HEATMAP_COLORS.low,
      HEATMAP_THRESHOLD_MW,
      HEATMAP_COLORS.high
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

      // LAYER STACK (above base fill, below grid/hover/selected)
      for (const key of LAYER_KEYS) {
        mapRef.current.addLayer(
          {
            id: `layer-${key}`,
            type: "fill",
            source: "heatmap",
            layout: { visibility: "none" },
            paint: {
              "fill-color": [
                "interpolate",
                ["linear"],
                ["get", key],
                rangeJSON[key][0],
                LAYER_COLORS[key].min,
                rangeJSON[key][1],
                LAYER_COLORS[key].max
              ]
            }
          },
          "heatmap-outline"
        );
      }

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

  // ====================
  //  Layer Stack Update
  // ====================
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
  }, [layers, mapLoaded]);

  // ==============
  //  Legend
  // ==============
  function renderLegend() {
    // CASE: Discrete categories
    if (viewing === Viewing.Heatmap) {
      return (
        <div className="map-legend">
          <div className="map-legend-title">Heatmap</div>
          <div className="map-legend-row">
            <span
              className="map-legend-swatch"
              style={{ backgroundColor: HEATMAP_COLORS.high }}
            />
            <span>{`≥ ${HEATMAP_THRESHOLD_MW} MW`}</span>
          </div>
          <div className="map-legend-row">
            <span
              className="map-legend-swatch"
              style={{ backgroundColor: HEATMAP_COLORS.low }}
            />
            <span>{`0 - ${HEATMAP_THRESHOLD_MW} MW`}</span>
          </div>
          <div className="map-legend-row">
            <span
              className="map-legend-swatch"
              style={{ backgroundColor: HEATMAP_COLORS.zero }}
            />
            <span>0 MW</span>
          </div>
        </div>
      );
    }

    // CASE: Continuous range
    let title: string;
    let unit: string;
    let range: [number, number];
    let colors: { min: string; max: string };
    let invert = false; // true: min on top, max on bottom

    if (viewing === Viewing.Water_Depth) {
      title = "Water Depth";
      unit = "m";
      range = rangeJSON.depth_m as [number, number];
      colors = DEPTH_COLORS;
      invert = true;
    } else if (viewing === Viewing.Wind_Speed) {
      title = "Wind Speed";
      unit = "m/s";
      range = rangeJSON.wind_speed_m_s as [number, number];
      colors = WIND_COLORS;
    } else {
      title = "Bird Risk";
      unit = "";
      range = rangeJSON.e_w as [number, number];
      colors = BIRD_COLORS;
    }

    return (
      <GradientLegend
        title={title}
        unit={unit}
        range={range}
        colors={colors}
        invert={invert}
      />
    );
  }

  // # JSX
  return (
    <>
      {/* map, change CSS for position and size */}
      <div className="map-container" ref={mapContainerRef} />
      {mapLoaded && (
        <div className="map-legend-stack">
          {renderLegend()}
          {/* drawn layer stack overlays, in stack order */}
          {layers
            .filter((layer) => layer.visible && !layer.masking)
            .map((layer) => (
              <GradientLegend
                key={layer.key}
                title={LAYER_INFO[layer.key].name}
                unit={LAYER_INFO[layer.key].unit}
                range={rangeJSON[layer.key] as [number, number]}
                colors={LAYER_COLORS[layer.key]}
                invert={layer.key === "depth_m"} // same as base depth legend
              />
            ))}
        </div>
      )}
    </>
  );
}

// =================
//  Gradient Legend
// =================
interface GradientLegendProps {
  title: string;
  unit: string;
  range: [number, number];
  colors: { min: string; max: string };
  invert?: boolean; // true: min on top, max on bottom
}

function GradientLegend({
  title,
  unit,
  range,
  colors,
  invert = false
}: GradientLegendProps) {
  const [min, max] = range;
  const topValue = invert ? min : max;
  const bottomValue = invert ? max : min;
  const gradient = invert
    ? `linear-gradient(to bottom, ${colors.min}, ${colors.max})`
    : `linear-gradient(to top, ${colors.min}, ${colors.max})`;
  const formatValue = (value: number) =>
    unit ? `${value.toFixed(2)} ${unit}` : value.toFixed(2);

  return (
    <div className="map-legend">
      <div className="map-legend-title">{title}</div>
      <div className="map-legend-gradient-row">
        <div className="map-legend-gradient" style={{ background: gradient }} />
        <div className="map-legend-labels">
          <span>{formatValue(topValue)}</span>
          <span>{formatValue(bottomValue)}</span>
        </div>
      </div>
    </div>
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

// cells within a layer's range (or outside it, if inverted)
function selectedFilter(layer: Layer): mapboxgl.Expression {
  const value = ["get", layer.key];
  const inRange = [
    "all",
    [">=", value, layer.range[0]],
    ["<=", value, layer.range[1]]
  ];

  return ["all", ["has", layer.key], layer.inverted ? ["!", inRange] : inRange];
}

// ============
//  Popup HTML
// ============
function buildPopupHTML(cell: OpenCell, paramKey: string) {
  const { lngLat, props } = cell;
  const capacity = props[paramKey];

  const depth_m = props.depth_m;
  const wind_speed_m_s = props.wind_speed_m_s;
  const export_cable_km = props.export_cable_km;
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
                <span class="cell-popup-label">Water Depth</span>
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
                <span class="cell-popup-label">Export Cable Length</span>
                <span class="cell-popup-value">${
                  typeof export_cable_km === "number"
                    ? `${export_cable_km.toFixed(2)} km`
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
