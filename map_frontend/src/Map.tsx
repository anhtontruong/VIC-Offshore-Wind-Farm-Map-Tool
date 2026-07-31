import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css"; // Associated CSS

// ================ //
//     CONSTANTS
// ================ //
const INITIAL_CENTER: [number, number] = [144.9122, -38.8368];
const INITIAL_ZOOM: number = 7.45;

// ================ //
//     COMPONENT
// ================ //
export default function Map() {
  // # Refs
  const mapRef = useRef<mapboxgl.Map | null>(null); // persists map instance
  const mapContainerRef = useRef<HTMLDivElement | null>(null); // exposes html

  // # States
  const [center, setCenter] = useState(INITIAL_CENTER);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);

  // # Effects
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      accessToken:
        "pk.eyJ1IjoiYW5odG9udCIsImEiOiJjbXM2c2o4NDIwNWI4MzBvbzMzaGRzNjF5In0.q0dcFpdPMRLIoTuWtWQzKA",
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/standard-satellite",
      center: center,
      zoom: zoom
    });

    // # Listeners
    // HEATMAP
    mapRef.current.on("load", () => {
      if (!mapRef.current) return;

      // TODO: Change off of on load if do scenario exploration sliders
      mapRef.current.addSource("grid-heatmap", {
        type: "vector",
        url: "mapbox://anhtont.d37ftirb2f95"
      });

      mapRef.current.addLayer({
        id: "grid-fill",
        type: "fill",
        source: "grid-heatmap",
        "source-layer": "e72f97beb2a44f25eb86",
        paint: {
          "fill-color": [
            "step",
            ["get", "value"],
            "rgba(0,0,0,0)", // transparent or "#fa2828"
            0.6,
            "#fac000",
            0.8,
            "#78db00"
          ],
          "fill-opacity": 0.3
        }
      });
    });

    mapRef.current.on("click", "grid-fill", (e) => {
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
      target: { layerId: "grid-fill" },
      handler: (e) => {
        if (!e.feature || !mapRef.current || !e.lngLat) return;

        const props = e.feature.properties;

        console.log(e.feature.properties);
        // TODO, reformat tileset so cell details is a object
        new mapboxgl.Popup({ closeOnClick: false })
          .setLngLat(e.lngLat)
          .setHTML(
            `<div>
                <b>Longitude:</b> ${e.lngLat.lng}<br/>
                <b>Latitude:</b> ${e.lngLat.lat}<br/>
                <b>Value:</b> ${props.value}<br/>
                <b>Cell Detail A:</b> ${props["Cell Detail A"]}<br/>
                <b>Cell Detail A:</b> ${props["Cell Detail B"]}<br/>
              </div>`
          )
          .addTo(mapRef.current);
      }
    });

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  // # Helper Functions
  const handleButtonClick = () => {
    mapRef.current?.flyTo({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM
    });
  };

  // # JSX
  return (
    <>
      <div className="sidebar">
        Longitude: {center[0].toFixed(4)}
        {" | "}
        Latitude: {center[1].toFixed(4)}
        {" | "}
        Zoom: {zoom.toFixed(2)}
      </div>

      <button className="reset-button" onClick={handleButtonClick}>
        Reset
      </button>

      {/* map, change CSS for position and size */}
      <div id="map-container" ref={mapContainerRef} />
    </>
  );
}
