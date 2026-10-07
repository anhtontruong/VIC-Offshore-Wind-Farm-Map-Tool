import { useEffect, useRef, useState, type RefObject } from "react";
import mapboxgl from "mapbox-gl";
import heatmapLdGeoJson from "../../../../../heatmap_creation_script/heatmap.ldgeojson?raw";
import rangeJSON from "../../../../../heatmap_creation_script/range.json";
import { useAppContext } from "../../../hooks/useAppContext";
import {
  LANDING_POINT_COLOR,
  LANDING_POINTS,
  LAYER_COLORS,
  LAYER_KEYS
} from "../../../constants/constants";
import {
  MAP_BOUNDS,
  STAR_PATH,
  ldGeoJSONToGeoJSON,
  type MapRef
} from "../mapHelpers";
import { buildLandingPointPopupHTML } from "../popupHtml";

interface UseMapInitArgs {
  mapRef: MapRef;
  mapContainerRef: RefObject<HTMLDivElement | null>;
  paramKeyRef: RefObject<string>;
  syncingRef: RefObject<boolean>;
  popupsRef: RefObject<Record<number, mapboxgl.Popup>>;
  screenId: string;
  gridFillColor: mapboxgl.Expression;
}

/**
 * Map Load: creates this screen's Mapbox map once on mount. Adds the heatmap
 * source and layers, the hover/camera/click listeners and the landing points,
 * and removes the map and its popups on unmount.
 *
 * Returns true once the map has finished loading the heatmap source/layers.
 */
export function useMapInit({
  mapRef,
  mapContainerRef,
  paramKeyRef,
  syncingRef,
  popupsRef,
  screenId,
  gridFillColor
}: UseMapInitArgs) {
  // # Refs
  const hoverPublishedRef = useRef<number | null>(null); // last hover id this screen published
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
    setHoveredCellId,
    setSelectedCellId,
    openCell,
    closeCell
  } = useAppContext();

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      accessToken:
        "pk.eyJ1IjoiYW5odG9udCIsImEiOiJjbXM2c2o4NDIwNWI4MzBvbzMzaGRzNjF5In0.q0dcFpdPMRLIoTuWtWQzKA",
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/standard-satellite",
      center: center,
      zoom: zoom,
      maxBounds: MAP_BOUNDS,
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
          "fill-color": gridFillColor,
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

  return mapLoaded;
}
