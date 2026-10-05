import { useRef, useEffect, useId, useState } from "react";
import mapboxgl from "mapbox-gl";import "mapbox-gl/dist/mapbox-gl.css"; // Associated CSS
import {
  useScenarioContext,
  Viewing,
  type Layer
} from "../hooks/useScenarioContext";
import heatmapLdGeoJson from "../../../heatmap_creation_script/heatmap.ldgeojson?raw";
import rangeJSON from "../../../heatmap_creation_script/range.json";
import { useAppContext, type OpenCell } from "../hooks/useAppContext";
import {
  BIRD_COLORS,
  DEPTH_COLORS,
  LANDING_POINTS,
  LAYER_COLORS,
  LAYER_INFO,
  LAYER_KEYS,
  WIND_COLORS
} from "../constants/constants";

interface MapProps {
  mapRef: React.RefObject<mapboxgl.Map | null>;
}

// # Layer Colours (shared by paint expressions + legend)
const HEATMAP_COLORS = {
  zero: "rgba(255, 0, 0, 0.5)",
  low: "#ffff3d",
  high: "#70ff3c"
};
const HEATMAP_THRESHOLD_MW = 15;

// # Landing Point Star (shared by marker + legend, 24x24 viewBox)
const LANDING_POINT_COLOR = "#facc15";
const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

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
  const screenId = useId(); // identifies this screen as a camera owner
  const hoverPublishedRef = useRef<number | null>(null); // last hover id this screen published
  const prevHoverRef = useRef<number | null>(null); // last hover id this screen applied to feature-state
  const prevSelectedRef = useRef<number | null>(null); // last selected id this screen applied to feature-state
  const popupsRef = useRef<Record<number, mapboxgl.Popup>>({});
  const landingPopupsRef = useRef<mapboxgl.Popup[]>([]); // local to this screen
  const cellCentersRef = useRef<Record<number, [number, number]>>({}); // cell id -> [lng, lat]

  // true once this screen's map has finished loading the heatmap source/layers
  const [mapLoaded, setMapLoaded] = useState(false);

  const {
    center,
    zoom,
    setCenter,
    setZoom,
    cameraOwnerRef,
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

      // cell centres (average of the 4 corners), used as popup anchors
      for (const feature of heatmap.features) {
        const corners: [number, number][] =
          feature.geometry.coordinates[0].slice(0, 4);
        cellCentersRef.current[feature.properties.id] = [
          corners.reduce((sum, corner) => sum + corner[0], 0) / corners.length,
          corners.reduce((sum, corner) => sum + corner[1], 0) / corners.length
        ];
      }

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
    // last screen to start a move owns the camera until another screen claims it
    mapRef.current.on("movestart", () => {
      if (syncingRef.current) return; // we're following, not driving
      cameraOwnerRef.current = screenId;
    });

    mapRef.current.on("move", (e) => {
      if (!mapRef.current) return;
      if (syncingRef.current) return; // this move came from another screen

      // a live drag/wheel (not inertia or a fly) takes the camera back
      if (e.originalEvent && !mapRef.current.isEasing()) {
        cameraOwnerRef.current = screenId;
      }

      // superseded by another screen — leftover inertia must not fight it
      if (cameraOwnerRef.current !== screenId) return;

      // get the current center coords and zoom
      const mapCenter = mapRef.current.getCenter();
      const mapZoom = mapRef.current.getZoom();

      setCenter([mapCenter.lng, mapCenter.lat]);
      setZoom(mapZoom);
    });

    mapRef.current.addInteraction("places-click-interaction", {
      type: "click",
      target: { layerId: "heatmap-fill" },
      handler: (e) => {
        if (!e.feature || !mapRef.current || !e.lngLat) return;

        const props = e.feature.properties as Record<string, any>;
        const id = props.id;

        // clicking a cell with an open popup closes it (on every screen)
        if (popupsRef.current[id]) {
          closeCell(id);
          return;
        }

        // don't open a popup (anywhere) if this screen's weighting has no
        // capacity for the clicked cell — matches the previous behaviour
        if (props[paramKeyRef.current] === undefined) {
          return;
        }

        openCell({
          id,
          lngLat: cellCentersRef.current[id] ?? [e.lngLat.lng, e.lngLat.lat],
          props
        });
        setSelectedCellId(id);
      }
    });

    // ===== LANDING POINTS =====
    for (const point of LANDING_POINTS) {
      const map = mapRef.current;

      const element = document.createElement("div");
      element.className = "landing-point-marker";
      element.innerHTML = `<svg viewBox="0 0 24 24"><path d="${STAR_PATH}" fill="${LANDING_POINT_COLOR}" stroke="#111827" stroke-width="1.5" stroke-linejoin="round" /></svg>`;

      new mapboxgl.Marker({ element }).setLngLat(point.lngLat).addTo(map);

      const popupOptions = {
        closeOnClick: false,
        offset: 14,
        maxWidth: "300px"
      };
      const html = buildLandingPointPopupHTML(point.name);

      // hover: shown while the mouse is over the star
      const hoverPopup = new mapboxgl.Popup({
        ...popupOptions,
        closeButton: false
      })
        .setLngLat(point.lngLat)
        .setHTML(html);

      // click: stays open until closed
      const pinnedPopup = new mapboxgl.Popup(popupOptions)
        .setLngLat(point.lngLat)
        .setHTML(html);

      element.addEventListener("mouseenter", () => {
        if (!pinnedPopup.isOpen()) hoverPopup.addTo(map);
      });
      element.addEventListener("mouseleave", () => hoverPopup.remove());
      element.addEventListener("click", (e) => {
        e.stopPropagation(); // don't also open the cell underneath
        hoverPopup.remove();
        // click again to close
        if (pinnedPopup.isOpen()) pinnedPopup.remove();
        else pinnedPopup.addTo(map);
      });

      landingPopupsRef.current.push(hoverPopup, pinnedPopup);
    }

    return () => {
      // remove any popups this screen created before the map itself goes away
      Object.values(popupsRef.current).forEach((popup) => popup.remove());
      popupsRef.current = {};
      landingPopupsRef.current.forEach((popup) => popup.remove());
      landingPopupsRef.current = [];
      mapRef.current?.remove();
    };
  }, []);

  // =====================
  //   Shared Camera Sync
  // =====================
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // this map is driving — the shared value is our own
    if (cameraOwnerRef.current === screenId) return;

    // jumpTo also stops any leftover inertia/fly on this map
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

    if (viewing === Viewing.Water_Depth) {
      title = "Water Depth";
      unit = "m";
      range = rangeJSON.depth_m as [number, number];
      colors = DEPTH_COLORS;
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
              />
            ))}
          <div className="map-legend">
            <div className="map-legend-row">
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path
                  d={STAR_PATH}
                  fill={LANDING_POINT_COLOR}
                  stroke="#111827"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Landing Point</span>
            </div>
          </div>
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
}

function GradientLegend({
  title,
  unit,
  range,
  colors
}: GradientLegendProps) {
  const [min, max] = range;
  // min on left, max on right
  const gradient = `linear-gradient(to right, ${colors.min}, ${colors.max})`;
  const formatValue = (value: number) =>
    unit ? `${value.toFixed(2)} ${unit}` : value.toFixed(2);

  return (
    <div className="map-legend">
      <div className="map-legend-title">{title}</div>
      <div className="map-legend-gradient-row">
        <div className="map-legend-gradient" style={{ background: gradient }} />
        <div className="map-legend-labels">
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
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

// ===========================
//  Landing Point Popup HTML
// ===========================
function buildLandingPointPopupHTML(name: string) {
  return `<div class="cell-popup">
            <div class="cell-popup-header">${name}</div>
            <div class="cell-popup-row">
              <span class="cell-popup-label">Type</span>
              <span class="cell-popup-value">Landing Point</span>
            </div>
          </div>`;
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
