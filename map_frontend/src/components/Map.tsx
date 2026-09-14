import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css"; // Associated CSS
import { INITIAL_CENTER, INITIAL_ZOOM } from "../constants/constants";
import { useScenarioContext, Viewing } from "../hooks/useScenarioContext";
import heatmapLdGeoJson from "../../../heatmap_creation_script/heatmap.ldgeojson?raw";
import rangeJSON from "../../../heatmap_creation_script/range.json";
import { useAppContext } from "../hooks/useAppContext";

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
  const { setCenter, setZoom } = useAppContext();

  const { params, getParam, registerPopup, viewing } = useScenarioContext();

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
      120,
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
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      maxBounds: mapBounds
    });

    // # Listeners
    // HEATMAP
    mapRef.current.on("load", () => {
      if (!mapRef.current) return;

      const heatmap = ldGeoJSONToGeoJSON(heatmapLdGeoJson);

      mapRef.current.addSource("heatmap", {
        type: "geojson",
        data: heatmap
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
    });

    // FOR DEBUGGING
    mapRef.current.on("click", "heatmap-fill", (e) => {
      console.log("clicked");
      const feature = e.features?.[0];

      if (!feature) return;

      console.log((feature as any).properties);
    });

    mapRef.current.on("move", () => {
      if (!mapRef.current) return;

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

        const props = e.feature.properties;

        // Cell Details
        const capacity = props[paramKeyRef.current];

        const depth_m = props.depth_m;
        const wind_speed_m_s = props.wind_speed_m_s;
        const shore_km = props.shore_km;
        const e_w = props.e_w;
        const n_surveys = props.n_surveys;

        // don't show popup if undefined
        if (capacity === undefined) {
          return;
        }

        const popup = new mapboxgl.Popup({
          closeOnClick: false,
          maxWidth: "300px"
        })
          .setLngLat(e.lngLat)
          .setHTML(
            `<div class="cell-popup">
            <div class="cell-popup-header">
              Cell Details
            </div>

            <div class="cell-popup-row">
              <span class="cell-popup-label">Longitude</span>
              <span class="cell-popup-value">${e.lngLat.lng.toFixed(6)}</span>
            </div>

            <div class="cell-popup-row">
              <span class="cell-popup-label">Latitude</span>
              <span class="cell-popup-value">${e.lngLat.lat.toFixed(6)}</span>
            </div>

            <div class="cell-popup-row">
              <span class="cell-popup-label">Installed Capacity</span>
              <span class="cell-popup-value">${
                typeof capacity === "number"
                  ? `${capacity.toFixed(2)} MW`
                  : "Error"
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
          </div>`
          )
          .addTo(mapRef.current);

        registerPopup(popup);

        const popupElement = popup.getElement();
        popupElement?.addEventListener("mousedown", () => {
          const parent = popupElement.parentElement;
          if (parent) {
            parent.appendChild(popupElement);
          }
        });
      }
    });

    return () => {
      mapRef.current?.remove();
    };
  }, []);

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

    // CASE: Viewing Water Depth
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
      <div id="map-container" ref={mapContainerRef} />
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
