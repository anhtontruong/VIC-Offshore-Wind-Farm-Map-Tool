import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css"; // Associated CSS
import { INITIAL_CENTER, INITIAL_ZOOM } from "../constants/constants";
import { useScenarioContext } from "../hooks/useScenarioContext";
import heatmapLdGeoJson from "../../../heatmap_creation_script/heatmap.ldgeojson?raw";

interface MapProps {
  mapRef: React.RefObject<mapboxgl.Map | null>;
  setCenter: React.Dispatch<React.SetStateAction<[number, number]>>;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
}

// ================ //
//     COMPONENT
// ================ //
export default function Map({ mapRef, setCenter, setZoom }: MapProps) {
  // # Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null); // exposes html
  const paramKeyRef = useRef("");

  const { params, getParam } = useScenarioContext();
  const { registerPopup } = useScenarioContext();

  paramKeyRef.current = `${Math.round(getParam(0) * 10)}_${Math.round(
    getParam(1) * 10
  )}_${Math.round(getParam(2) * 10)}`;

  // FILL COLOR
  const GRID_FILL_COLOR = [
    "case",
    [">", ["coalesce", ["get", "0_0_100"], 0], 0],
    "#00ff00",
    "rgba(0,0,0,0)" // transparent or "#fa2828"
  ] satisfies mapboxgl.Expression;

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
      zoom: INITIAL_ZOOM
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

      mapRef.current.addLayer({
        id: "heatmap-fill",
        type: "fill",
        source: "heatmap",
        paint: {
          "fill-color": GRID_FILL_COLOR,
          "fill-opacity": 0.3
        }
      });
    });

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
              <span class="cell-popup-label">Value</span>
              <span class="cell-popup-value">${props[paramKeyRef.current] ?? "N/A"}</span>
            </div>

            <div class="cell-popup-section">
              <div class="cell-popup-section-title">Additional Information</div>

              <div class="cell-popup-row">
                <span class="cell-popup-label">Detail A</span>
                <span class="cell-popup-value">details</span>
              </div>

              <div class="cell-popup-row">
                <span class="cell-popup-label">Detail B</span>
                <span class="cell-popup-value">details</span>
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

  // =====================
  //    Map Slider Update
  // =====================
  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;
    if (!map.getLayer("heatmap-fill")) return;

    map.setPaintProperty("heatmap-fill", "fill-color", GRID_FILL_COLOR);
  }, [params]);

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
